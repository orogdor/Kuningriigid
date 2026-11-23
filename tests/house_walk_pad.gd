extends SceneTree
const HousePanel=preload("res://scripts/house_plan_panel.gd")
func _initialize():call_deferred("run_test")
func run_test():
 var panel=HousePanel.new();root.add_child(panel);assert(panel.open_design("house","Elamu"))
 assert(not panel.walk_pad.visible)
 panel.toggle_walk();assert(panel.preview.walking and panel.walk_pad.visible)
 var forward:Button=panel.walk_pad_buttons["▲"];forward.button_down.emit();assert(panel.preview.walk_pad_input==Vector2(0,1))
 var original:Vector3=panel.preview.walk_pos;panel.preview._process(0.1);assert(panel.preview.walk_pos.distance_to(original)>0.01,"Touch pad should move the walker")
 forward.button_up.emit();assert(panel.preview.walk_pad_input==Vector2.ZERO)
 for pair in [["◀",Vector2(-1,0)],["▼",Vector2(0,-1)],["▶",Vector2(1,0)]]:
  var button:Button=panel.walk_pad_buttons[pair[0]];button.button_down.emit();assert(panel.preview.walk_pad_input==pair[1]);button.button_up.emit();assert(panel.preview.walk_pad_input==Vector2.ZERO)
 panel.toggle_walk();assert(not panel.walk_pad.visible and panel.preview.walk_pad_input==Vector2.ZERO)
 forward.button_up.emit();assert(panel.preview.walk_pad_input==Vector2.ZERO)
 print("HOUSE_WALK_PAD_OK");quit()
