class_name CampaignGrid
extends RefCounted

# Port of campaign.js, lines 11-15 (source revision recorded in PORT_STATUS.md).
const COLS := 220
const ROWS := 165
const TILE := 50
const ORIGIN_X := -650
const ORIGIN_Z := -550
const WORLD_WIDTH := COLS * TILE
const WORLD_DEPTH := ROWS * TILE
const WORLD_CENTER_X := ORIGIN_X + WORLD_WIDTH / 2.0
const WORLD_CENTER_Z := ORIGIN_Z + WORLD_DEPTH / 2.0
const DIRECTIONS := [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]

static func center(c: int, r: int) -> Vector2:
	return Vector2(ORIGIN_X + (c + 0.5) * TILE, ORIGIN_Z + (r + 0.5) * TILE)

static func cell_at(x: float, z: float) -> Variant:
	var c := floori((x - ORIGIN_X) / TILE)
	var r := floori((z - ORIGIN_Z) / TILE)
	if c >= 0 and c < COLS and r >= 0 and r < ROWS:
		return Vector2i(c, r)
	return null

static func make_grid(height: Callable, noise: Callable, preserve_starts := true) -> Array:
	var cells: Array = []
	for r in ROWS:
		for c in COLS:
			var p := center(c, r)
			var h: float = height.call(p.x, p.y)
			if preserve_starts and ((r == 11 and c >= 10 and c <= 17) or (c == 17 and r >= 9 and r <= 11)):
				h = maxf(h, 9.0)
			var biome := "sea" if h < 1 else ("hills" if h > 30 else ("forest" if noise.call(c + 40, r + 60) > 0.55 else "plains"))
			cells.append({"c": c, "r": r, "x": p.x, "z": p.y, "h": h, "biome": biome, "land": biome != "sea", "mountain": biome == "hills"})
	return cells

static func default_passable(cell: Dictionary, _position: Vector2i) -> bool:
	return cell.land and not cell.mountain

# Returns an array excluding the start and including the destination, or null.
static func find_path(grid: Array, start: Vector2i, goal: Vector2i, passable: Callable = default_passable) -> Variant:
	if start.x < 0 or start.x >= COLS or start.y < 0 or start.y >= ROWS or goal.x < 0 or goal.x >= COLS or goal.y < 0 or goal.y >= ROWS:
		return null
	var first := start.y * COLS + start.x
	var last := goal.y * COLS + goal.x
	if last >= grid.size() or not passable.call(grid[last], goal):
		return null
	var queue: Array[int] = [first]
	var previous := {first: -1}
	var head := 0
	while head < queue.size():
		var key: int = queue[head]
		head += 1
		if key == last:
			var path: Array[Vector2i] = []
			while key != first:
				path.append(Vector2i(key % COLS, floori(float(key) / COLS)))
				key = previous[key]
			path.reverse()
			return path
		var current := Vector2i(key % COLS, floori(float(key) / COLS))
		for direction in DIRECTIONS:
			var next: Vector2i = current + direction
			if next.x < 0 or next.x >= COLS or next.y < 0 or next.y >= ROWS:
				continue
			var index: int = next.y * COLS + next.x
			if previous.has(index) or index >= grid.size() or not passable.call(grid[index], next):
				continue
			previous[index] = key
			queue.append(index)
	return null
