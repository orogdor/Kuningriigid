class_name Forestry
extends RefCounted
const Nav=preload("res://scripts/local_navigation.gd")
const GROW_TIME:=480.0

static func distance(a: Dictionary,b: Dictionary) -> float:
	return sqrt(pow(float(a.x)-b.x,2)+pow(float(a.z)-b.z,2))

static func ensure_ledger(economy: Dictionary,world: Dictionary) -> void:
	if not world.has("forestCredits"):
		world.forestCredits={"0":0.0,"1":0.0}
		for resource in world.resources:
			if resource.kind!="tree" or not resource.get("removed",false) or resource.get("cleared",false):continue
			var occupied:=false
			for b in economy.buildings:
				if absf(b.x-resource.x)<4.5 and absf(b.z-resource.z)<4.5:occupied=true;break
			if occupied:continue
			var closest: Variant=null;var best:=INF
			for b in economy.buildings:
				if b.type!="hall":continue
				var d:=distance(b,resource)
				if d<best:best=d;closest=b
			if closest!=null:
				var team:=str(int(closest.team))
				world.forestCredits[team]=float(world.forestCredits.get(team,0))+float(resource.get("capacity",24))
	# JSON exports represent JavaScript NaN as null; the web ledger treats it as zero.
	for team in world.forestCredits:
		if not (world.forestCredits[team] is int or world.forestCredits[team] is float):world.forestCredits[team]=0.0
	if not world.has("forestryStats"):world.forestryStats={"cut":{"0":0.0,"1":0.0},"planted":{"0":0.0,"1":0.0}}

static func valid(site: Dictionary,economy: Dictionary,world: Dictionary,building: Dictionary,worker: Dictionary,nav: LocalNavigation,people:=false) -> bool:
	var index:=nav.index(site.x,site.z)
	if index<0 or nav.base[index]==0 or nav.road_strength(index)>=3:return false
	for b in economy.buildings:
		if b.team==building.team and absf(site.x-b.x)<4.5 and absf(site.z-b.z)<4.5:return false
	for resource in world.resources:
		if not resource.get("removed",false) and float(resource.get("amount",0))>0 and distance(resource,site)<3:return false
	if people:
		for cargo in economy.get("cargo",[]):
			if cargo.team==building.team and distance(cargo,site)<1.5:return false
		for other in world.workers.values():
			if not is_same(other,worker) and other.get("team")==building.team and distance(other,site)<1.5:return false
		for unit in economy.get("units",[]):
			if unit.team==building.team and distance(unit,site)<1.5:return false
	return true

static func cancel(world: Dictionary,worker: Dictionary,team: String) -> void:
	world.forestCredits[team]=float(world.forestCredits.get(team,0))+float(worker.get("reserved",0))
	worker.reserved=0;worker.site=null;worker.phase="plantSeek";worker.retry=3.0

static func plant(economy: Dictionary,world: Dictionary,building: Dictionary,dt: float,nav: LocalNavigation) -> void:
	ensure_ledger(economy,world)
	if not world.has("workers"):world.workers={}
	var id:=str(economy.buildings.find(building));var quota: float=EconomyRules.DATA.data.buildings.forester.rate
	if not world.workers.has(id):
		var initial: Variant=nav.nearest(Nav.door(building))
		if initial==null:return
		world.workers[id]={"x":initial.x,"z":initial.z,"phase":"plantSeek","team":building.team,"kind":"forester","building":int(id),"work":0.0}
	var worker: Dictionary=world.workers[id];var team:=str(int(building.team))
	worker.moving=false;worker.working=false
	if worker.phase=="plantReturn":
		building.status="Naaseb istutamast"
		if nav.move(worker,Nav.door(building),dt,3.0,true):worker.phase="plantSeek"
		return
	if worker.get("site") is Dictionary and not valid(worker.site,economy,world,building,worker,nav):cancel(world,worker,team);return
	if worker.phase=="plantSeek":
		building.status="Otsib istutuskohta" if float(world.forestCredits.get(team,0))>=quota else "Ootab raiutud metsa"
		worker.retry=maxf(0,float(worker.get("retry",0))-dt)
		if worker.retry>0 or float(world.forestCredits.get(team,0))<quota:return
		var sites: Array=[]
		for resource in world.resources:
			if resource.kind=="tree" and resource.get("removed",false) and not resource.get("cleared",false) and distance(resource,building)<55:sites.append({"x":resource.x,"z":resource.z,"id":resource.id,"order":sites.size()})
		for radius in range(8,29,4):
			for k in 12:
				sites.append({"x":floor(building.x+cos(k*PI/6)*radius+0.5),"z":floor(building.z+sin(k*PI/6)*radius+0.5),"order":sites.size()})
		for site in sites:site.distance=distance(site,worker)
		sites.sort_custom(func(a,b):return a.order<b.order if a.distance==b.distance else a.distance<b.distance)
		for site in sites:
			if not valid(site,economy,world,building,worker,nav,true):continue
			var claimed:=false
			for other in world.workers.values():
				if not is_same(other,worker) and other.get("site") is Dictionary and distance(other.site,site)<3:claimed=true;break
			if claimed:continue
			var point: Variant=nav.nearest({"x":site.x+2.3,"z":site.z},3)
			if point!=null and nav.route(worker,point)!=null:
				worker.site=site;worker.goal=point;worker.phase="plantOut";worker.reserved=quota;world.forestCredits[team]-=quota;worker.work=0.0;break
		if not worker.get("site") is Dictionary:worker.retry=4.0
		return
	if worker.phase=="plantOut":
		building.status="Viib istikut metsa"
		if nav.move(worker,worker.goal,dt,3.0,true):worker.phase="plantWork";worker.stuck=0.0
		elif not worker.moving:
			worker.stuck=float(worker.get("stuck",0))+dt
			if worker.stuck>8:cancel(world,worker,team)
		return
	if worker.phase=="plantWork":
		worker.action="plant";building.status="Istutab puud";worker.working=true
		worker.heading=atan2(worker.site.x-worker.x,worker.site.z-worker.z);worker.work+=dt
		if worker.work<float(EconomyRules.DATA.data.buildings.forester.cycle) or not valid(worker.site,economy,world,building,worker,nav,true):return
		var resource: Dictionary
		if worker.site.has("id") and int(worker.site.id)>=0 and int(worker.site.id)<world.resources.size():resource=world.resources[int(worker.site.id)]
		else:
			resource={"id":world.resources.size(),"kind":"tree","x":worker.site.x,"z":worker.site.z};world.resources.append(resource)
		resource.merge({"amount":quota,"capacity":quota,"removed":false,"cleared":false,"plantedAt":economy.time,"matureAt":economy.time+GROW_TIME,"plantedBy":building.team},true)
		world.forestryStats.planted[team]=float(world.forestryStats.planted.get(team,0))+quota
		world.revision=int(world.get("revision",0))+1;worker.reserved=0;worker.site=null;worker.phase="plantReturn";worker.work=0.0

static func natural_regrowth(state: Dictionary,world: Dictionary,dt: float,buildings: Array) -> int:
	world.regrowClockV274=float(world.get("regrowClockV274",0))+dt
	if world.regrowClockV274<30:return 0
	world.regrowClockV274=0.0
	var trees: Array=[]
	for resource in world.resources:
		if resource.kind=="tree":trees.append(resource)
	var sprouted:=0
	for resource in trees:
		if not resource.get("removed",false) or resource.get("cleared",false) or sprouted>=3:continue
		var occupied:=false
		for b in buildings:
			if absf(resource.x-b.x)<4.5 and absf(resource.z-b.z)<4.5:occupied=true;break
		if occupied:continue
		var near:=0
		for other in trees:
			if other.get("removed",false) or is_same(other,resource) or float(other.get("matureAt",0))>float(state.time):continue
			if absf(other.x-resource.x)<9 and absf(other.z-resource.z)<9:
				near+=1
				if near>=4:break
		if near==0:continue
		var n:=sin((float(resource.id)+1)*12.9898+floor(float(state.time)/30)*78.233)*43758.5453
		if n-floor(n)>0.03*near:continue
		var capacity: float=resource.get("capacity",24)
		resource.merge({"removed":false,"amount":capacity,"capacity":capacity,"plantedAt":state.time,"matureAt":state.time+GROW_TIME*1.5,"natural":true},true)
		sprouted+=1
	if sprouted>0:world.revision=int(world.get("revision",0))+1
	return sprouted
