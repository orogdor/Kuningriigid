"""Validate 3x3 battle bindings without claiming Godot runtime coverage."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
b=(root/'scripts/core/battle_surface_v131.gd').read_text()
m=(root/'scripts/main.gd').read_text()
v=(root/'scripts/adapters/native_individual_battle_view.gd').read_text()
i=(root/'scripts/core/individual_battle_port.gd').read_text()
t=(root/'tests/port_checks.gd').read_text()
assert 'const LARGE_HALF_X: float = 337.5' in b and 'const LARGE_HALF_Z: float = 292.5' in b
assert 'for dz in range(-1,2)' in m and 'for dx in range(-1,2)' in m
assert 'BattleSurface.make_large(tiles,river_parts,bridges,[])' in m
assert '"battlefield_500": _large_battle_demo()' in m
assert '"large_field"' in v and 'regions: int = 3 if large else 1' in v
assert 'terrain_search_budget: int = 2 if bool(battle.get("large_battle_test",false)) else 6' in i
assert 'BattleSurface.half_x(surface)' in i and 'BattleSurface.half_z(surface)' in i
assert 'retreat_lines' in v and 'overview_lines' in v
assert len(re.findall(r'^\s+_check\(',t,re.M)) == 647
assert '    if ground_open(data,position.x,position.y,.34):' in b
assert 'V131 3x3' in m
print('PASS v3.0: nine-tile surface, routing, UI, 500 troops, renderer, edge, regression fixtures (static only).')
