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
function torchModel(withLight=false){
 const root=new T.Group();root.name='V236 entrance torch';
 mesh(root,geos.shaft,mats.wood,0,.92,0);
 mesh(root,geos.collar,mats.darkWood,0,1.79,0);
 for(const y of [1.68,1.74,1.81]){
  const braid=mesh(root,geos.cord,mats.wrap,0,y,0);braid.rotation.x=Math.PI/2;
 }
 mesh(root,geos.cup,mats.iron,0,1.92,0);
 const rim=mesh(root,geos.rim,mats.iron,0,2.043,0);rim.rotation.x=Math.PI/2;
 for(let i=0;i<5;i++){
  const a=i*Math.PI*2/5,bar=mesh(root,geos.spar,mats.iron,Math.cos(a)*.102,1.94,Math.sin(a)*.102);
  bar.rotation.z=Math.cos(a)*.13;bar.rotation.x=-Math.sin(a)*.13;
 }
 for(let i=0;i<3;i++){
  const a=i*Math.PI*2/3;const coal=mesh(root,geos.coal,mats.coals,Math.cos(a)*.043,2.05,Math.sin(a)*.04);
  coal.scale.set(.68,.48,.65);
 }
 const flame=new T.Group();flame.position.set(0,2.075,0);root.add(flame);
 mesh(flame,flames.orange,mats.outer,-.008,0,0);
 mesh(flame,flames.yellow,mats.middle,.015,0,.005);
 mesh(flame,flames.gold,mats.core,-.005,0,.017);
 const halo=mesh(root,geos.glow,mats.halo,0,2.22,0);halo.scale.set(1.0,1.35,1.0);
 const light=withLight?new T.PointLight('#ffab50',0,16,2):null;
 if(light){light.position.y=2.18;light.castShadow=false;root.add(light);}
 return {root,flame,halo,light};
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
  const model=torchModel(i<4);
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
  o.flame.visible=visible;o.halo.visible=visible;
  if(visible){
   const w=Math.sin(elapsed*10+i*3.7)*.11+Math.sin(elapsed*15+i*2.1)*.075;
   o.flame.rotation.z=w*.23;o.flame.scale.set(1+w,.93+w*.4,1+w*.4);
   o.halo.scale.set(1+w*.15,1.3+w*.25,1+w*.15);
  }
  if(o.light)o.light.intensity=visible?1.55*power*(.95+.05*Math.sin(elapsed*9+i)):0;
 }
}
