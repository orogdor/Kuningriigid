class_name MilitaryTraining
extends RefCounted
const District=preload("res://scripts/district_context.gd")
const Travelers=preload("res://scripts/district_builders.gd")
const Nav=preload("res://scripts/local_navigation.gd")
const Econ=preload("res://scripts/economy_rules.gd")
const Bonuses=preload("res://scripts/production_bonuses.gd")
const Army=preload("res://scripts/army_experience.gd")
const Recruitment=preload("res://scripts/military_recruitment.gd")
var trainer_nav: LocalNavigation
var seen_revision: int=-1

func tick(state: Dictionary,city: Dictionary,base: LocalNavigation,dt: float,finish_ship: Callable=Callable(),context_at: Callable=Callable(),nav_for: Callable=Callable(),path_for: Callable=Callable()) -> Dictionary:
 var queue: Array=city.get("training",[])
 if queue.is_empty():
  if city.get("trainingAgent") is Dictionary:city.trainingAgent.working=false;city.trainingAgent.moving=false;city.trainingAgent.visible=false
  return {}
 var job: Dictionary=queue[0]
 # Retraining follows the original unit; it waits if that army leaves town.
 if job.get("upgradeSource")!=null:
  var index:=int(job.upgradeSource)
  if index<0 or index>=state.units.size() or float(state.units[index].get("hp",0))<=0 or int(state.units[index].team)!=int(city.team):queue.pop_front();return {}
  var old: Dictionary=state.units[index];var at_city:=false
  for group in state.armies:
   if int(group.team)==int(city.team) and int(group.get("id",0))==int(old.get("armyId",0)) and int(group.c)==int(city.c) and int(group.r)==int(city.r) and group.get("path",[]).is_empty():at_city=true;break
  if not at_city:job.status="Ootab ümberõpetatava üksuse naasmist";return {}
 var ship_job: bool=job.get("ship",false)
 var hall: Variant=null;var barracks: Variant=null;var harbor: Variant=null
 var work_context: Dictionary=city
 for b in city.economy.buildings:
  if b.type=="hall" and hall==null and not b.get("virtual",false):hall=b
 if ship_job:
  var harbor_tile: Dictionary=job.get("harbor",city)
  for ctx in District.contexts(city):
   if int(ctx.c)!=int(harbor_tile.c) or int(ctx.r)!=int(harbor_tile.r):continue
   for b in ctx.economy.buildings:
    if b.type=="harbor" and b.get("ready",false) and not b.get("disabled",false) and float(b.get("hp",0))>0:harbor=b;work_context=ctx;break
   break
  if harbor==null:job.status="Sadama töö on peatatud";job.blocked=true;return {}
  job.blocked=false;job.status=""
 elif job.get("blocked",false):return {}
 else:
  for ctx in District.contexts(city):
   for b in ctx.economy.buildings:
    if b.type=="barracks" and b.get("ready",false) and not b.get("disabled",false) and float(b.get("hp",0))>0:barracks=b;work_context=ctx;break
   if barracks!=null:break
 if hall==null:return {}
 if city.get("trainingAgent")==null:
  var initial: Variant=base.nearest(Nav.door(hall))
  if initial==null:return {}
  city.trainingAgent={"x":initial.x,"z":initial.z,"c":city.c,"r":city.r,"team":city.team,"workerKey":"trainer:"+str(int(city.id))}
 var worker: Dictionary=city.trainingAgent
 worker.kind="shipwright" if ship_job else "trainer";worker.team=city.team;worker.working=false;worker.moving=false;worker.action=null;worker.visible=true
 var work_dt:=dt*float(job.get("efficiency",0))*Bonuses.national(state,city.team)
 var worked:=0.0
 if work_dt>0:
  var target: Dictionary=harbor if ship_job else barracks if barracks!=null else hall
  var arrived:=true
  if context_at.is_valid() and nav_for.is_valid() and path_for.is_valid():
   arrived=Travelers.travel(state,worker,work_context,work_dt,context_at,nav_for,path_for)
   if arrived:trainer_nav=nav_for.call(work_context,worker)
  elif trainer_nav==null or seen_revision!=int(city.world.get("revision",0)):
   trainer_nav=base.clone_for_agent();seen_revision=int(city.world.get("revision",0))
  if arrived:
   trainer_nav.trail_time=base.trail_time
   if trainer_nav.move(worker,Nav.door(target),work_dt,3.0,true):
    worker.working=true;worker.action="build" if ship_job else "train";worker.heading=atan2(float(target.x)-float(worker.x),float(target.z)-float(worker.z))
    worked=work_dt
 job.progress=minf(float(job.total),float(job.progress)+worked)
 if float(job.progress)+0.00000001<float(job.total):return {}
 if ship_job:
  if finish_ship.is_valid() and finish_ship.call(state,city,job):queue.pop_front();return {"completedShip":job.kind}
  return {}
 if job.get("upgradeSource")!=null:
  var old: Dictionary=state.units[int(job.upgradeSource)];var previous: float=old.get("maxHp",old.hp)
  if previous==0:previous=float(old.hp)
  var ratio:=minf(1,float(old.hp)/previous) if previous>0 else 0.0
  var grade: String=job.get("grade","standard");var strength: float=Recruitment.GRADES.get(grade,Recruitment.GRADES.standard).strength
  var max_hp: float=Econ.DATA.data.troops[job.kind].hp*strength
  old.kind=job.kind;old.grade=grade;old.maxHp=max_hp;old.hp=max_hp*ratio;old.erase("soldiers");old.erase("menCount")
  for group in state.armies:
   if int(group.team)==int(old.team) and int(group.get("id",0))==int(old.get("armyId",0)):Army.sync_army_stats(state,group);break
  queue.pop_front();return {"completed":job.kind,"retrained":true}
 var army: Variant=null
 for candidate in state.armies:
  if candidate.team==city.team and candidate.c==city.c and candidate.r==city.r and candidate.get("embarked")==null:army=candidate;break
 if army==null:
  var main: Variant=state.armies[city.team] if city.team<state.armies.size() else null
  var occupied:=false
  if main!=null:
   for unit in state.units:
    if unit.team==main.team and float(unit.get("hp",0))>0 and not Army.is_garrisoned(unit) and int(unit.get("armyId",0))==int(main.get("id",0)):occupied=true;break
  if main!=null and not occupied and main.get("embarked")==null:
   main.c=city.c;main.r=city.r;main.path=[];army=main
  else:
   if not state.has("nextArmyId"):
    var next:=1
    for candidate in state.armies:next=maxi(next,int(candidate.get("id",0))+1)
    state.nextArmyId=next
   army={"id":state.nextArmyId,"team":city.team,"c":city.c,"r":city.r,"path":[],"stance":"defend"}
   state.nextArmyId+=1;state.armies.append(army)
 var definition: Dictionary=Econ.DATA.data.troops[job.kind]
 var grade: String=job.get("grade","standard")
 var strength: float=Recruitment.GRADES.get(grade,Recruitment.GRADES.standard).strength
 state.units.append({"kind":job.kind,"team":city.team,"armyId":int(army.get("id",0)),"cityId":city.id,"x":hall.x,"z":float(hall.z)+6,"grade":grade,"hp":float(definition.hp)*strength,"morale":100})
 Army.sync_army_stats(state,army)
 queue.pop_front()
 return {"completed":job.kind}
