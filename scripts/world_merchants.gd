class_name WorldMerchants
extends RefCounted
const Grid=preload("res://scripts/campaign_grid.gd")
const Diplomacy=preload("res://scripts/diplomacy_rules.gd")
const Economy=preload("res://scripts/economy_rules.gd")
const Needs=preload("res://scripts/city_needs.gd")
const Movement=preload("res://scripts/world_movement.gd")
const Roads=preload("res://scripts/world_roads.gd")
const Production=preload("res://scripts/lumber_production.gd")
const Naval=preload("res://scripts/naval_rules.gd")
const ROAD_RANGE:=32
const SEA_RANGE:=72

# Sea planning must also run when the town's only port is in a district.
static func has_sea_activity(state: Dictionary) -> bool:
	for city in state.get("cities",[]):
		for building in buildings(city):
			if building.type=="harbor" and building.get("ready",false) and float(building.get("hp",0))>0 and not building.get("disabled",false):return true
	for cargo in state.get("shipments",[]):
		if cargo.get("mode","")=="sea":return true
	return false

static func city_stock(city: Dictionary) -> Dictionary:
	return city.economy.realms[city.team].resources
static func distance(a: Dictionary,b: Dictionary) -> int:
	return absi(int(a.c)-int(b.c))+absi(int(a.r)-int(b.r))
static func buildings(city: Dictionary) -> Array:
	var result: Array=city.economy.buildings.duplicate()
	for district in city.get("districts",{}).values():result.append_array(district.get("economy",{}).get("buildings",[]))
	return result
static func reserves(city: Dictionary) -> Dictionary:
	var pop:=float(city.economy.realms[city.team].get("pop",3));if pop==0:pop=3
	return {"bread":maxf(20,pop*2.4),"water":maxf(18,pop*2),"wood":50,"stone":28,"plank":20,"grain":10,"flour":10,"ore":12,"coal":10,"iron":8,"weapons":5,"paper":8,"saltpeter":8,"gunpowder":8,"steel":12,"machines":10,"oil":12,"fuel":10,"vehicles":3,"clay":8,"pottery":5,"cutstone":5,"copper":5,"tin":4,"bronze":5,"carts":2}
static func demand(state: Dictionary,city: Dictionary) -> Dictionary:
	var need:=reserves(city)
	for request in [city.get("aiImportRequestsV128",{}),city.get("importRequests",{})]:
		for key in request:need[key]=maxf(float(need.get(key,0)),float(request[key]))
	var age:=int(state.ages[city.team]);var pop:=float(city.economy.realms[city.team].pop)
	for key in Needs.DATA.data.goods:
		var definition: Dictionary=Needs.DATA.data.goods[key]
		if int(definition.get("age",0))>age:continue
		need[key]=maxf(4,pop*1.2) if definition.get("food",false) else maxf(2,pop*0.3) if definition.get("luxury",false) else 4
	if age>=1:need.pottery=maxf(3,pop*0.3)
	for b in buildings(city):
		var input: Dictionary=Economy.DATA.data.buildings.get(b.type,{}).get("input",{})
		for key in input:need[key]=maxf(float(need.get(key,0)),float(input[key])*(12 if b.type in ["steelworks","engineworks","powerplant","refinery"] else 4))
	return need
static func storage_used(stock: Dictionary,key: String) -> float:
	if key not in Economy.DATA.data.food_keys:return float(stock.get(key,0))
	var total:=0.0
	for food in Economy.DATA.data.food_keys:total+=float(stock.get(food,0))
	return total
static func merchant_route(state: Dictionary,from: Dictionary,to: Dictionary,team: int,find_path: Callable,cells: Array=[],distances: PackedInt32Array=PackedInt32Array()) -> Variant:
	var stops: Array=[]
	for city in state.cities:
		if city.get("tradeDisabled",false) or not Diplomacy.merchant_access(state,team,city):continue
		stops.append({"id":"city:"+str(int(city.id)),"cityId":city.id,"team":city.team,"c":city.c,"r":city.r,"port":false})
		if not cells.is_empty() and distances.size()==cells.size():
			var contexts: Array=[city];contexts.append_array(city.get("districts",{}).values())
			for context in contexts:
				var harbor:=false
				for b in context.economy.buildings:
					if b.type=="harbor" and b.get("ready",false) and float(b.get("hp",0))>0 and not b.get("disabled",false):harbor=true;break
				if not harbor:continue
				var exit: Variant=Naval.harbor_exit(cells,distances,state.research[team].known,Vector2i(int(context.c),int(context.r)))
				if exit!=null:stops.append({"id":"port:%d:%d:%d" % [int(city.id),int(context.c),int(context.r)],"cityId":city.id,"team":city.team,"c":context.c,"r":context.r,"port":true,"exit":exit})
	var first:="city:"+str(int(from.id));var target:="city:"+str(int(to.id));var start: Dictionary={}
	for stop in stops:
		if stop.id==first:start=stop;break
	if start.is_empty():return null
	var best: Dictionary={};best[first]=0.0;var previous: Dictionary={};var queue: Array=[start]
	while not queue.is_empty():
		queue.sort_custom(func(a,b):return float(best[a.id])<float(best[b.id]))
		var current: Dictionary=queue.pop_front()
		if current.id==target:break
		for next in stops:
			if next.id==current.id:continue
			var path: Variant=null;var mode: String="road"
			if distance(current,next)<=ROAD_RANGE:
				path=find_path.call(current,next,team)
				if path!=null and path.size()>ROAD_RANGE:path=null
			if path==null and current.port and next.port and distance(current.exit,next.exit)<=SEA_RANGE and not cells.is_empty():
				var sea: Variant=Naval.sea_path(cells,distances,state.research[team].known,Vector2i(int(current.exit.c),int(current.exit.r)),Vector2i(int(next.exit.c),int(next.exit.r)))
				if sea!=null and sea.size()+2<=SEA_RANGE:
					path=[current.exit];path.append_array(sea);path.append({"c":next.c,"r":next.r});mode="sea"
			if path==null:continue
			var cursor: Dictionary=current;var travel:=0.0
			for step in path:
				travel+=1.5 if mode=="sea" else Movement.duration(Vector2i(int(cursor.c),int(cursor.r)),Vector2i(int(step.c),int(step.r)),3.0,Roads.road_boost(state,cursor,step,float(state.time)))
				cursor=step
			var cost:=float(best[current.id])+travel+6
			if cost>=float(best.get(next.id,INF)):continue
			best[next.id]=cost;previous[next.id]={"from":current,"leg":{"stop":next,"mode":mode,"path":path}}
			var queued:=false
			for item in queue:
				if item.id==next.id:queued=true;break
			if not queued:queue.append(next)
	if not best.has(target):return null
	var legs: Array=[];var current_id:=target
	while current_id!=first:
		if not previous.has(current_id):return null
		var edge: Dictionary=previous[current_id];legs.push_front(edge.leg);current_id=edge.from.id
	return legs if not legs.is_empty() else null

static func pay_visit(state: Dictionary,cargo: Dictionary,city: Dictionary) -> void:
	var stock:=city_stock(city);var paid: Dictionary={}
	for key in cargo.goods:
		var fee:=float(cargo.goods[key])*0.05;cargo.goods[key]=float(cargo.goods[key])-fee
		stock[key]=float(stock.get(key,0))+fee;paid[key]=fee
	if not cargo.has("fees"):cargo.fees=[]
	cargo.fees.append({"city":city.id,"time":state.time,"goods":paid})

static func plan(state: Dictionary,find_path: Callable,cells: Array=[],distances: PackedInt32Array=PackedInt32Array()) -> int:
	if not state.has("shipments"):state.shipments=[]
	if not state.has("nextShipment"):state.nextShipment=0
	var towns: Array=[];var count:=0
	for city in state.cities:
		if not city.get("tradeDisabled",false):towns.append(city)
	for destination in towns:
		var arriving:=0
		for cargo in state.shipments:
			if cargo.to==destination.id:arriving+=1
		if arriving>=2:continue
		var dst:=city_stock(destination);var need:=demand(state,destination);var inbound: Dictionary={}
		for cargo in state.shipments:
			if cargo.to!=destination.id:continue
			for key in cargo.goods:inbound[key]=float(inbound.get(key,0))+float(cargo.goods[key])
		var ranked: Array=[];var index:=0
		for key in need:ranked.append({"key":key,"order":index,"ratio":(float(dst.get(key,0))+float(inbound.get(key,0)))/float(need[key])});index+=1
		ranked.sort_custom(func(a,b):return int(a.order)<int(b.order) if float(a.ratio)==float(b.ratio) else float(a.ratio)<float(b.ratio))
		var sources: Array=[];index=0
		for town in towns:sources.append({"city":town,"order":index,"dist":distance(town,destination)});index+=1
		sources.sort_custom(func(a,b):return int(a.order)<int(b.order) if a.dist==b.dist else int(a.dist)<int(b.dist))
		for entry in sources:
			var from: Dictionary=entry.city
			if from.id==destination.id or not Diplomacy.merchant_access(state,int(destination.team),from):continue
			var dispatched:=false
			for cargo in state.shipments:
				if cargo.from==from.id and cargo.team==destination.team:dispatched=true;break
			if dispatched:continue
			var src:=city_stock(from);var reserve:=demand(state,from);var goods: Dictionary={};var room:=40.0
			var budget:=INF if from.team==destination.team else float(dst.get("gold",0))
			for rank in ranked:
				var key: String=rank.key
				var wanted:=float(need[key])-float(dst.get(key,0))-float(inbound.get(key,0))
				var surplus:=float(src.get(key,0))-float(reserve.get(key,0))
				var free:=Economy.storage_limit(buildings(destination),key)-storage_used(dst,key)
				for other in goods:
					if other==key or (key in Economy.DATA.data.food_keys and other in Economy.DATA.data.food_keys):free-=float(goods[other])
				var quantity:=floori(minf(minf(wanted,surplus),minf(room,minf(budget,free))))
				if quantity<1:continue
				goods[key]=quantity;room-=quantity;budget-=quantity
			if goods.is_empty():continue
			var legs: Variant=merchant_route(state,from,destination,int(destination.team),find_path,cells,distances)
			if legs==null:continue
			var cost:=0.0
			for n in goods.values():cost+=float(n)
			if from.team!=destination.team:dst.gold=float(dst.get("gold",0))-cost;src.gold=float(src.get("gold",0))+cost
			for key in goods:src[key]=float(src.get(key,0))-float(goods[key])
			var cargo={"id":state.nextShipment,"merchantV87":true,"team":destination.team,"from":from.id,"to":destination.id,"c":from.c,"r":from.r,"goods":goods,"legs":legs,"leg":0,"path":legs[0].path.duplicate(true),"mode":legs[0].mode,"rangeLeft":SEA_RANGE if legs[0].mode=="sea" else ROAD_RANGE,"startedAt":state.time,"travelClock":0,"fees":[],"status":"Teel"}
			state.nextShipment=int(state.nextShipment)+1;pay_visit(state,cargo,from);state.shipments.append(cargo);count+=1;break
	return count

static func advance(state: Dictionary,cargo: Dictionary,dt: float,can_traverse: Callable,cells: Array=[],distances: PackedInt32Array=PackedInt32Array()) -> void:
	var index:=int(cargo.leg);var legs: Array=cargo.legs
	var leg: Dictionary=legs[index] if index>=0 and index<legs.size() else {}
	var city: Dictionary={}
	if not leg.is_empty():
		for candidate in state.cities:
			if candidate.id==leg.stop.cityId:city=candidate;break
	if leg.is_empty() or city.is_empty() or not Diplomacy.merchant_access(state,int(cargo.team),city) or city.get("tradeDisabled",false) or Diplomacy.at_war(state,int(cargo.team),int(city.team)):
		cargo.status="Ootab: peatumisluba puudub";cargo.blocked=true;return
	cargo.blocked=false;cargo.status="Teel"
	if cargo.path.is_empty():return
	var next: Dictionary=cargo.path[0]
	var length:=1.5 if cargo.mode=="sea" else Movement.duration(Vector2i(int(cargo.c),int(cargo.r)),Vector2i(int(next.c),int(next.r)),3.0,Roads.road_boost(state,cargo,next,float(state.time)))
	Movement.rescale_travel(cargo,length);cargo.travelClock=float(cargo.get("travelClock",0))+dt
	while not cargo.path.is_empty():
		next=cargo.path[0]
		length=1.5 if cargo.mode=="sea" else Movement.duration(Vector2i(int(cargo.c),int(cargo.r)),Vector2i(int(next.c),int(next.r)),3.0,Roads.road_boost(state,cargo,next,float(state.time)))
		cargo.travelDuration=length
		if float(cargo.travelClock)<length:break
		var valid: bool=false
		if cargo.mode=="sea" and not cells.is_empty():
			var at:=Vector2i(int(next.c),int(next.r))
			if at.x>=0 and at.x<Grid.COLS and at.y>=0 and at.y<Grid.ROWS and at.y*Grid.COLS+at.x<cells.size():
				var cell: Dictionary=cells[at.y*Grid.COLS+at.x]
				valid=(int(next.c)==int(leg.stop.c) and int(next.r)==int(leg.stop.r)) if cell.land else Naval.sea_allowed(cells,distances,state.research[int(cargo.team)].known,at)
		else:valid=bool(can_traverse.call(cargo.team,next))
		if not valid or int(cargo.rangeLeft)<=0:
			cargo.blocked=true;cargo.status="Ootab: teekond suletud";return
		cargo.travelClock=float(cargo.travelClock)-length
		var from: Dictionary={"c":cargo.c,"r":cargo.r}
		var step: Dictionary=cargo.path.pop_front();cargo.c=step.c;cargo.r=step.r
		if cargo.mode=="road":Roads.record_step(state,from,cargo,"caravan",float(state.time))
		cargo.rangeLeft=int(cargo.rangeLeft)-1

static func receive(state: Dictionary,cargo: Dictionary) -> void:
	if not state.shipments.has(cargo) or cargo.get("blocked",false) or not cargo.path.is_empty():return
	var index:=int(cargo.leg);var legs: Array=cargo.legs
	if index<0 or index>=legs.size():return
	var leg: Dictionary=legs[index];var city: Dictionary={}
	for candidate in state.cities:
		if candidate.id==leg.stop.cityId:city=candidate;break
	if city.is_empty() or not Diplomacy.merchant_access(state,int(cargo.team),city):return
	if not cargo.get("visitPaid",false):pay_visit(state,cargo,city);cargo.visitPaid=true
	if index+1<legs.size():
		cargo.leg=index+1;var next: Dictionary=legs[cargo.leg]
		cargo.path=next.path.duplicate(true);cargo.mode=next.mode;cargo.rangeLeft=SEA_RANGE if next.mode=="sea" else ROAD_RANGE;cargo.travelClock=0;cargo.visitPaid=false;return
	if int(city.team)!=int(cargo.team):cargo.status="Ootab: sihtlinna omanik muutus";return
	var stock:=city_stock(city)
	for key in cargo.goods.keys():
		var amount:=minf(float(cargo.goods[key]),maxf(0,Economy.storage_limit(buildings(city),key)-storage_used(stock,key)))
		stock[key]=float(stock.get(key,0))+amount;cargo.goods[key]=float(cargo.goods[key])-amount
		Production.record_delivery(city.economy.realms[city.team],float(state.time),key,amount)
		if float(cargo.goods[key])<=0.0000001:cargo.goods.erase(key)
	if cargo.goods.is_empty():state.shipments.erase(cargo)
	else:cargo.status="Ootab vaba laoruumi"

static func tick(state: Dictionary,dt: float,find_path: Callable,can_traverse: Callable,cells: Array=[],distances: PackedInt32Array=PackedInt32Array(),after_trade: Callable=Callable(),before_receive: Callable=Callable(),receive_other: Callable=Callable()) -> void:
	if not state.has("shipments"):state.shipments=[]
	state.tradeClock=float(state.get("tradeClock",0))+dt
	if state.tradeClock>=15:
		state.tradeClock=fmod(float(state.tradeClock),15.0);plan(state,find_path,cells,distances)
		if after_trade.is_valid():after_trade.call()
	for cargo in state.shipments:
		if cargo.get("merchantV87",false):advance(state,cargo,dt,can_traverse,cells,distances)
	if before_receive.is_valid():before_receive.call()
	state.merchantReceiveClock=float(state.get("merchantReceiveClock",0))+dt
	if state.merchantReceiveClock>=3:
		state.merchantReceiveClock=fmod(float(state.merchantReceiveClock),3.0)
		for cargo in state.shipments.duplicate():
			if cargo.get("merchantV87",false):receive(state,cargo)
			elif receive_other.is_valid():receive_other.call(cargo)
