import {towerGuardKind} from './ai-development-v128.js';
// Five persistent individuals per completed tower. Simulation also runs in peace.
import {wallNodes,wallPath,wallRankPoint} from './wall-walk-v111.js?v=117a';
const d=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const tower=b=>['watchtower','stonetower'].includes(b.type);
export const towerRoof=b=>b.bronzeWall?6.4:b.type==='stonetower'?7.55:7.25;
export function towerSections(city){return city.economy.buildings.flatMap((t,index)=>tower(t)&&t.ready&&t.hp>0&&!t.disabled?[{index,type:t.type,tower:true,walkable:true,x:t.x,z:t.z,height:towerRoof(t),hp:t.hp,team:city.team}]:[]);}
export function addTowerGuards(city,state,b){
 b.siegeSections??=[];for(const w of towerSections(city))if(!b.siegeSections.some(n=>n.index===w.index))b.siegeSections.push(w);
 const age=state.ages[city.team]||0,kind=towerGuardKind(state,city.team);
 for(const t of towerSections(city)){
  const building=city.economy.buildings[t.index];
  if(building.guardOwner!==city.team){building.guardOwner=city.team;building.towerGuards=Array.from({length:5},(_,slot)=>({slot,hp:20,maxHp:20}));}
  for(const saved of building.towerGuards||[]){const source=-100000-t.index*5-saved.slot;if(b.squads.some(u=>u.source===source))continue;
   const x=saved.x??t.x+(saved.slot-2)*.8,z=saved.z??t.z;
   b.squads.push({source,team:city.team,kind,grade:'standard',menCount:1,hp:saved.hp,maxHp:saved.maxHp||20,morale:100,x,z,heading:0,cool:0,guardPost:true,wallWalk:true,wallType:'stonewall',wallElevation:saved.elevation??t.height,towerGuard:true,homeTower:t.index,guardSlot:saved.slot,patrolWait:saved.slot*2,combatMode:'auto',men:saved.hp>0?[{id:source+':0',index:0,x,z,hp:saved.hp,maxHp:saved.maxHp||20,radius:.34,elevation:saved.elevation??t.height,ammo:saved.ammo??40,arrowLoadVersion:100,cool:0,heading:0,kills:0,damageDealt:0}]:[]});
  }
 }
 b.towerGarrisonVersion=117;
}
export function persistTowerGuards(city,b){if(!city)return;for(const u of b.squads.filter(u=>u.towerGuard)){const building=city.economy.buildings[u.homeTower],saved=building?.towerGuards?.find(g=>g.slot===u.guardSlot);if(!saved)continue;const m=u.men?.[0];Object.assign(saved,{hp:m?.hp??u.hp,x:m?.x??u.x,z:m?.z??u.z,elevation:m?.elevation??u.wallElevation,ammo:m?.ammo??40});}}
export function approachSide(p,center){const x=p.x-center.x,z=p.z-center.z;return Math.abs(x)>Math.abs(z)?x>0?'east':'west':z>0?'south':'north';}
// Largest remainder: 4 northern squads + 1 eastern squad -> 4 + 1 of every five.
export function splitGuards(weights,count=5){const entries=Object.entries(weights).filter(([,n])=>n>0),total=entries.reduce((n,[,v])=>n+v,0);if(!total)return {};const out={},fractions=[];let used=0;for(const [side,n]of entries){const exact=count*n/total;out[side]=Math.floor(exact);used+=out[side];fractions.push([side,exact-out[side]]);}fractions.sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));for(let i=0;i<count-used;i++)out[fractions[i%fractions.length][0]]++;return out;}
function guardRoute(b,u,goal){const route=wallPath(b,u,goal)||[];if(route.length>1&&d(u,route[0])<3.3&&Math.abs((u.wallElevation||0)-route[0].height)<.5)route.shift();for(let i=0;i<route.length-1;i++){const a=route[i],next=route[i+1],dx=next.x-a.x,dz=next.z-a.z,len=Math.hypot(dx,dz);if(len){a.x-=dz/len*.55;a.z+=dx/len*.55;}}if(route.length)route[route.length-1]=goal;return route;}
export function planTowerGuards(b){
 const nodes=wallNodes(b),roofs=nodes.filter(n=>n.tower);if(!roofs.length)return;
 const center={x:(Math.min(...nodes.map(n=>n.x))+Math.max(...nodes.map(n=>n.x)))/2,z:(Math.min(...nodes.map(n=>n.z))+Math.max(...nodes.map(n=>n.z)))/2};
 const guards=b.squads.filter(u=>u.towerGuard&&u.hp>0&&!u.reserve&&!u.retreated&&!u.routing&&u.guardPost),foes=b.squads.filter(u=>!u.towerGuard&&u.team!==b.fortress.team&&u.hp>0&&!u.reserve&&!u.retreated&&!u.routing),weights={};for(const u of foes){const side=approachSide(u,center);weights[side]=(weights[side]||0)+1;}
 b.guardThreats=weights;const slots=new Map();
 for(const roof of roofs){const own=guards.filter(u=>u.homeTower===roof.index).sort((a,c)=>a.guardSlot-c.guardSlot),reachable=nodes.filter(n=>wallPath(b,roof,n)),available={};for(const [side,n]of Object.entries(weights))if(reachable.some(w=>approachSide(w,center)===side))available[side]=n;
  const allocation=splitGuards(available,own.length),assignments=Object.entries(allocation).flatMap(([side,count])=>Array(count).fill(side));
  const nextTower=roofs.filter(n=>n!==roof&&wallPath(b,roof,n)).sort((a,c)=>d(a,roof)-d(c,roof)||a.index-c.index)[0];
  for(const [i,u]of own.entries()){
   if(u.wallManual)continue;
   const side=assignments[i];u.guardSector=side||null;
   if(!side){if(u.guardGoal){u.guardGoal=null;u.wallRoute=[];}u.guardDuty='patrol';u.patrolTower=nextTower?.index??roof.index;continue;}
   u.guardDuty='defend';const threats=foes.filter(f=>approachSide(f,center)===side),onSide=reachable.filter(w=>!w.tower&&approachSide(w,center)===side),candidates=onSide.length?onSide:reachable;
   candidates.sort((a,c)=>Math.min(...threats.map(f=>d(f,a)))+(slots.get(a.index)||0)*1.5-Math.min(...threats.map(f=>d(f,c)))-(slots.get(c.index)||0)*1.5);
   const node=candidates.find(w=>(slots.get(w.index)||0)<8)||candidates[0];if(!node)continue;const slot=slots.get(node.index)||0;slots.set(node.index,slot+1);const goal={...node,...wallRankPoint(node,slot,8)};
   if(u.guardGoal?.index!==goal.index||d(u.guardGoal,goal)>.3){u.guardGoal=goal;u.wallRoute=guardRoute(b,u,goal);}
  }
 }
}
export function tickTowerGuards(b,dt){
 if(!b.wallWalkEnabled||!b.squads.some(u=>u.towerGuard))return;
 if((b.elapsed||0)>=(b.guardPlanAt??-1)){planTowerGuards(b);b.guardPlanAt=(b.elapsed||0)+4;}
 const guards=b.squads.filter(u=>u.towerGuard&&u.hp>0&&!u.reserve&&!u.retreated&&u.guardPost);
 for(const u of guards){const m=u.men?.[0];if(!m||m.hp<=0||u.routing)continue;
  const home=wallNodes(b).find(n=>n.index===u.homeTower);if(!home){u.guardPost=false;u.wallWalk=false;u.wallElevation=m.elevation=0;u.routing=m.routing=true;continue;}
  // Engage boarders at actual sword reach without abandoning the parapet.
  const boarder=b.squads.find(v=>v.team!==u.team&&v.hp>0&&!v.retreated&&v.guardPost&&Math.abs((v.wallElevation||0)-(m.elevation||0))<1.5&&d(v,u)<1.2);if(boarder){u.guardMoving=u.moving=m.moving=false;continue;}
  if(u.wallRoute?.some(p=>!wallNodes(b).some(w=>w.index===p.index))){u.wallRoute=[];b.guardPlanAt=0;}
  if(u.guardDuty==='patrol'&&!u.wallManual&&!u.wallRoute?.length){u.patrolWait=Math.max(0,(u.patrolWait||0)-dt);if(u.patrolWait>0)continue;const end=wallNodes(b).find(n=>n.index===(u.patrolReturning?u.homeTower:u.patrolTower))||home;const goal={...end,x:end.x+(u.guardSlot-2)*.8,z:end.z+(u.patrolReturning?-.8:.8)};u.wallRoute=guardRoute(b,u,goal);u.patrolReturning=!u.patrolReturning;u.patrolWait=2+u.guardSlot*.4;}
  u.guardMoving=u.moving=m.moving=false;let next=u.wallRoute?.[0];while(next&&Math.hypot(next.x-u.x,next.z-u.z,(next.height||3.8)-(u.wallElevation||0))<.12){u.wallRoute.shift();next=u.wallRoute[0];}
  if(next){const elevation=next.height||3.8,dx=next.x-u.x,dz=next.z-u.z,dy=elevation-(u.wallElevation||0),length=Math.hypot(dx,dz,dy),f=Math.min(1,2*dt/Math.max(.001,length)),to={x:u.x+dx*f,z:u.z+dz*f,elevation:(u.wallElevation||0)+dy*f};
   const peers=b.squads.filter(v=>v!==u&&v.hp>0&&v.guardPost).flatMap(v=>(v.men||[]).filter(n=>n.hp>0&&!n.escaped));
   const free=p=>peers.every(n=>Math.abs((n.elevation||0)-p.elevation)>=1||d(n,p)>=.71);
   const onWalk=p=>wallNodes(b).some(w=>w.tower?d(w,p)<2.7:Math.abs(p.x-w.x)<(w.wallAxis?1.25:3.6)&&Math.abs(p.z-w.z)<(w.wallAxis?3.6:1.25));
   let selected=to;
   if(!free(to)||u.guardDetourUntil>(b.elapsed||0)){
    const angle=Math.atan2(dz,dx),step=2*dt,angles=u.guardDetourUntil>(b.elapsed||0)?[u.guardDetourAngle,angle,angle+.8,angle-.8]:[angle+.8,angle-.8,angle+1.5,angle-1.5,angle+2.3,angle-2.3,angle+Math.PI];
    const choices=angles.map(a=>({x:u.x+Math.cos(a)*step,z:u.z+Math.sin(a)*step,elevation:u.wallElevation,angle:a})).filter(p=>onWalk(p)&&free(p));
    selected=choices[0]||null;if(selected){u.guardDetourAngle=selected.angle;if(!(u.guardDetourUntil>(b.elapsed||0)))u.guardDetourUntil=(b.elapsed||0)+1;}
   }
   if(selected&&free(selected)){u.x=m.x=selected.x;u.z=m.z=selected.z;u.wallElevation=m.elevation=selected.elevation;u.heading=m.heading=Math.atan2(dx,dz);u.guardMoving=u.moving=m.moving=true;}

  }
  u.anchor={x:u.x,z:u.z};m.elevation=u.wallElevation;
 }
}
