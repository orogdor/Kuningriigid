# Fallback for TRELLIS.2 GLBs whose UV atlas is too fragmented for seam-preserving decimation:
# decimate a UV-less copy (or take LOW.glb: python ... SRC.glb LOW.glb DST.glb) to ~TARGET triangles, make new UVs, bake base colour (and the second
# texture slot if it is metallic-roughness via emission pass) from the original onto the low mesh.
#   python trellis_bake_5000_blender.py SRC.glb DST.glb [TARGET] [TEXSIZE]
import bpy,sys,os
a=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:]
g=[x for x in a if x.endswith('.glb')];src,dst=g[0],g[-1];low=g[1] if len(g)==3 else None;nums=[x for x in a if x.isdigit()]
target=int(nums[0]) if nums else 5000;size=int(nums[1]) if len(nums)>1 else 1024
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=src)
hi=[o for o in bpy.context.scene.objects if o.type=='MESH'][0]
if low: # a low mesh decimated elsewhere (e.g. meshoptimizer on positions only)
 before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=low);lo=[o for o in bpy.context.scene.objects if o not in before and o.type=='MESH'][0]
 lo.matrix_world=hi.matrix_world.copy()
else:lo=hi.copy();lo.data=hi.data.copy();bpy.context.collection.objects.link(lo)
for o in bpy.context.selected_objects:o.select_set(False)
bpy.context.view_layer.objects.active=lo;lo.select_set(True)
while lo.data.uv_layers:lo.data.uv_layers.remove(lo.data.uv_layers[0])
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=0.0000001);bpy.ops.object.mode_set(mode='OBJECT')
tris=lambda o:sum(len(p.vertices)-2 for p in o.data.polygons)
for _ in range(6):
 n=tris(lo)
 if n<=target*1.02:break
 m=lo.modifiers.new('d','DECIMATE');m.decimate_type='COLLAPSE';m.ratio=target/n;m.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=m.name)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.quads_convert_to_tris()
lo.data.uv_layers.new(name='UVMap');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=0.004);bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.shade_smooth()
# new material: baked colour image
img=bpy.data.images.new('baked_color',size,size);mat=bpy.data.materials.new('baked');mat.use_nodes=True
nt=mat.node_tree;bsdf=nt.nodes['Principled BSDF'];tex=nt.nodes.new('ShaderNodeTexImage');tex.image=img
nt.links.new(tex.outputs['Color'],bsdf.inputs['Base Color']);bsdf.inputs['Roughness'].default_value=.85;bsdf.inputs['Metallic'].default_value=0
lo.data.materials.clear();lo.data.materials.append(mat);nt.nodes.active=tex
# Transfer without Cycles (its ray bake left dark fur white): for every texel of the new atlas, take
# the closest point on the original surface (BVH) and sample the original base-colour texture there.
import numpy as np
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform
src_img=None
for n in hi.active_material.node_tree.nodes:
 if n.type=='TEX_IMAGE' and any(l.to_socket.name=='Base Color' for l in n.outputs['Color'].links):src_img=n.image
sw,shh=src_img.size;spx=np.array(src_img.pixels[:],dtype=np.float32).reshape(shh,sw,4)
# TRELLIS stores dark fur etc. as light RGB with low alpha; the game's loader (createImageBitmap)
# premultiplies, so that is how the original looks in game. Bake the premultiplied colour, opaque.
spx[...,:3]*=spx[...,3:4]
reach=max(hi.dimensions)*.02;hm=hi.data;hm.calc_loop_triangles();huv=hm.uv_layers.active.data
hv=[v.co.copy() for v in hm.vertices];htri=[(t.vertices[:],t.loops[:]) for t in hm.loop_triangles]
bvh=BVHTree.FromPolygons(hv,[t[0] for t in htri])
lm=lo.data;lm.calc_loop_triangles();luv=lm.uv_layers.active.data
out=np.zeros((size,size,4),dtype=np.float32);hit=np.zeros((size,size),bool)
from mathutils import Vector
for t in lm.loop_triangles:
 P=[lm.vertices[v].co for v in t.vertices];N=[lm.vertices[v].normal for v in t.vertices];U=[luv[l].uv*size for l in t.loops]
 x0=int(max(0,min(u.x for u in U)-1));x1=int(min(size-1,max(u.x for u in U)+1));y0=int(max(0,min(u.y for u in U)-1));y1=int(min(size-1,max(u.y for u in U)+1))
 (ax,ay),(bx,by),(cx,cy)=[(u.x,u.y) for u in U];den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy)
 if abs(den)<1e-12:continue
 U3=[Vector((u.x,u.y,0)) for u in U]
 for y in range(y0,y1+1):
  for x in range(x0,x1+1):
   px,py=x+.5,y+.5;w0=((by-cy)*(px-cx)+(cx-bx)*(py-cy))/den;w1=((cy-ay)*(px-cx)+(ax-cx)*(py-cy))/den;w2=1-w0-w1
   if min(w0,w1,w2)<-0.05:continue
   p3=P[0]*w0+P[1]*w1+P[2]*w2
   nn=(N[0]*w0+N[1]*w1+N[2]*w2).normalized()
   # outermost surface first: the decimated shell sits inside thin outer layers (fur, straps)
   co,nrm,fi,d=bvh.ray_cast(p3+nn*reach,-nn,reach*2)
   if fi is None:co,nrm,fi,d=bvh.find_nearest(p3)
   if fi is None:continue
   vs,ls=htri[fi];uv=barycentric_transform(co,hv[vs[0]],hv[vs[1]],hv[vs[2]],*(Vector((huv[l].uv.x,huv[l].uv.y,0)) for l in ls))
   if uv.x!=uv.x or uv.y!=uv.y:continue
   sx=min(sw-1,max(0,int(uv.x%1*sw)));sy=min(shh-1,max(0,int(uv.y%1*shh)))
   out[y,x]=spx[sy,sx];hit[y,x]=True
# dilate filled texels into the gutters so mip-maps do not bleed background
for _ in range(8):
 m=~hit
 if not m.any():break
 acc=np.zeros_like(out);cnt=np.zeros(hit.shape)
 for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
  sh=np.roll(np.roll(hit,dy,0),dx,1);acc+=np.roll(np.roll(out,dy,0),dx,1)*sh[...,None];cnt+=sh
 f=m&(cnt>0);out[f]=acc[f]/cnt[f][:,None];hit|=f
out[...,3]=1;img.pixels[:]=out.ravel()
img.filepath_raw=dst[:-4]+'_color.png';img.file_format='PNG';img.save();img.pack()
bpy.data.objects.remove(hi,do_unlink=True)
bpy.ops.export_scene.gltf(filepath=dst,export_format='GLB',export_texcoords=True,export_normals=True,export_materials='EXPORT',export_image_format='WEBP')
print('RESULT',os.path.basename(src),'after',tris(lo),'verts',len(lo.data.vertices),'bytes',os.path.getsize(dst))
