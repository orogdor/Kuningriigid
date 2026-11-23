extends SceneTree
const HousePanel=preload("res://scripts/house_plan_panel.gd")
func _initialize():call_deferred("run_test")
func tap(control:Control):
 var pos:Vector2=control.get_global_rect().get_center()
 var down:=InputEventScreenTouch.new();down.index=0;down.position=pos;down.pressed=true;Input.parse_input_event(down);await process_frame
 var up:=InputEventScreenTouch.new();up.index=0;up.position=pos;up.pressed=false;Input.parse_input_event(up);await process_frame
func run_test():
 root.size=Vector2i(390,844);var panel=HousePanel.new();root.add_child(panel);assert(panel.open_design("house","Elamu"));for i in 5:await process_frame
 await tap(panel.web_map_buttons[0]);assert(panel.preview.visible,"Touch must open the 3D view")
 await tap(panel.view_tools.get_child(3));assert(panel.preview.walking,"Touch must start walking")
 await tap(panel.web_map_buttons[0]);assert(not panel.preview.visible)
 for i in 10:await process_frame
 var rect:Rect2=panel.category_scroll.get_global_rect();var start:=Vector2(rect.end.x-8,rect.get_center().y);var last:=start
 var down:=InputEventScreenTouch.new();down.index=0;down.position=start;down.pressed=true;Input.parse_input_event(down);await process_frame
 for i in range(1,7):
  var next:=start-Vector2(i*30,0);var drag:=InputEventScreenDrag.new();drag.index=0;drag.position=next;drag.relative=next-last;drag.screen_relative=drag.relative;Input.parse_input_event(drag);last=next;await process_frame
 var up:=InputEventScreenTouch.new();up.index=0;up.position=last;up.pressed=false;Input.parse_input_event(up);await process_frame
 print("SCROLL_DEBUG ",panel.category_scroll.scroll_horizontal," max ",panel.category_scroll.get_h_scroll_bar().max_value," page ",panel.category_scroll.get_h_scroll_bar().page," rect ",rect)
 assert(panel.category_scroll.scroll_horizontal>0,"Touch dragging must reveal hidden categories")
 print("HOUSE_PHONE_TOUCH_OK");quit()
