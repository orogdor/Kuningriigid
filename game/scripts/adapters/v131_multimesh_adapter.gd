extends RefCounted
## Replaces per-object Three.js Mesh/Group copies and soldier-batch-v90.js.
## Compiles GLB MeshInstance3D surfaces into material batches once, then
## uses MultiMeshInstance3D for high instance counts. Skinned animation is NOT
## replicated here: this is a static-pose visual/render benchmark adapter.

static func collect_surfaces(source: Node3D) -> Array[Dictionary]:
    var list: Array[Dictionary] = []
    _walk(source, Transform3D.IDENTITY, list)
    return list

static func _walk(node: Node, accumulated: Transform3D, list: Array[Dictionary]) -> void:
    var transform := accumulated
    if node is Node3D:
        transform = accumulated * (node as Node3D).transform
    if node is MeshInstance3D:
        var mi: MeshInstance3D = node
        if mi.mesh != null:
            for si in range(mi.mesh.get_surface_count()):
                if mi.mesh.surface_get_primitive_type(si) != Mesh.PRIMITIVE_TRIANGLES:
                    continue
                var mat: Material = mi.get_surface_override_material(si)
                if mat == null:
                    mat = mi.mesh.surface_get_material(si)
                list.append({"mesh": mi.mesh, "surface": si, "transform": transform, "material": mat})
    for child in node.get_children():
        _walk(child, transform, list)

static func compile_batches(source: Node3D, count: int, parent: Node3D) -> Array:
    var surfaces: Array[Dictionary] = collect_surfaces(source)
    var groups: Dictionary = {}
    for part in surfaces:
        var mat: Material = part["material"]
        var key: int = mat.get_instance_id() if mat != null else 0
        if not groups.has(key):
            groups[key] = {"material": mat, "parts": []}
        groups[key]["parts"].append(part)
    var result: Array = []
    for group in groups.values():
        var tool := SurfaceTool.new()
        tool.begin(Mesh.PRIMITIVE_TRIANGLES)
        for part in group["parts"]:
            tool.append_from(part["mesh"], int(part["surface"]), part["transform"])
        var merged: ArrayMesh = tool.commit()
        if merged == null or merged.get_surface_count() == 0:
            continue
        if group["material"] != null:
            merged.surface_set_material(0, group["material"])
        var mm := MultiMesh.new()
        mm.transform_format = MultiMesh.TRANSFORM_3D
        mm.mesh = merged
        mm.instance_count = count
        mm.visible_instance_count = count
        mm.custom_aabb = AABB(Vector3(-10,-20,-10),Vector3(250,70,200))
        var node := MultiMeshInstance3D.new()
        node.multimesh = mm
        node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
        parent.add_child(node)
        result.append(node)
    return result

static func visual_span(source: Node3D) -> float:
    # Approximate dimension for normalizing unit model scale to world tiles.
    var parts := collect_surfaces(source)
    var max_dim: float = 0.01
    for part in parts:
        var aabb: AABB = (part["mesh"] as Mesh).get_aabb()
        var xf: Transform3D = part["transform"]
        var low: Vector3 = xf * aabb.position
        var high: Vector3 = xf * aabb.end
        max_dim = maxf(max_dim, (high - low).length())
    return max_dim

static func place(instances: Array, index: int, position: Vector3, scale_factor: float, rotation_y: float = 0.0) -> void:
    var transform := Transform3D(Basis(Vector3.UP, rotation_y).scaled(Vector3.ONE * scale_factor),position)
    for node in instances:
        (node as MultiMeshInstance3D).multimesh.set_instance_transform(index,transform)

static func dispose(instances: Array) -> void:
    for node in instances:
        if is_instance_valid(node):
            node.queue_free()
