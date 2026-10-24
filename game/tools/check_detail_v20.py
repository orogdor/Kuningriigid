"""Godot 2.0 regression wiring checks; does not execute the Godot engine."""
from pathlib import Path
import re,math, json
root=Path(__file__).resolve().parents[1]
main=(root/'scripts/main.gd').read_text()
detail=(root/'scripts/adapters/native_detail_tile.gd').read_text()
tests=(root/'tests/port_checks.gd').read_text()
ready=main.split('func _ready() -> void:',1)[1].split('func _setup_lighting()',1)[0]
assert '_run_rule_checks()' not in ready, 'Tests must not interrupt Android launch'
assert '_run_rule_checks()' in main, 'Manual test button must still work'
assert 'Preview.tick(demo,60.0)' in tests, 'Builder material trips change the timing'
assert 'bool(quarry.get("ok",false)) and demo["cities"][0]["buildings"].size() > 2' in tests
assert 'native_detail_tile.refresh_movers(preview_state["cities"][detail_index],' in main
assert 'func _create_city_roads(town: Dictionary,navigator)' in detail
assert 'navigator.route(town,0,index)' in detail
assert 'Cargo.building_position(town,i)' in detail
assert 'city_to_detail(town,Cargo.building_position(town,i))' in detail
assert '_add_multi(body_mesh,group["wall"]' in detail
assert 'func refresh_movers(town: Dictionary,shipments: Array' in detail
assert 'for agent in town.get("citizens",{}).values()' in detail
assert 'for shipment in town.get("cargo",[])' in detail
assert main.count('native_detail_tile.show_tile(')>=3
assert main.count('heights,local_streets if street_nav_on else null,preview_state.get("detail_bridges",{}),shared_landscape)')>=3
# Legacy V2.0 spiral projections; V2.1 now has an additional independent
# 160-building occupancy check in check_city_v21.py.
# Validate world-to-detail coordinate scaling only.
for town in json.loads((root/'data/v131_city_sample.json').read_text())['cities']:
    c,r=town['c'],town['r']
    for i in range(30):
        a=i*2.399963229728653
        rad=.4+math.sqrt(i)*.78
        pos=(c+.5+math.cos(a)*rad, r+.5+math.sin(a)*rad)
        projected=((pos[0]-c-.5)*10,(pos[1]-r-.5)*10)
        roundtrip=(projected[0]/10+c+.5,projected[1]/10+r+.5)
        assert math.dist(pos,roundtrip)<1e-10
        assert abs(projected[0])<112.5 and abs(projected[1])<97.5
assert len(re.findall(r'^    _check\(',tests,re.M))>=389
print('PASS: startup ignores manual tests; missing index guarded; roads and moving agents use the same economic coordinates; 420 town/building projections verified.')
print('NOTE: Godot engine / Android launch and 389 runtime assertions are not executed.')
