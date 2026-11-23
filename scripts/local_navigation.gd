class_name LocalNavigation
extends RefCounted
const Heap=preload("res://scripts/min_priority_queue.gd")
const DIRS := [Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1),Vector2i(1,1),Vector2i(1,-1),Vector2i(-1,1),Vector2i(-1,-1)]
var min_x: int
var min_z: int
var width: int
var height: int
var mask: PackedByteArray
var base: PackedByteArray
var heat: Dictionary = {}
var heat_last: Dictionary = {}
var trail_time := 0.0
var trail_world: Dictionary={}
var access_components:=PackedInt32Array()
var revision:=0

func bind_world(world: Dictionary) -> void:
	trail_world=world
	if not world.has("heat"):world.heat={}
	if not world.has("heatLast"):world.heatLast={}
	heat=world.heat;heat_last=world.heatLast

func _init(x: int,z: int,w: int,h: int,passable: Callable) -> void:
	min_x=x;min_z=z;width=w;height=h
	mask.resize(w*h)
	for j in h:
		for i in w:
			mask[j*w+i] = 1 if passable.call(i+min_x,j+min_z) else 0
	base=mask.duplicate()

func index(x: float,z: float) -> int:
	var xx := floori(x+0.5)-min_x
	var zz := floori(z+0.5)-min_z
	return zz*width+xx if xx>=0 and xx<width and zz>=0 and zz<height else -1

func point(i: int) -> Dictionary:
	return {"x":i%width+min_x,"z":floori(float(i)/width)+min_z}

func is_open(x: float,z: float) -> bool:
	var i := index(x,z)
	return i>=0 and mask[i]==1

func nearest(p: Dictionary,max_radius := 9) -> Variant:
	if is_open(p.x,p.z): return point(index(p.x,p.z))
	for radius in range(1,max_radius+1):
		var best: Variant = null
		var best_distance := INF
		for dz in range(-radius,radius+1):
			for dx in range(-radius,radius+1):
				if maxi(abs(dx),abs(dz)) != radius or not is_open(p.x+dx,p.z+dz):continue
				var candidate := point(index(p.x+dx,p.z+dz))
				var d := sqrt(pow(float(candidate.x)-p.x,2)+pow(float(candidate.z)-p.z,2))
				if d<best_distance:best=candidate;best_distance=d
		if best != null:return best
	return null

# Find a shore point on the same connected ground as the builder.
func nearest_reachable(from: Dictionary,target: Dictionary,max_radius:=80) -> Variant:
	var start: Variant=nearest(from,15)
	if start==null:return null
	label_access_components()
	var start_index:=index(start.x,start.z);var component:=int(access_components[start_index])
	if component==0:return null
	for radius in range(max_radius+1):
		var best: Variant=null;var best_distance:=INF
		for dz in range(-radius,radius+1):
			for dx in range(-radius,radius+1):
				if maxi(absi(dx),absi(dz))!=radius:continue
				var n:=index(float(target.x)+dx,float(target.z)+dz)
				if n<0 or mask[n]==0 or int(access_components[n])!=component:continue
				var candidate:=point(n);var distance:=pow(float(candidate.x)-float(target.x),2)+pow(float(candidate.z)-float(target.z),2)
				if distance<best_distance:best_distance=distance;best=candidate
		if best!=null:return best
	return null

func road_strength(i: int) -> float:
	var key := str(i)
	var h: float = heat.get(key,0)
	if h==0:return 0.0
	if not heat_last.has(key):heat_last[key]=trail_time;return h
	var elapsed := maxf(0,trail_time-float(heat_last[key]))
	var rate := 0.0012 if h>=64 else (0.0028 if h>=30 else (0.006 if h>=13 else (0.009 if h>=4 else 0.013)))
	return maxf(0,h-rate*elapsed)

func road_boost(i: int) -> float:
	var h := road_strength(i)
	return 1.65 if h>=64 else (1.5 if h>=4 else 1.0)

func route(from: Dictionary,to: Dictionary,prefer_roads := true) -> Variant:
	var a: Variant = nearest(from)
	var b: Variant = nearest(to)
	if a==null or b==null:return null
	var start := index(a.x,a.z)
	var goal := index(b.x,b.z)
	if start==goal:return [b]
	var costs := PackedFloat32Array();costs.resize(mask.size());costs.fill(INF)
	var previous := PackedInt32Array();previous.resize(mask.size());previous.fill(-1)
	var closed := PackedByteArray();closed.resize(mask.size());closed.fill(0)
	var heap := Heap.new();costs[start]=0;heap.push(0,start)
	while heap.size()>0:
		var k: int = heap.pop()
		if closed[k]!=0:continue
		if k==goal:
			var out: Array = []
			var v := k
			while v!=start:
				out.append(point(v));v=previous[v]
			out.append(a);out.reverse();return out
		closed[k]=1
		var x := k%width;var z := floori(float(k)/width)
		for d in DIRS:
			var xx: int = x+d.x;var zz: int = z+d.y
			if xx<0 or xx>=width or zz<0 or zz>=height:continue
			var j := zz*width+xx
			if mask[j]==0 or closed[j]!=0 or (d.x!=0 and d.y!=0 and (mask[z*width+xx]==0 or mask[zz*width+x]==0)):continue
			var score: float = costs[k]+sqrt(d.x*d.x+d.y*d.y)*(1.0/road_boost(j) if prefer_roads else 1.0)
			if score<costs[j]:
				costs[j]=score;previous[j]=k
				var dx := xx-(goal%width);var dz := zz-floori(float(goal)/width)
				heap.push(score+0.45*sqrt(dx*dx+dz*dz),j)
	return null


const FOOTPRINTS := {"hall":[5.6,5.0],"house":[4,3.6],"lumber":[4.8,5],"quarry":[4.6,5],"hunter":[4.6,5],"fisher":[4.9,4.6],"farm":[4.8,5],"well":[3.2,3.2],"barracks":[5,5],"study":[5,5],"warehouse":[5.6,5],"cellar":[5,4.4],"market":[11,10.2],"archery":[5,5],"forester":[4.8,5],"claypit":[4.7,4.4],"pottery_kiln":[4.7,4.6],"pasture":[4.8,4.8],"mason":[4.8,5],"saw":[5,5],"mill":[4.8,5],"bakery":[5,5],"mine":[5,6],"coal":[5,6],"smelter":[5,6],"smith":[5,6],"stable":[5,6],"steelworks":[5.4,5.3],"engineworks":[5.4,5.3],"polytechnic":[5.4,5.3],"railstation":[5.6,6],"printer":[5.5,5.3],"powdermill":[5.5,5.3],"inn":[6,5],"trade_yard":[5,6],"siegeworkshop":[5,6],"watermill":[6,5],"harbor":[5.3,8.3],"cartwright":[5,6],"coppermine":[5,6],"tinmine":[5,6],"bronze_foundry":[5.3,6],"road_depot":[5.2,5],"keep":[5.7,5.3],"gatehouse":[5.4,5.1],"woodgate":[3.5,2.1],"guildhall":[5.3,5],"chapel":[5.3,5.1],"monastery":[5.4,5.1],"watchtower":[4.7,4.6],"stonetower":[5.2,5.0]}

static func clearance(building: Dictionary) -> Variant:
	if building.is_empty() or building.type in ["bridge","field"]:return null
	if building.get("bronzeWall",false) and building.type=="stonetower":return {"rx":2.4,"rz":2.4}
	if building.get("bronzeWall",false) and building.type=="gatehouse":
		var angle: Variant=building.get("buildingRotationV228")
		if angle!=null:
			var c:=absf(cos(float(angle)));var s:=absf(sin(float(angle)))
			return {"rx":3.5*c+2.2*s,"rz":3.5*s+2.2*c}
		return {"rx":2.2 if building.get("wallAxis",false) else 3.5,"rz":3.5 if building.get("wallAxis",false) else 2.2}
	if building.type in ["palisade","stonewall","reinforced_wall"]:
		if building.has("wallAngleV175") and building.wallAngleV175!=null:return wall_footprint(building,0.6)
		var thin:=2.35 if building.type=="palisade" and int(building.get("woodFortTierV1757",0))==2 else 1.1
		var span:=float(building.get("palisadeSpanV167",14 if building.get("extendedPalisadeV166",false) else 7)) if building.type=="palisade" else 7.0
		var half:=maxf(3.6,span/2+0.35);var vertical:=bool(building.get("wallAxis",false))
		return {"rx":maxf(thin if vertical else half,float(building.get("navWidth",0))),"rz":maxf(half if vertical else thin,float(building.get("navDepth",0)))}
	var footprint: Array = FOOTPRINTS.get(building.type,[5.0,5.0])
	var rx := maxf(footprint[0],float(building.get("navWidth",0)))
	var rz := maxf(footprint[1],float(building.get("navDepth",0)))
	var angle: Variant = building.get("buildingRotationV228",building.get("shoreAngle"))
	if angle!=null:
		var c := absf(cos(float(angle)));var s := absf(sin(float(angle)))
		return {"rx":c*rx+s*rz,"rz":s*rx+c*rz}
	return {"rx":rx,"rz":rz}

static func wall_footprint(wall: Dictionary,pad:=0.0) -> Dictionary:
	var angle:=float(wall.get("wallAngleV175",PI/2 if wall.get("wallAxis",false) else 0))
	var half:=float(wall.get("palisadeSpanV167",7))/2+pad
	var thin: float=(2.35 if wall.type=="palisade" and int(wall.get("woodFortTierV1757",0))==2 else 1.1)+pad
	return {"rx":absf(cos(angle))*half+absf(sin(angle))*thin,"rz":absf(sin(angle))*half+absf(cos(angle))*thin}

static func door(building: Dictionary) -> Dictionary:
	if building.has("landEntry"):return building.landEntry.duplicate()
	if building.has("accessEntry"):return building.accessEntry.duplicate()
	var size: Variant = clearance(building)
	if building.has("buildingRotationV228"):
		var angle: float = building.buildingRotationV228
		var footprint: Array = FOOTPRINTS.get(building.type,[5,5])
		var front := maxf(footprint[1],float(building.get("navDepth",0)))+1.15
		return {"x":building.x+sin(angle)*front,"z":building.z+cos(angle)*front}
	return {"x":building.x,"z":building.z+(float(size.rz) if size!=null else 2.5)+1.15}

func paint(x: float,z: float,rx: float,rz: float,circle: bool) -> void:
	for zz in range(floori(z-rz),ceili(z+rz)+1):
		for xx in range(floori(x-rx),ceili(x+rx)+1):
			if circle:
				if sqrt(pow(xx-x,2)+pow(zz-z,2))>rx:continue
			elif absf(xx-x)>rx or absf(zz-z)>rz:continue
			var i := index(xx,zz)
			if i>=0:mask[i]=0

func rebuild(buildings: Array,resources: Array) -> void:
	revision+=1
	cached_goal="";cached_path.clear()
	access_components=PackedInt32Array()
	mask=base.duplicate()
	for b in buildings:
		if b.get("virtual",false) or float(b.get("hp",1))<=0:continue
		if b.type in ["palisade","stonewall","reinforced_wall"] and b.has("wallAngleV175") and b.wallAngleV175!=null:
			var ext:=wall_footprint(b,1.25);var angle:=float(b.wallAngleV175);var c:=cos(angle);var s:=sin(angle)
			var half:=float(b.get("palisadeSpanV167",7))/2+0.55
			var thin: float=(2.35 if b.type=="palisade" and int(b.get("woodFortTierV1757",0))==2 else 1.1)+0.55
			for z in range(floori(float(b.z)-ext.rz),ceili(float(b.z)+ext.rz)+1):
				for x in range(floori(float(b.x)-ext.rx),ceili(float(b.x)+ext.rx)+1):
					var dx:=float(x)-float(b.x);var dz:=float(z)-float(b.z)
					if absf(dx*c-dz*s)<=half and absf(dx*s+dz*c)<=thin:
						var cell_index:=index(x,z)
						if cell_index>=0:mask[cell_index]=0
			continue
		if b.type in ["gatehouse","woodgate"]:
			var wide:=bool(b.get("extendedPalisadeV166",false));var offset:=5.2 if wide else 2.55;var post:=1.6 if wide else 1.35
			if b.has("wallAngleV175") and b.wallAngleV175!=null:
				var angle:=float(b.wallAngleV175);var c:=cos(angle);var s:=sin(angle)
				for z in range(floori(float(b.z)-8),ceili(float(b.z)+8)+1):
					for x in range(floori(float(b.x)-8),ceili(float(b.x)+8)+1):
						var dx:=float(x)-float(b.x);var dz:=float(z)-float(b.z);var along:=dx*c-dz*s;var across:=dx*s+dz*c
						if absf(across)<=0.95 and absf(absf(along)-offset)<=post:
							var cell_index:=index(x,z)
							if cell_index>=0:mask[cell_index]=0
			else:
				for side in [-1,1]:
					if b.get("wallAxis",false):paint(b.x,float(b.z)+side*offset,0.95,post,false)
					else:paint(float(b.x)+side*offset,b.z,post,0.95,false)
			continue
		var size: Variant = clearance(b)
		if size!=null:paint(b.x,b.z,size.rx,size.rz,false)
	for resource in resources:
		if resource.kind not in ["game","fish","berry"] and not resource.get("removed",false) and float(resource.get("amount",0))>0:
			var radius := 1.4 if resource.kind=="tree" else 3.0
			paint(resource.x,resource.z,radius,radius,true)
	var buried:=0
	for key in heat.keys():
		var cell_index:=int(key)
		if cell_index<0 or cell_index>=mask.size() or mask[cell_index]!=1:
			heat.erase(key);heat_last.erase(key);buried+=1
	if buried>0 and not trail_world.is_empty():trail_world.trailChanges=float(trail_world.get("trailChanges",0))+1.0

# Preserve the routes that already connect the hall to building doors, workers
# carrying goods and cargo. The baseline components are reused until rebuild.
func label_access_components() -> void:
	if access_components.size()==mask.size():return
	access_components.resize(mask.size());access_components.fill(0)
	var queue:=PackedInt32Array();queue.resize(mask.size());var label:=0
	for start in mask.size():
		if mask[start]==0 or access_components[start]!=0:continue
		label+=1;var head:=0;var tail:=1;queue[0]=start;access_components[start]=label
		while head<tail:
			var k:=queue[head];head+=1;var x:=k%width
			for next in [k-1 if x>0 else -1,k+1 if x+1<width else -1,k-width if k>=width else -1,k+width if k+width<mask.size() else -1]:
				if next>=0 and mask[next]!=0 and access_components[next]==0:
					access_components[next]=label;queue[tail]=next;tail+=1

func reachable(from: Dictionary,to: Dictionary) -> bool:
	var a:=index(from.x,from.z);var b:=index(to.x,to.z)
	if a<0 or b<0 or mask[a]==0 or mask[b]==0:return false
	label_access_components()
	return access_components[a]!=0 and access_components[a]==access_components[b]

func preserves_access(candidate: Dictionary,buildings: Array,workers: Dictionary,cargo: Array) -> bool:
	var bounds: Variant=clearance(candidate)
	if bounds==null:return true
	var hall: Variant=null;var anchors: Array=[]
	for building in buildings:
		if building.get("virtual",false) or float(building.get("hp",0))<=0 or clearance(building)==null:continue
		if building.type=="hall":hall=building
		anchors.append(door(building))
	if hall==null:return true
	var from: Variant=nearest(door(hall))
	if from==null:return false
	for worker in workers.values():
		if worker is Dictionary and float(worker.get("carried",0))>0 and worker.has("x") and worker.has("z"):anchors.append(worker)
	for item in cargo:
		if item is Dictionary and item.has("x") and item.has("z"):anchors.append(item)
	if anchors.size()==1:
		return absf(float(from.x)-float(candidate.x))>bounds.rx or absf(float(from.z)-float(candidate.z))>bounds.rz
	label_access_components()
	var start:=index(from.x,from.z);var baseline:=access_components[start];var targets: Dictionary={}
	for anchor in anchors:
		var p: Variant=nearest(anchor)
		if p==null:continue
		var id:=index(p.x,p.z)
		if access_components[id]==baseline:targets[id]=true
	var blocked:=mask.duplicate()
	for z in range(floori(float(candidate.z)-bounds.rz),ceili(float(candidate.z)+bounds.rz)+1):
		for x in range(floori(float(candidate.x)-bounds.rx),ceili(float(candidate.x)+bounds.rx)+1):
			if absf(x-float(candidate.x))<=bounds.rx and absf(z-float(candidate.z))<=bounds.rz:
				var at:=index(x,z)
				if at>=0:blocked[at]=0
	if blocked[start]==0:return false
	var queue:=PackedInt32Array();queue.resize(mask.size());var seen:=PackedByteArray();seen.resize(mask.size())
	var head:=0;var tail:=1;queue[0]=start;seen[start]=1;targets.erase(start)
	while head<tail and not targets.is_empty():
		var k:=queue[head];head+=1;var x:=k%width
		for next in [k-1 if x>0 else -1,k+1 if x+1<width else -1,k-width if k>=width else -1,k+width if k+width<mask.size() else -1]:
			if next>=0 and blocked[next]!=0 and seen[next]==0:
				seen[next]=1;queue[tail]=next;tail+=1;targets.erase(next)
	return targets.is_empty()

var cached_goal := ""
var cached_path: Array = []
var failed_time := 0.0

func clear_line(a: Dictionary,b: Dictionary) -> bool:
	var distance := sqrt(pow(float(a.x)-b.x,2)+pow(float(a.z)-b.z,2))
	var n := maxi(1,ceili(distance*4))
	for i in range(n+1):
		if not is_open(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n):return false
	return true

func record_traffic(from: Dictionary,to: Dictionary,weight := 1.0) -> void:
	var distance := sqrt(pow(float(from.x)-to.x,2)+pow(float(from.z)-to.z,2))
	if distance<=0:return
	var samples := maxi(1,ceili(distance/0.25))
	var contribution := distance/samples*maxf(0,weight)
	for j in samples:
		var fraction := (j+0.5)/samples
		var k := index(from.x+(to.x-from.x)*fraction,from.z+(to.z-from.z)*fraction)
		if k<0 or mask[k]!=1:continue
		var key := str(k)
		heat[key] = minf(125,road_strength(k)+contribution)
		heat_last[key] = trail_time
	if not trail_world.is_empty():trail_world.trailChanges=float(trail_world.get("trailChanges",0))+distance*maxf(0,weight)

func move(agent: Dictionary,target: Dictionary,dt: float,speed := 3.0,citizen := false) -> bool:
	agent.moving=false
	if target.is_empty() or dt<=0:return false
	if not is_open(agent.x,agent.z):
		var position: Variant = nearest(agent)
		if position==null:return false
		agent.x=position.x;agent.z=position.z;cached_goal="";cached_path.clear()
	var goal: Variant = nearest(target)
	if goal==null:return false
	var key := str(goal.x)+":"+str(goal.z)
	if cached_goal!=key:
		var distance := sqrt(pow(float(agent.x)-goal.x,2)+pow(float(agent.z)-goal.z,2))
		var route_result: Variant = [goal] if not citizen and distance<3 and clear_line(agent,goal) else route(agent,goal)
		cached_path = route_result if route_result!=null else []
		cached_goal=key;failed_time=0.0
	var remaining_distance := sqrt(pow(float(agent.x)-goal.x,2)+pow(float(agent.z)-goal.z,2))
	if cached_path.is_empty() and remaining_distance>0.18:
		failed_time+=dt
		if failed_time>4:cached_goal="";agent.pathFailure=int(agent.get("pathFailure",0))+1
		return false
	var remaining := dt
	while not cached_path.is_empty() and remaining>0 and speed>0:
		var p: Dictionary = cached_path[0]
		var d := sqrt(pow(float(agent.x)-p.x,2)+pow(float(agent.z)-p.z,2))
		if d<0.015:cached_path.pop_front();continue
		var k := index(agent.x,agent.z)
		var boost := road_boost(k) if k>=0 else 1.0
		var step := minf(d,speed*remaining*boost)
		var next := {"x":agent.x+(p.x-agent.x)/d*step,"z":agent.z+(p.z-agent.z)/d*step}
		if not clear_line(agent,next):cached_goal="";cached_path.clear();break
		record_traffic(agent,next)
		agent.heading=atan2(p.x-agent.x,p.z-agent.z)
		agent.x=next.x;agent.z=next.z
		remaining-=step/(speed*boost)
		agent.moving=true
		if step>=d-0.001:cached_path.pop_front()
	return sqrt(pow(float(agent.x)-goal.x,2)+pow(float(agent.z)-goal.z,2))<0.18


func clone_for_agent() -> LocalNavigation:
	var copy=LocalNavigation.new(min_x,min_z,width,height,func(_x,_z):return true)
	copy.base=base.duplicate();copy.mask=mask.duplicate()
	copy.heat=heat;copy.heat_last=heat_last;copy.trail_time=trail_time
	copy.trail_world=trail_world
	return copy
