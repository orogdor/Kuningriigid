extends ScrollContainer

var touch_index := -1
var touch_start := Vector2.ZERO
var start_scroll := 0
var dragging := false

func _input(event: InputEvent) -> void:
 if not is_visible_in_tree():
  touch_index = -1
  return
 if event is InputEventScreenTouch:
  if event.pressed and touch_index == -1 and get_global_rect().has_point(event.position):
   touch_index = event.index
   touch_start = event.position
   start_scroll = scroll_horizontal
   dragging = false
  elif not event.pressed and event.index == touch_index:
   if dragging:
    get_viewport().set_input_as_handled()
   touch_index = -1
 elif event is InputEventScreenDrag and event.index == touch_index:
  var distance: Vector2 = event.position - touch_start
  if absf(distance.x) > 8.0 and absf(distance.x) > absf(distance.y):
   dragging = true
  if dragging:
   scroll_horizontal = start_scroll - roundi(distance.x)
   get_viewport().set_input_as_handled()
