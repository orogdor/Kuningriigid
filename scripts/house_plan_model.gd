extends Node3D
const Plan=preload("res://scripts/house_plan_geometry.gd")
const PlanCollision=preload("res://scripts/house_plan_collision.gd")
const Fence=preload("res://scripts/house_fence.gd")
const Catalog=preload("res://data/house_editor_catalog.json")
const ReedShader=preload("res://scripts/house_reed.gdshader")
const PALETTE={"clay":"c18b54","weave":"a18353","stone":"a4a292","wood":"986741","bamboo":"9a805d","mudbrick":"c99b63","cutstone":"d3cab2","plank":"b5895a","brick":"b8573c","plaster":"efe7d3","halftimber":"ece2c9","hide":"b58d65","turf":"9a9462","stave":"c09872","minoanRed":"8e2a1d","minoanBlack":"1d1b1b"}
const TEXTURES={"hide":"land-hide","clay":"atlas-clay","weave":"atlas-weave","stone":"proc-stone","wood":"atlas-wood","bamboo":"atlas-wood","mudbrick":"proc-mudbrick","cutstone":"proc-cutstone","plank":"proc-plank","brick":"proc-brick","plaster":"proc-plaster","halftimber":"proc-plaster","cyclopean":"proc-cyclopean","fresco":"proc-fresco","limestone":"proc-limestone","stave":"atlas-wood","turf":"land-earth","prestigePlaster":"proc-plaster","marble":"proc-marble","reticulatum":"proc-reticulatum","romanbrick":"proc-romanbrick","floor":"land-dirt","reed":"atlas-straw","thatch":"atlas-straw","sod":"proc-sod","bark":"proc-bark","shingle":"proc-shingle","tile":"proc-tile","earth":"proc-clayroof","roofplank":"proc-roofplank"}
static var model_cache:Dictionary={}
static var cache_order:Array[String]=[]
var roof_material:="reed"
var roof_vents:Array[Vector2]=[]
var origin:=Vector2(480,312)
var materials:Dictionary={}
var reed_surface: ShaderMaterial

func material_for(style: String) -> StandardMaterial3D:
 if materials.has(style):return materials[style]
 var material:=StandardMaterial3D.new();material.albedo_color=Color(str(PALETTE.get(style,"ffffff")));material.roughness=1.0;material.cull_mode=BaseMaterial3D.CULL_DISABLED
 if style in ["reed","thatch"]:material.albedo_color=Color("756b5c")
 var key:=str(TEXTURES.get(style,""));var file:="res://assets/house_designer/"+key+".webp"
 if key.begins_with("proc-"):material.albedo_color=Color.WHITE
 if not key.is_empty() and ResourceLoader.exists(file):material.albedo_texture=load(file);material.texture_filter=BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS;material.uv1_scale=Vector3(2,2,1)
 if style in ["reed","thatch"]:material.uv1_scale=Vector3(0.2,1,1)
 materials[style]=material;return material

func roof_surface_material() -> Material:
 if roof_material not in ["reed","thatch"]:return material_for(roof_material)
 if reed_surface==null:
  reed_surface=ShaderMaterial.new();reed_surface.shader=ReedShader
  reed_surface.set_shader_parameter("reed_atlas",load("res://assets/house_designer/atlas-straw.webp"))
 return reed_surface

func local(p: Vector2,height:=0.0) -> Vector3:
 return Vector3((p.x-origin.x)/Plan.PX_PER_M,height,(p.y-origin.y)/Plan.PX_PER_M)

func rebuild(design: Dictionary) -> void:
 for child in get_children():child.free()
 roof_material=str(design.get("roofMat","reed"))
 if roof_material=="plank":roof_material="roofplank"
 var geometry:=Plan.plan_geometry(design);origin=PlanCollision.origin(design)
 var definition:Dictionary=Catalog.data.catalog.get(str(design.get("id","")),{});var era:=clampi(int(definition.get("era",0)),0,2)
 var lifts:=[0.0,0.67,0.87];var doors:=[1.32,1.45,1.60];var curved_doors:=[1.53,1.50,1.62];var windows:=[Vector2(0.73,1.33),Vector2(0.86,1.30),Vector2(0.96,1.45)]
 var lift:float=lifts[era];lift+=(0.88+lift)*(float(design.get("wallScale",100))/100-1.0)
 var height:=0.88+lift
 if not design.get("upperLevel",false):
  if design.get("yard") is Array:add_yard(design.yard,design,era)
  if design.get("plot") is Array and not design.get("field") is Dictionary and not design.get("yard") is Array:add_yard(design.plot,design,era)
 for floor in geometry.floors:add_floor(floor)
 if design.get("field") is Dictionary and design.get("plot") is Array:add_field(design.plot,design.field)
 var fence_index:=0;var stair:=Fence.wall_stair_plan(design)
 for fence in Fence.layout(design):add_fence(fence,fence_index,stair);fence_index+=1
 if not stair.is_empty():add_defense_stair(stair)
 if design.get("pier") is Dictionary:add_pier(design.pier,str(design.get("id",""))=="harbor" and design.get("bronzeStyle",false))
 var opening_frames: Dictionary={}
 for wall in geometry.walls:
  for span in Plan.split_wall(wall,design):
   var top:float=height if span.group=="outer" else 1.23+lift
   if span.group=="outer" and design.get("build","wall")=="open":
    if not span.has("opening") and str(design.get("roofForm","gable")) not in ["flat","pediment"]:add_open_posts(span,top,false)
    continue
   var style:=str(span.get("opening",{}).get("style",""))
   if span.has("opening"):
    var key: int=design.get("openings",[]).find(span.opening)
    if key>=0:
     if not opening_frames.has(key):opening_frames[key]={"opening":span.opening,"points":[],"curved":span.get("curved",false)}
     opening_frames[key].points.append(span.a);opening_frames[key].points.append(span.b)
   if span.get("type","")=="door":
    var door_top:float=curved_doors[era] if span.get("curved",false) else doors[era]
    door_top+=0.10 if style=="arched" else 0.08 if style=="double" else 0.0
    add_wall(span,door_top,top)
   elif span.get("type","")=="window":
    var win:Vector2=windows[era]
    if style=="slit":win+=Vector2(-0.12,0.14)
    elif style=="hole":win+=Vector2(0.08,-0.08)
    add_wall(span,0,win.x);add_wall(span,win.y,top)
   else:add_wall(span,0,top)
 for frame in opening_frames.values():add_opening(frame,era,height)
 if str(design.get("roofForm","")) in ["flat","pediment"] and design.get("build","wall")!="tower":add_classical_features(design,height)
 var upper:Variant=design.get("upper")
 var upper_polys:=[]
 if upper is Dictionary:
  for room in upper.get("rooms",[]):upper_polys.append(Plan.room_polygon(room))
 for room in design.get("rooms",[]):
  var overlap:=false;var lower_poly:=Plan.room_polygon(room)
  for polygon in upper_polys:
   if polygons_overlap(lower_poly,polygon):overlap=true;break
  if not overlap:
   roof_vents.clear()
   var low:=Vector2(INF,INF);var high:=Vector2(-INF,-INF)
   for p in lower_poly:
    var at:=local(p);low=low.min(Vector2(at.x,at.z));high=high.max(Vector2(at.x,at.z))
   for item in design.get("items",[]):
    if item.get("type","")!="fire":continue
    var fire:=Plan.point(item.point);var inside:=false
    for floor in geometry.floors:
     if Plan.inside(fire,floor):inside=true;break
    var at:=local(fire);var position:=Vector2(at.x,at.z)
    if inside and position.x>low.x-0.65 and position.x<high.x+0.65 and position.y>low.y-0.65 and position.y<high.y+0.65:roof_vents.append(position)
   var roof_start:=get_child_count();add_roof(room,design,lift)
   for index in range(roof_start,get_child_count()):get_child(index).set_meta("house_roof",true)
 var towers:=Fence.tower_positions(design)
 for item in design.get("items",[]):
  var type:=str(item.type);var tower: Variant=null
  if type=="tower":
   for candidate in towers:
    if candidate.point.distance_to(Plan.point(item.point))<0.001:tower=candidate;break
  var file: String="res://assets/house_items/"+("tower_attached" if tower!=null and tower.attached else type)+".glb"
  if ResourceLoader.exists(file):
   var object:Node3D=load(file).instantiate();object.position=local(Plan.point(item.point));object.name="Item_"+type
   if tower!=null:object.rotation.y=-float(tower.angle)
   add_child(object)
 if upper is Dictionary and not upper.get("rooms",[]).is_empty():
  var plan:Dictionary=design.duplicate(true);plan.erase("upper");plan.merge(upper.duplicate(true),true)
  plan.plot=null;plan.yard=null;plan.pier=null;plan.openSite=false;plan.upperLevel=true
  var upper_start:=get_child_count();add_floor_link(design,plan,geometry.floors,height+0.145)
  for index in range(upper_start,get_child_count()):get_child(index).set_meta("house_upper",true)
  var second:Node3D=load("res://scripts/house_plan_model.gd").new();second.name="SecondStorey";second.set_meta("house_upper",true);second.rebuild(plan)
  second.position=Vector3((second.origin.x-origin.x)/Plan.PX_PER_M,height+0.145,(second.origin.y-origin.y)/Plan.PX_PER_M);add_child(second)

# The web designer blends a packed-earth compound into the surrounding meadow.
func yard_noise(seed: float) -> float:
 var value:=sin(seed*79.32+17.0)*43758.54
 return value-floor(value)

func yard_cover(x: float,z: float) -> float:
 return clampf(0.53+0.24*sin(x*1.23-z*0.52)*cos(x*0.51+z*0.97)+0.19*sin(x*0.42+z*0.64)+0.10*cos(z*2.18+x*1.12),0.06,0.96)

func add_yard(boundary: Array,design: Dictionary,era: int) -> void:
 if boundary.size()<3:return
 var verts:Array[Vector3]=[];var center:=Vector3.ZERO
 for p in boundary:
  var point:=local(Plan.point(p),0.003);verts.append(point);center+=point
 center/=verts.size()
 if era==1 and design.get("bronzePrestige",false) and design.get("build","")!="tower" and (not design.get("openSite",false) or design.get("id","")=="mason@1"):
  var polygon:=PackedVector2Array()
  for point in verts:polygon.append(Vector2(point.x,point.z))
  var triangles:=Geometry2D.triangulate_polygon(polygon);var paved:=SurfaceTool.new();paved.begin(Mesh.PRIMITIVE_TRIANGLES)
  var material:=StandardMaterial3D.new();material.albedo_texture=load("res://assets/house_designer/proc-flags.webp");material.roughness=1;material.cull_mode=BaseMaterial3D.CULL_DISABLED;paved.set_material(material)
  for index in triangles:paved.set_uv(Vector2(verts[index].x,verts[index].z)*0.81);paved.add_vertex(verts[index])
  paved.generate_normals();var node:=MeshInstance3D.new();node.name="CourtyardPaving";node.mesh=paved.commit();add_child(node);return
 var rim:Array[Vector3]=[]
 for i in verts.size():
  var a:=verts[i];var b:=verts[(i+1)%verts.size()];var count:=maxi(3,ceili(a.distance_to(b)*6))
  for j in count:
   var p:=a.lerp(b,float(j)/count);var direction:=p-center;direction.y=0
   var wave:=0.16+0.23*yard_noise(i*317+j)+0.12*sin(j*0.70+i)
   if direction.length_squared()>0:p-=direction.normalized()*wave
   rim.append(p)
 if rim.size()<3:return
 var points:=PackedVector3Array([center]);var colors:=PackedColorArray();var uvs:=PackedVector2Array([Vector2(center.x,center.z)*0.47]);var indices:=PackedInt32Array();var cols:=rim.size()
 var color_at=func(p:Vector3,t:float,index:int) -> Color:
  var patches:=yard_cover(p.x*0.81+0.46,p.z*0.81)
  var color:=Color("d2b89a").lerp(Color("8b8260"),patches*0.66+t*0.14).lerp(Color("b8a889"),yard_noise(index*81)*0.36)
  var edge:=0.74+patches*0.05;var fade:=clampf((t-edge)/(1-edge),0,1)
  color.a=(1-fade*fade*(3-2*fade))*(0.58+patches*0.41);return color
 colors.append(color_at.call(center,0.0,0))
 for r in range(1,10):
  for i in cols:
   var t:=float(r)/9.0;var p:=center.lerp(rim[i],t);points.append(p);uvs.append(Vector2(p.x,p.z)*0.47);colors.append(color_at.call(p,t,i+r*cols))
   var j:=1+(r-1)*cols+i;var k:=1+(r-1)*cols+(i+1)%cols
   if r==1:indices.append_array(PackedInt32Array([0,k,j]))
   else:indices.append_array(PackedInt32Array([j-cols,k-cols,j,k-cols,k,j]))
 var arrays:=[];arrays.resize(Mesh.ARRAY_MAX);arrays[Mesh.ARRAY_VERTEX]=points;var normals:=PackedVector3Array();normals.resize(points.size());normals.fill(Vector3.UP);arrays[Mesh.ARRAY_NORMAL]=normals;arrays[Mesh.ARRAY_TEX_UV]=uvs;arrays[Mesh.ARRAY_COLOR]=colors;arrays[Mesh.ARRAY_INDEX]=indices
 var mesh:=ArrayMesh.new();mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays)
 var material:=StandardMaterial3D.new();material.albedo_texture=load("res://assets/house_designer/land-dirt.webp");material.vertex_color_use_as_albedo=true;material.transparency=BaseMaterial3D.TRANSPARENCY_ALPHA;material.depth_draw_mode=BaseMaterial3D.DEPTH_DRAW_DISABLED;material.cull_mode=BaseMaterial3D.CULL_DISABLED;material.roughness=0.98;mesh.surface_set_material(0,material)
 var node:=MeshInstance3D.new();node.name="WeatheredYard";node.mesh=mesh;add_child(node)

func classical_bounds(room: Dictionary,design: Dictionary) -> Dictionary:
 var polygon:=Plan.room_polygon(room);var lo:=Vector2(INF,INF);var hi:=Vector2(-INF,-INF)
 for p in polygon:lo=lo.min(p);hi=hi.max(p)
 var sides: Dictionary={"n":0.0,"s":0.0,"w":0.0,"e":0.0}
 if room.get("type","")=="rect" and design.get("build","wall")=="wall" and design.get("porch","none")!="none" and not design.get("rooms",[]).is_empty() and design.rooms[0]==room:
  if design.porch=="all":sides={"n":1.3,"s":1.3,"w":1.3,"e":1.3}
  else:
   var p:=Vector2((lo.x+hi.x)/2,hi.y)
   for opening in design.get("openings",[]):
    if opening.get("type")=="door" and opening.get("group")=="outer":p=Plan.point(opening.point);break
   var distances={"n":absf(p.y-lo.y),"s":absf(p.y-hi.y),"w":absf(p.x-lo.x),"e":absf(p.x-hi.x)};var closest: String="n"
   for key in ["s","w","e"]:
    if float(distances[key])<float(distances[closest]):closest=key
   sides[closest]=1.3
 var a:=local(lo)-Vector3(float(sides.w),0,float(sides.n));var b:=local(hi)+Vector3(float(sides.e),0,float(sides.s))
 return {"a":a,"b":b,"sides":sides}

func add_classical_features(design: Dictionary,height: float) -> void:
 var base:=str(design.get("base","none"));var style:=str(design.get("columns","post"));var base_height:=0.33 if base=="steps" else 0.18 if base=="plinth" else 0.0
 for room in design.get("rooms",[]):
  var bounds:=classical_bounds(room,design);var a:Vector3=bounds.a;var b:Vector3=bounds.b;var center:Vector3=(a+b)/2;var w:=b.x-a.x;var d:=b.z-a.z
  if base_height>0:
   if room.get("type")=="round":
    for i in (3 if base=="steps" else 1):
     var radius:=w/2+(0.42-0.14*i if base=="steps" else 0.42);var mesh:=CylinderMesh.new();mesh.top_radius=radius;mesh.bottom_radius=radius;mesh.height=0.11 if base=="steps" else 0.18;mesh.radial_segments=40
     var node:=MeshInstance3D.new();node.name="HousePlinth";node.mesh=mesh;node.material_override=material_for("marble" if style in ["doric","ionic"] else "cutstone");node.position=Vector3(center.x,0.055+0.11*i if base=="steps" else 0.09,center.z);add_child(node)
   else:
    for i in (3 if base=="steps" else 1):
     var extra:=0.46-0.14*i if base=="steps" else 0.25;var mesh:=BoxMesh.new();mesh.size=Vector3(w+extra*2,0.11 if base=="steps" else 0.18,d+extra*2)
     var node:=MeshInstance3D.new();node.name="HousePlinth";node.mesh=mesh;node.material_override=material_for("marble" if style in ["doric","ionic"] else "cutstone");node.position=Vector3(center.x,0.055+0.11*i if base=="steps" else 0.09,center.z);add_child(node)
  if room.get("type")=="round":continue
  var sides:Dictionary=bounds.sides;var lines:=[{"a":Vector3(a.x,0,a.z),"b":Vector3(b.x,0,a.z),"side":"n"},{"a":Vector3(b.x,0,a.z),"b":Vector3(b.x,0,b.z),"side":"e"},{"a":Vector3(b.x,0,b.z),"b":Vector3(a.x,0,b.z),"side":"s"},{"a":Vector3(a.x,0,b.z),"b":Vector3(a.x,0,a.z),"side":"w"}];var done: Dictionary={}
  for line in lines:
   if design.get("build","wall")!="open" and float(sides[line.side])<=0:continue
   var length:float=line.a.distance_to(line.b);var count:=maxi(1,roundi(length/1.15))
   for i in count+1:
    var point:Vector3=line.a.lerp(line.b,float(i)/count);var key:="%s:%s" % [roundi(point.x*20),roundi(point.z*20)]
    if done.has(key):continue
    done[key]=true;add_classical_column(point,base_height,height-(0.17 if design.get("roofForm")=="flat" else 0),style)
   if design.get("roofForm")=="flat":fence_box(line.a,line.b,height-0.17,0.17,0.3,"wood")

func add_classical_column(point: Vector3,bottom: float,top: float,style: String) -> void:
 if top<=bottom:return
 if style=="minoan":
  var foot:=MeshInstance3D.new();var foot_mesh:=CylinderMesh.new();foot_mesh.top_radius=0.16;foot_mesh.bottom_radius=0.16;foot_mesh.height=0.05;foot_mesh.radial_segments=14;foot.mesh=foot_mesh;foot.name="ColumnBase";foot.material_override=material_for("minoanBlack");foot.position=point+Vector3.UP*(bottom+0.025);add_child(foot)
  var shaft:=MeshInstance3D.new();var shaft_mesh:=CylinderMesh.new();shaft_mesh.top_radius=0.13;shaft_mesh.bottom_radius=0.09;shaft_mesh.height=maxf(0.01,top-bottom-0.25);shaft_mesh.radial_segments=14;shaft.mesh=shaft_mesh;shaft.name="MinoanShaft";shaft.material_override=material_for("minoanRed");shaft.position=point+Vector3.UP*((bottom+0.05+top-0.2)/2);add_child(shaft)
  var capital:=MeshInstance3D.new();var capital_mesh:=BoxMesh.new();capital_mesh.size=Vector3(0.44,0.07,0.44);capital.mesh=capital_mesh;capital.name="ColumnCapital";capital.material_override=material_for("minoanBlack");capital.position=point+Vector3.UP*(top-0.035);add_child(capital);return
 var stone:bool=style in ["doric","ionic","tuscan"];var material: String="marble" if style in ["doric","ionic"] else "plaster" if style=="tuscan" else "wood"
 var radius:=0.13 if stone else 0.075
 if style=="minoan":radius=0.13
 add_column(point+Vector3.UP*bottom,top-bottom,radius,material)
 var foot:=MeshInstance3D.new();var slab:=BoxMesh.new();slab.size=Vector3(0.38 if stone else 0.26,0.10,0.38 if stone else 0.26);foot.mesh=slab;foot.name="ColumnBase";foot.material_override=material_for("cutstone" if not stone else material);foot.position=point+Vector3.UP*(bottom+0.05);add_child(foot)
 if stone or style=="minoan":
  var cap:=MeshInstance3D.new();var block:=BoxMesh.new();block.size=Vector3(0.42,0.07,0.42);cap.mesh=block;cap.name="ColumnCapital";cap.material_override=material_for(material);cap.position=point+Vector3.UP*(top-0.035);add_child(cap)

func add_open_posts(span: Dictionary,height: float,mediterranean: bool) -> void:
 var a:=local(span.a);var b:=local(span.b);var length:=a.distance_to(b)
 if length<0.016:return
 var count:=maxi(1,roundi(length/(1.15 if mediterranean else 1.3)));var stone:bool=str(span.get("finish","")) in ["stone","cutstone","limestone","brick","plaster"]
 for i in count+1:
  var point:=a.lerp(b,float(i)/count)
  add_column(point,height,0.13 if stone else 0.08,"cutstone" if stone else "wood")
 if not mediterranean:add_pole(a+Vector3.UP*(height-0.05),b+Vector3.UP*(height-0.05),0.07,"wood")

func add_pier(pier: Dictionary,harbor: bool) -> void:
 var start:=local(Plan.point(pier.a));var end:=local(Plan.point(pier.b));var delta:=end-start;var length:=delta.length()
 if length<0.04:return
 var direction:=delta/length;var side:=Vector3(direction.z,0,-direction.x);var half_width:=float(pier.get("halfWidth",17))/Plan.PX_PER_M
 for t in [0.10,0.47,0.92]:
  for sign in [-1,1]:
   var point: Vector3=start.lerp(end,t)+side*half_width*0.85*float(sign)
   var height:=0.46 if harbor else 0.35 if t>0.89 else 0.19;var radius:=0.064 if harbor else 0.032 if t>0.89 else 0.026
   add_pole(point+Vector3.DOWN*0.32,point+Vector3.UP*height,radius,"wood")
 for sign in [-1,1]:
  var offset: Vector3=side*half_width*0.73*float(sign)+Vector3.UP*0.093
  add_pole(start+offset,end+offset,0.034,"wood")
 var count:=maxi(1,ceili(length/(0.20 if harbor else 0.118)))
 for i in count:
  var point: Vector3=start.lerp(end,(i+0.5)/count);var variation:float=(fence_noise(i+31)-0.5)*0.028;point+=side*variation*0.14
  fence_box(point-side*(half_width+variation/2),point+side*(half_width+variation/2),0.118,0.05,length/count-0.006,"wood")

func add_opening(frame: Dictionary,era: int,wall_height: float) -> void:
 var points: Array=frame.points
 if points.size()<2:return
 var a: Vector2=points[0];var b: Vector2=points[1];var widest:=0.0
 for p in points:
  for q in points:
   var d: float=p.distance_squared_to(q)
   if d>widest:a=p;b=q;widest=d
 var first:=local(a);var last:=local(b);var width:=first.distance_to(last)
 if width<0.05:return
 var opening: Dictionary=frame.opening;var door: bool=opening.type=="door";var style:=str(opening.get("style",""));var bottom:=0.0;var top:=wall_height
 if door:
  var doors:=[1.32,1.45,1.60];var curved:=[1.53,1.50,1.62];top=float(curved[era] if frame.get("curved",false) else doors[era])+(0.10 if style=="arched" else 0.08 if style=="double" else 0.0)
 else:
  var windows:=[Vector2(0.73,1.33),Vector2(0.86,1.30),Vector2(0.96,1.45)];var span:Vector2=windows[era]
  if style=="slit":span+=Vector2(-0.12,0.14)
  elif style=="hole":span+=Vector2(0.08,-0.08)
  bottom=span.x;top=span.y
 if top<=bottom:return
 var radius:=0.049 if door else 0.032
 for endpoint in [first,last]:add_pole(endpoint+Vector3.UP*bottom,endpoint+Vector3.UP*top,radius,"wood")
 add_pole(first+Vector3.UP*top,last+Vector3.UP*top,radius,"wood")
 var axis: Vector3=(last-first).normalized();var side:=Vector3(-axis.z,0,axis.x);var leaf_height:=top-bottom-0.04
 if door:
  if style=="hide":add_pole(first+Vector3.UP*(top-0.09),last+Vector3.UP*(top-0.09),0.055,"hide");return
  if style=="wattle":
   var end:Vector3=first+(axis*cos(1.5)+side*sin(1.5))*width*0.9
   fence_box(first,end,bottom,leaf_height-0.06,0.045,"weave");return
  if style=="double":
   add_open_leaf(first,axis,side,width/2,bottom,top,1.5,true)
   add_open_leaf(last,-axis,-side,width/2,bottom,top,-1.5,true)
  else:add_open_leaf(first,axis,side,width,bottom,top,1.5,true)
  if style=="arched":
   var mid: Vector3=(first+last)/2
   for i in 7:
    var angle:=PI*i/6;var point:Vector3=mid+axis*(-cos(angle)*(width/2+0.06));var stone_y: float=top+sin(angle)*width*0.32
    for sign in [-1,1]:fence_box(point+side*float(sign)*0.1-axis*0.065,point+side*float(sign)*0.1+axis*0.065,stone_y-0.06,0.12,0.06,"cutstone")
  return
 fence_box(first-axis*0.0425,last+axis*0.0425,bottom-0.0405,0.057,0.265,"wood")
 if style=="shutter":
  add_open_leaf(first,-axis,-side,width/2,bottom,top,0.45,false)
  add_open_leaf(last,axis,side,width/2,bottom,top,-0.45,false)
 elif style in ["lattice","archwin"]:
  for i in range(1,4):
   var point:=first.lerp(last,float(i)/4);add_pole(point+Vector3.UP*bottom,point+Vector3.UP*top,0.009,"wood")
   var y:=lerpf(bottom,top,float(i)/4);add_pole(first+Vector3.UP*y,last+Vector3.UP*y,0.009,"wood")

func add_open_leaf(hinge: Vector3,axis: Vector3,side: Vector3,width: float,bottom: float,top: float,angle: float,door: bool) -> void:
 var direction: Vector3=axis*cos(angle)+side*sin(angle);var end: Vector3=hinge+direction*width;var height:=top-bottom-0.04
 var boards:=maxi(2,roundi(width/0.11))
 for i in boards:
  var a:=hinge.lerp(end,float(i)/boards);var b:=hinge.lerp(end,float(i+1)/boards);fence_box(a,b,bottom+0.02,height,0.035,"wood")
 for y in [bottom+0.18,top-0.2]:fence_box(hinge.lerp(end,0.04),hinge.lerp(end,0.96),float(y)-0.03,0.06,0.065,"wood")
 if door:add_pole(hinge.lerp(end,0.05)+Vector3.UP*(bottom+0.25),hinge.lerp(end,0.95)+Vector3.UP*(top-0.25),0.025,"wood")

func fence_box(a: Vector3,b: Vector3,bottom: float,height: float,depth: float,style: String) -> void:
 var diff:=b-a;diff.y=0
 if diff.length()<0.001 or height<=0:return
 var mesh:=BoxMesh.new();mesh.size=Vector3(diff.length(),height,depth)
 var node:=MeshInstance3D.new();node.name="FencePart";node.mesh=mesh;node.material_override=material_for(style);node.position=(a+b)/2+Vector3.UP*(bottom+height/2);node.rotation.y=-atan2(diff.z,diff.x);add_child(node)

func fence_noise(index: int) -> float:
 var n:=sin(index*79.32+17)*43758.54
 return n-floor(n)

func add_fence(fence: Dictionary,index: int,stair: Dictionary={}) -> void:
 var from:=local(Plan.point(fence.a));var to:=local(Plan.point(fence.b));var delta:=to-from;var length:=delta.length()
 if length<0.04:return
 var axis:=delta/length;var side:=Vector3(-axis.z,0,axis.x);var kind:=str(fence.kind)
 if kind=="gateLine":add_gate(fence);return
 if kind=="highStone":
  fence_box(from,to,-0.09,2.21,1.34,"stone");fence_box(from,to,2.145,0.15,1.4,"cutstone")
  for sign in [-1,1]:
   var offset:Vector3=side*sign*0.755
   if not stair.is_empty() and stair.wall==fence and int(stair.side)==sign:
    var center:float=from.distance_to(local(stair.opening))/length;var gap:float=float(stair.landingWidth)/Plan.PX_PER_M*0.45/length
    var lo:=clampf(center-gap,0,1);var hi:=clampf(center+gap,0,1)
    if lo>0.001:fence_box(from+offset,from.lerp(to,lo)+offset,2.22,1.07,0.17,"stone")
    if hi<0.999:fence_box(from.lerp(to,hi)+offset,to+offset,2.22,1.07,0.17,"stone")
   else:fence_box(from+offset,to+offset,2.22,1.07,0.17,"stone")
  return
 if kind=="stoneLine":fence_box(from,to,-0.025,0.675,0.48,"stone");return
 var base:=0.0
 if kind=="rampart":
  var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES);surface.set_material(material_for("sod"));var pts:=[]
  for end in [from,to]:
   for point in [Vector2(-1.25,-0.02),Vector2(-0.42,0.95),Vector2(0.42,0.95),Vector2(1.25,-0.02)]:pts.append(end+side*point.x+Vector3.UP*point.y)
  for pair in [[0,1],[1,2],[2,3]]:
   for vertex in [pair[0],pair[1],pair[1]+4,pair[0],pair[1]+4,pair[0]+4]:surface.set_uv(Vector2(pts[vertex].x,pts[vertex].z));surface.add_vertex(pts[vertex])
  for vertex in [0,1,2,0,2,3,4,6,5,4,7,6]:surface.set_uv(Vector2(pts[vertex].x,pts[vertex].z));surface.add_vertex(pts[vertex])
  surface.generate_normals();var node:=MeshInstance3D.new();node.name="EarthRampart";node.mesh=surface.commit();add_child(node);kind="palisadeLine";base=0.90
 var tall:=kind=="palisadeLine";var count:=maxi(1,ceili(length/(0.175 if tall else 0.82)))
 if fence.get("stoneBase",false):fence_box(from,to,0,0.28,0.40,"stone")
 for i in count+1:
  var t:=float(i)/count;var height:float=(1.50 if fence.get("stoneBase",false) else 1.57)+fence_noise(i+index*31)*0.076 if tall else 0.77+fence_noise(i+index*31)*0.075
  var point:=from.lerp(to,t)+Vector3.UP*base;var radius:=length/count*0.53 if tall else 0.060
  add_column(point-Vector3.UP*0.016,height+0.016,radius,"wood")
  if tall:
   var shape:=CylinderMesh.new();shape.top_radius=0;shape.bottom_radius=radius;shape.height=0.17;shape.radial_segments=7
   var node:=MeshInstance3D.new();node.name="PalisadeTip";node.mesh=shape;node.material_override=material_for("wood");node.position=point+Vector3.UP*(height+0.075);add_child(node)
 for height in ([0.46,1.09] if tall else [0.30,0.63]):
  var offset:Vector3=side*(0.095 if tall else 0.031)+Vector3.UP*(base+float(height));add_pole(from+offset,to+offset,0.046 if tall else 0.037,"wood")

func add_gate(gate: Dictionary) -> void:
 var profile:=Fence.gate_profile(gate)
 if float(profile.size)<0.16:return
 var a:=local(Plan.point(gate.a));var b:=local(Plan.point(gate.b));var axis:Vector3=(b-a).normalized();var side:=Vector3(-axis.z,0,axis.x);var center:Vector3=(a+b)/2
 var jamb:=float(profile.jamb);var height:=float(profile.height);var field:=bool(profile.field);var stone:=bool(profile.stone);var depth:=1.04 if stone else 0.22 if field else 0.34
 for sign in [-1,1]:
  var point: Vector3=center+axis*float(sign)*(float(profile.size)*0.5-jamb*0.47);var post_height:=height+0.12 if stone else height+0.20 if field else height+0.38
  fence_box(point-axis*jamb*0.61,point+axis*jamb*0.61,0,post_height,depth,"stone" if stone else "wood")
 if not field:fence_box(a,b,height+0.215,0.17,0.28,"stone" if stone else "wood")
 for i in 2:
  var first:=local(profile.hinges[i]);var last:=local(profile.tips[i]);var length:=first.distance_to(last);var leaf_height:=height*0.82 if field else height-0.12
  if length<0.05:continue
  if not field:
   var count:=maxi(3,ceili(length/0.13))
   for j in count:
    var left:=first.lerp(last,float(j)/count);var right:=first.lerp(last,float(j+1)/count);var h:=leaf_height+(fence_noise(i*37+j)-0.5)*0.046;fence_box(left,right,0.057,h,0.072,"wood")
  else:
   for t in [0.13,0.49,0.86]:add_column(first.lerp(last,t)+Vector3.UP*0.055,leaf_height,0.031,"wood")
  for y in [leaf_height*0.26,leaf_height*0.78]:fence_box(first,last,y-0.04,0.058 if field else 0.081,0.10,"wood")
  add_pole(first.lerp(last,0.04)+Vector3.UP*leaf_height*0.23,first.lerp(last,0.95)+Vector3.UP*leaf_height*0.80,0.04,"wood")

func polygons_overlap(a: PackedVector2Array,b: PackedVector2Array) -> bool:
 if a.size()<3 or b.size()<3:return false
 for p in a:
  if Plan.inside(p,b):return true
 for p in b:
  if Plan.inside(p,a):return true
 for x in Plan.edges(a):
  for y in Plan.edges(b):
   if not Plan.crosses(x.a,x.b,y.a,y.b).is_empty() and not Plan.crosses(y.a,y.b,x.a,x.b).is_empty():return true
 return false

# A field is an open plot rather than a roofed building. Its selected crop
# and edge are part of the saved design and must also appear in the preview.
func add_field(plot: Array,field: Dictionary) -> void:
 if plot.size()<3:return
 var low:=Vector2(INF,INF);var high:=Vector2(-INF,-INF)
 for point in plot:
  var p:=local(Plan.point(point));low=low.min(Vector2(p.x,p.z));high=high.max(Vector2(p.x,p.z))
 var size:=high-low
 if size.x<0.1 or size.y<0.1:return
 var center:=(low+high)/2;var margin:=minf(0.6 if field.get("edge","")=="ditch" else 0.44 if field.get("edge","")=="rail" else 0.4,minf(size.x,size.y)*0.2)
 var soil_material:=StandardMaterial3D.new();soil_material.albedo_color=Color("705038");soil_material.roughness=1.0
 var soil:=MeshInstance3D.new();var base:=BoxMesh.new();base.size=Vector3(size.x-2*margin,0.045,size.y-2*margin);soil.mesh=base;soil.material_override=soil_material;soil.position=Vector3(center.x,0,center.y);soil.name="FieldSoil";add_child(soil)
 var crop:=str(field.get("crop","barley"))
 var inner:=size-Vector2.ONE*margin*2;var broad:=crop=="beans";var lanes:=2 if broad else 3
 var rows:=clampi(roundi(inner.y/(0.44 if broad else 0.53)),1,32);var pitch:=inner.y/rows
 add_field_furrows(center,inner,rows)
 if crop!="fallow":
  var colors={"barley":"c3a15c","wheat":"cbaa59","rye":"b2aa69","beans":"779948"}
  var crop_material:=StandardMaterial3D.new();crop_material.albedo_color=Color(str(colors.get(crop,"b79b55")));crop_material.roughness=1.0;crop_material.cull_mode=BaseMaterial3D.CULL_DISABLED
  var leaf_colors={"barley":"918447","wheat":"8f7c42","rye":"73794a","beans":"51723d"}
  var leaf_material:=StandardMaterial3D.new();leaf_material.albedo_color=Color(str(leaf_colors.get(crop,"78814c")));leaf_material.roughness=1.0;leaf_material.cull_mode=BaseMaterial3D.CULL_DISABLED
  var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES);surface.set_material(leaf_material)
  var heads:=SurfaceTool.new();heads.begin(Mesh.PRIMITIVE_TRIANGLES);heads.set_material(crop_material)
  var columns:=clampi(roundi(inner.x/(0.26 if broad else 0.19)),1,maxi(1,floori(1140.0/(rows*lanes))))
  var heights={"barley":0.46,"wheat":0.55,"rye":0.63,"beans":0.27}
  for row in rows:
   for lane in lanes:
    for col in columns:
     var k:=73+row*307+col*23+lane*887
     if fence_noise(k+18)<0.054:continue
     var x:=((col+0.5+(fence_noise(k)-0.5)*0.68+(lane-(lanes-1)/2.0)*0.21)/columns-0.5)*inner.x
     var lateral:float=(lane-(lanes-1)/2.0)*(0.22 if broad else 0.15)+(fence_noise(k+3)-0.5)*0.14
     var shift:=pitch*(0.051*sin(x*4.3+row*0.85)+0.032*sin(x*8.8-row))
     var z:float=(row+0.5)*pitch-inner.y/2+lateral*pitch+shift
     var height:float=float(heights.get(crop,0.46))*(0.74+fence_noise(k+5)*0.46)
     var root:=Vector3(center.x+x,0.06,center.y+z);var tip:=root+Vector3((fence_noise(k+6)-0.5)*0.09,height,(fence_noise(k+7)-0.5)*0.12)
     var angle:=fence_noise(k+16)*TAU;var direction:=Vector3(cos(angle),0,sin(angle));var perpendicular:=Vector3(-direction.z,0,direction.x)
     if broad:
      for j in 5:
       var theta:=j*TAU/5+angle;var axis:=Vector3(cos(theta),0,sin(theta));var sideways:=Vector3(-axis.z,0,axis.x)
       var end:=root+axis*height*0.62+Vector3.UP*height*0.58;var middle:=root.lerp(end,0.6)+Vector3.UP*height*0.37
       add_field_quad(surface,root,middle-sideways*height*0.22,end,middle+sideways*height*0.22)
     else:
      for vertex in [root-direction*0.006,root+direction*0.006,tip]:surface.add_vertex(vertex)
      for sign_ in [-1.0,1.0]:
       var stem:=root.lerp(tip,0.36 if sign_>0 else 0.62);var bend:Vector3=stem+direction*sign_*0.054+Vector3.UP*0.055
       add_field_quad(surface,stem,bend-perpendicular*0.013,bend+direction*sign_*0.079-Vector3.UP*0.023,bend+perpendicular*0.013)
      var length:=0.151 if crop=="wheat" else 0.124;var half:=0.016 if crop=="rye" else 0.022;var awn:=0.081 if crop=="barley" else 0.053 if crop=="rye" else 0.022
      for axis in [direction,perpendicular]:
       var bottom:Vector3=tip-axis*0.014-Vector3.UP*length*0.60;var peak:Vector3=tip+axis*0.012+Vector3.UP*length*0.32
       add_field_quad(heads,bottom,tip+axis*half-Vector3.UP*length*0.30,tip+axis*0.011+Vector3.UP*length*0.34,tip-axis*half-Vector3.UP*length*0.25)
       for vertex in [peak-axis*0.009,peak+axis*0.009,peak+axis*0.023+Vector3.UP*awn]:heads.add_vertex(vertex)
  surface.generate_normals();var plants:=MeshInstance3D.new();plants.name="FieldPlants";plants.mesh=surface.commit();add_child(plants)
  if not broad:heads.generate_normals();var ears:=MeshInstance3D.new();ears.name="FieldEars";ears.mesh=heads.commit();add_child(ears)
 var corners:=[Vector3(low.x,0,low.y),Vector3(high.x,0,low.y),Vector3(high.x,0,high.y),Vector3(low.x,0,high.y)]
 var edge:=str(field.get("edge","ridge"))
 add_field_margin(low,high,margin,edge)
 for i in 4:
  var a:Vector3=corners[i];var b:Vector3=corners[(i+1)%4]
  if edge=="rail":
   if i==2 and a.distance_to(b)>2.5:
    var gap:=0.54/a.distance_to(b);add_field_rail(a,a.lerp(b,0.5-gap));add_field_rail(a.lerp(b,0.5+gap),b)
   else:add_field_rail(a,b)
  elif edge=="stones":
   var count:=floori(a.distance_to(b)/0.31);var stone_mesh:=SphereMesh.new();stone_mesh.radius=0.06;stone_mesh.height=0.07;stone_mesh.radial_segments=7;stone_mesh.rings=4
   for j in count:
    var n:=j+i*31
    if fence_noise(n+9)<0.19:continue
    var t:float=(j+0.5+(fence_noise(n)-0.5)*0.60)/count
    var point:Vector3=a.lerp(b,t);var inward:=Vector3(center.x-point.x,0,center.y-point.z).normalized();point+=inward*margin*0.4;point.y=0.04
    var stone:=MeshInstance3D.new();stone.name="FieldStone";stone.mesh=stone_mesh;stone.material_override=material_for("stone");stone.position=point;add_child(stone)

func add_field_quad(surface: SurfaceTool,a: Vector3,b: Vector3,c: Vector3,d: Vector3) -> void:
 for point in [a,b,c,a,c,d]:surface.add_vertex(point)

func add_field_rail(a: Vector3,b: Vector3) -> void:
 add_pole(a+Vector3.UP*0.3,b+Vector3.UP*0.3,0.035,"wood");get_child(get_child_count()-1).name="FieldRail";get_child(get_child_count()-1).set_meta("field_rail",true)
 add_pole(a+Vector3.UP*0.6,b+Vector3.UP*0.6,0.035,"wood")
 var posts:=maxi(1,ceili(a.distance_to(b)/0.8))
 for j in posts+1:add_column(a.lerp(b,float(j)/posts),0.75,0.05,"wood")

func add_field_margin(low: Vector2,high: Vector2,margin: float,edge: String) -> void:
 var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES)
 var material:StandardMaterial3D=material_for("floor").duplicate();material.vertex_color_use_as_albedo=true;surface.set_material(material)
 var ditch:=edge=="ditch";var ridge:=edge=="ridge"
 var sections:=[Vector2(0,-0.049),Vector2(0.30,0.026 if ditch else 0.037 if ridge else -0.018),Vector2(0.52,-0.046 if ditch else 0.066 if ridge else -0.015),Vector2(0.69,-0.038 if ditch else 0.021 if ridge else -0.013),Vector2(0.84,0.035 if ditch else -0.012),Vector2(1,-0.012)]
 var outer:=[Vector2(low.x,low.y),Vector2(high.x,low.y),Vector2(high.x,high.y),Vector2(low.x,high.y)]
 var inner:=[low+Vector2(margin,margin),Vector2(high.x-margin,low.y+margin),high-Vector2(margin,margin),Vector2(low.x+margin,high.y-margin)]
 for side in 4:
  var a:Vector2=outer[side];var b:Vector2=outer[(side+1)%4];var ia:Vector2=inner[side];var ib:Vector2=inner[(side+1)%4]
  var length:=a.distance_to(b);var steps:=maxi(2,ceili(length/0.15))
  var cross=func(t:float,f:float,h:float) -> Vector3:
   var wobble:float=(sin(t*length*16+side)*0.075+sin(t*length*8.7)*0.105)*sin(PI*t)*maxf(0,1-f)
   var p:=a.lerp(b,t).lerp(ia.lerp(ib,t),f+wobble)
   return Vector3(p.x,h+0.010*sin(t*length*6.3+side)*sin(PI*t)*sin(f*PI),p.y)
  for j in steps:
   var t0:=float(j)/steps;var t1:=float(j+1)/steps
   for k in range(1,sections.size()):
    var first:Vector2=sections[k-1];var last:Vector2=sections[k]
    var tint:=0.48 if ditch and (k==3 or k==4) else 0.06+fence_noise(side*331+j*11+k)*0.18
    var color:=Color("c3a181").lerp(Color("685e49"),tint)
    var points:=[cross.call(t0,first.x,first.y),cross.call(t1,first.x,first.y),cross.call(t1,last.x,last.y),cross.call(t0,last.x,last.y)]
    for index in [0,1,2,0,2,3]:
     var p:Vector3=points[index];surface.set_color(color);surface.set_uv(Vector2(p.x,p.z)*0.48);surface.add_vertex(p)
 surface.generate_normals();var border:=MeshInstance3D.new();border.name="FieldBorder";border.mesh=surface.commit();add_child(border)

func add_field_furrows(center: Vector2,size: Vector2,rows: int) -> void:
 var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES)
 var material:StandardMaterial3D=material_for("floor").duplicate();material.vertex_color_use_as_albedo=true;surface.set_material(material)
 var pitch:=size.y/rows;var cuts:=clampi(ceili(size.x/0.19),5,48)
 var profile:=[Vector2(-0.5,0),Vector2(-0.32,0.025),Vector2(-0.15,0.058),Vector2(0,0.079),Vector2(0.16,0.061),Vector2(0.34,0.027),Vector2(0.5,0)]
 for row in rows:
  var z_center:float=(row+0.5)*pitch-size.y/2
  var point=func(x:float,t:float,h:float) -> Vector3:
   var shift:=pitch*(0.051*sin(x*4.3+row*0.85)+0.032*sin(x*8.8-row))
   return Vector3(center.x+x,0.009+h*clampf((size.x/2-absf(x))/0.29,0,1),center.y+z_center+t*pitch+(1-2*absf(t))*shift)
  for j in cuts:
   var x0:=size.x*(float(j)/cuts-0.5);var x1:=size.x*(float(j+1)/cuts-0.5)
   for k in range(1,profile.size()):
    var pa:Vector2=profile[k-1];var pb:Vector2=profile[k]
    var tint:float=(1-absf(k-3.5)/3.5)*0.79+fence_noise(73+row*27+j*7+k)*0.13
    var color:=Color("8f7660").lerp(Color("d4af87"),tint)
    var points:=[point.call(x0,pa.x,pa.y),point.call(x0,pb.x,pb.y),point.call(x1,pb.x,pb.y),point.call(x1,pa.x,pa.y)]
    for index in [0,1,2,0,2,3]:
     var p:Vector3=points[index];surface.set_color(color);surface.set_uv(Vector2(p.x,p.z)*0.48);surface.add_vertex(p)
 surface.generate_normals();var furrows:=MeshInstance3D.new();furrows.name="FieldFurrows";furrows.mesh=surface.commit();add_child(furrows)

func add_floor(poly: PackedVector2Array,height:=0.008,gallery:=false) -> void:
 if poly.size()<3:return
 var triangles:=Geometry2D.triangulate_polygon(poly)
 if triangles.is_empty():return
 var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES);surface.set_material(material_for("floor"))
 for i in triangles:
  var p:=poly[i];surface.set_normal(Vector3.UP);surface.set_uv(p/Plan.PX_PER_M*0.54);surface.add_vertex(local(p,height))
 var node:=MeshInstance3D.new();node.name="HouseFloor";node.mesh=surface.commit();node.set_meta("upper_gallery",gallery);add_child(node)

func add_wall(span: Dictionary,low: float,high: float) -> void:
 if high<=low:return
 var a:=local(span.a);var b:=local(span.b);var delta:=b-a
 if delta.length()<0.016:return
 var style:=str(span.finish);var width:=0.19 if span.group=="outer" else 0.115
 var mesh:=BoxMesh.new();mesh.size=Vector3(delta.length(),high-low,width*0.37 if style in ["wood","stave","bamboo","weave"] else width)
 var node:=MeshInstance3D.new();node.name="HouseWall";node.mesh=mesh;node.material_override=material_for(str(span.finish));node.position=(a+b)/2+Vector3(0,(low+high)/2,0);node.rotation.y=-atan2(delta.z,delta.x);add_child(node)
 if style=="wood":
  var rows:=maxi(1,roundi((high-low)/0.19));var row_height:float=(high-low)/rows
  for i in rows:
   var y:=low+(i+0.5)*row_height
   add_pole(a+Vector3.UP*y,b+Vector3.UP*y,row_height*0.53,"wood")
   get_child(get_child_count()-1).name="HouseWallLog"
 elif style in ["stave","bamboo"]:
  var count:=maxi(1,roundi(delta.length()/(0.061 if style=="bamboo" else 0.2)))
  var radius:float=delta.length()/count*0.49
  for i in count:
   var p:=a.lerp(b,(i+0.5)/count)
   add_pole(p+Vector3.UP*low,p+Vector3.UP*high,radius,"bamboo" if style=="bamboo" else "wood")
   get_child(get_child_count()-1).name="HouseWallStave"
 elif style=="weave":add_woven_wall(a,b,low,high,width)
 elif style=="halftimber":
  var side:=Vector3(-delta.z,0,delta.x).normalized();var posts:=maxi(1,roundi(delta.length()))
  for sign_ in [-1.0,1.0]:
   var offset:Vector3=side*sign_*(width/2+0.012)
   for y in [low+0.03,high-0.03]:add_wall_brace(a+offset+Vector3.UP*y,b+offset+Vector3.UP*y,0.035)
   for i in posts+1:
    var p:=a.lerp(b,float(i)/posts)+offset
    add_wall_brace(p+Vector3.UP*low,p+Vector3.UP*high,0.035)
    if i<posts:
     var q:=a.lerp(b,float(i+1)/posts)+offset
     add_wall_brace((p if i%2==1 else q)+Vector3.UP*(low+0.05),(q if i%2==1 else p)+Vector3.UP*(high-0.05),0.028)

func add_wall_brace(a: Vector3,b: Vector3,radius: float) -> void:
 if a.distance_to(b)<0.001:return
 add_pole(a,b,radius,"wood");get_child(get_child_count()-1).name="HouseWallBrace"

func add_woven_wall(a: Vector3,b: Vector3,low: float,high: float,width: float) -> void:
 var length:=a.distance_to(b)
 if length<0.08 or high-low<0.09:return
 var axis:Vector3=(b-a).normalized();var side:=Vector3(-axis.z,0,axis.x)
 var bays:=maxi(1,roundi(length/0.22));var courses:=maxi(1,roundi((high-low)/0.052));var segments:=bays*8;var sides:=7
 var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES);surface.set_material(material_for("wood"))
 for course in courses:
  var y:=low+(course+0.5)*(high-low)/courses;var radius:=0.016+fence_noise(course*47+2)*0.008
  var sample=func(step: int,ring: int) -> Vector3:
   var u:=float(step)/segments;var theta:=float(ring)/sides*TAU
   var weave:=cos(u*bays*PI+course*PI);var bend:=sin(u*12+fence_noise(course*47)*6)*0.009+sin(u*31+course*47)*0.004
   return a.lerp(b,u)+Vector3.UP*(y+bend+cos(theta)*radius)+side*(weave*(width*0.40+0.012)+sin(theta)*radius)
  for step in segments:
   for ring in sides:
    var points:=[sample.call(step,ring),sample.call(step+1,ring),sample.call(step,ring+1),sample.call(step+1,ring+1)]
    var uv:=[Vector2(float(step)/segments*length*3.2,float(ring)/sides*0.28),Vector2(float(step+1)/segments*length*3.2,float(ring)/sides*0.28),Vector2(float(step)/segments*length*3.2,float(ring+1)/sides*0.28),Vector2(float(step+1)/segments*length*3.2,float(ring+1)/sides*0.28)]
    for index in [3,2,1,2,0,1]:surface.set_uv(uv[index]);surface.add_vertex(points[index])
 surface.generate_normals();var mesh:=MeshInstance3D.new();mesh.name="HouseWovenBranches";mesh.mesh=surface.commit();add_child(mesh)
 for i in bays+1:
  var p:=a.lerp(b,float(i)/bays);add_pole(p+Vector3.UP*low,p+Vector3.UP*high,width*0.28,"wood")

# The roof surface and reed courses follow the source designer's sampling;
# vents and finer era-specific roof details remain to be ported.
func add_roof(room: Dictionary,design: Dictionary,lift: float) -> void:
 var roof_form:=str(design.get("roofForm","gable"))
 if roof_form=="terrace":add_terrace_roof(room,design,lift);return
 if roof_form in ["flat","pediment"]:
  add_classical_roof(room,design,lift,roof_form);return
 if roof_form not in ["gable","hip"]:return
 var rise:=float(design.get("roofHeight",75))/100.0;var openings:Array=design.get("openings",[])
 if room.type=="rect":
  var a:=Plan.point(room.a);var b:=Plan.point(room.b);var x0:=minf(a.x,b.x);var x1:=maxf(a.x,b.x);var z0:=minf(a.y,b.y);var z1:=maxf(a.y,b.y)
  var transpose:=z1-z0>x1-x0;var along0:=z0 if transpose else x0;var along1:=z1 if transpose else x1
  var across0:=x0 if transpose else z0;var across1:=x1 if transpose else z1;var width:float=(across1-across0)/Plan.PX_PER_M
  var peak:=1.75+(maxf(2.68,1.27+width*0.72)-1.75)*rise;var center:float=(across0+across1)/2;var inset:=48.0/((across1-across0)/2+48.0)
  for side in [-1,1]:
   var edge:float=across0 if side<0 else across1
   var sample=func(s: float,t: float) -> Vector3:
    t=minf(t,1.012);var u:float=along0-16+(along1-along0+32)*s;var v:float=edge+side*48+(center-edge-side*48)*t
    var pitch:float=peak+pow(absf(s-0.5)*2,3)*0.23;var notch:=0.0
    if lift<=0:
     for opening in openings:
      if opening.get("group","")!="outer":continue
      var p:=Plan.point(opening.point);var coord:float=p.x if transpose else p.y;var lengthwise:float=p.y if transpose else p.x
      if absf(edge-coord)<3:notch=maxf(notch,maxf(0,1-maxf(0,absf(u-lengthwise)-24)/26))
    var eave:float=0.8 if lift>0 else 0.15+notch*1.34;var shoulder:=1.09+notch*0.59
    var y:float=eave+(shoulder-eave)*pow(t/inset,0.81) if t<inset else shoulder+(pitch-shoulder)*pow((t-inset)/(1-inset),0.90)
    return local(Vector2(v,u) if transpose else Vector2(u,v),y+lift-0.018)
   roof_grid(sample,32,48)
   roof_courses(sample,32,clampi(roundi(width*1.7),5,12),false)
   for end in [along0,along1]:
    var along_t:float=(end-along0+16)/(along1-along0+32)
    roof_end(sample,along_t,inset,0.88+lift)
 elif room.type=="round":
  var outline:=Plan.room_polygon(room);var center:=Plan.point(room.a);var radius:float=float(room.r)/Plan.PX_PER_M
  var peak:=1.75+(maxf(2.70,2.15+radius*0.92)-1.75)*rise;var seat:=0.27
  var sample=func(s: float,t: float) -> Vector3:
   t=minf(t,0.992);var index:float=s*outline.size();var k:=floori(index);var rim:Vector2=outline[k%outline.size()].lerp(outline[(k+1)%outline.size()],index-k);var clear:=0.0
   if lift<=0:
    for opening in openings:
     if opening.get("group","")!="outer":continue
     var p:=Plan.point(opening.point);var core:=37.0 if opening.type=="door" else 17.0
     clear=maxf(clear,clampf(1-maxf(0,p.distance_to(rim)-core)/30,0,1))
   var eave:=0.8 if lift>0 else 0.62+clear*0.95;var seat_height:=1.05+clear*0.66
   var fullness:float=1+(1-t/seat)*maxf(0.15,0.32/maxf(0.40,radius)) if t<=seat else 1-(t-seat)/(1-seat)
   var p:Vector2=center.lerp(rim,fullness)
   var y:float=eave+(seat_height-eave)*pow(t/seat,0.85) if t<=seat else seat_height+(peak-seat_height)*pow((t-seat)/(1-seat),0.90)
   return local(p,y+sin(s*PI*6)*0.011*(1-t)+lift-0.018)
  roof_grid(sample,maxi(outline.size()*3,72),38)
  roof_courses(sample,maxi(outline.size()*3,72),clampi(roundi(radius*3.2),6,11),true)

func add_terrace_roof(room: Dictionary,design: Dictionary,lift: float) -> void:
 var floor:=Plan.room_polygon(room)
 if floor.size()<3:return
 var center:=local(roof_center(floor));var expanded:=[];var level:=0.88+0.12+lift;var rise:=float(design.get("roofHeight",75))/100.0
 for point in floor:
  var p:=local(point);var d:=p-center;d.y=0
  if d.length_squared()>0:p+=d.normalized()*0.245
  p.y=level;expanded.append(p)
 if room.type=="rect" and expanded.size()==4:
  var along_ab:bool=expanded[0].distance_to(expanded[1])>=expanded[1].distance_to(expanded[2])
  var left:Vector3=expanded[0] if along_ab else expanded[1];var right:Vector3=expanded[1] if along_ab else expanded[2];var back_right:Vector3=expanded[2] if along_ab else expanded[3];var back_left:Vector3=expanded[3] if along_ab else expanded[0]
  var peak:=level+0.14+rise*0.26;var ridge_a:Vector3=left.lerp(back_left,0.5);var ridge_b:Vector3=right.lerp(back_right,0.5);ridge_a.y=peak;ridge_b.y=peak
  for quad in [[left,right,ridge_b,ridge_a],[ridge_a,ridge_b,back_right,back_left]]:
   var sample=func(s: float,t: float) -> Vector3:return quad[0].lerp(quad[1],s).lerp(quad[3].lerp(quad[2],s),t)
   roof_grid(sample,1,1)
  for tri in [[left,back_left,ridge_a],[back_right,right,ridge_b]]:
   var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES);surface.set_material(material_for("wood"))
   for i in [0,1,2]:surface.set_uv(Vector2(i,tri[i].y));surface.add_vertex(tri[i])
   surface.generate_normals();var node:=MeshInstance3D.new();node.name="RoofDeckGable";node.mesh=surface.commit();add_child(node)
   for endpoint in [tri[0],tri[1]]:add_pole(endpoint,tri[2],0.05,"wood")
  add_pole(ridge_a,ridge_b,0.058,"brick")
 else:
  var triangles:=Geometry2D.triangulate_polygon(floor);var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES);surface.set_material(material_for(roof_material))
  for index in triangles:
   var point:Vector3=expanded[index];point.y+=(point.z-center.z)*(0.018+0.017*rise);surface.set_uv(Vector2(point.x,point.z));surface.add_vertex(point)
  surface.generate_normals();var node:=MeshInstance3D.new();node.name="RoofDeckTerrace";node.mesh=surface.commit();add_child(node)
 for i in expanded.size():
  var a:Vector3=expanded[i];var b:Vector3=expanded[(i+1)%expanded.size()];add_pole(a-Vector3.UP*0.068,b-Vector3.UP*0.068,0.0645,"wood")

func add_classical_roof(room: Dictionary,design: Dictionary,lift: float,form: String) -> void:
 var polygon:=Plan.room_polygon(room)
 if polygon.size()<3:return
 var lo:=Vector2(INF,INF);var hi:=Vector2(-INF,-INF)
 for point in polygon:lo=lo.min(point);hi=hi.max(point)
 var bounds:=classical_bounds(room,design);var a:Vector3=bounds.a;var b:Vector3=bounds.b;var height:=0.88+lift;var center:Vector3=(a+b)/2;var width:=b.x-a.x;var depth:=b.z-a.z
 if form=="flat":
  if room.type=="round":
   for layer in [[0.18,0.16,"wall"],[0.10,0.05,"roof"]]:
    var mesh:=CylinderMesh.new();mesh.top_radius=width/2+float(layer[0]);mesh.bottom_radius=mesh.top_radius;mesh.height=float(layer[1]);mesh.radial_segments=40
    var node:=MeshInstance3D.new();node.name="RoofDeck";node.mesh=mesh;node.material_override=material_for(roof_material if layer[2]=="roof" else str(design.get("wallStyle","stone")));node.position=Vector3(center.x,height+0.08 if layer[2]=="wall" else height+0.18,center.z);add_child(node)
  else:
   for layer in [[0.36,0.16,height+0.08,"wall"],[0.28,0.05,height+0.18,"roof"],[0.42,0.05,height+0.025,"wall"]]:
    var mesh:=BoxMesh.new();mesh.size=Vector3(width+float(layer[0]),float(layer[1]),depth+float(layer[0]))
    var node:=MeshInstance3D.new();node.name="RoofDeck";node.mesh=mesh;node.material_override=material_for(roof_material if layer[3]=="roof" else str(design.get("wallStyle","stone")));node.position=Vector3(center.x,float(layer[2]),center.z);add_child(node)
  return
 if room.type=="round":
  var radius:=width/2;var mesh:=CylinderMesh.new();mesh.top_radius=0;mesh.bottom_radius=radius+0.42;mesh.height=(radius+0.42)*0.32;mesh.radial_segments=40
  var node:=MeshInstance3D.new();node.name="RoofDeck";node.mesh=mesh;node.material_override=material_for(roof_material);node.position=Vector3(center.x,height+0.14+mesh.height/2,center.z);add_child(node);return
 var along_x:=width>=depth;var u0:=a.x if along_x else a.z;var u1:=b.x if along_x else b.z;var v0:=a.z if along_x else a.x;var v1:=b.z if along_x else b.x;var vc:float=(v0+v1)/2;var ridge:=height+(v1-v0)*0.15
 for sign in [-1,1]:
  var edge:float=v0-0.36 if sign<0 else v1+0.36;var edge_y:=height-0.36*0.3+0.03
  var sample=func(s: float,t: float) -> Vector3:
   var u:=lerpf(u0-0.24,u1+0.24,s);var v:=lerpf(edge,vc,t);var y:=lerpf(edge_y,ridge+0.03,t)
   return Vector3(u,y,v) if along_x else Vector3(v,y,u)
  roof_grid(sample,1,1)
 for u in [u0,u1]:
  var points: Array=[Vector3(u,height,v0),Vector3(u,height,v1),Vector3(u,ridge-0.02,vc)] if along_x else [Vector3(v0,height,u),Vector3(v1,height,u),Vector3(vc,ridge-0.02,u)]
  var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES);surface.set_material(material_for(str(design.get("wallStyle","stone"))))
  for i in [0,1,2]:surface.set_uv(Vector2(0 if i==0 else 1 if i==1 else 0.5,0 if i<2 else 1));surface.add_vertex(points[i])
  surface.generate_normals();var node:=MeshInstance3D.new();node.name="RoofDeckPediment";node.mesh=surface.commit();add_child(node)

func roof_grid(sample: Callable,columns: int,rows: int) -> void:
 var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES);surface.set_material(roof_surface_material())
 for row in rows:
  for col in columns:
   var s0:=float(col)/columns;var s1:=float(col+1)/columns;var t0:=float(row)/rows;var t1:=float(row+1)/rows
   var quad:=[sample.call(s0,t0),sample.call(s1,t0),sample.call(s0,t1),sample.call(s1,t1)]
   var uv:=[Vector2(s0*3.8,t0*2.3),Vector2(s1*3.8,t0*2.3),Vector2(s0*3.8,t1*2.3),Vector2(s1*3.8,t1*2.3)]
   emit_roof_triangle(surface,[quad[3],quad[2],quad[1]],[uv[3],uv[2],uv[1]])
   emit_roof_triangle(surface,[quad[2],quad[0],quad[1]],[uv[2],uv[0],uv[1]])
 surface.generate_normals();var node:=MeshInstance3D.new();node.name="RoofDeck";node.mesh=surface.commit();add_child(node)

# Each overlapping course is raised at its lower edge, as in the web roof.
func roof_courses(sample: Callable,columns: int,count: int,perimeter: bool) -> void:
 if roof_material not in ["reed","thatch"]:return
 var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES);surface.set_material(roof_surface_material())
 for layer in count:
  for row in 3:
   for col in columns:
    var points:Array=[];var uvs:Array=[]
    for corner in [Vector2i(0,0),Vector2i(1,0),Vector2i(0,1),Vector2i(1,1)]:
     var i:int=col+corner.x;var along:=float(row+corner.y)/3.0
     var index:int=i%columns if perimeter else i
     var point:Vector3=sample.call(float(index)/columns,(layer+along*1.07)/count)
     point.y+=(1.0-along)*(0.057+(fence_noise(index+layer*383)-0.5)*0.102)
     points.append(point);uvs.append(Vector2(float(i)/columns*(5.2 if perimeter else 2.6),along*0.26+layer*0.231))
    emit_roof_triangle(surface,[points[3],points[2],points[1]],[uvs[3],uvs[2],uvs[1]])
    emit_roof_triangle(surface,[points[2],points[0],points[1]],[uvs[2],uvs[0],uvs[1]])
 surface.generate_normals();var node:=MeshInstance3D.new();node.name="OverlappingReedCourses";node.mesh=surface.commit();add_child(node)
 add_reed_fringe(sample,columns,count)

func add_reed_fringe(sample: Callable,columns: int,count: int) -> void:
 var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES)
 var material:=StandardMaterial3D.new();material.vertex_color_use_as_albedo=true;material.roughness=1.0;material.cull_mode=BaseMaterial3D.CULL_DISABLED;surface.set_material(material)
 var strands:=0;var fringe:=columns*3
 for i in fringe:
  var s:float=(i+fence_noise(i)*0.91)/fringe
  var density:float=0.28+0.25*pow(sin(s*43+sin(s*81)),2)
  if fence_noise(i+17)>density:continue
  var base:Vector3=sample.call(s,0.027/count);var upper:Vector3=sample.call(s,0.34/count)
  var slope:Vector3=(upper-base).normalized();var tip:Vector3=base-slope*(0.018+pow(fence_noise(i+5),2)*0.051)
  tip.y-=0.007+fence_noise(i+8)*0.018;base.y+=0.031
  var skip:=false
  for vent in roof_vents:
   if absf((tip.x+base.x)/2-vent.x)<0.32 and absf((tip.z+base.z)/2-vent.y)<0.32:skip=true;break
  if skip:continue
  var direction:=tip-base;var side:=Vector3(direction.z,0,-direction.x).normalized()*(0.0017+fence_noise(i+9)*0.0024)
  var shade:=fence_noise(i+10);var color:=Color.from_hsv(0.083+shade*0.025,0.37,0.28+shade*0.12)
  for vertex in [[base+side,0.84],[base-side,0.91],[tip,1.0]]:
   surface.set_color(color*float(vertex[1]));surface.add_vertex(vertex[0])
  strands+=1
 if strands>0:
  surface.generate_normals();var node:=MeshInstance3D.new();node.name="ReedEaveFringe";node.mesh=surface.commit();add_child(node)

# Clip each roof triangle around the same square smoke vents as the web model.
func emit_roof_triangle(surface: SurfaceTool,points: Array,uvs: Array) -> void:
 var pieces:Array=[[{"point":points[0],"uv":uvs[0]},{"point":points[1],"uv":uvs[1]},{"point":points[2],"uv":uvs[2]}]]
 for vent in roof_vents:
  var next:Array=[]
  for polygon in pieces:
   var remaining:Array=polygon
   for boundary in [[0,vent.x-0.25,1],[0,vent.x+0.25,-1],[1,vent.y-0.25,1],[1,vent.y+0.25,-1]]:
    if remaining.size()<3:break
    var parts:=split_roof_polygon(remaining,int(boundary[0]),float(boundary[1]),float(boundary[2]))
    if parts[1].size()>=3:next.append(parts[1])
    remaining=parts[0]
  pieces=next
 for polygon in pieces:
  for i in range(1,polygon.size()-1):
   for vertex in [polygon[0],polygon[i],polygon[i+1]]:
    surface.set_uv(vertex.uv);surface.add_vertex(vertex.point)

func split_roof_polygon(polygon: Array,axis: int,limit: float,sign_: float) -> Array:
 var inside:Array=[];var outside:Array=[]
 for i in polygon.size():
  var a:Dictionary=polygon[i];var b:Dictionary=polygon[(i+1)%polygon.size()]
  var pa:Vector3=a.point;var pb:Vector3=b.point
  var da:=((pa.x if axis==0 else pa.z)-limit)*sign_;var db:=((pb.x if axis==0 else pb.z)-limit)*sign_
  if da>=0:inside.append(a)
  else:outside.append(a)
  if (da>=0)!=(db>=0):
   var t:=da/(da-db);var crossing={"point":pa.lerp(pb,t),"uv":Vector2(a.uv).lerp(Vector2(b.uv),t)}
   inside.append(crossing);outside.append(crossing)
 return [inside,outside]

static func from_design(design: Dictionary) -> Node3D:
 var key:=JSON.stringify(design)
 if model_cache.has(key):
  cache_order.erase(key);cache_order.append(key)
  return model_cache[key].duplicate()
 var source:Node3D=load("res://scripts/house_plan_model.gd").new();source.rebuild(design)
 model_cache[key]=source;cache_order.append(key)
 while cache_order.size()>24:
  var oldest:String=cache_order.pop_front();model_cache[oldest].free();model_cache.erase(oldest)
 return source.duplicate()

static func clear_cache() -> void:
 for model in model_cache.values():
  if is_instance_valid(model):model.free()
 model_cache.clear();cache_order.clear()

func roof_end(sample: Callable,along: float,inset: float,base: float) -> void:
 var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES);surface.set_material(roof_surface_material())
 for i in 24:
  var t0:=lerpf(inset,1.0,float(i)/24);var t1:=lerpf(inset,1.0,float(i+1)/24)
  var a:Vector3=sample.call(along,t0);var b:Vector3=sample.call(along,t1);var c:=Vector3(a.x,minf(a.y,base),a.z);var d:=Vector3(b.x,minf(b.y,base),b.z)
  var quad:=[a,b,c,d];var uv:=[Vector2(t0,a.y),Vector2(t1,b.y),Vector2(t0,c.y),Vector2(t1,d.y)]
  for idx in [0,1,2,1,3,2]:surface.set_uv(uv[idx]);surface.add_vertex(quad[idx])
 surface.generate_normals();var node:=MeshInstance3D.new();node.name="RoofDeckEnd";node.mesh=surface.commit();add_child(node)


func roof_center(poly: PackedVector2Array) -> Vector2:
 var center:=Vector2.ZERO
 for p in poly:center+=p
 center/=maxi(1,poly.size())
 if Plan.inside(center,poly):return center
 var low:=Vector2(INF,INF);var high:=Vector2(-INF,-INF)
 for p in poly:low=low.min(p);high=high.max(p)
 var best:Vector2=poly[0];var clearance:=0.0;var x:=low.x
 while x<high.x:
  var y:=low.y
  while y<high.y:
   var p:=Vector2(x,y)
   if Plan.inside(p,poly):
    var d:=INF
    for edge in Plan.edges(poly):d=minf(d,p.distance_to(Plan.closest(p,edge.a,edge.b)))
    if d>clearance:clearance=d;best=p
   y+=12
  x+=12
 return best

func add_floor_link(ground: Dictionary,upper: Dictionary,under: Array,y: float) -> void:
 var solid:Array=[]
 for room in upper.get("rooms",[]):solid.append(Plan.room_polygon(room))
 for gallery in upper.get("gallery",[]):
  var floor:=Plan.room_polygon({"type":"rect","a":gallery.a,"b":gallery.b});solid.append(floor);add_floor(floor,y,true)
 if solid.is_empty():return
 var posts:Dictionary={};var stone:bool=ground.get("courtyardStyle",false) or ground.get("bronzePrestige",false)
 for floor in solid:
  for p in floor:
   var supported:=false
   for base in under:
    if Plan.inside(p,base) or not Plan.nearest_wall(p,Plan.edges(base),0.11).is_empty():supported=true;break
   if supported:continue
   var key:="%s:%s" % [p.x,p.y]
   if posts.has(key):continue
   posts[key]=true;add_column(local(p),y-0.13,0.095,"cutstone" if stone else "wood")
 var front:Dictionary={};var best:=-INF
 for floor in solid:
  for edge in Plan.edges(floor):
   var score:float=edge.a.y+edge.b.y
   if score>best:best=score;front=edge
 var top:Vector2=(front.a+front.b)/2
 for opening in upper.get("openings",[]):
  if opening.type=="door" and opening.group=="outer":top=Plan.point(opening.point);break
 if upper.get("stairs") is Dictionary and upper.stairs.has("end"):top=Plan.point(upper.stairs.end)
 var center:=top+Vector2(0,-10)
 for floor in solid:
  if Plan.inside(top,floor) or not Plan.nearest_wall(top,Plan.edges(floor),0.11).is_empty():center=roof_center(floor);break
 var normal:=top-center
 if normal.length_squared()<0.0001:normal=Vector2(0,1)
 else:normal=normal.normalized()
 var to:=local(top,y);var from:=local(Plan.point(upper.stairs.start)) if upper.get("stairs") is Dictionary and upper.stairs.has("start") else to+Vector3(normal.x,0,normal.y)*y*1.32
 from.y=0;var axis:=to-from;axis.y=0;var length:=axis.length()
 if length<0.2:return
 axis/=length;var risers:=maxi(5,ceili(y/0.18));var tread:=length/risers;var step:=y/risers
 for i in risers:
  var height:float=(i+1)*step;var depth:float=height if stone else minf(0.12,step);var at:=from+axis*((i+0.5)*tread);at.y=height-depth/2
  var block:=BoxMesh.new();block.size=Vector3(0.70,depth,tread+0.024);var node:=MeshInstance3D.new();node.name="SecondFloorStair";node.mesh=block;node.material_override=material_for("cutstone" if stone else "wood");node.position=at;node.rotation.y=atan2(axis.x,axis.z);add_child(node)
 var side:=Vector3(axis.z,0,-axis.x);var rail_from:=from+side*0.33;var rail_to:=to+side*0.33
 for t in [0.0,0.33,0.66,1.0]:add_column(rail_from.lerp(rail_to,t),0.67,0.033,"wood")
 add_pole(rail_from+Vector3.UP*0.67,rail_to+Vector3.UP*0.67,0.041,"wood")

func add_column(base: Vector3,height: float,radius: float,style: String) -> void:
 if height<=0:return
 add_pole(base,base+Vector3.UP*height,radius,style)

func add_pole(a: Vector3,b: Vector3,radius: float,style: String) -> void:
 var direction:=b-a;var length:=direction.length()
 if length<0.001:return
 var mesh:=CylinderMesh.new();mesh.top_radius=radius;mesh.bottom_radius=radius;mesh.height=length;mesh.radial_segments=8
 var node:=MeshInstance3D.new();node.name="SecondFloorSupport";node.mesh=mesh;node.material_override=material_for(style);node.position=(a+b)/2;node.quaternion=Quaternion(Vector3.UP,direction.normalized());add_child(node)



# Original high-stone wall access: stairs climb 2.22 m into a landing.
func add_defense_stair(plan: Dictionary) -> void:
 var from:=local(plan.foot);var to:=local(plan.end);var length:=from.distance_to(to);var steps:=maxi(13,ceili(2.22/0.17));var width:float=plan.width/Plan.PX_PER_M
 for i in steps:
  var h:float=float(i+1)*2.22/steps;var a:=from.lerp(to,float(i)/steps);var b:=from.lerp(to,float(i+1)/steps)
  fence_box(a,b,0,h,width,"cutstone")
 var opening:=local(plan.opening);var outside:=local(plan.outside);var normal:Vector2=plan.normal;var wall_edge:=opening+Vector3(normal.x,0,normal.y)*(1.34+0.05)*0.5
 fence_box(wall_edge,outside,0,2.22,float(plan.landingWidth)/Plan.PX_PER_M,"cutstone")
