class_name BuildingOperations
extends RefCounted

const Nav=preload("res://scripts/local_navigation.gd")
const Farming=preload("res://scripts/farming.gd")
const Economy=preload("res://scripts/economy_rules.gd")
const Fortifications=preload("res://scripts/fortifications.gd")
const WALLS:=["palisade","stonewall","reinforced_wall"]
const GATES:=["woodgate","gatehouse"]

static func valid(state: Dictionary,city: Dictionary,building: Dictionary) -> bool:
	if int(city.get("team",-1))!=0 or state.get("battle")!=null or building.is_empty() or building.get("virtual",false) or float(building.get("hp",0))<=0:return false
	for item in city.economy.buildings:
		if is_same(item,building):return true
	return false

static func overlaps(a: Dictionary,ar: Variant,b: Dictionary,br: Variant) -> bool:
	return ar!=null and br!=null and absf(float(a.x)-float(b.x))<float(ar.rx)+float(br.rx)-0.15 and absf(float(a.z)-float(b.z))<float(ar.rz)+float(br.rz)-0.15

static func rotate(state: Dictionary,city: Dictionary,building: Dictionary,passable: Callable) -> Dictionary:
	if not valid(state,city,building):return {"error":"Vali oma linna hoone."}
	if building.type in ["bridge","fisher","harbor"] or building.has("landEntry") or building.has("accessEntry"):return {"error":"Selle ehitise asend sõltub maastikust või põllu kujust."}
	if building.get("wallUpgradeV184")!=null:return {"error":"Oota müüri uuendamise lõppu."}
	if state.has("units") and not Fortifications.guards(state,city,building).is_empty():return {"error":"Kutsu esmalt müüril olevad sõdurid tagasi."}
	var candidate:=building.duplicate(true);var old: Variant=Nav.clearance(building)
	if building.type=="field":
		var dimensions:=Farming.field_size(building)
		candidate.width=dimensions.width if building.get("freeRotationV243",false) else dimensions.depth
		candidate.depth=dimensions.depth if building.get("freeRotationV243",false) else dimensions.width
		candidate.buildingRotationV228=fposmod(float(building.get("buildingRotationV228",0))+PI/2,TAU)
		var context:=city.duplicate();var economy: Dictionary=city.economy.duplicate();var others: Array=[]
		for other in city.economy.buildings:
			if not is_same(other,building):others.append(other)
		economy.buildings=others;context.economy=economy
		var error:=Farming.validate(context,candidate,passable)
		if not error.is_empty():return {"error":error}
		building.merge(candidate,true);city.world.revision=int(city.world.get("revision",0))+1;return {"ok":true}
	if building.type in WALLS or building.type in GATES:
		candidate.wallAngleV175=float(building.get("wallAngleV175",PI/2 if building.get("wallAxis",false) else 0))+PI/2
		if building.has("buildingRotationV228"):candidate.buildingRotationV228=fposmod(float(building.buildingRotationV228)+PI/2,TAU)
		candidate.wallAxis=0 if building.get("wallAxis",false) else 1
		if building.type in WALLS:
			candidate.navWidth=0;candidate.navDepth=0
			var wall:=Nav.wall_footprint(candidate,0.6);candidate.navWidth=wall.rx;candidate.navDepth=wall.rz
	else:candidate.buildingRotationV228=fposmod(float(building.get("buildingRotationV228",0))+PI/2,TAU)
	var next: Variant=Nav.clearance(candidate)
	if next!=null:
		for other in city.economy.buildings:
			if is_same(other,building) or other.get("virtual",false) or float(other.get("hp",0))<=0:continue
			var footprint: Variant=Nav.clearance(other)
			if overlaps(candidate,next,other,footprint) and not overlaps(building,old,other,footprint):return {"error":"Pööratud hoone jaoks pole piisavalt ruumi."}
		for x in [-float(next.rx),float(next.rx)]:
			for z in [-float(next.rz),float(next.rz)]:
				if not passable.call(float(building.x)+x,float(building.z)+z):return {"error":"Pööratud hoone ulatuks ebasobivale maapinnale."}
	building.merge(candidate,true);city.world.revision=int(city.world.get("revision",0))+1
	return {"ok":true}

static func remap_index(value: Variant,removed: int,hall: int) -> Variant:
	if not value is int and not value is float:return value
	var index:=int(value)
	return maxi(0,hall) if index==removed else index-1 if index>removed else index

static func house_upgrade_preview(state: Dictionary,city: Dictionary,building: Dictionary,allow_ai:=false) -> Dictionary:
	var eligible:bool=valid(state,city,building)
	if allow_ai:eligible=not building.is_empty() and not building.get("virtual",false) and float(building.get("hp",0))>0 and building in city.economy.buildings
	if not eligible or building.type!="house" or not building.get("ready",false) or int(building.get("houseUpgradeLevelV218",0))>=1:
		return {"error":"Seda elamut ei saa enam täiustada."}
	if city.has("districtOf"):
		return {"error":"Elamu peab asuma peamaja ruudul."}
	if int(state.ages[city.team])<4:
		var plan: Variant=city.get("stoneDefensePlanV166")
		if not plan is Dictionary:plan=city.get("defensePlanV139",{})
		var outline: Array=plan.get("outlineV176",[]) if plan is Dictionary else []
		var inside:=false
		if outline.size()>=3:
			var j:=outline.size()-1
			for i in outline.size():
				var a: Dictionary=outline[i];var b: Dictionary=outline[j]
				if (float(a.z)>float(building.z))!=(float(b.z)>float(building.z)) and float(building.x)<(float(b.x)-float(a.x))*(float(building.z)-float(a.z))/(float(b.z)-float(a.z))+float(a.x):inside=not inside
				j=i
		if not inside:return {"error":"Enne renessanssi saab täiustada ainult vana linnamüüri sees olevaid elamuid."}
	var cost: Dictionary={}
	for key in Economy.DATA.data.buildings.house.cost:
		var amount:=float(Economy.DATA.data.buildings.house.cost[key])
		if amount>0:cost[key]=ceili(amount*0.5)
	return {"cost":cost,"capacityMultiplier":2,"level":1}

static func upgrade_house(state: Dictionary,city: Dictionary,building: Dictionary,allow_ai:=false) -> Dictionary:
	var plan:=house_upgrade_preview(state,city,building,allow_ai)
	if plan.has("error"):return plan
	var stock: Dictionary=city.economy.realms[city.team].resources
	if not Economy.can_afford(stock,plan.cost):return {"error":"Elamu täiustamiseks ei jätku materjale."}
	Economy.spend_resources(stock,plan.cost);building.houseUpgradeLevelV218=1
	return {"upgrade":true,"cost":plan.cost,"capacityMultiplier":2}

static func remove(state: Dictionary,city: Dictionary,building: Dictionary) -> Dictionary:
	if not valid(state,city,building) or building.type=="hall":return {"error":"Peahoonet ei saa kustutada."}
	if state.has("units") and not Fortifications.guards(state,city,building).is_empty():return {"error":"Kutsu esmalt müüril olevad sõdurid tagasi."}
	if building.type=="bridge":return {"error":"Silla kustutamine ei ole praegu toetatud."}
	var buildings: Array=city.economy.buildings;var removed: int=-1
	for i in buildings.size():
		if is_same(buildings[i],building):removed=i;break
	if removed<0:return {"error":"Vali oma linna hoone."}
	buildings.remove_at(removed)
	var hall: int=-1
	for i in buildings.size():
		if buildings[i].type=="hall" and int(buildings[i].team)==int(city.team):hall=i;break
	for other in buildings:
		if other.get("parent")!=null:other.parent=remap_index(other.parent,removed,hall)
	for cargo in city.economy.get("cargo",[]):
		if cargo.get("parent")!=null:cargo.parent=remap_index(cargo.parent,removed,hall)
	var parent:Dictionary=city
	if city.has("districtOf"):
		for candidate in state.get("cities",[]):
			if int(candidate.get("id",-1))==int(city.districtOf):parent=candidate;break
	for agent in parent.get("builderAgents",[]):
		agent.job=null;agent.materialJob=null;agent.materialDepot=null
	# This port indexes workplace agents by building index; preserve their
	# identity when later buildings shift left in the array.
	var workers: Dictionary=city.world.get("workers",{});var remapped: Dictionary={}
	for key in workers:
		var value: Dictionary=workers[key];var text:=str(key);var prefix:="";var suffix:="";var part:=text
		if text.begins_with("job:"):prefix="job:";part=text.trim_prefix(prefix)
		elif text.begins_with("farm:"):
			var pieces:=text.split(":")
			if pieces.size()==3:prefix="farm:";part=pieces[1];suffix=":"+pieces[2]
		if part.is_valid_int():
			var old:=int(part)
			if old==removed:continue
			if old>removed:part=str(old-1)
			if value.has("building"):value.building=remap_index(value.building,removed,hall)
		remapped[prefix+part+suffix]=value
	city.world.workers=remapped
	city.world.revision=int(city.world.get("revision",0))+1
	return {"ok":true}


# Upgrade costs and times follow wallUpgradeOptionsV184 and wood-fort-levels-v1757.
static func wall_upgrade_plan(state: Dictionary,city: Dictionary,building: Dictionary,target: String,rule: Callable) -> Dictionary:
	if building.is_empty() or float(building.get("hp",0))<=0 or not building.get("ready",false) or building.get("disabled",false) or building.get("wallUpgradeV184")!=null or not city.economy.buildings.has(building):return {"error":"Seda ehitist ei saa praegu uuendada."}
	var type:=str(building.type);var tier:=0
	if target=="stone":type=str({"palisade":"stonewall","woodgate":"gatehouse","watchtower":"stonetower","stonewall":"reinforced_wall"}.get(type,""))
	elif type in ["palisade","woodgate"] and int(building.get("woodFortTierV1757",1))!=2:tier=2
	else:return {"error":"Kõrgemat müüritaset pole saadaval."}
	if type.is_empty() or not Economy.DATA.data.buildings.has(type):return {"error":"Sellele rajatisele pole uuendust."}
	if type!=building.type:
		var locked:String=rule.call(type)
		if not locked.is_empty():return {"error":locked}
	var definition:Dictionary=Economy.DATA.data.buildings[type]
	var base:Dictionary=definition.cost.duplicate(true);var original:Dictionary={}
	if tier==2:
		original=definition.cost
		if type=="palisade":base.wood=12;base.stone=2
		elif type=="woodgate":base.wood=18;base.stone=4
	var span:=maxf(1.0,float(building.get("palisadeSpanV167",7))/7.0) if type in WALLS else 1.0
	var cost:Dictionary={}
	for material in base:
		var amount:=ceili(maxf(0,float(base[material])-float(original.get(material,0)))*0.75*span)
		if amount>0:cost[material]=amount
	var duration:float=24 if tier==2 and type=="palisade" else 29 if tier==2 and type=="woodgate" else float(definition.time)
	return {"type":type,"tier":tier,"cost":cost,"total":maxf(6,ceilf(duration*0.75*span))*Economy.tempo_factor(state)}

static func upgrade_wall(state: Dictionary,city: Dictionary,building: Dictionary,target: String,rule: Callable) -> Dictionary:
	var plan:=wall_upgrade_plan(state,city,building,target,rule)
	if plan.has("error"):return plan
	var stock:Dictionary=city.economy.realms[city.team].resources
	if not Economy.can_afford(stock,plan.cost):return {"error":"Uuenduseks ei jätku materjale."}
	Economy.spend_resources(stock,plan.cost);var materials:=0.0
	for amount in plan.cost.values():materials+=float(amount)
	var upgrade:Dictionary={"type":building.type,"targetType":plan.type,"targetTier":plan.tier,"x":building.x,"z":building.z,"team":building.team,"progress":0,"total":plan.total,"materialsRemaining":materials,"materialsTotal":materials}
	for key in ["wallAxis","wallAngleV175","palisadeSpanV167","navWidth","navDepth"]:
		if building.has(key):upgrade[key]=building[key]
	building.wallUpgradeV184=upgrade;return {"upgrade":upgrade,"cost":plan.cost}

static func finish_wall_upgrade(owner: Dictionary) -> void:
	var upgrade:Dictionary=owner.wallUpgradeV184
	if owner.get("extendedPalisadeV166",false) and not owner.get("palisadeSpanV167",0) and owner.type in WALLS:owner.palisadeSpanV167=14
	owner.type=upgrade.targetType
	if int(upgrade.get("targetTier",0))>0:owner.woodFortTierV1757=upgrade.targetTier
	else:owner.erase("woodFortTierV1757")
	owner.erase("wallUpgradeV184")
