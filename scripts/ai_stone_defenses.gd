extends RefCounted
const Operations=preload("res://scripts/building_operations.gd")
const Econ=preload("res://scripts/economy_rules.gd")
const District=preload("res://scripts/district_context.gd")
const Discovery=preload("res://scripts/world_discoveries.gd")
const Local=preload("res://scripts/local_navigation.gd")
const Builder=preload("res://scripts/builder_sim.gd")
const FORTS=["palisade","woodgate","watchtower","stonewall","gatehouse","stonetower","reinforced_wall"]
const TerrainPlan=preload("res://scripts/terrain_defense_plan.gd")
const HistoricUrban=preload("res://scripts/historic_urban.gd")
const WallDraw=preload("res://scripts/wall_draw.gd")
const OuterSurvey=preload("res://scripts/outer_ring_survey.gd")

static func outer_survey_eligible(state:Dictionary,city:Dictionary)->bool:
 if city.get("outerRingV184") is Dictionary or float(state.time)<float(city.get("nextOuterSurveyV184",0)):return false
 var old:Variant=city.get("stoneDefensePlanV166",city.get("defensePlanV139"))
 if not old is Dictionary or old.get("slots",[]).is_empty() or old.get("outlineV176",[]).size()<8:return false
 var all:=District.all_buildings(city);var standing:=[];var waiting:=0;var fort_waiting:=0
 for ctx in District.contexts(city):
  for b in ctx.economy.buildings:
   if b.get("virtual",false) or float(b.get("hp",0))<=0:continue
   if b.get("wallUpgradeV184")!=null:return false
   if not b.get("ready",false):waiting+=1;if b.type in FORTS:fort_waiting+=1
   if b.type in FORTS and not b.get("outerRingV184",false):
    var shifted:Dictionary=b.duplicate();shifted.x=float(b.x)+(int(ctx.c)-int(city.c))*225.0;shifted.z=float(b.z)+(int(ctx.r)-int(city.r))*195.0;standing.append(shifted)
 if not city.get("outerRingPreviewOnlyV190",false):
  for b in standing:
   if b.type in ["palisade","woodgate","watchtower"] or not b.get("ready",false):return false
  for slot in old.slots:
   if not standing.any(func(b):return Vector2(b.x,b.z).distance_to(Vector2(slot.x,slot.z))<(1.6 if slot.get("drawnWallV175",false) else 5.0)):return false
  var demand:=OuterSurvey.suburb_demand(city)
  city.outerRingNeedV204={"outside":demand.count,"cluster":demand.cluster.size(),"required":13}
  if not demand.ready:
   city.outerRingDiagnosticV184={"reason":"waiting-for-13-outside-buildings","outside":demand.count,"cluster":demand.cluster.size(),"required":13,"at":state.time};return false
 if fort_waiting>=2:return false
 for b in all:
  if float(b.get("hp",0))>0 and not b.get("ready",false) and b.type in FORTS and not b.get("outerRingV184",false):return false
 var realm:Dictionary=city.economy.realms[int(city.team)];var stock:Dictionary=realm.resources;var food:=0.0
 for resource in ["bread","meat","fish","grain","berries","vegetables"]:food+=float(stock.get(resource,0))
 return float(realm.pop)>=11 and waiting<=3 and float(stock.get("gold",0))>=120 and float(stock.get("wood",0))>=14 and float(stock.get("stone",0))>=26 and float(stock.get("water",0))>=float(realm.pop)*1.1 and food>=float(realm.pop)*1.6

# V191 permits real perpendicular L/T connections to a standing curtain,
# while parallel overlaps remain invalid.
static func allowed_suburb_join(a:Dictionary,b:Dictionary)->bool:
 if not a.get("outerRingV184",false) or not a.get("drawnWallV175",false) or b.get("type","") not in ["palisade","stonewall","reinforced_wall"]:return false
 var aa:=float(a.get("wallAngleV175",0));var ba:=float(b.get("wallAngleV175",0))
 if absf(cos(aa-ba))>0.94:return false
 var a_end_angle:=float(a.get("wallAngleV175",PI/2 if a.get("wallAxis",false) else 0));var b_end_angle:=float(b.get("wallAngleV175",PI/2 if b.get("wallAxis",false) else 0))
 var aaxis:=Vector2(cos(a_end_angle),-sin(a_end_angle));var baxis:=Vector2(cos(b_end_angle),-sin(b_end_angle))
 var ah:=float(a.get("palisadeSpanV167",7))/2;var bh:=float(b.get("palisadeSpanV167",7))/2
 var ac:=Vector2(a.x,a.z);var bc:=Vector2(b.x,b.z);var a0:=ac-aaxis*ah;var a1:=ac+aaxis*ah;var b0:=bc-baxis*bh;var b1:=bc+baxis*bh
 var r:=a1-a0;var s:=b1-b0;var cross:=r.cross(s)
 if absf(cross)>=5:
  var delta:=b0-a0;var t:=delta.cross(s)/cross;var u:=delta.cross(r)/cross
  if t>=-0.03 and t<=1.03 and u>=-0.03 and u<=1.03:return true
 # The source's attachment projection uses wallAngleV175's zero default.
 var projection_axis:=Vector2(cos(ba),-sin(ba))
 for p in [a0,a1]:
  var delta:Vector2=p-bc;var along:=delta.dot(projection_axis);var across:=absf(delta.cross(projection_axis))
  if absf(along)<=bh+1.1 and across<=1.05 and ac.distance_to(bc)>2.5:return true
 return false

static func allowed_suburb_corner(a:Dictionary,b:Dictionary,neighbors:Array)->bool:
 if not a.get("outerRingV184",false) or not a.get("drawnWallV175",false) or b.get("type","") not in ["palisade","stonewall","reinforced_wall"]:return false
 var b_ends:=WallDraw.end_points(b)
 for other in neighbors:
  if is_same(other,b) or not allowed_suburb_join(a,other):continue
  for p in WallDraw.end_points(other):
   for q in b_ends:
    if p.distance_to(q)<=1.7:return true
 return false

# Resume a surveyed outer curtain saved by the source game. Planning a new
# curtain requires the separate terrain and suburb survey from V184.
static func continue_outer_ring(state:Dictionary,city:Dictionary,context_for:Callable,runtime_for:Callable,rule:Callable,global_terrain:Callable=Callable())->bool:
 var plan:Variant=city.get("outerRingV184")
 var old:Variant=city.get("stoneDefensePlanV166",city.get("defensePlanV139"))
 if not plan is Dictionary or not plan.get("slots") is Array or plan.slots.is_empty() or not old is Dictionary or old.get("slots",[]).is_empty():return false
 var all:=District.all_buildings(city);var live:=[];var waiting:=0;var fort_waiting:=0
 for ctx in District.contexts(city):
  for building in ctx.economy.buildings:
   if building.get("virtual",false) or float(building.get("hp",0))<=0:continue
   if building.has("wallUpgradeV184") and building.wallUpgradeV184!=null:return false
   if not building.get("ready",false):
    waiting+=1
    if building.type in FORTS:fort_waiting+=1
   if building.type in FORTS and not building.get("outerRingV184",false):
    var b:Dictionary=building.duplicate();b.x=float(b.x)+(int(ctx.c)-int(city.c))*225.0;b.z=float(b.z)+(int(ctx.r)-int(city.r))*195.0;live.append(b)
 if not city.get("outerRingPreviewOnlyV190",false):
  var missing:=0;var wooden:=0;var constructing:=0
  for slot in old.slots:
   if not live.any(func(b):return Vector2(b.x,b.z).distance_to(Vector2(slot.x,slot.z))<(1.6 if slot.get("drawnWallV175",false) else 5.0)):missing+=1
  for b in live:
   if b.type in ["palisade","woodgate","watchtower"]:wooden+=1
   if not b.get("ready",false) or b.get("wallUpgradeV184")!=null:constructing+=1
  if missing>0 or wooden>0 or constructing>0:
   city.outerRingDiagnosticV184={"reason":"old-wall-first","missing":missing,"wooden":wooden,"constructing":constructing,"at":state.time};return false
  var outline:Array=old.get("outlineV176",[])
  if outline.size()>=3:
   for slot in plan.slots:
    var p:=Vector2(slot.x,slot.z)
    if TerrainPlan.inside(p,outline) and HistoricUrban.distance_to_curtain(p,outline)>3.5:
     city.outerRingDiagnosticV184={"reason":"invalid-interior-outer-wall","at":state.time};return false
 var index:=int(plan.get("nextIndex",0));var unfinished:=false;var inner_building:=false
 for b in all:
  if float(b.get("hp",0))<=0 or b.get("ready",false) or b.type not in FORTS:continue
  if b.get("outerRingV184",false):unfinished=true
  else:inner_building=true
 var pending:bool=index<plan.slots.size() or unfinished
 if inner_building or fort_waiting>=2:
  if pending:city.outerRingDiagnosticV184={"reason":"inner-wall-building" if inner_building else "construction-backlog","index":index,"total":plan.slots.size(),"at":state.time}
  return pending
 var team:=int(city.team);var realm:Dictionary=city.economy.realms[team];var stock:Dictionary=realm.resources;var food:=0.0
 for resource in ["bread","meat","fish","grain","berries","vegetables"]:food+=float(stock.get(resource,0))
 if float(realm.pop)<11 or waiting>3 or float(stock.get("gold",0))<120 or float(stock.get("wood",0))<14 or float(stock.get("stone",0))<26 or float(stock.get("water",0))<float(realm.pop)*1.1 or food<float(realm.pop)*1.6:
  if pending:city.outerRingDiagnosticV184={"reason":"saving-for-outer-ring","index":index,"total":plan.slots.size(),"at":state.time}
  return pending
 if index>=plan.slots.size():
  city.outerRingDiagnosticV184={"reason":"finishing" if unfinished else "complete","total":plan.slots.size(),"at":state.time};return unfinished
 var slot:Dictionary=plan.slots[index];var type:=str(slot.get("type",""))
 if type not in FORTS:return false
 var cost:Dictionary=Econ.DATA.data.buildings[type].cost
 if not Econ.can_afford(stock,cost) or float(stock.get("wood",0))-float(cost.get("wood",0))<12 or float(stock.get("stone",0))-float(cost.get("stone",0))<18 or (float(cost.get("plank",0))>0 and float(stock.get("plank",0))-float(cost.get("plank",0))<8):return true
 var dc:=floori((float(slot.x)+112.5)/225.0);var dr:=floori((float(slot.z)+97.5)/195.0)
 var ctx:Variant=context_for.call(city,Vector2i(int(city.c)+dc,int(city.r)+dr))
 if not ctx is Dictionary:return true
 var nav:LocalNavigation=runtime_for.call(ctx).nav;var local:Dictionary=slot.duplicate(true);local.x=float(slot.x)-dc*225.0;local.z=float(slot.z)-dr*195.0;local.outerRingV184=true;local.team=team;local.hp=350
 var terrain:Callable=Callable()
 if global_terrain.is_valid():terrain=func(x,z):return global_terrain.call(city,x+dc*225.0,z+dr*195.0)
 if not str(rule.call(ctx,type)).is_empty() or blocked(local,ctx.economy.buildings,nav,terrain) or deposit_blocked(local,ctx.world):
  city.outerRingDiagnosticV184={"reason":"site-blocked","index":index,"at":state.time};return int(state.ages[team])<4
 var economy:=District.build_economy(city,ctx)
 for i in economy.buildings.size():
  var neighbor:Dictionary=economy.buildings[i]
  if WallDraw.crosses_gate(local,neighbor):
   city.outerRingDiagnosticV184={"reason":"gate-opening-blocked","index":index,"at":state.time};return int(state.ages[team])<4
  if allowed_suburb_join(local,neighbor) or allowed_suburb_corner(local,neighbor,economy.buildings) or WallDraw.end_join(local,neighbor):
   var copy:Dictionary=neighbor.duplicate();copy.virtual=true;economy.buildings[i]=copy
 var passable=func(x,z,_team):return terrain.call(x,z) if terrain.is_valid() else terrain_open(nav,x,z)
 var result:=Econ.place_building(economy,team,type,Vector2(local.x,local.z),passable,Callable(),true)
 if result.has("error"):
  city.outerRingDiagnosticV184={"reason":result.error,"index":index,"at":state.time};return int(state.ages[team])<4
 var building:Dictionary=result.building
 for key in ["wallAxis","wallAngleV175","palisadeSpanV167","extendedPalisadeV166","drawnWallV175","cliffEmbedStartV179","cliffEmbedEndV179"]:
  if local.has(key):building[key]=local[key]
 building.outerRingV184=true;building.plannedDefense=true
 ctx.economy.buildings.append(building);Builder.clear_footprint(ctx.world,building);nav.rebuild(ctx.economy.buildings,ctx.world.resources)
 plan.nextIndex=index+1;city.outerRingDiagnosticV184={"reason":"building","index":index+1,"total":plan.slots.size(),"at":state.time};return true

# Rectangular fallback from stoneVillageWallPlan in stone-village-defenses-v166.
static func wall_plan(buildings: Array,seed: int,options: Dictionary={}) -> Dictionary:
 var hall:Dictionary={"x":0,"z":0};var xs:Array=[];var zs:Array=[]
 for b in buildings:
  if float(b.get("hp",0))<=0 or b.get("virtual",false):continue
  if b.type=="hall":hall=b;break
 for b in buildings:
  if b.type=="house" and float(b.get("hp",0))>0 and not b.get("virtual",false):xs.append(absf(float(b.x)-float(hall.x)));zs.append(absf(float(b.z)-float(hall.z)))
 xs.sort();zs.sort()
 var rx:=ceili(clampf((float(xs[floori((xs.size()-1)*0.90)]) if not xs.is_empty() else 25.0)+14+float(options.get("extraX",0)),42,70)/14.0)*14
 var rz:=ceili(clampf((float(zs[floori((zs.size()-1)*0.90)]) if not zs.is_empty() else 25.0)+14+float(options.get("extraZ",0)),42,70)/14.0)*14
 var origin:=Vector2(float(hall.x)+float(options.get("dx",0)),float(hall.z)+float(options.get("dz",0)));var slots:=[]
 var push=func(type,x,z,axis):slots.append({"type":type,"x":floor((x+origin.x)*2+0.5)/2,"z":floor((z+origin.y)*2+0.5)/2,"wallAxis":axis})
 for z in [-rz,rz]:push.call("woodgate",0,z,0)
 for x in [-rx,rx]:
  for z in [-rz,rz]:push.call("watchtower",x,z,0)
 for z in [-rz,rz]:
  for side in [-1,1]:
   var distance:=float(rx)-7;var parts:=maxi(1,ceili(distance/35.0))
   for i in parts:
    var a:=7+distance*i/parts;var b:=7+distance*(i+1)/parts
    push.call("palisade",side*(a+b)/2,z,0);slots.back().palisadeSpanV167=b-a
 for x in [-rx,rx]:
  var parts:=maxi(2,ceili(2.0*rz/42.0))
  for i in parts:
   var a:float=-rz+2.0*rz*i/parts;var b:float=-rz+2.0*rz*(i+1)/parts
   push.call("palisade",x,(a+b)/2,1);slots.back().palisadeSpanV167=b-a
 for slot in slots:
  if slot.type=="woodgate":slot.extendedPalisadeV166=true
 return {"version":167,"slots":slots,"gateOpenings":2,"rx":rx,"rz":rz,"shape":"rectangular-wooden-palisade","nextIndex":0,"constructed":0,"blocked":0,"seed":seed}

static func eligibility(age: int,pop: float,houses: int,services: int,waiting: int,stock: Dictionary) -> Dictionary:
 var food:=0.0
 for key in ["bread","meat","fish","grain","berries","vegetables"]:food+=float(stock.get(key,0))
 var reason: Variant="later-era" if age!=0 else "population" if pop<5 else "housing" if houses<3 else "services" if services<1 else "construction-backlog" if waiting>3 else "timber-reserve" if float(stock.get("wood",0))<12 else "water" if float(stock.get("water",0))<pop else "food" if food<pop*1.4 else null
 return {"ok":reason==null,"reason":reason}

static func threat(state: Dictionary,team: int,city: Dictionary) -> bool:
 for landmark in state.get("landmarks",[]):
  if landmark.get("kind")=="village" and not landmark.get("destroyedV276",false) and landmark.get("raiderV280",true)!=false and Discovery.village_type(landmark)=="raiders" and absi(int(landmark.c)-int(city.c))+absi(int(landmark.r)-int(city.r))<=26:return true
 for army in state.get("armies",[]):
  if int(army.team)==team or army.get("hiddenInBandV274",false) or absi(int(army.c)-int(city.c))+absi(int(army.r)-int(city.r))>10:continue
  for unit in state.get("units",[]):
   if int(unit.team)==int(army.team) and float(unit.get("hp",0))>0 and unit.kind!="scout":return true
 return float(state.get("peaceUntilV276",0))<=float(state.get("time",0)) and float(city.economy.realms[team].pop)>=12

static func footprint(slot: Dictionary) -> Dictionary:
 var part:Dictionary=slot.duplicate();part.hp=350
 if part.type=="woodgate" and part.get("extendedPalisadeV166",false):part.navWidth=7.2;part.navDepth=1.1
 return Local.clearance(part)

static func deposit_blocked(slot:Dictionary,world:Dictionary)->bool:
 var bounds:=footprint(slot)
 for resource in world.get("resources",[]):
  if resource.get("removed",false) or resource.get("kind","") in ["tree","berry","game","fish"]:continue
  if absf(float(resource.x)-float(slot.x))<float(bounds.rx)+4 and absf(float(resource.z)-float(slot.z))<float(bounds.rz)+4:return true
 return false

# The original footprint test reserves the entire planned wall corridor.
static func crosses(slot: Dictionary,building: Dictionary,pad:=1.0) -> bool:
 var type:=str(slot.get("type",""));var axis:=bool(slot.get("wallAxis",false));var rect:Dictionary={}
 if type in ["palisade","stonewall","reinforced_wall"] and slot.has("wallAngleV175") and slot.wallAngleV175!=null:rect=Local.wall_footprint(slot,0.0)
 elif type=="palisade":
  var half:=float(slot.get("palisadeSpanV167",14 if slot.get("extendedPalisadeV166",false) else 7))/2.0;rect={"rx":1.5 if axis else half,"rz":half if axis else 1.5}
 elif type in ["stonewall","reinforced_wall"]:rect={"rx":1.5 if axis else 3.5,"rz":3.5 if axis else 1.5}
 elif type=="woodgate":
  var half:=7.2 if slot.get("extendedPalisadeV166",false) else 3.6;rect={"rx":1.5 if axis else half,"rz":half if axis else 1.5}
 elif type=="gatehouse":rect={"rx":5.1 if axis else 5.4,"rz":5.4 if axis else 5.1}
 elif type=="stonetower":rect={"rx":5.2,"rz":5.0}
 elif type=="watchtower":rect={"rx":3.0,"rz":3.0}
 else:return false
 var kind:=str(building.get("type",""));var other:Dictionary={"rx":5.0,"rz":5.0}
 if kind=="field":other={"rx":float(building.get("width",48))/2,"rz":float(building.get("depth",32))/2}
 elif kind=="market":other={"rx":11.0,"rz":10.2}
 elif kind=="hall":other={"rx":5.6,"rz":5.0}
 elif kind=="house":other={"rx":4.0,"rz":3.6}
 elif kind=="well":other={"rx":3.2,"rz":3.2}
 var dx:=float(building.x)-float(slot.x);var dz:=float(building.z)-float(slot.z)
 if absf(dx)>=float(rect.rx)+float(other.rx)+pad or absf(dz)>=float(rect.rz)+float(other.rz)+pad:return false
 if slot.has("wallAngleV175") and slot.wallAngleV175!=null and type in ["palisade","stonewall","reinforced_wall"]:
  var c:=cos(float(slot.wallAngleV175));var sn:=sin(float(slot.wallAngleV175));var half:=float(slot.get("palisadeSpanV167",7))/2
  var thin:=2.35 if type=="palisade" and int(slot.get("woodFortTierV1757",0))==2 else 1.1
  return absf(dx*c-dz*sn)<half+absf(c)*float(other.rx)+absf(sn)*float(other.rz)+pad and absf(dx*sn+dz*c)<thin+absf(sn)*float(other.rx)+absf(c)*float(other.rz)+pad
 return true

static func crosses_ring(building: Dictionary,plan: Variant,pad:=1.0,field:=false) -> bool:
 if not plan is Dictionary:return false
 var checked:Dictionary=building.duplicate()
 if field:checked.type="field"
 for slot in plan.get("slots",[]):
  if crosses(slot,checked,pad):return true
  if field and absf(float(slot.x)-float(building.x))<float(building.get("width",48))/2+6 and absf(float(slot.z)-float(building.z))<float(building.get("depth",32))/2+6:return true
 return false

static func field_score(point: Vector2,farm: Vector2,fields: Array,global_point: Vector2) -> float:
 var cluster:=0.0
 if not fields.is_empty():
  cluster=INF
  for field in fields:cluster=minf(cluster,point.distance_to(Vector2(field.x,field.z)))
 return point.distance_to(farm)+maxf(0,74-global_point.length())*4+minf(80,cluster)*0.55

static func terrain_open(nav: LocalNavigation,x: float,z: float) -> bool:
 var index:=nav.index(x,z)
 return index>=0 and nav.base[index]!=0

static func blocked(slot: Dictionary,buildings: Array,nav: LocalNavigation,terrain: Callable=Callable()) -> bool:
 var extent:Dictionary=footprint(slot)
 for b in buildings:
  if b.get("virtual",false) or b.get("type","") in FORTS or float(b.get("hp",0))<=0:continue
  if crosses(slot,b,1.2):return true
 var span:float=slot.get("palisadeSpanV167",14 if slot.type=="woodgate" else 6);var count:=maxi(1,ceili(span/3.5))
 var angle:=float(slot.get("wallAngleV175",PI/2 if slot.get("wallAxis",false) else 0))
 for i in range(count+1):
  var d:float=(float(i)/count-0.5)*span;var x:float=float(slot.x)+cos(angle)*d;var z:float=float(slot.z)-sin(angle)*d
  if not (terrain.call(x,z) if terrain.is_valid() else terrain_open(nav,x,z)):return true
 return false

# Source fallback surveys the rectangular corridor against real terrain and
# existing structures when a terrain-following plan cannot be placed.
static func survey(city: Dictionary,seed: int,nav: LocalNavigation) -> Dictionary:
 var buildings:Array=city.economy.buildings;var best:Dictionary={};var best_score:=-INF;var visited:Dictionary={}
 var hall:Dictionary={"x":0,"z":0};var homes:Array=[]
 for building in buildings:
  if building.type=="hall" and float(building.get("hp",0))>0:hall=building;break
 for building in buildings:
  if building.type=="house" and float(building.get("hp",0))>0:homes.append(building)
 homes.sort_custom(func(a,b):return Vector2(a.x,a.z).distance_squared_to(Vector2(hall.x,hall.z))<Vector2(b.x,b.z).distance_squared_to(Vector2(hall.x,hall.z)))
 homes=homes.slice(0,maxi(1,ceili(homes.size()*0.9)))
 for ex in [0,14,28]:
  for ez in [0,14,28]:
   for dx in [0,-7,7,-14,14]:
    for dz in [0,-7,7,-14,14]:
     var candidate:=wall_plan(buildings,seed,{"extraX":ex,"extraZ":ez,"dx":dx,"dz":dz})
     var key:="%s:%s:%s:%s" % [candidate.rx,candidate.rz,candidate.slots[0].x,candidate.slots[0].z]
     if visited.has(key):continue
     visited[key]=true;var core_fits:=true
     for home in homes:
      if absf(float(home.x)-float(hall.x)-dx)>float(candidate.rx)-9 or absf(float(home.z)-float(hall.z)-dz)>float(candidate.rz)-9:core_fits=false;break
     if not core_fits:continue
     var viable:=0;var failed:=0
     for slot in candidate.slots:
      if blocked(slot,buildings,nav):failed+=1
      else:viable+=1
     var score:float=viable*4-failed*100-candidate.slots.size()*1.3-(candidate.rx+candidate.rz)*0.1-(absi(dx)+absi(dz))*0.03
     if score>best_score:best_score=score;best=candidate;best.initialViable=viable;best.initialBlocked=failed
 if best.is_empty():best=wall_plan(buildings,seed)
 best.terrainSurveyV176=true;best.verifiedAtTechV167=true
 return best

# A funded first curtain can delay the Bronze advance, but never forever.
static func age_gate(city: Dictionary,age: int,time: float,limit:=6600.0) -> bool:
 var plan:Variant=city.get("stoneDefensePlanV166")
 if plan is Dictionary and plan.get("closedRingV177",false):limit=maxf(limit,9000.0)
 if age!=0 or time>=limit or not plan is Dictionary or plan.get("slots",[]).is_empty():return false
 var local:=[]
 for ctx in District.contexts(city):
  for building in ctx.economy.buildings:
   if float(building.get("hp",0))<=0 or building.get("virtual",false):continue
   var shifted:Dictionary=building.duplicate();shifted.x=float(building.x)+(int(ctx.c)-int(city.c))*225.0;shifted.z=float(building.z)+(int(ctx.r)-int(city.r))*195.0;local.append(shifted)
 var ready:=0
 for slot in plan.slots:
  for building in local:
   if building.type==slot.type and building.get("ready",false) and not building.get("disabled",false) and Vector2(building.x,building.z).distance_to(Vector2(slot.x,slot.z))<(1.0 if slot.get("drawnWallV175",false) else 4.5):ready+=1;break
 return ready<plan.slots.size()

# Paid upgrade of the original timber curtain, using the shared city stock
# and up to the original three concurrent builder crews.
static func upgrade_old_walls(state: Dictionary,city: Dictionary,rule: Callable) -> bool:
 var team:=int(city.team);var research:Array=state.get("research",[])
 if int(state.ages[team])<1 or team>=research.size() or "stone_fortifications" not in research[team].get("known",[]):return false
 var candidates:=[];var active:=0;var waiting:=0
 for ctx in District.contexts(city):
  for building in ctx.economy.buildings:
   if building.get("virtual",false) or float(building.get("hp",0))<=0:continue
   if building.get("wallUpgradeV184") is Dictionary:active+=1
   if not building.get("ready",false):waiting+=1
   if building.get("ready",false) and not building.get("outerRingV184",false) and building.type in ["palisade","woodgate","watchtower"]:candidates.append({"ctx":ctx,"building":building})
 if candidates.is_empty():return false
 var concurrent:=mini(3,maxi(1,ceili(float(city.get("builderCount",1)))))
 if active>=concurrent or waiting>4:return true
 var stock:Dictionary=city.economy.realms[team].resources;var ordered:=0
 for item in candidates:
  if active>=concurrent:break
  if item.building.get("wallUpgradeV184") is Dictionary:continue
  var ctx:Dictionary=item.ctx
  var check=func(type):return rule.call(ctx,type)
  var plan:=Operations.wall_upgrade_plan(state,ctx,item.building,"stone",check)
  if plan.has("error"):continue
  var cost:Dictionary=plan.cost
  if not Econ.can_afford(stock,cost) or float(stock.get("wood",0))-float(cost.get("wood",0))<12 or float(stock.get("stone",0))-float(cost.get("stone",0))<18 or (float(cost.get("plank",0))>0 and float(stock.get("plank",0))-float(cost.get("plank",0))<8):
   city.aiDefenseDiagnosticV184={"reason":"saving-for-old-wall-upgrade","type":item.building.type,"active":active,"at":state.time};return true
  var result:=Operations.upgrade_wall(state,ctx,item.building,"stone",check)
  if result.has("upgrade"):ordered+=1;active+=1
 if ordered>0 or active>0:
  city.aiDefenseDiagnosticV184={"reason":"upgrading-old-wall","active":active,"ordered":ordered,"at":state.time};return true
 city.aiDefenseDiagnosticV184={"reason":"old-wall-upgrade-site-error","at":state.time};return false

static func update_builders(state: Dictionary,city: Dictionary) -> void:
 var team:=int(city.team);var pop:=float(city.economy.realms[team].pop);var age:=int(state.ages[team])
 var research:Array=state.get("research",[]);var known:Array=research[team].get("known",[]) if team<research.size() else []
 var builder_nation:=posmod(int(state.get("seed",0))+team*7,3)==1
 if (age==0 and pop>=7 and "fortifications" in known) or (age>=1 and pop>=18) or (builder_nation and pop>=6):city.builderCount=maxf(2,float(city.get("builderCount",1)))

static func tick(state: Dictionary,city: Dictionary,runtime: Dictionary,rule: Callable,natural_plan: Callable=Callable(),context_for: Callable=Callable(),runtime_for: Callable=Callable(),context_rule: Callable=Callable(),global_terrain: Callable=Callable()) -> void:
 var team:=int(city.team);var age:=int(state.ages[team])
 if age!=0:return
 var existing:Variant=city.get("stoneDefensePlanV166")
 if not existing is Dictionary and not threat(state,team,city):return
 if float(state.time)<float(city.get("nextStoneDefenseCheckV166",0)):return
 city.nextStoneDefenseCheckV166=float(state.time)+9
 var all:=District.all_buildings(city);var realm:Dictionary=city.economy.realms[team];var stock:Dictionary=realm.resources
 var houses:=0;var services:=0;var waiting:=0;var defenses_pending:=0
 for b in all:
  if float(b.get("hp",0))<=0:continue
  if not b.get("ready",false):
   waiting+=1
   if b.type in FORTS:defenses_pending+=1
  elif b.type=="house":houses+=1
  elif b.type in ["study","well","market","warehouse","cellar"]:services+=1
 var check:=eligibility(age,maxf(float(realm.pop),5 if existing is Dictionary else 0),houses,services,waiting,stock)
 if not check.ok:city.aiStoneDefenseStatusV166={"reason":check.reason,"at":state.time};return
 if not str(rule.call("woodgate")).is_empty():city.aiStoneDefenseStatusV166={"reason":"wooden-gate-research-or-lumber","at":state.time};return
 if defenses_pending>=2:city.aiStoneDefenseStatusV166={"reason":"construction-in-progress","at":state.time};return
 var nav:LocalNavigation=runtime.nav
 if not existing is Dictionary or existing.get("slots",[]).is_empty():
  var reserved:Variant=city.get("stoneDefenseReserveV168");var clear:=true
  if reserved is Dictionary and int(reserved.get("version",0))>=177 and not reserved.get("slots",[]).is_empty():
   for slot in reserved.slots:
    for ctx in District.contexts(city):
     for b in ctx.economy.buildings:
      if float(b.get("hp",0))<=0 or b.get("virtual",false) or b.type in FORTS:continue
      var shifted:Dictionary=b.duplicate();shifted.x=float(b.x)+(int(ctx.c)-int(city.c))*225.0;shifted.z=float(b.z)+(int(ctx.r)-int(city.r))*195.0
      if crosses(slot,shifted,1.2):clear=false;break
     if not clear:break
    if not clear:break
   if clear:existing=reserved.duplicate(true);existing.verifiedAtTechV167=true;existing.nextIndex=0;existing.constructed=0
  if not existing is Dictionary:existing=natural_plan.call() if natural_plan.is_valid() else null
  if not existing is Dictionary:existing=survey(city,int(state.seed)+int(city.id)*19,nav)
  city.stoneDefensePlanV166=existing
 for original_slot in existing.slots:
  var dc:=floori((float(original_slot.x)+112.5)/225.0);var dr:=floori((float(original_slot.z)+97.5)/195.0)
  var ctx:Variant=city if dc==0 and dr==0 else (context_for.call(city,Vector2i(int(city.c)+dc,int(city.r)+dr)) if context_for.is_valid() else null)
  if not ctx is Dictionary:continue
  var slot:Dictionary=original_slot.duplicate(true);slot.x=float(slot.x)-dc*225.0;slot.z=float(slot.z)-dr*195.0
  var local_runtime:Dictionary=runtime if dc==0 and dr==0 else (runtime_for.call(ctx) if runtime_for.is_valid() else {})
  if not local_runtime.has("nav"):continue
  nav=local_runtime.nav
  var placed:=false
  for b in ctx.economy.buildings:
   if b.type==slot.type and float(b.get("hp",0))>0 and Vector2(b.x,b.z).distance_to(Vector2(slot.x,slot.z))<(1.0 if slot.get("drawnWallV175",false) else 4.5):placed=true;break
  var locked:String=str(context_rule.call(ctx,slot.type)) if context_rule.is_valid() else str(rule.call(slot.type))
  var terrain:Callable=Callable()
  if global_terrain.is_valid():terrain=func(x,z):return global_terrain.call(city,x+dc*225.0,z+dr*195.0)
  if placed or not locked.is_empty() or blocked(slot,ctx.economy.buildings,nav,terrain):continue
  var bounds:Dictionary=footprint(slot);var blocked_deposit:=false
  for resource in ctx.world.get("resources",[]):
   if resource.get("removed",false) or resource.kind in ["tree","berry","game","fish"]:continue
   if absf(float(resource.x)-float(slot.x))<float(bounds.rx)+4 and absf(float(resource.z)-float(slot.z))<float(bounds.rz)+4:blocked_deposit=true;break
  if blocked_deposit:continue
  if slot.type!="woodgate" and not nav.preserves_access(slot,ctx.economy.buildings,ctx.world.get("workers",{}),ctx.economy.get("cargo",[])):continue
  var cost:Dictionary=Econ.DATA.data.buildings[slot.type].cost
  if not Econ.can_afford(stock,cost) or float(stock.get("wood",0))-float(cost.get("wood",0))<7 or float(stock.get("stone",0))-float(cost.get("stone",0))<3:continue
  var at:=Vector2(float(slot.x),float(slot.z));var passable=func(x,z,_team):return terrain.call(x,z) if terrain.is_valid() else terrain_open(nav,x,z)
  var build_economy:=District.build_economy(city,ctx)
  if slot.get("wallTowerV179",false):
   for index in build_economy.buildings.size():
    var b:Dictionary=build_economy.buildings[index]
    if b.type in ["palisade","stonewall","reinforced_wall"] and Vector2(b.x,b.z).distance_to(at)<1.0:
     var copy:Dictionary=b.duplicate();copy.virtual=true;build_economy.buildings[index]=copy
  var result:=Econ.place_building(build_economy,team,slot.type,at,passable,Callable(),true)
  if result.has("error"):continue
  var building:Dictionary=result.building
  for key in ["wallAxis","wallAngleV175","palisadeSpanV167","extendedPalisadeV166","drawnWallV175","terrainDefenseV176","wallTowerV179","cliffEmbedStartV179","cliffEmbedEndV179"]:
   if slot.has(key):building[key]=slot[key]
  if building.get("extendedPalisadeV166",false):building.navWidth=7.2;building.navDepth=1.1
  building.historicPalisadeV166=true;building.plannedDefense=true
  ctx.economy.buildings.append(building);Builder.clear_footprint(ctx.world,building);nav.rebuild(ctx.economy.buildings,ctx.world.resources)
  existing.constructed=int(existing.get("constructed",0))+1;city.aiStoneDefenseStatusV166={"reason":"built","kind":slot.type,"at":state.time};return
 city.aiStoneDefenseStatusV166={"reason":"no-site","at":state.time}

# Repair gaps in the first historic curtain with paid masonry. Keep at least
# one other gate before replacing a missing gate by a solid wall.
static func repair_old(state: Dictionary,city: Dictionary,context_for: Callable,runtime_for: Callable,rule: Callable) -> bool:
 var team:=int(city.team);var plan:Variant=city.get("stoneDefensePlanV166")
 if int(state.ages[team])<1 or not plan is Dictionary or plan.get("slots",[]).is_empty() or float(state.time)<float(city.get("nextOldWallRepairV215",0)):return false
 city.nextOldWallRepairV215=float(state.time)+24
 var live:=[];var pending:=0
 for ctx in District.contexts(city):
  for b in ctx.economy.buildings:
   if b.get("virtual",false) or float(b.get("hp",0))<=0 or b.type not in FORTS:continue
   var shifted:Dictionary=b.duplicate();shifted.x=float(b.x)+(int(ctx.c)-int(city.c))*225.0;shifted.z=float(b.z)+(int(ctx.r)-int(city.r))*195.0;live.append(shifted)
   if not b.get("ready",false):pending+=1
 if pending>=2:return false
 var stock:Dictionary=city.economy.realms[team].resources
 for old in plan.slots:
  var point:=Vector2(old.x,old.z);var exists:=false
  for b in live:
   if Vector2(b.x,b.z).distance_to(point)<(1.5 if old.get("drawnWallV175",false) else 5.0):exists=true;break
  if exists:continue
  var other_gate:=false
  for b in live:
   if b.get("ready",false) and not b.get("outerRingV184",false) and b.type in ["woodgate","gatehouse"] and Vector2(b.x,b.z).distance_to(point)>9:other_gate=true;break
  var alternatives:Array=[old.type]
  if old.type=="palisade":alternatives=["stonewall","reinforced_wall"]
  elif old.type=="woodgate":alternatives=["gatehouse","stonewall"] if other_gate else ["gatehouse"]
  elif old.type=="watchtower":alternatives=["stonetower"]
  var dc:=floori((point.x+112.5)/225.0);var dr:=floori((point.y+97.5)/195.0)
  var ctx:Variant=context_for.call(city,Vector2i(int(city.c)+dc,int(city.r)+dr))
  if not ctx is Dictionary:continue
  var nav:LocalNavigation=runtime_for.call(ctx).nav
  for type in alternatives:
   if not str(rule.call(ctx,type)).is_empty():continue
   var slot:Dictionary=old.duplicate(true);slot.type=type;slot.x=point.x-dc*225.0;slot.z=point.y-dr*195.0;slot.plannedDefense=true;slot.oldPerimeterRepairV215=true
   if blocked(slot,ctx.economy.buildings,nav):continue
   if type not in ["woodgate","gatehouse"] and not nav.preserves_access(slot,ctx.economy.buildings,ctx.world.get("workers",{}),ctx.economy.get("cargo",[])):continue
   var cost:Dictionary=Econ.DATA.data.buildings[type].cost
   if not Econ.can_afford(stock,cost) or float(stock.get("wood",0))-float(cost.get("wood",0))<12 or float(stock.get("stone",0))-float(cost.get("stone",0))<18 or (float(cost.get("plank",0))>0 and float(stock.get("plank",0))-float(cost.get("plank",0))<8):
    city.aiOldPerimeterV215={"reason":"saving","at":state.time,"type":type};return false
   var economy:=District.build_economy(city,ctx);var passable=func(x,z,_team):return terrain_open(nav,x,z)
   var result:=Econ.place_building(economy,team,type,Vector2(slot.x,slot.z),passable,Callable(),true)
   if result.has("error"):continue
   var building:Dictionary=result.building
   for key in ["wallAxis","wallAngleV175","palisadeSpanV167","extendedPalisadeV166","drawnWallV175"]:
    if slot.has(key):building[key]=slot[key]
   building.historicPerimeterV139=true;building.oldPerimeterRepairV215=true;building.plannedDefense=true
   ctx.economy.buildings.append(building);Builder.clear_footprint(ctx.world,building);nav.rebuild(ctx.economy.buildings,ctx.world.resources)
   city.aiOldPerimeterV215={"reason":"commissioned","type":type,"x":point.x,"z":point.y,"at":state.time,"gateFallback":type=="stonewall" and old.type=="woodgate"}
   return true
 city.aiOldPerimeterV215={"reason":"no-safe-gap","at":state.time}
 return false

# Founding reserves a corridor for the first Stone Age curtain. This is a
# plan only: it creates no wall and spends no material.
static func reserve(state: Dictionary,city: Dictionary,runtime: Dictionary,natural_plan: Callable=Callable(),terrain_passable: Callable=Callable()) -> Variant:
 if int(state.ages[int(city.team)])!=0:return null
 var hall:Variant=null
 for b in city.economy.buildings:
  if b.type=="hall" and float(b.get("hp",0))>0:hall=b;break
 if hall==null:return null
 var natural:Variant=natural_plan.call() if natural_plan.is_valid() else null
 if natural is Dictionary:natural.reservedV168=true;return natural
 var nav:LocalNavigation=runtime.nav;var best:Variant=null;var best_score:=-INF
 for ex in [14,0,28]:
  for ez in [14,0,28]:
   for dx in [0,-7,7]:
    for dz in [0,-7,7]:
     var candidate:=wall_plan([hall],int(state.seed)+int(city.id)*19,{"extraX":ex,"extraZ":ez,"dx":dx,"dz":dz});var bad:=0
     for slot in candidate.slots:
      var half:float=float(slot.get("palisadeSpanV167",14))/2 if slot.type=="palisade" else 7.0 if slot.type=="woodgate" else 2.0
      var count:=ceili(half/3)
      for k in range(-count,count+1):
       var step:=float(k)*half/count;var x:float=float(slot.x)+(0 if slot.wallAxis else step);var z:float=float(slot.z)+(step if slot.wallAxis else 0)
       if not (terrain_passable.call(x,z) if terrain_passable.is_valid() else nav.is_open(x,z)):bad+=1;break
     var score:float= -bad*25-absf(float(candidate.rx)-56)*0.2-absf(float(candidate.rz)-56)*0.2-(absi(dx)+absi(dz))*0.06
     if score>best_score:best_score=score;candidate.reservedV168=true;candidate.terrainBlockedAtFounding=bad;best=candidate
 return best
