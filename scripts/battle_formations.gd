class_name BattleFormations
extends RefCounted
const Contact=preload("res://scripts/battle_contact.gd")
const ECON=preload("res://data/economy.json")
const FORMATIONS={
 "line":{"name":"Tavarivi","speed":1.0,"columns":4,"width":1.05,"depth":1.05,"formTime":0.0,"turn":1.5},
 "hold":{"name":"Hoia positsiooni","speed":0.8,"columns":4,"width":1.05,"depth":1.05,"formTime":2.0,"turn":0.9,"hold":true},
 "shield_wall":{"name":"Kilbivall","bronzeName":"Kilbirivi","speed":0.48,"columns":6,"width":0.76,"depth":0.95,"formTime":4.0,"turn":0.45,"defensive":true},
 "spear_wall":{"name":"Odade vastuvõtt","speed":0.35,"columns":4,"width":0.9,"depth":1.0,"formTime":4.0,"turn":0.35,"hold":true,"defensive":true},
 "loose":{"name":"Hajurivi","speed":1.0,"columns":4,"width":1.6,"depth":1.6,"formTime":3.0,"turn":1.5},
 "skirmish":{"name":"Lase ja eemaldu","speed":1.0,"columns":4,"width":1.6,"depth":1.6,"formTime":3.0,"turn":1.7},
 "volley":{"name":"Kogupauk","speed":0.75,"columns":6,"width":1.0,"depth":1.1,"formTime":4.0,"turn":0.8},
 "charge":{"name":"Koondunud ratsarünnak","speed":1.15,"columns":4,"width":4.1,"depth":4.1,"formTime":4.0,"turn":0.7}}
const SHIELDS=["bronze_spearman","infantry","man_at_arms"]
const SPEARS=["spearman","bronze_spearman","halberdier","pikeman"]
const LIGHT=["slinger","archer","bronze_archer","iron_archer","javelinman"]
const GUNS=["musketeer","arquebusier","line_infantry","rifleman"]
const HORSE=["cavalry","knight","heavy_cavalry","cuirassier"]

static func options(u: Dictionary) -> Array:
 var kind: String=u.kind;var age:=int(ECON.data.troops.get(kind,{}).get("age",0));var list: Array=["line","hold"]
 if kind in SHIELDS and age>=1 and age<=3:list.append("shield_wall")
 if kind in SPEARS and age<=4:list.append("spear_wall")
 if kind in LIGHT or kind in GUNS:list.append("loose")
 if kind in LIGHT or kind in ["chariot","dragoon"]:list.append("skirmish")
 if kind in GUNS and age>=4 and age<=5:list.append("volley")
 if kind in HORSE and age>=1 and age<=4:list.append("charge")
 return list
static func set_formation(u: Dictionary,id: String,time:=0.0,manual:=true) -> bool:
 if id not in options(u) or u.get("routing",false):return false
 u.formation=id;u.formationManual=manual;u.formationProgress=0;u.formationStrength=0;u.formationChangedAt=time;u.anchor={"x":u.x,"z":u.z};u.formationFacing=u.get("heading",0);u.erase("slotStamp");u.volleyAt=time+4;u.volleyNumber=0;u.volleyWindow=false;return true
static func turn(current: float,target: float,dt: float,rate: float) -> float:
 var delta:=atan2(sin(target-current),cos(target-current));return current+clampf(delta,-rate*dt,rate*dt)
static func slot(u: Dictionary,index: int,count: int) -> Dictionary:
 var p: Dictionary=FORMATIONS.get(u.get("formation",""),FORMATIONS.line);var mounted: bool=Contact.troop_role(u.kind) in ["cavalry","vehicle"]
 var width: float=3 if u.kind=="bronze_catapult" else 6.2 if u.kind=="chariot" else 4.1 if mounted else p.width
 var depth: float=3 if u.kind=="bronze_catapult" else 6.2 if u.kind=="chariot" else 4.1 if mounted else p.depth
 if u.get("formation")=="charge":
  var row:=0;var start:=0;var total:=0;var r:=0;var n:=0
  while n<count:
   var take:=mini(r+1,count-n);total+=r*take;n+=take;r+=1
  while index>=start+row+1:start+=row+1;row+=1
  var members:=mini(row+1,count-start)
  return {"x":(index-start-(members-1)/2.0)*width,"z":(float(total)/count-row)*depth}
 var columns:=mini(count,int(p.columns));var rows:=ceili(float(count)/columns)
 return {"x":(index%columns-(columns-1)/2.0)*width,"z":(floori(float(index)/columns)-(rows-1)/2.0)*depth}
static func world_slot(u: Dictionary,man: Dictionary,count: int) -> Dictionary:
 var off:=slot(u,int(man.get("slotIndex",man.get("index",0))),count);var heading:=float(u.get("formationFacing",u.get("heading",0)));var c:=cos(heading);var s:=sin(heading);var anchor: Dictionary=u.get("anchor",u)
 return {"x":float(anchor.x)+c*float(off.x)+s*float(off.z),"z":float(anchor.z)-s*float(off.x)+c*float(off.z)}
static func missile_exposure(u: Dictionary) -> float:
 return 1-0.22*float(u.get("formationStrength",0)) if u.get("formation") in ["loose","skirmish"] else 1.0
static func damage(attacker: Dictionary,target: Dictionary,amount: float,missile: Variant=null) -> float:
 var m: Dictionary=attacker.m;var u: Dictionary=attacker.u;var n: Dictionary=target.m;var v: Dictionary=target.u
 var dx:=float(m.x)-float(n.x);var dz:=float(m.z)-float(n.z);var distance:=sqrt(dx*dx+dz*dz);if distance==0:distance=1
 var facing:=float(v.get("formationFacing",n.get("heading",0)));var front: float=(dx*sin(facing)+dz*cos(facing))/distance;var strength:=float(v.get("formationStrength",0));var supported: bool=n.get("coverSupport",false) and not n.get("moving",false)
 if v.get("formation")=="shield_wall" and supported and front>0.5 and missile!="bullet":amount*=1-strength*(0.4 if missile!=null else 0.22)
 if v.get("formation")=="spear_wall" and supported and front>0.5 and Contact.troop_role(u.kind)=="cavalry":amount*=1-strength*0.45
 if v.get("formation") in ["loose","skirmish"] and missile==null:amount*=1.1
 if u.get("formation")=="charge" and missile==null and float(m.get("chargeDistance",0))>=6 and float(m.get("chargeCooldown",0))<=0:
  if not (v.get("formation")=="spear_wall" and supported and front>0.4 and strength>0.5):amount*=1.5
  m.chargeDistance=0;m.chargeCooldown=12
 return amount

static func dist(a: Dictionary,b: Dictionary) -> float:
 var dx:=float(a.x)-float(b.x);var dz:=float(a.z)-float(b.z);return sqrt(dx*dx+dz*dz)
static func update(b: Dictionary,dt: float) -> void:
 var squads: Array=[]
 for u in b.squads:
  if u.has("men") and float(u.hp)>0 and not u.get("retreated",false) and not u.get("reserve",false):squads.append(u)
 for u in squads:
  if u.get("guardPost",false):continue
  if u.get("formation")==null or str(u.formation).is_empty() or u.formation not in options(u):set_formation(u,"line",float(b.elapsed),false)
  var foes: Array=[];var nearest: Variant=null;var nearest_distance:=INF
  for v in squads:
   if v.team==u.team or v.get("routing",false):continue
   foes.append(v);var d:=dist(u,v)
   if d<nearest_distance:nearest_distance=d;nearest=v
  if not u.get("formationManual",false) and not u.get("routing",false) and not u.get("manualOrder",false):
   var desired: String="line";var choices:=options(u)
   if nearest!=null:
    var nearby_ranged:=false;var nearby_spear:=false
    for v in foes:
     var d:=dist(u,v)
     if Contact.troop_role(v.kind)=="ranged" and d<35:nearby_ranged=true
     if v.kind in SPEARS and (v.get("formation")=="spear_wall" or float(v.get("cohesion",1))>0.65) and d<24:nearby_spear=true
    if "spear_wall" in choices and Contact.bracing_threat(u,foes):desired="spear_wall"
    elif "shield_wall" in choices and (nearest_distance<24 or nearby_ranged):desired="shield_wall"
    elif "skirmish" in choices and u.get("ammoRemaining")!=0:desired="loose"
    elif "volley" in choices and u.get("ammoRemaining")!=0:desired="volley"
    elif "charge" in choices and nearest_distance<25 and not nearby_spear:desired="charge"
   if desired!=u.formation and float(b.elapsed)-float(u.get("formationChangedAt",0))>6:set_formation(u,desired,float(b.elapsed),false)
  var p: Dictionary=FORMATIONS.get(u.formation,FORMATIONS.line);var men: Array=[]
  for man in u.men:
   if float(man.hp)>0 and not man.get("escaped",false):men.append(man)
  var facing:=float(u.get("fixedFacing",u.get("heading",0)));u.formationFacing=turn(float(u.get("formationFacing",facing)),facing,dt,float(p.turn))
  var ids:=PackedStringArray()
  for man in men:ids.append(str(man.id))
  var stamp: String=str(u.formation)+":"+",".join(ids)
  if u.get("slotStamp")!=stamp:
   var tolerance:=0.000000001 if int(ECON.data.troops.get(u.kind,{}).get("age",99))<=2 else 0.0
   var available: Array=[];var unassigned: Array=[]
   for i in men.size():available.append(i);unassigned.append(i)
   while not unassigned.is_empty():
    var best_man:=-1;var best_slot:=-1;var best_cost:=INF
    for mi in unassigned:
     for si in available:
      var goal:=world_slot(u,{"slotIndex":si},men.size());var cost:=dist(men[mi],goal)
      if cost<best_cost-tolerance:best_cost=cost;best_man=mi;best_slot=si
    men[best_man].slotIndex=best_slot;available.erase(best_slot);unassigned.erase(best_man)
   u.slotStamp=stamp
  var ready:=0
  for man in men:
   var goal:=world_slot(u,man,men.size())
   if dist(man,goal)<1.2:ready+=1
   var support:=false
   for other in men:
    if not is_same(other,man) and dist(man,other)<1.35:support=true;break
   man.coverSupport=support;man.chargeCooldown=maxf(0,float(man.get("chargeCooldown",0))-dt)
  var ratio:=float(ready)/maxi(1,men.size());u.formationProgress=clampf(float(u.get("formationProgress",0))+dt*(1 if ratio>=0.6 else -0.5),0,float(p.formTime))
  u.formationStrength=(float(u.formationProgress)/float(p.formTime) if float(p.formTime)>0 else 1.0)*ratio*minf(1,maxf(0,men.size()-1)/3.0)*float(u.get("cohesion",1))
  u.volleyWindow=false
  if u.formation=="volley" and float(u.formationStrength)>0.6 and not (u.get("manualOrder",false) and u.get("target")!=null) and float(b.elapsed)>=float(u.get("volleyAt",0)):
   u.volleyWindow=true;u.volleyNumber=int(u.get("volleyNumber",0))+1;u.volleyAt=float(b.elapsed)+3

static func attack_ready(u: Dictionary,man: Dictionary,_b: Dictionary,ready: bool) -> bool:
 if not ready:return false
 if u.get("formation")=="volley" and float(man.get("ammo",0))>0:return u.get("volleyWindow",false) and man.get("lastVolley")!=u.get("volleyNumber")
 return true
static func clear_shot(actor: Dictionary,target: Variant,agents: Array) -> bool:
 if target==null:return true
 var a: Dictionary=actor.m;var b: Dictionary=target.m;var dx:=float(b.x)-float(a.x);var dz:=float(b.z)-float(a.z);var len2:=dx*dx+dz*dz
 if len2<1:return true
 for p in agents:
  if is_same(p,actor) or p.u.team!=actor.u.team or float(p.m.hp)<=0 or p.m.get("escaped",false):continue
  var t:=((float(p.m.x)-float(a.x))*dx+(float(p.m.z)-float(a.z))*dz)/len2
  if t<=0.03 or t>=0.97:continue
  var xx:=float(p.m.x)-float(a.x)-dx*t;var zz:=float(p.m.z)-float(a.z)-dz*t
  if sqrt(xx*xx+zz*zz)<float(p.m.radius)+0.1:return false
 return true
