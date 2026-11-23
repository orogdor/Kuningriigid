extends RefCounted
const Nav=preload("res://scripts/local_navigation.gd")
const Econ=preload("res://scripts/economy_rules.gd")
const Bonuses=preload("res://scripts/production_bonuses.gd")
const Roads=preload("res://scripts/world_roads.gd")
const District=preload("res://scripts/district_context.gd")
const Operations=preload("res://scripts/building_operations.gd")

# Builders remain owned by the parent city. They travel to the chosen depot
# and construction site across real detail-tile edges, like builders.js.
static func travel(state: Dictionary,worker: Dictionary,target: Dictionary,dt: float,context_at: Callable,nav_for: Callable,path_for: Callable) -> bool:
 if int(worker.c)==int(target.c) and int(worker.r)==int(target.r):return true
 var path:Variant=path_for.call(worker,target,int(worker.team))
 if path==null or path.is_empty():worker.status="Ehitusplatsile puudub tee";return false
 var next:Dictionary=path[0];var dc:=int(next.c)-int(worker.c);var dr:=int(next.r)-int(worker.r)
 var ctx:Variant=context_at.call(Vector2i(int(worker.c),int(worker.r)))
 if ctx==null:worker.status="Ootab läbipääsu";return false
 var nav:Variant=nav_for.call(ctx,worker)
 var edge:Variant=nav.nearest({"x":dc*(112.5-5),"z":dr*(97.5-5)},15)
 if edge==null:worker.status="Ootab läbipääsu";return false
 worker.status="Liigub järgmisse piirkonda"
 if nav.move(worker,edge,dt,3.0,true):
  var from:Dictionary={"c":worker.c,"r":worker.r};worker.c=int(next.c);worker.r=int(next.r)
  Roads.record_step(state,from,worker,"builder",float(state.get("time",0)))
  var dest:Variant=context_at.call(Vector2i(worker.c,worker.r))
  if dest!=null:
   var dest_nav:Variant=nav_for.call(dest,worker);var entry:Variant=dest_nav.nearest({"x":-dc*(112.5-5),"z":-dr*(97.5-5)},20)
   if entry!=null:worker.x=entry.x;worker.z=entry.z
 return false

static func attach(parent: Dictionary,worker: Dictionary,context_at: Callable) -> void:
 var id:=str(worker.workerKey)
 for ctx in District.contexts(parent):
  if int(ctx.c)!=int(worker.c) or int(ctx.r)!=int(worker.r):ctx.world.get("workers",{}).erase(id)
 var current:Variant=context_at.call(Vector2i(int(worker.c),int(worker.r)))
 if current!=null:
  if not current.world.has("workers"):current.world.workers={}
  current.world.workers[id]=worker

static func tick(state: Dictionary,parent: Dictionary,dt: float,context_at: Callable,nav_for: Callable,path_for: Callable) -> Dictionary:
 var contexts:=District.contexts(parent);var jobs:=[]
 for ctx in contexts:
  for i in ctx.economy.buildings.size():
   var building:Dictionary=ctx.economy.buildings[i]
   if not building.get("ready",false):building.assigned=0.0;building.efficiency=0.0;building.workThisTick=0.0
   if building.get("wallUpgradeV184") is Dictionary and not building.get("virtual",false) and float(building.get("hp",0))>0:
    var upgrade:Dictionary=building.wallUpgradeV184;upgrade.assigned=0.0;upgrade.efficiency=0.0;upgrade.workThisTick=0.0
    jobs.append({"ctx":ctx,"building":upgrade,"owner":building,"index":i})
   elif not building.get("ready",false) and not building.get("virtual",false) and not building.get("disabled",false) and float(building.get("hp",0))>0 and float(building.get("workerLimit",1))!=0:jobs.append({"ctx":ctx,"building":building,"index":i})
 if not parent.has("builderAgents"):parent.builderAgents=[]
 var assigned:=maxf(0.0,float(parent.get("buildersAssigned",0)));var count:=ceili(assigned)
 var hall:Dictionary={}
 for b in parent.economy.buildings:
  if b.type=="hall" and not b.get("virtual",false) and b.get("ready",false):hall=b;break
 if hall.is_empty():count=0
 while parent.builderAgents.size()<count:
  var i:int=parent.builderAgents.size();var probe:Dictionary={"workerKey":"builder:%s:%s" % [parent.id,i]};var nav:Variant=nav_for.call(parent,probe);var initial:Variant=nav.nearest(Nav.door(hall))
  if initial==null:break
  parent.builderAgents.append({"x":initial.x,"z":initial.z,"c":parent.c,"r":parent.r,"team":parent.team,"kind":"builder","workerKey":probe.workerKey,"working":false,"moving":false,"visible":true})
 var completed:=[]
 for i in parent.builderAgents.size():
  var worker:Dictionary=parent.builderAgents[i];worker.team=parent.team;worker.moving=false;worker.working=false;worker.action=null;worker.visible=true
  var share:=clampf(assigned-i,0,1)
  if share<=0 or jobs.is_empty():
   worker.materialLoad=0.0;worker.carried=0.0
   if hall.is_empty():worker.visible=false;attach(parent,worker,context_at);continue
   worker.status="Naaseb linnakeskusse"
   if travel(state,worker,parent,dt,context_at,nav_for,path_for):
    var idle_nav:Variant=nav_for.call(parent,worker)
    if idle_nav.move(worker,Nav.door(hall),dt,3.0,true):worker.status="Ootab järgmist ehitust";worker.visible=i<count
   attach(parent,worker,context_at);continue
  var task:Dictionary=jobs[i%jobs.size()];var ctx:Dictionary=task.ctx;var job:Dictionary=task.building
  worker.job="%s:%s:%s%s" % [ctx.c,ctx.r,task.index,":upgrade" if task.has("owner") else ""];job.assigned=float(job.assigned)+share;job.efficiency=float(job.efficiency)+share
  attach(parent,worker,context_at)
  if float(job.get("materialsRemaining",0))>0:
   if worker.get("materialJob")!=worker.job:worker.materialJob=worker.job;worker.materialLoad=0.0;worker.carried=0.0;worker.materialDepot=null
   var depot:Variant=find_depot(contexts,ctx,worker,path_for)
   if depot==null:worker.status="Puudub ligipääsetav ladu";continue
   if float(worker.get("materialLoad",0))<=0:
    worker.status="Läheb materjalilattu"
    if not travel(state,worker,depot.ctx,dt*share,context_at,nav_for,path_for):attach(parent,worker,context_at);continue
    var nav:Variant=nav_for.call(depot.ctx,worker)
    if nav.move(worker,Nav.door(depot.building),dt*share,3.0,true):worker.materialLoad=minf(24.0,float(job.materialsRemaining));worker.carried=worker.materialLoad;worker.status="Võttis ehitusmaterjalid"
    continue
   worker.status="Viib materjali ehitusplatsile"
   if not travel(state,worker,ctx,dt*share,context_at,nav_for,path_for):attach(parent,worker,context_at);continue
   var nav:Variant=nav_for.call(ctx,worker)
   if nav.move(worker,Nav.door(job),dt*share,3.0,true):
    job.materialsRemaining=maxf(0,float(job.materialsRemaining)-float(worker.materialLoad));worker.materialLoad=0.0;worker.carried=0.0
   continue
  if not travel(state,worker,ctx,dt*share,context_at,nav_for,path_for):attach(parent,worker,context_at);continue
  var nav:Variant=nav_for.call(ctx,worker)
  if not nav.move(worker,Nav.door(job),dt*share,3.0,true):worker.status="Läheb ehitusplatsile";continue
  worker.status="Ehitab";worker.working=true;worker.action="build";worker.builderArrived=true
  var age:=clampi(int(state.ages[parent.team]),0,6);var strength:float=[1.0,1.2,1.4,1.7,1.95,2.25,2.6][age]
  var work:=dt*share*Bonuses.national(state,int(parent.team))*strength
  job.workThisTick=float(job.workThisTick)+work;job.progress=float(job.get("progress",0))+work
  if task.has("owner"):
   if job.progress+0.00000001>=float(job.total):
    Operations.finish_wall_upgrade(task.owner);ctx.world.revision=int(ctx.world.get("revision",0))+1;completed.append(task)
  else:
   var definition:Dictionary=Econ.DATA.data.buildings[job.type]
   if job.progress+0.00000001>=float(job.get("buildTimeV1757",definition.time))*Econ.tempo_factor(state):
    job.ready=true;job.status="Valmis";parent.economy.realms[parent.team].log.append({"time":floori(parent.economy.time),"text":"Valmis: "+str(definition.name)});completed.append(task)
  attach(parent,worker,context_at)
 return {"district_completed":completed} if not completed.is_empty() else {}

static func find_depot(contexts: Array,target: Dictionary,worker: Dictionary,path_for: Callable) -> Variant:
 var saved:Variant=worker.get("materialDepot")
 if saved is Dictionary:
  for ctx in contexts:
   if int(ctx.c)!=int(saved.get("c",-1)) or int(ctx.r)!=int(saved.get("r",-1)):continue
   var index:=int(saved.get("index",-1))
   if index<0 or index>=ctx.economy.buildings.size():break
   var candidate:Dictionary=ctx.economy.buildings[index]
   if not candidate.get("virtual",false) and candidate.get("ready",false) and float(candidate.get("hp",0))>0 and candidate.type in ["hall","warehouse"]:return {"ctx":ctx,"building":candidate}
   break
 var best:Variant=null;var score:=INF
 for ctx in contexts:
  if (ctx.c!=target.c or ctx.r!=target.r) and path_for.call(ctx,target,int(worker.team))==null:continue
  for building in ctx.economy.buildings:
   if building.get("virtual",false) or not building.get("ready",false) or float(building.get("hp",0))<=0 or building.type not in ["hall","warehouse"]:continue
   var d:float=(absf(float(ctx.c)-float(worker.c))+absf(float(ctx.r)-float(worker.r))+absf(float(ctx.c)-float(target.c))+absf(float(ctx.r)-float(target.r)))*2
   if d<score or (d==score and building.type=="warehouse" and best!=null and best.building.type!="warehouse"):score=d;best={"ctx":ctx,"building":building}
 if best!=null:worker.materialDepot={"c":best.ctx.c,"r":best.ctx.r,"index":best.ctx.economy.buildings.find(best.building)}
 return best
