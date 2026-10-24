extends RefCounted
## V2.1 LOCAL BENCHMARK: one stable building parcel for economy, routes and 3D.
## This is a dense approximate town plan, NOT the historical V131 town planner.
## Site dimensions use atlas-scale proxy units (1 = 10 detail metres).
const VERSION: int = 21
const LOT_GAP: float = 0.16
const LIMIT_X: float = 10.65
const LIMIT_Z: float = 9.10
const GRID_PITCH: float = 0.88
const FOOTPRINTS: Dictionary = {
    "hall":Vector2(1.2,1.05),"house":Vector2(.75,.65),
    "market":Vector2(1.8,1.4),"farm":Vector2(1.1,1.2),
    "quarry":Vector2(1.1,1.0),"mine":Vector2(1.1,1.0),"coal":Vector2(1.1,1.0),
    "well":Vector2(.42,.42),"barracks":Vector2(1.2,1.0),
    "saw":Vector2(1.2,1.0),"mill":Vector2(1.2,1.0),
    "warehouse":Vector2(1.1,1.0),"cellar":Vector2(1.0,.88),
    "lumber":Vector2(.85,.85),"hunter":Vector2(.85,.85)
}

static func footprint(kind: String) -> Vector2:
    return FOOTPRINTS.get(kind,Vector2(.85,.8))

static func center(city: Dictionary) -> Vector2:
    return Vector2(float(city.get("c",0))+.5,float(city.get("r",0))+.5)

static func overlap(a: Vector2,kind_a: String,b: Vector2,kind_b: String) -> bool:
    var x: float = (footprint(kind_a).x+footprint(kind_b).x)*.5+LOT_GAP
    var z: float = (footprint(kind_a).y+footprint(kind_b).y)*.5+LOT_GAP
    return absf(a.x-b.x)<x and absf(a.y-b.y)<z

static func within_lot(pos: Vector2,kind: String) -> bool:
    var size: Vector2 = footprint(kind)*.5
    return absf(pos.x)+size.x <= LIMIT_X and absf(pos.y)+size.y <= LIMIT_Z

static func _candidate(gx: int,gz: int) -> Vector2:
    # Shift away from the two civic streets. Civic hall is on their junction.
    var dx: float = float(gx)*GRID_PITCH
    var dz: float = float(gz)*GRID_PITCH
    if gx > 0:
        dx += .28
    elif gx < 0:
        dx -= .28
    if gz > 0:
        dz += .28
    elif gz < 0:
        dz -= .28
    return Vector2(dx,dz)

static func find_free_site(city: Dictionary,kind: String,used: Array,landscape = null) -> Dictionary:
    # Ring walk: new urban buildings start next to the civic centre, not on
    # disconnected random squares. Light zoning only breaks equal-distance ties.
    # Leave 3.0m continuous cross streets at x=0 and z=0 outside the hall.
    var max_ring: int = 15
    for ring in range(1,max_ring+1):
        var candidates: Array = []
        for gz in range(-ring,ring+1):
            for gx in range(-ring,ring+1):
                if maxi(absi(gx),absi(gz)) != ring:
                    continue
                if gx == 0 or gz == 0:
                    continue
                var candidate: Vector2 = _candidate(gx,gz)
                if not within_lot(candidate,kind):
                    continue
                if landscape != null:
                    var tile := Vector2i(int(city.get("c",0)),int(city.get("r",0)))
                    var radius: float = maxf(footprint(kind).x,footprint(kind).y)*5.0
                    if not landscape.buildable_at(tile,candidate*10.0,radius):
                        continue
                var score: float = candidate.length_squared()
                # In an otherwise equally near ring, food/resource producers
                # prefer the outskirts; homes prefer proximity to the hall.
                if kind in ["farm","quarry","mine","coal","lumber"]:
                    score -= float(ring)*.06
                if kind == "house":
                    score += float(ring)*.06
                candidates.append({"point":candidate,"score":score})
        candidates.sort_custom(func(a,b): return float(a["score"]) < float(b["score"]))
        for candidate in candidates:
            var p: Vector2 = candidate["point"]
            var open: bool = true
            for parcel in used:
                if overlap(p,kind,parcel["point"],String(parcel["kind"])):
                    open = false
                    break
            if open:
                return {"ok":true,"point":p}
    return {"ok":false,"reason":"Linna detailruut on hoonetega täidetud"}

static func ensure_positions(city: Dictionary) -> bool:
    var buildings: Array = city.get("buildings",[])
    if buildings.is_empty():
        return true
    var origin: Vector2 = center(city)
    var used: Array = []
    var complete: bool = true
    for i in range(buildings.size()):
        var building: Dictionary = buildings[i]
        var kind: String = String(building.get("type","house"))
        var local: Vector2
        if building.has("site_x") and building.has("site_z"):
            local = Vector2(float(building["site_x"]),float(building["site_z"]))-origin
        elif i == 0:
            local = Vector2.ZERO
            building["site_x"] = origin.x
            building["site_z"] = origin.y
        else:
            var site: Dictionary = find_free_site(city,kind,used)
            if not bool(site["ok"]):
                complete = false
                continue
            local = site["point"]
            building["site_x"] = origin.x+local.x
            building["site_z"] = origin.y+local.y
        used.append({"point":local,"kind":kind})
    city["layout_v21"] = VERSION
    return complete

static func position(city: Dictionary,index: int) -> Vector2:
    var buildings: Array = city.get("buildings",[])
    if buildings.is_empty() or index < 0 or index >= buildings.size():
        return center(city)
    var b: Dictionary = buildings[index]
    if not b.has("site_x") or not b.has("site_z"):
        ensure_positions(city)
    return Vector2(float(b.get("site_x",center(city).x)),float(b.get("site_z",center(city).y)))

static func check_clear(city: Dictionary) -> bool:
    var buildings: Array = city.get("buildings",[])
    for i in range(buildings.size()):
        var a: Dictionary = buildings[i]
        if not a.has("site_x") or not a.has("site_z"):
            return false
        var pa: Vector2 = position(city,i)-center(city)
        var ka: String = String(a.get("type",""))
        if not within_lot(pa,ka):
            return false
        for j in range(i):
            if overlap(pa,ka,position(city,j)-center(city),String(buildings[j].get("type",""))):
                return false
    return true
