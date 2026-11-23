shader_type spatial;
render_mode cull_disabled, depth_draw_never;

uniform sampler2D ground_heights : filter_linear, repeat_disable;
uniform float grid_size=9.0;
varying vec2 ground_position;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
void vertex(){ground_position=(MODEL_MATRIX*vec4(VERTEX,1.0)).xz/vec2(4.5,3.9);}
void fragment(){
 vec2 height_uv=UV*((grid_size-1.0)/grid_size)+vec2(0.5/grid_size);
 float depth=-texture(ground_heights,height_uv).r;
 if(depth<=0.0)discard;
 float shore=1.0-smoothstep(0.0,1.08,depth);
 vec2 flow=normalize(vec2(0.65,0.12));float t=TIME*0.72;
 float a=fract(t*0.22),b=fract(t*0.22+0.5),blend=abs(a*2.0-1.0);
 vec2 p1=(ground_position-flow*a*3.2)*0.45,p2=(ground_position-flow*b*3.2)*0.45+5.3;
 vec2 q1=(ground_position-flow*a*5.12)*1.15+7.1,q2=(ground_position-flow*b*5.12)*1.15+2.9;
 float r1=mix(n(p1),n(p2),blend),r2=mix(n(q1),n(q2),blend),ripple=r1*0.6+r2*0.4;
 vec3 water=mix(vec3(0.1216,0.2941,0.3333),vec3(0.3686,0.5176,0.4),pow(shore,2.2)*0.85);
 water=mix(water,vec3(0.25,0.33,0.35),0.32);
 water*=0.98+(ripple-0.5)*0.10;
 water+=vec3(0.045,0.055,0.06)*smoothstep(0.8,0.96,r2)*(1.0-shore*0.7);
 water=mix(water,vec3(0.70,0.74,0.70),smoothstep(0.9,1.0,shore)*smoothstep(0.6,0.88,r1)*0.22);
 float e=0.35;
 float rx=mix(n(p1+vec2(e,0.0)),n(p2+vec2(e,0.0)),blend)*0.6+mix(n(q1+vec2(e*2.5,0.0)),n(q2+vec2(e*2.5,0.0)),blend)*0.4;
 float rz=mix(n(p1+vec2(0.0,e)),n(p2+vec2(0.0,e)),blend)*0.6+mix(n(q1+vec2(0.0,e*2.5)),n(q2+vec2(0.0,e*2.5)),blend)*0.4;
 NORMAL=normalize(mat3(VIEW_MATRIX)*vec3(-(rx-ripple)/e*0.32,1.0,-(rz-ripple)/e*0.32));
 ALBEDO=water;ROUGHNESS=0.14;METALLIC=0.02;ALPHA=(0.94-0.36*pow(shore,2.5))*smoothstep(0.0,0.08,depth);
}
