
import {Civilization,createGame} from './civilization-core.js';
import {writeFileSync} from 'node:fs';
const seed=20261019,max=36000,now=Date.now(),g=new Civilization(createGame(seed)),s=g.s;
const a=s.settlers.find(x=>x.team===0);
const first=g.land(a.id);if(first)throw Error('player landing: '+first);
let home=null;
for(let x=-25;x<=25&&!home;x+=5)for(let z=-25;z<=25&&!home;z+=5){
 if(g.siteRule(a,{x,z}))continue;a.x=x;a.z=z;home=g.found(a.id).city;
}
if(!home)throw Error('cannot found player town');
const checkpoints=[],milestones=[];
let known=new Set(),built=new Set(),ships=new Set();
const status=()=>{
 const p={min:s.time/60,ages:s.ages.slice(),teams:[1,2,3].map(team=>{
  const city=s.cities.filter(c=>c.team===team),harbor=city.some(c=>g.allBuildings(c).some(b=>b.type==='harbor'&&b.ready&&b.hp>0)),underConstruction=city.some(c=>g.allBuildings(c).some(b=>b.type==='harbor'&&b.hp>0&&!b.ready)),ships=s.ships.filter(sh=>sh.team===team&&sh.hp>0).map(sh=>({kind:sh.kind,c:sh.c,r:sh.r,cargo:sh.cargo?.kind,atSea:sh.path?.length||0}));
  return {team,cities:city.length,tech:s.research[team].known.length,hasShipbuilding:s.research[team].known.includes('shipbuilding'),harbor,underConstruction,ships};
 })};
 checkpoints.push(p);console.log('AI NAVY',JSON.stringify(p));
};
for(let n=0;s.time<max&&!s.winner;n++){
 g.tick(6);
 if(s.time%1800===0)status();
}
status();
const result={seed,min:s.time/60,wallSec:(Date.now()-now)/1000,checkpoints,aiFinal:checkpoints.at(-1).teams};
writeFileSync('ai-v72-maritime.json',JSON.stringify(result,null,2));
const shipTeams=result.aiFinal.filter(t=>t.ships.length).map(t=>t.team),builtPorts=result.aiFinal.filter(t=>t.harbor).map(t=>t.team);
console.log('AI NAVY RESULT',JSON.stringify({min:result.min,shipTeams,builtPorts,final:result.aiFinal,wallSec:result.wallSec}));
if(!builtPorts.length)throw Error('No opponent built a functional harbor by 600 minutes despite researched shipbuilding.');
if(!shipTeams.length)throw Error('No opponent built a single usable ship by 600 minutes.');
