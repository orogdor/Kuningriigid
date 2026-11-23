extends Control
const Canvas=preload("res://scripts/house_plan_canvas.gd")
const Preview=preload("res://scripts/house_plan_preview.gd")
const Defaults=preload("res://data/house_default_designs.json")
const Catalog=preload("res://data/house_editor_catalog.json")
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
var era:=0
var item_choices: OptionButton
var style_choices: OptionButton
var wall_choices: OptionButton
var build_choices: OptionButton
var base_choices: OptionButton
var porch_choices: OptionButton
var column_choices: OptionButton
var roof_choices: OptionButton
var roof_form_choices: OptionButton
var height_choices: HSlider
var wall_height_choices: HSlider
var snap_button:CheckButton

func _ready() -> void:
 set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);mouse_filter=Control.MOUSE_FILTER_STOP
 var background:=ColorRect.new();background.color=Color("101820");background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);add_child(background)
 var layout:=VBoxContainer.new();layout.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);add_child(layout)
 var top:=HFlowContainer.new();top.add_theme_constant_override("h_separation",4);layout.add_child(top)
 title_label=Label.new();title_label.custom_minimum_size.x=180;top.add_child(title_label)
 make_button(top,"Plaan / 3D",func():toggle_preview())
 walk_button=make_button(top,"Kõnni",func():toggle_walk())
 make_button(top,"+",func():zoom_view(1.25))
 make_button(top,"−",func():zoom_view(0.8))
 make_button(top,"Kogu plaan",func():reset_view())
 make_button(top,"Katus sees / väljas",func():preview.set_roof_visible(not preview.roof_visible))
 make_button(top,"1. korrus",func():select_floor(0))
 make_button(top,"2. korrus",func():select_floor(1))
 make_button(top,"Lisa korrus",func():status.text="Joonista teise korruse seinad." if canvas.add_floor() else "Teist korrust ei saa praegu lisada.")
 make_button(top,"Kopeeri seinad",func():canvas.copy_floor_walls())
 make_button(top,"Eemalda korrus",func():canvas.remove_floor())
 reset_button=make_button(top,"Taasta algne",func():reset_requested.emit();queue_free())
 make_button(top,"Taasta näidis",func():reset_design())
 make_button(top,"Salvesta",func():accepted.emit(canvas.design.duplicate(true));queue_free())
 make_button(top,"Sulge",func():cancelled.emit();queue_free())
 var stage:=Control.new();stage.size_flags_horizontal=Control.SIZE_EXPAND_FILL;stage.size_flags_vertical=Control.SIZE_EXPAND_FILL;layout.add_child(stage)
 canvas=Canvas.new();canvas.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);stage.add_child(canvas)
 preview=Preview.new();preview.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);preview.visible=false;stage.add_child(preview)
 canvas.changed.connect(func(value):if preview.visible:preview.show_design(value))
 status=Label.new();status.text="Vali tööriist ja klõpsa või lohista plaanil. Rullik suumib, tühikuga lohistamine liigutab vaadet ja paremklõps kustutab.";status.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;layout.add_child(status)
 canvas.message.connect(func(text):status.text=text)
 var tools:=HFlowContainer.new();layout.add_child(tools)
 for entry in [["plot","Ehitusala"],["pier","Muul"],["yard","Õu"],["rect","Nelinurk"],["round","Ümar"],["line","Vaba sein"],["rail","Aed"],["palisadeLine","Palissaad"],["stoneLine","Kiviaed"],["highStone","Kõrge kivimüür"],["rampart","Muldvall"],["gateLine","Värav"],["partition","Sisesein"],["paintWall","Seinamaterjal"],["door","Uks"],["window","Aken"],["item","Ese"],["move","Liiguta"],["erase","Kustuta"]]:
  var button=make_button(tools,entry[1],select_tool.bind(entry[0]));button.toggle_mode=true;tool_buttons[entry[0]]=button
 style_choices=OptionButton.new();style_choices.custom_minimum_size.x=135;style_choices.item_selected.connect(func(i):
  if canvas.tool=="paintWall":canvas.wall_brush=str(style_choices.get_item_metadata(i))
  else:canvas.style=str(style_choices.get_item_metadata(i)))
 tools.add_child(style_choices)
 item_choices=OptionButton.new();item_choices.custom_minimum_size.x=160;item_choices.item_selected.connect(func(i):canvas.item_type=item_choices.get_item_metadata(i);select_tool("item"));tools.add_child(item_choices)
 make_button(tools,"Võta tagasi",func():canvas.undo())
 make_button(tools,"Tee uuesti",func():canvas.redo())
 snap_button=CheckButton.new();snap_button.text="Võrk";snap_button.button_pressed=true;snap_button.toggled.connect(func(v):canvas.snap_on=v);tools.add_child(snap_button)
 var options:=HFlowContainer.new();layout.add_child(options)
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
 var rise_label:=Label.new();rise_label.text="Katuse kõrgus";options.add_child(rise_label)
 height_choices=HSlider.new();height_choices.min_value=60;height_choices.max_value=150;height_choices.step=5;height_choices.custom_minimum_size.x=100;height_choices.value_changed.connect(func(v):set_design_value("roofHeight",v));options.add_child(height_choices)
 var wall_height_label:=Label.new();wall_height_label.text="Seina kõrgus";options.add_child(wall_height_label)
 wall_height_choices=HSlider.new();wall_height_choices.min_value=80;wall_height_choices.max_value=160;wall_height_choices.step=5;wall_height_choices.custom_minimum_size.x=100;wall_height_choices.value_changed.connect(func(v):set_design_value("wallScale",v));options.add_child(wall_height_choices)
 select_tool("rect")

func make_button(parent: Node,text: String,action: Callable) -> Button:
 var button:=Button.new();button.text=text;button.custom_minimum_size.y=38;button.pressed.connect(action);parent.add_child(button);return button

func open_design(id: String,name: String,current: Dictionary={}) -> bool:
 if not Defaults.data.has(id):return false
 reset_button.visible=not current.is_empty() and current.get("id","")==id
 title_label.text="Kujunda: "+name;era=clampi(int(Catalog.data.catalog[id].get("era",0)),0,2)
 var saved:Dictionary=current if current.get("id","")==id else Defaults.data[id]
 var definition:Dictionary=Catalog.data.catalog[id]
 tool_buttons.pier.visible=str(definition.get("base",id))=="fisher" or bool(definition.get("coast",false))
 canvas.load_design(saved,era)
 build_choices.clear()
 for entry in [["wall","Seintega hoone"],["open","Avatud hall"]]:build_choices.add_item(entry[1]);build_choices.set_item_metadata(build_choices.item_count-1,entry[0])
 if saved.get("build","wall")=="tower":build_choices.add_item("Torn");build_choices.set_item_metadata(build_choices.item_count-1,"tower")
 for i in build_choices.item_count:
  if build_choices.get_item_metadata(i)==saved.get("build","wall"):build_choices.select(i);break
 wall_choices.clear()
 for style in Catalog.data.ERA_WALLS[era]:
  wall_choices.add_item(str(style));wall_choices.set_item_metadata(wall_choices.item_count-1,style)
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
 height_choices.set_value_no_signal(float(saved.get("roofHeight",75)));wall_height_choices.set_value_no_signal(float(saved.get("wallScale",100)))
 item_choices.clear()
 for kind in Catalog.data.choices.get(id,[]):
  if Catalog.data.items.has(kind):item_choices.add_item(str(Catalog.data.items[kind][0]));item_choices.set_item_metadata(item_choices.item_count-1,kind)
 if item_choices.item_count>0:canvas.item_type=item_choices.get_item_metadata(0)
 return true

func select_tool(id: String) -> void:
 canvas.tool=id
 style_choices.clear();style_choices.visible=id in ["door","window","paintWall"]
 if id=="paintWall":
  canvas.wall_brush=str(canvas.current_plan().get("wallStyle",""))
  style_choices.add_item("Seina vaikematerjal");style_choices.set_item_metadata(0,"")
  for finish in Catalog.data.ERA_WALLS[era]:
   style_choices.add_item(str(finish));style_choices.set_item_metadata(style_choices.item_count-1,finish)
   if finish==canvas.wall_brush:style_choices.select(style_choices.item_count-1)
 if id in ["door","window"]:
  var choices:Array=Catalog.data.WINDOW_STYLES if id=="window" else Catalog.data.DOOR_STYLES
  canvas.style=("hole" if era<2 else "shutter") if id=="window" else ["hide","mycenaean","greek"][era]
  for choice in choices:
   if int(choice[2])>era:continue
   style_choices.add_item(str(choice[1]));style_choices.set_item_metadata(style_choices.item_count-1,choice[0])
   if choice[0]==canvas.style:style_choices.select(style_choices.item_count-1)
 for key in tool_buttons:tool_buttons[key].button_pressed=key==id

func reset_design() -> void:
 var id:String=canvas.design.get("id","")
 if Defaults.data.has(id):canvas.apply_design(Defaults.data[id].duplicate(true))

func select_floor(index: int) -> void:
 if preview.walking:preview.stop_walking();walk_button.text="Kõnni"
 canvas.select_floor(index)
 status.text="Esimene korrus." if index==0 else "Teine korrus." if canvas.active_floor==1 else "Lisa esmalt teine korrus."

func toggle_preview() -> void:
 if preview.walking:preview.stop_walking();walk_button.text="Kõnni"
 preview.visible=not preview.visible;canvas.visible=not preview.visible
 if preview.visible:preview.show_design(canvas.design)

func toggle_walk() -> void:
 if preview.walking:
  preview.stop_walking();walk_button.text="Kõnni";status.text="3D-vaade."
  return
 if not preview.visible:preview.visible=true;canvas.visible=false;preview.show_design(canvas.design)
 if preview.start_walking(canvas.active_floor,canvas.current_plan()):walk_button.text="Lõpeta kõndimine";status.text="WASD liigub, Shift jookseb, hiirega lohistades vaatad ringi."

func _unhandled_key_input(event: InputEvent) -> void:
 if not event is InputEventKey or not event.pressed or event.echo:return
 if event.keycode==KEY_ESCAPE:
  if preview.walking:toggle_walk()
  elif canvas.drag or canvas.panning or canvas.moving_item>=0:
   canvas.drag=false;canvas.panning=false;canvas.moving_item=-1;canvas.queue_redraw();status.text="Toiming katkestatud."
  else:cancelled.emit();queue_free()
 elif event.ctrl_pressed and event.keycode==KEY_Z:
  if event.shift_pressed:canvas.redo()
  else:canvas.undo()
 elif event.ctrl_pressed and event.keycode==KEY_Y:canvas.redo()
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

func zoom_view(factor:float) -> void:
 if preview.visible:
  if not preview.walking:preview.distance=clampf(preview.distance/factor,4,50);preview.update_camera()
 else:canvas.zoom_at(canvas.size/2,factor)

func reset_view() -> void:
 if preview.visible:
  if not preview.walking:preview.distance=15.0;preview.yaw=0.7;preview.pitch=0.65;preview.update_camera()
 else:canvas.view_scale=1.0;canvas.view_offset=Vector2.ZERO;canvas.queue_redraw()

func set_design_value(key: String,value: Variant) -> void:
 if canvas.design.is_empty() or canvas.current_plan().get(key)==value:return
 var next:Dictionary=canvas.current_plan().duplicate(true);next[key]=value;canvas.commit_plan(next)
