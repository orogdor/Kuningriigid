import bpy, os, math, json
from pathlib import Path
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
source='/trellis/odamees_trellis2_original.glb'
destination='/tmp/odamees_trellis2_5000.glb'
print('S5K_IMPORT_START', flush=True)
bpy.ops.import_scene.gltf(filepath=source)
objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
print('S5K_MESHES',[(o.name,len(o.data.vertices),len(o.data.polygons),len(o.data.uv_layers)) for o in objects],flush=True)
if len(objects)!=1:raise RuntimeError('Expected one imported mesh')
ob=objects[0]
# Weld source's duplicated vertices at matching positions while retaining UV per-loop seams.
bpy.context.view_layer.objects.active=ob
bpy.ops.object.select_all(action='DESELECT');ob.select_set(True)
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=0.000005)
bpy.ops.object.mode_set(mode='OBJECT')
print('S5K_WELDED',len(ob.data.vertices),len(ob.data.polygons),len(ob.data.uv_layers),flush=True)
total=sum(len(p.vertices)-2 for p in ob.data.polygons)
target=5003.5
print('S5K_START',total,'ratio',target/total,flush=True)
bpy.context.view_layer.objects.active=ob
for o in bpy.context.selected_objects:o.select_set(False)
ob.select_set(True)
mod=ob.modifiers.new('Quadric Collapse 5000','DECIMATE')
mod.decimate_type='COLLAPSE'
mod.ratio=target/total
mod.use_collapse_triangulate=True
bpy.ops.object.modifier_apply(modifier=mod.name)
# Ensure all polygons are triangles, preserve existing UVs by Blender face-corner interpolation.
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.quads_convert_to_tris()
bpy.ops.object.mode_set(mode='OBJECT')
after=sum(len(p.vertices)-2 for p in ob.data.polygons)
print('S5K_AFTER',after,'vertices',len(ob.data.vertices),'UV',len(ob.data.uv_layers),'material',len(ob.data.materials),flush=True)
if not (4900<=after<=5100):raise RuntimeError('Face count outside target')
if not len(ob.data.uv_layers):raise RuntimeError('UVs lost')
bpy.ops.export_scene.gltf(filepath=destination,export_format='GLB',export_texcoords=True,export_normals=True,export_materials='EXPORT', export_image_format='AUTO')
print('S5K_EXPORTED',destination,os.path.getsize(destination),flush=True)
