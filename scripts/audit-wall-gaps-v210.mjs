import fs from 'node:fs';
import {Civilization} from '../civilization-core.js';
import {planOuterRingV184,planWallUpgradesV184} from '../ai-defenses-v128.js';
const forts=new Set(['palisade','stonewall','reinforced_wall','woodgate','gatehouse','watchtower','stonetower']);
for(const kind of ['mountain','coast']){
 const s=JSON.parse(fs.readFileSync('scenarios/zero-v206-'+kind+'.json','utf8'));
 const g=new Civilization(s),city=g.s.cities.find(c=>c.id===s.zeroTestV206.targetCityId);
 const fortsAll=g.defenseBuildingsV177(city).filter(b=>b.hp>0&&forts.has(b.type));
 const plan=city.stoneDefensePlanV166||city.defensePlanV139,slots=plan?.slots||[];
 const closest=p=>fortsAll.map(b=>({b,d:Math.hypot(b.x-p.x,b.z-p.z)})).sort((a,b)=>a.d-b.d)[0];
 const missing=slots.filter(p=>{const n=closest(p);return !n||n.d>5.4;}).map(p=>{
  const n=closest(p);
  const near=fortsAll.map(b=>({type:b.type,x:Math.round(b.x),z:Math.round(b.z),
   d:Math.round(Math.hypot(p.x-b.x,p.z-b.z)*10)/10,angle:b.wallAngleV175,
   span:b.palisadeSpanV167,drawn:!!b.drawnWallV175})).sort((a,b)=>a.d-b.d).slice(0,3);
  return {slot:p,nearest:near,preview:g.previewDefenseV177(city,p).error};
 });
 const stuck=city.outerRingV184?.slots?.[city.outerRingV184.nextIndex||0];
 const wood=fortsAll.filter(b=>['palisade','woodgate','watchtower'].includes(b.type));
 const total=Object.fromEntries([...new Set(fortsAll.map(b=>b.type))].map(type=>[type,fortsAll.filter(b=>b.type===type).length]));
 console.log('AUDIT CITY',JSON.stringify({kind,name:city.name,age:s.ages[0],pop:city.economy.realms[0].pop,
  planslots:slots.length,missing:missing.length,missingExamples:missing.slice(0,12),
  built:fortsAll.length,types:total,wood:wood.length,
  outerPlan:city.outerRingV184&&{total:city.outerRingV184.slots.length,at:city.outerRingV184.nextIndex},
  stuckSlot:stuck&&{type:stuck.type,x:Math.round(stuck.x),z:Math.round(stuck.z),
    error:g.previewDefenseV177(city,stuck).error,
    near:fortsAll.map(b=>({type:b.type,x:b.x,z:b.z,d:Math.hypot(b.x-stuck.x,b.z-stuck.z),span:b.palisadeSpanV167,angle:b.wallAngleV175,drawn:!!b.drawnWallV175})).sort((a,b)=>a.d-b.d).slice(0,3),
    slot:stuck},
  diagnostics:{outer:city.outerRingDiagnosticV184,defense:city.aiDefenseDiagnosticV146}}));
 const before=wood.length;
 for(let i=0;i<6;i++)g.tick(12);
 const after=g.defenseBuildingsV177(city).filter(b=>b.hp>0&&['palisade','woodgate','watchtower'].includes(b.type)).length;
 console.log('AUDIT NEXT 6 TICKS',JSON.stringify({kind,woodBefore:before,woodAfter:after,
  outer:city.outerRingDiagnosticV184,wall:city.aiDefenseDiagnosticV184,
  builderJobs:city.builderAgents?.map(b=>b.job).slice(0,4)}));
}