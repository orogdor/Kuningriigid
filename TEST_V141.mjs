import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cityScience,scienceRate,discoveryUnlocked} from './science.js';
import {EDUCATION_TYPES,EDUCATION_BUILDINGS,EDUCATION_BUILD_TECH,KNOWLEDGE_BONUSES} from './education-v141.js';
import {TECHS,newResearch,tickResearch,grantTech,techBlock} from './research.js';
import {allowAIResearch,readyForNextEra} from './ai-development-v128.js';
import {Civilization,BUILDINGS,BUILD_AGE,TROOPS} from './civilization-core.js';
import {buildingCategory} from './build-catalog-v121.js';
const makeCity=(team,pop,buildings=[])=>({team,economy:{realms:Array.from({length:4},()=>({pop})),buildings},districts:{}});
const institution=type=>({type,ready:true,hp:350,team:0,efficiency:0});
const city=makeCity(0,10),state={cities:[city],research:[newResearch()],ages:[0],armies:[],units:[],difficulty:'normal'};
assert.equal(cityScience(city).base,10);assert.equal(scienceRate(state,0),10);
city.economy.buildings.push(institution('study'));assert.equal(scienceRate(state,0),15);
city.districts.test={economy:{buildings:[institution('library')]}};assert.equal(scienceRate(state,0),22.5);
state.research[0].known=['literacy'];assert.ok(Math.abs(scienceRate(state,0)-24.75)<1e-8);
city.districts.test.economy.buildings[0].disabled=true;assert.equal(scienceRate(state,0),16.5);
city.economy.buildings[0].ready=false;assert.equal(scienceRate(state,0),11);
city.economy.buildings[0].ready=true;city.economy.buildings[0].hp=0;assert.equal(scienceRate(state,0),11);
state.cities.push(makeCity(0,20));assert.equal(scienceRate(state,0),33);
state.strategyPacingV125=true;state.difficulty='hard';assert.equal(scienceRate(state,0),33,'no hidden city or difficulty science penalties');
state.cities.push(makeCity(1,999));assert.equal(scienceRate(state,0),33);
state.units=Array.from({length:100},()=>({team:0,kind:'motorized',hp:100}));state.armies=[{team:0},{team:0}];assert.equal(scienceRate(state,0),33);
assert.equal(discoveryUnlocked(state,0,'horsemanship'),false,'army size never gives a research Eureka');
state.ships=[{team:0,hp:100,type:'warship'}];assert.equal(discoveryUnlocked(state,0,'navigation'),false,'military fleets never give a research Eureka');
for(let age=0;age<=6;age++){
 state.ages[0]=age;state.units=[];assert.equal(readyForNextEra(state,0,TROOPS),true);
 for(const id of Object.keys(TECHS))assert.equal(allowAIResearch(state,0,id,TROOPS,TECHS),true,'all academic choices independent of army');
}
// Research advances with no army objects; adding armies cannot change progress.
const a={...state,cities:[makeCity(0,10)],research:[newResearch()],ages:[0],armies:[],units:[]};
a.research[0].active='stone_tools';const b=structuredClone(a);b.armies=[{team:0},{team:0}];b.units=[{team:0,kind:'motorized',hp:100}];
tickResearch(a,60);tickResearch(b,60);assert.equal(a.research[0].progress.stone_tools,10);assert.deepEqual(a.research,b.research);
for(const [id,definition]of Object.entries(EDUCATION_BUILDINGS)){
 assert.equal(BUILDINGS[id].name,definition.name);assert.equal(BUILD_AGE[id],TECHS[EDUCATION_BUILD_TECH[id]].age);
 assert.equal(buildingCategory(id),'science');assert.ok(Object.values(definition.cost).every(n=>n>0));
 const r=newResearch();assert.ok(techBlock(r,EDUCATION_BUILD_TECH[id]));grantTech(r,EDUCATION_BUILD_TECH[id]);assert.ok(r.known.includes(EDUCATION_BUILD_TECH[id]));
}
for(const id of Object.keys(KNOWLEDGE_BONUSES))assert.ok(TECHS[id],id);
assert.ok(EDUCATION_TYPES.includes('university'));
// Save/reload compatibility preserves progress and uses the same science formula.
const g=new Civilization(JSON.parse(fs.readFileSync('scenarios/ai-modern-v140.json')));
const saved=JSON.stringify(g.s);
const reloaded=new Civilization(JSON.parse(saved));assert.equal(scienceRate(g.s,0),scienceRate(reloaded.s,0));
const home=g.s.cities.find(c=>c.team===0);
for(const type of Object.keys(EDUCATION_BUILDINGS)){
 const tech=EDUCATION_BUILD_TECH[type];const oldAge=g.s.ages[0];
 g.s.ages[0]=BUILD_AGE[type]-1;assert.ok(g.buildRule(home,type),'building cannot precede its historical age');
 g.s.ages[0]=oldAge;grantTech(g.s.research[0],tech);
 assert.equal(TECHS[tech].age,BUILD_AGE[type]);
}
let placed=null;
for(const city of g.s.cities.filter(c=>c.team===0)){
 for(const ctx of g.contexts(city)){
  if(g.buildRule(ctx,'library'))continue;
  for(const at of g.buildingSites(ctx,'library').slice(0,256)){
   const before=scienceRate(g.s,0),wood=city.economy.realms[0].resources.wood;
   const result=g.build(ctx,'library',at);
   if(!result.building)continue;
   assert.equal(result.building.ready,false,'education requires real construction');
   assert.equal(city.economy.realms[0].resources.wood,wood-BUILDINGS.library.cost.wood,'actual materials paid');
   assert.equal(scienceRate(g.s,0),before,'unfinished library gives no science');
   const original=cityScience(city,g.s.research[0].known).total;
   result.building.ready=true;
   assert.ok(Math.abs(cityScience(city,g.s.research[0].known).total-original*1.5)<1e-6,'real completed library multiplies its parent city');
   result.building.disabled=true;assert.ok(Math.abs(cityScience(city,g.s.research[0].known).total-original)<1e-6);
   placed=result.building;break;
  }
  if(placed)break;
 }
 if(placed)break;
}
assert.ok(placed,'a library can actually be built in a saved AI city');
console.log('V141 PASS: resident science, multiplicative district education, discovery bonuses, no military gating/Eurekas, era-correct buildings, saved game compatibility');
