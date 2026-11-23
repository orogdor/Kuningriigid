extends RefCounted
# Plan calculations translated from the original V355 house builder. Coordinates
# remain in the original 960x625 plan space (73 px per metre).
const PX_PER_M:=73.0

static func point(p: Dictionary) -> Vector2:
 return Vector2(float(p.get("x",0)),float(p.get("y",0)))

static func room_polygon(room: Dictionary) -> PackedVector2Array:
 var a:=point(room.get("a",{}));var result:=PackedVector2Array()
 match str(room.get("type","")):
  "rect":
   var b:=point(room.get("b",{}));result=PackedVector2Array([a,Vector2(b.x,a.y),b,Vector2(a.x,b.y)])
  "round":
   var radius:=float(room.get("r",0))
   for i in 32:result.append(a+Vector2(cos(TAU*i/32.0),sin(TAU*i/32.0))*radius)
  _:
   for p in room.get("points",[]):result.append(point(p))
 return result

static func edges(poly: PackedVector2Array) -> Array:
 var result:=[]
 for i in poly.size():result.append({"a":poly[i],"b":poly[(i+1)%poly.size()]})
 return result

static func closest(p: Vector2,a: Vector2,b: Vector2) -> Vector2:
 var d:=b-a;var t:float=clampf((p-a).dot(d)/(d.length_squared() if d.length_squared()!=0 else 1.0),0,1)
 return a.lerp(b,t)

static func inside(p: Vector2,poly: PackedVector2Array) -> bool:
 var result:=false
 for edge in edges(poly):
  var a:Vector2=edge.a;var b:Vector2=edge.b
  if (a.y>p.y)!=(b.y>p.y) and p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x:result=not result
 return result

static func crosses(a: Vector2,b: Vector2,c: Vector2,d: Vector2) -> Array:
 var u:=b-a;var v:=d-c;var denominator:=u.cross(v)
 if absf(denominator)<0.0000001:return []
 var t:float=(c-a).cross(v)/denominator;var k:float=(c-a).cross(u)/denominator
 return [t] if t>0.000001 and t<0.999999 and k>=-0.000001 and k<=1.000001 else []

static func perimeter(polygons: Array) -> Array:
 var result:=[]
 for index in polygons.size():
  var polygon:PackedVector2Array=polygons[index]
  for edge in edges(polygon):
   var a:Vector2=edge.a;var b:Vector2=edge.b;var length:=a.distance_to(b)
   if length<0.01:continue
   var normal:=Vector2(b.y-a.y,a.x-b.x)/length*0.35;var stops:Array=[0.0,1.0]
   for j in polygons.size():
    if j==index:continue
    for side in edges(polygons[j]):
     stops.append_array(crosses(a,b,side.a,side.b))
     for p in [side.a,side.b]:
      if closest(p,a,b).distance_to(p)<0.01:stops.append(a.distance_to(p)/length)
   stops.sort()
   for i in range(1,stops.size()):
    if stops[i]-stops[i-1]<0.00001:continue
    var mid:=a.lerp(b,(stops[i-1]+stops[i])/2);var left:=mid+normal;var right:=mid-normal;var duplicate:=false
    for j in index:
     if inside(left,polygons[j])!=inside(right,polygons[j]):duplicate=true;break
    if duplicate:continue
    var fill_left:=false;var fill_right:=false
    for other in polygons:
     fill_left=fill_left or inside(left,other);fill_right=fill_right or inside(right,other)
    if fill_left!=fill_right:result.append({"a":a.lerp(b,stops[i-1]),"b":a.lerp(b,stops[i])})
 return result

static func plan_geometry(design: Dictionary) -> Dictionary:
 var floors:=[]
 for room in design.get("rooms",[]):floors.append(room_polygon(room))
 var walls:=perimeter(floors)
 for run in design.get("wallRuns",[]):
  if shelter_shape(run):
   var poly:=PackedVector2Array()
   for p in run:poly.append(point(p))
   floors.append(poly)
 var curved:=[]
 for room in design.get("rooms",[]):
  if room.get("type","")=="round":curved.append_array(edges(room_polygon(room)))
 for wall in walls:
  wall.group="outer";wall.curved=false
  for side in curved:
   if closest(wall.a,side.a,side.b).distance_to(wall.a)<0.01 and closest(wall.b,side.a,side.b).distance_to(wall.b)<0.01:wall.curved=true;break
 for run in design.get("wallRuns",[]):
  for i in range(1,run.size()):walls.append({"a":point(run[i-1]),"b":point(run[i]),"group":"outer"})
 for wall in design.get("inner",[]):walls.append({"a":point(wall.a),"b":point(wall.b),"group":"inner"})
 return {"floors":floors,"walls":walls}

static func nearest_wall(p: Vector2,walls: Array,limit:=19.0) -> Dictionary:
 var best:Dictionary={}
 for wall in walls:
  var q:=closest(p,wall.a,wall.b);var distance:=p.distance_to(q)
  if distance<limit and (best.is_empty() or distance<float(best.distance)):best={"edge":wall,"point":q,"distance":distance}
 return best

static func dict_point(p: Vector2) -> Dictionary:
 return {"x":p.x,"y":p.y}

static func grid(p: Vector2,snap:=true,pier:=false) -> Vector2:
 var step:=10.0 if snap else 1.0
 return Vector2(clampf(floor(p.x/step+0.5)*step,30,930),clampf(floor(p.y/step+0.5)*step,40,610 if pier else 580))

static func pier_outline(pier: Variant) -> PackedVector2Array:
 if not pier is Dictionary:return PackedVector2Array()
 var a:=point(pier.a);var b:=point(pier.b);var length:=a.distance_to(b)
 if length<=0:return PackedVector2Array()
 var half:=float(pier.get("halfWidth",17));var side:=Vector2((b.y-a.y)*half/length,(a.x-b.x)*half/length)
 return PackedVector2Array([a+side,b+side,b-side,a-side])

static func candidate(tool: String,start: Vector2,end: Vector2,limit_metres: float) -> Dictionary:
 if tool in ["yard","plot"]:
  return {"type":"rect","a":dict_point(start),"b":dict_point(end)} if absf(start.x-end.x)>=65 and absf(start.y-end.y)>=65 else {}
 var limit:=limit_metres*PX_PER_M;var delta:=end-start
 if tool=="rect":end=start+Vector2(clampf(delta.x,-limit,limit),clampf(delta.y,-limit,limit))
 elif tool=="line" and delta.length()>limit:end=(start+delta.normalized()*limit).round()
 if tool=="rect":return {"type":"rect","a":dict_point(start),"b":dict_point(end)} if absf(start.x-end.x)>=35 and absf(start.y-end.y)>=35 else {}
 if tool=="round":
  var radius:=minf(start.distance_to(end),minf(start.x-12,minf(960-start.x-12,minf(start.y-12,minf(625-start.y-12,limit/2)))))
  return {"type":"round","a":dict_point(start),"r":radius} if radius>=25 else {}
 return {"a":dict_point(start),"b":dict_point(end)} if start.distance_to(end)>=12 else {}

static func opening_hit(design: Dictionary,p: Vector2,type: String) -> Dictionary:
 var walls:=[]
 for wall in plan_geometry(design).walls:
  if type=="door" or wall.group=="outer":walls.append(wall)
 var hit:=nearest_wall(p,walls,20.0)
 if hit.is_empty():return {}
 var edge:Dictionary=hit.edge;var length:float=edge.a.distance_to(edge.b)
 if length<=0:return {}
 var size:=minf(42.0 if type=="door" else 30.0,length*0.72)
 var t:float=edge.a.distance_to(hit.point)/length;var padding:float=(size/2.0+4.0)/length
 if not edge.get("curved",false):hit.point=edge.a.lerp(edge.b,clampf(t,padding,1.0-padding))
 return hit

static func apply_opening(design: Dictionary,p: Vector2,type: String,style: String) -> Dictionary:
 var hit:=opening_hit(design,p,type)
 if hit.is_empty():return {}
 var output:=design.duplicate(true);var openings:Array=output.get("openings",[]);var overlap:=-1
 for i in openings.size():
  if openings[i].get("group","")==hit.edge.group and point(openings[i].point).distance_to(hit.point)<29:overlap=i;break
 if overlap>=0 and openings[overlap].get("type","")==type:
  if openings[overlap].get("style","")!=style:openings[overlap].style=style
  else:openings.remove_at(overlap)
 else:
  if overlap>=0:openings.remove_at(overlap)
  openings.append({"type":type,"group":hit.edge.group,"point":dict_point(hit.point),"style":style})
 output.openings=openings;return output

static func shelter_shape(run: Array) -> bool:
 if run.size()!=4:return false
 var a:=point(run[0]);var b:=point(run[1]);var c:=point(run[2]);var d:=point(run[3])
 var x:=b-a;var y:=c-b;var z:=d-c;var left:=x.length();var back:=y.length();var right:=z.length()
 return minf(left,minf(back,right))>=35 and minf(left,right)/maxf(left,right)>0.68 and absf(x.dot(y)/(left*back))<0.20 and absf(z.dot(y)/(right*back))<0.20 and x.dot(z)/(left*right)<-0.92

static func opening_width(opening: Dictionary,edge: Dictionary) -> float:
 var widths:Dictionary={"hide":40.0,"wattle":40.0,"plank":42.0,"double":64.0,"arched":46.0,"mycenaean":44.0,"greek":42.0,"hole":24.0,"shutter":30.0,"slit":12.0,"lattice":34.0,"archwin":34.0}
 var fallback:=42.0 if opening.get("type","")=="door" else 30.0
 return minf(float(widths.get(opening.get("style",""),fallback)),edge.a.distance_to(edge.b)*0.72)

static func split_wall(edge: Dictionary,design: Dictionary) -> Array:
 var a:Vector2=edge.a;var b:Vector2=edge.b;var direction:=b-a;var length:=direction.length()
 if length<0.000001:return []
 var cuts:=[];var finishes:=[];var stops:Array=[0.0,1.0]
 for opening in design.get("openings",[]):
  if opening.get("group","")!=edge.group:continue
  var p:=point(opening.point);var d:=closest(p,a,b).distance_to(p);var curved:bool=edge.get("curved",false)
  var half:=35.0 if curved and opening.type=="door" else 21.0 if opening.type=="door" else 15.0
  if d>(half if curved else 2.0):continue
  var projection:float=(p-a).dot(direction)/(length*length)
  var reach:float=(sqrt(maxf(0,half*half-d*d*(1.0 if d<2 else 0.25))) if curved else opening_width(opening,edge)/2)/length
  var cut:Dictionary={"from":clampf(projection-reach,0,1),"to":clampf(projection+reach,0,1),"opening":opening,"curved":curved}
  cuts.append(cut);stops.append(cut.from);stops.append(cut.to)
 for choice in design.get("wallFinishes",[]):
  if choice.get("group","")!=edge.group:continue
  var p:=point(choice.a);var q:=point(choice.b)
  if absf(direction.cross(p-a))/length>0.08 or absf(direction.cross(q-a))/length>0.08:continue
  var t1:float=(p-a).dot(direction)/(length*length);var t2:float=(q-a).dot(direction)/(length*length)
  var cut:Dictionary={"from":clampf(minf(t1,t2),0,1),"to":clampf(maxf(t1,t2),0,1),"finish":choice.finish}
  if cut.to-cut.from>0.000001:finishes.append(cut);stops.append(cut.from);stops.append(cut.to)
 stops.sort();var result:=[]
 for i in range(1,stops.size()):
  var start:float=stops[i-1];var end:float=stops[i]
  if end-start<0.0001:continue
  var middle:float=(start+end)/2;var item:Dictionary={"a":a.lerp(b,start),"b":a.lerp(b,end),"group":edge.group,"finish":design.get("wallStyle","") if edge.group=="outer" else "weave"}
  for cut in cuts:
   if cut.from<=middle and cut.to>=middle:item.type=cut.opening.type;item.opening=cut.opening;item.curved=cut.curved;break
  for finish in finishes:
   if finish.from<=middle and finish.to>=middle and not str(finish.finish).is_empty():item.finish=finish.finish
  result.append(item)
 return result
