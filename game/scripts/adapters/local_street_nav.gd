extends RefCounted
## V131 navigation.js-inspired LOCAL path adapter. Godot owns path search
## (AStarGrid2D). Town-specific occupancy comes from proxy building footprints.
## Preview coords are atlas-scaled, not V131 full detail-map metres.
## Four-connected routing avoids diagonal corner cutting.
const Cargo = preload("res://scripts/core/cargo_port.gd")
const CityLayout = preload("res://scripts/core/city_layout_port.gd")
const CELL: float = 0.25
const SIDE: int = 96
const HALF: float = SIDE * CELL * 0.5

var landscape = null
var cached: Dictionary = {}
var grid_builds: int = 0
var requests: int = 0
var hits: int = 0
var failures: int = 0

func clear() -> void:
    cached.clear()

func _key(city: Dictionary) -> String:
    return "%s:%s:%s" % [str(city.get("team",0)),str(city.get("c",0)),str(city.get("r",0))]

func signature(city: Dictionary) -> String:
    var pieces: PackedStringArray = PackedStringArray()
    CityLayout.ensure_positions(city)
    for b in city.get("buildings",[]):
        pieces.append("%s:%d:%d:%.3f:%.3f" % [String(b.get("type","")),int(bool(b.get("ready",false))),int(float(b.get("hp",0.0)) > 0.0),float(b.get("site_x",0.0)),float(b.get("site_z",0.0))])
    return "|".join(pieces)+(":height9" if landscape != null else "")

func entry_position(city: Dictionary, index: int) -> Vector2:
    var buildings: Array = city.get("buildings",[])
    if index < 0 or index >= buildings.size():
        return Cargo.building_position(city,0)
    var b: Dictionary = buildings[index]
    var shape: Vector2 = CityLayout.footprint(String(b.get("type","")))
    return Cargo.building_position(city,index) + Vector2(0.0,shape.y * 0.5 + 0.18)

func _point(city: Dictionary, cell: Vector2i) -> Vector2:
    return Vector2(float(city.get("c",0)) + 0.5 - HALF + (float(cell.x)+.5)*CELL,
        float(city.get("r",0)) + 0.5 - HALF + (float(cell.y)+.5)*CELL)

func _cell(city: Dictionary, p: Vector2) -> Vector2i:
    var center := Vector2(float(city.get("c",0))+.5,float(city.get("r",0))+.5)
    return Vector2i(clampi(int(floor((p.x-center.x+HALF)/CELL)),0,SIDE-1),
        clampi(int(floor((p.y-center.y+HALF)/CELL)),0,SIDE-1))

func _ensure(city: Dictionary) -> AStarGrid2D:
    var key: String = _key(city)
    var sig: String = signature(city)
    if cached.has(key) and String(cached[key]["signature"]) == sig:
        return cached[key]["grid"]
    var g := AStarGrid2D.new()
    g.region = Rect2i(0,0,SIDE,SIDE)
    g.cell_size = Vector2.ONE
    g.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_NEVER
    g.default_compute_heuristic = AStarGrid2D.HEURISTIC_MANHATTAN
    g.default_estimate_heuristic = AStarGrid2D.HEURISTIC_MANHATTAN
    g.update()
    # Block the whole building footprint plus a small safety margin. The door
    # is outside the exclusion rectangle, not at the building centre.
    var buildings: Array = city.get("buildings",[])
    for i in range(buildings.size()):
        var b: Dictionary = buildings[i]
        if float(b.get("hp",0.0)) <= 0.0 or String(b.get("type","")) in ["field","bridge"]:
            continue
        var p: Vector2 = Cargo.building_position(city,i)
        var size: Vector2 = CityLayout.footprint(String(b.get("type","")))
        var ext: Vector2 = size * .5 + Vector2(.025,.025)
        var lo: Vector2i = _cell(city,p-ext)
        var hi: Vector2i = _cell(city,p+ext)
        for z in range(lo.y,hi.y+1):
            for x in range(lo.x,hi.x+1):
                var cell := Vector2i(x,z)
                var world: Vector2 = _point(city,cell)
                if absf(world.x-p.x) <= ext.x and absf(world.y-p.y) <= ext.y:
                    g.set_point_solid(cell,true)
    # The in-town A* shares the same 9x9 height samples, rivers and cliffs
    # as the 3D view. Preview-town coordinates are 10x smaller than detail.
    if landscape != null:
        var tile := Vector2i(int(city.get("c",0)),int(city.get("r",0)))
        for z in range(SIDE):
            for x in range(SIDE):
                var local: Vector2 = (_point(city,Vector2i(x,z))-CityLayout.center(city))*10.0
                if not landscape.walkable_at(tile,local):
                    g.set_point_solid(Vector2i(x,z),true)
    cached[key] = {"grid":g,"signature":sig,"routes":{}}
    grid_builds += 1
    return g

func _nearest_free(grid: AStarGrid2D, p: Vector2i) -> Vector2i:
    if not grid.is_point_solid(p):
        return p
    for radius in range(1,9):
        var best := Vector2i(-1,-1)
        var best_dist := 999999
        for dz in range(-radius,radius+1):
            for dx in range(-radius,radius+1):
                if maxi(absi(dx),absi(dz)) != radius:
                    continue
                var q: Vector2i = p + Vector2i(dx,dz)
                if not grid.is_in_boundsv(q) or grid.is_point_solid(q):
                    continue
                var d: int = absi(dx) + absi(dz)
                if d < best_dist:
                    best_dist = d
                    best = q
        if best.x >= 0:
            return best
    return p

func route(city: Dictionary, from_index: int, to_index: int) -> Array:
    requests += 1
    var grid: AStarGrid2D = _ensure(city)
    var id: String = "%d:%d" % [from_index,to_index]
    var record: Dictionary = cached[_key(city)]
    if record["routes"].has(id):
        hits += 1
        return record["routes"][id].duplicate(true)
    var start: Vector2 = entry_position(city,from_index)
    var finish: Vector2 = entry_position(city,to_index)
    var a: Vector2i = _nearest_free(grid,_cell(city,start))
    var b: Vector2i = _nearest_free(grid,_cell(city,finish))
    if grid.is_point_solid(a) or grid.is_point_solid(b):
        failures += 1
        return []
    var cells: Array[Vector2i] = grid.get_id_path(a,b)
    if cells.is_empty():
        failures += 1
        return []
    var result: Array = [[start.x,start.y]]
    for p in cells:
        var world: Vector2 = _point(city,p)
        result.append([world.x,world.y])
    result.append([finish.x,finish.y])
    record["routes"][id] = result.duplicate(true)
    return result

func route_from_position(city: Dictionary, current: Vector2, to_index: int) -> Array:
    requests += 1
    var grid: AStarGrid2D = _ensure(city)
    var destination: Vector2 = entry_position(city,to_index)
    var a: Vector2i = _nearest_free(grid,_cell(city,current))
    var b: Vector2i = _nearest_free(grid,_cell(city,destination))
    if grid.is_point_solid(a) or grid.is_point_solid(b):
        failures += 1
        return []
    var cells: Array[Vector2i] = grid.get_id_path(a,b)
    if cells.is_empty():
        failures += 1
        return []
    var result: Array = [[current.x,current.y]]
    for cell in cells:
        var world: Vector2 = _point(city,cell)
        result.append([world.x,world.y])
    result.append([destination.x,destination.y])
    return result

func path_points_are_clear(city: Dictionary, points: Array) -> bool:
    # Verifies that internal grid waypoints (apart from endpoint doors) never
    # overlap another proxy building footprint.
    var grid: AStarGrid2D = _ensure(city)
    for i in range(1,points.size()-1):
        var v: Array = points[i]
        if grid.is_point_solid(_cell(city,Vector2(float(v[0]),float(v[1])))):
            return false
    return true
