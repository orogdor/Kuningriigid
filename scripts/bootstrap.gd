extends Node

func _ready() -> void:
	call_deferred("_open_game")

func _open_game() -> void:
	var result := get_tree().change_scene_to_file("res://main.tscn")
	if result != OK:
		push_error("Mängu põhivaadet ei saanud avada: " + str(result))
