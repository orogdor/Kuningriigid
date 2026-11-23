extends SceneTree
const Settlement=preload("res://scripts/settlement_rules.gd")
func _initialize() -> void:call_deferred("run_test")
func run_test() -> void:
 var cases=[{"seed":"42","type":"inland","sites":[Vector2i(21,35),Vector2i(179,19),Vector2i(42,149),Vector2i(153,150)]},{"seed":"12345","type":"inland","sites":[Vector2i(21,34),Vector2i(168,14),Vector2i(27,150),Vector2i(163,150)]},{"seed":"42","type":"continents","sites":[Vector2i(34,94),Vector2i(126,48),Vector2i(129,147),Vector2i(195,73)]},{"seed":"42","type":"tectonic","sites":[Vector2i(22,121),Vector2i(173,49),Vector2i(82,39),Vector2i(129,131)]}]
 cases.append_array([{"seed":"12345","type":"continents","sites":[Vector2i(172,108),Vector2i(31,87),Vector2i(146,36),Vector2i(98,73)]},{"seed":"12345","type":"tectonic","sites":[Vector2i(23,117),Vector2i(134,46),Vector2i(43,26),Vector2i(180,124)]}])
 for sample in cases:
  var args:=OS.get_cmdline_user_args();var type_filtered:bool="inland" in args or "continents" in args or "tectonic" in args
  if type_filtered and sample.type not in args:continue
  if "seed=12345" in args and sample.seed!="12345":continue
  var scene=load("res://main.tscn").instantiate();root.add_child(scene);current_scene=scene
  await process_frame
  var menu=scene.game_hud.game_menu;menu.open_menu();menu.seed.text=sample.seed
  for i in menu.world_type.item_count:
   if menu.world_type.get_item_metadata(i)==sample.type:menu.world_type.select(i)
  for i in menu.tempo.item_count:
   if menu.tempo.get_item_metadata(i)=="normal":menu.tempo.select(i)
  menu.difficulty.select(1);menu.start_new();var started:=Time.get_ticks_msec()
  while scene.generation_thread!=null or not scene.pending_load.is_empty():
   assert(Time.get_ticks_msec()-started<180000,"World generation timed out")
   await process_frame
  menu.close_menu();scene.set_process(false);scene.paused=false
  var steps:=0
  while float(scene.game.time)<121.0 and steps<1000:
   scene._process(0.25);steps+=1
   if sample.type=="continents" and sample.seed=="42" and steps==48:
    var rival:Dictionary=scene.game.settlers.filter(func(a):return int(a.team)==3)[0]
    assert(not rival.path.is_empty() and float(rival.get("travelClock",0))==0.0,"New migration paths must start moving on the next frame, as on the web")
   if sample.type=="continents" and sample.seed=="42" and steps==432:
    var rival:Dictionary=scene.game.settlers.filter(func(a):return int(a.team)==3)[0]
    var cell_at=func(c:int,r:int):return scene.grid[r*220+c] if c>=0 and c<220 and r>=0 and r<165 else null
    var suggestions:=Settlement.site_suggestions(scene.game,rival,cell_at,scene.prepare_suggestion_cell)
    var expected=[Vector2i(195,73),Vector2i(193,71),Vector2i(190,73)]
    var scores=[38.2,35.8,34.6]
    assert(suggestions.size()==3)
    for i in 3:
     assert(Vector2i(int(suggestions[i].c),int(suggestions[i].r))==expected[i],"Migration suggestions differ from the web")
     assert(is_equal_approx(float(suggestions[i].score),scores[i]) and suggestions[i].water,"Migration suggestion scoring differs from the web")
   if steps%48==0:await process_frame
  print("GODOT_SEED_CITIES ",sample.type," ",sample.seed," ",JSON.stringify(scene.game.cities.map(func(c):return {"team":c.team,"c":c.c,"r":c.r})))
  assert(scene.game.cities.size()==4,"Expected four starting cities")
  for city in scene.game.cities:
   assert(Vector2i(int(city.c),int(city.r))==sample.sites[int(city.team)],"First city differs from web for "+sample.type+" seed "+sample.seed)
  scene.queue_free();await process_frame
 print("MULTI_SEED_MIGRATION_OK");quit()
