extends Node3D
## Godot MultiMesh visualisation of SIMULATED job agents and builder agents.
## Does not spawn one Godot Node per resident, minimizing CPU/node overhead.
var node: MultiMeshInstance3D
var batch: MultiMesh
var visible_agents: bool = true
var count: int = 0

func _ready() -> void:
    var capsule := CapsuleMesh.new()
    capsule.radius = 0.10
    capsule.height = 0.42
    var mat := StandardMaterial3D.new()
    mat.vertex_color_use_as_albedo = true
    capsule.material = mat
    batch = MultiMesh.new()
    batch.transform_format = MultiMesh.TRANSFORM_3D
    batch.use_colors = true
    batch.mesh = capsule
    batch.custom_aabb = AABB(Vector3(-4,-10,-4),Vector3(230,70,180))
    node = MultiMeshInstance3D.new()
    node.multimesh = batch
    add_child(node)

func refresh(towns: Array, heights: PackedFloat32Array) -> void:
    if batch == null:
        return
    var active: Array = []
    for city in towns:
        for agent in city.get("citizens",{}).values():
            if String(agent.get("status","")) not in ["Kodus","Tee puudub"]:
                active.append(agent)
    count = active.size()
    batch.instance_count = count
    node.visible = visible_agents
    for i in range(count):
        var agent: Dictionary = active[i]
        var x: float = float(agent.get("x",0.0))
        var z: float = float(agent.get("z",0.0))
        var y: float = 0.35
        if heights.size() == 220*165:
            y += heights[clampi(int(z),0,164)*220+clampi(int(x),0,219)]*.52
        batch.set_instance_transform(i,Transform3D(Basis.IDENTITY,Vector3(x,y,z)))
        var builder: bool = String(agent.get("kind","")) == "builder"
        var shopper: bool = String(agent.get("kind","")) == "market_woman"
        batch.set_instance_color(i,Color("ffd16c") if builder else (Color("f38abd") if shopper else Color("b2e7ee")))
