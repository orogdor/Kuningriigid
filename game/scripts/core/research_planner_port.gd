extends RefCounted
## Adapted from V131 research.js nextResearchForGoals: resolve prerequisites
## recursively, including age gates and alternative prerequisite ('oneOf').
## Preview AI still lacks V131 troop-based research throttling.
const Research = preload("res://scripts/core/research_port.gd")
const ERA_GATES: Array[String] = ["", "bronze", "iron", "civics", "renaissance", "industrialization", "modernity"]
const AI_GOALS: Array[String] = [
    "hunting", "stone_tools", "learning", "water", "agriculture", "bronze",
    "woodworking", "pottery", "animal_husbandry", "masonry", "warfare",
    "fortifications", "archery", "settlement", "stone_crafts", "wheel",
    "copper_tin", "stone_fortifications", "road_construction", "forestry",
    "storage", "cellaring", "commerce", "writing", "bronze_crafts",
    "milling", "bridges", "fishing", "shipbuilding", "iron", "smelting",
    "smithing", "horsemanship", "early_siege_engineering", "ancient_artillery",
    "philosophy", "iron_crafts", "navigation", "civics", "armor_craft",
    "crossbows", "guilds", "watermills", "windmills", "medieval_healing",
    "city_trade", "monasticism", "knighthood", "castle_building",
    "siege_engineering", "city_fortifications", "scholasticism",
    "medieval_crafts", "ocean_sailing", "renaissance", "printing",
    "astronomy", "gunpowder", "industrialization", "steelmaking",
    "steam_engine", "industrial_education", "rifles", "railways",
    "modernity", "oil_drilling", "petroleum", "electricity", "combustion",
    "modern_science", "aviation"
]

static func next_goal(known: Dictionary, goals: Array = []) -> String:
    var definitions: Dictionary = Research.all_techs()
    var queue: Array = AI_GOALS if goals.is_empty() else goals
    for goal in queue:
        var seen: Dictionary = {}
        var next: String = _find(String(goal),known,definitions,seen)
        if not next.is_empty():
            return next
    return ""

static func _find(id: String, known: Dictionary, definitions: Dictionary, seen: Dictionary) -> String:
    if bool(known.get(id,false)) or not definitions.has(id) or seen.has(id):
        return ""
    seen[id] = true
    var tech: Dictionary = definitions[id]
    var age: int = clampi(int(tech.get("age",0)),0,6)
    var gate: String = ERA_GATES[age]
    if age > 0 and id != gate and not bool(known.get(gate,false)):
        var age_parent: String = _find(gate,known,definitions,seen)
        if not age_parent.is_empty():
            return age_parent
    for ancestor in tech.get("requires",[]):
        if not bool(known.get(ancestor,false)):
            var prior: String = _find(String(ancestor),known,definitions,seen)
            if not prior.is_empty():
                return prior
    var one_of: Array = tech.get("oneOf",[])
    if not one_of.is_empty():
        var alternative_met: bool = false
        for candidate in one_of:
            if bool(known.get(candidate,false)):
                alternative_met = true
                break
        if not alternative_met:
            for candidate in one_of:
                var prior: String = _find(String(candidate),known,definitions,seen)
                if not prior.is_empty():
                    return prior
    return id if Research.can_unlock(id,known) else ""
