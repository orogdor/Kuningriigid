import fs from 'node:fs';
import assert from 'node:assert/strict';
import {planWallUpgradesV184,planOuterRingV184} from '../ai-defenses-v128.js';
import {Civilization} from '../civilization-core.js';
const old=Array.from({length:5},(_,i)=>({type:'palisade',x:i*7,z:0,hp:100,ready:true}));
const ctx={c:2,r:2,economy:{buildings:old}};
const realm={pop:31,resources:{wood:1000,stone:1000,gold:1000,water:1000,meat:1000}};
const city={...ctx,team:1,builderCount:3,economy:{realms:{1:realm}},
 stoneDefensePlanV166:{slots:old.map(b=>({x:b.x,z:b.z,type:'palisade'})),
  outlineV176:[{x:-5,z:-5},{x:50,z:-5},{x:50,z:5},{x:-5,z:5}]},
 outerRingV184:{slots:[{type:'palisade',x:80,z:0}],nextIndex:0}};
let opened=0;
const game={s:{ages:{1:1},research:{1:{known:['stone_fortifications']}},time:12000},
 contexts:()=>[ctx],allBuildings:()=>ctx.economy.buildings,defenseBuildingsV177:()=>ctx.economy.buildings,
 wallUpgradeOptionsV184:(c,b)=>b.wallUpgradeV184?{error:'in-progress'}:{type:'stonewall',cost:{wood:5,stone:7}},
 upgradeWallV184:(c,b)=>{if(b.wallUpgradeV184)return {error:'in-progress'};
  realm.resources.wood-=5;realm.resources.stone-=7;
  b.wallUpgradeV184={targetType:'stonewall',progress:0,total:100};opened++;
  return {upgrade:b.wallUpgradeV184};}};
assert.equal(planWallUpgradesV184(game,1,city),true);
assert.equal(opened,3,'three builders may fund three separate upgrades');
assert.equal(realm.resources.wood,985);
assert.equal(realm.resources.stone,979);
assert.equal(planWallUpgradesV184(game,1,city),true);
assert.equal(opened,3,'must never exceed physical builder count');
assert.equal(planOuterRingV184(game,1,city),false);
assert.equal(city.outerRingV184.nextIndex,0,'active original-wall upgrades block the second ring');
for(const b of old)delete b.wallUpgradeV184;
assert.equal(planOuterRingV184(game,1,city),false);
assert.equal(city.outerRingDiagnosticV184.reason,'old-wall-first');
for(const id of ['a','b','c']){
 const s=JSON.parse(fs.readFileSync('scenarios/v220-city-'+id+'.json','utf8'));
 const m=s.v220City;
 assert.ok(m?.fromZero&&m.initial.at===0&&m.initial.cities===0);
 const probe=new Civilization(s),target=probe.s.cities.find(c=>c.id===m.cityId);
 const before=probe.s.time;
 probe.tick(12);assert.ok(probe.s.time>before);
 assert.ok(target.team===0);
 console.log('V220.1 REAL AI CITY',JSON.stringify({city:m.cityName,age:m.age,
  housesUpgraded:m.upgradedHouses,missing:m.oldWallMissing,wood:m.oldWallWooden,
  suburbanCluster:m.connectedSuburb}));
}
console.log('V220.1 PAID BUILDER-PARALLEL UPGRADES AND OLD-RING PRIORITY OK');
