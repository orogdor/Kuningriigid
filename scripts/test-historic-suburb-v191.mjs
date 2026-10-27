import assert from 'node:assert/strict';
import {findOuterRingV184} from '../outer-ring-v184.js';
const r=35,n=32;
const outline=Array.from({length:n},(_,i)=>({x:r*Math.cos(i*2*Math.PI/n),z:r*Math.sin(i*2*Math.PI/n)}));
const walls=outline.map((a,i)=>{
 const b=outline[(i+1)%n],d=Math.hypot(b.x-a.x,b.z-a.z);
 return {type:'stonewall',hp:100,ready:true,x:(a.x+b.x)/2,z:(a.z+b.z)/2,
  wallAngleV175:-Math.atan2(b.z-a.z,b.x-a.x),palisadeSpanV167:d+1};
});
const city={defensePlanV139:{outlineV176:outline},c:0,r:0};
for(const terrainKind of ['plain','cliff']){
 const game={contexts:()=>[],defenseBuildingsV177:()=>walls,
  defenseTerrainKindV176:(_c,x,z)=>terrainKind==='cliff'&&z>70?'mountain':null,
  defenseTerrainPassableV177:(_c,x,z)=>terrainKind==='plain'||z<=70,
  previewDefenseV177:()=>({})};
 const p=findOuterRingV184(game,city);
 assert.ok(p,terrainKind+' should have a real buildable quarter');
 assert.equal(p.historicSuburbV191,true);
 assert.ok(p.plannedHousePlotsV191>=3);
 assert.ok(p.slots.length<=70);
 assert.ok(p.slots.length>=10);
 assert.ok(p.slots.every(s=>s.type==='palisade'));
 const unique=new Set(p.slots.map(s=>s.wallAngleV175.toFixed(2)));
 assert.ok(unique.size>=4&&unique.size<=8,'real polygonal curtain, not artificial micro-wiggles');
 assert.ok(p.areaEstimateV186>1200&&p.areaEstimateV186<10500);
 console.log(terrainKind,JSON.stringify({segments:p.slots.length,plots:p.plannedHousePlotsV191,area:Math.round(p.areaEstimateV186),angles:unique.size}));
}
