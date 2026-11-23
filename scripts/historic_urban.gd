extends RefCounted
const Terrain=preload("res://scripts/terrain_defense_plan.gd")
const Streets=preload("res://scripts/town_streets.gd")
const CIVIC=["market","library","school","public_school","high_school","study","scriptorium","warehouse","cellar","guildhall","chapel","temple","townhall","inn","keep"]
const INDUSTRIAL=["saw","mason","pottery_kiln","bronze_foundry","smith","smelter","barracks","archery"]
const RURAL=["farm","pasture","field","hunter","lumber","quarry","forester","well","fisher"]
const COMPACT=["house","study","market","well","warehouse","cellar"]
static func hash_(a:float,b:float,seed:float=0)->float:
 var t:=sin(a*127.1+b*311.7+seed*74.7)*43758.5453;return t-floor(t)
static func snap(v:float)->float:return floor(v*2+0.5)/2
static func ancient_street(x:float,z:float,seed:int)->Dictionary:
 var angle:=atan2(z,x);var radius:=sqrt(x*x+z*z);var phase:=hash_(seed,5)*TAU
 var bend:=0.13*sin(radius*0.013+phase)+0.05*sin(radius*0.029-phase)
 var theta:=fposmod(angle-bend+phase,TAU);var nearest:=INF
 for i in 4:
  var diff:=absf(atan2(sin(theta-i*TAU/4),cos(theta-i*TAU/4)));nearest=minf(nearest,diff*radius)
 var ring_index:float=floor((radius-72)/85+0.5);var ring:float=72+85*ring_index+4*sin(angle*4+phase+ring_index*0.7);var dist:=absf(radius-ring)
 return {"road":nearest<(4.2 if radius<70 else 5.5) or dist<4.5,"artery":nearest,"ring":dist,"radius":radius}
static func compact_score(type:String,p:Vector2,homes:Array)->float:
 var radius:=p.length()
 if type=="house":
  var score:=absf(radius-31)*0.39+maxf(0,radius-58)*3.15+maxf(0,23-radius)*0.68
  if not homes.is_empty():
   var nearest:=INF
   for h in homes:nearest=minf(nearest,p.distance_to(Vector2(h.x,h.z)))
   score+=maxf(0,nearest-19)*0.29+maxf(0,8.2-nearest)*2.2+absf(nearest-14)*0.07
  return score
 var desired:=32.0 if type=="market" else 27.0 if type in ["warehouse","cellar"] else 23.0
 return absf(radius-desired)*0.34+maxf(0,radius-55)*1.4
static func stone_score(type:String,p:Vector2,seed:int)->float:
 var radius:=p.length()
 if type in ["hall","study","market","well","warehouse","cellar"]:return absf(radius-26)*0.23
 if type=="house":return absf(radius-42)*0.25+maxf(0,radius-72)*2.7
 if type in ["farm","field","pasture","hunter","lumber","quarry","forester","fisher"]:
  var farm:=type in ["farm","field","pasture"];var farm_angle:=fposmod(absf(floor(seed*0.61803398875)),4)*PI/2-PI
  var align:= (1-cos(atan2(p.y,p.x)-farm_angle))*6 if farm else 0.0
  return absf(radius-(94 if farm else 88))*0.22+maxf(0,74-radius)*3.5+align
 return absf(radius-75)*0.24+maxf(0,48-radius)*0.8 if type in INDUSTRIAL else absf(radius-26)*0.23
static func frontage_score(p:Vector2,index:Dictionary)->float:
 if index.is_empty():return 0
 var origin:=Vector2i(floori(p.x/12),floori(p.y/12));var nearest:=INF
 for dz in range(-3,4):
  for dx in range(-3,4):
   for cell in index.get(origin+Vector2i(dx,dz),[]):nearest=minf(nearest,p.distance_to(cell))
 if nearest>27 or nearest<5.5:return 0
 var closeness:float=(nearest-5.5)/1.5 if nearest<7 else maxf(0,(27-nearest)/14) if nearest>13 else 1.0
 return -3.3*clampf(closeness,0,1)
static func courtyard_score(p:Vector2,homes:Array)->float:
 var companions:=0;var ideal:=0
 for h in homes:
  var d:=p.distance_to(Vector2(h.x,h.z))
  if d>=10.5 and d<=20:
   companions+=1
   if d>=12 and d<=17:ideal+=1
 if companions==0:return 0
 return -minf(1.6,(0.8 if ideal>0 else 0.45)+mini(2,companions-1)*0.35)

# Historical town plots: actual roads, seeded bends and compact Stone Age
# neighborhoods. The late suburb/cliff ranking is added separately.
static func plots(tile:Dictionary,parent:Dictionary,type:String,seed:int,stone:bool,street_index:Dictionary={},options:Dictionary={}) -> Array:
 var dc:=int(tile.c)-int(parent.c);var dr:=int(tile.r)-int(parent.r);var hall:Dictionary={"x":0,"z":0};var homes:=[]
 for b in parent.economy.buildings:
  if b.type=="hall" and not b.get("virtual",false):hall=b;break
 if stone and dc==0 and dr==0:
  for b in parent.economy.buildings:
   if b.type=="house" and float(b.get("hp",0))>0 and not b.get("virtual",false):homes.append({"x":float(b.x)-float(hall.x),"z":float(b.z)-float(hall.z)})
 var def:Variant=parent.get("stoneDefensePlanV166",parent.get("defensePlanV139",parent.get("stoneDefenseReserveV168")))
 var outline:Array=def.get("outlineV176",[]) if def is Dictionary else []
 var phase:=growth_phase(parent,int(options.get("age",0 if stone else 1)),outline);var feature:Callable=options.get("feature",Callable())
 var suburb:=outline.size()>=8 and not stone and phase in ["suburb","fortified-suburb"] and (type=="house" or type in CIVIC or type in INDUSTRIAL)
 var anchor:=suburb_anchor(parent,outline,feature) if suburb else Vector2.ZERO
 var result:=[];var grid:=25.0 if type=="market" else (10.2 if stone else 10.6) if type=="house" else 13.2
 var row:=0;var z:float=-97.5+8
 while z<=97.5-8:
  var shift:float=(row%2)*grid*0.43;var col:=0;var x:float=-112.5+8+shift
  while x<=112.5-8:
   var h:=hash_(dc*40+col,dr*40+row,seed);var j:=hash_(dc*13+row,dr*19+col,seed+17)
   var px:=snap(x+(h-0.5)*3.3);var pz:=snap(z+(j-0.5)*3.3)
   if absf(px)<=104.5 and absf(pz)<=89.5:
    var global:=Vector2(dc*225+px-float(hall.x),dr*195+pz-float(hall.z));var street:=ancient_street(global.x,global.y,seed);var allowed:=true
    if type=="house" and street.radius<20:allowed=false
    if street.road:allowed=false
    if allowed and type in Streets.TRAIL_PROTECTED and Streets.crosses_worn(street_index,Vector2(px,pz),type):allowed=false
    if allowed and type=="house" and stone:
     for delta in [Vector2(-4.5,-4.1),Vector2(4.5,-4.1),Vector2(-4.5,4.1),Vector2(4.5,4.1)]:
      if ancient_street(global.x+delta.x,global.y+delta.y,seed).road:allowed=false;break
    if allowed:
     var key:float=floor(float(street.radius)/24+0.5);var noise:=hash_(floor(global.x/32),floor(global.y/32),seed+5)
     var base:float=compact_score(type,global,homes) if stone and type in COMPACT else stone_score(type,global,seed) if stone else absf(float(street.radius)-42)*0.13 if type in CIVIC else -float(street.radius)*0.075 if type in RURAL else absf(float(street.radius)-170)*0.045 if type in INDUSTRIAL else float(street.radius)*0.22
     var penalty:float=Terrain.plot_penalty(Vector2(px+dc*225,pz+dr*195),type,def) if def is Dictionary else 0.0
     var priority:=penalty+base+absf(float(street.artery)-12)*0.08+(noise-0.5)*3
     if type=="house":
      priority+=hash_(key,row,seed)*0.9
      if stone:priority+=frontage_score(Vector2(px,pz),street_index)+(courtyard_score(global,homes) if dc==0 and dr==0 else 0)
     var physical:=Vector2(px+dc*225,pz+dr*195)
     if type=="house" and options.get("nearCliff",false):priority+=cliff_score(physical,feature)
     if suburb:
      if Terrain.inside(physical,outline):priority+=-30 if phase=="fortified-suburb" else 64
      else:
       var wall_distance:=distance_to_curtain(physical,outline);var anchor_distance:=physical.distance_to(anchor)
       priority+=-95+minf(120,anchor_distance)*0.43+maxf(0,wall_distance-70)*0.3 if wall_distance<=110 else 55
     result.append({"x":px,"z":pz,"priority":priority,"globalX":global.x,"globalZ":global.y})
   x+=grid;col+=1
  z+=grid;row+=1
 result.sort_custom(func(a,b):return a.priority<b.priority if a.priority!=b.priority else (a.globalZ<b.globalZ if a.globalZ!=b.globalZ else a.globalX<b.globalX))
 return result.map(func(v):return Vector2(v.x,v.z))

const DISTRICTS=preload("res://scripts/district_context.gd")
const SUBURB_ROOFS=["house","market","warehouse","cellar","study","chapel","library","scriptorium","inn","barracks","archery","smith","saw","mason","farm","fisher","lumber","quarry","pottery_kiln","bronze_foundry","school","academy","guildhall","mill","bakery","stable"]
# The web game only builds housing inside completed fortifications, preferring
# the older enclosure before the newer suburb. The whole footprint must fit.
static func protected_housing_zone(parent:Dictionary,p:Vector2)->int:
 var inner_plan:Variant=parent.get("stoneDefensePlanV166",{})
 var inner:Variant=inner_plan.get("outlineV176") if inner_plan is Dictionary else null
 if inner==null:
  inner_plan=parent.get("defensePlanV139",{})
  inner=inner_plan.get("outlineV176",[]) if inner_plan is Dictionary else []
 var plan:Variant=parent.get("outerRingV184",{})
 if not inner is Array or inner.is_empty() or not plan is Dictionary or not plan.get("sharedArc",[]) is Array or plan.get("sharedArc",[]).is_empty() or not plan.get("slots",[]) is Array or plan.get("slots",[]).is_empty():return -1
 var outer:Variant=plan.get("boundaryV186")
 if not outer is Array:
  outer=plan.sharedArc.duplicate()
  for i in range(plan.slots.size()-1,-1,-1):
   if not plan.slots[i] is Dictionary or not plan.slots[i].get("to") is Dictionary:return -1
   outer.append(plan.slots[i].to)
 if outer.size()<3:return -1
 for point in outer:
  if not point is Dictionary or not (point.get("x") is int or point.get("x") is float) or not (point.get("z") is int or point.get("z") is float) or not is_finite(float(point.x)) or not is_finite(float(point.z)):return -1
 var inside_inner:=true;var inside_outer:=true
 for delta in [Vector2(-4.5,-4.1),Vector2(4.5,-4.1),Vector2(-4.5,4.1),Vector2(4.5,4.1)]:
  if not Terrain.inside(p+delta,inner):inside_inner=false
  if not Terrain.inside(p+delta,outer):inside_outer=false
 return 0 if inside_inner else 1 if inside_outer else 2

static func growth_phase(parent:Dictionary,age:int,outline:Array)->String:
 var houses:=0;var upgraded:=0
 for b in parent.economy.buildings:
  if b.type!="house" or float(b.get("hp",0))<=0 or b.get("virtual",false):continue
  if outline.size()>=3 and not Terrain.inside(Vector2(b.x,b.z),outline):continue
  houses+=1
  if int(b.get("houseUpgradeLevelV218",0))>=1:upgraded+=1
 var population:float=parent.economy.realms[int(parent.team)].get("pop",0)
 var phase:="core"
 if age>=1 and outline.size()>=8 and houses>=8 and population>=20:
  var aim:=mini(3,floori(float(houses)/3));phase="renovate" if upgraded<aim and population<28 else "suburb"
 if parent.get("outerRingDiagnosticV184",{}).get("reason","")=="complete":phase="fortified-suburb"
 return phase
static func distance_to_curtain(p:Vector2,outline:Array)->float:
 var best:=INF
 for i in outline.size():
  var a:=Terrain.point(outline[i]);var b:=Terrain.point(outline[(i+1)%outline.size()]);var axis:=b-a;var d:=axis.length_squared();var t:=clampf((p-a).dot(axis)/d,0,1) if d>0 else 0.0
  best=minf(best,p.distance_to(a+axis*t))
 return best
static func suburb_anchor(parent:Dictionary,outline:Array,feature:Callable)->Vector2:
 var candidates:=[]
 for ctx in DISTRICTS.contexts(parent):
  for b in ctx.economy.get("buildings",[]):
   if float(b.get("hp",0))<=0 or b.get("virtual",false) or b.type not in SUBURB_ROOFS or b.type in ["lumber","quarry","farm","fisher","hunter"]:continue
   var p:=Vector2(float(b.x)+(int(ctx.c)-int(parent.c))*225.0,float(b.z)+(int(ctx.r)-int(parent.r))*195.0)
   if not Terrain.inside(p,outline) and distance_to_curtain(p,outline)<=110:candidates.append(p)
 if not candidates.is_empty():
  var groups:=[];var seen:Dictionary={}
  for i in candidates.size():
   if seen.has(i):continue
   var stack:=[i];var group:=[];seen[i]=true
   while not stack.is_empty():
    var id:int=stack.pop_back();var p:Vector2=candidates[id];group.append(p)
    for j in candidates.size():
     if not seen.has(j) and p.distance_to(candidates[j])<=62:seen[j]=true;stack.append(j)
   groups.append(group)
  groups.sort_custom(func(a,b):return a.size()>b.size())
  var center:=Vector2.ZERO
  for p in groups[0]:center+=p
  return center/groups[0].size()
 var center:=Vector2.ZERO
 for p in outline:center+=Terrain.point(p)
 center/=outline.size()
 if feature.is_valid():
  var best:=Vector2.ZERO;var score:=-INF
  for i in 16:
   var direction:=Vector2.from_angle(i*PI/8);var p:=center+direction*94;var q:=center+direction*130
   var a:String=feature.call(p.x,p.y);var b:String=feature.call(q.x,q.y)
   var value:float=(16 if a=="water" else 11 if a=="mountain" else 0)+(13 if b=="water" else 9 if b=="mountain" else 0)
   if value>score:score=value;best=center+direction*72
  if score>0:return best
 return center+Vector2(74,0)
static func cliff_score(p:Vector2,feature:Callable)->float:
 if not feature.is_valid():return 0
 var sides:=0
 for direction in [Vector2(1,0),Vector2(-1,0),Vector2(0,1),Vector2(0,-1)]:
  for d in [11,16,21,26]:
   var sample:Vector2=p+direction*d
   if feature.call(sample.x,sample.y)!="mountain":continue
   var cross:=Vector2(direction.y,direction.x)*3
   if feature.call(sample.x+cross.x,sample.y+cross.y)=="mountain" or feature.call(sample.x-cross.x,sample.y-cross.y)=="mountain":sides+=1;break
 return -float(sides*39+(35 if sides>=2 else 0)) if sides>0 else 0.0
static func context_score(parent:Dictionary,ctx:Dictionary,phase:String,base:float)->float:
 if phase not in ["suburb","fortified-suburb"]:return base
 var dist:=absi(int(ctx.c)-int(parent.c))+absi(int(ctx.r)-int(parent.r))
 if dist==0:return 12.0 if phase=="fortified-suburb" else 65.0
 var blocks:=0
 if not ctx.get("lazy",false):
  for b in ctx.economy.get("buildings",[]):
   if float(b.get("hp",0))>0 and not b.get("virtual",false) and b.type in ["house","market","well","study","school","warehouse","cellar","library","inn","scriptorium"]:blocks+=1
 return 13.0+12*dist-3*mini(blocks,8)+(35 if ctx.get("expandV138",false) else 0)
