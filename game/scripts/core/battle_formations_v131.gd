extends RefCounted
## V3.1: bounded squad-level port of formations-v94.js (V131 source).
## Uses one pass through living squad members, never pairwise all-soldier searches.
## Auto formation, facing, cohesion and defence are battle-model approximations.
const OPTIONS: Array[String] = ["line", "column", "shield_wall", "spear_wall", "hold", "loose", "skirmish", "charge"]
const SHIELDS: Array[String] = ["bronze_spearman", "infantry", "man_at_arms"]
const SPEARS: Array[String] = ["spearman", "bronze_spearman", "pikeman", "halberdier"]
const LIGHT: Array[String] = ["archer", "bronze_archer", "iron_archer", "slinger", "javelinman", "chariot"]
const MOUNTED: Array[String] = ["cavalry", "bronze_cavalry", "chariot", "knight", "heavy_cavalry"]

static func valid_for(kind: String, formation: String) -> bool:
    if formation in ["line", "column", "hold"]:
        return true
    if formation == "shield_wall":
        return kind in SHIELDS
    if formation == "spear_wall":
        return kind in SPEARS
    if formation in ["loose", "skirmish"]:
        return kind in LIGHT
    if formation == "charge":
        return kind in MOUNTED
    return false

static func shape(formation: String, count: int) -> Dictionary:
    var cols: int = 6 if count >= 24 else 4
    var width: float = 1.05
    var depth: float = 1.05
    if formation == "column":
        cols = 3
    elif formation == "shield_wall":
        cols = 6
        width = .76
        depth = .95
    elif formation == "spear_wall":
        cols = 4
        width = .9
    elif formation in ["loose", "skirmish"]:
        width = 1.6
        depth = 1.6
    elif formation == "charge":
        width = 4.1
        depth = 4.1
    return {"columns":mini(cols,maxi(1,count)),"width":width,"depth":depth}

static func slot(squad: Dictionary, index: int) -> Vector2:
    var count: int = maxi(1,int(squad.get("men",[]).size()))
    var f: String = String(squad.get("formation","line"))
    var p: Dictionary = shape(f,count)
    var cols: int = int(p["columns"])
    var rows: int = int(ceil(float(count)/float(cols)))
    var col: int = index%cols
    var row: int = int(index/cols)
    var width: float = float(p["width"])
    var depth: float = float(p["depth"])
    var kind: String = String(squad.get("kind",""))
    if kind == "chariot":
        width = 6.2
        depth = 6.2
    elif kind in MOUNTED:
        width = 4.1
        depth = 4.1
    # Wedge: each subsequent row grows by one, no teleporting on order change.
    if f == "charge":
        row = 0
        var used: int = 0
        while used+row+1 <= index:
            used += row+1
            row += 1
        cols = mini(row+1,count-used)
        col = index-used
        rows = int(ceil(sqrt(float(2*count))))
    var a: Dictionary = squad.get("anchor",{})
    var side: float = float(squad.get("side",1))
    return Vector2(float(a.get("x",0.0))+side*(float(row)-float(rows-1)*.5)*depth, float(a.get("z",0.0))+(float(col)-float(cols-1)*.5)*width)

static func desired_auto(squad: Dictionary, enemy: Dictionary) -> String:
    if enemy.is_empty():
        return "line"
    var a: Dictionary = squad.get("anchor",{})
    var b: Dictionary = enemy.get("anchor",{})
    var separation: float = Vector2(float(a.get("x",0.0))-float(b.get("x",0.0)),float(a.get("z",0.0))-float(b.get("z",0.0))).length()
    var kind: String = String(squad.get("kind",""))
    var threat_kind: String = String(enemy.get("kind",""))
    var role: String = String(squad.get("tactical_role","advance"))
    if role == "hold":
        return "hold"
    if kind in SPEARS and threat_kind in MOUNTED and separation < 36.0:
        return "spear_wall"
    if kind in SHIELDS and separation < 26.0:
        return "shield_wall"
    if kind in LIGHT:
        return "skirmish" if separation < 13.0 else ("loose" if separation < 48.0 else "line")
    if kind in MOUNTED and separation < 34.0 and separation > 7.0:
        if not (threat_kind in SPEARS and String(enemy.get("formation","")) == "spear_wall"):
            return "charge"
    return "line"

static func change(squad: Dictionary, formation: String, elapsed: float, manual: bool = true) -> bool:
    if not valid_for(String(squad.get("kind","")),formation) or bool(squad.get("routing",false)):
        return false
    if String(squad.get("formation","line")) != formation:
        squad["formation"] = formation
        squad["formation_progress"] = 0.0
        squad["formation_strength"] = 0.0
        squad["formation_changed_at"] = elapsed
        squad["formation_dirty"] = true
        squad["formation_dress_time"] = 0.0
    squad["formation_manual"] = manual
    return true

static func formation_time(formation: String) -> float:
    if formation in ["shield_wall", "spear_wall", "charge"]:
        return 4.0
    if formation in ["loose", "skirmish"]:
        return 3.0
    if formation == "hold":
        return 2.0
    return 0.0

static func update(squad: Dictionary,enemy: Dictionary,dt: float,elapsed: float) -> bool:
    var changed: bool = false
    if not bool(squad.get("formation_manual",false)) and not bool(squad.get("routing",false)) and not bool(squad.get("guard_post",false)):
        var desired: String = desired_auto(squad,enemy)
        if desired != String(squad.get("formation","line")) and elapsed-float(squad.get("formation_changed_at",-10.0)) >= 6.0:
            changed = change(squad,desired,elapsed,false)
    var a: Dictionary = squad.get("anchor",{})
    var b: Dictionary = enemy.get("anchor",{})
    var facing: float = float(squad.get("formation_facing",0.0 if int(squad.get("side",-1)) < 0 else PI))
    if not enemy.is_empty():
        var dx: float = float(b.get("x",0.0))-float(a.get("x",0.0))
        var dz: float = float(b.get("z",0.0))-float(a.get("z",0.0))
        if dx*dx+dz*dz > .01:
            var desired_facing: float = atan2(dz,dx)
            var diff: float = wrapf(desired_facing-facing,-PI,PI)
            var turning: float = .45 if String(squad.get("formation","line")) in ["shield_wall","spear_wall"] else 1.5
            facing += clampf(diff,-turning*dt,turning*dt)
    squad["formation_facing"] = facing
    var alive: int = 0
    var on_slot: int = 0
    var moved: int = 0
    for man in squad.get("men",[]):
        if float(man.get("hp",0.0)) <= 0.0 or bool(man.get("escaped",false)):
            continue
        alive += 1
        var target: Vector2 = slot(squad,int(man.get("id",0)))
        if Vector2(float(man.get("x",0.0)),float(man.get("z",0.0))).distance_to(target) < 2.2:
            on_slot += 1
        if bool(man.get("moving",false)):
            moved += 1
    var ratio: float = float(on_slot)/float(maxi(1,alive))
    squad["cohesion"] = ratio
    var form_time: float = formation_time(String(squad.get("formation","line")))
    var progress: float = float(squad.get("formation_progress",0.0))
    progress = clampf(progress + dt*(1.0 if ratio >= .50 else -.35),0.0,form_time)
    squad["formation_progress"] = progress
    squad["formation_strength"] = ratio * (progress/maxf(.001,form_time) if form_time>0.0 else 1.0) * minf(1.0,float(alive)/4.0)
    squad["formation_moving"] = moved > 0
    return changed

static func damage_factor(attacker: Dictionary,defender: Dictionary,defender_man: Dictionary,attacker_man: Dictionary,is_missile: bool) -> float:
    var f: String = String(defender.get("formation","line"))
    var strength: float = clampf(float(defender.get("formation_strength",0.0)),0.0,1.0)
    var origin := Vector2(float(attacker_man.get("x",0.0)),float(attacker_man.get("z",0.0)))
    var target := Vector2(float(defender_man.get("x",0.0)),float(defender_man.get("z",0.0)))
    var direction: Vector2 = origin-target
    if direction.length_squared() > .0001:
        direction = direction.normalized()
    var facing: float = float(defender.get("formation_facing",0.0))
    var frontal: bool = direction.dot(Vector2(cos(facing),sin(facing))) > .5
    if f == "shield_wall" and frontal:
        return 1.0-strength*(.40 if is_missile else .22)
    if f == "spear_wall" and frontal and not is_missile and String(attacker.get("kind","")) in MOUNTED:
        return 1.0-strength*.45
    if f in ["loose","skirmish"]:
        return 1.0-strength*.22 if is_missile else 1.10
    return 1.0

static func skirmish_goal(squad: Dictionary,man: Dictionary,opponent: Dictionary) -> Vector2:
    var my_pos := Vector2(float(man.get("x",0.0)),float(man.get("z",0.0)))
    var enemy := Vector2(float(opponent.get("x",0.0)),float(opponent.get("z",0.0)))
    var outward: Vector2 = my_pos-enemy
    if outward.length_squared() < .01:
        outward = Vector2(float(squad.get("side",-1)),0.0)
    outward = outward.normalized()
    var lateral: Vector2 = Vector2(-outward.y,outward.x)*float((int(man.get("id",0))%3)-1)*.5
    return my_pos+outward*maxf(2.0,float(squad.get("speed",3.0))*2.2)+lateral

static func mounted_flank(squad: Dictionary,enemy: Dictionary) -> Vector2:
    var target: Dictionary = enemy.get("anchor",{})
    var side: float = -1.0 if int(squad.get("side",-1)) < 0 else 1.0
    var flank: float = 23.0 if bool(squad.get("large_field",false)) else 10.0
    # Pick one fixed wing per squad to prevent left-right oscillation.
    var wing: float = 1.0 if int(squad.get("unit_id",0))%2 == 0 else -1.0
    return Vector2(float(target.get("x",0.0))-side*7.0,float(target.get("z",0.0))+wing*flank)
