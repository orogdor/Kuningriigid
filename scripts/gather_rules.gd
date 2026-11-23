class_name GatherRules
extends RefCounted
const Nav=preload("res://scripts/local_navigation.gd")

static func distance(a: Dictionary,b: Dictionary) -> float:
	return sqrt(pow(float(a.x)-b.x,2)+pow(float(a.z)-b.z,2))

# Tree and game gathering from navigation.js. Mining and fishing have separate rules.
static func gather_tree(economy: Dictionary,world: Dictionary,building: Dictionary,dt: float,nav: LocalNavigation,multiplier := 1.0/4.5,travel_dt := -1.0,definition: Dictionary={}) -> float:
	var kind: String=building.get("resourceKind","game" if building.type=="hunter" else "tree")
	if travel_dt<0:travel_dt=dt
	var resource_definition: Dictionary=definition if not definition.is_empty() else EconDefinition(building)
	if not world.has("workers"):world.workers={}
	var id := str(building.get("workerKey",economy.buildings.find(building)))
	if not world.workers.has(id):
		var p: Variant=nav.nearest(Nav.door(building))
		if p==null:return 0.0
		world.workers[id]={"x":p.x,"z":p.z,"phase":"seek","team":building.team,"kind":building.type,"building":economy.buildings.find(building),"work":0.0}
	var worker: Dictionary=world.workers[id]
	worker.moving=false;worker.working=false;worker.workRate=dt/travel_dt if travel_dt>0 else 1.0
	var home:=Nav.door(building)
	if worker.phase=="return":
		building.status="Toob saaki"
		if nav.move(worker,home,travel_dt,3.0,true):
			worker.phase="seek"
			var amount: float=worker.get("carried",0)
			worker.carried=0.0
			return amount
		return 0.0
	var target: Variant=null
	if worker.phase!="seek" and worker.has("resourceId"):
		for r in world.resources:
			if r.id==worker.resourceId and r.kind==kind:target=r;break
	if target==null or target.get("removed",false) or target.amount<=0:
		worker.retry=maxf(0,float(worker.get("retry",0))-dt)
		if worker.retry>0:return 0.0
		var claimed: Array=[]
		for key in world.workers:
			var other: Dictionary=world.workers[key]
			if key!=id and other.get("phase")!="return" and other.has("resourceId"):claimed.append(other.resourceId)
		var candidates: Array=[]
		for i in world.resources.size():
			var r: Dictionary=world.resources[i]
			if r.kind==kind and not r.get("removed",false) and r.amount>0 and r.id not in claimed and float(r.get("matureAt",0))<=float(economy.time) and distance(r,building)<55:
				candidates.append({"resource":r,"index":i,"distance":distance(r,worker)})
		candidates.sort_custom(func(a,b):return a.index<b.index if a.distance==b.distance else a.distance<b.distance)
		for i in mini(14,candidates.size()):
			var r: Dictionary=candidates[i].resource
			var p: Variant=nav.nearest({"x":r.x+1.8,"z":r.z},4)
			if p!=null and nav.route(worker,p)!=null:
				target=r;worker.resourceId=r.id;worker.goal=p;worker.phase="out";worker.work=0.0;break
		if target==null:
			building.status="Lähedal pole ligipääsetavat toorainet";worker.retry=4.0;return 0.0
	if worker.phase=="out":
		building.status="Läheb metsa" if kind=="tree" else ("Läheb marjule" if kind=="berry" else ("Läheb maardlasse" if kind=="stone" else "Läheb jahile"))
		if nav.move(worker,worker.goal,travel_dt,3.0,true):worker.phase="work";worker.stuck=0.0
		elif not worker.moving:
			worker.stuck=float(worker.get("stuck",0))+dt
			if worker.stuck>8:worker.phase="seek";worker.stuck=0.0
		return 0.0
	if worker.phase=="work":
		worker.action="chop" if kind=="tree" else ("gather" if kind=="berry" else ("mine" if kind=="stone" else "hunt"));building.status="Raiub puud" if kind=="tree" else ("Korjab marju" if kind=="berry" else ("Kaevandab" if kind=="stone" else "Jahib ulukeid"));worker.working=true
		worker.heading=atan2(target.x-worker.x,target.z-worker.z)
		worker.work=float(worker.work)+dt*multiplier*(0.5 if kind in ["tree","stone"] else 1.0)
		if worker.work>=resource_definition.cycle:
			if not target.has("capacity"):target.capacity=target.amount
			worker.carried=minf(float(resource_definition.rate),float(target.amount))
			if kind=="tree":
				if not world.has("forestCredits"):world.forestCredits={"0":0.0,"1":0.0}
				if not world.has("forestryStats"):world.forestryStats={"cut":{"0":0.0,"1":0.0},"planted":{"0":0.0,"1":0.0}}
				var team:=str(int(building.team))
				world.forestCredits[team]=float(world.forestCredits.get(team,0))+worker.carried
				world.forestryStats.cut[team]=float(world.forestryStats.cut.get(team,0))+worker.carried
			target.amount-=worker.carried
			if target.amount<=0:
				target.removed=true
				if kind in ["game","berry"]:target.respawnAt=economy.time+90
				elif kind=="tree" and not target.get("cleared",false):target.respawnAt=economy.time+720
				world.revision=int(world.get("revision",0))+1
			worker.phase="return";worker.work=0.0
	return 0.0

static func EconDefinition(building: Dictionary) -> Dictionary:
	return EconomyRules.DATA.data.buildings[building.type]
