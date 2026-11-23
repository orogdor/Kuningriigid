extends RefCounted
const Grid=preload("res://scripts/campaign_grid.gd")
const SOURCE="2d9ff3999235ba8c95afa57d0cc0a245090ffc9d"
const PREFIX="kingdoms-gzip-v1:"

# The web export contains a versioned, self-contained world-chunks-v1 payload.
# A reference without its payload is deliberately rejected, never regenerated.
static func wrap(raw: Variant) -> Variant:
 if not raw is Dictionary:return null
 if raw.get("schema")==1 and raw.get("source")==SOURCE and raw.get("game") is Dictionary:return raw
 if not raw.get("generatedWorldV331") is Dictionary or not raw.generatedWorldV331.get("payload") is String:return null
 if not raw.get("cities") is Array or not raw.get("settlers") is Array or not raw.get("research") is Array or not raw.get("ages") is Array or not raw.get("explored") is Array:return null
 if raw.get("battle")!=null:return null
 var player_city:Variant=null;var player_settler:Variant=null
 for city in raw.cities:
  if city is Dictionary and int(city.get("team",-1))==0:player_city=city;break
 for person in raw.settlers:
  if person is Dictionary and int(person.get("team",-1))==0:player_settler=person;break
 if player_city==null and player_settler==null:return null
 if not raw.has("lastAIResearchPlan"):raw.lastAIResearchPlan=raw.get("lastAIPlan",raw.get("time",0))
 var has_city:bool=player_city!=null;var selected:Dictionary=player_settler if player_settler is Dictionary else {}
 if selected.is_empty() and has_city:selected={"id":-1,"team":0,"c":int(player_city.c),"r":int(player_city.r),"x":0,"z":0,"path":[],"landed":true,"localTarget":null}
 var world:Dictionary={}
 if not has_city:
  var key:=str(int(selected.c))+":"+str(int(selected.r));world=raw.get("tileWorlds",{}).get(key,{})
 return {"schema":1,"source":SOURCE,"game":raw,"settler":selected,"selected_world":world,"city_created":has_city,"settler_mode":false,"selected_entity":"city" if has_city else "settler","active_army_id":0,"active_merchant_id":-1,"active_ship_id":-1,"active_settler_id":int(selected.get("id",-1)),"active_city_id":int(player_city.id) if has_city else -1,"site_position":[0,0]}

static func unpack(raw: Variant) -> Variant:
 if not raw is String:return null
 var value:String=raw
 if value.begins_with(PREFIX):
  var bytes:=Marshalls.base64_to_raw(value.substr(PREFIX.length()))
  if bytes.is_empty():return null
  var decoded:=bytes.decompress_dynamic(64*1024*1024,FileAccess.COMPRESSION_GZIP)
  if decoded.is_empty():return null
  value=decoded.get_string_from_utf8()
 return JSON.parse_string(value)

static func world(state: Dictionary) -> Dictionary:
 var ref:Variant=state.get("generatedWorldV331")
 if not ref is Dictionary or not ref.get("payload") is String:return {"error":"Salvestusele lisatud maailm puudub."}
 if str(ref.payload).length()>64*1024*1024:return {"error":"Salvestatud maailm on liiga suur."}
 var payload:Variant=JSON.parse_string(ref.payload)
 if not payload is Dictionary or payload.get("encoding")!="world-chunks-v1" or not payload.get("cells") is Array or payload.cells.size()>1000:return {"error":"Maailma andmevorming on vigane."}
 var header:Variant=unpack(payload.get("header"))
 if not header is Dictionary or int(header.get("cols",0))!=Grid.COLS or int(header.get("rows",0))!=Grid.ROWS or header.get("id")!=ref.get("id") or header.get("identity")!=ref.get("identity"):return {"error":"Maailm ei vasta salvestuse andmetele."}
 var identity:Array=header.get("identity",[])
 if identity.size()!=4 or int(identity[0])!=int(state.get("seed",-1)) or identity[1]!=state.get("type") or int(identity[2])!=int(state.get("geographyVersion",0)) or int(identity[3])!=int(state.get("worldScaleVersion",0)):return {"error":"Maailma seeme või versioon ei vasta mänguseisule."}
 var cells:=[];var heights:=PackedFloat32Array();var heat:=PackedFloat32Array();var moisture:=PackedFloat32Array();var lat:=PackedFloat32Array()
 for chunk in payload.cells:
  var batch:Variant=unpack(chunk)
  if not batch is Array or batch.size()>256:return {"error":"Maailma andmeplokk on vigane."}
  for c in batch:
   var i:=cells.size()
   if not c is Dictionary or int(c.get("c",-1))!=i%Grid.COLS or int(c.get("r",-1))!=floori(float(i)/Grid.COLS) or not c.get("detail") is Dictionary or not c.detail.get("heights") is Array or c.detail.heights.size()!=81 or not c.detail.get("resources") is Array:return {"error":"Salvestatud maailmaruut on vigane."}
   if not is_finite(float(c.get("h",NAN))) or not is_finite(float(c.get("x",NAN))) or not is_finite(float(c.get("z",NAN))):return {"error":"Maastiku kõrgus või asukoht on vigane."}
   for value in c.detail.heights:
    if not (value is int or value is float) or not is_finite(float(value)):return {"error":"Detailmaastiku kõrgus on vigane."}
   for resource in c.detail.resources:
    if not resource is Array or resource.size()!=3 or not (resource[0] is int or resource[0] is float) or int(resource[0])!=float(resource[0]) or int(resource[0])<0 or int(resource[0])>4 or not (resource[1] is int or resource[1] is float) or not (resource[2] is int or resource[2] is float) or not is_finite(float(resource[1])) or not is_finite(float(resource[2])):return {"error":"Maailma loodusvara on vigane."}
   var climate:Dictionary=c.get("visualClimate",{});c.webGeneratedV331=true
   cells.append(c);heights.append(float(c.h));heat.append(float(climate.get("heat",0.5)));moisture.append(float(climate.get("moisture",0.5)));lat.append(float(climate.get("lat",0.5)))
 if cells.size()!=Grid.COLS*Grid.ROWS:return {"error":"Salvestatud maailma ruutude arv ei sobi."}
 var starts:Variant=state.get("coastalStartPositions",header.get("startLocations",[]))
 if not starts is Array or starts.size()!=4:return {"error":"Salvestatud alguspaigad on vigased."}
 return {"seed":int(state.seed),"grid":cells,"heights":heights,"heat":heat,"moisture":moisture,"lat":lat,"starts":header.get("startLocations",starts),"coastal_starts":starts}
