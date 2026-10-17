"""V50 people generator.
Adds age-specific builder archetypes while keeping the V49 low-poly humanoid set.
Every builder archetype stays at or below the 1000-quad target.
"""
import json, math, numpy as np, trimesh
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'models-v50'
OUT.mkdir(exist_ok=True)
SKIN='#b88d69'; SKIN2='#c9a17d'

class Model:
 def __init__(self,name,palette):
  self.name=name;self.palette=palette;self.sections={k:[] for k in ['body','head','leftArm','rightArm','leftLeg','rightLeg']};self.quads=0
 def mesh(self,section,verts,quads,color,label):
  if not quads:return
  v=np.array(verts,dtype=float);q=np.array(quads,dtype=int)
  self.sections[section].append({'v':np.round(v,4).tolist(),'q':q.tolist(),'c':color,'label':label});self.quads+=len(q)
 def tube(self,section,rings,color,label,n=8,cap=True):
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
    rgb=[int(p['c'][k:k+2],16) for k in (1,3,5)]
    mesh.visual.vertex_colors=np.tile(rgb+[255],(len(v),1))
    scene.add_geometry(mesh,geom_name=f'{self.name}_{section}_{i}',node_name=f'{section}_{i}')
  path=OUT/f'{self.name}_1000_2.glb'
  path.write_bytes(scene.export(file_type='glb'))
  return {'quads':self.quads,'triangles':sum(sum(1 for a,b,c,d in p['q'] if len({a,b,c})==3)+sum(1 for a,b,c,d in p['q'] if len({a,c,d})==3) for parts in self.sections.values() for p in parts),'sections':{k:sum(len(p['q']) for p in ps) for k,ps in self.sections.items()},'size':path.stat().st_size}

ROLE={
 'villager':dict(tunic='#826c51',pants='#56594d',accent='#c7a168',hair='#4b3b2b',skirt=False,armor=False,builder=False,apron=False,helmet=False),
 'worker':dict(tunic='#657d6b',pants='#485950',accent='#a2a47d',hair='#5c452d',skirt=False,armor=False,builder=False,apron=False,helmet=False),
 'builder':dict(tunic='#987750',pants='#655b4b',accent='#d2b17a',hair='#43362c',skirt=False,armor=False,builder=True,apron=True,helmet=False),
 'merchant':dict(tunic='#98715c',pants='#6b514d',accent='#dfb87f',hair='#47352d',skirt=True,armor=False,builder=False,apron=False,helmet=False),
 'warrior':dict(tunic='#6c7771',pants='#525a58',accent='#a1a59c',hair='#514638',skirt=False,armor=True,builder=False,apron=False,helmet=True),
 'modern':dict(tunic='#596d65',pants='#54695a',accent='#899c91',hair='#333c3b',skirt=False,armor=True,builder=False,apron=False,helmet=True),
 'scholar':dict(tunic='#6d718d',pants='#5e596b',accent='#ad9ab3',hair='#3f3938',skirt=False,armor=False,builder=False,apron=False,helmet=False),
 'stone_builder':dict(tunic='#8b6c4d',pants='#5d5246',accent='#b69159',hair='#3f3024',skirt=False,armor=False,builder=True,apron=True,helmet=False,fur=True,tool='stone'),
 'bronze_builder':dict(tunic='#946b49',pants='#5f544a',accent='#c39a55',hair='#3d3026',skirt=False,armor=False,builder=True,apron=True,helmet=False,tool='bronze',headband=True),
 'iron_builder':dict(tunic='#7e664f',pants='#59514a',accent='#9aa1a6',hair='#3d3329',skirt=False,armor=False,builder=True,apron=True,helmet=False,tool='iron',pads=True),
 'medieval_builder':dict(tunic='#6f7a66',pants='#4c5447',accent='#d6be8e',hair='#3d3028',skirt=False,armor=False,builder=True,apron=True,helmet=False,tool='iron',hood=True),
 'renaissance_builder':dict(tunic='#6e6f7e',pants='#56586a',accent='#c8a77b',hair='#3a3333',skirt=False,armor=False,builder=True,apron=True,helmet=False,tool='steel',cap=True),
 'industrial_builder':dict(tunic='#687273',pants='#4d5456',accent='#bd8f4d',hair='#2d2d2c',skirt=False,armor=False,builder=True,apron=True,helmet=True,tool='steel'),
 'modern_builder':dict(tunic='#5e7174',pants='#46595c',accent='#c3d467',hair='#2c3436',skirt=False,armor=False,builder=True,apron=False,helmet=True,tool='modern',vest=True),
}

TOOL_COLORS={'stone':'#8f9185','bronze':'#b98a48','iron':'#8c959d','steel':'#a8afb5','modern':'#cfb95a'}


def build(name,p):
 m=Model(name,p);cloth=p['tunic'];accent=p['accent'];pants=p['pants'];hair=p['hair'];armored=p['armor'];female=p.get('skirt',False)
 builder=p.get('builder',False); tool_color=TOOL_COLORS.get(p.get('tool','bronze'),'#b98a48')
 # Body
 m.tube('body',[(0,.72,0,.215,.153),(0,.78,0,.22,.16),(0,.89,0,.192,.14),(0,1.015,0,.214,.15),(0,1.13,0,.253,.16),(0,1.19,0,.255,.146),(0,1.245,0,.165,.123),(0,1.315,0,.073,.08)],cloth,'torso',n=8)
 if female:m.tube('body',[(0,.71,0,.38,.28),(0,.77,0,.32,.25),(0,.91,0,.26,.18)],pants,'skirt',n=8)
 else:m.tube('body',[(0,.70,0,.202,.15),(0,.78,0,.215,.16),(0,.86,0,.197,.15)],pants,'pelvis',n=8)
 m.tube('body',[(0,.785,0,.225,.161),(0,.832,0,.223,.163)],'#594837' if not armored else '#4a5350','belt',n=8)
 m.box('body',0,.812,.167,.10,.09,.035,accent,'belt buckle')
 if armored:
  m.tube('body',[(0,.92,.05,.214,.163),(0,1.09,.05,.228,.171),(0,1.18,.05,.236,.15)],'#758784' if name=='warrior' else '#516960','cuirass',n=8)
  m.box('body',0,1.025,.216,.05,.24,.035,accent,'armor seam')
 else:
  m.box('body',0,1.025,.165,.041,.26,.021,accent,'trim')
  for x in (-.08,.08):m.box('body',x,1.15,.137,.035,.11,.025,accent,'collar')
 if builder:
  if p.get('apron',False):m.box('body',0,.95,.17,.19,.48,.035,'#b89a72','apron')
  m.box('body',-.19,1.02,-.175,.24,.28,.11,'#6e5942','satchel')
  m.box('body',.21,1.0,-.02,.08,.20,.06,'#8f714f','hammer holster')
  if p.get('fur'):m.box('body',0,1.18,.0,.34,.12,.21,'#7c6041','fur collar')
  if p.get('vest'):m.box('body',0,1.03,.18,.28,.42,.045,'#d8d55d','safety vest')
  if p.get('pads'):
   for x in (-.17,.17):m.box('body',x,.90,.17,.08,.12,.03,'#8f9699','shoulder pads')
 # Head
 m.tube('head',[(0,-.055,.019,.086,.077),(0,.015,.022,.117,.103),(0,.105,.018,.140,.115),(0,.18,0,.143,.119),(0,.265,-.012,.132,.11),(0,.325,-.016,.094,.083),(0,.342,-.016,.025,.026)],SKIN2,'head',n=8)
 m.ellipsoid('head',0,.14,.139,.043,.06,.052,SKIN,'nose',n=8,rings=4)
 for side in (-1,1):
  m.ellipsoid('head',side*.139,.164,0,.029,.046,.028,SKIN,'ear',n=8,rings=4)
  m.ellipsoid('head',side*.061,.205,.111,.018,.014,.007,'#2a332f','eyes',n=8,rings=4)
  m.box('head',side*.059,.247,.109,.045,.014,.012,hair,'eyebrow')
 m.box('head',0,.057,.118,.069,.009,.012,'#845d4c','mouth')
 if armored or p.get('helmet'):
  m.tube('head',[(0,.25,-.004,.15,.129),(0,.32,-.01,.146,.127),(0,.39,-.012,.09,.09)],'#7e8584' if name=='warrior' else '#556960','helmet',n=8)
  m.box('head',0,.244,.137,.018,.06,.014,accent,'nose guard')
 else:
  m.tube('head',[(0,.284,-.02,.140,.126),(0,.338,-.024,.133,.12),(0,.365,-.026,.09,.07)],hair,'hair',n=8)
  if female:m.ellipsoid('head',-.11,.155,-.097,.087,.17,.09,hair,'braid',n=8,rings=4)
 if p.get('headband'):m.box('head',0,.275,.085,.28,.05,.03,accent,'headband')
 if p.get('hood'):m.box('head',0,.29,-.04,.30,.19,.22,'#786f5a','hood')
 if p.get('cap'):m.box('head',0,.34,.03,.25,.08,.22,'#5d4c42','cap')
 if p.get('goggles'):
  for x in (-.04,.04):m.ellipsoid('head',x,.205,.118,.028,.02,.01,'#c8b267','goggle',n=8,rings=4)
  m.box('head',0,.205,.108,.11,.015,.012,'#4c4537','strap')
 # Arms
 for side,label in ((-1,'leftArm'),(1,'rightArm')):
  m.tube(label,[(0,.075,0,.096,.101),(side*.008,0,0,.114,.118),(side*.018,-.12,.002,.101,.102),(side*.027,-.26,.022,.080,.083),(side*.03,-.37,.037,.071,.078),(side*.035,-.48,.045,.065,.067)],cloth,'arm',n=8)
  m.tube(label,[(side*.035,-.49,.044,.075,.071),(side*.035,-.53,.044,.074,.072)],accent if armored else '#5e5544','cuff',n=8)
  m.ellipsoid(label,side*.038,-.59,.051,.068,.093,.074,SKIN,'hand',n=8,rings=4)
  if armored:m.ellipsoid(label,0,-.015,0,.117,.099,.115,'#879892' if name=='warrior' else '#74897e','shoulder plate',n=8,rings=4)
 # Legs
 for side,label in ((-1,'leftLeg'),(1,'rightLeg')):
  m.tube(label,[(0,.035,0,.119,.107),(0,-.065,0,.124,.106),(0,-.19,.0,.111,.099),(0,-.32,.004,.093,.084),(0,-.405,.015,.086,.079),(0,-.52,.01,.081,.076)],pants,'leg',n=8)
  m.tube(label,[(0,-.51,.011,.092,.083),(0,-.58,.018,.099,.091),(0,-.675,.027,.099,.097)],'#4b4035' if name!='modern' else '#353e39','boots',n=8)
  m.ellipsoid(label,0,-.687,.092,.11,.055,.176,'#453d37' if name!='modern' else '#333b38','foot',n=8,rings=4)
 # Builder-specific tools and helmets
 if builder:
  m.box('rightArm',.0,-.22,.12,.06,.72,.06,'#856b45','handle')
  if p.get('tool') in ('stone','bronze','iron'):
   m.box('rightArm',.02,.07,.12,.30,.14,.14,tool_color,'hammer head')
  elif p.get('tool')=='steel':
   m.box('rightArm',.02,.05,.12,.34,.12,.12,tool_color,'steel hammer head')
   m.box('leftArm',-.01,-.18,.18,.22,.06,.55,'#a5835d','rolled plans')
  elif p.get('tool')=='modern':
   m.box('rightArm',.0,-.16,.16,.08,.70,.08,'#4b5558','power tool grip')
   m.box('rightArm',.0,.09,.19,.18,.22,.20,tool_color,'power tool')
   m.box('leftArm',-.01,-.18,.18,.24,.18,.24,'#9aa4a7','tool case')
 return m


def main():
 dataset={};report={}
 for name,p in ROLE.items():
  m=build(name,p);report[name]=m.export();dataset[name]=m.sections
 (OUT/'mesh-data.js').write_text('/* V50 people and builder variants. */\nexport const PEOPLE_MESHES='+json.dumps(dataset,separators=(',',':'))+';\n',encoding='utf8')
 manifest={
  'workflow':'V50 custom Mudelitehas-like 1000-quad workflow for people; age-specific builders exported as GLB and used directly in Three.js.',
  'models':report,
  'builder_tiers':['stone_builder','bronze_builder','iron_builder','medieval_builder','renaissance_builder','industrial_builder','modern_builder']
 }
 (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
 print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__':
 main()
