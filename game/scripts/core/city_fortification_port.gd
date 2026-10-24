extends RefCounted
## V3.6 preview city palisades. These are real, resource-paid persistent
## construction, linked to native V131 siege combat with persisted damage.
const Economy = preload("res://scripts/core/economy_port.gd")
const Layout = preload("res://scripts/core/city_layout_port.gd")
const FIRST_COST: Dictionary = {"wood":65.0,"stone":20.0}
const EXTENSION_COST: Dictionary = {"wood":35.0,"stone":12.0}

static func tile_key(c: int,r: int) -> String:
    return "%d:%d" % [c,r]

static func fortified(city: Dictionary,tile: Vector2i) -> bool:
    var fort: Dictionary = city.get("fortification",{})
    for record in fort.get("tiles",[]):
        if int(record[0]) == tile.x and int(record[1]) == tile.y:
            return true
    return false

static func exposed_sides(city: Dictionary,tile: Vector2i) -> Array:
    if not fortified(city,tile):
        return []
    var sides: Array = []
    for key in ["west","east","north","south"]:
        var neighbor: Vector2i = {
            "west":Vector2i.LEFT,"east":Vector2i.RIGHT,
            "north":Vector2i.UP,"south":Vector2i.DOWN}[key]
        if not fortified(city,tile+neighbor):
            sides.append(key)
    return sides

static func perimeter_edges(city: Dictionary) -> Array:
    var tiles: Array = city.get("fortification",{}).get("tiles",[])
    var ordered: Array = tiles.duplicate(true)
    ordered.sort_custom(func(a,b):
        return int(a[1]) < int(b[1]) if int(a[1]) != int(b[1]) else int(a[0]) < int(b[0]))
    var result: Array = []
    for point in ordered:
        var tile := Vector2i(int(point[0]),int(point[1]))
        for side in exposed_sides(city,tile):
            result.append({"c":tile.x,"r":tile.y,"side":side})
    return result

static func exposed_corner(city: Dictionary,tile: Vector2i,xsign: int,zsign: int) -> bool:
    if not fortified(city,tile):
        return false
    var sides: Array = exposed_sides(city,tile)
    return sides.has("west" if xsign < 0 else "east") or sides.has("north" if zsign < 0 else "south")

static func developed_tiles(city: Dictionary) -> Array:
    var home := Vector2i(int(city.get("c",0)),int(city.get("r",0)))
    var claims: Dictionary = {tile_key(home.x,home.y):true}
    var allowed: Dictionary = {}
    for record in city.get("territory_urban",[]):
        allowed[tile_key(int(record[0]),int(record[1]))] = true
    var candidates: Array = [home]
    for b in city.get("buildings",[]):
        if not bool(b.get("ready",false)) or float(b.get("hp",1.0)) <= 0.0:
            continue
        if not b.has("site_x") or not b.has("site_z"):
            continue
        var tile: Vector2i = Layout.site_tile(city,Vector2(float(b["site_x"]),float(b["site_z"])))
        var key: String = tile_key(tile.x,tile.y)
        if claims.has(key) or not allowed.has(key):
            continue
        claims[key] = true
        candidates.append(tile)
    candidates.sort_custom(func(a: Vector2i,b: Vector2i):
        var da: int = (a.x-home.x)*(a.x-home.x)+(a.y-home.y)*(a.y-home.y)
        var db: int = (b.x-home.x)*(b.x-home.x)+(b.y-home.y)*(b.y-home.y)
        return da < db if da != db else (a.y < b.y if a.y != b.y else a.x < b.x))
    return candidates

static func next_site(city: Dictionary) -> Dictionary:
    if int(city.get("age",0)) < 1:
        return {"ok":false,"reason":"Puitvall avaneb pronksiajal"}
    if int(city.get("pop",3)) < 14:
        return {"ok":false,"reason":"Puitvalli jaoks on vaja vähemalt 14 elanikku"}
    var existing: Dictionary = city.get("fortification",{})
    var cost: Dictionary = EXTENSION_COST if not existing.get("tiles",[]).is_empty() else FIRST_COST
    for tile in developed_tiles(city):
        if fortified(city,tile):
            continue
        if not Economy.can_afford(city.get("resources",{}),cost):
            return {"ok":false,"reason":"Müüri jaoks ei jätku puitu või kivi","cost":cost}
        return {"ok":true,"tile":tile,"cost":cost}
    return {"ok":false,"reason":"Kõik arendatud linnaruudud on juba piiratud valliga"}

static func build_next(city: Dictionary) -> Dictionary:
    var available: Dictionary = next_site(city)
    if not bool(available.get("ok",false)):
        return available
    Economy.spend_resources(city["resources"],available["cost"])
    if not city.has("fortification"):
        city["fortification"] = {"style":"palisade","tiles":[]}
    var tile: Vector2i = available["tile"]
    city["fortification"]["tiles"].append([tile.x,tile.y])
    return {"ok":true,"reason":"Linnavall rajatud ruudule %d,%d" % [tile.x,tile.y],
        "tile":[tile.x,tile.y],"cost":available["cost"]}

static func segment_hp(city: Dictionary,tile: Vector2i,index: int,maximum: float = 420.0) -> float:
    var fort: Dictionary = city.get("fortification",{})
    var key: String = "%d:%d:%d" % [tile.x,tile.y,index]
    return clampf(float(fort.get("integrity",{}).get(key,maximum)),0.0,maximum)

static func gate_is_open(city: Dictionary,tile: Vector2i) -> bool:
    if not fortified(city,tile):
        return false
    var fort: Dictionary = city.get("fortification",{})
    return bool(fort.get("gates_open",{}).get(tile_key(tile.x,tile.y),false))

static func set_gate(city: Dictionary,tile: Vector2i,opened: bool) -> bool:
    if not fortified(city,tile):
        return false
    var fort: Dictionary = city["fortification"]
    # A destroyed gate cannot be shut until it is repaired.
    if not opened and segment_hp(city,tile,4,500.0) <= .0001:
        return false
    if not fort.has("gates_open"):
        fort["gates_open"] = {}
    fort["gates_open"][tile_key(tile.x,tile.y)] = opened
    return true

static func apply_siege_damage(city: Dictionary,siege: Dictionary) -> bool:
    # Battle has its own mutable section data. Copy back after termination so
    # the next attack cannot magically restore every segment to full strength.
    if not bool(siege.get("linked_city",false)):
        return false
    var tile := Vector2i(int(siege.get("city_c",-1)),int(siege.get("city_r",-1)))
    if int(siege.get("city_team",-1)) != int(city.get("team",-2)) or not fortified(city,tile):
        return false
    var fort: Dictionary = city["fortification"]
    if not fort.has("integrity"):
        fort["integrity"] = {}
    var changed: bool = false
    for section in siege.get("sections",[]):
        var key: String = String(section.get("source_key",""))
        var prefix: String = "%d:%d:" % [tile.x,tile.y]
        if not key.begins_with(prefix):
            continue
        var maximum: float = maxf(1.0,float(section.get("max_hp",420.0)))
        var hp: float = clampf(float(section.get("hp",maximum)),0.0,maximum)
        fort["integrity"][key] = hp
        changed = true
    if bool(siege.get("gate_open",false)):
        set_gate(city,tile,true)
        changed = true
    fort["last_battle_breaches"] = int(siege.get("breaches",0))
    fort["last_battle_captured"] = bool(siege.get("captured",false))
    return changed
