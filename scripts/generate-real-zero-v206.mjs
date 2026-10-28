// V206: two independently reproducible zero-time AI worlds.
// NO previous scenario is loaded; no free walls, resources, tech or readiness.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Civilization,createGame} from '../civilization-core.js';
import {takeOverAI} from '../ai-takeover-v128.js';
import {suburbDemandV204} from '../outer-ring-v184.js';
const kind=process.argv[2];
assert.ok(['coast','mountain'].includes(kind),'Usage: node scripts/generate-real-zero-v206.mjs coast|mountain');
const seed=142023,game=new Civilization(createGame(seed));
assert.equal(game.s.time,0);
assert.ok(game.s.ages.every(x=>x===0));
if(kind==='mountain'){
 const team=1,at={c:85,r:18},mountain=game.cell({c:85,r:19}),cell=game.cell(at);
 assert.ok(cell?.land&&!cell.mountain&&mountain?.mountain,'real mountain starting site changed');
 const settler=game.s.settlers.find(s=>s.team===team);
 assert.ok(settler,'no AI starting settler');
 game.s.settlers=[settler];
 Object.assign(settler,{c:at.c,r:at.r,x:0,z:26,path:[],landed:true,localTarget:null});
 game.s.units=game.s.units.filter(u=>u.team===team);
 for(const army of game.s.armies)Object.assign(army,{c:at.c,r:at.r,path:[],autoExplore:false});
 game.s.singleCityScenarioV176=true;
 const founded=game.found(settler.id);
 assert.ok(founded.city,founded.error||'Unable to found mountain city');
 founded.city.name='Kaljuvärava';
 assert.equal(founded.city.economy.realms[team].pop,3);
}
const initial={seed,initialTime:0,initialAges:[...game.s.ages],
 initialCityCount:game.s.cities.length,initialBuildingCount:game.s.cities.reduce((n,c)=>n+game.allBuildings(c).length,0)};
const team=kind==='coast'?2:1,cityName=kind==='coast'?'Fyrisvellir':'Kaljuvärava';
const maxTurn=Number(process.env.V206_MAX_TURNS||360);
let target=null,firstWall=null,secondComplete=null,peak=0,turn=0;
for(turn=1;turn<=maxTurn;turn++){
 for(let j=0;j<5;j++)game.tick(12);
 target=game.s.cities.find(c=>c.name===cityName&&c.team===team);
 if(!target&&kind==='coast')target=game.s.cities.find(c=>c.team===team&&game.cell(c)?.coast);
 if(!target)continue;
 const demand=suburbDemandV204(game,target);
 peak=Math.max(peak,demand.cluster.length);
 const outer=target.outerRingV184;
 const built=game.allBuildings(target).filter(b=>b.outerRingV184&&b.hp>0);
 const ready=built.filter(b=>b.ready);
 if(!firstWall&&ready.length)firstWall={turn,ready:ready.length,cluster:demand.cluster.length};
 if((turn%20===0)||outer?.nextIndex===outer?.slots?.length&&ready.length===outer?.slots?.length){
  console.log('V206 ZERO AI',JSON.stringify({kind,turn,target:target.name,age:game.s.ages[team],
   pop:target.economy.realms[team]?.pop,buildings:game.allBuildings(target).filter(b=>b.hp>0&&!b.virtual).length,
   outside:demand.count,cluster:demand.cluster.length,peak,outer:target.outerRingDiagnosticV184?.reason||null,
   outerSlots:outer?.slots?.length||0,built:built.length,ready:ready.length}));
 }
 if(outer?.slots?.length&&outer.nextIndex===outer.slots.length&&ready.length===outer.slots.length&&
  target.outerRingDiagnosticV184?.reason==='complete'){
   secondComplete={turn,slots:outer.slots.length,ready:ready.length,natural:outer.naturalBoundaryV194?.kind||null};
   break;
 }
}
assert.ok(target,'The real AI did not found '+cityName);
const actualTurn=Math.min(turn,maxTurn),demand=suburbDemandV204(game,target),outer=target.outerRingV184;
const built=game.allBuildings(target).filter(b=>b.outerRingV184&&b.hp>0);
const meta={version:206,kind,seed,initial,turn:actualTurn,sourceTeam:team,
 cityName:target.name,targetCityId:target.id,age:game.s.ages[team],
 population:target.economy.realms[team]?.pop,outside:demand.count,
 connectedOutside:demand.cluster.length,maxConnectedOutside:peak,
 demandReady:demand.ready,secondWallPlanned:outer?.slots?.length||0,
 secondWallBuilt:built.length,secondWallReady:built.filter(b=>b.ready).length,
 reason:target.outerRingDiagnosticV184?.reason||null,
 firstWall,secondComplete,organicAI:true,freeBuildingsAdded:0,
 priorSaveLoaded:false,description:'Replayed from createGame(seed), with normal AI ticks and paid construction only'};
const state=takeOverAI(game.s,team);
state.demo='zero-v206-'+kind;state.winner=null;state.zeroTestV206=meta;
state.cities.sort((a,b)=>a.id===target.id?-1:b.id===target.id?1:0);
assert.equal(state.cities[0].team,0);
const proof=new Civilization(JSON.parse(JSON.stringify(state)));
proof.tick(1);
assert.ok(proof.s.time>state.time);
fs.mkdirSync('scenarios',{recursive:true});
fs.writeFileSync('scenarios/zero-v206-'+kind+'.json',JSON.stringify(state));
fs.writeFileSync('scenarios/zero-v206-'+kind+'.manifest.json',JSON.stringify(meta,null,2)+'\n');
console.log('V206 REAL ZERO RESULT',JSON.stringify(meta));
