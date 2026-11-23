extends Node

signal status_changed(text: String)

const BASE_VERSION := "0.1.0"
const CHANNEL := "https://raw.githubusercontent.com/orogdor/Kuningriigid/godot-update-channel/manifest.json"
const ASSET_PREFIX := "https://github.com/orogdor/Kuningriigid/releases/download/"
const DIR := "user://game_updates"
const META := DIR + "/active.cfg"
const MAX_BYTES := 1610612736
var request: HTTPRequest
var downloading := false
var expected := ""
var revision := 0
var status := "Uuendusi ei ole kontrollitud."
var installed_revision := 0

func _enter_tree() -> void:
	# Never mount downloaded files in the editor or change a developer checkout.
	if OS.has_feature("editor"): return
	var config := ConfigFile.new()
	if config.load(META) != OK or str(config.get_value("update", "base", "")) != BASE_VERSION: return
	var rev := int(config.get_value("update", "revision", 0))
	var digest := str(config.get_value("update", "sha256", ""))
	var path := pack_path(rev)
	if rev <= 0 or not valid_digest(digest) or not FileAccess.file_exists(path): return
	if FileAccess.get_sha256(path) != digest: return
	if ProjectSettings.load_resource_pack(path, true): installed_revision = rev

func _ready() -> void:
	request = HTTPRequest.new()
	request.timeout = 60.0
	request.body_size_limit = MAX_BYTES
	add_child(request)
	request.request_completed.connect(_completed)
	if not OS.has_feature("editor"):
		get_tree().create_timer(15.0).timeout.connect(check)

static func pack_path(rev: int) -> String:
	return DIR + "/update-" + str(rev) + ".pck"

static func valid_digest(value: String) -> bool:
	if value.length() != 64: return false
	for c in value:
		if c not in "0123456789abcdef": return false
	return true

static func valid_package(value: Variant) -> bool:
	if not value is Dictionary: return false
	if not value.get("url") is String or not value.get("sha256") is String: return false
	var url: String = value.url
	var size := int(value.get("size", 0))
	return url.begins_with(ASSET_PREFIX) and url.ends_with(".pck") and valid_digest(value.sha256) and size > 0 and size <= MAX_BYTES

func announce(value: String) -> void:
	status = value
	status_changed.emit(value)

func check() -> void:
	if OS.has_feature("editor"):
		announce("Uuenduste kontroll töötab eksporditud mängus.")
		return
	if not is_instance_valid(request) or request.get_http_client_status() != HTTPClient.STATUS_DISCONNECTED: return
	downloading = false
	request.download_file = ""
	announce("Kontrollin mängu uuendusi…")
	if request.request(CHANNEL) != OK: announce("Uuendusi ei saanud kontrollida.")

func _completed(result: int, code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
	if result != HTTPRequest.RESULT_SUCCESS or code != 200:
		if downloading and FileAccess.file_exists(DIR + "/download.tmp"): DirAccess.remove_absolute(ProjectSettings.globalize_path(DIR + "/download.tmp"))
		announce("Uuendusi ei saanud alla laadida või kontrollida.")
		return
	if downloading:
		finish_download()
		return
	var manifest: Variant = JSON.parse_string(body.get_string_from_utf8())
	if not manifest is Dictionary or int(manifest.get("schema", 0)) != 1 or str(manifest.get("base", "")) != BASE_VERSION:
		announce("Selle mänguversiooni jaoks uuendust ei leitud.")
		return
	var new_revision := int(manifest.get("revision", 0))
	if new_revision <= installed_revision:
		announce("Mängu sisu on ajakohane.")
		return
	var packages: Variant = manifest.get("packages", {})
	var package: Variant = packages.get(OS.get_name(), {}) if packages is Dictionary else {}
	if not valid_package(package):
		announce("Selle seadme jaoks sobivat uuendust ei leitud.")
		return
	if DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(DIR)) != OK:
		announce("Uuenduste kausta ei saanud luua.")
		return
	revision = new_revision
	expected = package.sha256
	request.download_file = DIR + "/download.tmp"
	downloading = true
	announce("Laen mängu uuendust alla…")
	if request.request(package.url) != OK:
		downloading = false
		announce("Uuendust ei saanud alla laadida.")

func finish_download() -> void:
	var temp := DIR + "/download.tmp"
	if not FileAccess.file_exists(temp) or FileAccess.get_sha256(temp) != expected:
		if FileAccess.file_exists(temp): DirAccess.remove_absolute(ProjectSettings.globalize_path(temp))
		announce("Uuenduse kontrollsumma ei sobi; seda ei kasutata.")
		return
	var target := pack_path(revision)
	if DirAccess.rename_absolute(ProjectSettings.globalize_path(temp), ProjectSettings.globalize_path(target)) != OK:
		announce("Uuendust ei saanud salvestada.")
		return
	var config := ConfigFile.new()
	config.set_value("update", "base", BASE_VERSION)
	config.set_value("update", "revision", revision)
	config.set_value("update", "sha256", expected)
	if config.save(META + ".tmp") != OK or DirAccess.rename_absolute(ProjectSettings.globalize_path(META + ".tmp"), ProjectSettings.globalize_path(META)) != OK:
		announce("Uuendust ei saanud aktiveerida.")
		return
	announce("Uuendus on valmis. Taaskäivita mäng, et see rakendada.")
