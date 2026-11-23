extends RefCounted
const Grid=preload("res://scripts/campaign_grid.gd")
const Geography=preload("res://scripts/world_geography.gd")
const STARTS=[{"c":35,"r":35},{"c":172,"r":33},{"c":44,"r":129},{"c":167,"r":132}]
var seed:int
func _init(value:int)->void:seed=value
func smooth(x:float,z:float)->float:
 var i:=floori(x);var j:=floori(z);var u:=x-i;var v:=z-j;u=u*u*(3-2*u);v=v*v*(3-2*v)
 var a:=lerpf(Geography.noise(i,j,seed),Geography.noise(i+1,j,seed),u);var b:=lerpf(Geography.noise(i,j+1,seed),Geography.noise(i+1,j+1,seed),u)
 return lerpf(a,b,v)
func inland_height(c:int,r:int)->float:
 var x:float=-650+(c+0.5)*50;var z:float=-550+(r+0.5)*50;var width:=Grid.COLS*50.0;var depth:=Grid.ROWS*50.0
 var e:=smooth(x/180+300,z/180+200)*0.65+smooth(x/70+800,z/70+900)*0.35-0.48
 e-=maxf(0,maxf(absf(x-(-650+width/2))/(width/2),absf(z-(-550+depth/2))/(depth/2))-0.7)*1.2
 e=maxf(0.05,e)
 var u:float=(x+650)/width;var v:float=(z+550)/depth
 e-=maxf(0,maxf(absf(u-0.5)*2,absf(v-0.5)*2)-0.78)*1.5
 return e*95
func generate()->Dictionary:
 var heights:=PackedFloat32Array();var lat:=PackedFloat32Array();var heat:=PackedFloat32Array();var moisture:=PackedFloat32Array()
 heights.resize(Grid.COLS*Grid.ROWS);lat.resize(heights.size());heat.resize(heights.size());moisture.resize(heights.size())
 for r in Grid.ROWS:
  for c in Grid.COLS:
   var i:=r*Grid.COLS+c;heights[i]=inland_height(c,r)
   lat[i]=absf((r+0.5)/Grid.ROWS-0.5)*2
   heat[i]=clampf(1-float(lat[i])*0.92+(Geography.noise(c+417,r+73,seed)-0.5)*0.18,0,1)
   moisture[i]=clampf(smooth(c/13.0+17,r/13.0+71)*0.6+smooth(c/41.0+53,r/41.0+11)*0.4,0,1)
 return {"seed":seed,"heights":heights,"lat":lat,"heat":heat,"moisture":moisture,"starts":STARTS.duplicate(true),"world_type":"inland"}
static func plateau(heights:PackedFloat32Array,starts:Array)->PackedFloat32Array:
 var result:=heights.duplicate()
 for r in Grid.ROWS:
  for c in Grid.COLS:
   var i:=r*Grid.COLS+c;var h:=float(result[i])
   if h>0:
    for p in starts:
     var dx:float=(c-p.c)*50;var dz:float=(r-p.r)*50
     if dx*dx+dz*dz<125*125:result[i]=maxf(h,9.5);break
   # makeGrid's historical corridor is retained on the inland generator.
   if (r==11 and c>=10 and c<=17) or (c==17 and r>=9 and r<=11):result[i]=maxf(result[i],9)
 return result

static func river_direction(a:Dictionary,b:Dictionary)->String:
 if a.c==b.c:return "v"
 if a.r==b.r:return "h"
 return "d1" if (a.c-b.c)*(a.r-b.r)>0 else "d2"
static func legacy_rivers(cells:Array,seed:int,starts:Array)->void:
 var sources:=[]
 for cell in cells:
  if cell.land and float(cell.h)>22:sources.append(cell)
 sources.sort_custom(func(a,b):return float(a.h)+Geography.noise(a.c*9,a.r*7,seed)>float(b.h)+Geography.noise(b.c*9,b.r*7,seed))
 var chosen:=[]
 for s in sources:
  var valid:=true
  for other in chosen:
   if absi(int(other.c)-int(s.c))+absi(int(other.r)-int(s.r))<=18:valid=false;break
  if valid:chosen.append(s)
  if chosen.size()>=12:break
 for source in chosen:
  var current:Dictionary=source;var previous:Variant=null;var path:=[];var seen:Dictionary={}
  for step in 90:
   var key:=str(current.c)+":"+str(current.r)
   if seen.has(key):break
   seen[key]=true;path.append(current);var near:=false
   for p in starts:
    if absi(int(p.c)-int(current.c))+absi(int(p.r)-int(current.r))<=1:near=true;break
   if not near and current.land:current.river=true;current.bridge=bool(current.get("bridge",false))
   var neighbors:=[]
   for dr in range(-1,2):
    for dc in range(-1,2):
     if dc==0 and dr==0:continue
     var c:=int(current.c)+dc;var r:=int(current.r)+dr
     if c>=0 and c<Grid.COLS and r>=0 and r<Grid.ROWS:neighbors.append(cells[r*Grid.COLS+c])
   var sea:=false
   for n in neighbors:
    if not n.land:sea=true;break
   if sea:
    if current.land and not near:current.river=true;current.ford=bool(current.get("ford",false)) or step%7==3;current.riverDir="v" if previous==null else river_direction(previous,current)
    break
   neighbors.sort_custom(func(a,b):return float(a.h)+(0 if a.land else -12)+Geography.noise(a.c+51,a.r+17,seed)*1.2<float(b.h)+(0 if b.land else -12)+Geography.noise(b.c+51,b.r+17,seed)*1.2)
   var next:Variant=null
   for n in neighbors:
    if previous==null or n.c!=previous.c or n.r!=previous.r:next=n;break
   if next==null:break
   previous=current;current=next
  for i in path.size():
   var cell:Dictionary=path[i];var near:=false
   for p in starts:
    if absi(int(p.c)-int(cell.c))+absi(int(p.r)-int(cell.r))<=1:near=true;break
   if not cell.land or near:continue
   cell.river=true;cell.riverDir=river_direction(path[maxi(0,i-1)],path[mini(path.size()-1,i+1)])
   if not cell.get("ford",false) and (i%8==floori(Geography.noise(cell.c+91,cell.r+13,seed)*4)+3 or i==path.size()-2):cell.ford=true
 for cell in cells:
  if cell.get("river",false) and cell.mountain:cell.ford=false
