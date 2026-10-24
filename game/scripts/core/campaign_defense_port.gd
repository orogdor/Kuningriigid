extends RefCounted
## Godot Dev 103: strategic defense uses existing paid armies only.
## It does not move armies on the map instantly and never interrupts an
## already-running tactical encounter.
const Military = preload("res://scripts/core/military_port.gd")
const ALERT_RADIUS: int = 7
const MAX_RELIEF_DISTANCE: int = 65

static func _distance(a: Vector2i,b: Vector2i) -> int:
    return absi(a.x-b.x)+absi(a.y-b.y)

static func _point(unit: Dictionary) -> Vector2i:
    return Vector2i(int(unit.get("c",-1)),int(unit.get("r",-1)))

static func _enemy_pressure(state: Dictionary,team: int,home: Vector2i) -> Dictionary:
    var count: int = 0
    var closest: int = 999999
    for army in state.get("armies",[]):
        if int(army.get("team",-1)) == team:
            continue
        var live: int = Military.units_for(state,army).size()
        if live <= 0:
            continue
        var distance: int = _distance(_point(army),home)
        if distance > ALERT_RADIUS:
            continue
        count += live
        closest = mini(closest,distance)
    return {"units":count,"distance":closest}

static func _committed_relief(state: Dictionary,team: int,city_id: int) -> int:
    var total: int = 0
    for army in state.get("armies",[]):
        if int(army.get("team",-1)) == team and String(army.get("strategic_role","")) == "relief" and int(army.get("defense_city_id",-1)) == city_id:
            total += Military.units_for(state,army).size()
    return total

static func _home_defenders(state: Dictionary,team: int,home: Vector2i) -> int:
    var total: int = 0
    for army in state.get("armies",[]):
        if int(army.get("team",-1)) != team or _point(army) != home:
            continue
        if not army.get("path",[]).is_empty() and String(army.get("strategic_role","")) != "relief":
            continue
        total += Military.units_for(state,army).size()
    return total

static func _battle_ids(state: Dictionary) -> Array:
    var battle: Dictionary = state.get("individual_battle",{})
    var old: Dictionary = state.get("active_battle",{})
    if not battle.is_empty():
        return [int(battle.get("army_a",-1)),int(battle.get("army_b",-1))]
    if not old.is_empty():
        return [int(old.get("army_a",-1)),int(old.get("army_b",-1))]
    return []

static func recall(state: Dictionary,world_nav) -> Dictionary:
    var recalled: int = 0
    var released: int = 0
    var alerted: int = 0
    if world_nav == null or not bool(state.get("campaign",{}).get("active",false)):
        return {"recalled":0,"released":0,"alerts":0}
    # Relief units are released only AFTER reaching the safe city.
    for army in state.get("armies",[]):
        if String(army.get("strategic_role","")) != "relief" or not army.get("path",[]).is_empty():
            continue
        var team: int = int(army.get("team",-1))
        var city_id: int = int(army.get("defense_city_id",-1))
        for city in state.get("cities",[]):
            if int(city.get("id",-2)) != city_id or int(city.get("team",-1)) != team:
                continue
            var home: Vector2i = _point(city)
            if _point(army) != home:
                continue
            if int(_enemy_pressure(state,team,home)["units"]) > 0:
                break
            army["strategic_role"] = "reserve"
            army.erase("defense_city_id")
            released += 1
            break
    var excluded: Array = _battle_ids(state)
    var targets: Array = []
    for city in state.get("cities",[]):
        var team: int = int(city.get("team",-1))
        if team <= 0 or team > 3:
            continue
        var home: Vector2i = _point(city)
        var threat: Dictionary = _enemy_pressure(state,team,home)
        if int(threat["units"]) <= 0:
            continue
        alerted += 1
        targets.append({"city":city,"team":team,"home":home,
            "threat":int(threat["units"]),"distance":int(threat["distance"])})
    targets.sort_custom(func(a,b):
        if int(a["distance"]) != int(b["distance"]):
            return int(a["distance"]) < int(b["distance"])
        return int(a["city"]["id"]) < int(b["city"]["id"]))
    for target in targets:
        var team: int = int(target["team"])
        var home: Vector2i = target["home"]
        var city_id: int = int(target["city"]["id"])
        var local: int = _home_defenders(state,team,home)
        var coming: int = _committed_relief(state,team,city_id)
        if coming+local >= int(target["threat"])+1:
            continue
        var best: Dictionary = {}
        var best_distance: int = 999999
        for army in state.get("armies",[]):
            if int(army.get("team",-1)) != team or int(army.get("id",-1)) in excluded:
                continue
            if Military.units_for(state,army).size() < 2:
                continue
            if String(army.get("strategic_role","")) in ["garrison","relief"]:
                continue
            if float(army.get("retreat_until",0.0)) > float(state.get("seconds",0.0)):
                continue
            var point: Vector2i = _point(army)
            if point == home or _distance(point,home) > MAX_RELIEF_DISTANCE:
                continue
            # Do not abandon a currently occupied hostile city or siege.
            var besieging: bool = false
            for city in state.get("cities",[]):
                if int(city.get("team",-1)) != team and _point(city) == point:
                    besieging = true
                    break
            if besieging:
                continue
            var distance: int = _distance(point,home)
            if distance < best_distance or (distance == best_distance and int(army.get("id",0)) < int(best.get("id",999999))):
                best = army
                best_distance = distance
        if best.is_empty():
            continue
        var order: Dictionary = Military.command_move(state,int(best["id"]),home.x,home.y,world_nav)
        if not bool(order.get("ok",false)):
            continue
        best["strategic_role"] = "relief"
        best["defense_city_id"] = city_id
        best.erase("campaign_target_city")
        recalled += 1
    state["ai_defense_recalls"] = int(state.get("ai_defense_recalls",0))+recalled
    state["ai_defense_alerts"] = int(state.get("ai_defense_alerts",0))+alerted
    return {"recalled":recalled,"released":released,"alerts":alerted}
