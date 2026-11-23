shader_type spatial;
render_mode cull_disabled, depth_draw_never;

void fragment() {
	ALBEDO = COLOR.rgb;
	ALPHA = COLOR.a;
	ROUGHNESS = 0.95;
}
