extends Node3D
## Draw every pending local shipment with a single native MultiMesh.
## Visual positions match native_city_buildings.gd's proxy footprint.
var instance: MultiMeshInstance3D
var meshes: MultiMesh
var carrier_meshes: MultiMesh
var shown: int = 0

func _ready() -> void:
    var box := BoxMesh.new()
    box.size = Vector3(0.24,0.18,0.24)
    var material := StandardMaterial3D.new()
    material.vertex_color_use_as_albedo = true
    material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
    box.material = material
    meshes = MultiMesh.new()
    meshes.transform_format = MultiMesh.TRANSFORM_3D
    meshes.use_colors = true
    meshes.mesh = box
    meshes.custom_aabb = AABB(Vector3(-5,-10,-5),Vector3(230,60,180))
    instance = MultiMeshInstance3D.new()
    instance.multimesh = meshes
    add_child(instance)
    # One additional native batch for people carrying goods; these are simple
    # stand-ins, not the original V131 character animation skeletons.
    var walker := CapsuleMesh.new()
    walker.radius = 0.085
    walker.height = 0.38
    var walker_mat := StandardMaterial3D.new()
    walker_mat.albedo_color = Color("e5dcb3")
    walker.material = walker_mat
    carrier_meshes = MultiMesh.new()
    carrier_meshes.transform_format = MultiMesh.TRANSFORM_3D
    carrier_meshes.mesh = walker
    carrier_meshes.custom_aabb = meshes.custom_aabb
    var carriers := MultiMeshInstance3D.new()
    carriers.name = "CitizenPorters"
    carriers.multimesh = carrier_meshes
    add_child(carriers)

func refresh(towns: Array, heights: PackedFloat32Array) -> void:
    if meshes == null:
        return
    var items: Array = []
    for city in towns:
        for shipment in city.get("cargo",[]):
            items.append(shipment)
    meshes.instance_count = items.size()
    carrier_meshes.instance_count = items.size()
    shown = items.size()
    for i in range(items.size()):
        var shipment: Dictionary = items[i]
        var x: float = float(shipment.get("x",0.0))
        var z: float = float(shipment.get("z",0.0))
        var y: float = 0.3
        if heights.size() == 220*165:
            var gx: int = clampi(int(x),0,219)
            var gz: int = clampi(int(z),0,164)
            y += heights[gz*220+gx]*0.52
        meshes.set_instance_transform(i,Transform3D(Basis.IDENTITY,Vector3(x,y,z)))
        carrier_meshes.set_instance_transform(i,Transform3D(Basis.IDENTITY,Vector3(x+.22,y+.22,z+.03)))
        var key: String = String(shipment.get("key",""))
        meshes.set_instance_color(i,Color("efc47a") if key in ["wood","plank","stone"] else (Color("87cc78") if key in ["grain","meat","fish","bread","flour"] else Color("80b5e7")))
