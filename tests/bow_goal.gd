extends SceneTree
const Goals=preload("res://scripts/battle_goals.gd")
func _initialize():
 var bow={"team":0,"kind":"iron_archer","x":0.0,"z":0.0,"hp":100,"battleSide":1,"formation":"loose","tacticalRole":"missile","ammoRemaining":10,"deployment":{"x":0,"z":0}}
 var enemy={"team":1,"kind":"iron_archer","x":20.0,"z":0.0,"hp":100}
 var battle={"elapsed":100.0};var stats={"range":17.0}
 var aim: Variant=Goals.tactical_goal(bow,enemy,[bow,enemy],battle,stats)
 assert(aim is Dictionary and float(aim.x)>0,"An unsupported archer outside range should approach")
 enemy.x=10.0
 assert(Goals.tactical_goal(bow,enemy,[bow,enemy],battle,stats)==null,"An archer already in range should not advance")
 bow.formation="hold";enemy.x=20.0;bow.anchor={"x":0.0,"z":0.0}
 var hold: Dictionary=Goals.tactical_goal(bow,enemy,[bow,enemy],battle,stats)
 assert(float(hold.x)==0.0,"Hold formation must keep its position")
 bow.kind="crossbowman";bow.formation="loose"
 assert(Goals.tactical_goal(bow,enemy,[bow,enemy],battle,stats)==null,"The post-Iron-Age behavior must remain unchanged")
 print("BOW_GOAL_OK");quit()
