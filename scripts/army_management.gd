class_name ArmyManagement
extends RefCounted
const Experience=preload("res://scripts/army_experience.gd")

static func units(state: Dictionary,army: Dictionary) -> Array:
 var result: Array=[]
 for u in state.units:
  if int(u.team)==int(army.team) and float(u.hp)>0 and not Experience.is_garrisoned(u) and int(u.get("armyId",0))==int(army.get("id",0)):result.append(u)
 return result
static func split(state: Dictionary,army: Dictionary) -> Dictionary:
 var people:=units(state,army)
 if people.size()<2:return {"error":"Armee jagamiseks on vaja vähemalt kahte elusat sõdalast."}
 if not state.has("nextArmyId"):state.nextArmyId=1
 var id:=int(state.nextArmyId);state.nextArmyId=id+1
 var group={"team":army.team,"id":id,"c":army.c,"r":army.r,"path":[],"stance":"defend","xp":army.get("xp",0),"level":army.get("level",1)}
 var half:=floori(float(people.size())/2)
 for i in range(people.size()-half,people.size()):people[i].armyId=id
 state.armies.append(group);return {"army":group,"count":half}
static func merge(state: Dictionary,selected: Variant) -> Dictionary:
 if selected==null or selected.get("embarked")!=null or state.get("battle")!=null:return {"error":"Ühendamiseks peavad armeed olema maal ja väljaspool lahingut."}
 var groups: Array=[]
 for army in state.armies:
  if int(army.team)==int(selected.team) and army.get("embarked")==null and int(army.c)==int(selected.c) and int(army.r)==int(selected.r) and not units(state,army).is_empty():groups.append(army)
 if groups.size()<2:return {"error":"Too vähemalt kaks oma armeed samasse ruutu."}
 var target: Dictionary=selected
 for army in groups:
  if int(army.get("id",0))==0:target=army;break
 var counts: Array=[];var total:=0;var xp:=0.0
 for army in groups:
  var count:=units(state,army).size();counts.append({"army":army,"count":count});total+=count;xp+=float(army.get("xp",0))*count
 target.xp=xp/total
 for item in counts:
  for u in units(state,item.army):u.armyId=int(target.get("id",0))
 target.path=[];target.autoExplore=false;target.erase("rallyTarget")
 var retained: Array=[]
 for army in state.armies:
  if is_same(army,target) or not groups.has(army) or int(army.get("id",0))==0:retained.append(army)
 state.armies=retained
 for army in groups:
  if not is_same(army,target) and int(army.get("id",0))==0:army.xp=0;army.level=1;army.path=[]
 Experience.sync_army_stats(state,target)
 return {"ok":true,"army":target,"count":total,"merged":groups.size()}
static func rally(state: Dictionary,target: Dictionary,find_path: Callable) -> Dictionary:
 if state.get("battle")!=null:return {"error":"Lõpeta esmalt lahing."}
 if target.get("embarked")!=null:return {"error":"Maabu esmalt laevalt."}
 target.path=[];target.autoExplore=false;var ordered:=0;var unreachable:=0
 for army in state.armies:
  if is_same(army,target) or int(army.team)!=int(target.team) or army.get("embarked")!=null or units(state,army).is_empty():continue
  var path: Variant=find_path.call(army,target,army.team)
  if path==null:unreachable+=1;continue
  army.path=path;army.autoExplore=false;army.rallyTarget=int(target.get("id",0));ordered+=1
 return {"ok":true,"ordered":ordered,"unreachable":unreachable}
