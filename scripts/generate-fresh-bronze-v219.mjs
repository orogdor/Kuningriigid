// V219: a completely independent freshly generated continent map.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Civilization,createGame} from '../civilization-core.js';
import {takeOverAI} from '../ai-takeover-v128.js';
const seed=5932019,game=new Civilization(createGame(seed,'continents'));
const initial={seed,worldType:game.s.type,at:game.s.time,cityCount:game.s.cities.length,ages:[...game.s.ages],settlers:game.s.settlers.map(s=>({team:s.team,c:s.c,r:s.r}))};
assert.equal(initial.at,0);assert.equal(initial.cityCount,0);assert.deepEqual(initial.ages,[0,0,0,0]);
let previousAges=[],bronzeAt={},captures=[],turn=0;
const MAX_TURN=Number(process.env.V219_MAX_TURN||275);
for(turn=1;turn<=MAX_TURN;turn++){
 previousAges=game.s.ages.slice();
 const candidateTeams=[1,2,3].filter(team=>previousAges[team]===1);
 const before=candidateTeams.length?JSON.stringify(game.s):null;
 for(let n=0;n<5;n++)game.tick(12);
 for(const team of [1,2,3]){
  if(game.s.ages[team]>=1&&bronzeAt[team]===undefined)bronzeAt[team]=turn;
  if(before&&previousAges[team]===1&&game.s.ages[team]>=2){
   const state=JSON.parse(before);
   const city=state.cities.filter(c=>c.team===team)
    .sort((a,b)=>(b.economy?.realms?.[team]?.pop||0)-(a.economy?.realms?.[team]?.pop||0))[0];
   if(city){const duration=turn-(bronzeAt[team]||turn);
    captures.push({team,turn:turn-1,bronzeAt:bronzeAt[team],duration,cityId:city.id,
     population:city.economy.realms[team].pop,state,reachedIron:true});}
  }
 }
 if(turn%20===0)console.log('V219 FRESH START AI',JSON.stringify({turn,ages:game.s.ages,cityCount:game.s.cities.length,bronzeAt,captures:captures.length}));
 if(captures.some(c=>c.duration>=30))break; // first *actual* final Bronze Age turn
}
if(!captures.length){
 // Never pretend an unfinished bronze game made it to iron.
 // A genuine 40+ bronze-turn stop is explicitly marked as late Bronze.
 for(const team of [1,2,3])if(game.s.ages[team]===1&&(turn-(bronzeAt[team]||turn))>=40){
  const state=JSON.parse(JSON.stringify(game.s));
  const city=state.cities.filter(c=>c.team===team).sort((a,b)=>b.economy.realms[team].pop-a.economy.realms[team].pop)[0];
  if(city)captures.push({team,turn,bronzeAt:bronzeAt[team],duration:turn-bronzeAt[team],
   cityId:city.id,population:city.economy.realms[team].pop,state,reachedIron:false});
 }
}
assert.ok(captures.length,'V219 newly generated map did not reach sufficiently late Bronze Age');
captures.sort((a,b)=>Number(b.reachedIron)-Number(a.reachedIron)||b.duration-a.duration||b.population-a.population);
const chosen=captures[0];
const state=takeOverAI(chosen.state,chosen.team);
state.demo='bronze-fresh-v219';state.winner=null;
const city=state.cities.find(c=>c.id===chosen.cityId);
assert.ok(city&&city.team===0);
state.cities.sort((a,b)=>a.id===chosen.cityId?-1:b.id===chosen.cityId?1:0);
const same=new Civilization(JSON.parse(JSON.stringify(state)));
const builds=same.allBuildings(city).filter(b=>b.hp>0&&!b.virtual);
const fort=new Set(['palisade','woodgate','stonewall','gatehouse','watchtower','stonetower','reinforced_wall']);
const meta={version:219,seed,initial,newMap:true,fromZero:true,priorSaveLoaded:false,organicAI:true,
 freeMaterialsAdded:0,age:state.ages[0],bronzeBeganAt:chosen.bronzeAt,bronzeTurns:chosen.duration,
 bronzeCompleted:chosen.reachedIron,capturedTurn:chosen.turn,cityId:city.id,cityName:city.name,
 originalTeam:chosen.team,population:city.economy.realms[0].pop,
 buildings:builds.length,fortifications:builds.filter(b=>fort.has(b.type)).length,
 upgradedHomes:builds.filter(b=>b.type==='house'&&b.houseUpgradeLevelV218).length,
 oldWallUpgrades:builds.filter(b=>b.wallUpgradeV184).length,
 roads:Object.keys(state.worldRoads||{}).length,
 phase:chosen.reachedIron?'final-bronze-turn-before-iron':'late-bronze-no-iron-yet',
 enginePatches:'V218.4 original wall repair and residential upgrades; V216 natural roads'};
assert.equal(state.ages[0],1,'takeover must remain in Bronze Age');
state.bronzeFreshV219=meta;
const verified=new Civilization(JSON.parse(JSON.stringify(state))),originalTime=verified.s.time;
verified.tick(12);assert.ok(verified.s.time>originalTime);
fs.writeFileSync('scenarios/bronze-fresh-v219.json',JSON.stringify(state));
fs.writeFileSync('scenarios/bronze-fresh-v219.manifest.json',JSON.stringify(meta,null,2)+'\n');
console.log('V219 BRAND NEW WORLD BRONZE AI TAKEOVER SUCCESS',JSON.stringify(meta));
