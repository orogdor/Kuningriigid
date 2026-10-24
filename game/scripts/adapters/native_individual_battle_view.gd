extends Node3D
## Native Godot rendering; one MultiMesh instance for each living 3D soldier.
## V3.0 switches between a small legacy test arena and a V131-sized 3x3 battlefield.
var soldier_nodes: MultiMeshInstance3D
var batch: MultiMesh
var arena: Node3D
var flat_floor: MeshInstance3D
var relief_mesh: MeshInstance3D
var river_graphics: Node3D
var surface_signature: String = ""
var retreat_lines: Array = []
var overview_lines: Array = []
var retreat_ring_tiles: Array = []
const BattleSurface = preload("res://scripts/core/battle_surface_v131.gd")
var last_count: int = 0
const MeshAdapter = preload("res://scripts/adapters/v131_multimesh_adapter.gd")
var model_batches: Array = []
var model_factor: float = 1.0
var model_template: Node3D
var prefer_original: bool = true
var model_active: bool = false
var team_markers: MultiMeshInstance3D
var marker_mesh: MultiMesh
var arrow_instances: MultiMeshInstance3D
var arrow_mesh: MultiMesh
var last_projectile_count: int = 0
var scenery_nodes: MultiMeshInstance3D
var scenery_mesh: MultiMesh
var scenery_count: int = 0
var wall_nodes: MultiMeshInstance3D
var wall_mesh: MultiMesh
var ladder_nodes: MultiMeshInstance3D
var ladder_mesh: MultiMesh
var last_wall_count: int = 0
const COLORS: Array[Color] = [Color("4e99ee"),Color("e27763"),Color("92b96a"),Color("c3a2eb")]
var SCALE: float = .34 # 3x3 overview uses .09; small sieges keep .34

func _ready() -> void:
    arena = Node3D.new()
    arena.name = "ArenaFloorAndRetreatLine"
    add_child(arena)
    var ground := BoxMesh.new()
    ground.size = Vector3(22.2,.09,17.5)
    var gm := StandardMaterial3D.new()
    gm.albedo_color = Color("b7afa0")
    gm.roughness = 1.0
    flat_floor = _part(ground,gm,Vector3(0.0,-.20,0.0))
    river_graphics = Node3D.new()
    river_graphics.name = "TerrainRiversAndBridges"
    arena.add_child(river_graphics)
    var red := StandardMaterial3D.new()
    red.albedo_color = Color("d84343")
    red.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
    for edge in range(4):
        var mesh := BoxMesh.new()
        mesh.size = Vector3(22.4,.07,.18) if edge < 2 else Vector3(.18,.07,17.6)
        var x: float = 0.0 if edge < 2 else (11.15 if edge == 2 else -11.15)
        var z: float = (8.83 if edge == 0 else -8.83) if edge < 2 else 0.0
        retreat_lines.append(_part(mesh,red,Vector3(x,-.11,z)))
    var person := CapsuleMesh.new()
    person.radius = .15
    person.height = .66
    var material := StandardMaterial3D.new()
    material.vertex_color_use_as_albedo = true
    material.roughness = .95
    person.material = material
    batch = MultiMesh.new()
    batch.transform_format = MultiMesh.TRANSFORM_3D
    batch.use_colors = true
    batch.mesh = person
    soldier_nodes = MultiMeshInstance3D.new()
    soldier_nodes.name = "LivingSoldiersMultiMesh"
    soldier_nodes.multimesh = batch
    add_child(soldier_nodes)
    # Small colored base discs keep team identity legible with unmodified GLB materials.
    var marker_shape := CylinderMesh.new()
    marker_shape.top_radius = .24
    marker_shape.bottom_radius = .24
    marker_shape.height = .04
    var marker_mat := StandardMaterial3D.new()
    marker_mat.vertex_color_use_as_albedo = true
    marker_shape.material = marker_mat
    marker_mesh = MultiMesh.new()
    marker_mesh.transform_format = MultiMesh.TRANSFORM_3D
    marker_mesh.use_colors = true
    marker_mesh.mesh = marker_shape
    team_markers = MultiMeshInstance3D.new()
    team_markers.multimesh = marker_mesh
    add_child(team_markers)
    var arrow := SphereMesh.new()
    arrow.radius = .07
    arrow.height = .14
    var arrow_mat := StandardMaterial3D.new()
    arrow_mat.albedo_color = Color("f4d15a")
    arrow.material = arrow_mat
    arrow_mesh = MultiMesh.new()
    arrow_mesh.transform_format = MultiMesh.TRANSFORM_3D
    arrow_mesh.mesh = arrow
    arrow_instances = MultiMeshInstance3D.new()
    arrow_instances.multimesh = arrow_mesh
    add_child(arrow_instances)
    var scenery_shape := SphereMesh.new()
    scenery_shape.radius = .45
    scenery_shape.height = .75
    var scenery_mat := StandardMaterial3D.new()
    scenery_mat.vertex_color_use_as_albedo = true
    scenery_mat.roughness = 1.0
    scenery_shape.material = scenery_mat
    scenery_mesh = MultiMesh.new()
    scenery_mesh.transform_format = MultiMesh.TRANSFORM_3D
    scenery_mesh.use_colors = true
    scenery_mesh.mesh = scenery_shape
    scenery_nodes = MultiMeshInstance3D.new()
    scenery_nodes.name = "StaticTestBattleObstacles"
    scenery_nodes.multimesh = scenery_mesh
    add_child(scenery_nodes)
    var block := BoxMesh.new()
    block.size = Vector3.ONE
    var wall_mat := StandardMaterial3D.new()
    wall_mat.vertex_color_use_as_albedo = true
    wall_mat.roughness = .95
    block.material = wall_mat
    wall_mesh = MultiMesh.new()
    wall_mesh.transform_format = MultiMesh.TRANSFORM_3D
    wall_mesh.use_colors = true
    wall_mesh.mesh = block
    wall_nodes = MultiMeshInstance3D.new()
    wall_nodes.name = "BronzeWallsGatesAndTowers"
    wall_nodes.multimesh = wall_mesh
    add_child(wall_nodes)
    var ladder := BoxMesh.new()
    ladder.size = Vector3(.23,1.0,.18)
    var ladder_mat := StandardMaterial3D.new()
    ladder_mat.vertex_color_use_as_albedo = true
    ladder_mat.albedo_color = Color.WHITE
    ladder.material = ladder_mat
    ladder_mesh = MultiMesh.new()
    ladder_mesh.transform_format = MultiMesh.TRANSFORM_3D
    ladder_mesh.use_colors = true
    ladder_mesh.mesh = ladder
    ladder_nodes = MultiMeshInstance3D.new()
    ladder_nodes.name = "SiegeLadders"
    ladder_nodes.multimesh = ladder_mesh
    add_child(ladder_nodes)
    visible = false

func _part(mesh: Mesh, material: Material, location: Vector3) -> MeshInstance3D:
    var instance := MeshInstance3D.new()
    instance.mesh = mesh
    instance.material_override = material
    instance.position = location
    arena.add_child(instance)
    return instance

func _refresh_surface(data: Dictionary) -> void:
    var large: bool = bool(data.get("large_field",false))
    SCALE = .09 if large else .34
    var signature: String = JSON.stringify(data.get("tiles",{}))+JSON.stringify(data.get("samples",[]))+JSON.stringify(data.get("bridges",[]))+JSON.stringify(data.get("bridge",{})) if not data.is_empty() else "none"
    if signature == surface_signature:
        return
    surface_signature = signature
    if is_instance_valid(relief_mesh):
        relief_mesh.queue_free()
        relief_mesh = null
    for child in river_graphics.get_children():
        child.queue_free()
    for item in overview_lines:
        if is_instance_valid(item):
            item.queue_free()
    overview_lines.clear()
    for item in retreat_ring_tiles:
        if is_instance_valid(item):
            item.queue_free()
    retreat_ring_tiles.clear()
    for item in retreat_lines:
        if is_instance_valid(item):
            item.visible = not large
    flat_floor.visible = data.is_empty()
    if data.is_empty():
        return
    if large:
        # Visual approximation of the surrounding 5x5 retreat-tile ring.
        # It is intentionally not made navigable land or 9x9 detailed terrain.
        var fringe := StandardMaterial3D.new()
        fringe.albedo_color = Color("59544a")
        fringe.roughness = 1.0
        for rz in range(-2,3):
            for rx in range(-2,3):
                if abs(rx)<2 and abs(rz)<2:
                    continue
                var fringe_mesh := BoxMesh.new()
                fringe_mesh.size = Vector3(225.0*SCALE,.018,195.0*SCALE)
                retreat_ring_tiles.append(_part(fringe_mesh,fringe,Vector3(float(rx)*225.0*SCALE,-.29,float(rz)*195.0*SCALE)))
        # V131 uses the outer ring only for withdrawal. The red perimeter marks
        # the playable 3x3 square; missing outer cells are not simulated land.
        var red := StandardMaterial3D.new()
        red.albedo_color = Color("d84343")
        red.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
        var width: float = BattleSurface.half_x(data)*2.0*SCALE
        var depth: float = BattleSurface.half_z(data)*2.0*SCALE
        for side in range(4):
            var line := BoxMesh.new()
            line.size = Vector3(width,.08,.16) if side<2 else Vector3(.16,.08,depth)
            var x: float = 0.0 if side<2 else (width*.5 if side==2 else -width*.5)
            var z: float = (depth*.5 if side==0 else -depth*.5) if side<2 else 0.0
            overview_lines.append(_part(line,red,Vector3(x,-.11,z)))
    var sculpt := SurfaceTool.new()
    sculpt.begin(Mesh.PRIMITIVE_TRIANGLES)
    var regions: int = 3 if large else 1
    var nx: int = 12 if large else 16
    var nz: int = 10 if large else 12
    for region_z in range(regions):
        for region_x in range(regions):
            var tile_left: float = (float(region_x)-1.5)*225.0 if large else -32.0
            var tile_top: float = (float(region_z)-1.5)*195.0 if large else -25.0
            var width_tile: float = 225.0 if large else 64.0
            var depth_tile: float = 195.0 if large else 50.0
            for z in range(nz):
                for x in range(nx):
                    var x0: float = tile_left+float(x)*width_tile/float(nx)
                    var x1: float = tile_left+float(x+1)*width_tile/float(nx)
                    var z0: float = tile_top+float(z)*depth_tile/float(nz)
                    var z1: float = tile_top+float(z+1)*depth_tile/float(nz)
                    for t in [Vector2(x0,z0),Vector2(x1,z0),Vector2(x1,z1),Vector2(x0,z0),Vector2(x1,z1),Vector2(x0,z1)]:
                        var actual_height: float = BattleSurface.absolute_height(data,t.x,t.y)
                        var color: Color = Color("789d66") if actual_height>=BattleSurface.SEA else Color("c9baa0")
                        if actual_height>1.5:
                            color = Color("8b8582")
                        sculpt.set_color(color)
                        sculpt.add_vertex(Vector3(t.x*SCALE,BattleSurface.height(data,t.x,t.y)*SCALE-.18,t.y*SCALE))
    sculpt.generate_normals()
    relief_mesh = MeshInstance3D.new()
    relief_mesh.name = "V131Full3x3HeightTiles" if large else "V131TileHeight9x9BattleRelief"
    relief_mesh.mesh = sculpt.commit()
    var surface_mat := StandardMaterial3D.new()
    surface_mat.vertex_color_use_as_albedo = true
    surface_mat.cull_mode = BaseMaterial3D.CULL_DISABLED
    surface_mat.roughness = 1.0
    relief_mesh.material_override = surface_mat
    arena.add_child(relief_mesh)
    var river_material := StandardMaterial3D.new()
    river_material.albedo_color = Color("519ab7")
    river_material.roughness = .5
    for segment in data.get("rivers",[]):
        var a := Vector2(float(segment["ax"]),float(segment["az"]))
        var b := Vector2(float(segment["bx"]),float(segment["bz"]))
        var center: Vector2 = (a+b)*.5
        var segment_length: float = a.distance_to(b)
        if segment_length<.01:
            continue
        var bank := BoxMesh.new()
        bank.size = Vector3(segment_length*SCALE,.018,maxf(.35,float(segment["width"])*SCALE))
        var water: MeshInstance3D = _part(bank,river_material,Vector3(center.x*SCALE,BattleSurface.height(data,center.x,center.y)*SCALE-.135,center.y*SCALE))
        water.rotation.y = -atan2(b.y-a.y,b.x-a.x)
        water.reparent(river_graphics)
    var crossings: Array = data.get("bridges",[]) if large else [data.get("bridge",{})]
    for bridge in crossings:
        if not bool(bridge.get("open",false)):
            continue
        var crossing := BoxMesh.new()
        crossing.size = Vector3(maxf(1.6,float(bridge.get("radius",3.0))*SCALE*1.4),.16,1.8)
        var wood := StandardMaterial3D.new()
        wood.albedo_color = Color("ae8954")
        var bx: float = float(bridge.get("x",0.0))
        var bz: float = float(bridge.get("z",0.0))
        var deck: MeshInstance3D = _part(crossing,wood,Vector3(bx*SCALE,BattleSurface.height(data,bx,bz)*SCALE-.055,bz*SCALE))
        deck.reparent(river_graphics)

func set_model_template(source: Node3D) -> void:
    if source == null:
        return
    model_template = source
    MeshAdapter.dispose(model_batches)
    model_batches = []
    model_active = false
    # Build at refresh when participant count is known; no copy of skeletons.

func set_prefer_original(enabled: bool) -> void:
    prefer_original = enabled
    _sync_mode()

func _sync_mode() -> void:
    model_active = prefer_original and model_template != null and not model_batches.is_empty()
    if soldier_nodes != null:
        soldier_nodes.visible = not model_active
    for node in model_batches:
        if is_instance_valid(node):
            node.visible = model_active
    if team_markers != null:
        team_markers.visible = model_active

func _ensure_model_capacity(count: int) -> void:
    if model_template == null or not prefer_original:
        _sync_mode()
        return
    if model_batches.is_empty() or (model_batches[0] as MultiMeshInstance3D).multimesh.instance_count != count:
        MeshAdapter.dispose(model_batches)
        model_batches = MeshAdapter.compile_batches(model_template,count,self)
        model_factor = .75 / MeshAdapter.visual_span(model_template)
    for node in model_batches:
        if is_instance_valid(node):
            (node as MultiMeshInstance3D).multimesh.visible_instance_count = count
    _sync_mode()

func refresh(state: Dictionary) -> void:
    if batch == null:
        return
    var battle: Dictionary = state.get("individual_battle", {})
    if battle.is_empty():
        visible = false
        _refresh_surface({})
        batch.instance_count = 0
        last_count = 0
        marker_mesh.instance_count = 0
        arrow_mesh.instance_count = 0
        scenery_mesh.instance_count = 0
        wall_mesh.instance_count = 0
        ladder_mesh.instance_count = 0
        for node in model_batches:
            if is_instance_valid(node):
                (node as MultiMeshInstance3D).multimesh.visible_instance_count = 0
        return
    visible = true
    var surface: Dictionary = battle.get("surface",{})
    _refresh_surface(surface)
    var scenery: Array = battle.get("obstacles",[])
    scenery_mesh.instance_count = scenery.size()
    scenery_count = scenery.size()
    for i in range(scenery.size()):
        var obstacle: Dictionary = scenery[i]
        var rad: float = float(obstacle["radius"])*SCALE
        var pos := Vector3(float(obstacle["x"])*SCALE,rad*.6-.12+BattleSurface.height(surface,float(obstacle["x"]),float(obstacle["z"]))*SCALE,float(obstacle["z"])*SCALE)
        scenery_mesh.set_instance_transform(i,Transform3D(Basis.IDENTITY.scaled(Vector3(rad*2.0,rad*1.7,rad*2.0)),pos))
        scenery_mesh.set_instance_color(i,Color("777c70") if String(obstacle.get("kind","")) == "rock" else Color("5e8c62"))
    var siege: Dictionary = battle.get("siege", {})
    var wall_parts: Array = siege.get("sections",[])
    wall_mesh.instance_count = wall_parts.size()
    last_wall_count = wall_parts.size()
    for i in range(wall_parts.size()):
        var part: Dictionary = wall_parts[i]
        var h: float = float(part["height"])*SCALE
        var east: bool = int(part["axis"]) == 1
        var tower: bool = bool(part.get("tower",false))
        var gate: bool = String(part["type"]) == "gatehouse"
        var xwidth: float = 2.7 if tower else (2.0 if east else 3.85)
        var zdepth: float = 2.7 if tower else (3.85 if east else 2.0)
        var destroyed: bool = float(part["hp"]) <= .01 or bool(part.get("breached",false))
        var height: float = h * (.16 if destroyed else 1.0)
        var location := Vector3(float(part["x"])*SCALE,height*.5-.16,float(part["z"])*SCALE)
        wall_mesh.set_instance_transform(i,Transform3D(Basis.IDENTITY.scaled(Vector3(xwidth*SCALE,height,zdepth*SCALE)),location))
        var damage: float = clampf(1.0-float(part["hp"])/maxf(.1,float(part["max_hp"])),0.0,1.0)
        var base: Color = Color("b79765") if gate else (Color("777978") if tower else Color("99918a"))
        wall_mesh.set_instance_color(i,base.darkened(damage*.65))
    var ladders: Array = siege.get("works",[])
    ladder_mesh.instance_count = ladders.size()
    for i in range(ladders.size()):
        var work: Dictionary = ladders[i]
        var kind: String = String(work.get("kind",""))
        ladder_mesh.set_instance_color(i,Color("b99a65") if kind == "ladder" else (Color("80623d") if kind == "ram" else (Color("906f49") if kind == "tower" else Color("65604d"))))
        if kind in ["ram","tower"]:
            if bool(work.get("destroyed",false)):
                ladder_mesh.set_instance_transform(i,Transform3D(Basis.IDENTITY.scaled(Vector3.ZERO),Vector3.ZERO))
                continue
            var h_gear: float = 6.2 if kind == "tower" else 1.4
            var complete: float = 1.0 if bool(work.get("ready",false)) else clampf(float(work.get("progress",0.0))/maxf(.01,float(work.get("duration",1.0))),.1,1.0)
            var geo: Vector3 = Vector3(3.9,h_gear*complete,3.5 if kind == "tower" else 2.8)*SCALE
            ladder_mesh.set_instance_transform(i,Transform3D(Basis.IDENTITY.scaled(Vector3(geo.x/.23,geo.y,geo.z/.18)),Vector3(float(work["x"])*SCALE,geo.y*.5-.14,float(work["z"])*SCALE)))
            continue
        if kind == "camp":
            var completion: float = 1.0 if bool(work.get("ready",false)) else clampf(float(work.get("progress",0.0))/maxf(.01,float(work.get("duration",60.0))),.1,1.0)
            ladder_mesh.set_instance_transform(i,Transform3D(Basis.IDENTITY.scaled(Vector3(3.0,.7*completion,3.0)),Vector3(float(work["x"])*SCALE,-.05,float(work["z"])*SCALE)))
            continue
        var wall: Dictionary = {}
        for section in wall_parts:
            if int(section["index"]) == int(work["wall_index"]):
                wall = section
                break
        if wall.is_empty() or bool(work.get("destroyed",false)):
            ladder_mesh.set_instance_transform(i,Transform3D(Basis.IDENTITY.scaled(Vector3.ZERO),Vector3.ZERO))
            continue
        var h: float = float(wall["height"])*SCALE
        var stage: float = 1.0 if bool(work.get("ready",false)) else clampf(float(work["progress"])/maxf(.01,float(work["duration"])),.05,1.0)
        var t: Transform3D = Transform3D(Basis(Vector3.FORWARD,-.25).scaled(Vector3(1.0,h*stage,1.0)),Vector3((float(wall["x"])-1.05)*SCALE,h*.5*stage-.12,float(wall["z"])*SCALE))
        ladder_mesh.set_instance_transform(i,t)
    var participants: Array = []
    for squad in battle.get("squads",[]):
        if bool(squad.get("reserve",false)):
            continue
        for soldier in squad["men"]:
            if float(soldier["hp"]) > 0.0 and not bool(soldier.get("escaped",false)):
                participants.append({"man":soldier,"team":squad["team"],"formation":squad["formation"]})
    batch.instance_count = participants.size()
    marker_mesh.instance_count = participants.size()
    last_count = participants.size()
    _ensure_model_capacity(participants.size())
    position = Vector3(float(battle["world_c"])+.5,8.0,float(battle["world_r"])+.5)
    for i in range(participants.size()):
        var record: Dictionary = participants[i]
        var man: Dictionary = record["man"]
        var y_terrain: float = BattleSurface.height(surface,float(man["x"]),float(man["z"]))
        var y_extra: float = float(man.get("elevation",0.0)) if bool(man.get("on_wall",false)) else 0.0
        var world: Vector3 = Vector3(float(man["x"])*SCALE, .15+(y_terrain+y_extra)*SCALE, float(man["z"])*SCALE)
        var body_scale: float = .43 if bool(surface.get("large_field",false)) else 1.0
        batch.set_instance_transform(i,Transform3D(Basis.IDENTITY.scaled(Vector3.ONE*body_scale),world))
        marker_mesh.set_instance_transform(i,Transform3D(Basis.IDENTITY.scaled(Vector3.ONE*body_scale),Vector3(world.x,world.y-.28*body_scale,world.z)))
        if model_active:
            MeshAdapter.place(model_batches,i,Vector3(world.x,world.y-.20,world.z),model_factor*body_scale)
        var team: int = posmod(int(record["team"]),4)
        var brightness: float = clampf(float(man["hp"]) / maxf(.001,float(man["max_hp"])),0.25,1.0)
        var tint: Color = COLORS[team].darkened((1.0-brightness)*.6)
        batch.set_instance_color(i,tint)
        marker_mesh.set_instance_color(i,tint)
    var projectiles: Array = battle.get("projectiles",[])
    arrow_mesh.instance_count = projectiles.size()
    last_projectile_count = projectiles.size()
    for i in range(projectiles.size()):
        var p: Dictionary = projectiles[i]
        var duration: float = maxf(.001,float(p["land_at"])-float(p["start_at"]))
        var fraction: float = clampf((float(battle["elapsed"])-float(p["start_at"]))/duration,0.0,1.0)
        var px: float = lerpf(float(p["x"]),float(p["to_x"]),fraction)
        var pz: float = lerpf(float(p["z"]),float(p["to_z"]),fraction)
        var is_rock: bool = String(p.get("kind","arrow")) == "rock"
        var size: float = 4.0 if is_rock else 1.0
        arrow_mesh.set_instance_transform(i,Transform3D(Basis.IDENTITY.scaled(Vector3(size,size,size)),Vector3(px*SCALE,.35+BattleSurface.height(surface,px,pz)*SCALE+sin(fraction*PI)*(.85 if is_rock else .28),pz*SCALE)))
