"""V2.3 static source/wiring checks, NOT Godot execution."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
main=(root/'scripts/main.gd').read_text()
sim=(root/'scripts/core/preview_sim_port.gd').read_text()
logic=(root/'scripts/core/county_logistics_port.gd').read_text()
visual=(root/'scripts/adapters/native_county_logistics_view.gd').read_text()
detail=(root/'scripts/adapters/native_detail_tile.gd').read_text()
tests=(root/'tests/port_checks.gd').read_text()
assert len(re.findall(r'^\s+_check\(',tests,re.M))>=658
assert 'CountyLogistics.advance_city(state,city,dt,world_nav)' in sim
assert 'var remote_cycles: int = Territory.advance_worksites(city,dt)' in sim
assert 'var accepted: float' in logic and 'stock[good] = float(stock.get(good,0.0))+accepted' in logic
assert logic.index('for idx in range(shipments.size()-1,-1,-1):')<logic.index('for i in range(worksites.size()):')
assert 'site["pending"] = float(site.get("pending",0.0))+amount' in logic
assert 'Roads.record_world_step(roads,here,dest,kind,now)' in logic
assert 'worker["status"]' in logic and 'world_nav.route' in logic
assert 'county_shipments' in sim and 'v131_godot_preview_v23.json' in sim
assert 'v131_godot_preview_v22.json' in sim
assert '_setup_county_logistics_view()' in main
assert 'county_logistics_view.refresh(preview_state,heights)' in main
assert 'v131_godot_measurements_v33.csv' in main
assert 'county_world_steps,county_deliveries,county_goods_delivered' in main
assert 'refresh_county_movers' in detail and 'CountyWorkers' in visual
assert '"county_demo": _start_county_demo()' in main
assert '"county_demo_reset": _stop_county_demo()' in main
assert 'if not county_demo_backup.is_empty():' in main
for name in ['v23-no-teleported-rural-stock','v23-cargo-actually-arrived',
             'v23-full-warehouse-prevents-minting','v23-blocked-crossing-no-production',
             'v23-state-roundtrip-cargo-and-worker']:
    assert name in tests, name
print('PASS: V2.3 county routes, deferred stock, Multimesh views, save migration, demo and benchmark wired (static only)')
