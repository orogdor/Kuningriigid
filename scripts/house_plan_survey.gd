extends RefCounted
const Plan=preload("res://scripts/house_plan_geometry.gd")
const Costs=preload("res://data/house_editor_costs.json")

static func add(total: Dictionary,cost: Dictionary,multiplier:=1.0) -> void:
 for key in cost:total[key]=float(total.get(key,0))+float(cost[key])*multiplier

static func polygon_area(polygon: PackedVector2Array) -> float:
 var area:=0.0
 for i in polygon.size():area+=polygon[i].cross(polygon[(i+1)%polygon.size()])
 return absf(area)*0.5

static func estimate(design: Dictionary) -> Dictionary:
 var out:Dictionary={};var geometry:=Plan.plan_geometry(design);var scale:=Plan.PX_PER_M
 for wall in geometry.walls:
  for span in Plan.split_wall(wall,design):
   if span.get("type","")=="door":continue
   var length:float=span.a.distance_to(span.b)/scale
   var factor:=0.6
   if span.group=="outer":
    var build:=str(design.get("build","wall"));factor=(0.15 if build=="open" else 2.7 if build=="tower" else 1.0)*float(design.get("wallScale",100))/100.0
   if span.get("type","")=="window":factor*=0.6
   add(out,Costs.data.wallCost.get(str(span.finish),{}),length*factor)
 var area:=0.0
 for polygon in geometry.floors:area+=polygon_area(polygon)/(scale*scale)
 var has_structure:bool=not design.get("rooms",[]).is_empty()
 for run in design.get("wallRuns",[]):
  if Plan.shelter_shape(run):has_structure=true;break
 if has_structure and design.get("roofForm","")!="battlement":
  add(out,Costs.data.roofCostOf.get(str(design.get("roofMat","reed")),{}),area*(0.75+float(design.get("roofHeight",75))/100.0*0.35))
  if design.get("roofForm","")=="terrace":add(out,{"reed":0.5,"wood":0.6,"clay":0.42},area)
 for fence in design.get("fences",[]):
  var length:=Plan.point(fence.a).distance_to(Plan.point(fence.b))/scale
  add(out,Costs.data.fenceCost.get(str(fence.kind),{}),1.0 if fence.kind=="gateLine" else length)
 if design.get("pier") is Dictionary:add(out,{"wood":4},Plan.point(design.pier.a).distance_to(Plan.point(design.pier.b))/scale)
 if design.get("porch","none")!="none" and not geometry.floors.is_empty():
  var perimeter:=0.0
  for edge in Plan.edges(geometry.floors[0]):perimeter+=edge.a.distance_to(edge.b)/scale
  add(out,{"wood":4,"reed":2},perimeter if design.porch=="all" else perimeter/4)
 if design.get("field") is Dictionary and design.get("plot") is Array:
  var plot:=PackedVector2Array()
  for p in design.plot:plot.append(Plan.point(p))
  var perimeter:=0.0
  for edge in Plan.edges(plot):perimeter+=edge.a.distance_to(edge.b)/scale
  add(out,Costs.data.fieldEdgeCost.get(str(design.field.get("edge","ridge")),{}),perimeter)
 for item in design.get("items",[]):add(out,Costs.data.itemCost.get(str(item.type),{}))
 for key in out:out[key]=floori(float(out[key])+0.5)
 return out
