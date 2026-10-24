extends RefCounted
## Dev 114: AI battlefield siege workshop. Uses the existing paid
## Siege.start_assault_work/start_ladder, not instantaneous free weapons.
const Siege = preload("res://scripts/core/siege_port_v131.gd")
const MAX_WORKS_PER_BATTLE: int = 2

static func _eligible_squads(battle: Dictionary) -> Array:
    var chosen: Array = []
    var siege: Dictionary = battle.get("siege",{})
    for squad in battle.get("squads",[]):
        if int(squad.get("team",-1)) != int(siege.get("attacker_team",-2)):
            continue
        if int(squad.get("unit_id",-1)) < 0 or bool(squad.get("reserve",false)) or bool(squad.get("retreated",false)):
            continue
        if String(squad.get("role","")) not in ["melee","ranged"]:
            continue
        var living: bool = false
        for man in squad.get("men",[]):
            if float(man.get("hp",0.0)) > 0.0:
                living = true
                break
        if living:
            chosen.append(squad)
    return chosen

static func equip(state: Dictionary,battle: Dictionary) -> Dictionary:
    var result: Dictionary = {"ordered":0,"rams":0,"towers":0,"ladders":0,"wood":0.0}
    var campaign: Dictionary = state.get("campaign",{})
    var siege: Dictionary = battle.get("siege",{})
    if not bool(campaign.get("active",false)) or not bool(siege.get("linked_city",false)):
        return result
    var attacker: int = int(siege.get("attacker_team",-1))
    if attacker < 1 or attacker == int(campaign.get("player_team",0)):
        return result # The player's military remains under player control.
    if bool(siege.get("ai_craft_done",false)):
        return result
    siege["ai_craft_done"] = true
    var squads: Array = _eligible_squads(battle)
    if squads.is_empty():
        return result
    var before: float = float(siege.get("wood_spent",0.0))
    var chosen: Dictionary = {}
    if squads.size() >= 2:
        # Prefer the movable ram for a closed gate. Use the existing gate
        # collision and 90-second construction/physical pushing mechanics.
        var mode: String = "ram"
        if bool(siege.get("gate_open",false)):
            mode = "tower" # Physical 120s tower climb when gate already open.
        chosen = Siege.start_assault_work(state,battle,int(squads[0]["unit_id"]),mode)
        if bool(chosen.get("ok",false)):
            result["ordered"] = 1
            result["rams" if mode == "ram" else "towers"] = 1
    # When ram/tower cannot be afforded, take the cheap historically early
    # ladder route instead. A second funded squad may work in parallel.
    var ladder_index: int = 1 if int(result["ordered"]) > 0 else 0
    if squads.size() > ladder_index and int(result["ordered"]) < MAX_WORKS_PER_BATTLE:
        var ladder: Dictionary = Siege.start_ladder(state,battle,int(squads[ladder_index]["unit_id"]))
        if bool(ladder.get("ok",false)):
            result["ordered"] = int(result["ordered"])+1
            result["ladders"] = 1
    result["wood"] = maxf(0.0,float(siege.get("wood_spent",0.0))-before)
    siege["ai_craft_orders"] = int(result["ordered"])
    siege["ai_craft_wood"] = float(result["wood"])
    state["ai_siege_works"] = int(state.get("ai_siege_works",0))+int(result["ordered"])
    state["ai_siege_wood_used"] = float(state.get("ai_siege_wood_used",0.0))+float(result["wood"])
    if int(result["ordered"]) > 0:
        state["revision"] = int(state.get("revision",0))+1
    return result
