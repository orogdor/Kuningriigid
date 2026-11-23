extends SceneTree
const Detail=preload("res://scripts/detail_view.gd")
const Defaults=preload("res://data/house_default_designs.json")
const Model=preload("res://scripts/house_plan_model.gd")
class SlopedDetail:
 extends Detail
 func display_height(x:float,z:float)->float:return x*0.04+z*0.07
func _initialize():call_deferred("run_test")
func run_test():
 var detail=SlopedDetail.new();root.add_child(detail)
 var design:Dictionary=Defaults.data.house.duplicate(true)
 var first=detail.create_designed_building("house",0,design);var other=detail.create_designed_building("house",0,design)
 detail.add_child(first);detail.add_child(other);first.position=Vector3(12,2,-7);first.rotation.y=0.7;first.scale=Vector3(1.2,1.4,0.9)
 var yard:MeshInstance3D=first.find_child("WeatheredYard",true,false);var other_yard:MeshInstance3D=other.find_child("WeatheredYard",true,false);var shared:Mesh=other_yard.mesh
 detail.conform_designed_yard(first)
 assert(yard.mesh!=shared and other_yard.mesh==shared,"Adapting one yard must not change the cached design")
 var vertices:PackedVector3Array=yard.mesh.surface_get_arrays(0)[Mesh.ARRAY_VERTEX]
 for i in [0,int(vertices.size()/3),vertices.size()-1]:
  var point:Vector3=detail.to_local(yard.to_global(vertices[i]))
  assert(absf(point.y-detail.display_height(point.x,point.z)-0.025)<0.001,"Yard vertices must follow terrain after scaling and rotation")
 Model.clear_cache();detail.queue_free();print("HOUSE_YARD_TERRAIN_OK");quit()
