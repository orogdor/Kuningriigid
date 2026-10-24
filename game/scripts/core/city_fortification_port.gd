extends RefCounted
## V3.6 preview city palisades. These are real, resource-paid persistent
## construction, but NOT yet siege colliders, damage, gates or battle defense.
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
