extends RefCounted
## V131 world-grid BFS, with runtime-only cache for city-to-city routes.
## This tests ROAD transport only. Ships/railways/merchant relay stops require
## separate V131 transport layers and are NOT simulated here.
const Campaign = preload("res://scripts/core/campaign_port.gd")
const DetailNavigation = preload("res://scripts/core/detail_navigation_port.gd")
var fine_navigation = DetailNavigation.new()
# The atlas route planner can be used before the high-resolution terrain loads.
var detail_ready: bool = false
var terrain: PackedByteArray = PackedByteArray()
var cache: Dictionary = {}
var searches: int = 0
var hits: int = 0
var unreachable: int = 0

func configure(passable: PackedByteArray) -> void:
    terrain = passable.duplicate()
    detail_ready = false
    cache.clear()
    searches = 0
    hits = 0
    unreachable = 0

func clear() -> void:
    cache.clear()

func route(from: Dictionary, to: Dictionary) -> Array:
    var a := Vector2i(int(from.get("c",-1)),int(from.get("r",-1)))
    var b := Vector2i(int(to.get("c",-1)),int(to.get("r",-1)))
    var code: String = "%d:%d>%d:%d" % [a.x,a.y,b.x,b.y]
    if cache.has(code):
        hits += 1
        return (cache[code] as Array).duplicate(true)
    if terrain.size() != Campaign.COLS*Campaign.ROWS:
        unreachable += 1
        return []
    if a.x < 0 or a.y < 0 or a.x >= Campaign.COLS or a.y >= Campaign.ROWS:
        return []
    if terrain[Campaign.index(a.x,a.y)] == 0:
        unreachable += 1
        return []
    searches += 1
    var points: Array = Campaign.find_path(terrain,a,b)
    if points.is_empty() and a != b:
        unreachable += 1
        cache[code] = []
        return []
    var saved: Array = []
    for p in points:
        saved.append([p.x,p.y])
    cache[code] = saved
    return saved.duplicate(true)

func is_open(p: Vector2i) -> bool:
    if p.x < 0 or p.y < 0 or p.x >= Campaign.COLS or p.y >= Campaign.ROWS:
        return false
    return terrain.size() == Campaign.COLS*Campaign.ROWS and terrain[Campaign.index(p.x,p.y)] != 0

func configure_detail(heights: PackedFloat32Array,towns: Array,crossings: Dictionary = {},landscape = null) -> void:
    # Runtime-only navigation cache: no large grid data in saved games.
    fine_navigation.configure(heights,towns,crossings,landscape)
    detail_ready = true

func detail_edge(a: Vector2i,b: Vector2i) -> Dictionary:
    if not detail_ready:
        # Before detail terrain is configured, preserve legal one-tile atlas
        # movement. Once configured, fine_navigation.edge() has full authority
        # to reject steep slopes, rivers and impassable detail crossings.
        var adjacent: bool = absi(a.x-b.x)+absi(a.y-b.y) == 1
        return {"ok":adjacent and is_open(a) and is_open(b),"length":1.0,"points":[]}
    return fine_navigation.edge(a,b)

func detail_version() -> int:
    return fine_navigation.revision if detail_ready else 0
