# V269: ultra-low world-map versions of the detail models.
# For each input GLB: sample the base-colour texture into per-vertex colours (averaged per vertex, so there
# are no colour seams), drop UVs/textures, decimate to TARGET triangles, export GLB with COLOR_0 only.
#   python world-lod-v269-blender.py TARGET out_dir in1.glb in2.glb ...
import bpy,bmesh,sys,os
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:]
target=int(args[0]);out=args[1];files=args[2:]
os.makedirs(out,exist_ok=True)
for f in files:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=f)
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 for o in bpy.context.selected_objects:o.select_set(False)
 for o in meshes:o.select_set(True)
 bpy.context.view_layer.objects.active=meshes[0]
 if len(meshes)>1:bpy.ops.object.join()
 ob=bpy.context.view_layer.objects.active;me=ob.data
 bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 # texture per material slot
 imgs=[]
 for slot in ob.material_slots:
  img=None
  if slot.material and slot.material.node_tree:
   for n in slot.material.node_tree.nodes:
    if n.type=='TEX_IMAGE' and any(l.to_socket.name=='Base Color' for l in n.outputs['Color'].links):img=n.image
  pix=None
  if img:w,h=img.size;pix=(w,h,list(img.pixels[:]))
  col=list(slot.material.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value) if slot.material and slot.material.node_tree and 'Principled BSDF' in slot.material.node_tree.nodes else [.6,.55,.45,1]
  imgs.append((pix,col))
 uv=me.uv_layers.active.data if me.uv_layers else None
 acc=[[0,0,0,0] for _ in me.vertices]
 for poly in me.polygons:
  pix,col=imgs[poly.material_index] if imgs else (None,[.6,.55,.45,1])
  for li in poly.loop_indices:
   vi=me.loops[li].vertex_index
   if pix and uv:
    w,h,px=pix;u,v=uv[li].uv;x=min(w-1,max(0,int((u%1)*w)));y=min(h-1,max(0,int((v%1)*h)));k=(y*w+x)*4;c=px[k:k+3]
   else:c=col[:3]
   a=acc[vi];a[0]+=c[0];a[1]+=c[1];a[2]+=c[2];a[3]+=1
 attr=me.color_attributes.new(name='Col',type='FLOAT_COLOR',domain='POINT')
 lin=lambda c:c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4  # texture pixels are sRGB, glTF vertex colours are linear
 for i,a in enumerate(acc):n=max(1,a[3]);attr.data[i].color=(lin(a[0]/n),lin(a[1]/n),lin(a[2]/n),1)
 while me.uv_layers:me.uv_layers.remove(me.uv_layers[0])
 me.materials.clear()
 mat=bpy.data.materials.new('world_lod');mat.use_nodes=True;nt=mat.node_tree;vc=nt.nodes.new('ShaderNodeVertexColor');vc.layer_name='Col'
 nt.links.new(vc.outputs['Color'],nt.nodes['Principled BSDF'].inputs['Base Color']);nt.nodes['Principled BSDF'].inputs['Roughness'].default_value=.95
 me.materials.append(mat)
 # solid, closed shape first (AI meshes are thin open shells that shred when decimated):
 # voxel remesh a copy, then transfer the colours back from the original by nearest surface
 src=ob;dup=ob.copy();dup.data=ob.data.copy();bpy.context.collection.objects.link(dup)
 dims=max(src.dimensions)
 # give thin open planes (thatch, racks, fences) a thickness so the voxel remesh keeps them
 sol=dup.modifiers.new('s','SOLIDIFY');sol.thickness=dims/float(os.environ.get('VOXELS','36'))*1.6;sol.offset=0
 bpy.context.view_layer.objects.active=dup;bpy.ops.object.modifier_apply(modifier=sol.name)
 rm=dup.modifiers.new('r','REMESH');rm.mode='VOXEL';rm.voxel_size=dims/float(os.environ.get('VOXELS','36'));rm.adaptivity=0
 bpy.context.view_layer.objects.active=dup;bpy.ops.object.modifier_apply(modifier=rm.name)
 dup.data.color_attributes.new(name='Col',type='FLOAT_COLOR',domain='POINT')
 dt=dup.modifiers.new('t','DATA_TRANSFER');dt.object=src;dt.use_vert_data=True;dt.data_types_verts={'COLOR_VERTEX'};dt.vert_mapping='POLYINTERP_NEAREST'
 dt.layers_vcol_vert_select_src='ALL';dt.layers_vcol_vert_select_dst='NAME'
 bpy.ops.object.modifier_apply(modifier=dt.name)
 dup.data.materials.clear();dup.data.materials.append(mat)
 bpy.data.objects.remove(src,do_unlink=True);ob=dup;me=ob.data
 for o in bpy.context.selected_objects:o.select_set(False)
 ob.select_set(True);bpy.context.view_layer.objects.active=ob
 tris=lambda:sum(len(p.vertices)-2 for p in me.polygons)
 for _ in range(6):
  n=tris()
  if n<=target*1.05:break
  m=ob.modifiers.new('d','DECIMATE');m.decimate_type='COLLAPSE';m.ratio=target/n;m.use_collapse_triangulate=True;bpy.ops.object.modifier_apply(modifier=m.name)
  if tris()>n*.97:break
 bpy.ops.object.shade_flat()
 name=os.path.basename(f).replace('_far','').replace('_low','')
 dst=os.path.join(out,name)
 bpy.ops.export_scene.gltf(filepath=dst,export_format='GLB',export_texcoords=False,export_normals=True,export_materials='EXPORT',export_vertex_color='ACTIVE',export_all_vertex_colors=False)
 print('RESULT',name,tris(),os.path.getsize(dst))
