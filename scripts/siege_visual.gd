extends RefCounted
static func material(color: String) -> StandardMaterial3D:
 var result:=StandardMaterial3D.new();result.albedo_color=Color(color);result.roughness=1;return result
static func beam(parent: Node3D,position: Vector3,size: Vector3,mat: Material,rotation:=0.0) -> MeshInstance3D:
 var shape:=BoxMesh.new();shape.size=size;var mesh:=MeshInstance3D.new();mesh.mesh=shape;mesh.position=position;mesh.material_override=mat;mesh.rotation.y=rotation;parent.add_child(mesh);return mesh
static func ballista() -> Node3D:
 var root:=Node3D.new();var wood:=material("#755130");var metal:=material("#6c7369");var rope:=material("#d0bd88")
 for x in [-0.65,0.65]:
  for z in [-0.6,0.6]:beam(root,Vector3(x,1.1,z),Vector3(0.17,0.9,0.17),wood)
 beam(root,Vector3(0,1.65,0),Vector3(0.35,0.25,2.4),wood)
 for x in [-1.2,1.2]:
  beam(root,Vector3(x,1.7,0.65),Vector3(0.35,0.8,0.35),rope)
  beam(root,Vector3(x*0.64,1.9,0.8),Vector3(1.8,0.12,0.16),wood,-0.24 if x>0 else 0.24)
 beam(root,Vector3(0,1.85,0.75),Vector3(2.4,0.05,0.05),rope)
 beam(root,Vector3(0,1.88,0.3),Vector3(0.06,0.06,2),metal)
 beam(root,Vector3(0,0.325,0),Vector3(2.5,0.65,2.5),wood)
 return root
static func bolt() -> Node3D:
 var root:=Node3D.new();var wood:=material("#755130");var metal:=material("#6c7369")
 beam(root,Vector3.ZERO,Vector3(0.08,0.08,2.7),wood)
 beam(root,Vector3(0,0,1.45),Vector3(0.16,0.16,0.3),metal)
 return root
