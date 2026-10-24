"""Formations V3.1 static/wiring validator, NOT a GDScript runtime test."""
from pathlib import Path
import re
p=Path(__file__).resolve().parents[1]
a=(p/'scripts/core/battle_formations_v131.gd').read_text()
b=(p/'scripts/core/individual_battle_port.gd').read_text()
m=(p/'scripts/main.gd').read_text()
d=(p/'scripts/core/battle_doctrine_v131.gd').read_text()
t=(p/'tests/port_checks.gd').read_text()
assert 'const OPTIONS: Array[String]' in a and len(re.findall(r'"(line|column|shield_wall|spear_wall|hold|loose|skirmish|charge)"',a.split('const SHIELDS')[0]))==8
for name in ('valid_for','shape','slot','desired_auto','change','formation_time','update','damage_factor','skirmish_goal','mounted_flank'):
 assert re.search(r'static func '+name+r'\(',a),name
assert 'Formations.update(squad,enemy_squad,dt' in b
assert 'Formations.damage_factor(squad,enemy_squad,opponent,man,false)' in b
assert 'Formations.damage_factor(origin,target_squad,target_man' in b
assert 'Formations.skirmish_goal(squad,man,opponent)' in b
assert 'Formations.mounted_flank(squad,enemy_squad)' in b
assert 'not _friendly_shot_clear(bins,man,opponent)' in b
assert 'Formations.change(squad,value' in b
assert '"auto_formation"' in b and '"auto_formation"' in m
assert 'BattleFormations.valid_for' in m
assert 'battle_tactics_info' in m
assert '"battlefield_500": _large_battle_demo()' in m
assert 'terrain_search_budget: int = 2 if bool(battle.get("large_battle_test",false)) else 6' in b
assert 'return .48' in d and 'return .35' in d and 'return 1.15' in d
assert 'v131_godot_measurements_v33.csv' in m
assert len(re.findall(r'^\s+_check\(',t,re.M))>=658
names=re.findall(r'_check\(results,\s*"([^"]+)"',t)
new_names=[n for n in names if n.startswith("v31-")]
assert len(new_names)==len(set(new_names)),[x for x in new_names if new_names.count(x)>1]
# Existing 24 / 192 / 500 tests, city siege and manual commands remain bound.
for label in ('"infantry_battle"','"terrain_battle"','"battlefield_500"','"siege"','"formation"','"auto_formation"'):
 assert label in m,label
print('PASS V3.1 formation module, AI, 500-soldier, manual UI, save/log, missile lanes; 658+ prepared assertions (static).')
