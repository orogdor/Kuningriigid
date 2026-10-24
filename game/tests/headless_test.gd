extends SceneTree
const Checks = preload("res://tests/port_checks.gd")

func _initialize() -> void:
    var report: Dictionary = Checks.run()
    print(JSON.stringify(report))
    quit(0 if report["failed"].is_empty() else 1)
