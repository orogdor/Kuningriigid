extends RefCounted
## Pure economic routines from V131 economy.js, independent of the renderer.
## V87 food varieties also come from the ported city-needs module.
const Needs = preload("res://scripts/core/city_needs_port.gd")
const RESOURCE_PRODUCTION_MULTIPLIER: float = 1.0 / 4.5
const START = {
    "wood":68.0,"plank":10.0,"stone":18.0,"grain":0.0,"flour":0.0,
    "water":28.0,"bread":26.0,"ore":0.0,"coal":0.0,"iron":0.0,
    "weapons":0.0,"paper":0.0,"saltpeter":0.0,"gunpowder":0.0,
    "steel":0.0,"machines":0.0,"oil":0.0,"fuel":0.0,"power":0.0,
    "vehicles":0.0,"gold":90.0,"clay":0.0,"pottery":0.0,
    "cutstone":0.0,"copper":0.0,"tin":0.0,"bronze":0.0,"carts":0.0
}
const MATERIAL_KEYS = [
    "wood","stone","plank","ore","coal","iron","weapons","paper",
    "saltpeter","gunpowder","steel","machines","oil","fuel","vehicles",
    "clay","pottery","cutstone","copper","tin","bronze","carts"
]
const FOOD_NUTRITION = {"bread":1.0,"flour":0.85,"grain":0.70}
# Definitions and dependencies from V131 economy.js (base buildings).
# Modelled here as pure data; city-needs modules add later age workshops.
const BUILDINGS = {
    "hall":{"name":"Pealinn","cost":{},"hp":1200.0,"workers":0,"time":0.0,"requires":[]},
    "lumber":{"name":"Metsamaja","cost":{"wood":20.0},"workers":2,"time":12.0,"requires":["hall"],"out":"wood","rate":12.0,"cycle":6.0},
    "forester":{"name":"Metsniku maja","cost":{"wood":20.0,"plank":10.0},"workers":2,"time":16.0,"requires":["lumber"],"rate":16.0,"cycle":6.0},
    "saw":{"name":"Saeveski","cost":{"wood":25.0,"stone":8.0},"workers":2,"time":16.0,"requires":["lumber"],"input":{"wood":4.0},"out":"plank","rate":6.0,"cycle":9.0},
    "quarry":{"name":"Kivimurd","cost":{"wood":20.0,"plank":8.0},"workers":2,"time":16.0,"requires":["lumber"],"out":"stone","rate":9.0,"cycle":6.0},
    "house":{"name":"Elamu","cost":{"plank":18.0,"stone":8.0},"workers":0,"time":15.0,"requires":["saw"]},
    "well":{"name":"Kaev","cost":{"wood":15.0,"stone":8.0},"workers":1,"time":12.0,"requires":["quarry"],"out":"water","rate":8.0,"cycle":8.0},
    "farm":{"name":"Talu","cost":{"wood":25.0,"plank":12.0},"workers":3,"time":20.0,"requires":["saw","quarry"],"out":"grain","rate":14.0,"cycle":10.0},
    "mill":{"name":"Veski","cost":{"plank":20.0,"stone":12.0},"workers":2,"time":20.0,"requires":["farm"],"input":{"grain":10.0},"out":"flour","rate":10.0,"cycle":9.0},
    "bakery":{"name":"Pagariäri","cost":{"plank":20.0,"stone":15.0},"workers":2,"time":20.0,"requires":["mill","well"],"input":{"flour":12.0,"water":2.0},"out":"bread","rate":12.0,"cycle":10.0},
    "mine":{"name":"Rauakaevandus","cost":{"plank":25.0,"stone":20.0},"workers":3,"time":24.0,"requires":["bakery"],"input":{"bread":1.0},"out":"ore","rate":6.0,"cycle":8.0},
    "coal":{"name":"Söepõletaja","cost":{"wood":25.0,"plank":15.0},"workers":2,"time":20.0,"requires":["bakery"],"input":{"wood":4.0},"out":"coal","rate":5.0,"cycle":10.0},
    "smelter":{"name":"Rauasulatus","cost":{"plank":25.0,"stone":20.0},"workers":3,"time":24.0,"requires":["mine","coal"],"input":{"ore":3.0,"coal":2.0},"out":"iron","rate":3.0,"cycle":12.0},
    "smith":{"name":"Relvasepp","cost":{"plank":30.0,"stone":25.0},"workers":2,"time":24.0,"requires":["smelter"],"input":{"iron":2.0,"plank":1.0},"out":"weapons","rate":2.0,"cycle":12.0},
    "barracks":{"name":"Sõjaväelaager","cost":{"wood":45.0,"stone":12.0},"workers":1,"time":30.0,"requires":["hall"]},
    "archery":{"name":"Lasketiir","cost":{"plank":30.0,"stone":15.0},"workers":1,"time":20.0,"requires":["barracks"]},
    "stable":{"name":"Tall","cost":{"plank":45.0,"stone":30.0},"workers":2,"time":25.0,"requires":["barracks","house"]},
    # Dev131 civilian industry: every resource for Modern Age is produced
    # from paid local inputs, actual workers and physical cargo transport.
    "steelworks":{"name":"Terasesulatus","cost":{"plank":35.0,"iron":18.0,"stone":20.0},"workers":3,"time":42.0,"requires":["smelter"],"input":{"iron":3.0,"coal":2.0},"out":"steel","rate":3.0,"cycle":14.0},
    "machine_shop":{"name":"Masinatehas","cost":{"plank":45.0,"steel":12.0,"stone":18.0},"workers":3,"time":48.0,"requires":["steelworks","smith"],"input":{"steel":2.0,"plank":3.0},"out":"machines","rate":2.0,"cycle":18.0},
    # Original V131 civilization-core.js defines these on top of economy.js.
    # V33 balance for hunter/fisher is included (x1.5 cost, x2.25 build time).
    "hunter":{"name":"Jahimehe onn","cost":{"wood":27.0},"workers":2,"time":36.0,"requires":["hall"],"out":"meat","rate":6.0,"cycle":8.0},
    "fisher":{"name":"Kalamehe onn","cost":{"wood":30.0},"workers":2,"time":36.0,"requires":["hall"],"out":"fish","rate":6.0,"cycle":7.0},
    "study":{"name":"Õpikoda","cost":{"wood":20.0,"stone":6.0},"workers":1,"time":38.0,"requires":["hall"]},
    "warehouse":{"name":"Materjaliladu","cost":{"wood":35.0,"stone":12.0},"workers":1,"time":42.0,"requires":["hall"]},
    "cellar":{"name":"Toidukelder","cost":{"wood":45.0,"stone":25.0},"workers":0,"time":58.0,"requires":["house"]},
    "market":{"name":"Turg","cost":{"wood":50.0,"stone":24.0},"workers":2,"time":65.0,"requires":["house"]}
}

static func start_resources() -> Dictionary:
    var result: Dictionary = START.duplicate(true)
    for key in Needs.GOODS.keys():
        if not result.has(key):
            result[key] = 0.0
    return result

static func storage_limit(buildings: Array, resource: String) -> float:
    var hall_count: int = 0
    var cellar_count: int = 0
    var kiln_count: int = 0
    var warehouse_count: int = 0
    for building in buildings:
        if not bool(building.get("ready", false)) or float(building.get("hp", 1.0)) <= 0.0 or bool(building.get("virtual", false)):
            continue
        match String(building.get("type", "")):
            "hall": hall_count += 1
            "cellar": cellar_count += 1
            "pottery_kiln": kiln_count += 1
            "warehouse": warehouse_count += 1
    var halls: int = maxi(1, hall_count)
    if resource == "gold":
        return INF
    if resource == "power":
        return 100.0
    if resource == "water":
        return 100.0 * halls
    if Needs.food_keys().has(resource):
        return 100.0 * halls + 200.0 * cellar_count + 60.0 * kiln_count
    if resource in MATERIAL_KEYS:
        return 120.0 * halls + 300.0 * warehouse_count
    return INF

static func take_food(stock: Dictionary, meals: float) -> float:
    var need: float = maxf(0.0, meals)
    var served: float = 0.0
    var nutrition_map: Dictionary = Needs.food_equivalence()
    var keys: Array = nutrition_map.keys()
    keys.sort_custom(func(a, b) -> bool: return float(stock.get(a,0.0)) > float(stock.get(b,0.0)))
    for key in keys:
        if need <= 0.0000001:
            break
        var nutrition: float = float(nutrition_map[key])
        var available: float = maxf(0.0, float(stock.get(key,0.0)))
        var units: float = minf(available, need / nutrition)
        stock[key] = maxf(0.0, available - units)
        served += units * nutrition
        need -= units * nutrition
    return served

static func can_afford(stock: Dictionary, cost: Dictionary) -> bool:
    var available: Dictionary = stock.duplicate()
    for key in cost.keys():
        if key == "bread":
            continue
        var qty: float = float(cost[key])
        if float(available.get(key,0.0)) < qty:
            return false
        available[key] = float(available[key]) - qty
    if not cost.has("bread") or float(cost["bread"]) <= 0.0:
        return true
    var food: float = 0.0
    for key in Needs.food_equivalence().keys():
        food += maxf(0.0,float(available.get(key,0.0))) * float(Needs.food_equivalence()[key])
    return food >= float(cost["bread"])

static func spend_resources(stock: Dictionary, cost: Dictionary) -> void:
    for key in cost.keys():
        if key != "bread":
            stock[key] = float(stock.get(key,0.0)) - float(cost[key])
    if cost.has("bread"):
        take_food(stock, float(cost["bread"]))
