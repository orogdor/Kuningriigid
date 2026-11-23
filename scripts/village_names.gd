class_name VillageNames
extends RefCounted
const DATA := preload("res://data/names.json")

static func name_for(seed: int, team: int, city_number: int, existing: Array = [], faction_names: Array = []) -> String:
	if team >= 0 and team < faction_names.size() and faction_names[team] is String and not faction_names[team].strip_edges().is_empty():
		return faction_names[team].strip_edges()+"küla "+str(city_number)
	var index := posmod(team,DATA.data.names.size())
	var pool: Array = DATA.data.names[index]
	var offset := posmod(seed,pool.size())
	var start := (offset+team*7+maxi(0,city_number-1))%pool.size()
	for i in pool.size():
		var candidate: String = pool[(start+i)%pool.size()]
		if candidate not in existing: return candidate
	var suffix := 2
	while pool[start]+" "+str(suffix) in existing: suffix += 1
	return pool[start]+" "+str(suffix)
