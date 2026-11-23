extends Control
const Plan=preload("res://scripts/house_plan_geometry.gd")
const Paper=preload("res://assets/house_designer/plan-paper.svg")
const Edit=preload("res://scripts/house_plan_edit.gd")
const Fence=preload("res://scripts/house_fence.gd")
const Catalog=preload("res://data/house_editor_catalog.json")
signal changed(design: Dictionary)
signal message(text: String)
var design:Dictionary={}
var show_dimensions:=true
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

func apply_design(next: Dictionary,previous_floor: int=-1) -> void:
 history.append({"design":design.duplicate(true),"floor":active_floor if previous_floor<0 else previous_floor})
 if history.size()>250:history.pop_front()
 future.clear();design=next;queue_redraw();changed.emit(design)

func undo() -> void:
 if history.is_empty():return
 future.append({"design":design.duplicate(true),"floor":active_floor});var entry:Dictionary=history.pop_back();design=entry.design;active_floor=int(entry.floor)
 if not design.has("upper"):active_floor=0
 queue_redraw();changed.emit(design)

func redo() -> void:
 if future.is_empty():return
 history.append({"design":design.duplicate(true),"floor":active_floor});var entry:Dictionary=future.pop_back();design=entry.design;active_floor=int(entry.floor)
 if not design.has("upper"):active_floor=0
 queue_redraw();changed.emit(design)

func base_scale() -> float:
 return maxf(0.001,minf(maxf(1,size.x-20)/960.0,maxf(1,size.y-30)/625.0))

func plan_transform() -> Transform2D:
 var scale_factor:=base_scale();var offset:=(size-Vector2(960,625)*scale_factor)/2
 return Transform2D(0,Vector2(scale_factor*view_scale,scale_factor*view_scale),0,offset+view_offset*scale_factor)

func clamp_view() -> void:
 view_scale=clampf(view_scale,1.0,4.0)
 view_offset.x=clampf(view_offset.x,960.0-960.0*view_scale,0.0)
 view_offset.y=clampf(view_offset.y,625.0-625.0*view_scale,0.0)

func zoom_at(screen:Vector2,factor:float) -> void:
 var base:=base_scale()
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
 draw_rect(Rect2(Vector2.ZERO,size),Color("101b26"))
 if design.is_empty():return
 var plan:=current_plan()
 draw_set_transform_matrix(plan_transform())
 draw_texture_rect(Paper,Rect2(Vector2.ZERO,Vector2(960,625)),false)
 var definition:Dictionary=Catalog.data.catalog.get(str(design.get("id","")),{})
 if view_scale>=1.8:
  for x in range(10,960,20):draw_line(Vector2(x,0),Vector2(x,625),Color("65492712"),1)
  for y in range(10,625,20):draw_line(Vector2(0,y),Vector2(960,y),Color("65492712"),1)
 for x in range(0,961,20):draw_line(Vector2(x,0),Vector2(x,625),Color("65492738" if x%100==0 else "6549271a"),1)
 for y in range(0,626,20):draw_line(Vector2(0,y),Vector2(960,y),Color("65492738" if y%100==0 else "6549271a"),1)
 if str(design.get("id",""))=="fisher" or definition.get("base","")=="fisher" or definition.get("coast",false):
  draw_rect(Rect2(0,524,960,25),Color("d8c499"))
  draw_polygon(PackedVector2Array([Vector2(0,548),Vector2(960,548),Vector2(960,625),Vector2(0,625)]),PackedColorArray([Color("5d8a84"),Color("5d8a84"),Color("3f6a68"),Color("3f6a68")]))
  for y in range(558,625,14):draw_line(Vector2(0,y),Vector2(960,y),Color("96b5a1"),1)
 for key in ["plot","yard"]:
  if plan.get(key)!=null and plan[key] is Array:
   var p:=PackedVector2Array()
   for q in plan[key]:p.append(Plan.point(q))
   if p.size()>=3:
    draw_colored_polygon(p,Color("c8a56c46"))
    for i in p.size():draw_dashed_line(p[i],p[(i+1)%p.size()],Color("83623c"),2,6)
 if plan.get("field") is Dictionary and plan.get("plot") is Array:draw_field(plan.plot,plan.field)
 if plan.get("pier") is Dictionary:
  var pier:=Plan.pier_outline(plan.pier)
  if pier.size()>=3:draw_colored_polygon(pier,Color("ad8962"));draw_polyline(PackedVector2Array(Array(pier)+[pier[0]]),Color("654b32"),2)
 var geometry:=Plan.plan_geometry(plan)
 for floor in geometry.floors:
  if floor.size()>=3:draw_colored_polygon(floor,Color("bb8d546b"));draw_polyline(PackedVector2Array(Array(floor)+[floor[0]]),Color("694729"),2)
 for fence in Fence.layout(plan):draw_plan_fence(fence)
 for wall in geometry.walls:
  for span in Plan.split_wall(wall,plan):draw_plan_wall(span,plan)
 for item in plan.get("items",[]):draw_plan_item(item)
 if show_dimensions:draw_plan_dimensions(plan,geometry)
 if drag:
  var shape:=Plan.candidate(tool,drag_start,drag_end,Edit.LIMITS[clampi(era,0,2)])
  if not shape.is_empty() and shape.has("type"):
   var poly:=Plan.room_polygon(shape)
   if poly.size()>2:draw_polyline(PackedVector2Array(Array(poly)+[poly[0]]),Color("2b6540"),3)
  else:draw_line(drag_start,drag_end,Color("2b6540"),3)
  if shape.get("type","")=="rect":
   var a:=Plan.point(shape.a);var b:=Plan.point(shape.b);var dimensions:Vector2=(b-a).abs()/Plan.PX_PER_M
   draw_plan_tag("%.1f × %.1f m · %.1f m²" % [dimensions.x,dimensions.y,dimensions.x*dimensions.y],(a+b)/2)
  elif shape.get("type","")=="round":
   var radius:float=float(shape.r)/Plan.PX_PER_M;draw_plan_tag("Ø %.1f m · %.1f m²" % [radius*2,PI*radius*radius],Plan.point(shape.a))
  else:draw_plan_tag("%.1f m" % (drag_start.distance_to(drag_end)/Plan.PX_PER_M),(drag_start+drag_end)/2)
 draw_rect(Rect2(Vector2.ZERO,Vector2(960,625)),Color("8a6a38"),false,4)
 draw_set_transform_matrix(Transform2D.IDENTITY)

func draw_plan_tag(text: String,point: Vector2,angle:=0.0) -> void:
 var scale:=maxf(0.1,base_scale()*view_scale);var font:=ThemeDB.fallback_font;var font_size:=maxi(8,roundi(11.0/scale));var width:=font.get_string_size(text,HORIZONTAL_ALIGNMENT_LEFT,-1,font_size).x+10.0/scale;var height:=17.0/scale
 draw_set_transform_matrix(plan_transform()*Transform2D(angle,point))
 var rect:=Rect2(-width/2,-height/2,width,height);draw_rect(rect,Color("f7ecd2e6"));draw_rect(rect,Color("8a6633"),false,1.0/scale)
 draw_string(font,Vector2(-width/2+5.0/scale,height*0.26),text,HORIZONTAL_ALIGNMENT_LEFT,-1,font_size,Color("3b2713"))
 draw_set_transform_matrix(plan_transform())

func draw_plan_dimensions(plan: Dictionary,geometry: Dictionary) -> void:
 var scale:=maxf(0.1,base_scale()*view_scale)
 for wall in geometry.walls:
  if wall.get("curved",false):continue
  var a:Vector2=wall.a;var b:Vector2=wall.b;var length:=a.distance_to(b)
  if length*scale<46:continue
  var normal:=Vector2(a.y-b.y,b.x-a.x)/length;var outer:bool=wall.group=="outer";var middle:Vector2=(a+b)/2;var position:Vector2=middle+normal*(17.0 if outer else 12.0)/scale
  if outer and Edit.in_floor(position,geometry.floors):position=middle-normal*17.0/scale
  var angle:=atan2(b.y-a.y,b.x-a.x)
  if angle>PI/2:angle-=PI
  if angle< -PI/2:angle+=PI
  draw_plan_tag("%.1f m" % (length/Plan.PX_PER_M),position,angle)
 for fence in Fence.layout(plan):
  if fence.get("kind","")=="gateLine":continue
  var a:=Plan.point(fence.a);var b:=Plan.point(fence.b);var length:=a.distance_to(b)
  if length*scale<60:continue
  var normal:=Vector2(a.y-b.y,b.x-a.x)/length;var angle:=atan2(b.y-a.y,b.x-a.x)
  if angle>PI/2:angle-=PI
  if angle< -PI/2:angle+=PI
  draw_plan_tag("%.1f m" % (length/Plan.PX_PER_M),(a+b)/2+normal*15/scale,angle)
 for room in plan.get("rooms",[]):
  if room.get("type","")=="round":
   var center:=Plan.point(room.a);var radius:=float(room.r)
   draw_plan_tag("Ø %.1f m" % (radius*2/Plan.PX_PER_M),center-Vector2(0,radius+20/scale))

func draw_plan_fence(fence: Dictionary) -> void:
 var a:=Plan.point(fence.a);var b:=Plan.point(fence.b);var kind:=str(fence.get("kind","rail"))
 if kind=="highStone":
  draw_line(a,b,Color("4f5046"),16);draw_line(a,b,Color("a9a594"),11)
  var count:=floori(a.distance_to(b)/16)
  for i in range(0,count,2):draw_line(a.lerp(b,(float(i)+0.5)/maxi(1,count)),a.lerp(b,minf(1.0,(float(i)+1.5)/maxi(1,count))),Color("77786a"),6)
  return
 if kind=="gateLine":
  draw_dashed_line(a,b,Color("a17c45"),5,7)
  var profile:=Fence.gate_profile(fence)
  for i in 2:
   var hinge:Vector2=profile.hinges[i];var tip:Vector2=profile.tips[i]
   draw_circle(hinge,8 if profile.stone else 5,Color("8f8273" if profile.stone else "68492e"));draw_line(hinge,tip,Color("805a34" if fence.get("open",true) else "9c3d27"),3.2)
  return
 draw_line(a,b,Color("626459" if kind=="stoneLine" else "61462d"),10 if kind=="palisadeLine" else 5)

func draw_plan_item(item: Dictionary) -> void:
 var type:=str(item.get("type",""));var p:=Plan.point(item.point);var dims:Array=Catalog.data.itemSizes.get(type,[20,20]);var bounds:=Rect2(p-Vector2(float(dims[0]),float(dims[1]))/2,Vector2(float(dims[0]),float(dims[1])))
 var radius:=minf(bounds.size.x,bounds.size.y)/2
 if type=="post":draw_circle(p,9,Color("5d3f25"));draw_circle(p,6,Color("9b7046"));return
 if type=="column":draw_circle(p,15,Color("6d6858"));draw_circle(p,12,Color("d6cdb5"));draw_circle(p,7,Color("b3ab95"));return
 if type=="pillar":
  var pillar:=Rect2(p-Vector2(14,14),Vector2(28,28));draw_rect(pillar,Color("b25a3e"));draw_rect(pillar,Color("5e2a1c"),false,2);draw_line(p+Vector2(-14,0),p+Vector2(14,0),Color("5e2a1c"),1);return
 if type=="fruitTree":
  draw_circle(p,radius,Color("6f8a4a"));draw_circle(p-Vector2.ONE*radius*0.3,radius*0.45,Color("8aa35c"));draw_circle(p+Vector2(radius*0.35,radius*0.2),5,Color("c4472f"));draw_circle(p+Vector2(-radius*0.4,radius*0.35),5,Color("c4472f"));return
 if type=="saplings":
  for i in 6:draw_circle(p+Vector2(-bounds.size.x*0.38+(i%3)*bounds.size.x*0.38,-bounds.size.y*0.22+floori(float(i)/3)*bounds.size.y*0.44),8,Color("6f8a4a"))
  return
 if type in ["hay","coalPile","quern","millstone","barrel"]:
  var tones={"hay":["c9a64f","e1c46e"],"coalPile":["3a3029","57473a"],"quern":["7a7868","b7b29f"],"millstone":["7a7868","b7b29f"],"barrel":["7a5432","a57a4c"]};var pair:Array=tones[type]
  draw_circle(p,radius,Color(pair[0]));draw_circle(p,radius*(0.82 if type in ["quern","millstone"] else 0.7 if type=="barrel" else 0.55),Color(pair[1]))
  if type in ["quern","millstone"]:draw_circle(p,radius*0.18,Color("6a6656"))
  return
 if type=="stoneTower":
  draw_rect(bounds,Color("a9a594"));draw_rect(bounds,Color("4f5046"),false,4);var inner:=Rect2(p-bounds.size*0.32,bounds.size*0.64);draw_rect(inner,Color("8d8a7b"));draw_rect(inner,Color("4f5046"),false,2);return
 if type in ["workShelter","stockShelter","longShelter","sideShelter","sideStockShelter","canopy","woodshed"]:
  draw_rect(bounds,Color("c7a46a99"));draw_rect(bounds,Color("7a5a32"),false,2)
  if type in ["sideShelter","sideStockShelter"]:
   var y:=bounds.position.y+8
   while y<bounds.end.y:draw_line(Vector2(bounds.position.x+2,y),Vector2(bounds.end.x-2,y),Color("9c7a46"),1.2);y+=14
  else:
   var x:=bounds.position.x+8
   while x<bounds.end.x:draw_line(Vector2(x,bounds.position.y+2),Vector2(x,bounds.end.y-2),Color("9c7a46"),1.2);x+=14
  for sign_x in [-1,1]:
   for sign_y in ([-1,1] if type in ["workShelter","stockShelter","longShelter","sideShelter","sideStockShelter"] else [1]):draw_circle(p+Vector2(sign_x*(bounds.size.x/2-6),sign_y*(bounds.size.y/2-6)),5,Color("5d3f25"))
  return
 if type=="fire":
  var ring:=PackedVector2Array()
  for i in 12:ring.append(p+Vector2(cos(TAU*i/12)*23,sin(TAU*i/12)*19))
  draw_colored_polygon(ring,Color("534c42"));draw_polyline(PackedVector2Array(Array(ring)+[ring[0]]),Color("a79a7b"),3)
  draw_colored_polygon(PackedVector2Array([p+Vector2(-9,8),p+Vector2(-3,-7),p+Vector2(2,-13),p+Vector2(8,7)]),Color("ef9350"));return
 if type=="basket":
  var basket:=PackedVector2Array()
  for i in 16:basket.append(p+Vector2(cos(TAU*i/16)*12,sin(TAU*i/16)*10))
  draw_colored_polygon(basket,Color("966536"));draw_polyline(PackedVector2Array(Array(basket)+[basket[0]]),Color("543d2b"),3);draw_line(p+Vector2(-8,0),p+Vector2(8,0),Color("d7ad67"),2);return
 if type in ["bed","bench"]:
  draw_rect(bounds,Color("a78560" if type=="bed" else "93633d"));draw_rect(bounds,Color("62472f"),false,3)
  if type=="bed":draw_rect(Rect2(bounds.position+Vector2(5,4),Vector2(13,maxf(0,bounds.size.y-8))),Color("dbc6a3"))
  return
 draw_rect(bounds,Color("bd9d6c"));draw_rect(bounds,Color("705736"),false,2)
 var info:Array=Catalog.data.items.get(type,[type,20,20,"•"]);var symbol:=str(info[3]) if info.size()>3 else "•"
 draw_string(ThemeDB.fallback_font,Vector2(bounds.position.x,p.y+5),symbol,HORIZONTAL_ALIGNMENT_CENTER,bounds.size.x,17,Color("44311f"))

func draw_plan_wall(span: Dictionary,plan: Dictionary) -> void:
 var a:Vector2=span.a;var b:Vector2=span.b;var kind:=str(span.get("type",""));var outer:bool=span.group=="outer"
 if kind=="door":draw_line(a,b,Color("eacb83"),3);return
 if kind=="window":draw_line(a,b,Color("774d29"),9);draw_line(a,b,Color("e5bf75"),4);return
 var palette={"clay":["69472f","c18b54"],"weave":["523a25","a18353"],"stone":["55574c","a4a292"],"wood":["4c3023","986741"],"bamboo":["514332","9a805d"],"mudbrick":["6c4c2c","c99b63"],"cutstone":["6d6858","d3cab2"],"plank":["5a3b24","b5895a"],"brick":["6b2c1e","b8573c"],"plaster":["8a8170","efe7d3"],"halftimber":["4a3020","ece2c9"],"limestone":["8b8670","e3dcc4"],"turf":["4d4a2c","7f7c4a"],"stave":["4b3020","8f6440"],"marble":["9d988c","f1ece2"],"cyclopean":["5f5a4e","a59c86"],"reticulatum":["7f6f4f","c3b48c"],"romanbrick":["6c3420","c06a44"],"fresco":["7a2a1a","ecdcbc"],"prestigePlaster":["9b492e","eee0c3"]}
 var finish:=str(span.get("finish","stone"));var colors:Array=palette.get(finish,palette.stone)
 if outer and plan.get("build","wall")=="open":
  draw_dashed_line(a,b,Color(colors[0]),3,6)
  var count:=maxi(1,roundi(a.distance_to(b)/90));for i in range(count+1):draw_circle(a.lerp(b,float(i)/count),7,Color(colors[0]))
  return
 if finish=="stone":
  var width:=13.0 if outer else 8.0;var length:=a.distance_to(b)
  if length<1:return
  draw_line(a,b,Color("4a4a40"),width*0.75)
  var count:=maxi(1,roundi(length/(width*0.95)));var tones=["a4a292","8f8e80","b3ae9c","9a9686"]
  for i in count:
   var seed:=roundi(a.x*7+a.y*13+i*31);var n:=sin(seed*12.9898)*43758.5453;var q:=absf(fmod(n,1.0));var point:=a.lerp(b,(float(i)+0.5)/count);var radius:=width*(0.36+q*0.16)
   draw_circle(point,radius+1,Color("55574c"));draw_circle(point,radius,Color(tones[mini(3,floori(q*4))]))
  return
 draw_line(a,b,Color(colors[0]),12 if outer else 7);draw_line(a,b,Color(colors[1]),7 if outer else 4)

func draw_field(plot: Array,field: Dictionary) -> void:
 if plot.size()<3:return
 var low:=Vector2(INF,INF);var high:=Vector2(-INF,-INF)
 for point in plot:
  var p:=Plan.point(point);low=low.min(p);high=high.max(p)
 var rect:=Rect2(low,high-low);var edge:=str(field.get("edge","ridge"));var crop:=str(field.get("crop","barley"))
 var margin:=minf(40,minf(rect.size.x,rect.size.y)*0.5)
 var edge_colors={"ridge":"a98a5a","stones":"b5ad98","rail":"b39566","ditch":"7d9a8e"}
 var crop_colors={"barley":"d8b85a","wheat":"c99a3e","rye":"a3954f","beans":"6f8a4a","fallow":"9aa06a"}
 draw_rect(rect,Color(str(edge_colors.get(edge,"a98a5a"))))
 var inner:=rect.grow(-margin);draw_rect(inner,Color("b8ad7c" if crop=="fallow" else "9a6b40"))
 var y:=inner.position.y+12
 while y<inner.end.y:
  draw_line(Vector2(inner.position.x+6,y),Vector2(inner.end.x-6,y),Color(str(crop_colors.get(crop,"d8b85a"))),2 if crop=="fallow" else 7);y+=24
 if edge=="stones":
  var x:=low.x+8
  while x<high.x:draw_circle(Vector2(x,low.y+10),7,Color("8f8a78"));draw_circle(Vector2(x,high.y-10),7,Color("8f8a78"));x+=22
  y=low.y+8
  while y<high.y:draw_circle(Vector2(low.x+10,y),7,Color("8f8a78"));draw_circle(Vector2(high.x-10,y),7,Color("8f8a78"));y+=22
 else:
  var inset:=6.0 if edge=="rail" else 8.0 if edge=="ditch" else 10.0
  var color:=Color("61462d" if edge=="rail" else "4f7f7a" if edge=="ditch" else "7d6236")
  draw_rect(rect.grow(-inset),color,false,4 if edge=="rail" else 8 if edge=="ditch" else 10)
 var display_scale:=maxf(0.1,base_scale()*view_scale)
 draw_string(ThemeDB.fallback_font,Vector2(low.x,high.y+14/display_scale),"↔ Põllu suurust saab mängus muuta",HORIZONTAL_ALIGNMENT_CENTER,rect.size.x,roundi(10/display_scale),Color("5b3d1f"))

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
  var base:=base_scale()
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
 active_floor=1;apply_design(next,0);queue_redraw();return true

func copy_floor_walls() -> void:
 if active_floor!=1 or not design.has("upper") or not design.upper.get("rooms",[]).is_empty():return
 var next:Dictionary=design.duplicate(true)
 for key in ["rooms","wallRuns","inner"]:next.upper[key]=design.get(key,[]).duplicate(true)
 apply_design(next)

func remove_floor() -> void:
 if active_floor!=1 or not design.has("upper"):return
 var next:Dictionary=design.duplicate(true);next.erase("upper");active_floor=0;apply_design(next,1)

