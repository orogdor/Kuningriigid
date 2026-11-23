extends Control

const UI := "res://assets/ui/"
const ResearchScreen = preload("res://scripts/research_screen.gd")
const DockMenu = preload("res://scripts/dock_menu.gd")
const GameMenu = preload("res://scripts/game_menu.gd")
const DiplomacyScreen = preload("res://scripts/diplomacy_screen.gd")
const CityOverview = preload("res://scripts/city_overview.gd")
const BuildingInspector = preload("res://scripts/building_inspector.gd")
const WorldResourceOverlay = preload("res://scripts/world_resource_overlay.gd")
const Economy = preload("res://scripts/economy_rules.gd")
const Campaign = preload("res://scripts/campaign_state.gd")
var host: Node
var legacy_panel: Control
var minimap: Control
var elements: Dictionary = {}
var labels: Dictionary = {}
var ui_scale := 1.0
var user_ui_scale := 1.0
const SETTINGS_PATH:="user://kuningriigid_godot_settings.cfg"
var last_research_art := ""
var research_screen: Control
var dock_menu: Control
var resource_overlay: Control
var map_actions: PopupMenu
var selection_actions: PopupMenu
var game_menu: Control
var journal_dialog: AcceptDialog
var journal_text: RichTextLabel
var diplomacy_screen: AcceptDialog
var city_overview: AcceptDialog
var building_inspector: Control
var stores_panel: PanelContainer
var stores_body: VBoxContainer
var stores_kind: String=""
var stores_clock:=0.0
var tile_panel: PanelContainer
var tile_title: Label
var tile_present: Label
var tile_missing: Label
var resource_details_open:=false
var tile_clock:=0.0
var ui_font: SystemFont
var ui_bold: SystemFont

func _ready() -> void:
	ui_font=SystemFont.new();ui_font.font_names=PackedStringArray(["Georgia","Times New Roman","serif"])
	ui_bold=SystemFont.new();ui_bold.font_names=ui_font.font_names;ui_bold.font_weight=700
	var hud_theme:=Theme.new();hud_theme.default_font=ui_font;theme=hud_theme
	var settings:=ConfigFile.new()
	if settings.load(SETTINGS_PATH)==OK:user_ui_scale=clampf(float(settings.get_value("interface","scale",1.0)),0.7,1.5)
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	build_hud()
	resource_overlay=Control.new()
	resource_overlay.set_script(WorldResourceOverlay)
	resource_overlay.host=host
	add_child(resource_overlay);move_child(resource_overlay,0)
	map_actions=PopupMenu.new()
	for label in ["Näita / peida ressursid","Näita / peida avastamata ala","Vali asunik","Ava linn / asunik","Vali väe siht","Ava valitud ruudu detailkaart","Linnade ülevaade","Vali oma armee","Automaatne avastamine","Vaata vastase asulat","Kõnni detailkaardil"]:map_actions.add_item(label)
	map_actions.id_pressed.connect(map_action)
	add_child(map_actions)
	selection_actions=PopupMenu.new();selection_actions.id_pressed.connect(context_action);add_child(selection_actions)
	style_menu()
	dock_menu=Control.new()
	dock_menu.set_script(DockMenu)
	dock_menu.host=host;dock_menu.hud=self;dock_menu.theme=legacy_panel.theme
	add_child(dock_menu)
	building_inspector=BuildingInspector.new();building_inspector.host=host;building_inspector.theme=legacy_panel.theme;add_child(building_inspector)
	research_screen=Control.new()
	research_screen.set_script(ResearchScreen)
	research_screen.host=host
	research_screen.theme=legacy_panel.theme
	add_child(research_screen)
	game_menu=Control.new();game_menu.set_script(GameMenu);game_menu.host=host;game_menu.hud=self;add_child(game_menu)
	journal_dialog=AcceptDialog.new();journal_dialog.title="Kuningriigi päevik";journal_dialog.theme=legacy_panel.theme
	journal_dialog.size=Vector2i(560,500);add_child(journal_dialog)
	journal_dialog.get_ok_button().text="Sulge"
	var journal_panel:=StyleBoxTexture.new();journal_panel.texture=art("ui-art-v304_panel")
	journal_panel.texture_margin_left=70;journal_panel.texture_margin_right=70;journal_panel.texture_margin_top=50;journal_panel.texture_margin_bottom=50
	journal_panel.content_margin_left=18;journal_panel.content_margin_right=18;journal_panel.content_margin_top=18;journal_panel.content_margin_bottom=18
	journal_dialog.add_theme_stylebox_override("panel",journal_panel)
	journal_text=RichTextLabel.new();journal_text.fit_content=false
	journal_text.bbcode_enabled=false;journal_dialog.add_child(journal_text)
	diplomacy_screen=AcceptDialog.new();diplomacy_screen.set_script(DiplomacyScreen);diplomacy_screen.host=host;diplomacy_screen.theme=legacy_panel.theme;add_child(diplomacy_screen)
	city_overview=AcceptDialog.new();city_overview.set_script(CityOverview);city_overview.host=host;add_child(city_overview)
	stores_panel=PanelContainer.new();stores_panel.visible=false;stores_panel.mouse_filter=Control.MOUSE_FILTER_STOP
	var stores_style:=StyleBoxTexture.new();stores_style.texture=art("ui-art-v304_panel")
	stores_style.texture_margin_left=70;stores_style.texture_margin_right=70;stores_style.texture_margin_top=50;stores_style.texture_margin_bottom=50
	stores_style.content_margin_left=18;stores_style.content_margin_right=18;stores_style.content_margin_top=14;stores_style.content_margin_bottom=18
	stores_panel.add_theme_stylebox_override("panel",stores_style);stores_panel.theme=legacy_panel.theme;add_child(stores_panel)
	stores_body=VBoxContainer.new();stores_panel.add_child(stores_body)
	tile_panel=PanelContainer.new();tile_panel.visible=false;tile_panel.mouse_filter=Control.MOUSE_FILTER_STOP
	var tile_style:=StyleBoxFlat.new();tile_style.bg_color=Color(0.04,0.12,0.17,0.95);tile_style.border_color=Color("b38e4c");tile_style.set_border_width_all(1);tile_style.set_corner_radius_all(8)
	tile_style.content_margin_left=12;tile_style.content_margin_right=12;tile_style.content_margin_top=10;tile_style.content_margin_bottom=10
	tile_panel.add_theme_stylebox_override("panel",tile_style);tile_panel.theme=legacy_panel.theme;add_child(tile_panel)
	var tile_body:=VBoxContainer.new();tile_body.add_theme_constant_override("separation",5);tile_panel.add_child(tile_body)
	tile_title=Label.new();tile_body.add_child(tile_title)
	tile_present=Label.new();tile_present.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;tile_present.add_theme_color_override("font_color",Color("a8d9a7"));tile_body.add_child(tile_present)
	tile_missing=Label.new();tile_missing.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;tile_missing.add_theme_color_override("font_color",Color("e6b184"));tile_body.add_child(tile_missing)
	get_viewport().size_changed.connect(layout)
	layout()

func art(name: String) -> Texture2D:
	return load(UI+name+".webp")

func picture(name: String, asset: String) -> TextureRect:
	var node := TextureRect.new()
	node.texture = art(asset)
	node.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	node.stretch_mode = TextureRect.STRETCH_SCALE
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(node);elements[name] = node
	return node

func text_item(name: String, content: String, font_size: int, color := Color("f5dfa3")) -> Label:
	var node := Label.new()
	node.text = content
	node.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	node.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	node.add_theme_color_override("font_color",color)
	node.set_meta("base_font_size",font_size)
	node.add_theme_font_size_override("font_size",font_size)
	if name in ["world_title","research_title","research_name","selection_name"]:node.add_theme_font_override("font",ui_bold)
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(node);elements[name] = node;labels[name] = node
	return node

func image_button(name: String, asset: String, description: String, action: Callable, enabled := true) -> TextureButton:
	var node := TextureButton.new()
	node.texture_normal = art(asset)
	node.ignore_texture_size = true
	node.stretch_mode = TextureButton.STRETCH_SCALE
	node.tooltip_text = description
	node.disabled = not enabled
	if enabled:node.pressed.connect(action)
	else:node.modulate=Color(0.58,0.58,0.58,1);node.tooltip_text += " · pole veel saadaval"
	add_child(node);elements[name] = node
	return node

func menu_box(color: Color, border: Color) -> StyleBoxFlat:
	var box:=StyleBoxFlat.new()
	box.bg_color=color;box.border_color=border
	box.set_border_width_all(1);box.set_corner_radius_all(3)
	box.content_margin_left=8;box.content_margin_right=8
	box.content_margin_top=5;box.content_margin_bottom=5
	return box

func style_menu() -> void:
	var panel:=StyleBoxTexture.new()
	panel.texture=art("ui-art-v304_panel")
	panel.texture_margin_left=70;panel.texture_margin_right=70
	panel.texture_margin_top=50;panel.texture_margin_bottom=50
	panel.content_margin_left=14;panel.content_margin_right=14
	panel.content_margin_top=14;panel.content_margin_bottom=14
	legacy_panel.add_theme_stylebox_override("panel",panel)
	var theme:=Theme.new()
	theme.default_font=ui_font
	theme.default_font_size=14
	var normal:=menu_box(Color("172b38"),Color("9c7b43"))
	var hovered:=menu_box(Color("30485a"),Color("f2d184"))
	var pressed:=menu_box(Color("544b35"),Color("edce87"))
	for kind in ["Button","OptionButton"]:
		theme.set_stylebox("normal",kind,normal)
		theme.set_stylebox("hover",kind,hovered)
		theme.set_stylebox("pressed",kind,pressed)
		theme.set_stylebox("focus",kind,StyleBoxEmpty.new())
		theme.set_color("font_color",kind,Color("f3deb1"))
		theme.set_color("font_hover_color",kind,Color("fff0cc"))
	theme.set_color("font_color","Label",Color("f3deb1"))
	theme.set_stylebox("normal","LineEdit",normal)
	theme.set_color("font_color","LineEdit",Color("f3deb1"))
	legacy_panel.theme=theme
func hotspot(name: String, description: String, action: Callable) -> void:
	var node:=Button.new()
	node.flat=true
	node.focus_mode=Control.FOCUS_ALL
	node.tooltip_text=description
	node.pressed.connect(action)
	add_child(node);elements[name]=node

func build_hud() -> void:
	picture("header","ui-art-v302_header")
	picture("brand","ui-art-v291_header_brand")
	for pair in [["gold","res_gold"],["food","res_food"],["stone","res_stone"],["population","res_population"],["science","cmd_research"]]:
		picture(pair[0]+"_icon","ui-art-v263_"+pair[1])
		text_item(pair[0]+"_value","0",18)
	text_item("world_title","Maailmakaart",26)
	text_item("clock","08:00",16)
	var hint:=text_item("status_line","",15)
	hint.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	hotspot("world_toggle","Vaheta kaardivaadet",func():host.toggle_detail())
	for key in ["gold","food","stone"]:hotspot(key+"_button","Kuningriigi varud",open_stores.bind(key))
	hotspot("population_button","Linnad ja asunikud",func():stores_panel.visible=false;dock_menu.open_menu("cities"))
	hotspot("science_button","Uurimine",open_research)
	image_button("pause","ui-art-v306_pause","Peata mäng",func():host.toggle_simulation_pause())
	image_button("settings","ui-art-v306_settings","Menüü ja mängu seaded",toggle_menu)
	picture("research_frame","ui-art-v302_research")
	image_button("research_icon","ui-art-v263_cmd_research","Uurimine",open_research)
	text_item("research_title","Avastus:",14,Color("24170c"))
	var research_name:=text_item("research_name","Vali uurimus",15,Color("24170c"))
	research_name.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	var progress:=ProgressBar.new()
	progress.show_percentage=false;progress.min_value=0;progress.max_value=100
	progress.mouse_filter=Control.MOUSE_FILTER_IGNORE
	progress.add_theme_stylebox_override("background",menu_box(Color("43351d"),Color("43351d")))
	progress.add_theme_stylebox_override("fill",menu_box(Color("c6a558"),Color("c6a558")))
	add_child(progress);elements["research_progress"]=progress
	for i in 4:
		var slot:=image_button("research_queue_"+str(i),"ui-art-v263_cmd_research","Ava uurimiste järjekord",open_research)
		var mask:=Shader.new()
		mask.code="shader_type canvas_item; void fragment(){ if (distance(UV, vec2(0.5)) > 0.43) discard; COLOR *= texture(TEXTURE, UV); }"
		var material:=ShaderMaterial.new();material.shader=mask;slot.material=material
		var plus:=Label.new();plus.text="+";plus.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER;plus.vertical_alignment=VERTICAL_ALIGNMENT_CENTER
		plus.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);plus.mouse_filter=Control.MOUSE_FILTER_IGNORE
		plus.add_theme_color_override("font_color",Color("f5d790"));plus.add_theme_color_override("font_shadow_color",Color.BLACK);plus.add_theme_constant_override("shadow_offset_y",1)
		plus.set_meta("base_font_size",25);plus.add_theme_font_size_override("font_size",25);slot.add_child(plus);elements["research_queue_plus_"+str(i)]=plus
	image_button("research_all","ui-art-v291_research_city","Kõik avastused",open_research)
	picture("footer","ui-art-v291_footer_wood")
	picture("dock_background","ui-art-v304_panel")
	picture("map_frame","ui-art-v302_minimap")
	minimap.get_parent().remove_child(minimap)
	add_child(minimap);elements["minimap"]=minimap
	minimap.circular=true
	image_button("zoom_in","ui-art-v303_map_zoom_in","Suurenda",func():change_zoom(1.0/1.15))
	image_button("zoom_out","ui-art-v303_map_zoom_out","Vähenda",func():change_zoom(1.15))
	image_button("center","ui-art-v303_map_center","Keskenda valikule",func():host.focus_selected_entity())
	image_button("layers","ui-art-v303_map_layers","Kaardi tegevused",show_map_actions)
	image_button("resource_layer","ui-art-v291_map_show","Näita või peida maardlaid",toggle_resource_layer)
	image_button("map_switch","ui-art-v263_cmd_map","Vaheta kaardivaadet",func():host.toggle_detail())
	var walk:=Button.new();walk.text="Kõnni";walk.tooltip_text="Kõnni detailkaardil esimese isiku vaates";walk.pressed.connect(func():host.fpv_walker.start());add_child(walk);elements.walk=walk
	var wall_shape:=Button.new();wall_shape.tooltip_text="Sirge või kumer müür (C)";wall_shape.pressed.connect(host.toggle_wall_shape);add_child(wall_shape);elements.wall_shape=wall_shape
	var wall_tier:=Button.new();wall_tier.tooltip_text="Palissaadi kõrgus (T)";wall_tier.pressed.connect(host.toggle_wall_tier);add_child(wall_tier);elements.wall_tier=wall_tier
	for item in [["cities","Linnad","card_cities"],["build","Ehitamine","card_build"],["armies","Armeed","card_armies"],["trade","Kaubandus","card_trade"],["diplomacy","Diplomaatia","card_diplomacy"],["journal","Päevik","card_journal"]]:
		var available: bool=item[0] in ["cities","build","armies","trade","journal","diplomacy"]
		image_button("card_"+item[0],"ui-art-v306_"+item[2],item[1],open_card.bind(item[0]),available)
	picture("selection_frame","ui-art-v302_selection")
	var info:=Button.new();info.flat=true;info.text="i";info.tooltip_text="Valitud üksuse käsud";info.add_theme_font_size_override("font_size",25)
	info.add_theme_color_override("font_color",Color("e4c477"));info.pressed.connect(show_selection_actions);add_child(info);elements.selection_info=info
	image_button("selection_menu","ui-art-v306_settings","Menüü ja mängu seaded",toggle_menu)
	var portrait:=picture("portrait","ui-art-v263_unit_settler")
	var mask:=Shader.new()
	mask.code="shader_type canvas_item; void fragment(){ if (distance(UV, vec2(0.5)) > 0.5) discard; COLOR *= texture(TEXTURE, UV); }"
	var material:=ShaderMaterial.new();material.shader=mask;portrait.material=material
	text_item("selection_name","Asunik",19,Color("24170c"))
	for i in 4:image_button("action_"+str(i),"ui-art-v303_action_focus","Valitud üksuse tegevus",context_action.bind(i))

func place(name: String, x: float, y: float, w: float, h: float) -> void:
	var node: Control = elements[name]
	node.position=Vector2(x,y)*ui_scale
	node.size=Vector2(w,h)*ui_scale

func layout() -> void:
	if elements.is_empty():return
	var viewport := get_viewport_rect().size
	ui_scale=minf(viewport.x/1672.0,viewport.y/941.0)*user_ui_scale
	var bottom:=viewport.y/ui_scale
	var right:=viewport.x/ui_scale
	place("header",0,-13,right,78)
	place("brand",0,-2,263,65)
	for row in [["gold",right*0.1663],["food",right*0.2542],["stone",right*0.3337],["population",right*0.6280],["science",right*0.7195]]:
		place(row[0]+"_icon",row[1],6,30,32)
		place(row[0]+"_value",row[1]+34,6,80,40)
	place("world_title",right*0.396,2,right*0.211,45)
	place("world_toggle",right*0.396,2,right*0.211,45)
	for row in [["gold",right*0.1663],["food",right*0.2542],["stone",right*0.3337],["population",right*0.6280],["science",right*0.7195]]:place(row[0]+"_button",row[1],6,115,40)
	place("clock",right*0.824,5,100,40)
	place("status_line",right*0.30,62,right*0.40,42)
	place("walk",265,60,90,36)
	place("wall_shape",360,60,100,36)
	place("wall_tier",465,60,105,36)
	place("pause",right*0.91,4,48,45)
	place("settings",right*0.952,4,42,43)
	place("research_frame",7,54,248,356)
	place("research_icon",65,80,135,135)
	place("research_title",46,177,170,20)
	place("research_name",42,196,178,35)
	place("research_progress",69,253,124,4)
	for i in 4:place("research_queue_"+str(i),[5.0,45.0,101.0,160.0][i],[225.0,257.0,268.0,257.0][i],54,53)
	place("research_all",205,228,47,53)
	for i in 4:
		var plus: Label=elements["research_queue_plus_"+str(i)]
		plus.add_theme_font_size_override("font_size",maxi(10,roundi(25*ui_scale)))
	place("footer",0,bottom-44,right,44)
	place("map_frame",0,bottom-401,344,376)
	place("minimap",28.2,bottom-307.4,232,232)
	place("zoom_in",115,bottom-378,62,64)
	place("zoom_out",172,bottom-367,62,64)
	place("center",230,bottom-341,62,64)
	place("layers",267,bottom-281,62,64)
	place("resource_layer",267,bottom-209,62,64)
	place("map_switch",26,bottom-375,73,72)
	var left:=354.0;var available:=maxf(0.0,right-354.0-374.0);var gap:=8.0
	var card_width: float=maxf(1.0,(available-gap*5.0)/6.0)
	place("dock_background",312,bottom-70-card_width*1.5,maxf(0,right-649),card_width*1.5+28)
	for i in 6:
		var key: String=["cities","build","armies","trade","diplomacy","journal"][i]
		place("card_"+key,left+i*(card_width+gap),bottom-56-card_width*1.5,card_width,card_width*1.5)
	place("selection_frame",right-384,bottom-408,384,386)
	place("selection_info",right-180,bottom-385,63,62)
	place("selection_menu",right-111,bottom-389,65,69)
	place("portrait",right-273,bottom-311,226,185)
	place("selection_name",right-273,bottom-128,226,47)
	place("action_0",right-363,bottom-281,77,77)
	place("action_1",right-323,bottom-343,77,77)
	place("action_2",right-259,bottom-383,77,77)
	place("action_3",right-363,bottom-200,77,77)
	for label in labels.values():
		label.add_theme_font_size_override("font_size",maxi(9,roundi(float(label.get_meta("base_font_size"))*ui_scale)))
	if dock_menu!=null:dock_menu.set_geometry(Vector2(left,bottom-56-card_width*1.5)*ui_scale,Vector2(available,card_width*1.5)*ui_scale,Vector2(card_width,card_width*1.5)*ui_scale)
	if stores_panel!=null and stores_panel.visible:position_stores()
	if tile_panel!=null:
		var tile_width:=minf(340.0*ui_scale,maxf(180.0,viewport.x*0.40))
		tile_panel.position=Vector2(viewport.x-tile_width-10.0,60.0*ui_scale);tile_panel.custom_minimum_size=Vector2(tile_width,0);tile_panel.size=Vector2(tile_width,0)
		if tile_present!=null:tile_present.custom_minimum_size.x=tile_width-25
		if tile_missing!=null:tile_missing.custom_minimum_size.x=tile_width-25

func toggle_resource_layer() -> void:
	var automatic: bool=host.selected_entity=="settler" and (not host.city_created or host.settler_mode)
	if automatic:resource_details_open=not resource_details_open
	else:
		resource_overlay.toggle_manual();resource_details_open=resource_overlay.manual
	refresh_tile_resources()

func refresh_tile_resources() -> void:
	if tile_panel==null:return
	var position: Vector2i=host.selected if host.selected.x>=0 and host.selected.y>=0 else host.player
	if host.detail_mode and not host.detail_inspection:position=host.player
	var key:=str(position.x)+":"+str(position.y)
	var show: bool=resource_overlay.manual or (host.selected_entity=="settler" and (not host.city_created or host.settler_mode))
	tile_panel.visible=resource_details_open and show and host.battle_view==null and (host.reveal_all or host.game.explored[0].has(key))
	if not tile_panel.visible:return
	var cell: Dictionary=host.grid[position.y*host.Grid.COLS+position.x]
	if cell.land:host.city_cell_data({"c":position.x,"r":position.y})
	var existing:=PackedStringArray();var missing:=PackedStringArray()
	var names: Dictionary={"wood":"Mets","stone":"Kivi","water":"Magevesi","grain":"Viljakas maa","game":"Ulukid","fish":"Kala","clay":"Savi","copper":"Vasemaak","tin":"Tinamaak","ore":"Rauamaak","oil":"Naftamaardla"}
	for resource in cell.get("deposits",{}):
		if cell.deposits[resource] and (resource!="oil" or "oil_drilling" in host.game.research[0].known):existing.append(str(names.get(resource,Economy.DATA.data.resource_names.get(resource,resource))))
	for resource in ["wood","stone","water","grain","game","fish"]:
		if not cell.get("deposits",{}).get(resource,false):missing.append(names[resource])
	tile_title.text="Ruut %d:%d · ressursid" % [position.x+1,position.y+1]
	tile_present.text="Olemas: "+(", ".join(existing) if not existing.is_empty() else "—")
	tile_missing.text="Ruudul puudub: "+(", ".join(missing) if not missing.is_empty() else "—")

func open_stores(kind: String) -> void:
	if stores_panel.visible and stores_kind==kind:stores_panel.visible=false;return
	stores_kind=kind;stores_panel.visible=true;refresh_stores();position_stores()

func position_stores() -> void:
	var anchor: Control=elements[stores_kind+"_button"]
	var width:=maxf(220.0,300.0*ui_scale)
	stores_panel.position=Vector2(clampf(anchor.position.x,8.0,maxf(8.0,get_viewport_rect().size.x-width-8.0)),anchor.position.y+anchor.size.y+6.0)
	stores_panel.custom_minimum_size=Vector2(width,0)
	stores_panel.size=Vector2(width,0)

func refresh_stores() -> void:
	for child in stores_body.get_children():stores_body.remove_child(child);child.queue_free()
	var header:=HBoxContainer.new();stores_body.add_child(header)
	var title:=Label.new();title.text="Kuningriigi varud";title.size_flags_horizontal=Control.SIZE_EXPAND_FILL;title.add_theme_font_size_override("font_size",maxi(12,roundi(19*ui_scale)));header.add_child(title)
	var close:=Button.new();close.text="×";close.pressed.connect(func():stores_panel.visible=false);header.add_child(close)
	var keys: Array=["bread","water","grain","fish","meat","flour"] if stores_kind=="food" else ["gold","pottery","cloth","wine","jewelry","spices"] if stores_kind=="gold" else ["wood","stone","plank","clay","cutstone","ore","iron","bronze","steel"]
	var stock: Dictionary={}
	if host.city_created:stock=host.game.cities[host.active_city_index].economy.realms[0].resources
	for key in keys:
		if key not in ["bread","water","wood","stone","plank","gold"] and float(stock.get(key,0))<=0:continue
		var row:=HBoxContainer.new();row.add_theme_constant_override("separation",7);stores_body.add_child(row)
		var image:=TextureRect.new();image.custom_minimum_size=Vector2.ONE*maxf(22.0,28.0*ui_scale);image.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;image.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		var art_key: String={"bread":"food","ore":"iron"}.get(key,key)
		var path: String=UI+"ui-art-v263_res_"+art_key+".webp"
		if not ResourceLoader.exists(path):
			var technology: String={"cloth":"guilds","wine":"commerce","jewelry":"bronze_crafts","spices":"city_trade","steel":"steelmaking"}.get(key,"")
			if not technology.is_empty():path=UI+"tech/"+technology+".webp"
		if ResourceLoader.exists(path):image.texture=load(path)
		row.add_child(image)
		var label:=Label.new();label.text="Toit" if key=="bread" else str(Economy.DATA.data.resource_names.get(key,key));label.size_flags_horizontal=Control.SIZE_EXPAND_FILL;row.add_child(label)
		var value:=Label.new()
		var amount:=CityNeeds.food_total(stock) if key=="bread" else float(stock.get(key,100 if key=="wood" else 55 if key=="stone" else 0))
		if not host.city_created and key=="bread":amount=40
		value.text=str(floori(amount));row.add_child(value)
	legacy_panel.position=Vector2(260,77)*ui_scale
	legacy_panel.size.x=430*ui_scale

func set_user_ui_scale(value: float) -> void:
	user_ui_scale=clampf(value,0.7,1.5)
	var settings:=ConfigFile.new();settings.load(SETTINGS_PATH)
	settings.set_value("interface","scale",user_ui_scale);settings.save(SETTINGS_PATH)
	layout()

func context_action(index: int) -> void:
	if host.detail_inspection and host.detail_district.is_empty() and host.selected_entity!="detail_unit":
		match index:
			0:host.toggle_detail()
			1:open_research()
			2:dock_menu.open_menu("journal")
			3:dock_menu.open_menu("diplomacy")
		return
	match host.selected_entity:
		"detail_unit":
			match index:
				0:host.detail_unit_order=true;host.update_status("Vali üksusele sihtkoht.")
				1:dock_menu.open_menu("armies")
				2:host.stop_detail_unit()
				3:host.focus_selected_entity()
		"building":
			match index:
				0:building_inspector.show_selected()
				1:dock_menu.open_menu("build")
				2:host.show_basic_labor()
				3:host.focus_selected_entity()
		"city":
			match index:
				0:dock_menu.open_menu("city")
				1:dock_menu.open_menu("build")
				2:host.show_training()
				3:dock_menu.open_menu("trade")
		"ship":
			match index:
				0:host.begin_ship_order()
				1:host.embark_ship("settler")
				2:host.embark_ship("army")
				3:host.stop_selected_ship()
		"merchant":
			match index:
				0:dock_menu.open_menu("trade")
				1:host.toggle_detail()
				2:dock_menu.open_menu("journal")
				3:host.focus_selected_entity()
		"army":
			match index:
				0:host.begin_army_order()
				1:
					if host.selected_army()!=null and WorldDiscoveries.army_has_scout(host.game,host.selected_army()):host.toggle_auto_explore()
					else:dock_menu.open_menu("armies")
				2:host.stop_selected_army()
				3:host.focus_selected_entity()
		_:
			match index:
				0:host.begin_settler_order()
				1:
					if not host.detail_mode:
						host.toggle_detail()
						if host.detail_mode:host.update_status("Vali detailkaardil linnakoht.")
					else:host.select_city_site()
				2:toggle_resource_layer()
				3:host.stop_selected_settler()

func update_context_actions() -> void:
	var specs: Array=[]
	var selection: String="inspection" if host.detail_inspection and host.detail_district.is_empty() and host.selected_entity!="detail_unit" else host.selected_entity
	match selection:
		"inspection":specs=[["ui-art-v263_cmd_map","Vaheta kaarti",true],["ui-art-v263_cmd_research","Avastused",true],["ui-art-v263_cmd_city","Sündmused",true],["ui-art-v263_cmd_city","Diplomaatia",true]]
		"detail_unit":specs=[["ui-art-v303_action_move","Liigu",true],["ui-art-v263_cmd_army","Armeed",true],["ui-art-v303_action_stop","Peata",true],["ui-art-v303_action_focus","Keskenda",true]]
		"building":specs=[["ui-art-v263_cmd_city","Hoone teave",true],["ui-art-v263_cmd_build","Ehitamine",true],["ui-art-v263_unit_worker","Töölised",true],["ui-art-v303_action_focus","Keskenda",true]]
		"city":specs=[["ui-art-v263_cmd_city","Linna ülevaade",true],["ui-art-v263_cmd_build","Ehita",true],["ui-art-v263_cmd_army","Värba",true],["ui-art-v263_res_gold","Kaubandus",true]]
		"ship":specs=[["ui-art-v303_action_move","Sõida või maabu",true],["ui-art-v263_unit_settler","Laadi asunik",true],["ui-art-v263_cmd_army","Laadi armee",true],["ui-art-v303_action_stop","Peata",true]]
		"merchant":specs=[["ui-art-v263_res_gold","Kaubandus",true],["ui-art-v263_cmd_map","Kaart",true],["ui-art-v263_cmd_city","Sündmused",true],["ui-art-v303_action_focus","Keskenda",true]]
		"army":
			var scout: bool=host.selected_army()!=null and WorldDiscoveries.army_has_scout(host.game,host.selected_army())
			specs=[["ui-art-v303_action_move","Liigu",true],["ui-art-v263_cmd_explore" if scout else "ui-art-v263_cmd_army","Peata automaatne avastamine" if scout and host.selected_army().get("autoExplore",false) else "Automaatne avastamine" if scout else "Armeed",true],["ui-art-v303_action_stop","Peata",true],["ui-art-v303_action_focus","Keskenda",true]]
		_:specs=[["ui-art-v303_action_move","Liigu",true],["ui-art-v263_cmd_build","Vali linnakoht",true],["ui-art-v263_res_wood","Ressursid",true],["ui-art-v303_action_stop","Peata",true]]
	for i in 4:
		var button: TextureButton=elements["action_"+str(i)]
		var path: String=UI+str(specs[i][0])+".webp"
		if button.texture_normal.resource_path!=path:button.texture_normal=load(path)
		button.tooltip_text=str(specs[i][1])+(" · pole veel saadaval" if not specs[i][2] else "")
		button.disabled=not specs[i][2]
		button.modulate=Color.WHITE if specs[i][2] else Color(0.58,0.58,0.58,1)
func show_map_actions() -> void:
	map_actions.position=Vector2i(get_viewport().get_mouse_position())
	map_actions.reset_size()
	map_actions.popup()

func show_selection_actions() -> void:
	selection_actions.clear()
	for i in 4:
		var button: TextureButton=elements["action_"+str(i)]
		selection_actions.add_item(button.tooltip_text,i)
		selection_actions.set_item_disabled(i,button.disabled)
	selection_actions.position=Vector2i(get_viewport().get_mouse_position());selection_actions.reset_size();selection_actions.popup()

func map_action(id: int) -> void:
	match id:
		0:toggle_resource_layer()
		1:host.toggle_fog()
		2:host.select_player_settler()
		3:
			if host.city_created:
				host.switch_city(host.city_select.selected)
				if not host.detail_mode:host.toggle_detail()
			else:
				host.select_player_settler()
				if not host.detail_mode:host.toggle_detail()
		4:host.begin_army_order()
		5:host.open_selected_tile()
		6:dock_menu.open_menu("cities")
		7:
			host.refresh_army_options()
			if host.army_select.item_count>0:host.select_army_for_ui(0)
			else:host.update_status("Värba esmalt sõdalasi.")
		8:host.toggle_auto_explore()
		9:open_visible_rival()
		10:host.fpv_walker.start()

func open_visible_rival() -> void:
	var target: Variant=null
	for city in host.game.cities:
		if int(city.team)!=0 and Campaign.visible_now(host.game,0,city):target=city;break
	if target==null:
		for person in host.game.settlers:
			if int(person.team)!=0 and Campaign.visible_now(host.game,0,person):target=person;break
	if target==null:host.update_status("Vastast pole veel avastatud. Saada avastaja.");return
	if host.detail_mode:host.toggle_detail()
	host.selected=Vector2i(int(target.c),int(target.r));host.open_selected_tile()

func open_research() -> void:
	legacy_panel.visible=false
	stores_panel.visible=false
	research_screen.open_screen()

func toggle_menu() -> void:
	stores_panel.visible=false
	if game_menu.visible:game_menu.close_menu()
	else:game_menu.open_menu()

func set_main_cards_visible(value: bool) -> void:
	for key in ["cities","build","armies","trade","diplomacy","journal"]:elements["card_"+key].visible=value

func open_card(kind: String) -> void:
	stores_panel.visible=false
	dock_menu.open_menu(kind)

func open_city_overview() -> void:
	city_overview.open_screen()

func show_journal() -> void:
	var events: Array=host.game.get("events",[]).duplicate(true)
	for city in host.game.get("cities",[]):
		if int(city.team)!=0:continue
		for event in city.economy.realms[0].get("log",[]):
			events.append({"time":float(event.get("time",0))+float(city.get("foundedAt",0)),"text":str(city.name)+" · "+str(event.get("text",""))})
	events.sort_custom(func(a,b):return float(a.get("time",0))>float(b.get("time",0)))
	var lines:=PackedStringArray()
	for i in mini(60,events.size()):lines.append("Käik %d · %s" % [floori(float(events[i].get("time",0))/60.0)+1,str(events[i].get("text",""))])
	journal_text.text="\n\n".join(lines) if not lines.is_empty() else "Sündmusi veel ei ole."
	var viewport_size:=get_viewport_rect().size
	journal_text.custom_minimum_size=Vector2(maxf(180,minf(500,viewport_size.x-90)),maxf(150,minf(420,viewport_size.y-120)))
	journal_dialog.popup_centered();host.fit_game_dialog(journal_dialog,Vector2i(560,500))

func change_zoom(factor: float) -> void:
	host.zoom=clampf(host.zoom*factor,4.9 if not host.detail_mode else 21.1,294.6 if not host.detail_mode else 430.5)
	host.update_camera()

func _process(delta: float) -> void:
	if host==null or host.game.is_empty() or labels.is_empty():return
	elements.walk.visible=host.detail_mode and host.battle_view==null
	elements.wall_shape.visible=host.wall_drawing_active();elements.wall_shape.text="Kumer" if host.wall_shape=="curved" else "Sirge"
	elements.wall_tier.visible=host.wall_drawing_active() and host.build_select.get_item_metadata(host.build_select.selected)=="palisade";elements.wall_tier.text="Tase %d" % host.wall_tier
	tile_clock+=delta
	if tile_clock>=0.4:tile_clock=0.0;refresh_tile_resources()
	if stores_panel!=null and stores_panel.visible:
		stores_clock+=delta
		if stores_clock>=1.0:stores_clock=0.0;refresh_stores();position_stores()
	var stock: Dictionary={}
	var pop:=0.0
	if host.city_created and not host.game.cities.is_empty():
		var realm: Dictionary=host.game.cities[host.active_city_index].economy.realms[0]
		stock=realm.resources
		for city in host.game.cities:
			if int(city.team)==0:pop+=float(city.economy.realms[0].pop)
	labels.gold_value.text=str(floori(float(stock.get("gold",0))))
	labels.food_value.text=str(floori(CityNeeds.food_total(stock)) if host.city_created else 40)
	labels.stone_value.text=str(floori(float(stock.get("stone",0))) if host.city_created else 55)
	labels.population_value.text=str(floori(pop))
	labels.science_value.text="%.1f" % ResearchRules.science_rate(host.game,0)
	labels.world_title.text="Detailkaart" if host.detail_mode else "Maailmakaart"
	labels.status_line.text=host.status.text
	if host.migration_active():labels.status_line.text+=" · Rahvasteränne %d s" % maxi(0,ceili(float(host.game.migrationV274.until)-host.elapsed))
	var minutes:=int(host.elapsed)
	labels.clock.text="K%d · %02d:%02d" % [1+minutes/60,(8+minutes/60)%24,minutes%60]
	var research: Dictionary=host.game.research[0]
	var active: String=str(research.get("active",""))
	labels.research_name.text=str(ResearchRules.DATA.data.techs.get(active,{}).get("name","Vali uurimus"))
	var queue: Array=research.get("queue",[])
	var stamp: String=active+":"+str(queue)
	if stamp!=last_research_art:
		last_research_art=stamp
		var tech_path: String=UI+"tech/"+active+".webp"
		var icon: TextureButton=elements.research_icon
		var selected_path: String=tech_path if ResourceLoader.exists(tech_path) else UI+"ui-art-v263_cmd_research.webp"
		if icon.texture_normal.resource_path != selected_path:icon.texture_normal=load(selected_path)
		for i in 4:
			var button: TextureButton=elements["research_queue_"+str(i)]
			var id: String=str(queue[i]) if i<queue.size() else ""
			var path: String=UI+"tech/"+id+".webp"
			var next_path: String=path if not id.is_empty() and ResourceLoader.exists(path) else UI+"ui-art-v263_cmd_research.webp"
			if button.texture_normal.resource_path != next_path:button.texture_normal=load(next_path)
			button.self_modulate=Color(1,1,1,0.65) if id.is_empty() else Color.WHITE
			var plus: Label=elements["research_queue_plus_"+str(i)];plus.visible=id.is_empty()
			button.tooltip_text=str(ResearchRules.DATA.data.techs.get(id,{}).get("name","Lisa uurimus"))
	var progress: ProgressBar=elements.research_progress
	var tech: Dictionary=ResearchRules.DATA.data.techs.get(active,{})
	progress.value=100.0*float(research.progress.get(active,0))/maxf(1.0,ResearchRules.research_cost(host.game,tech)) if not tech.is_empty() else 0
	if host.selected_entity=="detail_unit" and (host.detail_unit_source<0 or host.detail_unit_source>=host.game.units.size() or float(host.game.units[host.detail_unit_source].get("hp",0))<=0):host.detail_unit_source=-1;host.selected_entity="city" if host.city_created else "settler"
	if host.selected_entity=="ship" and host.selected_ship()==null:host.selected_entity="city" if host.city_created and not host.settler_mode else "settler"
	if host.selected_entity=="merchant" and host.selected_merchant()==null:host.selected_entity="city" if host.city_created and not host.settler_mode else "settler"
	if host.selected_entity=="army" and host.selected_army()==null:host.selected_entity="city" if host.city_created and not host.settler_mode else "settler"
	if host.selected_entity=="building" and building_inspector.selected()==null:host.selected_entity="city" if host.city_created and not host.settler_mode else "settler"
	var local_selected: bool=host.selected_entity=="detail_unit" and host.detail_unit_source>=0 and host.detail_unit_source<host.game.units.size()
	var city_selected: bool=host.selected_entity=="city" and host.city_created
	var building_selected: bool=host.selected_entity=="building" and building_inspector.selected()!=null
	var building: Variant=building_inspector.selected() if building_selected else null
	var army_selected: bool=host.selected_entity=="army"
	var merchant_selected: bool=host.selected_entity=="merchant"
	var ship_selected: bool=host.selected_entity=="ship"
	var army: Variant=host.selected_army() if army_selected else null
	labels.selection_name.text=str(Economy.DATA.data.troops.get(host.game.units[host.detail_unit_source].kind,{}).get("name",host.game.units[host.detail_unit_source].kind)) if local_selected else "Kaardiruut" if host.detail_inspection and host.detail_district.is_empty() else str(Economy.DATA.data.buildings.get(building.type,{}).get("name",building.type)) if building_selected else str(host.game.cities[host.active_city_index].name) if city_selected else "Vägi %d" % (int(army.get("id",0))+1) if army_selected else "Kaupmees" if merchant_selected else str(NavalRules.SHIPS.data[host.selected_ship().kind].name) if ship_selected else "Asunik"
	var portrait: TextureRect=elements.portrait
	var desired: String="ui-art-v263_unit_scout" if local_selected else "ui-art-v263_cmd_map" if host.detail_inspection and host.detail_district.is_empty() else "ui-art-v263_bld_"+str(building.type) if building_selected else "ui-art-v263_cmd_city" if city_selected else "ui-art-v263_unit_scout" if army_selected else "ui-art-v263_res_gold" if merchant_selected else "ui-art-v263_cmd_map" if ship_selected else "ui-art-v263_unit_settler"
	if not ResourceLoader.exists(UI+desired+".webp"):desired="ui-art-v263_cmd_city"
	if portrait.texture.resource_path != UI+desired+".webp":portrait.texture=art(desired)
	update_context_actions()
	var pause_button: TextureButton=elements.pause
	var pause_art: String="ui-art-v306_play" if host.simulation_paused else "ui-art-v306_pause"
	if pause_button.texture_normal.resource_path != UI+pause_art+".webp":pause_button.texture_normal=art(pause_art)
