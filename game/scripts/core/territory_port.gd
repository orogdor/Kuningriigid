extends RefCounted
## V2.2: V131 counties-v126.js connected, with the user's faster urban
## growth request. Per-city territory is recalculated on population changes.
## Pure functions. All persisted coordinates are JSON-safe [c,r] arrays.
const Counties = preload("res://scripts/core/counties_port.gd")
const Economy = preload("res://scripts/core/economy_port.gd")
const Build = preload("res://scripts/core/building_rules_port.gd")
const COLS: int = 220
const ROWS: int = 165
const MAX_URBAN_SIDE: int = 12
const MAX_WORKSITES_PER_TILE: int = 3
const RESOURCE_TYPES: Array[String] = ["lumber","farm","quarry","mine"]

static func urban_radius(population: int) -> int:
    # V153 city-area-v142.js: populationCityRadius(pop).
    # 3 -> 3x3, 9 -> 7x7, 25 -> 11x11, 36+ -> 12x12.
    return mini(MAX_URBAN_SIDE / 2, maxi(1, floori(sqrt(float(maxi(0,population))))))

static func urban_side(population: int) -> int:
    # V153 cityExtent(radius): never allow a 13x13 built-up area.
    return mini(MAX_URBAN_SIDE, 2*urban_radius(population)+1)

static func tile_key(c: int,r: int) -> String:
    return "%d:%d" % [c,r]

static func source_signature(state: Dictionary) -> String:
    var parts: PackedStringArray = []
    for city in state.get("cities",[]):
        parts.append("%d:%d:%d:%d" % [int(city.get("c",0)),int(city.get("r",0)),int(city.get("pop",3)),int(city.get("team",0))])
    return "|".join(parts)

static func rebuild(state: Dictionary, land: PackedByteArray,force: bool = false) -> bool:
    if land.size() != COLS*ROWS:
        return false
    var stamp: String = source_signature(state)
    if not force and stamp == String(state.get("territory_source", "")):
        return false
    var cities: Array = state.get("cities",[])
    var candidates: Dictionary = {}
    var protected_cores: Dictionary = {}
    for i in range(cities.size()):
        var city: Dictionary = cities[i]
        var c: int = int(city.get("c",-1))
        var r: int = int(city.get("r",-1))
        protected_cores[tile_key(c,r)] = i
    for i in range(cities.size()):
        var city: Dictionary = cities[i]
        var radius: int = urban_radius(int(city.get("pop",3)))
        city["territory_radius"] = radius
        var limit: int = Counties.county_tile_limit(radius)
        var base: Array = Counties.county_footprint(city,radius,land)
        var seen: Dictionary = {}
        var eligible: Array = []
        for p in base:
            var pos: Vector2i = p
            var key: String = tile_key(pos.x,pos.y)
            if seen.has(key) or land[pos.y*COLS+pos.x] == 0:
                continue
            seen[key] = true
            eligible.append(pos)
        # Claim candidates are connected through land before borders compete.
        # Core ownership is reserved, even when another city has more people.
        for pos in eligible.slice(0,limit):
            var p: Vector2i = pos
            var key: String = tile_key(p.x,p.y)
            if protected_cores.has(key) and int(protected_cores[key]) != i:
                continue
            var dist_sq: int = (p.x-int(city["c"]))* (p.x-int(city["c"])) + (p.y-int(city["r"]))* (p.y-int(city["r"]))
            var bid: Dictionary = {"index":i,"population":int(city.get("pop",3)),"distance":dist_sq}
            if not candidates.has(key) or _better(bid,candidates[key]):
                candidates[key] = bid
    var owners: Dictionary = {}
    for key in candidates:
        owners[key] = int(protected_cores.get(key,candidates[key]["index"]))
    for key in protected_cores:
        owners[key] = int(protected_cores[key])
    var county_lists: Array = []
    for i in range(cities.size()):
        county_lists.append([])
    for key in owners:
        var xy: PackedStringArray = String(key).split(":")
        county_lists[int(owners[key])].append([int(xy[0]),int(xy[1])])
    var zones: Dictionary = {}
    for i in range(cities.size()):
        var city: Dictionary = cities[i]
        var center := Vector2i(int(city["c"]),int(city["r"]))
        var radius: int = int(city["territory_radius"])
        var side: int = urban_side(int(city.get("pop",3)))
        var area: int = side*side
        city["territory_side"] = side
        var tiles: Array = county_lists[i]
        tiles.sort_custom(func(a,b):
            var da: int = (int(a[0])-center.x)*(int(a[0])-center.x)+(int(a[1])-center.y)*(int(a[1])-center.y)
            var db: int = (int(b[0])-center.x)*(int(b[0])-center.x)+(int(b[1])-center.y)*(int(b[1])-center.y)
            if da != db:
                return da < db
            if int(a[1]) != int(b[1]):
                return int(a[1]) < int(b[1])
            return int(a[0]) < int(b[0])
        )
        # Fill any missing peripheral county area by connected land search.
        # The previous square-ring fallback could skip a sea barrier and claim
        # an isolated shore without a road or land connection to the city.
        if tiles.size() < area:
            var frontier: Array[Vector2i] = [center]
            var visited: Dictionary = {tile_key(center.x,center.y):true}
            var cursor: int = 0
            while cursor < frontier.size() and tiles.size() < area:
                var from: Vector2i = frontier[cursor]
                cursor += 1
                for offset in [Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1)]:
                    var next: Vector2i = from+offset
                    if next.x < 0 or next.x >= COLS or next.y < 0 or next.y >= ROWS:
                        continue
                    var near_key: String = tile_key(next.x,next.y)
                    if visited.has(near_key):
                        continue
                    visited[near_key] = true
                    if land[next.y*COLS+next.x] == 0:
                        continue
                    if owners.has(near_key):
                        # Search *through* occupied land to find nearby free
                        # land for a surrounded smaller town, without stealing
                        # established neighbour tiles or crossing open water.
                        frontier.append(next)
                        continue
                    owners[near_key] = i
                    tiles.append([next.x,next.y])
                    frontier.append(next)
                    if tiles.size() >= area:
                        break
        tiles.sort_custom(func(a,b):
            var da: int = (int(a[0])-center.x)*(int(a[0])-center.x)+(int(a[1])-center.y)*(int(a[1])-center.y)
            var db: int = (int(b[0])-center.x)*(int(b[0])-center.x)+(int(b[1])-center.y)*(int(b[1])-center.y)
            return da < db if da != db else (int(a[1]) < int(b[1]) if int(a[1]) != int(b[1]) else int(a[0]) < int(b[0]))
        )
        var urban: Array = []
        # The coastline and competing cities may shift the allocation. Enforce
        # the 12x12 MAXIMUM ACTUAL bounding box, not merely tile count.
        var min_c: int = center.x
        var max_c: int = center.x
        var min_r: int = center.y
        var max_r: int = center.y
        for p in tiles:
            if urban.size() >= area:
                break
            var c: int = int(p[0])
            var r: int = int(p[1])
            var low_c: int = mini(min_c,c)
            var high_c: int = maxi(max_c,c)
            var low_r: int = mini(min_r,r)
            var high_r: int = maxi(max_r,r)
            if high_c-low_c >= side or high_r-low_r >= side:
                continue
            urban.append([c,r])
            zones[tile_key(c,r)] = "urban"
            min_c = low_c
            max_c = high_c
            min_r = low_r
            max_r = high_r
        city["territory_urban"] = urban
        city["territory_county"] = tiles.duplicate(true)
    state["territory_owners"] = owners
    state["territory_zones"] = zones
    state["territory_source"] = stamp
    state["territory_revision"] = int(state.get("territory_revision",0))+1
    return true

static func _better(a: Dictionary,b: Dictionary) -> bool:
    if int(a["population"]) != int(b["population"]):
        return int(a["population"]) > int(b["population"])
    if int(a["distance"]) != int(b["distance"]):
        return int(a["distance"]) < int(b["distance"])
    return int(a["index"]) < int(b["index"])

static func owner_at(state: Dictionary,c: int,r: int) -> int:
    return int(state.get("territory_owners",{}).get(tile_key(c,r),-1))

static func zone_at(state: Dictionary,c: int,r: int) -> String:
    return String(state.get("territory_zones",{}).get(tile_key(c,r),"county"))

static func deposit_kind(kind: String,c: int,r: int,land: PackedByteArray,heights: PackedFloat32Array) -> bool:
    if c<0 or r<0 or c>=COLS or r>=ROWS or land[r*COLS+c]==0:
        return false
    var h: float = heights[r*COLS+c]
    # Deterministic preview deposits, not yet V131 seeded mineral data.
    if kind == "quarry":
        return h >= 2.1
    if kind == "mine":
        return h >= 3.2
    if kind == "farm":
        return h < 3.4 and h > 0.0
    if kind == "lumber":
        return h >= .4 and sin(float(c)*.74+float(r)*.31) > -.12
    return false

static func worksite_at(city: Dictionary,c: int,r: int) -> int:
    var count: int = 0
    for site in city.get("county_worksites",[]):
        if int(site.get("c",-1)) == c and int(site.get("r",-1)) == r:
            count += 1
    return count

static func choose_worksite(state: Dictionary,city_index: int,kind: String,land: PackedByteArray,heights: PackedFloat32Array) -> Dictionary:
    if not RESOURCE_TYPES.has(kind):
        return {"ok":false,"reason":"Maakonnas lubatud: mets, põld, kivimurd, kaevandus"}
    var cities: Array = state.get("cities",[])
    if city_index < 0 or city_index >= cities.size():
        return {"ok":false,"reason":"Linn puudub"}
    var city: Dictionary = cities[city_index]
    var center := Vector2i(int(city["c"]),int(city["r"]))
    for p in city.get("territory_county",[]):
        var c: int = int(p[0])
        var r: int = int(p[1])
        if c == center.x and r == center.y:
            continue
        if worksite_at(city,c,r) >= MAX_WORKSITES_PER_TILE:
            continue
        if owner_at(state,c,r) != city_index:
            continue
        if deposit_kind(kind,c,r,land,heights):
            return {"ok":true,"c":c,"r":r,"distance":maxi(absi(c-center.x),absi(r-center.y))}
    return {"ok":false,"reason":"Oma maakonnas pole sobivat vaba maardlat / põllumaad"}

static func build_worksite(state: Dictionary,city_index: int,kind: String,land: PackedByteArray,heights: PackedFloat32Array) -> Dictionary:
    var towns: Array = state.get("cities",[])
    if city_index < 0 or city_index >= towns.size() or not RESOURCE_TYPES.has(kind):
        return {"ok":false,"reason":"Sobimatu linn või tootmishoone"}
    var city: Dictionary = towns[city_index]
    var definitions: Dictionary = Economy.BUILDINGS.get(kind,{})
    var known: Dictionary = state["teams"][int(city["team"])]["known"]
    var pending: int = 0
    for site in city.get("county_worksites",[]):
        if not bool(site.get("ready",false)):
            pending += 1
    var reason: String = Build.build_error(kind,city,known,pending)
    if not reason.is_empty():
        return {"ok":false,"reason":reason}
    var selected: Dictionary = choose_worksite(state,city_index,kind,land,heights)
    if not bool(selected.get("ok",false)):
        return selected
    Economy.spend_resources(city["resources"],definitions["cost"])
    if not city.has("county_worksites"):
        city["county_worksites"] = []
    var site: Dictionary = {"type":kind,"c":int(selected["c"]),"r":int(selected["r"]),"distance":int(selected["distance"]),"ready":false,"progress":0.0,"time":float(definitions["time"]),"timer":0.0,"hp":350.0}
    city["county_worksites"].append(site)
    state["revision"] = int(state.get("revision",0))+1
    return {"ok":true,"reason":"Maakonna ehitus: %s ruudul %d,%d" % [kind,int(site["c"]),int(site["r"])],"site":site}

static func advance_worksites(city: Dictionary,dt: float) -> int:
    # Preview approximation: remote worker assignment and the one-way road
    # penalty are modelled; walking/cargo caravans are NOT yet simulated.
    var free: float = maxf(0.0,float(city.get("idle_workers",0.0)))
    var produced: int = 0
    var stock: Dictionary = city.get("resources",{})
    for site in city.get("county_worksites",[]):
        if float(site.get("hp",0.0)) <= 0.0 or bool(site.get("suspended",false)):
            continue
        var definition: Dictionary = Economy.BUILDINGS.get(String(site["type"]),{})
        var assigned: float = minf(1.0,free)
        free -= assigned
        site["assigned"] = assigned
        if assigned <= 0.0:
            continue
        var efficiency: float = pow(assigned,.85)/(1.0+float(site.get("distance",0))*.15)
        if not bool(site.get("ready",false)):
            site["progress"] = float(site.get("progress",0.0)) + dt*efficiency
            if float(site["progress"]) >= float(site["time"]):
                site["ready"] = true
            continue
        var output: String = String(definition.get("out",""))
        var cycle: float = float(definition.get("cycle",0.0))
        if output.is_empty() or cycle <= 0.0:
            continue
        site["timer"] = float(site.get("timer",0.0)) + dt*efficiency*Economy.RESOURCE_PRODUCTION_MULTIPLIER
        var recipe: Dictionary = definition.get("input",{})
        if float(site["timer"]) >= cycle and Economy.can_afford(stock,recipe):
            var rate: float = float(definition.get("rate",0.0))
            if float(stock.get(output,0.0))+rate <= Economy.storage_limit(city.get("buildings",[]),output):
                Economy.spend_resources(stock,recipe)
                stock[output] = float(stock.get(output,0.0)) + rate
                site["timer"] = maxf(0.0,float(site["timer"])-cycle)
                produced += 1
    city["idle_workers"] = free
    return produced

static func reconcile_worksites(state: Dictionary,land: PackedByteArray,heights: PackedFloat32Array) -> int:
    # An expanding stronger town may take a district; existing rural sites
    # relocate to the closest usable OWNED cell rather than mining enemy land.
    var moved: int = 0
    var status_changed: bool = false
    for index in range(state.get("cities",[]).size()):
        var city: Dictionary = state["cities"][index]
        for site in city.get("county_worksites",[]):
            if owner_at(state,int(site["c"]),int(site["r"])) == index:
                if bool(site.get("suspended",false)):
                    status_changed = true
                site["suspended"] = false
                continue
            var destination: Dictionary = choose_worksite(state,index,String(site["type"]),land,heights)
            if bool(destination.get("ok",false)):
                site["relocated_from"] = [int(site["c"]),int(site["r"])]
                site["c"] = int(destination["c"])
                site["r"] = int(destination["r"])
                site["distance"] = int(destination["distance"])
                site["suspended"] = false
                moved += 1
            else:
                if not bool(site.get("suspended",false)):
                    status_changed = true
                site["suspended"] = true
    if moved > 0 or status_changed:
        state["revision"] = int(state.get("revision",0)) + 1
    return moved
