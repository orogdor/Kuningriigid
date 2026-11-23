class_name CityTerritory
extends RefCounted
const ADJACENT: Array[Vector2i]=[Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1)]

static func city_extent(radius: float) -> int:
 return mini(12,2*maxi(1,floori(radius))+1)

static func population_radius(pop: float) -> int:
 return mini(6,maxi(1,floori(sqrt(maxf(0,pop)))))

static func grown_radius(previous: float,pop: float) -> float:
 return minf(6,maxf(1,maxf(previous,population_radius(pop))))

static func next_city_population(radius: float) -> Variant:
 return null if radius>=6 else pow(maxi(1,floori(radius))+1,2)

static func envelope_contains(city: Dictionary,p: Dictionary,extent := 12) -> bool:
 var lo: int=-floori((extent-1)/2.0);var hi:=lo+extent-1
 return p.c-city.c>=lo and p.c-city.c<=hi and p.r-city.r>=lo and p.r-city.r<=hi

static func urban_tile(city: Dictionary,p: Dictionary,radius: float) -> bool:
 var extent:=city_extent(radius)
 if not envelope_contains(city,p,extent):return false
 var offset:=0.5 if extent%2==0 else 0.0
 var dx: float=p.c-city.c-offset;var dz: float=p.r-city.r-offset
 if dx==0 or dz==0:return true
 var angle:=atan2(dz,dx)
 var city_id: float=city.get("id",float(city.c)*7+float(city.r)*11)
 var seed:=city_id*0.71
 var contour:=1+0.085*sin(angle*3+seed)+0.055*cos(angle*5+seed*0.73)
 return sqrt(dx*dx+dz*dz)<=(radius+0.28)*contour

static func county_tile_limit(radius: float) -> int:
 return 3*int(pow(city_extent(radius),2))

static func county_search_radius(radius: float) -> int:
 return ceili((sqrt(3.0)*city_extent(radius)-1.0)/2.0)

static func county_footprint(city: Dictionary,radius: float,cell_at: Callable) -> Array:
 var span:=county_search_radius(radius);var queue: Array=[{"c":city.c,"r":city.r}];var seen: Dictionary={};var tiles: Array=[];var cursor:=0
 while cursor<queue.size():
  var p: Dictionary=queue[cursor];cursor+=1
  var key:=str(int(p.c))+":"+str(int(p.r))
  if seen.has(key) or maxi(absi(int(p.c-city.c)),absi(int(p.r-city.r)))>span:continue
  seen[key]=true
  var cell: Variant=cell_at.call(p)
  if cell==null:continue
  tiles.append(p)
  if not cell.land:continue
  for direction in ADJACENT:queue.append({"c":int(p.c)+direction.x,"r":int(p.r)+direction.y})
 tiles.sort_custom(func(a,b):
  var au:=urban_tile(city,a,radius);var bu:=urban_tile(city,b,radius)
  if au!=bu:return au
  var ad:=pow(float(a.c-city.c),2)+pow(float(a.r-city.r),2);var bd:=pow(float(b.c-city.c),2)+pow(float(b.r-city.r),2)
  if ad!=bd:return ad<bd
  if a.r!=b.r:return a.r<b.r
  return a.c<b.c)
 return tiles.slice(0,mini(tiles.size(),county_tile_limit(radius)))

static func urban_expansion_fits(city: Dictionary,tiles: Array) -> bool:
 var lo_c:=int(city.c);var hi_c:=lo_c;var lo_r:=int(city.r);var hi_r:=lo_r
 var keys:=tiles.duplicate()
 for key in city.get("districts",{}):
  if city.districts[key].get("urbanExpansionV138",false):keys.append(key)
 for key in keys:
  var p:=str(key).split(":");var c:=int(p[0]);var r:=int(p[1])
  lo_c=mini(lo_c,c);hi_c=maxi(hi_c,c);lo_r=mini(lo_r,r);hi_r=maxi(hi_r,r)
 return hi_c-lo_c<12 and hi_r-lo_r<12

class Frontier:
 var heap:=MinPriorityQueue.new()
 var seen: Dictionary={}
 var points: Array=[]
 func push(p: Dictionary,score: float) -> void:
  var key:=str(int(p.c))+":"+str(int(p.r))
  if seen.has(key):return
  seen[key]=true;var index:=points.size();points.append(p);heap.push(score,index)
 func pop() -> Dictionary:
  return points[heap.pop()]
 func size() -> int:
  return heap.size()

static func key_of(p: Dictionary) -> String:
 return str(int(p.c))+":"+str(int(p.r))

static func squared_distance(a: Dictionary,b: Dictionary) -> float:
 return pow(float(a.c-b.c),2)+pow(float(a.r-b.r),2)

static func allocate_territory(input_cities: Array,cell_at: Callable,radius_of: Callable) -> Dictionary:
 var cities:=input_cities.duplicate()
 cities.sort_custom(func(a,b):return int(a.id)<int(b.id))
 var territory: Dictionary={};var urban: Dictionary={};var reserved: Dictionary={};var baseline: Dictionary={};var counts: Dictionary={}
 for city in cities:urban[str(int(city.id))]={};counts[str(int(city.id))]=0
 var claim=func(city,p):
  var key:=key_of(p);var id:=str(int(city.id))
  if not territory.has(key):territory[key]=city;counts[id]=int(counts[id])+1
 for city in cities:
  reserved[key_of(city)]=city
  for key in city.get("districts",{}):
   var district: Dictionary=city.districts[key];var has_building:=false
   for building in district.get("economy",{}).get("buildings",[]):
    if not building.get("virtual",false) and float(building.get("hp",0))>0:has_building=true;break
   if has_building:reserved[key]=city
  for p in county_footprint(city,float(radius_of.call(city)),cell_at):
   var key:=key_of(p);var old: Variant=baseline.get(key)
   if old==null or squared_distance(city,p)<squared_distance(old,p) or (squared_distance(city,p)==squared_distance(old,p) and city.id<old.id):baseline[key]=city
 for key in reserved:
  var parts:=str(key).split(":")
  claim.call(reserved[key],{"c":int(parts[0]),"r":int(parts[1])})
 var order:=cities.duplicate()
 order.sort_custom(func(a,b):
  var ap: float=a.economy.realms[int(a.team)].pop;var bp: float=b.economy.realms[int(b.team)].pop
  return int(a.id)<int(b.id) if ap==bp else ap>bp)
 var allowed=func(city,p):
  var key:=key_of(p);var fixed: Variant=reserved.get(key);var owner: Variant=territory.get(key);var national: Variant=baseline.get(key)
  return (fixed==null or fixed.id==city.id) and (owner==null or owner.id==city.id) and (national==null or national.team==city.team)
 # Preserve paths connecting the centre to already developed districts.
 for city in order:
  var connected: Dictionary={};connected[key_of(city)]=true
  var pending: Array=[]
  for key in reserved:
   if reserved[key].id==city.id:pending.append(key)
  pending.sort()
  for goal in pending:
   if connected.has(goal):continue
   var pair:=str(goal).split(":");var queue: Array=[{"c":int(pair[0]),"r":int(pair[1])}];var parents: Dictionary={};parents[goal]=null
   var reached: Variant=null;var cursor:=0
   while cursor<queue.size():
    var p: Dictionary=queue[cursor];cursor+=1;var key:=key_of(p)
    if connected.has(key):reached=key;break
    for direction in ADJACENT:
     var q={"c":int(p.c)+direction.x,"r":int(p.r)+direction.y};var qkey:=key_of(q);var cell: Variant=cell_at.call(q)
     if parents.has(qkey) or cell==null or not cell.land or not allowed.call(city,q) or maxi(absi(int(q.c-city.c)),absi(int(q.r-city.r)))>county_search_radius(float(radius_of.call(city)))+8:continue
     parents[qkey]=key;queue.append(q)
   if reached!=null:
    var key: Variant=reached
    while key!=null:
     var parts:=str(key).split(":");claim.call(city,{"c":int(parts[0]),"r":int(parts[1])});connected[key]=true;key=parents.get(key)
 for city in order:
  var radius: float=radius_of.call(city);var target:=0
  for dr in range(-6,7):
   for dc in range(-6,7):
    if urban_tile(city,{"c":city.c+dc,"r":city.r+dr},radius):target+=1
  _fill(city,target,true,cell_at,radius_of,territory,urban,counts,allowed,claim)
 for city in order:_fill(city,county_tile_limit(float(radius_of.call(city))),false,cell_at,radius_of,territory,urban,counts,allowed,claim)
 return {"territory":territory,"urban":urban}

static func _fill(city: Dictionary,target: int,is_urban: bool,cell_at: Callable,radius_of: Callable,territory: Dictionary,urban: Dictionary,counts: Dictionary,allowed: Callable,claim: Callable) -> void:
 var min_c:=int(city.c);var max_c:=min_c;var min_r:=int(city.r);var max_r:=min_r
 var radius: float=radius_of.call(city);var city_id:=str(int(city.id));var urban_set: Dictionary=urban[city_id]
 var front:=Frontier.new();var span:=county_search_radius(radius)+ceili(radius/2)+2
 var enqueue=func(p):
  var distance:=maxi(absi(int(p.c-city.c)),absi(int(p.r-city.r)))
  if (is_urban and distance>11) or (not is_urban and distance>span):return
  front.push(p,(10000.0 if is_urban and not urban_tile(city,p,radius) else 0.0)+squared_distance(city,p)+(p.r-city.r)*0.0001+(p.c-city.c)*0.00001)
 enqueue.call(city)
 if not is_urban:
  for key in territory:
   if territory[key].id==city.id:
    var parts:=str(key).split(":");enqueue.call({"c":int(parts[0]),"r":int(parts[1])})
 while front.size()>0 and (urban_set.size()<target if is_urban else int(counts[city_id])<target):
  var p: Dictionary=front.pop();var cell: Variant=cell_at.call(p)
  if cell==null or (is_urban and cell.get("mountain",false)) or not allowed.call(city,p):continue
  if is_urban and (maxi(max_c,int(p.c))-mini(min_c,int(p.c))>=12 or maxi(max_r,int(p.r))-mini(min_r,int(p.r))>=12):continue
  if not cell.land:
   var adjoining:=false
   if not is_urban:
    for direction in ADJACENT:
     var q={"c":int(p.c)+direction.x,"r":int(p.r)+direction.y};var owner: Variant=territory.get(key_of(q));var neighbor: Variant=cell_at.call(q)
     if owner!=null and owner.id==city.id and neighbor!=null and neighbor.land:adjoining=true;break
   if adjoining:claim.call(city,p)
   continue
  claim.call(city,p)
  if is_urban:
   urban_set[key_of(p)]=true;min_c=mini(min_c,int(p.c));max_c=maxi(max_c,int(p.c));min_r=mini(min_r,int(p.r));max_r=maxi(max_r,int(p.r))
  for direction in ADJACENT:enqueue.call({"c":int(p.c)+direction.x,"r":int(p.r)+direction.y})
