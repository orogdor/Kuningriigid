extends RefCounted
const Contact=preload("res://scripts/battle_contact.gd")

static func distance(a: Dictionary,b: Dictionary) -> float:
 return Vector2(float(a.x)-float(b.x),float(a.z)-float(b.z)).length()

static func nodes(battle: Dictionary) -> Array:
 var out:=[]
 for wall in battle.get("siegeSections",[]):
  if float(wall.hp)>0 and not wall.get("breached",false) and wall.get("walkable",false):out.append(wall)
 return out

static func nearest(battle: Dictionary,point: Dictionary) -> Variant:
 var best: Variant=null
 for wall in nodes(battle):
  if best==null or distance(wall,point)<distance(best,point):best=wall
 return best

static func rank_point(wall: Dictionary,index: int,count: int) -> Dictionary:
 var columns:=mini(8,maxi(1,count));var rows:=ceili(float(count)/columns)
 var along: float=(index%columns-(columns-1)/2.0)*0.82;var across: float=(floori(float(index)/columns)-(rows-1)/2.0)*0.85
 var axis:=bool(wall.get("wallAxis",false))
 return {"x":float(wall.x)+(across if axis else along),"z":float(wall.z)+(along if axis else across)}

static func path(battle: Dictionary,start_point: Dictionary,end_point: Dictionary) -> Variant:
 var walls:=nodes(battle);var start: Variant=null;var end: Variant=null
 for wall in walls:
  if start_point.has("index") and wall.index==start_point.index:start=wall
  if end_point.has("index") and wall.index==end_point.index:end=wall
 if start==null:start=nearest(battle,start_point)
 if end==null:end=nearest(battle,end_point)
 if start==null or end==null:return null
 var queue: Array=[start];var previous: Dictionary={int(start.index):null};var head:=0
 while head<queue.size():
  var current: Dictionary=queue[head];head+=1
  if int(current.index)==int(end.index):break
  for other in walls:
   if previous.has(int(other.index)) or distance(current,other)>7.2:continue
   if not current.get("tower",false) and not other.get("tower",false) and absf(float(current.get("height",3.8))-float(other.get("height",3.8)))>=0.5:continue
   previous[int(other.index)]=current;queue.append(other)
 if not previous.has(int(end.index)):return null
 var route:=[];var current: Variant=end
 while current!=null:
  route.push_front({"x":current.x,"z":current.z,"index":current.index,"height":current.get("height",3.8)})
  current=previous[int(current.index)]
 return route

static func entries(battle: Dictionary,unit: Dictionary,include_stairs: bool) -> Array:
 var out: Array=battle.get("wallStairs",[]).duplicate(true) if include_stairs else []
 for work in battle.get("siegeWorks",[]):
  if work.kind in ["ladder","tower"] and work.team==unit.team and work.get("ready",false) and work.get("arrived",false) and not work.get("destroyed",false):out.append({"x":work.wallX,"z":work.wallZ,"groundX":float(work.wallX)-float(work.inwardX)*5,"groundZ":float(work.wallZ)-float(work.inwardZ)*5,"height":work.get("height",3.8)})
 out.sort_custom(func(a,b):return distance(a,unit)<distance(b,unit))
 return out

static func order(battle: Dictionary,unit: Dictionary,point: Dictionary,nav: Variant=null) -> Variant:
 if not battle.get("wallWalkEnabled",false) or Contact.troop_role(unit.kind) not in ["melee","ranged"]:return null
 var wall: Variant=nearest(battle,point)
 if wall==null or distance(wall,point)>4:
  if not unit.get("guardPost",false):return null
  for entry in entries(battle,unit,true):
   if path(battle,unit,entry)==null or (nav!=null and nav.route({"x":entry.groundX,"z":entry.groundZ},point)==null):continue
   unit.wallExit=entry.duplicate(true);unit.wallExit.destination=point.duplicate(true);unit.wallExit.progress=0.0;unit.wallRoute=path(battle,unit,entry);unit.wallManual=true
   return {"ok":true}
  return {"error":"Puudub ühendatud trepp või redel."}
 if unit.get("guardPost",false):
  var route: Variant=path(battle,unit,wall)
  if route==null:return {"error":"Müürikäik on katkenud."}
  unit.wallRoute=route;unit.wallDestination={"x":wall.x,"z":wall.z};unit.wallManual=true
  return {"ok":true}
 for entry in entries(battle,unit,int(unit.team)==int(battle.fortress.team)):
  if path(battle,entry,wall)==null or (nav!=null and nav.route(unit,{"x":entry.groundX,"z":entry.groundZ})==null):continue
  for man in unit.get("men",[]):man.erase("siegeClimbed");man.erase("siegeClimbing");man.erase("siegeClimbFrom")
  unit.wallClimb={"entry":entry.duplicate(true),"destination":{"x":wall.x,"z":wall.z},"progress":0};unit.target={"x":entry.groundX,"z":entry.groundZ};unit.manualOrder=true;unit.attackTargetSource=null
  return {"ok":true}
 return {"error":"Müürile pääsemiseks vii valmis redel või piiramistorn müürini."}

static func reserve(battle: Dictionary,preferred: Dictionary,occupied: Array) -> Dictionary:
 var walls:=nodes(battle)
 walls.sort_custom(func(a,b):return distance(a,preferred)<distance(b,preferred))
 if walls.is_empty():return preferred
 var candidates:=[];var near: Dictionary=walls[0];var axis:=bool(near.get("wallAxis",false));var limit:=1.55 if near.get("tower",false) else 3.3;var width:=1.55 if near.get("tower",false) else 0.85
 var along:=clampf(float(preferred.z)-float(near.z) if axis else float(preferred.x)-float(near.x),-limit,limit)
 var across:=clampf(float(preferred.x)-float(near.x) if axis else float(preferred.z)-float(near.z),-width,width)
 candidates.append({"x":float(near.x)+(across if axis else along),"z":float(near.z)+(along if axis else across)})
 for wall in walls:
  var points:=[]
  for i in 16:
   var point:=rank_point(wall,i,16)
   if not wall.get("tower",false) or maxf(absf(float(point.x)-float(wall.x)),absf(float(point.z)-float(wall.z)))<=1.6:points.append(point)
  points.sort_custom(func(a,b):return distance(a,preferred)<distance(b,preferred));candidates.append_array(points)
 for point in candidates:
  var free:=true
  for old in occupied:
   if distance(point,old)<0.705:free=false;break
  if free:occupied.append(point);return point
 return preferred

static func tick(battle: Dictionary,dt: float,nav: Variant=null) -> void:
 if not battle.get("wallWalkEnabled",false):return
 var occupied:=[]
 for unit in battle.squads:
  if unit.get("towerGuard",false) and float(unit.hp)>0 and not unit.get("reserve",false) and not unit.get("retreated",false) and unit.get("guardPost",false):
   for man in unit.get("men",[]):
    if float(man.hp)>0:occupied.append({"x":man.x,"z":man.z})
 for unit in battle.squads:
  if float(unit.hp)<=0 or unit.get("reserve",false) or unit.get("retreated",false) or unit.get("towerGuard",false):continue
  var work: Variant=null
  for candidate in battle.get("siegeWorks",[]):
   if candidate.kind not in ["ladder","tower"] or candidate.team!=unit.team or not candidate.get("ready",false) or not candidate.get("arrived",false) or candidate.get("destroyed",false):continue
   if candidate.ownerSource!=unit.source and (unit.get("combatMode","auto")!="auto" or unit.get("manualOrder",false) or distance(unit,candidate)>=220):continue
   if work==null or distance(unit,candidate)<distance(unit,work):work=candidate
  if work!=null and not unit.get("guardPost",false) and unit.get("wallClimb")==null and not unit.get("wallAssaulted",false) and nav!=null:
   var result: Variant=order(battle,unit,{"x":work.wallX,"z":work.wallZ},nav)
   if result is Dictionary and result.get("ok",false):unit.wallAssaulted=true
  if unit.get("wallExit") is Dictionary and unit.get("guardPost",false) and distance(unit,unit.wallExit)<1:
   var exit: Dictionary=unit.wallExit;exit.progress=float(exit.progress)+dt/maxf(3,float(exit.get("height",3.8))/0.9);unit.wallElevation=float(exit.get("height",3.8))*(1-minf(1,float(exit.progress)))
   for man in unit.get("men",[]):man.moving=true;man.elevation=unit.wallElevation
   if float(exit.progress)>=1:
    unit.guardPost=false;unit.wallWalk=false;unit.wallElevation=0;unit.x=exit.groundX;unit.z=exit.groundZ;unit.anchor={"x":unit.x,"z":unit.z}
    for i in unit.get("men",[]).size():
     var man: Dictionary=unit.men[i];man.x=float(unit.x)+(i%4-1.5)*0.75;man.z=float(unit.z)+floori(float(i)/4)*0.75;man.elevation=0
    var open: Variant=nav.nearest(exit.destination,12) if nav!=null else exit.destination
    unit.target=open if open!=null else exit.destination;unit.manualOrder=true;unit.erase("wallExit")
   continue
  if unit.get("wallClimb") is Dictionary and not unit.get("guardPost",false):
   var climb: Dictionary=unit.wallClimb;var entry: Dictionary=climb.entry;var dx:=float(entry.x)-float(entry.groundX);var dz:=float(entry.z)-float(entry.groundZ);var length:=sqrt(dx*dx+dz*dz)
   if length==0:length=1
   var nx:=dx/length;var nz:=dz/length;var alive:=[];var waiting:=[];var active:=0
   for man in unit.get("men",[]):
    if float(man.hp)<=0 or man.get("escaped",false):continue
    alive.append(man)
    if not man.get("siegeClimbed",false):
     waiting.append(man)
     if man.get("siegeClimbing")!=null:active+=1
   var slots:=maxi(0,2-active)
   for rank in waiting.size():
    var man: Dictionary=waiting[rank]
    if man.get("siegeClimbing")==null:
     var row:=floori(float(rank)/2);var side:=0.42 if rank%2 else -0.42
     var queue={"x":float(entry.groundX)-nx*row*0.9-nz*side,"z":float(entry.groundZ)-nz*row*0.9+nx*side}
     if nav!=null:nav.move(man,queue,dt,3.6,float(battle.get("elapsed",0)))
     man.elevation=0
     if row==0 and distance(man,queue)<0.55 and slots>0:man.siegeClimbing=0.0;man.siegeClimbFrom={"x":man.x,"z":man.z};slots-=1
    if man.get("siegeClimbing")!=null:
     man.siegeClimbing=minf(1,float(man.siegeClimbing)+dt/maxf(3,float(entry.get("height",3.8))/0.9));var t:=float(man.siegeClimbing)
     man.x=lerpf(float(man.siegeClimbFrom.x),float(entry.x),t);man.z=lerpf(float(man.siegeClimbFrom.z),float(entry.z),t);man.elevation=t*float(entry.get("height",3.8));man.moving=true;man.heading=atan2(nx,nz)
     if t>=1:man.siegeClimbed=true;man.erase("siegeClimbing")
   var boarded:=[]
   for man in alive:
    if man.get("siegeClimbed",false):boarded.append(man)
   var wall: Variant=nearest(battle,entry)
   if wall!=null:
    var base: Dictionary=wall.duplicate();base.x=entry.x;base.z=entry.z
    for i in boarded.size():
     var man: Dictionary=boarded[i];var desired:=rank_point(base,i,alive.size());var at: Variant=nearest(battle,desired)
     if at==null:at=wall
     var point:=reserve(battle,desired,occupied);man.x=point.x;man.z=point.z;man.elevation=at.get("height",entry.get("height",3.8))
   if not alive.is_empty():
    var x:=0.0;var z:=0.0
    for man in alive:x+=float(man.x);z+=float(man.z)
    unit.x=x/alive.size();unit.z=z/alive.size();unit.anchor={"x":unit.x,"z":unit.z}
   climb.progress=float(boarded.size())/alive.size() if not alive.is_empty() else 0
   if not waiting.is_empty():continue
   unit.guardPost=true;unit.wallType=wall.get("type","stonewall") if wall!=null else "stonewall";unit.wallWalk=true;unit.x=entry.x;unit.z=entry.z;unit.anchor={"x":unit.x,"z":unit.z};unit.manualOrder=false;unit.target=null
   var route: Variant=path(battle,unit,climb.destination);unit.wallRoute=route if route!=null else [];unit.wallManual=false;unit.erase("wallClimb")
  if not unit.get("guardPost",false) or not unit.get("wallWalk",false):continue
  var fallen: Variant=null
  for wall in battle.get("siegeSections",[]):
   if wall.get("walkable",false) and (float(wall.hp)<=0 or wall.get("breached",false)) and distance(wall,unit)<3.6:fallen=wall;break
  if fallen!=null:
   unit.guardPost=false;unit.wallWalk=false;unit.wallElevation=0;unit.wallRoute=null
   var safe: Variant=nav.nearest(unit,10) if nav!=null else null
   if safe!=null:unit.x=safe.x;unit.z=safe.z
   unit.anchor={"x":unit.x,"z":unit.z};unit.hp=0.0
   for i in unit.get("men",[]).size():
    var man: Dictionary=unit.men[i];man.hp=float(man.hp)*0.8;man.elevation=0;man.x=float(unit.x)+(i%4-1.5)*0.75;man.z=float(unit.z)+floori(float(i)/4)*0.75;unit.hp=float(unit.hp)+float(man.hp)
   continue
  var invalid:=false
  for point in unit.get("wallRoute",[]) if unit.get("wallRoute") is Array else []:
   var found:=false
   for wall in battle.get("siegeSections",[]):
    if wall.index==point.index and float(wall.hp)>0 and not wall.get("breached",false):found=true;break
   if not found:invalid=true;break
  if invalid:
   var route: Variant=path(battle,unit,unit.get("wallDestination",unit.get("wallExit",unit)));unit.wallRoute=route if route!=null else []
  var here: Variant=nearest(battle,unit)
  if here==null or distance(here,unit)>8:unit.guardPost=false;unit.wallWalk=false;unit.wallElevation=0;unit.wallRoute=null;continue
  if unit.get("routing",false) and unit.get("wallExit")==null:
   order(battle,unit,{"x":battle.fortress.x,"z":battle.fortress.z},nav);unit.routing=false
   for man in unit.get("men",[]):man.routing=false
  if not unit.get("wallManual",false) and (not unit.get("wallRoute") is Array or unit.wallRoute.is_empty() or float(battle.get("elapsed",0))>=float(unit.get("wallReplan",0))):
   var threat: Variant=null
   for foe in battle.squads:
    if foe.team==unit.team or float(foe.hp)<=0 or foe.get("retreated",false) or foe.get("reserve",false):continue
    if threat==null or distance(unit,foe)<distance(unit,threat):threat=foe
   if threat!=null:
    var route: Variant=path(battle,unit,threat);unit.wallRoute=route if route!=null else [];unit.wallReplan=float(battle.get("elapsed",0))+7
  var route: Array=unit.wallRoute if unit.get("wallRoute") is Array else []
  if not route.is_empty() and distance(unit,route[0])<0.12:route.pop_front()
  unit.moving=false
  if not route.is_empty():
   var next: Dictionary=route[0];var d:=distance(unit,next);var step:=minf(d,2*dt)
   if d>0:unit.heading=atan2(float(next.x)-float(unit.x),float(next.z)-float(unit.z));unit.x=float(unit.x)+(float(next.x)-float(unit.x))/d*step;unit.z=float(unit.z)+(float(next.z)-float(unit.z))/d*step;unit.moving=step>0
  unit.anchor={"x":unit.x,"z":unit.z};here=nearest(battle,unit)
  if here==null:continue
  unit.wallElevation=here.get("height",3.8);unit.wallType=here.get("type",unit.get("wallType","stonewall"))
  var base: Dictionary=here.duplicate();base.x=unit.x;base.z=unit.z
  for i in unit.get("men",[]).size():
   var man: Dictionary=unit.men[i]
   if float(man.hp)<=0:continue
   var desired:=rank_point(base,i,unit.men.size());var at: Variant=nearest(battle,desired)
   if at==null:at=here
   var point:=reserve(battle,desired,occupied);man.x=point.x;man.z=point.z;man.moving=unit.moving;man.elevation=at.get("height",3.8)
