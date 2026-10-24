"""V2.4 structural / source invariant checks (does not execute GDScript)."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
sim=(root/'scripts/core/preview_sim_port.gd').read_text()
logic=(root/'scripts/core/county_logistics_port.gd').read_text()
detail=(root/'scripts/adapters/native_detail_tile.gd').read_text()
main=(root/'scripts/main.gd').read_text()
tests=(root/'tests/port_checks.gd').read_text()
assert len(re.findall(r'^\s+_check\(',tests,re.M))>=658
assert '"direction":"supply"' not in logic or 'supply' in logic
assert 'site["inputs"] = inputs' in logic
assert 'Economy.spend_resources(inputs,recipe)' in logic
assert 'Economy.spend_resources(stock,recipe)' not in logic
assert '"orphaned_supply"' in logic
assert 'world_position(' in logic and 'Roads.road_boost' in logic
assert '_append_county_positions' in detail
assert 'CountyLogistics.world_position(' in detail
assert 'v131_godot_preview_v24.json' in sim and 'v131_godot_preview_v23.json' in sim
assert '"county_inputs": _start_county_demo(true)' in main
assert 'county_supply_departures,county_supply_arrivals' in main
assert 'v131_godot_measurements_v33.csv' in main
for t in ['v24-no-instant-arrival-of-inputs','v24-products-return-in-a-separate-shipment','v24-unreachable-site-keeps-input-at-home']:
    assert t in tests
print('PASS V2.4: direction-tagged input/output cargo, remote inventories, continuous 3D interpolation, migration, demo & instrumentation (static)')
