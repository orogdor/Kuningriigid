class_name CityBuildRules
extends RefCounted
const Economy = preload("res://scripts/economy_rules.gd")
const Availability = preload("res://scripts/era_availability.gd")
const Research = preload("res://scripts/research_rules.gd")
const DATA := preload("res://data/build_rules.json")
const DEPOSIT_NAMES := {"clay":"savi","copper":"vasemaak","tin":"tinamaak","wood":"mets","stone":"kivi","ore":"rauamaak","grain":"viljakas põllumaa","water":"mageveeallikas","game":"ulukid","fish":"kalapüügikoht","oil":"naftamaardla"}
const DEPOSIT_TYPES := {"claypit":"clay","coppermine":"copper","tinmine":"tin","lumber":"wood","quarry":"stone","mine":"ore","oilwell":"oil","well":"water","hunter":"game"}

# City-specific checks for an ordinary urban tile. County rules, obsolescence,
# cross-district prerequisites, bridges and special placement remain separate.
static func urban_rule(state: Dictionary, city: Dictionary, cell: Dictionary, type: String, is_coast: bool, near_river := false, all_buildings: Array=[],options:Dictionary={}) -> String:
	var definitions: Dictionary = Economy.DATA.data.buildings
	if not definitions.has(type): return "Seda hoonet ei saa ehitada."
	if cell.mountain: return "Mäed on läbimatud ja sinna ei saa ehitada."
	var replacement: Variant=Availability.building_successor(state,city.team,type)
	if replacement!=null and not options.get("outerRingV184",false):return "Asendatud: "+str(definitions[replacement].name)
	if type=="field":
		var farm_ready:=false
		for building in city.economy.buildings:
			if building.type=="farm" and building.get("ready",false) and not building.get("disabled",false) and float(building.get("hp",0))>0:farm_ready=true;break
		if not farm_ready:return "Ehita samale ruudule kõigepealt valmis põllutalu."
	if type == "bridge" and not cell.get("river",false): return "Silda saab ehitada ainult jõeruudule."
	if type == "bridge" and cell.get("bridge",false): return "Sellel ruudul on sild juba olemas."
	if type == "harbor" and not is_coast: return "Sadam vajab rannikuruutu, mille kõrval on meri."
	if type == "fisher" and not is_coast: return "Kalamehe onni saab ehitada ainult päris mererannale."
	if type == "watermill" and not near_river and not cell.get("river",false): return "Vesiveski vajab jõge samal või naaberruudul."
	if type == "windmill" and not cell.get("deposits",{}).get("grain",false): return "Tuuleveski vajab avatud viljakat maad."
	var tech: String = Research.DATA.data.build_tech.get(type,"")
	if not tech.is_empty() and tech not in state.research[city.team].known: return "Uuri: "+Research.DATA.data.techs[tech].name
	var age: int = DATA.data.age.get(type,9)
	if age > state.ages[city.team]:
		var age_name: String = Economy.DATA.data.ages[age].name if age < Economy.DATA.data.ages.size() else ""
		return "Vajab ajastut: "+age_name
	var deposit: String = DEPOSIT_TYPES.get(type,DATA.data.good_buildings.get(type,{}).get("deposit",""))
	if not deposit.is_empty() and not cell.get("deposits",{}).get(deposit,false):
		return "Selle linna ruudul puudub "+str(DEPOSIT_NAMES.get(deposit,Economy.DATA.data.resource_names.get(deposit,deposit)))+"."
	if all_buildings.is_empty():return Economy.requirement(city.economy,city.team,type)
	var economy:Dictionary=city.economy.duplicate();economy.buildings=all_buildings
	return Economy.requirement(economy,city.team,type)
