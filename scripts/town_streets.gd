extends RefCounted
const Navigation=preload("res://scripts/local_navigation.gd")
static func valid(building: Dictionary) -> bool:
 return building.get("ready",false) and float(building.get("hp",0))>0 and not building.get("virtual",false) and building.get("type","") not in ["bridge","stonewall","palisade","reinforced_wall"]
static func distance(a: Dictionary,b: Dictionary) -> float:
 return Vector2(float(a.x)-float(b.x),float(a.z)-float(b.z)).length()
static func add_link(links: Array,seen: Dictionary,sites: Array,a: int,b: int,kind: String) -> void:
 if a<0 or b<0 or a==b:return
 var key:=str(mini(a,b))+":"+str(maxi(a,b))
 if seen.has(key):return
 seen[key]=true;links.append({"from":sites[a],"to":sites[b],"kind":kind,"fromIndex":a,"toIndex":b})
static func connections(buildings: Array) -> Array:
 var sites:=[]
 for building in buildings:
  if valid(building):sites.append(building)
 if sites.size()<2:return []
 var links:=[];var seen: Dictionary={}
 for i in sites.size():
  var a: Dictionary=sites[i];var right:=[];var south:=[]
  for j in sites.size():
   var candidate: Dictionary=sites[j];var dx:=float(candidate.x)-float(a.x);var dz:=float(candidate.z)-float(a.z)
   if dx>4 and absf(dz)<10:right.append(j)
   if dz>4 and absf(dx)<10:south.append(j)
  right.sort_custom(func(b,c):
   var left:Dictionary=sites[b];var other:Dictionary=sites[c]
   var delta:float=(float(left.x)-float(a.x))+absf(float(left.z)-float(a.z))*1.4-(float(other.x)-float(a.x))-absf(float(other.z)-float(a.z))*1.4
   return b<c if delta==0 else delta<0)
  south.sort_custom(func(b,c):
   var left:Dictionary=sites[b];var other:Dictionary=sites[c]
   var delta:float=(float(left.z)-float(a.z))+absf(float(left.x)-float(a.x))*1.4-(float(other.z)-float(a.z))-absf(float(other.x)-float(a.x))*1.4
   return b<c if delta==0 else delta<0)
  add_link(links,seen,sites,i,int(right[0]) if not right.is_empty() else -1,"east-west")
  add_link(links,seen,sites,i,int(south[0]) if not south.is_empty() else -1,"north-south")
 for i in sites.size():
  var count:=0
  for link in links:
   if link.fromIndex==i or link.toIndex==i:count+=1
  if count>=2:continue
  var sorted:=[]
  for j in sites.size():
   if i!=j:sorted.append({"index":j,"distance":distance(sites[i],sites[j])})
  sorted.sort_custom(func(a,b):return a.index<b.index if float(a.distance)==float(b.distance) else a.distance<b.distance)
  for j in mini(2,sorted.size()):add_link(links,seen,sites,i,int(sorted[j].index),"nearby")
 var hubs:=[]
 for i in sites.size():
  if sites[i].type in ["hall","market","well","inn","trade_yard"]:hubs.append(i)
 for i in sites.size():
  if sites[i].type not in ["house","warehouse","barracks"]:continue
  var sorted:=[]
  for j in hubs:
   if i!=j:sorted.append({"index":j,"distance":distance(sites[i],sites[j])})
  sorted.sort_custom(func(a,b):return a.index<b.index if float(a.distance)==float(b.distance) else a.distance<b.distance)
  for j in mini(2,sorted.size()):add_link(links,seen,sites,i,int(sorted[j].index),"household")
 return links
static func traveled(nav: LocalNavigation,link: Dictionary,weight: float) -> int:
 var route: Variant=link.get("route") if int(link.get("navRevision",-1))==nav.revision else null
 if route==null:
  var start: Variant=nav.nearest(Navigation.door(link.from),15);var end: Variant=nav.nearest(Navigation.door(link.to),15)
  route=nav.route(start,end,false) if start!=null and end!=null else null
  link.route=route if route!=null else [];link.navRevision=nav.revision;route=link.route
 if route.size()<2:return 0
 for i in range(1,route.size()):nav.record_traffic(route[i-1],route[i],weight)
 return route.size()
static func tick(parent: Dictionary,dt: float,runtime_for: Callable,now: float) -> void:
 if dt<=0:return
 parent.streetClock=float(parent.get("streetClock",0))+dt
 if float(parent.streetClock)<7:return
 parent.streetClock=fmod(float(parent.streetClock),7.0)
 var contexts: Array=[parent];contexts.append_array(parent.get("districts",{}).values())
 for context in contexts:
  var buildings: Array=context.economy.get("buildings",[]);var count:=0
  for building in buildings:
   if valid(building):count+=1
  if count<3:continue
  var runtime: Dictionary=runtime_for.call(context);var signature:=""
  for building in buildings:signature+=str(building.type)+":"+str(building.get("x",0))+":"+str(building.get("z",0))+":"+str(building.get("ready",false))+":"+str(building.get("hp",0))+"|"
  var memo: Variant=runtime.get("streetMemo")
  if not memo is Dictionary or memo.get("signature")!=signature:memo={"signature":signature,"links":connections(buildings),"index":0};runtime.streetMemo=memo
  if memo.links.is_empty():continue
  var nav: LocalNavigation=runtime.nav;nav.trail_time=now
  var traffic:=clampf(float(parent.economy.realms[parent.team].get("pop",3))/20.0,0.28,1.2)
  for i in 2:
   var link: Dictionary=memo.links[int(memo.index)%memo.links.size()];memo.index=int(memo.index)+1;traveled(nav,link,traffic)


# V173 protects real worn streets while choosing new city plots. Reading this
# index never creates traffic; it applies the original trail decay bands.
const TRAIL_FOOTPRINTS={"house":Vector2(4,3.6),"hall":Vector2(5.6,5),"market":Vector2(11,10.2),"well":Vector2(3.2,3.2),"study":Vector2(5,5),"warehouse":Vector2(5.6,5),"cellar":Vector2(5,4.4)}
const TRAIL_PROTECTED=["house","market","library","school","public_school","high_school","study","scriptorium","warehouse","cellar","guildhall","chapel","temple","townhall","inn","keep","saw","mason","pottery_kiln","bronze_foundry","smith","smelter","barracks","archery"]
static func worn_index(nav: LocalNavigation,now: float) -> Dictionary:
 var index:Dictionary={}
 for key in nav.heat:
  var id:=int(key)
  if id<0 or id>=nav.mask.size():continue
  var h:=float(nav.heat[key]);var elapsed:=maxf(0,now-float(nav.heat_last.get(key,0)))
  var rate:=0.0012 if h>=64 else 0.0028 if h>=30 else 0.006 if h>=13 else 0.009 if h>=4 else 0.013
  if maxf(0,h-rate*elapsed)<4:continue
  var p:Dictionary=nav.point(id);var bucket:=Vector2i(floori(float(p.x)/12),floori(float(p.z)/12))
  if not index.has(bucket):index[bucket]=[]
  index[bucket].append(Vector2(p.x,p.z))
 return index
static func crosses_worn(index: Dictionary,p: Vector2,type: String,pad:=1.3) -> bool:
 var size:Vector2=TRAIL_FOOTPRINTS.get(type,Vector2(5,5));var rx:=size.x+pad;var rz:=size.y+pad
 for z in range(floori((p.y-rz)/12),floori((p.y+rz)/12)+1):
  for x in range(floori((p.x-rx)/12),floori((p.x+rx)/12)+1):
   for cell in index.get(Vector2i(x,z),[]):
    if absf(cell.x-p.x)<rx and absf(cell.y-p.y)<rz:return true
 return false
