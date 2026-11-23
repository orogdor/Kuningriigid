extends Node3D
const Districts=preload("res://scripts/district_context.gd")
const Terrain=preload("res://scripts/detail_terrain.gd")
const Grid=preload("res://scripts/campaign_grid.gd")
const Motion=preload("res://scripts/human_motion.gd")
const Dog=preload("res://scripts/scout_dog.gd")
const Detail=preload("res://scripts/detail_view.gd")
const Landscape=preload("res://scripts/detail_landscape.gd")
const GroundMaterial=preload("res://scripts/detail_ground_material.gd")
const DetailOcean=preload("res://scripts/detail_ocean.gd")
const State=preload("res://scripts/battle_state.gd")
const Assault=preload("res://scripts/siege_assault.gd")
const WallWalk=preload("res://scripts/wall_walk.gd")
const SiegeVisual=preload("res://scripts/siege_visual.gd")
const Formations=preload("res://scripts/battle_formations.gd")
const Field=preload("res://scripts/battlefield.gd")
const DATA=preload("res://data/economy.json")
const HUMAN=preload("res://assets/people/human_far.glb")
const WARRIORS={"spearman":preload("res://assets/people/spearman_v262.glb"),"axeman":preload("res://assets/people/axeman_v262.glb"),"slinger":preload("res://assets/people/slinger_v262.glb"),"stone_guard":preload("res://assets/people/axeman_v262.glb")}
const TEAM_COLORS=[Color("eed36f"),Color("e98669"),Color("ad91e3"),Color("e9b74f")]
const FACTION_COLORS=[Color("276bd1"),Color("c43d43"),Color("9271ce"),Color("d2a12e")]
var host: Node
var battle: Dictionary
var tiles: Dictionary={}
var visual_tiles: Dictionary={}
var tile_rivers: Dictionary={}
var models: Dictionary={}
var motions: Dictionary={}
var animations: Dictionary={}
var animation_state: Dictionary={}
var soldier_scenes: Dictionary={}
var markers: Dictionary={}
var siege_models: Dictionary={}
var ballista_models: Dictionary={}
var ballista_bolts: Dictionary={}
var shot_models: Dictionary={}
var impact_models: Dictionary={}
var faction_materials: Dictionary={}
var soldier_materials: Dictionary={}
var soldier_color_surfaces: Dictionary={}
var selected_source: int=-1
var layer: CanvasLayer
var panel: PanelContainer
var info: Label
var status: Label
var selection: OptionButton
var craft: HFlowContainer
var formation: OptionButton
var mode: OptionButton
var retreat: Button
var close_button: Button
var animation_clock:=0.0
var ui_clock:=0.0
var outer_tiles_pending: Array[Vector2i]=[]
var selection_stamp: String=""
var formation_stamp: String=""

func setup(owner: Node,state: Dictionary) -> void:
 host=owner;battle=state
 build_ground();build_nature();build_border();build_ui();sync_models();refresh_ui()

func build_ground() -> void:
 for dr in range(-1,2):
  for dc in range(-1,2):build_ground_tile(dc,dr)
 outer_tiles_pending.clear()
 for dr in range(-2,3):
  for dc in range(-2,3):
   if absi(dc)==2 or absi(dr)==2:outer_tiles_pending.append(Vector2i(dc,dr))

func build_ground_tile(dc: int,dr: int) -> void:
 var c:=int(battle.cell.c)+dc;var r:=int(battle.cell.r)+dr
 if c<0 or c>=Grid.COLS or r<0 or r>=Grid.ROWS:return
 var key:=str(dc)+":"+str(dr);var heights:=Terrain.tile_heights(host.grid,c,r);tiles[key]=heights
 var visual: PackedVector4Array=host.detail_visual_for(c,r);visual_tiles[key]=visual
 var color: Color=host.terrain_color(r*Grid.COLS+c)
 var instance:=MeshInstance3D.new();instance.mesh=host.detail_mesh_for(c,r,heights,visual);instance.position=Vector3(dc*225,0,dr*195)
 instance.set_instance_shader_parameter("detail_uv_offset",Vector2(dc*225,dr*195))
 GroundMaterial.attach(instance,color,1.0 if host.visual_biome(r*Grid.COLS+c) in ["forest","taiga","jungle"] else 0.0);add_child(instance)
 var water:=MeshInstance3D.new();var plane:=PlaneMesh.new();plane.size=Vector2(225,195);water.mesh=plane
 water.position=instance.position;water.material_override=host.detail_ocean_for(c,r,heights,visual);add_child(water)
 var landscape:=Node3D.new();landscape.position=Vector3(dc*225,0,dr*195);add_child(landscape)
 tile_rivers[key]=host.detail_landscape_for(landscape,c,r,heights,visual)

func build_nature() -> void:
 for dr in range(-1,2):
  for dc in range(-1,2):build_nature_tile(dc,dr)

func build_nature_tile(dc: int,dr: int) -> void:
 var c:=int(battle.cell.c)+dc;var r:=int(battle.cell.r)+dr
 if c<0 or c>=Grid.COLS or r<0 or r>=Grid.ROWS:return
 var key:=str(dc)+":"+str(dr)
 if not tiles.has(key):return
 var world_key:=str(c)+":"+str(r);var city: Variant=Districts.at_city(host.game.cities,Vector2i(c,r))
 var world: Dictionary=city.world if city!=null else host.game.get("tileWorlds",{}).get(world_key,{})
 if world.is_empty():return
 if city!=null:world=world.duplicate(true)
 var index:=r*Grid.COLS+c;var nature=Detail.new();nature.position=Vector3(dc*225,0,dr*195);nature.heights=tiles[key];nature.visual_heights=visual_tiles[key];nature.resources=world.resources;nature.world_data=world
 nature.river_segments=tile_rivers.get(key,[])
 nature.tree_biome=host.visual_biome(index);nature.tree_temperature=float(host.heat[index]);nature.tree_moisture=float(host.moisture[index]);nature.tree_cell=Vector2i(c,r);nature.tree_river=bool(host.grid[index].get("river",false))
 nature.tree_seed=int(host.game.seed);nature.tree_mountain=bool(host.grid[index].get("mountain",false))
 add_child(nature);nature.add_nature(nature.tree_biome)
 if host.grid[index].land:nature.add_ground_cover(nature.tree_biome,0.35 if dc==0 and dr==0 else 0.12)
 nature.sync_removed_resources(world.resources,float(host.game.time),city.economy.buildings if city!=null else [])
 if city!=null:
  nature.person=Node3D.new();nature.add_child(nature.person)
  var hall: Dictionary=city.economy.buildings[0]
  if not hall.get("virtual",false):nature.place_hall(hall.x,hall.z,int(host.game.ages[city.team]))
  nature.sync_buildings(city,int(host.game.ages[city.team]))

func load_outer_tile() -> void:
 if outer_tiles_pending.is_empty():return
 var at:Vector2i=outer_tiles_pending.pop_front();build_ground_tile(at.x,at.y);build_nature_tile(at.x,at.y)

func ground(x: float,z: float) -> float:
 var c:=clampi(floori((x+112.5)/225),-2,2);var r:=clampi(floori((z+97.5)/195),-2,2);var key:=str(c)+":"+str(r)
 var heights: Array=tiles.get(key,[]);var visual:PackedVector4Array=visual_tiles.get(key,PackedVector4Array())
 if heights.is_empty() and host.get("battle_nav")!=null:
  heights=host.battle_nav.heights.get(key,[]);visual=host.battle_nav.visuals.get(key,PackedVector4Array())
 if heights.is_empty():
  c=clampi(c,-1,1);r=clampi(r,-1,1);key=str(c)+":"+str(r);heights=tiles.get(key,[]);visual=visual_tiles.get(key,PackedVector4Array())
 return maxf(0,Terrain.visual_rendered_height(heights,visual,x-c*225,z-r*195)) if not heights.is_empty() else 0.0

func build_border() -> void:
 var red:=StandardMaterial3D.new();red.albedo_color=Color("ff3535");red.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;red.no_depth_test=true
 var mesh:=ImmediateMesh.new();mesh.surface_begin(Mesh.PRIMITIVE_LINES,red)
 var corners: Array=[Vector2(-337.5,-292.5),Vector2(337.5,-292.5),Vector2(337.5,292.5),Vector2(-337.5,292.5),Vector2(-337.5,-292.5)]
 for edge in 4:
  for i in 120:
   var a: Vector2=corners[edge].lerp(corners[edge+1],float(i)/120);var b: Vector2=corners[edge].lerp(corners[edge+1],float(i+1)/120)
   mesh.surface_add_vertex(Vector3(a.x,ground(a.x,a.y)+0.7,a.y));mesh.surface_add_vertex(Vector3(b.x,ground(b.x,b.y)+0.7,b.y))
 mesh.surface_end();var line:=MeshInstance3D.new();line.mesh=mesh;add_child(line)

func build_ui() -> void:
 layer=CanvasLayer.new();layer.layer=20;add_child(layer)
 panel=PanelContainer.new();panel.position=Vector2(12,12);panel.custom_minimum_size=Vector2(370,0)
 var box:=StyleBoxTexture.new();box.texture=load("res://assets/ui/ui-art-v304_panel.webp");box.texture_margin_left=70;box.texture_margin_right=70;box.texture_margin_top=50;box.texture_margin_bottom=50;box.content_margin_left=20;box.content_margin_right=20;box.content_margin_top=18;box.content_margin_bottom=34;panel.add_theme_stylebox_override("panel",box);layer.add_child(panel)
 var body:=VBoxContainer.new();body.add_theme_constant_override("separation",7);panel.add_child(body)
 var title:=Label.new();title.text="LINNA PIIRAMINE" if battle.get("fortress") is Dictionary else "LAHING";title.add_theme_font_size_override("font_size",20);title.add_theme_color_override("font_color",Color("f6dfa9"));body.add_child(title)
 info=Label.new();info.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;body.add_child(info)
 selection=OptionButton.new();selection.item_selected.connect(select_squad);body.add_child(selection)
 var row:=HBoxContainer.new();body.add_child(row)
 formation=OptionButton.new();formation.size_flags_horizontal=Control.SIZE_EXPAND_FILL;formation.item_selected.connect(select_formation);row.add_child(formation)
 mode=OptionButton.new();mode.add_item("Automaatne");mode.add_item("Manuaalne");mode.item_selected.connect(select_mode);row.add_child(mode)
 var commands:=HBoxContainer.new();body.add_child(commands)
 var stop:=Button.new();stop.text="Peata üksus";stop.pressed.connect(stop_squad);commands.add_child(stop)
 var pause:=Button.new();pause.text="Peata / jätka";pause.pressed.connect(func():host.toggle_simulation_pause());commands.add_child(pause)
 retreat=Button.new();retreat.text="Tagane armeega";retreat.pressed.connect(withdraw);commands.add_child(retreat)
 craft=HFlowContainer.new();craft.add_theme_constant_override("h_separation",4);body.add_child(craft)
 for kind in ["ladder","tower","ram","sap","camp"]:
  var button:=Button.new();button.text=str(Assault.SPECS[kind].name)+" · "+str(Assault.SPECS[kind].wood)+" puitu"
  button.pressed.connect(func():start_siege_craft(kind));craft.add_child(button)
 var files:=HBoxContainer.new();body.add_child(files)
 var save:=Button.new();save.text="Salvesta mäng";save.size_flags_horizontal=Control.SIZE_EXPAND_FILL;save.pressed.connect(func():host.save_partial());files.add_child(save)
 var load_button:=Button.new();load_button.text="Laadi mäng";load_button.size_flags_horizontal=Control.SIZE_EXPAND_FILL;load_button.pressed.connect(func():host.load_partial());files.add_child(load_button)
 close_button=Button.new();close_button.text="Tagasi maailmakaardile";close_button.pressed.connect(func():host.close_battle_view());body.add_child(close_button)
 status=Label.new();status.text="Vali oma salk. Vasakklõps valib, paremklõps annab liikumiskäsu.";status.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;status.custom_minimum_size.x=350;body.add_child(status)

func start_siege_craft(kind: String) -> void:
 var unit: Variant=current_squad()
 if unit==null:return
 var result:=Assault.start(battle,unit,kind,host.game,host.battle_nav)
 status.text=str(result.error) if result.has("error") else str(Assault.SPECS[kind].name)+" on ehitamisel."
 refresh_ui()

func current_squad() -> Variant:
 for unit in battle.squads:
  if int(unit.team)==0 and int(unit.source)==selected_source:return unit
 return null

func select_squad(index: int) -> void:
 if index<0:return
 selected_source=int(selection.get_item_metadata(index));formation_stamp="";refresh_ui()

func select_formation(index: int) -> void:
 var unit=current_squad()
 if unit==null or index<0:return
 var value: String=formation.get_item_metadata(index)
 if value=="auto":unit.formationManual=false;unit.erase("fixedFacing")
 else:Formations.set_formation(unit,value,float(battle.elapsed),true)

func select_mode(index: int) -> void:
 var unit=current_squad()
 if unit==null:return
 unit.combatMode="manual" if index==1 else "auto";unit.attackTargetSource=null;unit.target=null;unit.manualOrder=false;unit.anchor={"x":unit.x,"z":unit.z};unit.advance=index==0
 if index==0 and unit.get("formation")=="hold":Formations.set_formation(unit,"line",float(battle.elapsed),false)
 if int(unit.source)>=0 and int(unit.source)<host.game.units.size():host.game.units[int(unit.source)].combatMode=unit.combatMode

func stop_squad() -> void:
 var unit=current_squad()
 if unit==null or unit.get("routing",false):return
 unit.target=null;unit.attackTargetSource=null;unit.advance=false;unit.manualOrder=false;Formations.set_formation(unit,"hold",float(battle.elapsed),true)

func withdraw() -> void:
 var unit=current_squad()
 if unit==null:return
 Field.withdraw(battle,unit);status.text="Armee taganeb punase piiri taha."

func animation_player(node: Node) -> AnimationPlayer:
 if node is AnimationPlayer:return node
 for child in node.get_children():
  var player:=animation_player(child)
  if player!=null:return player
 return null

func soldier_scene(kind: String,team: int) -> Dictionary:
 var key:=kind+":"+str(team)
 if soldier_scenes.has(key):return soldier_scenes[key]
 if WARRIORS.has(kind):
  soldier_scenes[key]={"scene":WARRIORS[kind],"scale":1.66,"animated":false};return soldier_scenes[key]
 if kind!="scout":
  var machine: String="res://assets/soldiers/%s_team%d.glb" % [kind,clampi(team,0,3)]
  if ResourceLoader.exists(machine):
   soldier_scenes[key]={"scene":load(machine),"scale":1.0,"animated":false};return soldier_scenes[key]
  var path: String="res://assets/soldiers/"+kind+".glb"
  if not ResourceLoader.exists(path):
   var visual: String=DATA.data.troops.get(kind,{}).get("visual","")
   if not visual.is_empty():path="res://assets/soldiers/"+visual+".glb"
  if ResourceLoader.exists(path):
   soldier_scenes[key]={"scene":load(path),"scale":1.0,"animated":true};return soldier_scenes[key]
 soldier_scenes[key]={"scene":HUMAN,"scale":1.66,"animated":false};return soldier_scenes[key]

func animate_model(key: String,man: Dictionary,unit: Dictionary) -> void:
 if animations.has(key):
  var player: AnimationPlayer=animations[key]
  player.speed_scale=0.0 if host.simulation_paused or host.paused or host.menu_open else 1.0
  var bow: Node=models[key].find_child("bowWeapon",true,false);var sword: Node=models[key].find_child("swordWeapon",true,false)
  var sword_drawn: bool=man.get("weapon")=="sword"
  if bow is Node3D:bow.visible=not sword_drawn
  if sword is Node3D:sword.visible=sword_drawn
  var attacking: bool=float(battle.elapsed)-float(man.get("attackTime",-100))<0.6
  var name: String="attack_sword" if attacking and man.get("weapon")=="sword" and player.has_animation("attack_sword") else "attack" if attacking and player.has_animation("attack") else "walk" if man.get("moving",false) and player.has_animation("walk") else "idle"
  if not player.has_animation(name):return
  if animation_state.get(key)!=name:
   animation_state[key]=name
   var animation:=player.get_animation(name)
   if name in ["walk","idle"]:animation.loop_mode=Animation.LOOP_LINEAR
   player.play(name,0.12)
 else:motions[key].apply(models[key],float(battle.elapsed),man.get("moving",false),"train" if float(battle.elapsed)-float(man.get("attackTime",-100))<0.4 else "")
 var dog=models[key].get_node_or_null("ScoutDog")
 if dog!=null:dog.pose(float(battle.elapsed),man.get("moving",false))

func correct_soldier_materials(node: Node,team: int) -> void:
 if node is MeshInstance3D and node.mesh!=null:
  for surface in node.mesh.get_surface_count():
   var mesh_key:=str(node.mesh.get_instance_id())+":"+str(surface)
   if not soldier_color_surfaces.has(mesh_key):
    var arrays: Array=node.mesh.surface_get_arrays(surface)
    soldier_color_surfaces[mesh_key]=arrays[Mesh.ARRAY_COLOR]!=null and not arrays[Mesh.ARRAY_COLOR].is_empty()
   var original: Material=node.get_active_material(surface)
   if not original is BaseMaterial3D:continue
   var faction: bool=str(original.resource_name)=="team_color"
   if not faction and (not soldier_color_surfaces[mesh_key] or original.vertex_color_use_as_albedo):continue
   var key:=str(original.get_instance_id())+":"+(str(team) if faction else "base")
   if not soldier_materials.has(key):
    var material: BaseMaterial3D=original.duplicate()
    if soldier_color_surfaces[mesh_key]:material.vertex_color_use_as_albedo=true
    if faction:material.albedo_color=FACTION_COLORS[clampi(team,0,3)]
    soldier_materials[key]=material
   node.set_surface_override_material(surface,soldier_materials[key])
 for child in node.get_children():correct_soldier_materials(child,team)

func add_faction_strip(model: Node3D,team: int) -> void:
 var skeleton:=Motion.find_skeleton(model)
 if skeleton==null or skeleton.find_bone("chest")<0:return
 var attachment:=BoneAttachment3D.new();attachment.bone_name="chest";skeleton.add_child(attachment)
 var ribbon:=MeshInstance3D.new();var shape:=BoxMesh.new();shape.size=Vector3(0.11,0.14,0.012);ribbon.mesh=shape;ribbon.position=Vector3(0.10,-0.09,0.125);ribbon.rotation.z=-0.12
 if not faction_materials.has(team):
  var material:=StandardMaterial3D.new();material.albedo_color=FACTION_COLORS[clampi(team,0,3)];material.roughness=0.9;faction_materials[team]=material
 ribbon.material_override=faction_materials[team];attachment.add_child(ribbon)

func sync_siege_models() -> void:
 var active: Dictionary={}
 for work in battle.get("siegeWorks",[]):
  if work.get("destroyed",false):continue
  var key:=str(int(work.id));active[key]=true
  if not siege_models.has(key):
   var name: String=str(work.kind)
   if name=="ladder":
    var height:=float(work.get("height",3.8));var heights: Array=[2.4,3.1,3.8,6.4,7.25];var nearest:float=heights[0]
    for value in heights:
     if absf(float(value)-height)<absf(nearest-height):nearest=float(value)
    name="ladder_"+str(nearest)
   elif name=="camp":name="camp_"+str(clampi(int(work.team),0,3))
   var path: String="res://assets/siege/"+name+".glb"
   if not ResourceLoader.exists(path):continue
   var model: Node3D=load(path).instantiate();add_child(model);siege_models[key]=model
  var model: Node3D=siege_models[key];var offset:=0 if work.kind=="camp" else 5 if work.kind=="ladder" else 4
  var x:=float(work.x)-float(work.inwardX)*offset;var z:=float(work.z)-float(work.inwardZ)*offset
  model.position=Vector3(x,ground(x,z),z);model.rotation.y=atan2(float(work.inwardX),float(work.inwardZ))
  model.scale=Vector3(1,(float(work.get("height",3.8))/3.8 if work.kind=="tower" else 1.0)*(0.23+0.77*clampf(float(work.progress)/maxf(1,float(work.duration)),0,1)),1)
 for key in siege_models.keys():
  if not active.has(key):siege_models[key].queue_free();siege_models.erase(key)

func sync_ballistas() -> void:
 var active: Dictionary={}
 for post in battle.get("defensePosts",[]):
  if not post.get("ballista") is Dictionary or not post.get("active",true):continue
  var key:=str(int(post.buildingIndex));active[key]=true
  if not ballista_models.has(key):var model:=SiegeVisual.ballista();add_child(model);ballista_models[key]=model
  var model: Node3D=ballista_models[key];model.position=Vector3(post.x,ground(post.x,post.z)+float(post.ballista.height)-0.65,post.z);model.rotation.y=float(post.ballista.get("heading",0))
 for key in ballista_models.keys():
  if not active.has(key):ballista_models[key].queue_free();ballista_models.erase(key)
 var flying: Dictionary={}
 for shot in battle.get("ballistaShots",[]):
  if shot.get("resolved",false):continue
  var key:=str(int(shot.id));flying[key]=true
  if not ballista_bolts.has(key):var bolt:=SiegeVisual.bolt();add_child(bolt);ballista_bolts[key]=bolt
  var bolt: Node3D=ballista_bolts[key];var t:=clampf((float(battle.elapsed)-float(shot.startedAt))/maxf(0.001,float(shot.landsAt)-float(shot.startedAt)),0,1)
  var x:=lerpf(float(shot.x),float(shot.toX),t);var z:=lerpf(float(shot.z),float(shot.toZ),t)
  bolt.position=Vector3(x,ground(x,z)+lerpf(float(shot.fromY),float(shot.toY),t),z);bolt.rotation.y=atan2(float(shot.toX)-float(shot.x),float(shot.toZ)-float(shot.z))
 for key in ballista_bolts.keys():
  if not flying.has(key):ballista_bolts[key].queue_free();ballista_bolts.erase(key)

func sync_models() -> void:
 var alive_ids: Dictionary={}
 var visible_markers: Dictionary={}
 for unit in battle.squads:
  if unit.get("reserve",false) or unit.get("retreated",false):continue
  for man in unit.get("men",[]):
   if float(man.hp)<=0 or man.get("escaped",false):continue
   var key: String=str(int(unit.team))+":"+str(man.id);alive_ids[key]=true
   if not models.has(key):
    var model_info:=soldier_scene(str(unit.kind),int(unit.team));var scene: PackedScene=model_info.scene
    var model: Node3D=scene.instantiate();model.scale=Vector3.ONE*float(model_info.scale);add_child(model);models[key]=model
    correct_soldier_materials(model,int(unit.team))
    if unit.kind=="scout":
     var dog:=Dog.new();dog.name="ScoutDog"
     dog.position=Vector3(0.55,0,-0.15)/float(model_info.scale);dog.scale=Vector3.ONE/float(model_info.scale);model.add_child(dog)
    if not model_info.animated:add_faction_strip(model,int(unit.team))
    var player:=animation_player(model)
    if player!=null and model_info.animated:animations[key]=player
    else:
     var motion:=Motion.new();motion.phase=float(man.get("index",0))*0.17;motions[key]=motion
   var model: Node3D=models[key];model.position=Vector3(man.x,ground(man.x,man.z)+float(man.get("elevation",unit.get("wallElevation",0))),man.z);model.rotation.y=float(man.get("heading",0))
   if animation_clock<=0:animate_model(key,man,unit)
  var id: String=str(int(unit.team))+":"+str(int(unit.source));visible_markers[id]=true
  if not markers.has(id):
   var ring:=MeshInstance3D.new();var mesh:=TorusMesh.new();mesh.inner_radius=2.4;mesh.outer_radius=2.7;ring.mesh=mesh
   var mat:=StandardMaterial3D.new();mat.albedo_color=TEAM_COLORS[clampi(int(unit.team),0,3)];mat.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;ring.material_override=mat;add_child(ring);markers[id]=ring
  markers[id].position=Vector3(unit.x,ground(unit.x,unit.z)+0.15,unit.z)
  markers[id].visible=float(unit.hp)>0
  markers[id].scale=Vector3.ONE*(1.35 if int(unit.team)==0 and int(unit.source)==selected_source else 1.0)
 for key in models.keys():
  if not alive_ids.has(key):models[key].queue_free();models.erase(key);motions.erase(key);animations.erase(key);animation_state.erase(key)
 for key in markers.keys():
  if not visible_markers.has(key):markers[key].visible=false

func sync_projectiles() -> void:
 var shown: Dictionary={}
 var firearms=["musketeer","rifleman","motorized","arquebusier","cuirassier","field_cannon","line_infantry","dragoon","industrial_artillery","modern_infantry","machinegun_team","tank","rocket_team"]
 for unit in battle.squads:
  if unit.get("reserve",false):continue
  for man in unit.get("men",[]):
   var projectile: Variant=man.get("projectile");var shot: Variant=man.get("shot");var at: Variant=man.get("attackTime")
   if shot==null or projectile==null or at==null or unit.get("retreated",false):continue
   var gun: bool=unit.kind in firearms;var duration:=1.1 if projectile=="stone" else 0.24 if unit.kind=="musketeer" else 0.14 if gun else 0.65
   var f: float=(float(battle.elapsed)-float(at))/duration
   if f<0 or f>=1:continue
   var key: String=str(int(unit.team))+":"+str(man.id);shown[key]=true
   if not shot_models.has(key):
    var shape: Mesh
    if projectile=="stone":
     var sphere:=SphereMesh.new();sphere.radius=0.36;sphere.height=0.72;shape=sphere
    else:
     var cylinder:=CylinderMesh.new();cylinder.top_radius=0.025;cylinder.bottom_radius=0.025;cylinder.height=0.5 if gun else 0.8;shape=cylinder
    var model:=MeshInstance3D.new();model.mesh=shape
    var material:=StandardMaterial3D.new();material.albedo_color=Color("ffd680") if gun else Color("e7d9b7");material.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;model.material_override=material;add_child(model);shot_models[key]=model
   var model: MeshInstance3D=shot_models[key];model.visible=true
   var x:=lerpf(float(shot.x),float(shot.toX),f);var z:=lerpf(float(shot.z),float(shot.toZ),f)
   var y0:=ground(shot.x,shot.z)+(1.3 if gun else 1.5);var y1:=ground(shot.toX,shot.toZ)+1.0
   model.position=Vector3(x,lerpf(y0,y1,f)+(0 if gun else sin(PI*f)*(8 if projectile=="stone" else 3)),z)
   if projectile!="stone":
    var direction:=Vector3(float(shot.toX)-float(shot.x),y1-y0+(0 if gun else cos(PI*f)*9),float(shot.toZ)-float(shot.z)).normalized()
    if direction.length_squared()>0:model.quaternion=Quaternion(Vector3.UP,direction)
 for key in shot_models:
  if not shown.has(key):shot_models[key].visible=false
 var impact_ids: Dictionary={}
 for hit in battle.get("rockImpacts",[]):
  var key: String=str(hit.id);impact_ids[key]=true
  if not impact_models.has(key):
   var model:=MeshInstance3D.new();var ring:=TorusMesh.new();ring.inner_radius=0.78;ring.outer_radius=1.0;model.mesh=ring
   var material:=StandardMaterial3D.new();material.albedo_color=Color("cfa982") if int(hit.friendlies)>0 else Color("bbb49f");material.transparency=BaseMaterial3D.TRANSPARENCY_ALPHA;material.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;model.material_override=material;add_child(model);impact_models[key]=model
  var model: MeshInstance3D=impact_models[key];var age:=maxf(0,float(battle.elapsed)-float(hit.at));model.position=Vector3(hit.x,ground(hit.x,hit.z)+0.13,hit.z);model.scale=Vector3.ONE*float(hit.radius)*(0.25+0.75*minf(1,age/0.8))
  var material: StandardMaterial3D=model.material_override;material.albedo_color.a=maxf(0,0.65-age*0.55)
 for key in impact_models.keys():
  if not impact_ids.has(key):impact_models[key].queue_free();impact_models.erase(key)

func refresh_ui() -> void:
 var own:=0;var enemy:=0
 for unit in battle.squads:
  if unit.get("reserve",false) or unit.get("retreated",false):continue
  for man in unit.get("men",[]):
   if float(man.hp)>0 and not man.get("escaped",false):
    if int(unit.team)==0:own+=1
    else:enemy+=1
 info.text=("Võit!" if battle.get("result")=="victory" else "Armee taganes." if battle.get("result")=="retreat" else "Lahing kaotatud." if battle.get("result")!=null else "Mehi %d vs %d · reservis %d" % [own,enemy,int(battle.get("reserveMen",0))])
 if battle.get("fortress") is Dictionary:
  var fort: Dictionary=battle.fortress
  info.text+=" · Kindlus %d / %d" % [ceili(maxf(0,float(fort.hp))),ceili(float(fort.maxHp))]
 var ids:=PackedStringArray()
 for unit in battle.squads:
  if int(unit.team)==0 and int(unit.source)>=0 and float(unit.hp)>0 and not unit.get("reserve",false) and not unit.get("retreated",false):ids.append(str(int(unit.source)))
 var stamp:=",".join(ids)
 if stamp!=selection_stamp:
  selection_stamp=stamp;selection.clear()
  if not str(selected_source) in ids:selected_source=int(ids[0]) if not ids.is_empty() else -1
  for id in ids:
   var source:=int(id)
   for unit in battle.squads:
    if int(unit.team)==0 and int(unit.source)==source:
     selection.add_item(str(DATA.data.troops.get(unit.kind,{}).get("name",unit.kind))+" · "+id);selection.set_item_metadata(selection.item_count-1,source)
     if source==selected_source:selection.select(selection.item_count-1)
     break
 var unit=current_squad();craft.visible=battle.get("fortress") is Dictionary and unit!=null and int(unit.team)!=int(battle.fortress.team) and battle.get("result")==null
 selection.disabled=ids.is_empty() or battle.get("result")!=null
 retreat.disabled=unit==null or battle.get("result")!=null
 close_button.visible=battle.get("result")!=null
 mode.disabled=unit==null or battle.get("result")!=null;formation.disabled=mode.disabled
 if unit!=null:
  mode.select(1 if unit.get("combatMode")=="manual" else 0)
  var options:=Formations.options(unit);var form_stamp:=str(selected_source)+":"+str(options)
  if form_stamp!=formation_stamp:
   formation_stamp=form_stamp;formation.clear();formation.add_item("Rivistus: automaatne");formation.set_item_metadata(0,"auto")
   for item in options:formation.add_item(str(Formations.FORMATIONS[item].name));formation.set_item_metadata(formation.item_count-1,item)
  var desired: String=unit.get("formation","line") if unit.get("formationManual",false) else "auto"
  for i in formation.item_count:
   if formation.get_item_metadata(i)==desired:formation.select(i);break

func _process(delta: float) -> void:
 if battle.is_empty():return
 if not outer_tiles_pending.is_empty():load_outer_tile()
 animation_clock-=delta;sync_models();sync_siege_models();sync_ballistas();sync_projectiles()
 if animation_clock<=0:animation_clock=0.08
 ui_clock+=delta
 if ui_clock>=0.3:ui_clock=0;refresh_ui()

func handle_click(screen: Vector2,order: bool) -> void:
 if battle.get("result")!=null:return
 var ray_origin: Vector3=host.camera.project_ray_origin(screen);var ray_direction: Vector3=host.camera.project_ray_normal(screen)
 var hit: Variant=Plane(Vector3.UP,0).intersects_ray(ray_origin,ray_direction)
 if hit==null:return
 for i in 3:
  var next: Variant=Plane(Vector3.UP,ground(hit.x,hit.z)).intersects_ray(ray_origin,ray_direction)
  if next==null:break
  hit=next
 var clicked: Variant=null;var nearest:=8.0
 for unit in battle.squads:
  if float(unit.hp)<=0 or unit.get("reserve",false) or unit.get("retreated",false):continue
  var distance:=Vector2(float(unit.x)-hit.x,float(unit.z)-hit.z).length()
  if distance<nearest:nearest=distance;clicked=unit
 if not order and clicked!=null and int(clicked.team)==0:
  selected_source=int(clicked.source);formation_stamp="";refresh_ui();return
 if not order and clicked==null:return
 var unit=current_squad()
 if unit==null or unit.get("routing",false):return
 if clicked!=null and int(clicked.team)!=0:
  unit.attackTargetSource=clicked.source;unit.target=null;unit.manualOrder=false;unit.advance=true;status.text="Rünnakukäsk antud."
 else:
  var destination={"x":clampf(hit.x,-337.5,337.5),"z":clampf(hit.z,-292.5,292.5)}
  var result: Variant=WallWalk.order(battle,unit,destination,host.battle_nav)
  if result is Dictionary:
   status.text=str(result.error) if result.has("error") else "Müürikäsk antud."
   return
  unit.target=destination;unit.attackTargetSource=null;unit.advance=false;unit.manualOrder=true;status.text="Liikumiskäsk antud."
