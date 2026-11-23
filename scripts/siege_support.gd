extends RefCounted
const Tactics=preload("res://scripts/battle_tactics.gd")
const Walk=preload("res://scripts/wall_walk.gd")
const Rules=preload("res://scripts/battle_siege_rules.gd")
const Projectile=preload("res://scripts/battle_projectiles.gd")
const CARRIES=["archer","bronze_archer","iron_archer","crossbowman","chariot","stone_guard"]
const THROWERS=["bronze_catapult","catapult"]
static func distance(a: Dictionary,b: Dictionary) -> float:return Walk.distance(a,b)
static func camps(battle: Dictionary,team: int) -> Array:
 var out:=[]
 for work in battle.get("siegeWorks",[]):
  if work.kind=="camp" and int(work.team)==team and work.get("ready",false) and not work.get("destroyed",false) and float(work.hp)>0:out.append(work)
 return out
static func supply_goal(battle: Dictionary,unit: Dictionary) -> Variant:
 for camp in camps(battle,int(unit.team)):
  if camp.id==unit.get("resupplyCamp"):return {"x":camp.x,"z":camp.z}
 return null
static func tick(battle: Dictionary,dt: float,nav: Variant=null) -> void:
 for camp in battle.get("siegeWorks",[]):
  if camp.kind!="camp" or not camp.get("ready",false) or camp.get("destroyed",false) or float(camp.hp)<=0:continue
  camp.productionSeconds=float(camp.get("productionSeconds",0))+dt*2;camp.stones=int(camp.get("stones",0));camp.produced=int(camp.get("produced",0))
  while float(camp.productionSeconds)>=15-0.00000001:camp.productionSeconds=float(camp.productionSeconds)-15;camp.stones=int(camp.stones)+1;camp.produced=int(camp.produced)+1
  var enemies:=0
  for unit in battle.squads:
   if unit.team!=camp.team and float(unit.hp)>0 and not unit.get("reserve",false) and not unit.get("retreated",false) and not unit.get("routing",false) and not unit.get("guardPost",false) and distance(unit,camp)<10:enemies+=1
  if enemies>0:camp.hp=maxf(0,float(camp.hp)-dt*8*enemies);camp.destroyed=float(camp.hp)<=0
 for unit in battle.squads:
  if float(unit.hp)<=0 or unit.get("reserve",false) or unit.get("retreated",false) or unit.kind not in CARRIES+THROWERS:continue
  var men:=[];var total:=0.0;var load:=Tactics.ammunition_load(unit)
  for man in unit.get("men",[]):
   if float(man.hp)>0 and not man.get("escaped",false):men.append(man);total+=float(man.get("ammo",0))
  var available:=camps(battle,int(unit.team));unit.hasSiegeSupply=not available.is_empty()
  if unit.get("ammoDepleted",false) and not available.is_empty() and float(unit.get("morale",100))>=46 and not unit.get("withdrawing",false):
   unit.routing=false;unit.ammoDepleted=false
   for man in men:man.routing=false
  var automatic: bool=unit.get("combatMode","auto")!="manual" and not unit.get("manualOrder",false) and unit.get("wallClimb")==null and unit.get("siegeBuildingId")==null
  if automatic and not unit.get("routing",false) and total<=men.size()*load*0.2 and unit.get("resupplyCamp")==null:
   var nearest: Variant=null
   for camp in available:
    if unit.kind not in THROWERS and distance(unit,camp)>=180:continue
    if nearest==null or distance(unit,camp)<distance(unit,nearest):nearest=camp
   if nearest!=null:
    var can_leave:=true
    if unit.get("guardPost",false):
     var result: Variant=Walk.order(battle,unit,nearest,nav) if nav!=null else null
     can_leave=result is Dictionary and result.get("ok",false)
     if can_leave:unit.preSupplyWall={"x":unit.x,"z":unit.z}
    if can_leave:unit.resupplyCamp=nearest.id;unit.preSupplyAnchor=unit.get("anchor",unit).duplicate(true)
  var camp: Variant=null
  for item in available:
   if item.id==unit.get("resupplyCamp"):camp=item;break
  if unit.get("resupplyCamp")!=null and camp==null:unit.erase("resupplyCamp");unit.erase("preSupplyAnchor")
  if unit.get("routing",false) and not unit.get("ammoDepleted",false):continue
  for man in men:
   if unit.get("guardPost",false) or float(man.get("elevation",0))>1:continue
   var nearby: Variant=camp if camp!=null and distance(man,camp)<9 else null
   if nearby==null:
    for item in available:
     if distance(man,item)<9:nearby=item;break
   if nearby==null:continue
   if unit.kind in THROWERS:
    if int(nearby.stones)>0 and float(man.ammo)<load:
     var amount:=minf(float(nearby.stones),load-float(man.ammo));nearby.stones=int(nearby.stones)-int(amount);man.ammo=float(man.ammo)+amount
   else:
    man.arrowSupplyProgress=float(man.get("arrowSupplyProgress",0))+dt*8;var amount:=minf(load-float(man.ammo),floorf(float(man.arrowSupplyProgress)))
    if amount>0:man.ammo=float(man.ammo)+amount;man.arrowSupplyProgress=float(man.arrowSupplyProgress)-amount
    if float(man.ammo)>=load:man.arrowSupplyProgress=0
  unit.ammoRemaining=0.0;var full:=true
  for man in men:unit.ammoRemaining=float(unit.ammoRemaining)+float(man.get("ammo",0));if float(man.get("ammo",0))<load:full=false
  if camp!=null and unit.get("ammoDepleted",false) and float(unit.get("morale",100))>=46 and not unit.get("withdrawing",false):
   unit.routing=false;unit.ammoDepleted=false
   for man in men:man.routing=false
  if camp!=null and full:
   unit.erase("resupplyCamp");unit.anchor=unit.get("preSupplyAnchor",{"x":unit.x,"z":unit.z});unit.erase("preSupplyAnchor")
   if unit.get("preSupplyWall")!=null and nav!=null:Walk.order(battle,unit,unit.preSupplyWall,nav);unit.erase("preSupplyWall")
static func ballistas(battle: Dictionary,dt: float,agents: Array) -> void:
 if not battle.has("ballistaShots"):battle.ballistaShots=[]
 for shot in battle.ballistaShots:
  if shot.get("resolved",false) or float(battle.elapsed)<float(shot.landsAt):continue
  shot.resolved=true
  for target in agents:
   if target.u.source==shot.targetSource and target.m.id==shot.targetMan and float(target.m.hp)>0 and not target.m.get("escaped",false) and not target.u.get("retreated",false) and distance(target.m,{"x":shot.toX,"z":shot.toZ})<3:Projectile.damage_man(battle,null,target,float(shot.damage));break
 var active:=[]
 for shot in battle.ballistaShots:
  if float(battle.elapsed)<float(shot.landsAt)+0.25:active.append(shot)
 battle.ballistaShots=active
 for post in battle.get("defensePosts",[]):
  if not post.get("ballista") is Dictionary or post.get("active",true)==false or battle.get("fortressFallen",false):continue
  var gun: Dictionary=post.ballista;gun.cool=maxf(0,float(gun.get("cool",0))-dt)
  if float(gun.cool)>0:continue
  var height:=float(gun.get("height",6.4));var nearest: Variant=null
  for target in agents:
   if target.u.team==post.team or float(target.m.hp)<=0 or target.m.get("escaped",false) or target.u.get("retreated",false) or target.u.get("routing",false):continue
   var d:=distance(post,target.m)
   if d<=5 or d>float(gun.range) or Rules.wall_blocks_shot(battle,post,target.m,height,float(target.m.get("elevation",0))):continue
   if nearest==null or d<distance(post,nearest.m):nearest=target
  if nearest==null:continue
  gun.heading=atan2(float(nearest.m.x)-float(post.x),float(nearest.m.z)-float(post.z));gun.firedAt=battle.elapsed
  var id:=int(battle.get("nextBallistaShotId",0))+1;battle.nextBallistaShotId=id
  battle.ballistaShots.append({"id":id,"team":post.team,"x":post.x,"z":post.z,"fromY":height+1,"toX":nearest.m.x,"toZ":nearest.m.z,"toY":float(nearest.m.get("elevation",0))+1,"targetSource":nearest.u.source,"targetMan":nearest.m.id,"damage":gun.damage,"startedAt":battle.elapsed,"landsAt":float(battle.elapsed)+0.7});gun.cool=gun.reload
