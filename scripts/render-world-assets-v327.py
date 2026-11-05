import bpy,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for row,lod in enumerate(['high','low']):
 for col,kind in enumerate(['oak','pine','rock','palm']):
  before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(root/'assets/world-v327'/f'{kind}_{lod}.glb'))
  for o in set(bpy.context.scene.objects)-before:o.location.x+=(col-1.5)*3.8;o.location.y+=row*3.6
bpy.ops.mesh.primitive_plane_add(size=200);ground=bpy.context.object
m=bpy.data.materials.new('neutral ground');m.diffuse_color=(.19,.24,.15,1);ground.data.materials.append(m)
world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.65,.75,1);world.node_tree.nodes['Background'].inputs[1].default_value=.7
bpy.ops.object.light_add(type='SUN',location=(0,0,10));bpy.context.object.data.energy=3;bpy.context.object.rotation_euler=(.5,-.4,-.6)
bpy.ops.object.camera_add(location=(10,-14,10));cam=bpy.context.object;cam.rotation_euler=(Vector((0,1.5,.9))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=17
s=bpy.context.scene;s.camera=cam;s.render.engine='CYCLES';s.cycles.samples=16;s.cycles.use_denoising=False;s.render.resolution_x=1300;s.render.resolution_y=850;s.render.resolution_percentage=100;s.render.filepath=str(root/'previews/world-assets-v327.png');s.view_settings.view_transform='Standard';bpy.ops.render.render(write_still=True)
for name,location in [('rear',(-10,14,10)),('side',(14,6,7))]:
 cam.location=location;cam.rotation_euler=(Vector((0,1.5,.9))-cam.location).to_track_quat('-Z','Y').to_euler();s.cycles.samples=8;s.render.filepath=str(root/('previews/world-assets-v327-'+name+'.png'));bpy.ops.render.render(write_still=True)

