extends RefCounted
## V131 builders.js tickMarketHouseholds: one shopper for each of up to 24
## completed houses, collecting food & water from a staffed market.
## Goods are paid for AT PURCHASE, then stored in the house AT DELIVERY.
## A failed route prevents pickup/delivery; shopkeepers never teleport goods.
## This implementation handles a SINGLE proxy detail-city, not inter-district
## shopping or the full V131 CitizenRoutes memory across world tiles.
const Citizens = preload("res://scripts/core/citizen_agents_port.gd")
const Cargo = preload("res://scripts/core/cargo_port.gd")
const Economy = preload("res://scripts/core/economy_port.gd")
const EPS: float = 0.00001
const MAX_SHOPPERS: int = 24

static func _ready_market(building: Dictionary) -> bool:
    return String(building.get("type","")) == "market" and bool(building.get("ready",false)) and not bool(building.get("disabled",false)) and float(building.get("hp",0.0)) > 0.0 and float(building.get("assigned",0.0)) > 0.01

static func _active_house(building: Dictionary) -> bool:
    return String(building.get("type","")) == "house" and bool(building.get("ready",false)) and float(building.get("hp",0.0)) > 0.0

static func _nearest_market(city: Dictionary, house_index: int, markets: Array[int], navigator) -> int:
    var origin: Vector2 = navigator.entry_position(city,house_index) if navigator != null else Cargo.building_position(city,house_index)
    var choice: int = markets[0]
    var shortest: float = INF
    for market_index in markets:
        var target: Vector2 = navigator.entry_position(city,market_index) if navigator != null else Cargo.building_position(city,market_index)
        var distance: float = origin.distance_squared_to(target)
        if distance < shortest:
            shortest = distance
            choice = market_index
    return choice

static func advance(city: Dictionary, dt: float, navigator = null) -> Dictionary:
    var result: Dictionary = {"active":0,"moving":0,"purchases":0,"deliveries":0,
        "food_bought":0.0,"water_bought":0.0,"food_delivered":0.0,"water_delivered":0.0}
    if dt <= 0.0:
        return result
    var buildings: Array = city.get("buildings",[])
    var markets: Array[int] = []
    for index in range(buildings.size()):
        if _ready_market(buildings[index]):
            markets.append(index)
    if markets.is_empty():
        for agent in city.get("citizens",{}).values():
            if String(agent.get("kind","")) == "market_woman":
                agent["status"] = "Kodus"
        return result
    var seen: int = 0
    for index in range(buildings.size()):
        var house: Dictionary = buildings[index]
        if not _active_house(house):
            continue
        if seen >= MAX_SHOPPERS:
            break
        seen += 1
        var id: String = "shopper:%d" % index
        var agent: Dictionary = Citizens.ensure_agent_at(city,id,"market_woman",index,navigator)
        agent["kind"] = "market_woman"
        result["active"] = int(result["active"]) + 1
        var food_held: float = maxf(0.0,float(house.get("foodHeld",0.0)))
        var water_held: float = maxf(0.0,float(house.get("waterHeld",0.0)))
        if String(agent.get("phase","market")) == "home" and float(agent.get("carried",0.0)) > EPS:
            if Citizens.walk_to(city,agent,index,dt,navigator):
                var food: float = float(agent.get("breadLoad",0.0))
                var water: float = float(agent.get("waterLoad",0.0))
                house["foodHeld"] = food_held + food
                house["waterHeld"] = water_held + water
                agent["carried"] = 0.0
                agent["breadLoad"] = 0.0
                agent["waterLoad"] = 0.0
                agent["phase"] = "market"
                agent["target"] = -1
                agent["status"] = "Viis söögi koju"
                result["deliveries"] = int(result["deliveries"]) + 1
                result["food_delivered"] = float(result["food_delivered"]) + food
                result["water_delivered"] = float(result["water_delivered"]) + water
            else:
                if String(agent.get("status","")) != "Tee puudub":
                    agent["status"] = "Toob perele toitu"
                result["moving"] = int(result["moving"]) + 1
            continue
        # V131 uses a conservative resupply threshold: food >= 5, water >= 3.
        if food_held >= 5.0 and water_held >= 3.0:
            agent["status"] = "Kodus"
            Citizens.walk_to(city,agent,index,dt,navigator)
            continue
        var market_index: int = _nearest_market(city,index,markets,navigator)
        if not Citizens.walk_to(city,agent,market_index,dt,navigator):
            if String(agent.get("status","")) != "Tee puudub":
                agent["status"] = "Läheb turule söögi järele"
            result["moving"] = int(result["moving"]) + 1
            continue
        var stock: Dictionary = city["resources"]
        var food_need: float = minf(3.0,maxf(0.0,5.0-food_held))
        var food_load: float = Economy.take_food(stock,food_need)
        var water_load: float = minf(2.0,minf(maxf(0.0,4.0-water_held),maxf(0.0,float(stock.get("water",0.0)))))
        stock["water"] = maxf(0.0,float(stock.get("water",0.0))-water_load)
        if food_load <= EPS and water_load <= EPS:
            agent["status"] = "Turul puudub toit ja vesi"
            continue
        agent["breadLoad"] = food_load
        agent["waterLoad"] = water_load
        agent["carried"] = food_load + water_load
        agent["phase"] = "home"
        agent["target"] = -1
        agent["status"] = "Ostis toidu ja vee"
        result["purchases"] = int(result["purchases"]) + 1
        result["food_bought"] = float(result["food_bought"]) + food_load
        result["water_bought"] = float(result["water_bought"]) + water_load
    return result
