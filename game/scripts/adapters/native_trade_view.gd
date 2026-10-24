extends Node3D
## One Godot MultiMesh for all travelling world-map caravans.
## Visuals are low-poly proxies. Goods/positions come from trade_network_port.gd.
var instance: MultiMeshInstance3D
var batch: MultiMesh
var shown: int = 0
const TEAM_COLORS: Array[Color] = [Color("5eacff"),Color("ed736a"),Color("80d39c"),Color("d5a8f5")]

func _ready() -> void:
    var body := BoxMesh.new()
    body.size = Vector3(.60,.40,.90)
    var mat := StandardMaterial3D.new()
    mat.vertex_color_use_as_albedo = true
    mat.roughness = 1.0
    body.material = mat
    batch = MultiMesh.new()
    batch.transform_format = MultiMesh.TRANSFORM_3D
    batch.use_colors = true
    batch.mesh = body
    batch.custom_aabb = AABB(Vector3(-4,-6,-4),Vector3(228,28,175))
    instance = MultiMeshInstance3D.new()
    instance.multimesh = batch
    add_child(instance)

func refresh(state: Dictionary,heights: PackedFloat32Array) -> void:
    if batch == null:
        return
    var shipments: Array = state.get("shipments",[])
    batch.instance_count = shipments.size()
    shown = shipments.size()
    for index in range(shipments.size()):
        var cargo: Dictionary = shipments[index]
        var path: Array = cargo.get("path",[])
        var step: int = int(cargo.get("waypoint",0))
        var x: float = float(cargo.get("c",0))+.5
        var z: float = float(cargo.get("r",0))+.5
        var heading: float = 0.0
        if step < path.size():
            var next: Array = path[step]
            var seconds: float = maxf(.001,4.0)
            var fraction: float = clampf(float(cargo.get("travel_clock",0.0))/seconds,0.0,1.0)
            var dx: float = float(next[0]) - float(cargo.get("c",0))
            var dz: float = float(next[1]) - float(cargo.get("r",0))
            x += dx*fraction
            z += dz*fraction
            heading = atan2(dx,dz)
        var y: float = .40
        if heights.size() == 220*165:
            var gx: int = clampi(int(x),0,219)
            var gz: int = clampi(int(z),0,164)
            y += heights[gz*220+gx]*.52
        var basis := Basis(Vector3.UP,heading)
        batch.set_instance_transform(index,Transform3D(basis,Vector3(x,y,z)))
        batch.set_instance_color(index,TEAM_COLORS[int(cargo.get("team",0))%4])
