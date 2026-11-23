class_name BattleEncounter
extends RefCounted
const State=preload("res://scripts/battle_state.gd")
const Tactics=preload("res://scripts/battle_tactics.gd")
const Contact=preload("res://scripts/battle_contact.gd")
const Siege=preload("res://scripts/battle_siege.gd")
const Diplomacy=preload("res://scripts/diplomacy_rules.gd")
const Experience=preload("res://scripts/army_experience.gd")
const Grid=preload("res://scripts/campaign_grid.gd")

static func army_has_units(state: Dictionary,army: Dictionary) -> bool:
 for unit in state.get("units",[]):
  if int(unit.team)==int(army.team) and int(unit.get("armyId",0))==int(army.get("id",0)) and float(unit.get("hp",0))>0 and not Experience.is_garrisoned(unit):return true
 return false

static func encounter(state: Dictionary,cells: Array,navigation_factory: Callable=Callable(),skip: Variant=null) -> Variant:
 if state.get("battle")!=null or state.get("winner")!=null:return null
 for army in state.armies:
  if army.get("embarked")!=null or float(army.get("retreatUntil",0))>float(state.time) or not army_has_units(state,army):continue
  var foes: Array=[]
  for rival in state.armies:
   if rival.get("embarked")!=null or float(rival.get("retreatUntil",0))>float(state.time) or not Diplomacy.at_war(state,int(rival.team),int(army.team)) or int(rival.c)!=int(army.c) or int(rival.r)!=int(army.r) or not army_has_units(state,rival):continue
   foes.append(rival)
  var city: Variant=null
  for candidate in state.get("cities",[]):
   if int(candidate.c)==int(army.c) and int(candidate.r)==int(army.r):city=candidate;break
  var hostile_city: bool=city!=null and Diplomacy.at_war(state,int(city.team),int(army.team))
  if foes.is_empty() and not hostile_city:continue
  if city!=null and not hostile_city:continue
  var c:=int(army.c);var r:=int(army.r)
  if skip is Dictionary and int(skip.c)==c and int(skip.r)==r:continue
  if c<0 or c>=Grid.COLS or r<0 or r>=Grid.ROWS:continue
  var present: Array=[]
  for candidate in state.armies:
   if candidate.get("embarked")!=null or int(candidate.c)!=c or int(candidate.r)!=r or not army_has_units(state,candidate):continue
   if int(candidate.team)==int(army.team) or Diplomacy.at_war(state,int(candidate.team),int(army.team)):present.append(candidate)
  var sources: Dictionary={}
  for i in state.units.size():
   var unit: Dictionary=state.units[i]
   if Experience.is_garrisoned(unit):continue
   for candidate in present:
    if int(candidate.team)==int(unit.team) and int(candidate.get("id",0))==int(unit.get("armyId",0)):sources[i]=true;break
  var battle:=State.create(cells[r*Grid.COLS+c],state.units,state);var selected: Array=[]
  for squad in battle.squads:
   if sources.has(int(squad.source)):selected.append(squad)
  battle.squads=selected;Tactics.deploy(battle);battle.attackerTeam=army.team
  if hostile_city:
   var hall: Dictionary={}
   for building in city.economy.buildings:
    if building.type=="hall":hall=building;break
   if hall.is_empty():continue
   battle.fortress={"team":city.team,"cityId":city.id,"x":hall.x,"z":hall.z,"hp":city.get("hp",600),"maxHp":600,"cool":0}
   Siege.mobilize(battle,city);Siege.fortify(battle,city,state)
  var nav: Variant=navigation_factory.call(battle) if navigation_factory.is_valid() else null
  if nav!=null:
   for squad in battle.squads:
    if squad.get("guardPost",false):continue
    var point: Variant=nav.nearest(squad,80)
    if point!=null:squad.x=point.x;squad.z=point.z
  var initial: Array=battle.squads.duplicate(true)
  if not State.initialize_men(battle,Callable(nav,"is_open") if nav!=null else Callable()):
   if nav==null:return null
   battle.squads=initial
   for squad in battle.squads:
    if squad.get("guardPost",false):continue
    var point: Variant=find_deployment(nav,battle,squad)
    if point==null:return null
    squad.x=point.x;squad.z=point.z
   if not State.initialize_men(battle,Callable(nav,"is_open")):return null
  army.path=[]
  for foe in foes:foe.path=[]
  state.battle=battle
  return battle
 return null

static func find_deployment(nav: Variant,battle: Dictionary,squad: Dictionary) -> Variant:
 var radius:=Contact.soldier_radius(squad);var best: Variant=null;var best_distance:=INF
 for z in range(-285,286,6):
  for x in range(-330,331,6):
   var point: Dictionary={"x":x,"z":z,"radius":radius}
   if not Contact.deployment_allowed(squad,point,battle) or not nav.is_open(x,z):continue
   var distance:=pow(float(squad.x)-x,2)+pow(float(squad.z)-z,2)
   if distance<best_distance:best=point;best_distance=distance
 return {"x":best.x,"z":best.z} if best!=null else null
