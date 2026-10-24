extends RefCounted
## V131 military-v88.js, civilization-core.js and army-experience-v88.js.
## Real recruitment prices, grade modifiers, population payment, build requirements,
## training queue, army XP and grid travel. Not the individual-battle simulation.
const Economy = preload("res://scripts/core/economy_port.gd")
const Roads = preload("res://scripts/core/roads_port.gd")
const XP = preload("res://scripts/core/army_experience_port.gd")
const GRADES: Dictionary = {
    "mobilized":{"price":0.5,"strength":0.4},
    "standard":{"price":1.0,"strength":1.0},
    "elite":{"price":1.3,"strength":1.4}}
const UNITS: Dictionary = {
    "slinger":{"age":0,"tech":"warfare","requires":["barracks"],"cost":{"wood":8,"stone":18},"hp":85.0,"dmg":7.0,"range":10.0,"speed":2.7,"time":25.0,"population":1},
    "spearman":{"age":0,"tech":"warfare","requires":["barracks"],"cost":{"wood":22,"stone":4},"hp":125.0,"dmg":10.0,"range":3.0,"speed":2.8,"time":30.0,"population":1},
    "axeman":{"age":0,"tech":"warfare","requires":["barracks"],"cost":{"wood":14,"stone":14},"hp":140.0,"dmg":12.0,"range":2.5,"speed":2.7,"time":35.0,"population":1},
    "archer":{"age":0,"tech":"archery","requires":["archery"],"cost":{"wood":25,"stone":8,"bread":8},"hp":100.0,"dmg":12.0,"range":13.0,"speed":2.8,"time":40.0,"population":1},
    "bronze_spearman":{"age":1,"tech":"bronze","requires":["barracks"],"cost":{"wood":18,"bronze":3,"bread":6},"hp":150.0,"dmg":14.0,"range":3.3,"speed":2.8,"time":38.0,"population":1},
    "bronze_axeman":{"age":1,"tech":"bronze","requires":["barracks"],"cost":{"wood":12,"bronze":4,"bread":6},"hp":155.0,"dmg":17.0,"range":2.6,"speed":2.7,"time":40.0,"population":1},
    "bronze_archer":{"age":1,"tech":"bronze","requires":["archery"],"cost":{"wood":22,"bronze":2,"bread":6},"hp":115.0,"dmg":16.0,"range":15.0,"speed":2.9,"time":38.0,"population":1},
    "iron_archer":{"age":2,"tech":"iron","requires":["archery"],"cost":{"wood":24,"iron":5,"bread":8},"hp":140.0,"dmg":21.0,"range":17.0,"speed":3.0,"time":47.0,"population":1},
    "infantry":{"age":2,"tech":"smithing","requires":["smith","barracks"],"cost":{"weapons":3,"bread":10},"hp":175.0,"dmg":18.0,"range":3.0,"speed":2.8,"time":50.0,"population":1},
    "cavalry":{"age":2,"tech":"horsemanship","requires":["stable"],"cost":{"weapons":4,"bread":18},"hp":210.0,"dmg":23.0,"range":3.5,"speed":4.6,"time":60.0,"population":2},
    "bronze_catapult":{"age":2,"tech":"ancient_artillery","requires":["siegeworkshop"],"cost":{"plank":45,"bronze":4,"stone":15},"hp":180.0,"dmg":5.75,"range":30.0,"speed":1.3,"time":100.0,"population":2},
    "chariot":{"age":1,"tech":"wheel","requires":["barracks","cartwright"],"cost":{"carts":1,"bronze":6,"bread":12},"hp":235.0,"dmg":23.0,"range":18.0,"speed":4.7,"time":64.0,"population":2}
}

static func setup(state: Dictionary) -> void:
    for key in ["armies","military_units"]:
        if not state.has(key):
            state[key] = []
    for key in ["next_army_id","next_military_id"]:
        if not state.has(key):
            state[key] = 1
    for key in ["military_trained","army_steps","armies_ordered","battles_started","battles_finished"]:
        if not state.has(key):
            state[key] = 0
    if not state.has("battle_log"):
        state["battle_log"] = []
    if not state.has("active_battle"):
        state["active_battle"] = {}
    for city in state.get("cities",[]):
        if not city.has("training"):
            city["training"] = []

static func _city(state: Dictionary, index: int) -> Dictionary:
    var cities: Array = state.get("cities",[])
    if index < 0 or index >= cities.size():
        return {}
    return cities[index]

static func _ready(city: Dictionary, kind: String) -> bool:
    for b in city.get("buildings",[]):
        if String(b.get("type","")) == kind and bool(b.get("ready",false)) and float(b.get("hp",0)) > 0.0:
            return true
    return false

static func cost_for(kind: String,grade: String = "standard") -> Dictionary:
    if not UNITS.has(kind) or not GRADES.has(grade):
        return {}
    var result: Dictionary = {}
    var mult: float = float(GRADES[grade]["price"])
    for material in UNITS[kind]["cost"].keys():
        result[material] = snappedf(float(UNITS[kind]["cost"][material])*mult,0.000001)
    return result

static func train(state: Dictionary,city_index: int,kind: String,grade: String = "standard") -> Dictionary:
    setup(state)
    var city: Dictionary = _city(state,city_index)
    if city.is_empty() or not UNITS.has(kind) or not GRADES.has(grade):
        return {"ok":false,"reason":"Tundmatu linn, üksus või varustustase"}
    var def: Dictionary = UNITS[kind]
    var team: int = int(city.get("team",0))
    var knowledge: Dictionary = state["teams"][team]["known"]
    if not knowledge.has(String(def["tech"])):
        return {"ok":false,"reason":"Avasta: " + String(def["tech"])}
    if int(state["teams"][team].get("age",0)) < int(def["age"]):
        return {"ok":false,"reason":"Ajastu on liiga varane"}
    for req in def["requires"]:
        if not _ready(city,String(req)):
            return {"ok":false,"reason":"Ehita esmalt: " + String(req)}
    if city["training"].size() >= 4:
        return {"ok":false,"reason":"Väljaõppe järjekord täis (4)"}
    if int(city.get("pop",0)) < 6:
        return {"ok":false,"reason":"Liiga vähe elanikke (vähemalt 6)"}
    var cost: Dictionary = cost_for(kind,grade)
    if not Economy.can_afford(city["resources"],cost):
        return {"ok":false,"reason":"Puuduvad ressursid"}
    Economy.spend_resources(city["resources"],cost)
    city["pop"] = int(city["pop"]) - int(def["population"])
    city["training"].append({"kind":kind,"grade":grade,"total":float(def["time"]),"progress":0.0,"paidCost":cost,"workerLimit":1.0})
    state["revision"] = int(state.get("revision",0)) + 1
    return {"ok":true,"reason":"Väljaõppes: " + kind}

static func _army_at(state: Dictionary,team: int,c: int,r: int) -> Dictionary:
    for army in state["armies"]:
        if int(army.get("team",-1)) == team and int(army.get("c",-1)) == c and int(army.get("r",-1)) == r and army.get("embarked",false) == false:
            return army
    return {}

static func create_army(state: Dictionary,team: int,c: int,r: int) -> Dictionary:
    setup(state)
    var army: Dictionary = {"id":int(state["next_army_id"]),"team":team,"c":c,"r":r,"path":[],"waypoint":0,"travel_clock":0.0,"xp":0.0,"level":1,"stance":"defend"}
    state["next_army_id"] = int(state["next_army_id"])+1
    state["armies"].append(army)
    return army

static func add_unit(state: Dictionary,army: Dictionary,kind: String,grade: String="standard") -> Dictionary:
    if not UNITS.has(kind) or not GRADES.has(grade):
        return {}
    var quality: float = float(GRADES[grade]["strength"])
    var def: Dictionary = UNITS[kind]
    var unit: Dictionary = {"id":int(state.get("next_military_id",1)),"armyId":int(army["id"]),"team":int(army["team"]),"kind":kind,"grade":grade,"grade_strength":quality,"hp":float(def["hp"])*quality,"maxHp":float(def["hp"])*quality,"morale":100.0}
    state["next_military_id"] = int(state.get("next_military_id",1))+1
    state["military_units"].append(unit)
    return unit

static func units_for(state: Dictionary,army: Dictionary) -> Array:
    var live: Array = []
    for unit in state.get("military_units",[]):
        if int(unit.get("armyId",-1)) == int(army.get("id",-2)) and int(unit.get("team",-1)) == int(army.get("team",-2)) and float(unit.get("hp",0.0)) > 0.0:
            live.append(unit)
    return live

static func speed_ratio(state: Dictionary,army: Dictionary) -> float:
    var speed: float = INF
    for unit in units_for(state,army):
        var stats: Dictionary = XP.unit_stats(UNITS[unit["kind"]],unit,float(army.get("xp",0.0)))
        speed = minf(speed,float(stats["speed"]))
    return maxf(0.2,speed/3.0) if not is_inf(speed) else 0.0

static func command_move(state: Dictionary,army_id: int,dest_c: int,dest_r: int,world_nav) -> Dictionary:
    setup(state)
    var army: Dictionary = {}
    for item in state["armies"]:
        if int(item.get("id",-1)) == army_id:
            army = item
            break
    if army.is_empty() or units_for(state,army).is_empty():
        return {"ok":false,"reason":"Armeel pole elusaid üksusi"}
    if float(army.get("retreat_until",0.0)) > float(state.get("seconds",0.0)):
        return {"ok":false,"reason":"Armee kogub pärast lahingut jõudu"}
    if world_nav == null:
        return {"ok":false,"reason":"Maailmakaardi navigeerimine puudub"}
    var dest: Vector2i = Vector2i(dest_c,dest_r)
    if not world_nav.is_open(dest):
        return {"ok":false,"reason":"Läbimatu siht"}
    if int(army["c"]) == dest_c and int(army["r"]) == dest_r:
        army["path"] = []
        return {"ok":true,"reason":"Armee on juba sihtkohas"}
    var path: Array = world_nav.route(army,{"c":dest_c,"r":dest_r})
    if path.is_empty():
        return {"ok":false,"reason":"Maatranspordi tee puudub"}
    army["path"] = path
    army["waypoint"] = 0
    army["travel_clock"] = 0.0
    army["stance"] = "move"
    state["armies_ordered"] = int(state.get("armies_ordered",0)) + 1
    return {"ok":true,"reason":"Marss: %d ruutu" % path.size()}

static func _train_tick(state: Dictionary,dt: float) -> void:
    for city in state["cities"]:
        var queue: Array = city.get("training",[])
        if queue.is_empty():
            continue
        var job: Dictionary = queue[0]
        # The full builder/trainer agent and workplace staffing are a later port.
        var work: float = dt
        job["progress"] = float(job.get("progress",0.0)) + work
        if float(job["progress"]) + 0.000001 < float(job["total"]):
            continue
        var army: Dictionary = _army_at(state,int(city["team"]),int(city["c"]),int(city["r"]))
        if army.is_empty():
            army = create_army(state,int(city["team"]),int(city["c"]),int(city["r"]))
        add_unit(state,army,String(job["kind"]),String(job.get("grade","standard")))
        queue.pop_front()
        state["military_trained"] = int(state.get("military_trained",0)) + 1
        state["revision"] = int(state.get("revision",0))+1

static func _move_tick(state: Dictionary,dt: float,world_nav) -> void:
    for army in state["armies"]:
        if units_for(state,army).is_empty():
            continue
        if float(army.get("retreat_until",0.0)) > float(state.get("seconds",0.0)):
            continue
        if String(army.get("stance","")) == "recover":
            army["stance"] = "defend"
        var path: Array = army.get("path",[])
        var index: int = int(army.get("waypoint",0))
        if index >= path.size():
            continue
        var from: Vector2i = Vector2i(int(army["c"]),int(army["r"]))
        var seconds: float = 4.0/maxf(0.2,speed_ratio(state,army))
        if state.has("world_roads"):
            var next: Array = path[index]
            var to: Vector2i = Vector2i(int(next[0]),int(next[1]))
            if Roads.road_level(Roads.road_strength(state["world_roads"],from,to,float(state.get("seconds",0.0)))) > 0:
                seconds /= 1.5
        army["travel_duration"] = seconds
        army["travel_clock"] = float(army.get("travel_clock",0.0)) + dt
        while int(army.get("waypoint",0)) < path.size() and float(army["travel_clock"]) >= seconds:
            index = int(army["waypoint"])
            var point: Array = path[index]
            var target: Vector2i = Vector2i(int(point[0]),int(point[1]))
            if world_nav != null and not world_nav.is_open(target):
                army["path"] = []
                army["travel_clock"] = 0.0
                break
            army["travel_clock"] = float(army["travel_clock"])-seconds
            from = Vector2i(int(army["c"]),int(army["r"]))
            army["c"] = target.x
            army["r"] = target.y
            army["waypoint"] = index+1
            if state.has("world_roads"):
                Roads.record_world_step(state["world_roads"],from,target,"army",float(state.get("seconds",0.0)))
            state["army_steps"] = int(state.get("army_steps",0))+1
            if int(army["waypoint"]) >= path.size():
                army["path"] = []
                army["waypoint"] = 0
                army["travel_clock"] = 0.0
                army["stance"] = "defend"
                break
            seconds = 4.0/maxf(0.2,speed_ratio(state,army))

static func advance(state: Dictionary,dt: float,world_nav = null) -> void:
    setup(state)
    if dt <= 0.0:
        return
    _train_tick(state,dt)
    _move_tick(state,dt,world_nav)
