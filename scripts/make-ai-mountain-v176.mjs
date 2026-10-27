// One real AI city founded beside a naturally generated impassable mountain.
// Normal starting supplies, real AI growth/research/work and paid fortifications.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Civilization,createGame} from '../civilization-core.js';
import {terrainDefensePlanV176} from '../terrain-defenses-v176.js';
import {takeOverAI} from '../ai-takeover-v128.js';
const seed=142023,team=1;
const game=new Civilization(createGame(seed));
const candidates=[];
for(const cell of game.cells){
 if(!cell.land||cell.mountain||cell.river||!cell.deposits.wood||!cell.deposits.stone||!cell.deposits.water)continue;
 for(const [dc,dr] of [[-1,0],[1,0],[0,-1],[0,1]]){
  const mountain=game.cell({c:cell.c+dc,r:cell.r+dr});if(!mountain?.mountain)continue;
  const hall={type:'hall',hp:1200,ready:true,x:dc*32,z:dr*26};
  if(![-5,0,5].every(dx=>[-5,0,5].every(dz=>game.wallTerrainPassable(cell,hall.x+dx,hall.z+dz))))continue;
  const fake={...cell,id:0,team,economy:{buildings:[hall]}};
  const plan=terrainDefensePlanV176(game,fake,[hall],seed);
  if(!plan?.naturalBarriersV176.some(n=>n.kind==='mountain'))continue;
  const deposits=game.localWorld(cell).resources.filter(r=>!r.removed&&!['tree','berry','game','fish'].includes(r.kind));
  if(plan.slots.some(p=>deposits.some(r=>Math.abs(r.x-p.x)<(r.depositSite?10:4.5)&&Math.abs(r.z-p.z)<(r.depositSite?10:4))))continue;
  candidates.push({c:cell.c,r:cell.r,dc,dr,x:hall.x,z:hall.z,score:plan.slots.length+(cell.deposits.grain?-15:0)+(cell.deposits.game?-10:0),slots:plan.slots.length});
  if(candidates.length>=16)break;
 }
 if(candidates.length>=16)break;
}
assert.ok(candidates.length,'no genuine mountain-backed founding site');
candidates.sort((a,b)=>a.score-b.score);
const selected=candidates[0];
console.log('V176 MOUNTAIN SITE',JSON.stringify(selected));
const settler=game.s.settlers.find(a=>a.team===team);
game.s.settlers=[settler];
Object.assign(settler,{c:selected.c,r:selected.r,x:selected.x,z:selected.z,path:[],landed:true,localTarget:null});
game.s.units=game.s.units.filter(u=>u.team===team);
for(const army of game.s.armies)Object.assign(army,{c:selected.c,r:selected.r,path:[],autoExplore:false});
game.s.singleCityScenarioV176=true;
game.s.events??=[];
const founded=game.found(settler.id);assert.ok(founded.city,founded.error);
const city=founded.city;city.name='Kaljuvärava';
assert.equal(game.s.cities.length,1);assert.equal(city.economy.realms[team].pop,3);
const originalMountain={c:selected.c+selected.dc,r:selected.r+selected.dr};
assert.ok(game.cell(originalMountain).mountain);
// Discard untouched survey caches; the normal loader regenerates them.
game.s.tileWorlds=Object.fromEntries(Object.entries(game.s.tileWorlds||{}).filter(([,w])=>Object.keys(w.workers||{}).length||Object.keys(w.heat||{}).length||w.resources.some(r=>r.removed)));
const start=JSON.parse(JSON.stringify(game.s));
fs.mkdirSync('scenarios',{recursive:true});
fs.writeFileSync('scenarios/ai-mountain-v176-start.json',JSON.stringify(start));
let best=null;
for(let turn=1;turn<=125;turn++){
 for(let step=0;step<5;step++)game.tick(12);
 assert.equal(game.s.cities.length,1,'scenario must retain exactly one city');
 const plan=city.stoneDefensePlanV166||city.defensePlanV139;
 const slots=plan?.slots||[],local=city.economy.buildings;
 const ready=slots.filter(s=>local.some(b=>b.hp>0&&b.ready&&b.type===s.type&&Math.hypot(b.x-s.x,b.z-s.z)<(s.drawnWallV175?1:4.5))).length;
 const natural=plan?.naturalBarriersV176?.some(n=>n.kind==='mountain');
 const info={turn,age:game.s.ages[team],pop:city.economy.realms[team].pop,houses:local.filter(b=>b.type==='house'&&b.ready).length,ready,total:slots.length,natural,buildings:local.length,status:city.aiStoneDefenseStatusV166};
 if(turn%10===0)console.log('V176 MOUNTAIN PROGRESS',JSON.stringify(info));
 if(natural&&slots.length&&ready===slots.length&&info.houses>=3){best={info,state:JSON.parse(JSON.stringify(game.s))};break;}
 if(turn%20===0)fs.writeFileSync('/tmp/v176-mountain-checkpoint.json',JSON.stringify(game.s));
}
if(!best){fs.writeFileSync('/tmp/v176-mountain-incomplete.json',JSON.stringify(game.s));throw Error('AI did not finish its mountain-backed defenses within 125 turns');}
const state=takeOverAI(best.state,team);
state.demo='ai-mountain-v176';state.winner=null;
state.mountainTestV176={seed,turn:best.info.turn,sourceTeam:team,targetCityId:city.id,targetCityName:city.name,origin:{c:selected.c,r:selected.r,x:selected.x,z:selected.z},mountain:originalMountain,initialCities:1,initialPopulation:3,townStats:best.info,description:'One AI founded a single town beside a naturally generated mountain, then built it through normal gameplay. Ownership is transferred on loading.'};
state.cities.sort((a,b)=>a.id===city.id?-1:b.id===city.id?1:0);
const proof=new Civilization(JSON.parse(JSON.stringify(state)));
assert.equal(proof.s.cities.length,1);assert.equal(proof.s.cities[0].team,0);assert.ok(proof.cell(originalMountain).mountain,'mountain survives normal save reconstruction');
const time=proof.s.time;proof.tick(1);assert.ok(proof.s.time>time,'takeover snapshot can continue');
fs.writeFileSync('scenarios/ai-mountain-v176.json',JSON.stringify(state));
fs.writeFileSync('scenarios/ai-mountain-v176.manifest.json',JSON.stringify({pass:true,...state.mountainTestV176,bytes:Buffer.byteLength(JSON.stringify(state))},null,2)+'\n');
console.log('V176 MOUNTAIN TAKEOVER PASS',JSON.stringify(state.mountainTestV176));
