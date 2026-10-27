import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadAIMountainV176} from './ai-mountain-demo-v176.js';
import {Civilization} from './civilization-core.js';
import {bestStoneVillageWallPlan} from './stone-village-defenses-v166.js';
import {fieldCrossesWoodenRingV168} from './stone-fort-footprints-v168.js';
const state=JSON.parse(fs.readFileSync('scenarios/ai-mountain-v176.json'));
const start=JSON.parse(fs.readFileSync('scenarios/ai-mountain-v176-start.json'));
assert.equal(start.cities.length,1);assert.equal(start.cities[0].team,1);
assert.equal(start.cities[0].economy.realms[1].pop,3);
assert.equal(start.cities[0].economy.buildings.length,1,'normal founding hall, no free defenses/houses');
assert.ok(start.singleCityScenarioV176,'AI expansion capped to one city in this scenario');
const loaded=await loadAIMountainV176(async url=>{
 assert.ok(url.includes('ai-mountain-v176.json'));
 return {ok:true,json:async()=>structuredClone(state)};
});
const game=new Civilization(loaded),city=game.s.cities[0],test=loaded.mountainTestV176;
assert.equal(city.team,0);assert.equal(loaded.cities.length,1);
assert.ok(game.cell(test.mountain).mountain,'genuine mountain survives V4 load');
assert.ok(city.stoneDefensePlanV166.terrainBackedV176);
assert.equal(test.townStats.ready,test.townStats.total);
assert.ok(test.townStats.total>=30);
for(const slot of city.stoneDefensePlanV166.slots)assert.ok(game.defenseBuildingsV177(city).some(b=>b.type===slot.type&&b.ready&&b.hp>0&&Math.hypot(b.x-slot.x,b.z-slot.z)<(slot.drawnWallV175?1:4.5)),'every advertised defense really exists');
const before=loaded.time;game.tick(2);assert.ok(game.s.time>before,'player can resume');
assert.equal(city.team,0);
assert.equal(game.s.winner,null,'isolated snapshot is playable');
// Keep a founding mountain corridor stable as inner homes grow.
const reserved=structuredClone(start.cities[0].stoneDefenseReserveV168);
const original=new Civilization(structuredClone(start)),originalCity=original.s.cities[0];
const chosen=bestStoneVillageWallPlan(original,originalCity,originalCity.economy.buildings,original.s.seed);
assert.ok(chosen.closedRingV177,'legacy open reserve upgrades to a closed physical contour');
originalCity.stoneDefenseReserveV168=structuredClone(chosen);
assert.deepEqual(bestStoneVillageWallPlan(original,originalCity,originalCity.economy.buildings,original.s.seed).slots,chosen.slots,'new closed reservation remains stable');
// Ordinary building rules require six metres around an existing field.
// Protect that same margin even if the oriented thin wall would miss its crop rectangle.
const field={x:0,z:0,width:48,depth:32};
assert.equal(fieldCrossesWoodenRingV168(field,{slots:[{type:'palisade',x:29,z:0,wallAxis:1,palisadeSpanV167:7}]}),true);
await assert.rejects(()=>loadAIMountainV176(async()=>({ok:true,json:async()=>({version:4,cities:[]})})),/valideeritud/);
console.log('V176.1 MOUNTAIN TAKEOVER PASS',JSON.stringify({city:city.name,turn:test.turn,pop:test.townStats.pop,defenses:test.townStats.ready+'/'+test.townStats.total,mountain:test.mountain}));
