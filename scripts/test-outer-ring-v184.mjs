import fs from 'node:fs';import assert from 'node:assert/strict';import {Civilization} from '../civilization-core.js';import {planOuterRingV184} from '../ai-defenses-v128.js';
// Controlled construction test: unlock the completed old ring, supply materials,
// and mark each finished segment ready. Production gameplay simulation is separate.
for(const kind of ['coast','mountain']){
 const s=JSON.parse(fs.readFileSync('scenarios/bronze-v183-'+kind+'.json')),g=new Civilization(s),city=g.s.cities.find(c=>c.id===s.bronzeTestV183.targetCityId);
 for(const ctx of g.contexts(city))for(const b of ctx.economy.buildings){if(b.type==='palisade')b.type='stonewall';if(b.type==='woodgate')b.type='gatehouse';if(b.type==='watchtower')b.type='stonetower';if(b.hp>0)b.ready=true;}
 const originalResources={...city.economy.realms[city.team].resources},originalPop=city.economy.realms[city.team].pop;city.economy.realms[city.team].pop=30;
 for(let i=0;i<100;i++){
  Object.assign(city.economy.realms[city.team].resources,{wood:120,stone:120,cutstone:100,water:100,meat:100,gold:999});
  planOuterRingV184(g,city.team,city);
  for(const ctx of g.contexts(city))for(const b of ctx.economy.buildings)if(b.outerRingV184)b.ready=true;
  if(city.outerRingDiagnosticV184?.reason==='complete')break;
 }
 assert.equal(city.outerRingDiagnosticV184?.reason,'complete',JSON.stringify(city.outerRingDiagnosticV184));
 assert.ok(city.outerRingV184.sharedFraction>.27&&city.outerRingV184.sharedFraction<.39);
 assert.equal(g.allBuildings(city).filter(b=>b.outerRingV184&&b.ready).length,city.outerRingV184.slots.length);
 city.economy.realms[city.team].resources=originalResources;city.economy.realms[city.team].pop=originalPop;g.s.demo='wall-v184-'+kind;g.s.wallTestV184={kind,targetCityId:city.id,controlled:true,sharedFraction:city.outerRingV184.sharedFraction};fs.writeFileSync('scenarios/wall-v184-'+kind+'.json',JSON.stringify(g.s));
 const reloaded=new Civilization(JSON.parse(JSON.stringify(g.s))),restored=reloaded.s.cities.find(c=>c.id===city.id);assert.equal(restored.outerRingV184.nextIndex,restored.outerRingV184.slots.length);
 console.log(kind,'outer ring',city.outerRingV184.slots.length,'shared',city.outerRingV184.sharedFraction);
}
