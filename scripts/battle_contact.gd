class_name BattleContact
extends RefCounted
const ECON=preload("res://data/economy.json")
const EMPTY_HALF_WIDTH:=112.5
const FRONT_DEPTH:=131.5

static func troop_role(kind: String) -> String:
 var role: String=ECON.data.troops.get(kind,{}).get("role","")
 if not role.is_empty():return role
 if kind in ["archer","slinger","stone_guard","crossbowman","musketeer","rifleman","motorized"]:return "ranged"
 if kind in ["cavalry","knight","heavy_cavalry"]:return "cavalry"
 if kind in ["catapult","battering_ram","siege_tower"]:return "siege"
 return "melee"

static func soldier_radius(unit: Dictionary) -> float:
 var kind: String=unit.kind;var role:=troop_role(kind)
 if kind=="bronze_catapult":return 1.05
 if kind=="chariot" or role=="vehicle":return 2.0
 if role=="cavalry":return 1.05
 return 0.34

static func melee_reach(unit: Dictionary,man: Variant,target: Variant) -> float:
 var man_radius: Variant=man.get("radius") if man!=null else null
 var target_radius: Variant=target.get("radius") if target!=null else null
 var bodies: float=(0.34 if man_radius==null else float(man_radius))+(0.34 if target_radius==null else float(target_radius))
 var kind: String=unit.kind
 var weapon:=1.05 if kind in ["spearman","bronze_spearman","javelinman"] else (1.85 if kind in ["pikeman","halberdier"] else (0.55 if troop_role(kind)=="cavalry" else 0.38))
 return bodies+weapon

static func contact_goal(unit: Dictionary,target: Dictionary) -> Variant:
 return target if sqrt(pow(float(unit.x)-float(target.x),2)+pow(float(unit.z)-float(target.z),2))>1.8 else null

static func bracing_threat(unit: Dictionary,foes: Array) -> bool:
 var nearest: Variant=null;var best:=INF
 for foe in foes:
  if foe.get("routing",false):continue
  var distance:=sqrt(pow(float(unit.x)-float(foe.x),2)+pow(float(unit.z)-float(foe.z),2))
  if distance<best:nearest=foe;best=distance
 return nearest!=null and (nearest.kind!="chariot" or nearest.get("ammoRemaining") == 0) and troop_role(nearest.kind)=="cavalry" and best<12

static func deployment_allowed(unit: Dictionary,p: Dictionary,battle: Dictionary) -> bool:
 var side:=float(unit.get("battleSide",1))
 if side==0:side=1
 return not battle.get("deploymentGap",false) or battle.get("fortress",false) or unit.get("guardPost",false) or unit.get("civilian",false) or unit.get("manualOrder",false) or float(p.x)*side<=-EMPTY_HALF_WIDTH-float(p.get("radius",0))
