extends RefCounted
## Lightweight test-arena obstruction mask, not the real 3x3 V131 landscape.
## Deterministic placements, shared by visualization and soldier navigation.
const FIELD_X: float = 32.0
const FIELD_Z: float = 25.0

static func seeded_obstacles(c: int, r: int) -> Array:
    # Local rock/tree clusters do not obstruct the two army spawn bands.
    var stamp: int = absi(c*43+r*71)
    var positions: Array = [Vector2(-7,-14),Vector2(6,13),Vector2(-2,8),Vector2(3,-8),Vector2(1,17),Vector2(-8,15)]
    var rocks: Array = []
    for i in range(positions.size()):
        var p: Vector2 = positions[i]
        var dx: float = float((stamp+i*7)%5-2)*.48
        var dz: float = float((stamp+i*11)%5-2)*.42
        rocks.append({"x":p.x+dx,"z":p.y+dz,"radius": 1.45 if i%2 == 0 else 1.05,"kind":"rock" if i%3==0 else "tree"})
    return rocks

static func passable(x: float,z: float,radius: float,obstacles: Array) -> bool:
    if absf(x)>FIELD_X+5.0 or absf(z)>FIELD_Z+5.0:
        return true # Retreat ring is navigable.
    for obstacle in obstacles:
        var dx: float = x-float(obstacle["x"])
        var dz: float = z-float(obstacle["z"])
        var gap: float = float(obstacle["radius"])+radius+.08
        if dx*dx+dz*dz<gap*gap:
            return false
    return true
