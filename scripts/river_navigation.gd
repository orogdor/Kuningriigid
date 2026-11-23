extends RefCounted

const BUCKET:=8.0
var buckets: Dictionary={}
var bridge:=false

func setup(segments: Array,has_bridge: bool) -> void:
	bridge=has_bridge
	for segment in segments:
		var a_local: Vector2=segment[0];var b_local: Vector2=segment[1]
		var a:=Vector2(a_local.x/4.5,a_local.y/3.9);var b:=Vector2(b_local.x/4.5,b_local.y/3.9)
		var wa:=float(segment[2])/4.2;var wb:=float(segment[3])/4.2
		# Placement also looks for a river up to six world units from its bank.
		var radius:=maxf(wa,wb)+6.5
		var item: Array=[a,b,wa,wb,segment[4] if segment.size()>4 else {}]
		for z in range(floori((minf(a.y,b.y)-radius)/BUCKET),floori((maxf(a.y,b.y)+radius)/BUCKET)+1):
			for x in range(floori((minf(a.x,b.x)-radius)/BUCKET),floori((maxf(a.x,b.x)+radius)/BUCKET)+1):
				var key:=Vector2i(x,z)
				if not buckets.has(key):buckets[key]=[]
				buckets[key].append(item)

func nearest(x: float,z: float) -> Dictionary:
	var p:=Vector2(x/4.5,z/3.9);var key:=Vector2i(floori(p.x/BUCKET),floori(p.y/BUCKET))
	var best:=INF;var result: Dictionary={"distance":INF,"width":0.0}
	for segment in buckets.get(key,[]):
		var a: Vector2=segment[0];var b: Vector2=segment[1];var line:=b-a
		var t:=clampf((p-a).dot(line)/maxf(line.length_squared(),0.00001),0,1)
		var distance:=p.distance_to(a+line*t);var width:=lerpf(float(segment[2]),float(segment[3]),t)
		if distance-width<best:best=distance-width;result={"distance":distance,"width":width}
	return result

func passable(x: float,z: float) -> bool:
	var p:=Vector2(x/4.5,z/3.9);var key:=Vector2i(floori(p.x/BUCKET),floori(p.y/BUCKET))
	var closest:=INF;var closest_width:=0.0;var ford_strength:=0.0
	for segment in buckets.get(key,[]):
		var a: Vector2=segment[0];var b: Vector2=segment[1];var line:=b-a
		var t:=clampf((p-a).dot(line)/maxf(line.length_squared(),0.00001),0,1)
		var distance:=p.distance_to(a+line*t);var width:=lerpf(float(segment[2]),float(segment[3]),t)
		if distance-width<closest-closest_width:closest=distance;closest_width=width
		var ford: Dictionary=segment[4]
		if not ford.is_empty() and distance<=width+2:
			var offset: Vector2=p-ford.center;var tangent: Vector2=ford.tangent
			var along:=absf(offset.dot(tangent));var across:=absf(offset.dot(Vector2(-tangent.y,tangent.x)))
			if across<=width+1.5:
				var f:=clampf((along-5.5)/5.0,0,1);ford_strength=maxf(ford_strength,1.0-f*f*(3.0-2.0*f))
	return closest>=closest_width*0.97 or ford_strength>=0.75 or (bridge and closest<closest_width*1.15)
