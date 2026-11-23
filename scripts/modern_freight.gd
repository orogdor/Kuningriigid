class_name ModernFreight
extends RefCounted
const Econ=preload("res://scripts/economy_rules.gd")
const Merchants=preload("res://scripts/world_merchants.gd")
const Roads=preload("res://scripts/world_roads.gd")
const Movement=preload("res://scripts/world_movement.gd")
const KEYS=["bread","water","wood","stone","plank","grain","flour","ore","coal","iron","weapons","paper","saltpeter","gunpowder","steel","machines","oil","fuel","vehicles","clay","pottery","cutstone","copper","tin","bronze","carts"]

static func ready(city: Dictionary,type: String) -> bool:
 for b in Merchants.buildings(city):
  if b.type==type and int(b.get("team",city.team))==int(city.team) and b.get("ready",false) and float(b.get("hp",0))>0:return true
 return false
static func link_key(a: Dictionary,b: Dictionary) -> String:
 return str(mini(int(a.id),int(b.id)))+":"+str(maxi(int(a.id),int(b.id)))
static func build_rails(state: Dictionary,find_path: Callable) -> int:
 if not state.has("railLinks"):state.railLinks={}
 if not state.has("railEdges"):state.railEdges={}
 var cities: Array=[];var built:=0
 for city in state.cities:
  if ready(city,"railstation"):cities.append(city)
 for i in cities.size():
  for j in range(i+1,cities.size()):
   var a: Dictionary=cities[i];var b: Dictionary=cities[j];var key:=link_key(a,b);var team:=int(a.team)
   if team!=int(b.team) or state.railLinks.has(key) or "railways" not in state.research[team].known:continue
   var path: Variant=find_path.call(a,b,team)
   if path==null or path.is_empty() or path.size()>45:continue
   var steel:=maxi(5,ceili(path.size()*0.85));var machines:=maxi(2,ceili(path.size()/8.0));var stock: Dictionary=a.economy.realms[team].resources
   if float(stock.get("steel",0))<steel or float(stock.get("machines",0))<machines:continue
   stock.steel=float(stock.steel)-steel;stock.machines=float(stock.machines)-machines
   var tiles: Array=[{"c":a.c,"r":a.r}]
   for p in path:tiles.append({"c":p.c,"r":p.r})
   state.railLinks[key]={"from":a.id,"to":b.id,"team":team,"tiles":tiles}
   for n in range(1,tiles.size()):state.railEdges[Roads.road_key(tiles[n-1],tiles[n])]=team
   state.railRevision=int(state.get("railRevision",0))+1;built+=1
 return built
static func rail_route(state: Dictionary,from: Dictionary,to: Dictionary,can_traverse: Callable) -> Variant:
 var link: Variant=state.get("railLinks",{}).get(link_key(from,to))
 if link==null:return null
 var points: Array=link.tiles.duplicate(true)
 if int(from.id)!=int(link.from):points.reverse()
 for p in points:
  if not can_traverse.call(int(from.team),p):return null
 return points.slice(1)
static func air_cost(a: Dictionary,b: Dictionary) -> int:
 return 6+ceili((absi(int(a.c)-int(b.c))+absi(int(a.r)-int(b.r)))/8.0)
static func duration(a: Dictionary,b: Dictionary) -> float:
 return 7.0+Vector2(float(a.c)-float(b.c),float(a.r)-float(b.r)).length()*0.32
static func air_available(state: Dictionary,a: Dictionary,b: Dictionary) -> bool:
 if int(a.team)!=int(b.team) or not ready(a,"airfield") or not ready(b,"airfield"):return false
 if "aviation" not in state.research[int(a.team)].known:return false
 return float(Merchants.city_stock(a).get("fuel",0))>=air_cost(a,b)+6
static func food(stock: Dictionary) -> float:
 var total:=0.0
 for key in Econ.DATA.data.food_keys:total+=float(stock.get(key,0))
 return total
static func suggest(from: Dictionary,to: Dictionary,inbound: Array,max_load: float) -> Dictionary:
 if int(from.team)!=int(to.team) or from.get("tradeDisabled",false) or to.get("tradeDisabled",false):return {}
 var src:=Merchants.city_stock(from);var dst:=Merchants.city_stock(to);var need:=Merchants.reserves(to);var keep:=Merchants.reserves(from);var incoming: Dictionary={}
 for cargo in inbound:
  if int(cargo.to)!=int(to.id) or int(cargo.team)!=int(to.team):continue
  for key in cargo.goods:incoming[key]=float(incoming.get(key,0))+float(cargo.goods[key])
 var inbound_food:=food(incoming);var food_room:=maxf(0,Econ.storage_limit(Merchants.buildings(to),"bread")-food(dst)-inbound_food)
 var ranked: Array=[]
 for i in KEYS.size():
  var key: String=KEYS[i];var shortage:=float(need[key])-food(dst)-inbound_food if key=="bread" else float(need[key])-float(dst.get(key,0))-float(incoming.get(key,0))
  ranked.append({"key":key,"order":i,"ratio":maxf(0,shortage)/float(need[key])})
 ranked.sort_custom(func(a,b):return int(a.order)<int(b.order) if a.ratio==b.ratio else a.ratio>b.ratio)
 var result: Dictionary={};var room:=max_load
 for entry in ranked:
  if room<=0:break
  var key: String=entry.key
  var requested:=float(need[key])-food(dst)-inbound_food if key=="bread" else float(need[key])-float(dst.get(key,0))-float(incoming.get(key,0))
  if requested<=0:continue
  var minimum:=maxf(float(keep.bread),float(from.economy.realms[from.team].get("pop",3))*2.6) if key=="bread" else float(keep[key])
  var surplus:=float(src.get(key,0))-minimum
  var free:=maxf(0,Econ.storage_limit(Merchants.buildings(to),key)-Merchants.storage_used(dst,key)-float(incoming.get(key,0)))
  if key in Econ.DATA.data.food_keys:free=minf(free,food_room)
  var quantity:=floori(maxf(0,minf(requested,minf(surplus,minf(free,minf(room,26))))))
  if quantity<2:continue
  result[key]=quantity;room-=quantity
  if key in Econ.DATA.data.food_keys:food_room-=quantity
 return result
static func plan(state: Dictionary,can_traverse: Callable) -> int:
 var towns: Array=[];var sent:=0
 for city in state.cities:
  if not city.get("tradeDisabled",false):towns.append(city)
 towns.sort_custom(func(a,b):return int(a.id)<int(b.id))
 for to in towns:
  var arriving:=0
  for cargo in state.shipments:
   if int(cargo.to)==int(to.id) and int(cargo.team)==int(to.team):arriving+=1
  if arriving>=2:continue
  var options: Array=[]
  for from in towns:
   if int(from.id)==int(to.id) or int(from.team)!=int(to.team):continue
   var busy:=false
   for cargo in state.shipments:
    if int(cargo.from)==int(from.id):busy=true;break
   if busy:continue
   var route: Variant=rail_route(state,from,to,can_traverse)
   var mode: String="rail" if route!=null else "air" if air_available(state,from,to) else ""
   if mode.is_empty():continue
   var stock:=Merchants.city_stock(from);var fuel:=air_cost(from,to) if mode=="air" else 0
   if mode=="air":stock.fuel=float(stock.fuel)-fuel
   var goods:=suggest(from,to,state.shipments,90.0 if mode=="rail" else 75.0)
   if mode=="air":stock.fuel=float(stock.fuel)+fuel
   if goods.is_empty():continue
   var total:=0.0
   for amount in goods.values():total+=float(amount)
   var divisor:=duration(from,to)/2.0 if mode=="air" else maxf(1.0,route.size()/3.0)
   options.append({"from":from,"goods":goods,"route":route,"mode":mode,"worth":total/sqrt(divisor)})
  options.sort_custom(func(a,b):return a.worth>b.worth)
  if options.is_empty():continue
  var chosen: Dictionary=options[0];var from: Dictionary=chosen.from;var stock:=Merchants.city_stock(from)
  if chosen.mode=="air":
   var fuel:=air_cost(from,to)
   if float(stock.get("fuel",0))<fuel+6:continue
   stock.fuel=float(stock.fuel)-fuel
  for key in chosen.goods:stock[key]=float(stock.get(key,0))-float(chosen.goods[key])
  var flight:=duration(from,to) if chosen.mode=="air" else 0.0
  state.shipments.append({"id":int(state.get("nextShipment",0)),"team":to.team,"from":from.id,"to":to.id,"c":from.c,"r":from.r,"path":chosen.route if chosen.route!=null else [],"mode":chosen.mode,"wagon":false,"roadCrew":false,"flightDuration":flight,"flightLeft":flight,"goods":chosen.goods,"startedAt":state.time})
  state.nextShipment=int(state.get("nextShipment",0))+1;sent+=1
 return sent

static func city_by_id(state: Dictionary,id: int) -> Dictionary:
 for city in state.cities:
  if int(city.id)==id:return city
 return {}
static func advance(state: Dictionary,cargo: Dictionary,dt: float,can_traverse: Callable) -> void:
 if cargo.mode=="air":
  cargo.flightLeft=maxf(0,float(cargo.get("flightLeft",cargo.get("flightDuration",0)))-dt)
  var a:=city_by_id(state,int(cargo.from));var b:=city_by_id(state,int(cargo.to))
  if not a.is_empty() and not b.is_empty():
   var t:=1.0-float(cargo.flightLeft)/maxf(0.01,float(cargo.flightDuration))
   var c:=lerpf(float(a.c),float(b.c),t);var r:=lerpf(float(a.r),float(b.r),t)
   cargo.flightPosition={"c":c,"r":r};cargo.flightHeading=atan2(float(b.c)-float(a.c),float(b.r)-float(a.r));cargo.c=roundi(c);cargo.r=roundi(r)
  return
 if cargo.get("blocked",false) or cargo.path.is_empty():return
 var first: Dictionary=cargo.path[0]
 var first_duration:=1.0 if cargo.mode=="rail" else Movement.duration(Vector2i(int(cargo.c),int(cargo.r)),Vector2i(int(first.c),int(first.r)),3.0,Roads.road_boost(state,cargo,first,float(state.time)))
 Movement.rescale_travel(cargo,first_duration)
 cargo.travelClock=float(cargo.get("travelClock",0))+dt
 for guard in 6:
  if cargo.path.is_empty():break
  var next: Dictionary=cargo.path[0]
  var step_duration:=1.0 if cargo.mode=="rail" else Movement.duration(Vector2i(int(cargo.c),int(cargo.r)),Vector2i(int(next.c),int(next.r)),3.0,Roads.road_boost(state,cargo,next,float(state.time)))
  cargo.travelDuration=step_duration
  if float(cargo.travelClock)<step_duration:break
  if not can_traverse.call(int(cargo.team),next):cargo.path=[];cargo.travelClock=0;cargo.blocked=true;break
  cargo.travelClock=float(cargo.travelClock)-step_duration
  var previous={"c":cargo.c,"r":cargo.r};cargo.c=next.c;cargo.r=next.r;cargo.path.pop_front()
  if cargo.mode=="road":Roads.record_step(state,previous,cargo,"caravan",float(state.time))
 if cargo.path.is_empty():cargo.travelClock=0;cargo.travelDuration=0
static func receive(state: Dictionary,cargo: Dictionary,find_path: Callable,can_traverse: Callable) -> void:
 if cargo.mode=="air" and float(cargo.get("flightLeft",0))>0:return
 if cargo.mode!="air" and (cargo.get("blocked",false) or (not cargo.path.is_empty() and not can_traverse.call(int(cargo.team),cargo.path[0]))):
  var target:=city_by_id(state,int(cargo.to));var route: Variant=find_path.call(cargo,target,int(cargo.team)) if not target.is_empty() else null
  cargo.blocked=route==null
  if route==null:return
  cargo.path=route;cargo.mode="road"
 if not cargo.path.is_empty():return
 var city:=city_by_id(state,int(cargo.to))
 if city.is_empty() or int(city.team)!=int(cargo.team):state.shipments.erase(cargo);return
 var stock:=Merchants.city_stock(city)
 for key in cargo.goods.keys():
  var free:=maxf(0,Econ.storage_limit(Merchants.buildings(city),key)-Merchants.storage_used(stock,key));var taken:=minf(float(cargo.goods[key]),free)
  stock[key]=float(stock.get(key,0))+taken;cargo.goods[key]=float(cargo.goods[key])-taken
  if float(cargo.goods[key])<=0.00001:cargo.goods.erase(key)
 if cargo.goods.is_empty():state.shipments.erase(cargo)
 else:cargo.status="Ootab vaba laoruumi"
static func tick_rail(state: Dictionary,dt: float,find_path: Callable) -> void:
 state.railClock=float(state.get("railClock",0))+dt
 if float(state.railClock)>=25.0:state.railClock=fmod(float(state.railClock),25.0);build_rails(state,find_path)

static func advance_shipments(state: Dictionary,dt: float,can_traverse: Callable) -> void:
 for cargo in state.shipments:
  if not cargo.get("merchantV87",false):advance(state,cargo,dt,can_traverse)
