extends Node

const Human=preload("res://assets/people/human_far.glb")
const Motion=preload("res://scripts/human_motion.gd")
const Navigation=preload("res://scripts/local_navigation.gd")
const Grid=preload("res://scripts/campaign_grid.gd")
const Terrain=preload("res://scripts/detail_terrain.gd")
const HouseCollision=preload("res://scripts/house_collision.gd")
const Production=preload("res://scripts/production_bonuses.gd")
var host: Node
var active:=false
var placing:=false
var placed:=false
var switching:=false
var tile:=Vector2i.ZERO
var pos:=Vector3.ZERO
var velocity:=Vector3.ZERO
var yaw:=0.54
var pitch:=-0.08
var vertical_speed:=0.0
var airborne:=false
var moving:=false
var bob:=0.0
var model: Node3D
var motion:=Motion.new()
var overlay: CanvasLayer
var bar: Control
var hint: Label
var names_button: Button
var saved_camera: Dictionary={}
var touch_move_id:=-1
var touch_look_id:=-1
var touch_origin:=Vector2.ZERO
var touch_movement:=Vector2.ZERO
var touch_look_last:=Vector2.ZERO
var touch_stick:Panel
var touch_knob:Panel

func _ready() -> void:
	model=Human.instantiate();model.name="FirstPersonWalker";model.scale=Vector3.ONE*1.66;model.visible=false;add_child(model)
	overlay=CanvasLayer.new();overlay.layer=20;add_child(overlay)
	bar=Control.new();bar.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);bar.mouse_filter=Control.MOUSE_FILTER_IGNORE;bar.visible=false;overlay.add_child(bar)
	var cross:=Label.new();cross.text="+";cross.add_theme_font_size_override("font_size",24);cross.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER;cross.vertical_alignment=VERTICAL_ALIGNMENT_CENTER;cross.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);cross.mouse_filter=Control.MOUSE_FILTER_IGNORE;bar.add_child(cross)
	var info:=Label.new();info.text="Esimese isiku vaade · WASD liigu · hiir vaata · Shift jookse · tühik hüppa · Tab hiir · Esc välju";info.position=Vector2(20,20);info.add_theme_font_size_override("font_size",17);info.add_theme_color_override("font_color",Color.WHITE);info.add_theme_color_override("font_shadow_color",Color.BLACK);info.add_theme_constant_override("shadow_offset_x",2);info.add_theme_constant_override("shadow_offset_y",2);bar.add_child(info)
	var buttons:=HBoxContainer.new();buttons.set_anchors_preset(Control.PRESET_TOP_RIGHT);buttons.position=Vector2(-340,54);bar.add_child(buttons)
	names_button=Button.new();names_button.text="Nimed: sees" if host.graphics_soldier_names else "Nimed: väljas"
	names_button.pressed.connect(func():
		host.game_hud.game_menu.set_graphics_value("names",not host.graphics_soldier_names)
		names_button.text="Nimed: sees" if host.graphics_soldier_names else "Nimed: väljas")
	buttons.add_child(names_button)
	var reposition:=Button.new();reposition.text="Paiguta ümber";reposition.pressed.connect(func():exit_walking();placed=false;start());buttons.add_child(reposition)
	var leave:=Button.new();leave.text="Välju";leave.pressed.connect(exit_walking);buttons.add_child(leave)
	hint=Label.new();hint.text="Klõpsa detailkaardil kohta, kuhu tegelane asetada · Esc katkestab";hint.position=Vector2(20,65);hint.visible=false;overlay.add_child(hint)
	touch_stick=Panel.new();touch_stick.size=Vector2(110,110);touch_stick.mouse_filter=Control.MOUSE_FILTER_IGNORE;touch_stick.visible=false
	var ring:=StyleBoxFlat.new();ring.bg_color=Color(0.08,0.12,0.12,0.32);ring.border_color=Color(1,1,1,0.45);ring.set_border_width_all(2);ring.set_corner_radius_all(55);touch_stick.add_theme_stylebox_override("panel",ring);bar.add_child(touch_stick)
	touch_knob=Panel.new();touch_knob.size=Vector2(38,38);touch_knob.position=Vector2(36,36);touch_knob.mouse_filter=Control.MOUSE_FILTER_IGNORE
	var knob_style:=StyleBoxFlat.new();knob_style.bg_color=Color(1,1,1,0.5);knob_style.set_corner_radius_all(19);touch_knob.add_theme_stylebox_override("panel",knob_style);touch_stick.add_child(touch_knob)

func start() -> void:
	if not host.detail_mode:host.update_status("Ava esmalt detailkaart.");return
	if host.battle_view!=null:host.update_status("Kõndimine ei ole lahingus saadaval.");return
	if active:exit_walking();return
	if placing:cancel_placing();return
	if placed and tile==current_tile():enter();return
	placing=true;hint.visible=true;host.update_status("Klõpsa kaardil tegelase asukoht.")

func current_tile() -> Vector2i:
	return host.selected if host.detail_inspection else host.player

func cancel_placing() -> void:
	placing=false;hint.visible=false

func place_at(x: float,z: float) -> bool:
	if blocked(x,z):host.update_status("Tegelast ei saa vette või hoonesse asetada.");return false
	pos=Vector3(x,ground_height(x,z),z);tile=current_tile();placed=true;cancel_placing();yaw=0.54;pitch=-0.08;host.zoom=45.0;enter();return true

func enter() -> void:
	if not placed:return
	active=true;velocity=Vector3.ZERO;vertical_speed=0;airborne=false;model.visible=false;bar.visible=true
	if names_button!=null:names_button.text="Nimed: sees" if host.graphics_soldier_names else "Nimed: väljas"
	saved_camera={"fov":host.camera.fov,"near":host.camera.near,"far":host.camera.far}
	host.camera.fov=68.0;host.camera.near=0.05;host.camera.far=2400.0
	if is_instance_valid(host.game_hud):host.game_hud.visible=false
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED);apply_camera()

func exit_walking() -> void:
	if not active:return
	active=false;velocity=Vector3.ZERO;bar.visible=false;Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)
	touch_move_id=-1;touch_look_id=-1;touch_movement=Vector2.ZERO;touch_stick.visible=false
	if not saved_camera.is_empty():host.camera.fov=saved_camera.fov;host.camera.near=saved_camera.near;host.camera.far=saved_camera.far;saved_camera={}
	if is_instance_valid(host.game_hud):host.game_hud.visible=true
	host.camera_target=Vector3(pos.x,0,pos.z);host.zoom=minf(host.zoom,70.0);sync_model();host.update_camera()

func sync_model() -> void:
	model.position=pos;model.rotation.y=yaw+PI;model.visible=placed and not active and host.detail_mode and tile==current_tile()

func handle_input(event: InputEvent) -> bool:
	if placing:
		if event is InputEventKey and event.pressed and event.keycode==KEY_ESCAPE:cancel_placing();return true
		if event is InputEventScreenTouch and event.pressed:
			var p: Variant=host.detail_point(event.position)
			if p!=null:place_at(float(p.x),float(p.z))
			return true
		if event is InputEventMouseButton and event.pressed and event.button_index==MOUSE_BUTTON_LEFT:
			var p: Variant=host.detail_point(event.position)
			if p!=null:place_at(float(p.x),float(p.z))
			return true
		return false
	if not active:return false
	if event is InputEventScreenTouch:
		if event.pressed:
			if event.position.x<get_viewport().get_visible_rect().size.x*0.5 and touch_move_id<0:
				touch_move_id=event.index;touch_origin=event.position;touch_movement=Vector2.ZERO;touch_stick.position=touch_origin-Vector2(55,55);touch_knob.position=Vector2(36,36);touch_stick.visible=true
			elif touch_look_id<0:touch_look_id=event.index;touch_look_last=event.position
		else:
			if event.index==touch_move_id:touch_move_id=-1;touch_movement=Vector2.ZERO;touch_stick.visible=false
			if event.index==touch_look_id:touch_look_id=-1
		return true
	if event is InputEventScreenDrag:
		if event.index==touch_move_id:
			var delta:Vector2=event.position-touch_origin
			delta.x=clampf(delta.x,-50,50);delta.y=clampf(delta.y,-50,50)
			touch_movement=Vector2(delta.x,-delta.y)/50.0;touch_knob.position=Vector2(36,36)+delta
		elif event.index==touch_look_id:
			var delta:Vector2=event.position-touch_look_last;touch_look_last=event.position
			yaw-=delta.x*0.006;pitch=clampf(pitch-delta.y*0.005,-1.35,1.2);apply_camera()
		return true
	if event is InputEventKey:
		if event.pressed and not event.echo:
			if event.keycode==KEY_ESCAPE:exit_walking();return true
			if event.keycode==KEY_TAB:
				Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE if Input.mouse_mode==Input.MOUSE_MODE_CAPTURED else Input.MOUSE_MODE_CAPTURED);return true
			if event.keycode==KEY_SPACE and not airborne:vertical_speed=1.66*3.1;airborne=true
		return true
	if event is InputEventMouseMotion:
		if Input.mouse_mode==Input.MOUSE_MODE_CAPTURED:yaw-=event.relative.x*0.0024;pitch=clampf(pitch-event.relative.y*0.0022,-1.35,1.2);apply_camera()
		return true
	if event is InputEventMouseButton:
		if event.pressed and event.button_index==MOUSE_BUTTON_LEFT:Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)
		return true
	return false

func pier_height(x: float,z: float) -> Variant:
	var dc:=floori((x+112.5)/225.0);var dr:=floori((z+97.5)/195.0);var at:=current_tile()+Vector2i(dc,dr);var best: Variant=null
	for parent in host.game.get("cities",[]):
		var contexts: Array=[parent];contexts.append_array(parent.get("districts",{}).values())
		for city in contexts:
			if int(city.c)!=at.x or int(city.r)!=at.y:continue
			for building in city.economy.buildings:
				if building.get("type","") not in ["fisher","harbor"] or not building.get("ready",false) or float(building.get("hp",0))<=0:continue
				var bx:=float(building.x)+dc*225.0;var bz:=float(building.z)+dr*195.0
				if absf(x-bx)>35 or absf(z-bz)>35:continue
				var surface: Variant=HouseCollision.pier_surface(host.detail_root,building,Production.upgrade_level(host.game,int(city.team)),x,z,Vector2(dc*225.0,dr*195.0))
				if surface==null:continue
				var base:float=host.detail_rendered_height(bx,bz)
				if building.has("baseY"):
					if building.get("riverBankV276",false):
						var heights: Array=host.detail_root.heights if dc==0 and dr==0 else host.detail_pick_heights.get(str(at.x)+":"+str(at.y),[])
						if not heights.is_empty():base+=float(building.baseY)-Terrain.detail_height(heights,float(building.x),float(building.z))
					else:base=float(building.baseY)
				var height:=base+float(surface)
				if best==null or height>float(best):best=height
	return best

func ground_height(x: float,z: float) -> float:
	var height:float=host.detail_rendered_height(x,z);var pier: Variant=pier_height(x,z)
	return maxf(height,float(pier)) if pier!=null else height

func blocked(x: float,z: float) -> bool:
	if not host.detail_mode or absf(x)>335.5 or absf(z)>290.5:return true
	var dc:=floori((x+112.5)/225.0);var dr:=floori((z+97.5)/195.0);var at:=current_tile()+Vector2i(dc,dr)
	if at.x<0 or at.y<0 or at.x>=Grid.COLS or at.y>=Grid.ROWS:return true
	if not host.reveal_all and not host.game.explored[0].has(str(at.x)+":"+str(at.y)):return true
	if host.detail_rendered_height(x,z)<-0.25 and pier_height(x,z)==null:return true
	var contexts:=[]
	for parent in host.game.get("cities",[]):
		contexts.append(parent);contexts.append_array(parent.get("districts",{}).values())
	for city in contexts:
		if int(city.c)!=at.x or int(city.r)!=at.y:continue
		for b in city.economy.buildings:
			if b.get("virtual",false) or float(b.get("hp",0))<=0 or b.type in ["bridge","field","pasture","road"]:continue
			var bounds: Variant=Navigation.clearance(b)
			if bounds!=null:
				var early:float=maxf(float(bounds.rx),float(bounds.rz))*2.0+35.0
				if absf(x-(float(b.x)+dc*225.0))>=early or absf(z-(float(b.z)+dr*195.0))>=early:continue
				var age:=Production.upgrade_level(host.game,int(city.team))
				var reach:float=maxf(maxf(float(bounds.rx),float(bounds.rz))*0.82+2.0,HouseCollision.reach(host.detail_root,b,age))
				if absf(x-(float(b.x)+dc*225.0))>=reach or absf(z-(float(b.z)+dr*195.0))>=reach:continue
				var hit:Variant=HouseCollision.hits(host.detail_root,b,Production.upgrade_level(host.game,int(city.team)),x,z,Vector2(dc*225.0,dr*195.0))
				if hit==true:return true
				if hit==null and b.type not in ["woodgate","gatehouse"] and absf(x-(float(b.x)+dc*225.0))<float(bounds.rx)*0.82 and absf(z-(float(b.z)+dr*195.0))<float(bounds.rz)*0.82:return true
	return false

func step(dt: float,input: Vector2,run: bool) -> void:
	if not active:return
	dt=minf(dt,0.1)
	if input.length()>1:input=input.normalized()
	var speed:=1.66*(5.6 if run else 2.4)
	var forward:=Vector3(-sin(yaw),0,-cos(yaw));var side:=Vector3(cos(yaw),0,-sin(yaw))
	var want:=forward*input.y*speed+side*input.x*speed
	velocity=velocity.lerp(want,1.0-exp(-dt*(2.0 if airborne else 12.0)));moving=velocity.length_squared()>0.04
	var nx:=pos.x+velocity.x*dt;var nz:=pos.z+velocity.z*dt
	if not blocked(nx,pos.z):pos.x=nx
	else:velocity.x=0
	if not blocked(pos.x,nz):pos.z=nz
	else:velocity.z=0
	var ground: float=ground_height(pos.x,pos.z)
	vertical_speed-=1.66*9.5*dt;pos.y+=vertical_speed*dt
	if pos.y<=ground:pos.y=ground;vertical_speed=0;airborne=false
	if moving and not airborne:bob+=dt*(13.0 if run else 8.5)
	var dc:=1 if pos.x>112.5 else -1 if pos.x< -112.5 else 0
	var dr:=1 if pos.z>97.5 else -1 if pos.z< -97.5 else 0
	if dc!=0 or dr!=0:
		var delta:=Vector2i(dc,dr);var next:=current_tile()+delta;switching=true
		var ok: bool=host.transition_detail_tile(next,delta);switching=false
		if ok:pos-=Vector3(dc*225.0,0,dr*195.0);tile=next
		else:pos.x=clampf(pos.x,-112.25,112.25);pos.z=clampf(pos.z,-97.25,97.25)
	apply_camera()

func update(dt: float) -> void:
	if not active:
		if placed:sync_model();motion.apply(model,host.elapsed,false)
		return
	var input:=Vector2(int(Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT))-int(Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT)),int(Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP))-int(Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN)))
	input+=touch_movement
	step(dt,input,Input.is_key_pressed(KEY_SHIFT) or touch_movement.length()>0.92)

func apply_camera() -> void:
	if not active:return
	var eye:=1.66*0.90+(sin(bob)*1.66*0.025 if moving and not airborne else 0.0)
	var position:=pos+Vector3(0,eye,0);var direction:=Vector3(-sin(yaw)*cos(pitch),sin(pitch),-cos(yaw)*cos(pitch))
	host.camera.position=position;host.camera.look_at(position+direction,Vector3.UP)

func on_detail_closed() -> void:
	cancel_placing()
	if active and not switching:exit_walking()
	model.visible=false

