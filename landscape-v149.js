// V149 landscape look: natural rock, scree, alpine meadow and snow on the mountains; living
// rivers (flowing ripples, depth colour, foam on shallows, wet banks that fade into the land);
// roads and trails with real surfaces (dirt ruts, gravel, cobbles, flagstones) and soft edges.
// Visual only: river, road and terrain coordinates, navigation and saves are unchanged.
// Everything is procedural in the shaders (no texture downloads); geometry counts stay the same.
import * as T from './vendor/three.module.js';
import {DETAIL_X,DETAIL_Z} from './detail-scale-v123.js';

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
function worldMapping(scope,tile){
 if(scope==='world')return {pos:'position',nrm:'objectNormal'};
 const tx=Number(tile?.x||0).toFixed(4),tz=Number(tile?.z||0).toFixed(4);
 return {pos:`vec3(position.x/${DETAIL_X.toFixed(3)}+${tx},position.y/0.30+0.7,position.z/${DETAIL_Z.toFixed(3)}+${tz})`,
  nrm:`vec3(objectNormal.x*${DETAIL_X.toFixed(3)},objectNormal.y*0.30,objectNormal.z*${DETAIL_Z.toFixed(3)})`};
}
function inject(shader,{vertexHead='',vertexBody='',fragHead='',color=''}){
 shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\n'+vertexHead)
  .replace('#include <begin_vertex>','#include <begin_vertex>\n'+vertexBody);
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+NOISE+fragHead)
  .replace('#include <color_fragment>','#include <color_fragment>\n'+color);
}

// ---------------------------------------------------------------- terrain
// Mountains: slope- and altitude-driven bare rock with dark fissures, pale scree fans below the
// cliffs, wind-burnt alpine grass above the tree line and snow fields on gentle high ground.
// Lowlands keep their biome colours with a natural, non-repeating grain.
export function terrainMaterial(scope='world',tile=null){
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
 const map=worldMapping(scope,tile),detail=scope!=='world';
 material.onBeforeCompile=shader=>{
  inject(shader,{
   vertexHead:'varying vec3 vL149P;varying vec3 vL149N;',
   vertexBody:`vL149P=${map.pos};vL149N=normalize(${map.nrm});`,
   fragHead:'varying vec3 vL149P;varying vec3 vL149N;',
   color:`
 vec2 lp=vL149P.xz;float elev=vL149P.y;
 float slope=1.0-clamp(abs(normalize(vL149N).y),0.0,1.0);
 float nBroad=l149f(lp*.018),nMid=l149n(lp*.13),nFine=l149n(lp*${detail?'2.4':'.55'});
 vec3 land=diffuseColor.rgb*(.90+nBroad*.12+nMid*.07+nFine*.05);
 // above ~70 m the grass thins into yellow-grey alpine turf
 float alpine=smoothstep(70.0,105.0,elev+nBroad*18.0);
 land=mix(land,land*vec3(.86,.90,.72)+vec3(.02,.025,.0),alpine*.6);
 ${detail?`// close-up ground grain: tufts, bare soil and small stones (faded out where it would alias)
 float aa=1.0-smoothstep(.35,1.0,fwidth(lp.x*19.0)+fwidth(lp.y*19.0));
 float g1=l149n(lp*7.0),g2=l149n(lp*19.0);
 land*=1.0+((g1-.5)*.16+(g2-.5)*.12)*aa;
 float pebbles=smoothstep(.80,.88,l149n(lp*11.0+3.1))*smoothstep(35.0,65.0,elev)*aa;
 land=mix(land,vec3(.40,.38,.35)*(.9+g2*.2),pebbles*.55);`:''}
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
 diffuseColor.rgb=col;`});
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n roughnessFactor=1.0;');
 };
 material.customProgramCacheKey=()=>`terrain-v149-${scope}-${tile?.x||0}-${tile?.z||0}`;
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
  inject(shader,{
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
 material.customProgramCacheKey=()=>`water-v149-${scope}-${tile?.x||0}-${tile?.z||0}`;
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
  inject(shader,{
   vertexHead:'attribute float aLevel;varying vec3 vL149P;varying vec2 vL149U;varying float vL149L;',
   vertexBody:`vL149P=${map.pos};vL149U=uv;vL149L=aLevel;`,
   fragHead:'varying vec3 vL149P;varying vec2 vL149U;varying float vL149L;',
   color:`
 float u=vL149U.x,v=vL149U.y,au=abs(u);float lvl=floor(vL149L+.5);
 vec2 wp=vL149P.xz;float n=l149n(wp*${detail?'.9':'.35'}),nf=l149n(wp*${detail?'4.0':'1.2'}+5.0);
 vec3 dirt=vec3(.39,.32,.23)*(.86+n*.22);
 vec3 col=dirt;
 if(lvl<1.5){ // dirt track: two wheel ruts, grassy crown
  float rut=smoothstep(.20,.0,abs(au-.55));col*=1.0-rut*.22;
  col=mix(col,vec3(.30,.36,.21)*(.85+nf*.3),smoothstep(.22,.0,au)*.55);
 }else if(lvl<2.5){ // gravel
  col=mix(vec3(.46,.43,.37),vec3(.36,.34,.29),nf)*(.92+n*.12);
  col*=1.0-smoothstep(.20,.0,abs(au-.5))*.10;
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
 material.customProgramCacheKey=()=>`road-v149-${scope}-${tile?.x||0}-${tile?.z||0}`;
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
