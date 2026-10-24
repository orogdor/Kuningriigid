extends RefCounted
## V4.1 first playable, turn-based Stone -> Bronze campaign slice.
## All production/research/travel still happens in PreviewSim.tick(), never
## here: this module owns campaign start, turns, objectives and the scoreboard.
const GOAL_ERA: int = 1
const MIN_TOTAL_POPULATION: int = 20
const TURN_LIMIT: int = 90
const GAME_SECONDS_PER_TURN: float = 60.0
const PLAYER_TEAM: int = 0
const SAVE_PATH: String = "user://kuningriigid_campaign_v1.json"

static func is_active(state: Dictionary) -> bool:
    return bool(state.get("campaign",{}).get("active",false))

static func is_running(state: Dictionary) -> bool:
    var c: Dictionary = state.get("campaign",{})
    return bool(c.get("active",false)) and str(c.get("result","playing")) == "playing"

static func begin(state: Dictionary, player_team: int = PLAYER_TEAM) -> Dictionary:
    var count: int = 0
    for city in state.get("cities",[]):
        if int(city.get("team",-1)) == player_team:
            count += 1
    if count == 0:
        return {"ok":false,"reason":"Selle riigi linnu ei leitud"}
    if not state.get("teams",{}).has(player_team):
        return {"ok":false,"reason":"Selle riigi teadust ei leitud"}
    state["campaign"] = {
        "active":true,"mode":"stone_to_bronze","player_team":player_team,
        "turn":0,"turn_limit":TURN_LIMIT,"goal_age":GOAL_ERA,
        "goal_population":MIN_TOTAL_POPULATION,"result":"playing",
        "last_message":"Ehita linnasid, vali uuring ja lõpeta käigud.",
        "history":[],"started_at":float(state.get("seconds",0.0))}
    state["ai_enabled"] = true
    state["revision"] = int(state.get("revision",0))+1
    return {"ok":true,"reason":"Kampaania alustati. Teised riigid arenevad iga käiguga."}

static func own_city_index(state: Dictionary, current: int = -1, direction: int = 1) -> int:
    var cities: Array = state.get("cities",[])
    if cities.is_empty():
        return -1
    var team: int = int(state.get("campaign",{}).get("player_team",PLAYER_TEAM))
    for off in range(1,cities.size()+1):
        var index: int = posmod(current+off*direction,cities.size())
        if int(cities[index].get("team",-1)) == team:
            return index
    return -1

static func owns_city(state: Dictionary,index: int) -> bool:
    var cities: Array = state.get("cities",[])
    if index < 0 or index >= cities.size():
        return false
    if not is_active(state):
        return true
    return int(cities[index].get("team",-1)) == int(state["campaign"]["player_team"])

static func team_stats(state: Dictionary,team: int) -> Dictionary:
    var people: int = 0
    var towns: int = 0
    var built: int = 0
    for city in state.get("cities",[]):
        if int(city.get("team",-1)) != team:
            continue
        towns += 1
        people += int(city.get("pop",0))
        for b in city.get("buildings",[]):
            if bool(b.get("ready",false)) and float(b.get("hp",0.0)) > 0.0:
                built += 1
    var team_data: Dictionary = state.get("teams",{}).get(team,{})
    var age: int = int(team_data.get("age",0))
    return {"team":team,"cities":towns,"population":people,"buildings":built,
        "age":age,"score":age*1000+towns*100+people*10+built}

static func standings(state: Dictionary) -> Array:
    var scores: Array = []
    for team in range(4):
        scores.append(team_stats(state,team))
    scores.sort_custom(func(a,b):
        return int(a["score"]) > int(b["score"]) if int(a["score"]) != int(b["score"]) else int(a["team"]) < int(b["team"]))
    return scores

static func evaluate(state: Dictionary) -> Dictionary:
    if not is_active(state):
        return {"active":false}
    var campaign: Dictionary = state["campaign"]
    var team: int = int(campaign["player_team"])
    var stats: Dictionary = team_stats(state,team)
    if String(campaign.get("result","playing")) == "playing":
        if int(stats["cities"]) <= 0:
            campaign["result"] = "lost"
            campaign["last_message"] = "Sinu riigil ei ole enam ühtegi linna."
        elif int(stats["age"]) >= int(campaign["goal_age"]) and int(stats["population"]) >= int(campaign["goal_population"]):
            campaign["result"] = "won"
            campaign["last_message"] = "VÕIT! Jõudsid pronksiaega ja kasvatasid rahvaarvu vähemalt %d-ni." % int(campaign["goal_population"])
        elif int(campaign["turn"]) >= int(campaign["turn_limit"]):
            campaign["result"] = "lost"
            campaign["last_message"] = "Käigulimiit täis. Proovi tugevamat toidu-, vee- ja teadusmajandust."
    return {"active":true,"result":str(campaign["result"]),"turn":int(campaign["turn"]),
        "limit":int(campaign["turn_limit"]),"player":stats,
        "leaders":standings(state),"message":str(campaign["last_message"])}

static func finish_turn(state: Dictionary) -> Dictionary:
    if not is_running(state):
        return {"ok":false,"reason":"Kampaania pole käimas"}
    var campaign: Dictionary = state["campaign"]
    campaign["turn"] = int(campaign["turn"])+1
    var stats: Dictionary = team_stats(state,int(campaign["player_team"]))
    var report: Dictionary = {"turn":int(campaign["turn"]),
        "player_age":int(stats["age"]),"player_population":int(stats["population"]),
        "player_cities":int(stats["cities"]),
        "ai_build_orders":int(state.get("ai_build_orders",0)),
        "ai_research_orders":int(state.get("ai_research_orders",0)),
        "captured":int(state.get("city_captures",0))}
    campaign["history"].append(report)
    var assessment: Dictionary = evaluate(state)
    if String(campaign.get("result","playing")) == "playing":
        campaign["last_message"] = "Käik %d/%d • sinu linnu %d • elanikke %d • ajastu %d • AI ehituskäske %d" % [
            int(campaign["turn"]),int(campaign["turn_limit"]),int(stats["cities"]),
            int(stats["population"]),int(stats["age"]),int(report["ai_build_orders"])]
    state["revision"] = int(state.get("revision",0))+1
    assessment = evaluate(state)
    return {"ok":true,"status":assessment}

static func text_status(state: Dictionary) -> String:
    if not is_active(state):
        return "Kampaania pole alustatud"
    var c: Dictionary = state["campaign"]
    var stats: Dictionary = team_stats(state,int(c["player_team"]))
    var state_text: String = str(c.get("result","playing"))
    return "KÄIK %d/%d | %s | %d linna | %d elanikku | ajastu %d | siht: pronks + %d elanikku" % [
        int(c["turn"]),int(c["turn_limit"]),state_text,
        int(stats["cities"]),int(stats["population"]),int(stats["age"]),
        int(c["goal_population"])]
