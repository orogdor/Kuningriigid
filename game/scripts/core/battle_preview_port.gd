extends RefCounted
## Deliberately limited deterministic attrition benchmark. Not V131's full
## individual-battle-v91.js, tactics, formations, siege, projectiles or retreat.
const Military = preload("res://scripts/core/military_port.gd")
const XP = preload("res://scripts/core/army_experience_port.gd")
const IndividualBattle = preload("res://scripts/core/individual_battle_port.gd")

static func _locate_army(state: Dictionary,id: int) -> Dictionary:
    for a in state.get("armies",[]):
        if int(a.get("id",-1)) == id:
            return a
    return {}

static func _power(state: Dictionary,army: Dictionary) -> float:
    var total: float = 0.0
    for u in Military.units_for(state,army):
        var stats: Dictionary = XP.unit_stats(Military.UNITS[u["kind"]],u,float(army.get("xp",0.0)))
        total += float(stats["dmg"])*maxf(0.0,float(u["hp"])/maxf(1.0,float(u["maxHp"])))
    return total

static func start(state: Dictionary,first_id: int,second_id: int) -> Dictionary:
    Military.setup(state)
    if not state.get("active_battle",{}).is_empty():
        return {"ok":false,"reason":"Lahing juba käib"}
    var a: Dictionary = _locate_army(state,first_id)
    var b: Dictionary = _locate_army(state,second_id)
    if a.is_empty() or b.is_empty() or int(a["team"]) == int(b["team"]):
        return {"ok":false,"reason":"Vaja eri riikide armeesid"}
    if Military.units_for(state,a).is_empty() or Military.units_for(state,b).is_empty():
        return {"ok":false,"reason":"Ühel armeel pole sõdureid"}
    if int(a["c"]) != int(b["c"]) or int(a["r"]) != int(b["r"]):
        return {"ok":false,"reason":"Armeed peavad olema samal maailmaruudul"}
    a["path"] = []
    b["path"] = []
    state["active_battle"] = {"army_a":first_id,"army_b":second_id,"elapsed":0.0,"round_clock":0.0,"damage_a":0.0,"damage_b":0.0,"rounds":0}
    state["battles_started"] = int(state.get("battles_started",0))+1
    return {"ok":true,"reason":"Lahingukatse algas"}

static func _inflict(state: Dictionary,army: Dictionary,damage: float) -> float:
    var remaining: float = damage
    for u in Military.units_for(state,army):
        var taken: float = minf(remaining,float(u.get("hp",0.0)))
        u["hp"] = maxf(0.0,float(u["hp"])-taken)
        remaining -= taken
        if remaining <= 0.000001:
            break
    return damage-remaining

static func tick(state: Dictionary,dt: float) -> void:
    var b: Dictionary = state.get("active_battle",{})
    if b.is_empty():
        return
    var a: Dictionary = _locate_army(state,int(b["army_a"]))
    var c: Dictionary = _locate_army(state,int(b["army_b"]))
    if a.is_empty() or c.is_empty():
        state["active_battle"] = {}
        return
    b["elapsed"] = float(b.get("elapsed",0.0))+dt
    b["round_clock"] = float(b.get("round_clock",0.0))+dt
    while float(b["round_clock"]) >= 1.0 and int(b.get("rounds",0)) < 600:
        b["round_clock"] = float(b["round_clock"])-1.0
        # Both sides attack simultaneously each 1-second deterministic round.
        var damage_to_a: float = _power(state,c)*0.6
        var damage_to_c: float = _power(state,a)*0.6
        b["damage_a"] = float(b["damage_a"])+_inflict(state,a,damage_to_a)
        b["damage_b"] = float(b["damage_b"])+_inflict(state,c,damage_to_c)
        b["rounds"] = int(b["rounds"])+1
        if Military.units_for(state,a).is_empty() or Military.units_for(state,c).is_empty():
            break
    if (not Military.units_for(state,a).is_empty() and not Military.units_for(state,c).is_empty()) and int(b["rounds"]) < 600:
        return
    var a_won: bool = not Military.units_for(state,a).is_empty()
    var c_won: bool = not Military.units_for(state,c).is_empty()
    a["xp"] = XP.reward_xp(float(a.get("xp",0.0)),float(b["damage_b"]),0,a_won and not c_won) if a_won else 0.0
    c["xp"] = XP.reward_xp(float(c.get("xp",0.0)),float(b["damage_a"]),0,c_won and not a_won) if c_won else 0.0
    a["level"] = XP.army_level(float(a["xp"]))
    c["level"] = XP.army_level(float(c["xp"]))
    var outcome: Dictionary = {"time":float(state.get("seconds",0.0)),"teams":[a["team"],c["team"]],"winner":int(a["team"]) if a_won and not c_won else (int(c["team"]) if c_won and not a_won else -1),"rounds":int(b["rounds"]),"damage_a":b["damage_a"],"damage_b":b["damage_b"],"test_only":true}
    state["battle_log"].append(outcome)
    state["battles_finished"] = int(state.get("battles_finished",0))+1
    state["active_battle"] = {}

static func detect_encounter(state: Dictionary) -> bool:
    if not state.get("active_battle",{}).is_empty():
        return false
    var armies: Array = state.get("armies",[])
    for i in range(armies.size()):
        for j in range(i+1,armies.size()):
            var a: Dictionary = armies[i]
            var b: Dictionary = armies[j]
            if float(a.get("retreat_until",0.0)) > float(state.get("seconds",0.0)) or float(b.get("retreat_until",0.0)) > float(state.get("seconds",0.0)):
                continue
            if int(a["team"]) != int(b["team"]) and int(a["c"]) == int(b["c"]) and int(a["r"]) == int(b["r"]) and not Military.units_for(state,a).is_empty() and not Military.units_for(state,b).is_empty():
                return bool((IndividualBattle.start(state,int(a["id"]),int(b["id"])) if bool(state.get("campaign",{}).get("active",false)) else start(state,int(a["id"]),int(b["id"]))).get("ok",false))
    return false
