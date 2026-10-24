extends RefCounted
## Direct subset of technology-reforms-v125.js: all 26 V125 tech DAG records.
const TECHS_V125 = {
 "village_council":{"name":"Village Councils","age":0,"turns":3,"requires":["settlement"]},
 "grain_storage":{"name":"Grain Storage","age":0,"turns":3,"requires":["pottery"]},
 "trade_roads":{"name":"Trade Roads","age":1,"turns":5,"requires":["commerce","wheel"]},
 "field_channels":{"name":"Field Channels","age":1,"turns":5,"requires":["canal_irrigation"]},
 "bronze_survey":{"name":"Land Surveying","age":1,"turns":5,"requires":["math_measure"]},
 "military_supply":{"name":"Military Supply Trains","age":2,"turns":6,"requires":["iron","wheel"]},
 "regional_roads":{"name":"Regional Road Networks","age":2,"turns":5,"requires":["bridges","road_construction"]},
 "crop_rotation_v125":{"name":"Crop Rotation","age":2,"turns":6,"requires":["manure_fertilization"]},
 "iron_markets":{"name":"Regional Markets","age":2,"turns":5,"requires":["commerce","iron"]},
 "water_machinery":{"name":"Water-Powered Machinery","age":3,"turns":6,"requires":["watermills","iron_crafts"]},
 "medieval_hospitals":{"name":"Town Hospitals","age":3,"turns":6,"requires":["medieval_healing"]},
 "sanitation":{"name":"Urban Sanitation","age":3,"turns":7,"requires":["civics","city_trade"]},
 "guild_accounts":{"name":"Guild Accounting","age":3,"turns":7,"requires":["guilds","writing"]},
 "town_charters":{"name":"Town Charters","age":3,"turns":7,"requires":["guilds","civics"]},
 "garrison_system":{"name":"Permanent Garrisons","age":3,"turns":7,"requires":["castle_building"]},
 "merchant_banking":{"name":"Merchant Banking","age":4,"turns":8,"requires":["renaissance","city_trade"]},
 "harbor_cranes":{"name":"Harbor Cranes","age":4,"turns":8,"requires":["ocean_sailing","mechanics"]},
 "agricultural_science":{"name":"Agricultural Science","age":4,"turns":8,"requires":["seed_selection","experimental_science"]},
 "cannon_supply":{"name":"Artillery Supply","age":4,"turns":8,"requires":["firearms","field_artillery"]},
 "modern_cartography":{"name":"Modern Cartography","age":4,"turns":8,"requires":["astronomy","printing"]},
 "factory_logistics":{"name":"Factory Logistics","age":5,"turns":9,"requires":["industrialization","mechanics"]},
 "steel_standards":{"name":"Steel Standards","age":5,"turns":9,"requires":["steelmaking","chemistry"]},
 "rail_freight":{"name":"Rail Freight Management","age":5,"turns":9,"requires":["railways","factory_logistics"]},
 "public_utilities":{"name":"Public Utilities","age":5,"turns":9,"requires":["industrial_education","sanitation"]},
 "power_grid":{"name":"Grid Management","age":6,"turns":10,"requires":["electricity","electronics"]},
 "automated_supply":{"name":"Automated Supply Chains","age":6,"turns":10,"requires":["computing","rail_freight"]}
}
const PRODUCTION_REFORMS = [
 {"id":"village_council","outputs":["food","water"],"bonus":.03},
 {"id":"grain_storage","outputs":["food"],"bonus":.05},
 {"id":"trade_roads","outputs":["wood","plank","stone"],"bonus":.07},
 {"id":"field_channels","outputs":["food","grain"],"bonus":.08},
 {"id":"bronze_survey","outputs":["stone","ore","food"],"bonus":.04},
 {"id":"military_supply","outputs":["wood","iron"],"bonus":.06},
 {"id":"regional_roads","outputs":["stone","plank"],"bonus":.06},
 {"id":"crop_rotation_v125","outputs":["food","grain"],"bonus":.09},
 {"id":"iron_markets","outputs":["plank","ore","stone"],"bonus":.05},
 {"id":"water_machinery","outputs":["food","plank"],"bonus":.08},
 {"id":"medieval_hospitals","outputs":["food","water"],"bonus":.04},
 {"id":"sanitation","outputs":["water"],"bonus":.08},
 {"id":"guild_accounts","outputs":["plank","iron"],"bonus":.06},
 {"id":"town_charters","outputs":["wood","stone","food","water","plank"],"bonus":.04},
 {"id":"garrison_system","outputs":["weapons","iron"],"bonus":.05},
 {"id":"merchant_banking","outputs":["plank","iron","steel"],"bonus":.05},
 {"id":"harbor_cranes","outputs":["wood","plank"],"bonus":.07},
 {"id":"agricultural_science","outputs":["grain","food"],"bonus":.10},
 {"id":"cannon_supply","outputs":["iron","gunpowder"],"bonus":.06},
 {"id":"modern_cartography","outputs":["ore","coal","stone"],"bonus":.07},
 {"id":"factory_logistics","outputs":["steel","machines"],"bonus":.12},
 {"id":"steel_standards","outputs":["steel"],"bonus":.15},
 {"id":"rail_freight","outputs":["machines"],"bonus":.12},
 {"id":"public_utilities","outputs":["water","power"],"bonus":.08},
 {"id":"power_grid","outputs":["power"],"bonus":.10},
 {"id":"automated_supply","outputs":["steel","machines","vehicles"],"bonus":.10}
]

static func production_multiplier(discovered: Dictionary, output: String, strategy_pacing: bool = true) -> float:
    if not strategy_pacing:
        return 1.0
    var bonus := 0.0
    for reform in PRODUCTION_REFORMS:
        if bool(discovered.get(reform["id"],false)) and output in reform["outputs"]:
            bonus += float(reform["bonus"])
    return minf(1.6, 1.0 + bonus)
