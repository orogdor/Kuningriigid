class_name BuilderSim
extends RefCounted
const Nav = preload("res://scripts/local_navigation.gd")
const Econ = preload("res://scripts/economy_rules.gd")
const Bonuses = preload("res://scripts/production_bonuses.gd")
const Operations=preload("res://scripts/building_operations.gd")

# Multiple same-tile builders use independent route caches. Cross-tile travel
# and traffic reservations remain separate work.
static func tick(state: Dictionary,city: Dictionary,nav: LocalNavigation,dt: float,nav_cache: Dictionary={}) -> Dictionary:
	if dt<=0:return {}
	var economy: Dictionary=city.economy;var jobs: Array=[];var hall: Dictionary={}
	for i in economy.buildings.size():
		var b: Dictionary=economy.buildings[i]
		if b.type=="hall" and b.get("ready",false) and float(b.get("hp",0))>0:hall=b
		if not b.get("ready",false):b.assigned=0.0;b.efficiency=0.0;b.workThisTick=0.0
		if b.get("wallUpgradeV184") is Dictionary and not b.get("virtual",false) and float(b.get("hp",0))>0:
			var upgrade:Dictionary=b.wallUpgradeV184;upgrade.assigned=0.0;upgrade.efficiency=0.0;upgrade.workThisTick=0.0
			jobs.append({"building":upgrade,"owner":b,"index":i})
		elif not b.get("ready",false) and not b.get("virtual",false) and not b.get("disabled",false) and float(b.get("hp",0))>0 and float(b.get("workerLimit",1))!=0:jobs.append({"building":b,"index":i})
	if not city.has("builderAgents"):city.builderAgents=[]
	var assigned:=maxf(0.0,float(city.get("buildersAssigned",0)))
	var count:=ceili(assigned) if not jobs.is_empty() else 0
	if hall.is_empty():count=0
	var initial: Variant=nav.nearest(Nav.door(hall)) if count>city.builderAgents.size() else null
	while city.builderAgents.size()<count and initial!=null:
		var index: int=city.builderAgents.size()
		city.builderAgents.append({"x":initial.x,"z":initial.z,"c":city.c,"r":city.r,"team":city.team,"kind":"builder","workerKey":"builder:%d:%d" % [city.id,index],"working":false,"moving":false,"visible":true})
	if int(nav_cache.get("revision",-1))!=nav.revision:
		nav_cache.clear();nav_cache.revision=nav.revision;nav_cache.agents={}
	var navigators: Dictionary=nav_cache.agents
	var completed: Array=[]
	for i in city.builderAgents.size():
		var worker: Dictionary=city.builderAgents[i]
		worker.working=false;worker.moving=false;worker.action=null
		var share:=clampf(assigned-float(i),0.0,1.0) if i<count else 0.0
		if share<=0.0 or jobs.is_empty():worker.visible=false;continue
		var task: Dictionary=jobs[i%jobs.size()];var job: Dictionary=task.building
		if job.get("ready",false):worker.visible=false;continue
		worker.visible=true;job.assigned=float(job.assigned)+share;job.efficiency=float(job.efficiency)+share
		if not navigators.has(i):navigators[i]=nav.clone_for_agent()
		var worker_nav: LocalNavigation=navigators[i];worker_nav.trail_time=nav.trail_time
		if tick_worker(state,city,worker,job,int(task.index),hall,worker_nav,dt,share,task.get("owner",{})):completed.append(int(task.index))
	if not completed.is_empty():nav.rebuild(city.economy.buildings,city.world.resources)
	return {"completed":completed[0],"completed_all":completed} if not completed.is_empty() else {}

static func tick_worker(state: Dictionary,city: Dictionary,worker: Dictionary,job: Dictionary,job_index: int,_hall: Dictionary,nav: LocalNavigation,dt: float,share: float,owner: Dictionary={}) -> bool:
	var job_key:=str(int(city.c))+":"+str(int(city.r))+":"+str(job_index)+(":upgrade" if not owner.is_empty() else "")
	if float(job.get("materialsRemaining",0))>0:
		if worker.get("materialJob")!=job_key:
			worker.materialLoad=0.0;worker.carried=0.0;worker.materialJob=job_key;worker.materialDepot=null
		if float(worker.get("materialLoad",0))<=0:
			var depot: Variant=usable_depot(city,worker,job,nav)
			if depot==null:worker.status="Puudub ligipääsetav ladu";return false
			worker.status="Läheb materjalilattu"
			if nav.move(worker,Nav.door(depot),dt*share,3.0,true):
				worker.materialLoad=minf(24,float(job.materialsRemaining));worker.carried=worker.materialLoad;worker.status="Võttis ehitusmaterjalid"
			return false
		worker.status="Viib materjali ehitusplatsile"
		if nav.move(worker,Nav.door(job),dt*share,3.0,true):
			job.materialsRemaining=maxf(0,float(job.materialsRemaining)-float(worker.materialLoad))
			worker.materialLoad=0.0;worker.carried=0.0
			worker.status="Toob järgmist koormat" if job.materialsRemaining>0 else "Materjalid kohal, alustab ehitust"
		return false
	worker.materialLoad=0.0;worker.carried=0.0;worker.status="Läheb ehitusplatsile"
	if not nav.move(worker,Nav.door(job),dt*share,3.0,true):return false
	worker.status="Ehitab";worker.working=true;worker.action="build";worker.builderArrived=true
	var age: int=clampi(int(state.ages[city.team]),0,6);var strength: float=[1.0,1.2,1.4,1.7,1.95,2.25,2.6][age]
	var work:=dt*share*Bonuses.national(state,city.team)*strength
	job.workThisTick=float(job.workThisTick)+work;job.progress=float(job.get("progress",0))+work
	if not owner.is_empty():
		if job.progress+0.00000001<float(job.total):return false
		Operations.finish_wall_upgrade(owner);city.world.revision=int(city.world.get("revision",0))+1;return true
	var definition: Dictionary=Econ.DATA.data.buildings[job.type]
	if job.progress+0.00000001<float(job.get("buildTimeV1757",definition.time))*Econ.tempo_factor(state):return false
	job.ready=true;job.status="Valmis";city.economy.realms[city.team].log.append({"time":floori(city.economy.time),"text":"Valmis: "+definition.name})
	return true

static func usable_depot(city: Dictionary,worker: Dictionary,job: Dictionary,nav: LocalNavigation) -> Variant:
	var buildings: Array=city.economy.buildings
	var from: Variant=nav.nearest(worker,9);var destination: Variant=nav.nearest(Nav.door(job),9)
	if from==null or destination==null:return null
	var saved: Variant=worker.get("materialDepot")
	if saved is Dictionary and int(saved.get("index",-1))>=0 and int(saved.index)<buildings.size():
		var candidate: Dictionary=buildings[int(saved.index)]
		if depot_reachable(candidate,from,destination,nav):return candidate
	var best: Variant=null;var best_score:=INF;var best_index:=-1
	for i in buildings.size():
		var candidate: Dictionary=buildings[i]
		if not depot_reachable(candidate,from,destination,nav):continue
		var door: Dictionary=Nav.door(candidate)
		var score:=absf(float(worker.x)-float(door.x))+absf(float(worker.z)-float(door.z))+absf(float(job.x)-float(door.x))+absf(float(job.z)-float(door.z))
		if score<best_score-0.00001 or (absf(score-best_score)<0.00001 and candidate.type=="warehouse" and (best==null or best.type!="warehouse")):
			best=candidate;best_score=score;best_index=i
	if best!=null:worker.materialDepot={"c":city.c,"r":city.r,"index":best_index}
	return best

static func depot_reachable(building: Dictionary,from: Dictionary,destination: Dictionary,nav: LocalNavigation) -> bool:
	if building.get("virtual",false) or not building.get("ready",false) or float(building.get("hp",0))<=0 or building.type not in ["hall","warehouse"]:return false
	var door: Variant=nav.nearest(Nav.door(building),9)
	return door!=null and nav.reachable(from,door) and nav.reachable(door,destination)

static func clear_footprint(world: Dictionary, building: Dictionary) -> void:
	var size: Variant = Nav.clearance(building)
	var rx := maxf(3.6,size.rx if size!=null else 0)+0.5
	var rz := maxf(3.5,size.rz if size!=null else 0)+0.5
	var changed := false
	for r in world.get("resources",[]):
		if r.kind in ["tree","berry"] and not r.get("removed",false) and absf(r.x-building.x)<rx and absf(r.z-building.z)<rz:
			r.removed=true;r.cleared=true;r.amount=0;changed=true
	if changed:world.revision=int(world.get("revision",0))+1
