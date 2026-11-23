extends SceneTree
const Sim=preload("res://scripts/battle_simulation.gd")
func _initialize():call_deferred("run_test")
func run_test():
 var b: Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://tests/bow_stall_fixture.json"))
 var squads: Array=b.squads.filter(func(q):return q.kind=="iron_archer")
 var before: Array=squads.map(func(q):return Vector2(q.x,q.z))
 var sim=Sim.new()
 for step in 12000:
  if b.get("result")!=null:break
  sim.step(b,0.1,[1,1],null)
 var moved:=false
 for i in squads.size():
  if Vector2(squads[i].x,squads[i].z).distance_to(before[i])>1.0:moved=true
 assert(moved,"Bow squads remained stationary")
 assert(b.get("result")!=null,"Battle remained unresolved")
 print("GODOT_BOW_STALL_OK ",JSON.stringify({"elapsed":b.elapsed,"result":b.get("result")}));quit()
