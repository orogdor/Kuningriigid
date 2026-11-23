extends RefCounted
const Plan=preload("res://scripts/house_plan_geometry.gd")
const Catalog=preload("res://data/house_editor_catalog.json")

# Gatehouse props are structural gates rather than furniture models in V355.
static func item_gates(design:Dictionary)->Array:
 var edges:=[];var result:=[]
 for room in design.get("rooms",[]):edges.append_array(Plan.edges(Plan.room_polygon(room)))
 for item in design.get("items",[]):
  var type:=str(item.get("type",""))
  if type not in ["lionGate","archGate"]:continue
  var p:=Plan.point(item.point);var range_:float=float(Catalog.data.itemSizes[type][0])/2;var left:=-INF;var right:=INF
  for edge in edges:
   var a:Vector2=edge.a;var b:Vector2=edge.b
   if absf(b.y-a.y)<0.01:continue
   var t:float=(p.y-a.y)/(b.y-a.y)
   if t<0 or t>1:continue
   var x:=a.x+(b.x-a.x)*t
   if x<p.x and p.x-x<range_*1.7:left=maxf(left,x)
   if x>p.x and x-p.x<range_*1.7:right=minf(right,x)
  var a:=Vector2(left if is_finite(left) else p.x-range_,p.y);var b:=Vector2(right if is_finite(right) else p.x+range_,p.y)
  result.append({"kind":"gateLine","a":Plan.dict_point(a),"b":Plan.dict_point(b),"gateType":"lintel" if type=="lionGate" else "arch","fromItem":true,"open":not bool(design.get("gatesClosed",false))})
 return result
static func subtract(segment: Dictionary,lo: float,hi: float) -> Array:
 var a: Vector2=Plan.point(segment.a);var b: Vector2=Plan.point(segment.b);lo=clampf(lo,0,1);hi=clampf(hi,0,1)
 if hi-lo<0.00001:return [segment]
 var out:=[]
 if lo>0.00001:
  var first: Dictionary=segment.duplicate(true);first.b=Plan.dict_point(a.lerp(b,lo));out.append(first)
 if hi<0.99999:
  var last: Dictionary=segment.duplicate(true);last.a=Plan.dict_point(a.lerp(b,hi));out.append(last)
 return out
static func cut(wall: Dictionary,gate: Dictionary) -> Array:
 var a: Vector2=Plan.point(wall.a);var b: Vector2=Plan.point(wall.b);var c: Vector2=Plan.point(gate.a);var d: Vector2=Plan.point(gate.b)
 var axis:=b-a;var length:=axis.length();var span:=c.distance_to(d)
 if length<1 or span<1:return [wall]
 var unit:=axis/length;var normal:=Vector2(-unit.y,unit.x)
 if absf((d-c).dot(normal))>span*0.22 or absf(((c+d)/2-a).dot(normal))>9:return [wall]
 var t0:=(c-a).dot(unit)/length;var t1:=(d-a).dot(unit)/length
 return subtract(wall,minf(t0,t1),maxf(t0,t1))
static func tower_positions(design: Dictionary) -> Array:
 var walls:=[]
 for wall in design.get("fences",[]):
  if wall.get("kind","") in ["palisadeLine","stoneLine","highStone","rampart"]:walls.append({"a":Plan.point(wall.a),"b":Plan.point(wall.b),"source":wall})
 var out:=[]
 for item in design.get("items",[]):
  if item.get("type","")!="tower":continue
  var point:=Plan.point(item.point);var hit:=Plan.nearest_wall(point,walls,44);var angle:=0.0
  if not hit.is_empty():
   var direction:Vector2=hit.edge.b-hit.edge.a;var heading:=atan2(direction.y,direction.x)
   angle=fposmod(fposmod(heading+PI/2,PI)+PI,PI)-PI/2
  out.append({"point":point,"angle":angle,"attached":not hit.is_empty()})
 return out

static func clip_towers(fence: Dictionary,towers: Array) -> Array:
 if fence.get("kind","") not in ["palisadeLine","stoneLine","highStone","rampart"]:return [fence]
 var parts: Array=[fence]
 for tower in towers:
  if not tower.attached:continue
  var next:=[];var c:=cos(float(tower.angle));var sn:=sin(float(tower.angle))
  for part in parts:
   var a:Vector2=Plan.point(part.a)-tower.point;var b:Vector2=Plan.point(part.b)-tower.point
   var start:=Vector2(c*a.x+sn*a.y,-sn*a.x+c*a.y);var finish:=Vector2(c*b.x+sn*b.y,-sn*b.x+c*b.y);var lo:=0.0;var hi:=1.0;var outside:=false
   for axis in 2:
    var extent:float=(0.87 if axis==0 else 0.78)*Plan.PX_PER_M;var delta:=finish[axis]-start[axis]
    if absf(delta)<0.00001:
     if absf(start[axis])>extent:outside=true;break
     continue
    var u:=(-extent-start[axis])/delta;var v:=(extent-start[axis])/delta
    lo=maxf(lo,minf(u,v));hi=minf(hi,maxf(u,v))
   if outside:next.append(part)
   else:next.append_array(subtract(part,lo,hi))
  parts=next
 return parts

static func layout(design: Dictionary) -> Array:
 var walls:=[];var gates:=item_gates(design)
 for fence in design.get("fences",[]):
  if Plan.point(fence.a).distance_to(Plan.point(fence.b))<=1:continue
  if fence.kind=="gateLine":gates.append(fence.duplicate(true))
  else:walls.append(fence.duplicate(true))
 for gate in gates:
  if not gate.has("gateType"):
   var high:=false;var timber:=false
   for wall in walls:
    for p in [Plan.point(gate.a),Plan.point(gate.b)]:
     if p.distance_to(Plan.closest(p,Plan.point(wall.a),Plan.point(wall.b)))>=10:continue
     if wall.kind=="highStone":high=true
     if wall.kind in ["palisadeLine","highStone","rampart"]:timber=true
   gate.gateType="lintel" if high else "timber" if timber else "rail"
  gate.open=gate.get("open",true)
 var trimmed:=[];var towers:=tower_positions(design)
 for wall in walls:
  var parts: Array=[wall]
  for gate in gates:
   var next:=[]
   for part in parts:next.append_array(cut(part,gate))
   parts=next
  for old in trimmed:
   if old.kind!=wall.kind:continue
   var a: Vector2=Plan.point(old.a);var b: Vector2=Plan.point(old.b);var axis: Vector2=(b-a).normalized();var normal:=Vector2(-axis.y,axis.x);var next:=[]
   for part in parts:
    if absf((Plan.point(part.a)-a).dot(normal))<0.4 and absf((Plan.point(part.b)-a).dot(normal))<0.4:next.append_array(cut(part,old))
    else:next.append(part)
   parts=next
  for part in parts:trimmed.append_array(clip_towers(part,towers))
 trimmed.append_array(gates);return trimmed
static func gate_profile(gate: Dictionary) -> Dictionary:
 var a:=Plan.point(gate.a);var b:=Plan.point(gate.b);var length:=a.distance_to(b);var size:=length/Plan.PX_PER_M;var type:=str(gate.get("gateType","rail"));var stone:=type in ["lintel","arch"];var field:=type=="rail"
 var jamb:=minf(0.39 if stone else 0.081 if field else 0.106,maxf(0.07,(size-0.61)*0.5));var leaf:=(size-2*jamb)/2
 var direction: Vector2=(b-a).normalized() if length>0 else Vector2.RIGHT;var side:=Vector2(-direction.y,direction.x)
 var hinges:=[a+direction*jamb*Plan.PX_PER_M*0.83,b-direction*jamb*Plan.PX_PER_M*0.83];var tips:=[]
 for i in 2:tips.append(hinges[i]+side*leaf*Plan.PX_PER_M if gate.get("open",true) else hinges[i]+direction*leaf*Plan.PX_PER_M*(1 if i==0 else -1))
 return {"size":size,"stone":stone,"field":field,"jamb":jamb,"leaf":leaf,"height":1.89 if stone else 0.98 if field else 1.65,"hinges":hinges,"tips":tips}

# The original designer chooses a clear stair alongside the longest high wall.
# Coordinates remain in the editor plan space, including the original offsets.
static func wall_stair_plan(design: Dictionary) -> Dictionary:
 var fences:=layout(design);var enclosed:Array=[];var towers:=tower_positions(design)
 for room in design.get("rooms",[]):enclosed.append(Plan.room_polygon(room))
 var candidates:=[];var m:=Plan.PX_PER_M;var width:=0.86*m;var landing_width:=0.96*m;var outer:float=(1.34*0.5+0.94)*m;var offset:=outer-width*0.5
 for f in fences:
  if f.kind=="highStone" and Plan.point(f.a).distance_to(Plan.point(f.b))>=2.35*m:candidates.append(f)
 candidates.sort_custom(func(a,b):return Plan.point(a.a).distance_to(Plan.point(a.b))>Plan.point(b.a).distance_to(Plan.point(b.b)))
 for wall in candidates:
  var a:=Plan.point(wall.a);var b:=Plan.point(wall.b);var length:=a.distance_to(b);var unit:Vector2=(b-a)/length
  var run:float=minf(3.35*m,length-1.13*m);var end_length:float=run+landing_width*0.5;var start:float=(length-end_length-landing_width*0.5)*0.5
  var forward:=1 if unit.x>0.00001 or (absf(unit.x)<=0.00001 and unit.y>0) else -1
  for side in [forward,-forward]:
   for direction_sign in [forward,-forward]:
    var normal:Vector2=Vector2(-unit.y,unit.x)*side;var direction:Vector2=unit*direction_sign
    var at=func(d,n):return a+unit*(d if direction_sign>0 else length-d)+normal*n
    var foot:Vector2=at.call(start,offset);var end:Vector2=at.call(start+run,offset);var opening:Vector2=at.call(start+end_length,0);var landing:Vector2=at.call(start+end_length,offset)
    var mouth:Vector2=opening+normal*0.39*m;var outside:Vector2=opening+normal*outer;var blocked:=false
    for p in [foot-direction*0.78*m,foot,foot.lerp(end,0.33),foot.lerp(end,0.67),landing]:
     for floor in enclosed:
      if Plan.inside(p,floor):blocked=true;break
      for edge in Plan.edges(floor):
       if p.distance_to(Plan.closest(p,edge.a,edge.b))<width*0.49:blocked=true;break
      if blocked:break
     if blocked:break
     for tower in towers:
      if tower.point.distance_to(p)<1.10*m:blocked=true;break
     if blocked:break
     for f in fences:
      if is_same(f,wall) or f.kind=="gateLine":continue
      if p.distance_to(Plan.closest(p,Plan.point(f.a),Plan.point(f.b)))<width*0.54:blocked=true;break
     if blocked:break
    if not blocked:return {"wall":wall,"side":side,"foot":foot,"end":end,"opening":opening,"landing":landing,"mouth":mouth,"outside":outside,"direction":direction,"normal":normal,"width":width,"landingWidth":landing_width}
 return {}
