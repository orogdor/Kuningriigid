class_name WorldGeography
extends RefCounted
const Heap = preload("res://scripts/min_priority_queue.gd")
const Grid = preload("res://scripts/campaign_grid.gd")
const STEPS := [Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1)]

static func noise(c: float, r: float, seed: int) -> float:
	var n := sin(c*127.1+r*311.7+seed*0.017)*43758.5453
	return n-floor(n)

static func drainage(cells: Array, seed: int, starts: Array, natural := true, river_width := true) -> Dictionary:
	var n := cells.size()
	var visited := PackedByteArray(); visited.resize(n); visited.fill(0)
	var down := PackedInt32Array(); down.resize(n); down.fill(-1)
	var accumulation := PackedFloat64Array(); accumulation.resize(n); accumulation.fill(1.0)
	var filled := PackedFloat64Array(); filled.resize(n)
	var order: Array[int] = []
	var heap := Heap.new()
	for i in n:
		var p: Dictionary = cells[i]
		if not p.land or p.c == 0 or p.r == 0 or p.c == Grid.COLS-1 or p.r == Grid.ROWS-1:
			visited[i] = 1
			filled[i] = p.h
			heap.push(filled[i],i)
	while heap.size() > 0:
		var i: int = heap.pop()
		order.append(i)
		var p: Dictionary = cells[i]
		for direction in STEPS:
			var c: int = p.c + direction.x
			var r: int = p.r + direction.y
			if c < 0 or r < 0 or c >= Grid.COLS or r >= Grid.ROWS: continue
			var j: int = r*Grid.COLS+c
			if visited[j] != 0: continue
			visited[j] = 1
			down[j] = i
			filled[j] = maxf(cells[j].h,filled[i]+0.00001)
			heap.push(filled[j],j)
	for k in range(order.size()-1,-1,-1):
		var i: int = order[k]
		if down[i] >= 0: accumulation[down[i]] += accumulation[i]
	var has_sea := false
	for cell in cells:
		if not cell.land: has_sea = true; break
	var threshold := (37 if natural else 24) if has_sea else 100
	var rivers := 0
	for i in n:
		var cell: Dictionary = cells[i]
		var d := down[i]
		if not cell.land or d < 0 or accumulation[i] < threshold or (cell.h < 1.5 and not river_width): continue
		var near_start := false
		for start in starts:
			if abs(start.c-cell.c)+abs(start.r-cell.r) < 2: near_start = true; break
		if near_start: continue
		var to: Dictionary = cells[d]
		cell.river = true
		cell.riverTo = {"c":to.c,"r":to.r}
		cell.riverFlow = floori(accumulation[i]+0.5)
		cell.riverWidth = clampf(1.7+sqrt(accumulation[i])*0.31,2.2,9) if natural else clampf(2.2+sqrt(accumulation[i])*0.38,2.3,10)
		if river_width:
			cell.riverWidth = clampf(1.3+pow(maxf(0,accumulation[i]-threshold),0.62)*0.4,1.3,16)
			cell.riverNavigable = cell.riverWidth >= 6
		if natural:
			cell.riverClass = "major" if accumulation[i]>440 else ("river" if accumulation[i]>135 else "stream")
			cell.riverSource = accumulation[i] < threshold*1.7
			cell.tributaryFlow = floori(accumulation[i]+0.5)
		cell.riverDir = "h" if to.c != cell.c else "v"
		var regular := false
		if natural:
			regular = accumulation[i]<250 and floori(accumulation[i]+noise(cell.c*7,cell.r*17,seed)*29+0.5)%13 == 0
		else:
			regular = floori(accumulation[i]+noise(cell.c*7,cell.r*17,seed)*19+0.5)%7 == 0
		var close := false
		for start in starts:
			if abs(start.c-cell.c)+abs(start.r-cell.r) <= 3: close = true; break
		cell.ford = not cell.mountain and (cell.get("ford",false) or regular or close)
		rivers += 1
	return {"riverCells": rivers, "totalCells": n, "drainageDown": down, "accumulation": accumulation}

static func traversable(cell: Dictionary) -> bool:
	return cell.land and not cell.mountain and (not cell.get("river",false) or cell.get("ford",false) or cell.get("bridge",false))

static func components(cells: Array) -> Dictionary:
	var flags := PackedInt32Array(); flags.resize(cells.size()); flags.fill(-1)
	var sizes: Array[int] = []
	for index in cells.size():
		if flags[index] != -1 or not traversable(cells[index]): continue
		var id := sizes.size()
		var queue: Array[int] = [index]
		flags[index] = id
		var head := 0
		while head < queue.size():
			var k: int = queue[head]; head += 1
			var c := k % Grid.COLS
			var r := floori(float(k)/Grid.COLS)
			for direction in STEPS:
				var x: int = c+direction.x
				var y: int = r+direction.y
				if x < 0 or y < 0 or x >= Grid.COLS or y >= Grid.ROWS: continue
				var j := y*Grid.COLS+x
				if flags[j] == -1 and traversable(cells[j]): flags[j] = id; queue.append(j)
		sizes.append(queue.size())
	return {"flags":flags,"sizes":sizes}

static func open_starting_passages(cells: Array, starts: Array, min_region := 120) -> Array:
	var waypoints: Array = []
	for start in starts:
		var comp := components(cells)
		var flags: PackedInt32Array = comp.flags
		var sizes: Array = comp.sizes
		var at: int = int(start.r)*Grid.COLS+int(start.c)
		if at < 0 or at >= cells.size() or not cells[at].land: continue
		if flags[at] >= 0 and sizes[flags[at]] >= min_region: continue
		var heap := Heap.new()
		var distance := PackedFloat64Array(); distance.resize(cells.size()); distance.fill(INF)
		var parent := PackedInt32Array(); parent.resize(cells.size()); parent.fill(-1)
		distance[at] = 0.0; heap.push(0,at)
		var target := -1
		while heap.size() > 0:
			var cost: float = heap.keys[0]
			var i: int = heap.pop()
			if cost > distance[i]+0.0000001: continue
			if i != at and flags[i] >= 0 and sizes[flags[i]] >= min_region: target = i; break
			var c := i%Grid.COLS
			var r := floori(float(i)/Grid.COLS)
			for direction in STEPS:
				var x: int = c+direction.x
				var y: int = r+direction.y
				if x < 0 or y < 0 or x >= Grid.COLS or y >= Grid.ROWS: continue
				var j := y*Grid.COLS+x
				var p: Dictionary = cells[j]
				if not p.land: continue
				var weight := 3.6 if p.mountain else (2.2 if p.get("river",false) and not p.get("ford",false) and not p.get("bridge",false) else 1.0)
				var d := cost+weight
				if d < distance[j]: distance[j] = d; parent[j] = i; heap.push(d,j)
		if target < 0: continue
		var opened := 0
		var length := 0
		var k := target
		while k != at and k >= 0:
			var p: Dictionary = cells[k]
			if p.mountain: p.mountain = false; p.h = minf(26,p.h); p.biome = "plains"; opened += 1
			if p.get("river",false) and not p.get("ford",false) and not p.get("bridge",false): p.ford = true; opened += 1
			length += 1
			k = parent[k]
		waypoints.append({"from":start.duplicate(),"to":{"c":target%Grid.COLS,"r":floori(float(target)/Grid.COLS)},"length":length,"opened":opened})
	return waypoints

static func wiggle(c: int, r: int) -> float:
	var n := sin(c*12.9898+r*78.233)*43758.5453
	return n-floor(n)

static func lake_outlets(cells: Array, seed: int, starts: Array, min_size := 10, chance := 0.6) -> int:
	var n := cells.size()
	var comp := PackedInt32Array(); comp.resize(n); comp.fill(-1)
	var sizes: Array[int] = []
	var edges: Array[bool] = []
	for i in n:
		if cells[i].land or comp[i] >= 0: continue
		var id := sizes.size()
		var size := 0
		var touches := false
		var stack: Array[int] = [i]
		comp[i] = id
		while not stack.is_empty():
			var j: int = stack.pop_back()
			size += 1
			var p: Dictionary = cells[j]
			if p.c == 0 or p.r == 0 or p.c == Grid.COLS-1 or p.r == Grid.ROWS-1: touches = true
			for direction in STEPS:
				var c: int = p.c+direction.x
				var r: int = p.r+direction.y
				if c < 0 or r < 0 or c >= Grid.COLS or r >= Grid.ROWS: continue
				var k := r*Grid.COLS+c
				if comp[k] < 0 and not cells[k].land: comp[k] = id; stack.append(k)
		sizes.append(size); edges.append(touches)
	var outlets := 0
	for id in sizes.size():
		if edges[id] or sizes[id] > 600 or sizes[id] < min_size: continue
		var any := comp.find(id)
		var p0: Dictionary = cells[any]
		if noise(p0.c*3+11,p0.r*5+7,seed) > chance: continue
		var distance := PackedFloat64Array(); distance.resize(n); distance.fill(INF)
		var previous := PackedInt32Array(); previous.resize(n); previous.fill(-1)
		var heap := Heap.new()
		for i in n:
			if comp[i] != id: continue
			for direction in STEPS:
				var c: int = cells[i].c+direction.x
				var r: int = cells[i].r+direction.y
				if c < 0 or r < 0 or c >= Grid.COLS or r >= Grid.ROWS: continue
				var k := r*Grid.COLS+c
				if cells[k].land and not cells[k].mountain and distance[k] > cells[k].h:
					distance[k] = cells[k].h; previous[k] = i; heap.push(distance[k],k)
		var end := -1
		while heap.size() > 0:
			var d: float = heap.keys[0]
			var i: int = heap.pop()
			if d > distance[i]: continue
			var reached := -1
			for direction in STEPS:
				var c: int = cells[i].c+direction.x
				var r: int = cells[i].r+direction.y
				if c < 0 or r < 0 or c >= Grid.COLS or r >= Grid.ROWS: continue
				var k := r*Grid.COLS+c
				if not cells[k].land and comp[k] != id and (edges[comp[k]] or sizes[comp[k]] > 600): reached = k; break
			if reached >= 0: end = i; previous[reached] = i; break
			if d > 4000: break
			for direction in STEPS:
				var c: int = cells[i].c+direction.x
				var r: int = cells[i].r+direction.y
				if c < 0 or r < 0 or c >= Grid.COLS or r >= Grid.ROWS: continue
				var k := r*Grid.COLS+c
				if not cells[k].land or cells[k].mountain: continue
				var next := d+1+maxf(0,cells[k].h)*0.6+wiggle(cells[k].c,cells[k].r)*4
				if next < distance[k]: distance[k] = next; previous[k] = i; heap.push(next,k)
		if end < 0: continue
		var path: Array[int] = []
		var i := end
		while i >= 0 and cells[i].land:
			path.append(i)
			i = previous[i]
		path.reverse()
		if path.size() < 2 or path.size() > 90: continue
		var sea_index := -1
		for k in n:
			if previous[k] == end and not cells[k].land and comp[k] != id: sea_index = k; break
		if sea_index < 0: continue
		var width := minf(16,7+sizes[id]*0.08)
		for k in path.size():
			var cell: Dictionary = cells[path[k]]
			var to: Dictionary = cells[path[k+1]] if k < path.size()-1 else cells[sea_index]
			var near := false
			for start in starts:
				if abs(start.c-cell.c)+abs(start.r-cell.r) < 2: near = true; break
			if near: continue
			cell.river = true
			cell.riverTo = {"c":to.c,"r":to.r}
			cell.riverDir = "h" if to.c != cell.c else "v"
			cell.riverWidth = minf(16,maxf(cell.get("riverWidth",0),width+k*0.04))
			cell.riverNavigable = true
			cell.riverClass = "major"
			cell.lakeOutletV275 = true
			cell.riverFlow = maxf(cell.get("riverFlow",0),sizes[id]*12)
			cell.ford = not cell.mountain and cell.get("ford",false) and k%9 == 4
		outlets += 1
	return outlets

static func traversable_cell(cell: Dictionary, _position: Vector2i) -> bool:
	return traversable(cell)
