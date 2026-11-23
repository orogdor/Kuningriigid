extends Control

const Research=preload("res://scripts/research_rules.gd")
const Layout=preload("res://scripts/research_layout.gd")
const GraphView=preload("res://scripts/research_map.gd")
const PanelFrame=preload("res://scripts/panel_frame.gd")
const Era=preload("res://scripts/era_economy.gd")
const Economy=preload("res://scripts/economy_rules.gd")
const UI := "res://assets/ui/"
var host: Node
var update_clock:=0.0
var last_state: String=""
var card_progress: Dictionary={}
var card_states: Dictionary={}
var card_frames: Dictionary={}
var selected := ""
var elements: Dictionary={}
var cards: Control
var graph_space: Control
var zoom_level:=1.0
var detail: Label
var detail_title: Label
var detail_picture: TextureRect
var summary: Label
var queue_label: Label
var pause_button: Button
var queue_buttons: Array[Button]=[]
var age_buttons: Array[Button]=[]
var progression: Dictionary={}
var graph: Dictionary={}
var last_columns:=0

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter=Control.MOUSE_FILTER_STOP
	visible=false
	var viewport_width:=get_viewport_rect().size.x
	if viewport_width>480 and viewport_width<=700:zoom_level=0.77
	var background:=ColorRect.new();background.color=Color(0.01,0.03,0.07,0.91)
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);add_child(background)
	var frame:=PanelFrame.new();frame.texture=load(UI+"ui-art-v304_panel.webp")
	add_child(frame);elements.frame=frame
	var eyebrow:=Label.new();eyebrow.text="UURIMINE JA AVASTUSED";eyebrow.add_theme_font_size_override("font_size",10)
	eyebrow.add_theme_color_override("font_color",Color("d9b673"));add_child(eyebrow);elements.eyebrow=eyebrow
	var heading:=Label.new();heading.text="Avastuste kroonika";heading.horizontal_alignment=HORIZONTAL_ALIGNMENT_LEFT
	heading.vertical_alignment=VERTICAL_ALIGNMENT_CENTER;heading.add_theme_font_size_override("font_size",34)
	heading.add_theme_color_override("font_color",Color("fff0bb"));add_child(heading);elements.heading=heading
	var close:=Button.new();close.text="✕";close.tooltip_text="Sulge tehnoloogiapuu";close.pressed.connect(close_screen);add_child(close);elements.close=close
	summary=Label.new();summary.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;summary.add_theme_font_size_override("font_size",12);summary.add_theme_color_override("font_color",Color("ead3a7"));add_child(summary);elements.summary=summary
	pause_button=Button.new();pause_button.add_theme_font_size_override("font_size",11);pause_button.pressed.connect(toggle_research);add_child(pause_button);elements.pause=pause_button
	var tree_summary:=Label.new();tree_summary.add_theme_font_size_override("font_size",11);tree_summary.add_theme_color_override("font_color",Color("c4cccf"));add_child(tree_summary);elements.tree_summary=tree_summary
	var map_back:=Panel.new();var map_style:=StyleBoxFlat.new();map_style.bg_color=Color(0.027,0.094,0.149,0.72);map_style.border_color=Color(0.70,0.56,0.29,0.30);map_style.set_border_width_all(1)
	map_back.add_theme_stylebox_override("panel",map_style);map_back.mouse_filter=Control.MOUSE_FILTER_IGNORE;add_child(map_back);elements.map_back=map_back
	var divider:=ColorRect.new();divider.color=Color(0.62,0.48,0.25,0.5);divider.mouse_filter=Control.MOUSE_FILTER_IGNORE;add_child(divider);elements.divider=divider
	var queue_line:=ColorRect.new();queue_line.color=Color(0.62,0.48,0.25,0.55);queue_line.mouse_filter=Control.MOUSE_FILTER_IGNORE;add_child(queue_line);elements.queue_line=queue_line
	var scroll:=ScrollContainer.new();scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_AUTO
	scroll.gui_input.connect(research_map_input)
	add_child(scroll);elements.scroll=scroll
	graph_space=Control.new();graph_space.mouse_filter=Control.MOUSE_FILTER_PASS
	scroll.add_child(graph_space)
	cards=Control.new();cards.set_script(GraphView);cards.mouse_filter=Control.MOUSE_FILTER_PASS
	graph_space.add_child(cards)
	for age in Research.DATA.data.era_names.size():
		var age_button:=Button.new();age_button.text=Research.DATA.data.era_names[age]
		age_button.tooltip_text="Liigu ajastusse: "+str(Research.DATA.data.era_names[age])
		age_button.add_theme_font_size_override("font_size",11);age_button.pressed.connect(jump_to_age.bind(age))
		add_child(age_button);age_buttons.append(age_button)
	var minus:=Button.new();minus.text="−";minus.tooltip_text="Vähenda tehnoloogiapuud";minus.pressed.connect(change_zoom.bind(-0.1));add_child(minus);elements.minus=minus
	var scale_label:=Label.new();scale_label.text="%d%%" % roundi(zoom_level*100);scale_label.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER;add_child(scale_label);elements.scale_label=scale_label
	var plus:=Button.new();plus.text="+";plus.tooltip_text="Suurenda tehnoloogiapuud";plus.pressed.connect(change_zoom.bind(0.1));add_child(plus);elements.plus=plus
	detail_picture=TextureRect.new();detail_picture.expand_mode=TextureRect.EXPAND_IGNORE_SIZE
	detail_picture.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_CENTERED;detail_picture.mouse_filter=Control.MOUSE_FILTER_IGNORE
	add_child(detail_picture);elements.detail_picture=detail_picture
	detail_title=Label.new();detail_title.add_theme_font_size_override("font_size",23);detail_title.add_theme_color_override("font_color",Color("ffe7ae"))
	var title_font:=SystemFont.new();title_font.font_names=PackedStringArray(["Georgia","Times New Roman","serif"]);title_font.font_weight=700;detail_title.add_theme_font_override("font",title_font)
	detail_title.clip_text=true;add_child(detail_title);elements.detail_title=detail_title
	var detail_scroll:=ScrollContainer.new();detail_scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED
	add_child(detail_scroll);elements.detail=detail_scroll
	detail=Label.new();detail.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	detail.add_theme_color_override("font_color",Color("f6e6c2"));detail.add_theme_font_size_override("font_size",12);detail.size_flags_horizontal=Control.SIZE_EXPAND_FILL
	detail_scroll.add_child(detail)
	var start:=Button.new();start.text="Alusta uurimist";start.pressed.connect(start_selected);add_child(start);elements.start=start
	var gold:=StyleBoxFlat.new();gold.bg_color=Color("c8a465");gold.set_corner_radius_all(3)
	var gold_disabled:=gold.duplicate();gold_disabled.bg_color=Color("655b47")
	start.add_theme_stylebox_override("normal",gold);start.add_theme_stylebox_override("hover",gold);start.add_theme_stylebox_override("disabled",gold_disabled)
	start.add_theme_color_override("font_color",Color("20190c"));start.add_theme_color_override("font_disabled_color",Color("292820"))
	var add:=Button.new();add.text="Lisa järjekorda";add.pressed.connect(queue_selected);add_child(add);elements.queue=add
	queue_label=Label.new();queue_label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;queue_label.visible=false
	queue_label.add_theme_color_override("font_color",Color("f6e6c2"));add_child(queue_label);elements.queue_label=queue_label
	for i in 5:
		var button:=Button.new();button.expand_icon=true;button.pressed.connect(queue_slot_pressed.bind(i))
		var circle:=StyleBoxFlat.new();circle.bg_color=Color("071725");circle.border_color=Color("ae8b4f");circle.set_border_width_all(2);circle.set_corner_radius_all(100)
		button.add_theme_stylebox_override("normal",circle);button.add_theme_stylebox_override("disabled",circle);button.add_theme_stylebox_override("hover",circle)
		button.add_theme_color_override("font_color",Color("d9b673"));button.add_theme_color_override("font_disabled_color",Color("d9b673"));button.add_theme_font_size_override("font_size",26)
		add_child(button);queue_buttons.append(button);elements["queue_slot_"+str(i)]=button
	get_viewport().size_changed.connect(layout);layout()

func layout() -> void:
	if elements.is_empty():return
	var available:=get_viewport_rect().size
	var factor:=minf(1.0,maxf(0.35,minf(available.x/900.0,available.y/560.0)))
	elements.frame.border_width=16.0*factor;elements.frame.queue_redraw()
	var margin:=20.0*factor
	var dimensions:=Vector2(minf(1380.0*factor,available.x-2*margin),available.y-2*margin)
	var origin:=Vector2(margin,margin)
	var left:=30.0*factor;var right:=dimensions.x-30.0*factor
	var inspector_width:=290.0*factor
	var map_width:=maxf(100.0,right-left-inspector_width-20.0*factor)
	var map_top:=233.0*factor
	var queue_top:=dimensions.y-127.0*factor
	var map_height:=maxf(70.0,queue_top-map_top)
	var inspector_x:=left+map_width+20.0*factor
	var coords: Dictionary={
		"frame":[0,0,dimensions.x,dimensions.y],"eyebrow":[left,28*factor,map_width,16*factor],
		"heading":[left,46*factor,map_width,42*factor],"close":[dimensions.x-53*factor,20*factor,38*factor,38*factor],
		"summary":[left,104*factor,map_width,40*factor],"pause":[dimensions.x-224*factor,103*factor,194*factor,34*factor],
		"tree_summary":[left,153*factor,maxf(0,map_width-140*factor),25*factor],
		"minus":[left+map_width-130*factor,153*factor,36*factor,30*factor],"scale_label":[left+map_width-91*factor,153*factor,48*factor,30*factor],"plus":[left+map_width-38*factor,153*factor,36*factor,30*factor],
		"map_back":[left,map_top,map_width,map_height],"scroll":[left,map_top,map_width,map_height],
		"divider":[inspector_x,153*factor,1*factor,maxf(1,queue_top-153*factor)],
		"detail_picture":[inspector_x+18*factor,158*factor,inspector_width-18*factor,170*factor],
		"detail_title":[inspector_x+18*factor,345*factor,inspector_width-18*factor,31*factor],
		"detail":[inspector_x+18*factor,380*factor,inspector_width-18*factor,maxf(30,queue_top-(465 if elements.queue.visible else 422)*factor)],
		"start":[inspector_x+18*factor,queue_top-40*factor,inspector_width-18*factor,38*factor],
		"queue":[inspector_x+18*factor,queue_top-82*factor,inspector_width-18*factor,38*factor],
		"queue_line":[left,queue_top+15*factor,dimensions.x-left*2,1*factor],"queue_label":[left,queue_top,0,0]}
	for name in coords:
		var item: Array=coords[name];var node: Control=elements[name]
		node.position=origin+Vector2(item[0],item[1]);node.size=Vector2(item[2],item[3])
	detail.custom_minimum_size.x=maxf(80,elements.detail.size.x-18)
	var shown:=0
	for age in age_buttons.size():
		var age_button:=age_buttons[age]
		if not age_button.visible:continue
		age_button.position=origin+Vector2(left+shown*110.0*factor,193.0*factor)
		age_button.size=Vector2(106,29)*factor;shown+=1
	for i in 5:
		var button:=queue_buttons[i]
		button.position=origin+Vector2(dimensions.x/2.0+(i-2)*78.0*factor-30.0*factor,queue_top+26.0*factor)
		button.size=Vector2(60,60)*factor
	var columns:=clampi(floori((elements.scroll.size.x-2*Layout.MARGIN_X+Layout.COL_GAP)/(Layout.NODE_W+Layout.COL_GAP)),1,4)
	if visible and columns!=last_columns:refresh()

func open_screen() -> void:
	if visible:return
	visible=true
	if not Research.DATA.data.techs.has(selected):selected=""
	refresh()

func close_screen() -> void:
	if not visible:return
	visible=false

func refresh() -> void:
	if not visible:return
	var previous_scroll: int=elements.scroll.scroll_vertical
	card_progress.clear()
	card_states.clear()
	card_frames.clear()
	for child in cards.get_children():cards.remove_child(child);child.queue_free()
	var r: Dictionary=host.game.research[0]
	last_state=str(r.known)+":"+str(r.active)+":"+str(r.queue)+":"+str(r.paused)+":"+str(r.get("ageWait"))
	var techs: Dictionary=Research.DATA.data.techs
	progression=Layout.progressive(techs,r)
	if not progression.ids.has(selected):
		selected=str(r.active) if r.active!=null and progression.ids.has(str(r.active)) else ""
		if selected.is_empty():
			for id in progression.ids:
				if id not in r.known and int(techs[id].age)==int(host.game.ages[0]):selected=id;break
		if selected.is_empty() and not progression.ids.is_empty():selected=str(progression.ids[0])
	last_columns=clampi(floori((elements.scroll.size.x-2*Layout.MARGIN_X+Layout.COL_GAP)/(Layout.NODE_W+Layout.COL_GAP)),1,4)
	graph=Layout.layout(techs,progression.ids,Research.DATA.data.era_names,Research.DATA.data.era_ids,last_columns)
	cards.graph=graph;cards.selected=selected
	for age in age_buttons.size():
		var found:=false
		for band in graph.bands:
			if int(band.age)==age:found=true;break
		age_buttons[age].visible=found;age_buttons[age].disabled=not found
	cards.custom_minimum_size=Vector2(graph.width,graph.height);cards.size=cards.custom_minimum_size
	cards.scale=Vector2.ONE*zoom_level
	graph_space.custom_minimum_size=cards.custom_minimum_size*zoom_level;graph_space.size=graph_space.custom_minimum_size
	for id in progression.ids:add_card(id,r)
	update_card_selection()
	cards.queue_redraw()
	elements.scroll.set_deferred("scroll_vertical",previous_scroll)
	update_research_text(r)
	elements.tree_summary.text="%d uuritud · %d saadaval · %d järgmist hallina" % [r.known.size(),progression.ids.size()-r.known.size()-progression.previews.size(),progression.previews.size()]
	pause_button.text="Jätka uurimist" if r.paused else "Peata uurimine · edenemine säilib"
	pause_button.disabled=r.active==null and r.queue.is_empty()
	var names: Array[String]=[]
	for id in r.queue:names.append(str(techs[id].name))
	queue_label.text="Järjekord: "+(" → ".join(names) if not names.is_empty() else "tühi")
	var all: Array=[r.active];all.append_array(r.queue)
	for i in 5:
		var button:=queue_buttons[i]
		var id: String=str(all[i]) if i<all.size() and all[i]!=null else ""
		var image_path:=UI+"tech/"+id+".webp"
		button.icon=load(image_path) if not id.is_empty() and ResourceLoader.exists(image_path) else null
		button.text="+" if id.is_empty() else ""
		button.disabled=id.is_empty()
		button.tooltip_text=("Aktiivne: " if i==0 else "Eemalda järjekorrast: ")+str(techs.get(id,{}).get("name","")) if not id.is_empty() else "Tühi järjekorrakoht"
	layout()
	refresh_detail()

func _process(delta: float) -> void:
	if not visible:return
	update_clock+=delta
	if update_clock<0.5:return
	update_clock=0
	var r: Dictionary=host.game.research[0]
	var stamp:=str(r.known)+":"+str(r.active)+":"+str(r.queue)+":"+str(r.paused)+":"+str(r.get("ageWait"))
	if stamp!=last_state:refresh();return
	for id in card_progress:
		var bar: ProgressBar=card_progress[id]
		bar.value=bar.max_value if id in r.known else float(r.progress.get(id,0))
	update_research_text(r)
	refresh_detail()

func research_clock(seconds: float) -> String:
	if not is_finite(seconds):return "Ootab"
	var total:=maxi(0,ceili(seconds))
	return "%d:%02d" % [floori(float(total)/60.0),total%60]

func update_research_text(r: Dictionary) -> void:
	var techs: Dictionary=Research.DATA.data.techs;var rate:=Research.science_rate(host.game,0)
	var active: String=str(r.active) if r.active!=null else ""
	var title: String="Raja esmalt linn" if not host.city_created else "Vali uurimisteema"
	if not active.is_empty() and techs.has(active):
		var left:=maxf(0.0,Research.research_cost(host.game,techs[active])-float(r.progress.get(active,0)))
		var eta:=research_clock(left/rate*60.0) if rate>0 else "Ootab"
		if r.get("ageWait") is Dictionary and str(r.ageWait.get("id",""))==active:
			var parts: Array[String]=[];var deficit:=Era.age_deficit(host.game,0,active)
			for key in deficit:parts.append("%.1f %s" % [deficit[key],Economy.DATA.data.resource_names.get(key,key)])
			eta="Ootab materjale: "+", ".join(parts)
		elif r.paused:eta="Peatatud"
		title=("Pausil · " if r.paused else "")+str(techs[active].name)+" · "+eta
	elif r.known.size()>=techs.size():title="Kõik tehnoloogiad uuritud"
	elif not r.queue.is_empty():title="Järjekorras: "+str(techs.get(str(r.queue[0]),{}).get("name",r.queue[0]))
	var tempo: String={"epic":"Eepiline","normal":"Tavaline","fast":"Kiire"}.get(str(host.game.get("tempo","normal")),"Tavaline")
	summary.text=title+" · %.1f teaduspunkti/min · tempo: %s. 1 elanik = 1 teadust/min. Iga valmis aktiivne haridusasutus korrutab linna teaduse ×1,5; avastused lisavad boonuseid." % [rate,tempo]
	for id in card_states:
		var label: Label=card_states[id]
		if id in r.known:label.text="Uuritud"
		elif progression.previews.has(id):label.text="Järgmine avastus"
		else:
			var cost:=Research.research_cost(host.game,techs[id]);var left:=maxf(0.0,cost-float(r.progress.get(id,0)))
			label.text="%.1f teaduspunkti · %s" % [cost,research_clock(left/rate*60.0) if rate>0 else "Ootab teadust"]

func _unhandled_key_input(event: InputEvent) -> void:
	if visible and event is InputEventKey and event.pressed and event.keycode==KEY_ESCAPE:
		close_screen();get_viewport().set_input_as_handled()

func jump_to_age(age: int) -> void:
	for band in graph.get("bands",[]):
		if int(band.age)==age:
			elements.scroll.scroll_vertical=roundi(float(band.start)*zoom_level)
			return

func research_map_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.ctrl_pressed and event.button_index in [MOUSE_BUTTON_WHEEL_UP,MOUSE_BUTTON_WHEEL_DOWN]:
		change_zoom(0.1 if event.button_index==MOUSE_BUTTON_WHEEL_UP else -0.1)
		elements.scroll.accept_event()

func change_zoom(amount: float) -> void:
	var before:=zoom_level
	zoom_level=clampf(zoom_level+amount,0.62,1.3)
	if is_equal_approx(before,zoom_level):return
	var scroll: ScrollContainer=elements.scroll
	var center:=Vector2(scroll.scroll_horizontal,scroll.scroll_vertical)+scroll.size/2.0
	cards.scale=Vector2.ONE*zoom_level
	graph_space.custom_minimum_size=cards.custom_minimum_size*zoom_level
	graph_space.size=graph_space.custom_minimum_size
	elements.scale_label.text="%d%%" % roundi(zoom_level*100)
	var target:=center*zoom_level/before-scroll.size/2.0
	scroll.set_deferred("scroll_horizontal",maxi(0,roundi(target.x)))
	scroll.set_deferred("scroll_vertical",maxi(0,roundi(target.y)))
func add_card(id: String,r: Dictionary) -> void:
	var tech: Dictionary=Research.DATA.data.techs[id]
	var pos: Dictionary=graph.positions[id]
	var button:=Button.new();button.position=Vector2(pos.x,pos.y);button.size=Vector2(Layout.NODE_W,Layout.NODE_H)
	button.tooltip_text=tech.name;button.pressed.connect(select_technology.bind(id))
	var frame:=StyleBoxTexture.new();frame.texture=load(UI+"ui-art-v304_panel.webp")
	button.add_theme_stylebox_override("normal",frame);button.add_theme_stylebox_override("hover",frame);button.add_theme_stylebox_override("pressed",frame)
	if progression.previews.has(id):button.modulate=Color(0.62,0.62,0.62,1)
	elif id==r.active:button.modulate=Color(1.0,0.91,0.62,1)
	cards.add_child(button)
	var selection_frame:=Panel.new();var outline:=StyleBoxFlat.new();outline.bg_color=Color(0,0,0,0);outline.border_color=Color("f1d594");outline.set_border_width_all(2)
	selection_frame.add_theme_stylebox_override("panel",outline);selection_frame.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	selection_frame.mouse_filter=Control.MOUSE_FILTER_IGNORE;button.add_child(selection_frame);card_frames[id]=selection_frame
	var image:=TextureRect.new();var path:=UI+"tech/"+id+".webp"
	if ResourceLoader.exists(path):image.texture=load(path)
	image.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;image.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_COVERED
	image.position=Vector2(8,23);image.size=Vector2(64,74);image.mouse_filter=Control.MOUSE_FILTER_IGNORE;button.add_child(image)
	var name:=Label.new();name.text=tech.name;name.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	name.position=Vector2(80,28);name.size=Vector2(130,38);name.add_theme_font_size_override("font_size",13)
	var bold:=SystemFont.new();bold.font_names=PackedStringArray(["Georgia","Times New Roman","serif"]);bold.font_weight=700;name.add_theme_font_override("font",bold)
	name.mouse_filter=Control.MOUSE_FILTER_IGNORE;button.add_child(name)
	var state:=Label.new();state.position=Vector2(80,70);state.size=Vector2(128,24);state.add_theme_font_size_override("font_size",10);state.clip_text=true
	state.text="Uuritud" if id in r.known else "Järgmine avastus" if progression.previews.has(id) else "%.1f teaduspunkti · %s" % [Research.research_cost(host.game,tech),"Uurimisel" if id==r.active else "Saadaval"]
	state.mouse_filter=Control.MOUSE_FILTER_IGNORE;button.add_child(state);card_states[id]=state
	var progress:=ProgressBar.new();progress.step=0.01;progress.position=Vector2(80,97);progress.size=Vector2(128,4);progress.show_percentage=false
	progress.max_value=Research.research_cost(host.game,tech);progress.value=progress.max_value if id in r.known else float(r.progress.get(id,0))
	progress.visible=not progression.previews.has(id);progress.mouse_filter=Control.MOUSE_FILTER_IGNORE;button.add_child(progress)
	card_progress[id]=progress

func select_technology(id: String) -> void:
	selected=id;cards.selected=id;cards.queue_redraw();update_card_selection();refresh_detail()

func update_card_selection() -> void:
	for id in card_frames:card_frames[id].visible=id==selected

func refresh_detail(message := "") -> void:
	if selected.is_empty() or not Research.DATA.data.techs.has(selected):
		detail_title.text=""
		detail.text="Vali avastus, et näha selle hinda ja eeltingimusi."
		detail_picture.texture=null;return
	var tech: Dictionary=Research.DATA.data.techs[selected]
	var r: Dictionary=host.game.research[0]
	var show_queue: bool=r.active!=null
	if elements.queue.visible!=show_queue:
		elements.queue.visible=show_queue;layout()
	var status: String="✓ Uuritud" if selected in r.known else "▶ Uurimisel" if selected==r.active else "◇ Eelvaade — pole veel saadaval" if progression.previews.has(selected) else "✓ Valmis uurimiseks"
	var path:=UI+"tech/"+selected+".webp"
	detail_picture.texture=load(path) if ResourceLoader.exists(path) else null
	var cost:=Research.research_cost(host.game,tech)
	var parents: Array[String]=[];var alternatives: Array[String]=[];var successors: Array[String]=[]
	for id in tech.get("requires",[]):
		if id in progression.ids:parents.append(str(Research.DATA.data.techs[id].name)+( " ✓" if id in r.known else ""))
	for id in tech.get("oneOf",[]):
		if id in progression.ids:alternatives.append(str(Research.DATA.data.techs[id].name)+( " ✓" if id in r.known else ""))
	for edge in graph.get("edges",[]):
		if edge.from==selected:
			var child: String=str(Research.DATA.data.techs[edge.to].name)
			if child not in successors:successors.append(child)
	var requirements: String="JA: "+" + ".join(parents) if not parents.is_empty() else "Põhiteadmised või ajastu tingimused täidetud"
	if not alternatives.is_empty():requirements+=" · VÕI: "+" / ".join(alternatives)
	var preview: String=""
	if progression.previews.has(selected):
		var sources: Array[String]=[]
		for id in progression.previews[selected]:sources.append(str(Research.DATA.data.techs[id].name))
		preview="\n\nJärgmine avastus; uuri enne: "+" / ".join(sources)
	var next: String="\n\nNähtavad järgmised avastused: "+" · ".join(successors) if not successors.is_empty() else ""
	var materials: String=""
	if Era.DATA.data.era_materials.has(selected):
		var costs: Array[String]=[];var missing: Array[String]=[];var deficit:=Era.age_deficit(host.game,0,selected)
		for key in Era.DATA.data.era_materials[selected]:costs.append("%s %s" % [Era.DATA.data.era_materials[selected][key],Economy.DATA.data.resource_names.get(key,key)])
		for key in deficit:missing.append("%.1f %s" % [float(deficit[key]),Economy.DATA.data.resource_names.get(key,key)])
		materials="\n\nAjastu materjalid: "+", ".join(costs)+( " · Puudu: "+", ".join(missing) if not missing.is_empty() else " · Materjalid olemas")
	detail_title.text=tech.name
	detail.text="%s · %.1f teaduspunkti\n\n%s\n\n%s\n\nAvab: %s%s%s%s\n%s" % [Research.DATA.data.era_names[int(tech.age)],cost,status,requirements,tech.get("unlocks",""),preview,next,materials,message]
	elements.start.disabled=not host.city_created or selected in r.known or selected==r.active or progression.previews.has(selected) or not Research.tech_block(r,selected).is_empty()
	var planned: Array=r.known.duplicate()
	if r.active!=null:planned.append(r.active)
	planned.append_array(r.queue)
	elements.queue.disabled=not host.city_created or selected in r.known or selected==r.active or selected in r.queue or r.queue.size()>=4 or progression.previews.has(selected) or not Research.tech_block({"known":planned},selected).is_empty()

func start_selected() -> void:
	if selected.is_empty():return
	var result:=Research.start_research(host.game,0,selected)
	if result.has("error"):refresh_detail(str(result.error));return
	host.refresh_research_options();host.update_research_status();refresh()

func queue_selected() -> void:
	if selected.is_empty():return
	var result:=Research.queue_research(host.game,0,selected)
	if result.has("error"):refresh_detail(str(result.error));return
	host.refresh_research_options();host.update_research_status();refresh()

func queue_slot_pressed(index: int) -> void:
	var r: Dictionary=host.game.research[0]
	if index==0:
		if r.active!=null:select_technology(str(r.active))
		return
	if index-1>=r.queue.size():return
	r.queue.remove_at(index-1)
	var planned: Array=r.known.duplicate()
	if r.active!=null:planned.append(r.active)
	var retained: Array=[]
	for id in r.queue:
		if Research.tech_block({"known":planned},id)!="":continue
		retained.append(id);planned.append(id)
	r.queue=retained
	host.refresh_research_options();host.update_research_status();refresh()

func toggle_research() -> void:
	if not host.city_created:return
	host.toggle_research_pause();refresh()
