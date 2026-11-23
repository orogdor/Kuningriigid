extends Node3D

const Grid = preload("res://scripts/campaign_grid.gd")
const Movement = preload("res://scripts/world_movement.gd")
const Naval = preload("res://scripts/naval_rules.gd")
const WorldGenerator = preload("res://scripts/tectonic_world.gd")
const Coastal = preload("res://scripts/coastal_starts.gd")
const ShorePlacement = preload("res://scripts/coastal_placement.gd")
const Geography = preload("res://scripts/world_geography.gd")
const Campaign = preload("res://scripts/campaign_state.gd")
const DetailView = preload("res://scripts/detail_view.gd")
const DetailNeighbors = preload("res://scripts/detail_neighbors.gd")
const DetailRoads = preload("res://scripts/detail_roads.gd")
const DetailTrails = preload("res://scripts/detail_trails.gd")
const DetailLandscape = preload("res://scripts/detail_landscape.gd")
const DetailGroundMaterial = preload("res://scripts/detail_ground_material.gd")
const DetailOcean = preload("res://scripts/detail_ocean.gd")
const RiverNavigation = preload("res://scripts/river_navigation.gd")
const BattleEncounter = preload("res://scripts/battle_encounter.gd")
const BattleNavigation = preload("res://scripts/battle_navigation.gd")
const BattleSimulation = preload("res://scripts/battle_simulation.gd")
const BattleResolution = preload("res://scripts/battle_resolution.gd")
const BattleSiege = preload("res://scripts/battle_siege.gd")
const BattleField = preload("res://scripts/battlefield.gd")
const BattleView = preload("res://scripts/battle_view.gd")
const DetailTerrainScript = preload("res://scripts/detail_terrain.gd")
const VisualRiver = preload("res://scripts/visual_river.gd")
const Settlement = preload("res://scripts/settlement_rules.gd")
const Research = preload("res://scripts/research_rules.gd")
const AIResearch = preload("res://scripts/ai_research.gd")
const AIBuild = preload("res://scripts/ai_build_planning.gd")
const AIMilitary = preload("res://scripts/ai_military.gd")
const AISettlement = preload("res://scripts/ai_settlement.gd")
const Armies = preload("res://scripts/army_management.gd")
const ArmyRecovery = preload("res://scripts/army_recovery.gd")
const AINavy = preload("res://scripts/ai_navy.gd")
const NavalExploration = preload("res://scripts/naval_exploration.gd")
const AITreasury = preload("res://scripts/ai_treasury.gd")
const Diplomacy = preload("res://scripts/diplomacy_rules.gd")
const Raids = preload("res://scripts/world_raids.gd")
const Merchants = preload("res://scripts/world_merchants.gd")
const Economy = preload("res://scripts/economy_rules.gd")
const LocalNav = preload("res://scripts/local_navigation.gd")
const CityRules = preload("res://scripts/city_build_rules.gd")
const BuildingOperations = preload("res://scripts/building_operations.gd")
const Builder = preload("res://scripts/builder_sim.gd")
const Lumber = preload("res://scripts/lumber_production.gd")
const DetailWorldScript = preload("res://scripts/detail_world.gd")
const Minerals = preload("res://scripts/mineral_sites.gd")
const Fisheries = preload("res://scripts/fishery.gd")
const Labor = preload("res://scripts/labor_allocation.gd")
const FarmingRules = preload("res://scripts/farming.gd")
const Production = preload("res://scripts/production_bonuses.gd")
const Recruitment = preload("res://scripts/military_recruitment.gd")
const Training = preload("res://scripts/military_training.gd")
const MarketHouseholds = preload("res://scripts/market_households.gd")
const Roads = preload("res://scripts/world_roads.gd")
const ModernFreight = preload("res://scripts/modern_freight.gd")
const BridgeRules = preload("res://scripts/bridge_rules.gd")
const WorldMinimap = preload("res://scripts/world_minimap.gd")
const WebHud = preload("res://scripts/web_hud.gd")
const WorldVegetation = preload("res://scripts/world_vegetation.gd")
const WorldTerrain = preload("res://scripts/world_terrain.gd")
const WorldTerritory = preload("res://scripts/world_territory.gd")
const WorldRivers = preload("res://scripts/world_rivers.gd")
const WorldMarkerModels = preload("res://scripts/world_marker_models.gd")
const WorldCityLayout = preload("res://scripts/world_city_layout.gd")
const Discoveries = preload("res://scripts/world_discoveries.gd")
const DATA_PATH := "res://data/world_12345.json"
const CELL_SIZE := 2.0
var world_height_samples: PackedFloat32Array
var world_mesh_samples: Variant
var world_river_graph: Dictionary={}
var river_navigation_cache: Dictionary={}
var bridge_refresh_pending:=false
var bridge_access_cache: Dictionary={}
var sea_distances: PackedInt32Array
var heights: Variant
var moisture: Variant
var heat: Variant
var latitudes: Variant
var starts: Array
var grid: Array = []
var player := Vector2i.ZERO
var selected := Vector2i(-1, -1)
var camera: Camera3D
var graphics_soldier_names:=true
var graphics_daylight: String="dynamic"
var graphics_shadows: bool=true
var graphics_ambient: String="normal"
var sunlight: DirectionalLight3D
var fill_light: DirectionalLight3D
var world_environment: WorldEnvironment
var marker: MeshInstance3D
var other_settler_root: Node3D
var other_settler_markers: Dictionary={}
var city_marker_root: Node3D
var city_markers: Dictionary={}
var world_vegetation: Node3D
var territory_root: Node3D
var territory_visual_stamp := ""
var road_root: Node3D
var road_visual_stamp := ""
var territory_stamp := ""
var territory_allocation: Dictionary={}
var ship_root: Node3D
var ship_markers: Dictionary={}
var merchant_root: Node3D
var merchant_markers: Dictionary={}
var merchant_path_cache: Dictionary={}
var raid_root: Node3D
var raid_markers: Dictionary={}
var landmark_root: Node3D
var landmark_markers: Dictionary={}
var landmark_stamp: String=""
var army_root: Node3D
var army_markers: Dictionary={}
var army_select: OptionButton
var army_command_mode:=false
var selected_entity: String="settler"
var selected_merchant_id: int=-1
var selected_ship_id: int=-1
var ship_command_mode:=false
var game_hud: Control
var status: Label
var camera_target := Vector3.ZERO
var zoom := 31.1
var dragging := false
var drag_button := 0
var drag_double_click := false
var drag_origin:=Vector2.ZERO
var drag_moved:=false
var settler_command_mode:=false
var paused := false
var autosave_clock:=0.0
var autosave_pending:=false
var autosave_suspended:=false
var simulation_paused := false
var menu_open := false
var simulation_pause_button: Button
var elapsed := 0.0
var settler: Dictionary = {}
var game: Dictionary = {}
var terrain: MeshInstance3D
var fog: MeshInstance3D
var fog_image: Image
var fog_texture: ImageTexture
var reveal_all := false
var fog_button: Button
var seed_input: LineEdit
var tempo_select: OptionButton
var pending_tempo := "normal"
var pending_difficulty := "normal"
var pending_world_type := "tectonic"
var generate_button: Button
var generation_thread: Thread
var battle_nav: Variant=null
var battle_sim: Variant=null
var battle_view: Node3D=null
var detail_root: Node3D
var detail_loading_overlay: ColorRect
var detail_loading_initial:=false
var detail_loading_previous:=false
var detail_loading_seconds:=0.0
var detail_button: Button
var found_button: Button
var research_row: VBoxContainer
var research_select: OptionButton
var research_label: Label
var resources_label: Label
var resources_button: Button
var resources_dialog: AcceptDialog
var resources_detail: RichTextLabel
var labor_dialog: AcceptDialog
var labor_scroll: ScrollContainer
var labor_summary: Label
var labor_summary_cards: Dictionary={}
var labor_builder_limit: SpinBox
var labor_builder_status: Label
var labor_workplaces: VBoxContainer
var labor_workplace_rows: Array=[]
var labor_training_row: HBoxContainer
var labor_training_limit: SpinBox
var labor_training_status: Label
var labor_structure_stamp: String=""
var basic_job_limits: Dictionary={}
var basic_job_status: Dictionary={}
var research_refresh_clock := 0.0
var city_created := false
var settler_mode := false
var settler_row: HBoxContainer
var settler_select: OptionButton
var settler_choose_button: Button
var settler_select_stamp := ""
var active_city_index := 0
var city_select: OptionButton
var city_row: HBoxContainer
var city_select_stamp := ""
var site_position := Vector2.ZERO
var local_nav: RefCounted
var settler_local_navs: Dictionary={}
var city_nav: RefCounted
var city_river_nav: RefCounted
var lumber_sim: RefCounted
var training_sim: RefCounted
var city_runtimes: Dictionary={}
var training_dialog: AcceptDialog
var unit_select: OptionButton
var grade_select: OptionButton
var retrain_select: OptionButton
var training_status: Label
var recruitment_info: Label
var city_heights: Array = []
var build_position := Vector2.ZERO
var build_angle: Variant=null
var building_preview: Node3D
var building_preview_type := ""
var building_preview_error := ""
var build_placement_mode := false
var selected_building_index := -1
var selected_building_row: HBoxContainer
var selected_building_label: Label
var selected_building_toggle: Button
var selected_worker_limit: SpinBox
var army_row: HBoxContainer
var build_row: VBoxContainer
var build_select: OptionButton
var build_info: Label
var field_width: SpinBox
var field_depth: SpinBox
var field_drag_start: Variant=null
var field_drag_screen: Vector2
var field_preview: MeshInstance3D
var tree_visual_clock:=0.0
var selected_world: Dictionary = {}
var pending_load: Dictionary = {}
var pending_from_backup := false
const SAVE_FILE := "user://kuningriigid_godot_partial_v1.json"
const WallDraw=preload("res://scripts/wall_draw.gd")
const TownStreets=preload("res://scripts/town_streets.gd")
const Fortifications=preload("res://scripts/fortifications.gd")
const DistrictContexts=preload("res://scripts/district_context.gd")
const AIStoneDefenses=preload("res://scripts/ai_stone_defenses.gd")
const AIRoadGates=preload("res://scripts/ai_road_gates.gd")
const TerrainDefense=preload("res://scripts/terrain_defense_plan.gd")
const HistoricUrban=preload("res://scripts/historic_urban.gd")
const OuterRingSurvey=preload("res://scripts/outer_ring_survey.gd")
var outer_ring_surveys:Dictionary={}
var outer_survey_debug:Dictionary={}
const AIHousing=preload("res://scripts/ai_housing.gd")
const AIRural=preload("res://scripts/ai_rural.gd")
const WebSave=preload("res://scripts/web_save_import.gd")
const DetailDeployments=preload("res://scripts/detail_deployments.gd")
const DistrictBuilders=preload("res://scripts/district_builders.gd")
var wall_stroke: Array=[]
var wall_shape: String="straight"
var wall_tier:=1
var wall_preview: MeshInstance3D
var district_agents: Dictionary={}
var detail_unit_navs: Dictionary={}
var detail_unit_source: int=-1
var detail_unit_order:=false
var detail_district: Dictionary={}
var house_designer_layer: CanvasLayer
var fpv_walker: Node
var detail_mode := false
var detail_inspection := false
var world_camera_target := Vector3.ZERO
var world_zoom := 31.1
var detail_pick_heights: Dictionary={}
var detail_visual_cache: Dictionary={}
var detail_landscape_cache: Dictionary={}
var detail_mesh_cache: Dictionary={}
var detail_ocean_cache: Dictionary={}

func _ready() -> void:
	DetailView.request_nature_assets()
	DetailGroundMaterial.request_assets()
	var settings:=ConfigFile.new()
	if settings.load("user://kuningriigid_godot_settings.cfg")==OK:reveal_all=bool(settings.get_value("interface","reveal_all",false))
	var raw := FileAccess.get_file_as_string(DATA_PATH)
	var data: Variant = JSON.parse_string(raw)
	if not data is Dictionary or not data.has("heights"):
		push_error("Maailma andmed puuduvad")
		return
	heights = PackedFloat32Array(data.heights)
	moisture = data.moisture
	heat = data.heat
	latitudes = data.lat
	starts = Coastal.choose(Grid.COLS,Grid.ROWS,heights,data.starts)
	heights = Coastal.apply_plateaus(heights,Grid.COLS,Grid.ROWS,starts)
	if heights.size() != Grid.COLS * Grid.ROWS:
		push_error("Vale maailmaruudu suurus")
		return
	grid = prepare_geography(heights, int(data.seed), starts)
	player = Vector2i(int(starts[0].c), int(starts[0].r))
	selected=player
	game = Campaign.create_game(int(data.seed),data.starts)
	game.tempo=pending_tempo
	Campaign.apply_coastal_starts(game,starts)
	game.migrationV274 = {"until":120}
	game.peaceUntilV276 = 1200
	game.landmarks=Discoveries.create_landmarks(grid,int(game.seed),starts)
	follow_migration_band()
	settler = game.settlers[0]
	city_created = false
	if research_row != null: research_row.visible = false
	if research_label != null: research_label.visible = false
	if resources_label != null: resources_label.visible = false
	if resources_button != null: resources_button.visible = false
	if build_row != null: build_row.visible = false
	for a in game.settlers: Campaign.reveal(game,int(a.team),int(a.c),int(a.r))
	camera_target = cell_position(player)+Vector3(1,0,1)
	build_world()
	build_fog()
	build_environment()
	build_camera()
	build_marker()
	build_ui()
	fpv_walker=preload("res://scripts/fpv_walker.gd").new();fpv_walker.host=self;add_child(fpv_walker)
	update_camera()
	update_status("Vali hiirega naaberruut või kaugem maismaaruut.")
	call_deferred("open_initial_menu")

func open_initial_menu() -> void:
	if get_tree().current_scene!=self:return
	var had_save:=FileAccess.file_exists(SAVE_FILE) or FileAccess.file_exists(SAVE_FILE+".bak")
	if had_save:load_partial()
	if game_hud!=null and game_hud.game_menu!=null:game_hud.game_menu.open_menu()
	if had_save and generation_thread==null and game_hud!=null and game_hud.game_menu!=null:
		autosave_suspended=true
		game_hud.game_menu.menu_status.text="Automaatset salvestust ei saanud taastada. Kontrolli salvestusi enne uue mängu alustamist."

func cell_position(p: Vector2i) -> Vector3:
	return Vector3((p.x - Grid.COLS / 2.0) * CELL_SIZE, 0, (p.y - Grid.ROWS / 2.0) * CELL_SIZE)

func visual_biome(i: int) -> String:
	var cell: Dictionary = grid[i]
	var h: float = cell.h
	if cell.get("webGeneratedV331",false) and cell.has("visualBiome"):return str(cell.visualBiome)
	if not cell.land: return "sea"
	var lat: float = latitudes[i]
	var wet: float = moisture[i]
	var temperature: float = heat[i]
	var dry := clampf(1-wet*0.92+0.08,0,1)
	if cell.mountain:
		if lat > 0.72 or h > 36: return "snow_mountain"
		if dry > 0.68 and temperature > 0.45: return "mesa"
		return "mountain"
	if lat > 0.86: return "snow"
	if lat > 0.73: return "taiga" if wet > 0.42 else "tundra"
	if cell.get("river",false) and temperature > 0.45 and wet > 0.68 and h < 18: return "lush_river"
	if temperature > 0.72 and dry > 0.7: return "desert"
	if temperature > 0.67 and wet > 0.66: return "jungle"
	if wet > 0.66: return "forest"
	if dry > 0.56: return "steppe"
	return "grassland"

func is_forest_core(i:int)->bool:
	var cell:Dictionary=grid[i]
	if cell.get("legacyBiomeV250",false) or cell.get("webGeneratedV331",false):return str(cell.get("biome",""))=="forest"
	return not cell.get("mountain",false) and moisture[i]+(Geography.noise(int(cell.c)+40,int(cell.r)+60,int(game.seed))-0.5)*0.12>0.66

func terrain_color(i: int) -> Color:
	var palette := {"sea":"315d70","snow_mountain":"8b928a","mesa":"978067","mountain":"737b6c","snow":"dfe2d9","taiga":"53694c","tundra":"8e9780","desert":"b9a573","jungle":"426640","forest":"4b6945","steppe":"8b9561","lush_river":"718f52","grassland":"768d55"}
	var wooded: Dictionary={"grassland":"4c6946","lush_river":"4d7046","steppe":"596f48","desert":"a59a6d","tundra":"78836b","taiga":"475e47","jungle":"375f39"}
	var biome:=visual_biome(i);var cell: Dictionary=grid[i]
	var forest: bool=cell.land and is_forest_core(i)
	return Color(wooded[biome] if forest and wooded.has(biome) else palette[biome])

func build_world() -> void:
	river_navigation_cache.clear()
	detail_pick_heights.clear()
	detail_visual_cache.clear()
	clear_detail_landscape_cache()
	detail_mesh_cache.clear()
	detail_ocean_cache.clear()
	world_height_samples=WorldTerrain.samples(grid)
	var colors:=PackedColorArray();colors.resize(grid.size())
	for i in colors.size():colors[i]=terrain_color(i)
	var mesh:=WorldTerrain.build(grid,world_height_samples,colors,true,int(game.seed))
	world_mesh_samples=mesh.get_meta("atlas_sampler",mesh.get_meta("atlas_heights",PackedFloat32Array()))
	world_river_graph=WorldRivers.prepare(grid,int(game.seed))
	WorldRivers.add_surface(mesh,grid,world_height_samples,int(game.seed),world_river_graph)
	var mesh_instance:=MeshInstance3D.new();terrain=mesh_instance;mesh_instance.mesh=mesh
	var ground:=ShaderMaterial.new();ground.shader=load("res://scripts/world_terrain.gdshader")
	mesh_instance.set_surface_override_material(0,ground)
	if mesh.get_surface_count()>1:
		var river:=ShaderMaterial.new();river.shader=load("res://scripts/world_river.gdshader")
		mesh_instance.set_surface_override_material(1,river)
	if mesh.get_surface_count()>2:
		var banks:=ShaderMaterial.new();banks.shader=load("res://scripts/world_river_banks.gdshader")
		mesh_instance.set_surface_override_material(2,banks)
	add_child(mesh_instance)
	var ocean:=MeshInstance3D.new();ocean.mesh=WorldTerrain.build_ocean(mesh)
	var water:=ShaderMaterial.new();water.shader=load("res://scripts/world_ocean.gdshader")
	ocean.material_override=water;mesh_instance.add_child(ocean)
	if fog!=null:rebuild_fog_mesh();update_fog_symbols()

func build_environment() -> void:
	var env := WorldEnvironment.new()
	world_environment=env
	env.environment = Environment.new()
	env.environment.background_mode = Environment.BG_COLOR
	env.environment.background_color = Color("283741")
	env.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.environment.ambient_light_color = Color("f0f1e0")
	env.environment.ambient_light_energy = 0.85
	add_child(env)
	sunlight = DirectionalLight3D.new()
	sunlight.light_color=Color("ffe4be");sunlight.light_energy=0.55
	sunlight.position=Vector3(-80,150,90)
	add_child(sunlight);sunlight.look_at(Vector3.ZERO,Vector3.UP)
	fill_light=DirectionalLight3D.new()
	fill_light.light_color=Color("b4d3df");fill_light.light_energy=0.16
	fill_light.position=Vector3(130,90,-120)
	add_child(fill_light);fill_light.look_at(Vector3.ZERO,Vector3.UP)
	update_daylight()

func daylight_hour() -> float:
	match graphics_daylight:
		"day":return 12.0
		"evening":return 18.0
		"night":return 0.0
		_:return fposmod(8.0+elapsed/60.0,24.0)

func update_daylight() -> void:
	if sunlight==null or fill_light==null or world_environment==null:return
	var hour:=daylight_hour()
	var angle:=(hour-6.0)*PI/12.0;var elevation:=sin(angle)
	var daylight:=clampf((elevation+0.09)/0.52,0.0,1.0)
	var moon:=clampf(1.0-daylight*2.2,0.0,1.0)
	sunlight.shadow_enabled=graphics_shadows and elevation>0.07 and (detail_mode or zoom<19.2)
	var direction:=Vector3(cos(angle)*0.85,maxf(0.07,elevation),0.48)
	if elevation<0:
		var moon_angle:=angle+PI
		direction=Vector3(cos(moon_angle)*0.7,maxf(0.35,sin(moon_angle)),0.55)
	sunlight.position=direction.normalized()*150.0;sunlight.look_at(Vector3.ZERO,Vector3.UP)
	sunlight.light_energy=0.55*(pow(daylight,1.25)+0.24*moon)
	sunlight.light_color=Color("aebfff") if elevation<0 else Color("ffb37d") if elevation<0.28 else Color("ffe2b8")
	fill_light.light_energy=0.16*(0.36+0.64*daylight)
	world_environment.environment.ambient_light_energy=0.85*(0.32+0.68*daylight)*(0.7 if graphics_ambient=="low" else 1.3 if graphics_ambient=="bright" else 1.0)
	world_environment.environment.background_color=Color("101827").lerp(Color("283741"),daylight)

func build_camera() -> void:
	camera = Camera3D.new()
	camera.projection = Camera3D.PROJECTION_PERSPECTIVE
	camera.fov = 43.0
	camera.far = 2000
	add_child(camera)
	camera.current = true

func update_camera() -> void:
	if is_instance_valid(fpv_walker) and fpv_walker.active:fpv_walker.apply_camera();return
	camera.size = zoom
	if sunlight!=null:
		var elevation:=sin((daylight_hour()-6.0)*PI/12.0)
		sunlight.shadow_enabled=graphics_shadows and elevation>0.07 and (detail_mode or zoom<19.2)
	if detail_mode:
		var look_target:=camera_target+Vector3(0,maxf(0.0,detail_rendered_height(camera_target.x,camera_target.z)),0)
		camera.position = look_target + Vector3(144,234,240).normalized()*zoom/(2.0*tan(deg_to_rad(camera.fov/2.0)))
		camera.position.y=maxf(camera.position.y,detail_rendered_height(camera.position.x,camera.position.z)+4.0)
		camera.look_at(look_target, Vector3.UP)
	else:
		camera.position = camera_target + Vector3(30,228,210).normalized()*zoom/(2.0*tan(deg_to_rad(camera.fov/2.0)))
		camera.look_at(camera_target,Vector3.UP)

func build_marker() -> void:
	world_vegetation=Node3D.new()
	world_vegetation.set_script(WorldVegetation)
	world_vegetation.host=self
	add_child(world_vegetation)
	marker = MeshInstance3D.new()
	var ring:=TorusMesh.new()
	ring.inner_radius=0.55;ring.outer_radius=0.62
	marker.mesh=ring
	WorldMarkerModels.add_people(marker,"settler",0)
	var material := StandardMaterial3D.new()
	material.albedo_color = Color("f4cb64")
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	marker.material_override = material
	add_child(marker)
	other_settler_root=Node3D.new()
	add_child(other_settler_root)
	city_marker_root=Node3D.new()
	add_child(city_marker_root)
	territory_root=Node3D.new()
	add_child(territory_root)
	road_root=Node3D.new()
	add_child(road_root)
	landmark_root=Node3D.new()
	add_child(landmark_root)
	raid_root=Node3D.new();add_child(raid_root)
	merchant_root=Node3D.new();add_child(merchant_root)
	ship_root=Node3D.new();add_child(ship_root)
	army_root=Node3D.new()
	add_child(army_root)
	update_marker()

func refresh_visibility() -> void:
	var previous_revision:=int(game.get("visionRevision",0))
	if city_created:refresh_city_territory()
	for army in game.get("armies",[]):Campaign.reveal(game,int(army.team),int(army.c),int(army.r),2)
	for person in game.get("settlers",[]):
		if person.get("embarked")==null:Campaign.reveal(game,int(person.team),int(person.c),int(person.r),2)
	for ship in game.get("ships",[]):
		if float(ship.get("hp",0))>0:Campaign.reveal(game,int(ship.team),int(ship.c),int(ship.r),2)
	if int(game.get("visionRevision",0))!=previous_revision:refresh_fog()

func refresh_city_territory() -> void:
	if game.get("cities",[]).is_empty():return
	var parts: Array[String]=[]
	for city in game.cities:
		var realm: Dictionary=city.economy.realms[city.team]
		city.radius=CityTerritory.grown_radius(float(city.get("radius",1)),float(realm.pop))
		var developed: Array[String]=[]
		for key in city.get("districts",{}):
			var district: Dictionary=city.districts[key]
			for building in district.get("economy",{}).get("buildings",[]):
				if not building.get("virtual",false) and float(building.get("hp",0))>0:developed.append(str(key));break
		developed.sort()
		parts.append("%s:%s:%s:%s:%s:%s:%s" % [city.id,city.team,city.c,city.r,city.radius,realm.pop,",".join(developed)])
	var stamp:=str(game.get("seed",0))+"|"+"|".join(parts)
	if stamp==territory_stamp:return
	territory_stamp=stamp
	var cell_at=func(p):
		var c:=int(p.c);var r:=int(p.r)
		return grid[r*Grid.COLS+c] if c>=0 and c<Grid.COLS and r>=0 and r<Grid.ROWS else null
	territory_allocation=CityTerritory.allocate_territory(game.cities,cell_at,func(city):return city.radius)
	var previous_revision:=int(game.get("visionRevision",0))
	for key in territory_allocation.territory:
		var city: Dictionary=territory_allocation.territory[key]
		var coords:=str(key).split(":")
		Campaign.reveal(game,int(city.team),int(coords[0]),int(coords[1]),0)
	for city in game.cities:Campaign.reveal(game,int(city.team),int(city.c),int(city.r),maxi(2,int(city.radius)))
	if int(game.get("visionRevision",0))!=previous_revision:refresh_fog()

func update_territory_visual() -> void:
	if territory_root==null:return
	territory_root.visible=city_created and not detail_mode
	if not territory_root.visible:return
	var stamp: String=territory_stamp+":"+str(game.get("visionRevision",0))+":"+str(reveal_all)
	if stamp==territory_visual_stamp:return
	territory_visual_stamp=stamp
	for child in territory_root.get_children():child.queue_free()
	WorldTerritory.rebuild(territory_root,territory_allocation.get("territory",{}),territory_allocation.get("urban",{}),game.explored[0],reveal_all,world_height_samples,world_mesh_samples)

func update_world_roads() -> void:
	if road_root==null:return
	road_root.visible=not detail_mode
	if not road_root.visible:return
	var stamp: String="%s:%s:%s:%s:%s:%s" % [game.get("roadRevision",0),game.get("railRevision",0),game.get("visionRevision",0),reveal_all,game.ages,territory_stamp]
	if stamp==road_visual_stamp:return
	road_visual_stamp=stamp
	for child in road_root.get_children():child.queue_free()
	var surfaces: Dictionary={}
	for edge in Roads.visual_network(game,game.explored[0],reveal_all):
		var a: Vector2i=edge.a;var b: Vector2i=edge.b;var level:=int(edge.level)
		var owner: Variant=territory_allocation.get("territory",{}).get(str(a.x)+":"+str(a.y))
		if owner==null:owner=territory_allocation.get("territory",{}).get(str(b.x)+":"+str(b.y))
		var team:=int(owner.team) if owner is Dictionary else 0
		var age:=clampi(int(game.ages[team]),0,6)
		var surfaces_by_age: Array=[[1,1,1,1],[1,2,2,2],[2,3,3,3],[2,3,4,4],[2,3,4,5],[3,6,6,5],[3,6,7,7]]
		var appearance: int=surfaces_by_age[age][level-1]
		if not surfaces.has(appearance):
			var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES);surfaces[appearance]=surface
		var surface: SurfaceTool=surfaces[appearance]
		var half_width: float=1.1*[0.0,0.78,0.9,1.05,1.575][level]*0.86*0.04
		for i in range(edge.points.size()-1):
			var start: Vector2=edge.points[i];var end: Vector2=edge.points[i+1]
			var p:=Vector3((start.x-Grid.WORLD_CENTER_X)*0.04,0,(start.y-Grid.WORLD_CENTER_Z)*0.04)
			var q:=Vector3((end.x-Grid.WORLD_CENTER_X)*0.04,0,(end.y-Grid.WORLD_CENTER_Z)*0.04)
			var direction: Vector3=(q-p).normalized();var normal:=Vector3(-direction.z,0,direction.x)
			var px:=Grid.ORIGIN_X+(p.x+Grid.COLS)*25.0;var pz:=Grid.ORIGIN_Z+(p.z+Grid.ROWS)*25.0
			var qx:=Grid.ORIGIN_X+(q.x+Grid.COLS)*25.0;var qz:=Grid.ORIGIN_Z+(q.z+Grid.ROWS)*25.0
			var edge_p:=0.95+0.055*sin(px*0.19+sin(pz*0.15)*1.3)+0.025*sin(pz*0.39+px*0.22)
			var edge_q:=0.95+0.055*sin(qx*0.19+sin(qz*0.15)*1.3)+0.025*sin(qz*0.39+qx*0.22)
			var left:=p-normal*half_width*edge_p;var right:=p+normal*half_width*edge_p
			var next_left:=q-normal*half_width*edge_q;var next_right:=q+normal*half_width*edge_q
			for vertex in [left,right,next_right,left,next_right,next_left]:
				var v: Vector3=vertex
				v.y=WorldTerrain.mesh_elevation(world_mesh_samples,Grid.ORIGIN_X+(v.x+Grid.COLS)*25.0,Grid.ORIGIN_Z+(v.z+Grid.ROWS)*25.0)+0.09
				surface.add_vertex(v)
	var colors: Array=["","716147","7e6b50","817767","8b8170","9a9182","858682","545a5a"]
	for appearance in surfaces:
		var node:=MeshInstance3D.new();node.mesh=surfaces[appearance].commit()
		var material:=StandardMaterial3D.new();material.albedo_color=Color(colors[appearance]);material.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;material.cull_mode=BaseMaterial3D.CULL_DISABLED
		node.material_override=material;road_root.add_child(node)
	var rails:=SurfaceTool.new();rails.begin(Mesh.PRIMITIVE_LINES);var rail_count:=0
	for edge in game.get("railEdges",{}):
		var parts:=str(edge).split(":")
		if parts.size()!=2:continue
		var a:=int(parts[0]);var b:=int(parts[1]);var ac:=a%Grid.COLS;var ar:=floori(float(a)/Grid.COLS);var bc:=b%Grid.COLS;var br:=floori(float(b)/Grid.COLS)
		if not reveal_all and (not game.explored[0].has(str(ac)+":"+str(ar)) or not game.explored[0].has(str(bc)+":"+str(br))):continue
		var start:=cell_position(Vector2i(ac,ar))+Vector3(1,0,1);var end:=cell_position(Vector2i(bc,br))+Vector3(1,0,1)
		var direction: Vector3=(end-start).normalized();var normal:=Vector3(-direction.z,0,direction.x)*0.096
		for offset in [-1,1]:
			for v in [start+normal*offset,end+normal*offset]:
				var p: Vector3=v;p.y=world_marker_height(p)+0.056;rails.add_vertex(p);rail_count+=1
		for step in range(1,10):
			var middle:=start.lerp(end,float(step)/10.0)
			for v in [middle-normal*1.25,middle+normal*1.25]:
				var p: Vector3=v;p.y=world_marker_height(p)+0.0488;rails.add_vertex(p);rail_count+=1
	if rail_count>0:
		var node:=MeshInstance3D.new();node.mesh=rails.commit();var mat:=StandardMaterial3D.new();mat.albedo_color=Color("36424a");mat.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;node.material_override=mat;road_root.add_child(node)

func refresh_city_options() -> void:
	if city_select==null:return
	if not city_created or game.cities.is_empty():
		city_row.visible=false;city_select.clear();city_select_stamp="";return
	city_row.visible=game.cities.size()>1 or settler_mode
	var parts: Array[String]=[]
	for city in game.cities:parts.append("%s:%s:%s" % [city.id,city.team,city.get("name","")])
	var stamp: String="|".join(parts)
	if stamp==city_select_stamp and city_select.item_count>0:
		for i in city_select.item_count:
			if int(city_select.get_item_metadata(i))==int(game.cities[active_city_index].id):city_select.select(i);break
		return
	city_select_stamp=stamp;city_select.clear()
	for city in game.cities:
		if int(city.team)!=0:continue
		city_select.add_item(str(city.get("name","Linn")))
		city_select.set_item_metadata(city_select.item_count-1,int(city.id))
		if int(city.id)==int(game.cities[active_city_index].id):city_select.select(city_select.item_count-1)

func switch_city(index: int) -> void:
	if not city_created or index<0 or index>=city_select.item_count:return
	var id:=int(city_select.get_item_metadata(index));var next:=-1
	for i in game.cities.size():
		if int(game.cities[i].id)==id and int(game.cities[i].team)==0:next=i;break
	if next<0:return
	if next==active_city_index and not settler_mode and selected_entity!="army":selected_entity="city";return
	if detail_mode:toggle_detail()
	settler_mode=false;selected_entity="city"
	army_row.visible=true
	active_city_index=next
	var city: Dictionary=game.cities[active_city_index]
	player=Vector2i(int(city.c),int(city.r));camera_target=cell_position(player);world_camera_target=camera_target
	selected_building_index=-1;army_command_mode=false
	prepare_city_navigation(city);detail_button.text="Ava linna detailkaart"
	update_camera();update_marker();update_resources_status();refresh_research_options();refresh_city_options();refresh_settler_options()
	update_status("Valitud linn: "+str(city.name))

func refresh_settler_options() -> void:
	if settler_select==null:return
	settler_row.visible=city_created and not detail_mode
	if not city_created:
		settler_select.clear();settler_select_stamp="";return
	var selected_id: int=int(settler.get("id",-1)) if settler_mode else (int(settler_select.get_item_metadata(settler_select.selected)) if settler_select.selected>=0 and settler_select.item_count>0 else -1)
	var ids: Array[String]=[]
	for candidate in game.settlers:
		if int(candidate.team)==0:ids.append(str(int(candidate.id)))
	var stamp:=",".join(ids)
	settler_select.disabled=ids.is_empty()
	settler_choose_button.disabled=ids.is_empty()
	if ids.is_empty():
		if settler_select_stamp!="none":
			settler_select.clear();settler_select.add_item("Asunik puudub");settler_select.set_item_metadata(0,-1);settler_select_stamp="none"
		return
	if stamp==settler_select_stamp and settler_select.item_count>0:
		for i in settler_select.item_count:
			if int(settler_select.get_item_metadata(i))==selected_id:settler_select.select(i);break
		return
	settler_select_stamp=stamp;settler_select.clear()
	for candidate in game.settlers:
		if int(candidate.team)!=0:continue
		settler_select.add_item("Asunik %d" % (int(candidate.id)+1))
		settler_select.set_item_metadata(settler_select.item_count-1,int(candidate.id))
		if int(candidate.id)==selected_id:settler_select.select(settler_select.item_count-1)

func recruit_new_settler() -> void:
	if not city_created:return
	var result:=Settlement.recruit_settler(game,game.cities[active_city_index])
	if result.has("error"):update_status(result.error);return
	refresh_settler_options()
	for i in settler_select.item_count:
		if int(settler_select.get_item_metadata(i))==int(result.settler.id):settler_select.select(i);break
	update_resources_status()
	select_owned_settler()

func select_player_settler() -> void:
	if city_created:
		select_owned_settler()
		return
	if settler.is_empty():update_status("Oma asunik puudub.");return
	selected_entity="settler";army_command_mode=false
	if detail_mode:toggle_detail()
	player=Vector2i(int(settler.c),int(settler.r));focus_selected_entity()
	update_status("Asunik valitud.")
func select_owned_settler() -> void:
	if not city_created or settler_select.selected<0:update_status("Oma asunik puudub.");return
	var id:=int(settler_select.get_item_metadata(settler_select.selected));var selected: Variant=null
	for candidate in game.settlers:
		if int(candidate.id)==id and int(candidate.team)==0:selected=candidate;break
	if selected==null:update_status("Oma asunik puudub.");return
	if detail_mode:toggle_detail()
	settler=selected;settler_mode=true;selected_entity="settler";army_command_mode=false;local_nav=null
	player=Vector2i(int(settler.c),int(settler.r));camera_target=cell_position(player);world_camera_target=camera_target
	army_row.visible=false;detail_button.text="Ava asuniku detailkaart"
	refresh_city_options();refresh_settler_options();update_camera();update_marker()
	update_status("Valitud asunik; vali maailmakaardil sihtkoht.")

func army_has_units(army: Dictionary) -> bool:
	for unit in game.get("units",[]):
		if int(unit.team)==int(army.team) and int(unit.get("armyId",0))==int(army.get("id",0)) and float(unit.get("hp",0))>0 and not ArmyExperience.is_garrisoned(unit):return true
	return false

func toggle_auto_explore() -> void:
	var army: Variant=selected_army()
	if army==null or not Discoveries.army_has_scout(game,army):
		update_status("Automaatne avastamine vajab avastajat.")
		return
	army.autoExplore=not bool(army.get("autoExplore",false))
	army.path=[];army.travelClock=0.0;army.travelDuration=0.0;army.waitingForShip=false
	selected_entity="army";army_command_mode=false
	update_status("Avastaja uurib nüüd iseseisvalt tundmatut maad ja leiukohti." if army.autoExplore else "Automaatne avastamine peatatud.")

func tick_auto_explore(delta: float) -> void:
	game.autoExploreClock=float(game.get("autoExploreClock",0))+delta
	if float(game.autoExploreClock)<1.5:return
	game.autoExploreClock=0.0
	for army in game.armies:
		if int(army.team)!=0 or not army.get("autoExplore",false) or army.get("hiddenInBandV274",false) or army.get("embarked")!=null or not army.get("path",[]).is_empty() or not Discoveries.army_has_scout(game,army):continue
		var stamp: String="%s:%s:%s:%s" % [army.c,army.r,game.get("visionRevision",0),game.get("crossingRevision",0)]
		if army.get("waitingForShip",false) and army.get("waitingStamp","")==stamp:continue
		var path: Variant=Discoveries.exploration_path(game,grid,army,func(p):return army_can_traverse(p))
		if path is Array and not path.is_empty():army.path=path;army.stance="move";army.waitingForShip=false
		elif not army.get("waitingForShip",false):
			army.waitingForShip=true;army.waitingStamp=stamp
			update_status("Avastaja ootab sadamat ja transpordilaeva, et meretaguseid maid uurida.")
		else:army.waitingStamp=stamp
	for ship in game.get("ships",[]):
		if int(ship.team)==0 and ship.kind=="transport" and float(ship.hp)>0:
			NavalExploration.tick_player(game,grid,ensure_sea_distances(),army_can_traverse,merchant_land_path,territory_allocation.get("territory",{}));break

func collect_discovery(team: int,position: Dictionary) -> void:
	var result:=Discoveries.collect(game,team,position)
	if result.has("text"):
		landmark_stamp=""
		if team==0:update_status(result.text)
func army_can_traverse(p: Dictionary) -> bool:
	var c:=int(p.c);var r:=int(p.r)
	return c>=0 and c<Grid.COLS and r>=0 and r<Grid.ROWS and Geography.traversable_cell(grid[r*Grid.COLS+c],Vector2i(c,r))

func refresh_army_options() -> void:
	if army_select==null:return
	var selected_index: int=army_select.get_item_metadata(army_select.selected) if army_select.selected>=0 and army_select.item_count>0 else -1
	army_select.clear()
	for i in game.armies.size():
		var army: Dictionary=game.armies[i]
		if int(army.team)!=0 or army.get("hiddenInBandV274",false) or not army_has_units(army):continue
		var count:=0
		for unit in game.units:
			if int(unit.team)==0 and int(unit.get("armyId",0))==int(army.get("id",0)) and float(unit.get("hp",0))>0 and not ArmyExperience.is_garrisoned(unit):count+=1
		army_select.add_item("Vägi %d · %d üksust" % [int(army.get("id",0))+1,count])
		army_select.set_item_metadata(army_select.item_count-1,i)
		if i==selected_index:army_select.select(army_select.item_count-1)

func selected_army() -> Variant:
	if army_select==null or army_select.selected<0:return null
	var index:=int(army_select.get_item_metadata(army_select.selected))
	return game.armies[index] if index>=0 and index<game.armies.size() else null

func begin_army_order() -> void:
	if detail_mode or settler_mode:
		update_status("Väe sihtkoha valimiseks ava linn ja maailmakaart.")
		return
	var army: Variant=selected_army()
	if army==null:update_status("Vali esmalt oma vägi.");return
	if army.get("embarked")!=null:update_status("Maabu esmalt laevalt.");return
	selected_entity="army";army_command_mode=true
	update_status("Vali maailmakaardil väe sihtkoht.")

func order_army(destination: Vector2i) -> void:
	var army: Variant=selected_army()
	if army==null:army_command_mode=false;return
	var path: Variant=Grid.find_path(grid,Vector2i(int(army.c),int(army.r)),destination,Geography.traversable_cell)
	if path==null:update_status("Sinna ei leitud maismaateed.");return
	army.path=[]
	for cell in path:army.path.append({"c":cell.x,"r":cell.y})
	army.stance="move";army.autoExplore=false
	army_command_mode=false
	update_status("Väe teekond: %d ruutu." % army.path.size())

func selected_ship() -> Variant:
	for ship in game.get("ships",[]):
		if int(ship.team)==0 and int(ship.id)==selected_ship_id and float(ship.hp)>0:return ship
	return null

func select_ship_at(tile: Vector2i) -> bool:
	for ship in game.get("ships",[]):
		if int(ship.team)==0 and float(ship.hp)>0 and int(ship.c)==tile.x and int(ship.r)==tile.y:
			select_ship_by_id(int(ship.id));return true
	return false

func select_ship_by_id(id: int) -> void:
	selected_ship_id=id
	if selected_ship()==null:return
	selected_entity="ship";ship_command_mode=false;army_command_mode=false;settler_command_mode=false
	focus_selected_entity();update_status("Valitud "+str(Naval.SHIPS.data[selected_ship().kind].name)+".")

func begin_ship_order() -> void:
	if selected_ship()==null:update_status("Vali laev.");return
	if detail_mode:toggle_detail()
	ship_command_mode=true;army_command_mode=false;settler_command_mode=false
	update_status("Vali mereruut või maabumiseks kõrvalolev maismaa.")

func stop_selected_ship() -> void:
	if detail_inspection:return
	var ship: Variant=selected_ship()
	if ship==null:return
	ship.path=[];ship_command_mode=false;update_status("Laev peatub.")

func embark_ship(kind: String) -> void:
	var ship: Variant=selected_ship()
	if ship==null:return
	var error: String=""
	if kind=="settler":error=Naval.embark_settler(game,ship)
	else:
		var army: Variant=selected_army()
		error=Naval.embark_army(game,ship,int(army.get("id",0)) if army!=null else 0,grid)
	update_marker();update_army_markers();update_other_settler_markers()
	update_status(error if not error.is_empty() else "Reisija on laeval.")

func order_ship(destination: Vector2i) -> void:
	var ship: Variant=selected_ship()
	if ship==null:return
	var cell: Dictionary=grid[destination.y*Grid.COLS+destination.x]
	if cell.land:
		var cargo: Variant=ship.get("cargo")
		var reveal=func(team,p,radius):Campaign.reveal(game,int(team),int(p.c),int(p.r),int(radius))
		var passable=func(_team,p):return army_can_traverse(p)
		var target={"c":destination.x,"r":destination.y}
		var error: String=Naval.disembark_army(game,ship,target,grid,passable,reveal) if cargo is Dictionary and cargo.get("kind")=="army" else Naval.disembark_settler(game,ship,target,grid,passable,reveal)
		if not error.is_empty():update_status(error);return
		if cargo is Dictionary and cargo.get("kind")=="settler" and int(cargo.id)==int(settler.get("id",-1)) and (settler_mode or not city_created):player=destination
		ship_command_mode=false;refresh_fog();refresh_army_options();refresh_settler_options();update_marker();update_status("Reisija maabus.");return
	var path: Variant=Naval.sea_path(grid,ensure_sea_distances(),game.research[int(ship.team)].known,Vector2i(int(ship.c),int(ship.r)),destination)
	if path==null:update_status("Seda mereteed ei saa veel läbida. Varased laevad peavad hoiduma ranniku lähedale.");return
	ship.path=path;ship_command_mode=false;update_status("Laev sai liikumiskäsu.")

func selected_merchant() -> Variant:
	for cargo in game.get("shipments",[]):
		if int(cargo.team)==0 and int(cargo.id)==selected_merchant_id:return cargo
	return null

func select_merchant_at(tile: Vector2i) -> bool:
	for cargo in game.get("shipments",[]):
		if int(cargo.team)==0 and int(cargo.c)==tile.x and int(cargo.r)==tile.y:
			selected_merchant_id=int(cargo.id);selected_entity="merchant";army_command_mode=false;settler_command_mode=false
			var goods:=PackedStringArray()
			for key in cargo.goods:goods.append("%s %.1f" % [Economy.DATA.data.resource_names.get(key,key),float(cargo.goods[key])])
			update_status("Kaubavedu: "+", ".join(goods));return true
	return false

func select_landmark_at(tile: Vector2i) -> bool:
	if not reveal_all and not game.explored[0].has(str(tile.x)+":"+str(tile.y)):return false
	for landmark in game.get("landmarks",[]):
		if int(landmark.c)!=tile.x or int(landmark.r)!=tile.y:continue
		if landmark.kind=="village" and Discoveries.village_type(landmark)=="traders" and city_created:
			if Discoveries.trade_town(game,landmark,0).is_empty():update_status("Ükski sinu linn pole küla lähedal (22 ruutu).")
			else:game_hud.dock_menu.open_village(str(landmark.id))
		elif landmark.kind=="village":update_status("Röövlite küla.")
		else:update_status("Muistsed varemed"+(" · juba külastatud." if landmark.get("claimedBy")!=null else "."))
		return true
	return false
func select_army_at(tile: Vector2i) -> bool:
	refresh_army_options()
	for i in army_select.item_count:
		var index:=int(army_select.get_item_metadata(i))
		var army: Dictionary=game.armies[index]
		if int(army.c)==tile.x and int(army.r)==tile.y:
			select_army_for_ui(i)
			return true
	return false
func select_army_for_ui(index: int) -> void:
	if index<0 or index>=army_select.item_count:return
	army_select.select(index)
	if detail_mode:toggle_detail()
	if settler_mode:switch_city(city_select.selected)
	selected_entity="army";army_command_mode=false
	focus_selected_entity()
	update_status("Vägi valitud.")

func focus_selected_entity() -> void:
	if detail_mode:
		if selected_entity=="detail_unit" and detail_root!=null:
			var travellers:Variant=detail_root.get_node_or_null("DetailTravellers")
			var entry:Variant=travellers.entries.get("unit:%d" % detail_unit_source) if travellers!=null else null
			if entry!=null:camera_target=Vector3(entry.root.position.x,0,entry.root.position.z)
		elif detail_inspection and detail_district.is_empty():camera_target=Vector3.ZERO
		elif city_created and not settler_mode:
			var buildings: Array=current_build_context().economy.buildings
			var target: Dictionary=buildings[selected_building_index] if selected_entity=="building" and selected_building_index>=0 and selected_building_index<buildings.size() else buildings[0]
			camera_target=Vector3(target.x,0,target.z)
		else:camera_target=Vector3(float(settler.get("x",0)),0,float(settler.get("z",0)))
		update_camera();return
	var position:=player
	if selected_entity=="army":
		var army: Variant=selected_army()
		if army!=null:position=Vector2i(int(army.c),int(army.r))
	elif selected_entity=="ship":
		var ship: Variant=selected_ship()
		if ship!=null:position=Vector2i(int(ship.c),int(ship.r))
	elif selected_entity=="merchant":
		var cargo: Variant=selected_merchant()
		if cargo!=null:position=Vector2i(int(cargo.c),int(cargo.r))
	camera_target=cell_position(position)+Vector3(CELL_SIZE/2.0,0,CELL_SIZE/2.0);world_camera_target=camera_target
	update_camera()

func begin_settler_order() -> void:
	if detail_inspection or (city_created and not settler_mode):return
	selected_entity="settler";settler_command_mode=true;army_command_mode=false
	update_status("Vali asuniku liikumise sihtkoht.")

func stop_selected_settler() -> void:
	if detail_inspection or (city_created and not settler_mode):return
	settler.path=[];settler.localTarget=null;settler.travelClock=0.0;settler.travelDuration=0.0;settler_command_mode=false
	update_status("Asunik peatub.")
func stop_selected_army() -> void:
	if detail_inspection:return
	var army: Variant=selected_army()
	if army==null:return
	army.path=[];army.autoExplore=false;army_command_mode=false
	update_status("Vägi peatub.")

func update_other_settler_markers() -> void:
	if other_settler_root==null:return
	other_settler_root.visible=not detail_mode
	if detail_mode:return
	var active: Dictionary={}
	for person in game.get("settlers",[]):
		if person.get("embarked")!=null:continue
		if int(person.team)!=0 and not Campaign.visible_now(game,0,person):continue
		if int(person.team)==0 and (not city_created or settler_mode) and int(person.id)==int(settler.get("id",-1)):continue
		var id:=str(int(person.id));active[id]=true
		if not other_settler_markers.has(id):
			var icon:=MeshInstance3D.new()
			WorldMarkerModels.add_people(icon,"settler",int(person.team))
			other_settler_root.add_child(icon);other_settler_markers[id]=icon
		var position:=cell_position(Vector2i(int(person.c),int(person.r)))
		if not person.get("path",[]).is_empty() and float(person.get("travelDuration",0))>0:
			var next: Dictionary=person.path[0]
			position=position.lerp(cell_position(Vector2i(int(next.c),int(next.r))),clampf(float(person.get("travelClock",0))/float(person.travelDuration),0,1))
		var icon: MeshInstance3D=other_settler_markers[id]
		icon.position=position+Vector3(1,world_marker_height(position+Vector3(1,0,1)),1)
		WorldMarkerModels.animate(icon,elapsed,not person.get("path",[]).is_empty())
	for id in other_settler_markers.keys():
		if not active.has(id):other_settler_markers[id].queue_free();other_settler_markers.erase(id)

func update_city_markers() -> void:
	if city_marker_root==null:return
	city_marker_root.visible=not game.get("cities",[]).is_empty() and not detail_mode
	if not city_marker_root.visible:return
	var active: Dictionary={};var towns_changed: Array=[]
	for city in game.cities:
		var key:=str(int(city.id));var tile:=str(int(city.c))+":"+str(int(city.r))
		if int(city.team)!=0 and not Campaign.visible_now(game,0,city):continue
		active[key]=true
		var upgrade:=Production.upgrade_level(game,int(city.team))
		if not city_markers.has(key):
			towns_changed.append(Vector2i(int(city.c),int(city.r)))
			var icon:=MeshInstance3D.new()
			WorldMarkerModels.add_city(icon,str(city.name),int(city.team),upgrade)
			icon.set_meta("age",upgrade);icon.set_meta("team",int(city.team))
			city_marker_root.add_child(icon);city_markers[key]=icon
		var icon: MeshInstance3D=city_markers[key]
		if int(icon.get_meta("age",-1))!=upgrade or int(icon.get_meta("team",-1))!=int(city.team):
			towns_changed.append(Vector2i(int(city.c),int(city.r)))
			for child in icon.get_children():icon.remove_child(child);child.queue_free()
			WorldMarkerModels.add_city(icon,str(city.name),int(city.team),upgrade)
			icon.set_meta("age",upgrade);icon.set_meta("team",int(city.team));icon.set_meta("town_stamp","")
		var city_label:=icon.get_node_or_null("CityName") as Label3D
		if city_label!=null:city_label.text=str(city.name)+" · "+str(floori(float(city.economy.realms[city.team].pop)))
		var city_model:=icon.get_node_or_null("CityModel") as MeshInstance3D
		var city_pos:=cell_position(Vector2i(int(city.c),int(city.r)))+Vector3(1,0,1)
		icon.set_meta("tile",Vector2i(int(city.c),int(city.r)))
		icon.position=city_pos+Vector3(0,world_marker_height(city_pos),0)
		if city_model!=null:
			city_model.visible=upgrade>0
			city_model.scale=Vector3.ONE*(0.04*(1.0+minf(1.2,float(city.economy.realms[city.team].pop)/40.0)))
		if upgrade==0:
			var town_stamp:=WorldCityLayout.stamp(city.economy.buildings)
			if str(icon.get_meta("town_stamp",""))!=town_stamp:
				towns_changed.append(Vector2i(int(city.c),int(city.r)))
				var old:=icon.get_node_or_null("TownBuildings")
				if old!=null:icon.remove_child(old);old.queue_free()
				icon.add_child(WorldCityLayout.build(city.economy.buildings,city_pos,world_marker_height));icon.set_meta("town_stamp",town_stamp)
	# A developed district has its own world-map building, as in worldSync.
	for city in game.cities:
		if int(city.team)!=0 and not Campaign.visible_now(game,0,city):continue
		for district in city.get("districts",{}).values():
			var first: Variant=null
			for building in district.economy.buildings:
				if not building.get("virtual",false):first=building;break
			if first==null:continue
			var at:=Vector2i(int(district.c),int(district.r));var key:="region:%d:%d:%d" % [int(city.id),at.x,at.y]
			active[key]=true
			var age:=maxi(Production.upgrade_level(game,int(city.team)),int(CityRules.DATA.data.age.get(first.type,0)))
			var stamp:="%s:%s:%s" % [first.type,age,city.team]
			if not city_markers.has(key):
				var icon:=MeshInstance3D.new();city_marker_root.add_child(icon);city_markers[key]=icon;towns_changed.append(at)
			var icon:MeshInstance3D=city_markers[key]
			if str(icon.get_meta("district_stamp",""))!=stamp:
				for child in icon.get_children():icon.remove_child(child);child.queue_free()
				var factory:=DetailView.new();var visual:Node3D=factory.create_designed_building(str(first.type),age);factory.free()
				if visual!=null:visual.scale=Vector3.ONE*0.1;icon.add_child(visual)
				icon.set_meta("district_stamp",stamp)
			var position:=cell_position(at)+Vector3(1,0,1);icon.position=position+Vector3(0,world_marker_height(position),0);icon.set_meta("tile",at)
	for key in city_markers.keys():
		if not active.has(key):
			towns_changed.append(city_markers[key].get_meta("tile",Vector2i(-100,-100)))
			city_markers[key].queue_free();city_markers.erase(key)
	if not towns_changed.is_empty() and world_vegetation!=null:world_vegetation.invalidate_towns(towns_changed)

func update_landmark_markers() -> void:
	if landmark_root==null:return
	landmark_root.visible=not detail_mode
	if detail_mode:return
	var parts: Array[String]=[]
	for landmark in game.get("landmarks",[]):parts.append(str(landmark.id)+":"+str(landmark.get("claimedBy")))
	for city in game.get("cities",[]):parts.append("city:%s:%s:%s:%s" % [city.id,city.team,city.c,city.r])
	var stamp: String=str(game.seed)+":"+str(game.get("visionRevision",0))+":"+str(reveal_all)+":"+str(game.ages)+":"+"|".join(parts)
	if stamp==landmark_stamp:return
	landmark_stamp=stamp
	var active: Dictionary={};var towns_changed: Array=[]
	for landmark in game.get("landmarks",[]):
		var tile:=str(int(landmark.c))+":"+str(int(landmark.r))
		if not reveal_all and not game.explored[0].has(tile):continue
		var key: String=str(landmark.id);active[key]=true
		var age:=Discoveries.village_age(game,landmark) if landmark.kind=="village" else -1
		if not landmark_markers.has(key):
			if age==0:towns_changed.append(Vector2i(int(landmark.c),int(landmark.r)))
			var icon:=Node3D.new()
			WorldMarkerModels.add_landmark(icon,landmark,age!=0);icon.set_meta("age",age)
			landmark_root.add_child(icon);landmark_markers[key]=icon
		var icon: Node3D=landmark_markers[key]
		icon.set_meta("tile",Vector2i(int(landmark.c),int(landmark.r)))
		var position:=cell_position(Vector2i(int(landmark.c),int(landmark.r)))+Vector3(1,0,1)
		if int(icon.get_meta("age",-2))!=age:
			towns_changed.append(Vector2i(int(landmark.c),int(landmark.r)))
			for child in icon.get_children():icon.remove_child(child);child.queue_free()
			WorldMarkerModels.add_landmark(icon,landmark,age!=0);icon.set_meta("age",age)
		if age==0 and icon.get_node_or_null("TownBuildings")==null:icon.add_child(WorldCityLayout.build(Discoveries.village_layout(landmark),position,world_marker_height))
		icon.position=position+Vector3(0,world_marker_height(position),0)
		icon.scale=Vector3.ONE*(0.76 if landmark.get("claimedBy")!=null else 1.0)
	for key in landmark_markers.keys():
		if not active.has(key):
			towns_changed.append(landmark_markers[key].get_meta("tile",Vector2i(-100,-100)))
			landmark_markers[key].queue_free();landmark_markers.erase(key)
	if not towns_changed.is_empty() and world_vegetation!=null:world_vegetation.invalidate_towns(towns_changed)
	update_landmark_glow()

func update_landmark_glow() -> void:
	var hour:=fposmod(8.0+elapsed/60.0,24.0)
	var elevation:=sin((hour-6.0)*PI/12.0)
	var daylight:=clampf((elevation+0.09)/0.52,0,1)
	var torch:=clampf((0.4-daylight)/0.36,0,1)
	for key in landmark_markers:
		var icon: Node3D=landmark_markers[key]
		var glow:=icon.get_node_or_null("VillageGlow") as Sprite3D
		if glow==null:continue
		glow.visible=torch>0.02
		var tile: Vector2i=icon.get_meta("tile",Vector2i.ZERO)
		glow.modulate=Color(1.0,0.70,0.36,minf(0.9,torch*0.85*(0.9+0.1*sin(elapsed*3.1+tile.x))))
func merchant_land_path(from: Dictionary,to: Dictionary,team: int) -> Variant:
	var key: String="%s:%s:%s:%s:%s:%s" % [game.seed,game.get("crossingRevision",0),team,from.c,from.r,str(to.c)+":"+str(to.r)]
	if merchant_path_cache.has(key):return merchant_path_cache[key].path.duplicate(true) if merchant_path_cache[key].found else null
	var cells: Variant=Grid.find_path(grid,Vector2i(int(from.c),int(from.r)),Vector2i(int(to.c),int(to.r)),Geography.traversable_cell)
	if cells==null:merchant_path_cache[key]={"found":false};return null
	var path: Array=[]
	for cell in cells:path.append({"c":cell.x,"r":cell.y})
	merchant_path_cache[key]={"found":true,"path":path}
	return path.duplicate(true)

func update_ship_markers() -> void:
	if ship_root==null:return
	ship_root.visible=not detail_mode
	if detail_mode:return
	var active: Dictionary={}
	for ship in game.get("ships",[]):
		if float(ship.hp)<=0 or (int(ship.team)!=0 and not Campaign.visible_now(game,0,ship)):continue
		var key:=str(int(ship.id));active[key]=true
		var upgrade:=int(ship.get("upgrade",0))
		if not ship_markers.has(key):
			var icon:=Node3D.new();WorldMarkerModels.add_ship(icon,ship.kind,int(ship.team),upgrade);icon.set_meta("upgrade",upgrade);icon.set_meta("kind",ship.kind);icon.set_meta("team",int(ship.team));ship_root.add_child(icon);ship_markers[key]=icon
		var icon: Node3D=ship_markers[key]
		if int(icon.get_meta("upgrade",0))!=upgrade or str(icon.get_meta("kind",""))!=str(ship.kind) or int(icon.get_meta("team",-1))!=int(ship.team):
			for child in icon.get_children():icon.remove_child(child);child.queue_free()
			WorldMarkerModels.add_ship(icon,ship.kind,int(ship.team),upgrade);icon.set_meta("upgrade",upgrade);icon.set_meta("kind",ship.kind);icon.set_meta("team",int(ship.team))
		var p:=cell_position(Vector2i(int(ship.c),int(ship.r)))+Vector3(1,0.1,1)
		if not ship.path.is_empty():
			var next: Dictionary=ship.path[0]
			var target:=cell_position(Vector2i(int(next.c),int(next.r)))+Vector3(1,0.1,1)
			var direction:=target-p
			if direction.length_squared()>0.001:icon.rotation.y=atan2(direction.x,direction.z)
			p=p.lerp(target,clampf(float(ship.get("clock",0))/3.0,0.0,1.0))
		p.y+=sin(elapsed*1.6+float(ship.id))*0.018
		icon.position=p
	for key in ship_markers.keys():
		if not active.has(key):ship_markers[key].queue_free();ship_markers.erase(key)

func update_merchant_markers() -> void:
	if merchant_root==null:return
	merchant_root.visible=not detail_mode
	if detail_mode:return
	var active: Dictionary={}
	for cargo in game.get("shipments",[]):
		if int(cargo.team)!=0 and not Campaign.visible_now(game,0,cargo):continue
		var key:=str(int(cargo.id));active[key]=true
		if not merchant_markers.has(key):
			var icon:=Node3D.new();icon.set_meta("mode","");icon.set_meta("team",-1);merchant_root.add_child(icon);merchant_markers[key]=icon
		var icon: Node3D=merchant_markers[key]
		var mode: String=cargo.get("mode","road")
		if str(icon.get_meta("mode",""))!=mode or int(icon.get_meta("team",-1))!=int(cargo.team):
			for child in icon.get_children():icon.remove_child(child);child.queue_free()
			if mode=="sea":WorldMarkerModels.add_ship(icon,"transport",int(cargo.team),Production.upgrade_level(game,int(cargo.team)))
			elif mode in ["rail","air"]:WorldMarkerModels.add_freight(icon,mode,int(cargo.team))
			else:WorldMarkerModels.add_people(icon,"caravan",int(cargo.team))
			icon.set_meta("mode",mode);icon.set_meta("team",int(cargo.team))
		var position:=cell_position(Vector2i(int(cargo.c),int(cargo.r)))
		if mode=="air" and cargo.get("flightPosition") is Dictionary:
			position=Vector3((float(cargo.flightPosition.c)-Grid.COLS/2.0)*CELL_SIZE,0,(float(cargo.flightPosition.r)-Grid.ROWS/2.0)*CELL_SIZE)
			icon.rotation.y=float(cargo.get("flightHeading",0))
		if not cargo.path.is_empty() and float(cargo.get("travelDuration",0))>0:
			var next: Dictionary=cargo.path[0]
			position=position.lerp(cell_position(Vector2i(int(next.c),int(next.r))),clampf(float(cargo.get("travelClock",0))/float(cargo.travelDuration),0,1))
		position+=Vector3(1,0,1);position.y=world_marker_height(position)+(2.6 if mode=="air" else 0.0)
		icon.position=position
		if mode!="sea":WorldMarkerModels.animate(icon,elapsed,not cargo.path.is_empty())
	for key in merchant_markers.keys():
		if not active.has(key):merchant_markers[key].queue_free();merchant_markers.erase(key)

func update_raid_markers() -> void:
	if raid_root==null:return
	raid_root.visible=not detail_mode
	if detail_mode:return
	var active: Dictionary={}
	for raid in game.get("raidsV276",[]):
		var p:=Raids.position(game,raid)
		if p.is_empty():continue
		var tile:=str(floori(float(p.c)+0.5))+":"+str(floori(float(p.r)+0.5))
		if not reveal_all and not game.explored[0].has(tile):continue
		var key:=str(raid.id);active[key]=true
		if not raid_markers.has(key):
			var icon:=Node3D.new();WorldMarkerModels.add_people(icon,"army",1);raid_root.add_child(icon);raid_markers[key]=icon
		var world_pos:=Vector3((float(p.c)-Grid.COLS/2.0)*CELL_SIZE+1,0,(float(p.r)-Grid.ROWS/2.0)*CELL_SIZE+1)
		world_pos.y=world_marker_height(world_pos)
		var icon: Node3D=raid_markers[key];icon.position=world_pos;icon.rotation.y=float(p.heading)
		WorldMarkerModels.animate(icon,elapsed,true)
	for key in raid_markers.keys():
		if not active.has(key):raid_markers[key].queue_free();raid_markers.erase(key)

func update_army_markers() -> void:
	if army_root==null:return
	army_root.visible=not detail_mode
	if not army_root.visible:return
	var active: Dictionary={}
	for i in game.armies.size():
		var army: Dictionary=game.armies[i]
		if army.get("embarked")!=null or army.get("hiddenInBandV274",false) or not army_has_units(army):continue
		if int(army.team)!=0 and not Campaign.visible_now(game,0,army):continue
		active[i]=true
		var scout_only:=true
		for unit in game.units:
			if int(unit.team)==int(army.team) and int(unit.get("armyId",0))==int(army.get("id",0)) and float(unit.get("hp",0))>0 and not ArmyExperience.is_garrisoned(unit) and unit.kind!="scout":scout_only=false;break
		var kind: String="scout" if scout_only else "army"
		var upgrade:=Production.upgrade_level(game,int(army.team))
		if not army_markers.has(i):
			var icon:=MeshInstance3D.new()
			WorldMarkerModels.add_people(icon,kind,int(army.team),upgrade);icon.set_meta("kind",kind);icon.set_meta("upgrade",upgrade)
			army_root.add_child(icon);army_markers[i]=icon
		var pos:=cell_position(Vector2i(int(army.c),int(army.r)))
		if not army.path.is_empty() and float(army.get("travelDuration",0))>0:
			var next: Dictionary=army.path[0]
			pos=pos.lerp(cell_position(Vector2i(int(next.c),int(next.r))),clampf(float(army.get("travelClock",0))/float(army.travelDuration),0,1))
		elif army.get("scoutDetailPoseV240") is Dictionary:
			var scout_pose:Dictionary=army.scoutDetailPoseV240
			if int(scout_pose.get("c",-1))==int(army.c) and int(scout_pose.get("r",-1))==int(army.r):pos+=Vector3(float(scout_pose.x)*CELL_SIZE/225.0,0,float(scout_pose.z)*CELL_SIZE/195.0)
		var icon: MeshInstance3D=army_markers[i]
		if str(icon.get_meta("kind",""))!=kind or int(icon.get_meta("upgrade",-1))!=upgrade:
			for child in icon.get_children():icon.remove_child(child);child.queue_free()
			WorldMarkerModels.add_people(icon,kind,int(army.team),upgrade);icon.set_meta("kind",kind);icon.set_meta("upgrade",upgrade)
		var world_pos:=pos+Vector3(CELL_SIZE/2,0,CELL_SIZE/2)
		icon.position=world_pos+Vector3(0,world_marker_height(world_pos),0)
		if not army.path.is_empty():
			var next: Dictionary=army.path[0]
			var goal:=cell_position(Vector2i(int(next.c),int(next.r)))+Vector3(CELL_SIZE/2,0,CELL_SIZE/2)
			var direction:=goal-world_pos
			if direction.length_squared()>0.0001:icon.rotation.y=atan2(direction.x,direction.z)
		WorldMarkerModels.animate(icon,elapsed,not army.path.is_empty())
	for index in army_markers.keys():
		if not active.has(index):army_markers[index].queue_free();army_markers.erase(index)

func update_marker() -> void:
	marker.visible=not detail_mode and settler.get("embarked")==null and (not city_created or settler_mode)
	var pos := cell_position(player)
	if not settler.path.is_empty() and settler.travelDuration > 0.0:
		var next: Dictionary = settler.path[0]
		var destination := Vector2i(int(next.c), int(next.r))
		pos = pos.lerp(cell_position(destination), clampf(settler.travelClock / settler.travelDuration, 0.0, 1.0))
	var world_pos:=pos+Vector3(CELL_SIZE/2,0,CELL_SIZE/2)
	marker.position=world_pos+Vector3(0,world_marker_height(world_pos)+0.06,0)
	WorldMarkerModels.animate(marker,elapsed,not settler.path.is_empty())

func world_marker_height(position: Vector3) -> float:
	if world_mesh_samples.is_empty():return 0.0
	var x:=position.x/0.04+Grid.WORLD_CENTER_X
	var z:=position.z/0.04+Grid.WORLD_CENTER_Z
	return WorldTerrain.mesh_elevation(world_mesh_samples,x,z)+0.03

func build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_TOP_LEFT)
	panel.offset_left = 15
	panel.offset_top = 15
	panel.offset_right = 445
	panel.offset_bottom = -15
	layer.add_child(panel)
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	panel.add_child(scroll)
	var box := VBoxContainer.new()
	box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(box)
	var minimap := Control.new()
	minimap.set_script(WorldMinimap)
	minimap.host = self
	minimap.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	minimap.offset_left = -250
	minimap.offset_top = -195
	minimap.offset_right = -15
	minimap.offset_bottom = -18
	layer.add_child(minimap)
	var title := Label.new()
	title.text = "KUNINGRIIGID"
	title.add_theme_font_size_override("font_size", 20)
	box.add_child(title)
	var hint := Label.new()
	hint.text = "Rullik: suum · parem hiir: liiguta · vasak: vali"
	box.add_child(hint)
	status = Label.new()
	status.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	status.custom_minimum_size.x = 380
	box.add_child(status)
	var seed_row := HBoxContainer.new()
	box.add_child(seed_row)
	seed_input = LineEdit.new()
	seed_input.text = ""
	seed_input.placeholder_text = "Maailma seeme"
	seed_input.custom_minimum_size.x = 220
	seed_row.add_child(seed_input)
	generate_button = Button.new()
	generate_button.text = "Loo uus maailm"
	generate_button.pressed.connect(start_generation)
	seed_row.add_child(generate_button)
	var tempo_row:=HBoxContainer.new()
	box.add_child(tempo_row)
	var tempo_label:=Label.new()
	tempo_label.text="Uue maailma tempo: "
	tempo_row.add_child(tempo_label)
	tempo_select=OptionButton.new()
	for item in [["Kiire","fast"],["Tavaline","normal"],["Eepiline","epic"]]:
		tempo_select.add_item(item[0])
		tempo_select.set_item_metadata(tempo_select.item_count-1,item[1])
	tempo_select.select(1)
	tempo_row.add_child(tempo_select)
	detail_button = Button.new()
	detail_button.text = "Ava asuniku detailkaart"
	detail_button.pressed.connect(toggle_detail)
	box.add_child(detail_button)
	found_button = Button.new()
	found_button.text = "Vali linnakoht"
	found_button.visible = false
	found_button.pressed.connect(select_city_site)
	box.add_child(found_button)
	var world_actions:=HBoxContainer.new()
	box.add_child(world_actions)
	fog_button = Button.new()
	fog_button.text = "Peida avastamata ala" if reveal_all else "Näita kogu kaarti"
	fog_button.pressed.connect(toggle_fog)
	world_actions.add_child(fog_button)
	simulation_pause_button=Button.new()
	simulation_pause_button.text="Peata mäng"
	simulation_pause_button.pressed.connect(toggle_simulation_pause)
	world_actions.add_child(simulation_pause_button)
	research_row = VBoxContainer.new()
	research_row.visible = false
	box.add_child(research_row)
	var research_primary:=HBoxContainer.new()
	research_row.add_child(research_primary)
	research_select = OptionButton.new()
	research_select.custom_minimum_size.x = 220
	research_primary.add_child(research_select)
	var research_button := Button.new()
	research_button.text = "Alusta uurimist"
	research_button.pressed.connect(begin_research)
	research_primary.add_child(research_button)
	var research_actions:=HBoxContainer.new()
	research_row.add_child(research_actions)
	var queue_button := Button.new()
	queue_button.text = "Lisa järjekorda"
	queue_button.pressed.connect(queue_selected_research)
	research_actions.add_child(queue_button)
	var pause_research_button := Button.new()
	pause_research_button.text = "Peata / jätka"
	pause_research_button.pressed.connect(toggle_research_pause)
	research_actions.add_child(pause_research_button)
	var labor_button:=Button.new()
	labor_button.text="Korjajad"
	labor_button.pressed.connect(show_basic_labor)
	research_actions.add_child(labor_button)
	var military_button:=Button.new()
	military_button.text="Värbamine"
	military_button.pressed.connect(show_training)
	research_actions.add_child(military_button)
	training_dialog=AcceptDialog.new()
	training_dialog.title="Üksuste väljaõpe"
	add_child(training_dialog);style_game_dialog(training_dialog)
	var training_box:=VBoxContainer.new()
	training_box.custom_minimum_size=Vector2(390,0)
	training_dialog.add_child(training_box)
	unit_select=OptionButton.new()
	for kind in Economy.DATA.data.troops:
		var unit: Dictionary=Economy.DATA.data.troops[kind]
		if kind in ["militia","transport","warship"] or not unit.has("time"):continue
		unit_select.add_item(unit.name)
		unit_select.set_item_metadata(unit_select.item_count-1,kind)
	for kind in ["transport","warship"]:
		unit_select.add_item(Naval.SHIPS.data[kind].name);unit_select.set_item_metadata(unit_select.item_count-1,kind)
	training_box.add_child(unit_select)
	grade_select=OptionButton.new()
	for grade in ["mobilized","standard","elite"]:
		grade_select.add_item(Recruitment.GRADES[grade].name)
		grade_select.set_item_metadata(grade_select.item_count-1,grade)
	grade_select.select(1);training_box.add_child(grade_select)
	recruitment_info=Label.new()
	recruitment_info.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	training_box.add_child(recruitment_info)
	unit_select.item_selected.connect(func(_index):refresh_recruitment_info())
	grade_select.item_selected.connect(func(_index):refresh_recruitment_info())
	var recruit_button:=Button.new()
	recruit_button.text="Lisa väljaõppesse"
	recruit_button.pressed.connect(queue_selected_unit)
	training_box.add_child(recruit_button)
	retrain_select=OptionButton.new();retrain_select.size_flags_horizontal=Control.SIZE_EXPAND_FILL;training_box.add_child(retrain_select)
	var retrain_button:=Button.new();retrain_button.text="Õpeta valitud üksus ümber";retrain_button.pressed.connect(retrain_selected_unit);training_box.add_child(retrain_button)
	training_status=Label.new()
	training_status.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	training_box.add_child(training_status)
	labor_dialog=AcceptDialog.new()
	labor_dialog.title="Linna tööjõud"
	add_child(labor_dialog);style_game_dialog(labor_dialog)
	labor_scroll=ScrollContainer.new();labor_scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED
	labor_scroll.custom_minimum_size=Vector2(390,330);labor_dialog.add_child(labor_scroll)
	var labor_box:=VBoxContainer.new();labor_box.size_flags_horizontal=Control.SIZE_EXPAND_FILL;labor_box.add_theme_constant_override("separation",8);labor_scroll.add_child(labor_box)
	var labor_bold:=SystemFont.new();labor_bold.font_names=PackedStringArray(["Georgia","Times New Roman","serif"]);labor_bold.font_weight=700
	var summary_grid:=GridContainer.new();summary_grid.columns=3;summary_grid.add_theme_constant_override("h_separation",6);summary_grid.add_theme_constant_override("v_separation",6);labor_box.add_child(summary_grid)
	for spec in [["workers","⚒ Töötavad"],["bread","🍞 Leib"],["grain","🌾 Vili"],["wood","🪵 Puit"],["stone","◆ Kivi"],["science","⚗ Teadus"]]:
		var summary_panel:=PanelContainer.new();summary_panel.size_flags_horizontal=Control.SIZE_EXPAND_FILL
		var summary_style:=StyleBoxFlat.new();summary_style.bg_color=Color("102132");summary_style.border_color=Color(0.70,0.56,0.29,0.25);summary_style.set_border_width_all(1);summary_style.set_corner_radius_all(7)
		summary_style.content_margin_left=7;summary_style.content_margin_right=7;summary_style.content_margin_top=5;summary_style.content_margin_bottom=5;summary_panel.add_theme_stylebox_override("panel",summary_style);summary_grid.add_child(summary_panel)
		var column:=VBoxContainer.new();column.add_theme_constant_override("separation",1);summary_panel.add_child(column)
		var card_title:=Label.new();card_title.text=spec[1];card_title.add_theme_font_size_override("font_size",10);card_title.add_theme_color_override("font_color",Color("c9bc9e"));column.add_child(card_title)
		var card_value:=Label.new();card_value.add_theme_font_size_override("font_size",14);card_value.add_theme_font_override("font",labor_bold);column.add_child(card_value)
		var card_sub:=Label.new();card_sub.add_theme_font_size_override("font_size",9);card_sub.add_theme_color_override("font_color",Color("b5bfbf"));column.add_child(card_sub)
		labor_summary_cards[spec[0]]={"value":card_value,"sub":card_sub}
	labor_summary=Label.new();labor_summary.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;labor_box.add_child(labor_summary)
	var builder_row:=HBoxContainer.new();labor_box.add_child(builder_row)
	var builder_label:=Label.new();builder_label.text="⚒ Ehitajad";builder_label.size_flags_horizontal=Control.SIZE_EXPAND_FILL;builder_row.add_child(builder_label)
	labor_builder_limit=SpinBox.new();labor_builder_limit.min_value=0;labor_builder_limit.step=0.01;labor_builder_limit.custom_arrow_step=0.25;labor_builder_limit.custom_minimum_size.x=88
	labor_builder_limit.value_changed.connect(change_builder_limit);builder_row.add_child(labor_builder_limit)
	labor_builder_status=Label.new();labor_builder_status.custom_minimum_size.x=85;builder_row.add_child(labor_builder_status)
	var work_title:=Label.new();work_title.text="Tööhooned";labor_box.add_child(work_title)
	labor_workplaces=VBoxContainer.new();labor_box.add_child(labor_workplaces)
	labor_training_row=HBoxContainer.new();labor_box.add_child(labor_training_row)
	var training_title:=Label.new();training_title.text="⚔ Väljaõpe";training_title.size_flags_horizontal=Control.SIZE_EXPAND_FILL;labor_training_row.add_child(training_title)
	labor_training_limit=SpinBox.new();labor_training_limit.min_value=0;labor_training_limit.max_value=1;labor_training_limit.step=0.01;labor_training_limit.custom_arrow_step=0.25;labor_training_limit.custom_minimum_size.x=88
	labor_training_limit.value_changed.connect(change_training_labor);labor_training_row.add_child(labor_training_limit)
	labor_training_status=Label.new();labor_training_status.custom_minimum_size.x=85;labor_training_row.add_child(labor_training_status)
	var gathering_title:=Label.new();gathering_title.text="Korjamine ilma tööhooneta";labor_box.add_child(gathering_title)
	var explanation:=Label.new();explanation.text="Ülejäänud tööjõud korjab aeglaselt. Toidu- või veepuuduses on elutähtsad tööd esikohal.";explanation.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;labor_box.add_child(explanation)
	for key in ["berries","wood","stone"]:
		var row:=HBoxContainer.new()
		labor_box.add_child(row)
		var job_title:=Label.new()
		job_title.text={"berries":"Marjad","wood":"Puit","stone":"Kivi"}[key]
		job_title.custom_minimum_size.x=90
		row.add_child(job_title)
		var limit:=SpinBox.new()
		limit.min_value=0;limit.step=0.01;limit.custom_arrow_step=0.25;limit.custom_minimum_size.x=90
		limit.value_changed.connect(change_basic_labor.bind(key))
		row.add_child(limit);basic_job_limits[key]=limit
		var assigned:=Label.new()
		row.add_child(assigned);basic_job_status[key]=assigned
	research_label = Label.new()
	research_label.visible = false
	research_label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	research_label.custom_minimum_size.x=380
	box.add_child(research_label)
	var resources_row:=HBoxContainer.new()
	box.add_child(resources_row)
	resources_label = Label.new()
	resources_label.visible = false
	resources_row.add_child(resources_label)
	resources_button=Button.new()
	resources_button.text="Varud"
	resources_button.visible=false
	resources_button.pressed.connect(show_resource_details)
	resources_row.add_child(resources_button)
	resources_dialog=AcceptDialog.new()
	resources_dialog.title="Linna varud"
	resources_dialog.min_size=Vector2i(400,420)
	add_child(resources_dialog);style_game_dialog(resources_dialog)
	resources_detail=RichTextLabel.new()
	resources_detail.custom_minimum_size=Vector2(360,350)
	resources_dialog.add_child(resources_detail)
	city_row=HBoxContainer.new()
	city_row.visible=false
	box.add_child(city_row)
	var city_label:=Label.new();city_label.text="Linn: ";city_row.add_child(city_label)
	city_select=OptionButton.new();city_select.custom_minimum_size.x=200
	city_select.item_selected.connect(switch_city)
	city_row.add_child(city_select)
	var open_city:=Button.new();open_city.text="Ava linn"
	open_city.pressed.connect(func():switch_city(city_select.selected))
	city_row.add_child(open_city)
	settler_row=HBoxContainer.new();settler_row.visible=false;box.add_child(settler_row)
	settler_select=OptionButton.new();settler_select.custom_minimum_size.x=150
	settler_row.add_child(settler_select)
	settler_choose_button=Button.new();settler_choose_button.text="Vali asunik"
	settler_choose_button.pressed.connect(select_owned_settler)
	settler_row.add_child(settler_choose_button)
	var recruit_settler_button:=Button.new();recruit_settler_button.text="Värba asunik"
	recruit_settler_button.pressed.connect(recruit_new_settler)
	settler_row.add_child(recruit_settler_button)
	army_row=HBoxContainer.new()
	army_row.visible=false
	box.add_child(army_row)
	army_select=OptionButton.new()
	army_select.custom_minimum_size.x=165
	army_row.add_child(army_select)
	var army_move_button:=Button.new()
	army_move_button.text="Vali väe siht"
	army_move_button.pressed.connect(begin_army_order)
	army_row.add_child(army_move_button)
	var army_stop_button:=Button.new()
	army_stop_button.text="Peata vägi"
	army_stop_button.pressed.connect(stop_selected_army)
	army_row.add_child(army_stop_button)
	build_row = VBoxContainer.new()
	build_row.visible = false
	box.add_child(build_row)
	var build_primary:=HBoxContainer.new()
	build_row.add_child(build_primary)
	build_select = OptionButton.new()
	build_select.custom_minimum_size.x = 220
	for type in ["lumber","house","quarry","hunter","fisher","well","study","farm","field","saw","mill","bakery","warehouse","cellar","forester","claypit","coppermine","tinmine","mine","gem_mine","pottery_kiln","mason","bronze_foundry","cartwright","road_depot","coal","smelter","smith","scriptorium","library","academy","vegetable_garden","orchard","dairy","spice_garden","coffee_farm","flax_farm","silk_farm","dye_garden","cocoa_farm","rubber_farm","weaver","jeweler","silk_weaver","perfumery","chocolatier","electronics_factory","barracks","archery","harbor","market","pasture","school","university","monastery","chapel","observatory","public_school","high_school","polytechnic","laboratory","printer","nitrate","powdermill","steelworks","engineworks","oilwell","refinery","powerplant","autofactory","watermill","windmill","guildhall","master_workshop","armor_workshop","infirmary","trade_yard","inn","railstation","airfield","stable","crossbow_range","siegeworkshop","bridge","palisade","stonewall","reinforced_wall","woodgate","gatehouse","watchtower","stonetower","keep"]:
		var label: String=Economy.DATA.data.buildings[type].name
		build_select.add_item(label)
		build_select.set_item_metadata(build_select.item_count-1,type)
	build_primary.add_child(build_select)
	var build_button := Button.new()
	build_button.text = "Ehita valitud kohale"
	build_button.pressed.connect(place_city_building)
	build_primary.add_child(build_button)
	build_info=Label.new()
	build_info.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	build_info.custom_minimum_size.x=380
	build_row.add_child(build_info)
	field_width=SpinBox.new();field_width.min_value=8;field_width.max_value=64;field_width.step=2;field_width.value=16;field_width.prefix="Laius ";field_width.visible=false
	field_depth=SpinBox.new();field_depth.min_value=8;field_depth.max_value=64;field_depth.step=2;field_depth.value=16;field_depth.prefix="Sügavus ";field_depth.visible=false
	field_width.custom_minimum_size.x=135;field_depth.custom_minimum_size.x=145
	var field_controls:=HBoxContainer.new()
	build_row.add_child(field_controls)
	field_controls.add_child(field_width);field_controls.add_child(field_depth)
	build_select.item_selected.connect(update_field_controls)
	refresh_build_info()
	selected_building_row=HBoxContainer.new()
	selected_building_row.visible=false
	build_row.add_child(selected_building_row)
	selected_building_label=Label.new()
	selected_building_label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	selected_building_label.custom_minimum_size.x=220
	selected_building_row.add_child(selected_building_label)
	selected_worker_limit=SpinBox.new()
	selected_worker_limit.prefix="Töölisi "
	selected_worker_limit.step=1
	selected_worker_limit.custom_minimum_size.x=125
	selected_worker_limit.value_changed.connect(change_selected_worker_limit)
	selected_building_row.add_child(selected_worker_limit)
	selected_building_toggle=Button.new()
	selected_building_toggle.pressed.connect(toggle_selected_building)
	selected_building_row.add_child(selected_building_toggle)
	var save_row := HBoxContainer.new()
	box.add_child(save_row)
	var save_button := Button.new()
	save_button.text = "Salvesta vaheversioon"
	save_button.pressed.connect(save_partial)
	save_row.add_child(save_button)
	var load_button := Button.new()
	load_button.text = "Laadi salvestus"
	load_button.pressed.connect(load_partial)
	save_row.add_child(load_button)
	var resize_panel = func():
		panel.offset_bottom = minf(27.0 + box.get_combined_minimum_size().y, get_viewport().get_visible_rect().size.y - 15.0)
	box.minimum_size_changed.connect(resize_panel)
	get_viewport().size_changed.connect(resize_panel)
	resize_panel.call_deferred()
	var hud := Control.new()
	hud.set_script(WebHud)
	game_hud=hud
	hud.host=self;hud.legacy_panel=panel;hud.minimap=minimap
	layer.add_child(hud)
	layer.move_child(panel,layer.get_child_count()-1)
	panel.visible=false
	var loading_layer:=CanvasLayer.new();loading_layer.layer=30;add_child(loading_layer)
	detail_loading_overlay=ColorRect.new();detail_loading_overlay.color=Color(0.03,0.06,0.09,0.96);detail_loading_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);detail_loading_overlay.visible=false;loading_layer.add_child(detail_loading_overlay)
	var loading_text:=Label.new();loading_text.text="Detailkaardi maastik ja mets laadivad…";loading_text.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER;loading_text.vertical_alignment=VERTICAL_ALIGNMENT_CENTER;loading_text.add_theme_font_size_override("font_size",24);loading_text.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);detail_loading_overlay.add_child(loading_text)

func toggle_simulation_pause() -> void:
	simulation_paused=not simulation_paused
	simulation_pause_button.text="Jätka mängu" if simulation_paused else "Peata mäng"
	update_status("Mäng on peatatud." if simulation_paused else "Mäng jätkub.")

func update_status(message: String) -> void:
	if not game.is_empty():
		if not game.has("events"):game.events=[]
		if game.events.is_empty() or str(game.events.back().get("text",""))!=message:
			game.events.append({"time":float(game.get("time",0)),"text":message})
			if game.events.size()>40:game.events.pop_front()
	var subject: String="Vägi" if selected_entity=="army" else "Laev" if selected_entity=="ship" else "Kaupmees" if selected_entity=="merchant" else "Linn" if city_created and not settler_mode else "Asunik"
	var location:=player
	if selected_entity=="army":
		var army: Variant=selected_army()
		if army!=null:location=Vector2i(int(army.c),int(army.r))
	status.text = "%s: %d, %d  |  %s" % [subject,location.x,location.y,message]

func _unhandled_input(event: InputEvent) -> void:
	if is_instance_valid(house_designer_layer):return
	if is_instance_valid(fpv_walker) and fpv_walker.handle_input(event):get_viewport().set_input_as_handled();return
	if battle_view!=null:
		if event is InputEventKey and event.pressed and not event.echo:
			if event.keycode==KEY_SPACE:toggle_simulation_pause()
			elif event.keycode==KEY_F:
				var unit: Variant=battle_view.current_squad()
				if unit!=null:camera_target=Vector3(unit.x,0,unit.z);update_camera()
			elif event.keycode==KEY_G and game.battle.get("result")!=null:close_battle_view()
		if event is InputEventMouseButton:
			if event.button_index in [MOUSE_BUTTON_LEFT,MOUSE_BUTTON_RIGHT]:
				if event.pressed:dragging=true;drag_button=event.button_index;drag_origin=event.position;drag_moved=false
				else:
					if drag_button!=event.button_index:return
					dragging=false
					if not drag_moved:battle_view.handle_click(event.position,event.button_index==MOUSE_BUTTON_RIGHT)
					drag_button=0
			elif event.button_index==MOUSE_BUTTON_WHEEL_UP and event.pressed:zoom=maxf(18,zoom*0.85);update_camera()
			elif event.button_index==MOUSE_BUTTON_WHEEL_DOWN and event.pressed:zoom=minf(500,zoom*1.18);update_camera()
		elif event is InputEventMouseMotion and dragging:
			if event.position.distance_to(drag_origin)>6:drag_moved=true
			if drag_moved:
				var plane:=Plane(Vector3.UP,camera_target.y)
				var old_point: Variant=plane.intersects_ray(camera.project_ray_origin(event.position-event.relative),camera.project_ray_normal(event.position-event.relative))
				var new_point: Variant=plane.intersects_ray(camera.project_ray_origin(event.position),camera.project_ray_normal(event.position))
				if old_point!=null and new_point!=null:camera_target+=old_point-new_point;update_camera()
		return
	if event is InputEventKey and event.pressed and not event.echo and not menu_open:
		if game_hud!=null and (game_hud.research_screen.visible or game_hud.journal_dialog.visible or game_hud.diplomacy_screen.visible):return
		if wall_drawing_active() and event.keycode==KEY_C:toggle_wall_shape();get_viewport().set_input_as_handled();return
		if wall_drawing_active() and event.keycode==KEY_T:toggle_wall_tier();get_viewport().set_input_as_handled();return
		match event.keycode:
			KEY_M:
				if selected_entity=="detail_unit":detail_unit_order=true;update_status("Vali üksusele detailkaardil sihtkoht.")
				elif selected_entity=="army":begin_army_order()
				elif selected_entity=="ship":begin_ship_order()
				elif selected_entity=="settler":begin_settler_order()
				else:update_status("Vali kõigepealt asunik või vägi.")
			KEY_V:army_command_mode=false;settler_command_mode=false;ship_command_mode=false;detail_unit_order=false;cancel_build_placement()
			KEY_X:
				if selected_entity=="detail_unit":stop_detail_unit()
				elif selected_entity=="army":stop_selected_army()
				elif selected_entity=="ship":stop_selected_ship()
				elif selected_entity=="settler":stop_selected_settler()
			KEY_F:focus_selected_entity()
			KEY_G:toggle_detail()
			KEY_ENTER:
				if not detail_mode:open_selected_tile()
			KEY_SPACE:toggle_simulation_pause()
			KEY_EQUAL,KEY_KP_ADD:zoom=clampf(zoom-(7.67 if detail_mode else 3.27),21.1 if detail_mode else 4.9,430.5 if detail_mode else 294.6);update_camera()
			KEY_MINUS,KEY_KP_SUBTRACT:zoom=clampf(zoom+(7.67 if detail_mode else 3.27),21.1 if detail_mode else 4.9,430.5 if detail_mode else 294.6);update_camera()
			KEY_HOME:focus_selected_entity()
	if event is InputEventKey and event.pressed and event.keycode==KEY_ESCAPE and build_placement_mode:
		cancel_build_placement()
		update_status("Ehitamine tühistatud.")
		get_viewport().set_input_as_handled()
		return
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_RIGHT:
			if event.pressed:
				dragging=true;drag_button=event.button_index;drag_origin=event.position;drag_moved=false
			else:
				if drag_button!=event.button_index:return
				dragging=false
				if not drag_moved and ((not detail_mode and selected_entity in ["settler","army","ship"]) or (detail_mode and selected_entity=="detail_unit")):select_destination(event.position,true)
				drag_button=0
		elif event.pressed and event.ctrl_pressed and build_placement_mode and detail_mode and event.button_index in [MOUSE_BUTTON_WHEEL_UP,MOUSE_BUTTON_WHEEL_DOWN]:
			rotate_build_preview(event.position,1 if event.button_index==MOUSE_BUTTON_WHEEL_DOWN else -1)
			get_viewport().set_input_as_handled()
		elif event.pressed and event.button_index == MOUSE_BUTTON_WHEEL_UP:
			zoom=maxf(21.1 if detail_mode else 4.9,zoom-(3.83 if detail_mode else 1.64)*maxf(0.01,event.factor))
			update_camera()
		elif event.pressed and event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			var next:=zoom+(3.83 if detail_mode else 1.64)*maxf(0.01,event.factor)
			if detail_mode and next>=430.5:toggle_detail()
			else:zoom=minf(430.5 if detail_mode else 294.6,next);update_camera()
		elif event.button_index == MOUSE_BUTTON_LEFT:
			var field_mode: bool=build_placement_mode and can_build_on_detail() and city_created and not settler_mode and build_select.get_item_metadata(build_select.selected)=="field"
			var wall_mode: bool=wall_drawing_active()
			if wall_mode and event.pressed:
				var start:Variant=detail_point(event.position);wall_stroke=[]
				if start!=null:wall_stroke.append({"x":float(start.x),"z":float(start.z)});clear_building_preview()
			elif wall_mode and not event.pressed and not wall_stroke.is_empty():finish_wall_stroke(event.position)
			elif field_mode and event.pressed:
				field_drag_start=detail_point(event.position);field_drag_screen=event.position
			elif field_mode and not event.pressed and field_drag_start!=null:
				finish_field_drag(event.position)
			elif event.pressed:
				dragging=true;drag_button=event.button_index;drag_origin=event.position;drag_moved=false;drag_double_click=event.double_click
			elif drag_button==event.button_index:
				dragging=false
				if not drag_moved:
					var open_tile: bool=drag_double_click and not detail_mode and not (army_command_mode or settler_command_mode or ship_command_mode or build_placement_mode)
					select_destination(event.position)
					if open_tile:open_selected_tile()
				drag_button=0
				drag_double_click=false
	elif event is InputEventMouseMotion:
		if dragging:
			if event.position.distance_to(drag_origin)>6:drag_moved=true
			if not drag_moved:return
			var plane:=Plane(Vector3.UP,camera_target.y)
			var old_point: Variant=plane.intersects_ray(camera.project_ray_origin(event.position-event.relative),camera.project_ray_normal(event.position-event.relative))
			var new_point: Variant=plane.intersects_ray(camera.project_ray_origin(event.position),camera.project_ray_normal(event.position))
			if old_point!=null and new_point!=null:camera_target+=old_point-new_point
			update_camera()
		elif not wall_stroke.is_empty():update_wall_stroke(event.position)
		elif field_drag_start!=null:update_field_preview(event.position)
		elif build_placement_mode and can_build_on_detail():update_building_preview(event.position)

func detail_point(screen: Vector2) -> Variant:
	var origin:=camera.project_ray_origin(screen);var direction:=camera.project_ray_normal(screen)
	var hit: Variant=Plane(Vector3.UP,0).intersects_ray(origin,direction)
	for i in 6:
		if hit==null:break
		var ground:=detail_rendered_height(hit.x,hit.z)
		var next: Variant=Plane(Vector3.UP,ground).intersects_ray(origin,direction)
		if next==null:break
		hit=next
	return null if hit==null else {"x":hit.x,"z":hit.z}

func detail_rendered_height(x: float,z: float) -> float:
	if not is_instance_valid(detail_root):return 0.0
	var dc:=floori((x+112.5)/225.0);var dr:=floori((z+97.5)/195.0)
	var tile: Vector2i=(selected if detail_inspection else player)+Vector2i(dc,dr)
	if tile.x<0 or tile.x>=Grid.COLS or tile.y<0 or tile.y>=Grid.ROWS:return 0.0
	var heights: Array=[]
	if dc==0 and dr==0:heights=detail_root.heights
	else:
		var key:=str(tile.x)+":"+str(tile.y)
		if not detail_pick_heights.has(key):detail_pick_heights[key]=DetailTerrainScript.tile_heights(grid,tile.x,tile.y)
		heights=detail_pick_heights[key]
	var visual:=PackedVector4Array()
	if dc==0 and dr==0:visual=detail_root.visual_heights
	else:
		var neighbors:=detail_root.get_node_or_null("NeighborTiles")
		if neighbors!=null:
			for child in neighbors.get_children():
				if child.get_meta("coords",Vector2i(-1,-1))==tile:visual=child.get_meta("visual_heights",PackedVector4Array());break
	return DetailTerrainScript.visual_rendered_height(heights,visual,x-dc*225.0,z-dr*195.0)

func clear_building_preview() -> void:
	if is_instance_valid(building_preview):building_preview.queue_free()
	building_preview=null;building_preview_type="";building_preview_error=""

func cancel_build_placement() -> void:
	build_placement_mode=false;field_drag_start=null;wall_stroke=[];clear_wall_preview()
	if is_instance_valid(field_preview):field_preview.queue_free()
	field_preview=null;clear_building_preview()

func rotate_build_preview(screen: Vector2,direction: int) -> void:
	if not build_placement_mode or not detail_mode:return
	var initial:=float(building_preview.rotation.y) if is_instance_valid(building_preview) else 0.0
	var current: float=initial if build_angle==null else float(build_angle)
	build_angle=fposmod(current+deg_to_rad(2.0)*direction,TAU)
	if not wall_stroke.is_empty():show_wall_preview()
	elif field_drag_start!=null:update_field_preview(screen)
	else:update_building_preview(screen)
	update_status("Pööre: %d° · Ctrl + hiireratas muudab nurka." % roundi(rad_to_deg(float(build_angle))))

func tint_building_preview(node: Node,material: Material) -> void:
	if node is MeshInstance3D:node.material_override=material
	for child in node.get_children():tint_building_preview(child,material)

# The same checks and snapped position are used by both the ghost and placement.
func building_site_check(city: Dictionary,type: String,requested: Vector2) -> Dictionary:
	if city_created and active_city_index>=0 and active_city_index<game.cities.size():
		var parent:Dictionary=game.cities[active_city_index]
		var offset:=Vector2((int(city.c)-int(parent.c))*225.0,(int(city.r)-int(parent.r))*195.0)
		if OuterRingSurvey.blocks_future_wall(parent,requested,type,offset):return {"error":"Planeeritud linnamüüri koridor peab jääma ehitistest vabaks.","point":requested}
	var rural_error:=district_county_rule(city,type)
	if not rural_error.is_empty():return {"error":rural_error,"point":requested}
	var error:=CityRules.urban_rule(game,city,city_cell_data(city),type,is_coast(int(city.c),int(city.r)),city_has_river(city),DistrictContexts.all_buildings(game.cities[active_city_index]) if city.has("districtOf") else [])
	if not error.is_empty():return {"error":error,"point":requested}
	if type=="bridge":
		var check:=BridgeRules.preview(city,grid[int(city.r)*Grid.COLS+int(city.c)],build_angle)
		if check.has("error"):check.point=Vector2.ZERO;return check
		if bridge_worksite(city)==null:return {"error":"Ehitaja ei pääse jõe kaldale.","point":Vector2.ZERO}
		return check
	for existing in city.economy.buildings:
		if existing.type=="field" and float(existing.get("hp",0))>0 and FarmingRules.field_contains(existing,{"x":requested.x,"z":requested.y},17 if type=="market" else 6):
			return {"error":"Hoone ei mahu põllule. Vali koht põllu kõrval.","point":requested}
	var target:=requested;var coast: Dictionary={};var deposit_id: int=-1
	if type in ["fisher","harbor"]:
		coast=shore_placement(city,type,target,city_heights)
		if coast.has("error"):return {"error":coast.error,"point":requested}
		target=Vector2(coast.p.x,coast.p.z)
	if MineralSites.TYPES.has(type):
		var deposit:=MineralSites.placement(city.world,type,{"x":target.x,"z":target.y},city.economy.buildings)
		if deposit.has("error"):return {"error":deposit.error,"point":target}
		target=Vector2(deposit.p.x,deposit.p.z);deposit_id=int(deposit.depositId)
	if not coast.is_empty() and build_angle!=null and coast.has("landEntry"):
		var angle:=float(build_angle)-float(coast.get("shoreAngle",0.0));var c:=cos(angle);var s:=sin(angle)
		var dx: float=coast.landEntry.x-target.x;var dz: float=coast.landEntry.z-target.y
		var entry: Dictionary={"x":target.x+dx*c+dz*s,"z":target.y-dx*s+dz*c}
		if not build_terrain_passable(entry.x,entry.z,city.team):return {"error":"Pööratud rannahoone sissepääs vajab kuiva maad.","point":target}
		coast.landEntry=entry
	if coast.is_empty():
		var angle:=float(build_angle) if build_angle!=null else 0.0
		var c:=cos(angle);var s:=sin(angle);var levels: Array=[]
		var xs: Array=[-10.0,0.0,10.0] if type=="market" else [-3.0,0.0,3.0]
		var zs: Array=[-9.0,0.0,9.0] if type=="market" else [-2.8,0.0,2.8]
		for dx in xs:
			for dz in zs:
				var x: float=target.x+dx*c+dz*s;var z: float=target.y-dx*s+dz*c
				if not build_terrain_passable(x,z,city.team):return {"error":"Kogu hoone peab mahtuma kuivale maale.","point":target}
				if dx!=0 and dz!=0:levels.append(DetailTerrainScript.detail_height(city_heights,x,z))
		if float(levels.max())-float(levels.min())>1.8:return {"error":"Maapind on hoone jaoks liiga järsk.","point":target}
	var candidate: Dictionary={"type":type,"x":target.x,"z":target.y,"team":city.team}
	if coast.has("landEntry"):candidate.landEntry=coast.landEntry
	if build_angle!=null:candidate.buildingRotationV228=float(build_angle);candidate.freeRotationV243=true
	elif not coast.is_empty():candidate.shoreAngle=coast.get("shoreAngle",0.0)
	if not coast.is_empty() and city_nav!=null:
		var hall: Dictionary={}
		for building in city.economy.buildings:
			if building.type=="hall" and float(building.get("hp",0))>0:hall=building;break
		var from: Variant=city_nav.nearest(LocalNav.door(hall),15) if not hall.is_empty() else null
		var to: Variant=city_nav.nearest(coast.landEntry,3)
		if from==null or to==null or not city_nav.reachable(from,to):return {"error":"Rannahoone maapoolne sissepääs peab olema linnaga ühendatud.","point":target}
	var footprint: Variant=LocalNav.clearance(candidate)
	if footprint!=null:
		for other in city.economy.buildings:
			if other.get("virtual",false) or float(other.get("hp",0))<=0:continue
			var existing: Variant=LocalNav.clearance(other)
			if existing==null:continue
			var close_houses: bool=type=="house" and other.type=="house"
			var factor:=0.85 if close_houses else 0.95;var margin:=0.0 if close_houses else 0.3
			if absf(float(other.x)-target.x)<(float(existing.rx)+float(footprint.rx))*factor+margin and absf(float(other.z)-target.y)<(float(existing.rz)+float(footprint.rz))*factor+margin:
				return {"error":"Hoone sulgeks sissepääsu või töötaja tagasitee. Jäta majade vahele läbipääs.","point":target}
	var passable: Callable=build_terrain_passable
	if not coast.is_empty():passable=func(_x,_z,_team):return true
	var result:=Economy.build_rule(city.economy,city.team,type,target,passable,build_site_clear,true)
	if not result.has("error") and city_nav!=null and not city_nav.preserves_access(candidate,city.economy.buildings,city.world.get("workers",{}),city.economy.get("cargo",[])):
		result={"error":"Hoone sulgeks sissepääsu või töötaja tagasitee. Jäta majade vahele läbipääs."}
	result.point=target;result.coast=coast;result.deposit_id=deposit_id
	return result

func update_building_preview(screen: Vector2) -> void:
	if not city_created or settler_mode or not is_instance_valid(detail_root) or build_select.item_count==0:return
	var type: String=build_select.get_item_metadata(build_select.selected)
	if type=="field":clear_building_preview();return
	var hit: Variant=detail_point(screen)
	if hit==null:return
	var city: Dictionary=current_build_context()
	if not is_instance_valid(building_preview) or building_preview_type!=type:
		clear_building_preview()
		building_preview=detail_root.create_designed_building(type,Production.upgrade_level(game,int(city.team)),game.get("houseDesignTemplatesV354",{}).get(type,{}))
		if building_preview==null:return
		building_preview_type=type;detail_root.add_child(building_preview)
	var requested:=Vector2(roundf(hit.x/2.0)*2.0,roundf(hit.z/2.0)*2.0)
	var check:=building_site_check(city,type,requested)
	var point: Vector2=check.point
	var coast: Dictionary=check.get("coast",{})
	var ground: float=DetailTerrainScript.detail_height(city_heights,point.x,point.y)
	var elevation: float=detail_root.display_height(point.x,point.y)
	if coast.has("baseY"):elevation=elevation+float(coast.baseY)-ground if coast.get("riverBankV276",false) else float(coast.baseY)
	building_preview.position=Vector3(point.x,elevation+0.12,point.y)
	building_preview.rotation.y=float(build_angle) if build_angle!=null else float(coast.get("shoreAngle",0.0))
	var error: String=check.get("error","")
	if error!=building_preview_error or not building_preview.has_meta("preview_material"):
		building_preview_error=error
		var material:=StandardMaterial3D.new();material.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED
		material.transparency=BaseMaterial3D.TRANSPARENCY_ALPHA;material.albedo_color=Color(0.75,0.3,0.24,0.56) if not error.is_empty() else Color(0.48,0.78,0.36,0.56)
		tint_building_preview(building_preview,material);building_preview.set_meta("preview_material",true)
		update_status(error if not error.is_empty() else Economy.DATA.data.buildings[type].name+" · sobiv koht")

func update_field_preview(screen: Vector2) -> void:
	var end: Variant=detail_point(screen)
	if end==null or field_drag_start==null or screen.distance_to(field_drag_screen)<4:return
	var area:=FarmingRules.field_rect(field_drag_start,end)
	if field_preview==null:
		field_preview=MeshInstance3D.new()
		var material:=StandardMaterial3D.new()
		material.albedo_color=Color(0.4,0.82,0.24,0.4);material.transparency=BaseMaterial3D.TRANSPARENCY_ALPHA;material.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;material.cull_mode=BaseMaterial3D.CULL_DISABLED
		field_preview.material_override=material
		detail_root.add_child(field_preview)
	var mesh:=PlaneMesh.new();mesh.size=Vector2(maxf(0.1,area.width),maxf(0.1,area.depth));field_preview.mesh=mesh
	field_preview.position=Vector3(area.x,detail_root.display_height(area.x,area.z)+0.12,area.z)
	field_preview.rotation.y=float(build_angle) if build_angle!=null else 0.0
	if build_angle!=null:area.buildingRotationV228=float(build_angle);area.freeRotationV243=true
	var error:=field_site_error(current_build_context(),area)
	var material: StandardMaterial3D=field_preview.material_override
	material.albedo_color=Color(0.75,0.3,0.24,0.48) if not error.is_empty() else Color(0.4,0.82,0.24,0.4)
	if error!=building_preview_error:
		building_preview_error=error
		update_status(error if not error.is_empty() else "Põld · sobiv koht")

func field_site_error(city: Dictionary,field: Dictionary) -> String:
	if city_created and active_city_index>=0 and active_city_index<game.cities.size():
		var parent:Dictionary=game.cities[active_city_index]
		var offset:=Vector2((int(city.c)-int(parent.c))*225.0,(int(city.r)-int(parent.r))*195.0)
		if OuterRingSurvey.blocks_future_wall(parent,Vector2(field.x,field.z),"field",offset):return "Planeeritud linnamüüri koridor peab jääma ehitistest vabaks."
	var rule:=CityRules.urban_rule(game,city,city_cell_data(city),"field",is_coast(int(city.c),int(city.r)),city_has_river(city))
	if not rule.is_empty():return rule
	var error:=FarmingRules.validate(city,field,func(x,z):return build_terrain_passable(x,z,city.team))
	if not error.is_empty():return error
	var check:=Economy.build_rule(city.economy,city.team,"field",Vector2(field.x,field.z),build_terrain_passable,build_site_clear,true)
	if check.has("error"):return str(check.error)
	var heights: Array=[];var x: float=-field.width/2.0;var angle:=float(field.get("buildingRotationV228",0.0))
	while x<=field.width/2.0:
		var z: float=-field.depth/2.0
		while z<=field.depth/2.0:
			heights.append(DetailTerrainScript.detail_height(city_heights,field.x+x*cos(angle)+z*sin(angle),field.z-x*sin(angle)+z*cos(angle)));z+=4
		x+=4
	return "Põllu maapind on liiga järsk." if float(heights.max())-float(heights.min())>1.8 else ""

func finish_field_drag(screen: Vector2) -> void:
	var end: Variant=detail_point(screen)
	var start: Variant=field_drag_start
	if end!=null and screen.distance_to(field_drag_screen)>=4:update_field_preview(screen)
	field_drag_start=null
	if end==null:
		if field_preview!=null:field_preview.queue_free();field_preview=null
		return
	if screen.distance_to(field_drag_screen)<4:
		if field_preview!=null:field_preview.queue_free();field_preview=null
		build_position=Vector2(roundf(end.x),roundf(end.z))
		if build_placement_mode:
			update_status("Lohista detailkaardile põllu ala.")
			return
		if select_building_at(build_position):return
		update_status("Põllu keskpunkt valitud; määra suurus või lohista ala.")
		return
	var area:=FarmingRules.field_rect(start,end)
	if area.width<8 or area.depth<8 or area.width>64 or area.depth>64:
		if field_preview!=null:field_preview.queue_free();field_preview=null
		update_status("Põllu küljed peavad olema 8–64 ühikut. Lohista väiksem ristkülik.")
		return
	build_position=Vector2(area.x,area.z);field_width.value=area.width;field_depth.value=area.depth
	if build_placement_mode:place_city_building()
	else:update_status("Põllu ala: %d × %d. Vajuta ehitusnuppu." % [area.width,area.depth])

func select_destination(screen: Vector2,force_move:=false) -> void:
	if detail_mode:
		select_detail_position(screen,force_move)
		return
	var ray_origin := camera.project_ray_origin(screen)
	var ray_direction := camera.project_ray_normal(screen)
	var hit: Variant = Plane(Vector3.UP, 0).intersects_ray(ray_origin, ray_direction)
	if hit == null:return
	for i in 5:
		var x: float=Grid.ORIGIN_X+(hit.x+Grid.COLS)*25.0
		var z: float=Grid.ORIGIN_Z+(hit.z+Grid.ROWS)*25.0
		var ground:=WorldTerrain.mesh_elevation(world_mesh_samples,x,z)
		var next: Variant=Plane(Vector3.UP,ground).intersects_ray(ray_origin,ray_direction)
		if next==null:break
		hit=next
	var c := floori(hit.x / CELL_SIZE + Grid.COLS / 2.0)
	var r := floori(hit.z / CELL_SIZE + Grid.ROWS / 2.0)
	if c < 0 or c >= Grid.COLS or r < 0 or r >= Grid.ROWS:
		return
	var destination := Vector2i(c, r)
	selected=destination
	if ship_command_mode or (force_move and selected_entity=="ship"):order_ship(destination);return
	if army_command_mode or (force_move and selected_entity=="army"):order_army(destination);return
	if city_created and not settler_mode:
		for city in game.cities:
			if int(city.team)==0 and int(city.c)==destination.x and int(city.r)==destination.y:
				for i in city_select.item_count:
					if int(city_select.get_item_metadata(i))==int(city.id):
						city_select.select(i);switch_city(i)
						update_status("Valitud linn: "+str(city.name));return
		for person in game.settlers:
			if int(person.team)==0 and person.get("embarked")==null and int(person.c)==destination.x and int(person.r)==destination.y:
				for i in settler_select.item_count:
					if int(settler_select.get_item_metadata(i))==int(person.id):
						settler_select.select(i);select_owned_settler();return
		if select_ship_at(destination):return
		if select_army_at(destination):return
		if select_merchant_at(destination):return
		if select_landmark_at(destination):return
		show_tile_info(destination);return
	if not settler_command_mode and not force_move:
		if select_ship_at(destination):return
		if destination!=Vector2i(int(settler.c),int(settler.r)) and select_army_at(destination):return
		show_tile_info(destination);return
	var path: Variant = Grid.find_path(grid, player, destination, Geography.traversable_cell)
	if path == null:
		update_status("Sinna ei leitud maismaateed.")
		return
	settler_command_mode=false
	settler.localTarget = null
	local_nav = null
	settler.path.clear()
	for cell in path:
		settler.path.append({"c": cell.x, "r": cell.y})
	settler.travelClock = 0.0
	settler.travelDuration = 0.0
	settler.landed = false
	update_status("Teekond %d ruutu. Rahvasterände aegne liikumine on kiirem." % path.size())


func show_tile_info(tile: Vector2i) -> void:
	if not reveal_all and not game.explored[0].has(str(tile.x)+":"+str(tile.y)):
		update_status("Ruut %d:%d · avastamata ala." % [tile.x+1,tile.y+1]);return
	var cell: Dictionary=grid[tile.y*Grid.COLS+tile.x]
	if cell.land:city_cell_data({"c":tile.x,"r":tile.y})
	var resources:=PackedStringArray()
	for kind in cell.get("deposits",{}):
		if not cell.deposits[kind] or (kind=="oil" and "oil_drilling" not in game.research[0].known):continue
		resources.append(str(Economy.DATA.data.resource_names.get(kind,kind)))
	resources.sort()
	var terrain_name: String="Maismaa" if cell.land else "Meri"
	if cell.get("mountain",false):terrain_name="Mäestik"
	elif cell.get("river",false):terrain_name="Jõgi"
	var description: String=", ".join(resources) if not resources.is_empty() else "ressursse ei leitud"
	update_status("Ruut %d:%d · %s · %s" % [tile.x+1,tile.y+1,terrain_name,description])


func migration_active() -> bool:
	var migration: Dictionary=game.get("migrationV274",{})
	return not migration.is_empty() and not migration.get("done",false) and float(game.time)<float(migration.get("until",120))

func follow_migration_band() -> void:
	for army in game.get("armies",[]):
		for band in game.get("settlers",[]):
			if int(band.team)!=int(army.team):continue
			army.c=band.c;army.r=band.r;army.path=[];army.travelClock=0.0;army.travelDuration=0.0
			army.hiddenInBandV274=true
			break

func end_migration() -> void:
	var migration: Dictionary=game.get("migrationV274",{})
	if migration.is_empty() or migration.get("done",false) or float(game.time)<float(migration.get("until",120)):return
	migration.done=true
	if not city_created:
		if settler.has("chosenSiteV274"):finish_selected_city()
		else:found_suggested_migration_city()
	for band in game.settlers.duplicate():
		if int(band.team)>0:found_other_migration_city(band)
	for army in game.get("armies",[]):army.erase("hiddenInBandV274")
	refresh_city_territory();refresh_city_options();update_city_markers();refresh_army_options()

func found_other_migration_city(band: Dictionary) -> void:
	for existing in game.cities:
		if int(existing.team)==int(band.team):return
	if band.get("embarked")!=null:return
	var cell_at=func(c: int,r: int):return grid[r*Grid.COLS+c] if c>=0 and c<Grid.COLS and r>=0 and r<Grid.ROWS else null
	var suggestions:=Settlement.site_suggestions(game,band,cell_at,prepare_suggestion_cell)
	var chosen: Dictionary=band.get("chosenSiteV274",{})
	if not chosen.is_empty():band.c=chosen.c;band.r=chosen.r
	elif not suggestions.is_empty():band.c=suggestions[0].c;band.r=suggestions[0].r
	band.path=[];band.travelClock=0.0;band.travelDuration=0.0;band.landed=true;band.localTarget=null
	var c:=int(band.c);var r:=int(band.r)
	if c<0 or r<0 or c>=Grid.COLS or r>=Grid.ROWS:return
	var key:=str(c)+":"+str(r)
	if not game.has("tileWorlds"):game.tileWorlds={}
	if not game.tileWorlds.has(key):game.tileWorlds[key]=DetailWorldScript.create(grid,city_cell_data(band),visual_biome(r*Grid.COLS+c),int(game.seed))
	var world: Dictionary=game.tileWorlds[key]
	var heights:=DetailTerrainScript.tile_heights(grid,c,r)
	var coast:=is_coast(c,r) or bool(grid[r*Grid.COLS+c].mountain)
	var visual:=detail_visual_for(c,r);var river:=river_navigation_for(c,r,heights)
	var nav:=LocalNav.new(-132 if coast else -109,-117 if coast else -94,265 if coast else 219,235 if coast else 189,func(x,z):return DetailTerrainScript.detail_height(heights,x,z)>0.2 and DetailTerrainScript.visual_sample(visual,x,z).z>0.05 and river.passable(x,z))
	nav.rebuild([],world.resources)
	var nearest: Variant=nav.nearest(band,80)
	if nearest==null:return
	var origin:=Vector2(float(chosen.get("x",nearest.x)),float(chosen.get("z",nearest.z)))
	var positions: Array=[origin]
	for d in range(4,25,4):
		for delta in [Vector2(d,0),Vector2(-d,0),Vector2(0,d),Vector2(0,-d),Vector2(d,d),Vector2(-d,-d),Vector2(d,-d),Vector2(-d,d)]:positions.append(origin+delta)
	var passable=func(x,z):return DetailTerrainScript.detail_height(heights,x,z)>0.2 and DetailTerrainScript.visual_sample(visual,x,z).z>0.05 and river.passable(x,z)
	for position in positions:
		if not Settlement.site_rule(band,position,game.cities,false,false,passable,world.resources).is_empty():continue
		band.x=position.x;band.z=position.y
		var result:=Settlement.found_city(game,band,world)
		if not result.has("city"):continue
		result.city.reservePendingV168=true
		for army in game.armies:
			if int(army.team)==int(result.city.team):army.c=c;army.r=r;army.path=[];army.travelClock=0.0;break
		return

func migration_suggestions() -> Array:
	var cell_at=func(c: int,r: int):return grid[r*Grid.COLS+c] if c>=0 and c<Grid.COLS and r>=0 and r<Grid.ROWS else null
	return Settlement.site_suggestions(game,settler,cell_at,prepare_suggestion_cell)

func prepare_suggestion_cell(cell: Dictionary) -> void:
	# Suggestions must use the actual world's geography version, just like
	# candidate selection and the city created from the chosen cell.
	city_cell_data(cell)
func found_suggested_migration_city() -> void:
	if settler.get("embarked")!=null:return
	var suggestions:=migration_suggestions()
	if not suggestions.is_empty():
		var best: Dictionary=suggestions[0]
		if detail_mode:toggle_detail()
		settler.c=best.c;settler.r=best.r;settler.path=[];settler.travelClock=0.0;settler.travelDuration=0.0;settler.landed=false
		player=Vector2i(int(best.c),int(best.r));camera_target=cell_position(player);world_camera_target=camera_target
	if not settler.path.is_empty():return
	var c:=int(settler.c);var r:=int(settler.r)
	if c<0 or c>=Grid.COLS or r<0 or r>=Grid.ROWS:return
	var key:=str(c)+":"+str(r)
	if not game.has("tileWorlds"):game.tileWorlds={}
	if not game.tileWorlds.has(key):game.tileWorlds[key]=DetailWorldScript.create(grid,city_cell_data(settler),visual_biome(r*Grid.COLS+c),int(game.seed))
	var world: Dictionary=game.tileWorlds[key]
	var local_heights:=DetailTerrainScript.tile_heights(grid,c,r)
	var visual:=detail_visual_for(c,r);var river:=river_navigation_for(c,r,local_heights)
	var coast:=is_coast(c,r) or bool(grid[r*Grid.COLS+c].mountain)
	var min_x: int=-132 if coast else -109;var min_z: int=-117 if coast else -94
	var w: int=265 if coast else 219;var h: int=235 if coast else 189
	var nav:=LocalNav.new(min_x,min_z,w,h,func(x,z):return DetailTerrainScript.detail_height(local_heights,x,z)>0.2 and DetailTerrainScript.visual_sample(visual,x,z).z>0.05 and river.passable(x,z))
	nav.rebuild([],world.resources)
	var nearest: Variant=nav.nearest(settler,80)
	if nearest==null:return
	settler.x=nearest.x;settler.z=nearest.z;settler.landed=true;settler.localTarget=null
	var original:=Vector2(roundf(float(settler.x)),roundf(float(settler.z)))
	var positions: Array=[original]
	for d in range(4,25,4):
		for delta in [Vector2(d,0),Vector2(-d,0),Vector2(0,d),Vector2(0,-d),Vector2(d,d),Vector2(-d,-d),Vector2(d,-d),Vector2(-d,d)]:positions.append(original+delta)
	var passable=func(x,z):return DetailTerrainScript.detail_height(local_heights,x,z)>0.2 and DetailTerrainScript.visual_sample(visual,x,z).z>0.05 and river.passable(x,z)
	for position in positions:
		if not Settlement.site_rule(settler,position,game.cities,false,false,passable,world.resources).is_empty():continue
		settler.x=position.x;settler.z=position.y;selected_world=world
		var result:=Settlement.found_city(game,settler,world)
		if result.has("city"):
			finish_city_visuals(result.city,true)
			update_camera()
			return
	update_status("Sobivat linnakohta ei leitud; vali koht ise.")
func update_camera_keys(delta: float) -> void:
	if menu_open or camera==null:return
	if game_hud!=null and (game_hud.research_screen.visible or game_hud.journal_dialog.visible):return
	var focus:=get_viewport().gui_get_focus_owner()
	if focus is LineEdit or focus is TextEdit:return
	var x:=int(Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT))-int(Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT))
	var z:=int(Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN))-int(Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP))
	var movement:=Vector2(x,z)
	if movement.is_zero_approx():return
	movement=movement.normalized()*zoom*0.65*delta*(2.0 if Input.is_key_pressed(KEY_SHIFT) else 1.0)
	var axis:=Vector2(0.1,0.7) if not detail_mode else Vector2(0.48,0.8)
	axis=axis.normalized()
	camera_target+=Vector3(movement.x*axis.y+movement.y*axis.x,0,-movement.x*axis.x+movement.y*axis.y)
	if not detail_mode:
		camera_target.x=clampf(camera_target.x,-Grid.COLS+1,Grid.COLS-1)
		camera_target.z=clampf(camera_target.z,-Grid.ROWS+1,Grid.ROWS-1)
	update_camera()

func _process(delta: float) -> void:
	DetailView.poll_nature_assets();DetailView.poll_tree_assets();DetailGroundMaterial.poll()
	if is_instance_valid(detail_loading_overlay):
		if detail_mode and not detail_loading_previous:detail_loading_initial=true;detail_loading_seconds=0.0
		if detail_mode and detail_loading_initial and is_instance_valid(detail_root):
			var waiting: bool=bool(detail_root.tree_pending) or detail_root.forest_fill!=null or (not detail_root.tree_counts.is_empty() and bool(detail_root.tree_lod_dirty))
			detail_loading_seconds+=delta
			detail_loading_overlay.visible=waiting and detail_loading_seconds<15.0
			if not detail_loading_overlay.visible:detail_loading_initial=false
		else:detail_loading_overlay.visible=false
		detail_loading_previous=detail_mode
	if is_instance_valid(building_preview) and (not build_placement_mode or not detail_mode or not city_created or settler_mode):clear_building_preview()
	if is_instance_valid(fpv_walker):fpv_walker.update(delta)
	if not is_instance_valid(fpv_walker) or not fpv_walker.active:
		update_camera_keys(delta)
		follow_detail_camera()
	if settler.is_empty() or paused or simulation_paused or menu_open or (game.get("winner")!=null and game.get("battle")==null):
		return
	elapsed += delta
	game.time = elapsed
	update_daylight()
	Diplomacy.tick(game,delta)
	AITreasury.tick(game,delta)
	DetailDeployments.tick(game,delta,detail_unit_nav)
	var merchant_sea:=Merchants.has_sea_activity(game)
	var merchant_distances: PackedInt32Array=ensure_sea_distances() if merchant_sea else PackedInt32Array()
	var trade_passable=func(_team,p):return army_can_traverse(p)
	ModernFreight.tick_rail(game,delta,merchant_land_path)
	Merchants.tick(game,delta,merchant_land_path,trade_passable,grid if merchant_sea else [],merchant_distances,func():ModernFreight.plan(game,trade_passable),func():ModernFreight.advance_shipments(game,delta,trade_passable),func(cargo):ModernFreight.receive(game,cargo,merchant_land_path,trade_passable))
	if not game.get("ships",[]).is_empty():
		var active_embarked: bool=(settler_mode or not city_created) and settler.get("embarked")!=null
		Naval.tick_fleet(game,grid,ensure_sea_distances(),delta)
		if active_embarked and not game.settlers.has(settler):
			if city_created and city_select.item_count>0:
				switch_city(city_select.selected);refresh_settler_options();update_status("Asunik hukkus laeva uppumisel.")
			else:
				paused=true;marker.visible=false;update_status("Asunik hukkus laeva uppumisel.")
		if selected_entity=="ship" and (selected_ship()==null or float(selected_ship().get("hp",0))<=0):
			selected_entity="city" if city_created and not settler_mode else "settler";ship_command_mode=false
	for message in Raids.tick(game,delta,Diplomacy.peace(game)):update_status(message.text)
	if migration_active():follow_migration_band()
	else:end_migration()
	# Reserve at most one newly founded rival city per frame. Its building
	# planner remains paused until the real corridor has been surveyed.
	for pending_city in game.cities:
		if pending_city.get("reservePendingV168",false):
			initialize_ai_defense_reserve(pending_city);pending_city.erase("reservePendingV168");break
	Roads.decay(game,delta)
	tick_auto_explore(delta)
	game.visionClock=float(game.get("visionClock",0))+delta
	if game.visionClock>=3.0:
		game.visionClock=0.0
		refresh_visibility()
	autosave_clock+=delta
	if autosave_clock>=300.0 and not autosave_pending:
		autosave_clock=0.0;autosave_pending=true
		update_status("Automaatsalvestus…")
		call_deferred("run_autosave")
	for person in game.settlers:
		if not person.get("landed",false) or person.get("localTarget")==null:continue
		var nav: Variant=ensure_settler_navigation(person)
		if nav==null:continue
		nav.trail_time=elapsed
		var selected_person: bool=int(person.team)==0 and (not city_created or settler_mode) and int(person.id)==int(settler.id)
		if nav.move(person,person.localTarget,delta,3.0):
			person.localTarget=null
			if selected_person:
				site_position=Vector2(roundf(person.x),roundf(person.z))
				update_status("Asunik jõudis kohale. Linnakoha valimiseks vajuta nuppu.")
		if selected_person and detail_mode and not detail_inspection:
			detail_root.person.position=Vector3(person.x,maxf(0,detail_root.display_height(person.x,person.z)),person.z)
	for army in game.armies:
		if army.get("hiddenInBandV274",false):continue
		if army_in_battle(army):army.path=[];continue
		var steps:=Movement.advance_army(game,army,delta,false,func(_team,p):return army_can_traverse(p),func(a,b):return Roads.road_boost(game,a,b,game.time),func(a,b):Roads.record_step(game,a,b,"army",game.time))
		for step in steps:
			if step.reveal:
				Campaign.reveal(game,int(army.team),step.to.x,step.to.y)
				if int(army.team)==0:refresh_fog()
				collect_discovery(int(army.team),{"c":step.to.x,"r":step.to.y})
	finish_rallies()
	var captured_settlers:=BattleSiege.capture_settlers(game)
	for captured in captured_settlers:
		if int(captured.team)==0 and int(captured.id)==int(settler.get("id",-1)):
			if detail_mode and battle_view==null:toggle_detail()
			if city_created and int(game.cities[active_city_index].team)==0:
				settler_mode=false;selected_entity="city"
				var home: Dictionary=game.cities[active_city_index]
				player=Vector2i(int(home.c),int(home.r));prepare_city_navigation(home)
			else:select_after_city_loss(captured)
			refresh_settler_options();update_status("Asunik tabati.")
	tick_field_battle(delta)
	# During the migration rival settlers must plan before any city exists.
	if game.cities.is_empty() and float(game.time)-float(game.get("lastAIResearchPlan",0))>=12.0:
		game.lastAIResearchPlan=game.time
		for team in [1,2,3]:manage_ai_settlers(team)
	if not game.cities.is_empty():
		for city in game.cities:
			var runtime:=ensure_city_runtime(city)
			var nav: LocalNavigation=runtime.nav
			var production: LumberProduction=runtime.production
			production.city_wide_buildings=DistrictContexts.all_buildings(city) if not city.get("districts",{}).is_empty() else []
			var training: MilitaryTraining=runtime.training
			var active: bool=city_created and not settler_mode and not detail_inspection and city==game.cities[active_city_index]
			var rival: bool=int(city.team)>0
			var upgrade_rule=func(ctx,type):return CityRules.urban_rule(game,ctx,city_cell_data(ctx),type,is_coast(int(ctx.c),int(ctx.r)),city_has_river(ctx),DistrictContexts.all_buildings(city))
			AIRoadGates.tick(game,city,ensure_city_runtime,upgrade_rule)
			if rival and not city.get("reservePendingV168",false):
				AIStoneDefenses.update_builders(game,city)
				tick_ai_field(city,runtime,city)
				for district in city.get("districts",{}).values():tick_ai_field(district,ensure_city_runtime(district),city)
				var defense_rule=func(type):return CityRules.urban_rule(game,city,city_cell_data(city),type,is_coast(int(city.c),int(city.r)),city_has_river(city),DistrictContexts.all_buildings(city))
				var defense_context=func(parent,tile):return district_context_at(parent,tile,true)
				var outer_rule=func(ctx,type):return CityRules.urban_rule(game,ctx,city_cell_data(ctx),type,is_coast(int(ctx.c),int(ctx.r)),city_has_river(ctx),DistrictContexts.all_buildings(city),{"outerRingV184":true})
				var defense_terrain_cache:Dictionary={}
				var repaired:=AIStoneDefenses.repair_old(game,city,defense_context,ensure_city_runtime,upgrade_rule)
				var upgrading:=false if repaired else AIStoneDefenses.upgrade_old_walls(game,city,upgrade_rule)
				if outer_ring_surveys.has(str(int(city.id))):ai_outer_survey_step(city)
				if not repaired and not upgrading and float(game.time)>=float(city.get("nextOuterRingCheckGodot",0)):
					city.nextOuterRingCheckGodot=float(game.time)+9
					if not AIStoneDefenses.continue_outer_ring(game,city,defense_context,ensure_city_runtime,outer_rule,func(parent,x,z):return ai_defense_terrain(parent,x,z,defense_terrain_cache).passable) and not outer_ring_surveys.has(str(int(city.id))):ai_outer_survey_step(city)
				AIStoneDefenses.tick(game,city,runtime,defense_rule,func():return ai_natural_defense(city,runtime),defense_context,ensure_city_runtime,upgrade_rule,func(parent,x,z):return ai_defense_terrain(parent,x,z,defense_terrain_cache).passable)
				tick_ai_build(city,runtime)
				if float(game.time)>=float(city.get("aiMilitaryCheck",0)):
					city.aiMilitaryCheck=float(game.time)+12;AIMilitary.tick(game,city)
			var difficulty: String=game.get("difficulty","normal")
			var production_dt:=delta*(0.6 if difficulty=="easy" else 0.95 if difficulty=="hard" else 0.8) if rival else delta
			var basic_dt:=delta*(0.6 if difficulty=="easy" else 0.75) if rival else delta
			CityNeeds.consume_luxuries(city,int(game.ages[city.team]),delta)
			Production.apply_building_upgrades(game,city)
			tick_city_demographics(city,delta)
			nav.trail_time=elapsed
			Labor.allocate(game,city)
			var build_event:Dictionary
			if city.get("districts",{}).is_empty():build_event=Builder.tick(game,city,nav,production_dt,runtime.builder_navs)
			else:
				var parent:Dictionary=city
				build_event=DistrictBuilders.tick(game,city,production_dt,func(tile):return district_context_at(parent,tile,true),district_nav_for,merchant_land_path)
				for finished in build_event.get("district_completed",[]):
					var updated:Dictionary=finished.ctx;ensure_city_runtime(updated).nav.rebuild(updated.economy.buildings,updated.world.resources)
					if finished.building.get("type","")=="bridge" and finished.building.get("ready",false):activate_city_bridge(updated)
				tick_city_districts(city,delta,production_dt,basic_dt)
			activate_city_bridge(city)
			city_cell_data(city)
			var previous_vision: int=game.get("visionRevision",0)
			var changed: bool=production.tick(game,city,nav,production_dt,grid,basic_dt)
			runtime.market.tick(game,city,delta,func(tile):return district_context_at(city,tile,true),district_nav_for,merchant_land_path)
			TownStreets.tick(city,delta,ensure_city_runtime,elapsed)
			if int(game.get("visionRevision",0))!=previous_vision:refresh_fog()
			if changed and detail_mode and active:detail_root.sync_removed_resources(city.world.resources,elapsed,city.economy.buildings)
			var trained: Dictionary=training.tick(game,city,nav,basic_dt,finish_ship_job,func(tile):return district_context_at(city,tile,true),district_nav_for,merchant_land_path)
			if trained.has("completed") and active:update_status("Väljaõpe valmis: "+str(Economy.DATA.data.troops[trained.completed].name))
			if trained.has("completedShip") and active:update_status("Laev valmis: "+str(Naval.SHIPS.data[trained.completedShip].name))
			if detail_mode and active:
				tree_visual_clock+=delta
				if tree_visual_clock>=1.0:
					tree_visual_clock=0.0;detail_root.sync_removed_resources(city.world.resources,elapsed,city.economy.buildings)
				var displayed:Dictionary=city
				if not city.get("districts",{}).is_empty():
					displayed=city.duplicate();displayed.builderAgents=[]
					for worker in city.get("builderAgents",[]):
						if int(worker.c)==int(city.c) and int(worker.r)==int(city.r):displayed.builderAgents.append(worker)
				detail_root.update_builder(displayed,elapsed,int(game.ages[int(city.team)]))
				detail_root.update_trainer(city,elapsed,int(game.ages[int(city.team)]))
				detail_root.update_workers(city,elapsed,int(game.ages[int(city.team)]))
				detail_root.update_wildlife(city,elapsed,delta,nav)
				detail_root.update_building_animations(elapsed)
			if detail_mode and not active:
				var visible_view: Node=visible_city_detail(city)
				if visible_view!=null:
					var age:=int(game.ages[int(city.team)])
					visible_view.update_builder(city,elapsed,age)
					visible_view.update_trainer(city,elapsed,age)
					visible_view.update_workers(city,elapsed,age)
					visible_view.update_building_animations(elapsed)
					if changed:visible_view.sync_removed_resources(city.world.resources,elapsed,city.economy.buildings)
					var stamp:=visible_city_building_stamp(city)
					if int(visible_view.get_meta("live_city_stamp",-1))!=stamp:
						visible_view.set_meta("live_city_stamp",stamp)
						var upgrade:=Production.upgrade_level(game,int(city.team))
						visible_view.sync_buildings(city,upgrade)
						for hall in city.economy.buildings:
							if hall.type!="hall" or hall.get("virtual",false):continue
							var hall_stamp:=hash([hall.get("x",0),hall.get("z",0),hall.get("buildingRotationV228",0),upgrade,hall.get("houseDesignV354",{})])
							if int(visible_view.get_meta("live_hall_stamp",-1))!=hall_stamp:
								visible_view.set_meta("live_hall_stamp",hall_stamp)
								visible_view.place_hall(hall.x,hall.z,upgrade,float(hall.get("buildingRotationV228",0)),hall.get("houseDesignV354",{}))
							break
			if build_event.has("completed") and active:
				if detail_mode:detail_root.sync_buildings(city,Production.upgrade_level(game,int(city.team)))
				update_status("Hoone valmis.")
		ArmyRecovery.tick(game,delta)
		if float(game.time)-float(game.get("lastAIResearchPlan",0))>=12.0:
			game.lastAIResearchPlan=game.time
			for team in [1,2,3]:
				var coastal:=ai_has_coastal_county(team)
				AIResearch.plan(game,team,coastal)
				manage_ai_settlers(team)
				for town in game.cities:
					if int(town.team)==team:
						AIHousing.plan(game,town)
						AISettlement.recruit(game,town)
				AIMilitary.plan_war(game,team)
				AIMilitary.scout(game,team,army_can_traverse,merchant_land_path,func(t,p):return Campaign.visible_now(game,t,p))
				AIMilitary.plan_attack(game,team,merchant_land_path)
				if "shipbuilding" in game.research[team].known:AINavy.plan(game,team,grid,ensure_sea_distances(),army_can_traverse,merchant_land_path,territory_allocation.get("territory",{}),prepare_ai_settlement_cell,ai_sea_site_ok)
			for town in game.cities:
				if int(town.team)>0 and not town.get("reservePendingV168",false):plan_ai_rural(town)
		var previous_age: int=game.ages[0]
		var previous_upgrade:=Production.upgrade_level(game,0)
		for research in game.research:
			if research.active!=null and float(research.get("discoveryInsight",0))>0:
				research.progress[research.active]=float(research.progress.get(research.active,0))+float(research.discoveryInsight)
				research.discoveryInsight=0.0
		var research_events := Research.tick_research(game,delta)
		if city_created and (int(game.ages[0])!=previous_age or Production.upgrade_level(game,0)!=previous_upgrade) and detail_mode and not settler_mode and not detail_inspection:
			var city: Dictionary=game.cities[active_city_index];var hall: Dictionary=city.economy.buildings[0]
			detail_root.place_hall(hall.x,hall.z,Production.upgrade_level(game,0),float(hall.get("buildingRotationV228",0)),hall.get("houseDesignV354",{}))
			detail_root.sync_buildings(city,Production.upgrade_level(game,0))
		if not research_events.is_empty():
			refresh_research_options()
			for event in research_events:
				if int(event.team)!=0:continue
				var name: String=Research.DATA.data.techs[event.id].name
				update_status(("Avastusboonus: " if event.get("boost",false) else "Uuritud: ")+name)
		research_refresh_clock += delta
		if research_refresh_clock >= 1.0:
			research_refresh_clock = 0
			update_research_status()
			update_resources_status()
			update_selected_building()
			refresh_build_info()
			refresh_army_options()
			refresh_settler_options()
	if detail_mode and detail_root!=null and not detail_inspection and (not city_created or settler_mode):
		detail_root.animate_settler(settler,elapsed)
		detail_root.update_wildlife({},elapsed,delta,local_nav,[{"x":settler.x,"z":settler.z}])
	elif detail_mode and detail_root!=null and detail_inspection:detail_root.update_wildlife({},elapsed,delta,null)
	for moving in game.settlers:
		# The web game advances settlers before AI orders are issued. Do not
		# consume part of the current frame immediately for a new migration path.
		if moving.has("aiMigrationPathIssuedAt"):
			var just_issued:bool=moving.aiMigrationPathIssuedAt==game.time;moving.erase("aiMigrationPathIssuedAt")
			if just_issued:continue
		var events:=Movement.advance_settler(moving,delta,elapsed<120.0,func(x,y):return Roads.road_boost(game,x,y,game.time),func(x,y):Roads.record_step(game,x,y,"settler",game.time))
		if not events.is_empty():
			settler_local_navs.erase(str(int(moving.id)))
			for event in events:
				Campaign.reveal(game,int(moving.team),event.to.x,event.to.y)
				collect_discovery(int(moving.team),{"c":event.to.x,"r":event.to.y})
			if int(moving.team)==0:refresh_fog()
			if int(moving.team)==0 and (not city_created or settler_mode) and int(moving.id)==int(settler.id):
				player=Vector2i(int(moving.c),int(moving.r))
				update_status("Teel; jäänud %d ruutu." % moving.path.size())
	if migration_active():follow_migration_band()
	update_marker()
	update_army_markers()
	update_landmark_markers()
	update_landmark_glow()
	update_raid_markers()
	update_merchant_markers()
	update_ship_markers()
	update_city_markers()
	update_other_settler_markers()
	update_world_roads()
	update_territory_visual()


func start_generation() -> void:
	if detail_mode: toggle_detail()
	if generation_thread != null and generation_thread.is_started():
		return
	pending_tempo=tempo_select.get_item_metadata(tempo_select.selected)
	var value := seed_input.text.strip_edges()
	var world_seed := Campaign.seed_from_text(value) if not value.is_empty() else (randi() & 0x7fffffff)
	paused = true
	generate_button.disabled = true
	update_status("Maailma loomine käib…")
	generation_thread = Thread.new()
	generation_thread.start(Callable(self, "generate_worker").bind(world_seed,{},pending_world_type))

func generate_worker(value: int,restored: Dictionary={},world_type:="tectonic") -> void:
	if restored.get("generatedWorldV331") is Dictionary and restored.generatedWorldV331.get("payload") is String:
		var imported:=WebSave.world(restored)
		if imported.has("error"):call_deferred("generation_failed",str(imported.error));return
		call_deferred("finish_generation",imported);return
	if not restored.is_empty():world_type=str(restored.get("type","tectonic"))
	var data:Dictionary
	if world_type=="inland":data=preload("res://scripts/legacy_world.gd").new(value).generate()
	elif world_type=="continents":data=preload("res://scripts/continent_world.gd").new(value).generate()
	else:data=WorldGenerator.new(value).generate()
	data.coastal_starts = Coastal.choose(Grid.COLS,Grid.ROWS,data.heights,data.starts)
	if data.coastal_starts.size() != 4:
		call_deferred("generation_failed", "Selle seemnega ei leitud nelja sobivat ranniku alguskohta.")
		return
	data.heights = preload("res://scripts/legacy_world.gd").plateau(data.heights,data.coastal_starts) if world_type=="inland" else Coastal.apply_plateaus(data.heights,Grid.COLS,Grid.ROWS,data.coastal_starts)
	data.grid = prepare_geography(data.heights,value,data.coastal_starts,world_type)
	data.world_type=world_type
	call_deferred("finish_generation", data)

func finish_generation(data: Dictionary) -> void:
	generation_thread.wait_to_finish()
	generation_thread = null
	outer_ring_surveys.clear()
	heights = data.heights
	heat = data.heat
	moisture = data.moisture
	latitudes = data.lat
	starts = data.coastal_starts
	grid = data.grid
	sea_distances=PackedInt32Array()
	player = Vector2i(int(starts[0].c), int(starts[0].r))
	selected=player;settler_command_mode=false
	game = Campaign.create_game(int(data.seed),data.starts,str(data.get("world_type","tectonic")))
	game.tempo=pending_tempo
	game.difficulty=pending_difficulty
	game.seedInputText=seed_input.text.strip_edges()
	Campaign.apply_coastal_starts(game,starts)
	game.migrationV274 = {"until":120}
	game.peaceUntilV276 = 1200
	game.landmarks=Discoveries.create_landmarks(grid,int(game.seed),starts)
	landmark_stamp=""
	if world_vegetation!=null:world_vegetation.reset_chunks()
	if game_hud!=null:game_hud.minimap.base_seed=null;game_hud.minimap.fog_stamp=""
	follow_migration_band()
	settler = game.settlers[0]
	road_visual_stamp=""
	territory_stamp="";territory_visual_stamp="";territory_allocation={}
	city_created = false
	settler_mode=false;selected_entity="settler";settler_select_stamp=""
	settler_local_navs.clear()
	if settler_row!=null:settler_row.visible=false
	active_city_index=0;city_select_stamp=""
	if city_row!=null:city_row.visible=false
	city_runtimes.clear();district_agents.clear();detail_unit_navs.clear();merchant_path_cache.clear()
	army_command_mode=false
	if army_row!=null:army_row.visible=false
	autosave_clock=0.0;autosave_pending=false
	simulation_paused=false
	simulation_pause_button.text="Peata mäng"
	labor_dialog.hide();resources_dialog.hide();training_dialog.hide()
	selected_world = {}
	site_position = Vector2.ZERO
	research_row.visible = false
	research_label.visible = false
	resources_label.visible = false
	resources_button.visible = false
	build_row.visible = false
	city_nav = null
	city_river_nav = null
	for a in game.settlers: Campaign.reveal(game,int(a.team),int(a.c),int(a.r))
	elapsed = 0.0
	terrain.queue_free()
	if not pending_load.is_empty():BridgeRules.restore(grid,pending_load.game.get("cities",[]))
	build_world()
	refresh_fog()
	camera_target = cell_position(player)+Vector3(1,0,1)
	update_camera()
	update_marker()
	paused = false
	generate_button.disabled = false
	if not pending_load.is_empty():
		apply_loaded_game()
	else:
		autosave_suspended=false
		update_status("Uus maailm valmis; vali asunikule sihtkoht.")

func _exit_tree() -> void:
	if generation_thread != null and generation_thread.is_started():
		generation_thread.wait_to_finish()
	clear_detail_landscape_cache()
	DetailView.HousePlanModel.clear_cache()
	DetailView.finish_asset_requests()
	DetailGroundMaterial.finish_requests()



static func prepare_geography(world_heights: PackedFloat32Array, seed_value: int, world_starts: Array,world_type:="tectonic") -> Array:
	var cells: Array = []
	for i in world_heights.size():
		var h: float = world_heights[i]
		var c:=i%Grid.COLS;var r:=floori(float(i)/Grid.COLS)
		var cell:Dictionary={"c":c,"r":r,"h":h,"land":h>=1.0,"mountain":h>30.0}
		if world_type in ["inland","continents"]:
			cell.legacyBiomeV250=true;cell.biome="sea" if h<1 else "hills" if h>30 else "forest" if Geography.noise(c+40,r+60,seed_value)>0.55 else "plains"
		cells.append(cell)
	if world_type=="inland":preload("res://scripts/legacy_world.gd").legacy_rivers(cells,seed_value,world_starts)
	else:
		Geography.drainage(cells,seed_value,world_starts,true,world_type!="continents")
		Geography.lake_outlets(cells,seed_value,world_starts)
	Geography.open_starting_passages(cells,world_starts)
	var deposit_kinds: Array=[]
	for type in CityRules.DATA.data.good_buildings:
		var deposit: Variant=CityRules.DATA.data.good_buildings[type].get("deposit")
		if deposit!=null and deposit!="grain" and deposit not in deposit_kinds:deposit_kinds.append(deposit)
	var counter:=0
	for cell in cells:
		cell.deposits={}
		if cell.land and not cell.mountain and not deposit_kinds.is_empty():
			cell.deposits[deposit_kinds[counter%deposit_kinds.size()]]=true;counter+=1
	Fisheries.initialize(cells,seed_value)
	return cells


func open_selected_tile() -> void:
	if detail_mode or selected.x<0 or selected.y<0:return
	var key:=str(selected.x)+":"+str(selected.y)
	if not reveal_all and not game.explored[0].has(key):update_status("Avasta ruut enne selle avamist.");return
	if selected==player:toggle_detail();return
	for i in game.cities.size():
		var city: Dictionary=game.cities[i]
		if int(city.team)==0 and int(city.c)==selected.x and int(city.r)==selected.y:
			for option in city_select.item_count:
				if int(city_select.get_item_metadata(option))==int(city.id):switch_city(option);toggle_detail();return
	world_camera_target=camera_target;world_zoom=zoom
	detail_root=Node3D.new();detail_root.set_script(DetailView);add_child(detail_root)
	var index:=selected.y*Grid.COLS+selected.x
	var forest_core: bool=is_forest_core(index)
	if not game.has("tileWorlds"):game.tileWorlds={}
	var tile_world: Dictionary={};var observed_city: Dictionary={};var observed_village: Dictionary={}
	detail_district={}
	if city_created and not settler_mode:
		refresh_city_territory()
		var parent:Dictionary=game.cities[active_city_index]
		var owner:Variant=territory_allocation.get("territory",{}).get(key)
		if owner!=null and int(owner.id)==int(parent.id) and int(owner.team)==0:
			var context:Variant=district_context_at(parent,selected,true)
			if context!=null and context.has("districtOf"):detail_district=context;observed_city=context;prepare_city_navigation(context)
	for landmark in game.get("landmarks",[]):
		if landmark.kind=="village" and int(landmark.c)==selected.x and int(landmark.r)==selected.y:observed_village=landmark;break
	for city in game.cities:
		if int(city.c)==selected.x and int(city.r)==selected.y:
			if int(city.team)==0 or Campaign.visible_now(game,0,city):observed_city=city
			break
	if not observed_city.is_empty():tile_world=observed_city.world
	else:
		if not game.tileWorlds.has(key):game.tileWorlds[key]=DetailWorldScript.create(grid,city_cell_data({"c":selected.x,"r":selected.y}),visual_biome(index),int(game.seed))
		tile_world=game.tileWorlds[key]
	DetailWorldScript.ensure_sea_fish(tile_world,grid[index],int(game.seed))
	if not observed_village.is_empty():tile_world=tile_world.duplicate(true)
	detail_root.build(grid,selected.x,selected.y,terrain_color(index),visual_biome(index),int(game.seed),forest_core,tile_world,float(heat[index]),float(moisture[index]),world_height_samples,world_river_graph)
	attach_detail_neighbors(selected)
	detail_root.person.visible=false
	if not observed_city.is_empty():
		var hall: Dictionary=observed_city.economy.buildings[0]
		if not hall.get("virtual",false):detail_root.place_hall(hall.x,hall.z,Production.upgrade_level(game,int(observed_city.team)),float(hall.get("buildingRotationV228",0)),hall.get("houseDesignV354",{}))
		detail_root.sync_buildings(observed_city,Production.upgrade_level(game,int(observed_city.team)))
		detail_root.add_village_life(self,"city:"+str(observed_city.id),int(observed_city.team))
	elif not observed_village.is_empty():
		var buildings:=Discoveries.village_layout(observed_village)
		var age:=Discoveries.village_age(game,observed_village)
		var hall: Dictionary=buildings[0]
		detail_root.place_hall(hall.x,hall.z,age,float(hall.buildingRotationV228),hall.get("houseDesignV354",{}))
		detail_root.sync_buildings({"economy":{"buildings":buildings}},age)
		detail_root.add_village_life(self,"landmark:"+str(observed_village.id),int(observed_village.get("claimedBy",-1)) if observed_village.get("claimedBy")!=null else -1)
	terrain.visible=false;fog.visible=false;marker.visible=false
	detail_mode=true;detail_inspection=true;army_command_mode=false;settler_command_mode=false
	if not detail_district.is_empty():selected_entity="city";selected_building_index=-1
	army_row.visible=false;settler_row.visible=false;found_button.visible=false;build_row.visible=not detail_district.is_empty()
	camera_target=Vector3.ZERO;zoom=191.7;detail_button.text="Tagasi maailmakaardile"
	update_camera();update_army_markers();update_city_markers();update_landmark_markers();update_raid_markers();update_merchant_markers();update_ship_markers();update_other_settler_markers();update_world_roads();update_territory_visual()
	update_status("Ruut %d:%d · detailkaart." % [selected.x+1,selected.y+1])

func toggle_detail() -> void:
	if battle_view!=null:
		if game.battle.get("result")!=null:close_battle_view()
		return
	if not detail_mode:
		detail_inspection=false
		if (not city_created or settler_mode) and not settler.path.is_empty():
			update_status("Oota asuniku saabumist.")
			return
		if settler_mode:refresh_city_territory()
		if settler_mode and territory_allocation.get("territory",{}).has(str(int(settler.c))+":"+str(int(settler.r))):
			update_status("See ruut kuulub olemasolevale linnale. Vali uus vaba ruut.")
			return
		world_camera_target = camera_target
		world_zoom = zoom
		detail_root = Node3D.new()
		detail_root.set_script(DetailView)
		add_child(detail_root)
		var index := player.y*Grid.COLS+player.x
		var forest_core: bool = is_forest_core(index)
		var tile_world: Dictionary
		if city_created and not settler_mode:
			tile_world=game.cities[active_city_index].world
		else:
			if not game.has("tileWorlds"):game.tileWorlds={}
			var key:=str(player.x)+":"+str(player.y)
			if not game.tileWorlds.has(key):
				var temp_city={"c":player.x,"r":player.y}
				var cell:=city_cell_data(temp_city)
				game.tileWorlds[key]=DetailWorldScript.create(grid,cell,visual_biome(index),int(game.seed))
			tile_world=game.tileWorlds[key]
		detail_root.build(grid,player.x,player.y,terrain_color(index),visual_biome(index),int(game.seed),forest_core,tile_world,float(heat[index]),float(moisture[index]),world_height_samples,world_river_graph)
		attach_detail_neighbors(player)
		site_position = Vector2(float(settler.get("x",0)),float(settler.get("z",0)))
		terrain.visible = false
		fog.visible = false
		marker.visible = false
		detail_mode = true
		army_command_mode=false
		army_row.visible=false
		if not city_created or settler_mode:settler.landed=true
		if not city_created or settler_mode:prepare_local_navigation()
		found_button.visible = not city_created or settler_mode
		settler_row.visible=false
		if city_created and not settler_mode:
			var city: Dictionary = game.cities[active_city_index]
			var hall: Dictionary = city.economy.buildings[0]
			detail_root.place_hall(hall.x,hall.z,Production.upgrade_level(game,int(city.team)),float(hall.get("buildingRotationV228",0)),hall.get("houseDesignV354",{}))
			detail_root.sync_buildings(city,Production.upgrade_level(game,int(city.team)))
			detail_root.add_village_life(self,"city:"+str(city.id),int(city.team))
			detail_root.sync_removed_resources(city.world.resources,elapsed,city.economy.buildings)
			build_row.visible = true
		if city_created and not settler_mode:
			var hall: Dictionary=game.cities[active_city_index].economy.buildings[0]
			camera_target=Vector3(hall.x,0,hall.z)
		else:camera_target=Vector3(float(settler.get("x",0)),0,float(settler.get("z",0)))
		zoom = 191.7
		detail_button.text = "Tagasi maailmakaardile"
		update_status("Detailkaart avatud.")
	else:
		if is_instance_valid(fpv_walker):fpv_walker.on_detail_closed()
		field_drag_start=null;field_preview=null;build_placement_mode=false;wall_stroke=[];clear_wall_preview()
		selected_building_index=-1
		update_selected_building()
		detail_root.queue_free()
		detail_root = null
		detail_district={}
		if selected_entity=="detail_unit":selected_entity="army" if selected_army()!=null else "city"
		detail_unit_source=-1;detail_unit_order=false
		if city_created and not settler_mode:prepare_city_navigation(game.cities[active_city_index])
		terrain.visible = true
		fog.visible = not reveal_all
		marker.visible = true
		detail_mode = false
		detail_inspection=false
		army_row.visible=city_created and not settler_mode
		settler_row.visible=city_created
		found_button.visible = false
		build_row.visible = false
		camera_target = world_camera_target
		zoom = world_zoom
		detail_button.text = "Ava linna detailkaart" if city_created and not settler_mode else "Ava asuniku detailkaart"
		update_status("Vali asunikule sihtkoht." if not city_created or settler_mode else "Vali vägi ja selle sihtkoht.")
	update_camera()
	update_marker()
	update_army_markers()
	update_landmark_markers()
	update_raid_markers()
	update_merchant_markers()
	update_city_markers()
	update_other_settler_markers()
	update_world_roads()
	update_territory_visual()


func local_dry(x: float,z: float) -> bool:
	return DetailTerrainScript.detail_height(detail_root.heights,x,z)>0.2 and detail_root.display_height(x,z)>0.05 and river_navigation_for(player.x,player.y,detail_root.heights).passable(x,z)

func select_city_site() -> void:
	if not detail_mode or detail_inspection or (city_created and not settler_mode): return
	if settler.get("localTarget") != null:
		update_status("Oota asuniku saabumist.")
		return
	site_position = Vector2(roundf(settler.x),roundf(settler.z))
	var occupied:=false
	for city in game.cities:
		if int(city.c)==int(settler.c) and int(city.r)==int(settler.r):occupied=true;break
	if city_created:refresh_city_territory()
	var tile_key:=str(int(settler.c))+":"+str(int(settler.r))
	var territory_owned: bool=territory_allocation.get("territory",{}).has(tile_key)
	var error := Settlement.site_rule(settler,site_position,game.cities,occupied,territory_owned,local_dry,detail_root.resources)
	if error != "":
		update_status(error + " Vali hiirega teine koht detailkaardil.")
		return
	settler.x = site_position.x
	settler.z = site_position.y
	selected_world = detail_root.world_data
	var result := Settlement.found_city(game,settler,selected_world)
	if result.has("chosen"):
		update_status(result.message)
	elif result.has("city"):
		finish_city_visuals(result.city)

func finish_selected_city() -> void:
	game.migrationV274.done = true
	var site: Dictionary = settler.chosenSiteV274
	var site_tile:=Vector2i(int(site.c),int(site.r))
	if detail_mode and (detail_inspection or player!=site_tile):toggle_detail()
	settler.c=site_tile.x;settler.r=site_tile.y;settler.path=[];settler.travelClock=0.0;settler.travelDuration=0.0
	settler.landed=true;settler.localTarget=null
	settler.x=site.x;settler.z=site.z;player=site_tile
	var result := Settlement.found_city(game,settler,selected_world)
	if result.has("city"):
		finish_city_visuals(result.city,true)
		if not detail_mode:camera_target=cell_position(player);world_camera_target=camera_target;update_camera()
		for army in game.armies:
			if int(army.team)==int(result.city.team):army.erase("hiddenInBandV274")
		refresh_army_options()

func finish_city_visuals(city: Dictionary,from_migration:=false) -> void:
	settler_local_navs.erase(str(int(settler.get("id",-1))))
	city_created = true
	settler_mode=false;selected_entity="city"
	active_city_index=game.cities.find(city)
	player=Vector2i(int(city.c),int(city.r));selected=player
	refresh_city_territory()
	if not detail_mode:detail_button.text="Ava linna detailkaart"
	if from_migration:
		for army in game.armies:
			if int(army.team)==int(city.team):army.c=city.c;army.r=city.r;army.path=[];army.travelClock=0.0;break
	army_row.visible=not detail_mode
	refresh_army_options()
	found_button.visible = false
	prepare_city_navigation(city)
	build_row.visible = detail_mode
	refresh_city_options()
	refresh_settler_options()
	research_row.visible = true
	research_label.visible = true
	resources_label.visible = true
	resources_button.visible = true
	refresh_research_options()
	update_research_status()
	if detail_mode:
		var hall: Dictionary = city.economy.buildings[0]
		detail_root.place_hall(hall.x,hall.z,Production.upgrade_level(game,int(city.team)),float(hall.get("buildingRotationV228",0)),hall.get("houseDesignV354",{}))
		detail_root.sync_buildings(city,Production.upgrade_level(game,int(city.team)))
		detail_root.add_village_life(self,"city:"+str(city.id),int(city.team))
		camera_target=Vector3(hall.x,0,hall.z)
		update_camera()
	update_status("Rajatud " + city.name + ".")


func attach_detail_neighbors(center: Vector2i) -> void:
	var neighbors:=Node3D.new();neighbors.name="NeighborTiles";neighbors.set_script(DetailNeighbors)
	detail_root.add_child(neighbors);neighbors.setup(self,center)
	var roads:=Node3D.new();roads.name="DetailRoads";roads.set_script(DetailRoads);roads.host=self;roads.center=center
	detail_root.add_child(roads)
	var trails:=Node3D.new();trails.name="DetailTrails";trails.set_script(DetailTrails);trails.host=self;trails.center=center
	detail_root.add_child(trails)

	var travellers:=Node3D.new();travellers.name="DetailTravellers";travellers.set_script(preload("res://scripts/detail_travellers.gd"));detail_root.add_child(travellers);travellers.setup(self,center)

func transition_detail_tile(next: Vector2i,delta: Vector2i) -> bool:
	if not detail_mode or battle_view!=null or not is_instance_valid(detail_root):return false
	if next.x<0 or next.x>=Grid.COLS or next.y<0 or next.y>=Grid.ROWS:return false
	if not reveal_all and not game.explored[0].has(str(next.x)+":"+str(next.y)):return false
	var old_center: Vector2i=selected if detail_inspection else player
	var previous_target:=camera_target;var previous_zoom:=zoom
	var saved_world_target:=world_camera_target;var saved_world_zoom:=world_zoom
	toggle_detail();selected=next;open_selected_tile()
	if not detail_mode:
		selected=old_center;open_selected_tile()
		if detail_mode:camera_target=previous_target;zoom=previous_zoom;update_camera()
		world_camera_target=saved_world_target;world_zoom=saved_world_zoom
		return false
	world_camera_target=saved_world_target;world_zoom=saved_world_zoom
	camera_target=previous_target-Vector3(delta.x*225.0,0,delta.y*195.0)
	zoom=previous_zoom;update_camera()
	return true

func follow_detail_camera() -> void:
	if not detail_mode or battle_view!=null or menu_open or not is_instance_valid(detail_root):return
	var dc:=1 if camera_target.x>112.5 else -1 if camera_target.x< -112.5 else 0
	var dr:=1 if camera_target.z>97.5 else -1 if camera_target.z< -97.5 else 0
	if dc==0 and dr==0:return
	var base: Vector2i=selected if detail_inspection else player
	if not transition_detail_tile(base+Vector2i(dc,dr),Vector2i(dc,dr)):
		camera_target.x=clampf(camera_target.x,-112.25,112.25)
		camera_target.z=clampf(camera_target.z,-97.25,97.25)
		update_camera()

# Find the live view of a visible neighbouring city without changing selection.
func visible_city_building_stamp(city: Dictionary) -> int:
	var data: Array=[Production.upgrade_level(game,int(city.team))]
	for b in city.economy.buildings:
		data.append([b.get("type",""),b.get("x",0),b.get("z",0),b.get("ready",false),float(b.get("hp",0))>0,b.get("virtual",false),b.get("buildingRotationV228",0),b.get("shoreAngle",0),b.get("width",0),b.get("depth",0),b.get("houseUpgradeLevelV218",0),b.get("woodFortTierV1757",0),b.get("houseDesignV354",{})])
	return hash(data)

func visible_city_detail(city: Dictionary) -> Node:
	if not detail_mode or not is_instance_valid(detail_root):return null
	if int(city.team)!=0 and not Campaign.visible_now(game,0,city):return null
	if (selected if detail_inspection else player)==Vector2i(int(city.c),int(city.r)):return detail_root
	var neighbors: Node=detail_root.get_node_or_null("NeighborTiles")
	if neighbors==null:return null
	for tile in neighbors.get_children():
		if tile.get_meta("coords",Vector2i(-1,-1))==Vector2i(int(city.c),int(city.r)):
			return tile.get_node_or_null("Nature")
	return null

func detail_unit_nav(tile: Vector2i,source: int) -> Variant:
	var context:Variant=DistrictContexts.at_city(game.get("cities",[]),tile);var base:Variant=null
	if context!=null:base=ensure_city_runtime(context).nav
	else:base=ensure_settler_navigation({"id":-10000000-tile.y*Grid.COLS-tile.x,"c":tile.x,"r":tile.y})
	if base==null:return null
	var key:="%d:%d:%d" % [tile.x,tile.y,source]
	if not detail_unit_navs.has(key) or int(detail_unit_navs[key].revision)!=int(base.revision):detail_unit_navs[key]={"revision":base.revision,"nav":base.clone_for_agent()}
	return detail_unit_navs[key].nav

func select_detail_unit(source: int) -> void:
	if source<0 or source>=game.units.size() or int(game.units[source].team)!=0:return
	detail_unit_source=source;detail_unit_order=false;selected_entity="detail_unit"
	var selected_unit:Dictionary=game.units[source]
	for i in army_select.item_count:
		var army_index:=int(army_select.get_item_metadata(i));var army:Dictionary=game.armies[army_index]
		if int(army.team)==int(selected_unit.team) and int(army.get("id",0))==int(selected_unit.get("armyId",0)):army_select.select(i);break
	selected_building_index=-1
	if game_hud!=null and game_hud.building_inspector!=null:game_hud.building_inspector.visible=false
	update_selected_building();update_status("Valitud: "+str(Economy.DATA.data.troops.get(game.units[source].kind,{}).get("name",game.units[source].kind))+" · M või paremklõps liigutab.")

func order_detail_unit(point: Vector2) -> void:
	if detail_unit_source<0 or detail_unit_source>=game.units.size():return
	var unit:Dictionary=game.units[detail_unit_source];var tile:Vector2i=selected if detail_inspection else player
	var nav:Variant=detail_unit_nav(tile,detail_unit_source)
	if nav==null:update_status("Üksuse teeleidmine pole sellel ruudul saadaval.");return
	var deployment:Dictionary=DetailDeployments.get_deployment(game,tile,detail_unit_source,unit)
	var travellers:Variant=detail_root.get_node_or_null("DetailTravellers");var entry:Variant=travellers.entries.get("unit:%d" % detail_unit_source) if travellers!=null else null
	if unit.kind=="scout" and not deployment.get("scoutDetailActiveV240",false) and entry!=null:
		deployment.x=entry.root.position.x;deployment.z=entry.root.position.z
	var goal:Variant=nav.nearest({"x":point.x,"z":point.y},6)
	if goal==null or nav.route(deployment,goal)==null:update_status("Üksus ei pääse sellesse kohta.");return
	deployment.target=goal;deployment.manualOrder=true;detail_unit_order=false
	for army in game.armies:
		if int(army.team)==int(unit.team) and int(army.get("id",0))==int(unit.get("armyId",0)):
			army.path=[];army.autoExplore=false
			if unit.kind=="scout":deployment.scoutDetailActiveV240=true
			break
	update_status("Üksus liigub valitud kohta.")

func stop_detail_unit() -> void:
	if detail_unit_source<0 or detail_unit_source>=game.units.size():return
	var tile:Vector2i=selected if detail_inspection else player;var unit:Dictionary=game.units[detail_unit_source]
	var deployment:Dictionary=DetailDeployments.get_deployment(game,tile,detail_unit_source,unit)
	deployment.target=null;deployment.moving=false;detail_unit_order=false;update_status("Üksus peatatud.")

func select_detail_position(screen: Vector2,force_move:=false) -> void:
	if detail_root == null: return
	if not build_placement_mode:
		var local_hit:Variant=detail_point(screen)
		var travellers:Variant=detail_root.get_node_or_null("DetailTravellers")
		if local_hit!=null and travellers!=null:
			var point:=Vector2(float(local_hit.x),float(local_hit.z))
			if selected_entity=="detail_unit" and (force_move or detail_unit_order):order_detail_unit(point);return
			var picked:int=travellers.select_near(point)
			if picked>=0:select_detail_unit(picked);return
	if city_created and not settler_mode and can_build_on_detail() and not build_placement_mode:
		var buildings: Array=current_build_context().economy.buildings
		var picked: int=detail_root.pick_building(camera,screen,buildings)
		if picked>=0:select_building_index(picked);return
	var hit: Variant = detail_point(screen)
	if hit == null: return
	var delta:=Vector2i(floori((float(hit.x)+112.5)/225.0),floori((float(hit.z)+97.5)/195.0))
	if delta!=Vector2i.ZERO and not build_placement_mode:
		var base:=selected if detail_inspection else player
		var next:=base+delta
		if next.x<0 or next.x>=Grid.COLS or next.y<0 or next.y>=Grid.ROWS:return
		if not reveal_all and not game.explored[0].has(str(next.x)+":"+str(next.y)):update_status("Avasta ruut enne selle avamist.");return
		var previous:=camera_target;camera_target=Vector3(float(hit.x),camera_target.y,float(hit.z))
		if not transition_detail_tile(next,delta):camera_target=previous;update_camera()
		return
	if detail_inspection and detail_district.is_empty():update_status("Kaardiruut on vaatamiseks avatud.");return
	if (not city_created or settler_mode) and local_nav == null: return
	var target := {"x":roundf(hit.x),"z":roundf(hit.z)}
	if city_created and not settler_mode:
		if build_placement_mode and build_select.get_item_metadata(build_select.selected)!="field":
			target={"x":roundf(hit.x/2.0)*2.0,"z":roundf(hit.z/2.0)*2.0}
		build_position = Vector2(target.x,target.z)
		if build_placement_mode:place_city_building();return
		if select_building_at(build_position):return
		for resource in current_build_context().world.resources:
			if resource.get("depositSite",false) and not resource.get("removed",false) and Vector2(resource.x,resource.z).distance_to(build_position)<=6:
				update_status("Maardla: %s · varu %.0f. Vali sobiv kaevandus." % [Economy.DATA.data.resource_names.get(resource.kind,resource.kind),float(resource.amount)])
				return
		update_status("Ehituskoht: %d, %d. Vali hoone ja vajuta ehitusnuppu." % [target.x,target.z])
		return
	if local_nav.route(settler,target)==null:
		update_status("Asunik ei leia sellesse kohta teed.")
		return
	settler.localTarget = target
	update_status("Asunik liigub valitud kohta.")

func select_building_at(point: Vector2) -> bool:
	selected_building_index=-1
	if game_hud!=null and game_hud.building_inspector!=null:game_hud.building_inspector.visible=false
	if selected_entity=="building":selected_entity="city"
	if not city_created or not detail_mode:
		update_selected_building()
		return false
	var buildings: Array=current_build_context().economy.buildings
	for i in range(buildings.size()-1,-1,-1):
		var b: Dictionary=buildings[i]
		if float(b.get("hp",0))<=0 or b.get("virtual",false):continue
		var size: Variant=LocalNav.clearance(b)
		var hit: bool=FarmingRules.field_contains(b,{"x":point.x,"z":point.y}) if b.type=="field" else size!=null and absf(point.x-float(b.x))<=size.rx and absf(point.y-float(b.z))<=size.rz
		if hit:
			select_building_index(i)
			return true
	update_selected_building()
	return false

func select_building_index(index: int) -> void:
	selected_building_index=index;selected_entity="building"
	update_selected_building()
	if game_hud!=null and game_hud.building_inspector!=null:game_hud.building_inspector.show_selected()

func update_selected_building() -> void:
	if selected_building_row==null:return
	if not city_created or not detail_mode or selected_building_index<0 or selected_building_index>=current_build_context().economy.buildings.size():
		selected_building_row.visible=false
		return
	var b: Dictionary=current_build_context().economy.buildings[selected_building_index]
	var d: Dictionary=Economy.DATA.data.buildings.get(b.type,{})
	var label: String=d.get("name",b.type)
	if b.get("ready",false):
		label+=" · "+str(b.get("status","Valmis"))+" · tööjõud %.2f / %.0f" % [float(b.get("assigned",0)),float(d.get("workers",0))]
	else:
		label+=" · Ehitus %.0f%%" % (100.0*float(b.get("progress",0))/maxf(1,float(b.get("buildTimeV1757",d.get("time",1)))*Economy.tempo_factor(game)))
	selected_building_label.text=label
	var needed: float=(float(d.get("workers",0)) if b.type in Labor.IMPLEMENTED else 0.0) if b.get("ready",false) else 1.0
	selected_worker_limit.visible=needed>0 and b.type!="hall"
	selected_worker_limit.set_block_signals(true)
	selected_worker_limit.max_value=needed
	selected_worker_limit.set_value_no_signal(0 if b.get("disabled",false) else float(b.get("workerLimit",needed)))
	selected_worker_limit.set_block_signals(false)
	selected_building_toggle.visible=b.type!="hall"
	if b.get("ready",false):selected_building_toggle.text="Jätka tööd" if b.get("disabled",false) else "Peata töö"
	else:selected_building_toggle.text="Jätka ehitust" if b.get("disabled",false) else "Peata ehitus"
	selected_building_row.visible=true

func change_selected_worker_limit(value: float) -> void:
	if not city_created or not detail_mode or selected_building_index<0 or selected_building_index>=current_build_context().economy.buildings.size():return
	var building: Dictionary=current_build_context().economy.buildings[selected_building_index]
	if building.type=="hall":return
	building.workerLimit=value
	building.disabled=value==0
	Labor.allocate(game,game.cities[active_city_index])
	update_selected_building()

func toggle_selected_building() -> void:
	if not city_created or not detail_mode or selected_building_index<0 or selected_building_index>=current_build_context().economy.buildings.size():return
	var b: Dictionary=current_build_context().economy.buildings[selected_building_index]
	if b.type=="hall":return
	if b.get("disabled",false) and float(b.get("workerLimit",1))==0:
		b.workerLimit=float(Economy.DATA.data.buildings[b.type].get("workers",0)) if b.get("ready",false) else 1.0
	b.disabled=not b.get("disabled",false)
	if not b.get("ready",false):b.assigned=0.0;b.efficiency=0.0;b.workThisTick=0.0
	if b.disabled:b.status="Töö peatatud"
	else:b.status="Töö jätkub"
	Labor.allocate(game,game.cities[active_city_index])
	update_selected_building()

func rotate_selected_building() -> void:
	if not city_created or not can_build_on_detail() or settler_mode:return
	var city: Dictionary=current_build_context();var buildings: Array=city.economy.buildings
	if selected_building_index<0 or selected_building_index>=buildings.size():return
	var building: Dictionary=buildings[selected_building_index]
	var result:=BuildingOperations.rotate(game,city,building,func(x,z):return build_terrain_passable(x,z,city.team))
	if result.has("error"):update_status(result.error);return
	city_nav.rebuild(buildings,city.world.resources)
	if building.type=="hall":detail_root.place_hall(building.x,building.z,Production.upgrade_level(game,int(city.team)),float(building.get("buildingRotationV228",0)),building.get("houseDesignV354",{}))
	detail_root.sync_buildings(city,Production.upgrade_level(game,int(city.team)))
	detail_root.sync_removed_resources(city.world.resources,elapsed,buildings)
	update_selected_building();update_status("Hoone pööratud.")

func upgrade_selected_house() -> void:
	if not city_created or not can_build_on_detail() or settler_mode:return
	var city: Dictionary=current_build_context();var buildings: Array=city.economy.buildings
	if selected_building_index<0 or selected_building_index>=buildings.size():return
	var result:=BuildingOperations.upgrade_house(game,city,buildings[selected_building_index])
	if result.has("error"):update_status(result.error);return
	detail_root.sync_buildings(city,Production.upgrade_level(game,int(city.team)))
	update_selected_building();update_resources_status();update_status("Elamu täiustatud: mahutavus kahekordistus.")

func remove_selected_building() -> void:
	if not city_created or not can_build_on_detail() or settler_mode:return
	var city: Dictionary=current_build_context();var buildings: Array=city.economy.buildings
	if selected_building_index<0 or selected_building_index>=buildings.size():return
	var building: Dictionary=buildings[selected_building_index]
	var result:=BuildingOperations.remove(game,city,building)
	if result.has("error"):update_status(result.error);return
	selected_building_index=-1;selected_entity="city"
	var runtime:=ensure_city_runtime(city)
	runtime.production.synchronize(city_nav,city.world,buildings)
	Labor.allocate(game,game.cities[active_city_index])
	detail_root.sync_buildings(city,Production.upgrade_level(game,int(city.team)))
	detail_root.sync_removed_resources(city.world.resources,elapsed,buildings)
	update_selected_building();update_resources_status();update_status("Hoone kustutatud.")

func bridge_worksite(city: Dictionary) -> Variant:
	if city_nav==null:return null
	var hall: Dictionary={}
	for building in city.economy.buildings:
		if building.type=="hall" and building.get("ready",false) and float(building.get("hp",0))>0:hall=building;break
	if hall.is_empty():return null
	var key: String="%s:%s:%s:%s:%s:%s" % [city.id,city.c,city.r,city_nav.get_instance_id(),city_nav.revision,game.get("crossingRevision",0)]
	if bridge_access_cache.has(key):return bridge_access_cache[key]
	var result: Variant=city_nav.nearest_reachable(LocalNav.door(hall),{"x":0.0,"z":3.65},80)
	bridge_access_cache[key]=result
	if bridge_access_cache.size()>64:bridge_access_cache.erase(bridge_access_cache.keys()[0])
	return result

func activate_city_bridge(city:Dictionary) -> bool:
	var c:=int(city.c);var r:=int(city.r)
	if c<0 or r<0 or c>=Grid.COLS or r>=Grid.ROWS:return false
	var cell:Dictionary=grid[r*Grid.COLS+c]
	if cell.get("bridge",false):return false
	for building in city.economy.buildings:
		if building.get("type","")=="bridge" and building.get("ready",false) and float(building.get("hp",0))>0:
			cell.bridge=true;game.crossingRevision=int(game.get("crossingRevision",0))+1
			if not bridge_refresh_pending:bridge_refresh_pending=true;call_deferred("refresh_after_bridge")
			return true
	return false

func refresh_world_rivers() -> void:
	if not is_instance_valid(terrain) or not terrain.mesh is ArrayMesh:return
	var mesh: ArrayMesh=terrain.mesh
	while mesh.get_surface_count()>1:mesh.surface_remove(mesh.get_surface_count()-1)
	WorldRivers.add_surface(mesh,grid,world_height_samples,int(game.seed),world_river_graph)
	if mesh.get_surface_count()>1:
		var river:=ShaderMaterial.new();river.shader=load("res://scripts/world_river.gdshader");terrain.set_surface_override_material(1,river)
	if mesh.get_surface_count()>2:
		var banks:=ShaderMaterial.new();banks.shader=load("res://scripts/world_river_banks.gdshader");terrain.set_surface_override_material(2,banks)

func refresh_after_bridge() -> void:
	bridge_refresh_pending=false
	if generation_thread!=null or game.is_empty():return
	world_height_samples=WorldTerrain.samples(grid)
	world_river_graph=WorldRivers.prepare(grid,int(game.seed))
	refresh_world_rivers()
	river_navigation_cache.clear();detail_pick_heights.clear();detail_visual_cache.clear();detail_mesh_cache.clear();detail_ocean_cache.clear();clear_detail_landscape_cache()
	city_runtimes.clear();district_agents.clear();detail_unit_navs.clear();settler_local_navs.clear();merchant_path_cache.clear();bridge_access_cache.clear()
	if city_created and not settler_mode:prepare_city_navigation(game.cities[active_city_index])
	if game_hud!=null and game_hud.minimap!=null:game_hud.minimap.base_seed=null;game_hud.minimap.fog_stamp=""
	if detail_mode and battle_view==null:
		var tile: Vector2i=selected if detail_inspection else player
		var focus:=camera_target;var old_zoom:=zoom;var atlas_focus:=world_camera_target;var atlas_zoom:=world_zoom
		toggle_detail();selected=tile
		if tile==player:toggle_detail()
		else:open_selected_tile()
		if detail_mode:camera_target=focus;zoom=old_zoom;update_camera()
		world_camera_target=atlas_focus;world_zoom=atlas_zoom
	update_status("Sild valmis; jõgi on ületatav.")

func river_navigation_for(c: int,r: int,tile_heights: Array) -> RefCounted:
	var key:=str(c)+":"+str(r)
	if river_navigation_cache.has(key):return river_navigation_cache[key]
	var segments:=DetailLandscape.build(null,grid,c,r,tile_heights,int(game.seed),world_height_samples,world_river_graph,false)
	var nav:=RiverNavigation.new();nav.setup(segments,bool(grid[r*Grid.COLS+c].get("bridge",false)))
	river_navigation_cache[key]=nav
	return nav

func detail_visual_for(c: int,r: int) -> PackedVector4Array:
	var key: String="%d:%d:%d:%d" % [c,r,int(game.get("crossingRevision",0)),int(game.get("terrainRevision",0))]
	if detail_visual_cache.has(key):
		var cached: PackedVector4Array=detail_visual_cache[key]
		detail_visual_cache.erase(key);detail_visual_cache[key]=cached
		return cached
	var values:=VisualRiver.color_heights(grid,world_height_samples,c,r,int(game.seed),world_river_graph)
	detail_visual_cache[key]=values
	while detail_visual_cache.size()>100:detail_visual_cache.erase(detail_visual_cache.keys()[0])
	return values

func detail_mesh_for(c: int,r: int,heights: Array,visual: PackedVector4Array) -> ArrayMesh:
	var key: String="%d:%d:%d:%d" % [c,r,int(game.get("crossingRevision",0)),int(game.get("terrainRevision",0))]
	if detail_mesh_cache.has(key):
		var cached: ArrayMesh=detail_mesh_cache[key]
		detail_mesh_cache.erase(key);detail_mesh_cache[key]=cached
		return cached
	var mesh:=DetailTerrainScript.build_mesh(heights,Vector2.ZERO,visual)
	detail_mesh_cache[key]=mesh
	while detail_mesh_cache.size()>60:detail_mesh_cache.erase(detail_mesh_cache.keys()[0])
	return mesh

func detail_ocean_for(c: int,r: int,heights: Array,visual: PackedVector4Array) -> ShaderMaterial:
	var key: String="%d:%d:%d:%d" % [c,r,int(game.get("crossingRevision",0)),int(game.get("terrainRevision",0))]
	if detail_ocean_cache.has(key):
		var cached: ShaderMaterial=detail_ocean_cache[key]
		detail_ocean_cache.erase(key);detail_ocean_cache[key]=cached
		return cached
	var material:=DetailOcean.make_material(heights,visual);detail_ocean_cache[key]=material
	while detail_ocean_cache.size()>60:detail_ocean_cache.erase(detail_ocean_cache.keys()[0])
	return material

func clear_detail_landscape_cache() -> void:
	for item in detail_landscape_cache.values():
		if is_instance_valid(item.root):item.root.free()
	detail_landscape_cache.clear()

func detail_landscape_for(parent: Node3D,c: int,r: int,heights: Array,visual: PackedVector4Array) -> Array:
	var key: String="%d:%d:%d:%d" % [c,r,int(game.get("crossingRevision",0)),int(game.get("terrainRevision",0))]
	var entry: Dictionary
	if detail_landscape_cache.has(key):
		entry=detail_landscape_cache[key]
		detail_landscape_cache.erase(key);detail_landscape_cache[key]=entry
	else:
		var template:=Node3D.new()
		var segments:=DetailLandscape.build(template,grid,c,r,heights,int(game.seed),world_height_samples,world_river_graph,true,visual)
		entry={"root":template,"segments":segments};detail_landscape_cache[key]=entry
		while detail_landscape_cache.size()>40:
			var oldest: Variant=detail_landscape_cache.keys()[0];var item: Dictionary=detail_landscape_cache[oldest]
			if is_instance_valid(item.root):item.root.free()
			detail_landscape_cache.erase(oldest)
	var copy: Node=entry.root.duplicate()
	if copy!=null:parent.add_child(copy)
	return entry.segments

func prepare_local_navigation() -> void:
	var tile_heights: Array = detail_root.heights.duplicate()
	var cell: Dictionary = grid[player.y*Grid.COLS+player.x]
	var coast := false
	for d in [Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1)]:
		var c: int = player.x+d.x;var r: int = player.y+d.y
		if c>=0 and c<Grid.COLS and r>=0 and r<Grid.ROWS and not grid[r*Grid.COLS+c].land: coast=true
	var min_x := -132 if coast or cell.mountain else -109
	var min_z := -117 if coast or cell.mountain else -94
	var w := 265 if coast or cell.mountain else 219
	var h := 235 if coast or cell.mountain else 189
	var river:=river_navigation_for(player.x,player.y,tile_heights)
	var visual: PackedVector4Array=detail_root.visual_heights
	local_nav = LocalNav.new(min_x,min_z,w,h,func(x,z): return DetailTerrainScript.detail_height(tile_heights,x,z)>0.2 and DetailTerrainScript.visual_sample(visual,x,z).z>0.05 and river.passable(x,z))
	local_nav.bind_world(detail_root.world_data)
	local_nav.rebuild([],detail_root.resources)
	settler_local_navs[str(int(settler.id))]=local_nav
	var initial: Variant = local_nav.nearest(settler,80)
	if initial != null and settler.get("localTarget")==null:
		settler.x=initial.x;settler.z=initial.z
		detail_root.person.position=Vector3(settler.x,maxf(0,detail_root.display_height(settler.x,settler.z)),settler.z)

func ensure_settler_navigation(person: Dictionary) -> Variant:
	var id:=str(int(person.id))
	if settler_local_navs.has(id):return settler_local_navs[id]
	var c:=int(person.c);var r:=int(person.r)
	if c<0 or c>=Grid.COLS or r<0 or r>=Grid.ROWS:return null
	var key:=str(c)+":"+str(r)
	if not game.has("tileWorlds") or not game.tileWorlds.has(key):return null
	var heights:=DetailTerrainScript.tile_heights(grid,c,r)
	var coast: bool=is_coast(c,r) or bool(grid[r*Grid.COLS+c].mountain)
	var min_x: int=-132 if coast else -109;var min_z: int=-117 if coast else -94
	var w: int=265 if coast else 219;var h: int=235 if coast else 189
	var copy:=heights.duplicate()
	var river:=river_navigation_for(c,r,heights)
	var visual:=detail_visual_for(c,r)
	var nav:=LocalNav.new(min_x,min_z,w,h,func(x,z):return DetailTerrainScript.detail_height(copy,x,z)>0.2 and DetailTerrainScript.visual_sample(visual,x,z).z>0.05 and river.passable(x,z))
	nav.bind_world(game.tileWorlds[key])
	nav.rebuild([],game.tileWorlds[key].resources)
	settler_local_navs[id]=nav
	return nav

func refresh_research_options() -> void:
	if research_select == null or not city_created: return
	research_select.clear()
	var r: Dictionary = game.research[0]
	var planned: Array=r.known.duplicate()
	if r.active!=null:planned.append(r.active)
	planned.append_array(r.queue)
	for id in Research.DATA.data.techs:
		if Research.tech_block({"known":planned},id) == "":
			research_select.add_item(Research.DATA.data.techs[id].name)
			research_select.set_item_metadata(research_select.item_count-1,id)

func begin_research() -> void:
	if not city_created or research_select.item_count == 0: return
	var id: String = research_select.get_item_metadata(research_select.selected)
	var result := Research.start_research(game,0,id)
	if result.has("error"): update_status(result.error)
	else:refresh_research_options()
	update_research_status()

func queue_selected_research() -> void:
	if not city_created or research_select.item_count==0:return
	var id: String=research_select.get_item_metadata(research_select.selected)
	var result:=Research.queue_research(game,0,id)
	if result.has("error"):update_status(result.error)
	else:update_status("Uurimus lisati järjekorda.");refresh_research_options()
	update_research_status()

func toggle_research_pause() -> void:
	if not city_created:return
	var r: Dictionary=game.research[0]
	r.paused=not r.paused
	update_status("Uurimine on peatatud." if r.paused else "Uurimine jätkub.")
	update_research_status()

func update_research_status() -> void:
	if not city_created: return
	var r: Dictionary = game.research[0]
	if r.active == null:
		research_label.text = "Teadus: %.1f p/min · vali uurimus" % Research.science_rate(game,0)
	else:
		var tech: Dictionary = Research.DATA.data.techs[r.active]
		var cost := Research.research_cost(game,tech)
		research_label.text = "%s · %.1f / %.1f · %.1f p/min%s" % [tech.name,float(r.progress.get(r.active,0)),cost,Research.science_rate(game,0)," · peatatud" if r.paused else ""]
	if not r.queue.is_empty():
		var names: Array[String]=[]
		for id in r.queue:names.append(Research.DATA.data.techs[id].name)
		research_label.text+=" · Järjekord: "+", ".join(names)
	if r.get("ageWait") is Dictionary:
		var missing: Array[String]=[]
		for key in r.ageWait.missing:missing.append("%s %.0f" % [Economy.DATA.data.resource_names.get(key,key),r.ageWait.missing[key]])
		if not missing.is_empty():research_label.text+=" · Puudub: "+", ".join(missing)


func run_autosave() -> void:
	if autosave_pending:
		save_partial(true)
		autosave_pending=false

func save_partial(automatic := false,destination: String=SAVE_FILE) -> bool:
	if automatic and autosave_suspended:return false
	if paused or game.is_empty():
		update_status("Oota maailma loomise lõpetamist.")
		return false
	var saved_army: Variant=selected_army()
	var data := {"schema":1,"source":"2d9ff3999235ba8c95afa57d0cc0a245090ffc9d","game":game,"settler":settler,"selected_world":selected_world,"city_created":city_created,"settler_mode":settler_mode,"selected_entity":selected_entity,"active_army_id":int(saved_army.get("id",0)) if saved_army!=null else -1,"active_merchant_id":selected_merchant_id,"active_ship_id":selected_ship_id,"active_settler_id":int(settler.get("id",-1)),"active_city_id":int(game.cities[active_city_index].id) if city_created else -1,"site_position":[site_position.x,site_position.y]}
	var temp := destination + ".tmp"
	var file := FileAccess.open(temp,FileAccess.WRITE)
	if file == null:
		update_status("Salvestusfaili ei õnnestunud avada.")
		return false
	file.store_string(JSON.stringify(data))
	file.flush()
	var file_error := file.get_error()
	file.close()
	if file_error != OK:
		update_status("Salvestamine ebaõnnestus.")
		return false
	var save_path := ProjectSettings.globalize_path(destination)
	var temp_path := ProjectSettings.globalize_path(temp)
	if FileAccess.file_exists(destination):
		var backup_error := DirAccess.copy_absolute(save_path,save_path+".bak")
		if backup_error != OK:
			update_status("Salvestuse varukoopiat ei õnnestunud teha.")
			return false
		var remove_error := DirAccess.remove_absolute(save_path)
		if remove_error != OK:
			update_status("Vana salvestuse asendamine ebaõnnestus.")
			return false
	if DirAccess.rename_absolute(temp_path,save_path) != OK:
		update_status("Salvestuse lõpetamine ebaõnnestus; varukoopia säilitati.")
		return false
	update_status("Automaatsalvestus tehtud." if automatic else "Godoti vaheversioon salvestatud.")
	return true

func load_partial(destination: String=SAVE_FILE) -> void:
	if generation_thread != null and generation_thread.is_started(): return
	if not FileAccess.file_exists(destination) and not FileAccess.file_exists(destination+".bak"):
		update_status("Godoti vaheversiooni salvestust ei leitud.")
		return
	pending_from_backup = false
	var data: Variant = normalize_saved_game(read_partial_json(destination)) if FileAccess.file_exists(destination) else null
	if not valid_partial_save(data):
		var backup: Variant = normalize_saved_game(read_partial_json(destination+".bak")) if FileAccess.file_exists(destination+".bak") else null
		if not valid_partial_save(backup):
			update_status("Salvestus ja varukoopia on vigased või ei sobi selle vaheversiooniga.")
			return
		data = backup
		pending_from_backup = true
	if battle_view!=null:clear_battle_view()
	battle_nav=null;battle_sim=null
	if detail_mode: toggle_detail()
	labor_dialog.hide();resources_dialog.hide();training_dialog.hide()
	pending_load = data
	paused = true
	generate_button.disabled = true
	update_status("Salvestatud maailma loomine käib…")
	generation_thread = Thread.new()
	generation_thread.start(Callable(self,"generate_worker").bind(int(data.game.seed),data.game))

func apply_loaded_game() -> void:
	var data := pending_load
	pending_load = {}
	autosave_suspended=false
	game = data.game
	for city in game.get("cities",[]):DistrictContexts.restore(city)
	district_agents.clear();detail_district={}
	seed_input.text=str(game.get("seedInputText",""))
	for i in tempo_select.item_count:
		if str(tempo_select.get_item_metadata(i))==str(game.get("tempo","normal")):
			tempo_select.select(i);break
	if not game.has("strategyPacingV125"):game.strategyPacingV125=true
	if not game.has("landmarks"):game.landmarks=Discoveries.create_landmarks(grid,int(game.seed),starts)
	landmark_stamp=""
	settler_local_navs.clear()
	active_city_index=0;city_select_stamp=""
	city_runtimes.clear();district_agents.clear();detail_unit_navs.clear();merchant_path_cache.clear()
	road_visual_stamp=""
	territory_stamp="";territory_visual_stamp="";territory_allocation={}
	city_created = data.get("city_created",false)
	settler_mode=city_created and data.get("settler_mode",false)
	selected_entity="city" if city_created and not settler_mode else "settler"
	settler_select_stamp=""
	settler = data.get("settler",{})
	if settler_mode:
		var saved_settler:=int(data.get("active_settler_id",-1))
		for candidate in game.settlers:
			if int(candidate.id)==saved_settler and int(candidate.team)==0:settler=candidate;break
		if settler.is_empty() or not game.settlers.has(settler):settler_mode=false
	if city_created:
		var saved_id:=int(data.get("active_city_id",game.cities[0].id))
		for i in game.cities.size():
			if int(game.cities[i].id)==saved_id:active_city_index=i;break
	if not city_created:
		for a in game.settlers:
			if int(a.team)==0 and int(a.id)==int(data.get("active_settler_id",0)): settler = a; break
	var location: Dictionary = game.cities[active_city_index] if city_created and not settler_mode and not game.cities.is_empty() else settler
	player = Vector2i(int(location.c),int(location.r))
	selected=player;settler_command_mode=false;army_command_mode=false;ship_command_mode=false
	elapsed = float(game.time)
	selected_world = data.get("selected_world",{})
	if not city_created and selected_world.is_empty():
		var tile_key:=str(int(settler.c))+":"+str(int(settler.r))
		selected_world=game.get("tileWorlds",{}).get(tile_key,{})
		if selected_world.is_empty():selected_world=DetailWorldScript.create(grid,city_cell_data(settler),visual_biome(int(settler.r)*Grid.COLS+int(settler.c)),int(game.seed))
	var saved_site: Array = data.get("site_position",[0,0])
	site_position = Vector2(saved_site[0],saved_site[1])
	camera_target = cell_position(player)
	update_marker()
	update_camera()
	refresh_fog()
	if city_created:
		refresh_city_territory()
		refresh_city_options()
		refresh_settler_options()
		settler_row.visible=true
		army_row.visible=not settler_mode
		detail_button.text="Ava asuniku detailkaart" if settler_mode else "Ava linna detailkaart"
		prepare_city_navigation(game.cities[active_city_index])
		research_row.visible = true
		research_label.visible = true
		resources_label.visible = true
		resources_button.visible = true
		army_row.visible=true
		refresh_army_options()
		refresh_research_options()
		update_research_status()
	refresh_army_options()
	if data.get("selected_entity","")=="army":
		var desired_id:=int(data.get("active_army_id",-1))
		for i in army_select.item_count:
			var army_index:=int(army_select.get_item_metadata(i))
			if int(game.armies[army_index].get("id",0))==desired_id:
				army_select.select(i);selected_entity="army";focus_selected_entity();break
	if data.get("selected_entity","")=="ship":
		selected_ship_id=int(data.get("active_ship_id",-1))
		if selected_ship()!=null:selected_entity="ship";focus_selected_entity()
	if data.get("selected_entity","")=="merchant":
		selected_merchant_id=int(data.get("active_merchant_id",-1))
		if selected_merchant()!=null:selected_entity="merchant";focus_selected_entity()
	update_status("Põhisalvestus puudus või oli vigane; laaditi varukoopia." if pending_from_backup else "Godoti vaheversiooni salvestus laaditud.")
	pending_from_backup = false
	if game.get("battle") is Dictionary:restore_field_battle()


func build_fog() -> void:
	fog_image = Image.create(Grid.COLS,Grid.ROWS,false,Image.FORMAT_RGBA8)
	fog_texture = ImageTexture.create_from_image(fog_image)
	fog = MeshInstance3D.new()
	rebuild_fog_mesh()
	var material:=ShaderMaterial.new()
	material.shader=load("res://scripts/world_fog.gdshader")
	material.set_shader_parameter("seen_linear",fog_texture)
	material.set_shader_parameter("seen_exact",fog_texture)
	fog.material_override=material
	update_fog_symbols()
	add_child(fog)
	fog.visible=not reveal_all
	refresh_fog()

func update_fog_symbols() -> void:
	var image:=Image.create(Grid.COLS,Grid.ROWS,false,Image.FORMAT_RGBA8)
	image.fill(Color.BLACK)
	for r in Grid.ROWS:
		for c in Grid.COLS:
			var x:=float(c*13+7);var z:=float(r*17+5)
			var n:=sin(x*127.1+z*311.7+float(game.seed)*0.017)*43758.5453
			if n-floor(n)<0.925:continue
			var cell: Dictionary=grid[r*Grid.COLS+c]
			var kind:=0.25 if not cell.land else 0.5 if cell.mountain else 0.75 if cell.get("biome","")=="forest" else 1.0
			image.set_pixel(c,r,Color(kind,0,0,1))
	var material: ShaderMaterial=fog.material_override
	material.set_shader_parameter("symbols",ImageTexture.create_from_image(image))

func rebuild_fog_mesh() -> void:
	var arrays: Array=terrain.mesh.surface_get_arrays(0)
	var vertices: PackedVector3Array=arrays[Mesh.ARRAY_VERTEX]
	var uvs:=PackedVector2Array();uvs.resize(vertices.size())
	for i in vertices.size():
		var v:=vertices[i];v.y+=0.15;vertices[i]=v
		uvs[i]=Vector2((v.x+Grid.COLS)/(Grid.COLS*2.0),(v.z+Grid.ROWS)/(Grid.ROWS*2.0))
	arrays[Mesh.ARRAY_VERTEX]=vertices;arrays[Mesh.ARRAY_TEX_UV]=uvs;arrays[Mesh.ARRAY_COLOR]=null
	var fog_mesh:=ArrayMesh.new();fog_mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays)
	fog.mesh=fog_mesh
func refresh_fog() -> void:
	if fog_image == null or game.is_empty(): return
	fog_image.fill(Color(0.39,0.35,0.27,0.96))
	for key in game.explored[0]:
		var parts := str(key).split(":")
		if parts.size() != 2: continue
		var c := int(parts[0]);var r := int(parts[1])
		if c >= 0 and c < Grid.COLS and r >= 0 and r < Grid.ROWS:
			fog_image.set_pixel(c,r,Color.TRANSPARENT)
	fog_texture.update(fog_image)

func toggle_fog() -> void:
	reveal_all = not reveal_all
	var settings:=ConfigFile.new();settings.load("user://kuningriigid_godot_settings.cfg")
	settings.set_value("interface","reveal_all",reveal_all);settings.save("user://kuningriigid_godot_settings.cfg")
	fog.visible = not reveal_all and not detail_mode
	fog_button.text = "Peida avastamata ala" if reveal_all else "Näita kogu kaarti"
	update_city_markers()
	update_world_roads()
	update_territory_visual()



func nearby_water(city: Dictionary) -> bool:
	for dr in range(-4,5):
		for dc in range(-4,5):
			var c: int = city.c+dc
			var r: int = city.r+dr
			if c < 0 or r < 0 or c >= Grid.COLS or r >= Grid.ROWS: continue
			var cell: Dictionary = grid[r*Grid.COLS+c]
			if cell.get("river",false) or cell.get("lake",false) or cell.get("lakeOutletV275",false): return true
	return false

func tick_city_demographics(city: Dictionary,delta: float) -> void:
	var economy: Dictionary = city.economy
	var before := floori(float(economy.time)/60.0)
	economy.time += delta
	if floori(float(economy.time)/60.0) > before:
		Economy.demographics_turn(city,economy,DistrictContexts.all_buildings(city) if not city.get("districts",{}).is_empty() else economy.buildings,nearby_water(city),int(game.ages[city.team]),Economy.tempo_factor(game))
		economy.resources = economy.realms[city.team].resources
		economy.pop = economy.realms[city.team].pop
		economy.tech = economy.realms[city.team].tech

func ensure_sea_distances() -> PackedInt32Array:
	if sea_distances.size()!=grid.size():sea_distances=Naval.sea_distances(grid)
	return sea_distances

func finish_ship_job(state: Dictionary,city: Dictionary,job: Dictionary) -> bool:
	return Naval.finish_ship(state,city,job,grid,ensure_sea_distances())

func show_training() -> void:
	if not city_created:return
	refresh_training_status()
	refresh_recruitment_info()
	refresh_retraining_options()
	training_dialog.popup_centered(Vector2i(500,430));fit_game_dialog(training_dialog,Vector2i(500,430))

func refresh_recruitment_info() -> void:
	if not city_created or unit_select.item_count==0:return
	var kind: String=unit_select.get_item_metadata(unit_select.selected)
	var grade: String=grade_select.get_item_metadata(grade_select.selected)
	var definition: Dictionary=Naval.SHIPS.data[kind] if Naval.SHIPS.data.has(kind) else Economy.DATA.data.troops[kind]
	var cost:=Recruitment.troop_cost(definition,grade)
	var parts: Array[String]=[]
	for key in cost:parts.append("%s %.1f" % [Economy.DATA.data.resource_names.get(key,key),float(cost[key])])
	var info: String="Maksumus: "+(", ".join(parts) if not parts.is_empty() else "tasuta")
	var city: Dictionary=game.cities[active_city_index]
	var preview_city={"team":city.team,"c":city.c,"r":city.r,"economy":{"realms":city.economy.realms.duplicate(true),"buildings":city.economy.buildings},"training":city.get("training",[]).duplicate(true),"districts":city.get("districts",{})}
	var preview: Dictionary=Naval.queue_ship(game,preview_city,kind,grade,grid,ensure_sea_distances()) if Naval.SHIPS.data.has(kind) else Recruitment.queue_land_unit(game,preview_city,kind,grade)
	if preview.has("error"):info+="\n"+str(preview.error)
	recruitment_info.text=info

func queue_selected_unit() -> void:
	if not city_created or unit_select.item_count==0:return
	var kind: String=unit_select.get_item_metadata(unit_select.selected)
	var grade: String=grade_select.get_item_metadata(grade_select.selected)
	var result: Dictionary=Naval.queue_ship(game,game.cities[active_city_index],kind,grade,grid,ensure_sea_distances()) if Naval.SHIPS.data.has(kind) else Recruitment.queue_land_unit(game,game.cities[active_city_index],kind,grade)
	if result.has("error"):
		training_status.text=result.error
		update_status(result.error)
	else:
		update_resources_status();refresh_training_status()

func refresh_retraining_options() -> void:
	if retrain_select==null or not city_created:return
	retrain_select.clear();var city: Dictionary=game.cities[active_city_index]
	for source in game.units.size():
		var unit: Dictionary=game.units[source]
		if int(unit.team)!=0 or float(unit.get("hp",0))<=0 or ArmyExperience.is_garrisoned(unit):continue
		var replacement: Variant=EraAvailability.unit_successor(game,0,unit.kind)
		if replacement==null:continue
		var home:=false
		for army in game.armies:
			if int(army.team)==0 and int(army.get("id",0))==int(unit.get("armyId",0)) and int(army.c)==int(city.c) and int(army.r)==int(city.r) and army.get("path",[]).is_empty():home=true;break
		if not home:continue
		var old_name: String=Economy.DATA.data.troops[unit.kind].name;var new_name: String=Economy.DATA.data.troops[replacement].name
		retrain_select.add_item(old_name+" → "+new_name);retrain_select.set_item_metadata(retrain_select.item_count-1,{"source":source,"kind":replacement})
	if retrain_select.item_count==0:retrain_select.add_item("Linnas ei ole ümberõpetatavaid üksusi");retrain_select.set_item_metadata(0,null)

func retrain_selected_unit() -> void:
	if retrain_select==null or retrain_select.selected<0:return
	var option: Variant=retrain_select.get_item_metadata(retrain_select.selected)
	if option==null:update_status("Linnas ei ole ümberõpetatavaid üksusi.");return
	var result:=Recruitment.queue_retraining(game,game.cities[active_city_index],int(option.source),str(option.kind))
	if result.has("error"):training_status.text=result.error;update_status(result.error);return
	update_resources_status();refresh_training_status();refresh_retraining_options();update_status("Üksus lisati tasulisse ümberõppesse.")

func refresh_training_status() -> void:
	if not city_created:return
	var city: Dictionary=game.cities[active_city_index]
	var lines: Array[String]=[]
	for job in city.get("training",[]):
		lines.append("%s%s · %.0f / %.0f" % ["Ümberõpe: " if job.get("upgradeSource")!=null else "",(Naval.SHIPS.data.get(job.kind,{}) if job.get("ship",false) else Economy.DATA.data.troops.get(job.kind,{})).get("name",job.kind),float(job.progress),float(job.total)])
	var count:=0
	for unit in game.units:
		if unit.team==city.team and float(unit.get("hp",0))>0:count+=1
	training_status.text="Üksusi: %d\n%s" % [count,"\n".join(lines) if not lines.is_empty() else "Väljaõppe järjekord on tühi."]

func show_basic_labor() -> void:
	if not city_created:return
	labor_structure_stamp=""
	labor_dialog.hide();game_hud.dock_menu.open_menu("labor")

func refresh_basic_labor() -> void:
	if not city_created:return
	var city: Dictionary=game.cities[active_city_index]
	var realm: Dictionary=city.economy.realms[city.team]
	var employed:=float(realm.get("employed",0));var population:=float(realm.pop)
	labor_summary_cards.workers.value.text="%.2f / %.0f" % [employed,population];labor_summary_cards.workers.sub.text="Vabu %.2f" % maxf(0,population-employed)
	for key in ["bread","grain","wood","stone"]:
		labor_summary_cards[key].value.text="%.1f / min" % labor_delivered_per_minute(realm,float(city.economy.time),key)
		labor_summary_cards[key].sub.text="Viimase 5 min keskmine"
	labor_summary_cards.science.value.text="%.1f p / min" % Research.science_rate(game,int(city.team));labor_summary_cards.science.sub.text="Kogu riigis"
	labor_summary.text="Eluasemeid %.1f · Toiduvajadus %.1f / min · Veevajadus %.1f / min" % [Economy.housing_capacity(city.economy.buildings),population*0.6,population*0.45]
	labor_builder_limit.set_block_signals(true);labor_builder_limit.max_value=maxf(3,float(realm.pop))
	labor_builder_limit.set_value_no_signal(float(city.get("builderCount",1)));labor_builder_limit.set_block_signals(false)
	labor_builder_status.text="Tööl %.2f" % float(city.get("buildersAssigned",0))
	var structures: Array=[]
	for building in city.economy.buildings:
		if building.get("virtual",false) or not building.get("ready",false) or float(building.get("hp",0))<=0 or building.type not in Labor.IMPLEMENTED:continue
		var definition: Dictionary=Economy.DATA.data.buildings.get(building.type,{})
		if float(definition.get("workers",0))<=0:continue
		structures.append(building)
	var stamp:=str(city.id)+":"+str(structures.map(func(b):return [b.type,b.get("x"),b.get("z"),b.get("id")]))
	var changed:=stamp!=labor_structure_stamp or structures.size()!=labor_workplace_rows.size()
	if not changed:
		for i in structures.size():
			if not is_same(structures[i],labor_workplace_rows[i].building):changed=true;break
	if changed:
		labor_structure_stamp=stamp;labor_workplace_rows.clear()
		for child in labor_workplaces.get_children():labor_workplaces.remove_child(child);child.queue_free()
		for building in structures:
			var definition: Dictionary=Economy.DATA.data.buildings[building.type]
			var row:=HBoxContainer.new();labor_workplaces.add_child(row)
			var name:=Label.new();name.text=str(definition.get("icon","⌂"))+" "+str(definition.name);name.size_flags_horizontal=Control.SIZE_EXPAND_FILL;row.add_child(name)
			var limit:=SpinBox.new();limit.min_value=0;limit.max_value=float(definition.get("workers",0));limit.step=0.01;limit.custom_arrow_step=0.25;limit.custom_minimum_size.x=88
			limit.value_changed.connect(change_workplace_labor.bind(building));row.add_child(limit)
			var status:=Label.new();status.custom_minimum_size.x=85;row.add_child(status)
			labor_workplace_rows.append({"building":building,"limit":limit,"status":status,"name":name})
	for item in labor_workplace_rows:
		var building: Dictionary=item.building;var definition: Dictionary=Economy.DATA.data.buildings[building.type]
		var limit: SpinBox=item.limit;limit.set_block_signals(true)
		limit.set_value_no_signal(0.0 if building.get("disabled",false) else float(building.get("workerLimit",definition.get("workers",0))));limit.set_block_signals(false)
		item.status.text="Tööl %.2f" % float(building.get("assigned",0));item.name.tooltip_text=str(building.get("status","Ootab"))+" · %d%%" % roundi(float(building.get("efficiency",0))*100)
	var training: Array=city.get("training",[]);labor_training_row.visible=not training.is_empty()
	if not training.is_empty():
		var job: Dictionary=training[0];labor_training_limit.set_block_signals(true);labor_training_limit.set_value_no_signal(float(job.get("workerLimit",1)));labor_training_limit.set_block_signals(false)
		labor_training_status.text="Tööl %.2f" % float(job.get("assigned",0))
	var jobs: Dictionary=city.get("basicJobs",{"berries":1,"wood":1,"stone":1})
	var assigned: Dictionary=city.get("basicAssigned",{})
	for key in ["berries","wood","stone"]:
		var control: SpinBox=basic_job_limits[key]
		control.set_block_signals(true)
		control.max_value=maxf(3,float(city.economy.realms[city.team].pop))
		control.set_value_no_signal(float(jobs.get(key,1)))
		control.set_block_signals(false)
		var status_label: Label=basic_job_status[key]
		status_label.text="Tööl %.2f" % float(assigned.get(key,0))

func change_builder_limit(value: float) -> void:
	if not city_created:return
	var city: Dictionary=game.cities[active_city_index];city.builderCount=snappedf(value,0.25)
	Labor.allocate(game,city);refresh_basic_labor()

func labor_delivered_per_minute(realm: Dictionary,seconds: float,key: String) -> float:
	var end:=floori(seconds/60.0);var total:=0.0
	for minute in realm.get("deliveryHistory",{}):
		var n:=int(minute)
		if n>=end-4 and n<=end:total+=float(realm.deliveryHistory[minute].get(key,0))
	return total/minf(5.0,maxf(1.0,ceilf(seconds/60.0)))

func change_workplace_labor(value: float,building: Dictionary) -> void:
	if not city_created:return
	var city: Dictionary=game.cities[active_city_index]
	if not city.economy.buildings.has(building):return
	value=snappedf(value,0.25);building.workerLimit=value;building.disabled=value<=0.0
	Labor.allocate(game,city);refresh_basic_labor()
	if is_instance_valid(game_hud.building_inspector) and game_hud.building_inspector.visible:game_hud.building_inspector.refresh()

func change_training_labor(value: float) -> void:
	if not city_created:return
	var city: Dictionary=game.cities[active_city_index];var training: Array=city.get("training",[])
	if training.is_empty():return
	training[0].workerLimit=snappedf(value,0.25);Labor.allocate(game,city);refresh_basic_labor()

func change_basic_labor(value: float,key: String) -> void:
	if not city_created:return
	var city: Dictionary=game.cities[active_city_index]
	if not city.has("basicJobs"):city.basicJobs={"berries":1,"wood":1,"stone":1}
	city.basicJobs[key]=snappedf(value,0.25)
	Labor.allocate(game,city)
	refresh_basic_labor()

func show_resource_details() -> void:
	if not city_created:return
	refresh_resource_details()
	resources_dialog.popup_centered(Vector2i(500,470));fit_game_dialog(resources_dialog,Vector2i(500,470))

func refresh_resource_details() -> void:
	if not city_created or resources_detail==null:return
	var stock: Dictionary=game.cities[active_city_index].economy.realms[0].resources
	var lines: Array[String]=[]
	for key in Economy.DATA.data.resource_names:
		var amount:=float(stock.get(key,0))
		if amount>0.00001 or key in ["wood","stone","water","bread","plank","clay","pottery","cutstone","copper","tin","bronze","carts","ore","coal","iron","weapons"]:
			lines.append("%s: %.1f" % [Economy.DATA.data.resource_names[key],amount])
	resources_detail.text="\n".join(lines)

func update_resources_status() -> void:
	if not city_created: return
	var realm: Dictionary = game.cities[active_city_index].economy.realms[0]
	var stock: Dictionary = realm.resources
	resources_label.text = "Elanikke %d · toit %.1f · vesi %.1f · puit %.1f · kivi %.1f" % [int(realm.pop),CityNeeds.food_total(stock),float(stock.get("water",0)),float(stock.get("wood",0)),float(stock.get("stone",0))]
	if resources_dialog.visible:refresh_resource_details()
	if labor_dialog.visible or (game_hud.dock_menu.visible and game_hud.dock_menu.kind=="labor"):refresh_basic_labor()
	if training_dialog.visible:
		refresh_training_status()
		refresh_recruitment_info()


func generation_failed(message: String) -> void:
	generation_thread.wait_to_finish()
	generation_thread = null
	pending_load = {}
	paused = false
	generate_button.disabled = false
	update_status(message)


func is_coast(c: int,r: int) -> bool:
	for d in [Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1)]:
		var x: int = c+d.x;var z: int = r+d.y
		if x>=0 and x<Grid.COLS and z>=0 and z<Grid.ROWS and not grid[z*Grid.COLS+x].land:return true
	return false

func city_cell_data(city: Dictionary) -> Dictionary:
	var c: int=city.c;var r: int=city.r
	var cell: Dictionary=grid[r*Grid.COLS+c]
	if not cell.land or cell.get("webGeneratedV331",false):return cell
	var biome:=visual_biome(r*Grid.COLS+c)
	var n:=Geography.noise(c+181,r+43,int(game.seed))
	var start:=false
	for p in starts:
		if int(p.c)==c and int(p.r)==r:start=true;break
	var basic_forest: bool = str(cell.get("biome",""))=="forest" if cell.get("legacyBiomeV250",false) else not cell.mountain and (Geography.noise(c+40,r+60,int(game.seed))>0.55 if int(game.get("geographyVersion",7))<7 else moisture[r*Grid.COLS+c]+(Geography.noise(c+40,r+60,int(game.seed))-0.5)*0.12>0.66)
	cell.biome="hills" if cell.mountain else "forest" if basic_forest else "plains"
	var wood:=basic_forest or n>0.35 or start if int(game.get("geographyVersion",7))<7 else biome in ["forest","jungle","taiga","lush_river","grassland"] or (biome=="steppe" and n>0.35) or start
	var stone: bool = cell.h>16 or n<0.3 or start
	if not cell.has("detailCoastPort"):
		var h:=DetailTerrainScript.tile_heights(grid,c,r)
		cell.detailCoastPort=h.min()<0 and h.max()>0
	var water: bool = start or cell.detailCoastPort or cell.get("river",false) or Geography.noise(c+19,r+29,int(game.seed))>0.58
	var game_resource:=start or (wood and Geography.noise(c+731,r+85,int(game.seed))>0.28)
	var ore: bool=cell.h>16 and Geography.noise(c,r+883,int(game.seed))>0.35
	var base_deposits={"wood":wood,"stone":stone,"water":water,"game":game_resource,"grain":not cell.mountain and not basic_forest and n>0.24,"ore":ore,"oil":not cell.mountain and Geography.noise(c+615,r+399,int(game.seed))>0.76,"clay":start or (water and Geography.noise(c+240,r+340,int(game.seed))>0.28),"copper":start or (ore and Geography.noise(c+370,r+470,int(game.seed))>0.38),"tin":start or (ore and Geography.noise(c+390,r+490,int(game.seed))>0.52),"fish":cell.get("river",false)}
	for kind in base_deposits:cell.deposits[kind]=base_deposits[kind]
	return cell

func ensure_city_runtime(city: Dictionary) -> Dictionary:
	var key:=str(int(city.id))+(":"+str(int(city.c))+":"+str(int(city.r)) if city.has("districtOf") else "")
	if city_runtimes.has(key):return city_runtimes[key]
	var heights:=DetailTerrainScript.tile_heights(grid,int(city.c),int(city.r))
	var coast:=is_coast(int(city.c),int(city.r))
	var min_x: int=-132 if coast else -109
	var min_z: int=-117 if coast else -94
	var w: int=265 if coast else 219
	var h: int=235 if coast else 189
	# Existing trail indices are relative to the bounds saved by the web game.
	var bounds: Variant=city.world.get("navBounds")
	if bounds is Dictionary:
		if int(bounds.get("minX",0)) == -109 and int(bounds.get("minZ",0)) == -94 and int(bounds.get("w",0)) == 219 and int(bounds.get("h",0)) == 189:
			min_x=-109;min_z=-94;w=219;h=189
		elif int(bounds.get("minX",0)) == -132 and int(bounds.get("minZ",0)) == -117 and int(bounds.get("w",0)) == 265 and int(bounds.get("h",0)) == 235:
			min_x=-132;min_z=-117;w=265;h=235
	var heights_copy:=heights.duplicate()
	var river:=river_navigation_for(int(city.c),int(city.r),heights)
	var visual:=detail_visual_for(int(city.c),int(city.r))
	var nav:=LocalNav.new(min_x,min_z,w,h,func(x,z):return DetailTerrainScript.detail_height(heights_copy,x,z)>0.2 and DetailTerrainScript.visual_sample(visual,x,z).z>0.05 and river.passable(x,z))
	nav.bind_world(city.world)
	nav.rebuild(city.economy.buildings,city.world.resources)
	var production:=Lumber.new()
	for cargo in city.economy.cargo:
		if cargo.has("portCargoId"):production.next_cargo_id=maxi(production.next_cargo_id,int(cargo.portCargoId)+1)
	var runtime={"heights":heights,"visual":visual,"nav":nav,"river":river,"production":production,"training":Training.new(),"market":MarketHouseholds.new(),"builder_navs":{}}
	city_runtimes[key]=runtime
	return runtime

func prepare_city_navigation(city: Dictionary) -> void:
	var runtime:=ensure_city_runtime(city)
	city_heights=runtime.heights
	city_nav=runtime.nav
	city_river_nav=runtime.river
	lumber_sim=runtime.production
	training_sim=runtime.training

func build_terrain_passable(x: float,z: float,_team: int) -> bool:
	if DetailTerrainScript.detail_height(city_heights,x,z)<=0.2 or (city_river_nav!=null and not city_river_nav.passable(x,z)):return false
	if active_city_index>=0 and active_city_index<game.cities.size():
		var city: Dictionary=current_build_context()
		if DetailTerrainScript.visual_sample(detail_visual_for(int(city.c),int(city.r)),x,z).z<=0.05:return false
	return true

func build_site_clear(x: float,z: float,type: String,_team: int) -> bool:
	for resource in current_build_context().world.resources:
		if resource.kind in ["tree","berry","game","fish"] or resource.get("removed",false):continue
		if MineralSites.TYPES.get(type,"")==resource.kind and resource.get("depositSite",false):continue
		var distance: float = 10 if resource.get("depositSite",false) else 4.5
		if absf(resource.x-x)<distance and absf(resource.z-z)<distance:return false
	return true

func refresh_build_info() -> void:
	if build_info==null or build_select==null or build_select.item_count==0:return
	var type: String=build_select.get_item_metadata(build_select.selected)
	var definition: Dictionary=Economy.DATA.data.buildings[type]
	var costs: Array[String]=[]
	for key in definition.get("cost",{}):
		costs.append("%s %.0f" % [Economy.DATA.data.resource_names.get(key,key),float(definition.cost[key])])
	var text: String="Maksumus: "+(", ".join(costs) if not costs.is_empty() else "tasuta")
	if city_created:
		var city: Dictionary=game.cities[active_city_index]
		var rule:=CityRules.urban_rule(game,city,city_cell_data(city),type,is_coast(int(city.c),int(city.r)),city_has_river(city))
		if not rule.is_empty():text+=" · "+rule
		elif not Economy.can_afford(city.economy.realms[city.team].resources,definition.get("cost",{})):text+=" · Materjale ei jätku"
	build_info.text=text

func update_field_controls(index: int) -> void:
	refresh_build_info()
	var field_selected: bool=build_select.get_item_metadata(index)=="field"
	field_width.visible=field_selected;field_depth.visible=field_selected
	if not field_selected:
		field_drag_start=null
		if field_preview!=null:field_preview.queue_free();field_preview=null

func place_city_building() -> void:
	if not city_created or settler_mode or not can_build_on_detail() or build_select.item_count==0:return
	var city: Dictionary=current_build_context()
	var type: String=build_select.get_item_metadata(build_select.selected)
	var rural_error:=district_county_rule(city,type)
	if not rural_error.is_empty():update_status(rural_error);return
	var error:=CityRules.urban_rule(game,city,city_cell_data(city),type,is_coast(int(city.c),int(city.r)),city_has_river(city),DistrictContexts.all_buildings(game.cities[active_city_index]) if city.has("districtOf") else [])
	if not error.is_empty():update_status(error);return
	if type=="bridge":
		var access: Variant=bridge_worksite(city)
		if access==null:update_status("Ehitaja ei pääse jõe kaldale.");return
		var result:=BridgeRules.place(city,grid[int(city.r)*Grid.COLS+int(city.c)],build_angle)
		if result.has("error"):update_status(result.error);return
		result.building.accessEntry=access
		detail_root.sync_buildings(city,Production.upgrade_level(game,int(city.team)))
		build_placement_mode=false;clear_building_preview();update_resources_status();update_status("Silla ehitus on järjekorras.");return
	var target:=build_position
	var field: Dictionary={}
	var coast_placement: Dictionary={}
	var deposit_id: int=-1
	if type=="field":
		field={"x":target.x,"z":target.y,"width":field_width.value,"depth":field_depth.value}
		if build_angle!=null:field.buildingRotationV228=float(build_angle);field.freeRotationV243=true
		var field_error:=field_site_error(city,field)
		if not field_error.is_empty():update_status(field_error);return
	else:
		var check:=building_site_check(city,type,target)
		if check.has("error"):update_status(check.error);return
		target=check.point;coast_placement=check.coast;deposit_id=check.deposit_id
	var passable: Callable=build_terrain_passable
	if not coast_placement.is_empty():passable=func(_x,_z,_team):return true
	var economy:Dictionary=city.economy
	if city.has("districtOf"):
		economy=DistrictContexts.build_economy(game.cities[active_city_index],city)
	var result:=Economy.place_building(economy,0,type,target,passable,build_site_clear,true)
	if result.has("error"):update_status(result.error);return
	if city.has("districtOf"):city.economy.buildings.append(result.building)
	var design:Dictionary=game.get("houseDesignTemplatesV354",{}).get(type,{})
	if not design.is_empty() and str(design.get("id",""))==house_designer_id(type,city):result.building.houseDesignV354=design.duplicate(true)
	if not coast_placement.is_empty():
		for key in ["shoreAngle","landEntry","baseY","riverBankV276"]:
			if coast_placement.has(key):result.building[key]=coast_placement[key]
	if build_angle!=null:
		result.building.buildingRotationV228=float(build_angle);result.building.freeRotationV243=true
	if type=="field":
		result.building.width=field.width;result.building.depth=field.depth
		for resource in city.world.resources:
			if resource.kind in ["tree","berry","game"] and FarmingRules.field_contains(result.building,resource):
				resource.removed=true;resource.amount=0
		city.world.revision=int(city.world.get("revision",0))+1
	if type=="field" and field_preview!=null:field_preview.queue_free();field_preview=null
	if deposit_id>=0:result.building.depositId=deposit_id
	Builder.clear_footprint(city.world,result.building)
	city_nav.rebuild(city.economy.buildings,city.world.resources)
	detail_root.sync_buildings(city,Production.upgrade_level(game,int(city.team)))
	detail_root.sync_removed_resources(city.world.resources,elapsed,city.economy.buildings)
	update_resources_status()
	build_placement_mode=false;clear_building_preview()
	update_status("Ehitusjärjekorras: "+Economy.DATA.data.buildings[type].name+". Üks ehitaja toob materjale.")



func valid_partial_save(data: Variant) -> bool:
	if not data is Dictionary or data.get("schema")!=1 or data.get("source")!="2d9ff3999235ba8c95afa57d0cc0a245090ffc9d":return false
	var saved: Variant=data.get("game")
	if not saved is Dictionary:return false
	if not saved.get("seed") is int and not saved.get("seed") is float:return false
	var seed_value: float=saved.seed
	if not is_finite(seed_value) or seed_value<0 or seed_value>4294967295:return false
	if not saved.get("time") is float and not saved.get("time") is int:return false
	if not is_finite(float(saved.time)) or saved.time<0:return false
	for key in ["settlers","cities","research","ages","explored"]:
		if not saved.get(key) is Array:return false
	if saved.research.size()!=4 or saved.ages.size()!=4 or saved.explored.size()!=4:return false
	for r in saved.research:
		if not r is Dictionary or not r.get("known") is Array or not r.get("progress") is Dictionary or not r.get("queue") is Array:return false
	if not data.get("city_created",false) is bool:return false
	var has_city: bool=data.get("city_created",false)
	if has_city:
		if saved.cities.is_empty():return false
		for city in saved.cities:
			if not city is Dictionary or not city.get("economy") is Dictionary or not city.get("world") is Dictionary:return false
			if not city.has("id") or not city.has("team") or not city.has("c") or not city.has("r"):return false
			var team:=int(city.team);var c:=int(city.c);var r:=int(city.r)
			if team<0 or team>=4 or c<0 or c>=Grid.COLS or r<0 or r>=Grid.ROWS:return false
			if not city.economy.get("realms") is Array or city.economy.realms.size()<=team or not city.economy.get("buildings") is Array or not city.economy.get("cargo") is Array:return false
			if not city.world.get("resources") is Array or not city.economy.realms[team] is Dictionary:return false
			if not city.economy.realms[team].get("resources") is Dictionary:return false
		if data.get("settler_mode",false):
			var selected_id:=int(data.get("active_settler_id",-1));var selected_found:=false
			for person in saved.settlers:
				if person is Dictionary and int(person.get("id",-1))==selected_id and int(person.get("team",-1))==0 and person.has("c") and person.has("r") and person.get("path") is Array:selected_found=true;break
			if not selected_found:return false
	else:
		var player_found:=false
		for a in saved.settlers:
			if a is Dictionary and int(a.get("team",-1))==0 and a.has("c") and a.has("r") and a.get("path") is Array:player_found=true;break
		if not player_found and (saved.get("winner")==null or not data.get("settler") is Dictionary or not data.settler.has("c") or not data.settler.has("r")):return false
	return true


static func normalize_saved_game(data: Variant) -> Variant:
	return WebSave.wrap(data)

static func read_partial_json(path: String) -> Variant:
	var parser:=JSON.new()
	if parser.parse(FileAccess.get_file_as_string(path))!=OK:return null
	return parser.data

# Each urban detail tile uses the town's resources and prerequisites.
func ai_urban_contexts(city: Dictionary) -> Array:
	var result: Array=[city]
	var urban: Dictionary=territory_allocation.get("urban",{}).get(str(int(city.id)),{})
	for key in urban:
		var bits: PackedStringArray=str(key).split(":")
		if bits.size()!=2:continue
		var c:=int(bits[0]);var r:=int(bits[1])
		if c==int(city.c) and r==int(city.r):continue
		if c<0 or r<0 or c>=Grid.COLS or r>=Grid.ROWS:continue
		var cell: Dictionary=grid[r*Grid.COLS+c]
		if not cell.get("land",false) or cell.get("mountain",false):continue
		var occupied:=false
		for other in game.cities:
			if int(other.c)==c and int(other.r)==r:occupied=true;break
		if occupied:continue
		var existing: Variant=DistrictContexts.existing(city,Vector2i(c,r))
		result.append(existing if existing!=null else {"c":c,"r":r,"team":city.team,"economy":city.economy,"lazy":true})
	for key in city.get("districts",{}):
		var ctx:Dictionary=city.districts[key]
		if not ctx.get("urbanExpansionV138",false) or not CityTerritory.urban_expansion_fits(city,urban.keys()):continue
		if not result.any(func(item):return int(item.c)==int(ctx.c) and int(item.r)==int(ctx.r)):result.append(ctx)
	return result

func ai_urban_expansions(city: Dictionary,contexts: Array) -> Array:
	var all:=DistrictContexts.all_buildings(city);var houses:=0;var services:=0
	for b in all:
		if float(b.get("hp",0))<=0:continue
		if b.type=="house":houses+=1
		if b.type in ["market","study","warehouse","cellar","well"] and b.get("ready",false):services+=1
	if houses<22 or services<2:return []
	var urban:Dictionary=territory_allocation.get("urban",{}).get(str(int(city.id)),{});var result:=[]
	for key in territory_allocation.get("territory",{}):
		var owner:Dictionary=territory_allocation.territory[key]
		if int(owner.id)!=int(city.id) or urban.has(key):continue
		var bits:=str(key).split(":")
		if bits.size()!=2:continue
		var c:=int(bits[0]);var r:=int(bits[1]);var cell:Dictionary=grid[r*Grid.COLS+c]
		if not cell.land or cell.get("mountain",false) or not CityTerritory.urban_expansion_fits(city,[key]):continue
		if contexts.any(func(ctx):return int(ctx.c)==c and int(ctx.r)==r):continue
		var dense:=false;var connected:=false
		for delta in [Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1)]:
			var tile:Vector2i=Vector2i(c,r)+delta;var neighbor:Variant=DistrictContexts.existing(city,tile)
			if neighbor==null:continue
			var count:=0;var home_count:=0
			for b in neighbor.economy.buildings:
				if float(b.get("hp",0))<=0 or b.get("virtual",false):continue
				if b.type=="house":home_count+=1
				if b.type in ["house","market","well","warehouse","cellar","library","school","public_school","high_school","study","scriptorium"]:count+=1
			if home_count>=8:dense=true
			if count>=2 and (urban.has(DistrictContexts.key(tile)) or neighbor.get("urbanExpansionV138",false)):connected=true
		if dense and connected:result.append({"c":c,"r":r,"team":city.team,"economy":city.economy,"lazy":true,"expandV138":true})
	return result

# Source urban-infill policy: build the first sixteen houses in the centre,
# then prefer a settled nearby district rather than scattered empty hamlets.
func ai_housing_context_rank(parent: Dictionary,ctx: Dictionary) -> float:
	var dist:=absi(int(ctx.c)-int(parent.c))+absi(int(ctx.r)-int(parent.r))
	var homes:=0;var local_homes:=0;var local_count:=0
	for building in parent.economy.buildings:
		if building.type=="house" and float(building.get("hp",0))>0 and not building.get("virtual",false):homes+=1
	if not ctx.get("lazy",false):
		for building in ctx.economy.buildings:
			if float(building.get("hp",0))<=0 or building.get("virtual",false):continue
			local_count+=1
			if building.type=="house":local_homes+=1
	if dist==0:return -200.0 if homes<16 else (18.0 if local_homes<23 else 105.0)
	if dist>1:
		var connected:=false
		for delta in [Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1)]:
			var neighbor: Variant=DistrictContexts.existing(parent,Vector2i(int(ctx.c)+delta.x,int(ctx.r)+delta.y))
			if neighbor==null:continue
			var count:=0
			for building in neighbor.economy.buildings:
				if building.type=="house" and float(building.get("hp",0))>0 and not building.get("virtual",false):count+=1
			if count>=8:connected=true;break
		if not connected:return 450.0+dist*50.0
	var settlement:=(-55.0+local_homes*1.8) if local_homes>0 else (-8.0 if local_count>0 else 32.0)
	return dist*17.0+settlement+(110.0 if local_homes>=12 else 0.0)+(7.0 if ctx.get("expandV138",false) else 0.0)

func tick_ai_build(city: Dictionary,runtime: Dictionary) -> void:
	if float(game.time)<float(city.get("aiNextBuildCheck",0)):return
	city.aiNextBuildCheck=float(game.time)+36
	var excluded: Array=[]
	for type in city.get("aiPlacementRetry",{}):
		if float(city.aiPlacementRetry[type])>float(game.time):excluded.append(type)
	var contexts:=ai_urban_contexts(city)
	var buildings:=DistrictContexts.all_buildings(city)
	var rule=func(type):
		var first_error: String=""
		for ctx in contexts:
			var error:=CityRules.urban_rule(game,ctx,city_cell_data(ctx),type,is_coast(int(ctx.c),int(ctx.r)),city_has_river(ctx),buildings)
			if error.is_empty():return ""
			if first_error.is_empty():first_error=error
		return first_error
	var plan_city: Dictionary=city.duplicate();plan_city.economy=city.economy.duplicate();plan_city.economy.buildings=buildings
	var planner:=AIBuild.new()
	for attempt in 6:
		var decision: Variant=planner.choose(game,plan_city,rule,excluded)
		if plan_city.has("aiImportRequestsV128"):city.aiImportRequestsV128=plan_city.aiImportRequestsV128
		if decision==null:return
		var type: String=decision.type
		var ordered:=contexts.duplicate()
		if type=="house":ordered.append_array(ai_urban_expansions(city,ordered))
		if type=="house":
			var plan:Variant=city.get("stoneDefensePlanV166",city.get("defensePlanV139",{}));var outline:Array=plan.get("outlineV176",[]) if plan is Dictionary else []
			var phase:=HistoricUrban.growth_phase(city,int(game.ages[int(city.team)]),outline)
			ordered.sort_custom(func(a,b):return HistoricUrban.context_score(city,a,phase,85.0 if a.get("expandV138",false) else ai_housing_context_rank(city,a))<HistoricUrban.context_score(city,b,phase,85.0 if b.get("expandV138",false) else ai_housing_context_rank(city,b)))
		else:ordered.sort_custom(func(a,b):return pow(float(a.c-city.c),2)+pow(float(a.r-city.r),2)<pow(float(b.c-city.c),2)+pow(float(b.r-city.r),2))
		var zones: Array=[-1]
		if type=="house" and city.get("outerRingDiagnosticV184",{}).get("reason","")=="complete" and HistoricUrban.protected_housing_zone(city,Vector2.ZERO)>=0:zones=[0,1]
		for zone in zones:
			for candidate in ordered:
				var error:=CityRules.urban_rule(game,candidate,city_cell_data(candidate),type,is_coast(int(candidate.c),int(candidate.r)),city_has_river(candidate),buildings)
				if not error.is_empty():continue
				if not is_same(candidate,city) and merchant_land_path(city,candidate,int(city.team))==null:continue
				var context: Variant=candidate
				if candidate.get("lazy",false):context=district_context_at(city,Vector2i(int(candidate.c),int(candidate.r)),true)
				if context==null:continue
				var expansion:bool=candidate.get("expandV138",false);var was_expansion:bool=context.get("urbanExpansionV138",false)
				if expansion:context.urbanExpansionV138=true
				var local_runtime: Dictionary=runtime if is_same(context,city) else ensure_city_runtime(context)
				if place_ai_building(context,local_runtime,type,city,false,0,int(zone)):
					if expansion:territory_stamp=""
					city.aiPlacementRetry={};return
				if expansion and not was_expansion:context.erase("urbanExpansionV138")
		excluded.append(type)
		if not city.has("aiPlacementRetry"):city.aiPlacementRetry={}
		city.aiPlacementRetry[type]=float(game.time)+15

func place_ai_building(city: Dictionary,runtime: Dictionary,type: String,parent: Dictionary={},preview_only:=false,max_candidates:=0,housing_zone:=-1) -> bool:
	if parent.is_empty():parent=city
	var build_economy:=DistrictContexts.build_economy(parent,city)
	var heights: Array=runtime.heights;var nav: LocalNavigation=runtime.nav;var team:=int(city.team);var positions: Array=[]
	var coast_type: bool=type in ["fisher","harbor"]
	var existing_streets:=TownStreets.worn_index(nav,float(game.time)) if type in TownStreets.TRAIL_PROTECTED else {}
	if coast_type:
		for x in range(-108,109,6):
			for z in range(-96,97,6):positions.append(Vector2(x,z))
	elif Minerals.TYPES.has(type):
		var site: Variant=Minerals.mineral_site(city.world,type)
		if site==null:return false
		positions.append(Vector2(float(site.x),float(site.z)))
	else:
		var near_cliff:=false
		if type=="house":
			for dr in range(-2,3):
				for dc in range(-2,3):
					var c:=int(parent.c)+dc;var r:=int(parent.r)+dr
					if c>=0 and r>=0 and c<Grid.COLS and r<Grid.ROWS and grid[r*Grid.COLS+c].get("mountain",false):near_cliff=true;break
				if near_cliff:break
		var terrain_cache:Dictionary={}
		var feature=func(x,z):return ai_defense_terrain(parent,x,z,terrain_cache).kind
		var options={"age":int(game.ages[team]),"nearCliff":near_cliff,"feature":feature}
		positions=HistoricUrban.plots(city,parent,type,int(game.seed)+int(parent.id)*31,int(game.ages[team])==0,existing_streets,options)
	var passable=func(x,z,_team):return DetailTerrainScript.detail_height(heights,x,z)>0.2
	var clear=func(x,z,kind,_team):
		for resource in city.world.resources:
			if resource.kind in ["tree","berry","game","fish"] or resource.get("removed",false):continue
			if Minerals.TYPES.get(kind,"")==resource.kind and resource.get("depositSite",false):continue
			var distance: float=10 if resource.get("depositSite",false) else 4.5
			if absf(resource.x-x)<distance and absf(resource.z-z)<distance:return false
		return true
	var depot: Variant=nav.nearest(LocalNav.door(city.economy.buildings[0]),9)
	if depot==null:return false
	var checked:=0
	for target in positions:
		if housing_zone>=0 and HistoricUrban.protected_housing_zone(parent,target+Vector2((int(city.c)-int(parent.c))*225.0,(int(city.r)-int(parent.r))*195.0))!=housing_zone:continue
		if OuterRingSurvey.blocks_future_wall(parent,target,type,Vector2((int(city.c)-int(parent.c))*225.0,(int(city.r)-int(parent.r))*195.0)):continue
		checked+=1
		if max_candidates>0 and checked>max_candidates:break
		if not coast_type and (absf(target.x)>104 or absf(target.y)>89):continue
		if not existing_streets.is_empty() and TownStreets.crosses_worn(existing_streets,target,type):continue
		var coast_data: Dictionary={}
		var placement_passable: Callable=passable
		if coast_type:
			coast_data=shore_placement(city,type,target,heights)
			if coast_data.has("error"):continue
			target=Vector2(coast_data.p.x,coast_data.p.z)
			if absf(target.x)>112.5 or absf(target.y)>97.5:continue
			placement_passable=func(_x,_z,_team):return true
		var global_building={"type":type,"x":target.x+(int(city.c)-int(parent.c))*225.0,"z":target.y+(int(city.r)-int(parent.r))*195.0}
		if int(game.ages[team])==0 and AIStoneDefenses.crosses_ring(global_building,parent.get("stoneDefensePlanV166",parent.get("stoneDefenseReserveV168")),1.8):continue
		var check:=Economy.build_rule(build_economy,team,type,target,placement_passable,clear,true)
		if check.has("error"):continue
		var proposed={"type":type,"x":target.x,"z":target.y}
		if coast_type:proposed.landEntry=coast_data.landEntry
		if not nav.preserves_access(proposed,city.economy.buildings,city.world.get("workers",{}),city.economy.get("cargo",[])):continue
		var entry: Variant=nav.nearest(LocalNav.door(proposed),9)
		if entry==null or nav.route(depot,entry,false)==null:continue
		if type=="farm" and ai_field_site(city,runtime,proposed,parent)==null:continue
		if type in ["lumber","hunter"]:
			var kind: String="tree" if type=="lumber" else "game";var accessible:=false
			for resource in city.world.resources:
				if resource.kind!=kind or resource.get("removed",false) or float(resource.get("amount",0))<=0:continue
				if Vector2(resource.x,resource.z).distance_to(target)>=55:continue
				var goal: Variant=nav.nearest({"x":float(resource.x)+1.8,"z":resource.z},4)
				if goal!=null and nav.route(entry,goal,false)!=null:accessible=true;break
			if not accessible:continue
		if preview_only:return true
		var result:=Economy.place_building(build_economy,team,type,target,placement_passable,clear,true)
		if result.has("error"):continue
		city.economy.buildings.append(result.building)
		if coast_type:
				for key in ["shoreAngle","landEntry","baseY","riverBankV276"]:
					if coast_data.has(key):result.building[key]=coast_data[key]
		if Minerals.TYPES.has(type):
			var deposit:=Minerals.placement(city.world,type,{"x":target.x,"z":target.y},[])
			if deposit.has("depositId"):result.building.depositId=deposit.depositId
		Builder.clear_footprint(city.world,result.building)
		nav.rebuild(city.economy.buildings,city.world.resources)
		return true
	return false

# One 48-by-32 field per finished farm, following the source search cadence.
func tick_ai_field(city: Dictionary,runtime: Dictionary,parent: Dictionary={}) -> void:
	if parent.is_empty():parent=city
	if float(game.time)<float(city.get("nextFieldSearchV127",0)):return
	var farms:=0;var fields:=0;var pending:=0
	for b in city.economy.buildings:
		if b.type=="farm" and b.get("ready",false) and float(b.get("hp",0))>0:farms+=1
		if b.type=="field" and float(b.get("hp",0))>0:fields+=1
	for b in DistrictContexts.all_buildings(parent):
		if not b.get("ready",false) and float(b.get("hp",0))>0:pending+=1
	if farms<=fields or pending>=6:return
	var team:=int(city.team)
	if not Economy.can_afford(city.economy.realms[team].resources,Economy.DATA.data.buildings.field.cost):return
	city.nextFieldSearchV127=float(game.time)+60
	var field: Variant=ai_field_site(city,runtime,null,parent)
	if field==null:return
	var heights: Array=runtime.heights
	var passable=func(x,z,_team):return AIStoneDefenses.terrain_open(runtime.nav,x,z)
	var economy:=DistrictContexts.build_economy(parent,city)
	var result:=Economy.place_building(economy,team,"field",Vector2(field.x,field.z),passable,Callable(),true)
	if result.has("error"):return
	city.economy.buildings.append(result.building)
	result.building.width=field.width;result.building.depth=field.depth
	for resource in city.world.resources:
		if resource.kind in ["tree","berry","game"] and FarmingRules.field_contains(result.building,resource):resource.removed=true;resource.amount=0
	city.world.revision=int(city.world.get("revision",0))+1
	runtime.nav.rebuild(city.economy.buildings,city.world.resources)

func ai_field_site(city: Dictionary,runtime: Dictionary,farm: Variant=null,parent: Dictionary={}) -> Variant:
	if parent.is_empty():parent=city
	var heights: Array=runtime.heights;var sample: Dictionary=city.duplicate();sample.economy=city.economy.duplicate();sample.economy.buildings=city.economy.buildings.duplicate()
	var home: Dictionary={"x":0,"z":0}
	if farm is Dictionary:
		var proposal: Dictionary=farm.duplicate();proposal.type="farm";proposal.hp=350;sample.economy.buildings.append(proposal);home=proposal
	else:
		for b in city.economy.buildings:
			if b.type=="farm" and b.get("ready",false) and float(b.get("hp",0))>0:home=b;break
	var existing_fields: Array=[];var hall:Dictionary={"x":0,"z":0}
	for building in city.economy.buildings:
		if building.type=="field" and float(building.get("hp",0))>0:existing_fields.append(building)
	for building in parent.economy.buildings:
		if building.type=="hall" and not building.get("virtual",false):hall=building;break
	var points: Array=[];var x: float=-84.5
	while x<=84.5:
		var z: float=-77.5
		while z<=77.5:
			var distance:=Vector2(x-home.x,z-home.z).length()
			if int(game.ages[int(city.team)])==0:
				var global:=Vector2((int(city.c)-int(parent.c))*225.0+x-float(hall.x),(int(city.r)-int(parent.r))*195.0+z-float(hall.z))
				distance=AIStoneDefenses.field_score(Vector2(x,z),Vector2(home.x,home.z),existing_fields,global)
			points.append({"x":x,"z":z,"width":48.0,"depth":32.0,"distance":distance});z+=12
		x+=12
	points.sort_custom(func(a,b):return a.distance<b.distance if a.distance!=b.distance else (a.z<b.z if a.z!=b.z else a.x<b.x))
	var passable=func(px,pz):return AIStoneDefenses.terrain_open(runtime.nav,px,pz)
	for p in points:
		if OuterRingSurvey.blocks_future_wall(parent,Vector2(p.x,p.z),"field",Vector2((int(city.c)-int(parent.c))*225.0,(int(city.r)-int(parent.r))*195.0)):continue
		var global_field:Dictionary=p.duplicate();global_field.x=float(p.x)+(int(city.c)-int(parent.c))*225.0;global_field.z=float(p.z)+(int(city.r)-int(parent.r))*195.0;global_field.type="field"
		if int(game.ages[int(city.team)])==0 and AIStoneDefenses.crosses_ring(global_field,parent.get("stoneDefensePlanV166",parent.get("stoneDefenseReserveV168")),2.0,true):continue
		if not FarmingRules.validate(sample,p,passable).is_empty():continue
		var lo:=INF;var hi:=-INF
		for dx in range(-24,25,4):
			for dz in range(-16,17,4):
				var h:=DetailTerrainScript.detail_height(heights,p.x+dx,p.z+dz);lo=minf(lo,h);hi=maxf(hi,h)
		if hi-lo<=1.8:return p
	return null

func shore_placement(city: Dictionary,type: String,p: Vector2,heights: Array) -> Dictionary:
	var visual:=detail_visual_for(int(city.c),int(city.r))
	var surface=func(x,z):return DetailTerrainScript.visual_sample(visual,x,z).z
	var detail=func(x,z):return DetailTerrainScript.detail_height(heights,x,z)
	var ocean=func(x,z):return DetailTerrainScript.visual_sample(visual,x,z).w<0.0
	var sea:=ShorePlacement.sea(type,p,surface,detail,ocean)
	if not sea.has("error"):return sea
	var river:=river_navigation_for(int(city.c),int(city.r),heights)
	var bank:=ShorePlacement.river(type,p,surface,detail,river.nearest)
	return sea if bank.has("error") else bank

func select_army_id(id: int) -> void:
	refresh_army_options()
	for i in army_select.item_count:
		var index:=int(army_select.get_item_metadata(i))
		if int(game.armies[index].get("id",0))==id:army_select.select(i);selected_entity="army";return

func split_selected_army() -> void:
	var army: Variant=selected_army()
	if army==null:update_status("Vali esmalt oma vägi.");return
	if army.get("embarked")!=null:update_status("Maabu esmalt laevalt.");return
	var result:=Armies.split(game,army)
	if result.has("error"):update_status(result.error);return
	select_army_id(int(result.army.id));update_army_markers();update_status("Uus armee loodud: %d sõdalast." % int(result.count))

func merge_selected_armies() -> void:
	var result:=Armies.merge(game,selected_army())
	if result.has("error"):update_status(result.error);return
	select_army_id(int(result.army.get("id",0)));update_army_markers();update_status("Armeed ühendatud.")

func rally_selected_armies() -> void:
	var army: Variant=selected_army()
	if army==null:update_status("Vali esmalt oma vägi.");return
	var result:=Armies.rally(game,army,merchant_land_path)
	if result.has("error"):update_status(result.error);return
	update_status("Teel ühendamisele: %d armeed. Ligipääs puudub: %d." % [int(result.ordered),int(result.unreachable)])

func finish_rallies() -> void:
	if game.get("battle")!=null:return
	for army in game.armies.duplicate():
		if army.get("rallyTarget")==null or not army.get("path",[]).is_empty():continue
		var target: Variant=null
		for candidate in game.armies:
			if int(candidate.team)==int(army.team) and int(candidate.get("id",0))==int(army.rallyTarget):target=candidate;break
		if target!=null and int(target.c)==int(army.c) and int(target.r)==int(army.r):
			var chosen: Variant=selected_army();var selected_id:=int(chosen.get("id",0)) if chosen!=null else -1
			var was_selected:=selected_id==int(army.get("id",0)) or selected_id==int(target.get("id",0))
			var result:=Armies.merge(game,target)
			if result.has("army") and int(target.team)==0:
				if was_selected:select_army_id(int(result.army.get("id",0)))
				elif selected_id>=0:select_army_id(selected_id)
				else:refresh_army_options()
				update_army_markers();update_status("Armeed ühinesid.")
		army.erase("rallyTarget")

# AI colonists pay the same settlement cost and travel on actual paths.
# The current port evaluates the detailed building site after reaching a tile.
func manage_ai_settlers(team: int) -> void:
	for person in game.settlers.duplicate():
		if int(person.team)!=team or person.get("embarked")!=null or not person.get("path",[]).is_empty():continue
		if migration_active() and person.has("chosenSiteV274"):continue
		if not person.get("landed",false):
			var goal: Variant=person.get("aiSettlementGoal")
			var destination: Variant=goal if goal is Dictionary and int(goal.c)==int(person.c) and int(goal.r)==int(person.r) else choose_ai_settlement_tile(person)
			if destination==null:
				person.aiSeaNeeded=game.cities.any(func(c):return int(c.team)==team)
				continue
			person.aiSeaNeeded=false
			if int(destination.c)!=int(person.c) or int(destination.r)!=int(person.r):
				var path: Variant=merchant_land_path(person,destination,team)
				if path is Array and not path.is_empty():
					person.path=path;person.aiSettlementGoal={"c":destination.c,"r":destination.r}
					if migration_active() and int(game.ages[team])<=2:person.aiMigrationPathIssuedAt=game.time
					continue
			person.landed=true;person.localTarget=null;person.erase("aiSettlementGoal")
		if person.get("localTarget")!=null:continue
		var c:=int(person.c);var r:=int(person.r);var key:=str(c)+":"+str(r)
		if territory_allocation.get("territory",{}).has(key):
			if not person.has("aiRejectedSites"):person.aiRejectedSites=[]
			if key not in person.aiRejectedSites:person.aiRejectedSites.append(key)
			person.landed=false;continue
		if not game.has("tileWorlds"):game.tileWorlds={}
		if not game.tileWorlds.has(key):game.tileWorlds[key]=DetailWorldScript.create(grid,city_cell_data(person),visual_biome(r*Grid.COLS+c),int(game.seed))
		var world: Dictionary=game.tileWorlds[key];var nav: Variant=ensure_settler_navigation(person)
		if nav==null:person.landed=false;continue
		var passable=func(x,z):
			var index: int=nav.index(x,z)
			return index>=0 and nav.base[index]!=0
		var found:=false
		for x in range(-18,19,6):
			for z in range(-18,19,6):
				var p:=Vector2(x,z)
				if not Settlement.site_rule(person,p,game.cities,false,false,passable,world.resources).is_empty() or nav.route(person,{"x":x,"z":z})==null:continue
				if Vector2(float(person.x),float(person.z)).distance_to(p)<1:
					if migration_active():
						person.chosenSiteV274={"c":c,"r":r,"x":x,"z":z};found=true;break
					var missing:=AISettlement.missing_resources(game,team,city_cell_data,is_coast)
					var result:=Settlement.found_city(game,person,world)
					if result.has("city"):
						AISettlement.specialize(game,result.city,missing,city_cell_data(result.city),is_coast(c,r));settler_local_navs.erase(str(int(person.id)))
						refresh_city_territory();initialize_ai_defense_reserve(result.city);update_city_markers();found=true
				else:person.localTarget={"x":x,"z":z};found=true
				if found:break
			if found:break
		if not found:
			if not person.has("aiRejectedSites"):person.aiRejectedSites=[]
			if key not in person.aiRejectedSites:person.aiRejectedSites.append(key)
			person.landed=false;person.aiSeaNeeded=true

func prepare_ai_settlement_cell(cell: Dictionary) -> void:
	# Use the same geography-version-aware deposits as the actual city.
	city_cell_data(cell)

func choose_ai_settlement_tile(person: Dictionary) -> Variant:
	var team:=int(person.team);var own: Array=[]
	for city in game.cities:
		if int(city.team)==team:own.append(city)
	var first_city:=own.is_empty();var span:=9 if first_city else 26
	var missing:=AISettlement.missing_resources(game,team,city_cell_data,is_coast);var options: Array=[]
	var c0:=int(person.c);var r0:=int(person.r)
	for r in range(maxi(0,r0-span),mini(Grid.ROWS-1,r0+span)+1):
		for c in range(maxi(0,c0-span),mini(Grid.COLS-1,c0+span)+1):
			var d:=absi(c-c0)+absi(r-r0);var key:=str(c)+":"+str(r);var cell: Dictionary=grid[r*Grid.COLS+c]
			if d>span or not cell.land or cell.mountain or territory_allocation.get("territory",{}).has(key) or key in person.get("aiRejectedSites",[]):continue
			var near:=999
			for city in game.cities:near=mini(near,maxi(absi(c-int(city.c)),absi(r-int(city.r))))
			if near<Settlement.AI_SPACING:continue
			var own_dist:=999
			for city in own:own_dist=mini(own_dist,maxi(absi(c-int(city.c)),absi(r-int(city.r))))
			prepare_ai_settlement_cell(cell)
			if first_city and (not cell.deposits.get("wood",false) or not cell.deposits.get("stone",false)):continue
			var score: float=AISettlement.score(cell,missing,is_coast(c,r))*3+(8 if cell.deposits.get("wood",false) else 0)-d*1.5-(0 if first_city else own_dist*6)
			options.append({"c":c,"r":r,"score":score,"order":options.size()})
	options.sort_custom(func(a,b):return a.order<b.order if a.score==b.score else a.score>b.score)
	var max_path:=64 if first_city else 16 if int(game.ages[team])<=1 else 64;var distances:=ai_settlement_distances(Vector2i(c0,r0),max_path)
	var best: Variant=null;var best_value:=-INF;var tried:=0;var calls:=0
	for candidate in options:
		if tried>=12 or calls>=200:break
		if maxi(absi(int(candidate.c)-c0),absi(int(candidate.r)-r0))>max_path:continue
		calls+=1;var key:=str(int(candidate.c))+":"+str(int(candidate.r))
		if not distances.has(key):continue
		if first_city:
			if ai_sea_site_ok(person,candidate):
				return AISettlement.first_village_site(candidate,func(tile):return ai_first_village_survey(person,candidate,tile))
			continue
		tried+=1;var value: float=candidate.score-int(distances[key])*2.5
		if value>best_value:best_value=value;best=candidate
	return best

func ai_first_village_survey(person: Dictionary,target: Dictionary,tile: Dictionary) -> Variant:
	var c:=int(tile.c);var r:=int(tile.r)
	if c<0 or r<0 or c>=Grid.COLS or r>=Grid.ROWS:return null
	var key:=str(c)+":"+str(r);var cell:Dictionary=grid[r*Grid.COLS+c]
	if not cell.land or cell.mountain or territory_allocation.get("territory",{}).has(key):return null
	prepare_ai_settlement_cell(cell)
	if not cell.deposits.get("wood",false) or not cell.deposits.get("stone",false):return null
	var path:Variant=merchant_land_path(person,tile,int(person.team))
	if not path is Array or path.size()>64:return null
	var heights:=DetailTerrainScript.tile_heights(grid,c,r);var visual:=detail_visual_for(c,r);var river:=river_navigation_for(c,r,heights)
	var coast:=is_coast(c,r) or bool(cell.mountain)
	# Navigation.passable in the web source is the continuous terrain test,
	# not the grid mask containing trees or other temporary obstacles.
	var passable=func(x,z):return absf(x)<(132.0 if coast else 109.5) and absf(z)<(117.0 if coast else 94.5) and DetailTerrainScript.detail_height(heights,x,z)>0.2 and DetailTerrainScript.visual_sample(visual,x,z).z>0.05 and river.passable(x,z)
	for dx in [-4,0,4]:
		for dz in [-4,0,4]:
			if not passable.call(-18+dx,-12+dz):return null
	# The web's provisional city has no id, so its natural-plan seed is NaN;
	# the reservation falls back to the rectangular terrain survey.
	var fake={"id":0,"team":int(person.team),"economy":{"buildings":[{"type":"hall","hp":1200,"ready":true,"x":-18,"z":-12}]}}
	var survey:Variant=AIStoneDefenses.reserve(game,fake,{"nav":null},Callable(),passable)
	if not survey is Dictionary:return null
	return {"cell":tile,"blocked":int(survey.terrainBlockedAtFounding),"water":bool(cell.deposits.get("water",false)),"coast":is_coast(c,r),"distance":absi(c-int(target.c))+absi(r-int(target.r))}

func ai_settlement_distances(start: Vector2i,limit: int) -> Dictionary:
	var queue: Array[Vector2i]=[start];var distances: Dictionary={str(start.x)+":"+str(start.y):0};var head:=0
	while head<queue.size():
		var current: Vector2i=queue[head];head+=1
		var length:=int(distances[str(current.x)+":"+str(current.y)])
		if length>=limit:continue
		for direction in Grid.DIRECTIONS:
			var next: Vector2i=current+direction;var key:=str(next.x)+":"+str(next.y)
			if distances.has(key) or not army_can_traverse({"c":next.x,"r":next.y}):continue
			distances[key]=length+1;queue.append(next)
	return distances

func ai_sea_site_ok(person: Dictionary,tile: Dictionary) -> bool:
	var candidate:=person.duplicate();candidate.c=tile.c;candidate.r=tile.r;candidate.landed=true;candidate.path=[];candidate.localTarget=null;candidate.embarked=null
	var c:=int(tile.c);var r:=int(tile.r);var heights:=DetailTerrainScript.tile_heights(grid,c,r)
	var world:=DetailWorldScript.create(grid,city_cell_data(candidate),visual_biome(r*Grid.COLS+c),int(game.seed))
	var passable=func(x,z):return DetailTerrainScript.detail_height(heights,x,z)>0.2
	for x in [-18,-6,6,18]:
		for z in [-18,-6,6,18]:
			if Settlement.site_rule(candidate,Vector2(x,z),game.cities,false,false,passable,world.resources).is_empty():return true
	return false

func style_game_dialog(dialog: AcceptDialog) -> void:
	var panel:=StyleBoxTexture.new();panel.texture=load("res://assets/ui/ui-art-v304_panel.webp")
	panel.texture_margin_left=70;panel.texture_margin_right=70;panel.texture_margin_top=50;panel.texture_margin_bottom=50
	panel.content_margin_left=20;panel.content_margin_right=20;panel.content_margin_top=20;panel.content_margin_bottom=20
	dialog.add_theme_stylebox_override("panel",panel);dialog.get_ok_button().text="Sulge"
	var theme:=Theme.new()
	for type in ["Button","OptionButton"]:
		for state in ["normal","hover","pressed","focus","disabled"]:
			var style:=StyleBoxFlat.new();style.bg_color=Color("203a48") if state=="hover" else Color("0e202e") if state=="pressed" else Color("172b38")
			style.border_color=Color("d0a24c") if state!="disabled" else Color("66593c");style.set_border_width_all(1);style.set_corner_radius_all(3)
			style.content_margin_left=10;style.content_margin_right=10;style.content_margin_top=5;style.content_margin_bottom=5
			theme.set_stylebox(state,type,style)
		for state in ["font_color","font_hover_color","font_pressed_color"]:theme.set_color(state,type,Color("f2dca8"))
		theme.set_color("font_disabled_color",type,Color("8d8a80"))
	theme.set_color("font_color","Label",Color("f0dcae"));theme.set_color("default_color","RichTextLabel",Color("f0dcae"))
	dialog.theme=theme

func fit_game_dialog(dialog: AcceptDialog,desired: Vector2i) -> void:
	# Wrapped labels first measure at zero width; resize after they have laid out.
	await get_tree().process_frame
	await get_tree().process_frame
	if not is_instance_valid(dialog) or not dialog.visible:return
	var viewport_size:=Vector2i(get_viewport().get_visible_rect().size)
	dialog.size=Vector2i(mini(desired.x,viewport_size.x-20),mini(desired.y,viewport_size.y-40))
	dialog.position=Vector2i(maxi(0,(viewport_size.x-dialog.size.x)/2),maxi(0,(viewport_size.y-dialog.size.y)/2))

func city_has_river(city: Dictionary) -> bool:
	for d in [Vector2i.ZERO,Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1)]:
		var c: int=int(city.c)+d.x;var r: int=int(city.r)+d.y
		if c>=0 and r>=0 and c<Grid.COLS and r<Grid.ROWS and grid[r*Grid.COLS+c].get("river",false):return true
	return false


func create_field_battle_navigation(battle: Dictionary) -> Variant:
	battle_nav=BattleNavigation.new(self,battle)
	return battle_nav

func army_in_battle(army: Dictionary) -> bool:
	var battle: Variant=game.get("battle")
	if not battle is Dictionary or battle.get("result")!=null:return false
	for squad in battle.squads:
		if int(squad.team)==int(army.team) and int(squad.get("armyId",0))==int(army.get("id",0)):return true
	return false

func tick_field_battle(delta: float) -> void:
	var battle: Variant=game.get("battle")
	if battle==null:
		var failed: Variant=game.get("battleEncounterFailure")
		var skip: Variant=failed if failed is Dictionary and float(failed.until)>float(game.time) else null
		battle_nav=null
		battle=BattleEncounter.encounter(game,grid,Callable(self,"create_field_battle_navigation"),skip)
		if battle==null:
			if battle_nav!=null:
				var cell: Dictionary=battle_nav.battle.cell
				game.battleEncounterFailure={"c":cell.c,"r":cell.r,"until":float(game.time)+60};battle_nav=null
				update_status("Lahingule ei leitud mõlemal pool sobivat maastikku; liiguta vägesid.")
			return
		battle_sim=BattleSimulation.new();battle_sim.game_state=game
		var player_involved:=false
		for unit in battle.squads:
			if int(unit.team)==0:player_involved=true;break
		if player_involved:open_field_battle_view(battle)
		else:update_status("Teiste riikide väed kohtusid lahingus.")
	if battle.get("result")==null:
		if battle_nav==null:battle_nav=BattleNavigation.new(self,battle)
		if battle_sim==null:battle_sim=BattleSimulation.new();battle_sim.game_state=game
		var remaining:=minf(delta,0.5);var tech: Array=[]
		for age in game.ages:tech.append(1 if int(age)>=2 else 0)
		while remaining>0.00000001 and battle.get("result")==null:
			var step:=minf(0.1,remaining);battle_sim.step(battle,step,tech,battle_nav);remaining-=step
	if battle.get("result")!=null and not battle.get("applied",false):apply_field_battle_result(battle)
	if battle.get("result")!=null and battle_view==null:
		game.battle=null;battle_nav=null;battle_sim=null

func apply_field_battle_result(battle: Dictionary) -> void:
	BattleResolution.persist_individual_men(game,battle)
	var fortress: Variant=battle.get("fortress")
	if fortress is Dictionary:
		for city in game.cities:
			if int(city.id)!=int(fortress.cityId):continue
			BattleResolution.settle_defenders(battle,city)
			BattleResolution.persist_siege_damage(city,battle)
			city.hp=maxf(0,minf(float(city.get("hp",600)),float(fortress.hp)))
			if float(city.hp)<=0:
				var old_team:=int(city.team)
				var winner: Variant=battle.get("winnerTeam")
				if winner==null:winner=battle.get("attackerTeam")
				if winner!=null:
					BattleSiege.transfer_city(game,city,int(winner));city.hp=300
					city_runtimes.clear();district_agents.clear();detail_unit_navs.clear();territory_stamp="";territory_visual_stamp="";city_select_stamp=""
					if old_team==0:select_after_city_loss(city)
					refresh_city_territory();refresh_city_options();update_city_markers()
					update_status("Linn vallutati.")
			break
	BattleField.apply_retreats(game,battle,func(_team,p):return army_can_traverse(p),merchant_land_path)
	var awards:=ArmyExperience.reward_battle_experience(game,battle)
	BattleResolution.remember(game,battle);battle.applied=true
	refresh_army_options();update_army_markers()
	if not awards.is_empty():update_status("Lahing lõppes ja vägede kogemus uuendati.")

func select_after_city_loss(lost: Dictionary) -> void:
	if city_created and int(game.cities[active_city_index].team)==0:return
	for i in game.cities.size():
		if int(game.cities[i].team)!=0:continue
		active_city_index=i;settler_mode=false;selected_entity="city"
		var city: Dictionary=game.cities[i]
		player=Vector2i(int(city.c),int(city.r));prepare_city_navigation(city)
		return
	city_created=false;settler_mode=false;selected_entity="settler"
	research_row.visible=false;research_label.visible=false;resources_label.visible=false;resources_button.visible=false
	detail_button.text="Ava asuniku detailkaart"
	for person in game.settlers:
		if int(person.team)==0:
			settler=person;player=Vector2i(int(person.c),int(person.r));return
	# Keep a map location for the final screen and for loading a completed game.
	settler={"c":lost.c,"r":lost.r,"path":[]};player=Vector2i(int(lost.c),int(lost.r))

func open_field_battle_view(battle: Dictionary) -> void:
	if battle_view!=null:return
	if detail_mode:toggle_detail()
	world_camera_target=camera_target;world_zoom=zoom
	battle_view=Node3D.new();battle_view.set_script(BattleView);add_child(battle_view);battle_view.setup(self,battle)
	terrain.visible=false;fog.visible=false;marker.visible=false;detail_mode=true;detail_inspection=true
	game_hud.visible=false;army_row.visible=false;settler_row.visible=false;found_button.visible=false;build_row.visible=false
	var first: Variant=null
	for unit in battle.squads:
		if int(unit.team)==0 and float(unit.hp)>0:first=unit;break
	camera_target=Vector3(float(first.x),0,float(first.z)) if first!=null else Vector3.ZERO;zoom=90
	update_camera();update_army_markers();update_city_markers();update_landmark_markers();update_raid_markers();update_merchant_markers();update_ship_markers();update_other_settler_markers();update_world_roads();update_territory_visual()

func clear_battle_view() -> void:
	if battle_view==null:return
	battle_view.queue_free();battle_view=null
	terrain.visible=true;fog.visible=not reveal_all;marker.visible=true;detail_mode=false;detail_inspection=false;game_hud.visible=true
	camera_target=world_camera_target;zoom=world_zoom;update_camera()
	army_row.visible=city_created and not settler_mode;settler_row.visible=city_created
	update_army_markers();update_city_markers();update_landmark_markers();update_raid_markers();update_merchant_markers();update_ship_markers();update_other_settler_markers();update_world_roads();update_territory_visual()

func close_battle_view() -> void:
	var battle: Variant=game.get("battle")
	if battle is Dictionary and battle.get("result")==null:return
	clear_battle_view();game.battle=null;battle_nav=null;battle_sim=null
	update_status("Lahing lõppes.")

func restore_field_battle() -> void:
	var battle: Dictionary=game.battle
	battle_nav=BattleNavigation.new(self,battle);battle_sim=BattleSimulation.new();battle_sim.game_state=game
	var player_involved:=false
	for unit in battle.get("squads",[]):
		if int(unit.team)==0:player_involved=true;break
	if battle.get("result")!=null and not battle.get("applied",false):apply_field_battle_result(battle)
	if player_involved:open_field_battle_view(battle)
	elif battle.get("result")!=null:game.battle=null;battle_nav=null;battle_sim=null



func house_design_is_default(design: Dictionary) -> bool:
	var defaults:Dictionary=preload("res://data/house_default_designs.json").data
	var id:=str(design.get("id",""))
	return defaults.has(id) and JSON.stringify(defaults[id])==JSON.stringify(design)

func house_designer_id(type: String,city: Dictionary) -> String:
	if city.is_empty() or type in ["bridge","road"]:return ""
	var age:=maxi(int(DetailView.BUILD_RULES.data.age.get(type,0)),Production.upgrade_level(game,int(city.team)))
	if age>2:return ""
	return DetailView.designer_id(type,age)

func open_type_house_designer(type: String,index: int) -> void:
	if not city_created or settler_mode or (detail_mode and not can_build_on_detail()):return
	var city:Dictionary=game.cities[active_city_index];var id:=house_designer_id(type,city)
	if id.is_empty():update_status("Seda ehitist ei saa praegu kujundada.");return
	var original:Dictionary=game.get("houseDesignTemplatesV354",{}).get(type,{})
	var panel:=open_house_design_panel(id,str(Economy.DATA.data.buildings[type].name),original)
	if panel==null:return
	panel.reset_requested.connect(func():
		if game.has("houseDesignTemplatesV354"):game.houseDesignTemplatesV354.erase(type)
		update_status("Algne hoonekujundus taastatud.")
	)
	panel.accepted.connect(func(design):
		if not game.has("houseDesignTemplatesV354"):game.houseDesignTemplatesV354={}
		if house_design_is_default(design):game.houseDesignTemplatesV354.erase(type)
		else:game.houseDesignTemplatesV354[type]=design.duplicate(true)
		if can_build_on_detail():
			game_hud.dock_menu.choose_building(index)
			if build_placement_mode:update_status("Kujundus salvestatud. Vali uue hoone asukoht.")
		else:update_status("Kujundus salvestatud. Ava detailkaart, et uus hoone paigutada.")
	)

func change_wall_garrison(release:=false) -> void:
	var city: Dictionary=current_build_context()
	var index:=selected_building_index
	if index<0 or index>=city.economy.buildings.size():return
	var building: Dictionary=city.economy.buildings[index]
	var result: Dictionary=Fortifications.release(game,city,building) if release else Fortifications.station(game,city,building)
	if result.has("error"):update_status(result.error);return
	refresh_army_options();update_army_markers()
	update_status("Sõdur kutsuti müürilt armeesse." if release else "Sõdur määrati müürile.")

func wall_upgrade_options(city: Dictionary,building: Dictionary,target: String) -> Dictionary:
	var check=func(type: String) -> String:
		var county:=district_county_rule(city,type)
		if not county.is_empty():return county
		return CityRules.urban_rule(game,city,city_cell_data(city),type,is_coast(int(city.c),int(city.r)),city_has_river(city),district_buildings(city))
	return BuildingOperations.wall_upgrade_plan(game,city,building,target,check)

func upgrade_selected_wall(target: String) -> void:
	if not city_created or not can_build_on_detail() or settler_mode:return
	var city:=current_build_context();var buildings:Array=city.economy.buildings
	if selected_building_index<0 or selected_building_index>=buildings.size():return
	var building:Dictionary=buildings[selected_building_index]
	var check=func(type: String) -> String:
		var county:=district_county_rule(city,type)
		if not county.is_empty():return county
		return CityRules.urban_rule(game,city,city_cell_data(city),type,is_coast(int(city.c),int(city.r)),city_has_river(city),district_buildings(city))
	var result:=BuildingOperations.upgrade_wall(game,city,building,target,check)
	if result.has("error"):update_status(result.error);return
	Labor.allocate(game,game.cities[active_city_index]);update_resources_status();update_status("Müüri uuendamine algas.")

func open_selected_house_designer() -> void:
	if not city_created or not can_build_on_detail() or settler_mode:return
	var city:Dictionary=current_build_context();var buildings:Array=city.economy.buildings
	if selected_building_index<0 or selected_building_index>=buildings.size():return
	var building:Dictionary=buildings[selected_building_index]
	if int(city.team)!=0 or not building.get("ready",false):return
	var id:=house_designer_id(str(building.type),city)
	if id.is_empty():update_status("Seda ehitist ei saa praegu kujundada.");return
	var panel:=open_house_design_panel(id,str(Economy.DATA.data.buildings[building.type].name),building.get("houseDesignV354",{}))
	if panel==null:return
	panel.reset_requested.connect(func():
		if not buildings.has(building):return
		building.erase("houseDesignV354")
		var age:=Production.upgrade_level(game,int(city.team))
		if building.type=="hall":detail_root.place_hall(building.x,building.z,age,float(building.get("buildingRotationV228",0)))
		detail_root.sync_buildings(city,age);update_status("Algne hoonekujundus taastatud.")
	)
	panel.accepted.connect(func(design):
		if not buildings.has(building):return
		if house_design_is_default(design):building.erase("houseDesignV354")
		else:building.houseDesignV354=design.duplicate(true)
		var age:=Production.upgrade_level(game,int(city.team))
		if building.type=="hall":detail_root.place_hall(building.x,building.z,age,float(building.get("buildingRotationV228",0)),building.get("houseDesignV354",{}))
		detail_root.sync_buildings(city,age);update_status("Hoone kujundus salvestatud.")
	)

func open_house_design_panel(id: String,title: String,current: Dictionary) -> Control:
	if is_instance_valid(house_designer_layer):return null
	var old_menu:=menu_open;menu_open=true
	house_designer_layer=CanvasLayer.new();house_designer_layer.layer=40;add_child(house_designer_layer)
	var panel:Control=preload("res://scripts/house_plan_panel.gd").new();house_designer_layer.add_child(panel)
	var layer:=house_designer_layer
	panel.tree_exited.connect(func():menu_open=old_menu;house_designer_layer=null;layer.queue_free())
	if not panel.open_design(id,title,current):panel.queue_free();return null
	return panel


func district_is_county(ctx: Dictionary) -> bool:
	if not ctx.has("districtOf"):return false
	var parent:Dictionary=game.cities[active_city_index];var key:=str(ctx.c)+":"+str(ctx.r)
	var urban:Dictionary=territory_allocation.get("urban",{}).get(str(int(parent.id)),{})
	return not urban.has(key) and not (ctx.get("urbanExpansionV138",false) and CityTerritory.urban_expansion_fits(parent,urban.keys()))

func district_county_rule(ctx: Dictionary,type: String) -> String:
	if not district_is_county(ctx):return ""
	var allowed:=["field","farm","pasture","hunter","fisher","lumber","forester","quarry","mine","coal","coppermine","tinmine","claypit","oilwell","well","bridge","harbor","road_depot","windmill","watermill","palisade","woodgate","stonewall","reinforced_wall","gatehouse","watchtower","stonetower"]
	for building_type in CityRules.DATA.data.good_buildings:
		if CityRules.DATA.data.good_buildings[building_type].get("deposit")!=null:allowed.append(building_type)
	if type not in allowed:return "Maakonnas saab ehitada ainult maa tootmis- ja taristuhooneid. Elamud ja linnahooned ehita linna alale."
	var count:=0
	for b in ctx.economy.buildings:
		if not b.get("virtual",false) and float(b.get("hp",0))>0:count+=1
	return "Maakonnaruudul võib olla kuni 3 hoonet (ka pooleliolevad)." if count>=3 else ""

func district_buildings(ctx: Dictionary) -> Array:
	return DistrictContexts.all_buildings(game.cities[active_city_index]) if not game.cities[active_city_index].get("districts",{}).is_empty() else []

func current_build_context() -> Dictionary:
	if not detail_district.is_empty():return detail_district
	return game.cities[active_city_index] if city_created and active_city_index>=0 and active_city_index<game.cities.size() else {}

func can_build_on_detail() -> bool:
	return detail_mode and (not detail_inspection or not detail_district.is_empty())

func district_context_at(parent: Dictionary,tile: Vector2i,create:=false) -> Variant:
	var existing:Variant=DistrictContexts.existing(parent,tile)
	if existing!=null:return existing
	if not create or tile.x<0 or tile.y<0 or tile.x>=Grid.COLS or tile.y>=Grid.ROWS:return null
	var owner:Variant=territory_allocation.get("territory",{}).get(DistrictContexts.key(tile))
	if owner==null or int(owner.id)!=int(parent.id):return null
	var key:=DistrictContexts.key(tile)
	if not game.has("tileWorlds"):game.tileWorlds={}
	if not game.tileWorlds.has(key):
		var cell:=city_cell_data({"c":tile.x,"r":tile.y})
		game.tileWorlds[key]=DetailWorldScript.create(grid,cell,visual_biome(tile.y*Grid.COLS+tile.x),int(game.seed))
	var world:Dictionary=game.tileWorlds[key]
	return DistrictContexts.create(parent,tile,world,int(game.seed),float(game.time))

func district_nav_for(ctx: Dictionary,worker: Dictionary) -> LocalNavigation:
	var runtime:=ensure_city_runtime(ctx);var base:LocalNavigation=runtime.nav
	var key:="%s:%s:%s:%s" % [ctx.id,ctx.c,ctx.r,worker.get("workerKey","")]
	if not district_agents.has(key) or int(district_agents[key].revision)!=base.revision:district_agents[key]={"revision":base.revision,"nav":base.clone_for_agent()}
	var nav:LocalNavigation=district_agents[key].nav;nav.trail_time=elapsed;return nav

func tick_city_districts(parent: Dictionary,delta: float,production_dt: float,basic_dt: float) -> void:
	for district in parent.get("districts",{}).values():
		DistrictContexts.attach(parent,district);district.economy.time=parent.economy.time
		district.waterFetchV267=parent.get("waterFetchV267",false);district.waterFetchFarV280=parent.get("waterFetchFarV280",false)
		var runtime:=ensure_city_runtime(district);var nav:LocalNavigation=runtime.nav;nav.trail_time=elapsed
		Production.apply_building_upgrades(game,district)
		city_cell_data(district)
		runtime.production.city_wide_buildings=DistrictContexts.all_buildings(parent)
		var changed:bool=runtime.production.tick(game,district,nav,production_dt,grid,basic_dt)
		var view:Node=visible_city_detail(district) if detail_mode else null
		if view!=null:
			var visible:Dictionary=district.duplicate();visible.builderAgents=[]
			for worker in parent.get("builderAgents",[]):
				if int(worker.c)==int(district.c) and int(worker.r)==int(district.r):visible.builderAgents.append(worker)
			visible.trainingAgent=parent.get("trainingAgent");view.update_trainer(visible,elapsed,int(game.ages[int(parent.team)]))
			view.update_builder(visible,elapsed,int(game.ages[int(parent.team)]));view.update_workers(district,elapsed,int(game.ages[int(parent.team)]));view.update_building_animations(elapsed)
			if changed:view.sync_removed_resources(district.world.resources,elapsed,district.economy.buildings)
			var stamp:=visible_city_building_stamp(district)
			if int(view.get_meta("district_building_stamp",-1))!=stamp:
				view.set_meta("district_building_stamp",stamp);view.sync_buildings(district,Production.upgrade_level(game,int(parent.team)))


func wall_drawing_active() -> bool:
	return build_placement_mode and can_build_on_detail() and city_created and not settler_mode and build_select.item_count>0 and str(build_select.get_item_metadata(build_select.selected)) in ["palisade","stonewall","reinforced_wall"]

func toggle_wall_shape() -> void:
	wall_shape="curved" if wall_shape=="straight" else "straight"
	update_status("Müüri kuju: "+("kumer" if wall_shape=="curved" else "sirge")+" · lohista kaardil.")

func toggle_wall_tier() -> void:
	if not wall_drawing_active() or build_select.get_item_metadata(build_select.selected)!="palisade":return
	wall_tier=2 if wall_tier==1 else 1;update_status("Palissaadi tase %d · lohista kaardil." % wall_tier)

func clear_wall_preview() -> void:
	if is_instance_valid(wall_preview):wall_preview.queue_free()
	wall_preview=null

func wall_points_rotated(points: Array) -> Array:
	if points.is_empty():return []
	var result:=[];var start:Dictionary=points[0];var angle:=float(build_angle) if build_angle!=null else 0.0;var c:=cos(angle);var s:=sin(angle)
	for p in points:
		var dx:float=p.x-start.x;var dz:float=p.z-start.z
		result.append({"x":start.x+dx*c+dz*s,"z":start.z-dx*s+dz*c})
	return WallDraw.snap_ends(result,current_build_context().economy.buildings)

func wall_terrain_passable(x: float,z: float) -> bool:
	var center:Vector2i=selected if detail_inspection else player
	var dc:=floori((x+112.5)/225.0);var dr:=floori((z+97.5)/195.0);var tile:=center+Vector2i(dc,dr)
	if tile.x<0 or tile.y<0 or tile.x>=Grid.COLS or tile.y>=Grid.ROWS:return false
	var cell:Dictionary=grid[tile.y*Grid.COLS+tile.x]
	if not cell.land or cell.get("mountain",false):return false
	var owner:Variant=territory_allocation.get("territory",{}).get(DistrictContexts.key(tile))
	if owner==null or int(owner.id)!=int(game.cities[active_city_index].id):return false
	var lx:=x-dc*225.0;var lz:=z-dr*195.0
	if detail_rendered_height(x,z)<=0.2:return false
	var heights:Array=detail_root.heights if dc==0 and dr==0 else detail_pick_heights.get(DistrictContexts.key(tile),[])
	if heights.is_empty():heights=DetailTerrainScript.tile_heights(grid,tile.x,tile.y);detail_pick_heights[DistrictContexts.key(tile)]=heights
	var river:=river_navigation_for(tile.x,tile.y,heights)
	return river==null or river.passable(lx,lz)

func update_wall_stroke(screen: Vector2) -> void:
	var p:Variant=detail_point(screen)
	if p==null:return
	var last:Dictionary=wall_stroke.back()
	if Vector2(last.x,last.z).distance_to(Vector2(p.x,p.z))<1.5:return
	wall_stroke.append({"x":float(p.x),"z":float(p.z)});show_wall_preview()

func show_wall_preview() -> void:
	clear_wall_preview()
	if wall_stroke.size()<2:return
	var result:=WallDraw.plan(wall_points_rotated(wall_stroke),wall_shape,10,wall_terrain_passable)
	var mesh:=ImmediateMesh.new();var material:=StandardMaterial3D.new();material.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;material.albedo_color=Color("e65555") if result.has("error") else Color("78d48b")
	mesh.surface_begin(Mesh.PRIMITIVE_LINE_STRIP,material)
	var curve:Array=result.get("curve",[])
	if curve.is_empty():
		for p in wall_stroke:curve.append(Vector2(p.x,p.z))
	for p in curve:mesh.surface_add_vertex(Vector3(p.x,detail_rendered_height(p.x,p.y)+0.2,p.y))
	mesh.surface_end();wall_preview=MeshInstance3D.new();wall_preview.mesh=mesh;detail_root.add_child(wall_preview)
	if result.has("error"):update_status(result.error)
	else:update_status("Müür: %d lõiku · %s · C muudab kuju, T taset." % [result.segments.size(),"kumer" if wall_shape=="curved" else "sirge"])

func finish_wall_stroke(screen: Vector2) -> void:
	var p:Variant=detail_point(screen)
	if p!=null:wall_stroke.append({"x":float(p.x),"z":float(p.z)})
	var result:=WallDraw.plan(wall_points_rotated(wall_stroke),wall_shape,10,wall_terrain_passable);wall_stroke=[];clear_wall_preview()
	if result.has("error"):update_status(result.error);return
	var type:String=build_select.get_item_metadata(build_select.selected)
	var placement:=place_wall_segments(type,result.segments)
	if placement.has("error"):update_status(placement.error);return
	build_placement_mode=false;clear_building_preview();update_resources_status();update_status("Ehitus algas: %d müürilõiku." % result.segments.size())


func place_wall_segments(type: String,segments: Array) -> Dictionary:
	if segments.is_empty() or type not in ["palisade","stonewall","reinforced_wall"]:return {"error":"Vali müüri lõigud."}
	var parent:Dictionary=game.cities[active_city_index];var team:=int(parent.team);var all:=DistrictContexts.all_buildings(parent);var pending:=0
	for b in all:
		if not b.get("ready",false) and float(b.get("hp",0))>0:pending+=1
		elif b.get("wallUpgradeV184")!=null:pending+=1
	if pending+segments.size()>12:return {"error":"Ehitusjärjekorras pole piisavalt kohti: %d vaba." % maxi(0,12-pending)}
	var definition:Dictionary=Economy.DATA.data.buildings[type];var cost:Dictionary=definition.cost.duplicate(true)
	if type=="palisade" and wall_tier==2:cost.wood=12;cost.stone=2
	var total_cost:Dictionary={}
	for key in cost:total_cost[key]=float(cost[key])*segments.size()
	if not Economy.can_afford(parent.economy.realms[team].resources,total_cost):return {"error":"Müüri jaoks ei jätku materjale."}
	var center:Vector2i=selected if detail_inspection else player;var prepared:=[];var additions:Dictionary={}
	for i in segments.size():
		var part:Dictionary=segments[i];var dc:=floori((float(part.x)+112.5)/225.0);var dr:=floori((float(part.z)+97.5)/195.0);var tile:=center+Vector2i(dc,dr)
		var ctx:Variant=district_context_at(parent,tile,true)
		if ctx==null:return {"error":"Lõik %d jääb väljapoole linna ala." % (i+1)}
		var rural:=district_county_rule(ctx,type)
		if not rural.is_empty():return {"error":"Lõik %d: %s" % [i+1,rural]}
		var rule:=CityRules.urban_rule(game,ctx,city_cell_data(ctx),type,is_coast(int(ctx.c),int(ctx.r)),city_has_river(ctx),district_buildings(ctx))
		if not rule.is_empty():return {"error":"Lõik %d: %s" % [i+1,rule]}
		var world_wall:Dictionary=part.duplicate(true);world_wall.type=type;world_wall.woodFortTierV1757=wall_tier if type=="palisade" else 1
		var terrain_error:=WallDraw.terrain_error(world_wall,wall_terrain_passable,func(x,z):return detail_rendered_height(x,z))
		if not terrain_error.is_empty():return {"error":"Lõik %d: %s" % [i+1,terrain_error]}
		var wall:Dictionary=world_wall.duplicate(true);wall.x=float(part.x)-dc*225.0;wall.z=float(part.z)-dr*195.0;wall.team=team;wall.hp=350;wall.ready=false;wall.progress=0;wall.parent=0;wall.timer=0
		wall.erase("from");wall.erase("to")
		var key:=DistrictContexts.key(tile)
		if not additions.has(key):additions[key]=[]
		if district_is_county(ctx):
			var used:=0
			for existing in ctx.economy.buildings:
				if not existing.get("virtual",false) and float(existing.get("hp",0))>0:used+=1
			if used+additions[key].size()>=3:return {"error":"Maakonnaruudul võib olla kuni 3 hoonet (ka pooleliolevad)."}
		var neighbors:Array=ctx.economy.buildings.duplicate();neighbors.append_array(additions[key])
		var footprint:Dictionary=LocalNav.clearance(wall)
		for b in neighbors:
			if b.get("virtual",false) or float(b.get("hp",0))<=0:continue
			if WallDraw.crosses_gate(wall,b):return {"error":"Lõik %d sulgeks värava läbipääsu." % (i+1)}
			if WallDraw.end_join(wall,b) or (b.type in ["watchtower","stonetower"] and WallDraw.tower_joins(b,wall)):continue
			var other:Variant=LocalNav.clearance(b)
			if other!=null and absf(float(b.x)-float(wall.x))<float(other.rx)+float(footprint.rx) and absf(float(b.z)-float(wall.z))<float(other.rz)+float(footprint.rz):return {"error":"Lõik %d kattuks teise ehitisega." % (i+1)}
		var preview_nav:LocalNavigation=ensure_city_runtime(ctx).nav.clone_for_agent()
		preview_nav.rebuild(neighbors,ctx.world.resources)
		if not preview_nav.preserves_access(wall,neighbors,ctx.world.get("workers",{}),ctx.economy.get("cargo",[])):
			return {"error":"Lõik %d sulgeks hoone või töötaja läbipääsu." % (i+1)}
		for resource in ctx.world.get("resources",[]):
			if resource.get("removed",false) or resource.kind in ["tree","berry","game","fish"]:continue
			if absf(float(resource.x)-float(wall.x))<float(footprint.rx)+4 and absf(float(resource.z)-float(wall.z))<float(footprint.rz)+4:return {"error":"Lõik %d kattuks maardlaga." % (i+1)}
		additions[key].append(wall);prepared.append({"ctx":ctx,"wall":wall})
	for item in prepared:
		var ctx:Dictionary=item.ctx;var wall:Dictionary=item.wall
		Economy.spend_resources(parent.economy.realms[team].resources,cost);var materials:=0.0
		for amount in cost.values():materials+=float(amount)
		wall.materialsRemaining=materials;wall.materialsTotal=materials
		if type=="palisade" and wall_tier==2:wall.buildTimeV1757=24
		ctx.economy.buildings.append(wall);Builder.clear_footprint(ctx.world,wall)
	for key in additions:
		var first:Dictionary={}
		for item in prepared:
			if DistrictContexts.key(Vector2i(int(item.ctx.c),int(item.ctx.r)))==key:first=item.ctx;break
		if first.is_empty():continue
		var runtime:=ensure_city_runtime(first);runtime.nav.rebuild(first.economy.buildings,first.world.resources)
		var view:Node=visible_city_detail(first)
		if view!=null:view.sync_buildings(first,Production.upgrade_level(game,team));view.sync_removed_resources(first.world.resources,elapsed,first.economy.buildings)
	Labor.allocate(game,parent);return {"built":prepared.size()}

# The same city-relative plan can span any owned nearby detail tile.
func ai_defense_terrain(city: Dictionary,x: float,z: float,cache: Dictionary) -> Dictionary:
	var dc:=floori((x+112.5)/225.0);var dr:=floori((z+97.5)/195.0);var c:=int(city.c)+dc;var r:=int(city.r)+dr
	if c<0 or r<0 or c>=Grid.COLS or r>=Grid.ROWS:return {"passable":false,"kind":"edge","height":0.0}
	var key:=str(c)+":"+str(r);var data:Variant=cache.get(key)
	if data==null:
		var cell:Dictionary=grid[r*Grid.COLS+c];var owner:Variant=territory_allocation.get("territory",{}).get(key)
		var owned:=dc==0 and dr==0 or (owner is Dictionary and int(owner.id)==int(city.id))
		var heights:Array=DetailTerrainScript.tile_heights(grid,c,r);var river:Variant=river_navigation_for(c,r,heights)
		data={"cell":cell,"owned":owned,"heights":heights,"river":river};cache[key]=data
	var lx:=x-dc*225.0;var lz:=z-dr*195.0;var height:float=DetailTerrainScript.detail_height(data.heights,lx,lz)
	var kind:="mountain" if data.cell.get("mountain",false) else "water" if height<=0.2 else "river" if data.river!=null and not data.river.passable(lx,lz) else ""
	return {"passable":data.owned and kind.is_empty(),"kind":kind,"height":height}

func ai_outer_preview(city:Dictionary,slot:Dictionary,cache:Dictionary)->bool:
	var team:=int(city.team);var dc:=floori((float(slot.x)+112.5)/225.0);var dr:=floori((float(slot.z)+97.5)/195.0)
	var ctx:Variant=district_context_at(city,Vector2i(int(city.c)+dc,int(city.r)+dr),true)
	if not ctx is Dictionary:return outer_preview_reject("territory")
	var type:=str(slot.get("type",""));var local:Dictionary=slot.duplicate(true);local.x=float(slot.x)-dc*225.0;local.z=float(slot.z)-dr*195.0;local.team=team;local.hp=350
	var rule:=CityRules.urban_rule(game,ctx,city_cell_data(ctx),type,is_coast(int(ctx.c),int(ctx.r)),city_has_river(ctx),DistrictContexts.all_buildings(city),{"outerRingV184":true})
	if not rule.is_empty():return outer_preview_reject("rule:"+rule)
	var global_pass=func(x,z):return ai_defense_terrain(city,x,z,cache).passable
	var global_height=func(x,z):return ai_defense_terrain(city,x,z,cache).height
	if type in ["palisade","stonewall","reinforced_wall"] and not WallDraw.terrain_error(slot,global_pass,global_height).is_empty():return outer_preview_reject("terrain")
	var nav:LocalNavigation=ensure_city_runtime(ctx).nav
	var local_pass=func(x,z):return global_pass.call(x+dc*225.0,z+dr*195.0)
	if AIStoneDefenses.blocked(local,ctx.economy.buildings,nav,local_pass) or AIStoneDefenses.deposit_blocked(local,ctx.world):return outer_preview_reject("obstacle")
	var economy:=DistrictContexts.build_economy(city,ctx)
	for i in economy.buildings.size():
		var b:Dictionary=economy.buildings[i]
		if WallDraw.crosses_gate(local,b):return outer_preview_reject("gate")
		if AIStoneDefenses.allowed_suburb_join(local,b) or AIStoneDefenses.allowed_suburb_corner(local,b,economy.buildings) or WallDraw.end_join(local,b):
			var copy:Dictionary=b.duplicate();copy.virtual=true;economy.buildings[i]=copy
	var passable=func(x,z,_team):return local_pass.call(x,z)
	var result:=Economy.build_rule(economy,team,type,Vector2(local.x,local.z),passable,Callable(),true)
	return outer_preview_reject("build:"+str(result.error)) if result.has("error") else true

func outer_preview_reject(reason:String)->bool:
	outer_survey_debug[reason]=int(outer_survey_debug.get(reason,0))+1
	return false

func ai_outer_survey_stamp(city:Dictionary)->int:
	var records:=[]
	for ctx in DistrictContexts.contexts(city):
		for b in ctx.economy.buildings:
			if b.get("virtual",false):continue
			records.append([ctx.c,ctx.r,b.get("type",""),b.get("x",0),b.get("z",0),float(b.get("hp",0))>0,b.get("ready",false),b.get("wallAngleV175"),b.get("palisadeSpanV167"),b.get("wallUpgradeV184")!=null])
	return hash(records)

func ai_outer_survey_step(city:Dictionary) -> void:
	var key:=str(int(city.id));var job:Variant=outer_ring_surveys.get(key)
	if job==null:
		if not AIStoneDefenses.outer_survey_eligible(game,city):return
		var cache:Dictionary={};var samples:Dictionary={}
		var sample=func(x,z):
			var p:=Vector2(x,z)
			if not samples.has(p):
				if samples.size()>=200000:samples.clear()
				samples[p]=ai_defense_terrain(city,x,z,cache)
			return samples[p]
		var kind=func(x,z):return sample.call(x,z).kind
		var passable=func(x,z):return sample.call(x,z).passable
		var preview=func(slot):return ai_outer_preview(city,slot,cache)
		var maritime:=false
		for ctx in DistrictContexts.contexts(city):
			if is_coast(int(ctx.c),int(ctx.r)):maritime=true;break
		var survey:=OuterRingSurvey.new()
		if not survey.begin(city,kind,passable,preview,maritime):return
		city.nextOuterSurveyV184=float(game.time)+600
		job={"survey":survey,"stamp":ai_outer_survey_stamp(city),"team":int(city.team)};outer_ring_surveys[key]=job
	if city.get("outerRingV184") is Dictionary or int(city.team)!=int(job.team) or int(job.stamp)!=ai_outer_survey_stamp(city):
		outer_ring_surveys.erase(key)
		if not city.get("outerRingV184") is Dictionary:city.nextOuterSurveyV184=minf(float(city.get("nextOuterSurveyV184",game.time)),float(game.time)+15)
		return
	var result:Dictionary=job.survey.advance()
	if not result.done:return
	outer_ring_surveys.erase(key)
	if result.plan is Dictionary:
		city.outerRingV184=result.plan;city.outerRingSurveyFailuresV188=0
		city.outerRingDiagnosticV184={"reason":"surveyed","total":result.plan.slots.size(),"at":game.time}
	else:
		city.outerRingSurveyFailuresV188=int(city.get("outerRingSurveyFailuresV188",0))+1
		city.outerRingDiagnosticV184={"reason":"no-viable-outer-site","failures":city.outerRingSurveyFailuresV188,"at":game.time}

func ai_natural_defense(city: Dictionary,runtime: Dictionary,reserve_only:=false) -> Variant:
	var cache:Dictionary={};var center_key:=str(int(city.c))+":"+str(int(city.r))
	cache[center_key]={"cell":grid[int(city.r)*Grid.COLS+int(city.c)],"owned":true,"heights":runtime.heights,"river":river_navigation_for(int(city.c),int(city.r),runtime.heights)}
	var passable=func(x,z):return ai_defense_terrain(city,x,z,cache).passable
	var feature=func(x,z):return ai_defense_terrain(city,x,z,cache).kind
	var height=func(x,z):return ai_defense_terrain(city,x,z,cache).height
	var buildings:=[]
	for ctx in DistrictContexts.contexts(city):
		for b in ctx.economy.buildings:
			if b.get("virtual",false):continue
			var local:Dictionary=b.duplicate();local.x=float(b.x)+(int(ctx.c)-int(city.c))*225.0;local.z=float(b.z)+(int(ctx.r)-int(city.r))*195.0;buildings.append(local)
	var roads:=AIRoadGates.traffic(game,city,ensure_city_runtime);var seed:=int(game.seed)+int(city.id)*19
	for extra in ([0] if reserve_only else [0,8,16]):
		for variation in [0,37,91,167]:
			var plan:Variant=TerrainDefense.plan(city,buildings,seed+variation,passable,feature,height,AIStoneDefenses.crosses,roads,extra,"palisade",true)
			if plan is Dictionary:return plan
	return null

# V143 rural production: expand only for a real shortfall, after checking
# usable sites in the center and consuming the shared construction queue.
func plan_ai_rural(parent: Dictionary) -> void:
	var team:=int(parent.team);var all:=DistrictContexts.all_buildings(parent);var pending:=0
	for b in all:
		if float(b.get("hp",0))>0 and not b.get("ready",false):pending+=1
	if pending>=2:return
	var needed:=AIRural.useful(game,parent);var types: Array=["hunter","fisher","well","quarry","lumber","farm","coppermine","tinmine","claypit","mine","oilwell","harbor"]
	for type in CityRules.DATA.data.good_buildings:
		if CityRules.DATA.data.good_buildings[type].get("deposit")!=null:types.append(type)
	var tiles:=[]
	for key in territory_allocation.get("territory",{}):
		var owner:Dictionary=territory_allocation.territory[key]
		if int(owner.id)!=int(parent.id):continue
		var parts:=str(key).split(":")
		if parts.size()!=2:continue
		var c:=int(parts[0]);var r:=int(parts[1])
		if c==int(parent.c) and r==int(parent.r):continue
		var occupied:=false
		for other in game.cities:
			if int(other.c)==c and int(other.r)==r:occupied=true;break
		if not occupied:tiles.append({"c":c,"r":r,"distance":absi(c-int(parent.c))+absi(r-int(parent.r)),"order":tiles.size()})
	tiles.sort_custom(func(a,b):return a.order<b.order if a.distance==b.distance else a.distance<b.distance)
	var stock:Dictionary=parent.economy.realms[team].resources
	for type in types:
		if not needed.has(type) or not Economy.DATA.data.buildings.has(type) or not Economy.can_afford(stock,Economy.DATA.data.buildings[type].cost):continue
		var exists:=false
		for b in all:
			if b.type==type and float(b.get("hp",0))>0 and not b.get("disabled",false) and not AIRural.exhausted(parent,b):exists=true;break
		if exists:continue
		var deposit:String=AIRural.SITES.get(type,CityRules.DATA.data.good_buildings.get(type,{}).get("deposit",""))
		var center:=city_cell_data(parent);var local_deposit:bool=is_coast(int(parent.c),int(parent.r)) if deposit=="coast" else bool(center.get("deposits",{}).get(deposit,false))
		if local_deposit and CityRules.urban_rule(game,parent,center,type,is_coast(int(parent.c),int(parent.r)),city_has_river(parent),all).is_empty():
			if place_ai_building(parent,ensure_city_runtime(parent),type,parent,true,24):continue
		for tile in tiles:
			var cell:=city_cell_data(tile)
			if not cell.land or cell.get("mountain",false):continue
			if deposit=="coast":
				if not is_coast(int(tile.c),int(tile.r)):continue
			elif not cell.get("deposits",{}).get(deposit,false):continue
			if merchant_land_path(parent,tile,team)==null:continue
			var ctx:Variant=district_context_at(parent,Vector2i(int(tile.c),int(tile.r)),true)
			if ctx==null:continue
			var duplicate:=false;var local_count:=0
			for b in ctx.economy.buildings:
				if b.get("virtual",false) or float(b.get("hp",0))<=0:continue
				local_count+=1
				if b.type==type:duplicate=true
			if duplicate:continue
			var urban:Dictionary=territory_allocation.get("urban",{}).get(str(int(parent.id)),{})
			if type=="farm" and not urban.has(DistrictContexts.key(Vector2i(int(ctx.c),int(ctx.r)))) and local_count>=2:continue
			if not CityRules.urban_rule(game,ctx,cell,type,is_coast(int(ctx.c),int(ctx.r)),city_has_river(ctx),all).is_empty():continue
			if place_ai_building(ctx,ensure_city_runtime(ctx),type,parent):
				pending+=1;all=DistrictContexts.all_buildings(parent);break
		if pending>=2:break

# A town can exploit a coast inside its county even when its center is inland.
func ai_has_coastal_county(team: int) -> bool:
	for city in game.cities:
		if int(city.team)==team and is_coast(int(city.c),int(city.r)):return true
	for key in territory_allocation.get("territory",{}):
		var owner:Dictionary=territory_allocation.territory[key]
		if int(owner.team)!=team:continue
		var parts:=str(key).split(":")
		if parts.size()!=2:continue
		var c:=int(parts[0]);var r:=int(parts[1])
		if c>=0 and r>=0 and c<Grid.COLS and r<Grid.ROWS and grid[r*Grid.COLS+c].land and is_coast(c,r):return true
	return false

func initialize_ai_defense_reserve(city: Dictionary) -> void:
	if int(city.team)<=0 or int(game.ages[int(city.team)])!=0 or city.has("stoneDefenseReserveV168"):return
	var runtime:=ensure_city_runtime(city)
	var result:Variant=AIStoneDefenses.reserve(game,city,runtime,func():return ai_natural_defense(city,runtime,true))
	if result is Dictionary:city.stoneDefenseReserveV168=result
