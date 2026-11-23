class_name SettlementRules
extends RefCounted
const PLAYER_SPACING := 10
const AI_SPACING := 9

# Equivalent to the checks in Civilization.siteRule. The caller supplies the
# authoritative city/territory and local-navigation data for the tile.
static func site_rule(settler: Dictionary, point: Vector2, cities: Array, occupied: bool, territory_owned: bool, passable: Callable, resources: Array) -> String:
	if not settler.get("landed",false) or not settler.get("path",[]).is_empty(): return "Ava esmalt asuniku detailkaart."
	if occupied: return "Sellel ruudul on juba linn."
	if territory_owned: return "See ruut kuulub olemasoleva linna alasse."
	var spacing := AI_SPACING if settler.team > 0 else PLAYER_SPACING
	for city in cities:
		if maxi(abs(int(city.c)-int(settler.c)),abs(int(city.r)-int(settler.r))) < spacing:
			return "Linnakeskuste vahele peab jääma vähemalt %d ruutu." % spacing
	if absf(point.x)>42 or absf(point.y)>32: return "Vali linnakoht detailkaardi keskosas."
	for dx in [-4,0,4]:
		for dz in [-4,0,4]:
			if not passable.call(point.x+dx,point.y+dz): return "Linn vajab kuiva maad."
	for resource in resources:
		if resource.kind not in ["tree","berry","game","fish"] and not resource.get("removed",false) and absf(resource.x-point.x)<5 and absf(resource.z-point.y)<4:
			return "Kivimaardlale ei saa linna rajada."
	return ""

const Economy = preload("res://scripts/economy_rules.gd")
const Names = preload("res://scripts/village_names.gd")

static func found_city(state: Dictionary, settler: Dictionary, world: Dictionary) -> Dictionary:
	if not state.settlers.has(settler): return {"error":"Asunik puudub."}
	if settler.get("localTarget") != null: return {"error":"Oota asuniku saabumist."}
	var x := floori(float(settler.get("x",0))+0.5)
	var z := floori(float(settler.get("z",0))+0.5)
	var migration: Dictionary = state.get("migrationV274",{})
	if not migration.is_empty() and not migration.get("done",false) and state.time < migration.get("until",0):
		settler.chosenSiteV274 = {"c":settler.c,"r":settler.r,"x":x,"z":z}
		return {"chosen":true,"message":"Rahvasteränne: linnakoht on valitud. Linn rajatakse siia kiviaja alguses (%d s)." % maxi(0,ceili(migration.until-state.time))}
	var next_id := -1
	var city_number := 1
	var names: Array = []
	for city in state.cities:
		next_id = maxi(next_id,int(city.id))
		names.append(city.name)
		if city.team == settler.team: city_number += 1
	next_id += 1
	var economy := Economy.initial_state(state.seed)
	economy.settlers = []
	var team: int = settler.team
	var stock: Dictionary = Economy.DATA.data.start.duplicate(true)
	stock.merge({"wood":100,"stone":55,"plank":0,"gold":0,"water":40},true)
	if settler.has("cargo"): stock = settler.cargo.duplicate(true)
	economy.realms[team].resources = stock
	economy.realms[team].pop = 3
	economy.realms[team].growthProgress = 0
	economy.buildings = [{"type":"hall","x":x,"z":z,"team":team,"hp":1200,"ready":true}]
	economy.units = []
	economy.cargo = []
	var changed := false
	for resource in world.get("resources",[]):
		if resource.kind in ["tree","berry"] and not resource.get("removed",false) and absf(resource.x-x)<6.1 and absf(resource.z-z)<5.5:
			resource.removed = true
			resource.cleared = true
			resource.amount = 0
			changed = true
	if changed: world.revision = int(world.get("revision",0))+1
	var city := {"id":next_id,"team":team,"c":settler.c,"r":settler.r,"foundedAt":state.time,"name":Names.name_for(int(state.seed),team,city_number,names,state.get("factionNames",[])),"economy":economy,"world":world,"hp":600}
	state.cities.append(city)
	if state.has("tileWorlds"): state.tileWorlds.erase(str(int(settler.c))+":"+str(int(settler.r)))
	state.settlers.erase(settler)
	return {"city":city}

static func recruit_settler(state: Dictionary,city: Dictionary) -> Dictionary:
	if city.get("districtOf")!=null:
		var parent: Variant=null
		for candidate in state.get("cities",[]):
			if candidate.id==city.districtOf:parent=candidate;break
		if parent==null:return {"error":"Linna ei leitud."}
		return recruit_settler(state,parent)
	var team:=int(city.team)
	if "settlement" not in state.research[team].known:return {"error":"Uuri: "+str(ResearchRules.DATA.data.techs.settlement.name)}
	var realm: Dictionary=city.economy.realms[team];var cost={"wood":45,"stone":20,"bread":15}
	if not Economy.can_afford(realm.resources,cost) or float(realm.pop)<6:
		return {"error":"Asunik vajab 45 puitu, 20 kivi, 15 toitu ja vähemalt 6 elanikku (2 lähevad uude linna)."}
	Economy.spend_resources(realm.resources,cost);realm.pop-=2
	var cargo: Dictionary=Economy.DATA.data.start.duplicate(true)
	cargo.merge({"wood":65,"stone":35,"plank":0,"bread":22,"water":45,"gold":0},true)
	var next:=int(state.nextSettler);state.nextSettler=next+1
	var settler={"id":next,"team":team,"c":city.c,"r":city.r,"x":0,"z":0,"path":[],"landed":false,"localTarget":null,"cargo":cargo}
	state.settlers.append(settler)
	return {"settler":settler}

# Civilization.siteSuggestionsV280: candidate ordering and minimum spacing.
static func site_suggestions(state: Dictionary,band: Dictionary,cell_at: Callable,prepare: Callable=Callable()) -> Array:
	if band.is_empty() or band.get("embarked")!=null:return []
	var choices: Array=[]
	for dr in range(-7,8):
		for dc in range(-7,8):
			var cell: Variant=cell_at.call(int(band.c)+dc,int(band.r)+dr)
			if not cell is Dictionary or cell.is_empty() or not cell.get("land",false) or cell.get("mountain",false) or cell.get("river",false):continue
			var occupied:=false
			for city in state.get("cities",[]):
				if absi(int(city.c)-int(cell.c))+absi(int(city.r)-int(cell.r))<6:occupied=true;break
			if occupied:continue
			if prepare.is_valid():prepare.call(cell)
			var water:=0
			for y in range(-2,3):
				for x in range(-2,3):
					var neighbor: Variant=cell_at.call(int(cell.c)+x,int(cell.r)+y)
					if neighbor is Dictionary and (neighbor.get("river",false) or neighbor.get("lake",false) or neighbor.get("lakeOutletV275",false)):
						water=maxi(water,3-maxi(absi(x),absi(y)))
			var deposits: Dictionary=cell.get("deposits",{})
			var score: float=water*9+(8 if deposits.get("wood",false) else 0)+(6 if deposits.get("stone",false) else 0)+(5 if deposits.get("game",false) else 0)+(6 if deposits.get("grain",false) else 0)+(5 if cell.get("coast",false) else 0)-(absi(dc)+absi(dr))*1.2
			choices.append({"c":int(cell.c),"r":int(cell.r),"score":score,"water":water>0,"order":choices.size()})
	choices.sort_custom(func(a,b):return int(a.order)<int(b.order) if is_equal_approx(float(a.score),float(b.score)) else float(a.score)>float(b.score))
	var picked: Array=[]
	for p in choices:
		var apart:=true
		for q in picked:
			if absi(int(q.c)-int(p.c))+absi(int(q.r)-int(p.r))<4:apart=false;break
		if not apart:continue
		picked.append({"c":p.c,"r":p.r,"score":p.score,"water":p.water})
		if picked.size()==3:break
	return picked
