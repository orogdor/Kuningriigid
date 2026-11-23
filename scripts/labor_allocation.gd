class_name LaborAllocation
extends RefCounted
const Econ=preload("res://scripts/economy_rules.gd")
const Needs=preload("res://scripts/city_needs.gd")
const IMPLEMENTED:=["hunter","fisher","well","lumber","quarry","study","farm","saw","mill","bakery","warehouse","forester","mine","coppermine","tinmine","claypit","gem_mine","oilwell","pottery_kiln","mason","bronze_foundry","cartwright","coal","smelter","smith","scriptorium","library","academy","vegetable_garden","orchard","dairy","spice_garden","coffee_farm","flax_farm","silk_farm","dye_garden","cocoa_farm","rubber_farm","weaver","jeweler","silk_weaver","perfumery","chocolatier","electronics_factory","market","pasture","school","university","monastery","chapel","observatory","public_school","high_school","polytechnic","laboratory","printer","nitrate","powdermill","steelworks","engineworks","refinery","powerplant","autofactory","watermill","windmill","guildhall","master_workshop","armor_workshop","infirmary","inn","railstation","airfield","siegeworkshop","watchtower","stonetower","keep","gatehouse","trade_yard","harbor"]

const FOUNDATION=["well","hunter","fisher","lumber","quarry","saw","house","study","mine","coal","smelter","smith","farm","pasture","forester","bronze_foundry","coppermine","tinmine"]

static func priority(b: Dictionary,food_critical: bool,water_critical: bool,shortages: Dictionary,scarce_wood: bool,stock: Dictionary) -> int:
	var type: String=b.type
	if food_critical and type in ["hunter","fisher","bakery","farm","pasture"]:return 171
	if water_critical and type=="well":return 169
	if type=="mason" and float(stock.get("cutstone",0))<75 and float(stock.get("stone",0))>=4:return 123
	if type=="forester" and (scarce_wood or float(stock.get("wood",0))<70):return 159
	if float(shortages.get("bronze",0))>0:
		if type=="bronze_foundry":return 157
		if type=="coppermine" and float(stock.get("copper",0))<12:return 155
		if type=="tinmine" and float(stock.get("tin",0))<12:return 154
	if float(shortages.get("weapons",0))>0:
		if type=="smith":return 156
		if type=="smelter" and float(stock.get("iron",0))<15:return 153
		if type=="mine" and float(stock.get("ore",0))<15:return 150
		if type=="coal" and float(stock.get("coal",0))<15:return 149
	if float(shortages.get("machines",0))>0:
		if type=="engineworks":return 24 if float(stock.get("steel",0))<3 or float(stock.get("plank",0))<2 else 165
		if type=="steelworks":return 24 if float(stock.get("iron",0))<5 or float(stock.get("coal",0))<3 else 154
		if type=="smelter":return 23 if float(stock.get("ore",0))<3 or float(stock.get("coal",0))<2 else 151
		if type=="mine" and float(stock.get("ore",0))<28:return 149
		if type=="coal" and float(stock.get("coal",0))<25:return 23 if float(stock.get("wood",0))<4 else 149
		if type=="lumber" and float(stock.get("wood",0))<35:return 155
		if type=="saw" and float(stock.get("plank",0))<24:return 151
	if float(shortages.get("steel",0))>0:
		if type=="steelworks":return 24 if float(stock.get("iron",0))<5 or float(stock.get("coal",0))<3 else 161
		if type=="smelter":return 23 if float(stock.get("ore",0))<3 or float(stock.get("coal",0))<2 else 151
		if type=="mine" and float(stock.get("ore",0))<28:return 149
		if type=="coal" and float(stock.get("coal",0))<25:return 23 if float(stock.get("wood",0))<4 else 149
		if type=="lumber" and float(stock.get("wood",0))<35:return 155
	if float(shortages.get("iron",0))>0:
		if type=="smelter":return 24 if float(stock.get("ore",0))<3 or float(stock.get("coal",0))<2 else 151
		if type=="mine" and float(stock.get("ore",0))<28:return 149
		if type=="coal" and float(stock.get("coal",0))<25:return 23 if float(stock.get("wood",0))<4 else 149
		if type=="lumber" and float(stock.get("wood",0))<30:return 153
	if float(shortages.get("gunpowder",0))>0:
		if type=="powdermill":return 23 if float(stock.get("saltpeter",0))<3 or float(stock.get("coal",0))<2 else 153
		if type=="nitrate" and float(stock.get("saltpeter",0))<20:return 24 if float(stock.get("grain",0))<4 or float(stock.get("water",0))<2 else 150
		if type=="coal" and float(stock.get("coal",0))<20:return 23 if float(stock.get("wood",0))<4 else 148
		if type=="farm" and float(stock.get("grain",0))<15:return 143
	if float(shortages.get("plank",0))>0:
		if type=="saw":return 25 if scarce_wood else 154
		if type=="lumber":return 160 if scarce_wood else 108
	if float(shortages.get("bread",0))>0:
		if type in ["hunter","fisher","bakery","farm"]:return 157
		if type=="mill":return 139
	if type in ["hunter","fisher","farm","mill","bakery"]:return 100 if food_critical else 65
	if type=="well":return 95 if water_critical else 68
	if type in ["lumber","quarry"]:return 78
	if type in ["watchtower","stonetower"]:return 30 if food_critical or water_critical else 74
	if type=="warehouse":return 38
	if type=="market":return 42
	if type in ["library","school","public_school","high_school","study","scriptorium","academy","university","observatory","polytechnic","laboratory"]:return 35 if food_critical or water_critical else 61
	if type in ["keep","gatehouse","infirmary"]:return 22 if food_critical else 72
	if type in ["guildhall","trade_yard","inn","monastery","chapel","siegeworkshop"]:return 20 if food_critical else 56
	if type=="forester":return 35
	if type=="saw":return 86 if float(stock.get("plank",0))<50 else 65
	if type in ["mine","coal","smelter","smith","printer","nitrate","powdermill","steelworks","engineworks","oilwell","refinery","powerplant","autofactory"]:return 55
	return 28

# The original allocator for the workplaces currently implemented by the port.
# Districts, military mobilization, training, AI priorities and later workplaces
# remain separate work. Fractions are deliberate: a worker represents a team.
static func allocate(state: Dictionary,city: Dictionary) -> void:
	var economy: Dictionary=city.economy
	if not city.get("districts",{}).is_empty():
		economy=city.economy.duplicate()
		var all_buildings:Array=[]
		for b in city.economy.buildings:
			if not b.get("virtual",false):all_buildings.append(b)
		for district in city.districts.values():
			for b in district.economy.buildings:
				if not b.get("virtual",false):all_buildings.append(b)
		economy.buildings=all_buildings
	var realm: Dictionary=economy.realms[city.team]
	var stock: Dictionary=realm.resources
	var budget:=maxf(0,float(realm.pop))
	if realm.get("housingShortage",false):budget=minf(budget,maxf(3,budget*0.75))
	var battle: Variant=state.get("battle")
	if battle is Dictionary and battle.get("civilianCityId")!=null and battle.get("civilianCityId")==city.get("id"):
		for unit in battle.get("squads",[]):
			if unit.get("civilian",false):budget=maxf(0,budget-1)
	var food_critical:=Needs.food_total(stock)<float(realm.pop)*2.5
	var water_critical:=float(stock.get("water",0))<float(realm.pop)*2
	var team:=int(city.team);var is_ai:=team>0;var wait: Variant=state.research[team].get("ageWait") if is_ai else null
	var shortages: Dictionary=wait.get("missing",{}).duplicate(true) if wait is Dictionary else {}
	if is_ai:
		var ages: Array=state.get("ages",[]);var age:=int(ages[team]) if team<ages.size() else 0
		if age>=1 and float(stock.get("bronze",0))<12:shortages.bronze=12-float(stock.get("bronze",0))
		if age>=2 and float(stock.get("weapons",0))<12:shortages.weapons=12-float(stock.get("weapons",0))
	var scarce_wood:=float(stock.get("wood",0))<(30 if float(shortages.get("plank",0))>0 else 12)
	var entries: Array=[]
	var pending:=false
	for b in economy.buildings:
		if (not b.get("ready",false) and not b.get("disabled",false) and b.get("workerLimit",1)!=0) or (b.get("wallUpgradeV184")!=null and float(b.get("hp",0))>0):pending=true
		if b.type not in IMPLEMENTED or not b.get("ready",false):continue
		b.assigned=0.0;b.efficiency=0.0
		if b.get("disabled",false) or b.get("virtual",false) or float(b.get("hp",0))<=0:continue
		var d: Dictionary=Econ.DATA.data.buildings[b.type]
		var need: float=d.get("workers",0)
		var limit: float=b.get("workerLimit",need)
		var output: String=d.get("out","")
		var used: float=Needs.food_total(stock) if output in Econ.DATA.data.food_keys else float(stock.get(output,0))
		var full:=not output.is_empty() and used>=Econ.storage_limit(economy.buildings,output)
		var idle: bool=b.type in ["study","scriptorium","library","academy","school","university","monastery","chapel","observatory","public_school","high_school","polytechnic","laboratory"] and state.research[city.team].get("active")==null
		var supplied: bool=Econ.can_afford(stock,d.get("input",{}))
		var want:=0.0 if full or idle or not supplied else maxf(0,minf(need,limit))
		if want<=0:continue
		var job_priority:=priority(b,food_critical,water_critical,shortages,scarce_wood,stock)
		if is_ai and b.type in FOUNDATION:job_priority+=60
		if str(b.get("status","")).to_lower().contains("pole ligipääsetavat") or str(b.get("status","")).to_lower().contains("maardla puudub"):job_priority=9
		entries.append({"b":b,"need":need,"want":want,"priority":job_priority,"order":entries.size(),"builder":false})
	var builders: Dictionary={}
	if pending and float(city.get("builderCount",1))>0:
		var count: float=maxf(0.0,float(city.get("builderCount",1)))
		entries.append({"b":builders,"need":count,"want":count,"priority":250 if int(city.team)>0 else 90,"order":entries.size(),"builder":true})
	var training: Array=city.get("training",[])
	if not training.is_empty():
		var job: Dictionary=training[0]
		if not job.get("blocked",false) and float(job.get("progress",0))<float(job.get("total",0)):
			var want:=maxf(0.0,minf(1.0,float(job.get("workerLimit",1))))
			entries.append({"b":job,"need":1.0,"want":want,"priority":96,"order":entries.size(),"builder":false})
	entries.sort_custom(func(a,b):return a.order<b.order if a.priority==b.priority else a.priority>b.priority)
	var food_source:=false
	for e in entries:
		if not e.builder and e.b.get("type","") in ["hunter","fisher","bakery"] and not str(e.b.get("status","")).to_lower().contains("pole ligipääsetavat") and not str(e.b.get("status","")).to_lower().contains("maardla puudub"):food_source=true;break
	var jobs: Dictionary=city.get("basicJobs",{"berries":1,"wood":1,"stone":1})
	var emergency:=minf(1,minf(budget*0.4,maxf(0,float(jobs.get("berries",1))))) if food_critical and not food_source else 0.0
	var remaining:=budget-emergency
	for e in entries:
		var essential: bool=e.builder or is_same(e.b,training[0] if not training.is_empty() else null) or e.b.get("type","") in FOUNDATION
		var portion:=maxf(0.5,minf(0.8,budget*0.16)) if e.builder else 0.25 if essential else 0.0
		var seed:=minf(float(e.want),minf(portion if is_ai else 0.1 if wait is Dictionary else 0.25,remaining))
		e.b.assigned=seed;remaining-=seed
	for e in entries:
		var extra:=minf(e.want-e.b.assigned,remaining)
		e.b.assigned+=extra;remaining-=extra
	for e in entries:e.b.efficiency=Econ.worker_efficiency(float(e.b.assigned),float(e.need))
	city.buildersAssigned=builders.get("assigned",0.0)
	city.basicJobs=jobs
	var wants: Dictionary={"berries":maxf(0,float(jobs.get("berries",1))-emergency),"wood":maxf(0,float(jobs.get("wood",1))),"stone":maxf(0,float(jobs.get("stone",1)))}
	var total: float=wants.berries+wants.wood+wants.stone
	var fraction:=minf(1.0,remaining/total) if total>0 else 0.0
	city.basicAssigned={"berries":emergency+wants.berries*fraction,"wood":wants.wood*fraction,"stone":wants.stone*fraction}
	realm.employed=budget-remaining-emergency+city.basicAssigned.berries+city.basicAssigned.wood+city.basicAssigned.stone
	realm.availableLabor=budget

