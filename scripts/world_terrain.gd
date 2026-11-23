class_name WorldTerrain
extends RefCounted

const Grid=preload("res://scripts/campaign_grid.gd")
const Detail=preload("res://scripts/detail_terrain.gd")
const Geography=preload("res://scripts/world_geography.gd")
const Visual=preload("res://scripts/visual_elevation.gd")
const SUBDIVISIONS:=3
const WATER:=Color("315d70")
const SHORE:=Color("b5a578")

static func samples(cells: Array) -> PackedFloat32Array:
	var result:=PackedFloat32Array();result.resize(cells.size())
	for i in cells.size():
		var cell: Dictionary=cells[i]
		if not cell.land:result[i]=minf(-6,float(cell.h))
		elif cell.get("river",false) and not cell.get("bridge",false):result[i]=maxf(4,float(cell.h)-3.5)
		else:result[i]=maxf(5,float(cell.h))
	return result

static func sample_at(heights: PackedFloat32Array,c: int,r: int) -> float:
	if c<0 or c>=Grid.COLS or r<0 or r>=Grid.ROWS:return -15.0
	return heights[r*Grid.COLS+c]

static func height_at(heights: PackedFloat32Array,x: float,z: float) -> float:
	var fx: float=(x-Grid.ORIGIN_X)/50.0-0.5
	var fz: float=(z-Grid.ORIGIN_Z)/50.0-0.5
	var c:=floori(fx);var r:=floori(fz)
	var a:=sample_at(heights,c,r);var b:=sample_at(heights,c+1,r)
	var d:=sample_at(heights,c,r+1);var e:=sample_at(heights,c+1,r+1)
	# Preserve the original shoreline domain warp near mixed land/water cells.
	if minf(minf(a,b),minf(d,e))<0 and maxf(maxf(a,b),maxf(d,e))>0:
		var wx: float=(Detail.value_noise(x/31+3.1,z/31+7.7)-0.5)*15+(Detail.value_noise(x/11+11.3,z/11+2.9)-0.5)*7
		var wz: float=(Detail.value_noise(x/31+19.4,z/31+5.2)-0.5)*15+(Detail.value_noise(x/11+4.6,z/11+17.1)-0.5)*7
		fx=(x+wx-Grid.ORIGIN_X)/50.0-0.5;fz=(z+wz-Grid.ORIGIN_Z)/50.0-0.5
		c=floori(fx);r=floori(fz)
		a=sample_at(heights,c,r);b=sample_at(heights,c+1,r)
		d=sample_at(heights,c,r+1);e=sample_at(heights,c+1,r+1)
	var u:=fx-c;var v:=fz-r
	u=u*u*(3-2*u);v=v*v*(3-2*v)
	return (a*(1-u)+b*u)*(1-v)+(d*(1-u)+e*u)*v

static func elevation(heights: PackedFloat32Array,x: float,z: float) -> float:
	return maxf(0.0,(height_at(heights,x,z)-0.7)*0.04)

# Match the actual triangles of the overview mesh, including interpolation.
static func mesh_elevation(samples: Variant,x: float,z: float) -> float:
	if samples is Dictionary:
		var sampler: Dictionary=samples
		var cell_width:=Grid.COLS*SUBDIVISIONS;var cell_depth:=Grid.ROWS*SUBDIVISIONS
		var fx:=clampf((x-Grid.ORIGIN_X)*SUBDIVISIONS/50.0,0.0,float(cell_width)-0.00001)
		var fz:=clampf((z-Grid.ORIGIN_Z)*SUBDIVISIONS/50.0,0.0,float(cell_depth)-0.00001)
		var c:=floori(fx);var r:=floori(fz);var key:=r*cell_width+c
		if sampler.cells.has(key):
			var triangles: PackedFloat32Array=sampler.cells[key];var u:=fx-c;var v:=fz-r
			for i in range(0,triangles.size(),9):
				var ax:=triangles[i];var az:=triangles[i+1];var bx:=triangles[i+3];var bz:=triangles[i+4];var cx:=triangles[i+6];var cz:=triangles[i+7]
				var denominator: float=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz)
				if absf(denominator)<0.000001:continue
				var a: float=((bz-cz)*(u-cx)+(cx-bx)*(v-cz))/denominator
				var b: float=((cz-az)*(u-cx)+(ax-cx)*(v-cz))/denominator;var d:=1.0-a-b
				if minf(a,minf(b,d))>=-0.00001:return a*triangles[i+2]+b*triangles[i+5]+d*triangles[i+8]
		return mesh_elevation(sampler.base,x,z)
	var width:=Grid.COLS*SUBDIVISIONS+1;var depth:=Grid.ROWS*SUBDIVISIONS+1
	if samples.size()!=width*depth:return 0.0
	var fx:=clampf((x-Grid.ORIGIN_X)*SUBDIVISIONS/50.0,0.0,float(width-1)-0.00001)
	var fz:=clampf((z-Grid.ORIGIN_Z)*SUBDIVISIONS/50.0,0.0,float(depth-1)-0.00001)
	var c:=floori(fx);var r:=floori(fz);var u:=fx-c;var v:=fz-r
	var a:=maxf(0.0,(samples[r*width+c]-0.7)*0.04)
	var b:=maxf(0.0,(samples[r*width+c+1]-0.7)*0.04)
	var d:=maxf(0.0,(samples[(r+1)*width+c]-0.7)*0.04)
	var e:=maxf(0.0,(samples[(r+1)*width+c+1]-0.7)*0.04)
	return a*(1.0-u-v)+b*u+d*v if u+v<=1.0 else b*(1.0-v)+d*(1.0-u)+e*(u+v-1.0)

static func seeded_smooth(x: float,z: float,seed: int) -> float:
	var i:=floori(x);var j:=floori(z);var u:=x-i;var v:=z-j
	u=u*u*(3.0-2.0*u);v=v*v*(3.0-2.0*v)
	return (Geography.noise(i,j,seed)*(1.0-u)+Geography.noise(i+1,j,seed)*u)*(1.0-v)+(Geography.noise(i,j+1,seed)*(1.0-u)+Geography.noise(i+1,j+1,seed)*u)*v

static func sample_color(cells: Array,colors: PackedColorArray,x: float,z: float,height: float,seed:=0) -> Color:
	if height<=0.7:return WATER
	var wx:=x+(seeded_smooth(x/41.0+5.3,z/41.0+9.1,seed)-0.5)*46.0+(seeded_smooth(x/13.0+71.0,z/13.0+33.0,seed)-0.5)*12.0
	var wz:=z+(seeded_smooth(x/41.0+41.7,z/41.0+3.9,seed)-0.5)*46.0+(seeded_smooth(x/13.0+19.0,z/13.0+87.0,seed)-0.5)*12.0
	var fx: float=(wx-Grid.ORIGIN_X)/50.0-0.5;var fz: float=(wz-Grid.ORIGIN_Z)/50.0-0.5
	var c:=floori(fx);var r:=floori(fz);var u:=fx-c;var v:=fz-r
	u=u*u*(3.0-2.0*u);v=v*v*(3.0-2.0*v)
	var red:=0.0;var green:=0.0;var blue:=0.0;var weight:=0.0
	for j in 2:
		for i in 2:
			var cc:=clampi(c+i,0,Grid.COLS-1);var rr:=clampi(r+j,0,Grid.ROWS-1)
			var index:=rr*Grid.COLS+cc
			if not cells[index].land:continue
			var w: float=(u if i==1 else 1-u)*(v if j==1 else 1-v)
			var linear:=colors[index].srgb_to_linear()
			red+=linear.r*w;green+=linear.g*w;blue+=linear.b*w;weight+=w
	var fallback_c:=clampi(floori((x-Grid.ORIGIN_X)/50.0),0,Grid.COLS-1);var fallback_r:=clampi(floori((z-Grid.ORIGIN_Z)/50.0),0,Grid.ROWS-1)
	var fallback_index:=fallback_r*Grid.COLS+fallback_c
	var fallback_color: Color=colors[fallback_index] if cells[fallback_index].land else Color("92a365")
	var ground:=Color(red/weight,green/weight,blue/weight) if weight>0.000001 else fallback_color.srgb_to_linear()
	if height<3.4:ground=ground.lerp(Color("dfcea0").srgb_to_linear(),clampf((3.4-height)/1.6,0,1)*0.85)
	ground*=0.92+seeded_smooth(x/17.0+20.0,z/17.0+30.0,seed)*0.14
	return ground.linear_to_srgb()

static func coast_mask(cells: Array) -> PackedByteArray:
	var mask:=PackedByteArray();mask.resize(cells.size())
	for r in Grid.ROWS:
		for c in Grid.COLS:
			var land: bool=cells[r*Grid.COLS+c].land
			for dz in range(-2,3):
				if mask[r*Grid.COLS+c]:break
				for dx in range(-2,3):
					var x:=c+dx;var z:=r+dz
					if x>=0 and x<Grid.COLS and z>=0 and z<Grid.ROWS and bool(cells[z*Grid.COLS+x].land)!=land:
						mask[r*Grid.COLS+c]=1;break
	return mask

static func coast_height(heights: PackedFloat32Array,x: float,z: float,seed: int,mask: PackedByteArray) -> float:
	var c:=clampi(floori((x-Grid.ORIGIN_X)/50.0),0,Grid.COLS-1);var r:=clampi(floori((z-Grid.ORIGIN_Z)/50.0),0,Grid.ROWS-1)
	var original:=height_at(heights,x,z)
	if not mask[r*Grid.COLS+c] and original<18.0:return original
	var h:=Visual.base(heights,x,z,seed)
	if h<34.0:return h
	var radius:=50.0/SUBDIVISIONS*0.55
	var average:=(Visual.base(heights,x+radius,z,seed)+Visual.base(heights,x-radius,z,seed)+Visual.base(heights,x,z+radius,seed)+Visual.base(heights,x,z-radius,seed))*0.25
	return lerpf(h,average,minf(1.0,(h-34.0)/20.0)*0.55)

static func build(cells: Array,heights: PackedFloat32Array,colors: PackedColorArray,adaptive:=true,seed:=0) -> ArrayMesh:
	var width:=Grid.COLS*SUBDIVISIONS+1;var depth:=Grid.ROWS*SUBDIVISIONS+1
	var mask:=coast_mask(cells)
	var count:=width*depth
	var vertices:=PackedVector3Array();vertices.resize(count)
	var vertex_colors:=PackedColorArray();vertex_colors.resize(count)
	var elevation_uv:=PackedVector2Array();elevation_uv.resize(count)
	var sampled_heights:=PackedFloat32Array();sampled_heights.resize(count)
	var normals:=PackedVector3Array();normals.resize(count)
	var step:=2.0/SUBDIVISIONS
	for r in depth:
		var z: float=Grid.ORIGIN_Z+float(r)*50.0/SUBDIVISIONS
		for c in width:
			var x: float=Grid.ORIGIN_X+float(c)*50.0/SUBDIVISIONS
			var h:=coast_height(heights,x,z,seed,mask)
			var i:=r*width+c
			sampled_heights[i]=h
			elevation_uv[i]=Vector2(h,0)
			vertices[i]=Vector3((float(c)/SUBDIVISIONS-Grid.COLS/2.0)*2.0,maxf(0.0,(h-0.7)*0.04),(float(r)/SUBDIVISIONS-Grid.ROWS/2.0)*2.0)
			vertex_colors[i]=sample_color(cells,colors,x,z,h,seed)
	for r in depth:
		for c in width:
			var left: float=vertices[r*width+maxi(c-1,0)].y
			var right: float=vertices[r*width+mini(c+1,width-1)].y
			var up: float=vertices[maxi(r-1,0)*width+c].y
			var down: float=vertices[mini(r+1,depth-1)*width+c].y
			normals[r*width+c]=Vector3(left-right,step*2.0,up-down).normalized()
	var index_count: int=(width-1)*(depth-1)*6
	var indices:=PackedInt32Array();indices.resize(index_count)
	var at:=0
	for r in depth-1:
		for c in width-1:
			var a:=r*width+c;var b:=a+1;var d:=a+width;var e:=d+1
			for index in [a,d,b,b,d,e]:indices[at]=index;at+=1
	var arrays:=[];arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX]=vertices;arrays[Mesh.ARRAY_COLOR]=vertex_colors;arrays[Mesh.ARRAY_NORMAL]=normals;arrays[Mesh.ARRAY_TEX_UV]=elevation_uv;arrays[Mesh.ARRAY_INDEX]=indices
	var mesh:=ArrayMesh.new();mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays)
	mesh.set_meta("atlas_heights",sampled_heights)
	return refine_coasts(mesh,cells,heights,colors,seed,mask) if adaptive else mesh

# Refine only the coarse quads crossed by sea level. Neighbouring quads add
# matching edge vertices so there are no cracks where the two densities meet.
static func refine_coasts(mesh: ArrayMesh,cells: Array,heights: PackedFloat32Array,colors: PackedColorArray,seed:=0,mask:=PackedByteArray()) -> ArrayMesh:
	var width:=Grid.COLS*SUBDIVISIONS+1;var depth:=Grid.ROWS*SUBDIVISIONS+1
	var cols:=width-1;var rows:=depth-1;var base: PackedFloat32Array=mesh.get_meta("atlas_heights")
	var arrays: Array=mesh.surface_get_arrays(0)
	var context: Dictionary={"width":width,"heights":heights,"cells":cells,"colors":colors,"seed":seed,"mask":mask,"vertices":arrays[Mesh.ARRAY_VERTEX],"extra":[],"cache":{}}
	var flags:=PackedByteArray();flags.resize(cols*rows)
	for r in rows:
		for c in cols:
			var a:=r*width+c;var low:=minf(minf(base[a],base[a+1]),minf(base[a+width],base[a+width+1]))
			var high:=maxf(maxf(base[a],base[a+1]),maxf(base[a+width],base[a+width+1]))
			if low<0.72 and high>0.72:flags[r*cols+c]=1
	var indices:=PackedInt32Array();var special: Dictionary={}
	for r in rows:
		for c in cols:
			var key:=r*cols+c;var refined:=flags[key]!=0
			var left:=c>0 and flags[key-1]!=0;var bottom:=r+1<rows and flags[key+cols]!=0
			var right:=c+1<cols and flags[key+1]!=0;var top:=r>0 and flags[key-cols]!=0
			if not refined and not (left or bottom or right or top):
				var a:=r*width+c;var b:=a+1;var d:=a+width;var e:=d+1
				indices.append_array(PackedInt32Array([a,d,b,b,d,e]));continue
			var local:=PackedInt32Array()
			if refined:
				for j in 2:
					for i in 2:
						var gx:=c*2+i;var gz:=r*2+j
						var a:=coast_vertex(context,gx,gz);var b:=coast_vertex(context,gx+1,gz)
						var d:=coast_vertex(context,gx,gz+1);var e:=coast_vertex(context,gx+1,gz+1)
						local.append_array(PackedInt32Array([a,d,b,b,d,e]))
			else:
				var gx:=c*2;var gz:=r*2;var ring: Array[Vector2i]=[Vector2i(gx,gz)]
				if left:ring.append(Vector2i(gx,gz+1))
				ring.append(Vector2i(gx,gz+2))
				if bottom:ring.append(Vector2i(gx+1,gz+2))
				ring.append(Vector2i(gx+2,gz+2))
				if right:ring.append(Vector2i(gx+2,gz+1))
				ring.append(Vector2i(gx+2,gz))
				if top:ring.append(Vector2i(gx+1,gz))
				var center:=coast_vertex(context,gx+1,gz+1)
				for i in ring.size():
					var p: Vector2i=ring[i];var q: Vector2i=ring[(i+1)%ring.size()]
					local.append_array(PackedInt32Array([center,coast_vertex(context,p.x,p.y),coast_vertex(context,q.x,q.y)]))
			indices.append_array(local);special[key]=local
	var vertices: PackedVector3Array=arrays[Mesh.ARRAY_VERTEX];var vertex_colors: PackedColorArray=arrays[Mesh.ARRAY_COLOR]
	var normals: PackedVector3Array=arrays[Mesh.ARRAY_NORMAL];var uv: PackedVector2Array=arrays[Mesh.ARRAY_TEX_UV]
	var raw:=base.duplicate()
	for item in context.extra:
		vertices.append(item.position);vertex_colors.append(item.color);normals.append(item.normal);uv.append(Vector2(item.height,0));raw.append(item.height)
	var sampled: Dictionary={};var step:=2.0/SUBDIVISIONS
	for key in special:
		var c:=int(key)%cols;var r:=floori(float(key)/cols);var ox: float=float(c)*step-Grid.COLS;var oz: float=float(r)*step-Grid.ROWS
		var triangles:=PackedFloat32Array()
		for index in special[key]:
			var p: Vector3=vertices[index]
			triangles.append((p.x-ox)/step);triangles.append((p.z-oz)/step);triangles.append(p.y)
		sampled[key]=triangles
	arrays[Mesh.ARRAY_VERTEX]=vertices;arrays[Mesh.ARRAY_COLOR]=vertex_colors;arrays[Mesh.ARRAY_NORMAL]=normals;arrays[Mesh.ARRAY_TANGENT]=null;arrays[Mesh.ARRAY_TEX_UV]=uv;arrays[Mesh.ARRAY_INDEX]=indices
	var result:=ArrayMesh.new();result.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays)
	result.set_meta("atlas_heights",raw);result.set_meta("atlas_sampler",{"base":base,"cells":sampled})
	return result

static func coast_vertex(context: Dictionary,gx: int,gz: int) -> int:
	var width:=int(context.width)
	if gx%2==0 and gz%2==0:return (gz/2)*width+gx/2
	var key:=gz*(width*2-1)+gx
	if context.cache.has(key):return int(context.cache[key])
	var x: float=Grid.ORIGIN_X+float(gx)*25.0/SUBDIVISIONS;var z: float=Grid.ORIGIN_Z+float(gz)*25.0/SUBDIVISIONS
	var h:=coast_height(context.heights,x,z,int(context.seed),context.mask);var y:=maxf(0.0,(h-0.7)*0.04)
	var delta:=25.0/SUBDIVISIONS
	var l:=maxf(0.0,(coast_height(context.heights,x-delta,z,int(context.seed),context.mask)-0.7)*0.04);var r:=maxf(0.0,(coast_height(context.heights,x+delta,z,int(context.seed),context.mask)-0.7)*0.04)
	var t:=maxf(0.0,(coast_height(context.heights,x,z-delta,int(context.seed),context.mask)-0.7)*0.04);var b:=maxf(0.0,(coast_height(context.heights,x,z+delta,int(context.seed),context.mask)-0.7)*0.04)
	var normal:=Vector3(l-r,2.0/SUBDIVISIONS,t-b).normalized()
	var position:=Vector3(float(gx)/SUBDIVISIONS-Grid.COLS,y,float(gz)/SUBDIVISIONS-Grid.ROWS)
	var index: int=context.vertices.size()+context.extra.size()
	context.extra.append({"position":position,"height":h,"normal":normal,"color":sample_color(context.cells,context.colors,x,z,h,int(context.seed))})
	context.cache[key]=index
	return index


static func build_ocean(terrain: ArrayMesh) -> ArrayMesh:
	var source: Array=terrain.surface_get_arrays(0)
	var heights: PackedFloat32Array=terrain.get_meta("atlas_heights")
	var vertices: PackedVector3Array=source[Mesh.ARRAY_VERTEX]
	var old_indices: PackedInt32Array=source[Mesh.ARRAY_INDEX]
	var colors:=PackedColorArray();colors.resize(vertices.size())
	var normals:=PackedVector3Array();normals.resize(vertices.size())
	for i in vertices.size():
		vertices[i].y=0.018;colors[i]=Color(clampf((heights[i]+80.0)/160.0,0,1),0,0,1);normals[i]=Vector3.UP
	var indices:=PackedInt32Array()
	for i in range(0,old_indices.size(),3):
		var a:=old_indices[i];var b:=old_indices[i+1];var c:=old_indices[i+2]
		if minf(heights[a],minf(heights[b],heights[c]))<=0.7:
			indices.append(a);indices.append(b);indices.append(c)
	var arrays:=[];arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX]=vertices;arrays[Mesh.ARRAY_COLOR]=colors;arrays[Mesh.ARRAY_NORMAL]=normals;arrays[Mesh.ARRAY_INDEX]=indices
	var mesh:=ArrayMesh.new();mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES,arrays)
	return mesh
