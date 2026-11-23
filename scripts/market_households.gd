class_name MarketHouseholds
extends RefCounted
const Nav=preload("res://scripts/local_navigation.gd")
const Econ=preload("res://scripts/economy_rules.gd")
const District=preload("res://scripts/district_context.gd")
const Travelers=preload("res://scripts/district_builders.gd")

# A household may fetch supplies from a market on a different city tile.
func tick(state: Dictionary,city: Dictionary,dt: float,context_at: Callable,nav_for: Callable,path_for: Callable) -> void:
 if dt<=0:return
 var contexts:=District.contexts(city);var houses: Array=[];var markets: Array=[]
 for ctx in contexts:
  if not ctx.world.has("workers"):ctx.world.workers={}
  for b in ctx.economy.buildings:
   if b.type=="house" and b.get("ready",false) and float(b.get("hp",0))>0:houses.append({"ctx":ctx,"building":b})
   if b.type=="market" and b.get("ready",false) and not b.get("disabled",false) and float(b.get("hp",0))>0 and float(b.get("assigned",1))>0.01:markets.append({"ctx":ctx,"building":b})
 if markets.is_empty():
  for ctx in contexts:
   for id in ctx.world.workers:
    if str(id).begins_with("shopper:"):ctx.world.workers[id].visible=false;ctx.world.workers[id].moving=false
  return
 var stock: Dictionary=city.economy.realms[city.team].resources
 for index in mini(64,houses.size()):
  var home: Dictionary=houses[index].ctx;var house: Dictionary=houses[index].building
  var id: String="shopper:%d:%d:%d:%d" % [int(city.id),int(home.c),int(home.r),home.economy.buildings.find(house)]
  var worker: Variant=null
  for ctx in contexts:
   if ctx.world.workers.has(id):worker=ctx.world.workers[id];break
  if worker==null:
   var initial: Dictionary={"workerKey":id};var nav: LocalNavigation=nav_for.call(home,initial)
   var point: Variant=nav.nearest(Nav.door(house))
   if point==null:continue
   worker={"x":point.x,"z":point.z,"c":home.c,"r":home.r,"team":city.team,"kind":"market_woman","workerKey":id,"visible":true,"shoppingPhase":"market","carried":0}
  worker.kind="market_woman";worker.visible=true;worker.team=city.team;worker.moving=false;worker.working=false;worker.action=null
  if worker.get("shoppingPhase")=="home" and float(worker.get("carried",0))>0:
   worker.status="Toob perele toitu"
   if Travelers.travel(state,worker,home,dt,context_at,nav_for,path_for):
    var nav: LocalNavigation=nav_for.call(home,worker)
    if nav.move(worker,Nav.door(house),dt,3.0,true):
     house.foodHeld=float(house.get("foodHeld",0))+float(worker.get("breadLoad",0));house.waterHeld=float(house.get("waterHeld",0))+float(worker.get("waterLoad",0))
     worker.carried=0;worker.breadLoad=0;worker.waterLoad=0;worker.shoppingPhase="market";worker.status="Viis söögi koju"
   Travelers.attach(city,worker,context_at);continue
  if float(house.get("foodHeld",0))>=5 and float(house.get("waterHeld",0))>=3:
   worker.status="Kodus";worker.carried=0
   if Travelers.travel(state,worker,home,dt,context_at,nav_for,path_for):
    var nav: LocalNavigation=nav_for.call(home,worker);nav.move(worker,Nav.door(house),dt,3.0,true)
   Travelers.attach(city,worker,context_at);continue
  var ordered:=markets.duplicate()
  ordered.sort_custom(func(a,b):return absi(int(a.ctx.c)-int(home.c))+absi(int(a.ctx.r)-int(home.r))<absi(int(b.ctx.c)-int(home.c))+absi(int(b.ctx.r)-int(home.r)))
  var market: Variant=null
  for choice in ordered:
   if is_same(choice.ctx,home) or path_for.call(worker,choice.ctx,int(worker.team))!=null:market=choice;break
  if market==null:worker.status="Tee turule puudub";Travelers.attach(city,worker,context_at);continue
  worker.status="Läheb turule söögi järele"
  if not Travelers.travel(state,worker,market.ctx,dt,context_at,nav_for,path_for):Travelers.attach(city,worker,context_at);continue
  var nav: LocalNavigation=nav_for.call(market.ctx,worker)
  if not nav.move(worker,Nav.door(market.building),dt,3.0,true):Travelers.attach(city,worker,context_at);continue
  var food_need:=minf(3,maxf(0,5-float(house.get("foodHeld",0))))
  var water_load:=minf(2,minf(maxf(0,4-float(house.get("waterHeld",0))),float(stock.get("water",0))))
  var food_load:=Econ.take_food(stock,food_need)
  if food_load<0.01 and water_load<0.01:worker.status="Turul puudub toit ja vesi";Travelers.attach(city,worker,context_at);continue
  stock.water=float(stock.get("water",0))-water_load;worker.breadLoad=food_load;worker.waterLoad=water_load;worker.carried=food_load+water_load;worker.shoppingPhase="home";worker.status="Ostis toidu ja vee"
  Travelers.attach(city,worker,context_at)
