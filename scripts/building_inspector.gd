extends PanelContainer

const Economy=preload("res://scripts/economy_rules.gd")
const Research=preload("res://scripts/research_rules.gd")
const Labor=preload("res://scripts/labor_allocation.gd")
const BuildingOperations=preload("res://scripts/building_operations.gd")
const Fortifications=preload("res://scripts/fortifications.gd")
const PanelFrame=preload("res://scripts/panel_frame.gd")
const PANEL_TEXTURE=preload("res://assets/ui/ui-art-v304_panel.webp")
var host: Node
var title_label: Label
var caption: Label
var values: Dictionary={}
var worker_limit: SpinBox
var worker_row: HBoxContainer
var toggle: Button
var rotate: Button
var remove: Button
var station_guard: Button
var release_guard: Button
var wood_upgrade: Button
var stone_upgrade: Button
var design_button: Button
var upgrade: Button
var confirm_remove: ConfirmationDialog
var refresh_clock:=0.0
var body: VBoxContainer

func _ready() -> void:
	visible=false;mouse_filter=Control.MOUSE_FILTER_STOP
	var panel:=StyleBoxEmpty.new()
	panel.content_margin_left=17;panel.content_margin_right=17;panel.content_margin_top=14;panel.content_margin_bottom=14
	add_theme_stylebox_override("panel",panel)
	var scroll:=ScrollContainer.new();scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED;add_child(scroll)
	body=VBoxContainer.new();body.size_flags_horizontal=Control.SIZE_EXPAND_FILL;body.add_theme_constant_override("separation",7);scroll.add_child(body)
	var sans:=SystemFont.new();sans.font_names=PackedStringArray(["Segoe UI","Arial","sans-serif"]);body.add_theme_font_override("font",sans)
	var bold:=SystemFont.new();bold.font_names=sans.font_names;bold.font_weight=700
	var header:=HBoxContainer.new();body.add_child(header)
	title_label=Label.new();title_label.size_flags_horizontal=Control.SIZE_EXPAND_FILL;title_label.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
	title_label.add_theme_font_size_override("font_size",19);title_label.add_theme_font_override("font",bold);title_label.add_theme_color_override("font_color",Color("f1d795"));header.add_child(title_label)
	var close:=Button.new();close.text="✕";close.custom_minimum_size=Vector2(40,40);close.tooltip_text="Sulge hoone info";close.pressed.connect(dismiss);header.add_child(close)
	caption=Label.new();caption.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;caption.add_theme_font_size_override("font_size",11);body.add_child(caption)
	var list:=VBoxContainer.new();list.add_theme_constant_override("separation",0);body.add_child(list)
	for pair in [["status","Seisund"],["hp","Seisukord"],["workers","Töölised"],["efficiency","Tõhusus"],["production","Toodang / töötsükkel"],["input","Kuluvad ressursid / tsükkel"],["cost","Ehitamise maksumus"],["science_base","Linna baasteadus"],["science_institutions","Haridusasutused"],["science_bonus","Avastuste boonus"],["science_total","Linna teadus kokku"],["technology","Avastamine"],["progress","Ehitusjärgus"],["remaining","Materjale puudu"],["research_activity","Teadustöö aktiivsus"]]:
		var item:=PanelContainer.new();var line:=StyleBoxFlat.new();line.bg_color=Color.TRANSPARENT;line.border_color=Color(0.84,0.74,0.50,0.17);line.border_width_bottom=1;line.content_margin_top=5;line.content_margin_bottom=5
		item.add_theme_stylebox_override("panel",line);list.add_child(item)
		var row:=HBoxContainer.new();row.add_theme_constant_override("separation",8);item.add_child(row)
		var name:=Label.new();name.text=pair[1];name.size_flags_horizontal=Control.SIZE_EXPAND_FILL;name.add_theme_font_size_override("font_size",11);row.add_child(name)
		var value:=Label.new();value.horizontal_alignment=HORIZONTAL_ALIGNMENT_RIGHT;value.add_theme_font_size_override("font_size",12);value.add_theme_font_override("font",bold);value.add_theme_color_override("font_color",Color("fff1c7"));row.add_child(value)
		values[pair[0]]={"row":item,"value":value}
	worker_row=HBoxContainer.new();body.add_child(worker_row)
	var worker_title:=Label.new();worker_title.text="Töötajate ülempiir";worker_title.size_flags_horizontal=Control.SIZE_EXPAND_FILL;worker_row.add_child(worker_title)
	worker_limit=SpinBox.new();worker_limit.min_value=0;worker_limit.step=0.01;worker_limit.custom_arrow_step=0.25;worker_limit.custom_minimum_size.x=84
	worker_limit.value_changed.connect(change_workers);worker_row.add_child(worker_limit)
	var actions:=HFlowContainer.new();actions.add_theme_constant_override("h_separation",6);actions.add_theme_constant_override("v_separation",6);body.add_child(actions)
	design_button=Button.new();design_button.text="✎ Kujunda";design_button.pressed.connect(host.open_selected_house_designer);actions.add_child(design_button)
	station_guard=Button.new();station_guard.text="♟ Saada müürile";station_guard.pressed.connect(func():host.change_wall_garrison(false);refresh());actions.add_child(station_guard)
	release_guard=Button.new();release_guard.text="↩ Kutsu müürilt";release_guard.pressed.connect(func():host.change_wall_garrison(true);refresh());actions.add_child(release_guard)
	wood_upgrade=Button.new();wood_upgrade.pressed.connect(func():host.upgrade_selected_wall("auto");refresh());actions.add_child(wood_upgrade)
	stone_upgrade=Button.new();stone_upgrade.pressed.connect(func():host.upgrade_selected_wall("stone");refresh());actions.add_child(stone_upgrade)
	upgrade=Button.new();upgrade.pressed.connect(upgrade_house);actions.add_child(upgrade)
	rotate=Button.new();rotate.text="⟳ Pööra 90°";rotate.pressed.connect(rotate_building);actions.add_child(rotate)
	remove=Button.new();remove.text="✕ Kustuta hoone";remove.pressed.connect(request_removal);actions.add_child(remove)
	var staff:=Button.new();staff.text="♟ Töölised";staff.pressed.connect(func():host.show_basic_labor());actions.add_child(staff)
	toggle=Button.new();toggle.pressed.connect(toggle_building);actions.add_child(toggle)
	for action in [design_button,station_guard,release_guard,wood_upgrade,stone_upgrade,upgrade,rotate,remove,staff,toggle]:
		action.custom_minimum_size=Vector2(100,43);action.size_flags_horizontal=Control.SIZE_EXPAND_FILL
		action.add_theme_font_size_override("font_size",12)
	confirm_remove=ConfirmationDialog.new();confirm_remove.title="Kustuta hoone";confirm_remove.dialog_text="Kustuta see hoone? Kulutatud materjale ei tagastata."
	confirm_remove.ok_button_text="Kustuta";confirm_remove.confirmed.connect(remove_building);add_child(confirm_remove)
	get_viewport().size_changed.connect(layout);layout()
	resized.connect(queue_redraw)

func _draw() -> void:
	PanelFrame.draw_frame(self,PANEL_TEXTURE,size,16.0)

func layout() -> void:
	var viewport:=get_viewport_rect().size
	var scale: float=host.game_hud.ui_scale if host!=null and host.game_hud!=null else 1.0
	var width:=minf(390.0,maxf(180.0,viewport.x-28.0))
	var top:=76.0*scale;var content_height:=body.get_combined_minimum_size().y+28.0 if body!=null else 380.0
	var height:=minf(content_height,minf(580.0,maxf(140.0,viewport.y-240.0*scale)))
	position=Vector2(viewport.x-width-14.0,top);size=Vector2(width,height)

func selected() -> Variant:
	if host==null or not host.city_created or not host.detail_mode or not host.can_build_on_detail() or host.settler_mode:return null
	if host.active_city_index<0 or host.active_city_index>=host.game.cities.size():return null
	var buildings: Array=host.current_build_context().economy.buildings
	return buildings[host.selected_building_index] if host.selected_building_index>=0 and host.selected_building_index<buildings.size() else null

func show_selected() -> void:
	if selected()==null:return
	visible=true;refresh();layout();call_deferred("layout")

func dismiss() -> void:
	visible=false;host.selected_building_index=-1
	if host.selected_entity=="building":host.selected_entity="city"
	host.update_selected_building()

func _unhandled_key_input(event: InputEvent) -> void:
	if not visible or host.menu_open or host.build_placement_mode or confirm_remove.visible:return
	if host.game_hud.research_screen.visible or host.game_hud.dock_menu.visible:return
	if event is InputEventKey and event.pressed and event.keycode==KEY_ESCAPE:
		dismiss();get_viewport().set_input_as_handled()

func _process(delta: float) -> void:
	if not visible:return
	if selected()==null:visible=false;return
	refresh_clock+=delta
	if refresh_clock>=0.5:refresh_clock=0;refresh()

func format_resources(resources: Dictionary) -> String:
	var parts:=PackedStringArray()
	for key in resources:
		if float(resources[key])>0:parts.append("%.0f %s" % [float(resources[key]),str(Economy.DATA.data.resource_names.get(key,key))])
	return " · ".join(parts) if not parts.is_empty() else "—"

func set_value(key: String,text: String,show:=true) -> void:
	values[key].row.visible=show;values[key].value.text=text

func refresh() -> void:
	var b: Variant=selected()
	if not b is Dictionary:return
	var city: Dictionary=host.current_build_context()
	var definition: Dictionary=Economy.DATA.data.buildings.get(b.type,{})
	var era:=maxi(int(host.game.ages[city.team]),int(host.CityRules.DATA.data.age.get(b.type,0)))
	var era_name: String=Economy.DATA.data.ages[clampi(era,0,Economy.DATA.data.ages.size()-1)].name
	title_label.text=str(definition.get("icon","⌂"))+" "+str(definition.get("name",b.type))
	var educational: bool=b.type in Research.EDUCATION_TYPES
	var description: String="Eraldi põld · %s × %s ühikut" % [b.get("width",16),b.get("depth",16)] if b.type=="field" else "Põllutalu · "+str(b.get("farming",{}).get("tool","vajab eraldi põldu")) if b.type=="farm" else "Loomafarm · kariloomad, liha ja veevajadus" if b.type=="pasture" else "Tootmishoone" if not str(definition.get("out","")).is_empty() else "Haridusasutus · linna teadus ×1,5 (valmis ja aktiivne)" if educational else "Elamu · "+("täiustatud · 2× mahutavus" if b.get("houseUpgradeLevelV218",0) else "tavaline") if b.type=="house" else "Linna peahoone" if b.type=="hall" else "Linnahoone"
	caption.text=era_name+" · "+str(city.name)+" · "+description
	var ready: bool=b.get("ready",false);var disabled: bool=b.get("disabled",false)
	design_button.visible=ready and int(city.team)==0 and not host.house_designer_id(str(b.type),city).is_empty()
	set_value("status",("Ehitus peatatud" if disabled else "Ehitamisel") if not ready else "Peatatud" if disabled else str(b.get("status","Valmis")))
	var hp:=maxf(0,float(b.get("hp",0)));var max_hp:=maxf(1200 if b.type=="hall" else 350,maxf(hp,float(b.get("maxHp",b.get("damageMaxHp",0)))))
	set_value("hp","%.0f / %.0f HP" % [hp,max_hp])
	var required: float=definition.get("workers",0);var assigned: float=b.get("assigned",0)
	var limit: float=b.get("workerLimit",required if ready else 1.0)
	set_value("workers","%.2f / %.2f" % [assigned,limit])
	var default_efficiency:=1.0 if assigned>=limit or limit<=0 else assigned/limit
	set_value("efficiency","%d%%" % roundi(clampf(float(b.get("efficiency",default_efficiency))*100,0,100)))
	var out: String=definition.get("out","")
	set_value("production","%.0f %s" % [float(definition.get("rate",0)),str(Economy.DATA.data.resource_names.get(out,out))] if not out.is_empty() else "—")
	set_value("input",format_resources(definition.get("input",{})));set_value("cost",format_resources(definition.get("cost",{})))
	if educational:
		var science:=Research.city_science(city,host.game.research[city.team].known)
		set_value("science_base","%.2f / min" % float(science.base));set_value("science_institutions","%d · ×%.2f" % [science.institutions,science.educationMultiplier])
		set_value("science_bonus","×%.2f" % float(science.discoveryMultiplier));set_value("science_total","%.2f / min" % float(science.total))
	else:
		for key in ["science_base","science_institutions","science_bonus","science_total"]:set_value(key,"",false)
	var technology: String=Research.DATA.data.build_tech.get(b.type,"")
	set_value("technology",technology,not technology.is_empty())
	set_value("research_activity","%d%%" % roundi(float(b.get("researchActivity",0))*100),not educational and b.has("researchActivity"))
	var duration:=float(b.get("buildTimeV1757",definition.get("time",0)))*Economy.tempo_factor(host.game)
	var wall_upgrade:Variant=b.get("wallUpgradeV184")
	var wall_active:bool=wall_upgrade is Dictionary
	var work_progress:float=float(wall_upgrade.get("progress",0))/maxf(1.0,float(wall_upgrade.get("total",1))) if wall_active else float(b.get("progress",0))/maxf(1.0,duration)
	var remaining:float=float(wall_upgrade.get("materialsRemaining",0)) if wall_active else float(b.get("materialsRemaining",0))
	set_value("progress","%d%%" % roundi(clampf(work_progress,0,1)*100),not ready or wall_active)
	set_value("remaining","%.0f" % remaining,(not ready or wall_active) and remaining>0)
	var needed: float=(required if b.type in Labor.IMPLEMENTED else 0.0) if ready else 1.0
	worker_row.visible=needed>0 and b.type!="hall"
	worker_limit.set_block_signals(true);worker_limit.max_value=needed;worker_limit.set_value_no_signal(0 if disabled else clampf(limit,0,needed));worker_limit.set_block_signals(false)
	toggle.visible=b.type!="hall";toggle.text=("▶ Jätka tööd" if disabled else "Ⅱ Peata töö") if ready else ("▶ Jätka ehitust" if disabled else "Ⅱ Peata ehitus")
	remove.visible=b.type!="hall";rotate.disabled=b.type in ["bridge","fisher","harbor"]
	var guards:=Fortifications.guards(host.game,city,b) if b.type in Fortifications.WALL_TYPES else []
	station_guard.visible=b.type in Fortifications.WALL_TYPES and ready and not disabled and int(city.team)==0
	release_guard.visible=station_guard.visible and not guards.is_empty()
	if station_guard.visible:
		station_guard.text="♟ Müürile (%d/%d)" % [guards.size(),int(Fortifications.CAPACITY.get(b.type,0))]
		caption.text+="\nSõdureid saab müürile määrata ja sealt tagasi kutsuda."
	var wood_plan:Dictionary=host.wall_upgrade_options(city,b,"auto")
	wood_upgrade.visible=not wood_plan.has("error")
	if wood_upgrade.visible:wood_upgrade.text="⬆ Kõrgem puitrajatis · "+format_resources(wood_plan.cost)
	var stone_plan:Dictionary=host.wall_upgrade_options(city,b,"stone")
	stone_upgrade.visible=not stone_plan.has("error")
	if stone_upgrade.visible:stone_upgrade.text="⬆ Kivist rajatis · "+format_resources(stone_plan.cost)
	var upgrade_plan:=BuildingOperations.house_upgrade_preview(host.game,city,b)
	upgrade.visible=not upgrade_plan.has("error")
	if upgrade.visible:upgrade.text="⬆ Suurem elamu (×2) · "+format_resources(upgrade_plan.cost)
	if visible:call_deferred("layout")

func change_workers(value: float) -> void:
	host.change_selected_worker_limit(snappedf(value,0.25));refresh()

func toggle_building() -> void:
	host.toggle_selected_building();refresh()

func rotate_building() -> void:
	host.rotate_selected_building();refresh()

func upgrade_house() -> void:
	host.upgrade_selected_house();refresh()

func request_removal() -> void:
	if selected()!=null:confirm_remove.popup_centered()

func remove_building() -> void:
	host.remove_selected_building();visible=false

