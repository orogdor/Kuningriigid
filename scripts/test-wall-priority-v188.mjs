import assert from 'node:assert/strict';
import {planOuterRingV184,planWallUpgradesV184} from '../ai-defenses-v128.js';
import {oldPerimeterStatusV218} from '../old-fortification-policy-v218.js';
const stock={gold:500,wood:500,stone:500,water:500,meat:500};
const old={type:'palisade',x:0,z:0,ready:true,hp:100};
const ctx={economy:{buildings:[old,...Array.from({length:4},()=>({type:'house',ready:true,hp:100})),
 {type:'well',ready:true,hp:100},{type:'market',ready:true,hp:100}]}};
const city={team:1,stoneDefensePlanV166:{slots:[{type:'palisade',x:0,z:0}],outlineV176:[]},
 outerRingV184:{slots:[{x:50,z:0,type:'palisade'}],nextIndex:0},
 economy:{realms:{1:{pop:25,resources:stock}}}};
let upgrades=0;
const game={s:{ages:{1:1},research:{1:{known:['stone_fortifications']}},time:1},
 contexts:()=>[ctx],allBuildings:()=>ctx.economy.buildings,defenseBuildingsV177:()=>ctx.economy.buildings,
 buildingDefinitions:{palisade:{cost:{wood:5}}},
 wallUpgradeOptionsV184:()=>({type:'stonewall',cost:{wood:5,stone:5}}),
 upgradeWallV184:()=>{upgrades++;old.type='stonewall';return {upgrade:true}},
 buildDefenseV177:()=>({building:{}})};
assert.equal(planOuterRingV184(game,1,city),false);
assert.equal(city.outerRingDiagnosticV184.reason,'old-wall-first');
assert.equal(planWallUpgradesV184(game,1,city),true);
assert.equal(upgrades,1);
assert.equal(oldPerimeterStatusV218(game,city).ready,true);
assert.equal(planOuterRingV184(game,1,city),true);
assert.equal(city.outerRingV184.nextIndex,1);
console.log('V218: old curtain upgraded BEFORE any paid exterior wall');
