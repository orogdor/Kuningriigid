class_name BattleState
extends RefCounted
const Tactics=preload("res://scripts/battle_tactics.gd")
const Contact=preload("res://scripts/battle_contact.gd")
const Army=preload("res://scripts/army_experience.gd")
const FIELD={"columns":3,"rows":3,"ring":1,"tileWidth":225,"tileDepth":195,"minX":-337.5,"maxX":337.5,"minZ":-292.5,"maxZ":292.5,"outerMinX":-562.5,"outerMaxX":562.5,"outerMinZ":-487.5,"outerMaxZ":487.5,"centerX":0,"centerZ":0}
const MAX_MEN:=500
static func ranged(kind: String) -> bool:
 return Contact.troop_role(kind) in ["ranged","siege"]
static func soldier_count(u: Dictionary) -> int:
 if u.kind in ["scout","militia","bronze_catapult","catapult"]:return 1
 return 24 if Contact.troop_role(u.kind) in ["melee","ranged"] else 12
static func living(u: Dictionary) -> int:
 if u.get("men") is Array:
  var n:=0
  for m in u.men:
   if float(m.hp)>0:n+=1
  return n
 if u.get("soldiers") is Array:
  var n:=0
  for m in u.soldiers:
   if float(m.hp)>0:n+=1
  return n
 var count:=1 if u.get("guardPost",false) and not u.get("wallWalk",false) else int(u.get("menCount",soldier_count(u)))
 var maximum:=float(u.get("maxHp",u.hp));if maximum==0:maximum=float(u.hp)
 return ceili(count*minf(1,float(u.hp)/maximum)) if maximum>0 else 0
static func create(cell: Dictionary,units: Array,state: Variant=null) -> Dictionary:
 var ranks: Dictionary={};var squads: Array=[]
 for source in units.size():
  var u: Dictionary=units[source]
  if float(u.hp)<=0 or u.get("retreated",false):continue
  var role:=Contact.troop_role(u.kind);var key:=str(int(u.team))+":"+("ranged" if ranged(u.kind) else "front");var rank:=int(ranks.get(key,0));ranks[key]=rank+1
  var level: int=u.get("armyLevel",clampi(floori(1+4.5*(float(u.get("experienceMultiplier",1))-1)+0.5),1,10));var experience:=float(u.get("experienceMultiplier",1))
  if state is Dictionary:
   experience=1
   for army in state.get("armies",[]):
    if int(army.team)==int(u.team) and int(army.get("id",0))==int(u.get("armyId",0)):experience=Army.experience_bonus(army);break
  elif experience==0:experience=1
  var s={"source":source,"team":u.team,"armyId":u.get("armyId",0),"kind":u.kind,"armyLevel":level,"grade":u.get("grade","standard"),"experienceMultiplier":experience,"hp":u.hp,"maxHp":u.get("maxHp",u.hp),"morale":u.get("morale",100),"combatMode":"manual" if u.get("combatMode")=="manual" else "auto","attackTargetSource":null,"x":(1 if int(u.team)!=0 else -1)*((49 if ranged(u.kind) else 34)+floori(float(rank)/8)*4),"z":(rank%8-3.5)*5+(23 if role=="cavalry" else 0),"heading":-PI/2 if int(u.team)!=0 else PI/2,"target":null,"cool":0,"damageDealt":0,"kills":0}
  if u.has("menCount"):s.menCount=u.menCount
  if u.get("soldiers")!=null:s.soldiers=u.soldiers.duplicate(true)
  squads.append(s)
 var battle={"cell":cell.duplicate(true),"field":FIELD.duplicate(true),"elapsed":0,"result":null,"squads":squads}
 return Tactics.deploy(battle)
static func admit(b: Dictionary) -> int:
 var teams: Array=[];var queues: Array=[]
 for u in b.squads:
  if float(u.hp)>0 and not u.get("retreated",false) and u.team not in teams:teams.append(u.team)
 for team in teams:
  var q: Array=[]
  for u in b.squads:
   if u.team==team and float(u.hp)>0 and not u.get("retreated",false):q.append(u)
  queues.append(q)
 for u in b.squads:u.reserve=false
 var used:=0;var remaining:=true
 while remaining:
  remaining=false
  for q in queues:
   if q.is_empty():continue
   var u: Dictionary=q.pop_front();remaining=true;var n:=living(u);u.reserve=used+n>MAX_MEN
   if not u.reserve:used+=n
 var reserve:=0
 for u in b.squads:
  if u.reserve:reserve+=living(u)
 b.maxMen=MAX_MEN;b.reserveMen=reserve
 return used
static func outside(p: Dictionary) -> bool:
 return float(p.x)<-337.5 or float(p.x)>337.5 or float(p.z)<-292.5 or float(p.z)>292.5
static func initialize_men(b: Dictionary,open: Callable=Callable()) -> bool:
 if int(b.get("towerGarrisonVersion",0))==117 and not b.get("towerGuardsAdmitted",false):admit(b);b.towerGuardsAdmitted=true
 var ready:=int(b.get("individualVersion",0))==1
 if ready:
  for u in b.squads:
   if not u.get("reserve",false) and float(u.hp)>0 and not u.has("men"):ready=false;break
 if ready:
  if int(b.get("contactVersion",0))!=96:
   for u in b.squads:
    for m in u.get("men",[]):m.radius=Contact.soldier_radius(u)
   b.contactVersion=96
  return true
 if not b.get("individualVersion",0):admit(b)
 var placed: Array=[]
 for u in b.squads:
  if u.get("reserve",false) or float(u.hp)<=0 or u.get("retreated",false):continue
  if u.get("men") is Array:
   for man in u.men:
    if float(man.hp)>0 and not u.get("guardPost",false):placed.append(man)
   continue
  var count:=1 if u.get("guardPost",false) and not u.get("wallWalk",false) else int(u.get("menCount",soldier_count(u)))
  var max_hp:=float(u.get("maxHp",u.hp));if max_hp==0:max_hp=float(u.hp)
  var maximum:=max_hp/count;var old: Variant=u.get("soldiers");var alive:=0
  if old is Array:
   for man in old:
    if float(man.hp)>0:alive+=1
  else:alive=mini(count,ceili(float(u.hp)/maximum-0.000000001))
  var mounted: bool=u.kind=="bronze_catapult" or Contact.troop_role(u.kind) in ["cavalry","vehicle"]
  var spacing:=4.1 if mounted else 1.05;var c:=cos(float(u.get("heading",0)));var sn:=sin(float(u.get("heading",0)));var men: Array=[]
  for i in count:
   var hp: float=float(old[i].get("hp",0)) if old is Array and i<old.size() else (0.0 if old is Array else minf(maximum,maxf(0,float(u.hp)-i*maximum)) if i<alive else 0.0)
   var columns:=6 if count>=24 and not mounted else 4
   var ox:=0.0 if count==1 else (i%columns-(columns-1)/2.0)*spacing
   var oz:=0.0 if count==1 else (floori(float(i)/columns)-(ceili(float(count)/columns)-1)/2.0)*spacing
   var gx: float=float(u.x)+c*ox+sn*oz;var gz: float=float(u.z)-sn*ox+c*oz
   var m={"id":str(int(u.source))+":"+str(i),"index":i,"x":gx,"z":gz,"hp":hp,"maxHp":maximum,"cool":(i%4)*0.08,"radius":Contact.soldier_radius(u),"heading":u.get("heading",0),"kills":0,"damageDealt":0}
   if old is Array and hp>0:
    var total:=0.0
    for o in old:total+=float(o.hp)
    if total==0:total=1
    hp=minf(maximum,float(u.hp)*hp/total);m.hp=hp
   if hp>0 and not u.get("guardPost",false):
    var found:=false
    for ring in 100:
     var steps:=maxi(1,ring*8)
     for k in steps:
      var a:=float(k)/steps*TAU;m.x=gx+cos(a)*ring*0.5;m.z=gz+sin(a)*ring*0.5
      if not Contact.deployment_allowed(u,m,b) or outside(m) or (open.is_valid() and not open.call(m.x,m.z)):continue
      var free:=true
      for p in placed:
       var dx:=float(p.x)-float(m.x);var dz:=float(p.z)-float(m.z)
       if sqrt(dx*dx+dz*dz)<float(p.radius)+float(m.radius)+0.025:free=false;break
      if free:found=true;break
     if found:break
    if not found:return false
    placed.append(m)
   men.append(m)
  u.men=men;u.menCount=count;u.maxHp=maximum*count
  var total_hp:=0.0;var alive_now:=0
  for m in men:
   total_hp+=maxf(0,float(m.hp))
   if float(m.hp)>0:alive_now+=1
  u.hp=round(total_hp*1000000000.0)/1000000000.0;u.menAlive=alive_now;u.anchor={"x":u.x,"z":u.z}
 b.individualVersion=1;b.contactVersion=96;Tactics.initialize(b)
 if not b.has("initialMen"):
  var total:=0
  for u in b.squads:
   if u.get("reserve",false) or u.get("retreated",false):continue
   for m in u.get("men",[]):
    if float(m.hp)>0 and not m.get("escaped",false):total+=1
  b.initialMen=total
 if not b.has("casualties"):b.casualties={}
 return true
