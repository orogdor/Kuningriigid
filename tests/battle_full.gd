extends SceneTree
const Sim=preload("res://scripts/battle_simulation.gd")
const Formations=preload("res://scripts/battle_formations.gd")
func _initialize():call_deferred("run_test")
func run_test():
 var f: Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://tests/battle_fixture.json"))
 var b: Dictionary=f.initial.duplicate(true);var sim=Sim.new();var ci:=0
 for step in 18000:
  if b.get("result")!=null:break
  while ci<f.commands.size() and float(f.commands[ci].at)<=float(b.elapsed)+0.00000001:
   var c: Dictionary=f.commands[ci];ci+=1;var u: Dictionary={}
   for q in b.squads:
    if int(q.source)==int(c.source):u=q;break
   if c.kind=="manual_move":u.combatMode="manual";u.target={"x":c.x,"z":c.z};u.attackTargetSource=null;u.manualOrder=true;u.advance=false
   elif c.kind=="auto":u.combatMode="auto";u.target=null;u.attackTargetSource=null;u.manualOrder=false;u.anchor={"x":u.x,"z":u.z};u.advance=true
   elif c.kind=="formation":Formations.set_formation(u,c.value,float(b.elapsed),true)
  sim.step(b,0.1,[1,1],null)
  if step%1000==0:print("BATTLE_PROGRESS ",step," ",b.elapsed)
 print("GODOT_BATTLE_FINAL ",JSON.stringify({"elapsed":b.elapsed,"result":b.get("result"),"winner":b.get("winnerTeam"),"casualties":b.get("casualties")}))
 if b.get("result")==null:quit(1)
 else:quit(0)
