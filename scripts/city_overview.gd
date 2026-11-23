extends AcceptDialog

const Economy=preload("res://scripts/economy_rules.gd")
const Needs=preload("res://scripts/city_needs.gd")
const Territory=preload("res://scripts/city_territory.gd")
const Diplomacy=preload("res://scripts/diplomacy_rules.gd")
var host: Node
var scroll: ScrollContainer
var grid: GridContainer
var cards: Dictionary={}
var alerts: Label
var detail_toggle: Button
var details: RichTextLabel
var refresh_clock:=0.0
var trade_button: Button
var merchant_buttons: Array[Button]=[]

func _ready() -> void:
 title="Linna ülevaade";get_ok_button().text="Sulge"
 host.style_game_dialog(self)
 scroll=ScrollContainer.new();scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED;add_child(scroll)
 var body:=VBoxContainer.new();body.size_flags_horizontal=Control.SIZE_EXPAND_FILL;body.add_theme_constant_override("separation",10);scroll.add_child(body)
 grid=GridContainer.new();grid.columns=3;grid.add_theme_constant_override("h_separation",6);grid.add_theme_constant_override("v_separation",6);body.add_child(grid)
 for item in [["population","👥","Elanikud"],["food","🍞","Toit"],["water","💧","Vesi"],["workers","⚒","Töölised"],["productivity","★","Tootlikkus"],["trade","⇄","Kaubandus"]]:make_card(item[0],item[1],item[2])
 alerts=Label.new();alerts.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;alerts.add_theme_color_override("font_color",Color("f2ca8a"));body.add_child(alerts)
 detail_toggle=Button.new();detail_toggle.text="▸ Linna üksikasjad";detail_toggle.alignment=HORIZONTAL_ALIGNMENT_LEFT;detail_toggle.pressed.connect(toggle_details);body.add_child(detail_toggle)
 details=RichTextLabel.new();details.fit_content=true;details.visible=false;details.scroll_active=false;details.add_theme_color_override("default_color",Color("e6d4aa"));body.add_child(details)
 var row:=HBoxContainer.new();row.add_theme_constant_override("separation",6);body.add_child(row)
 for item in [["Ehita",func():hide();host.game_hud.dock_menu.open_menu("build")],["Varud",func():hide();host.show_resource_details()],["Töölised",func():hide();host.show_basic_labor()],["Värbamine",func():hide();host.show_training()]]:
  var button:=Button.new();button.text=item[0];button.size_flags_horizontal=Control.SIZE_EXPAND_FILL;button.pressed.connect(item[1]);row.add_child(button)
 var trade_row:=HBoxContainer.new();trade_row.add_theme_constant_override("separation",6);body.add_child(trade_row)
 trade_button=Button.new();trade_button.size_flags_horizontal=Control.SIZE_EXPAND_FILL;trade_button.pressed.connect(toggle_city_trade);trade_row.add_child(trade_button)
 var recruit:=Button.new();recruit.text="Värba asunik";recruit.size_flags_horizontal=Control.SIZE_EXPAND_FILL;recruit.pressed.connect(func():hide();host.recruit_new_settler());trade_row.add_child(recruit)
 var foreign:=HBoxContainer.new();foreign.add_theme_constant_override("separation",6);body.add_child(foreign)
 for team in [1,2,3]:
  var button:=Button.new();button.size_flags_horizontal=Control.SIZE_EXPAND_FILL;button.pressed.connect(toggle_foreign_merchant.bind(team));foreign.add_child(button);merchant_buttons.append(button)

func make_card(key: String,icon: String,label: String) -> void:
 var panel:=PanelContainer.new();panel.size_flags_horizontal=Control.SIZE_EXPAND_FILL;panel.custom_minimum_size=Vector2(100,93)
 var box:=StyleBoxFlat.new();box.bg_color=Color("142b36");box.border_color=Color("594d36");box.set_border_width_all(1);box.set_corner_radius_all(8)
 box.content_margin_left=8;box.content_margin_right=8;box.content_margin_top=6;box.content_margin_bottom=6;panel.add_theme_stylebox_override("panel",box);grid.add_child(panel)
 var column:=VBoxContainer.new();column.add_theme_constant_override("separation",3);panel.add_child(column)
 var heading:=Label.new();heading.text=icon+"  "+label.to_upper();heading.add_theme_font_size_override("font_size",11);heading.add_theme_color_override("font_color",Color("c8bb9d"));heading.clip_text=true;column.add_child(heading)
 var value:=Label.new();value.add_theme_font_size_override("font_size",16);value.clip_text=true;column.add_child(value)
 var bar:=ProgressBar.new();bar.custom_minimum_size.y=4;bar.show_percentage=false;bar.min_value=0;bar.max_value=100
 var track:=StyleBoxFlat.new();track.bg_color=Color("34424a");track.set_corner_radius_all(3);bar.add_theme_stylebox_override("background",track)
 var fill:=StyleBoxFlat.new();fill.bg_color=Color("93b887");fill.set_corner_radius_all(3);bar.add_theme_stylebox_override("fill",fill);column.add_child(bar)
 var sub:=Label.new();sub.add_theme_font_size_override("font_size",10);sub.add_theme_color_override("font_color",Color("c8bb9d"));sub.clip_text=true;column.add_child(sub)
 cards[key]={"panel":panel,"box":box,"value":value,"bar":bar,"sub":sub,"fill":fill}

func set_card(key: String,value: String,sub: String,ratio: float=-1,warn:=false) -> void:
 var card: Dictionary=cards[key];card.value.text=value;card.sub.text=sub;card.bar.visible=ratio>=0
 if ratio>=0:card.bar.value=clampf(ratio*100,0,100)
 card.box.border_color=Color("b88146") if warn else Color("594d36");card.box.bg_color=Color("473329") if warn else Color("142b36")
 card.fill.bg_color=Color("dfa85f") if warn else Color("93b887")

func open_screen() -> void:
 if not host.city_created:return
 var viewport_size:=get_viewport().get_visible_rect().size
 scroll.custom_minimum_size=Vector2(maxf(200,minf(540,viewport_size.x-90)),maxf(160,minf(410,viewport_size.y-120)))
 grid.columns=2 if viewport_size.x<500 else 3
 refresh();popup_centered();host.fit_game_dialog(self,Vector2i(600,500))

func toggle_details() -> void:
 details.visible=not details.visible
 detail_toggle.text=("▾ " if details.visible else "▸ ")+"Linna üksikasjad"

func toggle_city_trade() -> void:
 if not host.city_created:return
 var city: Dictionary=host.game.cities[host.active_city_index]
 city.tradeDisabled=not city.get("tradeDisabled",false)
 host.update_status("Linnadevaheline kaubavedu peatatud." if city.tradeDisabled else "Linnadevaheline kaubavedu lubatud.")
 refresh()

func toggle_foreign_merchant(team: int) -> void:
 if not host.city_created:return
 var city: Dictionary=host.game.cities[host.active_city_index]
 var blocked: bool=not city.get("blockedMerchants",{}).get(str(team),false)
 Diplomacy.block_merchants(host.game,city,team,blocked)
 host.update_status("Kaupmehed tõkestatud." if blocked else "Kaupmehed lubatud.")
 refresh()

func _process(delta: float) -> void:
 if not visible:return
 refresh_clock+=delta
 if refresh_clock>=1.0:refresh_clock=0;refresh()

func refresh() -> void:
 if not host.city_created or host.active_city_index<0 or host.active_city_index>=host.game.cities.size():return
 var city: Dictionary=host.game.cities[host.active_city_index];var realm: Dictionary=city.economy.realms[city.team];var stock: Dictionary=realm.resources
 trade_button.text="Kaubavedu: "+("peatatud" if city.get("tradeDisabled",false) else "lubatud")
 for i in merchant_buttons.size():
  var team:=i+1;var blocked: bool=city.get("blockedMerchants",{}).get(str(team),false)
  merchant_buttons[i].text=["Soome","Rootsi","Norra"][i]+": "+("ei" if blocked else "jah")
 var buildings: Array=city.economy.buildings;var pop:=float(realm.pop);var capacity:=Economy.housing_capacity(buildings);var food:=Needs.food_total(stock);var water:=float(stock.get("water",0))
 var food_need:=pop*0.6;var water_need:=pop*0.45;var growth:=float(realm.get("growthProgress",0))/maxf(1,float(realm.get("growthNeed",4)))
 var needs:=Needs.calculate(city,int(host.game.ages[city.team]));var employed:=float(realm.get("employed",0));var incoming:=0;var outgoing:=0
 for shipment in host.game.get("shipments",[]):
  if int(shipment.get("to",-1))==int(city.id):incoming+=1
  if int(shipment.get("from",-1))==int(city.id):outgoing+=1
 title="Linna ülevaade · "+str(city.name)
 set_card("population","%.0f / %.1f" % [pop,capacity],"Kasv %d%%" % roundi(growth*100),growth,realm.get("housingShortage",false))
 set_card("food","%.0f / %.0f" % [food,Economy.storage_limit(buildings,"bread")],"Kulu %.1f / min" % food_need,food/maxf(1,Economy.storage_limit(buildings,"bread")),food<food_need*2)
 var fetching: bool=city.get("waterFetchV267",false) and water<1
 var water_text: String=("Allikast" if city.get("waterFetchFarV280",false) else "Jõest") if fetching else "%.0f / %.0f" % [water,Economy.storage_limit(buildings,"water")]
 set_card("water",water_text,("Kantakse koju · " if fetching else "Kulu ")+"%.1f / min" % water_need,1.0 if fetching else water/maxf(1,Economy.storage_limit(buildings,"water")),not fetching and water<water_need*2)
 set_card("workers","%.1f / %.0f" % [employed,pop],"Tööga hõivatud",employed/maxf(1,pop))
 set_card("productivity","%d%%" % roundi(float(needs.productivity)*100),"Toitu %d/%d · luksust %d/%d" % [needs.foods.size(),int(needs.need.food),needs.luxuries.size(),int(needs.need.luxury)],-1,float(needs.productivity)<0.9)
 set_card("trade","Peatatud" if city.get("tradeDisabled",false) else "%d teel" % (incoming+outgoing),"Saabub %d · lahkub %d" % [incoming,outgoing])
 var warnings:=PackedStringArray();var waiting:=0
 if realm.get("housingShortage",false):warnings.append("Eluaset või toitu napib")
 if food<food_need*2:warnings.append("Toiduvaru on väike")
 if water<water_need*2:warnings.append("Vett napib")
 for b in buildings:
  var status:=str(b.get("status",""))
  if status.begins_with("Ootab") or status.contains("napib") or status.contains("pole ligipääsetavat"):waiting+=1
 if waiting>0:warnings.append("%d hoonet ootab" % waiting)
 alerts.text="  ·  ".join(warnings);alerts.visible=not warnings.is_empty()
 var radius:=float(city.get("radius",Territory.population_radius(pop)));var extent:=Territory.city_extent(radius);var next=Territory.next_city_population(radius)
 var unfinished:=0
 for b in buildings:
  if not b.get("ready",false) and float(b.get("hp",0))>0:unfinished+=1
 var lines:=PackedStringArray(["Ehitusjärjekorras: %d / 12" % unfinished,"Linna ulatus: %d × %d%s" % [extent,extent," · kasv %s elaniku juures" % str(next) if next!=null else " · suurim"],"Vajadused: toitu %d / %d · luksuskaupu %d / %d" % [needs.foods.size(),int(needs.need.food),needs.luxuries.size(),int(needs.need.luxury)]])
 if float(realm.get("marketFoodBonusV137",0))>0:lines.append("Turu toiduvalik: %d liiki · kasv +%d%%" % [int(realm.get("marketFoodVarietiesV137",0)),roundi(float(realm.marketFoodBonusV137)*100)])
 details.text="\n".join(lines)
