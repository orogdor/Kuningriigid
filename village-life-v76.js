// V76: peaceful civilian life for neutral villages and founded cities.
// Visual-only citizens use existing V50 character rigs; no save-schema,
// economy, population, pathfinding or combat changes are necessary.
import * as T from './vendor/three.module.js';
import {createSoldier,animateSoldier} from './visuals.js';

// One game minute represents one village clock hour. Start new games in morning.
export const VILLAGE_DAY_SECONDS=24*60;
export const villageHour=time=>((8+(Number(time)||0)/60)%24+24)%24;
export function villagePeriod(time){
 const h=villageHour(time);
 return h>=21||h<6?'night':h<9?'morning':h<17?'day':'evening';
}
const HOME=[[-15,-15],[14,-16],[0,16],[-17,13],[17,12],[-9,18],[19,-3],[-21,0],[9,-17],[5,19]];
const bound=(n,a,b)=>Math.max(a,Math.min(b,n));
const hash=s=>{let n=2166136261;for(const c of String(s)){n=Math.imul(n^c.charCodeAt(0),16777619)}return n>>>0};
export const villageVisualLimit=(quality,nearby=false)=>nearby?(quality==='low'?1:quality==='high'?3:2):(quality==='low'?4:quality==='high'?9:6);

// Deterministic decisions based on the campaign clock, not a random walk that
// changes on every frame. People share real destinations when they socialise.
export function villageActivity(id,index,time,threat=false){
 if(threat)return 'panic';
 const h=villageHour(time),period=villagePeriod(time);
 if(index===0)return period==='night'?'guard':'patrol';
 if(period==='night')return index===1?'guard':'sleep';
 if(index===3)return period==='evening'?'eat':(Math.floor((time+index*13)/17)%4===0?'rest':'play');
 const slot=Math.floor(((time||0)+index*8+(hash(id)%19))/34);
 if(period==='evening'){
  if(index===1||index===2)return slot%4===0?'eat':'chat';
  return ['sit','eat','chat','rest','visit'][((slot+index)%5)];
 }
 if(period==='morning'){
  if(index===1||index===2)return 'visit';
  return ['carry','stroll','eat','rest'][((slot+index)%4)];
 }
 if((index===1||index===2)&&slot%3!==1)return 'chat';
 return ['stroll','rest','carry','visit','work','eat','sit','chat'][((slot+index+hash(id)%7)%8)];
}
function home(i){const a=HOME[i%HOME.length];return {x:a[0],z:a[1]}}
export function villageDestination(id,i,activity,time){
 const seed=hash(id),h=home(i),phase=((time||0)+i*7)/11;
 switch(activity){
  case 'sleep':case 'home':return h;
  case 'chat':return {x:26+(i%2?-.9:.9),z:-5+(i%2?-.8:.8)};
  case 'sit':case 'rest':return {x:-7+(i%3)*7,z:25};
  case 'eat':return {x:3+(i%4-1.5)*2.2,z:25};
  case 'carry':return {x:(i%2?-31:31),z:10+(i%3)*5};
  case 'work':return {x:-29+(i%3)*3,z:-11};
  case 'visit':return {x:(i%2?-22:22),z:-6+(i%4)*4};
  case 'play':return {x:-20+9*Math.sin(phase),z:31+5*Math.cos(phase*.75)};
  case 'patrol':case 'guard':return {x:32*Math.cos(phase*.25),z:27*Math.sin(phase*.25)};
  case 'panic':return {x:bound(h.x*1.8,-49,49),z:bound(h.z*1.8,-46,46)};
  case 'celebrate':return {x:(i-3)*2.7,z:24};
  default:return {x:28*Math.cos(seed%11+phase*.35),z:24*Math.sin(seed%11+phase*.35)};
 }
}
export function villageInDanger(game,tile,claimedBy=null){
 if(game.s.battle&&!game.s.battle.result&&game.s.battle.cell?.c===tile.c&&game.s.battle.cell?.r===tile.r)return true;
 return (game.s.armies||[]).some(a=>a.team!==0&&a.team!==claimedBy&&a.c===tile.c&&a.r===tile.r&&a.hp!==0);
}

const sharedGeo={
 bench:new T.BoxGeometry(5,.6,1.2),
 post:new T.BoxGeometry(.4,1.3,.4),
 fire:new T.ConeGeometry(.95,2.1,5),
 stone:new T.CylinderGeometry(2.5,2.5,.35,8),
 wood:new T.CylinderGeometry(.22,.27,3.5,6),
 basket:new T.SphereGeometry(.37,7,4),
 smoke:new T.SphereGeometry(.75,7,4)
};
const sharedMat={
 bench:new T.MeshStandardMaterial({color:'#806142',roughness:1}),
 fire:new T.MeshBasicMaterial({color:'#f8a342'}),
 stone:new T.MeshStandardMaterial({color:'#76685b',roughness:1}),
 wood:new T.MeshStandardMaterial({color:'#5b3e23',roughness:1}),
 basket:new T.MeshStandardMaterial({color:'#d2b079',roughness:1}),
 smoke:new T.MeshBasicMaterial({color:'#b3b0a7',transparent:true,opacity:.24,depthWrite:false})
};
function mesh(kind,parent,x,y,z){
 const model=new T.Mesh(sharedGeo[kind],sharedMat[kind]);model.position.set(x,y,z);parent.add(model);return model;
}
function makeCamp(centerHeight){
 const group=new T.Group();group.name='V76 village gathering place';
 group.position.set(0,centerHeight(0,25),25);
 for(const x of [-8,8]){
  mesh('bench',group,x,.72,-4);
  for(const off of [-2,2])mesh('post',group,x+off,.3,-4);
 }
 mesh('stone',group,0,.1,0);
 const log1=mesh('wood',group,0,.55,0);log1.rotation.z=Math.PI/2;
 const log2=mesh('wood',group,0,.55,0);log2.rotation.x=Math.PI/2;
 const flame=mesh('fire',group,0,1.2,0);flame.name='V76 fire flame';
 const smoke=mesh('smoke',group,0,2.3,0);smoke.name='V76 fire smoke';
 group.userData.flame=flame;group.userData.smoke=smoke;return group;
}
function dress(figure,role){
 // V50 model rigs remain identical; a smaller scale is enough for children.
 if(role==='child')figure.scale.setScalar(.69);
 else if(role==='guard')figure.scale.setScalar(1.03);
 else figure.scale.setScalar(.94);
}
function makePerson(group,site,index,ground){
 const role=index===0?'guard':index===3?'child':'resident';
 const person=new T.Group();person.name='V76 '+role+' '+site.id+':'+index;
 person.userData.villagePerson=true;person.userData.role=role;person.userData.site=site.id;
 const figure=createSoldier(person,0,0,role==='guard'?'#a9875d':role==='child'?'#c5a87d':'#a8b38b',role==='guard'?'spearman':'villager');
 dress(figure,role);
 const basket=mesh('basket',person,.4,1,.32);basket.visible=false;
 const p=home(index);person.position.set(p.x,ground(p.x,p.z),p.z);group.add(person);
 return {index,role,person,figure,basket,x:p.x,z:p.z,activity:'home',moving:false};
}
function animateActivity(actor,time,moving){
 const {figure,activity}=actor,rig=figure.userData.rig;
 animateSoldier(figure,time,moving,{phase:-1,action:activity==='work'?'build':activity==='carry'?'water':null});
 actor.basket.visible=activity==='carry';
 if(!rig)return;
 if(!moving){
  if(['sit','rest','eat'].includes(activity)){
   figure.position.y=-.42;
   for(const leg of rig.legs)leg.rotation.x=-.8;
   rig.body.rotation.x=-.08;
   if(activity==='eat')rig.arms[0].rotation.x=-1.45;
  }else if(activity==='chat'){
   rig.arms[actor.index%2].rotation.x=-.35+.32*Math.sin(time*2+actor.index);
   rig.head.rotation.y=(actor.index%2?-.22:.22);
  }else if(activity==='play'||activity==='celebrate'){
   figure.position.y=.16+Math.max(0,Math.sin(time*5+actor.index))*.22;
   rig.arms[0].rotation.x=-1.1+Math.sin(time*4)*.3;
   rig.arms[1].rotation.x=-1.2-Math.sin(time*4)*.3;
  }else if(activity==='panic'){
   rig.arms[0].rotation.x=-.65;rig.arms[1].rotation.x=-.65;
  }
 }
 if(!['sit','rest','eat','play','celebrate'].includes(activity))figure.position.y=0;
}
export function createVillageLife(game,groundForTile,{quality=()=> 'medium'}={}){
 const sites=new Map();
 function discover(tile){
  if(!game.seen(0,tile))return null;
  const city=game.s.cities.find(c=>c.c===tile.c&&c.r===tile.r&&c.districtOf==null);
  if(city)return {id:'city:'+city.id,tile,kind:'city',claimedBy:city.team};
  const landmark=game.s.landmarks?.find(l=>l.c===tile.c&&l.r===tile.r&&l.kind==='village');
  return landmark?{id:'landmark:'+landmark.id,tile,kind:'village',claimedBy:landmark.claimedBy}:null;
 }
 function show(tile,parent,{nearby=false}={}){
  const site=discover(tile),key=tile.c+':'+tile.r;
  if(!site){if(sites.has(key)){sites.get(key).group.removeFromParent();sites.delete(key)}return null}
  const targetCount=villageVisualLimit(quality(),nearby);
  let entry=sites.get(key);
  if(entry&&entry.id===site.id&&entry.count===targetCount&&entry.parent===parent){entry.site=site;return entry;}
  if(entry){entry.group.removeFromParent();sites.delete(key)}
  const group=new T.Group();group.name='V76 civilian life '+site.id;
  group.userData.villageLife=true;parent.add(group);
  const ground=(x,z)=>groundForTile(tile,x,z);
  const actors=Array.from({length:targetCount},(_,i)=>makePerson(group,site,i,ground));
  const camp=nearby?null:makeCamp(ground);if(camp)group.add(camp);
  entry={id:site.id,site,group,parent,actors,count:targetCount,nearby,ground};
  sites.set(key,entry);return entry;
 }
 function update(time=game.s.time,dt=0){
  for(const entry of sites.values()){
   const {site,actors,camp,ground}=entry,threat=villageInDanger(game,site.tile,site.claimedBy);
   const night=villagePeriod(time)==='night',evening=villagePeriod(time)==='evening';
   if(camp){const lit=evening||night;camp.userData.flame.visible=lit;camp.userData.smoke.visible=lit;
    if(lit){camp.userData.flame.scale.y=1+.13*Math.sin(time*5);
     camp.userData.smoke.position.y=2.3+Math.sin(time*.9)*.35;}
   }
   for(const actor of actors){
    const activity=villageActivity(site.id,actor.index,time,threat);
    actor.activity=activity;actor.person.userData.activity=activity;
    const dest=villageDestination(site.id,actor.index,activity,time);
    const dx=dest.x-actor.x,dz=dest.z-actor.z,d=Math.hypot(dx,dz);
    // The visible NPCs are decorative. No collision/pushing into nav paths and
    // no real worker/population counts are affected by these visual journeys.
    const speed=activity==='panic'?5.5:activity==='play'?3:activity==='patrol'?1.8:2.1;
    const travel=Math.min(d,Math.min(.2,Math.max(0,dt))*speed);
    if(d>.22&&travel>0){actor.x+=dx/d*travel;actor.z+=dz/d*travel;}
    actor.moving=d>.35;
    actor.person.visible=!(activity==='sleep'&&d<.8);
    actor.person.position.set(actor.x,ground(actor.x,actor.z),actor.z);
    if(d>.1)actor.person.rotation.y=Math.atan2(dx,dz);
    if(activity==='chat'&&d<=.4)actor.person.rotation.y=actor.index%2?Math.PI/2:-Math.PI/2;
    animateActivity(actor,time,actor.moving);
   }
  }
 }
 function clear(){for(const e of sites.values())e.group.removeFromParent();sites.clear()}
 function stats(){return [...sites.values()].map(e=>({id:e.id,c:e.site.tile.c,r:e.site.tile.r,nearby:e.nearby,
  actorCount:e.actors.length,roles:e.actors.map(a=>a.role),activities:e.actors.map(a=>a.activity),
  visible:e.actors.filter(a=>a.person.visible).length,
  campVisible:!!e.group.children.find(o=>o.name==='V76 village gathering place')?.userData.flame.visible}))}
 return {show,update,clear,stats,get count(){return sites.size}};
}
