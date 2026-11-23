class_name Fishery
extends RefCounted
const Grid=preload("res://scripts/campaign_grid.gd")
const Geography=preload("res://scripts/world_geography.gd")
const Nav=preload("res://scripts/local_navigation.gd")
const Campaign=preload("res://scripts/campaign_state.gd")
const RANGES:=[1,2,4,7,11,17,28]
const ERA_TEXT:=["Rannalt püük","Madalas rannikumeres püük","Paadiga rannikumere püük","Kaugem avamerepüük","Suuremad kalapaadid","Mootoriga kalalaevad","Kauged püügiretked"]
const OFFSETS:=[Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1),Vector2i(1,1),Vector2i(1,-1),Vector2i(-1,1),Vector2i(-1,-1)]

static func cell_at(cells: Array,c: int,r: int) -> Variant:
	if c<0 or r<0 or c>=Grid.COLS or r>=Grid.ROWS:return null
	return cells[r*Grid.COLS+c]

static func shore(cells: Array,c: int,r: int) -> bool:
	var cell: Variant=cell_at(cells,c,r)
	if cell==null or not cell.land:return false
	for offset in OFFSETS.slice(0,4):
		var neighbor: Variant=cell_at(cells,c+offset.x,r+offset.y)
		if neighbor!=null and not neighbor.land:return true
	return false

static func initialize(cells: Array,seed_value: int) -> void:
	var distances:=PackedInt32Array();distances.resize(cells.size());distances.fill(65535)
	var queue: Array[int]=[]
	for i in cells.size():
		if cells[i].land:distances[i]=0;queue.append(i)
	var position:=0
	while position<queue.size():
		var index: int=queue[position];position+=1
		var c:=index%Grid.COLS;var r:=floori(float(index)/Grid.COLS)
		for offset in OFFSETS:
			var x: int=c+offset.x;var z: int=r+offset.y
			if x<0 or z<0 or x>=Grid.COLS or z>=Grid.ROWS:continue
			var neighbor: int=z*Grid.COLS+x
			if distances[neighbor]<=distances[index]+1:continue
			distances[neighbor]=distances[index]+1;queue.append(neighbor)
	for i in cells.size():
		var cell: Dictionary=cells[i];var distance: int=distances[i]
		cell.fishDepth=distance
		if not cell.has("deposits"):cell.deposits={}
		if cell.land:
			cell.coast=shore(cells,cell.c,cell.r)
			cell.deposits.fish=bool(cell.get("river",false))
			if cell.deposits.fish:cell.fishDepth=1
		else:
			cell.deposits.fish=distance>=1 and (distance==1 or Geography.noise(cell.c*7+815,cell.r*11+183,seed_value)>(0.28 if distance<=2 else (0.44 if distance<=5 else 0.56)))

static func banks(cells: Array,state: Dictionary,city: Dictionary,age: int) -> Array:
	var river_near:=false
	for offset in [Vector2i.ZERO]+OFFSETS:
		var c: Variant=cell_at(cells,int(city.c)+offset.x,int(city.r)+offset.y)
		if c!=null and c.get("river",false):river_near=true;break
	if not shore(cells,int(city.c),int(city.r)) and not river_near:return []
	var reach: int=RANGES[clampi(age,0,6)]
	var limit:=mini(reach+1,30)
	var result: Array=[]
	for dr in range(-limit,limit+1):
		for dc in range(-limit,limit+1):
			# Math.hypot in the browser scales by the largest component first;
			# preserving that rounding also preserves ties in bank selection.
			var scale:=maxf(absf(dc),absf(dr))
			var distance:=0.0 if scale==0 else scale*sqrt(pow(dc/scale,2)+pow(dr/scale,2))
			if distance>limit+0.1:continue
			var cell: Variant=cell_at(cells,int(city.c)+dc,int(city.r)+dr)
			if cell==null or not cell.deposits.get("fish",false) or cell.fishDepth>reach:continue
			var amount:=stock(state,cell)
			if amount<1:continue
			result.append({"cell":cell,"dist":distance,"depth":cell.fishDepth,"stock":amount,"order":result.size()})
	result.sort_custom(func(a,b):return a.order<b.order if a.dist==b.dist else a.dist<b.dist)
	return result

static func stock(state: Dictionary,cell: Dictionary) -> float:
	if not state.has("fishStocks"):state.fishStocks={}
	var key:=str(cell.c)+":"+str(cell.r)
	if state.fishStocks.has(key):
		var previous: Dictionary=state.fishStocks[key]
		if previous.until>state.time:return previous.amount
		state.fishStocks.erase(key)
	return 96.0

static func harvest(cells: Array,state: Dictionary,city: Dictionary,b: Dictionary,definition: Dictionary,dt: float,nav: LocalNavigation) -> float:
	var world: Dictionary=city.world
	if not world.has("workers"):world.workers={}
	var index: int=city.economy.buildings.find(b)
	var key:="fishery:"+str(index)
	if not world.workers.has(key):
		var home: Variant=nav.nearest(Nav.door(b),15)
		if home==null:return 0.0
		world.workers[key]={"x":home.x,"z":home.z,"phase":"seek","team":b.team,"kind":"fisher","building":key,"work":0.0}
	var worker: Dictionary=world.workers[key]
	worker.moving=false;worker.working=false
	var age: int=state.ages[b.team]
	if worker.phase=="seek":
		var sites:=banks(cells,state,city,age)
		if sites.is_empty():b.status="Ligipääsetavaid kalu pole";worker.retry=3;return 0.0
		var reach: int=RANGES[clampi(age,0,6)]
		var outer: Array=[]
		if age>0:
			for site in sites:
				if site.depth>=maxi(2,ceili(reach*0.45)) and site.dist>=maxf(2,reach*0.4):outer.append(site)
		var choices: Array=outer if not outer.is_empty() else sites
		var pick:=mini(choices.size()-1,floori(Geography.noise(city.c+state.time*0.03,city.r+index,int(state.seed))*choices.size()))
		var target: Dictionary=choices[pick]
		worker.catchTile={"c":target.cell.c,"r":target.cell.r};worker.portTile={"c":city.c,"r":city.r};worker.depth=target.depth
		worker.trip=0 if age==0 else maxi(1,ceili(target.dist*2.5/(1+age*0.55)))
		worker.tripTotal=worker.trip;worker.work=0.0;worker.phase="out";worker.moving=true
		if age>=1 and state.has("explored"):Campaign.reveal(state,b.team,int(worker.catchTile.c),int(worker.catchTile.r),1)
	if worker.phase=="out":
		b.status="Läheb rannale" if age==0 else "Sõidab püügialale"
		worker.moving=true;worker.trip-=dt
		if worker.trip<=0:worker.phase="work"
		return 0.0
	if worker.phase=="work":
		var target: Variant=cell_at(cells,int(worker.catchTile.c),int(worker.catchTile.r))
		if target==null or not target.deposits.get("fish",false) or stock(state,target)<=0:worker.phase="seek";return 0.0
		worker.working=true;worker.action="fishing";b.status="Püüab kaldalt" if age==0 else ERA_TEXT[clampi(age,0,6)];worker.work+=dt/4.5
		if worker.work>=definition.cycle:
			var available:=stock(state,target)
			worker.carried=minf(float(definition.rate)*(1+mini(7,int(target.fishDepth)-1)*0.3),available)
			var remaining:=available-float(worker.carried)
			state.fishStocks[str(target.c)+":"+str(target.r)]={"amount":remaining,"until":state.time+(120 if remaining<=0 else 86400)}
			worker.trip=worker.tripTotal;worker.phase="return";worker.work=0.0
		return 0.0
	if worker.phase=="return":
		b.status="Toob kalasaaki";worker.moving=worker.trip>0;worker.trip-=dt
		if worker.trip<=0:
			var result: float=worker.get("carried",0);worker.carried=0.0;worker.phase="seek";return result
	return 0.0
