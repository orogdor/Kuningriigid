extends RefCounted
const SPACING:=7.0
const MAX_SEGMENTS:=10
const MIN_LENGTH:=3.0
const JOINT_OVERLAP:=0.52

static func point(p: Dictionary) -> Vector2:
 return Vector2(float(p.x),float(p.z))

static func as_point(p: Vector2) -> Dictionary:
 return {"x":p.x,"z":p.y}

static func clean(points: Array) -> Array:
 var result:=[]
 for p in points:
  if not p is Dictionary or not p.has("x") or not p.has("z") or not is_finite(float(p.x)) or not is_finite(float(p.z)):continue
  var q:=point(p)
  if result.is_empty() or q.distance_to(result.back())>=0.7:result.append(q)
 return result

static func smooth(points: Array,shape: String="straight") -> Array:
 var path:=clean(points)
 if path.size()<2:return path
 if shape!="curved":return [path.front(),path.back()]
 for pass_index in 2:
  var next:=[path.front()]
  for i in range(1,path.size()):
   var a:Vector2=path[i-1];var b:Vector2=path[i];next.append(a.lerp(b,0.25));next.append(a.lerp(b,0.75))
  next.append(path.back());path=next
 return path

static func clip_shore(curve: Array,passable: Callable) -> Dictionary:
 if curve.size()<2:return {"curve":curve}
 var samples:=[curve.front()]
 for i in range(1,curve.size()):
  var a:Vector2=curve[i-1];var b:Vector2=curve[i];var n:=maxi(1,ceili(a.distance_to(b)/0.2))
  for j in range(1,n+1):samples.append(a.lerp(b,float(j)/n))
 var dry:=[];var first:=-1;var last:=-1
 for i in samples.size():
  var p:Vector2=samples[i];var ok:bool=passable.call(p.x,p.y);dry.append(ok)
  if ok:
   if first<0:first=i
   last=i
 if first<0:return {"error":"Müür vajab kuiva maad.","curve":[]}
 for i in range(first,last+1):
  if not dry[i]:return {"error":"Müür ei saa ületada merd ega läbimatut mäge. Lõpeta müür maastiku serval.","curve":[]}
 var result:=samples.slice(first,last+1)
 if first>0:result.push_front(boundary(samples[first],samples[first-1],passable))
 if last+1<samples.size():result.append(boundary(samples[last],samples[last+1],passable))
 return {"curve":result,"terrainEndsV1758":{"start":first>0,"end":last+1<samples.size()}}

static func boundary(land: Vector2,blocked: Vector2,passable: Callable) -> Vector2:
 for i in 8:
  var p:=land.lerp(blocked,0.5)
  if passable.call(p.x,p.y):land=p
  else:blocked=p
 return land

static func plan(points: Array,shape: String="straight",max_segments:=MAX_SEGMENTS,passable: Callable=Callable()) -> Dictionary:
 var curve:=smooth(points,shape)
 if passable.is_valid():
  var clipped:=clip_shore(curve,passable)
  if clipped.has("error"):clipped.segments=[];return clipped
  curve=clipped.curve
 if curve.size()<2:return {"error":"Lohista müürile vähemalt kaks punkti.","segments":[],"curve":curve}
 var length:=0.0
 for i in range(1,curve.size()):length+=curve[i-1].distance_to(curve[i])
 if length<MIN_LENGTH:return {"error":"Müür peab olema vähemalt 3 meetrit pikk.","segments":[],"curve":curve}
 var count:=maxi(1,ceili(length/SPACING))
 if count>max_segments:return {"error":"Liiga pikk müür: maksimaalselt %d lõiku korraga." % max_segments,"segments":[],"curve":curve,"length":length,"count":count}
 var sampled:=[curve.front()];var interval:=length/count;var target:=interval;var travelled:=0.0
 for i in range(1,curve.size()):
  var a:Vector2=curve[i-1];var b:Vector2=curve[i];var l:=a.distance_to(b)
  if l<0.0000001:continue
  while target<travelled+l-0.0000001:sampled.append(a.lerp(b,(target-travelled)/l));target+=interval
  travelled+=l
 sampled.append(curve.back());var segments:=[]
 for i in range(1,sampled.size()):
  var a:Vector2=sampled[i-1];var b:Vector2=sampled[i];var span:=a.distance_to(b)
  if span<0.1:continue
  segments.append({"x":(a.x+b.x)/2,"z":(a.y+b.y)/2,"wallAngleV175":-atan2(b.y-a.y,b.x-a.x),"palisadeSpanV167":span+JOINT_OVERLAP,"wallAxis":1 if absf(b.y-a.y)>absf(b.x-a.x) else 0,"drawnWallV175":true,"from":as_point(a),"to":as_point(b)})
 if segments.is_empty():return {"error":"Müüril puuduvad lõigud.","segments":[],"curve":curve}
 return {"shape":shape,"curve":curve,"sampled":sampled,"segments":segments,"length":length,"count":segments.size()}

static func terrain_error(wall: Dictionary,passable: Callable,height: Callable=Callable()) -> String:
 var span:=float(wall.get("palisadeSpanV167",7));var half:=span/2.0;var angle:=float(wall.get("wallAngleV175",NAN))
 if not is_finite(span) or span<2.4 or span>8 or not is_finite(angle):return "Müürijupi pikkus või pöördenurk ei sobi."
 if not passable.call(float(wall.x),float(wall.z)):return "Müüri keskkoht peab olema kuival, läbitaval maal."
 var c:=cos(angle);var s:=sin(angle);var depth:=2.35 if wall.type=="palisade" and int(wall.get("woodFortTierV1757",1))==2 else 1.1
 var levels:=[];var n:=ceili(span/0.2)
 for i in range(n+1):
  var along:float=(float(i)/n-0.5)*span;var end_distance:=half-absf(along)
  for across in [-depth,0.0,depth]:
   var x:float=wall.x+c*along+s*across;var z:float=wall.z-s*along+c*across
   if not passable.call(x,z):
    if end_distance>(0.8 if across==0 else depth+0.8):return "Müür läbiks vett või läbimatut mäge."
   elif height.is_valid():levels.append(float(height.call(x,z)))
 if not levels.is_empty() and float(levels.max())-float(levels.min())>1.8:return "Maapind on müüri jaoks liiga järsk."
 return ""
static func snap_ends(points: Array,buildings: Array,range_:=4.0) -> Array:
 if points.size()<2:return points.duplicate(true)
 var result:=points.duplicate(true)
 for i in [0,result.size()-1]:
  var p:=point(result[i]);var other:=point(result[result.size()-1 if i==0 else 0]);var best:Variant=null;var best_score:=INF
  for building in buildings:
   if float(building.get("hp",0))<=0 or building.get("virtual",false) or building.type not in ["watchtower","stonetower","woodgate","gatehouse"]:continue
   var angle:=float(building.get("buildingRotationV228",building.get("wallAngleV175",PI/2 if building.get("wallAxis",false) else 0)));var c:=cos(angle);var s:=sin(angle)
   var dx:float=p.x-building.x;var dz:float=p.y-building.z;var x:=dx*c-dz*s;var z:=dx*s+dz*c
   var gate:bool=building.type in ["woodgate","gatehouse"];var half:=7.0 if gate and building.get("extendedPalisadeV166",false) else 3.5 if gate else 4.7
   var candidates:=[Vector2(-half,0),Vector2(half,0)] if gate else [Vector2(-half,clampf(z,-half,half)),Vector2(half,clampf(z,-half,half)),Vector2(clampf(x,-half,half),-half),Vector2(clampf(x,-half,half),half)]
   var inside:=absf(x)<=half and absf(z)<=(2.0 if gate else half);var limit:=maxf(range_,half+0.5) if inside else range_
   for q in candidates:
    var target:=Vector2(building.x+q.x*c+q.y*s,building.z-q.x*s+q.y*c);var d:=p.distance_to(target);var score:=d+target.distance_to(other)*0.0001
    if d<=limit and score<best_score:best_score=score;best=target
  if best!=null:result[i]=as_point(best)
 return result

static func crosses_gate(wall: Dictionary,gate: Dictionary,clearance:=2.25) -> bool:
 if gate.is_empty() or gate.get("type","") not in ["woodgate","gatehouse"] or float(gate.get("hp",0))<=0:return false
 var span:=float(wall.get("palisadeSpanV167",7));var angle:=float(wall.get("wallAngleV175",PI/2 if wall.get("wallAxis",false) else 0));var samples:=maxi(12,ceili(span*5))
 for i in range(samples+1):
  var v:float=(float(i)/samples-0.5)*span;var x:float=wall.x+cos(angle)*v;var z:float=wall.z-sin(angle)*v
  if absf(x-float(gate.x))<clearance and absf(z-float(gate.z))<clearance:return true
 return false
static func wall_point_inside(p: Vector2,wall: Dictionary,pad:=0.0) -> bool:
 var angle:=float(wall.get("wallAngleV175",PI/2 if wall.get("wallAxis",false) else 0));var span:=float(wall.get("palisadeSpanV167",7));var depth:=2.35 if wall.get("type","")=="palisade" and int(wall.get("woodFortTierV1757",1))==2 else 1.1
 var dx:=p.x-float(wall.x);var dz:=p.y-float(wall.z);var c:=cos(angle);var s:=sin(angle)
 return absf(dx*c-dz*s)<=span/2+pad and absf(dx*s+dz*c)<=depth+pad

static func tower_joins(tower: Dictionary,wall: Dictionary) -> bool:
 if wall.get("type","") not in ["palisade","stonewall","reinforced_wall"]:return false
 var angle:=float(wall.get("wallAngleV175",PI/2 if wall.get("wallAxis",false) else 0));var dx:=float(tower.x)-float(wall.x);var dz:=float(tower.z)-float(wall.z)
 var depth:=2.35 if wall.type=="palisade" and int(wall.get("woodFortTierV1757",1))==2 else 1.1
 return absf(dx*cos(angle)-dz*sin(angle))<=float(wall.get("palisadeSpanV167",7))/2+4.5 and absf(dx*sin(angle)+dz*cos(angle))<=depth+0.5

static func end_points(wall: Dictionary) -> Array:
 var angle:=float(wall.get("buildingRotationV228",wall.get("wallAngleV175",PI/2 if wall.get("wallAxis",false) else 0)))
 var half:=float(wall.get("palisadeSpanV167",14 if wall.get("extendedPalisadeV166",false) else 7))/2
 return [Vector2(float(wall.x)-cos(angle)*half,float(wall.z)+sin(angle)*half),Vector2(float(wall.x)+cos(angle)*half,float(wall.z)-sin(angle)*half)]

static func end_join(first: Dictionary,second: Dictionary) -> bool:
 var a:=first;var b:=second;var gates:=["woodgate","gatehouse"];var towers:=["watchtower","stonetower"]
 if a.get("type","") in towers and b.get("drawnWallV175",false):a=second;b=first
 if a.get("drawnWallV175",false) and b.get("type","") in towers:
  var ends:=end_points(a);var angle:=float(b.get("buildingRotationV228",0));var c:=cos(angle);var s:=sin(angle)
  for i in 2:
   var p:Vector2=ends[i]-Vector2(float(b.x),float(b.z));var o:Vector2=ends[1-i]-Vector2(float(b.x),float(b.z))
   var q:=Vector2(p.x*c-p.y*s,p.x*s+p.y*c);var other:=Vector2(o.x*c-o.y*s,o.x*s+o.y*c);var distance:=maxf(absf(q.x),absf(q.y))
   if distance<3.2 or distance>5.5 or maxf(absf(other.x),absf(other.y))<3.7:continue
   var blocked:=false
   for j in range(1,20):
    var sample:=q.lerp(other,float(j)/20)
    if maxf(absf(sample.x),absf(sample.y))<3.7:blocked=true;break
   if not blocked:return true
  return false
 if a.get("type","") in gates and b.get("drawnWallV175",false):a=second;b=first
 if not a.get("drawnWallV175",false) or (not b.get("drawnWallV175",false) and b.get("type","") not in gates):return false
 var angle:=float(b.get("buildingRotationV228",b.get("wallAngleV175",PI/2 if b.get("wallAxis",false) else 0)));var dx:=float(a.x)-float(b.x);var dz:=float(a.z)-float(b.z)
 if absf(dx*cos(angle)-dz*sin(angle))<float(b.get("palisadeSpanV167",7))/2-0.8 and absf(dx*sin(angle)+dz*cos(angle))<0.4:return false
 for p in end_points(a):
  for q in end_points(b):
   if p.distance_to(q)<=0.8:return true
 return false
