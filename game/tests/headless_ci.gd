extends SceneTree
# Exit non-zero when a port regression fails. Catches headless parser errors too.
const PortChecks = preload("res://tests/port_checks.gd")

func _initialize() -> void:
    call_deferred("_run")

func _run() -> void:
    var result: Dictionary = PortChecks.run()
    print("V131_REGRESSION: ", result["passed"], "/", result["count"])
    var failures: Array = result.get("failed", [])
    if not failures.is_empty():
        printerr("V131_TEST_FAILURES: ", JSON.stringify(failures))
        quit(1)
    else:
        quit(0)
