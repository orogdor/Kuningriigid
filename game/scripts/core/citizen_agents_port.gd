extends RefCounted
## V0.9: V131 builders.js / operateWorker() adapted to the proxy town.
## Citizens are persistent saved agents with actual paths, not visual proxies.
## 1 physical builder per town while the V131 builderCount / multi-district
## implementation remains to be ported. Materials were paid at order time:
## material trips below represent carrying paid materials, NOT a second charge.
const Cargo = preload("res://scripts/core/cargo_port.gd")
const Economy = preload("res://scripts/core/economy_port.gd")
const SPEED: float = 3.0
const EPS: float = 0.00001
const LOAD_SIZE: float = 24.0

static func _entry(city: Dictionary, index: int, navigator) -> Vector2:
    if navigator != null:
        return navigator.entry_position(city,index)
    return Cargo.building_position(city,index)

static func _agent(city: Dictionary, key: String, kind: String, navigator) -> Dictionary:
    var all_agents: Dictionary = city.get("citizens",{})
    if not city.has("citizens"):
        city["citizens"] = all_agents
    if all_agents.has(key):
        return all_agents[key]
    var start: Vector2 = _entry(city,0,navigator)
    var item: Dictionary = {"kind":kind,"x":start.x,"z":start.y,"phase":"home","target":-1,
        "path_points":[],"waypoint":1,"path_signature":"","load":0.0,"status":"Kodus"}
    all_agents[key] = item
    return item

# Reuse the exact same route state / building-door navigation for residents.
static func ensure_agent_at(city: Dictionary, key: String, kind: String, home: int, navigator = null) -> Dictionary:
    var agents: Dictionary = city.get("citizens",{})
    if not city.has("citizens"):
        city["citizens"] = agents
    if agents.has(key):
        return agents[key]
    var origin: Vector2 = _entry(city,home,navigator)
    var item: Dictionary = {"kind":kind,"x":origin.x,"z":origin.y,"phase":"market",
        "target":-1,"path_points":[],"waypoint":1,"path_signature":"",
        "load":0.0,"status":"Kodus","carried":0.0,"breadLoad":0.0,"waterLoad":0.0}
    agents[key] = item
    return item

static func walk_to(city: Dictionary, agent: Dictionary, target: int, dt: float, navigator = null) -> bool:
    return _walk(city,agent,target,dt,navigator)

static func _walk(city: Dictionary, agent: Dictionary, target: int, dt: float, navigator) -> bool:
    if dt <= 0.0:
        return false
    var goal: Vector2 = _entry(city,target,navigator)
    var pos := Vector2(float(agent.get("x",goal.x)),float(agent.get("z",goal.y)))
    var signature: String = navigator.signature(city) if navigator != null else "direct"
    if int(agent.get("target",-1)) != target or String(agent.get("path_signature","")) != signature or not agent.has("path_points") or agent["path_points"].is_empty():
        var route: Array = navigator.route_from_position(city,pos,target) if navigator != null else [[pos.x,pos.y],[goal.x,goal.y]]
        agent["path_points"] = route
        agent["waypoint"] = 1
        agent["target"] = target
        agent["path_signature"] = signature
    var points: Array = agent["path_points"]
    if points.is_empty():
        agent["status"] = "Tee puudub"
        return false
    var cursor: int = int(agent.get("waypoint",1))
    var distance_left: float = SPEED * dt
    while cursor < points.size():
        var point: Array = points[cursor]
        var next := Vector2(float(point[0]),float(point[1]))
        var distance: float = pos.distance_to(next)
        if distance > distance_left + EPS:
            pos += (next-pos).normalized() * distance_left
            break
        pos = next
        distance_left -= distance
        cursor += 1
    agent["x"] = pos.x
    agent["z"] = pos.y
    agent["waypoint"] = cursor
    return cursor >= points.size()

static func _depot(city: Dictionary) -> int:
    for i in range(city.get("buildings",[]).size()):
        var b: Dictionary = city["buildings"][i]
        if String(b.get("type","")) == "warehouse" and bool(b.get("ready",false)) and float(b.get("hp",0.0)) > 0.0:
            return i
    return 0

static func advance(city: Dictionary, dt: float, navigator = null) -> Dictionary:
    var result: Dictionary = {"build_work":{},"present":{},"moving":0,"working":0,"hauled":0.0,"active":0}
    if dt <= 0.0:
        return result
    var buildings: Array = city.get("buildings",[])
    if buildings.is_empty():
        return result
    # Hide agents assigned to jobs that are no longer staffed; keep their
    # positions so an assignment can resume without teleportation.
    for old in city.get("citizens",{}).values():
        if String(old.get("kind","")) == "worker":
            old["status"] = "Kodus"
    # One physical commuting worker for each staffed workplace. This represents
    # a V131 fractional worker team; more assigned labor changes efficiency.
    for i in range(1,buildings.size()):
        var b: Dictionary = buildings[i]
        if not bool(b.get("ready",false)) or bool(b.get("disabled",false)) or float(b.get("assigned",0.0)) <= 0.0:
            continue
        var definition: Dictionary = Economy.BUILDINGS.get(String(b.get("type","")),{})
        if float(definition.get("workers",0.0)) <= 0.0:
            continue
        var worker: Dictionary = _agent(city,"job:%d" % i,"worker",navigator)
        result["active"] += 1
        if _walk(city,worker,i,dt,navigator):
            result["present"][i] = true
            worker["status"] = "Töötab"
            result["working"] += 1
        else:
            if String(worker.get("status","")) != "Tee puudub":
                worker["status"] = "Läheb tööle"
            result["moving"] += 1
    # Builder travels for material at a ready depot and then carries it to the
    # construction site before work is allowed to progress. Paid in advance.
    if float(city.get("builders_assigned",0.0)) <= 0.0:
        if city.get("citizens",{}).has("builder:0"):
            city["citizens"]["builder:0"]["status"] = "Kodus"
        return result
    var index: int = -1
    for i in range(buildings.size()):
        var b: Dictionary = buildings[i]
        if not bool(b.get("ready",false)) and not bool(b.get("disabled",false)) and float(b.get("hp",0.0)) > 0.0:
            index = i
            break
    if index < 0:
        if city.get("citizens",{}).has("builder:0"):
            city["citizens"]["builder:0"]["status"] = "Kodus"
        return result
    var site: Dictionary = buildings[index]
    var agent: Dictionary = _agent(city,"builder:0","builder",navigator)
    result["active"] += 1
    var job_key: String = str(index)
    if String(agent.get("job","")) != job_key:
        agent["job"] = job_key
        agent["load"] = 0.0
        agent["phase"] = "depot" if float(site.get("materialsRemaining",0.0)) > EPS else "work"
        agent["target"] = -1
    var share: float = clampf(float(city.get("builders_assigned",0.0)),0.0,1.0)
    var phase: String = String(agent.get("phase","depot"))
    if phase == "depot":
        var source: int = _depot(city)
        if _walk(city,agent,source,dt*share,navigator):
            agent["load"] = minf(LOAD_SIZE,maxf(0.0,float(site.get("materialsRemaining",0.0))))
            agent["phase"] = "deliver"
            agent["target"] = -1
            agent["status"] = "Võttis materjali"
        else:
            if String(agent.get("status","")) != "Tee puudub":
                agent["status"] = "Läheb lattu"
        result["moving"] += 1
    elif phase == "deliver":
        if _walk(city,agent,index,dt*share,navigator):
            var carried: float = minf(float(agent.get("load",0.0)),maxf(0.0,float(site.get("materialsRemaining",0.0))))
            site["materialsRemaining"] = maxf(0.0,float(site.get("materialsRemaining",0.0)) - carried)
            agent["load"] = 0.0
            result["hauled"] = carried
            agent["phase"] = "work" if float(site["materialsRemaining"]) <= EPS else "depot"
            agent["target"] = -1
            agent["status"] = "Materjalid kohal" if agent["phase"] == "work" else "Toob järgmise koorma"
        else:
            if String(agent.get("status","")) != "Tee puudub":
                agent["status"] = "Veab materjali"
        result["moving"] += 1
    else:
        if _walk(city,agent,index,dt*share,navigator):
            result["build_work"][index] = dt*share
            agent["status"] = "Ehitab"
            result["working"] += 1
        else:
            if String(agent.get("status","")) != "Tee puudub":
                agent["status"] = "Läheb ehitama"
            result["moving"] += 1
    return result
