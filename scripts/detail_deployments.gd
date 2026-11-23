extends RefCounted
const Econ=preload("res://scripts/economy_rules.gd")
const Contact=preload("res://scripts/battle_contact.gd")
static func get_deployment(state: Dictionary,tile: Vector2i,source: int,unit: Dictionary,index:=0) -> Dictionary:
 if not state.has("deployments"):state.deployments={}
 var key:="%d:%d" % [tile.x,tile.y];var id:=str(source)
 if not state.deployments.has(key):state.deployments[key]={}
 if not state.deployments[key].has(id):
  var ranged:=Contact.troop_role(str(unit.kind)) in ["ranged","siege"]
  state.deployments[key][id]={"x":(1 if int(unit.team)!=0 else -1)*((24 if ranged else 12)+(index%2)*3),"z":floori(float(index)/2)*7-4,"heading":-PI/2 if int(unit.team)!=0 else PI/2,"target":null}
 return state.deployments[key][id]

static func tick(state: Dictionary,dt: float,nav_for: Callable) -> void:
 if dt<=0 or state.get("battle")!=null:return
 for key in state.get("deployments",{}):
  var bits:=str(key).split(":")
  if bits.size()!=2:continue
  var tile:=Vector2i(int(bits[0]),int(bits[1]));var points:Dictionary=state.deployments[key]
  for id in points:
   var source:=int(id)
   if source<0 or source>=state.units.size():continue
   var unit:Dictionary=state.units[source];var point:Dictionary=points[id]
   if float(unit.get("hp",0))<=0 or not point.get("target") is Dictionary:continue
   var army: Variant=null
   for candidate in state.armies:
    if int(candidate.team)==int(unit.team) and int(candidate.get("id",0))==int(unit.get("armyId",0)) and int(candidate.c)==tile.x and int(candidate.r)==tile.y and candidate.get("embarked")==null:army=candidate;break
   if army==null:continue
   if not army.get("path",[]).is_empty():point.target=null;point.moving=false;point.scoutDetailActiveV240=false;continue
   var nav:Variant=nav_for.call(tile,source)
   if nav==null:continue
   var speed:float=Econ.DATA.data.troops.get(unit.kind,{}).get("speed",2.5)
   var target:Dictionary=point.target
   if nav.move(point,target,dt,speed,false):point.target=null;point.moving=false
   if unit.kind=="scout" and point.get("scoutDetailActiveV240",false):army.scoutDetailPoseV240={"c":tile.x,"r":tile.y,"x":point.x,"z":point.z}
