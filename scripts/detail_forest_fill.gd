class_name DetailForestFill
extends RefCounted

# The V346 detail forest uses a single jittered lattice. Extra trees belong to
# their nearest resource tree, so felling that resource also clears the canopy.
const Forest=preload("res://scripts/forest_scatter.gd")
const Terrain=preload("res://scripts/detail_terrain.gd")
const Landscape=preload("res://scripts/detail_landscape.gd")
const HALF_X:=112.5
const HALF_Z:=97.5
const BIN_SIZE:=16.0

var bins: Dictionary={}
var rows: Array=[]
var heights: Array=[]
var visual_heights:=PackedVector4Array()
var river_segments: Array=[]
var origin:=Vector2.ZERO
var spacing:=5.0
var seed:=0
var radius:=36.0
var separation_sq:=12.96
var spread:=3
var min_gx:=0
var max_gx:=0
var max_gz:=0
var gx:=0
var gz:=0
var done:=false

func setup(cell: Vector2i,world_seed: int,forest: bool,resources: Array,terrain_heights: Array,rivers: Array,visual:=PackedVector4Array()) -> void:
	seed=world_seed;heights=terrain_heights;visual_heights=visual;river_segments=rivers
	spacing=5.0 if forest else 7.0;radius=36.0 if forest else 24.0
	separation_sq=pow(3.6 if forest else 4.6,2);spread=ceili(radius/BIN_SIZE)
	origin=Vector2(cell.x*225.0,cell.y*195.0)
	for resource in resources:
		if resource.get("kind","")!="tree" or (resource.get("cleared",false) and float(resource.get("amount",0))>0):continue
		note(float(resource.x),float(resource.z),resource)
		if forest:
			var value:=sin(float(resource.id)*127.1+cell.x*19.7+cell.y*83.1)*43758.5453
			var angle:=(value-floorf(value))*TAU
			var x:=float(resource.x)+cos(angle)*4.2;var z:=float(resource.z)+sin(angle)*4.2
			if absf(x)<=HALF_X-3 and absf(z)<=HALF_Z-3 and absf(z)>=18:note(x,z,resource)
	if bins.is_empty():done=true;return
	min_gx=floori((origin.x-HALF_X)/spacing);max_gx=floori((origin.x+HALF_X)/spacing)
	gx=min_gx;gz=floori((origin.y-HALF_Z)/spacing);max_gz=floori((origin.y+HALF_Z)/spacing)

func note(x: float,z: float,owner: Variant=null) -> void:
	var key:=Vector2i(floori(x/BIN_SIZE),floori(z/BIN_SIZE))
	if not bins.has(key):bins[key]=[]
	bins[key].append({"x":x,"z":z,"owner":owner})

func step(limit: int=48) -> void:
	if done:return
	for unused in limit:
		if gz>max_gz:done=true;return
		var cell_x:=gx;var cell_z:=gz
		gx+=1
		if gx>max_gx:gx=min_gx;gz+=1
		# Keep lattice coordinates in double precision before subtracting the
		# tile origin; Vector2 would round away metres at distant map tiles.
		var x: float=(float(cell_x)+0.12+0.76*Forest.random_value(cell_x,cell_z,seed,346))*spacing-float(origin.x)
		var z: float=(float(cell_z)+0.12+0.76*Forest.random_value(cell_x,cell_z,seed,347))*spacing-float(origin.y)
		if x < -HALF_X or x >= HALF_X or z < -HALF_Z or z >= HALF_Z:continue
		var cx:=floori(x/BIN_SIZE);var cz:=floori(z/BIN_SIZE)
		var owner: Variant=null;var closest:=radius*radius;var blocked:=false
		for j in range(-spread,spread+1):
			if blocked:break
			for i in range(-spread,spread+1):
				for other in bins.get(Vector2i(cx+i,cz+j),[]):
					var distance:=pow(float(other.x)-x,2)+pow(float(other.z)-z,2)
					if distance<separation_sq:blocked=true;break
					if other.owner!=null and distance<closest:owner=other.owner;closest=distance
				if blocked:break
		if blocked or owner==null:continue
		var y:=Terrain.visual_rendered_height(heights,visual_heights,x,z)
		if y<0.5 or Landscape.near_water(Vector2(x,z),river_segments,1.55,2.0):continue
		var id:=floori(Forest.random_value(cell_x,cell_z,seed,348)*1000000.0)
		var scale:=0.8+Forest.random_value(cell_x,cell_z,seed,349)*0.35
		rows.append({"x":x,"y":y,"z":z,"id":id,"owner":owner,"scale":scale})
		note(x,z)
