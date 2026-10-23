import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Civilization,TROOPS} from './civilization-core.js';
import {readyForNextEra,allowAIResearch} from './ai-development-v128.js';
import {TECHS} from './research.js';
const game=new Civilization(JSON.parse(fs.readFileSync('scenarios/ai-modern-v140.json')));
assert.ok(game.s.ages[0]>=6,'published takeover reached modernity');
for(let age=0;age<=6;age++){
 const state={...game.s,ages:[age],units:[],armies:[]};
 assert.equal(readyForNextEra(state,0,TROOPS),true,'no army minimum for science');
 for(const id of Object.keys(TECHS))assert.equal(allowAIResearch(state,0,id,TROOPS,TECHS),true);
}
console.log('V140/V141 PASS: authentic modern takeover loads; military-free academic eligibility across all ages');
