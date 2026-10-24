extends RefCounted
## V131 labor.js workforce allocation: priority and nonlinear efficiency.
## Preview integration only. Does not port villagers' physical hauling, foundation
## staff reserves, military mobilization or per-district shared labor.
const Economy = preload("res://scripts/core/economy_port.gd")
const Needs = preload("res://scripts/core/city_needs_port.gd")
const Buildings = preload("res://scripts/core/building_rules_port.gd")

static func work_priority(kind: String, stock: Dictionary, population: int) -> int:
    var food_critical: bool = Needs.food_total(stock) < float(population) * 2.5
    var water_critical: bool = float(stock.get("water",0.0)) < float(population) * 2.0
    if food_critical and kind in ["hunter","fisher","bakery","farm","pasture"]:
        return 171
    if water_critical and kind == "well":
        return 169
    if kind == "forester" and float(stock.get("wood",0.0)) < 70.0:
        return 159
    if kind in ["hunter","fisher","farm","mill","bakery"]:
        return 100 if food_critical else 65
    if kind == "well":
        return 95 if water_critical else 68
    if kind in ["lumber","quarry"]:
        return 78
    if kind == "saw":
        return 86 if float(stock.get("plank",0.0)) < 50.0 else 65
    if kind in ["study","scriptorium","academy","university","observatory","polytechnic","laboratory"]:
        return 61
    if kind in ["mine","coal","smelter","smith"]:
        return 55
    return 28

static func allocation(city: Dictionary) -> Dictionary:
    var buildings: Array = city.get("buildings",[])
    var stock: Dictionary = city.get("resources",{})
    var population: int = maxi(0,int(city.get("pop",0)))
    var available: float = float(mini(population,Buildings.housing_capacity(buildings)))
    var unfinished: bool = false
    for b in buildings:
        if not bool(b.get("ready",false)) and not bool(b.get("disabled",false)):
            unfinished = true
            break
    # V131 reserves builder jobs. Preview treats one builder as an abstract job;
    # no physical hauling/path exists yet.
    var builders: float = minf(1.0,available) if unfinished else 0.0
    available -= builders
    var jobs: Array = []
    for i in range(buildings.size()):
        var b: Dictionary = buildings[i]
        b["assigned"] = 0.0
        b["efficiency"] = 0.0
        if not bool(b.get("ready",false)) or bool(b.get("disabled",false)) or bool(b.get("virtual",false)) or float(b.get("hp",0.0)) <= 0.0:
            continue
        var definition: Dictionary = Economy.BUILDINGS.get(String(b.get("type","")),{})
        var required: float = float(definition.get("workers",0.0))
        if required <= 0.0 or (not definition.has("out") and String(b.get("type","")) not in ["study","scriptorium","academy","university","observatory","polytechnic","laboratory","market","warehouse"]):
            continue
        var recipe: Dictionary = definition.get("input",{})
        if not Economy.can_afford(stock,recipe):
            continue
        var output: String = String(definition.get("out",""))
        if not output.is_empty() and float(stock.get(output,0.0)) >= Economy.storage_limit(buildings,output):
            continue
        jobs.append({"index":i,"need":required,"priority":work_priority(String(b.get("type","")),stock,population)})
    jobs.sort_custom(func(a: Dictionary,b: Dictionary) -> bool:
        if int(a["priority"]) == int(b["priority"]):
            return int(a["index"]) < int(b["index"])
        return int(a["priority"]) > int(b["priority"]))
    # Guarantee a seed crew when there is room, then fill by priority, as in
    # V131 allocateCity. This preview doesn't model special AI foundation jobs.
    for job in jobs:
        var seed: float = minf(minf(float(job["need"]),0.25),available)
        buildings[int(job["index"])]["assigned"] = seed
        available -= seed
    for job in jobs:
        var i: int = int(job["index"])
        var b: Dictionary = buildings[i]
        var extra: float = minf(maxf(0.0,float(job["need"]) - float(b["assigned"])),available)
        b["assigned"] = float(b["assigned"]) + extra
        available -= extra
        b["efficiency"] = Buildings.worker_efficiency(float(b["assigned"]),float(job["need"]))
    city["builders_assigned"] = builders
    city["idle_workers"] = available
    return {"builders":builders,"jobs":jobs.size(),"idle":available}
