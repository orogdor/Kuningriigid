class_name WorldRoads
extends RefCounted
const Grid=preload("res://scripts/campaign_grid.gd")
const Geography=preload("res://scripts/world_geography.gd")
const THRESHOLDS: Array[float]=[12.0,25.0,60.0,120.0]

static func road_key(a: Dictionary,b: Dictionary) -> String:
 var x:=int(a.r)*Grid.COLS+int(a.c);var y:=int(b.r)*Grid.COLS+int(b.c)
 return str(mini(x,y))+":"+str(maxi(x,y))

static func road_level(heat: float) -> int:
 return 4 if heat>=120 else (3 if heat>=60 else (2 if heat>=25 else (1 if heat>=12 else 0)))

static func age_traffic(heat: float,elapsed: float) -> float:
 var h:=clampf(heat,0,150);var time:=maxf(0,elapsed)
 while time>0 and h>0:
  var level:=road_level(h)
  var rate: float=[0.004,0.0035,0.0018,0.0007,0.0002][level]
  var floor_value: float=[0.0,12.0,25.0,60.0,120.0][level]
  if level==0:return maxf(0,h-rate*time)
  var step:=maxf(0,(h-floor_value)/rate)
  if step>=time:h-=rate*time;break
  h=floor_value-0.00001;time-=step
 return 0.0 if h<0.02 else h

static func road_strength(state: Dictionary,a: Dictionary,b: Dictionary,now: float) -> float:
 var edge: Variant=state.get("worldRoads",{}).get(road_key(a,b))
 return age_traffic(float(edge.heat),now-float(edge.last)) if edge!=null else 0.0

static func road_boost(state: Dictionary,a: Dictionary,b: Dictionary,now: float) -> float:
 var level:=road_level(road_strength(state,a,b,now))
 return 1.65 if level>=4 else (1.5 if level>0 else 1.0)

static func record_step(state: Dictionary,a: Dictionary,b: Dictionary,kind: String,now: float) -> void:
 if absi(int(a.c)-int(b.c))+absi(int(a.r)-int(b.r))!=1:return
 if not state.has("worldRoads"):state.worldRoads={}
 var key:=road_key(a,b);var edge: Variant=state.worldRoads.get(key)
 var previous:=age_traffic(float(edge.heat),now-float(edge.last)) if edge!=null else 0.0
 var amount:=8.0 if kind=="roadworks" else (5.5 if kind=="caravan" else (2.5 if kind=="settler" else (3.0 if kind=="builder" else 3.5)))
 var next:=clampf(previous+amount,0,150);state.worldRoads[key]={"heat":next,"last":now}
 if road_level(previous)!=road_level(next):state.roadRevision=int(state.get("roadRevision",0))+1

static func decay(state: Dictionary,dt: float) -> void:
 state.roadDecayClock=float(state.get("roadDecayClock",0))+dt
 if state.roadDecayClock<30:return
 state.roadDecayClock=fmod(float(state.roadDecayClock),30.0)
 for key in state.get("worldRoads",{}).keys():
  var edge: Dictionary=state.worldRoads[key]
  var next:=age_traffic(float(edge.heat),float(state.get("time",0))-float(edge.last))
  var changed:=road_level(float(edge.heat))!=road_level(next)
  if next<=0:state.worldRoads.erase(key)
  else:edge.heat=next;edge.last=state.time
  if changed:state.roadRevision=int(state.get("roadRevision",0))+1

# The atlas uses connected splines: a road bends gently and follows its
# adjacent road at each junction, while its strategic endpoints stay fixed.
static func visual_network(state: Dictionary,explored: Dictionary,reveal_all: bool) -> Array:
 var edges: Array=[];var connections: Dictionary={}
 for key in state.get("worldRoads",{}):
  var parts:=str(key).split(":")
  if parts.size()!=2:continue
  var a:=int(parts[0]);var b:=int(parts[1])
  if a<0 or b<0 or a>=Grid.COLS*Grid.ROWS or b>=Grid.COLS*Grid.ROWS:continue
  var ca:=Vector2i(a%Grid.COLS,floori(float(a)/Grid.COLS));var cb:=Vector2i(b%Grid.COLS,floori(float(b)/Grid.COLS))
  if not reveal_all and (not explored.has(str(ca.x)+":"+str(ca.y)) or not explored.has(str(cb.x)+":"+str(cb.y))):continue
  var edge: Dictionary=state.worldRoads[key];var level:=road_level(age_traffic(float(edge.heat),float(state.time)-float(edge.last)))
  if level<=0:continue
  edges.append({"a":ca,"b":cb,"level":level})
  if not connections.has(a):connections[a]=[]
  if not connections.has(b):connections[b]=[]
  connections[a].append(cb);connections[b].append(ca)
 for edge in edges:edge.points=visual_spline(edge.a,edge.b,connections,int(state.seed))
 return edges

static func visual_spline(a: Vector2i,b: Vector2i,connections: Dictionary,seed: int) -> Array:
 var ai:=a.y*Grid.COLS+a.x;var bi:=b.y*Grid.COLS+b.x
 if ai>bi:
  var tmp:=a;a=b;b=tmp;var index:=ai;ai=bi;bi=index
 var start:=Grid.center(a.x,a.y);var end:=Grid.center(b.x,b.y);var diff:=end-start;var length:=diff.length()
 if length<=0:return []
 var side:=Vector2(-diff.y,diff.x)/length
 var offset:=clampf(Geography.noise(a.x*7+b.x,a.y*7+b.y,seed),-1,1)*2.3
 var irregular:=Geography.noise(a.x*17+b.x*3,a.y*11+b.y*7,seed)*1.1
 var m0:=diff;var m1:=diff;var prior: Variant=null;var next: Variant=null;var prior_score:=INF;var next_score:=-INF
 for neighbor in connections.get(ai,[]):
  if neighbor==b:continue
  var p:=Grid.center(neighbor.x,neighbor.y);var score: float=(p-start).dot(diff)
  if score<prior_score:prior_score=score;prior=p
 for neighbor in connections.get(bi,[]):
  if neighbor==a:continue
  var p:=Grid.center(neighbor.x,neighbor.y);var score: float=(p-end).dot(diff)
  if score>next_score:next_score=score;next=p
 if prior is Vector2:m0=(end-prior).normalized()*length
 if next is Vector2:m1=(next-start).normalized()*length
 var points: Array=[]
 for i in 13:
  var t:=float(i)/12.0;var t2:=t*t;var t3:=t2*t
  var p: Vector2=(2*t3-3*t2+1)*start+(t3-2*t2+t)*m0+(-2*t3+3*t2)*end+(t3-t2)*m1
  var fade:=pow(sin(PI*t),2);p+=side*fade*(offset+irregular*sin(TAU*t))
  points.append(p)
 return points
