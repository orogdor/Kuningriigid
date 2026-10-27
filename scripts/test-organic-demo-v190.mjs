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
 assert.equal(c.outerRingDiagnosticV184?.reason,'complete');
 assert.equal(c.outerRingV184.slots.length,s.wallTestV190.outerSegments);
 assert.ok(c.outerRingV184.areaEstimateV186>=2600,'V193 suburb must be materially larger than V192 on '+kind);
 assert.equal(s.demo,'wall-v190-'+kind);
 console.log(kind,JSON.stringify(s.wallTestV190));
}
