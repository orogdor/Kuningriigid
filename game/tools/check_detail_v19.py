"""Behavioral math & static integration checks, NOT Godot compilation."""
from pathlib import Path
import math,re,json
root=Path(__file__).resolve().parents[1]
s=(root/'scripts/main.gd').read_text()
d=(root/'scripts/adapters/native_detail_tile.gd').read_text()
cities=json.loads((root/'data/v131_city_sample.json').read_text())['cities']
assert len(cities)==14
required=['func _world_tap(', 'func _open_detail_tile(', 'func _show_world_map(', 'func _show_city_view(', 'func _detail_neighbor(', 'func _screen_point_on_ground(', 'func _update_world_selection_marker(', 'func _detail_tap(']
for name in required: assert name in s,name
assert 'world_selection_marker' in s
assert 'native_detail_tile.show_tile(cell,preview_state.get("cities",[]),heights,local_streets if street_nav_on else null,preview_state.get("detail_bridges",{}),shared_landscape)' in s
assert 'native_detail_tile.describe_point(point)' in s
assert 'native_detail_tile.visible = false' in s
assert 'node.visible = false' in s
assert 'node.visible = bool(entry["was_visible"])' in s
assert 'if mobile_view == "detail"' in s
assert 'DetailTile.CONT' not in s
assert 'TILE_WIDTH: float = 225.0' in d
assert 'TILE_DEPTH: float = 195.0' in d
assert 'var water_triangles: int = 0' in d
assert 'if water_triangles > 0:' in d
assert 'if _has_town:' in d
assert 'func continuous_height(' in d
assert 'if absf(local.x)>TILE_WIDTH*.5 or absf(local.y)>TILE_DEPTH*.5' in d
# Mirror the deterministic coordinate-based height sampling mathematically,
# checking cross-tile continuity with non-flat sample data.
W,H=220,165
heights=[(math.sin(i*.027)+math.cos(i*.019))*1.1 for i in range(W*H)]
def source(x,y):return heights[max(0,min(H-1,y))*W+max(0,min(W-1,x))]*.52
def hh(c,r,x,z):
 gx=c+.5+x/225;gz=r+.5+z/195
 c0=math.floor(gx-.5);r0=math.floor(gz-.5)
 fx=max(0,min(1,gx-c0-.5));fz=max(0,min(1,gz-r0-.5))
 h0=source(c0,r0)*(1-fx)+source(c0+1,r0)*fx
 h1=source(c0,r0+1)*(1-fx)+source(c0+1,r0+1)*fx
 height=h0*(1-fz)+h1*fz
 n=math.sin(gx*29.3+gz*8.1)*math.cos(gz*23.7-gx*12.0)*.21
 return height+n*max(0,min(1,height+.35))
for c,r in ((0,0),(87,105),(140,40),(218,163)):
 for v in (-97.5,-40,0,40,97.5):
  assert math.isclose(hh(c,r,112.5,v),hh(c+1,r,-112.5,v),abs_tol=1e-12),f'E-W seam {c},{r}'
 for v in (-112.5,-50,0,70,112.5):
  assert math.isclose(hh(c,r,v,97.5),hh(c,r+1,v,-97.5),abs_tol=1e-12),f'N-S seam {c},{r}'
for city in cities:
 assert 0<=city['c']<W and 0<=city['r']<H
 assert len([a for a in cities if a['c']==city['c'] and a['r']==city['r']])==1
print('PASS: world-to-detail control wiring, 14 city location keys, coast/terrain seam math (40 samples), restoration and water mesh guards.')
print('NOTE: Godot syntax / engine / Android runtime NOT executed')
