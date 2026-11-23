class_name NavalRules
extends RefCounted
const Grid=preload("res://scripts/campaign_grid.gd")
const SEA_NEIGHBORS: Array[Vector2i]=[Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1),Vector2i(1,1),Vector2i(1,-1),Vector2i(-1,1),Vector2i(-1,-1)]

static func sea_distances(cells: Array) -> PackedInt32Array:
 var result:=PackedInt32Array();result.resize(cells.size());result.fill(65535)
 var queue:=PackedInt32Array()
 for i in cells.size():
  if cells[i].land:result[i]=0;queue.append(i)
 var cursor:=0
 while cursor<queue.size():
  var index:=queue[cursor];cursor+=1
  var c:=index%Grid.COLS;var r:=floori(float(index)/Grid.COLS)
  for d in SEA_NEIGHBORS:
   var x:=c+d.x;var z:=r+d.y
   if x<0 or x>=Grid.COLS or z<0 or z>=Grid.ROWS:continue
   var neighbor:=z*Grid.COLS+x
   if result[neighbor]<=result[index]+1:continue
   result[neighbor]=result[index]+1;queue.append(neighbor)
 return result

static func sea_allowed(cells: Array,distances: PackedInt32Array,known: Array,p: Vector2i) -> bool:
 if p.x<0 or p.x>=Grid.COLS or p.y<0 or p.y>=Grid.ROWS:return false
 var index:=p.y*Grid.COLS+p.x
 if cells[index].land or "shipbuilding" not in known:return false
 return "ocean_sailing" in known or distances[index]<=(2 if "navigation" in known else 1)

static func sea_path(cells: Array,distances: PackedInt32Array,known: Array,start: Vector2i,goal: Vector2i) -> Variant:
 if not sea_allowed(cells,distances,known,goal):return null
 var first:=start.y*Grid.COLS+start.x
 var queue:=PackedInt32Array([first]);var previous: Dictionary={};previous[first]=-1
 var cursor:=0
 while cursor<queue.size():
  var index:=queue[cursor];cursor+=1
  if index==goal.y*Grid.COLS+goal.x:
   var path: Array=[]
   while index!=first:
    path.push_front({"c":index%Grid.COLS,"r":floori(float(index)/Grid.COLS)})
    index=previous[index]
   return path
  var c:=index%Grid.COLS;var r:=floori(float(index)/Grid.COLS)
  for d in Grid.DIRECTIONS:
   var p:=Vector2i(c+d.x,r+d.y)
   if not sea_allowed(cells,distances,known,p):continue
   var next:=p.y*Grid.COLS+p.x
   if previous.has(next):continue
   previous[next]=index;queue.append(next)
 return null

static func harbor_exit(cells: Array,distances: PackedInt32Array,known: Array,at: Vector2i) -> Variant:
 for dr in range(-1,2):
  for dc in range(-1,2):
   var p:=at+Vector2i(dc,dr)
   if sea_allowed(cells,distances,known,p):return {"c":p.x,"r":p.y}
 return null

static func near(a: Dictionary,b: Dictionary) -> bool:
 return maxi(absi(int(a.c)-int(b.c)),absi(int(a.r)-int(b.r)))<=1

static func embark_settler(state: Dictionary,ship: Dictionary) -> String:
 if ship.get("kind","")!="transport" or ship.get("cargo")!=null:return "Vaja tühja transpordilaeva."
 if not ship.get("path",[]).is_empty():return "Peata laev enne laadimist."
 var settler: Variant=null
 for candidate in state.get("settlers",[]):
  if candidate.team==ship.team and candidate.get("embarked")==null and near(candidate,ship) and candidate.get("path",[]).is_empty():settler=candidate;break
 if settler==null:return "Asunik peab seisma laeva kõrval kaldal."
 settler.embarked=ship.id;settler.landed=false;settler.path=[];settler.localTarget=null
 ship.cargo={"kind":"settler","id":settler.id}
 return ""

static func disembark_settler(state: Dictionary,ship: Dictionary,p: Dictionary,cells: Array,can_traverse: Callable,reveal: Callable=Callable()) -> String:
 var cargo: Variant=ship.get("cargo")
 if cargo==null:return "Laev on tühi."
 var c:=int(p.c);var r:=int(p.r)
 var cell: Variant=cells[r*Grid.COLS+c] if c>=0 and c<Grid.COLS and r>=0 and r<Grid.ROWS else null
 if not ship.get("path",[]).is_empty() or cell==null or not cell.land or cell.get("mountain",false) or not near(ship,p) or not can_traverse.call(ship.team,p):
  return "Maabumiseks vali peatunud laeva kõrval olev ligipääsetav maismaaruut."
 var settler: Variant=null
 if cargo.get("kind","")=="settler":
  for candidate in state.get("settlers",[]):
   if candidate.id==cargo.id:settler=candidate;break
 if settler==null:return "Reisijat ei leitud."
 settler.c=c;settler.r=r;settler.path=[];settler.embarked=null;settler.landed=false;settler.x=0;settler.z=0;settler.travelClock=0
 ship.cargo=null;ship.landing=null;ship.targetCity=null;ship.targetKind=null
 if reveal.is_valid():reveal.call(ship.team,p,2)
 return ""

# Movement and settler transport only; ship combat, upgrades and army cargo are
# handled separately when the corresponding game systems are connected.
static func advance_ship_movement(state: Dictionary,ship: Dictionary,cells: Array,distances: PackedInt32Array,dt: float) -> void:
 if float(ship.get("hp",0))<=0:return
 ship.clock=float(ship.get("clock",0))+dt
 ship.cool=maxf(0.0,float(ship.get("cool",0))-dt)
 var known: Array=state.research[int(ship.team)].known
 var steps:=0
 while float(ship.clock)>=3.0 and steps<100:
  ship.clock-=3.0;steps+=1
  if ship.path.is_empty():continue
  var next: Dictionary=ship.path[0]
  if sea_allowed(cells,distances,known,Vector2i(int(next.c),int(next.r))):
   ship.c=next.c;ship.r=next.r;ship.path.pop_front()
  else:ship.path=[]
 var cargo: Variant=ship.get("cargo")
 if cargo is Dictionary and cargo.get("kind","")=="settler":
  for settler in state.get("settlers",[]):
   if settler.id==cargo.id:settler.c=ship.c;settler.r=ship.r;break

const District=preload("res://scripts/district_context.gd")
const SHIPS=preload("res://data/ships.json")
const Recruitment=preload("res://scripts/military_recruitment.gd")
const Economy=preload("res://scripts/economy_rules.gd")

static func queue_ship(state: Dictionary,city: Dictionary,kind: String,grade: String,cells: Array,distances: PackedInt32Array) -> Dictionary:
 var definition: Dictionary=SHIPS.data.get(kind,{})
 if definition.is_empty():return {"error":"Tundmatu laev."}
 if not Recruitment.GRADES.has(grade):return {"error":"Tundmatu varustustase."}
 var team:=int(city.team);var stock: Dictionary=city.economy.realms[team].resources
 var cost:=Recruitment.troop_cost(definition,grade)
 if "shipbuilding" not in state.research[team].known:return {"error":"Uuri laevaehitust."}
 var harbor_context: Variant=null;var exit: Variant=null
 for ctx in District.contexts(city):
  for building in ctx.economy.buildings:
   if building.type!="harbor" or not building.get("ready",false) or building.get("disabled",false) or float(building.get("hp",0))<=0:continue
   var candidate: Variant=harbor_exit(cells,distances,state.research[team].known,Vector2i(int(ctx.c),int(ctx.r)))
   if candidate!=null:harbor_context=ctx;exit=candidate;break
  if harbor_context!=null:break
 if exit==null:return {"error":"Vaja valmis rannikusadamat."}
 if not city.has("training"):city.training=[]
 if city.training.size()>=4:return {"error":"Tööjärjekord on täis."}
 if not Economy.can_afford(stock,cost):return {"error":"Laeva jaoks napib materjale."}
 Economy.spend_resources(stock,cost)
 var job={"kind":kind,"grade":grade,"paidCost":cost,"ship":true,"team":team,"harbor":{"c":harbor_context.c,"r":harbor_context.r},"total":float(definition.time)*Economy.tempo_factor(state),"progress":0,"assigned":0,"efficiency":0}
 city.training.append(job);return {"queued":job}

static func finish_ship(state: Dictionary,city: Dictionary,job: Dictionary,cells: Array,distances: PackedInt32Array) -> bool:
 var team:=int(city.team);var exit: Variant=harbor_exit(cells,distances,state.research[team].known,Vector2i(int(job.harbor.c),int(job.harbor.r)))
 if exit==null:job.status="Sadama väljapääs puudub";return false
 if not state.has("ships"):state.ships=[]
 if not state.has("nextShip"):state.nextShip=0
 var grade: String=job.get("grade","standard");var hp: float=SHIPS.data[job.kind].hp*Recruitment.GRADES.get(grade,Recruitment.GRADES.standard).strength
 state.ships.append({"id":state.nextShip,"kind":job.kind,"team":team,"c":exit.c,"r":exit.r,"grade":grade,"hp":hp,"path":[],"clock":0,"cool":0,"cargo":null})
 state.nextShip=int(state.nextShip)+1;return true

const Army=preload("res://scripts/army_experience.gd")
const Diplomacy=preload("res://scripts/diplomacy_rules.gd")
const Bonuses=preload("res://scripts/production_bonuses.gd")

static func cargo_army(state: Dictionary,ship: Dictionary) -> Variant:
 var cargo: Variant=ship.get("cargo")
 if not cargo is Dictionary or cargo.get("kind")!="army":return null
 for army in state.get("armies",[]):
  if int(army.team)==int(ship.team) and int(army.get("id",0))==int(cargo.get("armyId",0)):return army
 return null

static func embark_army(state: Dictionary,ship: Dictionary,army_id: int,cells: Array) -> String:
 if ship.get("kind","")!="transport" or ship.get("cargo")!=null:return "Vaja tühja transpordilaeva."
 if not ship.get("path",[]).is_empty():return "Peata laev enne laadimist."
 var army: Variant=null
 for candidate in state.get("armies",[]):
  if int(candidate.team)==int(ship.team) and int(candidate.get("id",0))==army_id:army=candidate;break
 var units: Array=[]
 if army!=null:
  for unit in state.get("units",[]):
   if int(unit.team)==int(army.team) and float(unit.get("hp",0))>0 and not Army.is_garrisoned(unit) and int(unit.get("armyId",0))==int(army.get("id",0)):units.append(unit)
 var on_land:=false
 if army!=null:
  var c:=int(army.c);var r:=int(army.r)
  on_land=c>=0 and c<Grid.COLS and r>=0 and r<Grid.ROWS and cells[r*Grid.COLS+c].land
 if army==null or army.get("embarked")!=null or not near(ship,army) or not on_land or not army.get("path",[]).is_empty() or units.is_empty():return "Valitud armee peab seisma laeva kõrval kaldal."
 if units.size()>int(SHIPS.data.transport.capacity):return "Laeva mahub kuni 6 väesalka."
 if state.get("battle")!=null:return "Lõpeta esmalt lahing."
 army.embarked=ship.id;army.path=[];army.autoExplore=bool(army.get("autoExplore",false))
 ship.cargo={"kind":"army","team":ship.team,"armyId":int(army.get("id",0))};ship.boardingLand={"c":army.c,"r":army.r}
 return ""

static func disembark_army(state: Dictionary,ship: Dictionary,p: Dictionary,cells: Array,can_traverse: Callable,reveal: Callable=Callable()) -> String:
 if ship.get("cargo")==null:return "Laev on tühi."
 var c:=int(p.c);var r:=int(p.r);var cell: Variant=cells[r*Grid.COLS+c] if c>=0 and c<Grid.COLS and r>=0 and r<Grid.ROWS else null
 if not ship.get("path",[]).is_empty() or cell==null or not cell.land or cell.get("mountain",false) or not near(ship,p) or not can_traverse.call(ship.team,p):return "Maabumiseks vali peatunud laeva kõrval olev ligipääsetav maismaaruut."
 var army: Variant=cargo_army(state,ship)
 if army==null:return "Reisijat ei leitud."
 army.c=c;army.r=r;army.path=[];army.embarked=null;army.landed=false;army.x=0;army.z=0;army.travelClock=0
 ship.cargo=null;ship.landing=null;ship.targetCity=null;ship.targetKind=null
 if reveal.is_valid():reveal.call(ship.team,p,2)
 return ""

static func sink(state: Dictionary,ship: Dictionary) -> void:
 var cargo: Variant=ship.get("cargo")
 if cargo is Dictionary and cargo.get("kind")=="army":
  var army: Variant=cargo_army(state,ship)
  if army!=null:
   for unit in state.get("units",[]):
    if int(unit.team)==int(army.team) and float(unit.get("hp",0))>0 and not Army.is_garrisoned(unit) and int(unit.get("armyId",0))==int(army.get("id",0)):unit.hp=0
   army.embarked=null;army.path=[]
 elif cargo is Dictionary and cargo.get("kind")=="settler":
  for settler in state.get("settlers",[]).duplicate():
   if settler.id==cargo.id:state.settlers.erase(settler)
 ship.cargo=null;ship.path=[];ship.hp=0

static func tick_fleet(state: Dictionary,cells: Array,distances: PackedInt32Array,dt: float) -> void:
 for ship in state.get("ships",[]):
  if float(ship.get("hp",0))<=0:continue
  var level:=Bonuses.upgrade_level(state,int(ship.team));var old:=int(ship.get("upgrade",0))
  var grade: String=ship.get("grade","standard");var strength: float=Recruitment.GRADES.get(grade,Recruitment.GRADES.standard).strength
  var definition: Dictionary=SHIPS.data[ship.kind]
  if level>old:ship.hp=float(ship.hp)+(level-old)*float(definition.hp)*0.15*strength
  ship.upgrade=level;ship.maxHp=float(definition.hp)*strength*(1+level*0.15)
  advance_ship_movement(state,ship,cells,distances,dt)
  var passenger: Variant=cargo_army(state,ship)
  if passenger!=null:passenger.c=ship.c;passenger.r=ship.r
  var foe: Dictionary={}
  for enemy in state.ships:
   if Diplomacy.at_war(state,int(enemy.team),int(ship.team)) and float(enemy.get("hp",0))>0 and near(ship,enemy):foe=enemy;break
  if not foe.is_empty() and float(ship.cool)==0:
   foe.hp=maxf(0,float(foe.hp)-float(definition.damage)*strength*(1+level*0.2))
   ship.cool=2;ship.attackAt=state.time;foe.hitAt=state.time
   if float(foe.hp)<=0:sink(state,foe)
