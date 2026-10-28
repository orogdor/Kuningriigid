import assert from 'node:assert/strict';
import {planOuterRingV184,planWallUpgradesV184} from '../ai-defenses-v128.js';
// A deliberately impossible extension must not disable upgrades forever.
const stock=()=>({gold:500,wood:500,stone:500,water:100,meat:100});
const oldWall={type:'palisade',ready:true,hp:100};
const homes=Array.from({length:4},()=>({type:'house',ready:true,hp:100}));
const services=[{type:'well',ready:true,hp:100},{type:'market',ready:true,hp:100}];
const city={team:1,outerRingPreviewOnlyV190:true,stoneDefensePlanV166:{slots:[{}],outlineV176:[]},economy:{realms:{1:{pop:25,resources:stock()}}}}; // V188 fallback test deliberately exercises planning when a V204 demand gate is bypassed
const ctx={economy:{buildings:[oldWall,...homes,...services]}};
let upgrades=0;
const game={
 s:{ages:{1:1},research:{1:{known:['stone_fortifications']}},time:1},
 allBuildings:()=>ctx.economy.buildings,contexts:()=>[ctx],
 wallUpgradeOptionsV184:()=>({type:'stonewall',cost:{wood:5,stone:5}}),
 upgradeWallV184:()=>{upgrades++;return {upgrade:true};},
 buildingDefinitions:{palisade:{cost:{wood:5}}}
};
for(let attempt=1;attempt<=3;attempt++){
 assert.equal(planOuterRingV184(game,1,city),false);
 assert.equal(city.outerRingSurveyFailuresV188,attempt);
 assert.equal(planWallUpgradesV184(game,1,city),attempt===3);
 game.s.time+=600;
}
assert.equal(upgrades,1,'upgrade fallback is allowed after 3 failed surveys');
// A funded, planned extension stays above stone upgrades even if stock runs low.
city.outerRingV184={slots:[{type:'palisade'}],nextIndex:0};
city.economy.realms[1].resources={gold:0,wood:0,stone:0,water:0,meat:0};
assert.equal(planOuterRingV184(game,1,city),true);
assert.equal(city.outerRingDiagnosticV184.reason,'saving-for-outer-ring');
assert.equal(planWallUpgradesV184(game,1,city),false);
assert.equal(upgrades,1);
// Finishing the new curtain releases the old wall for upgrades.
city.outerRingV184.nextIndex=1;
ctx.economy.buildings.push({type:'palisade',outerRingV184:true,ready:true,hp:100});
city.economy.realms[1].resources=stock();
assert.equal(planOuterRingV184(game,1,city),false);
assert.equal(city.outerRingDiagnosticV184.reason,'complete');
assert.equal(planWallUpgradesV184(game,1,city),true);
assert.equal(upgrades,2);
// V211: an advanced town with a permanently blocked exterior slot must
// still pay to improve its standing old wooden curtain.
city.outerRingV184.nextIndex=0;
ctx.economy.buildings=ctx.economy.buildings.filter(b=>!b.outerRingV184);
city.economy.realms[1].resources=stock();
game.s.ages[1]=5;
game.buildDefenseV177=()=>({error:'Teine hoone on liiga lähedal.'});
assert.equal(planOuterRingV184(game,1,city),false);
assert.equal(city.outerRingDiagnosticV184.reason,'Teine hoone on liiga lähedal.');
assert.equal(planWallUpgradesV184(game,1,city),true);
assert.equal(upgrades,3,'advanced city should not abandon old timber when extension is blocked');
console.log('V211: outer survey, paid wall priority and mature blocked-curtain upgrades OK');
