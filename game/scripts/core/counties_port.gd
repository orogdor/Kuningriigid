extends RefCounted
## V131 counties-v126.js: footprint, area cap, urban-first priority and city spacing.
const MIN_CITY_SPACING: int = 17
const COUNTY_BUILDING_LIMIT: int = 3
const COLS: int = 220
const ROWS: int = 165

static func county_tile_limit(radius: int) -> int:
    return 3 * (2 * radius + 1) * (2 * radius + 1)

static func county_search_radius(radius: int) -> int:
    return int(ceil((sqrt(3.0) * float(2 * radius + 1) - 1.0) / 2.0))

static func urban_tile(city: Dictionary, p: Vector2i, radius: int) -> bool:
    return maxi(absi(p.x - int(city["c"])), absi(p.y - int(city["r"]))) <= radius

static func city_spacing_allowed(p: Vector2i, city_list: Array) -> bool:
    for city in city_list:
        if maxi(absi(int(city["c"]) - p.x), absi(int(city["r"]) - p.y)) < MIN_CITY_SPACING:
            return false
    return true

static func county_footprint(city: Dictionary, radius: int, land: PackedByteArray) -> Array:
    # 'land' means above water, not walkable; mountains can be claimed.
    var cx: int = int(city["c"])
    var cr: int = int(city["r"])
    var span := county_search_radius(radius)
    var queue: Array[Vector2i] = [Vector2i(cx, cr)]
    var seen: Dictionary = {}
    var tiles: Array = []
    var i: int = 0
    while i < queue.size():
        var p: Vector2i = queue[i]
        i += 1
        if maxi(absi(p.x - cx), absi(p.y - cr)) > span:
            continue
        var key: String = "%d:%d" % [p.x, p.y]
        if seen.has(key):
            continue
        seen[key] = true
        if p.x < 0 or p.x >= COLS or p.y < 0 or p.y >= ROWS:
            continue
        tiles.append(p)
        if land.size() <= p.y * COLS + p.x or land[p.y * COLS + p.x] == 0:
            continue
        queue.append(p + Vector2i(1,0))
        queue.append(p + Vector2i(-1,0))
        queue.append(p + Vector2i(0,1))
        queue.append(p + Vector2i(0,-1))
    tiles.sort_custom(func(a: Vector2i, b: Vector2i) -> bool:
        var a_urban: bool = urban_tile(city, a, radius)
        var b_urban: bool = urban_tile(city, b, radius)
        if a_urban != b_urban:
            return a_urban
        var a_d: int = (a.x - cx) * (a.x - cx) + (a.y - cr) * (a.y - cr)
        var b_d: int = (b.x - cx) * (b.x - cx) + (b.y - cr) * (b.y - cr)
        if a_d != b_d:
            return a_d < b_d
        if a.y != b.y:
            return a.y < b.y
        return a.x < b.x
    )
    tiles.resize(mini(tiles.size(), county_tile_limit(radius)))
    return tiles

static func county_build_rule(number_of_buildings: int, allowed_type: bool) -> String:
    if not allowed_type:
        return "Maakonnas saab ehitada ainult maa tootmis- ja taristuhooneid."
    if number_of_buildings >= COUNTY_BUILDING_LIMIT:
        return "Maakonnaruudul võib olla kuni 3 hoonet (ka pooleliolevad)."
    return ""
