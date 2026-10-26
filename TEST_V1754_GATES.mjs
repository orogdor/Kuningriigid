// V175.4: palisade solid everywhere except real gateways, even with
// arbitrary wall bend. New strokes cannot seal the settlement's exit.
import assert from 'node:assert/strict';
import {Navigation} from './navigation.js';
import {wallPointInsideV175,wallStrokePlanV175,
 wallCrossesGateOpeningV175} from './wall-draw-v175.js';
import {Civilization} from './civilization-core.js';
import fs from 'node:fs';
for(const axis of [0,1]){
 const gate={type:'woodgate',x:0,z:0,wallAxis:axis,
  extendedPalisadeV166:true,hp:350,ready:true};
 const segments=axis?[
  {type:'palisade',x:0,z:-11,wallAxis:1,palisadeSpanV167:14},
  {type:'palisade',x:0,z:11,wallAxis:1,palisadeSpanV167:14}
 ]:[
  {type:'palisade',x:-11,z:0,wallAxis:0,palisadeSpanV167:14},
  {type:'palisade',x:11,z:0,wallAxis:0,palisadeSpanV167:14}
 ];
 const buildings=[gate,...segments.map(b=>({...b,hp:350,ready:true}))];
 const world={resources:[],heat:{},heatLast:{},trailTime:0};
 const nav=new Navigation(world,()=>true,()=>buildings,
  {minX:-38,minZ:-38,w:77,h:77});
 assert.equal(nav.open(0,0),true,'gate centre remains walkable axis '+axis);
 assert.equal(nav.clear(axis?{x:-6,z:0}:{x:0,z:-6},
  axis?{x:6,z:0}:{x:0,z:6}),true,'gate crossing clear '+axis);
 assert.ok(nav.route(axis?{x:-6,z:0}:{x:0,z:-6},
  axis?{x:6,z:0}:{x:0,z:6}), 'soldiers route through gate '+axis);
 for(const b of buildings.slice(1))
  assert.equal(nav.open(b.x,b.z),false,'soldier blocked by palisade '+axis);
 const illegal={x:0,z:0,wallAngleV175:axis?Math.PI/2:0,palisadeSpanV167:7};
 assert.ok(wallCrossesGateOpeningV175(illegal,gate),'blocked gate detected '+axis);
 assert.ok(wallPointInsideV175({x:0,z:0},illegal));
 const legal={x:axis?0:10,z:axis?10:0,wallAngleV175:axis?Math.PI/2:0,
  palisadeSpanV167:7};
 assert.equal(wallCrossesGateOpeningV175(legal,gate),false,
  'legal side wall does not seal gate '+axis);
 const worn=JSON.stringify(world.heat);
 const route=nav.route(axis?{x:-6,z:0}:{x:0,z:-6},axis?{x:6,z:0}:{x:0,z:6});
 for(let i=1;i<route.length;i++)nav.recordTraffic(route[i-1],route[i],6);
 assert.ok(Object.keys(world.heat).length>0,'traffic marks the gate, '+axis);
 assert.equal(nav.open(0,0),true);
 assert.notEqual(JSON.stringify(world.heat),worn);
 for(const key of Object.keys(world.heat))
  assert.equal(nav.mask[key],1,'traffic cannot penetrate nearby walls, '+axis);
}
const s=JSON.parse(fs.readFileSync('scenarios/ai-stone-v174.json','utf8'));
const game=new Civilization(s),city=game.s.cities.find(c=>c.id===s.stoneTestV174.targetCityId);
const gates=city.economy.buildings.filter(b=>b.type==='woodgate'&&b.hp>0);
assert.ok(gates.length>=2,'real AI-built stone city has gates');
const nav=game.nav(city);
for(const gate of gates){
 assert.ok(nav.open(gate.x,gate.z),'existing V4 gate remains unblocked after load');
 const candidate={x:gate.x,z:gate.z,
  wallAngleV175:gate.wallAxis?Math.PI/2:0,wallAxis:gate.wallAxis||0,
  palisadeSpanV167:5,drawnWallV175:true};
 const rule=game.previewBuild(city,'palisade',candidate);
 assert.ok(rule.error,'do not construct a wall over an existing gate');
 assert.match(rule.error,/värava ava/,'gate opening is specifically protected');
}
const curved=wallStrokePlanV175([
 {x:-23,z:0},{x:-14,z:-7},{x:-5,z:-9},{x:3,z:-5},{x:13,z:2}
],'curved');
assert.ok(!curved.error&&curved.segments.length>=3,'curved walls still drawable');
console.log('V175.4 GATE PHYSICS PASS '+JSON.stringify({
 realGates:gates.length,curvedPieces:curved.segments.length,
 trafficStillGenerated:true,gateAperturesOpen:true}));
