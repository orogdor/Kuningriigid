extends RefCounted
## V131 research.js base-tree subset: age/turns/requires/oneOf reproduced.
## V118 and age-specific extensions remain to be ported; V125 is merged dynamically.
const Tech125 = preload("res://scripts/core/research_v125_port.gd")
const TURN_SECONDS: float = 60.0
const ERA_NAMES = ["Kiviaeg","Pronksiaeg","Rauaaeg","Keskaeg","Renessanss","Tööstusajastu","Moodne ajastu"]
const TECHS = {
    "hunting":{"name":"Jahipidamine","age":0,"turns":1,"requires":[]},
    "fishing":{"name":"Kalapüük","age":0,"turns":1,"requires":[]},
    "stone_tools":{"name":"Kivitöö","age":0,"turns":2,"requires":[]},
    "learning":{"name":"Õpetuse alused","age":0,"turns":2,"requires":["stone_tools"]},
    "warfare":{"name":"Sõjapidamine","age":0,"turns":2,"requires":["stone_tools"]},
    "water":{"name":"Veevarustus","age":0,"turns":2,"requires":["stone_tools"]},
    "settlement":{"name":"Asunduste rajamine","age":0,"turns":2,"requires":["stone_tools"]},
    "agriculture":{"name":"Põlluharimine","age":0,"turns":3,"requires":["stone_tools"]},
    "archery":{"name":"Vibulaskmine","age":0,"turns":2,"requires":["hunting","warfare"]},
    "bronze":{"name":"Pronksitöö","age":1,"turns":4,"requires":["stone_tools"],"oneOf":["hunting","fishing","agriculture"]},
    "woodworking":{"name":"Puusepatöö","age":1,"turns":2,"requires":["bronze"]},
    "forestry":{"name":"Metsade teadlik majandamine","age":1,"turns":2,"requires":["bronze","woodworking"]},
    "milling":{"name":"Käsijahvatus ja leivategu","age":1,"turns":2,"requires":["agriculture","woodworking"]},
    "iron":{"name":"Rauatöö","age":2,"turns":4,"requires":["bronze","woodworking"]},
    "smelting":{"name":"Rauasulatus","age":2,"turns":3,"requires":["iron"]},
    "smithing":{"name":"Sepatöö","age":2,"turns":3,"requires":["smelting","warfare"]},
    "civics":{"name":"Feodaalkorraldus","age":3,"turns":4,"requires":["smithing","milling"]},
    "horsemanship":{"name":"Ratsaväe väljaõpe","age":2,"turns":3,"requires":["iron","warfare"]},
    "stone_crafts":{"name":"Kiviaja töökojad","age":0,"turns":2,"requires":["stone_tools"]},
    "bronze_crafts":{"name":"Pronksriistad ja ehitus","age":1,"turns":3,"requires":["bronze","stone_crafts"]},
    "iron_crafts":{"name":"Raudriistad ja töökojad","age":2,"turns":4,"requires":["iron","bronze_crafts"]},
    "medieval_crafts":{"name":"Meistrite ehituskunst","age":3,"turns":5,"requires":["civics","iron_crafts"]},
    "shipbuilding":{"name":"Laevaehitus","age":1,"turns":3,"requires":["bronze","woodworking","fishing"]},
    "writing":{"name":"Kirjakunst","age":1,"turns":3,"requires":["bronze","settlement"]},
    "philosophy":{"name":"Filosoofia ja teaduste korraldus","age":2,"turns":3,"requires":["iron","writing"]},
    "scholasticism":{"name":"Kõrgem haridus","age":3,"turns":4,"requires":["civics","philosophy"]},
    "bridges":{"name":"Sillaehitus","age":1,"turns":3,"requires":["bronze","woodworking"]},
    "storage":{"name":"Laoehitus ja varude korraldus","age":1,"turns":2,"requires":["bronze","woodworking"]},
    "cellaring":{"name":"Keldrite ja toidu säilitamine","age":1,"turns":2,"requires":["bronze","agriculture"]},
    "commerce":{"name":"Linnaturg ja kaubandus","age":1,"turns":3,"requires":["bronze","storage"]},
    "navigation":{"name":"Rannikunavigatsioon","age":2,"turns":4,"requires":["iron","shipbuilding"]},
    "ocean_sailing":{"name":"Ookeanipurjetamine","age":3,"turns":8,"requires":["civics","navigation","medieval_crafts"]},
    "renaissance":{"name":"Renessanss","age":4,"turns":7,"requires":["civics","scholasticism"]},
    "printing":{"name":"Trükikunst","age":4,"turns":5,"requires":["renaissance","writing"]},
    "astronomy":{"name":"Astronoomia","age":4,"turns":6,"requires":["renaissance","navigation"]},
    "gunpowder":{"name":"Salpeeter ja püssirohi","age":4,"turns":7,"requires":["renaissance","smelting"]},
    "industrialization":{"name":"Tööstusrevolutsioon","age":5,"turns":9,"requires":["renaissance","printing","gunpowder","iron_crafts"]},
    "steelmaking":{"name":"Terase masstootmine","age":5,"turns":7,"requires":["industrialization","smelting"]},
    "steam_engine":{"name":"Aurumasin","age":5,"turns":8,"requires":["steelmaking"]},
    "industrial_education":{"name":"Tehniline kõrgharidus","age":5,"turns":6,"requires":["steam_engine","printing"]},
    "rifles":{"name":"Vintpüssid","age":5,"turns":6,"requires":["steelmaking","gunpowder"]},
    "railways":{"name":"Raudteetransport","age":5,"turns":7,"requires":["steam_engine"]},
    "modernity":{"name":"Moodne ajastu","age":6,"turns":11,"requires":["industrial_education","railways"]},
    "oil_drilling":{"name":"Naftapuurimine","age":6,"turns":7,"requires":["modernity"]},
    "petroleum":{"name":"Nafta rafineerimine","age":6,"turns":7,"requires":["oil_drilling"]},
    "electricity":{"name":"Elektritootmine","age":6,"turns":8,"requires":["modernity","steelmaking"]},
    "combustion":{"name":"Sisepõlemismootor","age":6,"turns":9,"requires":["petroleum","steam_engine"]},
    "modern_science":{"name":"Moodne teadus","age":6,"turns":9,"requires":["electricity","industrial_education"]},
    "aviation":{"name":"Lennundus","age":6,"turns":9,"requires":["combustion","modern_science"]},
    "pottery":{"name":"Savitöö ja keraamika","age":0,"turns":2,"requires":["stone_tools"]},
    "animal_husbandry":{"name":"Loomakasvatus","age":0,"turns":3,"requires":["hunting","agriculture"]},
    "masonry":{"name":"Kivitahumine","age":0,"turns":3,"requires":["stone_tools"]},
    "wheel":{"name":"Ratta valmistamine","age":1,"turns":3,"requires":["bronze","woodworking"]},
    "copper_tin":{"name":"Vase- ja tinatöö","age":1,"turns":4,"requires":["bronze","masonry"]},
    "road_construction":{"name":"Teedeehitus","age":1,"turns":4,"requires":["wheel","copper_tin"]},
    "early_siege_engineering":{"name":"Varane piiramistehnika","age":2,"turns":4,"requires":["iron","wheel","stone_fortifications"]},
    "ancient_artillery":{"name":"Antiikne heiterelvastus","age":2,"turns":4,"requires":["early_siege_engineering","woodworking"]},
    "fortifications":{"name":"Kaitserajatised","age":0,"turns":3,"requires":["stone_tools","warfare"]},
    "stone_fortifications":{"name":"Kivist kindlustused","age":1,"turns":4,"requires":["bronze","fortifications","masonry"]}
}

static func all_techs() -> Dictionary:
    var result: Dictionary = TECHS.duplicate(true)
    result.merge(Tech125.TECHS_V125, true)
    return result

const ERA_GATES: Array[String] = ["", "bronze", "iron", "civics", "renaissance", "industrialization", "modernity"]

static func can_unlock(tech_id: String, discovered: Dictionary) -> bool:
    var definitions: Dictionary = all_techs()
    if not definitions.has(tech_id) or bool(discovered.get(tech_id, false)):
        return false
    var tech: Dictionary = definitions[tech_id]
    # V131 research.js techBlock forbids later-era side technologies until
    # that civilization has researched the matching era-gate technology.
    var age: int = clampi(int(tech.get("age",0)),0,6)
    var gate: String = ERA_GATES[age]
    if age > 0 and tech_id != gate and not bool(discovered.get(gate,false)):
        return false
    for prerequisite in tech["requires"]:
        if not bool(discovered.get(prerequisite, false)):
            return false
    if tech.has("oneOf"):
        var found: bool = false
        for prerequisite in tech["oneOf"]:
            if bool(discovered.get(prerequisite, false)):
                found = true
                break
        if not found:
            return false
    return true

static func available(discovered: Dictionary) -> Array:
    var ids: Array = []
    for tech_id in all_techs().keys():
        if can_unlock(tech_id, discovered):
            ids.append(tech_id)
    return ids
