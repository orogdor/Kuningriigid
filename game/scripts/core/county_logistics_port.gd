extends RefCounted
## V2.4 county logistics. Every remote workshop owns its own input stock.
## Supplies are removed from city inventory at dispatch and credited at the
## worksite only upon arrival. Products return in independent physical loads.
## The atlas position helper is shared by both 3D renderers and save state.
const Economy = preload("res://scripts/core/economy_port.gd")
const Roads = preload("res://scripts/core/roads_port.gd")
const DetailNavigation = preload("res://scripts/core/detail_navigation_port.gd")
const MAX_LOAD: float = 18.0
const WORKER_TILE_SECONDS: float = 6.0
const CARGO_TILE_SECONDS: float = 4.0
const EPS: float = .000001

static func _cell(source: Dictionary) -> Vector2i:
    return Vector2i(int(source.get("c",0)),int(source.get("r",0)))

static func _as_dict(cell: Vector2i) -> Dictionary:
    return {"c":cell.x,"r":cell.y}

static func _stock_space(city: Dictionary,kind: String,state: Dictionary) -> float:
    var held: float = float(city.get("resources",{}).get(kind,0.0))
    for site in city.get("county_worksites",[]):
        if String(site.get("out","")) == kind:
            held += float(site.get("pending",0.0))
    for cargo in state.get("county_shipments",[]):
        if String(cargo.get("direction","return")) == "return" and int(cargo.get("city_id",-1)) == int(city.get("id",-1)) and String(cargo.get("good","")) == kind:
            held += float(cargo.get("amount",0.0))
    return maxf(0.0,Economy.storage_limit(city.get("buildings",[]),kind)-held)

static func _assign_path(agent: Dictionary,target: Vector2i,world_nav) -> bool:
    var source: Vector2i = _cell(agent)
    agent["destination"] = [target.x,target.y]
    if source == target:
        agent["detail_points"] = []
        agent["path"] = []
        agent["waypoint"] = 0
        agent["travel_clock"] = 0.0
        return true
    var path: Array = world_nav.route(_as_dict(source),_as_dict(target))
    if path.is_empty():
        agent["path"] = []
        agent["waypoint"] = 0
        agent["travel_clock"] = 0.0
        agent["status"] = "Tee puudub"
        return false
    # Validate every detail leg before resources can be reserved for dispatch.
    if world_nav.has_method("detail_edge"):
        var previous: Vector2i = source
        for next in path:
            var following := Vector2i(int(next[0]),int(next[1]))
            if not bool(world_nav.detail_edge(previous,following).get("ok",false)):
                agent["status"] = "Detailtee suletud"
                return false
            previous = following
    agent["path"] = path
    agent["detail_points"] = []
    agent["detail_version"] = -1
    agent["waypoint"] = 0
    agent["travel_clock"] = 0.0
    agent["status"] = "Teel"
    return true

static func _ensure_path(agent: Dictionary,target: Vector2i,world_nav) -> bool:
    if _cell(agent) == target:
        return true
    var route: Array = agent.get("path",[])
    var cursor: int = int(agent.get("waypoint",0))
    if agent.get("destination",[]) != [target.x,target.y] or cursor >= route.size():
        return _assign_path(agent,target,world_nav)
    var next: Array = route[cursor]
    if not world_nav.is_open(Vector2i(int(next[0]),int(next[1]))):
        return _assign_path(agent,target,world_nav)
    if world_nav.has_method("detail_edge"):
        var following := Vector2i(int(next[0]),int(next[1]))
        if not bool(world_nav.detail_edge(_cell(agent),following).get("ok",false)):
            agent["status"] = "Detailtee suletud"
            return false
    return true

static func world_position(agent: Dictionary,roads: Dictionary,now: float,is_worker: bool) -> Vector2:
    ## Coordinates are ATLAS cell centres (c+.5, r+.5). During transit an
    ## agent crosses tile boundaries continuously; rendering never teleports.
    var c: float = float(agent.get("c",0))
    var r: float = float(agent.get("r",0))
    var path: Array = agent.get("path",[])
    var cursor: int = int(agent.get("waypoint",0))
    if cursor >= 0 and cursor < path.size():
        var next: Array = path[cursor]
        var a: Vector2i = Vector2i(int(c),int(r))
        var b: Vector2i = Vector2i(int(next[0]),int(next[1]))
        if absi(b.x-a.x)+absi(b.y-a.y) == 1:
            var detail: Array = agent.get("detail_points",[])
            var multiplier: float = maxf(1.0,float(agent.get("detail_ratio",1.0)))
            var seconds: float = (WORKER_TILE_SECONDS if is_worker else CARGO_TILE_SECONDS)*multiplier/Roads.road_boost(roads,a,b,now)
            var alpha: float = clampf(float(agent.get("travel_clock",0.0))/maxf(.001,seconds),0.0,1.0)
            if detail.size() >= 2:
                var point: Vector2 = DetailNavigation.sample_track(detail,alpha)
                return point
            c = lerpf(c,float(b.x),alpha)
            r = lerpf(r,float(b.y),alpha)
    return Vector2(c+.5,r+.5)

static func _walk(agent: Dictionary,dt: float,roads: Dictionary,now: float,kind: String,world_nav) -> int:
    var route: Array = agent.get("path",[])
    var cursor: int = int(agent.get("waypoint",0))
    var elapsed: float = float(agent.get("travel_clock",0.0))+dt
    var steps: int = 0
    while cursor < route.size():
        var next: Array = route[cursor]
        var here: Vector2i = _cell(agent)
        var dest: Vector2i = Vector2i(int(next[0]),int(next[1]))
        if not world_nav.is_open(dest) or absi(dest.x-here.x)+absi(dest.y-here.y) != 1:
            agent["status"] = "Marsruut suletud"
            elapsed = 0.0
            break
        var base: float = WORKER_TILE_SECONDS if kind == "builder" else CARGO_TILE_SECONDS
        var multiplier: float = 1.0
        if world_nav.has_method("detail_edge"):
            var version: int = int(world_nav.detail_version())
            if int(agent.get("detail_version",-1)) != version or agent.get("detail_to",[]) != [dest.x,dest.y]:
                var fine: Dictionary = world_nav.detail_edge(here,dest)
                if not bool(fine.get("ok",false)):
                    agent["status"] = "Detailtee suletud"
                    elapsed = 0.0
                    break
                agent["detail_points"] = fine.get("points",[])
                agent["detail_ratio"] = maxf(1.0,float(fine.get("length",1.0)))
                agent["detail_to"] = [dest.x,dest.y]
                agent["detail_version"] = version
            multiplier = maxf(1.0,float(agent.get("detail_ratio",1.0)))
        var seconds: float = base*multiplier/Roads.road_boost(roads,here,dest,now)
        if elapsed+EPS < seconds:
            break
        elapsed -= seconds
        Roads.record_world_step(roads,here,dest,kind,now)
        agent["c"] = dest.x
        agent["r"] = dest.y
        cursor += 1
        agent["detail_points"] = []
        agent["detail_version"] = -1
        steps += 1
    agent["waypoint"] = cursor
    agent["travel_clock"] = elapsed if cursor < route.size() else 0.0
    if cursor == route.size():
        agent["status"] = "Kohal"
    return steps

static func _new_shipment(state: Dictionary,city: Dictionary,site_index: int,good: String,qty: float,start: Vector2i,target: Vector2i,mode: String,world_nav) -> bool:
    var path: Array = world_nav.route(_as_dict(start),_as_dict(target))
    if path.is_empty() and start != target:
        return false
    if world_nav.has_method("detail_edge"):
        var previous: Vector2i = start
        for next in path:
            var following := Vector2i(int(next[0]),int(next[1]))
            if not bool(world_nav.detail_edge(previous,following).get("ok",false)):
                return false
            previous = following
    var cargo: Dictionary = {"id":int(state.get("next_county_cargo",1)),"city_id":int(city.get("id",-1)),"team":int(city.get("team",0)),"site_index":site_index,"direction":mode,"good":good,"amount":qty,"c":start.x,"r":start.y,"path":path,"destination":[target.x,target.y],"waypoint":0,"travel_clock":0.0,"status":"Teel"}
    var shipments: Array = state.get("county_shipments",[])
    shipments.append(cargo)
    state["next_county_cargo"] = int(state.get("next_county_cargo",1))+1
    return true

static func advance_city(state: Dictionary,city: Dictionary,dt: float,world_nav) -> Dictionary:
    var stats: Dictionary = {"worker_steps":0,"cargo_steps":0,"produced":0,"shipped":0,"delivered":0,"units":0.0,"blocked":0,"supply_sent":0,"supply_received":0,"supply_units":0.0,"replanned":0}
    if dt <= 0.0 or world_nav == null:
        return stats
    var roads: Dictionary = state.get("world_roads",{})
    var now: float = float(state.get("seconds",0.0))
    var origin: Vector2i = _cell(city)
    var city_id: int = int(city.get("id",-1))
    var stock: Dictionary = city.get("resources",{})
    var worksites: Array = city.get("county_worksites",[])
    var shipments: Array = state.get("county_shipments",[])

    # 1. Existing cargo first. A just-dispatched supply cannot be used in the
    # same tick. Older V2.3 shipments lack 'direction' and remain returns.
    for idx in range(shipments.size()-1,-1,-1):
        var cargo: Dictionary = shipments[idx]
        if int(cargo.get("city_id",-1)) != city_id:
            continue
        var site_index: int = int(cargo.get("site_index",-1))
        var direction: String = String(cargo.get("direction","return"))
        var target: Vector2i = origin
        if direction == "supply" and site_index >= 0 and site_index < worksites.size():
            target = _cell(worksites[site_index])
        elif direction == "supply":
            # If a worksite is removed, return purchased inputs to its city.
            cargo["direction"] = "return"
            cargo["orphaned_supply"] = true
            target = origin
        if _cell(cargo) != target:
            var had: Array = cargo.get("destination",[])
            if not _ensure_path(cargo,target,world_nav):
                stats["blocked"] += 1
                continue
            if had != cargo.get("destination",[]):
                stats["replanned"] += 1
            stats["cargo_steps"] += _walk(cargo,dt,roads,now,"caravan",world_nav)
        if _cell(cargo) != target:
            continue
        var good: String = String(cargo.get("good",""))
        if String(cargo.get("direction","return")) == "supply":
            var site: Dictionary = worksites[site_index]
            var inputs: Dictionary = site.get("inputs",{})
            inputs[good] = float(inputs.get(good,0.0))+float(cargo.get("amount",0.0))
            site["inputs"] = inputs
            stats["supply_received"] += 1
            stats["supply_units"] += float(cargo.get("amount",0.0))
            shipments.remove_at(idx)
            continue
        var cap: float = Economy.storage_limit(city.get("buildings",[]),good)
        var accepted: float = minf(float(cargo.get("amount",0.0)),maxf(0.0,cap-float(stock.get(good,0.0))))
        if accepted > EPS:
            stock[good] = float(stock.get(good,0.0))+accepted
            cargo["amount"] = maxf(0.0,float(cargo.get("amount",0.0))-accepted)
            if not bool(cargo.get("orphaned_supply",false)):
                stats["units"] += accepted
        if float(cargo.get("amount",0.0)) <= EPS:
            shipments.remove_at(idx)
            stats["delivered"] += 1
        else:
            cargo["status"] = "Ladu täis"

    # 2. Assign staff and request missing INPUTS. Worksites never consume
    # resources remotely from the city inventory.
    var free: float = maxf(0.0,float(city.get("idle_workers",0.0)))
    for i in range(worksites.size()):
        var site: Dictionary = worksites[i]
        if float(site.get("hp",0.0)) <= 0.0 or bool(site.get("suspended",false)):
            site["assigned"] = 0.0
            continue
        var kind: String = String(site.get("type",""))
        var definition: Dictionary = Economy.BUILDINGS.get(kind,{})
        var assigned: float = minf(1.0,free)
        free -= assigned
        site["assigned"] = assigned
        if assigned <= 0.0:
            continue
        var destination: Vector2i = _cell(site)
        var worker: Dictionary = site.get("worker",{})
        if worker.is_empty():
            worker = {"c":origin.x,"r":origin.y,"path":[],"waypoint":0,"travel_clock":0.0,"status":"Teel"}
            site["worker"] = worker
        if _cell(worker) != destination:
            if not _ensure_path(worker,destination,world_nav):
                stats["blocked"] += 1
                continue
            stats["worker_steps"] += _walk(worker,dt,roads,now,"builder",world_nav)
            # Do not award a full work fragment on the arrival step.
            continue
        worker["status"] = "Ehitab" if not bool(site.get("ready",false)) else "Töötab"
        # Arrival consumes the fragment. No free production after commuting.
        if int(worker.get("waypoint",0)) > 0 and float(worker.get("travel_clock",0.0)) > 0.0:
            worker["travel_clock"] = 0.0
        var eff: float = pow(assigned,.85)
        if not bool(site.get("ready",false)):
            site["progress"] = float(site.get("progress",0.0))+dt*eff
            if float(site["progress"])+EPS >= float(site.get("time",0.0)):
                site["ready"] = true
                state["revision"] = int(state.get("revision",0))+1
            continue
        var good: String = String(definition.get("out",""))
        var cycle: float = float(definition.get("cycle",0.0))
        if good.is_empty() or cycle <= EPS:
            continue
        site["out"] = good
        var recipe: Dictionary = definition.get("input",{})
        var inputs: Dictionary = site.get("inputs",{})
        if not recipe.is_empty():
            var already: Dictionary = {}
            for cargo in shipments:
                if int(cargo.get("city_id",-1)) == city_id and int(cargo.get("site_index",-1)) == i and String(cargo.get("direction","return")) == "supply":
                    var key: String = String(cargo.get("good",""))
                    already[key] = float(already.get(key,0.0))+float(cargo.get("amount",0.0))
            for key in recipe.keys():
                var per_cycle: float = float(recipe[key])
                # Target a modest buffer (four cycles), never arbitrary stock.
                var deficit: float = maxf(0.0,per_cycle*4.0-float(inputs.get(key,0.0))-float(already.get(key,0.0)))
                var qty: float = minf(MAX_LOAD,minf(deficit,float(stock.get(key,0.0))))
                if qty > EPS and _new_shipment(state,city,i,String(key),qty,origin,destination,"supply",world_nav):
                    stock[key] = float(stock.get(key,0.0))-qty
                    already[key] = float(already.get(key,0.0))+qty
                    stats["supply_sent"] += 1
                elif deficit > EPS and float(stock.get(key,0.0)) > EPS and qty > EPS:
                    stats["blocked"] += 1
        site["timer"] = float(site.get("timer",0.0))+dt*eff*Economy.RESOURCE_PRODUCTION_MULTIPLIER
        var amount: float = float(definition.get("rate",0.0))
        for loop in range(4):
            if float(site["timer"])+EPS < cycle:
                break
            if not Economy.can_afford(inputs,recipe) or _stock_space(city,good,state)+EPS < amount:
                break
            Economy.spend_resources(inputs,recipe)
            site["inputs"] = inputs
            site["pending"] = float(site.get("pending",0.0))+amount
            site["timer"] = maxf(0.0,float(site["timer"])-cycle)
            stats["produced"] += 1
        var pending: float = float(site.get("pending",0.0))
        if pending <= EPS:
            continue
        var busy: bool = false
        for cargo in shipments:
            if String(cargo.get("direction","return")) == "return" and int(cargo.get("city_id",-1)) == city_id and int(cargo.get("site_index",-1)) == i:
                busy = true
                break
        if busy:
            continue
        var load: float = minf(MAX_LOAD,pending)
        if _new_shipment(state,city,i,good,load,destination,origin,"return",world_nav):
            site["pending"] = maxf(0.0,pending-load)
            stats["shipped"] += 1
        else:
            stats["blocked"] += 1
    city["idle_workers"] = free
    return stats
