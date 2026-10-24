extends RefCounted
## Port of growth-balance-v125.js. Stateless and renderer-independent.
const MAX_AI_CITIES: int = 12

static func city_capacity(game_time: float, _age: int) -> int:
    return mini(MAX_AI_CITIES, maxi(2, 2 + int(floor(maxf(0.0, game_time) / (26.0 * 60.0)))))

static func settler_policy(game_time: float, age: int, city_count: int, pending: int, population: int, food: float, last_at: float, has_settlement: bool) -> Dictionary:
    var capacity: int = city_capacity(game_time, age)
    var interval: float = 360.0 if age <= 1 else (420.0 if age <= 3 else 600.0)
    var allowed: bool = has_settlement and city_count + pending < capacity and pending < 2 and game_time >= 600.0 and game_time - last_at >= interval and population >= 7 and food >= maxf(25.0, population * 2.2)
    return {"capacity": capacity, "allow": allowed, "interval": interval}

static func army_capacity(own_cities: int, age: int, at_war: bool = false) -> int:
    return mini(44, maxi(6, 3 + own_cities * 2 + age * 2 + (7 if at_war else 0)))

static func knowledge_cost_factor(age: int) -> float:
    return [2.2, 2.8, 3.3, 3.9, 4.4, 5.0, 5.6][clampi(age, 0, 6)]

static func knowledge_city_multiplier(count: int) -> float:
    if count <= 1:
        return 1.0
    return minf(1.8, 1.0 + 0.12 * sqrt(float(count - 1)))
