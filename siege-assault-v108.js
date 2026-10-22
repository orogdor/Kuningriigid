import {craftError} from './era-availability-v116.js?v=116a';
import {siegeDamage} from './medieval-v62.js?v=116a';
// V108: battlefield carpentry, wall-scaling access, and occupation-based capture.
// Durations are wall-clock seconds (battle simulation runs at half speed).
import {troopRole} from './military-v88.js?v=116a';
export const SIEGE_CRAFT=Object.freeze({
 ladder:Object.freeze({name:'Redel',wood:18,duration:30,speed:2.6,lane:2.8}),
 tower:Object.freeze({name:'Lükatav piiramistorn',wood:75,duration:120,speed:1.15,lane:5.8}),
 ram:Object.freeze({name:'Kaetud müürilõhkuja',wood:55,duration:90,speed:1,lane:0}),
 sap:Object.freeze({name:'Müüri õõnestamine',wood:30,duration:60,speed:1.5,lane:0}),
 camp:Object.freeze({name:'Piiramislaager',wood:80,duration:60,speed:0,lane:0})
});
const len=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const siegeBuilder=u=>!!u&&u.hp>0&&!u.retreated&&!u.reserve&&!u.guardPost&&!u.routing&&!u.civilian&&
  ['melee','ranged'].includes(troopRole(u.kind))&&!['scout','militia'].includes(u.kind);
export function availableSiegeWood(state,team){
 return (state?.cities||[]).filter(c=>c.team===team).reduce((total,c)=>total+Math.max(0,c.economy?.realms?.[team]?.resources?.wood||0),0);
}
export function startSiegeCraft(b,u,kind,state,nav=null){
 const eraError=craftError(state,u?.team,kind);if(eraError)return {error:eraError};
 const spec=SIEGE_CRAFT[kind];if(!spec)return {error:'Tundmatu piiramisvahend.'};
 if(!b?.fortress||b.fortress.hp<=0||b.result)return {error:'Piiramisvahendit saab ehitada ainult vaenlase kindlustatud linna piiramisel.'};
 if(!siegeBuilder(u)||u.team===b.fortress.team)return {error:'Vali elus jalaväe- või vibuküttide salk.'};
 if(u.siegeBuildingId!=null&&(b.siegeWorks||[]).some(w=>w.id===u.siegeBuildingId&&!w.destroyed))return {error:'Salk ehitab juba piiramisvahendit.'};
 const sections=(b.siegeSections||[]).filter(w=>w.hp>0&&!w.breached&&w.team!==u.team&&(kind!=='ram'||['gatehouse','palisade'].includes(w.type)));
 if(!sections.length&&kind!=='camp')return {error:'Linnal pole tervet müüri, millele piiramisvahendit asetada.'};
 const wall=sections.reduce((a,w)=>!a||len(w,u)<len(a,u)?w:a,null)||b.fortress;
 const cities=(state?.cities||[]).filter(c=>c.team===u.team&&c.economy?.realms?.[u.team]?.resources?.wood>=spec.wood)
  .sort((a,c)=>Math.hypot(a.c-b.cell.c,a.r-b.cell.r)-Math.hypot(c.c-b.cell.c,c.r-b.cell.r));
 const city=cities[0];if(!city)return {error:'Vaja '+spec.wood+' puitu mõne ründaja linna laost. Praegu kokku: '+availableSiegeWood(state,u.team)+'.'};
 if(kind==='camp'&&(b.siegeWorks||[]).some(w=>w.kind==='camp'&&w.team===u.team&&!w.destroyed))return {error:'Sinu armeel on siin piiramislaager juba olemas.'};
 let campPoint=null;if(kind==='camp'){const dx=u.x-b.fortress.x,dz=u.z-b.fortress.z,d=Math.hypot(dx,dz)||1;const back={x:u.x+dx/d*14,z:u.z+dz/d*14};campPoint=nav?.nearest(back,12)||back;if(len(campPoint,b.fortress)<35)return {error:'Piiramislaager tuleb ehitada väljapoole linnasüdant.'};}
 const stock=city.economy.realms[u.team].resources;stock.wood-=spec.wood;
 b.siegeWorks??=[];const id=(b.nextSiegeWorkId??0)+1;b.nextSiegeWorkId=id;
 const dx=u.x-wall.x,dz=u.z-wall.z,d=Math.hypot(dx,dz)||1;
 const w={id,kind,height:wall.height||3.8,hp:kind==='tower'?300:kind==='ram'?240:100,maxHp:kind==='tower'?300:kind==='ram'?240:100,team:u.team,ownerSource:u.source,wallIndex:wall.index,woodCost:spec.wood,
  duration:spec.duration,progress:0,ready:false,arrived:false,
  x:u.x,z:u.z,wallX:wall.x,wallZ:wall.z,supplyCityId:city.id,
  inwardX:-dx/d,inwardZ:-dz/d,startedAt:b.elapsed||0};
 if(kind==='camp'){
  w.x=campPoint.x;w.z=campPoint.z;w.hp=w.maxHp=600;w.stones=0;w.produced=0;w.productionSeconds=0;
 }
 b.siegeWorks.push(w);u.siegeBuildingId=id;u.attackTargetSource=null;u.manualOrder=false;u.target=null;u.anchor={x:u.x,z:u.z};
 return {ok:true,work:w,woodRemaining:stock.wood};
}
export function workForSquad(b,u){return (b.siegeWorks||[]).find(w=>w.ownerSource===u.source&&w.team===u.team&&w.ready&&w.arrived&&!w.destroyed&&['ladder','tower'].includes(w.kind))||null;}
export function assaultLaneAt(b,x,z,section){
 return (b?.siegeWorks||[]).some(w=>['ladder','tower'].includes(w.kind)&&w.ready&&w.arrived&&!w.destroyed&&section?.index===w.wallIndex&&
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
  if(work.kind==='camp'){
   if(work.ready)continue;
   const actor=b.squads.find(u=>u.source===work.ownerSource&&u.team===work.team);
   if(!actor||actor.hp<=0||actor.retreated||actor.routing){work.destroyed=true;if(actor)actor.siegeBuildingId=null;continue;}
   actor.anchor={x:work.x,z:work.z};
   if((actor.men||[]).some(m=>m.hp>0&&!m.escaped&&len(m,work)<10))work.progress=Math.min(work.duration,work.progress+dt*2);
   if(work.progress>=work.duration-1e-6){work.progress=work.duration;work.ready=true;work.arrived=true;actor.siegeBuildingId=null;}
   continue;
  }
  const wall=b.siegeSections?.find(w=>w.index===work.wallIndex);if(!wall||wall.breached||wall.hp<=0){work.destroyed=true;const owner=b.squads.find(u=>u.source===work.ownerSource);if(owner)owner.siegeBuildingId=null;continue;}
  const actor=b.squads.find(u=>u.source===work.ownerSource&&u.team===work.team);
  const spec=SIEGE_CRAFT[work.kind];
  if(work.arrived&&['ladder','tower'].includes(work.kind))continue;
  if(!actor||actor.hp<=0||actor.retreated||actor.routing){work.destroyed=true;if(actor)actor.siegeBuildingId=null;continue;}
  if(work.arrived){
   actor.siegeBuildingId=work.id;actor.anchor={x:work.wallX-work.inwardX*5,z:work.wallZ-work.inwardZ*5};
   const crew=(actor.men||[]).filter(m=>m.hp>0&&!m.escaped&&len(m,work)<12);
   const contested=b.squads.some(u=>u.team!==work.team&&!u.guardPost&&u.hp>0&&!u.routing&&len(u,work)<9);
   if(crew.length<4||contested)continue;
   // In reach, defenders can sabotage timber equipment. Crew remains exposed to arrows.
   const guards=b.squads.filter(u=>u.team!==work.team&&u.guardPost&&u.hp>0&&len(u,work)<8);
   work.hp-=guards.length*dt*.8;if(work.hp<=0){work.destroyed=true;actor.siegeBuildingId=null;continue;}
   if(work.kind==='ram'){work.hitTimer=(work.hitTimer||0)+dt;if(work.hitTimer>=3){work.hitTimer-=3;siegeDamage({kind:'battering_ram'},wall,28*Math.min(1,crew.length/12));}}
   if(work.kind==='sap'){work.excavated=(work.excavated||0)+dt*Math.min(1,crew.length/12);if(work.excavated>=120*(wall.type==='reinforced_wall'?2:1)){wall.hp=0;wall.breached=true;}}
   if(wall.hp<=0){wall.breached=true;b.siegeBreached=true;b.breachAt={x:wall.x,z:wall.z};actor.siegeBuildingId=null;work.destroyed=true;nav?.rebuildSiegeAccess?.();}
   continue;
  }
  if(!work.ready){
   work.progress=Math.min(spec.duration,work.progress+dt*2); // battleDelta = real seconds / 2
   if(work.progress>=spec.duration-1e-6){work.progress=spec.duration;work.ready=true;}
   continue;
  }
  if(!work.arrived){
   const dock={x:work.wallX-work.inwardX*6,z:work.wallZ-work.inwardZ*6};
   const target=len(work,dock)>7?(nav?.waypoint?.(work,dock,b.elapsed)||dock):{x:work.wallX,z:work.wallZ},distance=len(work,target),speed=spec.speed*dt*2;
   if(distance<=speed+.3){work.x=target.x;work.z=target.z;if(len(work,wall)<.5){work.arrived=true;actor.siegeBuildingId=['ram','sap'].includes(work.kind)?work.id:null;nav?.rebuildSiegeAccess?.();}}
   else{work.x+=(target.x-work.x)/distance*speed;work.z+=(target.z-work.z)/distance*speed;}
   const follow={x:work.x-work.inwardX*6,z:work.z-work.inwardZ*6};actor.anchor=nav?.nearest(follow,9)||follow;
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

export function planSiegeAI(b,state,nav=null){
 if(!b?.fortress||b.result||!state)return;
 if((b.elapsed||0)<(b.nextSiegePlan||5))return;b.nextSiegePlan=(b.elapsed||0)+12;
 for(const team of [...new Set(b.squads.map(u=>u.team))]){
  if(team===b.fortress.team)continue;
  const works=(b.siegeWorks||[]).filter(w=>w.team===team&&!w.destroyed);
  if(works.filter(w=>!w.arrived).length>=2)continue;
  const builders=b.squads.filter(u=>u.team===team&&siegeBuilder(u)&&(u.combatMode??'auto')==='auto'&&u.siegeBuildingId==null&&!u.resupplyCamp&&!u.wallClimb&&!u.manualOrder&&u.attackTargetSource==null);
  // Keep archers supporting the assault when available infantry can build.
  let u=builders.sort((a,c)=>(troopRole(a.kind)==='ranged')-(troopRole(c.kind)==='ranged')||len(a,b.fortress)-len(c,b.fortress))[0];if(!u)continue;
  const ranged=b.squads.some(u=>u.team===team&&u.hp>0&&['ranged','siege'].includes(troopRole(u.kind)));
  const sections=(b.siegeSections||[]).filter(w=>w.hp>0&&!w.breached&&w.team!==team);
  const wanted=[];
  if(ranged&&!works.some(w=>w.kind==='camp'))wanted.push('camp');
  if(sections.length&&!works.some(w=>w.kind==='ladder'))wanted.push('ladder');
  if(sections.some(w=>['gatehouse','palisade'].includes(w.type))&&!works.some(w=>w.kind==='ram'))wanted.push('ram');
  if(sections.some(w=>(w.height||0)>4)&&!works.some(w=>w.kind==='tower'))wanted.push('tower');
  if(sections.length&&!works.some(w=>w.kind==='sap'))wanted.push('sap');
  const kind=wanted.find(kind=>!craftError(state,team,kind)&&(state.cities||[]).some(c=>c.team===team&&(c.economy?.realms?.[team]?.resources?.wood||0)>=SIEGE_CRAFT[kind].wood));
  if(kind==='camp')u=builders.sort((a,c)=>(troopRole(a.kind)==='ranged')-(troopRole(c.kind)==='ranged')||len(c,b.fortress)-len(a,b.fortress))[0];
  if(kind)startSiegeCraft(b,u,kind,state,nav);
 }
}
