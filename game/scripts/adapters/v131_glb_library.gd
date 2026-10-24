extends Node
## Native Godot asset adapter. This intentionally replaces THREE.GLTFLoader,
## THREE.Mesh/Group and manual Three.js scene plumbing; it is NOT a JS port.
## GLBs are fetched from an immutable GitHub V131 commit once, then cached.
## The first launch needs internet for the original assets. Proxies work offline.
signal model_ready(model_id: String, model_root: Node3D)
signal model_failed(model_id: String, message: String)
signal progress_changed(message: String)
signal all_done()

const COMMIT: String = "26562368f56a32616651a266ed2d8c87f06d43d1"
const BASE_URL: String = "https://raw.githubusercontent.com/orogdor/Kuningriigid/" + COMMIT + "/"
const CACHE_DIR: String = "user://v131_glb_cache/"
# These paths exist in V131; the first-run HTTP downloader fetches original bytes.
const ASSETS: Dictionary = {
    "village": "assets/world1000/world_village_1000.glb",
    "warrior": "models-v50/warrior_1000_2.glb",
    "worker": "models-v50/worker_1000_2.glb",
    "forest": "assets/world1000/forest_cluster_1000.glb",
    "rock": "assets/world1000/rock_outcrop_1000.glb"
}
const ORDER: Array[String] = ["village", "warrior", "worker", "forest", "rock"]

var templates: Dictionary = {}
var failures: Dictionary = {}
var _queue: Array[String] = []
var _active: String = ""
var _http: HTTPRequest

func _ready() -> void:
    DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(CACHE_DIR))
    _http = HTTPRequest.new()
    _http.timeout = 25.0
    _http.download_chunk_size = 32768
    add_child(_http)
    _http.request_completed.connect(_on_request_completed)

func load_original_models() -> void:
    if not _queue.is_empty() or _active != "":
        return
    _queue = ORDER.duplicate()
    _load_next()

func has_model(model_id: String) -> bool:
    return templates.has(model_id)

func model_template(model_id: String) -> Node3D:
    return templates.get(model_id, null)

func _load_next() -> void:
    if _queue.is_empty():
        _active = ""
        progress_changed.emit("V131 mudelite laadimine lõppenud: %d/%d" % [templates.size(), ORDER.size()])
        all_done.emit()
        return
    _active = _queue.pop_front()
    if templates.has(_active):
        _load_next()
        return
    var path: String = CACHE_DIR + _active + ".glb"
    if FileAccess.file_exists(path):
        var file := FileAccess.open(path, FileAccess.READ)
        if file != null:
            var payload: PackedByteArray = file.get_buffer(file.get_length())
            file.close()
            if _decode(_active, payload):
                progress_changed.emit("GLB vahemälust: " + _active)
                _load_next()
                return
        DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
    var url: String = BASE_URL + String(ASSETS[_active])
    progress_changed.emit("Laen V131 originaalmudeli: " + _active)
    var err: Error = _http.request(url, PackedStringArray(["User-Agent: Godot-Kuningriigid-V131-Port/0.3"]))
    if err != OK:
        _fail("Võrgupäring ei käivitunud (%s)" % error_string(err))

func _on_request_completed(result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
    if _active == "":
        return
    if result != HTTPRequest.RESULT_SUCCESS or response_code != 200:
        _fail("HTTP %d / tulemus %d" % [response_code, result])
        return
    if not _decode(_active, body):
        _fail("GLB ei sobinud Godoti GLTFDocument parserile")
        return
    var file := FileAccess.open(CACHE_DIR + _active + ".glb", FileAccess.WRITE)
    if file != null:
        file.store_buffer(body)
        file.close()
    progress_changed.emit("V131 GLB valmis: " + _active)
    _load_next()

func _fail(message: String) -> void:
    failures[_active] = message
    model_failed.emit(_active, message)
    _load_next()

func _decode(model_id: String, bytes: PackedByteArray) -> bool:
    if bytes.size() < 20 or bytes.slice(0, 4).get_string_from_ascii() != "glTF":
        return false
    var state := GLTFState.new()
    var doc := GLTFDocument.new()
    var err: Error = doc.append_from_buffer(bytes, "", state)
    if err != OK:
        return false
    var root: Node = doc.generate_scene(state)
    if root == null or not root is Node3D:
        if root != null:
            root.free()
        return false
    templates[model_id] = root
    model_ready.emit(model_id, root)
    return true

func _exit_tree() -> void:
    for root in templates.values():
        if is_instance_valid(root):
            root.free()
