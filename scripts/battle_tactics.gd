class_name BattleTactics
extends RefCounted
const Contact=preload("res://scripts/battle_contact.gd")
const FRONT:=131.5
const EMPTY:=112.5
const BOW=["archer","bronze_archer","iron_archer","crossbowman","chariot","stone_guard"]

static func is_bow(u: Dictionary) -> bool:
 return Contact.troop_role(u.kind) in ["ranged","siege"] or u.kind in ["chariot","dragoon","cuirassier"]
static func horse(u: Dictionary) -> bool:
 return Contact.troop_role(u.kind)=="cavalry" or u.kind=="chariot"
static func line(units: Array,side: int,depth: float,spacing: float,role: String) -> void:
 for i in units.size():
  var u: Dictionary=units[i];u.x=-side*(depth+floori(float(i)/10)*7);u.z=(i%10-(mini(10,units.size())-1)/2.0)*spacing;u.heading=side*PI/2;u.tacticalRole=role;u.battleSide=side;u.deployment={"x":u.x,"z":u.z};u.releaseAt=16 if role=="support" else 0

static func deploy(b: Dictionary) -> Dictionary:
 var teams: Array=[]
 for u in b.squads:
  if u.team not in teams:teams.append(u.team)
 for t in teams.size():
  var team: int=teams[t];var side: int=-1 if t%2 else 1;var front: Array=[];var reserve: Array=[];var guns: Array=[];var bows: Array=[];var mounted: Array=[];var other: Array=[]
  for u in b.squads:
   if int(u.team)!=team or u.get("guardPost",false):continue
   var role:=Contact.troop_role(u.kind)
   if role=="melee" and "axeman" not in str(u.kind):front.append(u)
   if "axeman" in str(u.kind):reserve.append(u)
   if u.kind in ["musketeer","arquebusier","line_infantry","rifleman"]:guns.append(u)
   elif is_bow(u) and u.kind!="chariot":bows.append(u)
   if role in ["cavalry","vehicle"]:mounted.append(u)
   if u not in front and u not in reserve and u not in bows and u not in guns and u not in mounted:other.append(u)
  line(front,side,FRONT,7.5,"line")
  for i in guns.size():
   var u: Dictionary=guns[i];var wing:=1 if i%2 else -1
   u.x=-side*(FRONT+floori(float(i)/8)*7);u.z=wing*(maxf(12,mini(10,front.size())*2.55+5)+posmod(floori(float(i)/2),4)*6);u.heading=side*PI/2;u.tacticalRole="shot";u.battleSide=side;u.deployment={"x":u.x,"z":u.z}
  line(bows,side,FRONT+16,8,"missile");line(reserve,side,FRONT+30,7,"support");line(other,side,FRONT+22,8,"support")
  for i in mounted.size():
   var u: Dictionary=mounted[i];var flank:=1 if i%2 else -1
   u.x=-side*(FRONT-2);u.z=flank*(maxf(38,front.size()*3.2+16)+floori(float(i)/2)*16);u.heading=side*PI/2;u.tacticalRole="mobile-missile" if u.kind=="chariot" else "flank";u.flank=flank;u.battleSide=side;u.deployment={"x":u.x,"z":u.z}
 b.deploymentGap={"minX":-EMPTY,"maxX":EMPTY};b.doctrineVersion=1;b.doctrine="Rivi, laskurite toetus, tiivamanööver ja moraal"
 return b

static func ammunition_load(u: Dictionary) -> int:
 if u.kind in BOW:return 48 if u.kind=="chariot" else 40
 if u.kind in ["slinger","javelinman"]:return 20
 if u.kind in ["bronze_catapult","catapult"]:return 6
 if u.kind=="cuirassier":return 8
 if u.kind=="dragoon":return 24
 return 60
static func prepare_ammunition(man: Dictionary,u: Dictionary) -> void:
 if u.kind in BOW and int(man.get("arrowLoadVersion",0))!=100:
  if man.get("ammo")!=null:man.ammo=float(man.ammo)*2
  man.arrowLoadVersion=100
 if u.kind in ["bronze_catapult","catapult"] and int(man.get("stoneLoadVersion",0))!=103:
  if man.get("ammo")!=null:man.ammo=clampi(floori(float(man.ammo)/2),0,6)
  man.stoneLoadVersion=103
 if man.get("ammo")==null:man.ammo=ammunition_load(u)

static func initialize(b: Dictionary) -> void:
 for u in b.squads:
  if u.get("battleSide")==null:u.battleSide=-1 if int(u.team)!=0 else 1
  if u.get("tacticalRole")==null:u.tacticalRole="mobile-missile" if u.kind=="chariot" else "missile" if is_bow(u) else "flank" if Contact.troop_role(u.kind)=="cavalry" else "line"
  if u.get("deployment")==null:u.deployment={"x":u.x,"z":u.z}
  if u.get("startMen")==null:
   var alive:=0
   for man in u.get("men",[]):
    if float(man.hp)>0:alive+=1
   u.startMen=alive
  for man in u.get("men",[]):
   if man.get("morale")==null:man.morale=64 if u.get("grade")=="mobilized" else 94 if u.get("grade")=="elite" else 82
   if man.get("fatigue")==null:man.fatigue=0
   if is_bow(u):prepare_ammunition(man,u)
   elif not man.has("ammo"):man.ammo=null

static func distance(a: Dictionary,b: Dictionary) -> float:
 return Vector2(float(a.x)-float(b.x),float(a.z)-float(b.z)).length()
static func update_morale(b: Dictionary,dt: float) -> void:
 for u in b.squads:
  if not u.has("men") or u.get("reserve",false) or u.get("retreated",false):continue
  var men: Array=[]
  for man in u.men:
   if float(man.hp)>0 and not man.get("escaped",false):men.append(man)
  var loss:=1.0-float(men.size())/maxi(1,int(u.get("startMen",0)));var friends:=0;var panic:=false
  for q in b.squads:
   if is_same(q,u) or q.team!=u.team:continue
   var d:=distance(q,u)
   if float(q.hp)>0 and not q.get("routing",false) and not q.get("retreated",false) and not q.get("reserve",false) and d<16:friends+=1
   if q.get("routing",false) and d<18:panic=true
  var ammo:=0.0;var spread:=0.0
  for man in men:ammo+=float(man.get("ammo",0)) if man.get("ammo")!=null else 0.0;spread+=maxf(0.0,distance(man,u)-4)
  u.ammoRemaining=ammo
  if (u.kind in ["bronze_catapult","catapult","chariot"]) and not men.is_empty() and ammo==0 and not u.get("hasSiegeSupply",false):
   u.routing=true;u.ammoDepleted=true;u.manualOrder=false;u.target=null
   for man in men:man.routing=true
  u.cohesion=maxf(0,1.0-spread/men.size()/12.0) if not men.is_empty() else 0.0
  var total:=0.0;var routing:=0
  for man in men:
   var base: float=64 if u.get("grade")=="mobilized" else 94 if u.get("grade")=="elite" else 82
   var target: float=base-loss*70+(7 if friends>0 else 0)-(9 if panic else 0)-float(u.get("moraleShock",0))-float(man.fatigue)*0.07-(1-float(u.cohesion))*10
   man.morale=clampf(float(man.morale)+(target-float(man.morale))*minf(1,dt*0.5),0,100)
   if float(man.morale)<24:man.routing=true
   elif float(man.morale)>46 and not u.get("routing",false):man.routing=false
   total+=float(man.morale)
   if man.get("routing",false):routing+=1
  u.morale=total/men.size() if not men.is_empty() else 0.0;u.moraleShock=maxf(0,float(u.get("moraleShock",0))-dt*0.5)
  if not men.is_empty() and (routing>men.size()*0.45 or (loss>0.6 and float(u.morale)<38)):
   if not u.get("routing",false):u.routing=true;u.routAt=b.elapsed;b.moraleRouts=int(b.get("moraleRouts",0))+1
   for man in men:man.routing=true
   u.manualOrder=false;u.target=null

const Formations=preload("res://scripts/battle_formations.gd")
const Army=preload("res://scripts/army_experience.gd")
const ARROWS=["slinger","archer","bronze_archer","iron_archer","crossbowman","chariot","javelinman"]
const SPEARS=["spearman","bronze_spearman","halberdier","pikeman","javelinman"]
static func tactical_stats(definition: Dictionary,u: Dictionary) -> Dictionary:
 var stats:=Army.unit_stats(definition,u)
 if u.get("guardPost",false) and u.kind in ["archer","bronze_archer","iron_archer","crossbowman"]:stats.range=float(stats.range)*1.25
 var formation: Dictionary=Formations.FORMATIONS.get(u.get("formation",""),Formations.FORMATIONS.line)
 stats.speed=float(stats.speed)*(1.0 if u.get("routing",false) else float(formation.speed))
 if u.kind=="cuirassier":stats.range=7.5
 if u.kind=="dragoon":stats.range=minf(float(stats.range),17);stats.speed=float(stats.speed)*0.92
 if u.kind=="chariot":
  var experience:=float(u.get("experienceMultiplier",1));if experience==0:experience=1
  var quality: float={"mobilized":0.4,"elite":1.4}.get(u.get("grade",""),1.0)
  stats.range=18*experience;stats.dmg=18*0.75*experience*quality
 return stats
static func tactical_damage(attacker: Dictionary,target: Dictionary,amount: float,projectile: Variant=null) -> float:
 var m: Dictionary=attacker.m;var u: Dictionary=attacker.u;var n: Dictionary=target.m;var v: Dictionary=target.u
 var dx:=float(m.x)-float(n.x);var dz:=float(m.z)-float(n.z);var d:=sqrt(dx*dx+dz*dz);if d==0:d=1
 var heading: float=n.get("heading",v.get("heading",0));var front: float=(dx*sin(heading)+dz*cos(heading))/d
 var braced: bool=v.kind in SPEARS and not n.get("moving",false) and float(v.get("cohesion",1))>0.45
 if front<0.15:
  amount*=1.35 if front< -0.4 else 1.15;v.moraleShock=minf(18,float(v.get("moraleShock",0))+0.25)
 elif braced and projectile=="arrow":amount*=0.7
 if braced and horse(u) and projectile==null:amount*=0.38 if u.kind=="bronze_cavalry" else 0.55
 if u.kind=="chariot" and projectile==null:amount*=0.5
 if u.kind in SPEARS and Contact.troop_role(v.kind)=="cavalry" and not m.get("moving",false) and float(u.get("cohesion",1))>0.45:amount*=1.6
 return Formations.damage(attacker,target,amount,projectile)*(1-float(m.get("fatigue",0))*0.002)
static func shot_hits(man: Dictionary,u: Dictionary,d: float,shot_range: float,target: Variant=null) -> bool:
 man.shotsFired=int(man.get("shotsFired",0))+1
 var seed: int=((int(u.source)+1)*73856093+(int(man.index)+1)*19349663+int(man.shotsFired)*83492791)&0xffffffff
 seed=((seed^(seed>>16))*0x45d9f3b)&0xffffffff
 var roll:=float(seed)/4294967296.0
 var chance:=clampf(0.91-0.4*d/maxf(1,shot_range)-(0.13 if man.get("wasMoving",false) else 0)+(0.08 if u.get("formation")=="volley" else 0),0.3,0.88)
 if target!=null:chance*=Formations.missile_exposure(target)
 return roll<chance
