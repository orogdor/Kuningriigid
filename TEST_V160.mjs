import assert from 'node:assert/strict';
import {prosperousTownGrowth,bronzeResearchGoals,bronzePhaseTurns,MIN_BRONZE_TURNS_V160} from './bronze-city-balance-v160.js';
import {settlerPolicy} from './growth-balance-v125.js';
import {BUILD_AGE} from './civilization-core.js';
import {BUILD_TECH,TECHS} from './research.js';
const stock={water:200,grain:100,meat:100,fish:100,bread:80,wood:150,stone:120};
const base={age:1,pop:20,stock,marketVarieties:3,housingFree:8};
assert.ok(prosperousTownGrowth(base)>=2,'prosperous Bronze city grows at least twice as fast');
assert.equal(prosperousTownGrowth({...base,stock:{...stock,water:0}}),1,'no growth cheat without water');
assert.equal(prosperousTownGrowth({...base,housingFree:0}),1,'no growth cheat without housing');
assert.equal(prosperousTownGrowth({...base,stock:{...stock,grain:0,meat:0,fish:0,bread:0}}),1,'no growth cheat without food');
assert.equal(prosperousTownGrowth({...base,age:0}),1,'Stone economy unchanged');
assert.equal(BUILD_AGE.gatehouse,1,'Bronze gates must be legal');
import {BUILDINGS} from './civilization-core.js';
for(const type of ['house','market','mason','stonewall','stonetower','gatehouse','farm','lumber']){
 assert.ok(BUILDINGS[type],type+' exists');
 for(const [resource,cost] of Object.entries(BUILDINGS[type].cost||{}))
  assert.ok(Number.isFinite(cost)&&cost>=0,type+' has finite, nonnegative '+resource+' cost: '+cost);
}
assert.equal(BUILDINGS.house.cost.wood,12,'V137 half-price timber homes preserved');
assert.equal(BUILDINGS.house.cost.plank,undefined,'No imaginary plank price on wooden homes');
assert.ok(BUILDINGS.market.cost.wood<=25,'Bronze markets must not consume the capital timber reserve');
assert.equal(BUILDINGS.gatehouse.cost.plank,0,'Bronze stone gates must not require processed planks');
assert.ok(BUILDINGS.lumber.rate>12,'Timber supply supports repeated Bronze houses');
assert.ok(BUILDINGS.stonewall.time<=20,'Bronze stonewall construction completes within a small fraction of a turn');
assert.ok(BUILDINGS.gatehouse.cost.cutstone<13,'Bronze gates do not consume all dressed stone');
assert.equal(BUILD_TECH.gatehouse,'stone_fortifications','gates require masonry technology');
const state={time:60*47,ages:[0,1],research:[{}, {completed:[{id:'bronze',time:60*40}]}]};
const goals=['writing','storage','commerce','stone_fortifications','iron','civics'];
const candidates=bronzeResearchGoals(state,1,TECHS,goals);
assert.ok(candidates.includes('stone_fortifications'),'Bronze technology remains researchable');
assert.ok(!candidates.includes('iron')&&!candidates.includes('civics'),'Iron era is deferred');
assert.equal(bronzePhaseTurns(state,1),7);
state.time=60*(40+MIN_BRONZE_TURNS_V160);
assert.ok(bronzeResearchGoals(state,1,TECHS,goals).includes('iron'),'Iron Age unlocked after Bronze development');
assert.equal(settlerPolicy({time:80*60,age:1,cities:2,pending:0,pop:17,food:140,lastAt:0,hasSettlement:true}).allow,false,'Bronze villages do not drain growing capital');
assert.ok(settlerPolicy({time:80*60,age:1,cities:2,pending:0,pop:32,food:140,lastAt:0,hasSettlement:true}).allow,'mature capital can settle a third site');
console.log('V160 PASS: accelerated stocked Bronze cities, independent research, Bronze gates, concentration and save-safe timers');
