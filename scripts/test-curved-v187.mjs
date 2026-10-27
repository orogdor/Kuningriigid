import fs from 'node:fs';import assert from 'node:assert/strict';import {Civilization} from '../civilization-core.js';import {planOuterRingV184} from '../ai-defenses-v128.js';
for(const kind of ['coast','mountain']){
 const s=JSON.parse(fs.readFileSync('scenarios/bronze-v183-'+kind+'.json')),game=new Civilization(s),city=game.s.cities.find(c=>c.id===s.bronzeTestV183.targetCityId);
 for(const ctx of game.contexts(city))for(const b of ctx.economy.buildings)if(b.hp>0&&!b.ready)b.ready=true;
 city.economy.realms[city.team].pop=30;Object.assign(city.economy.realms[city.team].resources,{wood:120,stone:120,cutstone:100,water:100,meat:100,gold:999});
 const oldWood=game.allBuildings(city).filter(b=>b.ready&&b.type==='palisade').length;assert.ok(oldWood>0);
 assert.equal(planOuterRingV184(game,city.team,city),true,'should plan new wall before upgrading existing palisade');
 const plan=city.outerRingV184;assert.ok(plan?.slots.length);assert.ok(plan.slots.every(w=>w.type==='palisade'));
 if(!plan.cliffBoundaryV186&&!plan.waterBoundaryV187){const angles=plan.slots.map(s=>s.wallAngleV175);assert.ok(new Set(angles.map(a=>a.toFixed(2))).size>5,'outline must curve');}
 console.log(kind,JSON.stringify({segments:plan.slots.length,share:plan.sharedFraction,cliff:plan.cliffBoundaryV186,water:plan.waterBoundaryV187,first:city.outerRingDiagnosticV184}));
}
