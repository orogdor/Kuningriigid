extends RefCounted
## V3.2: bounded V131-inspired morale, fatigue, ally panic and rout steering.
## Saves contain only ordinary Dictionaries/Arrays. Tactical approximation,
## not a bit-identical copy of historical-tactics-v92.js.
const Surface = preload("res://scripts/core/battle_surface_v131.gd")
const BASE_MORALE: Dictionary = {"mobilized":64.0,"standard":82.0,"elite":94.0}
const ROUT_THRESHOLD: float = 24.0
const PANIC_RADIUS: float = 18.0

static func living(squad: Dictionary) -> Array:
    var out: Array = []
    for m in squad.get("men",[]):
        if float(m.get("hp",0.0))>0.0 and not bool(m.get("escaped",false)):
            out.append(m)
    return out

static func initialize(battle: Dictionary) -> void:
    for s in battle.get("squads",[]):
        if not s.has("start_men"):
            s["start_men"] = living(s).size()
        if not s.has("morale_shock"):
            s["morale_shock"] = 0.0
        for m in s.get("men",[]):
            if not m.has("morale"):
                m["morale"] = float(BASE_MORALE.get(String(s.get("grade","standard")),82.0))
            if not m.has("fatigue"):
                m["fatigue"] = 0.0
            if not m.has("routing"):
                m["routing"] = false
            if not m.has("fighting"):
                m["fighting"] = false

static func apply_hit(battle: Dictionary, defender: Dictionary, soldier: Dictionary, attacker: Dictionary, killed: bool) -> void:
    var shock: float = 2.0 if killed else 0.40
    if not attacker.is_empty():
        var center: Dictionary = defender.get("anchor",{})
        var dx: float = float(attacker.get("x",0.0))-float(center.get("x",0.0))
        var dz: float = float(attacker.get("z",0.0))-float(center.get("z",0.0))
        var facing: float = float(defender.get("formation_facing",0.0))
        if dx*cos(facing)+dz*sin(facing)<-1.0:
            shock += 1.5
            battle["flank_shocks"] = int(battle.get("flank_shocks",0))+1
    defender["morale_shock"] = minf(18.0,float(defender.get("morale_shock",0.0))+shock)
    soldier["last_hit_at"] = float(battle.get("elapsed",0.0))

static func route_squad(battle: Dictionary, squad: Dictionary, automatic: bool = true) -> void:
    if bool(squad.get("routing",false)):
        return
    squad["routing"] = true
    squad["rout_at"] = float(battle.get("elapsed",0.0))
    squad["combat_mode"] = "auto"
    squad["attack_target"] = -1
    squad["move_target"] = {}
    squad["formation_manual"] = false
    squad["escape_candidates"] = []
    squad["escape_index"] = 0
    squad["escape_exit"] = {}
    for m in living(squad):
        m["routing"] = true
        m["terrain_path"] = []
    if automatic:
        battle["morale_routs"] = int(battle.get("morale_routs",0))+1
    else:
        battle["ordered_retreats"] = int(battle.get("ordered_retreats",0))+1

static func update(battle: Dictionary, dt: float) -> void:
    initialize(battle)
    var squads: Array = battle.get("squads",[])
    for s in squads:
        if bool(s.get("reserve",false)) or bool(s.get("retreated",false)):
            continue
        var men: Array = living(s)
        if men.is_empty():
            continue
        var own: Dictionary = s.get("anchor",{})
        var friends: int = 0
        var panic: bool = false
        for other in squads:
            if other == s or int(other.get("team",-1)) != int(s.get("team",-2)) or bool(other.get("reserve",false)) or bool(other.get("retreated",false)) or living(other).is_empty():
                continue
            var p: Dictionary = other.get("anchor",{})
            var dist2: float = Vector2(float(own.get("x",0.0))-float(p.get("x",0.0)),float(own.get("z",0.0))-float(p.get("z",0.0))).length_squared()
            if dist2 < PANIC_RADIUS*PANIC_RADIUS:
                if bool(other.get("routing",false)):
                    panic = true
                else:
                    friends += 1
        var loss: float = 1.0-float(men.size())/float(maxi(1,int(s.get("start_men",men.size()))))
        var shock: float = float(s.get("morale_shock",0.0))
        var grade: String = String(s.get("grade","standard"))
        var base: float = float(BASE_MORALE.get(grade,82.0))
        var panic_count: int = 0
        var total: float = 0.0
        var anchor := Vector2(float(own.get("x",0.0)),float(own.get("z",0.0)))
        var dispersed: float = 0.0
        for m in men:
            dispersed += maxf(0.0,Vector2(float(m.get("x",0.0)),float(m.get("z",0.0))).distance_to(anchor)-4.0)
        var cohesion: float = clampf(1.0-dispersed/float(men.size())/12.0,0.0,1.0)
        s["tactical_cohesion"] = cohesion
        for m in men:
            var exertion: float = -1.5*dt
            if bool(m.get("fighting",false)):
                exertion = 3.2*dt
            elif bool(m.get("moving",false)):
                exertion = .8*dt
            m["fatigue"] = clampf(float(m.get("fatigue",0.0))+exertion,0.0,100.0)
            m["fighting"] = false
            var commander: float = minf(5.0,float(maxi(1,int(s.get("army_level",1)))-1)*.55)
            var target: float = base+commander-loss*70.0+(7.0 if friends>0 else 0.0)-(9.0 if panic else 0.0)-shock-float(m["fatigue"])*.07-(1.0-cohesion)*10.0
            m["morale"] = clampf(float(m.get("morale",base))+(target-float(m.get("morale",base)))*minf(1.0,dt*.5),0.0,100.0)
            if float(m["morale"])<ROUT_THRESHOLD:
                m["routing"] = true
            elif float(m["morale"])>46.0 and not bool(s.get("routing",false)):
                m["routing"] = false
            if bool(m.get("routing",false)):
                panic_count += 1
            total += float(m["morale"])
        s["morale"] = total/float(men.size())
        s["morale_shock"] = maxf(0.0,shock-dt*.5)
        if not bool(s.get("routing",false)) and (float(panic_count)>float(men.size())*.45 or (loss>.60 and float(s["morale"])<38.0)):
            route_squad(battle,s,true)
        if bool(s.get("routing",false)):
            for m in men:
                m["routing"] = true

static func _candidate_exits(squad: Dictionary,battle: Dictionary,surface: Dictionary) -> Array:
    var hx: float = Surface.half_x(surface)
    var hz: float = Surface.half_z(surface)
    var own: Dictionary = squad.get("anchor",{})
    var px: float = float(own.get("x",0.0))
    var pz: float = float(own.get("z",0.0))
    var candidates: Array = []
    var dangerous: Vector2 = Vector2.ZERO
    var close: float = INF
    for opponent in battle.get("squads",[]):
        if int(opponent.get("team",-1))==int(squad.get("team",-2)) or bool(opponent.get("reserve",false)) or bool(opponent.get("retreated",false)) or bool(opponent.get("routing",false)) or living(opponent).is_empty():
            continue
        var a: Dictionary = opponent.get("anchor",{})
        var target := Vector2(float(a.get("x",0.0)),float(a.get("z",0.0)))
        var d: float = Vector2(px,pz).distance_to(target)
        if d<close:
            dangerous = target
            close = d
    for side in range(4):
        for i in range(9):
            var t: float = (float(i)-4.0)/4.0
            var inside: Vector2
            var outside: Vector2
            if side<2:
                var x: float = (-hx if side==0 else hx)
                var z: float = clampf(pz+t*minf(60.0,hz*.55),-hz+5.0,hz-5.0)
                inside = Vector2(x+2.0 if side==0 else x-2.0,z)
                outside = Vector2(x-8.0 if side==0 else x+8.0,z)
            else:
                var z2: float = (-hz if side==2 else hz)
                var x2: float = clampf(px+t*minf(60.0,hx*.55),-hx+5.0,hx-5.0)
                inside = Vector2(x2,z2+2.0 if side==2 else z2-2.0)
                outside = Vector2(x2,z2-8.0 if side==2 else z2+8.0)
            if not Surface.ground_open(surface,inside.x,inside.y,1.0):
                continue
            var distance: float = Vector2(px,pz).distance_to(inside)
            var toward: Vector2 = (inside-Vector2(px,pz)).normalized()
            var toward_enemy: float = maxf(0.0,toward.dot((dangerous-Vector2(px,pz)).normalized())) if close<30.0 else 0.0
            var own_side: bool = (side==0 and int(squad.get("side",-1))<0) or (side==1 and int(squad.get("side",-1))>0)
            var score: float = distance+(0.0 if own_side else 20.0)+toward_enemy*180.0
            candidates.append({"inside":{"x":inside.x,"z":inside.y},"outside":{"x":outside.x,"z":outside.y},"score":score})
    candidates.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
        return float(a["score"]) < float(b["score"])
    )
    return candidates

static func prepare_escape(battle: Dictionary,squad: Dictionary,surface: Dictionary) -> bool:
    if not bool(squad.get("routing",false)):
        return false
    if not squad.get("escape_exit",{}).is_empty():
        return true
    if float(battle.get("elapsed",0.0)) < float(squad.get("escape_retry_at",0.0)):
        return false
    if not squad.has("escape_candidates") or (squad["escape_candidates"] as Array).is_empty():
        squad["escape_candidates"] = _candidate_exits(squad,battle,surface)
        squad["escape_index"] = 0
    var choices: Array = squad.get("escape_candidates",[])
    var i: int = int(squad.get("escape_index",0))
    while i<choices.size() and int(battle.get("escape_budget",0))>0:
        battle["escape_budget"] = int(battle.get("escape_budget",0))-1
        var pick: Dictionary = choices[i]
        i += 1
        squad["escape_index"] = i
        var q: Dictionary = pick["inside"]
        var p: Dictionary = squad.get("anchor",{})
        var from := Vector2(float(p.get("x",0.0)),float(p.get("z",0.0)))
        var to := Vector2(float(q["x"]),float(q["z"]))
        if Surface.edge_open(surface,from,to) or not Surface.route(surface,from,to).is_empty():
            squad["escape_exit"] = pick
            squad["move_target"] = q.duplicate(true)
            battle["escape_routes"] = int(battle.get("escape_routes",0))+1
            return true
        battle["escape_failed_routes"] = int(battle.get("escape_failed_routes",0))+1
    if i>=choices.size():
        squad["escape_candidates"] = []
        squad["escape_retry_at"] = float(battle.get("elapsed",0.0))+5.0
    return false

static func advance_exit_goal(squad: Dictionary) -> void:
    var exit: Dictionary = squad.get("escape_exit",{})
    if exit.is_empty():
        return
    var inside: Dictionary = exit["inside"]
    var alive: Array = living(squad)
    if alive.is_empty():
        return
    var nearby: int = 0
    for m in alive:
        if Vector2(float(m["x"]),float(m["z"])).distance_to(Vector2(float(inside["x"]),float(inside["z"]))) < 5.0:
            nearby += 1
    if nearby>=maxi(1,int(ceil(float(alive.size())*.65))):
        squad["move_target"] = exit["outside"].duplicate(true)

static func speed_factor(man: Dictionary) -> float:
    return clampf(1.0-float(man.get("fatigue",0.0))*.0025,.75,1.0)
