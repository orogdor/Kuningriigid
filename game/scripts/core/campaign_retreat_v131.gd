extends RefCounted
## V3.3: transfer routed survivors from the individual battlefield back to
## reachable world-map tiles. Inspired by V131 battlefield-v88.js
## applyArmyRetreats; intentionally a bounded preview, not complete campaign AI.
const Military = preload("res://scripts/core/military_port.gd")
const MAX_RADIUS: int = 4
const RECOVERY_SECONDS: float = 30.0

static func _army(state: Dictionary, id: int) -> Dictionary:
    for item in state.get("armies", []):
        if int(item.get("id", -1)) == id:
            return item
    return {}

static func _enemy_occupied(state: Dictionary, team: int, p: Vector2i) -> bool:
    for other in state.get("armies", []):
        if int(other.get("team", -1)) == team or int(other.get("c", -1)) != p.x or int(other.get("r", -1)) != p.y:
            continue
        if not Military.units_for(state, other).is_empty():
            return true
    return false

static func _enemy_city(state: Dictionary, team: int, p: Vector2i) -> bool:
    for city in state.get("cities", []):
        if int(city.get("c", -1)) == p.x and int(city.get("r", -1)) == p.y and int(city.get("team", -1)) != team:
            return true
    return false

static func _friendly_city(state: Dictionary, team: int, p: Vector2i) -> bool:
    for city in state.get("cities", []):
        if int(city.get("c", -1)) == p.x and int(city.get("r", -1)) == p.y and int(city.get("team", -1)) == team:
            return true
    return false

static func preferred_offset(battle: Dictionary, army_id: int) -> Vector2i:
    var dx: float = 0.0
    var dz: float = 0.0
    var count: int = 0
    for squad in battle.get("squads", []):
        if int(squad.get("army_id", -1)) != army_id or bool(squad.get("reserve", false)):
            continue
        var exit: Dictionary = squad.get("escape_exit", {})
        var p: Dictionary = exit.get("outside", {})
        if p.is_empty():
            # Older saved fights may not have an escape_exit field.
            for m in squad.get("men", []):
                if float(m.get("hp", 0.0)) > 0.0 and bool(m.get("escaped", false)):
                    p = {"x": float(m.get("x", 0.0)), "z": float(m.get("z", 0.0))}
                    break
        if p.is_empty():
            continue
        dx += float(p.get("x", 0.0))
        dz += float(p.get("z", 0.0))
        count += 1
    if count == 0:
        return Vector2i.ZERO
    # V131 detail-scale-v123.js: tileDelta uses 225x195 tile geometry.
    return Vector2i(clampi(floori((dx / count + 112.5) / 225.0), -2, 2), clampi(floori((dz / count + 97.5) / 195.0), -2, 2))

static func choose_destination(state: Dictionary, army: Dictionary, world_nav, preferred: Vector2i = Vector2i.ZERO) -> Dictionary:
    if world_nav == null:
        return {"ok": false, "reason": "Maailmakaardi navigeerimine puudub"}
    var origin := Vector2i(int(army.get("c", -1)), int(army.get("r", -1)))
    var desired: Vector2i = origin + preferred
    var team: int = int(army.get("team", -1))
    # Bounded local BFS builds a proof of reachability just once instead of
    # launching ~40 world-sized BFS searches per army on a mobile device.
    var queue: Array = [{"p": origin, "path": []}]
    var visited: Dictionary = {"%d:%d" % [origin.x,origin.y]: true}
    var best: Dictionary = {}
    var best_score: float = INF
    var read: int = 0
    while read < queue.size():
        var current: Dictionary = queue[read]
        read += 1
        var here: Vector2i = current["p"]
        var steps: Array = current["path"]
        if not steps.is_empty() and not _enemy_city(state,team,here) and not _enemy_occupied(state,team,here):
            var score: float = float(steps.size())*10.0 + float(here.distance_squared_to(desired))*1.8
            if _friendly_city(state, team, here):
                score -= 4.0
            if score < best_score:
                best_score = score
                best = {"ok": true, "c": here.x, "r": here.y, "path": steps.duplicate(true), "score": score}
        if steps.size() >= MAX_RADIUS + 2:
            continue
        for direction in [Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1)]:
            var next: Vector2i = here + direction
            if next.distance_squared_to(origin) > MAX_RADIUS*MAX_RADIUS or abs(next.x-origin.x)+abs(next.y-origin.y)>MAX_RADIUS:
                continue
            var key: String = "%d:%d" % [next.x,next.y]
            if visited.has(key) or not world_nav.is_open(next) or _enemy_city(state,team,next) or _enemy_occupied(state,team,next):
                continue
            visited[key] = true
            var following: Array = steps.duplicate(true)
            following.append([next.x,next.y])
            queue.append({"p":next,"path":following})
    if best.is_empty():
        return {"ok": false, "reason": "Ohutut maismaateed ei leitud"}
    return best

static func _needs_retreat(battle: Dictionary, army: Dictionary, winner: int) -> bool:
    var alive: int = 0
    var fleeing: int = 0
    var fighting: int = 0
    for squad in battle.get("squads", []):
        if int(squad.get("army_id", -1)) != int(army.get("id", -2)) or bool(squad.get("reserve", false)):
            continue
        var squad_routing: bool = bool(squad.get("routing", false)) or bool(squad.get("retreated", false))
        for m in squad.get("men", []):
            if float(m.get("hp", 0.0)) <= 0.0:
                continue
            alive += 1
            if squad_routing or bool(m.get("routing", false)) or bool(m.get("escaped", false)):
                fleeing += 1
            else:
                fighting += 1
    if alive == 0:
        # Pure reserves did not retreat: they were not admitted to battle.
        return false
    return (winner >= 0 and int(army.get("team", -1)) != winner) or (fighting == 0 and fleeing > 0) or (fleeing > fighting and winner < 0)

static func apply_after_battle(state: Dictionary, battle: Dictionary, winner: int, world_nav = null) -> Array:
    var reports: Array = []
    for id in ["army_a", "army_b"]:
        var army: Dictionary = _army(state, int(battle.get(id, -1)))
        if army.is_empty() or Military.units_for(state, army).is_empty() or not _needs_retreat(battle, army, winner):
            continue
        var source := Vector2i(int(army["c"]), int(army["r"]))
        var preferred: Vector2i = preferred_offset(battle, int(army["id"]))
        var target: Dictionary = choose_destination(state, army, world_nav, preferred)
        var moved: bool = bool(target.get("ok", false))
        if moved:
            army["c"] = int(target["c"])
            army["r"] = int(target["r"])
        # No bridge / blocked coastline = no magical teleport. Army remains
        # on the battlefield tile under temporary protection while regrouping.
        army["path"] = []
        army["waypoint"] = 0
        army["travel_clock"] = 0.0
        army["travel_duration"] = 0.0
        army["stance"] = "recover"
        army["retreat_until"] = float(state.get("seconds", 0.0)) + RECOVERY_SECONDS
        army["retreat_from"] = [source.x, source.y]
        army["retreat_to"] = [int(army["c"]), int(army["r"])]
        var report: Dictionary = {"army_id": int(army["id"]), "team": int(army["team"]), "from": [source.x, source.y], "to": [int(army["c"]), int(army["r"])], "moved": moved, "reason": "reachability" if moved else String(target.get("reason", "Tee puudub")), "route_length": (target.get("path", []) as Array).size()}
        reports.append(report)
        state["campaign_retreats"] = int(state.get("campaign_retreats", 0)) + 1
        if not moved:
            state["campaign_retreats_trapped"] = int(state.get("campaign_retreats_trapped", 0)) + 1
    if not reports.is_empty():
        state["last_campaign_retreats"] = reports.duplicate(true)
        state["revision"] = int(state.get("revision", 0)) + 1
    return reports
