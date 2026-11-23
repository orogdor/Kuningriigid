class_name WorldRaids
extends RefCounted
const Discoveries=preload("res://scripts/world_discoveries.gd")
const INTERVAL:=420.0
const RANGE:=28

static func distance(a: Dictionary,b: Dictionary) -> int:
	return absi(int(a.c)-int(b.c))+absi(int(a.r)-int(b.r))

static func defence(state: Dictionary,town: Dictionary,age: int) -> Dictionary:
	var buildings: Array=town.economy.buildings.duplicate()
	for district in town.get("districts",{}).values():buildings.append_array(district.get("economy",{}).get("buildings",[]))
	var walls:=false
	for b in buildings:
		if b.type in ["palisade","watchtower","stonewall","stonetower","woodgate"] and b.get("ready",false) and float(b.get("hp",0))>0:walls=true;break
	var men:=0
	for unit in state.get("units",[]):
		if int(unit.team)==int(town.team) and float(unit.get("hp",0))>0 and unit.kind!="scout" and (unit.get("cityId")==null or int(unit.cityId)==int(town.id)):men+=1
	return {"full":walls or men>=2+age,"some":men>0}

static func tick(state: Dictionary,dt: float,peace: bool) -> Array:
	var messages: Array=[]
	if not state.has("raidsV276"):state.raidsV276=[]
	if peace:return messages
	for landmark in state.get("landmarks",[]):
		if Discoveries.village_type(landmark)!="raiders" or landmark.get("destroyedV276",false):continue
		landmark.raidClockV276=float(landmark.get("raidClockV276",Discoveries.text_hash(str(landmark.id)+"r")*INTERVAL))+dt
		var travelling:=false
		for raid in state.raidsV276:
			if raid.from==landmark.id:travelling=true;break
		if float(landmark.raidClockV276)<INTERVAL or travelling:continue
		var target: Dictionary={};var best:=RANGE+1
		for city in state.cities:
			if city.get("districtOf")!=null:continue
			var d:=distance(city,landmark)
			if d>RANGE or d>=best:continue
			var occupied:=false
			for raid in state.raidsV276:
				if raid.to==city.id:occupied=true;break
			if not occupied:target=city;best=d
		if target.is_empty():continue
		landmark.raidClockV276=0
		var eta:=40+best*6;var age:=Discoveries.village_age(state,landmark);var men:=3+age*2
		state.raidsV276.append({"id":str(landmark.id)+"@"+str(floori(float(state.time)+0.5)),"from":landmark.id,"to":target.id,"start":state.time,"eta":eta,"fc":landmark.c,"fr":landmark.r,"age":age,"men":men})
		if int(target.team)==0:messages.append({"warn":true,"text":"Hoiatus: Röövlite küla saatis %d-mehelise röövsalga %s poole! Saabub ~%d s pärast." % [men,target.name,eta]})
	for raid in state.raidsV276.duplicate():
		if float(state.time)-float(raid.start)<float(raid.eta):continue
		state.raidsV276.erase(raid)
		var town: Dictionary={}
		for city in state.cities:
			if city.id==raid.to:town=city;break
		if town.is_empty():continue
		var age:=int(raid.get("age",0));var guard:=defence(state,town,age)
		if guard.full:
			if int(town.team)==0:messages.append({"text":"Röövsalk löödi "+str(town.name)+" juures tagasi."})
			for landmark in state.landmarks:
				if landmark.id==raid.from:landmark.raidClockV276=-INTERVAL*0.5;break
			continue
		var share:=0.12 if guard.some else 0.25
		var realm: Dictionary=town.economy.realms[town.team];var resources: Dictionary=realm.resources
		var keys: Array=["bread","wood","stone","gold"]
		if age>=1:keys.append_array(["bronze","copper"])
		if age>=2:keys.append_array(["iron","weapons"])
		var taken:=PackedStringArray()
		for key in keys:
			var amount:=mini(60+age*30,floori(float(resources.get(key,0))*share))
			if amount>0:resources[key]=float(resources[key])-amount;taken.append("%d %s" % [amount,key])
		var captive: bool=not guard.some and float(realm.get("pop",0))>=5
		if captive:realm.pop-=1
		if int(town.team)==0:
			var goods: String=", ".join(taken) if not taken.is_empty() else "midagi polnud võtta"
			messages.append({"warn":true,"text":"Röövlid rüüstasid "+str(town.name)+": "+goods+(" ja viisid ühe elaniku vangi" if captive else "")+". Ehita palisaad/vahitorn või hoia linnas sõdalasi."})
	return messages

static func position(state: Dictionary,raid: Dictionary) -> Dictionary:
	var town: Dictionary={}
	for city in state.cities:
		if city.id==raid.to:town=city;break
	if town.is_empty():return {}
	var t:=clampf((float(state.time)-float(raid.start))/float(raid.eta),0,1)
	return {"c":lerpf(float(raid.fc),float(town.c),t),"r":lerpf(float(raid.fr),float(town.r),t),"heading":atan2(float(town.c)-float(raid.fc),float(town.r)-float(raid.fr))}
