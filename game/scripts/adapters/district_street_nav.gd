extends RefCounted
## V3.5 multi-district street navigation. Each 225x195m district has its own
## bounded obstacle grid; city-owned adjacent tiles connect by street portals.
## Persisted positions remain the original layout proxy coordinates (10m/unit).
const Layout = preload("res://scripts/core/city_layout_port.gd")
const CELL: float = .25
const SIDE: int = 96
const HALF: float = SIDE*CELL*.5
const MAX_CACHED_TILES: int = 12
var _grids: Dictionary = {}
var _cache_order: Array = []

func clear() -> void:
    _grids.clear()
    _cache_order.clear()

static func _code(tile: Vector2i) -> String:
    return "%d:%d" % [tile.x,tile.y]

static func _origin(city: Dictionary,tile: Vector2i) -> Vector2:
    var core := Vector2i(int(city.get("c",0)),int(city.get("r",0)))
    return Layout.center(city)+Vector2(float(tile.x-core.x)*Layout.TILE_PITCH_X,
        float(tile.y-core.y)*Layout.TILE_PITCH_Z)

static func _cell(city: Dictionary,tile: Vector2i,p: Vector2) -> Vector2i:
    var center: Vector2 = _origin(city,tile)
    return Vector2i(clampi(floori((p.x-center.x+HALF)/CELL),0,SIDE-1),
        clampi(floori((p.y-center.y+HALF)/CELL),0,SIDE-1))

static func _point(city: Dictionary,tile: Vector2i,p: Vector2i) -> Vector2:
    return _origin(city,tile)-Vector2(HALF,HALF)+Vector2((float(p.x)+.5)*CELL,(float(p.y)+.5)*CELL)

static func _nearest(grid: AStarGrid2D,start: Vector2i) -> Vector2i:
    if not grid.is_point_solid(start):
        return start
    for ring in range(1,12):
        for dy in range(-ring,ring+1):
            for dx in range(-ring,ring+1):
                if maxi(absi(dx),absi(dy)) != ring:
                    continue
                var dest: Vector2i = start+Vector2i(dx,dy)
                if grid.is_in_boundsv(dest) and not grid.is_point_solid(dest):
                    return dest
    return start

func _grid(city: Dictionary,tile: Vector2i,landscape,signature: String) -> AStarGrid2D:
    var key: String = "%d:%d:%s" % [tile.x,tile.y,signature]
    if _grids.has(key):
        return _grids[key]
    var grid := AStarGrid2D.new()
    grid.region = Rect2i(0,0,SIDE,SIDE)
    grid.cell_size = Vector2.ONE
    grid.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_NEVER
    grid.default_compute_heuristic = AStarGrid2D.HEURISTIC_MANHATTAN
    grid.default_estimate_heuristic = AStarGrid2D.HEURISTIC_MANHATTAN
    grid.update()
    for b in city.get("buildings",[]):
        if float(b.get("hp",1.0)) <= 0.0 or String(b.get("type","")) in ["field","bridge"]:
            continue
        if not b.has("site_x") or not b.has("site_z"):
            continue
        var position := Vector2(float(b["site_x"]),float(b["site_z"]))
        if Layout.site_tile(city,position) != tile:
            continue
        var shape: Vector2 = Layout.footprint(String(b.get("type","house")))
        var extension: Vector2 = shape*.5+Vector2(.025,.025)
        var lower: Vector2i = _cell(city,tile,position-extension)
        var upper: Vector2i = _cell(city,tile,position+extension)
        for r in range(lower.y,upper.y+1):
            for c in range(lower.x,upper.x+1):
                var node := Vector2i(c,r)
                var world: Vector2 = _point(city,tile,node)
                if absf(world.x-position.x) <= extension.x and absf(world.y-position.y) <= extension.y:
                    grid.set_point_solid(node,true)
    if landscape != null:
        for r in range(SIDE):
            for c in range(SIDE):
                var node := Vector2i(c,r)
                if grid.is_point_solid(node):
                    continue
                var local: Vector2 = (_point(city,tile,node)-_origin(city,tile))*10.0
                if not landscape.walkable_at(tile,local):
                    grid.set_point_solid(node,true)
    _grids[key] = grid
    _cache_order.append(key)
    if _cache_order.size() > MAX_CACHED_TILES:
        _grids.erase(_cache_order.pop_front())
    return grid

func _path_in_tile(city: Dictionary,tile: Vector2i,source: Vector2,target: Vector2,landscape,signature: String) -> Array:
    var grid: AStarGrid2D = _grid(city,tile,landscape,signature)
    var first: Vector2i = _nearest(grid,_cell(city,tile,source))
    var last: Vector2i = _nearest(grid,_cell(city,tile,target))
    if grid.is_point_solid(first) or grid.is_point_solid(last):
        return []
    var nodes: Array[Vector2i] = grid.get_id_path(first,last)
    if nodes.is_empty():
        return []
    var points: Array = [[source.x,source.y]]
    for node in nodes:
        var p: Vector2 = _point(city,tile,node)
        points.append([p.x,p.y])
    points.append([target.x,target.y])
    return points

static func _urban_route(city: Dictionary,first: Vector2i,last: Vector2i) -> Array:
    var owned: Dictionary = {_code(Vector2i(int(city.get("c",0)),int(city.get("r",0)))):true}
    for p in city.get("territory_urban",[]):
        owned[_code(Vector2i(int(p[0]),int(p[1])))] = true
    if not owned.has(_code(first)) or not owned.has(_code(last)):
        return []
    var queue: Array[Vector2i] = [first]
    var parents: Dictionary = {_code(first):Vector2i(-1,-1)}
    var cursor: int = 0
    while cursor < queue.size():
        var cell: Vector2i = queue[cursor]
        cursor += 1
        if cell == last:
            var path: Array = [last]
            var current: Vector2i = last
            while current != first:
                current = parents[_code(current)]
                path.push_front(current)
            return path
        for direction in [Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1)]:
            var next: Vector2i = cell+direction
            var key: String = _code(next)
            if owned.has(key) and not parents.has(key):
                parents[key] = cell
                queue.append(next)
    return []

func route(city: Dictionary,source: Vector2,target: Vector2,landscape = null,signature: String = "") -> Array:
    var start: Vector2i = Layout.site_tile(city,source)
    var end: Vector2i = Layout.site_tile(city,target)
    var tiles: Array = _urban_route(city,start,end)
    if tiles.is_empty():
        return []
    var points: Array = []
    var position: Vector2 = source
    for i in range(tiles.size()):
        var tile: Vector2i = tiles[i]
        var destination: Vector2 = target
        if i+1 < tiles.size():
            var next: Vector2i = tiles[i+1]
            var d: Vector2i = next-tile
            var offset := Vector2(float(d.x)*Layout.TILE_PITCH_X*.5,float(d.y)*Layout.TILE_PITCH_Z*.5)
            # Street portals are just inside the adjoining tile boundaries.
            var portal: Vector2 = offset.normalized()*.4
            destination = _origin(city,tile)+offset-portal
        var part: Array = _path_in_tile(city,tile,position,destination,landscape,signature)
        if part.is_empty():
            return []
        if not points.is_empty():
            part.pop_front()
        points.append_array(part)
        if i+1 < tiles.size():
            var next_center: Vector2 = _origin(city,tiles[i+1])
            var entry: Vector2 = next_center-Vector2(float(tiles[i+1].x-tile.x)*Layout.TILE_PITCH_X*.5,
                float(tiles[i+1].y-tile.y)*Layout.TILE_PITCH_Z*.5)+portal
            points.append([entry.x,entry.y])
            position = entry
    return points
