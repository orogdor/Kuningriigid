class_name EconomyRules
extends RefCounted
const DATA := preload("res://data/economy.json")
const Availability = preload("res://scripts/era_availability.gd")

static func tempo_factor(state: Dictionary) -> float:
	return float({"fast":0.7,"normal":1.0,"epic":1.5}.get(state.get("tempo","normal"),1.0))

static func can_afford(resources: Dictionary, cost: Dictionary) -> bool:
	var available := resources.duplicate()
	for key in cost:
		if key == "bread": continue
		if float(available.get(key,0.0)) < float(cost[key]): return false
		available[key] -= cost[key]
	if not cost.has("bread") or float(cost.bread) == 0.0: return true
	var food := 0.0
	for key in DATA.data.food_nutrition:
		food += maxf(0.0,float(available.get(key,0.0))) * float(DATA.data.food_nutrition[key])
	return food >= float(cost.bread)

static func take_food(stock: Dictionary, meals: float) -> float:
	var need := maxf(0.0,meals)
	var served := 0.0
	var keys: Array = DATA.data.food_keys.duplicate()
	# Original JavaScript sort is stable for stocks of equal size.
	var order := {}
	for i in keys.size(): order[keys[i]] = i
	keys.sort_custom(func(a,b):
		var x: float = stock.get(a,0.0)
		var y: float = stock.get(b,0.0)
		return order[a] < order[b] if x == y else x > y)
	for key in keys:
		if need <= 0.0000001: break
		var nutrition: float = DATA.data.food_nutrition[key]
		var available := maxf(0.0,float(stock.get(key,0.0)))
		var units := minf(available,need/nutrition)
		stock[key] = maxf(0.0,available-units)
		served += units*nutrition
		need -= units*nutrition
	return served

static func spend_resources(stock: Dictionary, cost: Dictionary) -> void:
	for key in cost:
		if key != "bread": stock[key] = float(stock.get(key,0.0))-float(cost[key])
	if cost.has("bread") and float(cost.bread) != 0: take_food(stock,float(cost.bread))

static func storage_limit(buildings: Array, key: String) -> float:
	var counts := {}
	for b in buildings:
		if b.get("ready",false) and float(b.get("hp",0)) > 0 and not b.get("virtual",false):
			counts[b.type] = counts.get(b.type,0)+1
	var halls := maxi(1,int(counts.get("hall",0)))
	if key == "gold": return INF
	if key == "power": return 100.0
	if key == "water": return 100.0*halls
	if key in DATA.data.food_keys: return 100.0*halls+200.0*int(counts.get("cellar",0))+60.0*int(counts.get("pottery_kiln",0))
	if key in DATA.data.material_keys: return 240.0*halls+300.0*int(counts.get("warehouse",0))
	return INF

static func food_production_allowed(stock: Dictionary,cargo: Array,key: String,rate: float,cap: float,input: Dictionary={}) -> bool:
	if not is_finite(cap):return true
	var pending:=0.0;var output_pending:=0.0
	for c in cargo:
		if c.key in DATA.data.food_keys:pending+=float(c.amount)
		if c.key==key:output_pending+=float(c.amount)
	var used:=pending
	for food in DATA.data.food_keys:used+=float(stock.get(food,0))
	var output_stock:=float(stock.get(key,0))+output_pending
	var raw_share:=0.75 if key=="grain" else (0.42 if key=="flour" else 1.0)
	if output_stock+rate>cap*raw_share+0.0000001:return false
	var reclaim:=0.0
	for ingredient in input:
		if ingredient in DATA.data.food_keys:reclaim+=float(input[ingredient])
	return used-reclaim+rate<=cap+0.0000001

static func realm() -> Dictionary:
	return {"resources":DATA.data.start.duplicate(true),"pop":3,"tech":0,"aiClock":0,"log":[]}

static func initial_state(seed: int, map_type := "continents") -> Dictionary:
	var realms: Array = []
	for team in 4: realms.append(realm())
	return {"economyVersion":2,"time":0,"realms":realms,"resources":DATA.data.start.duplicate(true),"pop":3,"tech":0,"settlers":[{"team":0,"x":-8,"z":0,"target":null,"founded":false},{"team":1,"x":-8,"z":0,"target":null,"founded":false}],"buildings":[],"units":[],"cargo":[],"ended":false,"world":{"seed":seed,"type":map_type}}

static func ready(state: Dictionary, team: int, type: String) -> bool:
	for b in state.buildings:
		if b.team == team and Availability.supplies_building(b.type,type) and b.get("ready",false) and float(b.get("hp",0))>0: return true
	return false

static func requirement(state: Dictionary, team: int, type: String) -> String:
	var definitions: Dictionary = DATA.data.buildings
	var missing: Array[String] = []
	for id in definitions.get(type,{}).get("requires",[]):
		if not ready(state,team,id): missing.append(definitions[id].name)
	return "Vaja: "+", ".join(missing) if not missing.is_empty() else ""

static func build_rule(state: Dictionary, team: int, type: String, at: Vector2, passable: Callable, can_build: Callable = Callable(), unlimited_range := false) -> Dictionary:
	var definitions: Dictionary = DATA.data.buildings
	if not definitions.has(type) or type == "hall": return {"error":"Seda hoonet ei saa ehitada."}
	var locked := requirement(state,team,type)
	if not locked.is_empty(): return {"error":locked}
	if not can_afford(state.realms[team].resources,definitions[type].cost): return {"error":"Ehitusmaterjale ei jätku."}
	var unfinished := 0
	for b in state.buildings:
		if b.team == team and not b.get("ready",false): unfinished += 1
	if unfinished >= 12: return {"error":"Ehitusjärjekord on täis (12)."}
	if not passable.call(at.x,at.y,team): return {"error":"Ehitada saab ainult kuival maal."}
	for b in state.buildings:
		if b.team != team or b.get("virtual",false) or float(b.get("hp",0)) <= 0: continue
		if type == "market" or b.type == "market":
			var x_size := (11.0 if type == "market" else 5.0)+(11.0 if b.type == "market" else 5.0)+1.5
			var z_size := (10.2 if type == "market" else 5.0)+(10.2 if b.type == "market" else 5.0)+1.5
			if absf(b.x-at.x)<x_size and absf(b.z-at.y)<z_size: return {"error":"Teine hoone on liiga lähedal."}
		elif sqrt(pow(float(b.x)-at.x,2)+pow(float(b.z)-at.y,2)) < 5:
			return {"error":"Teine hoone on liiga lähedal."}
	var links: Array = []
	for i in state.buildings.size():
		var b: Dictionary = state.buildings[i]
		var d := sqrt(pow(float(b.x)-at.x,2)+pow(float(b.z)-at.y,2))
		if b.team == team and b.get("ready",false) and (unlimited_range or d <= 13): links.append({"index":i,"distance":d})
	links.sort_custom(func(a,b): return a.index < b.index if a.distance == b.distance else a.distance < b.distance)
	if can_build.is_valid() and not can_build.call(at.x,at.y,type,team): return {"error":"Ehituskoht või maardla ligipääs on blokeeritud."}
	if not links.is_empty(): return {"parent":links[0].index}
	return {"error":"Puudub teeühendus oma valmis hoonega (kuni 13 sammu)."}

static func place_building(state: Dictionary, team: int, type: String, at: Vector2, passable: Callable, can_build: Callable = Callable(), unlimited_range := false) -> Dictionary:
	var check := build_rule(state,team,type,at,passable,can_build,unlimited_range)
	if check.has("error"): return check
	var definition: Dictionary = DATA.data.buildings[type]
	spend_resources(state.realms[team].resources,definition.cost)
	var total := 0.0
	for value in definition.cost.values(): total += float(value)
	var building := {"type":type,"x":at.x,"z":at.y,"team":team,"hp":350,"ready":false,"progress":0,"parent":check.parent,"timer":0,"materialsRemaining":total,"materialsTotal":total}
	state.buildings.append(building)
	var logs: Array = state.realms[team].log
	logs.append({"time":floori(state.time),"text":"Ehitus: "+definition.name})
	if logs.size()>80: logs.pop_front()
	return {"building":building}

static func housing_capacity(buildings: Array) -> float:
	var capacity := 4.0
	for b in buildings:
		if b.type == "house" and b.get("ready",false) and float(b.get("hp",0)) > 0 and not b.get("virtual",false):
			capacity += 1.5*(2 if b.get("houseUpgradeLevelV218",0)>=1 else 1)
	return capacity

static func worker_efficiency(assigned: float, need: float) -> float:
	return pow(minf(1,maxf(0,assigned)/need),0.85) if need > 0 else 1.0

static func consume_households(city: Dictionary, realm: Dictionary, buildings: Array, near_water: bool) -> bool:
	var houses: Array = []
	var well := false
	for b in buildings:
		if b.type == "house" and b.get("ready",false) and float(b.get("hp",0))>0: houses.append(b)
		if b.type == "well" and b.get("ready",false) and float(b.get("hp",0))>0: well = true
	var pop: float = realm.pop
	var water_need: float = floor(pop*0.45*100+0.5)/100.0
	city.waterFetchV267 = false
	city.waterFetchFarV280 = false
	if not well:
		var lack := maxf(0,water_need-float(realm.resources.get("water",0)))
		if lack > 0:
			realm.resources.water = float(realm.resources.get("water",0))+lack
			city.waterFetchV267 = true
			if not near_water: city.waterFetchFarV280 = true
	var hall_residents := minf(pop,4)
	var food_ok := consume_household_item(realm.resources,"bread",hall_residents*0.6,{})
	var water_ok := consume_household_item(realm.resources,"water",hall_residents*0.45,{})
	var fed := food_ok and water_ok
	var house_residents := maxf(0,pop-hall_residents)
	for i in houses.size():
		var occupants := minf(1.5,maxf(0,house_residents-i*1.5))
		if occupants <= 0: continue
		food_ok = consume_household_item(realm.resources,"bread",occupants*0.6,houses[i])
		water_ok = consume_household_item(realm.resources,"water",occupants*0.45,houses[i])
		if not food_ok or not water_ok: fed = false
	return fed

static func consume_household_item(stock: Dictionary, key: String, amount: float, house: Dictionary) -> bool:
	var held_key := "foodHeld" if key == "bread" else "waterHeld"
	var remaining := amount
	if not house.is_empty():
		var held := minf(remaining,float(house.get(held_key,0)))
		house[held_key] = maxf(0,float(house.get(held_key,0))-held)
		remaining -= held
	var used := take_food(stock,remaining) if key == "bread" else minf(remaining,float(stock.get(key,0)))
	if key != "bread": stock[key] = maxf(0,float(stock.get(key,0))-used)
	return remaining-used < 0.0001

static func market_food_growth(buildings: Array, stock: Dictionary, pop: float, age: int) -> Dictionary:
	var market := false
	for b in buildings:
		if b.get("type", "") == "market" and b.get("ready", false) and float(b.get("hp", 0)) > 0 and not b.get("disabled", false) and not b.get("virtual", false):
			market = true
			break
	var varieties: Array = []
	if market:
		var limit := maxf(0.5, (pop if pop != 0 else 3.0) * 0.1)
		if float(stock.get("bread", 0)) + float(stock.get("grain", 0)) + float(stock.get("flour", 0)) >= limit: varieties.append("cereal")
		for entry in [["meat",0], ["fish",0], ["berries",0], ["vegetables",1], ["fruit",2], ["cheese",3], ["spices",4], ["coffee",5]]:
			if age >= entry[1] and float(stock.get(entry[0], 0)) >= limit: varieties.append(entry[0])
	var bonus := 0.05 * varieties.size()
	return {"varieties":varieties, "bonus":bonus, "multiplier":1.0+bonus}

static func prosperous_town_growth(age: int, pop: float, stock: Dictionary, market_varieties: int, housing_free: float) -> float:
	if age != 1 and age != 2: return 1.0
	var food := float(stock.get("bread",0)) + float(stock.get("flour",0))*0.85 + float(stock.get("grain",0))*0.7
	for key in ["meat", "fish", "berries", "vegetables", "fruit", "cheese"]: food += float(stock.get(key,0))
	if food < pop*1.6 or float(stock.get("water",0)) < pop*1.1 or housing_free < 1: return 1.0
	return minf(2.5, (2.05 if age == 1 else 1.4) + (0.30 if market_varieties >= 2 else 0.0) + (0.12 if food >= pop*3 else 0.0))

static func demographics_turn(city: Dictionary, economy: Dictionary, buildings: Array, near_water: bool, age := 0, growth_factor := 1.0) -> void:
	var team: int = city.team
	var realm: Dictionary = economy.realms[team]
	var cap := housing_capacity(buildings)
	var food_need: float = floor(float(realm.pop)*0.6*100+0.5)/100.0
	var water_need: float = floor(float(realm.pop)*0.45*100+0.5)/100.0
	realm.resources.gold = float(realm.resources.get("gold",0))+realm.pop
	realm.housingCapacity = cap
	realm.householdNeed = food_need
	realm.foodNeed = food_need
	realm.waterNeed = water_need
	var supplied := consume_households(city,realm,buildings,near_water)
	realm.housingShortage = not supplied
	if not realm.has("growthProgress"): realm.growthProgress = 0.0
	var growth := market_food_growth(buildings, realm.resources, realm.pop, age)
	var prosperity := prosperous_town_growth(age, realm.pop, realm.resources, growth.varieties.size(), cap-realm.pop)
	realm.marketFoodVarietiesV137 = growth.varieties.size()
	realm.marketFoodBonusV137 = growth.bonus
	for building in buildings:
		if building.type=="inn" and building.get("ready",false) and float(building.get("hp",0))>0 and not building.get("disabled",false) and float(building.get("assigned",0))>=0.5:
			growth_factor*=0.86;break
	realm.growthNeed = (2.3+realm.pop*0.28)*growth_factor/(maxf(1,growth.multiplier)*maxf(1,prosperity))
	if supplied:
		realm.shortageTurns = 0
		if realm.pop < floor(cap):
			var reserves := 1.2 if float(realm.resources.get("bread",0))>=realm.pop*2 and float(realm.resources.get("water",0))>=realm.pop*1.5 else 1.0
			realm.growthProgress += reserves
			if realm.growthProgress >= realm.growthNeed:
				realm.growthProgress -= realm.growthNeed
				realm.pop += 1
				realm.log.append({"time":floori(economy.time),"text":"Linna tuli uus elanik"})
		else: realm.growthProgress = minf(realm.growthProgress,realm.growthNeed)
	else:
		realm.growthProgress = maxf(0,realm.growthProgress-0.7)
		realm.shortageTurns = int(realm.get("shortageTurns",0))+1
		if realm.shortageTurns >= 3:
			realm.shortageTurns = 0
			realm.pop = maxf(3,minf(cap,realm.pop-1))
			realm.log.append({"time":floori(economy.time),"text":"Toidu- ja veepuudus vähendas elanikkonda"})
	if realm.log.size()>80: realm.log.pop_front()

