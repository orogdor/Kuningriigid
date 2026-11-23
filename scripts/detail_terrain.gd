class_name DetailTerrain
extends RefCounted
const Grid = preload("res://scripts/campaign_grid.gd")
const MESH_DIVISIONS:=32

static func hash_value(x: int, z: int) -> float:
	var n := sin(x*127.1+z*311.7)*43758.5453
	return n-floor(n)

static func value_noise(x: float, z: float) -> float:
	var xi := floori(x); var zi := floori(z)
	var fx := x-xi; var fz := z-zi
	var u := fx*fx*(3-2*fx); var v := fz*fz*(3-2*fz)
	var a := hash_value(xi,zi); var b := hash_value(xi+1,zi)
	var c := hash_value(xi,zi+1); var d := hash_value(xi+1,zi+1)
	return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v

static func shore_warp(x: float, z: float) -> Vector2:
	var wx := (value_noise(x/31+3.1,z/31+7.7)-0.5)*15+(value_noise(x/11+11.3,z/11+2.9)-0.5)*7
	var wz := (value_noise(x/31+19.4,z/31+5.2)-0.5)*15+(value_noise(x/11+4.6,z/11+17.1)-0.5)*7
	return Vector2(wx,wz)

static func sample(cells: Array, c: int, r: int) -> float:
	if c < 0 or c >= Grid.COLS or r < 0 or r >= Grid.ROWS: return -15.0
	var cell: Dictionary = cells[r*Grid.COLS+c]
	if not cell.land: return minf(-6,cell.h)
	if cell.get("river",false) and not cell.get("bridge",false): return maxf(4,cell.h-3.5)
	return maxf(5,cell.h)

static func atlas_height(cells: Array, x: float, z: float, natural_shore := true) -> float:
	if not is_finite(x) or not is_finite(z): return -15.0
	if natural_shore:
		# Compute as scalars: Vector2 may use single precision in non-double Godot builds.
		var wx := (value_noise(x/31+3.1,z/31+7.7)-0.5)*15+(value_noise(x/11+11.3,z/11+2.9)-0.5)*7
		var wz := (value_noise(x/31+19.4,z/31+5.2)-0.5)*15+(value_noise(x/11+4.6,z/11+17.1)-0.5)*7
		x += wx; z += wz
	var fx := (x-Grid.ORIGIN_X)/50.0-0.5
	var fz := (z-Grid.ORIGIN_Z)/50.0-0.5
	var c := floori(fx); var r := floori(fz)
	var u := fx-c; var v := fz-r
	u = u*u*(3-2*u); v = v*v*(3-2*v)
	return (sample(cells,c,r)*(1-u)+sample(cells,c+1,r)*u)*(1-v)+(sample(cells,c,r+1)*(1-u)+sample(cells,c+1,r+1)*u)*v

static func tile_heights(cells: Array, c: int, r: int) -> Array:
	var index:=r*Grid.COLS+c
	if index>=0 and index<cells.size():
		var cell:Dictionary=cells[index]
		if cell.get("webGeneratedV331",false) and cell.get("detail",{}).get("heights",[]).size()==81:return cell.detail.heights
	var result: Array = []
	var x: float = Grid.ORIGIN_X+(c+0.5)*Grid.TILE
	var z: float = Grid.ORIGIN_Z+(r+0.5)*Grid.TILE
	for j in 9:
		for i in 9:
			var sampled := atlas_height(cells,x+(i/8.0-0.5)*50,z+(j/8.0-0.5)*50)
			result.append(floor((sampled-0.7)*30+0.5)/100.0)
	return result

static func detail_height(heights: Array, x: float, z: float) -> float:
	if heights.size() != 81: return 0.3
	var fx := clampf((x/225.0+0.5)*8,0,8)
	var fz := clampf((z/195.0+0.5)*8,0,8)
	var i := mini(7,floori(fx)); var j := mini(7,floori(fz))
	var u := fx-i; var v := fz-j
	return (heights[j*9+i]*(1-u)+heights[j*9+i+1]*u)*(1-v)+(heights[(j+1)*9+i]*(1-u)+heights[(j+1)*9+i+1]*u)*v

# Match the two triangles actually drawn for each terrain cell. Gameplay uses
# the original bilinear detail_height; pointer rays must hit the visible mesh.
static func rendered_height(heights: Array,x: float,z: float) -> float:
	if heights.size()!=81:return 0.3
	var fx:=clampf((x/225.0+0.5)*MESH_DIVISIONS,0,MESH_DIVISIONS);var fz:=clampf((z/195.0+0.5)*MESH_DIVISIONS,0,MESH_DIVISIONS)
	var i:=mini(MESH_DIVISIONS-1,floori(fx));var j:=mini(MESH_DIVISIONS-1,floori(fz));var u:=fx-i;var v:=fz-j
	var x0:=-112.5+float(i)*225.0/MESH_DIVISIONS;var z0:=-97.5+float(j)*195.0/MESH_DIVISIONS
	var x1:=x0+225.0/MESH_DIVISIONS;var z1:=z0+195.0/MESH_DIVISIONS
	var a:=detail_height(heights,x0,z0);var b:=detail_height(heights,x1,z0);var c:=detail_height(heights,x0,z1);var d:=detail_height(heights,x1,z1)
	return a+u*(b-a)+v*(c-a) if u+v<=1.0 else d+(1-u)*(c-d)+(1-v)*(b-d)

static func visual_sample(values: PackedVector4Array,x: float,z: float) -> Vector4:
	if values.size()!=17*17:return Vector4.ZERO
	var fx:=clampf((x/225.0+0.5)*16.0,0,16);var fz:=clampf((z/195.0+0.5)*16.0,0,16)
	var i:=mini(15,floori(fx));var j:=mini(15,floori(fz));var u:=fx-i;var v:=fz-j
	return values[j*17+i].lerp(values[j*17+i+1],u).lerp(values[(j+1)*17+i].lerp(values[(j+1)*17+i+1],u),v)

static func visual_rendered_height(heights: Array,values: PackedVector4Array,x: float,z: float) -> float:
	if values.size()!=17*17:return rendered_height(heights,x,z)
	var fx:=clampf((x/225.0+0.5)*MESH_DIVISIONS,0,MESH_DIVISIONS);var fz:=clampf((z/195.0+0.5)*MESH_DIVISIONS,0,MESH_DIVISIONS)
	var i:=mini(MESH_DIVISIONS-1,floori(fx));var j:=mini(MESH_DIVISIONS-1,floori(fz));var u:=fx-i;var v:=fz-j
	var x0:=-112.5+float(i)*225.0/MESH_DIVISIONS;var z0:=-97.5+float(j)*195.0/MESH_DIVISIONS
	var x1:=x0+225.0/MESH_DIVISIONS;var z1:=z0+195.0/MESH_DIVISIONS
	var a:=visual_sample(values,x0,z0).z;var b:=visual_sample(values,x1,z0).z;var c:=visual_sample(values,x0,z1).z;var d:=visual_sample(values,x1,z1).z
	return a+u*(b-a)+v*(c-a) if u+v<=1.0 else d+(1-u)*(c-d)+(1-v)*(b-d)

static func build_mesh(heights: Array,uv_offset:=Vector2.ZERO,color_heights:=PackedVector4Array()) -> ArrayMesh:
	var size:=MESH_DIVISIONS+1;var points:=PackedVector3Array();points.resize(size*size)
	for j in size:
		for i in size:
			var x:=-112.5+float(i)*225.0/MESH_DIVISIONS;var z:=-97.5+float(j)*195.0/MESH_DIVISIONS
			points[j*size+i]=Vector3(x,visual_sample(color_heights,x,z).z if color_heights.size()==17*17 else detail_height(heights,x,z),z)
	var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	for j in MESH_DIVISIONS:
		for i in MESH_DIVISIONS:
			var a:=j*size+i;var b:=a+1;var c:=a+size;var d:=c+1
			for index in [a,b,c,b,d,c]:
				var vertex:=points[index];surface.set_color(Color.WHITE);surface.set_uv(Vector2(vertex.x,vertex.z)+uv_offset)
				var color_data:=Vector2(vertex.y,0)
				if color_heights.size()==17*17:
					var px: int=int(index)%size;var pz:=floori(float(index)/size);var x0:=mini(15,px/2);var z0:=mini(15,pz/2)
					var u:=float(px-x0*2)*0.5;var v:=float(pz-z0*2)*0.5
					var sample: Vector4=color_heights[z0*17+x0].lerp(color_heights[z0*17+x0+1],u).lerp(color_heights[(z0+1)*17+x0].lerp(color_heights[(z0+1)*17+x0+1],u),v)
					color_data=Vector2(sample.x,sample.y)
				surface.set_uv2(color_data);surface.add_vertex(vertex)
	surface.index();surface.generate_normals();surface.generate_tangents()
	return surface.commit()

const TREE_COUNTS := {"forest":300,"jungle":320,"taiga":290,"lush_river":110,"grassland":75,"steppe":24,"tundra":10,"mesa":3,"desert":0,"snow":0,"snow_mountain":0,"mountain":30}

static func seeded_random(a: float, b: float, seed: int) -> float:
	var n := sin(a*127.1+b*311.7+seed*0.017)*43758.5453
	return n-floor(n)

static func tree_keep(x: float, z: float, forest: bool) -> float:
	var n := value_noise(x/20+13.7,z/20+5.1)*0.7+value_noise(x/7+91.3,z/7+47.9)*0.3
	return clampf(0.15+1.25*n,0,1) if forest else clampf((n-0.42)*2.6,0,1)

static func raw_resources(c: int, r: int, biome: String, heights: Array, seed: int,legacy_biome:="") -> Array:
	var count := (176 if legacy_biome=="forest" else 65 if legacy_biome=="hills" else 45) if not legacy_biome.is_empty() else floori(float(TREE_COUNTS.get(biome,45))*1.25+0.5)
	var forest := biome in ["forest","jungle","taiga"]
	var oversample := count if not legacy_biome.is_empty() else floori(count/(0.78 if forest else 0.28)+0.5)
	var world_x: float = Grid.ORIGIN_X+(c+0.5)*Grid.TILE
	var world_z: float = Grid.ORIGIN_Z+(r+0.5)*Grid.TILE
	var resources: Array = []
	for i in oversample:
		var x: float = floor((seeded_random(c*200+i,r+91,seed)*225*0.94-225*0.47)*10+0.5)/10.0
		var z: float = floor((seeded_random(c*200+i,r+779,seed)*195*0.92-195*0.46)*10+0.5)/10.0
		if legacy_biome.is_empty() and seeded_random(c*313+i,r*7+3,seed) > tree_keep(world_x+x/4.5,world_z+z/3.9,forest): continue
		if detail_height(heights,x,z) > 0.4 and absf(z) > 16:
			resources.append([1 if i%5 == 0 else 0,x,z])
	return resources

