extends RefCounted
## Selected port of V131 catapult-accuracy-v105.js and historical-tactics-v92.js.
## Fixed seeds make replay/save repeatable. Does not replace full V131 ballistics.
const MAX_STONE_DEVIATION: float = 14.4
const STONE_RADIUS: float = 4.2
const STONE_FLIGHT: float = 1.1
const STONE_RELOAD: float = 8.4
const STONE_AMMO: int = 6
const BOW_AMMO: int = 40

static func _roll(seed: int) -> float:
    # Multiplication stays within signed 64-bit: deterministic 31-bit generator.
    var n: int = posmod(seed, 2147483647)
    n = posmod(n * 48271 + 1, 2147483647)
    n = posmod(n * 16807 + 11, 2147483647)
    return float(n) / 2147483647.0

static func stone_landing(source: int, shot: int, team: int, army_level: int, x: float, z: float) -> Dictionary:
    var level: int = clampi(army_level, 1, 10)
    if level == 10:
        return {"x":x,"z":z,"deviation":0.0,"level":level}
    var seed: int = (source + 31) * 73856093 + (shot+1) * 19349663 + (team+1) * 83492791
    var spread: float = MAX_STONE_DEVIATION * float(10 - level) / 9.0
    var offset: float = spread * sqrt(_roll(seed))
    var angle: float = _roll(seed + 1618033) * TAU
    return {"x":x+cos(angle)*offset,"z":z+sin(angle)*offset,"deviation":offset,"level":level}

static func bow_hit(source: int, man_id: int, shot: int, distance: float, range_value: float, moving: bool = false, volley: bool = false) -> bool:
    var chance: float = clampf(.91-.4*distance/maxf(1.0,range_value)-(.13 if moving else 0.0)+(.08 if volley else 0.0),.30,.88)
    var seed: int = (source+1)*73856093+(man_id+1)*19349663+shot*83492791
    return _roll(seed) < chance

static func stone_damage(base: float, distance: float, radius: float = STONE_RADIUS) -> float:
    if distance > radius:
        return 0.0
    return base * (.25 + .75 * (1.0 - distance / maxf(.001,radius)))
