import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Civilization} from '../civilization-core.js';
import {reserveStoneVillageRingV168} from '../stone-village-defenses-v166.js';
import {takeOverAI} from '../ai-takeover-v128.js';
const original=JSON.parse(fs.readFileSync('scenarios/ai-mountain-v176-start.json'));
const game=new Civilization(original),city=game.s.cities[0],team=city.team;
city.stoneDefenseReserveV168=reserveStoneVillageRingV168(game,city);
assert.equal(city.stoneDefenseReserveV168.version,177,'same founding site fits a complete ring');
assert.ok(city.stoneDefenseReserveV168.slots.filter(b=>b.type==='watchtower').length>=2);
console.log('V177 RESERVE',JSON.stringify({slots:city.stoneDefenseReserveV168.slots.length,towers:city.stoneDefenseReserveV168.slots.filter(b=>b.type==='watchtower').length}));
let best;
for(let turn=1;turn<=190;turn++){
 for(let step=0;step<5;step++)game.tick(12);
 const plan=city.stoneDefensePlanV166,local=game.defenseBuildingsV177(city);
 const ready=plan?.slots.filter(slot=>local.some(b=>b.hp>0&&b.ready&&b.type===slot.type&&Math.hypot(b.x-slot.x,b.z-slot.z)<(slot.drawnWallV175?1:4.5))).length||0;
 if(turn%10===0)console.log('V177 PROGRESS',JSON.stringify({turn,pop:city.economy.realms[team].pop,ready,total:plan?.slots.length,status:city.aiStoneDefenseStatusV166}));
 if(plan?.version===177&&ready===plan.slots.length){best={state:JSON.parse(JSON.stringify(game.s)),turn,ready};break;}
}
if(!best)fs.writeFileSync('/tmp/v177-incomplete.json',JSON.stringify(game.s));
assert.ok(best,'complete paid defense ring not finished');
const state=takeOverAI(best.state,team);state.demo='ai-mountain-v176';state.winner=null;
const c=state.cities[0],plan=c.stoneDefensePlanV166;
state.mountainTestV176={seed:state.seed,turn:best.turn,sourceTeam:team,targetCityId:c.id,targetCityName:c.name,origin:{c:c.c,r:c.r,x:c.economy.buildings[0].x,z:c.economy.buildings[0].z},mountain:{c:85,r:19},initialCities:1,initialPopulation:3,townStats:{turn:best.turn,age:state.ages[0],pop:c.economy.realms[0].pop,houses:c.economy.buildings.filter(b=>b.type==='house'&&b.ready).length,ready:best.ready,total:plan.slots.length,towers:plan.slots.filter(b=>b.type==='watchtower').length,gates:plan.gateOpenings},closedRingV177:true};
const proof=new Civilization(structuredClone(state));proof.tick(1);assert.ok(proof.s.time>state.time);
fs.writeFileSync('scenarios/ai-mountain-v176.json',JSON.stringify(state));fs.writeFileSync('scenarios/ai-mountain-v176.manifest.json',JSON.stringify({pass:true,...state.mountainTestV176,bytes:Buffer.byteLength(JSON.stringify(state))},null,2)+'\n');
console.log('V177 TAKEOVER PASS',JSON.stringify(state.mountainTestV176));
