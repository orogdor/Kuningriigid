extends RefCounted
## Optional Godot AStarGrid2D backend. Kept separate from campaign_port.gd:
## A* can choose different equal-cost routes, so it is NOT exact V131 BFS.
var grid: AStarGrid2D
const COLS: int = 220
const ROWS: int = 165

func configure(passable: PackedByteArray) -> void:
    grid = AStarGrid2D.new()
    grid.region = Rect2i(0, 0, COLS, ROWS)
    grid.cell_size = Vector2.ONE
    grid.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_NEVER
    grid.default_compute_heuristic = AStarGrid2D.HEURISTIC_MANHATTAN
    grid.default_estimate_heuristic = AStarGrid2D.HEURISTIC_MANHATTAN
    grid.update()
    for r in range(ROWS):
        for c in range(COLS):
            if passable[r * COLS + c] == 0:
                grid.set_point_solid(Vector2i(c, r), true)

func route(a: Vector2i, b: Vector2i) -> Array:
    var result: Array = []
    if grid == null:
        return result
    if not grid.is_in_boundsv(a) or not grid.is_in_boundsv(b):
        return result
    var native: Array[Vector2i] = grid.get_id_path(a, b)
    for i in range(1, native.size()):
        result.append(native[i])
    return result
