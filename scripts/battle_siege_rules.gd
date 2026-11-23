class_name BattleSiegeRules
extends RefCounted

const PROFILES={
 "palisade":{"height":2.4,"hp":420,"cover":0.55,"material":"wood"},
 "stonewall":{"height":3.8,"hp":900,"cover":0.45,"material":"stone"},
 "reinforced_wall":{"height":6.4,"hp":1800,"cover":0.35,"material":"stone"},
 "gatehouse":{"height":3.8,"hp":700,"cover":0.45,"material":"gate"},
 "woodgate":{"height":3.1,"hp":320,"cover":0.2,"material":"gate"}}

static func prepare_wall(building: Dictionary) -> void:
 var profile: Dictionary=PROFILES.get(building.get("type",""),{})
 if profile.is_empty() or int(building.get("wallRulesVersion",0))==114:return
 var old:=float(building.get("damageMaxHp",building.get("hp",350)));if old==0:old=350
 var health: float=float(building.hp) if building.get("hp")!=null else old
 building.hp=float(profile.hp)*clampf(health/old,0,1);building.damageMaxHp=profile.hp;building.wallRulesVersion=114

static func structural_multiplier(kind: String,type: String) -> float:
 var material: String=PROFILES.get(type,{}).get("material","stone")
 if kind=="siege_tower":return 0
 if kind=="battering_ram":return 4 if material=="gate" else 2.5 if material=="wood" else 0.12
 var artillery: float={"bronze_catapult":0.8,"catapult":1.5,"field_cannon":4,"industrial_artillery":6}.get(kind,0)
 if artillery>0:return artillery*(1.5 if material=="wood" else 1.0)
 if material=="stone":return 0
 for part in ["archer","bow","slinger","scout","chariot","cavalry","knight"]:
  if part in kind:return 0
 return 0.35 if "axe" in kind else 0.07

static func damage(attacker: Dictionary,section: Dictionary,amount: float) -> float:
 var dealt:=maxf(0,amount*structural_multiplier(attacker.kind,section.type))
 section.hp=maxf(0,float(section.hp)-dealt)
 if float(section.hp)==0:section.breached=true
 return dealt

static func cover(attacker: Dictionary,target: Dictionary,projectile: Variant) -> float:
 var unit: Dictionary=target.u
 if not unit.get("guardPost",false):return 1.0
 if projectile==null or projectile=="" or projectile=="stone":return 0.85
 if projectile=="ballista":return 0.65
 var man: Dictionary=attacker.get("m",{});var aunit: Dictionary=attacker.get("u",{})
 var ay:=float(man.get("elevation",aunit.get("wallElevation",0)))
 var ty:=float(target.m.get("elevation",unit.get("wallElevation",3.8)))
 return float(PROFILES.get(unit.get("wallType",""),{}).get("cover",0.45)) if ay<ty-1 else 0.85

static func wall_blocks_shot(battle: Dictionary,from: Dictionary,to: Dictionary,from_y:=0.0,to_y:=0.0) -> bool:
 var dx:=float(to.x)-float(from.x);var dz:=float(to.z)-float(from.z);var length:=dx*dx+dz*dz
 if length==0:return false
 for wall in battle.get("siegeSections",[]):
  if float(wall.hp)<=0 or wall.get("breached",false):continue
  var t:=((float(wall.x)-float(from.x))*dx+(float(wall.z)-float(from.z))*dz)/length
  if t<=0.03 or t>=0.97:continue
  var x:=float(from.x)+dx*t-float(wall.x);var z:=float(from.z)+dz*t-float(wall.z)
  var vertical: bool=bool(wall.get("wallAxis",0))
  if absf(x)<(1.5 if vertical else 3.6) and absf(z)<(3.6 if vertical else 1.5) and from_y+(to_y-from_y)*t+1.6<float(wall.get("height",3.8)):return true
 return false
