class_name BattleNavigation
extends RefCounted
const Districts=preload("res://scripts/district_context.gd")
const Grid=preload("res://scripts/campaign_grid.gd")
const Terrain=preload("res://scripts/detail_terrain.gd")
const World=preload("res://scripts/detail_world.gd")
const Local=preload("res://scripts/local_navigation.gd")
const Crowd=preload("res://scripts/battle_crowd.gd")
const Doctrine=preload("res://scripts/battle_doctrine.gd")
const State=preload("res://scripts/battle_state.gd")
const SCALE:=3.0
var host: Node
var battle: Dictionary
var nav: LocalNavigation
var heights: Dictionary={}
var visuals: Dictionary={}
var rivers: Dictionary={}
var obstacles: Dictionary={}
var routes: Array=[]
var exits: Array=[]
var shared: Dictionary={}
var components:=PackedInt32Array()
var siege_revision:=""
var siege_states: Dictionary={}
var siege_obstacles: Array=[]

func _init(owner: Node,state: Dictionary) -> void:
 host=owner;battle=state
 if not host.game.has("tileWorlds"):host.game.tileWorlds={}
 for dr in range(-2,3):
  for dc in range(-2,3):prepare_tile(dc,dr)
 var f: Dictionary=State.FIELD
 var x:=ceili((float(f.outerMinX)+3)/SCALE);var z:=ceili((float(f.outerMinZ)+3)/SCALE)
 var w:=floori((float(f.outerMaxX)-float(f.outerMinX)-6)/SCALE)+1;var h:=floori((float(f.outerMaxZ)-float(f.outerMinZ)-6)/SCALE)+1
 nav=Local.new(x,z,w,h,func(a,b):return passable(a*SCALE,b*SCALE))
 keep_largest_component(battle.get("siegeSections",[]).is_empty())
 siege_revision=siege_signature();siege_states=current_siege_states()

func prepare_tile(dc: int,dr: int) -> void:
 var c:=int(battle.cell.c)+dc;var r:=int(battle.cell.r)+dr
 if c<0 or c>=Grid.COLS or r<0 or r>=Grid.ROWS:return
 var index:=r*Grid.COLS+c;var cell: Dictionary=host.grid[index];var key:=str(dc)+":"+str(dr)
 heights[key]=Terrain.tile_heights(host.grid,c,r)
 visuals[key]=host.detail_visual_for(c,r)
 rivers[key]=host.river_navigation_for(c,r,heights[key])
 if not cell.land:return
 var city: Variant=Districts.at_city(host.game.cities,Vector2i(c,r))
 var world: Dictionary={}
 if city!=null:world=city.world
 else:
  var world_key:=str(c)+":"+str(r)
  if not host.game.tileWorlds.has(world_key):host.game.tileWorlds[world_key]=World.create(host.grid,host.city_cell_data({"c":c,"r":r}),host.visual_biome(index),int(host.game.seed))
  world=host.game.tileWorlds[world_key]
 for resource in world.get("resources",[]):
  if resource.get("removed",false) or float(resource.get("amount",0))<=0 or resource.kind in ["game","fish"]:continue
  var size:=1.4 if resource.kind=="tree" else 0.8 if resource.kind=="berry" else 3.0
  add_obstacle({"x":float(resource.x)+dc*225,"z":float(resource.z)+dr*195},size,size)
 if city!=null:
  for building_index in city.economy.buildings.size():
   var building: Dictionary=city.economy.buildings[building_index]
   if building.get("virtual",false) or float(building.get("hp",0))<=0:continue
   if building.type=="woodgate":
    var wide:=bool(building.get("extendedPalisadeV166",false));var offset_post:=5.2 if wide else 2.55;var post:=1.6 if wide else 2.2;var axis:=bool(building.get("wallAxis",false))
    for side in [-1,1]:add_obstacle({"x":float(building.x)+dc*225+(0 if axis else side*offset_post),"z":float(building.z)+dr*195+(side*offset_post if axis else 0)},0.95 if axis else post,post if axis else 0.95)
    continue
   var clearance: Variant=Local.clearance(building)
   if clearance!=null:
    var item: Dictionary={"x":float(building.x)+dc*225,"z":float(building.z)+dr*195}
    if dc==0 and dr==0:
     for section in battle.get("siegeSections",[]):
      if int(section.index)==building_index:item.siegeIndex=building_index;break
    add_obstacle(item,clearance.rx,clearance.rz)

func add_obstacle(item: Dictionary,rx: float,rz: float) -> void:
 item.rx=rx+SCALE/2;item.rz=rz+SCALE/2
 if item.has("siegeIndex"):siege_obstacles.append(item)
 for z in range(floori((float(item.z)-float(item.rz))/16),floori((float(item.z)+float(item.rz))/16)+1):
  for x in range(floori((float(item.x)-float(item.rx))/16),floori((float(item.x)+float(item.rx))/16)+1):
   var key:=str(x)+":"+str(z)
   if not obstacles.has(key):obstacles[key]=[]
   obstacles[key].append(item)

func height_at(x: float,z: float) -> float:
 var dc:=floori((x+112.5)/225);var dr:=floori((z+97.5)/195);var key:=str(dc)+":"+str(dr)
 if not heights.has(key):return -1
 return Terrain.detail_height(heights[key],x-dc*225,z-dr*195)

func passable(x: float,z: float) -> bool:
 var dc:=floori((x+112.5)/225);var dr:=floori((z+97.5)/195);var c:=int(battle.cell.c)+dc;var r:=int(battle.cell.r)+dr
 if c<0 or c>=Grid.COLS or r<0 or r>=Grid.ROWS:return false
 var cell: Dictionary=host.grid[r*Grid.COLS+c]
 if cell.mountain or height_at(x,z)<=0.2:return false
 var visual: PackedVector4Array=visuals.get(str(dc)+":"+str(dr),PackedVector4Array())
 if visual.size()==17*17 and Terrain.visual_sample(visual,x-dc*225,z-dr*195).z<=0.05:return false
 var river: Variant=rivers.get(str(dc)+":"+str(dr))
 if river!=null and not river.passable(x-dc*225,z-dr*195):return false
 for item in obstacles.get(str(floori(x/16))+":"+str(floori(z/16)),[]):
  if item.has("siegeIndex"):
   var broken:=false
   for section in battle.get("siegeSections",[]):
    if int(section.index)==int(item.siegeIndex) and (float(section.hp)<=0 or section.get("breached",false)):broken=true;break
   if broken:continue
  if absf(x-float(item.x))<=float(item.rx) and absf(z-float(item.z))<=float(item.rz):return false
 return true

func siege_signature() -> String:
 var value:=""
 for section in battle.get("siegeSections",[]):value+=str(section.index)+":"+str(float(section.hp)<=0 or section.get("breached",false))+";"
 return value

func current_siege_states() -> Dictionary:
 var result: Dictionary={}
 for section in battle.get("siegeSections",[]):result[int(section.index)]=float(section.hp)<=0 or section.get("breached",false)
 return result

# Only changed wall footprints need terrain checks; relabel the connected areas
# and discard routes after a breach changes access.
func refresh_siege_access() -> void:
 var signature:=siege_signature()
 if signature==siege_revision:return
 siege_revision=signature
 var current:=current_siege_states()
 for item in siege_obstacles:
  var index:=int(item.siegeIndex)
  if current.get(index)==siege_states.get(index):continue
  var min_x:=maxi(0,floori((float(item.x)-float(item.rx))/SCALE)-nav.min_x-1)
  var max_x:=mini(nav.width-1,ceili((float(item.x)+float(item.rx))/SCALE)-nav.min_x+1)
  var min_z:=maxi(0,floori((float(item.z)-float(item.rz))/SCALE)-nav.min_z-1)
  var max_z:=mini(nav.height-1,ceili((float(item.z)+float(item.rz))/SCALE)-nav.min_z+1)
  for j in range(min_z,max_z+1):
   for i in range(min_x,max_x+1):nav.mask[j*nav.width+i]=1 if passable((i+nav.min_x)*SCALE,(j+nav.min_z)*SCALE) else 0
 siege_states=current
 nav.base=nav.mask.duplicate();keep_largest_component(false);routes.clear();shared.clear();exits.clear()

func keep_largest_component(only_largest:=true) -> void:
 components.resize(nav.mask.size());components.fill(0)
 var sizes: Array=[0];var queue:=PackedInt32Array();var count:=0
 for start in nav.mask.size():
  if nav.mask[start]==0 or components[start]!=0:continue
  count+=1;var size:=0;queue.clear();queue.append(start);components[start]=count;var head:=0
  while head<queue.size():
   var i:=queue[head];head+=1;size+=1;var x:=i%nav.width;var z:=floori(float(i)/nav.width)
   for d in [Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1)]:
    var xx: int=x+d.x;var zz: int=z+d.y
    if xx<0 or xx>=nav.width or zz<0 or zz>=nav.height:continue
    var other: int=zz*nav.width+xx
    if nav.mask[other]==1 and components[other]==0:components[other]=count;queue.append(other)
  sizes.append(size)
 var largest:=0
 for i in range(1,sizes.size()):
  if largest==0 or sizes[i]>sizes[largest]:largest=i
 if only_largest:
  for i in nav.mask.size():
   if components[i]!=largest:nav.mask[i]=0;nav.base[i]=0

func is_open(x: float,z: float) -> bool:
 return nav.is_open(x/SCALE,z/SCALE)

func nearest(point: Dictionary,maximum:=9) -> Variant:
 var found: Variant=nav.nearest({"x":float(point.x)/SCALE,"z":float(point.z)/SCALE},ceili(float(maximum)/SCALE))
 return {"x":float(found.x)*SCALE,"z":float(found.z)*SCALE} if found!=null else null

func reachable(a: Dictionary,b: Dictionary) -> bool:
 var first: Variant=nearest(a);var last: Variant=nearest(b)
 if first==null or last==null:return false
 var ia:=nav.index(float(first.x)/SCALE,float(first.z)/SCALE);var ib:=nav.index(float(last.x)/SCALE,float(last.z)/SCALE)
 return ia>=0 and ib>=0 and nav.mask[ia]==1 and nav.mask[ib]==1 and components[ia]==components[ib]

func route(a: Dictionary,b: Dictionary) -> Variant:
 var raw: Variant=nav.route({"x":float(a.x)/SCALE,"z":float(a.z)/SCALE},{"x":float(b.x)/SCALE,"z":float(b.z)/SCALE},false)
 if raw==null:return null
 var result: Array=[]
 for p in raw:result.append({"x":float(p.x)*SCALE,"z":float(p.z)*SCALE})
 return result

func memo_index(agent: Dictionary) -> int:
 for i in routes.size():
  if is_same(routes[i].agent,agent):return i
 return -1

func waypoint(agent: Dictionary,target: Dictionary,time:=0.0) -> Dictionary:
 var goal: Variant=target if is_open(target.x,target.z) else nearest(target,18)
 if goal==null:return agent
 var open=func(x,z):return is_open(x,z)
 var index:=memo_index(agent)
 if Crowd.distance(agent,goal)<15 and Crowd.line_clear(agent,goal,open,SCALE):
  if index>=0:routes.remove_at(index)
  return goal
 var memo: Variant=routes[index] if index>=0 else null
 if memo!=null and not memo.path.is_empty() and not Crowd.line_clear(agent,memo.path[0],open,SCALE):memo=null
 if memo==null or (time-float(memo.at)>1.5 and (Crowd.distance(memo.goal,goal)>5 or memo.path.is_empty())):
  var key: String="%d:%d:%d:%d" % [floori(float(agent.x)/3+0.5),floori(float(agent.z)/3+0.5),floori(float(goal.x)/3+0.5),floori(float(goal.z)/3+0.5)]
  var path: Variant=shared.get(key)
  if path==null:
   path=route(agent,goal)
   if path==null:path=[]
   if shared.size()>2048:shared.clear()
   shared[key]=path
  memo={"agent":agent,"goal":goal.duplicate(),"at":time,"path":path.duplicate(true)}
  if index>=0:routes[index]=memo
  else:routes.append(memo)
 while not memo.path.is_empty() and Crowd.distance(agent,memo.path[0])<0.25:memo.path.pop_front()
 for i in range(mini(4,memo.path.size()-1),0,-1):
  if Crowd.line_clear(agent,memo.path[i],open,SCALE):
   for unused in i:memo.path.pop_front()
   break
 return memo.path[0] if not memo.path.is_empty() else agent

func escape_goal(agent: Dictionary,side: float,threat: Variant=null) -> Dictionary:
 for entry in exits:
  if is_same(entry.agent,agent):return entry.goal
 var f: Dictionary=State.FIELD;var candidates: Array=[]
 var z: float=float(f.minZ)+6
 while z<float(f.maxZ):
  for x in [float(f.minX)-6,float(f.maxX)+6]:candidates.append({"x":x,"z":z})
  z+=12
 var x: float=float(f.minX)+6
 while x<float(f.maxX):
  for value in [float(f.minZ)-6,float(f.maxZ)+6]:candidates.append({"x":x,"z":value})
  x+=12
 candidates.sort_custom(func(a,b):return Doctrine.exit_score(agent,a,side,threat)<Doctrine.exit_score(agent,b,side,threat))
 for point in candidates:
  var goal: Variant=nearest(point,6)
  if goal!=null and State.outside(goal) and reachable(agent,goal):exits.append({"agent":agent,"goal":goal});return goal
 return {"x":-side*(float(f.maxX)+12),"z":agent.z}

func move(agent: Dictionary,target: Dictionary,dt: float,speed: float,time: float) -> bool:
 agent.moving=false
 if target.is_empty() or dt<=0:return false
 var goal:=waypoint(agent,target,time);var dx:=float(goal.x)-float(agent.x);var dz:=float(goal.z)-float(agent.z);var d:=sqrt(dx*dx+dz*dz);var step:=minf(d,speed*dt)
 if d>0.01 and step>0:
  var x:=float(agent.x)+dx/d*step;var z:=float(agent.z)+dz/d*step
  if is_open(x,z):agent.x=x;agent.z=z;agent.moving=true
 return Crowd.distance(agent,target)<0.3
