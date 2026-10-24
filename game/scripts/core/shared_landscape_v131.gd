extends RefCounted
## Shared atlas sampling + deterministic river polylines for the V131 Godot
## partial port. The WORLD HEIGHTS ARE STILL PROXY DATA, not the baked V131
## map. All visual/navigation consumers share these exact generated segments.
const COLS: int = 220
const ROWS: int = 165
const TILE_X: float = 225.0
const TILE_Z: float = 195.0
const DetailHeights = preload("res://scripts/core/detail_heights_v131.gd")
var height_grid = DetailHeights.new()
var heights: PackedFloat32Array = PackedFloat32Array()
var segments: Array = []
var segments_by_tile: Dictionary = {}
var bridge_sites: Dictionary = {}
var revision: int = 0

static func source_height(samples: PackedFloat32Array,c: int,r: int) -> float:
    if samples.size() != COLS*ROWS:
        return 0.0
    return samples[clampi(r,0,ROWS-1)*COLS+clampi(c,0,COLS-1)]*.52

static func height_at(samples: PackedFloat32Array,tile: Vector2i,local: Vector2) -> float:
    var gx: float = float(tile.x)+.5+local.x/TILE_X
    var gz: float = float(tile.y)+.5+local.y/TILE_Z
    var c0: int = floori(gx-.5)
    var r0: int = floori(gz-.5)
    var fx: float = clampf(gx-float(c0)-.5,0.0,1.0)
    var fz: float = clampf(gz-float(r0)-.5,0.0,1.0)
    return lerpf(lerpf(source_height(samples,c0,r0),source_height(samples,c0+1,r0),fx),lerpf(source_height(samples,c0,r0+1),source_height(samples,c0+1,r0+1),fx),fz)

static func ocean_or_cliff(height: float) -> bool:
    return height < .075 or height > 2.27

static func atlas_to_detail(tile: Vector2i,atlas: Vector2) -> Vector2:
    return Vector2((atlas.x-float(tile.x)-.5)*TILE_X,(atlas.y-float(tile.y)-.5)*TILE_Z)

static func detail_to_atlas(tile: Vector2i,local: Vector2) -> Vector2:
    return Vector2(float(tile.x)+.5+local.x/TILE_X,float(tile.y)+.5+local.y/TILE_Z)

static func _key(tile: Vector2i) -> String:
    return "%d:%d" % [tile.x,tile.y]

func configure(samples: PackedFloat32Array) -> void:
    heights = samples
    height_grid.configure(samples)
    segments.clear()
    segments_by_tile.clear()
    bridge_sites.clear()
    var used: Dictionary = {}
    # Deterministic downhill rivers. Sparse sources avoid a river at every
    # cell. All cell-centre points are GLOBAL atlas coordinates, never
    # independently generated for each detail tile.
    for r in range(12,ROWS-10,18):
        for c in range(12,COLS-10,23):
            if (c*7+r*11)%5 > 2 or _raw(c,r)<1.5:
                continue
            var current := Vector2i(c,r)
            var visited: Dictionary = {}
            for step in range(92):
                var id: String = _key(current)
                if visited.has(id):
                    break
                visited[id] = true
                if _raw(current.x,current.y) <= 0.0:
                    break
                var best: Vector2i = current
                var lowest: float = _raw(current.x,current.y)
                for direction in [Vector2i(0,1),Vector2i(1,0),Vector2i(-1,0),Vector2i(0,-1)]:
                    var next: Vector2i = current+direction
                    if next.x<1 or next.y<1 or next.x>=COLS-1 or next.y>=ROWS-1:
                        continue
                    var h: float = _raw(next.x,next.y)
                    if h < lowest-.015:
                        lowest = h
                        best = next
                if best == current:
                    break
                var edge_key: String = "%d:%d-%d:%d" % [mini(current.x,best.x),mini(current.y,best.y),maxi(current.x,best.x),maxi(current.y,best.y)]
                if not used.has(edge_key):
                    used[edge_key] = true
                    var a: Vector2 = Vector2(current)+Vector2(.5,.5)
                    var b: Vector2 = Vector2(best)+Vector2(.5,.5)
                    var item: Dictionary = {"a":a,"b":b,"width":5.4+float((c+r+step)%4)*.75}
                    segments.append(item)
                    for tile in [current,best]:
                        var code: String = _key(tile)
                        if not segments_by_tile.has(code):
                            segments_by_tile[code] = []
                        segments_by_tile[code].append(item)
                current = best
    revision += 1


func configure_baked(samples: PackedFloat32Array,downstream: PackedInt32Array,widths: PackedFloat32Array,fords: PackedByteArray) -> void:
    heights = samples
    height_grid.configure(samples)
    segments.clear()
    segments_by_tile.clear()
    bridge_sites.clear()
    if downstream.size() != COLS*ROWS or widths.size() != COLS*ROWS or fords.size() != COLS*ROWS:
        push_error("V131 atlas drainage arrays have wrong sizes")
        return
    for i in range(COLS*ROWS):
        var next: int = downstream[i]
        if next < 0 or next >= COLS*ROWS:
            continue
        var c: int = i%COLS
        var r: int = int(i/COLS)
        var end := Vector2i(next%COLS,int(next/COLS))
        var a := Vector2(float(c)+.5,float(r)+.5)
        var b := Vector2(float(end.x)+.5,float(end.y)+.5)
        # V131 landscape-shared.js: canonical curved segment with exact
        # endpoints, materialized once and reused in BOTH map projections.
        var nx: float = -(b.y-a.y)
        var nz: float = b.x-a.x
        var turn: float = _v131_noise(c*31+405,r*23+11)-.5
        var arc: float = minf(7.0,50.0*.12)*turn*2.0
        var previous: Vector2 = a
        for step in range(1,11):
            var fraction: float = float(step)/10.0
            var bend: float = sin(PI*fraction)*arc+sin(2.0*PI*fraction)*arc*.25
            var next_point: Vector2 = a.lerp(b,fraction)+Vector2(nx,nz)*bend/50.0
            var item: Dictionary = {"a":previous,"b":next_point,"width":maxf(2.15,float(widths[i]))*(1.0+.1*fraction)}
            segments.append(item)
            for tile in [Vector2i(floori(previous.x),floori(previous.y)),Vector2i(floori(next_point.x),floori(next_point.y))]:
                if tile.x<0 or tile.x>=COLS or tile.y<0 or tile.y>=ROWS:
                    continue
                var code: String = _key(tile)
                if not segments_by_tile.has(code):
                    segments_by_tile[code] = []
                segments_by_tile[code].append(item)
            previous = next_point
        if int(fords[i])==1:
            var crossing: Vector2 = a
            var tile := Vector2i(c,r)
            var local: Vector2 = atlas_to_detail(tile,crossing)
            bridge_sites[_key(tile)] = {"x":local.x,"z":local.y,"open":true,"radius":maxf(7.5,float(widths[i])*1.25),"natural_ford":true}
    revision += 1


static func v131_road_curve(a: Vector2i,b: Vector2i,count: int = 8) -> Array:
    # landscape-shared.js roadCurve: canonical endpoint order and seed noise.
    if a.y*COLS+a.x > b.y*COLS+b.x:
        var temp := a
        a = b
        b = temp
    var aa := Vector2(float(a.x)+.5,float(a.y)+.5)
    var bb := Vector2(float(b.x)+.5,float(b.y)+.5)
    var delta: Vector2 = bb-aa
    var normal: Vector2 = delta.normalized().orthogonal()
    var offset: float = _v131_noise(float(a.x*7+b.x),float(a.y*7+b.y))*2.0/50.0
    var points: Array = []
    for i in range(count+1):
        var t: float = float(i)/float(count)
        points.append(aa.lerp(bb,t)+normal*sin(t*PI)*offset)
    return points

static func _v131_noise(x: float,z: float) -> float:
    var value: float = sin(x*127.1+z*311.7+131.0*.017)*43758.5453
    return value-floor(value)

func _raw(c: int,r: int) -> float:
    if heights.size() != COLS*ROWS:
        return 0.0
    return heights[clampi(r,0,ROWS-1)*COLS+clampi(c,0,COLS-1)]

static func _clip_segment(a: Vector2,b: Vector2) -> Array:
    # Liang-Barsky bounds shared by rendering and collision.
    var lo: float = 0.0
    var hi: float = 1.0
    var delta: Vector2 = b-a
    for item in [[-delta.x,a.x+TILE_X*.5],[delta.x,TILE_X*.5-a.x],[-delta.y,a.y+TILE_Z*.5],[delta.y,TILE_Z*.5-a.y]]:
        var p: float = float(item[0])
        var q: float = float(item[1])
        if absf(p)<.000001:
            if q<0.0:
                return []
        else:
            var value: float = q/p
            if p<0.0:
                lo = maxf(lo,value)
            else:
                hi = minf(hi,value)
            if lo>hi:
                return []
    return [a+delta*lo,a+delta*hi]

func segments_for(tile: Vector2i) -> Array:
    var out: Array = []
    for item in segments_by_tile.get(_key(tile),[]):
        var a: Vector2 = atlas_to_detail(tile,item["a"])
        var b: Vector2 = atlas_to_detail(tile,item["b"])
        var clipped: Array = _clip_segment(a,b)
        if clipped.size()==2 and clipped[0].distance_to(clipped[1])>.0001:
            out.append({"a":clipped[0],"b":clipped[1],"width":float(item["width"])})
    return out

func river_distance(tile: Vector2i,local: Vector2) -> float:
    var nearest: float = INF
    for item in segments_for(tile):
        var a: Vector2 = item["a"]
        var ab: Vector2 = item["b"]-a
        var t: float = clampf((local-a).dot(ab)/maxf(.000001,ab.length_squared()),0.0,1.0)
        nearest = minf(nearest,local.distance_to(a+ab*t)-float(item["width"])*.5)
    return nearest

func first_river_tile() -> Vector2i:
    for item in segments:
        var a: Vector2 = item["a"]
        var p := Vector2i(floori(a.x),floori(a.y))
        if not ocean_or_cliff(source_height(heights,p.x,p.y)) and segments_for(p).size()>0:
            return p
    return Vector2i(-1,-1)

func suggested_bridge(tile: Vector2i) -> Vector2:
    var parts: Array = segments_for(tile)
    if parts.is_empty():
        return Vector2.ZERO
    var first: Dictionary = parts[0]
    return (first["a"]+first["b"])*.5

func blocked_by_river(tile: Vector2i,local: Vector2,margin: float = 0.0) -> bool:
    if river_distance(tile,local)>margin:
        return false
    var site: Dictionary = bridge_sites.get(_key(tile),{})
    if bool(site.get("open",false)):
        var point := Vector2(float(site.get("x",0.0)),float(site.get("z",0.0)))
        if local.distance_to(point)<=float(site.get("radius",7.5)):
            return false
    return true

func set_bridge(tile: Vector2i,point: Vector2,open: bool) -> void:
    bridge_sites[_key(tile)] = {"x":point.x,"z":point.y,"open":open,"radius":7.5}
    revision += 1

func detail_height(tile: Vector2i,local: Vector2) -> float:
    return height_grid.height(tile,local)

func detail_samples(tile: Vector2i) -> PackedFloat32Array:
    return height_grid.samples_for(tile)

func walkable_at(tile: Vector2i,local: Vector2) -> bool:
    return height_grid.traversable(tile,local) and not blocked_by_river(tile,local,2.6)

func buildable_at(tile: Vector2i,local: Vector2,radius: float = 4.0) -> bool:
    if not height_grid.buildable(tile,local,radius):
        return false
    for point in [local,local+Vector2(radius,0),local-Vector2(radius,0),local+Vector2(0,radius),local-Vector2(0,radius)]:
        if blocked_by_river(tile,point,1.2):
            return false
    return true
