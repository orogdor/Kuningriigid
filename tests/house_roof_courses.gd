extends SceneTree
const Model=preload("res://scripts/house_plan_model.gd")
const Defaults=preload("res://data/house_default_designs.json")
const Plan=preload("res://scripts/house_plan_geometry.gd")
func _initialize() -> void:
 var model=Model.new();root.add_child(model)
 var design:Dictionary=Defaults.data.house.duplicate(true);design.roofMat="reed"
 model.rebuild(design)
 var course=model.find_child("OverlappingReedCourses",true,false)
 assert(course is MeshInstance3D and course.mesh.get_surface_count()>0,"Reed roof must have overlapping courses")
 assert(course.mesh.surface_get_material(0) is ShaderMaterial,"Reed courses must use the varied reed material")
 assert(model.find_child("ReedEaveFringe",true,false) is MeshInstance3D,"Reed roof must include cut eave strands")
 var fires: Array=design.items.filter(func(item):return item.type=="fire")
 assert(not fires.is_empty(),"Fixture must contain a hearth")
 var fire:Vector3=model.local(Plan.point(fires[0].point));var point:=Vector2(fire.x,fire.z)
 assert(covered(model,point)==0,"Roof must leave a smoke opening above the hearth")
 design.items=design.items.filter(func(item):return item.type!="fire");model.rebuild(design)
 assert(covered(model,point)>0,"Roof should cover the same point without a hearth")
 design.roofMat="bark";model.rebuild(design)
 assert(model.find_child("OverlappingReedCourses",true,false)==null,"Bark roof must not receive reed courses")
 assert(model.find_child("ReedEaveFringe",true,false)==null,"Bark roof must not receive reed strands")
 assert(model.find_child("RoofDeck",true,false).mesh.surface_get_material(0) is StandardMaterial3D,"Bark roof must keep its own material")
 var hall:Dictionary=Defaults.data.hall.duplicate(true);hall.roofMat="reed";model.rebuild(hall)
 assert(model.find_child("OverlappingReedCourses",true,false) is MeshInstance3D,"Rectangular reed roof must have courses")
 assert(model.find_child("HouseWallLog",true,false) is MeshInstance3D,"Timber hall must show horizontal logs")
 hall.wallStyle="halftimber";model.rebuild(hall)
 assert(model.find_child("HouseWallBrace",true,false) is MeshInstance3D,"Half-timbered walls must show wooden braces")
 for style in ["stave","bamboo"]:
  hall.wallStyle=style;model.rebuild(hall)
  assert(model.find_child("HouseWallStave",true,false) is MeshInstance3D,"Upright timber and bamboo walls must show vertical poles")
 hall.wallStyle="weave";model.rebuild(hall)
 assert(model.find_child("HouseWovenBranches",true,false) is MeshInstance3D,"Wattle walls must show woven branches")
 print("HOUSE_ROOF_COURSES_OK");model.queue_free();quit()

func covered(model:Node,point:Vector2) -> int:
 var found:=0
 for child in model.get_children():
  if child.name not in ["RoofDeck","OverlappingReedCourses"] or not child is MeshInstance3D:continue
  var vertices:PackedVector3Array=child.mesh.surface_get_arrays(0)[Mesh.ARRAY_VERTEX]
  for i in range(0,vertices.size(),3):
   var a:=Vector2(vertices[i].x,vertices[i].z);var b:=Vector2(vertices[i+1].x,vertices[i+1].z);var c:=Vector2(vertices[i+2].x,vertices[i+2].z)
   if Geometry2D.is_point_in_polygon(point,PackedVector2Array([a,b,c])):found+=1
 return found
