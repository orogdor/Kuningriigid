"""V48 lightweight quadrilateral-profile mesh generator.

Creates game-ready quad-derived triangulated geometry + GLB files.
This is a custom game asset workflow, NOT a claim of full Mudelitehas 0.1.2
reference-to-cloud certification. Budget: <=1000 source quads per complete model.
"""
from __future__ import annotations
import os, json, math
from pathlib import Path
import numpy as np
import trimesh
from PIL import Image, ImageDraw

OUT=Path(__file__).resolve().parents[1]
ASSETS=OUT/'models-v48';ASSETS.mkdir(exist_ok=True)
MODELS={};REPORT={}
class Model:
 def __init__(self,name): self.name=name;self.parts=[];self.quads=0
 def add(self,verts,quads,color,label):
  if not quads:return
  a=np.asarray(verts,float); q=np.asarray(quads,int); assert q.shape[1]==4
  self.parts.append((a,q,color,label));self.quads+=len(q)
 def tube(self,path,n=10,color='#745a3f',label='organic trunk',cap=True):
  # Ring profile is specified from front, side and plan axes before vertices are placed.
  vertices=[]; quads=[]
  for j,(cx,y,cz,rx,rz) in enumerate(path):
   for i in range(n):
    a=2*math.pi*i/n;f=1+.044*math.sin(i*7+j*2.7)
    vertices.append((cx+math.cos(a)*rx*f,y,cz+math.sin(a)*rz*f))
  for j in range(len(path)-1):
   for i in range(n):
    a=j*n+i;b=j*n+(i+1)%n;c=(j+1)*n+(i+1)%n;d=(j+1)*n+i
    quads.append((a,b,c,d))
  if cap:
   for k in [0,len(path)-1]:
    center=len(vertices);cx,y,cz,rx,rz=path[k];vertices.append((cx,y,cz))
    # Caps: split into triangle pairs represented as degenerate quads for quad budget tracking.
    for i in range(n):
     a=k*n+i;b=k*n+(i+1)%n;quads.append((center,a,b,b) if k==0 else (center,b,a,a))
  self.add(vertices,quads,color,label)
 def canopy(self,origin,scale=(1,1,1),rings=9,segs=12,color='#527a4f',label='canopy',rough=0.06):
  vertices=[];quads=[];cx,cy,cz=origin;rx,ry,rz=scale
  for j in range(rings+1):
   lat=-math.pi/2+j*math.pi/rings
   for i in range(segs):
    lon=i*2*math.pi/segs;f=1+rough*(.5*math.sin(3*lon+2*lat)+.45*math.sin(7*lon+lat))
    ring=math.cos(lat)*f
    vertices.append((cx+rx*math.cos(lon)*ring,cy+ry*math.sin(lat),cz+rz*math.sin(lon)*ring))
  for j in range(rings):
   for i in range(segs):quads.append((j*segs+i,j*segs+(i+1)%segs,(j+1)*segs+(i+1)%segs,(j+1)*segs+i))
  self.add(vertices,quads,color,label)
 def frond(self,p0,rad,angle,color='#6b824c',length=1.55,rows=8):
  vertices=[];quads=[]
  for j in range(rows+1):
   t=j/rows;s=math.sin(math.pi*t)**.8;dist=t*length
   x=p0[0]+math.cos(angle)*dist;y=p0[1]+math.sin(t*math.pi)*.42-(t*t)*.8;z=p0[2]+math.sin(angle)*dist
   width=rad*s
   for u in [-1,0,1]:
    vertices.append((x-math.sin(angle)*width*u,y+.12*(1-abs(u))*s,z+math.cos(angle)*width*u))
  for j in range(rows):
   for u in range(2):quads.append((j*3+u,j*3+u+1,(j+1)*3+u+1,(j+1)*3+u))
  self.add(vertices,quads,color,'palm leaf')
 def box(self,x,y,z,sx,sy,sz,color,label='architectural detail'):
  # Explicit quad-face block, reserved for architectural objects only.
  vv=[(x+a*sx/2,y+b*sy/2,z+c*sz/2) for a,b,c in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
  q=[(0,3,2,1),(4,5,6,7),(0,4,7,3),(1,2,6,5),(0,1,5,4),(3,7,6,2)]
  self.add(vv,q,color,label)
 def roof(self,sx,sz,height,color):
  vv=[(-sx/2,2,-sz/2),(sx/2,2,-sz/2),(sx/2,2,sz/2),(-sx/2,2,sz/2),(0,2+height,-sz/2),(0,2+height,sz/2)]
  q=[(0,4,5,3),(4,1,2,5),(3,2,1,0)]
  # Triangle ends represented as quad degenerates.
  q.extend([(0,1,4,4),(3,5,2,2)])
  self.add(vv,q,color,'roof topology')
 def export(self):
  assert 0<self.quads<=1000, (self.name,self.quads)
  scene=trimesh.Scene();flat=[]
  for idx,(v,q,c,label) in enumerate(self.parts):
   tris=[]
   for a,b,d,e in q:
    if a!=b and b!=d and d!=a:tris.append((a,b,d))
    if a!=d and d!=e and e!=a:tris.append((a,d,e))
   verts=v.astype(np.float32);faces=np.asarray(tris,dtype=np.int64)
   # Trimesh will export all parts as separate named GLB meshes.
   mesh=trimesh.Trimesh(vertices=verts,faces=faces,process=False)
   from trimesh.visual.material import PBRMaterial
   rgb=tuple(int(c[i:i+2],16) for i in (1,3,5))
   mesh.visual=trimesh.visual.TextureVisuals(material=PBRMaterial(baseColorFactor=list(rgb)+[255],metallicFactor=0,roughnessFactor=.98))
   scene.add_geometry(mesh,geom_name=f'{self.name}_{idx}_{label.replace(" ","_")}',node_name=f'{self.name}_{idx}')
   flat.append({'v':np.round(v,4).tolist(),'q':q.tolist(),'c':c,'label':label})
  (ASSETS/f'{self.name}.glb').write_bytes(scene.export(file_type='glb'))
  MODELS[self.name]=flat
  REPORT[self.name]={'quads':self.quads,'triangles':sum(sum(1 for a,b,c,d in q if len({a,b,c})==3)+sum(1 for a,b,c,d in q if len({a,c,d})==3) for _,q,_,_ in self.parts),'parts':len(flat),'glb_bytes':(ASSETS/f'{self.name}.glb').stat().st_size}

# Three-axis authoring recipe dimensions create the profile cloud directly.
# Each new tree is modeled from distinct height-profile and plan-profile controls.

def oak():
 m=Model('oak_1000_3')
 m.tube([(.0,.03,0,.16,.16),(.03,.2,0,.15,.14),(.0,.48,0,.13,.13),(.09,.75,.02,.115,.12),(.14,1.02,.02,.095,.10),(.17,1.25,.04,.06,.07)],12,'#77563d','bent trunk')
 for k in range(4):
  angle=(k*math.pi*.5+.3);cx,cz=math.cos(angle)*.38,math.sin(angle)*.37
  m.tube([(.12,.88,.02,.09,.10),(.14+cx*.4,1.11,cz*.4,.08,.08),(.13+cx*.85,1.30,cz*.83,.04,.04)],8,'#786141','structural branch')
 for i,(x,y,z,s) in enumerate([(-.48,1.55,.16,.79),(.52,1.58,.16,.75),(.07,1.86,-.3,.87),(.05,1.70,.52,.73),(.1,2.02,.14,.75)]):
  m.canopy((x,y,z),(s,s*.64,s*.78),8,12,['#597c46','#56824f','#719252','#3f6e48','#66884c'][i],rough=.09)
 m.export()

def pine():
 m=Model('pine_1000_3');m.tube([(0,.02,0,.16,.15),(.025,.40,0,.14,.14),(.06,1.03,.02,.12,.12),(.08,1.9,.01,.08,.08),(.06,2.88,0,.03,.04)],10,'#624e3b','tall trunk')
 for i,(yy,rx,sz,c) in enumerate([(.82,.82,1.25,'#3e7254'),(1.42,.66,.95,'#4e8360'),(2.0,.48,.74,'#4c745a'),(2.5,.28,.47,'#678a60')]):
  rings=[]
  for j in range(7):
   t=j/6;rad=rx*math.sin(math.pi*(t*.81+.08))*(1-t*.76)
   rings.append((.05,yy+sz*t,0,max(.02,rad),max(.02,rad)))
  m.tube(rings,12,c,'branch whorls')
 m.export()

def palm():
 m=Model('palm_1000_3');m.tube([(0,.03,0,.16,.15),(.06,.40,.01,.16,.14),(.16,.9,.04,.14,.13),(.25,1.5,.07,.13,.12),(.31,2.1,.1,.11,.10),(.32,2.45,.1,.09,.085)],12,'#998164','palm trunk')
 for i in range(9):m.frond((.32,2.47,.1),.18,math.pi*2*i/9,'#6b924d' if i%2 else '#4e7647',length=1.25+(i%3)*.15)
 m.export()

def cactus():
 m=Model('cactus_1000_3');m.tube([(0,.02,0,.24,.23),(0,.35,0,.25,.23),(.02,.9,0,.23,.22),(.01,1.53,0,.20,.20),(0,1.72,0,.10,.10),(0,1.79,0,.025,.025)],12,'#568665','main cactus')
 for angle,hh in [(0,.9),(math.pi,1.19)]:
  x=math.cos(angle)*.32;z=math.sin(angle)*.32
  m.tube([(.04,hh,0,.12,.12),(x,hh+.18,z,.12,.11),(x*1.5,hh+.30,z*1.5,.10,.10),(x*1.5,hh+.60,z*1.5,.09,.09),(x*1.5,hh+.70,z*1.5,.02,.02)],8,'#6a986b','branch arm')
 m.export()

def rock():
 m=Model('rock_1000_3')
 for i in range(3):
  x,z,scale=[(-.33,.05,1.1),(.46,.19,.76),(.1,-.49,.56)][i]
  m.canopy((x,.44*scale,z),(scale*.66,scale*.54,scale*.76),rings=5,segs=9,color=['#88938a','#9ca397','#777f78'][i],rough=.24)
 m.export()

def hut():
 m=Model('timber_house_1000_3')
 m.box(0,1,0,2.8,2.0,2.8,'#b3a184','plastered home');m.roof(3.25,3.25,1.25,'#7f5f4c')
 for xx in [-1.3,1.3]:
  for zz in [-1.27,1.27]:m.box(xx,.99,zz,.15,1.96,.16,'#77533d','wood frame')
 for xx in [-1.1,1.1]:m.box(xx,1.05,1.47,.58,.62,.08,'#405e5b','window glass')
 m.box(0,.73,1.47,.75,1.48,.1,'#694b37','front door')
 for y in [.5,1.9]:m.box(0,y,-1.48,2.75,.1,.1,'#76513b','crossbar')
 m.box(-.03,2.0,-.02,3.5,.12,3.3,'#564839','roof ridge support')
 m.export()

def market():
 m=Model('market_1000_3')
 m.box(0,.22,0,3.7,.25,2.6,'#a28b70','stone platform')
 for x in [-1.45,1.45]:
  for z in [-.95,.95]:m.box(x,1.45,z,.14,2.7,.14,'#735239','support post')
 # market tent roof grid warped in two dimensions: each quad has real area, not a primitive cone.
 vv=[];qq=[];nx=12;nz=10
 for j in range(nz+1):
  z=-1.65+j*3.3/nz
  for i in range(nx+1):
   x=-2+j*0+ i*4/nx;peak=1-abs(x/2)
   y=2.55+peak*.80+math.sin(i*.8+j*.6)*.035
   vv.append((x,y,z))
 for j in range(nz):
  for i in range(nx):qq.append((j*(nx+1)+i,j*(nx+1)+i+1,(j+1)*(nx+1)+i+1,(j+1)*(nx+1)+i))
 m.add(vv,qq,'#b87d54','textile canopy')
 for x in [-1.0,0,1.0]:m.box(x,.56,.60,.68,.58,.75,'#8d6847','goods stall')
 m.export()

def windmill():
 m=Model('windmill_1000_3')
 m.tube([(0,.02,0,.85,.85),(0,.6,0,.77,.77),(0,1.4,0,.62,.62),(0,2.35,0,.48,.49),(0,2.95,0,.45,.45)],12,'#c1af91','masonry tower')
 m.canopy((0,3.06,0),(.68,.38,.69),6,12,'#8b5d42','roof crown')
 for a in range(4):
  theta=a*math.pi/2;y=2.28+math.sin(theta)*.82;x=math.cos(theta)*.82
  m.box(x,y,0,.27,1.33,.12,'#8e795f','windmill blade')
 m.export()

def main():
 for fn in [oak,pine,palm,cactus,rock,hut,market,windmill]:fn()
 manifest={'workflow':'custom quad-profile world assets, adapted 1000/3 design budget (not certified Mudelitehas 0.1.2 image-based reconstruction)','models':REPORT}
 (ASSETS/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
 with (ASSETS/'mesh-data.js').open('w') as f:
  f.write('// V48 quadrilateral-authored asset geometry; same mesh data exported to downloadable GLBs.\nexport const MODEL_MESHES=')
  json.dump(MODELS,f,separators=(',',':'));f.write(';\n')
 print(json.dumps(REPORT,indent=2))
if __name__=='__main__':main()
