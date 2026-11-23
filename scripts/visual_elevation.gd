class_name VisualElevation
extends RefCounted

const Grid=preload("res://scripts/campaign_grid.gd")
const Geography=preload("res://scripts/world_geography.gd")
const Detail=preload("res://scripts/detail_terrain.gd")

static func smooth(value: float) -> float:
	var t:=clampf(value,0.0,1.0)
	return t*t*(3.0-2.0*t)

static func atlas(heights: PackedFloat32Array,x: float,z: float) -> float:
	if not is_finite(x) or not is_finite(z):return -15.0
	var wx: float=(Detail.value_noise(x/31+3.1,z/31+7.7)-0.5)*15+(Detail.value_noise(x/11+11.3,z/11+2.9)-0.5)*7
	var wz: float=(Detail.value_noise(x/31+19.4,z/31+5.2)-0.5)*15+(Detail.value_noise(x/11+4.6,z/11+17.1)-0.5)*7
	var fx: float=(x+wx-Grid.ORIGIN_X)/50.0-0.5;var fz: float=(z+wz-Grid.ORIGIN_Z)/50.0-0.5
	var c:=floori(fx);var r:=floori(fz);var u:=smooth(fx-c);var v:=smooth(fz-r)
	return (sample_at(heights,c,r)*(1-u)+sample_at(heights,c+1,r)*u)*(1-v)+(sample_at(heights,c,r+1)*(1-u)+sample_at(heights,c+1,r+1)*u)*v

static func spline(t: float) -> PackedFloat64Array:
	var t2:=t*t;var t3:=t2*t
	return PackedFloat64Array([(1-3*t+3*t2-t3)/6.0,(4-6*t2+3*t3)/6.0,(1+3*t+3*t2-3*t3)/6.0,t3/6.0])

static func smooth_atlas(heights: PackedFloat32Array,x: float,z: float) -> float:
	if not is_finite(x) or not is_finite(z):return -15.0
	var fx: float=(x-Grid.ORIGIN_X)/50.0-0.5;var fz: float=(z-Grid.ORIGIN_Z)/50.0-0.5
	var c:=floori(fx);var r:=floori(fz);var wu:=spline(fx-c);var wv:=spline(fz-r);var h:=0.0
	for j in 4:
		var row:=0.0
		for i in 4:row+=wu[i]*sample_at(heights,c-1+i,r-1+j)
		h+=wv[j]*row
	var original:=atlas(heights,x,z)
	return lerpf(original,h,smooth((absf(original)-1.5)/4.0))

static func base(heights: PackedFloat32Array,x: float,z: float,seed: int) -> float:
	var h:=smooth_atlas(heights,x,z)
	var wx:=x+(seeded_smooth(x/97+11.3,z/97+4.1,seed)-0.5)*70.0
	var wz:=z+(seeded_smooth(x/97+31.7,z/97+52.9,seed)-0.5)*70.0
	var lowland:=smooth((h-2.5)/5.0)*(1.0-smooth((h-22.0)/14.0))
	var roll:=((seeded_smooth(wx/150+3.1,wz/150+7.7,seed)-0.5)*2.6+(seeded_smooth(wx/52+19,wz/52+23,seed)-0.5)*1.1)*lowland
	var steep:=smooth((h-18.0)/19.0);var relief:=0.0
	if steep>0:
		var r1:=pow(1.0-absf(2.0*seeded_smooth(wx/165+71,wz/165+13,seed)-1.0),2)
		var r2:=pow(1.0-absf(2.0*seeded_smooth(wx/72+5,wz/72+91,seed)-1.0),2)
		var r3:=pow(1.0-absf(2.0*seeded_smooth(wx/31+43,wz/31+27,seed)-1.0),2)
		var scarp:=smooth((r2-0.55)/0.18)*(6.0+10.0*r1)
		relief=steep*(18.0+50.0*r1+30.0*r2*(0.35+0.65*r1)+9.0*r3*(0.4+0.6*r2)+scarp)
	var sub:=maxf(0.0,0.72-h);var ocean_floor:=2.5*smooth(sub/7.0)+sub*0.10 if sub>0 else 0.0
	return h+roll+relief-ocean_floor

static func mountain_at(cells: Array,c: int,r: int) -> float:
	if c<0 or r<0 or c>=Grid.COLS or r>=Grid.ROWS:return 0.0
	var cell: Dictionary=cells[r*Grid.COLS+c]
	return 1.0 if bool(cell.land) and bool(cell.get("mountain",false)) else 0.0

static func mountain_mask(cells: Array,x: float,z: float,seed: int) -> float:
	var oc:=floori((x-Grid.ORIGIN_X)/50.0);var orow:=floori((z-Grid.ORIGIN_Z)/50.0)
	if mountain_at(cells,oc,orow)==0.0:return 0.0
	var wx:=x+(seeded_smooth(x/37+3.7,z/37+8.1,seed)-0.5)*30+(seeded_smooth(x/11+51,z/11+17,seed)-0.5)*8
	var wz:=z+(seeded_smooth(x/37+61.3,z/37+2.9,seed)-0.5)*30+(seeded_smooth(x/11+9,z/11+77,seed)-0.5)*8
	var u: float=(wx-Grid.ORIGIN_X)/50.0-0.5;var v: float=(wz-Grid.ORIGIN_Z)/50.0-0.5
	var c:=floori(u);var r:=floori(v);var fu:=smooth(u-c);var fv:=smooth(v-r)
	var f:=lerpf(lerpf(mountain_at(cells,c,r),mountain_at(cells,c+1,r),fu),lerpf(mountain_at(cells,c,r+1),mountain_at(cells,c+1,r+1),fu),fv)
	var distance:=INF
	for dr in range(-1,2):
		for dc in range(-1,2):
			var cc:=oc+dc;var rr:=orow+dr
			if mountain_at(cells,cc,rr)>0.0:continue
			var left: float=Grid.ORIGIN_X+cc*50.0;var top: float=Grid.ORIGIN_Z+rr*50.0
			distance=minf(distance,Vector2(maxf(maxf(left-x,0.0),x-left-50.0),maxf(maxf(top-z,0.0),z-top-50.0)).length())
	return smooth((f-0.58)/0.42)*smooth(distance/7.0)

static func sample_at(heights: PackedFloat32Array,c: int,r: int) -> float:
	if c<0 or c>=Grid.COLS or r<0 or r>=Grid.ROWS:return -15.0
	return heights[r*Grid.COLS+c]

static func seeded_smooth(x: float,z: float,seed: int) -> float:
	var i:=floori(x);var j:=floori(z);var u:=x-i;var v:=z-j
	u=u*u*(3.0-2.0*u);v=v*v*(3.0-2.0*v)
	return (Geography.noise(i,j,seed)*(1.0-u)+Geography.noise(i+1,j,seed)*u)*(1.0-v)+(Geography.noise(i,j+1,seed)*(1.0-u)+Geography.noise(i+1,j+1,seed)*u)*v
