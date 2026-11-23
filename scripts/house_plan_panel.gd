extends Control
const Canvas=preload("res://scripts/house_plan_canvas.gd")
const Preview=preload("res://scripts/house_plan_preview.gd")
const Defaults=preload("res://data/house_default_designs.json")
const Catalog=preload("res://data/house_editor_catalog.json")
const Geometry=preload("res://scripts/house_plan_geometry.gd")
const Survey=preload("res://scripts/house_plan_survey.gd")
const ITEM_LABELS={"fire":"Tulekolle","bed":"Magamisase","basket":"Korv","bench":"Pink","table":"Laud","shelf":"Riiul","jar":"Savipott","post":"Puitpost","periodMeal":"Söögikoht","periodHearthKit":"Koldevarustus","periodGarden":"Veeanumad","periodSeat":"Madal pink","periodPantry":"Toiduriiul","periodDrying":"Kuivatusrest","periodCargo":"Kaubavaru","net":"Kalavõrk","rack":"Rest","fish":"Kalad","logs":"Palgid","barrel":"Tünn","grain":"Vili","hay":"Hein","hide":"Nahk","loom":"Kangasteljed","well":"Kaev","anvil":"Alasi","kiln":"Ahi","oven":"Leivaahi","forge":"Sepikoda","furnace":"Sulatusahi","bookshelf":"Raamaturiiul","chest":"Kirst","tower":"Vahitorn","boat":"Paat"}
const WALL_LABELS={"clay":"Savi","weave":"Punutis","stone":"Kivi","wood":"Puit","bamboo":"Bambus","turf":"Mätas","mudbrick":"Toortellis","cutstone":"Tahutud kivi","plank":"Laudis","cyclopean":"Suurtest kividest müür","fresco":"Fresko","limestone":"Paekivi","stave":"Püstpalk","prestigePlaster":"Kaunistatud krohv","brick":"Tellis","plaster":"Krohv","halftimber":"Sõrestik","marble":"Marmor","reticulatum":"Võrkmüüritis","romanbrick":"Rooma tellis"}
const WALL_TEXTURES={"clay":"atlas-clay","weave":"atlas-weave","stone":"atlas-stone","wood":"atlas-wood","turf":"proc-sod","mudbrick":"proc-mudbrick","cutstone":"proc-cutstone","plank":"proc-plank","cyclopean":"proc-cyclopean","fresco":"proc-fresco","limestone":"proc-limestone","brick":"proc-brick","plaster":"proc-plaster","marble":"proc-marble","reticulatum":"proc-reticulatum","romanbrick":"proc-romanbrick"}
const TOOL_GROUPS={"build-wall":"outer","build-open":"outer","plot":"area","pier":"area","yard":"outer","rail":"fence","palisadeLine":"fence","stoneLine":"fence","highStone":"fence","rampart":"fence","gateLine":"fence","rect":"outer","round":"outer","line":"outer","partition":"inner","paintWall":"inner","door":"door","window":"window","item":"items","move":"items","erase":"items"}
const TOOL_IMAGES={"build-wall":"build-wall","build-open":"build-open","plot":"plot","yard":"yard","rail":"rail","palisadeLine":"palisadeLine","stoneLine":"stoneLine","highStone":"highStone","rampart":"rampart","gateLine":"gateLine","rect":"rect","round":"round","line":"line","partition":"partition","paintWall":"paintWall","door":"door-hide","window":"window-hole","item":"basket","move":"move","erase":"erase"}
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
var more_actions: HFlowContainer
var more_actions_button: Button
var walk_pad: GridContainer
var walk_pad_buttons: Dictionary={}

func _ready() -> void:
 set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);mouse_filter=Control.MOUSE_FILTER_STOP
 var background:=ColorRect.new();background.color=Color("101820");background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);add_child(background)
 var layout:=VBoxContainer.new();layout.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);add_child(layout)
 var header:=PanelContainer.new();header.add_theme_stylebox_override("panel",editor_panel_style());layout.add_child(header)
 var top:=HFlowContainer.new();top.add_theme_constant_override("h_separation",4);header.add_child(top)
 var actions:=HFlowContainer.new();more_actions=actions;actions.add_theme_constant_override("h_separation",4);actions.visible=false;layout.add_child(actions)
 title_label=Label.new();title_label.custom_minimum_size.x=180;top.add_child(title_label)
 measurements=Label.new();top.add_child(measurements)
 estimate_label=Label.new();estimate_label.tooltip_text="Kujundaja materjalihinnang";estimate_label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;estimate_label.custom_minimum_size.x=280;top.add_child(estimate_label)
 overview_button=make_button(top,"Ülevaade",func():mobile_ledger_open=not mobile_ledger_open;update_stage_layout())
 make_button(top,"Plaan / 3D",func():toggle_preview())
 walk_button=make_button(top,"Kõnni",func():toggle_walk())
 make_button(actions,"+",func():zoom_view(1.25))
 make_button(actions,"−",func():zoom_view(0.8))
 make_button(actions,"Kogu plaan",func():reset_view())
 make_button(actions,"Katus sees / väljas",func():preview.set_roof_visible(not preview.roof_visible))
 var floor_one:=make_button(actions,"1. korrus",func():select_floor(0))
 var floor_two:=make_button(actions,"2. korrus",func():select_floor(1))
 var floor_add:=make_button(actions,"Lisa korrus",func():status.text="Joonista teise korruse seinad." if canvas.add_floor() else "Teist korrust ei saa praegu lisada.")
 make_button(actions,"Kopeeri seinad",func():canvas.copy_floor_walls())
 make_button(actions,"Eemalda korrus",func():canvas.remove_floor())
 make_button(actions,"Võta tagasi",func():restore_history(false))
 make_button(actions,"Tee uuesti",func():restore_history(true))
 snap_button=CheckButton.new();snap_button.text="Võrk";snap_button.button_pressed=true;snap_button.toggled.connect(func(v):canvas.snap_on=v);actions.add_child(snap_button)
 reset_button=make_button(actions,"Taasta algne",func():reset_requested.emit();queue_free())
 make_button(actions,"Taasta näidis",func():reset_design())
 more_actions_button=make_button(top,"Tööriistad",func():actions.visible=not actions.visible)
 make_button(top,"Salvesta",func():accepted.emit(canvas.design.duplicate(true));queue_free())
 make_button(top,"Sulge",func():cancelled.emit();queue_free())
 var stage:=Control.new();stage_ref=stage;stage.size_flags_horizontal=Control.SIZE_EXPAND_FILL;stage.size_flags_vertical=Control.SIZE_EXPAND_FILL;layout.add_child(stage)
 canvas=Canvas.new();canvas.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);stage.add_child(canvas)
 preview=Preview.new();preview.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);preview.visible=false;stage.add_child(preview)
 var floor_bar:=HBoxContainer.new();floor_bar.set_anchors_preset(Control.PRESET_CENTER_TOP);floor_bar.offset_left=-145;floor_bar.offset_right=145;floor_bar.offset_top=12;floor_bar.offset_bottom=52;stage.add_child(floor_bar)
 for button in [floor_one,floor_two,floor_add]:button.reparent(floor_bar)
 ledger=PanelContainer.new();ledger.position=Vector2(12,12);ledger.custom_minimum_size=Vector2(210,0);ledger.add_theme_stylebox_override("panel",editor_panel_style());stage.add_child(ledger)
 var ledger_scroll:=ScrollContainer.new();ledger_scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED;ledger.add_child(ledger_scroll)
 ledger_text=Label.new();ledger_text.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;ledger_text.size_flags_horizontal=Control.SIZE_EXPAND_FILL;ledger_text.mouse_filter=Control.MOUSE_FILTER_IGNORE;ledger_scroll.add_child(ledger_text)
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
 roof_overlay=PanelContainer.new();roof_overlay.set_anchors_preset(Control.PRESET_TOP_RIGHT);roof_overlay.offset_left=-225;roof_overlay.offset_right=-12;roof_overlay.offset_top=225;roof_overlay.offset_bottom=330;roof_overlay.add_theme_stylebox_override("panel",editor_panel_style());roof_overlay.visible=false;stage.add_child(roof_overlay)
 var height_box:=VBoxContainer.new();roof_overlay.add_child(height_box)
 var roof_label_3d:=Label.new();roof_label_3d.text="Katuse kõrgus";height_box.add_child(roof_label_3d)
 preview_roof_height=HSlider.new();preview_roof_height.min_value=60;preview_roof_height.max_value=150;preview_roof_height.step=5;preview_roof_height.value_changed.connect(func(v):height_choices.value=v);height_box.add_child(preview_roof_height)
 var wall_label_3d:=Label.new();wall_label_3d.text="Seina kõrgus";height_box.add_child(wall_label_3d)
 preview_wall_height=HSlider.new();preview_wall_height.min_value=80;preview_wall_height.max_value=160;preview_wall_height.step=5;preview_wall_height.value_changed.connect(func(v):wall_height_choices.value=v);height_box.add_child(preview_wall_height)
 stage.resized.connect(update_stage_layout)
 canvas.changed.connect(func(value):
  update_measurements(canvas.current_plan())
  preview.set_active_floor(canvas.active_floor)
  sync_options_from_plan()
  mini_preview.show_design(value);mini_plan.show_design(canvas.current_plan())
  if preview.visible:preview.show_design(value))
 var dock_center:=CenterContainer.new();layout.add_child(dock_center)
 var dock:=PanelContainer.new();dock_panel=dock;dock.custom_minimum_size.x=710;dock.add_theme_stylebox_override("panel",editor_panel_style());dock_center.add_child(dock)
 var dock_contents:=VBoxContainer.new();dock.add_child(dock_contents)
 status=Label.new();status.text="Vali tööriist ja joonista plaanile.";status.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;dock_contents.add_child(status)
 canvas.message.connect(func(text):status.text=text)
 var categories:=HFlowContainer.new();dock_contents.add_child(categories)
 for category in [["area","Ehitusala"],["fence","Aiad"],["outer","Välisseinad"],["inner","Siseseinad"],["door","Uksed"],["window","Aknad"],["items","Sisustus"],["settings","Katus ja sein"]]:
  var tab=make_button(categories,category[1],select_category.bind(category[0]));tab.toggle_mode=true;category_buttons[category[0]]=tab
 card_row=HBoxContainer.new();dock_contents.add_child(card_row)
 card_previous=make_button(card_row,"‹",func():card_scroll.scroll_horizontal=maxi(0,card_scroll.scroll_horizontal-200));card_previous.custom_minimum_size=Vector2(30,90)
 card_scroll=ScrollContainer.new();card_scroll.custom_minimum_size.y=116;card_scroll.size_flags_horizontal=Control.SIZE_EXPAND_FILL;card_scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_AUTO;card_scroll.vertical_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED;card_row.add_child(card_scroll)
 card_next=make_button(card_row,"›",func():card_scroll.scroll_horizontal+=200);card_next.custom_minimum_size=Vector2(30,90)
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
 select_category("outer");select_tool("rect")

func editor_panel_style() -> StyleBoxTexture:
 var style:=StyleBoxTexture.new();style.texture=load("res://assets/house_designer/editor-panel-art.webp")
 style.texture_margin_left=45;style.texture_margin_right=45;style.texture_margin_top=45;style.texture_margin_bottom=45
 style.content_margin_left=16;style.content_margin_right=16;style.content_margin_top=16;style.content_margin_bottom=16
 return style

func make_button(parent: Node,text: String,action: Callable) -> Button:
 var button:=Button.new();button.text=text;button.custom_minimum_size.y=38;button.pressed.connect(action);parent.add_child(button);return button

func make_tool_card(parent: Node,id: String,title: String) -> Button:
 var button:=Button.new();button.toggle_mode=true;button.custom_minimum_size=Vector2(92,108);button.pressed.connect(select_tool.bind(id));parent.add_child(button)
 var frame:=StyleBoxTexture.new();frame.texture=load("res://assets/house_designer/editor-card-art.webp")
 for state in ["normal","hover","focus"]:button.add_theme_stylebox_override(state,frame)
 var active: StyleBoxTexture=frame.duplicate();active.modulate_color=Color(1.25,1.18,0.75);button.add_theme_stylebox_override("pressed",active)
 var content:=VBoxContainer.new();content.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);content.offset_left=8;content.offset_right=-8;content.offset_top=7;content.offset_bottom=-7;content.mouse_filter=Control.MOUSE_FILTER_IGNORE;button.add_child(content)
 var picture:=TextureRect.new();picture.custom_minimum_size=Vector2(65,65);picture.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;picture.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_CENTERED;picture.mouse_filter=Control.MOUSE_FILTER_IGNORE
 var icon_path: String="res://assets/house_designer/web_cards/"+str(TOOL_IMAGES.get(id,id))+".png"
 if ResourceLoader.exists(icon_path):picture.texture=load(icon_path)
 content.add_child(picture)
 var label:=Label.new();label.text=title;label.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER;label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;label.add_theme_font_size_override("font_size",12);label.add_theme_color_override("font_color",Color("352415"));label.mouse_filter=Control.MOUSE_FILTER_IGNORE;content.add_child(label)
 return button

func select_category(id: String) -> void:
 selected_category=id
 for key in category_buttons:category_buttons[key].button_pressed=key==id
 for key in tool_buttons:
  var in_category:bool=id in ["outer","inner"] if key=="paintWall" else TOOL_GROUPS.get(key,"")==id
  tool_buttons[key].visible=in_category and (key!="pier" or pier_available) and (key not in ["highStone","rampart"] or era>=1)
 if card_scroll!=null:
  card_scroll.visible=id!="settings" or (not canvas.design.is_empty() and not canvas.current_plan().get("field") is Dictionary)
  card_row.visible=card_scroll.visible;card_scroll.scroll_horizontal=0
 if controls_panel!=null:controls_panel.visible=id in ["inner","door","window","items"] or (id=="outer" and canvas.tool=="paintWall")
 if item_choices!=null:item_choices.visible=id=="items"
 if options_panel!=null:options_panel.visible=id=="settings"
 rebuild_choice_cards()

func rebuild_choice_cards() -> void:
 if tool_cards_row==null or canvas==null:return
 for card in choice_cards:card.queue_free()
 choice_cards.clear()
 if selected_category not in ["door","window","items","settings"]:return
 if selected_category=="settings" and (canvas.design.is_empty() or canvas.current_plan().get("field") is Dictionary):return
 var choices:=[]
 if selected_category in ["door","window"]:
  var styles:Array=Catalog.data.DOOR_STYLES if selected_category=="door" else Catalog.data.WINDOW_STYLES
  var labels={"hide":"Nahkuks","wattle":"Punutud uks","plank":"Lauduks","double":"Kahepoolne uks","arched":"Kaaruks","mycenaean":"Mükeene uks","greek":"Kreeka uks","hole":"Valgusava","shutter":"Luugiga aken","slit":"Laskeava","lattice":"Võreaken","archwin":"Kaaraken"}
  for entry in styles:
   if int(entry[2])<=era:choices.append({"key":selected_category+"-"+str(entry[0]),"value":str(entry[0]),"title":str(labels.get(entry[0],entry[1]))})
 elif selected_category=="settings":
  for pair in [[roof_form_choices,"roof-","roofForm"],[roof_choices,"rmat-","roofMat"]]:
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
   if category=="settings":set_design_value(field,value);sync_options_from_plan();return
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
  if category=="settings":card.set_meta("plan_field",field);card.set_meta("plan_value",value)
  choice_cards.append(card)
 sync_roof_cards()
 if selected_category=="door":tool_buttons.door.visible=false
 elif selected_category=="window":tool_buttons.window.visible=false
 elif selected_category=="items":tool_buttons.item.visible=false

func sync_roof_cards() -> void:
 if canvas.design.is_empty():return
 var plan:Dictionary=canvas.current_plan()
 for card in choice_cards:
  if card.has_meta("plan_field"):card.set_pressed_no_signal(str(plan.get(str(card.get_meta("plan_field")),""))==str(card.get_meta("plan_value")))

func open_design(id: String,name: String,current: Dictionary={}) -> bool:
 if not Defaults.data.has(id):return false
 reset_button.visible=not current.is_empty() and current.get("id","")==id
 building_name=name;title_label.text="Kujunda: "+name;era=clampi(int(Catalog.data.catalog[id].get("era",0)),0,2)
 var saved:Dictionary=current if current.get("id","")==id else Defaults.data[id]
 category_buttons.settings.text="Põllu seaded" if saved.get("field") is Dictionary else "Katus ja sein"
 for child in options_panel.get_children():
  if child!=field_options:child.visible=not saved.get("field") is Dictionary
 var definition:Dictionary=Catalog.data.catalog[id]
 var default_category:=default_category_for(saved)
 pier_available=str(definition.get("base",id))=="fisher" or bool(definition.get("coast",false));select_category(default_category)
 canvas.load_design(saved,era)
 mini_preview.show_design(saved);mini_plan.show_design(saved)
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
 sync_options_from_plan()
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
 var lines:PackedStringArray=[building_name,""]
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
 ledger.size=Vector2(210,minf(460,minf(maxf(150,ledger_text.get_combined_minimum_size().y+36),maxf(150,stage_ref.size.y-24))))

func update_stage_layout() -> void:
 if not is_instance_valid(stage_ref) or not is_instance_valid(mini_frame):return
 var narrow:=stage_ref.size.x<1000
 dock_panel.custom_minimum_size.x=minf(710,maxf(240,stage_ref.size.x-16))
 overview_button.visible=narrow;ledger.visible=not narrow or mobile_ledger_open;mini_frame.visible=not narrow;fit_ledger()

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

func select_tool(id: String) -> void:
 if id in ["build-wall","build-open"]:
  set_design_value("build","wall" if id=="build-wall" else "open");sync_options_from_plan();return
 canvas.tool=id
 if selected_category=="outer" and controls_panel!=null:controls_panel.visible=id=="paintWall"
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

func select_floor(index: int) -> void:
 if preview.walking:preview.stop_walking();walk_button.text="Kõnni"
 canvas.select_floor(index)
 preview.set_active_floor(canvas.active_floor)
 mini_plan.show_design(canvas.current_plan())
 update_measurements(canvas.current_plan())
 sync_options_from_plan()
 status.text="Esimene korrus." if index==0 else "Teine korrus." if canvas.active_floor==1 else "Lisa esmalt teine korrus."

func update_roof_overlay() -> void:
 if not is_instance_valid(roof_overlay) or not is_instance_valid(canvas):return
 roof_overlay.visible=preview.visible and not preview.walking and not canvas.design.get("rooms",[]).is_empty()

func toggle_preview() -> void:
 if preview.walking:preview.stop_walking();walk_button.text="Kõnni"
 preview.visible=not preview.visible;canvas.visible=not preview.visible
 dock_panel.visible=not preview.visible
 update_roof_overlay()
 mini_preview.visible=not preview.visible;mini_plan.visible=preview.visible;mini_title_label.text="Plaan" if preview.visible else "3D eelvaade"
 if preview.visible:preview.show_design(canvas.design)

func toggle_walk() -> void:
 if preview.walking:
  preview.stop_walking();walk_button.text="Kõnni";status.text="3D-vaade."
  return
 if not preview.visible:
  preview.visible=true;canvas.visible=false;dock_panel.visible=false;roof_overlay.visible=false;mini_preview.visible=false;mini_plan.visible=true;mini_title_label.text="Plaan";preview.show_design(canvas.design)
 if preview.start_walking(canvas.active_floor,canvas.current_plan()):walk_button.text="Lõpeta kõndimine";status.text="WASD liigub, Shift jookseb, hiirega lohistades vaatad ringi."

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
 elif event.keycode==KEY_R and preview.visible and not preview.walking:preview.set_roof_visible(not preview.roof_visible)
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
 var field:Variant=plan.get("field");field_options.visible=field is Dictionary
 if field is Dictionary:
  for entry in [[field_edge_choices,"edge"],[field_crop_choices,"crop"]]:
   var control:OptionButton=entry[0]
   for i in control.item_count:
    if control.get_item_metadata(i)==field.get(entry[1]):control.select(i);break

