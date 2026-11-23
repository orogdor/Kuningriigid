class_name BattleDoctrine
extends RefCounted
const Tactics=preload("res://scripts/battle_tactics.gd")
const Field=preload("res://scripts/battle_state.gd")
const SPEARS=["spearman","bronze_spearman","halberdier","pikeman","javelinman"]
const MISSILE=["archer","bronze_archer","iron_archer","slinger","crossbowman","musketeer","rifleman"]

static func distance(a: Dictionary,b: Dictionary) -> float:
 var x:=float(a.x)-float(b.x);var z:=float(a.z)-float(b.z);return sqrt(x*x+z*z)

static func opponent_cost(unit: Dictionary,target: Dictionary) -> float:
 var horse:=Tactics.horse(unit);var braced: bool=target.kind in SPEARS and (target.get("formation")=="spear_wall" or float(target.get("cohesion",1))>0.65)
 var early: bool=unit.kind in ["chariot","bronze_cavalry"];var deployment: Dictionary=unit.get("deployment",unit)
 return distance(unit,target)+absf(float(deployment.get("z",unit.z))-float(target.z))*0.65+(float(100 if early else 42) if horse and braced else 0.0)+(14 if horse and target.get("formation")=="shield_wall" else 0)+(-13 if horse and target.kind in MISSILE else 0)+(-10 if horse and target.get("routing",false) else 0)

static func committed_opponent(unit: Dictionary,foes: Array) -> Variant:
 var active: Array=[];var routed: Array=[]
 for foe in foes:
  if float(foe.hp)<=0 or foe.get("retreated",false) or foe.get("reserve",false):continue
  routed.append(foe)
  if not foe.get("routing",false):active.append(foe)
 var candidates: Array=active if not active.is_empty() else routed
 var best: Variant=null;var previous: Variant=null;var cost:=INF
 for foe in candidates:
  var next:=opponent_cost(unit,foe)
  if next<cost:cost=next;best=foe
  if foe.get("source")==unit.get("engagementTarget") and unit.get("engagementTarget")!=null:previous=foe
 var target: Variant=previous if previous!=null and best!=null and opponent_cost(unit,previous)<cost*1.35+8 else best
 if target!=null:unit.engagementTarget=target.source
 return target

static func marching_goal(unit: Dictionary,target: Variant,goal: Variant) -> Variant:
 if goal==null or target==null or unit.get("routing",false) or unit.get("manualOrder",false) or Tactics.is_bow(unit) or unit.get("tacticalRole") in ["flank","support"]:return goal
 var side:=float(unit.get("battleSide",1));if side==0:side=1
 if distance(unit,target)>22 and (float(target.x)-float(unit.x))*side>0:
  var deployment: Dictionary=unit.get("deployment",unit)
  return {"x":goal.x,"z":deployment.get("z",unit.z)}
 return goal

static func keep_advance(unit: Dictionary,man: Dictionary,goal: Dictionary,enemy_distance: float,target: Variant=null) -> Dictionary:
 if unit.get("routing",false) or man.get("routing",false) or unit.get("manualOrder",false) or unit.get("formation") in ["hold","spear_wall"] or (unit.get("formationManual",false) and unit.get("formation")=="skirmish") or enemy_distance<18:return goal
 var side:=float(unit.get("battleSide",1));if side==0:side=1
 if target!=null and (float(target.x)-float(man.x))*side<=0:return goal
 return {"x":man.x,"z":goal.z} if (float(goal.x)-float(man.x))*side<0 else goal

static func retreat_point(agent: Dictionary,side:=1.0,threat: Variant=null) -> Dictionary:
 var f: Dictionary=Field.FIELD
 var points: Array=[{"x":float(f.minX)-6,"z":agent.z},{"x":float(f.maxX)+6,"z":agent.z},{"x":agent.x,"z":float(f.minZ)-6},{"x":agent.x,"z":float(f.maxZ)+6}]
 var best: Dictionary=points[0];var score:=exit_score(agent,best,side,threat)
 for point in points.slice(1):
  var next:=exit_score(agent,point,side,threat)
  if next<score:score=next;best=point
 return best

static func exit_score(agent: Dictionary,p: Dictionary,side: float,threat: Variant) -> float:
 var d:=distance(agent,p);if d==0:d=1
 var t:=distance(agent,threat) if threat!=null else INF
 var danger:=0.0
 if t<30:danger=maxf(0,((float(p.x)-float(agent.x))*(float(threat.x)-float(agent.x))+(float(p.z)-float(agent.z))*(float(threat.z)-float(agent.z)))/(d*maxf(1,t)))*180
 return d+(0 if float(p.x)*side<0 else 20)+danger
