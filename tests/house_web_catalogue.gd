extends SceneTree
const HousePanel=preload("res://scripts/house_plan_panel.gd")
var saved_count:=0
func _initialize():call_deferred("run_test")
func run_test():
 var panel=HousePanel.new();root.add_child(panel);assert(panel.open_design("house","Elamu"))
 panel.accepted.connect(func(_design):saved_count+=1)
 panel.set_design_value("roofHeight",110);var original_history:int=panel.canvas.history.size()
 panel.era_buttons[1].pressed.emit();assert(panel.era==1 and panel.canvas.design.id=="house@1" and panel.catalogue_open)
 assert(panel.catalogue_buttons.has("house@1") and panel.catalogue_title.text.contains("Pronksiaeg"))
 panel.save_current_design();assert(saved_count==0 and is_instance_valid(panel) and panel.status.text.contains("Elamu"),"A different building must not overwrite the original")
 panel.era_buttons[0].pressed.emit();assert(panel.canvas.design.id=="house" and panel.catalogue_open)
 assert(float(panel.canvas.design.roofHeight)==110 and panel.canvas.history.size()==original_history,"Returning must restore the original draft and undo history")
 assert(panel.catalogue_buttons.has("hall"));panel.catalogue_buttons.hall.pressed.emit();assert(panel.canvas.design.id=="hall" and not panel.catalogue_open)
 panel.save_current_design();assert(saved_count==0,"Another building cannot be saved into the original slot")
 panel.select_preview_project("house");assert(panel.canvas.design.id=="house" and float(panel.canvas.design.roofHeight)==110)
 panel.save_current_design();assert(saved_count==1)
 print("HOUSE_WEB_CATALOGUE_OK");quit()
