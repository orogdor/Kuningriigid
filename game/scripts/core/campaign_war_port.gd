extends RefCounted
## V4.4: early-campaign military planner, using normal paid construction,
## population-based recruitment, world navigation and persistent armies.
## All four factions are rivals in this first campaign slice; diplomacy later.
const Military = preload("res://scripts/core/military_port.gd")
const Preview = preload("res://scripts/core/preview_sim_port.gd")
const Fort = preload("res://scripts/core/city_fortification_port.gd")
const CAMPAIGN_AI_FIRST_TURN: int = 10
const CAMPAIGN_ATTACK_FIRST_TURN: int = 18
const MIN_ATTACK_UNITS: int = 2
const MAX_UNITS_PER_FACTION: int = 5
const MAX_TARGET_DISTANCE: int = 65
const OCCUPATION_TURNS: int = 2

static func _units_of_team(state: Dictionary,team: int) -> int:
    var count: int = 0
    for unit in state.get("military_units",[]):
        if int(unit.get("team",-1)) == team and float(unit.get("hp",0.0)) > 0.0:
            count += 1
    return count

static func ai_recruit(state: Dictionary,landscape = null) -> Dictionary:
    var created: int = 0
    var ordered: int = 0
    var turn: int = int(state.get("campaign",{}).get("turn",0))
    if turn < CAMPAIGN_AI_FIRST_TURN:
        return {"built":0,"trained":0}
    for team in range(1,4):
        var nation: Dictionary = state.get("teams",{}).get(team,{})
        if not bool(nation.get("known",{}).get("warfare",false)):
            continue
        if _units_of_team(state,team) >= MAX_UNITS_PER_FACTION:
            continue
        var queue_count: int = 0
        for city in state.get("cities",[]):
            if int(city.get("team",-1)) == team:
                queue_count += city.get("training",[]).size()
        if queue_count >= 2 or _units_of_team(state,team)+queue_count >= MAX_UNITS_PER_FACTION:
            continue
        for i in range(state.get("cities",[]).size()):
            var city: Dictionary = state["cities"][i]
            if int(city.get("team",-1)) != team:
                continue
            var has_barracks: bool = false
            var pending_barracks: bool = false
            for b in city.get("buildings",[]):
                if String(b.get("type","")) == "barracks":
                    pending_barracks = pending_barracks or not bool(b.get("ready",false))
                    has_barracks = has_barracks or (bool(b.get("ready",false)) and float(b.get("hp",0.0)) > 0.0)
            var stock: Dictionary = city.get("resources",{})
            if not has_barracks:
                if pending_barracks or int(city.get("pop",0)) < 6:
                    continue
                if float(stock.get("wood",0.0)) < 70.0 or float(stock.get("bread",0.0)) < 24.0:
                    continue
                var built: Dictionary = Preview.build_in_town(state,i,"barracks",landscape)
                if bool(built.get("ok",false)):
                    created += 1
                break
            if int(city.get("pop",0)) < 7 or float(stock.get("bread",0.0)) < 18.0:
                continue
            var trained: Dictionary = Military.train(state,i,"spearman","standard")
            if bool(trained.get("ok",false)):
                ordered += 1
                break
    state["ai_barracks_orders"] = int(state.get("ai_barracks_orders",0))+created
    state["ai_military_recruit_orders"] = int(state.get("ai_military_recruit_orders",0))+ordered
    return {"built":created,"trained":ordered}

static func nearest_rival_city(state: Dictionary,team: int,from: Vector2i) -> Dictionary:
    var closest: Dictionary = {}
    var best: int = 999999
    for city in state.get("cities",[]):
        if int(city.get("team",-1)) == team:
            continue
        var distance: int = absi(int(city["c"])-from.x)+absi(int(city["r"])-from.y)
        if distance == 0 or distance > MAX_TARGET_DISTANCE:
            continue
        # Prefer the closest hostile town and deterministic ties.
        if distance < best or (distance == best and int(city["id"]) < int(closest.get("id",999999))):
            best = distance
            closest = city
    return closest

static func ai_march(state: Dictionary,world_nav) -> Dictionary:
    var ordered: int = 0
    var turn: int = int(state.get("campaign",{}).get("turn",0))
    if turn < CAMPAIGN_ATTACK_FIRST_TURN or world_nav == null:
        return {"ordered":0}
    if not state.get("active_battle",{}).is_empty() or not state.get("individual_battle",{}).is_empty():
        return {"ordered":0}
    for army in state.get("armies",[]):
        var team: int = int(army.get("team",-1))
        if team <= 0 or team > 3 or Military.units_for(state,army).size() < MIN_ATTACK_UNITS:
            continue
        if not army.get("path",[]).is_empty():
            continue
        if float(army.get("retreat_until",0.0)) > float(state.get("seconds",0.0)):
            continue
        var point := Vector2i(int(army["c"]),int(army["r"]))
        var target: Dictionary = nearest_rival_city(state,team,point)
        if target.is_empty():
            continue
        var cell := Vector2i(int(target["c"]),int(target["r"]))
        if cell == point:
            continue # Occupy on the next strategy-turn, not while moving.
        var order: Dictionary = Military.command_move(state,int(army["id"]),cell.x,cell.y,world_nav)
        if bool(order.get("ok",false)):
            army["campaign_target_city"] = int(target.get("id",-1))
            ordered += 1
    state["ai_military_march_orders"] = int(state.get("ai_military_march_orders",0))+ordered
    return {"ordered":ordered}

static func occupy_unfortified(state: Dictionary) -> Dictionary:
    # Defenders must actually be gone; surviving enemy armies protect town.
    # Fortifications require the real siege engine instead.
    var captured: int = 0
    var progress: Dictionary = state.get("city_occupation_progress",{})
    if not state.get("active_battle",{}).is_empty() or not state.get("individual_battle",{}).is_empty():
        return {"captured":0}
    for city in state.get("cities",[]):
        var home := Vector2i(int(city["c"]),int(city["r"]))
        var old_team: int = int(city["team"])
        var key: String = str(int(city["id"]))
        var occupants: Dictionary = {}
        var defended: bool = false
        for army in state.get("armies",[]):
            if int(army.get("c",-1)) != home.x or int(army.get("r",-1)) != home.y:
                continue
            var units: int = Military.units_for(state,army).size()
            if units == 0:
                continue
            var army_team: int = int(army["team"])
            if army_team == old_team:
                defended = true
            elif units >= MIN_ATTACK_UNITS:
                occupants[army_team] = maxi(int(occupants.get(army_team,0)),units)
        if defended or occupants.is_empty() or Fort.fortified(city,home):
            progress.erase(key)
            continue
        var attacker: int = -1
        var best: int = -1
        for team in occupants:
            if int(occupants[team]) > best or int(occupants[team]) == best and int(team) < attacker:
                best = int(occupants[team])
                attacker = int(team)
        if attacker < 0 or attacker == old_team:
            progress.erase(key)
            continue
        var record: Dictionary = progress.get(key,{})
        var turns: int = int(record.get("turns",0))+1 if int(record.get("team",-1)) == attacker else 1
        if turns < OCCUPATION_TURNS:
            progress[key] = {"team":attacker,"turns":turns}
            continue
        progress.erase(key)
        city["team"] = attacker
        city["age"] = int(state["teams"][attacker].get("age",city.get("age",0)))
        city["training"] = []
        city["captured_from_team"] = old_team
        city["captured_at"] = float(state.get("seconds",0.0))
        city["captures"] = int(city.get("captures",0))+1
        state["territory_source"] = ""
        state["revision"] = int(state.get("revision",0))+1
        state["city_captures"] = int(state.get("city_captures",0))+1
        if not state.has("conquests"):
            state["conquests"] = []
        state["conquests"].append({"city_id":int(city["id"]),"c":home.x,"r":home.y,
            "from":old_team,"to":attacker,"mode":"undefended_occupation",
            "turn":int(state.get("campaign",{}).get("turn",0))})
        captured += 1
    state["city_occupation_progress"] = progress
    return {"captured":captured}

static func report(state: Dictionary,team: int) -> String:
    var army_count: int = 0
    var units: int = 0
    var queue: int = 0
    for army in state.get("armies",[]):
        if int(army.get("team",-1)) == team:
            var n: int = Military.units_for(state,army).size()
            if n > 0:
                army_count += 1
                units += n
    for city in state.get("cities",[]):
        if int(city.get("team",-1)) == team:
            queue += city.get("training",[]).size()
    return "Riik %d: %d armeed, %d üksust, %d väljaõppes. Lahinguid %d, vallutusi %d." % [
        team,army_count,units,queue,int(state.get("individual_battles_finished",0)),int(state.get("city_captures",0))]
