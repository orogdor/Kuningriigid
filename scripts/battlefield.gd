class_name BattleField
extends RefCounted
const State=preload("res://scripts/battle_state.gd")
const Grid=preload("res://scripts/campaign_grid.gd")
static func identity(u: Dictionary) -> String:
 return str(int(u.team))+":"+str(int(u.get("armyId",0)))
static func withdraw(b: Dictionary,u: Dictionary) -> void:
 var key:=identity(u)
 for q in b.squads:
  if identity(q)!=key or float(q.hp)<=0 or q.get("retreated",false):continue
  q.routing=true;q.withdrawing=true;q.manualOrder=false;q.target=null
  for man in q.get("men",[]):
   if float(man.hp)>0 and not man.get("escaped",false):man.routing=true
static func check_retreats(b: Dictionary) -> void:
 if not b.has("field") or b.field==null:return
 if not b.has("retreatedArmies"):b.retreatedArmies=[]
 if not b.get("individualVersion",false):
  for u in b.squads:
   if float(u.hp)<=0 or u.get("retreated",false) or u.get("civilian",false) or u.get("guardPost",false) or not State.outside(u):continue
   var key:=identity(u);var exists:=false
   for record in b.retreatedArmies:
    if identity(record)==key:exists=true;break
   if not exists:b.retreatedArmies.append({"team":u.team,"armyId":u.get("armyId",0),"exit":{"x":u.x,"z":u.z},"at":b.elapsed})
   for q in b.squads:
    if not q.get("civilian",false) and not q.get("guardPost",false) and identity(q)==key:q.retreated=true;q.target=null;q.advance=false;q.moving=false
  return
 for u in b.squads:
  if not u.has("men") or u.get("retreated",false) or u.get("reserve",false) or (u.get("guardPost",false) and not u.get("routing",false)):continue
  for man in u.men:
   if float(man.hp)<=0 or man.get("escaped",false) or not State.outside(man):continue
   if u.get("manualOrder",false) and not u.get("routing",false):withdraw(b,u)
   man.escaped=true;man.escapedAt=b.elapsed;man.moving=false;u.lastExit={"x":man.x,"z":man.z}
  var alive:=0;var escaped:=0
  for man in u.men:
   if float(man.hp)>0:
    alive+=1
    if man.get("escaped",false):escaped+=1
  if alive>0 and alive==escaped:u.retreated=true;u.target=null;u.moving=false
 for u in b.squads:
  if not u.get("retreated",false) or u.get("civilian",false) or u.get("guardPost",false):continue
  var key:=identity(u);var count:=0;var all:=true;var exists:=false
  for q in b.squads:
   if identity(q)==key and not q.get("civilian",false) and not q.get("guardPost",false) and not q.get("reserve",false) and float(q.hp)>0:
    count+=1
    if not q.get("retreated",false):all=false
  for record in b.retreatedArmies:
   if identity(record)==key:exists=true;break
  if count>0 and all and not exists:b.retreatedArmies.append({"team":u.team,"armyId":u.get("armyId",0),"exit":u.get("lastExit",{"x":u.x,"z":u.z}),"at":b.elapsed})
static func apply_retreats(state: Dictionary,b: Dictionary,can_traverse: Callable,find_path: Callable) -> void:
 for record in b.get("retreatedArmies",[]):
  if record.get("applied",false):continue
  var army: Variant=null
  for candidate in state.armies:
   if int(candidate.team)==int(record.team) and int(candidate.get("id",0))==int(record.armyId):army=candidate;break
  if army==null:record.applied=true;continue
  var dc:=floori((float(record.exit.x)+112.5)/225.0);var dr:=floori((float(record.exit.z)+97.5)/195.0)
  var preferred={"c":int(b.cell.c)+dc,"r":int(b.cell.r)+dr};var candidates: Array=[{"c":preferred.c,"r":preferred.r,"order":0}]
  for r in range(-4,5):
   for c in range(-4,5):
    if c!=0 or r!=0:candidates.append({"c":int(b.cell.c)+c,"r":int(b.cell.r)+r,"order":candidates.size()})
  candidates.sort_custom(func(a,bb):
   var da:=pow(float(a.c-preferred.c),2)+pow(float(a.r-preferred.r),2);var db:=pow(float(bb.c-preferred.c),2)+pow(float(bb.r-preferred.r),2)
   return a.order<bb.order if da==db else da<db)
  var destination: Variant=null
  for p in candidates:
   if int(p.c)<0 or int(p.r)<0 or int(p.c)>=Grid.COLS or int(p.r)>=Grid.ROWS or not can_traverse.call(record.team,p):continue
   var occupied:=false
   for rival in state.armies:
    if int(rival.team)==int(record.team) or rival.get("embarked")!=null or int(rival.c)!=int(p.c) or int(rival.r)!=int(p.r):continue
    for unit in state.units:
     if float(unit.hp)>0 and int(unit.team)==int(rival.team) and int(unit.get("armyId",0))==int(rival.get("id",0)):occupied=true;break
    if occupied:break
   if occupied:continue
   for city in state.cities:
    if int(city.c)==int(p.c) and int(city.r)==int(p.r) and int(city.team)!=int(record.team):occupied=true;break
   if occupied or find_path.call(b.cell,p,record.team)==null:continue
   destination=p;break
  if destination!=null:army.c=destination.c;army.r=destination.r
  else:army.retreatUntil=float(state.time)+30
  army.path=[];army.autoExplore=false;army.travelClock=0;army.travelDuration=0;army.erase("rallyTarget")
  record.destination={"c":army.c,"r":army.r};record.applied=true
  if not state.has("deployments"):state.deployments={}
  var key:=str(int(army.c))+":"+str(int(army.r))
  if not state.deployments.has(key):state.deployments[key]={}
  for q in b.squads:
   if q.get("retreated",false) and int(q.team)==int(record.team) and int(q.get("armyId",0))==int(record.armyId) and int(q.source)>=0:
    state.deployments[key][str(int(q.source))]={"x":clampf(float(record.exit.x)-dc*225,-102.5,102.5),"z":clampf(float(record.exit.z)-dr*195,-87.5,87.5),"heading":q.get("heading",0),"target":null}
