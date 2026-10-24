extends RefCounted
## V4.8 strategic assembly of existing, resource-paid soldiers.
## Donors physically march on the world map and keep at least one city guard.
## No teleportation, fresh combatants, or parallel tactical battle is created.
const Military = preload("res://scripts/core/military_port.gd")
const Fort = preload("res://scripts/core/city_fortification_port.gd")
const Defense = preload("res://scripts/core/campaign_defense_port.gd")
const MIN_SIEGE_FORCE: int = 4
const MAX_RALLY_DISTANCE: int = 45

static func _point(item: Dictionary) -> Vector2i:
    return Vector2i(int(item.get("c",-1)),int(item.get("r",-1)))

static func _distance(a: Vector2i,b: Vector2i) -> int:
    return absi(a.x-b.x)+absi(a.y-b.y)

static func _army(state: Dictionary,id: int) -> Dictionary:
    for item in state.get("armies",[]):
        if int(item.get("id",-1)) == id:
            return item
    return {}

static func _home_city(state: Dictionary,team: int,p: Vector2i) -> Dictionary:
    for city in state.get("cities",[]):
        if int(city.get("team",-1)) == team and _point(city) == p:
            return city
    return {}

static func _other_guard(state: Dictionary,army: Dictionary,p: Vector2i) -> bool:
    for other in state.get("armies",[]):
        if int(other.get("id",-1)) == int(army.get("id",-2)) or int(other.get("team",-1)) != int(army.get("team",-2)):
            continue
        if _point(other) == p and other.get("path",[]).is_empty() and Military.units_for(state,other).size() > 0:
            return true
    return false

static func _battle_army_ids(state: Dictionary) -> Array:
    var battle: Dictionary = state.get("individual_battle",{})
    if battle.is_empty():
        battle = state.get("active_battle",{})
    if battle.is_empty():
        return []
    return [int(battle.get("army_a",-1)),int(battle.get("army_b",-1))]

static func _fortified_target(state: Dictionary,team: int,p: Vector2i,world_nav) -> Dictionary:
    var best: Dictionary = {}
    var best_distance: int = 999999
    for city in state.get("cities",[]):
        if int(city.get("team",-1)) == team:
            continue
        var tile: Vector2i = _point(city)
        var distance: int = _distance(tile,p)
        if distance <= 0 or distance > MAX_RALLY_DISTANCE or not Fort.fortified(city,tile):
            continue
        if world_nav.route({"c":p.x,"r":p.y},{"c":tile.x,"r":tile.y}).is_empty():
            continue
        if distance < best_distance or (distance == best_distance and int(city.get("id",-1)) < int(best.get("id",999999))):
            best = city
            best_distance = distance
    return best

static func advance(state: Dictionary,world_nav) -> Dictionary:
    var merged: int = 0
    var dispatched: int = 0
    var released: int = 0
    if world_nav == null or not bool(state.get("campaign",{}).get("active",false)):
        return {"merged":0,"dispatched":0,"released":0}
    var busy: Array = _battle_army_ids(state)
    # First finish arrivals; a traveling group never grows into the leader
    # until it has reached the exact same tile.
    var remove_armies: Array = []
    for donor in state.get("armies",[]):
        if String(donor.get("strategic_role","")) != "rally":
            continue
        if int(donor.get("id",-1)) in busy:
            continue
        var lead: Dictionary = _army(state,int(donor.get("rally_leader_id",-1)))
        var same_team: bool = not lead.is_empty() and int(lead.get("team",-1)) == int(donor.get("team",-2))
        var arrived: bool = donor.get("path",[]).is_empty() and same_team and _point(donor) == _point(lead)
        if not donor.get("path",[]).is_empty():
            continue
        if arrived and int(lead.get("id",-1)) not in busy and not Military.units_for(state,donor).is_empty():
            for unit in Military.units_for(state,donor):
                unit["armyId"] = int(lead["id"])
                merged += 1
            if String(lead.get("strategic_role","")) == "assembly":
                lead["strategic_role"] = "reserve"
            remove_armies.append(donor)
            continue
        # Battle interrupted a rally or leader was lost: don't teleport.
        donor["strategic_role"] = "reserve"
        donor.erase("rally_leader_id")
        released += 1
    for old in remove_armies:
        state["armies"].erase(old)
    var pending: Dictionary = {}
    for army in state.get("armies",[]):
        if String(army.get("strategic_role","")) == "rally":
            pending[int(army.get("rally_leader_id",-1))] = true
    # Consider one assembly in progress per faction, never recalling city guards
    # or armies that are engaged in a tactical battle.
    for team in range(1,4):
        var leader: Dictionary = {}
        for army in state.get("armies",[]):
            if int(army.get("team",-1)) == team and String(army.get("strategic_role","")) == "assembly":
                leader = army
                break
        if leader.is_empty():
            for army in state.get("armies",[]):
                if int(army.get("team",-1)) != team or int(army.get("id",-1)) in busy:
                    continue
                if String(army.get("strategic_role","")) in ["attack","relief","rally"] or not army.get("path",[]).is_empty():
                    continue
                var home: Vector2i = _point(army)
                if _home_city(state,team,home).is_empty() or Defense.threatened(state,team,home):
                    continue
                var size: int = Military.units_for(state,army).size()
                var minimum: int = MIN_SIEGE_FORCE+(0 if _other_guard(state,army,home) else 1)
                if size < 2 or size >= minimum:
                    continue
                var target: Dictionary = _fortified_target(state,team,home,world_nav)
                if target.is_empty():
                    continue
                leader = army
                leader["strategic_role"] = "assembly"
                leader["rally_target_city_id"] = int(target["id"])
                break
        if leader.is_empty() or pending.has(int(leader.get("id",-1))):
            continue
        if int(leader.get("id",-1)) in busy:
            continue
        var place: Vector2i = _point(leader)
        var current_home: Dictionary = _home_city(state,team,place)
        var force: int = Military.units_for(state,leader).size()
        var needed: int = MIN_SIEGE_FORCE+(0 if _other_guard(state,leader,place) else 1)
        if current_home.is_empty() or Defense.threatened(state,team,place) or force >= needed:
            leader["strategic_role"] = "reserve"
            continue
        var best_donor: Dictionary = {}
        var best_distance: int = 999999
        for army in state.get("armies",[]):
            if int(army.get("id",-1)) == int(leader["id"]) or int(army.get("team",-1)) != team or int(army.get("id",-1)) in busy:
                continue
            if String(army.get("strategic_role","")) in ["attack","relief","rally","assembly"] or not army.get("path",[]).is_empty():
                continue
            var source: Vector2i = _point(army)
            if source == place or _home_city(state,team,source).is_empty() or Defense.threatened(state,team,source):
                continue
            var available: int = Military.units_for(state,army).size()-1
            if available <= 0:
                continue # Never take the last real guard from a town.
            var distance: int = _distance(source,place)
            if distance <= 0 or distance > MAX_RALLY_DISTANCE or distance >= best_distance:
                continue
            if world_nav.route(army,{"c":place.x,"r":place.y}).is_empty():
                continue
            best_donor = army
            best_distance = distance
        if best_donor.is_empty():
            # Keep waiting for paid reinforcements; don't send a weak siege.
            continue
        var selected: Array = Military.units_for(state,best_donor)
        var count: int = mini(needed-force,selected.size()-1)
        if count <= 0:
            continue
        var source: Vector2i = _point(best_donor)
        var convoy: Dictionary = Military.create_army(state,team,source.x,source.y)
        for i in range(count):
            selected[i]["armyId"] = int(convoy["id"])
        var order: Dictionary = Military.command_move(state,int(convoy["id"]),place.x,place.y,world_nav)
        if not bool(order.get("ok",false)):
            for i in range(count):
                selected[i]["armyId"] = int(best_donor["id"])
            state["armies"].erase(convoy)
            continue
        convoy["strategic_role"] = "rally"
        convoy["rally_leader_id"] = int(leader["id"])
        convoy["rally_target_city_id"] = int(leader.get("rally_target_city_id",-1))
        best_donor["strategic_role"] = "garrison"
        best_donor["home_city_id"] = int(_home_city(state,team,source).get("id",-1))
        dispatched += 1
    state["ai_rally_marches"] = int(state.get("ai_rally_marches",0))+dispatched
    state["ai_rally_merged_units"] = int(state.get("ai_rally_merged_units",0))+merged
    if merged+dispatched+released > 0:
        state["revision"] = int(state.get("revision",0))+1
    return {"merged":merged,"dispatched":dispatched,"released":released}
