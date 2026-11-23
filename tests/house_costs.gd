extends SceneTree
const Survey=preload("res://scripts/house_plan_survey.gd")
func _initialize() -> void:
 var samples:Array=JSON.parse_string(FileAccess.get_file_as_string("res://tests/house_survey_web_reference.json"))
 for sample in samples:
  var estimate=Survey.estimate(sample.design)
  print("HOUSE_ESTIMATE ",JSON.stringify(estimate))
  for kind in sample.estimate:
   assert(int(estimate.get(kind,0))==int(sample.estimate[kind]),"House estimate differs from web for "+str(kind))
 print("HOUSE_ESTIMATE_OK");quit()
