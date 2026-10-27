import assert from 'node:assert/strict';
import {organicSuburbCurveV189,findOuterRingV184} from '../outer-ring-v184.js';
import {wallStrokePlanV175} from '../wall-draw-v175.js';
const A={x:-45,z:0},B={x:45,z:0},pts=organicSuburbCurveV189(A,B,0,1,85,1);
assert.equal(pts.length,10);
assert.deepEqual(pts[0],A);assert.deepEqual(pts.at(-1),B);
assert.ok(pts.slice(2,-2).some(p=>p.z>70));
const line=wallStrokePlanV175(pts,'curved',100);
assert.equal(line.error,undefined);
assert.ok(new Set(line.segments.map(s=>s.wallAngleV175.toFixed(2))).size>10);
const outline=Array.from({length:32},(_,i)=>({x:35*Math.cos(i*Math.PI/16),z:35*Math.sin(i*Math.PI/16)}));
const walls=outline.map((a,i)=>{
 const b=outline[(i+1)%32],angle=-Math.atan2(b.z-a.z,b.x-a.x);
 return {type:'stonewall',ready:true,hp:100,x:(a.x+b.x)/2,z:(a.z+b.z)/2,
  wallAngleV175:angle,palisadeSpanV167:Math.hypot(b.x-a.x,b.z-a.z)+1};
});
const city={defensePlanV139:{outlineV176:outline}};
for(const kind of ['plain','cliff','sea']){
 const game={
  defenseBuildingsV177:()=>walls,
  defenseTerrainKindV176:(_city,x,z)=>z>66?(kind==='cliff'?'mountain':kind==='sea'?'water':null):null,
  defenseTerrainPassableV177:(_city,x,z)=>kind==='plain'||z<=66,
  previewDefenseV177:()=>({})
 };
 const p=findOuterRingV184(game,city);
 assert.ok(p,kind+' should find an extension');
 assert.ok(p.slots.length>=10);
 assert.ok(p.areaEstimateV186>320);
 assert.ok(p.sharedFraction>.16&&p.sharedFraction<.75);
 if(kind==='plain'){
  assert.equal(p.organicOutlineV189,true);
  assert.ok(p.boundaryV186.length>20,'irregular curtain needs a true curved contour');
  assert.ok(new Set(p.slots.map(s=>s.wallAngleV175.toFixed(2))).size>10);
 }else assert.ok(p.cliffBoundaryV186||p.waterBoundaryV187);
 console.log(kind,JSON.stringify({segments:p.slots.length,area:Math.round(p.areaEstimateV186),natural:p.cliffBoundaryV186||p.waterBoundaryV187,organic:p.organicOutlineV189}));
}
