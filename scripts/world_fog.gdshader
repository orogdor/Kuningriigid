shader_type spatial;
render_mode unshaded, blend_mix, depth_draw_never, depth_test_disabled, cull_disabled;
uniform sampler2D seen_linear : filter_linear, repeat_disable;
uniform sampler2D seen_exact : filter_nearest, repeat_disable;
uniform sampler2D symbols : filter_nearest, repeat_disable;
varying vec2 map_pos;
float fog_hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float fog_noise(vec2 p) {
 vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(fog_hash(i),fog_hash(i+vec2(1.0,0.0)),f.x),mix(fog_hash(i+vec2(0.0,1.0)),fog_hash(i+vec2(1.0,1.0)),f.x),f.y);
}
float segment(vec2 p,vec2 a,vec2 b) {
 vec2 ab=b-a;float t=clamp(dot(p-a,ab)/dot(ab,ab),0.0,1.0);
 return 1.0-smoothstep(.018,.032,length(p-(a+t*ab)));
}
float symbol_ink(vec2 p,float kind) {
 float m=0.0;
 if(kind<.375) {
  m=max(segment(p,vec2(.12,.62),vec2(.32,.45)),segment(p,vec2(.32,.45),vec2(.52,.63)));
  m=max(m,segment(p,vec2(.52,.63),vec2(.68,.72)));m=max(m,segment(p,vec2(.68,.72),vec2(.88,.52)));
  m=max(m,segment(p,vec2(.17,.78),vec2(.84,.78)));m=max(m,segment(p,vec2(.17,.86),vec2(.84,.86)));
 } else if(kind<.625) {
  m=max(segment(p,vec2(.14,.75),vec2(.36,.38)),segment(p,vec2(.36,.38),vec2(.56,.75)));
  m=max(m,segment(p,vec2(.44,.75),vec2(.67,.30)));m=max(m,segment(p,vec2(.67,.30),vec2(.87,.75)));
 } else if(kind<.875) {
  for(int i=0;i<3;i++) {float x=.26+float(i)*.24;
   m=max(m,segment(p,vec2(x,.77),vec2(x,.63)));
   m=max(m,segment(p,vec2(x-.12,.64),vec2(x,.39)));
   m=max(m,segment(p,vec2(x,.39),vec2(x+.12,.64)));
   m=max(m,segment(p,vec2(x-.12,.64),vec2(x+.12,.64)));
  }
 } else {
  float radius=length(p-vec2(.5));m=1.0-smoothstep(.018,.032,abs(radius-.20));
  for(int i=0;i<8;i++){float a=float(i)*.785398;vec2 d=vec2(cos(a),sin(a));m=max(m,segment(p,vec2(.5)+d*.24,vec2(.5)+d*.36));}
 }
 return m;
}
void vertex() { map_pos=(MODEL_MATRIX*vec4(VERTEX,1.0)).xz; }
void fragment() {
 vec2 w=vec2(-650.0,-550.0)+(map_pos+vec2(220.0,165.0))*25.0;
 vec2 fw=w+vec2(fog_noise(w*.021)-.5,fog_noise(w*.021+17.0)-.5)*38.0+vec2(fog_noise(w*.08+3.0)-.5,fog_noise(w*.08+9.0)-.5)*10.0;
 vec2 cells=vec2(220.0,165.0),origin=vec2(-650.0,-550.0),extent=cells*50.0;
 vec2 base=(w-origin)/extent,su=(fw-origin)/extent;
 float exact=1.0-texture(seen_exact,(floor(base*cells)+.5)/cells).a;
 float seen=max(1.0-texture(seen_linear,su).a,exact);
 vec2 paper=fract(w/50.8)*128.0;
 float line=1.0-smoothstep(.7,1.8,abs(mod(paper.x-paper.y*30.0/128.0+20.0,18.0)-9.0));
 vec3 paper_color=vec3(.843,.757,.584)*(1.0-line*.10);
 float kind=texture(symbols,(floor(base*cells)+.5)/cells).r;
 if(kind>.1) paper_color=mix(paper_color,vec3(.30,.22,.11),symbol_ink(fract(base*cells),kind)*.58);
 ALBEDO=paper_color*(.94+.06*smoothstep(0.0,.30,seen));
 ALPHA=1.0-smoothstep(.30,.62,seen);
}
