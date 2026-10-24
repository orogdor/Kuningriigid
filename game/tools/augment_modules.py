from pathlib import Path
p = Path(__file__).resolve().parents[1]
r = p/'scripts/core/research_port.gd'
s = r.read_text()
s = s.replace('## V118, V125 and era-specific Object.assign extensions are NOT ported yet.', '## V118 and age-specific extensions remain to be ported; V125 is merged dynamically.')
s = s.replace('const TURN_SECONDS:', 'const Tech125 = preload("res://scripts/core/research_v125_port.gd")\nconst TURN_SECONDS:')
s = s.replace('static func can_unlock(tech_id: String, discovered: Dictionary) -> bool:\n    if not TECHS.has(tech_id) or bool(discovered.get(tech_id, false)):', '''static func all_techs() -> Dictionary:
    var result: Dictionary = TECHS.duplicate(true)
    result.merge(Tech125.TECHS_V125, true)
    return result

static func can_unlock(tech_id: String, discovered: Dictionary) -> bool:
    var definitions: Dictionary = all_techs()
    if not definitions.has(tech_id) or bool(discovered.get(tech_id, false)):''')
s = s.replace('var tech: Dictionary = TECHS[tech_id]', 'var tech: Dictionary = definitions[tech_id]')
s = s.replace('for tech_id in TECHS.keys():\n        if can_unlock', 'for tech_id in all_techs().keys():\n        if can_unlock')
r.write_text(s)
e = p/'scripts/core/economy_port.gd'
s = e.read_text()
s = s.replace('## Goods added in city-needs-v87.js are not included in this stage.', '## V87 food varieties also come from the ported city-needs module.\nconst Needs = preload("res://scripts/core/city_needs_port.gd")')
s = s.replace('return START.duplicate(true)', '''var result: Dictionary = START.duplicate(true)
    for key in Needs.GOODS.keys():
        if not result.has(key):
            result[key] = 0.0
    return result''')
s = s.replace('if FOOD_NUTRITION.has(resource):','if Needs.food_keys().has(resource):')
s = s.replace('var keys: Array = FOOD_NUTRITION.keys()', 'var nutrition_map: Dictionary = Needs.food_equivalence()\n    var keys: Array = nutrition_map.keys()')
s = s.replace('var nutrition: float = float(FOOD_NUTRITION[key])','var nutrition: float = float(nutrition_map[key])')
s = s.replace('for key in FOOD_NUTRITION.keys():\n        food += maxf(0.0,float(available.get(key,0.0))) * float(FOOD_NUTRITION[key])','for key in Needs.food_equivalence().keys():\n        food += maxf(0.0,float(available.get(key,0.0))) * float(Needs.food_equivalence()[key])')
e.write_text(s)
print('Applied all research/economy augmentations')
