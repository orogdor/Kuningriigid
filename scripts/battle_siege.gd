class_name BattleSiege
extends RefCounted
const BLOCKING_FORTIFICATIONS=["palisade","woodgate","stonewall","reinforced_wall","gatehouse","watchtower","stonetower","keep"]
const Diplomacy=preload("res://scripts/diplomacy_rules.gd")
const Districts=preload("res://scripts/district_context.gd")
const Rules=preload("res://scripts/battle_siege_rules.gd")
const WALL_SECTIONS=["palisade","woodgate","stonewall","reinforced_wall","gatehouse"]

static func supported(_city: Dictionary) -> bool:
 return true

static func mobilize(battle: Dictionary,city: Dictionary) -> void:
 var realm: Dictionary=city.economy.realms[city.team];var hall: Dictionary={}
 for building in city.economy.buildings:
  if building.type=="hall":hall=building;break
 if hall.is_empty():return
 battle.civilianCityId=city.id
 for i in mini(24,floori(float(realm.pop)/2)):
  battle.squads.append({"source":-1-i,"civilian":true,"team":city.team,"kind":"militia","hp":36,"maxHp":36,"morale":100,"x":float(hall.x)+(i%6-2.5)*2,"z":float(hall.z)+floori(float(i)/6)*2+5,"heading":0,"cool":0,"target":null,"advance":true})

static func attach_sections(battle: Dictionary,city: Dictionary) -> void:
 if not battle.get("fortress") is Dictionary:return
 battle.siegeSections=[]
 for index in city.economy.buildings.size():
  var building: Dictionary=city.economy.buildings[index]
  if building.get("type","") not in WALL_SECTIONS or not building.get("ready",false) or float(building.get("hp",0))<=0 or building.get("disabled",false):continue
  Rules.prepare_wall(building)
  var high: bool=building.type in ["palisade","woodgate"] and int(building.get("woodFortTierV1757",1))==2
  var profile: Dictionary=Rules.PROFILES.get(building.type,{})
  battle.siegeSections.append({"walkable":building.type not in ["palisade","woodgate"] or high,"height":7.25 if high else float(profile.get("height",3.8)),"index":index,"type":building.type,"x":building.x,"z":building.z,"team":building.team,"wallAxis":building.get("wallAxis",0),"hp":building.hp,"maxHp":building.get("damageMaxHp",building.hp),"breached":float(building.hp)<=0})
 battle.siegeProtected=not battle.siegeSections.is_empty()
 battle.keepProtected=false
 for building in city.economy.buildings:
  if building.get("type")=="keep" and building.get("ready",false) and float(building.get("hp",0))>0 and not building.get("disabled",false):battle.keepProtected=true;break
 battle.fortress.keepBonus=180 if battle.keepProtected else 0
 battle.fortress.hp=float(battle.fortress.hp)+battle.fortress.keepBonus
 battle.fortress.maxHp=float(battle.fortress.maxHp)+battle.fortress.keepBonus

static func fortify_unprotected(battle: Dictionary,city: Dictionary) -> void:
 battle.wallWalkEnabled=true;battle.fortress.defenseBonus=0
 battle.siegeSections=[];battle.siegeProtected=false;battle.keepProtected=false
 battle.fortress.keepBonus=0;battle.wallStairs=[];battle.defensePosts=[];battle.towerGarrisonVersion=117

static func guard_kind(state: Dictionary,team: int) -> String:
 var age:=int(state.get("ages",[])[team]) if team<state.get("ages",[]).size() else 0
 var research: Array=state.get("research",[]);var known: Array=research[team].get("known",[]) if team<research.size() else []
 if age>=6 and "modernity" in known:return "modern_infantry"
 if age>=5 and "rifles" in known:return "rifleman"
 if age>=4 and "firearms" in known:return "musketeer"
 if age>=3 and "crossbows" in known:return "crossbowman"
 if age>=2 and "iron" in known:return "iron_archer"
 if age>=1 and "bronze" in known:return "bronze_archer"
 return "stone_guard" if age==0 else "archer"

static func fortify(battle: Dictionary,city: Dictionary,state: Dictionary) -> void:
 battle.wallWalkEnabled=true;battle.fortress.defenseBonus=0.0
 for building in city.economy.buildings:
  Rules.prepare_wall(building)
  if not building.get("ready",false) or float(building.get("hp",0))<=0 or building.get("disabled",false):continue
  var type: String=building.type;var weight:=0.0
  if type in ["palisade","stonewall","reinforced_wall","keep"]:weight=220 if type=="reinforced_wall" else 160 if type=="stonewall" else 85
  elif type in ["watchtower","stonetower"]:weight=95 if type=="stonetower" else 55
  battle.fortress.defenseBonus=float(battle.fortress.defenseBonus)+weight*maxf(0.1,float(building.hp)/350)
 attach_sections(battle,city)
 battle.wallStairs=[];battle.defensePosts=[]
 for section in battle.siegeSections:
  var dx:=float(battle.fortress.x)-float(section.x);var dz:=float(battle.fortress.z)-float(section.z);var length:=sqrt(dx*dx+dz*dz)
  if length==0:length=1
  battle.wallStairs.append({"x":section.x,"z":section.z,"groundX":float(section.x)+dx/length*7,"groundZ":float(section.z)+dz/length*7,"height":section.height})
 var tower_kind:=guard_kind(state,int(city.team));var age:=int(state.get("ages",[])[city.team]) if int(city.team)<state.get("ages",[]).size() else 0
 for index in city.economy.buildings.size():
  var building: Dictionary=city.economy.buildings[index]
  if not building.get("ready",false) or float(building.get("hp",0))<=0 or building.get("disabled",false):continue
  var type:=str(building.type)
  if type in ["palisade","stonewall","reinforced_wall","keep"]:
   var slot:=0
   for source in state.units.size():
    var unit: Dictionary=state.units[source];var post: Variant=unit.get("garrison")
    if int(unit.team)!=int(city.team) or float(unit.hp)<=0 or not post is Dictionary or int(post.get("c",-1))!=int(city.c) or int(post.get("r",-1))!=int(city.r) or float(post.get("x",INF))!=float(building.x) or float(post.get("z",INF))!=float(building.z):continue
    var high: bool=type=="palisade" and int(building.get("woodFortTierV1757",1))==2
    var height:=7.25 if high else 6.0 if type=="keep" else float(Rules.PROFILES.get(type,{}).get("height",0))
    var axis:=bool(building.get("wallAxis",false))
    var squad={"source":source,"team":unit.team,"kind":unit.kind,"grade":unit.get("grade","standard"),"experienceMultiplier":unit.get("experienceMultiplier",1),"wallWalk":true,"hp":unit.hp,"maxHp":unit.get("maxHp",unit.hp),"morale":unit.get("morale",100),"x":float(building.x)+(0 if axis else (slot-0.5)*1.6),"z":float(building.z)+((slot-0.5)*1.6 if axis else 0),"heading":PI/2 if axis else 0,"target":null,"cool":0,"guardPost":true,"wallElevation":height,"wallType":type,"advance":false}
    if unit.has("menCount"):squad.menCount=unit.menCount
    if unit.get("soldiers") is Array:squad.soldiers=unit.soldiers.duplicate(true)
    battle.squads.append(squad);slot+=1
  if type not in ["watchtower","stonetower"]:continue
  if float(building.get("assigned",0))>=0.99:
   var post={"x":building.x,"z":building.z,"team":city.team,"buildingIndex":index,"active":true,"individualGuards":true,"damage":12 if type=="stonetower" else 8,"range":31 if type=="stonetower" else 25,"cool":0,"ballista":null}
   var known: Array=state.research[int(city.team)].get("known",[]) if int(city.team)<state.get("research",[]).size() else []
   if age>=2 and "ancient_artillery" in known:post.ballista={"range":50,"damage":24,"reload":6,"cool":0,"height":(6.4 if building.get("bronzeWall",false) else 7.55 if type=="stonetower" else 7.25)+0.65}
   battle.defensePosts.append(post)
  var height:=6.4 if building.get("bronzeWall",false) else 7.55 if type=="stonetower" else 4.85 if age==0 else 6.875
  battle.siegeSections.append({"index":index,"type":type,"tower":true,"walkable":true,"x":building.x,"z":building.z,"height":height,"hp":building.hp,"maxHp":building.get("damageMaxHp",building.hp),"breached":false,"team":city.team})
  if int(building.get("guardOwner",-1))!=int(city.team):
   building.guardOwner=city.team;building.towerGuards=[]
   for slot in 5:building.towerGuards.append({"slot":slot,"hp":20,"maxHp":20})
  for saved in building.get("towerGuards",[]):
   var slot:=int(saved.slot);var source: int=-100000-int(index)*5-slot
   var ground_patrol:=bool(saved.get("groundPatrolV1757",false));var x:float=float(building.x)+(slot-2)*0.8 if ground_patrol else float(saved.get("x",float(building.x)+(slot-2)*0.8));var z:float=float(building.z) if ground_patrol else float(saved.get("z",building.z));var elevation:float=height if ground_patrol else float(saved.get("elevation",height))
   var men:=[]
   if float(saved.hp)>0:men.append({"id":str(source)+":0","index":0,"x":x,"z":z,"hp":saved.hp,"maxHp":saved.get("maxHp",20),"radius":0.34,"elevation":elevation,"ammo":saved.get("ammo",40),"arrowLoadVersion":100,"cool":0,"heading":0,"kills":0,"damageDealt":0})
   battle.squads.append({"source":source,"team":city.team,"kind":tower_kind,"grade":"standard","menCount":1,"hp":saved.hp,"maxHp":saved.get("maxHp",20),"morale":100,"x":x,"z":z,"heading":0,"cool":0,"guardPost":true,"wallWalk":true,"wallType":"stonewall","wallElevation":elevation,"towerGuard":true,"homeTower":index,"guardSlot":slot,"combatMode":"auto","men":men})
 battle.towerGarrisonVersion=117

static func persist_tower_guards(city: Dictionary,battle: Dictionary) -> void:
 for unit in battle.get("squads",[]):
  if not unit.get("towerGuard",false):continue
  var index:=int(unit.get("homeTower",-1))
  if index<0 or index>=city.economy.buildings.size():continue
  for saved in city.economy.buildings[index].get("towerGuards",[]):
   if int(saved.slot)!=int(unit.guardSlot):continue
   var men: Array=unit.get("men",[]);var man: Dictionary=men[0] if not men.is_empty() else {}
   saved.hp=man.get("hp",unit.hp);saved.x=man.get("x",unit.x);saved.z=man.get("z",unit.z);saved.elevation=man.get("elevation",unit.wallElevation);saved.ammo=man.get("ammo",40);saved.groundPatrolV1757=bool(unit.get("peacePatrolV1757",false));break

static func occupation(battle: Dictionary,dt: float) -> void:
 var fortress: Variant=battle.get("fortress")
 if fortress==null or battle.get("result")!=null or float(fortress.hp)<=0:return
 var inside:=0;var resistance:=false
 for unit in battle.squads:
  if float(unit.hp)<=0 or unit.get("retreated",false) or unit.get("routing",false) or unit.get("reserve",false):continue
  var d:=distance(unit,fortress)
  if unit.team==fortress.team:
   if d<22:resistance=true
  elif not unit.get("guardPost",false) and d<12:
   for man in unit.get("men",[]):
    if float(man.hp)>0 and not man.get("escaped",false) and distance(man,fortress)<12:inside+=1;break
 if inside>0 and not resistance:
  fortress.hp=maxf(0,float(fortress.hp)-dt*38*mini(3,inside))
  if battle.get("siegeOccupiedAt")==null:battle.siegeOccupiedAt=battle.elapsed
 else:battle.siegeOccupiedAt=null

static func distance(a: Dictionary,b: Dictionary) -> float:
 var dx:=float(a.x)-float(b.x);var dz:=float(a.z)-float(b.z);return sqrt(dx*dx+dz*dz)

static func transfer_city(state: Dictionary,city: Dictionary,team: int) -> void:
 var old:=int(city.team);var realm: Dictionary=city.economy.realms[old].duplicate(true)
 for unit in state.units:
  var garrison: Variant=unit.get("garrison")
  if int(unit.team)==old and garrison is Dictionary and int(garrison.get("c",-1))==int(city.c) and int(garrison.get("r",-1))==int(city.r):unit.erase("garrison");unit.hp=0
 city.team=team;city.builderAgents=[];city.trainingAgent=null
 for job in city.get("training",[]):job.team=team
 city.economy.realms[team]=realm
 for context in Districts.contexts(city):
  context.team=team;context.economy.realms[team]=realm
  for building in context.economy.get("buildings",[]):building.team=team
  for cargo in context.economy.get("cargo",[]):cargo.team=team
  context.world.workers={}
 reconcile_victory(state,team)

static func reconcile_victory(state: Dictionary,conqueror: Variant=null) -> Array:
 var survivors: Array=[]
 for team in state.research.size():
  var alive:=false
  for city in state.cities:
   if int(city.team)==team:alive=true;break
  if not alive:
   for person in state.settlers:
    if int(person.team)==team:alive=true;break
  if alive:survivors.append(team);continue
  for unit in state.units:
   if int(unit.team)==team:unit.hp=0
  for ship in state.get("ships",[]):
   if int(ship.team)==team:ship.hp=0;ship.cargo=null;ship.path=[]
  for army in state.armies:
   if int(army.team)==team:army.path=[];army.embarked=null;army.autoExplore=false
 if 0 not in survivors:
  if state.get("winner")==null:state.winner=conqueror if conqueror!=null else survivors[0] if not survivors.is_empty() else null
 elif survivors.size()==1:state.winner=0
 return survivors

static func capture_settlers(state: Dictionary) -> Array:
 var captured: Array=[]
 for person in state.settlers.duplicate():
  if person.get("embarked")!=null:continue
  for army in state.armies:
   if army.get("embarked")!=null or int(army.c)!=int(person.c) or int(army.r)!=int(person.r) or not Diplomacy.at_war(state,int(army.team),int(person.team)):continue
   var armed:=false
   for unit in state.units:
    if int(unit.team)==int(army.team) and int(unit.get("armyId",0))==int(army.get("id",0)) and float(unit.get("hp",0))>0 and not unit.get("garrison",false):armed=true;break
   if not armed:continue
   state.settlers.erase(person);captured.append(person)
   if not state.has("events"):state.events=[]
   state.events.append({"time":state.time,"text":"Asunik tabatud: %d → %d" % [int(person.team),int(army.team)]})
   break
 if not captured.is_empty():reconcile_victory(state)
 return captured

