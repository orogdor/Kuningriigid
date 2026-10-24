extends Node3D
const Cargo = preload("res://scripts/core/cargo_port.gd")
const Layout = preload("res://scripts/core/city_layout_port.gd")
## Mobile-friendly native GeometryInstance3D demonstration of town placement.
## The building list is from PreviewSim; geometry/locations are PROXIES, not
## the historical V131 detailed city mesh or actual worker path layout.
var _batch_nodes: Array = []
var _shape_cache: Dictionary = {}
var _colors: Dictionary = {
    "hall":Color("d0c3a4"), "lumber":Color("886f47"),
    "quarry":Color("a8a79c"), "well":Color("6aa4b8"),
    "saw":Color("b58a4e"), "house":Color("c8a984"),
    "farm":Color("b7b76e"), "mill":Color("c6beb2"),
    "bakery":Color("b8795b"), "barracks":Color("ad6d61")
}

func refresh(towns: Array, heights: PackedFloat32Array) -> void:
    for node in _batch_nodes:
        if is_instance_valid(node):
            node.queue_free()
    _batch_nodes.clear()
    # One native MultiMesh per type/status rather than hundreds of nodes.
    var grouped: Dictionary = {}
    for town in towns:
        var buildings: Array = town.get("buildings",[])
        var center := Vector2(float(town.get("c",0))+.5,float(town.get("r",0))+.5)
        for index in range(buildings.size()):
            var b: Dictionary = buildings[index]
            var kind: String = String(b.get("type","house"))
            var ready: bool = bool(b.get("ready",false))
            var key: String = kind + ("_done" if ready else "_unfinished")
            if not grouped.has(key):
                grouped[key] = {"kind":kind,"ready":ready,"transforms":[]}
            # World and detail map now share a SINGLE saved building lot.
            var world_site: Vector2 = Cargo.building_position(town,index)
            # V3.5 parcels are 10m proxy units but the atlas is 1 unit/tile.
            # Use a single explicit transform for both main-map and detail.
            var atlas_site: Vector2 = Layout.site_on_atlas(town,world_site)
            var x: float = atlas_site.x
            var z: float = atlas_site.y
            var angle: float = float(index) * .27
            var base_x: int = clampi(int(x),0,219)
            var base_z: int = clampi(int(z),0,164)
            var y: float = 0.0
            if heights.size() == 220*165:
                y = heights[base_z*220 + base_x]*.52
            var size: Vector3 = _proxy_size(kind)
            var tr := Transform3D(Basis(Vector3.UP,angle*.25).scaled(size),Vector3(x,y+size.y*.5+.1,z))
            grouped[key]["transforms"].append(tr)
    for entry in grouped.values():
        var kind: String = String(entry["kind"])
        var ready: bool = bool(entry["ready"])
        var mesh: Mesh = _box_mesh(kind,ready)
        var transforms: Array = entry["transforms"]
        var mm := MultiMesh.new()
        mm.transform_format = MultiMesh.TRANSFORM_3D
        mm.mesh = mesh
        mm.instance_count = transforms.size()
        mm.custom_aabb = AABB(Vector3(-5,-10,-5),Vector3(230,50,180))
        var instance := MultiMeshInstance3D.new()
        instance.multimesh = mm
        add_child(instance)
        _batch_nodes.append(instance)
        for index in range(transforms.size()):
            mm.set_instance_transform(index,transforms[index])

func _proxy_size(kind: String) -> Vector3:
    match kind:
        "hall": return Vector3(1.2,1.35,1.05)
        "quarry": return Vector3(1.1,.42,1.1)
        "well": return Vector3(.38,.40,.38)
        "barracks": return Vector3(1.0,1.0,.75)
        "house": return Vector3(.65,.7,.65)
        _: return Vector3(.75,.60,.68)

func _box_mesh(kind: String, ready: bool) -> Mesh:
    var id: String = kind + ("_ready" if ready else "_progress")
    if _shape_cache.has(id):
        return _shape_cache[id]
    var shape := BoxMesh.new()
    shape.size = Vector3.ONE
    var material := StandardMaterial3D.new()
    material.albedo_color = _colors.get(kind,Color("8e8b78")) if ready else Color("847f72")
    material.roughness = .9
    shape.material = material
    _shape_cache[id] = shape
    return shape
