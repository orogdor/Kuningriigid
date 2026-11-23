extends SceneTree
const Model=preload("res://scripts/house_plan_model.gd")
const Defaults=preload("res://data/house_default_designs.json")
const Detail=preload("res://scripts/detail_view.gd")
const Edit=preload("res://scripts/house_plan_edit.gd")
const Preview=preload("res://scripts/house_plan_preview.gd")
func _initialize():call_deferred("run_test")
func run_test():
 var model=Model.new();root.add_child(model)
 var design:Dictionary=Defaults.data.house.duplicate(true);model.rebuild(design)
 var yard=model.find_child("WeatheredYard",true,false);assert(yard is MeshInstance3D)
 var arrays=yard.mesh.surface_get_arrays(0);assert(arrays[Mesh.ARRAY_VERTEX].size()>50)
 var colors:PackedColorArray=arrays[Mesh.ARRAY_COLOR];assert(colors[0].a>0.4 and colors[colors.size()-1].a<0.01,"Yard edges must blend into the ground")
 var original_width:float=yard.mesh.get_aabb().size.x
 var resized:=Edit.add_shape(design,"yard",Vector2(200,75),Vector2(760,580),0)
 assert(resized.has("design"),"Valid yard resize should be accepted")
 model.rebuild(resized.design);assert(model.find_child("WeatheredYard",true,false).mesh.get_aabb().size.x>original_width,"Resizing the yard must change its 3D surface")
 var preview=Preview.new();root.add_child(preview);preview.show_design(design);var before:float=preview.distance
 preview.show_design(resized.design);assert(preview.distance>before,"A larger yard must adjust the 3D framing")
 var rejected:=Edit.add_shape(design,"yard",Vector2(400,220),Vector2(550,380),0);assert(rejected.has("error"),"Yard must contain the house")
 var detail=Detail.new();var game_model=detail.create_designed_building("house",0,design)
 assert(game_model!=null and game_model.find_child("WeatheredYard",true,false)!=null,"Designed yard must appear in the game model")
 design.yard=null;model.rebuild(design);assert(model.find_child("WeatheredYard",true,false)==null)
 var prestige:Dictionary=Defaults.data["house@1"].duplicate(true);prestige.bronzePrestige=true;model.rebuild(prestige)
 assert(model.find_child("CourtyardPaving",true,false) is MeshInstance3D,"Bronze prestige yard uses stone paving")
 game_model.free();detail.free();Model.clear_cache();preview.queue_free();model.queue_free()
 print("HOUSE_YARD_OK");quit()

