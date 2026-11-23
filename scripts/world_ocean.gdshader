shader_type spatial;
render_mode cull_disabled;
varying float land_height;
varying vec2 map_position;
float hash2(vec2 p) { vec2 q=fract(p*vec2(123.34,456.21));q+=dot(q,q+45.32);return fract(q.x*q.y); }
float noise2(vec2 p) {
 vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x),mix(hash2(i+vec2(0,1)),hash2(i+vec2(1,1)),f.x),f.y);
}
void vertex() {
 land_height=COLOR.r*160.0-80.0;
 map_position=(MODEL_MATRIX*vec4(VERTEX,1.0)).xz*25.0;
}
void fragment() {
 float depth=.72-land_height;
 if(depth<=0.0)discard;
 float shore=1.0-smoothstep(0.0,3.6,depth);
 vec2 flow=vec2(.65,.12);float t=TIME*(length(flow)*.55+.35);
 float phase1=fract(t*.22),phase2=fract(t*.22+.5),blend=abs(phase1*2.0-1.0);
 vec2 o1=normalize(flow)*phase1*3.2,o2=normalize(flow)*phase2*3.2;
 vec2 a1=(map_position-o1)*.45,a2=(map_position-o2)*.45+5.3;
 vec2 b1=(map_position-o1*1.6)*1.15+7.1,b2=(map_position-o2*1.6)*1.15+2.9;
 float r1=mix(noise2(a1),noise2(a2),blend),r2=mix(noise2(b1),noise2(b2),blend),ripple=r1*.6+r2*.4;
 vec3 deep=vec3(.1216,.2941,.3333),shallow=vec3(.3686,.5176,.4);
 vec3 water=mix(deep,shallow,pow(shore,2.2)*.85)*(.97+.03*sin(map_position.x*.11+map_position.y*.07));
 water*=.98+(ripple-.5)*.10;
 water+=vec3(.045,.055,.06)*smoothstep(.8,.96,r2)*(1.0-shore*.7);
 water=mix(water,vec3(.70,.74,.70),smoothstep(.9,1.0,shore)*smoothstep(.6,.88,r1)*.22);
 float e=.35;
 float rx=mix(noise2(a1+vec2(e,0.0)),noise2(a2+vec2(e,0.0)),blend)*.6+mix(noise2(b1+vec2(e*2.5,0.0)),noise2(b2+vec2(e*2.5,0.0)),blend)*.4;
 float rz=mix(noise2(a1+vec2(0.0,e)),noise2(a2+vec2(0.0,e)),blend)*.6+mix(noise2(b1+vec2(0.0,e*2.5)),noise2(b2+vec2(0.0,e*2.5)),blend)*.4;
 NORMAL=normalize(mat3(VIEW_MATRIX)*vec3(-(rx-ripple)/e*.32,1.0,-(rz-ripple)/e*.32));
 ALBEDO=water;ROUGHNESS=.14;METALLIC=.02;
}
