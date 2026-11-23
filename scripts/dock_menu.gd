extends Control

const Economy=preload("res://scripts/economy_rules.gd")
const CityRules=preload("res://scripts/city_build_rules.gd")
const Research=preload("res://scripts/research_rules.gd")
const Discoveries=preload("res://scripts/world_discoveries.gd")
const Diplomacy=preload("res://scripts/diplomacy_rules.gd")
const Availability=preload("res://scripts/era_availability.gd")
const CityOverview=preload("res://scripts/city_overview.gd")
const BUILD_ORDER=preload("res://data/build_catalog_order.json")
const UI:="res://assets/ui/"
const CATEGORIES:=[["all","Kõik"],["housing","Elamud"],["food","Toit"],["resources","Tootmine"],["military","Kaitse"],["science","Teadus"],["services","Taristu"]]
const CATEGORY_TYPES:={
	"housing":"house well warehouse cellar market",
	"food":"hunter fisher farm field pasture mill bakery watermill windmill",
	"resources":"lumber forester saw quarry mason claypit pottery_kiln mine coal smelter smith coppermine tinmine bronze_foundry steelworks oilwell refinery nitrate powdermill engineworks master_workshop",
	"military":"barracks archery crossbow_range stable armorer armor_workshop palisade watchtower stonewall stonetower reinforced_wall gatehouse castle keep siegeworkshop harbor",
	"science":"library school public_school high_school study scriptorium academy university printer observatory monastery chapel polytechnic laboratory",
	"services":"bridge road_depot cartwright guildhall trade_yard tavern inn infirmary railstation powerplant autofactory airfield"
}
var host: Node
var hud: Control
var kind: String=""
var back: Button
var tall_back: Button
var tall_surface: Panel
var scroller: ScrollContainer
var row: HBoxContainer
var search: LineEdit
var card_size:=Vector2(150,225)
var refreshing:=false
var last_stamp: String=""
var refresh_clock:=0.0
var selected_village_id: String=""
var build_category: String="all"
var category_bar: VBoxContainer
var base_position:=Vector2.ZERO
var base_dimensions:=Vector2.ZERO
var diplomacy_feedback: String=""
var page_previous: Button
var page_next: Button
var page_tween: Tween
var embedded_overview: AcceptDialog
var overview_title: Label
var overview_resources: Label
var overview_research: Label
var overview_city_id: int=-1

func _ready() -> void:
	mouse_filter=Control.MOUSE_FILTER_IGNORE
	visible=false
	back=make_card("Tagasi","cmd_map","",func():close_menu())
	add_child(back)
	tall_back=Button.new();tall_back.text="← Tagasi";tall_back.visible=false;tall_back.pressed.connect(close_menu);add_child(tall_back)
	var tall_style:=StyleBoxFlat.new();tall_style.bg_color=Color("182f40");tall_style.border_color=Color("b38e4c");tall_style.set_border_width_all(1);tall_style.set_corner_radius_all(10)
	var tall_hover:=tall_style.duplicate();tall_hover.bg_color=Color("294457")
	tall_back.add_theme_stylebox_override("normal",tall_style);tall_back.add_theme_stylebox_override("hover",tall_hover);tall_back.add_theme_stylebox_override("pressed",tall_hover)
	tall_back.add_theme_color_override("font_color",Color("f3d997"));tall_back.add_theme_font_override("font",hud.ui_bold)
	tall_surface=Panel.new();tall_surface.visible=false;tall_surface.mouse_filter=Control.MOUSE_FILTER_IGNORE
	var background:=StyleBoxFlat.new();background.bg_color=Color(0.063,0.133,0.208,0.96);background.border_color=Color("b38e4c");background.set_border_width_all(1);background.set_corner_radius_all(10)
	tall_surface.add_theme_stylebox_override("panel",background);add_child(tall_surface)
	scroller=ScrollContainer.new()
	scroller.vertical_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED
	scroller.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_AUTO
	add_child(scroller)
	row=HBoxContainer.new();row.add_theme_constant_override("separation",6)
	scroller.add_child(row)
	page_previous=make_page_button("‹","Eelmised ehitised",-1);add_child(page_previous)
	page_next=make_page_button("›","Järgmised ehitised",1);add_child(page_next)
	var bar:=scroller.get_h_scroll_bar()
	bar.changed.connect(update_paging);bar.value_changed.connect(func(_value):update_paging())
	scroller.resized.connect(update_paging)

func make_page_button(label: String,tooltip: String,direction: int) -> Button:
	var button:=Button.new();button.text=label;button.tooltip_text=tooltip;button.focus_mode=Control.FOCUS_ALL
	button.visible=false;button.pressed.connect(page_buildings.bind(direction))
	var normal:=StyleBoxFlat.new();normal.bg_color=Color("183043");normal.border_color=Color("be9854");normal.set_border_width_all(2);normal.set_corner_radius_all(8)
	var hover:=normal.duplicate();hover.bg_color=Color("365267");hover.border_color=Color("f3d997")
	var disabled:=normal.duplicate();disabled.bg_color=Color(0.09,0.15,0.2,0.32);disabled.border_color=Color(0.75,0.60,0.33,0.30)
	button.add_theme_stylebox_override("normal",normal);button.add_theme_stylebox_override("hover",hover);button.add_theme_stylebox_override("pressed",hover);button.add_theme_stylebox_override("disabled",disabled)
	button.add_theme_color_override("font_color",Color("f3d997"));button.add_theme_color_override("font_disabled_color",Color(0.95,0.85,0.59,0.30))
	if hud!=null and hud.ui_bold!=null:button.add_theme_font_override("font",hud.ui_bold)
	return button

func update_paging() -> void:
	if page_previous==null or page_next==null:return
	var bar:=scroller.get_h_scroll_bar()
	var overflow:=bar.max_value-bar.page>2.0
	var show: bool=visible and kind=="build" and overflow
	page_previous.visible=show;page_next.visible=show
	if not show:return
	page_previous.disabled=bar.value<=2.0
	page_next.disabled=bar.value+bar.page>=bar.max_value-2.0

func page_buildings(direction: int) -> void:
	var bar:=scroller.get_h_scroll_bar()
	var distance:=maxf(scroller.size.x*0.8,card_size.x*0.8)
	var target:=clampf(float(scroller.scroll_horizontal)+direction*distance,0,maxf(0,bar.max_value-bar.page))
	if page_tween!=null and page_tween.is_valid():page_tween.kill()
	page_tween=create_tween();page_tween.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	page_tween.tween_property(scroller,"scroll_horizontal",roundi(target),0.25)

func set_geometry(pos: Vector2,dimensions: Vector2,card: Vector2) -> void:
	base_position=pos;base_dimensions=dimensions;card_size=card
	var tall: bool=visible and kind in ["diplomacy","trade"]
	var height:=minf(card.y*3.0,maxf(card.y,pos.y+card.y-85.0)) if tall else card.y
	position=pos-Vector2(0,height-card.y);size=Vector2(dimensions.x,height)
	back.visible=not tall;tall_back.visible=tall
	back.position=Vector2(0,height-card.y);back.custom_minimum_size=card_size;back.size=card_size
	var back_width:=maxf(64,card_size.x*0.75) if tall else card_size.x
	tall_back.position=Vector2.ZERO;tall_back.size=Vector2(back_width,height)
	tall_back.add_theme_font_size_override("font_size",maxi(11,roundi(card.x*0.11)))
	tall_surface.visible=tall;tall_surface.position=Vector2(back_width+6,0);tall_surface.size=Vector2(maxf(0,size.x-back_width-6),size.y)
	var inset:=12.0 if tall else 0.0
	scroller.position=Vector2(back_width+6+inset,inset)
	scroller.size=Vector2(maxf(0,size.x-back_width-6-inset*2),maxf(0,size.y-inset*2))
	row.add_theme_constant_override("separation",12 if tall else 6)
	var paging_size:=Vector2(maxf(24.0,card.x*0.28),maxf(34.0,card.y*0.32))
	page_previous.position=Vector2(scroller.position.x+4,(height-paging_size.y)*0.5);page_previous.size=paging_size
	page_next.position=Vector2(size.x-paging_size.x-4,(height-paging_size.y)*0.5);page_next.size=paging_size
	var font_size:=maxi(15,roundi(card.x*0.24));page_previous.add_theme_font_size_override("font_size",font_size);page_next.add_theme_font_size_override("font_size",font_size)
	update_paging()
	if visible:rebuild()

func open_menu(mode: String) -> void:
	if not host.city_created and mode not in ["armies","cities","diplomacy","journal","trade"]:
		host.update_status("Raja esmalt linn.");return
	if mode=="build":
		if host.detail_inspection and host.detail_district.is_empty():host.update_status("Ava ehitamiseks oma linn.");return
		if host.settler_mode:host.update_status("Vali esmalt linn.");return
	if mode!=kind and search!=null:search.text=""
	if mode=="diplomacy" and kind!="diplomacy":diplomacy_feedback=""
	kind=mode;visible=true;last_stamp=""
	hud.set_main_cards_visible(false)
	hud.legacy_panel.visible=false
	set_geometry(base_position,base_dimensions,card_size)

func close_menu() -> void:
	release_labor()
	visible=false;kind="";host.cancel_build_placement()
	update_paging()
	hud.set_main_cards_visible(true)

func _unhandled_key_input(event: InputEvent) -> void:
	if visible and not host.build_placement_mode and event is InputEventKey and event.pressed and event.keycode==KEY_ESCAPE:
		close_menu();get_viewport().set_input_as_handled()
func _process(delta: float) -> void:
	if not visible:return
	if (not host.city_created and kind not in ["armies","cities","diplomacy","journal","trade"]) or (kind=="build" and (host.settler_mode or (host.detail_inspection and host.detail_district.is_empty()))):
		close_menu();return
	refresh_clock+=delta
	if refresh_clock<1.0:return
	refresh_clock=0
	var city: Dictionary=host.game.cities[host.active_city_index] if host.city_created else {}
	if kind=="labor" and not city.is_empty():
		host.refresh_basic_labor();return
	if kind=="city" and not city.is_empty() and is_instance_valid(embedded_overview):
		if int(city.id)!=overview_city_id:rebuild()
		else:refresh_city_overview(city)
		return
	var stock: Dictionary=city.economy.realms[0].resources if not city.is_empty() else {}
	var stamp:=str(city.get("id",-1))+":"+str(stock)+":"+str(host.game.research[0].known)+":"+str(host.game.research[0].active)+":"+str(host.game.ages[0])+":"+str(host.game.armies.size())+":"+str(host.game.settlers)+":"+str(host.game.get("visionRevision",0))
	if kind=="diplomacy":stamp+=str(host.game.get("relations",{}))+str(host.game.cities.map(func(c):return [c.team,c.economy.realms[c.team].pop]))
	elif kind=="journal":stamp+=str(host.game.get("events",[]).size())
	if stamp!=last_stamp:
		last_stamp=stamp
		if search==null or not search.has_focus():rebuild()

func clear_row() -> void:
	release_labor()
	for child in row.get_children():row.remove_child(child);child.queue_free()
	search=null;category_bar=null
	embedded_overview=null;overview_title=null;overview_resources=null;overview_research=null;overview_city_id=-1

func rebuild() -> void:
	if refreshing or not visible:return
	refreshing=true
	var scroll_x:=scroller.scroll_horizontal
	var filter: String=search.text if search!=null else ""
	clear_row()
	match kind:
		"cities":populate_cities(filter)
		"city":populate_city_overview()
		"labor":populate_labor()
		"build":populate_buildings(filter)
		"armies":populate_armies(filter)
		"trade":populate_villages()
		"village_trade":populate_village_offers()
		"diplomacy":populate_diplomacy()
		"journal":populate_journal()
	scroller.set_deferred("scroll_horizontal",scroll_x)
	call_deferred("update_paging")
	refreshing=false

func release_labor() -> void:
	if is_instance_valid(host.labor_scroll) and host.labor_scroll.get_parent()!=host.labor_dialog:
		host.labor_scroll.reparent(host.labor_dialog)

func populate_labor() -> void:
	var holder:=Control.new();holder.custom_minimum_size=Vector2(maxf(180,scroller.size.x-2),card_size.y);row.add_child(holder)
	host.labor_scroll.reparent(holder);host.labor_scroll.custom_minimum_size=Vector2.ZERO
	host.labor_scroll.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	host.labor_structure_stamp="";host.refresh_basic_labor()

func building_category(type: String) -> String:
	for category in CATEGORY_TYPES:
		if type in str(CATEGORY_TYPES[category]).split(" "):return category
	return "services"

func available_buildings(city: Dictionary) -> Array:
	var indices: Dictionary={};var result: Array=[]
	for i in host.build_select.item_count:indices[str(host.build_select.get_item_metadata(i))]=i
	var team:=int(city.team);var known: Array=host.game.research[team].known;var age:=int(host.game.ages[team])
	for type in BUILD_ORDER.data:
		if type=="hall" or not indices.has(type):continue
		if int(CityRules.DATA.data.age.get(type,9))>age:continue
		var tech: String=Research.DATA.data.build_tech.get(type,"")
		if not tech.is_empty() and tech not in known:continue
		if Availability.building_successor(host.game,team,type)!=null:continue
		result.append(indices[type])
	return result

func rebuild_categories(available: Array) -> void:
	for child in category_bar.get_children():category_bar.remove_child(child);child.queue_free()
	var counts: Dictionary={"all":available.size()}
	for i in available:
		var category:=building_category(str(host.build_select.get_item_metadata(i)))
		counts[category]=int(counts.get(category,0))+1
	for entry in CATEGORIES:
		var id: String=entry[0];var count:=int(counts.get(id,0))
		if count==0:continue
		var button:=Button.new();button.text=str(entry[1])+" "+str(count)
		button.toggle_mode=true;button.button_pressed=build_category==id;button.focus_mode=Control.FOCUS_NONE
		button.size_flags_horizontal=Control.SIZE_EXPAND_FILL
		button.custom_minimum_size.y=maxf(14.0,card_size.y*0.083)
		button.add_theme_font_size_override("font_size",maxi(7,roundi(card_size.x*0.085)))
		button.pressed.connect(select_build_category.bind(id));category_bar.add_child(button)

func select_build_category(id: String) -> void:
	build_category=id;scroller.scroll_horizontal=0;rebuild()

func make_card(title: String,art_name: String,subtitle: String,action: Callable,enabled:=true,compact:=false) -> Button:
	var dimensions:=Vector2(maxf(55.0,card_size.x/2.0),maxf(38.0,(card_size.y-6.0)/2.0)) if compact else card_size
	var button:=Button.new();button.flat=true;button.custom_minimum_size=dimensions;button.size=dimensions
	button.tooltip_text=title+(" · "+subtitle if not subtitle.is_empty() else "")
	button.disabled=not enabled
	if enabled:button.pressed.connect(action)
	var image:=TextureRect.new()
	var path:=UI+"ui-art-v263_"+art_name+".webp"
	if art_name.begins_with("tech/"):path=UI+art_name+".webp"
	if ResourceLoader.exists(path):image.texture=load(path)
	image.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;image.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_COVERED
	image.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	image.anchor_left=0.065;image.anchor_right=0.935;image.anchor_top=0.05;image.anchor_bottom=0.57 if compact else 0.69
	image.mouse_filter=Control.MOUSE_FILTER_IGNORE;button.add_child(image)
	var frame:=TextureRect.new();frame.texture=load(UI+"ui-art-v310_card_frame.webp")
	frame.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;frame.stretch_mode=TextureRect.STRETCH_SCALE
	frame.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);frame.mouse_filter=Control.MOUSE_FILTER_IGNORE;button.add_child(frame)
	var label:=Label.new();label.text=title
	label.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER;label.vertical_alignment=VERTICAL_ALIGNMENT_CENTER
	label.autowrap_mode=TextServer.AUTOWRAP_ARBITRARY if compact else TextServer.AUTOWRAP_WORD_SMART;label.clip_text=true
	label.add_theme_color_override("font_color",Color("24170d"));label.add_theme_font_size_override("font_size",maxi(7 if compact else 8,roundi(card_size.x*(0.068 if compact else 0.12))));label.add_theme_font_override("font",hud.ui_bold)
	label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	label.anchor_left=0.09;label.anchor_right=0.91;label.anchor_top=0.58 if compact else 0.70;label.anchor_bottom=0.84 if compact and not subtitle.is_empty() else 0.86 if not subtitle.is_empty() else 0.93
	label.mouse_filter=Control.MOUSE_FILTER_IGNORE;button.add_child(label)
	if not subtitle.is_empty():
		var detail:=Label.new();detail.text=subtitle;detail.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER;detail.vertical_alignment=VERTICAL_ALIGNMENT_CENTER
		detail.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;detail.clip_text=true;detail.mouse_filter=Control.MOUSE_FILTER_IGNORE
		detail.add_theme_color_override("font_color",Color("3d2815"));detail.add_theme_font_size_override("font_size",maxi(7,roundi(card_size.x*(0.07 if compact else 0.08))))
		detail.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);detail.anchor_left=0.09;detail.anchor_right=0.91;detail.anchor_top=0.84;detail.anchor_bottom=0.96;button.add_child(detail)
	if not enabled:button.modulate=Color(0.6,0.6,0.6,1)
	return button

func add_card(title: String,art_name: String,subtitle: String,action: Callable,enabled:=true) -> void:
	row.add_child(make_card(title,art_name,subtitle,action,enabled))

func add_search_card(filter: String) -> void:
	var holder:=Control.new();holder.custom_minimum_size=card_size
	var illustration:=TextureRect.new();illustration.texture=load(UI+"ui-art-v263_cmd_explore.webp")
	illustration.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;illustration.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_COVERED
	illustration.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	illustration.anchor_left=0.065;illustration.anchor_right=0.935;illustration.anchor_top=0.05;illustration.anchor_bottom=0.69
	illustration.mouse_filter=Control.MOUSE_FILTER_IGNORE;holder.add_child(illustration)
	var border:=TextureRect.new();border.texture=load(UI+"ui-art-v310_card_frame.webp");border.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;border.stretch_mode=TextureRect.STRETCH_SCALE
	border.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);border.mouse_filter=Control.MOUSE_FILTER_IGNORE;holder.add_child(border)
	search=LineEdit.new();search.placeholder_text="Otsi…";search.text=filter;search.text_changed.connect(search_changed)
	search.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);search.anchor_left=0.09;search.anchor_right=0.91;search.anchor_top=0.75;search.anchor_bottom=0.92
	search.add_theme_font_size_override("font_size",maxi(8,roundi(card_size.x*0.10)));holder.add_child(search);row.add_child(holder)

func populate_cities(filter: String) -> void:
	host.refresh_city_options();host.refresh_settler_options()
	add_search_card(filter)
	for i in host.city_select.item_count:
		var id:=int(host.city_select.get_item_metadata(i))
		var city: Dictionary={}
		for candidate in host.game.cities:
			if int(candidate.id)==id:city=candidate;break
		if city.is_empty():continue
		if not filter.strip_edges().is_empty() and not str(city.name).to_lower().contains(filter.strip_edges().to_lower()):continue
		var subtitle: String="%d elanikku · %d:%d" % [floori(float(city.economy.realms[0].pop)),int(city.c)+1,int(city.r)+1]
		var card:=make_card(str(city.name),"cmd_city",subtitle,choose_city.bind(i));row.add_child(card)
		var caption:=card.get_child(2) as Label
		if caption!=null:caption.anchor_bottom=0.86
		var enter:=Button.new();enter.flat=true;enter.text="Ava linn →";enter.add_theme_font_size_override("font_size",maxi(7,roundi(card_size.x*0.08)))
		enter.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);enter.anchor_left=0.08;enter.anchor_right=0.92;enter.anchor_top=0.87;enter.anchor_bottom=0.98
		enter.pressed.connect(enter_city.bind(i));card.add_child(enter)
	for person in host.game.settlers:
		if int(person.team)!=0:continue
		if not filter.strip_edges().is_empty() and not ("asunik "+str(int(person.id)+1)).contains(filter.strip_edges().to_lower()):continue
		var subtitle: String="Asunik · %d:%d" % [int(person.c)+1,int(person.r)+1]
		add_card("Asunik %d" % (int(person.id)+1),"unit_settler",subtitle,choose_settler.bind(int(person.id)))
	if host.city_created:add_card("Värba asunik","unit_settler","",func():host.recruit_new_settler();close_menu())

func choose_settler(id: int) -> void:
	if host.city_created:
		for i in host.settler_select.item_count:
			if int(host.settler_select.get_item_metadata(i))==id:host.settler_select.select(i);host.select_owned_settler();break
	else:
		for person in host.game.settlers:
			if int(person.team)==0 and int(person.id)==id:host.settler=person;host.select_player_settler();break
	close_menu()

func choose_city(index: int) -> void:
	host.city_select.select(index);host.switch_city(index);host.focus_selected_entity()

func enter_city(index: int) -> void:
	choose_city(index);close_menu()
	if not host.detail_mode:host.toggle_detail()

func populate_diplomacy() -> void:
	var names: Array=["Eesti","Soome","Rootsi","Norra"]
	for team in [1,2,3]:
		var town_count:=0;var population:=0
		for city in host.game.cities:
			if int(city.team)==team:town_count+=1;population+=floori(float(city.economy.realms[team].pop))
		var current:=Diplomacy.relation(host.game,0,team)
		var panel:=PanelContainer.new();panel.custom_minimum_size=Vector2(clampf(card_size.x*2.12,180,280),scroller.size.y)
		var style:=StyleBoxFlat.new();style.bg_color=Color("182f40");style.border_color=Color("b38e4c");style.set_border_width_all(1);style.set_corner_radius_all(7)
		style.content_margin_left=12;style.content_margin_right=12;style.content_margin_top=12;style.content_margin_bottom=12;panel.add_theme_stylebox_override("panel",style)
		var column:=VBoxContainer.new();column.add_theme_constant_override("separation",8);panel.add_child(column);row.add_child(panel)
		var name:=Label.new();name.text=names[team];name.add_theme_font_override("font",hud.ui_bold);name.add_theme_color_override("font_color",Color("f3d997"));name.add_theme_font_size_override("font_size",maxi(13,roundi(card_size.x*0.15)));column.add_child(name)
		var divider:=HSeparator.new();column.add_child(divider)
		var summary:=Label.new();summary.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
		summary.text="%d elanikku · %d linna · %s" % [population,town_count,{"friendly":"sõprus","neutral":"neutraalne","war":"sõda"}.get(current,current)];column.add_child(summary)
		var spacer:=Control.new();spacer.size_flags_vertical=Control.SIZE_EXPAND_FILL;column.add_child(spacer)
		for entry in [["friendly","Sõprus"],["neutral","Neutraalne"],["war","Sõda"]]:
			var button:=Button.new();button.text=entry[1];button.disabled=current==entry[0]
			button.custom_minimum_size.y=maxf(40,card_size.y*0.17);button.alignment=HORIZONTAL_ALIGNMENT_LEFT;button.add_theme_font_size_override("font_size",13)
			button.pressed.connect(change_relation.bind(team,entry[0]));column.add_child(button)
	if not diplomacy_feedback.is_empty():
		var message:=Label.new();message.text=diplomacy_feedback;message.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;message.custom_minimum_size.x=card_size.x;row.add_child(message)

func change_relation(team: int,status: String) -> void:
	var result:=Diplomacy.change_player_relation(host.game,team,status)
	diplomacy_feedback=str(result.error) if result.has("error") else "Suhe muudetud."
	rebuild()

func populate_journal() -> void:
	var events: Array=host.game.get("events",[]).duplicate(true)
	for city in host.game.cities:
		if int(city.team)!=0:continue
		for event in city.economy.realms[0].get("log",[]):events.append({"time":float(event.get("time",0))+float(city.get("foundedAt",0)),"text":str(city.name)+" · "+str(event.get("text",""))})
	events.sort_custom(func(a,b):return float(a.get("time",0))>float(b.get("time",0)))
	if events.is_empty():add_card("Päevik","cmd_research","Sündmusi veel pole.",func():pass);return
	for i in mini(60,events.size()):
		var event: Dictionary=events[i]
		add_card("Käik %d" % (floori(float(event.get("time",0))/60.0)+1),"cmd_research",str(event.get("text","")),func():pass)

func populate_city_overview() -> void:
	var city: Dictionary=host.game.cities[host.active_city_index]
	var body:=VBoxContainer.new();body.custom_minimum_size=Vector2(maxf(220,scroller.size.x-4),card_size.y)
	body.add_theme_constant_override("separation",3);row.add_child(body)
	overview_title=Label.new();overview_title.add_theme_font_override("font",hud.ui_bold)
	overview_title.add_theme_font_size_override("font_size",maxi(12,roundi(card_size.x*0.16)));overview_title.clip_text=true;body.add_child(overview_title)
	overview_resources=Label.new();overview_resources.add_theme_font_size_override("font_size",maxi(9,roundi(card_size.x*0.10)));overview_resources.clip_text=true;body.add_child(overview_resources)
	overview_research=Label.new();overview_research.add_theme_font_size_override("font_size",maxi(9,roundi(card_size.x*0.10)));overview_research.clip_text=true;body.add_child(overview_research)
	var dialog:=CityOverview.new();dialog.host=host;body.add_child(dialog)
	var statistics: ScrollContainer=dialog.scroll
	statistics.reparent(body);statistics.custom_minimum_size=Vector2.ZERO
	statistics.size_flags_horizontal=Control.SIZE_EXPAND_FILL;statistics.size_flags_vertical=Control.SIZE_EXPAND_FILL
	dialog.grid.columns=3
	embedded_overview=dialog;overview_city_id=int(city.id)
	refresh_city_overview(city)

func refresh_city_overview(city: Dictionary) -> void:
	if not is_instance_valid(embedded_overview):return
	var team:=int(city.team);var age:=int(host.game.ages[team])
	overview_title.text=str(city.name)+" · "+str(Economy.DATA.data.ages[age].name)
	var cell: Dictionary=host.city_cell_data(city);var resources:=PackedStringArray()
	for key in cell.get("deposits",{}):
		if cell.deposits[key] and (key!="oil" or "oil_drilling" in host.game.research[team].known):resources.append(str(Economy.DATA.data.resource_names.get(key,CityRules.DEPOSIT_NAMES.get(key,key))))
	overview_resources.text=" · ".join(resources) if not resources.is_empty() else "Maavarad puuduvad"
	var research: Dictionary=host.game.research[team];var active: String=str(research.get("active",""))
	overview_research.text="⚗ "+(str(Research.DATA.data.techs[active].name) if Research.DATA.data.techs.has(active) else "Vali tehnoloogiapuust järgmine avastus.")
	embedded_overview.refresh()
func toggle_city_trade() -> void:
	var city: Dictionary=host.game.cities[host.active_city_index]
	city.tradeDisabled=not city.get("tradeDisabled",false)
	host.update_status("Linnadevaheline kaubavedu peatatud." if city.tradeDisabled else "Linnadevaheline kaubavedu lubatud.")
	rebuild()

func toggle_foreign_merchants(team: int) -> void:
	var city: Dictionary=host.game.cities[host.active_city_index]
	var blocked: bool=not city.get("blockedMerchants",{}).get(str(team),false)
	Diplomacy.block_merchants(host.game,city,team,blocked)
	host.update_status("Kaupmehed tõkestatud." if blocked else "Kaupmehed lubatud.")
	rebuild()

func populate_buildings(filter: String) -> void:
	var city: Dictionary=host.current_build_context()
	var available:=available_buildings(city)
	var holder:=Control.new();holder.custom_minimum_size=card_size
	var filters:=ScrollContainer.new();filters.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED
	filters.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	filters.anchor_left=0.075;filters.anchor_right=0.925;filters.anchor_top=0.055;filters.anchor_bottom=0.72
	category_bar=VBoxContainer.new();category_bar.add_theme_constant_override("separation",2);category_bar.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	filters.add_child(category_bar);holder.add_child(filters);rebuild_categories(available)
	var border:=TextureRect.new();border.texture=load(UI+"ui-art-v310_card_frame.webp")
	border.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;border.stretch_mode=TextureRect.STRETCH_SCALE
	border.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);border.mouse_filter=Control.MOUSE_FILTER_IGNORE;holder.add_child(border)
	search=LineEdit.new();search.placeholder_text="Otsi…";search.text=filter;search.text_changed.connect(search_changed)
	search.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	search.anchor_left=0.09;search.anchor_right=0.91;search.anchor_top=0.75;search.anchor_bottom=0.92
	search.add_theme_font_size_override("font_size",maxi(8,roundi(card_size.x*0.10)))
	var search_style:=StyleBoxFlat.new();search_style.bg_color=Color("edce8c");search_style.content_margin_left=3;search_style.content_margin_right=3
	search.add_theme_stylebox_override("normal",search_style);search.add_theme_stylebox_override("focus",search_style)
	search.add_theme_color_override("font_color",Color("24170d"));search.add_theme_color_override("font_placeholder_color",Color("816d49"))
	holder.add_child(search);row.add_child(holder)
	var visible_count:=0
	var column: VBoxContainer
	for i in available:
		var type: String=host.build_select.get_item_metadata(i)
		var definition: Dictionary=Economy.DATA.data.buildings[type]
		var category:=building_category(type)
		if build_category!="all" and category!=build_category:continue
		if not filter.strip_edges().is_empty() and not (type+" "+str(definition.name)+" "+category).to_lower().contains(filter.strip_edges().to_lower()):continue
		var rule:String=host.district_county_rule(city,type)
		if rule.is_empty():rule=CityRules.urban_rule(host.game,city,host.city_cell_data(city),type,host.is_coast(int(city.c),int(city.r)),host.city_has_river(city),host.district_buildings(city))
		var can_pay:=Economy.can_afford(city.economy.realms[0].resources,definition.get("cost",{}))
		var cost: Array[String]=[]
		for key in definition.get("cost",{}):cost.append("%s %.0f" % [Economy.DATA.data.resource_names.get(key,key),float(definition.cost[key])])
		var cost_line:=", ".join(cost) if not cost.is_empty() else "Tasuta"
		var subtitle: String=cost_line+("\n"+rule if not rule.is_empty() else "\nPuuduvad materjalid" if not can_pay else "")
		var local_art: String="bld_"+type
		if not ResourceLoader.exists(UI+"ui-art-v263_"+local_art+".webp"):
			local_art="tech/"+str(Research.DATA.data.build_tech.get(type,"settlement"))
		if visible_count%2==0:
			column=VBoxContainer.new();column.add_theme_constant_override("separation",6);row.add_child(column)
		var card:=make_card(str(definition.name),local_art,subtitle,choose_building.bind(i),rule.is_empty(),true)
		column.add_child(card)
		if not host.house_designer_id(type,city).is_empty():
			var design:=Button.new();design.text="✎";design.tooltip_text="Kujunda uute hoonete plaan";design.set_anchors_preset(Control.PRESET_TOP_RIGHT);design.position=Vector2(-25,2);design.custom_minimum_size=Vector2(23,23);design.pressed.connect(host.open_type_house_designer.bind(type,i));card.add_child(design)
		visible_count+=1
	if visible_count==0:add_card("Ehitisi ei leitud","cmd_build","Muuda otsingut või kategooriat",func():pass,false)

func search_changed(value: String) -> void:
	if refreshing:return
	# Keep focus while updating the horizontal strip.
	var caret:=search.caret_column
	rebuild()
	if search!=null:search.grab_focus();search.caret_column=mini(caret,value.length())

func choose_building(index: int) -> void:
	var city: Dictionary=host.current_build_context()
	var type: String=host.build_select.get_item_metadata(index)
	var rule:String=host.district_county_rule(city,type)
	if rule.is_empty():rule=CityRules.urban_rule(host.game,city,host.city_cell_data(city),type,host.is_coast(int(city.c),int(city.r)),host.city_has_river(city),host.district_buildings(city))
	if not rule.is_empty():host.update_status(rule);return
	var cost: Dictionary=Economy.DATA.data.buildings[type].get("cost",{})
	if not Economy.can_afford(city.economy.realms[city.team].resources,cost):
		if not city.has("importRequests"):city.importRequests={}
		city.importRequests.merge(cost,true)
		host.update_status("Materjalide tellimus lisatud. Kaupmees vajab ülejäägiga linna ja lubatud peatustega teed.")
		rebuild();return
	if not host.detail_mode:
		host.toggle_detail()
		if not host.can_build_on_detail():return
	host.build_select.select(index);host.update_field_controls(index)
	host.clear_building_preview();host.build_angle=null;host.build_placement_mode=true
	host.update_status("Lohista müür kaardile · C sirge/kumer · T kõrgus · Ctrl + hiireratas pöörab." if type in ["palisade","stonewall","reinforced_wall"] else "Vali detailkaardil ehituskoht · Ctrl + hiireratas pöörab." if type!="field" else "Lohista detailkaardile põllu ala · Ctrl + hiireratas pöörab.")

func populate_villages() -> void:
	var research: Dictionary=host.game.research[0]
	var topic: String=str(Research.DATA.data.techs.get(str(research.active),{}).get("name","Ühtegi uuringut pole käimas"))
	var treasury:=make_trade_group("Kuningriigi kassa",topic,"cmd_research")
	var boost:=Button.new();boost.text="Kiirenda uuringut\n40 kulda → +12 punkti";boost.disabled=research.active==null;boost.pressed.connect(boost_research);treasury.add_child(boost)
	var count:=0
	for landmark in host.game.get("landmarks",[]):
		if Discoveries.village_type(landmark)!="traders":continue
		if not host.reveal_all and not host.game.explored[0].has(str(int(landmark.c))+":"+str(int(landmark.r))):continue
		var town:=Discoveries.trade_town(host.game,landmark,0)
		var place: String="ükski linn pole piisavalt lähedal" if town.is_empty() else "kaupleb linn "+str(town.name)
		var age:=Discoveries.village_age(host.game,landmark)
		var subtitle: String=place+" · ruut %d:%d" % [int(landmark.c)+1,int(landmark.r)+1]
		var group:=make_trade_group("Kaupmeeste küla · "+["Kiviaeg","Pronksiaeg","Rauaaeg","Keskaeg","Renessanss","Tööstusajastu","Moodne ajastu"][age],subtitle,"res_gold")
		var locate:=Button.new();locate.text="Näita kaardil";locate.pressed.connect(focus_village.bind(str(landmark.id)));group.add_child(locate)
		for offer in Discoveries.trade_offers(age):
			var button:=Button.new();var price: String=""
			if offer.give.has("gold"):price=" (%d kulda)" % int(offer.give.gold)
			elif offer.get.has("gold"):price=" (+%d kulda)" % int(offer.get.gold)
			button.text=str(offer.label)+price;button.disabled=town.is_empty();button.pressed.connect(trade_from_group.bind(str(landmark.id),str(offer.id)));group.add_child(button)
		count+=1
	if count==0:make_trade_group("Külakaubandus","Ühtegi kaupmeeste küla pole veel avastatud. Saada avastaja maailma uurima.","cmd_explore")

func make_trade_group(title: String,subtitle: String,icon_name: String) -> VBoxContainer:
	var panel:=PanelContainer.new();panel.custom_minimum_size=Vector2(clampf(card_size.x*2.12,180,280),scroller.size.y)
	var style:=StyleBoxFlat.new();style.bg_color=Color("182f40");style.border_color=Color("b38e4c");style.set_border_width_all(1);style.set_corner_radius_all(7)
	style.content_margin_left=12;style.content_margin_right=12;style.content_margin_top=12;style.content_margin_bottom=12;panel.add_theme_stylebox_override("panel",style)
	var scroll:=ScrollContainer.new();scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED;panel.add_child(scroll)
	var column:=VBoxContainer.new();column.size_flags_horizontal=Control.SIZE_EXPAND_FILL;column.add_theme_constant_override("separation",8);scroll.add_child(column);row.add_child(panel)
	var heading:=HBoxContainer.new();column.add_child(heading)
	var illustration:=TextureRect.new();illustration.texture=load(UI+"ui-art-v263_"+icon_name+".webp");illustration.custom_minimum_size=Vector2(42,42);illustration.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;illustration.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_CENTERED;heading.add_child(illustration)
	var label:=Label.new();label.text=title;label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;label.size_flags_horizontal=Control.SIZE_EXPAND_FILL;heading.add_child(label)
	var description:=Label.new();description.text=subtitle;description.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;column.add_child(description)
	return column

func focus_village(id: String) -> void:
	for landmark in host.game.get("landmarks",[]):
		if str(landmark.id)!=id:continue
		if host.detail_mode:host.toggle_detail()
		host.selected=Vector2i(int(landmark.c),int(landmark.r));host.camera_target=host.cell_position(host.selected)+Vector3(1,0,1);host.world_camera_target=host.camera_target;host.update_camera();return

func trade_from_group(id: String,offer_id: String) -> void:
	var result:=Discoveries.trade_with_village(host.game,id,offer_id,0)
	if result.has("error"):host.update_status(result.error)
	else:host.update_status(result.text);host.update_resources_status()
	rebuild()

func boost_research() -> void:
	var result:=Research.buy_research(host.game,0)
	if result.has("error"):host.update_status(result.error)
	else:host.update_status("Kassa: 40 kulda → uuring kiirenes (+12 punkti), "+str(result.town))
	rebuild()

func open_village(id: String) -> void:
	selected_village_id=id
	open_menu("village_trade")

func populate_village_offers() -> void:
	var landmark: Dictionary={}
	for candidate in host.game.get("landmarks",[]):
		if str(candidate.id)==selected_village_id:landmark=candidate;break
	if landmark.is_empty():return
	var town:=Discoveries.trade_town(host.game,landmark,0)
	if town.is_empty():return
	var stock: Dictionary=town.economy.realms[0].resources
	for offer in Discoveries.trade_offers(Discoveries.village_age(host.game,landmark)):
		var cost: Array[String]=[];var affordable:=true
		for key in offer.give:
			cost.append("%s %.0f" % [Economy.DATA.data.resource_names.get(key,key),float(offer.give[key])])
			if float(stock.get(key,0))<float(offer.give[key]):affordable=false
		add_card(str(offer.label),"res_gold","Vaja: "+", ".join(cost),make_village_trade.bind(str(offer.id)),affordable)

func make_village_trade(offer_id: String) -> void:
	var result:=Discoveries.trade_with_village(host.game,selected_village_id,offer_id,0)
	if result.has("error"):host.update_status(result.error)
	else:host.update_status(result.text);host.update_resources_status()
	rebuild()
func populate_armies(filter: String) -> void:
	add_search_card(filter)
	add_card("Värbamine","cmd_army","Väljaõpe",func():host.show_training(),host.city_created)
	host.refresh_army_options()
	var current: Variant=host.selected_army()
	if current!=null:
		add_card("Jaga valitud armee pooleks","cmd_army","",army_action.bind("split"))
		add_card("Ühenda siin olevad armeed","cmd_army","",army_action.bind("merge"))
		add_card("Koonda oma armeed siia","cmd_army","",army_action.bind("rally"))
	for i in host.army_select.item_count:
		if not filter.strip_edges().is_empty() and not str(host.army_select.get_item_text(i)).to_lower().contains(filter.strip_edges().to_lower()):continue
		add_card(host.army_select.get_item_text(i),"unit_scout","Vali väe siht",choose_army.bind(i))
	for ship in host.game.get("ships",[]):
		if int(ship.team)!=0 or float(ship.hp)<=0:continue
		var name: String=NavalRules.SHIPS.data.get(ship.kind,{}).get("name","Laev")
		if not filter.strip_edges().is_empty() and not name.to_lower().contains(filter.strip_edges().to_lower()):continue
		add_card(name,"cmd_map","Vali laev",choose_ship.bind(int(ship.id)))

func army_action(action: String) -> void:
	match action:
		"split":host.split_selected_army()
		"merge":host.merge_selected_armies()
		"rally":host.rally_selected_armies()
	rebuild()

func choose_army(index: int) -> void:
	host.select_army_for_ui(index)
	close_menu()

func choose_ship(id: int) -> void:
	host.select_ship_by_id(id);close_menu()

