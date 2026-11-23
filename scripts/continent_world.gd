extends "res://scripts/legacy_world.gd"
var random_state:int
func _init(value:int)->void:
 super(value);random_state=(value ^ 0x9e3779b9) & 0xffffffff
func random_value()->float:
 random_state=(random_state*1664525+1013904223)&0xffffffff
 return float(random_state)/4294967296.0
static func signed_distance(u:float,v:float,poly:Array)->float:
 var inside:=false;var minimum:=INF;var j:=poly.size()-1
 for i in poly.size():
  var a:Array=poly[i];var b:Array=poly[j];var ax:=float(a[0]);var ay:=float(a[1]);var bx:=float(b[0]);var by:=float(b[1]);var dx:=bx-ax;var dy:=by-ay
  if (ay>v)!=(by>v) and u<(bx-ax)*(v-ay)/(by-ay)+ax:inside=not inside
  var t:=clampf(((u-ax)*dx+(v-ay)*dy)/(dx*dx+dy*dy),0,1);var px:=u-ax-dx*t;var py:=v-ay-dy*t
  minimum=minf(minimum,sqrt(px*px+py*py));j=i
 return minimum if inside else -minimum
func layout()->Dictionary:
 var count:=2+floori(random_value()*3);var rotation:=random_value()*TAU;var centers:=[];var polygons:=[]
 for i in count:
  var angle:=rotation+i*TAU/count;var x:=0.5+cos(angle)*(0.25 if count==2 else 0.28);var y:=0.5+sin(angle)*0.23;centers.append({"x":x,"y":y})
  var rx:=0.18 if count==2 else 0.145;var ry:=0.24 if count==2 else 0.175
  var p1:=random_value()*6.28;var p2:=random_value()*6.28;var p3:=random_value()*6.28;var stretch:=0.88+random_value()*0.22;var poly:=[]
  for j in 40:
   var a:=j*TAU/40;var shape:=1+0.16*sin(a*3+p1)+0.10*cos(a*5+p2)+0.06*sin(a*7+p3)
   poly.append([clampf(x+cos(a)*rx*shape*stretch,0.045,0.955),clampf(y+sin(a)*ry*shape/stretch,0.045,0.955)])
  polygons.append(poly)
 var bridges:=0
 for i in (1 if count==2 else count-1):
  if bridges>=(1 if count==2 else count-2):break
  if random_value()>0.45:continue
  var a:Dictionary=centers[i];var b:Dictionary=centers[(i+1)%count];var dx:float=b.x-a.x;var dy:float=b.y-a.y;var length:=sqrt(dx*dx+dy*dy);var nx:float=-dy/length;var ny:float=dx/length
  var width:=0.012+random_value()*0.008;var bend:=(random_value()-0.5)*0.07;var mx:float=(a.x+b.x)/2+nx*bend;var my:float=(a.y+b.y)/2+ny*bend
  polygons.append([[a.x+nx*width,a.y+ny*width],[mx+nx*width,my+ny*width],[b.x+nx*width,b.y+ny*width],[b.x-nx*width,b.y-ny*width],[mx-nx*width,my-ny*width],[a.x-nx*width,a.y-ny*width]]);bridges+=1
 var islands:=[]
 for attempt in 300:
  if islands.size()>=16:break
  var x:=0.06+random_value()*0.88;var y:=0.07+random_value()*0.86;var reject:=false
  for poly in polygons:
   if signed_distance(x,y,poly)>-0.027:reject=true;break
  if not reject:
   for p in islands:
    if sqrt(pow(float(p.x)-x,2)+pow(float(p.y)-y,2))<0.05:reject=true;break
  if reject:continue
  var radius:=0.009+random_value()*0.014;var poly:=[]
  for k in 9:
   var a:=k*TAU/9;var rr:=radius*(0.8+random_value()*0.4);poly.append([x+cos(a)*rr,y+sin(a)*rr])
  polygons.append(poly);islands.append({"x":x,"y":y})
 var starts:=choose_starts(polygons.slice(0,count),centers)
 return {"count":count,"centers":centers,"polygons":polygons,"bridges":bridges,"starts":starts,"islands":islands}
static func tile_distance(a:Dictionary,b:Dictionary)->float:
 return sqrt(pow(float(a.c)-float(b.c),2)+pow(float(a.r)-float(b.r),2))
static func choose_starts(polygons:Array,centers:Array)->Array:
 var candidates:=[]
 for r in range(5,Grid.ROWS-5,2):
  for c in range(5,Grid.COLS-5,2):
   var u:float=(c+0.5)/Grid.COLS;var v:float=(r+0.5)/Grid.ROWS;var interior:=-1.0
   for poly in polygons:interior=maxf(interior,signed_distance(u,v,poly))
   if interior>0.029:candidates.append({"c":c,"r":r,"interior":interior})
 var selected:=[]
 for team in 4:
  var best:Variant=null;var best_score:=-INF
  for p in candidates:
   var nearest:=INF
   for q in selected:nearest=minf(nearest,tile_distance(p,q))
   if nearest<28:continue
   var target:Variant=centers[0] if team==0 else centers[1] if team==1 and centers.size()>1 else null
   var center_distance:=0.0
   if target!=null:center_distance=sqrt(pow((float(p.c)+0.5)/Grid.COLS-float(target.x),2)+pow((float(p.r)+0.5)/Grid.ROWS-float(target.y),2))
   var score:float=-center_distance*75+float(p.interior)*20 if team==0 else -center_distance*100+float(p.interior)*25 if team==1 and target!=null else nearest+float(p.interior)*35
   if score>best_score:best=p;best_score=score
  if best==null:return []
  selected.append({"c":best.c,"r":best.r})
 return selected
func continent_height(data:Dictionary,c:int,r:int)->float:
 var u:float=(c+0.5)/Grid.COLS;var v:float=(r+0.5)/Grid.ROWS;var coast:=-1.0
 for poly in data.polygons:coast=maxf(coast,signed_distance(u,v,poly))
 coast+=(smooth(u*78+19,v*78+271)-0.5)*0.014+(smooth(u*190+91,v*190+41)-0.5)*0.0035
 if coast<=0:return maxf(-35,coast*900)
 var broad:=smooth(u*10+36,v*10+13);var ridge:=1-absf(smooth(u*42+64,v*42+22)*2-1);var micro:=1-absf(smooth(u*116+83,v*116+65)*2-1);var relief:=smooth(u*26+34,v*26+981)
 var mountain:=maxf(0,(broad-0.43)*2.7);var base:=minf(24,coast*810)*(0.55+relief*0.48);var rockiness:=clampf((coast-0.018)*24,0,1);var orogeny:=0.0
 for i in data.centers.size():
  var center:Dictionary=data.centers[i];var du:float=(u-center.x)/0.18;var dv:float=(v-center.y)/0.22;var along:=du*0.64+dv*0.77;var across:=du*0.77-dv*0.64
  if absf(along)>1.4:continue
  var arc:=across+0.24*sin(along*2.9+i*1.3)+0.11*sin(along*6.1+i);var belt:=exp(-pow(arc/0.29,2))*maxf(0,1-pow(along/1.42,4));orogeny=maxf(orogeny,belt)
 var ridged:=pow(1-absf(smooth(u*94+17,v*94+29)*2-1),1.35)
 return base+rockiness*mountain*(ridge*19+micro*7)+clampf(coast*120,0,1)*orogeny*(13+ridged*23)
func generate()->Dictionary:
 var data:=layout();var heights:=PackedFloat32Array();var lat:=PackedFloat32Array();var heat:=PackedFloat32Array();var moisture:=PackedFloat32Array()
 heights.resize(Grid.COLS*Grid.ROWS);lat.resize(heights.size());heat.resize(heights.size());moisture.resize(heights.size())
 for r in Grid.ROWS:
  for c in Grid.COLS:
   var i:=r*Grid.COLS+c;heights[i]=continent_height(data,c,r);lat[i]=absf((r+0.5)/Grid.ROWS-0.5)*2
   heat[i]=clampf(1-float(lat[i])*0.92+(Geography.noise(c+417,r+73,seed)-0.5)*0.18,0,1)
   moisture[i]=clampf(smooth(c/13.0+17,r/13.0+71)*0.6+smooth(c/41.0+53,r/41.0+11)*0.4,0,1)
 return {"seed":seed,"heights":heights,"lat":lat,"heat":heat,"moisture":moisture,"starts":data.starts,"world_type":"continents","layout":data}
