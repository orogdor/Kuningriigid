import {Navigation,buildingClearance} from './navigation.js';
import {localSurface} from './continuous-landscape.js';
import {BATTLEFIELD,battlefieldTiles} from './battlefield-v88.js';
// A 3m tactical grid keeps an 8x8 map small enough for a phone. Normal city
// workers retain their independent 1m grids and saved roads.
export function createBattleNavigation(game,battle){
 const scale=3,bins=new Map(),world={resources:[],revision:0},height=(x,z)=>localSurface(game,battle.cell,x,z);
 const add=(o,rx,rz)=>{rx+=scale/2;rz+=scale/2;for(let z=Math.floor((o.z-rz)/16);z<=Math.floor((o.z+rz)/16);z++)for(let x=Math.floor((o.x-rx)/16);x<=Math.floor((o.x+rx)/16);x++){const k=x+':'+z,list=bins.get(k)||[];list.push({...o,rx,rz});bins.set(k,list);}};
 for(const tile of battlefieldTiles(battle.cell)){if(tile.c<0||tile.r<0||tile.c>=220||tile.r>=165)continue;const offset={x:tile.dc*150,z:tile.dr*130};
  for(const r of game.localWorld(tile).resources)if(!r.removed&&r.amount>0&&!['game','fish','berry'].includes(r.kind))add({x:r.x+offset.x,z:r.z+offset.z},r.kind==='tree'?1.4:3,r.kind==='tree'?1.4:3);
  for(const b of game.contextAt(tile,false)?.economy.buildings||[]){if(b.virtual||b.hp<=0)continue;const size=buildingClearance(b);if(size)add({x:b.x+offset.x,z:b.z+offset.z},size.rx,size.rz);}
 }
 const passable=(x,z)=>{const dc=Math.floor((x+75)/150),dr=Math.floor((z+65)/130),c=battle.cell.c+dc,r=battle.cell.r+dr;if(c<0||r<0||c>=220||r>=165)return false;const tile=game.cell({c,r});if(tile.mountain||height(x,z)<=.2)return false;return !(bins.get(Math.floor(x/16)+':'+Math.floor(z/16))||[]).some(o=>Math.abs(x-o.x)<=o.rx&&Math.abs(z-o.z)<=o.rz);};
 const nav=new Navigation(world,(x,z)=>passable(x*scale,z*scale),()=>[],{minX:Math.ceil((BATTLEFIELD.outerMinX+3)/scale),minZ:Math.ceil((BATTLEFIELD.outerMinZ+3)/scale),w:399,h:345});
 const down=p=>({x:p.x/scale,z:p.z/scale}),up=p=>p&&({x:p.x*scale,z:p.z*scale}),agents=new WeakMap();
 return {world,passable,grid:nav,open:(x,z)=>nav.open(x/scale,z/scale),nearest:(p,max=9)=>up(nav.nearest(down(p),Math.ceil(max/scale))),route:(a,b)=>nav.route(down(a),down(b),{preferRoads:false})?.map(up)||null,
  move(agent,target,dt,speed){let scaled=agents.get(agent);if(!scaled){scaled={};agents.set(agent,scaled);}scaled.x=agent.x/scale;scaled.z=agent.z/scale;const done=nav.move(scaled,down(target),dt,speed/scale);agent.x=scaled.x*scale;agent.z=scaled.z*scale;agent.heading=scaled.heading??agent.heading;agent.moving=scaled.moving;return done;}};
}
