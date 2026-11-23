class_name AIMilitary
extends RefCounted
const Fortifications=preload("res://scripts/fortifications.gd")
const District=preload("res://scripts/district_context.gd")
const Economy=preload("res://scripts/economy_rules.gd")
const Availability=preload("res://scripts/era_availability.gd")
const Recruitment=preload("res://scripts/military_recruitment.gd")
const Needs=preload("res://scripts/city_needs.gd")
const Diplomacy=preload("res://scripts/diplomacy_rules.gd")
const Siege=preload("res://scripts/battle_siege.gd")
const RESEARCH=preload("res://data/research.json")
const EXCLUDED=["scout","militia","stone_guard","transport","warship"]

static func combat(unit: Dictionary) -> bool:
 return float(unit.get("hp",0))>0 and unit.kind not in EXCLUDED
static func role(kind: String) -> String:
 var definition: Dictionary=Economy.DATA.data.troops.get(kind,{})
 if definition.has("role"):return definition.role
 if kind in ["archer","slinger","stone_guard","crossbowman","musketeer","rifleman","motorized"]:return "ranged"
 if kind in ["cavalry","knight","heavy_cavalry"]:return "cavalry"
 if kind in ["catapult","battering_ram","siege_tower"]:return "siege"
 return "melee"
static func choices(state: Dictionary,team: int,city: Dictionary) -> Array:
 var age:=int(state.ages[team]);var known: Array=state.research[team].known;var counts: Dictionary={};var actual:=0;var queued:=0
 for unit in state.units:
  if int(unit.team)==team and combat(unit):
   actual+=1;var r:=role(unit.kind);counts[r]=int(counts.get(r,0))+1
 for town in state.cities:
  if int(town.team)!=team:continue
  for job in town.get("training",[]):
   if job.get("ship",false) or job.kind=="scout":continue
   queued+=1;var r:=role(job.kind);counts[r]=int(counts.get(r,0))+1
 var weights: Dictionary={"melee":0.65,"ranged":0.35} if age<1 else {"melee":0.5,"ranged":0.3,"cavalry":0.2} if age<2 else {"melee":0.45,"ranged":0.3,"cavalry":0.2,"siege":0.05} if age<4 else {"melee":0.3,"ranged":0.4,"cavalry":0.2,"siege":0.1} if age<5 else {"ranged":0.65,"cavalry":0.2,"siege":0.15} if age<6 else {"ranged":0.65,"vehicle":0.2,"siege":0.15}
 var n:=actual+queued+1;var result: Array=[]
 for kind in Economy.DATA.data.troops:
  var d: Dictionary=Economy.DATA.data.troops[kind]
  if kind in EXCLUDED or kind=="bronze_cavalry" or int(d.get("age",99))>age or Availability.unit_successor(state,team,kind)!=null:continue
  var tech: String=RESEARCH.data.unit_tech.get(kind,"")
  if not tech.is_empty() and tech not in known:continue
  var ready:=true
  var shared_economy: Dictionary=city.economy.duplicate();shared_economy.buildings=District.all_buildings(city)
  for req in d.get("requires",[]):
   if not Economy.ready(shared_economy,team,req):ready=false;break
  if not ready:continue
  var r:=role(kind);var score: float=(float(weights.get(r,0.03))*n-int(counts.get(r,0)))*100+int(d.get("age",0))*8+float(d.get("dmg",0))*0.02
  result.append({"id":kind,"score":score})
 result.sort_custom(func(a,b):return a.id<b.id if absf(a.score-b.score)<0.0000001 else a.score>b.score)
 return result.map(func(entry):return entry.id)

# A rival assigns an existing soldier only when four mobile combat units
# remain and a ready wall in this town has no garrison.
static func station_wall(state: Dictionary,city: Dictionary) -> bool:
 var team:=int(city.team);var wall: Variant=null;var mobile:=0
 for building in city.economy.buildings:
  if building.type in ["palisade","stonewall"] and building.get("ready",false) and float(building.get("hp",0))>0 and not building.get("disabled",false):wall=building;break
 if wall==null:return false
 for unit in state.units:
  if int(unit.team)==team and combat(unit) and not unit.get("garrison") is Dictionary:mobile+=1
 if mobile<4 or not Fortifications.guards(state,city,wall).is_empty():return false
 for source in state.units.size():
  var unit:Dictionary=state.units[source]
  if int(unit.team)!=team or not combat(unit) or unit.get("garrison") is Dictionary:continue
  for army in state.armies:
   if int(army.team)==team and int(army.get("id",0))==int(unit.get("armyId",0)) and int(army.c)==int(city.c) and int(army.r)==int(city.r) and army.get("path",[]).is_empty():
    return Fortifications.station(state,city,wall,source).has("ok")
 return false

static func tick(state: Dictionary,city: Dictionary) -> void:
 station_wall(state,city)
 var team:=int(city.team);var age:=int(state.ages[team]);var realm: Dictionary=city.economy.realms[team];var stock: Dictionary=realm.resources
 if not state.has("aiRecruitAt"):state.aiRecruitAt={}
 var key:=str(team)
 if not state.aiRecruitAt.has(key):state.aiRecruitAt[key]=210.0
 var own:=0;var units: Array=[];var queued:=0;var war:=false
 for town in state.cities:
  if int(town.team)==team:
   own+=1
   for job in town.get("training",[]):
    if not job.get("ship",false) and job.get("upgradeSource")==null:queued+=1
  elif Diplomacy.at_war(state,team,int(town.team)):war=true
 for unit in state.units:
  if int(unit.team)==team and combat(unit) and not unit.get("garrison",false):units.append(unit)
 var warlike:=posmod(int(state.seed)+team*7,3)==0
 if float(state.time)<float(state.aiRecruitAt[key]) or float(realm.pop)<(28 if age==1 else 9 if warlike else 10) or (warlike and age==0 and units.size()>=4) or Needs.food_total(stock)<maxf(24,float(realm.pop)*2) or city.get("training",[]).size()>=2:return
 var desired:=mini(44,maxi(6,3+own*2+age*2+(7 if war else 0)))
 for kind in choices(state,team,city):
  var d: Dictionary=Economy.DATA.data.troops[kind]
  if not Economy.can_afford(stock,Recruitment.troop_cost(d)):continue
  var retrain_source:=-1
  for unit in units:
   if int(Economy.DATA.data.troops.get(unit.kind,{}).get("age",0))>=int(d.age):continue
   for army in state.armies:
    if int(army.team)==team and int(army.get("id",0))==int(unit.get("armyId",0)) and int(army.c)==int(city.c) and int(army.r)==int(city.r) and army.get("path",[]).is_empty():
     var source: int=state.units.find(unit);var already:=false
     for town in state.cities:
      for job in town.get("training",[]):
       if job.get("upgradeSource")!=null and int(job.upgradeSource)==source:already=true;break
     if not already:retrain_source=source;break
   if retrain_source>=0:break
  if retrain_source<0 and units.size()+queued>=desired:return
  var result:=Recruitment.queue_retraining(state,city,retrain_source,kind) if retrain_source>=0 else Recruitment.queue_land_unit(state,city,kind)
  if result.has("unit"):state.aiRecruitAt[key]=float(state.time)+(85 if age<=1 and warlike else 100 if age<=1 else 90 if age<=3 else 75)
  return

# The original scouts unknown reachable tiles every AI planning interval.
static func scout(state: Dictionary,team: int,can_traverse: Callable,find_path: Callable,visible: Callable) -> void:
 if float(state.time)<=360:return
 for city in state.cities:
  if int(city.team)!=team and visible.call(team,city):return
 var strongest: Variant=null;var count:=-1
 for army in state.armies:
  if int(army.team)!=team:continue
  var n:=0
  for unit in state.units:
   if int(unit.team)==team and float(unit.get("hp",0))>0 and not unit.get("garrison",false) and int(unit.get("armyId",0))==int(army.get("id",0)):n+=1
  if n>0 and n>count:strongest=army;count=n
 if strongest==null and team<state.armies.size():strongest=state.armies[team]
 if strongest==null or strongest.get("embarked")!=null or not strongest.get("path",[]).is_empty():return
 var options: Array=[];var order:=0
 for dr in range(-7,8,2):
  for dc in range(-7,8,2):
   var c:=int(strongest.c)+dc;var r:=int(strongest.r)+dr;var p={"c":c,"r":r}
   if c<0 or c>=220 or r<0 or r>=165 or state.explored[team].has(str(c)+":"+str(r)) or not can_traverse.call(p):continue
   options.append({"c":c,"r":r,"dist":absi(dc)+absi(dr),"order":order});order+=1
 options.sort_custom(func(a,b):return a.order<b.order if a.dist==b.dist else a.dist<b.dist)
 for i in mini(12,options.size()):
  var path: Variant=find_path.call(strongest,options[i],team)
  if path is Array and not path.is_empty():strongest.path=path;return

static func distance(a: Dictionary,b: Dictionary) -> int:
 return absi(int(a.c)-int(b.c))+absi(int(a.r)-int(b.r))

static func seen(state: Dictionary,team: int,target: Dictionary) -> bool:
 return state.explored[team].has(str(int(target.c))+":"+str(int(target.r)))

static func plan_war(state: Dictionary,team: int) -> void:
 var warlike:=posmod(int(state.seed)+team*7,3)==0
 if not state.get("strategyPacingV125",true) or float(state.time)<=(maxf(3600,float(state.get("peaceUntilV276",0))) if warlike else 10800):return
 if not state.has("aiLastWarAt"):state.aiLastWarAt={}
 var key:=str(team);var last:=float(state.aiLastWarAt.get(key,0));var minimum:=5 if warlike else 8
 if not (warlike and last==0) and float(state.time)-last<=(5400 if warlike else 9000):return
 var mobile:=0;var own: Array=[];var rivals: Array=[]
 for unit in state.units:
  if int(unit.team)==team and combat(unit) and not unit.get("garrison",false):mobile+=1
 if mobile<minimum:return
 for city in state.cities:
  if int(city.team)==team:own.append(city)
  elif seen(state,team,city) and not Diplomacy.at_war(state,team,int(city.team)):rivals.append(city)
 var candidate: Variant=null;var best:=42
 for city in rivals:
  for home in own:
   var d:=distance(home,city)
   if d<best:best=d;candidate=city
 if candidate==null:return
 var enemy:=0
 for unit in state.units:
  if int(unit.team)==int(candidate.team) and combat(unit) and not unit.get("garrison",false):enemy+=1
 if mobile>=maxi(minimum,ceili(enemy*(0.6 if warlike else 0.75))):
  Diplomacy.set_relation(state,team,int(candidate.team),"war");state.aiLastWarAt[key]=state.time

static func plan_attack(state: Dictionary,team: int,find_path: Callable) -> void:
 if float(state.time)<float(state.get("aiPeaceUntil",540)) or state.get("battle")!=null:return
 var army: Variant=null;var strongest:=-1
 for candidate in state.armies:
  if int(candidate.team)!=team:continue
  var n:=0
  for unit in state.units:
   if int(unit.team)==team and float(unit.get("hp",0))>0 and not unit.get("garrison",false) and int(unit.get("armyId",0))==int(candidate.get("id",0)):n+=1
  if n>strongest:army=candidate;strongest=n
 if army==null or army.get("embarked")!=null or not army.get("path",[]).is_empty() or strongest<3:return
 var targets: Array=[]
 for city in state.cities:
  # Fortified cities must wait until wall and gate combat is implemented.
  if Diplomacy.at_war(state,team,int(city.team)) and seen(state,team,city) and Siege.supported(city):targets.append(city)
 for settler in state.settlers:
  if settler.get("embarked")==null and Diplomacy.at_war(state,team,int(settler.team)) and seen(state,team,settler):targets.append(settler)
 targets.sort_custom(func(a,b):return distance(a,army)<distance(b,army))
 if targets.is_empty():return
 var path: Variant=find_path.call(army,targets[0],team)
 if path is Array:army.path=path

