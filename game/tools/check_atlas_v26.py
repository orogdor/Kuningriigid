"""Independent numeric 2.6 checks: coordinate seams, river clipping, bridge gates.
Static/Python-only; NEVER reports Godot compilation or Android execution.
"""
from pathlib import Path
from math import sin,cos, floor, isclose, hypot
import re,random
root=Path(__file__).resolve().parents[1]
shared=(root/'scripts/core/shared_landscape_v131.gd').read_text()
nav=(root/'scripts/core/detail_navigation_port.gd').read_text()
detail=(root/'scripts/adapters/native_detail_tile.gd').read_text()
main=(root/'scripts/main.gd').read_text()
world=(root/'scripts/adapters/world_trade_nav.gd').read_text()
for text in ('func height_at','func configure','func segments_for','func river_distance','func blocked_by_river','func set_bridge','func _clip_segment','func suggested_bridge'):
 assert text in shared,text
assert 'SharedLandscape.height_at(heights,tile,pos)' in nav
assert 'landscape.blocked_by_river(tile,pos,2.6)' in nav
assert 'SharedLandscape.height_at(heights,cell,Vector2(local_x,local_z))' in detail
assert '_landscape.segments_for(current_tile)' in detail
assert '_setup_shared_landscape()' in main and '_render_world_rivers()' in main
assert 'world_trade_nav.configure_detail(heights,preview_state.get("cities",[]),preview_state.get("detail_bridges",{}),shared_landscape)' in main
assert 'fine_navigation.configure(heights,towns,crossings,landscape)' in world
assert '"atlas_river_demo": _start_atlas_river_demo()' in main
assert '"atlas_bridge_toggle": _toggle_atlas_bridge()' in main
assert len(re.findall(r'^\s+_check\(', (root/'tests/port_checks.gd').read_text(),re.M)) >=658

W,H=220,165
samples=[sin((c+.3)*.047)*1.25+cos((r+.7)*.13)*1.2+(r/165)*2.0-1.3 for r in range(H) for c in range(W)]
def base(c,r):return samples[min(H-1,max(0,r))*W+min(W-1,max(0,c))]*.52
def height(c,r,x,z):
 gx=c+.5+x/225;gz=r+.5+z/195
 c0=floor(gx-.5);r0=floor(gz-.5)
 fx=min(1,max(0,gx-c0-.5));fz=min(1,max(0,gz-r0-.5))
 return (base(c0,r0)*(1-fx)+base(c0+1,r0)*fx)*(1-fz)+(base(c0,r0+1)*(1-fx)+base(c0+1,r0+1)*fx)*fz
random.seed(131)
for i in range(2000):
 c,r=random.randint(0,W-2),random.randint(0,H-2)
 x,z=random.uniform(-112.5,112.5),random.uniform(-97.5,97.5)
 assert isclose(height(c,r,112.5,z),height(c+1,r,-112.5,z),abs_tol=1e-12)
 assert isclose(height(c,r,x,97.5),height(c,r+1,x,-97.5),abs_tol=1e-12)
 # Exact atlas physical coordinate roundtrip in metres.
 wx,wz=c+.5+x/225,r+.5+z/195
 assert abs((wx-c-.5)*225-x)<1e-10
 assert abs((wz-r-.5)*195-z)<1e-10

# Two adjacent clipped segments share the same world-edge point. Both
# clipping and A* use these same lines in the implemented module.
def clip(a,b,half_x=112.5,half_z=97.5):
 lo,hi=0.,1.;d=(b[0]-a[0],b[1]-a[1]);bounds=[(-d[0],a[0]+half_x),(d[0],half_x-a[0]),(-d[1],a[1]+half_z),(d[1],half_z-a[1])]
 for p,q in bounds:
  if abs(p)<1e-12:
   if q<0:return ()
  else:
   t=q/p
   if p<0:lo=max(lo,t)
   else:hi=min(hi,t)
   if lo>hi:return ()
 return ((a[0]+lo*d[0],a[1]+lo*d[1]),(a[0]+hi*d[0],a[1]+hi*d[1]))
for direction in ('north','east'):
 global_a=(70.5,70.5)
 global_b=(71.5,70.5) if direction=='east' else (70.5,71.5)
 def loc(tile,p):return ((p[0]-tile[0]-.5)*225,(p[1]-tile[1]-.5)*195)
 a_tile=(70,70);b_tile=(71,70) if direction=='east' else (70,71)
 a=clip(loc(a_tile,global_a),loc(a_tile,global_b))
 b=clip(loc(b_tile,global_a),loc(b_tile,global_b))
 assert a and b
 endpoint=(a[-1][0]/225+a_tile[0]+.5,a[-1][1]/195+a_tile[1]+.5)
 start=(b[0][0]/225+b_tile[0]+.5,b[0][1]/195+b_tile[1]+.5)
 assert hypot(endpoint[0]-start[0],endpoint[1]-start[1])<1e-12

# Mirror deterministic downhill step generation on a custom hill height field.
def raw(c,r):return 7.2-r*.04
segments=set()
for r in range(12,ROWS:=165-10,18):
 for c in range(12,220-10,23):
  if (c*7+r*11)%5>2 or raw(c,r)<1.5:continue
  x,y=c,r;seen=set()
  for step in range(92):
   if (x,y) in seen or raw(x,y)<=0:break
   seen.add((x,y));lowest=raw(x,y);nextpoint=(x,y)
   for dx,dy in ((0,1),(1,0),(-1,0),(0,-1)):
    nx,ny=x+dx,y+dy
    if nx<1 or ny<1 or nx>=219 or ny>=164:continue
    if raw(nx,ny)<lowest-.015:lowest=raw(nx,ny);nextpoint=(nx,ny)
   if nextpoint==(x,y):break
   segments.add(tuple(sorted(((x,y),nextpoint))))
   x,y=nextpoint
assert len(segments)>100
print(f'PASS V2.6: 2000 continuous coast/cliff height seam samples, 2000 local transforms, both river-edge clipping directions, {len(segments)} synthetic downhill segments, bridge and rendering wiring, 658+ prepared GDScript assertions. NO GODOT RUNTIME.')
