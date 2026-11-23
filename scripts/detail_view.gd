extends Node3D
const Terrain = preload("res://scripts/detail_terrain.gd")
const Landscape = preload("res://scripts/detail_landscape.gd")
const GroundMaterial = preload("res://scripts/detail_ground_material.gd")
const DetailOcean = preload("res://scripts/detail_ocean.gd")
const GroundCover = preload("res://scripts/detail_ground_cover.gd")
const WildlifeMotion = preload("res://scripts/wildlife_motion.gd")
const VillageLife = preload("res://scripts/village_life.gd")
const CityLights = preload("res://scripts/detail_lights.gd")
const Equipment = preload("res://scripts/human_equipment.gd")
const Motion = preload("res://scripts/human_motion.gd")
const Forest = preload("res://scripts/forest_scatter.gd")
const ForestFill = preload("res://scripts/detail_forest_fill.gd")
const VisualRiver=preload("res://scripts/visual_river.gd")
const HUMAN = preload("res://assets/people/human_far.glb")
const OAK = preload("res://assets/world/oak_high.glb")
const PINE = preload("res://assets/world/pine_high.glb")
const PALM = preload("res://assets/world/palm_high.glb")
const ROCK = preload("res://assets/world/rock_high.glb")
const HousePlanModel=preload("res://scripts/house_plan_model.gd")
const MODEL_FITS = preload("res://data/building_fits.json")
const MODEL_ANIMATIONS = preload("res://data/procedural_animations.json")
const TOWN_SHADER = preload("res://scripts/town_material.gdshader")
const FALLBACK_MODEL_TYPES=["nitrate","oilwell","refinery","powerplant","autofactory","airfield","master_workshop","infirmary","keep"]
const BUILD_RULES = preload("res://data/build_rules.json")
const EconomyData=preload("res://data/economy.json")
const EconomyRulesScript=preload("res://scripts/economy_rules.gd")
var heights: Array = []
var visual_heights:=PackedVector4Array()
var resources: Array = []
var world_data: Dictionary = {}
var person: Node3D
const TREE_REFERENCE_HEIGHTS:={"oak":16.76573,"lime":20.28008,"birch":18.25661,"pine":18.16921,"spruce":18.09630,"palm":13.54984}
var tree_instances: Dictionary={}
var tree_lod_levels: Dictionary={}
var tree_lod_dirty:=true
var tree_lod_timer:=0.0
var tree_lod_camera:=Vector3(INF,INF,INF)
var tree_lod_view_height:=0.0
var tree_groups: Dictionary={}
var tree_companions: Dictionary={}
var tree_cell:=Vector2i.ZERO
var tree_counts: Dictionary={}
var tree_biome: String="forest"
var tree_river:=false
var tree_mountain:=false
var tree_seed:=0
var river_segments: Array=[]
var ground_cover: Node3D
var village_life: Node3D
var city_lights: Node3D
var tree_temperature:=0.5
var tree_moisture:=0.5
var tree_textures: Dictionary={}
static var shared_tree_meshes: Dictionary={}
static var shared_tree_textures: Dictionary={}
static var tree_asset_frame: int=-1
static var tree_poll_frame: int=-1
static var tree_requests: Dictionary={}
static var tree_scenes: Dictionary={}
static var tree_failed: Dictionary={}
static var fill_frame: int=-1
static var fill_frame_work:=0
const NATURE_FILES:=["poosas_low","poosas_high","hirv_low","hirv_high"]
static var nature_scenes: Dictionary={}
static var nature_requests: Dictionary={}
var pending_nature: Dictionary={}
var tree_pending:=false
var tree_sync_time:=0.0
var tree_sync_buildings: Array=[]
var forest_fill: RefCounted
var fill_trees: Array=[]
var fill_stamp: String=""
var visible_tree_ids: Array = []
var tree_indices: Dictionary = {}
var visible_animals: Dictionary = {}
var wildlife_motion=WildlifeMotion.new()
var berry_models: Dictionary = {}
var nature_lod_timer:=0.0
var deposit_models: Dictionary = {}
var fish_models: Dictionary={}
var worker_models: Dictionary = {}
var worker_motions: Dictionary = {}
var vertex_materials: Dictionary = {}
var town_material: ShaderMaterial
var vertex_color_surfaces: Dictionary = {}
var building_root: Node3D
var building_animations: Array=[]
var construction_models: Array=[]
var hall_model: Node3D
var builder_person: Node3D
var builder_people: Array[Node3D]=[]
var builder_motions: Array=[]
var trainer_person: Node3D
var trainer_motion=Motion.new()
var person_motion=Motion.new()
var builder_motion=Motion.new()

func build(cells: Array, c: int, r: int, terrain_color: Color, biome: String, seed: int, core_forest: bool, source_world: Dictionary, temperature:=0.5, moisture:=0.5,world_heights:=PackedFloat32Array(),river_graph: Dictionary={}) -> void:
	heights = Terrain.tile_heights(cells,c,r)
	world_data = source_world
	tree_biome=biome;tree_temperature=temperature;tree_moisture=moisture;tree_cell=Vector2i(c,r);tree_river=bool(cells[r*Terrain.Grid.COLS+c].get("river",false))
	tree_mountain=bool(cells[r*Terrain.Grid.COLS+c].get("mountain",false));tree_seed=seed
	resources = world_data.resources
	var instance := MeshInstance3D.new()
	var cache_host:=get_parent()
	if world_heights.size()==cells.size():
		visual_heights=cache_host.detail_visual_for(c,r) if cache_host!=null and cache_host.has_method("detail_visual_for") else VisualRiver.color_heights(cells,world_heights,c,r,seed,river_graph)
	else:visual_heights=PackedVector4Array()
	instance.mesh=cache_host.detail_mesh_for(c,r,heights,visual_heights) if cache_host!=null and cache_host.has_method("detail_mesh_for") else Terrain.build_mesh(heights,Vector2.ZERO,visual_heights)
	GroundMaterial.attach(instance,terrain_color,1.0 if core_forest else 0.0)
	if cache_host!=null and cache_host.has_method("terrain_color") and cache_host.has_method("is_forest_core"):
		var neighbours={"ground_w":Vector2i(-1,0),"ground_e":Vector2i(1,0),"ground_n":Vector2i(0,-1),"ground_s":Vector2i(0,1),"ground_nw":Vector2i(-1,-1),"ground_ne":Vector2i(1,-1),"ground_sw":Vector2i(-1,1),"ground_se":Vector2i(1,1)}
		for key in neighbours:
			var pos: Vector2i=Vector2i(c,r)+neighbours[key];var tint:=terrain_color;var forest:=1.0 if core_forest else 0.0
			if pos.x>=0 and pos.y>=0 and pos.x<Terrain.Grid.COLS and pos.y<Terrain.Grid.ROWS:
				var index:=pos.y*Terrain.Grid.COLS+pos.x
				if cells[index].land:tint=cache_host.terrain_color(index);forest=1.0 if cache_host.is_forest_core(index) else 0.0
			instance.set_instance_shader_parameter(key,Color(tint.r,tint.g,tint.b,forest))
		instance.set_instance_shader_parameter("blend_neighbours",true)
	add_child(instance)
	var water := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(225,195)
	water.mesh = plane
	water.material_override=cache_host.detail_ocean_for(c,r,heights,visual_heights) if cache_host!=null and cache_host.has_method("detail_ocean_for") else DetailOcean.make_material(heights,visual_heights)
	add_child(water)
	var host:=get_parent()
	river_segments=host.detail_landscape_for(self,c,r,heights,visual_heights) if host!=null and host.has_method("detail_landscape_for") else Landscape.build(self,cells,c,r,heights,seed,world_heights,river_graph,true,visual_heights)
	person = HUMAN.instantiate()
	person.scale = Vector3.ONE * 1.66
	person.position = Vector3(0,maxf(0,display_height(0,0)),0)
	add_child(person)
	var bag_path:="res://assets/people/equipment/load_settler.glb"
	if ResourceLoader.exists(bag_path):
		var bag: Node3D=load(bag_path).instantiate();bag.position=Vector3(0,0.91,-0.3)/1.66;bag.scale=Vector3.ONE/1.66;person.add_child(bag)
	add_nature(biome)
	if cells[r*Terrain.Grid.COLS+c].land:add_ground_cover(biome)

func display_height(x: float,z: float) -> float:
	return Terrain.visual_rendered_height(heights,visual_heights,x,z)

func add_ground_cover(biome: String,share:=1.0) -> void:
	if biome in ["mountain","snow_mountain"]:return
	ground_cover=Node3D.new();ground_cover.set_script(GroundCover);add_child(ground_cover)
	ground_cover.setup(tree_cell.x,tree_cell.y,biome,heights,river_segments,share,visual_heights)

func add_village_life(host: Node,id: String,team: int,nearby:=false) -> void:
	if village_life!=null:village_life.queue_free()
	if city_lights!=null:city_lights.queue_free();city_lights=null
	village_life=Node3D.new();village_life.set_script(VillageLife);add_child(village_life)
	village_life.setup(host,id,tree_cell,heights,team,nearby,visual_heights)
	if id.begins_with("city:"):
		city_lights=Node3D.new();city_lights.set_script(CityLights);add_child(city_lights)
		city_lights.setup(host,int(id.trim_prefix("city:")),heights,visual_heights)


func first_mesh(node: Node) -> MeshInstance3D:
	if node is MeshInstance3D: return node
	for child in node.get_children():
		var found := first_mesh(child)
		if found != null: return found
	return null

func apply_vertex_colors(node: Node) -> void:
	if node is MeshInstance3D and node.mesh!=null:
		for surface in node.mesh.get_surface_count():
			var surface_key:=str(node.mesh.get_instance_id())+":"+str(surface)
			if not vertex_color_surfaces.has(surface_key):
				var arrays: Array=node.mesh.surface_get_arrays(surface)
				vertex_color_surfaces[surface_key]=arrays[Mesh.ARRAY_COLOR]!=null and not arrays[Mesh.ARRAY_COLOR].is_empty()
			if not vertex_color_surfaces[surface_key]:continue
			var original: Material=node.get_active_material(surface)
			if not original is BaseMaterial3D:continue
			var key:=original.get_instance_id()
			if not vertex_materials.has(key):
				var corrected: BaseMaterial3D=original.duplicate()
				corrected.vertex_color_use_as_albedo=true
				vertex_materials[key]=corrected
			node.set_surface_override_material(surface,vertex_materials[key])
	for child in node.get_children():apply_vertex_colors(child)

static func designer_id(type: String,age: int) -> String:
	var tier:=clampi(age,0,2)
	for era in range(tier,0,-1):
		var candidate:=type+"@"+str(era)
		if MODEL_FITS.data.has(candidate):return candidate
	if MODEL_FITS.data.has(type):return type
	for era in range(tier+1,3):
		var candidate:=type+"@"+str(era)
		if MODEL_FITS.data.has(candidate):return candidate
	return ""

func create_designed_building(type: String,age: int,design: Dictionary={},tier:=1) -> Node3D:
	var building_age:=maxi(int(BUILD_RULES.data.age.get(type,0)),age)
	var id:=designer_id(type,building_age)
	if type=="palisade" and tier==2 and id=="palisade" and design.is_empty():id="palisade-tier2"
	var procedural: String="procedural_"+type+"@"+str(clampi(building_age,0,6))
	if (building_age>=3 or id.is_empty()) and ResourceLoader.exists("res://assets/buildings/"+procedural+".glb"):id=procedural
	if id.is_empty():return null
	var file: String="res://assets/buildings/"+id+".glb"
	if not ResourceLoader.exists(file):return null
	var raw: Node3D
	if not design.is_empty() and str(design.get("id",""))==id and building_age<=2:raw=HousePlanModel.from_design(design)
	else:raw=load(file).instantiate()
	if id.begins_with("procedural_") and type not in FALLBACK_MODEL_TYPES:apply_town_material(raw)
	else:apply_vertex_colors(raw)
	if MODEL_FITS.data.has(id):
		var fit: Dictionary=MODEL_FITS.data[id]
		raw.scale=Vector3(fit.scale[0],fit.scale[1],fit.scale[2])
		raw.position=Vector3(fit.offset[0],fit.offset[1],fit.offset[2])
	var wrapper:=Node3D.new()
	wrapper.set_meta("designer_id",id)
	wrapper.add_child(raw)
	return wrapper

# Designed yards follow the rendered terrain instead of clipping into slopes.
# Duplicate the mesh because cached designs can be reused at different sites.
func conform_designed_yard(model: Node3D) -> void:
	for candidate in model.find_children("*","MeshInstance3D",true,false):
		if candidate.name not in ["WeatheredYard","CourtyardPaving"] or not candidate.mesh is ArrayMesh:continue
		var original:ArrayMesh=candidate.mesh;var adjusted:=ArrayMesh.new()
		for surface in original.get_surface_count():
			var arrays:=original.surface_get_arrays(surface);var vertices:PackedVector3Array=arrays[Mesh.ARRAY_VERTEX]
			var to_detail:Transform3D=global_transform.affine_inverse()*candidate.global_transform;var to_yard:=to_detail.affine_inverse()
			for i in vertices.size():
				var at:Vector3=to_detail*vertices[i];at.y=display_height(at.x,at.z)+0.025;vertices[i]=to_yard*at
			arrays[Mesh.ARRAY_VERTEX]=vertices;adjusted.add_surface_from_arrays(original.surface_get_primitive_type(surface),arrays);adjusted.surface_set_material(surface,original.surface_get_material(surface))
		candidate.mesh=adjusted

func add_nature(biome: String) -> void:
	var rocks: Array[Transform3D] = []
	for resource in resources:
		if resource.kind=="fish":
			ensure_fish(resource)
			continue
		if resource.kind=="berry":
			ensure_berry(resource)
			continue
		if resource.get("removed",false) or float(resource.get("amount",0))<=0:continue
		if resource.get("depositSite",false):
			var file: String="res://assets/world/deposit_"+str(resource.kind)+".glb"
			if ResourceLoader.exists(file):
				var deposit: Node3D=load(file).instantiate()
				apply_vertex_colors(deposit)
				deposit.position=Vector3(resource.x,display_height(resource.x,resource.z),resource.z)
				add_child(deposit);deposit_models[resource.id]=deposit
				continue
		if resource.kind=="game":
			ensure_animal(resource)
			continue
		if resource.kind not in ["tree","stone","ore","copper","tin","clay","gems","oil"]:continue
		var x: float=resource.x;var z: float=resource.z
		var y:=display_height(x,z)
		var t:=Transform3D(Basis.IDENTITY,Vector3(x,y,z))
		if resource.kind=="tree":register_tree(resource)
		else:rocks.append(t)
	add_instances(ROCK,rocks)
	sync_tree_instances(0.0)
	start_forest_fill()

func ensure_fish(resource: Dictionary) -> void:
	var id:=int(resource.id)
	if not fish_models.has(id):
		var path:="res://assets/world/kala_low.glb"
		if not ResourceLoader.exists(path):return
		var fish: Node3D=load(path).instantiate();fish.scale=Vector3.ONE*(0.35/0.990886)
		fish.position=Vector3(float(resource.x),0.18,float(resource.z));add_child(fish);fish_models[id]=fish
	fish_models[id].visible=not resource.get("removed",false) and float(resource.get("amount",0))>0

func _process(delta: float) -> void:
	GroundMaterial.poll()
	poll_tree_assets()
	process_forest_fill()
	var created:=0
	for key in pending_nature.keys():
		var item: Dictionary=pending_nature[key]
		if item.kind=="berry":ensure_berry(item.resource)
		else:ensure_animal(item.resource)
		if not pending_nature.has(key):created+=1
		if created>=4:break
	if tree_pending:sync_tree_instances(tree_sync_time,tree_sync_buildings)
	var camera:=get_viewport().get_camera_3d()
	if camera==null:return
	tree_lod_timer+=delta
	if tree_lod_timer>=0.25:
		tree_lod_timer=0.0
		update_tree_lods(camera)
	nature_lod_timer+=delta
	if nature_lod_timer<0.2:return
	nature_lod_timer=0.0
	for bush in berry_models.values():update_nature_lod(bush,camera)
	for animal in visible_animals.values():update_nature_lod(animal,camera)

func update_nature_lod(root: Node3D,camera: Camera3D) -> void:
	if not is_instance_valid(root) or not root.is_inside_tree():return
	var was_near:=bool(root.get_meta("nature_near",false))
	var near:=camera.global_position.distance_to(root.global_position)<(44.0 if was_near else 40.0)
	if root.has_meta("nature_near") and near==was_near:return
	root.set_meta("nature_near",near)
	set_nature_lod(root,near)

func set_nature_lod(root: Node3D,near: bool) -> void:
	var high:=root.get_node_or_null("NatureHigh");var low:=root.get_node_or_null("NatureLow")
	if high!=null:high.visible=near or low==null
	if low!=null:low.visible=not near

static func request_nature_assets() -> void:
	for name in NATURE_FILES:
		if nature_requests.has(name):continue
		var path: String="res://assets/world/"+name+".glb"
		var error:=ResourceLoader.load_threaded_request(path,"PackedScene",false)
		nature_requests[name]=error

static func poll_nature_assets() -> void:
	for name in NATURE_FILES:nature_scene(name)

static func poll_tree_assets() -> void:
	var frame:=Engine.get_process_frames()
	if tree_poll_frame==frame:return
	tree_poll_frame=frame
	for key in tree_requests.keys():
		var path: String=tree_requests[key]
		var status:=ResourceLoader.load_threaded_get_status(path)
		if status==ResourceLoader.THREAD_LOAD_LOADED:
			var scene: PackedScene=ResourceLoader.load_threaded_get(path)
			if scene!=null:tree_scenes[key]=scene
			else:tree_failed[key]=true
			tree_requests.erase(key)
		elif status==ResourceLoader.THREAD_LOAD_FAILED or status==ResourceLoader.THREAD_LOAD_INVALID_RESOURCE:
			tree_failed[key]=true;tree_requests.erase(key)

static func finish_asset_requests() -> void:
	for name in nature_requests:
		if nature_scenes.has(name) or int(nature_requests[name])!=OK:continue
		var path: String="res://assets/world/"+name+".glb"
		var status:=ResourceLoader.load_threaded_get_status(path)
		if status in [ResourceLoader.THREAD_LOAD_IN_PROGRESS,ResourceLoader.THREAD_LOAD_LOADED]:
			var scene: PackedScene=ResourceLoader.load_threaded_get(path)
			if scene!=null:nature_scenes[name]=scene
	for key in tree_requests.keys():
		var path: String=tree_requests[key];var status:=ResourceLoader.load_threaded_get_status(path)
		if status in [ResourceLoader.THREAD_LOAD_IN_PROGRESS,ResourceLoader.THREAD_LOAD_LOADED]:
			var scene: PackedScene=ResourceLoader.load_threaded_get(path)
			if scene!=null:tree_scenes[key]=scene
		tree_requests.erase(key)

static func nature_scene(name: String) -> PackedScene:
	if nature_scenes.has(name):return nature_scenes[name]
	if not nature_requests.has(name):request_nature_assets()
	var path: String="res://assets/world/"+name+".glb"
	if int(nature_requests.get(name,FAILED))!=OK:return null
	var status:=ResourceLoader.load_threaded_get_status(path)
	if status==ResourceLoader.THREAD_LOAD_LOADED:
		var scene: PackedScene=ResourceLoader.load_threaded_get(path)
		if scene!=null:nature_scenes[name]=scene
		return scene
	return null

func nature_hidden(resource: Dictionary) -> bool:
	return tree_mountain or display_height(resource.x,resource.z)<=0.0 or Landscape.near_water(Vector2(resource.x,resource.z),river_segments,1.55)

func ensure_berry(resource: Dictionary) -> void:
	if berry_models.has(resource.id):return
	var low:=nature_scene("poosas_low");var high:=nature_scene("poosas_high")
	var pending_key: String="berry:"+str(resource.id)
	if low==null or high==null:pending_nature[pending_key]={"kind":"berry","resource":resource};return
	pending_nature.erase(pending_key)
	var bush:=Node3D.new();bush.position=Vector3(resource.x,display_height(resource.x,resource.z),resource.z);add_child(bush)
	for detail in ["low","high"]:
		var scene: PackedScene=high if detail=="high" else low
		var model: Node3D=scene.instantiate();var scale_factor:=1.2/(1.006156 if detail=="high" else 0.985686)
		model.name="NatureHigh" if detail=="high" else "NatureLow"
		var center:=Vector3(-0.000518,-0.004866,0.000020) if detail=="high" else Vector3(-0.0274755,-0.020964,-0.004890)
		model.scale=Vector3.ONE*scale_factor;model.position=Vector3(-center.x,-center.y,-center.z)*scale_factor
		bush.add_child(model)
	berry_models[resource.id]=bush
	set_nature_lod(bush,false)
	bush.visible=not resource.get("removed",false) and float(resource.get("amount",0))>0 and not nature_hidden(resource)

func ensure_animal(resource: Dictionary) -> void:
	if visible_animals.has(resource.id):return
	var low:=nature_scene("hirv_low");var high:=nature_scene("hirv_high")
	var pending_key: String="game:"+str(resource.id)
	if low==null or high==null:pending_nature[pending_key]={"kind":"game","resource":resource};return
	pending_nature.erase(pending_key)
	var animal:=Node3D.new()
	for detail in ["low","high"]:
		var scene: PackedScene=high if detail=="high" else low
		var model: Node3D=scene.instantiate();model.name="NatureHigh" if detail=="high" else "NatureLow"
		var factor:=1.9/(1.000072 if detail=="high" else 1.002434)
		var origin:=Vector3(-0.0000185,-0.000013,0.0000325) if detail=="high" else Vector3(-0.0014885,-0.002872,0.0006865)
		model.scale=Vector3.ONE*factor;model.position=-origin*factor;animal.add_child(model)
	animal.position=Vector3(resource.x,display_height(resource.x,resource.z),resource.z)
	animal.rotation.y=float(resource.id)*1.618;add_child(animal);visible_animals[resource.id]=animal
	set_nature_lod(animal,false)
	animal.visible=not resource.get("removed",false) and float(resource.get("amount",0))>0 and not nature_hidden(resource)

func add_instances(scene: PackedScene, transforms: Array[Transform3D]) -> MultiMeshInstance3D:
	if transforms.is_empty(): return null
	var source := scene.instantiate()
	var mesh_node := first_mesh(source)
	if mesh_node == null: source.free(); return null
	var multi := MultiMesh.new()
	multi.transform_format = MultiMesh.TRANSFORM_3D
	multi.mesh = mesh_node.mesh
	multi.instance_count = transforms.size()
	for i in transforms.size(): multi.set_instance_transform(i,transforms[i])
	var result := MultiMeshInstance3D.new()
	result.multimesh = multi
	var material := StandardMaterial3D.new()
	material.vertex_color_use_as_albedo = true
	material.roughness = 1.0
	result.material_override = material
	add_child(result)
	source.free()
	return result



func place_hall(x: float, z: float,age:=0,rotation:=0.0,design: Dictionary={}) -> void:
	if ground_cover!=null:ground_cover.clear_area(x,z,7.0,6.5)
	for resource in resources:
		if resource.kind != "tree": continue
		if absf(resource.x-x) < 6.1 and absf(resource.z-z) < 5.5:
			resource.removed = true
			resource.cleared = true
			resource.amount = 0
			hide_tree(resource.id)
	if hall_model!=null:hall_model.queue_free()
	hall_model=create_designed_building("hall",age,design)
	if hall_model==null:return
	hall_model.position = Vector3(x,display_height(x,z),z)
	hall_model.rotation.y=rotation
	add_child(hall_model);conform_designed_yard(hall_model)
	person.visible = false


func construction_tempo() -> float:
	var node:Node=get_parent()
	while node!=null:
		if node.has_method("current_build_context"):return EconomyRulesScript.tempo_factor(node.game)
		node=node.get_parent()
	return 1.0

func configure_wall_transform(model: Node3D,b: Dictionary) -> void:
	if b.type in ["palisade","stonewall","reinforced_wall"] and float(b.get("palisadeSpanV167",0))>0:
		var start_embed:=float(b.get("cliffEmbedStartV179",0));var end_embed:=float(b.get("cliffEmbedEndV179",0));var shift:float=(end_embed-start_embed)/2.0;var angle:=float(b.get("wallAngleV175",0))
		model.scale.x=(float(b.palisadeSpanV167)+start_embed+end_embed)/7.0;model.position.x+=cos(angle)*shift;model.position.z-=sin(angle)*shift
	elif b.get("extendedPalisadeV166",false) and b.type in ["palisade","woodgate","gatehouse"]:model.scale.x=2.0
	var default_angle:=PI/2 if b.get("wallAxis",false) and b.type in ["palisade","stonewall","reinforced_wall","woodgate","gatehouse"] else 0.0
	model.rotation.y=float(b.get("buildingRotationV228",b.get("wallAngleV175",b.get("shoreAngle",default_angle))))

func sync_buildings(city: Dictionary,age:=0) -> void:
	if building_root != null: building_root.queue_free()
	building_root=Node3D.new()
	building_animations.clear();construction_models.clear()
	add_child(building_root)
	var cover_areas: Array=[]
	for building_index in city.economy.buildings.size():
		var b: Dictionary=city.economy.buildings[building_index]
		if not b.get("virtual",false) and float(b.get("hp",0))>0:
			var clearance: Variant=LocalNavigation.clearance(b)
			var rx: float=(float(clearance.rx) if clearance!=null else 3.6)+0.5
			var rz: float=(float(clearance.rz) if clearance!=null else 3.5)+0.5
			if b.type=="field":
				var width:=float(b.get("width",16))*0.5;var depth:=float(b.get("depth",16))*0.5
				var angle:=float(b.get("buildingRotationV228",0));var cs:=absf(cos(angle));var sn:=absf(sin(angle))
				rx=width*cs+depth*sn+2;rz=width*sn+depth*cs+2
			cover_areas.append({"x":float(b.x),"z":float(b.z),"rx":rx,"rz":rz})
		if b.type=="hall" or (b.type=="bridge" and b.get("ready",false)) or b.get("virtual",false) or float(b.get("hp",0))<=0:continue
		clear_area(b.x,b.z,LocalNavigation.clearance(b))
		var y := display_height(b.x,b.z)
		if not b.get("ready",false):
			if b.type in ["palisade","stonewall","reinforced_wall"]:
				var partial:=create_designed_building(b.type,age,b.get("houseDesignV354",{}),int(b.get("woodFortTierV1757",1)))
				if partial!=null:
					var duration:float=float(b.get("buildTimeV1757",EconomyData.data.buildings[b.type].time))*construction_tempo()
					partial.scale.y=0.15+0.85*clampf(float(b.get("progress",0))/maxf(1.0,duration),0,1)
					partial.position=Vector3(b.x,y,b.z);configure_wall_transform(partial,b);building_root.add_child(partial);partial.set_meta("building_index",building_index)
					construction_models.append({"model":partial,"building":b,"duration":duration})
			else:
				var marker:=MeshInstance3D.new()
				var box:=BoxMesh.new();box.size=Vector3(float(b.get("width",4)),0.12,float(b.get("depth",4))) if b.type=="field" else Vector3(4,0.12,4);marker.mesh=box
				var mat:=StandardMaterial3D.new();mat.albedo_color=Color("c9a35e");marker.material_override=mat
				marker.position=Vector3(b.x,y+0.1,b.z);marker.rotation.y=float(b.get("buildingRotationV228",b.get("shoreAngle",0)));building_root.add_child(marker)
				marker.set_meta("building_index",building_index)
		else:
			var model:=create_designed_building(b.type,age,b.get("houseDesignV354",{}),int(b.get("woodFortTierV1757",1)))
			if model!=null:
				if b.type=="field":model.scale=Vector3(float(b.get("width",16))/16.0,1,float(b.get("depth",16))/16.0)
				elif b.type=="house" and int(b.get("houseUpgradeLevelV218",0))>=1:model.scale*=Vector3(1.12,1.42,1.10)
				if b.has("baseY"):
					y=y+float(b.baseY)-Terrain.detail_height(heights,b.x,b.z) if b.get("riverBankV276",false) else float(b.baseY)
				model.position=Vector3(b.x,y+(0.12 if b.type=="field" else 0.0),b.z)
				configure_wall_transform(model,b);building_root.add_child(model);conform_designed_yard(model)
				model.set_meta("building_index",building_index)
				var id: String=model.get_meta("designer_id","")
				for entry in MODEL_ANIMATIONS.data.get(id,[]):
					var part: Node=model.find_child("part_"+str(int(entry.index)),true,false)
					if part is Node3D:building_animations.append({"part":part,"building":b,"data":entry})
	if ground_cover!=null:ground_cover.set_areas(cover_areas)

func mesh_hit_distance(node: Node,origin: Vector3,direction: Vector3) -> float:
	var nearest:=INF
	if node is MeshInstance3D and node.is_visible_in_tree() and node.mesh!=null and absf(node.global_transform.basis.determinant())>0.00000001:
		var inverse: Transform3D=node.global_transform.affine_inverse()
		var local_origin: Vector3=inverse*origin;var local_direction: Vector3=inverse.basis*direction
		var hit: Variant=node.get_aabb().intersects_ray(local_origin,local_direction)
		if hit!=null:nearest=origin.distance_to(node.global_transform*hit)
	for child in node.get_children():nearest=minf(nearest,mesh_hit_distance(child,origin,direction))
	return nearest

func pick_building(camera: Camera3D,screen: Vector2,buildings: Array) -> int:
	var origin:=camera.project_ray_origin(screen);var direction:=camera.project_ray_normal(screen)
	var selected:=-1;var distance:=INF
	if is_instance_valid(hall_model):
		var hall_distance:=mesh_hit_distance(hall_model,origin,direction)
		if is_finite(hall_distance):
			for i in buildings.size():
				if buildings[i].type=="hall" and not buildings[i].get("virtual",false) and float(buildings[i].get("hp",0))>0:selected=i;distance=hall_distance;break
	var bridge_index:=-1
	for i in buildings.size():
		if buildings[i].type=="bridge" and buildings[i].get("ready",false) and float(buildings[i].get("hp",0))>0:bridge_index=i;break
	if bridge_index>=0:
		for crossing in find_children("BridgeCrossing*","",true,false):
			if crossing.get_meta("crossing_tile",Vector2i(-1,-1))!=tree_cell:continue
			var bridge_distance:=mesh_hit_distance(crossing,origin,direction)
			if bridge_distance<distance:selected=bridge_index;distance=bridge_distance
	if is_instance_valid(building_root):
		for child in building_root.get_children():
			var building_index:=int(child.get_meta("building_index",-1))
			if building_index<0 or building_index>=buildings.size():continue
			var hit:=mesh_hit_distance(child,origin,direction)
			if hit<distance:selected=building_index;distance=hit
	return selected

func clear_area(x: float,z: float,size: Variant) -> void:
	var rx := maxf(3.6,size.rx if size!=null else 0)+0.5
	var rz := maxf(3.5,size.rz if size!=null else 0)+0.5
	for resource in resources:
		if resource.kind!="tree":continue
		if absf(resource.x-x)<rx and absf(resource.z-z)<rz:
			resource.removed=true;resource.cleared=true;resource.amount=0
			hide_tree(resource.id)

func update_builder(city: Dictionary,time: float,age:=0) -> void:
	var agents: Array=city.get("builderAgents",[])
	while builder_people.size()<agents.size():
		var person: Node3D=HUMAN.instantiate();person.scale=Vector3.ONE*1.66;add_child(person)
		var tool:=Equipment.job(person,"builder");if tool!=null:person.set_meta("job_tool",tool)
		var pack:=Equipment.load_for(person,"builder");if pack!=null:person.set_meta("job_load",pack)
		builder_people.append(person);builder_motions.append(Motion.new())
	if not builder_people.is_empty():builder_person=builder_people[0]
	for i in builder_people.size():
		var person: Node3D=builder_people[i]
		if i>=agents.size():person.visible=false;continue
		var worker: Dictionary=agents[i];person.visible=worker.get("visible",true)
		person.position=Vector3(worker.x,display_height(worker.x,worker.z),worker.z)
		person.rotation.y=float(worker.get("heading",0))
		var action: String="carry" if float(worker.get("carried",0))>0 else (str(worker.get("action","")) if worker.get("working",false) else "")
		if person.has_meta("job_tool"):person.get_meta("job_tool").visible=age==0
		if person.has_meta("job_load"):person.get_meta("job_load").visible=action=="carry"
		builder_motions[i].apply(person,time,worker.get("moving",false),action)

func update_trainer(city: Dictionary,time: float,age:=0) -> void:
	var worker: Variant=city.get("trainingAgent")
	if not worker is Dictionary or not worker.get("visible",true) or int(worker.get("c",city.c))!=int(city.c) or int(worker.get("r",city.r))!=int(city.r):
		if trainer_person!=null:trainer_person.visible=false
		return
	if trainer_person==null:
		trainer_person=HUMAN.instantiate()
		trainer_person.scale=Vector3.ONE*1.66
		add_child(trainer_person)
		var tool:=Equipment.job(trainer_person,"worker")
		if tool!=null:trainer_person.set_meta("job_tool",tool)
	trainer_person.visible=true
	if trainer_person.has_meta("job_tool"):trainer_person.get_meta("job_tool").visible=age==0
	trainer_person.position=Vector3(worker.x,display_height(worker.x,worker.z),worker.z)
	trainer_person.rotation.y=float(worker.get("heading",0))
	trainer_motion.apply(trainer_person,time,worker.get("moving",false),str(worker.get("action","")) if worker.get("working",false) else "")

static func tree_transform(resource: Dictionary,terrain_heights: Array,now: float,visual:=PackedVector4Array()) -> Transform3D:
	if resource.get("removed",false):return Transform3D(Basis().scaled(Vector3.ZERO),Vector3.ZERO)
	var growth:=1.0
	if float(resource.get("matureAt",0))>now:
		var planted: float=resource.get("plantedAt",now)
		growth=clampf((now-planted)/maxf(1,float(resource.matureAt)-planted),0,1)
	var size:=0.22+0.78*growth
	# The original renderer applies a later sapling override independently of
	# the 480-second gameplay maturity timer.
	if resource.has("plantedAt"):size=0.25+0.75*minf(1.0,(now-float(resource.plantedAt))/20.0)
	return Transform3D(Basis().scaled(Vector3.ONE*size),Vector3(resource.x,Terrain.visual_rendered_height(terrain_heights,visual,resource.x,resource.z),resource.z))

func start_forest_fill() -> void:
	if tree_mountain or tree_biome in ["sea","snow","snow_mountain","mesa"]:return
	forest_fill=ForestFill.new()
	forest_fill.setup(tree_cell,tree_seed,tree_biome in ["forest","jungle","taiga"],resources,heights,river_segments,visual_heights)

func process_forest_fill() -> void:
	if forest_fill==null:return
	var frame:=Engine.get_process_frames()
	if fill_frame!=frame:fill_frame=frame;fill_frame_work=0
	if not forest_fill.done and fill_frame_work<96:
		var budget:=mini(24,96-fill_frame_work)
		forest_fill.step(budget);fill_frame_work+=budget
	if not forest_fill.done:return
	for entry in forest_fill.rows:
		var key:=tree_key({"id":entry.id})
		if key.is_empty():continue
		var kind: String=key.split(":")[0]
		var variant_number:=sin(float(entry.x)*12.9898+float(entry.z)*78.233)*43758.5453
		var variant:=mini(4,floori((variant_number-floorf(variant_number))*5.0))
		key=kind+":"+str(variant)
		entry.key=key;entry.index=int(tree_counts.get(key,0));tree_counts[key]=entry.index+1
		fill_trees.append(entry)
	forest_fill=null;fill_stamp="";tree_pending=true

func tree_key(resource: Dictionary,override_seed: float=-1.0) -> String:
	var seed:=float(resource.id) if override_seed<0 else override_seed
	var n:=sin(seed*127.1+93.7)*43758.5453
	var kind: String="palm" if tree_biome=="desert" and tree_river else Forest.kind(tree_biome,tree_temperature,tree_moisture,n-floorf(n))
	if kind.is_empty():return ""
	var v:=sin(seed*12.9898+seed*0.13*78.233)*43758.5453
	return kind+":"+str(mini(4,floori((v-floorf(v))*5.0)))

func register_tree(resource: Dictionary) -> void:
	if tree_indices.has(resource.id):return
	var key:=tree_key(resource)
	if key.is_empty():return
	var index:=int(tree_counts.get(key,0))
	tree_counts[key]=index+1;tree_groups[resource.id]=key;tree_indices[resource.id]=index;visible_tree_ids.append(resource.id)
	if tree_biome not in ["forest","jungle","taiga"]:return
	var id:=float(resource.id);var n:=sin(id*127.1+tree_cell.x*19.7+tree_cell.y*83.1)*43758.5453;var random:=n-floorf(n)
	var x: float=float(resource.x)+cos(random*TAU)*4.2;var z: float=float(resource.z)+sin(random*TAU)*4.2
	var y:=display_height(x,z);var base:=display_height(resource.x,resource.z)
	if absf(x)>109.5 or absf(z)>94.5 or y<0.5 or absf(y-base)>1.2 or absf(z)<18:return
	var companion_seed:=id+104729.0;var companion_key:=tree_key(resource,companion_seed)
	if companion_key.is_empty():return
	var companion_index:=int(tree_counts.get(companion_key,0));tree_counts[companion_key]=companion_index+1
	tree_companions[resource.id]={"key":companion_key,"index":companion_index,"seed":companion_seed,"x":x,"z":z,"y":y,"scale":0.66+random*0.12}

func ensure_tree_group(key: String) -> void:
	if tree_instances.has(key):return
	var parts:=key.split(":");var kind: String=parts[0];var variant:=int(parts[1])+1
	var level: String=parts[2] if parts.size()>2 else "mid"
	var base_key:=kind+":"+str(variant-1)
	if parts.size()>2 and level=="mid" and shared_tree_meshes.has(base_key):shared_tree_meshes[key]=shared_tree_meshes[base_key]
	if not shared_tree_meshes.has(key):
		var path: String="res://assets/sapling-trees/%s_%02d/%s.glb" % [kind,variant,level]
		if not tree_scenes.has(key):
			if tree_failed.has(key):
				var fallback: PackedScene=load(path)
				if fallback==null:return
				tree_scenes[key]=fallback;tree_failed.erase(key)
			elif not tree_requests.has(key):
				var frame:=Engine.get_process_frames()
				if tree_asset_frame==frame:return
				tree_asset_frame=frame
				var error:=ResourceLoader.load_threaded_request(path,"PackedScene",false)
				if error==OK:tree_requests[key]=path
				else:tree_failed[key]=true
				return
			else:return
		var scene: PackedScene=tree_scenes[key]
		var model: Node=scene.instantiate()
		var source:=first_mesh(model)
		if source==null:model.free();return
		var mesh: Mesh=source.mesh.duplicate()
		for surface in mesh.get_surface_count():
			var original: Material=mesh.surface_get_material(surface)
			if not original is BaseMaterial3D:continue
			var material: BaseMaterial3D=original.duplicate()
			if material.albedo_texture!=null and level!="far":
				if not shared_tree_textures.has(kind):shared_tree_textures[kind]=material.albedo_texture
				material.albedo_texture=shared_tree_textures[kind]
			if level=="far":material.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED
			elif material.resource_name.to_lower().contains("foliage"):material.albedo_color=Color(0.55,0.70,0.55)
			material.cull_mode=BaseMaterial3D.CULL_DISABLED
			mesh.surface_set_material(surface,material)
		shared_tree_meshes[key]=mesh;model.free();tree_scenes.erase(key)
	var mesh: Mesh=shared_tree_meshes[key]
	var multi:=MultiMesh.new();multi.transform_format=MultiMesh.TRANSFORM_3D;multi.mesh=mesh
	var node:=MultiMeshInstance3D.new();node.multimesh=multi;node.visible=parts.size()>2;add_child(node);tree_instances[key]=node

func update_tree_lods(camera: Camera3D) -> void:
	var view_height:=get_viewport().get_visible_rect().size.y
	if not tree_lod_dirty and tree_lod_camera.is_equal_approx(camera.global_position) and is_equal_approx(tree_lod_view_height,view_height):return
	tree_lod_camera=camera.global_position;tree_lod_view_height=view_height;tree_lod_dirty=false
	var hidden:=Transform3D(Basis().scaled(Vector3.ZERO),Vector3.ZERO)
	var pixel_factor:=view_height/(2.0*tan(deg_to_rad(camera.fov*0.5)))
	for key in tree_counts:
		if not tree_instances.has(key):continue
		var source: MultiMesh=tree_instances[key].multimesh
		var count:=source.instance_count
		var kind: String=key.split(":")[0]
		var states: PackedByteArray=tree_lod_levels.get(key,PackedByteArray())
		if states.size()!=count:states.resize(count)
		var desired:=PackedByteArray();desired.resize(count)
		var needed: Dictionary={"mid":true}
		for existing_level in ["far","mid","near"]:
			var existing_key: String=str(key)+":"+existing_level
			if tree_instances.has(existing_key) and tree_instances[existing_key].multimesh.instance_count!=count:tree_instances[existing_key].multimesh.instance_count=count
		for i in count:
			var t:=source.get_instance_transform(i)
			var height:=float(TREE_REFERENCE_HEIGHTS[kind])*t.basis.get_scale().y
			if height<0.001:desired[i]=1;continue
			var center:=global_transform*(t.origin+Vector3.UP*height*0.5)
			var pixels:=height*pixel_factor/maxf(1.0,camera.global_position.distance_to(center))
			var previous:=int(states[i])
			var level:=2 if pixels>(37.0 if previous==2 else 45.0) else 1 if pixels>(10.0 if previous==1 else 12.0) else 0
			desired[i]=level;needed[["far","mid","near"][level]]=true
		for level in needed:
			var lod_key: String=str(key)+":"+str(level)
			ensure_tree_group(lod_key)
			if not tree_instances.has(lod_key):tree_lod_dirty=true;continue
			var mesh: MultiMesh=tree_instances[lod_key].multimesh
			if mesh.instance_count!=count:mesh.instance_count=count
		if not tree_instances.has(str(key)+":mid"):tree_lod_dirty=true;continue
		for i in count:
			var level: int=desired[i]
			var chosen: String=["far","mid","near"][level]
			if not tree_instances.has(str(key)+":"+chosen):chosen="mid";level=1
			var source_transform:=source.get_instance_transform(i)
			for option in ["far","mid","near"]:
				var lod_key: String=str(key)+":"+option
				if tree_instances.has(lod_key):tree_instances[lod_key].multimesh.set_instance_transform(i,source_transform if option==chosen else hidden)
			states[i]=level
		tree_lod_levels[key]=states

func hide_tree(id: Variant) -> void:
	tree_lod_dirty=true
	var key: String=tree_groups.get(id,"")
	if tree_instances.has(key):tree_instances[key].multimesh.set_instance_transform(int(tree_indices[id]),Transform3D(Basis().scaled(Vector3.ZERO),Vector3.ZERO))
	if tree_companions.has(id):
		var companion: Dictionary=tree_companions[id]
		if tree_instances.has(companion.key):tree_instances[companion.key].multimesh.set_instance_transform(int(companion.index),Transform3D(Basis().scaled(Vector3.ZERO),Vector3.ZERO))

func sync_tree_instances(now: float,buildings: Array=[]) -> void:
	tree_sync_time=now;tree_sync_buildings=buildings;tree_pending=false;tree_lod_dirty=true
	var resized:=false
	for key in tree_counts:
		ensure_tree_group(key)
		if not tree_instances.has(key):tree_pending=true;continue
		if tree_instances.has(key) and tree_instances[key].multimesh.instance_count!=int(tree_counts[key]):
			tree_instances[key].multimesh.instance_count=int(tree_counts[key])
			resized=true
	for resource in resources:
		if resource.kind!="tree" or not tree_indices.has(resource.id):continue
		var key: String=tree_groups[resource.id]
		if not tree_instances.has(key):continue
		var kind: String=key.split(":")[0]
		var height:=9.0 if kind in ["pine","spruce"] else 10.0 if kind=="palm" else 7.0
		var transform:=tree_transform(resource,heights,now,visual_heights)
		if tree_mountain or display_height(resource.x,resource.z)<0.5 or Landscape.near_water(Vector2(resource.x,resource.z),river_segments,1.55):transform=Transform3D(Basis().scaled(Vector3.ZERO),Vector3.ZERO)
		transform.basis=Basis(Vector3.UP,float(resource.id)*0.39)*transform.basis.scaled(Vector3.ONE*(0.9*height/float(TREE_REFERENCE_HEIGHTS[kind])))
		tree_instances[key].multimesh.set_instance_transform(int(tree_indices[resource.id]),transform)
		if not tree_companions.has(resource.id):continue
		var companion: Dictionary=tree_companions[resource.id];var companion_key: String=companion.key
		if not tree_instances.has(companion_key):continue
		var blocked: bool=tree_mountain or float(companion.y)<0.5 or resource.get("removed",false) or Landscape.near_water(Vector2(companion.x,companion.z),river_segments,1.55)
		if not blocked:
			for building in buildings:
				if building.get("virtual",false) or float(building.get("hp",0))<=0:continue
				var clearance: Variant={"rx":float(building.get("width",16))/2.0,"rz":float(building.get("depth",16))/2.0} if building.type=="field" else LocalNavigation.clearance(building)
				if clearance!=null and absf(float(companion.x)-float(building.x))<float(clearance.rx)+5.0 and absf(float(companion.z)-float(building.z))<float(clearance.rz)+5.0:blocked=true;break
		var companion_transform:=Transform3D(Basis().scaled(Vector3.ZERO),Vector3.ZERO)
		if not blocked:
			var companion_kind: String=companion_key.split(":")[0]
			var companion_height:=9.0 if companion_kind in ["pine","spruce"] else 10.0 if companion_kind=="palm" else 7.0
			var growth: float=tree_transform(resource,heights,now,visual_heights).basis.get_scale().x
			var size: float=float(companion.scale)*growth*companion_height/float(TREE_REFERENCE_HEIGHTS[companion_kind])
			companion_transform=Transform3D(Basis(Vector3.UP,float(companion.seed)*0.39).scaled(Vector3.ONE*size),Vector3(companion.x,companion.y,companion.z))
		tree_instances[companion_key].multimesh.set_instance_transform(int(companion.index),companion_transform)
	if not fill_trees.is_empty():sync_forest_fill(buildings,resized)

func sync_forest_fill(buildings: Array,force:=false) -> void:
	var footprints: Array=[];var stamp:=str(world_data.get("revision",0))
	for building in buildings:
		if building.get("virtual",false) or float(building.get("hp",0))<=0:continue
		var clearance: Variant={"rx":float(building.get("width",16))/2.0,"rz":float(building.get("depth",16))/2.0} if building.type=="field" else LocalNavigation.clearance(building)
		if clearance==null:continue
		var box: Array=[float(building.x),float(building.z),float(clearance.rx)+1.5,float(clearance.rz)+1.5]
		footprints.append(box);stamp+=":"+str(box)
	if stamp==fill_stamp and not force:return
	fill_stamp=stamp
	for entry in fill_trees:
		var key: String=entry.key
		if not tree_instances.has(key):continue
		var owner: Dictionary=entry.owner
		var blocked: bool=owner.get("removed",false) or float(owner.get("amount",0))<=0
		if not blocked:
			for box in footprints:
				if absf(float(entry.x)-box[0])<box[2] and absf(float(entry.z)-box[1])<box[3]:blocked=true;break
		var transform:=Transform3D(Basis().scaled(Vector3.ZERO),Vector3.ZERO)
		if not blocked:
			var kind: String=key.split(":")[0]
			var height:=9.0 if kind in ["pine","spruce"] else 10.0 if kind=="palm" else 7.0
			var scale:=0.9*height*float(entry.scale)/float(TREE_REFERENCE_HEIGHTS[kind])
			transform=Transform3D(Basis(Vector3.UP,float(entry.id)*0.39).scaled(Vector3.ONE*scale),Vector3(entry.x,display_height(entry.x,entry.z),entry.z))
		tree_instances[key].multimesh.set_instance_transform(int(entry.index),transform)

func sync_removed_resources(world_resources: Array,now: float=0.0,buildings: Array=[]) -> void:
	for resource in world_resources:
		if resource.kind=="fish":ensure_fish(resource)
		if resource.kind=="berry":
			ensure_berry(resource)
			if berry_models.has(resource.id):berry_models[resource.id].visible=not resource.get("removed",false) and float(resource.get("amount",0))>0 and not nature_hidden(resource)
		if resource.get("depositSite",false) and deposit_models.has(resource.id):
			var occupied:=false
			for building in buildings:
				if int(building.get("depositId",-1))==int(resource.id) and float(building.get("hp",0))>0:occupied=true;break
			deposit_models[resource.id].visible=not resource.get("removed",false) and float(resource.get("amount",0))>0 and not occupied
		if resource.kind=="tree":register_tree(resource)
		if resource.kind=="game":
			ensure_animal(resource)
			if visible_animals.has(resource.id):visible_animals[resource.id].visible=not resource.get("removed",false) and float(resource.get("amount",0))>0 and not nature_hidden(resource)
	sync_tree_instances(now,buildings)

func animate_settler(actor: Dictionary,time: float) -> void:
	if person!=null and person.visible:
		person.rotation.y=float(actor.get("heading",0))
		person_motion.apply(person,time,actor.get("moving",false))

func update_wildlife(city: Dictionary,time: float,delta: float,nav: Variant,extra_people: Array=[]) -> void:
	var people: Array=extra_people.duplicate();var hunters: Dictionary={}
	for worker in city.get("world",{}).get("workers",{}).values():
		if not worker.get("visible",true):continue
		var is_hunter: bool=worker.get("kind","")=="hunter" and worker.get("resourceId")!=null
		var target:=int(worker.resourceId) if is_hunter else -1
		people.append({"x":worker.x,"z":worker.z,"hunterOf":target if worker.get("phase","")!="return" else -1})
		if is_hunter:hunters[target]=worker
	for actor in builder_people+[trainer_person]:
		if actor!=null and actor.visible:people.append({"x":actor.position.x,"z":actor.position.z})
	for resource in resources:
		if resource.kind!="game" or not visible_animals.has(resource.id):continue
		var animal: Node3D=visible_animals[resource.id]
		if not animal.visible:continue
		var state:=wildlife_motion.update(resource,time,minf(0.25,delta),people,hunters,nav)
		var y:=display_height(state.x,state.z)
		animal.position=Vector3(state.x,y+(0.35 if state.lying else absf(sin(time*9+float(resource.id)))*0.35 if state.running else 0),state.z)
		animal.rotation=Vector3(PI*0.46 if state.lying else 0,float(state.heading)-PI/2,(-0.18-0.06*sin(time*0.9+float(resource.id))) if state.grazing else 0.08*sin(time*9+float(resource.id)) if state.running else 0)

func update_workers(city: Dictionary,time: float,age:=0) -> void:
	var workers: Dictionary=city.world.get("workers",{})
	for key in worker_models:
		worker_models[key].visible=false
	for key in workers:
		var worker: Dictionary=workers[key]
		if worker.get("kind","") not in ["lumber","quarry","hunter","well","fisher","berries","farm","saw","mill","bakery","study","forester","mine","coppermine","tinmine","claypit","gem_mine","oilwell","pottery_kiln","mason","bronze_foundry","cartwright","coal","smelter","smith","scriptorium","library","academy","vegetable_garden","orchard","dairy","spice_garden","coffee_farm","flax_farm","silk_farm","dye_garden","cocoa_farm","rubber_farm","weaver","jeweler","silk_weaver","perfumery","chocolatier","electronics_factory","market_woman","pasture","school","university","monastery","chapel","observatory","public_school","high_school","polytechnic","laboratory","printer","nitrate","powdermill","steelworks","engineworks","refinery","powerplant","autofactory","watermill","windmill","master_workshop","armor_workshop"]:continue
		if not worker_models.has(key):
			var model: Node3D=HUMAN.instantiate()
			model.scale=Vector3.ONE*1.66
			add_child(model)
			worker_models[key]=model
			worker_motions[key]=Motion.new()
			var tool:=Equipment.job(model,str(worker.kind))
			if tool!=null:model.set_meta("job_tool",tool)
			var pack:=Equipment.load_for(model,str(worker.kind))
			if pack!=null:model.set_meta("job_load",pack)
			if worker.kind=="fisher":
				var fish_path:="res://assets/world/kala_low.glb"
				if ResourceLoader.exists(fish_path):
					var fish: Node3D=load(fish_path).instantiate();fish.scale=Vector3.ONE*(0.35*0.6/0.990886/1.66)
					fish.position=Vector3(0,1.0,0.4)/1.66;fish.visible=false;model.add_child(fish);model.set_meta("catch",fish)
		var model: Node3D=worker_models[key]
		model.position=Vector3(worker.x,display_height(worker.x,worker.z),worker.z)
		model.rotation.y=float(worker.get("heading",0))
		model.visible=worker.get("visible",true)
		var action: String="carry" if float(worker.get("carried",0))>0 else (str(worker.get("action","")) if worker.get("working",false) else "")
		if model.has_meta("job_tool"):model.get_meta("job_tool").visible=age==0
		if model.has_meta("job_load"):model.get_meta("job_load").visible=action=="carry" and worker.kind!="fisher"
		if model.has_meta("catch"):model.get_meta("catch").visible=action=="carry"
		if age==0 and worker.kind=="hunter" and worker.get("phase","")=="out" and worker.get("resourceId")!=null:
			for prey in resources:
				if int(prey.id)==int(worker.resourceId) and Vector2(float(prey.x)-float(worker.x),float(prey.z)-float(worker.z)).length()<14:action="stalk";break
		worker_motions[key].apply(model,time,worker.get("moving",false),action,float(worker.get("workRate",1)))
	var active_cargo: Dictionary={}
	for cargo in city.economy.cargo:
		var key: String="cargo:"+str(int(cargo.get("portCargoId",city.economy.cargo.find(cargo))))
		active_cargo[key]=true
		if not worker_models.has(key):
			var model: Node3D=HUMAN.instantiate()
			model.scale=Vector3.ONE*1.66
			add_child(model)
			worker_models[key]=model;worker_motions[key]=Motion.new()
			var tool:=Equipment.job(model,"worker")
			if tool!=null:model.set_meta("job_tool",tool);tool.visible=false
			var pack:=Equipment.load_for(model,"worker")
			if pack!=null:model.set_meta("job_load",pack);pack.visible=true
		var model: Node3D=worker_models[key]
		if model.has_meta("job_tool"):model.get_meta("job_tool").visible=age==0
		model.position=Vector3(cargo.x,display_height(cargo.x,cargo.z),cargo.z)
		model.rotation.y=float(cargo.get("heading",0));model.visible=true
		worker_motions[key].apply(model,time,cargo.get("moving",false),"carry")
	for key in worker_models.keys():
		if str(key).begins_with("cargo:") and not active_cargo.has(key):
			worker_models[key].queue_free();worker_models.erase(key);worker_motions.erase(key)


func update_building_animations(time: float) -> void:
	for entry in construction_models:
		if is_instance_valid(entry.model):entry.model.scale.y=0.15+0.85*clampf(float(entry.building.get("progress",0))/maxf(1.0,float(entry.duration)),0,1)
	for entry in building_animations:
		var building: Dictionary=entry.building;var data: Dictionary=entry.data
		if not building.get("ready",false) or (data.get("workOnly",false) and building.get("status","")!="Toodab"):continue
		var axis:=Vector3.RIGHT if data.axis=="x" else Vector3.UP if data.axis=="y" else Vector3.BACK
		var basis:=Basis(axis,time*float(data.speed));var raw: Array=data.pivot;var pivot:=Vector3(raw[0],raw[1],raw[2])
		entry.part.transform=Transform3D(basis,pivot-basis*pivot)

func apply_town_material(node: Node) -> void:
	if node is MeshInstance3D and node.mesh!=null:
		for surface in node.mesh.get_surface_count():
			var surface_key:=str(node.mesh.get_instance_id())+":"+str(surface)
			if not vertex_color_surfaces.has(surface_key):
				var arrays: Array=node.mesh.surface_get_arrays(surface)
				vertex_color_surfaces[surface_key]=arrays[Mesh.ARRAY_COLOR]!=null and not arrays[Mesh.ARRAY_COLOR].is_empty()
			if not vertex_color_surfaces[surface_key]:continue
			if town_material==null:town_material=ShaderMaterial.new();town_material.shader=TOWN_SHADER
			node.set_surface_override_material(surface,town_material)
	for child in node.get_children():apply_town_material(child)
