extends RefCounted
const Walk=preload("res://scripts/wall_walk.gd")
static func distance(a: Dictionary,b: Dictionary) -> float:return Walk.distance(a,b)
static func side(point: Dictionary,center: Dictionary) -> String:
 var x:=float(point.x)-float(center.x);var z:=float(point.z)-float(center.z)
 return ("east" if x>0 else "west") if absf(x)>absf(z) else ("south" if z>0 else "north")
static func split_guards(weights: Dictionary,count:=5) -> Dictionary:
 var total:=0.0
 for key in weights:total+=maxf(0,float(weights[key]))
 var result: Dictionary={};var fractions:=[];var used:=0
 if total<=0:return result
 for key in weights:
  if float(weights[key])<=0:continue
  var exact:=count*float(weights[key])/total;var whole:=floori(exact);result[key]=whole;used+=whole;fractions.append({"key":key,"fraction":exact-whole})
 fractions.sort_custom(func(a,b):return str(a.key)<str(b.key) if absf(float(a.fraction)-float(b.fraction))<0.00000001 else float(a.fraction)>float(b.fraction))
 for i in count-used:
  var key: String=fractions[i%fractions.size()].key;result[key]=int(result[key])+1
 return result
static func guard_route(battle: Dictionary,unit: Dictionary,goal: Dictionary) -> Array:
 var found: Variant=Walk.path(battle,unit,goal);var route: Array=found if found!=null else []
 if route.size()>1 and distance(unit,route[0])<3.3 and absf(float(unit.get("wallElevation",0))-float(route[0].height))<0.5:route.pop_front()
 for i in range(route.size()-1):
  var a: Dictionary=route[i];var next: Dictionary=route[i+1];var dx:=float(next.x)-float(a.x);var dz:=float(next.z)-float(a.z);var length:=sqrt(dx*dx+dz*dz)
  if length>0:a.x=float(a.x)-dz/length*0.55;a.z=float(a.z)+dx/length*0.55
 if not route.is_empty():route[route.size()-1]=goal
 return route
static func plan(battle: Dictionary) -> void:
 var nodes:=Walk.nodes(battle);var roofs:=[]
 for node in nodes:
  if node.get("tower",false):roofs.append(node)
 if roofs.is_empty():return
 var min_x:=INF;var max_x:=-INF;var min_z:=INF;var max_z:=-INF
 for node in nodes:min_x=minf(min_x,node.x);max_x=maxf(max_x,node.x);min_z=minf(min_z,node.z);max_z=maxf(max_z,node.z)
 var center={"x":(min_x+max_x)/2,"z":(min_z+max_z)/2};var guards:=[];var foes:=[];var weights: Dictionary={}
 for unit in battle.squads:
  if float(unit.hp)<=0 or unit.get("reserve",false) or unit.get("retreated",false) or unit.get("routing",false):continue
  if unit.get("towerGuard",false) and unit.get("guardPost",false):guards.append(unit)
  elif not unit.get("towerGuard",false) and unit.team!=battle.fortress.team:
   foes.append(unit);var direction:=side(unit,center);weights[direction]=int(weights.get(direction,0))+1
 battle.guardThreats=weights;var slots: Dictionary={}
 for roof in roofs:
  var own:=[];var reachable:=[];var available: Dictionary={}
  for guard in guards:
   if int(guard.homeTower)==int(roof.index):own.append(guard)
  own.sort_custom(func(a,b):return int(a.guardSlot)<int(b.guardSlot))
  for node in nodes:
   if Walk.path(battle,roof,node)!=null:reachable.append(node)
  for direction in weights:
   for node in reachable:
    if side(node,center)==direction:available[direction]=weights[direction];break
  var allocation:=split_guards(available,own.size());var assignments:=[]
  for direction in allocation:
   for i in int(allocation[direction]):assignments.append(direction)
  var next_tower: Variant=null
  for candidate in roofs:
   if int(candidate.index)==int(roof.index) or Walk.path(battle,roof,candidate)==null:continue
   if next_tower==null or distance(candidate,roof)<distance(next_tower,roof) or (is_equal_approx(distance(candidate,roof),distance(next_tower,roof)) and int(candidate.index)<int(next_tower.index)):next_tower=candidate
  for i in own.size():
   var unit: Dictionary=own[i]
   if unit.get("wallManual",false):continue
   var direction: Variant=assignments[i] if i<assignments.size() else null;unit.guardSector=direction
   if direction==null:
    if unit.get("guardGoal")!=null:unit.guardGoal=null;unit.wallRoute=[]
    unit.guardDuty="patrol";unit.patrolTower=next_tower.index if next_tower!=null else roof.index;continue
   unit.guardDuty="defend";var threats:=[];var candidates:=[]
   for foe in foes:
    if side(foe,center)==direction:threats.append(foe)
   for node in reachable:
    if not node.get("tower",false) and side(node,center)==direction:candidates.append(node)
   if candidates.is_empty():candidates=reachable.duplicate()
   if candidates.is_empty():continue
   candidates.sort_custom(func(a,b):
    var da:=INF;var db:=INF
    for foe in threats:da=minf(da,distance(foe,a));db=minf(db,distance(foe,b))
    return da+float(slots.get(int(a.index),0))*1.5<db+float(slots.get(int(b.index),0))*1.5)
   var node: Dictionary=candidates[0]
   for candidate in candidates:
    if int(slots.get(int(candidate.index),0))<8:node=candidate;break
   var slot:=int(slots.get(int(node.index),0));slots[int(node.index)]=slot+1;var rank:=Walk.rank_point(node,slot,8);var goal: Dictionary=node.duplicate();goal.x=rank.x;goal.z=rank.z
   if unit.get("guardGoal")==null or int(unit.guardGoal.index)!=int(goal.index) or distance(unit.guardGoal,goal)>0.3:unit.guardGoal=goal;unit.wallRoute=guard_route(battle,unit,goal)

static func on_walk(battle: Dictionary,point: Dictionary) -> bool:
 for wall in Walk.nodes(battle):
  var dx:=absf(float(point.x)-float(wall.x));var dz:=absf(float(point.z)-float(wall.z));var axis:=bool(wall.get("wallAxis",false))
  if wall.get("tower",false) and maxf(dx,dz)<=1.7:return true
  if not wall.get("tower",false) and dx<(1.25 if axis else 3.6) and dz<(3.6 if axis else 1.25):return true
 return false
static func point_free(point: Dictionary,peers: Array) -> bool:
 for peer in peers:
  if absf(float(peer.get("elevation",0))-float(point.elevation))<1 and distance(peer,point)<0.71:return false
 return true
static func tick(battle: Dictionary,dt: float) -> void:
 if not battle.get("wallWalkEnabled",false):return
 var has_guards:=false
 for unit in battle.squads:
  if unit.get("towerGuard",false):has_guards=true;break
 if not has_guards:return
 if float(battle.get("elapsed",0))>=float(battle.get("guardPlanAt",-1)):plan(battle);battle.guardPlanAt=float(battle.get("elapsed",0))+4
 for unit in battle.squads:
  if not unit.get("towerGuard",false) or float(unit.hp)<=0 or unit.get("reserve",false) or unit.get("retreated",false) or not unit.get("guardPost",false):continue
  var men: Array=unit.get("men",[])
  if men.is_empty() or float(men[0].hp)<=0 or unit.get("routing",false):continue
  var man: Dictionary=men[0];var home: Variant=null
  for node in Walk.nodes(battle):
   if int(node.index)==int(unit.homeTower):home=node;break
  if home==null:unit.guardPost=false;unit.wallWalk=false;unit.wallElevation=0;man.elevation=0;unit.routing=true;man.routing=true;continue
  var boarder:=false
  for foe in battle.squads:
   if foe.team!=unit.team and float(foe.hp)>0 and not foe.get("retreated",false) and foe.get("guardPost",false) and absf(float(foe.get("wallElevation",0))-float(man.get("elevation",0)))<1.5 and distance(foe,unit)<1.2:boarder=true;break
  if boarder:unit.guardMoving=false;unit.moving=false;man.moving=false;continue
  var route: Array=unit.get("wallRoute",[]) if unit.get("wallRoute") is Array else [];var invalid:=false
  for point in route:
   var exists:=false
   for node in Walk.nodes(battle):
    if int(node.index)==int(point.index):exists=true;break
   if not exists:invalid=true;break
  if invalid:route=[];unit.wallRoute=route;battle.guardPlanAt=0
  if unit.get("guardDuty")=="patrol" and not unit.get("wallManual",false) and route.is_empty():
   unit.patrolWait=maxf(0,float(unit.get("patrolWait",0))-dt)
   if float(unit.patrolWait)>0:continue
   var end: Dictionary=home
   for node in Walk.nodes(battle):
    if int(node.index)==int(unit.homeTower if unit.get("patrolReturning",false) else unit.get("patrolTower",unit.homeTower)):end=node;break
   var goal: Dictionary=end.duplicate();goal.x=float(end.x)+(int(unit.guardSlot)-2)*0.8;goal.z=float(end.z)+(-0.8 if unit.get("patrolReturning",false) else 0.8)
   route=guard_route(battle,unit,goal);unit.wallRoute=route;unit.patrolReturning=not unit.get("patrolReturning",false);unit.patrolWait=2+int(unit.guardSlot)*0.4
  unit.guardMoving=false;unit.moving=false;man.moving=false
  while not route.is_empty():
   var next: Dictionary=route[0];var dx:=float(next.x)-float(unit.x);var dz:=float(next.z)-float(unit.z);var dy:=float(next.get("height",3.8))-float(unit.get("wallElevation",0))
   if sqrt(dx*dx+dz*dz+dy*dy)>=0.12:break
   route.pop_front()
  if not route.is_empty():
   var next: Dictionary=route[0];var dx:=float(next.x)-float(unit.x);var dz:=float(next.z)-float(unit.z);var dy:=float(next.get("height",3.8))-float(unit.get("wallElevation",0));var length:=sqrt(dx*dx+dz*dz+dy*dy);var fraction:=minf(1,2*dt/maxf(0.001,length))
   var target={"x":float(unit.x)+dx*fraction,"z":float(unit.z)+dz*fraction,"elevation":float(unit.get("wallElevation",0))+dy*fraction};var peers:=[]
   for other in battle.squads:
    if is_same(other,unit) or float(other.hp)<=0 or not other.get("guardPost",false):continue
    for person in other.get("men",[]):
     if float(person.hp)>0 and not person.get("escaped",false):peers.append(person)
   var selected: Variant=target
   if not point_free(target,peers) or float(unit.get("guardDetourUntil",0))>float(battle.get("elapsed",0)):
    var angle:=atan2(dz,dx);var angles: Array=[angle+0.8,angle-0.8,angle+1.5,angle-1.5,angle+2.3,angle-2.3,angle+PI]
    if float(unit.get("guardDetourUntil",0))>float(battle.get("elapsed",0)):angles=[float(unit.get("guardDetourAngle",angle)),angle,angle+0.8,angle-0.8]
    selected=null
    for candidate_angle in angles:
     var candidate={"x":float(unit.x)+cos(candidate_angle)*2*dt,"z":float(unit.z)+sin(candidate_angle)*2*dt,"elevation":unit.wallElevation}
     if on_walk(battle,candidate) and point_free(candidate,peers):selected=candidate;unit.guardDetourAngle=candidate_angle;unit.guardDetourUntil=float(battle.get("elapsed",0))+1;break
   if selected!=null and point_free(selected,peers):
    unit.x=selected.x;man.x=selected.x;unit.z=selected.z;man.z=selected.z;unit.wallElevation=selected.elevation;man.elevation=selected.elevation;unit.heading=atan2(dx,dz);man.heading=unit.heading;unit.guardMoving=true;unit.moving=true;man.moving=true
  unit.anchor={"x":unit.x,"z":unit.z};man.elevation=unit.wallElevation

