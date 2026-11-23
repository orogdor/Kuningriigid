class_name GrowthBalance
extends RefCounted

# growth-balance-v125.js, original revision 2d9ff399.
const MAX_AI_CITIES := 12

static func city_capacity(time: float, _age: int) -> int:
	return mini(MAX_AI_CITIES, maxi(2, 2 + floori(maxf(0.0, time) / (26.0 * 60.0))))

static func settler_policy(time: float, age: int, cities: int, pending: int, population: float, food: float, last_at: float, has_settlement: bool) -> Dictionary:
	var capacity := city_capacity(time, age)
	var interval := 6 * 60 if age <= 1 else (7 * 60 if age <= 3 else 10 * 60)
	var concentrate := (age == 0 and cities >= 2) or (age == 1 and cities >= 2 and population < 30)
	var allowed := has_settlement and cities + pending < capacity and pending < 2 and not concentrate and time >= 10 * 60 and time - last_at >= interval and population >= (12 if age == 1 else 6) and food >= maxf(20 if age == 0 else 25, population * (1.6 if age == 0 else 2.2))
	return {"capacity": capacity, "allow": allowed, "interval": interval}

static func army_capacity(own_cities: int, age: int, at_war := false) -> int:
	return mini(44, maxi(6, 3 + own_cities * 2 + age * 2 + (7 if at_war else 0)))

static func knowledge_cost_factor(age: int) -> float:
	return [0.75, 2.8, 3.3, 3.9, 4.4, 5.0, 5.6][clampi(age, 0, 6)]

static func knowledge_city_multiplier(n: int) -> float:
	if n <= 1:
		return 1.0
	return minf(1.8, 1.0 + 0.12 * sqrt(n - 1))
