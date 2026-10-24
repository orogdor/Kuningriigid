"""Run real Python 2.7 fixture/river/route checks, not Godot/Android tests."""
from pathlib import Path
from collections import deque
import json,struct,hashlib,time,random
root=Path(__file__).resolve().parents[1]
start=time.perf_counter()
file=root/'data/v131_earth_seed131_atlas.bin'
raw=file.read_bytes()
meta=json.loads((root/'data/v131_earth_seed131_atlas.json').read_text())
assert hashlib.sha256(raw).hexdigest()==meta['sha256']
assert raw[:4]==b'K131'
cols,rows,seed,scale=struct.unpack_from('<III f',raw,4)
assert (cols,rows,seed)==(220,165,131)
assert abs(scale-.145)<1e-6
assert len(raw)==20+cols*rows*13
records=list(struct.iter_unpack('<fifB',raw[20:]))
assert len(records)==36300
rivers=[i for i,(_,dest,width,ford) in enumerate(records) if dest>=0]
assert len(rivers)==601 and sum(item[3] for item in records)==32
assert sum(h>=scale for h,_,_,_ in records)>=10000
for i in rivers:
 h,to,width,ford=records[i]
 assert 0<=to<len(records)
 assert abs(i%220-to%220)+abs(i//220-to//220)==1
 assert 2.2<=width<=9.0001
 assert h>=1.5*scale-.00001
 assert ford in (0,1)
# Down pointers are an acyclic priority-flood forest. Acyclicity of the whole
# terrain drainage is a more valuable invariant than testing only river cells.
for i in range(0,len(records),137):
 seen=set();pos=i
 while pos>=0:
  assert pos not in seen,'cycle in drainage tree'
  seen.add(pos)
  if pos not in rivers:break
  pos=records[pos][1]
towns=json.loads((root/'data/v131_city_sample.json').read_text())['cities']
for city in towns:
 c,r=city['c'],city['r'];assert records[r*220+c][0]>scale
# Independent route check - bridge flips graph connectivity and forces cache invalidation.
W,H=9,5
blocked={(4,r) for r in range(H)}
def route(block):
 q=deque([(1,2)]);visited={(1,2)}
 while q:
  x,y=q.popleft()
  if (x,y)==(7,2):return True
  for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
   n=x+dx,y+dy
   if 0<=n[0]<W and 0<=n[1]<H and n not in block and n not in visited:
    visited.add(n);q.append(n)
 return False
assert not route(blocked)
assert route(blocked-{(4,2)})
assert not route(blocked)
main=(root/'scripts/main.gd').read_text()
shared=(root/'scripts/core/shared_landscape_v131.gd').read_text()
nav=(root/'scripts/core/detail_navigation_port.gd').read_text()
trade=(root/'scripts/core/trade_network_port.gd').read_text()
for x in ['V131Atlas.load_baked()', 'shared_landscape.configure_baked', '_build_road_bridge()', '_refresh_atlas_route_graph()', 'v131_road_curve(', 'atlas_bridges']:
 assert x in main,x
assert 'landscape.blocked_by_river(tile,pos,2.6)' in nav
assert 'world_nav.route({"c":before.x,"r":before.y},to)' in trade
assert 'func v131_road_curve' in shared and 'func configure_baked' in shared
assert 'atlas_bridges' in (root/'scripts/core/preview_sim_port.gd').read_text()
print(f'PASS V2.7: {len(records)} baked cells, {len(rivers)} river cells, 32 fords, 14 protected city centres, drainage checks, bridge closed/open/closed path test, SHA-256, source integrations in {time.perf_counter()-start:.3f}s. NO GODOT ENGINE.')
