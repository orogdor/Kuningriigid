shader_type spatial;
render_mode unshaded, blend_add, cull_disabled, depth_draw_never;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
void fragment(){
 float x=UV.x-0.5;float y=1.0-UV.y;float t=TIME*2.6;
 float n=vn(vec2(x*3.0,y*2.2-t))*0.65+vn(vec2(x*7.0,y*5.0-t*1.7))*0.35;
 float w=pow(max(1.0-y,0.001),0.7)*0.44*(1.0+(n-0.5)*0.5);
 float d=abs(x+(n-0.5)*0.22*y)/w;
 float k=(1.0-smoothstep(0.55,1.0,d))*smoothstep(0.0,0.07,y)*(1.0-smoothstep(0.55,1.0,y+(n-0.5)*0.35));
 float core=(1.0-smoothstep(0.0,0.38,d))*(1.0-smoothstep(0.08,0.42,y));
 ALBEDO=mix(mix(vec3(0.85,0.18,0.03),vec3(1.0,0.55,0.10),smoothstep(0.1,0.6,k)),vec3(1.0,0.93,0.70),core)*k*1.35;
 ALPHA=k;
}
