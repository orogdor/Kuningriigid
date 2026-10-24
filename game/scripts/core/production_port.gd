extends RefCounted
## Work cycles from V131 economy.js tickEconomy (rate/cycle/timer), NOT
## the old 0.5 preview's rate-per-minute approximation.
## Version 0.7 can dispatch outputs to asynchronous local cargo shipments;
## direct-to-stock mode remains available for isolated V131 parity tests.
## Not yet V131 citizen navigation, resource deposits or multi-hop routing.
const Economy = preload("res://scripts/core/economy_port.gd")
const Needs = preload("res://scripts/core/city_needs_port.gd")
const Cargo = preload("res://scripts/core/cargo_port.gd")

static func food_production_allowed(stock: Dictionary, kind: String, rate: float, cap: float, recipe: Dictionary = {}, pending: Array = []) -> bool:
    if is_inf(cap):
        return true
    var used: float = 0.0
    for key in Needs.food_keys():
        used += float(stock.get(key,0.0))
    var output_pending: float = 0.0
    for shipment in pending:
        if String(shipment.get("key","")) in Needs.food_keys():
            used += float(shipment.get("amount",0.0))
        if String(shipment.get("key","")) == kind:
            output_pending += float(shipment.get("amount",0.0))
    var raw_share: float = 0.55 if kind == "grain" else (0.42 if kind == "flour" else 1.0)
    if float(stock.get(kind,0.0)) + output_pending + rate > cap * raw_share + 0.0000001:
        return false
    var reclaim: float = 0.0
    for ingredient in recipe:
        if Needs.food_keys().has(ingredient):
            reclaim += float(recipe[ingredient])
    return used - reclaim + rate <= cap + 0.0000001

static func run_cycle(city: Dictionary, building: Dictionary, dt: float, bonus: float = 1.0, transport: bool = false, navigator = null) -> int:
    if dt <= 0.0 or not bool(building.get("ready",false)) or bool(building.get("disabled",false)):
        return 0
    var kind: String = String(building.get("type",""))
    var definition: Dictionary = Economy.BUILDINGS.get(kind,{})
    var output: String = String(definition.get("out",""))
    if output.is_empty():
        return 0
    var efficiency: float = float(building.get("efficiency",0.0))
    if efficiency <= 0.0:
        return 0
    var stock: Dictionary = city["resources"]
    var recipe: Dictionary = definition.get("input",{})
    var pending: Array = city.get("cargo",[]) if transport else []
    var cycle: float = float(definition.get("cycle",0.0))
    if cycle <= 0.0:
        return 0
    # V131 checks full recipe BEFORE accumulating productive time.
    if not Economy.can_afford(stock,recipe):
        return 0
    var cap: float = Economy.storage_limit(city["buildings"],output)
    var rate: float = float(definition.get("rate",0.0))
    if output in Needs.food_keys():
        if not food_production_allowed(stock,output,rate,cap,recipe,pending):
            return 0
    elif float(stock.get(output,0.0)) + (Cargo.pending(city,output) if transport else 0.0) >= cap:
        return 0
    building["timer"] = float(building.get("timer",0.0)) + dt * efficiency * bonus * Economy.RESOURCE_PRODUCTION_MULTIPLIER
    var cycles: int = 0
    while float(building["timer"]) + 0.00000001 >= cycle:
        if not Economy.can_afford(stock,recipe):
            break
        cap = Economy.storage_limit(city["buildings"],output)
        if output in Needs.food_keys():
            if not food_production_allowed(stock,output,rate,cap,recipe,pending):
                break
        elif float(stock.get(output,0.0)) + (Cargo.pending(city,output) if transport else 0.0) + rate > cap + 0.0000001:
            break
        building["timer"] = maxf(0.0,float(building["timer"]) - cycle)
        Economy.spend_resources(stock,recipe)
        if transport:
            var source: int = city.get("buildings",[]).find(building)
            if not Cargo.dispatch(city,source,output,rate,navigator):
                push_error("Failed to dispatch produced goods: " + output)
                break
        else:
            stock[output] = float(stock.get(output,0.0)) + rate
        cycles += 1
        if cycles >= 100:
            break  # safety cap for corrupted or legacy saved timers
    return cycles
