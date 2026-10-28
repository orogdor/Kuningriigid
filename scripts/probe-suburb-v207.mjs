import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Civilization} from '../civilization-core.js';
import {suburbDemandV204,findOuterRingV184} from '../outer-ring-v184.js';
import {planOuterRingV184} from '../ai-defenses-v128.js';
const s=JSON.parse(fs.readFileSync('scenarios/zero-v206-mountain.json','utf8'));
assert.equal(s.zeroTestV206.initial.initialTime,0);
assert.equal(s.zeroTestV206.priorSaveLoaded,false);
const game=new Civilization(s),city=game.s.cities.find(c=>c.id===s.zeroTestV206.targetCityId);
const demand=suburbDemandV204(game,city);
console.log('V207 NATURAL OUTSIDE DENSITY',JSON.stringify({count:demand.count,cluster:demand.cluster.length,required:demand.required}));
assert.ok(demand.ready,'A 13-building continuous suburb must now be recognized without adding any buildings');
const plan=findOuterRingV184(game,city);
console.log('V207 NATURAL PLAN',JSON.stringify(plan?{
 slots:plan.slots?.length,area:plan.areaEstimateV186,
 protected:plan.protectedSuburbBuildingsV204,
 coast:plan.naturalBoundaryV194?.kind||null,
 geometry:plan.organicOutlineV189
}:{reason:'no viable outer wall',survey:city.historicSurveyDiagnosticV191,natural:city.naturalSurveyDiagnosticV195}));
assert.ok(plan?.slots?.length,'Must find a physical closed wall around the organically grown suburb');
assert.ok(plan.protectedSuburbBuildingsV204>=3);
for(let i=0;i<12;i++)planOuterRingV184(game,0,city);
console.log('V207 NEXT PAID AI DECISION',JSON.stringify({
 state:city.outerRingDiagnosticV184,
 queued:game.allBuildings(city).filter(b=>b.outerRingV184).length
}));
