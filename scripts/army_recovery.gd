extends RefCounted

const District=preload("res://scripts/district_context.gd")
const Economy=preload("res://scripts/economy_rules.gd")
const Needs=preload("res://scripts/city_needs.gd")

# Wounded units recover while stationed in a friendly city with food. Fallen
# soldiers remain fallen; battle initialization distributes health among the
# surviving members, as in the original campaign.
static func tick(state: Dictionary,dt: float) -> void:
	if state.get("battle")==null or state.battle.get("result")!=null:tick_infirmaries(state,dt)
	if state.get("battle")!=null:return
	for unit in state.units:
		if float(unit.get("hp",0))<=0:continue
		var definition: Dictionary=Economy.DATA.data.troops.get(unit.kind,{})
		var maximum:=float(unit.get("maxHp",definition.get("hp",unit.hp)))
		if float(unit.hp)>=maximum:continue
		var army: Variant=null
		for candidate in state.armies:
			if int(candidate.team)==int(unit.team) and int(candidate.get("id",0))==int(unit.get("armyId",0)):army=candidate;break
		if army==null:continue
		for city in state.cities:
			if int(city.team)!=int(unit.team) or int(city.c)!=int(army.c) or int(city.r)!=int(army.r):continue
			var stock: Dictionary=city.economy.realms[city.team].resources
			if Needs.food_total(stock)<=0:break
			var healed:=minf(maximum-float(unit.hp),dt*0.12)
			unit.hp=float(unit.hp)+healed;unit.healSupply=float(unit.get("healSupply",0))+healed
			if float(unit.healSupply)>=12:
				Economy.take_food(stock,1);unit.healSupply=float(unit.healSupply)-12
			break

# The original infirmary adds separate recovery and consumes bread per 12 HP.
static func tick_infirmaries(state: Dictionary,dt: float) -> void:
	for parent in state.cities:
		for city in District.contexts(parent):
			var workers:=0.0
			for building in city.economy.get("buildings",[]):
				if building.type=="infirmary" and building.get("ready",false) and float(building.get("hp",0))>0 and not building.get("disabled",false):workers+=minf(1.0,float(building.get("assigned",0)))
			if workers<0.1:continue
			var team:=int(city.team);var stock: Dictionary=city.economy.realms[team].resources
			for unit in state.units:
				if int(unit.team)!=team or float(unit.get("hp",0))<=0 or unit.get("garrison",false):continue
				var definition: Dictionary=Economy.DATA.data.troops.get(unit.kind,{})
				if definition.is_empty() or float(stock.get("bread",0))<1:continue
				var maximum:=float(unit.get("maxHp",definition.get("hp",unit.hp)))
				if float(unit.hp)>=maximum:continue
				var present:=false
				for army in state.armies:
					if int(army.team)==team and int(army.get("id",0))==int(unit.get("armyId",0)) and int(army.c)==int(city.c) and int(army.r)==int(city.r) and army.get("embarked")==null:present=true;break
				if not present:continue
				var gained:=minf(maximum-float(unit.hp),dt*0.25*workers)
				unit.hp=float(unit.hp)+gained;unit.medievalHealSupply=float(unit.get("medievalHealSupply",0))+gained
				if float(unit.medievalHealSupply)>=12:
					var meals:=mini(floori(float(unit.medievalHealSupply)/12),floori(float(stock.bread)))
					stock.bread=float(stock.bread)-meals;unit.medievalHealSupply=float(unit.medievalHealSupply)-12*meals
