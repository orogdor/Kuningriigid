extends SceneTree
const Recruitment=preload("res://scripts/military_recruitment.gd")

func _initialize():
 var fixture: Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://tests/recruitment_fixture.json"))
 for c in fixture.cases:
  var state: Dictionary=c.state.duplicate(true)
  var city: Dictionary=state.cities[0]
  var before: Dictionary=city.economy.realms[0].duplicate(true)
  var result:=Recruitment.queue_land_unit(state,city,"chariot","standard")
  if c.id=="cartwright_with_wheel":
   assert(result.has("unit"),"Wheel research must permit training with the required buildings and resources")
  else:
   assert(result.has("error"),"Training must be rejected without wheel research")
   assert(city.economy.realms[0]==before,"A rejected order must not consume resources or population")
 print("WHEEL_RECRUITMENT_OK")
 quit()
