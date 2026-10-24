extends Node3D
# Incremental actual JS -> GDScript port. Integrated modules are sourced from
# campaign.js, roads.js, counties-v126.js, economy.js and research.js.
const CampaignPort = preload("res://scripts/core/campaign_port.gd")
const RoadsPort = preload("res://scripts/core/roads_port.gd")
const CountiesPort = preload("res://scripts/core/counties_port.gd")
const Territory = preload("res://scripts/core/territory_port.gd")
const CityFortifications = preload("res://scripts/core/city_fortification_port.gd")
const BuildVersion = preload("res://scripts/core/build_version_port.gd")
const EconomyPort = preload("res://scripts/core/economy_port.gd")
const ResearchPort = preload("res://scripts/core/research_port.gd")
const PortChecks = preload("res://tests/port_checks.gd")
const PreviewSim = preload("res://scripts/core/preview_sim_port.gd")
const NativeRenderer = preload("res://scripts/adapters/v131_native_renderer.gd")
const NativeGridPath = preload("res://scripts/adapters/native_grid_path.gd")
const BuildingProxies = preload("res://scripts/adapters/native_city_buildings.gd")
const CitizenView = preload("res://scripts/adapters/native_citizen_view.gd")
const CargoView = preload("res://scripts/adapters/native_cargo_view.gd")
const LocalStreetNav = preload("res://scripts/adapters/local_street_nav.gd")
const StreetView = preload("res://scripts/adapters/native_street_view.gd")
const WorldTradeNav = preload("res://scripts/adapters/world_trade_nav.gd")
const Trade = preload("res://scripts/core/trade_network_port.gd")
const TradeView = preload("res://scripts/adapters/native_trade_view.gd")
const CountyView = preload("res://scripts/adapters/native_county_logistics_view.gd")
const Military = preload("res://scripts/core/military_port.gd")
const BattlePreview = preload("res://scripts/core/battle_preview_port.gd")
const IndividualBattle = preload("res://scripts/core/individual_battle_port.gd")
const BattleFormations = preload("res://scripts/core/battle_formations_v131.gd")
const BattleSurface = preload("res://scripts/core/battle_surface_v131.gd")
const Siege = preload("res://scripts/core/siege_port_v131.gd")
const IndividualBattleView = preload("res://scripts/adapters/native_individual_battle_view.gd")
const ArmyView = preload("res://scripts/adapters/native_army_view.gd")
const DetailTile = preload("res://scripts/adapters/native_detail_tile.gd")
const SharedLandscape = preload("res://scripts/core/shared_landscape_v131.gd")
const V131Atlas = preload("res://scripts/core/v131_atlas_fixture.gd")
var shared_landscape = null
var baked_atlas: Dictionary = {}
var atlas_loaded: bool = false
var atlas_route_checks: int = 0
var atlas_render_ms: float = 0.0
var world_river_node: MeshInstance3D
var world_bridge_node: MeshInstance3D
var atlas_river_demo_tile: Vector2i = Vector2i(-1,-1)
# Kuningriigid V131 partial native Godot engine benchmark (NOT the whole V131 game).
# Verified V131 invariants: 220x165 world, 17-tile city spacing,
# road traffic levels 12/25/60/120 and three traversals before route reuse.
const COLS: int = 220
const ROWS: int = 165
const CITY_SPACING: int = 17
const ROAD_THRESHOLDS: Array[int] = [12,25,60,120]
const DURATION: float = 20.0
const TEAM_COLORS: Array[Color] = [Color("5eacff"),Color("ed736a"),Color("80d39c"),Color("d5a8f5")]
const EARTH_POLYGONS = [
 [[.575,.36],[.605,.40],[.616,.46],[.594,.474],[.57,.41]],
 [[.07,.2],[.12,.14],[.23,.11],[.32,.16],[.35,.23],[.30,.33],[.31,.40],[.27,.43],[.25,.49],[.22,.46],[.18,.39],[.15,.31],[.1,.28]],
 [[.35,.08],[.41,.10],[.42,.16],[.39,.26],[.35,.21],[.34,.14]],
 [[.28,.49],[.35,.48],[.42,.55],[.43,.63],[.39,.73],[.37,.83],[.34,.90],[.31,.79],[.30,.68],[.27,.58]],
 [[.48,.27],[.51,.20],[.55,.21],[.56,.12],[.59,.09],[.61,.22],[.69,.17],[.75,.13],[.89,.17],[.95,.24],[.93,.31],[.86,.38],[.85,.44],[.81,.49],[.78,.47],[.76,.42],[.73,.43],[.69,.40],[.66,.54],[.63,.45],[.59,.42],[.58,.36],[.52,.37],[.50,.32]],
 [[.48,.40],[.55,.39],[.60,.43],[.63,.49],[.61,.58],[.60,.66],[.56,.77],[.53,.75],[.50,.65],[.48,.55],[.46,.48]],
 [[.82,.68],[.89,.64],[.95,.70],[.96,.77],[.92,.82],[.86,.80],[.81,.75]],
 [[.63,.66],[.65,.68],[.65,.74],[.63,.78],[.62,.73]],
 [[.9,.34],[.91,.35],[.9,.42],[.88,.44],[.89,.39]],
 [[.76,.56],[.82,.57],[.87,.60],[.87,.62],[.80,.60],[.76,.58]],
 [[.90,.86],[.92,.85],[.94,.90],[.93,.94],[.91,.92]]
]

var heights: PackedFloat32Array = PackedFloat32Array()
var walkable: PackedByteArray = PackedByteArray()
var land: PackedByteArray = PackedByteArray()
var cities: Array = []
var actors: Array = []
var roads: Dictionary = {}
var nav: AStarGrid2D
var native_path
var use_native_astar: bool = false
var native_renderer
var building_proxies
var cargo_view
var citizen_view
var citizens_visible: bool = true
var local_streets
var street_view
var street_nav_on: bool = true
var detail_focus: bool = false
var cargo_view_clock: float = 0.0
var last_building_revision: int = -1
var original_models: bool = true
var actor_mm: MultiMesh
var actor_node: MultiMeshInstance3D
var terrain_node: MeshInstance3D
var roads_node: MeshInstance3D
var preview_state: Dictionary = {}
var city_index: int = 3
var city_label: Label
var city_node: MultiMeshInstance3D
var county_node: MeshInstance3D
var camera: Camera3D
var focus: Vector2 = Vector2(109.5,82.5)
var zoom: float = 195.0
var drag_positions: Dictionary = {}
var selected: Vector2i = Vector2i(87,105)
var sample_time: float = 0.0
var road_update_time: float = 0.0
var road_decay_timer: float = 0.0
var road_time: float = 0.0
var county_tile_count: int = 0
var rules_check_result: String = "Kontrollimata"
var frame_samples: Array[float] = []
var bench_active: bool = false
var bench_time: float = 0.0
var bench_samples: Array[float] = []
var bench_results: String = "Mõõtmist pole veel tehtud."
var bench_local_requests: int = 0
var bench_local_hits: int = 0
var bench_local_builds: int = 0
var bench_deliveries: int = 0
var bench_market_purchases: int = 0
var bench_market_deliveries: int = 0
var town_updates: int = 0
var routes_calculated: int = 0
var routes_reused: int = 0
var sim_accumulator: float = 0.0
var ui_label: Label
var info_label: Label
var status_label: Label
var build_version_label: Label
var build_version_state: Dictionary = {}
var build_version_http: HTTPRequest
var build_version_inflight: bool = false
var build_version_check_elapsed: float = 0.0
const BUILD_VERSION_POLL_SECONDS: float = 900.0
var current_actor_count: int = 150
var paused: bool = false
var sim_ticks: int = 0
var territory_revision: int = 0
var ai_enabled: bool = false
var world_trade_nav
var trade_view: Node3D
var county_logistics_view: Node3D
var bench_trade_dispatched: int = 0
var bench_trade_arrived: int = 0
var battle_view: Node3D
var battle_manual: bool = false
var battle_formation_index: int = 0
var battle_tactic_index: int = 0
const BATTLE_TACTICS: Array[String] = ["advance", "hold", "flank", "support"]
var army_view: Node3D
var bench_army_steps: int = 0
var bench_military_trained: int = 0
var bench_battles_finished: int = 0
# V1.8: phone-first UI; category menu replaces the 1.7 offscreen button ribbon.
var mobile_menu: PanelContainer
var menu_category: OptionButton
var menu_actions: GridContainer
var mobile_view: String = "world"
var mobile_menu_open: bool = false
var mobile_status_caption: Label
var native_detail_tile: Node3D
var world_selection_marker: MeshInstance3D
var hidden_world_nodes: Array = []
var detail_last_revision: int = -1
var detail_tile_coords: Vector2i = Vector2i(-1,-1)
var detail_nav_buttons: VBoxContainer
var world_focus_before_detail: Vector2 = Vector2(109.5,82.5)
var world_zoom_before_detail: float = 195.0
var pointer_down: Vector2 = Vector2.ZERO
var pointer_dragged: bool = false
var touch_dragged: bool = false
var last_world_tap_time: int = -1000
var last_world_tap_pos: Vector2 = Vector2(-1000,-1000)
const CityStress = preload("res://scripts/core/city_stress_port.gd")
const CityLayout = preload("res://scripts/core/city_layout_port.gd")
var city_stress_backup: Dictionary = {}
var territory_demo_index: int = -1
var wall_demo_backup: Dictionary = {}
var wall_demo_was_paused: bool = false
var territory_demo_pop: int = 0
var territory_demo_was_paused: bool = false
var city_stress_index: int = -1
var city_stress_crowd_arrivals: int = 0
var bench_crowd_arrivals: int = 0
var bench_county_cycles: int = 0
var bench_county_steps: int = 0
var bench_county_arrivals: int = 0
var bench_county_units: float = 0.0
var bench_supply_sent: int = 0
var bench_supply_arrived: int = 0
var bench_supply_units: float = 0.0
var bench_county_replans: int = 0
var county_demo_backup: Dictionary = {}
var bridge_test_tile: Vector2i = Vector2i(-1,-1)
var county_demo_was_paused: bool = false
const MENU_CATEGORIES: Array[String] = ["Testid", "Linn ja ehitus", "Majandus", "Armee", "Piiramine", "Juhtimine ja salvestus"]
const MOBILE_MENU_ACTIONS = [
    ["Testid", "24 mehe lahing", "infantry_battle"],
    ["Testid", "Katapuldi demo", "artillery"],
    ["Testid", "Pronkslinna piiramine", "siege"],
    ["Testid", "Turu demo", "market"],
    ["Testid", "Kaubanduse demo", "trade"],
    ["Testid", "Armee demo", "army_demo"],
    ["Testid", "Piiride demo: 36 elanikku (12×12)", "territory_demo"],
    ["Testid", "Pronkslinna vallide demo", "wall_demo"],
    ["Testid", "Taasta vallide demo", "wall_demo_reset"],
    ["Testid", "Taasta piiride demo", "territory_reset"],
    ["Testid", "Maakonna veod: demo", "county_demo"],
    ["Testid", "Maakonna sisendveod: demo", "county_inputs"],
    ["Testid", "Sillakatse: jõgi ja sild", "bridge_demo"],
    ["Testid", "Ühise atlase jõgi", "atlas_river_demo"],
    ["Testid", "9x9 kõrguskaart: info", "height9_info"],
    ["Testid", "Maastikulahing: 192 meest", "terrain_battle"],
    ["Testid", "Suur lahinguväli 3x3: 500 meest", "battlefield_500"],
    ["Testid", "Taktikalahing: 120 meest", "battlefield_tactics_120"],
    ["Testid", "Moraali ja taganemise katse", "battlefield_morale_120"],
    ["Testid", "Taganemine maailmakaardile: info", "campaign_retreat_info"],
    ["Testid", "Atlase sild: ava / sulge", "atlas_bridge_toggle"],
    ["Linn ja ehitus", "Ehita maanteesild (30 puit + 10 kivi)", "road_bridge_build"],
    ["Testid", "Sillakatse: ava / sulge", "bridge_toggle"],
    ["Testid", "Taasta maakonnakatse", "county_demo_reset"],
    ["Linn ja ehitus", "Järgmine linn", "next_city"],
    ["Linn ja ehitus", "Linna lähivaade", "city"],
    ["Linn ja ehitus", "Ava valitud ruut", "open_tile"],
    ["Linn ja ehitus", "Metsamaja", "build_lumber"],
    ["Linn ja ehitus", "Jahimehe onn", "build_hunter"],
    ["Linn ja ehitus", "Õpikoda", "build_study"],
    ["Linn ja ehitus", "Kivimurd", "build_quarry"],
    ["Linn ja ehitus", "Saeveski", "build_saw"],
    ["Linn ja ehitus", "Elamu", "build_house"],
    ["Linn ja ehitus", "Turg", "build_market"],
    ["Linn ja ehitus", "Kaev", "build_well"],
    ["Linn ja ehitus", "Talu", "build_farm"],
    ["Linn ja ehitus", "Maakonna mets", "county_lumber"],
    ["Linn ja ehitus", "Maakonna põld", "county_farm"],
    ["Linn ja ehitus", "Maakonna kivimurd", "county_quarry"],
    ["Linn ja ehitus", "Maakonna kaevandus", "county_mine"],
    ["Linn ja ehitus", "Linna maa-ala info", "territory_info"],
    ["Linn ja ehitus", "Ehita puitvall (pronks)", "build_city_wall"],
    ["Linn ja ehitus", "Ava / sulge linnavärav", "city_gate_toggle"],
    ["Linn ja ehitus", "Suur linn: 80 hoonet / 40 inimest", "stress_80"],
    ["Linn ja ehitus", "Suur linn: 160 hoonet / 100 inimest", "stress_160"],
    ["Linn ja ehitus", "Taasta linn (lõpeta katse)", "stress_reset"],
    ["Linn ja ehitus", "Uuri", "research"],
    ["Majandus", "Turu demo", "market"],
    ["Majandus", "Kaubanduse demo", "trade"],
    ["Majandus", "Kaubandus sisse / välja", "trade_toggle"],
    ["Majandus", "AI sisse / välja", "ai_toggle"],
    ["Majandus", "+10 min katseaega", "advance"],
    ["Armee", "Armee demo", "army_demo"],
    ["Armee", "Värba odamees", "recruit"],
    ["Armee", "Armee siht", "march"],
    ["Armee", "24 mehe lahing", "infantry_battle"],
    ["Armee", "Katapuldi demo", "artillery"],
    ["Armee", "Auto / manuaal", "mode"],
    ["Armee", "Rivistus", "formation"],
    ["Armee", "Automaatne rivistus", "auto_formation"],
    ["Armee", "Lahingu taktika info", "battle_tactics_info"],
    ["Armee", "Lahingu moraali info", "battle_morale_info"],
    ["Armee", "Taktika", "tactic"],
    ["Armee", "Ründa", "attack"],
    ["Armee", "Liigu", "move"],
    ["Armee", "Tagane", "retreat"],
    ["Piiramine", "Pronkslinna piiramine", "siege"],
    ["Piiramine", "Ehita redel", "ladder"],
    ["Piiramine", "Ehita piiramistorn", "tower"],
    ["Piiramine", "Ehita ramm", "ram"],
    ["Piiramine", "Ehita piiramislaager", "camp"],
    ["Piiramine", "Värava lõhkumise test", "gate"],
    ["Piiramine", "Hõiva linnasüda", "capture"],
    ["Piiramine", "Ründa", "attack"],
    ["Piiramine", "Rivistus", "formation"],
    ["Juhtimine ja salvestus", "Paus / jätka", "pause"],
    ["Juhtimine ja salvestus", "Suurenda", "zoom_in"],
    ["Juhtimine ja salvestus", "Vähenda", "zoom_out"],
    ["Juhtimine ja salvestus", "150 üksust", "units_150"],
    ["Juhtimine ja salvestus", "500 üksust", "units_500"],
    ["Juhtimine ja salvestus", "1200 üksust", "units_1200"],
    ["Juhtimine ja salvestus", "20s jõudlustest", "benchmark"],
    ["Juhtimine ja salvestus", "Reeglitest", "rules"],
    ["Juhtimine ja salvestus", "BFS / Godot A*", "astar"],
    ["Juhtimine ja salvestus", "Tänavateed / otseteed", "streets"],
    ["Juhtimine ja salvestus", "Originaal GLB / kastid", "models"],
    ["Juhtimine ja salvestus", "Lae V131 mudelid", "load_models"],
    ["Juhtimine ja salvestus", "Elanikud sisse / välja", "citizens"],
    ["Juhtimine ja salvestus", "Armeed sisse / välja", "armies"],
    ["Juhtimine ja salvestus", "Salvesta", "save"],
    ["Juhtimine ja salvestus", "Laadi", "load"]
]

func _ready() -> void:
    _setup_lighting()
    _setup_camera()
    _setup_ui()
    _setup_live_version()
    _load_cities()
    preview_state = PreviewSim.initialize(cities)
    preview_state["world_roads"] = roads
    _build_world()
    _setup_shared_landscape()
    _setup_world_selection_marker()
    _setup_world_trade_nav()
    _build_navigation()
    _build_cities()
    _setup_building_proxies()
    _setup_cargo_view()
    _setup_trade_view()
    _setup_county_logistics_view()
    _setup_army_view()
    _setup_individual_battle_view()
    _setup_citizen_view()
    _setup_local_streets()
    Territory.rebuild(preview_state,land,true)
    Territory.reconcile_worksites(preview_state,land,heights)
    _configure_fine_navigation()
    _build_counties()
    _build_roads()
    _setup_native_renderer()
    _setup_detail_tiles()
    _set_actor_count(current_actor_count)
    # A failing regression test must NEVER crash game startup on mobile.
    # Users run the full suite explicitly via MENÜÜ -> Reeglitest.
    rules_check_result = "vajuta Reeglitest"
    _update_labels()
    # Show available game/test modes immediately on phones instead of only a map.
    _toggle_mobile_menu()

func _setup_live_version() -> void:
    build_version_http = HTTPRequest.new()
    build_version_http.timeout = 12.0
    build_version_http.max_redirects = 4
    add_child(build_version_http)
    build_version_http.request_completed.connect(_version_http_completed)
    _check_latest_version()

func _check_latest_version() -> void:
    if build_version_inflight or not is_instance_valid(build_version_http):
        return
    var error: Error = build_version_http.request(BuildVersion.RELEASES_API,[
        "User-Agent: Kuningriigid-Godot-Version/1.0",
        "Accept: application/vnd.github+json"])
    build_version_inflight = error == OK

func _version_http_completed(result: int,status: int,_headers: PackedStringArray,body: PackedByteArray) -> void:
    build_version_inflight = false
    if result != HTTPRequest.RESULT_SUCCESS or status != 200:
        return # Keep last successfully checked status; offline is not current.
    var latest: String = BuildVersion.latest_from_releases(JSON.parse_string(body.get_string_from_utf8()))
    if latest == "":
        return
    build_version_state = BuildVersion.status_for(str(BuildVersion._json_file(BuildVersion.PACK_INFO).get("tag","")),{
        "checked":true,"tag":latest,"checked_at":int(Time.get_unix_time_from_system())})
    if is_instance_valid(build_version_label):
        build_version_label.text = BuildVersion.hud_text(build_version_state)
    if is_instance_valid(mobile_status_caption):
        mobile_status_caption.text = "Godot V131 osaport | "+BuildVersion.detail_text(build_version_state)

func _setup_lighting() -> void:
    var env := WorldEnvironment.new()
    var e := Environment.new()
    e.background_mode = Environment.BG_COLOR
    e.background_color = Color("a3c3d3")
    e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
    e.ambient_light_color = Color("e1e7f0")
    e.ambient_light_energy = 0.75
    env.environment = e
    add_child(env)
    var light := DirectionalLight3D.new()
    light.rotation_degrees = Vector3(-65,35,-20)
    light.light_energy = 1.0
    light.shadow_enabled = false
    add_child(light)

func _setup_camera() -> void:
    camera = Camera3D.new()
    camera.projection = Camera3D.PROJECTION_ORTHOGONAL
    camera.current = true
    camera.far = 1200.0
    add_child(camera)
    _update_camera()

func _update_camera() -> void:
    if mobile_view == "detail":
        focus.x = clampf(focus.x,DetailTile.CENTER.x-95.0,DetailTile.CENTER.x+95.0)
        focus.y = clampf(focus.y,DetailTile.CENTER.z-85.0,DetailTile.CENTER.z+85.0)
        zoom = clampf(zoom,26.0,230.0)
    else:
        focus.x = clampf(focus.x,0,219)
        focus.y = clampf(focus.y,0,164)
    camera.size = zoom
    camera.global_position = Vector3(focus.x + 0.24 * zoom, 0.74 * zoom, focus.y + 0.34 * zoom)
    camera.look_at(Vector3(focus.x,0.0,focus.y),Vector3.UP)

func _setup_ui() -> void:
    # A persistent, touch-sized navigation bar. No hundreds-of-pixels-wide
    # horizontal strips that put the battle demo off screen on Android.
    var layer := CanvasLayer.new()
    layer.name = "MobileGameHUD"
    add_child(layer)
    var ui_root := Control.new()
    ui_root.name = "HUDFullScreen"
    ui_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    ui_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
    layer.add_child(ui_root)
    var top := PanelContainer.new()
    top.name = "TopNavigation"
    top.anchor_left = 0.0
    top.anchor_right = 1.0
    top.anchor_top = 0.0
    top.anchor_bottom = 0.0
    top.offset_bottom = 72.0
    ui_root.add_child(top)
    var bar := HBoxContainer.new()
    bar.alignment = BoxContainer.ALIGNMENT_CENTER
    bar.add_theme_constant_override("separation",8)
    top.add_child(bar)
    _add_button(bar,"MAAILM",func():_show_world_map(),130)
    _add_button(bar,"LINN",func():_show_city_view(),115)
    _add_button(bar,"LAHING",func():_show_battle_view(),130)
    _add_button(bar,"PIIRAMINE",func():_show_siege_view(),150)
    _add_button(bar,"MENÜÜ",func():_toggle_mobile_menu(),125)
    ui_label = Label.new()
    ui_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
    ui_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    ui_label.add_theme_font_size_override("font_size",16)
    ui_label.text = "Godot"
    bar.add_child(ui_label)
    build_version_state = BuildVersion.snapshot()
    build_version_label = Label.new()
    build_version_label.name = "PersistentBuildVersion"
    build_version_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
    build_version_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
    build_version_label.add_theme_font_size_override("font_size",15)
    build_version_label.custom_minimum_size.x = 225.0
    build_version_label.text = BuildVersion.hud_text(build_version_state)
    bar.add_child(build_version_label)
    # Keep legacy information fields for diagnostics, but do not allow their
    # unrestricted long strings to grow or push usable game controls away.
    info_label = Label.new()
    info_label.visible = false
    ui_root.add_child(info_label)
    city_label = Label.new()
    city_label.visible = false
    ui_root.add_child(city_label)

    var bottom := PanelContainer.new()
    bottom.name = "BottomStatus"
    bottom.anchor_left = 0.0
    bottom.anchor_right = 1.0
    bottom.anchor_top = 1.0
    bottom.anchor_bottom = 1.0
    bottom.offset_top = -71.0
    ui_root.add_child(bottom)
    var b := VBoxContainer.new()
    bottom.add_child(b)
    var status_row := HBoxContainer.new()
    b.add_child(status_row)
    status_label = Label.new()
    status_label.add_theme_font_size_override("font_size",16)
    status_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    status_label.max_lines_visible = 2
    status_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    status_label.text = "Puuduta ruutu ja vajuta AVA RUUT; kaks puudutust avab kohe."
    status_row.add_child(status_label)
    _add_button(status_row,"AVA RUUT",func():_open_selected_tile(),145)
    mobile_status_caption = Label.new()
    mobile_status_caption.add_theme_font_size_override("font_size",13)
    mobile_status_caption.text = "Godot V131 osaport | "+BuildVersion.detail_text(build_version_state)
    b.add_child(mobile_status_caption)

    mobile_menu = PanelContainer.new()
    mobile_menu.name = "ScrollableActionMenu"
    mobile_menu.anchor_left = 0.0
    mobile_menu.anchor_right = 1.0
    mobile_menu.anchor_top = 0.0
    mobile_menu.anchor_bottom = 1.0
    mobile_menu.offset_top = 76.0
    mobile_menu.offset_bottom = -76.0
    mobile_menu.visible = false
    ui_root.add_child(mobile_menu)
    var menu_v := VBoxContainer.new()
    menu_v.add_theme_constant_override("separation",8)
    mobile_menu.add_child(menu_v)
    var title := Label.new()
    title.text = "KUNINGRIIGID • "+str(build_version_state.get("tag","teadmata"))+" — vali tegevus"
    title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    title.add_theme_font_size_override("font_size",22)
    menu_v.add_child(title)
    var category_row := HBoxContainer.new()
    menu_v.add_child(category_row)
    var category_label := Label.new()
    category_label.text = "Kategooria: "
    category_row.add_child(category_label)
    menu_category = OptionButton.new()
    menu_category.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    menu_category.custom_minimum_size.y = 58.0
    category_row.add_child(menu_category)
    for name in MENU_CATEGORIES:
        menu_category.add_item(name)
    menu_category.item_selected.connect(_on_menu_category_changed)
    var scroll := ScrollContainer.new()
    scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
    scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
    scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
    scroll.follow_focus = true
    menu_v.add_child(scroll)
    menu_actions = GridContainer.new()
    menu_actions.columns = 2
    menu_actions.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    menu_actions.add_theme_constant_override("h_separation",12)
    menu_actions.add_theme_constant_override("v_separation",12)
    scroll.add_child(menu_actions)
    _populate_mobile_menu(0)
    detail_nav_buttons = VBoxContainer.new()
    detail_nav_buttons.name = "DetailNeighborNavigation"
    detail_nav_buttons.anchor_left = 1.0
    detail_nav_buttons.anchor_right = 1.0
    detail_nav_buttons.anchor_top = .28
    detail_nav_buttons.anchor_bottom = .28
    detail_nav_buttons.offset_left = -81.0
    detail_nav_buttons.offset_right = -8.0
    detail_nav_buttons.visible = false
    ui_root.add_child(detail_nav_buttons)
    _add_button(detail_nav_buttons,"↑",func():_detail_neighbor(0,-1),64)
    _add_button(detail_nav_buttons,"←",func():_detail_neighbor(-1,0),64)
    _add_button(detail_nav_buttons,"→",func():_detail_neighbor(1,0),64)
    _add_button(detail_nav_buttons,"↓",func():_detail_neighbor(0,1),64)

func _add_button(parent: Node,text: String,cb: Callable,min_width: int = 72) -> void:
    var button := Button.new()
    button.text = text
    button.custom_minimum_size = Vector2(float(min_width),60.0)
    button.add_theme_font_size_override("font_size",19)
    parent.add_child(button)
    button.pressed.connect(cb)

func _populate_mobile_menu(category_index: int) -> void:
    if not is_instance_valid(menu_actions):
        return
    for child in menu_actions.get_children():
        menu_actions.remove_child(child)
        child.queue_free()
    var category_name: String = MENU_CATEGORIES[clampi(category_index,0,MENU_CATEGORIES.size()-1)]
    for item in MOBILE_MENU_ACTIONS:
        if String(item[0]) != category_name:
            continue
        var label: String = String(item[1])
        var action_id: String = String(item[2])
        _add_button(menu_actions,label,Callable(self,"_menu_action").bind(action_id),325)

func _on_menu_category_changed(index: int) -> void:
    _populate_mobile_menu(index)

func _toggle_mobile_menu() -> void:
    mobile_menu_open = not mobile_menu_open
    mobile_menu.visible = mobile_menu_open

func _close_mobile_menu() -> void:
    mobile_menu_open = false
    mobile_menu.visible = false

func _setup_world_selection_marker() -> void:
    var square := PlaneMesh.new()
    square.size = Vector2(.94,.94)
    var material := StandardMaterial3D.new()
    material.albedo_color = Color(1.0,.86,.23,.50)
    material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
    material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
    material.cull_mode = BaseMaterial3D.CULL_DISABLED
    square.material = material
    world_selection_marker = MeshInstance3D.new()
    world_selection_marker.name = "SelectedWorldTileHighlight"
    world_selection_marker.mesh = square
    add_child(world_selection_marker)
    _update_world_selection_marker()

func _update_world_selection_marker() -> void:
    if not is_instance_valid(world_selection_marker) or not DetailTile.tile_valid(selected):
        return
    var y: float = maxf(.12,_ground(selected.x,selected.y)*.52+.18)
    world_selection_marker.position = Vector3(float(selected.x)+.5,y,float(selected.y)+.5)

func _configure_fine_navigation() -> void:
    if world_trade_nav != null and not preview_state.is_empty():
        world_trade_nav.configure_detail(heights,preview_state.get("cities",[]),preview_state.get("detail_bridges",{}),shared_landscape)
    # Building placement, rivers and bridges affect both local and world routes.
    if local_streets != null:
        local_streets.clear()

func _setup_detail_tiles() -> void:
    native_detail_tile = DetailTile.new()
    native_detail_tile.name = "WorldCellDetail225x195"
    add_child(native_detail_tile)
    native_detail_tile.visible = false

func _world_graphics() -> Array:
    return [terrain_node,world_river_node,world_bridge_node,roads_node,city_node,county_node,building_proxies,cargo_view,citizen_view,street_view,trade_view,county_logistics_view,army_view,actor_node,native_renderer,battle_view,world_selection_marker]

func _restore_world_graphics() -> void:
    if is_instance_valid(native_detail_tile):
        native_detail_tile.visible = false
    if is_instance_valid(detail_nav_buttons):
        detail_nav_buttons.visible = false
    for entry in hidden_world_nodes:
        var node: Node3D = entry["node"]
        if is_instance_valid(node):
            node.visible = bool(entry["was_visible"])
    hidden_world_nodes.clear()

func _open_selected_tile() -> void:
    _open_detail_tile(selected)

func _open_detail_tile(cell: Vector2i) -> void:
    if not DetailTile.tile_valid(cell):
        status_label.text = "Vigane maailmaruut"
        return
    _close_mobile_menu()
    if mobile_view != "detail":
        world_focus_before_detail = focus
        world_zoom_before_detail = zoom
        for node in _world_graphics():
            if is_instance_valid(node):
                hidden_world_nodes.append({"node":node,"was_visible":node.visible})
                node.visible = false
    selected = cell
    _update_world_selection_marker()
    detail_tile_coords = cell
    mobile_view = "detail"
    detail_focus = true
    detail_nav_buttons.visible = true
    native_detail_tile.show_tile(cell,preview_state.get("cities",[]),heights,local_streets if street_nav_on else null,preview_state.get("detail_bridges",{}),shared_landscape)
    detail_last_revision = int(preview_state.get("revision",0))
    var index: int = DetailTile.city_index_at(preview_state.get("cities",[]),cell)
    if index < 0:
        index = Territory.owner_at(preview_state,cell.x,cell.y)
    if index >= 0:
        city_index = index
    focus = Vector2(DetailTile.CENTER.x,DetailTile.CENTER.z)
    zoom = 115.0 if index >= 0 else 205.0
    _update_camera()
    status_label.text = "DETAILKAART: " + native_detail_tile.tile_description() + " • MAAILM = tagasi"

func _detail_neighbor(dc: int,dr: int) -> void:
    if mobile_view != "detail":
        return
    var target := detail_tile_coords + Vector2i(dc,dr)
    if DetailTile.tile_valid(target):
        _open_detail_tile(target)

func _show_world_map() -> void:
    _close_mobile_menu()
    if mobile_view == "detail":
        _restore_world_graphics()
        focus = world_focus_before_detail
        zoom = world_zoom_before_detail
    else:
        focus = Vector2(float(selected.x)+.5,float(selected.y)+.5)
        zoom = 195.0
    mobile_view = "world"
    detail_focus = false
    _update_camera()
    status_label.text = "MAAILMAKAART • ruut %d,%d. Puuduta + AVA RUUT (või topeltpuudutus)." % [selected.x,selected.y]

func _show_city_view() -> void:
    var town: Dictionary = preview_state.get("cities",[])[city_index] if city_index >= 0 and city_index < preview_state.get("cities",[]).size() else {}
    if town.is_empty():
        status_label.text = "Katse-linna ei leitud. Vali maailmast ruut."
        return
    _open_detail_tile(Vector2i(int(town.get("c",0)),int(town.get("r",0))))

func _focus_active_battle() -> void:
    if mobile_view == "detail":
        _restore_world_graphics()
    var battle: Dictionary = preview_state.get("individual_battle",{})
    if battle.is_empty():
        return
    mobile_view = "siege" if not battle.get("siege",{}).is_empty() else "battle"
    detail_focus = true
    focus = Vector2(float(battle.get("world_c",109))+.5,float(battle.get("world_r",82))+.5)
    zoom = 76.0 if bool(battle.get("large_battle_test",false)) else 23.0
    _update_camera()
    if is_instance_valid(battle_view):
        battle_view.refresh(preview_state)

func _show_battle_view() -> void:
    _close_mobile_menu()
    var battle: Dictionary = preview_state.get("individual_battle",{})
    if battle.is_empty():
        _individual_battle_demo()
    else:
        _focus_active_battle()
    if not preview_state.get("individual_battle",{}).is_empty():
        _focus_active_battle()
        status_label.text = "LAHING • käsud MENÜÜ → Armee. Sõdurid liiguvad ükshaaval."

func _show_siege_view() -> void:
    _close_mobile_menu()
    var battle: Dictionary = preview_state.get("individual_battle",{})
    if battle.is_empty():
        _siege_battle_demo()
    elif battle.get("siege",{}).is_empty():
        status_label.text = "Tavaline lahing käib. Uue piiramise jaoks laadi test uuesti või lõpeta eelmine lahing."
        _focus_active_battle()
        return
    if not preview_state.get("individual_battle",{}).get("siege",{}).is_empty():
        _focus_active_battle()
        status_label.text = "PIIRAMINE • redel, torn, ramm ja laager: MENÜÜ → Piiramine."

func _menu_action(action_id: String) -> void:
    _close_mobile_menu()
    match action_id:
        "infantry_battle": _show_battle_view()
        "artillery":
            _artillery_battle_demo()
            _focus_active_battle()
        "siege": _show_siege_view()
        "market": _setup_market_demo()
        "trade": _trade_demo()
        "army_demo": _army_demo()
        "territory_demo": _start_territory_demo()
        "territory_reset": _stop_territory_demo()
        "county_demo": _start_county_demo()
        "county_inputs": _start_county_demo(true)
        "atlas_river_demo": _start_atlas_river_demo()
        "height9_info": _show_height9_info()
        "terrain_battle": _terrain_battle_demo()
        "battlefield_500": _large_battle_demo()
        "battlefield_tactics_120": _tactical_battle_demo()
        "battlefield_morale_120": _morale_battle_demo()
        "battle_morale_info": _battle_morale_info()
        "campaign_retreat_info": _campaign_retreat_info()
        "atlas_bridge_toggle": _toggle_atlas_bridge()
        "road_bridge_build": _build_road_bridge()
        "bridge_demo": _start_bridge_demo()
        "bridge_toggle": _toggle_bridge_demo()
        "county_demo_reset": _stop_county_demo()
        "next_city": _select_next_city()
        "city": _show_city_view()
        "open_tile": _open_selected_tile()
        "build_lumber": _preview_build("lumber")
        "build_hunter": _preview_build("hunter")
        "build_study": _preview_build("study")
        "build_quarry": _preview_build("quarry")
        "build_saw": _preview_build("saw")
        "build_house": _preview_build("house")
        "build_market": _preview_build("market")
        "build_well": _preview_build("well")
        "build_farm": _preview_build("farm")
        "county_lumber": _build_county_worksite("lumber")
        "county_farm": _build_county_worksite("farm")
        "county_quarry": _build_county_worksite("quarry")
        "county_mine": _build_county_worksite("mine")
        "territory_info": _show_territory_info()
        "wall_demo": _start_wall_demo()
        "wall_demo_reset": _stop_wall_demo()
        "build_city_wall": _build_city_wall()
        "city_gate_toggle": _toggle_city_gate()
        "stress_80": _start_city_stress(80,40)
        "stress_160": _start_city_stress(160,100)
        "stress_reset": _stop_city_stress()
        "research": _preview_research()
        "trade_toggle": _toggle_trade()
        "ai_toggle": _toggle_preview_ai()
        "advance": _fast_forward_preview()
        "recruit": _recruit_spearman()
        "march": _army_march()
        "mode": _battle_switch_mode()
        "formation": _battle_next_formation()
        "auto_formation": _battle_auto_formation()
        "battle_tactics_info": _battle_tactics_info()
        "tactic": _battle_next_tactic()
        "attack": _battle_attack_command()
        "move": _battle_move_command()
        "retreat": _battle_retreat_command()
        "ladder": _siege_build_ladder()
        "tower": _siege_build_vehicle("tower")
        "ram": _siege_build_vehicle("ram")
        "camp": _siege_build_camp()
        "gate": _siege_gate_breach_test()
        "capture": _siege_order_capture()
        "pause": _toggle_pause()
        "zoom_in": _zoom(.8)
        "zoom_out": _zoom(1.25)
        "units_150": _set_actor_count(150)
        "units_500": _set_actor_count(500)
        "units_1200": _set_actor_count(1200)
        "benchmark": _start_benchmark()
        "rules": _run_rule_checks()
        "astar": _toggle_path_algorithm()
        "streets": _toggle_local_streets()
        "models": _toggle_models()
        "load_models": _retry_models()
        "citizens": _toggle_citizens()
        "armies": _toggle_armies()
        "save": _preview_save()
        "load": _preview_load()
        _: status_label.text = "Tundmatu menüütoiming: " + action_id

func _load_cities() -> void:
    var file := FileAccess.open("res://data/v131_city_sample.json",FileAccess.READ)
    if file == null:
        push_error("City scenario not found")
        return
    var data = JSON.parse_string(file.get_as_text())
    file.close()
    if data is Dictionary:
        cities = data.get("cities",[])

func _world_idx(c: int,r: int) -> int:
    return r * COLS + c

func _near_city(c: int,r: int) -> bool:
    for city in cities:
        if maxi(absi(int(city["c"])-c),absi(int(city["r"])-r)) < 3:
            return true
    return false

func _polygon_signed_distance(u: float,v: float,poly: Array) -> float:
    var inside: bool = false
    var distance: float = 1.0e10
    var j: int = poly.size()-1
    for i in range(poly.size()):
        var a: Vector2 = Vector2(float(poly[i][0]),float(poly[i][1]))
        var b: Vector2 = Vector2(float(poly[j][0]),float(poly[j][1]))
        if ((a.y > v) != (b.y > v)):
            if u < (b.x-a.x)*(v-a.y)/(b.y-a.y)+a.x:
                inside = not inside
        var ab: Vector2 = b-a
        var t: float = clampf((Vector2(u,v)-a).dot(ab)/maxf(.00001,ab.length_squared()),0.0,1.0)
        distance = minf(distance,Vector2(u,v).distance_to(a+t*ab))
        j=i
    return distance if inside else -distance

func _height(c: int,r: int) -> float:
    var u: float = (float(c)+.5)/float(COLS)
    var v: float = (float(r)+.5)/float(ROWS)
    var coast: float = -1.0
    for poly in EARTH_POLYGONS:
        coast = maxf(coast,_polygon_signed_distance(u,v,poly))
    # Earth-inspired polygon silhouettes from V131 earth-map.js.
    # Elevations use a simplified formula: original JS noise map was NOT ported.
    var relief: float = (sin(float(c)*0.31)*cos(float(r)*0.25)+1.0)*.5
    if coast > 0.0:
        return minf(6.5,coast*220.0)*(.45+relief*.6)
    return maxf(-2.2,coast*120.0)

func _ground(c: int,r: int) -> float:
    if c < 0 or r < 0 or c >= COLS or r >= ROWS:
        return 0.0
    return heights[_world_idx(c,r)]

func _build_world() -> void:
    var started: int = Time.get_ticks_usec()
    baked_atlas = V131Atlas.load_baked()
    atlas_loaded = baked_atlas.has("heights")
    heights.resize(COLS*ROWS)
    walkable.resize(COLS*ROWS)
    land.resize(COLS*ROWS)
    var st := SurfaceTool.new()
    st.begin(Mesh.PRIMITIVE_TRIANGLES)
    var mountain_count: int = 0
    for r in range(ROWS):
        for c in range(COLS):
            var h: float = float(baked_atlas["heights"][r*COLS+c]) if atlas_loaded else _height(c,r)
            if not atlas_loaded and _near_city(c,r):
                h=maxf(h,.4)
            var idx: int = _world_idx(c,r)
            heights[idx] = h
            var land: bool = h >= V131Atlas.DISPLAY_SCALE if atlas_loaded else h > 0.0
            var mountains: bool = h > 30.0*V131Atlas.DISPLAY_SCALE if atlas_loaded else h > 5.2
            var passable_cell: bool = land and not mountains
            if atlas_loaded:
                passable_cell = V131Atlas.world_passable(h,int(baked_atlas["downstream"][idx]),int(baked_atlas["fords"][idx]),false)
            walkable[idx] = 1 if passable_cell else 0
            self.land[idx] = 1 if land else 0
            if mountains:
                mountain_count+=1
            var tint: Color
            if not land:
                tint=Color("2b709a") if h < -1.1 else Color("4387a8")
            elif mountains:
                tint=Color("888e83")
            elif h > 3.0:
                tint=Color("637f50")
            elif sin(float(c)*.74+float(r)*.31) > .24:
                tint=Color("477b54")
            else:
                tint=Color("8e9b63")
            var y: float = h*.52
            _terrain_quad(st,float(c),float(r),y,tint)
    var mesh := st.commit()
    var mat := StandardMaterial3D.new()
    mat.vertex_color_use_as_albedo = true
    mat.roughness = 1.0
    mat.cull_mode = BaseMaterial3D.CULL_DISABLED
    mesh.surface_set_material(0,mat)
    terrain_node = MeshInstance3D.new()
    terrain_node.mesh = mesh
    add_child(terrain_node)
    atlas_render_ms = float(Time.get_ticks_usec()-started)/1000.0
    print("Kuningriigid 2.7: v131_earth_baked=",atlas_loaded," cells=",COLS*ROWS," mountains=",mountain_count," atlas_ms=",atlas_render_ms)

func _terrain_quad(st: SurfaceTool,x: float,z: float,y: float,color: Color) -> void:
    var a := Vector3(x,y,z)
    var b := Vector3(x+1.0,y,z)
    var c := Vector3(x+1.0,y,z+1.0)
    var d := Vector3(x,y,z+1.0)
    for p in [a,c,b,a,d,c]:
        st.set_normal(Vector3.UP)
        st.set_color(color)
        st.add_vertex(p)

func _setup_shared_landscape() -> void:
    shared_landscape = SharedLandscape.new()
    if atlas_loaded:
        shared_landscape.configure_baked(heights,baked_atlas["downstream"],baked_atlas["widths"],baked_atlas["fords"])
    else:
        shared_landscape.configure(heights)
    var saved: Dictionary = preview_state.get("atlas_bridges",{})
    for code in saved:
        var b: Dictionary = saved[code]
        var parts: PackedStringArray = String(code).split(":")
        if parts.size() == 2:
            shared_landscape.set_bridge(Vector2i(int(parts[0]),int(parts[1])),Vector2(float(b.get("x",0)),float(b.get("z",0))),bool(b.get("open",false)))
    if atlas_loaded:
        for code in saved.keys():
            var parts: PackedStringArray = String(code).split(":")
            if parts.size() == 2:
                var tile := Vector2i(int(parts[0]),int(parts[1]))
                var idx: int = tile.y*COLS+tile.x
                if tile.x>=0 and tile.x<COLS and tile.y>=0 and tile.y<ROWS and int(baked_atlas["downstream"][idx])>=0:
                    walkable[idx] = 1 if V131Atlas.world_passable(heights[idx],int(baked_atlas["downstream"][idx]),int(baked_atlas["fords"][idx]),bool(shared_landscape.bridge_sites[code].get("open",false))) else 0
    _render_world_rivers()
    _render_world_bridges()

func _render_world_rivers() -> void:
    if shared_landscape == null or shared_landscape.segments.is_empty():
        return
    if is_instance_valid(world_river_node):
        world_river_node.queue_free()
    var surface := SurfaceTool.new()
    surface.begin(Mesh.PRIMITIVE_TRIANGLES)
    for segment in shared_landscape.segments:
        var a: Vector2 = segment["a"]
        var b: Vector2 = segment["b"]
        var dx: Vector2 = (b-a).normalized().orthogonal()*clampf(float(segment.get("width",3.0))/100.0,.025,.10)
        var ya: float = SharedLandscape.source_height(heights,floori(a.x),floori(a.y))+.13
        var yb: float = SharedLandscape.source_height(heights,floori(b.x),floori(b.y))+.13
        var p0 := Vector3(a.x-dx.x,ya,a.y-dx.y)
        var p1 := Vector3(a.x+dx.x,ya,a.y+dx.y)
        var p2 := Vector3(b.x+dx.x,yb,b.y+dx.y)
        var p3 := Vector3(b.x-dx.x,yb,b.y-dx.y)
        for point in [p0,p1,p2,p0,p2,p3]:
            surface.set_normal(Vector3.UP)
            surface.add_vertex(point)
    var mesh: ArrayMesh = surface.commit()
    if mesh == null:
        return
    var mat := StandardMaterial3D.new()
    mat.albedo_color = Color("4ab8d3")
    mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
    mat.cull_mode = BaseMaterial3D.CULL_DISABLED
    world_river_node = MeshInstance3D.new()
    world_river_node.name = "SharedAtlasRivers"
    world_river_node.mesh = mesh
    world_river_node.material_override = mat
    add_child(world_river_node)

func _render_world_bridges() -> void:
    if is_instance_valid(world_bridge_node):
        world_bridge_node.queue_free()
    if shared_landscape == null:
        return
    var surface := SurfaceTool.new()
    surface.begin(Mesh.PRIMITIVE_TRIANGLES)
    var drawn: int = 0
    for code in shared_landscape.bridge_sites.keys():
        var item: Dictionary = shared_landscape.bridge_sites[code]
        if not bool(item.get("open",false)) or bool(item.get("natural_ford",false)):
            continue
        var tokens: PackedStringArray = String(code).split(":")
        if tokens.size() != 2:
            continue
        var tile := Vector2i(int(tokens[0]),int(tokens[1]))
        if tile.x<0 or tile.y<0 or tile.x>=COLS or tile.y>=ROWS:
            continue
        var local := Vector2(float(item.get("x",0.0)),float(item.get("z",0.0)))
        var center: Vector2 = SharedLandscape.detail_to_atlas(tile,local)
        var parts: Array = shared_landscape.segments_for(tile)
        if parts.is_empty():
            continue
        var along: Vector2 = (parts[0]["b"]-parts[0]["a"]).normalized()
        var across: Vector2 = along.orthogonal()
        # 0.28 world cells = 14 atlas metres across the waterway.
        var x: Vector2 = across*.14
        var y: Vector2 = along*.065
        var elevation: float = SharedLandscape.source_height(heights,tile.x,tile.y)+.22
        var pts: Array = [center-x-y,center+x-y,center+x+y,center-x+y]
        for point in [pts[0],pts[1],pts[2],pts[0],pts[2],pts[3]]:
            surface.set_normal(Vector3.UP)
            surface.set_color(Color("ac926b"))
            surface.add_vertex(Vector3(point.x,elevation,point.y))
        drawn += 1
    if drawn <= 0:
        world_bridge_node = null
        return
    var mesh: ArrayMesh = surface.commit()
    var mat := StandardMaterial3D.new()
    mat.albedo_color = Color("ac926b")
    mat.cull_mode = BaseMaterial3D.CULL_DISABLED
    world_bridge_node = MeshInstance3D.new()
    world_bridge_node.name = "V131RoadBridges"
    world_bridge_node.mesh = mesh
    world_bridge_node.material_override = mat
    add_child(world_bridge_node)

func _build_navigation() -> void:
    # Original BFS stays the default for deterministic V131 rules.
    # Native AStarGrid2D is available ONLY as a deliberately different benchmark.
    nav = null

func _make_multi(count: int,shape: Mesh) -> MultiMeshInstance3D:
    var mm := MultiMesh.new()
    mm.transform_format = MultiMesh.TRANSFORM_3D
    mm.use_colors = true
    mm.mesh=shape
    mm.instance_count=count
    mm.custom_aabb = AABB(Vector3(-4,-5,-4),Vector3(228,35,178))
    var inst := MultiMeshInstance3D.new()
    inst.multimesh=mm
    add_child(inst)
    return inst

func _tint_material() -> StandardMaterial3D:
    var m := StandardMaterial3D.new()
    m.vertex_color_use_as_albedo=true
    m.roughness=1.0
    return m

func _build_cities() -> void:
    if is_instance_valid(city_node):
        city_node.queue_free()
    var cube := BoxMesh.new()
    cube.size=Vector3(1.5,2.7,1.5)
    cube.material=_tint_material()
    city_node=_make_multi(cities.size(),cube)
    for i in range(cities.size()):
        var city = cities[i]
        var c: int = int(city["c"])
        var r: int = int(city["r"])
        city_node.multimesh.set_instance_transform(i,Transform3D(Basis(),Vector3(c+.5,_ground(c,r)*.52+1.45,r+.5)))
        city_node.multimesh.set_instance_color(i,TEAM_COLORS[int(city["team"])%4])

func _setup_building_proxies() -> void:
    building_proxies = BuildingProxies.new()
    building_proxies.name = "NativeCityBuildingPreview"
    add_child(building_proxies)
    _refresh_building_proxies()

func _setup_world_trade_nav() -> void:
    world_trade_nav = WorldTradeNav.new()
    world_trade_nav.configure(walkable)

func _setup_trade_view() -> void:
    trade_view = TradeView.new()
    trade_view.name = "NativeWorldCaravans"
    add_child(trade_view)
    trade_view.refresh(preview_state,heights)

func _setup_county_logistics_view() -> void:
    county_logistics_view = CountyView.new()
    county_logistics_view.name = "NativeCountyWorkersAndLoads"
    add_child(county_logistics_view)
    county_logistics_view.refresh(preview_state,heights)

func _toggle_trade() -> void:
    var enabled: bool = not bool(preview_state.get("trade_auto",true))
    preview_state["trade_auto"] = enabled
    status_label.text = "Riigisisene maanteekaubandus: " + ("sees" if enabled else "väljas")
    _update_labels()

func _trade_demo() -> void:
    if world_trade_nav == null or preview_state.is_empty():
        return
    var origin: Dictionary = preview_state["cities"][city_index]
    var candidates: Array = []
    for city in preview_state["cities"]:
        if int(city.get("id",-1)) == int(origin.get("id",-1)) or int(city.get("team",-1)) != int(origin.get("team",-1)):
            continue
        var possible: Array = world_trade_nav.route(origin,city)
        if not possible.is_empty():
            candidates.append({"city":city,"length":possible.size()})
    candidates.sort_custom(func(a,b): return int(a["length"]) < int(b["length"]))
    if candidates.is_empty():
        status_label.text = "DEMO: selle riigi teise linnani ei leitud maismaateed. Vali järgmine linn."
        return
    var target: Dictionary = candidates[0]["city"]
    # Sandbox supplies, not an unearned bonus to a real V131 save.
    # The chosen pair uses the NORMAL trade surplus/demand checks.
    origin["resources"]["wood"] = 180.0
    origin["resources"]["stone"] = 130.0
    origin["resources"]["water"] = 130.0
    target["resources"]["wood"] = 0.0
    target["resources"]["stone"] = 0.0
    target["resources"]["water"] = 4.0
    var result: Dictionary = Trade.dispatch_pair(preview_state,int(origin["id"]),int(target["id"]),world_trade_nav)
    if result.get("ok",false):
        status_label.text = "KAUBANDUSE DEMO: %s → %s (%d ruutu). Kaubad on teel, sihtladu pole veel täienenud." % [String(origin["name"]),String(target["name"]),int(result["steps"])]
    else:
        status_label.text = "KAUBANDUSE DEMO: " + String(result.get("reason","Viga"))
    if is_instance_valid(trade_view):
        trade_view.refresh(preview_state,heights)
    if is_instance_valid(army_view):
        army_view.refresh(preview_state,heights)
    if is_instance_valid(battle_view):
        battle_view.refresh(preview_state)
    _update_labels()

func _setup_army_view() -> void:
    army_view = ArmyView.new()
    army_view.name = "NativeArmyMultiMesh"
    add_child(army_view)
    army_view.refresh(preview_state,heights)

func _toggle_armies() -> void:
    if not is_instance_valid(army_view):
        return
    army_view.visible_armies = not army_view.visible_armies
    army_view.visible = army_view.visible_armies
    status_label.text = "Sõjaväe 3D-markereid: " + ("näha" if army_view.visible_armies else "peidetud")

func _recruit_spearman() -> void:
    if preview_state.is_empty():
        return
    var result: Dictionary = Military.train(preview_state,city_index,"spearman","standard")
    status_label.text = "VÄRBAMINE: " + String(result.get("reason",""))
    _update_labels()

func _army_demo() -> void:
    # Deliberate combat fixture, bypassing costs and unlocks ONLY for the demo.
    # Native recruitment via "Värba odamees" still enforces all constraints.
    if preview_state.is_empty() or world_trade_nav == null:
        return
    Military.setup(preview_state)
    preview_state["armies"] = []
    preview_state["military_units"] = []
    preview_state["active_battle"] = {}
    preview_state["next_army_id"] = 1
    preview_state["next_military_id"] = 1
    var city: Dictionary = preview_state["cities"][city_index]
    var site: Vector2i = _nearest_land(Vector2i(int(city["c"]),int(city["r"])))
    var opponent: Vector2i = Vector2i(-1,-1)
    # Choose a short on-land path without requiring an enemy city to be nearby.
    for dc in [2,-2,0,1,-1]:
        for dr in [0,2,-2,1,-1]:
            var goal: Vector2i = site+Vector2i(dc,dr)
            if goal == site or not world_trade_nav.is_open(goal):
                continue
            var route: Array = world_trade_nav.route({"c":site.x,"r":site.y},{"c":goal.x,"r":goal.y})
            if route.size() >= 1 and route.size() <= 8:
                opponent = goal
                break
        if opponent.x >= 0:
            break
    if opponent.x < 0:
        status_label.text = "Lahingudemoks ei leitud läbitavat naaberruutu."
        return
    var first: Dictionary = Military.create_army(preview_state,int(city["team"]),site.x,site.y)
    var foe_team: int = (int(city["team"])+1)%4
    var second: Dictionary = Military.create_army(preview_state,foe_team,opponent.x,opponent.y)
    for _i in range(3):
        Military.add_unit(preview_state,first,"spearman")
        Military.add_unit(preview_state,second,"axeman")
    # Fixture also enables a legitimate training test, WITHOUT spawning a free recruit.
    preview_state["teams"][int(city["team"])]["known"]["warfare"] = true
    var has_barracks: bool = false
    for building in city["buildings"]:
        if String(building.get("type","")) == "barracks" and bool(building.get("ready",false)):
            has_barracks = true
            break
    if not has_barracks:
        city["buildings"].append({"type":"barracks","ready":true,"hp":350.0,"assigned":1.0})
    city["pop"] = maxi(8,int(city["pop"]))
    city["resources"]["wood"] = maxf(100.0,float(city["resources"].get("wood",0)))
    city["resources"]["stone"] = maxf(60.0,float(city["resources"].get("stone",0)))
    preview_state["revision"] = int(preview_state.get("revision",0)) + 1
    _refresh_building_proxies()
    army_view.refresh(preview_state,heights)
    focus = Vector2(float(site.x),float(site.y))
    zoom = 26.0
    _update_camera()
    status_label.text = "ARMEED (katse): kaks lähestikku eri riikide sõjaväge. Vajuta 'Armee siht', seejärel +10 min või jälgi reaalajas."
    _update_labels()

func _army_march() -> void:
    var armies: Array = preview_state.get("armies",[])
    if armies.size() < 2:
        status_label.text = "Käivita esmalt Armee demo."
        return
    var first: Dictionary = armies[0]
    var enemy: Dictionary = armies[1]
    var result: Dictionary = Military.command_move(preview_state,int(first["id"]),int(enemy["c"]),int(enemy["r"]),world_trade_nav)
    status_label.text = "ARMEELIIKUMINE: " + String(result.get("reason",""))

func _battle_demo() -> void:
    var armies: Array = preview_state.get("armies",[])
    if armies.size() < 2:
        _army_demo()
        armies = preview_state.get("armies",[])
    if armies.size() < 2:
        return
    var a: Dictionary = armies[0]
    var b: Dictionary = armies[1]
    b["c"] = a["c"]
    b["r"] = a["r"]
    b["path"] = []
    var result: Dictionary = BattlePreview.start(preview_state,int(a["id"]),int(b["id"]))
    status_label.text = "AINULT LAHINGUKATSE: " + String(result.get("reason",""))

func _setup_individual_battle_view() -> void:
    battle_view = IndividualBattleView.new()
    battle_view.name = "IndividualBattleNativeMultiMesh"
    add_child(battle_view)
    battle_view.set_prefer_original(original_models)
    battle_view.refresh(preview_state)

func _individual_battle_demo() -> void:
    if preview_state.is_empty():
        return
    if not preview_state.get("active_battle",{}).is_empty():
        status_label.text = "Vana lahingukatse käib. Alusta pärast selle lõppu."
        return
    if preview_state.get("armies",[]).size() < 2:
        _army_demo()
    if preview_state.get("armies",[]).size() < 2:
        return
    var a: Dictionary = preview_state["armies"][0]
    var b: Dictionary = preview_state["armies"][1]
    b["c"] = a["c"]
    b["r"] = a["r"]
    b["path"] = []
    var result: Dictionary = IndividualBattle.start(preview_state,int(a["id"]),int(b["id"]))
    if bool(result.get("ok",false)):
        _attach_battle_relief(Vector2i(int(a["c"]),int(a["r"])))
        focus = Vector2(float(a["c"])+.5,float(a["r"])+.5)
        zoom = 31.0
        detail_focus = true
        _update_camera()
        battle_view.refresh(preview_state)
        paused = false
    status_label.text = "INDIVIDUAALNE LAHING: " + String(result.get("reason",""))
    _update_labels()

func _artillery_battle_demo() -> void:
    # Isolated military fixture: no free catapult added to normal economy.
    # V131 bronze catapult: one operator, 6 stones, LVL-dependent scatter.
    if preview_state.is_empty():
        return
    if not preview_state.get("individual_battle",{}).is_empty() or not preview_state.get("active_battle",{}).is_empty():
        status_label.text = "Lõpeta pooleliolev katselahing enne katapuldidemo käivitamist."
        return
    Military.setup(preview_state)
    var town: Dictionary = preview_state["cities"][city_index]
    var c: int = int(town["c"])
    var r: int = int(town["r"])
    var team: int = int(town["team"])
    var rival: int = (team+1)%4
    var artillery_army: Dictionary = Military.create_army(preview_state,team,c,r)
    var target_army: Dictionary = Military.create_army(preview_state,rival,c,r)
    var weapon: Dictionary = Military.add_unit(preview_state,artillery_army,"bronze_catapult")
    Military.add_unit(preview_state,artillery_army,"spearman")
    Military.add_unit(preview_state,target_army,"axeman")
    Military.add_unit(preview_state,target_army,"spearman")
    var result: Dictionary = IndividualBattle.start(preview_state,int(artillery_army["id"]),int(target_army["id"]))
    if not bool(result.get("ok",false)):
        status_label.text = "Katapuldidemo: " + String(result.get("reason",""))
        return
    _attach_battle_relief(Vector2i(c,r))
    # Raise XP to V131 LVL 10 in this fixture: subsequent shots are exact.
    for squad in preview_state["individual_battle"]["squads"]:
        if int(squad["unit_id"]) == int(weapon["id"]):
            squad["army_level"] = 10
            squad["tactical_role"] = "support"
    focus = Vector2(float(c)+.5,float(r)+.5)
    zoom = 31.0
    detail_focus = true
    _update_camera()
    battle_view.refresh(preview_state)
    paused = false
    status_label.text = "KATAPULDI KATSE: 6 kivi, 1,1 s lend, 4,2 m löögiraadius. LVL 10."
    _update_labels()

func _siege_battle_demo() -> void:
    # Reuses V131 recruitment and the existing individual-battle simulation.
    # This is deliberately a fixture, not actual conquered-town conversion.
    if preview_state.is_empty():
        return
    if not preview_state.get("individual_battle",{}).is_empty() or not preview_state.get("active_battle",{}).is_empty():
        status_label.text = "Lõpeta eelmine lahing enne piiramist."
        return
    Military.setup(preview_state)
    var town: Dictionary = preview_state["cities"][city_index]
    var home_team: int = int(town["team"])
    var built_wall: bool = CityFortifications.fortified(town,Vector2i(int(town["c"]),int(town["r"])))
    var team: int = (home_team+1)%4 if built_wall else home_team
    var defender: int = home_team if built_wall else (home_team+1)%4
    var x: int = int(town["c"])
    var z: int = int(town["r"])
    var attack_army: Dictionary = Military.create_army(preview_state,team,x,z)
    var defend_army: Dictionary = Military.create_army(preview_state,defender,x,z)
    var catapult: Dictionary = Military.add_unit(preview_state,attack_army,"bronze_catapult")
    var infantry: Dictionary = Military.add_unit(preview_state,attack_army,"spearman")
    Military.add_unit(preview_state,attack_army,"bronze_archer")
    Military.add_unit(preview_state,attack_army,"bronze_axeman")
    Military.add_unit(preview_state,attack_army,"bronze_spearman")
    Military.add_unit(preview_state,defend_army,"bronze_spearman")
    Military.add_unit(preview_state,defend_army,"bronze_archer")
    var outcome: Dictionary = IndividualBattle.start(preview_state,int(attack_army["id"]),int(defend_army["id"]))
    if not bool(outcome.get("ok",false)):
        status_label.text = String(outcome.get("reason","Ei õnnestunud alustada"))
        return
    var battle: Dictionary = preview_state["individual_battle"]
    # Isolated fixture stock: enough for ladder, camp, tower and ram.
    if battle.get("siege",{}).is_empty():
        town["resources"]["wood"] = maxf(320.0,float(town["resources"].get("wood",0.0)))
        battle["siege"] = Siege.build_fixture(team,defender)
        Siege.attach_guards(battle)
    var guards: int = int(battle["siege"].get("guard_count",0))
    for squad in battle["squads"]:
        if int(squad["unit_id"]) == int(catapult["id"]):
            squad["army_level"] = 10
            squad["tactical_role"] = "support"
        # Keep every squad inside the compact preview field and leave room
        # around one another. The original full battlefield is much larger.
        if int(squad.get("team",-1)) == team:
            var positions: Dictionary = {"spearman":-2.0,"bronze_archer":6.0,"bronze_axeman":14.0,"bronze_spearman":-11.0,"bronze_catapult":22.0}
            var new_z: float = float(positions.get(String(squad.get("kind","")),0.0))
            var old_z: float = float(squad["anchor"]["z"])
            squad["anchor"]["z"] = new_z
            for man in squad["men"]:
                man["z"] = float(man["z"])+new_z-old_z
        if int(squad["unit_id"]) == int(infantry["id"]) or (String(squad.get("kind","")) in ["bronze_axeman","bronze_spearman"] and int(squad.get("team",-1)) == team):
            squad["combat_mode"] = "manual"
            squad["move_target"] = {}
    focus = Vector2(float(x)+.5,float(z)+.5)
    zoom = 31.0
    detail_focus = true
    _update_camera()
    battle_view.refresh(preview_state)
    paused = false
    status_label.text = ("EHITATUD LINNAVALLI PIIRAMINE: %d kaitsjat; kahjustused salvestuvad linnale." if built_wall else "PRONKSLINNA KATSE: 4 torni, %d kaitsjat, 700 HP värav. Redel 30s / 18 puitu.") % guards
    _update_labels()

func _siege_build_ladder() -> void:
    var battle: Dictionary = preview_state.get("individual_battle",{})
    if battle.is_empty() or battle.get("siege",{}).is_empty():
        status_label.text = "Alusta kõigepealt pronkslinna piiramist."
        return
    var unit_id: int = -1
    for squad in battle["squads"]:
        if int(squad["team"]) == int(battle["siege"]["attacker_team"]) and String(squad["kind"]) == "spearman":
            unit_id = int(squad["unit_id"])
            break
    var result: Dictionary = Siege.start_ladder(preview_state,battle,unit_id)
    status_label.text = "PIIRAMISREDEL: " + String(result.get("reason",""))
    if bool(result.get("ok",false)):
        battle_view.refresh(preview_state)

func _siege_build_camp() -> void:
    var battle: Dictionary = preview_state.get("individual_battle",{})
    var result: Dictionary = Siege.start_camp(preview_state,battle)
    status_label.text = "PIIRAMISLAAGER: " + String(result.get("reason",""))
    if bool(result.get("ok",false)):
        battle_view.refresh(preview_state)

func _siege_build_vehicle(kind: String) -> void:
    var battle: Dictionary = preview_state.get("individual_battle",{})
    var siege: Dictionary = battle.get("siege",{})
    if siege.is_empty():
        status_label.text = "Alusta kõigepealt pronkslinna piiramist."
        return
    var selected: int = -1
    for squad in battle.get("squads",[]):
        if int(squad["team"]) == int(siege["attacker_team"]) and String(squad["kind"]) == ("bronze_spearman" if kind == "ram" else "bronze_axeman"):
            selected = int(squad["unit_id"])
            break
    var result: Dictionary = Siege.start_assault_work(preview_state,battle,selected,kind)
    status_label.text = "PIIRAMISVAHEND: " + String(result.get("reason",""))
    if bool(result.get("ok",false)):
        battle_view.refresh(preview_state)

func _siege_order_capture() -> void:
    var battle: Dictionary = preview_state.get("individual_battle",{})
    var siege: Dictionary = battle.get("siege",{})
    if siege.is_empty():
        status_label.text = "Alusta kõigepealt pronkslinna piiramist."
        return
    var selected: int = -1
    for squad in battle.get("squads",[]):
        if int(squad["team"]) == int(siege["attacker_team"]) and String(squad["kind"]) == "bronze_archer":
            selected = int(squad["unit_id"])
            break
    var result: Dictionary = Siege.order_occupation(battle,selected)
    status_label.text = "LINNASÜDA: " + String(result.get("reason",""))

func _siege_gate_breach_test() -> void:
    # Fixture-only damage injection for stress-testing mesh/nav changes. Not a free player attack.
    var battle: Dictionary = preview_state.get("individual_battle",{})
    var siege: Dictionary = battle.get("siege",{})
    if siege.is_empty():
        status_label.text = "Alusta kõigepealt pronkslinna piiramist."
        return
    for section in siege.get("sections",[]):
        if String(section["type"]) == "gatehouse":
            # Source multiplier .8; inject a deliberately large equivalent damage.
            Siege.damage_structure(siege,int(section["index"]),"bronze_catapult",1000.0)
            status_label.text = "VÄRAVA LÕHKUMISE KATSE: " + ("värav purunes" if bool(siege.get("gate_open",false)) else "värav sai kahjustada")
            break
    battle_view.refresh(preview_state)

func _attach_battle_relief(tile: Vector2i) -> bool:
    var active: Dictionary = preview_state.get("individual_battle",{})
    if active.is_empty() or shared_landscape == null:
        return false
    var samples: PackedFloat32Array = shared_landscape.detail_samples(tile)
    if samples.size() != 81:
        return false
    var river_parts: Array = []
    for item in shared_landscape.segments_for(tile):
        var a: Vector2 = item["a"]
        var b: Vector2 = item["b"]
        if river_parts.size() >= 100:
            break
        river_parts.append({"ax":a.x*64.0/225.0,"az":a.y*50.0/195.0,"bx":b.x*64.0/225.0,"bz":b.y*50.0/195.0,"width":float(item.get("width",3.0))*.27})
    var crossing: Dictionary = shared_landscape.bridge_sites.get("%d:%d" % [tile.x,tile.y],{}).duplicate(true)
    var saved: Dictionary = preview_state.get("detail_bridges",{}).get("%d:%d" % [tile.x,tile.y],{})
    if not saved.is_empty():
        crossing = saved.duplicate(true)
    if not crossing.is_empty():
        crossing["x"] = float(crossing.get("x",0.0))*64.0/225.0
        crossing["z"] = float(crossing.get("z",0.0))*50.0/195.0
        crossing["radius"] = maxf(1.8,float(crossing.get("radius",7.5))*.27)
    var surface: Dictionary = BattleSurface.make(samples,river_parts,crossing,active.get("obstacles",[]))
    if surface.is_empty():
        return false
    # Invalid source terrain must not silently teleport any participant.
    active["surface"] = surface
    active["terrain_routes"] = 0
    active["terrain_blocked"] = 0
    return true

func _terrain_battle_demo() -> void:
    if preview_state.is_empty():
        return
    if not preview_state.get("individual_battle",{}).is_empty() or not preview_state.get("active_battle",{}).is_empty():
        status_label.text = "Lõpeta senine katselahing enne maastikulahingut."
        return
    if shared_landscape == null:
        status_label.text = "Kõrguskaart pole veel laaditud."
        return
    var tile: Vector2i = selected
    if not shared_landscape.height_grid.traversable(tile,Vector2.ZERO):
        var town: Dictionary = preview_state["cities"][city_index]
        tile = Vector2i(int(town["c"]),int(town["r"]))
    if not shared_landscape.height_grid.traversable(tile,Vector2.ZERO):
        status_label.text = "Vali maailmast kuiv ja läbitav ruut."
        return
    Military.setup(preview_state)
    var left: Dictionary = Military.create_army(preview_state,0,tile.x,tile.y)
    var right: Dictionary = Military.create_army(preview_state,1,tile.x,tile.y)
    for i in range(4):
        Military.add_unit(preview_state,left,"spearman" if i%2==0 else "axeman")
        Military.add_unit(preview_state,right,"bronze_spearman" if i%2==0 else "archer")
    var started: Dictionary = IndividualBattle.start(preview_state,int(left["id"]),int(right["id"]))
    if not bool(started.get("ok",false)):
        status_label.text = String(started.get("reason","Lahing ei alanud"))
        return
    if not _attach_battle_relief(tile):
        status_label.text = "Lahingu maastikuandmed ei laaditud."
        preview_state["individual_battle"] = {}
        return
    focus = Vector2(float(tile.x)+.5,float(tile.y)+.5)
    zoom = 23.0
    detail_focus = true
    mobile_view = "battle"
    paused = false
    _update_camera()
    battle_view.refresh(preview_state)
    status_label.text = "MAASTIKULAHING: 192 sõdurit, 9x9 kõrguskaart, vesi, kaljud ja sillad."
    _update_labels()


func _morale_battle_demo() -> void:
    # Same real 120-man terrain scenario as V3.1; explicit initial panic on
    # one ranged squad makes the new rout/exit behaviour easy to inspect.
    _tactical_battle_demo()
    var battle: Dictionary = preview_state.get("individual_battle",{})
    if battle.is_empty():
        return
    battle["morale_demo"] = true
    var marked: bool = false
    for squad in battle.get("squads",[]):
        if int(squad.get("team",0)) != 1 or String(squad.get("kind","")) != "bronze_archer":
            continue
        for soldier in squad.get("men",[]):
            if float(soldier.get("hp",0.0))>0.0:
                soldier["morale"] = 10.0
                soldier["fatigue"] = 70.0
        marked = true
        break
    if marked:
        status_label.text = "MORAALITEST: punaste vibuküttide moraal langeb; jälgi taganemist ja liitlaste paanikat. MENÜÜ → Armee → Lahingu moraali info."
    _update_labels()

func _battle_morale_info() -> void:
    var b: Dictionary = preview_state.get("individual_battle",{})
    if b.is_empty():
        status_label.text = "Aktiivset lahingut pole. Käivita moraali ja taganemise katse."
        return
    var count: int = 0
    var morale: float = 0.0
    var fatigue: float = 0.0
    var routing: int = 0
    var escaped: int = 0
    for squad in b.get("squads",[]):
        if bool(squad.get("reserve",false)):
            continue
        if bool(squad.get("routing",false)):
            routing += 1
        for man in squad.get("men",[]):
            if float(man.get("hp",0.0))<=0.0:
                continue
            if bool(man.get("escaped",false)):
                escaped += 1
                continue
            count += 1
            morale += float(man.get("morale",82.0))
            fatigue += float(man.get("fatigue",0.0))
    status_label.text = "MORAAL: keskmine %.1f | väsimus %.1f | põgenevaid salku %d | pääsenud %d | marsruute %d | nurjunud otsinguid %d" % [morale/float(maxi(1,count)),fatigue/float(maxi(1,count)),routing,escaped,int(b.get("escape_routes",0)),int(b.get("escape_failed_routes",0))]

func _tactical_battle_demo() -> void:
    if preview_state.is_empty() or shared_landscape == null:
        return
    if not preview_state.get("individual_battle",{}).is_empty() or not preview_state.get("active_battle",{}).is_empty():
        status_label.text = "Lõpeta kõigepealt eelmine katselahing."
        return
    var tile: Vector2i = selected
    if not shared_landscape.height_grid.traversable(tile,Vector2.ZERO):
        var city: Dictionary = preview_state["cities"][city_index]
        tile = Vector2i(int(city["c"]),int(city["r"]))
    if not shared_landscape.height_grid.traversable(tile,Vector2.ZERO):
        status_label.text = "Vali kuiva maastikuga maailmaruut."
        return
    Military.setup(preview_state)
    var a: Dictionary = Military.create_army(preview_state,0,tile.x,tile.y)
    var b: Dictionary = Military.create_army(preview_state,1,tile.x,tile.y)
    # 2 infantry (24 each) and 1 cavalry (12) per side = 120 men.
    for kind in ["bronze_spearman","archer","cavalry"]:
        Military.add_unit(preview_state,a,kind)
    for kind in ["spearman","bronze_archer","cavalry"]:
        Military.add_unit(preview_state,b,kind)
    var result: Dictionary = IndividualBattle.start(preview_state,int(a["id"]),int(b["id"]))
    if not bool(result.get("ok",false)):
        status_label.text = String(result.get("reason","Taktikalahing ei alanud"))
        return
    if not _attach_battle_relief(tile):
        preview_state["individual_battle"] = {}
        status_label.text = "Detailmaastikku ei saanud lahinguks laadida."
        return
    var fight: Dictionary = preview_state["individual_battle"]
    for squad in fight["squads"]:
        if String(squad.get("kind","")) == "archer" or String(squad.get("kind","")) == "bronze_archer":
            squad["tactical_role"] = "support"
        elif String(squad.get("kind","")) == "cavalry":
            squad["tactical_role"] = "flank"
    focus = Vector2(float(tile.x)+.5,float(tile.y)+.5)
    zoom = 23.0
    detail_focus = true
    mobile_view = "battle"
    paused = false
    _update_camera()
    battle_view.refresh(preview_state)
    status_label.text = "TAKTIKALAHING: 120 meest | 2 ratsasalka, 2 vibusalka, 2 odasalka | AI valib rivistuse ise."
    _update_labels()

func _attach_large_battle_surface(tile: Vector2i) -> bool:
    var active: Dictionary = preview_state.get("individual_battle",{})
    if active.is_empty() or shared_landscape == null:
        return false
    var tiles: Dictionary = {}
    var river_parts: Array = []
    var bridges: Array = []
    var seen: Dictionary = {}
    for dz in range(-1,2):
        for dx in range(-1,2):
            var here: Vector2i = tile + Vector2i(dx,dz)
            var samples: PackedFloat32Array = shared_landscape.detail_samples(here)
            if samples.size()!=81:
                return false
            var arr: Array = []
            for sample in samples:
                arr.append(float(sample))
            tiles["%d:%d" % [dx,dz]] = arr
            for segment in shared_landscape.segments_for(here):
                var a: Vector2 = segment["a"]+Vector2(float(dx)*225.0,float(dz)*195.0)
                var b: Vector2 = segment["b"]+Vector2(float(dx)*225.0,float(dz)*195.0)
                var key: String = "%d,%d,%d,%d" % [roundi(a.x*10),roundi(a.y*10),roundi(b.x*10),roundi(b.y*10)]
                if seen.has(key):
                    continue
                seen[key] = true
                river_parts.append({"ax":a.x,"az":a.y,"bx":b.x,"bz":b.y,"width":float(segment.get("width",3.0))})
            var crossing: Dictionary = shared_landscape.bridge_sites.get("%d:%d" % [here.x,here.y],{}).duplicate(true)
            var saved: Dictionary = preview_state.get("detail_bridges",{}).get("%d:%d" % [here.x,here.y],{})
            if not saved.is_empty():
                crossing = saved.duplicate(true)
            if not crossing.is_empty():
                crossing["x"] = float(crossing.get("x",0.0))+float(dx)*225.0
                crossing["z"] = float(crossing.get("z",0.0))+float(dz)*195.0
                bridges.append(crossing)
    var surface: Dictionary = BattleSurface.make_large(tiles,river_parts,bridges,[])
    if surface.is_empty():
        return false
    active["surface"] = surface
    active["field"] = {"columns":3,"rows":3,"ring":1,"tile_width":225.0,"tile_depth":195.0,"min_x":-337.5,"max_x":337.5,"min_z":-292.5,"max_z":292.5}
    active["obstacles"] = [] # terrain already owns real rocks and ground blocks
    active["terrain_routes"] = 0
    active["terrain_blocked"] = 0
    return true

func _large_battle_demo() -> void:
    if preview_state.is_empty():
        return
    if not preview_state.get("individual_battle",{}).is_empty() or not preview_state.get("active_battle",{}).is_empty():
        status_label.text = "Lõpeta esmalt eelmine lahing."
        return
    if shared_landscape == null:
        status_label.text = "V131 atlase kõrgusandmed puuduvad."
        return
    var tile: Vector2i = selected
    # Never silently move the battle to another world tile.
    if tile.x<1 or tile.y<1 or tile.x>218 or tile.y>163:
        status_label.text = "Vali kaardi sisemine maailmaruut (3x3 ei mahu kaardiserva)."
        return
    if not shared_landscape.height_grid.traversable(tile,Vector2.ZERO):
        status_label.text = "Vali kuiv ja läbitav lahinguruut."
        return
    Military.setup(preview_state)
    var left: Dictionary = Military.create_army(preview_state,0,tile.x,tile.y)
    var right: Dictionary = Military.create_army(preview_state,1,tile.x,tile.y)
    # 9*24 + 2*12 + 10 scouts = 250 per side, exactly 500 fighters.
    for i in range(9):
        Military.add_unit(preview_state,left,"spearman" if i%2==0 else "axeman")
        Military.add_unit(preview_state,right,"bronze_spearman" if i%2==0 else "archer")
    for i in range(2):
        Military.add_unit(preview_state,left,"cavalry")
        Military.add_unit(preview_state,right,"cavalry")
    for i in range(10):
        Military.add_unit(preview_state,left,"scout")
        Military.add_unit(preview_state,right,"scout")
    var start_result: Dictionary = IndividualBattle.start(preview_state,int(left["id"]),int(right["id"]))
    if not bool(start_result.get("ok",false)):
        status_label.text = String(start_result.get("reason","500 mehe lahing ei alanud"))
        return
    if not _attach_large_battle_surface(tile):
        preview_state["individual_battle"] = {}
        status_label.text = "3x3 maastik ei laaditud."
        return
    var battle: Dictionary = preview_state["individual_battle"]
    var surface: Dictionary = battle["surface"]
    var lanes: Dictionary = {0:0,1:0}
    var actually_placed: int = 0
    for squad in battle["squads"]:
        if bool(squad.get("reserve",false)):
            continue
        var team: int = int(squad["team"])
        var lane: int = int(lanes[team])
        lanes[team] = lane+1
        var side: float = -1.0 if team == 0 else 1.0
        var row: int = int(lane/10)
        var column: int = lane%10
        var intended := Vector2(side*(105.0+float(row)*35.0),-120.0+float(column)*25.0)
        var valid: Vector2 = BattleSurface.nearest_open(surface,intended)
        if not is_finite(valid.x):
            continue
        squad["anchor"] = {"x":valid.x,"z":valid.y}
        squad["move_target"] = {}
        squad["terrain_path"] = []
        for m in squad["men"]:
            var offset: Vector2 = IndividualBattle.formation_slot(squad,int(m["id"]))
            var local: Vector2 = BattleSurface.nearest_open(surface,offset)
            if is_finite(local.x):
                m["x"] = local.x
                m["z"] = local.y
                m["terrain_path"] = []
                m["terrain_retry_at"] = 0.0
                actually_placed += 1
    battle["large_battle_test"] = true
    focus = Vector2(float(tile.x)+.5,float(tile.y)+.5)
    zoom = 76.0
    detail_focus = true
    mobile_view = "battle"
    paused = false
    _update_camera()
    battle_view.refresh(preview_state)
    status_label.text = "V131 3x3 | 675x585m | %d/500 võitlejat | automaatsed formeeringud | punane taganemispiir." % actually_placed
    _update_labels()

func _battle_player_squad() -> Dictionary:
    var battle: Dictionary = preview_state.get("individual_battle",{})
    if battle.is_empty():
        return {}
    # Player-controlled army is the first of the *active battle*, not the
    # first ever army in the saved world (important for artillery demo).
    var own_army_id: int = int(battle.get("army_a",-1))
    var team: int = -1
    for army in preview_state.get("armies",[]):
        if int(army.get("id",-2)) == own_army_id:
            team = int(army["team"])
            break
    for squad in battle["squads"]:
        if int(squad["team"]) == team and not bool(squad["reserve"]):
            return squad
    return {}

func _battle_switch_mode() -> void:
    var squad: Dictionary = _battle_player_squad()
    if squad.is_empty():
        status_label.text = "Alusta 24-mehe lahing."
        return
    battle_manual = not battle_manual
    IndividualBattle.order(preview_state,int(squad["unit_id"]),"manual" if battle_manual else "auto")
    status_label.text = "Salk: " + ("käsitsi – ootab käsku" if battle_manual else "automaatne taktika")

func _battle_next_formation() -> void:
    var squad: Dictionary = _battle_player_squad()
    if squad.is_empty():
        status_label.text = "Alusta lahing enne rivistuse valimist."
        return
    var choices: Array = []
    for formation in IndividualBattle.FORMATIONS:
        if BattleFormations.valid_for(String(squad.get("kind","")),formation):
            choices.append(formation)
    if choices.is_empty():
        return
    var current: int = choices.find(String(squad.get("formation","line")))
    var next: String = String(choices[(current+1)%choices.size()])
    if IndividualBattle.order(preview_state,int(squad["unit_id"]),"formation",{"name":next}):
        status_label.text = "Salk: " + next + " (käsitsi valitud rivistus)"

func _battle_auto_formation() -> void:
    var squad: Dictionary = _battle_player_squad()
    if squad.is_empty():
        status_label.text = "Alusta kõigepealt lahing."
        return
    if IndividualBattle.order(preview_state,int(squad["unit_id"]),"auto_formation"):
        status_label.text = "Salk valib taas rivistuse automaatselt vastase järgi."

func _battle_tactics_info() -> void:
    var b: Dictionary = preview_state.get("individual_battle",{})
    if b.is_empty():
        status_label.text = "Alusta esmalt lahing."
        return
    var strength: float = 0.0
    var groups: int = 0
    for squad in b.get("squads",[]):
        if not bool(squad.get("reserve",false)) and not bool(squad.get("retreated",false)):
            strength += float(squad.get("formation_strength",0.0))
            groups += 1
    status_label.text = "Rivistus: %d salka | tugevus %.0f%% | vahetusi %d | vibude taganemisi %d | ratsamanöövreid %d | välditud laskejooni %d" % [groups,100.0*strength/float(maxi(1,groups)),int(b.get("formation_changes",0)),int(b.get("archer_repositions",0)),int(b.get("cavalry_flanks",0)),int(b.get("friendly_lanes_blocked",0))]

func _battle_next_tactic() -> void:
    var squad: Dictionary = _battle_player_squad()
    if squad.is_empty():
        return
    battle_tactic_index = (battle_tactic_index + 1) % BATTLE_TACTICS.size()
    var role: String = BATTLE_TACTICS[battle_tactic_index]
    if IndividualBattle.order(preview_state,int(squad["unit_id"]),"tactic",{"name":role}):
        status_label.text = "Salk: taktika " + role

func _battle_attack_command() -> void:
    var squad: Dictionary = _battle_player_squad()
    if squad.is_empty():
        return
    var battle: Dictionary = preview_state["individual_battle"]
    for enemy in battle["squads"]:
        if int(enemy["team"]) != int(squad["team"]) and not bool(enemy["reserve"]):
            if IndividualBattle.order(preview_state,int(squad["unit_id"]),"attack",{"unit_id":int(enemy["unit_id"])}):
                battle_manual = true
                status_label.text = "Käsk: ründa vastase salka " + str(enemy["unit_id"])
            return

func _battle_move_command() -> void:
    var squad: Dictionary = _battle_player_squad()
    if squad.is_empty():
        return
    var target: Dictionary = {"x": 0.0, "z": float(squad["anchor"]["z"])}
    if IndividualBattle.order(preview_state,int(squad["unit_id"]),"move",target):
        battle_manual = true
        status_label.text = "Käsk: liigu lahinguvälja keskjoonele"

func _campaign_retreat_info() -> void:
    var reports: Array = preview_state.get("last_campaign_retreats",[])
    if reports.is_empty():
        status_label.text = "Maailmakaardi taganemisi pole. Katseta moraalilahingut ja lase salgal põgeneda."
        return
    var last: Dictionary = reports[reports.size()-1]
    var reached: String = "turvalisele ruudule" if bool(last.get("moved",false)) else "teelõksus — asukoht säilis"
    status_label.text = "TAGANEMINE: armee %d | %s → %s | %s | kokku %d / kinni %d" % [int(last.get("army_id",-1)),str(last.get("from",[])),str(last.get("to",[])),reached,int(preview_state.get("campaign_retreats",0)),int(preview_state.get("campaign_retreats_trapped",0))]

func _battle_retreat_command() -> void:
    var squad: Dictionary = _battle_player_squad()
    if squad.is_empty():
        return
    if IndividualBattle.order(preview_state,int(squad["unit_id"]),"retreat"):
        battle_manual = true
        status_label.text = "Käsk: lahku lahinguväljalt, reservi ei puututa"

func _setup_cargo_view() -> void:
    cargo_view = CargoView.new()
    cargo_view.name = "GodotCargoMultiMesh"
    add_child(cargo_view)
    cargo_view.refresh(preview_state["cities"],heights)

func _setup_citizen_view() -> void:
    citizen_view = CitizenView.new()
    citizen_view.name = "NativeMovingCitizens"
    add_child(citizen_view)
    citizen_view.refresh(preview_state["cities"],heights)

func _toggle_citizens() -> void:
    citizens_visible = not citizens_visible
    if is_instance_valid(citizen_view):
        citizen_view.visible_agents = citizens_visible
        citizen_view.refresh(preview_state["cities"],heights)
    status_label.text = "Elanike 3D-kuvamine: " + ("sees" if citizens_visible else "väljas")

func _setup_local_streets() -> void:
    local_streets = LocalStreetNav.new()
    local_streets.landscape = shared_landscape
    street_view = StreetView.new()
    street_view.name = "NativeLocalStreetRoutes"
    add_child(street_view)

func _toggle_local_streets() -> void:
    street_nav_on = not street_nav_on
    # Paths created under the other navigation algorithm are invalid. Start
    # from the shipment's CURRENT position after switching modes.
    for city in preview_state.get("cities",[]):
        for shipment in city.get("cargo",[]):
            shipment["path_signature"] = ""
            shipment["path_points"] = []
            shipment["waypoint"] = 1
    status_label.text = "Kohalik AStarGrid2D: sisse lülitatud" if street_nav_on else "Otsetee võrdlusrežiim (läbib hooneid)"
    _update_labels()

func _toggle_detail_focus() -> void:
    if mobile_view == "detail":
        _show_world_map()
    else:
        _show_city_view()

func _refresh_building_proxies() -> void:
    if not is_instance_valid(building_proxies) or preview_state.is_empty():
        return
    building_proxies.refresh(preview_state["cities"],heights)
    last_building_revision = int(preview_state.get("revision",0))

func _build_counties() -> void:
    if is_instance_valid(county_node):
        county_node.queue_free()
    var st := SurfaceTool.new()
    st.begin(Mesh.PRIMITIVE_TRIANGLES)
    county_tile_count = 0
    var owners: Dictionary = preview_state.get("territory_owners",{})
    var zones: Dictionary = preview_state.get("territory_zones",{})
    for key in owners:
        var xy: PackedStringArray = String(key).split(":")
        var c: int = int(xy[0])
        var r: int = int(xy[1])
        var owner: int = int(owners[key])
        if owner < 0 or owner >= preview_state["cities"].size():
            continue
        county_tile_count += 1
        var city: Dictionary = preview_state["cities"][owner]
        var tint: Color = TEAM_COLORS[int(city["team"])%4]
        var inner: bool = zones.has(key)
        _terrain_quad(st,float(c),float(r),_ground(c,r)*.52+.065,Color(tint.r,tint.g,tint.b,.39 if inner else .17))
        # Strong border on territorial edge: no duplicate overlays between cities.
        var edge_color: Color = Color(tint.r,tint.g,tint.b,.92)
        for delta in [Vector2i(-1,0),Vector2i(1,0),Vector2i(0,-1),Vector2i(0,1)]:
            var nc: int = c+delta.x
            var nr: int = r+delta.y
            var neighbor_key: String = Territory.tile_key(nc,nr)
            var neighbor_owner: int = int(owners.get(neighbor_key,-1))
            if neighbor_owner == owner:
                continue
            var is_national_edge: bool = neighbor_owner < 0 or int(preview_state["cities"][neighbor_owner]["team"]) != int(city["team"])
            var draw_color: Color = edge_color if is_national_edge else Color(tint.r,tint.g,tint.b,.37)
            var half_width: float = .030 if is_national_edge else .012
            var aa := Vector2(float(c),float(r))
            var bb := Vector2(float(c),float(r))
            if delta.x == -1:
                bb.y += 1.0
            elif delta.x == 1:
                aa.x += 1.0
                bb += Vector2(1.0,1.0)
            elif delta.y == -1:
                bb.x += 1.0
            else:
                aa.y += 1.0
                bb += Vector2(1.0,1.0)
            _emit_road(st,aa,bb,Vector2(half_width,0.0) if delta.x != 0 else Vector2(0.0,half_width),_ground(c,r)*.52+.094,draw_color)
    var mesh := st.commit()
    if mesh == null:
        return
    var mat := _tint_material()
    mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
    mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
    mesh.surface_set_material(0,mat)
    county_node = MeshInstance3D.new()
    county_node.mesh = mesh
    add_child(county_node)

func _setup_native_renderer() -> void:
    native_renderer = NativeRenderer.new()
    native_renderer.name = "NativeGodotModelAdapter"
    add_child(native_renderer)
    native_renderer.visuals_updated.connect(_on_native_visuals_updated)
    native_renderer.loading_status.connect(_on_native_loading_status)
    native_renderer.begin(cities,land,heights)
    native_renderer.library.model_ready.connect(_on_battle_glb_ready)
    if native_renderer.library.has_model("warrior"):
        _on_battle_glb_ready("warrior",native_renderer.library.model_template("warrior"))

func _on_battle_glb_ready(model_id: String, source: Node3D) -> void:
    if model_id == "warrior" and is_instance_valid(battle_view):
        battle_view.set_model_template(source)
        battle_view.set_prefer_original(original_models)
        battle_view.refresh(preview_state)

func _on_native_loading_status(message: String) -> void:
    if status_label != null:
        status_label.text = message + " | Testi jaoks peavad originaal-GLB mudelid olema laetud."

func _on_native_visuals_updated(real_city: bool, real_actors: bool) -> void:
    if is_instance_valid(city_node):
        city_node.visible = not real_city and mobile_view != "detail"
    if is_instance_valid(actor_node):
        actor_node.visible = not real_actors and mobile_view != "detail"

func _toggle_models() -> void:
    original_models = not original_models
    native_renderer.set_original_enabled(original_models)
    if is_instance_valid(battle_view):
        battle_view.set_prefer_original(original_models)
        battle_view.refresh(preview_state)
    status_label.text = "V131 GLB originaalmudelid" if original_models else "Võrdluseks lihtsad Godoti kastid"

func _retry_models() -> void:
    native_renderer.retry_download()

func _toggle_path_algorithm() -> void:
    use_native_astar = not use_native_astar
    if use_native_astar and native_path == null:
        native_path = NativeGridPath.new()
        native_path.configure(walkable)
    _set_actor_count(current_actor_count)
    status_label.text = "Godot AStarGrid2D: teed EI pruugi V131 BFS-iga ühtida" if use_native_astar else "Algne V131 neljasuunaline BFS taastatud"

func _set_actor_count(n: int) -> void:
    current_actor_count=n
    actors.clear()
    routes_calculated=0
    routes_reused=0
    sim_ticks=0
    if is_instance_valid(actor_node):
        actor_node.queue_free()
    var cube := BoxMesh.new()
    cube.size=Vector3(.32,.5,.32)
    cube.material=_tint_material()
    actor_node=_make_multi(n,cube)
    for i in range(n):
        var city = cities[i%maxi(1,cities.size())]
        var start := _nearest_land(Vector2i(int(city["c"]),int(city["r"])))
        var dx: int=(i*17)%17-8
        var dr: int=(i*13)%17-8
        var goal := _nearest_land(Vector2i(clampi(start.x+dx,0,COLS-1),clampi(start.y+dr,0,ROWS-1)))
        var is_soldier: bool=(i%9==0)
        var actor := {"home":start,"work":goal,"position":Vector2(start.x+.5,start.y+.5),"path":[],"step":1,"reverse":false,"out_count":0,"back_count":0,"out_cache":[],"back_cache":[],"soldier":is_soldier,"team":int(city["team"])}
        actors.append(actor)
        actor_node.multimesh.set_instance_color(i,Color("efe3b2") if not is_soldier else TEAM_COLORS[int(city["team"])%4])
        _assign_route(actor)
    if is_instance_valid(native_renderer):
        native_renderer.configure_actors(actors)
        _on_native_visuals_updated(original_models and native_renderer.has_cities(),original_models and native_renderer.has_actors())
    status_label.text="Godot koormus: %d tegelast, %d maailma ruutu. 3x rajaõpe tsiviilisikutele; sõjavägi arvutab uuesti." %[n,COLS*ROWS]
    _update_labels()

func _nearest_land(p: Vector2i) -> Vector2i:
    if walkable[_world_idx(p.x,p.y)] == 1:
        return p
    for radius in range(1,20):
        for dz in range(-radius,radius+1):
            for dx in range(-radius,radius+1):
                var c=clampi(p.x+dx,0,COLS-1)
                var r=clampi(p.y+dz,0,ROWS-1)
                if walkable[_world_idx(c,r)]==1:
                    return Vector2i(c,r)
    return p

func _assign_route(actor: Dictionary) -> void:
    var reverse: bool=bool(actor["reverse"])
    var src: Vector2i=actor["work"] if reverse else actor["home"]
    var dst: Vector2i=actor["home"] if reverse else actor["work"]
    var count_key: String="back_count" if reverse else "out_count"
    var cache_key: String="back_cache" if reverse else "out_cache"
    var path: Array=actor[cache_key]
    # V130/V131: each citizen recomputes its directed route 3 times;
    # soldiers always use fresh pathfinding (no learning cache).
    if actor["soldier"] or int(actor[count_key]) < 3 or path.is_empty():
        var route: Array = native_path.route(src,dst) if use_native_astar and native_path != null else CampaignPort.find_path(walkable,src,dst)
        path=[src]
        path.append_array(route)
        actor[count_key]=int(actor[count_key])+1
        routes_calculated+=1
        if int(actor[count_key]) == 3 and not actor["soldier"]:
            actor[cache_key]=path.duplicate()
    else:
        routes_reused+=1
    actor["path"]=path
    actor["step"]=1

func _process(delta: float) -> void:
    build_version_check_elapsed += delta
    if build_version_check_elapsed >= BUILD_VERSION_POLL_SECONDS:
        build_version_check_elapsed = 0.0
        _check_latest_version()
    var ms: float=delta*1000.0
    frame_samples.append(ms)
    if frame_samples.size()>600:
        frame_samples.pop_front()
    if bench_active:
        bench_samples.append(ms)
        bench_time+=delta
        if bench_time>=DURATION:
            _finish_benchmark()
    if not paused:
        if not preview_state.is_empty():
            PreviewSim.tick(preview_state,delta,local_streets if street_nav_on else null,world_trade_nav,shared_landscape)
            if Territory.rebuild(preview_state,land):
                Territory.reconcile_worksites(preview_state,land,heights)
                _build_counties()
            road_time = float(preview_state.get("seconds",road_time))
            if int(preview_state.get("revision",0)) != last_building_revision:
                _configure_fine_navigation()
                _refresh_building_proxies()
                if mobile_view == "detail" and detail_tile_coords.x >= 0:
                    native_detail_tile.show_tile(detail_tile_coords,preview_state.get("cities",[]),heights,local_streets if street_nav_on else null,preview_state.get("detail_bridges",{}),shared_landscape)
                    detail_last_revision = int(preview_state.get("revision",0))
            cargo_view_clock += delta
            if cargo_view_clock >= 0.15 and is_instance_valid(cargo_view):
                cargo_view_clock = 0.0
                cargo_view.refresh(preview_state["cities"],heights)
                trade_view.refresh(preview_state,heights)
                county_logistics_view.refresh(preview_state,heights)
                if is_instance_valid(army_view):
                    army_view.refresh(preview_state,heights)
                if is_instance_valid(battle_view):
                    battle_view.refresh(preview_state)
                citizen_view.refresh(preview_state["cities"],heights)
                # Separate synthetic crowd for fair native rendering and
                # pathfinding benchmarks. No economic production is faked.
                if city_stress_index >= 0 and city_stress_index < preview_state["cities"].size():
                    var result: Dictionary = CityStress.advance(preview_state["cities"][city_stress_index],.15,local_streets if street_nav_on else null)
                    city_stress_crowd_arrivals += int(result["arrivals"])
                # Moving inhabitants/cargo inside the selected detail tile.
                if mobile_view == "detail" and is_instance_valid(native_detail_tile):
                    var detail_index: int = native_detail_tile.town_index
                    if detail_index >= 0 and detail_index < preview_state["cities"].size():
                        native_detail_tile.refresh_movers(preview_state["cities"][detail_index],preview_state.get("county_shipments",[]),preview_state.get("world_roads",{}),float(preview_state.get("seconds",0.0)))
                    elif native_detail_tile.owner_index >= 0:
                        native_detail_tile.refresh_county_movers(preview_state["cities"][native_detail_tile.owner_index],preview_state.get("county_shipments",[]),preview_state.get("world_roads",{}),float(preview_state.get("seconds",0.0)))
                street_view.refresh(preview_state["cities"],heights,city_index)
        _advance_actors(minf(delta,.06))
        sim_accumulator+=delta
        road_update_time+=delta
        road_decay_timer+=delta
        if road_decay_timer>=30.0:
            road_decay_timer=fmod(road_decay_timer,30.0)
            # Trade.age_roads() ages shared road state on simulation minute boundaries.
        if sim_accumulator>=1.0:
            town_updates+=cities.size()
            sim_ticks+=1
            sim_accumulator-=1.0
        if road_update_time>=2.5:
            road_update_time=0.0
            _build_roads()
    sample_time+=delta
    if sample_time>=.5:
        sample_time=0.0
        _update_labels()

func _advance_actors(dt: float) -> void:
    for i in range(actors.size()):
        var actor: Dictionary=actors[i]
        var path: Array=actor["path"]
        var step: int=int(actor["step"])
        if path.size()>1 and step<path.size():
            var dst: Vector2i=path[step]
            var p: Vector2=actor["position"]
            var target := Vector2(dst.x+.5,dst.y+.5)
            var diff: Vector2=target-p
            var distance: float=diff.length()
            var speed: float=3.7 if actor["soldier"] else 2.2
            if distance<=speed*dt+.000001:
                actor["position"]=target
                actor["step"]=step+1
                if step > 0:
                    _record_step(path[step-1],dst,actor["soldier"])
            else:
                actor["position"]=p+diff.normalized()*speed*dt
        else:
            actor["reverse"]=not actor["reverse"]
            _assign_route(actor)
        var here: Vector2=actor["position"]
        var cc: int=clampi(int(here.x),0,COLS-1)
        var rr: int=clampi(int(here.y),0,ROWS-1)
        var pos := Vector3(here.x,_ground(cc,rr)*.52+.4,here.y)
        actor_mm_set(i,pos)
        if is_instance_valid(native_renderer):
            var facing: float = 0.0
            if path.size() > 1 and step < path.size():
                var waypoint: Vector2i = path[step]
                facing = atan2(float(waypoint.x) + .5 - here.x,float(waypoint.y) + .5 - here.y)
            native_renderer.sync_actor(i,here,facing)

func actor_mm_set(index: int,pos: Vector3) -> void:
    actor_node.multimesh.set_instance_transform(index,Transform3D(Basis(),pos))

func _record_step(a: Vector2i,b: Vector2i,soldier: bool) -> void:
    RoadsPort.record_world_step(roads,a,b,"army" if soldier else "builder",road_time)

func _build_roads() -> void:
    if is_instance_valid(roads_node):
        roads_node.queue_free()
    var st := SurfaceTool.new()
    st.begin(Mesh.PRIMITIVE_TRIANGLES)
    var visible_roads: int=0
    for key in roads.keys():
        var level: int=RoadsPort.road_level(RoadsPort.strength_for_key(roads,String(key),road_time))
        if level==0:
            continue
        visible_roads+=1
        var parts: PackedStringArray=String(key).split(":")
        var a_idx: int=int(parts[0])
        var b_idx: int=int(parts[1])
        var a: Vector2=Vector2(float(a_idx%COLS)+.5,float(a_idx/COLS)+.5)
        var b: Vector2=Vector2(float(b_idx%COLS)+.5,float(b_idx/COLS)+.5)
        var width: float=[.0,.026,.036,.048,.062][level]
        var color: Color=Color("a69a72")
        var from_cell := Vector2i(a_idx%COLS,int(a_idx/COLS))
        var to_cell := Vector2i(b_idx%COLS,int(b_idx/COLS))
        var curve: Array = SharedLandscape.v131_road_curve(from_cell,to_cell,8) if atlas_loaded else [a,b]
        var h0: float=_ground(from_cell.x,from_cell.y)*.52+.105
        var h1: float=_ground(to_cell.x,to_cell.y)*.52+.105
        for step in range(1,curve.size()):
            var point_a: Vector2 = curve[step-1]
            var point_b: Vector2 = curve[step]
            var delta: Vector2 = point_b-point_a
            if delta.length_squared()<.0000001:
                continue
            var side: Vector2 = delta.normalized().orthogonal()*width*.5
            _emit_road_sloped(st,point_a,point_b,side,lerpf(h0,h1,float(step-1)/float(curve.size()-1)),lerpf(h0,h1,float(step)/float(curve.size()-1)),color)
    roads_node=MeshInstance3D.new()
    if visible_roads>0:
        var mesh := st.commit()
        var mat := _tint_material()
        mat.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED
        mesh.surface_set_material(0,mat)
        roads_node.mesh=mesh
    add_child(roads_node)

func _emit_road(st: SurfaceTool,a: Vector2,b: Vector2,offset: Vector2,y: float,c: Color) -> void:
    var p0:=Vector3(a.x+offset.x,y,a.y+offset.y)
    var p1:=Vector3(a.x-offset.x,y,a.y-offset.y)
    var p2:=Vector3(b.x-offset.x,y,b.y-offset.y)
    var p3:=Vector3(b.x+offset.x,y,b.y+offset.y)
    for p in [p0,p1,p2,p0,p2,p3]:
        st.set_normal(Vector3.UP)
        st.set_color(c)
        st.add_vertex(p)

func _emit_road_sloped(st: SurfaceTool,a: Vector2,b: Vector2,side: Vector2,ya: float,yb: float,color: Color) -> void:
    for point in [Vector3(a.x+side.x,ya,a.y+side.y),Vector3(a.x-side.x,ya,a.y-side.y),Vector3(b.x-side.x,yb,b.y-side.y),Vector3(a.x+side.x,ya,a.y+side.y),Vector3(b.x-side.x,yb,b.y-side.y),Vector3(b.x+side.x,yb,b.y+side.y)]:
        st.set_normal(Vector3.UP)
        st.set_color(color)
        st.add_vertex(point)

func _start_benchmark() -> void:
    bench_crowd_arrivals = city_stress_crowd_arrivals
    bench_county_cycles = int(preview_state.get("county_cycles",0))
    bench_county_steps = int(preview_state.get("county_worker_steps",0))+int(preview_state.get("county_cargo_steps",0))
    bench_county_arrivals = int(preview_state.get("county_cargo_delivered",0))
    bench_county_units = float(preview_state.get("county_units_delivered",0.0))
    bench_supply_sent = int(preview_state.get("county_supply_sent",0))
    bench_supply_arrived = int(preview_state.get("county_supply_delivered",0))
    bench_supply_units = float(preview_state.get("county_supply_units",0.0))
    bench_county_replans = int(preview_state.get("county_route_replans",0))
    bench_active=true
    bench_time=0.0
    bench_samples.clear()
    bench_local_requests = local_streets.requests if local_streets != null else 0
    bench_local_hits = local_streets.hits if local_streets != null else 0
    bench_local_builds = local_streets.grid_builds if local_streets != null else 0
    bench_deliveries = int(preview_state.get("cargo_deliveries",0))
    bench_market_purchases = int(preview_state.get("market_purchases",0))
    bench_market_deliveries = int(preview_state.get("market_deliveries",0))
    bench_trade_dispatched = int(preview_state.get("trade_dispatched",0))
    bench_trade_arrived = int(preview_state.get("trade_arrived",0))
    bench_army_steps = int(preview_state.get("army_steps",0))
    bench_military_trained = int(preview_state.get("military_trained",0))
    bench_battles_finished = int(preview_state.get("battles_finished",0))
    status_label.text="20 sekundit mõõtmist käib. Ära muuda koormust ega pöörle ekraani."

func _finish_benchmark() -> void:
    bench_active=false
    if bench_samples.is_empty():
        return
    var ordered: Array[float]=bench_samples.duplicate()
    ordered.sort()
    var total: float=0.0
    for s in ordered:
        total+=s
    var average_ms: float=total/float(ordered.size())
    var p95: float=ordered[mini(ordered.size()-1,int(float(ordered.size())*.95))]
    var p99: float=ordered[mini(ordered.size()-1,int(float(ordered.size())*.99))]
    var fps: float=1000.0/maxf(.0001,average_ms)
    var building_count: int = preview_state["cities"][city_index]["buildings"].size() if city_index < preview_state["cities"].size() else 0
    var stress_people: int = int(preview_state["cities"][city_index].get("stress_people",0)) if city_index < preview_state["cities"].size() else 0
    bench_results="%d hoonet / %d jalutajat | %.1f FPS | avg %.2fms | p95 %.2fms | p99 %.2fms" % [building_count,stress_people,fps,average_ms,p95,p99]
    var report_path="user://v131_godot_measurements_v33.csv"
    var is_new: bool=not FileAccess.file_exists(report_path)
    var file:=FileAccess.open(report_path,FileAccess.READ_WRITE if not is_new else FileAccess.WRITE)
    if file != null:
        if is_new:
            file.store_line("mode,actor_count,terrain_cells,cities,samples,mean_ms,p95_ms,p99_ms,avg_fps,world_routes,world_cache,county_tiles,local_routes,local_cache,local_rebuilds,cargo_deliveries,market_purchases,market_deliveries,trade_departures,trade_arrivals,trade_route_searches,trade_route_cache,army_steps,units_trained,battles_finished,individual_battle_men,individual_battle_shots,selected_city_buildings,synthetic_walkers,walker_arrivals,local_route_failures,selected_city_urban_tiles,selected_city_county_tiles,selected_city_rural_worksites,county_production_cycles,county_active_workers,county_shipments,county_world_steps,county_deliveries,county_goods_delivered,county_supply_departures,county_supply_arrivals,county_supply_units,county_route_replans,detail_astar_searches,detail_astar_cache_hits,detail_astar_rejected_edges,v131_atlas_enabled,atlas_line_segments,atlas_crossing_sites,atlas_initial_ms,terrain_battle_routes,terrain_battle_blocked,formation_changes,archer_repositions,cavalry_flanks,blocked_friendly_shots,morale_routs,ordered_retreats,escape_routes,escape_failed_routes,flank_shocks,campaign_retreats,campaign_retreats_trapped")
        else:
            file.seek_end()
        var mode: String = ("GLB" if original_models and native_renderer.has_actors() else "proxy") + ("-GodotAStar" if use_native_astar else "-V131BFS")
        mode += "-LocalAStar" if street_nav_on else "-DirectCargo"
        var lr: int = (local_streets.requests if local_streets != null else 0) - bench_local_requests
        var lc: int = (local_streets.hits if local_streets != null else 0) - bench_local_hits
        var lg: int = (local_streets.grid_builds if local_streets != null else 0) - bench_local_builds
        var cd: int = int(preview_state.get("cargo_deliveries",0)) - bench_deliveries
        var mp: int = int(preview_state.get("market_purchases",0)) - bench_market_purchases
        var md: int = int(preview_state.get("market_deliveries",0)) - bench_market_deliveries
        var td: int = int(preview_state.get("trade_dispatched",0)) - bench_trade_dispatched
        var ta: int = int(preview_state.get("trade_arrived",0)) - bench_trade_arrived
        var values := PackedStringArray([
            mode,str(actors.size()),str(COLS*ROWS),str(cities.size()),str(ordered.size()),
            "%.4f" % average_ms,"%.4f" % p95,"%.4f" % p99,"%.3f" % fps,
            str(routes_calculated),str(routes_reused),str(county_tile_count),
            str(lr),str(lc),str(lg),str(cd),str(mp),str(md),str(td),str(ta),
            str(world_trade_nav.searches),str(world_trade_nav.hits),
            str(int(preview_state.get("army_steps",0))-bench_army_steps),
            str(int(preview_state.get("military_trained",0))-bench_military_trained),
            str(int(preview_state.get("battles_finished",0))-bench_battles_finished),
            str(battle_view.last_count if is_instance_valid(battle_view) else 0),
            str(int(preview_state.get("individual_battle",{}).get("shots",0))),
            str(building_count),str(stress_people),
            str(city_stress_crowd_arrivals-bench_crowd_arrivals),
            str(local_streets.failures if local_streets != null else 0),
            str(preview_state["cities"][city_index].get("territory_urban",[]).size()),
            str(preview_state["cities"][city_index].get("territory_county",[]).size()),
            str(preview_state["cities"][city_index].get("county_worksites",[]).size()),
            str(int(preview_state.get("county_cycles",0)) - bench_county_cycles),
            str(county_logistics_view.worker_count if is_instance_valid(county_logistics_view) else 0),
            str(preview_state.get("county_shipments",[]).size()),
            str(int(preview_state.get("county_worker_steps",0))+int(preview_state.get("county_cargo_steps",0))-bench_county_steps),
            str(int(preview_state.get("county_cargo_delivered",0))-bench_county_arrivals),
            str(float(preview_state.get("county_units_delivered",0.0))-bench_county_units),
            str(int(preview_state.get("county_supply_sent",0))-bench_supply_sent),
            str(int(preview_state.get("county_supply_delivered",0))-bench_supply_arrived),
            str(float(preview_state.get("county_supply_units",0.0))-bench_supply_units),
            str(int(preview_state.get("county_route_replans",0))-bench_county_replans),
            str(world_trade_nav.fine_navigation.searches),
            str(world_trade_nav.fine_navigation.cached_edges),
            str(world_trade_nav.fine_navigation.rejected_edges),
            str(int(atlas_loaded)),
            str(shared_landscape.segments.size() if shared_landscape != null else 0),
            str(shared_landscape.bridge_sites.size() if shared_landscape != null else 0),
            "%.3f" % atlas_render_ms,
            str(int(preview_state.get("individual_battle",{}).get("terrain_routes",0))),
            str(int(preview_state.get("individual_battle",{}).get("terrain_blocked",0))),
            str(int(preview_state.get("individual_battle",{}).get("formation_changes",0))),
            str(int(preview_state.get("individual_battle",{}).get("archer_repositions",0))),
            str(int(preview_state.get("individual_battle",{}).get("cavalry_flanks",0))),
            str(int(preview_state.get("individual_battle",{}).get("friendly_lanes_blocked",0))),
            str(int(preview_state.get("individual_battle",{}).get("morale_routs",0))),
            str(int(preview_state.get("individual_battle",{}).get("ordered_retreats",0))),
            str(int(preview_state.get("individual_battle",{}).get("escape_routes",0))),
            str(int(preview_state.get("individual_battle",{}).get("escape_failed_routes",0))),
            str(int(preview_state.get("individual_battle",{}).get("flank_shocks",0))),
            str(int(preview_state.get("campaign_retreats",0))),
            str(int(preview_state.get("campaign_retreats_trapped",0)))
        ])
        file.store_line(",".join(values))
        file.close()
    status_label.text="TULEMUS: "+bench_results+" | CSV salvestatud Godoti user:// kausta."

func _average_formation_strength(battle: Dictionary) -> float:
    var amount: float = 0.0
    var count: int = 0
    for group in battle.get("squads",[]):
        if bool(group.get("reserve",false)) or bool(group.get("retreated",false)):
            continue
        amount += float(group.get("formation_strength",0.0))
        count += 1
    return amount/float(maxi(1,count))

func _update_labels() -> void:
    var active_individual: Dictionary = preview_state.get("individual_battle",{})
    if ui_label==null:
        return
    var avg_ms: float=0.0
    for frame in frame_samples:
        avg_ms+=frame
    avg_ms=avg_ms/float(maxi(1,frame_samples.size()))
    ui_label.text="%.0f FPS | %.1f ms" %[1000.0/maxf(.001,avg_ms),avg_ms]
    info_label.text="V131 Godot 3.3 | %d ruutu | %d linna | %d maakonnaruutu | %d tegelast | %s: %d / cache %d | GLB %d/5 | test %s" %[COLS*ROWS,cities.size(),county_tile_count,actors.size(),"Godot A*" if use_native_astar else "V131 BFS",routes_calculated,routes_reused,native_renderer.loaded_count if is_instance_valid(native_renderer) else 0,rules_check_result]
    if city_label != null and not preview_state.is_empty() and city_index < preview_state["cities"].size():
        var people: int = 0
        var shoppers: int = 0
        for city in preview_state["cities"]:
            people += city.get("citizens",{}).size()
            for citizen in city.get("citizens",{}).values():
                if String(citizen.get("kind","")) == "market_woman":
                    shoppers += 1
        city_label.text = "Agente %d (turukäijaid %d) | ostud %d / koju %d | materjalivedu %.0f | " % [people,shoppers,int(preview_state.get("market_purchases",0)),int(preview_state.get("market_deliveries",0)),float(preview_state.get("citizens_hauled",0.0))] + PreviewSim.preview_summary(preview_state,city_index) + " | KARAVANID %d / kohale %d / teel %d" % [int(preview_state.get("trade_dispatched",0)),int(preview_state.get("trade_arrived",0)),preview_state.get("shipments",[]).size()] + " | ARMEED %d / üksused %d / marssisamme %d / lahingud %d" % [preview_state.get("armies",[]).size(),preview_state.get("military_units",[]).size(),int(preview_state.get("army_steps",0)),int(preview_state.get("battles_finished",0))] + (" | Tänavateed %d / cache %d / tõrkeid %d" % [local_streets.requests,local_streets.hits,local_streets.failures] if local_streets != null else "")
        city_label.text += " | MAAKONNA VEOD: %d kohale / %.0f kaupa / %d teel | SISEND %d/%d" % [int(preview_state.get("county_cargo_delivered",0)),float(preview_state.get("county_units_delivered",0.0)),preview_state.get("county_shipments",[]).size(),int(preview_state.get("county_supply_delivered",0)),int(preview_state.get("county_supply_sent",0))]
        if not active_individual.is_empty():
            city_label.text += " | LAHING %d/%d meest | %.1fs | nooli %d | lööke %d | reserv %d | maastikuteid %d / takistusi %d" % [battle_view.last_count if is_instance_valid(battle_view) else 0,int(active_individual.get("initial_men",0)),float(active_individual.get("elapsed",0.0)),int(active_individual.get("shots",0)),int(active_individual.get("melee_hits",0)),int(active_individual.get("reserve_men",0)),int(active_individual.get("terrain_routes",0)),int(active_individual.get("terrain_blocked",0))]
            city_label.text += " | formeeringud %d | kaitserivi %.0f%%" % [int(active_individual.get("formation_changes",0)),_average_formation_strength(active_individual)*100.0]

func _run_rule_checks() -> void:
    var result: Dictionary = PortChecks.run()
    rules_check_result = "%d/%d" % [int(result["passed"]),int(result["count"])]
    if not result["failed"].is_empty():
        push_warning("Port regressioonivead: " + str(result["failed"]))
        status_label.text = "REEGLITEST EBAÕNNESTUS: " + str(result["failed"])
    else:
        status_label.text = "REEGLITEST KORRAS: %s. BFS, teed, maakonnad, majandus, tehnoloogiad." % rules_check_result
    _update_labels()

func _select_next_city() -> void:
    if cities.is_empty():
        return
    city_index = (city_index + 1) % cities.size()
    _show_city_view()
    _update_labels()

func _start_city_stress(target_count: int,people: int) -> void:
    if preview_state.is_empty() or city_index < 0 or city_index >= preview_state["cities"].size():
        return
    if not county_demo_backup.is_empty():
        status_label.text = "Maakonnakatse lõpetamiseks vali Taasta maakonnakatse."
        return
    if city_stress_index != -1:
        _stop_city_stress()
    city_stress_index = city_index
    city_stress_backup = preview_state["cities"][city_index].duplicate(true)
    var city: Dictionary = preview_state["cities"][city_index]
    var status: Dictionary = CityStress.populate(city,target_count,people,local_streets if street_nav_on else null)
    if not bool(status.get("ok",false)):
        _stop_city_stress()
        status_label.text = "Linnakatse ei käivitunud: " + str(status.get("reason",""))
        return
    preview_state["revision"] = int(preview_state.get("revision",0))+1
    _refresh_building_proxies()
    _show_city_view()
    status_label.text = "SÜNTEETILINE KOORMUS: %d hoonet / %d jalutajat. Taasta linn enne salvestamist!" % [int(status["buildings"]),int(status["crowd"])]
    _update_labels()

func _stop_city_stress() -> void:
    if city_stress_index < 0:
        status_label.text = "Linnakatse pole käimas"
        return
    var restore_index: int = city_stress_index
    preview_state["cities"][restore_index] = city_stress_backup.duplicate(true)
    city_stress_index = -1
    city_stress_backup = {}
    city_stress_crowd_arrivals = 0
    if local_streets != null:
        local_streets.clear()
    preview_state["revision"] = int(preview_state.get("revision",0))+1
    _refresh_building_proxies()
    if mobile_view == "detail" and is_instance_valid(native_detail_tile):
        native_detail_tile.show_tile(detail_tile_coords,preview_state["cities"],heights,local_streets if street_nav_on else null,preview_state.get("detail_bridges",{}),shared_landscape)
    status_label.text = "Koormuskatse lõpetatud. Linn taastatud täpselt katseeelsesse seisu."
    _update_labels()

func _show_height9_info() -> void:
    if shared_landscape == null:
        status_label.text = "9x9 kõrguskaart ei ole laetud."
        return
    var tile: Vector2i = detail_tile_coords if mobile_view == "detail" else selected
    var values: PackedFloat32Array = shared_landscape.detail_samples(tile)
    var low: float = INF
    var high: float = -INF
    for h in values:
        low = minf(low,h)
        high = maxf(high,h)
    var center: float = shared_landscape.detail_height(tile,Vector2.ZERO)
    var passable: bool = shared_landscape.walkable_at(tile,Vector2.ZERO)
    status_label.text = "DETAIL 9x9 | ruut %d,%d | min %.2fm max %.2fm kesk %.2fm | keskel %s" % [tile.x,tile.y,low,high,center,"läbitav" if passable else "takistus"]

func _preview_build(kind: String) -> void:
    if preview_state.is_empty():
        return
    var result: Dictionary = PreviewSim.build_in_town(preview_state,city_index,kind,shared_landscape)
    status_label.text = "EHITUS (lihtsustatud): " + str(result["reason"])
    _update_labels()

func _build_county_worksite(kind: String) -> void:
    if preview_state.is_empty():
        return
    if city_stress_index >= 0:
        status_label.text = "Maakonna ehitamiseks lõpeta esmalt sünteetiline linnakatse"
        return
    Territory.rebuild(preview_state,land)
    var result: Dictionary = Territory.build_worksite(preview_state,city_index,kind,land,heights)
    status_label.text = String(result.get("reason","Maakonna ehitus ei õnnestunud"))
    if bool(result.get("ok",false)) and mobile_view == "detail":
        var site: Dictionary = result["site"]
        _open_detail_tile(Vector2i(int(site["c"]),int(site["r"])))
    _update_labels()

func _toggle_city_gate() -> void:
    if preview_state.is_empty() or city_index < 0 or city_index >= preview_state.get("cities",[]).size():
        return
    if not preview_state.get("individual_battle",{}).is_empty():
        status_label.text = "Käimasoleva lahingu ajal ei saa linnamenüüst väravat muuta"
        return
    var city: Dictionary = preview_state["cities"][city_index]
    var cell := Vector2i(int(city.get("c",0)),int(city.get("r",0)))
    var currently_open: bool = CityFortifications.gate_is_open(city,cell)
    if not CityFortifications.set_gate(city,cell,not currently_open):
        status_label.text = "Selle linna südames ei ole ehitatud puitvalli"
        return
    preview_state["revision"] = int(preview_state.get("revision",0))+1
    if mobile_view == "detail":
        native_detail_tile.show_tile(detail_tile_coords,preview_state.get("cities",[]),heights,local_streets if street_nav_on else null,preview_state.get("detail_bridges",{}),shared_landscape)
    status_label.text = "Linnavärav AVATUD" if not currently_open else "Linnavärav SULETUD"
    _update_labels()

func _build_city_wall() -> void:
    if preview_state.is_empty() or city_index < 0 or city_index >= preview_state.get("cities",[]).size():
        return
    if city_stress_index >= 0:
        status_label.text = "Puitvalli ehitamiseks lõpeta esmalt sünteetiline linnakatse"
        return
    var city: Dictionary = preview_state["cities"][city_index]
    var result: Dictionary = CityFortifications.build_next(city)
    status_label.text = String(result.get("reason","Valli ehitus ei õnnestunud"))
    if bool(result.get("ok",false)):
        preview_state["revision"] = int(preview_state.get("revision",0))+1
        if mobile_view == "detail":
            native_detail_tile.show_tile(detail_tile_coords,preview_state.get("cities",[]),heights,local_streets if street_nav_on else null,preview_state.get("detail_bridges",{}),shared_landscape)
    _update_labels()

func _show_territory_info() -> void:
    if city_index < 0 or city_index >= preview_state.get("cities",[]).size():
        return
    Territory.rebuild(preview_state,land)
    var city: Dictionary = preview_state["cities"][city_index]
    status_label.text = "%s: %d elanikku, linn %dx%d (%d ruutu), maakond %d ruutu, tootmiskohad %d" % [String(city["name"]),int(city["pop"]),int(city.get("territory_side",Territory.urban_side(int(city.get("pop",3))))),int(city.get("territory_side",Territory.urban_side(int(city.get("pop",3))))),city.get("territory_urban",[]).size(),city.get("territory_county",[]).size(),city.get("county_worksites",[]).size()]
    _update_labels()

func _start_wall_demo() -> void:
    if preview_state.is_empty() or city_index < 0 or city_index >= preview_state.get("cities",[]).size():
        return
    if city_stress_index >= 0 or territory_demo_index >= 0 or not county_demo_backup.is_empty():
        status_label.text = "Lõpeta eelmine linnakatse enne vallide proovi"
        return
    if not wall_demo_backup.is_empty():
        _stop_wall_demo()
    wall_demo_backup = preview_state.duplicate(true)
    wall_demo_was_paused = paused
    paused = true
    var city: Dictionary = preview_state["cities"][city_index]
    city["pop"] = maxi(18,int(city.get("pop",3)))
    city["age"] = maxi(1,int(city.get("age",0)))
    city["resources"]["wood"] = maxf(100.0,float(city["resources"].get("wood",0.0)))
    city["resources"]["stone"] = maxf(40.0,float(city["resources"].get("stone",0.0)))
    Territory.rebuild(preview_state,land,true)
    CityLayout.ensure_positions(city)
    var result: Dictionary = CityFortifications.build_next(city)
    preview_state["revision"] = int(preview_state.get("revision",0))+1
    _build_counties()
    _refresh_building_proxies()
    _open_detail_tile(Vector2i(int(city["c"]),int(city["r"])))
    status_label.text = "AJUTINE PRONKSLINN: %s. Vallid ei kahjustu veel lahingus. Vali Taasta vallide demo." % str(result.get("reason","Katse ei õnnestunud"))
    _update_labels()

func _stop_wall_demo() -> void:
    if wall_demo_backup.is_empty():
        status_label.text = "Vallide demo pole käivitatud"
        return
    preview_state = wall_demo_backup
    wall_demo_backup = {}
    paused = wall_demo_was_paused
    Territory.rebuild(preview_state,land,true)
    Territory.reconcile_worksites(preview_state,land,heights)
    _configure_fine_navigation()
    _build_counties()
    _refresh_building_proxies()
    if mobile_view == "detail":
        native_detail_tile.show_tile(detail_tile_coords,preview_state.get("cities",[]),heights,local_streets if street_nav_on else null,preview_state.get("detail_bridges",{}),shared_landscape)
    status_label.text = "Vallide demoseis taastatud; algne linn ja ressursid säilivad"
    _update_labels()

func _start_territory_demo() -> void:
    if not county_demo_backup.is_empty():
        status_label.text = "Lõpeta esmalt maakonnakatse."
        return
    if territory_demo_index >= 0:
        _stop_territory_demo()
    if city_stress_index >= 0:
        status_label.text = "Lõpeta esmalt 160 hoone linnakatse"
        return
    territory_demo_index = city_index
    territory_demo_pop = int(preview_state["cities"][city_index].get("pop",3))
    territory_demo_was_paused = paused
    paused = true
    preview_state["cities"][city_index]["pop"] = 36
    Territory.rebuild(preview_state,land,true)
    Territory.reconcile_worksites(preview_state,land,heights)
    _build_counties()
    status_label.text = "PIIRIDE DEMO: 36 elanikku, kuni 12×12 linnapiirkond. Majandus peatatud. Taasta piirid!"
    _update_labels()

func _stop_territory_demo() -> void:
    if territory_demo_index < 0:
        status_label.text = "Piiride demo pole käivitatud"
        return
    preview_state["cities"][territory_demo_index]["pop"] = territory_demo_pop
    territory_demo_index = -1
    paused = territory_demo_was_paused
    Territory.rebuild(preview_state,land,true)
    Territory.reconcile_worksites(preview_state,land,heights)
    _build_counties()
    status_label.text = "Piiride demo taastatud; esialgne rahvaarv tagasi."
    _update_labels()

func _start_county_demo(input_demo: bool = false) -> void:
    if preview_state.is_empty():
        return
    if not county_demo_backup.is_empty():
        _stop_county_demo()
    bridge_test_tile = Vector2i(-1,-1)
    if city_stress_index >= 0 or territory_demo_index >= 0:
        status_label.text = "Lõpeta esmalt muu katse."
        return
    Territory.rebuild(preview_state,land)
    var town: Dictionary = preview_state["cities"][city_index]
    var target: Dictionary = {}
    for kind in (["mine"] if input_demo else ["lumber","farm","quarry"]):
        for cell in town.get("territory_county",[]):
            var c: int = int(cell[0])
            var r: int = int(cell[1])
            var distance: int = maxi(absi(c-int(town["c"])),absi(r-int(town["r"])))
            if distance >= 2 and (Territory.deposit_kind(kind,c,r,land,heights) or input_demo):
                target = {"type":kind,"c":c,"r":r,"distance":distance,"ready":true,"hp":350.0,"timer":0.0,"pending":0.0,"progress":0.0}
                break
        if not target.is_empty():
            break
    if target.is_empty():
        status_label.text = "Sobivat kauget maakonnaruutu ei leitud; proovi järgmist linna."
        return
    county_demo_backup = preview_state.duplicate(true)
    county_demo_was_paused = paused
    town["pop"] = maxi(18,int(town.get("pop",3)))
    # The demo creates temporary housing only, not legitimately built homes.
    for i in range(6):
        town["buildings"].append({"type":"house","ready":true,"hp":350.0})
    town["county_worksites"].append(target)
    CityLayout.ensure_positions(town)
    town["resources"]["water"] = maxf(75.0,float(town["resources"].get("water",0.0)))
    if input_demo:
        town["resources"]["bread"] = maxf(110.0,float(town["resources"].get("bread",0.0)))
    town["resources"]["bread"] = maxf(90.0,float(town["resources"].get("bread",0.0)))
    preview_state["revision"] = int(preview_state.get("revision",0))+1
    Territory.rebuild(preview_state,land,true)
    _configure_fine_navigation()
    _build_counties()
    paused = false
    _open_detail_tile(Vector2i(int(target["c"]),int(target["r"])))
    status_label.text = "SISENDVEDU: leib veetakse kaevandusse ja maak tuuakse linna." if input_demo else "MAAKONNA DEMO: töötaja liigub linnast kohale; tootmine pakitakse ja veetakse tagasi. +10 min või 20s test."

func _start_atlas_river_demo() -> void:
    if shared_landscape == null:
        return
    var p: Vector2i = shared_landscape.first_river_tile()
    if p.x<0:
        status_label.text = "Jõe näidisruutu ei leitud."
        return
    atlas_river_demo_tile = p
    _open_detail_tile(p)
    status_label.text = "ÜHINE ATLAS: maailmakaardiga samast andmest jõesäng. Atlase sild: ava / sulge."

func _toggle_atlas_bridge() -> void:
    if shared_landscape == null or atlas_river_demo_tile.x<0:
        status_label.text = "Vali enne Ühise atlase jõgi."
        return
    var tile: Vector2i = atlas_river_demo_tile
    var key: String = "%d:%d" % [tile.x,tile.y]
    var site: Dictionary = shared_landscape.bridge_sites.get(key,{})
    var point: Vector2 = shared_landscape.suggested_bridge(tile)
    var opening: bool = not bool(site.get("open",false))
    shared_landscape.set_bridge(tile,point,opening)
    var saved: Dictionary = preview_state.get("atlas_bridges",{})
    saved[key] = shared_landscape.bridge_sites[key].duplicate(true)
    preview_state["atlas_bridges"] = saved
    _refresh_atlas_route_graph()
    _configure_fine_navigation()
    _open_detail_tile(tile)
    status_label.text = "ATLAS: sild AVATUD" if bool(shared_landscape.bridge_sites[key]["open"]) else "ATLAS: sild SULETUD"


func _refresh_atlas_route_graph() -> void:
    if not atlas_loaded or shared_landscape == null:
        return
    for r in range(ROWS):
        for c in range(COLS):
            var idx: int = r*COLS+c
            if int(baked_atlas["downstream"][idx]) < 0:
                continue
            var tile := Vector2i(c,r)
            var site: Dictionary = shared_landscape.bridge_sites.get("%d:%d" % [c,r],{})
            var pass_river: bool = int(baked_atlas["fords"][idx]) == 1 or bool(site.get("open",false))
            walkable[idx] = 1 if V131Atlas.world_passable(heights[idx],int(baked_atlas["downstream"][idx]),int(baked_atlas["fords"][idx]),pass_river) else 0
    if world_trade_nav != null:
        world_trade_nav.configure(walkable)
    if native_path != null:
        native_path.configure(walkable)
    _build_roads()
    _render_world_bridges()

func _build_road_bridge() -> void:
    if shared_landscape == null or preview_state.is_empty():
        return
    var tile: Vector2i = selected
    if detail_tile_coords.x >= 0 and detail_focus:
        tile = detail_tile_coords
    if not atlas_loaded or tile.x<0 or tile.y<0 or tile.x>=COLS or tile.y>=ROWS:
        status_label.text = "V131 atlase jõeruut pole valitud."
        return
    var river_idx: int = tile.y*COLS+tile.x
    if int(baked_atlas["downstream"][river_idx]) < 0:
        status_label.text = "Sild vajab jõe lähteruutu; vali jõelõigu algus."
        return
    if int(baked_atlas["fords"][river_idx]) == 1:
        status_label.text = "Siin on juba looduslik koolmekoht."
        return
    # There must be a developed approach road near the crossing; this does
    # not create a free bridge just because a river happens to be visible.
    var joined: bool = false
    for key in roads.keys():
        if RoadsPort.road_level(RoadsPort.strength_for_key(roads,String(key),road_time)) == 0:
            continue
        var ids: PackedStringArray = String(key).split(":")
        if ids.size() != 2:
            continue
        for value in ids:
            var id: int = int(value)
            var c: int = id%COLS
            var r: int = int(id/COLS)
            if absi(c-tile.x)+absi(r-tile.y) <= 2:
                joined = true
                break
        if joined:
            break
    if not joined:
        status_label.text = "Silla jaoks peab läheduses olema kasutatud maantee (tee tase vähemalt 1)."
        return
    var city: Dictionary = {}
    var best: int = 99999
    for candidate in preview_state.get("cities",[]):
        if int(candidate.get("team",-1)) != 0:
            continue
        var length: int = absi(int(candidate["c"])-tile.x)+absi(int(candidate["r"])-tile.y)
        if length < best:
            best = length
            city = candidate
    if city.is_empty() or best>24:
        status_label.text = "Silla ehitamiseks peab oma linn olema kuni 24 ruudu kaugusel."
        return
    var stock: Dictionary = city.get("resources",{})
    if float(stock.get("wood",0.0))<30.0 or float(stock.get("stone",0.0))<10.0:
        status_label.text = "Sild vajab 30 puitu ja 10 kivi."
        return
    var code: String = "%d:%d" % [tile.x,tile.y]
    if bool(shared_landscape.bridge_sites.get(code,{}).get("open",false)):
        status_label.text = "Sild on siin juba avatud."
        return
    var crossing: Vector2 = shared_landscape.suggested_bridge(tile)
    stock["wood"] = float(stock["wood"])-30.0
    stock["stone"] = float(stock["stone"])-10.0
    shared_landscape.set_bridge(tile,crossing,true)
    var saved: Dictionary = preview_state.get("atlas_bridges",{})
    saved[code] = shared_landscape.bridge_sites[code].duplicate(true)
    preview_state["atlas_bridges"] = saved
    _refresh_atlas_route_graph()
    _configure_fine_navigation()
    if detail_focus:
        _open_detail_tile(tile)
    status_label.text = "Maanteesild valmis: 30 puitu ja 10 kivi. Kaubateede otsing uuenes."

func _start_bridge_demo() -> void:
    # The toy river is labelled as a test obstacle; no claim that V131 river
    # geography has been reconstructed from the original atlas.
    _start_county_demo(true)
    if county_demo_backup.is_empty():
        return
    var town: Dictionary = preview_state["cities"][city_index]
    var site: Dictionary = town["county_worksites"].back()
    var path: Array = world_trade_nav.route({"c":int(town["c"]),"r":int(town["r"])},{"c":int(site["c"]),"r":int(site["r"])})
    if path.is_empty():
        status_label.text = "Sillakatseks ei leitud maismaateed."
        return
    var index: int = int(path.size()/2)
    var selected_cell: Array = path[index]
    bridge_test_tile = Vector2i(int(selected_cell[0]),int(selected_cell[1]))
    var previous: Array = [int(town["c"]),int(town["r"])] if index == 0 else path[index-1]
    var step: Vector2i = bridge_test_tile-Vector2i(int(previous[0]),int(previous[1]))
    var crossing: Dictionary = {"axis":"x" if step.x != 0 else "z","coord":0.0,"width":5.0,"bridge":true,"bridge_at":0.0,"bridge_width":6.0}
    preview_state["detail_bridges"] = {"%d:%d" % [bridge_test_tile.x,bridge_test_tile.y]:crossing}
    preview_state["revision"] = int(preview_state.get("revision",0))+1
    _configure_fine_navigation()
    _open_detail_tile(bridge_test_tile)
    status_label.text = "SILLA DEMO: sinine katsejõgi, sild on AVATUD. Vajuta Sillakatse: ava / sulge."

func _toggle_bridge_demo() -> void:
    if bridge_test_tile.x < 0 or county_demo_backup.is_empty():
        status_label.text = "Käivita esmalt Sillakatse: jõgi ja sild."
        return
    var key: String = "%d:%d" % [bridge_test_tile.x,bridge_test_tile.y]
    var bridges: Dictionary = preview_state.get("detail_bridges",{})
    var crossing: Dictionary = bridges.get(key,{})
    crossing["bridge"] = not bool(crossing.get("bridge",false))
    bridges[key] = crossing
    preview_state["detail_bridges"] = bridges
    preview_state["revision"] = int(preview_state.get("revision",0))+1
    _configure_fine_navigation()
    _open_detail_tile(bridge_test_tile)
    status_label.text = "Sild AVATUD – maakonnatransport võib läbida." if bool(crossing["bridge"]) else "Sild SULETUD – vesi blokeerib otsetee."

func _stop_county_demo() -> void:
    if county_demo_backup.is_empty():
        status_label.text = "Maakonnakatset pole käivitatud."
        return
    preview_state = county_demo_backup
    county_demo_backup = {}
    bridge_test_tile = Vector2i(-1,-1)
    _configure_fine_navigation()
    paused = county_demo_was_paused
    road_time = float(preview_state.get("seconds",0.0))
    roads = preview_state.get("world_roads",{})
    Territory.rebuild(preview_state,land,true)
    _build_counties()
    _build_roads()
    _refresh_building_proxies()
    if mobile_view == "detail":
        native_detail_tile.show_tile(detail_tile_coords,preview_state["cities"],heights,local_streets if street_nav_on else null,preview_state.get("detail_bridges",{}),shared_landscape)
    status_label.text = "Maakonnakatse taastatud (katsekaubad ja hooned eemaldatud)."
    _update_labels()

func _setup_market_demo() -> void:
    # Explicit fixture for observing V131 household mechanics immediately.
    # Does not pretend these buildings were legitimately researched or built.
    if preview_state.is_empty() or city_index >= preview_state["cities"].size():
        return
    var city: Dictionary = preview_state["cities"][city_index]
    var house_found: bool = false
    var market_found: bool = false
    for b in city["buildings"]:
        if String(b.get("type","")) == "house" and bool(b.get("ready",false)):
            house_found = true
        if String(b.get("type","")) == "market" and bool(b.get("ready",false)):
            market_found = true
            b["assigned"] = 1.0
    if not house_found:
        city["buildings"].append({"type":"house","ready":true,"hp":350.0,"assigned":0.0,"efficiency":0.0})
    if not market_found:
        city["buildings"].append({"type":"market","ready":true,"hp":350.0,"assigned":1.0,"efficiency":0.5})
    city["pop"] = maxi(6,int(city.get("pop",3)))
    var stock: Dictionary = city["resources"]
    stock["bread"] = maxf(35.0,float(stock.get("bread",0.0)))
    stock["water"] = maxf(25.0,float(stock.get("water",0.0)))
    preview_state["revision"] = int(preview_state.get("revision",0)) + 1
    _refresh_building_proxies()
    if is_instance_valid(local_streets):
        local_streets.clear()
    status_label.text = "TURU DEMO: valmis maja ja turg lisatud KATSESEISU (reegleid ei avatud). Käivita +10 min ja vaata roosasid elanikke."
    _update_labels()

func _preview_research() -> void:
    if preview_state.is_empty():
        return
    var team: int = int(preview_state["cities"][city_index]["team"])
    var result: Dictionary = PreviewSim.research_next(preview_state,team)
    status_label.text = "UURIMINE: " + str(result["reason"])
    _update_labels()

func _preview_save() -> void:
    if not wall_demo_backup.is_empty():
        status_label.text = "Vallide demo on ajutine. Taasta demo enne salvestamist."
        return
    if not county_demo_backup.is_empty():
        status_label.text = "Maakonnakatse on ajutine. Taasta demo enne salvestamist."
        return
    if territory_demo_index >= 0:
        status_label.text = "Piiride demo ajal salvestamine keelatud. Taasta piirid."
        return
    if city_stress_index >= 0:
        status_label.text = "Sünteetilist linnakatset ei salvestata. Vajuta Taasta linn."
        return
    status_label.text = "KATSESEIS SALVESTATUD: user://v131_godot_preview_v25.json" if PreviewSim.save_preview(preview_state) else "Salvestamine ei õnnestunud"

func _preview_load() -> void:
    if not wall_demo_backup.is_empty():
        _stop_wall_demo()
    if not county_demo_backup.is_empty():
        _stop_county_demo()
    bridge_test_tile = Vector2i(-1,-1)
    if territory_demo_index >= 0:
        _stop_territory_demo()
    if city_stress_index >= 0:
        _stop_city_stress()
    var data: Dictionary = PreviewSim.load_preview(cities)
    if data.is_empty():
        status_label.text = "Ühilduvat katseolekut ei leitud"
        return
    preview_state = data
    # A saved bridge is part of the terrain graph, not merely the 3D scene.
    # Rebuild both caches BEFORE advancing merchants or county haulers.
    _setup_shared_landscape()
    if world_trade_nav != null:
        world_trade_nav.configure(walkable)
    _configure_fine_navigation()
    Territory.rebuild(preview_state,land,true)
    Territory.reconcile_worksites(preview_state,land,heights)
    _build_counties()
    roads = preview_state.get("world_roads",{})
    road_time = float(preview_state.get("seconds",0.0))
    _build_roads()
    if is_instance_valid(cargo_view):
        cargo_view.refresh(preview_state["cities"],heights)
    if is_instance_valid(trade_view):
        trade_view.refresh(preview_state,heights)
    if is_instance_valid(army_view):
        army_view.refresh(preview_state,heights)
    if is_instance_valid(battle_view):
        battle_view.refresh(preview_state)
    if is_instance_valid(citizen_view):
        citizen_view.refresh(preview_state["cities"],heights)
    if is_instance_valid(local_streets):
        local_streets.clear()
    if is_instance_valid(street_view):
        street_view.refresh(preview_state["cities"],heights,city_index)
    if mobile_view == "detail":
        native_detail_tile.show_tile(detail_tile_coords,preview_state.get("cities",[]),heights,local_streets if street_nav_on else null,preview_state.get("detail_bridges",{}),shared_landscape)
        detail_last_revision = int(preview_state.get("revision",0))
    ai_enabled = bool(data.get("ai_enabled",false))
    _refresh_building_proxies()
    status_label.text = "KATSESEIS LAETUD (mitte V131 V4)"
    _update_labels()

func _toggle_preview_ai() -> void:
    ai_enabled = not ai_enabled
    preview_state["ai_enabled"] = ai_enabled
    status_label.text = "Katse-AI: töötab riikidele 1–3 (ei ole veel V131 strateegiline AI)." if ai_enabled else "Katse-AI välja lülitatud."
    _update_labels()

func _fast_forward_preview() -> void:
    if not wall_demo_backup.is_empty():
        status_label.text = "Taasta vallide demo enne aja edasikerimist"
        return
    if territory_demo_index >= 0:
        status_label.text = "Taasta piiride demo enne aja edasikerimist"
        return
    if preview_state.is_empty():
        return
    # Simulate 600 game seconds in bounded steps; 3D actors remain at current
    # positions, since this intentionally tests the city economy in isolation.
    for _step in range(40):
        PreviewSim.tick(preview_state,15.0,local_streets if street_nav_on else null,world_trade_nav,shared_landscape)
    road_time = float(preview_state.get("seconds",road_time))
    if Territory.rebuild(preview_state,land):
        Territory.reconcile_worksites(preview_state,land,heights)
        _build_counties()
    _build_roads()
    if int(preview_state.get("revision",0)) != last_building_revision:
        _refresh_building_proxies()
    if is_instance_valid(cargo_view):
        cargo_view.refresh(preview_state["cities"],heights)
    if is_instance_valid(trade_view):
        trade_view.refresh(preview_state,heights)
    if is_instance_valid(army_view):
        army_view.refresh(preview_state,heights)
    if is_instance_valid(battle_view):
        battle_view.refresh(preview_state)
    if is_instance_valid(citizen_view):
        citizen_view.refresh(preview_state["cities"],heights)
    if is_instance_valid(street_view):
        street_view.refresh(preview_state["cities"],heights,city_index)
    var total_pop: int = 0
    for town in preview_state["cities"]:
        total_pop += int(town.get("pop",0))
    status_label.text = "+10 min: elanikke %d | AI ehitusi %d | toodangutsükleid %d | kaubaveoseid %d | turult koju %d (toit %.1f, vesi %.1f). Täielik V131 veel puudu." % [total_pop,int(preview_state.get("ai_build_orders",0)),int(preview_state.get("produced_cycles",0)),_cargo_count(),int(preview_state.get("market_deliveries",0)),float(preview_state.get("market_food_delivered",0.0)),float(preview_state.get("market_water_delivered",0.0))]
    _update_labels()

func _cargo_count() -> int:
    var count: int = 0
    for city in preview_state.get("cities",[]):
        count += city.get("cargo",[]).size()
    return count

func _toggle_pause() -> void:
    paused=not paused
    status_label.text="Simulatsioon peatatud." if paused else "Simulatsioon käib."

func _zoom(factor: float) -> void:
    zoom=clampf(zoom*factor,26.0,230.0) if mobile_view == "detail" else clampf(zoom*factor,12.0,280.0)
    _update_camera()

func _screen_point_on_ground(pixel: Vector2) -> Vector3:
    # Unproject through the current tilted orthographic camera. Do not assume
    # that horizontal touch pixels map directly to world tile coordinates.
    var ray_origin: Vector3 = camera.project_ray_origin(pixel)
    var ray_dir: Vector3 = camera.project_ray_normal(pixel)
    if absf(ray_dir.y)<.00001:
        return Vector3(1.0e10,0,1.0e10)
    var plane_y: float = 0.0
    var hit_t: float = 0.0
    for i in range(3):
        hit_t = (plane_y-ray_origin.y)/ray_dir.y
        if hit_t < 0.0:
            return Vector3(1.0e10,0,1.0e10)
        if mobile_view == "world":
            var probe: Vector3 = ray_origin+ray_dir*hit_t
            plane_y = _ground(floori(probe.x),floori(probe.z))*.52
        else:
            break
    hit_t = (plane_y-ray_origin.y)/ray_dir.y
    return ray_origin+ray_dir*hit_t if hit_t >= 0.0 else Vector3(1.0e10,0,1.0e10)

func _world_tap(pixel: Vector2) -> void:
    var hit: Vector3 = _screen_point_on_ground(pixel)
    var cell: Vector2i = DetailTile.world_cell_at(hit)
    if not DetailTile.tile_valid(cell):
        return
    selected = cell
    _update_world_selection_marker()
    var core_index: int = DetailTile.city_index_at(preview_state.get("cities",[]),cell)
    var next_index: int = core_index if core_index >= 0 else Territory.owner_at(preview_state,cell.x,cell.y)
    if next_index >= 0:
        city_index = next_index
    var kind: String = "linn" if core_index >= 0 else ("oma maakond" if next_index >= 0 else "maastik")
    status_label.text = "VALITUD RUUT %d,%d • %s • AVA RUUT või topeltpuudutus" % [cell.x,cell.y,kind]
    var now: int = Time.get_ticks_msec()
    if now-last_world_tap_time < 420 and pixel.distance_to(last_world_tap_pos)<32.0:
        last_world_tap_time = -1000
        _open_detail_tile(cell)
    else:
        last_world_tap_time = now
        last_world_tap_pos = pixel

func _detail_tap(pixel: Vector2) -> void:
    var point: Vector3 = _screen_point_on_ground(pixel)
    status_label.text = "DETAIL: " + native_detail_tile.describe_point(point)

func _handle_tap(pixel: Vector2) -> void:
    if mobile_view == "world":
        _world_tap(pixel)
    elif mobile_view == "detail":
        _detail_tap(pixel)

func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("ui_cancel"):
        if mobile_menu_open:
            _close_mobile_menu()
            get_viewport().set_input_as_handled()
            return
        if mobile_view == "detail":
            _show_world_map()
            get_viewport().set_input_as_handled()
            return
    if event is InputEventMouseButton:
        if event.button_index == MOUSE_BUTTON_WHEEL_UP and event.pressed:
            _zoom(.85)
        elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN and event.pressed:
            _zoom(1.15)
        elif event.button_index == MOUSE_BUTTON_LEFT:
            if event.pressed:
                pointer_down = event.position
                pointer_dragged = false
            elif not pointer_dragged and pointer_down.distance_to(event.position)<18.0:
                _handle_tap(event.position)
    elif event is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
        if pointer_down.distance_to(event.position)>13.0:
            pointer_dragged = true
        _pan(event.relative)
    elif event is InputEventScreenTouch:
        if event.pressed:
            if drag_positions.size() > 0:
                touch_dragged = true
            elif drag_positions.is_empty():
                touch_dragged = false
            drag_positions[event.index] = event.position
        else:
            if not touch_dragged and drag_positions.size() == 1 and event.position.distance_to(drag_positions.get(event.index,event.position))<18.0:
                _handle_tap(event.position)
            drag_positions.erase(event.index)
    elif event is InputEventScreenDrag:
        var old: Vector2 = drag_positions.get(event.index,event.position)
        drag_positions[event.index] = event.position
        if old.distance_to(event.position)>4.0:
            touch_dragged = true
        if drag_positions.size() == 1:
            _pan(event.relative)
        elif drag_positions.size() == 2:
            for k in drag_positions.keys():
                if k == event.index:
                    continue
                var other: Vector2 = drag_positions[k]
                var before: float = maxf(4.0,old.distance_to(other))
                var after: float = maxf(4.0,event.position.distance_to(other))
                _zoom(before/after)
                break

func _pan(relative: Vector2) -> void:
    var h: float = maxf(100.0,get_viewport().get_visible_rect().size.y)
    focus.x -= relative.x*zoom/h
    focus.y -= relative.y*zoom/h
    _update_camera()
