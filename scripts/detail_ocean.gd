extends RefCounted

const SHADER=preload("res://scripts/detail_ocean.gdshader")
const Terrain=preload("res://scripts/detail_terrain.gd")

static func make_material(heights: Array,visual_heights:=PackedVector4Array()) -> ShaderMaterial:
	var n:=33 if visual_heights.size()==17*17 else 9
	var image:=Image.create(n,n,false,Image.FORMAT_RF)
	for z in n:
		for x in n:
			var y: float=Terrain.visual_sample(visual_heights,(float(x)/(n-1)-0.5)*225.0,(float(z)/(n-1)-0.5)*195.0).w if n==33 else float(heights[z*9+x]) if heights.size()==81 else 0.0
			image.set_pixel(x,z,Color(y,0,0,1))
	var material:=ShaderMaterial.new();material.shader=SHADER
	material.set_shader_parameter("ground_heights",ImageTexture.create_from_image(image))
	material.set_shader_parameter("grid_size",float(n))
	return material
