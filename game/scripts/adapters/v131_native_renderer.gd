extends Node3D
## Native renderer/asset bridge for the V131 partial port.
## Does NOT simulate AI or alter original game rules.
signal visuals_updated(city_models_ready: bool, actor_models_ready: bool)
signal loading_status(message: String)

const GLBLibrary = preload("res://scripts/adapters/v131_glb_library.gd")
const MeshAdapter = preload("res://scripts/adapters/v131_multimesh_adapter.gd")
var library
var city_source: Array = []
var land_cells: PackedByteArray = PackedByteArray()
var ground_heights: PackedFloat32Array = PackedFloat32Array()
var actor_source: Array = []
var city_instances: Array = []
var actor_instances: Dictionary = {}
var actor_lookup: Dictionary = {}
var prop_instances: Dictionary = {}
var original_enabled: bool = true
var status: String = "V131 mudelid: laadimata"
var loaded_count: int = 0
var error_count: int = 0

func begin(cities: Array, land: PackedByteArray, heights: PackedFloat32Array) -> void:
    city_source = cities.duplicate(true)
    land_cells = land
    ground_heights = heights
    library = GLBLibrary.new()
    add_child(library)
    library.model_ready.connect(_on_model_ready)
    library.model_failed.connect(_on_model_failed)
    library.progress_changed.connect(_on_progress)
    library.load_original_models()

func retry_download() -> void:
    if library == null:
        return
    library.load_original_models()

func _on_progress(s: String) -> void:
    status = s
    loading_status.emit(status)

func _on_model_failed(_model_id: String, message: String) -> void:
    error_count += 1
    status = "GLB allalaadimine ebaõnnestus: " + message
    loading_status.emit(status)

func _on_model_ready(model_id: String, source: Node3D) -> void:
    loaded_count += 1
    if model_id == "village":
        _rebuild_cities(source)
    elif model_id == "worker" or model_id == "warrior":
        _rebuild_actors()
    elif model_id == "forest" or model_id == "rock":
        _rebuild_props(model_id, source)
    _refresh_visibility()

func has_cities() -> bool:
    return not city_instances.is_empty()

func has_actors() -> bool:
    return actor_instances.has("worker") and actor_instances.has("warrior")

func configure_actors(data: Array) -> void:
    actor_source = data
    _rebuild_actors()

func set_original_enabled(enabled: bool) -> void:
    original_enabled = enabled
    _refresh_visibility()

func _rebuild_cities(source: Node3D) -> void:
    MeshAdapter.dispose(city_instances)
    city_instances = MeshAdapter.compile_batches(source, city_source.size(), self)
    var factor: float = 2.0 / MeshAdapter.visual_span(source)
    for i in range(city_source.size()):
        var city: Dictionary = city_source[i]
        var c: int = int(city["c"])
        var r: int = int(city["r"])
        var y: float = _height(c, r) + 0.12
        MeshAdapter.place(city_instances, i, Vector3(c+.5,y,r+.5),factor)

func _rebuild_actors() -> void:
    for arr in actor_instances.values():
        MeshAdapter.dispose(arr)
    actor_instances.clear()
    actor_lookup.clear()
    if actor_source.is_empty() or library == null:
        return
    if not library.has_model("worker") or not library.has_model("warrior"):
        return
    for kind in ["worker", "warrior"]:
        var members: Array[int] = []
        for i in range(actor_source.size()):
            var is_soldier: bool = bool(actor_source[i]["soldier"])
            if (kind == "warrior") == is_soldier:
                members.append(i)
        var model: Node3D = library.model_template(kind)
        var batches: Array = MeshAdapter.compile_batches(model, members.size(), self)
        var scale_factor: float = 0.80 / MeshAdapter.visual_span(model)
        actor_instances[kind] = batches
        for local_index in range(members.size()):
            var world_index: int = members[local_index]
            actor_lookup[world_index] = {"kind":kind,"local":local_index,"scale":scale_factor}
            var actor: Dictionary = actor_source[world_index]
            var pos: Vector2 = actor["position"]
            MeshAdapter.place(batches, local_index, _actor_position(pos), scale_factor)
    _refresh_visibility()

func sync_actor(index: int, position: Vector2, facing: float) -> void:
    if not actor_lookup.has(index):
        return
    var data: Dictionary = actor_lookup[index]
    var batches: Array = actor_instances.get(data["kind"], [])
    if batches.is_empty():
        return
    MeshAdapter.place(batches, int(data["local"]), _actor_position(position),float(data["scale"]),facing)

func _actor_position(p: Vector2) -> Vector3:
    return Vector3(p.x, _height(int(p.x),int(p.y)) + .12, p.y)

func _height(c: int, r: int) -> float:
    c = clampi(c, 0, 219)
    r = clampi(r, 0, 164)
    return ground_heights[r * 220 + c] * .52 if ground_heights.size() == 220 * 165 else 0.0

func _rebuild_props(model_id: String, source: Node3D) -> void:
    if prop_instances.has(model_id):
        MeshAdapter.dispose(prop_instances[model_id])
    var coords: Array[Vector2i] = []
    var limit: int = 225 if model_id == "forest" else 95
    # Deterministic scattering only for visual load; V131 original deposits differ.
    for i in range(limit * 36):
        if coords.size() >= limit:
            break
        var c: int = (i * 73 + 41) % 220
        var r: int = (i * 43 + 17) % 165
        if land_cells.size() == 220 * 165 and land_cells[r*220+c] == 0:
            continue
        if _height(c,r) > 3.2:
            continue
        coords.append(Vector2i(c,r))
    var batches: Array = MeshAdapter.compile_batches(source, coords.size(), self)
    prop_instances[model_id] = batches
    var factor: float = (1.05 if model_id == "forest" else .8) / MeshAdapter.visual_span(source)
    for i in range(coords.size()):
        var p := coords[i]
        MeshAdapter.place(batches,i,Vector3(p.x+.5,_height(p.x,p.y)+.05,p.y+.5),factor)
    _refresh_visibility()

func _refresh_visibility() -> void:
    for node in city_instances:
        if is_instance_valid(node):
            node.visible = original_enabled
    for arr in actor_instances.values():
        for node in arr:
            if is_instance_valid(node):
                node.visible = original_enabled
    for arr in prop_instances.values():
        for node in arr:
            if is_instance_valid(node):
                node.visible = original_enabled
    visuals_updated.emit(original_enabled and has_cities(), original_enabled and has_actors())
