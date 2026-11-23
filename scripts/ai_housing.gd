extends RefCounted
const Ops=preload("res://scripts/building_operations.gd")
const District=preload("res://scripts/district_context.gd")
const Econ=preload("res://scripts/economy_rules.gd")

# planAIHouseUpgradesV218: improve an eligible central house when housing
# approaches capacity, using the ordinary costs and a 36-second retry timer.
static func plan(state: Dictionary,city: Dictionary) -> bool:
 var team:=int(city.team);var realm:Dictionary=city.economy.realms[team]
 if float(state.time)<float(city.get("nextHouseUpgradeV218",0)):return false
 city.nextHouseUpgradeV218=float(state.time)+36
 if Econ.housing_capacity(District.all_buildings(city))>float(realm.pop)+5:return false
 for ctx in District.contexts(city):
  for b in ctx.economy.buildings:
   var preview:=Ops.house_upgrade_preview(state,ctx,b,true)
   if preview.has("error") or not Econ.can_afford(realm.resources,preview.cost):continue
   if Ops.upgrade_house(state,ctx,b,true).has("upgrade"):return true
 return false
