extends AcceptDialog
var host: Node
var body: VBoxContainer
var feedback: Label
var scroll: ScrollContainer
const Rules=preload("res://scripts/diplomacy_rules.gd")
func _ready() -> void:
 title="Diplomaatia";size=Vector2i(560,560);get_ok_button().text="Sulge"
 var panel:=StyleBoxTexture.new();panel.texture=load("res://assets/ui/ui-art-v304_panel.webp")
 panel.texture_margin_left=70;panel.texture_margin_right=70;panel.texture_margin_top=50;panel.texture_margin_bottom=50
 panel.content_margin_left=20;panel.content_margin_right=20;panel.content_margin_top=20;panel.content_margin_bottom=20
 add_theme_stylebox_override("panel",panel)
 scroll=ScrollContainer.new();add_child(scroll)
 body=VBoxContainer.new();body.size_flags_horizontal=Control.SIZE_EXPAND_FILL;body.add_theme_constant_override("separation",12);scroll.add_child(body)
func open_screen() -> void:
 var viewport_size:=get_viewport().get_visible_rect().size
 scroll.custom_minimum_size=Vector2(maxf(180,minf(500,viewport_size.x-90)),maxf(150,minf(480,viewport_size.y-120)))
 rebuild();popup_centered();host.fit_game_dialog(self,Vector2i(560,560))
func rebuild(message: String="") -> void:
 for child in body.get_children():body.remove_child(child);child.queue_free()
 var image:=TextureRect.new();image.texture=load("res://assets/ui/ui-art-v306_card_diplomacy.webp")
 image.custom_minimum_size=Vector2(0,100);image.expand_mode=TextureRect.EXPAND_IGNORE_SIZE;image.stretch_mode=TextureRect.STRETCH_KEEP_ASPECT_CENTERED;body.add_child(image)
 var intro:=Label.new();intro.text="Sinu kuningriigi suhted teiste rahvastega.";body.add_child(intro)
 for team in [1,2,3]:
  var cities:=0;var population:=0
  for city in host.game.cities:
   if int(city.team)==team:cities+=1;population+=floori(float(city.economy.realms[team].pop))
  var names: Array=["Eesti","Soome","Rootsi","Norra"]
  var name: String=names[team]
  var current:=Rules.relation(host.game,0,team)
  var label:=Label.new();label.text="%s · %d elanikku · %d linna · %s" % [name,population,cities,{"friendly":"sõprus","neutral":"neutraalne","war":"sõda"}.get(current,current)]
  body.add_child(label)
  var row:=HBoxContainer.new();row.add_theme_constant_override("separation",6);body.add_child(row)
  for entry in [["friendly","Sõprus"],["neutral","Neutraalne"],["war","Sõda"]]:
   var button:=Button.new();button.text=entry[1];button.size_flags_horizontal=Control.SIZE_EXPAND_FILL
   button.disabled=current==entry[0];button.pressed.connect(change_relation.bind(team,entry[0]));row.add_child(button)
 feedback=Label.new();feedback.text=message if not message.is_empty() else "Vali teise riigiga suhe."
 feedback.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART;body.add_child(feedback)
func change_relation(team: int,status: String) -> void:
 var result:=Rules.change_player_relation(host.game,team,status)
 rebuild(str(result.error) if result.has("error") else "Suhe muudetud")
