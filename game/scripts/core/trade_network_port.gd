extends RefCounted
## Partial native port of V131 trade-network.js (same-state road routes).
## Ensures atomic pickup, incoming-goods accounting, reserves and warehouse limits.
## NOT implemented: inter-state merchant diplomacy, maritime/rail/air freight.
const Economy = preload("res://scripts/core/economy_port.gd")
const Needs = preload("res://scripts/core/city_needs_port.gd")
const Roads = preload("res://scripts/core/roads_port.gd")
const GOODS: Array[String] = ["bread","water","wood","stone","plank","grain","flour","ore","coal","iron","weapons","paper","saltpeter","gunpowder","steel","machines","oil","fuel","vehicles","clay","pottery","cutstone","copper","tin","bronze","carts"]
const EPS: float = 0.000001
const MAX_SHIPMENTS_PER_DESTINATION: int = 2

static func city_reserves(city: Dictionary) -> Dictionary:
    var pop: float = float(city.get("pop",3))
    return {"bread":maxf(20.0,pop*2.4),"water":maxf(18.0,pop*2.0),
        "wood":50.0,"stone":28.0,"plank":20.0,"grain":10.0,"flour":10.0,
        "ore":12.0,"coal":10.0,"iron":8.0,"weapons":5.0,"paper":8.0,
        "saltpeter":8.0,"gunpowder":8.0,"steel":12.0,"machines":10.0,
        "oil":12.0,"fuel":10.0,"vehicles":3.0,"clay":8.0,"pottery":5.0,
        "cutstone":5.0,"copper":5.0,"tin":4.0,"bronze":5.0,"carts":2.0}

static func _food_total(stock: Dictionary) -> float:
    var result: float = 0.0
    for key in Needs.food_keys():
        result += maxf(0.0,float(stock.get(key,0.0)))
    return result

static func _storage_used(city: Dictionary,key: String) -> float:
    if key in Needs.food_keys():
        return _food_total(city.get("resources",{}))
    return float(city.get("resources",{}).get(key,0.0))

static func _inbound(state: Dictionary,destination_id: int) -> Dictionary:
    var sums: Dictionary = {}
    for cargo in state.get("shipments",[]):
        if int(cargo.get("to",-1)) != destination_id:
            continue
        for key in cargo.get("goods",{}).keys():
            sums[key] = float(sums.get(key,0.0)) + float(cargo["goods"][key])
    return sums

static func suggest_goods(state: Dictionary,from_city: Dictionary,to_city: Dictionary,max_load: float = 36.0) -> Dictionary:
    if int(from_city.get("team",-1)) != int(to_city.get("team",-1)):
        return {}
    if bool(from_city.get("tradeDisabled",false)) or bool(to_city.get("tradeDisabled",false)):
        return {}
    var source: Dictionary = from_city.get("resources",{})
    var target: Dictionary = to_city.get("resources",{})
    var need: Dictionary = city_reserves(to_city)
    var keep: Dictionary = city_reserves(from_city)
    var incoming: Dictionary = _inbound(state,int(to_city.get("id",-1)))
    var inbound_food: float = 0.0
    for k in Needs.food_keys():
        inbound_food += float(incoming.get(k,0.0))
    var food_space: float = maxf(0.0,Economy.storage_limit(to_city.get("buildings",[]),"bread") - _food_total(target) - inbound_food)
    var priorities: Array = GOODS.duplicate()
    priorities.sort_custom(func(a,b):
        var need_a: float = maxf(1.0,float(need.get(a,1.0)))
        var need_b: float = maxf(1.0,float(need.get(b,1.0)))
        var have_a: float = _food_total(target)+inbound_food if a == "bread" else float(target.get(a,0.0))+float(incoming.get(a,0.0))
        var have_b: float = _food_total(target)+inbound_food if b == "bread" else float(target.get(b,0.0))+float(incoming.get(b,0.0))
        var shortage_a: float = (need_a-have_a)/need_a
        var shortage_b: float = (need_b-have_b)/need_b
        if absf(shortage_a-shortage_b) > EPS:
            return shortage_a > shortage_b
        # Equal shortages must not depend on unstable dictionary/sort ordering.
        # Prioritize basic food and water before raw materials when a cart fills.
        return GOODS.find(String(a)) < GOODS.find(String(b))
    )
    var result: Dictionary = {}
    var room: float = max_load
    for k in priorities:
        if room < 1.0:
            break
        var key: String = String(k)
        var required: float = float(need.get(key,0.0))
        var already: float = _food_total(target)+inbound_food if key == "bread" else float(target.get(key,0.0))+float(incoming.get(key,0.0))
        var wanted: float = maxf(0.0,required-already)
        if wanted <= 0.0:
            continue
        var reserve: float = float(keep.get(key,0.0))
        if key == "bread":
            reserve = maxf(reserve,float(from_city.get("pop",3))*2.6)
        var surplus: float = maxf(0.0,float(source.get(key,0.0))-reserve)
        var storage_free: float = Economy.storage_limit(to_city.get("buildings",[]),key)-_storage_used(to_city,key)-float(incoming.get(key,0.0))
        if key in Needs.food_keys():
            storage_free = minf(storage_free,food_space)
        var amount: int = int(floor(maxf(0.0,minf(26.0,minf(room,minf(surplus,minf(wanted,storage_free)))))))
        if amount < 2:
            continue
        result[key] = amount
        room -= float(amount)
        if key in Needs.food_keys():
            food_space -= float(amount)
    return result

static func _ready_building(city: Dictionary,kind: String) -> bool:
    for b in city.get("buildings",[]):
        if String(b.get("type","")) == kind and bool(b.get("ready",false)) and float(b.get("hp",1.0)) > 0.0:
            return true
    return false

static func plan_trade(state: Dictionary,world_nav) -> int:
    if world_nav == null:
        return 0
    var towns: Array = state.get("cities",[])
    var shipments: Array = state.get("shipments",[])
    var dispatched: int = 0
    # Stable city id order, as in V131 trade-network.js.
    var ordered: Array = towns.duplicate()
    ordered.sort_custom(func(a,b): return int(a.get("id",0)) < int(b.get("id",0)))
    for destination in ordered:
        if bool(destination.get("tradeDisabled",false)):
            continue
        var inbound_count: int = 0
        for c in shipments:
            if int(c.get("to",-1)) == int(destination.get("id",-1)):
                inbound_count += 1
        if inbound_count >= MAX_SHIPMENTS_PER_DESTINATION:
            continue
        var best_source: Dictionary = {}
        var best_goods: Dictionary = {}
        var best_path: Array = []
        var best_worth: float = 0.0
        for source in ordered:
            if int(source.get("id",-1)) == int(destination.get("id",-1)) or int(source.get("team",-1)) != int(destination.get("team",-1)):
                continue
            if bool(source.get("tradeDisabled",false)):
                continue
            var busy: bool = false
            for c in shipments:
                if int(c.get("from",-1)) == int(source.get("id",-1)):
                    busy = true
                    break
            if busy:
                continue
            var load: float = 52.0 if _ready_building(source,"market") else 36.0
            var goods: Dictionary = suggest_goods(state,source,destination,load)
            if goods.is_empty():
                continue
            var path: Array = world_nav.route(source,destination)
            if path.is_empty():
                continue
            var volume: float = 0.0
            for v in goods.values():
                volume += float(v)
            var worth: float = volume/sqrt(float(maxi(1,path.size())))
            if worth > best_worth:
                best_worth = worth
                best_source = source
                best_goods = goods
                best_path = path
        if best_goods.is_empty():
            continue
        if _commit_shipment(state,best_source,destination,best_goods,best_path):
            dispatched += 1
    state["trade_dispatched"] = int(state.get("trade_dispatched",0))+dispatched
    return dispatched

static func _commit_shipment(state: Dictionary,source: Dictionary,destination: Dictionary,goods: Dictionary,path: Array) -> bool:
    if goods.is_empty() or path.is_empty():
        return false
    var stock: Dictionary = source["resources"]
    for key in goods.keys():
        if float(stock.get(key,0.0)) + EPS < float(goods[key]):
            return false
    for key in goods.keys():
        stock[key] = maxf(0.0,float(stock.get(key,0.0)) - float(goods[key]))
    var shipment: Dictionary = {"id":int(state.get("next_shipment",1)),
        "team":int(destination.get("team",0)),"from":int(source["id"]),
        "to":int(destination["id"]),"c":int(source["c"]),
        "r":int(source["r"]),"path":path,"waypoint":0,
        "travel_clock":0.0,"goods":goods,"mode":"road",
        "status":"Teel","startedAt":float(state.get("seconds",0.0))}
    state["shipments"].append(shipment)
    state["next_shipment"] = int(state.get("next_shipment",1))+1
    return true

static func dispatch_pair(state: Dictionary,source_id: int,destination_id: int,world_nav) -> Dictionary:
    # Manual same-state test, subject to the same reserves/storage/route checks
    # as normal automatic V131 planTrade().
    if world_nav == null:
        return {"ok":false,"reason":"Maailmakaardi navigeerimine puudub"}
    var source: Dictionary = _find_destination(state,source_id)
    var destination: Dictionary = _find_destination(state,destination_id)
    if source.is_empty() or destination.is_empty() or source_id == destination_id:
        return {"ok":false,"reason":"Linna ei leitud"}
    if int(source.get("team",-1)) != int(destination.get("team",-1)):
        return {"ok":false,"reason":"Väliskaubandus ei ole selles pordis veel valmis"}
    for s in state.get("shipments",[]):
        if int(s.get("from",-1)) == source_id:
            return {"ok":false,"reason":"Saatvast linnast on kaupmees juba teel"}
    var inbound: int = 0
    for s in state.get("shipments",[]):
        if int(s.get("to",-1)) == destination_id:
            inbound += 1
    if inbound >= MAX_SHIPMENTS_PER_DESTINATION:
        return {"ok":false,"reason":"Sihtlinna on juba kaks saadetist teel"}
    var goods: Dictionary = suggest_goods(state,source,destination,52.0 if _ready_building(source,"market") else 36.0)
    if goods.is_empty():
        return {"ok":false,"reason":"Saadetavat ülejääki või nõudlust ei ole"}
    var route: Array = world_nav.route(source,destination)
    if route.is_empty():
        return {"ok":false,"reason":"Maanteed ei leitud"}
    if not _commit_shipment(state,source,destination,goods,route):
        return {"ok":false,"reason":"Saatmine ebaõnnestus"}
    state["trade_dispatched"] = int(state.get("trade_dispatched",0))+1
    return {"ok":true,"goods":goods.duplicate(true),"steps":route.size(),"reason":"Kaupmees väljus"}

static func _find_destination(state: Dictionary,city_id: int) -> Dictionary:
    for city in state.get("cities",[]):
        if int(city.get("id",-1)) == city_id:
            return city
    return {}

static func advance(state: Dictionary,dt: float,world_nav) -> Dictionary:
    var shipments: Array = state.get("shipments",[])
    var arrived: int = 0
    var unloaded_units: float = 0.0
    if dt <= 0.0:
        return {"arrived":0,"unloaded":0.0}
    var now: float = float(state.get("seconds",0.0))
    for i in range(shipments.size()-1,-1,-1):
        var cargo: Dictionary = shipments[i]
        var to: Dictionary = _find_destination(state,int(cargo.get("to",-1)))
        if to.is_empty() or int(to.get("team",-1)) != int(cargo.get("team",-1)):
            cargo["status"] = "Ootab: sihtlinna omanik muutus"
            continue
        var path: Array = cargo.get("path",[])
        var cursor: int = int(cargo.get("waypoint",0))
        if path.is_empty():
            cargo["status"] = "Ootab: marsruut puudub"
            continue
        if cursor < path.size():
            var clock: float = float(cargo.get("travel_clock",0.0)) + dt
            var roads: Dictionary = state.get("world_roads",{})
            while cursor < path.size():
                var cell: Array = path[cursor]
                var before := Vector2i(int(cargo.get("c",0)),int(cargo.get("r",0)))
                var after := Vector2i(int(cell[0]),int(cell[1]))
                # Existing highways make the 4s/world-tile road caravan faster.
                var seconds: float = 4.0/Roads.road_boost(roads,before,after,now)
                if clock + EPS < seconds:
                    break
                if world_nav != null and not world_nav.is_open(after):
                    # Do not destroy cargo or teleport to the destination.
                    # Replan from its CURRENT tile on a changed bridge network.
                    cargo["status"] = "Ootab: tee suletud"
                    if now >= float(cargo.get("replan_at",-1.0)):
                        cargo["replan_at"] = now+15.0
                        var replacement: Array = world_nav.route({"c":before.x,"r":before.y},to)
                        if not replacement.is_empty():
                            cargo["path"] = replacement
                            cargo["waypoint"] = 0
                            cursor = 0
                            cargo["status"] = "Uus maanteemarsruut"
                            state["trade_replans"] = int(state.get("trade_replans",0))+1
                    clock = 0.0
                    break
                clock -= seconds
                Roads.record_world_step(roads,before,after,"caravan",now)
                cargo["c"] = after.x
                cargo["r"] = after.y
                cursor += 1
            cargo["waypoint"] = cursor
            cargo["travel_clock"] = clock
        if cursor < path.size():
            continue
        # Arrival/blocked storage: partial deliveries are allowed and counted
        # exactly once. Remaining goods wait for newly freed warehouse space.
        var stock: Dictionary = to["resources"]
        var keys: Array = cargo.get("goods",{}).keys()
        for key in keys:
            var amount: float = float(cargo["goods"][key])
            var cap: float = Economy.storage_limit(to.get("buildings",[]),String(key))
            var available: float = maxf(0.0,cap-_storage_used(to,String(key)))
            var accepted: float = minf(amount,available)
            if accepted <= EPS:
                continue
            stock[key] = float(stock.get(key,0.0))+accepted
            cargo["goods"][key] = maxf(0.0,amount-accepted)
            unloaded_units += accepted
            if float(cargo["goods"][key]) <= EPS:
                cargo["goods"].erase(key)
        if cargo["goods"].is_empty():
            shipments.remove_at(i)
            arrived += 1
        else:
            cargo["status"] = "Ootab vaba laoruumi"
    state["trade_arrived"] = int(state.get("trade_arrived",0))+arrived
    state["trade_units_delivered"] = float(state.get("trade_units_delivered",0.0))+unloaded_units
    return {"arrived":arrived,"unloaded":unloaded_units}

static func age_roads(state: Dictionary) -> int:
    var roads: Dictionary = state.get("world_roads",{})
    return Roads.decay_world_roads(roads,float(state.get("seconds",0.0)))
