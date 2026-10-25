// V149 landscape look: natural rock, scree, alpine meadow and snow on the mountains; living
// rivers (flowing ripples, depth colour, foam on shallows, wet banks that fade into the land);
// roads and trails with real surfaces (dirt ruts, gravel, cobbles, flagstones) and soft edges.
// Visual only: river, road and terrain coordinates, navigation and saves are unchanged.
// Everything is procedural in the shaders (no texture downloads); geometry counts stay the same.
import * as T from './vendor/three.module.js';
import {DETAIL_X,DETAIL_Z} from './detail-scale-v123.js';
import {CLOUD_TIME} from './atmosphere-v158.js?v=161a';

export const LANDSCAPE_TIME={value:0};
const tick=()=>{LANDSCAPE_TIME.value=performance.now()/1000;};

// ---------------------------------------------------------------- shared GLSL
const NOISE=`
float l149h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float l149n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(l149h(i),l149h(i+vec2(1,0)),f.x),mix(l149h(i+vec2(0,1)),l149h(i+vec2(1,1)),f.x),f.y);}
float l149f(vec2 p){return l149n(p)*.55+l149n(p*2.07+17.3)*.30+l149n(p*4.31+41.9)*.15;}
`;
// Object position -> world metres (detail maps are scaled 4.5 x 0.30 x 3.9 around the tile).
// V161: the tile offset is a uniform (uL149Tile), not baked into the GLSL, so every detail tile
// shares one compiled program and moving between tiles never recompiles shaders.
function worldMapping(scope,tile){
 if(scope==='world')return {pos:'position',nrm:'objectNormal',head:'',uniforms:{}};
 return {pos:`vec3(position.x/${DETAIL_X.toFixed(3)}+uL149Tile.x,position.y/0.30+0.7,position.z/${DETAIL_Z.toFixed(3)}+uL149Tile.y)`,
  nrm:`vec3(objectNormal.x*${DETAIL_X.toFixed(3)},objectNormal.y*0.30,objectNormal.z*${DETAIL_Z.toFixed(3)})`,
  head:'uniform vec2 uL149Tile;',uniforms:{uL149Tile:{value:new T.Vector2(Number(tile?.x||0),Number(tile?.z||0))}}};
}
function inject(shader,{map=null,vertexHead='',vertexBody='',fragHead='',color=''}){
 if(map)Object.assign(shader.uniforms,map.uniforms);
 shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\n'+(map?.head||'')+vertexHead)
  .replace('#include <begin_vertex>','#include <begin_vertex>\n'+vertexBody);
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+NOISE+fragHead)
  .replace('#include <color_fragment>','#include <color_fragment>\n'+color);
}

// ---------------------------------------------------------------- V157 cultivation mask
// One texel per map cell (0 wild .. 1 farmed); the world terrain shader draws fields where it is high.
import {COLS as CULT_COLS,ROWS as CULT_ROWS,ORIGIN_X as CULT_OX,ORIGIN_Z as CULT_OZ,WORLD_WIDTH as CULT_W,WORLD_DEPTH as CULT_D} from './campaign.js';
export const CULTIVATION=(()=>{const data=new Uint8Array(CULT_COLS*CULT_ROWS),texture=new T.DataTexture(data,CULT_COLS,CULT_ROWS,T.RedFormat);
 texture.magFilter=texture.minFilter=T.LinearFilter;texture.needsUpdate=true;return {data,texture};})();
export function setCultivation(values){CULTIVATION.data.set(values);CULTIVATION.texture.needsUpdate=true;}
// ---------------------------------------------------------------- terrain
// Mountains: slope- and altitude-driven bare rock with dark fissures, pale scree fans below the
// cliffs, wind-burnt alpine grass above the tree line and snow fields on gentle high ground.
// Lowlands keep their biome colours with a natural, non-repeating grain.
export function terrainMaterial(scope='world',tile=null){
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
 const map=worldMapping(scope,tile),detail=scope!=='world';
 material.onBeforeCompile=shader=>{
  shader.uniforms.uT158Cloud=CLOUD_TIME;
  inject(shader,{map,
   vertexHead:'varying vec3 vL149P;varying vec3 vL149N;'+(detail?'varying vec2 vL156L;':''),
   vertexBody:`vL149P=${map.pos};vL149N=normalize(${map.nrm});`+(detail?'vL156L=position.xz;':''),
   fragHead:'uniform float uT158Cloud;varying vec3 vL149P;varying vec3 vL149N;'+(detail?'varying vec2 vL156L;float t156Bump=0.0;':''),
   color:`
 vec2 lp=vL149P.xz;float elev=vL149P.y;
 float slope=1.0-clamp(abs(normalize(vL149N).y),0.0,1.0);
 float nBroad=l149f(lp*.018),nMid=l149n(lp*.13),nFine=l149n(lp*${detail?'2.4':'.55'});
 vec3 land=diffuseColor.rgb*(.90+nBroad*.12+nMid*.07+nFine*.05);
 // above ~70 m the grass thins into yellow-grey alpine turf
 float alpine=smoothstep(70.0,105.0,elev+nBroad*18.0);
 land=mix(land,land*vec3(.86,.90,.72)+vec3(.02,.025,.0),alpine*.6);
 // V161: the same broad meadow patches on both maps, computed in world metres, so the world
 // map shows exactly the dry/lush/heath patches you see on the detail map (no field patchwork).
 float grassy=smoothstep(.0,.05,land.g-land.r)*(1.0-alpine*.5);
 float mm=l149n(lp*.094+3.0)*.6+l149n(lp*.23+7.0)*.4;
 vec3 lush=land*vec3(.84,1.0,.82),dryC=land*vec3(1.13,1.05,.76)+vec3(.035,.02,0.0);
 land=mix(land,mix(lush,dryC,smoothstep(.38,.74,mm)),grassy*.7);
 float heath=smoothstep(.62,.80,l149n(lp*.034+8.0));land=mix(land,land*vec3(.94,.90,.97),heath*grassy*.25);
 ${detail?`// V156 close-up ground, in local detail-map units: meadow hue patches, grass clumps,
 // blade streaks, bare soil, wild-flower specks and pebbles, plus a small bump for relief light.
 // Fine detail fades out where it would alias (fwidth).
 vec2 q=vL156L;
 float aa=1.0-smoothstep(.35,1.1,(fwidth(q.x)+fwidth(q.y))*1.4);
 float cl=l149n(q*.55),cl2=l149n(q*1.7+4.0);
 land*=1.0+((cl-.5)*.30+(cl2-.5)*.22*aa)*grassy;
 float bl=l149n(q*3.1+1.7)*.55+l149n(q*7.3+5.2)*.45;
 land*=1.0+(bl-.5)*.30*grassy*aa;
 float tuft=smoothstep(.55,.75,l149n(q*2.2+9.0));land=mix(land,land*vec3(.80,.95,.70),tuft*grassy*aa*.35);
 float soil=smoothstep(.80,.90,l149n(q*.048+11.0)*.75+l149n(q*.11+2.0)*.25+(l149n(q*.6)-.5)*.22);
 vec3 soilC=mix(land,vec3(.40,.32,.22),.75)*(.85+l149n(q*2.3)*.28);
 land=mix(land,soilC,soil*grassy*.7);
 vec2 fcell=floor(q*1.3),ff=fract(q*1.3)-.5;float fh=l149h(fcell);
 float flower=step(.962,fh)*(1.0-smoothstep(.09,.15,length(ff-(vec2(l149h(fcell+3.1),l149h(fcell+7.7))-.5)*.6)));
 vec3 fc=fh>.988?vec3(.96,.94,.86):fh>.977?vec3(.94,.80,.24):vec3(.68,.52,.86);
 land=mix(land,fc,flower*grassy*aa*(1.0-soil)*smoothstep(.42,.62,l149n(q*.04+5.0)));
 float pebbles=smoothstep(.82,.90,l149n(q*2.6+3.1))*aa*(soil*.8+smoothstep(35.0,65.0,elev)+(1.0-grassy)*.4);
 land=mix(land,vec3(.52,.50,.46)*(.85+cl2*.3),min(1.0,pebbles)*.6);
 t156Bump=(cl*.7+bl*.35*aa+cl2*.25*aa-soil*.5+pebbles*.6)*grassy+pebbles*.4;`:''}
 // rock appears on steep ground, earlier the higher it is
 float rockAt=mix(.42,.20,smoothstep(30.0,95.0,elev));
 float rock=smoothstep(rockAt-.07,rockAt+.09,slope+(nMid-.5)*.16)*smoothstep(16.0,34.0,elev);
 rock=max(rock,smoothstep(.70,.86,slope));
 float fissure=1.0-abs(2.0*l149n(vec2(lp.x*.21+elev*.09,lp.y*.21-elev*.05))-1.0);
 vec3 rockCol=mix(vec3(.15,.15,.145),vec3(.31,.29,.265),clamp(nBroad*.7+nFine*.5-.1,0.0,1.0));
 rockCol=mix(rockCol,vec3(.20,.23,.17),smoothstep(.55,.80,l149n(lp*.07+9.0))*(1.0-smoothstep(.45,.75,slope))*.55);   // lichen and moss on ledges
 rockCol*=.80+.20*smoothstep(.15,.55,fissure);
 rockCol=mix(rockCol,rockCol*vec3(.98,.92,.84),smoothstep(.55,.85,nMid)*.6);   // iron-stained bands
 // scree: loose pale stone just below the cliff line
 float scree=smoothstep(rockAt-.20,rockAt-.06,slope)*(1.0-rock)*smoothstep(26.0,44.0,elev);
 vec3 screeCol=vec3(.34,.32,.29)*(.88+nFine*.2);
 vec3 col=mix(land,screeCol,scree*.75);
 col=mix(col,rockCol,rock);
 // snow on gentle high ground, broken up by wind and rock
 float snowLine=118.0+nBroad*22.0;
 float snow=smoothstep(snowLine,snowLine+12.0,elev)*(1.0-smoothstep(.40,.68,slope+nFine*.1));
 col=mix(col,vec3(.84,.86,.90)*(.95+nFine*.06),snow);
 // V158 drifting cloud shadows (same world-space clouds in both views)
 vec2 cw=lp*.0035+vec2(uT158Cloud*.010,uT158Cloud*.004);
 float cloud=smoothstep(.52,.78,l149n(cw)*.65+l149n(cw*2.3+4.0)*.35);
 col*=1.0-cloud*.16;
 diffuseColor.rgb=col;`});
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n roughnessFactor=1.0;');
  if(detail)shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 { // V156 bump from the ground pattern (screen-space derivative method)
  vec3 sp=-vViewPosition,dpx=dFdx(sp),dpy=dFdy(sp);float dhx=dFdx(t156Bump),dhy=dFdy(t156Bump);
  vec3 r1=cross(dpy,normal),r2=cross(normal,dpx);float det=dot(dpx,r1);
  vec3 grad=sign(det)*(dhx*r1+dhy*r2);normal=normalize(abs(det)*normal-.32*grad);
 }`);
 };
 material.customProgramCacheKey=()=>'terrain-v149-v161-'+scope;
 return material;
}
// Vertex tint for mountain cells (called by the terrain builder): forested lower slopes give way
// to grey-green ground; the shader adds rock, scree and snow per pixel.
export function mountainShade(color,x,z,height,normalY){
 const slope=Math.max(0,Math.min(1,1-Math.abs(normalY)));
 const low=new T.Color('#5d6f4c'),high=new T.Color('#7d8068');
 const t=Math.max(0,Math.min(1,(height-40)/70));
 color.lerp(low.lerp(high,t),.55);
 color.multiplyScalar(1-slope*.18);
 return color;
}
// Atlas mesh vertices are 16.7 m apart: low-pass the mountain relief so ridges read as ridges
// instead of aliased spikes. Lowland and river vertices are untouched.
export function smoothedOverview(sample,x,z,spacing){
 const h=sample(x,z);
 if(h<34)return h;
 const r=spacing*.55;
 const avg=(sample(x+r,z)+sample(x-r,z)+sample(x,z+r)+sample(x,z-r))/4;
 const k=Math.min(1,(h-34)/20)*.55;
 return h+(avg-h)*k;
}

// ---------------------------------------------------------------- water
// attributes: aFlow (downstream direction * relative speed), aShore (0 mid-channel .. 1 at the bank)
export function waterMaterial(scope='world',tile=null){
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.16,metalness:.04,side:T.DoubleSide});
 const map=worldMapping(scope,tile);
 material.onBeforeCompile=shader=>{
  shader.uniforms.uL149Time=LANDSCAPE_TIME;
  inject(shader,{map,
   vertexHead:'attribute vec2 aFlow;attribute float aShore;varying vec3 vL149P;varying vec2 vL149F;varying float vL149S;',
   vertexBody:`vL149P=${map.pos};vL149F=aFlow;vL149S=aShore;`,
   fragHead:'uniform float uL149Time;varying vec3 vL149P;varying vec2 vL149F;varying float vL149S;',
   color:`
 vec2 wp=vL149P.xz;float spd=length(vL149F)+.001;vec2 fd=vL149F/spd;vec2 side=vec2(-fd.y,fd.x);
 vec2 q=vec2(dot(wp,fd),dot(wp,side));
 float t=uL149Time*(.55+spd*.9);
 float r1=l149n(vec2(q.x*.45-t*1.3,q.y*1.6));
 float r2=l149n(vec2(q.x*1.10-t*2.1+7.1,q.y*2.6+3.3));
 float ripple=r1*.6+r2*.4;
 vec3 water=diffuseColor.rgb*(.92+ripple*.12);
 // glints where ripples crest
 water+=vec3(.05,.06,.06)*smoothstep(.84,.97,r2)*(1.0-vL149S*.6);
 // foam lines on the shallows near the banks
 float foam=smoothstep(.86,1.0,vL149S)*smoothstep(.55,.85,l149n(vec2(q.x*.9-t*1.2,q.y*2.2)));
 water=mix(water,vec3(.66,.72,.70),foam*.30);
 diffuseColor.rgb=water;
 vL149Ripple=ripple;`});
  shader.fragmentShader=shader.fragmentShader.replace('uniform float uL149Time;','uniform float uL149Time;float vL149Ripple=0.0;')
   .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 normal=normalize(normal+vec3(vL149Ripple-.5,0.0,.5-vL149Ripple)*.12);`);
 };
 material.customProgramCacheKey=()=>'water-v149-v161-'+scope;
 material.userData.animated=true;
 return material;
}
// Animated materials read one shared clock; the mesh updates it right before drawing.
export function animate(mesh){mesh.onBeforeRender=tick;return mesh;}

// ---------------------------------------------------------------- roads
// attributes: uv.x across (-1 edge .. +1 edge, |u|>1 is the soft verge), uv.y along (metres),
// aLevel 1 dirt track, 2 gravel, 3 cobbles, 4 flagstone highway.
export function roadMaterial(scope='world',tile=null){
 const material=new T.MeshStandardMaterial({roughness:.95,metalness:0,transparent:true,depthWrite:false,side:T.DoubleSide,
  polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
 const map=worldMapping(scope,tile),detail=scope!=='world';
 material.onBeforeCompile=shader=>{
  inject(shader,{map,
   vertexHead:'attribute float aLevel;varying vec3 vL149P;varying vec2 vL149U;varying float vL149L;',
   vertexBody:`vL149P=${map.pos};vL149U=uv;vL149L=aLevel;`,
   fragHead:'varying vec3 vL149P;varying vec2 vL149U;varying float vL149L;',
   color:`
 float u=vL149U.x,v=vL149U.y,au=abs(u);float lvl=floor(vL149L+.5);
 vec2 wp=vL149P.xz;float n=l149n(wp*${detail?'.9':'.35'}),nf=l149n(wp*${detail?'4.0':'1.2'}+5.0);
 vec3 dirt=${detail?'vec3(.39,.32,.23)':'vec3(.45,.38,.28)'}*(.86+n*.22);
 vec3 col=dirt;
 if(lvl<1.5){ // dirt track: two wheel ruts, grassy crown
  float rut=smoothstep(.20,.0,abs(au-.55));col*=1.0-rut*.22;
  col=mix(col,vec3(.30,.36,.21)*(.85+nf*.3),smoothstep(.22,.0,au)*.55);
 }else if(lvl<2.5){ // gravel
  col=mix(vec3(.46,.43,.37),vec3(.36,.34,.29),nf)*(.92+n*.12);
  col*=1.0-smoothstep(.20,.0,abs(au-.5))*.10;
 }else if(${detail?'false':'true'}){ // V157 world map: paved roads read as smooth grey-brown bands, not tiles
  col=mix(vec3(.47,.44,.38),vec3(.40,.38,.34),nf)*(.93+n*.10);
  col=mix(col,col*.82,smoothstep(.70,.95,au));
 }else{ // cobbles (3) / flagstones (4)
  vec2 cell=lvl<3.5?vec2(u*3.2,v*${detail?'1.6':'.55'}):vec2(u*1.6,v*${detail?'.8':'.28'});
  cell.x+=floor(cell.y)*.5;
  vec2 f=fract(cell)-.5;float stone=l149h(floor(cell));
  float joint=smoothstep(.40,.48,max(abs(f.x),abs(f.y)));
  vec3 rock=lvl<3.5?mix(vec3(.36,.35,.32),vec3(.47,.45,.40),stone):mix(vec3(.44,.43,.40),vec3(.53,.51,.47),stone);
  col=mix(rock*(.9+nf*.15),vec3(.22,.21,.18),joint*.75);
 }
 // shoulders: trodden earth breaking into grass
 float shoulder=smoothstep(.92,1.10,au);
 col=mix(col,mix(dirt,vec3(.31,.35,.21),smoothstep(1.05,1.5,au)),shoulder);
 // edge wear and soft blend into the terrain
 float a=1.0-smoothstep(1.05+n*.25,1.5,au);
 a*=lvl<1.5?.86:.95;
 diffuseColor=vec4(col,a);`});
 };
 material.customProgramCacheKey=()=>'road-v149-v161-'+scope;
 return material;
}

// Worn footpaths on detail maps (instanced blobs and nav-link ribbons share this look).
// uv: ribbons use x across (-1..1); circles use their default 0..1 UVs (radial fade).
export function trailMaterial(radial=false){
 const material=new T.MeshStandardMaterial({roughness:1,metalness:0,transparent:true,depthWrite:false,side:T.DoubleSide,
  vertexColors:!radial,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-3});
 material.onBeforeCompile=shader=>{
  inject(shader,{
   vertexHead:'varying vec2 vL149U;varying vec3 vL149W;',
   vertexBody:`vL149U=uv;vec4 l149w=vec4(position,1.0);
 #ifdef USE_INSTANCING
 l149w=instanceMatrix*l149w;
 #endif
 vL149W=(modelMatrix*l149w).xyz;`,
   fragHead:'varying vec2 vL149U;varying vec3 vL149W;',
   color:`
 float r=${radial?'length(vL149U-.5)*2.0':'abs(vL149U.x)'};
 float n=l149n(vL149W.xz*1.3),nf=l149n(vL149W.xz*5.0);
 vec3 c=diffuseColor.rgb*vec3(.74,.68,.60)*(.82+n*.22+nf*.10);
 float a=1.0-smoothstep(${radial?'.45':'.55'}+n*.25,1.0,r);
 diffuseColor=vec4(c,a*.92);`});
 };
 material.customProgramCacheKey=()=>'trail-v149-'+(radial?'r':'l');
 return material;
}

// Baked relief shading for the terrain grid: valleys and gullies darken, crests and ridges
// catch a little light. One pass over the existing vertices at build time; no runtime cost.
// ring: neighbour distance in grid steps; hScale/vScale convert the mesh to world metres.
export function bakeRelief(geo,{ring=1,hScale=1,vScale=1,strength=1.15,minY=.9}={}){
 const P=geo.attributes.position,C=geo.attributes.color,w=geo.parameters.widthSegments+1,h=geo.parameters.heightSegments+1;
 if(!C||P.count!==w*h)return;
 const at=(c,r)=>(Math.max(0,Math.min(h-1,r)))*w+Math.max(0,Math.min(w-1,c));
 const sx=Math.abs(P.getX(1)-P.getX(0))*ring/hScale||1;
 const out=new Float32Array(P.count);
 for(let r=0;r<h;r++)for(let c=0;c<w;c++){
  const i=r*w+c,y=P.getY(i);
  if(y/vScale<minY){out[i]=1;continue;}
  const avg=(P.getY(at(c+ring,r))+P.getY(at(c-ring,r))+P.getY(at(c,r+ring))+P.getY(at(c,r-ring)))/4;
  const s=((avg-y)/vScale)/sx;                      // >0 hollow, <0 crest
  out[i]=Math.max(.70,Math.min(1.10,1-s*strength));
 }
 for(let i=0;i<P.count;i++){C.setX(i,C.getX(i)*out[i]);C.setY(i,C.getY(i)*out[i]);C.setZ(i,C.getZ(i)*out[i]);}
 C.needsUpdate=true;
}

// ---------------------------------------------------------------- V150: natural biome boundaries
// Biomes are stored per 50 m map cell (gameplay). For drawing, the colours of the four nearest
// cells are blended with smooth weights at a domain-warped position, so borders become soft,
// irregular natural edges instead of square tiles. Sea cells never tint the land.
import {COLS as V150_COLS,ROWS as V150_ROWS,ORIGIN_X as V150_OX,ORIGIN_Z as V150_OZ} from './campaign.js';
const biomeCaches=new WeakMap();
const sstep=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
export function smoothBiomeColor(game,x,z,key,baseFn,out=new T.Color()){
 let caches=biomeCaches.get(game);if(!caches){caches=new Map();biomeCaches.set(game,caches);}
 let table=caches.get(key);
 if(!table){
  table={rgb:new Float32Array(game.cells.length*3),land:new Uint8Array(game.cells.length)};
  const c=new T.Color();
  game.cells.forEach((cell,i)=>{baseFn(cell,c);table.rgb[i*3]=c.r;table.rgb[i*3+1]=c.g;table.rgb[i*3+2]=c.b;table.land[i]=cell.land?1:0;});
  caches.set(key,table);
 }
 // warp the lookup so the blend follows lobes and bays rather than grid lines
 const wx=x+(game.smooth(x/41+5.3,z/41+9.1)-.5)*46+(game.smooth(x/13+71,z/13+33)-.5)*12;
 const wz=z+(game.smooth(x/41+41.7,z/41+3.9)-.5)*46+(game.smooth(x/13+19,z/13+87)-.5)*12;
 const u=(wx-V150_OX)/50-.5,v=(wz-V150_OZ)/50-.5,c0=Math.floor(u),r0=Math.floor(v);
 const fu=sstep(u-c0),fv=sstep(v-r0);
 let r=0,g=0,b=0,w=0;
 for(const [dc,dr,wt] of [[0,0,(1-fu)*(1-fv)],[1,0,fu*(1-fv)],[0,1,(1-fu)*fv],[1,1,fu*fv]]){
  const c=Math.max(0,Math.min(V150_COLS-1,c0+dc)),rr=Math.max(0,Math.min(V150_ROWS-1,r0+dr)),i=rr*V150_COLS+c;
  if(!table.land[i]||wt<=0)continue;
  r+=table.rgb[i*3]*wt;g+=table.rgb[i*3+1]*wt;b+=table.rgb[i*3+2]*wt;w+=wt;
 }
 if(w<=1e-6){const c=Math.max(0,Math.min(V150_COLS-1,Math.floor((x-V150_OX)/50))),rr=Math.max(0,Math.min(V150_ROWS-1,Math.floor((z-V150_OZ)/50))),i=rr*V150_COLS+c;return out.setRGB(table.rgb[i*3],table.rgb[i*3+1],table.rgb[i*3+2]);}
 return out.setRGB(r/w,g/w,b/w);
}
// Farmland on fertile (grain) cells: a patchwork of long strip fields in wheat, stubble and
// green crops, painted into the terrain colour (replaces the old flat yellow rectangles).
const wheat=new T.Color('#b9a45f'),stubble=new T.Color('#9a8a5a'),crop=new T.Color('#7f9a52'),fallow=new T.Color('#8a7a58');
export function farmlandTint(game,cell,x,z,color,strength=.34){
 if(!cell?.land||!cell.deposits?.grain||cell.mountain)return color;
 const cx=cell.x+8,cz=cell.z-11,dx=x-cx,dz=z-cz;
 const reach=19+game.smooth(cell.c*.7+3,cell.r*.7+9)*8;
 const d=Math.hypot(dx*1.15,dz)+ (game.smooth(x/9+2,z/9+5)-.5)*9;
 const mask=1-sstep((d-reach*.6)/(reach*.4));
 if(mask<=0)return color;
 const a=game.noise(cell.c,cell.r+71)*Math.PI,ca=Math.cos(a),sa=Math.sin(a);
 const along=dx*ca+dz*sa,across=-dx*sa+dz*ca,strip=Math.floor(across/4.2),block=Math.floor(along/16);
 const pick=game.noise(cell.c*31+strip*7+block*3,cell.r*17+strip+block*11);
 const field=pick<.3?wheat:pick<.55?crop:pick<.8?stubble:fallow;
 const edge=Math.min(Math.abs(((across%4.2)+4.2)%4.2-2.1),Math.abs(((along%16)+16)%16-8)*0.26);
 const hedge=edge<.35?.82:1;
 return color.lerp(field,mask*strength).multiplyScalar(1-(1-hedge)*mask);
}

// Detail-map ground colour with the same soft biome edges (the 3x3 neighbourhood of tiles no
// longer shows square colour seams). h is the detail-projected height used by the old palette.
// V161: ONE ground palette for both maps (world map and detail map read the same colour for the
// same place). Temperate land keeps the detail-map tones; climate biomes (steppe, desert, taiga,
// tundra, jungle, mesa, snow) get their own tone on both maps.
const GROUND={grassland:'#92a365',lush_river:'#86a35e',steppe:'#98a463',forest:'#56774c',jungle:'#4b7245',
 taiga:'#5f7457',tundra:'#9aa18a',desert:'#c6b17c',mesa:'#a4876a',snow:'#dfe2d9',mountain:'#7d8274',snow_mountain:'#8b928a'};
const WOODED={grassland:'#56774c',lush_river:'#56774c',steppe:'#62794e',desert:'#b3a873',tundra:'#7f8a72',taiga:'#4f6a4f',jungle:'#3f6a40'};
export function groundBaseColor(cell,out=new T.Color()){
 if(!cell?.land)return out.set('#92a365');
 const vb=cell.visualBiome||(cell.mountain?(cell.h>38?'snow_mountain':'mountain'):cell.biome==='forest'?'forest':'grassland');
 if(cell.mountain||vb==='mountain'||vb==='snow_mountain')return out.set(GROUND[vb]||GROUND.mountain);
 if(cell.biome==='hills')return out.set('#67745d');
 if(cell.biome==='beach')return out.set('#c4ad7d');
 if(cell.biome==='forest'&&WOODED[vb])return out.set(WOODED[vb]);
 return out.set(GROUND[vb]||GROUND.grassland);
}
const detailBase=(cell,out)=>groundBaseColor(cell,out);
const D_WATER=new T.Color('#8b9c91'),D_SAND=new T.Color('#dbcba0'),D_HIGH=new T.Color('#77856d'),D_ROCK=new T.Color('#8a9188');
export function detailGroundColor(game,wx,wz,h,mountainHere){
 const color=smoothBiomeColor(game,wx,wz,'ground',detailBase);
 if(h<-.15)return color.copy(D_WATER);
 if(h<.65)return color.copy(D_SAND);
 if(mountainHere&&h>12)color.lerp(D_ROCK,Math.min(1,(h-12)/10)*.6);
 else if(h>8)color.lerp(D_HIGH,Math.min(1,(h-8)/4)*.7);
 return color;
}

// ---------------------------------------------------------------- V150: rounded territory shapes
// A set of 50 m cells ("c:r" keys) is turned into a smooth indicator field (1 inside, 0 outside,
// 0.5 exactly on the cell edges, rounded at the corners). Borders are its 0.5 contour (marching
// squares) and fills fade out along it, so countries and city areas read as natural regions
// instead of stepped squares. The cell membership itself is unchanged.
export function cellRegion(keys){
 const set=new Set(keys);let c0=Infinity,c1=-Infinity,r0=Infinity,r1=-Infinity;
 for(const k of set){const [c,r]=k.split(':').map(Number);c0=Math.min(c0,c);c1=Math.max(c1,c);r0=Math.min(r0,r);r1=Math.max(r1,r);}
 const ind=(c,r)=>set.has(c+':'+r)?1:0;
 const field=(x,z)=>{
  const u=(x-V150_OX)/50-.5,v=(z-V150_OZ)/50-.5,c=Math.floor(u),r=Math.floor(v),fu=sstep(u-c),fv=sstep(v-r);
  return ind(c,r)*(1-fu)*(1-fv)+ind(c+1,r)*fu*(1-fv)+ind(c,r+1)*(1-fu)*fv+ind(c+1,r+1)*fu*fv;
 };
 const box={x0:V150_OX+(c0-1)*50,x1:V150_OX+(c1+2)*50,z0:V150_OZ+(r0-1)*50,z1:V150_OZ+(r1+2)*50};
 return {set,field,box,empty:!set.size};
}
export function regionContour(region,step=6.25){
 const out=[];if(region.empty)return out;
 const {field,box}=region,nx=Math.ceil((box.x1-box.x0)/step),nz=Math.ceil((box.z1-box.z0)/step);
 const row=new Float32Array((nx+1)*(nz+1));
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++)row[j*(nx+1)+i]=field(box.x0+i*step,box.z0+j*step)-.5;
 const at=(i,j)=>row[j*(nx+1)+i];
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
  const a=at(i,j),b=at(i+1,j),c=at(i+1,j+1),d=at(i,j+1);
  const x=box.x0+i*step,z=box.z0+j*step,pts=[];
  const edge=(va,vb,ax,az,bx,bz)=>{if((va>0)!==(vb>0)){const t=va/(va-vb);pts.push([ax+(bx-ax)*t,az+(bz-az)*t]);}};
  edge(a,b,x,z,x+step,z);edge(b,c,x+step,z,x+step,z+step);edge(c,d,x+step,z+step,x,z+step);edge(d,a,x,z+step,x,z);
  if(pts.length===2)out.push(pts[0][0],pts[0][1],pts[1][0],pts[1][1]);
  else if(pts.length===4){out.push(pts[0][0],pts[0][1],pts[1][0],pts[1][1],pts[2][0],pts[2][1],pts[3][0],pts[3][1]);}
 }
 return out;
}
// Fill triangles (x,z) with a per-vertex alpha that fades out at the rounded border.
export function regionFill(region,step=10){
 const pos=[],alpha=[];if(region.empty)return {pos,alpha};
 const {field,box,set}=region;
 for(let z=box.z0;z<box.z1;z+=step)for(let x=box.x0;x<box.x1;x+=step){
  const q=[[x,z],[x+step,z],[x,z+step],[x+step,z+step]],f=q.map(([a,b])=>field(a,b));
  if(Math.max(...f)<.42)continue;
  for(const k of [0,2,1,1,2,3]){pos.push(q[k][0],q[k][1]);alpha.push(sstep((f[k]-.40)/.20));}
 }
 return {pos,alpha};
}
