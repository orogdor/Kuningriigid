import {orderWallMove} from './wall-walk-v111.js?v=116a';
import {ammunitionLoad,carriesSword,stoneThrower} from './combat-equipment-v100.js?v=116a';
import {wallBlocksShot} from './siege-rules-v114.js?v=116a';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const towerBallista=b=>({range:50,damage:24,reload:6,cool:0,height:(b?.bronzeWall?6.4:b?.type==='stonetower'?7.55:7.25)+.65});
export const CAMP_STONE_INTERVAL=15; // real seconds: exactly four stones per minute per camp
export const readyCamps=(b,team)=>(b.siegeWorks||[]).filter(w=>w.kind==='camp'&&w.team===team&&w.ready&&!w.destroyed&&w.hp>0);
export function tickSiegeSupply(b,dt,nav=null){
 for(const camp of (b.siegeWorks||[]).filter(w=>w.kind==='camp'&&w.ready&&!w.destroyed&&w.hp>0)){
  camp.productionSeconds=(camp.productionSeconds||0)+dt*2;camp.stones??=0;camp.produced??=0;
  while(camp.productionSeconds>=CAMP_STONE_INTERVAL-1e-8){camp.productionSeconds-=CAMP_STONE_INTERVAL;camp.stones++;camp.produced++;}
  const enemies=b.squads.filter(u=>u.team!==camp.team&&u.hp>0&&!u.reserve&&!u.retreated&&!u.routing&&!u.guardPost&&distance(u,camp)<10);
  if(enemies.length){camp.hp=Math.max(0,camp.hp-dt*8*enemies.length);if(camp.hp<=0)camp.destroyed=true;}
 }
 for(const u of b.squads){
  if(u.hp<=0||u.reserve||u.retreated||(!carriesSword(u)&&!stoneThrower(u)))continue;
  const men=(u.men||[]).filter(m=>m.hp>0&&!m.escaped),load=ammunitionLoad(u),total=men.reduce((n,m)=>n+(m.ammo||0),0),camps=readyCamps(b,u.team);
  u.hasSiegeSupply=camps.length>0;
  if(u.ammoDepleted&&camps.length&&u.morale>=46&&!u.withdrawing){u.routing=false;u.ammoDepleted=false;for(const m of men)m.routing=false;}
  // Ammunition shortage can be repaired; a genuine morale rout cannot.
  const automatic=(u.combatMode??'auto')!=='manual'&&!u.manualOrder&&!u.wallClimb&&u.siegeBuildingId==null;
  if(automatic&&!u.routing&&total<=men.length*load*.2&&!u.resupplyCamp){const camp=camps.filter(c=>stoneThrower(u)||distance(u,c)<180).sort((a,c)=>distance(u,a)-distance(u,c))[0];if(camp){let canLeave=true;if(u.guardPost){const result=nav?orderWallMove(b,u,camp,nav):null;canLeave=!!result?.ok;if(canLeave)u.preSupplyWall={x:u.x,z:u.z};}if(canLeave){u.resupplyCamp=camp.id;u.preSupplyAnchor={...(u.anchor||u)};}}}
  let camp=camps.find(c=>c.id===u.resupplyCamp);
  if(u.resupplyCamp&&!camp){delete u.resupplyCamp;delete u.preSupplyAnchor;}
  if(u.routing&&!u.ammoDepleted)continue;
  // Manual units also reload when the player brings them to a camp.
  for(const m of men){if(u.guardPost||(m.elevation||0)>1)continue;const nearby=camp&&distance(m,camp)<9?camp:camps.find(c=>distance(m,c)<9);if(!nearby)continue;
   if(stoneThrower(u)){if(nearby.stones>0&&m.ammo<load){const n=Math.min(nearby.stones,load-m.ammo);nearby.stones-=n;m.ammo+=n;}}
   else {m.arrowSupplyProgress=(m.arrowSupplyProgress||0)+dt*2*4;const n=Math.min(load-m.ammo,Math.floor(m.arrowSupplyProgress));if(n>0){m.ammo+=n;m.arrowSupplyProgress-=n;}if(m.ammo>=load)m.arrowSupplyProgress=0;}
  }
  u.ammoRemaining=men.reduce((n,m)=>n+(m.ammo||0),0);
  if(camp&&u.ammoDepleted&&u.morale>=46&&!u.withdrawing){u.routing=false;u.ammoDepleted=false;for(const m of men)m.routing=false;}
  if(camp&&men.every(m=>m.ammo>=load)){delete u.resupplyCamp;u.anchor=u.preSupplyAnchor||{...u};delete u.preSupplyAnchor;if(u.preSupplyWall&&nav){orderWallMove(b,u,u.preSupplyWall,nav);delete u.preSupplyWall;}}
 }
}
export function siegeSupplyGoal(b,u){const camp=readyCamps(b,u.team).find(c=>c.id===u.resupplyCamp);return camp?{x:camp.x,z:camp.z}:null;}
export function tickTowerBallistas(b,dt,agents,hit){
 b.ballistaShots??=[];
 for(const shot of b.ballistaShots){if(shot.resolved||b.elapsed<shot.landsAt)continue;shot.resolved=true;const target=agents.find(p=>p.u.source===shot.targetSource&&p.m.id===shot.targetMan&&p.m.hp>0&&!p.m.escaped&&!p.u.retreated);if(target&&distance(target.m,{x:shot.toX,z:shot.toZ})<3)hit(target,shot.damage);}
 b.ballistaShots=b.ballistaShots.filter(s=>b.elapsed<s.landsAt+.25);
 for(const post of b.defensePosts||[]){if(!post.ballista||post.active===false||b.fortressFallen)continue;
  post.ballista.cool=Math.max(0,(post.ballista.cool||0)-dt);if(post.ballista.cool>0)continue;
  const height=post.ballista.height||6.4;
  const targets=agents.filter(p=>p.u.team!==post.team&&p.m.hp>0&&!p.m.escaped&&!p.u.retreated&&!p.u.routing&&distance(post,p.m)>5&&distance(post,p.m)<=post.ballista.range&&!wallBlocksShot(b,post,p.m,height,p.m.elevation||0));
  const target=targets.sort((a,c)=>distance(post,a.m)-distance(post,c.m))[0];if(!target)continue;
  post.ballista.heading=Math.atan2(target.m.x-post.x,target.m.z-post.z);post.ballista.firedAt=b.elapsed;
  b.ballistaShots.push({id:(b.nextBallistaShotId=(b.nextBallistaShotId||0)+1),team:post.team,x:post.x,z:post.z,fromY:height+1,toX:target.m.x,toZ:target.m.z,toY:(target.m.elevation||0)+1,targetSource:target.u.source,targetMan:target.m.id,damage:post.ballista.damage,startedAt:b.elapsed,landsAt:b.elapsed+.7});
  post.ballista.cool=post.ballista.reload;
 }
}
