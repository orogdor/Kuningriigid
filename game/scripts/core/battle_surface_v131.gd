extends RefCounted
## V2.9 limited battlefield terrain: battle coordinates -32..32/-25..25
## sample the same V131-style 9x9 detail heights as the selected world tile.
## All state is plain JSON-serializable data (also survives old-save migrations).
const COLS: int = 33
const ROWS: int = 26
const STEP: float = 2.0
const HALF_X: float = 32.0
const HALF_Z: float = 25.0
const SEA: float = .075
const CLIFF: float = 2.27
const MAX_EDGE_SLOPE: float = .52
const RIVER_EXTRA: float = .65

static func make(samples: PackedFloat32Array, parts: Array = [], crossing: Dictionary = {}, obstacles: Array = []) -> Dictionary:
    if samples.size() != 81:
        return {}
    var data: Dictionary = {"version":29,"samples":[],"rivers":[],"bridge":crossing.duplicate(true),"obstacles":obstacles.duplicate(true),"walk":[],"routes":0,"blocked_moves":0}
    for h in samples:
        data["samples"].append(float(h))
    # Clip rivers to the battle rectangle; coordinates already in battle metres.
    for part in parts:
        data["rivers"].append({"ax":float(part.get("ax",0.0)),"az":float(part.get("az",0.0)),"bx":float(part.get("bx",0.0)),"bz":float(part.get("bz",0.0)),"width":float(part.get("width",2.0))})
    for z in range(ROWS):
        for x in range(COLS):
            var p := Vector2(-HALF_X+float(x)*STEP,-HALF_Z+float(z)*STEP)
            data["walk"].append(1 if ground_open(data,p.x,p.y,.33) else 0)
    return data

# The full V131 battle area is 3x3 DETAIL tiles, 675x585 metres.
# A fourth/fifth tile ring is a retreat destination, not playable ground.
const LARGE_HALF_X: float = 337.5
const LARGE_HALF_Z: float = 292.5
const LARGE_STEP: float = 7.5

static func half_x(data: Dictionary) -> float:
    return float(data.get("half_x",HALF_X))

static func half_z(data: Dictionary) -> float:
    return float(data.get("half_z",HALF_Z))

static func make_large(tiles: Dictionary, parts: Array = [], crossings: Array = [], obstacles: Array = []) -> Dictionary:
    if tiles.size() != 9:
        return {}
    for dz in range(-1,2):
        for dx in range(-1,2):
            var key: String = "%d:%d" % [dx,dz]
            if not tiles.has(key) or (tiles[key] as Array).size()!=81:
                return {}
    var out: Dictionary = {"version":30,"large_field":true,"tiles":tiles.duplicate(true),"rivers":parts.duplicate(true),"bridges":crossings.duplicate(true),"obstacles":obstacles.duplicate(true),"half_x":LARGE_HALF_X,"half_z":LARGE_HALF_Z,"grid_step":LARGE_STEP,"grid_cols":91,"grid_rows":79,"walk":[],"routes":0,"blocked_moves":0}
    for z in range(79):
        for x in range(91):
            var px: float = -LARGE_HALF_X+float(x)*LARGE_STEP
            var pz: float = -LARGE_HALF_Z+float(z)*LARGE_STEP
            out["walk"].append(1 if ground_open(out,px,pz,.34) else 0)
    return out

static func absolute_height(data: Dictionary, x: float,z: float) -> float:
    var samples: Array = data.get("samples",[])
    var local_x: float = x
    var local_z: float = z
    var width: float = HALF_X*2.0
    var depth: float = HALF_Z*2.0
    if bool(data.get("large_field",false)):
        var dx: int = clampi(floori((x+LARGE_HALF_X)/225.0),0,2)-1
        var dz: int = clampi(floori((z+LARGE_HALF_Z)/195.0),0,2)-1
        samples = data.get("tiles",{}).get("%d:%d" % [dx,dz],[])
        local_x = x-float(dx)*225.0
        local_z = z-float(dz)*195.0
        width = 225.0
        depth = 195.0
    if samples.size() != 81:
        return 0.0
    # V131 world-details.js: exactly the 9x9 bilinear interpolation.
    var u: float = clampf((local_x/width+.5)*8.0,0.0,8.0)
    var v: float = clampf((local_z/depth+.5)*8.0,0.0,8.0)
    var col: int = mini(7,floori(u))
    var row: int = mini(7,floori(v))
    var fx: float = u-float(col)
    var fz: float = v-float(row)
    return lerpf(lerpf(float(samples[row*9+col]),float(samples[row*9+col+1]),fx),lerpf(float(samples[(row+1)*9+col]),float(samples[(row+1)*9+col+1]),fx),fz)

static func height(data: Dictionary,x: float,z: float) -> float:
    if data.is_empty():
        return 0.0
    return absolute_height(data,x,z)-absolute_height(data,0,0)

static func _distance_to_segment(p: Vector2,a: Vector2,b: Vector2) -> float:
    var delta: Vector2 = b-a
    var t: float = clampf((p-a).dot(delta)/maxf(.0001,delta.length_squared()),0.0,1.0)
    return p.distance_to(a+delta*t)

static func river_blocked(data: Dictionary,x: float,z: float,margin: float = 0.0) -> bool:
    var point := Vector2(x,z)
    for segment in data.get("rivers",[]):
        var d: float = _distance_to_segment(point,Vector2(float(segment["ax"]),float(segment["az"])),Vector2(float(segment["bx"]),float(segment["bz"])))
        if d > float(segment["width"])*.5+margin:
            continue
        var crossings: Array = data.get("bridges",[]) if bool(data.get("large_field",false)) else [data.get("bridge",{})]
        for bridge in crossings:
            if bool(bridge.get("open",false)):
                var center := Vector2(float(bridge.get("x",0.0)),float(bridge.get("z",0.0)))
                if point.distance_to(center)<=float(bridge.get("radius",3.0)):
                    return false
        return true
    return false

static func ground_open(data: Dictionary,x: float,z: float,radius: float = .34) -> bool:
    if data.is_empty():
        return true # Existing 2.8 test battles load without surface.
    if absf(x)>half_x(data) or absf(z)>half_z(data):
        return true # V131 retreat ring is outside the combat rectangle.
    var h: float = absolute_height(data,x,z)
    if h < SEA or h > CLIFF:
        return false
    if river_blocked(data,x,z,radius+RIVER_EXTRA):
        return false
    for obstacle in data.get("obstacles",[]):
        var dx: float = x-float(obstacle.get("x",0.0))
        var dz: float = z-float(obstacle.get("z",0.0))
        var gap: float = radius+float(obstacle.get("radius",1.0))+.1
        if dx*dx+dz*dz < gap*gap:
            return false
    var d: float = maxf(1.0,radius*2.0)
    for direction in [Vector2(1,0),Vector2(-1,0),Vector2(0,1),Vector2(0,-1)]:
        var xx: float = clampf(x+direction.x*d,-half_x(data),half_x(data))
        var zz: float = clampf(z+direction.y*d,-half_z(data),half_z(data))
        if absf(absolute_height(data,xx,zz)-h)/d>MAX_EDGE_SLOPE:
            return false
    return true

static func edge_open(data: Dictionary,from: Vector2,to: Vector2,radius: float = .34) -> bool:
    if data.is_empty():
        return true
    var distance: float = from.distance_to(to)
    var segments: int = maxi(1,ceili(distance/1.3))
    var previous: float = absolute_height(data,from.x,from.y)
    for i in range(1,segments+1):
        var p: Vector2 = from.lerp(to,float(i)/float(segments))
        if not ground_open(data,p.x,p.y,radius):
            return false
        var h: float = absolute_height(data,p.x,p.y)
        if absf(h-previous) / maxf(.01,distance/float(segments)) > MAX_EDGE_SLOPE:
            return false
        previous = h
    return true

static func grid_cols(data: Dictionary) -> int:
    return int(data.get("grid_cols",COLS))

static func grid_rows(data: Dictionary) -> int:
    return int(data.get("grid_rows",ROWS))

static func grid_step(data: Dictionary) -> float:
    return float(data.get("grid_step",STEP))

static func _cell(data: Dictionary,p: Vector2) -> Vector2i:
    return Vector2i(clampi(roundi((p.x+half_x(data))/grid_step(data)),0,grid_cols(data)-1),clampi(roundi((p.y+half_z(data))/grid_step(data)),0,grid_rows(data)-1))

static func _point(data: Dictionary,p: Vector2i) -> Vector2:
    return Vector2(-half_x(data)+float(p.x)*grid_step(data),-half_z(data)+float(p.y)*grid_step(data))

static func _find_open(data: Dictionary,at: Vector2i) -> Vector2i:
    var walk: Array = data.get("walk",[])
    var width: int = grid_cols(data)
    var depth: int = grid_rows(data)
    for ring in range(12):
        for dz in range(-ring,ring+1):
            for dx in range(-ring,ring+1):
                var col: int = at.x+dx
                var row: int = at.y+dz
                if col >= 0 and row >= 0 and col < width and row < depth and int(walk[row*width+col]) == 1:
                    return Vector2i(col,row)
    return Vector2i(-1,-1)

static func nearest_open(data: Dictionary,position: Vector2) -> Vector2:
    # Do not snap an already safe formation to a 7.5m nav cell:
    # doing so would stack 24 individual bodies into the same location.
    if ground_open(data,position.x,position.y,.34):
        return position
    var node: Vector2i = _find_open(data,_cell(data,position))
    if node.x<0:
        return Vector2(INF,INF)
    return _point(data,node)

static func route(data: Dictionary,from: Vector2,to: Vector2) -> Array:
    if data.is_empty():
        return [{"x":to.x,"z":to.y}]
    var walk: Array = data.get("walk",[])
    var width: int = grid_cols(data)
    var depth: int = grid_rows(data)
    if walk.size()!=width*depth:
        return []
    var a: Vector2i = _find_open(data,_cell(data,from))
    var b: Vector2i = _find_open(data,_cell(data,to))
    if a.x<0 or b.x<0:
        return []
    var start: int = a.y*width+a.x
    var goal: int = b.y*width+b.x
    var queue: Array[int] = [start]
    var parent := PackedInt32Array()
    parent.resize(width*depth)
    parent.fill(-2)
    parent[start] = -1
    var head: int = 0
    while head < queue.size() and parent[goal] == -2:
        var here: int = queue[head]
        head += 1
        var x: int = here%width
        var z: int = int(here/width)
        for dir in [Vector2i(1,0),Vector2i(0,1),Vector2i(-1,0),Vector2i(0,-1)]:
            var nx: int = x+dir.x
            var nz: int = z+dir.y
            if nx<0 or nz<0 or nx>=width or nz>=depth:
                continue
            var target: int = nz*width+nx
            if parent[target] != -2 or int(walk[target]) == 0:
                continue
            if not edge_open(data,_point(data,Vector2i(x,z)),_point(data,Vector2i(nx,nz))):
                continue
            parent[target] = here
            queue.append(target)
    if parent[goal] == -2:
        return []
    var result: Array = []
    var current: int = goal
    while current != start and current>=0:
        result.push_front(_point(data,Vector2i(current%width,int(current/width))))
        current = parent[current]
    var final_point: Vector2 = from
    if not result.is_empty():
        final_point = result.back()
    if edge_open(data,final_point,to):
        result.append(to)
    var serialized: Array = []
    for point in result:
        serialized.append({"x":point.x,"z":point.y})
    return serialized

static func line_of_sight(data: Dictionary,a: Vector2,b: Vector2,source_height: float = 1.4,target_height: float = 1.4) -> bool:
    if data.is_empty():
        return true
    var count: int = maxi(2,ceili(a.distance_to(b)/1.5))
    var from_y: float = absolute_height(data,a.x,a.y)+source_height
    var to_y: float = absolute_height(data,b.x,b.y)+target_height
    for i in range(1,count):
        var fraction: float = float(i)/float(count)
        var point: Vector2 = a.lerp(b,fraction)
        if absolute_height(data,point.x,point.y)+.15 > lerpf(from_y,to_y,fraction):
            return false
    return true

static func speed_factor(data: Dictionary,a: Vector2,b: Vector2) -> float:
    if data.is_empty():
        return 1.0
    var d: float = maxf(.001,a.distance_to(b))
    var rise: float = absolute_height(data,b.x,b.y)-absolute_height(data,a.x,a.y)
    return clampf(1.0-maxf(0.0,rise/d)*.6,.55,1.0)
