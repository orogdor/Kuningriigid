// New continent map and genuine AI progression; never load an earlier scenario.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Civilization,createGame} from '../civilization-core.js';
import {takeOverAI} from '../ai-takeover-v128.js';
const seed=9280471,game=new Civilization(createGame(seed,'continents')),bronzeAt={},captures=[];
const initial={seed,type:game.s.type,at:game.s.time,ages:[...game.s.ages],
 cities:game.s.cities.length,settlers:game.s.settlers.map(s=>({team:s.team,c:s.c,r:s.r}))};
assert.equal(initial.at,0);assert.deepEqual(initial.ages,[0,0,0,0]);assert.equal(initial.cities,0);
let turn=0;
for(turn=1;turn<=260;turn++){
 const was=game.s.ages.slice();
 const captureable=[1,2,3].filter(t=>was[t]===1&&!captures.some(c=>c.team===t));
 const previous=captureable.length?JSON.stringify(game.s):null;
 for(let i=0;i<5;i++)game.tick(12);
 for(let t=1;t<=3;t++){
  if(bronzeAt[t]==null&&game.s.ages[t]>=1)bronzeAt[t]=turn;
  if(previous&&was[t]===1&&game.s.ages[t]>=2&&!captures.some(c=>c.team===t)){
   const state=JSON.parse(previous),city=state.cities.filter(c=>c.team===t)
     .sort((a,b)=>b.economy.realms[t].pop-a.economy.realms[t].pop)[0];
   if(city)captures.push({team:t,state,turn:turn-1,cityId:city.id,pop:city.economy.realms[t].pop,
    bronzeAt:bronzeAt[t],duration:turn-(bronzeAt[t]||turn),reachedIron:true});
  }
 }
 if(turn%20===0)console.log('V217 FRESH WORLD',JSON.stringify({turn,ages:game.s.ages.slice(1),
   cities:game.s.cities.length,roads:Object.keys(game.s.worldRoads||{}).length,captures:captures.length}));
 if(captures.length===3)break;
}
if(!captures.length)for(const t of [1,2,3]){
 if(game.s.ages[t]!==1||turn-(bronzeAt[t]||turn)<45)continue;
 const state=JSON.parse(JSON.stringify(game.s)),city=state.cities.filter(c=>c.team===t)
  .sort((a,b)=>b.economy.realms[t].pop-a.economy.realms[t].pop)[0];
 if(city)captures.push({team:t,state,turn,cityId:city.id,pop:city.economy.realms[t].pop,
  bronzeAt:bronzeAt[t],duration:turn-bronzeAt[t],reachedIron:false});
}
assert.ok(captures.length,'New continent world did not yield a genuine late-bronze AI city');
captures.sort((a,b)=>b.duration-a.duration||b.pop-a.pop);
const take=captures[0],state=takeOverAI(take.state,take.team);
state.demo='bronze-fresh-v217';state.winner=null;
const city=state.cities.find(c=>c.id===take.cityId);
state.cities.sort((a,b)=>a.id===city.id?-1:b.id===city.id?1:0);
assert.equal(state.ages[0],1);assert.equal(city.team,0);
const game2=new Civilization(state),buildings=game2.allBuildings(city).filter(b=>b.hp>0&&!b.virtual);
const fort=new Set(['palisade','woodgate','stonewall','gatehouse','watchtower','stonetower','reinforced_wall']);
const meta={version:217,seed,initial,newMap:true,fromZero:true,priorSaveLoaded:false,
 organicAI:true,freeMaterialsAdded:0,capturedTurn:take.turn,bronzeBeganAt:take.bronzeAt,
 bronzeTurns:take.duration,bronzeCompleted:take.reachedIron,age:1,originalTeam:take.team,
 cityId:city.id,cityName:city.name,population:city.economy.realms[0].pop,cityBuildings:buildings.length,
 fortifications:buildings.filter(b=>fort.has(b.type)).length,
 worldRoadEdges:Object.keys(state.worldRoads||{}).length,
 scenarioType:take.reachedIron?'last-bronze-turn-before-iron':'late-bronze-timeout',
 appliedPatches:'V215 walls, V216 roads, V211 menu'};
state.bronzeFreshV217=meta;
const proof=new Civilization(JSON.parse(JSON.stringify(state)));proof.tick(1);assert.ok(proof.s.time>state.time);
fs.writeFileSync('scenarios/bronze-fresh-v217.json',JSON.stringify(state));
fs.writeFileSync('scenarios/bronze-fresh-v217.manifest.json',JSON.stringify(meta,null,2)+'\n');
console.log('V217 NEW MAP BRONZE TAKEOVER',JSON.stringify(meta));
