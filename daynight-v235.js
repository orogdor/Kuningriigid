// V235 — 24-hour visual clock: 60 real seconds = 1 in-game hour.
// The same saved game s.time drives time-of-day. It never affects economy ticks.
import * as T from './vendor/three.module.js';

export const DAY_LENGTH_V235=24*60; // simulation seconds per 24-hour day
export const START_HOUR_V235=8;
export function dayClockV235(seconds=0){
 const time=Number.isFinite(seconds)?seconds:0;
 const hour=((START_HOUR_V235+time/60)%24+24)%24;
 const angle=(hour-6)*Math.PI/12;
 const elevation=Math.sin(angle);
 const daylight=T.MathUtils.clamp((elevation+.09)/.52,0,1);
 const twilight=T.MathUtils.clamp((elevation+.14)/.36,0,1);
 const torch=T.MathUtils.clamp((.4-daylight)/.36,0,1);
 const hh=String(Math.floor(hour)).padStart(2,'0');
 const mm=String(Math.floor((hour%1)*60)).padStart(2,'0');
 return {hour,elevation,daylight,twilight,torch,clock:hh+':'+mm,
  night:daylight<.25};
}

// V236: shaped wooden torch, iron basket, charcoal embers, animated multi-tongue
// fire and very few real-time lights. Geometry and materials are shared.
const mats={
 wood:new T.MeshStandardMaterial({color:'#67452b',roughness:1}),
 darkWood:new T.MeshStandardMaterial({color:'#30231d',roughness:1}),
 wrap:new T.MeshStandardMaterial({color:'#b4a083',roughness:1}),
 iron:new T.MeshStandardMaterial({color:'#42413c',roughness:.67,metalness:.36}),
 coals:new T.MeshStandardMaterial({color:'#381b0f',emissive:'#ce3912',emissiveIntensity:.8,roughness:.98}),
 outer:new T.MeshBasicMaterial({color:'#ff7a22',side:T.DoubleSide,transparent:true,opacity:.95,depthWrite:false}),
 middle:new T.MeshBasicMaterial({color:'#ffbf38',side:T.DoubleSide,transparent:true,opacity:.95,depthWrite:false}),
 core:new T.MeshBasicMaterial({color:'#fff3ba',side:T.DoubleSide,transparent:true,opacity:.94,depthWrite:false}),
 halo:new T.MeshBasicMaterial({color:'#ffad45',side:T.DoubleSide,transparent:true,opacity:.20,depthWrite:false,blending:T.AdditiveBlending})
};
const geos={
 shaft:new T.CylinderGeometry(.042,.071,1.83,9,4),
 collar:new T.CylinderGeometry(.060,.058,.24,9),
 cup:new T.CylinderGeometry(.122,.087,.25,10,1,true),
 rim:new T.TorusGeometry(.122,.012,5,12),
 cord:new T.TorusGeometry(.065,.008,5,12),
 spar:new T.CylinderGeometry(.012,.012,.27,6),
 coal:new T.DodecahedronGeometry(.062,0),
 glow:new T.SphereGeometry(.26,9,6)
};
for(const g of Object.values(geos))g.userData.shared=true;
function flameGeometry(height,rad,lean=0){
 const positions=[],idx=[],rings=7,n=9;
 for(let j=0;j<rings;j++){
  const t=j/(rings-1);
  const radius=rad*Math.pow(1-t,.64)*(1+.11*Math.sin(t*15+lean*4));
  for(let k=0;k<n;k++){
   const a=k*Math.PI*2/n,twist=t*.7+lean;
   positions.push(Math.cos(a+twist)*radius+lean*t*t,t*height,Math.sin(a+twist)*radius*.83+Math.sin(t*7+lean)*rad*.13);
  }
 }
 for(let j=0;j<rings-1;j++)for(let k=0;k<n;k++){
  const a=j*n+k,b=j*n+(k+1)%n,c=(j+1)*n+k,d=(j+1)*n+(k+1)%n;
  idx.push(a,b,c,b,d,c);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(idx);g.computeVertexNormals();g.userData.shared=true;return g;
}
const flames={
 orange:flameGeometry(.43,.115,.13),
 yellow:flameGeometry(.34,.076,-.24),
 gold:flameGeometry(.24,.047,.11)
};
function mesh(parent,geo,material,x=0,y=0,z=0){
 const o=new T.Mesh(geo,material);o.position.set(x,y,z);o.castShadow=material===mats.wood||material===mats.iron;parent.add(o);return o;
}
// V250: a rustic torch instead of a "street lamp": thick hewn stave, iron basket, a big multi-tongue
// fire with sparks, a soft camera-facing glow (no glass-ball halo) and a warm pool of light on the
// ground under every torch (only a few torches carry a real light, the pools are cheap). Light +25 %.
export const TORCH_LIGHT_V250={intensity:1.55*1.25,distance:16*1.25,count:4}; // at most 4 real lights per town (performance; tests V235/V236)
function radialTexture(stops){
 const c=typeof document!=='undefined'?document.createElement('canvas'):null;if(!c)return null;
 c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
 for(const [o,col] of stops)r.addColorStop(o,col);g.fillStyle=r;g.fillRect(0,0,64,64);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
let glowMats=null;
function torchGlowMaterials(){
 if(glowMats)return glowMats;
 const glow=radialTexture([[0,'rgba(255,214,140,0.95)'],[.25,'rgba(255,160,70,0.55)'],[.6,'rgba(255,110,30,0.15)'],[1,'rgba(255,90,20,0)']]);
 const pool=radialTexture([[0,'rgba(255,170,90,0.55)'],[.45,'rgba(255,130,60,0.22)'],[1,'rgba(255,110,40,0)']]);
 glowMats={
  glow:new T.SpriteMaterial({map:glow,color:'#ffffff',transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.85}),
  pool:new T.MeshBasicMaterial({map:pool,color:'#ffffff',transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.9,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),
  spark:new T.MeshBasicMaterial({color:'#ffcf6a',transparent:true,opacity:.9,depthWrite:false,blending:T.AdditiveBlending})
 };
 // V251: gas mantles and electric lamps give a whiter light than open flame
 const glowW=radialTexture([[0,'rgba(255,248,226,0.95)'],[.25,'rgba(255,236,200,0.5)'],[.6,'rgba(255,226,180,0.13)'],[1,'rgba(255,220,170,0)']]);
 const poolW=radialTexture([[0,'rgba(255,240,215,0.5)'],[.45,'rgba(255,228,190,0.2)'],[1,'rgba(255,220,180,0)']]);
 glowMats.glowWhite=new T.SpriteMaterial({map:glowW,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.85});
 glowMats.poolWhite=new T.MeshBasicMaterial({map:poolW,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.9,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
 return glowMats;
}
const torchGeos={
 stave:new T.CylinderGeometry(.065,.085,1.75,7,3),
 band:new T.CylinderGeometry(.078,.078,.07,8),
 basket:new T.CylinderGeometry(.17,.10,.30,8,1,true),
 ring:new T.TorusGeometry(.17,.016,5,14),
 rag:new T.CylinderGeometry(.11,.095,.16,8),
 spark:new T.OctahedronGeometry(.018,0),
 pool:(()=>{const g=new T.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);return g;})()
};
for(const g of Object.values(torchGeos))g.userData.shared=true;
const bigFlames={
 outer:flameGeometry(.62,.16,.10),
 left:flameGeometry(.46,.10,-.32),
 right:flameGeometry(.42,.09,.35),
 core:flameGeometry(.32,.07,.05)
};
// V251: real fire and period street lighting.
//  - The flame is an animated shader (rising noise, white-yellow core → orange → red tips, flicker),
//    drawn on three crossed planes with additive blending, plus sparks and a little smoke.
//    WebGL uses GLSL; the WebGPU renderer gets the same flame as TSL nodes.
//  - The fixture follows the town's era, historically: torches from the Stone Age through the Middle
//    Ages, oil lanterns on posts in the Renaissance, cast-iron gas lamps in the Industrial era and
//    electric street lights in the Modern era. Lamps give stronger, whiter light than open flame.
export const FIXTURE_LIGHT_V251={
 torch:{color:'#ffab50',intensity:1.55*1.25,distance:20},
 lantern:{color:'#ffb866',intensity:2.1,distance:21},
 gas:{color:'#ffe2a8',intensity:2.6,distance:24},
 electric:{color:'#fff1da',intensity:3.4,distance:28}
};
export function fixtureForAgeV251(age=0){age=Math.floor(Number(age)||0);return age>=6?'electric':age===5?'gas':age===4?'lantern':'torch';}
const FIRE_TIME={value:0};
let fireMat=null;
function fireMaterial(){
 if(fireMat)return fireMat;
 if(T.GPU_MODE_V225){
  const {Fn,uv,vec2,vec3,float,fract,floor,sin,dot,mix,smoothstep,abs,pow,max,time}=T;
  const h=p=>fract(sin(dot(p,vec2(127.1,311.7))).mul(43758.5453));
  const vn=Fn(([p])=>{const i=floor(p),f0=fract(p),f=f0.mul(f0).mul(float(3).sub(f0.mul(2)));return mix(mix(h(i),h(i.add(vec2(1,0))),f.x),mix(h(i.add(vec2(0,1))),h(i.add(vec2(1,1))),f.x),f.y);});
  const q=uv(),x=q.x.sub(.5),y=q.y,t=time.mul(2.6);
  const n=vn(vec2(x.mul(3.0),y.mul(2.2).sub(t))).mul(.65).add(vn(vec2(x.mul(7.0),y.mul(5.0).sub(t.mul(1.7)))).mul(.35));
  const wdt=pow(max(float(1).sub(y),0.001),.7).mul(.44).mul(n.sub(.5).mul(.5).add(1));
  const d=abs(x.add(n.sub(.5).mul(.22).mul(y))).div(wdt);
  const k=float(1).sub(smoothstep(.55,1.0,d)).mul(smoothstep(0,.07,y)).mul(float(1).sub(smoothstep(.55,1.0,y.add(n.sub(.5).mul(.35)))));
  const core=float(1).sub(smoothstep(.0,.38,d)).mul(float(1).sub(smoothstep(.08,.42,y)));
  const c=mix(mix(vec3(.85,.18,.03),vec3(1.0,.55,.10),smoothstep(.1,.6,k)),vec3(1.0,.93,.70),core);
  fireMat=new T.MeshBasicNodeMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,fog:false});
  fireMat.colorNode=c.mul(k.mul(1.35));fireMat.opacityNode=k;
  return fireMat;
 }
 fireMat=new T.ShaderMaterial({uniforms:{uTime:FIRE_TIME},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
  vertexShader:`varying vec2 vUv;varying float vSeed;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.0);vSeed=fract(modelMatrix[3].x*.371+modelMatrix[3].z*.713);gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform float uTime;varying vec2 vUv;varying float vSeed;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
void main(){
 float x=vUv.x-.5,y=vUv.y,t=uTime*2.6+vSeed*17.0;
 float n=vn(vec2(x*3.0+vSeed*9.0,y*2.2-t))*.65+vn(vec2(x*7.0,y*5.0-t*1.7))*.35;
 float w=pow(max(1.0-y,.001),.7)*.44*(1.0+(n-.5)*.5);
 float d=abs(x+(n-.5)*.22*y)/w;
 float k=(1.0-smoothstep(.55,1.0,d))*smoothstep(0.0,.07,y)*(1.0-smoothstep(.55,1.0,y+(n-.5)*.35));
 float core=(1.0-smoothstep(0.0,.38,d))*(1.0-smoothstep(.08,.42,y));
 vec3 c=mix(mix(vec3(.85,.18,.03),vec3(1.0,.55,.10),smoothstep(.1,.6,k)),vec3(1.0,.93,.70),core);
 gl_FragColor=vec4(c*k*1.35,k);
 #include <colorspace_fragment>
}`});
 return fireMat;
}
const fireGeo=(()=>{const g=new T.PlaneGeometry(.5,1,1,1);g.translate(0,.5,0);g.userData.shared=true;return g;})();
function addFire(parent,scale=1,y=0){
 const fire=new T.Group();fire.position.y=y;fire.scale.setScalar(scale);
 for(let i=0;i<3;i++){const m=new T.Mesh(fireGeo,fireMaterial());m.rotation.y=i*Math.PI/3;m.renderOrder=12;fire.add(m);}
 parent.add(fire);return fire;
}
let smokeMat=null;
function smokeMaterial(){if(smokeMat!==null)return smokeMat;const tex=radialTexture([[0,'rgba(90,86,80,0.55)'],[.5,'rgba(90,86,80,0.22)'],[1,'rgba(90,86,80,0)']]);
 smokeMat=tex?new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false,opacity:.5}):false;return smokeMat;}
const lampMats={
 iron:new T.MeshStandardMaterial({color:'#2c2c2a',roughness:.6,metalness:.5}),
 green:new T.MeshStandardMaterial({color:'#24352c',roughness:.5,metalness:.45}),
 steel:new T.MeshStandardMaterial({color:'#7d8186',roughness:.45,metalness:.6}),
 oak:new T.MeshStandardMaterial({color:'#5a3f28',roughness:.95}),
 glass:new T.MeshStandardMaterial({color:'#ffe2a8',emissive:'#ffb760',emissiveIntensity:1.4,transparent:true,opacity:.55,roughness:.2,depthWrite:false}),
 gasGlass:new T.MeshStandardMaterial({color:'#fff1cf',emissive:'#ffd98f',emissiveIntensity:2.0,transparent:true,opacity:.65,roughness:.15,depthWrite:false}),
 bulb:new T.MeshStandardMaterial({color:'#ffffff',emissive:'#fff1da',emissiveIntensity:3.0,roughness:.3}),
 mantle:new T.MeshBasicMaterial({color:'#fff6d8'})
};
const lampGeos={
 post:new T.CylinderGeometry(.06,.085,2.6,8),gasPost:new T.CylinderGeometry(.07,.11,3.2,10),gasBase:new T.CylinderGeometry(.2,.26,.5,10),
 pole:new T.CylinderGeometry(.07,.10,5.4,10),arm:new T.TorusGeometry(.75,.045,6,12,Math.PI/2),head:new T.BoxGeometry(.9,.12,.32),
 pane:new T.PlaneGeometry(.26,.34),cap:new T.ConeGeometry(.26,.22,4),frame:new T.BoxGeometry(.03,.4,.03),bracket:new T.BoxGeometry(.55,.04,.04),
 gasHead:new T.CylinderGeometry(.24,.15,.5,4,1,true),gasCrown:new T.ConeGeometry(.3,.28,4),mantle:new T.SphereGeometry(.06,8,6),
 bulbFace:new T.BoxGeometry(.7,.03,.24)
};
for(const g of Object.values(lampGeos))g.userData.shared=true;
function fixtureModel(kind,withLight){
 const root=new T.Group();root.name='V251 '+kind;
 const gm=torchGlowMaterials(),cfg=FIXTURE_LIGHT_V251[kind];
 let flame,lightY,haloY,haloScale,poolScale;
 if(kind==='torch'){
  const stave=mesh(root,torchGeos.stave,mats.wood,0,.875,0);stave.rotation.z=.035;
  for(const y of [.35,1.45])mesh(root,torchGeos.band,mats.iron,0,y,0);
  mesh(root,torchGeos.rag,mats.wrap,0,1.79,0);mesh(root,torchGeos.basket,mats.iron,0,1.92,0);
  const ring=mesh(root,torchGeos.ring,mats.iron,0,2.07,0);ring.rotation.x=Math.PI/2;
  for(let i=0;i<6;i++){const a=i*Math.PI/3,bar=mesh(root,geos.spar,mats.iron,Math.cos(a)*.135,1.94,Math.sin(a)*.135);bar.rotation.z=Math.cos(a)*.22;bar.rotation.x=-Math.sin(a)*.22;}
  for(let i=0;i<4;i++){const a=i*Math.PI/2+.4,coal=mesh(root,geos.coal,mats.coals,Math.cos(a)*.06,2.03,Math.sin(a)*.06);coal.scale.set(.9,.6,.85);}
  flame=new T.Group();flame.position.set(0,2.0,0);root.add(flame);
  addFire(flame,1.4,0);addFire(flame,.9,.02).rotation.y=.5;addFire(flame,.55,.04).rotation.y=1.1;
  lightY=2.35;haloY=2.4;haloScale=[1.5,1.9];poolScale=7;
 }else if(kind==='lantern'){
  mesh(root,lampGeos.post,mats.wood,0,1.3,0);
  const br=mesh(root,lampGeos.bracket,lampMats.iron,.24,2.5,0);
  flame=new T.Group();flame.position.set(.46,2.2,0);root.add(flame);
  for(let i=0;i<4;i++){const p=new T.Mesh(lampGeos.pane,lampMats.glass);p.rotation.y=i*Math.PI/2;p.position.set(Math.sin(i*Math.PI/2)*.13,.17,Math.cos(i*Math.PI/2)*.13);flame.add(p);}
  for(let i=0;i<4;i++){const f=mesh(root,lampGeos.frame,lampMats.iron,.46+(i%2?.13:-.13),2.37,(i>1?.13:-.13));}
  const cap=mesh(root,lampGeos.cap,lampMats.iron,.46,2.66,0);cap.rotation.y=Math.PI/4;
  addFire(flame,.22,.06);
  lightY=2.35;haloY=2.4;haloScale=[1.1,1.2];poolScale=7.5;
 }else if(kind==='gas'){
  mesh(root,lampGeos.gasBase,lampMats.green,0,.25,0);mesh(root,lampGeos.gasPost,lampMats.green,0,1.85,0);
  flame=new T.Group();flame.position.set(0,3.45,0);root.add(flame);
  const glass=new T.Mesh(lampGeos.gasHead,lampMats.gasGlass);glass.rotation.y=Math.PI/4;flame.add(glass);
  const mantle=new T.Mesh(lampGeos.mantle,lampMats.mantle);mantle.position.y=-.05;flame.add(mantle);
  const inner=new T.Mesh(lampGeos.mantle,lampMats.mantle);inner.scale.setScalar(.6);inner.position.y=.06;flame.add(inner);
  const crown=mesh(root,lampGeos.gasCrown,lampMats.green,0,3.84,0);crown.rotation.y=Math.PI/4;
  lightY=3.4;haloY=3.45;haloScale=[1.3,1.4];poolScale=9;
 }else{ // electric street light
  mesh(root,lampGeos.pole,lampMats.steel,0,2.7,0);
  const arm=mesh(root,lampGeos.arm,lampMats.steel,.75,5.4,0);arm.rotation.z=Math.PI/2;arm.rotation.y=0;
  mesh(root,lampGeos.head,lampMats.steel,1.45,6.12,0);
  flame=new T.Group();flame.position.set(1.45,6.05,0);root.add(flame);
  for(const dx of [-.22,0,.22]){const b=new T.Mesh(lampGeos.bulbFace,lampMats.bulb);b.scale.set(.3,1,1);b.position.x=dx;flame.add(b);}
  lightY=5.9;haloY=5.95;haloScale=[1.6,1.0];poolScale=12;
 }
 const sparks=[];
 if(kind==='torch')for(let i=0;i<6;i++){const sp=new T.Mesh(torchGeos.spark,gm?.spark||mats.core);sp.userData.seed=i*1.37;flame.add(sp);sparks.push(sp);}
 const smoke=[];const sm=kind==='torch'?smokeMaterial():null;
 if(sm)for(let i=0;i<3;i++){const s=new T.Sprite(sm);s.userData.seed=i/3;s.renderOrder=11;flame.add(s);smoke.push(s);}
 let halo=null,pool=null;
 const fx=flame.position.x;
 if(gm){
  const white=kind==='gas'||kind==='electric';
  halo=new T.Sprite(white?gm.glowWhite:gm.glow);halo.position.set(fx,haloY,0);halo.scale.set(haloScale[0],haloScale[1],1);root.add(halo);
  pool=new T.Mesh(torchGeos.pool,white?gm.poolWhite:gm.pool);pool.position.set(fx,.04,0);pool.scale.set(poolScale,1,poolScale);pool.renderOrder=3;root.add(pool);
 }else{halo=mesh(root,geos.glow,mats.halo,fx,haloY,0);}
 const light=withLight?new T.PointLight(cfg.color,0,cfg.distance,2):null;
 if(light){light.position.set(fx,lightY,0);light.castShadow=false;root.add(light);}
 return {root,flame,halo,light,pool,sparks,smoke,kind,haloScale,poolScale};
}
function torchModel(withLight=false){return fixtureModel('torch',withLight);}
// The mesh doors face +Z (town-models-v154 doorway(...,'f',...)); transform
// their thresholds by the same Y rotation as the building.
const TORCH_DOORS={
 house:{z:3.5,x:[1.25]},hall:{z:4.5,x:[-2.05,2.05]},
 market:{z:3.4,x:[-1.9,1.9]},tavern:{z:3.1,x:[-1.55,1.55]},
 barracks:{z:3.8,x:[-1.8,1.8]},warehouse:{z:3.2,x:[-1.7,1.7]},
 farm:{z:3.4,x:[1.45]},lumber:{z:3.2,x:[1.45]},
 quarry:{z:3.4,x:[1.45]},mason:{z:3.1,x:[1.35]},
 pottery_kiln:{z:3.0,x:[1.25]},workshop:{z:3.2,x:[1.5]},
 watchtower:{z:3.0,x:[1.35]},stonetower:{z:3.1,x:[1.5]},
 woodgate:{z:1.4,x:[-2.35,2.35]},gatehouse:{z:1.5,x:[-2.55,2.55]},
 harbor:{z:3.1,x:[1.3]},port:{z:3.1,x:[1.4]},
 library:{z:3.2,x:[-1.5,1.5]},school:{z:3.1,x:[1.4]},
 study:{z:3.0,x:[1.3]},blacksmith:{z:3.0,x:[1.4]},
 baker:{z:3.0,x:[1.3]},mill:{z:3.0,x:[1.4]}
};
export function torchLocationsV235(buildings=[]){
 const sites=[],max=22;
 // Doors and gates first, while respecting the cap on dense towns.
 const ranked=buildings.map((b,i)=>({b,i})).sort((a,b)=>{
  const priority=v=>['woodgate','gatehouse','hall'].includes(v?.type)?0:v?.type==='house'?1:2;
  return priority(a.b)-priority(b.b)||a.i-b.i;
 });
 for(const {b} of ranked){
  if(!b||b.virtual||b.hp<=0||b.ready===false||!Number.isFinite(b.x)||!Number.isFinite(b.z))continue;
  const door=TORCH_DOORS[b.type];if(!door)continue;
  const angle=Number.isFinite(b.buildingRotationV228)?b.buildingRotationV228:
   Number.isFinite(b.wallAngleV175)?b.wallAngleV175:(b.wallAxis?Math.PI/2:0);
  const sin=Math.sin(angle),cos=Math.cos(angle);
  for(const dx of door.x){
   const x=b.x+dx*cos+door.z*sin,z=b.z-dx*sin+door.z*cos;
   if(sites.some(p=>Math.hypot(p.x-x,p.z-z)<1.0))continue;
   sites.push({x,z,kind:b.type,doorX:b.x,doorZ:b.z,angle});
   if(sites.length>=max)return sites;
  }
 }
 return sites;
}
export function createCityTorchesV235(buildings,heightAt,{age=0}={}){
 const group=new T.Group();group.name='V251 town lights';
 const kind=fixtureForAgeV251(age),locations=torchLocationsV235(buildings),models=[];
 locations.forEach((p,i)=>{
  const model=fixtureModel(kind,i<TORCH_LIGHT_V250.count);
  model.root.position.set(p.x,(Number(heightAt(p.x,p.z))||0)+.035,p.z);
  model.root.rotation.y=p.angle;
  group.add(model.root);models.push(model);
 });
 group.userData.torchModelsV235=models;group.userData.fixtureV251=kind;
 return group;
}
export function updateCityTorchesV235(group,clock,elapsed=0){
 if(!group?.userData?.torchModelsV235)return;
 FIRE_TIME.value=elapsed;
 const power=clock?.torch??0,visible=power>.04;
 for(const [i,o] of group.userData.torchModelsV235.entries()){
  o.flame.visible=visible;if(o.halo)o.halo.visible=visible;if(o.pool)o.pool.visible=visible;
  const fire=o.kind==='torch'||o.kind==='lantern'||!o.kind;
  const w=fire?Math.sin(elapsed*10+i*3.7)*.11+Math.sin(elapsed*15+i*2.1)*.075+Math.sin(elapsed*23+i)*.03:Math.sin(elapsed*2+i)*.01;
  if(visible){
   if(o.kind==='torch'||!o.kind){o.flame.rotation.z=w*.18;o.flame.scale.set(1+w*.6,.95+w*.5,1+w*.4);}
   const hs=o.haloScale||[1.5,1.9];
   if(o.halo)o.halo.scale.set((hs[0]+w*.25)*(.7+.3*power),(hs[1]+w*.3)*(.7+.3*power),1);
   if(o.pool){const k=((o.poolScale||7)+w*1.2)*(.6+.4*power);o.pool.scale.set(k,1,k);}
   for(const sp of o.sparks||[]){const t=(elapsed*.9+sp.userData.seed)%1;sp.position.set(Math.sin(sp.userData.seed*5+elapsed)*.1*(1+t),.45+t*1.0,Math.cos(sp.userData.seed*3+elapsed)*.1*(1+t));sp.scale.setScalar(1-t*.8);}
   for(const sm of o.smoke||[]){const t=(elapsed*.25+sm.userData.seed)%1;sm.position.set(Math.sin(elapsed*.7+sm.userData.seed*6)*.12*t,.9+t*1.6,0);const k=.35+t*.9;sm.scale.set(k,k,1);sm.material.opacity=.45;}
  }
  const cfg=FIXTURE_LIGHT_V251[o.kind||'torch'];
  if(o.light)o.light.intensity=visible?cfg.intensity*power*(fire?(.95+.05*Math.sin(elapsed*9+i)):1):0;
 }
}
