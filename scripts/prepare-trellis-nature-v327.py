"""Blender CPU post-process of actual TRELLIS.2 outputs; inputs are never synthesized here."""
import bpy, json, math, struct, os
from pathlib import Path
import numpy as np
from mathutils.bvhtree import BVHTree
from mathutils import Vector,geometry
import bmesh
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parents[1]/'assets/world-v327';OUT.mkdir(parents=True,exist_ok=True)
SRC=ROOT/'trellis-v327'
reports=[]
def linear(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def write_glb(name,positions,colors,triangles):
 # Simple identity-transform GLB, compatible with the game's instanced loader.
 pos=np.asarray(positions,dtype='<f4');col=np.asarray(colors,dtype=np.uint8);idx=np.asarray(triangles,dtype='<u4').flatten()
 chunks=[];views=[]
 for data,target in [(pos.tobytes(),34962),(col.tobytes(),34962),(idx.tobytes(),34963)]:
  off=sum(len(c) for c in chunks);pad=b'\0'*((-len(data))%4);views.append({'buffer':0,'byteOffset':off,'byteLength':len(data),'target':target});chunks.append(data+pad)
 binary=b''.join(chunks)
 doc={'asset':{'version':'2.0','generator':'Kuningriigid V327 / TRELLIS.2 + Blender','extras':{'source':'microsoft/TRELLIS.2-4B','license':'MIT','vertexColorSpace':'linear'}},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0,'name':name}],'meshes':[{'name':name,'primitives':[{'attributes':{'POSITION':0,'COLOR_0':1},'indices':2,'material':0}]}], 'materials':[{'name':'baked natural colour','pbrMetallicRoughness':{'roughnessFactor':.9,'metallicFactor':0},'doubleSided':True}], 'buffers':[{'byteLength':len(binary)}], 'bufferViews':views, 'accessors':[{'bufferView':0,'componentType':5126,'count':len(pos),'type':'VEC3','min':pos.min(axis=0).tolist(),'max':pos.max(axis=0).tolist()},{'bufferView':1,'componentType':5121,'normalized':True,'count':len(col),'type':'VEC3'},{'bufferView':2,'componentType':5125,'count':len(idx),'type':'SCALAR'}]}
 raw=json.dumps(doc,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4)
 data=struct.pack('<III',0x46546c67,2,12+8+len(raw)+8+len(binary))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(binary),0x004e4942)+binary
 (OUT/(name+'.glb')).write_bytes(data)
 return len(data)
for kind,height,budgets in [('oak',2.6,{'low':260,'high':1400}),('pine',2.8,{'low':240,'high':1300}),('rock',1.5,{'low':120,'high':550}),('palm',2.8,{'low':240,'high':1200})]:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 bpy.ops.import_scene.gltf(filepath=str(SRC/(kind+'-source.glb')))
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 for o in meshes:o.select_set(True)
 bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();base=bpy.context.object
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 original=sum(len(p.vertices)-2 for p in base.data.polygons)
 coords=np.array([tuple(v.co) for v in base.data.vertices]);minimum=coords.min(axis=0);maximum=coords.max(axis=0);factor=height/(maximum[2]-minimum[2]);center=(minimum+maximum)*.5
 for v in base.data.vertices:v.co=((v.co.x-center[0])*factor,(v.co.y-center[1])*factor,(v.co.z-minimum[2])*factor)
 textures={}
 for i,m in enumerate(base.data.materials):
  bs=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
  image=None
  if bs and bs.inputs['Base Color'].is_linked:
   node=bs.inputs['Base Color'].links[0].from_node
   if node.type=='TEX_IMAGE':image=node.image
  if image:
   pixels=np.empty(len(image.pixels),dtype=np.float32);image.pixels.foreach_get(pixels)
   textures[i]=(np.array(image.size),pixels.reshape((image.size[1],image.size[0],4)))
 # Drop low, broad floor fragments inferred from white input backgrounds.
 bm=bmesh.new();bm.from_mesh(base.data);low=[]
 for f in bm.faces:
  if max(v.co.z for v in f.verts)<height*.035:low.append(f)
 bmesh.ops.delete(bm,geom=low,context='FACES');bm.to_mesh(base.data);bm.free();base.data.update()
 source_coords=[v.co.copy() for v in base.data.vertices];source_faces=[list(p.vertices) for p in base.data.polygons]
 source_bvh=BVHTree.FromPolygons(source_coords,source_faces,all_triangles=True)
 source_uv=base.data.uv_layers.active.data if base.data.uv_layers.active else None
 for lod,budget in budgets.items():
  obj=base.copy();obj.data=base.data.copy();bpy.context.collection.objects.link(obj);bpy.context.view_layer.objects.active=obj
  base.select_set(False);obj.select_set(True)
  # Cluster the generated canopy cloud into solid convex leaf volumes. Direct
  # decimation of AI leaf sheets produces detached triangles at overview budgets.
  if kind!='rock':
   cut=height*({'oak':.43,'pine':.17,'palm':.72}[kind])
   # Reconstruct connected trunk rings from generated cross-sections: sparse
   # source sheets must not survive as floating bark splinters at low LOD.
   trunkverts=[];trunkfaces=[];segments=8 if lod=='high' else 6;rings=9
   for layer in range(rings):
    z=layer/(rings-1)*cut*1.12
    band=np.array([tuple(v) for v in source_coords if abs(v.z-z)<height*.035])
    if len(band):
     center=np.median(band[:,:2],axis=0);dist=np.linalg.norm(band[:,:2]-center,axis=1);radius=np.clip(np.percentile(dist,35),height*.016,height*.052)
    else:center=np.array([0.,0.]);radius=height*.025
    for j in range(segments):
     angle=j/segments*math.tau;trunkverts.append((center[0]+radius*math.cos(angle),center[1]+radius*math.sin(angle),z))
   for layer in range(rings-1):
    for j in range(segments):
     a=layer*segments+j;b=layer*segments+(j+1)%segments;trunkfaces.append((a,b,b+segments,a+segments))
   trunkfaces.extend([tuple(reversed(range(segments))),tuple((rings-1)*segments+j for j in range(segments))])
   trunkmesh=bpy.data.meshes.new('generated trunk sections');trunkmesh.from_pydata(trunkverts,[],trunkfaces);trunkmesh.materials.append(bpy.data.materials.new('bark'));obj.data=trunkmesh
   cloud=np.array([tuple(v) for v in source_coords if v.z>=cut])
   count={'oak':8,'pine':10,'palm':8}[kind] if lod=='low' else {'oak':14,'pine':20,'palm':12}[kind]
   centers=[cloud[np.argmax(cloud[:,2])]]
   for k in range(1,count):
    distances=np.min(np.sum((cloud[:,None,:]-np.array(centers)[None,:,:])**2,axis=2),axis=1);centers.append(cloud[np.argmax(distances)])
   centers=np.array(centers)
   for k in range(12):
    labels=np.argmin(np.sum((cloud[:,None,:]-centers[None,:,:])**2,axis=2),axis=1)
    for j in range(count):
     cluster=cloud[labels==j]
     if len(cluster):centers[j]=cluster.mean(axis=0)
   if kind=='palm':
    # Radial fronds share a crown; spatial k-means would turn palms into balls.
    angles=np.arctan2(cloud[:,1],cloud[:,0]);labels=np.floor((angles+math.pi)/math.tau*count).astype(int)%count
    for j in range(count):
     cluster=cloud[labels==j]
     if len(cluster):centers[j]=cluster.mean(axis=0)
   hullmesh=bmesh.new()
   for j in range(count):
    cluster=cloud[labels==j]
    if len(cluster)<4:continue
    # Farthest samples retain the original generated silhouette.
    limit=max(6,int(budget*.78/count/2)+2);chosen=[cluster[np.argmax(cluster[:,2])]]
    for k in range(1,min(limit,len(cluster))):
     distances=np.min(np.sum((cluster[:,None,:]-np.array(chosen)[None,:,:])**2,axis=2),axis=1);chosen.append(cluster[np.argmax(distances)])
    if kind=='palm':chosen.append(np.array([0.,0.,height*.81]))
    vs=[hullmesh.verts.new(tuple(v)) for v in chosen]
    result=bmesh.ops.convex_hull(hullmesh,input=vs,use_existing_faces=False)
    unused=result.get('geom_unused',[])+result.get('geom_interior',[])
    if unused:bmesh.ops.delete(hullmesh,geom=list(set(unused)),context='VERTS')
   canopymesh=bpy.data.meshes.new('generated canopy volumes');hullmesh.to_mesh(canopymesh);hullmesh.free();canopymesh.materials.append(bpy.data.materials.new('canopy'))
   canopy=bpy.data.objects.new('generated canopy volumes',canopymesh);bpy.context.collection.objects.link(canopy)
   # Visible branch connections keep canopy clusters attached to the trunk.
   if kind!='palm':
    bm=bmesh.new();bm.from_mesh(obj.data)
    for center in centers:
     end=Vector(tuple(center));start=Vector((0,0,min(cut*.9,end.z*.55)));axis=end-start
     if axis.length<.05:continue
     u=axis.cross(Vector((0,0,1))).normalized()
     if u.length<.1:u=Vector((1,0,0))
     w=axis.normalized().cross(u).normalized();rings=[]
     for point,radius in [(start,height*.025),(end,height*.008)]:
      rings.append([bm.verts.new(point+radius*(u*math.cos(j*math.tau/5)+w*math.sin(j*math.tau/5))) for j in range(5)])
     for j in range(5):bm.faces.new((rings[0][j],rings[0][(j+1)%5],rings[1][(j+1)%5],rings[1][j]))
    bm.to_mesh(obj.data);bm.free()
   bpy.context.view_layer.objects.active=canopy;obj.select_set(False);canopy.select_set(True)
   soften=canopy.modifiers.new('organic canopy rounding','SUBSURF');soften.levels=1;bpy.ops.object.modifier_apply(modifier=soften.name)
   canopy.select_set(True);obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.join()
  else:
   # Keep the generated boulder's outer silhouette, without fragile loose chips.
   cloud=np.array([tuple(v) for v in source_coords]);limit=60 if lod=='low' else 280
   chosen=[cloud[np.argmax(cloud[:,2])]]
   distances=np.sum((cloud-chosen[0])**2,axis=1)
   for k in range(1,min(limit,len(cloud))):
    chosen.append(cloud[np.argmax(distances)]);distances=np.minimum(distances,np.sum((cloud-chosen[-1])**2,axis=1))
   bm=bmesh.new();vs=[bm.verts.new(tuple(v)) for v in chosen];result=bmesh.ops.convex_hull(bm,input=vs,use_existing_faces=False)
   unused=result.get('geom_unused',[])+result.get('geom_interior',[])
   if unused:bmesh.ops.delete(bm,geom=list(set(unused)),context='VERTS')
   rockmesh=bpy.data.meshes.new('generated boulder hull');bm.to_mesh(rockmesh);bm.free();obj.data=rockmesh
  current=sum(len(p.vertices)-2 for p in obj.data.polygons)
  mod=obj.modifiers.new('world map face budget','DECIMATE');mod.ratio=min(1,budget/max(1,current));bpy.ops.object.modifier_apply(modifier=mod.name)
  tri=obj.modifiers.new('triangles','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=tri.name)
  mesh=obj.data;uv=mesh.uv_layers.active.data if mesh.uv_layers.active else None
  positions=[];colors=[];faces=[];lookup={}
  for poly in mesh.polygons:
   face=[]
   for li in poly.loop_indices:
    loop=mesh.loops[li];v=mesh.vertices[loop.vertex_index];rgb=(.25,.38,.18) if kind!='rock' else (.4,.42,.37)
    nearest=source_bvh.find_nearest(v.co)
    if nearest and nearest[2] is not None and source_uv:
     source_poly=base.data.polygons[nearest[2]]
     if source_poly.material_index in textures:
      ids=list(source_poly.vertices);loops=list(source_poly.loop_indices)
      co=nearest[0];a0,b0,c0=[base.data.vertices[k].co for k in ids[:3]]
      bary=geometry.barycentric_transform(co,a0,b0,c0,Vector((1,0,0)),Vector((0,1,0)),Vector((0,0,1)))
      texuv=source_uv[loops[0]].uv*bary.x+source_uv[loops[1]].uv*bary.y+source_uv[loops[2]].uv*bary.z
      size,pixels=textures[source_poly.material_index];ix=min(size[0]-1,max(0,int(texuv.x*(size[0]-1))));iy=min(size[1]-1,max(0,int(texuv.y*(size[1]-1))));rgb=tuple(float(x) for x in pixels[iy,ix,:3])
    foliage=kind!='rock' and mesh.materials[poly.material_index].name.startswith('canopy')
    if kind!='rock' and not foliage:rgb=(.32,.23,.13)
    if foliage:
     r,g,b=rgb;rgb=(r*.88,min(1,max(g,r*1.13,b*1.18)),b*.78)
    # Source albedo sampled into vertex colours; no new material or ground plate.
    col=tuple(int(max(0,min(1,linear(c)))*255+.5) for c in rgb)
    p=(round(v.co.x,6),round(v.co.z,6),round(-v.co.y,6));key=p+col
    if key not in lookup:lookup[key]=len(positions);positions.append(p);colors.append(col)
    face.append(lookup[key])
   faces.append(face)
  pts=np.asarray(positions,dtype=np.float64);lo=pts[:,1].min();hi=pts[:,1].max();fit=height/max(.001,hi-lo);pts[:,1]=(pts[:,1]-lo)*fit;pts[:,0]*=fit;pts[:,2]*=fit;positions=pts.tolist()
  size=write_glb(kind+'_'+lod,positions,colors,faces)
  reports.append({'kind':kind,'lod':lod,'triangles':len(faces),'vertices':len(positions),'bytes':size,'height':height,'sourceTriangles':original,'texturesSampled':len(textures)})
  bpy.data.objects.remove(obj,do_unlink=True)
 bpy.data.objects.remove(base,do_unlink=True)
(OUT/'manifest.json').write_text(json.dumps({'generator':'TRELLIS.2 on Hugging Face + Blender decimation','assets':reports},indent=2))
print('ASSETS',json.dumps(reports))
