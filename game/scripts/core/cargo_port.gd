extends RefCounted
## V131 economy.js cargo-cycle adapter. Shipments exist between production
## and storage, rather than instantly granting produced resources to the city.
## IMPORTANT: This is a deterministic proxy of physical hauling: it follows
## short direct local routes to a ready depot, not V131 nav.moveCitizen()
## or the original parent's multi-hop street graph.
const Economy = preload("res://scripts/core/economy_port.gd")
const CityLayout = preload("res://scripts/core/city_layout_port.gd")
const Needs = preload("res://scripts/core/city_needs_port.gd")
const SPEED: float = 4.0
const EPS: float = 0.00001

static func building_position(city: Dictionary, index: int) -> Vector2:
    return CityLayout.position(city,index)

static func pending(city: Dictionary, key: String = "") -> float:
    var amount: float = 0.0
    for shipment in city.get("cargo",[]):
        if key.is_empty() or String(shipment.get("key","")) == key:
            amount += maxf(0.0,float(shipment.get("amount",0.0)))
    return amount

static func food_pending(city: Dictionary) -> float:
    var amount: float = 0.0
    for shipment in city.get("cargo",[]):
        if String(shipment.get("key","")) in Needs.food_keys():
            amount += maxf(0.0,float(shipment.get("amount",0.0)))
    return amount

static func dispatch(city: Dictionary, source: int, key: String, amount: float, navigator = null) -> bool:
    if amount <= 0.0 or key.is_empty():
        return false
    var buildings: Array = city.get("buildings",[])
    if source < 0 or source >= buildings.size():
        return false
    if not city.has("cargo"):
        city["cargo"] = []
    var pos: Vector2 = navigator.entry_position(city,source) if navigator != null else building_position(city,source)
    city["cargo"].append({"key":key,"amount":amount,"x":pos.x,"z":pos.y,
        "source":source,"target":0,"status":"Teel lattu"})
    return true

static func _depot_index(city: Dictionary, key: String) -> int:
    var kind: String = "warehouse" if key in Economy.MATERIAL_KEYS else ("cellar" if key in Needs.food_keys() else "")
    if kind.is_empty():
        return 0
    var buildings: Array = city.get("buildings",[])
    for i in range(buildings.size()):
        var b: Dictionary = buildings[i]
        if String(b.get("type","")) == kind and bool(b.get("ready",false)) and float(b.get("hp",0.0)) > 0.0:
            return i
    return 0

static func _free_storage(city: Dictionary,key: String) -> float:
    var stock: Dictionary = city["resources"]
    var cap: float = Economy.storage_limit(city["buildings"],key)
    if is_inf(cap):
        return INF
    var used: float = float(stock.get(key,0.0))
    if key in Needs.food_keys():
        used = 0.0
        for food_key in Needs.food_keys():
            used += float(stock.get(food_key,0.0))
    return maxf(0.0,cap - used)

static func advance(city: Dictionary, dt: float, navigator = null) -> Dictionary:
    var cargo: Array = city.get("cargo",[])
    var delivered_count: int = 0
    var delivered_amount: float = 0.0
    if dt <= 0.0 or cargo.is_empty():
        return {"deliveries":0,"amount":0.0}
    for i in range(cargo.size()-1,-1,-1):
        var shipment: Dictionary = cargo[i]
        var key: String = String(shipment.get("key",""))
        var target_idx: int = _depot_index(city,key)
        shipment["target"] = target_idx
        var destination: Vector2 = navigator.entry_position(city,target_idx) if navigator != null else building_position(city,target_idx)
        var current := Vector2(float(shipment.get("x",destination.x)),float(shipment.get("z",destination.y)))
        var arrived: bool = false
        if navigator != null:
            # The cache signature changes on building placement/demolition.
            # Avoid stale paths through a newly constructed building.
            var sig: String = navigator.signature(city)
            if shipment.get("path_signature","") != sig or int(shipment.get("route_target",-1)) != target_idx or shipment.get("path_points",[]).is_empty():
                var has_progress: bool = not shipment.get("path_points",[]).is_empty() or not current.is_equal_approx(building_position(city,int(shipment.get("source",0)))) and current.distance_to(navigator.entry_position(city,int(shipment.get("source",0)))) > .01
                shipment["path_points"] = navigator.route_from_position(city,current,target_idx) if has_progress else navigator.route(city,int(shipment.get("source",0)),target_idx)
                shipment["path_signature"] = sig
                shipment["route_target"] = target_idx
                shipment["waypoint"] = 1
            var points: Array = shipment.get("path_points",[])
            if points.is_empty():
                shipment["status"] = "Marsruuti ei leitud"
                continue
            var cursor: int = int(shipment.get("waypoint",1))
            var travel: float = SPEED * dt
            while cursor < points.size():
                var pair: Array = points[cursor]
                var goal: Vector2 = Vector2(float(pair[0]),float(pair[1]))
                var distance: float = current.distance_to(goal)
                if distance > travel + EPS:
                    current += (goal-current).normalized() * travel
                    travel = 0.0
                    break
                current = goal
                travel -= distance
                cursor += 1
            shipment["waypoint"] = cursor
            arrived = cursor >= points.size()
        else:
            # Legacy direct mode is retained for isolated v0.7 parity tests.
            var delta: Vector2 = destination-current
            arrived = delta.length() <= SPEED * dt + EPS
            if not arrived:
                current += delta.normalized() * SPEED * dt
            else:
                current = destination
        shipment["x"] = current.x
        shipment["z"] = current.y
        if not arrived:
            continue
        var free: float = _free_storage(city,key)
        var unloaded: float = minf(maxf(0.0,float(shipment.get("amount",0.0))),free)
        if unloaded > EPS:
            city["resources"][key] = float(city["resources"].get(key,0.0)) + unloaded
            shipment["amount"] = float(shipment["amount"]) - unloaded
            delivered_amount += unloaded
            delivered_count += 1
        if float(shipment.get("amount",0.0)) <= EPS:
            cargo.remove_at(i)
        else:
            shipment["status"] = "Ladu täis"
    return {"deliveries":delivered_count,"amount":delivered_amount}
