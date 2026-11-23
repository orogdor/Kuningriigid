class_name Farming
extends RefCounted
const Nav=preload("res://scripts/local_navigation.gd")
var worker_navs: Dictionary={}

static func field_rect(a: Dictionary,b: Dictionary) -> Dictionary:
	return {"x":floor((float(a.x)+b.x)/4.0+0.5)*2,"z":floor((float(a.z)+b.z)/4.0+0.5)*2,"width":floor(absf(a.x-b.x)/2.0+0.5)*2,"depth":floor(absf(a.z-b.z)/2.0+0.5)*2}

static func field_size(field: Dictionary) -> Dictionary:
	return {"width":field.get("width",48),"depth":field.get("depth",32)}

static func field_contains(field: Dictionary,p: Dictionary,margin:=0.0) -> bool:
	var size:=field_size(field)
	var angle: float=field.get("buildingRotationV228",0) if field.get("freeRotationV243",false) else 0.0
	var c:=cos(angle);var s:=sin(angle);var dx: float=p.x-field.x;var dz: float=p.z-field.z
	return absf(dx*c-dz*s)<size.width/2.0+margin and absf(dx*s+dz*c)<size.depth/2.0+margin

static func profile(age: int,known: Array,powered:=false) -> Dictionary:
	if age>=6 and "combustion" in known and powered:return {"id":"tractor","name":"Traktor ja kombain","speed":5.0,"areaPerWorker":768,"output":2.8}
	if age>=5 and "mechanical_reaper" in known:return {"id":"reaper","name":"Hoburakendiga niiduk","speed":3.2,"areaPerWorker":384,"output":1.9}
	if age>=3 and "heavy_plough" in known:return {"id":"heavy_plough","name":"Hoburakend ja hõlmader","speed":2.7,"areaPerWorker":224,"output":1.5}
	if age>=2 and "iron_ploughshare" in known and "animal_husbandry" in known:return {"id":"iron_plough","name":"Härjarakend ja raudader","speed":2.3,"areaPerWorker":160,"output":1.25}
	if age>=1 and "animal_husbandry" in known:return {"id":"ox_plough","name":"Härjarakend ja puuader","speed":2.0,"areaPerWorker":112,"output":1.0}
	return {"id":"hand","name":"Kõblas ja käsikülv","speed":1.6,"areaPerWorker":64,"output":1.25}

static func fields_for_farm(city: Dictionary,farm: Dictionary) -> Array:
	var farms: Array=[]
	for b in city.economy.buildings:
		if b.type=="farm" and b.get("ready",false) and float(b.get("hp",0))>0 and not b.get("disabled",false):farms.append(b)
	var result: Array=[]
	for field in city.economy.buildings:
		if field.type!="field" or not field.get("ready",false) or float(field.get("hp",0))<=0 or field.get("disabled",false):continue
		var nearest: Variant=null;var closest:=INF
		for candidate in farms:
			var distance:=sqrt(pow(float(candidate.x)-field.x,2)+pow(float(candidate.z)-field.z,2))
			if distance<closest:closest=distance;nearest=candidate
		if is_same(nearest,farm):result.append(field)
	return result

static func validate(city: Dictionary,p: Dictionary,passable: Callable) -> String:
	var size:=field_size(p);var width: float=size.width;var depth: float=size.depth
	if not is_finite(float(p.x)) or not is_finite(float(p.z)) or not is_finite(width) or not is_finite(depth) or width<8 or depth<8 or width>64 or depth>64:return "Põllu küljed peavad olema 8–64 ühikut. Lohista väiksem ristkülik."
	var angle: float=p.get("buildingRotationV228",0) if p.get("freeRotationV243",false) else 0.0
	var c:=cos(angle);var s:=sin(angle);var rx:=absf(c)*width/2+absf(s)*depth/2;var rz:=absf(s)*width/2+absf(c)*depth/2
	if absf(p.x)+rx>112.5-4 or absf(p.z)+rz>97.5-4:return "Põld peab mahtuma ühele detailkaardile."
	var x: float=-width/2
	while x<=width/2:
		var z: float=-depth/2
		while z<=depth/2:
			if not passable.call(p.x+x*c+z*s,p.z-x*s+z*c):return "Kogu põld peab olema kuival ja ligipääsetaval maal."
			z+=2
		x+=2
	for b in city.economy.buildings:
		if b.get("virtual",false) or float(b.get("hp",0))<=0:continue
		var d: Dictionary=field_size(b) if b.type=="field" else ({"width":24,"depth":23} if b.type=="market" else {"width":12,"depth":12})
		var ba: float=b.get("buildingRotationV228",0) if b.get("freeRotationV243",false) else 0.0
		var bc:=absf(cos(ba));var bs:=absf(sin(ba));var brx: float=(d.width*bc+d.depth*bs)/2;var brz: float=(d.width*bs+d.depth*bc)/2
		if absf(b.x-p.x)<rx+brx+1 and absf(b.z-p.z)<rz+brz+1:return "Põld kattub teise põllu või hoonega."
	for resource in city.world.resources:
		if resource.get("depositSite",false) and not resource.get("removed",false) and field_contains(p,resource,3):return "Maardla peale ei saa põldu rajada."
	return ""

func work(state: Dictionary,city: Dictionary,farm: Dictionary,dt: float,base: LocalNavigation) -> float:
	var fields:=fields_for_farm(city,farm);var world: Dictionary=city.world
	if not world.has("workers"):world.workers={}
	var index: int=city.economy.buildings.find(farm);var prefix:="farm:"+str(index)+":"
	for id in world.workers:
		if str(id).begins_with(prefix):world.workers[id].working=false;world.workers[id].moving=false;world.workers[id].visible=false
	if fields.is_empty():farm.status="Ootab eraldi rajatud põldu samal ruudul";return 0.0
	var stock: Dictionary=city.economy.realms[city.team].resources
	var known: Array=state.research[city.team].known;var age: int=state.ages[city.team]
	var can_motor:=age>=6 and "combustion" in known and float(stock.get("fuel",0))>0
	if can_motor and not farm.get("tractorOwned",false) and float(stock.get("machines",0))>=1:stock.machines-=1;farm.tractorOwned=true
	var powered: bool=can_motor and farm.get("tractorOwned",false) and float(stock.get("fuel",0))>=dt*0.002
	var equipment:=profile(age,known,powered);var assigned:=minf(4,maxf(0,float(farm.get("assigned",0))))
	var area:=0.0
	for field in fields:
		var size:=field_size(field);area+=float(size.width)*size.depth
	farm.farming={"tool":equipment.name,"area":area,"capacity":assigned*equipment.areaPerWorker,"fields":fields.size()}
	if dt<=0 or assigned<=0:return 0.0
	var work_count:=0.0
	for i in ceili(assigned):
		var id:=prefix+str(i);var field: Dictionary=fields[i%fields.size()];var size:=field_size(field)
		if not world.workers.has(id):world.workers[id]={"x":farm.x,"z":farm.z+6,"team":city.team,"kind":"farm","building":index,"row":i,"pass":0}
		var worker: Dictionary=world.workers[id];worker.visible=true;worker.equipment=equipment.id
		var rows:=maxi(1,floori((float(size.depth)-4)/3));var row:=int(worker.get("row",0))%rows
		var x: float=(1 if int(worker.get("pass",0))%2 else -1)*(size.width/2.0-2);var z: float=-size.depth/2.0+2+row*3
		var angle: float=field.get("buildingRotationV228",0) if field.get("freeRotationV243",false) else 0.0
		var c:=cos(angle);var s:=sin(angle);var target: Dictionary={"x":field.x+x*c+z*s,"z":field.z-x*s+z*c}
		if not worker_navs.has(id):worker_navs[id]=base.clone_for_agent()
		var nav: LocalNavigation=worker_navs[id];nav.trail_time=base.trail_time
		var point: Variant=nav.nearest(target,4)
		if point==null:continue
		var distance:=sqrt(pow(float(worker.x)-point.x,2)+pow(float(worker.z)-point.z,2))
		if not nav.move(worker,point,dt,float(equipment.speed),true):worker.working=field_contains(field,worker);worker.action="farm" if worker.working else ""
		else:worker.working=true;worker.action="farm";worker.pass+=1;worker.row=(row+1)%rows
		if worker.working:work_count+=minf(1,assigned-i)
		worker.heading=atan2(point.x-worker.x,point.z-worker.z);worker.moving=distance>0.2
	if powered and work_count>0:stock.fuel=maxf(0,float(stock.fuel)-dt*0.002)
	var coverage:=minf(1,area/maxf(1,assigned*equipment.areaPerWorker))
	farm.status=equipment.name+" · "+str(roundi(area))+" põlluühikut" if work_count>0 else "Põllutöölised liiguvad põllule"
	return dt*work_count/assigned*coverage*float(equipment.output)
