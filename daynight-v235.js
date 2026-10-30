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

const timber=new T.MeshStandardMaterial({color:'#493322',roughness:1});
const fiber=new T.MeshStandardMaterial({color:'#9a8057',roughness:1});
const iron=new T.MeshStandardMaterial({color:'#39352d',roughness:.85});
const flameMat=new T.MeshBasicMaterial({color:'#ffa53c',transparent:true,opacity:.96,depthWrite:false});
const glowMat=new T.MeshBasicMaterial({color:'#ffbf63',transparent:true,opacity:.19,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});
const postGeo=new T.CylinderGeometry(.045,.065,1.88,7);
const wrappingGeo=new T.TorusGeometry(.061,.008,4,10);
const cupGeo=new T.CylinderGeometry(.115,.07,.24,9);
const flameGeo=new T.ConeGeometry(.095,.31,7);
const glowGeo=new T.SphereGeometry(.22,8,6);
for(const g of [postGeo,wrappingGeo,cupGeo,flameGeo,glowGeo])g.userData.shared=true;
function torchModel(withLight=false){
 const root=new T.Group();root.name='V235 city torch';
 const shaft=new T.Mesh(postGeo,timber);shaft.position.y=.94;shaft.castShadow=true;root.add(shaft);
 for(const y of [1.73,1.83]){
  const ring=new T.Mesh(wrappingGeo,fiber);ring.position.y=y;ring.rotation.x=Math.PI/2;root.add(ring);
 }
 const top=new T.Mesh(cupGeo,iron);top.position.y=1.91;top.castShadow=true;root.add(top);
 const flame=new T.Mesh(flameGeo,flameMat);flame.position.y=2.17;root.add(flame);
 const halo=new T.Mesh(glowGeo,glowMat);halo.position.y=2.15;root.add(halo);
 const light=withLight?new T.PointLight('#ffad52',0,17,2):null;
 if(light){light.position.y=2.15;light.castShadow=false;root.add(light);}
 return {root,flame,halo,light};
}
const TORCH_TYPES=new Set(['hall','house','market','tavern','barracks','warehouse','well','farm','lumber','quarry','mason','pottery_kiln','watchtower','stonetower','woodgate','gatehouse','harbor','port','library','school','study','workshop','blacksmith','baker','mill']);
export function torchLocationsV235(buildings=[]){
 const sites=[];
 for(const b of buildings){
  if(!b||b.virtual||b.hp<=0||b.ready===false||!TORCH_TYPES.has(b.type))continue;
  if(!Number.isFinite(b.x)||!Number.isFinite(b.z))continue;
  const i=sites.length;
  const a=i*2.399963229728653;
  const radius=['hall','woodgate','gatehouse','watchtower','stonetower'].includes(b.type)?4.0:3.2;
  const x=b.x+Math.cos(a)*radius,z=b.z+Math.sin(a)*radius;
  if(sites.some(p=>Math.hypot(p.x-x,p.z-z)<3.9))continue;
  sites.push({x,z,kind:b.type});
  if(sites.length>=22)break;
 }
 return sites;
}
export function createCityTorchesV235(buildings,heightAt){
 const group=new T.Group();group.name='V235 town street torches';
 const locations=torchLocationsV235(buildings);
 const models=[];
 locations.forEach((p,i)=>{
  const model=torchModel(i<4);
  model.root.position.set(p.x,(Number(heightAt(p.x,p.z))||0)+.05,p.z);
  group.add(model.root);
  models.push(model);
 });
 group.userData.torchModelsV235=models;
 return group;
}
export function updateCityTorchesV235(group,clock,elapsed=0){
 if(!group?.userData?.torchModelsV235)return;
 const power=clock?.torch??0,visible=power>.04;
 const objects=group.userData.torchModelsV235;
 for(let i=0;i<objects.length;i++){
  const o=objects[i];o.flame.visible=visible;o.halo.visible=visible;
  if(visible){
   const w=Math.sin(elapsed*10+i*3.7)*.13+Math.sin(elapsed*15+i*2.1)*.07;
   o.flame.scale.set(.9+w,1+w*.4,.9+w);
   o.halo.scale.setScalar(.88+w*.35);
  }
  if(o.light)o.light.intensity=visible?1.65*power*(.94+.06*Math.sin(elapsed*9+i)):0;
 }
}
