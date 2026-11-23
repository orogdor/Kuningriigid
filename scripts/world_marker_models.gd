class_name WorldMarkerModels
extends RefCounted

const HUMAN=preload("res://assets/people/human_far.glb")
const WARRIORS=[preload("res://assets/people/spearman_v262.glb"),preload("res://assets/people/axeman_v262.glb"),preload("res://assets/people/slinger_v262.glb")]
const Motion=preload("res://scripts/human_motion.gd")
const Dog=preload("res://scripts/scout_dog.gd")
const Fits=preload("res://data/building_fits.json")
const TEAM_COLORS:=["88bdb1","d27b61","b095dc","e2c164"]
static var materials: Dictionary={}
static var vertex_surfaces: Dictionary={}
static var village_glow_texture: ImageTexture

static func add_people(parent: Node3D,kind: String,team:=0,upgrade:=0) -> void:
	var positions: Array=[Vector2(-0.21,0.10),Vector2(0.21,0.10),Vector2(-0.11,-0.21),Vector2(0.11,-0.21),Vector2(0,0.36)] if kind=="settler" else [Vector2(-0.10,0),Vector2(0.10,0),Vector2(0,-0.12)] if kind=="army" else [Vector2.ZERO]
	var people: Array=[]
	for i in positions.size():
		var scene: PackedScene=WARRIORS[i] if kind=="army" else WARRIORS[0] if kind=="settler" and i==4 else HUMAN
		var body: Node3D=scene.instantiate()
		if scene!=HUMAN:apply_colors(body)
		body.position=Vector3(positions[i].x,0,positions[i].y)*(3 if kind=="army" and upgrade>0 else 1)
		body.scale=Vector3.ONE*(1.66*(0.38 if kind=="settler" else 0.48 if kind=="caravan" else (0.16 if kind=="scout" else 0.1333)*(1 if upgrade==0 else 3)))
		parent.add_child(body)
		var motion:=Motion.new();motion.phase=float(i)*0.71
		people.append({"node":body,"motion":motion})
	if kind=="scout":
		var dog:=Dog.new();dog.name="ScoutDog"
		var dog_scale:=0.16*(1 if upgrade==0 else 3)
		dog.position=Vector3(0.55,0,-0.15)*dog_scale;dog.scale=Vector3.ONE*dog_scale;parent.add_child(dog)
	parent.set_meta("world_people",people)
	var pole:=MeshInstance3D.new();var pole_mesh:=BoxMesh.new();pole_mesh.size=Vector3(0.025,0.95,0.025);pole.mesh=pole_mesh
	var wood:=StandardMaterial3D.new();wood.albedo_color=Color("715a3b");pole.material_override=wood
	pole.position=Vector3(-0.30,0.48,-0.2);parent.add_child(pole)
	var flag:=MeshInstance3D.new();var flag_mesh:=BoxMesh.new();flag_mesh.size=Vector3(0.22,0.15,0.015);flag.mesh=flag_mesh
	var tint:=StandardMaterial3D.new();tint.albedo_color=Color(TEAM_COLORS[clampi(team,0,3)]);flag.material_override=tint
	flag.position=Vector3(-0.19,0.85,-0.2);parent.add_child(flag)

static func animate(parent: Node3D,time: float,moving: bool) -> void:
	for person in parent.get_meta("world_people",[]):person.motion.apply(person.node,time,moving)
	var dog=parent.get_node_or_null("ScoutDog")
	if dog!=null:dog.pose(time,moving)

static func apply_colors(node: Node) -> void:
	if node is MeshInstance3D and node.mesh!=null:
		for surface in node.mesh.get_surface_count():
			var key:=str(node.mesh.get_instance_id())+":"+str(surface)
			if not vertex_surfaces.has(key):
				var arrays: Array=node.mesh.surface_get_arrays(surface)
				vertex_surfaces[key]=arrays[Mesh.ARRAY_COLOR]!=null and not arrays[Mesh.ARRAY_COLOR].is_empty()
			if not vertex_surfaces[key]:continue
			var source: Material=node.get_active_material(surface)
			if not source is BaseMaterial3D:continue
			var id:=source.get_instance_id()
			if not materials.has(id):
				var copy: BaseMaterial3D=source.duplicate();copy.vertex_color_use_as_albedo=true;materials[id]=copy
			node.set_surface_override_material(surface,materials[id])
	for child in node.get_children():apply_colors(child)

static func add_building(parent: Node3D,type: String,age: int,position: Vector3,scale_factor: float) -> void:
	var id:=type
	for tier in range(clampi(age,0,2),0,-1):
		if Fits.data.has(type+"@"+str(tier)):id=type+"@"+str(tier);break
	if not Fits.data.has(id):return
	var path: String="res://assets/buildings/"+id+".glb"
	if not ResourceLoader.exists(path):return
	var model: Node3D=load(path).instantiate()
	var fit: Dictionary=Fits.data[id]
	var wrapper:=Node3D.new();wrapper.position=position;wrapper.scale=Vector3.ONE*scale_factor
	model.scale=Vector3(fit.scale[0],fit.scale[1],fit.scale[2])
	model.position=Vector3(fit.offset[0],fit.offset[1],fit.offset[2])
	apply_colors(model);wrapper.add_child(model);parent.add_child(wrapper)

static func add_city(parent: Node3D,name: String,team: int,age: int) -> void:
	var path: String="res://assets/world/settlements/settlement_%d_%d.glb" % [clampi(team,0,3),clampi(age,0,6)]
	if ResourceLoader.exists(path):
		var source: Node=load(path).instantiate();var original:=find_mesh(source)
		if original!=null:
			var model:=MeshInstance3D.new();model.name="CityModel";model.mesh=original.mesh
			var material:=StandardMaterial3D.new();material.vertex_color_use_as_albedo=true;material.roughness=0.95;material.cull_mode=BaseMaterial3D.CULL_DISABLED
			model.material_override=material;model.scale=Vector3.ONE*0.04;parent.add_child(model)
		source.free()
	var label:=Label3D.new();label.name="CityName";label.text=name;label.font_size=28;label.pixel_size=0.008
	label.billboard=BaseMaterial3D.BILLBOARD_ENABLED;label.no_depth_test=true
	label.position=Vector3(0,1.3,-0.5);label.visible=false;parent.add_child(label)

static func add_landmark(parent: Node3D,landmark: Dictionary,show_buildings:=true) -> void:
	if landmark.kind=="village" and show_buildings:
		add_building(parent,"hall",0,Vector3.ZERO,0.07)
		add_building(parent,"house",0,Vector3(-0.55,0,-0.35),0.045)
		add_building(parent,"house",0,Vector3(0.50,0,0.32),0.045)
		if WorldDiscoveries.village_type(landmark)=="raiders":add_building(parent,"watchtower",0,Vector3(0.5,0,-0.50),0.045)
	elif landmark.kind!="village":
		var rock:=MeshInstance3D.new()
		var rock_model: Node=load("res://assets/world/rock_low.glb").instantiate()
		var mesh:=find_mesh(rock_model)
		if mesh!=null:rock.mesh=mesh.mesh
		var surface:=StandardMaterial3D.new();surface.vertex_color_use_as_albedo=true;surface.roughness=1.0
		rock.material_override=surface;rock.scale=Vector3.ONE*0.22;parent.add_child(rock);rock_model.free()
	var label:=Label3D.new();label.name="LandmarkName"
	label.text="Röövlite küla" if WorldDiscoveries.village_type(landmark)=="raiders" else "Kaupmeeste küla" if landmark.kind=="village" else "Muistsed varemed"
	label.font_size=25;label.pixel_size=0.007;label.billboard=BaseMaterial3D.BILLBOARD_ENABLED;label.no_depth_test=true
	label.position=Vector3(0,1.0,-0.4);parent.add_child(label)
	if landmark.kind=="village":
		if village_glow_texture==null:
			var image:=Image.create(128,128,false,Image.FORMAT_RGBA8)
			for y in 128:
				for x in 128:
					var d:=Vector2(float(x)-63.5,float(y)-63.5).length()/64.0
					var color:=Color(1.0,0.86,0.59,1.0).lerp(Color(1.0,0.67,0.31,0.55),clampf(d/0.35,0,1)) if d<0.35 else Color(1.0,0.67,0.31,0.55).lerp(Color(1.0,0.55,0.16,0),clampf((d-0.35)/0.65,0,1))
					image.set_pixel(x,y,color)
			village_glow_texture=ImageTexture.create_from_image(image)
		var glow:=Sprite3D.new();glow.name="VillageGlow";glow.texture=village_glow_texture;glow.pixel_size=1.36/128.0
		glow.billboard=BaseMaterial3D.BILLBOARD_ENABLED;glow.no_depth_test=true;glow.shaded=false;glow.position.y=0.20;glow.visible=false;parent.add_child(glow)

static func find_mesh(node: Node) -> MeshInstance3D:
	if node is MeshInstance3D:return node
	for child in node.get_children():
		var found:=find_mesh(child)
		if found!=null:return found
	return null

static func ship_box(parent: Node3D,at: Vector3,dimensions: Vector3,color: String) -> void:
	var node:=MeshInstance3D.new();var mesh:=BoxMesh.new();mesh.size=dimensions*0.04;node.mesh=mesh
	node.position=at*0.04;var mat:=StandardMaterial3D.new();mat.albedo_color=Color(color);mat.roughness=0.8
	node.material_override=mat;parent.add_child(node)

static func add_ship(parent: Node3D,kind: String,team: int,upgrade: int) -> void:
	var hull:=MeshInstance3D.new();var cylinder:=CylinderMesh.new();cylinder.top_radius=8*0.04;cylinder.bottom_radius=5*0.04;cylinder.height=24*0.04;cylinder.radial_segments=8
	hull.mesh=cylinder;hull.rotation.x=PI/2;hull.scale.x=0.75;hull.position.y=4*0.04
	var wood:=StandardMaterial3D.new();wood.albedo_color=Color("765134");wood.roughness=0.8;hull.material_override=wood;parent.add_child(hull)
	ship_box(parent,Vector3(0,7,0),Vector3(12,3,25),"b08a54")
	ship_box(parent,Vector3(0,17,0),Vector3(0.8,25,0.8),"72563c")
	var sail:=MeshInstance3D.new();var plane:=PlaneMesh.new();plane.size=Vector2(18,17)*0.04;sail.mesh=plane
	sail.rotation.x=PI/2;sail.position=Vector3(0,20*0.04,0)
	var cloth:=StandardMaterial3D.new();cloth.albedo_color=Color(["9fbca6","c4876a","a68dc7","d3b56c"][clampi(team,0,3)]);cloth.cull_mode=BaseMaterial3D.CULL_DISABLED;cloth.roughness=0.9
	sail.material_override=cloth;parent.add_child(sail)
	if kind=="warship":
		for x in [-7,7]:
			for z in [-8,-4,0,4,8]:
				var shield:=MeshInstance3D.new();var shield_mesh:=CylinderMesh.new()
				shield_mesh.top_radius=1.6*0.04;shield_mesh.bottom_radius=1.6*0.04;shield_mesh.height=0.5*0.04;shield_mesh.radial_segments=8
				shield.mesh=shield_mesh;shield.rotation.z=PI/2;shield.position=Vector3(x,8,z)*0.04
				var shield_material:=StandardMaterial3D.new();shield_material.albedo_color=Color("bca373");shield_material.roughness=0.8;shield.material_override=shield_material;parent.add_child(shield)
		ship_box(parent,Vector3(0,7,16),Vector3(1.8,2,10),"9c977f")
	else:
		for x in [-3,3]:
			for z in [-7,6]:ship_box(parent,Vector3(x,10,z),Vector3(4,3,4),"927649")
	if upgrade>=2:
		ship_box(parent,Vector3(0,4,0),Vector3(13,0.8,24),"7f898b")
		ship_box(parent,Vector3(0,15,-8),Vector3(0.6,20,0.6),"72563c")
		var aft:=MeshInstance3D.new();var aft_plane:=PlaneMesh.new();aft_plane.size=Vector2(10,11)*0.04;aft.mesh=aft_plane
		aft.rotation.x=PI/2;aft.position=Vector3(0,17,-8)*0.04
		var aft_cloth:=StandardMaterial3D.new();aft_cloth.albedo_color=Color("d2c49c");aft_cloth.cull_mode=BaseMaterial3D.CULL_DISABLED;aft.material_override=aft_cloth;parent.add_child(aft)
	if upgrade>=3:ship_box(parent,Vector3(0,11,-7),Vector3(8,6,7),"95734b")

# The source world markers add the same simple wagon, train and plane shapes to a traveller.
static func add_freight(parent: Node3D,kind: String,team: int) -> void:
	add_people(parent,"caravan",team)
	freight_box(parent,Vector3(0,0.5,-1),Vector3(0.95,0.65,1.1),"8d714a")
	for side in [-1,1]:
		var wheel:=MeshInstance3D.new();var mesh:=CylinderMesh.new();mesh.top_radius=0.3;mesh.bottom_radius=0.3;mesh.height=0.1;wheel.mesh=mesh
		var mat:=StandardMaterial3D.new();mat.albedo_color=Color("63513a");wheel.material_override=mat;wheel.rotation.z=PI/2;wheel.position=Vector3(side*0.6,0.3,-1)*0.48;wheel.scale=Vector3.ONE*0.48;parent.add_child(wheel)
	if kind=="rail":
		freight_box(parent,Vector3(0,1.2,-1),Vector3(0.9,0.95,2),"697b85")
		freight_box(parent,Vector3(0,1.75,-1.4),Vector3(0.9,0.5,0.75),"c8d6d9")
		freight_box(parent,Vector3(0,1.3,0.4),Vector3(0.75,1.5,1),"54656a")
	elif kind=="air":
		freight_box(parent,Vector3(0,1,0),Vector3(0.65,0.4,2.7),"afbfc1")
		freight_box(parent,Vector3(0,0.9,0),Vector3(3,0.11,0.52),"bfcbd0")
		freight_box(parent,Vector3(0,1.15,-1),Vector3(0.9,0.05,0.45),"748d93")
		freight_box(parent,Vector3(0,1.4,-1.22),Vector3(0.08,0.6,0.35),"95a8ac")

static func freight_box(parent: Node3D,position: Vector3,dimensions: Vector3,color: String) -> void:
	var item:=MeshInstance3D.new();var mesh:=BoxMesh.new();mesh.size=dimensions*0.48;item.mesh=mesh
	var mat:=StandardMaterial3D.new();mat.albedo_color=Color(color);item.material_override=mat;item.position=position*0.48;parent.add_child(item)
