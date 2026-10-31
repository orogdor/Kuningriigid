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
export const TORCH_LIGHT_V250={intensity:1.55*1.25,distance:16*1.25,count:5};
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
function torchModel(withLight=false){
 const root=new T.Group();root.name='V250 rustic torch';
 const gm=torchGlowMaterials();
 const stave=mesh(root,torchGeos.stave,mats.wood,0,.875,0);stave.rotation.z=.035;
 for(const y of [.35,1.45])mesh(root,torchGeos.band,mats.iron,0,y,0);
 mesh(root,torchGeos.rag,mats.wrap,0,1.79,0);
 mesh(root,torchGeos.basket,mats.iron,0,1.92,0);
 const ring=mesh(root,torchGeos.ring,mats.iron,0,2.07,0);ring.rotation.x=Math.PI/2;
 for(let i=0;i<6;i++){const a=i*Math.PI/3,bar=mesh(root,geos.spar,mats.iron,Math.cos(a)*.135,1.94,Math.sin(a)*.135);bar.rotation.z=Math.cos(a)*.22;bar.rotation.x=-Math.sin(a)*.22;}
 for(let i=0;i<4;i++){const a=i*Math.PI/2+.4,coal=mesh(root,geos.coal,mats.coals,Math.cos(a)*.06,2.03,Math.sin(a)*.06);coal.scale.set(.9,.6,.85);}
 const flame=new T.Group();flame.position.set(0,2.05,0);root.add(flame);
 mesh(flame,bigFlames.outer,mats.outer,0,0,0);
 mesh(flame,bigFlames.left,mats.outer,-.05,0,.02);
 mesh(flame,bigFlames.right,mats.middle,.05,0,-.02);
 mesh(flame,bigFlames.core,mats.core,0,0,.01);
 const sparks=[];
 for(let i=0;i<5;i++){const sp=new T.Mesh(torchGeos.spark,gm?.spark||mats.core);sp.userData.seed=i*1.37;flame.add(sp);sparks.push(sp);}
 let halo=null,pool=null;
 if(gm){
  halo=new T.Sprite(gm.glow);halo.position.set(0,2.32,0);halo.scale.set(1.6,1.9,1);root.add(halo);
  pool=new T.Mesh(torchGeos.pool,gm.pool);pool.position.set(0,.04,0);pool.scale.set(7,1,7);pool.renderOrder=3;root.add(pool);
 }else{halo=mesh(root,geos.glow,mats.halo,0,2.3,0);}
 const light=withLight?new T.PointLight('#ffab50',0,TORCH_LIGHT_V250.distance,2):null;
 if(light){light.position.y=2.3;light.castShadow=false;root.add(light);}
 return {root,flame,halo,light,pool,sparks};
}
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
export function createCityTorchesV235(buildings,heightAt){
 const group=new T.Group();group.name='V236 door torches';
 const locations=torchLocationsV235(buildings),models=[];
 locations.forEach((p,i)=>{
  const model=torchModel(i<TORCH_LIGHT_V250.count);
  model.root.position.set(p.x,(Number(heightAt(p.x,p.z))||0)+.035,p.z);
  model.root.rotation.y=p.angle;
  group.add(model.root);models.push(model);
 });
 group.userData.torchModelsV235=models;
 return group;
}
export function updateCityTorchesV235(group,clock,elapsed=0){
 if(!group?.userData?.torchModelsV235)return;
 const power=clock?.torch??0,visible=power>.04;
 for(const [i,o] of group.userData.torchModelsV235.entries()){
  o.flame.visible=visible;if(o.halo)o.halo.visible=visible;if(o.pool)o.pool.visible=visible;
  if(visible){
   const w=Math.sin(elapsed*10+i*3.7)*.11+Math.sin(elapsed*15+i*2.1)*.075+Math.sin(elapsed*23+i)*.03;
   o.flame.rotation.z=w*.23;o.flame.scale.set(1+w,.93+w*.45,1+w*.4);
   if(o.halo)o.halo.scale.set((1.6+w*.25)*(.7+.3*power),(1.9+w*.3)*(.7+.3*power),1);
   if(o.pool){const k=(6.6+w*1.2)*(.6+.4*power);o.pool.scale.set(k,1,k);o.pool.material.opacity=.9;}
   for(const sp of o.sparks||[]){const t=(elapsed*.9+sp.userData.seed)%1;sp.position.set(Math.sin(sp.userData.seed*5+elapsed)*.08*(1+t),.25+t*.75,Math.cos(sp.userData.seed*3+elapsed)*.08*(1+t));sp.scale.setScalar(1-t*.8);}
  }
  if(o.light)o.light.intensity=visible?TORCH_LIGHT_V250.intensity*power*(.95+.05*Math.sin(elapsed*9+i)):0;
 }
}
