class_name MineralSites
extends RefCounted
const Terrain=preload("res://scripts/detail_terrain.gd")
const TYPES:={"quarry":"stone","mine":"ore","coppermine":"copper","tinmine":"tin","claypit":"clay","gem_mine":"gems","oilwell":"oil"}
const KINDS:=["stone","ore","copper","tin","clay","gems","oil"]

static func distance(a: Dictionary,b: Dictionary) -> float:
	return sqrt(pow(float(a.x)-b.x,2)+pow(float(a.z)-b.z,2))

static func mineral_site(world: Dictionary,type: String) -> Variant:
	var kind: String=TYPES.get(type,"")
	for r in world.resources:
		if r.kind==kind and r.get("depositSite",false) and not r.get("removed",false) and float(r.amount)>0:return r
	return null

static func consolidate(world: Dictionary,cell: Dictionary,buildings: Array=[],is_dry: Callable=Callable()) -> void:
	if world.get("mineralSitesVersion",0)==1:return
	var heights: Array=cell.detail.heights
	for kind in KINDS:
		var existing: Array=[]
		for r in world.resources:
			if r.kind==kind:existing.append(r)
		var extractor: Variant=null
		for b in buildings:
			if TYPES.get(b.type,"")==kind and float(b.hp)>0:extractor=b;break
		if existing.is_empty() and not cell.get("deposits",{}).get(kind,false):continue
		var site: Variant=existing[0] if not existing.is_empty() else null
		if site==null:
			var candidates: Array=[]
			for x in range(-54,55,9):
				for z in range(-45,46,9):
					if sqrt(x*x+z*z)<25:continue
					var good:=true
					for dx in [-4,0,4]:
						for dz in [-4,0,4]:
							if Terrain.detail_height(heights,x+dx,z+dz)<=0.4:good=false
					if not good:continue
					if is_dry.is_valid():
						for dx in [-6,0,6]:
							for dz in [-6,0,6]:
								if not is_dry.call(x+dx,z+dz):good=false
					if not good:continue
					var p: Dictionary={"x":x,"z":z}
					for r in world.resources:
						if r.get("depositSite",false) and distance(r,p)<16:good=false;break
					for b in buildings:
						if distance(b,p)<12:good=false;break
					if not good:continue
					var levels: Array=[]
					for d in [[-3,-3],[-3,3],[3,-3],[3,3]]:levels.append(Terrain.detail_height(heights,x+d[0],z+d[1]))
					candidates.append({"x":x,"z":z,"score":levels.max()-levels.min()+abs(x)*0.0001,"order":candidates.size()})
			candidates.sort_custom(func(a,b):return a.order<b.order if a.score==b.score else a.score<b.score)
			if candidates.is_empty():continue
			var choice: Dictionary=candidates[(int(cell.c)*7+int(cell.r)*11+kind.length())%mini(8,candidates.size())]
			site={"id":world.resources.size(),"kind":kind,"x":choice.x,"z":choice.z,"amount":12000 if kind=="oil" else 8400,"removed":false}
			world.resources.append(site)
		var amount:=0.0
		if existing.is_empty():amount=site.amount
		else:
			for r in existing:amount+=maxf(0,float(r.get("amount",0)))
		if extractor!=null:site.x=extractor.x;site.z=extractor.z
		elif not existing.is_empty():
			var options: Array=existing.duplicate()
			for x in range(-54,55,9):
				for z in range(-45,46,9):
					if sqrt(x*x+z*z)>=25:options.append({"x":x,"z":z})
			var usable: Array=[]
			var hall: Dictionary={"x":0,"z":0}
			for b in buildings:
				if b.type=="hall":hall=b;break
			for p in options:
				var levels: Array=[]
				for d in [[-4,-4],[-4,4],[4,-4],[4,4]]:levels.append(Terrain.detail_height(heights,p.x+d[0],p.z+d[1]))
				if levels.min()<=0.4 or levels.max()-levels.min()>=1.7:continue
				var good:=true
				for b in buildings:
					if distance(b,p)<12:good=false;break
				for r in world.resources:
					if r.id!=site.id and r.get("depositSite",false) and distance(r,p)<16:good=false;break
				if good:usable.append({"x":p.x,"z":p.z,"score":levels.max()-levels.min()+distance(p,hall)*0.002,"order":usable.size()})
			usable.sort_custom(func(a,b):return a.order<b.order if a.score==b.score else a.score<b.score)
			if not usable.is_empty():site.x=usable[0].x;site.z=usable[0].z
		for r in existing:
			if r.id!=site.id:r.amount=0;r.removed=true;r.mergedDeposit=true
		site.depositSite=true;site.amount=amount;site.capacity=amount;site.removed=amount<=0
		for b in buildings:
			if TYPES.get(b.type,"")==kind:b.depositId=site.id
	world.mineralSitesVersion=1;world.revision=int(world.get("revision",0))+1

static func placement(world: Dictionary,type: String,p: Dictionary,buildings: Array=[]) -> Dictionary:
	var site: Variant=mineral_site(world,type)
	if site==null:return {"error":"Sellel detailkaardil puudub kasutatav maardla."}
	for b in buildings:
		if TYPES.get(b.type,"")==site.kind and float(b.hp)>0:return {"error":"Sellele maardlale on kaevandus juba rajatud."}
	if distance(site,p)>6:return {"error":"Paiguta kaevandus otse maardla hunnikule."}
	return {"p":{"x":site.x,"z":site.z},"depositId":site.id}

static func harvest(world: Dictionary,b: Dictionary,definition: Dictionary,dt: float,multiplier:=1.0) -> float:
	var id: int=b.get("depositId",-1)
	if id<0 or id>=world.resources.size() or world.resources[id].get("removed",false) or world.resources[id].amount<=0:
		b.status="Maardla on ammendunud";return 0.0
	var r: Dictionary=world.resources[id]
	b.status="Kaevandab"
	b.extractionTimer=float(b.get("extractionTimer",0))+dt*multiplier*(0.5 if b.type=="quarry" else 1.0)
	if b.extractionTimer<definition.cycle:return 0.0
	b.extractionTimer-=definition.cycle
	var amount:=minf(definition.rate,r.amount);r.amount-=amount
	if r.amount<=0:r.removed=true;world.revision=int(world.get("revision",0))+1
	return amount
