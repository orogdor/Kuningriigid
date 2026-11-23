class_name AITreasury
extends RefCounted
const Discoveries=preload("res://scripts/world_discoveries.gd")
const Economy=preload("res://scripts/economy_rules.gd")
const Era=preload("res://scripts/era_economy.gd")
const Needs=preload("res://scripts/city_needs.gd")
const Research=preload("res://scripts/research_rules.gd")

static func tick(state: Dictionary,dt: float) -> void:
	state.treasuryClockV280=float(state.get("treasuryClockV280",0))+dt
	if state.treasuryClockV280<30:return
	state.treasuryClockV280=0
	for team in [1,2,3]:
		var towns: Array=[]
		for city in state.cities:
			if int(city.team)==team and city.get("districtOf")==null:towns.append(city)
		if towns.is_empty():continue
		var trader:=posmod(int(state.seed)+team*7,3)==2
		var research: Dictionary=state.research[team];var wait: Variant=research.get("ageWait")
		var missing: Dictionary=Era.age_deficit(state,team,str(wait.id)) if wait is Dictionary else {}
		for town in towns:
			var village: Dictionary={};var best:=23
			for landmark in state.get("landmarks",[]):
				if Discoveries.village_type(landmark)!="traders":continue
				var d:=absi(int(landmark.c)-int(town.c))+absi(int(landmark.r)-int(town.r))
				if d<best:best=d;village=landmark
			if village.is_empty():continue
			state.explored[team][str(int(village.c))+":"+str(int(village.r))]=true
			var realm: Dictionary=town.economy.realms[team];var stock: Dictionary=realm.resources
			var buildings: Array=town.economy.buildings.duplicate()
			for district in town.get("districts",{}).values():buildings.append_array(district.get("economy",{}).get("buildings",[]))
			var lumber:=false;var quarry:=false
			for b in buildings:
				if not b.get("ready",false) or float(b.get("hp",0))<=0:continue
				var status:=str(b.get("status",""))
				if status.contains("pole ligipääsetavat") or status.contains("maardla puudub"):continue
				if b.type=="lumber":lumber=true
				if b.type=="quarry":quarry=true
			var pop:=float(realm.get("pop",3));if pop==0:pop=3
			var hungry:=Needs.food_total(stock)<pop*(3 if trader else 2)
			var want_wood:=float(missing.get("wood",0))>0 or (float(stock.get("wood",0))<40 and not lumber)
			var want_stone:=float(missing.get("stone",0))>0 or (float(stock.get("stone",0))<25 and not quarry)
			if (hungry or want_wood or want_stone) and float(stock.get("gold",0))<12:
				if float(stock.get("wood",0))>=80 and not want_wood:Discoveries.trade_with_village(state,str(village.id),"sell_wood",team)
				elif float(stock.get("stone",0))>=80 and not want_stone:Discoveries.trade_with_village(state,str(village.id),"sell_stone",team)
			if (hungry or float(missing.get("bread",0))>0) and float(stock.get("gold",0))>=12:Discoveries.trade_with_village(state,str(village.id),"buy_food",team)
			if want_wood and float(stock.get("gold",0))>=12:Discoveries.trade_with_village(state,str(village.id),"buy_wood",team)
			if want_stone and float(stock.get("gold",0))>=12:Discoveries.trade_with_village(state,str(village.id),"buy_stone",team)
			if float(stock.get("wood",0))>=Economy.storage_limit(buildings,"wood")*0.9:Discoveries.trade_with_village(state,str(village.id),"sell_wood",team)
			if float(stock.get("stone",0))>=Economy.storage_limit(buildings,"stone")*0.9:Discoveries.trade_with_village(state,str(village.id),"sell_stone",team)
		var gold:=0.0
		for town in towns:gold+=float(town.economy.realms[team].resources.get("gold",0))
		if gold>=80 and research.active!=null and wait==null:Research.buy_research(state,team)
