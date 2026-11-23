extends Node3D

const ROOT:="res://assets/world/dog/"
static var scenes: Dictionary={}
var body: Node3D
var neck: Node3D
var head: Node3D
var tail: Node3D
var hips: Array[Node3D]=[]
var knees: Array[Node3D]=[]

static func part(name: String) -> Node3D:
	if not scenes.has(name):scenes[name]=load(ROOT+name+".glb")
	return scenes[name].instantiate()

func _ready() -> void:
	body=Node3D.new();body.position.y=0.36;add_child(body);body.add_child(part("body"))
	neck=Node3D.new();neck.position=Vector3(0,0.06,0.24);neck.rotation.x=-0.75;body.add_child(neck);neck.add_child(part("neck"))
	head=Node3D.new();head.position=Vector3(0,0.17,0.02);head.rotation.x=0.75;neck.add_child(head);head.add_child(part("head"))
	for coord in [Vector2(-0.07,0.17),Vector2(0.07,0.17),Vector2(-0.07,-0.17),Vector2(0.07,-0.17)]:
		var hip:=Node3D.new();hip.position=Vector3(coord.x,-0.04,coord.y);body.add_child(hip);hip.add_child(part("hip"));hips.append(hip)
		var knee:=Node3D.new();knee.position.y=-0.16;hip.add_child(knee);knee.add_child(part("knee"));knees.append(knee)
	tail=Node3D.new();tail.position=Vector3(0,0.05,-0.27);tail.rotation.x=-0.7;body.add_child(tail);tail.add_child(part("tail"))

func pose(time: float,moving: bool) -> void:
	if body==null:return
	var t:=time*(10.0 if moving else 1.0)
	for i in hips.size():
		var phase:=0.0 if i==0 or i==3 else PI
		var stride:=sin(t+phase) if moving else 0.0
		hips[i].rotation.x=stride*0.55
		knees[i].rotation.x=maxf(0,-sin(t+phase+0.6))*0.8*(-1 if i<2 else 1) if moving else 0.0
	body.position.y=0.36+(absf(sin(t))*0.025 if moving else 0.004*sin(time*2.2))
	body.rotation.x=0.03*sin(t*2) if moving else 0.0
	tail.rotation.z=sin(time*(9 if moving else 5))*0.45;tail.rotation.x=-0.5 if moving else -0.8
	head.rotation.y=0.08*sin(t*0.5) if moving else 0.4*sin(time*0.6)
	head.rotation.x=0.75+(0.06*sin(t*2) if moving else 0.08*sin(time*1.3))
