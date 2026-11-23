class_name CoastalStarts
extends RefCounted
const DIRS := [Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1)]

static func height_at(heights: PackedFloat32Array, cols: int, rows: int, c: int, r: int) -> float:
	if c < 0 or r < 0 or c >= cols or r >= rows: return -40.0
	return heights[r*cols+c]

static func choose(cols: int, rows: int, heights: PackedFloat32Array, preferred: Array, minimum_distance := 28.0) -> Array:
	var candidates: Array = []
	for r in range(3, rows-3):
		for c in range(3, cols-3):
			var h := height_at(heights,cols,rows,c,r)
			if h <= 1.25 or h >= 30: continue
			var coast := false
			for d in DIRS:
				if height_at(heights,cols,rows,c+d.x,r+d.y) <= 0:
					coast = true
					break
			if not coast: continue
			var dry := 0
			var local := 0
			var shelter := 0
			for dr in range(-2,3):
				for dc in range(-2,3):
					var y := height_at(heights,cols,rows,c+dc,r+dr)
					if y > 0 and y < 30: dry += 1
					if abs(dc) <= 1 and abs(dr) <= 1 and y > 0 and y < 30: local += 1
					if abs(dc)+abs(dr) == 1 and y > 0: shelter += 1
			if dry < 11 or local < 5 or shelter < 2: continue
			candidates.append({"c":c,"r":r,"quality":dry*0.32+local*0.8+shelter*1.4-maxf(0,h-18)*0.3})
	if candidates.size() < 4: return []
	var selected: Array = []
	for team in 4:
		var target: Dictionary = preferred[team] if team < preferred.size() else {"c":floori((0.77 if team%2 else 0.23)*cols+0.5),"r":floori((0.77 if team>=2 else 0.23)*rows+0.5)}
		var best: Variant = null
		var best_score := -INF
		for p in candidates:
			var nearest := INF
			for q in selected:
				var dc: float = q.c-p.c
				var dr: float = q.r-p.r
				nearest = minf(nearest,sqrt(dc*dc+dr*dr))
			if nearest < minimum_distance: continue
			var dc: float = target.c-p.c
			var dr: float = target.r-p.r
			var score: float = -sqrt(dc*dc+dr*dr)*1.15+p.quality+(minf(nearest,70)*0.38 if is_finite(nearest) else 0.0)
			if score > best_score:
				best_score = score
				best = p
		if best == null: return []
		selected.append({"c":best.c,"r":best.r})
	return selected

static func apply_plateaus(heights: PackedFloat32Array, cols: int, rows: int, starts: Array) -> PackedFloat32Array:
	var result := heights.duplicate()
	for r in rows:
		for c in cols:
			var h: float = result[r*cols+c]
			if h <= 0: continue
			for p in starts:
				var dx: float = (c-p.c)*50
				var dz: float = (r-p.r)*50
				if dx*dx+dz*dz < 125*125:
					result[r*cols+c] = clampf(h,9,19)
					break
	return result
