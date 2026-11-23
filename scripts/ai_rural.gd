extends RefCounted
const Era=preload("res://scripts/era_economy.gd")
const Needs=preload("res://scripts/city_needs.gd")
const Rules=preload("res://scripts/city_build_rules.gd")
const District=preload("res://scripts/district_context.gd")
const Minerals=preload("res://scripts/mineral_sites.gd")
const SITES={"claypit":"clay","coppermine":"copper","tinmine":"tin","lumber":"wood","quarry":"stone","hunter":"game","fisher":"coast","well":"water","farm":"grain","mine":"ore","oilwell":"oil"}
const CHAINS={"wood":["lumber"],"stone":["quarry"],"bread":["hunter","fisher","farm","mill","bakery"],"water":["well"],"grain":["farm"],"plank":["lumber","saw"],"ore":["mine"],"coal":["coal"],"iron":["mine","coal","smelter"],"weapons":["smith"],"paper":["printer"],"saltpeter":["nitrate"],"gunpowder":["nitrate","coal","powdermill"],"steel":["mine","coal","smelter","steelworks"],"machines":["steelworks","engineworks"],"oil":["oilwell"],"fuel":["oilwell","refinery"],"clay":["claypit"],"pottery":["claypit","pottery_kiln"],"cutstone":["quarry","mason"],"copper":["coppermine"],"tin":["tinmine"],"bronze":["coppermine","tinmine","bronze_foundry"],"carts":["cartwright"]}
static func useful(state: Dictionary,city: Dictionary) -> Dictionary:
 var team:=int(city.team);var age:=int(state.ages[team]);var research:Dictionary=state.research[team];var realm:Dictionary=city.economy.realms[team];var stock:Dictionary=realm.resources;var pop:=float(realm.pop);var needed:Dictionary={}
 var wait:Variant=research.get("ageWait")
 if wait is Dictionary:
  for resource in Era.age_deficit(state,team,str(wait.get("id",""))):
   for type in CHAINS.get(resource,[]):
    if SITES.has(type):needed[type]=true
 if float(stock.get("wood",0))<40:needed.lumber=true
 if float(stock.get("stone",0))<28:needed.quarry=true
 if Era.edible_supply(stock)<pop*3:needed.hunter=true;needed.fisher=true;needed.farm=true
 if float(stock.get("water",0))<pop*2:needed.well=true
 var fisher:=false
 for b in District.all_buildings(city):
  if b.type=="fisher" and float(b.get("hp",0))>0 and not b.get("disabled",false):fisher=true;break
 if pop>=5 and float(stock.get("wood",0))>=35 and not fisher:needed.fisher=true
 if age>=1 and float(stock.get("bronze",0))<16:
  if float(stock.get("copper",0))<20:needed.coppermine=true
  if float(stock.get("tin",0))<16:needed.tinmine=true
 if age>=2 and float(stock.get("ore",0))<15:needed.mine=true
 if age>=6 and float(stock.get("oil",0))<20:needed.oilwell=true
 if "shipbuilding" in research.known:needed.harbor=true
 if int(Needs.calculate(city,age).missing)>0:
  for type in Rules.DATA.data.good_buildings:
   var d:Dictionary=Rules.DATA.data.good_buildings[type]
   if d.get("deposit")!=null and int(d.age)<=age:needed[type]=true
 return needed
static func exhausted(parent: Dictionary,building: Dictionary) -> bool:
 if not building.get("ready",false):return false
 var kind:String=Minerals.TYPES.get(building.type,"")
 if not kind.is_empty():
  for ctx in District.contexts(parent):
   if building not in ctx.economy.buildings:continue
   for resource in ctx.world.get("resources",[]):
    if resource.kind==kind and (building.get("depositId")==null or resource.get("id")==building.depositId):return resource.get("removed",false) or float(resource.get("amount",0))<=0
   return true
 var status:=str(building.get("status",""))
 return "pole ligipääsetavat" in status or "Ootab eraldi" in status or "ammend" in status
