import assert from 'node:assert/strict';
import {Navigation} from './navigation.js';
import {roadLevel,recordWorldStep,roadStrength} from './roads.js';
import {createDetailTrailLinks} from './detail-roads.js';
import {createStoneDemoState} from './stone-demo-v77.js';
import {Civilization} from './civilization-core.js';
import {tickMarketHouseholds} from './builders.js';

const world={resources:[],heat:{},heatLast:{},trailTime:0,trailChanges:0,revision:0};
const nav=new Navigation(world, (x,z)=>Math.abs(x)<55&&Math.abs(z)<45);
const agent={x:-16,z:0,moving:false};
let prev={x:agent.x,z:agent.z},maxStep=0,steps=0;
function moveUntil(goal){
 for(let i=0;i<300;i++){
  const arrived=nav.move(agent,goal,.1,3);
  const dist=Math.hypot(agent.x-prev.x,agent.z-prev.z);maxStep=Math.max(dist,maxStep);
  assert.ok(dist<=.47,'walker must not teleport or jump between frames: '+dist);
  prev={x:agent.x,z:agent.z};steps++;
  if(arrived)return;
 }
 throw Error('walker did not reach destination '+JSON.stringify(goal));
}
moveUntil({x:16,z:0});
let before=Object.keys(world.heat).filter(k=>nav.roadLevel(Number(k))>0);
assert.equal(before.length,0,'one journey does not create visible road');
for(let i=0;i<9;i++){moveUntil({x:-16,z:0});moveUntil({x:16,z:0})}
const active=[...Object.keys(world.heat)].map(Number).filter(i=>nav.roadLevel(i)>0);
assert.ok(active.length>24,'repeated walking connects more than 24 contiguous road cells');
for(let x=-11;x<11;x++)assert.ok(nav.roadLevel(nav.index(x,0))>0,'no missing sections at x='+x);
const strip=createDetailTrailLinks(active.map(key=>({key,heat:nav.roadStrength(key)})),nav,()=>0);
assert.ok(strip.children[0].geometry.attributes.position.count>100,'3D path ribbon is generated');
assert.equal(world.trailChanges>30,true,'movement marks path geometry dirty');
const edges={worldRoads:{},time:0};
recordWorldStep(edges,{c:1,r:1},{c:2,r:1},'builder',0);
assert.equal(roadLevel(roadStrength(edges,{c:1,r:1},{c:2,r:1},0)),0,'one atlas crossing has no road');
for(let i=0;i<4;i++)recordWorldStep(edges,{c:2,r:1},{c:1,r:1},'builder',0);
assert.ok(roadLevel(roadStrength(edges,{c:1,r:1},{c:2,r:1},0))>=1,'repeated district trips form atlas road');

const state=createStoneDemoState();
const g=new Civilization(state),city=g.s.cities.find(c=>c.team===0);
const houses=city.economy.buildings.filter(b=>b.type==='house');
const market=city.economy.buildings.find(b=>b.type==='market');
assert.ok(houses.length>=3&&market);
market.assigned=1;
const visitors=new Map();
let moved=0,largest=0,firstStatus='',deliveries=0;
for(let tick=0;tick<460;tick++){
 g.s.time+=.1;
 tickMarketHouseholds(g,city,.1);
 for(const w of Object.values(city.world.workers||{}).filter(w=>w.kind==='market_woman')){
  if(!firstStatus)firstStatus=w.status;
  const old=visitors.get(w.workerKey);
  if(old){const dist=Math.hypot(w.x-old.x,w.z-old.z);largest=Math.max(dist,largest);if(dist>.001)moved++;
   assert.ok(dist<=.6,'market shopper jumped '+dist+' at tick '+tick+' '+w.workerKey);
  }
  visitors.set(w.workerKey,{x:w.x,z:w.z});
  if(w.shoppingPhase==='home'&&w.carried>0)deliveries++;
 }
}
assert.ok(visitors.size>=3,'all households have shopper actors');
assert.ok(moved>100,'shoppers take small continuous steps on the actual V77 city nav mesh');
assert.ok(largest<.6,'no >0.6m discontinuities for 100ms tick');
const heat=Object.values(city.world.heat||{});
assert.ok(heat.length>25,'the actual city records footprint wear along shopper routes');
console.log('V78 ROUTE PASS '+JSON.stringify({frames:steps,navCells:active.length,maxStep,roadTriangles:strip.children[0].geometry.attributes.position.count/3,worldRoadLevels:roadLevel(roadStrength(edges,{c:1,r:1},{c:2,r:1},0))}));
console.log('V78 MARKET PASS '+JSON.stringify({shoppers:visitors.size,continuousSteps:moved,maxStep:largest,carryingFrames:deliveries,trailCells:heat.length,initialStatus:firstStatus}));
