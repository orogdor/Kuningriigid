extends RefCounted
const Terrain=preload("res://scripts/terrain_defense_plan.gd")
const Urban=preload("res://scripts/historic_urban.gd")
const District=preload("res://scripts/district_context.gd")
const ROOFS=["house","market","warehouse","cellar","study","chapel","library","scriptorium","inn","barracks","archery","smith","saw","mason","farm","fisher","lumber","quarry","pottery_kiln","bronze_foundry","school","academy","guildhall","mill","bakery","stable"]

static func blocks_future_wall(parent:Dictionary,p:Vector2,type:String,tile_offset:=Vector2.ZERO)->bool:
 var plan:Variant=parent.get("outerRingV184")
 if not plan is Dictionary or not plan.get("slots") is Array or plan.slots.is_empty() or not is_finite(p.x) or not is_finite(p.y):return false
 if type in ["palisade","stonewall","reinforced_wall","woodgate","gatehouse","watchtower","stonetower","bridge"]:return false
 var world:=p+tile_offset;var footprint:=11.0 if type=="market" else 10.0 if type=="field" else 7.0 if type in ["hall","warehouse","barracks"] else 5.5
 for i in range(maxi(0,int(plan.get("nextIndex",0))),plan.slots.size()):
  var slot:Dictionary=plan.slots[i];var angle:=float(slot.get("wallAngleV175",0));var span:=float(slot.get("palisadeSpanV167",7));var delta:=world-Vector2(slot.x,slot.z)
  var along:=delta.x*cos(angle)-delta.y*sin(angle);var across:=delta.x*sin(angle)+delta.y*cos(angle)
  if absf(along)<=span/2+footprint and absf(across)<=footprint+2:return true
 return false

# V204: all connected groups of roofs within 115m of the old curtain;
# its largest group must contain thirteen buildings to justify expansion.
static func suburb_demand(city:Dictionary)->Dictionary:
 var old:Variant=city.get("stoneDefensePlanV166",{})
 var outline:Variant=old.get("outlineV176") if old is Dictionary else null
 if outline==null:
  old=city.get("defensePlanV139",{});outline=old.get("outlineV176",[]) if old is Dictionary else []
 if not outline is Array or outline.is_empty():return {"ready":false,"count":0,"cluster":[],"required":13}
 var candidates:=[]
 for ctx in District.contexts(city):
  for b in ctx.economy.get("buildings",[]):
   if float(b.get("hp",0))<=0 or b.get("virtual",false) or b.get("type","") not in ROOFS:continue
   var shifted:Dictionary=b.duplicate();shifted.x=float(b.x)+(int(ctx.c)-int(city.c))*225;shifted.z=float(b.z)+(int(ctx.r)-int(city.r))*195
   var p:=Vector2(shifted.x,shifted.z)
   if not Terrain.inside(p,outline) and Urban.distance_to_curtain(p,outline)<=115:candidates.append(shifted)
 var groups:=[];var seen:Dictionary={}
 for i in candidates.size():
  if seen.has(i):continue
  var stack:=[i];var group:=[];seen[i]=true
  while not stack.is_empty():
   var id:int=stack.pop_back();var p:Dictionary=candidates[id];group.append(p)
   for j in candidates.size():
    if not seen.has(j) and Vector2(p.x,p.z).distance_to(Vector2(candidates[j].x,candidates[j].z))<=62:seen[j]=true;stack.append(j)
  groups.append(group)
 groups.sort_custom(func(a,b):return a.size()>b.size())
 var cluster:Array=groups[0] if not groups.is_empty() else []
 return {"ready":cluster.size()>=13,"count":candidates.size(),"cluster":cluster,"required":13}

static func point(v:Vector2)->Dictionary:return {"x":v.x,"z":v.y}
static func safe(p:Vector2,kind:Callable,passable:Callable)->bool:
 return kind.call(p.x,p.y) not in ["water","mountain","river"] and bool(passable.call(p.x,p.y))

# V194: every sample must meet a continuous impassable strip behind it.
static func natural_boundary(a:Vector2,b:Vector2,normal:Vector2,target:String,kind:Callable,passable:Callable,max_depth:=165.0)->Variant:
 var chord:=a.distance_to(b);var samples:=maxi(12,ceili(chord/2.5));var coast:=[];var depths:=[]
 for i in range(samples+1):
  var origin:=a.lerp(b,float(i)/samples);var dry:Variant=null;var wet:Variant=null;var d:=8.0
  while d<=max_depth:
   var p:=origin+normal*d;var terrain:String=kind.call(p.x,p.y)
   if terrain==target and not safe(p,kind,passable):wet=d;dry=d-2.5;break
   if not safe(p,kind,passable) and terrain!=target:return null
   d+=2.5
  if wet==null or float(dry)<6:return null
  for k in 8:
   var mid:float=(float(dry)+float(wet))*0.5;var p:=origin+normal*mid
   if kind.call(p.x,p.y)==target and not safe(p,kind,passable):wet=mid
   else:dry=mid
  for depth in [float(wet)+0.4,float(wet)+1.2,float(wet)+2.4]:
   var q:Vector2=origin+normal*float(depth)
   if kind.call(q.x,q.y)!=target or safe(q,kind,passable):return null
  coast.append(point(origin+normal*float(dry)));depths.append(float(dry))
 if float(depths.min())<19 or float(depths.max())>max_depth-1:return null
 for i in range(1,depths.size()):
  if absf(float(depths[i])-float(depths[i-1]))>7:return null
 var length:=0.0
 for i in range(1,coast.size()):length+=Vector2(coast[i].x,coast[i].z).distance_to(Vector2(coast[i-1].x,coast[i-1].z))
 if length<24 or length>chord*2.4:return null
 return {"kind":target,"coast":coast,"blockedFrom":depths,"depth":depths.min(),"rearLength":length,"naturalLengthV194":length}

# V195: separate continuous mountain stretches, preserving the gaps that need walls.
static func partial_boundaries(a:Vector2,b:Vector2,normal:Vector2,target:String,kind:Callable,passable:Callable)->Array:
 var chord:=a.distance_to(b);var n:=maxi(12,ceili(chord/2.5));var hits:=[]
 for i in range(n+1):
  var origin:=a.lerp(b,float(i)/n);var land:=0.0;var water:Variant=null;var d:=0.0
  while d<=175:
   var pos:=origin+normal*d;var k:String=kind.call(pos.x,pos.y)
   if k==target and not safe(pos,kind,passable):water=d;land=maxf(0,d-2.5);break
   if not safe(pos,kind,passable):break
   d+=2.5
  if water==null:hits.append(null);continue
  if float(water)>0:
   for j in 8:
    var middle:float=(land+float(water))/2;var p:=origin+normal*middle
    if kind.call(p.x,p.y)==target and not safe(p,kind,passable):water=middle
    else:land=middle
  var valid:=true
  for depth in [float(water)+0.4,float(water)+1.2,float(water)+2.4]:
   var p:Vector2=origin+normal*float(depth)
   if kind.call(p.x,p.y)!=target or safe(p,kind,passable):valid=false;break
  hits.append({"p":origin+normal*land,"d":land,"origin":origin,"wet":float(water),"i":i} if valid else null)
 var groups:=[];var current:=[]
 for i in hits.size():
  var hit:Variant=hits[i]
  if hit==null:
   if not current.is_empty():groups.append(current);current=[]
   continue
  if not current.is_empty():
   var previous:Dictionary=current.back();var contiguous:=absf(float(previous.d)-float(hit.d))<=11
   if contiguous:
    for off in [0.4,1.5]:
     var p:Vector2=(previous.origin as Vector2).lerp(hit.origin,0.5)+normal*((float(previous.wet)+float(hit.wet))/2+float(off))
     if kind.call(p.x,p.y)!=target or safe(p,kind,passable):contiguous=false;break
   if not contiguous:groups.append(current);current=[]
  current.append(hit)
 if not current.is_empty():groups.append(current)
 var runs:=[]
 for group in groups:
  if group.size()<9:continue
  var coast:=[];var length:=0.0
  for i in group.size():
   var p:Vector2=group[i].p;coast.append(point(p))
   if i>0:length+=p.distance_to(group[i-1].p)
  if length>=23 and length<=chord*1.75:runs.append({"kind":target,"coast":coast,"naturalLengthV194":length,"partialV195":true,"startFraction":float(group.front().i)/n,"endFraction":float(group.back().i)/n})
 runs.sort_custom(func(x,y):return x.naturalLengthV194>y.naturalLengthV194)
 return runs.slice(0,5)

static func wall_contact(p:Vector2,walls:Array,gates:Array)->Vector2:
 var best:=p;var best_distance:=INF
 for b in walls:
  if b.get("type","") not in ["palisade","stonewall","reinforced_wall"] or float(b.get("hp",0))<=0 or not b.get("ready",false):continue
  var angle:=float(b.get("wallAngleV175",PI/2 if b.get("wallAxis",false) else 0));var axis:=Vector2(cos(angle),-sin(angle));var half:=float(b.get("palisadeSpanV167",7))/2
  var base:=Vector2(b.x,b.z);var along:=clampf((p-base).dot(axis),-half+0.3,half-0.3);var projected:=base+axis*along;var distance:=p.distance_to(projected)
  if distance>4.5 or distance>=best_distance:continue
  var blocked:=false
  for gate in gates:
   if Vector2(gate.x,gate.z).distance_to(projected)<5.3:blocked=true;break
  if not blocked:best=projected;best_distance=distance
 return best

static func historic_curtain(a:Vector2,b:Vector2,normal:Vector2,depth:float,variant:int)->Array:
 var chord:=a.distance_to(b);var axis:Vector2=(b-a)/chord
 var offsets:Array=[0.03,0.14,0.50,0.88,0.99] if variant==0 else [0.04,0.18,0.55,0.91,0.99] if variant==1 else [0.03,0.10,0.44,0.84,0.99]
 var heights:Array=[0.18,0.78,1.0,0.75,0.16] if variant==0 else [0.16,0.85,0.96,0.71,0.15] if variant==1 else [0.15,0.69,0.98,0.86,0.20]
 var result:=[point(a)]
 for i in 5:result.append(point(a+axis*chord*float(offsets[i])+normal*depth*float(heights[i])))
 result.append(point(b));return result

static func orthogonal_shoulder(anchor:Vector2,first:Vector2,walls:Array,outward:Vector2,depth:float)->Vector2:
 var closest:Variant=null;var best:=INF
 for b in walls:
  if b.get("type","") not in ["palisade","stonewall","reinforced_wall"] or float(b.get("hp",0))<=0 or not b.get("ready",false):continue
  var d:=anchor.distance_to(Vector2(b.x,b.z))
  if d<best:best=d;closest=b
 if closest==null or best>6:return first
 var angle:=float(closest.get("wallAngleV175",PI/2 if closest.get("wallAxis",false) else 0));var axis:=Vector2(cos(angle),-sin(angle));var delta:=first-anchor
 if delta.length()<2 or absf(delta.normalized().dot(axis))<0.89:return first
 var normal:=Vector2(-axis.y,axis.x)
 if normal.dot(outward)<0:normal=-normal
 return anchor+normal*clampf(depth*0.21,11,19)

static func area(poly:Array)->float:
 var sum:=0.0
 for i in poly.size():
  var p:Dictionary=poly[i];var q:Dictionary=poly[(i+1)%poly.size()];sum+=float(p.x)*float(q.z)-float(q.x)*float(p.z)
 return absf(sum)*0.5

static func sites_inside(poly:Array,inner:Array,buildings:Array,kind:Callable,passable:Callable)->int:
 var low:=Vector2(INF,INF);var high:=Vector2(-INF,-INF)
 for p in poly:
  low=low.min(Vector2(p.x,p.z));high=high.max(Vector2(p.x,p.z))
 var plots:=0;var x:=low.x+9
 while x<=high.x-9 and plots<25:
  var z:=low.y+9
  while z<=high.y-9 and plots<25:
   var p:=Vector2(x,z)
   if Terrain.inside(p,poly) and not Terrain.inside(p,inner):
    var valid:=true
    for dx in [-5,5]:
     for dz in [-5,5]:
      if not safe(p+Vector2(dx,dz),kind,passable):valid=false;break
     if not valid:break
    if valid:
     for building in buildings:
      if float(building.get("hp",0))>0 and p.distance_to(Vector2(building.x,building.z))<12:valid=false;break
    if valid:plots+=1
   z+=15
  x+=15
 return plots

static func distance_to_course(p:Vector2,a:Vector2,b:Vector2)->float:
 var d:=b-a;var length:=d.length_squared();var u:=clampf((p-a).dot(d)/length,0,1) if length>0 else 0.0
 return p.distance_to(a+d*u)

static func wall_already_there(walls:Array,p:Vector2)->bool:
 for wall in walls:
  if wall.type in ["palisade","stonewall","reinforced_wall"]:
   if preload("res://scripts/wall_draw.gd").wall_point_inside(p,wall,1.8):return true
  elif Vector2(wall.x,wall.z).distance_to(p)<6:return true
 return false

static func sample_line(a:Vector2,b:Vector2,step:float)->Array:
 var n:=maxi(1,ceili(a.distance_to(b)/step));var result:=[]
 for i in range(n+1):result.append(a.lerp(b,float(i)/n))
 return result

static func reject_inner(slots:Array,inner:Array)->bool:
 for slot in slots:
  var p:=Vector2(slot.x,slot.z)
  if Terrain.inside(p,inner) and Urban.distance_to_curtain(p,inner)>3.5:return true
 return false

# One old-wall arc at a time, so an AI survey can be spread over frames.
static func arc_candidates(arc:Array,inner:Array,center:Vector2,walls:Array,buildings:Array,cluster:Array,suburb_ready:bool,maritime:bool,kind:Callable,passable:Callable,depth_index:=-1)->Array:
 var shared:=0.0
 for i in range(1,arc.size()):shared+=Vector2(arc[i-1].x,arc[i-1].z).distance_to(Vector2(arc[i].x,arc[i].z))
 var a:=Vector2(arc.front().x,arc.front().z);var b:=Vector2(arc.back().x,arc.back().z);var chord:=a.distance_to(b)
 if shared<30 or shared>170 or chord<shared*0.64:return []
 for i in arc.size():
  if not wall_already_there(walls,Vector2(arc[i].x,arc[i].z)):return []
  if i>0:
   for p in sample_line(Vector2(arc[i-1].x,arc[i-1].z),Vector2(arc[i].x,arc[i].z),2):
    if not wall_already_there(walls,p):return []
 var axis:Vector2=(b-a)/chord;var middle:=a.lerp(b,0.5);var normal:=Vector2(-axis.y,axis.x)
 if (middle-center).dot(normal)<0:normal=-normal
 var gates:=[];var old_gates:=[]
 for w in walls:
  if w.type not in ["woodgate","gatehouse"]:continue
  gates.append(w);var p:=Vector2(w.x,w.z);var near:=false
  for q in arc:
   if p.distance_to(Vector2(q.x,q.z))<11:near=true;break
  if near and p.distance_to(a)>14 and p.distance_to(b)>14:old_gates.append(w)
 var outward:=[];var home_depth:=0.0
 for h in buildings:
  var p:=Vector2(h.x,h.z);var out:float=(p-middle).dot(normal)
  if not Terrain.inside(p,inner) and out>6 and absf((p-middle).dot(axis))<chord*0.72:outward.append(h);home_depth=maxf(home_depth,out)
 var candidates:=[];var naturals:=[]
 if depth_index<0:
  for name in ["water","mountain"]:
   var boundary:Variant=natural_boundary(a,b,normal,name,kind,passable)
   if boundary!=null:naturals.append(boundary)
  naturals.append_array(partial_boundaries(a,b,normal,"mountain",kind,passable))
 for natural in naturals:
  var coast:Array=natural.coast;var reverse:Array=coast.duplicate();reverse.reverse();var poly:Array=arc.duplicate();poly.append_array(reverse)
  var polygon_area:=area(poly)
  if polygon_area<1550 or polygon_area>12500:continue
  var plots:=sites_inside(poly,inner,buildings,kind,passable);var occupied:=0;var protected:=0
  for home in outward:
   if Terrain.inside(Vector2(home.x,home.z),poly):occupied+=1
  if suburb_ready:
   for home in cluster:
    if Terrain.inside(Vector2(home.x,home.z),poly):protected+=1
   if protected<3:continue
  if plots<3 and occupied<2:continue
  var distance:=middle.distance_to(Vector2(coast[floori(coast.size()/2.0)].x,coast[floori(coast.size()/2.0)].z))
  var score:float=150+minf(8500,polygon_area)/170+mini(22,plots)*3+mini(2,old_gates.size())*20+occupied*12+protected*85+(320 if maritime and natural.kind=="water" else 0)-distance*0.18
  var points:=[point(a)];points.append_array(coast);points.append(point(b))
  candidates.append({"arc":arc,"points":points,"area":polygon_area,"shared":shared,"oldGates":old_gates,"plots":plots,"occupiedHomes":occupied,"protectedCluster":protected,"rank":score,"natural":natural})
 var depths:=[minf(125,maxf(57,home_depth+25)),52.0,64.0,76.0,88.0,100.0,112.0,124.0,43.0];var visited:Dictionary={}
 for di in depths.size():
  var depth:float=depths[di]
  if depth>128 or depth<38 or visited.has(depth):continue
  visited[depth]=true
  if depth_index== -2 or (depth_index>=0 and depth_index!=di):continue
  for variant in 3:
   var points:=historic_curtain(a,b,normal,depth,variant)
   points[1]=point(orthogonal_shoulder(a,Vector2(points[1].x,points[1].z),walls,normal,depth))
   var last:=points.size()-2;points[last]=point(orthogonal_shoulder(b,Vector2(points[last].x,points[last].z),walls,normal,depth))
   var poly:Array=arc.duplicate();var mids:Array=points.slice(1,points.size()-1);mids.reverse();poly.append_array(mids)
   var polygon_area:=area(poly)
   if polygon_area<1200 or polygon_area>10500:continue
   var occupied:=0;var protected:=0
   for home in outward:
    if Terrain.inside(Vector2(home.x,home.z),poly):occupied+=1
   if suburb_ready:
    for home in cluster:
     if Terrain.inside(Vector2(home.x,home.z),poly):protected+=1
    if protected<3:continue
   var blocked:=false
   for building in buildings:
    var p:=Vector2(building.x,building.z)
    for j in range(1,points.size()):
     if p.distance_to(Vector2(points[j].x,points[j].z))<6 or distance_to_course(p,Vector2(points[j-1].x,points[j-1].z),Vector2(points[j].x,points[j].z))<8.2:blocked=true;break
    if blocked:break
   if blocked:continue
   for gate in gates:
    for j in range(1,points.size()):
     if distance_to_course(Vector2(gate.x,gate.z),Vector2(points[j-1].x,points[j-1].z),Vector2(points[j].x,points[j].z))<6.3:blocked=true;break
    if blocked:break
   if blocked:continue
   var plots:=sites_inside(poly,inner,buildings,kind,passable)
   if plots<3 and occupied<2:continue
   var length:=0.0
   for j in range(1,points.size()):length+=Vector2(points[j-1].x,points[j-1].z).distance_to(Vector2(points[j].x,points[j].z))
   var front:=Vector2(points[3].x,points[3].z)+normal*7;var natural:bool=kind.call(front.x,front.y) in ["water","mountain","river"]
   var score:float=occupied*13+mini(22,plots)*3+mini(2,old_gates.size())*20+(7 if natural else 0)+minf(7500,polygon_area)/180+protected*85-length*0.18-maxf(0,4200-polygon_area)/115-maxf(0,polygon_area-7500)/250
   candidates.append({"arc":arc,"points":points,"area":polygon_area,"shared":shared,"oldGates":old_gates,"plots":plots,"occupiedHomes":occupied,"protectedCluster":protected,"rank":score})
 return candidates

static func finish_candidate(candidate:Dictionary,inner:Array,walls:Array,gates:Array,kind:Callable,passable:Callable,preview:Callable,maritime:bool,defer_previews:=false)->Variant:
 var Wall=preload("res://scripts/wall_draw.gd")
 var arc:Array=candidate.arc.duplicate(true);var points:Array=candidate.points;var natural:Variant=candidate.get("natural")
 if natural is Dictionary and natural.kind=="mountain" and natural.get("partialV195",false):
  arc[0]=point(wall_contact(Vector2(arc[0].x,arc[0].z),walls,gates));var end:=arc.size()-1;arc[end]=point(wall_contact(Vector2(arc[end].x,arc[end].z),walls,gates))
 var segments:=[]
 if natural is Dictionary:
  var coast:Array=natural.coast
  for pair in [[arc[0],coast[0]],[arc.back(),coast.back()]]:
   var start:=Vector2(pair[0].x,pair[0].z);var end:=Vector2(pair[1].x,pair[1].z);var distance:=start.distance_to(end)
   if distance<2.8:continue
   var boundary:=end+(end-start)/maxf(1,distance)*1.4
   var line:=Wall.plan([point(start),point(boundary)],"straight",100,func(x,z):return safe(Vector2(x,z),kind,passable))
   if line.has("error") or line.segments.is_empty():return null
   if natural.kind=="mountain":line.segments.back().cliffEmbedEndV179=5
   for segment in line.segments:segment.type="palisade";segment.plannedDefense=true;segment.outerRingV184=true;segments.append(segment)
 else:
  for i in range(1,points.size()):
   var a:=Vector2(points[i-1].x,points[i-1].z);var b:=Vector2(points[i].x,points[i].z)
   for p in sample_line(a,b,1.5):
    if not safe(p,kind,passable):return null
   var line:=Wall.plan([point(a),point(b)],"straight",100)
   if line.has("error"):return null
   for segment in line.segments:segment.type="palisade";segment.plannedDefense=true;segment.outerRingV184=true;segments.append(segment)
 if reject_inner(segments,inner) or segments.size()<3 or segments.size()>70:return null
 var length:=0.0
 for s in segments:length+=Vector2(s.from.x,s.from.z).distance_to(Vector2(s.to.x,s.to.z))
 var share:float=float(candidate.shared)/(float(candidate.shared)+length)
 if share<0.10 or share>0.75:return null
 var gate:Variant=candidate.oldGates[0] if not candidate.oldGates.is_empty() else null
 if gate==null and not gates.is_empty():
  var front:=Vector2(points[3].x,points[3].z);var closest:=INF
  for g in gates:
   var d:=Vector2(g.x,g.z).distance_to(front)
   if d<closest:closest=d;gate=g
 if natural==null and gate!=null and segments.size()>=12:
  var middle:=Vector2(arc[floori(arc.size()/2.0)].x,arc[floori(arc.size()/2.0)].z);var front:=Vector2(points[3].x,points[3].z);var forward:=front-middle;var normal:Vector2=forward/maxf(1,forward.length());var target:Variant=null;var best:=INF
  for j in range(3,segments.size()-3):
   var p:=Vector2(segments[j].x,segments[j].z);var delta:=p-Vector2(gate.x,gate.z);var toward:=delta.dot(normal);var projection:=absf(delta.x*normal.y-delta.y*normal.x);var score:=projection+delta.length()*0.08
   if toward>15 and score<best:target=j;best=score
  if target!=null and best<20:
   var gateway:Dictionary=segments[int(target)].duplicate(true);gateway.type="woodgate";gateway.hp=350;var crossed:=false
   for j in segments.size():
    if j!=int(target) and Wall.crosses_gate(segments[j],gateway):crossed=true;break
   if not crossed and bool(preview.call(gateway)):segments[int(target)]=gateway
 if not defer_previews:
  for segment in segments:
   if not bool(preview.call(segment)):return null
 var boundary:Array=arc.duplicate(true)
 if natural is Dictionary:
  var coast:Array=natural.coast.duplicate(true);coast.reverse();boundary.append_array(coast)
 else:
  var mids:Array=points.slice(1,points.size()-1);mids.reverse();boundary.append_array(mids)
 return {"version":204,"shape":"natural-barrier-suburb" if natural is Dictionary else "historic-gate-suburb","historicSuburbV191":true,"expandedSuburbV193":true,"naturalBoundaryV194":{"kind":natural.kind,"trace":natural.coast.duplicate(true),"length":natural.naturalLengthV194,"partial":bool(natural.get("partialV195",false)),"verified":true} if natural is Dictionary else null,"oldGateCountV191":candidate.oldGates.size(),"plannedHousePlotsV191":candidate.plots,"protectedSuburbBuildingsV204":candidate.protectedCluster,"maritimePreferenceV204":maritime,"sharedLength":candidate.shared,"newLength":length,"sharedFraction":share,"sharedArc":arc,"boundaryV186":boundary,"areaEstimateV186":area(boundary),"organicOutlineV189":true,"cliffBoundaryV186":natural is Dictionary and natural.kind=="mountain","waterBoundaryV187":natural is Dictionary and natural.kind=="water","slots":segments,"nextIndex":0}

var survey_city:Dictionary={}
var survey_inner:Array=[]
var survey_walls:Array=[]
var survey_buildings:Array=[]
var survey_cluster:Array=[]
var survey_center:=Vector2.ZERO
var survey_maritime:=false
var survey_kind:Callable
var survey_passable:Callable
var survey_preview:Callable
var survey_candidates:Array=[]
var survey_count:=0
var survey_min:=0
var survey_index:=0
var survey_check_index:=0
var survey_phase:="arcs"
var survey_arc_piece:=0
var survey_pending_plan:Variant=null
var survey_preview_index:=0

func begin(city:Dictionary,kind:Callable,passable:Callable,preview:Callable,maritime:bool)->bool:
 survey_city=city;survey_kind=kind;survey_passable=passable;survey_preview=preview;survey_maritime=maritime
 var defense:Variant=city.get("stoneDefensePlanV166",city.get("defensePlanV139",{}))
 if not defense is Dictionary or not defense.get("outlineV176") is Array:return false
 survey_inner=defense.outlineV176.duplicate(true)
 if survey_inner.size()<8:return false
 for p in survey_inner:survey_center+=Vector2(p.x,p.z)/survey_inner.size()
 for ctx in District.contexts(city):
  for b in ctx.economy.get("buildings",[]):
   if float(b.get("hp",0))<=0 or b.get("virtual",false):continue
   var shifted:Dictionary=b.duplicate(true);shifted.x=float(b.x)+(int(ctx.c)-int(city.c))*225.0;shifted.z=float(b.z)+(int(ctx.r)-int(city.r))*195.0
   if b.get("ready",false) and b.type in ["palisade","stonewall","reinforced_wall","woodgate","gatehouse","watchtower","stonetower"]:survey_walls.append(shifted)
   if b.type in ["house","hall","market","well","warehouse","cellar","study","chapel","library","scriptorium","inn"]:survey_buildings.append(shifted)
 var demand:=suburb_demand(city);survey_cluster=demand.cluster
 if not demand.ready:return false
 survey_count=maxi(6,floori(survey_inner.size()*0.48));survey_min=maxi(4,floori(survey_inner.size()*0.24));return true

func advance()->Dictionary:
 if survey_phase=="arcs":
  var arc:=[]
  for j in range(survey_count+1):arc.append(survey_inner[(survey_index+j)%survey_inner.size()])
  var piece: int=-2 if survey_arc_piece==0 else survey_arc_piece-1
  var found:=arc_candidates(arc,survey_inner,survey_center,survey_walls,survey_buildings,survey_cluster,true,survey_maritime,survey_kind,survey_passable,piece)
  for candidate in found:candidate._order=survey_candidates.size();survey_candidates.append(candidate)
  survey_arc_piece+=1
  if survey_arc_piece<10:return {"done":false}
  survey_arc_piece=0
  survey_index+=1
  if survey_index>=survey_inner.size():
   survey_index=0;survey_count-=1
   if survey_count<survey_min:
    survey_candidates.sort_custom(func(a,b):return a._order<b._order if a.rank==b.rank else a.rank>b.rank);survey_phase="preview"
  return {"done":false}
 var gates:=[]
 for wall in survey_walls:
  if wall.type in ["woodgate","gatehouse"]:gates.append(wall)
 if survey_pending_plan is Dictionary:
  if survey_preview_index>=survey_pending_plan.slots.size():return {"done":true,"plan":survey_pending_plan}
  if bool(survey_preview.call(survey_pending_plan.slots[survey_preview_index])):survey_preview_index+=1
  else:survey_pending_plan=null;survey_preview_index=0
  return {"done":false}
 var limit:=mini(3500,survey_candidates.size())
 if survey_check_index>=limit:return {"done":true,"plan":null}
 var candidate:Dictionary=survey_candidates[survey_check_index];survey_check_index+=1
 var plan:Variant=finish_candidate(candidate,survey_inner,survey_walls,gates,survey_kind,survey_passable,survey_preview,survey_maritime,true)
 if plan is Dictionary:survey_pending_plan=plan;survey_preview_index=0
 return {"done":false}
