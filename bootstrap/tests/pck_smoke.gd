extends SceneTree
# Runs against a real exported game.pck in GitHub Actions, before creating APK.
# Tests resource-pack mounting and loading the principal PackedScene.
func _initialize() -> void:
    call_deferred("_verify")

func _verify() -> void:
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
    print("BOOTSTRAP_PACK_VERSION: "+str(version["tag"]))
    print("BOOTSTRAP_SMOKE_PASS: exported PCK mounted and game scene loaded")
    quit(0)
