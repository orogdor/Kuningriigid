import fs from 'node:fs';
import assert from 'node:assert/strict';
import {loadSecondWallTakeoverV205} from '../second-wall-takeover-v205.js';
import {Civilization} from '../civilization-core.js';
const fakeFetch=async filename=>({ok:true,json:async()=>
 JSON.parse(fs.readFileSync(filename.split('?')[0].replace(/^\.\//,''),'utf8'))});
for(const kind of ['coast','mountain']){
 const state=await loadSecondWallTakeoverV205('takeover-v205-'+kind,fakeFetch);
 const c=state.cities.find(c=>c.id===state.wallTakeoverV205.targetCityId);
 assert.equal(c.team,0,'player must control city');
 assert.equal(c.outerRingDiagnosticV184.reason,'complete');
 assert.ok(c.outerRingV184.slots.length>=10);
 assert.equal(c.outerRingV184.slots.length,c.outerRingV184.nextIndex);
 const game=new Civilization(state);
 const built=game.allBuildings(game.s.cities.find(x=>x.id===c.id))
  .filter(b=>b.outerRingV184&&b.hp>0);
 assert.equal(built.length,c.outerRingV184.slots.length);
 assert.ok(built.every(b=>b.ready));
 assert.equal(state.wallTakeoverV205.preparedTestState,true);
 assert.equal(state.demo,'takeover-v205-'+kind);
 console.log('V205 PLAYABLE TAKEOVER:',kind,JSON.stringify({
  city:c.name,wallSections:built.length,suburbArea:state.wallTakeoverV205.suburbArea,
  naturalBoundary:state.wallTakeoverV205.naturalBoundary
 }));
}
