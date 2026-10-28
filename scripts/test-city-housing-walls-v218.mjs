import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Civilization,BUILDINGS} from '../civilization-core.js';
import {housingCapacity,HOUSE_CAPACITY} from '../labor.js';
import {houseUpgradeCostV218,houseInUpgradeZoneV218} from '../house-upgrade-v218.js';
import {insideOldRingV218,oldPerimeterStatusV218,rejectInsideOuterRingV218} from '../old-fortification-policy-v218.js';
import {planOuterRingV184,planWallUpgradesV184} from '../ai-defenses-v128.js';
const square=[{x:-35,z:-35},{x:35,z:-35},{x:35,z:35},{x:-35,z:35}];
assert.equal(insideOldRingV218({x:0,z:0},square),true);
assert.equal(insideOldRingV218({x:55,z:0},square),false);
assert.equal(rejectInsideOuterRingV218([{x:0,z:0}],square),true);
assert.equal(rejectInsideOuterRingV218([{x:55,z:0}],square),false);
assert.deepEqual(houseUpgradeCostV218({wood:15,stone:8}),{wood:8,stone:4});
const old={type:'palisade',x:0,z:0,ready:true,hp:100};
const ctx={c:5,r:7,economy:{buildings:[old,...Array.from({length:4},()=>({type:'house',ready:true,hp:100})),
{type:'well',ready:true,hp:100},{type:'market',ready:true,hp:100}]}};
const city={...ctx,team:1,outerRingV184:{slots:[{type:'palisade',x:45,z:0}],nextIndex:0},
 stoneDefensePlanV166:{slots:[{type:'palisade',x:0,z:0}],outlineV176:square},
 economy:{realms:{1:{pop:25,resources:{wood:500,stone:500,water:500,meat:500,gold:500}}}}};
let upgrades=0;
const dummy={s:{ages:{1:1},research:{1:{known:['stone_fortifications']}},time:1},
 allBuildings:()=>ctx.economy.buildings,contexts:()=>[ctx],
 defenseBuildingsV177:()=>ctx.economy.buildings,
 wallUpgradeOptionsV184:()=>({type:'stonewall',cost:{wood:5,stone:5}}),
 upgradeWallV184:()=>{upgrades++;old.type='stonewall';return {upgrade:true}},
 buildingDefinitions:{palisade:{cost:{wood:5}}},
 buildDefenseV177:()=>({building:{}})};
assert.equal(planOuterRingV184(dummy,1,city),false);
assert.equal(city.outerRingDiagnosticV184.reason,'old-wall-first');
assert.equal(planWallUpgradesV184(dummy,1,city),true);
assert.equal(upgrades,1);
assert.equal(oldPerimeterStatusV218(dummy,city).ready,true);
assert.equal(planOuterRingV184(dummy,1,city),true);
assert.equal(city.outerRingV184.nextIndex,1);
const s=JSON.parse(fs.readFileSync('scenarios/bronze-fresh-v217.json','utf8'));
const game=new Civilization(s),parent=game.s.cities.find(c=>c.id===s.bronzeFreshV217.cityId);
const main=game.contexts(parent).find(c=>c.c===parent.c&&c.r===parent.r);
const first=main.economy.buildings.find(b=>b.type==='house'&&b.ready&&b.hp>0&&
 houseInUpgradeZoneV218(parent,main,b,1));
assert.ok(first,'a real Sampola house must lie inside the historical old curtain');
const before=game.housing(parent),stock={...parent.economy.realms[parent.team].resources};
const preview=game.houseUpgradeOptionsV218(main,first);
assert.ok(!preview.error,preview.error);
assert.deepEqual(preview.cost,houseUpgradeCostV218(BUILDINGS.house.cost));
const purchased=game.upgradeHouseV218(main,first);
assert.equal(purchased.upgrade,true);
assert.equal(first.houseUpgradeLevelV218,1);
assert.equal(game.housing(parent)-before,HOUSE_CAPACITY);
for(const [key,cost]of Object.entries(preview.cost))assert.equal(parent.economy.realms[parent.team].resources[key],stock[key]-cost);
assert.ok(game.houseUpgradeOptionsV218(main,first).error,'cannot pay twice for one house');
const roundtrip=new Civilization(JSON.parse(JSON.stringify(game.s)));
const restored=roundtrip.s.cities.find(c=>c.id===parent.id);
assert.equal(roundtrip.housing(restored),game.housing(parent));
const outside={type:'house',x:55,z:0};
const mockParent={c:5,r:7,stoneDefensePlanV166:{outlineV176:square}};
assert.equal(houseInUpgradeZoneV218(mockParent,{c:5,r:7},outside,1),false);
assert.equal(houseInUpgradeZoneV218(mockParent,{c:5,r:7},outside,4),true);
assert.equal(houseInUpgradeZoneV218(mockParent,{c:6,r:7},outside,4),false);
console.log('V218 VERIFIED: repaired/stone-upgraded old ring before new; no interior ring; half-price house capacity doubles, region and save survive');
