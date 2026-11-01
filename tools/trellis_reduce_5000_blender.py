# Reduce a TRELLIS.2 GLB to ~5000 triangles, keeping UVs and textures (Blender / bpy).
#   python reduce.py SOURCE.glb DEST.glb [TARGET]
# Same steps as tools/axeman_trellis_5000_blender.py: weld duplicated vertices (UV seams kept per
# face corner), quadric Decimate Collapse to the target, triangulate, export GLB.
import bpy, sys, os
args=[a for a in sys.argv if a.endswith('.glb')];src,dst=args[-2],args[-1]
target=float(sys.argv[-1]) if sys.argv[-1].replace('.','',1).isdigit() else 5000
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
obs=[o for o in bpy.context.scene.objects if o.type=='MESH']
if len(obs)!=1:raise RuntimeError('expected one mesh, got %d'%len(obs))
ob=obs[0];bpy.context.view_layer.objects.active=ob;ob.select_set(True)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=float(os.environ.get('WELD','0.000005')));bpy.ops.mesh.dissolve_degenerate(threshold=1e-6);bpy.ops.mesh.delete_loose();bpy.ops.object.mode_set(mode='OBJECT')
tris=lambda:sum(len(p.vertices)-2 for p in ob.data.polygons)
start=tris()
# repeat: some TRELLIS meshes stop early in one pass (seam/boundary limits); later passes go on
for _ in range(8):
 now=tris()
 if now<=target*1.02:break
 mod=ob.modifiers.new('decimate','DECIMATE');mod.decimate_type='COLLAPSE';mod.ratio=target/now;mod.use_collapse_triangulate=True
 bpy.ops.object.modifier_apply(modifier=mod.name)
 if tris()>=now*.98:mod=None;break
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.quads_convert_to_tris();bpy.ops.object.mode_set(mode='OBJECT')
after=tris()
if not len(ob.data.uv_layers):raise RuntimeError('UVs lost')
bpy.ops.export_scene.gltf(filepath=dst,export_format='GLB',export_texcoords=True,export_normals=True,export_materials='EXPORT',export_image_format='AUTO')
print('RESULT',os.path.basename(src),'start',start,'after',after,'vertices',len(ob.data.vertices),'bytes',os.path.getsize(dst))
