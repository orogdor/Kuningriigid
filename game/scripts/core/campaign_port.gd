extends RefCounted
## Direct GDScript port of the deterministic 4-way world grid BFS from campaign.js.
## Grid movement: right, left, down, up; the output omits the starting cell.
const COLS: int = 220
const ROWS: int = 165
const TILE: int = 50
const ORIGIN_X: int = -650
const ORIGIN_Z: int = -550
const WORLD_WIDTH: int = COLS * TILE
const WORLD_DEPTH: int = ROWS * TILE

static func index(c: int, r: int) -> int:
    return r * COLS + c

static func center(c: int, r: int) -> Vector2:
    return Vector2(ORIGIN_X + (float(c) + 0.5) * TILE, ORIGIN_Z + (float(r) + 0.5) * TILE)

static func cell_at(x: float, z: float) -> Vector2i:
    var c := int(floor((x - ORIGIN_X) / TILE))
    var r := int(floor((z - ORIGIN_Z) / TILE))
    if c >= 0 and c < COLS and r >= 0 and r < ROWS:
        return Vector2i(c, r)
    return Vector2i(-1, -1)

static func find_path(passable: PackedByteArray, source: Vector2i, target: Vector2i) -> Array:
    var output: Array = []
    if source.x < 0 or source.x >= COLS or source.y < 0 or source.y >= ROWS:
        return output
    if target.x < 0 or target.x >= COLS or target.y < 0 or target.y >= ROWS:
        return output
    if passable.size() != COLS * ROWS:
        return output
    var start := index(source.x, source.y)
    var goal := index(target.x, target.y)
    if passable[goal] == 0:
        return output
    if start == goal:
        return output
    var prev := PackedInt32Array()
    prev.resize(COLS * ROWS)
    prev.fill(-2)
    var queue := PackedInt32Array()
    queue.resize(COLS * ROWS)
    queue[0] = start
    prev[start] = -1
    var read := 0
    var write := 1
    while read < write:
        var k: int = queue[read]
        read += 1
        if k == goal:
            var node: int = k
            while node != start and node >= 0:
                output.append(Vector2i(node % COLS, int(node / COLS)))
                node = prev[node]
            output.reverse()
            return output
        var c: int = k % COLS
        var r: int = int(k / COLS)
        # IMPORTANT: this neighbor order comes directly from V131 campaign.js.
        if c + 1 < COLS:
            var n := k + 1
            if prev[n] == -2 and passable[n] != 0:
                prev[n] = k
                queue[write] = n
                write += 1
        if c > 0:
            var n := k - 1
            if prev[n] == -2 and passable[n] != 0:
                prev[n] = k
                queue[write] = n
                write += 1
        if r + 1 < ROWS:
            var n := k + COLS
            if prev[n] == -2 and passable[n] != 0:
                prev[n] = k
                queue[write] = n
                write += 1
        if r > 0:
            var n := k - COLS
            if prev[n] == -2 and passable[n] != 0:
                prev[n] = k
                queue[write] = n
                write += 1
    return output
