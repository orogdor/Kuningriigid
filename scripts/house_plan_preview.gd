extends SubViewportContainer
signal walking_changed(active: bool)
const Plan=preload("res://scripts/house_plan_geometry.gd")
const Catalog=preload("res://data/house_editor_catalog.json")
const Fence=preload("res://scripts/house_fence.gd")
const PlanCollision=preload("res://scripts/house_plan_collision.gd")
const HouseModel=preload("res://scripts/house_plan_model.gd")
var viewport: SubViewport
var model: Node3D
var camera: Camera3D
var yaw:=-0.61
var pitch:=0.7130608329
var distance:=15.0
var initial_distance:=19.6
var rotating:=false
var roof_visible:=true
var active_floor:=0
var walking:=false
var walk_pad_input:=Vector2.ZERO
var walk_yaw:=0.0
var walk_pitch:=0.0
var walk_pos:=Vector3.ZERO
var walk_walls: Array=[]
var walk_design: Dictionary={}
var walk_floors: Array=[]
var walk_origin:=Vector2.ZERO
var walk_high_walls: Array=[]
var walk_tower_walls: Array=[]
var walk_surfaces: Array=[]
var framed:=false
var shore_sand: MeshInstance3D
var shore_water: MeshInstance3D
var coast_active:=false
var shore_depth:=0.0


func _ready() -> void:
 stretch=true;mouse_filter=Control.MOUSE_FILTER_STOP
 viewport=SubViewport.new();viewport.render_target_update_mode=SubViewport.UPDATE_ALWAYS;viewport.own_world_3d=true;add_child(viewport)
 var world:=WorldEnvironment.new();var environment:=Environment.new();environment.background_mode=Environment.BG_COLOR;environment.background_color=Color("aababc");environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;environment.ambient_light_color=Color("e8e2d1");environment.ambient_light_energy=0.5;world.environment=environment;viewport.add_child(world)
 var light:=DirectionalLight3D.new();light.rotation_degrees=Vector3(-55,-35,0);light.light_energy=0.8;light.shadow_enabled=true;viewport.add_child(light)
 var ground:=MeshInstance3D.new();var plane:=PlaneMesh.new();plane.size=Vector2(80,80);plane.subdivide_width=92;plane.subdivide_depth=92
 var earth:=StandardMaterial3D.new();earth.albedo_texture=load("res://assets/house_designer/land-earth.webp");earth.albedo_color=Color("b4b891");earth.uv1_scale=Vector3(28.2667,28.2667,1);earth.texture_repeat=true;earth.vertex_color_use_as_albedo=true
 var arrays:=plane.surface_get_arrays(0);var colors:=PackedColorArray()
 for p in arrays[Mesh.ARRAY_VERTEX]:
  var cover:float=clampf(0.53+0.24*sin(p.x*1.23-p.z*0.52)*cos(p.x*0.51+p.z*0.97)+0.19*sin(p.x*0.42+p.z*0.64)+0.10*cos(p.z*2.18+p.x*1.12),0.06,0.96)
  colors.append(Color("bea889").lerp(Color("91b978"),cover))
 arrays[Mesh.ARRAY_COLOR]=colors;var mesh:=ArrayMesh.new();mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays);mesh.surface_set_material(0,earth)
 ground.mesh=mesh;ground.position.y=-0.05;viewport.add_child(ground)
 shore_sand=coast_plane("ae9370",0.62,0.0);shore_water=coast_plane("628980",50.0,0.05)
 var water:=ShaderMaterial.new();water.shader=load("res://scripts/house_coastal_water.gdshader");shore_water.material_override=water
 model=HouseModel.new();viewport.add_child(model)
 camera=Camera3D.new();camera.fov=35;viewport.add_child(camera);camera.current=true;resized.connect(update_camera);update_camera()

func coast_plane(color: String,depth: float,metallic: float) -> MeshInstance3D:
 var node:=MeshInstance3D.new();var plane:=PlaneMesh.new();plane.size=Vector2(150,depth);node.mesh=plane
 var material:=StandardMaterial3D.new();material.albedo_color=Color(color);material.roughness=0.36 if metallic>0 else 1.0;material.metallic=metallic;material.cull_mode=BaseMaterial3D.CULL_DISABLED;node.material_override=material;node.visible=false;viewport.add_child(node);return node

func show_design(design: Dictionary) -> void:
 walk_design=design.duplicate(true);model.rebuild(design);set_roof_visible(roof_visible)
 var definition:Dictionary=Catalog.data.catalog.get(str(design.get("id","")),{})
 coast_active=str(design.get("id",""))=="fisher" or definition.get("base","")=="fisher" or definition.get("coast",false)
 shore_depth=(548.0-PlanCollision.origin(design).y)/Plan.PX_PER_M
 shore_sand.visible=coast_active;shore_water.visible=coast_active
 shore_sand.position=Vector3(0,-0.038,shore_depth-0.2945);shore_water.position=Vector3(0,-0.014,shore_depth+25.0)
 var bounds:=Vector2.ZERO
 for floor in Plan.plan_geometry(design).floors:
  var points: PackedVector2Array=floor
  if points.is_empty():continue
  var low:=points[0];var high:=points[0]
  for p in points:
   low.x=minf(low.x,p.x);low.y=minf(low.y,p.y);high.x=maxf(high.x,p.x);high.y=maxf(high.y,p.y)
  bounds.x=maxf(bounds.x,high.x-low.x);bounds.y=maxf(bounds.y,high.y-low.y)
 var previous_distance:=initial_distance
 var fits:=maxf(4.6,bounds.length()/Plan.PX_PER_M);var center:=PlanCollision.origin(design)
 if design.get("yard") is Array:
  for p in design.yard:fits=maxf(fits,Plan.point(p).distance_to(center)/Plan.PX_PER_M*1.52)
 initial_distance=fits*1.44+1.85
 if not framed:distance=initial_distance;framed=true
 elif previous_distance>0:distance=clampf(distance*initial_distance/previous_distance,4,50)
 update_camera()
 if walking:walk_walls=PlanCollision.walls(walk_design)

static func aspect_fit(width: float,height: float) -> float:
 return maxf(1.0,1.22/maxf(0.2,width/maxf(1.0,height)))

func update_camera() -> void:
 if walking:
  camera.position=walk_pos+Vector3.UP*1.23
  var direction:=Vector3(-sin(walk_yaw)*cos(walk_pitch),sin(walk_pitch),-cos(walk_yaw)*cos(walk_pitch))
  camera.look_at(camera.position+direction,Vector3.UP);return
 var target:=Vector3(0,1.0,0);var fit:=aspect_fit(size.x,size.y)
 camera.position=target+Vector3(sin(yaw)*cos(pitch),sin(pitch),cos(yaw)*cos(pitch))*distance*fit;camera.look_at(target,Vector3.UP)

func _gui_input(event: InputEvent) -> void:
 if event is InputEventMouseButton:
  if event.button_index==MOUSE_BUTTON_LEFT:rotating=event.pressed;accept_event()
  elif event.pressed and event.button_index in [MOUSE_BUTTON_WHEEL_UP,MOUSE_BUTTON_WHEEL_DOWN]:distance=clampf(distance*(0.88 if event.button_index==MOUSE_BUTTON_WHEEL_UP else 1.13),4,50);update_camera();accept_event()
 elif event is InputEventMouseMotion and rotating:
  if walking:walk_yaw-=event.relative.x*0.004;walk_pitch=clampf(walk_pitch-event.relative.y*0.004,-1.3,1.3)
  else:yaw-=event.relative.x*0.009;pitch=clampf(pitch+event.relative.y*0.006,0.08,1.45)
  update_camera();accept_event()

func set_roof_visible(value: bool) -> void:
 roof_visible=value
 set_roof_visibility(model,value)
 for child in model.get_children():
  if child is Node3D and child.get_meta("house_upper",false):child.visible=value or active_floor==1

func set_active_floor(value: int) -> void:
 active_floor=value
 if is_instance_valid(model):set_roof_visible(roof_visible)

func set_roof_visibility(parent: Node,value: bool) -> void:
 for child in parent.get_children():
  if child is Node3D and child.get_meta("house_roof",false):child.visible=value
  set_roof_visibility(child,value)

# The source editor's walk view collides with the same designed wall and gate
# segments as the game. Doors remain open; walking changes no saved geometry.
func start_walking(floor:=0,upper: Dictionary={}) -> bool:
 if walk_design.is_empty():return false
 walk_floors=[];walk_surfaces=[];walk_origin=PlanCollision.origin(walk_design)
 if floor==1 and not upper.get("rooms",[]).is_empty():
  var upper_origin:=PlanCollision.origin(upper);var offset:Vector2=(upper_origin-walk_origin)/Plan.PX_PER_M
  walk_walls=PlanCollision.walls(upper)
  for wall in walk_walls:wall[0]+=offset.x;wall[1]+=offset.y;wall[2]+=offset.x;wall[3]+=offset.y
  for room in upper.rooms:walk_floors.append(Plan.room_polygon(room))
  for gallery in upper.get("gallery",[]):walk_floors.append(Plan.room_polygon({"type":"rect","a":gallery.a,"b":gallery.b}))
  var center:Vector2=model.roof_center(walk_floors[0]);var spawn:Vector2=(center-walk_origin)/Plan.PX_PER_M
  var definition:Dictionary=Catalog.data.catalog.get(str(walk_design.get("id","")),{});var era:=clampi(int(definition.get("era",0)),0,2)
  var lift:float=[0.0,0.67,0.87][era];lift+=(0.88+lift)*(float(walk_design.get("wallScale",100))/100-1)
  if walk_blocked(spawn):
   var found:=false
   for radius in range(1,17):
    for angle in 16:
     var candidate:=spawn+Vector2.from_angle(angle*TAU/16.0)*radius*0.15
     if not walk_blocked(candidate):spawn=candidate;found=true;break
    if found:break
  walk_pos=Vector3(spawn.x,0.88+lift+0.145,spawn.y);walk_yaw=0;walk_pitch=-0.05;walking=true;camera.fov=65;walking_changed.emit(true);update_camera();return true
 walk_walls=PlanCollision.walls(walk_design);walk_tower_walls=PlanCollision.walls(walk_design,false,true);walk_high_walls=PlanCollision.walls(walk_design,true,true)
 var stair:=Fence.wall_stair_plan(walk_design)
 if not stair.is_empty():
  add_walk_surface(stair.foot,stair.end,(float(stair.width)/Plan.PX_PER_M)-0.05,0,2.22)
  add_walk_surface(stair.mouth,stair.outside,(float(stair.landingWidth)/Plan.PX_PER_M)-0.05,2.22,2.22)
 for fence in Fence.layout(walk_design):
  if fence.kind=="highStone":add_walk_surface(Plan.point(fence.a),Plan.point(fence.b),1.34*0.85,2.22,2.22)
 for tower in Fence.tower_positions(walk_design):
  var c:=cos(float(tower.angle));var sn:=sin(float(tower.angle))
  var vertex=func(x,z):return tower.point+Vector2(c*x-sn*z,sn*x+c*z)*Plan.PX_PER_M
  add_walk_surface(vertex.call(0,2.18),vertex.call(0,0.71),0.54,0,2.34)
  add_walk_surface(vertex.call(0,-0.71),vertex.call(0,0.71),1.42,2.34,2.34)
 var origin:=PlanCollision.origin(walk_design)
 var geometry:=Plan.plan_geometry(walk_design);var far_z:=0.0
 for polygon in geometry.floors:
  for p in polygon:far_z=maxf(far_z,(p.y-origin.y)/Plan.PX_PER_M)
 var entrance:=Vector2(0,maxf(1.6,far_z));var gate: Variant=null
 for fence in Fence.layout(walk_design):
  if fence.get("kind","")=="gateLine":gate=fence;break
 if gate!=null:
  var a:=Plan.point(gate.a);var b:=Plan.point(gate.b);entrance=((a+b)/2-origin)/Plan.PX_PER_M
  var side:=Vector2(-(b-a).y,(b-a).x).normalized();var spawn:=entrance+side*2.2
  walk_yaw=atan2(side.x,side.y);walk_pos=Vector3(spawn.x,0,spawn.y)
 else:
  var found:=false
  for wall in geometry.walls:
   for span in Plan.split_wall(wall,walk_design):
    if span.get("type","")=="door" and span.group=="outer":entrance=(Plan.point(span.opening.point)-origin)/Plan.PX_PER_M;found=true;break
   if found:break
  walk_yaw=atan2(entrance.x,entrance.y);var radius:=entrance.length()+1.85
  walk_pos=Vector3(sin(walk_yaw)*radius,0,cos(walk_yaw)*radius)
 if coast_active and walk_pos.z>=shore_depth-0.27:walk_pos.z=shore_depth-0.27
 walk_pitch=-0.05;walking=true;camera.fov=65;walking_changed.emit(true);update_camera();return true

func stop_walking() -> void:
 walking=false;walk_pad_input=Vector2.ZERO;rotating=false;camera.fov=35;walking_changed.emit(false);update_camera()

func add_walk_surface(a: Vector2,b: Vector2,width: float,low: float,high: float) -> void:
 walk_surfaces.append({"a":(a-walk_origin)/Plan.PX_PER_M,"b":(b-walk_origin)/Plan.PX_PER_M,"width":width,"low":low,"high":high})

func surface_height(point: Vector2,current: float) -> Variant:
 var candidates: Array=[0.0]
 for surface in walk_surfaces:
  var a:Vector2=surface.a;var axis:Vector2=surface.b-a;var length:=axis.length()
  if length<0.04:continue
  axis/=length;var offset:=point-a;var along:=offset.dot(axis);var lateral:=offset.cross(axis)
  if along< -0.08 or along>length+0.08 or absf(lateral)>float(surface.width)/2:continue
  candidates.append(lerpf(float(surface.low),float(surface.high),clampf(along/length,0,1)))
 candidates.sort();candidates.reverse()
 for height in candidates:
  if absf(float(height)-current)>0.245:continue
  if not walk_blocked(point,float(height)):return height
 return null

func walk_blocked(point: Vector2,height: float=0) -> bool:
 if absf(point.x)>24 or absf(point.y)>24:return true
 if walk_floors.is_empty() and coast_active and point.y>shore_depth-0.03:
  var pier:=Plan.pier_outline(walk_design.get("pier"));var plan_point:=point*Plan.PX_PER_M+walk_origin
  if pier.size()<3 or not Plan.inside(plan_point,pier):return true
 if not walk_floors.is_empty():
  var p:=point*Plan.PX_PER_M+walk_origin;var inside:=false
  for poly in walk_floors:
   if Plan.inside(p,poly) or not Plan.nearest_wall(p,Plan.edges(poly),0.11).is_empty():inside=true;break
  if not inside:return true
 var barriers:Array=walk_walls
 if walk_floors.is_empty():
  if height>=2.18:barriers=walk_high_walls
  elif height>=1.58:barriers=walk_tower_walls
 for wall in barriers:
  var a:=Vector2(float(wall[0]),float(wall[1]));var b:=Vector2(float(wall[2]),float(wall[3]));var edge:=b-a
  var t:=clampf((point-a).dot(edge)/edge.length_squared(),0,1) if edge.length_squared()>0 else 0.0
  if point.distance_squared_to(a+edge*t)<pow(float(wall[4])+0.22,2):return true
 return false

func walk_by(input: Vector2,dt: float,run:=false) -> void:
 if not walking:return
 if input.length()>1:input=input.normalized()
 var speed:=4.0 if run else 2.1;var forward:=Vector2(-sin(walk_yaw),-cos(walk_yaw));var side:=Vector2(cos(walk_yaw),-sin(walk_yaw))
 var delta:Vector2=(forward*input.y+side*input.x)*speed*minf(dt,0.1)
 if not walk_floors.is_empty():
  if not walk_blocked(Vector2(walk_pos.x+delta.x,walk_pos.z)):walk_pos.x+=delta.x
  if not walk_blocked(Vector2(walk_pos.x,walk_pos.z+delta.y)):walk_pos.z+=delta.y
 else:
  var h:Variant=surface_height(Vector2(walk_pos.x+delta.x,walk_pos.z),walk_pos.y)
  if h!=null:walk_pos.x+=delta.x;walk_pos.y=h
  h=surface_height(Vector2(walk_pos.x,walk_pos.z+delta.y),walk_pos.y)
  if h!=null:walk_pos.z+=delta.y;walk_pos.y=h
 update_camera()

func _process(dt: float) -> void:
 if not walking or not visible:return
 var direction:=Vector2(int(Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT))-int(Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT)),int(Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP))-int(Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN)))
 direction+=walk_pad_input
 if direction!=Vector2.ZERO:walk_by(direction,dt,Input.is_key_pressed(KEY_SHIFT))
