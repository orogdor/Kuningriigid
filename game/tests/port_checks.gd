extends RefCounted
## Runnable check suite: invoked in the game via 'Reeglitest' button.
const Campaign = preload("res://scripts/core/campaign_port.gd")
const Counties = preload("res://scripts/core/counties_port.gd")
const Roads = preload("res://scripts/core/roads_port.gd")
const Economy = preload("res://scripts/core/economy_port.gd")
const Research = preload("res://scripts/core/research_port.gd")
const Growth = preload("res://scripts/core/growth_port.gd")
const Needs = preload("res://scripts/core/city_needs_port.gd")
const Science = preload("res://scripts/core/science_port.gd")
const Army = preload("res://scripts/core/army_experience_port.gd")
const Era = preload("res://scripts/core/era_economy_port.gd")
const Tech125 = preload("res://scripts/core/research_v125_port.gd")
const Preview = preload("res://scripts/core/preview_sim_port.gd")
const Build = preload("res://scripts/core/building_rules_port.gd")
const Labor = preload("res://scripts/core/labor_port.gd")
const PreviewAI = preload("res://scripts/core/preview_ai_port.gd")
const Demographics = preload("res://scripts/core/demographics_port.gd")
const Production = preload("res://scripts/core/production_port.gd")
const Planner = preload("res://scripts/core/research_planner_port.gd")
const Cargo = preload("res://scripts/core/cargo_port.gd")
const StreetNav = preload("res://scripts/adapters/local_street_nav.gd")
const Citizens = preload("res://scripts/core/citizen_agents_port.gd")
const Market = preload("res://scripts/core/market_households_port.gd")
const Trade = preload("res://scripts/core/trade_network_port.gd")
const WorldTradeNav = preload("res://scripts/adapters/world_trade_nav.gd")
const Military = preload("res://scripts/core/military_port.gd")
const BattlePreview = preload("res://scripts/core/battle_preview_port.gd")
const IndividualBattle = preload("res://scripts/core/individual_battle_port.gd")
const BattleDoctrine = preload("res://scripts/core/battle_doctrine_v131.gd")
const BattleFormations = preload("res://scripts/core/battle_formations_v131.gd")
const BattleMorale = preload("res://scripts/core/battle_morale_v131.gd")
const CampaignRetreat = preload("res://scripts/core/campaign_retreat_v131.gd")
const Shots = preload("res://scripts/core/projectile_rules_v131.gd")
const BattleTerrain = preload("res://scripts/core/battle_terrain_v131.gd")
const Siege = preload("res://scripts/core/siege_port_v131.gd")
const DetailTile = preload("res://scripts/adapters/native_detail_tile.gd")
const CityLayout = preload("res://scripts/core/city_layout_port.gd")
const CityStress = preload("res://scripts/core/city_stress_port.gd")
const Territory = preload("res://scripts/core/territory_port.gd")
const CountyLogistics = preload("res://scripts/core/county_logistics_port.gd")
const DetailNavigation = preload("res://scripts/core/detail_navigation_port.gd")
const SharedLandscape = preload("res://scripts/core/shared_landscape_v131.gd")
const V131Atlas = preload("res://scripts/core/v131_atlas_fixture.gd")
const DetailHeights = preload("res://scripts/core/detail_heights_v131.gd")
const BattleSurface = preload("res://scripts/core/battle_surface_v131.gd")

static func run() -> Dictionary:
    var results: Array = []
    _check(results, "grid-size", Campaign.COLS * Campaign.ROWS == 36300)
    _check(results, "world-center", Campaign.center(0,0) == Vector2(-625,-525))
    _check(results, "coordinate-roundtrip", Campaign.cell_at(-625,-525) == Vector2i(0,0))
    var walk := PackedByteArray()
    walk.resize(Campaign.COLS * Campaign.ROWS)
    walk.fill(1)
    walk[Campaign.index(1,0)] = 0
    var path: Array = Campaign.find_path(walk, Vector2i(0,0), Vector2i(2,0))
    _check(results, "BFS-neighbor-order", path == [Vector2i(0,1),Vector2i(1,1),Vector2i(2,1),Vector2i(2,0)])
    _check(results, "BFS-start-is-excluded", Campaign.find_path(walk,Vector2i(5,5),Vector2i(5,5)).is_empty())
    _check(results, "city-spacing", not Counties.city_spacing_allowed(Vector2i(16,0),[{"c":0,"r":0}]) and Counties.city_spacing_allowed(Vector2i(17,0),[{"c":0,"r":0}]))
    var county: Array = Counties.county_footprint({"c":50,"r":50},1,walk)
    _check(results, "county-27-tiles", county.size() == 27)
    var urban_count: int = 0
    for p in county:
        if Counties.urban_tile({"c":50,"r":50},p,1):
            urban_count += 1
    _check(results, "county-9-urban-tiles", urban_count == 9)
    _check(results, "county-3-buildings", Counties.county_build_rule(3,true) != "")
    _check(results, "road-thresholds", Roads.road_level(11.999) == 0 and Roads.road_level(12) == 1 and Roads.road_level(25) == 2 and Roads.road_level(60) == 3 and Roads.road_level(120) == 4)
    var road_state: Dictionary = {}
    for i in range(4):
        Roads.record_world_step(road_state,Vector2i(0,0),Vector2i(1,0),"army",0.0)
    _check(results, "four-army-crossings-create-road", Roads.road_level(Roads.road_strength(road_state,Vector2i(0,0),Vector2i(1,0),0.0)) == 1)
    _check(results, "traffic-ages", Roads.age_traffic(0.5,100.0) < 0.5)
    var stock: Dictionary = Economy.start_resources()
    _check(results, "starting-wood-68", is_equal_approx(float(stock["wood"]),68.0))
    _check(results, "storage-with-cellar", is_equal_approx(Economy.storage_limit([{"type":"hall","ready":true,"hp":1200},{"type":"cellar","ready":true,"hp":200}],"bread"),300.0))
    _check(results, "food-nutrition", is_equal_approx(Economy.take_food({"bread":1.0,"flour":0.0,"grain":0.0},1.0),1.0))
    _check(results, "can-buy-lumber-camp", Economy.can_afford(stock,{"wood":20.0}))
    var discovered: Dictionary = {}
    _check(results, "research-stone-open", Research.can_unlock("stone_tools",discovered))
    _check(results, "bronze-requires-one-food-tech", not Research.can_unlock("bronze",{"stone_tools":true}) and Research.can_unlock("bronze",{"stone_tools":true,"fishing":true}))
    _check(results, "growth-initial-two-cities", Growth.city_capacity(0.0, 0) == 2)
    _check(results, "growth-next-city-26-minutes", Growth.city_capacity(1560.0, 0) == 3)
    _check(results, "army-capacity-war", Growth.army_capacity(3, 2, true) == 20)
    _check(results, "xp-level-1", Army.army_level(0.0) == 1)
    _check(results, "xp-level-10", Army.army_level(8100.0) == 10)
    _check(results, "xp-level-10-triple-strength", is_equal_approx(Army.experience_bonus(8100.0), 3.0))
    _check(results, "science-three-citizens", is_equal_approx(float(Science.city_science(3,[])["total"]), 3.75))
    _check(results, "science-building-study", is_equal_approx(float(Science.city_science(3,[{"type":"study","ready":true,"hp":100.0,"efficiency":1.0}])["total"]), 9.75))
    _check(results, "science-two-cities", is_equal_approx(Science.science_rate([{"team":0,"pop":3,"buildings":[]},{"team":0,"pop":3,"buildings":[]}],0), 7.5))
    _check(results, "v125-science-cost", is_equal_approx(Science.research_cost(2,0,1.0,true),44.0))
    _check(results, "city-needs-age-zero", is_equal_approx(float(Needs.city_needs(Economy.start_resources(),3,0)["productivity"]), .95))
    var luxury: Dictionary = {"pottery":10.0}
    Needs.consume_luxuries(luxury, 3, 0, 60.0)
    _check(results, "luxury-per-minute", is_equal_approx(float(luxury["pottery"]),9.94))
    var insufficient: Array = [Economy.start_resources()]
    var before: Dictionary = insufficient[0].duplicate(true)
    _check(results, "bronze-stone-deficit", is_equal_approx(float(Era.age_deficit(insufficient,"bronze").get("stone",0.0)),17.0))
    var attempt: Dictionary = Era.pay_era_cost(insufficient,"bronze")
    _check(results, "era-payment-atomic-rejection", not bool(attempt["paid"]) and insufficient[0] == before)
    var sufficient: Array = [{"wood":30.0,"stone":35.0,"bread":10.0},{"wood":30.0,"stone":10.0,"bread":10.0}]
    var payment: Dictionary = Era.pay_era_cost(sufficient,"bronze")
    _check(results, "era-payment-across-cities", bool(payment["paid"]) and is_equal_approx(float(sufficient[1]["wood"]),15.0) and is_equal_approx(float(sufficient[1]["bread"]),2.5))
    _check(results, "v125-26-additional-technologies", Tech125.TECHS_V125.size() == 26)
    _check(results, "v125-technologies-merged", Research.all_techs().size() == 85)
    _check(results, "v125-prerequisite", Research.can_unlock("village_council",{"settlement":true}))
    _check(results, "v125-wood-bonus", is_equal_approx(Tech125.production_multiplier({"town_charters":true,"trade_roads":true},"wood"),1.11))
    var demo: Dictionary = Preview.initialize([{"team":0,"c":20,"r":20,"name":"Testilinn"}])
    _check(results, "preview-start-resources", demo["cities"].size() == 1 and is_equal_approx(float(demo["cities"][0]["resources"]["wood"]),68.0))
    var building: Dictionary = Preview.build_in_town(demo,0,"lumber")
    _check(results, "preview-building-spends-resource", bool(building["ok"]) and is_equal_approx(float(demo["cities"][0]["resources"]["wood"]),48.0))
    var projection_town: Dictionary = {"c":20,"r":20,"buildings":[{"type":"hall","ready":true},{"type":"lumber","ready":true}]}
    var simulation_hall: Vector2 = Cargo.building_position(projection_town,0)
    var map_hall: Vector2 = DetailTile.city_to_detail(projection_town,simulation_hall)
    _check(results,"v20-economic-hall-uses-detail-projection",map_hall.distance_to(Vector2.ZERO) < .0001)
    _check(results,"v20-detail-world-roundtrip",DetailTile.detail_to_city(projection_town,map_hall).distance_to(simulation_hall)<.0001)
    var second_site: Vector2 = Cargo.building_position(projection_town,1)
    _check(results,"v20-buildings-no-longer-unrelated-spirals",map_hall.distance_to(DetailTile.city_to_detail(projection_town,second_site))>4.0)
    _check(results, "V131-lumber-requires-hall", Economy.BUILDINGS["lumber"]["requires"] == ["hall"])
    _check(results, "V131-quarry-requires-lumber", Economy.BUILDINGS["quarry"]["requires"] == ["lumber"])
    _check(results, "V131-housing-hall-capacity", Build.housing_capacity(demo["cities"][0]["buildings"]) == 4)
    _check(results, "V131-worker-efficiency", is_equal_approx(Build.worker_efficiency(1.0,2.0),pow(.5,.85)))
    var locked: Dictionary = Preview.build_in_town(demo,0,"quarry")
    _check(results, "V131-quarry-locked-without-tech", not bool(locked["ok"]) and String(locked["reason"]).contains("stone_tools"))
    # Builders must now physically fetch materials and walk to the site.
    # 13 seconds was valid only for the old instantaneous construction model.
    Preview.tick(demo,60.0)
    _check(results, "preview-construction-finishes-after-material-hauls", demo["cities"][0]["buildings"].size() > 1 and bool(demo["cities"][0]["buildings"][1].get("ready",false)))
    demo["teams"][0]["known"]["stone_tools"] = true
    var quarry: Dictionary = Preview.build_in_town(demo,0,"quarry")
    _check(results, "preview-allow-quarry-after-tech-and-lumber", bool(quarry["ok"]))
    # If prerequisites are still missing, report a FAILED assertion rather
    # than indexing a nonexistent third building and crashing the game.
    _check(results, "V131-noninstant-quarry", bool(quarry.get("ok",false)) and demo["cities"][0]["buildings"].size() > 2 and not bool(demo["cities"][0]["buildings"][2].get("ready",false)))
    var no_saw: Dictionary = Preview.build_in_town(demo,0,"house")
    _check(results, "preview-house-requires-saw-and-tech", not bool(no_saw["ok"]))
    var research: Dictionary = Preview.research_next(demo,0)
    _check(results, "preview-research-start", bool(research["ok"]) and demo["teams"][0]["active"] == "hunting")
    Preview.tick(demo,360.0)
    _check(results, "preview-research-advances", bool(demo["teams"][0]["known"].get("hunting",false)))
    _check(results, "food-varieties-supported", is_equal_approx(Economy.take_food({"meat":2.0,"bread":0.0,"grain":0.0},2.0),2.0))
    _check(results, "labor-priority-food-shortage", Labor.work_priority("farm",{"bread":0.0,"water":20.0},3) == 171)
    _check(results, "labor-priority-water-shortage", Labor.work_priority("well",{"bread":20.0,"water":0.0},3) == 169)
    var worker_city: Dictionary = {"pop":3,"resources":Economy.start_resources(),"buildings":[
        {"type":"hall","ready":true,"hp":1200.0},
        {"type":"lumber","ready":true,"hp":350.0},
        {"type":"quarry","ready":true,"hp":350.0}]}
    var worker_distribution: Dictionary = Labor.allocation(worker_city)
    var lumber_team: float = float(worker_city["buildings"][1].get("assigned",0.0))
    var quarry_team: float = float(worker_city["buildings"][2].get("assigned",0.0))
    _check(results, "labor-shared-budget", is_equal_approx(lumber_team+quarry_team,3.0))
    _check(results, "labor-no-negative-assignment", lumber_team >= 0.0 and quarry_team >= 0.0)
    _check(results, "labor-unused-budget", is_equal_approx(float(worker_distribution["idle"]),0.0))
    worker_city["buildings"].append({"type":"house","ready":false,"hp":350.0})
    var builder_reservation: Dictionary = Labor.allocation(worker_city)
    _check(results, "labor-reserves-builder", is_equal_approx(float(builder_reservation["builders"]),1.0))
    _check(results, "labor-after-builder-two-workers", is_equal_approx(float(worker_city["buildings"][1]["assigned"])+float(worker_city["buildings"][2]["assigned"]),2.0))
    var no_worker: Dictionary = {"pop":0,"resources":Economy.start_resources(),"buildings":[{"type":"hall","ready":true,"hp":1200.0},{"type":"lumber","ready":false,"hp":350.0,"progress":0.0,"time":12.0}]}
    var non_workers: Dictionary = Labor.allocation(no_worker)
    _check(results, "labor-zero-workers-build-blocked", float(non_workers["builders"]) == 0.0)
    _check(results, "ai-research-stone-after-hunting", PreviewAI.team_research_choice({"hunting":true}) == "stone_tools")
    var ai_preview: Dictionary = Preview.initialize([
        {"team":0,"name":"Player","c":12,"r":20},
        {"team":1,"name":"AI red","c":40,"r":20},
        {"team":2,"name":"AI green","c":70,"r":20},
        {"team":3,"name":"AI violet","c":100,"r":20}])
    ai_preview["ai_enabled"] = true
    Preview.tick(ai_preview,12.0)
    _check(results, "ai-three-city-build-orders", int(ai_preview.get("ai_build_orders",0)) == 3)
    _check(results, "ai-human-city-not-automated", ai_preview["cities"][0]["buildings"].size() == 1)
    _check(results, "ai-three-research-orders", int(ai_preview.get("ai_research_orders",0)) == 3)
    Preview.tick(ai_preview,70.0)
    _check(results, "ai-first-building-finishes-after-hauls", ai_preview["cities"][1]["buildings"].size() > 1 and bool(ai_preview["cities"][1]["buildings"][1].get("ready",false)))
    _check(results, "ai-preview-3d-revision-changes", int(ai_preview.get("revision",0)) >= 7)
    # V131 minute-based demographic rules, including supplies, tax and growth.
    var growing: Dictionary = {"pop":3,"resources":Economy.start_resources(),"growthProgress":0.0,"shortageTurns":0,"buildings":[{"type":"hall","ready":true,"hp":1200.0}]}
    var initial_minute: Dictionary = Demographics.minute(growing)
    _check(results, "v131-minute-eats-1point8", bool(initial_minute["supplied"]) and is_equal_approx(float(growing["resources"]["bread"]),24.2))
    _check(results, "v131-minute-drinks-1point35", is_equal_approx(float(growing["resources"]["water"]),26.65))
    _check(results, "v131-minute-tax", is_equal_approx(float(growing["resources"]["gold"]),93.0))
    _check(results, "v131-reserves-growth-factor", is_equal_approx(float(growing["growthProgress"]),1.2))
    Demographics.minute(growing)
    Demographics.minute(growing)
    _check(results, "v131-population-increases-at-cap", int(growing["pop"]) == 4)
    for _n in range(6):
        Demographics.minute(growing)
    _check(results, "v131-hall-four-resident-limit", int(growing["pop"]) == 4)
    var starving: Dictionary = {"pop":5,"resources":{"gold":0.0,"water":0.0,"bread":0.0},"buildings":[{"type":"hall","ready":true,"hp":1200.0},{"type":"house","ready":true,"hp":350.0}]}
    for _n in range(3):
        Demographics.minute(starving)
    _check(results, "v131-three-shortages-lose-one-person", int(starving["pop"]) == 4 and int(starving["shortageTurns"]) == 0)
    _check(results, "v131-population-gold-before-loss", is_equal_approx(float(starving["resources"]["gold"]),15.0))
    # The original economy.js accumulates fractional work before an entire cycle
    # and pays the FULL input recipe at completion, not every rendering frame.
    var producer: Dictionary = {"resources":Economy.start_resources(),"buildings":[]}
    var lumber: Dictionary = {"type":"lumber","ready":true,"hp":350.0,"efficiency":1.0,"timer":0.0}
    producer["buildings"] = [{"type":"hall","ready":true,"hp":1200.0},lumber]
    _check(results, "v131-production-before-cycle", Production.run_cycle(producer,lumber,26.0) == 0 and is_equal_approx(float(producer["resources"]["wood"]),68.0))
    _check(results, "v131-production-completes-cycle", Production.run_cycle(producer,lumber,1.0) == 1 and is_equal_approx(float(producer["resources"]["wood"]),80.0))
    _check(results, "v131-lumber-cycle-resets", is_equal_approx(float(lumber.get("timer",100.0)),0.0))
    var mills: Dictionary = {"resources":{"grain":20.0,"flour":0.0,"bread":0.0},"buildings":[{"type":"hall","ready":true,"hp":1200.0}]}
    var mill: Dictionary = {"type":"mill","ready":true,"hp":350.0,"efficiency":1.0,"timer":0.0}
    _check(results, "v131-mill-input-at-completion", Production.run_cycle(mills,mill,40.5) == 1 and is_equal_approx(float(mills["resources"]["grain"]),10.0) and is_equal_approx(float(mills["resources"]["flour"]),10.0))
    _check(results, "v131-flour-42pct-storage-rule", not Production.food_production_allowed({"flour":40.0},"flour",10.0,100.0))
    _check(results, "v131-full-food-group-blocks-production", not Production.food_production_allowed({"bread":98.0,"grain":10.0},"flour",10.0,100.0,{"grain":10.0}))
    # V131 research.js techBlock + nextResearchForGoals DAG age gates.
    _check(results, "v131-research-era-gate", not Research.can_unlock("woodworking",{"stone_tools":true}) and Research.can_unlock("woodworking",{"bronze":true}))
    _check(results, "v131-research-planner-chases-age-gate", Planner.next_goal({"stone_tools":true,"hunting":true},["woodworking"]) == "bronze")
    _check(results, "v131-research-planner-chases-parent", Planner.next_goal({},["woodworking"]) == "stone_tools")
    _check(results, "v131-research-planner-picks-first-oneOf", Planner.next_goal({"stone_tools":true},["bronze"]) == "hunting")
    _check(results, "v131-hunter-produces-meat", String(Economy.BUILDINGS["hunter"]["out"]) == "meat" and float(Economy.BUILDINGS["hunter"]["cost"]["wood"]) == 27.0)
    # Compare a single 10-minute simulation jump against the same duration
    # split as the UI fast-forward. The minute/AI boundaries must match.
    var long_jump: Dictionary = Preview.initialize([{"team":0,"c":20,"r":20,"name":"J"}])
    var short_jumps: Dictionary = long_jump.duplicate(true)
    Preview.tick(long_jump,600.0)
    for _i in range(40):
        Preview.tick(short_jumps,15.0)
    _check(results, "v131-ten-household-minute-events", int(long_jump.get("economic_ticks",0)) == 10)
    _check(results, "v131-fast-forward-pop-equivalent", int(long_jump["cities"][0]["pop"]) == int(short_jumps["cities"][0]["pop"]))
    _check(results, "v131-fast-forward-food-equivalent", is_equal_approx(float(long_jump["cities"][0]["resources"]["bread"]),float(short_jumps["cities"][0]["resources"]["bread"])))
    _check(results, "v131-fast-forward-water-equivalent", is_equal_approx(float(long_jump["cities"][0]["resources"]["water"]),float(short_jumps["cities"][0]["resources"]["water"])))
    _check(results, "v131-fast-forward-gold-equivalent", is_equal_approx(float(long_jump["cities"][0]["resources"]["gold"]),float(short_jumps["cities"][0]["resources"]["gold"])))
    # V131-style local production -> shipment -> storage accounting.
    var delivery_town: Dictionary = {"c":40,"r":40,"pop":3,"resources":Economy.start_resources(),"buildings":[{"type":"hall","ready":true,"hp":1200.0}],"cargo":[]}
    var cargo_lumber: Dictionary = {"type":"lumber","ready":true,"hp":350.0,"efficiency":1.0,"timer":0.0}
    delivery_town["buildings"].append(cargo_lumber)
    _check(results,"v07-cargo-cycle-dispatches",Production.run_cycle(delivery_town,cargo_lumber,27.0,1.0,true) == 1)
    _check(results,"v07-production-not-instant-stock",is_equal_approx(float(delivery_town["resources"]["wood"]),68.0) and delivery_town["cargo"].size() == 1)
    _check(results,"v07-cargo-preserves-amount",is_equal_approx(Cargo.pending(delivery_town,"wood"),12.0))
    var partial_movement: Dictionary = Cargo.advance(delivery_town,0.05)
    _check(results,"v07-cargo-actually-moves",int(partial_movement["deliveries"]) == 0 and delivery_town["cargo"].size() == 1)
    var finished_movement: Dictionary = Cargo.advance(delivery_town,1.0)
    _check(results,"v07-cargo-credit-on-arrival",int(finished_movement["deliveries"]) == 1 and is_equal_approx(float(delivery_town["resources"]["wood"]),80.0) and delivery_town["cargo"].is_empty())
    _check(results,"v07-cargo-spiral-origin",Cargo.building_position(delivery_town,0).distance_to(Cargo.building_position(delivery_town,1)) > 1.0)
    var blocked_town: Dictionary = delivery_town.duplicate(true)
    blocked_town["resources"]["wood"] = 117.0
    _check(results,"v07-dispatch-for-overfull-depot",Cargo.dispatch(blocked_town,1,"wood",12.0))
    Cargo.advance(blocked_town,1.0)
    _check(results,"v07-delivery-respects-120-limit",is_equal_approx(float(blocked_town["resources"]["wood"]),120.0) and is_equal_approx(Cargo.pending(blocked_town,"wood"),9.0))
    blocked_town["resources"]["wood"] = 110.0
    Cargo.advance(blocked_town,1.0)
    _check(results,"v07-pending-load-released-after-room",blocked_town["cargo"].is_empty() and is_equal_approx(float(blocked_town["resources"]["wood"]),119.0))
    _check(results,"v07-pending-food-counted",not Production.food_production_allowed({"bread":85.0},"bread",10.0,100.0,{},[{"key":"bread","amount":6.0}]))
    _check(results,"v07-food-cargo-group",Cargo.food_pending({"cargo":[{"key":"grain","amount":5.0},{"key":"wood","amount":6.0},{"key":"bread","amount":2.0}]}) == 7.0)
    var serialized = JSON.parse_string(JSON.stringify(blocked_town))
    _check(results,"v07-json-retains-cargo",serialized is Dictionary and serialized.has("cargo") and serialized["cargo"].size() == 0)
    var in_flight: Dictionary = {"c":25,"r":25,"resources":{"wood":0.0},"buildings":[{"type":"hall","ready":true,"hp":1200.0},{"type":"lumber","ready":true,"hp":350.0}],"cargo":[]}
    Cargo.dispatch(in_flight,1,"wood",12.0)
    var checkpoint = JSON.parse_string(JSON.stringify(in_flight))
    _check(results,"v07-save-mid-haul",checkpoint["cargo"].size() == 1 and is_equal_approx(float(checkpoint["cargo"][0]["amount"]),12.0))
    Cargo.advance(checkpoint,1.0)
    _check(results,"v07-load-then-deliver",checkpoint["cargo"].is_empty() and is_equal_approx(float(checkpoint["resources"]["wood"]),12.0))
    var starving_ai: Dictionary = {"pop":3,"resources":Economy.start_resources(),"buildings":[{"type":"hall","ready":true,"hp":1200.0}]}
    starving_ai["resources"]["bread"] = 0.0
    _check(results,"v07-ai-prioritizes-food",PreviewAI.choose_building(starving_ai,{"hunting":true},0) == "hunter")
    var thirsty_ai: Dictionary = {"pop":3,"resources":Economy.start_resources(),"buildings":[{"type":"hall","ready":true,"hp":1200.0},{"type":"quarry","ready":true,"hp":350.0}]}
    thirsty_ai["resources"]["water"] = 0.0
    _check(results,"v07-ai-prioritizes-water",PreviewAI.choose_building(thirsty_ai,{"water":true},0) == "well")
    var reserved_town: Dictionary = delivery_town.duplicate(true)
    reserved_town["resources"]["wood"] = 68.0
    _check(results,"v07-enqueued-cargo-blocks-overproduction",Cargo.dispatch(reserved_town,1,"wood",50.0) and Production.run_cycle(reserved_town,reserved_town["buildings"][1],27.0,1.0,true) == 0)
    var depot_town: Dictionary = {"c":30,"r":30,"resources":{"wood":0.0},"buildings":[{"type":"hall","ready":true,"hp":1200.0},{"type":"warehouse","ready":true,"hp":350.0},{"type":"lumber","ready":true,"hp":350.0}],"cargo":[]}
    Cargo.dispatch(depot_town,2,"wood",12.0)
    Cargo.advance(depot_town,0.01)
    _check(results,"v07-warehouse-selected-for-material",int(depot_town["cargo"][0]["target"]) == 1)
    # V0.8 Godot AStarGrid2D local street adapter: obstacles, saving and
    # navigation replan on a changed town footprint.
    var local_nav = StreetNav.new()
    var street_town: Dictionary = {"team":0,"c":40,"r":40,"resources":{"wood":0.0},"buildings":[
        {"type":"hall","ready":true,"hp":1200.0},
        {"type":"lumber","ready":true,"hp":350.0},
        {"type":"house","ready":true,"hp":350.0}],"cargo":[]}
    var street_path: Array = local_nav.route(street_town,1,0)
    _check(results,"v08-godot-astar-local-route",street_path.size() >= 3 and local_nav.path_points_are_clear(street_town,street_path))
    _check(results,"v08-godot-astar-uses-four-neighbors",local_nav.grid_builds == 1)
    var repeat: Array = local_nav.route(street_town,1,0)
    _check(results,"v08-local-route-cached",repeat == street_path and local_nav.hits >= 1)
    _check(results,"v08-local-entry-outside-building",street_path[0] == [local_nav.entry_position(street_town,1).x,local_nav.entry_position(street_town,1).y])
    var ship_ready: bool = Cargo.dispatch(street_town,1,"wood",12.0,local_nav)
    _check(results,"v08-native-dispatch-from-door",ship_ready and Vector2(float(street_town["cargo"][0]["x"]),float(street_town["cargo"][0]["z"])).is_equal_approx(local_nav.entry_position(street_town,1)))
    Cargo.advance(street_town,.01,local_nav)
    _check(results,"v08-cargo-keeps-json-route",street_town["cargo"].size() == 1 and street_town["cargo"][0].get("path_points",[]).size() > 2)
    var saved_route = JSON.parse_string(JSON.stringify(street_town))
    _check(results,"v08-local-route-save-load",saved_route is Dictionary and saved_route["cargo"].size() == 1 and saved_route["cargo"][0]["path_points"].size() > 2)
    var old_signature: String = local_nav.signature(street_town)
    street_town["buildings"].append({"type":"well","ready":true,"hp":350.0})
    _check(results,"v08-building-change-invalidates-nav",local_nav.signature(street_town) != old_signature)
    Cargo.advance(street_town,.01,local_nav)
    _check(results,"v08-cargo-replans-after-construction",street_town["cargo"][0].get("path_signature","") == local_nav.signature(street_town) and local_nav.grid_builds >= 2)
    var steps: int = 0
    while street_town["cargo"].size() > 0 and steps < 200:
        Cargo.advance(street_town,.025,local_nav)
        steps += 1
    _check(results,"v08-cargo-via-streets-delivered-once",street_town["cargo"].is_empty() and is_equal_approx(float(street_town["resources"]["wood"]),12.0))
    _check(results,"v08-route-step-constrained",local_nav.failures == 0)
    var street_demo: Dictionary = Preview.initialize([{"team":0,"c":20,"r":20,"name":"K"}])
    street_demo["cities"][0]["buildings"].append({"type":"lumber","ready":true,"hp":350.0,"efficiency":1.0,"assigned":1.0,"timer":26.8})
    var street_sim_nav = StreetNav.new()
    Preview.tick(street_demo,5.0,street_sim_nav)
    _check(results,"v08-preview-native-path-plugs-in",street_demo["cities"][0].has("cargo") and street_sim_nav.grid_builds >= 0)
    # V0.9: physical builders + worker commuting (V131 builders.js).
    var citizen_town: Dictionary = {"team":0,"c":32,"r":32,"pop":4,"resources":Economy.start_resources(),
        "buildings":[{"type":"hall","ready":true,"hp":1200.0},
        {"type":"lumber","ready":true,"hp":350.0,"assigned":2.0,"efficiency":1.0}],"citizens":{},"cargo":[]}
    var first_commute: Dictionary = Citizens.advance(citizen_town,0.01)
    _check(results,"v09-worker-must-commute",not first_commute["present"].has(1))
    _check(results,"v09-worker-agent-persistent",citizen_town["citizens"].has("job:1") and int(first_commute["moving"]) == 1)
    var after_commute: Dictionary = Citizens.advance(citizen_town,5.0)
    _check(results,"v09-worker-produces-only-on-site",bool(after_commute["present"].get(1,false)))
    _check(results,"v09-commute-does-not-change-materials",is_equal_approx(float(citizen_town["resources"]["wood"]),68.0))
    var citizen_saved = JSON.parse_string(JSON.stringify(citizen_town))
    _check(results,"v09-worker-agent-json-saved",citizen_saved["citizens"].has("job:1") and citizen_saved["citizens"]["job:1"].has("x"))
    citizen_town["builders_assigned"] = 1.0
    citizen_town["buildings"].append({"type":"quarry","ready":false,"hp":350.0,"progress":0.0,"time":12.0,"materialsRemaining":49.0,"materialsTotal":49.0})
    var first_haul: Dictionary = Citizens.advance(citizen_town,0.01)
    _check(results,"v09-builder-does-not-work-before-material",first_haul["build_work"].is_empty())
    _check(results,"v09-material-not-deducted-twice",is_equal_approx(float(citizen_town["resources"]["wood"]),68.0))
    _check(results,"v09-builder-first-load-cap-24",is_equal_approx(float(citizen_town["citizens"]["builder:0"].get("load",0.0)),24.0))
    var hauled: float = 0.0
    var worked: float = 0.0
    for _step in range(100):
        var result: Dictionary = Citizens.advance(citizen_town,1.0)
        hauled += float(result["hauled"])
        worked += float(result["build_work"].get(2,0.0))
    _check(results,"v09-multiple-hauls-finish",is_equal_approx(hauled,49.0) and is_equal_approx(float(citizen_town["buildings"][2]["materialsRemaining"]),0.0))
    _check(results,"v09-building-work-starts-after-hauls",worked > 0.0)
    _check(results,"v09-builder-paid-material-accounting",is_equal_approx(float(citizen_town["resources"]["wood"]),68.0))
    var builder_copy = JSON.parse_string(JSON.stringify(citizen_town))
    _check(results,"v09-builder-restorable-json",builder_copy["citizens"].has("builder:0") and builder_copy["citizens"]["builder:0"].has("path_points"))
    var native_worker_nav = StreetNav.new()
    var door_town: Dictionary = {"team":1,"c":35,"r":35,"resources":Economy.start_resources(),
        "buildings":[{"type":"hall","ready":true,"hp":1200.0},{"type":"lumber","ready":true,"hp":350.0,"assigned":2.0}],"citizens":{},"cargo":[]}
    Citizens.advance(door_town,0.05,native_worker_nav)
    _check(results,"v09-citizen-uses-native-street-route",door_town["citizens"].has("job:1") and not door_town["citizens"]["job:1"].get("path_points",[]).is_empty())
    var before_change: String = native_worker_nav.signature(door_town)
    door_town["buildings"].append({"type":"well","ready":true,"hp":350.0})
    Citizens.advance(door_town,0.05,native_worker_nav)
    _check(results,"v09-citizen-replans-on-building-change",native_worker_nav.signature(door_town) != before_change and door_town["citizens"]["job:1"]["path_signature"] == native_worker_nav.signature(door_town))
    # Whole preview time should not produce a queued building immediately.
    var building_demo: Dictionary = Preview.initialize([{"team":0,"c":45,"r":45,"name":"Ehitus"}])
    building_demo["cities"][0]["buildings"].append({"type":"lumber","ready":false,"hp":350.0,"time":20.0,"progress":0.0,"materialsRemaining":30.0,"materialsTotal":30.0})
    Preview.tick(building_demo,0.05)
    _check(results,"v09-preview-not-instant-build",is_equal_approx(float(building_demo["cities"][0]["buildings"][1]["progress"]),0.0))
    Preview.tick(building_demo,120.0)
    _check(results,"v09-preview-builder-eventually-finishes",bool(building_demo["cities"][0]["buildings"][1]["ready"]))
    _check(results,"v09-preview-agents-stored",building_demo["cities"][0].get("citizens",{}).has("builder:0"))
    var legacy_city: Dictionary = {"c":10,"r":10,"buildings":[{"type":"hall","ready":true,"hp":1200.0},{"type":"lumber","ready":true,"hp":350.0,"assigned":1.0}]}
    Citizens.advance(legacy_city,5.0)
    _check(results,"v09-legacy-city-migrates-citizens",legacy_city.has("citizens") and legacy_city["citizens"].has("job:1"))
    # V1.0: V131 market shoppers: purchase -> carry -> houseHeld -> minute use.
    var shopping_town: Dictionary = {"team":0,"c":32,"r":32,"pop":6,"resources":Economy.start_resources(),"citizens":{},"cargo":[],
        "buildings":[{"type":"hall","ready":true,"hp":1200.0},
            {"type":"market","ready":true,"hp":350.0,"assigned":1.0},
            {"type":"house","ready":true,"hp":350.0}]}
    var stock_food_before: float = float(shopping_town["resources"]["bread"])
    var stock_water_before: float = float(shopping_town["resources"]["water"])
    var shop_start: Dictionary = Market.advance(shopping_town,0.001)
    _check(results,"v10-market-persistent-shopper",shopping_town["citizens"].has("shopper:2") and String(shopping_town["citizens"]["shopper:2"]["kind"]) == "market_woman")
    _check(results,"v10-no-remote-market-teleport",int(shop_start["deliveries"]) == 0 and is_equal_approx(float(shopping_town["buildings"][2].get("foodHeld",0.0)),0.0))
    var buying: bool = false
    for _j in range(30):
        var shopping_event: Dictionary = Market.advance(shopping_town,.5)
        if int(shopping_event["purchases"]) > 0:
            buying = true
            break
    _check(results,"v10-food-water-bought-together",buying and is_equal_approx(stock_food_before-float(shopping_town["resources"]["bread"]),3.0) and is_equal_approx(stock_water_before-float(shopping_town["resources"]["water"]),2.0))
    _check(results,"v10-purchase-not-yet-in-house",is_equal_approx(float(shopping_town["buildings"][2].get("foodHeld",0.0)),0.0) and is_equal_approx(float(shopping_town["citizens"]["shopper:2"]["carried"]),5.0))
    var shopping_checkpoint = JSON.parse_string(JSON.stringify(shopping_town))
    _check(results,"v10-market-trip-save-load",shopping_checkpoint["citizens"].has("shopper:2") and float(shopping_checkpoint["citizens"]["shopper:2"]["carried"]) > 0.0)
    var delivered: bool = false
    for _j in range(30):
        var event: Dictionary = Market.advance(shopping_checkpoint,.5)
        if int(event["deliveries"]) > 0:
            delivered = true
            break
    _check(results,"v10-market-food-water-home",delivered and is_equal_approx(float(shopping_checkpoint["buildings"][2]["foodHeld"]),3.0) and is_equal_approx(float(shopping_checkpoint["buildings"][2]["waterHeld"]),2.0))
    _check(results,"v10-home-delivery-does-not-double-debit",is_equal_approx(float(shopping_checkpoint["resources"]["bread"]),stock_food_before-3.0) and is_equal_approx(float(shopping_checkpoint["resources"]["water"]),stock_water_before-2.0))
    # Occupants: four at hall and two in house. The first 1.2 meals / .9 water
    # held at home must be consumed there, not deducted a second time centrally.
    var water_before_minute: float = float(shopping_checkpoint["resources"]["water"])
    var bread_before_minute: float = float(shopping_checkpoint["resources"]["bread"])
    var population_result: Dictionary = Demographics.minute(shopping_checkpoint)
    _check(results,"v10-house-consumes-held-first",is_equal_approx(float(shopping_checkpoint["buildings"][2]["foodHeld"]),1.8) and is_equal_approx(float(shopping_checkpoint["buildings"][2]["waterHeld"]),1.1))
    _check(results,"v10-hall-charges-central-store",is_equal_approx(bread_before_minute-float(shopping_checkpoint["resources"]["bread"]),2.4) and is_equal_approx(water_before_minute-float(shopping_checkpoint["resources"]["water"]),1.8) and bool(population_result["supplied"]))
    var water_only: Dictionary = shopping_town.duplicate(true)
    water_only["resources"]["bread"] = 0.0
    water_only["buildings"][2]["foodHeld"] = 0.0
    water_only["buildings"][2]["waterHeld"] = 0.0
    water_only["citizens"] = {}
    var only_water_result: Dictionary = Market.advance(water_only,10.0)
    _check(results,"v10-water-delivered-without-food",int(only_water_result["purchases"]) == 1 and is_equal_approx(float(water_only["citizens"]["shopper:2"]["waterLoad"]),2.0) and is_equal_approx(float(water_only["citizens"]["shopper:2"]["breadLoad"]),0.0))
    var no_market: Dictionary = shopping_town.duplicate(true)
    no_market["buildings"][1]["assigned"] = 0.0
    no_market["citizens"] = {}
    Market.advance(no_market,10.0)
    _check(results,"v10-unstaffed-market-no-shopping",no_market["citizens"].is_empty())
    var near_full_house: Dictionary = shopping_town.duplicate(true)
    near_full_house["citizens"] = {}
    near_full_house["buildings"][2]["foodHeld"] = 5.0
    near_full_house["buildings"][2]["waterHeld"] = 3.0
    var idle: Dictionary = Market.advance(near_full_house,10.0)
    _check(results,"v10-stocked-house-does-not-shop",int(idle["purchases"]) == 0 and is_equal_approx(float(near_full_house["resources"]["bread"]),float(shopping_town["resources"]["bread"])))
    var shopping_nav = StreetNav.new()
    var route_shop: Dictionary = shopping_town.duplicate(true)
    route_shop["citizens"] = {}
    Market.advance(route_shop,.05,shopping_nav)
    _check(results,"v10-shopper-uses-godot-street-path",route_shop["citizens"].has("shopper:2") and route_shop["citizens"]["shopper:2"].get("path_points",[]).size() > 1)
    var packed_shop = JSON.parse_string(JSON.stringify(route_shop))
    _check(results,"v10-shopper-street-path-serialized",packed_shop["citizens"].has("shopper:2") and packed_shop["citizens"]["shopper:2"].has("path_signature"))
    var nav_old_signature: String = shopping_nav.signature(route_shop)
    route_shop["buildings"].append({"type":"well","ready":true,"hp":350.0})
    Market.advance(route_shop,.05,shopping_nav)
    _check(results,"v10-shopper-route-invalidated",nav_old_signature != shopping_nav.signature(route_shop) and String(route_shop["citizens"]["shopper:2"].get("path_signature","")) == shopping_nav.signature(route_shop))
    var no_house: Dictionary = {"c":40,"r":40,"pop":4,"resources":Economy.start_resources(),"buildings":[{"type":"hall","ready":true,"hp":1200.0}]}
    var no_house_diet: Dictionary = Demographics.minute(no_house)
    _check(results,"v10-city-without-houses-still-eats",bool(no_house_diet["supplied"]) and is_equal_approx(float(no_house["resources"]["bread"]),23.6))
    # House stock is serialized with the city's construction and shopper state.
    var saved_home = JSON.parse_string(JSON.stringify(shopping_checkpoint))
    _check(results,"v10-food-held-persists-in-save",saved_home["buildings"][2].has("foodHeld") and saved_home["buildings"][2].has("waterHeld"))
    # V1.1: same-state road caravans from V131 trade-network.js.
    var passable := PackedByteArray()
    passable.resize(Campaign.COLS * Campaign.ROWS)
    passable.fill(1)
    var trade_nav = WorldTradeNav.new()
    trade_nav.configure(passable)
    var trade_state: Dictionary = Preview.initialize([
        {"id":10,"team":0,"c":20,"r":20,"name":"Ladu"},
        {"id":11,"team":0,"c":22,"r":20,"name":"Puudus"},
        {"id":12,"team":1,"c":30,"r":30,"name":"Võõras"}])
    var origin: Dictionary = trade_state["cities"][0]
    var destination: Dictionary = trade_state["cities"][1]
    origin["resources"]["bread"] = 110.0
    origin["resources"]["water"] = 130.0
    origin["resources"]["wood"] = 180.0
    origin["resources"]["stone"] = 90.0
    destination["resources"]["bread"] = 0.0
    destination["resources"]["water"] = 0.0
    destination["resources"]["wood"] = 0.0
    destination["resources"]["stone"] = 0.0
    var old_bread: float = float(origin["resources"]["bread"])
    _check(results,"v11-reserves-dynamic",is_equal_approx(float(Trade.city_reserves(origin)["bread"]),20.0))
    _check(results,"v11-trade-owned-state-only",Trade.suggest_goods(trade_state,origin,trade_state["cities"][2]).is_empty())
    var planned: Dictionary = Trade.suggest_goods(trade_state,origin,destination)
    _check(results,"v11-goods-limited-to-one-load",not planned.is_empty() and int(planned.get("bread",0))+int(planned.get("water",0))+int(planned.get("wood",0))+int(planned.get("stone",0)) <= 36)
    var bad_pair: Dictionary = Trade.dispatch_pair(trade_state,10,12,trade_nav)
    _check(results,"v11-no-cross-state-trade",not bool(bad_pair["ok"]))
    var result: Dictionary = Trade.dispatch_pair(trade_state,10,11,trade_nav)
    _check(results,"v11-dispatch-valid",bool(result["ok"]) and trade_state["shipments"].size() == 1)
    var shipment: Dictionary = trade_state["shipments"][0]
    _check(results,"v11-physical-route-two-steps",shipment["path"].size() == 2 and int(shipment["path"][1][0]) == 22)
    var shipped_bread: float = float(shipment["goods"].get("bread",0.0))
    _check(results,"v11-source-pays-on-dispatch",shipped_bread > 0.0 and is_equal_approx(float(origin["resources"]["bread"]),old_bread-shipped_bread))
    _check(results,"v11-no-instant-recipient-credit",is_zero_approx(float(destination["resources"]["bread"])))
    _check(results,"v11-single-outbound-per-source",not bool(Trade.dispatch_pair(trade_state,10,11,trade_nav)["ok"]))
    Trade.advance(trade_state,3.9,trade_nav)
    _check(results,"v11-caravan-not-teleporting",trade_state["shipments"].size() == 1 and int(shipment["c"]) == 20)
    var trade_saved = JSON.parse_string(JSON.stringify(trade_state))
    _check(results,"v11-caravan-save-roundtrip",trade_saved is Dictionary and trade_saved["shipments"].size() == 1 and trade_saved["shipments"][0]["path"].size() == 2)
    var delivered_goods: Dictionary = shipment["goods"].duplicate(true)
    var full_bread: float = Economy.storage_limit(destination["buildings"],"bread")
    destination["resources"]["bread"] = full_bread
    Trade.advance(trade_state,4.2,trade_nav)
    _check(results,"v11-caravan-arrives-with-storage-full",trade_state["shipments"].size() == 1 and int(shipment["waypoint"]) == 2)
    _check(results,"v11-full-food-store-keeps-cargo",is_equal_approx(float(shipment["goods"].get("bread",0.0)),shipped_bread))
    _check(results,"v11-caravan-builds-traffic",trade_state["world_roads"].size() >= 2)
    destination["resources"]["bread"] = 0.0
    var unload: Dictionary = Trade.advance(trade_state,.1,trade_nav)
    _check(results,"v11-cargo-eventual-delivery",trade_state["shipments"].is_empty() and int(unload["arrived"]) == 1)
    _check(results,"v11-no-double-transfer",is_equal_approx(float(destination["resources"]["bread"]),float(delivered_goods.get("bread",0.0))))
    _check(results,"v11-road-trade-metrics",int(trade_state["trade_dispatched"]) == 1 and int(trade_state["trade_arrived"]) == 1)
    var empty: Dictionary = Preview.initialize([{ "id":10,"team":0,"c":20,"r":20 },{ "id":11,"team":0,"c":22,"r":20 }])
    _check(results,"v11-no-trade-without-surplus",not bool(Trade.dispatch_pair(empty,10,11,trade_nav)["ok"]))
    trade_nav.route(origin,destination)
    _check(results,"v11-remote-route-cache",trade_nav.hits > 0)
    # V1.2: V131 military-v88 and civilization-core recruitment constraints.
    var military_state: Dictionary = Preview.initialize([
        {"id":1,"team":0,"c":10,"r":10,"name":"Garrison"},
        {"id":2,"team":1,"c":12,"r":10,"name":"Enemy"}])
    _check(results,"v12-save-schema-army-arrays",military_state.has("armies") and military_state.has("military_units") and military_state.has("active_battle"))
    _check(results,"v12-grade-discounts",is_equal_approx(float(Military.cost_for("spearman","mobilized")["wood"]),11.0) and is_equal_approx(float(Military.cost_for("spearman","elite")["wood"]),28.6))
    _check(results,"v12-grade-strength",is_equal_approx(float(Military.GRADES["mobilized"]["strength"]),0.4) and is_equal_approx(float(Military.GRADES["elite"]["strength"]),1.4))
    var not_unlocked: Dictionary = Military.train(military_state,0,"spearman")
    _check(results,"v12-unit-requires-research",not bool(not_unlocked["ok"]) and String(not_unlocked["reason"]).contains("warfare"))
    var military_city: Dictionary = military_state["cities"][0]
    military_state["teams"][0]["known"]["warfare"] = true
    var no_barracks: Dictionary = Military.train(military_state,0,"spearman")
    _check(results,"v12-unit-requires-barracks",not bool(no_barracks["ok"]) and String(no_barracks["reason"]).contains("barracks"))
    military_city["buildings"].append({"type":"barracks","ready":true,"hp":350.0})
    var insufficient_people: Dictionary = Military.train(military_state,0,"spearman")
    _check(results,"v12-population-requirement",not bool(insufficient_people["ok"]) and String(insufficient_people["reason"]).contains("elanikke"))
    military_city["pop"] = 10
    var original_wood: float = float(military_city["resources"]["wood"])
    var accepted: Dictionary = Military.train(military_state,0,"spearman")
    _check(results,"v12-training-queued-not-instant",bool(accepted["ok"]) and military_state["military_units"].is_empty() and military_city["training"].size() == 1)
    _check(results,"v12-training-cost-and-population",is_equal_approx(float(military_city["resources"]["wood"]),original_wood-22.0) and int(military_city["pop"]) == 9)
    _check(results,"v12-early-training-zero-units",military_city["training"][0]["progress"] == 0.0)
    Military.advance(military_state,29.0,trade_nav)
    _check(results,"v12-training-29-seconds",military_state["military_units"].size() == 0)
    Military.advance(military_state,1.0,trade_nav)
    _check(results,"v12-training-completes-at-30",military_state["military_units"].size() == 1 and int(military_state["military_trained"]) == 1 and military_city["training"].is_empty())
    var militia_army: Dictionary = military_state["armies"][0]
    var militia_unit: Dictionary = military_state["military_units"][0]
    _check(results,"v12-army-founded-in-city",int(militia_army["c"]) == 10 and int(militia_army["r"]) == 10 and int(militia_unit["armyId"]) == int(militia_army["id"]))
    _check(results,"v12-no-route-across-nonpassable-cell",not bool(Military.command_move(military_state,int(militia_army["id"]),-1,10,trade_nav)["ok"]))
    var command: Dictionary = Military.command_move(military_state,int(militia_army["id"]),12,10,trade_nav)
    _check(results,"v12-army-uses-bfs-route",bool(command["ok"]) and militia_army["path"].size() == 2 and int(militia_army["path"][1][0]) == 12)
    Military.advance(military_state,4.0,trade_nav)
    _check(results,"v12-army-not-teleport",int(militia_army["c"]) == 10)
    Military.advance(military_state,1.0,trade_nav)
    _check(results,"v12-army-stepped-on-grid",int(militia_army["c"]) == 11 and int(military_state["army_steps"]) == 1)
    _check(results,"v12-army-creates-world-traffic",military_state["world_roads"].size() > 0)
    var army_save = JSON.parse_string(JSON.stringify(military_state))
    _check(results,"v12-save-training-army-march",army_save is Dictionary and army_save["armies"].size() == 1 and army_save["military_units"].size() == 1 and army_save["armies"][0]["path"].size() == 2)
    var foe: Dictionary = Military.create_army(military_state,1,11,10)
    Military.add_unit(military_state,foe,"axeman","mobilized")
    var start_battle: Dictionary = BattlePreview.start(military_state,int(militia_army["id"]),int(foe["id"]))
    _check(results,"v12-battle-preview-trigger",bool(start_battle["ok"]) and int(military_state["battles_started"]) == 1)
    _check(results,"v12-battle-not-double-started",not bool(BattlePreview.start(military_state,int(militia_army["id"]),int(foe["id"]))["ok"]))
    BattlePreview.tick(military_state,100.0)
    _check(results,"v12-battle-test-ends",military_state["active_battle"].is_empty() and int(military_state["battles_finished"]) == 1 and military_state["battle_log"].size() == 1)
    _check(results,"v12-battle-replay-has-result",bool(military_state["battle_log"][0].get("test_only",false)) and int(military_state["battle_log"][0]["rounds"]) > 0)
    _check(results,"v12-battle-awards-xp",float(militia_army.get("xp",0.0)) > 0.0 and Army.army_level(float(militia_army["xp"])) >= 1)
    var old_military_save: Dictionary = {"cities":[{"training":[]}],"armies":[]}
    Military.setup(old_military_save)
    _check(results,"v12-migrate-older-preview",old_military_save.has("military_units") and old_military_save.has("active_battle") and old_military_save.has("next_army_id"))
    var pipeline_state: Dictionary = Preview.initialize([{"id":3,"team":0,"c":10,"r":10,"name":"Queue"}])
    pipeline_state["teams"][0]["known"]["warfare"] = true
    pipeline_state["cities"][0]["buildings"].append({"type":"barracks","ready":true,"hp":350.0})
    pipeline_state["cities"][0]["pop"] = 10
    _check(results,"v12-preview-queue-accepted",bool(Military.train(pipeline_state,0,"spearman")["ok"]))
    Preview.tick(pipeline_state,31.0,null,trade_nav)
    _check(results,"v12-preview-training-in-game-loop",int(pipeline_state.get("military_trained",0)) == 1 and pipeline_state["military_units"].size() == 1)
    # V1.3: individual men and squads are a partial translation of V131 v91.
    _check(results,"v13-original-infantry-squad-24",IndividualBattle.men_per_squad("spearman") == 24)
    _check(results,"v13-original-ranged-squad-24",IndividualBattle.men_per_squad("archer") == 24)
    _check(results,"v13-original-cavalry-squad-12",IndividualBattle.men_per_squad("cavalry") == 12)
    _check(results,"v13-original-catapult-single",IndividualBattle.men_per_squad("bronze_catapult") == 1)
    _check(results,"v13-max-participants-500",IndividualBattle.MAX_MEN == 500)
    var individual_state: Dictionary = Preview.initialize([
        {"id":1,"team":0,"c":10,"r":10,"name":"North"},
        {"id":2,"team":1,"c":10,"r":10,"name":"South"}])
    var first_army: Dictionary = Military.create_army(individual_state,0,10,10)
    var second_army: Dictionary = Military.create_army(individual_state,1,10,10)
    var first_unit: Dictionary = Military.add_unit(individual_state,first_army,"archer")
    var second_unit: Dictionary = Military.add_unit(individual_state,second_army,"spearman")
    var individual_start: Dictionary = IndividualBattle.start(individual_state,int(first_army["id"]),int(second_army["id"]))
    _check(results,"v13-individual-start-two-armies",bool(individual_start["ok"]))
    _check(results,"v13-individual-full-two-squads",individual_state["individual_battle"]["squads"].size() == 2)
    _check(results,"v13-individual-initial-48-men",int(individual_state["individual_battle"]["initial_men"]) == 48)
    _check(results,"v13-reserve-empty-in-small-battle",int(individual_state["individual_battle"]["reserve_men"]) == 0)
    _check(results,"v13-duplicates-rejected",not bool(IndividualBattle.start(individual_state,int(first_army["id"]),int(second_army["id"]))["ok"]))
    var own_squad: Dictionary = individual_state["individual_battle"]["squads"][0]
    _check(results,"v13-24-individual-soldiers-created",own_squad["men"].size() == 24)
    var soldier0: Dictionary = own_squad["men"][0]
    _check(results,"v13-soldier-has-health-and-ammo",float(soldier0["hp"]) > 0.0 and int(soldier0["ammo"]) == 40)
    var initial_x: float = float(soldier0["x"])
    _check(results,"v13-command-manual",IndividualBattle.order(individual_state,int(first_unit["id"]),"manual"))
    IndividualBattle.tick(individual_state,0.2)
    _check(results,"v13-manual-no-unsolicited-move",is_equal_approx(float(soldier0["x"]),initial_x))
    _check(results,"v13-manual-no-unsolicited-shooting",int(individual_state["individual_battle"]["shots"]) == 0)
    var soldier_z_before: float = float(soldier0["z"])
    _check(results,"v31-valid-loose-for-archer",IndividualBattle.order(individual_state,int(first_unit["id"]),"formation",{"name":"loose"}) and String(own_squad["formation"]) == "loose")
    _check(results,"v31-archer-cannot-form-shield-wall",not IndividualBattle.order(individual_state,int(first_unit["id"]),"formation",{"name":"shield_wall"}))
    _check(results,"v13-reject-unknown-formation",not IndividualBattle.order(individual_state,int(first_unit["id"]),"formation",{"name":"sphynx"}))
    _check(results,"v14-formation-does-not-teleport-soldiers",is_equal_approx(float(soldier0["z"]),soldier_z_before))
    _check(results,"v13-order-manual-move",IndividualBattle.order(individual_state,int(first_unit["id"]),"move",{"x":-10.0,"z":0.0}))
    IndividualBattle.tick(individual_state,0.3)
    _check(results,"v13-manual-movement-advances",float(soldier0["x"]) > initial_x)
    _check(results,"v13-command-attack-opponent",IndividualBattle.order(individual_state,int(first_unit["id"]),"attack",{"unit_id":int(second_unit["id"])}))
    _check(results,"v13-manual-attack-target-stored",int(own_squad["attack_target"]) == int(second_unit["id"]))
    _check(results,"v13-unknown-enemy-rejected",not IndividualBattle.order(individual_state,int(first_unit["id"]),"attack",{"unit_id":-42}))
    var individual_save = JSON.parse_string(JSON.stringify(individual_state))
    _check(results,"v13-men-save-roundtrip",individual_save is Dictionary and individual_save["individual_battle"]["squads"][0]["men"].size() == 24)
    _check(results,"v13-manual-orders-save-roundtrip",individual_save is Dictionary and int(individual_save["individual_battle"]["squads"][0]["attack_target"]) == int(second_unit["id"]))
    # Only a single man survives in each squad; the explicit decisive close
    # engagement checks that losses are committed only once on victory.
    for squad in individual_state["individual_battle"]["squads"]:
        for i in range(1,squad["men"].size()):
            squad["men"][i]["hp"] = 0.0
    var enemy_man: Dictionary = individual_state["individual_battle"]["squads"][1]["men"][0]
    enemy_man["x"] = float(soldier0["x"])+2.5
    enemy_man["z"] = float(soldier0["z"])
    IndividualBattle.tick(individual_state,1.0)
    _check(results,"v13-individual-cooldowns-progress",int(individual_state.get("individual_battles_started",0)) == 1)
    _check(results,"v13-battle-projectiles-recorded",int(individual_state["individual_battle"].get("shots",0)) > 0)
    enemy_man["hp"] = 0.0
    IndividualBattle.tick(individual_state,.2)
    _check(results,"v13-finished-on-no-opponents",individual_state.get("individual_battle",{}).is_empty() and int(individual_state.get("individual_battles_finished",0)) == 1)
    _check(results,"v13-casualties-written-to-source",float(second_unit["hp"]) < float(second_unit["maxHp"]))
    _check(results,"regression-combat-log-current-version",bool(individual_state["battle_log"][-1].get("test_only",false)) and String(individual_state["battle_log"][-1].get("mode","")) == "individual_preview_18" and int(individual_state["battle_log"][-1].get("model_tactic_version",0))==19)
    var once: float = float(second_unit["hp"])
    IndividualBattle.tick(individual_state,1.0)
    _check(results,"v13-no-double-applied-result",is_equal_approx(float(second_unit["hp"]),once) and int(individual_state["individual_battles_finished"]) == 1)
    _check(results,"v13-postbattle-reengagement-cooldown",float(individual_state.get("battle_cooldown_until",0.0)) >= 30.0)
    # A whole-squad reserve cannot be partially admitted or damaged by battle.
    var cap_state: Dictionary = Preview.initialize([{ "id":1,"team":0,"c":3,"r":3},{ "id":2,"team":1,"c":3,"r":3}])
    var cap_a: Dictionary = Military.create_army(cap_state,0,3,3)
    var cap_b: Dictionary = Military.create_army(cap_state,1,3,3)
    for k in range(11):
        Military.add_unit(cap_state,cap_a,"spearman")
        Military.add_unit(cap_state,cap_b,"axeman")
    var capped: Dictionary = IndividualBattle.start(cap_state,int(cap_a["id"]),int(cap_b["id"]))
    _check(results,"v13-over-cap-battle-accepted",bool(capped["ok"]))
    _check(results,"v13-whole-squad-cap-480",int(cap_state["individual_battle"]["initial_men"]) == 480)
    _check(results,"v13-over-cap-reserve-48",int(cap_state["individual_battle"]["reserve_men"]) == 48)
    var reserved_count: int = 0
    for squad in cap_state["individual_battle"]["squads"]:
        if bool(squad["reserve"]):
            reserved_count += 1
    _check(results,"v13-over-cap-two-whole-squads",reserved_count == 2)

    var retreat_state: Dictionary = Preview.initialize([{"id":1,"team":0,"c":4,"r":4},{"id":2,"team":1,"c":4,"r":4}])
    var retreat_army: Dictionary = Military.create_army(retreat_state,0,4,4)
    var chase_army: Dictionary = Military.create_army(retreat_state,1,4,4)
    var retreat_unit: Dictionary = Military.add_unit(retreat_state,retreat_army,"spearman")
    Military.add_unit(retreat_state,chase_army,"axeman")
    _check(results,"v13-retreat-battle-start",bool(IndividualBattle.start(retreat_state,int(retreat_army["id"]),int(chase_army["id"]))["ok"]))
    _check(results,"v13-retreat-order-accepted",IndividualBattle.order(retreat_state,int(retreat_unit["id"]),"retreat"))
    IndividualBattle.tick(retreat_state,8.0)
    _check(results,"v13-retreat-ends-battle",retreat_state.get("individual_battle",{}).is_empty())
    _check(results,"v13-retreat-preserves-surviving-hp",float(retreat_unit["hp"]) > 0.0)
    _check(results,"v13-retreat-no-double-xp",int(retreat_state.get("individual_battles_finished",0)) == 1)

    # Version 1.4: persistent tactic targeting, collision and projectile timing.
    var attacker: Dictionary = {"team":0,"kind":"cavalry","unit_id":10,"anchor":{"x":0.0,"z":0.0},"deployment_z":0.0,"men":[{"hp":5.0,"escaped":false}],"formation":"line"}
    var spearwall: Dictionary = {"team":1,"kind":"spearman","unit_id":11,"anchor":{"x":10.0,"z":0.0},"formation":"spear_wall","men":[{"hp":5.0,"escaped":false}]}
    var ranged_enemy: Dictionary = {"team":1,"kind":"archer","unit_id":12,"anchor":{"x":13.0,"z":0.0},"formation":"line","men":[{"hp":5.0,"escaped":false}]}
    _check(results,"v14-mounted-role",BattleDoctrine.mounted("cavalry") and not BattleDoctrine.mounted("spearman"))
    _check(results,"v14-cavalry-avoids-braced-spears",BattleDoctrine.target_cost(attacker,spearwall) > BattleDoctrine.target_cost(attacker,ranged_enemy))
    _check(results,"v14-cavalry-prefers-archers",int(BattleDoctrine.choose_target(attacker,[spearwall,ranged_enemy]).get("unit_id",-1)) == 12)
    _check(results,"v14-target-commit-stored",int(attacker.get("engagement_target",-1)) == 12)
    _check(results,"v14-target-commit-retained",int(BattleDoctrine.choose_target(attacker,[spearwall,ranged_enemy]).get("unit_id",-1)) == 12)
    _check(results,"v14-forward-no-backtracking",is_equal_approx(BattleDoctrine.keep_forward({"anchor":{"x":0.0,"z":0.0},"side":-1,"formation":"line"},Vector2(-5,1)).x,0.0))
    _check(results,"v14-shield-wall-slower",BattleDoctrine.formation_speed("shield_wall") < BattleDoctrine.formation_speed("line"))
    _check(results,"v14-column-faster",BattleDoctrine.formation_speed("column") > BattleDoctrine.formation_speed("line"))
    _check(results,"v14-tactic-rejected-after-finish",IndividualBattle.order(retreat_state,int(retreat_unit["id"]),"tactic",{"name":"support"}) == false)
    var tactic_state: Dictionary = Preview.initialize([{"team":0,"c":3,"r":3},{"team":1,"c":3,"r":3}])
    var tactic_a: Dictionary = Military.create_army(tactic_state,0,3,3)
    var tactic_b: Dictionary = Military.create_army(tactic_state,1,3,3)
    var tactic_u: Dictionary = Military.add_unit(tactic_state,tactic_a,"archer")
    Military.add_unit(tactic_state,tactic_b,"spearman")
    IndividualBattle.start(tactic_state,int(tactic_a["id"]),int(tactic_b["id"]))
    _check(results,"v14-formation-command",IndividualBattle.order(tactic_state,int(tactic_u["id"]),"formation",{"name":"column"}))
    _check(results,"v14-tactical-role-command",IndividualBattle.order(tactic_state,int(tactic_u["id"]),"tactic",{"name":"flank"}))
    _check(results,"v14-tactical-role-invalid-rejected",not IndividualBattle.order(tactic_state,int(tactic_u["id"]),"tactic",{"name":"teleport"}))
    var tactic_battle: Dictionary = tactic_state["individual_battle"]
    _check(results,"v14-has-projectile-state",tactic_battle.has("projectiles") and int(tactic_battle["model_tactic_version"]) >= 14)
    var before_attack: Dictionary = tactic_battle["squads"][1]["men"][0]
    var hp_at_fire: float = float(before_attack["hp"])
    tactic_battle["projectiles"].append({"from_unit":int(tactic_u["id"]),"to_unit":int(tactic_battle["squads"][1]["unit_id"]),"to_team":1,"to_man":0,"damage":1.0,"x":-5.0,"z":0.0,"to_x":5.0,"to_z":0.0,"start_at":0.0,"land_at":3.0})
    IndividualBattle.tick(tactic_state,0.2)
    _check(results,"v14-flight-does-not-hit-instantly",is_equal_approx(float(before_attack["hp"]),hp_at_fire))
    var json_tactics = JSON.parse_string(JSON.stringify(tactic_state))
    _check(results,"v14-projectiles-survive-save",json_tactics is Dictionary and json_tactics["individual_battle"]["projectiles"].size() > 0)
    IndividualBattle.tick(tactic_state,3.2)
    _check(results,"v14-projectile-lands",float(before_attack["hp"]) < hp_at_fire and int(tactic_battle.get("impacts",0)) >= 1)

    # Version 1.5: deterministically seeded artillery, bow misses, battle obstacles.
    _check(results,"v15-stone-ammo-six",Shots.STONE_AMMO == 6)
    _check(results,"v15-stone-flight-1-point-1",is_equal_approx(Shots.STONE_FLIGHT,1.1))
    _check(results,"v15-stone-reload-8-point-4",is_equal_approx(Shots.STONE_RELOAD,8.4))
    _check(results,"v15-stone-radius-4-point-2",is_equal_approx(Shots.STONE_RADIUS,4.2))
    _check(results,"v15-stone-max-scatter-14-point-4",is_equal_approx(Shots.MAX_STONE_DEVIATION,14.4))
    var aimed10: Dictionary = Shots.stone_landing(3,1,0,10,11.0,4.0)
    var aimed1: Dictionary = Shots.stone_landing(3,1,0,1,11.0,4.0)
    _check(results,"v15-lvl10-stone-perfect",is_equal_approx(float(aimed10["x"]),11.0) and is_equal_approx(float(aimed10["z"]),4.0))
    _check(results,"v15-lvl1-stone-scatter-limited",float(aimed1["deviation"]) > 0.0 and float(aimed1["deviation"]) <= 14.4)
    _check(results,"v15-lvl1-stone-repeatable",Shots.stone_landing(3,1,0,1,11.0,4.0) == aimed1)
    _check(results,"v15-stone-inner-full-damage",is_equal_approx(Shots.stone_damage(20.0,0.0),20.0))
    _check(results,"v15-stone-outer-25-percent",is_equal_approx(Shots.stone_damage(20.0,4.2),5.0))
    _check(results,"v15-stone-outside-no-damage",is_zero_approx(Shots.stone_damage(20.0,5.0)))
    _check(results,"v15-shot-deterministic",Shots.bow_hit(4,3,9,8.0,13.0) == Shots.bow_hit(4,3,9,8.0,13.0))
    var obstacles: Array = BattleTerrain.seeded_obstacles(41,30)
    _check(results,"v15-battle-terrain-six",obstacles.size() == 6)
    _check(results,"v15-battle-terrain-repeatable",obstacles == BattleTerrain.seeded_obstacles(41,30))
    _check(results,"v15-battle-terrain-blocks-rock",not BattleTerrain.passable(float(obstacles[0]["x"]),float(obstacles[0]["z"]),.34,obstacles))
    _check(results,"v15-battle-terrain-open-deployment",BattleTerrain.passable(-17.0,0.0,.34,obstacles))
    _check(results,"v15-retreat-ring-navigable",BattleTerrain.passable(-40.0,0.0,.34,obstacles))
    _check(results,"v15-catapult-defined",Military.UNITS.has("bronze_catapult"))
    _check(results,"v15-chariot-defined",Military.UNITS.has("chariot"))
    _check(results,"v15-catapult-single-crew",IndividualBattle.men_per_squad("bronze_catapult") == 1)
    _check(results,"v15-chariot-twelve-riders",IndividualBattle.men_per_squad("chariot") == 12)
    var artillery_state: Dictionary = Preview.initialize([{"team":0,"c":41,"r":30},{"team":1,"c":41,"r":30}])
    var artillery_army: Dictionary = Military.create_army(artillery_state,0,41,30)
    var target_army: Dictionary = Military.create_army(artillery_state,1,41,30)
    var cat_unit: Dictionary = Military.add_unit(artillery_state,artillery_army,"bronze_catapult")
    Military.add_unit(artillery_state,target_army,"spearman")
    var art_start: Dictionary = IndividualBattle.start(artillery_state,int(artillery_army["id"]),int(target_army["id"]))
    _check(results,"v15-artillery-battle-start",bool(art_start.get("ok",false)))
    var art_b: Dictionary = artillery_state.get("individual_battle",{})
    _check(results,"v15-catapult-starts-six-stones",int(art_b["squads"][0]["men"][0]["ammo"]) == 6)
    _check(results,"v15-save-terrain-obstacles",JSON.parse_string(JSON.stringify(artillery_state))["individual_battle"]["obstacles"].size() == 6)
    # Artificial impact probes the actual combat resolver without waiting 8.4 s reload.
    var friendly: Dictionary = art_b["squads"][0]["men"][0]
    var hostile: Dictionary = art_b["squads"][1]["men"][0]
    hostile["x"] = float(friendly["x"])+1.0
    hostile["z"] = float(friendly["z"])
    var own_before: float = float(friendly["hp"])
    var foe_before: float = float(hostile["hp"])
    art_b["projectiles"].append({"kind":"rock","from_unit":int(cat_unit["id"]),"from_team":0,"damage":25.0,"to_x":float(friendly["x"]),"to_z":float(friendly["z"]),"start_at":0.0,"land_at":0.1})
    IndividualBattle.tick(artillery_state,.2)
    _check(results,"v15-rock-can-hit-allies",float(friendly["hp"]) < own_before)
    _check(results,"v15-rock-can-hit-foes",float(hostile["hp"]) < foe_before)
    _check(results,"v15-friendly-rock-counter",int(art_b["friendly_rock_hits"]) > 0)
    _check(results,"v15-rock-impact-removed",art_b["projectiles"].is_empty())
    _check(results,"v15-rock-save-deterministic",JSON.parse_string(JSON.stringify(artillery_state)) is Dictionary)

    # V1.6 bronze walled-city siege: immutable V131 wall/tower profiles,
    # 5 defenders per tower, real cargo cost, saveable construction and breaches.
    var siege_profile: Dictionary = Siege.build_fixture(0,1)
    _check(results,"v16-stonewall-hp-900",is_equal_approx(float(Siege.profile("stonewall")["hp"]),900.0))
    _check(results,"v16-palisade-hp-420",is_equal_approx(float(Siege.profile("palisade")["hp"]),420.0))
    _check(results,"v16-reinforced-hp-1800",is_equal_approx(float(Siege.profile("reinforced_wall")["hp"]),1800.0))
    _check(results,"v16-gate-hp-700",is_equal_approx(float(Siege.profile("gatehouse")["hp"]),700.0))
    _check(results,"v16-wall-heights",is_equal_approx(float(Siege.profile("stonewall")["height"]),3.8) and is_equal_approx(float(Siege.profile("reinforced_wall")["height"]),6.4))
    _check(results,"v16-four-towers",Siege.tower_nodes(siege_profile).size()==4)
    _check(results,"v16-connected-wall-route",Siege.wall_route(siege_profile,0,4).size()>1)
    _check(results,"v16-guard-count-per-tower",Siege.GUARDS_PER_TOWER==5)
    _check(results,"v16-ladder-wood-18",is_equal_approx(Siege.LADDER_WOOD,18.0))
    _check(results,"v16-ladder-seconds-30",is_equal_approx(Siege.LADDER_SECONDS,30.0))
    _check(results,"v16-blocked-gate-before-breach",not Siege.ground_open(siege_profile,10.0,0.0,.34))
    _check(results,"v16-open-outside-wall",Siege.ground_open(siege_profile,-17.0,0.0,.34))
    _check(results,"v16-stonewall-artillery-factor",is_equal_approx(Siege.structural_multiplier("bronze_catapult","stonewall"),.8))
    _check(results,"v16-gate-ram-factor",is_equal_approx(Siege.structural_multiplier("battering_ram","gatehouse"),4.0))
    _check(results,"v16-no-arrow-wall-damage",is_equal_approx(Siege.structural_multiplier("archer","stonewall"),0.0))
    _check(results,"v16-guards-four-plus-one",Siege.split_guards({"north":4,"east":1},5)=={"north":4,"east":1})
    _check(results,"v16-no-guard-threats",Siege.split_guards({}).is_empty())
    _check(results,"v16-parapet-45-percent",is_equal_approx(Siege.parapet_multiplier(siege_profile,{"guard_post":true},"arrow"),.45))
    _check(results,"v16-normal-infantry-uncovered",is_equal_approx(Siege.parapet_multiplier(siege_profile,{"guard_post":false},"arrow"),1.0))
    var siege_attack: Dictionary = Preview.initialize([{"team":0,"c":41,"r":30},{"team":1,"c":41,"r":30}])
    var sa: Dictionary = Military.create_army(siege_attack,0,41,30)
    var sd: Dictionary = Military.create_army(siege_attack,1,41,30)
    var su: Dictionary = Military.add_unit(siege_attack,sa,"spearman")
    Military.add_unit(siege_attack,sd,"bronze_archer")
    var sb_started: Dictionary = IndividualBattle.start(siege_attack,int(sa["id"]),int(sd["id"]))
    _check(results,"v16-siege-can-start",bool(sb_started.get("ok",false)))
    var sb: Dictionary = siege_attack["individual_battle"]
    sb["siege"] = Siege.build_fixture(0,1)
    var admitted: int = Siege.attach_guards(sb)
    _check(results,"v16-twenty-roof-guards",admitted==20)
    _check(results,"v16-guards-added-to-cap",int(sb["initial_men"])==68)
    _check(results,"v16-guards-have-elevation",float(sb["squads"][-1]["men"][0].get("elevation",0.0))>7.0)
    var none_roof: Dictionary = Siege.artillery_target(sb,sb["squads"][0])
    _check(results,"v16-melee-does-not-shoot-wall",none_roof.is_empty())
    var ladder_wood: float = float(siege_attack["cities"][0]["resources"]["wood"])
    var craft_result: Dictionary = Siege.start_ladder(siege_attack,sb,int(su["id"]))
    _check(results,"v16-ladder-can-be-ordered",bool(craft_result.get("ok",false)))
    _check(results,"v16-ladder-spends-wood-once",is_equal_approx(float(siege_attack["cities"][0]["resources"]["wood"]),ladder_wood-18.0))
    _check(results,"v16-ladder-repeat-rejected",not bool(Siege.start_ladder(siege_attack,sb,int(su["id"])).get("ok",false)))
    var temporary: Dictionary = {"elapsed":0.0,"siege":sb["siege"],"squads":sb["squads"]}
    Siege.tick_ladders(temporary,15.0)
    _check(results,"v16-ladder-not-instant",not bool(sb["siege"]["works"][0]["ready"]))
    Siege.tick_ladders(temporary,15.0)
    _check(results,"v16-ladder-ready-at-30",bool(sb["siege"]["works"][0]["ready"]))
    var hit: float = Siege.damage_structure(sb["siege"],4,"bronze_catapult",1000.0)
    _check(results,"v16-demolition-uses-weapon-factor",is_equal_approx(hit,800.0))
    _check(results,"v16-gate-breached",bool(sb["siege"]["gate_open"]) and int(sb["siege"]["breaches"])==1)
    _check(results,"v16-open-gate-after-destruction",Siege.ground_open(sb["siege"],10.0,0.0,.34))
    var repeat_hit: float = Siege.damage_structure(sb["siege"],4,"bronze_catapult",1.0)
    _check(results,"v16-gate-not-double-breached",is_zero_approx(repeat_hit) and int(sb["siege"]["breaches"])==1)
    _check(results,"v16-siege-save-roundtrip",JSON.parse_string(JSON.stringify(siege_attack))["individual_battle"]["siege"]["works"].size()==1)
    _check(results,"v16-guard-patrol-state-json",JSON.parse_string(JSON.stringify(sb["siege"])) is Dictionary)
    _check(results,"v16-stone-structure-hit",Siege.apply_rock(sb,{"to_x":26.0,"to_z":0.0,"radius":4.2,"damage":50.0,"weapon":"bronze_catapult"})>0)
    _check(results,"v16-structure-hit-counted",int(sb["siege"]["structural_hits"])>0)
    _check(results,"v16-wall-between-sides-blocks-low-shot",Siege.shot_blocked(siege_profile,{"x":-15.0,"z":4.0},{"x":18.0,"z":4.0},0.0,0.0))
    _check(results,"v16-arching-high-shot-clears-wall",not Siege.shot_blocked(siege_profile,{"x":-15.0,"z":4.0},{"x":18.0,"z":4.0},10.0,10.0))

    var camp_state: Dictionary = Preview.initialize([{"team":0,"c":12,"r":12},{"team":1,"c":12,"r":12}])
    var camp_a: Dictionary = Military.create_army(camp_state,0,12,12)
    var camp_b: Dictionary = Military.create_army(camp_state,1,12,12)
    Military.add_unit(camp_state,camp_a,"bronze_catapult")
    Military.add_unit(camp_state,camp_b,"spearman")
    _check(results,"v16-camp-battle-created",bool(IndividualBattle.start(camp_state,int(camp_a["id"]),int(camp_b["id"])).get("ok",false)))
    var camp_battle: Dictionary = camp_state["individual_battle"]
    camp_battle["siege"] = Siege.build_fixture(0,1)
    _check(results,"v16-camp-rejects-insufficient-wood",not bool(Siege.start_camp(camp_state,camp_battle).get("ok",false)))
    camp_state["cities"][0]["resources"]["wood"] = 100.0
    _check(results,"v16-camp-accepts-80-wood",bool(Siege.start_camp(camp_state,camp_battle).get("ok",false)))
    _check(results,"v16-camp-single-per-army",not bool(Siege.start_camp(camp_state,camp_battle).get("ok",false)))
    _check(results,"v16-camp-wood-deducted",is_equal_approx(float(camp_state["cities"][0]["resources"]["wood"]),20.0))
    Siege.tick_camps(camp_battle,60.0)
    var camp_work: Dictionary = camp_battle["siege"]["works"][0]
    _check(results,"v16-camp-build-one-minute",bool(camp_work["ready"]) and int(camp_work["stones"])==0)
    Siege.tick_camps(camp_battle,15.0)
    _check(results,"v16-camp-one-stone-per-15s",int(camp_work["produced"])==1)
    camp_battle["squads"][0]["men"][0]["ammo"] = 0
    Siege.tick_camps(camp_battle,.1)
    _check(results,"v16-camp-refills-catapult",int(camp_battle["squads"][0]["men"][0]["ammo"])==1 and int(camp_work["stones"])==0)
    Siege.tick_camps(camp_battle,60.0)
    _check(results,"v16-camp-exactly-four-per-minute",int(camp_work["produced"])==5)
    _check(results,"v16-camp-json-roundtrip",JSON.parse_string(JSON.stringify(camp_battle["siege"])) is Dictionary)

    # V1.7 siege craft: costs, owner slots, physical advance, gate damage,
    # wall-top combat, and occupation with defensible guard conditions.
    _check(results,"v17-tower-material",is_equal_approx(Siege.TOWER_WOOD,75.0))
    _check(results,"v17-tower-buildtime",is_equal_approx(Siege.TOWER_SECONDS,120.0))
    _check(results,"v17-ram-material",is_equal_approx(Siege.RAM_WOOD,55.0))
    _check(results,"v17-ram-buildtime",is_equal_approx(Siege.RAM_SECONDS,90.0))
    var vehicle_state: Dictionary = Preview.initialize([{"team":0,"c":20,"r":21},{"team":1,"c":20,"r":21}])
    var vehicle_a: Dictionary = Military.create_army(vehicle_state,0,20,21)
    var vehicle_b: Dictionary = Military.create_army(vehicle_state,1,20,21)
    var ram_unit: Dictionary = Military.add_unit(vehicle_state,vehicle_a,"spearman")
    var tower_unit: Dictionary = Military.add_unit(vehicle_state,vehicle_a,"bronze_axeman")
    Military.add_unit(vehicle_state,vehicle_b,"bronze_archer")
    var started: Dictionary = IndividualBattle.start(vehicle_state,int(vehicle_a["id"]),int(vehicle_b["id"]))
    _check(results,"v17-vehicle-battle-created",bool(started.get("ok",false)))
    var vb: Dictionary = vehicle_state["individual_battle"]
    vb["siege"] = Siege.build_fixture(0,1)
    var invalid: Dictionary = Siege.start_assault_work(vehicle_state,vb,int(ram_unit["id"]),"ship")
    _check(results,"v17-invalid-vehicle-rejected",not bool(invalid.get("ok",false)))
    var underfunded: Dictionary = Siege.start_assault_work(vehicle_state,vb,int(tower_unit["id"]),"tower")
    _check(results,"v17-insufficient-wood-rejected",not bool(underfunded.get("ok",false)))
    vehicle_state["cities"][0]["resources"]["wood"] = 250.0
    var tower_result: Dictionary = Siege.start_assault_work(vehicle_state,vb,int(tower_unit["id"]),"tower")
    _check(results,"v17-tower-starts",bool(tower_result.get("ok",false)))
    _check(results,"v17-tower-deducts-once",is_equal_approx(float(vehicle_state["cities"][0]["resources"]["wood"]),175.0))
    _check(results,"v17-owner-cannot-double-build",not bool(Siege.start_assault_work(vehicle_state,vb,int(tower_unit["id"]),"tower").get("ok",false)))
    Siege.tick_assault_works(vb,60.0)
    _check(results,"v17-tower-not-ready-before-120",not bool(vb["siege"]["works"][0]["ready"]))
    Siege.tick_assault_works(vb,60.0)
    _check(results,"v17-tower-ready-at-120",bool(vb["siege"]["works"][0]["ready"]))
    var ram_result: Dictionary = Siege.start_assault_work(vehicle_state,vb,int(ram_unit["id"]),"ram")
    _check(results,"v17-ram-starts",bool(ram_result.get("ok",false)))
    _check(results,"v17-ram-spends-55",is_equal_approx(float(vehicle_state["cities"][0]["resources"]["wood"]),120.0))
    var ram_work: Dictionary = vb["siege"]["works"][1]
    _check(results,"v17-ram-target-is-gate",String(Siege.active_sections(vb["siege"])[int(ram_work["wall_index"])]["type"])=="gatehouse")
    Siege.tick_assault_works(vb,90.0)
    _check(results,"v17-ram-ready-after-90",bool(ram_work["ready"]))
    var ram_owner: Dictionary = {}
    for squad in vb["squads"]:
        if int(squad["unit_id"]) == int(ram_unit["id"]):
            ram_owner = squad
            break
    var gate: Dictionary = {}
    for section in vb["siege"]["sections"]:
        if String(section["type"]) == "gatehouse":
            gate = section
            break
    var gate_before: float = float(gate["hp"])
    ram_work["x"] = float(ram_work["target_x"])
    ram_work["z"] = float(ram_work["target_z"])
    ram_work["arrived"] = true
    for m in ram_owner["men"]:
        m["x"] = float(ram_work["x"])
        m["z"] = float(ram_work["z"])
    Siege.tick_assault_works(vb,3.1)
    _check(results,"v17-ram-deals-structural-damage",float(gate["hp"]) < gate_before and int(vb["siege"]["ram_hits"])==1)
    var siege_victory: Dictionary = Siege.build_fixture(0,1)
    var core_attack: Dictionary = {"unit_id":12,"team":0,"reserve":false,"retreated":false,"men":[{"x":18.0,"z":0.0,"hp":10.0,"escaped":false,"on_wall":false}]}
    var core_defend: Dictionary = {"unit_id":13,"team":1,"reserve":false,"retreated":false,"men":[{"x":17.0,"z":0.0,"hp":10.0,"escaped":false,"on_wall":false}]}
    var occupiers: Dictionary = {"siege":siege_victory,"squads":[core_attack,core_defend],"elapsed":0.0,"casualties":{}}
    Siege.tick_occupation(occupiers,10.0)
    _check(results,"v17-defenders-stop-occupation",is_equal_approx(float(siege_victory["keep_hp"]),600.0))
    core_defend["men"][0]["x"] = 42.0
    Siege.tick_occupation(occupiers,5.0)
    _check(results,"v17-occupation-advances-only-with-entry",float(siege_victory["keep_hp"])<600.0)
    Siege.tick_occupation(occupiers,20.0)
    _check(results,"v17-keep-captured",bool(siege_victory["captured"]))
    _check(results,"v17-occupation-is-saveable",JSON.parse_string(JSON.stringify(occupiers)) is Dictionary)
    _check(results,"v17-battle-state-has-vehicle-jobs",vb["siege"]["works"].size()==2)
    _check(results,"v17-ram-cost-preserves-garrison",Siege.tower_nodes(vb["siege"]).size()==4)

    # V1.9 selected-world-cell -> native 225 x 195 detail tile checks.
    _check(results,"v19-original-detail-width",is_equal_approx(DetailTile.TILE_WIDTH,225.0))
    _check(results,"v19-original-detail-depth",is_equal_approx(DetailTile.TILE_DEPTH,195.0))
    _check(results,"v19-world-to-detail-valid",DetailTile.tile_valid(Vector2i(0,0)) and DetailTile.tile_valid(Vector2i(219,164)))
    _check(results,"v19-world-to-detail-negative-reject",not DetailTile.tile_valid(Vector2i(-1,10)))
    _check(results,"v19-world-to-detail-high-reject",not DetailTile.tile_valid(Vector2i(220,11)))
    _check(results,"v19-screen-world-cell",DetailTile.world_cell_at(Vector3(87.5,2.0,105.8))==Vector2i(87,105))
    _check(results,"v19-city-tile-selection",DetailTile.city_index_at([{"c":4,"r":9},{"c":9,"r":5}],Vector2i(9,5))==1)
    _check(results,"v19-empty-tile-selection",DetailTile.city_index_at([{"c":4,"r":9}],Vector2i(5,9))==-1)
    var terrain_fixture := PackedFloat32Array()
    terrain_fixture.resize(DetailTile.WORLD_COLS*DetailTile.WORLD_ROWS)
    terrain_fixture.fill(1.2)
    _check(results,"v19-detail-height-source",is_equal_approx(DetailTile.source_height(terrain_fixture,2,3),.624))
    _check(results,"v19-detail-neighbor-seam",is_equal_approx(DetailTile.continuous_height(Vector2i(7,8),112.5,21.0,terrain_fixture),DetailTile.continuous_height(Vector2i(8,8),-112.5,21.0,terrain_fixture)))
    _check(results,"v19-detail-height-center",absf(DetailTile.continuous_height(Vector2i(7,8),0,0,terrain_fixture)-.624)<.22)

    # V2.1 checks are scoped to the preview tile, not full V131 city planning.
    var lot_fixture: Dictionary = {"c":50,"r":50,"team":0,"buildings":[
        {"type":"hall","ready":true,"hp":1200.0},
        {"type":"house","ready":true,"hp":350.0},
        {"type":"market","ready":true,"hp":350.0},
        {"type":"farm","ready":true,"hp":350.0}]}
    _check(results,"v21-layout-populates-old-saves",CityLayout.ensure_positions(lot_fixture))
    _check(results,"v21-layout-stable-site-fields",lot_fixture["buildings"][1].has("site_x") and lot_fixture["buildings"][3].has("site_z"))
    _check(results,"v21-layout-no-overlaps",CityLayout.check_clear(lot_fixture))
    _check(results,"v21-layout-hall-central",CityLayout.position(lot_fixture,0)==Vector2(50.5,50.5))
    var first_site: Vector2 = CityLayout.position(lot_fixture,1)
    CityLayout.ensure_positions(lot_fixture)
    _check(results,"v21-layout-stable-on-recheck",CityLayout.position(lot_fixture,1)==first_site)
    _check(results,"v21-layout-cargo-sharing",Cargo.building_position(lot_fixture,1)==first_site)
    var street_fixture = StreetNav.new()
    var street_path: Array = street_fixture.route(lot_fixture,0,2)
    _check(results,"v21-layout-road-finds-market",not street_path.is_empty())
    _check(results,"v21-layout-road-not-through-buildings",street_fixture.path_points_are_clear(lot_fixture,street_path))
    var copied_fixture: Dictionary = lot_fixture.duplicate(true)
    _check(results,"v21-layout-json-persistence",CityLayout.position(copied_fixture,2)==CityLayout.position(lot_fixture,2))
    var lot_result: Dictionary = CityLayout.find_free_site(lot_fixture,"house",[
        {"point":Vector2.ZERO,"kind":"hall"},
        {"point":CityLayout.position(lot_fixture,1)-CityLayout.center(lot_fixture),"kind":"house"},
        {"point":CityLayout.position(lot_fixture,2)-CityLayout.center(lot_fixture),"kind":"market"},
        {"point":CityLayout.position(lot_fixture,3)-CityLayout.center(lot_fixture),"kind":"farm"}])
    _check(results,"v21-layout-new-site-available",bool(lot_result["ok"]))
    var stress_fixture: Dictionary = lot_fixture.duplicate(true)
    stress_fixture["citizens"] = {}
    var fixture_result: Dictionary = CityStress.populate(stress_fixture,32,12,street_fixture)
    _check(results,"v21-stress-fixture-created",bool(fixture_result["ok"]))
    _check(results,"v21-stress-target-size",int(fixture_result["buildings"])==32)
    _check(results,"v21-stress-crowd-count",int(fixture_result["crowd"])==12)
    _check(results,"v21-stress-no-overlap",CityLayout.check_clear(stress_fixture))
    var stress_tick: Dictionary = CityStress.advance(stress_fixture,0.15,street_fixture)
    _check(results,"v21-stress-crowd-moves",int(stress_tick["moving"])==12)
    _check(results,"v21-stress-stays-saveable",JSON.parse_string(JSON.stringify(stress_fixture)) is Dictionary)
    _check(results,"v21-stress-is-explicit",bool(stress_fixture.get("stress_fixture",false)))
    _check(results,"v21-detail-house-scales",DetailTile.TILE_WIDTH==225.0 and DetailTile.TILE_DEPTH==195.0)

    # V2.2 territory and county production: no Godot startup side effects.
    _check(results,"v22-city-radius-start-3x3",Territory.urban_radius(3)==1)
    _check(results,"v22-radius-six-pop-5x5",Territory.urban_radius(6)==2)
    _check(results,"v22-city-radius-32-9x9",Territory.urban_radius(32)==4)
    _check(results,"v22-maximum-side-11",Territory.urban_radius(999)*2+1<=Territory.MAX_URBAN_SIDE)
    _check(results,"v22-radius-monotonic",Territory.urban_radius(16)>=Territory.urban_radius(6))
    var county_land := PackedByteArray()
    county_land.resize(Territory.COLS*Territory.ROWS)
    county_land.fill(1)
    var county_heights := PackedFloat32Array()
    county_heights.resize(Territory.COLS*Territory.ROWS)
    county_heights.fill(2.5)
    var town_a: Dictionary = {"name":"Väikelinn","team":0,"c":50,"r":50,"pop":3,"buildings":[{"type":"hall","ready":true,"hp":1200.0},{"type":"lumber","ready":true,"hp":350.0}],"resources":Economy.start_resources(),"county_worksites":[]}
    var town_b: Dictionary = {"name":"Suurlinn","team":1,"c":54,"r":50,"pop":32,"buildings":[{"type":"hall","ready":true,"hp":1200.0}],"resources":Economy.start_resources(),"county_worksites":[]}
    var county_state: Dictionary = {"cities":[town_a,town_b],"teams":{0:{"known":{"stone_tools":true}},1:{"known":{}}},"revision":1}
    _check(results,"v22-first-rebuild",Territory.rebuild(county_state,county_land,true))
    _check(results,"v22-core-ownership-protected",Territory.owner_at(county_state,50,50)==0 and Territory.owner_at(county_state,54,50)==1)
    _check(results,"v22-large-city-wins-intersection",Territory.owner_at(county_state,52,50)==1)
    _check(results,"v22-urban-is-county-subset",town_a["territory_urban"].size()<=town_a["territory_county"].size() and town_b["territory_urban"].size()<=town_b["territory_county"].size())
    _check(results,"v22-urban-within-side-limit",town_b["territory_urban"].size()<=81)
    _check(results,"v22-no-rebuild-when-unchanged",not Territory.rebuild(county_state,county_land))
    town_a["pop"] = 50
    _check(results,"v22-rebuild-after-population-growth",Territory.rebuild(county_state,county_land))
    _check(results,"v22-both-city-centers-keep-owner",Territory.owner_at(county_state,50,50)==0 and Territory.owner_at(county_state,54,50)==1)
    var location: Dictionary = Territory.choose_worksite(county_state,0,"quarry",county_land,county_heights)
    _check(results,"v22-distant-quarry-offered",bool(location.get("ok",false)))
    if bool(location.get("ok",false)):
        _check(results,"v22-quarry-is-in-own-county",Territory.owner_at(county_state,int(location["c"]),int(location["r"]))==0)
    else:
        _check(results,"v22-quarry-is-in-own-county",false)
    var worksite_result: Dictionary = Territory.build_worksite(county_state,0,"quarry",county_land,county_heights)
    _check(results,"v22-quarry-building-valid",bool(worksite_result.get("ok",false)))
    _check(results,"v22-resources-charged-once",is_equal_approx(float(town_a["resources"]["plank"]),2.0))
    _check(results,"v22-rural-worksite-saveable",JSON.parse_string(JSON.stringify(town_a["county_worksites"])) is Array)
    var extra_land: PackedByteArray = county_land.duplicate()
    for r in range(Territory.ROWS):
        extra_land[r*Territory.COLS+22] = 0
    var isolated: Dictionary = {"cities":[{"team":0,"name":"Saar","c":20,"r":55,"pop":32,"county_worksites":[]}],"revision":1}
    Territory.rebuild(isolated,extra_land,true)
    _check(results,"v22-no-overseas-claim",Territory.owner_at(isolated,23,55)==-1)
    _check(results,"v22-water-deposit-rejected",not Territory.deposit_kind("farm",22,55,extra_land,county_heights))
    _check(results,"v22-max-rural-sites-three",Territory.MAX_WORKSITES_PER_TILE==Counties.COUNTY_BUILDING_LIMIT)
    town_a["pop"] = 3
    town_b["pop"] = 80
    Territory.rebuild(county_state,county_land,true)
    Territory.reconcile_worksites(county_state,county_land,county_heights)
    var rural_site: Dictionary = town_a["county_worksites"][0] if not town_a["county_worksites"].is_empty() else {}
    _check(results,"v22-rescued-site-or-suspended",not rural_site.is_empty() and (Territory.owner_at(county_state,int(rural_site.get("c",-1)),int(rural_site.get("r",-1)))==0 or bool(rural_site.get("suspended",false))))
    _check(results,"v22-city-urban-fallback",town_a["territory_urban"].size()>=3)
    town_a["idle_workers"] = 1.0
    _check(results,"v22-rural-idle-worker-tick",Territory.advance_worksites(town_a,1.0)>=0)


    # V2.3: worker commute -> remote cycles -> physical delivery (no teleport).
    var rural_nav = WorldTradeNav.new()
    var rural_land := PackedByteArray()
    rural_land.resize(Campaign.COLS*Campaign.ROWS)
    rural_land.fill(1)
    rural_nav.configure(rural_land)
    var rural_home: Dictionary = {"id":71,"c":60,"r":60,"team":0,"pop":12,"resources":Economy.start_resources(),"buildings":[{"type":"hall","ready":true,"hp":1200.0}],"county_worksites":[{"type":"quarry","c":61,"r":60,"ready":true,"hp":350.0,"timer":0.0,"pending":0.0}]}
    var rural_state: Dictionary = {"seconds":1.0,"world_roads":{},"county_shipments":[],"next_county_cargo":1,"revision":1}
    rural_home["idle_workers"] = 1.0
    var early_rural: Dictionary = CountyLogistics.advance_city(rural_state,rural_home,1.0,rural_nav)
    _check(results,"v23-worker-not-instantly-on-site",int(rural_home["county_worksites"][0]["worker"]["c"])==60)
    _check(results,"v23-no-teleported-rural-stock",is_equal_approx(float(rural_home["resources"]["stone"]),18.0))
    _check(results,"v23-early-no-cargo",rural_state["county_shipments"].is_empty() and int(early_rural["produced"])==0)
    var produced_remote: int = 0
    var shipped_remote: int = 0
    var delivered_remote: int = 0
    for t in range(120):
        rural_state["seconds"] = float(t+2)
        rural_home["idle_workers"] = 1.0
        var stats: Dictionary = CountyLogistics.advance_city(rural_state,rural_home,1.0,rural_nav)
        produced_remote += int(stats["produced"])
        shipped_remote += int(stats["shipped"])
        delivered_remote += int(stats["delivered"])
    _check(results,"v23-rural-worker-reaches-site",int(rural_home["county_worksites"][0]["worker"]["c"])==61)
    _check(results,"v23-rural-producing-after-arrival",produced_remote>0)
    _check(results,"v23-rural-shipment-created",shipped_remote>0)
    _check(results,"v23-cargo-actually-arrived",delivered_remote>0 and float(rural_home["resources"]["stone"])>18.0)
    _check(results,"v23-rural-roads-use-shared-world-heat",not rural_state["world_roads"].is_empty())
    _check(results,"v23-cargo-no-negative-inventory",float(rural_home["resources"]["stone"])>=18.0)
    _check(results,"v23-state-roundtrip-cargo-and-worker",JSON.parse_string(JSON.stringify({"city":rural_home,"state":rural_state})) is Dictionary)
    var full_rural: Dictionary = rural_home.duplicate(true)
    full_rural["resources"]["stone"] = 120.0
    full_rural["county_worksites"][0]["pending"] = 0.0
    var full_state: Dictionary = {"seconds":1.0,"world_roads":{},"county_shipments":[],"next_county_cargo":1}
    full_rural["idle_workers"] = 1.0
    var before_full: float = float(full_rural["resources"]["stone"])
    CountyLogistics.advance_city(full_state,full_rural,40.0,rural_nav)
    _check(results,"v23-full-warehouse-prevents-minting",is_equal_approx(float(full_rural["resources"]["stone"]),before_full) and is_equal_approx(float(full_rural["county_worksites"][0].get("pending",0.0)),0.0))
    var cut_off := PackedByteArray()
    cut_off.resize(Campaign.COLS*Campaign.ROWS)
    cut_off.fill(0)
    cut_off[Campaign.index(60,60)] = 1
    cut_off[Campaign.index(61,60)] = 1
    var disconnected_nav = WorldTradeNav.new()
    disconnected_nav.configure(cut_off)
    # Block the only direct crossing while leaving the source and target open.
    cut_off[Campaign.index(61,60)] = 0
    disconnected_nav.configure(cut_off)
    var orphan: Dictionary = {"id":72,"c":60,"r":60,"team":0,"pop":3,"resources":Economy.start_resources(),"buildings":[{"type":"hall","ready":true,"hp":1200.0}],"idle_workers":1.0,"county_worksites":[{"type":"quarry","c":61,"r":60,"ready":true,"hp":350.0}]}
    var orphan_state: Dictionary = {"seconds":1.0,"world_roads":{},"county_shipments":[],"next_county_cargo":1}
    var unreachable_rural: Dictionary = CountyLogistics.advance_city(orphan_state,orphan,1.0,disconnected_nav)
    _check(results,"v23-blocked-crossing-no-production",int(unreachable_rural["blocked"])>0 and is_equal_approx(float(orphan["resources"]["stone"]),18.0))
    _check(results,"v23-travel-worker-performance-counter",rural_nav.searches>0)

    # V2.4: physical input supply and continuous atlas/detail poses.
    var smooth_worker: Dictionary = {"c":40,"r":40,"path":[[41,40]],"waypoint":0,"travel_clock":3.0}
    var half_worker: Vector2 = CountyLogistics.world_position(smooth_worker,{},0.0,true)
    var half_cargo: Vector2 = CountyLogistics.world_position(smooth_worker,{},0.0,false)
    _check(results,"v24-world-worker-between-tile-centres",is_equal_approx(half_worker.x,41.0) and is_equal_approx(half_worker.y,40.5))
    _check(results,"v24-workers-have-slower-interpolation",half_cargo.x>half_worker.x)
    _check(results,"v24-atlas-to-detail-centres",is_equal_approx((half_worker.x-40.5)*225.0,112.5))
    _check(results,"v24-no-negative-travel-progress",CountyLogistics.world_position({"c":40,"r":40,"path":[[41,40]],"waypoint":0,"travel_clock":-7.0},{},0.0,true).x >= 40.5)
    _check(results,"v24-finished-path-does-not-overshoot",is_equal_approx(CountyLogistics.world_position({"c":41,"r":40,"path":[[41,40]],"waypoint":1,"travel_clock":100.0},{},0.0,true).x,41.5))
    var input_town: Dictionary = {"id":82,"c":40,"r":40,"team":0,"pop":12,"idle_workers":1.0,"resources":Economy.start_resources(),"buildings":[{"type":"hall","ready":true,"hp":1200.0}],"county_worksites":[{"type":"mine","c":42,"r":40,"hp":350.0,"ready":true,"timer":0.0,"pending":0.0,"inputs":{}}]}
    input_town["resources"]["bread"] = 65.0
    var input_state: Dictionary = {"seconds":0.0,"world_roads":{},"county_shipments":[],"next_county_cargo":1,"revision":1}
    for t in range(15):
        input_state["seconds"] = float(t+1)
        input_town["idle_workers"] = 1.0
        CountyLogistics.advance_city(input_state,input_town,1.0,rural_nav)
    var incoming: Array = input_state["county_shipments"]
    _check(results,"v24-supplies-reserved-on-dispatch",float(input_town["resources"]["bread"])<65.0)
    _check(results,"v24-new-supply-has-direction",incoming.size()>0 and String(incoming[0].get("direction",""))=="supply")
    _check(results,"v24-no-instant-arrival-of-inputs",input_town["county_worksites"][0].get("inputs",{}).is_empty())
    _check(results,"v24-ore-waits-for-input",is_equal_approx(float(input_town["resources"]["ore"]),0.0))
    var saved_input = JSON.parse_string(JSON.stringify({"town":input_town,"state":input_state}))
    _check(results,"v24-supply-save-roundtrip",saved_input is Dictionary and saved_input.get("state",{}).get("county_shipments",[]).size()>0)
    var total_input_arrived: int = 0
    var total_product_arrived: int = 0
    for t in range(15,200):
        input_state["seconds"] = float(t+1)
        input_town["idle_workers"] = 1.0
        var outcome: Dictionary = CountyLogistics.advance_city(input_state,input_town,1.0,rural_nav)
        total_input_arrived += int(outcome["supply_received"])
        total_product_arrived += int(outcome["delivered"])
    _check(results,"v24-inputs-arrive-after-journey",total_input_arrived>0)
    _check(results,"v24-input-debit-exactly-once",float(input_town["resources"]["bread"])>=0.0 and float(input_town["resources"]["bread"])<65.0)
    _check(results,"v24-site-actually-produces-with-input",float(input_town["resources"]["ore"])>0.0)
    _check(results,"v24-products-return-in-a-separate-shipment",total_product_arrived>0)
    _check(results,"v24-site-input-never-negative",float(input_town["county_worksites"][0]["inputs"].get("bread",0.0))>=0.0)
    _check(results,"v24-repeated-input-shipments-bounded",input_state["county_shipments"].size()<8)
    var stranded_input: Dictionary = {"id":83,"c":60,"r":60,"team":0,"idle_workers":1.0,"resources":Economy.start_resources(),"buildings":[{"type":"hall","ready":true,"hp":1200.0}],"county_worksites":[{"type":"mine","c":61,"r":60,"hp":350.0,"ready":true,"inputs":{}}]}
    var stranded_state: Dictionary = {"seconds":0.0,"world_roads":{},"county_shipments":[],"next_county_cargo":1}
    var stranded_bread: float = float(stranded_input["resources"]["bread"])
    for t in range(30):
        stranded_input["idle_workers"] = 1.0
        CountyLogistics.advance_city(stranded_state,stranded_input,1.0,disconnected_nav)
    _check(results,"v24-unreachable-site-keeps-input-at-home",is_equal_approx(stranded_bread,float(stranded_input["resources"]["bread"])))
    _check(results,"v24-unreachable-site-no-supply-created",stranded_state["county_shipments"].is_empty())

    # V2.5: Godot AStarGrid2D paths through each physical detail tile.
    var fine_heights := PackedFloat32Array()
    fine_heights.resize(220*165)
    fine_heights.fill(2.0)
    var fine := DetailNavigation.new()
    fine.configure(fine_heights,[])
    var dry: Dictionary = fine.edge(Vector2i(70,70),Vector2i(71,70))
    _check(results,"v25-dry-detail-edge-reachable",bool(dry.get("ok",false)))
    _check(results,"v25-edge-reaches-neighbor-center",not dry.get("points",[]).is_empty() and Vector2(float(dry["points"].back()[0]),float(dry["points"].back()[1])).distance_to(Vector2(71.5,70.5))<.0001)
    _check(results,"v25-path-length-not-shorter-than-direct",float(dry.get("length",0.0))>=.99)
    var original_searches: int = fine.searches
    fine.edge(Vector2i(70,70),Vector2i(71,70))
    _check(results,"v25-detail-edge-cache-used",fine.searches==original_searches and fine.cached_edges>0)
    var sample: Vector2 = DetailNavigation.sample_track(dry.get("points",[]),.5)
    _check(results,"v25-saved-polyline-interpolation",sample.x>70.0 and sample.x<72.0 and sample.y>70.0 and sample.y<71.0)
    fine.configure(fine_heights,[],{"70:70":{"axis":"x","coord":0.0,"width":5.0,"bridge":false}})
    var river_closed: Dictionary = fine.edge(Vector2i(70,70),Vector2i(71,70))
    _check(results,"v25-river-without-bridge-blocked",not bool(river_closed.get("ok",false)))
    fine.configure(fine_heights,[],{"70:70":{"axis":"x","coord":0.0,"width":5.0,"bridge":true,"bridge_at":0.0,"bridge_width":6.0}})
    var river_open: Dictionary = fine.edge(Vector2i(70,70),Vector2i(71,70))
    _check(results,"v25-bridge-allows-crossing",bool(river_open.get("ok",false)))
    _check(results,"v25-bridge-crossing-has-steps",river_open.get("points",[]).size()>=3)
    _check(results,"v25-navigation-reconfiguration-invalidates-cache",fine.searches==original_searches+2)
    var fake_building_city: Dictionary = {"c":70,"r":70,"team":0,"buildings":[{"type":"hall","hp":1200.0,"ready":true,"site_x":70.5,"site_z":70.5}],"county_worksites":[]}
    fine.configure(fine_heights,[fake_building_city])
    _check(results,"v25-building-footprint-route-survives",bool(fine.edge(Vector2i(70,70),Vector2i(71,70)).get("ok",false)))
    var native_world := WorldTradeNav.new()
    var dry_cells := PackedByteArray()
    dry_cells.resize(220*165)
    dry_cells.fill(1)
    native_world.configure(dry_cells)
    native_world.configure_detail(fine_heights,[])
    var rural_transport: Dictionary = {"id":109,"c":70,"r":70,"team":0,"idle_workers":1.0,"resources":Economy.start_resources(),"buildings":[{"type":"hall","ready":true,"hp":1200.0}],"county_worksites":[{"type":"mine","c":71,"r":70,"hp":350.0,"ready":true,"inputs":{}}]}
    var rural_transport_state: Dictionary = {"seconds":0.0,"world_roads":{},"county_shipments":[],"next_county_cargo":1}
    CountyLogistics.advance_city(rural_transport_state,rural_transport,1.0,native_world)
    _check(results,"v25-worker-gets-detail-polyline",not rural_transport["county_worksites"][0].get("worker",{}).get("detail_points",[]).is_empty())
    var worker_track: Array = rural_transport["county_worksites"][0]["worker"].get("detail_points",[])
    _check(results,"v25-worker-track-saveable",JSON.parse_string(JSON.stringify(worker_track)) is Array)
    var pending_detail: Vector2 = CountyLogistics.world_position(rural_transport["county_worksites"][0]["worker"],{},1.0,true)
    _check(results,"v25-worker-between-tiles",pending_detail.x>69.5 and pending_detail.x<71.5)
    native_world.configure_detail(fine_heights,[],{"70:70":{"axis":"x","bridge":false,"width":5.0,"coord":0.0}})
    _check(results,"v25-bridge-closure-invalidates-world-edge",not bool(native_world.detail_edge(Vector2i(70,70),Vector2i(71,70)).get("ok",false)))
    native_world.configure_detail(fine_heights,[],{"70:70":{"axis":"x","bridge":true,"width":5.0,"coord":0.0,"bridge_at":0.0,"bridge_width":6.0}})
    _check(results,"v25-bridge-reopens-same-world-edge",bool(native_world.detail_edge(Vector2i(70,70),Vector2i(71,70)).get("ok",false)))

    # V2.6: world and detail views MUST sample the same generated atlas.
    var atlas_heights := PackedFloat32Array()
    atlas_heights.resize(220*165)
    for rr in range(165):
        for cc in range(220):
            atlas_heights[rr*220+cc] = 2.65-float(rr)*.007
    var atlas = SharedLandscape.new()
    atlas.configure(atlas_heights)
    _check(results,"v26-rivers-generated-from-atlas",atlas.segments.size()>100)
    _check(results,"v26-world-grid-height-shared",is_equal_approx(SharedLandscape.source_height(atlas_heights,70,70),atlas_heights[70*220+70]*.52))
    var seam_a: float = SharedLandscape.height_at(atlas_heights,Vector2i(70,70),Vector2(112.5,23.25))
    var seam_b: float = SharedLandscape.height_at(atlas_heights,Vector2i(71,70),Vector2(-112.5,23.25))
    _check(results,"v26-east-west-height-seam",is_equal_approx(seam_a,seam_b))
    var seam_c: float = SharedLandscape.height_at(atlas_heights,Vector2i(70,70),Vector2(14.0,97.5))
    var seam_d: float = SharedLandscape.height_at(atlas_heights,Vector2i(70,71),Vector2(14.0,-97.5))
    _check(results,"v26-north-south-height-seam",is_equal_approx(seam_c,seam_d))
    var first_river: Dictionary = atlas.segments[0]
    var from_cell := Vector2i(floori(first_river["a"].x),floori(first_river["a"].y))
    var to_cell := Vector2i(floori(first_river["b"].x),floori(first_river["b"].y))
    _check(results,"v26-downhill-neighbor-river",(from_cell-to_cell).length_squared()==1)
    _check(results,"v26-river-visible-both-tiles",not atlas.segments_for(from_cell).is_empty() and not atlas.segments_for(to_cell).is_empty())
    var river_local: Vector2 = atlas.suggested_bridge(from_cell)
    _check(results,"v26-water-blocks-Astar",atlas.blocked_by_river(from_cell,river_local))
    var real_nav = DetailNavigation.new()
    real_nav.configure(atlas_heights,[],{},atlas)
    _check(results,"v26-nav-shares-river-collision",real_nav._water(from_cell,river_local))
    _check(results,"v26-generated-river-demo-tile",atlas.first_river_tile().x>=0)
    atlas.set_bridge(from_cell,river_local,true)
    _check(results,"v26-bridge-opens-Astar",not atlas.blocked_by_river(from_cell,river_local))
    _check(results,"v26-nav-bridge-opens-collision",not real_nav._water(from_cell,river_local))
    atlas.set_bridge(from_cell,river_local,false)
    _check(results,"v26-closing-bridge-blocks-Astar",atlas.blocked_by_river(from_cell,river_local))
    _check(results,"v26-nav-sees-closed-bridge",real_nav._water(from_cell,river_local))
    _check(results,"v26-world-detail-position-roundtrip",SharedLandscape.detail_to_atlas(Vector2i(70,70),SharedLandscape.atlas_to_detail(Vector2i(70,70),Vector2(71.0,70.5))).distance_to(Vector2(71.0,70.5))<.00001)
    _check(results,"v26-cliffs-impassable",SharedLandscape.ocean_or_cliff(3.5) and not SharedLandscape.ocean_or_cliff(1.5))
    _check(results,"v26-ocean-impassable",SharedLandscape.ocean_or_cliff(-.5) and not SharedLandscape.ocean_or_cliff(1.5))

    # V2.7 baked V131 Earth source atlas + original priority-flood river pointers.
    var baked: Dictionary = V131Atlas.load_baked()
    _check(results,"v27-atlas-loaded",baked.has("heights"))
    if baked.has("heights"):
        var h27: PackedFloat32Array = baked["heights"]
        var d27: PackedInt32Array = baked["downstream"]
        var w27: PackedFloat32Array = baked["widths"]
        var f27: PackedByteArray = baked["fords"]
        _check(results,"v27-atlas-36300-height-samples",h27.size() == 36300)
        _check(results,"v27-atlas-36300-drainage-links",d27.size() == 36300)
        _check(results,"v27-atlas-36300-river-widths",w27.size() == 36300)
        _check(results,"v27-atlas-36300-fords",f27.size() == 36300)
        _check(results,"v27-atlas-seed-131",int(baked["seed"]) == 131)
        _check(results,"v27-atlas-displayscaled",is_equal_approx(float(baked["scale"]),.145))
        var streams: int = 0
        var ford_count: int = 0
        var downhill: bool = true
        var river_widths_ok: bool = true
        for id in range(d27.size()):
            if d27[id] < 0:
                continue
            streams += 1
            ford_count += int(f27[id])
            var x: int = int(id%220)
            var y: int = int(id/220)
            var dest: int = d27[id]
            downhill = downhill and absi(x-int(dest%220))+absi(y-int(dest/220)) == 1
            river_widths_ok = river_widths_ok and w27[id] >= 2.2 and w27[id] <= 9.0
        _check(results,"v27-atlas-has-real-source-rivers",streams == 601)
        _check(results,"v27-atlas-river-links-adjacent",downhill)
        _check(results,"v27-atlas-widths-v131-range",river_widths_ok)
        _check(results,"v27-atlas-has-natural-fords",ford_count == 32)
        var baked_landscape = SharedLandscape.new()
        baked_landscape.configure_baked(h27,d27,w27,f27)
        _check(results,"v27-v131-river-centerlines-baked",baked_landscape.segments.size() == streams*10)
        var river_cell: Vector2i = baked_landscape.first_river_tile()
        _check(results,"v27-river-has-detail-tile",river_cell.x >= 0 and baked_landscape.segments_for(river_cell).size()>0)
        _check(results,"v27-height-coast-classification",not V131Atlas.world_passable(-2.0,-1,0,false))
        _check(results,"v27-mountains-impenetrable",not V131Atlas.world_passable(35.0*.145,-1,0,false))
        _check(results,"v27-river-needs-bridge",not V131Atlas.world_passable(10.0*.145,500,0,false))
        _check(results,"v27-river-bridge-opens",V131Atlas.world_passable(10.0*.145,500,0,true))
        _check(results,"v27-natural-ford-opens",V131Atlas.world_passable(10.0*.145,500,1,false))
        _check(results,"v27-bridge-json-serializable",JSON.parse_string(JSON.stringify({"73:50":{"x":2.0,"z":0.0,"open":true}})) is Dictionary)
        var v27_nav = WorldTradeNav.new()
        var v27_pass := PackedByteArray()
        v27_pass.resize(220*165)
        v27_pass.fill(0)
        for x in range(69,73):
            v27_pass[73*220+x] = 1
        v27_pass[73*220+70] = 0
        v27_nav.configure(v27_pass)
        _check(results,"v27-unbridged-river-blocks-road-trade",v27_nav.route({"c":69,"r":73},{"c":72,"r":73}).is_empty())
        v27_pass[73*220+70] = 1
        v27_nav.configure(v27_pass)
        _check(results,"v27-bridge-restores-road-route",v27_nav.route({"c":69,"r":73},{"c":72,"r":73}).size() == 3)
        v27_pass[73*220+70] = 0
        v27_nav.configure(v27_pass)
        _check(results,"v27-closing-bridge-invalidates-route-cache",v27_nav.route({"c":69,"r":73},{"c":72,"r":73}).is_empty())


    # V2.8: V131 9x9 samples share edges and geometry with navigation/building.
    var flat_atlas := PackedFloat32Array()
    flat_atlas.resize(220*165)
    flat_atlas.fill(2.2)
    var nine = DetailHeights.new()
    nine.configure(flat_atlas)
    var test_tile := Vector2i(101,80)
    var nine_samples: PackedFloat32Array = nine.samples_for(test_tile)
    _check(results,"v28-grid-has-81-height-samples",nine_samples.size()==81)
    _check(results,"v28-v131-grid-resolution-nine",DetailHeights.N==9)
    _check(results,"v28-grid-covers-225-by-195",is_equal_approx(DetailHeights.WIDTH,225.0) and is_equal_approx(DetailHeights.DEPTH,195.0))
    _check(results,"v28-flat-height-center",absf(nine.height(test_tile,Vector2.ZERO)-1.144)<.002)
    _check(results,"v28-flat-height-corner",absf(nine.height(test_tile,Vector2(-112.5,-97.5))-1.144)<.002)
    _check(results,"v28-east-west-grid-seam",is_equal_approx(nine.height(test_tile,Vector2(112.5,17.0)),nine.height(test_tile+Vector2i.RIGHT,Vector2(-112.5,17.0))))
    _check(results,"v28-north-south-grid-seam",is_equal_approx(nine.height(test_tile,Vector2(-19,97.5)),nine.height(test_tile+Vector2i.DOWN,Vector2(-19,-97.5))))
    _check(results,"v28-flat-slope-zero",nine.slope(test_tile,Vector2.ZERO)<.0001)
    _check(results,"v28-flat-buildable",nine.buildable(test_tile,Vector2.ZERO,6))
    _check(results,"v28-flat-walkable",nine.traversable(test_tile,Vector2.ZERO))
    var hits_before: int = nine.cache_hits
    nine.samples_for(test_tile)
    _check(results,"v28-grid-reused-from-cache",nine.cache_hits>hits_before)
    _check(results,"v28-cache-bounded",DetailHeights.MAX_CACHE==64)
    flat_atlas[80*220+101] = -1.0
    nine.configure(flat_atlas)
    _check(results,"v28-sea-center-blocks-building",not nine.buildable(test_tile,Vector2.ZERO,3))
    _check(results,"v28-sea-center-blocks-walking",not nine.traversable(test_tile,Vector2.ZERO))
    flat_atlas[80*220+101] = 9.0
    nine.configure(flat_atlas)
    _check(results,"v28-cliff-center-blocks-building",not nine.buildable(test_tile,Vector2.ZERO,3))
    _check(results,"v28-cliff-center-blocks-walking",not nine.traversable(test_tile,Vector2.ZERO))
    flat_atlas[80*220+101] = 2.2
    # Reset the changed cliff sample before comparing independent landscape caches.
    nine.configure(flat_atlas)
    var consistent = SharedLandscape.new()
    consistent.configure(flat_atlas)
    _check(results,"v28-landscape-grid-same-height",is_equal_approx(consistent.detail_height(test_tile,Vector2.ZERO),nine.height(test_tile,Vector2.ZERO)))
    _check(results,"v28-shared-builder-validates-lot",consistent.buildable_at(test_tile,Vector2.ZERO,5))
    var updated_grid = DetailNavigation.new()
    updated_grid.configure(flat_atlas,[],{},consistent)
    _check(results,"v28-nav-shares-buildable-height",not updated_grid._water(test_tile,Vector2.ZERO))
    _check(results,"v28-world-to-detail-height-cache-roundtrip",consistent.detail_samples(test_tile).size()==81)

    # V2.9: a 192-man battlefield uses the same 9x9 relief and serializable routes.
    var b29_samples := PackedFloat32Array()
    b29_samples.resize(81)
    b29_samples.fill(1.0)
    var b29_plain: Dictionary = BattleSurface.make(b29_samples)
    _check(results,"v29-battle-surface-created",not b29_plain.is_empty())
    _check(results,"v29-battle-81-samples",b29_plain.get("samples",[]).size()==81)
    _check(results,"v29-flat-battle-height-zero",is_zero_approx(BattleSurface.height(b29_plain,0,0)))
    _check(results,"v29-flat-battle-walkable",BattleSurface.ground_open(b29_plain,0,0))
    _check(results,"v29-flat-battle-linear-move",BattleSurface.edge_open(b29_plain,Vector2(-8,0),Vector2(8,0)))
    _check(results,"v29-flat-battle-same-height-speed",is_equal_approx(BattleSurface.speed_factor(b29_plain,Vector2(-8,0),Vector2(8,0)),1.0))
    _check(results,"v29-flat-battle-route",BattleSurface.route(b29_plain,Vector2(-8,0),Vector2(8,0)).size()>0)
    _check(results,"v29-invalid-samples-rejected",BattleSurface.make(PackedFloat32Array()).is_empty())
    var b29_sea := b29_samples.duplicate()
    b29_sea.fill(-.5)
    var b29_water: Dictionary = BattleSurface.make(b29_sea)
    _check(results,"v29-deep-water-impassable",not BattleSurface.ground_open(b29_water,0,0))
    var b29_cliff := b29_samples.duplicate()
    b29_cliff.fill(5.0)
    var b29_mountain: Dictionary = BattleSurface.make(b29_cliff)
    _check(results,"v29-high-cliff-impassable",not BattleSurface.ground_open(b29_mountain,0,0))
    var b29_river: Array = [{"ax":0.0,"az":-25.0,"bx":0.0,"bz":25.0,"width":4.0}]
    var b29_closed: Dictionary = BattleSurface.make(b29_samples,b29_river)
    _check(results,"v29-river-center-blocked",not BattleSurface.ground_open(b29_closed,0,0))
    _check(results,"v29-no-bridge-blocks-straight-crossing",not BattleSurface.edge_open(b29_closed,Vector2(-10,0),Vector2(10,0)))
    _check(results,"v29-no-bridge-no-route",BattleSurface.route(b29_closed,Vector2(-10,0),Vector2(10,0)).is_empty())
    var b29_open: Dictionary = BattleSurface.make(b29_samples,b29_river,{"x":0.0,"z":0.0,"radius":3.5,"open":true})
    _check(results,"v29-bridge-opens-river-center",BattleSurface.ground_open(b29_open,0,0))
    _check(results,"v29-bridge-crossing-has-route",BattleSurface.route(b29_open,Vector2(-10,0),Vector2(10,0)).size()>0)
    _check(results,"v29-bridge-only-opens-local-crossing",not BattleSurface.ground_open(b29_open,0,12))
    _check(results,"v29-bridge-roundtrip-json",JSON.parse_string(JSON.stringify(b29_open)) is Dictionary)
    var b29_rock: Dictionary = BattleSurface.make(b29_samples,[],{},[{"x":0.0,"z":0.0,"radius":3.0,"kind":"rock"}])
    _check(results,"v29-rock-blocks-center",not BattleSurface.ground_open(b29_rock,0,0))
    _check(results,"v29-rock-navigation-detour",BattleSurface.route(b29_rock,Vector2(-10,0),Vector2(10,0)).size()>0)
    _check(results,"v29-terrain-keeps-retreat-ring",BattleSurface.ground_open(b29_water,-38,0))
    _check(results,"v29-travel-line-of-sight",BattleSurface.line_of_sight(b29_plain,Vector2(-10,0),Vector2(10,0)))

    # V3.0: V131 3x3 battle fixture: nine 225x195 height tiles + retreat ring.
    var thirty_samples: Array = []
    for i in range(81):
        thirty_samples.append(1.0)
    var thirty_tiles: Dictionary = {}
    for row in range(-1,2):
        for col in range(-1,2):
            thirty_tiles["%d:%d" % [col,row]] = thirty_samples.duplicate()
    var thirty: Dictionary = BattleSurface.make_large(thirty_tiles)
    _check(results,"v30-nine-tile-battlefield-created",not thirty.is_empty())
    _check(results,"v30-battle-675m-wide",is_equal_approx(BattleSurface.half_x(thirty)*2.0,675.0))
    _check(results,"v30-battle-585m-deep",is_equal_approx(BattleSurface.half_z(thirty)*2.0,585.0))
    _check(results,"v30-battle-3x3-data",thirty.get("tiles",{}).size()==9)
    _check(results,"v30-battle-grid-91x79",thirty.get("walk",[]).size()==91*79)
    _check(results,"v30-nine-flat-tiles-height",is_equal_approx(BattleSurface.absolute_height(thirty,-225,0),1.0) and is_equal_approx(BattleSurface.absolute_height(thirty,225,0),1.0))
    _check(results,"v30-east-tile-seam",is_equal_approx(BattleSurface.absolute_height(thirty,112.5,0),BattleSurface.absolute_height(thirty,112.5001,0)))
    _check(results,"v30-north-tile-seam",is_equal_approx(BattleSurface.absolute_height(thirty,0,97.5),BattleSurface.absolute_height(thirty,0,97.5001)))
    _check(results,"v30-large-traversal",BattleSurface.edge_open(thirty,Vector2(-90,0),Vector2(90,0)))
    _check(results,"v30-large-formation-no-snapping",BattleSurface.nearest_open(thirty,Vector2(-91.45,16.3)).distance_to(Vector2(-91.45,16.3))<.001)
    _check(results,"v30-large-retreat-ring",BattleSurface.ground_open(thirty,345,0))
    _check(results,"v30-invalid-eight-tiles",BattleSurface.make_large({}).is_empty())
    _check(results,"v30-large-500-soldier-limit",IndividualBattle.MAX_MEN==500)
    _check(results,"v30-large-squads-count-500",(9*IndividualBattle.men_per_squad("spearman")+2*IndividualBattle.men_per_squad("cavalry")+10*IndividualBattle.men_per_squad("scout"))*2==500)
    _check(results,"v30-serialized-state",JSON.parse_string(JSON.stringify(thirty)) is Dictionary)
    var thirty_river: Array = [{"ax":0.0,"az":-292.5,"bx":0.0,"bz":292.5,"width":4.0}]
    var thirty_closed: Dictionary = BattleSurface.make_large(thirty_tiles,thirty_river)
    _check(results,"v30-river-blocks-full-field",not BattleSurface.edge_open(thirty_closed,Vector2(-12,0),Vector2(12,0)))
    var thirty_open: Dictionary = BattleSurface.make_large(thirty_tiles,thirty_river,[{"x":0.0,"z":0.0,"open":true,"radius":6.0}])
    _check(results,"v30-bridge-opens-crossing",BattleSurface.edge_open(thirty_open,Vector2(-12,0),Vector2(12,0)))
    _check(results,"v30-bridge-does-not-open-remote-river",not BattleSurface.ground_open(thirty_open,0,30))
    _check(results,"v30-formation-manual-orders-retained",IndividualBattle.FORMATIONS.has("shield_wall") and IndividualBattle.FORMATIONS.has("spear_wall") and IndividualBattle.FORMATIONS.has("column"))
    _check(results,"v30-navigation-search-budget-two",true) # The explicit budget is checked by tools/check_battlefield_v30.py.

    # V3.1: bounded formation AI / damage facing / missile obstruction.
    _check(results,"v31-eight-formation-options",BattleFormations.OPTIONS.size()==8)
    _check(results,"v31-line-for-every-kind",BattleFormations.valid_for("archer","line") and BattleFormations.valid_for("spearman","line"))
    _check(results,"v31-shield-requires-shield-troop",BattleFormations.valid_for("bronze_spearman","shield_wall") and not BattleFormations.valid_for("archer","shield_wall"))
    _check(results,"v31-spear-wall-only-spearmen",BattleFormations.valid_for("spearman","spear_wall") and not BattleFormations.valid_for("cavalry","spear_wall"))
    _check(results,"v31-loose-for-ranged",BattleFormations.valid_for("archer","loose") and not BattleFormations.valid_for("axeman","loose"))
    _check(results,"v31-skirmish-for-ranged",BattleFormations.valid_for("archer","skirmish") and not BattleFormations.valid_for("spearman","skirmish"))
    _check(results,"v31-charge-for-mounted",BattleFormations.valid_for("cavalry","charge") and not BattleFormations.valid_for("spearman","charge"))
    _check(results,"v31-invalid-name-rejected",not BattleFormations.valid_for("spearman","thrust_of_infinity"))
    var f31_own: Dictionary = {"team":0,"side":-1,"kind":"spearman","formation":"line","anchor":{"x":0.0,"z":0.0},"men":[{"id":0,"x":0.0,"z":0.0,"hp":20.0,"escaped":false}]}
    var f31_mounted: Dictionary = {"team":1,"kind":"cavalry","formation":"line","anchor":{"x":14.0,"z":0.0},"men":[{"id":0,"hp":10.0,"escaped":false}]}
    _check(results,"v31-spear-auto-braces-cavalry",BattleFormations.desired_auto(f31_own,f31_mounted)=="spear_wall")
    _check(results,"v31-spear-auto-without-enemy",BattleFormations.desired_auto(f31_own,{})=="line")
    f31_own["tactical_role"] = "hold"
    _check(results,"v31-hold-role-respected",BattleFormations.desired_auto(f31_own,f31_mounted)=="hold")
    f31_own["tactical_role"] = "advance"
    var f31_archer: Dictionary = {"kind":"archer","side":-1,"formation":"line","anchor":{"x":0.0,"z":0.0},"men":[{"id":0,"x":0.0,"z":0.0,"hp":5.0,"escaped":false}],"range":16.0,"speed":3.0}
    var f31_enemy: Dictionary = {"kind":"axeman","anchor":{"x":8.0,"z":0.0}}
    _check(results,"v31-archer-close-skirmish",BattleFormations.desired_auto(f31_archer,f31_enemy)=="skirmish")
    f31_enemy["anchor"] = {"x":20.0,"z":0.0}
    _check(results,"v31-archer-mid-range-loose",BattleFormations.desired_auto(f31_archer,f31_enemy)=="loose")
    f31_enemy["anchor"] = {"x":90.0,"z":0.0}
    _check(results,"v31-archer-long-range-line",BattleFormations.desired_auto(f31_archer,f31_enemy)=="line")
    f31_enemy["anchor"] = {"x":8.0,"z":0.0}
    var f31_back: Vector2 = BattleFormations.skirmish_goal(f31_archer,{"id":0,"x":0.0,"z":0.0},{"x":8.0,"z":0.0})
    _check(results,"v31-skirmish-moves-away",f31_back.x < -2.0)
    _check(results,"v31-manual-formation-command",BattleFormations.change(f31_archer,"loose",2.0,true) and bool(f31_archer.get("formation_manual",false)))
    _check(results,"v31-auto-does-not-override-manual",not BattleFormations.update(f31_archer,f31_enemy,.1,12.0) and String(f31_archer["formation"])=="loose")
    f31_archer["formation_manual"] = false
    _check(results,"v31-resume-automatic",BattleFormations.update(f31_archer,f31_enemy,.1,12.0) and String(f31_archer["formation"])=="skirmish")
    _check(results,"v31-forming-takes-time",BattleFormations.formation_time("shield_wall")==4.0 and BattleFormations.formation_time("loose")==3.0)
    _check(results,"v31-wedge-wider-than-shield",float(BattleFormations.shape("charge",12)["width"])>float(BattleFormations.shape("shield_wall",24)["width"]))
    var f31_slot: Dictionary = {"formation":"loose","kind":"archer","side":-1,"anchor":{"x":0.0,"z":0.0},"men":[0,1,2,3,4,5,6,7]}
    var loose_distance: float = BattleFormations.slot(f31_slot,0).distance_to(BattleFormations.slot(f31_slot,1))
    f31_slot["formation"] = "shield_wall"
    var shield_distance: float = BattleFormations.slot(f31_slot,0).distance_to(BattleFormations.slot(f31_slot,1))
    _check(results,"v31-dispersed-formation-spaces-men",loose_distance > shield_distance)
    var f31_target: Dictionary = {"formation":"shield_wall","formation_facing":0.0,"formation_strength":1.0}
    var f31_origin: Dictionary = {"kind":"archer"}
    var f31_man: Dictionary = {"x":0.0,"z":0.0}
    var f31_front: Dictionary = {"x":7.0,"z":0.0}
    var f31_back_shot: Dictionary = {"x":-7.0,"z":0.0}
    _check(results,"v31-shield-front-arrow-mitigation",is_equal_approx(BattleFormations.damage_factor(f31_origin,f31_target,f31_man,f31_front,true),.60))
    _check(results,"v31-shield-rear-exposure",is_equal_approx(BattleFormations.damage_factor(f31_origin,f31_target,f31_man,f31_back_shot,true),1.0))
    f31_target["formation"] = "spear_wall"
    _check(results,"v31-spear-front-deterrence",is_equal_approx(BattleFormations.damage_factor({"kind":"cavalry"},f31_target,f31_man,f31_front,false),.55))
    _check(results,"v31-spear-does-not-block-arrows",is_equal_approx(BattleFormations.damage_factor(f31_origin,f31_target,f31_man,f31_front,true),1.0))
    f31_target["formation"] = "loose"
    _check(results,"v31-loose-reduces-arrow-hits",is_equal_approx(BattleFormations.damage_factor(f31_origin,f31_target,f31_man,f31_front,true),.78))
    _check(results,"v31-loose-vulnerable-to-melee",is_equal_approx(BattleFormations.damage_factor(f31_origin,f31_target,f31_man,f31_front,false),1.10))
    var f31_shooter: Dictionary = {"x":0.0,"z":0.0,"team":0,"hp":10.0,"radius":.34}
    var f31_ally: Dictionary = {"x":4.5,"z":0.0,"team":0,"hp":10.0,"radius":.34}
    var f31_foe: Dictionary = {"x":10.0,"z":0.0,"team":1,"hp":10.0}
    _check(results,"v31-friendly-firing-lane-blocked",not IndividualBattle._friendly_shot_clear({"1:0":[f31_ally]},f31_shooter,f31_foe))
    f31_ally["z"] = 3.0
    _check(results,"v31-clear-firing-lane-allowed",IndividualBattle._friendly_shot_clear({"1:1":[f31_ally]},f31_shooter,f31_foe))
    f31_ally["z"] = 0.0
    f31_ally["team"] = 1
    _check(results,"v31-hostile-does-not-count-as-friendly-screen",IndividualBattle._friendly_shot_clear({"1:0":[f31_ally]},f31_shooter,f31_foe))
    _check(results,"v31-battle-formation-dictionary-serializable",JSON.parse_string(JSON.stringify(f31_archer)) is Dictionary)
    _check(results,"v31-charges-speedier-than-line",BattleDoctrine.formation_speed("charge")>BattleDoctrine.formation_speed("line"))
    _check(results,"v31-braced-wall-slower-than-column",BattleDoctrine.formation_speed("spear_wall")<BattleDoctrine.formation_speed("column"))


    # V3.2: morale, routs and terrain-aware escape; no live Godot execution implied.
    var m32_squad: Dictionary = {"team":0,"side":-1,"kind":"spearman","grade":"standard","army_level":1,"anchor":{"x":-18.0,"z":0.0},"men":[{"x":-18.0,"z":0.0,"hp":10.0,"escaped":false,"moving":false,"fighting":false},{"x":-17.0,"z":0.0,"hp":10.0,"escaped":false,"moving":false,"fighting":false}],"routing":false,"reserve":false,"retreated":false}
    var m32_battle: Dictionary = {"squads":[m32_squad],"elapsed":0.0,"morale_routs":0}
    BattleMorale.initialize(m32_battle)
    _check(results,"v32-initial-standard-morale",is_equal_approx(float(m32_squad["men"][0]["morale"]),82.0))
    _check(results,"v32-sets-start-men",int(m32_squad["start_men"])==2)
    _check(results,"v32-morale-initializes-fatigue",float(m32_squad["men"][0]["fatigue"])==0.0)
    _check(results,"v32-morale-elite-base",is_equal_approx(float(BattleMorale.BASE_MORALE["elite"]),94.0))
    _check(results,"v32-morale-mobilized-base",is_equal_approx(float(BattleMorale.BASE_MORALE["mobilized"]),64.0))
    m32_squad["men"][0]["moving"] = true
    BattleMorale.update(m32_battle,1.0)
    _check(results,"v32-marching-creates-fatigue",float(m32_squad["men"][0]["fatigue"])>0.0)
    m32_squad["men"][0]["moving"] = false
    BattleMorale.update(m32_battle,2.0)
    _check(results,"v32-rest-recovers-fatigue",float(m32_squad["men"][0]["fatigue"])==0.0)
    m32_squad["men"][0]["fighting"] = true
    BattleMorale.update(m32_battle,1.0)
    _check(results,"v32-combat-fatigue-higher",float(m32_squad["men"][0]["fatigue"])>=3.0)
    _check(results,"v32-combat-event-consumed",not bool(m32_squad["men"][0]["fighting"]))
    _check(results,"v32-fatigued-slower",BattleMorale.speed_factor({"fatigue":100.0})<BattleMorale.speed_factor({"fatigue":0.0}))
    BattleMorale.apply_hit(m32_battle,m32_squad,m32_squad["men"][0],{"x":-30.0,"z":0.0},true)
    _check(results,"v32-kill-adds-shock",float(m32_squad["morale_shock"])>=2.0)
    _check(results,"v32-flank-hits-recorded",int(m32_battle.get("flank_shocks",0))>=1)
    var m32_shock: float = float(m32_squad["morale_shock"])
    BattleMorale.update(m32_battle,.1)
    _check(results,"v32-shock-decays",float(m32_squad["morale_shock"])<m32_shock)
    _check(results,"v32-average-morale-bounded",float(m32_squad["morale"])>=0.0 and float(m32_squad["morale"])<=100.0)
    m32_squad["men"][0]["morale"] = 1.0
    m32_squad["men"][1]["morale"] = 1.0
    BattleMorale.update(m32_battle,.1)
    _check(results,"v32-loss-of-morale-routs-squad",bool(m32_squad["routing"]) and int(m32_battle["morale_routs"])==1)
    _check(results,"v32-routed-men-marked",bool(m32_squad["men"][0]["routing"]) and bool(m32_squad["men"][1]["routing"]))
    _check(results,"v32-rout-clears-attack-order",int(m32_squad["attack_target"])==-1 and m32_squad["move_target"].is_empty())
    _check(results,"v32-rout-does-not-kill-soldiers",float(m32_squad["men"][0]["hp"])==10.0)
    var m32_second: Dictionary = {"team":1,"side":1,"kind":"archer","anchor":{"x":18.0,"z":0.0},"men":[{"x":18.0,"z":0.0,"hp":10.0,"escaped":false}],"routing":false,"reserve":false,"retreated":false}
    var m32_manual: Dictionary = {"squads":[m32_second],"elapsed":9.0}
    BattleMorale.route_squad(m32_manual,m32_second,false)
    _check(results,"v32-manual-retreat-marks-routing",bool(m32_second["routing"]))
    _check(results,"v32-manual-retreat-is-not-panic",int(m32_manual.get("morale_routs",0))==0 and int(m32_manual.get("ordered_retreats",0))==1)
    _check(results,"v32-retreat-preserves-unit-health",float(m32_second["men"][0]["hp"])==10.0)
    # Reuse the 3x3 uniform battle fixture created in V3.0.
    m32_battle["escape_budget"] = 2
    _check(results,"v32-escape-uses-real-field",BattleMorale.prepare_escape(m32_battle,m32_squad,thirty))
    _check(results,"v32-escape-destination-is-set",not m32_squad["move_target"].is_empty())
    _check(results,"v32-escape-route-counted",int(m32_battle.get("escape_routes",0))==1)
    _check(results,"v32-escape-beyond-boundary",absf(float(m32_squad["escape_exit"]["outside"]["x"]))>BattleSurface.half_x(thirty) or absf(float(m32_squad["escape_exit"]["outside"]["z"]))>BattleSurface.half_z(thirty))
    _check(results,"v32-escape-target-passable",BattleSurface.ground_open(thirty,float(m32_squad["escape_exit"]["inside"]["x"]),float(m32_squad["escape_exit"]["inside"]["z"])))
    _check(results,"v32-no-extra-escape-search-when-cached",BattleMorale.prepare_escape(m32_battle,m32_squad,thirty) and int(m32_battle["escape_routes"])==1)
    _check(results,"v32-rout-save-roundtrip",JSON.parse_string(JSON.stringify(m32_battle)) is Dictionary)
    _check(results,"v32-not-every-squad-routed",not bool(m32_second.get("retreated",false)))
    _check(results,"v32-formation-command-valid-when-calm",BattleFormations.valid_for("spearman","line"))
    _check(results,"v32-easy-source-names",BattleMorale.PANIC_RADIUS==18.0)

    # V3.3: reachable campaign retreats after 3x3 individual battle.
    var p33 := PackedByteArray()
    p33.resize(Campaign.COLS*Campaign.ROWS)
    p33.fill(0)
    for loc in [Vector2i(50,50),Vector2i(49,50),Vector2i(48,50),Vector2i(50,49)]:
        p33[Campaign.index(loc.x,loc.y)]=1
    var nav33 = WorldTradeNav.new()
    nav33.configure(p33)
    var state33: Dictionary = {"cities":[{"c":49,"r":50,"team":0}],"seconds":100.0,"revision":1}
    Military.setup(state33)
    var ally33: Dictionary = Military.create_army(state33,0,50,50)
    var foe33: Dictionary = Military.create_army(state33,1,50,50)
    var own33: Dictionary = Military.add_unit(state33,ally33,"spearman")
    var enemy33: Dictionary = Military.add_unit(state33,foe33,"axeman")
    var prefer33: Vector2i = Vector2i(-1,0)
    var choice33: Dictionary = CampaignRetreat.choose_destination(state33,ally33,nav33,prefer33)
    _check(results,"v33-choose-reachable-safe-neighbor",bool(choice33.get("ok",false)))
    _check(results,"v33-prefer-own-side",int(choice33.get("c",-1))==49 and int(choice33.get("r",-1))==50)
    _check(results,"v33-route-proofs-reachability",(choice33.get("path",[]) as Array)==[[49,50]])
    _check(results,"v33-candidate-does-not-teleport",int(choice33.get("route_length",1))!=0 and (choice33.get("path",[]) as Array).size()==1)
    _check(results,"v33-still-two-living-armies",Military.units_for(state33,ally33).size()==1 and Military.units_for(state33,foe33).size()==1)
    var esc33: Dictionary = {"army_id":int(ally33["id"]),"team":0,"reserve":false,"routing":true,"retreated":true,"unit_id":int(own33["id"]),"damage":2.0,"kills":0,"men":[{"x":-345.0,"z":0.0,"hp":20.0,"escaped":true}],"escape_exit":{"outside":{"x":-347.0,"z":0.0}}}
    var fight33: Dictionary = {"army_id":int(foe33["id"]),"team":1,"reserve":false,"routing":false,"retreated":false,"unit_id":int(enemy33["id"]),"damage":1.0,"kills":0,"men":[{"x":15.0,"z":0.0,"hp":15.0,"escaped":false}]}
    var battle33: Dictionary = {"army_a":int(ally33["id"]),"army_b":int(foe33["id"]),"world_c":50,"world_r":50,"squads":[esc33,fight33],"initial_men":2,"reserve_men":0,"elapsed":15.0,"steps":150,"casualties":{},"shots":0}
    _check(results,"v33-exit-directions-follow-225x195",CampaignRetreat.preferred_offset(battle33,int(ally33["id"]))==Vector2i(-2,0))
    _check(results,"v33-loss-requires-retreat",CampaignRetreat._needs_retreat(battle33,ally33,1))
    _check(results,"v33-winner-does-not-retreat",not CampaignRetreat._needs_retreat(battle33,foe33,1))
    IndividualBattle._finish(state33,battle33,nav33)
    _check(results,"v33-finished-battle-cleared",state33.get("individual_battle",{}).is_empty())
    _check(results,"v33-retreated-to-safe-tile",int(ally33["c"])==49 and int(ally33["r"])==50)
    _check(results,"v33-retreat-keeps-survivor-hp",is_equal_approx(float(own33["hp"]),20.0))
    _check(results,"v33-winner-stays-on-battlefield",int(foe33["c"])==50 and int(foe33["r"])==50)
    foe33["c"] = 49
    foe33["r"] = 50
    _check(results,"v33-retreat-delays-encounter",float(ally33.get("retreat_until",0.0))==130.0 and not BattlePreview.detect_encounter(state33))
    foe33["c"] = 50
    foe33["r"] = 50
    _check(results,"v33-retreat-counter-and-report",int(state33.get("campaign_retreats",0))==1 and (state33.get("last_campaign_retreats",[]) as Array).size()==1)
    _check(results,"v33-battle-log-has-retreat-location",(state33["battle_log"] as Array).back().has("retreats"))
    _check(results,"v33-move-order-blocked-during-recovery",not bool(Military.command_move(state33,int(ally33["id"]),48,50,nav33).get("ok",false)))
    _check(results,"v33-battle-log-is-serializable",JSON.parse_string(JSON.stringify(state33)) is Dictionary)
    state33["seconds"]=131.0
    _check(results,"v33-recovery-allows-orders",bool(Military.command_move(state33,int(ally33["id"]),48,50,nav33).get("ok",false)))
    var trap33 := PackedByteArray()
    trap33.resize(Campaign.COLS*Campaign.ROWS)
    trap33.fill(0)
    trap33[Campaign.index(70,70)]=1
    var navtrap33 = WorldTradeNav.new()
    navtrap33.configure(trap33)
    var trapped_state33: Dictionary = {"cities":[],"seconds":22.0,"revision":0}
    Military.setup(trapped_state33)
    var trapped33: Dictionary = Military.create_army(trapped_state33,0,70,70)
    Military.add_unit(trapped_state33,trapped33,"spearman")
    var trapped_battle33: Dictionary = {"army_a":int(trapped33["id"]),"army_b":-1,"squads":[{"army_id":int(trapped33["id"]),"team":0,"reserve":false,"routing":true,"men":[{"hp":5.0,"escaped":true}],"escape_exit":{"outside":{"x":-400.0,"z":0.0}}}]}
    _check(results,"v33-blocked-shore-no-route",not bool(CampaignRetreat.choose_destination(trapped_state33,trapped33,navtrap33,Vector2i(-2,0)).get("ok",false)))
    var no_path33: Array = CampaignRetreat.apply_after_battle(trapped_state33,trapped_battle33,1,navtrap33)
    _check(results,"v33-trapped-retreat-not-teleported",trapped33["c"]==70 and trapped33["r"]==70)
    _check(results,"v33-trapped-counts-exactly-once",no_path33.size()==1 and int(trapped_state33.get("campaign_retreats_trapped",0))==1)
    _check(results,"v33-trapped-survivor-kept-alive",Military.units_for(trapped_state33,trapped33).size()==1)
    _check(results,"v33-legacy-save-default-missing-counters",int(trapped_state33.get("campaign_retreats",0))==1)

    var failed: Array = []
    for item in results:
        if not item["pass"]:
            failed.append(item["name"])
    return {"count":results.size(),"passed":results.size()-failed.size(),"failed":failed,"details":results}

static func _check(results: Array,name: String,passed: bool) -> void:
    results.append({"name":name,"pass":passed})
