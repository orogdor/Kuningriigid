extends SceneTree
const HousePanel=preload("res://scripts/house_plan_panel.gd")
const Plan=preload("res://scripts/house_plan_geometry.gd")
func _initialize():call_deferred("run_test")
func run_test():
 var panel=HousePanel.new();root.add_child(panel)
 assert(panel.open_design("fisher","Kalameheonn"));panel.toggle_preview()
 var view=panel.preview;assert(view.coast_active and view.shore_sand.visible and view.shore_water.visible)
 assert(view.start_walking())
 var origin:Vector2=view.walk_origin
 var water:Vector2=(Vector2(600,580)-origin)/Plan.PX_PER_M
 var pier:Vector2=(Vector2(506,580)-origin)/Plan.PX_PER_M
 assert(view.walk_blocked(water),"Water away from the pier must block walking")
 assert(not view.walk_blocked(pier),"The pier must remain walkable")
 view.stop_walking();panel.open_design("house","Elamu");view.show_design(panel.canvas.design)
 assert(not view.coast_active and not view.shore_water.visible,"A non-coastal house must not retain the sea")
 print("HOUSE_COAST_OK");quit()

