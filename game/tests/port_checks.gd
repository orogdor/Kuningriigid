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
const CampaignPlay = preload("res://scripts/core/campaign_play_port.gd")
const CampaignWar = preload("res://scripts/core/campaign_war_port.gd")
const CityFounding = preload("res://scripts/core/city_founding_port.gd")
const SettlerCampaign = preload("res://scripts/core/settler_campaign_port.gd")
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
const BattleQueue = preload("res://scripts/core/campaign_battle_queue_port.gd")
const BattleBrief = preload("res://scripts/core/campaign_battle_brief_port.gd")
const IndividualBattle = preload("res://scripts/core/individual_battle_port.gd")
const BattleDoctrine = preload("res://scripts/core/battle_doctrine_v131.gd")
const BattleFormations = preload("res://scripts/core/battle_formations_v131.gd")
const BattleMorale = preload("res://scripts/core/battle_morale_v131.gd")
const CampaignRetreat = preload("res://scripts/core/campaign_retreat_v131.gd")
const Shots = preload("res://scripts/core/projectile_rules_v131.gd")
const BattleTerrain = preload("res://scripts/core/battle_terrain_v131.gd")
const Siege = preload("res://scripts/core/siege_port_v131.gd")
const SiegeAI = preload("res://scripts/core/campaign_siege_ai_port.gd")
const SiegeSupply = preload("res://scripts/core/campaign_siege_supply_port.gd")
const DetailTile = preload("res://scripts/adapters/native_detail_tile.gd")
const CityLayout = preload("res://scripts/core/city_layout_port.gd")
const CityPlanning = preload("res://scripts/core/city_planning_port.gd")
const CityFortifications = preload("res://scripts/core/city_fortification_port.gd")
const BuildVersion = preload("res://scripts/core/build_version_port.gd")
const CityCapture = preload("res://scripts/core/city_capture_port.gd")
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
    # V4.2: founding is connected, population/resource-paid and persistent.
    var founding_map := PackedByteArray()
    founding_map.resize(Campaign.COLS*Campaign.ROWS)
    founding_map.fill(1)
    var settlers_state: Dictionary = Preview.initialize([
        {"id":0,"c":20,"r":20,"team":0,"name":"Algus"},
        {"id":1,"c":80,"r":60,"team":1,"name":"Vastane"}])
    Territory.rebuild(settlers_state,founding_map,true)
    var founder_parent: Dictionary = settlers_state["cities"][0]
    founder_parent["pop"] = 9
    founder_parent["resources"]["wood"] = 75.0
    founder_parent["resources"]["stone"] = 25.0
    founder_parent["resources"]["bread"] = 50.0
    founder_parent["resources"]["water"] = 30.0
    var wanted := Vector2i(40,20)
    var before_resources: Dictionary = founder_parent["resources"].duplicate(true)
    _check(results,"v42-early-found-requires-settlement-tech",not bool(CityFounding.found(settlers_state,founding_map,0,wanted).get("ok",false)))
    settlers_state["teams"][0]["known"]["settlement"] = true
    _check(results,"v42-reject-same-tile",not bool(CityFounding.found(settlers_state,founding_map,0,Vector2i(20,20)).get("ok",false)))
    _check(results,"v42-reject-too-close",not bool(CityFounding.found(settlers_state,founding_map,0,Vector2i(30,20)).get("ok",false)))
    _check(results,"v42-reject-existing-rival-core",not bool(CityFounding.found(settlers_state,founding_map,0,Vector2i(80,60)).get("ok",false)))
    _check(results,"v42-reject-invalid-tile",not bool(CityFounding.found(settlers_state,founding_map,0,Vector2i(-1,20)).get("ok",false)))
    _check(results,"v42-reject-too-distant",not bool(CityFounding.found(settlers_state,founding_map,0,Vector2i(100,120)).get("ok",false)))
    _check(results,"v42-rejection-does-not-spend",founder_parent["resources"]==before_resources)
    var isolated_map: PackedByteArray = founding_map.duplicate()
    for r in range(Campaign.ROWS):
        isolated_map[Campaign.index(31,r)] = 0
    _check(results,"v42-no-teleport-through-sea",not bool(CityFounding.found(settlers_state,isolated_map,0,wanted).get("ok",false)))
    var founded: Dictionary = CityFounding.found(settlers_state,founding_map,0,wanted)
    _check(results,"v42-founding-success",bool(founded.get("ok",false)) and settlers_state["cities"].size()==3)
    _check(results,"v42-founding-parent-moves-three-residents",int(founder_parent["pop"])==6 and int(settlers_state["cities"][2]["pop"])==3)
    _check(results,"v42-founding-pays-actual-cost",is_equal_approx(float(founder_parent["resources"]["wood"]),20.0) and is_equal_approx(float(founder_parent["resources"]["stone"]),9.0))
    _check(results,"v42-new-town-start-stock",is_equal_approx(float(settlers_state["cities"][2]["resources"]["wood"]),25.0))
    _check(results,"v42-new-city-hall-built",str(settlers_state["cities"][2]["buildings"][0]["type"])=="hall")
    _check(results,"v42-new-city-unique-id",int(settlers_state["cities"][2]["id"])==2)
    _check(results,"v42-founding-log-stores-route",int(settlers_state["founding_log"][0]["route_length"])>=20)
    _check(results,"v42-repeat-same-tile-does-not-charge",not bool(CityFounding.found(settlers_state,founding_map,0,wanted).get("ok",false)) and is_equal_approx(float(founder_parent["resources"]["wood"]),20.0))
    Territory.rebuild(settlers_state,founding_map,true)
    _check(results,"v42-new-town-owns-core",Territory.owner_at(settlers_state,40,20)==2)
    var extra_saved: bool = Preview.save_preview(settlers_state,"user://v42_founding_regression.json")
    var extra_loaded: Dictionary = Preview.load_preview([{"id":0,"c":20,"r":20,"team":0,"name":"Algus"},{"id":1,"c":80,"r":60,"team":1,"name":"Vastane"}],"user://v42_founding_regression.json")
    _check(results,"v42-founded-city-survives-save-load",extra_saved and extra_loaded.get("cities",[]).size()==3)
    _check(results,"v42-founding-log-survives-save-load",extra_loaded.get("founding_log",[]).size()==1)
    if FileAccess.file_exists("user://v42_founding_regression.json"):
        DirAccess.remove_absolute(ProjectSettings.globalize_path("user://v42_founding_regression.json"))
    # V4.4 paid strategic military and genuine tactical campaign encounters.
    var war_state: Dictionary = Preview.initialize([
        {"id":0,"team":0,"c":60,"r":20,"name":"Kaitselinn"},
        {"id":1,"team":1,"c":38,"r":20,"name":"Väepealik"}])
    war_state["campaign"] = {"active":true,"player_team":0,"turn":10,"result":"playing"}
    war_state["teams"][1]["known"]["warfare"] = true
    var war_home: Dictionary = war_state["cities"][1]
    war_home["pop"] = 12
    war_home["resources"]["wood"] = 260.0
    war_home["resources"]["stone"] = 190.0
    war_home["resources"]["bread"] = 160.0
    war_home["resources"]["water"] = 180.0
    var war_wood_before: float = float(war_home["resources"]["wood"])
    var first_build: Dictionary = CampaignWar.ai_recruit(war_state)
    _check(results,"v44-war-ai-builds-barracks-with-war-tech",int(first_build["built"])==1 and war_home["buildings"].size()==2)
    _check(results,"v44-ai-barracks-really-spends-materials",float(war_home["resources"]["wood"])<war_wood_before)
    _check(results,"v44-ai-barracks-not-instantly-ready",not bool(war_home["buildings"][1]["ready"]))
    var no_duplicate_build: Dictionary = CampaignWar.ai_recruit(war_state)
    _check(results,"v44-no-duplicate-pending-barracks",int(no_duplicate_build["built"])==0 and war_home["buildings"].size()==2)
    war_home["buildings"][1]["ready"] = true
    war_home["buildings"][1]["hp"] = 350.0
    war_home["pop"] = 12
    war_state["campaign"]["turn"] = 11
    var recruit_one: Dictionary = CampaignWar.ai_recruit(war_state)
    _check(results,"v44-ai-trains-through-military-queue",int(recruit_one["trained"])==1 and war_home["training"].size()==1)
    _check(results,"v44-ai-recruit-debits-population",int(war_home["pop"])==11)
    Preview.tick(war_state,60.0)
    _check(results,"v44-army-unit-after-real-training-tick",int(war_state.get("military_trained",0))==1 and Military.units_for(war_state,war_state["armies"][0]).size()==1)
    war_state["campaign"]["turn"] = 12
    var recruit_two: Dictionary = CampaignWar.ai_recruit(war_state)
    _check(results,"v44-ai-trains-second-unit",int(recruit_two.get("trained",0))==1)
    Preview.tick(war_state,60.0)
    _check(results,"v44-garrison-two-genuine-units",Military.units_for(war_state,war_state["armies"][0]).size()==2)
    var strategic_nav = WorldTradeNav.new()
    strategic_nav.configure(founding_map)
    _check(results,"v44-too-early-to-declare-attack",int(CampaignWar.ai_march(war_state,strategic_nav)["ordered"])==0)
    war_state["campaign"]["turn"] = 18
    var ai_march_order: Dictionary = CampaignWar.ai_march(war_state,strategic_nav)
    _check(results,"v44-ai-marches-to-rival-city",int(ai_march_order["ordered"])==1 and war_state["armies"][0]["path"].size()>0)
    _check(results,"v44-ai-target-memo",int(war_state["armies"][0].get("campaign_target_city",-1))==0)
    _check(results,"v44-ai-keeps-existing-legal-route",int(CampaignWar.ai_march(war_state,strategic_nav)["ordered"])==0)
    var war_army_save: bool = Preview.save_preview(war_state,"user://v44_campaign_army.json")
    var army_load: Dictionary = Preview.load_preview([
        {"id":0,"team":0,"c":60,"r":20,"name":"Kaitselinn"},
        {"id":1,"team":1,"c":38,"r":20,"name":"Väepealik"}],"user://v44_campaign_army.json")
    _check(results,"v44-army-route-and-recruits-persist",war_army_save and army_load.get("armies",[]).size()==1 and army_load["armies"][0].get("path",[]).size()>0 and int(army_load.get("ai_military_recruit_orders",0))==2)
    if FileAccess.file_exists("user://v44_campaign_army.json"):
        DirAccess.remove_absolute(ProjectSettings.globalize_path("user://v44_campaign_army.json"))
    var battlefield_state: Dictionary = Preview.initialize([
        {"id":0,"team":0,"c":20,"r":20,"name":"Kaitse"},
        {"id":1,"team":1,"c":30,"r":20,"name":"Rünnak"}])
    battlefield_state["campaign"] = {"active":true,"player_team":0,"turn":20,"result":"playing"}
    var battle_army_a: Dictionary = Military.create_army(battlefield_state,0,25,20)
    var battle_army_b: Dictionary = Military.create_army(battlefield_state,1,25,20)
    Military.add_unit(battlefield_state,battle_army_a,"spearman")
    Military.add_unit(battlefield_state,battle_army_b,"spearman")
    var actual_fight: bool = BattlePreview.detect_encounter(battlefield_state)
    _check(results,"v44-campaign-engagement-starts-real-tactical-battle",actual_fight and not battlefield_state.get("individual_battle",{}).is_empty())
    _check(results,"v44-campaign-not-using-benchmark-attrition",battlefield_state.get("active_battle",{}).is_empty())
    var occupation_state: Dictionary = Preview.initialize([
        {"id":0,"team":0,"c":20,"r":20,"name":"Avatud linn"},
        {"id":1,"team":1,"c":35,"r":20,"name":"Vallutaja"}])
    occupation_state["campaign"] = {"active":true,"player_team":0,"turn":30,"result":"playing"}
    var occupying_army: Dictionary = Military.create_army(occupation_state,1,20,20)
    Military.add_unit(occupation_state,occupying_army,"spearman")
    Military.add_unit(occupation_state,occupying_army,"spearman")
    var first_occupation: Dictionary = CampaignWar.occupy_unfortified(occupation_state)
    _check(results,"v44-city-requires-two-occupation-turns",int(first_occupation["captured"])==0 and int(occupation_state["cities"][0]["team"])==0)
    _check(results,"v44-first-occupation-tracked",int(occupation_state["city_occupation_progress"]["0"]["turns"])==1)
    var second_occupation: Dictionary = CampaignWar.occupy_unfortified(occupation_state)
    _check(results,"v44-unfortified-garrisonless-city-changes-owner",int(second_occupation["captured"])==1 and int(occupation_state["cities"][0]["team"])==1)
    _check(results,"v44-city-keeps-buildings-on-occupation",occupation_state["cities"][0]["buildings"].size()==1)
    _check(results,"v44-city-occupation-logs-once",occupation_state["conquests"].size()==1 and str(occupation_state["conquests"][0]["mode"])=="undefended_occupation")
    _check(results,"v44-no-duplicate-occupation",int(CampaignWar.occupy_unfortified(occupation_state)["captured"])==0)
    var fortified_state: Dictionary = Preview.initialize([
        {"id":0,"team":0,"c":20,"r":20,"name":"Vallilinn"},
        {"id":1,"team":1,"c":35,"r":20,"name":"Sõjavägi"}])
    fortified_state["campaign"] = {"active":true,"player_team":0,"turn":30,"result":"playing"}
    fortified_state["cities"][0]["fortification"] = {"style":"palisade","tiles":[[20,20]]}
    var sieging: Dictionary = Military.create_army(fortified_state,1,20,20)
    Military.add_unit(fortified_state,sieging,"spearman")
    Military.add_unit(fortified_state,sieging,"spearman")
    CampaignWar.occupy_unfortified(fortified_state)
    CampaignWar.occupy_unfortified(fortified_state)
    _check(results,"v44-fortified-city-requires-real-siege",int(fortified_state["cities"][0]["team"])==0 and int(fortified_state.get("city_captures",0))==0)
    # Dev 97: a fortified city must not become an immortal no-garrison
    # state. Real hostile armies trigger a paid citizen militia and
    # the existing tactical siege/keep capture path (not a fake win).
    var fortified_home: Dictionary = fortified_state["cities"][0]
    fortified_home["pop"] = 10
    fortified_home["resources"]["wood"] = 90.0
    fortified_home["resources"]["stone"] = 40.0
    var levy_pop_before: int = int(fortified_home["pop"])
    var levy_wood_before: float = float(fortified_home["resources"]["wood"])
    var muster: Dictionary = CampaignWar.prepare_city_sieges(fortified_state)
    _check(results,"dev97-emergency-garrison-costs-real-population",
        int(muster["levied"])==1 and int(fortified_home["pop"])==levy_pop_before-1)
    _check(results,"dev97-garrison-equipment-is-not-free",
        is_equal_approx(float(fortified_home["resources"]["wood"]),levy_wood_before-8.0))
    _check(results,"dev97-armies-enter-real-linked-siege",
        int(muster["engagements"])==1 and bool(fortified_state.get("individual_battle",{}).get("siege",{}).get("linked_city",false)))
    _check(results,"dev97-siege-has-real-mustered-soldier",
        int(fortified_state.get("city_garrisons_mustered",0))==1 and fortified_state["military_units"].size()==3)
    _check(results,"dev97-no-garrison-duplication-during-battle",
        int(CampaignWar.prepare_city_sieges(fortified_state)["levied"])==0)
    _check(results,"dev97-siege-state-survives-json-roundtrip",
        JSON.parse_string(JSON.stringify(fortified_state["individual_battle"])) is Dictionary)
    fortified_state["individual_battle"]["siege"]["captured"] = true
    IndividualBattle._finish(fortified_state,fortified_state["individual_battle"])
    _check(results,"dev97-only-occupied-keep-changes-city-owner",
        int(fortified_home["team"])==1 and int(fortified_state.get("city_captures",0))==1)
    _check(results,"dev97-siege-conquest-logged-and-saved",
        fortified_state.get("conquests",[]).size()==1 and fortified_state.get("battle_log",[]).size()==1)
    var blockade_state: Dictionary = Preview.initialize([
        {"id":0,"team":0,"c":20,"r":20,"name":"Väsinud vallilinn"},
        {"id":1,"team":1,"c":35,"r":20,"name":"Piiraja"}])
    blockade_state["campaign"] = {"active":true,"player_team":0,"turn":1,"result":"playing"}
    blockade_state["cities"][0]["fortification"] = {"style":"palisade","tiles":[[20,20]]}
    blockade_state["cities"][0]["pop"] = 3
    blockade_state["cities"][0]["resources"]["wood"] = 0.0
    blockade_state["cities"][0]["resources"]["stone"] = 0.0
    var blockade_army: Dictionary = Military.create_army(blockade_state,1,20,20)
    Military.add_unit(blockade_state,blockade_army,"spearman")
    Military.add_unit(blockade_state,blockade_army,"spearman")
    _check(results,"dev97-no-phantom-troops-in-exhausted-city",
        int(CampaignWar.prepare_city_sieges(blockade_state)["levied"])==0)
    for siege_turn in range(1,6):
        blockade_state["campaign"]["turn"] = siege_turn
        CampaignWar.advance_blockades(blockade_state)
    _check(results,"dev97-blockade-cannot-bypass-wall-immediately",
        int(blockade_state["cities"][0]["team"])==0)
    var block_same_turn: Dictionary = CampaignWar.advance_blockades(blockade_state)
    _check(results,"dev97-blockade-cannot-tick-twice-in-one-turn",
        int(block_same_turn["surrendered"])==0 and int(blockade_state["city_blockade_progress"]["0"]["turns"])==5)
    blockade_state["campaign"]["turn"] = 6
    var surrender: Dictionary = CampaignWar.advance_blockades(blockade_state)
    _check(results,"dev97-exhausted-city-surrenders-after-six-full-turns",
        int(surrender["surrendered"])==1 and int(blockade_state["cities"][0]["team"])==1)
    _check(results,"dev97-blockade-conquest-is-differentiated-from-battle",
        int(blockade_state.get("city_captures",0))==1 and str(blockade_state["conquests"][0]["mode"])=="blockade_surrender")
    _check(results,"dev97-blockade-does-not-conquer-city-twice",
        int(CampaignWar.advance_blockades(blockade_state)["surrendered"])==0)
    # V4.6: several independent AI cities pay for recruitment in parallel.
    var multi_recruit: Dictionary = Preview.initialize([
        {"id":0,"team":0,"c":80,"r":20,"name":"Vastane"},
        {"id":1,"team":1,"c":20,"r":20,"name":"Pohjalinn"},
        {"id":2,"team":1,"c":40,"r":20,"name":"Lounalinn"}])
    multi_recruit["campaign"] = {"active":true,"player_team":0,"turn":10,"result":"playing"}
    multi_recruit["teams"][1]["known"]["warfare"] = true
    for supply in multi_recruit["cities"]:
        if int(supply["team"]) != 1:
            continue
        supply["pop"] = 12
        supply["resources"]["wood"] = 260.0
        supply["resources"]["stone"] = 190.0
        supply["resources"]["bread"] = 160.0
        supply["resources"]["water"] = 180.0
    var parallel_build: Dictionary = CampaignWar.ai_recruit(multi_recruit)
    _check(results,"v46-two-ai-cities-fund-separate-barracks",
        int(parallel_build["built"])==2 and multi_recruit["cities"][1]["buildings"].size()==2 and multi_recruit["cities"][2]["buildings"].size()==2)
    for ai_city_index in [1,2]:
        multi_recruit["cities"][ai_city_index]["buildings"][1]["ready"] = true
        multi_recruit["cities"][ai_city_index]["buildings"][1]["hp"] = 350.0
    var parallel_train: Dictionary = CampaignWar.ai_recruit(multi_recruit)
    _check(results,"v46-two-ai-cities-recruit-simultaneously",
        int(parallel_train["trained"])==2 and multi_recruit["cities"][1]["training"].size()==1 and multi_recruit["cities"][2]["training"].size()==1)
    Preview.tick(multi_recruit,60.0)
    _check(results,"v46-multicity-paid-recruits-really-exist",
        int(multi_recruit.get("military_trained",0))==2 and multi_recruit["armies"].size()==2)
    # Test fixtures below bypass costs only for creating known army compositions.
    # The previous two assertions cover actual economy-funded recruitment.
    var theater_manifest: Array = [
        {"id":0,"team":0,"c":30,"r":20,"name":"Vaenlane A"},
        {"id":1,"team":0,"c":50,"r":20,"name":"Vaenlane B"},
        {"id":2,"team":0,"c":70,"r":20,"name":"Vaenlane C"},
        {"id":3,"team":1,"c":20,"r":20,"name":"AI linn A"},
        {"id":4,"team":1,"c":40,"r":20,"name":"AI linn B"},
        {"id":5,"team":1,"c":60,"r":20,"name":"AI linn C"}]
    var theater_state: Dictionary = Preview.initialize(theater_manifest)
    theater_state["campaign"] = {"active":true,"player_team":0,"turn":18,"result":"playing"}
    var leader_id: int = -1
    for city_index in [3,4,5]:
        var origin_city: Dictionary = theater_state["cities"][city_index]
        var strike_army: Dictionary = Military.create_army(theater_state,1,int(origin_city["c"]),int(origin_city["r"]))
        if leader_id < 0:
            leader_id = int(strike_army["id"])
        for unit_index in range(3):
            Military.add_unit(theater_state,strike_army,"spearman")
    theater_state["individual_battle"] = {"army_a":leader_id,"army_b":-1}
    var during_fight: Dictionary = CampaignWar.ai_march(theater_state,strategic_nav)
    _check(results,"v46-independent-fronts-march-while-one-battle-active",
        int(during_fight["ordered"])==2 and int(during_fight["garrisons"])==2)
    theater_state["individual_battle"] = {}
    var after_fight: Dictionary = CampaignWar.ai_march(theater_state,strategic_nav)
    _check(results,"v46-returned-army-opens-third-front",
        int(after_fight["ordered"])==1 and int(after_fight["garrisons"])==1)
    var front_count: int = 0
    var garrison_count: int = 0
    var targets: Dictionary = {}
    var safe_guards: bool = true
    for group in theater_state["armies"]:
        var number: int = Military.units_for(theater_state,group).size()
        if str(group.get("strategic_role","")) == "attack":
            front_count += 1
            targets[str(int(group.get("campaign_target_city",-1)))] = true
            safe_guards = safe_guards and number==2 and group.get("path",[]).size()>0
        elif str(group.get("strategic_role","")) == "garrison":
            garrison_count += 1
            safe_guards = safe_guards and number==1 and group.get("path",[]).is_empty()
    _check(results,"v46-three-distinct-target-cities-selected",front_count==3 and targets.size()==3)
    _check(results,"v46-each-home-has-one-saved-defender",
        garrison_count==3 and safe_guards and int(theater_state.get("ai_garrison_assignments",0))==3)
    _check(results,"v46-idempotent-strategic-planning",int(CampaignWar.ai_march(theater_state,strategic_nav)["ordered"])==0)
    var theater_saved: bool = Preview.save_preview(theater_state,"user://v46_multifront.json")
    var theater_loaded: Dictionary = Preview.load_preview(theater_manifest,"user://v46_multifront.json")
    _check(results,"v46-three-fronts-and-guards-survive-save-load",
        theater_saved and theater_loaded.get("armies",[]).size()==6 and int(theater_loaded.get("ai_garrison_assignments",0))==3)
    if FileAccess.file_exists("user://v46_multifront.json"):
        DirAccess.remove_absolute(ProjectSettings.globalize_path("user://v46_multifront.json"))
    # Dev 103: strongholds need larger real attacking formations.
    var stronghold_manifest: Array = [
        {"id":0,"team":0,"c":30,"r":20,"name":"Muuridega vaenlane"},
        {"id":1,"team":1,"c":20,"r":20,"name":"Rundaja kodu"}]
    var stronghold_state: Dictionary = Preview.initialize(stronghold_manifest)
    stronghold_state["campaign"] = {"active":true,"player_team":0,"turn":19,"result":"playing"}
    stronghold_state["cities"][0]["fortification"] = {"style":"palisade","tiles":[[30,20]]}
    var strike: Dictionary = Military.create_army(stronghold_state,1,20,20)
    for index in range(3):
        Military.add_unit(stronghold_state,strike,"spearman")
    var small_siege: Dictionary = CampaignWar.ai_march(stronghold_state,strategic_nav)
    _check(results,"v47-three-troops-do-not-suicide-against-walled-city",
        int(small_siege["ordered"])==0 and strike["path"].is_empty())
    Military.add_unit(stronghold_state,strike,"spearman")
    Military.add_unit(stronghold_state,strike,"spearman")
    var large_siege: Dictionary = CampaignWar.ai_march(stronghold_state,strategic_nav)
    var siege_guard_count: int = 0
    for unit in stronghold_state["armies"]:
        if String(unit.get("strategic_role","")) == "garrison":
            siege_guard_count += Military.units_for(stronghold_state,unit).size()
    _check(results,"v47-stronghold-needs-four-troops-and-home-guard",
        int(large_siege["ordered"])==1 and int(large_siege["garrisons"])==1 and Military.units_for(stronghold_state,strike).size()==4 and siege_guard_count==1)
    _check(results,"v47-siege-target-and-path-remain-persistent",
        int(strike.get("campaign_target_city",-1))==0 and strike["path"].size()>0)
    var reinforced_state: Dictionary = Preview.initialize(stronghold_manifest)
    reinforced_state["campaign"] = {"active":true,"player_team":0,"turn":20,"result":"playing"}
    reinforced_state["cities"][0]["fortification"] = {"style":"palisade","tiles":[[30,20]]}
    var veteran_guard: Dictionary = Military.create_army(reinforced_state,1,20,20)
    veteran_guard["strategic_role"] = "garrison"
    for index in range(5):
        Military.add_unit(reinforced_state,veteran_guard,"spearman")
    var veteran_siege: Dictionary = CampaignWar.ai_march(reinforced_state,strategic_nav)
    var remaining_guard: int = 0
    for unit in reinforced_state["armies"]:
        if String(unit.get("strategic_role","")) == "garrison":
            remaining_guard += Military.units_for(reinforced_state,unit).size()
    _check(results,"v47-trained-garrison-redeploys-without-duplicate-troops",
        int(veteran_siege["ordered"])==1 and int(veteran_siege["garrisons"])==1 and Military.units_for(reinforced_state,veteran_guard).size()==4 and remaining_guard==1 and reinforced_state["military_units"].size()==5)
    var rescue_manifest: Array = [
        {"id":0,"team":0,"c":80,"r":20,"name":"Vaenlase linn"},
        {"id":1,"team":1,"c":20,"r":20,"name":"Ohustatud kodu"}]
    var rescue_state: Dictionary = Preview.initialize(rescue_manifest)
    rescue_state["campaign"] = {"active":true,"player_team":0,"turn":20,"result":"playing"}
    var rescue_guard: Dictionary = Military.create_army(rescue_state,1,20,20)
    Military.add_unit(rescue_state,rescue_guard,"spearman")
    rescue_guard["strategic_role"] = "garrison"
    var rescue_strike: Dictionary = Military.create_army(rescue_state,1,50,20)
    Military.add_unit(rescue_state,rescue_strike,"spearman")
    Military.add_unit(rescue_state,rescue_strike,"spearman")
    var rescue_old_order: Dictionary = Military.command_move(rescue_state,int(rescue_strike["id"]),80,20,strategic_nav)
    rescue_strike["strategic_role"] = "attack"
    rescue_strike["campaign_target_city"] = 0
    var rescue_enemy: Dictionary = Military.create_army(rescue_state,0,23,20)
    for index in range(3):
        Military.add_unit(rescue_state,rescue_enemy,"spearman")
    var rescue_first: Dictionary = CampaignWar.recall_threatened(rescue_state,strategic_nav)
    _check(results,"v47-relief-cancels-outbound-offensive",
        bool(rescue_old_order.get("ok",false)) and int(rescue_first["recalled"])==1 and str(rescue_strike["strategic_role"])=="relief" and int(rescue_strike.get("defense_city_id",-1))==1)
    _check(results,"v47-relief-orders-real-return-route",
        rescue_strike.get("path",[]).size()>0 and int(rescue_strike["path"][-1][0])==20 and int(rescue_strike["path"][-1][1])==20)
    _check(results,"v47-relief-is-idempotent-and-not-redeployed",
        int(CampaignWar.recall_threatened(rescue_state,strategic_nav)["recalled"])==0 and int(CampaignWar.ai_march(rescue_state,strategic_nav)["ordered"])==0)
    var saved_relief: bool = Preview.save_preview(rescue_state,"user://v47_relief.json")
    var loaded_relief: Dictionary = Preview.load_preview(rescue_manifest,"user://v47_relief.json")
    _check(results,"v47-defense-role-and-route-survive-save",
        saved_relief and int(loaded_relief.get("ai_defense_recalls",0))==1 and str(loaded_relief["armies"][1].get("strategic_role",""))=="relief" and loaded_relief["armies"][1]["path"].size()>0)
    if FileAccess.file_exists("user://v47_relief.json"):
        DirAccess.remove_absolute(ProjectSettings.globalize_path("user://v47_relief.json"))
    # With the threat gone, the relieved army can return to the reserve pool.
    rescue_enemy["c"] = 100
    rescue_strike["c"] = 20
    rescue_strike["r"] = 20
    rescue_strike["path"] = []
    var released_army: Dictionary = CampaignWar.recall_threatened(rescue_state,strategic_nav)
    _check(results,"v47-relief-releases-after-threat-disappears",
        int(released_army["released"])==1 and str(rescue_strike.get("strategic_role",""))=="reserve")
    rescue_enemy["c"] = 23
    var holding: Dictionary = CampaignWar.ai_march(rescue_state,strategic_nav)
    _check(results,"v47-endangered-city-keeps-reserve-soldiers",
        int(holding["ordered"])==0 and rescue_strike["path"].is_empty())
    # Dev 110: a three-unit army cannot breach a walled city, but two
    # paid home-city detachments can rally into a five-unit army before
    # leaving one home defender and marching four units to the fortress.
    var rally_manifest: Array = [
        {"id":0,"team":0,"c":35,"r":20,"name":"Muurilinn"},
        {"id":1,"team":1,"c":20,"r":20,"name":"Koonduslinn"},
        {"id":2,"team":1,"c":20,"r":28,"name":"Abilinn"}]
    var rally_state: Dictionary = Preview.initialize(rally_manifest)
    rally_state["campaign"] = {"active":true,"player_team":0,"turn":24,"result":"playing"}
    rally_state["cities"][0]["fortification"] = {"style":"palisade","tiles":[[35,20]]}
    var rally_leader: Dictionary = Military.create_army(rally_state,1,20,20)
    var rally_donor: Dictionary = Military.create_army(rally_state,1,20,28)
    for ix in range(3):
        Military.add_unit(rally_state,rally_leader,"spearman")
        Military.add_unit(rally_state,rally_donor,"spearman")
    var total_before: int = rally_state["military_units"].size()
    _check(results,"v48-unrallied-armies-cannot-attack-fort",
        int(CampaignWar.ai_march(rally_state,strategic_nav)["ordered"])==0)
    var rally_dispatch: Dictionary = CampaignWar.rally_for_sieges(rally_state,strategic_nav)
    var moving_rally: Dictionary = {}
    for squad in rally_state["armies"]:
        if String(squad.get("strategic_role","")) == "rally":
            moving_rally = squad
            break
    _check(results,"v48-physical-rally-orders-real-route",
        int(rally_dispatch["dispatched"])==1 and moving_rally.get("path",[]).size()>0)
    _check(results,"v48-rally-troops-paid-and-source-guard-retained",
        rally_state["military_units"].size()==total_before and Military.units_for(rally_state,rally_leader).size()==3 and Military.units_for(rally_state,rally_donor).size()==1 and Military.units_for(rally_state,moving_rally).size()==2)
    _check(results,"v48-rally-orders-are-idempotent",
        int(CampaignWar.rally_for_sieges(rally_state,strategic_nav)["dispatched"])==0 and rally_state["military_units"].size()==total_before)
    var rally_saved: bool = Preview.save_preview(rally_state,"user://v48_rally.json")
    var rally_loaded: Dictionary = Preview.load_preview(rally_manifest,"user://v48_rally.json")
    _check(results,"v48-rally-roles-and-waypoints-survive-json",
        rally_saved and rally_loaded.get("armies",[]).size()==3 and rally_loaded["armies"][2].get("path",[]).size()>0 and str(rally_loaded["armies"][2].get("strategic_role",""))=="rally")
    if FileAccess.file_exists("user://v48_rally.json"):
        DirAccess.remove_absolute(ProjectSettings.globalize_path("user://v48_rally.json"))
    Military.advance(rally_state,60.0,strategic_nav)
    _check(results,"v48-convoy-really-reaches-assembly-city",
        moving_rally.get("path",[]).is_empty() and int(moving_rally.get("c",-1))==20 and int(moving_rally.get("r",-1))==20)
    var joined: Dictionary = CampaignWar.rally_for_sieges(rally_state,strategic_nav)
    _check(results,"v48-arriving-units-join-leader-exactly-once",
        int(joined["merged"])==2 and Military.units_for(rally_state,rally_leader).size()==5 and rally_state["military_units"].size()==total_before)
    var siege_departure: Dictionary = CampaignWar.ai_march(rally_state,strategic_nav)
    var remaining_in_assembly: int = 0
    for stack in rally_state["armies"]:
        if int(stack.get("team",-1)) == 1 and int(stack.get("c",-1))==20 and int(stack.get("r",-1))==20 and str(stack.get("strategic_role",""))=="garrison":
            remaining_in_assembly += Military.units_for(rally_state,stack).size()
    _check(results,"v48-four-unit-siege-marches-with-home-guard",
        int(siege_departure["ordered"])==1 and int(siege_departure["garrisons"])==1 and Military.units_for(rally_state,rally_leader).size()==4 and remaining_in_assembly==1)
    _check(results,"v48-two-city-guards-and-attack-force-conserve-all-six",
        rally_state["military_units"].size()==total_before and int(rally_state.get("ai_rally_merged_units",0))==2)
    _check(results,"v48-no-second-siege-march-or-rally-after-dispatch",
        int(CampaignWar.ai_march(rally_state,strategic_nav)["ordered"])==0 and int(CampaignWar.rally_for_sieges(rally_state,strategic_nav)["dispatched"])==0)
    # Dev 114: AI creates *real* paid construction orders inside the
    # existing linked-wall battle. Progress uses the actual siege engine.
    var craft_manifest: Array = [
        {"id":0,"team":0,"c":35,"r":20,"name":"Muurilinn"},
        {"id":1,"team":1,"c":15,"r":20,"name":"AI varustuslinn"}]
    var craft_state: Dictionary = Preview.initialize(craft_manifest)
    craft_state["campaign"] = {"active":true,"player_team":0,"turn":28,"result":"playing"}
    craft_state["cities"][0]["fortification"] = {"style":"palisade","tiles":[[35,20]]}
    craft_state["cities"][1]["resources"]["wood"] = 160.0
    var craft_attacker: Dictionary = Military.create_army(craft_state,1,35,20)
    var craft_defender: Dictionary = Military.create_army(craft_state,0,35,20)
    Military.add_unit(craft_state,craft_attacker,"spearman")
    Military.add_unit(craft_state,craft_attacker,"spearman")
    Military.add_unit(craft_state,craft_defender,"spearman")
    var craft_started: Dictionary = IndividualBattle.start(craft_state,int(craft_attacker["id"]),int(craft_defender["id"]))
    var craft_battle: Dictionary = craft_state.get("individual_battle",{})
    var craft_siege: Dictionary = craft_battle.get("siege",{})
    _check(results,"v50-no-instant-ai-equipment-before-delivery",
        bool(craft_started.get("ok",false)) and craft_siege.get("works",[]).is_empty() and is_equal_approx(float(craft_state["cities"][1]["resources"]["wood"]),160.0))
    var scheduled_wood: Dictionary = SiegeSupply.advance(craft_state,craft_battle,1.0,strategic_nav)
    _check(results,"v50-convoy-real-wood-withdrawal-and-route",
        int(scheduled_wood["dispatched"])==1 and int(craft_siege["supply_convoy"]["path"].size())>=20 and is_equal_approx(float(craft_state["cities"][1]["resources"]["wood"]),67.0))
    _check(results,"v50-cannot-craft-while-wood-still-in-transit",
        craft_siege["works"].is_empty() and int(SiegeAI.equip(craft_state,craft_battle)["ordered"])==0)
    var arriving_wood: Dictionary = SiegeSupply.advance(craft_state,craft_battle,45.0,strategic_nav)
    _check(results,"v49-ai-crafts-linked-physical-ram-and-ladder",
        int(arriving_wood["delivered"])==1 and craft_siege.get("works",[]).size()==2 and int(craft_siege.get("ai_craft_orders",0))==2)
    _check(results,"v49-ai-pays-ram-and-ladder-from-real-city-stock",
        is_equal_approx(float(craft_state["cities"][1]["resources"]["wood"]),67.0) and is_equal_approx(float(craft_siege.get("supply_wood",0.0)),20.0) and is_equal_approx(float(craft_siege.get("ai_craft_wood",0.0)),73.0))
    _check(results,"v49-siege-tools-not-instantaneously-ready",
        not bool(craft_siege["works"][0]["ready"]) and not bool(craft_siege["works"][1]["ready"]))
    Siege.tick_assault_works(craft_battle,89.0)
    _check(results,"v49-ram-time-cost-is-real",
        not bool(craft_siege["works"][0]["ready"]) and is_equal_approx(float(craft_siege["works"][0]["progress"]),89.0))
    Siege.tick_assault_works(craft_battle,1.0)
    Siege.tick_ladders(craft_battle,30.0)
    _check(results,"v49-ram-and-ladder-ready-only-after-timers",
        bool(craft_siege["works"][0]["ready"]) and bool(craft_siege["works"][1]["ready"]))
    _check(results,"v49-no-duplicate-ai-craft-on-repeat",
        int(SiegeAI.equip(craft_state,craft_battle)["ordered"])==0 and craft_siege["works"].size()==2 and is_equal_approx(float(craft_state["cities"][1]["resources"]["wood"]),67.0))
    _check(results,"v49-siege-crafting-counts-campaign-events",
        int(craft_state.get("ai_siege_works",0))==2 and craft_state["military_units"].size()==3)
    _check(results,"v49-siege-work-jobs-are-json-persistent",
        JSON.parse_string(JSON.stringify(craft_battle)) is Dictionary and JSON.parse_string(JSON.stringify(craft_state)) is Dictionary)
    var low_wood_state: Dictionary = Preview.initialize(craft_manifest)
    low_wood_state["campaign"] = {"active":true,"player_team":0,"turn":28,"result":"playing"}
    low_wood_state["cities"][0]["fortification"] = {"style":"palisade","tiles":[[35,20]]}
    low_wood_state["cities"][1]["resources"]["wood"] = 5.0
    var low_ai: Dictionary = Military.create_army(low_wood_state,1,35,20)
    var low_defender: Dictionary = Military.create_army(low_wood_state,0,35,20)
    for ix in range(2):
        Military.add_unit(low_wood_state,low_ai,"spearman")
    Military.add_unit(low_wood_state,low_defender,"spearman")
    IndividualBattle.start(low_wood_state,int(low_ai["id"]),int(low_defender["id"]))
    _check(results,"v49-ai-gets-no-free-siege-works-when-poor",
        low_wood_state["individual_battle"]["siege"]["works"].is_empty() and is_equal_approx(float(low_wood_state["cities"][1]["resources"]["wood"]),5.0))
    var open_gate_state: Dictionary = Preview.initialize(craft_manifest)
    open_gate_state["campaign"] = {"active":true,"player_team":0,"turn":28,"result":"playing"}
    open_gate_state["cities"][0]["fortification"] = {"style":"palisade","tiles":[[35,20]],"gates_open":{"35:20":true}}
    open_gate_state["cities"][1]["resources"]["wood"] = 170.0
    var open_ai: Dictionary = Military.create_army(open_gate_state,1,35,20)
    var open_defender: Dictionary = Military.create_army(open_gate_state,0,35,20)
    for ix in range(2):
        Military.add_unit(open_gate_state,open_ai,"spearman")
    Military.add_unit(open_gate_state,open_defender,"spearman")
    IndividualBattle.start(open_gate_state,int(open_ai["id"]),int(open_defender["id"]))
    SiegeSupply.advance(open_gate_state,open_gate_state["individual_battle"],1.0,strategic_nav)
    SiegeSupply.advance(open_gate_state,open_gate_state["individual_battle"],45.0,strategic_nav)
    _check(results,"v49-open-gate-ai-selects-paid-siege-tower",
        str(open_gate_state["individual_battle"]["siege"]["works"][0]["kind"])=="tower" and is_equal_approx(float(open_gate_state["individual_battle"]["siege"]["works"][0]["duration"]),120.0))
    var player_siege_state: Dictionary = Preview.initialize([
        {"id":0,"team":0,"c":15,"r":20,"name":"Mangija"},
        {"id":1,"team":1,"c":35,"r":20,"name":"Vastane"}])
    player_siege_state["campaign"] = {"active":true,"player_team":0,"turn":28,"result":"playing"}
    player_siege_state["cities"][1]["fortification"] = {"style":"palisade","tiles":[[35,20]]}
    var own_army: Dictionary = Military.create_army(player_siege_state,0,35,20)
    var other_army: Dictionary = Military.create_army(player_siege_state,1,35,20)
    for ix in range(2):
        Military.add_unit(player_siege_state,own_army,"spearman")
    Military.add_unit(player_siege_state,other_army,"spearman")
    IndividualBattle.start(player_siege_state,int(own_army["id"]),int(other_army["id"]))
    _check(results,"v49-player-controls-own-attack-with-no-auto-crafting",
        player_siege_state["individual_battle"]["siege"]["works"].is_empty() and int(player_siege_state.get("ai_siege_works",0))==0)
    var convoy_save: bool = Preview.save_preview(open_gate_state,"user://v50_siege_convoy.json")
    var convoy_loaded: Dictionary = Preview.load_preview(craft_manifest,"user://v50_siege_convoy.json")
    _check(results,"v50-delivered-convoy-and-equipment-survive-save",
        convoy_save and str(convoy_loaded.get("individual_battle",{}).get("siege",{}).get("supply_convoy",{}).get("status",""))=="delivered" and convoy_loaded["individual_battle"]["siege"]["works"].size()==2)
    if FileAccess.file_exists("user://v50_siege_convoy.json"):
        DirAccess.remove_absolute(ProjectSettings.globalize_path("user://v50_siege_convoy.json"))
    var raid_state: Dictionary = Preview.initialize(craft_manifest)
    raid_state["campaign"] = {"active":true,"player_team":0,"turn":28,"result":"playing"}
    raid_state["cities"][0]["fortification"] = {"style":"palisade","tiles":[[35,20]]}
    raid_state["cities"][1]["resources"]["wood"] = 160.0
    var raider_attack: Dictionary = Military.create_army(raid_state,1,35,20)
    var raider_defend: Dictionary = Military.create_army(raid_state,0,35,20)
    for ix in range(2):
        Military.add_unit(raid_state,raider_attack,"spearman")
    Military.add_unit(raid_state,raider_defend,"spearman")
    IndividualBattle.start(raid_state,int(raider_attack["id"]),int(raider_defend["id"]))
    var raid_battle: Dictionary = raid_state["individual_battle"]
    var raid_dispatch: Dictionary = SiegeSupply.advance(raid_state,raid_battle,1.0,strategic_nav)
    var raid_path: Array = raid_battle["siege"]["supply_convoy"]["path"]
    var raid_point: Array = raid_path[0]
    var intercept: Dictionary = Military.create_army(raid_state,0,int(raid_point[0]),int(raid_point[1]))
    Military.add_unit(raid_state,intercept,"spearman")
    var raid_loss: Dictionary = SiegeSupply.advance(raid_state,raid_battle,3.0,strategic_nav)
    _check(results,"v50-hostile-army-can-intercept-real-convoy",
        int(raid_dispatch["dispatched"])==1 and int(raid_loss["lost"])==1 and str(raid_battle["siege"]["supply_convoy"]["status"])=="lost")
    _check(results,"v50-intercepted-wood-is-not-refunded-or-free-to-spend",
        raid_battle["siege"]["works"].is_empty() and is_equal_approx(float(raid_state["cities"][1]["resources"]["wood"]),67.0) and is_equal_approx(float(raid_state.get("ai_siege_supply_lost_wood",0.0)),93.0))
    _check(results,"v50-convoy-is-not-duplicated-after-interception",
        int(SiegeSupply.advance(raid_state,raid_battle,50.0,strategic_nav)["dispatched"])==0 and int(raid_state.get("ai_siege_supply_sent",0))==1)
    var mid_state: Dictionary = Preview.initialize(craft_manifest)
    mid_state["campaign"] = {"active":true,"player_team":0,"turn":28,"result":"playing"}
    mid_state["cities"][0]["fortification"] = {"style":"palisade","tiles":[[35,20]]}
    mid_state["cities"][1]["resources"]["wood"] = 160.0
    var mid_attack: Dictionary = Military.create_army(mid_state,1,35,20)
    var mid_defend: Dictionary = Military.create_army(mid_state,0,35,20)
    Military.add_unit(mid_state,mid_attack,"spearman")
    Military.add_unit(mid_state,mid_defend,"spearman")
    IndividualBattle.start(mid_state,int(mid_attack["id"]),int(mid_defend["id"]))
    var mid_battle: Dictionary = mid_state["individual_battle"]
    SiegeSupply.advance(mid_state,mid_battle,1.0,strategic_nav)
    SiegeSupply.advance(mid_state,mid_battle,10.0,strategic_nav)
    var mid_save: bool = Preview.save_preview(mid_state,"user://v50_siege_transit.json")
    var mid_load: Dictionary = Preview.load_preview(craft_manifest,"user://v50_siege_transit.json")
    _check(results,"v50-in-transit-wood-and-waypoints-save",
        mid_save and str(mid_load.get("individual_battle",{}).get("siege",{}).get("supply_convoy",{}).get("status",""))=="moving" and int(mid_load["individual_battle"]["siege"]["supply_convoy"]["waypoint"])>0)
    if FileAccess.file_exists("user://v50_siege_transit.json"):
        DirAccess.remove_absolute(ProjectSettings.globalize_path("user://v50_siege_transit.json"))
    # Dev122: simultaneous collisions are durable, deterministically
    # scheduled, never cloned and never resolved as fake background damage.
    var fronts_manifest: Array = [
        {"id":0,"team":0,"c":10,"r":10,"name":"Esimene riik"},
        {"id":1,"team":1,"c":90,"r":90,"name":"Teine riik"}]
    var fronts_state: Dictionary = Preview.initialize(fronts_manifest)
    fronts_state["campaign"] = {"active":true,"player_team":0,"turn":22,"result":"playing"}
    var distant_a: Dictionary = Military.create_army(fronts_state,0,70,20)
    var distant_b: Dictionary = Military.create_army(fronts_state,1,70,20)
    var middle_a: Dictionary = Military.create_army(fronts_state,0,45,20)
    var middle_b: Dictionary = Military.create_army(fronts_state,1,45,20)
    var nearest_a: Dictionary = Military.create_army(fronts_state,0,25,20)
    var nearest_b: Dictionary = Military.create_army(fronts_state,1,25,20)
    for force in fronts_state["armies"]:
        Military.add_unit(fronts_state,force,"spearman")
    distant_a["path"] = [[71,20]]
    distant_b["path"] = [[71,20]]
    middle_a["path"] = [[46,20]]
    var start_front: bool = BattlePreview.detect_encounter(fronts_state)
    _check(results,"v51-first-front-selected-by-world-coordinates",
        start_front and int(fronts_state["individual_battle"]["world_c"])==25 and int(fronts_state["individual_battles_started"])==1)
    _check(results,"v51-two-remaining-fronts-queued-not-lost",
        fronts_state["pending_battles"].size()==2 and int(fronts_state["pending_battles"][0]["c"])==45 and int(fronts_state["pending_battles"][1]["c"])==70)
    var brief_three: Array = BattleBrief.fronts(fronts_state)
    _check(results,"v52-panel-lists-active-plus-two-waiting-fronts",
        brief_three.size()==3 and str(brief_three[0]["kind"])=="active" and str(brief_three[1]["kind"])=="pending" and str(brief_three[2]["kind"])=="pending")
    _check(results,"v52-front-selector-shows-real-teams-and-army-strength",
        int(brief_three[0]["c"])==25 and int(brief_three[0]["units_a"])==1 and int(brief_three[0]["team_b"])==1 and BattleBrief.front_label(brief_three[1]).contains("(45,20)"))
    var brief_live: String = BattleBrief.report(fronts_state)
    _check(results,"v52-long-mobile-report-includes-front-positions",
        brief_live.contains("KÄIB") and brief_live.contains("OOTEL 1") and brief_live.contains("(70,20)") and brief_live.contains("Järjekorda võetud kokku: 3"))
    _check(results,"v52-no-finished-battle-is-not-fictionally-reported",
        brief_live.contains("Lahinguid ei ole veel lõpetatud."))
    _check(results,"v51-queued-armies-stay-at-contact-position",
        distant_a["path"].is_empty() and distant_b["path"].is_empty() and middle_a["path"].is_empty())
    _check(results,"v51-do-not-start-simultaneous-second-battle",
        not BattlePreview.detect_encounter(fronts_state) and fronts_state["pending_battles"].size()==2 and int(fronts_state["individual_battles_started"])==1)
    var battle_state_saved: bool = Preview.save_preview(fronts_state,"user://v51_battle_queue.json")
    var battle_state_loaded: Dictionary = Preview.load_preview(fronts_manifest,"user://v51_battle_queue.json")
    _check(results,"v51-two-front-queue-survives-save-load",
        battle_state_saved and battle_state_loaded.get("pending_battles",[]).size()==2 and int(battle_state_loaded["pending_battles"][0]["c"])==45)
    if FileAccess.file_exists("user://v51_battle_queue.json"):
        DirAccess.remove_absolute(ProjectSettings.globalize_path("user://v51_battle_queue.json"))
    # Finish with the actual IndividualBattle persistence/XP/log pipeline.
    IndividualBattle._finish(fronts_state,fronts_state["individual_battle"])
    _check(results,"v51-only-combatants-receive-post-battle-cooldown",
        float(nearest_a.get("engagement_cooldown_until",0.0))>0.0 and float(middle_a.get("engagement_cooldown_until",0.0))==0.0)
    var second_front: Dictionary = BattleQueue.advance(fronts_state)
    _check(results,"v51-independent-front-starts-despite-global-cooldown",
        int(second_front["started"])==1 and int(fronts_state["individual_battle"]["world_c"])==45 and int(fronts_state["individual_battles_started"])==2)
    _check(results,"v51-last-front-remains-pending",
        int(second_front["pending"])==1 and int(fronts_state["pending_battles"][0]["c"])==70)
    _check(results,"v51-queue-does-not-spawn-combatants",
        fronts_state["military_units"].size()==6 and int(fronts_state.get("battles_queued_total",0))==3)
    # Invalidate the third front while the second fights. Its saved ticket
    # must be discarded, not fought or converted into an imaginary victory.
    for warrior in Military.units_for(fronts_state,distant_b):
        warrior["hp"] = 0.0
    IndividualBattle._finish(fronts_state,fronts_state["individual_battle"])
    var expired_front: Dictionary = BattleQueue.advance(fronts_state)
    _check(results,"v51-dead-queued-army-is-revalidated-and-dropped",
        int(expired_front["discarded"])>=1 and int(expired_front["started"])==0 and fronts_state["pending_battles"].is_empty())
    _check(results,"v51-two-real-fights-and-zero-phantom-fights",
        int(fronts_state["individual_battles_started"])==2 and int(fronts_state["individual_battles_finished"])==2 and fronts_state["battle_log"].size()==2)
    _check(results,"v51-stale-contact-cannot-be-requeued",
        int(BattleQueue.advance(fronts_state)["started"])==0 and int(fronts_state.get("battles_queue_expired",0))>=1)
    var reloaded_old: Dictionary = Preview.initialize(fronts_manifest)
    reloaded_old["campaign"] = {"active":true,"player_team":0,"turn":22,"result":"playing"}
    reloaded_old.erase("pending_battles")
    var legacy_saved: bool = Preview.save_preview(reloaded_old,"user://v51_legacy.json")
    var legacy_loaded: Dictionary = Preview.load_preview(fronts_manifest,"user://v51_legacy.json")
    _check(results,"v51-old-campaign-saves-get-safe-empty-queue",
        legacy_saved and legacy_loaded.get("pending_battles",[]).is_empty() and int(legacy_loaded.get("battles_queued_total",0))==0)
    if FileAccess.file_exists("user://v51_legacy.json"):
        DirAccess.remove_absolute(ProjectSettings.globalize_path("user://v51_legacy.json"))
    var brief_done: Dictionary = {"world_c":44,"world_r":19,"winner":1,"initial_men":60,
        "reserve_men":12,"casualties":{"1":7,"0":11},"shots":25,"impacts":9,"steps":150,
        "retreats":[{"army":3}],"city_capture":{"ok":true},
        "siege":{"breaches":2,"ram_hits":6}}
    var report_fixture: Dictionary = {"pending_battles":[],"individual_battle":{},
        "battle_log":[brief_done],"individual_battles_finished":1,
        "battles_queued_total":3,"battles_queue_expired":1}
    var final_brief: String = BattleBrief.report(report_fixture)
    _check(results,"v52-report-shows-real-winner-location-and-men",
        final_brief.contains("(44,19)") and final_brief.contains("Riik 1") and final_brief.contains("60 meest") and final_brief.contains("12"))
    _check(results,"v52-report-shows-casualties-shots-and-retreat",
        final_brief.contains("R0: 11") and final_brief.contains("R1: 7") and final_brief.contains("Laske: 25") and final_brief.contains("Taganemised: 1"))
    _check(results,"v52-report-displays-wall-breaches-and-real-capture",
        final_brief.contains("Müüri läbimurdeid: 2") and final_brief.contains("vallutatud: jah"))
    _check(results,"v52-report-empty-fronts-safe-and-finished-only",
        BattleBrief.fronts(report_fixture).is_empty() and final_brief.contains("Praegu pole aktiivseid ega ootel lahinguid."))
    _check(results,"v52-battle-report-does-not-mutate-simulation-state",
        report_fixture["battle_log"].size()==1 and int(report_fixture["battles_queued_total"])==3 and int(report_fixture["battle_log"][0]["winner"])==1)
    var report_json = JSON.parse_string(JSON.stringify(report_fixture))
    _check(results,"v52-last-report-survives-save-format-roundtrip",
        report_json is Dictionary and BattleBrief.report(report_json).contains("Langenuid: R0: 11, R1: 7"))
    _check(results,"v52-old-log-without-modern-fields-prints-safely",
        BattleBrief.report({"battle_log":[{"winner":-1}]}).contains("Sõdurikaotuste täpne arv puudub."))
    # Dev131: civilian technology now has real local industrial recipes
    # instead of stalling on the Modern Age's steel/machines era gate.
    var civil_manifest: Array = [
        {"id":0,"team":0,"c":40,"r":40,"name":"Toostuslinn"},
        {"id":1,"team":1,"c":80,"r":40,"name":"Naaber"}]
    var civil_state: Dictionary = Preview.initialize(civil_manifest)
    var civil_city: Dictionary = civil_state["cities"][0]
    var civil_stock: Dictionary = civil_city["resources"]
    civil_stock["plank"] = 150.0
    civil_stock["stone"] = 140.0
    civil_stock["iron"] = 100.0
    civil_stock["coal"] = 100.0
    civil_stock["bread"] = 200.0
    civil_stock["water"] = 200.0
    civil_city["age"] = 5
    civil_state["teams"][0]["age"] = 5
    civil_city["buildings"].append_array([
        {"type":"smelter","ready":true,"hp":350.0},
        {"type":"smith","ready":true,"hp":350.0}])
    var locked_factory_stock: Dictionary = civil_stock.duplicate(true)
    var locked_factory: Dictionary = Preview.build_in_town(civil_state,0,"steelworks")
    _check(results,"v53-steelworks-locked-until-real-science",
        not bool(locked_factory.get("ok",false)) and civil_stock==locked_factory_stock)
    civil_state["teams"][0]["known"]["steelmaking"] = true
    civil_state["teams"][0]["known"]["steam_engine"] = true
    var factory_built: Dictionary = Preview.build_in_town(civil_state,0,"steelworks")
    _check(results,"v53-steelworks-pays-real-iron-plank-and-stone",
        bool(factory_built.get("ok",false)) and is_equal_approx(float(civil_stock["plank"]),115.0) and is_equal_approx(float(civil_stock["iron"]),82.0) and is_equal_approx(float(civil_stock["stone"]),120.0))
    var steelworks: Dictionary = civil_city["buildings"][-1]
    _check(results,"v53-factory-not-instantly-ready-and-is-on-real-plot",
        not bool(steelworks["ready"]) and steelworks.has("site_x") and CityLayout.check_clear(civil_city))
    var no_machines_without_steel: Dictionary = Preview.build_in_town(civil_state,0,"machine_shop")
    _check(results,"v53-no-free-machine-shop-before-steel-production",
        not bool(no_machines_without_steel.get("ok",false)) and not civil_city["buildings"][-1].get("type","")=="machine_shop")
    steelworks["ready"] = true
    steelworks["efficiency"] = 1.0
    var steel_cycle: int = Production.run_cycle(civil_city,steelworks,63.0)
    _check(results,"v53-steel-melts-with-real-coal-and-iron-inputs",
        steel_cycle==1 and is_equal_approx(float(civil_stock["steel"]),3.0) and is_equal_approx(float(civil_stock["iron"]),79.0) and is_equal_approx(float(civil_stock["coal"]),98.0))
    var steel_batch: int = Production.run_cycle(civil_city,steelworks,63.0*19.0)
    _check(results,"v53-steel-production-runs-repeated-paid-cycles",
        steel_batch==19 and is_equal_approx(float(civil_stock["steel"]),60.0) and is_equal_approx(float(civil_stock["iron"]),22.0) and is_equal_approx(float(civil_stock["coal"]),60.0))
    var machines_built: Dictionary = Preview.build_in_town(civil_state,0,"machine_shop")
    var machine_shop: Dictionary = civil_city["buildings"][-1]
    _check(results,"v53-machine-shop-uses-produced-steel-not-cheats",
        bool(machines_built.get("ok",false)) and is_equal_approx(float(civil_stock["steel"]),48.0) and is_equal_approx(float(civil_stock["plank"]),70.0) and machine_shop.get("type","")=="machine_shop")
    machine_shop["ready"] = true
    machine_shop["efficiency"] = 1.0
    var machinery_runs: int = Production.run_cycle(civil_city,machine_shop,81.0*9.0)
    _check(results,"v53-machinery-requires-steel-and-planks-per-cycle",
        machinery_runs==9 and is_equal_approx(float(civil_stock["machines"]),18.0) and is_equal_approx(float(civil_stock["steel"]),30.0) and is_equal_approx(float(civil_stock["plank"]),43.0))
    Production.run_cycle(civil_city,steelworks,63.0*2.0)
    var modern_missing: Dictionary = Era.age_deficit([civil_stock],"modernity")
    _check(results,"v53-real-economy-now-produces-modern-era-resources",
        modern_missing.is_empty() and is_equal_approx(float(civil_stock["steel"]),36.0) and is_equal_approx(float(civil_stock["machines"]),18.0))
    var paid_modern: Dictionary = Era.pay_era_cost([civil_stock],"modernity")
    _check(results,"v53-modern-gate-takes-real-steel-and-machines",
        bool(paid_modern.get("paid",false)) and is_equal_approx(float(civil_stock["steel"]),1.0) and is_equal_approx(float(civil_stock["machines"]),0.5))
    _check(results,"v53-civil-factories-and-materials-survive-json",
        JSON.parse_string(JSON.stringify(civil_city)) is Dictionary and CityLayout.check_clear(civil_city))
    var civil_ai: Dictionary = {"c":50,"r":50,"pop":3,"age":5,
        "resources":Economy.start_resources(),"buildings":[{"type":"hall","ready":true,"hp":1200.0}]}
    civil_ai["resources"]["wood"] = 250.0
    civil_ai["resources"]["plank"] = 250.0
    civil_ai["resources"]["stone"] = 250.0
    civil_ai["resources"]["iron"] = 100.0
    civil_ai["resources"]["coal"] = 100.0
    civil_ai["resources"]["steel"] = 0.0
    civil_ai["resources"]["bread"] = 250.0
    civil_ai["resources"]["water"] = 250.0
    for kind in PreviewAI.BUILD_ORDER:
        if kind in ["steelworks","machine_shop"]:
            continue
        civil_ai["buildings"].append({"type":kind,"ready":true,"hp":350.0})
    _check(results,"v53-civil-ai-prioritizes-next-unbuilt-steelworks",
        PreviewAI.choose_building(civil_ai,{"steelmaking":true,"steam_engine":true},0)=="steelworks")
    civil_ai["buildings"].append({"type":"steelworks","ready":true,"hp":350.0})
    civil_ai["resources"]["steel"] = 20.0
    _check(results,"v53-civil-ai-can-choose-working-machine-factory",
        PreviewAI.choose_building(civil_ai,{"steelmaking":true,"steam_engine":true},0)=="machine_shop")
    var big_food_city: Dictionary = {"c":40,"r":42,"pop":80,"age":3,
        "resources":Economy.start_resources(),
        "buildings":[{"type":"hall","ready":true,"hp":1200.0},{"type":"lumber","ready":true,"hp":350.0},{"type":"quarry","ready":true,"hp":350.0}]}
    big_food_city["resources"]["wood"] = 220.0
    big_food_city["resources"]["plank"] = 220.0
    big_food_city["resources"]["stone"] = 220.0
    big_food_city["resources"]["bread"] = 0.0
    for ix in range(2):
        big_food_city["buildings"].append({"type":"hunter","ready":true,"hp":350.0})
    _check(results,"v53-large-city-does-not-cap-hunters-at-two",
        PreviewAI.choose_building(big_food_city,{"hunting":true,"agriculture":true,"water":true},0)=="hunter")
    var big_water_city: Dictionary = {"c":41,"r":43,"pop":80,"age":3,
        "resources":Economy.start_resources(),
        "buildings":[{"type":"hall","ready":true,"hp":1200.0},{"type":"quarry","ready":true,"hp":350.0},
            {"type":"hunter","ready":true,"hp":350.0},{"type":"hunter","ready":true,"hp":350.0},
            {"type":"hunter","ready":true,"hp":350.0},{"type":"hunter","ready":true,"hp":350.0},
            {"type":"well","ready":true,"hp":350.0},{"type":"well","ready":true,"hp":350.0}]}
    big_water_city["resources"]["bread"] = 250.0
    big_water_city["resources"]["water"] = 0.0
    big_water_city["resources"]["wood"] = 250.0
    big_water_city["resources"]["stone"] = 250.0
    _check(results,"v53-large-city-builds-more-than-two-real-wells",
        PreviewAI.choose_building(big_water_city,{"hunting":true,"water":true},0)=="well")
    var city_housing_target: int = CityPlanning.housing_target(80)
    _check(results,"v53-80-resident-city-requires-real-houses",
        city_housing_target>=26)

    var short_civil: Dictionary = Preview.initialize(civil_manifest)
    var short_start: Dictionary = CampaignPlay.begin(short_civil,0)
    _check(results,"v53-original-bronze-campaign-kept-unmodified",
        bool(short_start["ok"]) and str(short_civil["campaign"]["mode"])=="stone_to_bronze" and int(short_civil["campaign"]["turn_limit"])==90 and int(short_civil["campaign"]["goal_age"])==1)
    var long_civil: Dictionary = Preview.initialize(civil_manifest)
    var long_start: Dictionary = CampaignPlay.begin(long_civil,0,true)
    _check(results,"v53-long-civil-campaign-is-separate-opt-in-mode",
        bool(long_start["ok"]) and str(long_civil["campaign"]["mode"])=="stone_to_modern" and int(long_civil["campaign"]["turn_limit"])==600 and int(long_civil["campaign"]["goal_age"])==6)
    long_civil["teams"][0]["age"] = 1
    long_civil["cities"][0]["pop"] = 40
    _check(results,"v53-reaching-bronze-does-not-end-long-campaign",
        str(CampaignPlay.evaluate(long_civil)["result"])=="playing")
    long_civil["campaign"]["turn"] = 91
    _check(results,"v53-long-game-does-not-stop-at-old-90-turn-limit",
        str(CampaignPlay.evaluate(long_civil)["result"])=="playing")
    long_civil["teams"][0]["age"] = 6
    long_civil["cities"][0]["pop"] = 100
    _check(results,"v53-modern-goal-achieved-with-real-population",
        str(CampaignPlay.evaluate(long_civil)["result"])=="won")
    _check(results,"v53-long-campaign-status-shows-modern-goal",
        CampaignPlay.text_status(long_civil).contains("ajastu 6") and CampaignPlay.text_status(long_civil).contains("600"))
    var saved_long: bool = Preview.save_preview(long_civil,"user://v53_long_civilization.json")
    var loaded_long: Dictionary = Preview.load_preview(civil_manifest,"user://v53_long_civilization.json")
    _check(results,"v53-long-campaign-mode-and-goal-survive-save-load",
        saved_long and str(loaded_long.get("campaign",{}).get("mode",""))=="stone_to_modern" and int(loaded_long["campaign"]["goal_age"])==6)
    if FileAccess.file_exists("user://v53_long_civilization.json"):
        DirAccess.remove_absolute(ProjectSettings.globalize_path("user://v53_long_civilization.json"))
    # V4.3 physical founders: no instant teleportation / no double charging.
    var journey_state: Dictionary = Preview.initialize([
        {"id":0,"c":20,"r":20,"team":0,"name":"Teekonna kodu"},
        {"id":1,"c":80,"r":60,"team":1,"name":"Teekonna rivaal"}])
    Territory.rebuild(journey_state,founding_map,true)
    var journey_parent: Dictionary = journey_state["cities"][0]
    journey_parent["pop"] = 9
    journey_parent["resources"]["wood"] = 75.0
    journey_parent["resources"]["stone"] = 25.0
    journey_parent["resources"]["bread"] = 50.0
    journey_parent["resources"]["water"] = 30.0
    journey_state["teams"][0]["known"]["settlement"] = true
    var trip: Dictionary = SettlerCampaign.dispatch(journey_state,founding_map,0,Vector2i(40,20))
    _check(results,"v43-dispatch-valid-land-route",bool(trip.get("ok",false)) and SettlerCampaign.missions(journey_state).size()==1)
    _check(results,"v43-dispatch-does-not-create-city",journey_state["cities"].size()==2)
    _check(results,"v43-dispatch-reserves-cost-and-population",int(journey_parent["pop"])==6 and is_equal_approx(float(journey_parent["resources"]["wood"]),20.0))
    _check(results,"v43-duplicate-destination-rejected",not bool(SettlerCampaign.dispatch(journey_state,founding_map,0,Vector2i(40,20)).get("ok",false)))
    var first_step: Dictionary = SettlerCampaign.advance_turn(journey_state,founding_map)
    _check(results,"v43-travels-three-cells-per-turn",int(first_step["moved"])==3 and int(journey_state["settler_missions"][0]["c"])==23)
    _check(results,"v43-no-early-city-teleport",int(first_step["founded"])==0 and journey_state["cities"].size()==2)
    var journey_saved: bool = Preview.save_preview(journey_state,"user://v43_trip_regression.json")
    var journey_loaded: Dictionary = Preview.load_preview([
        {"id":0,"c":20,"r":20,"team":0,"name":"Teekonna kodu"},
        {"id":1,"c":80,"r":60,"team":1,"name":"Teekonna rivaal"}],"user://v43_trip_regression.json")
    _check(results,"v43-pending-founder-survives-json",journey_saved and SettlerCampaign.missions(journey_loaded).size()==1 and int(journey_loaded["settler_missions"][0]["waypoint"])==3)
    if FileAccess.file_exists("user://v43_trip_regression.json"):
        DirAccess.remove_absolute(ProjectSettings.globalize_path("user://v43_trip_regression.json"))
    var final_arrival: Dictionary = {}
    # The first step already covered three of twenty tiles: six more turns
    # bring the actual arrival. A seventh turn is *after* settlement.
    for journey_turn in range(6):
        final_arrival = SettlerCampaign.advance_turn(journey_loaded,founding_map)
    _check(results,"v43-arrives-and-founds-after-seven-turns",int(final_arrival.get("founded",0))==1 and journey_loaded["cities"].size()==3)
    _check(results,"v43-no-pending-after-arrival",SettlerCampaign.missions(journey_loaded).is_empty() and int(journey_loaded.get("founded_cities",0))==1)
    _check(results,"v43-arrival-does-not-charge-twice",is_equal_approx(float(journey_loaded["cities"][0]["resources"]["wood"]),20.0))
    _check(results,"v43-arrival-has-founding-route",int(journey_loaded["founding_log"][0]["route_length"])==20)
    var cancelled_state: Dictionary = Preview.initialize([
        {"id":0,"c":20,"r":20,"team":0,"name":"Katkestuse kodu"}])
    Territory.rebuild(cancelled_state,founding_map,true)
    cancelled_state["teams"][0]["known"]["settlement"] = true
    cancelled_state["cities"][0]["pop"] = 9
    cancelled_state["cities"][0]["resources"]["wood"] = 75.0
    cancelled_state["cities"][0]["resources"]["stone"] = 25.0
    cancelled_state["cities"][0]["resources"]["bread"] = 50.0
    cancelled_state["cities"][0]["resources"]["water"] = 30.0
    var cancellation: Dictionary = SettlerCampaign.dispatch(cancelled_state,founding_map,0,Vector2i(40,20))
    var blocked_map: PackedByteArray = founding_map.duplicate()
    blocked_map[Campaign.index(21,20)] = 0
    var interrupted: Dictionary = SettlerCampaign.advance_turn(cancelled_state,blocked_map)
    _check(results,"v43-interrupted-route-cancels",bool(cancellation.get("ok",false)) and int(interrupted.get("cancelled",0))==1)
    _check(results,"v43-interrupted-route-returns-population",int(cancelled_state["cities"][0]["pop"])==9)
    _check(results,"v43-interrupted-route-refunds-wood",is_equal_approx(float(cancelled_state["cities"][0]["resources"]["wood"]),75.0))
    var ai_state: Dictionary = Preview.initialize([
        {"id":0,"c":20,"r":20,"team":0,"name":"Mängija"},
        {"id":1,"c":62,"r":30,"team":1,"name":"AI1"},
        {"id":2,"c":112,"r":45,"team":2,"name":"AI2"},
        {"id":3,"c":162,"r":60,"team":3,"name":"AI3"}])
    Territory.rebuild(ai_state,founding_map,true)
    ai_state["campaign"] = {"active":true,"player_team":0,"turn":8,"result":"playing"}
    for ai_team in range(1,4):
        var ai_city: Dictionary = ai_state["cities"][ai_team]
        ai_city["pop"] = 9
        ai_city["resources"]["wood"] = 180.0
        ai_city["resources"]["stone"] = 80.0
        ai_city["resources"]["bread"] = 100.0
        ai_city["resources"]["water"] = 75.0
        ai_state["teams"][ai_team]["known"]["settlement"] = true
    var ai_orders: Dictionary = SettlerCampaign.ai_expand(ai_state,founding_map)
    _check(results,"v43-ai-orders-independent-settlers",int(ai_orders.get("started",0))==3)
    _check(results,"v43-ai-does-not-found-instantly",ai_state["cities"].size()==4 and ai_state.get("settler_missions",[]).size()==3)
    _check(results,"v43-ai-does-not-repeat-orders-same-turn",int(SettlerCampaign.ai_expand(ai_state,founding_map).get("started",0))==0)
    _check(results,"v43-ai-sends-from-all-three-factions",int(ai_state.get("ai_settlers_sent",0))==3)
    # V4.1 playable early campaign: original economic engine remains authoritative.
    var campaign_cities: Array = [
        {"id":0,"team":0,"c":20,"r":20,"name":"Alguslinn"},
        {"id":1,"team":1,"c":45,"r":20,"name":"Vastane 1"},
        {"id":2,"team":2,"c":70,"r":20,"name":"Vastane 2"},
        {"id":3,"team":3,"c":95,"r":20,"name":"Vastane 3"}]
    var campaign_state: Dictionary = Preview.initialize(campaign_cities)
    _check(results,"v41-campaign-refuses-unknown-faction",not bool(CampaignPlay.begin(campaign_state,5).get("ok",false)))
    var began: Dictionary = CampaignPlay.begin(campaign_state)
    _check(results,"v41-campaign-start",bool(began.get("ok",false)) and CampaignPlay.is_running(campaign_state))
    _check(results,"v41-campaign-ai-enabled",bool(campaign_state["ai_enabled"]))
    _check(results,"v41-player-owns-city",CampaignPlay.owns_city(campaign_state,0))
    _check(results,"v41-opponent-city-not-controlled",not CampaignPlay.owns_city(campaign_state,1))
    _check(results,"v41-player-next-city",CampaignPlay.own_city_index(campaign_state,-1)==0)
    _check(results,"v41-player-only-one-city",CampaignPlay.own_city_index(campaign_state,0)==0)
    _check(results,"v41-starts-stone-age",int(CampaignPlay.team_stats(campaign_state,0)["age"])==0)
    var turn_baseline: float = float(campaign_state["seconds"])
    Preview.tick(campaign_state,CampaignPlay.GAME_SECONDS_PER_TURN)
    var first_turn: Dictionary = CampaignPlay.finish_turn(campaign_state)
    _check(results,"v41-first-turn-persisted",bool(first_turn.get("ok",false)) and int(campaign_state["campaign"]["turn"])==1)
    _check(results,"v41-turn-clock-correct",is_equal_approx(float(campaign_state["seconds"])-turn_baseline,60.0))
    _check(results,"v41-ai-started-research",int(campaign_state.get("ai_research_orders",0))>0)
    _check(results,"v41-turn-history",campaign_state["campaign"]["history"].size()==1)
    var player_score: Dictionary = CampaignPlay.team_stats(campaign_state,0)
    _check(results,"v41-score-has-own-town",int(player_score["cities"])==1 and int(player_score["population"])>=1)
    _check(results,"v41-score-four-factions",CampaignPlay.standings(campaign_state).size()==4)
    _check(results,"v41-campaign-info-shows-turn",CampaignPlay.text_status(campaign_state).contains("KÄIK 1"))
    var campaign_save_ok: bool = Preview.save_preview(campaign_state,"user://v41_campaign_regression.json")
    var campaign_load: Dictionary = Preview.load_preview(campaign_cities,"user://v41_campaign_regression.json")
    _check(results,"v41-save-load-campaign",campaign_save_ok and CampaignPlay.is_active(campaign_load) and int(campaign_load["campaign"]["turn"])==1)
    if FileAccess.file_exists("user://v41_campaign_regression.json"):
        DirAccess.remove_absolute(ProjectSettings.globalize_path("user://v41_campaign_regression.json"))
    # Twelve subsequent real engine turns: catch stalled AI or broken clock
    # accumulation rather than accepting only a one-turn menu smoke test.
    for _cycle in range(12):
        if not CampaignPlay.is_running(campaign_state):
            break
        Preview.tick(campaign_state,CampaignPlay.GAME_SECONDS_PER_TURN)
        CampaignPlay.finish_turn(campaign_state)
    _check(results,"v41-thirteen-campaign-turns",int(campaign_state["campaign"]["turn"])==13)
    _check(results,"v41-thirteen-turns-simulated",is_equal_approx(float(campaign_state["seconds"]),13.0*60.0))
    _check(results,"v41-thirteen-turns-real-ai-orders",int(campaign_state.get("ai_research_orders",0)) >= 3)
    _check(results,"v41-economy-across-twelve-turns",int(campaign_state.get("economic_ticks",0))>=48)
    _check(results,"v41-long-run-history",campaign_state["campaign"]["history"].size()==13)
    print("V41_CAMPAIGN_LONGRUN: turns=",campaign_state["campaign"]["turn"]," economic_minutes=",campaign_state.get("economic_ticks",0)," ai_research_orders=",campaign_state.get("ai_research_orders",0)," ai_builds=",campaign_state.get("ai_build_orders",0)," populations=",CampaignPlay.standings(campaign_state))
    var victorious: Dictionary = Preview.initialize(campaign_cities)
    CampaignPlay.begin(victorious)
    victorious["teams"][0]["age"] = 1
    victorious["cities"][0]["pop"] = 23
    _check(results,"v41-win-goal-requires-era-and-pop",str(CampaignPlay.evaluate(victorious)["result"])=="won")
    _check(results,"v41-after-win-no-extra-turns",not bool(CampaignPlay.finish_turn(victorious).get("ok",false)))
    var defeated: Dictionary = Preview.initialize(campaign_cities)
    CampaignPlay.begin(defeated)
    defeated["cities"][0]["team"] = 1
    _check(results,"v41-no-cities-loses",str(CampaignPlay.evaluate(defeated)["result"])=="lost")
    var overtime: Dictionary = Preview.initialize(campaign_cities)
    CampaignPlay.begin(overtime)
    overtime["campaign"]["turn"] = CampaignPlay.TURN_LIMIT
    _check(results,"v41-turn-limit-loses",str(CampaignPlay.evaluate(overtime)["result"])=="lost")
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
    var layout_street_path: Array = street_fixture.route(lot_fixture,0,2)
    _check(results,"v21-layout-road-finds-market",not layout_street_path.is_empty())
    _check(results,"v21-layout-road-not-through-buildings",street_fixture.path_points_are_clear(lot_fixture,layout_street_path))
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

    # V3.6: towns grow actual houses and reserve denser civic/housing blocks.
    _check(results,"v36-house-target-no-five-cap",CityPlanning.housing_target(40)>5)
    _check(results,"v36-house-target-small-town",CityPlanning.housing_target(3)==1)
    _check(results,"v36-civic-zoning",CityPlanning.zone("market")=="civic")
    _check(results,"v36-home-zoning",CityPlanning.zone("house")=="housing")
    _check(results,"v36-farm-on-rural-zoning",CityPlanning.zone("farm")=="rural")
    _check(results,"v36-workshops-zoning",CityPlanning.zone("smelter")=="industry")
    var planned_housing_city: Dictionary = {"c":70,"r":70,"pop":40,"age":1,
        "resources":Economy.start_resources(),
        "buildings":[{"type":"hall","ready":true,"hp":1200.0},{"type":"saw","ready":true,"hp":350.0}]}
    planned_housing_city["resources"]["bread"] = 180.0
    planned_housing_city["resources"]["water"] = 180.0
    planned_housing_city["resources"]["plank"] = 90.0
    planned_housing_city["resources"]["stone"] = 90.0
    _check(results,"v36-ai-expands-housing-when-full",PreviewAI.choose_building(planned_housing_city,{"stone_tools":true},0)=="house")
    var young_city: Dictionary = {"age":0,"pop":18,"c":30,"r":30,"resources":Economy.start_resources(),
        "buildings":[{"type":"hall","ready":true,"hp":1200.0}]}
    var young_before: float = float(young_city["resources"]["wood"])
    _check(results,"v36-no-stone-age-palisades",not bool(CityFortifications.build_next(young_city).get("ok",false)))
    _check(results,"v36-reject-without-resource-charge",is_equal_approx(float(young_city["resources"]["wood"]),young_before))
    var castle_city: Dictionary = {"c":44,"r":45,"age":1,"pop":18,
        "resources":{"wood":100.0,"stone":40.0},
        "territory_urban":[[44,45],[45,45]],
        "buildings":[
            {"type":"hall","ready":true,"hp":1200.0,"site_x":44.5,"site_z":45.5},
            {"type":"house","ready":true,"hp":350.0,"site_x":44.5+CityLayout.TILE_PITCH_X+2.0,"site_z":45.5+2.0}]}
    var first_wall: Dictionary = CityFortifications.build_next(castle_city)
    _check(results,"v36-paid-first-palisade",bool(first_wall.get("ok",false)) and CityFortifications.fortified(castle_city,Vector2i(44,45)))
    _check(results,"v36-palisade-spends-stone-and-wood",is_equal_approx(float(castle_city["resources"]["wood"]),35.0) and is_equal_approx(float(castle_city["resources"]["stone"]),20.0))
    var second_wall: Dictionary = CityFortifications.build_next(castle_city)
    _check(results,"v36-paid-neighbor-wall",bool(second_wall.get("ok",false)) and CityFortifications.fortified(castle_city,Vector2i(45,45)))
    _check(results,"v36-neighbor-tile-charges-again",is_equal_approx(float(castle_city["resources"]["wood"]),0.0) and is_equal_approx(float(castle_city["resources"]["stone"]),8.0))
    _check(results,"v36-no-duplicate-wall-cost",not bool(CityFortifications.build_next(castle_city).get("ok",false)))
    _check(results,"v36-saved-wall-json",JSON.parse_string(JSON.stringify(castle_city["fortification"])) is Dictionary)
    # V3.9 persistent build version, reliable offline status, update detection.
    _check(results,"v40-landscape-screen-config",int(ProjectSettings.get_setting("display/window/handheld/orientation",4))==4)
    _check(results,"v39-version-valid-tag",BuildVersion.release_number("godot-dev-70")==70)
    _check(results,"v39-version-rejects-garbage",BuildVersion.release_number("Godot 1.8")==-1)
    _check(results,"v39-version-rejects-non-number",BuildVersion.release_number("godot-dev-x")==-1)
    _check(results,"v39-version-older-is-update",BuildVersion.compare_tags("godot-dev-69","godot-dev-70")==-1)
    _check(results,"v39-version-equal",BuildVersion.compare_tags("godot-dev-70","godot-dev-70")==0)
    _check(results,"v39-version-newer-is-current",BuildVersion.compare_tags("godot-dev-71","godot-dev-70")==1)
    var version_current: Dictionary = BuildVersion.status_for("godot-dev-70",{"checked":true,"tag":"godot-dev-70","checked_at":100})
    var version_old: Dictionary = BuildVersion.status_for("godot-dev-69",{"checked":true,"tag":"godot-dev-70","checked_at":100})
    var version_offline: Dictionary = BuildVersion.status_for("godot-dev-70",{"checked":false,"tag":"godot-dev-70"})
    _check(results,"v39-current-not-update",not bool(version_current["update"]) and bool(version_current["verified"]))
    _check(results,"v39-old-release-update-visible",bool(version_old["update"]) and str(version_old["latest"])=="godot-dev-70")
    _check(results,"v39-no-unsupported-offline-latest-claim",not bool(version_offline["verified"]) and str(version_offline["latest"])=="")
    _check(results,"v39-ui-shows-installed-number",BuildVersion.hud_text(version_old).contains("godot-dev-69"))
    _check(results,"v39-ui-shows-update-warning",BuildVersion.hud_text(version_old).contains("UUENDUS"))
    _check(results,"v39-ui-shows-verified-status",BuildVersion.hud_text(version_current).contains("UUSIM"))
    _check(results,"v39-offline-ui-does-not-say-latest",not BuildVersion.hud_text(version_offline).contains("UUSIM"))
    _check(results,"v39-buildfile-in-project",BuildVersion.snapshot().has("tag"))
    _check(results,"v39-releases-picks-highest-not-first",BuildVersion.latest_from_releases([
        {"tag_name":"godot-dev-62","draft":false},
        {"tag_name":"godot-dev-71","draft":false},
        {"tag_name":"godot-dev-99","draft":true},
        {"tag_name":"web-v153","draft":false}])=="godot-dev-71")
    _check(results,"v39-release-list-empty-is-unknown",BuildVersion.latest_from_releases([])=="")
    _check(results,"v39-release-invalid-payload-safe",BuildVersion.latest_from_releases({})=="")
    # V3.8: a shared two-district boundary has no wall on its internal seam.
    _check(results,"v38-two-adjacent-tiles-six-outside-edges",CityFortifications.perimeter_edges(castle_city).size()==6)
    _check(results,"v38-west-tile-no-east-wall",not CityFortifications.exposed_sides(castle_city,Vector2i(44,45)).has("east"))
    _check(results,"v38-east-tile-no-west-wall",not CityFortifications.exposed_sides(castle_city,Vector2i(45,45)).has("west"))
    _check(results,"v38-no-duplicate-tower-at-internal-joint",not CityFortifications.exposed_corner(castle_city,Vector2i(44,45),1,-1))
    _check(results,"v38-outermost-corner-towers",CityFortifications.exposed_corner(castle_city,Vector2i(44,45),-1,-1) and CityFortifications.exposed_corner(castle_city,Vector2i(45,45),1,-1))
    var border_fort: Dictionary = castle_city.duplicate(true)
    border_fort["team"] = 1
    var eastern_siege: Dictionary = Siege.from_city(border_fort,Vector2i(45,45),0,1)
    _check(results,"v38-adjoining-wall-not-collision",Siege.ground_open(eastern_siege,10.0,0.0,.34))
    _check(results,"v38-district-battle-records-home",int(eastern_siege.get("city_home_c",-1))==44 and int(eastern_siege.get("city_c",-1))==45)
    var conquest_state: Dictionary = Preview.initialize([{"id":77,"name":"Piirilinn","team":1,"c":44,"r":45}])
    conquest_state["cities"][0]["fortification"] = border_fort["fortification"].duplicate(true)
    conquest_state["cities"][0]["team"] = 1
    conquest_state["cities"][0]["training"] = [{"kind":"bronze_archer"}]
    var no_conquest: Dictionary = CityCapture.capture_after_siege(conquest_state,{"captured":true,"attacker_team":0,"defender_team":1})
    _check(results,"v38-fixture-cannot-transfer-city",not bool(no_conquest.get("ok",false)) and int(conquest_state["cities"][0]["team"])==1)
    var not_yet: Dictionary = CityCapture.capture_after_siege(conquest_state,eastern_siege)
    _check(results,"v38-no-capture-before-occupation",not bool(not_yet.get("ok",false)))
    eastern_siege["captured"] = true
    var taken: Dictionary = CityCapture.capture_after_siege(conquest_state,eastern_siege)
    _check(results,"v38-captured-district-converts-owner",bool(taken.get("ok",false)) and int(conquest_state["cities"][0]["team"])==0)
    _check(results,"v38-capture-preserves-buildings",conquest_state["cities"][0]["buildings"].size()==1)
    _check(results,"v38-capture-preserves-walls",CityFortifications.fortified(conquest_state["cities"][0],Vector2i(45,45)))
    _check(results,"v38-capture-clears-previous-training",conquest_state["cities"][0]["training"].is_empty())
    _check(results,"v38-capture-invalidates-territory",String(conquest_state.get("territory_source","x"))=="")
    _check(results,"v38-capture-logged-once",int(conquest_state.get("city_captures",0))==1 and conquest_state["conquests"].size()==1)
    var duplicate_capture: Dictionary = CityCapture.capture_after_siege(conquest_state,eastern_siege)
    _check(results,"v38-no-double-capture",not bool(duplicate_capture.get("ok",false)) and int(conquest_state.get("city_captures",0))==1)
    # V3.7: built city walls become live siege sections, not a temporary fixture.
    var saved_castle: Dictionary = castle_city.duplicate(true)
    var tower_cell := Vector2i(44,45)
    var mapped_wall: Dictionary = Siege.from_city(saved_castle,tower_cell,0,1)
    # Assign a defending team for the synthetic siege scenario.
    saved_castle["team"] = 1
    mapped_wall = Siege.from_city(saved_castle,tower_cell,0,1)
    _check(results,"v37-unfortified-tile-no-siege",Siege.from_city(saved_castle,Vector2i(43,45),0,1).is_empty())
    _check(results,"v37-fortified-tile-builds-siege",not mapped_wall.is_empty() and bool(mapped_wall.get("linked_city",false)))
    _check(results,"v37-shared-perimeter-has-two-west-corner-towers",Siege.tower_nodes(mapped_wall).size()==2)
    _check(results,"v37-siege-uses-wooden-wall",String(mapped_wall["sections"][0]["type"])=="palisade")
    _check(results,"v37-siege-gate-blocks-entry",not Siege.ground_open(mapped_wall,10.0,0.0,.34))
    _check(results,"v37-no-same-side-attack",Siege.from_city(saved_castle,tower_cell,1,1).is_empty())
    _check(results,"v37-open-gate-persisted",CityFortifications.set_gate(saved_castle,tower_cell,true) and CityFortifications.gate_is_open(saved_castle,tower_cell))
    var opened_wall: Dictionary = Siege.from_city(saved_castle,tower_cell,0,1)
    _check(results,"v37-open-gate-crossable",Siege.ground_open(opened_wall,10.0,0.0,.34))
    _check(results,"v37-open-gate-does-not-block-arrows",not Siege.shot_blocked(opened_wall,{"x":-15.0,"z":0.0},{"x":18.0,"z":0.0}))
    _check(results,"v37-close-intact-gate",CityFortifications.set_gate(saved_castle,tower_cell,false))
    var gate_damage: float = Siege.damage_structure(mapped_wall,4,"battering_ram",130.0)
    _check(results,"v37-ram-breaches-wooden-gate",gate_damage>0.0 and bool(mapped_wall["gate_open"]))
    _check(results,"v37-persist-structural-damage",CityFortifications.apply_siege_damage(saved_castle,mapped_wall))
    _check(results,"v37-damaged-gate-remains-open",CityFortifications.gate_is_open(saved_castle,tower_cell) and not CityFortifications.set_gate(saved_castle,tower_cell,false))
    var rebuilt_wall: Dictionary = Siege.from_city(saved_castle,tower_cell,0,1)
    _check(results,"v37-destroyed-gate-does-not-heal",float(rebuilt_wall["sections"][4]["hp"])<=0.0 and Siege.ground_open(rebuilt_wall,10.0,0.0,.34))
    _check(results,"v37-wall-hp-survives-json",JSON.parse_string(JSON.stringify(saved_castle["fortification"])) is Dictionary)
    var linked_state: Dictionary = Preview.initialize([{"team":0,"c":44,"r":45},{"team":1,"c":44,"r":45}])
    linked_state["cities"][1]["fortification"] = saved_castle["fortification"].duplicate(true)
    var linked_attacker: Dictionary = Military.create_army(linked_state,0,44,45)
    var linked_defender: Dictionary = Military.create_army(linked_state,1,44,45)
    Military.add_unit(linked_state,linked_attacker,"spearman")
    Military.add_unit(linked_state,linked_defender,"bronze_archer")
    var automatic_siege: Dictionary = IndividualBattle.start(linked_state,int(linked_attacker["id"]),int(linked_defender["id"]))
    _check(results,"v37-armies-trigger-paid-city-siege",bool(automatic_siege.get("ok",false)) and bool(linked_state["individual_battle"].get("linked_city_siege",false)))
    _check(results,"v37-real-shared-perimeter-guards",int(linked_state["individual_battle"].get("siege",{}).get("guard_count",0))==10)
    _check(results,"v37-native-battle-json-roundtrip",JSON.parse_string(JSON.stringify(linked_state["individual_battle"]["siege"])) is Dictionary)
    var solo_city: Dictionary = border_fort.duplicate(true)
    solo_city["fortification"]["tiles"] = [[44,45]]
    var solo_siege: Dictionary = Siege.from_city(solo_city,Vector2i(44,45),0,1)
    _check(results,"v38-solo-palisade-still-four-towers",Siege.tower_nodes(solo_siege).size()==4)
    # Run through the actual finished-battle state update, rather than just
    # calling the pure city-capture helper.
    linked_state["individual_battle"]["siege"]["captured"] = true
    _check(results,"v38-debug-battle-siege-captured",bool(linked_state["individual_battle"]["siege"].get("captured",false)))
    IndividualBattle.tick(linked_state,0.12)
    _check(results,"v38-debug-battle-stopped",linked_state["individual_battle"].is_empty())
    var conquest_debug: Dictionary = linked_state["battle_log"][-1].get("city_capture",{}) if not linked_state["battle_log"].is_empty() else {}
    _check(results,"v38-capture-result-"+str(conquest_debug.get("reason",conquest_debug.get("ok","empty"))),bool(conquest_debug.get("ok",false)))
    _check(results,"v38-debug-city-owner-updated",int(linked_state["cities"][1]["team"])==0)
    _check(results,"v38-debug-city-capture-count",int(linked_state.get("city_captures",0))==1)
    _check(results,"v38-debug-battle-log-exists",not linked_state["battle_log"].is_empty())
    _check(results,"v38-actual-battle-finish-changes-flag",linked_state["individual_battle"].is_empty() and int(linked_state["cities"][1]["team"])==0)
    _check(results,"v38-actual-conquest-logged",int(linked_state.get("city_captures",0))==1 and not linked_state["battle_log"].is_empty())
    # V3.5: core-first building placement extends only into owned urban cells.
    var extended_city: Dictionary = {"c":110,"r":80,"pop":36,"buildings":[
        {"type":"hall","ready":true,"hp":1200.0,"site_x":110.5,"site_z":80.5}],
        "territory_urban":[[110,80],[111,80]]}
    var blocked_core: Array = []
    for rz in range(-7,8):
        for rx in range(-7,8):
            blocked_core.append({"point":Vector2(float(rx)*1.6,float(rz)*1.6),"kind":"market"})
    var outer_site: Dictionary = CityLayout.find_free_site(extended_city,"house",blocked_core)
    _check(results,"v35-next-city-tile-offered",bool(outer_site.get("ok",false)))
    if bool(outer_site.get("ok",false)):
        var saved_outer: Vector2 = CityLayout.center(extended_city)+outer_site["point"]
        _check(results,"v35-new-house-on-east-urban-tile",CityLayout.site_tile(extended_city,saved_outer)==Vector2i(111,80))
        _check(results,"v35-world-projection-east-next-tile",floori(CityLayout.site_on_atlas(extended_city,saved_outer).x)==111)
        _check(results,"v35-outer-site-inside-plot",CityLayout.within_lot(CityLayout.site_in_tile(extended_city,saved_outer,Vector2i(111,80)),"house"))
        extended_city["buildings"].append({"type":"house","hp":350.0,"ready":true,"site_x":saved_outer.x,"site_z":saved_outer.y})
        _check(results,"v35-legacy-core-and-new-house-no-overlap",CityLayout.check_clear(extended_city))
        _check(results,"v35-new-house-save-roundtrip",JSON.parse_string(JSON.stringify(extended_city["buildings"])) is Array)
        var intertile_streets = StreetNav.new()
        var intertile_route: Array = intertile_streets.route(extended_city,0,1)
        _check(results,"v35-worker-path-reaches-new-district",intertile_route.size()>30)
        _check(results,"v35-worker-route-ends-at-building-door",not intertile_route.is_empty() and Vector2(float(intertile_route[-1][0]),float(intertile_route[-1][1])).distance_to(intertile_streets.entry_position(extended_city,1))<.0001)
        _check(results,"v35-remote-route-can-be-replanned",not intertile_streets.route_from_position(extended_city,CityLayout.center(extended_city),1).is_empty())
    else:
        for missed in range(5):
            _check(results,"v35-next-building-fixture-%d" % missed,false)

    # V2.2 territory and county production: no Godot startup side effects.
    _check(results,"v22-city-radius-start-3x3",Territory.urban_radius(3)==1)
    _check(results,"v22-radius-six-pop-5x5",Territory.urban_radius(6)==2)
    _check(results,"v34-v153-city-pop32-11x11",Territory.urban_radius(32)==5 and Territory.urban_side(32)==11)
    _check(results,"v34-v153-maximum-12x12",Territory.urban_side(999)==12 and Territory.urban_side(999)<=Territory.MAX_URBAN_SIDE)
    _check(results,"v22-radius-monotonic",Territory.urban_radius(16)>=Territory.urban_radius(6))
    # V3.4: compare Godot urban extent directly with web V153.
    _check(results,"v34-v153-city-pop9-7x7",Territory.urban_radius(9)==3 and Territory.urban_side(9)==7)
    _check(results,"v34-v153-city-pop16-9x9",Territory.urban_radius(16)==4 and Territory.urban_side(16)==9)
    _check(results,"v34-v153-city-pop25-11x11",Territory.urban_radius(25)==5 and Territory.urban_side(25)==11)
    _check(results,"v34-v153-city-pop36-12x12",Territory.urban_radius(36)==6 and Territory.urban_side(36)==12)
    _check(results,"v34-v153-city-side-monotonic",Territory.urban_side(36)>=Territory.urban_side(32) and Territory.urban_side(999)==12)
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
    var largest_urban: Dictionary = {"cities":[{"name":"Suurlinna proov","team":0,"c":110,"r":80,"pop":36,"county_worksites":[] }],"revision":1}
    _check(results,"v34-v153-large-city-allocates",Territory.rebuild(largest_urban,county_land,true))
    var big_tiles: Array = largest_urban["cities"][0]["territory_urban"]
    _check(results,"v34-v153-large-city-side-saved",int(largest_urban["cities"][0].get("territory_side",0))==12)
    _check(results,"v34-v153-large-city-144-tiles",big_tiles.size()==144)
    var low_x: int = 220
    var high_x: int = 0
    var low_y: int = 165
    var high_y: int = 0
    for pt in big_tiles:
        low_x = mini(low_x,int(pt[0]))
        high_x = maxi(high_x,int(pt[0]))
        low_y = mini(low_y,int(pt[1]))
        high_y = maxi(high_y,int(pt[1]))
    _check(results,"v34-v153-urban-real-bounds",high_x-low_x<12 and high_y-low_y<12)
    _check(results,"v34-v153-city-core-remains-urban",big_tiles.has([110,80]))
    _check(results,"v34-v153-urban-json-roundtrip",JSON.parse_string(JSON.stringify(big_tiles)) is Array)
    _check(results,"v22-urban-within-side-limit",town_b["territory_urban"].size()<=121)
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
    _check(results,"v34-surrounded-city-fallback-keeps-core-and-county",town_a["territory_urban"].has([50,50]) and town_a["territory_urban"].size()<=Territory.urban_side(3)*Territory.urban_side(3) and town_a["territory_county"].size()>=Territory.urban_side(3)*Territory.urban_side(3))
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
            atlas_heights[rr*220+cc] = 2.65-float(rr)*.020
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
