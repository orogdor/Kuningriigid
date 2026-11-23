class_name BattleResolution
extends RefCounted
const State=preload("res://scripts/battle_state.gd")
const Battlefield=preload("res://scripts/battlefield.gd")
const Siege=preload("res://scripts/battle_siege.gd")

static func live(unit: Dictionary) -> bool:
 return float(unit.hp)>0 and not unit.get("retreated",false) and not unit.get("reserve",false)

static func aggregate(unit: Dictionary) -> void:
 var health:=0.0;var alive:=0
 for man in unit.get("men",[]):
  health+=maxf(0,float(man.hp))
  if float(man.hp)>0:alive+=1
 unit.hp=round(health*1000000000.0)/1000000000.0;unit.menAlive=alive

static func finish_tick(battle: Dictionary,active_squads: Array=[],dt:=0.0) -> void:
 var squads: Array=active_squads if not active_squads.is_empty() else battle.squads
 for unit in squads:
  if not unit.has("men"):continue
  aggregate(unit)
  var active: Array=[]
  for man in unit.men:
   if float(man.hp)>0 and not man.get("escaped",false):active.append(man)
  if not active.is_empty() and not unit.get("guardPost",false) and not unit.get("retreated",false):
   var x:=0.0;var z:=0.0
   for man in active:x+=float(man.x);z+=float(man.z)
   unit.x=x/active.size();unit.z=z/active.size()
  if float(unit.hp)==0:unit.deathTime=battle.elapsed
 Battlefield.check_retreats(battle)
 Siege.occupation(battle,dt)
 var fortress: Variant=battle.get("fortress")
 var surviving: Array=[]
 for unit in battle.squads:
  if live(unit) and unit.team not in surviving:surviving.append(unit.team)
 if fortress is Dictionary and float(fortress.hp)>0 and fortress.team not in surviving:surviving.append(fortress.team)
 if surviving.size()==1:
  for unit in battle.squads:
   if not live(unit) or unit.team!=surviving[0] or unit.get("withdrawing",false):continue
   unit.routing=false
   for man in unit.get("men",[]):
    if not man.get("escaped",false):man.routing=false
 var escaping:=false
 for unit in battle.squads:
  if float(unit.hp)<=0 or unit.get("reserve",false) or unit.get("retreated",false):continue
  if unit.get("routing",false):escaping=true;break
  for man in unit.get("men",[]):
   if man.get("routing",false) and float(man.hp)>0 and not man.get("escaped",false):escaping=true;break
  if escaping:break
 if fortress is Dictionary and float(fortress.hp)<=0 and not escaping:
  var defender:=false
  for unit in battle.squads:
   if live(unit) and unit.team==fortress.team:defender=true;break
  if not defender:
   var winner: Variant=null;var best:=-INF
   for unit in battle.squads:
    if live(unit) and unit.team!=fortress.team and float(unit.hp)>best:best=float(unit.hp);winner=unit.team
   battle.winnerTeam=battle.get("attackerTeam") if winner==null else winner
   battle.result="victory" if battle.winnerTeam==0 else "defeat"
   return
 if surviving.size()<=1 and not escaping:
  battle.winnerTeam=surviving[0] if surviving.size()==1 else null
  var player_retreated:=false;var player_alive:=false
  for record in battle.get("retreatedArmies",[]):
   if int(record.team)==0:player_retreated=true;break
  for unit in battle.squads:
   if live(unit) and int(unit.team)==0:player_alive=true;break
  battle.result="retreat" if player_retreated and not player_alive else "victory" if battle.winnerTeam==0 else "defeat"

static func persist_individual_men(state: Dictionary,battle: Dictionary) -> void:
 for unit in battle.squads:
  var source:=int(unit.get("source",-1))
  if unit.get("reserve",false) or source<0 or source>=state.units.size() or not unit.has("men"):continue
  var target: Dictionary=state.units[source];target.hp=unit.hp;target.menCount=unit.menCount;target.soldiers=[]
  for man in unit.men:target.soldiers.append({"id":man.id,"hp":man.hp,"maxHp":man.maxHp})

static func settle_defenders(battle: Dictionary,city: Dictionary) -> void:
 if battle.get("defendersSettled",false):return
 Siege.persist_tower_guards(city,battle)
 var losses:=0
 for unit in battle.squads:
  if unit.get("civilian",false) and float(unit.hp)<=0:losses+=1
 var realm: Dictionary=city.economy.realms[city.team]
 realm.pop=maxf(0,float(realm.pop)-losses);battle.defendersSettled=true

static func persist_siege_damage(city: Dictionary,battle: Dictionary) -> void:
 for section in battle.get("siegeSections",[]):
  var index:=int(section.index)
  if index<0 or index>=city.economy.buildings.size():continue
  var building: Dictionary=city.economy.buildings[index]
  if building.type!=section.type:continue
  building.damageMaxHp=section.maxHp;building.hp=maxf(0,minf(float(building.hp),float(section.hp)))
  if float(building.hp)<=0:building.disabled=true

static func remember(state: Dictionary,battle: Dictionary) -> void:
 if not state.has("deployments"):state.deployments={}
 var key:=str(int(battle.cell.c))+":"+str(int(battle.cell.r))
 if not state.deployments.has(key):state.deployments[key]={}
 var tile: Dictionary=state.deployments[key]
 for unit in battle.squads:
  if unit.get("civilian",false) or unit.get("retreated",false):continue
  var limited: bool=battle.get("field")!=null
  tile[str(int(unit.source))]={"x":clampf(float(unit.x),-68,68) if limited else unit.x,"z":clampf(float(unit.z),-58,58) if limited else unit.z,"heading":unit.get("heading",0),"target":null}
