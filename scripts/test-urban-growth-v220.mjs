import assert from 'node:assert/strict';
import fs from 'node:fs';
import {urbanGrowthPhaseV220,orderedHousingContextScoreV220,densityGroupsV220} from '../urban-growth-v220.js';
import {Civilization} from '../civilization-core.js';
import {suburbDemandV204} from '../outer-ring-v184.js';
const outline=[{x:-50,z:-50},{x:50,z:-50},{x:50,z:50},{x:-50,z:50},
 {x:-40,z:51},{x:0,z:52},{x:40,z:51},{x:-49,z:0}];
const homes=Array.from({length:9},(_,i)=>({type:'house',x:-30+(i%3)*20,z:-30+Math.floor(i/3)*20,hp:100,ready:true}));
const parent={c:40,r:50,team:1,stoneDefensePlanV166:{outlineV176:outline},
 economy:{buildings:homes,realms:{1:{pop:22}}}};
let x=urbanGrowthPhaseV220(parent,1);
assert.equal(x.phase,'renovate');
assert.equal(x.coreHouses,9);
for(let i=0;i<3;i++)homes[i].houseUpgradeLevelV218=1;
assert.equal(urbanGrowthPhaseV220(parent,1).phase,'suburb');
assert.equal(urbanGrowthPhaseV220(parent,0).phase,'core');
assert.equal(urbanGrowthPhaseV220(parent,1).upgradedHouses,3);
assert.equal(orderedHousingContextScoreV220(parent,parent,'suburb',0),65);
const dense={c:41,r:50,economy:{buildings:Array.from({length:6},()=>({type:'house',hp:100}))}};
const empty={c:40,r:51,economy:{buildings:[]}};
assert.ok(orderedHousingContextScoreV220(parent,dense,'suburb',0)<
 orderedHousingContextScoreV220(parent,empty,'suburb',0));
assert.equal(orderedHousingContextScoreV220(parent,dense,'core',32),32);
const chain=Array.from({length:13},(_,i)=>({x:i*18,z:0}));
const outsider=[{x:2000,z:0}];
assert.equal(densityGroupsV220([...outsider,...chain],62)[0].length,13);
parent.outerRingDiagnosticV184={reason:'complete'};
assert.equal(urbanGrowthPhaseV220(parent,1).phase,'fortified-suburb');
// Use the genuinely zero-start V219 map, do not invent fortifications.
const snapshot=JSON.parse(fs.readFileSync('scenarios/bronze-fresh-v219.json','utf8'));
assert.equal(snapshot.bronzeFreshV219.fromZero,true);
const game=new Civilization(snapshot);
const city=game.s.cities.find(c=>c.id===snapshot.bronzeFreshV219.cityId);
const natural=urbanGrowthPhaseV220(city,game.s.ages[city.team]);
const suburb=suburbDemandV204(game,city);
assert.equal(suburb.ready,suburb.cluster.length>=13);
const before=game.s.time;
game.tick(12);assert.ok(game.s.time>before);
console.log('V220 REAL CITY CHECK',JSON.stringify({city:city.name,phase:natural.phase,
 pop:natural.pop,core:natural.coreHouses,upgraded:natural.upgradedHouses,
 outside:suburb.count,cluster:suburb.cluster.length}));
console.log('V220 PHASES/DENSITY/REAL GAME TEST PASS');
