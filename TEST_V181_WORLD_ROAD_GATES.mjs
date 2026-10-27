import fs from 'node:fs';import assert from 'node:assert/strict';
import {Civilization} from './civilization-core.js';import {defenseRoadCellsV177,roadCrossesWallV177,planRoadGatesV177} from './road-gates-v177.js';
const original=JSON.parse(fs.readFileSync('scenarios/ai-stone-v174.json')),g=new Civilization(original),city=g.s.cities.find(c=>c.id===original.stoneTestV174.targetCityId),roads=defenseRoadCellsV177(g,city);
assert.ok(roads.some(p=>p.worldRoad),'strategic highway is detected');
const crossing=g.defenseBuildingsV177(city).filter(b=>b.type==='palisade'&&b.ready&&roadCrossesWallV177(b,roads));assert.ok(crossing.length>=3,'real screenshot scenario has missing highway gates');
const oldWood=city.economy.realms[0].resources.wood;
city.nextRoadGateV177=0;assert.ok(planRoadGatesV177(g,city));assert.ok(city.economy.realms[0].resources.wood<oldWood,'gate construction consumes wood');
for(let i=0;i<40;i++)g.tick(12);
const gates=g.defenseBuildingsV177(city).filter(b=>b.type==='woodgate'&&b.hp>0&&b.ready);
const upgraded=city.economy.buildings.filter(b=>b.replacedByRoadGateV177);assert.ok(upgraded.length>=3,'player takeover upgrades highway intersections');
for(const b of upgraded){const gate=gates.find(t=>Math.hypot(t.x-b.x,t.z-b.z)<.2);assert.ok(gate,'finished gate stands on replaced segment');const ctx=g.contextAt({c:gate.contextC,r:gate.contextR},false),nav=g.nav(ctx),dx=(ctx.c-city.c)*225,dz=(ctx.r-city.r)*195;assert.ok(nav.open(gate.x-dx,gate.z-dz),'gateway opening is walkable');const a=gate.wallAngleV175||0,normal={x:Math.sin(a),z:Math.cos(a)},p={x:gate.x-dx,z:gate.z-dz};assert.ok(nav.clear({x:p.x-normal.x*2,z:p.z-normal.z*2},{x:p.x+normal.x*2,z:p.z+normal.z*2}),'straight path through gate remains open');}

const saved=JSON.parse(JSON.stringify(g.s)),reloaded=new Civilization(saved),c=reloaded.s.cities.find(c=>c.id===city.id);
assert.ok(reloaded.defenseBuildingsV177(c).filter(b=>b.type==='woodgate'&&b.hp>0&&b.ready).length>=gates.length,'paid gates survive reload');
console.log('V181 WORLD ROAD GATES PASS',JSON.stringify({crossing:crossing.length,newGates:upgraded.length,totalGates:gates.length}));
