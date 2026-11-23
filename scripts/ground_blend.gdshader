shader_type spatial;
render_mode cull_disabled, diffuse_burley, specular_schlick_ggx;

uniform sampler2D grass_color : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D soil_color : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D forest_color : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D grass_normal : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D soil_normal : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D forest_normal : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D grass_rough : filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D soil_rough : filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D forest_rough : filter_linear_mipmap_anisotropic, repeat_enable;
uniform float forest_factor = 0.0;
uniform vec4 base_color : source_color = vec4(0.4,0.5,0.3,1.0);
uniform vec4 sand_color : source_color = vec4(0.698,0.631,0.486,1.0);
uniform vec4 wet_sand_color : source_color = vec4(0.561,0.510,0.4,1.0);
instance uniform vec2 detail_uv_offset = vec2(0.0);
instance uniform bool blend_neighbours = false;
instance uniform vec4 ground_w : source_color = vec4(0.0);
instance uniform vec4 ground_e : source_color = vec4(0.0);
instance uniform vec4 ground_n : source_color = vec4(0.0);
instance uniform vec4 ground_s : source_color = vec4(0.0);
instance uniform vec4 ground_nw : source_color = vec4(0.0);
instance uniform vec4 ground_ne : source_color = vec4(0.0);
instance uniform vec4 ground_sw : source_color = vec4(0.0);
instance uniform vec4 ground_se : source_color = vec4(0.0);
varying float ground_height;
varying float beach_wobble;
varying vec2 shifted_uv;
varying vec2 tile_uv;

void vertex(){ground_height=UV2.x;beach_wobble=UV2.y;tile_uv=UV;shifted_uv=UV+detail_uv_offset;}

float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1.0,0.0)),f.x),mix(h(i+vec2(0.0,1.0)),h(i+vec2(1.0,1.0)),f.x),f.y);}
float fractal(vec2 p){return n(p)*0.55+n(p*2.07+17.3)*0.30+n(p*4.31+41.9)*0.15;}
vec4 sample_ground(sampler2D image,vec2 uv){float b=smoothstep(0.2,0.8,n(uv*0.11+vec2(71.0,13.0)));return mix(texture(image,uv,1.5),texture(image,uv*0.73+vec2(0.37,0.61),1.5),b);}
void fragment(){
 vec2 q=shifted_uv;
 vec4 local_ground=vec4(base_color.rgb,forest_factor);
 if(blend_neighbours){
  float x=clamp(abs(tile_uv.x)/225.0,0.0,0.5),z=clamp(abs(tile_uv.y)/195.0,0.0,0.5);
  vec4 horizontal=tile_uv.x<0.0?ground_w:ground_e;
  vec4 vertical=tile_uv.y<0.0?ground_n:ground_s;
  vec4 diagonal=tile_uv.x<0.0?(tile_uv.y<0.0?ground_nw:ground_sw):(tile_uv.y<0.0?ground_ne:ground_se);
  local_ground=mix(mix(local_ground,horizontal,x),mix(vertical,diagonal,x),z);
 }
 float dirt=smoothstep(0.57,0.82,fractal(q*0.09+vec2(13.0,29.0)));
 float forest=local_ground.a*(0.68+0.25*n(q*0.13));
 vec3 w=vec3((1.0-dirt)*(1.0-forest),dirt*(1.0-forest),forest);
 vec2 uv=q*0.5;
 vec3 g=sample_ground(grass_color,uv).rgb,s=sample_ground(soil_color,uv).rgb,f=sample_ground(forest_color,uv).rgb;
 vec3 lum=vec3(dot(g,vec3(0.30,0.59,0.11))*1.7,dot(s,vec3(0.30,0.59,0.11))*1.25,dot(f,vec3(0.30,0.59,0.11))*1.35)*0.55+w;
 float top=max(lum.x,max(lum.y,lum.z))-0.22;
 vec3 weights=max(lum-vec3(top),vec3(0.0))*step(vec3(0.001),w);
 weights/=max(weights.x+weights.y+weights.z,0.0001);
 vec3 photo=(g*weights.x+s*weights.y+f*weights.z)*(0.90+0.13*fractal(q*0.018));
 float photo_strength=0.88*(1.0-smoothstep(100.0,300.0,length(VERTEX)))*smoothstep(0.4,1.6,ground_height);
 // The source keeps procedural meadow and soil variation after the close-up
 // photographs have faded; a uniform fallback makes the whole tile flat green.
 float meadow=fractal(q*0.034+vec2(8.0,8.0));
 float lowland=1.0-smoothstep(7.0,9.0,ground_height);
 vec3 muted=mix(local_ground.rgb,vec3(0.0648,0.0908,0.0423),0.24)*0.87;
 vec3 ground=mix(local_ground.rgb,muted,lowland);
 vec3 lush=ground*vec3(0.84,1.0,0.82);
 vec3 dry=ground*vec3(1.13,1.05,0.76)+vec3(0.035,0.02,0.0);
 vec3 distant=mix(lush,dry,smoothstep(0.38,0.74,meadow));
 float cl=n(q*0.55),cl2=n(q*1.7+vec2(4.0));
 distant*=1.0+(cl-0.5)*0.12+(cl2-0.5)*0.05;
 float organic=fractal(q*0.72+vec2(17.0,3.0));
 distant=mix(distant,distant*vec3(0.73,0.68,0.54),smoothstep(0.54,0.83,organic)*0.20);
 float soil_patch=smoothstep(0.64,0.82,fractal(q*0.048+vec2(11.0))+(n(q*0.6)-0.5)*0.12);
 vec3 soil_tint=mix(distant,vec3(0.40,0.32,0.22),0.75)*(0.85+n(q*2.3)*0.28);
 distant=mix(distant,soil_tint,soil_patch*(0.45+0.20*local_ground.a));
 vec3 surface=mix(distant,photo,photo_strength);
 float sand=1.0-smoothstep(0.4+beach_wobble,1.15+beach_wobble,ground_height);
 surface=mix(surface,sand_color.rgb*0.65,sand);
 surface=mix(surface,wet_sand_color.rgb*0.55,(1.0-smoothstep(-0.05,0.35,ground_height))*0.55);
 ALBEDO=surface;
 vec3 normal_map=sample_ground(grass_normal,uv).xyz*weights.x+sample_ground(soil_normal,uv).xyz*weights.y+sample_ground(forest_normal,uv).xyz*weights.z;
 NORMAL_MAP=normal_map;
 NORMAL_MAP_DEPTH=0.32*photo_strength;
 ROUGHNESS=clamp(sample_ground(grass_rough,uv).r*weights.x+sample_ground(soil_rough,uv).r*weights.y+sample_ground(forest_rough,uv).r*weights.z,0.65,1.0);
}
