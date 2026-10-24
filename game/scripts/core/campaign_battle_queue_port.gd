extends RefCounted
## Dev 122: deterministic, persistent strategic battle scheduling.
## Multiple fronts remain active on the world map; the V131 tactical engine
## still simulates exactly one individual battle at a time.
const Military = preload("res://scripts/core/military_port.gd")
const IndividualBattle = preload("res://scripts/core/individual_battle_port.gd")
const MAX_PENDING: int = 32
const REENTRY_SECONDS: float = 30.0

static func _army(state: Dictionary,id: int) -> Dictionary:
    for army in state.get("armies",[]):
        if int(army.get("id",-1)) == id:
            return army
    return {}

static func _eligible(state: Dictionary,a: Dictionary,b: Dictionary) -> bool:
    if a.is_empty() or b.is_empty() or int(a.get("id",-1)) == int(b.get("id",-2)):
        return false
    if int(a.get("team",-1)) == int(b.get("team",-1)):
        return false
    if int(a.get("c",-1)) != int(b.get("c",-2)) or int(a.get("r",-1)) != int(b.get("r",-2)):
        return false
    var now: float = float(state.get("seconds",0.0))
    for army in [a,b]:
        if float(army.get("retreat_until",0.0)) > now or float(army.get("engagement_cooldown_until",0.0)) > now:
            return false
        if Military.units_for(state,army).is_empty():
            return false
    return true

static func _key(first: int,second: int) -> String:
    return "%d:%d" % [mini(first,second),maxi(first,second)]

static func _active_ids(state: Dictionary) -> Dictionary:
    var active: Dictionary = state.get("individual_battle",{})
    if active.is_empty():
        active = state.get("active_battle",{})
    var ids: Dictionary = {}
    if not active.is_empty():
        ids[int(active.get("army_a",-1))] = true
        ids[int(active.get("army_b",-1))] = true
    return ids

static func _compare(a: Dictionary,b: Dictionary) -> bool:
    if int(a["r"]) != int(b["r"]):
        return int(a["r"]) < int(b["r"])
    if int(a["c"]) != int(b["c"]):
        return int(a["c"]) < int(b["c"])
    if int(a["army_a"]) != int(b["army_a"]):
        return int(a["army_a"]) < int(b["army_a"])
    return int(a["army_b"]) < int(b["army_b"])

static func _collect(state: Dictionary) -> int:
    var waiting: Array = state.get("pending_battles",[])
    var reserved: Dictionary = _active_ids(state)
    var already: Dictionary = {}
    for record in waiting:
        reserved[int(record.get("army_a",-1))] = true
        reserved[int(record.get("army_b",-1))] = true
        already[_key(int(record.get("army_a",-1)),int(record.get("army_b",-1)))] = true
    var candidates: Array = []
    var armies: Array = state.get("armies",[])
    for i in range(armies.size()):
        for j in range(i+1,armies.size()):
            var a: Dictionary = armies[i]
            var b: Dictionary = armies[j]
            if reserved.has(int(a.get("id",-1))) or reserved.has(int(b.get("id",-1))) or not _eligible(state,a,b):
                continue
            var id_a: int = mini(int(a["id"]),int(b["id"]))
            var id_b: int = maxi(int(a["id"]),int(b["id"]))
            if already.has(_key(id_a,id_b)):
                continue
            candidates.append({"army_a":id_a,"army_b":id_b,"c":int(a["c"]),"r":int(a["r"]),
                "queued_at":float(state.get("seconds",0.0))})
    candidates.sort_custom(_compare)
    var added: int = 0
    for encounter in candidates:
        if waiting.size() >= MAX_PENDING:
            break
        var a: Dictionary = _army(state,int(encounter["army_a"]))
        var b: Dictionary = _army(state,int(encounter["army_b"]))
        if reserved.has(int(encounter["army_a"])) or reserved.has(int(encounter["army_b"])) or not _eligible(state,a,b):
            continue
        # A queued contact stays on its current grid cell; otherwise an army
        # could walk through the opposing formation while another front fights.
        for army in [a,b]:
            army["path"] = []
            army["waypoint"] = 0
            army["travel_clock"] = 0.0
            army["stance"] = "defend"
        waiting.append(encounter)
        reserved[int(encounter["army_a"])] = true
        reserved[int(encounter["army_b"])] = true
        added += 1
    if added > 0:
        waiting.sort_custom(_compare)
        state["pending_battles"] = waiting
        state["battles_queued_total"] = int(state.get("battles_queued_total",0))+added
        state["revision"] = int(state.get("revision",0))+1
    return added

static func advance(state: Dictionary) -> Dictionary:
    var result: Dictionary = {"queued":0,"started":0,"discarded":0,"pending":0}
    if not bool(state.get("campaign",{}).get("active",false)):
        return result
    if not state.has("pending_battles"):
        state["pending_battles"] = []
    # Keep active combatants out of new contacts. Remove outdated saved
    # tickets, but do not charge casualties or grant conquest to a ticket.
    var list: Array = state["pending_battles"]
    var filtered: Array = []
    var busy: Dictionary = _active_ids(state)
    var scheduled: Dictionary = {}
    for entry in list:
        var first: int = int(entry.get("army_a",-1))
        var second: int = int(entry.get("army_b",-1))
        var a: Dictionary = _army(state,first)
        var b: Dictionary = _army(state,second)
        if busy.has(first) or busy.has(second) or scheduled.has(first) or scheduled.has(second) or not _eligible(state,a,b):
            result["discarded"] = int(result["discarded"])+1
            continue
        filtered.append(entry)
        scheduled[first] = true
        scheduled[second] = true
    state["pending_battles"] = filtered
    result["queued"] = _collect(state)
    list = state["pending_battles"]
    if state.get("individual_battle",{}).is_empty() and state.get("active_battle",{}).is_empty():
        while not list.is_empty():
            var event: Dictionary = list.pop_front()
            var a: Dictionary = _army(state,int(event["army_a"]))
            var b: Dictionary = _army(state,int(event["army_b"]))
            if not _eligible(state,a,b):
                result["discarded"] = int(result["discarded"])+1
                continue
            var start: Dictionary = IndividualBattle.start(state,int(event["army_a"]),int(event["army_b"]))
            if bool(start.get("ok",false)):
                result["started"] = 1
                break
            result["discarded"] = int(result["discarded"])+1
    result["pending"] = list.size()
    if int(result["started"])+int(result["discarded"]) > 0:
        state["battles_dequeued_total"] = int(state.get("battles_dequeued_total",0))+int(result["started"])
        state["battles_queue_expired"] = int(state.get("battles_queue_expired",0))+int(result["discarded"])
        state["revision"] = int(state.get("revision",0))+1
    return result
