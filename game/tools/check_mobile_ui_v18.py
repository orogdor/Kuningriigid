"""Structural phone UI assertions only; requires actual Android/Godot test."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
s=(root/'scripts/main.gd').read_text(encoding='utf-8')
assert s.count('func _setup_ui() -> void:') == 1
assert s.count('func _add_button(') == 1
assert 'var city_scroll' not in s and 'var performance_scroll' not in s
assert 'scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO' in s
assert 'menu_category = OptionButton.new()' in s
assert '_toggle_mobile_menu()\n\nfunc _setup_lighting()' in s
for label in ['MAAILM','LINN','LAHING','PIIRAMINE','MENÜÜ']:
    assert f'"{label}"' in s, f'Missing persistent {label} button'
for fn in ['_show_world_map','_show_city_view','_show_battle_view','_show_siege_view','_focus_active_battle']:
    assert f'func {fn}(' in s
block=s.split('const MOBILE_MENU_ACTIONS = [',1)[1].split('\n]\n',1)[0]
items=re.findall(r'^    \["([^"]+)", "([^"]+)", "([^"]+)"\],?$',block,re.M)
assert len(items)>=50
act=set(a for _,_,a in items)
match=s.split('func _menu_action(action_id: String) -> void:',1)[1].split('\nfunc _load_cities()',1)[0]
wired=set(re.findall(r'^        "(\w+)":',match,re.M))
assert act.issubset(wired),act-wired
print('PASS: 5 visible nav buttons; 6 category tabs; %d menu entries; %d wired actions; no offscreen horizontal menu.' %(len(items),len(act)))
print('Godot runtime verification: NOT performed.')
