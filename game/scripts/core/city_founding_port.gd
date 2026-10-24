extends RefCounted
## V4.2 first playable expansion. Founding spends real parent-city goods
## and transfers 3 residents. The path is a connected LAND route: no sea
## teleports, no rival town cores, and no free instantly-created resources.
const Campaign = preload("res://scripts/core/campaign_port.gd")
const Territory = preload("res://scripts/core/territory_port.gd")
const Economy = preload("res://scripts/core/economy_port.gd")
const LAYOUT = preload("res://scripts/core/city_layout_port.gd")
const FOUNDING_COST: Dictionary = {"wood":55.0,"stone":16.0,"bread":18.0,"water":12.0}
const SUPPLIES: Dictionary = {"wood":25.0,"stone":8.0,"bread":10.0,"water":12.0}
const SETTLERS: int = 3
const CITY_SPACING: int = 17
const MAX_LAND_DISTANCE: int = 40
const MAX_TEAM_CITIES: int = 15

static func valid_site(state: Dictionary,land: PackedByteArray,loc: Vector2i) -> Dictionary:
    if land.size() != Campaign.COLS*Campaign.ROWS:
        return {"ok":false,"reason":"Maailmakaardi maastikuandmed puuduvad"}
    if loc.x < 1 or loc.y < 1 or loc.x >= Campaign.COLS-1 or loc.y >= Campaign.ROWS-1:
        return {"ok":false,"reason":"Linn ei mahu kaardi servale"}
    if land[Campaign.index(loc.x,loc.y)] == 0:
        return {"ok":false,"reason":"Linna ei saa rajada merre"}
    if Territory.owner_at(state,loc.x,loc.y) >= 0:
        return {"ok":false,"reason":"Ruut kuulub juba teise linna territooriumi"}
    for town in state.get("cities",[]):
        var gap: int = maxi(absi(int(town["c"])-loc.x),absi(int(town["r"])-loc.y))
        if gap < CITY_SPACING:
            return {"ok":false,"reason":"Linnad peavad olema vähemalt 17 ruudu kaugusel"}
    return {"ok":true}

static func choose_parent(state: Dictionary,land: PackedByteArray,team: int,loc: Vector2i) -> Dictionary:
    var site: Dictionary = valid_site(state,land,loc)
    if not bool(site.get("ok",false)):
        return site
    var team_info: Dictionary = state.get("teams",{}).get(team,{})
    if not bool(team_info.get("known",{}).get("settlement",false)):
        return {"ok":false,"reason":"Avasta kõigepealt asunduste rajamine"}
    var own: int = 0
    var supply_sources: Array = []
    for index in range(state.get("cities",[]).size()):
        var city: Dictionary = state["cities"][index]
        if int(city.get("team",-1)) != team:
            continue
        own += 1
        if int(city.get("pop",0)) < SETTLERS+3:
            continue
        if not Economy.can_afford(city.get("resources",{}),FOUNDING_COST):
            continue
        var origin := Vector2i(int(city["c"]),int(city["r"]))
        var distance: int = absi(origin.x-loc.x)+absi(origin.y-loc.y)
        if distance > MAX_LAND_DISTANCE:
            continue
        var route: Array = Campaign.find_path(land,origin,loc)
        if route.is_empty() or route.size() > MAX_LAND_DISTANCE:
            continue
        supply_sources.append({"index":index,"length":route.size(),"path":route})
    if own >= MAX_TEAM_CITIES:
        return {"ok":false,"reason":"Riigil on selle kampaania linnapiir täis"}
    if supply_sources.is_empty():
        return {"ok":false,"reason":"Vaja on 6 elanikuga varustatud linna ja kuni 40 ruudu pikkust maismaateed"}
    supply_sources.sort_custom(func(a,b):
        return int(a["length"]) < int(b["length"]) if int(a["length"]) != int(b["length"]) else int(a["index"]) < int(b["index"]))
    return {"ok":true,"parent_index":int(supply_sources[0]["index"]),"route":supply_sources[0]["path"]}

static func found(state: Dictionary,land: PackedByteArray,team: int,loc: Vector2i) -> Dictionary:
    var selected: Dictionary = choose_parent(state,land,team,loc)
    if not bool(selected.get("ok",false)):
        return selected
    var parent: Dictionary = state["cities"][int(selected["parent_index"])]
    var new_id: int = 0
    for old in state["cities"]:
        new_id = maxi(new_id,int(old.get("id",-1))+1)
    # All checks above are read-only; deduct only after route/site validated.
    Economy.spend_resources(parent["resources"],FOUNDING_COST)
    parent["pop"] = int(parent["pop"])-SETTLERS
    var stock: Dictionary = Economy.start_resources()
    for key in stock:
        stock[key] = float(SUPPLIES.get(key,0.0))
    var next_index: int = state["cities"].size()
    var city: Dictionary = {
        "id":new_id,"team":team,"c":loc.x,"r":loc.y,
        "name":"Asundus %d" % new_id,"pop":SETTLERS,"age":int(state["teams"][team].get("age",0)),
        "resources":stock,
        "buildings":[{"type":"hall","ready":true,"hp":1200.0,"efficiency":1.0}],
        "growthProgress":0.0,"shortageTurns":0,"cargo":[],
        "citizens":{},"county_worksites":[],"training":[]}
    LAYOUT.ensure_positions(city)
    state["cities"].append(city)
    state["territory_source"] = ""
    state["revision"] = int(state.get("revision",0))+1
    state["founded_cities"] = int(state.get("founded_cities",0))+1
    if not state.has("founding_log"):
        state["founding_log"] = []
    state["founding_log"].append({"id":new_id,"team":team,"c":loc.x,"r":loc.y,
        "parent_id":int(parent["id"]),"route_length":selected["route"].size(),
        "turn":int(state.get("campaign",{}).get("turn",0))})
    return {"ok":true,"index":next_index,"id":new_id,"reason":"Asutatud %s (%d,%d). %d elanikku kolis uude linna." % [
        str(city["name"]),loc.x,loc.y,SETTLERS]}

static func nearest_candidate(state: Dictionary,land: PackedByteArray,team: int) -> Dictionary:
    # Economical deterministic AI expansion: test a small valid ring
    # around each sufficiently supplied parent, no planet-wide scans.
    var choices: Array = []
    for city in state.get("cities",[]):
        if int(city.get("team",-1)) != team:
            continue
        var home := Vector2i(int(city["c"]),int(city["r"]))
        for dx in [-19,-17,0,17,19]:
            for dy in [-19,-17,0,17,19]:
                if dx == 0 and dy == 0:
                    continue
                var p: Vector2i = home+Vector2i(dx,dy)
                if p.x < 1 or p.y < 1 or p.x >= Campaign.COLS-1 or p.y >= Campaign.ROWS-1:
                    continue
                if land[Campaign.index(p.x,p.y)] == 0:
                    continue
                if not bool(valid_site(state,land,p).get("ok",false)):
                    continue
                choices.append(p)
    for loc in choices:
        if bool(choose_parent(state,land,team,loc).get("ok",false)):
            return {"ok":true,"tile":loc}
    return {"ok":false}
