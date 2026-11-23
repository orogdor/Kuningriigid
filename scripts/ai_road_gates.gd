extends RefCounted
const District=preload("res://scripts/district_context.gd")
const Economy=preload("res://scripts/economy_rules.gd")
const Roads=preload("res://scripts/world_roads.gd")
const Grid=preload("res://scripts/campaign_grid.gd")
const Builder=preload("res://scripts/builder_sim.gd")

# roadCrossesWallV177: strong traffic must span or approach the wall.
static func road_crosses(wall: Dictionary,roads: Array) -> bool:
 var angle:=float(wall.get("wallAngleV175",PI/2 if wall.get("wallAxis",false) else 0));var c:=cos(angle);var s:=sin(angle)
 var left:=false;var right:=false;var near_left:=false;var near_right:=false;var far_left:=false;var far_right:=false
 for p in roads:
  if float(p.strength)<13:continue
  var dx:=float(p.x)-float(wall.x);var dz:=float(p.z)-float(wall.z);var along:=dx*c-dz*s;var across:=dx*s+dz*c
  if absf(along)>3.5 or absf(across)<2.5 or absf(across)>11:continue
  if across<0:left=true;near_left=near_left or absf(across)<=5;far_left=far_left or absf(across)>=7
  else:right=true;near_right=near_right or across<=5;far_right=far_right or across>=7
 return (left and right) or (near_left and far_left) or (near_right and far_right)

static func traffic(state: Dictionary,city: Dictionary,runtime_for: Callable) -> Array:
 var result:=[];var contexts:=District.contexts(city)
 for ctx in contexts:
  var nav:LocalNavigation=runtime_for.call(ctx).nav;nav.trail_time=float(state.time)
  for key in nav.heat:
   var idx:=int(key)
   if idx<0 or idx>=nav.mask.size():continue
   var strength:=nav.road_strength(idx)
   if strength<4:continue
   var p:=nav.point(idx)
   result.append({"x":float(p.x)+(int(ctx.c)-int(city.c))*225.0,"z":float(p.z)+(int(ctx.r)-int(city.r))*195.0,"strength":strength})
 var center:=Grid.center(int(city.c),int(city.r))
 for edge in Roads.visual_network(state,{},true):
  var nearby:=false
  for ctx in contexts:
   for endpoint in [edge.a,edge.b]:
    if absi(endpoint.x-int(ctx.c))<=1 and absi(endpoint.y-int(ctx.r))<=1:nearby=true;break
   if nearby:break
  if not nearby:continue
  for i in range(1,edge.points.size()):
   var a:Vector2=edge.points[i-1];var b:Vector2=edge.points[i];var aa:=(a-center)*Vector2(4.5,3.9);var bb:=(b-center)*Vector2(4.5,3.9)
   var n:=maxi(1,ceili(aa.distance_to(bb)/2.0))
   for j in range(n+1):
    var p:=aa.lerp(bb,float(j)/n);result.append({"x":p.x,"z":p.y,"strength":maxi(13,int(edge.level)*25),"worldRoad":true})
 return result

static func tick(state: Dictionary,city: Dictionary,runtime_for: Callable,rule: Callable) -> bool:
 if float(state.time)<float(city.get("nextRoadGateV177",0)):return false
 city.nextRoadGateV177=float(state.time)+24
 var contexts:=District.contexts(city);var has_wall:=false
 for ctx in contexts:
  for b in ctx.economy.buildings:
   if b.type in ["palisade","stonewall","reinforced_wall"] and b.get("ready",false) and float(b.get("hp",0))>0:has_wall=true;break
  if has_wall:break
 if not has_wall:return false
 var roads:=traffic(state,city,runtime_for)
 if roads.is_empty():return false
 var gates:=[]
 for ctx in contexts:
  for b in ctx.economy.buildings:
   if b.type in ["woodgate","gatehouse"] and float(b.get("hp",0))>0:gates.append(Vector2(float(b.x)+(int(ctx.c)-int(city.c))*225.0,float(b.z)+(int(ctx.r)-int(city.r))*195.0))
 for ctx in contexts:
  var nav:LocalNavigation=runtime_for.call(ctx).nav
  for wall in ctx.economy.buildings:
   if wall.type not in ["palisade","stonewall","reinforced_wall"] or not wall.get("ready",false) or float(wall.get("hp",0))<=0:continue
   var shifted:Dictionary=wall.duplicate();shifted.x=float(wall.x)+(int(ctx.c)-int(city.c))*225.0;shifted.z=float(wall.z)+(int(ctx.r)-int(city.r))*195.0
   if not road_crosses(shifted,roads):continue
   var close:=false
   for gate in gates:
    if gate.distance_to(Vector2(shifted.x,shifted.z))<22:close=true;break
   if close:continue
   var guarded:=false
   for unit in state.get("units",[]):
    var g:Variant=unit.get("garrison")
    if g is Dictionary and int(g.get("c",-1))==int(ctx.c) and int(g.get("r",-1))==int(ctx.r) and Vector2(float(g.get("x",INF)),float(g.get("z",INF))).distance_to(Vector2(wall.x,wall.z))<0.1:guarded=true;break
   if guarded:continue
   var type:="woodgate" if wall.type=="palisade" else "gatehouse"
   if not str(rule.call(ctx,type)).is_empty():continue
   var stock:Dictionary=city.economy.realms[int(city.team)].resources;var cost:Dictionary=Economy.DATA.data.buildings[type].cost
   if not Economy.can_afford(stock,cost) or float(stock.get("wood",0))<float(cost.get("wood",0))+7:continue
   var hp:float=wall.hp;wall.hp=0
   var economy:=District.build_economy(city,ctx);var passable=func(x,z,_team):var index:=nav.index(x,z);return index>=0 and nav.base[index]!=0
   var result:=Economy.place_building(economy,int(city.team),type,Vector2(wall.x,wall.z),passable,Callable(),true)
   if result.has("error"):wall.hp=hp;continue
   var building:Dictionary=result.building;building.wallAxis=wall.get("wallAxis",false);building.wallAngleV175=wall.get("wallAngleV175",PI/2 if building.wallAxis else 0);building.historicPalisadeV166=true;building.plannedDefense=true
   ctx.economy.buildings.append(building);wall.disabled=true;wall.replacedByRoadGateV177=true
   var slot:Dictionary={"type":type,"x":shifted.x,"z":shifted.z,"wallAxis":building.wallAxis,"wallAngleV175":building.wallAngleV175,"plannedDefense":true}
   for key in ["stoneDefensePlanV166","defensePlanV139"]:
    var plan:Variant=city.get(key)
    if not plan is Dictionary:continue
    for i in plan.get("slots",[]).size():
     var old:Dictionary=plan.slots[i]
     if old.type==wall.type and Vector2(old.x,old.z).distance_to(Vector2(shifted.x,shifted.z))<1:
      plan.slots[i]=slot
      if not plan.has("gates"):plan.gates=[]
      plan.gates.append(slot);plan.gateOpenings=plan.gates.size();break
   city.aiRoadGateV177={"at":state.time,"x":slot.x,"z":slot.z,"type":type}
   Builder.clear_footprint(ctx.world,building);nav.rebuild(ctx.economy.buildings,ctx.world.resources)
   return true
 return false
