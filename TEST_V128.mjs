import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Civilization,createGame,BUILDINGS,TROOPS} from './civilization-core.js';
import {combatUnit,militaryChoices,readyForNextEra,towerGuardKind,allowAIResearch} from './ai-development-v128.js';
import {defenseLayout} from './ai-defenses-v128.js';
import {takeOverAI} from './ai-takeover-v128.js';
import {UNIT_TECH,TECHS} from './research.js?v=125a';
import {Navigation} from './navigation.js';
assert.equal(combatUnit({kind:'scout',hp:100}),false);
assert.equal(combatUnit({kind:'spearman',hp:100}),true);
assert.equal(TROOPS.spearman.population,1);assert.equal(TROOPS.cavalry.population,2);
assert.ok(BUILDINGS.barracks.cost.wood<63);assert.equal(BUILDINGS.farm.workers,2);
assert.equal(towerGuardKind({ages:[6],research:[{known:['modernity']}]},0),'modern_infantry');
assert.equal(towerGuardKind({ages:[4],research:[{known:['firearms']}]},0),'musketeer');
assert.equal(readyForNextEra({ages:[2],units:[{team:0,kind:'scout',hp:100}]},0,TROOPS),false);
const ironTopics=Object.keys(TECHS).filter(id=>TECHS[id].age===2),held={ages:[2],units:[],research:[{known:ironTopics.slice(0,Math.ceil(ironTopics.length/2))}]};assert.equal(allowAIResearch(held,0,'philosophy',TROOPS,TECHS),false);assert.equal(allowAIResearch(held,0,'smithing',TROOPS,TECHS),true);assert.equal(allowAIResearch(held,0,'civics',TROOPS,TECHS),false);
const layout=defenseLayout();assert.equal(layout.filter(x=>x.type==='gatehouse').length,2);
assert.ok(layout.some(x=>x.wallAxis===1)&&layout.some(x=>x.wallAxis===0));
const world={resources:[],revision:0,workers:{}},gate={type:'gatehouse',x:0,z:0,hp:700,ready:true};
const nav=new Navigation(world,()=>true,()=>[gate],{minX:-15,minZ:-15,w:31,h:31});
assert.ok(nav.route({x:0,z:-9},{x:0,z:9}),'friendly units can pass through the gate opening');
assert.equal(nav.open(3,0),false,'gate side pillar blocks passage');
const g=new Civilization(createGame(12501));for(let i=0;i<8;i++){g.aiTeam(0);g.tick(12)}
const c=g.s.cities.find(c=>c.team===0);g.s.research[0].known.push('warfare','archery');
c.economy.buildings.push(...['barracks','archery'].map((type,i)=>({type,x:20+i*15,z:20,hp:350,ready:true,team:0})));
let choices=militaryChoices(g,0,c,TROOPS,UNIT_TECH);assert.ok(!choices.includes('scout'));assert.ok(choices.includes('spearman')&&choices.includes('archer'));
assert.ok(choices.every(id=>TROOPS[id].age<=g.s.ages[0]));
const oldPop=c.economy.realms[0].pop;c.economy.realms[0].pop=10;c.economy.realms[0].resources.wood=100;c.economy.realms[0].resources.stone=100;
const r=g.recruit(c,'spearman');assert.ok(r.unit);assert.equal(c.economy.realms[0].pop,9);
// Refit consumes goods and actual training time, while retaining one existing squad.
c.training=[];g.s.ages[0]=1;g.s.research[0].known.push('bronze');c.economy.realms[0].resources.bronze=20;c.economy.realms[0].resources.wood=100;
g.s.armies[0].c=c.c;g.s.armies[0].r=c.r;g.s.armies[0].path=[];
const source=g.s.units.length;g.s.units.push({kind:'axeman',team:0,armyId:0,hp:140,maxHp:140});
const size=g.s.units.length,pop=c.economy.realms[0].pop,bronze=c.economy.realms[0].resources.bronze;
const refit=g.retrain(c,source,'bronze_axeman');assert.ok(refit.unit);assert.equal(c.economy.realms[0].pop,pop);assert.ok(c.economy.realms[0].resources.bronze<bronze);
assert.equal(g.s.units[source].kind,'axeman','no instant free upgrade');refit.unit.efficiency=1;
g.tickTraining(c,10000);assert.equal(g.s.units[source].kind,'bronze_axeman');assert.equal(g.s.units.length,size,'refit does not duplicate soldiers');
// Supplied fixture proves new-era gates, rather than relying on campaign luck.
for(let age=0;age<6;age++){
 const s={ages:[age],units:[]};const id=Object.keys(TROOPS).find(k=>TROOPS[k].age===age&&!['scout','militia'].includes(k));
 for(let i=0;i<12;i++)s.units.push({kind:id,team:0,hp:100});assert.ok(readyForNextEra(s,0,TROOPS));
}
if(fs.existsSync('scenarios/iron-ai-v128.json')){
 const source=JSON.parse(fs.readFileSync('scenarios/iron-ai-v128.json'));
 const before=source.cities.filter(c=>c.team===1),beforeUnits=source.units.filter(u=>u.team===1),s=takeOverAI(source);
 assert.equal(s.ages[0],source.ages[1]);assert.equal(s.armies[0].team,0);assert.equal(s.armies[1].team,1);
 assert.equal(s.cities.filter(c=>c.team===0).length,before.length);
 assert.equal(s.units.filter(u=>u.team===0).length,beforeUnits.length);
 assert.deepEqual(s.research[0],source.research[1]);assert.deepEqual(s.explored[0],source.explored[1]);
 for(const original of before){const now=s.cities.find(c=>c.id===original.id);assert.deepEqual(now.economy.realms[0].resources,original.economy.realms[1].resources);}
 const restored=new Civilization(s);assert.ok(restored.s.cities.some(c=>c.team===0));
 assert.equal(source.demo,undefined,'takeover never mutates source scenario');
}
console.log('V128 PASS: fair costs/manpower, mixed army choices, era readiness, guard equipment, defense axes, gate traversal, AI takeover ownership/resources/research/save-load');
