// V108: battlefield carpentry, wall-scaling access, and occupation-based capture.
// Durations are wall-clock seconds (battle simulation runs at half speed).
import {troopRole} from './military-v88.js';
export const SIEGE_CRAFT=Object.freeze({
 ladder:Object.freeze({name:'Redel',wood:18,duration:30,speed:2.6,lane:2.8}),
 tower:Object.freeze({name:'Lükatav piiramistorn',wood:75,duration:120,speed:1.15,lane:5.8})
});
const len=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const siegeBuilder=u=>!!u&&u.hp>0&&!u.retreated&&!u.reserve&&!u.guardPost&&!u.routing&&!u.civilian&&
  ['melee','ranged'].includes(troopRole(u.kind))&&!['scout','militia'].includes(u.kind);
export function availableSiegeWood(state,team){
 return (state?.cities||[]).filter(c=>c.team===team).reduce((total,c)=>total+Math.max(0,c.economy?.realms?.[team]?.resources?.wood||0),0);
}
export function startSiegeCraft(b,u,kind,state){
 const spec=SIEGE_CRAFT[kind];if(!spec)return {error:'Tundmatu piiramisvahend.'};
 if(!b?.fortress||b.fortress.hp<=0||b.result)return {error:'Piiramisvahendit saab ehitada ainult vaenlase kindlustatud linna piiramisel.'};
 if(!siegeBuilder(u)||u.team===b.fortress.team)return {error:'Vali elus jalaväe- või vibuküttide salk.'};
 if(u.siegeBuildingId!=null&&(b.siegeWorks||[]).some(w=>w.id===u.siegeBuildingId&&!w.ready))return {error:'Salk ehitab juba piiramisvahendit.'};
 const sections=(b.siegeSections||[]).filter(w=>w.hp>0&&!w.breached&&w.team!==u.team);
 if(!sections.length)return {error:'Linnal pole tervet müüri, millele piiramisvahendit asetada.'};
 const wall=sections.reduce((a,w)=>!a||len(w,u)<len(a,u)?w:a,null);
 const cities=(state?.cities||[]).filter(c=>c.team===u.team&&c.economy?.realms?.[u.team]?.resources?.wood>=spec.wood)
  .sort((a,c)=>Math.hypot(a.c-b.cell.c,a.r-b.cell.r)-Math.hypot(c.c-b.cell.c,c.r-b.cell.r));
 const city=cities[0];if(!city)return {error:'Vaja '+spec.wood+' puitu mõne ründaja linna laost. Praegu kokku: '+availableSiegeWood(state,u.team)+'.'};
 const stock=city.economy.realms[u.team].resources;stock.wood-=spec.wood;
 b.siegeWorks??=[];const id=(b.nextSiegeWorkId??0)+1;b.nextSiegeWorkId=id;
 const dx=u.x-wall.x,dz=u.z-wall.z,d=Math.hypot(dx,dz)||1;
 const w={id,kind,team:u.team,ownerSource:u.source,wallIndex:wall.index,woodCost:spec.wood,
  duration:spec.duration,progress:0,ready:false,arrived:false,
  x:wall.x+dx/d*10,z:wall.z+dz/d*10,wallX:wall.x,wallZ:wall.z,supplyCityId:city.id,
  inwardX:-dx/d,inwardZ:-dz/d,startedAt:b.elapsed||0};
 b.siegeWorks.push(w);u.siegeBuildingId=id;u.attackTargetSource=null;u.manualOrder=false;u.target=null;u.anchor={x:u.x,z:u.z};
 return {ok:true,work:w,woodRemaining:stock.wood};
}
export function workForSquad(b,u){return (b.siegeWorks||[]).find(w=>w.ownerSource===u.source&&w.team===u.team&&w.ready&&w.arrived&&!w.destroyed)||null;}
export function assaultLaneAt(b,x,z,section){
 return (b?.siegeWorks||[]).some(w=>w.ready&&w.arrived&&!w.destroyed&&section?.index===w.wallIndex&&
  len({x,z},{x:w.wallX,z:w.wallZ})<(SIEGE_CRAFT[w.kind]?.lane||2.8));
}
export function siegeAssaultGoal(b,u){
 const work=workForSquad(b,u);if(!work||u.manualOrder||u.routing)return null;
 const dx=work.inwardX,dz=work.inwardZ,progress=(u.x-work.wallX)*dx+(u.z-work.wallZ)*dz;
 if(progress>7)return null;
 return {x:work.wallX+dx*11,z:work.wallZ+dz*11};
}
export function tickSiegeCraft(b,dt,nav=null){
 if(!b?.siegeWorks?.length||b.result)return;
 for(const work of b.siegeWorks){
  if(work.destroyed)continue;
  const actor=b.squads.find(u=>u.source===work.ownerSource&&u.team===work.team);
  const spec=SIEGE_CRAFT[work.kind];
  if(!actor||actor.hp<=0||actor.retreated||actor.routing){work.destroyed=true;if(actor)actor.siegeBuildingId=null;continue;}
  if(!work.ready){
   work.progress=Math.min(spec.duration,work.progress+dt*2); // battleDelta = real seconds / 2
   if(work.progress>=spec.duration-1e-6){work.progress=spec.duration;work.ready=true;actor.siegeBuildingId=null;}
   continue;
  }
  if(!work.arrived){
   const target={x:work.wallX,z:work.wallZ},distance=len(work,target),speed=spec.speed*dt*2;
   if(distance<=speed+.3){work.x=target.x;work.z=target.z;work.arrived=true;nav?.rebuildSiegeAccess?.();}
   else{work.x+=(target.x-work.x)/distance*speed;work.z+=(target.z-work.z)/distance*speed;}
  }
 }
}
export function siegeOccupation(b,dt){
 if(!b?.fortress||b.result||b.fortress.hp<=0)return;
 const defenders=b.squads.filter(u=>u.team===b.fortress.team&&u.hp>0&&!u.retreated&&!u.routing&&!u.reserve);
 const attackers=b.squads.filter(u=>u.team!==b.fortress.team&&u.hp>0&&!u.retreated&&!u.routing&&!u.reserve&&!u.guardPost);
 const inside=attackers.filter(u=>len(u,b.fortress)<12&&u.men?.some(m=>m.hp>0&&!m.escaped&&len(m,b.fortress)<12));
 const resistance=defenders.some(u=>len(u,b.fortress)<22);
 if(inside.length&&!resistance){
  b.fortress.hp=Math.max(0,b.fortress.hp-dt*38*Math.min(3,inside.length));
  b.siegeOccupiedAt??=b.elapsed;
 }else b.siegeOccupiedAt=null;
}
export const fortifiedBowRange=(kind,guardPost,base)=>guardPost&&['archer','bronze_archer','iron_archer','crossbowman'].includes(kind)?base*1.25:base;
