class_name CityNeeds
extends RefCounted
const DATA:=preload("res://data/city_needs.json")

static func food_total(stock: Dictionary) -> float:
	var keys: Array=["bread","flour","grain"]
	for kind in DATA.data.goods:
		if DATA.data.goods[kind].get("food",false):keys.append(kind)
	var total:=0.0
	for key in keys:total+=maxf(0,float(stock.get(key,0)))
	return total

static func calculate(city: Dictionary,age: int) -> Dictionary:
	var realm: Dictionary=city.economy.realms[city.team]
	var stock: Dictionary=realm.resources
	var threshold:=maxf(0.5,float(realm.get("pop",3))*0.1)
	var need: Dictionary=DATA.data.needs[clampi(age,0,6)]
	var foods: Array=[]
	var luxuries: Array=[]
	for kind in DATA.data.food_varieties:
		if kind=="cereal":
			if float(stock.get("bread",0))+float(stock.get("flour",0))+float(stock.get("grain",0))>=threshold:foods.append(kind)
		elif DATA.data.goods[kind].age<=age and float(stock.get(kind,0))>=threshold:foods.append(kind)
	for kind in DATA.data.luxuries:
		if (kind=="pottery" or DATA.data.goods[kind].age<=age) and float(stock.get(kind,0))>=threshold:luxuries.append(kind)
	var missing:=maxi(0,int(need.food)-foods.size())+maxi(0,int(need.luxury)-luxuries.size())
	var extra:=maxi(0,foods.size()-int(need.food))+maxi(0,luxuries.size()-int(need.luxury))
	var water_fetch: bool=city.get("waterFetchV267",false)
	var far: bool=city.get("waterFetchFarV280",false)
	return {"need":need,"foods":foods,"luxuries":luxuries,"threshold":threshold,"missing":missing,"extra":extra,"waterFetch":water_fetch,"waterFar":far,"productivity":(1-0.05*(missing+(1 if water_fetch else 0))+0.02*extra)*((0.8 if far else 0.9) if water_fetch else 1.0)}

static func consume_luxuries(city: Dictionary,age: int,dt: float) -> void:
	var realm: Dictionary=city.economy.realms[city.team]
	for key in DATA.data.luxuries:
		if key!="pottery" and int(DATA.data.goods[key].age)>age:continue
		realm.resources[key]=maxf(0.0,float(realm.resources.get(key,0.0))-float(realm.pop)*0.02*dt/60.0)
