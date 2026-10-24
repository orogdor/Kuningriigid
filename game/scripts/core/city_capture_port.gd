extends RefCounted
## V3.8 guarded conquest: city ownership changes only after an actual,
## linked siege's keep has been occupied. Does not transfer ownership for
## isolated test fixtures or a simple field-battle victory.
const Fort = preload("res://scripts/core/city_fortification_port.gd")

static func capture_after_siege(state: Dictionary,siege: Dictionary) -> Dictionary:
    if not bool(siege.get("linked_city",false)) or not bool(siege.get("captured",false)):
        return {"ok":false,"reason":"No captured linked city"}
    var attacker: int = int(siege.get("attacker_team",-1))
    var defender: int = int(siege.get("defender_team",-1))
    if attacker < 0 or attacker == defender:
        return {"ok":false,"reason":"Invalid attacker"}
    var teams: Dictionary = state.get("teams",{})
    if not teams.has(attacker) and not teams.has(str(attacker)):
        return {"ok":false,"reason":"Attacking faction missing"}
    var home_c: int = int(siege.get("city_home_c",siege.get("city_c",-999)))
    var home_r: int = int(siege.get("city_home_r",siege.get("city_r",-999)))
    var cell := Vector2i(int(siege.get("city_c",-999)),int(siege.get("city_r",-999)))
    for city in state.get("cities",[]):
        if int(city.get("c",-999)) != home_c or int(city.get("r",-999)) != home_r:
            continue
        # Some preview test states contain two opposing cities at the same
        # coordinates. Select the real DEFENDER, not the first coordinate hit.
        if int(city.get("team",-2)) != defender or not Fort.fortified(city,cell):
            continue
        if int(siege.get("city_id",-1)) >= 0 and int(city.get("id",-1)) != int(siege["city_id"]):
            continue
        city["team"] = attacker
        # Research and technology belong to the new state, not the old nation.
        var new_team: Dictionary = teams.get(attacker,teams.get(str(attacker),{}))
        city["age"] = int(new_team.get("age",city.get("age",0)))
        # Unfinished training belonged to the former owner's military.
        city["training"] = []
        city["captured_from_team"] = defender
        city["captured_at"] = float(state.get("seconds",0.0))
        city["captures"] = int(city.get("captures",0))+1
        state["territory_source"] = "" # next rebuild includes new allegiance
        state["revision"] = int(state.get("revision",0))+1
        state["city_captures"] = int(state.get("city_captures",0))+1
        var record: Dictionary = {"city_id":int(city.get("id",-1)),
            "c":home_c,"r":home_r,"battle_c":cell.x,"battle_r":cell.y,
            "from":defender,"to":attacker,"time":float(state.get("seconds",0.0))}
        if not state.has("conquests"):
            state["conquests"] = []
        state["conquests"].append(record)
        return {"ok":true,"city":String(city.get("name","Linn")),"from":defender,"to":attacker,"record":record}
    return {"ok":false,"reason":"Captured city not found"}
