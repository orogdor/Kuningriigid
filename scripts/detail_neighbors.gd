extends Node3D

const Terrain=preload("res://scripts/detail_terrain.gd")
const Landscape=preload("res://scripts/detail_landscape.gd")
const GroundMaterial=preload("res://scripts/detail_ground_material.gd")
const DetailOcean=preload("res://scripts/detail_ocean.gd")
const Grid=preload("res://scripts/campaign_grid.gd")
const Detail=preload("res://scripts/detail_view.gd")
const Discoveries=preload("res://scripts/world_discoveries.gd")
const Campaign=preload("res://scripts/campaign_state.gd")
const Production=preload("res://scripts/production_bonuses.gd")
const DetailWorld=preload("res://scripts/detail_world.gd")
const VisualRiver=preload("res://scripts/visual_river.gd")
var host_node: Node
var pending: Array=[]
var frame_wait:=0
var worker: Thread
var active_item: Dictionary={}

func setup(host: Node,center: Vector2i) -> void:
	host_node=host
	for dr in range(-1,2):
		for dc in range(-1,2):
			if dc==0 and dr==0:continue
			var c:=center.x+dc;var r:=center.y+dr
			if c<0 or c>=Grid.COLS or r<0 or r>=Grid.ROWS:continue
			if not host.reveal_all and not host.game.explored[0].has(str(c)+":"+str(r)):continue
			var index:=r*Grid.COLS+c;var heights:=Terrain.tile_heights(host.grid,c,r)
			var tile:=Node3D.new();tile.position=Vector3(dc*225,0,dr*195);tile.set_meta("coords",Vector2i(c,r));add_child(tile)
			var color_heights: PackedVector4Array=host.detail_visual_for(c,r)
			tile.set_meta("visual_heights",color_heights)
			var ground:=MeshInstance3D.new();ground.mesh=host.detail_mesh_for(c,r,heights,color_heights)
			ground.set_instance_shader_parameter("detail_uv_offset",Vector2(dc*225,dr*195))
			var ground_color: Color=host.terrain_color(index)
			var ground_forest:=1.0 if host.is_forest_core(index) else 0.0
			GroundMaterial.attach(ground,ground_color,ground_forest)
			var adjacent={"ground_w":Vector2i(-1,0),"ground_e":Vector2i(1,0),"ground_n":Vector2i(0,-1),"ground_s":Vector2i(0,1),"ground_nw":Vector2i(-1,-1),"ground_ne":Vector2i(1,-1),"ground_sw":Vector2i(-1,1),"ground_se":Vector2i(1,1)}
			for key in adjacent:
				var pos: Vector2i=Vector2i(c,r)+adjacent[key];var tint:=ground_color;var forest:=ground_forest
				if pos.x>=0 and pos.y>=0 and pos.x<Grid.COLS and pos.y<Grid.ROWS:
					var other:=pos.y*Grid.COLS+pos.x
					if host.grid[other].land:tint=host.terrain_color(other);forest=1.0 if host.is_forest_core(other) else 0.0
				ground.set_instance_shader_parameter(key,Color(tint.r,tint.g,tint.b,forest))
			ground.set_instance_shader_parameter("blend_neighbours",true);tile.add_child(ground)
			var water:=MeshInstance3D.new();var plane:=PlaneMesh.new();plane.size=Vector2(225,195);water.mesh=plane;water.material_override=host.detail_ocean_for(c,r,heights,color_heights);tile.add_child(water)
			tile.set_meta("river_segments",host.detail_landscape_for(tile,c,r,heights,color_heights))
			if not add_known_nature(host,tile,Vector2i(c,r),heights,index) and (host.grid[index].land or host.grid[index].get("deposits",{}).get("fish",false)):
				pending.append({"tile":tile,"at":Vector2i(c,r),"heights":heights,"index":index})

func _process(_delta: float) -> void:
	if host_node==null:return
	if worker!=null:
		if worker.is_alive():return
		var generated: Dictionary=worker.wait_to_finish();worker=null
		if not active_item.is_empty() and is_instance_valid(active_item.tile):
			add_known_nature(host_node,active_item.tile,active_item.at,active_item.heights,int(active_item.index),generated)
		active_item={}
	if pending.is_empty():return
	frame_wait+=1
	if frame_wait<3:return
	frame_wait=0
	active_item=pending.pop_front();var at: Vector2i=active_item.at
	if not is_instance_valid(active_item.tile):active_item={};return
	var cell: Dictionary=host_node.city_cell_data({"c":at.x,"r":at.y}).duplicate(true)
	# The worker only samples the nearby terrain; snapshot those dictionaries so
	# generation never reads cells while the main thread updates their deposits.
	var cells: Array=host_node.grid.duplicate()
	for r in range(maxi(0,at.y-3),mini(Grid.ROWS,at.y+4)):
		for c in range(maxi(0,at.x-3),mini(Grid.COLS,at.x+4)):cells[r*Grid.COLS+c]=host_node.grid[r*Grid.COLS+c].duplicate(true)
	var biome: String=host_node.visual_biome(active_item.index);var seed:=int(host_node.game.seed)
	worker=Thread.new()
	var error:=worker.start(func():return DetailWorld.create(cells,cell,biome,seed))
	if error!=OK:worker=null;add_known_nature(host_node,active_item.tile,at,active_item.heights,int(active_item.index),DetailWorld.create(cells,cell,biome,seed));active_item={}

func _exit_tree() -> void:
	if worker!=null:worker.wait_to_finish();worker=null

func add_known_nature(host: Node,tile: Node3D,at: Vector2i,heights: Array,index: int,temporary: Dictionary={}) -> bool:
	var city: Variant=null
	for candidate in host.game.get("cities",[]):
		var contexts:Array=[candidate];contexts.append_array(candidate.get("districts",{}).values())
		for context in contexts:
			if int(context.c)==at.x and int(context.r)==at.y and (int(context.team)==0 or Campaign.visible_now(host.game,0,context)):city=context;break
		if city!=null:break
	var key:=str(at.x)+":"+str(at.y)
	var village: Variant=null
	if city==null:
		for landmark in host.game.get("landmarks",[]):
			if landmark.kind=="village" and int(landmark.c)==at.x and int(landmark.r)==at.y:village=landmark;break
	var world: Dictionary=city.world if city!=null else host.game.get("tileWorlds",{}).get(key,temporary)
	if world.is_empty():return false
	DetailWorld.ensure_sea_fish(world,host.grid[index],int(host.game.seed))
	if city!=null or village!=null:world=world.duplicate(true)
	var nature=Detail.new();nature.name="Nature";nature.heights=heights;nature.visual_heights=tile.get_meta("visual_heights",PackedVector4Array());nature.resources=world.resources;nature.world_data=world
	nature.river_segments=tile.get_meta("river_segments",[])
	nature.tree_biome=host.visual_biome(index);nature.tree_temperature=float(host.heat[index]);nature.tree_moisture=float(host.moisture[index]);nature.tree_cell=at;nature.tree_river=bool(host.grid[index].get("river",false))
	nature.tree_seed=int(host.game.seed);nature.tree_mountain=bool(host.grid[index].get("mountain",false))
	tile.add_child(nature);nature.add_nature(nature.tree_biome)
	if host.grid[index].land:
		nature.add_ground_cover(nature.tree_biome,0.12)
		if nature.ground_cover!=null:nature.ground_cover.set_roads(tile.get_meta("road_segments",[]))
	var buildings: Array=city.economy.buildings if city!=null else Discoveries.village_layout(village) if village!=null else []
	nature.sync_removed_resources(world.resources,float(host.game.time),buildings)
	if city!=null:
		nature.person=Node3D.new();nature.add_child(nature.person)
		var hall: Dictionary=city.economy.buildings[0];var upgrade:=Production.upgrade_level(host.game,int(city.team))
		if not hall.get("virtual",false):nature.place_hall(hall.x,hall.z,upgrade,float(hall.get("buildingRotationV228",0)),hall.get("houseDesignV354",{}))
		nature.sync_buildings(city,upgrade)
		nature.add_village_life(host,"city:"+str(city.id),int(city.team),true)
	elif village!=null:
		nature.person=Node3D.new();nature.add_child(nature.person)
		var hall: Dictionary=buildings[0];var age:=Discoveries.village_age(host.game,village)
		nature.place_hall(hall.x,hall.z,age,float(hall.buildingRotationV228),hall.get("houseDesignV354",{}));nature.sync_buildings({"economy":{"buildings":buildings}},age)
		nature.add_village_life(host,"landmark:"+str(village.id),int(village.get("claimedBy",-1)) if village.get("claimedBy")!=null else -1,true)
	return true
