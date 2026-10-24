extends RefCounted
## V131 individual-battle-v91.js: FIRST PARTIAL individual soldier port.
## Faithful: 24/12/1 men, max 500, reserve whole squads, men HP aggregated
## to source units, manual/auto orders, line/column/hold, ammo, flee at edge.
## Approximate: tactics, projectile accuracy, morale and collision. V1.6 siege fixture is isolated.
const Military = preload("res://scripts/core/military_port.gd")
const XP = preload("res://scripts/core/army_experience_port.gd")
const Doctrine = preload("res://scripts/core/battle_doctrine_v131.gd")
const Projectiles = preload("res://scripts/core/projectile_rules_v131.gd")
const Terrain = preload("res://scripts/core/battle_terrain_v131.gd")
const Siege = preload("res://scripts/core/siege_port_v131.gd")
const CityFortifications = preload("res://scripts/core/city_fortification_port.gd")
const CityCapture = preload("res://scripts/core/city_capture_port.gd")
const BattleSurface = preload("res://scripts/core/battle_surface_v131.gd")
const Formations = preload("res://scripts/core/battle_formations_v131.gd")
const Morale = preload("res://scripts/core/battle_morale_v131.gd")
const CampaignRetreat = preload("res://scripts/core/campaign_retreat_v131.gd")
const MAX_MEN: int = 500
const FIXED_STEP: float = 0.10
const MAX_STEPS_PER_TICK: int = 80
const FIELD_X: float = 32.0
const FIELD_Z: float = 25.0
const FORMATIONS: Array[String] = ["line", "column", "shield_wall", "spear_wall", "hold", "loose", "skirmish", "charge"]
const BOWS: Array[String] = ["slinger", "archer", "bronze_archer", "iron_archer", "javelinman", "chariot"]
const CATAPULTS: Array[String] = ["bronze_catapult", "catapult"]

static func men_per_squad(kind: String) -> int:
    if kind in ["scout", "militia", "bronze_catapult", "catapult"]:
        return 1
    if kind in ["cavalry", "chariot", "knight", "heavy_cavalry"]:
        return 12
    return 24

static func _army(state: Dictionary, army_id: int) -> Dictionary:
    for a in state.get("armies", []):
        if int(a.get("id", -1)) == army_id:
            return a
    return {}

static func _candidate_units(state: Dictionary, army: Dictionary) -> Array:
    return Military.units_for(state, army)

static func _squad(unit: Dictionary, army: Dictionary, side: int, lane: int) -> Dictionary:
    var definition: Dictionary = Military.UNITS[String(unit["kind"])]
    var count: int = men_per_squad(String(unit["kind"]))
    var stats: Dictionary = XP.unit_stats(definition, unit, float(army.get("xp", 0.0)))
    var squad: Dictionary = {
        "unit_id": int(unit["id"]), "army_id": int(army["id"]), "team": int(army["team"]),
        "kind": String(unit["kind"]), "grade": String(unit.get("grade","standard")), "formation": "line", "combat_mode": "auto",
        "formation_x": 0.0, "anchor": {"x": float(side) * 17.0, "z": float(lane) * 9.0},
        "side": side, "men": [], "reserve": false, "retreated": false,
        "engagement_target": -1, "deployment_z": float(lane)*9.0, "tactical_role": "advance", "cohesion": 0.0,
        "morale":82.0,"morale_shock":0.0,"start_men":0,"routing":false,
        "formation_manual":false,"formation_progress":0.0,"formation_strength":0.0,"formation_changed_at":-10.0,
        "attack_target": -1, "move_target": {}, "damage": 0.0, "kills": 0,
        "max_hp": float(stats["hp"]), "army_level":XP.army_level(float(army.get("xp",0.0))), "role": "siege" if String(unit["kind"]) in CATAPULTS else ("ranged" if String(unit["kind"]) in BOWS else "melee"),
        "range": float(stats["range"]), "speed": float(stats["speed"]), "dmg": float(stats["dmg"])
    }
    var man_hp: float = maxf(.01, float(unit.get("maxHp", stats["hp"])) / float(count))
    # A partially damaged campaign unit keeps its total damage and surviving men.
    var remaining: float = maxf(0.0, float(unit.get("hp", 0.0)))
    var x_anchor: float = float(squad["anchor"]["x"])
    var z_anchor: float = float(squad["anchor"]["z"])
    for i in range(count):
        var cols: int = 6 if count >= 24 else 4
        var spacing: float = 6.2 if String(unit["kind"]) == "chariot" else (4.1 if count == 12 else 1.05)
        var row: int = int(floor(float(i) / float(cols)))
        var px: float = x_anchor + float(side) * float(row) * spacing
        var pz: float = z_anchor + (float(i % cols) - float(cols - 1) * .5) * spacing
        var amount: float = minf(man_hp, remaining)
        remaining = maxf(0.0, remaining - amount)
        squad["men"].append({"id": i, "x": px, "z": pz, "hp": amount,
            "max_hp": man_hp, "cooldown": .12 * float(i % 4),
            "ammo": Projectiles.STONE_AMMO if String(unit["kind"]) in CATAPULTS else (20 if String(unit["kind"]) in ["slinger","javelinman"] else (48 if String(unit["kind"]) == "chariot" else (Projectiles.BOW_AMMO if String(unit["kind"]) in BOWS else 0))),
            "radius":2.0 if String(unit["kind"]) == "chariot" else (1.05 if String(unit["kind"]) in CATAPULTS or String(unit["kind"]) == "cavalry" else .34),
            "shots_fired":0,"moving":false,"fighting":false,
            "morale":float(Morale.BASE_MORALE.get(String(unit.get("grade","standard")),82.0)),"fatigue":0.0,"routing":false,
            "escaped": false, "kills": 0, "damage": 0.0, "team": int(army["team"]), "charge_distance":0.0, "charge_cooldown":0.0})
    squad["start_men"] = _alive(squad).size()
    return squad

static func start(state: Dictionary, first_id: int, second_id: int) -> Dictionary:
    Military.setup(state)
    if not state.get("individual_battle", {}).is_empty() or not state.get("active_battle", {}).is_empty():
        return {"ok": false, "reason": "Lahing on juba pooleli"}
    var a: Dictionary = _army(state, first_id)
    var b: Dictionary = _army(state, second_id)
    if a.is_empty() or b.is_empty() or int(a["team"]) == int(b["team"]):
        return {"ok": false, "reason": "Vaja kahe erineva riigi armeed"}
    if int(a["c"]) != int(b["c"]) or int(a["r"]) != int(b["r"]):
        return {"ok": false, "reason": "Armeed peavad olema samal maailmaruudul"}
    var first: Array = _candidate_units(state, a)
    var second: Array = _candidate_units(state, b)
    if first.is_empty() or second.is_empty():
        return {"ok": false, "reason": "Mõlemal armeel on vaja elusaid üksusi"}
    var contenders: Array = [first, second]
    var squads: Array = []
    var slots: Array = [0, 0]
    var used: int = 0
    var reserve_count: int = 0
    # As in V131: admit whole squads, alternating the two sides.
    var progress: bool = true
    while progress:
        progress = false
        for side_idx in range(2):
            var queue: Array = contenders[side_idx]
            var k: int = int(slots[side_idx])
            if k >= queue.size():
                continue
            progress = true
            slots[side_idx] = k + 1
            var source_unit: Dictionary = queue[k]
            var side: int = -1 if side_idx == 0 else 1
            var n: int = men_per_squad(String(source_unit["kind"]))
            var live_n: int = maxi(1, int(ceil(float(n) * float(source_unit["hp"]) / maxf(0.001, float(source_unit["maxHp"])))))
            var squad: Dictionary = _squad(source_unit, a if side_idx == 0 else b, side, k - 1)
            if used + live_n > MAX_MEN:
                squad["reserve"] = true
                reserve_count += live_n
            else:
                used += live_n
            squads.append(squad)
    # Stop campaign marching; the battle has its own explicit coordinates.
    for army in [a, b]:
        army["path"] = []
        army["waypoint"] = 0
        army["travel_clock"] = 0.0
    state["individual_battle"] = {
        "army_a": first_id, "army_b": second_id,
        "world_c": int(a["c"]), "world_r": int(a["r"]),
        "squads": squads, "initial_men": used, "reserve_men": reserve_count,
        "elapsed": 0.0, "accumulator": 0.0, "steps": 0,
        "casualties": {}, "shots": 0, "melee_hits": 0, "stone_shots":0, "friendly_rock_hits":0,"missed_arrows":0,
        "projectiles": [], "impacts": 0, "surface":{}, "terrain_routes":0,"terrain_blocked":0, "obstacles":Terrain.seeded_obstacles(int(a["c"]),int(a["r"])), "model_tactic_version": 19,
        "formation_changes":0,"archer_repositions":0,"cavalry_flanks":0,"friendly_lanes_blocked":0,
        "morale_routs":0,"ordered_retreats":0,"escape_routes":0,"escape_failed_routes":0,"flank_shocks":0,
        "state_version": 13, "finished": false
    }
    # Use actually constructed palisades only when the defending city's
    # garrison fights at its own fortified cell. Ordinary field battles and
    # unfortified towns keep the established preview battle rules unchanged.
    var active: Dictionary = state["individual_battle"]
    for town in state.get("cities",[]):
        var tile: Vector2i = Vector2i(int(a["c"]),int(a["r"]))
        if not CityFortifications.fortified(town,tile):
            continue
        var defender_team: int = int(town.get("team",-1))
        var attacker_team: int = int(b["team"]) if defender_team == int(a["team"]) else int(a["team"])
        if defender_team != int(a["team"]) and defender_team != int(b["team"]):
            continue
        var connected: Dictionary = Siege.from_city(town,tile,attacker_team,defender_team)
        if not connected.is_empty():
            active["siege"] = connected
            # The city's defending team must spawn INSIDE the eastern walls,
            # regardless of which army was passed as the first argument.
            if int(a["team"]) == defender_team:
                for line in active["squads"]:
                    var side_x: float = 17.0 if int(line["team"]) == defender_team else -17.0
                    var shift_x: float = side_x-float(line["anchor"]["x"])
                    line["anchor"]["x"] = side_x
                    line["side"] = 1 if int(line["team"]) == defender_team else -1
                    for man in line["men"]:
                        man["x"] = float(man["x"])+shift_x
            Siege.attach_guards(active)
            active["linked_city_siege"] = true
        break
    state["individual_battles_started"] = int(state.get("individual_battles_started", 0)) + 1
    return {"ok": true, "reason": "Individuaalne lahing alustas (%d meest, reservis %d)" % [int(active["initial_men"]), reserve_count]}

static func _apply_formation(squad: Dictionary) -> void:
    # Keep existing coordinates: targets are approached naturally during _step.
    # Older v1.3 instantly teleported each figure when switching formations.
    squad["formation_x"] = 0.0
    squad["formation_dirty"] = true
    squad["formation_dress_time"] = 0.0

static func formation_slot(squad: Dictionary, i: int) -> Vector2:
    return Formations.slot(squad,i)

static func _man_distance(a: Dictionary, b: Dictionary) -> float:
    return Vector2(float(a["x"])-float(b["x"]),float(a["z"])-float(b["z"])).length()

static func _hash_key(x: float,z: float) -> String:
    return "%d:%d" % [int(floor(x / 3.0)),int(floor(z / 3.0))]

static func _build_bins(battle: Dictionary) -> Dictionary:
    var bins: Dictionary = {}
    for squad in battle["squads"]:
        if bool(squad.get("reserve",false)) or bool(squad.get("retreated",false)):
            continue
        for m in squad["men"]:
            # Migration for fights saved by V3.0 (soldiers had no team key).
            if not m.has("team"):
                m["team"] = int(squad["team"])
            if float(m["hp"]) > 0.0 and not bool(m.get("escaped",false)):
                var key: String = _hash_key(float(m["x"]),float(m["z"]))
                if not bins.has(key):
                    bins[key] = []
                bins[key].append(m)
    return bins

static func _update_bins(bins: Dictionary,actor: Dictionary,old_x: float,old_z: float) -> void:
    var before: String = _hash_key(old_x,old_z)
    var after: String = _hash_key(float(actor["x"]),float(actor["z"]))
    if before == after:
        return
    if bins.has(before):
        bins[before].erase(actor)
    if not bins.has(after):
        bins[after] = []
    bins[after].append(actor)

static func _collision_free(bins: Dictionary,actor: Dictionary,nx: float,nz: float,obstacles: Array = [], siege: Dictionary = {}, surface: Dictionary = {}) -> bool:
    var body: float = float(actor.get("radius",.34))
    if not Terrain.passable(nx,nz,body,obstacles) or not Siege.ground_open(siege,nx,nz,body):
        return false
    if not BattleSurface.edge_open(surface,Vector2(float(actor["x"]),float(actor["z"])),Vector2(nx,nz),body):
        return false
    var cell_x: int = int(floor(nx / 3.0))
    var cell_z: int = int(floor(nz / 3.0))
    # Radius can exceed one bin for chariots: scan all touching buckets.
    var reach: int = maxi(1,int(ceil((body+2.0)/3.0)))
    for dz in range(-reach,reach+1):
        for dx in range(-reach,reach+1):
            var key: String = "%d:%d" % [cell_x+dx,cell_z+dz]
            for neighbor in bins.get(key,[]):
                if neighbor == actor or float(neighbor["hp"]) <= 0.0 or bool(neighbor.get("escaped",false)):
                    continue
                var d_x: float = nx-float(neighbor["x"])
                var d_z: float = nz-float(neighbor["z"])
                var gap: float = body+float(neighbor.get("radius",.34))+.025
                if d_x*d_x+d_z*d_z < gap*gap:
                    return false
    return true

static func _friendly_shot_clear(bins: Dictionary, shooter: Dictionary, target: Dictionary) -> bool:
    var sx: float = float(shooter["x"])
    var sz: float = float(shooter["z"])
    var dx: float = float(target["x"])-sx
    var dz: float = float(target["z"])-sz
    var dist: float = sqrt(dx*dx+dz*dz)
    if dist < 1.5:
        return true
    var len2: float = maxf(1.0,dist*dist)
    var team: int = int(shooter.get("team",-1))
    # Only hashed cells intersecting the line, not all 500 men.
    var steps: int = maxi(1,int(ceil(dist/2.0)))
    var seen: Dictionary = {}
    for i in range(1,steps):
        var t: float = float(i)/float(steps)
        var gx: int = int(floor((sx+dx*t)/3.0))
        var gz: int = int(floor((sz+dz*t)/3.0))
        for iz in range(-1,2):
            for ix in range(-1,2):
                var key: String = "%d:%d" % [gx+ix,gz+iz]
                if seen.has(key):
                    continue
                seen[key] = true
                for other in bins.get(key,[]):
                    if other == shooter or float(other.get("hp",0.0)) <= 0.0 or bool(other.get("escaped",false)) or int(other.get("team",-2)) != team:
                        continue
                    var ax: float = float(other["x"])-sx
                    var az: float = float(other["z"])-sz
                    var projection: float = (ax*dx+az*dz)/len2
                    if projection <= .035 or projection >= .965:
                        continue
                    var ex: float = ax-dx*projection
                    var ez: float = az-dz*projection
                    var radius: float = float(other.get("radius",.34))+.20
                    if ex*ex+ez*ez < radius*radius:
                        return false
    return true

static func _apply_damage(battle: Dictionary,target_squad: Dictionary,target_man: Dictionary, damage: float, attacker_id: int, friendly_rock: bool = false) -> void:
    if damage <= 0.0 or float(target_man["hp"]) <= 0.0:
        return
    var hp_before: float = float(target_man["hp"])
    target_man["hp"] = maxf(0.0,hp_before-damage)
    var dealt: float = hp_before-float(target_man["hp"])
    if dealt > 0.0:
        Morale.apply_hit(battle,target_squad,target_man,{},float(target_man["hp"]) <= 0.0)
    for origin in battle["squads"]:
        if int(origin["unit_id"]) == attacker_id:
            origin["damage"] = float(origin["damage"])+dealt
            if hp_before > 0.0 and float(target_man["hp"]) <= 0.0:
                origin["kills"] = int(origin["kills"])+1
            break
    if hp_before > 0.0 and float(target_man["hp"]) <= 0.0:
        var key: String = str(target_squad["team"])
        battle["casualties"][key] = int(battle["casualties"].get(key,0))+1
    if friendly_rock:
        battle["friendly_rock_hits"] = int(battle.get("friendly_rock_hits",0))+1


static func _impact(battle: Dictionary, projectile: Dictionary) -> void:
    if String(projectile.get("kind","arrow")) == "rock":
        Siege.apply_rock(battle,projectile)
        # V131: radial damage is not faction-filtered. Own troops can be hit.
        var from_team: int = int(projectile.get("from_team",-1))
        var x: float = float(projectile["to_x"])
        var z: float = float(projectile["to_z"])
        for target_squad in battle["squads"]:
            if bool(target_squad.get("reserve",false)) or bool(target_squad.get("retreated",false)):
                continue
            for target_man in target_squad["men"]:
                if float(target_man["hp"]) <= 0.0 or bool(target_man.get("escaped",false)):
                    continue
                var d: float = Vector2(x,z).distance_to(Vector2(float(target_man["x"]),float(target_man["z"])))
                var radius: float = float(projectile.get("radius",Projectiles.STONE_RADIUS))
                var damage: float = Projectiles.stone_damage(float(projectile["damage"]),d,radius)
                if damage > 0.0:
                    damage *= Siege.parapet_multiplier(battle.get("siege",{}),target_squad,"rock")
                    _apply_damage(battle,target_squad,target_man,damage,int(projectile["from_unit"]),int(target_squad["team"]) == from_team)
        battle["impacts"] = int(battle.get("impacts",0))+1
        return
    if not bool(projectile.get("hit",true)):
        battle["missed_arrows"] = int(battle.get("missed_arrows",0))+1
        battle["impacts"] = int(battle.get("impacts",0))+1
        return
    var to_team: int = int(projectile["to_team"])
    var to_unit: int = int(projectile["to_unit"])
    var man_id: int = int(projectile["to_man"])
    for target_squad in battle["squads"]:
        if int(target_squad["unit_id"]) != to_unit or int(target_squad["team"]) != to_team:
            continue
        for target_man in target_squad["men"]:
            if int(target_man["id"]) == man_id and float(target_man["hp"]) > 0.0 and not bool(target_man.get("escaped",false)):
                var arrow_damage: float = float(projectile["damage"])*Siege.parapet_multiplier(battle.get("siege",{}),target_squad,"arrow")
                for origin in battle["squads"]:
                    if int(origin.get("unit_id",-1)) == int(projectile.get("from_unit",-2)):
                        arrow_damage *= Formations.damage_factor(origin,target_squad,target_man,{"x":float(projectile["x"]),"z":float(projectile["z"])},true)
                        break
                if not Siege.shot_blocked(battle.get("siege",{}),{"x":float(projectile["x"]),"z":float(projectile["z"])},target_man,float(projectile.get("from_y",0.0)),float(target_man.get("elevation",0.0))):
                    _apply_damage(battle,target_squad,target_man,arrow_damage,int(projectile["from_unit"]))
                battle["impacts"] = int(battle.get("impacts",0))+1
                return

static func _advance_projectiles(battle: Dictionary) -> void:
    var pending: Array = []
    for projectile in battle.get("projectiles", []):
        if float(projectile["land_at"]) <= float(battle["elapsed"]):
            _impact(battle,projectile)
        else:
            pending.append(projectile)
    battle["projectiles"] = pending

static func order(state: Dictionary, unit_id: int, mode: String, target: Dictionary = {}) -> bool:
    var battle: Dictionary = state.get("individual_battle", {})
    if battle.is_empty():
        return false
    for squad in battle["squads"]:
        if int(squad["unit_id"]) != unit_id or bool(squad["reserve"]):
            continue
        if mode == "auto" or mode == "manual":
            if bool(squad.get("routing",false)) and squad.has("rout_at"):
                return false # A routed squad cannot recover instantly by changing its control mode.
            squad["combat_mode"] = mode
            squad["routing"] = false
            squad["attack_target"] = -1
            squad["move_target"] = {}
            return true
        if mode == "tactic":
            var role: String = String(target.get("name", "advance"))
            if role in ["advance", "hold", "flank", "support"]:
                squad["tactical_role"] = role
                return true
        if mode == "auto_formation":
            squad["formation_manual"] = false
            squad["formation_changed_at"] = -10.0
            return true
        if mode == "formation":
            var value: String = String(target.get("name", "line"))
            if value in FORMATIONS and Formations.change(squad,value,float(battle.get("elapsed",0.0)),true):
                return true
        if mode == "move" or mode == "retreat":
            squad["combat_mode"] = "manual"
            if mode == "retreat":
                Morale.route_squad(battle,squad,false)
                return true
            if bool(squad.get("routing",false)):
                return false
            squad["routing"] = false
            var surface: Dictionary = battle.get("surface",{})
            var hx: float = BattleSurface.half_x(surface)
            var hz: float = BattleSurface.half_z(surface)
            squad["move_target"] = {"x": float(squad["side"]) * (hx+8.0), "z": float(squad["anchor"]["z"])} if mode == "retreat" else {"x": clampf(float(target.get("x",0.0)),-hx,hx), "z": clampf(float(target.get("z",0.0)),-hz,hz)}
            squad["attack_target"] = -1
            return true
        if mode == "attack":
            var enemy_id: int = int(target.get("unit_id", -1))
            for other in battle["squads"]:
                if int(other["unit_id"]) == enemy_id and int(other["team"]) != int(squad["team"]):
                    squad["combat_mode"] = "manual"
                    squad["routing"] = false
                    squad["move_target"] = {}
                    squad["attack_target"] = enemy_id
                    return true
    return false

static func _alive(squad: Dictionary) -> Array:
    var men: Array = []
    for man in squad["men"]:
        if float(man["hp"]) > 0.000001 and not bool(man["escaped"]):
            men.append(man)
    return men

static func _nearest_enemy_squad(battle: Dictionary, squad: Dictionary) -> Dictionary:
    return Doctrine.choose_target(squad,battle["squads"])

static func _nearest_man(source: Dictionary, target_squad: Dictionary) -> Dictionary:
    var result: Dictionary = {}
    var best: float = INF
    for other in target_squad["men"]:
        if float(other["hp"]) <= 0.0 or bool(other["escaped"]):
            continue
        var dx: float = float(other["x"]) - float(source["x"])
        var dz: float = float(other["z"]) - float(source["z"])
        var d: float = dx * dx + dz * dz
        if d < best:
            best = d
            result = other
    return result

static func _step(battle: Dictionary, dt: float) -> void:
    var squads: Array = battle["squads"]
    battle["elapsed"] = float(battle["elapsed"]) + dt
    Siege.tick_guards(battle,dt)
    Siege.tick_ladders(battle,dt)
    Siege.tick_camps(battle,dt)
    Siege.tick_assault_works(battle,dt)
    _advance_projectiles(battle)
    Morale.update(battle,dt)
    battle["escape_budget"] = 2 if bool(battle.get("large_battle_test",false)) else 4
    var bins: Dictionary = _build_bins(battle)
    var terrain_search_budget: int = 2 if bool(battle.get("large_battle_test",false)) else 6 # at most two large A* searches per 0.1s
    for squad in squads:
        if bool(squad["reserve"]) or bool(squad["retreated"]) or _alive(squad).is_empty():
            continue
        var routing: bool = bool(squad.get("routing",false))
        var manual: bool = String(squad["combat_mode"]) == "manual" and not routing
        var guard_post: bool = bool(squad.get("guard_post",false))
        var surface: Dictionary = battle.get("surface",{})
        if bool(squad.get("assault_order",false)) and not routing:
            var staging: Vector2 = Vector2(5.0,0.0)
            var anchor_pos: Dictionary = squad.get("anchor",{})
            if int(squad.get("assault_stage",0)) == 0 and Vector2(float(anchor_pos.get("x",-17.0)),float(anchor_pos.get("z",0.0))).distance_to(staging) < 3.0:
                squad["assault_stage"] = 1
            squad["move_target"] = {"x":18.0,"z":0.0} if int(squad.get("assault_stage",0)) == 1 else {"x":5.0,"z":0.0}
        if routing:
            if float(battle["elapsed"]) < float(squad.get("escape_retry_at",0.0)):
                continue
            if not Morale.prepare_escape(battle,squad,surface):
                continue # Do not walk through cliffs while searching for an exit.
        var destination: Dictionary = squad.get("move_target", {})
        var enemy_squad: Dictionary = {}
        if not routing and (not manual or int(squad.get("attack_target",-1)) >= 0):
            enemy_squad = _nearest_enemy_squad(battle,squad)
        var wall_aim: Dictionary = Siege.artillery_target(battle,squad) if not manual and not routing else {}
        if not wall_aim.is_empty():
            enemy_squad = {"unit_id":-1,"team":int(battle["siege"]["defender_team"]),"kind":"wall","formation":"","anchor":wall_aim,"men":[]}
        var attack_mode: bool = not enemy_squad.is_empty()
        if manual and destination.is_empty() and int(squad.get("attack_target", -1)) < 0 and not bool(squad.get("formation_dirty",false)):
            continue
        var formation: String = String(squad["formation"])
        var can_march: bool = (routing or ((formation not in ["hold", "spear_wall"] and String(squad.get("tactical_role","advance")) != "hold") or manual)) and not guard_post
        var live_men: Array = _alive(squad)
        if live_men.is_empty():
            continue
        var total_x: float = 0.0
        var total_z: float = 0.0
        for man in live_men:
            total_x += float(man["x"])
            total_z += float(man["z"])
        var anchor_x: float = total_x / float(live_men.size())
        var anchor_z: float = total_z / float(live_men.size())
        squad["anchor"] = {"x": anchor_x, "z": anchor_z}
        if Formations.update(squad,enemy_squad,dt,float(battle["elapsed"])):
            battle["formation_changes"] = int(battle.get("formation_changes",0))+1
        formation = String(squad.get("formation","line"))
        can_march = (routing or ((formation not in ["hold", "spear_wall"] and String(squad.get("tactical_role","advance")) != "hold") or manual)) and not guard_post
        var dressing: bool = bool(squad.get("formation_dirty",false))
        if dressing:
            squad["formation_dress_time"] = float(squad.get("formation_dress_time",0.0)) + dt
            if float(squad["formation_dress_time"]) > 4.0:
                squad["formation_dirty"] = false
                dressing = false
        for man in live_men:
            if bool(man.get("on_wall",false)):
                continue # Siege 1.6: roof access visualized; wall-top melee remains unported.
            man["cooldown"] = maxf(0.0, float(man["cooldown"]) - dt)
            man["charge_cooldown"] = maxf(0.0,float(man.get("charge_cooldown",0.0))-dt)
            man["moving"] = false
            if not bool(man.get("on_wall",false)) and not surface.is_empty():
                man["elevation"] = BattleSurface.height(surface,float(man["x"]),float(man["z"]))
            var opponent: Dictionary = wall_aim if not wall_aim.is_empty() else (_nearest_man(man, enemy_squad) if attack_mode else {})
            var goal: Dictionary = destination if not destination.is_empty() else opponent
            if routing:
                var exit_data: Dictionary = squad.get("escape_exit",{})
                if not exit_data.is_empty():
                    var entrance: Dictionary = exit_data["inside"]
                    var end: Dictionary = exit_data["outside"]
                    # Several lanes at the exit avoid a 24-man pileup.
                    var spread: float = float((int(man.get("id",0)) % 7)-3)*.82
                    var crossing_horizontal: bool = absf(float(end["x"])) > BattleSurface.half_x(surface)
                    var adjusted_in: Dictionary = entrance.duplicate()
                    var adjusted_out: Dictionary = end.duplicate()
                    if crossing_horizontal:
                        adjusted_in["z"] = clampf(float(entrance["z"])+spread,-BattleSurface.half_z(surface)+2.0,BattleSurface.half_z(surface)-2.0)
                        adjusted_out["z"] = float(adjusted_in["z"])
                    else:
                        adjusted_in["x"] = clampf(float(entrance["x"])+spread,-BattleSurface.half_x(surface)+2.0,BattleSurface.half_x(surface)-2.0)
                        adjusted_out["x"] = float(adjusted_in["x"])
                    var d_exit: float = Vector2(float(man["x"]),float(man["z"])).distance_to(Vector2(float(adjusted_in["x"]),float(adjusted_in["z"])))
                    goal = adjusted_out if d_exit < 3.5 else adjusted_in
            if goal.is_empty() and dressing:
                var pos: Vector2 = formation_slot(squad,int(man["id"]))
                goal = {"x":pos.x,"z":pos.y}
            # V3.0: distant troops approach a formation-aligned frontage instead
            # of each soldier independently converging on a single enemy man.
            # At actual weapon contact the individual target takes precedence.
            if bool(battle.get("large_battle_test",false)) and not manual and attack_mode and destination.is_empty() and not opponent.is_empty() and live_men.size()>1:
                var enemy_anchor: Dictionary = enemy_squad.get("anchor",{})
                var own_anchor: Dictionary = squad["anchor"]
                var enemy_center := Vector2(float(enemy_anchor.get("x",0.0)),float(enemy_anchor.get("z",0.0)))
                var soldier_pos := Vector2(float(man["x"]),float(man["z"]))
                if soldier_pos.distance_to(enemy_center)>10.0:
                    var slot: Vector2 = formation_slot(squad,int(man["id"]))
                    var own_center := Vector2(float(own_anchor["x"]),float(own_anchor["z"]))
                    var offset: Vector2 = slot-own_center
                    var formed: Vector2 = enemy_center+Vector2(float(squad["side"])*3.0+offset.x*.25,offset.y*.8)
                    goal = {"x":formed.x,"z":formed.y}
            if not manual and attack_mode and destination.is_empty() and not opponent.is_empty():
                var tactic: String = String(squad.get("tactical_role","advance"))
                if tactic == "flank" and not Doctrine.mounted(String(enemy_squad.get("kind",""))):
                    var flank_side: float = -1.0 if int(squad["side"]) < 0 else 1.0
                    var flank_distance: float = 16.0 if bool(battle.get("large_battle_test",false)) else 5.0
                    var waypoint: Vector2 = Vector2(float(opponent["x"]),float(opponent["z"])+flank_side*flank_distance)
                    if Vector2(float(man["x"]),float(man["z"])).distance_to(waypoint) > 2.5:
                        goal = {"x":waypoint.x,"z":waypoint.y}
                elif tactic == "support" and String(squad["kind"]) in BOWS:
                    if _man_distance(man,opponent) < float(squad["range"])*.8:
                        goal = {"x":float(man["x"]),"z":float(man["z"])}
                if formation == "skirmish" and not bool(squad.get("routing",false)) and _man_distance(man,opponent) < float(squad["range"])*.75:
                    var back: Vector2 = Formations.skirmish_goal(squad,man,opponent)
                    goal = {"x":back.x,"z":back.y}
                    battle["archer_repositions"] = int(battle.get("archer_repositions",0))+1
            if not manual and formation == "charge" and not enemy_squad.is_empty() and not opponent.is_empty() and _man_distance(man,opponent)>12.0:
                var detour: Vector2 = Formations.mounted_flank(squad,enemy_squad)
                if Vector2(float(man["x"]),float(man["z"])).distance_to(detour)>6.0:
                    var offset: Vector2 = formation_slot(squad,int(man["id"]))-Vector2(float(squad["anchor"]["x"]),float(squad["anchor"]["z"]))
                    goal = {"x":detour.x+offset.x*.4,"z":detour.y+offset.y*.4}
                    if int(man["id"]) == 0 and not bool(squad.get("flank_counted",false)):
                        squad["flank_counted"] = true
                        battle["cavalry_flanks"] = int(battle.get("cavalry_flanks",0))+1
            if not manual and String(squad["kind"]) in ["cavalry","chariot"] and not enemy_squad.is_empty():
                var foe_kind: String = String(enemy_squad.get("kind",""))
                var braced: bool = foe_kind in ["spearman","bronze_spearman","pikeman","javelinman"] and String(enemy_squad.get("formation","")) == "spear_wall"
                if braced and _man_distance(man,enemy_squad["anchor"]) < 12.0:
                    var ax: float = float(man["x"])-float(enemy_squad["anchor"]["x"])
                    var az: float = float(man["z"])-float(enemy_squad["anchor"]["z"])
                    var norm: float = maxf(.001,sqrt(ax*ax+az*az))
                    goal = {"x":float(man["x"])+ax/norm*9.0,"z":float(man["z"])+az/norm*9.0+float(squad["side"])*3.0}
            if goal.is_empty():
                continue
            # Battlefield route: walking men avoid steep slopes, water and rivers.
            # Cache a personal route to avoid 192 BFS searches on every 0.1s tick.
            var point_now := Vector2(float(man["x"]),float(man["z"]))
            var desired := Vector2(float(goal["x"]),float(goal["z"]))
            var saved_waypoints: Array = man.get("terrain_path",[])
            if not surface.is_empty() and can_march and not guard_post and desired.distance_to(point_now)>1.8 and absf(desired.x)<=BattleSurface.half_x(surface) and absf(desired.y)<=BattleSurface.half_z(surface):
                var previous_goal: Dictionary = man.get("terrain_goal",{})
                var stale: bool = previous_goal.is_empty() or Vector2(float(previous_goal.get("x",0.0)),float(previous_goal.get("z",0.0))).distance_to(desired)>5.0
                if stale:
                    saved_waypoints = []
                if not saved_waypoints.is_empty():
                    var front: Dictionary = saved_waypoints[0]
                    if point_now.distance_to(Vector2(float(front["x"]),float(front["z"]))) < 1.15:
                        saved_waypoints.pop_front()
                if saved_waypoints.is_empty() and not BattleSurface.edge_open(surface,point_now,desired,float(man.get("radius",.34))):
                    if terrain_search_budget > 0 and float(battle["elapsed"]) >= float(man.get("terrain_retry_at",0.0)):
                        terrain_search_budget -= 1
                        saved_waypoints = BattleSurface.route(surface,point_now,desired)
                        battle["terrain_routes"] = int(battle.get("terrain_routes",0))+1
                        man["terrain_retry_at"] = float(battle["elapsed"]) + (4.0 if saved_waypoints.is_empty() else 0.8)
                man["terrain_goal"] = {"x":desired.x,"z":desired.y}
                man["terrain_path"] = saved_waypoints
                if not saved_waypoints.is_empty():
                    goal = saved_waypoints[0]
            else:
                man["terrain_path"] = []
            var dx: float = float(goal["x"]) - float(man["x"])
            var dz: float = float(goal["z"]) - float(man["z"])
            var distance: float = sqrt(dx * dx + dz * dz)
            var enemy_distance: float = _man_distance(man,opponent) if not opponent.is_empty() else INF
            var catapult: bool = String(squad["kind"]) in CATAPULTS
            var projectile: bool = (String(squad["kind"]) in BOWS or catapult) and int(man["ammo"]) > 0 and enemy_distance > 2.0
            var reach: float = float(squad["range"]) if projectile else 1.6
            # Source V131: shield wall sacrifices speed for better protection.
            var can_fire: bool = not routing and destination.is_empty() and not opponent.is_empty() and enemy_distance <= reach and float(man["cooldown"]) <= 0.0
            if can_fire and not projectile and not surface.is_empty() and absf(BattleSurface.height(surface,float(man["x"]),float(man["z"]))-BattleSurface.height(surface,float(opponent["x"]),float(opponent["z"])))>1.15:
                can_fire = false
            if can_fire and projectile and not catapult and not surface.is_empty() and not BattleSurface.line_of_sight(surface,point_now,Vector2(float(opponent["x"]),float(opponent["z"]))):
                can_fire = false
            if can_fire and projectile and not catapult and not _friendly_shot_clear(bins,man,opponent):
                can_fire = false
                battle["friendly_lanes_blocked"] = int(battle.get("friendly_lanes_blocked",0))+1
            if can_fire and projectile and not catapult and Siege.shot_blocked(battle.get("siege",{}),man,opponent,float(man.get("elevation",0.0)),float(opponent.get("elevation",0.0))):
                can_fire = false
            if can_fire:
                man["fighting"] = true
                var per_man: float = float(squad["dmg"]) / float(squad["men"].size() if guard_post else men_per_squad(String(squad["kind"])))
                if projectile:
                    man["ammo"] = int(man["ammo"]) - 1
                    man["shots_fired"] = int(man.get("shots_fired",0))+1
                    man["cooldown"] = Projectiles.STONE_RELOAD if catapult else (.95 if String(squad["kind"]) != "slinger" else 1.3)
                    battle["shots"] = int(battle["shots"]) + 1
                    var flight: float = Projectiles.STONE_FLIGHT if catapult else maxf(.12,enemy_distance/24.0)
                    var to_x: float = float(opponent["x"])
                    var to_z: float = float(opponent["z"])
                    var hit: bool = true
                    if catapult:
                        var aim: Dictionary = Projectiles.stone_landing(int(squad["unit_id"]),int(man["shots_fired"]),int(squad["team"]),int(squad.get("army_level",1)),to_x,to_z)
                        to_x = float(aim["x"])
                        to_z = float(aim["z"])
                        battle["stone_shots"] = int(battle.get("stone_shots",0))+1
                    else:
                        hit = Projectiles.bow_hit(int(squad["unit_id"]),int(man["id"]),int(man["shots_fired"]),enemy_distance,float(squad["range"]),bool(man.get("moving",false)),formation == "volley")
                    battle["projectiles"].append({"kind":"rock" if catapult else "arrow", "hit":hit,"from_unit":int(squad["unit_id"]),"from_team":int(squad["team"]),"to_unit":int(enemy_squad["unit_id"]),"to_team":int(enemy_squad["team"]),"to_man":int(opponent["id"]),"damage":per_man if not catapult else float(squad["dmg"]),"radius":Projectiles.STONE_RADIUS if catapult else 0.0,"x":float(man["x"]),"z":float(man["z"]),"to_x":to_x,"to_z":to_z,"start_at":float(battle["elapsed"]),"land_at":float(battle["elapsed"])+flight,"from_y":float(man.get("elevation",0.0)),"weapon":String(squad["kind"])})
                else:
                    man["cooldown"] = .7
                    battle["melee_hits"] = int(battle["melee_hits"]) + 1
                    per_man *= Formations.damage_factor(squad,enemy_squad,opponent,man,false)
                    if formation == "charge" and float(man.get("charge_distance",0.0)) >= 6.0 and float(man.get("charge_cooldown",0.0)) <= 0.0:
                        if not (String(enemy_squad.get("formation","")) == "spear_wall" and float(enemy_squad.get("formation_strength",0.0)) > .55):
                            per_man *= 1.50
                        man["charge_distance"] = 0.0
                        man["charge_cooldown"] = 12.0
                    var hp_before: float = float(opponent["hp"])
                    opponent["hp"] = maxf(0.0,hp_before-per_man)
                    if float(opponent["hp"]) < hp_before:
                        Morale.apply_hit(battle,enemy_squad,opponent,man,float(opponent["hp"])<=0.0)
                    var dealt: float = hp_before-float(opponent["hp"])
                    man["damage"] = float(man["damage"])+dealt
                    squad["damage"] = float(squad["damage"])+dealt
                    if hp_before > 0.0 and float(opponent["hp"]) <= 0.0:
                        man["kills"] = int(man["kills"])+1
                        squad["kills"] = int(squad["kills"])+1
                        var key: String = str(enemy_squad["team"])
                        battle["casualties"][key] = int(battle["casualties"].get(key,0))+1
            elif (can_march or dressing) and distance > .1:
                var speed: float = float(squad["speed"]) * (1.0 if routing else Doctrine.formation_speed(formation)) * Morale.speed_factor(man)
                if not surface.is_empty():
                    speed *= BattleSurface.speed_factor(surface,point_now,Vector2(float(goal["x"]),float(goal["z"])))
                if dressing and not attack_mode and destination.is_empty():
                    speed = minf(speed,2.5)
                var fraction: float = minf(1.0, speed * dt / maxf(.001, distance))
                if attack_mode and projectile and not manual and enemy_distance < reach * .75:
                    fraction = 0.0
                var next_x: float = float(man["x"]) + dx * fraction
                var next_z: float = float(man["z"]) + dz * fraction
                var old_x: float = float(man["x"])
                var old_z: float = float(man["z"])
                if _collision_free(bins,man,next_x,next_z,battle.get("obstacles",[]),battle.get("siege",{}),surface):
                    man["x"] = next_x
                    man["z"] = next_z
                    man["moving"] = true
                    if formation == "charge":
                        man["charge_distance"] = minf(30.0,float(man.get("charge_distance",0.0))+Vector2(next_x-old_x,next_z-old_z).length())
                elif fraction > 0.0:
                    # Sidestep rather than repeatedly pushing directly into an ally.
                    var side_step: float = .35*dt
                    var tx: float = float(man["x"])-dz/maxf(.001,distance)*side_step
                    var tz: float = float(man["z"])+dx/maxf(.001,distance)*side_step
                    if _collision_free(bins,man,tx,tz,battle.get("obstacles",[]),battle.get("siege",{}),surface):
                        man["x"] = tx
                        man["z"] = tz
                        man["moving"] = true
                if not bool(man["moving"]) and not surface.is_empty():
                    battle["terrain_blocked"] = int(battle.get("terrain_blocked",0))+1
                if not surface.is_empty():
                    man["elevation"] = BattleSurface.height(surface,float(man["x"]),float(man["z"]))
                _update_bins(bins,man,old_x,old_z)
                if float(man["x"]) < -BattleSurface.half_x(surface) or float(man["x"]) > BattleSurface.half_x(surface) or float(man["z"]) < -BattleSurface.half_z(surface) or float(man["z"]) > BattleSurface.half_z(surface):
                    man["escaped"] = true
            if not routing and not destination.is_empty() and distance <= 1.1:
                squad["move_target"] = {}
        if not _alive(squad).is_empty():
            continue
        for survivor in squad["men"]:
            if bool(survivor["escaped"]) and float(survivor["hp"]) > 0.0:
                squad["retreated"] = true
                break
    Siege.tick_wall_melee(battle,dt)
    Siege.tick_occupation(battle,dt)
    battle["steps"] = int(battle["steps"]) + 1

static func _team_alive(battle: Dictionary, team: int) -> bool:
    for squad in battle["squads"]:
        if int(squad["team"]) == team and not bool(squad["reserve"]) and not _alive(squad).is_empty():
            return true
    return false

static func _finish(state: Dictionary, battle: Dictionary, world_nav = null) -> void:
    # Men are persisted to source units ONCE. Reserve units are untouched.
    for squad in battle["squads"]:
        if bool(squad["reserve"]):
            continue
        for u in state.get("military_units", []):
            if int(u["id"]) != int(squad["unit_id"]):
                continue
            var total: float = 0.0
            for man in squad["men"]:
                if float(man["hp"]) > 0.0:
                    # Escaped men survived the battle; do not count retreat as death.
                    total += float(man["hp"])
            u["hp"] = minf(float(u["maxHp"]), total)
            break
    var teams: Array = []
    for id in ["army_a", "army_b"]:
        var army: Dictionary = _army(state, int(battle[id]))
        if not army.is_empty():
            teams.append(int(army["team"]))
    var winner: int = -1
    if bool(battle.get("siege",{}).get("captured",false)):
        winner = int(battle["siege"]["attacker_team"])
    elif teams.size() == 2:
        var first_alive: bool = _team_alive(battle, int(teams[0]))
        var second_alive: bool = _team_alive(battle, int(teams[1]))
        if first_alive != second_alive:
            winner = int(teams[0]) if first_alive else int(teams[1])
    for army_id in ["army_a", "army_b"]:
        var army: Dictionary = _army(state, int(battle[army_id]))
        if army.is_empty():
            continue
        var won: bool = int(army["team"]) == winner
        var damage: float = 0.0
        var killed: int = 0
        for squad in battle["squads"]:
            if int(squad["army_id"]) == int(army["id"]):
                damage += float(squad["damage"])
                killed += int(squad["kills"])
        army["xp"] = XP.reward_xp(float(army.get("xp", 0.0)), damage, killed, won) if not Military.units_for(state, army).is_empty() else 0.0
        army["level"] = XP.army_level(float(army["xp"]))
    # Persist damage first; only a completed occupied keep changes allegiance.
    # Capture before retreat so defeated armies cannot retreat into their
    # former city. Ordinary field victories do not seize a town.
    var linked: Dictionary = battle.get("siege",{})
    if bool(linked.get("linked_city",false)):
        for town in state.get("cities",[]):
            if int(town.get("c",-999)) != int(linked.get("city_home_c",linked.get("city_c",-1))) or int(town.get("r",-999)) != int(linked.get("city_home_r",linked.get("city_r",-1))):
                continue
            if CityFortifications.apply_siege_damage(town,linked):
                state["revision"] = int(state.get("revision",0)) + 1
            break
    var capture_result: Dictionary = CityCapture.capture_after_siege(state,linked)
    var retreats: Array = CampaignRetreat.apply_after_battle(state,battle,winner,world_nav)
    state["battle_log"].append({"retreats":retreats.duplicate(true),"world_c":int(battle.get("world_c",-1)),"world_r":int(battle.get("world_r",-1)),"time":float(state.get("seconds", 0.0)), "mode":"individual_preview_18", "winner":winner,
        "initial_men":int(battle["initial_men"]),"reserve_men":int(battle["reserve_men"]),
        "casualties":battle["casualties"].duplicate(true), "shots":int(battle["shots"]), "impacts":int(battle.get("impacts",0)), "steps":int(battle["steps"]), "model_tactic_version":19, "terrain_routes":int(battle.get("terrain_routes",0)),"terrain_blocked":int(battle.get("terrain_blocked",0)), "formation_changes":int(battle.get("formation_changes",0)), "archer_repositions":int(battle.get("archer_repositions",0)), "cavalry_flanks":int(battle.get("cavalry_flanks",0)), "friendly_lanes_blocked":int(battle.get("friendly_lanes_blocked",0)), "morale_routs":int(battle.get("morale_routs",0)), "ordered_retreats":int(battle.get("ordered_retreats",0)), "escape_routes":int(battle.get("escape_routes",0)), "escape_failed_routes":int(battle.get("escape_failed_routes",0)), "flank_shocks":int(battle.get("flank_shocks",0)), "stone_shots":int(battle.get("stone_shots",0)), "friendly_rock_hits":int(battle.get("friendly_rock_hits",0)), "missed_arrows":int(battle.get("missed_arrows",0)), "siege": battle.get("siege",{}).duplicate(true),"city_capture":capture_result.duplicate(true),"test_only":not bool(linked.get("linked_city",false))})
    state["battle_cooldown_until"] = float(state.get("seconds", 0.0)) + 30.0
    state["individual_battles_finished"] = int(state.get("individual_battles_finished", 0)) + 1
    state["battles_finished"] = int(state.get("battles_finished", 0)) + 1
    state["individual_battle"] = {}

static func tick(state: Dictionary, dt: float, world_nav = null) -> void:
    var battle: Dictionary = state.get("individual_battle", {})
    if battle.is_empty() or dt <= 0.0:
        return
    battle["accumulator"] = float(battle.get("accumulator", 0.0)) + dt
    var count: int = 0
    while float(battle["accumulator"]) + .0000001 >= FIXED_STEP and count < MAX_STEPS_PER_TICK:
        battle["accumulator"] = float(battle["accumulator"]) - FIXED_STEP
        _step(battle, FIXED_STEP)
        count += 1
        var first: Dictionary = _army(state, int(battle["army_a"]))
        var second: Dictionary = _army(state, int(battle["army_b"]))
        var siege: Dictionary = battle.get("siege",{})
        var is_over: bool = false
        if siege.is_empty():
            is_over = not _team_alive(battle,int(first.get("team",-1))) or not _team_alive(battle,int(second.get("team",-1))) or float(battle["elapsed"]) > 300.0
        else:
            is_over = bool(siege.get("captured",false)) or not _team_alive(battle,int(siege["attacker_team"])) or float(battle["elapsed"]) > 900.0
        if first.is_empty() or second.is_empty() or is_over:
            _finish(state, battle, world_nav)
            break
