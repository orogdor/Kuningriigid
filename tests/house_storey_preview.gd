extends SceneTree
const HousePanel=preload("res://scripts/house_plan_panel.gd")
func _initialize():call_deferred("run_test")
func run_test():
 var panel=HousePanel.new();root.add_child(panel);assert(panel.open_design("house","Elamu"))
 assert(panel.canvas.add_floor());panel.canvas.copy_floor_walls();panel.select_floor(0);panel.toggle_preview()
 var second=panel.preview.model.find_child("SecondStorey",true,false);assert(second!=null and second.visible)
 panel.preview.set_roof_visible(false);assert(not second.visible,"Roofless ground-floor view must hide the second storey")
 panel.select_floor(1);assert(second.visible,"Upper-floor view must show the second storey even without a roof")
 panel.select_floor(0);panel.preview.set_roof_visible(true);assert(second.visible)
 print("HOUSE_STOREY_PREVIEW_OK");quit()
