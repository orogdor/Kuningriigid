extends RefCounted

var animals: Dictionary={}

static func hash_value(n: int) -> float:
	var h: int=(n*2654435761)&0xffffffff
	h=h^(h>>15)
	return float(h&0xffffffff)/4294967296.0

static func move(state: Dictionary,goal: Vector2,speed: float,dt: float,nav: Variant) -> bool:
	var p:=Vector2(float(state.x),float(state.z));var distance:=p.distance_to(goal)
	if distance<0.08:return false
	var next:=p.lerp(goal,minf(1.0,speed*dt/distance))
	if nav!=null and not nav.is_open(next.x,next.y):return false
	state.x=next.x;state.z=next.y;state.heading=atan2(goal.x-p.x,goal.y-p.y)
	return distance>0.25

func update(resource: Dictionary,time: float,dt: float,people: Array,hunters: Dictionary,nav: Variant) -> Dictionary:
	var id:=int(resource.id)
	if not animals.has(id):animals[id]={"x":resource.x,"z":resource.z,"heading":hash_value(id)*6.28,"mode":"graze","until":0.0,"shot":-1.0}
	var a: Dictionary=animals[id];var hunter: Variant=hunters.get(id);var moving:=false;var running:=false;var lying:=false
	if hunter is Dictionary and hunter.get("phase","")=="work":
		if float(a.shot)<0:a.shot=time
		lying=time-float(a.shot)>1.1
	elif hunter is Dictionary and hunter.get("phase","")=="return":lying=true
	else:
		if float(a.shot)>=0 and hunter==null:a.x=float(resource.x)+1.5;a.z=float(resource.z)-1;a.mode="graze"
		a.shot=-1.0
		var threat: Variant=null;var nearest:=INF
		for person in people:
			if hunter!=null and int(person.get("hunterOf",-1))==id:continue
			var d:=Vector2(float(person.x)-float(a.x),float(person.z)-float(a.z)).length()
			if d<nearest:nearest=d;threat=person
		if threat!=null and nearest<9:
			a.mode="flee";a.from=Vector2(float(threat.x),float(threat.z));a.until=time+3
		if a.mode=="flee":
			var direction: Vector2=Vector2(float(a.x),float(a.z))-a.from;var distance:=direction.length()
			if distance<0.000001:direction=Vector2(sin(float(a.heading)),cos(float(a.heading)))
			else:direction/=distance
			var p:=Vector2(float(a.x),float(a.z))
			running=move(a,p+direction*3,6.5,dt,nav)
			if not running:running=move(a,p+Vector2(-direction.y,direction.x)*3,6.5,dt,nav)
			moving=running
			if distance>17 or time>float(a.until)+4:a.mode="return"
		elif a.mode=="return":
			moving=move(a,Vector2(resource.x,resource.z),1.1,dt,nav)
			if not moving:a.mode="graze"
		else:
			var k:=floori(time/7.0+id*3.1);var angle:=hash_value(k*7+id)*TAU;var distance:=hash_value(k*13+id*5)*3.2
			moving=move(a,Vector2(resource.x,resource.z)+Vector2(cos(angle),sin(angle))*distance,0.55,dt,nav)
	return {"x":a.x,"z":a.z,"heading":a.heading,"moving":moving,"running":running,"lying":lying,"grazing":not moving and not lying}
