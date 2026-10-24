extends RefCounted
## Source: army-experience-v88.js, XP curve and derived combat multipliers.
const MAX_ARMY_LEVEL: int = 10

static func xp_for_level(level: int) -> int:
    var l: int = clampi(level, 1, MAX_ARMY_LEVEL) - 1
    return 100 * l * l

static func army_level(xp: float) -> int:
    return mini(MAX_ARMY_LEVEL, 1 + int(floor(sqrt(maxf(0.0, xp) / 100.0))))

static func experience_bonus(xp: float) -> float:
    return 1.0 + 2.0 * float(army_level(xp) - 1) / 9.0

static func unit_stats(definition: Dictionary, unit: Dictionary, army_xp: float = -1.0) -> Dictionary:
    var quality: float = float(unit.get("grade_strength",1.0))
    var factor: float = experience_bonus(army_xp) if army_xp >= 0.0 else float(unit.get("experienceMultiplier",1.0))
    return {"hp":float(definition.get("hp",0.0))*quality*factor,
        "dmg":float(definition.get("dmg",0.0))*quality*factor,
        "range":float(definition.get("range",0.0))*factor,
        "speed":float(definition.get("speed",0.0))*factor,
        "morale":100.0*factor,"attackSpeed":factor}

static func reward_xp(current_xp: float, damage: float, kills: int, won: bool) -> float:
    # Deterministic one-army equivalent for V88 battle reward aggregation.
    var earned: int = int(round(10.0 + maxf(0.0,damage)*0.5 + maxi(0,kills)*25.0 + (100.0 if won else 0.0)))
    return minf(float(xp_for_level(10)), current_xp + float(earned))
