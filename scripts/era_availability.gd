class_name EraAvailability
extends RefCounted
const ECON=preload("res://data/economy.json")
const RULES=preload("res://data/build_rules.json")
const RESEARCH=preload("res://data/research.json")
const BUILDING_SUCCESSORS={"study":["scriptorium"],"scriptorium":["academy"],"academy":["university"],"university":["polytechnic"],"polytechnic":["laboratory"],"watchtower":["stonetower"],"archery":["crossbow_range"],"palisade":["stonewall"]}
const UNIT_SUCCESSORS={"slinger":["bronze_archer"],"spearman":["bronze_spearman"],"axeman":["bronze_axeman"],"archer":["bronze_archer"],"bronze_spearman":["infantry"],"bronze_axeman":["infantry"],"bronze_archer":["iron_archer"],"bronze_cavalry":["cavalry"],"chariot":["cavalry"],"infantry":["man_at_arms"],"cavalry":["knight","heavy_cavalry"],"iron_archer":["crossbowman"],"javelinman":["crossbowman"],"crossbowman":["arquebusier","musketeer"],"man_at_arms":["pikeman"],"halberdier":["pikeman"],"knight":["cuirassier"],"heavy_cavalry":["cuirassier"],"arquebusier":["line_infantry","rifleman"],"musketeer":["line_infantry","rifleman"],"pikeman":["line_infantry"],"cuirassier":["dragoon"],"line_infantry":["modern_infantry"],"rifleman":["modern_infantry"],"dragoon":["motorized"],"bronze_catapult":["catapult"],"catapult":["field_cannon"],"field_cannon":["industrial_artillery"],"battering_ram":["field_cannon"],"siege_tower":["field_cannon"]}

static func successor(graph: Dictionary,id: String,unlocked: Callable) -> Variant:
 var seen: Dictionary={};seen[id]=true
 var queue: Array=graph.get(id,[]).duplicate();var found: Variant=null
 while not queue.is_empty():
  var next: String=queue.pop_front()
  if seen.has(next):continue
  seen[next]=true
  if unlocked.call(next):found=next
  queue.append_array(graph.get(next,[]))
 return found

static func building_successor(state: Dictionary,team: int,id: String) -> Variant:
 var age:=int(state.ages[team]);var known: Array=state.research[team].known
 return successor(BUILDING_SUCCESSORS,id,func(next):
  var tech: String=RESEARCH.data.build_tech.get(next,"")
  return int(RULES.data.age.get(next,99))<=age and (tech.is_empty() or tech in known))

static func unit_successor(state: Dictionary,team: int,id: String) -> Variant:
 var age:=int(state.ages[team]);var known: Array=state.research[team].known
 return successor(UNIT_SUCCESSORS,id,func(next):
  if not ECON.data.troops.has(next):return false
  var tech: String=RESEARCH.data.unit_tech.get(next,"")
  return int(ECON.data.troops[next].get("age",0))<=age and (tech.is_empty() or tech in known))

static func supplies_building(candidate: String,required: String) -> bool:
 return candidate==required or successor(BUILDING_SUCCESSORS,required,func(next):return next==candidate)!=null
