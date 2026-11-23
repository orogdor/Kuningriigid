extends Node3D

signal chunk_step

const Grid=preload("res://scripts/campaign_grid.gd")
const Scatter=preload("res://scripts/forest_scatter.gd")
const Terrain=preload("res://scripts/world_terrain.gd")
const Rivers=preload("res://scripts/world_rivers.gd")
const Geography=preload("res://scripts/world_geography.gd")
const Town=preload("res://scripts/world_city_layout.gd")
const Campaign=preload("res://scripts/campaign_state.gd")
const Discoveries=preload("res://scripts/world_discoveries.gd")
const Production=preload("res://scripts/production_bonuses.gd")
const CHUNK:=8
const SCALE:=0.04
const MAX_CHUNKS:=96
const TREE_KINDS:=["oak","lime","birch","pine","spruce","palm"]
const TREE_HEIGHTS:={"oak":2.4244623,"lime":2.3191163,"birch":2.5285895,"pine":2.95,"spruce":2.95,"palm":2.6344731}
const REFERENCE_HEIGHTS:={"oak":16.76573,"lime":20.28008,"birch":18.25661,"pine":18.16921,"spruce":18.0963,"palm":13.54984}
const TINTS:=["ffffff","f3f7e6","e6efd6","fff4de","e2ead9","f7f1d4"]
var host: Node
var chunks: Dictionary={}
var chunk_vision: Dictionary={}
var wanted: Dictionary={}
var pending: Array=[]
var seed_value: int=-1
var camera_stamp: String=""
var clock:=0.0
var meshes: Dictionary={}
var tree_textures: Dictionary={}
var river_graph: Dictionary={}
var river_buckets: Dictionary={}
var river_samples: Dictionary={}
var town_buckets: Dictionary={}
var towns_dirty:=true
var building_chunk:=false
var building_key: String=""
var build_serial:=0
var lod_stamp: String=""
var near_queue: Array=[]
var near_queued: Dictionary={}
var near_requests: Dictionary={}
var near_failed: Dictionary={}

func _ready() -> void:
	for kind in TREE_KINDS:
		for variant in 5:
			var key: String=kind+":"+str(variant)
			var path: String="res://assets/sapling-trees/%s_%02d/mid.glb" % [kind,variant+1]
			var model: Node=load(path).instantiate()
			var item:=first_mesh(model)
			if item!=null:
				meshes[key]=item.mesh.duplicate()
				for surface in item.mesh.get_surface_count():
					var source_material: Material=item.mesh.surface_get_material(surface)
					var tree_material: Material=source_material.duplicate() if source_material!=null else null
					if tree_material is BaseMaterial3D:
						if tree_material.albedo_texture!=null:
							if not tree_textures.has(kind):tree_textures[kind]=tree_material.albedo_texture
							tree_material.albedo_texture=tree_textures[kind]
						tree_material.vertex_color_use_as_albedo=true
						tree_material.cull_mode=BaseMaterial3D.CULL_DISABLED
					if tree_material!=null:meshes[key].surface_set_material(surface,tree_material)
			model.free()
			var far_key:=key+":far"
			var far_path: String="res://assets/sapling-trees/%s_%02d/far.glb" % [kind,variant+1]
			var far_model: Node=load(far_path).instantiate();var far_item:=first_mesh(far_model)
			if far_item!=null:
				meshes[far_key]=far_item.mesh.duplicate()
				for surface in far_item.mesh.get_surface_count():
					var source_material: Material=far_item.mesh.surface_get_material(surface)
					var far_material: Material=source_material.duplicate() if source_material!=null else null
					if far_material is BaseMaterial3D:
						far_material.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED
						far_material.vertex_color_use_as_albedo=true;far_material.cull_mode=BaseMaterial3D.CULL_DISABLED
					if far_material!=null:meshes[far_key].surface_set_material(surface,far_material)
			far_model.free()
	for kind in ["cactus","rock","shrub"]:
		var model: Node=load("res://assets/world/atlas_"+kind+".glb").instantiate()
		var item:=first_mesh(model)
		if item!=null:
			meshes[kind]=item.mesh.duplicate()
			var material:=StandardMaterial3D.new();material.vertex_color_use_as_albedo=true;material.roughness=0.95;material.cull_mode=BaseMaterial3D.CULL_DISABLED
			for surface in meshes[kind].get_surface_count():meshes[kind].surface_set_material(surface,material)
		model.free()

func first_mesh(node: Node) -> MeshInstance3D:
	if node is MeshInstance3D:return node
	for child in node.get_children():
		var found:=first_mesh(child)
		if found!=null:return found
	return null

func _exit_tree() -> void:
	for path in near_requests.values():
		var status:=ResourceLoader.load_threaded_get_status(path)
		if status in [ResourceLoader.THREAD_LOAD_IN_PROGRESS,ResourceLoader.THREAD_LOAD_LOADED]:ResourceLoader.load_threaded_get(path)
	near_requests.clear();near_queue.clear();near_queued.clear()

func _process(delta: float) -> void:
	if host==null or host.game.is_empty():return
	if building_chunk:chunk_step.emit()
	visible=not host.detail_mode
	if not visible:return
	poll_near_models()
	var current_seed:=int(host.game.seed)
	if seed_value!=current_seed:
		reset_chunks();seed_value=current_seed
	clock+=delta
	if clock>=0.35:
		clock=0.0;update_wanted();update_tree_lods()
	if not building_chunk and not pending.is_empty():
		var key: String=pending.pop_front()
		if wanted.has(key) and not chunks.has(key):
			building_chunk=true;building_key=key
			build_chunk(key,build_serial)

func reset_chunks() -> void:
	build_serial+=1
	if building_chunk:chunk_step.emit()
	building_chunk=false;building_key=""
	for node in chunks.values():node.queue_free()
	chunks.clear();chunk_vision.clear();wanted.clear();pending.clear();camera_stamp="";lod_stamp=""
	river_graph.clear();river_buckets.clear();river_samples.clear();town_buckets.clear();towns_dirty=true

func invalidate_towns(positions: Array=[]) -> void:
	build_serial+=1
	if building_chunk:chunk_step.emit()
	building_chunk=false;building_key=""
	towns_dirty=true;camera_stamp=""
	for key in chunks.keys():
		var parts:=str(key).split(":");var chunk_c:=int(parts[0]);var chunk_r:=int(parts[1]);var affected:=positions.is_empty()
		for tile in positions:
			if tile.x>=chunk_c*CHUNK-2 and tile.x<(chunk_c+1)*CHUNK+2 and tile.y>=chunk_r*CHUNK-2 and tile.y<(chunk_r+1)*CHUNK+2:affected=true;break
		if affected:chunks[key].queue_free();chunks.erase(key);chunk_vision.erase(key)
	pending.clear()

func ensure_towns() -> void:
	if not towns_dirty:return
	towns_dirty=false;town_buckets.clear()
	for city in host.game.get("cities",[]):
		if Production.upgrade_level(host.game,int(city.team))!=0:continue
		if int(city.team)!=0 and not Campaign.visible_now(host.game,0,city):continue
		add_town_clearances(city.economy.buildings,Grid.center(int(city.c),int(city.r)))
	for landmark in host.game.get("landmarks",[]):
		if landmark.kind!="village" or Discoveries.village_age(host.game,landmark)!=0:continue
		var key:=str(int(landmark.c))+":"+str(int(landmark.r))
		if not host.reveal_all and not host.game.explored[0].has(key):continue
		add_town_clearances(Discoveries.village_layout(landmark),Grid.center(int(landmark.c),int(landmark.r)))

func add_town_clearances(buildings: Array,origin: Vector2) -> void:
	for spot in Town.clearances(buildings,origin):
		var min_c:=floori((float(spot.x)-float(spot.r)-Grid.ORIGIN_X)/50.0)
		var max_c:=floori((float(spot.x)+float(spot.r)-Grid.ORIGIN_X)/50.0)
		var min_r:=floori((float(spot.z)-float(spot.r)-Grid.ORIGIN_Z)/50.0)
		var max_r:=floori((float(spot.z)+float(spot.r)-Grid.ORIGIN_Z)/50.0)
		for r in range(min_r,max_r+1):
			for c in range(min_c,max_c+1):
				var key:=str(c)+":"+str(r)
				if not town_buckets.has(key):town_buckets[key]=[]
				town_buckets[key].append(spot)

func near_town(p: Vector2) -> bool:
	var c:=floori((p.x-Grid.ORIGIN_X)/50.0);var r:=floori((p.y-Grid.ORIGIN_Z)/50.0)
	for spot in town_buckets.get(str(c)+":"+str(r),[]):
		if p.distance_squared_to(Vector2(float(spot.x),float(spot.z)))<pow(float(spot.r),2):return true
	return false

func river_segments(c: int,r: int) -> Array:
	var key: String=str(c)+":"+str(r)
	if river_buckets.has(key):return river_buckets[key]
	if river_graph.is_empty():river_graph=Rivers.prepare(host.grid,seed_value)
	var segments: Array=[]
	for dr in range(-2,3):
		for dc in range(-2,3):
			var x:=c+dc;var z:=r+dr
			if x<0 or x>=Grid.COLS or z<0 or z>=Grid.ROWS:continue
			var cell: Dictionary=host.grid[z*Grid.COLS+x]
			if not cell.get("riverTo") is Dictionary:continue
			var source_key:=str(x)+":"+str(z)
			if not river_samples.has(source_key):river_samples[source_key]=Rivers.sample(host.grid,host.world_height_samples,cell,river_graph,8)
			var points: Array=river_samples[source_key]
			for i in range(points.size()-1):segments.append([points[i],points[i+1]])
	river_buckets[key]=segments
	return segments

func near_river(point: Vector2,c: int,r: int,margin: float) -> bool:
	for segment in river_segments(c,r):
		var a: Dictionary=segment[0];var b: Dictionary=segment[1]
		var start:=Vector2(float(a.x),float(a.z));var end:=Vector2(float(b.x),float(b.z));var edge:=end-start
		var t:=clampf((point-start).dot(edge)/maxf(edge.length_squared(),0.000001),0.0,1.0)
		var width:=lerpf(float(a.width),float(b.width),t)
		if point.distance_squared_to(start+edge*t)<pow(width+margin,2):return true
	return false

func update_wanted() -> void:
	var center_c:=floori(host.camera_target.x/host.CELL_SIZE+Grid.COLS/2.0)
	var center_r:=floori(host.camera_target.z/host.CELL_SIZE+Grid.ROWS/2.0)
	var aspect:=get_viewport().get_visible_rect().size.x/maxf(1.0,get_viewport().get_visible_rect().size.y)
	var half_c:=ceili(host.zoom*aspect/(host.CELL_SIZE*2.0))+CHUNK
	var half_r:=ceili(host.zoom/(host.CELL_SIZE*2.0))+CHUNK
	var min_c:=clampi(floori(float(center_c-half_c)/CHUNK),0,ceili(float(Grid.COLS)/CHUNK)-1)
	var max_c:=clampi(floori(float(center_c+half_c)/CHUNK),0,ceili(float(Grid.COLS)/CHUNK)-1)
	var min_r:=clampi(floori(float(center_r-half_r)/CHUNK),0,ceili(float(Grid.ROWS)/CHUNK)-1)
	var max_r:=clampi(floori(float(center_r+half_r)/CHUNK),0,ceili(float(Grid.ROWS)/CHUNK)-1)
	var stamp: String="%s:%s:%s:%s:%s:%s:%s:%s" % [min_c,max_c,min_r,max_r,center_c/CHUNK,center_r/CHUNK,host.game.get("visionRevision",0),host.reveal_all]
	if stamp==camera_stamp:return
	camera_stamp=stamp
	var candidates: Dictionary={}
	if host.reveal_all:
		for r in range(min_r,max_r+1):
			for c in range(min_c,max_c+1):candidates["%d:%d" % [c,r]]=Vector2i(c,r)
	else:
		for key in host.game.explored[0]:
			var parts:=str(key).split(":")
			if parts.size()!=2:continue
			var c:=floori(float(int(parts[0]))/CHUNK);var r:=floori(float(int(parts[1]))/CHUNK)
			if c>=min_c and c<=max_c and r>=min_r and r<=max_r:candidates["%d:%d" % [c,r]]=Vector2i(c,r)
	var keys:=candidates.keys()
	keys.sort_custom(func(a,b):
		var pa: Vector2i=candidates[a];var pb: Vector2i=candidates[b]
		return Vector2(pa*CHUNK).distance_squared_to(Vector2(center_c,center_r))<Vector2(pb*CHUNK).distance_squared_to(Vector2(center_c,center_r)))
	wanted.clear()
	for i in mini(MAX_CHUNKS,keys.size()):wanted[keys[i]]=true
	for key in chunks.keys():
		if not wanted.has(key):chunks[key].queue_free();chunks.erase(key);chunk_vision.erase(key)
		elif chunk_vision.get(key,"")!=visibility_stamp(key):chunks[key].queue_free();chunks.erase(key);chunk_vision.erase(key)
	pending.clear()
	for key in keys:
		if wanted.has(key) and not chunks.has(key) and key!=building_key:pending.append(key)

func visibility_stamp(key: String) -> String:
	if host.reveal_all:return "all"
	var parts:=key.split(":");var chunk_c:=int(parts[0]);var chunk_r:=int(parts[1]);var found:=PackedStringArray()
	for r in range(chunk_r*CHUNK,mini((chunk_r+1)*CHUNK,Grid.ROWS)):
		for c in range(chunk_c*CHUNK,mini((chunk_c+1)*CHUNK,Grid.COLS)):
			if host.game.explored[0].has(str(c)+":"+str(r)):found.append(str((r-chunk_r*CHUNK)*CHUNK+c-chunk_c*CHUNK))
	return ",".join(found)

func tree_lod(node: MultiMeshInstance3D,center: Vector3) -> void:
	var key: String=node.get_meta("tree_key","")
	if not meshes.has(key+":far"):return
	var height:=float(node.get_meta("tree_height",0.0));var distance:=maxf(0.001,host.camera.position.distance_to(center))
	var pixels:=height*get_viewport().get_visible_rect().size.y/(2.0*tan(deg_to_rad(host.camera.fov/2.0))*distance)
	var previous: String=node.get_meta("tree_lod","far")
	var level: String="near" if pixels>(37.0 if previous=="near" else 45.0) else "mid" if pixels>(10.0 if previous=="mid" else 12.0) else "far"
	if level=="near" and not meshes.has(key+":near"):
		if not near_queued.has(key) and not near_requests.has(key) and not near_failed.has(key):near_queued[key]=true;near_queue.append(key)
		level="mid"
	var wanted_mesh: Mesh=meshes[key+":far"] if level=="far" else meshes[key+":near"] if level=="near" else meshes[key]
	if node.multimesh.mesh!=wanted_mesh:node.multimesh.mesh=wanted_mesh
	node.set_meta("tree_lod",level)

func poll_near_models() -> void:
	while near_requests.size()<4 and not near_queue.is_empty():
		var key: String=near_queue.pop_front();near_queued.erase(key)
		var parts:=key.split(":");var kind: String=parts[0];var variant:=int(parts[1])+1
		var path: String="res://assets/sapling-trees/%s_%02d/near.glb" % [kind,variant]
		if ResourceLoader.load_threaded_request(path,"PackedScene",false)==OK:near_requests[key]=path
		else:near_failed[key]=true
	for key in near_requests.keys():
		var path: String=near_requests[key];var state:=ResourceLoader.load_threaded_get_status(path)
		if state==ResourceLoader.THREAD_LOAD_LOADED:
			var scene: PackedScene=ResourceLoader.load_threaded_get(path);near_requests.erase(key)
			if scene==null:near_failed[key]=true;continue
			var model: Node=scene.instantiate();var item:=first_mesh(model)
			if item==null:model.free();near_failed[key]=true;continue
			var near_key: String=key+":near";meshes[near_key]=item.mesh.duplicate();var kind: String=key.split(":")[0]
			for surface in item.mesh.get_surface_count():
				var source: Material=item.mesh.surface_get_material(surface);var material: Material=source.duplicate() if source!=null else null
				if material is BaseMaterial3D:
					if material.albedo_texture!=null and tree_textures.has(kind):material.albedo_texture=tree_textures[kind]
					material.vertex_color_use_as_albedo=true;material.cull_mode=BaseMaterial3D.CULL_DISABLED
				if material!=null:meshes[near_key].surface_set_material(surface,material)
			model.free();lod_stamp=""
		elif state in [ResourceLoader.THREAD_LOAD_FAILED,ResourceLoader.THREAD_LOAD_INVALID_RESOURCE]:near_requests.erase(key);near_failed[key]=true

func update_tree_lods() -> void:
	if host.camera==null:return
	var p: Vector3=host.camera.position
	var stamp: String="%d:%d:%d:%d:%d" % [roundi(p.x*4),roundi(p.y*4),roundi(p.z*4),roundi(host.camera.fov*10),chunks.size()]
	if stamp==lod_stamp:return
	lod_stamp=stamp
	for root in chunks.values():
		if not is_instance_valid(root):continue
		var center: Vector3=root.get_meta("chunk_center",Vector3.ZERO)
		for node in root.get_children():
			if node is MultiMeshInstance3D:tree_lod(node,center)

func build_chunk(key: String,serial: int) -> void:
	ensure_towns()
	var initial_vision:=visibility_stamp(key);var processed:=0
	var parts:=key.split(":");var chunk_c:=int(parts[0]);var chunk_r:=int(parts[1])
	var sets: Dictionary={}
	for mesh_id in meshes:
		if not str(mesh_id).ends_with(":far") and not str(mesh_id).ends_with(":near"):sets[mesh_id]=[]
	var spacing:=5.0
	for r in range(chunk_r*CHUNK,mini((chunk_r+1)*CHUNK,Grid.ROWS)):
		for c in range(chunk_c*CHUNK,mini((chunk_c+1)*CHUNK,Grid.COLS)):
			processed+=1
			if processed%4==0:
				await chunk_step
				if serial!=build_serial:return
				if not wanted.has(key) or host.detail_mode:
					building_chunk=false;building_key="";camera_stamp="";return
			if not host.reveal_all and not host.game.explored[0].has(str(c)+":"+str(r)):continue
			var index:=r*Grid.COLS+c;var cell: Dictionary=host.grid[index]
			if not cell.land or cell.mountain:continue
			var biome: String=host.visual_biome(index)
			var probability:=Scatter.probability(biome,spacing,0.60)
			if probability<=0:continue
			var forest: bool=biome in ["forest","jungle","taiga"]
			var center:=Grid.center(c,r)
			var min_x:=center.x-25;var min_z:=center.y-25
			add_small_nature(sets,biome,cell,center)
			var gx0:=floori(min_x/spacing);var gx1:=floori((min_x+50)/spacing)
			var gz0:=floori(min_z/spacing);var gz1:=floori((min_z+50)/spacing)
			for gz in range(gz0,gz1+1):
				for gx in range(gx0,gx1+1):
					var p:=Scatter.candidate(gx,gz,spacing,seed_value)
					if p.x<min_x or p.x>=min_x+50 or p.y<min_z or p.y>=min_z+50:continue
					if Scatter.random_value(gx,gz,seed_value,33)>probability:continue
					var ground_height:=Terrain.height_at(host.world_height_samples,p.x,p.y)
					if ground_height<3 or ground_height>45 or Scatter.random_value(gx,gz,seed_value,34)>Scatter.tree_keep(p.x,p.y,forest) or near_river(p,c,r,3.2) or near_town(p):continue
					var close_start:=false
					for start in host.starts:
						if p.distance_to(Grid.center(int(start.c),int(start.r)))<8:close_start=true;break
					if close_start:continue
					var k:=Scatter.random_value(gx,gz,seed_value,35)
					var choice:=Scatter.random_value(gx,gz,seed_value,36)
					var tree_kind:=Scatter.kind(biome,float(host.heat[index]),float(host.moisture[index]),choice)
					if biome in ["desert","mesa"]:
						var oasis:=false
						for d in [Vector2i.LEFT,Vector2i.RIGHT,Vector2i.UP,Vector2i.DOWN]:
							var x: int=c+d.x;var z: int=r+d.y
							if x>=0 and x<Grid.COLS and z>=0 and z<Grid.ROWS and host.grid[z*Grid.COLS+x].get("river",false):oasis=true;break
						tree_kind="palm" if oasis and choice<0.75 else "cactus"
					if tree_kind.is_empty():continue
					var variant_noise:=sin(p.x*12.9898+p.y*78.233)*43758.5453
					var variant:=mini(4,floori((variant_noise-floorf(variant_noise))*5.0))
					var mesh_key:=tree_kind if tree_kind=="cactus" else tree_kind+":"+str(variant)
					if not meshes.has(mesh_key):continue
					var size: float=(3.8+k*4.2)*0.45*(1.2 if forest else 1.0)/(1.25 if tree_kind=="cactus" else 1.7 if tree_kind in ["pine","spruce"] else 1.6 if tree_kind=="birch" else 1.45)*SCALE
					var position:=Vector3((p.x-Grid.WORLD_CENTER_X)*SCALE,Terrain.mesh_elevation(host.world_mesh_samples,p.x,p.y),(p.y-Grid.WORLD_CENTER_Z)*SCALE)
					var model_scale: float=size if tree_kind=="cactus" else size*float(TREE_HEIGHTS[tree_kind])/float(REFERENCE_HEIGHTS[tree_kind])
					var rotation:=Basis(Vector3.UP,k*6.28).scaled(Vector3.ONE*model_scale)
					var tint:=Color(TINTS[floori(Scatter.random_value(gx,gz,seed_value,37)*TINTS.size())%TINTS.size()])
					sets[mesh_key].append({"transform":Transform3D(rotation,position),"color":tint})
			if not forest:continue
			# The original adds a second, larger stand on forest-biome tiles.
			var stand_spacing:=14.0
			for gz in range(floori(min_z/stand_spacing),floori((min_z+50)/stand_spacing)+1):
				for gx in range(floori(min_x/stand_spacing),floori((min_x+50)/stand_spacing)+1):
					var p:=Scatter.candidate(gx,gz,stand_spacing,seed_value,71)
					if p.x<min_x or p.x>=min_x+50 or p.y<min_z or p.y>=min_z+50:continue
					if Scatter.random_value(gx,gz,seed_value,73)>Scatter.tree_keep(p.x,p.y,true):continue
					if Terrain.height_at(host.world_height_samples,p.x,p.y)<2.5 or near_river(p,c,r,5.0) or near_town(p):continue
					var tree_kind:=Scatter.kind(biome,float(host.heat[index]),float(host.moisture[index]),Geography.noise(p.x*0.13,p.y*0.17,seed_value))
					if tree_kind.is_empty():continue
					var variant_noise:=sin(p.x*12.9898+p.y*78.233)*43758.5453
					var variant:=mini(4,floori((variant_noise-floorf(variant_noise))*5.0));var mesh_key:=tree_kind+":"+str(variant)
					if not meshes.has(mesh_key):continue
					var size: float=(5.6 if tree_kind in ["pine","spruce"] else 5.2 if tree_kind=="birch" else 4.6)*(0.65+Scatter.random_value(gx,gz,seed_value,74)*0.5)*SCALE
					var model_scale: float=size*float(TREE_HEIGHTS[tree_kind])/float(REFERENCE_HEIGHTS[tree_kind])
					var position:=Vector3((p.x-Grid.WORLD_CENTER_X)*SCALE,Terrain.mesh_elevation(host.world_mesh_samples,p.x,p.y),(p.y-Grid.WORLD_CENTER_Z)*SCALE)
					var rotation:=Basis(Vector3.UP,Geography.noise(p.x*0.13,p.y*0.17,seed_value)*TAU).scaled(Vector3.ONE*model_scale)
					sets[mesh_key].append({"transform":Transform3D(rotation,position),"color":Color.WHITE})
	if initial_vision!=visibility_stamp(key):
		building_chunk=false;building_key="";camera_stamp="";return
	var root:=Node3D.new();add_child(root);chunks[key]=root;chunk_vision[key]=initial_vision
	var center:=Vector3((chunk_c*CHUNK+CHUNK/2.0-Grid.COLS/2.0)*host.CELL_SIZE,0,(chunk_r*CHUNK+CHUNK/2.0-Grid.ROWS/2.0)*host.CELL_SIZE)
	center.y=host.world_marker_height(center);root.set_meta("chunk_center",center)
	for tree_kind in sets:
		var instances: Array=sets[tree_kind]
		if instances.is_empty():continue
		var multi:=MultiMesh.new();multi.transform_format=MultiMesh.TRANSFORM_3D;multi.use_colors=true
		multi.mesh=meshes[tree_kind];multi.instance_count=instances.size()
		var max_height:=0.0;var unit_height:=multi.mesh.get_aabb().size.y
		for i in instances.size():
			multi.set_instance_transform(i,instances[i].transform);multi.set_instance_color(i,instances[i].color)
			max_height=maxf(max_height,instances[i].transform.basis.get_scale().y*unit_height)
		var node:=MultiMeshInstance3D.new();node.multimesh=multi
		root.add_child(node);node.set_meta("tree_key",tree_kind);node.set_meta("tree_height",max_height);tree_lod(node,center)
	building_chunk=false;building_key=""

func add_small_nature(sets: Dictionary,biome: String,cell: Dictionary,center: Vector2) -> void:
	var c:=int(cell.c);var r:=int(cell.r)
	var bush: float={"forest":1.2,"jungle":2.0,"taiga":0.8,"grassland":2.0,"lush_river":1.8,"steppe":2.6,"desert":2.6,"tundra":2.2,"mesa":0.8}.get(biome,0.0)
	var amount:=bush*0.60*1.5
	var shrubs:=floori(amount)+(1 if Geography.noise(c+71,r+9,seed_value)<fposmod(amount,1.0) else 0)
	for i in shrubs:
		var p:=center+Vector2((Geography.noise(c*7+i*5.1,r*13+i,seed_value)-0.5)*42,(Geography.noise(c*3+i,r*17+i*2.3,seed_value)-0.5)*42)
		var height:=Terrain.height_at(host.world_height_samples,p.x,p.y)
		if height<2.5 or height>45 or near_river(p,c,r,2.5):continue
		var k:=Geography.noise(c+i*9.1,r+i*4.4,seed_value)
		var tint: String="d9c48e" if biome in ["desert","mesa"] else "e8dfb4" if biome=="steppe" else "c9cdb0" if biome=="tundra" else TINTS[i%TINTS.size()]
		var model_scale:=((1.5 if biome in ["desert","tundra"] else 2.2)+k*(1.6 if biome in ["desert","tundra"] else 2.6))*SCALE
		append_small_nature(sets,"shrub",p,model_scale,k*TAU,Color(tint))
	var chance: Variant={"desert":0.15,"mesa":0.15,"tundra":0.4,"steppe":0.62}.get(biome)
	if chance==null or Geography.noise(c+126,r+113,seed_value)<=float(chance):return
	var p:=center+Vector2((Geography.noise(c+31,r+72,seed_value)-0.5)*33,(Geography.noise(c+13,r+61,seed_value)-0.5)*33)
	var height:=Terrain.height_at(host.world_height_samples,p.x,p.y)
	if height<2.5 or height>45:return
	var model_scale: float=(2.2+Geography.noise(c+7,r+99,seed_value)*4.0)/1.5*SCALE
	append_small_nature(sets,"rock",p,model_scale,Geography.noise(c,r,seed_value)*TAU,Color.WHITE)

func append_small_nature(sets: Dictionary,kind: String,p: Vector2,model_scale: float,rotation: float,tint: Color) -> void:
	if not sets.has(kind) or near_town(p):return
	var position:=Vector3((p.x-Grid.WORLD_CENTER_X)*SCALE,Terrain.mesh_elevation(host.world_mesh_samples,p.x,p.y),(p.y-Grid.WORLD_CENTER_Z)*SCALE)
	sets[kind].append({"transform":Transform3D(Basis(Vector3.UP,rotation).scaled(Vector3.ONE*model_scale),position),"color":tint})
