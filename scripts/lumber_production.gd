class_name LumberProduction
extends RefCounted
const Gather=preload("res://scripts/gather_rules.gd")
const Nav=preload("res://scripts/local_navigation.gd")
const Econ=preload("res://scripts/economy_rules.gd")
const Needs=preload("res://scripts/city_needs.gd")
const Minerals=preload("res://scripts/mineral_sites.gd")
const Fisheries=preload("res://scripts/fishery.gd")
const Bonuses=preload("res://scripts/production_bonuses.gd")
const FarmingScript=preload("res://scripts/farming.gd")
const ForestryScript=preload("res://scripts/forestry.gd")
var farm_sim=FarmingScript.new()
var worker_navs: Dictionary={}
var cargo_navs: Dictionary={}
var next_cargo_id:=1
var seen_revision: int=-1

func synchronize(base: LocalNavigation,world: Dictionary,buildings: Array) -> void:
	base.bind_world(world)
	base.rebuild(buildings,world.resources)
	worker_navs.clear();cargo_navs.clear()
	farm_sim.worker_navs.clear()
	seen_revision=int(world.get("revision",0))

func actor_nav(cache: Dictionary,key: String,base: LocalNavigation) -> LocalNavigation:
	if not cache.has(key):cache[key]=base.clone_for_agent()
	var nav: LocalNavigation=cache[key]
	nav.trail_time=base.trail_time
	return nav

static func team_cargo(cargo: Array,team: int) -> Array:
	var result: Array=[]
	for item in cargo:
		if item.team==team:result.append(item)
	return result

var city_wide_buildings: Array=[]

func tick(state: Dictionary,city: Dictionary,base: LocalNavigation,dt: float,cells: Array,basic_dt: float=-1.0) -> bool:
	var changed:=false
	var world: Dictionary=city.world
	var economy: Dictionary=city.economy
	var realm: Dictionary=economy.realms[city.team]
	var terrain_modifiers:=Bonuses.terrain(cells,city)
	if ForestryScript.natural_regrowth(state,world,dt,economy.buildings)>0:changed=true
	# On reload, continue above all persisted cargo IDs so their paths stay separate.
	for cargo in economy.cargo:
		if cargo.has("portCargoId"):next_cargo_id=maxi(next_cargo_id,int(cargo.portCargoId)+1)
	for worker in world.get("workers",{}).values():
		worker.working=false
		worker.moving=false
		if worker.get("kind")=="farm":worker.visible=false
	for resource in world.resources:
		if resource.has("respawnAt") and float(resource.respawnAt)<=float(economy.time):
			resource.removed=false
			resource.amount=resource.get("capacity",96)
			resource.erase("respawnAt")
			world.revision=int(world.get("revision",0))+1
			changed=true
	if int(world.get("revision",0))!=seen_revision:synchronize(base,world,economy.buildings)
	for well in economy.buildings:
		if well.type!="well" or not well.get("ready",false) or well.get("disabled",false) or float(well.get("hp",0))<=0:continue
		var pending_water:=0.0
		for cargo in economy.cargo:
			if cargo.team==city.team and cargo.key=="water":pending_water+=cargo.amount
		var water_full:=float(realm.resources.get("water",0))+pending_water>=Econ.storage_limit(city_wide_buildings if not city_wide_buildings.is_empty() else economy.buildings,"water")
		var well_assigned:=float(well.get("assigned",0))
		if well_assigned>0 and float(realm.resources.get("water",0))+pending_water<Econ.storage_limit(city_wide_buildings if not city_wide_buildings.is_empty() else economy.buildings,"water"):
			var hall_for_worker: Variant=null
			for b in economy.buildings:
				if b.type=="hall" and b.get("ready",false):hall_for_worker=b;break
			if hall_for_worker!=null:
				if not world.has("workers"):world.workers={}
				var worker_id:="job:"+str(economy.buildings.find(well))
				if not world.workers.has(worker_id):
					var start: Variant=base.nearest(Nav.door(hall_for_worker))
					if start!=null:world.workers[worker_id]={"x":start.x,"z":start.z,"team":city.team,"kind":"well"}
				if world.workers.has(worker_id):
					var worker: Dictionary=world.workers[worker_id]
					var nav:=actor_nav(worker_navs,worker_id,base)
					var bonus: float=Bonuses.workplace(state,city,"well",terrain_modifiers,city_wide_buildings)
					var work_dt: float=dt*well.efficiency*bonus
					if nav.move(worker,Nav.door(well),work_dt,3.0,true):
						worker.working=true;worker.action="water"
						worker.heading=atan2(well.x-worker.x,well.z-worker.z)
						well.status="Toodab vett"
						well.timer=float(well.get("timer",0))+work_dt/4.5
						var definition: Dictionary=Econ.DATA.data.buildings.well
						if well.timer+0.00000001>=float(definition.cycle):
							well.timer=maxf(0,well.timer-definition.cycle)
							var p:=Nav.door(well)
							economy.cargo.append({"x":p.x,"z":p.z,"key":"water","amount":definition.rate,"parent":well.get("parent",0),"team":city.team,"portCargoId":next_cargo_id})
							next_cargo_id+=1;changed=true
		elif water_full:well.status="Veehoidla täis"
		else:well.status="Ootab tööjõudu"
	for fisher in economy.buildings:
		if fisher.type!="fisher" or not fisher.get("ready",false) or fisher.get("disabled",false) or float(fisher.get("hp",0))<=0:continue
		var full:=not Econ.food_production_allowed(realm.resources,team_cargo(economy.cargo,city.team),"fish",float(Econ.DATA.data.buildings.fisher.rate),Econ.storage_limit(city_wide_buildings if not city_wide_buildings.is_empty() else economy.buildings,"fish"))
		var fisher_assigned:=float(fisher.get("assigned",0))
		if fisher_assigned>0 and not full:
			var bonus: float=Bonuses.workplace(state,city,"fisher",terrain_modifiers,city_wide_buildings)
			var amount:=Fisheries.harvest(cells,state,city,fisher,Econ.DATA.data.buildings.fisher,dt*fisher.efficiency*bonus,base)
			if amount>0:
				var p:=Nav.door(fisher)
				economy.cargo.append({"x":p.x,"z":p.z,"key":"fish","amount":amount,"parent":fisher.get("parent",0),"team":city.team,"portCargoId":next_cargo_id})
				next_cargo_id+=1;changed=true
		elif full:fisher.status="Toiduladu täis"
		else:fisher.status="Ootab tööjõudu"
	for hunter in economy.buildings:
		if hunter.type!="hunter" or not hunter.get("ready",false) or hunter.get("disabled",false) or float(hunter.get("hp",0))<=0:continue
		var food_full:=not Econ.food_production_allowed(realm.resources,team_cargo(economy.cargo,city.team),"meat",float(Econ.DATA.data.buildings.hunter.rate),Econ.storage_limit(city_wide_buildings if not city_wide_buildings.is_empty() else economy.buildings,"meat"))
		var hunter_assigned:=float(hunter.get("assigned",0))
		if hunter_assigned>0 and not food_full:
			var bonus: float=Bonuses.workplace(state,city,"hunter",terrain_modifiers,city_wide_buildings)
			var nav:=actor_nav(worker_navs,str(economy.buildings.find(hunter)),base)
			var amount:=Gather.gather_tree(economy,world,hunter,dt*hunter.efficiency*bonus,nav)
			if amount>0:
				var p:=Nav.door(hunter)
				economy.cargo.append({"x":p.x,"z":p.z,"key":"meat","amount":amount,"parent":hunter.get("parent",0),"team":city.team,"portCargoId":next_cargo_id})
				next_cargo_id+=1;changed=true
		elif food_full:hunter.status="Toiduladu täis"
		else:hunter.status="Ootab tööjõudu"
	for farm in economy.buildings:
		if farm.type!="farm" or not farm.get("ready",false) or farm.get("disabled",false) or float(farm.get("hp",0))<=0:continue
		var full:=not Econ.food_production_allowed(realm.resources,team_cargo(economy.cargo,city.team),"grain",float(Econ.DATA.data.buildings.farm.rate),Econ.storage_limit(city_wide_buildings if not city_wide_buildings.is_empty() else economy.buildings,"grain"))
		if float(farm.get("assigned",0))>0 and not full:
			var bonus: float=Bonuses.workplace(state,city,"farm",terrain_modifiers,city_wide_buildings)
			var work_dt:=dt*float(farm.efficiency)*bonus
			farm.timer=float(farm.get("timer",0))+farm_sim.work(state,city,farm,work_dt,base)/4.5
			var definition: Dictionary=Econ.DATA.data.buildings.farm
			if farm.timer+0.00000001>=float(definition.cycle):
				farm.timer=maxf(0,farm.timer-definition.cycle)
				var p:=Nav.door(farm)
				economy.cargo.append({"x":p.x,"z":p.z,"key":"grain","amount":definition.rate,"parent":farm.get("parent",0),"team":city.team,"portCargoId":next_cargo_id})
				next_cargo_id+=1;changed=true
		elif full:farm.status="Toiduladu täis"
		else:farm.status="Ootab tööjõudu"
	for building in economy.buildings:
		if building.type not in ["saw","mill","bakery","pottery_kiln","mason","bronze_foundry","cartwright","coal","smelter","smith","vegetable_garden","orchard","dairy","spice_garden","coffee_farm","flax_farm","silk_farm","dye_garden","cocoa_farm","rubber_farm","weaver","jeweler","silk_weaver","perfumery","chocolatier","electronics_factory","pasture","printer","nitrate","powdermill","steelworks","engineworks","refinery","powerplant","autofactory","watermill","windmill","master_workshop","armor_workshop"] or not building.get("ready",false) or building.get("disabled",false) or float(building.get("hp",0))<=0:continue
		var definition: Dictionary=Econ.DATA.data.buildings[building.type]
		var key: String=definition.out
		var ingredients: Dictionary=definition.get("input",{})
		var incoming:=0.0
		for cargo in economy.cargo:
			if cargo.team==city.team and cargo.key==key:incoming+=float(cargo.amount)
		var cap:=Econ.storage_limit(city_wide_buildings if not city_wide_buildings.is_empty() else economy.buildings,key)
		var full:=not Econ.food_production_allowed(realm.resources,team_cargo(economy.cargo,city.team),key,float(definition.rate),cap,ingredients) if key in Econ.DATA.data.food_keys else float(realm.resources.get(key,0))+incoming>=cap
		if full:building.status="Ladu täis";continue
		if not Econ.can_afford(realm.resources,ingredients):building.status="Ootab toorainet";continue
		if float(building.get("assigned",0))<=0:building.status="Ootab tööjõudu";continue
		var hall_for_worker: Variant=null
		for b in economy.buildings:
			if b.type=="hall" and b.get("ready",false):hall_for_worker=b;break
		if hall_for_worker==null:continue
		if not world.has("workers"):world.workers={}
		var worker_id:="job:"+str(economy.buildings.find(building))
		if not world.workers.has(worker_id):
			var start: Variant=base.nearest(Nav.door(hall_for_worker))
			if start!=null:world.workers[worker_id]={"x":start.x,"z":start.z,"team":city.team,"kind":building.type}
		if not world.workers.has(worker_id):continue
		var worker: Dictionary=world.workers[worker_id]
		var nav:=actor_nav(worker_navs,worker_id,base)
		var work_dt:=dt*float(building.efficiency)*Bonuses.workplace(state,city,building.type,terrain_modifiers,city_wide_buildings)
		if not nav.move(worker,Nav.door(building),work_dt,3.0,true):building.status="Töötaja liigub kohale";continue
		worker.working=true;worker.action={"saw":"saw","mill":"mill","bakery":"bake","pottery_kiln":"pottery","mason":"build","vegetable_garden":"farm","orchard":"farm","spice_garden":"farm","coffee_farm":"farm","flax_farm":"farm","silk_farm":"farm","dye_garden":"farm","cocoa_farm":"farm","rubber_farm":"farm","pasture":"herd","master_workshop":"saw","armor_workshop":"work"}.get(building.type,"work")
		worker.heading=atan2(building.x-worker.x,building.z-worker.z)
		building.status="Toodab";building.timer=float(building.get("timer",0))+work_dt/4.5
		if building.timer+0.00000001>=float(definition.cycle):
			building.timer=maxf(0,building.timer-definition.cycle)
			Econ.spend_resources(realm.resources,ingredients)
			if key=="power":
				realm.resources.power=minf(cap,float(realm.resources.get("power",0))+float(definition.rate));changed=true;continue
			var p:=Nav.door(building)
			economy.cargo.append({"x":p.x,"z":p.z,"key":key,"amount":definition.rate,"parent":building.get("parent",0),"team":city.team,"portCargoId":next_cargo_id})
			next_cargo_id+=1;changed=true
	for study in economy.buildings:
		if study.type not in ["study","scriptorium","library","academy","school","university","monastery","chapel","observatory","public_school","high_school","polytechnic","laboratory"] or not study.get("ready",false) or study.get("disabled",false) or float(study.get("hp",0))<=0:continue
		if float(study.get("assigned",0))<=0:study.researchActivity=0;study.status="Ootab tööjõudu";continue
		var hall_for_worker: Variant=null
		for b in economy.buildings:
			if b.type=="hall" and b.get("ready",false):hall_for_worker=b;break
		if hall_for_worker==null:continue
		if not world.has("workers"):world.workers={}
		var worker_id:="job:"+str(economy.buildings.find(study))
		if not world.workers.has(worker_id):
			var start: Variant=base.nearest(Nav.door(hall_for_worker))
			if start!=null:world.workers[worker_id]={"x":start.x,"z":start.z,"team":city.team,"kind":study.type}
		if not world.workers.has(worker_id):continue
		var worker: Dictionary=world.workers[worker_id];var nav:=actor_nav(worker_navs,worker_id,base)
		var work_dt:=dt*float(study.efficiency)*Bonuses.workplace(state,city,study.type,terrain_modifiers,city_wide_buildings)
		var arrived:=nav.move(worker,Nav.door(study),work_dt,3.0,true)
		study.researchActivity=1.0 if arrived and work_dt>0 else 0.0
		study.status="Õpetlased uurivad" if arrived else "Õpetlased liiguvad töökohale"
		if arrived:worker.working=true;worker.action="study";worker.heading=atan2(study.x-worker.x,study.z-worker.z)
	for lumber in economy.buildings:
		if lumber.type!="lumber" or not lumber.get("ready",false) or lumber.get("disabled",false) or float(lumber.get("hp",0))<=0:continue
		var stock: Dictionary=realm.resources
		var pending_wood:=0.0
		for cargo in economy.cargo:
			if cargo.team==city.team and cargo.key=="wood":pending_wood+=cargo.amount
		var wood_full:=float(stock.get("wood",0))+pending_wood>=Econ.storage_limit(city_wide_buildings if not city_wide_buildings.is_empty() else economy.buildings,"wood")
		var assigned: float=lumber.get("assigned",0)
		if assigned>0 and float(stock.get("wood",0))+pending_wood<Econ.storage_limit(city_wide_buildings if not city_wide_buildings.is_empty() else economy.buildings,"wood"):
			var bonus: float=Bonuses.workplace(state,city,"lumber",terrain_modifiers,city_wide_buildings)
			var worker_dt: float = dt*lumber.efficiency*bonus
			var id:=str(economy.buildings.find(lumber))
			var nav:=actor_nav(worker_navs,id,base)
			var amount:=Gather.gather_tree(economy,world,lumber,worker_dt,nav)
			if amount>0:
				var p:=Nav.door(lumber)
				economy.cargo.append({"x":p.x,"z":p.z,"key":"wood","amount":amount,"parent":lumber.get("parent",0),"team":city.team,"portCargoId":next_cargo_id})
				next_cargo_id+=1;changed=true
		elif wood_full:lumber.status="Ladu täis: Puit"
		else:lumber.status="Ootab tööjõudu"
	for mine in economy.buildings:
		if not Minerals.TYPES.has(mine.type) or not mine.get("ready",false) or mine.get("disabled",false) or float(mine.get("hp",0))<=0:continue
		var definition: Dictionary=Econ.DATA.data.buildings[mine.type]
		var output: String=definition.out
		var incoming:=0.0
		for cargo in economy.cargo:
			if cargo.team==city.team and cargo.key==output:incoming+=float(cargo.amount)
		var full:=float(realm.resources.get(output,0))+incoming>=Econ.storage_limit(city_wide_buildings if not city_wide_buildings.is_empty() else economy.buildings,output)
		var ingredients: Dictionary=definition.get("input",{})
		if float(mine.get("assigned",0))>0 and not full and Econ.can_afford(realm.resources,ingredients):
			var hall_for_worker: Variant=null
			for b in economy.buildings:
				if b.type=="hall" and b.get("ready",false):hall_for_worker=b;break
			if hall_for_worker!=null:
				if not world.has("workers"):world.workers={}
				var worker_id:="job:"+str(economy.buildings.find(mine))
				if not world.workers.has(worker_id):
					var start: Variant=base.nearest(Nav.door(hall_for_worker))
					if start!=null:world.workers[worker_id]={"x":start.x,"z":start.z,"team":city.team,"kind":mine.type}
				if world.workers.has(worker_id):
					var worker: Dictionary=world.workers[worker_id]
					var nav:=actor_nav(worker_navs,worker_id,base)
					worker.working=false
					var work_dt: float=dt*float(mine.efficiency)*Bonuses.workplace(state,city,mine.type,terrain_modifiers,city_wide_buildings)
					if nav.move(worker,Nav.door(mine),work_dt,3.0,true):
						worker.working=true;worker.action="dig" if mine.type=="claypit" and state.ages[city.team]==0 else "mine"
						worker.heading=atan2(mine.x-worker.x,mine.z-worker.z)
						var mined:=Minerals.harvest(world,mine,definition,work_dt,1.0/4.5)
						if mined>0:
							Econ.spend_resources(realm.resources,ingredients)
							var p:=Nav.door(mine)
							economy.cargo.append({"x":p.x,"z":p.z,"key":output,"amount":mined,"parent":mine.get("parent",0),"team":city.team,"portCargoId":next_cargo_id})
							next_cargo_id+=1;changed=true
		elif full:mine.status="Ladu täis: "+str(Econ.DATA.data.resource_names.get(output,output))
		elif not Econ.can_afford(realm.resources,ingredients):mine.status="Ootab toorainet"
		else:mine.status="Ootab tööjõudu"
	for forester in economy.buildings:
		if forester.type!="forester" or not forester.get("ready",false) or forester.get("disabled",false) or float(forester.get("hp",0))<=0:continue
		if float(forester.get("assigned",0))<=0:forester.status="Ootab tööjõudu";continue
		var id:=str(economy.buildings.find(forester));var nav:=actor_nav(worker_navs,id,base)
		var work_dt:=dt*float(forester.efficiency)*Bonuses.workplace(state,city,"forester",terrain_modifiers,city_wide_buildings)
		ForestryScript.plant(economy,world,forester,work_dt,nav)
	if tick_basic(city,base,city.get("basicAssigned",{}),basic_dt if basic_dt>=0 else dt,state):changed=true
	if int(world.get("revision",0))!=seen_revision:synchronize(base,world,economy.buildings);changed=true
	var hall: Variant=null
	for b in economy.buildings:
		if b.type=="hall" and b.get("ready",false):hall=b;break
	if hall==null:return changed
	for cargo in economy.cargo.duplicate():
		if not Econ.DATA.data.resource_names.has(cargo.get("key","")):continue
		if not cargo.has("portCargoId"):cargo.portCargoId=next_cargo_id;next_cargo_id+=1
		var id:=str(int(cargo.portCargoId))
		var nav:=actor_nav(cargo_navs,id,base)
		var depot_type: String="warehouse" if cargo.key in Econ.DATA.data.material_keys else ("cellar" if cargo.key in Econ.DATA.data.food_keys else "")
		var depot: Variant=null
		if not depot_type.is_empty():
			for b in economy.buildings:
				if b.type==depot_type and b.team==cargo.team and b.get("ready",false) and float(b.get("hp",0))>0:depot=b;break
		var parent_index: int=int(cargo.get("parent",-1))
		var target: Dictionary=depot if depot!=null else (economy.buildings[parent_index] if parent_index>=0 and parent_index<economy.buildings.size() else hall)
		if nav.move(cargo,Nav.door(target),dt,4.0,true):
			if depot==null and target.has("parent") and target.parent!=null:
				cargo.parent=target.parent
				continue
			var key: String=cargo.key
			var used: float=Needs.food_total(realm.resources) if key in Econ.DATA.data.food_keys else float(realm.resources.get(key,0))
			var free:=maxf(0,Econ.storage_limit(city_wide_buildings if not city_wide_buildings.is_empty() else economy.buildings,key)-used)
			var unloaded:=minf(float(cargo.amount),free)
			realm.resources[key]=float(realm.resources.get(key,0))+unloaded
			cargo.amount-=unloaded
			if unloaded>0:record_delivery(realm,economy.time,key,unloaded);changed=true
			if cargo.amount<=0.00001:economy.cargo.erase(cargo);cargo_navs.erase(id)
			else:cargo.status="Ladu täis"
	return changed

func tick_basic(city: Dictionary,base: LocalNavigation,assigned: Dictionary,dt: float,state: Dictionary) -> bool:
	var economy: Dictionary=city.economy
	var world: Dictionary=city.world
	var stock: Dictionary=economy.realms[city.team].resources
	var hall: Variant=null
	for b in economy.buildings:
		if b.type=="hall" and b.get("ready",false):hall=b;break
	if hall==null:return false
	var definitions: Dictionary={"berries":{"type":"berries","kind":"berry","rate":6,"cycle":8},"wood":{"type":"lumber","kind":"tree","rate":8,"cycle":6},"stone":{"type":"quarry","kind":"stone","rate":6,"cycle":6}}
	var changed:=false
	for key in ["berries","wood","stone"]:
		var count: float=assigned.get(key,0)
		if count<=0:continue
		var used: float=Needs.food_total(stock) if key=="berries" else float(stock.get(key,0))
		var free:=maxf(0,Econ.storage_limit(city_wide_buildings if not city_wide_buildings.is_empty() else economy.buildings,key)-used)
		if free<=0:continue
		var d: Dictionary=definitions[key]
		var basic: Dictionary={"type":d.type,"resourceKind":d.kind,"workerKey":"basic:"+key,"team":city.team,"x":hall.x,"z":hall.z}
		var bonus: float=Bonuses.basic(state,city,"basic_stone" if key=="stone" else d.type)
		var nav:=actor_nav(worker_navs,"basic:"+key,base)
		var amount:=Gather.gather_tree(economy,world,basic,dt*count/5.0*bonus,nav,1.0/4.5,dt,d)
		if amount>0:
			var delivered:=minf(amount,free)
			stock[key]=float(stock.get(key,0))+delivered
			record_delivery(economy.realms[city.team],economy.time,key,delivered)
			changed=true
	return changed

static func record_delivery(realm: Dictionary,seconds: float,key: String,amount: float) -> void:
	if amount<=0:return
	if not realm.has("deliveryHistory"):realm.deliveryHistory={}
	var minute:=str(floori(seconds/60))
	if not realm.deliveryHistory.has(minute):realm.deliveryHistory[minute]={}
	realm.deliveryHistory[minute][key]=float(realm.deliveryHistory[minute].get(key,0))+amount
	for old in realm.deliveryHistory.keys():
		if int(old)<floori(seconds/60)-5:realm.deliveryHistory.erase(old)

