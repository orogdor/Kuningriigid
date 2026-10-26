import {Civilization,createGame} from '../civilization-core.js';
import {reserveStoneVillageRingV168} from '../stone-village-defenses-v166.js';
const seed=31757,g=new Civilization(createGame(seed));
let capital=null;
for(let turn=1;turn<=25&&!capital;turn++){
 for(let j=0;j<5;j++)g.tick(12);
 capital=g.s.cities.find(c=>c.team===1);
}
if(!capital)throw Error('Team 1 did not settle');
const hall=capital.economy.buildings.find(b=>b.type==='hall');
const nav=g.nav(capital),candidates=[];
for(let x=-18;x<=18;x+=6)for(let z=-18;z<=18;z+=6){
 const fake={...capital,economy:{buildings:[{...hall,x,z}]}};
 const ring=reserveStoneVillageRingV168(g,fake);
 const core=Array.from({length:5},(_,i)=>i-2);
 const scores=core.flatMap(dx=>core.map(dz=>nav.passable(x+dx*10,z+dz*10)?1:0));
 candidates.push({x,z,bad:ring?.terrainBlockedAtFounding??999,rx:ring?.rx,rz:ring?.rz,
   squareDry:scores.reduce((a,b)=>a+b,0),current:x===hall.x&&z===hall.z});
}
candidates.sort((a,b)=>a.bad-b.bad||b.squareDry-a.squareDry);
console.log('V169 FOUNDING CANDIDATES',JSON.stringify({seed,capital:capital.name,tile:{c:capital.c,r:capital.r},
 hall:{x:hall.x,z:hall.z},original:candidates.find(c=>c.current),best:candidates.slice(0,12)}));
