extends RefCounted
## Source: science.js + growth-balance-v125.js. Rate is per GAME MINUTE.
const Growth = preload("res://scripts/core/growth_port.gd")
const SCIENCE_BUILDINGS = {"study":6.0,"scriptorium":10.0,"academy":16.0,"university":24.0,
    "monastery":16.0,"chapel":10.0,"observatory":30.0,"polytechnic":42.0,"laboratory":65.0}
const SCIENCE_PER_RESIDENT: float = 0.45
const SCIENCE_PER_CITY: float = 2.4
const SCIENCE_PER_TURN: float = 10.0
const EUREKA_FRACTION: float = 0.35

static func city_science(population: int, buildings: Array) -> Dictionary:
    var base: float = SCIENCE_PER_CITY + maxi(0,population) * SCIENCE_PER_RESIDENT
    var additional: float = 0.0
    for b in buildings:
        var name: String = String(b.get("type",""))
        if bool(b.get("ready",false)) and not bool(b.get("disabled",false)) and float(b.get("hp",0.0)) > 0.0:
            additional += float(SCIENCE_BUILDINGS.get(name,0.0)) * clampf(float(b.get("efficiency",0.0)),0.0,1.0) * float(b.get("researchActivity",1.0))
    return {"base":base,"buildings":additional,"total":base+additional}

static func science_rate(cities: Array, team: int, strategy_pacing: bool = false, difficulty: String = "normal") -> float:
    var own: Array = []
    var raw: float = 0.0
    for c in cities:
        if int(c.get("team",-1)) != team:
            continue
        own.append(c)
        raw += float(city_science(int(c.get("pop",0)), c.get("buildings",[]))["total"])
    if own.is_empty():
        return 0.0
    var rate: float = raw
    if strategy_pacing:
        rate = raw * Growth.knowledge_city_multiplier(own.size()) / float(maxi(1,own.size())) * (1.0 + 0.40 * log(float(maxi(1,own.size()))) / log(2.0))
    var modifier: float = 1.0 if team == 0 else (0.88 if difficulty == "easy" else (1.12 if difficulty == "hard" else 1.0))
    return rate * modifier

static func research_cost(turns: int, age: int, tempo: float = 1.0, strategy_pacing: bool = false) -> float:
    return turns * SCIENCE_PER_TURN * tempo * (Growth.knowledge_cost_factor(age) if strategy_pacing else 1.0)
