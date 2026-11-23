shader_type spatial;
render_mode cull_disabled, depth_draw_never;

varying vec2 river_world;

void vertex() {
	river_world = VERTEX.xz;
}

void fragment() {
	float edge = abs(UV.x * 2.0 - 1.0);
	float wave = sin(river_world.x * 17.0 + river_world.y * 11.0 + TIME * 0.8);
	wave += 0.45 * sin(river_world.x * 31.0 - river_world.y * 23.0 - TIME * 1.1);
	vec3 water = mix(vec3(0.1216,0.2941,0.3333),vec3(0.3686,0.5176,0.4),pow(edge,2.2)*0.85);
	ALBEDO = water * (0.97 + wave * 0.018);
	ALPHA = COLOR.a*(0.94-0.36*pow(edge,2.5));
	ROUGHNESS = 0.14;
	METALLIC = 0.02;
}
