extends RefCounted
## Campaign settlers are persistent, physically moving map units.
## One turn moves three adjacent LAND squares (not teleportation).
## Costs and passengers are debited at dispatch, not at settlement.
const Founding = preload("res://scripts/core/city_founding_port.gd")
const Territory = preload("res://scripts/core/territory_port.gd")
const Campaign = preload("res://scripts/core/campaign_port.gd")
const STEP_PER_TURN: int = 3
const AI_EXPAND_INTERVAL: int = 8
const AI_FIRST_TURN: int = 8

static func missions(state: Dictionary) -> Array:
    return state.get("settler_missions",[])

static func dispatch(state: Dictionary,land: PackedByteArray,team: int,destination: Vector2i) -> Dictionary:
    var result: Dictionary = Founding.choose_parent(state,land,team,destination)
    if not bool(result.get("ok",false)):
        return result
    for pending in missions(state):
        if int(pending.get("team",-1)) == team and int(pending.get("to_c",-1)) == destination.x and int(pending.get("to_r",-1)) == destination.y:
            return {"ok":false,"reason":"Sellesse ruutu on juba asutaja teel"}
    var parent: Dictionary = state["cities"][int(result["parent_index"])]
    # Deduct before movement. Only use this source when all constraints hold.
    Founding.Economy.spend_resources(parent["resources"],Founding.FOUNDING_COST)
    parent["pop"] = int(parent["pop"])-Founding.SETTLERS
    var route: Array = []
    for cell in result["route"]:
        route.append([int(cell.x),int(cell.y)])
    var id: int = int(state.get("next_settler_id",1))
    state["next_settler_id"] = id+1
    var mission: Dictionary = {"id":id,"team":team,"parent_id":int(parent["id"]),
        "c":int(parent["c"]),"r":int(parent["r"]),
        "to_c":destination.x,"to_r":destination.y,"route":route,
        "route_length":route.size(),"waypoint":0,
        "created_turn":int(state.get("campaign",{}).get("turn",0)),
        "state":"traveling"}
    if not state.has("settler_missions"):
        state["settler_missions"] = []
    state["settler_missions"].append(mission)
    state["revision"] = int(state.get("revision",0))+1
    return {"ok":true,"mission_id":id,"reason":"Asutaja %d väljus linnast %s. Teekond %d ruutu." % [
        id,str(parent.get("name","")),route.size()]}

static func _cancel(state: Dictionary,mission: Dictionary,reason: String) -> Dictionary:
    # Return settlement goods and population only if the origin still belongs
    # to the same owner. Do not gift resources to a conqueror of the parent.
    var refunded: bool = false
    for city in state["cities"]:
        if int(city.get("id",-1)) == int(mission.get("parent_id",-2)) and int(city.get("team",-1)) == int(mission.get("team",-2)):
            city["pop"] = int(city["pop"])+Founding.SETTLERS
            for key in Founding.FOUNDING_COST:
                city["resources"][key] = float(city["resources"].get(key,0.0))+float(Founding.FOUNDING_COST[key])
            refunded = true
            break
    state["settler_losses"] = int(state.get("settler_losses",0))+1
    return {"ok":false,"reason":reason,"refunded":refunded,"id":int(mission.get("id",-1))}

static func advance_turn(state: Dictionary,land: PackedByteArray) -> Dictionary:
    if land.size() != Campaign.COLS*Campaign.ROWS:
        return {"moved":0,"founded":0,"cancelled":0,"reports":[]}
    var remaining: Array = []
    var report: Array = []
    var moved: int = 0
    var founded: int = 0
    var cancelled: int = 0
    # Do not iterate mutating the same list, since founding can change cities.
    for mission in missions(state):
        var path: Array = mission.get("route",[])
        var waypoint: int = int(mission.get("waypoint",0))
        var blocked: bool = false
        for step in range(STEP_PER_TURN):
            if waypoint >= path.size():
                break
            var next: Array = path[waypoint]
            var c: int = int(next[0])
            var r: int = int(next[1])
            if c < 0 or r < 0 or c >= Campaign.COLS or r >= Campaign.ROWS or land[Campaign.index(c,r)] == 0:
                blocked = true
                break
            if Territory.owner_at(state,c,r) >= 0 and waypoint == path.size()-1:
                blocked = true
                break
            mission["c"] = c
            mission["r"] = r
            waypoint += 1
            moved += 1
        mission["waypoint"] = waypoint
        if blocked:
            cancelled += 1
            report.append(_cancel(state,mission,"Asutaja teekond või lõppsiht on blokeeritud"))
            continue
        if waypoint < path.size():
            remaining.append(mission)
            continue
        var destination := Vector2i(int(mission["to_c"]),int(mission["to_r"]))
        var finished: Dictionary = Founding.complete_reserved(
            state,land,int(mission["team"]),destination,int(mission["parent_id"]),int(mission["route_length"]))
        if not bool(finished.get("ok",false)):
            cancelled += 1
            report.append(_cancel(state,mission,str(finished.get("reason","Sihtkoht on hõivatud"))))
            continue
        founded += 1
        report.append(finished)
    state["settler_missions"] = remaining
    state["settler_steps"] = int(state.get("settler_steps",0))+moved
    if moved > 0 or founded > 0 or cancelled > 0:
        state["revision"] = int(state.get("revision",0))+1
        state["territory_source"] = ""
    return {"moved":moved,"founded":founded,"cancelled":cancelled,"reports":report}

static func ai_expand(state: Dictionary,land: PackedByteArray) -> Dictionary:
    if not bool(state.get("campaign",{}).get("active",false)):
        return {"started":0}
    var turn: int = int(state["campaign"].get("turn",0))
    if turn < AI_FIRST_TURN or turn % AI_EXPAND_INTERVAL != 0:
        return {"started":0}
    var started: int = 0
    for team in range(1,4):
        var pending: bool = false
        for mission in missions(state):
            if int(mission.get("team",-1)) == team:
                pending = true
                break
        if pending:
            continue
        var proposal: Dictionary = Founding.nearest_candidate(state,land,team)
        if bool(proposal.get("ok",false)):
            var dispatched: Dictionary = dispatch(state,land,team,proposal["tile"])
            if bool(dispatched.get("ok",false)):
                started += 1
    state["ai_settlers_sent"] = int(state.get("ai_settlers_sent",0))+started
    return {"started":started}
