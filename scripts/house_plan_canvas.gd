extends Control
const Plan=preload("res://scripts/house_plan_geometry.gd")
const Edit=preload("res://scripts/house_plan_edit.gd")
const Catalog=preload("res://data/house_editor_catalog.json")
signal changed(design: Dictionary)
signal message(text: String)
var design:Dictionary={}
var tool:="rect"
var style:="hide"
var wall_brush:=""
var era:=0
var snap_on:=true
var active_floor:=0
var moving_item:=-1
var move_offset:=Vector2.ZERO
var item_type:="basket"
var drag:=false
var drag_start:=Vector2.ZERO
var drag_end:=Vector2.ZERO
var history:Array=[]
var future:Array=[]
var view_scale:=1.0
var view_offset:=Vector2.ZERO
var panning:=false
var pan_start:=Vector2.ZERO
var pan_origin:=Vector2.ZERO

func _ready() -> void:
 mouse_filter=Control.MOUSE_FILTER_STOP;clip_contents=true;queue_redraw()

func load_design(data: Dictionary,design_era: int) -> void:
 design=data.duplicate(true);era=design_era;active_floor=0;view_scale=1.0;view_offset=Vector2.ZERO;panning=false;history.clear();future.clear();queue_redraw()

func apply_design(next: Dictionary) -> void:
 history.append(design.duplicate(true))
 if history.size()>100:history.pop_front()
 future.clear();design=next;queue_redraw();changed.emit(design)

func undo() -> void:
 if history.is_empty():return
 future.append(design.duplicate(true));design=history.pop_back()
 if not design.has("upper"):active_floor=0
 queue_redraw();changed.emit(design)

func redo() -> void:
 if future.is_empty():return
 history.append(design.duplicate(true));design=future.pop_back()
 if not design.has("upper"):active_floor=0
 queue_redraw();changed.emit(design)

func plan_transform() -> Transform2D:
 var scale_factor:=minf(size.x/960.0,size.y/625.0);var offset:=(size-Vector2(960,625)*scale_factor)/2
 return Transform2D(0,Vector2(scale_factor*view_scale,scale_factor*view_scale),0,offset+view_offset*scale_factor)

func clamp_view() -> void:
 view_scale=clampf(view_scale,1.0,4.0)
 view_offset.x=clampf(view_offset.x,960.0-960.0*view_scale,0.0)
 view_offset.y=clampf(view_offset.y,625.0-625.0*view_scale,0.0)

func zoom_at(screen:Vector2,factor:float) -> void:
 var base:=minf(size.x/960.0,size.y/625.0)
 if base<=0:return
 var inset:Vector2=(size-Vector2(960,625)*base)/2
 var cursor:Vector2=(screen-inset)/base
 var world:Vector2=(cursor-view_offset)/view_scale
 view_scale=clampf(view_scale*factor,1.0,4.0);view_offset=cursor-world*view_scale;clamp_view();queue_redraw()

func begin_pan(screen:Vector2) -> void:
 panning=true;pan_start=screen;pan_origin=view_offset

func plan_position(p: Vector2) -> Vector2:
 return plan_transform().affine_inverse()*p

func _draw() -> void:
 draw_rect(Rect2(Vector2.ZERO,size),Color("d6c6a3"))
 if design.is_empty():return
 var plan:=current_plan()
 draw_set_transform_matrix(plan_transform())
 draw_rect(Rect2(Vector2.ZERO,Vector2(960,625)),Color("dccba4"))
 for x in range(30,931,10):draw_line(Vector2(x,40),Vector2(x,580),Color(0.38,0.31,0.22,0.09),1)
 for y in range(40,581,10):draw_line(Vector2(30,y),Vector2(930,y),Color(0.38,0.31,0.22,0.09),1)
 for key in ["plot","yard"]:
  if plan.get(key)!=null and plan[key] is Array:
   var p:=PackedVector2Array()
   for q in plan[key]:p.append(Plan.point(q))
   if p.size()>=3:draw_colored_polygon(p,Color(0.48,0.53,0.30,0.20));draw_polyline(PackedVector2Array(Array(p)+[p[0]]),Color("8b7c4e"),3)
 if plan.get("pier") is Dictionary:
  var pier:=Plan.pier_outline(plan.pier)
  if pier.size()>=3:draw_colored_polygon(pier,Color("ad8962"));draw_polyline(PackedVector2Array(Array(pier)+[pier[0]]),Color("654b32"),2)
 var geometry:=Plan.plan_geometry(plan)
 for floor in geometry.floors:
  if floor.size()>=3:draw_colored_polygon(floor,Color("c4ac7a"))
 for fence in plan.get("fences",[]):
  draw_line(Plan.point(fence.a),Plan.point(fence.b),Color("6b4c2b"),8)
 for wall in geometry.walls:draw_line(wall.a,wall.b,Color("513621") if wall.group=="outer" else Color("6d5034"),10 if wall.group=="outer" else 7)
 for opening in plan.get("openings",[]):
  var p:=Plan.point(opening.point);var hit:=Plan.nearest_wall(p,geometry.walls,2.0)
  if not hit.is_empty():
   var direction:Vector2=(hit.edge.b-hit.edge.a).normalized();var width:=22.0 if opening.type=="door" else 15.0
   draw_line(p-direction*width,p+direction*width,Color("d4ba89") if opening.type=="door" else Color("a4c0bd"),12)
 for item in plan.get("items",[]):
  var p:=Plan.point(item.point);var dims:Array=Catalog.data.itemSizes.get(item.type,[20,20]);var bounds:=Rect2(p-Vector2(float(dims[0]),float(dims[1]))/2,Vector2(float(dims[0]),float(dims[1])))
  draw_rect(bounds,Color(0.47,0.32,0.17,0.45));draw_rect(bounds,Color("60472d"),false,2)
  draw_string(ThemeDB.fallback_font,p+Vector2(4,-4),str(item.type),HORIZONTAL_ALIGNMENT_LEFT,-1,12,Color("443222"))
 if drag:
  var shape:=Plan.candidate(tool,drag_start,drag_end,Edit.LIMITS[clampi(era,0,2)])
  if not shape.is_empty() and shape.has("type"):
   var poly:=Plan.room_polygon(shape)
   if poly.size()>2:draw_polyline(PackedVector2Array(Array(poly)+[poly[0]]),Color("2b6540"),3)
  else:draw_line(drag_start,drag_end,Color("2b6540"),3)
 draw_set_transform_matrix(Transform2D.IDENTITY)

func _gui_input(event: InputEvent) -> void:
 if design.is_empty():return
 var plan:=current_plan()
 if event is InputEventMouseButton:
  if event.button_index in [MOUSE_BUTTON_WHEEL_UP,MOUSE_BUTTON_WHEEL_DOWN] and event.pressed:
   zoom_at(event.position,exp(0.16 if event.button_index==MOUSE_BUTTON_WHEEL_UP else -0.16));accept_event();return
  if event.button_index==MOUSE_BUTTON_RIGHT and event.pressed:
   if drag or moving_item>=0:
    drag=false;moving_item=-1;queue_redraw();message.emit("Toiming katkestatud.")
   else:
    var result:=Edit.erase_at(plan,plan_position(event.position))
    if result.has("design"):commit_plan(result.design)
    else:message.emit(result.error)
   accept_event();return
  if event.button_index==MOUSE_BUTTON_MIDDLE or (event.button_index==MOUSE_BUTTON_LEFT and (panning or Input.is_key_pressed(KEY_SPACE))):
   if event.pressed:begin_pan(event.position)
   else:panning=false
   accept_event();return
 if event is InputEventMouseMotion and panning:
  var base:=minf(size.x/960.0,size.y/625.0)
  if base>0:view_offset=pan_origin+(event.position-pan_start)/base;clamp_view();queue_redraw()
  accept_event();return
 if event is InputEventMouseButton and event.button_index==MOUSE_BUTTON_LEFT:
  var p:=plan_position(event.position)
  if event.pressed:
   if tool=="move":
    moving_item=Edit.item_at(plan,p)
    if moving_item>=0:move_offset=Plan.point(plan.items[moving_item].point)-p
    elif view_scale>1:begin_pan(event.position)
    else:message.emit("Haara eseme liigutamiseks sellest kinni.")
   elif tool=="erase":
    var result:=Edit.erase_at(plan,p)
    if result.has("design"):commit_plan(result.design)
    else:message.emit(result.error)
   elif tool=="paintWall":
    var result:=Edit.paint_wall(plan,p,wall_brush)
    if result.has("design"):commit_plan(result.design)
    else:message.emit(result.error)
   elif tool=="item":
    var result:=Edit.place_item(plan,item_type,p,snap_on)
    if result.has("design"):commit_plan(result.design)
    else:message.emit(result.error)
   elif tool in ["door","window"]:
    var result:=Edit.change_opening(plan,p,tool,style)
    if result.has("design"):commit_plan(result.design)
    else:message.emit(result.error)
   elif tool in ["rect","round","line","partition","yard","plot","rail","palisadeLine","stoneLine","highStone","rampart","gateLine","pier"]:
    drag=true;drag_start=Edit.snap(plan,tool,p,snap_on);drag_end=drag_start;queue_redraw()
  elif moving_item>=0:
   var result:=Edit.move_item(plan,moving_item,p+move_offset,snap_on);moving_item=-1
   if result.has("design"):commit_plan(result.design)
   else:message.emit(result.error)
  elif drag:
   drag=false;drag_end=Edit.snap(plan,tool,p,snap_on)
   var result:=Edit.add_shape(plan,tool,drag_start,drag_end,era)
   if result.has("design"):commit_plan(result.design)
   else:message.emit(result.error)
   queue_redraw()
  accept_event()
 elif event is InputEventMouseMotion and drag:
  drag_end=Edit.snap(plan,tool,plan_position(event.position),snap_on);queue_redraw();accept_event()

const FLOOR_KEYS=["rooms","inner","openings","items","fences","wallRuns","wallFinishes","wallStyle","wallScale","roofForm","roofMat","roofHeight","build","base","columns","porch","gallery","stairs","bronzePrestige"]

func current_plan() -> Dictionary:
 if active_floor==0 or not design.has("upper"):return design
 var result:Dictionary=design.duplicate(true);result.erase("upper")
 for key in FLOOR_KEYS:
  if key in ["rooms","inner","openings","items","fences","wallRuns","wallFinishes"]:result[key]=[]
 result.plot=null;result.yard=null;result.pier=null;result.openSite=false;result.upperLevel=true
 result.merge(design.upper.duplicate(true),true);return result

func commit_plan(plan: Dictionary) -> void:
 if active_floor==0:apply_design(plan);return
 var next:Dictionary=design.duplicate(true);var upper:Dictionary={}
 for key in FLOOR_KEYS:
  if plan.has(key):upper[key]=plan[key]
 next.upper=upper;apply_design(next)

func select_floor(index: int) -> void:
 if index==1 and not design.has("upper"):return
 active_floor=index;drag=false;moving_item=-1;queue_redraw()

func add_floor() -> bool:
 if design.has("upper") or design.get("openSite",false) or design.get("build","")=="tower" or design.get("rooms",[]).is_empty():return false
 var next:Dictionary=design.duplicate(true)
 next.upper={"rooms":[],"inner":[],"openings":[],"items":[],"fences":[],"wallRuns":[],"wallFinishes":[],"wallStyle":design.get("wallStyle","wood"),"wallScale":design.get("wallScale",100),"roofForm":"gable" if design.get("roofForm","")=="battlement" else design.get("roofForm","gable"),"roofMat":design.get("roofMat","reed"),"roofHeight":design.get("roofHeight",75),"build":"wall","base":"none","columns":design.get("columns","post"),"porch":"none"}
 apply_design(next);active_floor=1;queue_redraw();return true

func copy_floor_walls() -> void:
 if active_floor!=1 or not design.has("upper") or not design.upper.get("rooms",[]).is_empty():return
 var next:Dictionary=design.duplicate(true)
 for key in ["rooms","wallRuns","inner"]:next.upper[key]=design.get(key,[]).duplicate(true)
 apply_design(next)

func remove_floor() -> void:
 if active_floor!=1 or not design.has("upper"):return
 var next:Dictionary=design.duplicate(true);next.erase("upper");active_floor=0;apply_design(next)
