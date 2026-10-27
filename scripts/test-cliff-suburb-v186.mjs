import assert from 'node:assert/strict';
import {findOuterRingV184} from '../outer-ring-v184.js';
const n=32,r=35,outline=Array.from({length:n},(_,i)=>({x:r*Math.cos(i*2*Math.PI/n),z:r*Math.sin(i*2*Math.PI/n)}));
const walls=outline.map((a,i)=>{const b=outline[(i+1)%n];return {type:'stonewall',ready:true,hp:100,x:(a.x+b.x)/2,z:(a.z+b.z)/2,wallAngleV175:-Math.atan2(b.z-a.z,b.x-a.x),palisadeSpanV167:Math.hypot(b.x-a.x,b.z-a.z)+1}});
const city={defensePlanV139:{outlineV176:outline}},game={defenseBuildingsV177:()=>walls,defenseTerrainKindV176:(_c,x,z)=>z>65?'mountain':null,defenseTerrainPassableV177:(_c,x,z)=>z<=65,previewDefenseV177:()=>({})};
const t=Date.now(),p=findOuterRingV184(game,city);assert.ok(p?.cliffBoundaryV186);assert.equal(p.slots.filter(s=>s.cliffEmbedStartV179||s.cliffEmbedEndV179).length,2);for(const wall of p.slots.filter(s=>s.cliffEmbedStartV179||s.cliffEmbedEndV179)){const end=wall.cliffEmbedStartV179?wall.from:wall.to;assert.ok(end.z>64.7&&end.z<=65.01);}
console.log(Date.now()-t,JSON.stringify({cliff:p?.cliffBoundaryV186,area:p?.areaEstimateV186,wall:p?.newLength,share:p?.sharedFraction,ends:p?.slots.filter(s=>s.cliffEmbedStartV179||s.cliffEmbedEndV179).length}));
