extends SceneTree
# Runs against a real exported game.pck in GitHub Actions, before creating APK.
# Tests resource-pack mounting and loading the principal PackedScene.
func _initialize() -> void:
    call_deferred("_verify")

func _verify() -> void:
    var orientation: int = int(ProjectSettings.get_setting("display/window/handheld/orientation", -1))
    if orientation != 4:
        printerr("BOOTSTRAP_SMOKE_FAIL: Android orientation must be SENSOR_LANDSCAPE=4, got ",orientation)
        quit(1)
        return
    var launcher_stamp: FileAccess = FileAccess.open("res://seed_build.json",FileAccess.READ)
    if launcher_stamp == null:
        printerr("BOOTSTRAP_SMOKE_FAIL: APK seed version metadata is missing")
        quit(1)
        return
    var launcher_info: Variant = JSON.parse_string(launcher_stamp.get_as_text())
    if not (launcher_info is Dictionary) or not str(launcher_info.get("tag","")).begins_with("godot-dev-"):
        printerr("BOOTSTRAP_SMOKE_FAIL: APK seed version tag invalid")
        quit(1)
        return
    var location: String = "res://seed/game.pck"
    if not FileAccess.file_exists(location):
        printerr("BOOTSTRAP_SMOKE_FAIL: bundled seed PCK missing")
        quit(1)
        return
    if not ProjectSettings.load_resource_pack(ProjectSettings.globalize_path(location), true):
        printerr("BOOTSTRAP_SMOKE_FAIL: Godot cannot mount exported PCK")
        quit(1)
        return
    var scene: Resource = ResourceLoader.load("res://scenes/Main.tscn", "PackedScene", ResourceLoader.CACHE_MODE_IGNORE)
    if not (scene is PackedScene):
        printerr("BOOTSTRAP_SMOKE_FAIL: game Main.tscn is not loadable")
        quit(1)
        return
    var build_file: FileAccess = FileAccess.open("res://data/build_info.json",FileAccess.READ)
    if build_file == null:
        printerr("BOOTSTRAP_SMOKE_FAIL: missing packed build_info.json")
        quit(1)
        return
    var version: Variant = JSON.parse_string(build_file.get_as_text())
    if not (version is Dictionary) or not str(version.get("tag","")).begins_with("godot-dev-"):
        printerr("BOOTSTRAP_SMOKE_FAIL: build does not contain numbered Godot dev tag")
        quit(1)
        return
    if str(version.get("tag","")) != str(launcher_info.get("tag","")):
        printerr("BOOTSTRAP_SMOKE_FAIL: bundled APK seed version differs from packed gameplay")
        quit(1)
        return
    print("BOOTSTRAP_PACK_VERSION: "+str(version["tag"]))
    print("BOOTSTRAP_SMOKE_PASS: exported PCK mounted and game scene loaded")
    quit(0)
