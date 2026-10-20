import assert from 'node:assert/strict';
import {availableLabor,automaticUIRefreshDue} from './gameplay-flow-v86.js';
import {allocateCity} from './labor.js';
import {Civilization,createGame,BUILDINGS} from './civilization-core.js';
import {selectAIBuild} from './ai-strategy.js';
assert.equal(availableLabor(20,true),15);assert.equal(availableLabor(3,true),3);assert.equal(availableLabor(20,true,4),11);
assert.equal(automaticUIRefreshDue(500,0,true,true),false);assert.equal(automaticUIRefreshDue(100,0,true),false);assert.equal(automaticUIRefreshDue(300,0,true),true);assert.equal(automaticUIRefreshDue(700,0,false),false);
function fixture(buildings,stock={},pop=8){
 const r={pop,resources:{wood:50,bread:0,water:0,...stock}},city={team:1,id:1,economy:{realms:[{},r]},basicJobs:{berries:1,wood:0,stone:0}};
 const game={s:{research:[{}, {ageWait:{missing:{machines:10}}}]},allBuildings:()=>buildings,buildingDefinitions:BUILDINGS};
 return {r,city,game};
}
const factory={type:'engineworks',ready:true,hp:100},hunter={type:'hunter',ready:true,hp:100},well={type:'well',ready:true,hp:100};
let f=fixture([factory,hunter,well]);allocateCity(f.game,f.city);
assert.equal(factory.assigned,0,'factories with no inputs cannot consume food workers');
assert.ok(hunter.assigned>0&&well.assigned>0,'food and water keep priority during an era wait');
f=fixture([{type:'lumber',ready:true,hp:100},{type:'study',ready:true,hp:100},{type:'house',ready:false,hp:100}],{},3);allocateCity(f.game,f.city);
assert.ok(f.city.basicAssigned.berries>=1,'emergency gathering keeps a worker when no food producer exists');
assert.ok(f.r.employed<=3+1e-7,'emergency gathering does not invent workers');
f.city.basicJobs.berries=0;allocateCity(f.game,f.city);assert.equal(f.city.basicAssigned.berries,0,'explicit player job limits are respected');
const g=new Civilization(createGame(8417)),a=g.s.settlers.find(a=>a.team===0);assert.equal(g.land(a.id),'');let city;
for(let x=-30;x<=30&&!city;x+=3)for(let z=-24;z<=24&&!city;z+=3)if(!g.siteRule(a,{x,z})){a.x=x;a.z=z;city=g.found(a.id).city;}
assert.ok(city);const first=selectAIBuild(g,0,city);assert.ok(first);const second=selectAIBuild(g,0,city,new Set([first.type]));assert.ok(!second||second.type!==first.type,'unplaceable top candidate does not block the entire build plan');
g.s.research[0].known.push('hunting');city.economy.realms[0].pop=6;city.economy.realms[0].resources.bread=0;
city.economy.buildings.push({type:'hunter',ready:true,hp:100,team:0,x:12,z:12});
assert.equal(selectAIBuild(g,0,city).type,'hunter','a growing food-starved city may add a second food source');
console.log('V86 REGRESSION PASS: shortage recovery, survival labour, input constraints, placement fallback and focused UI');
