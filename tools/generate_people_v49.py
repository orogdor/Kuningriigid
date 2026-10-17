"""V49 quad-based, level-2 inspired game character generator.
Six manually proportioned rig sections, each with side/front/top control data.
This uses original procedural references and a 1000-quad budget; it does NOT
claim full Mudelitehas 0.1.2 external-image cloud reconstruction certification.
"""
import json, math, numpy as np, trimesh
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'models-v49';OUT.mkdir(exist_ok=True)
SKIN='#b88d69'; SKIN2='#c9a17d'; DARK='#504236'; METAL='#89989c'; HAIR='#42362d'

class Model:
 def __init__(self,name,palette):self.name=name;self.palette=palette;self.sections={k:[] for k in ['body','head','leftArm','rightArm','leftLeg','rightLeg']};self.quads=0;self.source={}
 def mesh(self,section,verts,quads,color,label):
  if not quads:return
  v=np.array(verts,dtype=float);q=np.array(quads,dtype=int)
  assert q.shape[1]==4
  self.sections[section].append({'v':np.round(v,4).tolist(),'q':q.tolist(),'c':color,'label':label});self.quads+=len(q)
 def tube(self,section,rings,color,label,n=8,cap=True):
  # Each ring: (center x, center y, center z, x radius, z radius).
  v=[];q=[]
  for j,(cx,y,cz,rx,rz) in enumerate(rings):
   for i in range(n):
    a=2*math.pi*i/n;v.append((cx+rx*math.cos(a),y,cz+rz*math.sin(a)))
  for j in range(len(rings)-1):
   for i in range(n):q.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
  if cap:
   for j in [0,len(rings)-1]:
    center=len(v);cx,y,cz,_,_=rings[j];v.append((cx,y,cz))
    for i in range(n):
     a=j*n+i;b=j*n+(i+1)%n
     q.append((center,a,b,b) if j==0 else (center,b,a,a))
  self.mesh(section,v,q,color,label)
 def box(self,section,x,y,z,w,h,d,color,label):
  v=[(x+a*w/2,y+b*h/2,z+c*d/2) for a,b,c in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
  q=[(0,3,2,1),(4,5,6,7),(0,4,7,3),(1,2,6,5),(0,1,5,4),(3,7,6,2)]
  self.mesh(section,v,q,color,label)
 def ellipsoid(self,section,x,y,z,rx,ry,rz,color,label,n=8,rings=4):
  v=[];q=[]
  for j in range(rings+1):
   lat=-math.pi/2+j*math.pi/rings
   for i in range(n):
    a=i*2*math.pi/n;v.append((x+rx*math.cos(lat)*math.cos(a),y+ry*math.sin(lat),z+rz*math.cos(lat)*math.sin(a)))
  for j in range(rings):
   for i in range(n):q.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
  self.mesh(section,v,q,color,label)
 def export(self):
  assert self.quads<=1000,(self.name,self.quads)
  scene=trimesh.Scene();origin={'body':(0,0,0),'head':(0,1.32,0),'leftArm':(-.265,1.16,0),'rightArm':(.265,1.16,0),'leftLeg':(-.135,.77,0),'rightLeg':(.135,.77,0)}
  for section,parts in self.sections.items():
   for i,p in enumerate(parts):
    tris=[]
    for a,b,c,d in p['q']:
     if len({a,b,c})==3:tris.append((a,b,c))
     if len({a,c,d})==3:tris.append((a,c,d))
    v=np.array(p['v'],dtype=float)+np.array(origin[section]); q=np.asarray(tris,dtype=np.int64)
    mesh=trimesh.Trimesh(vertices=v,faces=q,process=False)
    rgb=[int(p['c'][k:k+2],16) for k in (1,3,5)];mesh.visual.vertex_colors=np.tile(rgb+[255],(len(v),1))
    scene.add_geometry(mesh,geom_name=f'{self.name}_{section}_{i}',node_name=f'{section}_{i}')
  (OUT/f'{self.name}_1000_2.glb').write_bytes(scene.export(file_type='glb'))
  return {'quads':self.quads,'triangles':sum(sum(1 for a,b,c,d in p['q'] if len({a,b,c})==3)+sum(1 for a,b,c,d in p['q'] if len({a,c,d})==3) for parts in self.sections.values() for p in parts),'sections':{k:sum(len(p['q']) for p in ps) for k,ps in self.sections.items()},'size':(OUT/f'{self.name}_1000_2.glb').stat().st_size}

ROLE={
 'villager':dict(tunic='#826c51',pants='#56594d',accent='#c7a168',hair='#4b3b2b',skirt=False,armor=False),
 'worker':dict(tunic='#657d6b',pants='#485950',accent='#a2a47d',hair='#5c452d',skirt=False,armor=False),
 'builder':dict(tunic='#987750',pants='#655b4b',accent='#d2b17a',hair='#43362c',skirt=False,armor=False),
 'merchant':dict(tunic='#98715c',pants='#6b514d',accent='#dfb87f',hair='#47352d',skirt=True,armor=False),
 'warrior':dict(tunic='#6c7771',pants='#525a58',accent='#a1a59c',hair='#514638',skirt=False,armor=True),
 'modern':dict(tunic='#596d65',pants='#54695a',accent='#899c91',hair='#333c3b',skirt=False,armor=True),
 'scholar':dict(tunic='#6d718d',pants='#5e596b',accent='#ad9ab3',hair='#3f3938',skirt=False,armor=False)
}

def build(name,p):
 m=Model(name,p);cloth=p['tunic'];accent=p['accent'];pants=p['pants'];hair=p['hair'];armored=p['armor'];female=p['skirt']
 # Smooth tapered torso with shoulder/neck/chest/waist/hips profiles, not primitives.
 m.tube('body',[(0,.72,0,.215,.153),(0,.78,0,.22,.16),(0,.89,0,.192,.14),(0,1.015,0,.214,.15),(0,1.13,0,.253,.16),(0,1.19,0,.255,.146),(0,1.245,0,.165,.123),(0,1.315,0,.073,.08)],cloth,'torso anatomical contours',n=8)
 # Pants / over-tunic skirt (three-dimensional drape)
 if female:m.tube('body',[(0,.71,0,.38,.28),(0,.77,0,.32,.25),(0,.91,0,.26,.18)],pants,'cloth skirt drape',n=8)
 else:m.tube('body',[(0,.70,0,.202,.15),(0,.78,0,.215,.16),(0,.86,0,.197,.15)],pants,'pelvis',n=8)
 m.tube('body',[(0,.785,0,.225,.161),(0,.832,0,.223,.163)],'#594837' if not armored else '#4a5350','belt',n=8)
 m.box('body',0,.812,.167,.10,.09,.035,accent,'belt buckle')
 if armored:
  m.tube('body',[(0,.92,.05,.214,.163),(0,1.09,.05,.228,.171),(0,1.18,.05,.236,.15)],'#758784' if name=='warrior' else '#516960','cuirass',n=8)
  m.box('body',0,1.025,.216,.05,.24,.035,accent,'armor seam')
 else:
  m.box('body',0,1.025,.165,.041,.26,.021,accent,'tunic trim')
  for x in [-.08,.08]:m.box('body',x,1.15,.137,.035,.11,.025,accent,'neck collar')
 # Adult head oval, chin, nose, ears and hair or helmet
 m.tube('head',[(0,-.055,.019,.086,.077),(0,.015,.022,.117,.103),(0,.105,.018,.140,.115),(0,.18,0,.143,.119),(0,.265,-.012,.132,.11),(0,.325,-.016,.094,.083),(0,.342,-.016,.025,.026)],SKIN2,'head jaw cheek crown',n=8)
 m.ellipsoid('head',0,.14,.139,.043,.06,.052,SKIN,'nose',n=8,rings=4)
 for side in (-1,1):
  m.ellipsoid('head',side*.139,.164,0,.029,.046,.028,SKIN,'ear',n=8,rings=4)
  m.ellipsoid('head',side*.061,.205,.111,.018,.014,.007,'#2a332f','eyes',n=8,rings=4)
  m.box('head',side*.059,.247,.109,.045,.014,.012,hair,'eyebrow')
 m.box('head',0,.057,.118,.069,.009,.012,'#845d4c','mouth')
 if armored:
  m.tube('head',[(0,.25,-.004,.15,.129),(0,.32,-.01,.146,.127),(0,.39,-.012,.09,.09)],'#7e8584' if name=='warrior' else '#556960','helmet',n=8)
  m.box('head',0,.244,.137,.018,.06,.014,accent,'helmet nose guard')
 else:
  m.tube('head',[(0,.284,-.02,.140,.126),(0,.338,-.024,.133,.12),(0,.365,-.026,.09,.07)],hair,'sculpted hair',n=8)
  if female:
   m.ellipsoid('head',-.11,.155,-.097,.087,.17,.09,hair,'braided hair',n=8,rings=4)
 # Curved tapered arms with rounded shoulder, hands and cuff. Local rig origin is shoulder.
 for side,label in ((-1,'leftArm'),(1,'rightArm')):
  m.tube(label,[(0,.075,0,.096,.101),(side*.008,0,0,.114,.118),(side*.018,-.12,.002,.101,.102),(side*.027,-.26,.022,.080,.083),(side*.03,-.37,.037,.071,.078),(side*.035,-.48,.045,.065,.067)],cloth,'upper arms forearms',n=8)
  m.tube(label,[(side*.035,-.49,.044,.075,.071),(side*.035,-.53,.044,.074,.072)],accent if armored else '#5e5544','sleeve cuff',n=8)
  m.ellipsoid(label,side*.038,-.59,.051,.068,.093,.074,SKIN,'hand',n=8,rings=4)
  if armored:m.ellipsoid(label,0,-.015,0,.117,.099,.115,'#879892' if name=='warrior' else '#74897e','shoulder plate',n=8,rings=4)
 # Thighs are thicker than shins, calves reduce into boots; toes project forward.
 for side,label in ((-1,'leftLeg'),(1,'rightLeg')):
  m.tube(label,[(0,.035,0,.119,.107),(0,-.065,0,.124,.106),(0,-.19,.0,.111,.099),(0,-.32,.004,.093,.084),(0,-.405,.015,.086,.079),(0,-.52,.01,.081,.076)],pants,'thigh knee calf',n=8)
  m.tube(label,[(0,-.51,.011,.092,.083),(0,-.58,.018,.099,.091),(0,-.675,.027,.099,.097)],'#4b4035' if name!='modern' else '#353e39','boots',n=8)
  m.ellipsoid(label,0,-.687,.092,.11,.055,.176,'#453d37' if name!='modern' else '#333b38','foot instep and toe',n=8,rings=4)
 if name in ['worker','builder','villager']:
  m.box('body',-.19,1.02,-.175,.24,.28,.11,'#6e5942','satchel strap pack')
 if name=='scholar':m.box('body',.16,1.08,.174,.14,.17,.029,'#cbb783','scholar insignia')
 return m

def main():
 dataset={};report={}
 for name,p in ROLE.items():
  m=build(name,p);report[name]=m.export();dataset[name]=m.sections
 # Triangulated geometry is exported to GLB, same quad data supplied directly to Three.js.
 (OUT/'mesh-data.js').write_text('/* Quad-profile people, level-2 inspired. See audit for source limits. */\nexport const PEOPLE_MESHES='+json.dumps(dataset,separators=(',',':'))+';\n',encoding='utf8')
 # Landmarks tracked in three independent orthographic axes. These are recipe-derived, not observed image matches.
 points={'head_top':[0,1.705,-.016],'chin':[0,1.265,.03],'nose':[0,1.46,.17],'left_shoulder':[-.30,1.18,0],'right_shoulder':[.30,1.18,0], 'left_hand':[-.31,.57,.05],'right_hand':[.31,.57,.05],'left_hip':[-.135,.77,0],'right_hip':[.135,.77,0],'left_toe':[-.135,.075,.21],'right_toe':[.135,.075,.21]}
 witnesses={k:dict(front=[v[0],v[1]],side=[v[2],v[1]],top=[v[0],v[2]],source='procedural profile, not observed photograph') for k,v in points.items()}
 (OUT/'landmarks-three-views.json').write_text(json.dumps(witnesses,ensure_ascii=False,indent=2))
 (OUT/'manifest.json').write_text(json.dumps({'workflow':'1000 quads, level 2 inspired custom anatomical profile; not fully certified Mudelitehas 0.1.2 image reconstruction','rig_sections':list(next(iter(dataset.values())).keys()),'models':report},ensure_ascii=False,indent=2))
 print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
