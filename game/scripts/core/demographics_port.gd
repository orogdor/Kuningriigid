extends RefCounted
## Direct minute-boundary demographic rules from V131 economy.js tickEconomy.
## V131 consumeHouseholds() uses per-house foodHeld / waterHeld first.
## If insufficient, consume from central stock; hall occupants are supplied directly.
## Household amounts were already debited from central stock at market pickup.
const Economy = preload("res://scripts/core/economy_port.gd")
const Build = preload("res://scripts/core/building_rules_port.gd")
const Needs = preload("res://scripts/core/city_needs_port.gd")
const FOOD_PER_RESIDENT: float = 0.60
const WATER_PER_RESIDENT: float = 0.45

static func _consume_food(resources: Dictionary, amount: float, house: Dictionary = {}) -> bool:
    var held: float = minf(maxf(0.0,float(house.get("foodHeld",0.0))),amount) if not house.is_empty() else 0.0
    if not house.is_empty():
        house["foodHeld"] = maxf(0.0,float(house.get("foodHeld",0.0)) - held)
    var required: float = maxf(0.0,amount - held)
    var obtained: float = Economy.take_food(resources,required)
    return required - obtained < 0.0001

static func _consume_water(resources: Dictionary, amount: float, house: Dictionary = {}) -> bool:
    var held: float = minf(maxf(0.0,float(house.get("waterHeld",0.0))),amount) if not house.is_empty() else 0.0
    if not house.is_empty():
        house["waterHeld"] = maxf(0.0,float(house.get("waterHeld",0.0)) - held)
    var required: float = maxf(0.0,amount - held)
    var obtained: float = minf(required,maxf(0.0,float(resources.get("water",0.0))))
    resources["water"] = maxf(0.0,float(resources.get("water",0.0)) - obtained)
    return required - obtained < 0.0001

static func _feed_households(city: Dictionary, resources: Dictionary, pop: int) -> bool:
    var hall_residents: int = mini(pop,4)
    var food_ok: bool = _consume_food(resources,float(hall_residents)*FOOD_PER_RESIDENT)
    var water_ok: bool = _consume_water(resources,float(hall_residents)*WATER_PER_RESIDENT)
    var fed: bool = food_ok and water_ok
    var residents_remaining: int = maxi(0,pop - hall_residents)
    var houses_seen: int = 0
    for house in city.get("buildings",[]):
        if String(house.get("type","")) != "house" or not bool(house.get("ready",false)) or float(house.get("hp",0.0)) <= 0.0:
            continue
        var occupants: int = mini(3,maxi(0,residents_remaining - houses_seen*3))
        houses_seen += 1
        if occupants <= 0:
            continue
        var house_food_ok: bool = _consume_food(resources,float(occupants)*FOOD_PER_RESIDENT,house)
        var house_water_ok: bool = _consume_water(resources,float(occupants)*WATER_PER_RESIDENT,house)
        if not house_food_ok or not house_water_ok:
            fed = false
    return fed

static func minute(city: Dictionary, growth_factor: float = 1.0) -> Dictionary:
    var resources: Dictionary = city["resources"]
    var pop: int = maxi(0,int(city.get("pop",3)))
    var cap: int = Build.housing_capacity(city["buildings"])
    var food_need: float = round(float(pop) * FOOD_PER_RESIDENT * 100.0) / 100.0
    var water_need: float = round(float(pop) * WATER_PER_RESIDENT * 100.0) / 100.0
    resources["gold"] = float(resources.get("gold",0.0)) + float(pop)
    # Snapshot the national stock before debiting. House-held goods have
    # already been deducted from that stock when shoppers picked them up.
    var food_before: float = Needs.food_total(resources)
    var water_before: float = float(resources.get("water",0.0))
    var supplied: bool = _feed_households(city,resources,pop)
    var food_taken: float = food_before - Needs.food_total(resources)
    var water_taken: float = water_before - float(resources.get("water",0.0))
    city["housingShortage"] = not supplied
    city["housingCapacity"] = cap
    city["foodNeed"] = food_need
    city["waterNeed"] = water_need
    var growth_progress: float = float(city.get("growthProgress",0.0))
    var growth_need: float = (2.3 + float(pop)*0.28) * growth_factor
    city["growthNeed"] = growth_need
    var before_pop: int = pop
    if supplied:
        city["shortageTurns"] = 0
        if pop < cap:
            var reserves: float = 1.2 if float(resources.get("bread",0.0)) >= pop * 2.0 and float(resources.get("water",0.0)) >= pop * 1.5 else 1.0
            growth_progress += reserves
            if growth_progress >= growth_need:
                growth_progress -= growth_need
                pop += 1
        else:
            growth_progress = minf(growth_progress,growth_need)
    else:
        growth_progress = maxf(0.0,growth_progress - 0.7)
        city["shortageTurns"] = int(city.get("shortageTurns",0)) + 1
        if int(city["shortageTurns"]) >= 3:
            city["shortageTurns"] = 0
            pop = maxi(3,mini(cap,pop - 1))
    city["growthProgress"] = growth_progress
    city["pop"] = pop
    return {"supplied":supplied,"changed":pop != before_pop,"food":food_taken,"water":water_taken,"population":pop}
