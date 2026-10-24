extends Node3D
## Live native Godot world-map markers for physically traveling settlers.
## No hidden Three.js objects and no heavy imported meshes on Android.
const COLORS: Array[Color] = [
    Color("5eacff"),Color("ed736a"),Color("80d39c"),Color("d5a8f5")]
var instances: MultiMesh
var marker: MultiMeshInstance3D

func _ready() -> void:
    var body := CylinderMesh.new()
    body.top_radius = .26
    body.bottom_radius = .44
    body.height = 1.55
    var paint := StandardMaterial3D.new()
    paint.vertex_color_use_as_albedo = true
    paint.roughness = 1.0
    body.material = paint
    instances = MultiMesh.new()
    instances.mesh = body
    instances.transform_format = MultiMesh.TRANSFORM_3D
    instances.use_colors = true
    instances.custom_aabb = AABB(Vector3(-1,-2,-1),Vector3(223,30,167))
    marker = MultiMeshInstance3D.new()
    marker.name = "TravelingFounderUnits"
    marker.multimesh = instances
    add_child(marker)

func refresh(state: Dictionary,heights: PackedFloat32Array) -> void:
    if instances == null:
        return
    var list: Array = state.get("settler_missions",[])
    instances.instance_count = list.size()
    for i in range(list.size()):
        var mission: Dictionary = list[i]
        var c: int = int(mission.get("c",0))
        var r: int = int(mission.get("r",0))
        var y: float = .9
        if heights.size() == 220*165 and c >= 0 and c < 220 and r >= 0 and r < 165:
            y += heights[r*220+c]*.52
        instances.set_instance_transform(i,Transform3D(Basis(),Vector3(float(c)+.5,y,float(r)+.5)))
        instances.set_instance_color(i,COLORS[clampi(int(mission.get("team",0)),0,3)])
