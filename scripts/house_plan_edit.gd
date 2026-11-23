extends RefCounted
const Plan=preload("res://scripts/house_plan_geometry.gd")
const Catalog=preload("res://data/house_editor_catalog.json")
const LIMITS:=[8.5,10.5,12.3]

# The editor keeps the same dictionaries and field names as the original game.
static func snap(design: Dictionary,tool: String,p: Vector2,snap_on:=true) -> Vector2:
 if tool=="partition":
  var hit:=Plan.nearest_wall(p,Plan.plan_geometry(design).walls,16.0)
  if not hit.is_empty():return hit.point
 if tool=="line":
  var best:=p;var radius:=19.0
  for run in design.get("wallRuns",[]):
   if run.is_empty():continue
   for end in [run.front(),run.back()]:
    var q:=Plan.point(end);var d:=p.distance_to(q)
    if d<radius:best=q;radius=d
  if radius<19.0:return best
 return Plan.grid(p,snap_on,tool=="pier")

static func in_floor(p: Vector2,floors: Array) -> bool:
 for floor in floors:
  if Plan.inside(p,floor) or not Plan.nearest_wall(p,Plan.edges(floor),0.11).is_empty():return true
 return false

static func add_shape(design: Dictionary,tool: String,start: Vector2,end: Vector2,era: int) -> Dictionary:
 var shape:=Plan.candidate(tool,start,end,LIMITS[clampi(era,0,2)])
 if shape.is_empty():return {"error":"Liiga väike ala."}
 var next:=design.duplicate(true)
 var definition:Dictionary=Catalog.data.catalog.get(str(design.get("id","")),{})
 var coastal:=str(definition.get("base",design.get("id","")))=="fisher" or bool(definition.get("coast",false))
 if tool=="pier":
  if not coastal:return {"error":"Muuli saab lisada ainult rannaehitisele."}
  var a:=Plan.point(shape.a);var b:=Plan.point(shape.b)
  if a.y>b.y:var tmp:=a;a=b;b=tmp
  var current: Variant=next.get("pier");var default: Variant=definition.get("pier")
  var width:float=float(current.get("halfWidth",17)) if current is Dictionary else float(default.get("halfWidth",17)) if default is Dictionary else 17.0
  var pier={"a":Plan.dict_point(a),"b":Plan.dict_point(b),"halfWidth":width};var outline:=Plan.pier_outline(pier)
  if a.distance_to(b)>196 or outline.size()!=4 or outline[0].y>542 or outline[3].y>542 or outline[1].y<566 or outline[2].y<566:return {"error":"Muul peab algama kaldalt ja lõppema meres."}
  next.pier=pier;return {"design":next}
 if coastal:
  var points:=Plan.room_polygon(shape) if shape.has("type") else PackedVector2Array([Plan.point(shape.a),Plan.point(shape.b)])
  for p in points:
   if p.y>545:return {"error":"Ehitis ja õu peavad jääma kuivale maale."}
 if tool in ["yard","plot"]:
  var boundary:=Plan.room_polygon(shape)
  if tool=="yard":
   for floor in Plan.plan_geometry(next).floors:
    for p in floor:
     if not in_floor(p,[boundary]):return {"error":"Õu peab ümbritsema kogu hoonet."}
  for item in next.items:
   var zone:=item_zone(next,str(item.type),Plan.point(item.point))
   if (tool=="yard" and zone=="yard") or (tool=="plot" and zone=="site"):
    if not in_floor(Plan.point(item.point),[boundary]):return {"error":"Ala peab mahutama seal olevad esemed."}
  var area:=[]
  for p in boundary:area.append(Plan.dict_point(p))
  next[tool]=area;return {"design":next}
 if tool in ["rail","palisadeLine","stoneLine","highStone","rampart","gateLine"]:
  return add_fence(next,tool,Plan.point(shape.a),Plan.point(shape.b))
 if tool in ["rect","round"]:
  next.rooms.append(shape);return {"design":next}
 if tool=="line":return append_wall(next,Plan.point(shape.a),Plan.point(shape.b),era)
 if tool=="partition":
  var a:=Plan.point(shape.a);var b:=Plan.point(shape.b);var samples:=ceili(a.distance_to(b)/6.0);var floors:Array=Plan.plan_geometry(next).floors
  for i in range(samples+1):
   if not in_floor(a.lerp(b,float(i)/samples),floors):return {"error":"Sisesein peab jääma hoone põrandale."}
  next.inner.append(shape);return {"design":next}
 return {"error":"Tööriist ei ole veel üle toodud."}

static func change_opening(design: Dictionary,p: Vector2,type: String,style: String) -> Dictionary:
 var next:=Plan.apply_opening(design,p,type,style)
 return {"error":"Vali sobiv sein."} if next.is_empty() else {"design":next}

static func append_wall(design: Dictionary,a: Vector2,b: Vector2,era: int) -> Dictionary:
 var next:=design.duplicate(true);var pending:Array=next.wallRuns;var first:=-1;var last:=-1
 for i in pending.size():
  var run:Array=pending[i]
  if run.is_empty():continue
  if first<0 and (Plan.point(run.front()).distance_to(a)<0.01 or Plan.point(run.back()).distance_to(a)<0.01):first=i
  if last<0 and (Plan.point(run.front()).distance_to(b)<0.01 or Plan.point(run.back()).distance_to(b)<0.01):last=i
 if first<0 and last<0:pending.append([Plan.dict_point(a),Plan.dict_point(b)]);return {"design":next}
 if first>=0 and last==first:
  var run:Array=pending[first].duplicate(true)
  if Plan.point(run.back()).distance_to(a)>=0.01:run.reverse()
  var area:=0.0;var low:=Vector2(INF,INF);var high:=Vector2(-INF,-INF)
  for i in run.size():
   var p:=Plan.point(run[i]);var q:=Plan.point(run[(i+1)%run.size()]);area+=p.cross(q)
   low=low.min(p);high=high.max(p)
  if run.size()<3 or absf(area/2)<900:return {"error":"Hoones peab jääma rohkem ruumi."}
  if maxf(high.x-low.x,high.y-low.y)>LIMITS[clampi(era,0,2)]*Plan.PX_PER_M+1:return {"error":"Hoone ületab ajastu lubatud suuruse."}
  for i in run.size():
   for j in range(i+2,run.size()):
    if not Plan.crosses(Plan.point(run[i]),Plan.point(run[(i+1)%run.size()]),Plan.point(run[j]),Plan.point(run[(j+1)%run.size()])).is_empty():return {"error":"Välisseinad ei tohi ristuda."}
  pending.remove_at(first);next.rooms.append({"type":"free","points":run});return {"design":next}
 var left:Array=[Plan.dict_point(a)]
 if first>=0:
  left=pending[first].duplicate(true)
  if Plan.point(left.back()).distance_to(a)>=0.01:left.reverse()
 var right:Array=[Plan.dict_point(b)]
 if last>=0:
  right=pending[last].duplicate(true)
  if Plan.point(right.back()).distance_to(b)>=0.01:right.reverse()
  right.reverse()
 left.append_array(right)
 for i in range(left.size()-1):
  for j in range(i+2,left.size()-1):
   if not Plan.crosses(Plan.point(left[i]),Plan.point(left[i+1]),Plan.point(left[j]),Plan.point(left[j+1])).is_empty():return {"error":"Seinad ei tohi ristuda."}
 var kept:=[]
 for i in pending.size():
  if i!=first and i!=last:kept.append(pending[i])
 kept.append(left);next.wallRuns=kept;return {"design":next}

static func item_zone(design: Dictionary,type: String,p: Vector2) -> String:
 if not Catalog.data.itemSizes.has(type):return ""
 var id:=str(design.id);var definition:Dictionary=Catalog.data.catalog.get(id,{})
 if type=="tower" and str(definition.get("base",id))=="watchtower":return "site"
 var dims:Array=Catalog.data.itemSizes[type];var half:=Vector2(float(dims[0]),float(dims[1]))/2
 var corners:=PackedVector2Array([p-half,Vector2(p.x+half.x,p.y-half.y),p+half,Vector2(p.x-half.x,p.y+half.y)])
 var coast:=str(definition.get("base",id))=="fisher" or bool(definition.get("coast",false))
 if type=="bronzeBoat" and coast:
  for corner in corners:
   if corner.y<550:return ""
  return "water" if p.y<=643 else ""
 if coast:
  for corner in corners:
   if corner.y>545:return ""
 if type=="bed" and definition.get("kind","")!="Homes":return ""
 var geometry:=Plan.plan_geometry(design);var enclosed:=[]
 for room in design.get("rooms",[]):enclosed.append(Plan.room_polygon(room))
 var all_floor:=true
 for corner in corners:
  if not in_floor(corner,enclosed if type=="bed" else geometry.floors):all_floor=false;break
 if all_floor:return "house"
 if type=="bed":return ""
 for pair in [["plot","site"],["yard","yard"]]:
  var data:Variant=design.get(pair[0])
  if not data is Array or data.size()<3:continue
  var area:=PackedVector2Array()
  for q in data:area.append(Plan.point(q))
  var fits:=true
  for corner in corners:
   if not in_floor(corner,[area]):fits=false;break
  if not fits:continue
  if pair[1]=="site":return "site"
  for floor in geometry.floors:
   for corner in corners:
    if in_floor(corner,[floor]):return ""
   for q in floor:
    if in_floor(q,[corners]):return ""
   for a in Plan.edges(corners):
    for b in Plan.edges(floor):
     if not Plan.crosses(a.a,a.b,b.a,b.b).is_empty():return ""
  return "yard"
 return ""

static func place_item(design: Dictionary,type: String,p: Vector2,snap_on:=true) -> Dictionary:
 if not Catalog.data.itemSizes.has(type):return {"error":"Tundmatu ese."}
 var target:=Plan.grid(p,snap_on);var next:=design.duplicate(true);var items:Array=next.items
 for i in items.size():
  if Plan.point(items[i].point).distance_to(target)<15:items.remove_at(i);return {"design":next}
 if item_zone(next,type,target).is_empty():return {"error":"Ese peab mahtuma põrandale või õue."}
 items.append({"type":type,"point":Plan.dict_point(target)});return {"design":next}

static func move_item(design: Dictionary,index: int,p: Vector2,snap_on:=true) -> Dictionary:
 if index<0 or index>=design.get("items",[]).size():return {"error":"Ese puudub."}
 var next:=design.duplicate(true);var target:=Plan.grid(p,snap_on);var type:=str(next.items[index].type)
 if item_zone(next,type,target).is_empty():return {"error":"Ese peab mahtuma põrandale või õue."}
 next.items[index].point=Plan.dict_point(target);return {"design":next}

static func item_at(design: Dictionary,p: Vector2) -> int:
 var items:Array=design.get("items",[])
 for i in range(items.size()-1,-1,-1):
  var item:Dictionary=items[i];var dims:Array=Catalog.data.itemSizes.get(item.type,[0,0]);var center:=Plan.point(item.point)
  if absf(p.x-center.x)<=float(dims[0])/2+3 and absf(p.y-center.y)<=float(dims[1])/2+3:return i
 return -1

static func add_fence(design: Dictionary,kind: String,a: Vector2,b: Vector2) -> Dictionary:
 var next:=design.duplicate(true);var anchors:=[]
 for fence in next.get("fences",[]):
  if fence.kind!="gateLine":anchors.append(Plan.point(fence.a));anchors.append(Plan.point(fence.b))
 if kind in ["palisadeLine","stoneLine","highStone","rampart"]:
  for item in next.get("items",[]):
   if item.type=="tower":anchors.append(Plan.point(item.point))
 for p in anchors:
  if a.distance_to(p)<17:a=p;break
 for p in anchors:
  if b.distance_to(p)<17:b=p;break
 if a.distance_to(b)<=11:return {"error":"Sein või piirdeaed on liiga lühike."}
 next.fences.append({"a":Plan.dict_point(a),"b":Plan.dict_point(b),"kind":kind});return {"design":next}

static func erase_at(design: Dictionary,p: Vector2) -> Dictionary:
 var geometry:=Plan.plan_geometry(design);var next:=design.duplicate(true);var key:="";var index:=-1;var side:=-1
 var spans:=[]
 for wall in geometry.walls:
  for span in Plan.split_wall(wall,design):
   if span.has("opening"):spans.append(span)
 var aperture:=Plan.nearest_wall(p,spans,10)
 if not aperture.is_empty():
  key="openings";index=design.openings.find(aperture.edge.opening)
 if key.is_empty():
  index=item_at(design,p)
  if index>=0:key="items"
 if key.is_empty():
  var hit:=Plan.nearest_wall(p,geometry.walls,13)
  if not hit.is_empty():
   var wall:Dictionary=hit.edge
   if wall.group=="inner":
    for i in design.inner.size():
     if owns_span(wall,Plan.point(design.inner[i].a),Plan.point(design.inner[i].b)):key="inner";index=i;break
   else:
    for i in design.rooms.size():
     var edges:=Plan.edges(Plan.room_polygon(design.rooms[i]))
     for j in edges.size():
      if owns_span(wall,edges[j].a,edges[j].b):key="rooms";index=i;side=-1 if design.rooms[i].type=="round" else j;break
     if not key.is_empty():break
    if key.is_empty():
     for i in design.wallRuns.size():
      var run:Array=design.wallRuns[i]
      for j in range(run.size()-1):
       if owns_span(wall,Plan.point(run[j]),Plan.point(run[j+1])):key="wallRuns";index=i;side=j;break
      if not key.is_empty():break
 if key.is_empty():
  var gates:=[];var all:=[]
  for fence in design.get("fences",[]):
   var edge:Dictionary={"a":Plan.point(fence.a),"b":Plan.point(fence.b),"source":fence}
   all.append(edge)
   if fence.kind=="gateLine":gates.append(edge)
  var hit:=Plan.nearest_wall(p,gates,13)
  if hit.is_empty():hit=Plan.nearest_wall(p,all,13)
  if not hit.is_empty():key="fences";index=design.fences.find(hit.edge.source)
 if key.is_empty() and design.get("pier") is Dictionary:
  var outline:=Plan.pier_outline(design.pier)
  if outline.size()>=3 and Plan.inside(p,outline):key="pier"
 if key.is_empty():
  for name in ["plot","yard"]:
   if design.get(name) is Array:
    var poly:=PackedVector2Array()
    for q in design[name]:poly.append(Plan.point(q))
    if not Plan.nearest_wall(p,Plan.edges(poly),12).is_empty():key=name;break
 if key.is_empty():return {"error":"Vali kustutatav element või ala serv."}
 if key in ["plot","yard","pier"]:next[key]=null
 else:next[key].remove_at(index)
 if key=="rooms" and side>=0:
  var outline:=Plan.room_polygon(design.rooms[index]);var run:=[]
  for i in range(side+1,outline.size()):run.append(Plan.dict_point(outline[i]))
  for i in range(side+1):run.append(Plan.dict_point(outline[i]))
  next.wallRuns.append(run)
 elif key=="wallRuns":
  var run:Array=design.wallRuns[index]
  var before:=run.slice(0,side+1);var after:=run.slice(side+1)
  if before.size()>1:next.wallRuns.append(before)
  if after.size()>1:next.wallRuns.append(after)
 if key in ["rooms","inner","wallRuns"]:
  var remaining:=Plan.plan_geometry(next);var kept:=[]
  for opening in design.openings:
   var eligible:=[]
   for wall in remaining.walls:
    if wall.group==opening.group:eligible.append(wall)
   if not Plan.nearest_wall(Plan.point(opening.point),eligible,2).is_empty():kept.append(opening)
  next.openings=kept
  var finish_keep:=[]
  for finish in design.get("wallFinishes",[]):
   for wall in remaining.walls:
    if wall.group!=finish.group:continue
    var a:Vector2=wall.a;var b:Vector2=wall.b;var line:=b-a;var length:=line.length()
    if length<0.000001:continue
    var p1:=Plan.point(finish.a);var p2:=Plan.point(finish.b)
    if absf(line.cross(p1-a))/length>0.08 or absf(line.cross(p2-a))/length>0.08:continue
    var t1:float=(p1-a).dot(line)/(length*length);var t2:float=(p2-a).dot(line)/(length*length)
    if clampf(maxf(t1,t2),0,1)-clampf(minf(t1,t2),0,1)>0.000001:finish_keep.append(finish);break
  next.wallFinishes=finish_keep
  if key=="rooms":
   var enclosed:=[]
   for room in next.rooms:enclosed.append(Plan.room_polygon(room))
   var items:=[]
   for item in next.items:
    if item.type!="bed" or in_floor(Plan.point(item.point),enclosed):items.append(item)
   next.items=items
 return {"design":next}

static func owns_span(wall: Dictionary,a: Vector2,b: Vector2) -> bool:
 return Plan.closest(wall.a,a,b).distance_to(wall.a)<0.1 and Plan.closest(wall.b,a,b).distance_to(wall.b)<0.1

static func paint_wall(design: Dictionary,p: Vector2,finish: String) -> Dictionary:
 var hit:=Plan.nearest_wall(p,Plan.plan_geometry(design).walls,19.0)
 if hit.is_empty():return {"error":"Vali sein, mille materjali soovid muuta."}
 var edge:Dictionary=hit.edge;var next:=design.duplicate(true);var kept:=[]
 for existing in design.get("wallFinishes",[]):
  var a:=Plan.point(existing.a);var b:=Plan.point(existing.b)
  var same:bool=existing.group==edge.group and ((a.distance_to(edge.a)<0.01 and b.distance_to(edge.b)<0.01) or (a.distance_to(edge.b)<0.01 and b.distance_to(edge.a)<0.01))
  if not same:kept.append(existing)
 kept.append({"a":Plan.dict_point(edge.a),"b":Plan.dict_point(edge.b),"group":edge.group,"finish":finish});next.wallFinishes=kept;return {"design":next}
