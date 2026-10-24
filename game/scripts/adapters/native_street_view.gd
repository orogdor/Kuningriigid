extends Node3D
## Debug visualization: local AStarGrid2D shipment paths as native strip mesh.
## Shows only routes of currently visible shipments, no baked JS meshes.
var route_mesh: MeshInstance3D

func _ready() -> void:
    route_mesh = MeshInstance3D.new()
    route_mesh.name = "LocalCargoPaths"
    var mat := StandardMaterial3D.new()
    mat.vertex_color_use_as_albedo = true
    mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
    mat.cull_mode = BaseMaterial3D.CULL_DISABLED
    route_mesh.material_override = mat
    add_child(route_mesh)

func refresh(towns: Array, heights: PackedFloat32Array, selected: int = -1) -> void:
    if route_mesh == null:
        return
    var st := SurfaceTool.new()
    st.begin(Mesh.PRIMITIVE_TRIANGLES)
    var triangles: int = 0
    for i in range(towns.size()):
        if selected >= 0 and i != selected:
            continue
        for shipment in towns[i].get("cargo",[]):
            var points: Array = shipment.get("path_points",[])
            var start: Vector2 = Vector2(float(shipment.get("x",0.0)),float(shipment.get("z",0.0)))
            var step: int = int(shipment.get("waypoint",1))
            for j in range(step,points.size()):
                var coords: Array = points[j]
                var end: Vector2 = Vector2(float(coords[0]),float(coords[1]))
                if start.distance_to(end) > .002:
                    var direction: Vector2 = (end-start).normalized()
                    var normal := Vector2(-direction.y,direction.x)*.045
                    var y: float = .25
                    if heights.size() == 220*165:
                        var ix: int = clampi(int(end.x),0,219)
                        var iz: int = clampi(int(end.y),0,164)
                        y += heights[iz*220+ix] * .52
                    var color := Color("f8da70")
                    _triangle(st,Vector3(start.x+normal.x,y,start.y+normal.y),Vector3(start.x-normal.x,y,start.y-normal.y),Vector3(end.x+normal.x,y,end.y+normal.y),color)
                    _triangle(st,Vector3(end.x+normal.x,y,end.y+normal.y),Vector3(start.x-normal.x,y,start.y-normal.y),Vector3(end.x-normal.x,y,end.y-normal.y),color)
                    triangles += 2
                start = end
    route_mesh.mesh = st.commit() if triangles > 0 else null

func _triangle(st: SurfaceTool,a: Vector3,b: Vector3,c: Vector3,tint: Color) -> void:
    st.set_color(tint)
    st.add_vertex(a)
    st.set_color(tint)
    st.add_vertex(b)
    st.set_color(tint)
    st.add_vertex(c)
