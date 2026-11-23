class_name ForestScatter
extends RefCounted

# Original forest-placement-v330.js and forest-clumps-v270.js.
static func random_value(x: float,z: float,seed:=0,salt:=0) -> float:
	var n:=sin(x*127.1+z*311.7+seed*0.017+salt*53.79)*43758.5453
	return n-floorf(n)

static func value(x: float,z: float) -> float:
	var xi:=floori(x);var zi:=floori(z)
	var fx:=x-xi;var fz:=z-zi
	fx=fx*fx*(3-2*fx);fz=fz*fz*(3-2*fz)
	var a:=random_value(xi,zi);var b:=random_value(xi+1,zi)
	var c:=random_value(xi,zi+1);var d:=random_value(xi+1,zi+1)
	return (a*(1-fx)+b*fx)*(1-fz)+(c*(1-fx)+d*fx)*fz

static func clump(x: float,z: float) -> float:
	return value(x/20.0+13.7,z/20.0+5.1)*0.7+value(x/7.0+91.3,z/7.0+47.9)*0.3

static func tree_keep(x: float,z: float,forest: bool) -> float:
	var n:=clump(x,z)
	return clampf(0.15+1.25*n,0,1) if forest else clampf((n-0.42)*2.6,0,1)

static func candidate(gx: int,gz: int,spacing: float,seed: int,salt:=31) -> Vector2:
	return Vector2((gx+0.12+0.76*random_value(gx,gz,seed,salt))*spacing,(gz+0.12+0.76*random_value(gx,gz,seed,salt+1))*spacing)

static func density(biome: String) -> float:
	return {"forest":18.0,"jungle":19.0,"taiga":17.0,"grassland":2.6,"lush_river":4.5,"steppe":0.8,"tundra":0.35,"mesa":0.5,"desert":3.6}.get(biome,0.0)

static func probability(biome: String,spacing:=7.0,factor:=0.29) -> float:
	var forest:=biome in ["forest","jungle","taiga"]
	var count:=density(biome)/(0.78 if forest else 0.28)
	count*=3.0*(1.8 if forest else 1.0)
	return minf(1.0,count*factor*spacing*spacing/2500.0)

static func kind(biome: String,temperature: float,moisture: float,choice: float) -> String:
	if biome in ["sea","snow","snow_mountain","mesa","desert"]:return ""
	if biome in ["jungle","oasis"]:return "palm"
	if biome in ["taiga","mountain"] or (biome=="forest" and temperature<0.42):
		return "spruce" if choice<0.5 else "pine" if choice<0.85 else "birch"
	if biome=="tundra":return "birch" if choice<0.55 else "spruce" if choice<0.9 else "pine"
	if biome=="steppe" or (biome=="forest" and moisture<0.5):return "pine" if choice<0.65 else "oak"
	if biome=="lush_river":return "birch" if choice<0.4 else "lime" if choice<0.75 else "oak"
	return "oak" if choice<0.5 else "lime" if choice<0.78 else "birch"
