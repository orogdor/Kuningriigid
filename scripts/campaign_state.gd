class_name CampaignState
extends RefCounted
const Research = preload("res://scripts/research_rules.gd")
const Economy = preload("res://scripts/economy_rules.gd")

static func create_game(seed: int, starts: Array,world_type:="tectonic") -> Dictionary:
	var research: Array = []
	var ages: Array = []
	var settlers: Array = []
	var units: Array = []
	var armies: Array = []
	var explored: Array = []
	for team in 4:
		var p: Dictionary = starts[team]
		research.append(Research.new_research())
		ages.append(0)
		settlers.append({"id":team,"team":team,"c":int(p.c),"r":int(p.r),"x":0,"z":0,"path":[],"landed":false,"localTarget":null})
		units.append({"kind":"scout","team":team,"hp":int(Economy.DATA.data.troops.scout.hp),"morale":100})
		armies.append({"team":team,"c":int(p.c),"r":int(p.r),"path":[]})
		explored.append({})
	return {"version":4,"unitBalanceVersion":99,"roadKeyCols":220,"hydrologyVersion":2,"tempo":"normal","strategyPacingV125":true,"researchBalanceVersion":2,"mapExpansionVersion":2,"worldScaleVersion":2,"geographyVersion":0 if world_type=="inland" else 4 if world_type=="continents" else 7,"coastalStartsVersion":1,"seed":seed,"type":world_type,"difficulty":"normal","time":0,"research":research,"ages":ages,"cities":[],"settlers":settlers,"nextSettler":4,"units":units,"explorerVersion":1,"armies":armies,"deployments":{},"explored":explored,"visionClock":0,"clock":0,"battle":null,"winner":null,"lakeOutletsV275":true,"naturalShoreV278":true}

static func apply_coastal_starts(state: Dictionary, coastal: Array) -> void:
	state.coastalStartPositions = coastal.duplicate(true)
	for team in 4:
		var p: Dictionary = coastal[team]
		var a: Dictionary = state.settlers[team]
		var army: Dictionary = state.armies[team]
		a.c = int(p.c); a.r = int(p.r); a.x = 0; a.z = 0; a.path = []; a.landed = false; a.localTarget = null
		army.c = int(p.c); army.r = int(p.r); army.path = []

static func reveal(state: Dictionary, team: int, c: int, r: int, radius := 2) -> void:
	for dr in range(-radius,radius+1):
		for dc in range(-radius,radius+1):
			var x := c+dc
			var y := r+dr
			if x < 0 or x >= 220 or y < 0 or y >= 165 or abs(dc)+abs(dr) > radius+1: continue
			var key := str(x)+":"+str(y)
			if not state.explored[team].has(key):
				state.explored[team][key] = 1
				if team == 0: state.visionRevision = int(state.get("visionRevision",0))+1

static func seed_from_text(value: String) -> int:
	# JS Array.from iterates Unicode code points; charCodeAt(0) yields a high
	# surrogate for non-BMP points. Arithmetic is unsigned 32-bit.
	var result := 0
	for i in value.length():
		var code := value.unicode_at(i)
		if code > 0xffff: code = 0xd800 + ((code-0x10000) >> 10)
		result = (result*31+code) & 0xffffffff
	return result

static func in_range(a: Dictionary,b: Dictionary,radius: int) -> bool:
	var dc:=absi(int(a.c)-int(b.c));var dr:=absi(int(a.r)-int(b.r))
	return dc<=radius and dr<=radius and dc+dr<=radius+1

static func visible_now(state: Dictionary,team: int,where: Dictionary) -> bool:
	if not where.has("c") or not where.has("r"):return false
	for city in state.get("cities",[]):
		if int(city.team)==team and in_range(city,where,maxi(2,int(city.get("radius",1)))):return true
	for band in state.get("settlers",[]):
		if int(band.team)==team and band.get("embarked")==null and in_range(band,where,2):return true
	for army in state.get("armies",[]):
		if int(army.team)==team and army.get("embarked")==null and in_range(army,where,2):return true
	for ship in state.get("ships",[]):
		if int(ship.team)==team and float(ship.get("hp",0))>0 and in_range(ship,where,2):return true
	return false
