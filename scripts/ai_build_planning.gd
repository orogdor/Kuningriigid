class_name AIBuildPlanning
extends RefCounted

const Economy=preload("res://scripts/economy_rules.gd")
const Era=preload("res://scripts/era_economy.gd")
const Needs=preload("res://scripts/city_needs.gd")
const Availability=preload("res://scripts/era_availability.gd")
const BuildData=preload("res://data/build_rules.json")

# The callback reports whether the city's terrain and research permit a type.
static func foundation_needs(state: Dictionary,city: Dictionary,build_rule: Callable) -> Array:
 var buildings: Array=city.economy.buildings;var team:=int(city.team);var known: Array=state.research[team].known;var age:=int(state.ages[team]);var result: Array=[]
 var has=func(type):return buildings.any(func(b):return b.type==type and float(b.hp)>0 and not b.get("disabled",false))
 var add=func(type):
  if not has.call(type) and Economy.DATA.data.buildings.has(type) and str(build_rule.call(type)).is_empty():result.append(type)
 add.call("well");add.call("lumber")
 var food:=false
 for type in ["hunter","fisher","farm","pasture","bakery"]:
  if has.call(type):food=true;break
 if not food:
  for type in ["hunter","fisher","farm"]:
   if str(build_rule.call(type)).is_empty():result.append(type);break
 add.call("quarry");add.call("house")
 if "woodworking" in known:add.call("saw")
 var study: Variant=Availability.building_successor(state,team,"study")
 add.call(study if study!=null else "study")
 if age>=2:
  add.call("mine");add.call("coal")
  if "smelting" in known:add.call("smelter")
 return result

static func reserves_foundation(state: Dictionary,city: Dictionary,type: String,build_rule: Callable) -> bool:
 var missing:=foundation_needs(state,city,build_rule)
 if missing.is_empty() or type in missing:return false
 var team:=int(city.team);var realm: Dictionary=city.economy.realms[team];var buildings: Array=city.economy.buildings;var stock: Dictionary=realm.resources
 var houses:=0;var market:=false;var any_market:=false
 for b in buildings:
  if b.type=="house" and b.get("ready",false) and float(b.hp)>0:houses+=1
  if b.type=="market" and float(b.hp)>0:
   any_market=true
   if b.get("ready",false):market=true
 if type in ["hunter","fisher","farm"] and Needs.food_total(stock)<float(realm.pop)*3:return false
 if type=="well" and float(stock.get("water",0))<float(realm.pop)*2:return false
 if type=="house" and float(realm.pop)>=4+1.5*houses-1:return false
 var cost: Dictionary=Economy.DATA.data.buildings.get(type,{}).get("cost",{})
 if type in ["mason","barracks"] and int(state.ages[team])>=1 and float(realm.pop)>=11 and houses>=4 and market and Needs.food_total(stock)>=float(realm.pop)*3 and float(stock.get("water",0))>=float(realm.pop)*1.5 and float(stock.get("wood",0))-float(cost.get("wood",0))>=23 and float(stock.get("stone",0))-float(cost.get("stone",0))>=18:return false
 if type=="market" and int(state.ages[team])>=1 and float(realm.pop)>=6 and not any_market and Needs.food_total(stock)>=float(realm.pop)*2.5 and float(stock.get("water",0))>=float(realm.pop)*1.3 and float(stock.get("wood",0))-float(cost.get("wood",0))>=18 and float(stock.get("stone",0))-float(cost.get("stone",0))>=12:return false
 for need in missing:
  for key in Economy.DATA.data.buildings[need].cost:
   if float(stock.get(key,0))-float(cost.get(key,0))<float(Economy.DATA.data.buildings[need].cost[key]):return true
 return false

static func resource_priorities(state: Dictionary,team: int,city: Dictionary) -> Array:
 var stock: Dictionary=city.economy.realms[team].resources;var pop:=float(city.economy.realms[team].get("pop",3));var age:=int(state.ages[team]);var science: Dictionary=state.research[team]
 var age_wait: Variant=science.get("ageWait");var needs: Dictionary=Era.age_deficit(state,team,str(age_wait.id)) if age_wait is Dictionary else {}
 var targets={"bread":maxf(16,pop*6),"water":maxf(18,pop*5),"wood":65,"stone":40,"plank":30 if age>=1 else 0,"bronze":12 if age>=1 else 0,"weapons":12 if age>=2 else 0,"iron":18 if age>=2 else 0,"coal":12 if age>=2 else 0,"gunpowder":10 if age>=4 else 0,"steel":15 if age>=5 else 0,"machines":12 if age>=5 else 0,"oil":12 if age>=6 else 0,"fuel":10 if age>=6 else 0}
 var result: Array=[]
 for resource in targets:
  var target:=float(targets[resource]);var actual:=Era.edible_supply(stock) if resource=="bread" else float(stock.get(resource,0));var shortfall:=maxf(0,target-actual);var age_missing:=float(needs.get(resource,0))
  if shortfall<=0 and age_missing<=0:continue
  var pressure: float=(260 if resource=="bread" and actual<pop*3 else 0)+(250 if resource=="water" and actual<pop*2 else 0)+(105 if age_missing>0 else 0)+minf(25,20*shortfall/maxf(1,target))
  result.append({"resource":resource,"target":target,"actual":actual,"shortfall":shortfall,"ageMissing":age_missing,"pressure":pressure})
 result.sort_custom(func(a,b):return a.pressure>b.pressure)
 return result

const CHAINS={"wood":["lumber"],"stone":["quarry"],"bread":["hunter","fisher","farm","mill","bakery"],"water":["well"],"grain":["farm"],"plank":["lumber","saw"],"ore":["mine"],"coal":["coal"],"iron":["mine","coal","smelter"],"weapons":["smith"],"paper":["printer"],"saltpeter":["nitrate"],"gunpowder":["nitrate","coal","powdermill"],"steel":["mine","coal","smelter","steelworks"],"machines":["steelworks","engineworks"],"oil":["oilwell"],"fuel":["oilwell","refinery"],"clay":["claypit"],"pottery":["claypit","pottery_kiln"],"cutstone":["quarry","mason"],"copper":["coppermine"],"tin":["tinmine"],"bronze":["coppermine","tinmine","bronze_foundry"],"carts":["cartwright"]}
const DEFENSE=["palisade","woodgate","stonewall","reinforced_wall","gatehouse","watchtower","stonetower"]
const SUPPORTED=["house","lumber","quarry","well","hunter","fisher","farm","saw","mill","bakery","warehouse","cellar","forester","claypit","pottery_kiln","mason","coppermine","tinmine","bronze_foundry","cartwright","road_depot","coal","mine","smelter","smith","study","scriptorium","library","academy","barracks","archery","vegetable_garden","orchard","flax_farm","weaver","jeweler","harbor","market","pasture","school","university","monastery","chapel","observatory","public_school","high_school","polytechnic","laboratory","printer","nitrate","powdermill","steelworks","engineworks","oilwell","refinery","powerplant","autofactory","watermill","windmill","guildhall","master_workshop","armor_workshop","infirmary","trade_yard","inn","railstation","airfield","stable","crossbow_range","siegeworkshop","gem_mine","dairy","spice_garden","coffee_farm","silk_farm","dye_garden","cocoa_farm","rubber_farm","silk_weaver","perfumery","chocolatier","electronics_factory"]
var plan_state: Dictionary
var plan_city: Dictionary
var plan_rule: Callable
var plan_excluded: Array
var candidates: Array
var visiting: Dictionary
var pending: int

func add_candidate(type: String,priority: float,reason: String) -> void:
 if type.is_empty() or type in plan_excluded or type in DEFENSE or type not in SUPPORTED or not Economy.DATA.data.buildings.has(type):return
 var team:=int(plan_city.team);var realm: Dictionary=plan_city.economy.realms[team];var stock: Dictionary=realm.resources;var buildings: Array=plan_city.economy.buildings;var age:=int(plan_state.ages[team]);var exists:=false;var unfinished:=false;var any_unfinished:=false;var count:=0
 for b in buildings:
  if b.type!=type or float(b.get("hp",0))<=0:continue
  count+=1
  if not b.get("ready",false):any_unfinished=true
  if not b.get("disabled",false):
   if not b.get("ready",false):unfinished=true
   if not (b.get("ready",false) and ("pole ligipääsetavat" in str(b.get("status","")) or "maardla puudub" in str(b.get("status","")))):exists=true
 if type=="house":
  if any_unfinished:return
 elif exists:
  var food_expand: bool=type in ["hunter","fisher","farm"] and float(realm.pop)>=(3 if age==0 else 5) and Era.edible_supply(stock)<float(realm.pop)*(4 if age==1 else 3) and not unfinished
  var wood_expand: bool=type=="lumber" and age>=1 and float(realm.pop)>=16 and float(stock.get("wood",0))<float(realm.pop)*2 and not unfinished
  var quarry_expand: bool=type=="quarry" and age>=1 and float(realm.pop)>=18 and float(stock.get("stone",0))<float(realm.pop)*2 and not unfinished
  if not food_expand and not wood_expand and not quarry_expand:return
 if type in ["quarry","lumber","hunter","fisher","well","farm"] and count>=(3 if type in ["hunter","fisher","farm"] and float(realm.pop)>=18 else 2):return
 if type=="harbor" and count>0:return
 var rule:=str(plan_rule.call(type))
 if not rule.is_empty() or pending>=12 or not Economy.can_afford(stock,Economy.DATA.data.buildings[type].cost):
  if rule.is_empty():
   if not plan_city.has("aiImportRequestsV128"):plan_city.aiImportRequestsV128={}
   for key in Economy.DATA.data.buildings[type].cost:
    var n: float=Economy.DATA.data.buildings[type].cost[key]
    if float(stock.get(key,0))<n+4:plan_city.aiImportRequestsV128[key]=maxf(float(plan_city.aiImportRequestsV128.get(key,0)),n+4)
  if not visiting.has(type):
   visiting[type]=true
   for dep in Economy.DATA.data.buildings[type].get("requires",[]):
    if not Economy.ready(plan_city.economy,team,dep):add_candidate(dep,priority+0.5,"Eeltingimus: "+type)
   visiting.erase(type)
  return
 if reserves_foundation(plan_state,plan_city,type,plan_rule):return
 var wait: Variant=plan_state.research[team].get("ageWait");var gaps: Dictionary=Era.age_deficit(plan_state,team,str(wait.id)) if wait is Dictionary else {}
 var critical=["lumber","quarry","well","hunter","fisher","farm","saw","mill","bakery","mine","coal","smelter","house","warehouse","cellar","forester","claypit","pottery_kiln","mason","coppermine","tinmine","bronze_foundry","cartwright","study","scriptorium","market","gem_mine","oilwell","nitrate","powdermill","steelworks","engineworks","refinery"]
 if not gaps.is_empty() and type not in critical and type not in ["barracks","archery","harbor","armor_workshop","trade_yard","inn","stable","crossbow_range","siegeworkshop"]:return
 candidates.append({"type":type,"priority":priority,"reason":reason})

# Source priorities for buildings implemented in this port. Full districts,
# defensive planning, and later civic building types are still separate work.
func choose(state: Dictionary,city: Dictionary,build_rule: Callable,excluded: Array=[]) -> Variant:
 plan_state=state;plan_city=city;plan_rule=build_rule;plan_excluded=excluded;candidates=[];visiting={};pending=0
 var team:=int(city.team);var age:=int(state.ages[team]);var realm: Dictionary=city.economy.realms[team];var stock: Dictionary=realm.resources;var buildings: Array=city.economy.buildings;var science: Dictionary=state.research[team];var pop:=float(realm.pop);var homes:=0;var defenders:=0;var city_count:=0
 for b in buildings:
  if not b.get("ready",false) and float(b.get("hp",0))>0 and not b.get("disabled",false) and b.type not in DEFENSE:pending+=1
  if b.type=="house" and b.get("ready",false) and float(b.get("hp",0))>0:homes+=1
 if pending>=3:return null
 for unit in state.get("units",[]):
  if int(unit.team)==team and float(unit.get("hp",0))>0 and unit.kind not in ["scout","militia","stone_guard","transport","warship"] and not unit.get("garrison",false):defenders+=1
 for town in state.cities:
  if int(town.team)==team:city_count+=1
 var wait: Variant=science.get("ageWait");var gaps: Dictionary=Era.age_deficit(state,team,str(wait.id)) if wait is Dictionary else {};var missing:=not gaps.is_empty();var capacity:=4+homes*1.5
 var foundation:=foundation_needs(state,city,build_rule)
 for i in foundation.size():add_candidate(foundation[i],220-i,"Linna põhiehitis")
 if pop>=5 and float(stock.get("wood",0))>=35:add_candidate("fisher",250,"Ranniku kalapüük mitmekesistab toitu")
 var resource_types={"wood":"lumber","stone":"quarry","ore":"mine","copper":"coppermine","tin":"tinmine","clay":"claypit","oil":"oilwell","water":"well","grain":"farm","game":"hunter","fish":"fisher"}
 for type in BuildData.data.good_buildings:
  var d: Dictionary=BuildData.data.good_buildings[type]
  if d.get("deposit")!=null:resource_types[d.deposit]=type
 for resource in city.get("resourceSpecialization",[]):add_candidate(resource_types.get(resource,""),139,"Puuduva riigiressursi tootmine")
 if defenders<mini(20,city_count*2+age*2+3):
  var military=[["barracks",188],["archery",173]]
  if age>=1:military.append_array([["mason",184],["coppermine",183],["tinmine",182],["bronze_foundry",181]])
  if age>=2:military.append_array([["coal",180],["smelter",179],["smith",178]])
  for item in military:
   if item[0]=="barracks" or defenders<6+age*4 or item[0]=="smith":add_candidate(item[0],item[1],"Ajastule vastava sõjaväe varustamine")
 var has_civic:=false
 for b in buildings:
  if b.type=="market" and b.get("ready",false) and float(b.get("hp",0))>0:has_civic=true;break
 if age>=1 and pop>=10 and has_civic and Era.edible_supply(stock)>=pop*2.3 and float(stock.get("stone",0))>=45:
  var mason:=false;var barracks:=false
  for b in buildings:
   if b.type=="mason" and float(b.get("hp",0))>0:mason=true
   if b.type=="barracks" and float(b.get("hp",0))>0:barracks=true
  if float(stock.get("cutstone",0))<26 and not mason:add_candidate("mason",279 if pop>=14 else 248,"Kiviraidur linnamüüri rajamiseks")
  if not barracks:add_candidate("barracks",268 if pop>=14 else 243,"Linna esimene kasarm ja väliväe väljaõpe")
 if age>=1 and pop>=6:add_candidate("market",minf(298,268+(24 if pop>=10 else 0)),"Esimene turg ja mitmekesine toit kiirendavad linna kasvu")
 if age>=1 and pop>=8:add_candidate("warehouse",172,"Kaubanduse ja ehitusmaterjalide põhilaod")
 if age>=1 and pop>=10:add_candidate("cellar",168,"Linnakodanike ühine toidukelder")
 if age>=3 and pop>=11:
  add_candidate("inn",129,"Ajalooline võõrastemaja");add_candidate("trade_yard",126,"Kaupmeeste õu")
 if age>=1 and pop>=12:add_candidate("road_depot",126,"Linna peatänavate ja teede korrashoid")
 var successor: Variant=Availability.building_successor(state,team,"study");var study: String=successor if successor!=null else "study"
 if pop>=5:add_candidate(study,226,"Teaduse ja hariduse keskne töökoht")
 if pop>=6:
  var education:=false
  for b in buildings:
   if b.type in ["study","scriptorium","library","school","academy","university","monastery","chapel","observatory","public_school","high_school","polytechnic","laboratory"] and float(b.hp)>0 and not b.get("disabled",false):education=true;break
  if not education:
   for type in ["study","scriptorium","library","school"]:add_candidate(type,200,"Linna esimene haridusasutus")
 if pop>=11:
  for type in ["scriptorium","library","school","academy"]:add_candidate(type,141,"Hariduse järgmine tase")
 if age>=1 and pop>=9:add_candidate("scriptorium",164,"Ajaloolise linna kirjutuskoda")
 if age>=1 and pop>=10:add_candidate("harbor",151,"Rannikulinna vajalik sadam")
 var roles={"food":["farm","pasture","mill","bakery","watermill"],"timber":["lumber","saw","forester","cartwright"],"industry":["mine","coal","smelter","steelworks","engineworks"],"energy":["oilwell","refinery","powerplant","engineworks"],"port":["fisher","harbor","warehouse","cartwright"],"trade":["market","warehouse","saw","trade_yard"]}
 var role: String=city.get("economicRole","trade");var role_types: Array=roles.get(role,[])
 for i in role_types.size():add_candidate(role_types[i],(178 if missing else 142)-i,"Specialist town: "+role)
 for pair in [["lumber",125],["well",118],["hunter",115],["fisher",109],["farm",146],["quarry",103],[study,98]]:add_candidate(pair[0],pair[1],"Algmajandus")
 if "shipbuilding" in science.known:
  var ship:=false;var harbor:=false
  for s in state.get("ships",[]):
   if int(s.team)==team and float(s.hp)>0:ship=true;break
  for b in buildings:
   if b.type=="harbor" and float(b.hp)>0:harbor=true;break
  if not ship and not harbor:add_candidate("harbor",136,"Väljapääs teistele mandritele")
 if age>=1 and "forestry" in science.known:
  var exhausted:=false
  for b in buildings:
   if b.type=="lumber" and "pole ligipääsetavat" in str(b.get("status","")):exhausted=true;break
  if float(stock.get("wood",0))<90 or exhausted:add_candidate("forester",135,"Metsa taastamine")
 var happiness:=Needs.calculate(city,age)
 if int(happiness.missing)>0 and pop>=14 and defenders>=mini(4,age+1):
  for type in BuildData.data.good_buildings:
   var d: Dictionary=BuildData.data.good_buildings[type]
   if int(d.age)<=age and float(stock.get(d.out,0))<float(happiness.threshold)*3:add_candidate(type,101,"Linna mitmekesisus")
 for need in resource_priorities(state,team,city):
  var chain: Array=CHAINS.get(need.resource,[])
  for i in chain.size():add_candidate(chain[i],float(need.pressure)+maxi(1,chain.size()-i)*0.4,"Puudus: "+str(need.resource))
 var desired:=mini(70,ceili((pop+(8 if age==1 else 3))/1.5))
 if homes<desired and Economy.can_afford(stock,Economy.DATA.data.buildings.house.cost):
  var cost: Dictionary=Economy.DATA.data.buildings.house.cost
  var enough: bool=not missing or (float(gaps.get("plank",0))>35 and float(stock.get("plank",0))>=float(cost.get("plank",0))+12) or float(gaps.get("bread",0))>0 or (float(gaps.get("wood",0))>0 and float(stock.get("wood",0))>=float(cost.get("wood",0))+20)
  if not (age==0 and capacity>pop+2) and (enough or capacity<=pop+1.5):add_candidate("house",(274 if age==1 else 238) if pop>=capacity-(6 if age==1 else 2) else (104 if missing else 112),"Eluruumid ja järgmise rahvastikukasvu varu")
 var food_cap:=Economy.storage_limit(buildings,"bread");var material_cap:=Economy.storage_limit(buildings,"plank")
 var era_cost: Dictionary=Era.DATA.data.era_materials.get(str(wait.id),{}) if wait is Dictionary else {}
 if (float(era_cost.get("bread",0))>food_cap-5 or Era.edible_supply(stock)>=food_cap*0.86) and age>=1:add_candidate("cellar",133 if missing else 100,"Toiduhoidla piirang")
 var needs_storage:=false
 for key in era_cost:
  if key!="bread" and Economy.storage_limit(buildings,key)<float(era_cost[key]):needs_storage=true;break
 if (needs_storage or material_cap<120 and age>=1) and age>=1:add_candidate("warehouse",134 if missing else 108,"Materjalilao piirang")
 if not missing:
  var development=["house","barracks","archery","watchtower","palisade","claypit","pottery_kiln","pasture","mason"]
  if age>=1:development.append_array(["stonetower","stonewall","cartwright","coppermine","tinmine","bronze_foundry","road_depot","saw","warehouse","cellar","market","scriptorium","forester","mill","bakery","harbor"])
  if age>=2:development.append_array(["mine","coal","smelter","smith","academy","stable","siegeworkshop"])
  if age>=3:development.append_array(["guildhall","master_workshop","watermill","windmill","infirmary","trade_yard","inn","armor_workshop","crossbow_range","monastery","chapel","keep","gatehouse","siegeworkshop","reinforced_wall","university"])
  if age>=4:development.append_array(["printer","observatory","nitrate","powdermill"])
  if age>=5:development.append_array(["steelworks","engineworks","polytechnic","railstation"])
  if age>=6:development.append_array(["oilwell","refinery","powerplant","autofactory","laboratory","airfield"])
  for i in development.size():
   if development[i]=="house" and homes>0:continue
   add_candidate(development[i],42-i*0.3,"Tavapärane areng")
 candidates.sort_custom(func(a,b):return a.priority>b.priority)
 return candidates[0] if not candidates.is_empty() else null
