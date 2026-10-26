// V174/3.2c: existing traffic forms streets; construction faces them but cannot paint them.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {indexActiveStreetV174,closestActiveStreetV174,streetfrontScoreV174,courtyardScoreV174} from './streetfront-v174.js';
import {historicalBuildingPlots} from './historic-urban-v138.js';
import {wornStreetCellsV173,overlapsWornStreetV173} from './living-streets-v173.js';
import {createTownModelV154,houseVariantCount} from './town-models-v154.js';
import {Civilization} from './civilization-core.js';

const active=[{x:1,z:0},{x:1,z:1},{x:2,z:1},{x:0,z:0}],index=indexActiveStreetV174(active);
assert.equal(index.count,4);
assert.ok(closestActiveStreetV174(index,{x:1,z:8})<=8);
assert.ok(streetfrontScoreV174({x:1,z:9},index)<streetfrontScoreV174({x:1,z:28},index),
 'first street-facing vacant plots beat outlying vacant plots');
assert.equal(streetfrontScoreV174({x:1,z:9},index),streetfrontScoreV174({x:1,z:9},index),
 'same traffic => same lot scoring');
assert.equal(streetfrontScoreV174({x:1,z:9},indexActiveStreetV174([])),0,
 'no fake road appears in untouched village');
assert.ok(courtyardScoreV174({x:14,z:0},[{x:0,z:0},{x:16,z:15}])<0,
 'homes can assemble in two- and three-family courtyard groups');
assert.equal(courtyardScoreV174({x:14,z:0},[]),0);
assert.equal(courtyardScoreV174({x:14,z:0},[{x:200,z:200}]),0);

// Probe original V173 AI snapshot; the V174 planner must never alter trail heat
// merely to make attractive straight roads.
const s=JSON.parse(fs.readFileSync('scenarios/ai-stone-v173.json','utf8'));
const g=new Civilization(s),city=g.s.cities.find(c=>c.id===s.stoneTestV173.targetCityId);
assert.ok(city&&city.team===0);
const trail=wornStreetCellsV173(city.world,city.world.trailTime);
const idx=indexActiveStreetV174(trail);
assert.ok(idx.count>80,'real AI traffic already made visible local paths');
const before=JSON.stringify(city.world.heat),beforeLast=JSON.stringify(city.world.heatLast);
const plots=g.buildingSites(city,'house');
assert.ok(plots.length>35,'still enough buildable candidates after housing fronts align to roads');
assert.ok(plots.every(p=>!overlapsWornStreetV173(p,'house',trail)),
 'house lots never pave over living footpaths');
assert.equal(JSON.stringify(city.world.heat),before,'planner does not paint or erase living paths');
assert.equal(JSON.stringify(city.world.heatLast),beforeLast,'no clock reset or road aging changes');
assert.deepEqual(plots,g.buildingSites(city,'house'),'strictly deterministic on real save');

const model=(seed)=>createTownModelV154('house',0,0,seed);
const stats=(m)=>{const p=m.children[0].geometry.getAttribute('position');
 let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
 for(let i=0;i<p.count;i++){minX=Math.min(minX,p.getX(i));maxX=Math.max(maxX,p.getX(i));
 minZ=Math.min(minZ,p.getZ(i));maxZ=Math.max(maxZ,p.getZ(i));}
 return {vertices:p.count,minX,maxX,minZ,maxZ};};
const shapes=[];
for(let v=0;v<houseVariantCount(0);v++){
 const a=stats(model(v));shapes.push(a);
 assert.ok(a.vertices>0&&a.maxX<6.2&&a.minX>-6.2&&a.maxZ<5.6&&a.minZ>-5.2,'wattle/garden decorations fit within existing lot '+v);
}
const oldConfig=fs.readFileSync('roads.js','utf8');
assert.ok(oldConfig.includes('recordWorldStep'),'world roads must retain real traffic recording');
const nav=fs.readFileSync('navigation.js','utf8');
assert.ok(nav.includes('recordTraffic(from,to,weight=1)'),'local street wear remains based on movement');
assert.ok(nav.includes('pruneTrails()'),'disused lanes still fade');
console.log('V174 STREETFRONT AND COURTYARD PASS '+JSON.stringify({trackedTrailCells:trail.length,
 availablePlots:plots.length,variants:shapes.length,firstHouseVertices:shapes[0].vertices,
 meanCandidateStreetDistance:Math.round(plots.slice(0,16).reduce((n,p)=>n+Math.min(100,closestActiveStreetV174(idx,p)),0)/16)}));
