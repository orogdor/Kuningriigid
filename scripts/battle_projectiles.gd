class_name BattleProjectiles
extends RefCounted
const Siege=preload("res://scripts/battle_siege_rules.gd")
const MAX_DEVIATION:=14.4

static func roll(value: int) -> float:
 var seed: int=(value^(value>>16))&0xffffffff
 seed=(seed*0x7feb352d)&0xffffffff
 seed=(seed^(seed>>15))&0xffffffff
 seed=(seed*0x846ca68b)&0xffffffff
 return float((seed^(seed>>16))&0xffffffff)/4294967296.0

static func landing_point(unit: Dictionary,shot: int,target: Dictionary) -> Dictionary:
 var inferred:=1+(float(unit.get("experienceMultiplier",1))-1)*4.5
 var level:=clampi(floori(float(unit.get("armyLevel",inferred))+0.5),1,10)
 if level==10:return {"x":target.x,"z":target.z,"level":level,"deviation":0.0}
 var seed: int=((((int(unit.get("source",0))+31)*73856093)&0xffffffff)^(((shot+1)*19349663)&0xffffffff)^(((int(unit.team)+1)*83492791)&0xffffffff))&0xffffffff
 var deviation:=MAX_DEVIATION*(10-level)/9.0*sqrt(roll(seed))
 var angle:=roll(seed^0x9e3779b9)*TAU
 return {"x":float(target.x)+cos(angle)*deviation,"z":float(target.z)+sin(angle)*deviation,"level":level,"deviation":deviation}

static func damage_man(battle: Dictionary,attacker: Variant,target: Dictionary,amount: float,splash:=false,projectile: Variant=null) -> float:
 var actor: Dictionary=attacker if attacker is Dictionary else {"u":{},"m":{}}
 var shot: Variant=projectile
 if shot==null:
  if splash:shot="stone"
  else:shot=actor.m.get("projectile",actor.u.get("projectile"))
 amount*=Siege.cover(actor,target,shot)
 var man: Dictionary=target.m;var unit: Dictionary=target.u;var before:=float(man.hp)
 man.hp=maxf(0,before-amount);man.hitTime=battle.elapsed;var hit:=before-float(man.hp)
 if attacker is Dictionary:
  actor.m.damageDealt=float(actor.m.get("damageDealt",0))+hit;actor.u.damageDealt=float(actor.u.get("damageDealt",0))+hit
  if not splash:
   actor.m.attackTime=battle.elapsed;actor.u.attackTime=battle.elapsed
   actor.m.shot={"x":actor.m.x,"z":actor.m.z,"toX":man.x,"toZ":man.z};actor.u.shot=actor.m.shot
 unit.hitTime=battle.elapsed;unit.hp=maxf(0,float(unit.hp)-hit)
 if before>0 and float(man.hp)<=0:
  man.deathTime=battle.elapsed
  if not battle.has("casualties"):battle.casualties={}
  var team_key:=str(int(unit.team));battle.casualties[team_key]=int(battle.casualties.get(team_key,0))+1
  if attacker is Dictionary and not is_same(actor.m,man):actor.m.kills=int(actor.m.get("kills",0))+1;actor.u.kills=int(actor.u.get("kills",0))+1
 return hit

static func resolve_landings(battle: Dictionary) -> void:
 if not battle.has("rockShots"):battle.rockShots=[]
 if not battle.has("rockImpacts"):battle.rockImpacts=[]
 var due: Array=[];var later: Array=[]
 for shot in battle.rockShots:
  if int(shot.get("balanceVersion",0))!=105:
   shot.radius=float(shot.radius)*0.75;shot.damage=float(shot.damage)*1.25;shot.balanceVersion=105
  if float(shot.landsAt)<=float(battle.elapsed):due.append(shot)
  else:later.append(shot)
 battle.rockShots=later
 for shot in due:
  var attacker: Variant=null
  for squad in battle.squads:
   if int(squad.source)!=int(shot.source) or int(squad.team)!=int(shot.team):continue
   for man in squad.get("men",[]):
    if str(man.id)==str(shot.manId):attacker={"u":squad,"m":man};break
   break
  var injured:=0;var friendlies:=0
  for squad in battle.squads:
   if squad.get("reserve",false) or squad.get("retreated",false):continue
   for man in squad.get("men",[]):
    if float(man.hp)<=0 or man.get("escaped",false):continue
    var dx:=float(man.x)-float(shot.x);var dz:=float(man.z)-float(shot.z)
    var d:=maxf(0,sqrt(dx*dx+dz*dz)-float(man.get("radius",0.34))*0.25)
    if d>float(shot.radius):continue
    var amount: float=float(shot.damage)*(0.25+0.75*(1-d/float(shot.radius)))
    if damage_man(battle,null if squad.team==shot.team else attacker,{"u":squad,"m":man},amount,true)>0:
     injured+=1
     if squad.team==shot.team:friendlies+=1
  var structures: Array=battle.get("siegeSections",[]).duplicate()
  if battle.get("fortress") is Dictionary:structures.append(battle.fortress)
  for structure in structures:
   if float(structure.hp)<=0:continue
   var dx:=float(structure.x)-float(shot.x);var dz:=float(structure.z)-float(shot.z)
   if sqrt(dx*dx+dz*dz)>float(shot.radius)+2:continue
   if is_same(structure,battle.get("fortress")):
    if not battle.get("siegeProtected",false):structure.hp=maxf(0,float(structure.hp)-float(shot.damage)*0.7)
   else:
    Siege.damage({"kind":shot.kind},structure,float(shot.damage)*0.8)
    if structure.get("breached",false):battle.siegeBreached=true;battle.breachAt={"x":structure.x,"z":structure.z}
  battle.rockImpacts.append({"id":shot.id,"x":shot.x,"z":shot.z,"at":battle.elapsed,"radius":shot.radius,"injured":injured,"friendlies":friendlies})
 var active: Array=[]
 for hit in battle.rockImpacts:
  if float(battle.elapsed)-float(hit.at)<1.15:active.append(hit)
 battle.rockImpacts=active
