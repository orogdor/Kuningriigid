extends SceneTree
const AI=preload("res://scripts/ai_settlement.gd")
func _initialize():call_deferred("run_test")
func run_test():
 var scene=load("res://main.tscn").instantiate();root.add_child(scene);current_scene=scene
 await process_frame
 var menu=scene.game_hud.game_menu;menu.open_menu();menu.seed.text="20261123"
 for i in menu.world_type.item_count:
  if menu.world_type.get_item_metadata(i)=="inland":menu.world_type.select(i)
 for i in menu.tempo.item_count:
  if menu.tempo.get_item_metadata(i)=="normal":menu.tempo.select(i)
 menu.difficulty.select(1);menu.start_new()
 var started=Time.get_ticks_msec()
 while scene.generation_thread!=null or not scene.pending_load.is_empty():
  assert(Time.get_ticks_msec()-started<180000,"World generation timed out")
  await process_frame
 menu.close_menu();scene.set_process(false);scene.paused=false
 var direct_cases=[{"team":1,"target":{"c":179,"r":14},"expected":Vector2i(179,14)},{"team":2,"target":{"c":40,"r":147},"expected":Vector2i(40,147)},{"team":3,"target":{"c":163,"r":150},"expected":Vector2i(163,150)}]
 for sample in direct_cases:
  var person:Dictionary=scene.game.settlers[int(sample.team)];var target:Dictionary=sample.target
  var selected:Dictionary=AI.first_village_site(target,func(tile):return scene.ai_first_village_survey(person,target,tile))
  print("GODOT_FIRST_VILLAGE ",JSON.stringify({"team":sample.team,"target":target,"selected":selected}))
  assert(Vector2i(int(selected.c),int(selected.r))==sample.expected,"Direct first village selection differs from web")
 var candidates:=[]
 for r in range(140,159):
  for c in range(31,50):
   var cell: Dictionary=scene.grid[r*220+c];scene.prepare_ai_settlement_cell(cell)
   candidates.append({"c":c,"r":r,"land":cell.land,"mountain":cell.mountain,"deposits":cell.deposits.duplicate(true)})
 var out=FileAccess.open("user://migration_candidates.json",FileAccess.WRITE);out.store_string(JSON.stringify(candidates));out.close()
 var expected: Array=JSON.parse_string(FileAccess.get_file_as_string("res://tests/migration_web_reference.json"))
 assert(expected.size()==candidates.size())
 for i in expected.size():
  assert(expected[i].c==candidates[i].c and expected[i].r==candidates[i].r)
  for kind in expected[i].deposits:
   assert(bool(expected[i].deposits[kind])==bool(candidates[i].deposits.get(kind,false)),"Candidate resource differs from the website")
 print("MIGRATION_START ",JSON.stringify(scene.game.settlers.map(func(a):return {"team":a.team,"c":a.c,"r":a.r})))
 var steps:=0
 while float(scene.game.time)<121.0 and steps<1000:
  scene._process(0.25);steps+=1
  if steps%40==0:
   print("MIGRATION_PROGRESS ",scene.game.time," ",JSON.stringify(scene.game.settlers.map(func(a):return {"team":a.team,"c":a.c,"r":a.r,"path":a.get("path",[]),"landed":a.get("landed",false),"goal":a.get("aiSettlementGoal"),"chosen":a.get("chosenSiteV274")})))
   await process_frame
 print("MIGRATION_CITIES ",JSON.stringify(scene.game.cities.map(func(c):return {"team":c.team,"c":c.c,"r":c.r})))
 assert(scene.game.cities.size()>=4)
 var sites={0:Vector2i(21,34),1:Vector2i(179,14),2:Vector2i(40,147),3:Vector2i(163,150)}
 for city in scene.game.cities:
  assert(Vector2i(int(city.c),int(city.r))==sites[int(city.team)],"City location differs from the website test")
 print("MIGRATION_WEB_PARITY_OK")
 scene.open_type_house_designer("house",0)
 assert(is_instance_valid(scene.house_designer_layer),"House designer did not open from the game")
 var panel=scene.house_designer_layer.get_child(0);var changed:Dictionary=panel.canvas.design.duplicate(true);changed.roofHeight=110
 panel.canvas.design=changed;panel.save_current_design()
 assert(scene.game.houseDesignTemplatesV354.house.roofHeight==110,"Saving the editor must update the game template")
 assert(scene.save_partial(false,"user://house_design_roundtrip.json"),"Game save failed")
 scene.game.houseDesignTemplatesV354.house.roofHeight=70
 scene.load_partial("user://house_design_roundtrip.json");scene.set_process(true)
 var load_started:=Time.get_ticks_msec()
 while scene.generation_thread!=null or not scene.pending_load.is_empty():
  assert(Time.get_ticks_msec()-load_started<180000,"Save reload timed out")
  await process_frame
 assert(float(scene.game.houseDesignTemplatesV354.house.roofHeight)==110,"Customized house must survive save and reload")
 print("HOUSE_DESIGN_SAVE_RELOAD_OK")
 scene.toggle_detail();await process_frame
 assert(scene.can_build_on_detail(),"Player city detail did not open")
 scene.selected_building_index=0
 var hall:Dictionary=scene.game.cities[scene.active_city_index].economy.buildings[0]
 assert(hall.type=="hall" and hall.ready,"Fixture requires a ready hall")
 scene.open_selected_house_designer()
 assert(is_instance_valid(scene.house_designer_layer),"Existing building designer did not open")
 var existing_panel=scene.house_designer_layer.get_child(0);var changed_hall:Dictionary=existing_panel.canvas.design.duplicate(true);changed_hall.roofHeight=120;changed_hall.yard[0].x-=10
 var yard_corner_x:float=changed_hall.yard[0].x
 existing_panel.canvas.design=changed_hall;existing_panel.save_current_design()
 assert(float(hall.houseDesignV354.roofHeight)==120,"Existing hall design was not saved")
 assert(scene.detail_root.hall_model.find_child("RoofDeck",true,false)!=null,"Designed hall model was not installed in detail view")
 assert(scene.detail_root.hall_model.find_child("WeatheredYard",true,false)!=null,"Designed yard was not installed in detail view")
 assert(scene.save_partial(false,"user://house_design_existing_roundtrip.json"),"Existing building save failed")
 hall.houseDesignV354.roofHeight=70
 scene.load_partial("user://house_design_existing_roundtrip.json")
 load_started=Time.get_ticks_msec()
 while scene.generation_thread!=null or not scene.pending_load.is_empty():
  assert(Time.get_ticks_msec()-load_started<180000,"Existing building reload timed out")
  await process_frame
 assert(float(scene.game.cities[scene.active_city_index].economy.buildings[0].houseDesignV354.roofHeight)==120,"Existing hall design must survive reload")
 assert(is_equal_approx(float(scene.game.cities[scene.active_city_index].economy.buildings[0].houseDesignV354.yard[0].x),yard_corner_x),"Designed yard must survive reload" )
 print("EXISTING_HOUSE_DESIGN_SAVE_RELOAD_OK")
 scene.queue_free();quit()
