extends Control
const Plan=preload("res://scripts/house_plan_geometry.gd")
const Catalog=preload("res://data/house_editor_catalog.json")
var design: Dictionary={}
func show_design(value: Dictionary) -> void:
 design=value.duplicate(true);queue_redraw()
func _draw() -> void:
 draw_circle(size/2,minf(size.x,size.y)/2,Color("122b40"))
 if design.is_empty() or size.x<=0 or size.y<=0:return
 var geometry:=Plan.plan_geometry(design);var cloud:=PackedVector2Array()
 for key in ["yard","plot"]:
  if design.get(key) is Array:
   for p in design[key]:cloud.append(Plan.point(p))
 for p in Plan.pier_outline(design.get("pier")):cloud.append(p)
 for floor in geometry.floors:cloud.append_array(floor)
 for wall in geometry.walls:cloud.append(wall.a);cloud.append(wall.b)
 for fence in design.get("fences",[]):cloud.append(Plan.point(fence.a));cloud.append(Plan.point(fence.b))
 for item in design.get("items",[]):cloud.append(Plan.point(item.point))
 var lo:=Vector2(INF,INF);var hi:=Vector2(-INF,-INF)
 for point in cloud:lo=lo.min(point);hi=hi.max(point)
 var center:Vector2=(lo+hi)/2 if not cloud.is_empty() else Vector2(480,312)
 var source_factor:float=minf(0.42,168.0/maxf(60,lo.distance_to(hi))) if not cloud.is_empty() else 0.185
 var factor:float=source_factor*minf(size.x,size.y)/192.0
 draw_set_transform(size/2-center*factor,0,Vector2.ONE*factor)
 var definition:Dictionary=Catalog.data.catalog.get(str(design.get("id","")),{})
 if str(design.get("id",""))=="fisher" or definition.get("base","")=="fisher" or definition.get("coast",false):draw_rect(Rect2(0,548,960,77),Color("426c7a"))
 for key in ["yard","plot"]:
  if design.get(key) is Array:
   var poly:=PackedVector2Array()
   for p in design[key]:poly.append(Plan.point(p))
   if poly.size()>=3:draw_colored_polygon(poly,Color(0.67,0.60,0.45,0.28))
 for floor in geometry.floors:
  if floor.size()>=3:draw_colored_polygon(floor,Color(0.77,0.66,0.45,0.63))
 var pier:=Plan.pier_outline(design.get("pier"))
 if pier.size()>=3:draw_colored_polygon(pier,Color("c4a872"))
 for wall in geometry.walls:draw_line(wall.a,wall.b,Color("ecd296"),2.4/factor)
 for fence in design.get("fences",[]):draw_line(Plan.point(fence.a),Plan.point(fence.b),Color("ecd296"),2.4/factor)
 for item in design.get("items",[]):draw_rect(Rect2(Plan.point(item.point)-Vector2.ONE*2/factor,Vector2.ONE*4/factor),Color("e4ce91"))
 draw_set_transform(Vector2.ZERO)
