extends RefCounted
const Contact=preload("res://scripts/battle_contact.gd")
const Rules=preload("res://scripts/battle_siege_rules.gd")
const SPECS={"ladder":{"name":"Redel","wood":18,"duration":30,"speed":2.6,"lane":2.8},"tower":{"name":"Lükatav piiramistorn","wood":75,"duration":120,"speed":1.15,"lane":5.8},"ram":{"name":"Kaetud müürilõhkuja","wood":55,"duration":90,"speed":1.0,"lane":0},"sap":{"name":"Müüri õõnestamine","wood":30,"duration":60,"speed":1.5,"lane":0},"camp":{"name":"Piiramislaager","wood":80,"duration":60,"speed":0,"lane":0}}
const AGES={"ladder":0,"camp":1,"sap":1,"ram":2,"tower":2}

static func distance(a: Dictionary,b: Dictionary) -> float:
 return Vector2(float(a.x)-float(b.x),float(a.z)-float(b.z)).length()

static func is_builder(unit: Dictionary) -> bool:
 return float(unit.get("hp",0))>0 and not unit.get("retreated",false) and not unit.get("reserve",false) and not unit.get("guardPost",false) and not unit.get("routing",false) and not unit.get("civilian",false) and Contact.troop_role(unit.kind) in ["melee","ranged"] and unit.kind not in ["scout","militia"]

static func available_wood(state: Dictionary,team: int) -> float:
 var total:=0.0
 for city in state.get("cities",[]):
  if int(city.team)==team:total+=maxf(0,float(city.economy.realms[team].resources.get("wood",0)))
 return total

static func start(battle: Dictionary,unit: Dictionary,kind: String,state: Dictionary,nav: Variant=null) -> Dictionary:
 var team:=int(unit.get("team",0));var age:=int(state.ages[team]) if team<state.get("ages",[]).size() else 0
 if age<int(AGES.get(kind,0)):return {"error":"See piiramisvahend avaneb rauaajal."}
 if kind in ["tower","ram"] and "early_siege_engineering" not in state.research[team].known:return {"error":"Uuri: Varane piiramistehnika"}
 if not SPECS.has(kind):return {"error":"Tundmatu piiramisvahend."}
 var fort: Variant=battle.get("fortress")
 if not fort is Dictionary or float(fort.hp)<=0 or battle.get("result")!=null:return {"error":"Piiramisvahendit saab ehitada ainult vaenlase kindlustatud linna piiramisel."}
 if not is_builder(unit) or int(fort.team)==team:return {"error":"Vali elus jalaväe- või vibuküttide salk."}
 for work in battle.get("siegeWorks",[]):
  if unit.get("siegeBuildingId")!=null and work.id==unit.siegeBuildingId and not work.get("destroyed",false):return {"error":"Salk ehitab juba piiramisvahendit."}
 var wall: Variant=null
 for section in battle.get("siegeSections",[]):
  if float(section.hp)<=0 or section.get("breached",false) or int(section.team)==team or (kind=="ram" and section.type not in ["gatehouse","palisade"]):continue
  if wall==null or distance(section,unit)<distance(wall,unit):wall=section
 if wall==null and kind!="camp":return {"error":"Linnal pole tervet müüri, millele piiramisvahendit asetada."}
 if wall==null:wall=fort
 var spec: Dictionary=SPECS[kind];var city: Variant=null;var best:=INF
 for candidate in state.get("cities",[]):
  if int(candidate.team)!=team or float(candidate.economy.realms[team].resources.get("wood",0))<float(spec.wood):continue
  var score:=Vector2(float(candidate.c)-float(battle.cell.c),float(candidate.r)-float(battle.cell.r)).length()
  if score<best:city=candidate;best=score
 if city==null:return {"error":"Vaja %d puitu mõne ründaja linna laost. Praegu kokku: %.0f." % [spec.wood,available_wood(state,team)]}
 if kind=="camp":
  for work in battle.get("siegeWorks",[]):
   if work.kind=="camp" and int(work.team)==team and not work.get("destroyed",false):return {"error":"Sinu armeel on siin piiramislaager juba olemas."}
 var camp_point: Variant=null
 if kind=="camp":
  var dx:=float(unit.x)-float(fort.x);var dz:=float(unit.z)-float(fort.z);var d:=sqrt(dx*dx+dz*dz)
  if d==0:d=1
  var back: Dictionary={"x":float(unit.x)+dx/d*14,"z":float(unit.z)+dz/d*14}
  camp_point=nav.nearest(back,12) if nav!=null else back
  if camp_point==null:camp_point=back
  if distance(camp_point,fort)<35:return {"error":"Piiramislaager tuleb ehitada väljapoole linnasüdant."}
 var stock: Dictionary=city.economy.realms[team].resources;stock.wood=float(stock.wood)-float(spec.wood)
 if not battle.has("siegeWorks"):battle.siegeWorks=[]
 var id:=int(battle.get("nextSiegeWorkId",0))+1;battle.nextSiegeWorkId=id
 var dx:=float(unit.x)-float(wall.x);var dz:=float(unit.z)-float(wall.z);var d:=sqrt(dx*dx+dz*dz)
 if d==0:d=1
 var hp:=300 if kind=="tower" else 240 if kind=="ram" else 100
 var work={"id":id,"kind":kind,"height":wall.get("height",3.8),"hp":hp,"maxHp":hp,"team":team,"ownerSource":unit.source,"wallIndex":wall.get("index"),"woodCost":spec.wood,"duration":spec.duration,"progress":0.0,"ready":false,"arrived":false,"x":unit.x,"z":unit.z,"wallX":wall.x,"wallZ":wall.z,"supplyCityId":city.id,"inwardX":-dx/d,"inwardZ":-dz/d,"startedAt":battle.get("elapsed",0)}
 if kind=="camp":work.x=camp_point.x;work.z=camp_point.z;work.hp=600;work.maxHp=600;work.stones=0;work.produced=0;work.productionSeconds=0
 battle.siegeWorks.append(work);unit.siegeBuildingId=id;unit.attackTargetSource=null;unit.manualOrder=false;unit.target=null;unit.anchor={"x":unit.x,"z":unit.z}
 return {"ok":true,"work":work,"woodRemaining":stock.wood}

static func work_for_squad(battle: Dictionary,unit: Dictionary) -> Variant:
 for work in battle.get("siegeWorks",[]):
  if work.ownerSource==unit.source and work.team==unit.team and work.get("ready",false) and work.get("arrived",false) and not work.get("destroyed",false) and work.kind in ["ladder","tower"]:return work
 return null

static func assault_goal(battle: Dictionary,unit: Dictionary) -> Variant:
 var work: Variant=work_for_squad(battle,unit)
 if work==null or unit.get("manualOrder",false) or unit.get("routing",false):return null
 var progress: float=(float(unit.x)-float(work.wallX))*float(work.inwardX)+(float(unit.z)-float(work.wallZ))*float(work.inwardZ)
 if progress>7:return null
 return {"x":float(work.wallX)+float(work.inwardX)*11,"z":float(work.wallZ)+float(work.inwardZ)*11}

static func tick(battle: Dictionary,dt: float,nav: Variant=null) -> void:
 if battle.get("result")!=null:return
 for work in battle.get("siegeWorks",[]):
  if work.get("destroyed",false):continue
  var actor: Variant=null
  for unit in battle.squads:
   if unit.source==work.ownerSource and unit.team==work.team:actor=unit;break
  if work.kind=="camp":
   if work.get("ready",false):continue
   if actor==null or float(actor.hp)<=0 or actor.get("retreated",false) or actor.get("routing",false):
    work.destroyed=true
    if actor!=null:actor.siegeBuildingId=null
    continue
   actor.anchor={"x":work.x,"z":work.z}
   for man in actor.get("men",[]):
    if float(man.hp)>0 and not man.get("escaped",false) and distance(man,work)<10:work.progress=minf(float(work.duration),float(work.progress)+dt*2);break
   if float(work.progress)>=float(work.duration)-0.000001:work.progress=work.duration;work.ready=true;work.arrived=true;actor.siegeBuildingId=null
   continue
  var wall: Variant=null
  for section in battle.get("siegeSections",[]):
   if section.index==work.wallIndex:wall=section;break
  if wall==null or wall.get("breached",false) or float(wall.hp)<=0:
   work.destroyed=true
   if actor!=null:actor.siegeBuildingId=null
   continue
  if work.get("arrived",false) and work.kind in ["ladder","tower"]:continue
  if actor==null or float(actor.hp)<=0 or actor.get("retreated",false) or actor.get("routing",false):
   work.destroyed=true
   if actor!=null:actor.siegeBuildingId=null
   continue
  if work.get("arrived",false):
   actor.siegeBuildingId=work.id;actor.anchor={"x":float(work.wallX)-float(work.inwardX)*5,"z":float(work.wallZ)-float(work.inwardZ)*5}
   var crew:=0;var contested:=false;var guards:=0
   for man in actor.get("men",[]):
    if float(man.hp)>0 and not man.get("escaped",false) and distance(man,work)<12:crew+=1
   for unit in battle.squads:
    if unit.team==work.team or float(unit.hp)<=0:continue
    if not unit.get("guardPost",false) and not unit.get("routing",false) and distance(unit,work)<9:contested=true
    if unit.get("guardPost",false) and distance(unit,work)<8:guards+=1
   if crew<4 or contested:continue
   work.hp=float(work.hp)-guards*dt*0.8
   if float(work.hp)<=0:work.destroyed=true;actor.siegeBuildingId=null;continue
   if work.kind=="ram":
    work.hitTimer=float(work.get("hitTimer",0))+dt
    if float(work.hitTimer)>=3:work.hitTimer=float(work.hitTimer)-3;Rules.damage({"kind":"battering_ram"},wall,28*minf(1,float(crew)/12))
   if work.kind=="sap":
    work.excavated=float(work.get("excavated",0))+dt*minf(1,float(crew)/12)
    if float(work.excavated)>=120*(2 if wall.type=="reinforced_wall" else 1):wall.hp=0;wall.breached=true
   if float(wall.hp)<=0:wall.breached=true;battle.siegeBreached=true;battle.breachAt={"x":wall.x,"z":wall.z};actor.siegeBuildingId=null;work.destroyed=true
   continue
  if not work.get("ready",false):
   work.progress=minf(float(work.duration),float(work.progress)+dt*2)
   if float(work.progress)>=float(work.duration)-0.000001:work.progress=work.duration;work.ready=true
   continue
  var dock={"x":float(work.wallX)-float(work.inwardX)*6,"z":float(work.wallZ)-float(work.inwardZ)*6}
  var target: Dictionary=(nav.waypoint(work,dock,float(battle.get("elapsed",0))) if nav!=null else dock) if distance(work,dock)>7 else {"x":work.wallX,"z":work.wallZ}
  var d:=distance(work,target);var speed:=float(SPECS[work.kind].speed)*dt*2
  if d<=speed+0.3:
   work.x=target.x;work.z=target.z
   if distance(work,wall)<0.5:work.arrived=true;actor.siegeBuildingId=work.id if work.kind in ["ram","sap"] else null
  else:work.x=float(work.x)+(float(target.x)-float(work.x))/d*speed;work.z=float(work.z)+(float(target.z)-float(work.z))/d*speed
  var follow={"x":float(work.x)-float(work.inwardX)*6,"z":float(work.z)-float(work.inwardZ)*6}
  var open: Variant=nav.nearest(follow,9) if nav!=null else follow
  actor.anchor=open if open!=null else follow

static func plan_ai(battle: Dictionary,state: Dictionary,nav: Variant=null) -> void:
 var fort: Variant=battle.get("fortress")
 if not fort is Dictionary or battle.get("result")!=null or float(battle.get("elapsed",0))<float(battle.get("nextSiegePlan",5)):return
 battle.nextSiegePlan=float(battle.get("elapsed",0))+12
 var teams:=[]
 for unit in battle.squads:
  if unit.team not in teams:teams.append(unit.team)
 for team in teams:
  if team==fort.team:continue
  var works:=[];var builders:=[];var sections:=[];var ranged:=false
  for work in battle.get("siegeWorks",[]):
   if work.team==team and not work.get("destroyed",false):works.append(work)
  var unfinished:=0
  for work in works:
   if not work.get("arrived",false):unfinished+=1
  if unfinished>=2:continue
  for unit in battle.squads:
   if unit.team!=team:continue
   if float(unit.hp)>0 and Contact.troop_role(unit.kind) in ["ranged","siege"]:ranged=true
   if is_builder(unit) and unit.get("combatMode","auto")=="auto" and unit.get("siegeBuildingId")==null and unit.get("resupplyCamp")==null and unit.get("wallClimb")==null and not unit.get("manualOrder",false) and unit.get("attackTargetSource")==null:builders.append(unit)
  if builders.is_empty():continue
  builders.sort_custom(func(a,b):
   var ar:=Contact.troop_role(a.kind)=="ranged";var br:=Contact.troop_role(b.kind)=="ranged"
   return not ar if ar!=br else distance(a,fort)<distance(b,fort))
  for section in battle.get("siegeSections",[]):
   if float(section.hp)>0 and not section.get("breached",false) and section.team!=team:sections.append(section)
  var existing: Dictionary={}
  for work in works:existing[work.kind]=true
  var wanted:=[]
  if ranged and not existing.has("camp"):wanted.append("camp")
  if not sections.is_empty() and not existing.has("ladder"):wanted.append("ladder")
  var has_gate:=false;var high:=false
  for section in sections:
   if section.type in ["gatehouse","palisade"]:has_gate=true
   if float(section.get("height",0))>4:high=true
  if has_gate and not existing.has("ram"):wanted.append("ram")
  if high and not existing.has("tower"):wanted.append("tower")
  if not sections.is_empty() and not existing.has("sap"):wanted.append("sap")
  var chosen: String=""
  for kind in wanted:
   if int(state.ages[int(team)])<int(AGES.get(kind,0)):continue
   if kind in ["tower","ram"] and "early_siege_engineering" not in state.research[int(team)].known:continue
   var can_pay:=false
   for city in state.cities:
    if int(city.team)==int(team) and float(city.economy.realms[int(team)].resources.get("wood",0))>=float(SPECS[kind].wood):can_pay=true;break
   if can_pay:chosen=kind;break
  if chosen.is_empty():continue
  if chosen=="camp":
   builders.sort_custom(func(a,b):
    var ar:=Contact.troop_role(a.kind)=="ranged";var br:=Contact.troop_role(b.kind)=="ranged"
    return not ar if ar!=br else distance(a,fort)>distance(b,fort))
  start(battle,builders[0],chosen,state,nav)
