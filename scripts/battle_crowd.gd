class_name BattleCrowd
extends RefCounted
var routes: Array=[]

static func distance(a: Dictionary,b: Dictionary) -> float:
 var x:=float(a.x)-float(b.x);var z:=float(a.z)-float(b.z);return sqrt(x*x+z*z)

static func line_clear(a: Dictionary,b: Dictionary,open: Callable,cell_size:=1.0) -> bool:
 if not open.call(a.x,a.z) or not open.call(b.x,b.z):return false
 var cuts: Array=[0.0,1.0]
 for axis in ["x","z"]:
  var delta:=float(b[axis])-float(a[axis])
  if delta==0:continue
  var low:=minf(float(a[axis]),float(b[axis]));var high:=maxf(float(a[axis]),float(b[axis]));var n: float=floor(low/cell_size+0.5)+0.5
  while n*cell_size<high:cuts.append((n*cell_size-float(a[axis]))/delta);n+=1.0
 cuts.sort()
 for i in range(1,cuts.size()):
  var t: float=(cuts[i-1]+cuts[i])/2.0
  if not open.call(float(a.x)+(float(b.x)-float(a.x))*t,float(a.z)+(float(b.z)-float(a.z))*t):return false
 return true

func find_route(agent: Dictionary) -> int:
 for i in routes.size():
  if is_same(routes[i].agent,agent):return i
 return -1

func forget(agent: Dictionary) -> void:
 var index:=find_route(agent)
 if index>=0:routes.remove_at(index)

func clear(a: Dictionary,b: Dictionary,peers: Array,own: float,open: Callable,radius_of: Callable,cell_size: float) -> bool:
 var dx:=float(b.x)-float(a.x);var dz:=float(b.z)-float(a.z);var len2:=dx*dx+dz*dz
 for p in peers:
  var radius:=own+float(radius_of.call(p))+0.04;var px:=float(a.x)-float(p.x);var pz:=float(a.z)-float(p.z);var dot:=px*dx+pz*dz
  if px*px+pz*pz<radius*radius:
   if dot< -0.00001:return false
   continue
  var t:=clampf(-dot/len2,0,1) if len2!=0 else 0.0
  if pow(px+dx*t,2)+pow(pz+dz*t,2)<radius*radius:return false
 return line_clear(a,b,open,cell_size)

func waypoint(agent: Dictionary,goal: Dictionary,others: Array,open: Callable,radius_of: Callable,dt:=0.05,cell_size:=1.0,tolerance:=0.0) -> Dictionary:
 var own:=float(radius_of.call(agent));var peers: Array=[]
 for p in others:
  if not is_same(p,agent):peers.append(p)
 var index:=find_route(agent);var memo: Variant=routes[index] if index>=0 else null
 if memo!=null and distance(memo.goal,goal)>2:routes.remove_at(index);memo=null
 if memo!=null:
  memo.age=float(memo.age)+dt
  while not memo.path.is_empty() and distance(agent,memo.path[0])<0.2:memo.path.pop_front()
  if not memo.path.is_empty() and float(memo.age)<2:return memo.path[0]
  if memo.path.is_empty() and float(memo.age)<0.4:return goal
 if clear(agent,goal,peers,own,open,radius_of,cell_size):forget(agent);return goal
 for p in peers:
  if distance(p,goal)<own+float(radius_of.call(p))+0.04:
   forget(agent);routes.append({"agent":agent,"goal":goal.duplicate(),"path":[],"age":0.0});return goal
 var obstacles: Array=[]
 for p in peers:
  if distance(agent,p)<minf(65,distance(agent,goal)+own+float(radius_of.call(p))+4):obstacles.append(p)
 obstacles.sort_custom(func(a,b):return distance(agent,a)<distance(agent,b))
 if obstacles.size()>12:obstacles=obstacles.slice(0,12)
 var nodes: Array=[agent,goal];var sides:=12
 for p in obstacles:
  var radius: float=(own+float(radius_of.call(p))+0.3)/cos(PI/sides)
  for i in sides:
   var angle:=i*TAU/sides;var q: Dictionary={"x":float(p.x)+cos(angle)*radius,"z":float(p.z)+sin(angle)*radius}
   if not open.call(q.x,q.z):continue
   var free:=true
   for v in peers:
    if distance(q,v)<own+float(radius_of.call(v))+0.05:free=false;break
   if free:nodes.append(q)
 var costs:=PackedFloat64Array();costs.resize(nodes.size());costs.fill(INF);costs[0]=0
 var prev:=PackedInt32Array();prev.resize(nodes.size());prev.fill(-1)
 var closed:=PackedByteArray();closed.resize(nodes.size());closed.fill(0)
 for k in nodes.size():
  var at:=-1
  for i in nodes.size():
   if closed[i]==0 and (at<0 or costs[i]<costs[at]-tolerance):at=i
  if at<0 or not is_finite(costs[at]) or at==1:break
  closed[at]=1
  for i in range(1,nodes.size()):
   if closed[i]!=0:continue
   var left: bool=(float(goal.x)-float(agent.x))*(float(nodes[i].z)-float(agent.z))-(float(goal.z)-float(agent.z))*(float(nodes[i].x)-float(agent.x))>0
   var cost: float=costs[at]+distance(nodes[at],nodes[i])*(1.001 if left else 1.0)
   if cost<costs[i]-tolerance and clear(nodes[at],nodes[i],peers,own,open,radius_of,cell_size):costs[i]=cost;prev[i]=at
 var path: Array=[]
 if prev[1]>=0:
  var at:=1
  while at>0:path.push_front(nodes[at].duplicate());at=prev[at]
 forget(agent);routes.append({"agent":agent,"goal":goal.duplicate(),"path":path,"age":0.0})
 return path[0] if not path.is_empty() else goal
