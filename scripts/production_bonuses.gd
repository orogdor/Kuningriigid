class_name ProductionBonuses
extends RefCounted
const Econ=preload("res://scripts/economy_rules.gd")
const Research=preload("res://scripts/research_rules.gd")
const Needs=preload("res://scripts/city_needs.gd")
const Grid=preload("res://scripts/campaign_grid.gd")
const REFORMS=preload("res://data/production_reforms.json")

static func upgrade_level(state: Dictionary,team: int) -> int:
	var known: Array=state.research[team].known
	return 6 if "modernity" in known else (5 if "industrialization" in known else (4 if "renaissance" in known else (3 if "medieval_crafts" in known else (2 if "iron_crafts" in known else (1 if "bronze_crafts" in known else 0)))))

static func national(state: Dictionary,team: int) -> float:
	return 1.0+upgrade_level(state,team)*0.25+(0.1 if "stone_crafts" in state.research[team].known else 0.0)

static func productivity(state: Dictionary,team: int,type: String) -> float:
	var target: String="quarry" if type=="basic_stone" else type
	var bonus:=1.0
	for id in state.research[team].known:
		var tech: Dictionary=Research.DATA.data.techs.get(id,{})
		if tech.has("workBonus") and target in tech.get("targets",[]):bonus+=float(tech.workBonus)
	return bonus

static func reform(state: Dictionary,team: int,type: String) -> float:
	if not state.get("strategyPacingV125",false):return 1.0
	var output: String=Econ.DATA.data.buildings.get(type,{}).get("out","")
	if output.is_empty():return 1.0
	var bonus:=1.0
	for entry in REFORMS.data:
		if entry.id in state.research[team].known and output in entry.outputs:bonus+=float(entry.bonus)
	return minf(1.6,bonus)

static func terrain(cells: Array,city: Dictionary) -> Dictionary:
	var index:=int(city.r)*Grid.COLS+int(city.c)
	if index<0 or index>=cells.size():return {}
	var cell: Dictionary=cells[index]
	if not cell.land:return {}
	var river: bool=cell.get("river",false)
	var hills:=false;var coast:=false
	for dr in range(-1,2):
		for dc in range(-1,2):
			var c:=int(city.c)+dc;var r:=int(city.r)+dr
			if c<0 or r<0 or c>=Grid.COLS or r>=Grid.ROWS:continue
			var n: Dictionary=cells[r*Grid.COLS+c]
			river=river or n.get("river",false);hills=hills or n.get("mountain",false);coast=coast or not n.land
	var result: Dictionary={}
	if cell.biome=="forest":result.lumber=1.25;result.forester=1.2;result.saw=1.18
	if hills and cell.deposits.get("stone",false):result.quarry=1.25
	if hills and cell.deposits.get("ore",false):result.mine=1.2
	if cell.deposits.get("grain",false):result.farm=1.2+(0.18 if cell.biome=="plains" else 0)+(0.15 if river else 0)
	if river and cell.deposits.get("water",false):result.well=1.2
	if coast and cell.deposits.get("fish",false):result.fisher=1.22
	return result

static func workplace(state: Dictionary,city: Dictionary,type: String,terrain_modifiers: Dictionary,city_buildings: Array=[]) -> float:
	var result: float=Needs.calculate(city,int(state.ages[city.team])).productivity*national(state,city.team)*float(terrain_modifiers.get(type,1.0))*productivity(state,city.team,type)*reform(state,city.team,type)
	if type not in ["guildhall","hall","keep","gatehouse"]:
		for building in (city_buildings if not city_buildings.is_empty() else city.economy.buildings):
			if building.type=="guildhall" and building.get("ready",false) and float(building.get("hp",0))>0 and not building.get("disabled",false) and float(building.get("assigned",0))>=0.5:
				result*=1.13;break
	if type=="lumber" and state.ages[city.team]==0 and "fortifications" in state.research[city.team].known:result*=1.75
	return result

static func basic(state: Dictionary,city: Dictionary,type: String) -> float:
	return Needs.calculate(city,int(state.ages[city.team])).productivity*national(state,city.team)*productivity(state,city.team,type)

static func apply_building_upgrades(state: Dictionary,city: Dictionary) -> void:
	var level:=upgrade_level(state,city.team)
	for building in city.economy.buildings:
		var previous:=int(building.get("upgradeLevel",0))
		if level>previous and float(building.get("hp",0))>0:
			building.hp=float(building.hp)+(level-previous)*60
		building.upgradeLevel=level
		building.maxHp=(1200 if building.type=="hall" else 350)+level*60
