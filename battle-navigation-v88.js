import {createBattleSteering} from './battle-movement-v97.js';
import {Navigation,buildingClearance} from './navigation.js';
import {localSurface} from './continuous-landscape.js';
import {BATTLEFIELD,battlefieldTiles} from './battlefield-v88.js';
import {assaultLaneAt} from './siege-assault-v108.js?v=117a';
// A 3m tactical grid keeps an 5x5 map small enough for a phone. Normal city
// workers retain their independent 1m grids and saved roads.
export function createBattleNavigation(game,battle){
 const scale=3,bins=new Map(),world={resources:[],revision:0},height=(x,z)=>localSurface(game,battle.cell,x,z);
 const add=(o,rx,rz)=>{rx+=scale/2;rz+=scale/2;for(let z=Math.floor((o.z-rz)/16);z<=Math.floor((o.z+rz)/16);z++)for(let x=Math.floor((o.x-rx)/16);x<=Math.floor((o.x+rx)/16);x++){const k=x+':'+z,list=bins.get(k)||[];list.push({...o,rx,rz});bins.set(k,list);}};
 for(const tile of battlefieldTiles(battle.cell)){if(tile.c<0||tile.r<0||tile.c>=220||tile.r>=165)continue;const offset={x:tile.dc*150,z:tile.dr*130};
  for(const r of game.localWorld(tile).resources)if(!r.removed&&r.amount>0&&!['game','fish'].includes(r.kind))add({x:r.x+offset.x,z:r.z+offset.z},r.kind==='tree'?1.4:r.kind==='berry'?.8:3,r.kind==='tree'?1.4:r.kind==='berry'?.8:3);
  for(const b of game.contextAt(tile,false)?.economy.buildings||[]){if(b.virtual||b.hp<=0)continue;const size=buildingClearance(b);if(size)add({type:b.type,x:b.x+offset.x,z:b.z+offset.z},size.rx,size.rz);}
 }
 const passable=(x,z)=>{const dc=Math.floor((x+75)/150),dr=Math.floor((z+65)/130),c=battle.cell.c+dc,r=battle.cell.r+dr;if(c<0||r<0||c>=220||r>=165)return false;const tile=game.cell({c,r});if(tile.mountain||height(x,z)<=.2)return false;return !(bins.get(Math.floor(x/16)+':'+Math.floor(z/16))||[]).some(o=>{
  if(Math.abs(x-o.x)>o.rx||Math.abs(z-o.z)>o.rz)return false;
  if(['palisade','stonewall','reinforced_wall','gatehouse'].includes(o.type)){
   const sec=(battle.siegeSections||[]).find(w=>w.x===o.x&&w.z===o.z&&w.type===o.type);
   if(sec&&(sec.breached||sec.hp<=0||(!battle.wallWalkEnabled&&assaultLaneAt(battle,x,z,sec))))return false;
  }
  return true;
 });};
 const nav=new Navigation(world,(x,z)=>passable(x*scale,z*scale),()=>[],{minX:Math.ceil((BATTLEFIELD.outerMinX+3)/scale),minZ:Math.ceil((BATTLEFIELD.outerMinZ+3)/scale),w:Math.floor((BATTLEFIELD.outerMaxX-BATTLEFIELD.outerMinX-6)/scale)+1,h:Math.floor((BATTLEFIELD.outerMaxZ-BATTLEFIELD.outerMinZ-6)/scale)+1});
 // Do not spawn soldiers in tiny sealed pockets between overlapping shrubs.
 nav.ensureComponents();let main=1;for(let i=2;i<nav.componentSizes.length;i++)if(nav.componentSizes[i]>nav.componentSizes[main])main=i;for(let i=0;i<nav.n;i++)if(!battle.wallWalkEnabled&&nav.components[i]!==main){nav.mask[i]=0;nav.base[i]=0;}nav.version++;nav.componentVersion=-1;
 const down=p=>({x:p.x/scale,z:p.z/scale}),up=p=>p&&({x:p.x*scale,z:p.z*scale});
// Reuse a persistent tactical path. Worker navigation re-rounds a moving
 // destination and restarts at the previous grid center, making whole ranks
 // walk backwards whenever the enemy crosses a 3m cell boundary.
 const result={world,passable,grid:nav,cellSize:scale,reachable:(a,b)=>nav.reachable(down(a),down(b)),open:(x,z)=>nav.open(x/scale,z/scale),nearest:(p,max=9)=>up(nav.nearest(down(p),Math.ceil(max/scale))),route:(a,b)=>nav.route(down(a),down(b),{preferRoads:false})?.map(up)||null,
  move(agent,target,dt,speed){agent.moving=false;if(!target||dt<=0)return false;const goal=result.waypoint(agent,target,battle.elapsed||0),dx=goal.x-agent.x,dz=goal.z-agent.z,d=Math.hypot(dx,dz),step=Math.min(d,speed*dt);if(d>.01&&step>0){const x=agent.x+dx/d*step,z=agent.z+dz/d*step;if(result.open(x,z)){agent.x=x;agent.z=z;agent.moving=true;}}return Math.hypot(agent.x-target.x,agent.z-target.z)<.3;}};result.rebuildSiegeAccess=()=>{for(let i=0;i<nav.n;i++){const x=(nav.minX+i%nav.w)*scale,z=(nav.minZ+Math.floor(i/nav.w))*scale;nav.base[i]=passable(x,z)?1:0;}nav.rebuild();nav.componentVersion=-1;Object.assign(result,createBattleSteering(result));};Object.assign(result,createBattleSteering(result));return result;
}
