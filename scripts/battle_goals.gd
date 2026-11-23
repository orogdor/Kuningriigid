class_name BattleGoals
extends RefCounted
const Tactics=preload("res://scripts/battle_tactics.gd")
const Contact=preload("res://scripts/battle_contact.gd")
const Formations=preload("res://scripts/battle_formations.gd")
const Doctrine=preload("res://scripts/battle_doctrine.gd")
const SPEARS=["spearman","bronze_spearman","halberdier","pikeman","javelinman"]

static func closest(origin: Dictionary,items: Array) -> Variant:
 var best: Variant=null;var distance:=INF
 for item in items:
  var d:=Doctrine.distance(origin,item)
  if d<distance:best=item;distance=d
 return best

static func set_chariot_phase(unit: Dictionary,name: String,now: float) -> void:
 if unit.get("chariotPhase")!=name:
  unit.chariotPhase=name;unit.chariotPhaseAt=now
  if name=="shoot":unit.anchor={"x":unit.x,"z":unit.z}

static func chariot_goal(unit: Dictionary,target: Dictionary,squads: Array,battle: Dictionary,stats: Dictionary,nav: Variant=null) -> Dictionary:
 var now:=float(battle.elapsed);var shot_range:=maxf(9,float(stats.range));var foes: Array=[];var protected: Array=[]
 for foe in squads:
  if foe.team==unit.team or float(foe.hp)<=0 or foe.get("retreated",false) or foe.get("routing",false):continue
  foes.append(foe)
  if foe.kind in SPEARS and (foe.get("formation")=="spear_wall" or float(foe.get("cohesion",1))>0.5):protected.append(foe)
 var near_foe: Variant=closest(unit,foes);if near_foe==null:near_foe=target
 var spear: Variant=closest(unit,protected)
 var danger: Dictionary=spear if spear!=null and Doctrine.distance(unit,spear)<22 else near_foe
 var near:=Doctrine.distance(unit,near_foe)<9 or Doctrine.distance(unit,danger)<9
 var guarded:=spear!=null and Doctrine.distance(unit,spear)<12
 var flank:=float(unit.get("flank",1));if flank==0:flank=1
 var elapsed:=now-float(unit.get("chariotPhaseAt",now))
 if not unit.get("chariotPhase"):set_chariot_phase(unit,"approach",now)
 if near or guarded:set_chariot_phase(unit,"withdraw",now)
 elif unit.chariotPhase=="shoot" and elapsed>=5.5:set_chariot_phase(unit,"withdraw",now)
 elif unit.chariotPhase=="withdraw" and ((Doctrine.distance(unit,near_foe)>shot_range*1.2 and elapsed>1.8) or elapsed>6):set_chariot_phase(unit,"approach",now)
 elif unit.chariotPhase=="approach" and Doctrine.distance(unit,target)<shot_range*0.98 and Doctrine.distance(unit,target)>11 and Doctrine.distance(unit,near_foe)>10:set_chariot_phase(unit,"shoot",now)
 if unit.chariotPhase=="shoot":return unit.get("anchor",unit)
 var d:=maxf(1,Doctrine.distance(unit,danger));var side:=float(unit.get("battleSide",1));if side==0:side=1
 var goal: Dictionary={"x":float(unit.x)+(float(unit.x)-float(danger.x))/d*28,"z":float(unit.z)+(float(unit.z)-float(danger.z))/d*28+flank*7} if unit.chariotPhase=="withdraw" else {"x":float(target.x)-side*shot_range*0.78,"z":float(target.z)+flank*10}
 var safe: Dictionary={"x":clampf(goal.x,-210,210),"z":clampf(goal.z,-180,180)}
 if nav!=null and not (nav.is_open(safe.x,safe.z) and nav.is_open(float(safe.x)-1.5,safe.z) and nav.is_open(float(safe.x)+1.5,safe.z)):
  var open: Variant=nav.nearest(safe,21)
  return open if open!=null and nav.is_open(open.x,open.z) else unit.get("anchor",unit)
 return safe

static func tactical_goal(unit: Dictionary,nearest: Dictionary,squads: Array,battle: Dictionary,stats: Dictionary,nav: Variant=null) -> Variant:
 var side:=float(unit.get("battleSide",1));if side==0:side=1
 if unit.get("routing",false):return {"x":-side*250,"z":unit.z}
 if Tactics.is_bow(unit) and unit.get("ammoRemaining")==0:return Contact.contact_goal(unit,nearest)
 if Formations.FORMATIONS.get(unit.get("formation",""),{}).get("hold",false):return unit.get("anchor",unit)
 if float(unit.get("releaseAt",0))>float(battle.elapsed) and Doctrine.distance(unit,nearest)>26:return unit.get("deployment")
 var release:=float(unit.get("releaseAt",16));if release==0:release=16
 if unit.get("tacticalRole")=="support" and float(battle.elapsed)<release and Doctrine.distance(unit,nearest)>16:return unit.get("deployment")
 if unit.kind=="chariot":return chariot_goal(unit,nearest,squads,battle,stats,nav)
 if Tactics.horse(unit):
  var enemies: Array=[];var guarded: Array=[]
  for foe in squads:
   if foe.team==unit.team or float(foe.hp)<=0 or foe.get("routing",false) or foe.get("retreated",false):continue
   enemies.append(foe)
   if foe.kind in SPEARS and (foe.get("formation") in ["spear_wall","shield_wall"] or float(foe.get("cohesion",1))>0.55):guarded.append(foe)
  var guard: Variant=closest(unit,guarded);var flank:=float(unit.get("flank",0));if flank==0:flank=1 if int(unit.get("source",0))%2 else -1
  var early: bool=unit.kind=="bronze_cavalry"
  var braced: bool=guard!=null and (guard.get("formation")=="spear_wall" or float(guard.get("cohesion",0))>0.65)
  var hazard: bool=guard!=null and Doctrine.distance(unit,guard)<(19 if early else 17 if braced else 10)
  var dense: Variant=null
  if early:
   for foe in enemies:
    if Contact.troop_role(foe.kind)=="melee" and foe.kind!="militia" and float(foe.get("cohesion",1))>0.65 and Doctrine.distance(unit,foe)<11:dense=foe;break
  if (hazard and (early or braced)) or dense!=null:
   var threat: Dictionary=guard if hazard else dense
   var dx:=float(unit.x)-float(threat.x);var dz:=float(unit.z)-float(threat.z);var length:=sqrt(dx*dx+dz*dz);if length==0:length=1
   return {"x":float(unit.x)+dx/length*22,"z":float(unit.z)+dz/length*22+flank*5}
  if unit.kind in ["dragoon","cuirassier"]:
   var shot_range:=float(stats.range)*0.8;var d:=Doctrine.distance(unit,nearest)
   if unit.get("ammoRemaining")!=0 and d<=shot_range*1.12:
    if unit.kind=="dragoon" and d<7:return {"x":float(unit.x)-side*12,"z":float(unit.z)+flank*5}
    return unit.get("anchor",unit)
   if unit.get("ammoRemaining")!=0:return {"x":float(nearest.x)-side*shot_range,"z":float(nearest.z)+flank*4}
  if early and guard!=null and Doctrine.distance(unit,guard)<25:return {"x":float(guard.x)-side*16,"z":float(guard.z)+flank*23}
  var edge:=28.0
  for foe in enemies:
   if Contact.troop_role(foe.kind)=="melee":edge=maxf(edge,absf(float(foe.z)))
  var wing:=flank*minf(72,edge+12)
  if not unit.get("flankReady",false) and absf(float(unit.z)-wing)>8 and absf(float(unit.x)-float(nearest.x))>28:
   if unit.get("flankStartAt")==null:unit.flankStartAt=battle.elapsed
   if float(battle.elapsed)-float(unit.flankStartAt)<6:return {"x":unit.x,"z":wing}
  unit.flankReady=true
  return Contact.contact_goal(unit,nearest)
 var deployment: Dictionary=unit.get("deployment",unit)
 if Contact.troop_role(unit.kind)=="siege" and unit.get("ammoRemaining")!=0:
  var x:=float(nearest.x)-side*float(stats.range)*0.8
  return {"x":maxf(float(unit.x),x) if side>0 else minf(float(unit.x),x),"z":deployment.get("z",unit.z)} if Doctrine.distance(unit,nearest)>float(stats.range)*0.9 else null
 if unit.get("tacticalRole")=="shot" and unit.get("ammoRemaining")!=0:
  return {"x":float(nearest.x)-side*float(stats.range)*0.7,"z":deployment.get("z",unit.z)} if Doctrine.distance(unit,nearest)>float(stats.range)*0.8 else null
 if Tactics.is_bow(unit) and unit.get("ammoRemaining")!=0:
  var front: Array=[]
  for ally in squads:
   if ally.team==unit.team and ally.get("tacticalRole")=="line" and not ally.get("routing",false):front.append(ally)
  var anchor: Variant=closest(nearest,front)
  if anchor!=null and Doctrine.distance(unit,nearest)>float(stats.range)*0.85:
   var x:=float(anchor.x)-side*5
   return {"x":maxf(float(unit.x),x) if side>0 else minf(float(unit.x),x),"z":deployment.get("z",unit.z)}
  if anchor==null and unit.kind in ["slinger","archer","bronze_archer","iron_archer","javelinman"] and Doctrine.distance(unit,nearest)>float(stats.range)*0.8:
   return {"x":float(nearest.x)-side*float(stats.range)*0.7,"z":nearest.z}
  return null
 return Contact.contact_goal(unit,nearest)
