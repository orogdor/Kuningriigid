extends RefCounted
## Synthetic performance fixture. Not legal construction or V131 city AI.
## Keep it separate from actual saved economy progress and expose Reset.
const Layout = preload("res://scripts/core/city_layout_port.gd")
const Citizens = preload("res://scripts/core/citizen_agents_port.gd")

static func populate(city: Dictionary,target_buildings: int,crowd_size: int,navigator = null) -> Dictionary:
    var buildings: Array = city.get("buildings",[])
    if not Layout.ensure_positions(city):
        return {"ok":false,"reason":"Senised hooned ei mahu detailruutu"}
    var used: Array = []
    var origin: Vector2 = Layout.center(city)
    for b in buildings:
        used.append({"kind":String(b.get("type","house")),"point":Vector2(float(b["site_x"]),float(b["site_z"]))-origin})
    var added: int = 0
    while buildings.size() < target_buildings:
        var n: int = buildings.size()
        var kind: String = "house"
        if n % 24 == 0:
            kind = "market"
        elif n % 13 == 0:
            kind = "lumber"
        elif n % 17 == 0:
            kind = "farm"
        var site: Dictionary = Layout.find_free_site(city,kind,used)
        if not bool(site.get("ok",false)):
            break
        var local: Vector2 = site["point"]
        buildings.append({"type":kind,"ready":true,"hp":350.0,
            "progress":0.0,"efficiency":0.0,"assigned":0.0,
            "site_x":origin.x+local.x,"site_z":origin.y+local.y,
            "stress_fixture":true})
        used.append({"kind":kind,"point":local})
        added += 1
    var agents: Dictionary = city.get("citizens",{})
    city["citizens"] = agents
    var created: int = 0
    for i in range(crowd_size):
        var key: String = "crowd:%d" % i
        var from_index: int = (i*7+1) % buildings.size()
        var start: Vector2 = Layout.position(city,from_index)
        if navigator != null:
            start = navigator.entry_position(city,from_index)
        agents[key] = {"kind":"demo_crowd","x":start.x,"z":start.y,
            "status":"Jalutab","target":-1,"path_points":[],"waypoint":1,
            "path_signature":"","crowd_goal":(i*11+17)%buildings.size()}
        created += 1
    city["stress_fixture"] = true
    city["stress_people"] = created
    return {"ok":true,"buildings":buildings.size(),"added":added,"crowd":created,
        "space_full":buildings.size()<target_buildings}

static func advance(city: Dictionary,dt: float,navigator = null) -> Dictionary:
    if not bool(city.get("stress_fixture",false)) or dt <= 0.0:
        return {"moving":0,"arrivals":0}
    var buildings: Array = city.get("buildings",[])
    var moving: int = 0
    var arrivals: int = 0
    for key in city.get("citizens",{}).keys():
        if not String(key).begins_with("crowd:"):
            continue
        var agent: Dictionary = city["citizens"][key]
        var goal: int = int(agent.get("crowd_goal",0))%buildings.size()
        if Citizens.walk_to(city,agent,goal,dt,navigator):
            agent["crowd_goal"] = (goal+37)%buildings.size()
            agent["target"] = -1
            arrivals += 1
        agent["status"] = "Jalutab"
        moving += 1
    return {"moving":moving,"arrivals":arrivals}
