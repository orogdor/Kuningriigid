# Port 1.5 — artillery, bows and terrain (V131 reference)

Sources pinned to Git commit `26562368f56a32616651a266ed2d8c87f06d43d1`.

- `catapult-accuracy-v105.js`: deterministic scatter capped at 14.4m LVL 1; LVL 10 perfect aim. Godot tests use seeded 31-bit approximation; **not identical random hash** to JS.
- `individual-battle-v91.js`: stone radius 4.2m, 1.1s flight, 8.4s reload, all-faction splash; 500-man limit.
- `combat-equipment-v100.js`: catapult has 6 stones; bow loads 20/40/48 according to type.
- `historical-tactics-v92.js`: approximate hit chance falloff with range, deterministic seeds and evasive moves versus braced spears.
- Test arena has six synthetic obstacles (`battle_terrain_v131.gd`), not V131 atlas-projected 3x3 landscape. No physical slopes, siege walls, ballistas or siege camps in this iteration.
- Original GLB is still fetched at first use, not bundled; character skeletal animation is not included.

**Caution:** Structural Python validation is not Godot compilation. `tests/port_checks.gd` must be executed in Godot 4. No APK has been built or run.
