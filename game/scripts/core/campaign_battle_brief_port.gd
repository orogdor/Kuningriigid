extends RefCounted
## Dev128: read-only, phone-friendly tactical front overview and real battle logs.
## This is presentation only: no new troops, outcomes or background victories.
const Military = preload("res://scripts/core/military_port.gd")

static func _army(state: Dictionary,id: int) -> Dictionary:
    for army in state.get("armies",[]):
        if int(army.get("id",-1)) == id:
            return army
    return {}

static func _team(state: Dictionary,id: int) -> int:
    return int(_army(state,id).get("team",-1))

static func _strength(state: Dictionary,id: int) -> int:
    return Military.units_for(state,_army(state,id)).size()

static func _front(state: Dictionary,first: int,second: int,c: int,r: int,kind: String,seq: int) -> Dictionary:
    return {"kind":kind,"index":seq,"c":c,"r":r,"army_a":first,"army_b":second,
        "team_a":_team(state,first),"team_b":_team(state,second),
        "units_a":_strength(state,first),"units_b":_strength(state,second)}

static func fronts(state: Dictionary) -> Array:
    var result: Array = []
    var active: Dictionary = state.get("individual_battle",{})
    if active.is_empty():
        active = state.get("active_battle",{})
    if not active.is_empty():
        result.append(_front(state,int(active.get("army_a",-1)),int(active.get("army_b",-1)),
            int(active.get("world_c",-1)),int(active.get("world_r",-1)),"active",0))
    var queue: Array = state.get("pending_battles",[])
    for index in range(queue.size()):
        var item: Dictionary = queue[index]
        result.append(_front(state,int(item.get("army_a",-1)),int(item.get("army_b",-1)),
            int(item.get("c",-1)),int(item.get("r",-1)),"pending",index+1))
    return result

static func front_label(front: Dictionary) -> String:
    var mode: String = "KÄIB" if str(front.get("kind","")) == "active" else "OOTEL %d" % int(front.get("index",0))
    return "%s | (%d,%d) | R%d [%d] vs R%d [%d]" % [
        mode,int(front.get("c",-1)),int(front.get("r",-1)),int(front.get("team_a",-1)),
        int(front.get("units_a",0)),int(front.get("team_b",-1)),int(front.get("units_b",0))]

static func last_battle(state: Dictionary) -> Dictionary:
    var battles: Array = state.get("battle_log",[])
    if battles.is_empty():
        return {}
    return battles[-1]

static func _casualties_label(outcome: Dictionary) -> String:
    var losses: Dictionary = outcome.get("casualties",{})
    if losses.is_empty():
        return "Sõdurikaotuste täpne arv puudub."
    var ids: Array = losses.keys()
    ids.sort_custom(func(a,b):return int(a)<int(b))
    var entries: PackedStringArray = []
    for team in ids:
        entries.append("R%d: %d" % [int(team),int(losses[team])])
    return "Langenuid: " + ", ".join(entries)

static func report(state: Dictionary) -> String:
    var finished: int = int(state.get("individual_battles_finished",0))
    var list: Array = fronts(state)
    var lines: PackedStringArray = []
    lines.append("SÕJATEGEVUSE ÜLEVAADE")
    lines.append("Käimas: %d | Ootel: %d | Lõpetatud: %d" % [
        1 if list.any(func(item):return str(item.get("kind",""))=="active") else 0,
        state.get("pending_battles",[]).size(),finished])
    lines.append("Järjekorda võetud kokku: %d | aegunud käske: %d" % [
        int(state.get("battles_queued_total",0)),int(state.get("battles_queue_expired",0))])
    lines.append("")
    if list.is_empty():
        lines.append("Praegu pole aktiivseid ega ootel lahinguid.")
    else:
        for item in list:
            lines.append(front_label(item))
    lines.append("")
    lines.append("VIIMANE LÕPPENUD LAHING")
    var done: Dictionary = last_battle(state)
    if done.is_empty():
        lines.append("Lahinguid ei ole veel lõpetatud.")
    else:
        var winner: int = int(done.get("winner",-1))
        lines.append("Asukoht: (%d,%d) | võitja: %s" % [
            int(done.get("world_c",-1)),int(done.get("world_r",-1)),
            "viik / määramata" if winner < 0 else "Riik %d" % winner])
        lines.append("Alguses: %d meest | reservis: %d" % [
            int(done.get("initial_men",0)),int(done.get("reserve_men",0))])
        lines.append(_casualties_label(done))
        lines.append("Laske: %d | tabamusi: %d | samme: %d" % [
            int(done.get("shots",0)),int(done.get("impacts",0)),int(done.get("steps",0))])
        var retreat_count: int = done.get("retreats",[]).size()
        var capture: Dictionary = done.get("city_capture",{})
        lines.append("Taganemised: %d | linn vallutatud: %s" % [
            retreat_count,"jah" if bool(capture.get("ok",false)) else "ei"])
        var siege: Dictionary = done.get("siege",{})
        if not siege.is_empty():
            lines.append("Müüri läbimurdeid: %d | rammilööke: %d" % [
                int(siege.get("breaches",0)),int(siege.get("ram_hits",0))])
    return "\n".join(lines)
