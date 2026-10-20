import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {spatialInstances,updateSpatialBatches} from './spatial-batches-v86.js';
import {Navigation} from './navigation.js';
import {availableLabor,automaticUIRefreshDue} from './gameplay-flow-v86.js';
import {allocateCity} from './labor.js';
import {Civilization,createGame,BUILDINGS} from './civilization-core.js';
import {initialState,tickEconomy} from './economy.js';
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
const economy=initialState(1);economy.buildings=[{type:'engineworks',team:0,ready:true,hp:100,x:0,z:0}];tickEconomy(economy,.1,{assigned:()=>0});assert.match(economy.buildings[0].status,/^Ootab: /,'input shortages remain visible when labour is released');
const obstacles=[];const nav=new Navigation({resources:[]},(x,z)=>x!==0,()=>obstacles);
const left={x:-10,z:0},right={x:10,z:0};assert.equal(nav.reachable(left,right),false);assert.equal(nav.reachable(left,{x:-15,z:8}),!!nav.route(left,{x:-15,z:8}));
const openNav=new Navigation({resources:[]},()=>true,()=>obstacles);assert.ok(openNav.reachable(left,right));const oldVersion=openNav.componentVersion;obstacles.push({type:'house',x:-10,z:0});openNav.rebuild();openNav.reachable({x:-20,z:0},right);assert.notEqual(openNav.componentVersion,oldVersion,'reachability cache invalidates after construction');
const source=new T.InstancedMesh(new T.BoxGeometry(2,3,4),new T.MeshBasicMaterial(),40),matrix=new T.Matrix4(),color=new T.Color();
for(let i=0;i<40;i++){source.setMatrixAt(i,matrix.makeTranslation(i*100,0,i%2*100));source.setColorAt(i,color.setHex(i%2?0xff0000:0x00ff00));}
const chunks=spatialInstances(source);assert.equal(chunks.userData.instanceCount,40);assert.ok(chunks.userData.chunkCount>1);
const near=chunks.children[1];assert.equal(near.children.reduce((n,m)=>n+m.count,0),40);assert.ok(near.children.every(m=>m.boundingSphere&&m.frustumCulled),'each spatial draw has independent instance bounds');
updateSpatialBatches(4000);assert.equal(source.visible,true);assert.equal(near.visible,false);updateSpatialBatches(1000);assert.equal(source.visible,false);assert.equal(near.visible,true);
console.log('V86 REGRESSION PASS: shortage recovery, survival labour, input constraints, placement fallback and focused UI');
