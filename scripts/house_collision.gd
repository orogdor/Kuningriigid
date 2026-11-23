extends RefCounted
const PlanCollision=preload("res://scripts/house_plan_collision.gd")
const Plan=preload("res://scripts/house_plan_geometry.gd")
const Defaults=preload("res://data/house_default_designs.json")
const DATA=preload("res://data/house_collisions.json")
const FITS=preload("res://data/building_fits.json")
const RULES=preload("res://data/build_rules.json")
static var custom_cache: Dictionary={}
static var reach_cache: Dictionary={}

static func custom_walls(design: Dictionary) -> Array:
 var key:=JSON.stringify(design)
 if not custom_cache.has(key):
  if custom_cache.size()>=128:custom_cache.clear();reach_cache.clear()
  custom_cache[key]=PlanCollision.walls(design)
 return custom_cache[key]

# A designed yard can extend well beyond the building's ordinary navigation
# footprint. This radius includes all original or custom collision segments.
static func reach(detail: Node,building: Dictionary,age: int) -> float:
 var type:=str(building.get("type",""));var visual_age:=maxi(int(RULES.data.age.get(type,0)),age)
 if visual_age>2:return 0.0
 var id:String=detail.designer_id(type,visual_age)
 if type=="palisade" and int(building.get("woodFortTierV1757",1))==2 and building.get("houseDesignV354",{}).is_empty() and id=="palisade":id="palisade-tier2"
 if not DATA.data.has(id) or not FITS.data.has(id):return 0.0
 var design: Variant=building.get("houseDesignV354",{})
 var custom: bool=design is Dictionary and not design.is_empty() and str(design.get("id",""))==id
 var key:=id+":"+(JSON.stringify(design) if custom else "default")
 var radius:=float(reach_cache.get(key,-1))
 if radius<0:
  var fit:Dictionary=FITS.data[id];var walls:Array=custom_walls(design) if custom else DATA.data[id];radius=0.0
  for wall in walls:
   for i in [0,2]:
    var point:=Vector2(float(wall[i])*float(fit.scale[0])+float(fit.offset[0]),float(wall[i+1])*float(fit.scale[2])+float(fit.offset[2]))
    radius=maxf(radius,point.length()+float(wall[4])*maxf(float(fit.scale[0]),float(fit.scale[2]))+0.22)
  reach_cache[key]=radius
 var scale:=1.12 if type=="house" and int(building.get("houseUpgradeLevelV218",0))>=1 else 1.0
 if type in ["palisade","stonewall","reinforced_wall"] and float(building.get("palisadeSpanV167",0))>0:scale=maxf(scale,(float(building.palisadeSpanV167)+float(building.get("cliffEmbedStartV179",0))+float(building.get("cliffEmbedEndV179",0)))/7)
 elif building.get("extendedPalisadeV166",false) and type in ["palisade","woodgate","gatehouse"]:scale=maxf(scale,2)
 return radius*scale+0.25

# Returns the original designer's deck height relative to the building base.
static func pier_surface(detail: Node,building: Dictionary,age: int,x: float,z: float,offset: Vector2=Vector2.ZERO) -> Variant:
 var type:=str(building.get("type",""))
 if type not in ["fisher","harbor"] or not building.get("ready",false):return null
 var visual_age:=maxi(int(RULES.data.age.get(type,0)),age)
 if visual_age>2:return null
 var id:String=detail.designer_id(type,visual_age)
 if not Defaults.data.has(id) or not FITS.data.has(id):return null
 var design: Dictionary=building.get("houseDesignV354",{})
 if design.is_empty() or str(design.get("id",""))!=id:design=Defaults.data[id]
 var outline:=Plan.pier_outline(design.get("pier"))
 if outline.size()<3:return null
 var fit:Dictionary=FITS.data[id];var dx:=x-(float(building.x)+offset.x);var dz:=z-(float(building.z)+offset.y)
 var angle:=float(building.get("buildingRotationV228",building.get("shoreAngle",0)));var c:=cos(angle);var sn:=sin(angle)
 var local_x:float=(dx*c-dz*sn-float(fit.offset[0]))/float(fit.scale[0]);var local_z:float=(dx*sn+dz*c-float(fit.offset[2]))/float(fit.scale[2])
 var plan:=Vector2(local_x,local_z)*Plan.PX_PER_M+PlanCollision.origin(design)
 if not Plan.inside(plan,outline) and Plan.nearest_wall(plan,Plan.edges(outline),0.11).is_empty():return null
 return 0.168*float(fit.scale[1])+float(fit.offset[1])

# null means that this is a later/non-designer model and the caller must use
# the normal game clearance. Empty collision lists are valid designer models.
static func hits(detail: Node,building: Dictionary,age: int,x: float,z: float,offset: Vector2=Vector2.ZERO) -> Variant:
 var type:=str(building.get("type",""));var visual_age:=maxi(int(RULES.data.age.get(type,0)),age)
 if visual_age>2:return null
 var id:String=detail.designer_id(type,visual_age)
 if type=="palisade" and int(building.get("woodFortTierV1757",1))==2 and building.get("houseDesignV354",{}).is_empty() and id=="palisade":id="palisade-tier2"
 if not DATA.data.has(id) or not FITS.data.has(id):return null
 var fit:Dictionary=FITS.data[id]
 var default_angle:=PI/2 if building.get("wallAxis",false) and type in ["palisade","stonewall","reinforced_wall","woodgate","gatehouse"] else 0.0
 var angle:=float(building.get("buildingRotationV228",building.get("wallAngleV175",building.get("shoreAngle",default_angle))))
 var shift:float=(float(building.get("cliffEmbedEndV179",0))-float(building.get("cliffEmbedStartV179",0)))/2.0 if float(building.get("palisadeSpanV167",0))>0 else 0.0
 var wall_angle:=float(building.get("wallAngleV175",0))
 var dx:=x-(float(building.get("x",0))+offset.x+cos(wall_angle)*shift);var dz:=z-(float(building.get("z",0))+offset.y-sin(wall_angle)*shift)
 var c:=cos(angle);var s:=sin(angle);var scale_x:=1.0;var scale_z:=1.0
 if type=="house" and int(building.get("houseUpgradeLevelV218",0))>=1:scale_x=1.12;scale_z=1.10
 if type in ["palisade","stonewall","reinforced_wall"] and float(building.get("palisadeSpanV167",0))>0:scale_x=(float(building.palisadeSpanV167)+float(building.get("cliffEmbedStartV179",0))+float(building.get("cliffEmbedEndV179",0)))/7.0
 elif building.get("extendedPalisadeV166",false) and type in ["palisade","woodgate","gatehouse"]:scale_x=2.0
 var lx:float=(dx*c-dz*s)/scale_x;var lz:float=(dx*s+dz*c)/scale_z
 var sx:=float(fit.scale[0]);var sz:=float(fit.scale[2]);var cx:=float(fit.offset[0]);var cz:=float(fit.offset[2])
 var design: Variant=building.get("houseDesignV354",{})
 var custom: bool=design is Dictionary and not design.is_empty() and str(design.get("id",""))==id
 var walls:Array=custom_walls(design) if custom else DATA.data[id]
 for wall in walls:
  var a:=Vector2(float(wall[0])*sx+cx,float(wall[1])*sz+cz)
  var b:=Vector2(float(wall[2])*sx+cx,float(wall[3])*sz+cz)
  var point:=Vector2(lx,lz);var edge:=b-a;var t:float=clampf((point-a).dot(edge)/edge.length_squared(),0,1) if edge.length_squared()>0 else 0
  var radius:=float(wall[4])*minf(sx,sz)+0.22
  if point.distance_squared_to(a+edge*t)<radius*radius:return true
 return false
