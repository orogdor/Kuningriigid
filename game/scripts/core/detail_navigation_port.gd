extends RefCounted
## Godot-native fine navigation inside 225x195 detail tiles. This is a
## deliberately simplified geometric proxy for V131 navigation.js, NOT the
## original river/road atlas. Per-tile grids and per-edge routes are cached.
const COLS: int = 220
const ROWS: int = 165
const GRID_X: int = 45
const GRID_Z: int = 39
const STEP: float = 5.0
const WIDTH: float = 225.0
const DEPTH: float = 195.0
const Cargo = preload("res://scripts/core/cargo_port.gd")
const SharedLandscape = preload("res://scripts/core/shared_landscape_v131.gd")
var landscape = null
var heights: PackedFloat32Array = PackedFloat32Array()
var towns: Array = []
var water_crossings: Dictionary = {}
var grids: Dictionary = {}
var edge_routes: Dictionary = {}
var searches: int = 0
var cached_edges: int = 0
var rejected_edges: int = 0
var revision: int = 0

func configure(source_heights: PackedFloat32Array,source_towns: Array,bridges: Dictionary = {},source_landscape = null) -> void:
    heights = source_heights
    towns = source_towns
    water_crossings = bridges
    landscape = source_landscape
    grids.clear()
    edge_routes.clear()
    revision += 1

func _key(tile: Vector2i) -> String:
    return "%d:%d" % [tile.x,tile.y]

func _land_height(tile: Vector2i,pos: Vector2) -> float:
    if landscape != null:
        return landscape.detail_height(tile,pos)
    return SharedLandscape.height_at(heights,tile,pos)

func _water(tile: Vector2i,pos: Vector2) -> bool:
    var info: Dictionary = water_crossings.get(_key(tile),{})
    if info.has("axis"):
        var axis: String = String(info.get("axis","x"))
        var across: float = pos.x if axis == "x" else pos.y
        var along: float = pos.y if axis == "x" else pos.x
        var half_width: float = float(info.get("width",5.0))
        if absf(across-float(info.get("coord",0.0))) <= half_width:
            if bool(info.get("bridge",false)) and absf(along-float(info.get("bridge_at",0.0))) <= float(info.get("bridge_width",4.0)):
                return false
            return true
    # The visible generated river and the navigation use identical geometry.
    if landscape != null and landscape.blocked_by_river(tile,pos,2.6):
        return true
    if landscape != null:
        return not landscape.height_grid.traversable(tile,pos)
    return SharedLandscape.ocean_or_cliff(_land_height(tile,pos))

func _local(tile: Vector2i,p: Vector2i) -> Vector2:
    return Vector2(-110.0+float(p.x)*STEP,-95.0+float(p.y)*STEP)

func _grid_id(pos: Vector2) -> Vector2i:
    return Vector2i(clampi(roundi((pos.x+110.0)/STEP),0,GRID_X-1),clampi(roundi((pos.y+95.0)/STEP),0,GRID_Z-1))

func _obstacles(tile: Vector2i) -> Array:
    var footprints: Array = []
    for city in towns:
        if int(city.get("c",-1)) == tile.x and int(city.get("r",-1)) == tile.y:
            var buildings: Array = city.get("buildings",[])
            for i in range(buildings.size()):
                var b: Dictionary = buildings[i]
                if float(b.get("hp",0.0)) <= 0.0:
                    continue
                var absolute: Vector2 = Cargo.building_position(city,i)
                var local: Vector2 = (absolute-Vector2(float(tile.x)+.5,float(tile.y)+.5))*10.0
                footprints.append({"pos":local,"radius":6.5 if String(b.get("type","")) == "hall" else 5.0})
        var sites: Array = []
        for item in city.get("county_worksites",[]):
            if int(item.get("c",-1)) == tile.x and int(item.get("r",-1)) == tile.y and float(item.get("hp",0.0)) > 0.0:
                sites.append(item)
        for i in range(sites.size()):
            footprints.append({"pos":Vector2(float(i%3-1)*13.0,float(int(i/3))*14.0-6.0),"radius":7.0})
    return footprints

func _grid(tile: Vector2i) -> AStarGrid2D:
    var code: String = _key(tile)
    if grids.has(code):
        return grids[code]
    var grid := AStarGrid2D.new()
    grid.region = Rect2i(Vector2i.ZERO,Vector2i(GRID_X,GRID_Z))
    grid.cell_size = Vector2(STEP,STEP)
    grid.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_NEVER
    grid.update()
    var obstacles: Array = _obstacles(tile)
    for z in range(GRID_Z):
        for x in range(GRID_X):
            var loc: Vector2 = _local(tile,Vector2i(x,z))
            var solid: bool = _water(tile,loc)
            if not solid:
                for footprint in obstacles:
                    if loc.distance_to(footprint["pos"]) < float(footprint["radius"])+1.2:
                        solid = true
                        break
            if solid:
                grid.set_point_solid(Vector2i(x,z))
    grids[code] = grid
    return grid

func _closest_free(grid: AStarGrid2D,point: Vector2i) -> Vector2i:
    if not grid.is_point_solid(point):
        return point
    for radius in range(1,12):
        for dz in range(-radius,radius+1):
            for dx in range(-radius,radius+1):
                if maxi(absi(dx),absi(dz)) != radius:
                    continue
                var p: Vector2i = point+Vector2i(dx,dz)
                if p.x>=0 and p.x<GRID_X and p.y>=0 and p.y<GRID_Z and not grid.is_point_solid(p):
                    return p
    return Vector2i(-1,-1)

func _trace(tile: Vector2i,from: Vector2,to: Vector2) -> Array:
    var grid: AStarGrid2D = _grid(tile)
    # Buildings have doors near their blocked centres; water has no such door.
    # Never 'snap' a starting point across a river onto the opposite bank.
    if _water(tile,from) or _water(tile,to):
        return []
    var start: Vector2i = _closest_free(grid,_grid_id(from))
    var goal: Vector2i = _closest_free(grid,_grid_id(to))
    if start.x < 0 or goal.x < 0:
        return []
    var path: Array = grid.get_id_path(start,goal)
    if path.is_empty():
        return []
    var result: Array = []
    for id in path:
        result.append(_local(tile,id))
    return result

func _atlas(tile: Vector2i,local: Vector2) -> Array:
    return [float(tile.x)+.5+local.x/WIDTH,float(tile.y)+.5+local.y/DEPTH]

func edge(a: Vector2i,b: Vector2i) -> Dictionary:
    var key: String = "%d:%d>%d:%d" % [a.x,a.y,b.x,b.y]
    if edge_routes.has(key):
        cached_edges += 1
        return edge_routes[key]
    searches += 1
    if absi(a.x-b.x)+absi(a.y-b.y) != 1:
        return {"ok":false,"points":[],"length":0.0}
    var side: Vector2i = b-a
    var first_target: Vector2 = Vector2(float(side.x)*110.0,float(side.y)*95.0)
    var second_start: Vector2 = -first_target
    var first: Array = _trace(a,Vector2.ZERO,first_target)
    var second: Array = _trace(b,second_start,Vector2.ZERO)
    if first.is_empty() or second.is_empty():
        rejected_edges += 1
        var rejected: Dictionary = {"ok":false,"points":[],"length":0.0}
        edge_routes[key] = rejected
        return rejected
    var points: Array = [[float(a.x)+.5,float(a.y)+.5]]
    for local in first:
        points.append(_atlas(a,local))
    # The same exact point is shared by the two adjacent detail tiles.
    points.append([float(a.x)+.5+float(side.x)*.5,float(a.y)+.5+float(side.y)*.5])
    for local in second:
        points.append(_atlas(b,local))
    # Always end at the actual next world tile centre (even when occupied).
    points.append([float(b.x)+.5,float(b.y)+.5])
    var distance: float = 0.0
    for i in range(1,points.size()):
        var from_point: Vector2 = Vector2(float(points[i-1][0]),float(points[i-1][1]))
        var to_point: Vector2 = Vector2(float(points[i][0]),float(points[i][1]))
        distance += from_point.distance_to(to_point)
    var result: Dictionary = {"ok":true,"points":points,"length":distance}
    edge_routes[key] = result
    return result

static func sample_track(points: Array,alpha: float) -> Vector2:
    if points.is_empty():
        return Vector2.ZERO
    if points.size() == 1:
        return Vector2(float(points[0][0]),float(points[0][1]))
    var lengths: Array = []
    var total: float = 0.0
    for i in range(1,points.size()):
        var a: Vector2 = Vector2(float(points[i-1][0]),float(points[i-1][1]))
        var b: Vector2 = Vector2(float(points[i][0]),float(points[i][1]))
        var step: float = a.distance_to(b)
        lengths.append(step)
        total += step
    var remaining: float = clampf(alpha,0.0,1.0)*total
    for i in range(lengths.size()):
        if remaining <= float(lengths[i]) or i == lengths.size()-1:
            var a: Vector2 = Vector2(float(points[i][0]),float(points[i][1]))
            var b: Vector2 = Vector2(float(points[i+1][0]),float(points[i+1][1]))
            return a.lerp(b,remaining/maxf(.00001,float(lengths[i])))
        remaining -= float(lengths[i])
    return Vector2(float(points[-1][0]),float(points[-1][1]))
