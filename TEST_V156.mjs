// V156: detail-map ground cover (node) – budgets, clustering, and keep-out of roads and buildings.
import assert from 'node:assert/strict';
import {createGroundCoverV156,groundCoverBudgetV156} from './ground-detail-v156.js';
const tile={land:true,c:12,r:9,biome:'grassland'},flat=()=>0;
for(const q of ['low','medium','high']){
 const g=createGroundCoverV156(tile,flat,q);let tris=0,draws=0,inst=0;
 g.traverse(o=>{if(o.isInstancedMesh){draws++;inst+=o.count;tris+=o.count*o.geometry.attributes.position.count/3;}});
 assert.ok(draws<=16,`${q}: draw calls ${draws}`);assert.ok(tris<(q==='high'?260000:q==='medium'?140000:50000),`${q}: triangles ${tris}`);
 assert.ok(inst>groundCoverBudgetV156(q).grass*.5,`${q}: grass placed (${inst})`);
 console.log('V156',q,{draws,instances:inst,triangles:Math.round(tris)});
}
// keep-out: a road along x=0 and a building plot at (40,20)
const g=createGroundCoverV156(tile,flat,'high',{segments:[[0,-200,0,200,5]],rects:[[40,20,8,8]]}),m=new (await import('./vendor/three.module.js')).Matrix4();
g.traverse(o=>{if(!o.isInstancedMesh)return;for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);const x=m.elements[12],z=m.elements[14];
 assert.ok(Math.abs(x)>=5,'nothing grows on the road');assert.ok(!(Math.abs(x-40)<8&&Math.abs(z-20)<8),'nothing grows on the building plot');}});
// rivers and mountains: height -100 means "no cover here"
assert.equal(createGroundCoverV156(tile,()=>-100,'high').children.length,0);
console.log('V156 PASS');
