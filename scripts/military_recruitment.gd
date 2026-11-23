class_name MilitaryRecruitment
extends RefCounted
const District=preload("res://scripts/district_context.gd")
const ECON=preload("res://scripts/economy_rules.gd")
const AVAILABILITY=preload("res://scripts/era_availability.gd")
const RESEARCH=preload("res://data/research.json")
const GRADES={"mobilized":{"name":"Mobiliseeritud","cost":0.5,"strength":0.4},"standard":{"name":"Standard","cost":1.0,"strength":1.0},"elite":{"name":"Eliit","cost":1.3,"strength":1.4}}

static func troop_cost(definition: Dictionary,grade := "standard") -> Dictionary:
 var factor: float=GRADES.get(grade,{"cost":1.0}).cost
 var result: Dictionary={}
 for key in definition.get("cost",{}):result[key]=round(float(definition.cost[key])*factor*1000000.0)/1000000.0
 return result

# This queues land units. Ship construction and completion/training require their
# own systems and are deliberately not dispatched by this function.
static func queue_land_unit(state: Dictionary,city: Dictionary,kind: String,grade := "standard") -> Dictionary:
 if not GRADES.has(grade):return {"error":"Tundmatu varustustase."}
 if kind in ["transport","warship"]:return {"error":"Laevade ehitamine ei ole veel avatud."}
 if kind=="militia":return {"error":"Elanikud kaitsevad linna automaatselt."}
 var team:=int(city.team)
 var replacement: Variant=AVAILABILITY.unit_successor(state,team,kind)
 if kind=="bronze_cavalry" or replacement!=null:
  var name: String=ECON.DATA.data.troops.get(replacement if replacement!=null else "cavalry",{}).get("name",kind)
  return {"error":"Asendatud: "+name}
 var tech: String=RESEARCH.data.unit_tech.get(kind,"")
 if kind=="chariot" and "wheel" not in state.research[team].known:return {"error":"Uuri: "+str(RESEARCH.data.techs.wheel.name)}
 if not tech.is_empty() and tech not in state.research[team].known:return {"error":"Uuri: "+str(RESEARCH.data.techs[tech].name)}
 var d: Dictionary=ECON.DATA.data.troops.get(kind,{})
 if d.is_empty() or int(d.get("age",0))>int(state.ages[team]):return {"error":"See üksus ei ole veel avatud."}
 var missing: Array[String]=[]
 var shared_economy: Dictionary=city.economy.duplicate();shared_economy.buildings=District.all_buildings(city)
 for required in d.get("requires",[]):
  if not ECON.ready(shared_economy,team,required):missing.append(ECON.DATA.data.buildings[required].name)
 if not missing.is_empty():return {"error":"Ehita esmalt "+", ".join(missing)}
 if not city.has("training"):city.training=[]
 if city.training.size()>=4:return {"error":"Väljaõppe järjekord on täis (4)."}
 var cost:=troop_cost(d,grade);var realm: Dictionary=city.economy.realms[team]
 if not ECON.can_afford(realm.resources,cost) or float(realm.pop)<6:return {"error":"Toorainet või elanikke napib."}
 ECON.spend_resources(realm.resources,cost);realm.pop-=float(d.get("population",1))
 var job={"kind":kind,"grade":grade,"paidCost":cost,"team":team,"total":float(d.time)*ECON.tempo_factor(state),"progress":0,"assigned":0,"efficiency":0}
 city.training.append(job)
 return {"unit":job,"queued":job}

static func queue_retraining(state: Dictionary,city: Dictionary,source: int,kind: String) -> Dictionary:
 if source<0 or source>=state.units.size():return {"error":"Üksus ei saa praegu ümberõpet alustada."}
 var old: Dictionary=state.units[source];var team:=int(city.team)
 if int(old.team)!=team or float(old.get("hp",0))<=0 or old.kind in ["scout","militia","stone_guard","transport","warship"] or ArmyExperience.is_garrisoned(old):return {"error":"Üksus ei saa praegu ümberõpet alustada."}
 for town in state.cities:
  for job in town.get("training",[]):
   if job.get("upgradeSource")!=null and int(job.upgradeSource)==source:return {"error":"Üksus ei saa praegu ümberõpet alustada."}
 var army: Variant=null
 for candidate in state.armies:
  if int(candidate.team)==team and int(candidate.get("id",0))==int(old.get("armyId",0)):army=candidate;break
 if army==null or int(army.c)!=int(city.c) or int(army.r)!=int(city.r) or not army.get("path",[]).is_empty():return {"error":"Ümberõppeks peab üksus olema linnas."}
 var realm: Dictionary=city.economy.realms[team];var pop: float=realm.pop
 var result:=queue_land_unit(state,city,kind,"standard")
 if result.has("unit"):realm.pop=pop;result.unit.upgradeSource=source;result.unit.populationSpent=0
 return result
