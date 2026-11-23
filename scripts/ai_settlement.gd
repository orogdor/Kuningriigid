class_name AISettlement
extends RefCounted
const Needs=preload("res://scripts/city_needs.gd")
const Settlement=preload("res://scripts/settlement_rules.gd")
const Minerals=preload("res://scripts/mineral_sites.gd")
const DATA=preload("res://data/build_rules.json")
const WEIGHT={"wood":22,"stone":22,"water":28,"grain":30,"game":14,"fish":12,"clay":16,"copper":30,"tin":30,"ore":60,"oil":100}
const AGE={"wood":0,"stone":0,"water":0,"grain":0,"game":0,"fish":0,"clay":0,"copper":1,"tin":1,"ore":1,"oil":5}

# V169: a first village prefers a dry reserved defensive perimeter. The
# assessment callback performs the terrain, route and perimeter survey.
static func first_village_site(target: Dictionary,assess: Callable) -> Dictionary:
 var best: Variant=assess.call(target)
 if best is Dictionary and int(best.blocked)==0:return target
 for offset in [Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1),Vector2i(1,-1),Vector2i(-1,-1),Vector2i(1,1),Vector2i(-1,1)]:
  var candidate={"c":int(target.c)+offset.x,"r":int(target.r)+offset.y}
  var next: Variant=assess.call(candidate)
  if not next is Dictionary:continue
  var score:float=float(next.blocked)*100+(0 if next.water else 6)+int(next.distance)*2+(0 if next.coast else 1)
  var old_score:float=INF if not best is Dictionary else float(best.blocked)*100+(0 if best.water else 6)+int(best.distance)*2+(0 if best.coast else 1)
  if score<old_score:best=next
 return best.cell if best is Dictionary else target
static func policy(time: float,age: int,cities: int,pending: int,pop: float,food: float,last: float,has_settlement: bool) -> Dictionary:
 var capacity:=mini(12,maxi(2,2+floori(maxf(0,time)/(26*60))));var interval:=360 if age<=1 else 420 if age<=3 else 600
 var concentrate: bool=(age==0 and cities>=2) or (age==1 and cities>=2 and pop<30)
 return {"capacity":capacity,"allow":has_settlement and cities+pending<capacity and pending<2 and not concentrate and time>=600 and time-last>=interval and pop>=(12 if age==1 else 6) and food>=maxf(20 if age==0 else 25,pop*(1.6 if age==0 else 2.2)),"interval":interval}
static func recruit(state: Dictionary,city: Dictionary) -> Dictionary:
 var team:=int(city.team);var age:=int(state.ages[team]);var towns:=0;var pending:=0
 for c in state.cities:
  if int(c.team)==team:towns+=1
 for settler in state.settlers:
  if int(settler.team)==team:pending+=1
 if not state.has("aiSettlerLastAt"):state.aiSettlerLastAt={}
 var realm: Dictionary=city.economy.realms[team];var key:=str(team)
 var decision:=policy(float(state.time),age,towns,pending,float(realm.pop),Needs.food_total(realm.resources),float(state.aiSettlerLastAt.get(key,0)),"settlement" in state.research[team].known)
 if not decision.allow or state.get("singleCityScenarioV176",false):return {}
 var result:=Settlement.recruit_settler(state,city)
 if result.has("settler"):state.aiSettlerLastAt[key]=state.time;city.lastSettler=state.time
 return result
static func missing_resources(state: Dictionary,team: int,cell_at: Callable,shore: Callable) -> Array:
 var mapping={"wood":"lumber","stone":"quarry","ore":"mine","copper":"coppermine","tin":"tinmine","clay":"claypit","oil":"oilwell","water":"well","grain":"farm","game":"hunter","fish":"fisher"}
 for type in DATA.data.good_buildings:
  var d: Dictionary=DATA.data.good_buildings[type]
  if d.get("deposit")!=null:mapping[d.deposit]=type
 var missing: Array=[]
 for kind in mapping:
  var type: String=mapping[kind];var required: int=AGE.get(kind,DATA.data.good_buildings.get(type,{}).get("age",0))
  if required>int(state.ages[team]):continue
  var found:=false
  for city in state.cities:
   if int(city.team)!=team:continue
   var cell: Dictionary=cell_at.call(city)
   if kind=="fish":
    if shore.call(int(city.c),int(city.r)):found=true;break
    continue
   if not cell.get("deposits",{}).get(kind,false):continue
   if Minerals.TYPES.has(type) and city.has("world") and Minerals.mineral_site(city.world,type)==null:continue
   found=true;break
  if not found:missing.append(kind)
 return missing
static func score(cell: Dictionary,missing: Array,shore: bool) -> float:
 var result:=0.0
 for kind in missing:
  if shore if kind=="fish" else cell.get("deposits",{}).get(kind,false):result+=float(WEIGHT.get(kind,18))
 return result
static func specialize(state: Dictionary,city: Dictionary,missing: Array,cell: Dictionary,shore: bool) -> void:
 var resources: Array=[]
 for kind in missing:
  if shore if kind=="fish" else cell.get("deposits",{}).get(kind,false):resources.append(kind)
 resources.sort_custom(func(a,b):return int(WEIGHT.get(a,18))>int(WEIGHT.get(b,18)))
 city.resourceSpecialization=resources
 var d: Dictionary=cell.get("deposits",{})
 city.economicRole="energy" if d.get("oil",false) else "industry" if d.get("ore",false) or d.get("coal",false) else "food" if d.get("grain",false) or d.get("game",false) else "port" if shore else "timber" if d.get("wood",false) else "trade"
 for other in state.cities:
  if int(other.team)!=int(city.team) or int(other.id)==int(city.id):continue
  if not other.has("importRequests"):other.importRequests={}
  for resource in resources:
   if resource in ["stone","ore","copper","tin","clay","oil"]:other.importRequests[resource]=maxf(float(other.importRequests.get(resource,0)),16)
