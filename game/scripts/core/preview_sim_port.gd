extends RefCounted
## INCREMENTAL PORT DEMONSTRATOR (not yet V131 simulation parity).
## V131 sourced rules: starting resources, construction costs, building time,
## technology requirements/cost, science accumulation, food/water consumption,
## era materials, and proxy local cargo deliveries. Missing: physical workers,
## original road logistics, full V131 AI and detailed building placement.
const Economy = preload("res://scripts/core/economy_port.gd")
const Research = preload("res://scripts/core/research_port.gd")
const Science = preload("res://scripts/core/science_port.gd")
const Needs = preload("res://scripts/core/city_needs_port.gd")
const EraEconomy = preload("res://scripts/core/era_economy_port.gd")
const Tech125 = preload("res://scripts/core/research_v125_port.gd")
const BuildingRules = preload("res://scripts/core/building_rules_port.gd")
const Labor = preload("res://scripts/core/labor_port.gd")
const PreviewAI = preload("res://scripts/core/preview_ai_port.gd")
const Demographics = preload("res://scripts/core/demographics_port.gd")
const Production = preload("res://scripts/core/production_port.gd")
const Cargo = preload("res://scripts/core/cargo_port.gd")
const CityLayout = preload("res://scripts/core/city_layout_port.gd")
const Territory = preload("res://scripts/core/territory_port.gd")
const CountyLogistics = preload("res://scripts/core/county_logistics_port.gd")
const Citizens = preload("res://scripts/core/citizen_agents_port.gd")
const Market = preload("res://scripts/core/market_households_port.gd")
const Trade = preload("res://scripts/core/trade_network_port.gd")
const Military = preload("res://scripts/core/military_port.gd")
const BattlePreview = preload("res://scripts/core/battle_preview_port.gd")
const IndividualBattle = preload("res://scripts/core/individual_battle_port.gd")
const BattleQueue = preload("res://scripts/core/campaign_battle_queue_port.gd")
const FOOD_PER_RESIDENT: float = 0.60  # labor.js
const WATER_PER_RESIDENT: float = 0.45  # labor.js
const RESEARCH_ORDER = ["hunting","fishing","stone_tools","learning","settlement","water","agriculture","warfare","pottery","grain_storage","village_council","bronze"]

static func initialize(manifest_cities: Array) -> Dictionary:
    var towns: Array = []
    for data in manifest_cities:
        var city: Dictionary = data.duplicate(true)
        city["pop"] = 3
        city["resources"] = Economy.start_resources()
        city["buildings"] = [{"type":"hall","ready":true,"hp":1200.0,"efficiency":1.0}]
        city["cargo"] = []
        city["citizens"] = {}
        city["age"] = 0
        city["growthProgress"] = 0.0
        city["shortageTurns"] = 0
        city["county_worksites"] = []
        towns.append(city)
    var teams: Dictionary = {}
    for team in range(4):
        teams[team] = {"known":{},"active":"","progress":0.0,"age":0,"last_result":""}
    var state: Dictionary = {"cities":towns,"teams":teams,"seconds":0.0,"revision":1,"ai_enabled":false,"ai_build_orders":0,"ai_research_orders":0,"economic_ticks":0,"produced_cycles":0,"shortage_minutes":0,"cargo_dispatched":0,"cargo_deliveries":0,"cargo_units_delivered":0.0,"citizens_moving":0,"citizens_working":0,"citizens_hauled":0.0,"market_purchases":0,"market_deliveries":0,"market_food_bought":0.0,"market_water_bought":0.0,"market_food_delivered":0.0,"market_water_delivered":0.0,"shipments":[],"world_roads":{},"next_shipment":1,"trade_dispatched":0,"trade_arrived":0,"trade_units_delivered":0.0,"trade_auto":true,"county_shipments":[],"next_county_cargo":1,"county_worker_steps":0,"county_cargo_steps":0,"county_cargo_dispatched":0,"county_cargo_delivered":0,"county_units_delivered":0.0,"county_blocked_routes":0,"county_supply_sent":0,"county_supply_delivered":0,"county_supply_units":0.0,"county_route_replans":0}
    Military.setup(state)
    state["individual_battle"] = {}
    state["pending_battles"] = []
    state["battles_queued_total"] = 0
    state["battles_dequeued_total"] = 0
    state["battles_queue_expired"] = 0
    state["individual_battles_started"] = 0
    state["individual_battles_finished"] = 0
    state["campaign_retreats"] = 0
    state["campaign_retreats_trapped"] = 0
    state["last_campaign_retreats"] = []
    return state

static func build_in_town(state: Dictionary, city_index: int, kind: String,landscape = null) -> Dictionary:
    var towns: Array = state["cities"]
    if city_index < 0 or city_index >= towns.size() or not Economy.BUILDINGS.has(kind):
        return {"ok":false,"reason":"Tundmatu linn või hoone"}
    var city: Dictionary = towns[city_index]
    var definitions: Dictionary = Economy.BUILDINGS[kind]
    var team: int = int(city["team"])
    var unfinished: int = 0
    for other in towns:
        if int(other["team"]) == team:
            for b in other["buildings"]:
                if not bool(b.get("ready",false)):
                    unfinished += 1
    var reason: String = BuildingRules.build_error(kind, city, state["teams"][team]["known"], unfinished)
    if not reason.is_empty():
        return {"ok":false,"reason":reason}
    # Allocate the lot BEFORE charging resources; an overfilled detail tile
    # must not silently deduct construction materials.
    if not CityLayout.ensure_positions(city):
        return {"ok":false,"reason":"Linna kruntide paigutus pole täielik"}
    var location: Dictionary = CityLayout.find_free_site(city,kind,_occupied_lots(city),landscape)
    if not bool(location["ok"]):
        return {"ok":false,"reason":String(location.get("reason","Linn on täis"))}
    var local: Vector2 = location["point"]
    var absolute: Vector2 = CityLayout.center(city)+local
    var stock: Dictionary = city["resources"]
    Economy.spend_resources(stock, definitions["cost"])
    var material_total: float = 0.0
    for quantity in definitions["cost"].values():
        material_total += float(quantity)
    city["buildings"].append({"type":kind,"ready":false,"progress":0.0,"time":float(definitions["time"]),"hp":350.0,"efficiency":0.0,"assigned":0.0,"materialsTotal":material_total,"materialsRemaining":material_total,"site_x":absolute.x,"site_z":absolute.y})
    state["revision"] = int(state["revision"]) + 1
    return {"ok":true,"reason":"Ehitusjärjekorras: " + String(definitions["name"])}

static func _occupied_lots(city: Dictionary) -> Array:
    var lots: Array = []
    for building in city.get("buildings",[]):
        if building.has("site_x") and building.has("site_z"):
            lots.append({"point":Vector2(float(building["site_x"]),float(building["site_z"]))-CityLayout.center(city),"kind":String(building.get("type","house"))})
    return lots

static func research_next(state: Dictionary, team: int) -> Dictionary:
    var team_state: Dictionary = state["teams"][team]
    if not String(team_state["active"]).is_empty():
        return {"ok":false,"reason":"Uurimine juba käib: " + String(team_state["active"])}
    var known: Dictionary = team_state["known"]
    var available: Array = Research.available(known)
    var chosen := ""
    for id in RESEARCH_ORDER:
        if id in available:
            chosen = id
            break
    if chosen.is_empty() and not available.is_empty():
        chosen = String(available[0])
    if chosen.is_empty():
        return {"ok":false,"reason":"Uusi uurimisvõimalusi pole"}
    team_state["active"] = chosen
    team_state["progress"] = 0.0
    return {"ok":true,"reason":"Uurimisel: " + chosen}

static func tick(state: Dictionary, dt: float, navigator = null, world_nav = null,landscape = null) -> void:
    # Fragmenting time at 1s / exact 12s AI / exact 60s household boundaries
    # makes 10-minute fast-forward follow the same rules as realtime playback.
    var remaining: float = maxf(0.0,dt)
    while remaining > 0.000001:
        var before: float = float(state.get("seconds",0.0))
        var next_minute: float = (floor(before/60.0)+1.0)*60.0
        var next_ai: float = (floor(before/12.0)+1.0)*12.0
        var step: float = minf(1.0,remaining)
        step = minf(step,maxf(0.00001,next_minute-before))
        step = minf(step,maxf(0.00001,next_ai-before))
        state["seconds"] = before + step
        _tick_fragment(state,step,navigator,world_nav)
        Military.advance(state,step,world_nav)
        if bool(state.get("campaign",{}).get("active",false)):
            # Register collisions on all fronts, even during a tactical siege.
            BattleQueue.advance(state)
        elif state.get("individual_battle",{}).is_empty():
            if float(state.get("seconds",0.0)) >= float(state.get("battle_cooldown_until",0.0)):
                BattlePreview.detect_encounter(state)
        if state.get("individual_battle",{}).is_empty():
            BattlePreview.tick(state,step)
        else:
            IndividualBattle.tick(state,step,world_nav)
        # V131 trade planner runs once every 15 seconds.
        if world_nav != null and bool(state.get("trade_auto",true)) and int(floor((before+step+0.000001)/15.0)) > int(floor(before/15.0)):
            Trade.plan_trade(state,world_nav)
        if int(floor((before+step+0.000001)/30.0)) > int(floor(before/30.0)):
            Trade.age_roads(state)
        # Source V131 civilization-core tick() plans AI every 12 seconds.
        if bool(state.get("ai_enabled",false)) and int(floor((before+step+0.000001)/12.0)) > int(floor(before/12.0)):
            PreviewAI.advance(state,landscape)
        # Source V131 economy.js tickEconomy performs demographics per minute.
        if int(floor((before+step+0.000001)/60.0)) > int(floor(before/60.0)):
            for city in state["cities"]:
                var result: Dictionary = Demographics.minute(city)
                state["economic_ticks"] = int(state.get("economic_ticks",0)) + 1
                if not bool(result["supplied"]):
                    state["shortage_minutes"] = int(state.get("shortage_minutes",0)) + 1
                if bool(result["changed"]):
                    state["revision"] = int(state.get("revision",0)) + 1
        remaining -= step

static func _tick_fragment(state: Dictionary, dt: float, navigator = null, world_nav = null) -> void:
    # Route caravans before workshop production so a new load is not
    # delivered in the same fragment that created it.
    if world_nav != null:
        Trade.advance(state,dt,world_nav)
    for city in state["cities"]:
        # Move existing local shipments before generating new production.
        # Newly finished goods cannot reach the store in the same tick.
        var transport: Dictionary = Cargo.advance(city,dt,navigator)
        state["cargo_deliveries"] = int(state.get("cargo_deliveries",0)) + int(transport["deliveries"])
        state["cargo_units_delivered"] = float(state.get("cargo_units_delivered",0.0)) + float(transport["amount"])
        var stock: Dictionary = city["resources"]
        var team: int = int(city["team"])
        # Per-second luxury use matches city-needs-v87.js; residents' core
        # food and water use are handled in Demographics.minute(), not here.
        Needs.consume_luxuries(stock,int(city["pop"]),int(city["age"]),dt)
        # Source V131 civilization-core.js ticks market shoppers before
        # allocating workforce for the current simulation fragment.
        var shopping: Dictionary = Market.advance(city,dt,navigator)
        state["market_purchases"] = int(state.get("market_purchases",0)) + int(shopping["purchases"])
        state["market_deliveries"] = int(state.get("market_deliveries",0)) + int(shopping["deliveries"])
        for metric in ["food_bought","water_bought","food_delivered","water_delivered"]:
            state["market_" + metric] = float(state.get("market_" + metric,0.0)) + float(shopping[metric])
        Labor.allocation(city)
        if world_nav != null:
            var rural: Dictionary = CountyLogistics.advance_city(state,city,dt,world_nav)
            state["county_cycles"] = int(state.get("county_cycles",0)) + int(rural["produced"])
            state["county_worker_steps"] = int(state.get("county_worker_steps",0)) + int(rural["worker_steps"])
            state["county_cargo_steps"] = int(state.get("county_cargo_steps",0)) + int(rural["cargo_steps"])
            state["county_cargo_dispatched"] = int(state.get("county_cargo_dispatched",0)) + int(rural["shipped"])
            state["county_cargo_delivered"] = int(state.get("county_cargo_delivered",0)) + int(rural["delivered"])
            state["county_units_delivered"] = float(state.get("county_units_delivered",0.0)) + float(rural["units"])
            state["county_blocked_routes"] = int(state.get("county_blocked_routes",0)) + int(rural["blocked"])
            state["county_supply_sent"] = int(state.get("county_supply_sent",0)) + int(rural["supply_sent"])
            state["county_supply_delivered"] = int(state.get("county_supply_delivered",0)) + int(rural["supply_received"])
            state["county_supply_units"] = float(state.get("county_supply_units",0.0)) + float(rural["supply_units"])
            state["county_route_replans"] = int(state.get("county_route_replans",0)) + int(rural["replanned"])
        else:
            # Headless backward-compatibility simulation: explicitly not
            # representative of multi-tile logistics without world navigation.
            var remote_cycles: int = Territory.advance_worksites(city,dt)
            state["county_cycles"] = int(state.get("county_cycles",0)) + remote_cycles
        var citizens: Dictionary = Citizens.advance(city,dt,navigator)
        state["citizens_moving"] = int(state.get("citizens_moving",0)) + int(citizens["moving"])
        state["citizens_working"] = int(state.get("citizens_working",0)) + int(citizens["working"])
        state["citizens_hauled"] = float(state.get("citizens_hauled",0.0)) + float(citizens["hauled"])
        var unfinished: int = 0
        for b in city["buildings"]:
            if not bool(b.get("ready",false)):
                unfinished += 1
        for index in range(city["buildings"].size()):
            var b: Dictionary = city["buildings"][index]
            if not bool(b.get("ready",false)):
                # A building progresses ONLY when its builder reaches the site
                # after finishing physical material deliveries (builders.js).
                var actual_work: float = float(citizens["build_work"].get(index,0.0))
                b["progress"] = float(b.get("progress",0.0)) + actual_work
                if actual_work > 0.0 and float(b["progress"]) >= float(b.get("time",0.0)):
                    b["ready"] = true
                    state["revision"] = int(state["revision"]) + 1
                continue
            var kind: String = String(b.get("type",""))
            var definition: Dictionary = Economy.BUILDINGS.get(kind,{})
            var output: String = String(definition.get("out",""))
            if output.is_empty():
                if kind in Science.SCIENCE_BUILDINGS:
                    b["researchActivity"] = 1.0 if bool(citizens["present"].get(index,false)) else 0.0
                continue
            var boost: float = Tech125.production_multiplier(state["teams"][team]["known"],output)
            # Do not operate a factory while its physical worker is commuting.
            var production_dt: float = dt if bool(citizens["present"].get(index,false)) else 0.0
            var completed: int = Production.run_cycle(city,b,production_dt,boost,true,navigator)
            state["produced_cycles"] = int(state.get("produced_cycles",0)) + completed
            state["cargo_dispatched"] = int(state.get("cargo_dispatched",0)) + completed
    var definitions: Dictionary = Research.all_techs()
    for team in range(4):
        var research: Dictionary = state["teams"][team]
        var active: String = String(research["active"])
        if active.is_empty():
            continue
        if not definitions.has(active):
            research["active"] = ""
            continue
        var definition: Dictionary = definitions[active]
        research["progress"] = float(research["progress"]) + Science.science_rate(state["cities"],team,true) * dt / 60.0
        var goal: float = Science.research_cost(int(definition["turns"]),int(definition["age"]),1.0,true)
        if float(research["progress"]) < goal:
            continue
        if EraEconomy.ERA_MATERIALS.has(active):
            var stocks: Array = []
            for city in state["cities"]:
                if int(city["team"]) == team:
                    stocks.append(city["resources"])
            var payment: Dictionary = EraEconomy.pay_era_cost(stocks,active)
            if not payment["paid"]:
                research["last_result"] = "Ootan ajastuks ressursse: " + str(payment["missing"])
                continue
            research["age"] = EraEconomy.ERA_TECHS[active]
            for city in state["cities"]:
                if int(city["team"]) == team:
                    city["age"] = int(research["age"])
        research["known"][active] = true
        research["last_result"] = "Avastatud: " + active
        research["active"] = ""
        research["progress"] = 0.0
        state["revision"] = int(state["revision"]) + 1

static func preview_summary(state: Dictionary, city_index: int) -> String:
    var city: Dictionary = state["cities"][city_index]
    var stock: Dictionary = city["resources"]
    var team_state: Dictionary = state["teams"][int(city["team"])]
    var needs: Dictionary = Needs.city_needs(stock,int(city["pop"]),int(city["age"]))
    return "%s | Rahvas %d/%d | Puit %.1f | Kivi %.1f | Toit %.1f | Vesi %.1f | Ehitised %d | Uuring %s %.1f | Vajadused %.2f | AI ehitusi %d | Tootmistsükleid %d | Veoseid %d | Kohale %d | Turult koju %d | Kaubavedu %d/%d" % [
        String(city["name"]), int(city["pop"]),BuildingRules.housing_capacity(city["buildings"]),float(stock["wood"]),float(stock["stone"]),
        Needs.food_total(stock),float(stock["water"]),city["buildings"].size(),
        String(team_state["active"]),float(team_state["progress"]),float(needs["productivity"]),int(state.get("ai_build_orders",0)),int(state.get("produced_cycles",0)),city.get("cargo",[]).size(),int(state.get("cargo_deliveries",0)),int(state.get("market_deliveries",0)),int(state.get("trade_dispatched",0)),int(state.get("trade_arrived",0))]

static func save_preview(state: Dictionary,path: String = "user://v131_godot_preview_v25.json") -> bool:
    var file := FileAccess.open(path,FileAccess.WRITE)
    if file == null:
        return false
    file.store_string(JSON.stringify(state))
    file.close()
    return true

static func load_preview(manifest_cities: Array,path: String = "user://v131_godot_preview_v25.json") -> Dictionary:
    if not FileAccess.file_exists(path) and path == "user://v131_godot_preview_v25.json":
        # Read existing preview saves but leave originals untouched.
        for legacy in ["user://v131_godot_preview_v24.json","user://v131_godot_preview_v23.json","user://v131_godot_preview_v22.json","user://v131_godot_preview_v14.json","user://v131_godot_preview_v13.json", "user://v131_godot_preview_v12.json", "user://v131_godot_preview_v11.json","user://v131_godot_preview_v10.json","user://v131_godot_preview_v09.json","user://v131_godot_preview_v08.json","user://v131_godot_preview_v07.json","user://v131_godot_preview_v06.json", "user://v131_godot_preview_v05.json", "user://v131_godot_preview_v02.json"]:
            if FileAccess.file_exists(legacy):
                path = legacy
                break
        if not FileAccess.file_exists(path):
            return {}
    var file := FileAccess.open(path,FileAccess.READ)
    if file == null:
        return {}
    var data = JSON.parse_string(file.get_as_text())
    file.close()
    if not (data is Dictionary) or not data.has("cities") or not data.has("teams"):
        return {}
    # Campaigns may have founded real additional settlements. Accept a
    # longer save, but verify that the original immutable map-city identities
    # and coordinates still match. This rejects unrelated or corrupt saves.
    if data["cities"].size() < manifest_cities.size():
        return {}
    var identity: Dictionary = {}
    for i in range(manifest_cities.size()):
        var base: Dictionary = manifest_cities[i]
        var stored: Dictionary = data["cities"][i]
        if int(base.get("id",-1)) != int(stored.get("id",-2)) or int(base["c"]) != int(stored.get("c",-1)) or int(base["r"]) != int(stored.get("r",-1)):
            return {}
    for stored in data["cities"]:
        var id: int = int(stored.get("id",-1))
        if id < 0 or identity.has(id):
            return {}
        identity[id] = true
    # JSON dictionary keys are strings; convert team indexing to integers.
    var teams: Dictionary = {}
    for team in range(4):
        if not data["teams"].has(str(team)):
            return {}
        teams[team] = data["teams"][str(team)]
    data["teams"] = teams
    if not data.has("individual_battle"):
        data["individual_battle"] = {}
    if not data.has("pending_battles"):
        data["pending_battles"] = []
    for metric in ["battles_queued_total","battles_dequeued_total","battles_queue_expired"]:
        if not data.has(metric):
            data[metric] = 0
    for key in ["individual_battles_started", "individual_battles_finished"]:
        if not data.has(key):
            data[key] = 0
    if not data.has("ai_enabled"):
        data["ai_enabled"] = false
    for metric in ["economic_ticks", "produced_cycles", "shortage_minutes", "cargo_dispatched", "cargo_deliveries", "citizens_moving", "citizens_working"]:
        if not data.has(metric):
            data[metric] = 0
    if not data.has("cargo_units_delivered"):
        data["cargo_units_delivered"] = 0.0
    if not data.has("citizens_hauled"):
        data["citizens_hauled"] = 0.0
    for metric in ["market_purchases","market_deliveries"]:
        if not data.has(metric):
            data[metric] = 0
    for metric in ["market_food_bought","market_water_bought","market_food_delivered","market_water_delivered"]:
        if not data.has(metric):
            data[metric] = 0.0
    if not data.has("county_shipments"):
        data["county_shipments"] = []
    if not data.has("detail_bridges"):
        data["detail_bridges"] = {}
    if not data.has("atlas_bridges"):
        data["atlas_bridges"] = {}
    if not data.has("trade_replans"):
        data["trade_replans"] = 0
    if not data.has("next_county_cargo"):
        data["next_county_cargo"] = 1
    for metric in ["county_worker_steps","county_cargo_steps","county_cargo_dispatched","county_cargo_delivered","county_blocked_routes"]:
        if not data.has(metric):
            data[metric] = 0
    if not data.has("county_units_delivered"):
        data["county_units_delivered"] = 0.0
    for metric in ["county_supply_sent","county_supply_delivered","county_route_replans"]:
        if not data.has(metric):
            data[metric] = 0
    if not data.has("county_supply_units"):
        data["county_supply_units"] = 0.0
    for city in data["cities"]:
        if not city.has("county_worksites"):
            city["county_worksites"] = []
        for site in city["county_worksites"]:
            if not site.has("inputs"):
                site["inputs"] = {}
        CityLayout.ensure_positions(city)
        if not city.has("citizens"):
            city["citizens"] = {}
        if not city.has("cargo"):
            city["cargo"] = []
        for key in ["growthProgress", "shortageTurns"]:
            if not city.has(key):
                city[key] = 0.0 if key == "growthProgress" else 0
    # Older preview saves never contained world caravans or trade roads.
    if not data.has("shipments"):
        data["shipments"] = []
    if not data.has("world_roads"):
        data["world_roads"] = {}
    for key in ["trade_dispatched","trade_arrived"]:
        if not data.has(key):
            data[key] = 0
    if not data.has("trade_units_delivered"):
        data["trade_units_delivered"] = 0.0
    if not data.has("next_shipment"):
        data["next_shipment"] = 1
    if not data.has("trade_auto"):
        data["trade_auto"] = true
    Military.setup(data)
    for key in ["campaign_retreats", "campaign_retreats_trapped"]:
        if not data.has(key):
            data[key] = 0
    if not data.has("last_campaign_retreats"):
        data["last_campaign_retreats"] = []
    return data
