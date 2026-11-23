extends Control

const Grid=preload("res://scripts/campaign_grid.gd")
const Terrain=preload("res://scripts/world_terrain.gd")
const Geography=preload("res://scripts/world_geography.gd")
const Campaign=preload("res://scripts/campaign_state.gd")
const DetailTerrain=preload("res://scripts/detail_terrain.gd")
const UI:="res://assets/ui/"
const ICONS:={"clay":"res_clay","copper":"res_copper","tin":"res_tin","wood":"res_wood","stone":"res_stone","ore":"res_iron","grain":"res_grain","water":"res_water","coal":"res_coal"}
const LABELS:={"game":"🦌","fish":"🐟","oil":"🛢"}
const LABEL_COLORS:={"game":"dcb993","fish":"9cd8e0","oil":"463b34"}
const RANK:=["copper","tin","ore","clay","stone","water","grain","game","fish","wood"]
var host: Node
var manual:=false
var icons: Dictionary={}
var records: Array=[]
var stamp: String=""
var clock:=0.0
var suggestion_clock:=3.0
var suggestion_stamp: String=""
var suggestions: Array=[]
var city_banner: StyleBoxFlat
var route_stamp: String=""
var route_dashes: Array=[]
var route_markers: Array=[]

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter=Control.MOUSE_FILTER_IGNORE
	var settings:=ConfigFile.new()
	if settings.load("user://kuningriigid_godot_settings.cfg")==OK:manual=bool(settings.get_value("interface","resource_layer",false))
	for key in ICONS:
		var texture: Texture2D=load(UI+"ui-art-v263_"+ICONS[key]+".webp")
		var art:=texture.get_image();art.convert(Image.FORMAT_RGBA8)
		for y in art.get_height():
			for x in art.get_width():
				var pixel:=art.get_pixel(x,y);var corrected:=pixel.linear_to_srgb();corrected.a=pixel.a;art.set_pixel(x,y,corrected)
		icons[key]=ImageTexture.create_from_image(art)
	city_banner=StyleBoxFlat.new();city_banner.bg_color=Color(0.047,0.102,0.110,0.86)
	city_banner.border_color=Color(0.90,0.78,0.49,0.75);city_banner.set_border_width_all(1);city_banner.set_corner_radius_all(12)

func toggle_manual() -> void:
	manual=not manual;stamp=""
	var settings:=ConfigFile.new();settings.load("user://kuningriigid_godot_settings.cfg")
	settings.set_value("interface","resource_layer",manual);settings.save("user://kuningriigid_godot_settings.cfg")
	host.update_status("Maardlate tähised on sees." if manual else "Asuniku lähedal kuvatakse maardlad automaatselt." if host.selected_entity=="settler" and (not host.city_created or host.settler_mode) else "Maardlate tähised on väljas.")

func _process(delta: float) -> void:
	if host==null or host.game.is_empty():return
	visible=true
	if host.detail_mode:
		queue_redraw();return
	clock+=delta
	if host.migration_active():
		suggestion_clock+=delta
		var position_stamp: String="%s:%s:%s" % [host.game.seed,host.settler.c,host.settler.r]
		if suggestion_clock>=3.0 or position_stamp!=suggestion_stamp:
			suggestion_clock=0.0;suggestion_stamp=position_stamp;suggestions=host.migration_suggestions()
	elif not suggestions.is_empty():suggestions.clear();suggestion_stamp=""
	if clock>=0.4:
		clock=0.0;refresh_records()
	queue_redraw()

func refresh_records() -> void:
	var automatic: bool=host.selected_entity=="settler" and (not host.city_created or host.settler_mode)
	var show: bool=manual or automatic
	var c:=floori(host.camera_target.x/host.CELL_SIZE+Grid.COLS/2.0)
	var r:=floori(host.camera_target.z/host.CELL_SIZE+Grid.ROWS/2.0)
	var next: String="%d:%d:%s:%s:%s:%s" % [c,r,host.game.get("visionRevision",0),manual,automatic,"oil_drilling" in host.game.research[0].known]+":"+str(host.reveal_all)
	if next==stamp:return
	stamp=next;records.clear()
	if not show:return
	var reach:=6 if manual else 3
	var tiles: Array=[]
	for dr in range(-reach,reach+1):
		for dc in range(-reach,reach+1):
			var x:=c+dc;var z:=r+dr
			if x<0 or x>=Grid.COLS or z<0 or z>=Grid.ROWS or (not host.reveal_all and not host.game.explored[0].has(str(x)+":"+str(z))):continue
			tiles.append({"c":x,"r":z,"dist":absi(dc)+absi(dr)})
	tiles.sort_custom(func(a,b):return int(a.dist)<int(b.dist))
	var fish_count:=0
	for tile in tiles:
		if records.size()>=160:break
		var cell: Dictionary=host.grid[int(tile.r)*Grid.COLS+int(tile.c)]
		if cell.land:host.city_cell_data(tile)
		var biome: String=host.visual_biome(int(tile.r)*Grid.COLS+int(tile.c))
		var deps: Array=[]
		for resource in cell.get("deposits",{}):
			if not cell.deposits[resource] or (resource=="oil" and "oil_drilling" not in host.game.research[0].known):continue
			if resource=="wood" and biome in ["forest","taiga","jungle"]:continue
			deps.append(resource)
		if not manual:
			deps.sort_custom(func(a,b):
				var left:=RANK.find(a);var right:=RANK.find(b)
				return left<right)
			if deps.size()>2:deps.resize(2)
		for i in deps.size():
			if records.size()>=160:break
			var kind: String=deps[i]
			if kind=="fish":
				if fish_count>=46 or Geography.noise(int(tile.c)*3+917,int(tile.r)*7+204,int(host.game.seed))<0.37:continue
				fish_count+=1
			var at: Vector3=host.cell_position(Vector2i(tile.c,tile.r))+Vector3(1+(float(i)-(deps.size()-1)/2.0)*0.4,0,1.4)
			at.y=host.world_marker_height(at)+(0.08 if kind=="fish" else 0.16)
			records.append({"kind":kind,"position":at})

func _draw() -> void:
	if host==null or host.camera==null:return
	if host.detail_mode:
		draw_detail_city_banner();return
	draw_selected_route()
	if host.selected.x>=0 and host.selected.y>=0:
		var corners:=PackedVector2Array()
		for offset in [Vector2(-0.48,-0.48),Vector2(0.48,-0.48),Vector2(0.48,0.48),Vector2(-0.48,0.48)]:
			var corner:=route_world_point(float(host.selected.x)+offset.x,float(host.selected.y)+offset.y)
			corners.append(host.camera.unproject_position(corner))
		draw_colored_polygon(corners,Color(0.92,0.81,0.48,0.28))
	for i in suggestions.size():
		var site: Dictionary=suggestions[i]
		var map_point: Vector3=host.cell_position(Vector2i(site.c,site.r))+Vector3(1,0,1)
		map_point.y=host.world_marker_height(map_point)
		var screen: Vector2=host.camera.unproject_position(map_point)
		var radius:=clampf(0.45*get_viewport_rect().size.y/maxf(1.0,host.zoom),6.0,24.0)
		draw_arc(screen,radius,0,TAU,32,Color("8fe0a0"),1.5,true)
		draw_circle(screen+Vector2(0,-radius),maxf(5.0,radius*0.55),Color(0.12,0.23,0.12,0.9))
		draw_string(ThemeDB.fallback_font,screen+Vector2(-3,-radius+4),str(i+1),HORIZONTAL_ALIGNMENT_LEFT,-1,12,Color("a9e9b2"))
	for record in records:
		if host.camera.is_position_behind(record.position):continue
		var p: Vector2=host.camera.unproject_position(record.position)
		var edge: Vector2=host.camera.unproject_position(record.position+host.camera.global_transform.basis.x*0.44)
		var icon_size:=clampf(p.distance_to(edge)*0.896,2.0,36.0)
		if p.x < -icon_size or p.y < -icon_size or p.x > size.x+icon_size or p.y > size.y+icon_size:continue
		var badge:=Color(0.118,0.078,0.043).linear_to_srgb();badge.a=0.88
		draw_circle(p,icon_size/2.0,badge)
		draw_arc(p,icon_size/2.0-0.5,0,TAU,20,Color("d9b673").linear_to_srgb(),maxf(0.6,icon_size/24.0),true)
		var kind: String=record.kind
		if icons.has(kind):draw_texture_rect(icons[kind],Rect2(p-Vector2.ONE*icon_size*0.34,Vector2.ONE*icon_size*0.68),false,Color(1,1,1,0.72))
		else:draw_string(ThemeDB.fallback_font,p+Vector2(-icon_size*0.25,icon_size*0.22),str(LABELS.get(kind,"♧")),HORIZONTAL_ALIGNMENT_LEFT,-1,maxi(6,roundi(icon_size*0.62)),Color(LABEL_COLORS.get(kind,"d9bc84")))
	draw_city_banners()

func draw_detail_city_banner() -> void:
	if host.battle_view!=null or host.settler_mode:return
	var tile: Vector2i=host.selected if host.detail_inspection else host.player
	var city: Variant=null
	for candidate in host.game.get("cities",[]):
		if int(candidate.c)==tile.x and int(candidate.r)==tile.y and (int(candidate.team)==0 or Campaign.visible_now(host.game,0,candidate)):
			city=candidate;break
	if city==null or not is_instance_valid(host.detail_root):return
	var hall: Variant=null
	for building in city.economy.buildings:
		if building.type=="hall" and not building.get("virtual",false) and float(building.get("hp",0))>0:hall=building;break
	if hall==null:return
	var point:=Vector3(float(hall.x),host.detail_root.display_height(hall.x,hall.z)+26.0,float(hall.z)-14.0)
	if host.camera.is_position_behind(point):return
	var anchor: Vector2=host.camera.unproject_position(point)
	var scale:=clampf(get_viewport_rect().size.y/720.0,0.5,2.0);var width:=186.0*scale;var height:=29.0*scale
	var rect:=Rect2(anchor.x-width/2,anchor.y-height,width,height)
	if not Rect2(Vector2.ZERO,size).intersects(rect):return
	draw_style_box(city_banner,rect)
	var x:=rect.position.x;var y:=rect.position.y
	var shield:=PackedVector2Array([Vector2(x+9*scale,y+6*scale),Vector2(x+22*scale,y+6*scale),Vector2(x+22*scale,y+16*scale),Vector2(x+15.5*scale,y+23*scale),Vector2(x+9*scale,y+16*scale)])
	draw_colored_polygon(shield,Color(["4f9a92","c0634a","8a6cc0","c9a43a"][clampi(int(city.team),0,3)]));draw_polyline(shield+PackedVector2Array([shield[0]]),Color("f4dfaa"),scale)
	var font: Font=host.game_hud.ui_bold if host.game_hud.ui_bold!=null else get_theme_default_font()
	var font_size:=maxi(9,roundi(14*scale));var name:=str(city.get("name","Linn"));var population:=str(floori(float(city.economy.realms[city.team].pop)))
	draw_string(font,Vector2(x+28*scale,y+19*scale),name,HORIZONTAL_ALIGNMENT_LEFT,110*scale,font_size,Color("f4ead2"))
	var pop_text:="♟ "+population;var pop_size:=maxi(8,roundi(11*scale));var pop_width:=font.get_string_size(pop_text,HORIZONTAL_ALIGNMENT_LEFT,-1,pop_size).x
	draw_string(font,Vector2(x+width-pop_width-5*scale,y+19*scale),pop_text,HORIZONTAL_ALIGNMENT_LEFT,-1,pop_size,Color("e6c77e"))

func draw_city_banners() -> void:
	var scale:=clampf(get_viewport_rect().size.y/941.0,0.65,1.4)
	var font_size:=maxi(10,roundi(15*scale))
	for city in host.game.get("cities",[]):
		if int(city.team)!=0 and not Campaign.visible_now(host.game,0,city):continue
		var point: Vector3=host.cell_position(Vector2i(int(city.c),int(city.r)))+Vector3(1,0,-0.08)
		point.y=host.world_marker_height(point)+1.36
		if host.camera.is_position_behind(point):continue
		var anchor: Vector2=host.camera.unproject_position(point)
		if anchor.x < -100 or anchor.y < -50 or anchor.x > size.x+100 or anchor.y > size.y+50:continue
		var name:=str(city.get("name","Linn"));var population:=str(floori(float(city.economy.realms[city.team].pop)))
		var name_width:=get_theme_default_font().get_string_size(name,HORIZONTAL_ALIGNMENT_LEFT,-1,font_size).x
		var pop_width:=get_theme_default_font().get_string_size(population,HORIZONTAL_ALIGNMENT_LEFT,-1,font_size).x
		var width:=clampf(name_width+pop_width+48*scale,90*scale,210*scale);var height:=27*scale
		var rect:=Rect2(anchor.x-width/2,anchor.y-height,width,height)
		draw_style_box(city_banner,rect)
		var shield:=Rect2(rect.position+Vector2(8,6)*scale,Vector2(12,14)*scale)
		draw_rect(shield,Color(["4f9a92","c0634a","8a6cc0","c9a43a"][clampi(int(city.team),0,3)]))
		draw_string(get_theme_default_font(),rect.position+Vector2(25,19)*scale,name,HORIZONTAL_ALIGNMENT_LEFT,width-pop_width-47*scale,font_size,Color("f4ead2"))
		draw_string(get_theme_default_font(),rect.position+Vector2(width-pop_width-8*scale,19*scale),population,HORIZONTAL_ALIGNMENT_LEFT,-1,font_size,Color("e6c77e"))

func route_world_point(c: float,r: float) -> Vector3:
	var point:=Vector3((c+0.5-Grid.COLS/2.0)*host.CELL_SIZE,0,(r+0.5-Grid.ROWS/2.0)*host.CELL_SIZE)
	point.y=host.world_marker_height(point)+0.08
	return point

func draw_selected_route() -> void:
	var mover: Variant=null
	match host.selected_entity:
		"settler":mover=host.settler
		"army":mover=host.selected_army()
		"ship":mover=host.selected_ship()
		"merchant":mover=host.selected_merchant()
	if not mover is Dictionary or not mover.has("c") or not mover.has("r"):return
	var path: Array=mover.get("path",[])
	if path.is_empty():return
	var stamp: String=str(host.game.seed)+":"+str(mover.c)+":"+str(mover.r)+":"+str(path)
	if stamp!=route_stamp:prepare_route(mover,path,stamp)
	var bounds:=Rect2(Vector2(-10,-10),get_viewport_rect().size+Vector2(20,20))
	for dash in route_dashes:
		var from: Vector3=dash[0];var to: Vector3=dash[1]
		if host.camera.is_position_behind(from) or host.camera.is_position_behind(to):continue
		var a: Vector2=host.camera.unproject_position(from);var b: Vector2=host.camera.unproject_position(to)
		if bounds.has_point(a) or bounds.has_point(b):draw_line(a,b,Color("f4d48b"),1.5,true)
	for marker in route_markers:
		if host.camera.is_position_behind(marker):continue
		var screen: Vector2=host.camera.unproject_position(marker)
		if not bounds.has_point(screen):continue
		var radius:=clampf(get_viewport_rect().size.y/host.zoom*0.10,1.5,7.0)
		draw_arc(screen,radius,0,TAU,12,Color("fae4a4"),1.0,true)
	if route_markers.is_empty():return
	var destination: Vector3=route_markers.back()
	if not host.camera.is_position_behind(destination):
		var screen: Vector2=host.camera.unproject_position(destination)
		if not bounds.has_point(screen):return
		var radius:=clampf(get_viewport_rect().size.y/host.zoom*0.48,5.0,32.0)
		draw_arc(screen,radius,0,TAU,32,Color("f6d77b"),1.5,true)
		var lift:=radius+7.0+sin(float(host.game.time)*3.0)*2.0
		draw_colored_polygon(PackedVector2Array([screen+Vector2(0,-radius-2),screen+Vector2(-4,-lift-7),screen+Vector2(4,-lift-7)]),Color("eaca7a"))

func prepare_route(mover: Dictionary,path: Array,stamp: String) -> void:
	route_stamp=stamp;route_dashes.clear();route_markers.clear()
	var previous:=Vector2(float(mover.c),float(mover.r));var dash_distance:=0.0
	for tile in path:
		if not tile is Dictionary or not tile.has("c") or not tile.has("r"):continue
		var next:=Vector2(float(tile.c),float(tile.r))
		for step in 10:
			var from:=route_world_point(previous.lerp(next,float(step)/10.0).x,previous.lerp(next,float(step)/10.0).y)
			var to:=route_world_point(previous.lerp(next,float(step+1)/10.0).x,previous.lerp(next,float(step+1)/10.0).y)
			var length:=from.distance_to(to);var offset:=0.0
			while offset<length:
				var phase:=fmod(dash_distance+offset,0.32);var drawing:=phase<0.199999
				var draw_length:=minf(length-offset,(0.20-phase) if drawing else (0.32-phase))
				if drawing:route_dashes.append([from.lerp(to,offset/maxf(length,0.00001)),from.lerp(to,(offset+draw_length)/maxf(length,0.00001))])
				offset+=maxf(draw_length,0.00001)
			dash_distance+=length
		route_markers.append(route_world_point(next.x,next.y))
		previous=next

