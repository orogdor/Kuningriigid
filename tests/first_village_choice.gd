extends SceneTree
const AI=preload("res://scripts/ai_settlement.gd")
const Defenses=preload("res://scripts/ai_stone_defenses.gd")
func _initialize() -> void:
 var target={"c":10,"r":10}
 var values={"10:10":{"blocked":2,"water":true,"coast":true},"11:10":{"blocked":1,"water":false,"coast":false},"9:10":{"blocked":1,"water":true,"coast":true}}
 var assess=func(tile):
  var key=str(tile.c)+":"+str(tile.r)
  if not values.has(key):return null
  var v:Dictionary=values[key].duplicate();v.cell=tile;v.distance=absi(tile.c-10)+absi(tile.r-10);return v
 var chosen=AI.first_village_site(target,assess)
 assert(chosen.c==9 and chosen.r==10,"Water and coast must break equal-blocked ties")
 values["10:10"].blocked=0
 assert(AI.first_village_site(target,assess)==target,"A clear original site must be retained")
 values.clear()
 assert(AI.first_village_site(target,assess)==target,"Missing valid alternatives must retain original")
 var fake={"id":0,"team":1,"economy":{"buildings":[{"type":"hall","hp":1200,"x":-18,"z":-12}]}}
 var terrain_assess=func(tile):
  if tile.r!=10 or tile.c not in [10,11]:return null
  var passable=func(x,_z):return tile.c==11 or x<10
  var survey=Defenses.reserve({"ages":[0,0],"seed":1},fake,{"nav":null},Callable(),passable)
  return {"cell":tile,"blocked":survey.terrainBlockedAtFounding,"water":false,"coast":false,"distance":absi(tile.c-10)}
 var shifted=AI.first_village_site(target,terrain_assess)
 assert(shifted.c==11 and shifted.r==10,"Blocked perimeter must move to clear neighbor")
 print("FIRST_VILLAGE_CHOICE_OK");quit()
