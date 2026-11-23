class_name AIResearch
extends RefCounted

const StoneDefense=preload("res://scripts/ai_stone_defenses.gd")
const Research=preload("res://scripts/research_rules.gd")
const DATA=preload("res://data/ai_research.json")
const REFORMS=[
 ["village_council","grain_storage"],["trade_roads","field_channels","bronze_survey"],
 ["military_supply","regional_roads","crop_rotation_v125","iron_markets"],
 ["water_machinery","medieval_hospitals","sanitation","guild_accounts","town_charters","garrison_system"],
 ["merchant_banking","harbor_cranes","agricultural_science","cannon_supply","modern_cartography"],
 ["factory_logistics","steel_standards","rail_freight","public_utilities"],["power_grid","automated_supply"]]
const GATES=["bronze","iron","civics","renaissance","industrialization","modernity"]
const PERSONALITIES=[
 ["hunting","warfare","agriculture","woodworking","archery"],
 ["stone_tools","agriculture","woodworking","pottery","stone_crafts"],
 ["fishing","settlement","pottery","storage","animal_husbandry"]]

static func find_goal(research: Dictionary,id: String,seen: Dictionary) -> Variant:
	var techs: Dictionary=Research.DATA.data.techs
	if id in research.known or not techs.has(id) or seen.has(id):return null
	seen[id]=true
	var tech: Dictionary=techs[id];var age:=int(tech.age)
	if age>0:
		var gate: String=Research.DATA.data.era_ids[age]
		if gate!=id and gate not in research.known:
			var found: Variant=find_goal(research,gate,seen)
			if found!=null:return found
	for parent in tech.requires:
		if parent not in research.known:
			var found: Variant=find_goal(research,str(parent),seen)
			if found!=null:return found
	if tech.has("oneOf"):
		var any:=false
		for parent in tech.oneOf:
			if parent in research.known:any=true;break
		if not any:
			for parent in tech.oneOf:
				var found: Variant=find_goal(research,str(parent),seen)
				if found!=null:return found
	return id if Research.tech_block(research,id).is_empty() else null

static func next_for_goals(research: Dictionary,goals: Array) -> Variant:
	for goal in goals:
		var found: Variant=find_goal(research,str(goal),{})
		if found!=null:return found
	return null

static func expanded_order(original: Array) -> Array:
	var result: Array=[]
	for id in original:
		var gate:=GATES.find(id)
		if gate>=0:
			for reform in REFORMS[gate]:
				if reform not in result:result.append(reform)
		if id not in result:result.append(id)
	for reform in REFORMS[6]:
		if reform not in result:result.append(reform)
	return result

static func goals(state: Dictionary,team: int,coastal: bool) -> Array:
	var research: Dictionary=state.research[team];var age:=int(state.ages[team])
	var personality:=posmod(int(state.seed)+team*7,3)
	var order: Array=["fire_use"]
	order.append_array(PERSONALITIES[personality])
	for entry in DATA.data.productivity:
		if int(entry.age)<=age:order.append(entry.id)
	order.append_array(DATA.data.fixed)
	var urgent: Array=[]
	if coastal and (personality==2 or PERSONALITIES[personality][0] in research.known):urgent.append("fishing")
	if age>=1:urgent.append_array(["stone_fortifications","commerce","shipbuilding"])
	var expanded:=expanded_order(order);urgent.append_array(expanded)
	var result: Array=[]
	var techs: Dictionary=Research.DATA.data.techs
	if age==1:
		if not state.has("ageStartedAtV160"):state.ageStartedAtV160={}
		if not state.ageStartedAtV160.has(str(team)):
			var recorded: float=float(state.time)
			for entry in research.get("completed",[]):
				if entry.get("id","")=="bronze":recorded=float(entry.get("time",state.time));break
			state.ageStartedAtV160[str(team)]=recorded
	var bronze_start: float=float(state.get("ageStartedAtV160",{}).get(str(team),state.time))
	var early_bronze:=age==1 and (float(state.time)-bronze_start)<95*60
	for id in urgent:
		if not techs.has(id):continue
		if early_bronze and int(techs[id].age)>1:continue
		result.append(id)
	return result

static func plan(state: Dictionary,team: int,coastal: bool) -> Variant:
	var research: Dictionary=state.research[team]
	var capital:Variant=null
	for city in state.cities:
		if int(city.team)==team:capital=city;break
	if capital==null:return null
	var missing_stone:=false
	for key in Research.DATA.data.techs:
		if int(Research.DATA.data.techs[key].get("age",0))==0 and key not in research.known:missing_stone=true;break
	var postpone:bool=missing_stone and StoneDefense.age_gate(capital,int(state.ages[team]),float(state.time))
	if postpone and research.active=="bronze":research.active=null
	if research.active!=null:return research.active
	var id: Variant=next_for_goals(research,goals(state,team,coastal))
	if postpone and id=="bronze":id=null
	if id!=null and Research.start_research(state,team,id).has("ok"):return id
	var options: Array=[];var techs: Dictionary=Research.DATA.data.techs
	for key in techs:
		if key not in research.known and int(techs[key].age)<=int(state.ages[team]) and (not postpone or key!="bronze"):options.append(key)
	options.sort_custom(func(a,b):return float(techs[a].get("turns",9))<float(techs[b].get("turns",9)))
	for option in options:
		if Research.start_research(state,team,option).has("ok"):return option
	return null
