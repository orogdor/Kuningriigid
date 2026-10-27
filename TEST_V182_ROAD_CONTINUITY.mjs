import fs from 'node:fs';import assert from 'node:assert/strict';
import {Civilization} from './civilization-core.js';import {createUnifiedRoadNetwork} from './continuous-landscape-visual.js';import {buildingClearance} from './navigation.js';
const state=JSON.parse(fs.readFileSync('scenarios/ai-stone-v174.json')),game=new Civilization(state),city=game.s.cities.find(c=>c.id===state.stoneTestV174.targetCityId),tile=game.cell(city);
function obstacles(){const out=[];for(const ctx of game.contexts(city))for(const b of ctx.economy.buildings){if(!b||b.virtual||b.hp<=0||b.type==='bridge')continue;const dx=(ctx.c-city.c)*225,dz=(ctx.r-city.r)*195,cl=buildingClearance(b);if(!cl)continue;if(['woodgate','gatehouse'].includes(b.type)){const wide=b.type==='woodgate'&&b.extendedPalisadeV166,side=wide?5.2:2.55,post=wide?1.6:1.35;for(const sign of [-1,1])out.push([b.x+dx+(b.wallAxis?0:sign*side),b.z+dz+(b.wallAxis?sign*side:0),b.wallAxis?.95:post,b.wallAxis?post:.95]);}else out.push([b.x+dx,b.z+dz,cl.rx,cl.rz]);}return out;}
let mesh=createUnifiedRoadNetwork(game,'detail',tile,obstacles());assert.ok(mesh.children.length);assert.deepEqual([...new Set(mesh.children[0].geometry.attributes.aLevel.array)],[1],'Stone Age highway is dirt at every traffic level');
for(let i=0;i<40;i++)game.tick(12);
mesh=createUnifiedRoadNetwork(game,'detail',tile,obstacles());const geo=mesh.children[0].geometry,pos=geo.attributes.position,index=geo.index.array;
let across=0;for(const old of city.economy.buildings.filter(b=>b.replacedByRoadGateV177)){
 const gate=city.economy.buildings.find(b=>b.type==='woodgate'&&b.ready&&b.hp>0&&Math.hypot(b.x-old.x,b.z-old.z)<.2);if(!gate)continue;
 const angle=gate.wallAngleV175||0,normal={x:Math.sin(angle),z:Math.cos(angle)},tangent={x:Math.cos(angle),z:-Math.sin(angle)};
 for(let j=0;j<index.length;j+=3){const pp=[0,1,2].map(k=>{const i=index[j+k],dx=pos.getX(i)-gate.x,dz=pos.getZ(i)-gate.z;return {across:dx*normal.x+dz*normal.z,along:dx*tangent.x+dz*tangent.z}});if(Math.min(...pp.map(p=>p.across))<-.1&&Math.max(...pp.map(p=>p.across))>.1&&pp.every(p=>Math.abs(p.along)<3)){across++;break;}}
}
assert.ok(across>=2,'rendered strategic roads join through the new gates');console.log('V182 ROAD DIRT AND GATE CONTINUITY PASS',JSON.stringify({gatesWithContinuousRoad:across}));
