class_name BattleArrivals
extends RefCounted
const Crowd=preload("res://scripts/battle_crowd.gd")
var reservations: Array=[]

func memo_index(agent: Dictionary) -> int:
 for i in reservations.size():
  if is_same(reservations[i].agent,agent):return i
 return -1

func forget(agent: Dictionary) -> void:
 var i:=memo_index(agent)
 if i>=0:reservations.remove_at(i)

func saved_goal(agent: Dictionary) -> Variant:
 var i:=memo_index(agent)
 return reservations[i].point if i>=0 else null

static func open_at(nav: Dictionary,x: float,z: float) -> bool:
 var callback: Callable=nav.get("open",Callable())
 return callback.call(x,z) if callback.is_valid() else true

static func ordered_agent(orders: Array,agent: Dictionary) -> bool:
 for order in orders:
  if is_same(order.agent,agent):return true
 return false

static func valid(point: Dictionary,order: Dictionary,orders: Array,occupants: Array,reserved: Array,nav: Dictionary) -> bool:
 if not open_at(nav,point.x,point.z):return false
 var radius:=float(order.radius);var gates: Array=nav.get("gates",[])
 for gate in gates:
  if gate.get("type")!="gatehouse" or float(gate.get("hp",0))<=0:continue
  var axis: String="x" if gate.get("wallAxis",0) else "z";var cross: String="z" if axis=="x" else "x"
  if absf(float(point[axis])-float(gate[axis]))<=radius*3+3 and absf(float(point[cross])-float(gate[cross]))<=radius+3:return false
 for taken in reserved:
  if Crowd.distance(point,taken.point)<radius+float(taken.radius)+0.5:return false
 for occupant in occupants:
  if is_same(occupant.agent,order.agent) or (occupant.team==order.team and ordered_agent(orders,occupant.agent)):continue
  if Crowd.distance(point,occupant.agent)<radius+float(occupant.radius)+0.5:return false
 return true

func assign(orders: Array,occupants: Array,nav: Dictionary={}) -> Array:
 var refresh: Callable=nav.get("refresh",Callable())
 if refresh.is_valid():refresh.call()
 var list: Array=[]
 for i in orders.size():list.append({"order":orders[i],"index":i,"saved":memo_index(orders[i].agent)>=0})
 list.sort_custom(func(a,b):
  if a.saved!=b.saved:return a.saved
  var da:=Crowd.distance(a.order.agent,a.order.goal);var db:=Crowd.distance(b.order.agent,b.order.goal)
  return a.index<b.index if da==db else da<db)
 var result: Array=[];var reserved: Array=[]
 for entry in list:
  var order: Dictionary=entry.order;var agent: Dictionary=order.agent;var goal: Dictionary=order.goal;var radius:=float(order.radius)
  var key:=str(float(goal.x))+":"+str(float(goal.z))+":"+str(int(order.team));var index:=memo_index(agent);var point: Variant=null
  if index>=0 and reservations[index].key==key and valid(reservations[index].point,order,orders,occupants,reserved,nav):point=reservations[index].point
  if point==null:
   var spacing:=maxf(2,radius*2+0.75);var angle:=atan2(float(agent.z)-float(goal.z),float(agent.x)-float(goal.x))
   for ring in range(0,11):
    var n:=maxi(8,ceili(TAU*ring)) if ring>0 else 1
    for i in n:
     var a:=angle+i*TAU/n;var raw: Dictionary={"x":float(goal.x)+cos(a)*spacing*ring,"z":float(goal.z)+sin(a)*spacing*ring}
     var nearest: Callable=nav.get("nearest",Callable());var candidate: Variant=nearest.call(raw,1) if nearest.is_valid() else raw
     if candidate==null or Crowd.distance(candidate,raw)>1.5 or not valid(candidate,order,orders,occupants,reserved,nav):continue
     var reachable: Callable=nav.get("reachable",Callable())
     if reachable.is_valid() and not reachable.call(agent,candidate):continue
     var room:=true
     if ring>0:
      for direction in [0.0,PI/2,PI,PI*1.5]:
       if not open_at(nav,float(candidate.x)+cos(direction)*radius,float(candidate.z)+sin(direction)*radius):room=false;break
     if not room:continue
     point={"x":candidate.x,"z":candidate.z};break
    if point!=null:break
  forget(agent)
  if point!=null:
   reservations.append({"agent":agent,"key":key,"point":point});reserved.append({"point":point,"radius":radius});result.append({"agent":agent,"point":point})
 return result

static func result_for(result: Array,agent: Dictionary) -> Variant:
 for item in result:
  if is_same(item.agent,agent):return item.point
 return null
