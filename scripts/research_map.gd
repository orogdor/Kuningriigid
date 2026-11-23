extends Control

const Layout=preload("res://scripts/research_layout.gd")
const Research=preload("res://scripts/research_rules.gd")
var graph: Dictionary={}
var selected: String=""

func _ready() -> void:
	mouse_filter=Control.MOUSE_FILTER_PASS

func _draw() -> void:
	for band in graph.get("bands",[]):
		var title: String=str(int(band.age)+1)+". "+str(Research.DATA.data.era_names[int(band.age)])
		draw_string(get_theme_default_font(),Vector2(20,float(band.start)+25),title,HORIZONTAL_ALIGNMENT_LEFT,-1,17,Color("d9b673"))
	for edge in graph.get("edges",[]):
		var source: Dictionary=graph.positions[edge.from];var target: Dictionary=graph.positions[edge.to]
		var a:=Vector2(float(source.x)+Layout.NODE_W/2,float(source.y)+Layout.NODE_H)
		var b:=Vector2(float(target.x)+Layout.NODE_W/2,float(target.y))
		var bend:=clampf((b.y-a.y)*0.37,18,100)
		var curve:=Curve2D.new();curve.add_point(a,Vector2.ZERO,Vector2(0,bend));curve.add_point(b,Vector2(0,-bend))
		var points:=curve.get_baked_points()
		var color:=Color("ecd19a") if selected.is_empty() or edge.from==selected or edge.to==selected else Color(0.65,0.59,0.46,0.35)
		for i in range(points.size()-1):
			if not edge.optional or i%2==0:draw_line(points[i],points[i+1],color,2.0,true)
		draw_colored_polygon(PackedVector2Array([b,b+Vector2(-4,-7),b+Vector2(4,-7)]),color)

