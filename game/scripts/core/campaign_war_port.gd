extends RefCounted
## V4.4: early-campaign military planner, using normal paid construction,
## population-based recruitment, world navigation and persistent armies.
## All four factions are rivals in this first campaign slice; diplomacy later.
const Military = preload("res://scripts/core/military_port.gd")
const Preview = preload("res://scripts/core/preview_sim_port.gd")
const Fort = preload("res://scripts/core/city_fortification_port.gd")
const CampaignSiege = preload("res://scripts/core/campaign_siege_port.gd")
const CAMPAIGN_AI_FIRST_TURN: int = 10
const CAMPAIGN_ATTACK_FIRST_TURN: int = 18
const MIN_ATTACK_UNITS: int = 2
const MAX_UNITS_PER_FACTION: int = 12
const MAX_FRONT_ARMIES_PER_TEAM: int = 3
const MAX_RECRUITS_PER_TEAM_TURN: int = 3
const MAX_TARGET_DISTANCE: int = 65
const OCCUPATION_TURNS: int = 2

static func _units_of_team(state: Dictionary,team: int) -> int:
    var count: int = 0
    for unit in state.get("military_units",[]):
        if int(unit.get("team",-1)) == team and float(unit.get("hp",0.0)) > 0.0:
            count += 1
    return count

static func ai_recruit(state: Dictionary,landscape = null) -> Dictionary:
    # Develop several real cities in parallel. Recruitment uses the existing
    # barracks, population, tech and resource debits; it never spawns units.
    var built: int = 0
    var trained: int = 0
    var turn: int = int(state.get("campaign",{}).get("turn",0))
    if turn < CAMPAIGN_AI_FIRST_TURN:
        return {"built":0,"trained":0}
    for team in range(1,4):
        var nation: Dictionary = state.get("teams",{}).get(team,{})
        if not bool(nation.get("known",{}).get("warfare",false)):
            continue
        var city_count: int = 0
        var queued: int = 0
        for city in state.get("cities",[]):
            if int(city.get("team",-1)) == team:
                city_count += 1
                queued += city.get("training",[]).size()
        var capacity: int = mini(MAX_UNITS_PER_FACTION,maxi(5,city_count*4))
        var team_orders: int = 0
        for i in range(state.get("cities",[]).size()):
            var city: Dictionary = state["cities"][i]
            if int(city.get("team",-1)) != team:
                continue
            if _units_of_team(state,team)+queued >= capacity:
                break
            var ready: bool = false
            var pending: bool = false
            for building in city.get("buildings",[]):
                if String(building.get("type","")) != "barracks":
                    continue
                ready = ready or (bool(building.get("ready",false)) and float(building.get("hp",0.0)) > 0.0)
                pending = pending or not bool(building.get("ready",false))
            var stock: Dictionary = city.get("resources",{})
            if not ready:
                if not pending and int(city.get("pop",0)) >= 6 and float(stock.get("wood",0.0)) >= 70.0 and float(stock.get("bread",0.0)) >= 24.0:
                    if bool(Preview.build_in_town(state,i,"barracks",landscape).get("ok",false)):
                        built += 1
                continue
            if team_orders >= MAX_RECRUITS_PER_TEAM_TURN or not city.get("training",[]).is_empty():
                continue
            if int(city.get("pop",0)) < 7 or float(stock.get("bread",0.0)) < 18.0:
                continue
            var home := Vector2i(int(city.get("c",-1)),int(city.get("r",-1)))
            var stationed: int = 0
            for army in state.get("armies",[]):
                if int(army.get("team",-1)) == team and int(army.get("c",-2)) == home.x and int(army.get("r",-2)) == home.y:
                    stationed += Military.units_for(state,army).size()
            if stationed >= 4:
                continue
            if bool(Military.train(state,i,"spearman","standard").get("ok",false)):
                trained += 1
                queued += 1
                team_orders += 1
    state["ai_barracks_orders"] = int(state.get("ai_barracks_orders",0))+built
    state["ai_military_recruit_orders"] = int(state.get("ai_military_recruit_orders",0))+trained
    return {"built":built,"trained":trained}

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

static func _friendly_city(state: Dictionary,team: int,point: Vector2i) -> Dictionary:
    for city in state.get("cities",[]):
        if int(city.get("team",-1)) == team and int(city.get("c",-2)) == point.x and int(city.get("r",-2)) == point.y:
            return city
    return {}

static func _on_hostile_city(state: Dictionary,team: int,point: Vector2i) -> bool:
    for city in state.get("cities",[]):
        if int(city.get("team",-1)) != team and int(city.get("c",-2)) == point.x and int(city.get("r",-2)) == point.y:
            return true
    return false

static func _has_other_garrison(state: Dictionary,team: int,point: Vector2i,except_id: int) -> bool:
    for army in state.get("armies",[]):
        if int(army.get("id",-1)) == except_id or int(army.get("team",-1)) != team:
            continue
        if int(army.get("c",-2)) == point.x and int(army.get("r",-2)) == point.y:
            if not Military.units_for(state,army).is_empty() and army.get("path",[]).is_empty():
                return true
    return false

static func _candidates(state: Dictionary,team: int,point: Vector2i,reserved: Dictionary) -> Array:
    var options: Array = []
    for city in state.get("cities",[]):
        if int(city.get("team",-1)) == team:
            continue
        var distance: int = absi(int(city["c"])-point.x)+absi(int(city["r"])-point.y)
        if distance == 0 or distance > MAX_TARGET_DISTANCE:
            continue
        var taken: int = int(reserved.get(str(int(city.get("id",-1))),0))
        options.append({"city":city,"distance":distance,"assigned":taken})
    options.sort_custom(func(a,b):
        if int(a["assigned"]) != int(b["assigned"]):
            return int(a["assigned"]) < int(b["assigned"])
        if int(a["distance"]) != int(b["distance"]):
            return int(a["distance"]) < int(b["distance"])
        return int(a["city"]["id"]) < int(b["city"]["id"]))
    return options

static func ai_march(state: Dictionary,world_nav) -> Dictionary:
    # Up to three independent enemy-city targets per AI nation. A paid
    # soldier stays behind as home guard when a stack has three or more.
    # The engine still resolves tactical encounters sequentially.
    var ordered: int = 0
    var guarded: int = 0
    var turn: int = int(state.get("campaign",{}).get("turn",0))
    if turn < CAMPAIGN_ATTACK_FIRST_TURN or world_nav == null:
        return {"ordered":0,"garrisons":0}
    var ongoing: Dictionary = state.get("individual_battle",{})
    var reservations: Dictionary = {}
    var front_counts: Dictionary = {}
    for army in state.get("armies",[]):
        var team: int = int(army.get("team",-1))
        if team < 1 or team > 3 or army.get("path",[]).is_empty() or Military.units_for(state,army).is_empty():
            continue
        front_counts[team] = int(front_counts.get(team,0))+1
        var id: int = int(army.get("campaign_target_city",-1))
        if id >= 0:
            var owner: Dictionary = reservations.get(team,{})
            owner[str(id)] = int(owner.get(str(id),0))+1
            reservations[team] = owner
    for army in state.get("armies",[]):
        var team: int = int(army.get("team",-1))
        if team < 1 or team > 3 or Military.units_for(state,army).size() < MIN_ATTACK_UNITS:
            continue
        if int(front_counts.get(team,0)) >= MAX_FRONT_ARMIES_PER_TEAM or not army.get("path",[]).is_empty():
            continue
        if float(army.get("retreat_until",0.0)) > float(state.get("seconds",0.0)):
            continue
        if not ongoing.is_empty() and int(army.get("id",-1)) in [int(ongoing.get("army_a",-1)),int(ongoing.get("army_b",-1))]:
            continue
        if String(army.get("strategic_role","")) == "garrison":
            continue
        var point := Vector2i(int(army["c"]),int(army["r"]))
        if _on_hostile_city(state,team,point):
            continue # Stay for the occupation or linked city siege.
        var home: Dictionary = _friendly_city(state,team,point)
        var other_guards: bool = _has_other_garrison(state,team,point,int(army["id"])) if not home.is_empty() else false
        var troops: Array = Military.units_for(state,army)
        var should_split: bool = not home.is_empty() and not other_guards and troops.size() >= 3
        if not home.is_empty() and not other_guards and troops.size() == MIN_ATTACK_UNITS:
            var cities_owned: int = 0
            for own_city in state.get("cities",[]):
                if int(own_city.get("team",-1)) == team:
                    cities_owned += 1
            if cities_owned > 1:
                continue # Keep both until the third trained soldier arrives.
        var reserved: Dictionary = reservations.get(team,{})
        for option in _candidates(state,team,point,reserved):
            var city: Dictionary = option["city"]
            var dest := Vector2i(int(city["c"]),int(city["r"]))
            var order: Dictionary = Military.command_move(state,int(army["id"]),dest.x,dest.y,world_nav)
            if not bool(order.get("ok",false)):
                continue # A land route may be blocked by water.
            if should_split:
                var guard: Dictionary = Military.create_army(state,team,point.x,point.y)
                var unit: Dictionary = troops[0]
                unit["armyId"] = int(guard["id"])
                guard["strategic_role"] = "garrison"
                guard["home_city_id"] = int(home.get("id",-1))
                guarded += 1
                state["ai_garrison_assignments"] = int(state.get("ai_garrison_assignments",0))+1
                state["revision"] = int(state.get("revision",0))+1
            army["strategic_role"] = "attack"
            army["campaign_target_city"] = int(city.get("id",-1))
            reserved[str(int(city["id"]))] = int(reserved.get(str(int(city["id"])),0))+1
            reservations[team] = reserved
            front_counts[team] = int(front_counts.get(team,0))+1
            ordered += 1
            break
    state["ai_military_march_orders"] = int(state.get("ai_military_march_orders",0))+ordered
    return {"ordered":ordered,"garrisons":guarded}

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
        if defended or occupants.is_empty() or not city.get("fortification",{}).get("tiles",[]).is_empty():
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

static func prepare_city_sieges(state: Dictionary) -> Dictionary:
    return CampaignSiege.prepare(state)

static func advance_blockades(state: Dictionary) -> Dictionary:
    return CampaignSiege.advance_blockades(state)

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
