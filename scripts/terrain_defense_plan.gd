extends RefCounted
const Wall=preload("res://scripts/wall_draw.gd")
const CORE=["hall","house","well","market","study","warehouse","cellar","scriptorium","library","chapel"]
const FORTS=["palisade","stonewall","reinforced_wall","woodgate","gatehouse","watchtower","stonetower"]
static func point(p:Dictionary)->Vector2:return Vector2(float(p.x),float(p.z))
static func dict(p:Vector2)->Dictionary:return {"x":p.x,"z":p.y}
static func hash_(seed:int,n:int)->float:
 var v:=sin(seed*17.71+n*7.47)*43758.5;return v-floor(v)
static func angle_distance(a:float,b:float)->float:return absf(atan2(sin(a-b),cos(a-b)))
static func inside(p:Vector2,outline:Array)->bool:
 if outline.is_empty():return true
 var result:=false;var j:=outline.size()-1
 for i in outline.size():
  var a:Vector2=point(outline[i]);var b:Vector2=point(outline[j])
  if (a.y>p.y)!=(b.y>p.y) and p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x:result=not result
  j=i
 return result
static func plot_penalty(p:Vector2,type:String,plan:Dictionary)->float:
 return 65.0 if plan.has("outlineV176") and type in CORE and not inside(p,plan.outlineV176) else 0.0
static func barrier(origin:Vector2,angle:float,limit:float,passable:Callable,feature:Callable)->Variant:
 var direction:=Vector2(cos(angle),sin(angle));var r:=12.0
 while r<=limit:
  var p:=origin+direction*r
  if not passable.call(p.x,p.y):
   var kind:String=feature.call(p.x,p.y)
   return {"r":r,"kind":kind} if kind in ["mountain","water","river"] else null
  r+=2
 return null
static func occupied(slot:Dictionary,buildings:Array,crosses:Callable)->bool:
 for b in buildings:
  if float(b.get("hp",0))>0 and not b.get("virtual",false) and b.type not in FORTS and crosses.call(slot,b,1.1):return true
 return false
static func radius(angle:float,hall:Vector2,core:Array,base_x:float,base_z:float,phase:float,extra:float)->float:
 var c:=cos(angle);var s:=sin(angle);var r:=1.0/sqrt(pow(c/base_x,2)+pow(s/base_z,2))
 r*=1+0.13*sin(3*angle+phase)+0.075*sin(2*angle-phase*0.7)+0.035*sin(5*angle+phase*0.4)
 for b in core:
  var p:=point(b)-hall;var along:=p.x*c+p.y*s;var across:=absf(-p.x*s+p.y*c)
  if along>0 and across<19:r=maxf(r,along+17)
 return r+extra
static func ray_limit(angle:float,hall:Vector2,range_x:float,range_z:float)->float:
 var c:=cos(angle);var s:=sin(angle)
 var tx:=INF if absf(c)<0.000001 else ((range_x if c>0 else -range_x)-hall.x)/c
 var tz:=INF if absf(s)<0.000001 else ((range_z if s>0 else -range_z)-hall.y)/s
 return maxf(0,minf(tx,tz))
static func sample_edge(a:Dictionary,b:Dictionary,kind:String)->Array:
 var first:=point(a);var end:=point(b);var n:=maxi(1,ceili(first.distance_to(end)/0.25));var result:=[]
 for i in n:
  var p:=dict(first.lerp(end,float(i)/n));p.kind=kind;result.append(p)
 return result
static func finish_run(run:Array,slots:Array,wall:String,buildings:Array,passable:Callable,feature:Callable,height:Callable,crosses:Callable)->bool:
 if run.size()<2:run.clear();return true
 var plan:=Wall.plan(run,"curved",128,passable)
 if plan.has("error"):run.clear();return false
 for i in plan.segments.size():
  var slot:Dictionary=plan.segments[i];slot.type=wall;slot.plannedDefense=true;slot.terrainDefenseV176=true
  var first:Dictionary=run.front();var last:Dictionary=run.back()
  slot.cliffEmbedStartV179=5 if i==0 and not passable.call(first.x,first.z) and feature.call(first.x,first.z)=="mountain" else 0
  slot.cliffEmbedEndV179=5 if i==plan.segments.size()-1 and not passable.call(last.x,last.z) and feature.call(last.x,last.z)=="mountain" else 0
  if occupied(slot,buildings,crosses) or not Wall.terrain_error(slot,passable,height).is_empty():run.clear();return false
  slots.append(slot)
 run.clear();return true

# Port of terrainDefensePlanV176. All coordinates are city-relative.
static func plan(city:Dictionary,buildings:Array,seed:int,passable:Callable,feature:Callable,height:Callable,crosses:Callable,roads:Array=[],extra:=0.0,wall:="palisade",wide:=false)->Variant:
 var hall:Dictionary={"x":0,"z":0}
 for b in buildings:
  if b.type=="hall" and float(b.get("hp",0))>0:hall=b;break
 var origin:=point(hall)
 if not passable.call(origin.x,origin.y):return null
 var gate:="woodgate" if wall=="palisade" else "gatehouse";var tower:="watchtower" if wall=="palisade" else "stonetower";var homes:=[]
 for b in buildings:
  if float(b.get("hp",0))>0 and not b.get("virtual",false) and b.type in CORE and not is_same(b,hall):homes.append(b)
 homes.sort_custom(func(a,b):return point(a).distance_to(origin)<point(b).distance_to(origin))
 var core:Array=[hall];core.append_array(homes.slice(0,ceili(homes.size()*0.9)))
 var phase:=hash_(seed,1)*TAU;var base_x:=48+hash_(seed,2)*7;var base_z:=43+hash_(seed,3)*8
 var range_x:=112.5*(24 if wide else 1);var range_z:=97.5*(24 if wide else 1);var anchor:Variant=null
 for i in 32:
  var a:=i*TAU/32;var base:=radius(a,origin,core,base_x,base_z,phase,extra);var limit:=ray_limit(a,origin,range_x,range_z)
  var hit:Variant=barrier(origin,a,minf(base+64,limit+3),passable,feature)
  if hit==null or hit.r<24:continue
  var score:float=hit.r+(-14 if hit.kind=="mountain" else 0)
  if anchor==null or score<float(anchor.score):anchor={"r":hit.r,"kind":hit.kind,"angle":a,"score":score}
 var points:=[]
 for i in 32:
  var angle:=i*TAU/32;var base:=radius(angle,origin,core,base_x,base_z,phase,extra);var limit:=ray_limit(angle,origin,range_x,range_z);var r:=minf(base,limit-5)
  if r<24:return null
  if anchor!=null and angle_distance(angle,float(anchor.angle))<PI*0.39:
   var hit:Variant=barrier(origin,angle,minf(base+64,limit+3),passable,feature)
   if hit!=null and hit.kind=="mountain":r=minf(maxf(base,float(hit.r)+3),limit+3)
  var stop:Variant=barrier(origin,angle,minf(r+2,limit+1),passable,feature)
  if stop!=null and stop.kind!="mountain":r=minf(r,float(stop.r)-6)
  points.append(origin+Vector2(cos(angle),sin(angle))*r)
 var ranked:=[]
 for i in points.size():
  var score:=0.0
  for road in roads:
   if points[i].distance_to(point(road))<9:score+=float(road.strength)
  if score>0:ranked.append({"i":i,"score":score})
 ranked.sort_custom(func(a,b):return a.score>b.score)
 var indices:=[]
 for i in mini(4,ranked.size()):indices.append(int(ranked[i].i))
 for i in [0,8,16,24]:
  if i not in indices:indices.append(i)
 var options:=[]
 for i in indices:
  var p:Vector2=points[i];var previous:Vector2=points[(i+31)%32];var next:Vector2=points[(i+1)%32];var axis:Vector2=(next-previous).normalized()
  var slot={"type":gate,"x":p.x,"z":p.y,"wallAxis":1 if absf(axis.y)>absf(axis.x) else 0,"wallAngleV175":-atan2(axis.y,axis.x),"plannedDefense":true}
  var outward:Vector2=(p-origin).normalized();var dry:=true
  for d in [-9,-4,0,4,9]:
   var q:Vector2=p+outward*d
   if not passable.call(q.x,q.y):dry=false;break
  for dx in [-3,0,3]:
   for dz in [-3,0,3]:
    if not passable.call(p.x+dx,p.y+dz):dry=false
  if not dry or occupied(slot,buildings,crosses):continue
  var score:=0.0
  for road in roads:
   if p.distance_to(point(road))<9:score+=float(road.strength)
  score+=-cos(i*TAU/32-float(anchor.angle)) if anchor!=null else hash_(seed,4+i)
  options.append({"i":i,"slot":slot,"a":dict(p-axis*3.5),"b":dict(p+axis*3.5),"score":score})
 options.sort_custom(func(a,b):return a.score>b.score)
 if options.is_empty():return null
 var gates:Array=[options[0]]
 for option in options:
  if angle_distance(float(option.i)*TAU/32,float(gates[0].i)*TAU/32)>PI*0.75:gates.append(option);break
 var outline:=[]
 for i in points.size():
  var opening:Variant=null
  for g in gates:
   if g.i==i:opening=g;break
  if opening!=null:
   var a:Dictionary=opening.a.duplicate();a.gateToNext=true;outline.append(a);outline.append(opening.b)
  else:outline.append(dict(points[i]))
 var edges:=[]
 for i in outline.size():edges.append_array(sample_edge(outline[i],outline[(i+1)%outline.size()],"gate" if outline[i].get("gateToNext",false) else "wall"))
 var start:=-1
 for i in edges.size():
  if edges[i].kind=="gate":start=i;break
 if start<0:return null
 var ordered:Array=edges.slice(start);ordered.append_array(edges.slice(0,start));var slots:=[]
 for g in gates:slots.append(g.slot)
 var natural:=[];var run:=[];var terrain_run:=[];var last:Variant=null
 for p in ordered:
  var dry:bool=passable.call(p.x,p.z)
  if p.kind=="wall" and not dry and feature.call(p.x,p.z)!="mountain":return null
  if p.kind=="wall" and dry:
   if run.is_empty() and last!=null and last.kind=="wall" and not passable.call(last.x,last.z):run.append(last)
   if not terrain_run.is_empty():natural.append({"kind":terrain_run[0].feature,"points":terrain_run.map(func(v):return {"x":v.x,"z":v.z})});terrain_run.clear()
   run.append(p)
  else:
   if not run.is_empty():
    if p.kind=="wall":run.append(p)
    if not finish_run(run,slots,wall,buildings,passable,feature,height,crosses):return null
   if p.kind=="wall":
    var kind:String=feature.call(p.x,p.z)
    if kind not in ["mountain","water","river"]:return null
    var terrain:Dictionary=p.duplicate();terrain.feature=kind;terrain_run.append(terrain)
   elif not terrain_run.is_empty():natural.append({"kind":terrain_run[0].feature,"points":terrain_run.map(func(v):return {"x":v.x,"z":v.z})});terrain_run.clear()
  last=p
 if not finish_run(run,slots,wall,buildings,passable,feature,height,crosses):return null
 if not terrain_run.is_empty():natural.append({"kind":terrain_run[0].feature,"points":terrain_run.map(func(v):return {"x":v.x,"z":v.z})})
 var curtains:=[]
 for slot in slots:
  if slot.type==wall:curtains.append(slot)
 if curtains.size()<3:return null
 for b in core:
  if not inside(point(b),outline):return null
 var towers:=[]
 for target in [4,12,20,28]:
  var goal:Vector2=points[target];var candidates:=curtains.duplicate();candidates.sort_custom(func(a,b):return point(a).distance_to(goal)<point(b).distance_to(goal))
  for section in candidates:
   var choice={"x":section.x,"z":section.z,"type":tower,"wallAxis":0,"plannedDefense":true,"wallTowerV179":true};var ok:=true
   for resource in city.get("world",{}).get("resources",[]):
    if resource.get("removed",false) or resource.kind in ["tree","berry","game","fish"]:continue
    if absf(float(resource.x)-float(choice.x))<(10 if resource.get("depositSite",false) else 4.5) and absf(float(resource.z)-float(choice.z))<(10 if resource.get("depositSite",false) else 4):ok=false;break
   for delta in [Vector2(-5,-5),Vector2(-5,5),Vector2(5,-5),Vector2(5,5)]:
    if not passable.call(float(choice.x)+delta.x,float(choice.z)+delta.y):ok=false;break
   if occupied(choice,buildings,crosses):ok=false
   for g in gates:
    if point(choice).distance_to(point(g.slot))<=12:ok=false;break
   for t in towers:
    if point(choice).distance_to(point(t))<=18:ok=false;break
   if ok:towers.append(choice);break
 if towers.size()<2:return null
 var ordered_slots:=slots.slice(0,gates.size());curtains=slots.slice(gates.size())
 for i in curtains.size():
  ordered_slots.append(curtains[i])
  if i in [1,12,25,38] and not towers.is_empty():ordered_slots.append(towers.pop_front())
 ordered_slots.append_array(towers)
 var rx:=0.0;var rz:=0.0
 for p in points:rx=maxf(rx,absf(p.x-origin.x));rz=maxf(rz,absf(p.y-origin.y))
 if natural.is_empty() and anchor!=null:natural=[{"kind":anchor.kind,"points":[],"backsBuiltRing":true}]
 return {"version":177,"closedRingV177":true,"kind":"terrain-following","shape":"organic-terrain-enclosure","slots":ordered_slots,"gates":gates.map(func(g):return g.slot),"gateOpenings":gates.size(),"outlineV176":outline,"naturalBarriersV176":natural,"terrainBackedV176":anchor!=null,"terrainBlockedAtFounding":0,"initialBlocked":0,"initialViable":ordered_slots.size(),"verifiedAtTechV167":true,"nextIndex":0,"constructed":0,"blocked":0,"seed":seed,"rx":rx,"rz":rz}
