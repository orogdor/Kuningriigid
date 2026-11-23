class_name TectonicWorld
extends RefCounted
# Port in progress of world-tectonic-v248.js, source revision 2d9ff399.
const NoiseUtil = preload("res://scripts/tectonic_noise.gd")
const Heap = preload("res://scripts/min_priority_queue.gd")
const COLS := 220
const ROWS := 165
const N := COLS * ROWS
const ASPECT := float(COLS) / ROWS
const DIR4 := [Vector2i(1,0), Vector2i(-1,0), Vector2i(0,1), Vector2i(0,-1)]
const DIR8 := [Vector2i(1,0), Vector2i(-1,0), Vector2i(0,1), Vector2i(0,-1), Vector2i(1,1), Vector2i(1,-1), Vector2i(-1,1), Vector2i(-1,-1)]
var seed: int
var generator: RefCounted
var noise_seed: int
var warp_seed: int
var detail_seed: int

func _init(seed_value: int) -> void:
	seed = seed_value & 0xffffffff
	generator = NoiseUtil.new(seed)
	noise_seed = seed
	warp_seed = (seed ^ 0x5bd1e995) & 0xffffffff
	detail_seed = (seed ^ 0x27d4eb2d) & 0xffffffff

static func idx(c: int, r: int) -> int:
	return r * COLS + c

static func floats(value := 0.0) -> PackedFloat32Array:
	var result := PackedFloat32Array()
	result.resize(N)
	result.fill(value)
	return result

static func ints(value := 0) -> PackedInt32Array:
	var result := PackedInt32Array()
	result.resize(N)
	result.fill(value)
	return result

static func blur(source: PackedFloat32Array, times: int) -> PackedFloat32Array:
	var a := source.duplicate()
	var b := floats()
	for pass_index in times:
		for r in ROWS:
			for c in COLS:
				var total: float = a[idx(c,r)] * 4.0
				var weight := 4.0
				for d in DIR8:
					var x: int = c + d.x
					var y: int = r + d.y
					if x < 0 or y < 0 or x >= COLS or y >= ROWS: continue
					var k := 1.0 if d.x != 0 and d.y != 0 else 2.0
					total += a[idx(x,y)] * k
					weight += k
				b[idx(c,r)] = total / weight
		var previous := a
		a = b
		b = previous
	return a

static func percentile(values: PackedFloat32Array, p: float) -> float:
	var sorted := values.duplicate()
	sorted.sort()
	return sorted[clampi(floori(p * sorted.size()),0,sorted.size()-1)]

func create_plates() -> Dictionary:
	var count := 9 + floori(generator.random_value() * 6)
	var plates: Array = []
	for i in count:
		var angle: float = generator.random_value() * TAU
		var speed: float = 0.4 + generator.random_value() * 0.6
		plates.append({"x": 0.06 + generator.random_value() * 0.88, "y": 0.08 + generator.random_value() * 0.84, "vx": cos(angle) * speed, "vy": sin(angle) * speed, "continental": false, "weight": 0.85 + generator.random_value() * 0.4})
	var plate_of := ints(-1)
	var grow_cost := floats(INF)
	var heap := Heap.new()
	for i in plates.size():
		var c := mini(COLS-1, floori(plates[i].x * COLS))
		var r := mini(ROWS-1, floori(plates[i].y * ROWS))
		var j := idx(c,r)
		grow_cost[j] = 0.0
		heap.push(0.0, j * 32 + i)
	while heap.size() > 0:
		var key: int = heap.pop()
		var j := key >> 5
		var plate := key & 31
		if plate_of[j] >= 0: continue
		plate_of[j] = plate
		var c := j % COLS
		var r := floori(float(j) / COLS)
		for d in DIR8:
			var x: int = c + d.x
			var y: int = r + d.y
			if x < 0 or y < 0 or x >= COLS or y >= ROWS: continue
			var k := idx(x,y)
			if plate_of[k] >= 0: continue
			var w := NoiseUtil.noise(float(x)/COLS*6*ASPECT, float(y)/ROWS*6, warp_seed, 4)
			var step: float = (1.414 if d.x != 0 and d.y != 0 else 1.0) * (0.12 + pow(w,2)*2.6) * plates[plate].weight
			var cost: float = grow_cost[j] + step
			if cost < grow_cost[k]:
				grow_cost[k] = cost
				heap.push(cost,k*32+plate)
	var area: Array = []
	var touch: Array = []
	for i in plates.size():
		area.append(0)
		touch.append({})
	for r in ROWS:
		for c in COLS:
			var a: int = plate_of[idx(c,r)]
			area[a] += 1
			if c+1 < COLS:
				var b: int = plate_of[idx(c+1,r)]
				if b != a: touch[a][b] = true; touch[b][a] = true
			if r+1 < ROWS:
				var b: int = plate_of[idx(c,r+1)]
				if b != a: touch[a][b] = true; touch[b][a] = true
	var allow_fuse: bool = generator.random_value() < 0.5
	var land_area := 0
	var landmasses := 0
	var pool: Array = []
	for i in plates.size():
		var p: Dictionary = plates[i]
		var score: float = -sqrt(pow(p.x-0.5,2)+pow((p.y-0.5)*0.8,2))*0.6 + generator.random_value()*0.5
		pool.append({"i": i, "score": score})
	pool.sort_custom(func(a,b): return a.score > b.score)
	for item in pool:
		if land_area > N * 0.46: break
		var i: int = item.i
		var touching := false
		for other in touch[i]:
			if plates[other].continental: touching = true; break
		if touching and not (allow_fuse and landmasses >= 2 and generator.random_value() < 0.5): continue
		plates[i].continental = true
		land_area += area[i]
		if not touching: landmasses += 1
	return {"plates": plates, "plate_of": plate_of}



func create_elevation(plate_data: Dictionary) -> PackedFloat32Array:
	var plates: Array = plate_data.plates
	var plate_of: PackedInt32Array = plate_data.plate_of
	var stress := floats()
	var kind := ints()
	for r in ROWS:
		for c in COLS:
			var i := idx(c,r)
			var a: Dictionary = plates[plate_of[i]]
			for direction in DIR4:
				var x: int = c + direction.x
				var y: int = r + direction.y
				if x < 0 or y < 0 or x >= COLS or y >= ROWS: continue
				var j := idx(x,y)
				if plate_of[j] == plate_of[i]: continue
				var b: Dictionary = plates[plate_of[j]]
				var closing: float = (a.vx-b.vx)*direction.x + (a.vy-b.vy)*direction.y
				if absf(closing) < absf(stress[i]): continue
				stress[i] = closing
				if closing > 0:
					if a.continental and b.continental: kind[i] = 1
					elif a.continental: kind[i] = 2
					elif b.continental: kind[i] = 3
					else: kind[i] = 4
				else: kind[i] = 5
	var distance := floats(1e9)
	var src_stress := floats()
	var src_kind := ints()
	var queue: Array[int] = []
	for i in N:
		if kind[i] != 0:
			distance[i] = 0
			src_stress[i] = stress[i]
			src_kind[i] = kind[i]
			queue.append(i)
	var q := 0
	while q < queue.size():
		var i: int = queue[q]
		q += 1
		var c := i % COLS
		var r := floori(float(i)/COLS)
		if distance[i] > 12: continue
		for direction in DIR4:
			var x: int = c+direction.x
			var y: int = r+direction.y
			if x < 0 or y < 0 or x >= COLS or y >= ROWS: continue
			var j := idx(x,y)
			if distance[j] <= distance[i]+1 or plate_of[j] != plate_of[i]: continue
			distance[j] = distance[i]+1
			src_stress[j] = src_stress[i]
			src_kind[j] = src_kind[i]
			queue.append(j)
	var base := floats()
	for i in N:
		base[i] = 1 if plates[plate_of[i]].continental else -1
	base = blur(base,9)
	var height := floats()
	for r in ROWS:
		for c in COLS:
			var i := idx(c,r)
			var u := float(c)/COLS
			var v := float(r)/ROWS
			var wu := u + (NoiseUtil.noise(u*2.6*ASPECT+5,v*2.6+5,warp_seed,4)-0.5)*0.36
			var wv := v + (NoiseUtil.noise(u*2.6*ASPECT+55,v*2.6+55,warp_seed,4)-0.5)*0.36
			var bc := clampf(wu*COLS-0.5,0,COLS-1.001)
			var br := clampf(wv*ROWS-0.5,0,ROWS-1.001)
			var c0 := floori(bc)
			var r0 := floori(br)
			var fu := bc-c0
			var fv := br-r0
			var crust := (base[idx(c0,r0)]*(1-fu)+base[idx(c0+1,r0)]*fu)*(1-fv)+(base[idx(c0,r0+1)]*(1-fu)+base[idx(c0+1,r0+1)]*fu)*fv
			var h := crust*0.42-0.1
			h += (NoiseUtil.noise(wu*3.6*ASPECT,wv*3.6,noise_seed,5)-0.5)*1.25 + (NoiseUtil.noise(wu*8*ASPECT+20,wv*8+20,noise_seed,4)-0.5)*0.55 + (NoiseUtil.noise(u*18*ASPECT,v*18,detail_seed,3)-0.5)*0.28
			var ex := absf(u-0.5)*2
			var ey := absf(v-0.5)*2
			var radius := pow(pow(ex,3)+pow(ey,3),1.0/3.0)+(NoiseUtil.noise(u*4*ASPECT+90,v*4+90,detail_seed,3)-0.5)*0.22
			var e := (1-radius)*0.5
			var st: float = src_stress[i]
			var k: int = src_kind[i]
			var d: float = distance[i]
			if k != 0 and d < 13:
				var strength := minf(1.6,absf(st))*clampf((e-0.02)/0.1,0,1)
				var ridged := 1-absf(NoiseUtil.noise(u*24*ASPECT,v*24,detail_seed,3)*2-1)
				if k == 1: h += strength*(exp(-d*d/14)*(1.1+ridged*0.8)+exp(-d*d/60)*0.35)
				elif k == 2: h += strength*(exp(-pow(d-2,2)/8)*(0.9+ridged*0.6)+exp(-pow(d-3,2)/40)*0.25)
				elif k == 3: h -= strength*exp(-d*d/4)*0.45
				elif k == 4: h += strength*exp(-d*d/3)*maxf(0,NoiseUtil.noise(u*11*ASPECT+3,v*11+3,detail_seed,2)*1.9-0.85)*1.4
				elif k == 5: h -= strength*exp(-d*d/6)*(0.35 if plates[plate_of[i]].continental else 0.12)
			if e < 0.13:
				var t := clampf((0.13-e)/0.13,0,1)
				h -= t*t*(3-2*t)*2.2+maxf(0,-e)*4
			height[i] = h
	return height

static func erode(height: PackedFloat32Array, iterations: int) -> void:
	var filled := floats()
	var down := ints()
	var order := ints()
	var accumulation := floats()
	for iteration in iterations:
		var seen := PackedByteArray()
		seen.resize(N)
		seen.fill(0)
		var heap := Heap.new()
		var count := 0
		for c in COLS:
			for r in [0,ROWS-1]:
				var i := idx(c,r)
				if seen[i] == 0:
					seen[i] = 1
					filled[i] = height[i]
					down[i] = -1
					heap.push(filled[i],i)
		for r in range(1,ROWS-1):
			for c in [0,COLS-1]:
				var i := idx(c,r)
				if seen[i] == 0:
					seen[i] = 1
					filled[i] = height[i]
					down[i] = -1
					heap.push(filled[i],i)
		while heap.size() > 0:
			var i: int = heap.pop()
			order[count] = i
			count += 1
			var c := i % COLS
			var r := floori(float(i)/COLS)
			for direction in DIR8:
				var x: int = c+direction.x
				var y: int = r+direction.y
				if x < 0 or y < 0 or x >= COLS or y >= ROWS: continue
				var j := idx(x,y)
				if seen[j] != 0: continue
				seen[j] = 1
				filled[j] = maxf(height[j],filled[i]+0.00001)
				down[j] = i
				heap.push(filled[j],j)
		accumulation.fill(1.0)
		for k in range(N-1,-1,-1):
			var i: int = order[k]
			if down[i] >= 0: accumulation[down[i]] += accumulation[i]
		for k in N:
			var i: int = order[k]
			var j: int = down[i]
			if j < 0: continue
			var slope := maxf(0,filled[i]-filled[j])
			var cut := minf(slope*0.5,sqrt(accumulation[i])*slope*0.045)
			if height[i] > -0.2: height[i] -= cut
		for i in N:
			var c := i % COLS
			var r := floori(float(i)/COLS)
			for direction in DIR4:
				var x: int = c+direction.x
				var y: int = r+direction.y
				if x < 0 or y < 0 or x >= COLS or y >= ROWS: continue
				var j := idx(x,y)
				var d := float(height[i])-height[j]
				if d > 0.22:
					var m := (d-0.22)*0.25
					height[i] -= m
					height[j] += m

static func scale_heights(height: PackedFloat32Array) -> PackedFloat32Array:
	var sea := percentile(height,0.64)
	var land := PackedFloat32Array()
	for h in height:
		if h > sea: land.append(h-sea)
	var peak := percentile(land,0.94)
	if peak == 0: peak = 1
	var top := percentile(land,0.995)
	if top == 0: top = peak*1.3
	var result := floats()
	for i in N:
		var h := float(height[i])-sea
		if h <= 0:
			result[i] = maxf(-35,h*60-1.5)
			continue
		var t := h/peak
		result[i] = 1.2+pow(t,1.15)*28.6 if t <= 1 else 30+pow(minf(1,(h-peak)/maxf(0.001,top-peak)),1.4)*20
	return result

func climate(out: PackedFloat32Array) -> Dictionary:
	var heat := floats()
	var moisture := floats()
	var lat_eff := floats()
	var rain := floats()
	for r in ROWS:
		var lat := absf((r+0.5)/ROWS-0.5)*2
		var westerly := lat > 0.33 and lat < 0.68
		var air := 1.0
		for pass_index in 2:
			for k in COLS:
				var c := k if westerly else COLS-1-k
				var i := idx(c,r)
				var h: float = out[i]
				if h < 1:
					air = minf(1.2,air+0.06)
					if pass_index > 0: rain[i] = air*0.5
					continue
				var previous: float = out[idx(c-1 if westerly else c+1,r)] if k > 0 else h
				var lift := maxf(0,h-maxf(1,previous))*0.04
				var fall := minf(air,air*0.012+lift+(0.08 if h>30 else 0.0))
				air = maxf(0,air-fall)
				if pass_index > 0: rain[i] = fall*9+air*0.25
	var rain_smooth := blur(rain,3)
	var rain_max := percentile(rain_smooth,0.97)
	if rain_max == 0: rain_max = 1
	var sea_dist := floats(1e9)
	var queue: Array[int] = []
	for i in N:
		if out[i] < 1:
			sea_dist[i] = 0
			queue.append(i)
	var q := 0
	while q < queue.size():
		var i: int = queue[q]
		q += 1
		var c := i % COLS
		var r := floori(float(i)/COLS)
		for direction in DIR4:
			var x: int = c+direction.x
			var y: int = r+direction.y
			if x < 0 or y < 0 or x >= COLS or y >= ROWS: continue
			var j := idx(x,y)
			if sea_dist[j] > sea_dist[i]+1:
				sea_dist[j] = sea_dist[i]+1
				queue.append(j)
	for r in ROWS:
		for c in COLS:
			var i := idx(c,r)
			var lat := absf((r+0.5)/ROWS-0.5)*2
			var u := float(c)/COLS
			var v := float(r)/ROWS
			var belt := 0.55+0.45*cos(lat*PI*2.9)*(1.0 if lat<0.85 else 0.5)-(0.25 if lat>0.8 else 0.0)
			var wet := minf(1,rain_smooth[i]/rain_max)*0.6+exp(-sea_dist[i]/22)*0.4
			moisture[i] = clampf(wet*(0.35+belt*0.75)+0.12+(NoiseUtil.noise(u*9*ASPECT+70,v*9+70,detail_seed,3)-0.5)*0.2,0,1)
			var altitude := maxf(0,out[i]-6)/48
			heat[i] = clampf(1-lat*0.95-altitude*0.45+(NoiseUtil.noise(u*6*ASPECT+11,v*6+5,detail_seed,3)-0.5)*0.1,0,1)
			lat_eff[i] = clampf(lat+(NoiseUtil.noise(u*7*ASPECT+31,v*7+17,detail_seed,4)-0.5)*0.16+maxf(0,out[i]-14)/160,0,1)
	var land_idx: Array[int] = []
	for i in N:
		if out[i] >= 1: land_idx.append(i)
	# JS sort is stable. Explicit tie-break preserves the original cell order.
	land_idx.sort_custom(func(a,b): return a < b if moisture[a] == moisture[b] else moisture[a] < moisture[b])
	var targets := [[0.0,0.12],[0.08,0.3],[0.2,0.48],[0.45,0.62],[0.75,0.74],[0.92,0.86],[1.0,0.97]]
	for k in land_idx.size():
		var t := float(k)/maxi(1,land_idx.size()-1)
		var j := 1
		while j < targets.size()-1 and targets[j][0] < t: j += 1
		var t0: float = targets[j-1][0]
		var m0: float = targets[j-1][1]
		var t1: float = targets[j][0]
		var m1: float = targets[j][1]
		moisture[land_idx[k]] = m0+(m1-m0)*(t-t0)/maxf(0.000001,t1-t0)
	return {"heat": heat, "moisture": moisture, "lat": lat_eff}

static func starts_for(out: PackedFloat32Array, moisture: PackedFloat32Array) -> Array:
	var region := ints(-1)
	var region_sizes: Array[int] = []
	for i in N:
		if region[i] >= 0 or out[i] < 1: continue
		var id := region_sizes.size()
		var count := 0
		var stack: Array[int] = [i]
		region[i] = id
		while not stack.is_empty():
			var j: int = stack.pop_back()
			count += 1
			var c := j % COLS
			var r := floori(float(j)/COLS)
			for direction in DIR4:
				var x: int = c+direction.x
				var y: int = r+direction.y
				if x < 0 or y < 0 or x >= COLS or y >= ROWS: continue
				var k := idx(x,y)
				if region[k] < 0 and out[k] >= 1:
					region[k] = id
					stack.append(k)
		region_sizes.append(count)
	var candidates: Array = []
	for r in range(6,ROWS-6):
		for c in range(6,COLS-6):
			var i := idx(c,r)
			var h: float = out[i]
			if h < 3 or h > 22: continue
			var lat := absf((r+0.5)/ROWS-0.5)*2
			if lat > 0.7: continue
			var size: int = region_sizes[region[i]]
			if size < 260: continue
			var flat := 0
			for dr in range(-2,3):
				for dc in range(-2,3):
					var y: float = out[idx(c+dc,r+dr)]
					if y >= 1 and y < 26: flat += 1
			if flat < 18: continue
			candidates.append({"c": c, "r": r, "region": region[i], "quality": flat*0.4-absf(lat-0.4)*14+minf(30,float(size)/80)+moisture[i]*6})
	var starts: Array = []
	for team in 4:
		var best: Variant = null
		var best_score := -INF
		for p in candidates:
			var near := 120.0
			if not starts.is_empty():
				near = INF
				for other in starts:
					var dc: float = other.c-p.c
					var dr: float = other.r-p.r
					near = minf(near,sqrt(dc*dc+dr*dr))
			if near < 34: continue
			var same_land := 0
			for other in starts:
				if other.region == p.region: same_land += 1
			var score: float = p.quality+minf(near,90)*0.9-same_land*22
			if score > best_score:
				best_score = score
				best = p
		if best == null:
			if not candidates.is_empty(): best = candidates[(team*997)%candidates.size()]
			else: best = {"c": floori(COLS*(0.7 if team%2 else 0.3)+0.5), "r": floori(ROWS*(0.7 if team>=2 else 0.3)+0.5), "region": -1}
		starts.append(best)
	var result: Array = []
	for p in starts: result.append({"c": p.c, "r": p.r})
	return result

func generate() -> Dictionary:
	var plate_data := create_plates()
	var height := create_elevation(plate_data)
	erode(height,6)
	var out := scale_heights(height)
	var weather := climate(out)
	var start_positions := starts_for(out,weather.moisture)
	var plate_summary: Array = []
	for p in plate_data.plates:
		plate_summary.append({"x":p.x,"y":p.y,"continental":p.continental})
	return {"tectonic": true, "version": 1, "seed": seed, "heights": out, "heat": weather.heat, "moisture": weather.moisture, "lat": weather.lat, "plates": plate_summary, "starts": start_positions}
