extends RefCounted
## Direct renderer-free logic from era-economy.js (V88 half-cost era prices).
const Needs = preload("res://scripts/core/city_needs_port.gd")
const ERA_TECHS = {"bronze":1,"iron":2,"civics":3,"renaissance":4,"industrialization":5,"modernity":6}
const ERA_MATERIALS = {
    "bronze":{"wood":45.0,"stone":35.0,"bread":17.5},
    "iron":{"plank":50.0,"stone":50.0,"bread":30.0},
    "civics":{"iron":20.0,"plank":75.0,"bread":50.0},
    "renaissance":{"iron":35.0,"plank":85.0},
    "industrialization":{"iron":50.0,"plank":120.0},
    "modernity":{"steel":35.0,"machines":17.5}
}

static func edible_supply(stock: Dictionary) -> float:
    var amount := 0.0
    for key in Needs.food_equivalence():
        amount += maxf(0.0,float(stock.get(key,0.0))) * float(Needs.food_equivalence()[key])
    return amount

static func age_deficit(city_stocks: Array, tech: String) -> Dictionary:
    var missing: Dictionary = {}
    var cost: Dictionary = ERA_MATERIALS.get(tech,{})
    for key in cost:
        var total := 0.0
        for stock in city_stocks:
            total += edible_supply(stock) if key == "bread" else float(stock.get(key,0.0))
        var deficit: float = maxf(0.0,float(cost[key])-total)
        if deficit > 0.000001:
            missing[key] = deficit
    return missing

static func pay_era_cost(city_stocks: Array, tech: String) -> Dictionary:
    var missing: Dictionary = age_deficit(city_stocks, tech)
    if not missing.is_empty():
        return {"paid":false,"missing":missing}
    if not ERA_MATERIALS.has(tech):
        return {"paid":true,"missing":{}}
    var foods: Dictionary = Needs.food_equivalence()
    for key in ERA_MATERIALS[tech]:
        var left: float = float(ERA_MATERIALS[tech][key])
        var sources: Array = foods.keys() if key == "bread" else [key]
        for source in sources:
            var nutrition: float = float(foods[source]) if key == "bread" else 1.0
            for stock in city_stocks:
                var used: float = minf(maxf(0.0,float(stock.get(source,0.0))),left/nutrition)
                stock[source] = maxf(0.0,float(stock.get(source,0.0))-used)
                left -= used*nutrition
                if left < 0.000001:
                    break
            if left < 0.000001:
                break
        if left > 0.00001:
            push_error("Atomic era payment invariant failed for " + tech + ":" + String(key))
    return {"paid":true,"missing":{}}
