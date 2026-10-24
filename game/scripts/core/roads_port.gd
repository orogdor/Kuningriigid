extends RefCounted
## V131 roads.js translated, including traffic heat, aging, level thresholds,
## per-traveler heat and the half-minute decay update.
const COLS: int = 220
const ROAD_SPEED: float = 1.5
const ROAD_THRESHOLDS := [12.0, 25.0, 60.0, 120.0]

static func road_key(a: Vector2i, b: Vector2i) -> String:
    var ia: int = a.y * COLS + a.x
    var ib: int = b.y * COLS + b.x
    return "%d:%d" % [mini(ia, ib), maxi(ia, ib)]

static func road_level(heat: float) -> int:
    if heat >= 120.0:
        return 4
    if heat >= 60.0:
        return 3
    if heat >= 25.0:
        return 2
    if heat >= 12.0:
        return 1
    return 0

static func age_traffic(heat: float, elapsed: float) -> float:
    var h: float = clampf(heat, 0.0, 150.0)
    var t: float = maxf(0.0, elapsed)
    var rates := [0.004, 0.0035, 0.0018, 0.0007, 0.0002]
    var floors := [0.0, 12.0, 25.0, 60.0, 120.0]
    while t > 0.0 and h > 0.0:
        var level: int = road_level(h)
        var rate: float = rates[level]
        if level == 0:
            return maxf(0.0, h - rate * t)
        var step: float = maxf(0.0, (h - floors[level]) / rate)
        if step >= t:
            h -= rate * t
            break
        h = floors[level] - 0.00001
        t -= step
    return 0.0 if h < 0.02 else h

static func road_strength(roads: Dictionary, a: Vector2i, b: Vector2i, now: float) -> float:
    return strength_for_key(roads, road_key(a, b), now)

static func strength_for_key(roads: Dictionary, key: String, now: float) -> float:
    if not roads.has(key):
        return 0.0
    var edge: Dictionary = roads[key]
    return age_traffic(float(edge.get("heat", 0.0)), now - float(edge.get("last", 0.0)))

static func road_boost(roads: Dictionary, a: Vector2i, b: Vector2i, now: float) -> float:
    return ROAD_SPEED if road_level(road_strength(roads, a, b, now)) > 0 else 1.0

static func record_world_step(roads: Dictionary, a: Vector2i, b: Vector2i, kind: String, now: float) -> bool:
    if absi(a.x - b.x) + absi(a.y - b.y) != 1:
        return false
    var key := road_key(a, b)
    var previous: float = strength_for_key(roads, key, now)
    var amount: float = 3.5
    match kind:
        "roadworks": amount = 8.0
        "caravan": amount = 5.5
        "settler": amount = 2.5
        "builder": amount = 3.0
    var next: float = clampf(previous + amount, 0.0, 150.0)
    roads[key] = {"heat": next, "last": now}
    return road_level(previous) != road_level(next)

static func decay_world_roads(roads: Dictionary, now: float) -> int:
    # Call once per >=30 seconds. Return number of roads changing visibility level.
    var changed: int = 0
    var keys: Array = roads.keys()
    for key in keys:
        var edge: Dictionary = roads[key]
        var old: float = float(edge["heat"])
        var next: float = age_traffic(old, now - float(edge["last"]))
        if road_level(old) != road_level(next):
            changed += 1
        if next <= 0.0:
            roads.erase(key)
        else:
            roads[key] = {"heat": next, "last": now}
    return changed
