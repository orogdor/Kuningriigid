extends Control

const Grid = preload("res://scripts/campaign_grid.gd")
const Roads = preload("res://scripts/world_roads.gd")
const Geography = preload("res://scripts/world_geography.gd")
var host: Node
var circular := false
var map_texture: ImageTexture
var base_image: Image
var base_seed = null
var fog_stamp := ""
var refresh_clock := 0.0

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	tooltip_text = "Klõpsa, et liigutada maailmakaardi vaadet"

func _process(delta: float) -> void:
	if host == null or host.game.is_empty() or host.grid.size() != Grid.COLS*Grid.ROWS: return
	refresh_clock += delta
	if refresh_clock >= 0.75 or map_texture == null:
		refresh_clock = 0.0
		refresh_map()
	queue_redraw()

func refresh_map() -> void:
	var seed = host.game.get("seed",0)
	if base_image == null or base_seed != seed:
		base_seed = seed
		base_image = Image.create(Grid.COLS*2,Grid.ROWS*2,false,Image.FORMAT_RGBA8)
		for r in Grid.ROWS:
			for c in Grid.COLS:
				var index: int = r*Grid.COLS+c
				var cell: Dictionary=host.grid[index]
				var color:=Color("2a697b") if not cell.land else Color("7ba5ad" if cell.get("bridge",false) else "6ea4be" if cell.get("ford",false) else "5490ad") if cell.get("river",false) else Color("65804f") if cell.get("biome","")=="forest" else Color("b0ac91") if cell.get("biome","")=="hills" else Color("a6b577")
				base_image.fill_rect(Rect2i(c*2,r*2,2,2),color)
				if not cell.land and cell.get("deposits",{}).get("fish",false) and Geography.noise(c*17,r*19,int(seed))>0.80:
					base_image.set_pixel(c*2+1,r*2+1,Color("8dd3ce") if int(cell.get("fishDepth",0))<=2 else Color("c0c6e4"))
		fog_stamp = ""
	var stamp: String = str(seed)+":"+str(host.game.get("visionRevision",0))+":"+str(host.reveal_all)+":"+host.territory_stamp
	if stamp == fog_stamp and map_texture != null: return
	fog_stamp = stamp
	var image: Image = Image.create_from_data(Grid.COLS*2,Grid.ROWS*2,false,Image.FORMAT_RGBA8,base_image.get_data())
	if not host.reveal_all:
		var explored: Dictionary = host.game.explored[0]
		for r in Grid.ROWS:
			for c in Grid.COLS:
				if not explored.has(str(c)+":"+str(r)):
					image.fill_rect(Rect2i(c*2,r*2,2,2),Color("c9b68f"))
					if Geography.noise(c*9+4,r*7+8,int(seed))>=0.985:
						var ink:=Color("c9b68f").lerp(Color("614d2a"),0.25)
						var cell: Dictionary=host.grid[r*Grid.COLS+c]
						if not cell.land:
							image.set_pixel(c*2,r*2+1,ink);image.set_pixel(c*2+1,r*2+1,ink)
						elif cell.mountain:
							image.set_pixel(c*2,r*2+1,ink);image.set_pixel(c*2+1,r*2,ink)
						else:image.set_pixel(c*2+1,r*2+1,ink)
	var owned: Dictionary=host.territory_allocation.get("territory",{})
	var urban: Dictionary=host.territory_allocation.get("urban",{})
	for key in owned:
		if not host.reveal_all and not host.game.explored[0].has(key):continue
		var city: Dictionary=owned[key];var team:=clampi(int(city.team),0,3)
		var county: bool=not urban.get(str(int(city.id)),{}).has(key)
		var colors: Array=["a1b691","b89c83","b0a1be","c4b78a"] if county else ["83b4a1","af7d62","9b82bb","c3aa62"]
		var parts:=str(key).split(":")
		image.fill_rect(Rect2i(int(parts[0])*2,int(parts[1])*2,2,2),Color(colors[team]))
	map_texture = ImageTexture.create_from_image(image)

func draw_circle_clipped_line(a: Vector2,b: Vector2,color: Color) -> void:
	var p:=a/size-Vector2(0.5,0.5)
	var direction: Vector2=(b-a)/size
	var aa:=direction.length_squared()
	if aa<0.0000001:return
	var bb:=2.0*p.dot(direction)
	var cc:=p.length_squared()-0.25
	var discriminant:=bb*bb-4.0*aa*cc
	if discriminant<0:return
	var root:=sqrt(discriminant)
	var start:=maxf(0.0,(-bb-root)/(2.0*aa))
	var finish:=minf(1.0,(-bb+root)/(2.0*aa))
	if start<=finish:draw_line(a.lerp(b,start),a.lerp(b,finish),color,1.0)
func _draw() -> void:
	if map_texture == null or host == null: return
	if circular:
		var points:=PackedVector2Array();var uvs:=PackedVector2Array();var colors:=PackedColorArray()
		for i in 64:
			var angle:=TAU*float(i)/64.0
			var uv:=Vector2(0.5+0.5*cos(angle),0.5+0.5*sin(angle))
			points.append(uv*size);uvs.append(uv);colors.append(Color.WHITE)
		draw_polygon(points,colors,uvs,map_texture)
	else:
		draw_rect(Rect2(Vector2.ZERO,size),Color("151d1d"),true)
		draw_texture_rect(map_texture,Rect2(Vector2.ZERO,size),false)
	for edge in host.game.get("worldRoads",{}):
		var parts:=str(edge).split(":")
		if parts.size()!=2:continue
		var a:=int(parts[0]);var b:=int(parts[1])
		var from:={"c":a%Grid.COLS,"r":floori(float(a)/Grid.COLS)};var to:={"c":b%Grid.COLS,"r":floori(float(b)/Grid.COLS)}
		if not host.reveal_all and (not host.game.explored[0].has(str(from.c)+":"+str(from.r)) or not host.game.explored[0].has(str(to.c)+":"+str(to.r))):continue
		var level:=Roads.road_level(Roads.road_strength(host.game,from,to,float(host.game.get("time",0))))
		if level<=0:continue
		var p:=Vector2((float(from.c)+0.5)/Grid.COLS*size.x,(float(from.r)+0.5)/Grid.ROWS*size.y)
		var q:=Vector2((float(to.c)+0.5)/Grid.COLS*size.x,(float(to.r)+0.5)/Grid.ROWS*size.y)
		var color:=Color(["a57941","bc995f","dac18c","eadbc1"][level-1])
		if circular:draw_circle_clipped_line(p,q,color)
		else:draw_line(p,q,color,1.0)
	for edge in host.game.get("railEdges",{}):
		var parts:=str(edge).split(":")
		if parts.size()!=2:continue
		var a:=int(parts[0]);var b:=int(parts[1]);var ac:=a%Grid.COLS;var ar:=floori(float(a)/Grid.COLS);var bc:=b%Grid.COLS;var br:=floori(float(b)/Grid.COLS)
		if not host.reveal_all and (not host.game.explored[0].has(str(ac)+":"+str(ar)) or not host.game.explored[0].has(str(bc)+":"+str(br))):continue
		var p:=Vector2((float(ac)+0.5)/Grid.COLS*size.x,(float(ar)+0.5)/Grid.ROWS*size.y);var q:=Vector2((float(bc)+0.5)/Grid.COLS*size.x,(float(br)+0.5)/Grid.ROWS*size.y)
		if circular:draw_circle_clipped_line(p,q,Color("36424a"))
		else:draw_line(p,q,Color("36424a"),1.0)
	for landmark in host.game.get("landmarks",[]):
		var key:=str(int(landmark.c))+":"+str(int(landmark.r))
		if not host.reveal_all and not host.game.explored[0].has(key):continue
		var p:=Vector2((float(landmark.c)+0.5)/Grid.COLS*size.x,(float(landmark.r)+0.5)/Grid.ROWS*size.y)
		var color:=Color("9e997f") if landmark.get("claimedBy")!=null else Color("ebc16a") if landmark.kind=="village" else Color("c0a4df")
		if not circular or (p/size-Vector2(0.5,0.5)).length()<=0.49:draw_circle(p,2.2,color)
	for city in host.game.get("cities",[]):
		var key: String = str(int(city.c))+":"+str(int(city.r))
		if int(city.team)!=0 and not host.reveal_all and not host.game.explored[0].has(key): continue
		var p := Vector2((float(city.c)+0.5)/Grid.COLS*size.x,(float(city.r)+0.5)/Grid.ROWS*size.y)
		if not circular or (p/size-Vector2(0.5,0.5)).length()<=0.49:draw_circle(p,3.0,Color(["e9dfad","ed9c7e","c2a4ea","f0d16f"][clampi(int(city.team),0,3)]))
	for person in host.game.get("settlers",[]):
		if int(person.team)!=0 or person.get("embarked")!=null: continue
		var p := Vector2((float(person.c)+0.5)/Grid.COLS*size.x,(float(person.r)+0.5)/Grid.ROWS*size.y)
		if not circular or (p/size-Vector2(0.5,0.5)).length()<=0.49:draw_circle(p,2.0,Color("ffe875"))
	if host.selected.x>=0 and host.selected.y>=0:
		var chosen:=Vector2((float(host.selected.x)+0.5)/Grid.COLS*size.x,(float(host.selected.y)+0.5)/Grid.ROWS*size.y)
		if not circular or (chosen/size-Vector2(0.5,0.5)).length()<=0.48:draw_rect(Rect2(chosen-Vector2(2,2),Vector2(4,4)),Color("f4d488"),false,1.0)
	if not host.detail_mode:
		var viewport_size: Vector2 = get_viewport_rect().size
		var center:=Vector2((host.camera_target.x/(Grid.COLS*host.CELL_SIZE)+0.5)*size.x,(host.camera_target.z/(Grid.ROWS*host.CELL_SIZE)+0.5)*size.y)
		# The web minimap intentionally shows a small rectangular overview,
		# rather than the trapezoid of the perspective camera frustum.
		var source_factor:=0.55/(2.0*tan(deg_to_rad(host.camera.fov/2.0))*Vector3(0.1,0.76,0.7).length())
		var view_area:=Vector2(host.zoom*viewport_size.x/maxf(1.0,viewport_size.y)/(Grid.COLS*host.CELL_SIZE)*size.x,host.zoom/(Grid.ROWS*host.CELL_SIZE)*size.y)*source_factor
		var view_rect:=Rect2(center-view_area/2,view_area).intersection(Rect2(Vector2.ZERO,size))
		if view_rect.has_area():
			if circular:
				var a:=view_rect.position;var b:=a+Vector2(view_rect.size.x,0);var c:=view_rect.end;var d:=a+Vector2(0,view_rect.size.y)
				for edge in [[a,b],[b,c],[c,d],[d,a]]:draw_circle_clipped_line(edge[0],edge[1],Color("d9eee1"))
			else:draw_rect(view_rect,Color("d9eee1"),false,1.0)
	if not circular:draw_rect(Rect2(Vector2.ZERO,size),Color("ddd4a2"),false,2.0)

func _gui_input(event: InputEvent) -> void:
	if not event is InputEventMouseButton or event.button_index != MOUSE_BUTTON_LEFT or not event.pressed: return
	if circular and (event.position/size-Vector2(0.5,0.5)).length()>0.5:return
	if host.battle_view!=null and host.game.battle.get("result")==null:
		host.update_status("Lõpeta lahing või tagane enne maailmakaardile liikumist.");accept_event();return
	var c := clampi(floori(event.position.x/maxf(size.x,1.0)*Grid.COLS),0,Grid.COLS-1)
	var r := clampi(floori(event.position.y/maxf(size.y,1.0)*Grid.ROWS),0,Grid.ROWS-1)
	if host.detail_mode: host.toggle_detail()
	host.selected=Vector2i(c,r)
	host.camera_target = host.cell_position(host.selected)+Vector3(host.CELL_SIZE/2,0,host.CELL_SIZE/2)
	host.world_camera_target=host.camera_target
	host.update_camera()
	host.show_tile_info(host.selected)
	accept_event()
