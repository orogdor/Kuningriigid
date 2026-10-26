// V175.7: peacetime tower guards visibly leave the enclosed wooden tower,
// follow safe existing village routes and climb back. Siege patrols remain
// in tower-garrison-v117.js and are deliberately untouched.
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const LIVE_TOWER=new Set(['watchtower','stonetower']);
export const GROUND_PATROL_SLOTS_V1757=2;
export const WOOD_TOWER_ROOF_V1757=7.25;

export function towerDoorDirectionV1757(city,tower){
 const hall=city?.economy?.buildings?.find(b=>b.type==='hall'&&b.hp>0);
 const dx=(hall?.x??tower.x)-(tower.x||0),
       dz=(hall?.z??tower.z)-(tower.z||0),d=Math.hypot(dx,dz);
 return d>1?{x:dx/d,z:dz/d,angle:Math.atan2(dx,dz)}:{x:0,z:1,angle:0};
}
function doorPoint(city,tower,nav){
 const v=towerDoorDirectionV1757(city,tower);
 // Door faces the village hall, not the outside of the defensive enclosure.
 const wanted={x:tower.x+v.x*6.6,z:tower.z+v.z*6.6};
 const entry=nav.nearest(wanted,3);
 const hall=city.economy.buildings.find(b=>b.type==='hall'&&b.hp>0);
 const from=hall&&nav.nearest({x:hall.x,z:hall.z+7},6);
 if(!entry||from&&!nav.reachable(from,entry))return null;
 return entry;
}
function patrolTarget(city,tower,entry,nav,slot){
 const towers=city.economy.buildings.filter(t=>
  LIVE_TOWER.has(t.type)&&t!==tower&&t.ready&&t.hp>0&&!t.disabled&&
  dist(t,tower)>10&&dist(t,tower)<65);
 towers.sort((a,b)=>dist(a,tower)-dist(b,tower));
 for(const other of towers){
  const goal=doorPoint(city,other,nav);
  if(goal&&dist(goal,entry)>8&&nav.reachable(entry,goal))return goal;
 }
 // A single isolated tower still gets a circuit along accessible inner paths.
 const dir=towerDoorDirectionV1757(city,tower),side={x:-dir.z,z:dir.x};
 const probes=slot%2?[
  {x:entry.x-side.x*16,z:entry.z-side.z*16},
  {x:entry.x+dir.x*15,z:entry.z+dir.z*15}
 ]:[
  {x:entry.x+side.x*16,z:entry.z+side.z*16},
  {x:entry.x+dir.x*15,z:entry.z+dir.z*15}
 ];
 for(const p of probes){
  const goal=nav.nearest(p,5);
  if(goal&&dist(goal,entry)>6&&nav.reachable(entry,goal))return goal;
 }
 return null;
}
function syncMan(u){
 const m=u.men?.[0];if(!m)return;
 m.x=u.x;m.z=u.z;m.heading=u.heading;m.moving=!!u.moving;
 m.elevation=u.wallElevation||0;
}
export function tickPeaceTowerPatrolV1757(city,b,nav,dt){
 if(!city||!b||!nav||!(dt>0))return {walking:0,rooftop:0};
 const towers=city.economy.buildings;
 let walking=0,rooftop=0;
 for(const u of b.squads||[]){
  if(!u.towerGuard||u.hp<=0||u.guardSlot>=GROUND_PATROL_SLOTS_V1757||
     u.guardSlot<0||u.retreated||u.routing||!(u.men?.[0]?.hp>0))continue;
  const home=towers[u.homeTower];
  if(!home||!LIVE_TOWER.has(home.type)||!home.ready||home.hp<=0||home.disabled)continue;
  const roof=home.bronzeWall?6.4:home.type==='stonetower'?7.55:WOOD_TOWER_ROOF_V1757;
  if(!u.peacePatrolV1757){
   u.peacePatrolV1757={phase:'roof',timer:3+u.guardSlot*8,
    homeIndex:u.homeTower};
   u.x=home.x+(u.guardSlot?0.6:-.6);u.z=home.z;
   u.wallElevation=roof;u.guardPost=true;u.wallWalk=true;
  }
  const p=u.peacePatrolV1757;
  u.wallManual=true;u.wallRoute=[];u.guardDuty='village-patrol';
  u.moving=false;
  if(p.phase==='roof'){
   rooftop++;
   p.timer-=dt;
   if(p.timer<=0)p.phase='descending';
  }else if(p.phase==='descending'){
   // Inside solid wooden walls: soldier drops down a real tower interior,
   // then emerges through the outward-facing doorway at ground level.
   u.guardPost=true;u.wallElevation=Math.max(0,(u.wallElevation??roof)-2.5*dt);
   if(u.wallElevation===0){
    const entry=doorPoint(city,home,nav);
    const goal=entry&&patrolTarget(city,home,entry,nav,u.guardSlot);
    if(entry&&goal){
     u.x=entry.x;u.z=entry.z;u.guardPost=false;u.wallWalk=false;
     u.wallElevation=0;p.entry=entry;p.goal=goal;p.phase='outbound';
    }else{
     p.timer=12;p.phase='ascending';
    }
   }
  }else if(p.phase==='outbound'||p.phase==='return'){
   // Nav.moveCitizen performs A* routing and lays natural wear only on
   // actual walkable cells. The wall/gate collision mask stays authoritative.
   const goal=p.phase==='return'?p.entry:p.goal;
   if(!goal){p.phase='return';p.entry=doorPoint(city,home,nav);continue;}
   const reached=nav.moveCitizen(u,goal,dt,1.7);
   if(u.moving)walking++;
   if(reached){
    if(p.phase==='return'){
     u.x=home.x+(u.guardSlot?0.6:-.6);u.z=home.z;
     u.guardPost=true;u.wallWalk=true;u.wallElevation=0;
     p.phase='ascending';
    }else{
     p.phase='watch';p.timer=3.5+u.guardSlot*1.5;
    }
   }else if(!u.moving){
    p.blocked=(p.blocked||0)+dt;
    if(p.blocked>5){p.phase='return';p.blocked=0;}
   }else p.blocked=0;
  }else if(p.phase==='watch'){
   p.timer-=dt;if(p.timer<=0)p.phase='return';
  }else if(p.phase==='ascending'){
   u.guardPost=true;u.wallElevation=Math.min(roof,(u.wallElevation||0)+2.5*dt);
   if(u.wallElevation>=roof-.001){p.phase='roof';p.timer=14+u.guardSlot*6;}
  }
  syncMan(u);
 }
 return {walking,rooftop};
}
