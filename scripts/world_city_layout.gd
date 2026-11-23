extends RefCounted

const SIZES:={"hall":10.0,"house":7.0,"lumber":8.4,"quarry":9.0,"well":3.0,"farm":9.0,"barracks":9.2,"archery":9.2,"hunter":8.4,"fisher":9.2,"study":8.6,"pasture":9.0,"mason":8.0,"claypit":7.0,"pottery_kiln":6.0,"watchtower":4.0,"palisade":7.0,"woodgate":6.0,"stonewall":7.0,"stonetower":5.0,"cellar":5.0,"storage":7.0,"warehouse":8.0,"mill":7.0,"bakery":6.0,"coppermine":8.0,"tinmine":8.0,"bronze_foundry":7.0,"forester":7.0,"saw":7.0,"road_depot":7.0}
const MODELS:={"hall":"peamaja","house":"house","lumber":"lumber","forester":"lumber","saw":"lumber","quarry":"quarry","farm":"farm","well":"well","hunter":"hunter","fisher":"fisher","pasture":"pasture","mason":"mason","barracks":"barracks","archery":"archery","claypit":"claypit","pottery_kiln":"pottery_kiln","study":"study","watchtower":"watchtower","palisade":"palisade","woodgate":"woodgate","stonewall":"palisade","stonetower":"watchtower","cellar":"house","storage":"house","warehouse":"house","mill":"farm","bakery":"house","coppermine":"quarry","tinmine":"quarry","bronze_foundry":"pottery_kiln","road_depot":"lumber"}
const CORE:=["hall","house","well","study","cellar","storage","warehouse","market","bakery","mill","scriptorium","inn","granary"]
const SKIP:=["field","road","bridge"]
static var meshes: Dictionary={}

static func stamp(buildings: Array) -> String:
	var parts:=PackedStringArray()
	for b in buildings:
		if b.type in SKIP or float(b.get("hp",0))<=0 or b.get("virtual",false):continue
		parts.append("%s:%s:%s:%s:%s" % [b.type,b.get("ready",false),roundi(float(b.x)),roundi(float(b.z)),b.get("buildingRotationV228",b.get("wallAngleV175",0))])
	return "|".join(parts)

static func layout(buildings: Array) -> Dictionary:
	var extent:=0.0;var core:=0.0
	for b in buildings:
		if b.type in SKIP or float(b.get("hp",0))<=0 or b.get("virtual",false):continue
		var radius:=float(SIZES.get(b.type,6.0))/4.5*0.5
		var e:=maxf(absf(float(b.x)/4.5)+radius,absf(float(b.z)/3.9)+radius)
		extent=maxf(extent,e)
		if b.type in CORE:core=maxf(core,e)
	var basis:=core if core>0 else extent
	var factor:=clampf(24.5/basis,1,5) if basis>0 else 1.0
	var list: Array=[]
	for b in buildings:
		if b.type in SKIP or float(b.get("hp",0))<=0 or b.get("virtual",false):continue
		var size:=float(SIZES.get(b.type,6.0))/4.5*factor*1.4
		var limit:=maxf(0,24.5-size*0.5)
		var x:=float(b.x)/4.5*factor;var z:=float(b.z)/3.9*factor
		if absf(x)>limit or absf(z)>limit:
			var f:=minf(1,minf(limit/maxf(0.000001,absf(x)),limit/maxf(0.000001,absf(z))))
			x*=f;z*=f
		list.append({"building":b,"x":x,"z":z,"size":size})
	return {"scale":factor,"list":list}

static func clearances(buildings: Array,origin: Vector2) -> Array:
	var result: Array=[];var core_radius:=0.0
	for item in layout(buildings).list:
		var radius:=maxf(2.4,float(item.size)*0.9)
		result.append({"x":origin.x+float(item.x),"z":origin.y+float(item.z),"r":radius})
		if item.building.type in CORE:core_radius=maxf(core_radius,Vector2(float(item.x),float(item.z)).length()+radius)
	if core_radius>0:result.append({"x":origin.x,"z":origin.y,"r":core_radius})
	return result

static func get_mesh(name: String) -> Mesh:
	if meshes.has(name):return meshes[name]
	var path: String="res://assets/world/town_models/"+name+".glb"
	if not ResourceLoader.exists(path):return null
	var source: Node=load(path).instantiate();var found:=find_mesh(source)
	if found==null:source.free();return null
	var mesh: Mesh=found.mesh.duplicate()
	var material:=StandardMaterial3D.new();material.vertex_color_use_as_albedo=true;material.roughness=0.95;material.cull_mode=BaseMaterial3D.CULL_DISABLED
	for surface in mesh.get_surface_count():mesh.surface_set_material(surface,material)
	meshes[name]=mesh;source.free();return mesh

static func find_mesh(node: Node) -> MeshInstance3D:
	if node is MeshInstance3D:return node
	for child in node.get_children():
		var found:=find_mesh(child)
		if found!=null:return found
	return null

static func build(buildings: Array,origin: Vector3,height: Callable) -> Node3D:
	var root:=Node3D.new();root.name="TownBuildings"
	var groups: Dictionary={}
	for item in layout(buildings).list:
		var b: Dictionary=item.building;var name: String=MODELS.get(b.type,"house")
		if not groups.has(name):groups[name]=[]
		groups[name].append(item)
	for name in groups:
		var mesh:=get_mesh(name)
		if mesh==null:continue
		var bounds:=mesh.get_aabb();var divisor:=maxf(maxf(bounds.size.x,bounds.size.z),0.000001)
		var center:=Vector3(bounds.position.x+bounds.size.x/2.0,bounds.position.y,bounds.position.z+bounds.size.z/2.0)
		var batch:=MultiMesh.new();batch.transform_format=MultiMesh.TRANSFORM_3D;batch.mesh=mesh;batch.instance_count=groups[name].size()
		for i in groups[name].size():
			var item: Dictionary=groups[name][i];var b: Dictionary=item.building
			var ready: bool=b.get("ready",false);var scalar: float=float(item.size)*0.04*(1 if ready else 0.75)/divisor
			var angle:=float(b.get("buildingRotationV228",b.get("wallAngleV175",b.get("shoreAngle",0))))
			var basis:=Basis(Vector3.UP,angle).scaled(Vector3(scalar,scalar*(1 if ready else 0.5),scalar))
			var point:=Vector3(float(item.x)*0.04,0,float(item.z)*0.04)
			point.y=float(height.call(origin+point))-float(height.call(origin))
			batch.set_instance_transform(i,Transform3D(basis,point-basis*center))
		var visual:=MultiMeshInstance3D.new();visual.multimesh=batch;root.add_child(visual)
	return root
