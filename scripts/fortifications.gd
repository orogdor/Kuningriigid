extends RefCounted
const WALL_TYPES=["palisade","stonewall","reinforced_wall","keep"]
const CAPACITY={"palisade":2,"stonewall":3,"reinforced_wall":4,"keep":6}

static func guards(state: Dictionary,city: Dictionary,building: Dictionary) -> Array:
 var result:=[]
 for source in state.units.size():
  var unit: Dictionary=state.units[source];var post: Variant=unit.get("garrison")
  if float(unit.get("hp",0))<=0 or int(unit.team)!=int(city.team) or not post is Dictionary:continue
  if int(post.get("c",-1))==int(city.c) and int(post.get("r",-1))==int(city.r) and float(post.get("x",INF))==float(building.x) and float(post.get("z",INF))==float(building.z):result.append({"unit":unit,"source":source})
 return result

static func station(state: Dictionary,city: Dictionary,building: Dictionary,source: Variant=null) -> Dictionary:
 if state.get("battle") is Dictionary and state.battle.get("result")==null:return {"error":"Lahingu ajal garnisoni muuta ei saa."}
 if building.get("type","") not in WALL_TYPES or building not in city.economy.buildings:return {"error":"Vali oma linna müürilõik."}
 if not building.get("ready",false) or float(building.get("hp",0))<=0 or building.get("disabled",false):return {"error":"Müür peab olema valmis ja kasutuskõlblik."}
 var present:=guards(state,city,building)
 if present.size()>=int(CAPACITY.get(building.type,0)):return {"error":"Müüril pole rohkem sõdurikohti."}
 var choices:=[]
 for index in state.units.size():
  var unit: Dictionary=state.units[index]
  if int(unit.team)!=int(city.team) or float(unit.get("hp",0))<=0 or unit.get("garrison")!=null:continue
  for army in state.armies:
   if int(army.team)==int(unit.team) and army.get("embarked")==null and int(army.get("id",0))==int(unit.get("armyId",0)) and int(army.c)==int(city.c) and int(army.r)==int(city.r) and army.get("path",[]).is_empty():choices.append({"unit":unit,"source":index});break
 var chosen: Variant=null
 for choice in choices:
  if source!=null and int(choice.source)==int(source):chosen=choice;break
  if source==null and choice.unit.kind!="scout":chosen=choice;break
 if chosen==null and source==null and not choices.is_empty():chosen=choices[0]
 if chosen==null:return {"error":"Saada oma armee selle linna ruudule ja peata liikumine, seejärel määra sõdur müürile."}
 chosen.unit.garrison={"c":city.c,"r":city.r,"x":building.x,"z":building.z,"wallType":building.type,"wallAxis":building.get("wallAxis",0),"slot":present.size()}
 return {"ok":true,"source":chosen.source}

static func release(state: Dictionary,city: Dictionary,building: Dictionary) -> Dictionary:
 if state.get("battle") is Dictionary and state.battle.get("result")==null:return {"error":"Lahingu ajal garnisoni muuta ei saa."}
 var present:=guards(state,city,building)
 if present.is_empty():return {"error":"Sellel müüril pole sõdureid."}
 var chosen: Dictionary=present.back();var target: Variant=null
 for army in state.armies:
  if int(army.team)!=int(city.team) or army.get("embarked")!=null or int(army.c)!=int(city.c) or int(army.r)!=int(city.r) or not army.get("path",[]).is_empty():continue
  for unit in state.units:
   if int(unit.team)==int(city.team) and float(unit.get("hp",0))>0 and unit.get("garrison")==null and int(unit.get("armyId",0))==int(army.get("id",0)):target=army;break
  if target!=null:break
 if target==null:
  var maximum:=0
  for army in state.armies:maximum=maxi(maximum,int(army.get("id",0)))
  var id:=maxi(int(state.get("nextArmyId",1)),maximum+1);state.nextArmyId=id+1
  target={"id":id,"team":city.team,"c":city.c,"r":city.r,"path":[],"stance":"defend"};state.armies.append(target)
 chosen.unit.armyId=int(target.get("id",0));chosen.unit.erase("garrison")
 return {"ok":true,"source":chosen.source}

