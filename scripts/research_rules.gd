class_name ResearchRules
extends RefCounted

const DATA := preload("res://data/research.json")

static func new_research() -> Dictionary:
	return {"known": [], "active": null, "progress": {}, "completed": [], "queue": [], "paused": false, "boosted": [], "rate": 0.0}

static func tech_block(research: Dictionary, id: String) -> String:
	var techs: Dictionary = DATA.data.techs
	if not techs.has(id):
		return "Tundmatu tehnoloogia."
	if id in research.known:
		return "Juba uuritud."
	if research.get("v118LegacyActive") == id:
		return ""
	var tech: Dictionary = techs[id]
	var age: int = tech.age
	if age > 0 and DATA.data.era_ids[age] != id and DATA.data.era_ids[age] not in research.known:
		return "Vajab ajastut: " + DATA.data.era_names[age]
	var missing: Array[String] = []
	for parent in tech.requires:
		if parent not in research.known:
			missing.append(techs[parent].name)
	if not missing.is_empty():
		return "Eeldab: " + ", ".join(missing)
	if tech.has("oneOf"):
		var has_one := false
		var names: Array[String] = []
		for parent in tech.oneOf:
			has_one = has_one or parent in research.known
			names.append(techs[parent].name)
		if not has_one:
			return "Eeldab üht: " + " või ".join(names)
	return ""

static func start_research(state: Dictionary, team: int, id: String) -> Dictionary:
	var research: Dictionary = state.research[team]
	var error := tech_block(research, id)
	if error != "":
		return {"error": error}
	var has_city := false
	for city in state.cities:
		if city.team == team:
			has_city = true
			break
	if not has_city:
		return {"error": "Raja esmalt vähemalt üks linn. Avastused kehtivad kogu riigis."}
	research.active = id
	research.paused = false
	research.queue.erase(id)
	if not research.progress.has(id):
		research.progress[id] = 0.0
	return {"ok": true}

static func buy_research(state: Dictionary,team: int) -> Dictionary:
	var research: Dictionary=state.research[team];var id: Variant=research.active
	if id==null:return {"error":"Ühtegi uuringut pole käimas."}
	var town: Dictionary={};var highest: float=-INF
	for city in state.cities:
		if int(city.team)!=team or city.get("districtOf")!=null:continue
		var gold:=float(city.economy.realms[team].resources.get("gold",0))
		if gold>highest:highest=gold;town=city
	if town.is_empty() or highest<40:return {"error":"Kassas pole 40 kulda."}
	var stock: Dictionary=town.economy.realms[team].resources
	stock.gold=float(stock.gold)-40;research.progress[id]=float(research.progress.get(id,0))+12
	return {"ok":true,"id":id,"town":town.name}

static func queue_research(state: Dictionary, team: int, id: String) -> Dictionary:
	var research: Dictionary = state.research[team]
	if id in research.known or research.active == id or id in research.queue:
		return {"error": "See teema on juba uuritud või järjekorras."}
	if research.queue.size() >= 4:
		return {"error": "Järjekorda mahub kuni neli teemat."}
	if research.active == null and not research.paused and research.queue.is_empty():
		return start_research(state, team, id)
	var planned: Array = research.known.duplicate()
	if research.active != null:
		planned.append(research.active)
	planned.append_array(research.queue)
	var error := tech_block({"known": planned}, id)
	if error != "":
		return {"error": error}
	research.queue.append(id)
	return {"ok": true}

const EDUCATION_TYPES := ["study", "scriptorium", "library", "academy", "school", "university", "monastery", "chapel", "observatory", "public_school", "high_school", "polytechnic", "laboratory"]
const KNOWLEDGE_BONUSES := {"writing": 0.10, "literacy": 0.10, "philosophy": 0.10, "printing": 0.15, "experimental_science": 0.15, "public_education": 0.15, "secondary_education": 0.10, "computing": 0.20}

static func research_cost(state: Dictionary, tech: Dictionary) -> float:
	var factors := {"fast": 0.7, "normal": 1.0, "epic": 1.5}
	var factor: float = factors.get(state.get("tempo", "normal"), 1.0)
	var age_factor := GrowthBalance.knowledge_cost_factor(int(tech.get("age", 0))) if state.get("strategyPacingV125", false) == true else 1.0
	return float(tech.get("turns", 0.0)) * 10.0 * factor * age_factor

static func city_science(city: Dictionary, known: Array = []) -> Dictionary:
	var team: int = city.team
	var realms: Array = city.get("economy", {}).get("realms", [])
	var base := 0.0
	if team >= 0 and team < realms.size():
		base = maxf(0.0, float(realms[team].get("pop", 0.0)))
	var contexts: Array = [city]
	contexts.append_array(city.get("districts", {}).values())
	var institutions := 0
	for context in contexts:
		for building in context.get("economy", {}).get("buildings", []):
			if not building.get("virtual", false) and building.get("type", "") in EDUCATION_TYPES and building.get("ready", false) and not building.get("disabled", false) and float(building.get("hp", 0.0)) > 0:
				institutions += 1
	var education_multiplier := pow(1.5, institutions)
	var discovery_multiplier := 1.0
	for id in KNOWLEDGE_BONUSES:
		if id in known:
			discovery_multiplier += KNOWLEDGE_BONUSES[id]
	return {"base": base, "institutions": institutions, "educationMultiplier": education_multiplier, "discoveryMultiplier": discovery_multiplier, "buildings": base * (education_multiplier - 1.0), "discoveries": base * education_multiplier * (discovery_multiplier - 1.0), "total": base * education_multiplier * discovery_multiplier}

static func science_rate(state: Dictionary, team: int) -> float:
	var known: Array = state.research[team].get("known", [])
	var total := 0.0
	for city in state.get("cities", []):
		if city.team == team:
			total += city_science(city, known).total
	return total

const EUREKAS := ["hunting", "fishing", "forestry", "bronze", "settlement", "woodworking", "shipbuilding", "agriculture", "milling", "iron", "smelting", "navigation", "civics", "horsemanship", "printing", "steelmaking", "steam_engine", "electricity", "combustion"]
const BUILDING_DISCOVERIES := {"forestry": ["lumber"], "bronze": ["lumber", "quarry"], "woodworking": ["lumber", "house"], "shipbuilding": ["lumber", "fisher"], "milling": ["farm"], "smelting": ["mine"], "navigation": ["harbor"], "horsemanship": ["pasture", "stable"], "printing": ["university"], "steelmaking": ["smelter"], "steam_engine": ["steelworks"], "electricity": ["engineworks"], "combustion": ["refinery"]}

static func discovery_unlocked(state: Dictionary, team: int, id: String) -> bool:
	var cities: Array = []
	for city in state.get("cities", []):
		if city.team == team:
			cities.append(city)
	if id == "settlement":
		var explored: Array = state.get("explored", [])
		return team < explored.size() and explored[team].size() >= 45
	if id == "civics":
		return cities.size() >= 2
	if BUILDING_DISCOVERIES.has(id):
		for kind in BUILDING_DISCOVERIES[id]:
			var found := false
			for city in cities:
				var contexts: Array = [city]
				contexts.append_array(city.get("districts", {}).values())
				for ctx in contexts:
					for b in ctx.get("economy", {}).get("buildings", []):
						if not b.get("virtual", false) and b.get("type") == kind and b.get("ready", false) and float(b.get("hp", 0)) > 0:
							found = true
			if not found:
				return false
		return true
	var resource_kind: String = {"hunting": "game", "fishing": "fish", "agriculture": "berry", "iron": "ore"}.get(id, "")
	if resource_kind == "":
		return false
	for city in cities:
		if id in ["hunting", "fishing"] and city.get("resourceDiscoveries", {}).get(resource_kind, false):
			return true
		for resource in city.get("world", {}).get("resources", []):
			if resource.get("kind") == resource_kind and (id != "agriculture" or not resource.get("removed", false)):
				return true
	return false

static func tick_research(state: Dictionary, dt: float) -> Array:
	var events: Array = []
	for team in state.research.size():
		var research: Dictionary = state.research[team]
		if not research.has("queue"): research.queue = []
		if not research.has("boosted"): research.boosted = []
		research.rate = science_rate(state, team)
		if not research.paused and research.rate > 0:
			for id in EUREKAS:
				if id in research.known or id in research.boosted or not discovery_unlocked(state, team, id):
					continue
				var cost := research_cost(state, DATA.data.techs[id])
				research.progress[id] = minf(cost, float(research.progress.get(id, 0)) + cost * 0.35)
				research.boosted.append(id)
				events.append({"team": team, "id": id, "boost": true})
		if research.paused or research.rate <= 0:
			continue
		var budget: float = dt * research.rate / 60.0
		for step in 24:
			if research.active == null and not research.queue.is_empty() and tech_block(research, research.queue[0]) == "":
				research.active = research.queue.pop_front()
			var id: Variant = research.active
			if id == null or tech_block(research, id) != "" or budget <= 0:
				break
			var total := research_cost(state, DATA.data.techs[id])
			var used := minf(budget, maxf(0.0, total - float(research.progress.get(id, 0))))
			research.progress[id] = float(research.progress.get(id, 0)) + used
			budget -= used
			if research.progress[id] + 0.00000001 < total:
				break
			if EraEconomy.DATA.data.era_techs.has(id):
				var payment := EraEconomy.pay_era_cost(state, team, id)
				if not payment.paid:
					research.ageWait = {"id": id, "missing": payment.missing}
					research.progress[id] = total
					budget = 0.0
					break
			research.ageWait = null
			research.progress[id] = total
			research.known.append(id)
			research.active = null
			if research.get("v118LegacyActive") == id:
				research.v118LegacyActive = null
			var completed_at: float = state.time - budget / (research.rate / 60.0)
			research.completed.append({"id": id, "time": completed_at})
			if EraEconomy.DATA.data.era_techs.has(id):
				state.ages[team] = maxi(int(state.ages[team]), int(EraEconomy.DATA.data.era_techs[id]))
				if id == "bronze":
					if not state.has("ageStartedAtV160"): state.ageStartedAtV160 = {}
					state.ageStartedAtV160[str(team)] = state.time
			events.append({"team": team, "id": id})
			if budget <= 0:
				if not research.queue.is_empty() and tech_block(research, research.queue[0]) == "":
					research.active = research.queue.pop_front()
				break
	return events

