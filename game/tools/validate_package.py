"""Structural checks only. Does NOT compile or execute Godot/GDScript."""
from pathlib import Path
import json
import re
import sys

root = Path(__file__).resolve().parents[1]
main = (root / "scripts/main.gd").read_text(encoding="utf-8")
source = (root / "scripts/core/research_port.gd").read_text(encoding="utf-8")
checks = (root / "tests/port_checks.gd").read_text(encoding="utf-8")
assert (root / "project.godot").is_file()
assert (root / "scenes/Main.tscn").is_file()
assert (root / "data/v131_city_sample.json").is_file()

found = re.findall(r'preload\("(res://[^"]+)"\)', "\n".join(p.read_text(encoding="utf-8") for p in root.rglob("*.gd")))
missing = [x for x in found if not (root / x[6:]).is_file()]
assert not missing, f"Missing referenced source scripts: {missing}"

cities = json.loads((root / "data/v131_city_sample.json").read_text(encoding="utf-8"))["cities"]
assert len(cities) == 14
assert min(max(abs(a["c"] - b["c"]), abs(a["r"] - b["r"])) for i, a in enumerate(cities) for b in cities[i+1:]) >= 17
assert source.count('"age":') == 59
assert (root / "scripts/core/research_v125_port.gd").read_text().count('"age":') == 26
assert len(re.findall(r'^\s+_check\(', checks, re.M)) >= 658
assert 'v34-v153-large-city-144-tiles' in checks
assert 'CampaignPort.find_path(walkable,src,dst)' in main
assert 'Territory.rebuild(preview_state,land' in main
assert 'RoadsPort.record_world_step' in main
assert 'Trade.age_roads(state)' in (root / 'scripts/core/preview_sim_port.gd').read_text()
assert 'PortChecks.run()' in main
assert 'PreviewSim.tick(preview_state' in main
assert 'PreviewSim.save_preview' in main
assert 'PreviewSim.research_next' in main
assert (root / 'scripts/adapters/native_city_buildings.gd').exists()
assert (root / 'scripts/core/building_rules_port.gd').exists()
assert (root / 'scripts/core/labor_port.gd').exists()
assert (root / 'scripts/core/preview_ai_port.gd').exists()
for module in ('production_port.gd','demographics_port.gd','research_planner_port.gd'):
    assert (root / 'scripts/core' / module).exists(), module
sim = (root / 'scripts/core/preview_sim_port.gd').read_text()
assert 'Demographics.minute(city)' in sim
assert 'Production.run_cycle(city,b,production_dt,boost,true,navigator)' in sim
assert 'next_minute' in sim and 'next_ai' in sim
assert 'PreviewSim.tick(preview_state,delta,local_streets if street_nav_on else null,world_trade_nav,shared_landscape)' in main
assert 'Labor.allocation(city)' in (root / 'scripts/core/preview_sim_port.gd').read_text()
assert 'PreviewAI.advance(state,landscape)' in (root / 'scripts/core/preview_sim_port.gd').read_text()
assert '_fast_forward_preview()' in main
assert '_toggle_preview_ai()' in main
assert 'building_proxies.refresh' in main
assert 'BuildingRules.build_error' in (root / 'scripts/core/preview_sim_port.gd').read_text()
assert 'land.size() <= key' not in (root / 'scripts/core/counties_port.gd').read_text()
print("STATIC PACKAGE CHECKS: PASS")
print("59 core + 26 V125 research entries; V2.2 extended runtime test assertions (not executed); 14 sampled towns with spacing >=17")
print("Direct GDScript port modules:", len(list((root / 'scripts/core').glob('*.gd'))))
assert (root / 'scripts/core/market_households_port.gd').is_file()
assert 'Market.advance(city,dt,navigator)' in sim
assert 'market_woman' in (root / 'scripts/adapters/native_citizen_view.gd').read_text()
assert 'v131_godot_preview_v12.json' in sim
assert 'v131_godot_preview_v09.json' in sim
print("NOTE: GDScript syntax and Godot/Android runtime UNTESTED")

assert (root / 'scripts/core/cargo_port.gd').exists()
assert (root / 'scripts/adapters/native_cargo_view.gd').exists()
assert 'Cargo.advance(city,dt,navigator)' in sim

assert (root / 'scripts/adapters/local_street_nav.gd').is_file()
assert (root / 'scripts/adapters/native_street_view.gd').is_file()
assert 'AStarGrid2D.new()' in (root / 'scripts/adapters/local_street_nav.gd').read_text()
assert 'navigator.route_from_position' in (root / 'scripts/core/cargo_port.gd').read_text()
assert 'street_view.refresh' in main

assert (root/'scripts/core/citizen_agents_port.gd').exists()
assert (root/'scripts/adapters/native_citizen_view.gd').exists()
assert 'Citizens.advance(city,dt,navigator)' in sim
assert 'actual_work' in sim and 'builder_rate' not in sim
assert 'citizen_view.refresh' in main
assert 'Elanikud sisse / välja' in main
assert 'v131_godot_preview_v09.json' in sim
assert 'v131_godot_preview_v08.json' in sim
print('V0.9 CITIZEN/BUILDER INTEGRATION: PASS (static only)')

# 1.1 road caravans
assert (root / "scripts/core/trade_network_port.gd").is_file()
assert (root / "scripts/adapters/world_trade_nav.gd").is_file()
assert (root / "scripts/adapters/native_trade_view.gd").is_file()
assert 'Trade.advance(state,dt,world_nav)' in sim
assert '_setup_world_trade_nav()' in main
assert 'Trade.dispatch_pair' in main
assert 'trade_dispatched' in sim and 'trade_arrived' in sim
assert 'v11-caravan-save-roundtrip' in checks
print('V1.1 SAME-STATE WORLD TRADE: PASS (static only)')

# 1.2 basic military port: native grid armies and deliberately simplified combat test.
assert (root / 'scripts/core/military_port.gd').is_file()
assert (root / 'scripts/core/battle_preview_port.gd').is_file()
assert (root / 'scripts/adapters/native_army_view.gd').is_file()
assert 'Military.advance(state,step,world_nav)' in sim
assert 'BattlePreview.detect_encounter(state)' in sim
assert 'Military.setup(data)' in sim
assert '_army_demo()' in main and '_battle_demo()' in main
assert 'native_army_view.gd' in main
assert 'v12-save-training-army-march' in checks
assert 'v12-preview-training-in-game-loop' in checks
print('V1.2 MILITARY RECRUITMENT, GRID MARCH AND COMBAT PREVIEW: PASS (static only)')
