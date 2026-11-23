class_name WorldRivers
extends RefCounted

const Grid=preload("res://scripts/campaign_grid.gd")
const Terrain=preload("res://scripts/world_terrain.gd")
const Geography=preload("res://scripts/world_geography.gd")
const Visual=preload("res://scripts/visual_elevation.gd")
const WORLD_SCALE:=0.04

static func smooth(value: float) -> float:
	var t:=clampf(value,0,1)
	return t*t*(3-2*t)

static func noise_smooth(x: float,z: float,seed: int) -> float:
	var i:=floori(x);var j:=floori(z);var u:=smooth(x-i);var v:=smooth(z-j)
	return (Geography.noise(i,j,seed)*(1-u)+Geography.noise(i+1,j,seed)*u)*(1-v)+(Geography.noise(i,j+1,seed)*(1-u)+Geography.noise(i+1,j+1,seed)*u)*v

static func index_of(cell: Dictionary) -> int:
	return int(cell.r)*Grid.COLS+int(cell.c)

static func center(cell: Dictionary) -> Vector2:
	return Grid.center(int(cell.c),int(cell.r))

static func cell_at(cells: Array,p: Dictionary) -> Dictionary:
	var c:=int(p.c);var r:=int(p.r)
	return cells[r*Grid.COLS+c] if c>=0 and c<Grid.COLS and r>=0 and r<Grid.ROWS else {}

static func point(cell: Dictionary,anchors: Dictionary) -> Vector2:
	return anchors.get(index_of(cell),center(cell))

static func prepare(cells: Array,seed: int) -> Dictionary:
	var incoming: Dictionary={};var sources: Array=[];var anchors: Dictionary={};var lakes: Dictionary={}
	for cell in cells:
		if not cell.get("river",false) or not cell.get("riverTo") is Dictionary:continue
		var target:=cell_at(cells,cell.riverTo)
		if target.is_empty():continue
		sources.append(cell)
		var key:=index_of(target)
		if not incoming.has(key):incoming[key]=[]
		incoming[key].append(cell)
	for key in incoming:
		incoming[key].sort_custom(func(a,b):return float(a.get("riverFlow",0))>float(b.get("riverFlow",0)))
	for cell in sources:
		var key:=index_of(cell);var branches: Array=incoming.get(key,[])
		var up: Dictionary=branches[0] if not branches.is_empty() else {}
		var down:=cell_at(cells,cell.riverTo)
		if not cell.get("ford",false) and not cell.get("bridge",false) and not up.is_empty() and down.get("land",false) and branches.size()==1:
			var before:=center(up);var here:=center(cell);var after:=center(down)
			var diff:=after-before;var length:=maxf(diff.length(),0.0001)
			var low:=1.0-smooth(((float(up.h)+float(cell.h)+float(down.h))/3.0-18.0)/14.0)
			var bend: float=(noise_smooth(here.x/145.0+13.7,here.y/145.0+5.1,seed)-0.5)*2.0
			var shift:=7.5*low*bend
			anchors[key]=here+Vector2(clampf((before.x+after.x-2*here.x)*0.18-diff.y/length*shift,-13,13),clampf((before.y+after.y-2*here.y)*0.18+diff.x/length*shift,-13,13))
		if branches.size()<2 or not cell.land or not down.get("land",false) or cell.get("ford",false) or cell.get("bridge",false) or float(cell.h)<4:continue
		var random:=sin((float(cell.c)+seed*0.013)*127.1+(float(cell.r)-seed*0.017)*311.7)*43758.5453
		var chance:=random-floorf(random)
		if chance>=0.28:continue
		var flow:=float(cell.get("riverFlow",0))
		lakes[key]=clampf(12+sqrt(flow)*(0.48+chance*0.7),14,32)
	for pass_index in 3:
		var next:=anchors.duplicate()
		for cell in sources:
			var key:=index_of(cell)
			if not anchors.has(key):continue
			var up: Dictionary=incoming[key][0];var down:=cell_at(cells,cell.riverTo)
			if not down.get("land",false):continue
			var a:=point(up,anchors);var p: Vector2=anchors[key];var b:=point(down,anchors);var origin:=center(cell)
			next[key]=origin+Vector2(clampf((a.x+2*p.x+b.x)/4.0-origin.x,-13,13),clampf((a.y+2*p.y+b.y)/4.0-origin.y,-13,13))
		anchors=next
	return {"incoming":incoming,"sources":sources,"anchors":anchors,"lakes":lakes}

static func mouth(cells: Array,heights: PackedFloat32Array,cell: Dictionary,target: Dictionary) -> Vector2:
	if target.get("land",false):return center(target)
	var a:=center(cell);var b:=center(target);var lo:=0.0;var hi:=1.0
	for i in 12:
		var t: float=(lo+hi)/2.0;var p:=a.lerp(b,t)
		if Visual.atlas(heights,p.x,p.y)>0.3:lo=t
		else:hi=t
	var t:=minf(1.0,(lo+hi)/2.0+12.0/maxf(0.0001,a.distance_to(b)))
	return a.lerp(b,t)

static func tangent(cells: Array,heights: PackedFloat32Array,cell: Dictionary,graph: Dictionary,previous: Dictionary={}) -> Vector2:
	var branches: Array=graph.incoming.get(index_of(cell),[])
	var up: Dictionary=previous if not previous.is_empty() else branches[0] if not branches.is_empty() else {}
	var down:=cell_at(cells,cell.riverTo) if cell.get("riverTo") is Dictionary else {}
	var here:=point(cell,graph.anchors)
	var prior:=point(up,graph.anchors) if not up.is_empty() else here
	var next:=point(down,graph.anchors) if not down.is_empty() and down.get("land",false) else mouth(cells,heights,cell,down) if not down.is_empty() else here
	var diff:=next-prior if not up.is_empty() and not down.is_empty() else next-here if not down.is_empty() else here-prior if not up.is_empty() else Vector2.RIGHT
	return diff.normalized() if diff.length_squared()>0.000001 else Vector2.RIGHT

static func hermite(a: Vector2,b: Vector2,m0: Vector2,m1: Vector2,t: float) -> Vector2:
	var t2:=t*t;var t3:=t2*t
	return (2*t3-3*t2+1)*a+(t3-2*t2+t)*m0+(-2*t3+3*t2)*b+(t3-t2)*m1

static func sample(cells: Array,heights: PackedFloat32Array,cell: Dictionary,graph: Dictionary,count:=12) -> Array:
	if not cell.get("riverTo") is Dictionary:return []
	if not graph.has("sample_cache"):graph.sample_cache={}
	var cache_key:=str(index_of(cell))+":"+str(count)
	if graph.sample_cache.has(cache_key):return graph.sample_cache[cache_key]
	var target:=cell_at(cells,cell.riverTo)
	if target.is_empty():return []
	var a:=point(cell,graph.anchors)
	var b:=point(target,graph.anchors) if target.land else mouth(cells,heights,cell,target)
	var length:=maxf(a.distance_to(b),0.0001)
	var m0:=tangent(cells,heights,cell,graph)*length;var m1:=tangent(cells,heights,target,graph,cell)*length
	var width0:=maxf(1.5,float(cell.get("riverWidth",3)))
	var width1:=maxf(width0,float(target.get("riverWidth",width0*1.18)))
	var lake0:=float(graph.lakes.get(index_of(cell),0));var lake1:=float(graph.lakes.get(index_of(target),0)) if target.land else 0.0
	var result: Array=[]
	for i in range(count+1):
		var t:=float(i)/count;var p:=hermite(a,b,m0,m1,t)
		var width:=lerpf(width0,width1,smooth(t))
		if lake0>0:width=maxf(width,width0+(lake0-width0)*(1.0-smooth(t/0.53)))
		if lake1>0:width=maxf(width,width1+(lake1-width1)*(1.0-smooth((1.0-t)/0.53)))
		var estuary:=1.0-smooth((Visual.smooth_atlas(heights,p.x,p.y)-0.3)/6.0)
		width*=1.0+1.5*estuary
		var opacity:=1.0 if target.land else 1.0-smooth((t-0.65)/0.35)
		result.append({"x":p.x,"z":p.y,"width":width,"opacity":opacity})
	graph.sample_cache[cache_key]=result
	return result

static func bank_vertex(p: Dictionary,side: Vector2,factor: float,terrain_samples: Variant,heights: PackedFloat32Array) -> Vector3:
	var x:=float(p.x)+side.x*float(p.width)*factor;var z:=float(p.z)+side.y*float(p.width)*factor
	var y:=Terrain.mesh_elevation(terrain_samples,x,z) if not terrain_samples.is_empty() else Terrain.elevation(heights,x,z)
	return Vector3((x-Grid.WORLD_CENTER_X)*WORLD_SCALE,y+0.075,(z-Grid.WORLD_CENTER_Z)*WORLD_SCALE)

static func bank_strip(surface: SurfaceTool,points: Array,colors: Array) -> void:
	for j in [0,1,2,2,1,3]:
		surface.set_normal(Vector3.UP);surface.set_color(colors[j]);surface.add_vertex(points[j])

static func add_surface(mesh: ArrayMesh,cells: Array,heights: PackedFloat32Array,seed: int,graph: Dictionary={}) -> void:
	if graph.is_empty():graph=prepare(cells,seed)
	var terrain_samples: Variant=mesh.get_meta("atlas_sampler",mesh.get_meta("atlas_heights",PackedFloat32Array()))
	var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	var banks:=SurfaceTool.new();banks.begin(Mesh.PRIMITIVE_TRIANGLES)
	var total:=0
	for cell in graph.sources:
		var points:=sample(cells,heights,cell,graph,12)
		for i in range(points.size()-1):
			var a: Dictionary=points[i];var b: Dictionary=points[i+1]
			var direction:=Vector2(float(b.x)-float(a.x),float(b.z)-float(a.z)).normalized()
			if direction.length_squared()<0.000001:continue
			# Adjacent strips share their corner positions even on sharp bends.
			var before: Dictionary=points[maxi(0,i-1)];var after: Dictionary=points[mini(points.size()-1,i+2)]
			var tangent_a:=Vector2(float(b.x)-float(before.x),float(b.z)-float(before.z)).normalized()
			var tangent_b:=Vector2(float(after.x)-float(a.x),float(after.z)-float(a.z)).normalized()
			if tangent_a.length_squared()<0.000001:tangent_a=direction
			if tangent_b.length_squared()<0.000001:tangent_b=direction
			var side_a:=Vector2(-tangent_a.y,tangent_a.x);var side_b:=Vector2(-tangent_b.y,tangent_b.x)
			var fade_a:=smooth((Terrain.height_at(heights,a.x,a.z)-0.3)/2.2)
			var fade_b:=smooth((Terrain.height_at(heights,b.x,b.z)-0.3)/2.2)
			for side in [-1.0,1.0]:
				var sa2: Vector2=side_a*float(side);var sb2: Vector2=side_b*float(side)
				var inner_a:=bank_vertex(a,sa2,1.0,terrain_samples,heights);var inner_b:=bank_vertex(b,sb2,1.0,terrain_samples,heights)
				var wet_a:=bank_vertex(a,sa2,1.4,terrain_samples,heights);var wet_b:=bank_vertex(b,sb2,1.4,terrain_samples,heights)
				var outer_a:=bank_vertex(a,sa2,2.18,terrain_samples,heights);var outer_b:=bank_vertex(b,sb2,2.18,terrain_samples,heights)
				bank_strip(banks,[inner_a,wet_a,inner_b,wet_b],[Color(0.35,0.32,0.25,0.8*fade_a),Color(0.43,0.42,0.30,0.20*fade_a),Color(0.35,0.32,0.25,0.8*fade_b),Color(0.43,0.42,0.30,0.20*fade_b)])
				bank_strip(banks,[wet_a,outer_a,wet_b,outer_b],[Color(0.52,0.49,0.39,0.30*fade_a),Color(0.66,0.62,0.50,0),Color(0.52,0.49,0.39,0.30*fade_b),Color(0.66,0.62,0.50,0)])
			var pa:=Vector3((float(a.x)-Grid.WORLD_CENTER_X)*WORLD_SCALE,0,(float(a.z)-Grid.WORLD_CENTER_Z)*WORLD_SCALE)
			var pb:=Vector3((float(b.x)-Grid.WORLD_CENTER_X)*WORLD_SCALE,0,(float(b.z)-Grid.WORLD_CENTER_Z)*WORLD_SCALE)
			var sa:=Vector3(side_a.x,0,side_a.y)*float(a.width)*WORLD_SCALE
			var sb:=Vector3(side_b.x,0,side_b.y)*float(b.width)*WORLD_SCALE
			var left_a:=pa-sa;var right_a:=pa+sa;var left_b:=pb-sb;var right_b:=pb+sb
			if not terrain_samples.is_empty():
				left_a.y=Terrain.mesh_elevation(terrain_samples,float(a.x)-side_a.x*float(a.width),float(a.z)-side_a.y*float(a.width))+0.09
				right_a.y=Terrain.mesh_elevation(terrain_samples,float(a.x)+side_a.x*float(a.width),float(a.z)+side_a.y*float(a.width))+0.09
				left_b.y=Terrain.mesh_elevation(terrain_samples,float(b.x)-side_b.x*float(b.width),float(b.z)-side_b.y*float(b.width))+0.09
				right_b.y=Terrain.mesh_elevation(terrain_samples,float(b.x)+side_b.x*float(b.width),float(b.z)+side_b.y*float(b.width))+0.09
			else:
				left_a.y=Terrain.elevation(heights,a.x,a.z)+0.09;right_a.y=left_a.y
				left_b.y=Terrain.elevation(heights,b.x,b.z)+0.09;right_b.y=left_b.y
			var vertices: Array=[left_a,right_a,left_b,left_b,right_a,right_b]
			var uvs: Array=[Vector2(0,0),Vector2(1,0),Vector2(0,1),Vector2(0,1),Vector2(1,0),Vector2(1,1)]
			var alpha: Array=[a.opacity,a.opacity,b.opacity,b.opacity,a.opacity,b.opacity]
			for j in vertices.size():
				surface.set_color(Color(1,1,1,float(alpha[j])));surface.set_normal(Vector3.UP);surface.set_uv(uvs[j]);surface.add_vertex(vertices[j]);total+=1
	if total>0:surface.commit(mesh);banks.commit(mesh)
