extends Node3D
const Deploy=preload("res://scripts/detail_deployments.gd")
const Campaign=preload("res://scripts/campaign_state.gd")
const Army=preload("res://scripts/army_experience.gd")
const Districts=preload("res://scripts/district_context.gd")
const SiegeRules=preload("res://scripts/battle_siege_rules.gd")
const Battle=preload("res://scripts/battle_state.gd")
const View=preload("res://scripts/battle_view.gd")
const Marker=preload("res://scripts/world_marker_models.gd")
const Motion=preload("res://scripts/human_motion.gd")
const Human=preload("res://assets/people/human_far.glb")
const Dog=preload("res://scripts/scout_dog.gd")
var host: Node
var center:=Vector2i.ZERO
var entries: Dictionary={}
var factory: Node
var refresh_clock:=0.0

func setup(owner: Node,tile: Vector2i) -> void:
 host=owner;center=tile;factory=View.new();sync()
func _exit_tree() -> void:
 if factory!=null:factory.free();factory=null

static func travel_pose(entity: Dictionary,tile: Vector2i) -> Dictionary:
 var c:=float(entity.c);var r:=float(entity.r);var moving:=false
 var path: Array=entity.get("path",[]);var duration:=float(entity.get("travelDuration",0))
 if not path.is_empty() and duration>0:
  var fraction:=clampf(float(entity.get("travelClock",0))/duration,0,1);c=lerpf(c,float(path[0].c),fraction);r=lerpf(r,float(path[0].r),fraction);moving=true
 var x:float=(c-tile.x)*225.0;var z:float=(r-tile.y)*195.0
 var saved: Variant=entity.get("scoutDetailPoseV240")
 if not moving and saved is Dictionary and int(saved.get("c",-1))==int(entity.c) and int(saved.get("r",-1))==int(entity.r):x+=float(saved.x);z+=float(saved.z)
 return {"x":x,"z":z,"moving":moving}

func eligible(entity: Dictionary) -> bool:
 if int(entity.team)!=0 and not Campaign.visible_now(host.game,0,entity):return false
 var pose:=travel_pose(entity,center)
 return absf(float(pose.x))<=330 and absf(float(pose.z))<=285

func make_person(kind: String,team: int,phase: float) -> Node3D:
 var info:Dictionary=factory.soldier_scene(kind,team);var person:Node3D=info.scene.instantiate();person.scale=Vector3.ONE*float(info.scale)
 factory.correct_soldier_materials(person,team)
 if kind=="scout":
  var dog:=Dog.new();dog.position=Vector3(0.55,0,-0.15)/float(info.scale);dog.scale=Vector3.ONE/float(info.scale);person.add_child(dog)
 var animator:AnimationPlayer=factory.animation_player(person)
 if animator!=null and info.animated:
  if animator.has_animation("idle"):animator.play("idle")
  person.set_meta("traveller_animation",animator)
 else:
  var motion:=Motion.new();motion.phase=phase;person.set_meta("traveller_motion",motion)
 return person

func create_entry(key: String,kind: String,team: int,unit: Dictionary={}) -> Dictionary:
 var root:=Node3D.new();root.name="Traveller";root.set_meta("traveller_key",key);add_child(root)
 var people: Array=[]
 if kind=="army":
  var count:=maxi(1,Battle.living(unit))
  for i in count:
   var person:=make_person(str(unit.kind),team,float(i)*0.17);person.position=Vector3((i%4-1.5)*0.7,0,floori(float(i)/4)*0.8);root.add_child(person);people.append(person)
 elif kind=="settler":
  for i in 3:
   var person:=Human.instantiate();person.scale=Vector3.ONE*1.66;person.position=Vector3((i-1)*0.9,0,-i*0.5);root.add_child(person)
   var motion:=Motion.new();motion.phase=i*0.7;person.set_meta("traveller_motion",motion);people.append(person)
 elif kind=="boat":
  Marker.add_ship(root,"transport",team,0);root.scale=Vector3.ONE*5.0
 else:
  var person:=Human.instantiate();person.scale=Vector3.ONE*1.66;person.position=Vector3(0.8,0,0.8);root.add_child(person)
  var motion:=Motion.new();person.set_meta("traveller_motion",motion);people.append(person)
  var cart:=MeshInstance3D.new();var mesh:=BoxMesh.new();mesh.size=Vector3(1.4,0.7,2.0);cart.mesh=mesh;cart.position=Vector3(0,0.8,-0.4)
  var material:=StandardMaterial3D.new();material.albedo_color=Color("8b6a44");cart.material_override=material;root.add_child(cart)
 if kind=="army" and unit.get("kind","")=="scout":
  var label:=Label3D.new();label.name="ScoutName";label.text="Avastaja";label.position.y=2.8;label.billboard=BaseMaterial3D.BILLBOARD_ENABLED;label.font_size=44;label.pixel_size=0.018
  label.modulate=Color(["f6d88b","dca58a","c4aff5","d7be73"][clampi(team,0,3)]);label.outline_size=8;root.add_child(label)
  var ring:=MeshInstance3D.new();ring.name="ScoutRing";var ring_mesh:=TorusMesh.new();ring_mesh.inner_radius=1.25;ring_mesh.outer_radius=1.55;ring_mesh.rings=24;ring.mesh=ring_mesh;ring.position.y=0.13
  var material:=StandardMaterial3D.new();material.albedo_color=label.modulate;material.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;ring.material_override=material;root.add_child(ring)
 var entry={"root":root,"people":people,"kind":kind,"team":team,"stamp":str(unit.get("kind",""))+":"+str(Battle.living(unit)) if kind=="army" else kind};entries[key]=entry;return entry

func show_entry(key: String,kind: String,team: int,pose: Dictionary,unit: Dictionary={},heading:=0.0) -> void:
 var x:=float(pose.x);var z:=float(pose.z)
 if absf(x)>330 or absf(z)>285:return
 var y:float=host.detail_rendered_height(x,z)
 if kind=="boat" and y> -0.05:return
 if kind!="boat" and y< -0.15:return
 var stamp:=str(unit.get("kind",""))+":"+str(Battle.living(unit)) if kind=="army" else kind
 var entry: Variant=entries.get(key)
 if entry!=null and (entry.stamp!=stamp or int(entry.team)!=team):entry.root.queue_free();entries.erase(key);entry=null
 if entry==null:entry=create_entry(key,kind,team,unit)
 entry.root.visible=true;entry.root.position=Vector3(x,0.25 if kind=="boat" else y+float(pose.get("elevation",0)),z);entry.root.rotation.y=heading
 entry.root.set_meta("alive",true)
 var label:Variant=entry.root.get_node_or_null("ScoutName")
 if label!=null:
  var near_camera:bool=is_instance_valid(host.fpv_walker) and host.fpv_walker.active and host.camera.global_position.distance_to(entry.root.global_position)<9
  label.visible=host.graphics_soldier_names and not near_camera
 for person in entry.people:
  var motion:Variant=person.get_meta("traveller_motion") if person.has_meta("traveller_motion") else null
  if motion!=null:motion.apply(person,float(host.elapsed),bool(pose.moving))
  var animator:Variant=person.get_meta("traveller_animation") if person.has_meta("traveller_animation") else null
  if animator!=null:
   var name: String="walk" if pose.moving and animator.has_animation("walk") else "idle"
   if animator.has_animation(name) and animator.current_animation!=name:animator.play(name)

func sync() -> void:
 if host==null or not host.detail_mode:return
 for entry in entries.values():entry.root.set_meta("alive",false)
 var state:Dictionary=host.game
 for army in state.get("armies",[]):
  if army.get("embarked")!=null or army.get("hiddenInBandV274",false) or not eligible(army):continue
  var pose:=travel_pose(army,center);var members:=[]
  for i in state.get("units",[]).size():
   var unit:Dictionary=state.units[i]
   if int(unit.team)==int(army.team) and int(unit.get("armyId",0))==int(army.get("id",0)) and float(unit.get("hp",0))>0 and not Army.is_garrisoned(unit):members.append({"unit":unit,"source":i})
  for n in members.size():
   var data:Dictionary=members[n];var unit:Dictionary=data.unit;var p:=pose.duplicate();var heading:=float(army.get("heading",0))
   if int(army.c)==center.x and int(army.r)==center.y and not pose.moving:
    var deployment:Dictionary=Deploy.get_deployment(state,center,int(data.source),unit,n)
    if unit.kind!="scout" or deployment.get("scoutDetailActiveV240",false):
     p.x=deployment.x;p.z=deployment.z;heading=float(deployment.get("heading",0));p.moving=deployment.get("moving",false)
   else:
    var columns:=maxi(1,ceili(sqrt(float(members.size()))));p.x=float(p.x)+(n%columns-(columns-1)*0.5)*4;p.z=float(p.z)+floori(float(n)/columns)*4
   if not army.get("path",[]).is_empty():var next:Dictionary=army.path[0];heading=atan2(float(next.c)-float(army.c),float(next.r)-float(army.r))
   if int(army.c)==center.x and int(army.r)==center.y and not pose.moving:
    var nav:Variant=host.detail_unit_nav(center,int(data.source))
    if nav!=null and not nav.is_open(float(p.x),float(p.z)):
     var safe:Variant=nav.nearest(p,80)
     if safe!=null:p.x=safe.x;p.z=safe.z
   show_entry("unit:%d" % int(data.source),"army",int(army.team),p,unit,heading)
 # Garrisons remain on their actual fortification even when their army moves.
 for source in state.get("units",[]).size():
  var unit:Dictionary=state.units[source];var post:Variant=unit.get("garrison")
  if not post is Dictionary or float(unit.get("hp",0))<=0:continue
  var tile:=Vector2i(int(post.c),int(post.r));var observed={"team":unit.team,"c":tile.x,"r":tile.y}
  if not eligible(observed):continue
  var axis:=bool(post.get("wallAxis",false));var slot:=float(post.get("slot",0))-0.5
  var type:=str(post.get("wallType","palisade"));var elevation:=6.0 if type=="keep" else float(SiegeRules.PROFILES.get(type,{}).get("height",2.4))
  var context:Variant=Districts.at_city(state.get("cities",[]),tile)
  if context!=null and type=="palisade":
   for building in context.economy.buildings:
    if building.type==type and float(building.x)==float(post.x) and float(building.z)==float(post.z) and int(building.get("woodFortTierV1757",1))==2:elevation=7.25;break
  var p={"x":(tile.x-center.x)*225.0+float(post.x)+(0 if axis else slot*1.6),"z":(tile.y-center.y)*195.0+float(post.z)+(slot*1.6 if axis else 0),"elevation":elevation,"moving":false}
  show_entry("garrison:%d" % source,"army",int(unit.team),p,unit,PI/2 if axis else 0.0)
 for settler in state.get("settlers",[]):
  if settler.get("landed",false) or settler.get("embarked")!=null or not eligible(settler):continue
  if is_same(settler,host.settler) and (not host.city_created or host.settler_mode):continue
  var pose:=travel_pose(settler,center)
  if not pose.moving:pose.x=float(pose.x)+14+posmod(int(settler.id),3)*4;pose.z=float(pose.z)+10+posmod(int(settler.id),2)*5
  show_entry("settler:%d" % int(settler.id),"settler",int(settler.team),pose)
 for cargo in state.get("shipments",[]):
  if cargo.get("mode","") in ["air","rail"] or not eligible(cargo):continue
  var pose:=travel_pose(cargo,center);var kind: String="boat" if cargo.get("mode","")=="sea" else "caravan"
  if not pose.moving:pose.x=float(pose.x)+14+posmod(int(cargo.id),3)*4;pose.z=float(pose.z)+10+posmod(int(cargo.id),2)*5
  show_entry("trade:%d" % int(cargo.id),kind,int(cargo.team),pose)
 for key in entries.keys():
  if not entries[key].root.get_meta("alive",false):entries[key].root.queue_free();entries.erase(key)

func _process(delta: float) -> void:
 if host==null or not host.detail_mode:return
 refresh_clock-=delta
 if refresh_clock<=0:refresh_clock=0.05;sync()

func select_near(point: Vector2) -> int:
 var best:=-1;var distance:=7.0
 for key in entries:
  if not str(key).begins_with("unit:"):continue
  var entry:Dictionary=entries[key];var node:Node3D=entry.root
  if not node.visible or int(entry.team)!=0:continue
  var source:=int(str(key).substr(5));var unit:Dictionary=host.game.units[source]
  var present:=false
  for army in host.game.armies:
   if int(army.team)==int(unit.team) and int(army.get("id",0))==int(unit.get("armyId",0)) and int(army.c)==center.x and int(army.r)==center.y and army.get("embarked")==null:present=true;break
  if not present:continue
  var d:=point.distance_to(Vector2(node.position.x,node.position.z))
  if d<distance:distance=d;best=source
 return best
