extends RefCounted
## Port of battle-doctrine-v98.js commitment policy, simplified for Godot v1.4.
## Keeps an opponent to prevent oscillation; spear walls deter cavalry,
## missile troops invite cavalry attacks, and troop lanes discourage criss-crossing.
const RANGED: Array[String] = ["archer", "bronze_archer", "iron_archer", "slinger", "javelinman"]
const MOUNTED: Array[String] = ["cavalry", "bronze_cavalry", "chariot", "knight", "heavy_cavalry"]
const SPEARS: Array[String] = ["spearman", "bronze_spearman", "pikeman"]

static func mounted(kind: String) -> bool:
    return kind in MOUNTED

static func target_cost(unit: Dictionary, target: Dictionary) -> float:
    var ua: Dictionary = unit.get("anchor", {})
    var ta: Dictionary = target.get("anchor", {})
    var dx: float = float(ua.get("x", 0.0))-float(ta.get("x", 0.0))
    var dz: float = float(ua.get("z", 0.0))-float(ta.get("z", 0.0))
    var d: float = Vector2(dx, dz).length()
    var horse: bool = mounted(String(unit.get("kind", "")))
    var brace: bool = String(target.get("kind", "")) in SPEARS and (String(target.get("formation", "")) == "spear_wall" or float(target.get("cohesion",1.0)) > .65)
    var early: bool = String(unit.get("kind", "")) in ["bronze_cavalry", "chariot"]
    return d + absf(float(unit.get("deployment_z", ua.get("z",0.0)))-float(ta.get("z",0.0)))*.65 + (100.0 if horse and brace and early else (42.0 if horse and brace else 0.0)) + (14.0 if horse and String(target.get("formation","")) == "shield_wall" else 0.0) - (13.0 if horse and String(target.get("kind","")) in RANGED else 0.0) - (10.0 if horse and bool(target.get("routing",false)) else 0.0)

static func choose_target(unit: Dictionary, candidates: Array) -> Dictionary:
    var best: Dictionary = {}
    var previous: Dictionary = {}
    var preferred: int = int(unit.get("attack_target", -1))
    var committed: int = int(unit.get("engagement_target", -1))
    var best_score: float = INF
    for other in candidates:
        if int(other.get("team",-1)) == int(unit.get("team",-1)) or bool(other.get("reserve",false)) or bool(other.get("retreated",false)) or bool(other.get("routing",false)):
            continue
        var live: bool = false
        for m in other.get("men", []):
            if float(m.get("hp",0.0)) > 0.0 and not bool(m.get("escaped",false)):
                live = true
                break
        if not live:
            continue
        var unit_id: int = int(other.get("unit_id",-1))
        if preferred >= 0 and preferred != unit_id:
            continue
        var cost: float = target_cost(unit, other)
        if cost < best_score:
            best = other
            best_score = cost
        if unit_id == committed:
            previous = other
    if not previous.is_empty() and not best.is_empty() and target_cost(unit,previous) < best_score*1.35+8.0:
        best = previous
    if not best.is_empty():
        unit["engagement_target"] = int(best["unit_id"])
    return best

static func keep_forward(unit: Dictionary, goal: Vector2) -> Vector2:
    ## V98: do not undo a whole advance because the formation slot is behind.
    if bool(unit.get("routing",false)) or String(unit.get("formation", "")) in ["hold", "spear_wall"]:
        return goal
    var pos: Dictionary = unit.get("anchor",{})
    var side: int = int(unit.get("side",1))
    if (goal.x - float(pos.get("x",0.0)))*float(-side) < 0.0:
        return Vector2(float(pos.get("x",0.0)),goal.y)
    return goal

static func formation_speed(formation: String) -> float:
    if formation == "shield_wall":
        return .48
    if formation == "spear_wall":
        return .35
    if formation == "hold":
        return .8
    if formation == "charge":
        return 1.15
    if formation in ["loose","skirmish"]:
        return 1.0
    if formation == "column":
        return 1.12
    return 1.0
