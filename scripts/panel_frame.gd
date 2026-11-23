extends Control

# CSS border-image on the web uses 6% source slices drawn 16 pixels wide.
var texture: Texture2D
var border_width:=16.0

func _ready() -> void:
	mouse_filter=Control.MOUSE_FILTER_IGNORE
	resized.connect(queue_redraw)

func _draw() -> void:
	draw_frame(self,texture,size,border_width)

static func draw_frame(canvas: CanvasItem,image: Texture2D,dimensions: Vector2,border: float) -> void:
	if image==null or dimensions.x<=0 or dimensions.y<=0:return
	var source:=image.get_size()
	var sx:=source.x*0.06;var sy:=source.y*0.06
	var dx:=minf(border,dimensions.x*0.5);var dy:=minf(border,dimensions.y*0.5)
	var source_x:=[0.0,sx,source.x-sx,source.x];var source_y:=[0.0,sy,source.y-sy,source.y]
	var dest_x:=[0.0,dx,dimensions.x-dx,dimensions.x];var dest_y:=[0.0,dy,dimensions.y-dy,dimensions.y]
	for y in 3:
		for x in 3:
			var source_rect:=Rect2(source_x[x],source_y[y],source_x[x+1]-source_x[x],source_y[y+1]-source_y[y])
			var dest_rect:=Rect2(dest_x[x],dest_y[y],dest_x[x+1]-dest_x[x],dest_y[y+1]-dest_y[y])
			canvas.draw_texture_rect_region(image,dest_rect,source_rect)
