import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Civilization,TROOPS} from './civilization-core.js';
import {readyForNextEra,allowAIResearch,combatUnit} from './ai-development-v128.js';
import {TECHS,nextResearchForGoals} from './research.js';
const game=new Civilization(JSON.parse(fs.readFileSync('scenarios/ai-modern-v140.checkpoint.json')));
const ages=game.s.ages;assert.deepEqual(ages,[0,3,3,3]);
for(const team of [1,2,3]){
 const r=game.s.research[team],army=game.s.units.filter(u=>u.team===team&&combatUnit(u));
 assert.ok(army.length>=7,'existing trained army has the medieval minimum');
 assert.equal(readyForNextEra(game.s,team,TROOPS),true,'old equipped squads no longer trap all science');
 assert.equal(allowAIResearch(game.s,team,'renaissance',TROOPS,TECHS),true,'renaissance can be reached with real old army');
 assert.equal(nextResearchForGoals(r,['renaissance','industrialization','modernity']),'renaissance','AI resumes its historical technology ladder');
}
const inadequate={...game.s,ages:[0,3,3,3],units:[{team:1,kind:'infantry',hp:100}]};
assert.equal(readyForNextEra(inadequate,1,TROOPS),false,'research gate still requires a defensive army');
console.log('V140 PASS: resume paid medieval research from real 607-turn checkpoint without injecting any technologies');
