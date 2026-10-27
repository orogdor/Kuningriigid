import fs from 'node:fs';import assert from 'node:assert/strict';
import {Civilization}from'./civilization-core.js';import{Navigation}from'./navigation.js';import{insideDefenseV176}from'./terrain-defenses-v176.js';
import{roadCrossesWallV177,planRoadGatesV177}from'./road-gates-v177.js';import{visualSurface}from'./continuous-landscape.js';
const g=new Civilization(JSON.parse(fs.readFileSync('scenarios/ai-mountain-v176.json'))),city=g.s.cities[0],plan=city.stoneDefensePlanV166;
assert.ok(plan.closedRingV177);
const cliff=plan.naturalBarriersV176.find(b=>b.kind==='mountain'&&b.points.length);assert.ok(cliff,'cliff replaces the rear wall');
for(const endpoint of [cliff.points[0],cliff.points.at(-1)]){const ends=plan.slots.filter(s=>s.drawnWallV175).flatMap(s=>[-1,1].map(t=>({x:s.x+t*Math.cos(s.wallAngleV175)*s.palisadeSpanV167/2,z:s.z-t*Math.sin(s.wallAngleV175)*s.palisadeSpanV167/2})));assert.ok(Math.min(...ends.map(e=>Math.hypot(e.x-endpoint.x,e.z-endpoint.z)))<.5,'wall joins the mountain');}assert.ok(plan.slots.filter(s=>s.type==='watchtower').length>=4);
const buildings=g.defenseBuildingsV177(city).filter(b=>b.hp>0&&b.ready),hall=city.economy.buildings.find(b=>b.type==='hall');
assert.ok(buildings.some(b=>b.contextC!==city.c||b.contextR!==city.r),'paid ring continues into a neighbouring owned tile');
const bounds={minX:-250,minZ:-220,w:501,h:441},passable=(x,z)=>g.defenseTerrainPassableV177(city,x,z);
const seals=plan.gates.map(s=>({...s,type:'palisade',wallAngleV175:s.wallAngleV175??(s.wallAxis?Math.PI/2:0),palisadeSpanV167:7,hp:350}));
const closed=new Navigation({resources:[]},passable,()=>[...buildings,...seals],bounds),open=new Navigation({resources:[]},passable,()=>buildings,bounds);
let exits=0;
for(let z=-190;z<=190;z+=25)for(let x=-220;x<=220;x+=25){const p={x,z};if(insideDefenseV176(p,plan)||!open.open(x,z))continue;if(open.reachable(hall,p)){exits++;assert.equal(closed.reachable(hall,p),false,'closed wall/gates have no unplanned escape into another tile');}}
assert.ok(exits>0,'the deliberately open gates allow departure');
const tile=g.cell(g.s.mountainTestV176.mountain),boundary=tile.z-25;
let maxJump=0;for(let dx=-24;dx<=24;dx+=2)maxJump=Math.max(maxJump,Math.abs(visualSurface(g,tile.x+dx,boundary-.001,'detail')-visualSurface(g,tile.x+dx,boundary+.001,'detail')));
assert.ok(maxJump<.05,'mountain boundary has continuous visual height: '+maxJump);
assert.ok(roadCrossesWallV177({x:0,z:0,wallAngleV175:0},[{x:0,z:-6,strength:30},{x:0,z:6,strength:30}]));
assert.ok(roadCrossesWallV177({x:0,z:0,wallAngleV175:0},[{x:0,z:4,strength:30},{x:0,z:8,strength:30}]),'a strong approaching road needs a gate');
assert.equal(roadCrossesWallV177({x:0,z:0,wallAngleV175:0},[{x:0,z:-6,strength:1},{x:0,z:6,strength:1}]),false);
// A developed path upgrades a real, paid wall into a real paid gate.
const gateToRemove=g.allBuildings(city).find(b=>b.type==='woodgate'&&b.hp>0);gateToRemove.hp=0;
const existingGates=g.defenseBuildingsV177(city).filter(b=>['woodgate','gatehouse'].includes(b.type)&&b.hp>0);
const wall=buildings.find(b=>!existingGates.some(q=>Math.hypot(q.x-b.x,q.z-b.z)<22)&&b.type==='palisade'&&b.drawnWallV175&&!g.s.units.some(u=>u.garrison&&u.garrison.c===b.contextC&&u.garrison.r===b.contextR&&Math.hypot(u.garrison.x+(b.contextC-city.c)*225-b.x,u.garrison.z+(b.contextR-city.r)*195-b.z)<1)&&Math.hypot(b.x-hall.x,b.z-hall.z)>35),ctx=g.contextAt({c:wall.contextC,r:wall.contextR},false),a=wall.wallAngleV175;
for(const side of [-1,1]){const p=g.nav(ctx).nearest({x:wall.x-(ctx.c-city.c)*225+Math.sin(a)*side*6,z:wall.z-(ctx.r-city.r)*195+Math.cos(a)*side*6},4);assert.ok(p);const i=g.nav(ctx).index(p.x,p.z);ctx.world.heat[i]=60;ctx.world.heatLast[i]=g.s.time;}
const before=city.economy.realms[0].resources.wood;
city.nextRoadGateV177=0;
assert.equal(planRoadGatesV177(g,city),true,'AI orders a gateway where a developed trail crosses a curtain');
assert.ok(city.economy.realms[0].resources.wood<before,'gateway materials paid');
assert.ok(g.allBuildings(city).some(b=>b.replacedByRoadGateV177&&b.hp===0),'old segment retired only after successful gate placement');
console.log('V177 CLOSED RING, OWNED NEIGHBOUR, FOUR TOWERS, ROAD GATE AND CONTINUOUS CLIFF PASS',JSON.stringify({exitsChecked:exits,maxMountainJump:maxJump}));
