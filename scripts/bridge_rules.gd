class_name BridgeRules
extends RefCounted
const Econ=preload("res://scripts/economy_rules.gd")
const Grid=preload("res://scripts/campaign_grid.gd")

static func preview(city: Dictionary,cell: Dictionary,angle: Variant=null) -> Dictionary:
 if not cell.get("river",false):return {"error":"Silda saab ehitada ainult jõeruudule."}
 if cell.get("bridge",false):return {"error":"Sellel ruudul on sild juba olemas."}
 if angle!=null:
  var a:=fposmod(float(angle),PI)
  if minf(a,PI-a)>PI/12:return {"error":"Sild peab ulatuma mõlemale jõekaldale."}
 var pending:=0
 for b in city.economy.buildings:
  if not b.get("ready",false) and float(b.get("hp",0))>0:pending+=1
 if pending>=12:return {"error":"Linna ühises ehitusjärjekorras on juba 12 hoonet."}
 if not Econ.can_afford(city.economy.realms[city.team].resources,Econ.DATA.data.buildings.bridge.cost):return {"error":"Silla jaoks napib materjale."}
 return {"point":Vector2.ZERO}

static func place(city: Dictionary,cell: Dictionary,angle: Variant=null) -> Dictionary:
 var check:=preview(city,cell,angle)
 if check.has("error"):return check
 Econ.spend_resources(city.economy.realms[city.team].resources,Econ.DATA.data.buildings.bridge.cost)
 var building={"type":"bridge","x":0.0,"z":0.0,"team":city.team,"hp":350,"progress":0.0,"ready":false}
 if angle!=null:building.buildingRotationV228=float(angle);building.freeRotationV243=true
 city.economy.buildings.append(building)
 return {"building":building}

static func restore(cells: Array,cities: Array) -> int:
 var count:=0
 for city in cities:
  var contexts: Array=[city];contexts.append_array(city.get("districts",{}).values())
  for context in contexts:
   var c:=int(context.c);var r:=int(context.r)
   if c<0 or c>=Grid.COLS or r<0 or r>=Grid.ROWS:continue
   var cell: Dictionary=cells[r*Grid.COLS+c]
   for building in context.get("economy",{}).get("buildings",[]):
    if building.get("type","")=="bridge" and building.get("ready",false) and float(building.get("hp",0))>0 and not cell.get("bridge",false):cell.bridge=true;count+=1;break
 return count
