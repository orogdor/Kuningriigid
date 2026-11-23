extends RefCounted
const Plan=preload("res://scripts/house_plan_geometry.gd")
const Fence=preload("res://scripts/house_fence.gd")
const Catalog=preload("res://data/house_editor_catalog.json")

# Basic geometry from the source designer's buildProjectModel. Special tower,
# gate and shelter barriers are added by their respective source routines.
static func origin(design: Dictionary) -> Vector2:
 var geometry:=Plan.plan_geometry(design);var points:=PackedVector2Array()
 for floor in geometry.floors:points.append_array(floor)
 if design.get("upper") is Dictionary:
  var upper: Dictionary=design.upper
  for floor in Plan.plan_geometry(upper).floors:points.append_array(floor)
 var workshop:=false
 for item in design.get("items",[]):
  if item.get("type","") in ["workShelter","stockShelter","longShelter","sideShelter","sideStockShelter"]:workshop=true;break
 if workshop and design.get("yard") is Array:
  for p in design.yard:points.append(Plan.point(p))
 for wall in geometry.walls:points.append(wall.a);points.append(wall.b)
 for fence in design.get("fences",[]):points.append(Plan.point(fence.a));points.append(Plan.point(fence.b))
 for tower in Fence.tower_positions(design):
  var c:=cos(float(tower.angle));var sn:=sin(float(tower.angle))
  for p in [Vector2(-1.16,-1.10),Vector2(1.16,-1.10),Vector2(-1.16,2.18),Vector2(1.16,2.18)]:points.append(tower.point+Vector2(c*p.x-sn*p.y,sn*p.x+c*p.y)*Plan.PX_PER_M)
 points.append_array(Plan.pier_outline(design.get("pier")))
 if design.get("plot") is Array:
  for p in design.plot:points.append(Plan.point(p))
 var lo:=Vector2(INF,INF);var hi:=Vector2(-INF,-INF)
 for p in points:lo=lo.min(p);hi=hi.max(p)
 return (lo+hi)/2 if not points.is_empty() else Vector2(480,312)

static func walls(design: Dictionary,skip_high:=false,skip_towers:=false) -> Array:
 var geometry:=Plan.plan_geometry(design);var origin:=origin(design)
 var out:=[]
 for wall in geometry.walls:
  for span in Plan.split_wall(wall,design):
   if span.get("type","")=="door":continue
   var a:Vector2=(span.a-origin)/Plan.PX_PER_M;var b:Vector2=(span.b-origin)/Plan.PX_PER_M
   out.append([a.x,a.y,b.x,b.y,0.23 if span.group=="outer" else 0.17])
 # Source work shelters have four physical posts; ordinary furniture remains
 # non-blocking in the original walking view.
 for item in design.get("items",[]):
  var kind:=str(item.get("type",""))
  if kind not in ["workShelter","stockShelter","longShelter","sideShelter","sideStockShelter"]:continue
  var dimensions:Array=Catalog.data.itemSizes[kind];var width:=float(dimensions[0])/Plan.PX_PER_M;var depth:=float(dimensions[1])/Plan.PX_PER_M
  var sideways:bool=kind in ["sideShelter","sideStockShelter"]
  if sideways:var temp:=width;width=depth;depth=temp
  var center:Vector2=(Plan.point(item.point)-origin)/Plan.PX_PER_M;var x:=width/2-0.13;var z0:=-depth/2+0.14;var z1:=depth/2-0.15
  for u in [-x,x]:
   for v in [z0,z1]:
    var p:Vector2=center+(Vector2(v,-u) if sideways else Vector2(u,v))
    out.append([p.x,p.y,p.x,p.y,0.105])
 for tower in ([] if skip_towers else Fence.tower_positions(design)):
  var c:=cos(float(tower.angle));var sn:=sin(float(tower.angle));var x:float=(0.87+0.102)*Plan.PX_PER_M;var z:float=(0.78+0.075)*Plan.PX_PER_M
  var vertex=func(p: Vector2) -> Vector2:return (tower.point+Vector2(c*p.x-sn*p.y,sn*p.x+c*p.y)-origin)/Plan.PX_PER_M
  if tower.attached:
   var corners: Array=[vertex.call(Vector2(-x,-z)),vertex.call(Vector2(x,-z)),vertex.call(Vector2(x,z)),vertex.call(Vector2(-x,z))]
   for pair in [[0,1],[1,2],[3,0]]:out.append([corners[pair[0]].x,corners[pair[0]].y,corners[pair[1]].x,corners[pair[1]].y,0.13])
   var right:Vector2=vertex.call(Vector2(0.33*Plan.PX_PER_M,z));var left:Vector2=vertex.call(Vector2(-0.33*Plan.PX_PER_M,z))
   out.append([corners[2].x,corners[2].y,right.x,right.y,0.11]);out.append([left.x,left.y,corners[3].x,corners[3].y,0.11])
  else:
   for dx in [-x,x]:
    for dz in [-z,z]:
     var point:Vector2=vertex.call(Vector2(dx,dz));out.append([point.x,point.y,point.x,point.y,0.20])
 for fence in Fence.layout(design):
  if skip_high and fence.kind=="highStone":continue
  if fence.kind=="gateLine":
   var profile:=Fence.gate_profile(fence)
   for i in 2:
    var a: Vector2=(profile.hinges[i]-origin)/Plan.PX_PER_M;var b: Vector2=(profile.tips[i]-origin)/Plan.PX_PER_M
    out.append([a.x,a.y,b.x,b.y,0.112 if profile.field else 0.16])
   if not fence.get("open",true):
    var a: Vector2=(Plan.point(fence.a)-origin)/Plan.PX_PER_M;var b: Vector2=(Plan.point(fence.b)-origin)/Plan.PX_PER_M
    out.append([a.x,a.y,b.x,b.y,0.21])
   continue
  var a: Vector2=(Plan.point(fence.a)-origin)/Plan.PX_PER_M;var b: Vector2=(Plan.point(fence.b)-origin)/Plan.PX_PER_M
  var radius:=0.775 if fence.kind=="highStone" else 1.37 if fence.kind=="rampart" else 0.30 if fence.kind=="stoneLine" else 0.23 if fence.kind=="palisadeLine" else 0.17
  out.append([a.x,a.y,b.x,b.y,radius])
 return out
