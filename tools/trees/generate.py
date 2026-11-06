"""Blender 5.2+, pinned Sapling 1.0.0. Run with -- --species pine,spruce,oak.
Exports are reimported before every preview/impostor render. No game entrypoint is changed.
"""
import argparse, ast, importlib.util, json, math, os, random, sys, hashlib
from pathlib import Path
import bpy, bmesh, numpy as np
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
ap=argparse.ArgumentParser();ap.add_argument('--species',default='pine,spruce,oak');ap.add_argument('--variants',type=int,default=5);ap.add_argument('--sapling',default=os.environ.get('SAPLING_SOURCE','/tmp/sapling-source/source'));ap.add_argument('--out',default=str(ROOT/'assets/sapling-trees'))
a=ap.parse_args(sys.argv[sys.argv.index('--')+1:]);OUT=Path(a.out);OUT.mkdir(parents=True,exist_ok=True)
assert bpy.app.version >= (5,2,0), bpy.app.version_string
src=Path(a.sapling)
assert 'version = "1.0.0"' in (src/'blender_manifest.toml').read_text()
spec=importlib.util.spec_from_file_location('bl_ext.user_default.sapling_tree_gen',src/'__init__.py',submodule_search_locations=[str(src)])
sapling=importlib.util.module_from_spec(spec);sys.modules[spec.name]=sapling;spec.loader.exec_module(sapling);sapling.register()
PRESETS={'pine':'monterey_pine','spruce':'douglas_fir','oak':'cambridge_oak','lime':'small_maple','birch':'silver_birch','palm':'palm'}
COLORS={'pine':(.13,.24,.075),'spruce':(.075,.20,.12),'oak':(.19,.32,.065),'lime':(.26,.39,.085),'birch':(.26,.38,.09),'palm':(.13,.30,.09)}

def clear():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for block in list(bpy.data.meshes):
  if not block.users:bpy.data.meshes.remove(block)

def active(o):
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o

def atlas(kind):
 """Four RGBA twig clusters, transparent gaps, alpha edge colour dilation.
 Needles are strokes on branchlets; broadleaves are individually veined silhouettes.
 All artwork authored here; shared per species, not per tree.
 """
 n=512; ar=np.zeros((n,n,4),dtype=np.float32);base=np.array(COLORS[kind]);ar[:,:,:3]=base
 Y,X=np.mgrid[0:n,0:n];rng=random.Random(240+list(PRESETS).index(kind))
 for tile in range(4):
  ox=(tile%2)*256;oy=(tile//2)*256
  # side twigs spread along a diagonal main stem
  for i in range(220 if kind in ('pine','spruce') else 30):
   t=rng.uniform(.08,.92);side=(-1)**i
   cx=ox+55+145*t+side*rng.uniform(10,43);cy=oy+35+180*t-side*rng.uniform(0,20)
   ang=rng.uniform(-.8,.8)+(0 if side>0 else 1.3)
   dx=X-cx;dy=Y-cy;u=dx*math.cos(ang)+dy*math.sin(ang);v=-dx*math.sin(ang)+dy*math.cos(ang)
   if kind in ('pine','spruce'):
    mask=(np.abs(u)<rng.uniform(13,27))&(np.abs(v)<2.2);vein=np.ones_like(X,dtype=float)*.8
   else:
    length=rng.uniform(17,30);width=length*(.48 if kind=='birch' else .68)
    q=(u/length)**2+(v/width)**2
    edge=1+(.07*np.sin(np.arctan2(v,u)*10) if kind=='oak' else 0)
    mask=q<edge
    if kind=='lime':
     uu=u/length;vv=v/width;mask=((uu*uu+vv*vv-1)**3-uu*uu*vv**3)<0
    vein=.85+.15*np.cos(v*.6);vein[np.abs(v)<1.1]=1.18
   tint=rng.uniform(.75,1.35);ar[mask,:3]=np.clip(base*tint*vein[mask,None],0,1);ar[mask,3]=1
  # main woody twig, local tile only
  dx=X-(ox+128);dy=Y-(oy+128);mask=(abs(dx*.8-dy*.6)<1.3)&(abs(dx)<92)&(abs(dy)<105)
  ar[mask,:3]=(.25,.20,.09);ar[mask,3]=1
 if kind=='palm':
  for tile in range(4):
   ox=(tile%2)*256;oy=(tile//2)*256;u=(X-ox-128)/88;v=(Y-oy-128)/116;mask=(np.abs(v)<1)&(np.abs(u)<(.14+.8*(1-v*v)))&(X>=ox)&(X<ox+256)&(Y>=oy)&(Y<oy+256);ar[mask,:3]=base*(.9+.15*np.cos(u[mask,None]*22));ar[mask,3]=1
 img=bpy.data.images.new(kind+'_foliage_atlas',width=n,height=n,alpha=True);img.pixels.foreach_set(ar.ravel());img.filepath_raw=str(OUT/(kind+'_foliage.png'));img.file_format='PNG';img.save();img.pack()
 return img

def material(name,color,image=None,unlit=False):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.93
 m.diffuse_color=(*color,1);m.use_backface_culling=False
 if image:
  t=n.new('ShaderNodeTexImage');t.image=image;l.new(t.outputs['Color'],p.inputs['Base Color']);l.new(t.outputs['Alpha'],p.inputs['Alpha']);m.surface_render_method='DITHERED'
  if unlit:
   # glTF exporter recognises emission-only graph as KHR_materials_unlit.
   e=n.new('ShaderNodeEmission');l.new(t.outputs['Color'],e.inputs['Color']);tr=n.new('ShaderNodeBsdfTransparent');mix=n.new('ShaderNodeMixShader');l.new(t.outputs['Alpha'],mix.inputs[0]);l.new(tr.outputs[0],mix.inputs[1]);l.new(e.outputs[0],mix.inputs[2]);l.new(mix.outputs[0],n.get('Material Output').inputs['Surface'])
 return m

def triangles(o):
 o.data.calc_loop_triangles();return len(o.data.loop_triangles)

def reduce(o,budget):
 active(o);cnt=triangles(o)
 if cnt>budget:
  d=o.modifiers.new('budget','DECIMATE');d.ratio=budget/cnt;bpy.ops.object.modifier_apply(modifier=d.name)

def bark_from_curves(curves,mat,limit=26,sections=4,sides=5):
 # Retain complete Sapling branch paths by thickness. Generic decimation can delete
 # the trunk while keeping thousands of disconnected twig shells.
 paths=sorted(list(curves.curves),key=lambda c:max(p.radius for p in c.points),reverse=True)[:limit]
 verts=[];faces=[]
 for curve in paths:
  pts=list(curve.points);ids=sorted(set(round(i*(len(pts)-1)/(sections-1)) for i in range(sections)))
  ring=[]
  for j,idx in enumerate(ids):
   pt=pts[idx];tangent=(pts[min(len(pts)-1,idx+1)].position-pts[max(0,idx-1)].position).normalized()
   u=tangent.cross(Vector((0,1,0))).normalized();v=tangent.cross(u).normalized();start=len(verts);ring.append(start)
   for k in range(sides):verts.append(pt.position+(u*math.cos(k*math.tau/sides)+v*math.sin(k*math.tau/sides))*max(.003,pt.radius))
  for r0,r1 in zip(ring,ring[1:]):
   for k in range(sides):faces.append((r0+k,r0+(k+1)%sides,r1+(k+1)%sides,r1+k))
  faces.extend([tuple(reversed(range(ring[0],ring[0]+sides))),tuple(range(ring[-1],ring[-1]+sides))])
 me=bpy.data.meshes.new('sapling_branch_paths');me.from_pydata(verts,[],faces);me.materials.append(mat)
 for vertex in me.vertices:vertex.co.z=max(0,vertex.co.z)
 ob=bpy.data.objects.new('bark',me);bpy.context.collection.objects.link(ob)
 for p in me.polygons:p.use_smooth=True
 return ob

def cards(mesh,mat,keep=1.,size=1.,seed=0):
 rng=random.Random(seed);verts=[];faces=[];tiles=[]
 polys=list(mesh.polygons);rng.shuffle(polys);polys=polys[:max(1,int(len(polys)*keep))]
 for p in polys:
  if len(p.vertices)!=4:continue
  vs=[mesh.vertices[i].co.copy() for i in p.vertices];c=sum(vs,Vector())/4
  if c.z<=.04:continue
  safe=min([size]+[(c.z-.03)/(c.z-v.z) for v in vs if v.z<c.z]);k=len(verts);verts.extend([c+(v-c)*safe for v in vs]);faces.append(tuple(range(k,k+4)));tiles.append(rng.randrange(4))
 me=bpy.data.meshes.new('foliage_cards');me.from_pydata(verts,[],faces);me.materials.append(mat);uv=me.uv_layers.new(name='UVMap')
 for p,t in zip(me.polygons,tiles):
  for li,(u,v) in zip(p.loop_indices,[(0,0),(1,0),(1,1),(0,1)]):uv.data[li].uv=((t%2+(u*.98+.01))/2,(t//2+(v*.98+.01))/2)
 ob=bpy.data.objects.new('foliage',me);bpy.context.collection.objects.link(ob);return ob

def export(path,objects):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.context.view_layer.objects.active=objects[0]
 bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_yup=True,export_animations=False,export_extras=True)
 # Blender exports dithered alpha as BLEND; patch to alpha MASK in JSON chunk after export.
 import struct
 raw=path.read_bytes();size,typ=struct.unpack_from('<II',raw,12);doc=json.loads(raw[20:20+size]);
 for m in doc.get('materials',[]):
  if path.stem=='far':
   # Canonical unlit RGBA material, also understood by the game's small GLB loader.
   tex=m.pop('emissiveTexture',None)
   if tex:
    m['pbrMetallicRoughness']={'baseColorTexture':tex,'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':1}
    m.pop('emissiveFactor',None);m.setdefault('extensions',{})['KHR_materials_unlit']={}
    doc.setdefault('extensionsUsed',[])
    if 'KHR_materials_unlit' not in doc['extensionsUsed']:doc['extensionsUsed'].append('KHR_materials_unlit')
   m.update(alphaMode='MASK',alphaCutoff=.4,doubleSided=True)
  elif m.get('alphaMode')=='BLEND':m.update(alphaMode='MASK',alphaCutoff=.4,doubleSided=True)
 data=json.dumps(doc,separators=(',',':')).encode();data+=b' '*((-len(data))%4);tail=raw[20+size:];path.write_bytes(struct.pack('<4sII',b'glTF',2,20+len(data)+len(tail))+struct.pack('<II',len(data),typ)+data+tail)
 return {'triangles':sum(triangles(o) for o in objects),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}

def setup_render(h,w):
 sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.device='CPU';sc.cycles.samples=8;sc.render.resolution_x=w;sc.render.resolution_y=h;sc.render.resolution_percentage=100;sc.render.film_transparent=True;sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA';sc.world.use_nodes=True;sc.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.65,.72,.8,1);sc.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65;sc.view_settings.view_transform='AgX'
 for name,loc,power,size in [('key',(14,-18,25),6500,12),('fill',(-12,-3,18),4000,10),('rim',(6,12,22),5000,8)]:
  d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);sc.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,8))-o.location).to_track_quat('-Z','Y').to_euler()
 d=bpy.data.cameras.new('camera');o=bpy.data.objects.new('camera',d);sc.collection.objects.link(o);sc.camera=o;d.type='ORTHO';return o

def render(path,camera,center,span,angle,elevation=.12):
 camera.data.ortho_scale=span;camera.data.clip_end=span*20;camera.location=center+(Vector((0,0,span*2)) if elevation>1000 else Vector((math.sin(angle)*span*2,-math.cos(angle)*span*2,span*elevation)));camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler();bpy.context.scene.render.filepath=str(path);bpy.ops.render.render(write_still=True)

def make(kind,index,img):
 clear();ident=f'{kind}_{index+1:02}';dest=OUT/ident;dest.mkdir(exist_ok=True)
 p=ast.literal_eval((src/'presets'/(PRESETS[kind]+'.py')).read_text());seed=7301+list(PRESETS).index(kind)*100+index*17
 heights=[.79,1.03,.91,1.19,1.08];widths=[.82,1.17,1.34,.90,1.05]
 p.update(seed=seed,scaleV=0.,scale=p['scale']*heights[index],makeMesh=True,useRig=False,windAnim=False,leafFlutter=False,bevelRes=0,resU=2,curveRes=(9,6,3,1),showLeaves=True,leafShape='rect',leaves=12,leafScale=.65,leafScaleX=.85)
 p['length']=list(p['length']);p['length'][1]*=widths[index];p['ratio']*= [1.,1.25,.85,.90,1.1][index];p['baseSize']=max(.12,min(.65,p['baseSize']+[.05,-.08,-.04,.10,0][index]));p['branches']=(p['branches'][0],min(40,p['branches'][1]),min(22,p['branches'][2]),p['branches'][3])
 if kind=='spruce':p.update(scale=22*heights[index],baseSize=.12+.025*index,shape='0',levels=3,branches=(0,42,14,0),length=(1.,.31*widths[index],.35,0.),leafScale=.65,leafScaleX=.9,leaves=16)
 if kind=='pine':p.update(baseSize=.42+.025*index,levels=3,branches=(0,25,16,0),leafScale=.70)
 if kind=='lime':p.update(shape='2',baseSize=.20,levels=3,branches=(0,28,16,0),length=(1.,.48*widths[index],.5,.3),leafScale=.65)
 if kind=='birch':p.update(leafScale=.40,leafScaleX=.75,leaves=15)
 if kind=='palm':p.update(leaves=36,leafScale=1.2,leafScaleX=.12)
 (dest/'recipe.json').write_text(json.dumps({'species':kind,'preset':PRESETS[kind],'seed':seed,'settings':p},indent=2))
 assert bpy.ops.curve.tree_add(**p)=={'FINISHED'}
 trunk=bpy.data.objects.get('tree');leaf=bpy.data.objects.get('leaves');assert trunk and leaf
 # Capture exact Sapling curves before deleting hidden source objects.
 curves=bpy.data.objects['tree_curves'].data
 bark=(.60,.57,.49) if kind=='birch' else (.22,.135,.075);bm=material('bark_'+kind,bark)
 neartrunk=bark_from_curves(curves,bm)
 midtrunk=bark_from_curves(curves,bm,6,3,4)
 dg=bpy.context.evaluated_depsgraph_get();leafmesh=bpy.data.meshes.new_from_object(leaf.evaluated_get(dg),depsgraph=dg)
 foliage=cards(leafmesh,material('foliage_'+kind,(1,1,1),img),min(1,800/max(1,len(leafmesh.polygons))),(1.3 if kind=='palm' else 4.0),seed)
 for o in list(bpy.context.scene.objects):
  if o not in (neartrunk,midtrunk,foliage):bpy.data.objects.remove(o,do_unlink=True)
 trunk=neartrunk
 near=export(dest/'near.glb',[trunk,foliage])
 # Save editable source recipe and baked game geometry, without studio lights/cameras.
 midtrunk.hide_render=True
 bpy.ops.wm.save_as_mainfile(filepath=str(dest/'source.blend'),compress=True)
 midtrunk.hide_render=False
 midleaf=cards(foliage.data,foliage.data.materials[0],.12,2.1,seed)
 mid=export(dest/'mid.glb',[midtrunk,midleaf])
 # Reimport exact GLB bytes for all evidence and impostor captures.
 clear();bpy.ops.import_scene.gltf(filepath=str(dest/'near.glb'))
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices];lo=Vector(tuple(min(v[k] for v in points) for k in range(3)));hi=Vector(tuple(max(v[k] for v in points) for k in range(3)));center=(lo+hi)/2;span=max(hi.z-lo.z,hi.x-lo.x,hi.y-lo.y)*1.14
 camera=setup_render(640,640);render(dest/'preview.png',camera,center,span,.48,.28)
 bpy.context.scene.render.resolution_x=256;bpy.context.scene.render.resolution_y=256;bpy.context.scene.cycles.samples=4
 pixels=[]
 for v in range(8):
  fn=dest/f'view_{v}.png';render(fn,camera,center,span,v*math.pi/4,0);im=bpy.data.images.load(str(fn),check_existing=False);pixels.append(np.array(im.pixels[:],dtype=np.float32).reshape(256,256,4));bpy.data.images.remove(im)
 render(dest/'top.png',camera,center,span,0,2e4)
 ar=np.zeros((512,1024,4),dtype=np.float32)
 for v,px in enumerate(pixels):ar[(v//4)*256:(v//4+1)*256,(v%4)*256:(v%4+1)*256]=px
 imp=bpy.data.images.new(ident+'_impostor',width=1024,height=512,alpha=True);imp.pixels.foreach_set(ar.ravel());imp.filepath_raw=str(dest/'impostor.png');imp.file_format='PNG';imp.save();imp.pack()
 # Far GLB: crossed front/side cards + overhead card; top view avoids paper-thin aerial forests.
 clear();mat=material('impostor_'+ident,(1,1,1),imp,True);topimg=bpy.data.images.load(str(dest/'top.png'));topmat=material('top_'+ident,(1,1,1),topimg,True)
 verts=[];faces=[]
 for turn in [0,math.pi/2]:
  k=len(verts)
  for x,z in [(-span/2,-span/2),(span/2,-span/2),(span/2,span/2),(-span/2,span/2)]:verts.append(center+Vector((x*math.cos(turn),x*math.sin(turn),z)))
  faces.append(tuple(range(k,k+4)))
 k=len(verts)
 for x,y in [(-span/2,-span/2),(span/2,-span/2),(span/2,span/2),(-span/2,span/2)]:verts.append(center+Vector((x,y,0)))
 faces.append(tuple(range(k,k+4)));me=bpy.data.meshes.new('impostor');me.from_pydata(verts,[],faces);me.materials.append(mat);me.materials.append(topmat);uv=me.uv_layers.new()
 for face,t in zip(me.polygons,[0,2,0]):
  if face.index==2:face.material_index=1
  for li,(u,v) in zip(face.loop_indices,[(0,0),(1,0),(1,1),(0,1)]):uv.data[li].uv=((t+u)/4,v/2) if face.index<2 else (u,v)
 ob=bpy.data.objects.new('far',me);bpy.context.collection.objects.link(ob);far=export(dest/'far.glb',[ob])
 rec={'id':ident,'species':kind,'variant':index+1,'blender':bpy.app.version_string,'sapling':'1.0.0','seed':seed,'boundsZUp':[list(lo),list(hi)],'near':near,'mid':mid,'far':far,'preview':'preview.png','impostorViews':8,'status':'awaiting_visual_approval'}
 (dest/'report.json').write_text(json.dumps(rec,indent=2));print('TREE_COMPLETE',json.dumps(rec),flush=True)
 return rec

for kind in a.species.split(','):
 image=atlas(kind)
 for i in range(a.variants):make(kind,i,image)
reports=[json.loads(p.read_text()) for p in sorted(OUT.glob('*/report.json'))];(OUT/'manifest.json').write_text(json.dumps({'approved':False,'trees':reports},indent=2))
