extends Control
## Small immutable launcher. Never preload game scripts before mounting a patch.
## Experimental Godot PCKs are published as prereleases of the existing repo.
## This can move to a dedicated Godot repository without changing the pack format.
const RELEASES_API: String = "https://api.github.com/repos/orogdor/Kuningriigid/releases?per_page=20"
const GAME_SCENE: String = "res://scenes/Main.tscn"
const SEED_PACK: String = "res://seed/game.pck"
const SEED_INFO: String = "res://seed_build.json"
const OTA_DIR: String = "user://ota/"
const STATE_FILE: String = "user://ota/installed.json"
const AGENT: String = "Kuningriigid-Godot-OTA/1.0"
const CHECK_TIMEOUT: float = 17.0
const MAX_PACK_BYTES: int = 536870912 # Do not fill a phone with an unexpectedly huge release

var http: HTTPRequest
var info: Label
var installed_label: Label
var latest_label: Label
var start_button: Button
var busy: bool = false
var stage: String = ""
var active_pack: String = ""
var active_tag: String = ""
var proposed_tag: String = ""
var proposed_digest: String = ""
var proposed_url: String = ""
var temp_path: String = ""
var staged_pack: String = ""
var staged_tag: String = ""
var staged_hash: String = ""

static func version_number(tag: String) -> int:
    if not tag.begins_with("godot-dev-"):
        return -1
    var suffix: String = tag.trim_prefix("godot-dev-")
    return int(suffix) if suffix.is_valid_int() and int(suffix) >= 0 else -1

static func tag_from_json(path: String) -> String:
    var f: FileAccess = FileAccess.open(path,FileAccess.READ)
    if f == null:
        return ""
    var value: Variant = JSON.parse_string(f.get_as_text())
    return str(value.get("tag","")) if value is Dictionary else ""

func _seed_version() -> String:
    return tag_from_json(SEED_INFO)

func _choose_embedded_seed() -> bool:
    var bundled: int = version_number(_seed_version())
    var previous: int = version_number(str(_state().get("tag","")))
    # The new APK is the floor: a saved OTA from a previous install must not
    # override a newer PCK shipped inside the APK (including old "seed" tags).
    return bundled >= 0 and bundled > previous

func _ready() -> void:
    if DisplayServer.has_feature(DisplayServer.FEATURE_ORIENTATION):
        DisplayServer.screen_set_orientation(DisplayServer.SCREEN_SENSOR_LANDSCAPE)
    _make_interface()
    var abs_dir: String = ProjectSettings.globalize_path(OTA_DIR)
    var create_error: Error = DirAccess.make_dir_recursive_absolute(abs_dir)
    if create_error != OK:
        _show_error("Uuenduste kausta ei saanud avada.")
        return
    _prune_old_downloads()
    _store_latest("",false)
    # Loading the pack occurs before any code or scene from the game is loaded.
    var prefer_bundled: bool = _choose_embedded_seed()
    var mounted: bool = false
    if prefer_bundled:
        mounted = _mount_seed()
    else:
        mounted = _mount_saved()
        if not mounted:
            mounted = _mount_seed()
    if not mounted:
        _show_error("Mängu algpakett puudub. Paigalda GitHub Releasesi APK uuesti.")
        return
    start_button.disabled = false
    _refresh_versions()
    _set_status("Kontrollin GitHubist uuendusi…")
    http = HTTPRequest.new()
    http.max_redirects = 8
    http.timeout = CHECK_TIMEOUT
    add_child(http)
    http.request_completed.connect(_on_http_completed)
    stage = "metadata"
    busy = true
    var err: Error = http.request(RELEASES_API,["User-Agent: " + AGENT,"Accept: application/vnd.github+json"])
    if err != OK:
        busy = false
        _start_game("Võrku ei saanud avada. Käivitan olemasoleva versiooni.")

func _prune_old_downloads() -> void:
    # Free mobile storage at startup; never delete a pack referenced by state.
    var keep: String = str(_state().get("path", ""))
    var directory: DirAccess = DirAccess.open(OTA_DIR)
    if directory == null:
        return
    directory.list_dir_begin()
    var name: String = directory.get_next()
    while name != "":
        if name.begins_with("download-") and name.ends_with(".pck") and OTA_DIR + name != keep:
            directory.remove(name)
        name = directory.get_next()
    directory.list_dir_end()

func _make_interface() -> void:
    var bg := ColorRect.new()
    bg.color = Color("#101e2a")
    bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    add_child(bg)
    var centered := VBoxContainer.new()
    centered.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
    centered.custom_minimum_size = Vector2(540, 150)
    centered.position = Vector2(-270, -75)
    add_child(centered)
    var heading := Label.new()
    heading.text = "KUNINGRIIGID"
    heading.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    heading.add_theme_font_size_override("font_size", 30)
    centered.add_child(heading)
    installed_label = Label.new()
    installed_label.text = "Paigaldatud mäng: kontrollin…"
    installed_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    installed_label.add_theme_font_size_override("font_size",21)
    centered.add_child(installed_label)
    latest_label = Label.new()
    latest_label.text = "Viimane GitHubis: kontrollimata"
    latest_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    latest_label.add_theme_font_size_override("font_size",17)
    centered.add_child(latest_label)
    info = Label.new()
    info.text = "Alustan…"
    info.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    centered.add_child(info)
    start_button = Button.new()
    start_button.text = "Mängi kohe (ühenduseta)"
    start_button.disabled = true
    start_button.pressed.connect(_skip_and_start)
    centered.add_child(start_button)

func _pack_version() -> String:
    var file: FileAccess = FileAccess.open("res://data/build_info.json",FileAccess.READ)
    if file == null:
        return active_tag if active_tag != "" else _seed_version()
    var parsed: Variant = JSON.parse_string(file.get_as_text())
    if parsed is Dictionary:
        return str(parsed.get("tag",active_tag if active_tag != "" else _seed_version()))
    return active_tag if active_tag != "" else "teadmata"

func _store_latest(tag: String,checked: bool) -> void:
    var file: FileAccess = FileAccess.open(OTA_DIR+"latest.json",FileAccess.WRITE)
    if file != null:
        file.store_string(JSON.stringify({"tag":tag,"checked":checked,
            "checked_at":int(Time.get_unix_time_from_system()) if checked else 0}))

func _refresh_versions() -> void:
    if is_instance_valid(installed_label):
        installed_label.text = "Paigaldatud: "+_pack_version()
    if is_instance_valid(latest_label):
        latest_label.text = "Viimane GitHubis: "+(proposed_tag if proposed_tag!="" else "kontrollimata")
        if proposed_tag != "":
            latest_label.text += ("  ✓ UUSIM" if version_number(_pack_version()) >= version_number(proposed_tag) and version_number(_pack_version()) >= 0 else "  • UUENDUS SAADAVAL")

func _set_status(message: String) -> void:
    if is_instance_valid(info):
        info.text = message

func _show_error(message: String) -> void:
    busy = false
    _set_status(message)

func _state() -> Dictionary:
    if not FileAccess.file_exists(STATE_FILE):
        return {}
    var f := FileAccess.open(STATE_FILE, FileAccess.READ)
    if f == null:
        return {}
    var value: Variant = JSON.parse_string(f.get_as_text())
    return value if value is Dictionary else {}

func _store_state(tag: String, path: String, digest: String) -> void:
    var f := FileAccess.open(STATE_FILE, FileAccess.WRITE)
    if f != null:
        f.store_string(JSON.stringify({"tag":tag,"path":path,"sha256":digest}))

func _mount_saved() -> bool:
    var data: Dictionary = _state()
    var path: String = str(data.get("path", ""))
    var hash: String = str(data.get("sha256", ""))
    # Only accept files from the app's private user://ota directory.
    if not path.begins_with(OTA_DIR) or path.contains(".."):
        return false
    if not FileAccess.file_exists(path) or hash.length() != 64:
        return false
    if FileAccess.get_sha256(path).to_lower() != hash.to_lower():
        return false
    if not ProjectSettings.load_resource_pack(ProjectSettings.globalize_path(path),true):
        return false
    active_pack = path
    active_tag = str(data.get("tag", ""))
    return true

func _mount_seed() -> bool:
    var seed: FileAccess = FileAccess.open(SEED_PACK, FileAccess.READ)
    if seed == null:
        return false
    var target: String = OTA_DIR + "seed.pck"
    var out: FileAccess = FileAccess.open(target,FileAccess.WRITE)
    if out == null:
        return false
    while seed.get_position() < seed.get_length():
        out.store_buffer(seed.get_buffer(mini(1048576, seed.get_length()-seed.get_position())))
    out.flush()
    out.close()
    if not ProjectSettings.load_resource_pack(ProjectSettings.globalize_path(target),true):
        return false
    active_pack=target
    active_tag=_seed_version()
    if version_number(active_tag) < 0:
        active_tag="seed"
    _store_state(active_tag,target,FileAccess.get_sha256(target))
    return true

func _on_http_completed(result: int, status: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
    if not busy:
        return
    if result != HTTPRequest.RESULT_SUCCESS or status != 200:
        busy=false
        _start_game("Uuendust ei saanud kontrollida. Avan olemasoleva versiooni.")
        return
    if stage == "metadata":
        _parse_release(body)
    elif stage == "download":
        _finish_download()

func _parse_release(body: PackedByteArray) -> void:
    var parsed: Variant = JSON.parse_string(body.get_string_from_utf8())
    if not (parsed is Array):
        busy=false
        _start_game("GitHubi vastus oli vigane. Kasutan eelmist versiooni.")
        return
    var release: Dictionary = {}
    for candidate in parsed:
        if candidate is Dictionary and not bool(candidate.get("draft", false)):
            var tag: String = str(candidate.get("tag_name", ""))
            if tag.begins_with("godot-dev-"):
                release = candidate
                break
    if release.is_empty():
        busy=false
        _start_game("Godoti eelväljalaset ei leitud. Kasutan olemasolevat versiooni.")
        return
    proposed_tag = str(release.get("tag_name", ""))
    if not proposed_tag.begins_with("godot-dev-"):
        busy=false
        _start_game("Uuenduse versioonitunnus on vigane.")
        return
    _store_latest(proposed_tag,true)
    _refresh_versions()
    if version_number(proposed_tag) <= version_number(_pack_version()) and version_number(_pack_version()) >= 0:
        busy=false
        _start_game("Mäng on ajakohane.")
        return
    proposed_url=""
    proposed_digest=""
    var assets: Array = release.get("assets", [])
    var pack_bytes: int = 0
    for asset in assets:
        if not (asset is Dictionary):
            continue
        if str(asset.get("name", "")) == "game.pck":
            proposed_url=str(asset.get("browser_download_url", ""))
            proposed_digest=str(asset.get("digest", ""))
            pack_bytes=int(asset.get("size", 0))
            break
    # A SHA-256 digest from the GitHub Releases API is required, never skip this check.
    if not proposed_url.begins_with("https://github.com/orogdor/Kuningriigid/releases/download/godot-dev-") or not proposed_digest.begins_with("sha256:") or proposed_digest.length() != 71:
        busy=false
        _start_game("Uuel versioonil puudub kontrollitud PCK. Kasutan eelmist versiooni.")
        return
    if pack_bytes <= 0 or pack_bytes > MAX_PACK_BYTES:
        busy=false
        _start_game("Uuenduspaketi suurus pole lubatud. Avan eelmise versiooni.")
        return
    var safe_tag: String = proposed_tag.validate_filename()
    temp_path=OTA_DIR+"download-"+safe_tag+".pck"
    if FileAccess.file_exists(temp_path):
        DirAccess.remove_absolute(ProjectSettings.globalize_path(temp_path))
    stage="download"
    _set_status("Leidsin uuenduse "+proposed_tag+". Laadin mängufaile…")
    http.download_file=temp_path
    var err: Error = http.request(proposed_url,["User-Agent: "+AGENT])
    if err != OK:
        busy=false
        _start_game("Allalaadimist ei õnnestunud alustada.")

func _finish_download() -> void:
    busy=false
    http.download_file=""
    if not FileAccess.file_exists(temp_path):
        _start_game("Uuendusfaili ei leitud. Avan vana versiooni.")
        return
    var expected: String = proposed_digest.substr(7).to_lower()
    var measured: String = FileAccess.get_sha256(temp_path).to_lower()
    if measured != expected:
        DirAccess.remove_absolute(ProjectSettings.globalize_path(temp_path))
        _start_game("Uuenduse kontrollsumma ei klapi. Avan vana versiooni.")
        return
    # Existing game scene was not loaded yet, so scripts will be loaded from the new pack.
    if not ProjectSettings.load_resource_pack(ProjectSettings.globalize_path(temp_path),true):
        DirAccess.remove_absolute(ProjectSettings.globalize_path(temp_path))
        _start_game("Uuendust ei saanud laadida. Avan vana versiooni.")
        return
    # The old installed state is kept until the new game scene loads.
    # A corrupt yet mountable PCK must never permanently replace the working pack.
    var scene_resource: Resource = ResourceLoader.load(GAME_SCENE, "PackedScene", ResourceLoader.CACHE_MODE_IGNORE)
    if not (scene_resource is PackedScene):
        _restore_previous_pack("Uue mängupaketi stseen ei avanenud.")
        return
    staged_pack=temp_path
    staged_tag=proposed_tag
    staged_hash=expected
    _refresh_versions()
    _start_game("Uus versioon "+proposed_tag+" on alla laaditud.")

func _skip_and_start() -> void:
    busy = false
    if is_instance_valid(http):
        http.cancel_request()
    _start_game("Avan olemasoleva versiooni.")

func _restore_previous_pack(message: String) -> void:
    staged_pack=""
    staged_tag=""
    staged_hash=""
    # Re-mounting an older pack with replace_files=true puts its resources back on top.
    if active_pack != "" and ProjectSettings.load_resource_pack(ProjectSettings.globalize_path(active_pack), true):
        _start_game(message + " Taastan eelmise versiooni.")
    else:
        _show_error(message + " Eelmise versiooni taastamine ebaõnnestus.")

func _start_game(message: String) -> void:
    if active_pack == "":
        _show_error("Mängufaile ei ole. Ühenda internetiga või paigalda APK uuesti.")
        return
    start_button.disabled=true
    _set_status(message)
    _refresh_versions()
    call_deferred("_open_scene")

func _open_scene() -> void:
    var err: Error=get_tree().change_scene_to_file(GAME_SCENE)
    if err == OK:
        # Commit only after Godot accepts the new scene. The previous pack is
        # still the persisted fallback if the scene cannot be opened.
        if staged_pack != "":
            _store_state(staged_tag, staged_pack, staged_hash)
            active_pack=staged_pack
            active_tag=staged_tag
        return
    if staged_pack != "":
        _restore_previous_pack("Uus versioon ei käivitunud ("+str(err)+").")
        return
    # Last-resort recovery from a saved PCK that was previously valid but is
    # no longer compatible. Bootstrap's original seed remains in the APK.
    if active_pack != OTA_DIR+"seed.pck" and _mount_seed():
        _store_state("seed", active_pack, FileAccess.get_sha256(active_pack))
        call_deferred("_open_scene")
        return
    start_button.disabled=false
    _show_error("Mängu stseeni ei saanud avada ("+str(err)+").")
