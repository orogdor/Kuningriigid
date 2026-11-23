class_name VisualRiver
extends RefCounted

const Grid=preload("res://scripts/campaign_grid.gd")
const Rivers=preload("res://scripts/world_rivers.gd")
const Visual=preload("res://scripts/visual_elevation.gd")
const Terrain=preload("res://scripts/world_terrain.gd")

static func segments(cells: Array,heights: PackedFloat32Array,c: int,r: int,graph: Dictionary) -> Array:
	var result: Array=[]
	if graph.is_empty():return result
	for dr in range(-2,3):
		for dc in range(-2,3):
			var x:=c+dc;var z:=r+dr
			if x<0 or z<0 or x>=Grid.COLS or z>=Grid.ROWS:continue
			var source: Dictionary=cells[z*Grid.COLS+x]
			if not source.get("river",false) or not source.get("riverTo") is Dictionary:continue
			var points:=Rivers.sample(cells,heights,source,graph,12)
			if points.size()<2:continue
			var center:=Grid.center(x,z);var first: Dictionary=points[0];var second: Dictionary=points[1]
			var tangent:=Vector2(float(second.x)-float(first.x),float(second.z)-float(first.z)).normalized()
			var ford:=bool(source.get("ford",false)) and not bool(source.get("bridge",false))
			var water:=PackedFloat32Array()
			for point in points:water.append(maxf(0.86,Visual.smooth_atlas(heights,float(point.x),float(point.z))-(2.4+minf(2.1,float(point.width)*0.20))))
			for i in range(1,points.size()):
				var a: Dictionary=points[i-1];var b: Dictionary=points[i]
				result.append({"a":Vector2(float(a.x),float(a.z)),"b":Vector2(float(b.x),float(b.z)),"wa":float(a.width),"wb":float(b.width),"ha":water[i-1],"hb":water[i],"ford":ford,"center":center,"tangent":tangent})
	return result

static func nearest(x: float,z: float,segments: Array) -> Dictionary:
	var point:=Vector2(x,z);var nearest:=INF;var width:=0.0;var water:=0.86;var ford_strength:=0.0
	for segment in segments:
		var a: Vector2=segment.a;var b: Vector2=segment.b;var delta:=b-a
		var t:=clampf((point-a).dot(delta)/maxf(0.0000001,delta.length_squared()),0.0,1.0)
		var distance:=point.distance_to(a+delta*t);var w:=lerpf(float(segment.wa),float(segment.wb),t)
		if segment.ford and distance<=w+2.0:
			var offset: Vector2=point-segment.center;var tangent: Vector2=segment.tangent
			var along:=absf(offset.dot(tangent));var across:=absf(offset.dot(Vector2(-tangent.y,tangent.x)))
			if across<=w+1.5:ford_strength=maxf(ford_strength,1.0-Visual.smooth((along-5.5)/5.0))
		if distance-w<nearest-width:
			nearest=distance;width=w;water=lerpf(float(segment.ha),float(segment.hb),t)
	return {"distance":nearest,"width":width,"waterHeight":water,"fordStrength":ford_strength}

static func mouth_info(cells: Array,heights: PackedFloat32Array,source: Dictionary,seed: int,graph: Dictionary) -> Dictionary:
	if not graph.has("visual_mouth_cache"):graph.visual_mouth_cache={}
	var key:=Rivers.index_of(source)
	if graph.visual_mouth_cache.has(key):return graph.visual_mouth_cache[key]
	var points:=Rivers.sample(cells,heights,source,graph,12).duplicate()
	var incoming: Array=graph.incoming.get(key,[])
	if not incoming.is_empty():
		var before:=Rivers.sample(cells,heights,incoming[0],graph,12).duplicate()
		if not before.is_empty():before.pop_back();before.append_array(points);points=before
	if points.size()<2:return {}
	var ci:=1
	for i in points.size():
		if Visual.base(heights,float(points[i].x),float(points[i].z),seed)<=0.72:ci=maxi(1,i);break
	var coast: Dictionary=points[ci];var previous: Dictionary=points[ci-1]
	var dx:=float(coast.x)-float(previous.x);var dz:=float(coast.z)-float(previous.z);var length:=maxf(0.000001,sqrt(dx*dx+dz*dz))
	var nx:=-dz/length;var nz:=dx/length;var slope:=0.0
	for offset in [float(coast.width)+8.0,float(coast.width)+20.0,-float(coast.width)-8.0,-float(coast.width)-20.0]:
		var x: float=float(coast.x)+nx*float(offset);var z: float=float(coast.z)+nz*float(offset)
		var gx:=Visual.base(heights,x+4,z,seed)-Visual.base(heights,x-4,z,seed)
		var gz:=Visual.base(heights,x,z+4,seed)-Visual.base(heights,x,z-4,seed)
		slope+=sqrt(gx*gx+gz*gz)/8.0
	slope=clampf(slope/4.0,0.06,0.8)
	var k:=clampf(float(coast.width)*2.0+28.0,32.0,80.0);var max_width:=0.0
	var min_x:=INF;var max_x:=-INF;var min_z:=INF;var max_z:=-INF
	for point in points:
		max_width=maxf(max_width,float(point.width));min_x=minf(min_x,float(point.x));max_x=maxf(max_x,float(point.x));min_z=minf(min_z,float(point.z));max_z=maxf(max_z,float(point.z))
	var reach:=max_width+k+4.0
	var result:={"points":points,"k":k,"slope":slope,"min_x":min_x-reach,"max_x":max_x+reach,"min_z":min_z-reach,"max_z":max_z+reach}
	graph.visual_mouth_cache[key]=result
	return result

static func mouths_near(cells: Array,heights: PackedFloat32Array,c: int,r: int,seed: int,graph: Dictionary) -> Array:
	var result: Array=[]
	if graph.is_empty():return result
	for dz in range(-5,6):
		for dx in range(-5,6):
			var x:=c+dx;var z:=r+dz
			if x<0 or z<0 or x>=Grid.COLS or z>=Grid.ROWS:continue
			var source: Dictionary=cells[z*Grid.COLS+x]
			if not source.get("river",false) or not source.get("riverTo") is Dictionary:continue
			var target:=Rivers.cell_at(cells,source.riverTo)
			if target.is_empty() or bool(target.land):continue
			var mouth:=mouth_info(cells,heights,source,seed,graph)
			if not mouth.is_empty():result.append(mouth)
	return result

static func flare_at(x: float,z: float,base: float,mouths: Array) -> Dictionary:
	var lift:=1.0-Visual.smooth((base-2.4)/2.3)
	if lift<=0:return {"strength":0.0,"ground":base}
	var drop:=0.0
	for mouth in mouths:
		if x<float(mouth.min_x) or x>float(mouth.max_x) or z<float(mouth.min_z) or z>float(mouth.max_z):continue
		var bank:=INF;var points: Array=mouth.points
		for i in range(1,points.size()):
			var a: Dictionary=points[i-1];var b: Dictionary=points[i]
			var dx:=float(b.x)-float(a.x);var dz:=float(b.z)-float(a.z);var len:=maxf(0.000001,dx*dx+dz*dz)
			var t:=clampf(((x-float(a.x))*dx+(z-float(a.z))*dz)/len,0,1)
			var px:=float(a.x)+dx*t-x;var pz:=float(a.z)+dz*t-z
			bank=minf(bank,sqrt(px*px+pz*pz)-lerpf(float(a.width),float(b.width),t))
		var k:=float(mouth.k)
		if bank>=k:continue
		var shore:=(base-0.72)/float(mouth.slope);var close:=1.0-Visual.smooth((maxf(bank,shore)-0.45*k)/(0.45*k))
		if close>0:
			var h:=maxf(k-absf(bank-shore),0.0)/k
			drop=maxf(drop,h*h*k*0.25*close*float(mouth.slope))
	if drop<=0:return {"strength":0.0,"ground":base}
	return {"strength":Visual.smooth(drop/1.5)*lift,"ground":maxf(base-drop*lift,minf(base,0.72-1.2))}

static func shore_height(heights: PackedFloat32Array,x: float,z: float,seed: int,base: float,near: Dictionary,flare: Dictionary={}) -> float:
	var coastal:=1.0-Visual.smooth(absf(base-0.72)/4.0)
	if coastal<=0.0:return base
	var smoothed:=base
	if not near.is_empty() and is_finite(float(near.distance)):
		var corridor:=1.0-Visual.smooth((float(near.distance)-float(near.width)-6.0)/18.0)
		if corridor>0.0:
			var weights:=[1.0,2.0,1.0];var average:=0.0
			for j in range(-1,2):
				for i in range(-1,2):average+=Visual.base(heights,x+i*5.0,z+j*5.0,seed)*weights[i+1]*weights[j+1]/16.0
			smoothed=base+(average-base)*coastal*corridor*0.65
	return minf(smoothed,smoothed+float(flare.ground)-base) if not flare.is_empty() else smoothed

static func height(heights: PackedFloat32Array,x: float,z: float,seed: int,river_segments: Array,cached_base:=NAN,cached_near: Dictionary={},cached_shore:=NAN,flare: Dictionary={}) -> float:
	var base:=cached_base if is_finite(cached_base) else Visual.base(heights,x,z,seed)
	if river_segments.is_empty():return shore_height(heights,x,z,seed,base,{},flare) if not flare.is_empty() and absf(base-0.72)<5.0 else base
	var near:=cached_near if not cached_near.is_empty() else nearest(x,z,river_segments);var d:=float(near.distance);var w:=float(near.width)
	if not is_finite(d) or w<=0.05:return shore_height(heights,x,z,seed,base,near,flare) if not flare.is_empty() and absf(base-0.72)<5.0 else base
	var inner:=w*1.04;var outer:=maxf(inner+3.5,w*1.8+3.0)
	var flare_strength:=float(flare.get("strength",0.0))
	if (d<w+30.0 or flare_strength>0.0) and absf(base-0.72)<5.0:base=cached_shore if is_finite(cached_shore) else shore_height(heights,x,z,seed,base,near,flare)
	if d>=outer+18.0:return base
	var atlas:=Visual.smooth_atlas(heights,x,z)
	var level:=0.78+(float(near.waterHeight)-0.78)*Visual.smooth((Visual.atlas(heights,x,z)-0.30)/3.7)
	var rim:=level+0.60;var reach:=outer+18.0;var land:=Visual.smooth((atlas-1.2)/4.0)*(1.0-flare_strength)
	if base<rim and d<reach:base+=(rim-base)*(1.0-Visual.smooth((d-outer)/(reach-outer)))*land
	if d<=w:
		var depth:=2.2+maxf(0.0,1.0-d/maxf(0.1,inner))*1.4
		var ford_depth:=lerpf(depth,0.42,float(near.fordStrength))
		var visible_depth:=lerpf(ford_depth,0.06,Visual.smooth((d-w*0.30)/maxf(0.01,w*0.70)))
		var coastal:=Visual.smooth((atlas+0.4)/2.4)
		return lerpf(base,minf(base,level-visible_depth),coastal)
	if d<outer:
		var t:=Visual.smooth((d-w)/(outer-w));var bank:=lerpf(level-0.06,maxf(base,level+0.10),t)
		var coastal:=Visual.smooth((atlas+0.4)/2.4);var shaped:=lerpf(minf(base,bank),bank,land)
		return lerpf(base,shaped,coastal)
	return base

static func color_heights(cells: Array,heights: PackedFloat32Array,c: int,r: int,seed: int,graph: Dictionary) -> PackedVector4Array:
	var river_segments:=segments(cells,heights,c,r,graph);var mouths:=mouths_near(cells,heights,c,r,seed,graph);var center:=Grid.center(c,r)
	var values:=PackedVector4Array();values.resize(17*17)
	for j in 17:
		for i in 17:
			var x: float=center.x+(float(i)/16.0-0.5)*50.0
			var z: float=center.y+(float(j)/16.0-0.5)*50.0
			var sea_base:=Visual.base(heights,x,z,seed)
			var near:=nearest(x,z,river_segments) if not river_segments.is_empty() else {}
			var flare:=flare_at(x,z,sea_base,mouths) if not mouths.is_empty() and absf(sea_base-0.72)<5.0 else {}
			var shore:=shore_height(heights,x,z,seed,sea_base,near,flare) if not near.is_empty() or not flare.is_empty() else sea_base
			var elevation:=height(heights,x,z,seed,river_segments,sea_base,near,shore,flare)
			var color_height: float=(elevation-0.7)*0.3
			var wobble: float=(Terrain.seeded_smooth(x/9.0+41.3,z/9.0+7.9,seed)-0.5)*0.45
			var geometry_height:=color_height+maxf(0.0,elevation-10.0)*0.9*Visual.mountain_mask(cells,x,z,seed) if elevation>10.0 else color_height
			var sea_height:=color_height
			if not river_segments.is_empty() or not mouths.is_empty():sea_height=(shore-0.7)*0.3
			values[j*17+i]=Vector4(color_height,wobble,geometry_height,sea_height)
	return values
