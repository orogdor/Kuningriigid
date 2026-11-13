// V149 landscape look: natural rock, scree, alpine meadow and snow on the mountains; living
// rivers (flowing ripples, depth colour, foam on shallows, wet banks that fade into the land);
// roads and trails with real surfaces (dirt ruts, gravel, cobbles, flagstones) and soft edges.
// Visual only: river, road and terrain coordinates, navigation and saves are unchanged.
// Everything is procedural in the shaders (no texture downloads); geometry counts stay the same.
import * as T from './vendor/three.module.js';
import {WATER_STYLE_V326,waterNodeMaterialV326} from './water-style-v326.js';
import {groundUniforms232,GROUND_GLSL232} from './ground-materials-v232.js';
import {DETAIL_X,DETAIL_Z} from './detail-scale-v123.js';
import {CLOUD_TIME,CLOUD_SHADE_V226,TERRAIN_BLEND_V226,WATER_SKY_V251,SEA_EFFECT_V226} from './atmosphere-v158.js?v=161a';

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
function worldMapping(scope,tile,terrain=false){
 if(scope==='world')return {pos:'position',nrm:'objectNormal',head:'',uniforms:{}};
 // V161: detail terrain carries its world height and mountain mask per vertex (aL161), because the
 // drawing height of mountains is exaggerated only on mountain cells; water and roads use 0.3.
 const y=terrain?'aL161.x':'position.y/0.30+0.7',sy=terrain?'(0.30+(aL161.x>10.0?0.9*aL161.y:0.0))':'0.30';
 return {pos:`vec3(position.x/${DETAIL_X.toFixed(3)}+uL149Tile.x,${y},position.z/${DETAIL_Z.toFixed(3)}+uL149Tile.y)`,
  nrm:`vec3(objectNormal.x*${DETAIL_X.toFixed(3)},objectNormal.y*${sy},objectNormal.z*${DETAIL_Z.toFixed(3)})`,
  head:'uniform vec2 uL149Tile;'+(terrain?'attribute vec2 aL161;':''),uniforms:{uL149Tile:{value:new T.Vector2(Number(tile?.x||0),Number(tile?.z||0))}}};
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
 const map=worldMapping(scope,tile,true),detail=scope!=='world',stream=!!tile?.streamingV242;
 material.customProgramCacheKey=()=>`terrain-v242:${scope}:${stream?'stream':'legacy'}`;
 const groundGLSL=stream?GROUND_GLSL232.replace('uniform float uGroundForest232;','varying float vForestV242;').replaceAll('uGroundForest232','vForestV242'):GROUND_GLSL232;
 material.onBeforeCompile=shader=>{
  if(detail)Object.assign(shader.uniforms,groundUniforms232(tile));
  shader.uniforms.uT158Cloud=CLOUD_TIME;
  shader.uniforms.uT226CloudShade=CLOUD_SHADE_V226;
  shader.uniforms.uT226TerrainBlend=TERRAIN_BLEND_V226;
  inject(shader,{map,
   vertexHead:'varying vec3 vL149P;varying vec3 vL149N;'+(detail?'varying vec2 vL156L;':'')+(stream?'attribute float aForestV242;varying float vForestV242;':''),
   vertexBody:`vL149P=${map.pos};vL149N=normalize(${map.nrm});`+(detail?'vL156L=position.xz;':'')+(stream?'vForestV242=aForestV242;':''),
   fragHead:'uniform float uT158Cloud;uniform float uT226CloudShade;uniform float uT226TerrainBlend;varying vec3 vL149P;varying vec3 vL149N;'+(detail?'varying vec2 vL156L;float t156Bump=0.0;float t156G=0.0;'+groundGLSL:''),
   color:`
 vec2 lp=vL149P.xz;float elev=vL149P.y;
 float slope=1.0-clamp(abs(normalize(vL149N).y),0.0,1.0);
 float nBroad=l149f(lp*.018),nMid=l149n(lp*.13),nFine=l149n(lp*${detail?'1.05':'.55'});
 vec3 land=diffuseColor.rgb*(.87+nBroad*.09+nMid*.04+nFine*.016);
 // V223.1: subtle broad organic soil variation, no high-contrast chequered vertex patches.
 float earth=smoothstep(.62,.84,l149n(lp*.065+vec2(5.2,2.8))*.64+l149n(lp*.19+8.7)*.36);
 land=mix(land,land*vec3(.79,.72,.59),earth*.26);
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
 land*=1.0+((cl-.5)*.12+(cl2-.5)*.08*aa)*grassy;
 float bl=l149n(q*3.1+1.7)*.55+l149n(q*7.3+5.2)*.45;
 // Fine organic mottling evokes soil and tangled meadow cover at walking height.
 float organic=l149f(q*.72+vec2(17.0,3.0));
 land=mix(land,land*vec3(.73,.68,.54),smoothstep(.54,.83,organic)*grassy*.20);
 land*=1.0+(bl-.5)*.13*grassy*aa;
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
 t156Bump=(cl*.7+bl*.35*aa+cl2*.25*aa-soil*.5+pebbles*.6)*grassy+pebbles*.4;t156G=grassy*(1.0-soil*.5);`:''}
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
 col*=1.0-cloud*.16*uT226CloudShade;
 ${detail?`// CC0 surface photographs fade gently into the existing distant landscape.
 vec3 gw232=groundWeights232(vL156L);
 float gc232=grassy*(1.0-rock)*(1.0-snow)*uGroundReady232*(1.0-smoothstep(100.0,300.0,length(vViewPosition)));
 vec3 photo232=groundColor232(vL156L*.5,gw232)*(.90+nBroad*.13);
 photo232*=1.0-cloud*.16*uT226CloudShade;
 col=mix(col,photo232,gc232*.88);`:''}
 diffuseColor.rgb=mix(diffuseColor.rgb,col,uT226TerrainBlend);`});
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n roughnessFactor=1.0;'+(detail?'roughnessFactor=mix(1.0,clamp(groundRough232(vL156L*.5,gw232),.65,1.0),gc232*uT226TerrainBlend);':''));
  if(detail)shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 { // V161: relief from the analytic slope of the grass-clump pattern. The V156 screen-space
   // derivative bump drew dotted lines along the terrain triangles on phones.
  vec2 q2=vL156L;const float e=.35;
  float h0=l149n(q2*.55)*.7+l149n(q2*1.7+4.0)*.25;
  float hx=l149n((q2+vec2(e,0.0))*.55)*.7+l149n((q2+vec2(e,0.0))*1.7+4.0)*.25;
  float hz=l149n((q2+vec2(0.0,e))*.55)*.7+l149n((q2+vec2(0.0,e))*1.7+4.0)*.25;
  vec2 g=vec2(hx-h0,hz-h0)/e;
  vec3 tX=normalize((viewMatrix*vec4(1.0,0.0,0.0,0.0)).xyz),tZ=normalize((viewMatrix*vec4(0.0,0.0,1.0,0.0)).xyz);
  normal=normalize(normal-(g.x*tX+g.y*tZ)*.45*t156G);
  vec3 photographicNormal232=groundNormal232(vL156L*.5,gw232);
  normal=normalize(normal+(photographicNormal232.x*tX+photographicNormal232.y*tZ)*.32*gc232*uT226TerrainBlend);
 }`);
 };
 material.customProgramCacheKey=()=>'terrain-v232-'+scope;
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
export function waterMaterial(scope='world',tile=null,{sea=false,scale=1,scaleZ=scale}={}){
 if(T.GPU_MODE_V225)return waterNodeMaterialV326({sea,scale:sea?scale:scope==='detail'?4.5:1,scaleZ:sea?scaleZ:scope==='detail'?3.9:1,origin:tile||{x:0,z:0}});
 // V249: transparent, so river water can thin out into the sea (alpha comes from the vertex colours)
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:WATER_STYLE_V326.roughness,metalness:WATER_STYLE_V326.metalness,side:T.DoubleSide,transparent:true,depthWrite:false,forceSinglePass:true});/* V348: one pass; water is a heightfield seen from above */
 const map=worldMapping(scope,tile);
 if(sea){map.pos=`vec3(position.x/${scale.toFixed(3)}+uSeaOriginV326.x,position.y,position.z/${scaleZ.toFixed(3)}+uSeaOriginV326.y)`;map.head='uniform vec2 uSeaOriginV326;';map.uniforms={uSeaOriginV326:{value:new T.Vector2(tile?.x||0,tile?.z||0)}};}
 material.onBeforeCompile=shader=>{
  shader.uniforms.uL149Time=CLOUD_TIME;shader.uniforms.uWaterSky=WATER_SKY_V251;shader.uniforms.uWaterFXV326=sea?SEA_EFFECT_V226:{value:1};
  if(sea){shader.uniforms.uWaterDeepV326={value:new T.Color(WATER_STYLE_V326.deep)};shader.uniforms.uWaterShallowV326={value:new T.Color(WATER_STYLE_V326.shallow)};}
  inject(shader,{map,
   vertexHead:(sea?'attribute float aDepth;varying float vSeaD;':'attribute vec2 aFlow;attribute float aShore;')+'varying vec3 vL149P;varying vec2 vL149F;varying float vL149S;',
   vertexBody:`vL149P=${map.pos};`+(sea?'vSeaD=aDepth;vL149F=vec2(.65,.12);vL149S=1.0-smoothstep(0.0,3.6,aDepth);':'vL149F=aFlow;vL149S=aShore;'),
   fragHead:'uniform float uL149Time;uniform float uWaterFXV326;varying vec3 vL149P;varying vec2 vL149F;varying float vL149S;'+(sea?'varying float vSeaD;uniform vec3 uWaterDeepV326;uniform vec3 uWaterShallowV326;':''),
   color:(sea?`vec3 sea=mix(uWaterDeepV326,uWaterShallowV326,pow(vL149S,2.2)*.85);
 diffuseColor.rgb=sea*(.97+.03*sin(vL149P.x*.11+vL149P.z*.07));
 diffuseColor.a=.94-.36*pow(vL149S,2.5);`:'')+`
 // V250: flow-map animation. The noise is sampled in plain world coordinates and only SHIFTED along
 // the flow (two phases cross-faded). The former rotated coordinates dot(wp,flow) jumped wherever the
 // flow direction changed between triangles, which drew dashed white lines across every river.
 vec2 wp=vL149P.xz;float spd=length(vL149F)+.001;vec2 fd=vL149F/spd;
 float t=uL149Time*(.35+spd*.55);
 float ph1=fract(t*.22),ph2=fract(t*.22+.5),mixw=abs(ph1*2.0-1.0);
 vec2 o1=fd*ph1*3.2,o2=fd*ph2*3.2;
 float r1=mix(l149n((wp-o1)*.45),l149n((wp-o2)*.45+5.3),mixw);
 float r2=mix(l149n((wp-o1*1.6)*1.15+7.1),l149n((wp-o2*1.6)*1.15+2.9),mixw);
 float ripple=r1*.6+r2*.4;
 vec3 water=diffuseColor.rgb*(.98+(ripple-.5)*.10*uWaterFXV326);
 // sky glints on the ripple crests, mostly mid-stream
 water+=vec3(.045,.055,.06)*smoothstep(.80,.96,r2)*(1.0-vL149S*.7)*uWaterFXV326;
 // soft foam only right at the banks
 float foam=smoothstep(.90,1.0,vL149S)*smoothstep(.60,.88,r1);
 water=mix(water,vec3(.70,.74,.70),foam*.22*uWaterFXV326);
 diffuseColor.rgb=water;
 vL149Ripple=ripple;`});
  shader.fragmentShader=shader.fragmentShader.replace('uniform float uL149Time;','uniform float uL149Time;uniform vec3 uWaterSky;float vL149Ripple=0.0;vec2 vL251Grad=vec2(0.0);')
   .replace('diffuseColor.rgb=water;',`diffuseColor.rgb=water;
 // V251: ripple slope from the same flow-mapped noise (finite differences), for lit, moving wavelets
 {float e=.35;vec2 a1=(wp-o1)*.45,a2=(wp-o2)*.45+5.3,b1=(wp-o1*1.6)*1.15+7.1,b2=(wp-o2*1.6)*1.15+2.9;
  float rx=mix(l149n(a1+vec2(e,0.0)),l149n(a2+vec2(e,0.0)),mixw)*.6+mix(l149n(b1+vec2(e*2.5,0.0)),l149n(b2+vec2(e*2.5,0.0)),mixw)*.4;
  float rz=mix(l149n(a1+vec2(0.0,e)),l149n(a2+vec2(0.0,e)),mixw)*.6+mix(l149n(b1+vec2(0.0,e*2.5)),l149n(b2+vec2(0.0,e*2.5)),mixw)*.4;
  vL251Grad=vec2(rx-ripple,rz-ripple)/e;}`)
   .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 // world-space wavelet normal (water is level) turned into view space
 normal=normalize((viewMatrix*vec4(normalize(vec3(-vL251Grad.x*.32*uWaterFXV326,1.0,-vL251Grad.y*.32*uWaterFXV326)),0.0)).xyz);`)
   .replace('#include <opaque_fragment>',`// V251: Fresnel reflection of the sky: glassy at grazing angles, clear looking straight down
 {vec3 V=normalize(vViewPosition);float cosT=clamp(dot(V,normal),0.0,1.0);float fres=.03+.97*pow(1.0-cosT,5.0);
  outgoingLight=mix(outgoingLight,uWaterSky*(.78+.22*vL149Ripple),clamp(fres*.75,0.0,.75));
  diffuseColor.a=clamp(diffuseColor.a+fres*.35,0.0,1.0);}
#include <opaque_fragment>`);
 };
 if(sea){
  const compile=material.onBeforeCompile;
  material.onBeforeCompile=shader=>{compile(shader);shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
   'float wetV326=smoothstep(-.12,.20,vSeaD);if(wetV326<.008)discard;diffuseColor.a*=wetV326;\n#include <opaque_fragment>');};
  material.vertexColors=false;
 }
 material.customProgramCacheKey=()=>'water-v326-'+scope+'-'+sea+'-'+(sea?scale+':'+scaleZ:'');
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
 // V251: era-appropriate road surfaces. aLevel = surface (1..7) + 10 for a highway (traffic level 4).
 //  1 footpath (Stone Age, no wheels yet)  2 cart track with wheel ruts  3 gravel road with crown and ditches
 //  4 cobblestones  5 dressed stone setts with kerbs  6 macadam (crushed stone)  7 asphalt (centre line on highways)
 float u=vL149U.x,v=vL149U.y,au=abs(u);float code=floor(vL149L+.5);float hw=step(9.5,code);float sf=code-hw*10.0;
 vec2 wp=vL149P.xz;float n=l149n(wp*${detail?'.9':'.35'}),nf=l149n(wp*${detail?'4.0':'1.2'}+5.0);
 vec3 dirt=${detail?'vec3(.39,.32,.23)':'vec3(.45,.38,.28)'}*(.86+n*.22);
 vec3 grass=vec3(.29,.35,.23);
 vec3 col=dirt;float paved=0.0;
 if(sf<1.5){ // footpath: a trodden earth line, worn darker in the middle, grass closing in
  float wear=1.0-smoothstep(.15,.75,au+(n-.5)*.25);
  col=mix(mix(dirt,grass,.35),dirt*.92,wear);
  col*=.92+.10*l149n(wp*2.3+1.7);
 }else if(sf<2.5){ // cart track: two wheel ruts, grassy crown
  float bend=(l149n(wp*.20+vec2(4.0,9.0))-.5)*.12;
  float rut=1.0-smoothstep(.055,.18,abs(au-(.47+bend)));
  float rut2=1.0-smoothstep(.065,.21,abs(au-(.67+bend*.6)));
  col*=1.0-(rut+rut2)*.19;
  col=mix(col,grass*(.85+nf*.25),(1.0-smoothstep(0.0,.28,au))*.45);
  col*=.90+.12*l149n(wp*1.65+3.1);
 }else if(sf<3.5){ // gravel: pebbles, lighter cambered crown, darker ditches
  float peb=${detail?'l149h(floor(wp*7.0))':'.5'};
  col=mix(vec3(.47,.43,.35),vec3(.36,.34,.29),nf)*(.86+peb*.22);
  col*=1.06-.14*smoothstep(.15,.9,au);
  col=mix(col,vec3(.30,.28,.22),smoothstep(.86,1.0,au)*.55);
  float track=1.0-smoothstep(.06,.2,abs(au-.45));col*=1.0-track*.07;
 }else if(sf<4.5){ // cobblestones: rounded, uneven, earth in the joints
  paved=1.0;
  // packed irregular stones: Voronoi cells around jittered centres, narrow earthy joints
  vec2 g=vec2(u*4.0,v*${detail?'2.3':'.9'});vec2 gi=floor(g),gf=fract(g);float d1=8.0,d2=8.0;vec2 sid=vec2(0.0);
  for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 o=vec2(float(i),float(j));vec2 c=o+.5+(vec2(l149h(gi+o),l149h(gi+o+7.3))-.5)*.7;
   float d=length((gf-c)*vec2(1.0,1.1));if(d<d1){d2=d1;d1=d;sid=gi+o;}else if(d<d2)d2=d;}
  float stone=l149h(sid+3.1),edge=d2-d1;
  vec3 rock=mix(vec3(.36,.34,.30),vec3(.52,.49,.43),stone)*(.9+nf*.14);
  rock*=.86+.22*smoothstep(.0,.35,edge); // rounded tops catch the light
  col=mix(vec3(.21,.19,.15),rock,smoothstep(.03,.09,edge));
 }else if(sf<5.5){ // dressed setts in running bond between kerbstones
  paved=1.0;
  vec2 g=vec2(u*5.0,v*${detail?'2.6':'1.0'});g.x+=floor(g.y)*.5;vec2 id=floor(g),f=fract(g)-.5;
  float stone=l149h(id);vec3 rock=mix(vec3(.50,.47,.42),vec3(.60,.57,.51),stone)*(.92+nf*.12);
  float joint=max(smoothstep(.42,.48,abs(f.x)),smoothstep(.40,.48,abs(f.y)));
  col=mix(rock,vec3(.26,.24,.21),joint*.85);
  float kerb=smoothstep(.84,.88,au)*(1.0-smoothstep(1.0,1.04,au));
  col=mix(col,vec3(.62,.60,.56)*(.9+nf*.15),kerb);
 }else if(sf<6.5){ // macadam: compacted crushed stone, paler wheel bands, kerbs
  paved=1.0;
  float grit=${detail?'l149h(floor(wp*11.0))':'.5'};
  col=vec3(.43,.42,.40)*(.88+grit*.18+nf*.06);
  float band=1.0-smoothstep(.07,.22,abs(au-.42));col*=1.0+band*.07;
  float kerb=smoothstep(.88,.92,au)*(1.0-smoothstep(1.0,1.04,au));
  col=mix(col,vec3(.58,.57,.54),kerb*.8);
 }else{ // asphalt with a white edge line; dashed centre line on highways
  paved=1.0;
  float agg=${detail?'l149h(floor(wp*14.0))':'.5'};
  col=vec3(.21,.215,.22)*(.9+agg*.16+nf*.08);
  float patchy=smoothstep(.70,.80,l149n(wp*.35+vec2(3.0,1.0)));col=mix(col,col*.80,patchy*.5);
  float worn=1.0-smoothstep(.06,.2,abs(au-.45));col*=1.0+worn*.10;
  float edgeLine=smoothstep(.86,.875,au)*(1.0-smoothstep(.905,.92,au));
  col=mix(col,vec3(.86,.85,.80),edgeLine*.85);
  float dash=step(.5,fract(v*${detail?'.08':'.04'}));
  float centre=(1.0-smoothstep(.018,.035,au))*dash*hw;
  col=mix(col,vec3(.90,.85,.55),centre*.9);
 }
 // irregular damp stretches and dust, stationary in world space across tile seams
 float damp=smoothstep(.58,.85,l149n(wp*.092+vec2(18.2,3.7))*.65+l149n(wp*.22+8.2)*.35);
 col=mix(col,col*vec3(.77,.79,.80),damp*(.30-paved*.15));
 // shoulders: unpaved roads fray into grass, paved roads end at a firm edge
 float fray=(l149n(wp*1.6+vec2(12.3,4.9))*.20+l149n(wp*3.8-vec2(1.1,8.6))*.08)*(1.0-paved*.75);
 float shoulder=smoothstep(.77+fray+paved*.18,1.13+fray,au);
 col=mix(col,mix(dirt,grass,smoothstep(1.04,1.5,au)),shoulder);
 float a=1.0-smoothstep(.94+fray,1.42+fray-paved*.2,au);
 a*=.92+.07*l149n(wp*1.8);
 a*=sf<1.5?.78:sf<2.5?.86:.96;
 diffuseColor=vec4(col,a);`});
 };
 material.customProgramCacheKey=()=>'road-v251-eras-'+scope;
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
 // V223: sparse stone grit, damp patches and a surviving grassy crown
 // break up the artificial monotone of 1m-by-1m village footpath links.
 vec3 c=diffuseColor.rgb*vec3(.74,.68,.60)*(.82+n*.22+nf*.10);
 float pebble=smoothstep(.78,.94,nf);
 c=mix(c,vec3(.45,.43,.36),pebble*.17);
 float crown=1.0-smoothstep(.06,.43,r);
 c=mix(c,c*vec3(.88,.98,.78),crown*(.11+.20*n));
 float a=1.0-smoothstep(${radial?'.45':'.55'}+n*.24,1.0,r);
 a*=.78+.20*n;
 diffuseColor=vec4(c,a*.94);`});
 };
 material.customProgramCacheKey=()=>'trail-v223-'+(radial?'r':'l');
 return material;
}

// Baked relief shading for the terrain grid: valleys and gullies darken, crests and ridges
// catch a little light. One pass over the existing vertices at build time; no runtime cost.
// ring: neighbour distance in grid steps; hScale/vScale convert the mesh to world metres.
export function bakeRelief(geo,{ring=1,hScale=1,vScale=1,strength=1.15,minY=.9}={}){
 if(geo.userData.adaptiveAtlasV327)return;
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
const GROUND={grassland:'#768d55',lush_river:'#718f52',steppe:'#8b9561',forest:'#4b6945',jungle:'#426640',
 taiga:'#53694c',tundra:'#8e9780',desert:'#b9a573',mesa:'#978067',snow:'#dfe2d9',mountain:'#737b6c',snow_mountain:'#8b928a'};
const WOODED={grassland:'#4c6946',lush_river:'#4d7046',steppe:'#596f48',desert:'#a59a6d',tundra:'#78836b',taiga:'#475e47',jungle:'#375f39'};
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
const D_WET=new T.Color('#8f8266'),D_WATER=new T.Color('#799489'),D_SAND=new T.Color('#b2a17c'),D_HIGH=new T.Color('#697964'),D_ROCK=new T.Color('#7c847b'),D_EARTH=new T.Color('#48553a');
const sstepV286=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function detailGroundColor(game,wx,wz,h,mountainHere){
 const color=smoothBiomeColor(game,wx,wz,'ground',detailBase);
 if(mountainHere&&h>12)color.lerp(D_ROCK,Math.min(1,(h-12)/10)*.6);
 else if(h>8)color.lerp(D_HIGH,Math.min(1,(h-8)/4)*.7);
 // Mute the bright green lowlands while retaining each biome's own colour.
 if(!mountainHere&&h<8)color.lerp(D_EARTH,.24).multiplyScalar(.87);
 if(h>1.6)return color;
 // V286: grass -> dry sand -> wet sand -> shallows blend over a height band instead of switching at one
 // height (a hard switch drew the coarse mesh's triangles as a saw-tooth beach edge). The sand line wanders.
 const wob=(game.smooth(wx/9+41.3,wz/9+7.9)-.5)*.45;
 color.lerp(D_SAND,1-sstepV286((h-(.4+wob))/.75));
 color.lerp(D_WET,(1-sstepV286((h+.05)/.4))*.55);
 color.lerp(D_WATER,1-sstepV286((h+.5)/.4));
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
