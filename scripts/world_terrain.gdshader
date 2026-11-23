shader_type spatial;
render_mode cull_disabled;
varying vec3 terrain_pos;
varying vec3 terrain_normal;
varying float source_height;
uniform vec4 beach_color : source_color = vec4(0.8745,0.8078,0.6275,1.0);
float h149(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n149(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h149(i),h149(i+vec2(1.0,0.0)),f.x),mix(h149(i+vec2(0.0,1.0)),h149(i+vec2(1.0,1.0)),f.x),f.y);}
float f149(vec2 p){return n149(p)*0.55+n149(p*2.07+17.3)*0.30+n149(p*4.31+41.9)*0.15;}
void vertex(){
 terrain_pos=vec3(VERTEX.x*25.0+4850.0,VERTEX.y/0.04+0.7,VERTEX.z*25.0+3575.0);
 terrain_normal=normalize(NORMAL);
 source_height=UV.x;
}
void fragment(){
 vec2 lp=terrain_pos.xz;float elev=terrain_pos.y;
 float slope=1.0-clamp(abs(normalize(terrain_normal).y),0.0,1.0);
 float broad=f149(lp*0.018),mid=n149(lp*0.13),fine=n149(lp*0.55);
 vec3 land=COLOR.rgb*(0.87+broad*0.09+mid*0.04+fine*0.016);
 float earth=smoothstep(0.62,0.84,n149(lp*0.065+vec2(5.2,2.8))*0.64+n149(lp*0.19+8.7)*0.36);
 land=mix(land,land*vec3(0.79,0.72,0.59),earth*0.26);
 float alpine=smoothstep(70.0,105.0,elev+broad*18.0);
 land=mix(land,land*vec3(0.86,0.90,0.72)+vec3(0.02,0.025,0.0),alpine*0.6);
 float grassy=smoothstep(0.0,0.05,land.g-land.r)*(1.0-alpine*0.5);
 float meadow=n149(lp*0.094+3.0)*0.6+n149(lp*0.23+7.0)*0.4;
 vec3 lush=land*vec3(0.84,1.0,0.82),dry=land*vec3(1.13,1.05,0.76)+vec3(0.035,0.02,0.0);
 land=mix(land,mix(lush,dry,smoothstep(0.38,0.74,meadow)),grassy*0.7);
 float heath=smoothstep(0.62,0.80,n149(lp*0.034+8.0));land=mix(land,land*vec3(0.94,0.90,0.97),heath*grassy*0.25);
 float rock_at=mix(0.42,0.20,smoothstep(30.0,95.0,elev));
 float rock=smoothstep(rock_at-0.07,rock_at+0.09,slope+(mid-0.5)*0.16)*smoothstep(16.0,34.0,elev);
 rock=max(rock,smoothstep(0.70,0.86,slope));
 float fissure=1.0-abs(2.0*n149(vec2(lp.x*0.21+elev*0.09,lp.y*0.21-elev*0.05))-1.0);
 vec3 rock_col=mix(vec3(0.15,0.15,0.145),vec3(0.31,0.29,0.265),clamp(broad*0.7+fine*0.5-0.1,0.0,1.0));
 rock_col=mix(rock_col,vec3(0.20,0.23,0.17),smoothstep(0.55,0.80,n149(lp*0.07+9.0))*(1.0-smoothstep(0.45,0.75,slope))*0.55);
 rock_col*=0.80+0.20*smoothstep(0.15,0.55,fissure);rock_col=mix(rock_col,rock_col*vec3(0.98,0.92,0.84),smoothstep(0.55,0.85,mid)*0.6);
 float scree=smoothstep(rock_at-0.20,rock_at-0.06,slope)*(1.0-rock)*smoothstep(26.0,44.0,elev);
 vec3 col=mix(land,vec3(0.34,0.32,0.29)*(0.88+fine*0.2),scree*0.75);col=mix(col,rock_col,rock);
 // The original coast blends over a finer terrain mesh; keep that soft
 // transition while the Godot mesh uses a coarser adaptive shoreline.
 float beach=(1.0-smoothstep(0.7,5.4,source_height))*0.40;
 col=mix(col,beach_color.rgb,beach);
 float snow_line=118.0+broad*22.0;float snow=smoothstep(snow_line,snow_line+12.0,elev)*(1.0-smoothstep(0.40,0.68,slope+fine*0.1));
 col=mix(col,vec3(0.84,0.86,0.90)*(0.95+fine*0.06),snow);
 vec2 cw=lp*0.0035+vec2(TIME*0.010,TIME*0.004);float cloud=smoothstep(0.52,0.78,n149(cw)*0.65+n149(cw*2.3+4.0)*0.35);
 ALBEDO=col*(1.0-cloud*0.16)+vec3(0.035,0.012,0.035)+rock*vec3(0.06);ROUGHNESS=1.0;METALLIC=0.0;
}
