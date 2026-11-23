class_name DetailWorld
extends RefCounted
const Terrain=preload("res://scripts/detail_terrain.gd")
const Geography=preload("res://scripts/world_geography.gd")
const Minerals=preload("res://scripts/mineral_sites.gd")

static func create(cells: Array,cell: Dictionary,visual_biome: String,seed: int) -> Dictionary:
	var c: int=cell.c;var r: int=cell.r
	var heights:=Terrain.tile_heights(cells,c,r)
	var imported:bool=cell.get("webGeneratedV331",false)
	var legacy_biome:=str(cell.get("biome","plains")) if cell.get("legacyBiomeV250",false) else ""
	var raw:Array=cell.get("detail",{}).get("resources",[]) if imported else Terrain.raw_resources(c,r,visual_biome,heights,seed,legacy_biome)
	var picked: Array=[]
	if imported:
		for item in raw:
			if not cell.get("land",false) or int(item[0])!=4:picked.append(item.duplicate())
	for item in ([] if imported else raw):
		if int(item[0])==0 and cell.deposits.get("wood",false):picked.append(item)
		elif int(item[0])==1 and cell.deposits.get("stone",false):picked.append(item)
	if not imported and cell.deposits.get("ore",false):
		for i in 6:
			var x: float=(Geography.noise(c*31+i,r+911,seed)-0.5)*110
			var z: float=(Geography.noise(c*21+i,r+722,seed)-0.5)*90
			if Terrain.detail_height(heights,x,z)>0.4:picked.append([2,x,z])
	if not imported and cell.deposits.get("game",false):
		for i in 7:
			var x: float=(Geography.noise(c*13+i,r+521,seed)-0.5)*100
			var z: float=(Geography.noise(c*17+i,r+611,seed)-0.5)*100
			if Terrain.detail_height(heights,x,z)>0.4:picked.append([3,x,z])
	# The original local-world setup removes fish resource nodes on land.
	# River fishing itself uses the separate world-map fisheries stock.
	var resources: Array=[]
	var floor_height: float=maxf(4,cell.h-3.5) if cell.get("river",false) and not cell.get("bridge",false) else maxf(5,cell.h)
	var tree_line:=minf(5.6,floor_height-0.6)
	var firm_line:=minf(6.2,floor_height-0.3)
	var wx: float=-650+(c+0.5)*50
	var wz: float=-550+(r+0.5)*50
	for item in picked:
		var kind:=int(item[0]);var x: float=item[1];var z: float=item[2]
		var dry:=kind>=3 or Terrain.atlas_height(cells,wx+x/4.5,wz+z/3.9)>tree_line
		resources.append({"id":resources.size(),"kind":["tree","stone","ore","game","fish"][kind],"x":x,"z":z,"amount":96 if kind>=3 else (420 if kind>0 else 32),"removed":not dry,"cleared":not dry})
	var world: Dictionary={"resources":resources,"heat":{},"revision":0,"foodResourcesVersion":1}
	var mineral_cell: Dictionary={"c":c,"r":r,"detail":{"heights":heights},"deposits":cell.deposits}
	Minerals.consolidate(world,mineral_cell,[],func(x,z):return Terrain.atlas_height(cells,wx+x/4.5,wz+z/3.9)>firm_line)
	world.berriesVersion=1
	for i in 9:
		var x: int=-24+(i%3)*22;var z: int=-22+floori(float(i)/3)*21
		if Terrain.detail_height(heights,x,z)>0.4:world.resources.append({"id":world.resources.size(),"kind":"berry","x":x,"z":z,"amount":60,"capacity":60,"removed":false})
	world.revision+=1
	ensure_sea_fish(world,cell,seed)
	return world

# Existing Godot saves may predate ocean fish resources; preserve any fish
# already stored there and only fill the missing source-game schools once.
static func ensure_sea_fish(world: Dictionary,cell: Dictionary,seed: int) -> void:
	if cell.get("land",false) or not cell.get("deposits",{}).get("fish",false) or world.get("portSeaFishVersion",0)>=1:return
	var next_id:=0
	for resource in world.resources:
		next_id=maxi(next_id,int(resource.get("id",-1))+1)
		if resource.get("kind","")=="fish":world.portSeaFishVersion=1;return
	var c:=int(cell.c);var r:=int(cell.r);var depth:=int(cell.get("fishDepth",1));var schools:=3 if depth<=2 else 4 if depth<=5 else 5
	for i in schools:
		var x: float=(Geography.noise(c*31+i*3+19,r+815,seed)-0.5)*116.0
		var z: float=(Geography.noise(c*7+i*5+39,r+733,seed)-0.5)*98.0
		world.resources.append({"id":next_id+i,"kind":"fish","x":x,"z":z,"amount":96,"removed":false,"cleared":false})
	world.portSeaFishVersion=1;world.revision=int(world.get("revision",0))+1
