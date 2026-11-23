class_name AINavy
extends RefCounted
const District=preload("res://scripts/district_context.gd")
const Naval=preload("res://scripts/naval_rules.gd")
const Diplomacy=preload("res://scripts/diplomacy_rules.gd")
const Explore=preload("res://scripts/naval_exploration.gd")
const Armies=preload("res://scripts/army_management.gd")
const Discovery=preload("res://scripts/world_discoveries.gd")
const Grid=preload("res://scripts/campaign_grid.gd")
const Campaign=preload("res://scripts/campaign_state.gd")

# The source only orders construction at a working harbor, and funds each ship
# through the same queue used by the player. Expedition and landing AI remain
# separate until their full route and target rules are ported.
static func plan(state: Dictionary,team: int,cells: Array,distances: PackedInt32Array,can_traverse: Callable=Callable(),find_path: Callable=Callable(),territory: Dictionary={},prepare_cell: Callable=Callable(),site_ok: Callable=Callable()) -> void:
 var ships: Array=state.get("ships",[]);var owned: Array=[];var towns: Array=[]
 for ship in ships:
  if int(ship.team)==team and float(ship.hp)>0:owned.append(ship)
 for city in state.cities:
  if int(city.team)==team:towns.append(city)
 var transport:=false;var warship:=false
 for ship in owned:
  if ship.kind=="transport":transport=true
  if ship.kind=="warship":warship=true
 for city in towns:
  var harbor:=false;var queued:=false
  for b in District.all_buildings(city):
   if b.type=="harbor" and b.get("ready",false) and float(b.get("hp",0))>0:harbor=true;break
  for job in city.get("training",[]):
   if job.get("ship",false):queued=true;break
  if not harbor or queued:continue
  var kind: String="transport" if not transport else "warship" if not warship else ""
  if kind.is_empty():continue
  var result:=Naval.queue_ship(state,city,kind,"standard",cells,distances)
  if result.has("queued"):break
 for ship in owned:
  if ship.kind!="warship" or not ship.get("path",[]).is_empty():continue
  for enemy in ships:
   if not Diplomacy.at_war(state,int(enemy.team),team) or float(enemy.hp)<=0:continue
   if not state.explored[team].has(str(int(enemy.c))+":"+str(int(enemy.r))):continue
   var path: Variant=Naval.sea_path(cells,distances,state.research[team].known,Vector2i(int(ship.c),int(ship.r)),Vector2i(int(enemy.c),int(enemy.r)))
   if path!=null:ship.path=path
   break

 # Exploration uses the original navy's real scout, transport and sea paths.
 if not can_traverse.is_valid() or not find_path.is_valid():return
 var enemy_known:=false
 for enemy in state.cities+state.settlers:
  if int(enemy.team)!=team and Diplomacy.at_war(state,int(enemy.team),team) and state.explored[team].has(str(int(enemy.c))+":"+str(int(enemy.r))):enemy_known=true;break
 for ship in owned:
  if ship.kind!="transport":continue
  var combat:Variant=null;var combat_count:=0
  for army in state.armies:
   if int(army.team)!=team or army.get("embarked")!=null:continue
   var count:=Armies.units(state,army).size()
   if count>int(Naval.SHIPS.data.transport.capacity):Armies.split(state,army);break
  for army in state.armies:
   if int(army.team)!=team or army.get("embarked")!=null:continue
   var count:=Armies.units(state,army).size()
   if count>=2 and count<=int(Naval.SHIPS.data.transport.capacity) and count>combat_count:combat=army;combat_count=count
  var cargo: Variant=ship.get("cargo")
  if cargo is Dictionary and cargo.get("kind")=="settler":
   var person: Variant=null
   for candidate in state.settlers:
    if candidate.id==cargo.id:person=candidate;break
   if person==null:continue
   if ship.get("path",[]).is_empty() and ship.get("landing") is Dictionary:
    var destination: Dictionary=ship.landing.duplicate()
    var error:=Naval.disembark_settler(state,ship,destination,cells,func(_team,p):return can_traverse.call(p),func(t,p,r):Campaign.reveal(state,t,int(p.c),int(p.r),r))
    if error.is_empty():person.aiSettlementGoal=destination;person.aiSeaNeeded=false
   elif ship.get("path",[]).is_empty():colonial_voyage(state,ship,person,cells,distances,territory,prepare_cell,site_ok)
   continue
  if cargo==null:
   var waiting: Variant=null
   for person in state.settlers:
    if int(person.team)==team and person.get("embarked")==null and person.get("aiSeaNeeded",false) and person.get("path",[]).is_empty():waiting=person;break
   if waiting!=null:
    if Naval.near(ship,waiting):
     if Naval.embark_settler(state,ship).is_empty():colonial_voyage(state,ship,waiting,cells,distances,territory,prepare_cell,site_ok);continue
    elif ship.get("path",[]).is_empty():
     var ordered:=false
     for dr in range(-1,2):
      for dc in range(-1,2):
       var water:=Vector2i(int(waiting.c)+dc,int(waiting.r)+dr)
       if not Naval.sea_allowed(cells,distances,state.research[team].known,water):continue
       var route: Variant=Naval.sea_path(cells,distances,state.research[team].known,Vector2i(int(ship.c),int(ship.r)),water)
       if route is Array:ship.path=route;ordered=true;break
      if ordered:break
    if not ship.get("path",[]).is_empty():continue
  var passenger: Variant=Naval.cargo_army(state,ship)
  if passenger!=null:
   if invasion(state,ship,passenger,cells,distances,can_traverse,find_path):continue
   if Discovery.army_has_scout(state,passenger):Explore.continue_scout(state,ship,passenger,cells,distances,can_traverse,find_path,territory)
   continue
  if ship.get("cargo")!=null:continue
  if enemy_known:
   if combat==null or float(state.time)<float(state.get("aiPeaceUntil",0)) or not ship.get("path",[]).is_empty():continue
   if not Naval.near(combat,ship):
    var best:Variant=null
    for town in towns:
     for ctx in District.contexts(town):
      var ready:=false
      for building in ctx.economy.buildings:
       if building.type=="harbor" and building.get("ready",false) and not building.get("disabled",false) and float(building.get("hp",0))>0:ready=true;break
      if not ready:continue
      var water:Variant=Naval.harbor_exit(cells,distances,state.research[team].known,Vector2i(int(ctx.c),int(ctx.r)))
      if water==null:continue
      var route:Variant=Naval.sea_path(cells,distances,state.research[team].known,Vector2i(int(ship.c),int(ship.r)),Vector2i(int(water.c),int(water.r)))
      if route is Array and (best==null or route.size()<best.size()):best=route
    if best is Array and not best.is_empty():ship.path=best;continue
   if Naval.near(combat,ship):
    Naval.embark_army(state,ship,int(combat.get("id",0)),cells);continue
   var ordered:=false
   for dr in range(-1,2):
    for dc in range(-1,2):
     var shore={"c":int(ship.c)+dc,"r":int(ship.r)+dr}
     if not can_traverse.call(shore):continue
     var route:Variant=find_path.call(combat,shore,team)
     if route is Array:combat.path=route;ordered=true;break
    if ordered:break
   continue
  var scout: Variant=null
  for army in state.armies:
   if int(army.team)==team and Discovery.army_has_scout(state,army) and Armies.units(state,army).size()<=int(Naval.SHIPS.data.transport.capacity):scout=army;break
  if scout!=null and ship.get("path",[]).is_empty():
   if Naval.near(scout,ship) and scout.get("embarked")==null:
    if Naval.embark_army(state,ship,int(scout.get("id",0)),cells).is_empty():
     Explore.continue_scout(state,ship,scout,cells,distances,can_traverse,find_path,territory);continue
   elif scout.get("embarked")==null and scout.get("path",[]).is_empty():
    var ordered:=false
    for dr in range(-1,2):
     for dc in range(-1,2):
      var coast={"c":int(ship.c)+dc,"r":int(ship.r)+dr}
      if not can_traverse.call(coast):continue
      var path: Variant=find_path.call(scout,coast,team)
      if path is Array:scout.path=path;ordered=true;break
     if ordered:break
  if ship.get("path",[]).is_empty():
   var path: Variant=Explore.sea_path_to_unknown(state,ship,cells,distances)
   if path is Array and not path.is_empty():ship.path=path

# Find the first reachable candidate using one breadth-first sea search. The
# traversal order and 28-site limit are the same as in the source game.
static func colonial_voyage(state: Dictionary,ship: Dictionary,settler: Dictionary,cells: Array,distances: PackedInt32Array,territory: Dictionary,prepare_cell: Callable,site_ok: Callable) -> bool:
 var team:=int(ship.team);var home:=false
 for city in state.cities:
  if int(city.team)==team:home=true;break
 if not home or not ship.get("path",[]).is_empty() or "shipbuilding" not in state.research[team].known or float(ship.get("colonialRetryAt",0))>float(state.time):return false
 ship.colonialRetryAt=float(state.time)+150
 var radius:=48 if "ocean_sailing" in state.research[team].known else 28;var destinations: Array=[]
 for dr in range(-radius,radius+1,2):
  for dc in range(-radius,radius+1,2):
   var c:=int(ship.c)+dc;var r:=int(ship.r)+dr;var key:=str(c)+":"+str(r)
   if c<0 or r<0 or c>=Grid.COLS or r>=Grid.ROWS or territory.has(key):continue
   var cell: Dictionary=cells[r*Grid.COLS+c]
   if not cell.land or cell.get("mountain",false):continue
   var valid:=true
   for city in state.cities:
    if maxi(absi(c-int(city.c)),absi(r-int(city.r)))<10:valid=false;break
   if not valid:continue
   if prepare_cell.is_valid():prepare_cell.call(cell)
   for dir in Grid.DIRECTIONS:
    var water:=Vector2i(c+dir.x,r+dir.y)
    if not Naval.sea_allowed(cells,distances,state.research[team].known,water):continue
    destinations.append({"shore":{"c":c,"r":r},"water":water,"score":absi(dc)+absi(dr)-(6 if cell.get("deposits",{}).get("wood",false) else 0)-(4 if cell.get("deposits",{}).get("ore",false) else 0),"order":destinations.size()});break
 destinations.sort_custom(func(a,b):return a.order<b.order if a.score==b.score else a.score<b.score)
 var start:=Vector2i(int(ship.c),int(ship.r));var first:=start.y*Grid.COLS+start.x
 var previous:=PackedInt32Array();previous.resize(Grid.COLS*Grid.ROWS);previous.fill(-2);previous[first]=-1
 var queue: Array[int]=[first];var head:=0
 while head<queue.size():
  var index:=queue[head];head+=1;var p:=Vector2i(index%Grid.COLS,floori(float(index)/Grid.COLS))
  for dir in Grid.DIRECTIONS:
   var next: Vector2i=p+dir
   if not Naval.sea_allowed(cells,distances,state.research[team].known,next):continue
   var ni: int=next.y*Grid.COLS+next.x
   if previous[ni]!=-2:continue
   previous[ni]=index;queue.append(ni)
 for i in mini(28,destinations.size()):
  var place: Dictionary=destinations[i];var water: Vector2i=place.water;var goal:=water.y*Grid.COLS+water.x
  if previous[goal]==-2 or (site_ok.is_valid() and not site_ok.call(settler,place.shore)):continue
  var path: Array=[];var at:=goal
  while at!=first:path.append({"c":at%Grid.COLS,"r":floori(float(at)/Grid.COLS)});at=previous[at]
  path.reverse();ship.path=path;ship.landing=place.shore;ship.targetKind="colonization";ship.targetCity=null;ship.colonistVoyageV125=true
  return true
 return false

# Original landingRoute: find land connected to the target, then the nearest
# navigable water beside a shore within eight tiles of that target.
static func landing_route(state: Dictionary,ship: Dictionary,target: Dictionary,cells: Array,distances: PackedInt32Array,can_traverse: Callable) -> Variant:
 if not can_traverse.call(target):return null
 var count:=Grid.COLS*Grid.ROWS;var target_index:=int(target.r)*Grid.COLS+int(target.c);var start:=int(ship.r)*Grid.COLS+int(ship.c)
 if target_index<0 or target_index>=count or start<0 or start>=count:return null
 var reached:=PackedByteArray();reached.resize(count);var land:Array[int]=[target_index];reached[target_index]=1;var head:=0
 while head<land.size():
  var idx:=land[head];head+=1;var p:=Vector2i(idx%Grid.COLS,floori(float(idx)/Grid.COLS))
  for d in Grid.DIRECTIONS:
   var next:Vector2i=p+d
   if next.x<0 or next.y<0 or next.x>=Grid.COLS or next.y>=Grid.ROWS:continue
   var ni:int=next.y*Grid.COLS+next.x
   if reached[ni]!=0 or not can_traverse.call({"c":next.x,"r":next.y}):continue
   reached[ni]=1;land.append(ni)
 var previous:=PackedInt32Array();previous.resize(count);previous.fill(-2);previous[start]=-1
 var steps:=PackedInt32Array();steps.resize(count);var water:Array[int]=[start];head=0;var best:Variant=null
 while head<water.size():
  var idx:=water[head];head+=1;var c:=idx%Grid.COLS;var r:=floori(float(idx)/Grid.COLS);var dist:=int(steps[idx])
  if best!=null and dist>int(best.score):break
  for dr in range(-1,2):
   for dc in range(-1,2):
    if dr==0 and dc==0:continue
    var x:=c+dc;var z:=r+dr
    if x<0 or z<0 or x>=Grid.COLS or z>=Grid.ROWS or reached[z*Grid.COLS+x]==0:continue
    if absi(x-int(target.c))>8 or absi(z-int(target.r))>8:continue
    var score:=dist+absi(x-int(target.c))+absi(z-int(target.r))
    if best==null or score<int(best.score):best={"at":idx,"shore":{"c":x,"r":z},"score":score}
  for d in Grid.DIRECTIONS:
   var p:=Vector2i(c+d.x,r+d.y)
   if p.x<0 or p.y<0 or p.x>=Grid.COLS or p.y>=Grid.ROWS:continue
   var ni:=p.y*Grid.COLS+p.x
   if previous[ni]!=-2 or not Naval.sea_allowed(cells,distances,state.research[int(ship.team)].known,p):continue
   previous[ni]=idx;steps[ni]=dist+1;water.append(ni)
 if best==null:return null
 var path:=[];var at:int=best.at
 while at!=start:path.append({"c":at%Grid.COLS,"r":floori(float(at)/Grid.COLS)});at=previous[at]
 path.reverse();return {"shore":best.shore,"water":{"c":int(best.at)%Grid.COLS,"r":floori(float(best.at)/Grid.COLS)},"path":path,"score":best.score}

static func invasion(state: Dictionary,ship: Dictionary,army: Dictionary,cells: Array,distances: PackedInt32Array,can_traverse: Callable,find_path: Callable) -> bool:
 if not ship.get("path",[]).is_empty():return false
 if ship.get("landing") is Dictionary:
  var landing:Dictionary=ship.landing.duplicate();var objective:Variant=null
  var targets:Array=state.get("settlers",[]) if ship.get("targetKind")=="settler" else state.get("cities",[])
  for target in targets:
   if target.get("id")==ship.get("targetCity"):objective=target;break
  var error:=Naval.disembark_army(state,ship,landing,cells,func(_team,p):return can_traverse.call(p),func(t,p,r):Campaign.reveal(state,t,int(p.c),int(p.r),r))
  if not error.is_empty():return false
  if objective is Dictionary and int(objective.team)!=int(army.team):
   var route:Variant=find_path.call(army,objective,int(army.team));army.path=route if route is Array else []
  return true
 var best:Variant=null
 for target in state.get("cities",[])+state.get("settlers",[]):
  if not Diplomacy.at_war(state,int(target.team),int(ship.team)) or not state.explored[int(ship.team)].has(str(int(target.c))+":"+str(int(target.r))):continue
  var route:Variant=landing_route(state,ship,target,cells,distances,can_traverse)
  if route!=null and (best==null or int(route.score)<int(best.route.score)):best={"target":target,"route":route,"kind":"city" if target in state.cities else "settler"}
 if best==null:return false
 ship.path=best.route.path;ship.landing=best.route.shore;ship.targetCity=best.target.id;ship.targetKind=best.kind
 return true
