extends RefCounted
## New preview-only deterministic AI harness, NOT V131 strategic AI.
## Tests native 3D refresh when automated cities construct buildings.
const Economy = preload("res://scripts/core/economy_port.gd")
const CityLayout = preload("res://scripts/core/city_layout_port.gd")
const CityPlanning = preload("res://scripts/core/city_planning_port.gd")
const CityFortifications = preload("res://scripts/core/city_fortification_port.gd")
const BuildingRules = preload("res://scripts/core/building_rules_port.gd")
const Research = preload("res://scripts/core/research_port.gd")
const Planner = preload("res://scripts/core/research_planner_port.gd")
const RESEARCH_ORDER: Array[String] = ["hunting","stone_tools","water","settlement","learning","pottery","agriculture","fishing","warfare","bronze","woodworking","milling","iron","smelting","smithing","civics"]
const BUILD_ORDER: Array[String] = ["lumber","hunter","quarry","well","study","saw","house","farm","mill","bakery","market","mine","coal","smelter","smith","steelworks","machine_shop"]

static func team_research_choice(known: Dictionary) -> String:
    return Planner.next_goal(known)

static func choose_building(city: Dictionary, known: Dictionary, unfinished: int) -> String:
    var buildings: Array = city["buildings"]
    var stock: Dictionary = city.get("resources",{})
    var pop: int = int(city.get("pop",3))
    var foods: float = float(stock.get("bread",0)) + float(stock.get("grain",0)) * 0.70 + float(stock.get("meat",0)) + float(stock.get("fish",0))
    var priorities: Array[String] = []
    # Same V131 motivation as labor.js: emergency food and water first.
    if foods < float(pop) * 2.5:
        priorities.append_array(["hunter","farm","bakery"])
    if float(stock.get("water",0)) < float(pop) * 2.0:
        priorities.append("well")
    if float(stock.get("wood",0)) < 25.0:
        priorities.append("lumber")
    if pop >= BuildingRules.housing_capacity(buildings)-1:
        priorities.append("house")
    for kind in BUILD_ORDER:
        if not priorities.has(kind):
            priorities.append(kind)
    for kind in priorities:
        var count: int = 0
        for b in buildings:
            if String(b.get("type","")) == kind:
                count += 1
        var target: int = 1
        # Population-scaled real production instead of the old hard ceiling
        # of TWO farms, TWO hunters and TWO wells per entire city. Larger
        # urban populations must expand their producing districts as well.
        if kind == "lumber":
            target = maxi(2 if pop >= 6 else 1,ceili(float(pop)/36.0))
        elif kind == "farm":
            target = maxi(2 if pop >= 6 else 1,ceili(float(pop)/23.0))
        elif kind == "hunter":
            target = maxi(2 if pop >= 6 else 1,ceili(float(pop)/28.0))
        elif kind == "well":
            target = maxi(1,ceili(float(pop)/24.0))
        elif kind == "saw":
            target = maxi(1,ceili(float(pop)/45.0))
        elif kind == "house":
            target = CityPlanning.housing_target(pop)
        # One extra food/water producer is a *paid* resilience reserve,
        # only when supplies have actually run critically low.
        if kind == "hunter" and foods < float(pop)*2.5:
            target = maxi(target,2 if pop < 12 else ceili(float(pop)/23.0))
        if kind == "well" and float(stock.get("water",0.0)) < float(pop)*2.0:
            target = maxi(target,2 if pop < 12 else ceili(float(pop)/20.0))
        target = mini(target,32) # Avoid runaway construction in corrupted saves.
        if count >= target:
            continue
        if BuildingRules.build_error(kind,city,known,unfinished).is_empty():
            return kind
    return ""

static func _ready_count(buildings: Array,kind: String) -> int:
    var n: int = 0
    for b in buildings:
        if String(b.get("type","")) == kind and bool(b.get("ready",false)):
            n += 1
    return n

static func advance(state: Dictionary,landscape = null) -> void:
    var towns: Array = state.get("cities",[])
    var teams: Dictionary = state.get("teams",{})
    for team in range(1,4):
        if not teams.has(team):
            continue
        var team_state: Dictionary = teams[team]
        if String(team_state.get("active","")).is_empty():
            var choice: String = team_research_choice(team_state.get("known",{}))
            if choice != "":
                team_state["active"] = choice
                team_state["progress"] = 0.0
                state["ai_research_orders"] = int(state.get("ai_research_orders",0)) + 1
    for i in range(towns.size()):
        var city: Dictionary = towns[i]
        var team: int = int(city.get("team",0))
        if team <= 0 or not teams.has(team):
            continue
        var pending: int = 0
        for town in towns:
            if int(town.get("team",-1)) == team:
                for b in town["buildings"]:
                    if not bool(b.get("ready",false)):
                        pending += 1
        # Keep a single construction task per preview city. This is an AI
        # workload generator, not the real Kuningriigid construction strategy.
        if pending >= 3:
            continue
        var own_pending: bool = false
        for b in city["buildings"]:
            if not bool(b.get("ready",false)):
                own_pending = true
                break
        if own_pending:
            continue
        # AI fortifies developed bronze-era districts only with real surplus.
        # One tile per planner tick; the same stock pays as manual construction.
        var stock: Dictionary = city.get("resources",{})
        if float(stock.get("bread",0.0)) >= float(city.get("pop",3))*1.5 and float(stock.get("water",0.0)) >= float(city.get("pop",3)) and float(stock.get("wood",0.0)) >= 80.0:
            var wall: Dictionary = CityFortifications.build_next(city)
            if bool(wall.get("ok",false)):
                state["revision"] = int(state.get("revision",0)) + 1
                state["ai_wall_orders"] = int(state.get("ai_wall_orders",0)) + 1
        var kind: String = choose_building(city,teams[team]["known"],pending)
        if kind == "":
            continue
        if not CityLayout.ensure_positions(city):
            continue
        var lots: Array = []
        for existing in city["buildings"]:
            if existing.has("site_x") and existing.has("site_z"):
                lots.append({"point":Vector2(float(existing["site_x"]),float(existing["site_z"]))-CityLayout.center(city),"kind":String(existing.get("type","house"))})
        var placement: Dictionary = CityLayout.find_free_site(city,kind,lots,landscape)
        if not bool(placement["ok"]):
            continue
        var absolute: Vector2 = CityLayout.center(city)+placement["point"]
        var definition: Dictionary = Economy.BUILDINGS[kind]
        Economy.spend_resources(city["resources"],definition["cost"])
        var material_total: float = 0.0
        for quantity in definition["cost"].values():
            material_total += float(quantity)
        city["buildings"].append({"type":kind,"ready":false,"progress":0.0,"time":float(definition["time"]),"hp":350.0,"efficiency":0.0,"assigned":0.0,"materialsTotal":material_total,"materialsRemaining":material_total,"site_x":absolute.x,"site_z":absolute.y})
        state["revision"] = int(state.get("revision",0)) + 1
        state["ai_build_orders"] = int(state.get("ai_build_orders",0)) + 1
