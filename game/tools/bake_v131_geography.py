#!/usr/bin/env python3
"""Bake a reproducible V131 Earth-map test fixture.
References pinned V131 SHA 26562368f56a32616651a266ed2d8c87f06d43d1:
 game.js smooth()/noise(), earth-map.js earthHeight(), campaign.js makeGrid(),
 world-geography.js buildDrainage(), landscape-shared.js pointsOfRiver().
This fixture uses 14 legacy Godot test cities as extra protected starter sites,
NOT the original game state or a random-new-game map. No third-party libs.
"""
from pathlib import Path
import ast, heapq, json, math, re, struct, hashlib, random, sys
ROOT=Path(__file__).resolve().parents[1]
COLS=220; ROWS=165; SEED=131; SCALE=.145; INDEX=lambda c,r:r*COLS+c
polytext=(ROOT/'scripts/main.gd').read_text().split('const EARTH_POLYGONS = ',1)[1].split('\n\nvar heights',1)[0]
POLYS=ast.literal_eval(polytext)
TOWNS=json.loads((ROOT/'data/v131_city_sample.json').read_text())['cities']
def noise(x,z):
 n=math.sin(x*127.1+z*311.7+SEED*.017)*43758.5453
 return n-math.floor(n)
def smooth(x,z):
 i=math.floor(x);j=math.floor(z);u=x-i;v=z-j;u=u*u*(3-2*u);v=v*v*(3-2*v)
 return ((noise(i,j)*(1-u)+noise(i+1,j)*u)*(1-v)+(noise(i,j+1)*(1-u)+noise(i+1,j+1)*u)*v)
def signed_dist(u,v,poly):
 inside=False; distance=float('inf')
 for i in range(len(poly)):
  a,b=poly[i];c,d=poly[i-1]
  if ((b>v)!=(d>v)) and u<(c-a)*(v-b)/(d-b)+a:inside=not inside
  dx=c-a;dy=d-b;t=max(0,min(1,((u-a)*dx+(v-b)*dy)/(dx*dx+dy*dy)))
  distance=min(distance,math.hypot(u-a-t*dx,v-b-t*dy))
 return distance if inside else -distance
def earth_height(c,r):
 x=-650+(c+.5)*50;z=-550+(r+.5)*50
 u=(x+650)/11000;v=(z+550)/8250
 coast=max(signed_dist(u,v,poly) for poly in POLYS)
 coast+=(smooth(u*65+74,v*65+11)-.5)*.014+(smooth(u*140+91,v*140+48)-.5)*.004
 relief=smooth(x/190+400,z/190+300)
 h=min(30,coast*1000)*(.35+relief*.9) if coast>0 else max(-26,coast*900)
 # V131 civilization-core.js starter-site protection: 125 atlas-m radius.
 # Extra starter sites = all 14 synthetic Godot test cities, not original game.
 d=min(math.hypot(c-t['c'],r-t['r'])*50 for t in TOWNS)
 if d<125:
  if h>0:h=max(9,min(19,h))
  elif d<85:h=max(10,min(19,h))
  else:h=max(9,h)
 return h
# Boundary world samples are raw V131 centre heights, not already 'atlasHeight'.
heights=[earth_height(c,r) for r in range(ROWS) for c in range(COLS)]
LAND=[h>=1.0 for h in heights]; MOUNTAIN=[h>30 for h in heights]
# V131 world-geography.js priority flood, with deterministic queue insertion IDs
# corresponding to Heap.push() order. Accumulation runs in reverse extraction order.
visited=[False]*len(heights);down=[-1]*len(heights);order=[];filled=[0.0]*len(heights);heap=[];push_index=0
def push(e,i):
 global push_index
 heapq.heappush(heap,(e,push_index,i));push_index+=1
def seed(i):
 if visited[i]:return
 visited[i]=True;filled[i]=heights[i];push(filled[i],i)
for r in range(ROWS):
 for c in range(COLS):
  i=INDEX(c,r)
  if (not LAND[i]) or c==0 or r==0 or c==COLS-1 or r==ROWS-1:seed(i)
while heap:
 elevation,_,i=heapq.heappop(heap);order.append(i);c=i%COLS;r=i//COLS
 for dc,dr in ((1,0),(-1,0),(0,1),(0,-1)):
  x=c+dc;y=r+dr
  if x<0 or x>=COLS or y<0 or y>=ROWS:continue
  j=INDEX(x,y)
  if visited[j]:continue
  visited[j]=True;down[j]=i;new_e=max(heights[j],elevation+.00001);filled[j]=new_e;push(new_e,j)
assert len(order)==len(heights)
acc=[1]*len(heights)
for i in reversed(order):
 if down[i]>=0:acc[down[i]]+=acc[i]
river_dest=[-1]*len(heights);river_width=[0.0]*len(heights);ford=[False]*len(heights)
for i,h in enumerate(heights):
 r,c=divmod(i,COLS)
 if not LAND[i] or down[i]<0 or acc[i]<37 or h<1.5:continue
 if any(abs(c-t['c'])+abs(r-t['r'])<2 for t in TOWNS):continue
 river_dest[i]=down[i]
 river_width[i]=max(2.2,min(9,1.7+math.sqrt(acc[i])*.31))
 is_regular=acc[i]<250 and (round(acc[i]+noise(c*7,r*17)*29)%13==0)
 ford[i]=not MOUNTAIN[i] and (is_regular or any(abs(c-t['c'])+abs(r-t['r'])<=3 for t in TOWNS))
# File: 4-byte magic, dimensions, seed, float display scale;
# each record: float32 h in Godot scale, int32 downstream index, float32 riverWidth in metres, uint8 ford.
filename=ROOT/'data/v131_earth_seed131_atlas.bin'
with filename.open('wb') as f:
 f.write(b'K131');f.write(struct.pack('<III f',COLS,ROWS,SEED,SCALE))
 for i,h in enumerate(heights):f.write(struct.pack('<fifB',h*SCALE,river_dest[i],river_width[i],int(ford[i])))
metadata={"source_repo":"orogdor/Kuningriigid","source_commit":"26562368f56a32616651a266ed2d8c87f06d43d1", "preset":"earth","seed":SEED,"width":COLS,"height":ROWS,"display_scale":SCALE,"format":"K131 + 3x uint32 + float32 scale + 36300x (float32 height, int32 downstream index, float32 width metres, uint8 ford)","river_threshold":37,"legacy_fixture_extra_protected_city_sites":len(TOWNS),"sha256":hashlib.sha256(filename.read_bytes()).hexdigest(),"river_cells":sum(d>=0 for d in river_dest),"ford_cells":sum(ford),"land_cells":sum(LAND)}
(ROOT/'data/v131_earth_seed131_atlas.json').write_text(json.dumps(metadata,indent=2),encoding='utf8')
print('BAKED',filename,filename.stat().st_size,'bytes',metadata)
