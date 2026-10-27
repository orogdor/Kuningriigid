import fs from 'node:fs';
import assert from 'node:assert/strict';
import {loadOrganicWallV190} from '../wall-demo-v184.js';
const fakeFetch=async filename=>({ok:true,json:async()=>{
 const actual=filename.split('?')[0].replace(/^\.\//,'');
 return JSON.parse(fs.readFileSync(actual,'utf8'));
}});
for(const kind of ['coast','mountain']){
 const s=await loadOrganicWallV190('wall-v190-'+kind,fakeFetch);

 const c=s.cities.find(x=>x.id===s.wallTestV190.targetCityId);
 console.log('natural-plan-survey',kind,JSON.stringify(c.naturalSurveyDiagnosticV195||{}));
 if(kind==='mountain'){
  const {Civilization}=await import('../civilization-core.js');
  const g=new Civilization(s),city=g.s.cities.find(x=>x.id===s.wallTestV190.targetCityId);
  const angles=Array.from({length:24},(_,i)=>i*Math.PI/12);
  const rays=angles.map(angle=>{
   for(let d=20;d<=225;d+=3){
    const x=Math.cos(angle)*d,z=Math.sin(angle)*d;
    const type=g.defenseTerrainKindV176(city,x,z);
    if(type==='mountain'||type==='water')return {direction:Math.round(angle*180/Math.PI),distance:d,kind:type};
   }
   return null;
  }).filter(Boolean);
  console.log('mountain survey radial hits',JSON.stringify(rays));
  const pts=city.stoneDefensePlanV166?.outlineV176||city.defensePlanV139?.outlineV176||[];
  console.log('inner outline extents',JSON.stringify({minX:Math.min(...pts.map(p=>p.x)),maxX:Math.max(...pts.map(p=>p.x)),minZ:Math.min(...pts.map(p=>p.z)),maxZ:Math.max(...pts.map(p=>p.z))}));
 }

 assert.equal(c.outerRingDiagnosticV184?.reason,'complete');
 assert.equal(c.outerRingV184.slots.length,s.wallTestV190.outerSegments);
 assert.ok(c.outerRingV184.areaEstimateV186>=2600,'suburb must stay larger than V192 on '+kind);
 assert.equal(c.outerRingV184.naturalBoundaryV194?.kind,kind==='coast'?'water':'mountain',
  kind+' must use its matching continuous natural barrier');
 const trace=c.outerRingV184.naturalBoundaryV194.trace;
 assert.ok(trace.length>=12);
 assert.ok(c.outerRingV184.naturalBoundaryV194.length>24);
 assert.equal(c.outerRingV184.slots.length,c.outerRingV184.nextIndex);
 const built=c.economy.buildings.concat(...Object.values(c.districts||{}).flatMap(d=>d.economy.buildings))
  .filter(b=>b.outerRingV184&&b.hp>0);
 assert.equal(built.length,c.outerRingV184.slots.length,'all physical curtain segments were built');

 assert.equal(s.demo,'wall-v190-'+kind);
 console.log(kind,JSON.stringify(s.wallTestV190));
}
