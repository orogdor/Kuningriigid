extends RefCounted

const Grid=preload("res://scripts/campaign_grid.gd")
const Terrain=preload("res://scripts/detail_terrain.gd")
const Geography=preload("res://scripts/world_geography.gd")
const Rivers=preload("res://scripts/world_rivers.gd")
const VisualRiver=preload("res://scripts/visual_river.gd")
const Visual=preload("res://scripts/visual_elevation.gd")
const HALF:=Vector2(112.5,97.5)

static func clip(a: Vector3,b: Vector3,margin:=0.0) -> Array:
	var low:=0.0;var high:=1.0
	var dx:=b.x-a.x;var dz:=b.z-a.z
	for pair in [[-dx,a.x+HALF.x+margin],[dx,HALF.x+margin-a.x],[-dz,a.z+HALF.y+margin],[dz,HALF.y+margin-a.z]]:
		var p: float=pair[0];var q: float=pair[1]
		if absf(p)<0.000000001:
			if q<0:return []
			continue
		var t:=q/p
		if p<0:low=maxf(low,t)
		else:high=minf(high,t)
		if low>high:return []
	return [a.lerp(b,low),a.lerp(b,high)]

static func river_points(cell: Dictionary,target: Dictionary,tile: Dictionary,seed: int) -> Array:
	var origin:=Grid.center(int(cell.c),int(cell.r));var finish:=Grid.center(int(target.c),int(target.r));var tile_center:=Grid.center(int(tile.c),int(tile.r))
	var dx:=finish.x-origin.x;var dz:=finish.y-origin.y
	var length:=maxf(0.001,sqrt(dx*dx+dz*dz))
	var amplitude:=minf(7,length*0.12)*(Geography.noise(cell.c*31+405,cell.r*23+11,seed)-0.5)*2
	var width:=clampf(float(cell.get("riverWidth",3)),2.15,10)
	var points: Array=[]
	for i in 11:
		var t:=float(i)/10.0;var bend:=sin(PI*t)*amplitude+sin(TAU*t)*amplitude*0.25
		points.append(Vector3((origin.x+dx*t-dz/length*bend-tile_center.x)*4.5,width*(1+0.1*t),(origin.y+dz*t+dx/length*bend-tile_center.y)*3.9))
	return points

static func build(parent: Node3D,cells: Array,c: int,r: int,heights: Array,seed: int,world_heights:=PackedFloat32Array(),graph: Dictionary={},render:=true,visual:=PackedVector4Array()) -> Array:
	var tile: Dictionary=cells[r*Grid.COLS+c]
	var tile_center:=Grid.center(c,r)
	var segments: Array=[]
	for dr in range(-2,3):
		for dc in range(-2,3):
			var sc:=c+dc;var sr:=r+dr
			if sc<0 or sr<0 or sc>=Grid.COLS or sr>=Grid.ROWS:continue
			var source: Dictionary=cells[sr*Grid.COLS+sc]
			if not source.get("river",false) or not source.get("riverTo") is Dictionary:continue
			var to: Dictionary=source.riverTo;var tc:=int(to.c);var tr:=int(to.r)
			if tc<0 or tr<0 or tc>=Grid.COLS or tr>=Grid.ROWS:continue
			var target: Dictionary=cells[tr*Grid.COLS+tc]
			var source_center:=Grid.center(sc,sr);var target_center:=Grid.center(tc,tr)
			if maxf(source_center.x,target_center.x)+20<tile_center.x-25 or minf(source_center.x,target_center.x)-20>tile_center.x+25 or maxf(source_center.y,target_center.y)+20<tile_center.y-25 or minf(source_center.y,target_center.y)-20>tile_center.y+25:continue
			var points: Array=[];var opacity: Array=[]
			if not graph.is_empty() and not world_heights.is_empty():
				for point in Rivers.sample(cells,world_heights,source,graph,12):
					points.append(Vector3((float(point.x)-tile_center.x)*4.5,float(point.width),(float(point.z)-tile_center.y)*3.9));opacity.append(float(point.get("opacity",1.0)))
			else:
				points=river_points(source,target,tile,seed)
				opacity.resize(points.size());opacity.fill(1.0)
			if points.size()<2:continue
			var first: Vector3=points[0];var second: Vector3=points[1]
			var ford: Dictionary={}
			if source.get("ford",false) and not source.get("bridge",false):
				ford={"center":Vector2(first.x/4.5,first.z/3.9),"tangent":Vector2((second.x-first.x)/4.5,(second.z-first.z)/3.9).normalized()}
			for i in range(1,points.size()):
				var start: Vector3=points[i-1];var finish: Vector3=points[i]
				var part:=clip(start,finish,maxf(start.y,finish.y)*4.5*1.4)
				if part.is_empty():continue
				var a: Vector3=part[0];var b: Vector3=part[1]
				var distance:=Vector2(finish.x-start.x,finish.z-start.z).length()
				var ta:=Vector2(a.x-start.x,a.z-start.z).length()/maxf(0.00001,distance)
				var tb:=Vector2(b.x-start.x,b.z-start.z).length()/maxf(0.00001,distance)
				segments.append([Vector2(a.x,a.z),Vector2(b.x,b.z),a.y*4.2,b.y*4.2,ford,lerpf(opacity[i-1],opacity[i],ta),lerpf(opacity[i-1],opacity[i],tb)])
			if render and (source.get("bridge",false) or source.get("ford",false)):
				var p: Vector3=points[0]
				if absf(p.x)<HALF.x and absf(p.z)<HALF.y:
					add_crossing(parent,points,heights,bool(source.get("bridge",false)),visual,Vector2i(sc,sr))
	if render and not segments.is_empty():
		var visual_rivers:=VisualRiver.segments(cells,world_heights,c,r,graph) if visual.size()==17*17 else []
		add_water(parent,segments,heights,visual,{"segments":visual_rivers,"world_heights":world_heights,"center":tile_center})
	return segments

static func near_water(position: Vector2,segments: Array,margin:=1.35,extra:=0.0) -> bool:
	for segment in segments:
		var a: Vector2=segment[0];var b: Vector2=segment[1]
		var radius:=maxf(float(segment[2]),float(segment[3]))*margin+extra
		if position.x<minf(a.x,b.x)-radius or position.x>maxf(a.x,b.x)+radius or position.y<minf(a.y,b.y)-radius or position.y>maxf(a.y,b.y)+radius:continue
		var line:=b-a
		var t:=clampf((position-a).dot(line)/maxf(0.0001,line.length_squared()),0,1)
		if position.distance_to(a+line*t)<lerpf(float(segment[2]),float(segment[3]),t)*margin+extra:return true
	return false

static func water_field(p: Vector2,segments: Array) -> Vector3:
	var inner:=INF;var outer:=INF;var closest:=INF;var opacity:=1.0
	for segment in segments:
		var a: Vector2=segment[0];var b: Vector2=segment[1];var line:=b-a
		var t:=clampf((p-a).dot(line)/maxf(0.0001,line.length_squared()),0,1)
		var distance:=p.distance_to(a+line*t);var width:=lerpf(float(segment[2]),float(segment[3]),t)
		inner=minf(inner,distance-width);outer=minf(outer,distance-width*1.4)
		if distance<closest:
			closest=distance
			opacity=lerpf(float(segment[5]),float(segment[6]),t) if segment.size()>6 else 1.0
	return Vector3(inner,outer,opacity)

static func water_opacity(p: Vector2,segments: Array) -> float:
	return water_field(p,segments).z

static func clip_field(poly: Array,field: int,invert:=false) -> Array:
	var out: Array=[]
	for i in poly.size():
		var a: Vector4=poly[i];var b: Vector4=poly[(i+1)%poly.size()]
		var va: float=(a.z if field==0 else a.w)*(-1 if invert else 1)
		var vb: float=(b.z if field==0 else b.w)*(-1 if invert else 1)
		if va<=0:out.append(a)
		if (va<=0)!=(vb<=0):out.append(a.lerp(b,va/(va-vb)))
	return out

static func append_polygon(vertices: PackedVector3Array,poly: Array,heights: Array,lift: float,visual: PackedVector4Array,water_context: Dictionary={}) -> void:
	if poly.size()<3:return
	for i in range(1,poly.size()-1):
		for item in [poly[0],poly[i],poly[i+1]]:
			var p: Vector4=item
			var y:=Terrain.visual_rendered_height(heights,visual,p.x,p.y)+lift
			if not water_context.is_empty() and not water_context.segments.is_empty():
				var center: Vector2=water_context.center;var wx:=center.x+p.x/4.5;var wz:=center.y+p.y/3.9
				var near:=VisualRiver.nearest(wx,wz,water_context.segments)
				var level:=0.78+(float(near.waterHeight)-0.78)*Visual.smooth((Visual.atlas(water_context.world_heights,wx,wz)-0.30)/3.7)
				y=(level-0.7)*0.3+0.01
			vertices.append(Vector3(p.x,y,p.y))

static func add_water(parent: Node3D,segments: Array,heights: Array,visual:=PackedVector4Array(),water_context: Dictionary={}) -> void:
	var water:=PackedVector3Array();var banks:=PackedVector3Array();var nodes: Array=[]
	const NX:=32;const NZ:=28
	for j in range(NZ+1):
		for i in range(NX+1):
			var p:=Vector2(-HALF.x+2*HALF.x*i/NX,-HALF.y+2*HALF.y*j/NZ)
			var d:=water_field(p,segments);nodes.append(Vector4(p.x,p.y,d.x,d.y))
	for j in NZ:
		for i in NX:
			var k:=j*(NX+1)+i
			for poly in [[nodes[k],nodes[k+NX+1],nodes[k+1]],[nodes[k+1],nodes[k+NX+1],nodes[k+NX+2]]]:
				append_polygon(water,clip_field(poly,0),heights,0.19,visual,water_context)
				append_polygon(banks,clip_field(clip_field(poly,1),0,true),heights,0.10,visual)
	if not banks.is_empty():
		var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES)
		for vertex in banks:
			var d:=water_field(Vector2(vertex.x,vertex.z),segments)
			var fade:=clampf(d.x/maxf(0.001,d.x-d.y),0,1)
			surface.set_color(Color(1,1,1,0.8*pow(1.0-fade,1.6)*d.z));surface.add_vertex(vertex)
		var bank_material:=material(Color("6e6a4c"),1.0);bank_material.vertex_color_use_as_albedo=true
		var bank:=MeshInstance3D.new();bank.mesh=surface.commit();bank.material_override=bank_material;parent.add_child(bank)
	if not water.is_empty():
		var water_material:=ShaderMaterial.new();water_material.shader=load("res://scripts/detail_river.gdshader")
		var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES)
		for vertex in water:
			var d:=water_field(Vector2(vertex.x,vertex.z),segments)
			var width:=maxf(0.001,(d.x-d.y)/0.4);var edge:=clampf(1.0+d.x/width,0.0,1.0)
			surface.set_color(Color(edge,0,0,d.z));surface.set_normal(Vector3.UP);surface.add_vertex(vertex)
		var stream:=MeshInstance3D.new();stream.mesh=surface.commit();stream.material_override=water_material;parent.add_child(stream)

static func add_crossing(parent: Node3D,points: Array,heights: Array,bridge: bool,visual:=PackedVector4Array(),tile:=Vector2i(-1,-1)) -> void:
	var path: String="res://assets/world/crossings/bridge.glb" if bridge else "res://assets/world/crossings/ford.glb"
	if not ResourceLoader.exists(path):return
	var first: Vector3=points[0];var next: Vector3=points[1]
	var direction:=Vector2((next.x-first.x)/4.5,(next.z-first.z)/3.9).normalized()
	if direction.length_squared()<0.00001:return
	var normal:=Vector2(-direction.y,direction.x);var half_span:=first.y*1.65+4.0
	var left:=Vector2(first.x+normal.x*half_span*3,first.z+normal.y*half_span*2.6)
	var right:=Vector2(first.x-normal.x*half_span*3,first.z-normal.y*half_span*2.6)
	var lh:=Terrain.visual_rendered_height(heights,visual,left.x,left.y);var rh:=Terrain.visual_rendered_height(heights,visual,right.x,right.y)
	var crossing: Node3D=load(path).instantiate()
	crossing.name="BridgeCrossing" if bridge else "FordCrossing";crossing.set_meta("crossing_tile",tile)
	var xaxis:=Vector3(normal.x*half_span*3,(lh-rh)*0.5 if bridge else 0,normal.y*half_span*2.6)
	var zaxis:=Vector3(-normal.y*6.2*3,0,normal.x*6.2*2.6)
	crossing.transform=Transform3D(Basis(xaxis,Vector3(0,0.3,0),zaxis),Vector3(first.x,(lh+rh)*0.5 if bridge else Terrain.visual_rendered_height(heights,visual,first.x,first.z)+0.12,first.z))
	parent.add_child(crossing)

static func material(color: Color,opacity: float) -> StandardMaterial3D:
	var result:=StandardMaterial3D.new();result.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED
	result.transparency=BaseMaterial3D.TRANSPARENCY_ALPHA;color.a=opacity;result.albedo_color=color
	result.cull_mode=BaseMaterial3D.CULL_DISABLED;result.no_depth_test=false
	return result

static func add_geometry(parent: Node3D,vertices: PackedVector3Array,primitive: Mesh.PrimitiveType,mat: Material) -> void:
	var surface:=SurfaceTool.new();surface.begin(primitive)
	for vertex in vertices:surface.add_vertex(vertex)
	var instance:=MeshInstance3D.new();instance.mesh=surface.commit();instance.material_override=mat;parent.add_child(instance)
