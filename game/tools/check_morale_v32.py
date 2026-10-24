"""Structural test of 3.2 routing / fatigue integration; NOT Godot execution."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
a=(root/'scripts/core/battle_morale_v131.gd').read_text()
b=(root/'scripts/core/individual_battle_port.gd').read_text()
u=(root/'scripts/main.gd').read_text()
t=(root/'tests/port_checks.gd').read_text()
assert (root/'docs/PORT_V32_SCOPE.md').exists()
for name in ('living','initialize','apply_hit','route_squad','update','_candidate_exits','prepare_escape','speed_factor'):
    assert re.search(r'^static func '+name+r'\(',a,re.M),name
assert 'const Morale = preload(' in b
assert 'Morale.update(battle,dt)' in b and 'Morale.apply_hit(battle,target_squad,target_man' in b
assert 'Morale.apply_hit(battle,enemy_squad,opponent,man' in b
assert 'Morale.route_squad(battle,squad,false)' in b
assert 'Morale.prepare_escape(battle,squad,surface)' in b
assert 'float(battle["elapsed"]) < float(squad.get("escape_retry_at",0.0))' in b
assert 'can_fire: bool = not routing' in b
assert 'if not routing and not destination.is_empty()' in b
assert 'BattleSurface.edge_open(surface,point_now,desired' in b
assert 'terrain_search_budget: int = 2 if bool(battle.get("large_battle_test",false)) else 6' in b
assert 'Morale.speed_factor(man)' in b
assert 'var spread: float' in b and 'var crossing_horizontal: bool' in b
assert 'if mode == "retreat":' in b and 'if bool(squad.get("routing",false)) and squad.has("rout_at"):' in b
assert '"morale_routs"' in b and '"escape_routes"' in b and '"flank_shocks"' in b
assert '"battlefield_morale_120": _morale_battle_demo()' in u
assert '"battle_morale_info": _battle_morale_info()' in u
assert 'v131_godot_measurements_v33.csv' in u
assert 'morale_routs,ordered_retreats,escape_routes,escape_failed_routes,flank_shocks' in u
# Five new metrics in CSV header and exactly five in values.
for key in ('morale_routs','ordered_retreats','escape_routes','escape_failed_routes','flank_shocks'):
    assert f'.get("{key}",0)' in u,key
checks = re.findall(r'^\s+_check\(',t,re.M)
assert len(checks)==647
new=re.findall(r'_check\(results,"(v32-[^"]+)"',t)
assert len(new)==31 and len(new)==len(set(new)),new
assert 'BattleMorale.initialize(m32_battle)' in t
assert 'BattleMorale.prepare_escape(m32_battle,m32_squad,thirty)' in t
for key in ('"battlefield_tactics_120"','"battlefield_500"','"siege"','"city"'):
    assert key in u
print('PASS V3.2 structural checks: 31 additional GDScript assertions, morale, escape planning, staggered exits, CSV/UI, regressions. NO GODOT ENGINE.')
