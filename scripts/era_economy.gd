class_name EraEconomy
extends RefCounted
const DATA := preload("res://data/era_economy.json")

static func city_stocks(state: Dictionary, team: int) -> Array:
	var stocks: Array = []
	for city in state.cities:
		if city.team == team:
			stocks.append(city.economy.realms[team].resources)
	return stocks

static func edible_supply(stock: Dictionary) -> float:
	var total := 0.0
	for resource in DATA.data.food_equivalence:
		total += maxf(0.0, float(stock.get(resource, 0.0))) * float(DATA.data.food_equivalence[resource])
	return total

static func age_deficit(state: Dictionary, team: int, id: String) -> Dictionary:
	var cost: Dictionary = DATA.data.era_materials.get(id, {})
	var stocks := city_stocks(state, team)
	var missing := {}
	for resource in cost:
		var have := 0.0
		for stock in stocks:
			have += edible_supply(stock) if resource == "bread" else float(stock.get(resource, 0.0))
		var deficit := maxf(0.0, float(cost[resource]) - have)
		if deficit > 0.000001:
			missing[resource] = deficit
	return missing

static func pay_era_cost(state: Dictionary, team: int, id: String) -> Dictionary:
	var missing := age_deficit(state, team, id)
	if not missing.is_empty():
		return {"paid": false, "missing": missing}
	var stocks := city_stocks(state, team)
	var cost: Dictionary = DATA.data.era_materials.get(id, {})
	for resource in cost:
		var left: float = cost[resource]
		var sources := DATA.data.food_equivalence if resource == "bread" else {resource: 1.0}
		for kind in sources:
			var nutrition: float = sources[kind]
			for stock in stocks:
				var used := minf(maxf(0.0, float(stock.get(kind, 0.0))), left / nutrition)
				stock[kind] = maxf(0.0, float(stock.get(kind, 0.0)) - used)
				left -= used * nutrition
				if left < 0.000001:
					break
			if left < 0.000001:
				break
		assert(left <= 0.00001, "Ajastutasu muutus maksmise ajal")
	return {"paid": true, "missing": {}}
