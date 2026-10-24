extends RefCounted
## Dev117: campaign siege wood physically travels from an owned city.
## The original stock is debited at departure, and the AI can construct
## siege equipment only from supplies delivered to the active battlefield.
const Military = preload("res://scripts/core/military_port.gd")
const SiegeAI = preload("res://scripts/core/campaign_siege_ai_port.gd")
const WOOD_CAPACITY: float = 93.0
const SOURCE_RESERVE: float = 25.0
const MIN_DISPATCH: float = 18.0
const SECONDS_PER_TILE: float = 2.0

static func _team_armies_at(state: Dictionary,team: int,c: int,r: int) -> int:
    var units: int = 0
    for army in state.get("armies",[]):
        if int(army.get("team",-1)) == team and int(army.get("c",-1)) == c and int(army.get("r",-1)) == r:
            units += Military.units_for(state,army).size()
    return units

static func _intercepted(state: Dictionary,team: int,c: int,r: int) -> bool:
    for army in state.get("armies",[]):
        if int(army.get("team",-1)) == team or int(army.get("c",-1)) != c or int(army.get("r",-1)) != r:
            continue
        if not Military.units_for(state,army).is_empty() and _team_armies_at(state,team,c,r) == 0:
            return true
    return false

static func _dispatch(state: Dictionary,battle: Dictionary,world_nav) -> bool:
    var siege: Dictionary = battle["siege"]
    var target := Vector2i(int(battle.get("world_c",-1)),int(battle.get("world_r",-1)))
    var team: int = int(siege.get("attacker_team",-1))
    var best: Dictionary = {}
    var best_path: Array = []
    for city in state.get("cities",[]):
        if int(city.get("team",-1)) != team or bool(city.get("tradeDisabled",false)):
            continue
        var stock: Dictionary = city.get("resources",{})
        if float(stock.get("wood",0.0))-SOURCE_RESERVE < MIN_DISPATCH:
            continue
        var p := Vector2i(int(city.get("c",-1)),int(city.get("r",-1)))
        if p == target:
            continue # A hostile city's battle tile is not a logistics depot.
        var path: Array = world_nav.route(city,{"c":target.x,"r":target.y})
        if path.is_empty():
            continue
        if best.is_empty() or path.size() < best_path.size() or (path.size() == best_path.size() and int(city.get("id",-1)) < int(best.get("id",999999))):
            best = city
            best_path = path
    if best.is_empty():
        return false
    var stock: Dictionary = best["resources"]
    var wood: float = minf(WOOD_CAPACITY,float(stock.get("wood",0.0))-SOURCE_RESERVE)
    if wood < MIN_DISPATCH:
        return false
    stock["wood"] = float(stock["wood"])-wood
    siege["supply_convoy"] = {"status":"moving","team":team,"from_city_id":int(best.get("id",-1)),
        "c":int(best["c"]),"r":int(best["r"]),"path":best_path.duplicate(true),
        "waypoint":0,"travel_clock":0.0,"wood":wood}
    state["ai_siege_supply_sent"] = int(state.get("ai_siege_supply_sent",0))+1
    state["ai_siege_supply_wood_dispatched"] = float(state.get("ai_siege_supply_wood_dispatched",0.0))+wood
    state["revision"] = int(state.get("revision",0))+1
    return true

static func advance(state: Dictionary,battle: Dictionary,dt: float,world_nav) -> Dictionary:
    var result: Dictionary = {"dispatched":0,"delivered":0,"lost":0,"crafted":0}
    if battle.is_empty() or world_nav == null or dt <= 0.0:
        return result
    var siege: Dictionary = battle.get("siege",{})
    if not bool(siege.get("linked_city",false)) or not bool(siege.get("ai_supply_required",false)):
        return result
    var convoy: Dictionary = siege.get("supply_convoy",{})
    if convoy.is_empty():
        if _dispatch(state,battle,world_nav):
            result["dispatched"] = 1
        return result
    if String(convoy.get("status","")) != "moving":
        return result
    var progress: float = float(convoy.get("travel_clock",0.0))+dt
    var path: Array = convoy.get("path",[])
    while progress + 0.000001 >= SECONDS_PER_TILE and int(convoy.get("waypoint",0)) < path.size():
        progress -= SECONDS_PER_TILE
        var place: Array = path[int(convoy["waypoint"])]
        var c: int = int(place[0])
        var r: int = int(place[1])
        if not world_nav.is_open(Vector2i(c,r)):
            # A broken road halts the convoy with its physical cargo.
            convoy["travel_clock"] = minf(progress,SECONDS_PER_TILE)
            return result
        convoy["c"] = c
        convoy["r"] = r
        convoy["waypoint"] = int(convoy["waypoint"])+1
        if _intercepted(state,int(convoy["team"]),c,r):
            convoy["status"] = "lost"
            state["ai_siege_supply_lost_wood"] = float(state.get("ai_siege_supply_lost_wood",0.0))+float(convoy["wood"])
            state["ai_siege_supply_interceptions"] = int(state.get("ai_siege_supply_interceptions",0))+1
            state["revision"] = int(state.get("revision",0))+1
            result["lost"] = 1
            return result
    convoy["travel_clock"] = progress
    if int(convoy["waypoint"]) >= path.size():
        convoy["status"] = "delivered"
        siege["supply_wood"] = float(siege.get("supply_wood",0.0))+float(convoy["wood"])
        state["ai_siege_supply_deliveries"] = int(state.get("ai_siege_supply_deliveries",0))+1
        state["revision"] = int(state.get("revision",0))+1
        result["delivered"] = 1
        var works: Dictionary = SiegeAI.equip(state,battle)
        result["crafted"] = int(works.get("ordered",0))
    return result
