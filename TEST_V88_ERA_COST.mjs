import assert from 'node:assert/strict';
import {ERA_MATERIALS,payEraCost,ageDeficit} from './era-economy.js';
const original={bronze:{wood:90,stone:70,bread:35},iron:{plank:100,stone:100,bread:60},civics:{iron:40,plank:150,bread:100},renaissance:{iron:70,plank:170},industrialization:{iron:100,plank:190,gunpowder:25},modernity:{steel:70,machines:35}};
for(const [id,cost] of Object.entries(original)){
 assert.deepEqual(ERA_MATERIALS[id],Object.fromEntries(Object.entries(cost).map(([k,v])=>[k,v/2])));
 const resources={...ERA_MATERIALS[id]},state={cities:[{team:0,economy:{realms:[{resources}]}}]};
 const key=Object.keys(resources)[0];resources[key]-=.25;const before={...resources};
 assert.equal(payEraCost(state,0,id).paid,false);assert.deepEqual(resources,before,'unaffordable payment is atomic');
 assert.equal(ageDeficit(state,0,id)[key],.25);resources[key]+=.25;
 assert.equal(payEraCost(state,0,id).paid,true);assert.ok(Object.values(resources).every(v=>v===0),'exact fractional payment');
}
console.log('V88 ERA COST PASS: all six transitions cost exactly 50%; atomic and fractional payments');
