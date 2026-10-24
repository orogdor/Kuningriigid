from pathlib import Path
p=Path(__file__).resolve().parents[1]/'scripts/main.gd'
s=p.read_text()
s=s.replace('const PortChecks = preload("res://tests/port_checks.gd")', '''const PortChecks = preload("res://tests/port_checks.gd")
const PreviewSim = preload("res://scripts/core/preview_sim_port.gd")''',1)
s=s.replace('var city_node: MultiMeshInstance3D','''var preview_state: Dictionary = {}
var city_index: int = 3
var city_label: Label
var city_node: MultiMeshInstance3D''',1)
s=s.replace('''    _load_cities()
    _build_world()''','''    _load_cities()
    preview_state = PreviewSim.initialize(cities)
    _build_world()''',1)
s=s.replace('''    box.custom_minimum_size = Vector2(0,166)''','''    box.custom_minimum_size = Vector2(0,226)''',1)
s=s.replace('''    info_label = Label.new()
    v.add_child(info_label)
    var controls := HBoxContainer.new()
    v.add_child(controls)''','''    info_label = Label.new()
    info_label.add_theme_font_size_override("font_size",15)
    v.add_child(info_label)
    city_label = Label.new()
    city_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    city_label.add_theme_font_size_override("font_size",14)
    v.add_child(city_label)
    var performance_scroll := ScrollContainer.new()
    performance_scroll.custom_minimum_size = Vector2(0,48)
    performance_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
    performance_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
    v.add_child(performance_scroll)
    var controls := HBoxContainer.new()
    performance_scroll.add_child(controls)''',1)
s=s.replace('''    _add_button(controls,"+",func():_zoom(.8))
    var bottom := PanelContainer.new()''','''    _add_button(controls,"+",func():_zoom(.8))
    var city_scroll := ScrollContainer.new()
    city_scroll.custom_minimum_size = Vector2(0,49)
    city_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
    city_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
    v.add_child(city_scroll)
    var city_controls := HBoxContainer.new()
    city_scroll.add_child(city_controls)
    _add_button(city_controls,"Järgmine linn",func():_select_next_city())
    _add_button(city_controls,"Metsamaja",func():_preview_build("lumber"))
    _add_button(city_controls,"Kaev",func():_preview_build("well"))
    _add_button(city_controls,"Kivimurd",func():_preview_build("quarry"))
    _add_button(city_controls,"Uuri",func():_preview_research())
    _add_button(city_controls,"Salvesta",func():_preview_save())
    _add_button(city_controls,"Laadi",func():_preview_load())
    var bottom := PanelContainer.new()''',1)
s=s.replace('''    status_label.text = "V131 OSALINE PORT, MITTE 1:1! Lohista kaarti / kahe sõrmega suumi. Samad kaardimõõdud ja linnaasendid, mitte sama AI ega 3D mudelid."''','''    status_label.text = "V131 OSALINE PORT 0.2. LINNA KATSESIMULATSIOON POLE 1:1! Ehitamise ja uurimise reeglid on osalised."''',1)
s=s.replace('''    if not paused:
        _advance_actors''','''    if not paused:
        if not preview_state.is_empty():
            PreviewSim.tick(preview_state,minf(delta,.06))
        _advance_actors''',1)
s=s.replace('''    info_label.text="V131 osaport: %d ruutu · %d linna · %d maakonnaruutu · %d ühikut · BFS %d / vahemälu %d · kontroll %s" %[COLS*ROWS,cities.size(),county_tile_count,actors.size(),routes_calculated,routes_reused,rules_check_result]''','''    info_label.text="V131 port 0.2: %d ruutu | %d linna | %d maakonnaruutu | %d ühikut | BFS %d / vahemälu %d | kontroll %s" %[COLS*ROWS,cities.size(),county_tile_count,actors.size(),routes_calculated,routes_reused,rules_check_result]
    if city_label != null and not preview_state.is_empty() and city_index < preview_state["cities"].size():
        city_label.text = PreviewSim.preview_summary(preview_state,city_index)''',1)
needle='''func _toggle_pause() -> void:'''
addition='''func _select_next_city() -> void:
    if cities.is_empty():
        return
    city_index = (city_index + 1) % cities.size()
    var city: Dictionary = cities[city_index]
    focus = Vector2(float(city["c"]),float(city["r"]))
    _update_camera()
    _update_labels()

func _preview_build(kind: String) -> void:
    if preview_state.is_empty():
        return
    var result: Dictionary = PreviewSim.build_in_town(preview_state,city_index,kind)
    status_label.text = "EHITUS (lihtsustatud): " + str(result["reason"])
    _update_labels()

func _preview_research() -> void:
    if preview_state.is_empty():
        return
    var team: int = int(preview_state["cities"][city_index]["team"])
    var result: Dictionary = PreviewSim.research_next(preview_state,team)
    status_label.text = "UURIMINE: " + str(result["reason"])
    _update_labels()

func _preview_save() -> void:
    status_label.text = "KATSESEIS SALVESTATUD (mitte V4): user://v131_godot_preview_v02.json" if PreviewSim.save_preview(preview_state) else "Salvestamine ei õnnestunud"

func _preview_load() -> void:
    var data: Dictionary = PreviewSim.load_preview(cities)
    if data.is_empty():
        status_label.text = "Ühilduvat katseolekut ei leitud"
        return
    preview_state = data
    status_label.text = "KATSESEIS LAETUD (mitte V131 V4)"
    _update_labels()

'''
assert needle in s
s=s.replace(needle,addition+needle,1)
s=s.replace('Kuningriigid Godot test:', 'Kuningriigid Godot 0.2 osaport:')
p.write_text(s)
print('Updated main.gd',len(s.splitlines()),'lines')
