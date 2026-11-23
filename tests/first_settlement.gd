extends SceneTree
const Grid=preload("res://scripts/campaign_grid.gd")

func _initialize():
 call_deferred("run_test")

func run_test():
 var scene=load("res://main.tscn").instantiate()
 root.add_child(scene)
 scene.paused=true
 for team in [1,2,3]:
  var person: Dictionary=scene.game.settlers[team]
  assert(int(person.team)==team and scene.game.cities.is_empty())
  var chosen: Variant=scene.choose_ai_settlement_tile(person)
  assert(chosen is Dictionary,"An AI without a city must be able to choose a reachable first site")
  var cell: Dictionary=scene.grid[int(chosen.r)*Grid.COLS+int(chosen.c)]
  assert(cell.land and cell.deposits.wood and cell.deposits.stone)
  scene.manage_ai_settlers(team)
  assert(person.get("landed",false) or not person.get("path",[]).is_empty(),"The AI must land or walk toward its selected first site")
  assert(scene.game.cities.is_empty(),"The migration must not found a city before its scheduled end")
  print("FIRST_SETTLEMENT_OK ",team," ",chosen.c,":",chosen.r)
 scene.game.time=120.0
 scene.end_migration()
 for team in [0,1,2,3]:
  assert(scene.game.cities.any(func(city):return int(city.team)==team),"Every faction should obtain a first city when migration ends")
 print("MIGRATION_END_OK")
 scene.queue_free()
 quit()
