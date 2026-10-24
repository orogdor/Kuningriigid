"""Static checks for V2.2. NOT a Godot GDScript interpreter/runtime."""
from pathlib import Path
import re
root = Path(__file__).resolve().parents[1]
main=(root/'scripts/main.gd').read_text()
territory=(root/'scripts/core/territory_port.gd').read_text()
preview=(root/'scripts/core/preview_sim_port.gd').read_text()
detail=(root/'scripts/adapters/native_detail_tile.gd').read_text()
tests=(root/'tests/port_checks.gd').read_text()
assert len(re.findall(r'^\s+_check\(',tests,re.M)) >= 658
assert 'v34-v153-urban-real-bounds' in tests
for expected in ['static func urban_radius(', 'static func rebuild(', 'static func build_worksite(',
                 'static func choose_worksite(', 'static func reconcile_worksites(',
                 'static func advance_worksites(', 'static func deposit_kind(']:
    assert expected in territory,expected
for expected in ['"county_lumber": _build_county_worksite("lumber")',
                 '"county_farm": _build_county_worksite("farm")',
                 '"county_quarry": _build_county_worksite("quarry")',
                 '"county_mine": _build_county_worksite("mine")',
                 '"territory_demo": _start_territory_demo()',
                 'Territory.rebuild(preview_state,land',
                 'Territory.reconcile_worksites(preview_state,land,heights)',
                 'county_node.mesh=mesh' if False else 'county_node.mesh = mesh',
                 'territory_demo_index >= 0']:
    assert expected in main,expected
assert 'v131_godot_preview_v22.json' in preview or 'v131_godot_preview_v23.json' in preview
assert any(s in main for s in ['v131_godot_measurements_v22.csv','v131_godot_measurements_v23.csv','v131_godot_measurements_v24.csv','v131_godot_measurements_v33.csv'])
assert 'v131_godot_preview_v14.json' in preview
assert 'Territory.advance_worksites(city,dt)' in preview
assert '_create_county_worksites(towns[owner_index])' in detail
assert '_run_rule_checks()' not in main.split('func _ready() -> void:',1)[1].split('func _setup_lighting()',1)[0]
assert all(k in tests for k in ['v22-no-overseas-claim','v22-city-urban-fallback','v22-rural-worksite-saveable'])
print('PASS: V2.2 territory/building/demo wiring, 658+ prepared GDScript assertions, backwards-compatible load paths; Godot runtime NOT tested')
