"""Non-engine V2.5 verification: graph connectivity, source wiring and save format.
This deliberately does NOT claim to compile GDScript or run Godot on Android.
"""
from pathlib import Path
from collections import deque
from math import hypot
import re
root=Path(__file__).resolve().parents[1]
nav=(root/'scripts/core/detail_navigation_port.gd').read_text()
log=(root/'scripts/core/county_logistics_port.gd').read_text()
main=(root/'scripts/main.gd').read_text()
detail=(root/'scripts/adapters/native_detail_tile.gd').read_text()
tests=(root/'tests/port_checks.gd').read_text()
world=(root/'scripts/adapters/world_trade_nav.gd').read_text()
for signal in ['AStarGrid2D.new()','get_id_path(start,goal)','_obstacles(tile)','_water(tile,loc)','_closest_free','sample_track','"bridge_width"']:
    assert signal in nav,signal
for signal in ['world_nav.detail_edge','"detail_points"','"detail_ratio"','DetailNavigation.sample_track','"detail_version"','_new_shipment']:
    assert signal in log,signal
for signal in ['func configure_detail','func detail_edge','fine_navigation.edge']:
    assert signal in world,signal
assert '_configure_fine_navigation()' in main
assert '"bridge_demo": _start_bridge_demo()' in main
assert '"bridge_toggle": _toggle_bridge_demo()' in main
assert 'preview_state.get("detail_bridges",{})' in main
assert '_create_test_water_crossing()' in detail
assert len(re.findall(r'^\s+_check\(',tests,re.M))>=658
# Test a numerical analogue of the 45x39 local grid at 5m resolution.
# Vertical river spans x=-5..5; the 12m crossing at z=0 is the ONLY opening.
W,H=45,39
blocked=set()
for z in range(H):
 for x in range(W):
  wx=-110+5*x;wz=-95+5*z
  if abs(wx)<=5 and abs(wz)>6:blocked.add((x,z))

def reachable(start,target,wall):
 seen={start};todo=deque([start]);
 while todo:
  x,z=todo.popleft()
  if (x,z)==target:return True
  for p in ((x-1,z),(x+1,z),(x,z-1),(x,z+1)):
   if p not in seen and 0<=p[0]<W and 0<=p[1]<H and p not in wall:
    seen.add(p);todo.append(p)
 return False
assert reachable((8,19),(36,19),blocked)
assert not reachable((8,19),(36,19),blocked|{(x,z) for x in range(21,24) for z in range(18,21)})
# Buildings should be diverted around, but not invalidate the entire map.
lot={(x,z) for x in range(19,26) for z in range(16,23)}
assert reachable((4,19),(40,19),lot)
print('PASS V2.5: 45x39 graph crossing/bridge closure, building detour, runtime wiring, 458 prepared GDScript test assertions. STATIC/PYTHON ONLY')
