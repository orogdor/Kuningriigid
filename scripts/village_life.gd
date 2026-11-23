extends Node3D

const Terrain=preload("res://scripts/detail_terrain.gd")
const Motion=preload("res://scripts/human_motion.gd")
const Discoveries=preload("res://scripts/world_discoveries.gd")
const Equipment=preload("res://scripts/human_equipment.gd")
const MarkerModels=preload("res://scripts/world_marker_models.gd")
const HUMAN=preload("res://assets/people/human_far.glb")
const GUARD=preload("res://assets/people/spearman_v262.glb")
const HOMES:=[Vector2(-15,-15),Vector2(14,-16),Vector2(0,16),Vector2(-17,13),Vector2(17,12),Vector2(-9,18),Vector2(19,-3),Vector2(-21,0),Vector2(9,-17),Vector2(5,19)]
const ACTIONS:={"chat":"talk","work":"build","carry":"carry","sit":"sit","rest":"sit","eat":"eat","play":"play","celebrate":"play","guard":"guard"}
var host: Node
var heights: Array=[]
var visual_heights:=PackedVector4Array()
var site_id: String=""
var site_tile:=Vector2i.ZERO
var team: int=-1
var actors: Array=[]
var cursor:=0

func setup(owner: Node,id: String,tile: Vector2i,tile_heights: Array,owner_team: int,nearby:=false,visual:=PackedVector4Array()) -> void:
	host=owner;site_id=id;site_tile=tile;heights=tile_heights;visual_heights=visual;team=owner_team
	for i in (2 if nearby else 6):
		var root:=Node3D.new();add_child(root)
		var figure: Node3D=(GUARD if i==0 else HUMAN).instantiate()
		if i==0:MarkerModels.apply_colors(figure)
		figure.scale=Vector3.ONE*(1.66*(1.03 if i==0 else 0.69 if i==3 else 0.94));root.add_child(figure)
		var basket:=Equipment.attach(figure,"hand_L","load_basket",Vector3(0,-0.04,0.04))
		if basket!=null:basket.visible=false
		var p: Vector2=HOMES[i%HOMES.size()];root.position=Vector3(p.x,Terrain.visual_rendered_height(heights,visual_heights,p.x,p.y),p.y)
		var motion:=Motion.new();motion.phase=float(i)*0.17
		actors.append({"index":i,"root":root,"figure":figure,"basket":basket,"motion":motion,"position":p,"path":[],"pathKey":"","activity":"home"})

static func time_period(time: float) -> String:
	var hour:=fposmod(8.0+time/60.0,24.0)
	return "night" if hour>=21 or hour<6 else "morning" if hour<9 else "day" if hour<17 else "evening"

static func activity(id: String,index: int,time: float,threat:=false) -> String:
	if threat:return "panic"
	var period:=time_period(time)
	if index==0:return "guard" if period=="night" else "patrol"
	if period=="night":return "guard" if index==1 else "sleep"
	if index==3:return "eat" if period=="evening" else "rest" if floori((time+index*13)/17.0)%4==0 else "play"
	var hash:=floori(Discoveries.text_hash(id)*4294967296.0)
	var slot:=floori((time+index*8+hash%19)/34.0)
	if period=="evening":
		if index in [1,2]:return "chat"
		return ["sit","eat","chat","rest","visit"][(slot+index)%5]
	if period=="morning":
		if index in [1,2]:return "visit"
		return ["carry","stroll","eat","rest"][(slot+index)%4]
	if index in [1,2] and slot%3!=1:return "chat"
	return ["stroll","rest","carry","visit","work","eat","sit","chat"][(slot+index+hash%7)%8]

static func destination(id: String,index: int,action: String,time: float) -> Vector2:
	var seed:=floori(Discoveries.text_hash(id)*4294967296.0);var home: Vector2=HOMES[index%HOMES.size()]
	var phase: float=(time+index*7)/11.0
	match action:
		"sleep","home":return home
		"chat":return Vector2(26+(-0.9 if index%2 else 0.9),-5+(-0.8 if index%2 else 0.8))
		"sit","rest":return Vector2(-7+(index%3)*7,25)
		"eat":return Vector2(3+(index%4-1.5)*2.2,25)
		"carry":return Vector2(-31 if index%2 else 31,10+(index%3)*5)
		"work":return Vector2(-29+(index%3)*3,-11)
		"visit":return Vector2(-22 if index%2 else 22,-6+(index%4)*4)
		"play":return Vector2(-20+9*sin(phase),31+5*cos(phase*0.75))
		"patrol","guard":return Vector2(32*cos(phase*0.25),27*sin(phase*0.25))
		"panic":return Vector2(clampf(home.x*1.8,-49,49),clampf(home.y*1.8,-46,46))
		"celebrate":return Vector2((index-3)*2.7,24)
	return Vector2(28*cos(seed%11+phase*0.35),24*sin(seed%11+phase*0.35))

func _process(delta: float) -> void:
	if host==null or host.paused or host.simulation_paused or host.menu_open or not host.detail_mode:return
	var time:=float(host.game.time);var threat:=false
	for army in host.game.get("armies",[]):
		if int(army.team)!=0 and int(army.team)!=team and int(army.c)==site_tile.x and int(army.r)==site_tile.y and float(army.get("hp",1))!=0:threat=true;break
	var nav: Variant=null
	if team==0 and host.city_created and host.player==site_tile and not host.settler_mode:nav=host.city_nav
	elif site_id.begins_with("city:"):
		var runtime: Dictionary=host.city_runtimes.get(site_id.trim_prefix("city:"),{})
		nav=runtime.get("nav")
	for actor in actors:
		var i:=int(actor.index);var act:=activity(site_id,i,time,threat);var goal:=destination(site_id,i,act,time)
		var p: Vector2=actor.position;var key:=str(roundi(goal.x*2))+":"+str(roundi(goal.y*2))
		if actor.pathKey!=key and (nav==null or cursor==i):
			actor.pathKey=key;var target:=goal
			if nav!=null:
				var nearest: Variant=nav.nearest({"x":goal.x,"z":goal.y})
				if nearest!=null:target=Vector2(nearest.x,nearest.z)
				var path: Variant=nav.route({"x":p.x,"z":p.y},{"x":target.x,"z":target.y})
				actor.path=path if path!=null else []
			else:actor.path=[{"x":target.x,"z":target.y}]
			actor.goal=target
		var path: Array=actor.path
		while path.size()>1 and p.distance_to(Vector2(path[0].x,path[0].z))<0.35:path.pop_front()
		var target: Vector2=Vector2(path[0].x,path[0].z) if not path.is_empty() else p
		var distance:=p.distance_to(target);var speed:=5.5 if act=="panic" else 3.0 if act=="play" else 1.8 if act=="patrol" else 2.1
		if distance>0.05:p=p.lerp(target,minf(distance,minf(0.2,delta)*speed)/distance)
		actor.position=p;actor.activity=act
		var remaining:=p.distance_to(actor.get("goal",goal));var moving:=remaining>0.35 and not path.is_empty()
		var root: Node3D=actor.root;root.position=Vector3(p.x,Terrain.visual_rendered_height(heights,visual_heights,p.x,p.y),p.y)
		if distance>0.1:root.rotation.y=atan2(target.x-p.x,target.y-p.y)
		root.visible=not (act=="sleep" and remaining<0.8)
		if actor.basket!=null:actor.basket.visible=act=="carry"
		actor.motion.apply(actor.figure,time,moving,str(ACTIONS.get(act,"")))
	cursor=(cursor+1)%maxi(1,actors.size())
