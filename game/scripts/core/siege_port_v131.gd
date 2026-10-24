extends RefCounted
## V131 siege-rules-v114, tower-garrison-v117, wall-walk-v111 and
## siege-assault-v108: an isolated, simplified bronze siege fixture.
## Not a 1:1 port of siege occupancy, navigation, wall climb, or tower AI.
const PROFILES: Dictionary = {
    "palisade": {"hp": 420.0, "height": 2.4, "cover": .55},
    "stonewall": {"hp": 900.0, "height": 3.8, "cover": .45},
    "reinforced_wall": {"hp": 1800.0, "height": 6.4, "cover": .35},
    "gatehouse": {"hp": 700.0, "height": 3.8, "cover": .45},
    "stonetower": {"hp": 900.0, "height": 7.55, "cover": .45}
}
const LADDER_WOOD: float = 18.0
const LADDER_SECONDS: float = 30.0
const GUARDS_PER_TOWER: int = 5
const GUARD_PATROL_SPEED: float = 2.0

static func profile(kind: String) -> Dictionary:
    return PROFILES.get(kind, {})

static func _section(kind: String, x: float, z: float, axis: int, index: int) -> Dictionary:
    var data: Dictionary = profile(kind)
    return {"index": index, "id": -1, "type": kind, "x": x, "z": z,
        "axis": axis, "height": data.get("height",3.8), "hp": data.get("hp",900.0),
        "max_hp": data.get("hp",900.0), "cover": data.get("cover",.45),
        "breached": false, "walkable": true, "tower": kind == "stonetower"}

static func build_fixture(attacker_team: int, defender_team: int) -> Dictionary:
    var sections: Array = []
    # Four connected curtain walls: town centre at (18,0), west gate at (10,0).
    for z in [-8.0,-4.0,4.0,8.0]:
        sections.append(_section("stonewall",10.0,z,1,sections.size()))
    sections.append(_section("gatehouse",10.0,0.0,1,sections.size()))
    for z in [-8.0,-4.0,0.0,4.0,8.0]:
        sections.append(_section("stonewall",26.0,z,1,sections.size()))
    for x in [14.0,18.0,22.0]:
        sections.append(_section("stonewall",x,-12.0,0,sections.size()))
        sections.append(_section("stonewall",x,12.0,0,sections.size()))
    for x in [10.0,26.0]:
        for z in [-12.0,12.0]:
            sections.append(_section("stonetower",x,z,0,sections.size()))
    return {"attacker_team":attacker_team,"defender_team":defender_team,
        "sections":sections,"works":[],"guard_count":0,"wood_spent":0.0,
        "breaches":0,"structural_hits":0,"guard_patrol_steps":0,"gate_open":false,
        "next_work_id":1,"last_guard_plan":-1.0,"keep_hp":600.0,"keep_max_hp":600.0,
        "captured":false,"occupation_seconds":0.0,"tower_assaults":0,"ram_hits":0,"wall_melee_hits":0,"version":17}

static func _dist(a: Dictionary,b: Dictionary) -> float:
    return Vector2(float(a.get("x",0.0)),float(a.get("z",0.0))).distance_to(Vector2(float(b.get("x",0.0)),float(b.get("z",0.0))))

static func tower_nodes(siege: Dictionary) -> Array:
    return siege.get("sections",[]).filter(func(s): return bool(s.get("tower",false)) and float(s.get("hp",0.0)) > 0.0)

static func active_sections(siege: Dictionary) -> Array:
    return siege.get("sections",[]).filter(func(s): return float(s.get("hp",0.0)) > 0.0 and not bool(s.get("breached",false)))

static func _guard_squad(tower: Dictionary, index: int, team: int, source: int) -> Dictionary:
    var x: float = float(tower["x"]) + float(index-2)*.72
    var z: float = float(tower["z"])
    var soldier: Dictionary = {"id":0,"x":x,"z":z,"hp":20.0,"max_hp":20.0,
        "cooldown":.3*float(index),"ammo":40,"radius":.34,
        "elevation":float(tower["height"]),"shots_fired":0,"moving":false,
        "escaped":false,"kills":0,"damage":0.0}
    return {"unit_id":source,"army_id":-1,"team":team,"kind":"bronze_archer",
        "formation":"hold","combat_mode":"auto","formation_x":0.0,
        "anchor":{"x":x,"z":z},"side":1,"men":[soldier],"reserve":false,
        "retreated":false,"engagement_target":-1,"deployment_z":z,
        "tactical_role":"hold","cohesion":1.0,"attack_target":-1,
        "move_target":{},"damage":0.0,"kills":0,"max_hp":20.0,
        "army_level":1,"role":"ranged","range":18.75,"speed":2.0,"dmg":16.0,
        "guard_post":true,"tower_index":int(tower["index"]),"guard_slot":index,
        "wall_index":int(tower["index"]),"patrol_clock":float(index)*.35,
        "guard_goal":int(tower["index"]),"guard_direction":1}

static func attach_guards(battle: Dictionary) -> int:
    var siege: Dictionary = battle.get("siege",{})
    if siege.is_empty():
        return 0
    var count: int = 0
    for tower in tower_nodes(siege):
        for slot in range(GUARDS_PER_TOWER):
            if int(battle.get("initial_men",0)) + count >= 500:
                break
            battle["squads"].append(_guard_squad(tower,slot,int(siege["defender_team"]),-10000-int(tower["index"])*5-slot))
            count += 1
    siege["guard_count"] = count
    battle["initial_men"] = int(battle.get("initial_men",0))+count
    return count

static func ground_open(siege: Dictionary, x: float, z: float, radius: float = .34) -> bool:
    if siege.is_empty():
        return true
    for s in active_sections(siege):
        var half_x: float = 1.05 if int(s["axis"]) == 1 else 2.15
        var half_z: float = 2.15 if int(s["axis"]) == 1 else 1.05
        if bool(s.get("tower",false)):
            half_x = 1.35
            half_z = 1.35
        if absf(x-float(s["x"])) < half_x+radius and absf(z-float(s["z"])) < half_z+radius:
            return false
    return true

static func shot_blocked(siege: Dictionary, from: Dictionary, target: Dictionary, from_y: float = 0.0, to_y: float = 0.0) -> bool:
    if siege.is_empty():
        return false
    var a := Vector2(float(from["x"]),float(from["z"]))
    var b := Vector2(float(target["x"]),float(target["z"]))
    var d := b-a
    var l2: float = d.length_squared()
    if l2 < .0001:
        return false
    for wall in active_sections(siege):
        var center := Vector2(float(wall["x"]),float(wall["z"]))
        var t: float = clampf((center-a).dot(d)/l2,0.0,1.0)
        if t < .03 or t > .97:
            continue
        var near: Vector2 = a+d*t-center
        var wx: float = 1.25 if int(wall["axis"]) == 1 else 2.15
        var wz: float = 2.15 if int(wall["axis"]) == 1 else 1.25
        if absf(near.x)<wx and absf(near.y)<wz and from_y+(to_y-from_y)*t+1.6 < float(wall["height"]):
            return true
    return false

static func parapet_multiplier(siege: Dictionary, defender: Dictionary, projectile_kind: String) -> float:
    if siege.is_empty() or not bool(defender.get("guard_post",false)):
        return 1.0
    if projectile_kind == "rock":
        return .85
    if projectile_kind == "arrow":
        return .45
    return .85

static func structural_multiplier(weapon: String,wall_kind: String) -> float:
    if weapon == "siege_tower":
        return 0.0
    if weapon == "battering_ram":
        return 4.0 if wall_kind == "gatehouse" else (.12 if wall_kind != "palisade" else 2.5)
    if weapon == "bronze_catapult":
        return .8 * (1.5 if wall_kind == "palisade" else 1.0)
    if weapon == "catapult":
        return 1.5 * (1.5 if wall_kind == "palisade" else 1.0)
    return 0.0

static func nearest_intact(siege: Dictionary, x: float, z: float) -> Dictionary:
    var walls: Array = active_sections(siege)
    var best: Dictionary = {}
    var dist: float = INF
    for wall in walls:
        var q: float = Vector2(x,z).distance_squared_to(Vector2(float(wall["x"]),float(wall["z"])))
        if q < dist:
            best = wall
            dist = q
    return best

static func artillery_target(battle: Dictionary, squad: Dictionary) -> Dictionary:
    var siege: Dictionary = battle.get("siege",{})
    if siege.is_empty() or int(squad.get("team",-1)) == int(siege["defender_team"]):
        return {}
    if String(squad.get("kind","")) not in ["bronze_catapult","catapult"]:
        return {}
    if int(squad.get("attack_target",-1)) >= 0 or not squad.get("move_target",{}).is_empty():
        return {}
    if squad.get("men",[]).is_empty() or int(squad["men"][0].get("ammo",0)) <= 0:
        return {}
    var gate: Dictionary = {}
    for wall in active_sections(siege):
        if String(wall["type"]) == "gatehouse":
            gate = wall
            break
    if not gate.is_empty():
        return gate
    return nearest_intact(siege,float(squad["anchor"]["x"]),float(squad["anchor"]["z"]))

static func apply_rock(battle: Dictionary, projectile: Dictionary) -> int:
    var siege: Dictionary = battle.get("siege",{})
    if siege.is_empty():
        return 0
    var hits: int = 0
    var impact := Vector2(float(projectile["to_x"]),float(projectile["to_z"]))
    for wall in active_sections(siege):
        var distance: float = impact.distance_to(Vector2(float(wall["x"]),float(wall["z"])))
        if distance > float(projectile.get("radius",4.2)) + 1.0:
            continue
        var mult: float = structural_multiplier(String(projectile.get("weapon","bronze_catapult")),String(wall["type"]))
        var falloff: float = maxf(.25,1.0-distance/maxf(.1,float(projectile.get("radius",4.2))+1.0))
        # No artificial demolition multiplier; wall toughness matches V131.
        var damage: float = float(projectile.get("damage",0.0))*mult*falloff
        if damage <= 0.0:
            continue
        wall["hp"] = maxf(0.0,float(wall["hp"])-damage)
        hits += 1
        if float(wall["hp"]) <= .0001:
            wall["breached"] = true
            siege["breaches"] = int(siege.get("breaches",0))+1
            if String(wall["type"]) == "gatehouse":
                siege["gate_open"] = true
    siege["structural_hits"] = int(siege.get("structural_hits",0))+hits
    return hits

static func damage_structure(siege: Dictionary, index: int, weapon: String, damage: float) -> float:
    for wall in siege.get("sections",[]):
        if int(wall["index"]) != index or float(wall["hp"]) <= 0.0:
            continue
        var applied: float = maxf(0.0,damage)*structural_multiplier(weapon,String(wall["type"]))
        wall["hp"] = maxf(0.0,float(wall["hp"])-applied)
        if float(wall["hp"]) <= 0.0:
            wall["breached"] = true
            siege["breaches"] = int(siege.get("breaches",0))+1
            if String(wall["type"]) == "gatehouse":
                siege["gate_open"] = true
        return applied
    return 0.0

static func _wall_neighbors(siege: Dictionary, from_index: int) -> Array:
    var origin: Dictionary = {}
    for s in active_sections(siege):
        if int(s["index"]) == from_index:
            origin = s
            break
    if origin.is_empty():
        return []
    var neighbors: Array = []
    for s in active_sections(siege):
        if int(s["index"]) != from_index and _dist(origin,s) <= 4.5:
            neighbors.append(s)
    neighbors.sort_custom(func(a,b): return int(a["index"]) < int(b["index"]))
    return neighbors

static func wall_route(siege: Dictionary, start: int, finish: int) -> Array:
    if start == finish:
        return [start]
    var visited: Dictionary = {start:true}
    var parents: Dictionary = {}
    var queue: Array = [start]
    var at: int = 0
    while at < queue.size():
        var now: int = int(queue[at])
        at += 1
        for neighbor in _wall_neighbors(siege,now):
            var next: int = int(neighbor["index"])
            if visited.has(next):
                continue
            visited[next] = true
            parents[next] = now
            queue.append(next)
            if next == finish:
                var out: Array = [finish]
                while int(out[0]) != start:
                    out.push_front(int(parents[out[0]]))
                return out
    return []

static func _section_by_index(siege: Dictionary, index: int) -> Dictionary:
    for wall in active_sections(siege):
        if int(wall["index"]) == index:
            return wall
    return {}

static func _side(target: Dictionary) -> String:
    var dx: float = float(target["x"])-18.0
    var dz: float = float(target["z"])
    if absf(dx) > absf(dz):
        return "east" if dx > 0.0 else "west"
    return "south" if dz > 0.0 else "north"

static func split_guards(weights: Dictionary, count: int = 5) -> Dictionary:
    var sum_weights: float = 0.0
    for side in weights:
        sum_weights += maxf(0.0,float(weights[side]))
    if sum_weights <= 0.0:
        return {}
    var allocation: Dictionary = {}
    var fractions: Array = []
    var allocated: int = 0
    for side in weights:
        var expected: float = float(count)*maxf(0.0,float(weights[side]))/sum_weights
        allocation[side] = int(floor(expected))
        allocated += int(allocation[side])
        fractions.append({"side":side,"fraction":expected-floor(expected)})
    fractions.sort_custom(func(a,b): return float(a["fraction"]) > float(b["fraction"]) if not is_equal_approx(float(a["fraction"]),float(b["fraction"])) else String(a["side"]) < String(b["side"]))
    for i in range(count-allocated):
        allocation[fractions[i % fractions.size()]["side"]] = int(allocation[fractions[i % fractions.size()]["side"]])+1
    return allocation

static func tick_guards(battle: Dictionary, dt: float) -> void:
    var siege: Dictionary = battle.get("siege",{})
    if siege.is_empty():
        return
    var attackers: Array = []
    for squad in battle.get("squads",[]):
        if int(squad["team"]) != int(siege["defender_team"]) and not bool(squad.get("reserve",false)):
            for man in squad["men"]:
                if float(man["hp"]) > 0.0 and not bool(man.get("escaped",false)):
                    attackers.append(man)
                    break
    var weights: Dictionary = {}
    for soldier in attackers:
        var side: String = _side(soldier)
        weights[side] = int(weights.get(side,0))+1
    var towers: Array = tower_nodes(siege)
    for squad in battle.get("squads",[]):
        if not bool(squad.get("guard_post",false)) or squad["men"].is_empty():
            continue
        var man: Dictionary = squad["men"][0]
        if float(man["hp"]) <= 0.0:
            continue
        var home: Dictionary = _section_by_index(siege,int(squad["tower_index"]))
        if home.is_empty():
            man["elevation"] = 0.0
            squad["guard_post"] = false
            continue
        if float(battle["elapsed"]) - float(squad.get("guard_last_order",-100.0)) > 4.0:
            squad["guard_last_order"] = float(battle["elapsed"])
            var allocation: Dictionary = split_guards(weights,GUARDS_PER_TOWER)
            var slots: Array = []
            for side in ["north","east","south","west"]:
                for i in range(int(allocation.get(side,0))):
                    slots.append(side)
            var slot: int = int(squad["guard_slot"])
            var target: Dictionary = {}
            if slot < slots.size():
                var desired: String = String(slots[slot])
                for candidate in active_sections(siege):
                    if _side(candidate) == desired and (target.is_empty() or _dist(home,candidate)<_dist(home,target)):
                        target = candidate
            if target.is_empty():
                var next_tower: Dictionary = {}
                for t in towers:
                    if int(t["index"]) != int(home["index"]) and (next_tower.is_empty() or _dist(home,t)<_dist(home,next_tower)):
                        next_tower = t
                target = next_tower if not next_tower.is_empty() else home
            var route: Array = wall_route(siege,int(squad.get("wall_index",home["index"])),int(target["index"]))
            squad["wall_route"] = route
            squad["guard_goal"] = int(target["index"])
        var route: Array = squad.get("wall_route",[])
        if route.is_empty():
            continue
        var node: Dictionary = _section_by_index(siege,int(route[0]))
        if node.is_empty():
            squad["wall_route"] = []
            continue
        var dst := Vector2(float(node["x"]),float(node["z"]))
        var src := Vector2(float(man["x"]),float(man["z"]))
        var distance: float = src.distance_to(dst)
        if distance < .25:
            squad["wall_index"] = int(node["index"])
            route.pop_front()
            squad["wall_route"] = route
        else:
            var move: Vector2 = src.move_toward(dst,GUARD_PATROL_SPEED*dt)
            man["x"] = move.x
            man["z"] = move.y
            man["elevation"] = float(node["height"])
            squad["anchor"] = {"x":move.x,"z":move.y}
            siege["guard_patrol_steps"] = int(siege.get("guard_patrol_steps",0))+1

static func start_ladder(state: Dictionary, battle: Dictionary, unit_id: int) -> Dictionary:
    var siege: Dictionary = battle.get("siege",{})
    if siege.is_empty():
        return {"ok":false,"reason":"Käimas ei ole piiramist"}
    for squad in battle["squads"]:
        if int(squad["unit_id"]) != unit_id:
            continue
        if int(squad["team"]) != int(siege["attacker_team"]) or String(squad["role"]) not in ["melee","ranged"]:
            return {"ok":false,"reason":"Redelit saavad ehitada vaid ründavad jalaväelased"}
        if battle.get("siege",{}).get("works",[]).any(func(w): return int(w.get("owner",-1)) == unit_id):
            return {"ok":false,"reason":"Salk juba ehitab redelit"}
        var city: Dictionary = {}
        for t in state.get("cities",[]):
            if int(t["team"]) == int(squad["team"]) and float(t["resources"].get("wood",0.0)) >= LADDER_WOOD:
                city = t
                break
        if city.is_empty():
            return {"ok":false,"reason":"Redel vajab ründaja linna laost 18 puitu"}
        var wall: Dictionary = nearest_intact(siege,float(squad["anchor"]["x"]),float(squad["anchor"]["z"]))
        if wall.is_empty():
            return {"ok":false,"reason":"Müür on juba langenud"}
        city["resources"]["wood"] = float(city["resources"]["wood"])-LADDER_WOOD
        siege["wood_spent"] = float(siege["wood_spent"])+LADDER_WOOD
        var id: int = int(siege["next_work_id"])
        siege["next_work_id"] = id+1
        siege["works"].append({"id":id,"kind":"ladder","owner":unit_id,"team":int(squad["team"]),"wall_index":int(wall["index"]),"progress":0.0,"duration":LADDER_SECONDS,"ready":false,"climbed":0})
        squad["combat_mode"] = "manual"
        squad["move_target"] = {"x":float(wall["x"])-4.5,"z":float(wall["z"])}
        return {"ok":true,"reason":"Redel ehitamisel: 30 s, 18 puitu"}
    return {"ok":false,"reason":"Salk puudub"}

static func tick_ladders(battle: Dictionary, dt: float) -> void:
    var siege: Dictionary = battle.get("siege",{})
    if siege.is_empty():
        return
    for work in siege.get("works",[]):
        if String(work.get("kind","")) not in ["ladder","tower"] or bool(work.get("destroyed",false)):
            continue
        if String(work.get("kind","")) == "tower" and not bool(work.get("arrived",false)):
            continue
        var owner: Dictionary = {}
        for squad in battle["squads"]:
            if int(squad["unit_id"]) == int(work["owner"]):
                owner = squad
                break
        if owner.is_empty() or owner["men"].is_empty():
            continue
        var wall: Dictionary = _section_by_index(siege,int(work["wall_index"]))
        if wall.is_empty():
            work["destroyed"] = true
            continue
        if not bool(work["ready"]):
            work["progress"] = minf(float(work["duration"]),float(work["progress"])+dt)
            if float(work["progress"]) >= float(work["duration"]):
                work["ready"] = true
            continue
        var waiting: Array = []
        for man in owner["men"]:
            if float(man["hp"]) > 0.0 and not bool(man.get("on_wall",false)):
                waiting.append(man)
        if waiting.is_empty():
            continue
        # Demonstration of individual wall access: 2 parallel climbing lanes.
        var elapsed: float = float(work.get("climb_clock",0.0))+dt
        work["climb_clock"] = elapsed
        if elapsed < 3.0:
            continue
        work["climb_clock"] = 0.0
        var climbed: int = 0
        for man in waiting:
            if climbed >= 2:
                break
            if _dist(man,wall) > 7.0:
                continue
            var index: int = int(work["climbed"])+climbed
            man["x"] = float(wall["x"]) + float(index % 5 - 2)*.62
            man["z"] = float(wall["z"]) + float(int(index / 5))*.6
            man["elevation"] = float(wall["height"])
            man["on_wall"] = true
            climbed += 1
        work["climbed"] = int(work["climbed"])+climbed

const CAMP_WOOD: float = 80.0
const CAMP_SECONDS: float = 60.0
const STONES_PER_MINUTE: int = 4
const STONE_INTERVAL: float = 15.0

static func start_camp(state: Dictionary, battle: Dictionary) -> Dictionary:
    var siege: Dictionary = battle.get("siege",{})
    if siege.is_empty():
        return {"ok":false,"reason":"Piiramist ei toimu"}
    for work in siege.get("works",[]):
        if String(work.get("kind","")) == "camp" and not bool(work.get("destroyed",false)):
            return {"ok":false,"reason":"Piiramislaager on juba olemas"}
    var attacker: int = int(siege["attacker_team"])
    var camp_worker: Dictionary = {}
    for squad in battle["squads"]:
        if int(squad["team"]) == attacker and String(squad["kind"]) in ["bronze_catapult","catapult"]:
            camp_worker = squad
            break
    if camp_worker.is_empty():
        return {"ok":false,"reason":"Piiramislaager vajab ründaja katapulti"}
    var supply_city: Dictionary = {}
    for city in state.get("cities",[]):
        if int(city["team"]) == attacker and float(city["resources"].get("wood",0.0)) >= CAMP_WOOD:
            supply_city = city
            break
    if supply_city.is_empty():
        return {"ok":false,"reason":"Piiramislaager vajab 80 puitu"}
    supply_city["resources"]["wood"] = float(supply_city["resources"]["wood"])-CAMP_WOOD
    siege["wood_spent"] = float(siege["wood_spent"])+CAMP_WOOD
    var id: int = int(siege["next_work_id"])
    siege["next_work_id"] = id+1
    siege["works"].append({"id":id,"kind":"camp","owner":int(camp_worker["unit_id"]),"team":attacker,
        "x":float(camp_worker["anchor"]["x"])-4.0,"z":float(camp_worker["anchor"]["z"]),
        "progress":0.0,"duration":CAMP_SECONDS,"ready":false,"stones":0,
        "production_clock":0.0,"produced":0,"distributed":0})
    return {"ok":true,"reason":"Piiramislaager: 60 s ehitust ja seejärel 4 kivi/min"}

static func tick_camps(battle: Dictionary,dt: float) -> void:
    var siege: Dictionary = battle.get("siege",{})
    if siege.is_empty():
        return
    for camp in siege.get("works",[]):
        if String(camp.get("kind","")) != "camp" or bool(camp.get("destroyed",false)):
            continue
        if not bool(camp["ready"]):
            camp["progress"] = minf(float(camp["duration"]),float(camp["progress"])+dt)
            if float(camp["progress"]) >= float(camp["duration"]):
                camp["ready"] = true
            continue
        camp["production_clock"] = float(camp["production_clock"])+dt
        while float(camp["production_clock"])+.000001 >= STONE_INTERVAL:
            camp["production_clock"] = float(camp["production_clock"])-STONE_INTERVAL
            camp["stones"] = int(camp["stones"])+1
            camp["produced"] = int(camp["produced"])+1
        for squad in battle["squads"]:
            if String(squad["kind"]) not in ["bronze_catapult","catapult"] or int(squad["team"]) != int(camp["team"]):
                continue
            for man in squad["men"]:
                if int(camp["stones"]) <= 0 or float(man["hp"]) <= 0.0:
                    continue
                if _dist(man,camp) > 9.0 or int(man.get("ammo",0)) >= 6:
                    continue
                var reload: int = mini(6-int(man["ammo"]),int(camp["stones"]))
                man["ammo"] = int(man["ammo"])+reload
                camp["stones"] = int(camp["stones"])-reload
                camp["distributed"] = int(camp["distributed"])+reload


# V131 siege-assault-v108 building times and prices (seconds in this test clock).
const TOWER_WOOD: float = 75.0
const TOWER_SECONDS: float = 120.0
const RAM_WOOD: float = 55.0
const RAM_SECONDS: float = 90.0

static func start_assault_work(state: Dictionary,battle: Dictionary,unit_id: int,kind: String) -> Dictionary:
    if kind not in ["tower","ram"]:
        return {"ok":false,"reason":"Tundmatu piiramisvahend"}
    var siege: Dictionary = battle.get("siege",{})
    if siege.is_empty() or bool(siege.get("captured",false)):
        return {"ok":false,"reason":"Piiramist ei toimu"}
    var actor: Dictionary = {}
    for squad in battle.get("squads",[]):
        if int(squad.get("unit_id",-1)) == unit_id:
            actor = squad
            break
    if actor.is_empty() or int(actor["team"]) != int(siege["attacker_team"]) or String(actor.get("role","")) not in ["melee","ranged"]:
        return {"ok":false,"reason":"Vaja ründaja elusat jalaväesalka"}
    if actor.get("men",[]).filter(func(m): return float(m.get("hp",0.0)) > 0.0).is_empty():
        return {"ok":false,"reason":"Salk ei ole võitlusvõimeline"}
    for work in siege.get("works",[]):
        if not bool(work.get("destroyed",false)) and int(work.get("owner",-1)) == unit_id:
            return {"ok":false,"reason":"Salk ehitab juba piiramisvahendit"}
    var walls: Array = active_sections(siege)
    if kind == "ram":
        walls = walls.filter(func(w): return String(w.get("type","")) in ["gatehouse","palisade"])
    else:
        walls = walls.filter(func(w): return bool(w.get("walkable",false)))
    if walls.is_empty():
        return {"ok":false,"reason":"Tervet sobivat müürilõiku pole"}
    var wall: Dictionary = walls[0]
    for candidate in walls:
        if (kind == "ram" and String(candidate["type"]) == "gatehouse" and String(wall["type"]) != "gatehouse") or (kind != "ram" and _dist(candidate,actor["anchor"]) < _dist(wall,actor["anchor"])):
            wall = candidate
    var wood: float = RAM_WOOD if kind == "ram" else TOWER_WOOD
    var supply: Dictionary = {}
    for city in state.get("cities",[]):
        if int(city.get("team",-1)) == int(actor["team"]) and float(city["resources"].get("wood",0.0)) >= wood:
            supply = city
            break
    if supply.is_empty():
        return {"ok":false,"reason":"Vajalik puit puudub: %.0f" % wood}
    supply["resources"]["wood"] = float(supply["resources"]["wood"])-wood
    siege["wood_spent"] = float(siege.get("wood_spent",0.0))+wood
    var id: int = int(siege.get("next_work_id",1))
    siege["next_work_id"] = id+1
    var px: float = float(actor["anchor"]["x"])
    var pz: float = float(actor["anchor"]["z"])
    var dx: float = px-float(wall["x"])
    var dz: float = pz-float(wall["z"])
    var length: float = maxf(.001,sqrt(dx*dx+dz*dz))
    var dest_x: float = float(wall["x"])+dx/length*3.8
    var dest_z: float = float(wall["z"])+dz/length*3.8
    siege["works"].append({"id":id,"kind":kind,"owner":unit_id,"team":int(actor["team"]),
        "wall_index":int(wall["index"]),"progress":0.0,"duration":RAM_SECONDS if kind == "ram" else TOWER_SECONDS,
        "ready":false,"arrived":false,"destroyed":false,"x":px,"z":pz,
        "target_x":dest_x,"target_z":dest_z,"hp":240.0 if kind == "ram" else 300.0,
        "hit_clock":0.0,"hits":0,"climbed":0})
    actor["combat_mode"] = "manual"
    actor["move_target"] = {}
    actor["attack_target"] = -1
    return {"ok":true,"reason":"%s: %.0f puitu, %.0f s ehitust" % ["Ramm" if kind == "ram" else "Piiramistorn",wood,RAM_SECONDS if kind == "ram" else TOWER_SECONDS]}

static func tick_assault_works(battle: Dictionary,dt: float) -> void:
    var siege: Dictionary = battle.get("siege",{})
    if siege.is_empty():
        return
    for work in siege.get("works",[]):
        var kind: String = String(work.get("kind",""))
        if kind not in ["tower","ram"] or bool(work.get("destroyed",false)):
            continue
        var wall: Dictionary = _section_by_index(siege,int(work.get("wall_index",-1)))
        if wall.is_empty():
            work["destroyed"] = true
            continue
        var actor: Dictionary = {}
        for squad in battle.get("squads",[]):
            if int(squad.get("unit_id",-1)) == int(work["owner"]):
                actor = squad
                break
        if actor.is_empty():
            work["destroyed"] = true
            continue
        var crew: Array = actor.get("men",[]).filter(func(m): return float(m.get("hp",0.0)) > 0.0 and not bool(m.get("escaped",false)))
        if crew.is_empty():
            work["destroyed"] = true
            continue
        if not bool(work.get("ready",false)):
            work["progress"] = minf(float(work["duration"]),float(work.get("progress",0.0))+dt)
            if float(work["progress"]) >= float(work["duration"]):
                work["ready"] = true
            continue
        if not bool(work.get("arrived",false)):
            # The crew follows the vehicle; only physically nearby men can push it.
            actor["move_target"] = {"x":float(work["x"]),"z":float(work["z"])}
            if not crew.any(func(m): return _dist(m,work) < 8.0):
                continue
            var from := Vector2(float(work["x"]),float(work["z"]))
            var to := Vector2(float(work["target_x"]),float(work["target_z"]))
            var next: Vector2 = from.move_toward(to,(1.0 if kind == "ram" else 1.15)*dt)
            work["x"] = next.x
            work["z"] = next.y
            if next.distance_to(to) < .3:
                work["arrived"] = true
                actor["move_target"] = {"x":next.x,"z":next.y}
            continue
        if kind == "tower":
            continue # Tick_ladders gives the crew two wall-climbing lanes.
        if not crew.any(func(m): return _dist(m,work) < 9.0):
            actor["move_target"] = {"x":float(work["x"]),"z":float(work["z"])}
            continue
        var defended: bool = false
        for squad in battle.get("squads",[]):
            if int(squad["team"]) == int(work["team"]):
                continue
            for man in squad["men"]:
                if float(man["hp"]) > 0.0 and not bool(man.get("on_wall",false)) and _dist(man,work) < 5.0:
                    defended = true
                    break
            if defended:
                break
        if defended:
            continue
        work["hit_clock"] = float(work.get("hit_clock",0.0))+dt
        while float(work["hit_clock"]) >= 3.0 and float(wall.get("hp",0.0)) > 0.0:
            work["hit_clock"] = float(work["hit_clock"])-3.0
            var hits: int = mini(12,crew.size())
            damage_structure(siege,int(wall["index"]),"battering_ram",28.0*float(hits)/12.0)
            work["hits"] = int(work.get("hits",0))+1
            siege["ram_hits"] = int(siege.get("ram_hits",0))+1

static func tick_wall_melee(battle: Dictionary,dt: float) -> void:
    var siege: Dictionary = battle.get("siege",{})
    if siege.is_empty():
        return
    var fighters: Array = []
    for squad in battle.get("squads",[]):
        if bool(squad.get("reserve",false)) or bool(squad.get("retreated",false)):
            continue
        for man in squad["men"]:
            if float(man.get("hp",0.0)) <= 0.0 or bool(man.get("escaped",false)):
                continue
            if bool(man.get("on_wall",false)) or (bool(squad.get("guard_post",false)) and float(man.get("elevation",0.0)) > 1.0):
                fighters.append({"squad":squad,"man":man})
                if bool(man.get("on_wall",false)):
                    man["cooldown"] = maxf(0.0,float(man.get("cooldown",0.0))-dt)
    for attacker in fighters:
        var squad: Dictionary = attacker["squad"]
        var man: Dictionary = attacker["man"]
        if float(man["hp"]) <= 0.0 or float(man.get("cooldown",0.0)) > 0.0:
            continue
        var enemy: Dictionary = {}
        var closest: float = INF
        for target in fighters:
            if int(target["squad"]["team"]) == int(squad["team"]) or float(target["man"]["hp"]) <= 0.0:
                continue
            var other: Dictionary = target["man"]
            var distance: float = _dist(man,other)
            if absf(float(man.get("elevation",0.0))-float(other.get("elevation",0.0))) > 1.6 or distance > 1.5:
                continue
            if distance < closest:
                enemy = target
                closest = distance
        if enemy.is_empty():
            continue
        var victim: Dictionary = enemy["man"]
        var target_squad: Dictionary = enemy["squad"]
        var damage: float = maxf(.25,float(squad.get("dmg",8.0))/maxf(1.0,float(squad["men"].size())))
        var old_hp: float = float(victim["hp"])
        victim["hp"] = maxf(0.0,old_hp-damage)
        man["cooldown"] = .75
        man["damage"] = float(man.get("damage",0.0))+old_hp-float(victim["hp"])
        squad["damage"] = float(squad.get("damage",0.0))+old_hp-float(victim["hp"])
        siege["wall_melee_hits"] = int(siege.get("wall_melee_hits",0))+1
        if old_hp > 0.0 and float(victim["hp"]) <= 0.0:
            man["kills"] = int(man.get("kills",0))+1
            squad["kills"] = int(squad.get("kills",0))+1
            var key: String = str(target_squad["team"])
            battle["casualties"][key] = int(battle["casualties"].get(key,0))+1

static func order_occupation(battle: Dictionary,unit_id: int) -> Dictionary:
    var siege: Dictionary = battle.get("siege",{})
    if siege.is_empty() or not bool(siege.get("gate_open",false)):
        return {"ok":false,"reason":"Linnavärav peab olema läbi murtud"}
    for squad in battle.get("squads",[]):
        if int(squad.get("unit_id",-1)) != unit_id:
            continue
        if int(squad["team"]) != int(siege["attacker_team"]) or String(squad.get("role","")) not in ["melee","ranged"]:
            return {"ok":false,"reason":"Vali ründaja jalavägi"}
        squad["combat_mode"] = "manual"
        squad["attack_target"] = -1
        squad["assault_order"] = true
        squad["assault_stage"] = 0
        squad["move_target"] = {"x":5.0,"z":0.0}
        return {"ok":true,"reason":"Salk läheb värava kaudu linnasüdant hõivama"}
    return {"ok":false,"reason":"Salk puudub"}

static func tick_occupation(battle: Dictionary,dt: float) -> void:
    var siege: Dictionary = battle.get("siege",{})
    if siege.is_empty() or bool(siege.get("captured",false)):
        return
    var core: Dictionary = {"x":18.0,"z":0.0}
    var inside: Dictionary = {}
    var defended: bool = false
    for squad in battle.get("squads",[]):
        if bool(squad.get("reserve",false)) or bool(squad.get("retreated",false)):
            continue
        for man in squad["men"]:
            if float(man.get("hp",0.0)) <= 0.0 or bool(man.get("escaped",false)) or bool(man.get("on_wall",false)):
                continue
            if int(squad["team"]) == int(siege["defender_team"]):
                if _dist(man,core) < 14.0:
                    defended = true
            elif int(squad["team"]) == int(siege["attacker_team"]) and _dist(man,core) < 12.0:
                inside[int(squad["unit_id"])] = true
    if inside.is_empty() or defended:
        siege["occupation_seconds"] = 0.0
        return
    siege["occupation_seconds"] = float(siege.get("occupation_seconds",0.0))+dt
    siege["keep_hp"] = maxf(0.0,float(siege.get("keep_hp",600.0))-38.0*dt*minf(3.0,float(inside.size())))
    if float(siege["keep_hp"]) <= 0.0:
        siege["captured"] = true
        siege["capture_at"] = float(battle.get("elapsed",0.0))
