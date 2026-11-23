extends RefCounted
const Economy=preload("res://scripts/economy_rules.gd")

# Equivalent to contextAt/attachDistrict in civilization-core.js. A district
# owns its local world and buildings but shares its parent city's realm.
static func key(tile: Vector2i) -> String:
 return str(tile.x)+":"+str(tile.y)

static func attach(parent: Dictionary,district: Dictionary) -> void:
 district.districtOf=parent.id;district.constructionAreaId=parent.id;district.id=parent.id;district.team=parent.team;district.name=parent.name
 if not district.has("economy"):return
 var economy:Dictionary=district.economy
 if not economy.has("realms") or economy.realms.size()<4:
  economy.realms=[]
  for i in 4:economy.realms.append(Economy.realm())
 economy.realms[int(parent.team)]=parent.economy.realms[int(parent.team)]
 if not economy.has("time"):economy.time=parent.economy.get("time",0)
 for building in economy.get("buildings",[]):building.team=parent.team

static func existing(parent: Dictionary,tile: Vector2i) -> Variant:
 if int(parent.c)==tile.x and int(parent.r)==tile.y:return parent
 return parent.get("districts",{}).get(key(tile))

static func at_city(cities: Array,tile: Vector2i) -> Variant:
 for parent in cities:
  var context: Variant=existing(parent,tile)
  if context!=null:return context
 return null

static func create(parent: Dictionary,tile: Vector2i,world: Dictionary,seed: int,time: float) -> Dictionary:
 if int(parent.c)==tile.x and int(parent.r)==tile.y:return parent
 if not parent.has("districts"):parent.districts={}
 var k:=key(tile)
 if parent.districts.has(k):attach(parent,parent.districts[k]);return parent.districts[k]
 var economy:=Economy.initial_state(seed);economy.settlers=[];economy.units=[];economy.cargo=[];economy.time=parent.economy.get("time",time)
 economy.buildings=[{"type":"hall","x":0,"z":0,"team":parent.team,"hp":1200,"ready":true,"virtual":true}]
 var district:Dictionary={"c":tile.x,"r":tile.y,"foundedAt":time,"world":world,"economy":economy}
 parent.districts[k]=district;attach(parent,district);return district

static func contexts(parent: Dictionary) -> Array:
 var result:=[parent]
 for district in parent.get("districts",{}).values():result.append(district)
 return result

static func all_buildings(parent: Dictionary) -> Array:
 var result:=[]
 for context in contexts(parent):
  for building in context.get("economy",{}).get("buildings",[]):
   if not building.get("virtual",false):result.append(building)
 return result

# Requirements and the construction queue are shared across the city. Physical
# overlap and the nearest parent building are local to the selected tile.
static func build_economy(parent: Dictionary,context: Dictionary) -> Dictionary:
 var result: Dictionary=context.economy.duplicate();result.buildings=context.economy.buildings.duplicate()
 for other in contexts(parent):
  if is_same(other,context):continue
  for building in other.economy.get("buildings",[]):
   if building.get("virtual",false):continue
   var remote: Dictionary=building.duplicate();remote.virtual=true;remote.x=1000000.0+float(building.get("x",0));remote.z=1000000.0+float(building.get("z",0));result.buildings.append(remote)
 return result

static func restore(parent: Dictionary) -> void:
 for district in parent.get("districts",{}).values():attach(parent,district)
