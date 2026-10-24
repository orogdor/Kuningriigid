extends RefCounted
## V131 world-details.js inspired 9x9 per-tile height cache.
## Original sample sites (i/8-.5)*50 are preserved. Heights are derived
## from the baked 2.7 atlas centre heights, not original raw JS saved details.
## Godot scene-height multiplier .52 is deliberately retained for parity
## with the previous world renderer (NOT bitwise V131 detail-bake parity).
const COLS: int = 220
const ROWS: int = 165
const N: int = 9
const WIDTH: float = 225.0
const DEPTH: float = 195.0
const MAX_CACHE: int = 64
const DISPLAY_TO_SCENE: float = .52
const SEA_LIMIT: float = .075
const CLIFF_LIMIT: float = 2.27
const MAX_BUILD_SLOPE: float = .24
const MAX_WALK_SLOPE: float = .34
var world_heights: PackedFloat32Array = PackedFloat32Array()
var _tiles: Dictionary = {}
var _order: Array = []
var generated_tiles: int = 0
var cache_hits: int = 0

func configure(heights: PackedFloat32Array) -> void:
    world_heights = heights
    _tiles.clear()
    _order.clear()
    generated_tiles = 0
    cache_hits = 0

func _world(c: int,r: int) -> float:
    if c<0 or r<0 or c>=COLS or r>=ROWS or world_heights.size()!=COLS*ROWS:
        return -2.0
    return world_heights[r*COLS+c]

func _sample_world(gx: float,gz: float) -> float:
    # Same V131 civilization-core atlasHeight interpolation over cell centres.
    var fx: float = gx-.5
    var fz: float = gz-.5
    var c: int = floori(fx)
    var r: int = floori(fz)
    var u: float = fx-float(c)
    var v: float = fz-float(r)
    u = u*u*(3.0-2.0*u)
    v = v*v*(3.0-2.0*v)
    var a: float = _world(c,r)
    var b: float = _world(c+1,r)
    var d: float = _world(c,r+1)
    var e: float = _world(c+1,r+1)
    return lerpf(lerpf(a,b,u),lerpf(d,e,u),v)*DISPLAY_TO_SCENE

static func key(tile: Vector2i) -> String:
    return "%d:%d" % [tile.x,tile.y]

func samples_for(tile: Vector2i) -> PackedFloat32Array:
    var code: String = key(tile)
    if _tiles.has(code):
        cache_hits += 1
        return _tiles[code]
    var samples := PackedFloat32Array()
    samples.resize(N*N)
    for j in range(N):
        for i in range(N):
            # In original V131, each step is 50/8 atlas metres; 225x195
            # detail-space corresponds to 50x50 world metres.
            var gx: float = float(tile.x)+(float(i)/8.0)
            var gz: float = float(tile.y)+(float(j)/8.0)
            samples[j*N+i] = snappedf(_sample_world(gx,gz),.001)
    if _order.size() >= MAX_CACHE:
        var oldest: String = String(_order.pop_front())
        _tiles.erase(oldest)
    _order.append(code)
    _tiles[code] = samples
    generated_tiles += 1
    return samples

static func interpolate(samples: PackedFloat32Array,local: Vector2) -> float:
    if samples.size()!=N*N:
        return 0.0
    var fx: float = clampf((local.x/WIDTH+.5)*8.0,0.0,8.0)
    var fz: float = clampf((local.y/DEPTH+.5)*8.0,0.0,8.0)
    var col: int = mini(7,floori(fx))
    var row: int = mini(7,floori(fz))
    var u: float = fx-float(col)
    var v: float = fz-float(row)
    return lerpf(lerpf(samples[row*9+col],samples[row*9+col+1],u),lerpf(samples[(row+1)*9+col],samples[(row+1)*9+col+1],u),v)

func height(tile: Vector2i,local: Vector2) -> float:
    return interpolate(samples_for(tile),local)

func slope(tile: Vector2i,local: Vector2,offset: float = 3.0) -> float:
    var west: float = height(tile,local-Vector2(offset,0))
    var east: float = height(tile,local+Vector2(offset,0))
    var north: float = height(tile,local-Vector2(0,offset))
    var south: float = height(tile,local+Vector2(0,offset))
    return maxf(absf(east-west),absf(south-north))/(offset*2.0)

func traversable(tile: Vector2i,local: Vector2) -> bool:
    var h: float = height(tile,local)
    return h>=SEA_LIMIT and h<=CLIFF_LIMIT and slope(tile,local)<=MAX_WALK_SLOPE

func buildable(tile: Vector2i,local: Vector2,radius: float = 4.0) -> bool:
    # Check the entire lot, not only its centre. The new construction
    # footprint must be dry, below the cliff threshold and reasonably flat.
    for point in [local,local+Vector2(radius,0),local-Vector2(radius,0),local+Vector2(0,radius),local-Vector2(0,radius),local+Vector2(radius*.7,radius*.7),local-Vector2(radius*.7,radius*.7),local+Vector2(radius*.7,-radius*.7),local-Vector2(radius*.7,-radius*.7)]:
        var h: float = height(tile,point)
        if h<SEA_LIMIT or h>CLIFF_LIMIT or slope(tile,point)>MAX_BUILD_SLOPE:
            return false
    return true
