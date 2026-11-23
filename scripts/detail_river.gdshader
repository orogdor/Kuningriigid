shader_type spatial;
render_mode cull_disabled, blend_mix, depth_draw_never, unshaded;
varying vec2 water_position;
void vertex(){ water_position=VERTEX.xz; }
void fragment(){
 float flow=sin(water_position.x*0.19+water_position.y*0.11+TIME*0.8);
 flow+=0.45*sin(water_position.x*0.34-water_position.y*0.23-TIME*1.1);
 float edge=clamp(COLOR.r,0.0,1.0);
 vec3 deep=vec3(0.22,0.41,0.42),shallow=vec3(0.40,0.49,0.40);
 ALBEDO=mix(deep,shallow,pow(edge,2.2)*0.85)*(0.97+flow*0.035);
 ROUGHNESS=0.62;
 SPECULAR=0.25;
 ALPHA=COLOR.a*(0.94-0.36*pow(edge,2.5));
}
