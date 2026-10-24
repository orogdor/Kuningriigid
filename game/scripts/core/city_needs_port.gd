extends RefCounted
## Port of city-needs-v87.js: age-specific variety, nutrition, luxuries and stocks.
const GOODS = {
    "meat":{"age":0,"food":true}, "fish":{"age":0,"food":true}, "berries":{"age":0,"food":true},
    "vegetables":{"age":1,"food":true}, "fruit":{"age":2,"food":true}, "cheese":{"age":3,"food":true},
    "spices":{"age":4,"food":true}, "coffee":{"age":5,"food":true},
    "flax":{"age":1}, "gems":{"age":2}, "silk":{"age":3}, "dyes":{"age":4},
    "cocoa":{"age":5}, "rubber":{"age":6},
    "cloth":{"age":1,"luxury":true}, "jewelry":{"age":2,"luxury":true},
    "silkcloth":{"age":3,"luxury":true}, "perfume":{"age":4,"luxury":true},
    "chocolate":{"age":5,"luxury":true}, "electronics":{"age":6,"luxury":true}
}
const NEEDS = [
    {"food":2,"luxury":0},{"food":3,"luxury":1},{"food":4,"luxury":2},
    {"food":5,"luxury":3},{"food":6,"luxury":4},{"food":7,"luxury":5},
    {"food":8,"luxury":6}
]

static func food_keys() -> Array:
    var result: Array = ["bread", "flour", "grain"]
    for key in GOODS:
        if GOODS[key].get("food", false):
            result.append(key)
    return result

static func food_equivalence() -> Dictionary:
    var result := {"bread":1.0, "flour":0.85, "grain":0.70}
    for key in GOODS:
        if GOODS[key].get("food", false):
            result[key] = 1.0
    return result

static func food_total(stock: Dictionary) -> float:
    var total := 0.0
    for key in food_keys():
        total += maxf(0.0, float(stock.get(key, 0.0)))
    return total

static func city_needs(stock: Dictionary, population: int, age: int) -> Dictionary:
    var threshold := maxf(0.5, float(population) * 0.1)
    var needs: Dictionary = NEEDS[clampi(age, 0, 6)]
    var foods: Array = []
    var luxuries: Array = []
    if float(stock.get("bread",0.0)) + float(stock.get("flour",0.0)) + float(stock.get("grain",0.0)) >= threshold:
        foods.append("cereal")
    for key in GOODS:
        var item: Dictionary = GOODS[key]
        if bool(item.get("food",false)) and int(item["age"]) <= age and float(stock.get(key,0.0)) >= threshold:
            foods.append(key)
    if float(stock.get("pottery",0.0)) >= threshold:
        luxuries.append("pottery")
    for key in GOODS:
        var item: Dictionary = GOODS[key]
        if bool(item.get("luxury",false)) and int(item["age"]) <= age and float(stock.get(key,0.0)) >= threshold:
            luxuries.append(key)
    var missing: int = maxi(0, int(needs["food"]) - foods.size()) + maxi(0, int(needs["luxury"]) - luxuries.size())
    var extra: int = maxi(0, foods.size() - int(needs["food"])) + maxi(0, luxuries.size() - int(needs["luxury"]))
    return {"need":needs,"foods":foods,"luxuries":luxuries,"threshold":threshold,"missing":missing,"extra":extra,"productivity":1.0-0.05*missing+0.02*extra}

static func consume_luxuries(stock: Dictionary, population: int, age: int, dt: float) -> void:
    var keys: Array = ["pottery"]
    for key in GOODS:
        if bool(GOODS[key].get("luxury",false)) and int(GOODS[key]["age"]) <= age:
            keys.append(key)
    for key in keys:
        stock[key] = maxf(0.0, float(stock.get(key,0.0)) - population * 0.02 * dt / 60.0)

static func national_stock(cities: Array, team: int) -> Dictionary:
    var total: Dictionary = {}
    for city in cities:
        if int(city.get("team",-1)) != team or city.get("districtOf", null) != null:
            continue
        var stock: Dictionary = city.get("resources",{})
        for key in stock:
            total[key] = float(total.get(key,0.0)) + float(stock[key])
    return total
