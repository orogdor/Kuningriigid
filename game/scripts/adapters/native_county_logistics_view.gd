extends Node3D
## V2.3 native MultiMesh atlas overlay: persistent county workers and loads.
## Each agent uses the exact world tile recorded by the sim. No animated
## sprite allocation per cart or per worker, so Android drawcalls stay bounded.
const COLS: int = 220
const ROWS: int = 165
const Logistics = preload("res://scripts/core/county_logistics_port.gd")
var worker_mesh: MultiMesh
var cargo_mesh: MultiMesh
var supply_mesh: MultiMesh
var supply_count: int = 0
var worker_count: int = 0
var cargo_count: int = 0

func _make_layer(mesh: PrimitiveMesh, tint: Color,name: String) -> MultiMesh:
    var material := StandardMaterial3D.new()
    material.albedo_color = tint
    material.roughness = 1.0
    mesh.material = material
    var multimesh := MultiMesh.new()
    multimesh.transform_format = MultiMesh.TRANSFORM_3D
    multimesh.mesh = mesh
    multimesh.custom_aabb = AABB(Vector3(-2,-6,-2),Vector3(COLS+4,25,ROWS+4))
    multimesh.instance_count = 0
    var inst := MultiMeshInstance3D.new()
    inst.name = name
    inst.multimesh = multimesh
    add_child(inst)
    return multimesh

func _ready() -> void:
    var human := CapsuleMesh.new()
    human.radius = .19
    human.height = .65
    worker_mesh = _make_layer(human,Color("efc36a"),"CountyWorkers")
    var wagon := BoxMesh.new()
    wagon.size = Vector3(.42,.30,.62)
    cargo_mesh = _make_layer(wagon,Color("a97b4c"),"CountyLoads")
    var supplies := BoxMesh.new()
    supplies.size = Vector3(.42,.30,.62)
    supply_mesh = _make_layer(supplies,Color("57a7d8"),"CountyInputSupplies")

func _apply_position(batch: MultiMesh,index: int,item: Dictionary,heights: PackedFloat32Array,roads: Dictionary,now: float) -> void:
    var pos: Vector2 = Logistics.world_position(item,roads,now,batch == worker_mesh)
    var x: float = pos.x
    var z: float = pos.y
    var waypoints: Array = item.get("path",[])
    var cursor: int = int(item.get("waypoint",0))
    var orientation: float = 0.0
    if cursor < waypoints.size():
        var next: Array = waypoints[cursor]
        orientation = atan2(float(next[0])-float(item.get("c",0)),float(next[1])-float(item.get("r",0)))
    var y: float = .35
    if heights.size() == COLS*ROWS:
        var c: int = clampi(int(x),0,COLS-1)
        var r: int = clampi(int(z),0,ROWS-1)
        y += heights[r*COLS+c]*.52
    batch.set_instance_transform(index,Transform3D(Basis(Vector3.UP,orientation),Vector3(x,y,z)))

func refresh(state: Dictionary,heights: PackedFloat32Array) -> void:
    if worker_mesh == null or cargo_mesh == null or supply_mesh == null:
        return
    var workers: Array = []
    for city in state.get("cities",[]):
        for site in city.get("county_worksites",[]):
            var worker: Dictionary = site.get("worker",{})
            if not worker.is_empty() and not bool(site.get("suspended",false)) and float(site.get("assigned",0.0)) > 0.0:
                workers.append(worker)
    var shipments: Array = state.get("county_shipments",[])
    var inbound: Array = []
    var outbound: Array = []
    for shipment in shipments:
        if String(shipment.get("direction","return")) == "supply":
            inbound.append(shipment)
        else:
            outbound.append(shipment)
    worker_count = workers.size()
    supply_count = inbound.size()
    cargo_count = shipments.size()
    worker_mesh.instance_count = worker_count
    cargo_mesh.instance_count = outbound.size()
    supply_mesh.instance_count = supply_count
    var roads: Dictionary = state.get("world_roads",{})
    var now: float = float(state.get("seconds",0.0))
    for i in range(worker_count):
        _apply_position(worker_mesh,i,workers[i],heights,roads,now)
    for i in range(outbound.size()):
        _apply_position(cargo_mesh,i,outbound[i],heights,roads,now)
    for i in range(supply_count):
        _apply_position(supply_mesh,i,inbound[i],heights,roads,now)
