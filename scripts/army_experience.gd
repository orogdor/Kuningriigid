class_name ArmyExperience
extends RefCounted
const ECON=preload("res://data/economy.json")
const GRADES={"mobilized":0.4,"standard":1.0,"elite":1.4}

static func xp_for_level(level: int) -> float:
 return 100.0*pow(clampi(level,1,10)-1,2)

static func army_level(army: Dictionary) -> int:
 return mini(10,1+floori(sqrt(maxf(0.0,float(army.get("xp",0)))/100.0)))

static func experience_bonus(army: Dictionary) -> float:
 return 1.0+2.0*(army_level(army)-1)/9.0

static func unit_stats(definition: Dictionary,unit: Dictionary,army: Variant=null) -> Dictionary:
 var result:=definition.duplicate(true)
 var raw_experience: Variant=unit.get("experienceMultiplier")
 var experience: float=experience_bonus(army) if army!=null else (1.0 if raw_experience==null else float(raw_experience))
 var quality: float=GRADES.get(unit.get("grade","standard"),1.0)
 result.hp=float(definition.get("hp",0))*quality*experience
 result.dmg=float(definition.get("dmg",0))*quality*experience
 result.range=float(definition.get("range",0))*experience
 result.speed=float(definition.get("speed",0))*experience
 result.morale=100.0*experience;result.attackSpeed=experience
 return result

static func is_garrisoned(unit: Dictionary) -> bool:
 var value: Variant=unit.get("garrison")
 if value==null:return false
 if value is bool:return value
 if value is int or value is float:return value!=0
 if value is String:return not value.is_empty()
 return true

static func sync_army_stats(state: Dictionary,army: Dictionary) -> void:
 var factor:=experience_bonus(army);army.level=army_level(army)
 for unit in state.units:
  if unit.team!=army.team or int(unit.get("armyId",0))!=int(army.get("id",0)) or is_garrisoned(unit):continue
  if not ECON.data.troops.has(unit.kind):continue
  var definition: Dictionary=ECON.data.troops[unit.kind]
  var stats:=unit_stats(definition,unit,army)
  var old_max:=float(unit.get("maxHp",0))
  if old_max==0:
   var old_experience:=float(unit.get("experienceMultiplier",1))
   if old_experience==0:old_experience=1
   old_max=float(definition.hp)*float(GRADES.get(unit.get("grade","standard"),1.0))*old_experience
  unit.hp=maxf(0.0,minf(float(stats.hp),float(unit.hp)/old_max*float(stats.hp)))
  unit.maxHp=stats.hp
  var old_morale:=float(unit.get("maxMorale",100))
  if old_morale==0:old_morale=100
  var morale: Variant=unit.get("morale")
  unit.morale=(100.0 if morale==null else float(morale))/old_morale*float(stats.morale)
  unit.maxMorale=stats.morale
  if not unit.has("grade") or unit.grade==null:unit.grade="standard"
  unit.experienceMultiplier=factor;unit.armyLevel=army.level

static func travel_multiplier(state: Dictionary,army: Dictionary) -> float:
 var speed:=INF
 for unit in state.units:
  if unit.team!=army.team or int(unit.get("armyId",0))!=int(army.get("id",0)) or float(unit.get("hp",0))<=0 or is_garrisoned(unit):continue
  var definition: Dictionary=ECON.data.troops.get(unit.kind,{"speed":3})
  speed=minf(speed,float(unit_stats(definition,unit,army).speed))
 return maxf(0.2,speed/3.0) if is_finite(speed) else 1.0

static func initialize(state: Dictionary) -> void:
 for army in state.armies:
  var xp:=float(army.get("xp",0))
  army.xp=clampf(xp if is_finite(xp) else 0.0,0.0,xp_for_level(10))
  sync_army_stats(state,army)

static func reward_battle_experience(state: Dictionary,battle: Dictionary) -> Array:
 var awards: Array=[]
 if not battle.get("result") or battle.get("experienceAwarded",false):return awards
 var groups: Dictionary={}
 for squad in battle.get("squads",[]):
  if squad.get("civilian",false):continue
  var source:=int(squad.get("source",-1))
  if source<0 or source>=state.units.size():continue
  var unit: Dictionary=state.units[source]
  if is_garrisoned(unit):continue
  var army: Variant=null
  for candidate in state.armies:
   if candidate.team==unit.team and int(candidate.get("id",0))==int(unit.get("armyId",0)):army=candidate;break
  if army==null:continue
  var key:=str(int(army.team))+":"+str(int(army.get("id",0)))
  if not groups.has(key):groups[key]={"army":army,"xp":10.0}
  groups[key].xp+=float(squad.get("damageDealt",0))*0.5+float(squad.get("kills",0))*25.0
 for group in groups.values():
  var army: Dictionary=group.army;var alive:=false
  for unit in state.units:
   if unit.team==army.team and int(unit.get("armyId",0))==int(army.get("id",0)) and not is_garrisoned(unit) and float(unit.get("hp",0))>0:alive=true;break
  if not alive:army.xp=0;army.level=1;continue
  var earned:=floori(float(group.xp)+(100.0 if army.team==battle.get("winnerTeam") else 0.0)+0.5)
  army.xp=minf(xp_for_level(10),float(army.get("xp",0))+earned)
  sync_army_stats(state,army)
  awards.append({"team":army.team,"armyId":army.get("id",0),"earned":earned,"level":army.level,"xp":army.xp})
 battle.experienceAwarded=true
 return awards
