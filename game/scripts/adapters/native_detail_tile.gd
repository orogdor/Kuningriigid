extends Node3D
## One physical 225 x 195 native Godot 3D tile, keyed to a 220 x 165
## world-map cell. V131 scale is exact; map, resource and house geometry
## remain deterministic proxies because the full JS terrain is not ported.
const Cargo = preload("res://scripts/core/cargo_port.gd")
const CountyLogistics = preload("res://scripts/core/county_logistics_port.gd")
const SharedLandscape = preload("res://scripts/core/shared_landscape_v131.gd")
var _landscape = null
const TILE_WIDTH: float = 225.0
const TILE_DEPTH: float = 195.0
const SITE_SCALE: float = 10.0 # proxy atlas units -> 225x195 detail world
const WORLD_COLS: int = 220
const WORLD_ROWS: int = 165
const CENTER := Vector3(360.0,0.0,350.0)
const SURFACE_STEP_X: int = 30
const SURFACE_STEP_Z: int = 26
const TEAM_COLORS: Array[Color] = [Color("5eacff"),Color("ed736a"),Color("80d39c"),Color("d5a8f5")]
var current_tile: Vector2i = Vector2i(-1,-1)
var town_index: int = -1
var owner_index: int = -1
var owner_name: String = ""
var town_name: String = ""
var building_sites: Array = []
var _heights: PackedFloat32Array = PackedFloat32Array()
var _has_town: bool = false
var _alive_nodes: Array = []
var _moving_layers: Dictionary = {}
var _moving_summary: Label3D
var shown_agent_count: int = 0
var shown_cargo_count: int = 0
var _crossing_info: Dictionary = {}

static func tile_valid(cell: Vector2i) -> bool:
    return cell.x >= 0 and cell.y >= 0 and cell.x < WORLD_COLS and cell.y < WORLD_ROWS

static func world_cell_at(world_position: Vector3) -> Vector2i:
    return Vector2i(floori(world_position.x),floori(world_position.z))

static func city_index_at(towns: Array,cell: Vector2i) -> int:
    for i in range(towns.size()):
        var city: Dictionary = towns[i]
        if int(city.get("c",-1)) == cell.x and int(city.get("r",-1)) == cell.y:
            return i
    return -1

# Projection is shared by 3D buildings, moving agents, and road waypoints.
# IMPORTANT: preview economic pathfinding still uses simplified atlas metres.
static func city_to_detail(town: Dictionary, atlas_point: Vector2) -> Vector2:
    var center := Vector2(float(town.get("c",0))+.5,float(town.get("r",0))+.5)
    return (atlas_point-center)*SITE_SCALE

static func detail_to_city(town: Dictionary, point: Vector2) -> Vector2:
    var center := Vector2(float(town.get("c",0))+.5,float(town.get("r",0))+.5)
    return point/SITE_SCALE+center

static func source_height(heights: PackedFloat32Array,c: int,r: int) -> float:
    return SharedLandscape.source_height(heights,c,r)

static func continuous_height(cell: Vector2i,local_x: float,local_z: float,heights: PackedFloat32Array) -> float:
    return SharedLandscape.height_at(heights,cell,Vector2(local_x,local_z))

func show_tile(cell: Vector2i,towns: Array,heights: PackedFloat32Array,navigator = null,crossings: Dictionary = {},landscape = null) -> void:
    if not tile_valid(cell):
        return
    current_tile = cell
    _crossing_info = crossings.get("%d:%d" % [cell.x,cell.y],{})
    _landscape = landscape
    _heights = heights
    town_index = city_index_at(towns,cell)
    _has_town = town_index >= 0
    owner_index = town_index
    if owner_index < 0:
        for index in range(towns.size()):
            var claimant: Dictionary = towns[index]
            for pos in claimant.get("territory_county",[]):
                if int(pos[0]) == cell.x and int(pos[1]) == cell.y:
                    owner_index = index
                    break
            if owner_index >= 0:
                break
    town_name = String(towns[town_index].get("name","Linn")) if _has_town else ""
    owner_name = String(towns[owner_index].get("name","")) if owner_index >= 0 else ""
    building_sites.clear()
    for previous in _alive_nodes:
        if is_instance_valid(previous):
            previous.queue_free()
    _alive_nodes.clear()
    _moving_layers.clear()
    _moving_summary = null
    _create_ground()
    _create_test_water_crossing()
    _create_shared_rivers()
    # Register building footprints before distributing trees and rocks.
    # Large towns must never have spruce trunks growing through roofs.
    if _has_town:
        _create_town(towns[town_index])
    if owner_index >= 0:
        _create_county_worksites(towns[owner_index])
    _create_resources()
    if _has_town:
        _create_city_roads(towns[town_index],navigator)
    if _has_town or owner_index >= 0:
        _create_moving_layers()
    if _has_town:
        refresh_movers(towns[town_index])
    elif owner_index >= 0:
        refresh_county_movers(towns[owner_index],[])
    visible = true

func tile_description() -> String:
    var tile_name: String = "%d, %d" % [current_tile.x,current_tile.y]
    var terrain: String = "maismaa" if source_height(_heights,current_tile.x,current_tile.y)>0.0 else "meri"
    if _has_town:
        return "%s • %s (%s) • %d hoonet" % [tile_name,town_name,terrain,building_sites.size()]
    if owner_index >= 0:
        return "%s • %s • %s maakond, %d töökohta" % [tile_name,terrain,owner_name,building_sites.size()]
    return "%s • %s • linn puudub" % [tile_name,terrain]

func _add_mesh(mesh: Mesh,material: Material,position: Vector3) -> MeshInstance3D:
    var node := MeshInstance3D.new()
    node.mesh = mesh
    node.material_override = material
    node.position = position
    add_child(node)
    _alive_nodes.append(node)
    return node

func _material(color: Color,transparent: bool = false) -> StandardMaterial3D:
    var mat := StandardMaterial3D.new()
    mat.albedo_color = color
    mat.roughness = .96
    mat.cull_mode = BaseMaterial3D.CULL_DISABLED
    if transparent:
        mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
    return mat

func _point_height(x: float,z: float) -> float:
    # EXACT same height interpolation as A*; river depression is cosmetic only.
    if _landscape != null:
        return _landscape.detail_height(current_tile,Vector2(x,z))
    return continuous_height(current_tile,x,z,_heights)

func _create_ground() -> void:
    var terrain := SurfaceTool.new()
    terrain.begin(Mesh.PRIMITIVE_TRIANGLES)
    var water := SurfaceTool.new()
    water.begin(Mesh.PRIMITIVE_TRIANGLES)
    var water_triangles: int = 0
    for row in range(SURFACE_STEP_Z):
        for col in range(SURFACE_STEP_X):
            var x0: float = -TILE_WIDTH*.5+TILE_WIDTH*float(col)/float(SURFACE_STEP_X)
            var x1: float = -TILE_WIDTH*.5+TILE_WIDTH*float(col+1)/float(SURFACE_STEP_X)
            var z0: float = -TILE_DEPTH*.5+TILE_DEPTH*float(row)/float(SURFACE_STEP_Z)
            var z1: float = -TILE_DEPTH*.5+TILE_DEPTH*float(row+1)/float(SURFACE_STEP_Z)
            var aa := Vector3(x0,_point_height(x0,z0),z0)
            var bb := Vector3(x1,_point_height(x1,z0),z0)
            var cc := Vector3(x1,_point_height(x1,z1),z1)
            var dd := Vector3(x0,_point_height(x0,z1),z1)
            var avg: float = (aa.y+bb.y+cc.y+dd.y)*.25
            var color: Color = Color("44788e")
            if avg > 2.2:
                color = Color("92928a")
            elif avg > .4:
                color = Color("397958")
            elif avg > -.09:
                color = Color("bbaf86")
            _surface_triangle(terrain,aa,cc,bb,color)
            _surface_triangle(terrain,aa,dd,cc,color)
            if aa.y < .06 or bb.y < .06 or cc.y < .06 or dd.y < .06:
                water_triangles += 2
                var y: float = .065
                _surface_triangle(water,Vector3(x0,y,z0),Vector3(x1,y,z1),Vector3(x1,y,z0),Color("4a9db5",.67))
                _surface_triangle(water,Vector3(x0,y,z0),Vector3(x0,y,z1),Vector3(x1,y,z1),Color("4a9db5",.67))
    var mat := _material(Color.WHITE)
    mat.vertex_color_use_as_albedo = true
    var ground_mesh := terrain.commit()
    _add_mesh(ground_mesh,mat,CENTER)
    if water_triangles > 0:
        var water_mesh := water.commit()
        var water_mat := _material(Color.WHITE,true)
        water_mat.vertex_color_use_as_albedo = true
        water_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
        _add_mesh(water_mesh,water_mat,CENTER)

func _create_test_water_crossing() -> void:
    # A visibly distinct test waterway. The complete source V131 river atlas
    # is not ported; this matches optional bridge masks in DetailNavigation.
    if not _crossing_info.has("axis"):
        return
    var axis: String = String(_crossing_info.get("axis","x"))
    var width: float = float(_crossing_info.get("width",5.0))*2.0
    var ribbon := BoxMesh.new()
    ribbon.size = Vector3(width,.12,DEPTH) if axis == "x" else Vector3(TILE_WIDTH,.12,width)
    var river_position := Vector3(float(_crossing_info.get("coord",0.0)) if axis == "x" else 0.0,.20,float(_crossing_info.get("coord",0.0)) if axis != "x" else 0.0)
    _add_mesh(ribbon,_material(Color("3889b6",.88),true),CENTER+river_position)
    if bool(_crossing_info.get("bridge",false)):
        var bridge := BoxMesh.new()
        var span: float = width+8.0
        var length: float = float(_crossing_info.get("bridge_width",4.0))*2.0
        bridge.size = Vector3(span,.55,length) if axis == "x" else Vector3(length,.55,span)
        var bridge_point := Vector3(float(_crossing_info.get("coord",0.0)) if axis == "x" else float(_crossing_info.get("bridge_at",0.0)),.65,float(_crossing_info.get("bridge_at",0.0)) if axis == "x" else float(_crossing_info.get("coord",0.0)))
        _add_mesh(bridge,_material(Color("bc9a65")),CENTER+bridge_point)

func _create_shared_rivers() -> void:
    if _landscape == null:
        return
    var parts: Array = _landscape.segments_for(current_tile)
    if parts.is_empty():
        return
    var surface := SurfaceTool.new()
    surface.begin(Mesh.PRIMITIVE_TRIANGLES)
    for part in parts:
        var a: Vector2 = part["a"]
        var b: Vector2 = part["b"]
        var normal: Vector2 = (b-a).normalized().orthogonal()*float(part["width"])*.5
        var p0: Vector2 = a-normal
        var p1: Vector2 = a+normal
        var p2: Vector2 = b+normal
        var p3: Vector2 = b-normal
        var y0: float = _point_height(a.x,a.y)+.14
        var y1: float = _point_height(b.x,b.y)+.14
        _surface_triangle(surface,Vector3(p0.x,y0,p0.y),Vector3(p1.x,y0,p1.y),Vector3(p2.x,y1,p2.y),Color("3b9cb9"))
        _surface_triangle(surface,Vector3(p0.x,y0,p0.y),Vector3(p2.x,y1,p2.y),Vector3(p3.x,y1,p3.y),Color("3b9cb9"))
    var river_mesh: ArrayMesh = surface.commit()
    if river_mesh != null:
        _add_mesh(river_mesh,_material(Color("398cb3")),CENTER)
    var bridge: Dictionary = _landscape.bridge_sites.get("%d:%d" % [current_tile.x,current_tile.y],{})
    if bool(bridge.get("open",false)):
        var local := Vector2(float(bridge.get("x",0.0)),float(bridge.get("z",0.0)))
        var deck := BoxMesh.new()
        deck.size = Vector3(16.0,.5,9.0)
        var bridge_node: MeshInstance3D = _add_mesh(deck,_material(Color("ab906a")),CENTER+Vector3(local.x,_point_height(local.x,local.y)+.55,local.y))
        var river_axis: Vector2 = (parts[0]["b"]-parts[0]["a"]).normalized()
        var cross_axis: Vector2 = river_axis.orthogonal()
        bridge_node.rotation.y = atan2(-cross_axis.y,cross_axis.x)

func _surface_triangle(st: SurfaceTool,a: Vector3,b: Vector3,c: Vector3,color: Color) -> void:
    for point in [a,b,c]:
        st.set_normal(Vector3.UP)
        st.set_color(color)
        st.add_vertex(point)

func _rand_value(n: int,offset: float) -> float:
    var val: float = sin(float(n)*37.713+float(current_tile.x)*113.71+float(current_tile.y)*271.91+offset)*43758.5453
    return val-floorf(val)

func _create_resources() -> void:
    var trunk := CylinderMesh.new()
    trunk.top_radius = .38
    trunk.bottom_radius = .52
    trunk.height = 3.0
    trunk.material = _material(Color("77593a"))
    var canopy := SphereMesh.new()
    canopy.radius = 2.0
    canopy.height = 4.1
    canopy.material = _material(Color("357047"))
    var stone := SphereMesh.new()
    stone.radius = 1.5
    stone.height = 1.7
    stone.material = _material(Color("858883"))
    var trunks: Array = []
    var crowns: Array = []
    var stones: Array = []
    for i in range(190):
        var x: float = (_rand_value(i,3.0)-.5)*(TILE_WIDTH-10.0)
        var z: float = (_rand_value(i,7.0)-.5)*(TILE_DEPTH-10.0)
        if _has_town and Vector2(x,z).length()<35.0:
            continue
        var on_a_building: bool = false
        for lot in building_sites:
            if Vector2(x,z).distance_to(Vector2(float(lot["x"]),float(lot["z"]))) < float(lot["radius"])+3.0:
                on_a_building = true
                break
        if on_a_building:
            continue
        var h: float = _point_height(x,z)
        if h < .16 or (_landscape != null and not _landscape.walkable_at(current_tile,Vector2(x,z))):
            continue
        if h>2.4 or _rand_value(i,15.0)<.20:
            stones.append(Transform3D(Basis().scaled(Vector3(1.0+_rand_value(i,19.0),1.0,1.0)),CENTER+Vector3(x,h+.55,z)))
        elif _rand_value(i,11.0)<.76:
            trunks.append(Transform3D(Basis(),CENTER+Vector3(x,h+1.45,z)))
            crowns.append(Transform3D(Basis(),CENTER+Vector3(x,h+4.1,z)))
    _add_multi(trunk,trunks,"Puud_2")
    _add_multi(canopy,crowns,"Puuvõrad_2")
    _add_multi(stone,stones,"Kivid_2")

func _add_multi(shape: Mesh,transforms: Array,name: String) -> void:
    if transforms.is_empty():
        return
    var mm := MultiMesh.new()
    mm.transform_format = MultiMesh.TRANSFORM_3D
    mm.mesh = shape
    mm.instance_count = transforms.size()
    mm.custom_aabb = AABB(CENTER-Vector3(120,10,105),Vector3(240,25,210))
    var node := MultiMeshInstance3D.new()
    node.name = name
    node.multimesh = mm
    add_child(node)
    _alive_nodes.append(node)
    for i in range(transforms.size()):
        mm.set_instance_transform(i,transforms[i])

func _create_town(town: Dictionary) -> void:
    # Batches all walls and roofs by type/status. A 150-house performance city
    # has tens of native draw batches, NOT 300+ per-building MeshInstance3Ds.
    var buildings: Array = town.get("buildings",[])
    var groups: Dictionary = {}
    var banner_team: Color = TEAM_COLORS[int(town.get("team",0))%4].darkened(.35)
    for i in range(buildings.size()):
        var building: Dictionary = buildings[i]
        var kind: String = String(building.get("type","house"))
        var point: Vector2 = city_to_detail(town,Cargo.building_position(town,i))
        var x: float = point.x
        var z: float = point.y
        # Buildings outside the current map never get drawn in the wrong tile.
        if absf(x) > TILE_WIDTH*.5 or absf(z) > TILE_DEPTH*.5:
            continue
        var y: float = _point_height(x,z)
        var size: Vector3 = _building_size(kind)
        var ready: bool = bool(building.get("ready",false))
        var key: String = kind + (":ready" if ready else ":construction")
        if not groups.has(key):
            groups[key] = {"kind":kind,"ready":ready,"wall":[],"roof":[]}
        var body: Transform3D = Transform3D(Basis().scaled(size),CENTER+Vector3(x,y+size.y*.5,z))
        var roof_size: Vector3 = Vector3(size.x*1.16,.62,size.z*1.15)
        var roof: Transform3D = Transform3D(Basis(Vector3.UP,float(i)*.45).scaled(roof_size),CENTER+Vector3(x,y+size.y+.20,z))
        groups[key]["wall"].append(body)
        groups[key]["roof"].append(roof)
        building_sites.append({"type":kind,"x":x,"z":z,"ready":ready,"radius":maxf(4.0,size.x*.7),"name":kind})
    for group in groups.values():
        var body_mesh := BoxMesh.new()
        body_mesh.size = Vector3.ONE
        var wall_color: Color = _building_color(String(group["kind"])) if bool(group["ready"]) else Color("817d76")
        body_mesh.material = _material(wall_color)
        _add_multi(body_mesh,group["wall"],"Buildings_"+String(group["kind"]))
        var roof_mesh := PrismMesh.new()
        roof_mesh.size = Vector3.ONE
        roof_mesh.material = _material(banner_team)
        _add_multi(roof_mesh,group["roof"],"Roofs_"+String(group["kind"]))
    var banner := Label3D.new()
    banner.text = "%s | %d elanikku | %d hoonet" % [town_name,int(town.get("pop",3)),buildings.size()]
    banner.font_size = 36
    banner.pixel_size = .055
    banner.billboard = BaseMaterial3D.BILLBOARD_ENABLED
    banner.position = CENTER+Vector3(0.0,8.0,0.0)
    add_child(banner)
    _alive_nodes.append(banner)

# Lines are generated by the SAME AStarGrid paths used by workers and haulers.
# They're visible transport corridors for the benchmark, NOT yet V131 wear-based roads.
func _create_county_worksites(town: Dictionary) -> void:
    var hits: Array = []
    for site in town.get("county_worksites",[]):
        if int(site.get("c",-1)) == current_tile.x and int(site.get("r",-1)) == current_tile.y:
            hits.append(site)
    for i in range(hits.size()):
        var site: Dictionary = hits[i]
        var x: float = float(i%3-1)*13.0
        var z: float = float(i/3)*14.0-6.0
        var h: float = _point_height(x,z)
        var ready: bool = bool(site.get("ready",false))
        var type_name: String = String(site.get("type","lumber"))
        var shape := BoxMesh.new()
        shape.size = _building_size(type_name)*.92
        var mesh_node := MeshInstance3D.new()
        mesh_node.name = "County_"+type_name
        mesh_node.mesh = shape
        mesh_node.position = CENTER+Vector3(x,h+shape.size.y*.5,z)
        mesh_node.material_override = _material(_building_color(type_name) if ready else Color("91887b"))
        add_child(mesh_node)
        _alive_nodes.append(mesh_node)
        building_sites.append({"type":type_name,"x":x,"z":z,"ready":ready,"radius":6.0,"name":type_name})

func _create_city_roads(town: Dictionary,navigator) -> void:
    if navigator == null:
        return
    var buildings: Array = town.get("buildings",[])
    if buildings.size() < 2:
        return
    var mesh_builder := SurfaceTool.new()
    mesh_builder.begin(Mesh.PRIMITIVE_TRIANGLES)
    var segments: int = 0
    var drawn_edges: Dictionary = {}
    for index in range(1,buildings.size()):
        var route: Array = navigator.route(town,0,index)
        for i in range(1,route.size()):
            var prev_pair: Array = route[i-1]
            var next_pair: Array = route[i]
            if prev_pair.size() < 2 or next_pair.size() < 2:
                continue
            var a: Vector2 = city_to_detail(town,Vector2(float(prev_pair[0]),float(prev_pair[1])))
            var b: Vector2 = city_to_detail(town,Vector2(float(next_pair[0]),float(next_pair[1])))
            var direction: Vector2 = b-a
            if direction.length_squared() < .04:
                continue
            # One lane per actual grid edge; overlap formerly made nearby
            # streets flicker and overdraw each other in 80+ building cities.
            var first: String = "%.2f:%.2f" % [a.x,a.y]
            var second: String = "%.2f:%.2f" % [b.x,b.y]
            var edge_id: String = first+">"+second if first < second else second+">"+first
            if drawn_edges.has(edge_id):
                continue
            drawn_edges[edge_id] = true
            var normal: Vector2 = Vector2(-direction.y,direction.x).normalized()*.72
            var aa := Vector3(a.x-normal.x,_point_height(a.x-normal.x,a.y-normal.y)+.075,a.y-normal.y)
            var ab := Vector3(a.x+normal.x,_point_height(a.x+normal.x,a.y+normal.y)+.075,a.y+normal.y)
            var ba := Vector3(b.x-normal.x,_point_height(b.x-normal.x,b.y-normal.y)+.075,b.y-normal.y)
            var bb := Vector3(b.x+normal.x,_point_height(b.x+normal.x,b.y+normal.y)+.075,b.y+normal.y)
            var color := Color("a98b61")
            _surface_triangle(mesh_builder,aa,ba,bb,color)
            _surface_triangle(mesh_builder,aa,bb,ab,color)
            segments += 1
    if segments > 0:
        var road_mat := _material(Color.WHITE)
        road_mat.vertex_color_use_as_albedo = true
        _add_mesh(mesh_builder.commit(),road_mat,CENTER)

func _create_moving_layers() -> void:
    for category in ["builder","worker","market_woman","demo_crowd","cargo","supply"]:
        var shape: PrimitiveMesh
        if category == "cargo" or category == "supply":
            var box := BoxMesh.new()
            box.size = Vector3(1.3,1.2,1.3)
            shape = box
        else:
            var capsule := CapsuleMesh.new()
            capsule.radius = .54
            capsule.height = 2.55
            shape = capsule
        var shade := Color("ebba59") if category == "builder" else (Color("dc80a6") if category == "market_woman" else (Color("6ec3e5") if category == "worker" else (Color("a38df0") if category == "demo_crowd" else (Color("57a7d8") if category == "supply" else Color("c89a64")))))
        shape.material = _material(shade)
        var multimesh := MultiMesh.new()
        multimesh.transform_format = MultiMesh.TRANSFORM_3D
        multimesh.mesh = shape
        multimesh.custom_aabb = AABB(CENTER-Vector3(122,8,108),Vector3(244,32,216))
        multimesh.instance_count = 0
        var layer := MultiMeshInstance3D.new()
        layer.name = "Moving_" + category
        layer.multimesh = multimesh
        add_child(layer)
        _alive_nodes.append(layer)
        _moving_layers[category] = layer
    _moving_summary = Label3D.new()
    _moving_summary.font_size = 30
    _moving_summary.pixel_size = .06
    _moving_summary.billboard = BaseMaterial3D.BILLBOARD_ENABLED
    _moving_summary.position = CENTER+Vector3(0,12,9)
    add_child(_moving_summary)
    _alive_nodes.append(_moving_summary)

func refresh_movers(town: Dictionary,shipments: Array = [],roads: Dictionary = {},now: float = 0.0) -> void:
    if _moving_layers.is_empty():
        return
    var positions: Dictionary = {"builder":[],"worker":[],"market_woman":[],"demo_crowd":[],"cargo":[],"supply":[]}
    for agent in town.get("citizens",{}).values():
        var kind: String = String(agent.get("kind","worker"))
        if not positions.has(kind):
            continue
        if String(agent.get("status","")) in ["Kodus","Tee puudub"]:
            continue
        var local: Vector2 = city_to_detail(town,Vector2(float(agent.get("x",0.0)),float(agent.get("z",0.0))))
        if absf(local.x)>TILE_WIDTH*.5 or absf(local.y)>TILE_DEPTH*.5:
            continue
        positions[kind].append(Transform3D(Basis(),CENTER+Vector3(local.x,_point_height(local.x,local.y)+1.3,local.y)))
    for shipment in town.get("cargo",[]):
        var local: Vector2 = city_to_detail(town,Vector2(float(shipment.get("x",0.0)),float(shipment.get("z",0.0))))
        if absf(local.x)>TILE_WIDTH*.5 or absf(local.y)>TILE_DEPTH*.5:
            continue
        positions["cargo"].append(Transform3D(Basis(),CENTER+Vector3(local.x,_point_height(local.x,local.y)+.6,local.y)))
    _append_county_positions(positions,town,shipments,roads,now)
    shown_agent_count = positions["builder"].size()+positions["worker"].size()+positions["market_woman"].size()+positions["demo_crowd"].size()
    shown_cargo_count = positions["cargo"].size()+positions["supply"].size()
    for category in positions.keys():
        var layer: MultiMeshInstance3D = _moving_layers[category]
        var mm: MultiMesh = layer.multimesh
        var transforms: Array = positions[category]
        mm.instance_count = transforms.size()
        for i in range(transforms.size()):
            mm.set_instance_transform(i,transforms[i])
    if is_instance_valid(_moving_summary):
        _moving_summary.text = "Liikuvad elanikud %d | veosed %d" % [shown_agent_count,shown_cargo_count]

func _append_county_positions(positions: Dictionary,town: Dictionary,shipments: Array,roads: Dictionary,now: float) -> void:
    # Render an agent whenever its *interpolated* atlas position lies within
    # this detail tile, even if its integer cell address is still next door.
    for site in town.get("county_worksites",[]):
        var worker: Dictionary = site.get("worker",{})
        if worker.is_empty() or bool(site.get("suspended",false)) or float(site.get("assigned",0.0)) <= 0.0:
            continue
        var pos: Vector2 = CountyLogistics.world_position(worker,roads,now,true)
        var local: Vector2 = Vector2((pos.x-float(current_tile.x)-.5)*TILE_WIDTH,(pos.y-float(current_tile.y)-.5)*TILE_DEPTH)
        if absf(local.x) <= TILE_WIDTH*.5 and absf(local.y) <= TILE_DEPTH*.5:
            positions["worker"].append(Transform3D(Basis(),CENTER+Vector3(local.x,_point_height(local.x,local.y)+1.3,local.y)))
    for shipment in shipments:
        if int(shipment.get("city_id",-1)) != int(town.get("id",-1)):
            continue
        var pos: Vector2 = CountyLogistics.world_position(shipment,roads,now,false)
        var local: Vector2 = Vector2((pos.x-float(current_tile.x)-.5)*TILE_WIDTH,(pos.y-float(current_tile.y)-.5)*TILE_DEPTH)
        if absf(local.x) <= TILE_WIDTH*.5 and absf(local.y) <= TILE_DEPTH*.5:
            var category: String = "supply" if String(shipment.get("direction","return")) == "supply" else "cargo"
            positions[category].append(Transform3D(Basis(),CENTER+Vector3(local.x,_point_height(local.x,local.y)+.6,local.y)))

func refresh_county_movers(town: Dictionary,shipments: Array,roads: Dictionary = {},now: float = 0.0) -> void:
    if _moving_layers.is_empty():
        return
    var positions: Dictionary = {"worker":[],"cargo":[],"supply":[]}
    _append_county_positions(positions,town,shipments,roads,now)
    for kind in positions.keys():
        var multimesh: MultiMesh = (_moving_layers[kind] as MultiMeshInstance3D).multimesh
        var transforms: Array = positions[kind]
        multimesh.instance_count = transforms.size()
        for i in range(transforms.size()):
            multimesh.set_instance_transform(i,transforms[i])
    shown_agent_count = positions["worker"].size()
    shown_cargo_count = positions["cargo"].size()+positions["supply"].size()
    if is_instance_valid(_moving_summary):
        _moving_summary.text = "Maakonnatöölised %d | veosed %d" % [shown_agent_count,shown_cargo_count]

func _building_size(kind: String) -> Vector3:
    match kind:
        "hall": return Vector3(12.0,7.0,10.0)
        "house": return Vector3(7.5,4.0,6.5)
        "well": return Vector3(4.2,3.0,4.2)
        "market": return Vector3(18.0,3.4,14.0)
        "farm": return Vector3(11.0,4.2,12.0)
        "quarry", "mine", "coal": return Vector3(11.0,3.7,10.0)
        "barracks", "saw", "mill": return Vector3(12.0,5.0,10.0)
        _: return Vector3(8.5,4.5,8.0)

func _building_color(kind: String) -> Color:
    match kind:
        "hall": return Color("d4bb8c")
        "house": return Color("cbb18a")
        "market": return Color("bda374")
        "quarry": return Color("999894")
        "well": return Color("5b94aa")
        "farm": return Color("b6a568")
        "saw", "lumber": return Color("93754c")
        _: return Color("ab987e")

func describe_point(hit: Vector3) -> String:
    var local: Vector2 = Vector2(hit.x-CENTER.x,hit.z-CENTER.z)
    if absf(local.x)>TILE_WIDTH*.5 or absf(local.y)>TILE_DEPTH*.5:
        return "Väljaspool ruutu"
    for site in building_sites:
        if local.distance_to(Vector2(float(site["x"]),float(site["z"]))) < float(site["radius"]):
            return "%s: %s" % [String(site["type"]),"valmis" if bool(site["ready"]) else "ehitamisel"]
    return "%s • %.0f m linnakeskusest" % [tile_description(),local.length()]
