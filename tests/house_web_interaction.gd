extends SceneTree
const HousePanel=preload("res://scripts/house_plan_panel.gd")
func _initialize():call_deferred("run_test")
func click(control:Control):
 var p:Vector2=control.get_global_rect().get_center()
 var motion:=InputEventMouseMotion.new();motion.position=p;motion.global_position=p;Input.parse_input_event(motion)
 var down:=InputEventMouseButton.new();down.button_index=MOUSE_BUTTON_LEFT;down.position=p;down.global_position=p;down.pressed=true;down.button_mask=MOUSE_BUTTON_MASK_LEFT;Input.parse_input_event(down)
 await process_frame
 var up:=InputEventMouseButton.new();up.button_index=MOUSE_BUTTON_LEFT;up.position=p;up.global_position=p;up.pressed=false;Input.parse_input_event(up)
 await process_frame
func run_test():
 root.size=Vector2i(390,844);var panel=HousePanel.new();root.add_child(panel);assert(panel.open_design("house","Elamu"))
 for i in 5:await process_frame
 assert(panel.floor_controls[0].visible and not panel.floor_controls[1].visible and panel.floor_add_button.visible)
 await click(panel.web_map_buttons[0]);assert(panel.preview.visible and not panel.canvas.visible,"Map eye must open 3D")
 await click(panel.view_tools.get_child(3));assert(panel.preview.walking and panel.walk_pad.visible,"Walk control must open walking mode")
 await click(panel.web_map_buttons[0]);assert(not panel.preview.visible and not panel.preview.walking,"Map eye must return from walking to the plan")
 await click(panel.era_buttons[1]);assert(panel.era==1 and panel.catalogue_open,"Era button must open the matching catalogue")
 await click(panel.save_button);assert(is_instance_valid(panel) and panel.status.text.contains("Elamu"),"Wrong-era preview must not overwrite the game building")
 await click(panel.era_buttons[0]);assert(panel.era==0 and panel.catalogue_open)
 panel.card_scroll.ensure_control_visible(panel.catalogue_buttons.house);await process_frame
 await click(panel.catalogue_buttons.house);assert(panel.canvas.design.id=="house" and not panel.catalogue_open)
 await click(panel.category_buttons.fence);assert(panel.selected_category=="fence")
 await click(panel.tool_buttons.rail);assert(panel.canvas.tool=="rail")
 print("HOUSE_WEB_INTERACTION_OK");quit()
