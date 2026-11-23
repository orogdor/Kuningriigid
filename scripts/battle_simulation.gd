class_name BattleSimulation
extends RefCounted
const State=preload("res://scripts/battle_state.gd")
const Tactics=preload("res://scripts/battle_tactics.gd")
const Formations=preload("res://scripts/battle_formations.gd")
const Contact=preload("res://scripts/battle_contact.gd")
const Collision=preload("res://scripts/battle_collision.gd")
const Battlefield=preload("res://scripts/battlefield.gd")
const Doctrine=preload("res://scripts/battle_doctrine.gd")
const Goals=preload("res://scripts/battle_goals.gd")
const Projectiles=preload("res://scripts/battle_projectiles.gd")
const Resolution=preload("res://scripts/battle_resolution.gd")
const Crowd=preload("res://scripts/battle_crowd.gd")
const Arrivals=preload("res://scripts/battle_arrivals.gd")
const Siege=preload("res://scripts/battle_siege_rules.gd")
const Assault=preload("res://scripts/siege_assault.gd")
const WallWalk=preload("res://scripts/wall_walk.gd")
const TowerGuards=preload("res://scripts/tower_garrison.gd")
const Support=preload("res://scripts/siege_support.gd")
const DATA=preload("res://data/economy.json")
const SWORDS=["archer","bronze_archer","iron_archer","crossbowman","chariot","stone_guard"]
const ARROWS=["slinger","archer","bronze_archer","iron_archer","crossbowman","chariot","javelinman"]
const SIEGE=["bronze_catapult","catapult","battering_ram","siege_tower","field_cannon","industrial_artillery"]
const STRAIGHT_FIRE=["musketeer","arquebusier","line_infantry","rifleman","machinegun_team","modern_infantry","dragoon","cuirassier","chariot"]
var game_state: Variant=null
var crowd=Crowd.new()
var arrivals=Arrivals.new()

static func alive(unit: Dictionary) -> bool:
 return float(unit.hp)>0 and not unit.get("retreated",false) and not unit.get("reserve",false)
static func bins_key(x: float,z: float) -> String:
 return str(floori(x/8))+":"+str(floori(z/8))
static func insert_bin(bins: Dictionary,man: Dictionary) -> void:
 var key:=bins_key(man.x,man.z)
 if not bins.has(key):bins[key]=[]
 bins[key].append(man)
static func remove_bin(bins: Dictionary,man: Dictionary) -> void:
 var key:=bins_key(man.x,man.z)
 if not bins.has(key):return
 for i in bins[key].size():
  if is_same(bins[key][i],man):bins[key].remove_at(i);return
static func nearby(bins: Dictionary,man: Dictionary) -> Array:
 var result: Array=[];var x:=floori(float(man.x)/8);var z:=floori(float(man.z)/8)
 for dz in range(-1,2):
  for dx in range(-1,2):
   for p in bins.get(str(x+dx)+":"+str(z+dz),[]):
    if float(p.hp)>0 and not p.get("escaped",false):result.append(p)
 return result

func step(battle: Dictionary,delta: float,technology: Variant=0,nav: Variant=null) -> void:
 if battle.get("result")!=null or delta<=0:return
 var dt:=delta*0.5
 var passable: Callable=Callable(nav,"is_open") if nav!=null else Callable()
 if not State.initialize_men(battle,passable):return
 Tactics.initialize(battle);battle.elapsed=float(battle.elapsed)+dt
 Projectiles.resolve_landings(battle)
 if game_state is Dictionary:Assault.plan_ai(battle,game_state,nav)
 Assault.tick(battle,dt,nav)
 if nav!=null and not battle.get("siegeSections",[]).is_empty():nav.refresh_siege_access()
 for unit in battle.squads:
  if alive(unit) and (unit.kind in SWORDS or unit.kind in ["bronze_catapult","catapult"]):unit.hasSiegeSupply=false
 Support.tick(battle,dt,nav)
 Tactics.update_morale(battle,dt);WallWalk.tick(battle,dt,nav);TowerGuards.tick(battle,dt);Formations.update(battle,dt);Battlefield.check_retreats(battle)
 var existing_fortress: Variant=battle.get("fortress")
 if existing_fortress is Dictionary and float(existing_fortress.hp)<=0 and not battle.get("fortressFallen",false):
  battle.fortressFallen=true
  for defender in battle.squads:
   if defender.team!=existing_fortress.team or not alive(defender):continue
   defender.routing=true;defender.manualOrder=false;defender.target=null
   for man in defender.get("men",[]):
    if float(man.hp)>0 and not man.get("escaped",false):man.routing=true
 var fighting: Array=[]
 for unit in battle.squads:
  if not alive(unit) or unit.get("routing",false):continue
  for man in unit.get("men",[]):
   if float(man.hp)>0 and not man.get("escaped",false) and not man.get("routing",false):
    if unit.team not in fighting:fighting.append(unit.team)
    break
 var fortress: Variant=battle.get("fortress")
 battle.pursuitStoppedTeam=fighting[0] if fighting.size()==1 and (fortress==null or float(fortress.hp)<=0 or fortress.team==fighting[0]) else null
 for unit in battle.squads:
  if unit.get("attackTargetSource")==null:continue
  var found:=false
  for foe in battle.squads:
   if foe.source==unit.attackTargetSource and foe.team!=unit.team and alive(foe):found=true;break
  if not found:unit.attackTargetSource=null
 var squads: Array=[];var agents: Array=[];var bins: Dictionary={}
 for unit in battle.squads:
  if not alive(unit):continue
  squads.append(unit)
  for man in unit.get("men",[]):
   if float(man.hp)>0 and not man.get("escaped",false):
    agents.append({"u":unit,"m":man})
    if not unit.get("guardPost",false):insert_bin(bins,man)
 Support.ballistas(battle,dt,agents)
 var occupants: Array=[];var orders: Array=[]
 for unit in squads:
  var occupant: Dictionary={"agent":unit,"team":unit.team,"radius":0.34 if unit.get("guardPost",false) else Collision.squad_radius(unit)}
  occupants.append(occupant)
  if unit.get("manualOrder",false) and unit.get("target")!=null and not unit.get("routing",false) and not unit.get("guardPost",false):
   var order:=occupant.duplicate();order.goal=unit.target;orders.append(order)
 var navigation: Dictionary={}
 if nav!=null:navigation={"open":Callable(nav,"is_open"),"nearest":Callable(nav,"nearest"),"reachable":Callable(nav,"reachable")}
 var arrival_goals:=arrivals.assign(orders,occupants,navigation)
 for unit in squads:move_anchor(unit,squads,battle,arrival_goals,dt,nav)
 var open: Callable=Callable(nav,"is_open") if nav!=null else func(_x,_z):return true
 var radius_of=func(p):return float(p.get("radius",0.34))
 for actor in agents:
  move_fighter(actor,agents,squads,battle,bins,dt,technology,open,radius_of,nav)
 if not battle.has("ballistaShots"):battle.ballistaShots=[]
 Resolution.finish_tick(battle,squads,dt)

func move_anchor(unit: Dictionary,squads: Array,battle: Dictionary,arrival_goals: Array,dt: float,nav: Variant=null) -> void:
 var foes: Array=[];var ordered: Variant=null
 for foe in squads:
  if foe.team==unit.team:continue
  foes.append(foe)
  if unit.get("attackTargetSource")!=null and foe.source==unit.attackTargetSource:ordered=foe
 var nearest: Variant=ordered if ordered!=null else Doctrine.committed_opponent(unit,foes)
 var fort: Variant=battle.get("fortress")
 if nearest==null and fort is Dictionary and float(fort.hp)>0 and fort.team!=unit.team:nearest=fort
 var definition: Dictionary=DATA.data.troops.get(unit.kind,{})
 if definition.is_empty():return
 var stats:=Tactics.tactical_stats(definition,unit)
 if unit.get("anchor")==null:unit.anchor={"x":unit.x,"z":unit.z}
 var anchor: Dictionary=unit.anchor;unit.moving=false
 if unit.get("wallClimb",false) and not unit.get("routing",false):return
 if unit.get("siegeBuildingId")!=null and not unit.get("routing",false):
  var work_ready:=false
  for work in battle.get("siegeWorks",[]):
   if work.id==unit.siegeBuildingId and (work.get("ready",false) or work.kind=="camp") and not work.get("destroyed",false):work_ready=true;break
  if not work_ready:unit.anchor={"x":unit.x,"z":unit.z}
  return
 if battle.get("pursuitStoppedTeam")==unit.team and not unit.get("routing",false):
  var chase:=false
  if Tactics.horse(unit):
   for foe in foes:
    if foe.get("routing",false) and not foe.get("retreated",false) and Doctrine.distance(unit,foe)<50 and absf(float(foe.x))<185 and absf(float(foe.z))<158:chase=true;break
  if not chase:unit.anchor={"x":unit.x,"z":unit.z};return
 var goal: Variant=null
 if unit.get("manualOrder",false) and unit.get("target")!=null:
  goal=Arrivals.result_for(arrival_goals,unit)
  if goal==null:goal=unit.get("anchor",unit)
 if goal==null:goal=Support.supply_goal(battle,unit)
 if goal==null and nearest!=null:
  if unit.get("routing",false) or unit.get("manualOrder",false) or unit.get("attackTargetSource")!=null or (unit.get("combatMode","auto")!="manual" and (unit.team!=0 or unit.get("advance",false) or unit.get("civilian",false) or Tactics.horse(unit) or unit.team==0 or Doctrine.distance(unit,nearest)<30)):
   goal=Assault.assault_goal(battle,unit)
   if goal==null:goal=Doctrine.marching_goal(unit,nearest,Goals.tactical_goal(unit,nearest,squads,battle,stats,nav))
 if goal!=null and (not unit.get("guardPost",false) or unit.get("routing",false)):
  var lead:=Doctrine.distance(anchor,unit);var max_lead:=15.0 if unit.kind=="chariot" else 12.0 if Tactics.horse(unit) else 3.0
  var ahead: bool=(float(anchor.x)-float(unit.x))*(float(goal.x)-float(anchor.x))+(float(anchor.z)-float(unit.z))*(float(goal.z)-float(anchor.z))>0
  var speed:=0.0 if lead>max_lead and ahead else float(stats.speed)
  var d:=Doctrine.distance(anchor,goal);var heading:=atan2(float(goal.x)-float(anchor.x),float(goal.z)-float(anchor.z));var f:=minf(1,speed*dt/d) if d!=0 else 0.0
  if nav!=null:
   var fatigue:=0.0
   for man in unit.men:fatigue+=float(man.get("fatigue",0))
   fatigue/=maxi(1,unit.men.size());nav.move(anchor,goal,dt,speed*(1-fatigue*0.0025),float(battle.elapsed))
  else:anchor.x=float(anchor.x)+(float(goal.x)-float(anchor.x))*f;anchor.z=float(anchor.z)+(float(goal.z)-float(anchor.z))*f
  if d>0.1:
   var desired: float=heading if unit.kind=="chariot" and unit.get("chariotPhase")!="shoot" else atan2(float(nearest.x)-float(unit.x),float(nearest.z)-float(unit.z)) if not unit.get("manualOrder",false) and not unit.get("routing",false) and nearest!=null else heading
   unit.heading=unit.get("fixedFacing",Formations.turn(float(unit.get("heading",0)),desired,dt,float(Formations.FORMATIONS.get(unit.get("formation",""),Formations.FORMATIONS.line).turn)))
 var arrival: Variant=Arrivals.result_for(arrival_goals,unit)
 if unit.get("manualOrder",false) and unit.get("target")!=null and arrival!=null and Doctrine.distance(unit,arrival)<2:unit.manualOrder=false;unit.target=null

func move_fighter(actor: Dictionary,agents: Array,squads: Array,battle: Dictionary,bins: Dictionary,dt: float,technology: Variant,open: Callable,radius_of: Callable,nav: Variant=null) -> void:
 var man: Dictionary=actor.m;var unit: Dictionary=actor.u
 if float(man.hp)<=0 or man.get("escaped",false) or unit.get("retreated",false) or (unit.get("wallClimb",false) and not unit.get("routing",false)):return
 var definition: Dictionary=DATA.data.troops.get(unit.kind,{})
 if definition.is_empty():return
 var stats:=Tactics.tactical_stats(definition,unit)
 if man.get("routing",false) and not unit.get("routing",false):stats.speed=float(stats.speed)/float(Formations.FORMATIONS.get(unit.get("formation",""),Formations.FORMATIONS.line).speed)
 if unit.kind=="dragoon" and man.get("dismounted",false):stats.speed=float(stats.speed)*0.58
 if unit.kind in ["bronze_catapult","catapult"] and int(man.get("catapultReloadVersion",0))!=104:
  if float(man.get("cool",0))>0:man.cool=float(man.cool)*3
  man.catapultReloadVersion=104
 man.cool=maxf(0,float(man.get("cool",0))-dt);man.wasMoving=bool(man.get("moving",false));man.moving=false
 var enemy: Variant=null;var best:=INF;var threat: Variant=null;var threat_distance:=INF
 for p in agents:
  if p.u.team==unit.team or float(p.m.hp)<=0 or p.m.get("escaped",false) or p.u.get("retreated",false):continue
  if unit.get("attackTargetSource")!=null and p.u.source!=unit.attackTargetSource:continue
  if unit.get("combatMode","auto")=="manual" and unit.get("attackTargetSource")==null:continue
  var d:=Doctrine.distance(man,p.m);var score: float=d+(-1.2 if man.get("targetId")==p.m.id else 0)+absf(float(p.m.z)-float(man.z))*0.15
  if not p.u.get("routing",false) and not p.m.get("routing",false) and d<threat_distance:threat=p.m;threat_distance=d
  if score<best:best=score;enemy=p
 man.targetId=enemy.m.id if enemy!=null else null
 if unit.kind=="dragoon" and not unit.get("routing",false) and not man.get("routing",false):man.dismounted=enemy!=null and not unit.get("manualOrder",false) and best<float(stats.range)*1.15 and threat_distance>5
 elif unit.kind=="dragoon":man.dismounted=false
 var fortress: Variant=battle.get("fortress")
 var closest_wall: Variant=null
 for section in battle.get("siegeSections",[]):
  if float(section.hp)<=0 or section.team==unit.team:continue
  if closest_wall==null or Doctrine.distance(man,section)<Doctrine.distance(man,closest_wall):closest_wall=section
 var wall: Variant=closest_wall if unit.kind in SIEGE else null
 var blocked_wall: Variant=closest_wall if closest_wall!=null and not unit.get("guardPost",false) and not Tactics.is_bow(unit) and Doctrine.distance(man,closest_wall)<10 and (enemy==null or float(enemy.m.get("elevation",enemy.u.get("wallElevation",0)))>0 or Doctrine.distance(man,closest_wall)<Doctrine.distance(man,enemy.m)) else null
 var fort: Variant=fortress if fortress is Dictionary and float(fortress.hp)>0 and fortress.team!=unit.team else null
 var structure: Variant=wall if wall!=null else blocked_wall if blocked_wall!=null else (closest_wall if closest_wall!=null else fort) if enemy==null else null
 var target: Variant=structure if structure!=null else enemy.m if enemy!=null else unit.get("target") if unit.get("manualOrder",false) and unit.get("target")!=null else {"x":-float(unit.battleSide)*250,"z":man.z} if man.get("routing",false) or unit.get("routing",false) else null
 if target==null:return
 var d:=Doctrine.distance(man,target);var desired:=atan2(float(target.x)-float(man.x),float(target.z)-float(man.z))
 var defensive: bool=Formations.FORMATIONS.get(unit.get("formation",""),{}).get("defensive",false) and not man.get("routing",false) and not unit.get("routing",false) and battle.get("pursuitStoppedTeam")!=unit.team
 var heading: float=float(unit.get("formationFacing",unit.heading)) if defensive else desired
 man.heading=Formations.turn(float(man.get("heading",0)),heading,dt,0.7 if defensive or unit.kind=="chariot" else 1.1 if Contact.troop_role(unit.kind)=="cavalry" else 2.0)
 var facing:=absf(atan2(sin(desired-float(man.heading)),cos(desired-float(man.heading))))
 var ranged: bool=Tactics.is_bow(unit) and float(man.get("ammo",0))>0 and (unit.kind not in SWORDS or d>=3)
 if unit.kind=="stone_guard":man.weapon="stone" if ranged else "melee"
 elif unit.kind=="chariot":man.weapon="bow" if ranged else null
 elif unit.kind in SWORDS:man.weapon="bow" if ranged else "sword"
 elif unit.kind in ["bronze_catapult","catapult"]:man.weapon="stone" if ranged else "melee"
 elif unit.kind in ["dragoon","cuirassier"]:man.weapon="gun" if ranged else "sabre"
 else:man.weapon=null
 var reach:=float(stats.range) if ranged else Contact.melee_reach(unit,man,enemy.m if enemy!=null else null)
 if unit.get("guardPost",false) and ranged and unit.kind not in ["archer","bronze_archer","iron_archer","crossbowman"]:reach+=5
 if structure!=null:reach+=1.5
 var chariot_ready: bool=unit.kind!="chariot" or (ranged and unit.get("chariotPhase") in ["shoot","approach"] or ranged and unit.get("formation")=="hold")
 var shot_clear: bool=structure!=null or unit.kind in ["bronze_catapult","catapult"] or not Siege.wall_blocks_shot(battle,man,target,float(man.get("elevation",unit.get("wallElevation",0))),float(enemy.m.get("elevation",enemy.u.get("wallElevation",0))) if enemy!=null else 0.0)
 var elevation_clear: bool=ranged or structure!=null or enemy==null or absf(float(man.get("elevation",unit.get("wallElevation",0)))-float(enemy.m.get("elevation",enemy.u.get("wallElevation",0))))<1.5
 var ready: bool=unit.get("siegeBuildingId")==null and unit.get("resupplyCamp")==null and shot_clear and elevation_clear and (structure==null or not Tactics.is_bow(unit) or unit.kind in ["bronze_catapult","catapult"]) and chariot_ready and (unit.get("combatMode","auto")!="manual" or unit.get("attackTargetSource")!=null) and (unit.kind!="dragoon" or not ranged or (man.get("dismounted",false) and not man.wasMoving)) and not unit.get("manualOrder",false) and not man.get("routing",false) and not unit.get("routing",false) and d<=reach and facing<(1.2 if defensive else 1.65) and (not ranged or unit.kind not in STRAIGHT_FIRE or Formations.clear_shot(actor,enemy,agents))
 var can_attack:=Formations.attack_ready(unit,man,battle,ready)
 man.fatigue=clampf(float(man.get("fatigue",0))+(0.22 if can_attack else -0.3)*dt,0,100)
 if can_attack:
  if float(man.cool)==0 and (enemy!=null or structure!=null):attack(actor,enemy,battle,stats,dt,technology,ranged,d,reach,target,structure)
  return
 if unit.get("siegeBuildingId")!=null and not unit.get("routing",false):
  var work_ready:=false
  for work in battle.get("siegeWorks",[]):
   if work.id==unit.siegeBuildingId and (work.get("ready",false) or work.kind=="camp"):work_ready=true;break
  if not work_ready:man.moving=false;return
 if battle.get("pursuitStoppedTeam")==unit.team and not unit.get("routing",false) and not man.get("routing",false):
  if not (Tactics.horse(unit) and enemy!=null and enemy.u.get("routing",false) and absf(float(enemy.m.x))<185 and absf(float(enemy.m.z))<158 and d<50):return
 if unit.get("guardPost",false) and not unit.get("routing",false) and not man.get("routing",false):
  if unit.get("towerGuard",false):man.moving=bool(unit.get("guardMoving",false))
  return
 var anchor: Dictionary=unit.get("anchor",unit);var active:=0
 for p in unit.men:
  if float(p.hp)>0 and not p.get("escaped",false):active+=1
 if active==0:return
 var goal: Dictionary=Formations.world_slot(unit,man,active)
 if man.get("routing",false) or unit.get("routing",false):
  if nav!=null:goal=nav.escape_goal(man,float(unit.get("battleSide",1)),threat)
  else:
   if man.get("escapeTarget")==null:man.escapeTarget=Doctrine.retreat_point(man,float(unit.get("battleSide",1)),threat)
   goal=man.escapeTarget
 elif unit.get("siegeBuildingId")==null and unit.get("resupplyCamp")==null and not unit.get("manualOrder",false) and (unit.get("combatMode","auto")!="manual" or unit.get("attackTargetSource")!=null):
  var form: Dictionary=Formations.FORMATIONS.get(unit.get("formation",""),Formations.FORMATIONS.line)
  if unit.get("formationManual",false) and unit.get("formation")=="skirmish" and float(man.get("ammo",0))>0 and d<reach*0.35:goal={"x":float(man.x)-float(unit.battleSide)*7,"z":man.z}
  elif not form.get("hold",false):
   if Tactics.is_bow(unit) and float(man.get("ammo",0))>0 and man.weapon!="sword":
    if unit.get("formationManual",false) and unit.get("formation")=="skirmish" and d<reach*0.3:goal={"x":float(man.x)-float(unit.battleSide)*3,"z":man.z}
   elif d<9 and Doctrine.distance(man,anchor)<10:goal=target
 if unit.get("siegeBuildingId")==null and unit.get("resupplyCamp")==null:goal=Doctrine.keep_advance(unit,man,goal,d,target)
 if man.get("yieldGoal")!=null and float(man.get("yieldUntil",0))>float(battle.elapsed) and Doctrine.distance(man,man.yieldGoal)>0.3:goal=man.yieldGoal
 if nav!=null:goal=nav.waypoint(man,goal,float(battle.elapsed))
 var crowd_tolerance:=0.000000001 if int(DATA.data.troops.get(unit.kind,{}).get("age",99))<=2 else 0.0
 goal=crowd.waypoint(man,goal,nearby(bins,man),open,radius_of,dt,3.0 if nav!=null else 1.0,crowd_tolerance)
 var old: Dictionary={"x":man.x,"z":man.z};remove_bin(bins,man);var peers:=nearby(bins,man);var length:=Doctrine.distance(man,goal)
 var step:=minf(length,float(stats.speed)*(1.1 if man.get("routing",false) else 1.0)*(1-float(man.fatigue)*0.0025)*dt)
 var fraction:=step/length if length!=0 else 0.0;var dx: float=(float(goal.x)-float(man.x))*fraction;var dz: float=(float(goal.z)-float(man.z))*fraction
 man.moving=Collision.constrain_step(man,{"x":float(man.x)+dx,"z":float(man.z)+dz},peers,open)
 if Doctrine.distance(old,man)<step*0.2 and length>0.2:
  for angle in [0.7,-0.7,1.3,-1.3]:
   var co:=cos(angle);var si:=sin(angle)
   if Collision.constrain_step(man,{"x":float(man.x)+dx*co-dz*si,"z":float(man.z)+dx*si+dz*co},peers,open) and Doctrine.distance(old,man)>step*0.2:man.moving=true;break
 if length>0.3 and Doctrine.distance(old,man)<step*0.2:
  man.blockedFor=float(man.get("blockedFor",0))+dt
  if float(man.blockedFor)>0.4:crowd.forget(man)
  if float(man.blockedFor)>0.6:
   var vectors: Array=[{"x":0,"z":step},{"x":0,"z":-step},{"x":step,"z":0},{"x":-step,"z":0}]
   for angle in [2.1,-2.1,PI]:vectors.append({"x":dx*cos(angle)-dz*sin(angle),"z":dx*sin(angle)+dz*cos(angle)})
   for vector in vectors:
    if Collision.constrain_step(man,{"x":float(man.x)+float(vector.x),"z":float(man.z)+float(vector.z)},peers,open) and Doctrine.distance(old,man)>step*0.2:
     var length2:=sqrt(float(vector.x)*float(vector.x)+float(vector.z)*float(vector.z));if length2==0:length2=1
     var space:=7 if float(man.get("radius",0))>1 else 3
     man.yieldGoal={"x":float(man.x)+float(vector.x)/length2*space,"z":float(man.z)+float(vector.z)/length2*space};man.yieldUntil=float(battle.elapsed)+2;man.moving=true;man.blockedFor=0;break
 else:man.blockedFor=0
 if man.moving:
  man.fatigue=minf(100,float(man.fatigue)+dt*(1.5 if unit.get("formation")=="charge" else 0.85))
  if unit.get("formation")=="charge" and not man.get("routing",false):man.chargeDistance=float(man.get("chargeDistance",0))+Doctrine.distance(old,man)
  if not defensive:man.heading=Formations.turn(float(man.heading),atan2(float(man.x)-float(old.x),float(man.z)-float(old.z)),dt,0.75 if unit.kind=="chariot" else 2)
  unit.moving=true
 insert_bin(bins,man)
 if State.outside(man):unit.x=man.x;unit.z=man.z;Battlefield.check_retreats(battle)

func attack(actor: Dictionary,enemy: Variant,battle: Dictionary,stats: Dictionary,_dt: float,technology: Variant,ranged: bool,distance: float,reach: float,target: Dictionary,structure: Variant=null) -> void:
 var unit: Dictionary=actor.u;var man: Dictionary=actor.m
 if not ranged and structure==null:man.lastMeleeDistance=distance;man.lastMeleeReach=reach
 if unit.get("formation")=="volley":man.lastVolley=unit.volleyNumber
 var tech:=0.0
 if technology is Array:tech=float(technology[int(unit.team)]) if int(unit.team)<technology.size() else 0.0
 elif int(unit.team)==0:tech=float(technology)
 var amount:=float(stats.dmg)/(1 if unit.get("guardPost",false) and not unit.get("wallWalk",false) else State.soldier_count(unit))*(1.3 if unit.get("guardPost",false) else 1.0)*(1+tech*0.3)
 var projectile: Variant=null
 if ranged:
  projectile="stone" if unit.kind in ["bronze_catapult","catapult","stone_guard"] else "arrow" if unit.kind in ARROWS else "bullet"
 unit.projectile=projectile;man.projectile=projectile
 if ranged:
  man.ammo=float(man.ammo)-1
  if unit.kind in ["bronze_catapult","catapult"]:
   man.shotsFired=int(man.get("shotsFired",0))+1;var landing:=Projectiles.landing_point(unit,int(man.shotsFired),target)
   if not battle.has("rockShots"):battle.rockShots=[]
   battle.rockShots.append({"id":str(int(unit.source))+":"+str(man.id)+":"+str(int(man.shotsFired)),"source":unit.source,"team":unit.team,"kind":unit.kind,"manId":man.id,"x":landing.x,"z":landing.z,"landsAt":float(battle.elapsed)+1.1,"damage":amount,"radius":4.2,"balanceVersion":105})
   man.attackTime=battle.elapsed;man.shot={"x":man.x,"z":man.z,"toX":landing.x,"toZ":landing.z};unit.shot=man.shot;unit.attackTime=battle.elapsed;man.cool=8.4/float(stats.attackSpeed);return
  if not Tactics.shot_hits(man,unit,distance,reach,enemy.u if enemy!=null else null):
   man.attackTime=battle.elapsed;man.shot={"x":man.x,"z":man.z,"toX":float(target.x)+2,"toZ":float(target.z)+2};unit.shot=man.shot;unit.attackTime=battle.elapsed;man.cool=(2.8 if unit.kind in SIEGE else 1.8)/float(stats.attackSpeed);return
 elif Tactics.is_bow(unit):amount*=0.6 if unit.kind in SWORDS else 0.35
 if structure==null and enemy!=null:
  amount=Tactics.tactical_damage(actor,enemy,amount,projectile)
  var reduction: float={"heavy_cavalry":0.75,"knight":0.8,"man_at_arms":0.83,"halberdier":0.92}.get(enemy.u.kind,1.0)
  amount*=reduction+(1-reduction)*(0.5 if unit.kind=="crossbowman" else 0.0)
  var role:=Contact.troop_role(enemy.u.kind)
  if unit.kind in ["halberdier","pikeman"] and role=="cavalry":amount*=1.7
  if unit.kind=="rocket_team" and role=="vehicle":amount*=1.8
  Projectiles.damage_man(battle,actor,enemy,amount)
 elif structure!=null:
  var before:=float(structure.hp)
  if structure in battle.get("siegeSections",[]):
   Siege.damage(unit,structure,amount)
   if structure.get("breached",false):battle.siegeBreached=true;battle.breachAt={"x":structure.x,"z":structure.z}
  elif not battle.get("siegeProtected",false):structure.hp=maxf(0,before-amount)
  var hit:=before-float(structure.hp);unit.damageDealt=float(unit.get("damageDealt",0))+hit;man.damageDealt=float(man.get("damageDealt",0))+hit;man.attackTime=battle.elapsed;unit.attackTime=battle.elapsed
 var reload:=2.4 if unit.kind=="dragoon" else 2.1 if unit.kind=="cuirassier" else 1.9 if unit.kind=="crossbowman" else 2.8 if unit.kind in SIEGE else 1.45 if unit.kind=="heavy_cavalry" else 1.2
 man.cool=reload*(1+float(man.fatigue)*0.003)/float(stats.attackSpeed)

