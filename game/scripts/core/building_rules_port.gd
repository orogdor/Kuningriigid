extends RefCounted
## V131 pure building prerequisites from economy.js / research.js and
## workforce capacity rules from labor.js. Not a port of builder movement.
const Economy = preload("res://scripts/core/economy_port.gd")
const HALL_CAPACITY: int = 4
const HOUSE_CAPACITY: int = 3
const MAX_UNFINISHED_PER_FACTION: int = 12
const RESEARCH_UNLOCKS: Dictionary = {
    "study":"learning", "quarry":"stone_tools", "house":"stone_tools",
    "well":"water", "farm":"agriculture", "hunter":"hunting",
    "fisher":"fishing", "saw":"woodworking", "mill":"milling",
    "bakery":"milling", "barracks":"warfare", "archery":"archery",
    "stable":"horsemanship", "mine":"iron", "coal":"iron",
    "smelter":"smelting", "smith":"smithing", "warehouse":"storage",
    "cellar":"cellaring", "market":"commerce", "harbor":"shipbuilding",
    "steelworks":"steelmaking", "machine_shop":"steam_engine"
}

static func housing_capacity(buildings: Array) -> int:
    var houses: int = 0
    for b in buildings:
        if String(b.get("type","")) == "house" and bool(b.get("ready",false)) and float(b.get("hp",0.0)) > 0.0 and not bool(b.get("virtual",false)):
            houses += 1
    return HALL_CAPACITY + houses * HOUSE_CAPACITY

static func worker_efficiency(assigned: float, required: float) -> float:
    return pow(clampf(assigned/maxf(required,.00001),0.0,1.0),.85) if required > 0 else 1.0

static func missing_requirements(buildings: Array, kind: String) -> Array:
    var definition: Dictionary = Economy.BUILDINGS.get(kind, {})
    var missing: Array = []
    for prerequisite in definition.get("requires",[]):
        var found: bool = false
        for b in buildings:
            if String(b.get("type","")) == String(prerequisite) and bool(b.get("ready",false)) and float(b.get("hp",0.0)) > 0.0:
                found = true
                break
        if not found:
            missing.append(prerequisite)
    return missing

static func build_error(kind: String, city: Dictionary, known: Dictionary, total_unfinished: int) -> String:
    if kind == "hall" or not Economy.BUILDINGS.has(kind):
        return "Sellist ehitist ei saa ehitada."
    if total_unfinished >= MAX_UNFINISHED_PER_FACTION:
        return "Ehitusjärjekord on täis (12)."
    var tech: String = String(RESEARCH_UNLOCKS.get(kind,""))
    if tech != "" and not bool(known.get(tech,false)):
        return "Tehnoloogia puudub: " + tech
    var missing: Array = missing_requirements(city["buildings"],kind)
    if not missing.is_empty():
        return "Eelnev hoone puudub: " + ", ".join(PackedStringArray(missing))
    var cost: Dictionary = Economy.BUILDINGS[kind]["cost"]
    if not Economy.can_afford(city["resources"],cost):
        return "Ehitusmaterjale ei jätku."
    return ""
