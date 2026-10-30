// V158: light and atmosphere.
// A warm sun whose shadow box follows the camera focus (so shadows exist everywhere you look,
// not only near the map centre), a soft sky/ground hemisphere, a gradient sky dome, a distant
// land skirt so the detail map fades into haze instead of ending in a void, and moving cloud
// shadows (a shared uniform the terrain shaders read). Presentation only.
import * as T from './vendor/three.module.js';
import {dayClockV235} from './daynight-v235.js';

export const CLOUD_TIME={value:0};
export const WIND_TIME_V226={value:0};
export const CLOUD_SHADE_V226={value:1};
export const TERRAIN_BLEND_V226={value:1};
export const SEA_EFFECT_V226={value:1};
function skyDome(top,horizon,ground){
 const geo=new T.SphereGeometry(9000,32,16);
 if(T.GPU_MODE_V225){ // V225: the same gradient sky as a node material for the WebGPU renderer
  const {normalize,positionLocal,mix,uniform,pow,clamp,select}=T,p=normalize(positionLocal),h=p.y,uh=uniform(new T.Color(horizon));
  const mat=new T.MeshBasicNodeMaterial({side:T.BackSide,depthWrite:false,fog:false});
  mat.colorNode=select(h.greaterThan(0),mix(uh,uniform(new T.Color(top)),pow(clamp(h.mul(1.6),0,1),.7)),mix(uh,uniform(new T.Color(ground)),clamp(h.negate().mul(6),0,1)));
  const m=new T.Mesh(geo,mat);m.frustumCulled=false;m.renderOrder=-10;m.name='v158 sky';return m;
 }
 const mat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{top:{value:new T.Color(top)},horizon:{value:new T.Color(horizon)},ground:{value:new T.Color(ground)}},
  vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position.z=gl_Position.w;}',
  fragmentShader:'uniform vec3 top,horizon,ground;varying vec3 vP;void main(){float h=vP.y;vec3 c=h>0.0?mix(horizon,top,pow(clamp(h*1.6,0.0,1.0),.7)):mix(horizon,ground,clamp(-h*6.0,0.0,1.0));gl_FragColor=vec4(c,1.0);\n#include <colorspace_fragment>\n}'});
 const m=new T.Mesh(geo,mat);m.frustumCulled=false;m.renderOrder=-10;m.name='v158 sky';return m;
}
export function setupAtmosphere({renderer,worldScene,localScene,quality}){
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
 renderer.shadowMap.type=T.PCFSoftShadowMap;
 const rigs=new Map(),rigsSkirt={mesh:null};
 const colorDayTop=new T.Color('#7fa9c8'),colorNightTop=new T.Color('#071225');
 const colorDayHorizon=new T.Color('#d9e3dc'),colorNightHorizon=new T.Color('#233046'),colorDuskHorizon=new T.Color('#d68d5c');
 const colorDayGround=new T.Color('#a8b79a'),colorNightGround=new T.Color('#222d3a');
 const colorFogDay=new T.Color('#d3ddd5'),colorFogNight=new T.Color('#1a263a');
 const sunDir=new T.Vector3(),tempColor=new T.Color(),skyTop=new T.Color(),skyHorizon=new T.Color(),skyGround=new T.Color(),fogTint=new T.Color();
 for(const [scene,local] of [[worldScene,false],[localScene,true]]){
  // remove the earlier flat light set (hemisphere + 2 directional lights)
  for(const o of [...scene.children])if(o.isHemisphereLight||o.isDirectionalLight)scene.remove(o);
  // V161: the same light on both maps, so the same ground reads the same colour
  const hemi=new T.HemisphereLight(0xdfe9f2,0x5b6a45,1.05);scene.add(hemi);
  const sun=new T.DirectionalLight(0xffe2b8,2.7);sun.castShadow=true;sun.shadow.mapSize.set(quality==='high'?2048:1024,quality==='high'?2048:1024);
  sun.shadow.bias=-.0005;sun.shadow.normalBias=local?.02:.6;sun.shadow.radius=3;scene.add(sun);scene.add(sun.target);
  const fill=new T.DirectionalLight(0xa9c6db,.32);fill.position.set(130,90,-120);scene.add(fill);
  const sky=local?skyDome('#7fa9c8','#d9e3dc','#a8b79a'):skyDome('#5b86a3','#c9d6d2','#2b4a55');scene.add(sky);
  scene.background=null;
  if(local){scene.fog=new T.Fog('#d3ddd5',420,1150);
   // distant land under and around the 3×3 detail area, fading into the haze
   const skirt=new T.Mesh(new T.RingGeometry(330,5200,64,2),new T.MeshStandardMaterial({color:'#7f9560',roughness:1}));skirt.rotation.x=-Math.PI/2;skirt.position.y=-1.4;skirt.receiveShadow=false;skirt.name='v158 land skirt';scene.add(skirt);rigsSkirt.mesh=skirt;
  }else scene.fog=new T.Fog('#b9cbc9',2100,7600);
  rigs.set(scene,{sun,hemi,fill,sky,local,extent:0});
 }
 let worldShadows=quality!=='low';
 let settings={shadows:'medium',shadowDistance:'medium',lighting:'standard',ambient:'normal',daylight:'dynamic',fog:'medium',sky:'enhanced',particles:'medium',wind:true};
 function update(scene,focus,zoom,dt,gameTime=0){
  CLOUD_TIME.value+=dt||0;
  if(settings.wind!==false)WIND_TIME_V226.value+=dt||0;
  const rig=rigs.get(scene);if(!rig)return;
  rig.sky.position.copy(focus);
  // Game seconds (not wall-clock time) determine the sun, so saves and pause
  // resume at the exact same hour. Fixed times remain available for comparisons.
  const chosenTime=settings.daylight==='day'?240:settings.daylight==='evening'?540:settings.daylight==='night'?840:gameTime;
  const clock=dayClockV235(chosenTime),angle=(clock.hour-6)*Math.PI/12;
  sunDir.set(Math.cos(angle)*.85,Math.max(.07,clock.elevation),.48).normalize();
  const twilight=T.MathUtils.clamp(1-Math.abs(clock.elevation)*3,0,1);
  const mode={classic:[1.2,2.0,.25],standard:[1.05,2.7,.32],enhanced:[1.28,2.85,.53],cinematic:[1.38,3.15,.65]}[settings.lighting]||[1.05,2.7,.32];
  const ambient={low:.72,normal:1,bright:1.3}[settings.ambient]||1;
  rig.hemi.intensity=mode[0]*ambient*(.14+.86*clock.daylight);
  rig.fill.intensity=mode[2]*(.2+.8*clock.daylight);
  rig.sun.intensity=mode[1]*Math.pow(clock.daylight,1.25);
  rig.sun.color.set(clock.elevation<.28?'#ffb37d':'#ffe2b8');
  skyTop.copy(colorNightTop).lerp(colorDayTop,clock.daylight);
  skyHorizon.copy(colorNightHorizon).lerp(colorDayHorizon,clock.daylight);
  if(clock.daylight>.05)skyHorizon.lerp(colorDuskHorizon,twilight*.56);
  skyGround.copy(colorNightGround).lerp(colorDayGround,clock.daylight);
  if(rig.sky.material.uniforms){
   rig.sky.material.uniforms.top.value.copy(skyTop);
   rig.sky.material.uniforms.horizon.value.copy(skyHorizon);
   rig.sky.material.uniforms.ground.value.copy(skyGround);
  }
  if(scene.fog)scene.fog.color.copy(colorFogNight).lerp(colorFogDay,clock.daylight);
  if(scene.background?.isColor)scene.background.copy(skyHorizon);
  const shadowRange={near:.6,medium:1,far:1.45}[settings.shadowDistance]||1;
  const extent=(rig.local?Math.max(60,Math.min(300,zoom*1.15)):Math.max(120,Math.min(520,zoom*.9)))*shadowRange;
  rig.sun.target.position.copy(focus);rig.sun.position.copy(focus).addScaledVector(sunDir,extent*2.6);
  // world map shadows only when zoomed in (cheap: only nearby chunks render into the shadow map)
  rig.sun.castShadow=clock.elevation>.07&&settings.shadows!=='off'&&(rig.local?true:(worldShadows&&zoom<480));
  if(Math.abs(rig.extent-extent)>extent*.06){rig.extent=extent;const c=rig.sun.shadow.camera;c.left=-extent;c.right=extent;c.top=extent;c.bottom=-extent;c.near=1;c.far=extent*6;c.updateProjectionMatrix();}
 }
 function setQuality(q){quality=q;worldShadows=q!=='low';setGraphics(settings);}
 function setGraphics(next){settings={...settings,...next};
  CLOUD_SHADE_V226.value=settings.clouds===false?0:1;
  TERRAIN_BLEND_V226.value=settings.terrainBlending===false?0:1;
  SEA_EFFECT_V226.value=settings.water==='simple'?0:1;
  const maps={off:512,low:512,medium:1024,high:2048},size=maps[settings.shadows]||1024;
  for(const [scene,rig] of rigs){
   const mode={classic:[1.2,2.0,.25],standard:[1.05,2.7,.32],enhanced:[1.28,2.85,.53],cinematic:[1.38,3.15,.65]}[settings.lighting]||[1.05,2.7,.32];
   const ambient={low:.72,normal:1,bright:1.3}[settings.ambient]||1;
   rig.hemi.intensity=mode[0]*ambient;rig.sun.intensity=mode[1];rig.fill.intensity=mode[2];
   rig.sun.color.set(settings.daylight==='evening'?'#ffb37d':settings.lighting==='cinematic'?'#ffe8bd':'#ffe2b8');
   if(rig.sun.shadow.mapSize.x!==size){rig.sun.shadow.mapSize.set(size,size);rig.sun.shadow.map?.dispose();rig.sun.shadow.map=null;}
   rig.sky.visible=settings.sky!=='simple';
   scene.background=settings.sky==='simple'?new T.Color(rig.local?'#b7c9bd':'#87aab0'):null;
   const ranges=rig.local?[420,1150]:[2100,7600],f={near:.55,medium:.77,far:1,ultra:1.4}[settings.viewDistance]||1,k=({near:.66,medium:1,far:1.55}[settings.fog]||1)*f;
   scene.fog=settings.fog==='off'?null:new T.Fog(rig.local?'#d3ddd5':'#b9cbc9',ranges[0]*k,ranges[1]*k);
  }
  const count={off:0,low:4,medium:12,high:18}[settings.particles]??12;
  birdsW.mesh.count=Math.min(15,count);birdsL.mesh.count=Math.min(12,count);
 }

 const birdsW=createBirds(15),birdsL=createBirds(12);worldScene.add(birdsW.mesh);localScene.add(birdsL.mesh);
 const updateCore=update;
 function updateAll(scene,focus,zoom,dt,gameTime=0){updateCore(scene,focus,zoom,dt,gameTime);const t=CLOUD_TIME.value;if(scene===worldScene)birdsW.update(focus,zoom,t,false);else birdsL.update(focus,zoom,t,true);}
 function setSkirt(water){if(rigsSkirt.mesh)rigsSkirt.mesh.material.color.set(water?'#4d8a8e':'#7f9560');}
 return {update:updateAll,setQuality,setGraphics,setSkirt};
}
// Wind: plants sway with height above their base. Works for plain and instanced meshes; each
// instance gets its own phase from its position. Shadows keep the rest pose (cheap and fine).
export function addWind(material,{strength=.05,from=.35,key='wind'}={}){
 const prev=material.onBeforeCompile;
 material.onBeforeCompile=(shader,r)=>{prev?.call(material,shader,r);shader.uniforms.uWindT=WIND_TIME_V226;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uWindT;')
   .replace('#include <begin_vertex>',`#include <begin_vertex>
  {vec3 base=vec3(0.0);
  #ifdef USE_INSTANCING
   base=instanceMatrix[3].xyz;
  #endif
   base+=modelMatrix[3].xyz;
   float ph=base.x*.13+base.z*.17;float hgt=max(0.0,transformed.y-${from.toFixed(2)});float k=hgt*hgt*${strength.toFixed(3)};
   float gust=.6+.4*sin(uWindT*.35+base.x*.01);
   transformed.x+=sin(uWindT*1.7+ph)*k*gust;transformed.z+=cos(uWindT*1.3+ph*1.3)*k*.6*gust;}`);};
 const prevKey=material.customProgramCacheKey?.bind(material);
 material.customProgramCacheKey=()=>(prevKey?prevKey():'')+'-'+key;material.needsUpdate=true;
 return material;
}
// Birds: a few small flocks gliding and flapping over the camera focus.
export function createBirds(count=18){
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute([0,0,.25, -1,0,-.15, 0,0,-.05, 0,0,.25, 0,0,-.05, 1,0,-.15],3));g.computeVertexNormals();
 const mat=new T.MeshBasicMaterial({color:'#2b2a26',side:T.DoubleSide});
 const mesh=new T.InstancedMesh(g,mat,count);mesh.frustumCulled=false;mesh.name='v158 birds';
 const birds=[...Array(count)].map((_,i)=>({flock:i%3,a:i*2.39,r:.7+((i*37)%10)/14,h:((i*53)%10)/10,phase:i*1.7}));
 const m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),pos=new T.Vector3(),sc=new T.Vector3();
 function update(focus,zoom,time,local){
  const R=(local?Math.min(260,zoom*1.2):Math.min(900,zoom*1.0)),H=local?Math.max(18,zoom*.22):Math.max(40,zoom*.18),S=local?1.0:Math.max(2.5,zoom*.012);
  birds.forEach((b,i)=>{const fa=time*.05*(1+b.flock*.3)+b.flock*2.1,cx=focus.x+Math.cos(fa)*R*.45,cz=focus.z+Math.sin(fa*1.3)*R*.35;
   const ang=time*.35*(b.flock%2?1:-1)+b.a,rr=R*.08*b.r;pos.set(cx+Math.cos(ang)*rr,H*(1+b.h*.4),cz+Math.sin(ang)*rr);
   const flap=Math.sin(time*9+b.phase);e.set(0,-ang+(b.flock%2?0:Math.PI),flap*.25);q.setFromEuler(e);sc.set(S,S*(1+flap*.15),S);
   m.compose(pos,q,sc);mesh.setMatrixAt(i,m);});
  mesh.instanceMatrix.needsUpdate=true;
 }
 return {mesh,update};
}
