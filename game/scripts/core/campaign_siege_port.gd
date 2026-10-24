extends RefCounted
## Dev 97: real, paid emergency garrisons and persistent siege blockades.
## This layer never declares a tactical siege victory: keep capture remains
## exclusively in IndividualBattle/CityCapture. Blockade surrender is a
## separate, explicitly logged six-turn campaign outcome.
const Military = preload("res://scripts/core/military_port.gd")
const Fort = preload("res://scripts/core/city_fortification_port.gd")
const Economy = preload("res://scripts/core/economy_port.gd")
const BattlePreview = preload("res://scripts/core/battle_preview_port.gd")
const MIN_ATTACKERS: int = 2
const MIN_LEVY_POP: int = 4
const BLOCKADE_TURNS: int = 6
const LEVY_COST: Dictionary = {"wood":8.0,"stone":2.0}

static func _occupied_army(state: Dictionary,team: int,cell: Vector2i,min_units: int = 1) -> Dictionary:
    for army in state.get("armies",[]):
        if int(army.get("team",-1)) != team:
            continue
        if int(army.get("c",-1)) != cell.x or int(army.get("r",-1)) != cell.y:
            continue
        if Military.units_for(state,army).size() >= min_units:
            return army
    return {}

static func _hostile_army(state: Dictionary,team: int,cell: Vector2i) -> Dictionary:
    for army in state.get("armies",[]):
        if int(army.get("team",-1)) == team:
            continue
        if int(army.get("c",-1)) != cell.x or int(army.get("r",-1)) != cell.y:
            continue
        if Military.units_for(state,army).size() < MIN_ATTACKERS:
            continue
        if float(army.get("retreat_until",0.0)) > float(state.get("seconds",0.0)):
            continue
        return army
    return {}

static func prepare(state: Dictionary) -> Dictionary:
    var levied: int = 0
    var engagements: int = 0
    if not bool(state.get("campaign",{}).get("active",false)):
        return {"levied":0,"engagements":0}
    if not state.get("individual_battle",{}).is_empty() or not state.get("active_battle",{}).is_empty():
        return {"levied":0,"engagements":0}
    for city in state.get("cities",[]):
        var cell := Vector2i(int(city.get("c",-1)),int(city.get("r",-1)))
        if not Fort.fortified(city,cell):
            continue
        var owner: int = int(city.get("team",-1))
        if _hostile_army(state,owner,cell).is_empty():
            continue
        var defense: Dictionary = _occupied_army(state,owner,cell)
        if defense.is_empty():
            var stock: Dictionary = city.get("resources",{})
            if int(city.get("pop",0)) >= MIN_LEVY_POP and Economy.can_afford(stock,LEVY_COST):
                # Emergency spearmen are a mobilised population levy, not
                # cloned troops: lose a citizen and pay real equipment cost.
                Economy.spend_resources(stock,LEVY_COST)
                city["pop"] = int(city["pop"])-1
                defense = Military.create_army(state,owner,cell.x,cell.y)
                Military.add_unit(state,defense,"spearman","mobilized")
                city["militia_levied"] = int(city.get("militia_levied",0))+1
                state["city_garrisons_mustered"] = int(state.get("city_garrisons_mustered",0))+1
                state["revision"] = int(state.get("revision",0))+1
                levied += 1
        if not defense.is_empty() and BattlePreview.detect_encounter(state):
            engagements += 1
            break # exactly one simultaneous battle in the V131 engine
    return {"levied":levied,"engagements":engagements}

static func advance_blockades(state: Dictionary) -> Dictionary:
    var progress: Dictionary = state.get("city_blockade_progress",{})
    var surrendered: int = 0
    if not bool(state.get("campaign",{}).get("active",false)):
        return {"surrendered":0}
    if not state.get("individual_battle",{}).is_empty() or not state.get("active_battle",{}).is_empty():
        return {"surrendered":0}
    var turn: int = int(state.get("campaign",{}).get("turn",0))
    for city in state.get("cities",[]):
        var key: String = str(int(city.get("id",-1)))
        var cell := Vector2i(int(city.get("c",-1)),int(city.get("r",-1)))
        var owner: int = int(city.get("team",-1))
        if not Fort.fortified(city,cell) or not _occupied_army(state,owner,cell).is_empty():
            progress.erase(key)
            continue
        var attacker_army: Dictionary = _hostile_army(state,owner,cell)
        if attacker_army.is_empty():
            progress.erase(key)
            continue
        # If a paid levy is possible, conduct the real battle instead of
        # incorrectly allowing an instantaneous wall bypass.
        if int(city.get("pop",0)) >= MIN_LEVY_POP and Economy.can_afford(city.get("resources",{}),LEVY_COST):
            progress.erase(key)
            continue
        var attacker: int = int(attacker_army["team"])
        var record: Dictionary = progress.get(key,{})
        # Calling twice in one turn must not accelerate a siege.
        var count: int = int(record.get("turns",0))
        if int(record.get("team",-1)) != attacker:
            count = 0
        if int(record.get("last_turn",-1)) != turn:
            count += 1
        if count < BLOCKADE_TURNS:
            progress[key] = {"team":attacker,"turns":count,"last_turn":turn}
            continue
        progress.erase(key)
        city["team"] = attacker
        var nation: Dictionary = state.get("teams",{}).get(attacker,{})
        city["age"] = int(nation.get("age",city.get("age",0)))
        city["training"] = []
        city["captured_from_team"] = owner
        city["captured_at"] = float(state.get("seconds",0.0))
        city["captures"] = int(city.get("captures",0))+1
        state["territory_source"] = ""
        state["revision"] = int(state.get("revision",0))+1
        state["city_captures"] = int(state.get("city_captures",0))+1
        if not state.has("conquests"):
            state["conquests"] = []
        state["conquests"].append({"city_id":int(city.get("id",-1)),
            "c":cell.x,"r":cell.y,"from":owner,"to":attacker,
            "mode":"blockade_surrender","turn":turn,"siege_turns":count})
        surrendered += 1
    state["city_blockade_progress"] = progress
    return {"surrendered":surrendered}
