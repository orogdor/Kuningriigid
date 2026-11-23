extends Node3D

const Grid=preload("res://scripts/campaign_grid.gd")
const Terrain=preload("res://scripts/detail_terrain.gd")
const Roads=preload("res://scripts/world_roads.gd")
const Landscape=preload("res://scripts/detail_landscape.gd")
const LocalNav=preload("res://scripts/local_navigation.gd")
const WIDTHS:=[0.0,0.78,0.9,1.05,1.575]
const COLORS:=["","716147","7e6b50","817767","8b8170","9a9182","858682","545a5a"]
const APPEARANCES:=[[1,1,1,1],[1,2,2,2],[2,3,3,3],[2,3,4,4],[2,3,4,5],[3,6,6,5],[3,6,7,7]]
var host: Node
var center:=Vector2i.ZERO
var stamp: String=""

func _process(_delta: float) -> void:
	if host==null:return
	var building_stamp: Array=[]
	for city in host.game.get("cities",[]):
		if absi(int(city.c)-center.x)>1 or absi(int(city.r)-center.y)>1:continue
		for building in city.economy.buildings:building_stamp.append([building.type,building.x,building.z,building.get("width",0),building.get("depth",0),float(building.get("hp",0))>0])
	var next: String="%s:%s:%s:%s:%s" % [host.game.get("roadRevision",0),host.game.get("visionRevision",0),host.reveal_all,host.game.ages,building_stamp]
	if next==stamp:return
	stamp=next;rebuild()

func rebuild() -> void:
	for child in get_children():child.queue_free()
	var surfaces: Dictionary={};var heights: Dictionary={};var road_segments: Dictionary={}
	var edges:=Roads.visual_network(host.game,host.game.explored[0],host.reveal_all)
	for edge in edges:
		var level:=int(edge.level);var owner: Variant=host.territory_allocation.get("territory",{}).get(str(edge.a.x)+":"+str(edge.a.y))
		if owner==null:owner=host.territory_allocation.get("territory",{}).get(str(edge.b.x)+":"+str(edge.b.y))
		var team:=int(owner.team) if owner is Dictionary else 0
		var appearance: int=APPEARANCES[clampi(int(host.game.ages[team]),0,6)][level-1]
		for dr in range(-1,2):
			for dc in range(-1,2):
				var at:=center+Vector2i(dc,dr)
				if at.x<0 or at.y<0 or at.x>=Grid.COLS or at.y>=Grid.ROWS:continue
				if not host.reveal_all and not host.game.explored[0].has(str(at.x)+":"+str(at.y)):continue
				if absi(at.x-edge.a.x)>2 and absi(at.x-edge.b.x)>2:continue
				if absi(at.y-edge.a.y)>2 and absi(at.y-edge.b.y)>2:continue
				var tile_center:=Grid.center(at.x,at.y);var key:=str(at.x)+":"+str(at.y)
				var obstacles:=tile_obstacles(at);var local_points:=local_road(edge.points,tile_center,obstacles,level)
				for i in range(local_points.size()-1):
					var a: Vector2=local_points[i];var b: Vector2=local_points[i+1]
					var part:=Landscape.clip(Vector3(a.x,0,a.y),Vector3(b.x,0,b.y))
					if part.is_empty():continue
					if not heights.has(key):heights[key]=Terrain.tile_heights(host.grid,at.x,at.y)
					if not surfaces.has(appearance):
						var surface:=SurfaceTool.new();surface.begin(Mesh.PRIMITIVE_TRIANGLES);surfaces[appearance]=surface
					var left: Vector3=part[0];var right: Vector3=part[1]
					var direction:=Vector2(right.x-left.x,right.z-left.z).normalized()
					var normal: Vector2=Vector2(-direction.y,direction.x)*1.19*float(WIDTHS[level])*0.86
					if not clear_segment(Vector2(left.x,left.z),Vector2(right.x,right.z),obstacles,normal.length()):continue
					if not road_segments.has(key):road_segments[key]=[]
					road_segments[key].append([Vector2(left.x,left.z),Vector2(right.x,right.z),normal.length()+2.0])
					var vertices: Array=[Vector2(left.x,left.z)-normal,Vector2(left.x,left.z)+normal,Vector2(right.x,right.z)+normal,Vector2(left.x,left.z)-normal,Vector2(right.x,right.z)+normal,Vector2(right.x,right.z)-normal]
					for v in vertices:
						var p: Vector2=v
						surfaces[appearance].add_vertex(Vector3(p.x+dc*225,host.detail_rendered_height(p.x+dc*225,p.y+dr*195)+0.045,p.y+dr*195))
	for appearance in surfaces:
		var node:=MeshInstance3D.new();node.mesh=surfaces[appearance].commit()
		var material:=StandardMaterial3D.new();material.albedo_color=Color(COLORS[appearance]);material.cull_mode=BaseMaterial3D.CULL_DISABLED
		node.material_override=material;add_child(node)
	if host.get("detail_root")==null:return
	if host.detail_root.ground_cover!=null:host.detail_root.ground_cover.set_roads(road_segments.get(str(center.x)+":"+str(center.y),[]))
	var neighbors: Node=host.detail_root.get_node_or_null("NeighborTiles")
	if neighbors!=null:
		for tile in neighbors.get_children():
			var at: Vector2i=tile.get_meta("coords",Vector2i(-1,-1));var segments: Array=road_segments.get(str(at.x)+":"+str(at.y),[])
			tile.set_meta("road_segments",segments)
			var nature: Node=tile.get_node_or_null("Nature")
			if nature!=null and nature.ground_cover!=null:nature.ground_cover.set_roads(segments)

func tile_obstacles(at: Vector2i) -> Array:
	var result: Array=[]
	for city in host.game.get("cities",[]):
		if int(city.c)!=at.x or int(city.r)!=at.y:continue
		for building in city.economy.buildings:
			if building.get("virtual",false) or float(building.get("hp",0))<=0:continue
			if building.type in ["woodgate","gatehouse"]:
				var wide:=bool(building.get("extendedPalisadeV166",false));var side:=5.2 if wide else 2.55;var post:=1.6 if wide else 1.35
				var vertical:=bool(building.get("wallAxis",false))
				for sign_value in [-1,1]:result.append([float(building.x)+(0 if vertical else sign_value*side),float(building.z)+(sign_value*side if vertical else 0),0.95 if vertical else post,post if vertical else 0.95])
				continue
			var bounds: Variant=LocalNav.clearance(building)
			if bounds!=null:result.append([float(building.x),float(building.z),float(bounds.rx),float(bounds.rz)])
	return result

static func local_road(points: Array,tile_center: Vector2,obstacles: Array,level: int) -> Array:
	var result: Array=[]
	for i in range(1,points.size()):
		var a: Vector2=points[i-1];var b: Vector2=points[i]
		var steps:=maxi(1,ceili(a.distance_to(b)/0.58))
		for k in range(0 if i==1 else 1,steps+1):
			var p:=a.lerp(b,float(k)/steps)-tile_center
			result.append(Vector2(p.x*4.5,p.y*3.9))
	if obstacles.is_empty():return result
	var margin: float=2.0*1.19*float(WIDTHS[level])*0.8+1.2
	for round_index in 8:
		var moved:=false
		for i in range(1,result.size()-1):
			var p: Vector2=result[i]
			for obstacle in obstacles:
				var dx:=p.x-float(obstacle[0]);var dz:=p.y-float(obstacle[1]);var rx:=float(obstacle[2])+margin;var rz:=float(obstacle[3])+margin
				if absf(dx)>=rx or absf(dz)>=rz:continue
				if rx-absf(dx)<rz-absf(dz):p.x=float(obstacle[0])+(1 if dx>=0 else -1)*(rx+0.05)
				else:p.y=float(obstacle[1])+(1 if dz>=0 else -1)*(rz+0.05)
				moved=true
			result[i]=p
		if not moved and round_index>1:break
		for pass_index in 2:
			for i in range(1,result.size()-1):result[i]=result[i]*0.5+(result[i-1]+result[i+1])*0.25
	return result

static func clear_segment(a: Vector2,b: Vector2,obstacles: Array,margin: float) -> bool:
	if obstacles.is_empty():return true
	var steps:=maxi(1,ceili(a.distance_to(b)/0.75))
	for i in range(steps+1):
		var p:=a.lerp(b,float(i)/steps)
		for obstacle in obstacles:
			if absf(p.x-float(obstacle[0]))<float(obstacle[2])+margin and absf(p.y-float(obstacle[1]))<float(obstacle[3])+margin:return false
	return true
