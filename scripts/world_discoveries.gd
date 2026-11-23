class_name WorldDiscoveries
extends RefCounted

const Grid=preload("res://scripts/campaign_grid.gd")
const MASK:=0xffffffff
const DIRS:=[Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1)]

static func imul(a: int,b: int) -> int:
	var lo: int=(a&65535)*(b&65535)
	var mid: int=((a>>16)&65535)*(b&65535)+(a&65535)*((b>>16)&65535)
	return (lo+(mid<<16))&MASK

static func location_hash(a: int,b: int,seed: int) -> float:
	var value: int=imul((a+143)*374761393,(b+197)*668265263)^imul(seed,2246822519)
	value=imul(value^(value>>13),1274126177)
	return float((value^(value>>16))&MASK)/4294967296.0

static func text_hash(text: String) -> float:
	var value: int=2166136261
	for i in text.length():value=imul(value^text.unicode_at(i),16777619)
	return float(value)/4294967296.0

static func village_type(landmark: Dictionary) -> String:
	if landmark.get("kind")!="village":return ""
	return "raiders" if text_hash(str(landmark.id)+":kind")<0.42 else "traders"

static func village_layout(landmark: Dictionary) -> Array:
	var out: Array=[];var id:=str(landmark.id);var h:=text_hash(id)
	var add=func(type: String,x: float,z: float,angle: float):
		out.append({"type":type,"x":floorf(x+0.5),"z":floorf(z+0.5),"hp":1000,"ready":true,"team":-1,"buildingRotationV228":angle})
	add.call("hall",0,0,h*6.28)
	var houses:=6+floori(text_hash(id+"h")*3.0)
	for i in houses:
		var angle:=float(i)/houses*TAU+h*1.3
		var x:=cos(angle)*16;var z:=sin(angle)*14
		add.call("house",x,z,atan2(-x,-z))
	if village_type(landmark)=="raiders":
		add.call("barracks",0,-24,atan2(0,24));add.call("archery",22,-10,atan2(-22,10))
		for i in 36:
			var angle:=float(i)/36*TAU;var x:=cos(angle)*36;var z:=sin(angle)*36*0.86
			var tx:=-sin(angle)*36;var tz:=cos(angle)*36*0.86;var rotation:=atan2(-tz,tx)
			var kind: String="watchtower" if i in [5,14,23,32] else "woodgate" if i==9 else "palisade"
			out.append({"type":kind,"x":floorf(x*10+0.5)/10,"z":floorf(z*10+0.5)/10,"hp":1000,"ready":true,"team":-1,"wallAngleV175":rotation,"buildingRotationV228":rotation,"wallRingV278":true})
	else:
		for row in [["cellar",0.3],["cellar",2.4],["pottery_kiln",1.3],["farm",3.6],["farm",4.6],["well",5.5]]:
			var x:=cos(float(row[1]))*30;var z:=sin(float(row[1]))*26
			add.call(row[0],x,z,atan2(-x,-z))
	return out

static func create_landmarks(cells: Array,seed: int,starts: Array) -> Array:
	var candidates: Array=[]
	for cell in cells:
		if not cell.land or cell.mountain or cell.get("river",false) or float(cell.h)<=4 or float(cell.h)>=30:continue
		var near:=false
		for start in starts:
			if Vector2(float(cell.c)-float(start.c),float(cell.r)-float(start.r)).length()<5:near=true;break
		if near:continue
		candidates.append({"cell":cell,"hash":location_hash(int(cell.c),int(cell.r),seed),"order":candidates.size()})
	candidates.sort_custom(func(a,b):return int(a.order)<int(b.order) if float(a.hash)==float(b.hash) else float(a.hash)<float(b.hash))
	var result: Array=[];var village:=0;var ruins:=0
	for candidate in candidates:
		var cell: Dictionary=candidate.cell
		var kind: String="village" if village<19 and (not cell.get("coast",false) or ruins>=24) else "ruins"
		if (village if kind=="village" else ruins)>=(19 if kind=="village" else 24):continue
		var near:=false
		for found in result:
			if Vector2(float(found.c)-float(cell.c),float(found.r)-float(cell.r)).length()<10:near=true;break
		if near:continue
		if kind=="village":village+=1
		else:ruins+=1
		var number:=village if kind=="village" else ruins
		var reward: Dictionary=({"gold":30,"bread":12} if number%3==0 else {"wood":22,"bread":25}) if kind=="village" else ({"gold":55,"stone":15} if number%3==0 else {"science":35})
		result.append({"id":kind+"-"+str(number),"kind":kind,"c":int(cell.c),"r":int(cell.r),"claimedBy":null,"reward":reward})
		if village>=19 and ruins>=24:break
	return result

static func army_has_scout(state: Dictionary,army: Dictionary) -> bool:
	for unit in state.get("units",[]):
		if int(unit.team)==int(army.team) and float(unit.get("hp",0))>0 and not ArmyExperience.is_garrisoned(unit) and int(unit.get("armyId",0))==int(army.get("id",0)) and unit.kind=="scout":return true
	return false

static func frontier(c: int,r: int,seen: Dictionary) -> bool:
	for dr in range(-2,3):
		for dc in range(-2,3):
			if absi(dc)+absi(dr)>3:continue
			var x:=c+dc;var y:=r+dr
			if x>=0 and x<Grid.COLS and y>=0 and y<Grid.ROWS and not seen.has(str(x)+":"+str(y)):return true
	return false

static func exploration_path(state: Dictionary,grid: Array,army: Dictionary,passable: Callable) -> Variant:
	if army.is_empty() or not passable.call({"c":army.c,"r":army.r}):return null
	var seen: Dictionary=state.explored[army.team]
	var sites: Array=[]
	for landmark in state.get("landmarks",[]):
		var distance:=absi(int(army.c)-int(landmark.c))+absi(int(army.r)-int(landmark.r))
		if landmark.get("claimedBy") == null and seen.has(str(int(landmark.c))+":"+str(int(landmark.r))) and distance<=16:
			sites.append({"landmark":landmark,"distance":distance,"order":sites.size()})
	sites.sort_custom(func(a,b):return int(a.order)<int(b.order) if a.distance==b.distance else a.distance<b.distance)
	var start:=Vector2i(int(army.c),int(army.r))
	for site in sites:
		var goal:=Vector2i(int(site.landmark.c),int(site.landmark.r))
		var route: Variant=Grid.find_path(grid,start,goal,func(_cell,p):return passable.call({"c":p.x,"r":p.y}))
		if route!=null and not route.is_empty():
			var result: Array=[]
			for p in route:result.append({"c":p.x,"r":p.y})
			return result
	var total:=Grid.COLS*Grid.ROWS
	var previous:=PackedInt32Array();previous.resize(total);previous.fill(-2)
	var queue:=PackedInt32Array();queue.resize(total)
	var first:=start.y*Grid.COLS+start.x;var head:=0;var tail:=1
	queue[0]=first;previous[first]=-1
	while head<tail:
		var key:=queue[head];head+=1
		var c:=key%Grid.COLS;var r:=floori(float(key)/Grid.COLS)
		if key!=first and frontier(c,r,seen):
			var result: Array=[];var current:=key
			while current!=first:
				result.append({"c":current%Grid.COLS,"r":floori(float(current)/Grid.COLS)})
				current=previous[current]
			result.reverse();return result
		for direction in DIRS:
			var x: int=c+direction.x;var y: int=r+direction.y
			if x<0 or x>=Grid.COLS or y<0 or y>=Grid.ROWS:continue
			var index:=y*Grid.COLS+x
			if previous[index]!=-2 or not passable.call({"c":x,"r":y}):continue
			previous[index]=key;queue[tail]=index;tail+=1
	return null

static func collect(state: Dictionary,team: int,pos: Dictionary) -> Dictionary:
	var found: Dictionary={}
	for landmark in state.get("landmarks",[]):
		if landmark.get("claimedBy")==null and int(landmark.c)==int(pos.c) and int(landmark.r)==int(pos.r):found=landmark;break
	if found.is_empty() or village_type(found)=="raiders":return {}
	found.claimedBy=team;found.claimedAt=state.time
	var earned: Array[String]=[]
	for kind in found.reward:
		var amount: float=found.reward[kind]
		if kind=="science":
			var research: Dictionary=state.research[team]
			if research.active!=null:research.progress[research.active]=float(research.progress.get(research.active,0))+amount
			else:research.discoveryInsight=float(research.get("discoveryInsight",0))+amount
			earned.append("+%.0f teadust" % amount);continue
		var city: Dictionary={};var distance:=2147483647
		for candidate in state.get("cities",[]):
			if int(candidate.team)!=team:continue
			var d:=absi(int(candidate.c)-int(pos.c))+absi(int(candidate.r)-int(pos.r))
			if d<distance:city=candidate;distance=d
		var stock: Dictionary={}
		if not city.is_empty():stock=city.economy.realms[team].resources
		else:
			var person: Dictionary={}
			for candidate in state.get("settlers",[]):
				if int(candidate.team)==team:person=candidate;break
			if not person.is_empty():
				if not person.has("cargo"):person.cargo={}
				stock=person.cargo
			else:
				if not state.has("discoveryBank"):state.discoveryBank={}
				if not state.discoveryBank.has(str(team)):state.discoveryBank[str(team)]={}
				stock=state.discoveryBank[str(team)]
		stock[kind]=float(stock.get(kind,0))+amount
		earned.append("+%.0f %s" % [amount,{"bread":"toitu","wood":"puitu","stone":"kivi","gold":"kulda"}.get(kind,kind)])
	var title: String="Sõbralik küla" if found.kind=="village" else "Muistsed varemed"
	var message: String=title+" avastatud! "+", ".join(earned)+"."
	if team==0:
		if not state.has("events"):state.events=[]
		state.events.append({"time":state.time,"text":message})
		if state.events.size()>40:state.events.pop_front()
	return {"landmark":found,"text":message}

const TRADE_RANGE:=22
const BASE_OFFERS:=[
	{"id":"sell_wood","label":"Müü 20 puitu","give":{"wood":20},"get":{"gold":9}},
	{"id":"sell_stone","label":"Müü 20 kivi","give":{"stone":20},"get":{"gold":11}},
	{"id":"sell_pottery","label":"Müü 5 savinõud","give":{"pottery":5},"get":{"gold":14}},
	{"id":"buy_food","label":"Osta 25 toitu","give":{"gold":12},"get":{"bread":25}},
	{"id":"buy_clay","label":"Osta 15 savi","give":{"gold":8},"get":{"clay":15}},
	{"id":"buy_plank","label":"Osta 10 lauda","give":{"gold":10},"get":{"plank":10}},
	{"id":"buy_wood","label":"Osta 20 puitu","give":{"gold":12},"get":{"wood":20}},
	{"id":"buy_stone","label":"Osta 15 kivi","give":{"gold":12},"get":{"stone":15}}
]
const ERA_OFFERS:=[[],
	[{"id":"sell_copper","label":"Müü 10 vaske","give":{"copper":10},"get":{"gold":14}},{"id":"buy_tin","label":"Osta 6 tina","give":{"gold":15},"get":{"tin":6}},{"id":"buy_bronze","label":"Osta 5 pronksi","give":{"gold":22},"get":{"bronze":5}},{"id":"sell_cutstone","label":"Müü 10 tahutud kivi","give":{"cutstone":10},"get":{"gold":16}}],
	[{"id":"buy_iron","label":"Osta 8 rauda","give":{"gold":20},"get":{"iron":8}},{"id":"sell_weapons","label":"Müü 5 relva","give":{"weapons":5},"get":{"gold":26}},{"id":"buy_coal","label":"Osta 10 sütt","give":{"gold":12},"get":{"coal":10}}],
	[{"id":"buy_cloth","label":"Osta 6 riiet","give":{"gold":18},"get":{"cloth":6}},{"id":"sell_grain","label":"Müü 20 vilja","give":{"grain":20},"get":{"gold":12}}],
	[{"id":"buy_paper","label":"Osta 8 paberit","give":{"gold":20},"get":{"paper":8}},{"id":"buy_spices","label":"Osta 4 vürtsi","give":{"gold":24},"get":{"spices":4}}],
	[{"id":"buy_steel","label":"Osta 6 terast","give":{"gold":30},"get":{"steel":6}},{"id":"sell_machines","label":"Müü 3 masinat","give":{"machines":3},"get":{"gold":40}}],
	[{"id":"buy_fuel","label":"Osta 8 kütust","give":{"gold":28},"get":{"fuel":8}}]
]

static func distance(a: Dictionary,b: Dictionary) -> int:
	return absi(int(a.c)-int(b.c))+absi(int(a.r)-int(b.r))

static func village_age(state: Dictionary,landmark: Dictionary) -> int:
	var best:=2147483647;var nearest: Dictionary={}
	for city in state.get("cities",[]):
		if city.get("districtOf")!=null:continue
		var value:=distance(city,landmark)
		if value<best:best=value;nearest=city
	return clampi(int(state.ages[nearest.team]),0,6) if not nearest.is_empty() else 0

static func trade_offers(age: int) -> Array:
	var offers: Array=BASE_OFFERS.duplicate()
	for era in range(1,clampi(age,0,6)+1):offers=ERA_OFFERS[era].duplicate()+offers
	return offers.slice(0,12)

static func trade_town(state: Dictionary,landmark: Dictionary,team:=0) -> Dictionary:
	var nearest: Dictionary={};var best:=TRADE_RANGE+1
	for city in state.get("cities",[]):
		if int(city.team)!=team or city.get("districtOf")!=null:continue
		var value:=distance(city,landmark)
		if value<best:best=value;nearest=city
	return nearest

static func trade_with_village(state: Dictionary,landmark_id: String,offer_id: String,team:=0) -> Dictionary:
	var landmark: Dictionary={}
	for candidate in state.get("landmarks",[]):
		if str(candidate.id)==landmark_id:landmark=candidate;break
	if landmark.is_empty() or village_type(landmark)!="traders":return {"error":"See ei ole kaupmeeste küla."}
	if team>=state.explored.size() or not state.explored[team].has(str(int(landmark.c))+":"+str(int(landmark.r))):return {"error":"Küla pole veel avastatud."}
	var town:=trade_town(state,landmark,team)
	if town.is_empty():return {"error":"Ükski sinu linn pole küla lähedal (22 ruutu)."}
	var offer: Dictionary={}
	for candidate in trade_offers(village_age(state,landmark)):
		if candidate.id==offer_id:offer=candidate;break
	if offer.is_empty():return {"error":"Seda kaupa see küla praegu ei vaheta."}
	var stock: Dictionary=town.economy.realms[team].resources
	for key in offer.give:
		if float(stock.get(key,0))<float(offer.give[key]):return {"error":"Linnal "+str(town.name)+" pole piisavalt: "+str(key)+"."}
	for key in offer.give:stock[key]=float(stock.get(key,0))-float(offer.give[key])
	for key in offer.get:stock[key]=float(stock.get(key,0))+float(offer.get[key])
	landmark.tradesV276=int(landmark.get("tradesV276",0))+1
	return {"ok":true,"town":town.name,"text":str(offer.label)+" — "+str(town.name)}
