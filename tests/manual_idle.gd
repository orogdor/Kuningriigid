extends SceneTree
const Sim=preload("res://scripts/battle_simulation.gd")

func _initialize():
 var fixture: Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://tests/manual_idle_fixture.json"))
 var battle: Dictionary=fixture.before.duplicate(true)
 var squad: Dictionary=battle.squads[0]
 var anchor: Dictionary=squad.anchor.duplicate(true)
 var sim=Sim.new()
 for i in range(30):sim.step(battle,0.1,[1,1],null)
 assert(is_equal_approx(float(squad.anchor.x),float(anchor.x)) and is_equal_approx(float(squad.anchor.z),float(anchor.z)),"An idle manual squad must keep its anchor in place")
 print("MANUAL_IDLE_OK")
 quit()
