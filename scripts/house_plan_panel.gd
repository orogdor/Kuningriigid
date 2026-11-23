extends Control
const Canvas=preload("res://scripts/house_plan_canvas.gd")
const Preview=preload("res://scripts/house_plan_preview.gd")
const Defaults=preload("res://data/house_default_designs.json")
const Catalog=preload("res://data/house_editor_catalog.json")
const Geometry=preload("res://scripts/house_plan_geometry.gd")
const Survey=preload("res://scripts/house_plan_survey.gd")
const EconomyData=preload("res://data/economy.json")
const ITEM_LABELS={"fire":"Tulekolle","bed":"Magamisase","basket":"Korv","bench":"Pink","table":"Laud","shelf":"Riiul","jar":"Savipott","post":"Puitpost","periodMeal":"Söögikoht","periodHearthKit":"Koldevarustus","periodGarden":"Veeanumad","periodSeat":"Madal pink","periodPantry":"Toiduriiul","periodDrying":"Kuivatusrest","periodCargo":"Kaubavaru","net":"Kalavõrk","rack":"Rest","fish":"Kalad","logs":"Palgid","barrel":"Tünn","grain":"Vili","hay":"Hein","hide":"Nahk","loom":"Kangasteljed","well":"Kaev","anvil":"Alasi","kiln":"Ahi","oven":"Leivaahi","forge":"Sepikoda","furnace":"Sulatusahi","bookshelf":"Raamaturiiul","chest":"Kirst","tower":"Vahitorn","boat":"Paat"}
const WALL_LABELS={"clay":"Savi","weave":"Punutis","stone":"Kivi","wood":"Puit","bamboo":"Bambus","turf":"Mätas","mudbrick":"Toortellis","cutstone":"Tahutud kivi","plank":"Laudis","cyclopean":"Suurtest kividest müür","fresco":"Fresko","limestone":"Paekivi","stave":"Püstpalk","prestigePlaster":"Kaunistatud krohv","brick":"Tellis","plaster":"Krohv","halftimber":"Sõrestik","marble":"Marmor","reticulatum":"Võrkmüüritis","romanbrick":"Rooma tellis"}
const WALL_TEXTURES={"clay":"atlas-clay","weave":"atlas-weave","stone":"atlas-stone","wood":"atlas-wood","turf":"proc-sod","mudbrick":"proc-mudbrick","cutstone":"proc-cutstone","plank":"proc-plank","cyclopean":"proc-cyclopean","fresco":"proc-fresco","limestone":"proc-limestone","brick":"proc-brick","plaster":"proc-plaster","marble":"proc-marble","reticulatum":"proc-reticulatum","romanbrick":"proc-romanbrick"}
const TOOL_GROUPS={"build-wall":"outer","build-open":"outer","plot":"area","pier":"area","yard":"outer","rail":"fence","palisadeLine":"fence","stoneLine":"fence","highStone":"fence","rampart":"fence","gateLine":"fence","rect":"outer","round":"outer","line":"outer","partition":"inner","paintWall":"inner","door":"door","window":"window","item":"items","move":"items","erase":"items"}
const TOOL_IMAGES={"catalogue-back":"back","build-wall":"build-wall","build-open":"build-open","plot":"plot","yard":"yard","rail":"rail","palisadeLine":"palisadeLine","stoneLine":"stoneLine","highStone":"highStone","rampart":"rampart","gateLine":"gateLine","rect":"rect","round":"round","line":"line","partition":"partition","paintWall":"paintWall","door":"door-hide","window":"window-hole","item":"basket","move":"move","erase":"erase"}
signal accepted(design: Dictionary)
signal cancelled
signal reset_requested
var canvas: Control
var preview: SubViewportContainer
var status: Label
var title_label: Label
var reset_button: Button
var walk_button: Button
var tool_buttons: Dictionary={}
var category_buttons: Dictionary={}
var selected_category:="outer"
var pier_available:=false
var era:=0
var item_choices: OptionButton
var style_choices: OptionButton
var wall_choices: OptionButton
var build_choices: OptionButton
var base_choices: OptionButton
var porch_choices: OptionButton
var column_choices: OptionButton
var field_options: HBoxContainer
var field_edge_choices: OptionButton
var field_crop_choices: OptionButton
var roof_choices: OptionButton
var roof_form_choices: OptionButton
var height_choices: HSlider
var wall_height_choices: HSlider
var snap_button:CheckButton
var measurements: Label
var estimate_label: Label
var controls_panel: HFlowContainer
var options_panel: HFlowContainer
var card_scroll: ScrollContainer
var card_row: HBoxContainer
var card_previous: Button
var card_next: Button
var tool_cards_row: HBoxContainer
var choice_cards: Array[Button]=[]
var dock_panel: PanelContainer
var ledger: PanelContainer
var ledger_text: Label
var stage_ref: Control
var overview_button: Button
var mobile_ledger_open:=false
var building_name:=""
var mini_frame: PanelContainer
var mini_preview: SubViewportContainer
var mini_plan: Control
var mini_title_label: Label
var roof_overlay: PanelContainer
var preview_roof_height: HSlider
var preview_wall_height: HSlider
var preview_roof_label: Label
var preview_wall_label: Label
var floor_background: Panel
var more_actions: HFlowContainer
var more_actions_button: Button
var walk_pad: GridContainer
var walk_pad_buttons: Dictionary={}
var layout_ref: VBoxContainer
var header_brand: TextureRect
var resource_strip: HBoxContainer
var resource_widgets: Dictionary={}
var category_scroll: ScrollContainer
var toolbar_ref: HBoxContainer
var catalogue_title: Label
var catalogue_kind_scroll: ScrollContainer
var catalogue_kind_row: HBoxContainer
var catalogue_open:=false
var catalogue_filter:=""
var catalogue_buttons: Dictionary={}
var embedded_id:=""
var embedded_name:=""
var design_drafts: Dictionary={}
var last_of_era: Dictionary={}
var mode_move: Button
var mode_erase: Button
var option_groups: Dictionary={}
var save_button: Button
var close_button: Button
var era_images: Array[TextureRect]=[]
var era_labels: Array[Label]=[]
var footer_spacer: Control
var map_overlay: Control
var selection_overlay: Control
var portrait_view: TextureRect
var portrait_title: Label
var map_face_button: Button
var view_tools: HBoxContainer
var era_bar: HBoxContainer
var era_buttons: Array[Button]=[]
var floor_bar_ref: HBoxContainer
var floor_controls: Array[Button]=[]
var floor_add_button: Button
var floor_copy_button: Button
var floor_remove_button: Button
var ledger_body: VBoxContainer
var ledger_header_button: Button
var ledger_portrait: TextureRect
var ledger_name: Label
var ledger_kind: Label
var ledger_description: Label
var ledger_expanded:=true
var ledger_small_mode:=false
var view_caption: Label
var web_map_buttons: Array[Button]=[]
var web_selection_buttons: Array[Button]=[]

func _ready() -> void:
 set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);mouse_filter=Control.MOUSE_FILTER_STOP
 var background:=ColorRect.new();background.color=Color("101820");background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);add_child(background)
 var root_theme:=Theme.new();var serif:=SystemFont.new();serif.font_names=PackedStringArray(["Georgia","DejaVu Serif","serif"]);root_theme.default_font=serif;root_theme.default_font_size=14;theme=root_theme
 var layout:=VBoxContainer.new();layout_ref=layout;layout.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);add_child(layout)
 var header:=PanelContainer.new();header.custom_minimum_size.y=50;var header_style:=StyleBoxTexture.new();header_style.texture=load("res://assets/house_designer/web-header-art.webp");header_style.content_margin_left=5;header_style.content_margin_right=8;header_style.content_margin_top=3;header_style.content_margin_bottom=7;header.add_theme_stylebox_override("panel",header_style);layout.add_child(header)
 var top:=HFlowContainer.new();top.add_theme_constant_override("h_separation",4);header.add_child(top)
 var actions:=HFlowContainer.new();more_actions=actions;actions.add_theme_constant_override("h_separation",4);actions.visible=false;layout.add_child(actions)
 header_brand=TextureRect.new();header_brand.texture=load("res://assets/house_designer/web-brand-art.webp");header_brand.custom_minimum_size=Vector2(130,36);header_brand.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;header_brand.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_CENTERED;top.add_child(header_brand)
 title_label=Label.new();title_label.add_theme_color_override("font_color",Color("f0d79d"));title_label.add_theme_font_size_override("font_size",18);title_label.mouse_filter=Control.MOUSE_FILTER_IGNORE;var title_center:=CenterContainer.new();title_center.mouse_filter=Control.MOUSE_FILTER_IGNORE;header.add_child(title_center);title_center.add_child(title_label)
 measurements=Label.new();top.add_child(measurements)
 estimate_label=Label.new();estimate_label.tooltip_text="Kujundaja materjalihinnang";estimate_label.visible=false;top.add_child(estimate_label)
 resource_strip=HBoxContainer.new();resource_strip.add_theme_constant_override("separation",4);top.add_child(resource_strip);top.move_child(resource_strip,1)
 for key in ["wood","stone","clay","reed","plank","cutstone","bronze","iron"]:
  var row:=HBoxContainer.new();row.add_theme_constant_override("separation",2);resource_strip.add_child(row)
  var icon:=TextureRect.new();icon.texture=load("res://assets/house_designer/icon-"+key+".webp");icon.custom_minimum_size=Vector2(22,22);icon.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;icon.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_CENTERED;row.add_child(icon)
  var count:=Label.new();count.add_theme_font_size_override("font_size",13);count.add_theme_color_override("font_color",Color("f6e7c3"));row.add_child(count);resource_widgets[key]={"row":row,"icon":icon,"label":count}
 overview_button=make_button(actions,"Ülevaade",func():mobile_ledger_open=not mobile_ledger_open;update_stage_layout())
 make_button(actions,"Plaan / 3D",func():toggle_preview())
 walk_button=make_button(actions,"Kõnni",func():toggle_walk())
 make_button(actions,"+",func():zoom_view(1.25))
 make_button(actions,"−",func():zoom_view(0.8))
 make_button(actions,"Kogu plaan",func():reset_view())
 make_button(actions,"Katus sees / väljas",toggle_roof)
 var floor_one:=make_button(actions,"1. korrus",func():select_floor(0))
 var floor_two:=make_button(actions,"2. korrus",func():select_floor(1))
 var floor_add:=make_button(actions,"Lisa korrus 2",func():
  if canvas.add_floor():select_floor(1);status.text="Joonista teise korruse seinad."
  else:status.text="Teist korrust ei saa praegu lisada.")
 floor_one.toggle_mode=true;floor_two.toggle_mode=true;floor_controls=[floor_one,floor_two];floor_add_button=floor_add
 floor_copy_button=make_button(actions,"Kopeeri seinad",func():canvas.copy_floor_walls())
 floor_remove_button=make_button(actions,"Eemalda korrus",func():canvas.remove_floor())
 make_button(actions,"Võta tagasi",func():restore_history(false))
 make_button(actions,"Tee uuesti",func():restore_history(true))
 snap_button=CheckButton.new();snap_button.text="Võrk";snap_button.button_pressed=true;snap_button.toggled.connect(func(v):canvas.snap_on=v);actions.add_child(snap_button)
 reset_button=make_button(actions,"Taasta algne",func():reset_requested.emit();queue_free())
 make_button(actions,"Taasta näidis",func():reset_design())
 var top_spacer:=Control.new();top_spacer.size_flags_horizontal=Control.SIZE_EXPAND_FILL;top.add_child(top_spacer)
 more_actions_button=make_button(top,"☰",func():actions.visible=not actions.visible)
 save_button=make_button(top,"Salvesta",save_current_design)
 close_button=make_button(top,"Sulge",func():cancelled.emit();queue_free())
 var stage:=Control.new();stage_ref=stage;stage.size_flags_horizontal=Control.SIZE_EXPAND_FILL;stage.size_flags_vertical=Control.SIZE_EXPAND_FILL;layout.add_child(stage)
 canvas=Canvas.new();canvas.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);stage.add_child(canvas)
 preview=Preview.new();preview.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);preview.visible=false;stage.add_child(preview)
 floor_background=Panel.new();floor_background.mouse_filter=Control.MOUSE_FILTER_IGNORE;var floor_style:=StyleBoxFlat.new();floor_style.bg_color=Color("102237ef");floor_style.border_color=Color("9e8158");floor_style.set_border_width_all(1);floor_style.set_corner_radius_all(8);floor_background.add_theme_stylebox_override("panel",floor_style);stage.add_child(floor_background)
 var floor_bar:=HBoxContainer.new();floor_bar_ref=floor_bar;floor_bar.set_anchors_preset(Control.PRESET_CENTER_TOP);floor_bar.offset_left=-145;floor_bar.offset_right=145;floor_bar.offset_top=12;floor_bar.offset_bottom=52;stage.add_child(floor_bar)
 floor_bar.alignment=BoxContainer.ALIGNMENT_CENTER
 for button in [floor_one,floor_two,floor_add,floor_copy_button,floor_remove_button]:button.reparent(floor_bar);style_floor_button(button)
 ledger=PanelContainer.new();ledger.position=Vector2(12,12);ledger.custom_minimum_size=Vector2(190,0);ledger.add_theme_stylebox_override("panel",editor_panel_style());stage.add_child(ledger)
 var ledger_content:=VBoxContainer.new();ledger.add_child(ledger_content)
 ledger_header_button=Button.new();ledger_header_button.flat=true;ledger_header_button.pressed.connect(func():ledger_expanded=not ledger_expanded;refresh_ledger());ledger_content.add_child(ledger_header_button)
 var ledger_head:=HBoxContainer.new();ledger_head.mouse_filter=Control.MOUSE_FILTER_IGNORE;ledger_header_button.add_child(ledger_head);ledger_head.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
 ledger_portrait=TextureRect.new();ledger_portrait.custom_minimum_size=Vector2(42,42);ledger_portrait.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;ledger_portrait.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_COVERED;ledger_portrait.mouse_filter=Control.MOUSE_FILTER_IGNORE;ledger_head.add_child(ledger_portrait)
 var ledger_titles:=VBoxContainer.new();ledger_titles.size_flags_horizontal=Control.SIZE_EXPAND_FILL;ledger_titles.mouse_filter=Control.MOUSE_FILTER_IGNORE;ledger_head.add_child(ledger_titles)
 ledger_name=Label.new();ledger_name.add_theme_color_override("font_color",Color("f0d18a"));ledger_name.add_theme_font_size_override("font_size",16);ledger_titles.add_child(ledger_name)
 ledger_kind=Label.new();ledger_kind.add_theme_color_override("font_color",Color("bfa676"));ledger_kind.add_theme_font_size_override("font_size",11);ledger_titles.add_child(ledger_kind)
 ledger_header_button.custom_minimum_size.y=46
 ledger_body=VBoxContainer.new();ledger_body.size_flags_vertical=Control.SIZE_EXPAND_FILL;ledger_content.add_child(ledger_body)
 ledger_description=Label.new();ledger_description.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;ledger_description.add_theme_color_override("font_color",Color("e2d3b0"));ledger_description.add_theme_font_size_override("font_size",12);ledger_body.add_child(ledger_description)
 var ledger_scroll:=ScrollContainer.new();ledger_scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED;ledger_scroll.size_flags_vertical=Control.SIZE_EXPAND_FILL;ledger_body.add_child(ledger_scroll)
 ledger_text=Label.new();ledger_text.add_theme_font_size_override("font_size",12);ledger_text.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;ledger_text.size_flags_horizontal=Control.SIZE_EXPAND_FILL;ledger_text.mouse_filter=Control.MOUSE_FILTER_IGNORE;ledger_scroll.add_child(ledger_text)
 mini_frame=PanelContainer.new();mini_frame.set_anchors_preset(Control.PRESET_TOP_RIGHT);mini_frame.offset_left=-235;mini_frame.offset_right=-12;mini_frame.offset_top=12;mini_frame.offset_bottom=220;mini_frame.add_theme_stylebox_override("panel",editor_panel_style());stage.add_child(mini_frame)
 var mini_box:=VBoxContainer.new();mini_frame.add_child(mini_box)
 var mini_title:=Label.new();mini_title_label=mini_title;mini_title.text="3D eelvaade";mini_title.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER;mini_box.add_child(mini_title)
 mini_preview=Preview.new();mini_preview.size_flags_vertical=Control.SIZE_EXPAND_FILL;mini_box.add_child(mini_preview)
 mini_plan=load("res://scripts/house_plan_minimap.gd").new();mini_plan.size_flags_vertical=Control.SIZE_EXPAND_FILL;mini_plan.visible=false;mini_box.add_child(mini_plan)
 walk_pad=GridContainer.new();walk_pad.columns=3;walk_pad.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT);walk_pad.offset_left=-170;walk_pad.offset_right=-12;walk_pad.offset_top=-120;walk_pad.offset_bottom=-12;walk_pad.visible=false;stage.add_child(walk_pad)
 for entry in [["",Vector2.ZERO],["▲",Vector2(0,1)],["",Vector2.ZERO],["◀",Vector2(-1,0)],["▼",Vector2(0,-1)],["▶",Vector2(1,0)]]:
  if entry[0]=="":var spacer:=Control.new();spacer.custom_minimum_size=Vector2(48,48);walk_pad.add_child(spacer);continue
  var button:=Button.new();button.text=entry[0];button.custom_minimum_size=Vector2(48,48);walk_pad.add_child(button);walk_pad_buttons[entry[0]]=button
  var direction:Vector2=entry[1]
  button.button_down.connect(func():
   if preview.walking:preview.walk_pad_input+=direction)
  button.button_up.connect(func():
   if preview.walking:preview.walk_pad_input-=direction)
 preview.walking_changed.connect(func(active):
  walk_pad.visible=active
  update_roof_overlay())
 roof_overlay=PanelContainer.new();roof_overlay.set_anchors_preset(Control.PRESET_TOP_RIGHT);roof_overlay.offset_left=-225;roof_overlay.offset_right=-12;roof_overlay.offset_top=225;roof_overlay.offset_bottom=330;var roof_style:=StyleBoxFlat.new();roof_style.bg_color=Color("102337ef");roof_style.border_color=Color("927449");roof_style.set_border_width_all(1);roof_style.set_corner_radius_all(5);roof_style.content_margin_left=11;roof_style.content_margin_right=11;roof_style.content_margin_top=6;roof_style.content_margin_bottom=6;roof_overlay.add_theme_stylebox_override("panel",roof_style);roof_overlay.visible=false;stage.add_child(roof_overlay)
 var height_box:=VBoxContainer.new();roof_overlay.add_child(height_box)
 var roof_label_3d:=Label.new();preview_roof_label=roof_label_3d;roof_label_3d.text="Katuse kõrgus";height_box.add_child(roof_label_3d)
 preview_roof_height=HSlider.new();preview_roof_height.min_value=60;preview_roof_height.max_value=150;preview_roof_height.step=5;preview_roof_height.modulate=Color("e6c27c");preview_roof_height.value_changed.connect(func(v):height_choices.value=v);height_box.add_child(preview_roof_height)
 var wall_label_3d:=Label.new();preview_wall_label=wall_label_3d;wall_label_3d.text="Seina kõrgus";height_box.add_child(wall_label_3d)
 preview_wall_height=HSlider.new();preview_wall_height.min_value=80;preview_wall_height.max_value=160;preview_wall_height.step=5;preview_wall_height.modulate=Color("e6c27c");preview_wall_height.value_changed.connect(func(v):wall_height_choices.value=v);height_box.add_child(preview_wall_height)
 stage.resized.connect(update_stage_layout)
 canvas.changed.connect(func(value):
  update_measurements(canvas.current_plan())
  preview.set_active_floor(canvas.active_floor)
  sync_floor_controls()
  sync_options_from_plan()
  mini_preview.show_design(value);mini_plan.show_design(canvas.current_plan())
  if preview.visible:preview.show_design(value))
 var dock_center:=CenterContainer.new();layout.add_child(dock_center)
 var dock:=PanelContainer.new();dock_panel=dock;dock.custom_minimum_size.x=710;var dock_style:=editor_panel_style();dock_style.content_margin_left=10;dock_style.content_margin_right=10;dock.add_theme_stylebox_override("panel",dock_style);dock_center.add_child(dock)
 var dock_contents:=VBoxContainer.new();dock.add_child(dock_contents)
 status=Label.new();status.text="Vali tööriist ja joonista plaanile.";status.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER;status.vertical_alignment=VERTICAL_ALIGNMENT_CENTER;status.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;status.add_theme_font_size_override("font_size",12);var hint_style:=StyleBoxFlat.new();hint_style.bg_color=Color("102337");hint_style.border_color=Color("927449");hint_style.set_border_width_all(1);hint_style.set_corner_radius_all(4);status.add_theme_stylebox_override("normal",hint_style);stage_ref.add_child(status);status.set_anchors_preset(Control.PRESET_CENTER_BOTTOM);status.offset_left=-250;status.offset_right=250;status.offset_top=-34;status.offset_bottom=-6
 canvas.message.connect(func(text):status.text=text)
 var toolbar:=HBoxContainer.new();toolbar_ref=toolbar;toolbar.add_theme_constant_override("separation",3);dock_contents.add_child(toolbar)
 category_scroll=preload("res://scripts/house_touch_scroll.gd").new();category_scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_SHOW_NEVER;category_scroll.vertical_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED;category_scroll.custom_minimum_size.y=35;category_scroll.size_flags_horizontal=Control.SIZE_EXPAND_FILL;toolbar.add_child(category_scroll)
 var categories:=HBoxContainer.new();categories.add_theme_constant_override("separation",3);category_scroll.add_child(categories)
 for category in [["area","Ehitusala"],["fence","Aiad"],["outer","Välisseinad"],["inner","Siseseinad"],["door","Uksed"],["window","Aknad"],["settings","Katus"],["facade","Fassaad"],["items","Sisustus"]]:
  var tab=make_button(categories,category[1],select_category.bind(category[0]));tab.toggle_mode=true;category_buttons[category[0]]=tab
 mode_move=make_button(toolbar,"",func():select_mode("move"));mode_move.tooltip_text="Liiguta esemeid";mode_move.toggle_mode=true;mode_move.icon=load("res://assets/house_designer/web_cards/move.png");mode_move.expand_icon=true;mode_move.custom_minimum_size=Vector2(34,34)
 mode_erase=make_button(toolbar,"",func():select_mode("erase"));mode_erase.tooltip_text="Kustuta";mode_erase.toggle_mode=true;mode_erase.icon=load("res://assets/house_designer/web_cards/erase.png");mode_erase.expand_icon=true;mode_erase.custom_minimum_size=Vector2(34,34)
 catalogue_title=Label.new();catalogue_title.visible=false;catalogue_title.add_theme_color_override("font_color",Color("f0d18a"));dock_contents.add_child(catalogue_title)
 catalogue_kind_scroll=preload("res://scripts/house_touch_scroll.gd").new();catalogue_kind_scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_SHOW_NEVER;catalogue_kind_scroll.vertical_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED;catalogue_kind_scroll.custom_minimum_size.y=30;catalogue_kind_scroll.visible=false;dock_contents.add_child(catalogue_kind_scroll)
 catalogue_kind_row=HBoxContainer.new();catalogue_kind_scroll.add_child(catalogue_kind_row)
 card_row=HBoxContainer.new();dock_contents.add_child(card_row)
 card_previous=make_button(card_row,"‹",func():card_scroll.scroll_horizontal=maxi(0,card_scroll.scroll_horizontal-200));card_previous.custom_minimum_size=Vector2(23,90)
 card_scroll=preload("res://scripts/house_touch_scroll.gd").new();card_scroll.custom_minimum_size.y=136;card_scroll.size_flags_horizontal=Control.SIZE_EXPAND_FILL;card_scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_SHOW_NEVER;card_scroll.vertical_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED;card_row.add_child(card_scroll)
 card_next=make_button(card_row,"›",func():card_scroll.scroll_horizontal+=200);card_next.custom_minimum_size=Vector2(23,90)
 var tools:=HBoxContainer.new();tool_cards_row=tools;card_scroll.add_child(tools)
 for entry in [["build-wall","Seintega hoone"],["build-open","Avatud hall"],["plot","Ehitusala"],["pier","Muul"],["rect","Nelinurk"],["round","Ümar"],["line","Vaba sein"],["yard","Õu"],["rail","Aed"],["palisadeLine","Palissaad"],["stoneLine","Kiviaed"],["highStone","Kõrge kivimüür"],["rampart","Muldvall"],["gateLine","Värav"],["partition","Sisesein"],["paintWall","Seinamaterjal"],["door","Uks"],["window","Aken"],["item","Ese"],["move","Liiguta"],["erase","Kustuta"]]:
  var button=make_tool_card(tools,entry[0],entry[1]);tool_buttons[entry[0]]=button
 controls_panel=HFlowContainer.new();dock_contents.add_child(controls_panel)
 style_choices=OptionButton.new();style_choices.custom_minimum_size.x=135;style_choices.item_selected.connect(func(i):
  if canvas.tool=="paintWall":canvas.wall_brush=str(style_choices.get_item_metadata(i))
  else:canvas.style=str(style_choices.get_item_metadata(i)))
 controls_panel.add_child(style_choices)
 item_choices=OptionButton.new();item_choices.custom_minimum_size.x=160;item_choices.item_selected.connect(func(i):canvas.item_type=item_choices.get_item_metadata(i);select_tool("item"));controls_panel.add_child(item_choices)
 options_panel=HFlowContainer.new();dock_contents.add_child(options_panel)
 var options:=options_panel
 var build_label:=Label.new();build_label.text="Ehitise tüüp";options.add_child(build_label)
 build_choices=OptionButton.new();build_choices.item_selected.connect(func(i):set_design_value("build",build_choices.get_item_metadata(i)));options.add_child(build_choices)
 var wall_label:=Label.new();wall_label.text="Sein";options.add_child(wall_label)
 wall_choices=OptionButton.new();wall_choices.item_selected.connect(func(i):set_design_value("wallStyle",wall_choices.get_item_metadata(i)));options.add_child(wall_choices)
 var form_label:=Label.new();form_label.text="Katuse kuju";options.add_child(form_label)
 roof_form_choices=OptionButton.new();roof_form_choices.item_selected.connect(func(i):set_design_value("roofForm",roof_form_choices.get_item_metadata(i)));options.add_child(roof_form_choices)
 var roof_label:=Label.new();roof_label.text="Katusekate";options.add_child(roof_label)
 roof_choices=OptionButton.new();roof_choices.item_selected.connect(func(i):set_design_value("roofMat",roof_choices.get_item_metadata(i)));options.add_child(roof_choices)
 var base_label:=Label.new();base_label.text="Alus";options.add_child(base_label)
 base_choices=OptionButton.new();base_choices.item_selected.connect(func(i):set_design_value("base",base_choices.get_item_metadata(i)));options.add_child(base_choices)
 var porch_label:=Label.new();porch_label.text="Varikatus";options.add_child(porch_label)
 porch_choices=OptionButton.new();porch_choices.item_selected.connect(func(i):set_design_value("porch",porch_choices.get_item_metadata(i)));options.add_child(porch_choices)
 var column_label:=Label.new();column_label.text="Sambad";options.add_child(column_label)
 column_choices=OptionButton.new();column_choices.item_selected.connect(func(i):set_design_value("columns",column_choices.get_item_metadata(i)));options.add_child(column_choices)
 field_options=HBoxContainer.new();options.add_child(field_options)
 var field_edge_label:=Label.new();field_edge_label.text="Põllu serv";field_options.add_child(field_edge_label)
 field_edge_choices=OptionButton.new();field_edge_choices.item_selected.connect(func(i):set_field_value("edge",field_edge_choices.get_item_metadata(i)));field_options.add_child(field_edge_choices)
 var field_crop_label:=Label.new();field_crop_label.text="Vili";field_options.add_child(field_crop_label)
 field_crop_choices=OptionButton.new();field_crop_choices.item_selected.connect(func(i):set_field_value("crop",field_crop_choices.get_item_metadata(i)));field_options.add_child(field_crop_choices)
 var rise_label:=Label.new();rise_label.text="Katuse kõrgus";options.add_child(rise_label)
 height_choices=HSlider.new();height_choices.min_value=60;height_choices.max_value=150;height_choices.step=5;height_choices.custom_minimum_size.x=100;height_choices.value_changed.connect(func(v):set_design_value("roofHeight",v));options.add_child(height_choices)
 var wall_height_label:=Label.new();wall_height_label.text="Seina kõrgus";options.add_child(wall_height_label)
 wall_height_choices=HSlider.new();wall_height_choices.min_value=80;wall_height_choices.max_value=160;wall_height_choices.step=5;wall_height_choices.custom_minimum_size.x=100;wall_height_choices.value_changed.connect(func(v):set_design_value("wallScale",v));options.add_child(wall_height_choices)
 option_groups["roof"]=[form_label,roof_form_choices,roof_label,roof_choices,rise_label,height_choices,wall_height_label,wall_height_choices]
 option_groups["facade"]=[build_label,build_choices,wall_label,wall_choices,base_label,base_choices,porch_label,porch_choices,column_label,column_choices]
 select_category("outer");select_tool("rect")
 setup_web_hud();call_deferred("update_stage_layout")

func style_floor_button(button: Button) -> void:
 style_web_button(button)
 for key in ["normal","hover","pressed","hover_pressed","disabled"]:
  var box=button.get_theme_stylebox(key)
  if box is StyleBoxFlat:box.set_corner_radius_all(5);box.content_margin_left=5;box.content_margin_right=5
 if button==floor_add_button:
  button.add_theme_stylebox_override("normal",button.get_theme_stylebox("pressed"));button.add_theme_color_override("font_color",Color("2b180c"))
 button.add_theme_font_size_override("font_size",12)

func update_card_dimensions(narrow: bool) -> void:
 if card_scroll==null:return
 card_scroll.custom_minimum_size.y=132 if narrow else 136
 var cards:Array=[];cards.append_array(tool_buttons.values());cards.append_array(choice_cards)
 for card in cards:
  if not is_instance_valid(card):continue
  card.custom_minimum_size=Vector2(76,120) if narrow else Vector2(92,128)
  if card.has_meta("card_picture"):
   var picture:TextureRect=card.get_meta("card_picture");picture.offset_bottom=61 if narrow else 82

func refresh_ledger() -> void:
 if not is_instance_valid(ledger_body):return
 ledger_body.visible=ledger_expanded
 ledger_description.visible=ledger_expanded and not ledger_small_mode
 fit_ledger.call_deferred()

func style_web_button(button: Button) -> void:
 var normal:=StyleBoxFlat.new();normal.bg_color=Color("112638");normal.border_color=Color("aa874f");normal.set_border_width_all(1);normal.set_corner_radius_all(18);normal.content_margin_left=9;normal.content_margin_right=9;normal.content_margin_top=3;normal.content_margin_bottom=3
 var hover:StyleBoxFlat=normal.duplicate();hover.bg_color=Color("27445c");hover.border_color=Color("e8c47e")
 var selected:StyleBoxFlat=normal.duplicate();selected.bg_color=Color("e2c995");selected.border_color=Color("f2d39a")
 button.add_theme_stylebox_override("normal",normal);button.add_theme_stylebox_override("hover",hover);button.add_theme_stylebox_override("pressed",selected);button.add_theme_stylebox_override("hover_pressed",selected);button.add_theme_stylebox_override("disabled",normal)
 button.add_theme_color_override("font_color",Color("f0dfb8"));button.add_theme_color_override("font_hover_color",Color("fff1cb"));button.add_theme_color_override("font_pressed_color",Color("2b180c"));button.add_theme_color_override("font_hover_pressed_color",Color("2b180c"));button.add_theme_color_override("font_disabled_color",Color("a99977"))

func web_art(parent: Node,path: String) -> TextureRect:
 var art:=TextureRect.new();art.texture=load(path);art.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);art.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;art.stretch_mode=TextureRect.STRETCH_SCALE;art.mouse_filter=Control.MOUSE_FILTER_IGNORE;parent.add_child(art);return art

func web_orb(parent: Node,glyph: String,tip: String,action: Callable,x:float,y:float,diameter:float) -> Button:
 var button:=Button.new();button.text=glyph;button.tooltip_text=tip;button.focus_mode=Control.FOCUS_NONE;button.flat=true;button.add_theme_font_size_override("font_size",18);button.add_theme_color_override("font_color",Color("eacb86"));button.add_theme_color_override("font_hover_color",Color("fff2c4"));button.pressed.connect(action);button.set_meta("web_x",x);button.set_meta("web_y",y);button.set_meta("web_diameter",diameter);parent.add_child(button);return button

func set_web_orb_icon(button: Button,path: String) -> void:
 button.text="";button.icon=load(path);button.expand_icon=true;button.icon_alignment=HORIZONTAL_ALIGNMENT_CENTER

func setup_web_hud() -> void:
 footer_spacer=Control.new();footer_spacer.mouse_filter=Control.MOUSE_FILTER_IGNORE;layout_ref.add_child(footer_spacer)
 var foot:=TextureRect.new();foot.texture=load("res://assets/house_designer/web-footer-art.webp");foot.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;foot.stretch_mode=TextureRect.STRETCH_SCALE;foot.mouse_filter=Control.MOUSE_FILTER_IGNORE;foot.set_anchors_preset(Control.PRESET_BOTTOM_WIDE);foot.offset_top=-24;add_child(foot)
 map_overlay=Control.new();map_overlay.mouse_filter=Control.MOUSE_FILTER_IGNORE;add_child(map_overlay);web_art(map_overlay,"res://assets/house_designer/web-map-art.webp")
 mini_frame.reparent(map_overlay);mini_frame.add_theme_stylebox_override("panel",StyleBoxEmpty.new());mini_frame.mouse_filter=Control.MOUSE_FILTER_IGNORE
 mini_title_label.reparent(map_overlay);mini_title_label.mouse_filter=Control.MOUSE_FILTER_IGNORE;mini_title_label.add_theme_color_override("font_color",Color("f4d899"));mini_title_label.add_theme_font_size_override("font_size",12)
 var mask:=ShaderMaterial.new();mask.shader=load("res://scripts/house_ui_circle.gdshader");mini_preview.material=mask
 map_face_button=Button.new();map_face_button.flat=true;map_face_button.focus_mode=Control.FOCUS_NONE;map_face_button.tooltip_text="Vaheta plaani ja 3D-vaadet";map_face_button.pressed.connect(toggle_preview);map_overlay.add_child(map_face_button)
 web_map_buttons.append(web_orb(map_overlay,"◉","Plaan / 3D",toggle_preview,0.198,0.165,0.21))
 web_map_buttons.append(web_orb(map_overlay,"+","Suumi sisse",func():zoom_view(1.25),0.422,0.138,0.136))
 web_map_buttons.append(web_orb(map_overlay,"−","Suumi välja",func():zoom_view(0.8),0.61,0.165,0.136))
 web_map_buttons.append(web_orb(map_overlay,"⌖","Kogu plaan",reset_view,0.77,0.253,0.136))
 web_map_buttons.append(web_orb(map_overlay,"↔","Mõõdud",func():canvas.show_dimensions=not canvas.show_dimensions;canvas.queue_redraw(),0.858,0.426,0.136))
 web_map_buttons.append(web_orb(map_overlay,"▦","Võrk",func():snap_button.button_pressed=not snap_button.button_pressed,0.858,0.606,0.136))
 for pair in [[0,"eye"],[1,"zoomIn"],[2,"zoomOut"],[3,"center"]]:set_web_orb_icon(web_map_buttons[pair[0]],"res://assets/house_designer/icon-"+pair[1]+".webp")
 selection_overlay=Control.new();selection_overlay.mouse_filter=Control.MOUSE_FILTER_IGNORE;add_child(selection_overlay);web_art(selection_overlay,"res://assets/house_designer/web-selection-art.webp")
 portrait_view=TextureRect.new();portrait_view.texture=mini_preview.viewport.get_texture();portrait_view.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;portrait_view.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_COVERED;var portrait_mask:=ShaderMaterial.new();portrait_mask.shader=load("res://scripts/house_ui_portrait.gdshader");portrait_view.material=portrait_mask;portrait_view.mouse_filter=Control.MOUSE_FILTER_IGNORE;selection_overlay.add_child(portrait_view)
 portrait_title=Label.new();portrait_title.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER;portrait_title.vertical_alignment=VERTICAL_ALIGNMENT_CENTER;portrait_title.clip_text=true;portrait_title.add_theme_color_override("font_color",Color("352415"));portrait_title.add_theme_font_size_override("font_size",14);portrait_title.mouse_filter=Control.MOUSE_FILTER_IGNORE;selection_overlay.add_child(portrait_title)
 web_selection_buttons.append(web_orb(selection_overlay,"⚒","Ehitusmenüü",func():dock_panel.visible=not dock_panel.visible,0.162,0.657,0.163))
 web_selection_buttons.append(web_orb(selection_overlay,"◉","Plaan / 3D",toggle_preview,0.164,0.462,0.163))
 web_selection_buttons.append(web_orb(selection_overlay,"↶","Võta tagasi",func():restore_history(false),0.255,0.243,0.163))
 web_selection_buttons.append(web_orb(selection_overlay,"↷","Tee uuesti",func():restore_history(true),0.424,0.156,0.163))
 web_selection_buttons.append(web_orb(selection_overlay,"▤","Taasta näidis",reset_design,0.615,0.135,0.163))
 var buildings:=web_orb(selection_overlay,"⌂","Vali hoone",func():show_catalogue(true),0.808,0.144,0.163);web_selection_buttons.append(buildings)
 set_web_orb_icon(web_selection_buttons[0],"res://assets/house_designer/web-build-art.webp")
 set_web_orb_icon(web_selection_buttons[1],"res://assets/house_designer/web-preview-art.webp")
 set_web_orb_icon(web_selection_buttons[4],"res://assets/house_designer/icon-layers.webp")
 set_web_orb_icon(web_selection_buttons[5],"res://assets/house_designer/web-buildings-art.webp")
 era_bar=HBoxContainer.new();era_bar.add_theme_constant_override("separation",2);stage_ref.add_child(era_bar)
 for spec in [["Kiviaeg","stone"],["Pronksiaeg","bronze"],["Rauaaeg","iron"]]:
  var button:=Button.new();var era_index:=era_buttons.size();button.custom_minimum_size=Vector2(130,40);button.toggle_mode=true;button.focus_mode=Control.FOCUS_NONE;button.tooltip_text=str(spec[0]);style_web_button(button);button.pressed.connect(choose_era.bind(era_index));era_bar.add_child(button);era_buttons.append(button)
  var icon:=TextureRect.new();icon.texture=load("res://assets/house_designer/era-"+spec[1]+".webp");icon.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;icon.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_COVERED;icon.material=mask;icon.mouse_filter=Control.MOUSE_FILTER_IGNORE;button.add_child(icon);icon.position=Vector2(4,4);icon.size=Vector2(32,32);era_images.append(icon)
  var label:=Label.new();label.text=spec[0];label.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER;label.vertical_alignment=VERTICAL_ALIGNMENT_CENTER;label.mouse_filter=Control.MOUSE_FILTER_IGNORE;button.add_child(label);label.position=Vector2(37,0);label.size=Vector2(90,40);era_labels.append(label)
 view_caption=Label.new();view_caption.text="PEALTVAADE";view_caption.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER;view_caption.vertical_alignment=VERTICAL_ALIGNMENT_CENTER;view_caption.add_theme_color_override("font_color",Color("f1d394"));view_caption.add_theme_font_size_override("font_size",11);var caption_style:=StyleBoxFlat.new();caption_style.bg_color=Color("102337");caption_style.border_color=Color("927449");caption_style.set_border_width_all(1);caption_style.set_corner_radius_all(4);view_caption.add_theme_stylebox_override("normal",caption_style);stage_ref.add_child(view_caption)
 view_tools=HBoxContainer.new();stage_ref.add_child(view_tools)
 for spec in [["↶","Pööra vasakule",func():preview.yaw-=PI/6;preview.update_camera()],["↷","Pööra paremale",func():preview.yaw+=PI/6;preview.update_camera()],["⌂","Taasta vaade",reset_view],["♟","Kõnni",toggle_walk],["▱","Katus sees / väljas",toggle_roof]]:
  var button:=Button.new();button.text=spec[0];button.tooltip_text=spec[1];button.custom_minimum_size=Vector2(39,39);button.add_theme_font_size_override("font_size",18);style_web_button(button);button.pressed.connect(spec[2]);view_tools.add_child(button)
 set_web_orb_icon(view_tools.get_child(2),"res://assets/house_designer/icon-center.webp");set_web_orb_icon(view_tools.get_child(3),"res://assets/house_designer/icon-walk.webp")
 refresh_web_view()

func position_web_orbs(buttons:Array[Button],area:Vector2) -> void:
 for button in buttons:
  var side:float=area.x*float(button.get_meta("web_diameter"));button.position=Vector2(area.x*float(button.get_meta("web_x")),area.y*float(button.get_meta("web_y")))-Vector2.ONE*side/2;button.size=Vector2.ONE*side

func layout_web_hud(narrow: bool) -> void:
 if not is_instance_valid(map_overlay):return
 var width:=size.x;var height:=size.y;var map_width:float=minf(150,maxf(96,width*0.385)) if narrow else minf(413,width*344/1672.0)
 var right_width:float=minf(210,maxf(150,width*0.54)) if narrow else minf(460,width*384/1672.0)
 var map_height:=map_width*376/344.0;var right_height:=right_width*386/384.0;var bottom:=7.0 if narrow else width*22/1672.0
 footer_spacer.custom_minimum_size.y=maxf(map_height,right_height)+7 if narrow else 0
 map_overlay.size=Vector2(map_width,map_height);map_overlay.position=Vector2(0,height-map_height-bottom)
 selection_overlay.size=Vector2(right_width,right_height);selection_overlay.position=Vector2(width-right_width,height-right_height-bottom)
 mini_frame.position=Vector2(map_width*0.086,map_height*0.254);mini_frame.size=Vector2(map_width*0.694,map_height*0.632)
 map_face_button.position=mini_frame.position;map_face_button.size=mini_frame.size
 mini_title_label.position=Vector2(map_width*0.12,map_height*0.78);mini_title_label.size=Vector2(map_width*0.63,20)
 portrait_view.position=Vector2(right_width*0.29,right_height*0.25);portrait_view.size=Vector2(right_width*0.59,right_height*0.56)
 portrait_title.position=Vector2(right_width*0.33,right_height*0.70);portrait_title.size=Vector2(right_width*0.48,right_height*0.12)
 position_web_orbs(web_map_buttons,map_overlay.size);position_web_orbs(web_selection_buttons,selection_overlay.size)
 var compact:=width<560;var era_width:=129.0 if compact else 390.0;era_bar.position=Vector2((stage_ref.size.x-era_width)/2,8);era_bar.size=Vector2(era_width,40)
 for i in era_buttons.size():
  era_buttons[i].custom_minimum_size=Vector2(42 if compact else 130,40);era_labels[i].visible=not compact
  era_images[i].modulate=Color.WHITE if i==era else Color(0.72,0.72,0.72)
 update_card_dimensions(narrow)
 for button in [floor_controls[0],floor_controls[1],floor_add_button,floor_copy_button,floor_remove_button]:button.add_theme_font_size_override("font_size",11 if compact else 12);button.custom_minimum_size.y=28 if compact else 32
 floor_bar_ref.offset_top=112 if compact else 129;floor_bar_ref.offset_bottom=floor_bar_ref.offset_top+32
 var floor_width:=floor_bar_ref.get_combined_minimum_size().x+12;floor_background.position=Vector2((stage_ref.size.x-floor_width)/2,floor_bar_ref.offset_top-4);floor_background.size=Vector2(floor_width,40)
 view_caption.position=Vector2(10 if compact else (stage_ref.size.x-130)/2,52 if compact else 58);view_caption.size=Vector2(130,24)
 roof_overlay.offset_left=-158 if compact else -214;roof_overlay.offset_right=-8 if compact else -14
 roof_overlay.offset_top=8 if compact else 70;roof_overlay.offset_bottom=roof_overlay.offset_top+105
 view_tools.position=Vector2(maxf(0,stage_ref.size.x-223),maxf(0,stage_ref.size.y-50) if compact else 12)
 var hint_width:=minf(500,maxf(200,width-30));status.offset_left=-hint_width/2;status.offset_right=hint_width/2;status.offset_top=-50 if compact else -34

func refresh_web_view() -> void:
 if not is_instance_valid(view_tools):return
 view_tools.visible=preview.visible and not preview.walking
 view_caption.text=("3D · KATUSEGA" if preview.roof_visible else "3D · KATUSETA") if preview.visible else "PEALTVAADE"

func editor_panel_style() -> StyleBoxTexture:
 var style:=StyleBoxTexture.new();style.texture=load("res://assets/house_designer/editor-panel-art.webp")
 style.texture_margin_left=45;style.texture_margin_right=45;style.texture_margin_top=45;style.texture_margin_bottom=45
 style.content_margin_left=16;style.content_margin_right=16;style.content_margin_top=16;style.content_margin_bottom=16
 return style

func make_button(parent: Node,text: String,action: Callable) -> Button:
 var button:=Button.new();button.text=text;button.custom_minimum_size.y=34;style_web_button(button);button.pressed.connect(action);parent.add_child(button);return button

func make_tool_card(parent: Node,id: String,title: String) -> Button:
 var button:=Button.new();button.toggle_mode=true;button.custom_minimum_size=Vector2(92,128);button.pressed.connect(select_tool.bind(id));parent.add_child(button)
 var frame:=StyleBoxTexture.new();frame.texture=load("res://assets/house_designer/editor-card-art.webp")
 for state in ["normal","hover","focus"]:button.add_theme_stylebox_override(state,frame)
 var active: StyleBoxTexture=frame.duplicate();active.modulate_color=Color(1.25,1.18,0.75);button.add_theme_stylebox_override("pressed",active)
 var picture:=TextureRect.new();picture.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;picture.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_CENTERED;picture.mouse_filter=Control.MOUSE_FILTER_IGNORE;button.add_child(picture);picture.set_anchors_preset(Control.PRESET_TOP_WIDE);picture.offset_left=8;picture.offset_right=-8;picture.offset_top=6;picture.offset_bottom=82
 var icon_path: String="res://assets/house_designer/web_cards/"+str(TOOL_IMAGES.get(id,id))+".png"
 if ResourceLoader.exists(icon_path):picture.texture=load(icon_path)
 button.set_meta("card_picture",picture)
 var label:=Label.new();label.text=title;label.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER;label.vertical_alignment=VERTICAL_ALIGNMENT_CENTER;label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;label.add_theme_font_size_override("font_size",11);label.add_theme_color_override("font_color",Color("352415"));label.mouse_filter=Control.MOUSE_FILTER_IGNORE;button.add_child(label);label.set_anchors_preset(Control.PRESET_BOTTOM_WIDE);label.offset_left=3;label.offset_right=-3;label.offset_top=-34;label.offset_bottom=-3
 return button

func select_category(id: String) -> void:
 selected_category=id
 if is_instance_valid(status):
  var hints={"area":"Lohista ehitusala kaks vastasnurka.","fence":"Vali aed ja lohista lõik. Olemasolevasse aeda saab lisada värava.","outer":"Lohista valmis kuju või joonista seinad ükshaaval. Kolmest seinast saab varjualuse.","inner":"Joonista hoone põrandale sisesein.","door":"Vali uks ja puuduta sobivat seina.","window":"Vali aken ja puuduta välisseina.","items":"Vali ese ja aseta see hoonesse või õue.","settings":"Vali katuse kuju ja kate.","facade":"Vali seinad, alus, varikatus ja sambad."}
  status.text=str(hints.get(id,"Vali tööriist ja joonista plaanile."))
 for key in category_buttons:category_buttons[key].button_pressed=key==id
 if category_buttons.has(id) and is_instance_valid(category_scroll):category_scroll.call_deferred("ensure_control_visible",category_buttons[id])
 for key in tool_buttons:
  var in_category:bool=id in ["outer","inner"] if key=="paintWall" else TOOL_GROUPS.get(key,"")==id
  tool_buttons[key].visible=in_category and (key!="pier" or pier_available) and (key not in ["highStone","rampart"] or era>=1)
 if card_scroll!=null:
  card_scroll.visible=id not in ["settings","facade"] or (not canvas.design.is_empty() and not canvas.current_plan().get("field") is Dictionary)
  card_row.visible=card_scroll.visible;card_scroll.scroll_horizontal=0
 if controls_panel!=null:controls_panel.visible=false
 if item_choices!=null:item_choices.visible=id=="items"
 if options_panel!=null:options_panel.visible=id=="settings" and not canvas.design.is_empty() and canvas.current_plan().get("field") is Dictionary
 update_option_visibility()
 rebuild_choice_cards()

func rebuild_choice_cards() -> void:
 if tool_cards_row==null or canvas==null:return
 for card in choice_cards:card.queue_free()
 choice_cards.clear()
 var painting:bool=selected_category in ["outer","inner"] and canvas.tool=="paintWall"
 if not painting and selected_category not in ["door","window","items","settings","facade"]:return
 if selected_category in ["settings","facade"] and (canvas.design.is_empty() or canvas.current_plan().get("field") is Dictionary):return
 var choices:=[]
 if painting:
  choices.append({"key":"paintWall","value":"","field":"brush","title":"Vaikematerjal"})
  for finish in Catalog.data.ERA_WALLS[era]:choices.append({"key":"mat-"+str(finish),"value":str(finish),"field":"brush","title":str(WALL_LABELS.get(str(finish),finish))})
 elif selected_category in ["door","window"]:
  var styles:Array=Catalog.data.DOOR_STYLES if selected_category=="door" else Catalog.data.WINDOW_STYLES
  var labels={"hide":"Nahkuks","wattle":"Punutud uks","plank":"Lauduks","double":"Kahepoolne uks","arched":"Kaaruks","mycenaean":"Mükeene uks","greek":"Kreeka uks","hole":"Valgusava","shutter":"Luugiga aken","slit":"Laskeava","lattice":"Võreaken","archwin":"Kaaraken"}
  for entry in styles:
   if int(entry[2])<=era:choices.append({"key":selected_category+"-"+str(entry[0]),"value":str(entry[0]),"title":str(labels.get(entry[0],entry[1]))})
 elif selected_category=="settings":
  for pair in [[roof_form_choices,"roof-","roofForm"],[roof_choices,"rmat-","roofMat"]]:
   var control:OptionButton=pair[0]
   for i in control.item_count:
    var value:=str(control.get_item_metadata(i));choices.append({"key":str(pair[1])+value,"value":value,"field":str(pair[2]),"title":control.get_item_text(i)})
 elif selected_category=="facade":
  for pair in [[wall_choices,"mat-","wallStyle"],[base_choices,"base-","base"],[porch_choices,"porch-","porch"],[column_choices,"col-","columns"]]:
   var control:OptionButton=pair[0]
   for i in control.item_count:
    var value:=str(control.get_item_metadata(i));choices.append({"key":str(pair[1])+value,"value":value,"field":str(pair[2]),"title":control.get_item_text(i)})
 else:
  var names:=ITEM_LABELS
  for i in item_choices.item_count:
   var key:=str(item_choices.get_item_metadata(i));choices.append({"key":key,"value":key,"title":str(names.get(key,item_choices.get_item_text(i)))})
 for choice in choices:
  var key:String=choice.key;var value:String=choice.value;var category:=selected_category;var field:=str(choice.get("field",""))
  var card:=make_tool_card(tool_cards_row,key,str(choice.title));card.pressed.disconnect(select_tool.bind(key))
  card.pressed.connect(func():
   if field=="brush":
    canvas.wall_brush=value
    for i in style_choices.item_count:
     if style_choices.get_item_metadata(i)==value:style_choices.select(i);break
    for other in choice_cards:other.set_pressed_no_signal(other==card)
    return
   if category in ["settings","facade"]:set_design_value(field,value);sync_options_from_plan();return
   select_tool("item" if category=="items" else category)
   if category=="items":
    canvas.item_type=value
    for i in item_choices.item_count:
     if item_choices.get_item_metadata(i)==value:item_choices.select(i);break
   else:
    canvas.style=value
    for i in style_choices.item_count:
     if style_choices.get_item_metadata(i)==value:style_choices.select(i);break
   for other in choice_cards:other.set_pressed_no_signal(other==card))
  if category in ["settings","facade"] or field=="brush":
   if field!="brush":card.set_meta("plan_field",field);card.set_meta("plan_value",value)
   if field in ["wallStyle","brush"]:
    for extension in ["webp","jpeg"]:
     var texture_path:String="res://assets/house_designer/web_cards/swatch-"+value+"."+str(extension)
     if ResourceLoader.exists(texture_path):card.get_meta("card_picture").texture=load(texture_path);break
  choice_cards.append(card)
 sync_roof_cards();update_card_dimensions(size.x<900)
 if selected_category=="door":tool_buttons.door.visible=false
 elif selected_category=="window":tool_buttons.window.visible=false
 elif selected_category=="items":tool_buttons.item.visible=false

func update_option_visibility() -> void:
 if options_panel==null:return
 var field:bool=not canvas.design.is_empty() and canvas.current_plan().get("field") is Dictionary
 for group in option_groups:
  for control in option_groups[group]:control.visible=not field and ((selected_category=="settings" and group=="roof") or (selected_category=="facade" and group=="facade"))
 if field_options!=null:field_options.visible=field and selected_category=="settings"

func sync_roof_cards() -> void:
 if canvas.design.is_empty():return
 var plan:Dictionary=canvas.current_plan()
 for card in choice_cards:
  if card.has_meta("plan_field"):card.set_pressed_no_signal(str(plan.get(str(card.get_meta("plan_field")),""))==str(card.get_meta("plan_value")))

func save_current_design() -> void:
 if str(canvas.design.get("id",""))!=embedded_id:
  status.text="Salvestamiseks vali uuesti „%s“." % embedded_name;status.visible=true;return
 accepted.emit(canvas.design.duplicate(true));queue_free()

func project_label(id: String) -> String:
 if id==embedded_id:return embedded_name
 var base:=id.split("@")[0];var entry:Dictionary=EconomyData.data.buildings.get(base,{})
 return str(entry.get("name",Catalog.data.catalog.get(id,{}).get("name",id)))

func choose_era(target: int) -> void:
 if target<0 or target>2:return
 var id:=str(last_of_era.get(target,""))
 if id.is_empty():
  var preferred:="house@1" if target==1 else "house@2" if target==2 else "house"
  if Defaults.data.has(preferred):id=preferred
  else:
   for key in Defaults.data:
    if int(Catalog.data.catalog.get(key,{}).get("era",-1))==target:id=key;break
 if not id.is_empty():select_preview_project(id)
 catalogue_filter="";show_catalogue(true)

func select_preview_project(id: String) -> void:
 if not Defaults.data.has(id) or int(Catalog.data.catalog.get(id,{}).get("era",3))>2:return
 if preview.walking:preview.stop_walking();walk_button.text="Kõnni"
 if not canvas.design.is_empty():
  design_drafts[str(canvas.design.id)]={"design":canvas.design.duplicate(true),"history":canvas.history.duplicate(true),"future":canvas.future.duplicate(true),"floor":canvas.active_floor}
 var draft:Dictionary=design_drafts.get(id,{})
 var design:Dictionary=draft.get("design",{})
 catalogue_open=false;open_design(id,project_label(id),design,true)
 if not draft.is_empty():
  canvas.history=draft.history.duplicate(true);canvas.future=draft.future.duplicate(true);canvas.active_floor=int(draft.floor)
  preview.set_active_floor(canvas.active_floor);sync_floor_controls();sync_options_from_plan();mini_plan.show_design(canvas.current_plan());canvas.queue_redraw()
 catalogue_filter="";show_catalogue(false)

func show_catalogue(value: bool) -> void:
 catalogue_open=value;toolbar_ref.visible=not value;catalogue_title.visible=value;catalogue_kind_scroll.visible=value
 if value:
  if preview.walking:preview.stop_walking();walk_button.text="Kõnni"
  dock_panel.visible=true;card_row.visible=true;card_scroll.visible=true;controls_panel.visible=false;options_panel.visible=false
  for key in tool_buttons:tool_buttons[key].visible=false
  build_catalogue()
 else:
  if preview.visible:dock_panel.visible=false
  else:dock_panel.visible=true
  select_category(selected_category)

func build_catalogue() -> void:
 for card in choice_cards:card.queue_free()
 choice_cards.clear();catalogue_buttons.clear()
 for child in catalogue_kind_row.get_children():child.queue_free()
 var kinds: Array[String]=[]
 for id in Defaults.data:
  var def:Dictionary=Catalog.data.catalog.get(id,{})
  if int(def.get("era",-1))!=era:continue
  var kind:=str(def.get("kind","Muud"))
  if kind not in kinds:kinds.append(kind)
 var label_by_kind={"Homes":"Elamud","Food":"Toit","Industry":"Tootmine","Defence":"Kaitse","Defense":"Kaitse","Civic":"Avalik","Military":"Sõjavägi","Infrastructure":"Taristu","Production and crafts":"Tootmine ja käsitöö","Knowledge and trade":"Teadus ja kaubandus","Food and farming":"Toit ja põllumajandus","Sample towns":"Näidisasulad"}
 var all_kinds:Array=[""];all_kinds.append_array(kinds)
 for kind in all_kinds:
  var selected_kind:=str(kind);var chip:=make_button(catalogue_kind_row,"Kõik" if selected_kind.is_empty() else str(label_by_kind.get(selected_kind,selected_kind)),func():catalogue_filter=selected_kind;build_catalogue());chip.toggle_mode=true;chip.set_pressed_no_signal(catalogue_filter==selected_kind);chip.custom_minimum_size.y=28
 catalogue_title.text=["Kiviaeg","Pronksiaeg","Rauaaeg"][era]+" · vali hoone või ehitusala"
 var back:=make_tool_card(tool_cards_row,"catalogue-back","← Tagasi");back.pressed.disconnect(select_tool.bind("catalogue-back"));back.pressed.connect(func():show_catalogue(false));choice_cards.append(back)
 for id in Defaults.data:
  var definition:Dictionary=Catalog.data.catalog.get(id,{})
  if int(definition.get("era",-1))!=era or (not catalogue_filter.is_empty() and str(definition.get("kind","Muud"))!=catalogue_filter):continue
  var project_id:=str(id);var card:=make_tool_card(tool_cards_row,project_id,project_label(project_id));card.pressed.disconnect(select_tool.bind(project_id));card.pressed.connect(func():select_preview_project(project_id))
  var portrait_path:="res://assets/house_designer/portraits/"+project_id+".webp"
  if ResourceLoader.exists(portrait_path):card.get_meta("card_picture").texture=load(portrait_path)
  card.set_pressed_no_signal(project_id==str(canvas.design.get("id","")));choice_cards.append(card);catalogue_buttons[project_id]=card
 card_scroll.scroll_horizontal=0;update_card_dimensions(size.x<900)

func open_design(id: String,name: String,current: Dictionary={},from_catalogue:=false) -> bool:
 if not Defaults.data.has(id):return false
 if not from_catalogue:
  embedded_id=id;embedded_name=name;design_drafts.clear();last_of_era.clear()
 reset_button.visible=id==embedded_id and not current.is_empty() and current.get("id","")==id
 building_name=name;title_label.text=name;era=clampi(int(Catalog.data.catalog[id].get("era",0)),0,2);last_of_era[era]=id
 var saved:Dictionary=current if current.get("id","")==id else Defaults.data[id]
 category_buttons.settings.text="Põllu seaded" if saved.get("field") is Dictionary else "Katus"
 category_buttons.facade.visible=not saved.get("field") is Dictionary
 for child in options_panel.get_children():
  if child!=field_options:child.visible=not saved.get("field") is Dictionary
 var definition:Dictionary=Catalog.data.catalog[id]
 var default_category:=default_category_for(saved)
 pier_available=str(definition.get("base",id))=="fisher" or bool(definition.get("coast",false));select_category(default_category)
 canvas.load_design(saved,era)
 mini_preview.show_design(saved);mini_plan.show_design(saved)
 if preview.visible:preview.show_design(saved)
 if is_instance_valid(portrait_title):portrait_title.text=name
 var portrait_path:="res://assets/house_designer/portraits/"+id+".webp"
 if not ResourceLoader.exists(portrait_path):portrait_path="res://assets/house_designer/portraits/"+str(id).split("@")[0]+".webp"
 if ResourceLoader.exists(portrait_path):
  var portrait_texture:Texture2D=load(portrait_path);portrait_view.texture=portrait_texture;ledger_portrait.texture=portrait_texture
 ledger_name.text=name;ledger_kind.text="ELAMUD" if str(Catalog.data.catalog[id].get("kind",""))=="Homes" else "EHITIS"
 var descriptions={"house":"Ümar maja tulekolde ja seinaäärse magamisasemega.","hall":"Pikk elamu ühise ruumi ja tulekoldega.","fisher":"Rannahoone kala püüdmiseks ja kuivatamiseks."};ledger_description.text=str(descriptions.get(str(id).split("@")[0],"Kujunda hoone, õu ja sisustus."))
 sync_floor_controls();refresh_ledger()
 for i in era_buttons.size():
  era_buttons[i].set_pressed_no_signal(i==era);era_buttons[i].disabled=false
  era_images[i].modulate=Color.WHITE if i==era else Color(0.72,0.72,0.72)
  era_labels[i].add_theme_color_override("font_color",Color("2b180c" if i==era else "cdb98e"))
 update_measurements(saved)
 build_choices.clear()
 for entry in [["wall","Seintega hoone"],["open","Avatud hall"]]:build_choices.add_item(entry[1]);build_choices.set_item_metadata(build_choices.item_count-1,entry[0])
 if saved.get("build","wall")=="tower":build_choices.add_item("Torn");build_choices.set_item_metadata(build_choices.item_count-1,"tower")
 for i in build_choices.item_count:
  if build_choices.get_item_metadata(i)==saved.get("build","wall"):build_choices.select(i);break
 wall_choices.clear()
 for style in Catalog.data.ERA_WALLS[era]:
  add_wall_choice(wall_choices,str(style))
  if style==saved.get("wallStyle",""):wall_choices.select(wall_choices.item_count-1)
 roof_form_choices.clear()
 for entry in [["gable","Viilkatus",0],["hip","Kelpkatus",0],["pediment","Frontoon",1],["flat","Lamekatus",1],["terrace","Madal räästakatus",1]]:
  if int(entry[2])>era:continue
  roof_form_choices.add_item(entry[1]);roof_form_choices.set_item_metadata(roof_form_choices.item_count-1,entry[0])
  if entry[0]==saved.get("roofForm",""):roof_form_choices.select(roof_form_choices.item_count-1)
 if saved.get("roofForm","") not in ["gable","hip","pediment","flat","terrace"]:
  roof_form_choices.add_item(str(saved.get("roofForm","")));roof_form_choices.set_item_metadata(roof_form_choices.item_count-1,saved.get("roofForm",""));roof_form_choices.select(roof_form_choices.item_count-1)
 roof_choices.clear()
 for entry in [["reed","Roog",0],["bark","Kasetoht",0],["sod","Mätas",0],["plank","Lauad",1],["shingle","Sindlid",2],["tile","Katusekivi",1],["earth","Savikatus",1]]:
  if int(entry[2])>era:continue
  roof_choices.add_item(entry[1]);roof_choices.set_item_metadata(roof_choices.item_count-1,entry[0])
  if entry[0]==saved.get("roofMat",""):roof_choices.select(roof_choices.item_count-1)
 base_choices.clear()
 for entry in [["none","Maapinnal",0],["plinth","Sokkel",0],["steps","Astmed",1]]:
  if int(entry[2])>era:continue
  base_choices.add_item(entry[1]);base_choices.set_item_metadata(base_choices.item_count-1,entry[0])
  if entry[0]==saved.get("base","none"):base_choices.select(base_choices.item_count-1)
 porch_choices.clear()
 for entry in [["none","Puudub"],["front","Ees"],["all","Ümberringi"]]:
  porch_choices.add_item(entry[1]);porch_choices.set_item_metadata(porch_choices.item_count-1,entry[0])
  if entry[0]==saved.get("porch","none"):porch_choices.select(porch_choices.item_count-1)
 porch_choices.disabled=era<1
 column_choices.clear()
 for entry in [["post","Puitpost",0],["minoan","Minose sammas",1],["tuscan","Toscana sammas",2],["doric","Dooria sammas",2],["ionic","Joonia sammas",2]]:
  if int(entry[2])>era:continue
  column_choices.add_item(entry[1]);column_choices.set_item_metadata(column_choices.item_count-1,entry[0])
  if entry[0]==saved.get("columns","post"):column_choices.select(column_choices.item_count-1)
 field_options.visible=saved.get("field") is Dictionary
 field_edge_choices.clear();field_crop_choices.clear()
 for entry in [["ridge","Muldvall",0],["stones","Kivirida",0],["rail","Lattaed",1],["ditch","Kraav",2]]:
  if int(entry[2])>era:continue
  field_edge_choices.add_item(entry[1]);field_edge_choices.set_item_metadata(field_edge_choices.item_count-1,entry[0])
 for entry in [["barley","Oder",0],["wheat","Nisu",0],["fallow","Kesal",0],["beans","Põlduba",1],["rye","Rukis",2]]:
  if int(entry[2])>era:continue
  field_crop_choices.add_item(entry[1]);field_crop_choices.set_item_metadata(field_crop_choices.item_count-1,entry[0])
 height_choices.set_value_no_signal(float(saved.get("roofHeight",75)));wall_height_choices.set_value_no_signal(float(saved.get("wallScale",100)))
 sync_options_from_plan();update_option_visibility()
 item_choices.clear()
 for kind in Catalog.data.choices.get(id,[]):
  if Catalog.data.items.has(kind):item_choices.add_item(str(ITEM_LABELS.get(kind,Catalog.data.items[kind][0])));item_choices.set_item_metadata(item_choices.item_count-1,kind)
 if item_choices.item_count>0:canvas.item_type=item_choices.get_item_metadata(0)
 rebuild_choice_cards()
 select_tool({"outer":"rect","area":"plot","fence":"rail","items":"item"}[default_category])
 return true

func add_wall_choice(control: OptionButton,style: String) -> void:
 control.add_theme_constant_override("icon_max_width",24)
 control.get_popup().add_theme_constant_override("icon_max_width",24)
 var label: String=WALL_LABELS.get(style,style)
 var path: String="res://assets/house_designer/"+str(WALL_TEXTURES.get(style,""))+".webp"
 if WALL_TEXTURES.has(style) and ResourceLoader.exists(path):control.add_icon_item(load(path),label)
 else:control.add_item(label)
 control.set_item_metadata(control.item_count-1,style)

func update_measurements(design: Dictionary) -> void:
 var geometry:Dictionary=Geometry.plan_geometry(design);var polygons: Array=geometry.floors
 var estimate:=Survey.estimate(design);var costs:PackedStringArray=[]
 for entry in [["wood","Puit"],["stone","Kivi"],["clay","Savi"],["reed","Roog"],["plank","Lauad"],["cutstone","Tahukivi"],["bronze","Pronks"],["iron","Raud"]]:
  var amount:=int(estimate.get(entry[0],0))
  if amount>0 or entry[0] in ["wood","stone","clay","reed"]:costs.append("%s %d" % [entry[1],amount])
 estimate_label.text="Hinnang: "+" · ".join(costs)
 for key in resource_widgets:
  var amount:=int(estimate.get(key,0));resource_widgets[key].row.visible=amount>0;resource_widgets[key].label.text=str(amount)
 var low:=Vector2(INF,INF);var high:=Vector2(-INF,-INF);var area:=0.0
 for polygon in polygons:
  var points: PackedVector2Array=polygon
  var signed_area:=0.0
  for i in points.size():
   var p: Vector2=points[i];var q: Vector2=points[(i+1)%points.size()]
   low.x=minf(low.x,p.x);low.y=minf(low.y,p.y);high.x=maxf(high.x,p.x);high.y=maxf(high.y,p.y)
   signed_area+=p.x*q.y-q.x*p.y
  area+=absf(signed_area)/2.0
 var scale: float=Geometry.PX_PER_M
 measurements.text="Mõõdud: —" if polygons.is_empty() else "%.1f × %.1f m · ruumid kokku %.1f m²" % [(high.x-low.x)/scale,(high.y-low.y)/scale,area/(scale*scale)]
 var doors:=0;var windows:=0
 for opening in design.get("openings",[]):
  if opening.get("type")=="door":doors+=1
  elif opening.get("type")=="window":windows+=1
 var outer:=0.0;var inner:=0.0;var fence:=0.0
 for wall in geometry.walls:
  for span in Geometry.split_wall(wall,design):
   if span.get("type","")=="door":continue
   var length:float=span.a.distance_to(span.b)/scale
   if span.group=="outer":outer+=length
   else:inner+=length
 for part in design.get("fences",[]):fence+=Geometry.point(part.a).distance_to(Geometry.point(part.b))/scale
 var site:=0.0
 for key in ["plot","yard"]:
  var polygon:Variant=design.get(key)
  if not polygon is Array or polygon.size()<3:continue
  var signed:=0.0
  for i in polygon.size():
   var a:Vector2=Geometry.point(polygon[i]);var b:Vector2=Geometry.point(polygon[(i+1)%polygon.size()]);signed+=a.cross(b)
  site=maxf(site,absf(signed)/(2*scale*scale))
 var lines:PackedStringArray=[]
 for check in design_checklist(design):lines.append(("✓ " if check[1] else "○ ")+str(check[0]))
 lines.append("")
 if area>0:lines.append("Pindala: %.1f m²" % (area/(scale*scale)))
 if site>0:lines.append(("Ehitusala: %.0f m²" if design.get("openSite",false) else "Õu: %.0f m²") % site)
 if outer>0:lines.append("Välisseinad: %.1f m" % outer)
 if inner>0:lines.append("Siseseinad: %.1f m" % inner)
 if fence>0:lines.append("Aiad: %.1f m" % fence)
 lines.append("Uksed: %d · aknad: %d" % [doors,windows]);lines.append("Esemed: %d" % design.get("items",[]).size());lines.append("Suurim ruum: %.1f m" % [8.5,10.5,12.3][era])
 ledger_text.text="\n".join(lines)
 fit_ledger.call_deferred()

func fit_ledger() -> void:
 if not is_instance_valid(stage_ref) or not is_instance_valid(ledger_text):return
 if not ledger_expanded:
  ledger.size=Vector2(190 if ledger_small_mode else 230,68);return
 var needed:=ledger_text.get_combined_minimum_size().y+ledger_description.get_combined_minimum_size().y+100
 ledger.size=Vector2(190 if ledger_small_mode else 230,minf(460,minf(maxf(150,needed),maxf(150,stage_ref.size.y-24))))

func update_stage_layout() -> void:
 if not is_instance_valid(stage_ref) or not is_instance_valid(mini_frame):return
 var width:=size.x;var narrow:=width<900
 dock_panel.custom_minimum_size.x=minf(710,maxf(240,width-16))
 overview_button.visible=narrow;ledger.visible=width>=560 or mobile_ledger_open;mini_frame.visible=true
 if ledger_small_mode!=(width<900):ledger_small_mode=width<900;ledger_expanded=not ledger_small_mode
 refresh_ledger()
 title_label.visible=not narrow;measurements.visible=width>=1400;estimate_label.visible=false
 var compact:=width<560
 save_button.text="Salv." if compact else "Salvesta";close_button.text="✕" if compact else "Sulge"
 save_button.tooltip_text="Salvesta kujundus";close_button.tooltip_text="Sulge kujundaja"
 for key in resource_widgets:
  resource_widgets[key].icon.custom_minimum_size=Vector2(16,16) if compact else Vector2(22,22)
  resource_widgets[key].label.add_theme_font_size_override("font_size",11 if compact else 13)
 header_brand.custom_minimum_size.x=110 if narrow else 150
 layout_web_hud(narrow);fit_ledger()

func design_checklist(design: Dictionary) -> Array:
 var rows:Array=[];var items:Array=design.get("items",[]);var openings:Array=design.get("openings",[]);var rooms:Array=design.get("rooms",[])
 var has=func(type):return items.any(func(item):return item.get("type","")==type)
 if design.get("upperLevel",false):
  return [["Teise korruse seinad",not rooms.is_empty()],["Ukseava",openings.any(func(o):return o.get("type","")=="door")],["Aken",openings.any(func(o):return o.get("type","")=="window")]]
 if not design.get("openSite",false):
  var structure:=not rooms.is_empty()
  for run in design.get("wallRuns",[]):
   if Geometry.shelter_shape(run):structure=true;break
  rows.append(["Välisseinad suletud",structure]);rows.append(["Uks välisseinas",openings.any(func(o):return o.get("type","")=="door" and o.get("group","")=="outer")]);rows.append(["Katus olemas",structure])
  var definition:Dictionary=Catalog.data.catalog.get(str(design.get("id","")),{})
  if definition.get("kind","")=="Homes":rows.append(["Tulekolle",has.call("fire")]);rows.append(["Magamiskoht",has.call("bed")])
  else:rows.append(["Töövahendid (2+)",items.size()>=2])
  var wide_count:=0;var supported:=true
  for room in rooms:
   var polygon:PackedVector2Array=Geometry.room_polygon(room);var low:=Vector2(INF,INF);var high:=Vector2(-INF,-INF)
   for point in polygon:low=low.min(point);high=high.max(point)
   if minf(high.x-low.x,high.y-low.y)<=5*Geometry.PX_PER_M:continue
   wide_count+=1;var found:=false
   for item in items:
    if item.get("type","") in ["post","column","pillar"] and Geometry.inside(Geometry.point(item.point),polygon):found=true;break
   if not found:supported=false
  if wide_count>0:rows.append(["Katuse toed",supported])
  rows.append(["Õu",design.get("yard")!=null])
 else:
  var id:=str(design.get("id","")).split("@")[0];var fences:Array=design.get("fences",[])
  var wall:=fences.any(func(f):return f.get("kind","") in ["palisadeLine","stoneLine","highStone","rampart"])
  if id=="watchtower":rows.append(["Vahitorn",has.call("tower")]);rows.append(["Müür torni kõrval",wall])
  elif id in ["palisade","woodgate","stonewall","reinforced_wall"]:
   rows.append(["Palissaad või kivimüür",wall])
   if id=="woodgate":rows.append(["Värav",fences.any(func(f):return f.get("kind","")=="gateLine")])
   rows.append(["Vahitorn",has.call("tower")])
  elif design.get("field") is Dictionary:
   var edges={"ridge":"Muldvall","stones":"Kivirida","rail":"Lattaed","ditch":"Kraav"};var crops={"barley":"Oder","wheat":"Nisu","fallow":"Kesal","beans":"Põlduba","rye":"Rukis"}
   rows.append(["Põllu ala",design.get("plot")!=null]);rows.append(["Serv: "+str(edges.get(str(design.field.get("edge","")),"—")),true]);rows.append(["Vili: "+str(crops.get(str(design.field.get("crop","")),"—")),true])
  else:rows.append(["Ehitusala",design.get("plot")!=null]);rows.append(["Töövahendid",not items.is_empty()])
 return rows

func select_mode(id: String) -> void:
 if canvas.tool==id:
  select_tool({"area":"plot","fence":"rail","outer":"rect","inner":"partition","door":"door","window":"window","items":"item"}.get(selected_category,"rect"))
 else:select_tool(id)

func select_tool(id: String) -> void:
 if id in ["build-wall","build-open"]:
  set_design_value("build","wall" if id=="build-wall" else "open");sync_options_from_plan();return
 var previous_tool:String=canvas.tool
 canvas.tool=id
 if is_instance_valid(mode_move):mode_move.set_pressed_no_signal(id=="move");mode_erase.set_pressed_no_signal(id=="erase")
 if controls_panel!=null:controls_panel.visible=false
 style_choices.clear();style_choices.visible=id in ["door","window","paintWall"]
 if id=="paintWall":
  canvas.wall_brush=str(canvas.current_plan().get("wallStyle",""))
  style_choices.add_item("Seina vaikematerjal");style_choices.set_item_metadata(0,"")
  for finish in Catalog.data.ERA_WALLS[era]:
   add_wall_choice(style_choices,str(finish))
   if finish==canvas.wall_brush:style_choices.select(style_choices.item_count-1)
 if id in ["door","window"]:
  var choices:Array=Catalog.data.WINDOW_STYLES if id=="window" else Catalog.data.DOOR_STYLES
  canvas.style=("hole" if era<2 else "shutter") if id=="window" else ["hide","mycenaean","greek"][era]
  for choice in choices:
   if int(choice[2])>era:continue
   style_choices.add_item(str(choice[1]));style_choices.set_item_metadata(style_choices.item_count-1,choice[0])
   if choice[0]==canvas.style:style_choices.select(style_choices.item_count-1)
 for key in tool_buttons:
  if key not in ["build-wall","build-open"]:tool_buttons[key].button_pressed=key==id
 if selected_category in ["outer","inner"] and (id=="paintWall" or previous_tool=="paintWall"):
  rebuild_choice_cards()
  if id=="paintWall" and not choice_cards.is_empty():card_scroll.call_deferred("ensure_control_visible",choice_cards[0])

func reset_design() -> void:
 var id:String=canvas.design.get("id","")
 if Defaults.data.has(id):
  var previous_floor:int=canvas.active_floor;canvas.active_floor=0;canvas.apply_design(Defaults.data[id].duplicate(true),previous_floor)
  var category:=default_category_for(canvas.design);select_category(category);select_tool({"outer":"rect","area":"plot","fence":"rail","items":"item"}[category])

func default_category_for(design: Dictionary) -> String:
 if not design.get("openSite",false):return "outer"
 var base_id:=str(design.get("id","")).split("@")[0]
 if base_id=="watchtower":return "items"
 return "fence" if base_id in ["palisade","woodgate","stonewall","reinforced_wall"] else "area"

func sync_floor_controls() -> void:
 if canvas.design.is_empty() or floor_controls.is_empty():return
 var has_upper:bool=canvas.design.has("upper")
 floor_controls[0].set_pressed_no_signal(canvas.active_floor==0);floor_controls[1].set_pressed_no_signal(canvas.active_floor==1)
 floor_controls[1].visible=has_upper;floor_add_button.visible=not has_upper
 floor_copy_button.visible=has_upper and canvas.active_floor==1 and not preview.visible and canvas.current_plan().get("rooms",[]).is_empty()
 floor_remove_button.visible=has_upper and canvas.active_floor==1 and not preview.visible
 if is_instance_valid(map_overlay):call_deferred("update_stage_layout")

func select_floor(index: int) -> void:
 if preview.walking:preview.stop_walking();walk_button.text="Kõnni"
 canvas.select_floor(index)
 sync_floor_controls()
 preview.set_active_floor(canvas.active_floor)
 mini_plan.show_design(canvas.current_plan())
 update_measurements(canvas.current_plan())
 sync_options_from_plan()
 status.text="Esimene korrus." if index==0 else "Teine korrus." if canvas.active_floor==1 else "Lisa esmalt teine korrus."

func toggle_roof() -> void:
 preview.set_roof_visible(not preview.roof_visible);refresh_web_view();update_roof_overlay()

func update_roof_overlay() -> void:
 if not is_instance_valid(roof_overlay) or not is_instance_valid(canvas):return
 roof_overlay.visible=preview.visible and not preview.walking and preview.roof_visible and not canvas.design.get("rooms",[]).is_empty()

func toggle_preview() -> void:
 if preview.walking:preview.stop_walking();walk_button.text="Kõnni"
 preview.visible=not preview.visible;canvas.visible=not preview.visible;status.visible=not preview.visible
 refresh_web_view();sync_floor_controls()
 dock_panel.visible=not preview.visible
 update_roof_overlay()
 mini_preview.visible=not preview.visible;mini_plan.visible=preview.visible;mini_title_label.text="Plaan" if preview.visible else "3D eelvaade"
 if preview.visible:preview.show_design(canvas.design)

func toggle_walk() -> void:
 if preview.walking:
  preview.stop_walking();walk_button.text="Kõnni";status.text="3D-vaade.";refresh_web_view()
  return
 if not preview.visible:
  preview.visible=true;canvas.visible=false;status.visible=false;dock_panel.visible=false;roof_overlay.visible=false;mini_preview.visible=false;mini_plan.visible=true;mini_title_label.text="Plaan";preview.show_design(canvas.design)
 if preview.start_walking(canvas.active_floor,canvas.current_plan()):walk_button.text="Lõpeta kõndimine";status.text="WASD liigub, Shift jookseb, hiirega lohistades vaatad ringi.";refresh_web_view()

func _unhandled_key_input(event: InputEvent) -> void:
 if not event is InputEventKey or not event.pressed or event.echo:return
 if event.keycode==KEY_ESCAPE:
  if preview.walking:toggle_walk()
  elif canvas.drag or canvas.panning or canvas.moving_item>=0:
   canvas.drag=false;canvas.panning=false;canvas.moving_item=-1;canvas.queue_redraw();status.text="Toiming katkestatud."
  else:cancelled.emit();queue_free()
 elif event.ctrl_pressed and event.keycode==KEY_Z:
  restore_history(event.shift_pressed)
 elif event.ctrl_pressed and event.keycode==KEY_Y:restore_history(true)
 elif event.keycode==KEY_V:toggle_preview()
 elif event.keycode==KEY_F and preview.visible:toggle_walk()
 elif event.keycode==KEY_R and preview.visible and not preview.walking:toggle_roof()
 elif event.keycode in [KEY_Q,KEY_E] and preview.visible and not preview.walking:
  preview.yaw+=(-PI/6 if event.keycode==KEY_Q else PI/6);preview.update_camera()
 elif event.keycode==KEY_G and not preview.visible:snap_button.button_pressed=not snap_button.button_pressed
 elif event.keycode==KEY_L and not preview.visible:select_tool("move")
 elif event.keycode in [KEY_X,KEY_DELETE,KEY_BACKSPACE] and not preview.visible:select_tool("erase")
 elif event.keycode in [KEY_PLUS,KEY_EQUAL]:zoom_view(1.25)
 elif event.keycode==KEY_MINUS:zoom_view(0.8)
 elif event.keycode==KEY_0:reset_view()
 else:return
 get_viewport().set_input_as_handled()

func restore_history(redo: bool) -> void:
 if (canvas.future if redo else canvas.history).is_empty():return
 if preview.walking:preview.stop_walking();walk_button.text="Kõnni"
 canvas.drag=false;canvas.panning=false;canvas.moving_item=-1
 if redo:canvas.redo()
 else:canvas.undo()

func zoom_view(factor:float) -> void:
 if preview.visible:
  if not preview.walking:preview.distance=clampf(preview.distance/factor,4,50);preview.update_camera()
 else:canvas.zoom_at(canvas.size/2,factor)

func reset_view() -> void:
 if preview.visible:
  if not preview.walking:preview.distance=preview.initial_distance;preview.yaw=-0.61;preview.pitch=0.7130608329;preview.update_camera()
 else:canvas.view_scale=1.0;canvas.view_offset=Vector2.ZERO;canvas.queue_redraw()

func set_design_value(key: String,value: Variant) -> void:
 if canvas.design.is_empty() or canvas.current_plan().get(key)==value:return
 var next:Dictionary=canvas.current_plan().duplicate(true);next[key]=value;canvas.commit_plan(next)

func set_field_value(key: String,value: Variant) -> void:
 var next:Dictionary=canvas.current_plan().duplicate(true)
 if not next.get("field") is Dictionary or next.field.get(key)==value:return
 next.field[key]=value;canvas.commit_plan(next)

# Undo, redo, reset and floor switches can all replace the active plan without
# going through an option button. Keep those controls in step with the plan.
func sync_options_from_plan() -> void:
 if canvas.design.is_empty() or build_choices==null:return
 var plan:Dictionary=canvas.current_plan()
 sync_roof_cards()
 update_roof_overlay()
 for key in ["build-wall","build-open"]:
  if tool_buttons.has(key):tool_buttons[key].set_pressed_no_signal(plan.get("build","wall") == ("wall" if key=="build-wall" else "open"))
 for entry in [[build_choices,"build","wall"],[wall_choices,"wallStyle",""],[roof_form_choices,"roofForm","gable"],[roof_choices,"roofMat","reed"],[base_choices,"base","none"],[porch_choices,"porch","none"],[column_choices,"columns","post"]]:
  var control:OptionButton=entry[0];var value:Variant=plan.get(entry[1],entry[2])
  for i in control.item_count:
   if control.get_item_metadata(i)==value:control.select(i);break
 height_choices.set_value_no_signal(float(plan.get("roofHeight",75)))
 wall_height_choices.set_value_no_signal(float(plan.get("wallScale",100)))
 preview_roof_height.set_value_no_signal(float(plan.get("roofHeight",75)));preview_wall_height.set_value_no_signal(float(plan.get("wallScale",100)))
 preview_roof_label.text="Katuse kõrgus   %d%%" % int(plan.get("roofHeight",75));preview_wall_label.text="Seina kõrgus   %d%%" % int(plan.get("wallScale",100))
 var field:Variant=plan.get("field");update_option_visibility()
 if field is Dictionary:
  for entry in [[field_edge_choices,"edge"],[field_crop_choices,"crop"]]:
   var control:OptionButton=entry[0]
   for i in control.item_count:
    if control.get_item_metadata(i)==field.get(entry[1]):control.select(i);break
