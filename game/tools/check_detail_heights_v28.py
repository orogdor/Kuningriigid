"""Independent numeric and structural checks, NOT a Godot compile."""
from pathlib import Path
import json,math,struct,random,re
r=Path(__file__).resolve().parents[1]
raw=(r/'data/v131_earth_seed131_atlas.bin').read_bytes()
assert raw[:4]==b'K131'
w,h,seed=struct.unpack_from('<III',raw,4)
assert (w,h,seed)==(220,165,131)
stride=13
heights=[struct.unpack_from('<f',raw,20+i*stride)[0] for i in range(w*h)]
def sample(cx,cy):
 if cx<0 or cy<0 or cx>=w or cy>=h:return -2.
 return heights[cy*w+cx]
def world(gx,gz):
 fx=gx-.5;fz=gz-.5;c=math.floor(fx);rr=math.floor(fz)
 u=fx-c;v=fz-rr;u=u*u*(3-2*u);v=v*v*(3-2*v)
 a=sample(c,rr);b=sample(c+1,rr);d=sample(c,rr+1);e=sample(c+1,rr+1)
 return ((a*(1-u)+b*u)*(1-v)+(d*(1-u)+e*u)*v)*.52
def h9(c,rr):
 return [round(world(c+i/8,rr+j/8),3) for j in range(9) for i in range(9)]
def interpolated(s,x,z):
 fx=min(8.,max(0.,(x/225+.5)*8));fz=min(8.,max(0.,(z/195+.5)*8));c=min(7,math.floor(fx));rr=min(7,math.floor(fz));u=fx-c;v=fz-rr
 return (s[rr*9+c]*(1-u)+s[rr*9+c+1]*u)*(1-v)+(s[(rr+1)*9+c]*(1-u)+s[(rr+1)*9+c+1]*u)*v
random.seed(131)
for _ in range(1200):
 c=random.randint(2,217);rr=random.randint(2,162);x=random.uniform(-97.5,97.5);z=random.uniform(-87,87)
 a=h9(c,rr);b=h9(c+1,rr);d=h9(c,rr+1)
 assert abs(interpolated(a,112.5,z)-interpolated(b,-112.5,z))<1e-6
 assert abs(interpolated(a,x,97.5)-interpolated(d,x,-97.5))<1e-6
script=(r/'scripts/core/detail_heights_v131.gd').read_text()
assert 'samples[j*N+i]' in script and 'MAX_CACHE: int = 64' in script and 'MAX_BUILD_SLOPE' in script
main=(r/'scripts/main.gd').read_text();assert 'local_streets.landscape = shared_landscape' in main
assert '"height9_info": _show_height9_info()' in main
assert 'PreviewSim.build_in_town(preview_state,city_index,kind,shared_landscape)' in main
assert 'PreviewAI.advance(state,landscape)' in (r/'scripts/core/preview_sim_port.gd').read_text()
assert 'CityLayout.find_free_site(city,kind,lots,landscape)' in (r/'scripts/core/preview_ai_port.gd').read_text()
assert 'landscape.height_grid.traversable' in (r/'scripts/core/detail_navigation_port.gd').read_text()
assert 'landscape.detail_height(current_tile' in (r/'scripts/adapters/native_detail_tile.gd').read_text()
print('PASS V2.8: 1200 random east/west and 1200 north/south 9x9 edge continuity trials; shared 3D, A*, AI and user placement wiring (static only).')
