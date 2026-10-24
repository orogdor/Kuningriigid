extends RefCounted
## V3.6: deterministic historical-inspired civic, residential and production zoning.
## Pure placement priority only. Does not invent buildings/resources, and the
## caller still enforces terrain, footprint collisions and connected city limits.
const CIVIC: Array[String] = ["hall","market","study","school","well","bakery","warehouse","cellar","chapel","inn"]
const RESIDENTIAL: Array[String] = ["house"]
const RURAL: Array[String] = ["lumber","forester","hunter","fisher","farm","quarry","mine","coal","claypit"]
const INDUSTRIAL: Array[String] = ["saw","mill","smelter","smith","kiln","foundry","steelworks","machine_shop"]

static func zone(kind: String) -> String:
    if CIVIC.has(kind):
        return "civic"
    if RESIDENTIAL.has(kind):
        return "housing"
    if RURAL.has(kind):
        return "rural"
    if INDUSTRIAL.has(kind):
        return "industry"
    if kind in ["barracks","archery","stable","watchtower"]:
        return "military"
    return "mixed"

static func housing_target(population: int,house_capacity: int = 3,hall_capacity: int = 4) -> int:
    # Keep one new home as a small capacity buffer; do not cap at five houses.
    return maxi(1,ceili(float(maxi(0,population)+2-hall_capacity)/float(maxi(1,house_capacity))))

static func candidate_score(kind: String,point: Vector2,used: Array) -> float:
    var section: String = zone(kind)
    var radius: float = point.length()
    var score: float = radius * (0.60 if section == "rural" else (0.85 if section == "industry" else 1.0))
    var near_any: float = 10.0
    var near_own: float = 12.0
    var near_homes: float = 12.0
    for parcel in used:
        var other: String = String(parcel.get("kind",""))
        if other == "hall":
            continue
        var distance: float = point.distance_to(parcel["point"])
        near_any = minf(near_any,distance)
        if zone(other) == section:
            near_own = minf(near_own,distance)
        if zone(other) == "housing":
            near_homes = minf(near_homes,distance)
    # Compact blocks of buildings, without piling them onto the same plot.
    score += absf(near_any-1.9)*.32 + absf(near_own-2.7)*.24
    if section == "industry" or section == "rural":
        # Keep production away from densely occupied residential plots.
        score += maxf(0.0,3.5-near_homes)*1.5
    if section == "civic":
        score += maxf(0.0,near_homes-3.0)*.17
    # Small seeded street irregularity rather than artificial perfect circles.
    var wave: float = sin(point.x*4.71+point.y*2.93+float(kind.length())*.61)
    return score + wave*.18
