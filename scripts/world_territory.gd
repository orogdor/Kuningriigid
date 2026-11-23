class_name WorldTerritory
extends RefCounted

const Grid=preload("res://scripts/campaign_grid.gd")
const Terrain=preload("res://scripts/world_terrain.gd")
const TEAM_COLORS=["69d4c3","e77e64","ac87e2","ead06b"]
const COUNTY_COLORS=["b6ce75","dba082","bca3d6","dfcc87"]

static func smooth(x: float) -> float:
	var t:=clampf(x,0,1)
	return t*t*(3.0-2.0*t)

static func field(cells: Dictionary,x: float,z: float) -> float:
	var u:=x-0.5;var v:=z-0.5;var c:=floori(u);var r:=floori(v)
	var a:=smooth(u-c);var b:=smooth(v-r)
	var q00:=1.0 if cells.has(str(c)+":"+str(r)) else 0.0
	var q10:=1.0 if cells.has(str(c+1)+":"+str(r)) else 0.0
	var q01:=1.0 if cells.has(str(c)+":"+str(r+1)) else 0.0
	var q11:=1.0 if cells.has(str(c+1)+":"+str(r+1)) else 0.0
	return lerpf(lerpf(q00,q10,a),lerpf(q01,q11,a),b)

static func point(heights: PackedFloat32Array,x: float,z: float,lift: float,mesh_samples: Variant=null) -> Vector3:
	var world_x: float=Grid.ORIGIN_X+x*50.0
	var world_z: float=Grid.ORIGIN_Z+z*50.0
	var height:=Terrain.mesh_elevation(mesh_samples,world_x,world_z) if mesh_samples!=null else Terrain.elevation(heights,world_x,world_z)
	return Vector3((x-Grid.COLS/2.0)*2.0,height+lift,(z-Grid.ROWS/2.0)*2.0)

static func add_vertex(surface: SurfaceTool,heights: PackedFloat32Array,x: float,z: float,alpha: float,mesh_samples: Variant=null) -> void:
	surface.set_color(Color(1,1,1,alpha));surface.add_vertex(point(heights,x,z,0.055,mesh_samples))

static func fill(parent: Node3D,cells: Dictionary,heights: PackedFloat32Array,color: Color,opacity: float,mesh_samples: Variant=null) -> void:
	if cells.is_empty():return
	var bounds:=Rect2i(99999,99999,0,0);var max_c:=-1;var max_r:=-1
	for key in cells:
		var p:=str(key).split(":");var c:=int(p[0]);var r:=int(p[1])
		bounds.position.x=mini(bounds.position.x,c);bounds.position.y=mini(bounds.position.y,r);max_c=maxi(max_c,c);max_r=maxi(max_r,r)
	var step:=0.2;var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES);var triangles:=0
	for iz in range((max_r-bounds.position.y+3)*5):
		var z:=float(bounds.position.y-1)+iz*step
		for ix in range((max_c-bounds.position.x+3)*5):
			var x:=float(bounds.position.x-1)+ix*step
			var values:=[field(cells,x,z),field(cells,x+step,z),field(cells,x,z+step),field(cells,x+step,z+step)]
			if values.max()<0.42:continue
			for k in [0,2,1,1,2,3]:
				add_vertex(surface,heights,x+(k%2)*step,z+floori(float(k)/2)*step,smooth((values[k]-0.40)/0.20),mesh_samples)
			triangles+=2
	if triangles==0:return
	var mesh:=MeshInstance3D.new();mesh.mesh=surface.commit()
	var mat:=StandardMaterial3D.new();mat.albedo_color=color;mat.albedo_color.a=opacity
	mat.vertex_color_use_as_albedo=true;mat.transparency=BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;mat.cull_mode=BaseMaterial3D.CULL_DISABLED
	mesh.material_override=mat;parent.add_child(mesh)

static func rebuild(parent: Node3D,owned: Dictionary,urban: Dictionary,explored: Dictionary,reveal_all: bool,heights: PackedFloat32Array,mesh_samples: Variant=null) -> void:
	var groups:={}
	var teams:={}
	for key in owned:
		if not reveal_all and not explored.has(key):continue
		var city: Dictionary=owned[key];var team:=clampi(int(city.team),0,3)
		if not teams.has(team):teams[team]={}
		teams[team][key]=true
		var rural: bool=not urban.get(str(int(city.id)),{}).has(key)
		var name:="%d:%d:%d" % [team,1 if rural else 0,int(city.id)]
		if not groups.has(name):groups[name]={}
		groups[name][key]=true
	for name in groups:
		var parts:=str(name).split(":");var team:=int(parts[0]);var rural:=int(parts[1])==1
		fill(parent,groups[name],heights,Color(COUNTY_COLORS[team] if rural else TEAM_COLORS[team]),0.07 if rural else 0.11,mesh_samples)
	for team in teams:border(parent,teams[team],heights,Color(TEAM_COLORS[team]),mesh_samples)

static func contour_edge(points: Array,a: Vector2,b: Vector2,va: float,vb: float) -> void:
	if (va>0.0)==(vb>0.0):return
	points.append(a.lerp(b,va/(va-vb)))

static func line_quad(surface: SurfaceTool,heights: PackedFloat32Array,a: Vector2,b: Vector2,half_width: float,lift: float,mesh_samples: Variant=null) -> void:
	var direction: Vector2=(b-a).normalized();var normal:=Vector2(-direction.y,direction.x)*half_width
	for p in [a-normal,b-normal,a+normal,a+normal,b-normal,b+normal]:
		surface.add_vertex(point(heights,p.x,p.y,lift,mesh_samples))

static func border(parent: Node3D,cells: Dictionary,heights: PackedFloat32Array,color: Color,mesh_samples: Variant=null) -> void:
	if cells.is_empty():return
	var chunks:={}
	for key in cells:
		var coord:=str(key).split(":");var c:=int(coord[0]);var r:=int(coord[1])
		for dz in [-1,0,1]:
			for dx in [-1,0,1]:
				var x:=floori(float(c+dx)/8.0);var z:=floori(float(r+dz)/8.0)
				if x>=0 and z>=0 and x*8<Grid.COLS and z*8<Grid.ROWS:chunks[str(x)+":"+str(z)]=Vector2i(x,z)
	var outer:=SurfaceTool.new();outer.begin(Mesh.PRIMITIVE_TRIANGLES)
	var inner:=SurfaceTool.new();inner.begin(Mesh.PRIMITIVE_TRIANGLES)
	var segments:=0;var step:=0.1
	for chunk in chunks.values():
		for iz in 80:
			var z: float=chunk.y*8+iz*step
			for ix in 80:
				var x: float=chunk.x*8+ix*step
				var a:=field(cells,x,z)-0.5;var b:=field(cells,x+step,z)-0.5
				var c:=field(cells,x+step,z+step)-0.5;var d:=field(cells,x,z+step)-0.5
				if (a>0)==(b>0) and (b>0)==(c>0) and (c>0)==(d>0):continue
				var points: Array=[]
				contour_edge(points,Vector2(x,z),Vector2(x+step,z),a,b)
				contour_edge(points,Vector2(x+step,z),Vector2(x+step,z+step),b,c)
				contour_edge(points,Vector2(x+step,z+step),Vector2(x,z+step),c,d)
				contour_edge(points,Vector2(x,z+step),Vector2(x,z),d,a)
				for i in range(0,points.size()-1,2):
					var p: Vector2=points[i];var q: Vector2=points[i+1];var mid: Vector2=(p+q)*0.5
					var wx: float=Grid.ORIGIN_X+mid.x*50;var wz: float=Grid.ORIGIN_Z+mid.y*50
					if Terrain.height_at(heights,wx,wz)<0.6:continue
					var start: Vector2=p.lerp(q,0.2);var end: Vector2=p.lerp(q,0.8)
					line_quad(outer,heights,start,end,0.046,0.13,mesh_samples)
					line_quad(inner,heights,start,end,0.027,0.14,mesh_samples);segments+=1
	if segments==0:return
	for row in [[outer,Color("f2e3b6")],[inner,color]]:
		var node:=MeshInstance3D.new();node.mesh=row[0].commit()
		var mat:=StandardMaterial3D.new();mat.albedo_color=row[1];mat.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED
		mat.cull_mode=BaseMaterial3D.CULL_DISABLED;node.material_override=mat;parent.add_child(node)
