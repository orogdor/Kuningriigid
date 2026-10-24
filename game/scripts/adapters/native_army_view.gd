extends Node3D
## Instanced army markers, using native Godot rendering (no Three.js scene graph).
## A marker represents one surviving military unit, not all 24 individual men.
var node: MultiMeshInstance3D
var batch: MultiMesh
var visible_armies: bool = true
const COLORS: Array[Color] = [Color("5eacff"),Color("ed736a"),Color("80d39c"),Color("d5a8f5")]

func _ready() -> void:
    var cube := BoxMesh.new()
    cube.size = Vector3(.48,.82,.48)
    var mat := StandardMaterial3D.new()
    mat.vertex_color_use_as_albedo = true
    mat.roughness = .9
    cube.material = mat
    batch = MultiMesh.new()
    batch.transform_format = MultiMesh.TRANSFORM_3D
    batch.use_colors = true
    batch.mesh = cube
    batch.custom_aabb = AABB(Vector3(-10,-10,-10),Vector3(250,50,200))
    node = MultiMeshInstance3D.new()
    node.multimesh = batch
    add_child(node)

func refresh(state: Dictionary,heights: PackedFloat32Array) -> void:
    if batch == null:
        return
    var list: Array = []
    for army in state.get("armies",[]):
        var units: Array = []
        for u in state.get("military_units",[]):
            if int(u.get("armyId",-1)) == int(army.get("id",-2)) and int(u.get("team",-1)) == int(army.get("team",-2)) and float(u.get("hp",0.0)) > 0.0:
                units.append(u)
        if not units.is_empty():
            list.append({"army":army,"units":units})
    var amount: int = 0
    for record in list:
        amount += record["units"].size()
    batch.instance_count = amount
    node.visible = visible_armies
    var index: int = 0
    for record in list:
        var army: Dictionary = record["army"]
        var path: Array = army.get("path",[])
        var step: int = int(army.get("waypoint",0))
        var x: float = float(army.get("c",0))+.5
        var z: float = float(army.get("r",0))+.5
        var heading: float = 0.0
        if step < path.size():
            var target: Array = path[step]
            var fraction: float = clampf(float(army.get("travel_clock",0.0))/maxf(.1,float(army.get("travel_duration",4.0))),0.0,1.0)
            var dx: float = float(target[0])-float(army["c"])
            var dz: float = float(target[1])-float(army["r"])
            x += dx*fraction
            z += dz*fraction
            heading = atan2(dx,dz)
        var y: float = .5
        if heights.size() == 220*165:
            var c: int = clampi(int(x),0,219)
            var r: int = clampi(int(z),0,164)
            y += heights[r*220+c]*.52
        var units: Array = record["units"]
        for k in range(units.size()):
            var local_x: float = float(k%4-1)*.58
            var local_z: float = float(k/4)*.58
            batch.set_instance_transform(index,Transform3D(Basis(Vector3.UP,heading),Vector3(x+local_x,y,z+local_z)))
            batch.set_instance_color(index,COLORS[int(army["team"])%4].lerp(Color.WHITE,.30 if units[k].get("grade","standard") == "elite" else 0.0))
            index += 1
