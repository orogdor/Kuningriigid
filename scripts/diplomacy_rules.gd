class_name DiplomacyRules
extends RefCounted

static func pair(a: int,b: int) -> String:
	return "%d:%d" % [mini(a,b),maxi(a,b)]
static func relation(state: Dictionary,a: int,b: int) -> String:
	if a==b:return "own"
	return str(state.get("relations",{}).get(pair(a,b),{}).get("status","neutral"))
static func peace(state: Dictionary) -> bool:
	return float(state.get("peaceUntilV276",0))>float(state.get("time",0))
static func at_war(state: Dictionary,a: int,b: int) -> bool:
	return a!=b and not peace(state) and relation(state,a,b)=="war"
static func set_relation(state: Dictionary,a: int,b: int,status: String) -> void:
	if a==b or status not in ["neutral","friendly","war"]:return
	if not state.has("relations"):state.relations={}
	var key:=pair(a,b);var tension: float=float(state.relations.get(key,{}).get("tension",0))
	state.relations[key]={"tension":tension,"status":status}
	if not state.has("events"):state.events=[]
	var description: String="sõda" if status=="war" else "sõprus" if status=="friendly" else "neutraalne"
	state.events.append({"time":state.time,"text":"Riigid %d / %d: %s" % [a+1,b+1,description]})
static func change_player_relation(state: Dictionary,team: int,status: String) -> Dictionary:
	if team<1 or team>3 or status not in ["neutral","friendly","war"]:return {"error":"Vigane diplomaatiline käsk"}
	if status=="war" and peace(state):return {"error":"Algne rahuperiood pole veel lõppenud"}
	set_relation(state,0,team,status);return {"ok":true}
static func merchant_access(state: Dictionary,team: int,city: Dictionary) -> bool:
	return team==int(city.team) or (relation(state,team,int(city.team))=="friendly" and not city.get("blockedMerchants",{}).get(str(team),false))
static func block_merchants(state: Dictionary,city: Dictionary,team: int,blocked: bool) -> void:
	if not city.has("blockedMerchants"):city.blockedMerchants={}
	city.blockedMerchants[str(team)]=blocked
	if not blocked:return
	if not state.has("relations"):state.relations={}
	var key:=pair(int(city.team),team)
	if not state.relations.has(key):state.relations[key]={"status":"neutral","tension":0}
	var rel: Dictionary=state.relations[key]
	rel.tension=minf(100,float(rel.get("tension",0))+15)
static func tick(state: Dictionary,dt: float) -> void:
	state.diplomacyClock=float(state.get("diplomacyClock",0))+dt
	if state.diplomacyClock<60:return
	state.diplomacyClock=fmod(state.diplomacyClock,60.0)
	for key in state.get("relations",{}):
		var rel: Dictionary=state.relations[key]
		if rel.status=="war":continue
		var parts:=str(key).split(":");var a:=int(parts[0]);var b:=int(parts[1]);var blocked:=false
		for city in state.cities:
			if (int(city.team)==a and city.get("blockedMerchants",{}).get(str(b),false)) or (int(city.team)==b and city.get("blockedMerchants",{}).get(str(a),false)):blocked=true;break
		rel.tension=clampf(float(rel.get("tension",0))+(5 if blocked else -2),0,100)
		if blocked:
			var n:=sin(float(state.get("seed",1))*12.9+float(state.time)*78.2+a*23+b)*43758.54
			if n-floor(n)<float(rel.tension)/100.0*0.2:set_relation(state,a,b,"war")
