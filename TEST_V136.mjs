import assert from 'node:assert/strict';
import fs from 'node:fs';
import {urbanTile,countyFootprint,countyTileLimit,MIN_CITY_SPACING} from './counties-v126.js';
import {Civilization,BUILD_AGE} from './civilization-core.js';
import {usefulDistrictTypes} from './ai-strategy.js';
for(const radius of [1,2,3,4]){
 for(const id of [0,2,9,31]){
  const city={id,c:70,r:70},urban=[];
  for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
   const p={c:city.c+dx,r:city.r+dz};if(urbanTile(city,p,radius))urban.push(p);
  }
  const square=(2*radius+1)**2;
  assert.ok(urban.length>=4*radius+1&&urban.length<square,'town border is non-square but has a functioning centre');
  for(const [dx,dz] of [[radius,0],[-radius,0],[0,radius],[0,-radius]])assert.ok(urbanTile(city,{c:city.c+dx,r:city.r+dz},radius),'cardinal access remains');
  const owned=new Set(urban.map(p=>p.c+':'+p.r)),found=new Set(),queue=[urban.find(p=>p.c===city.c&&p.r===city.r)];
  for(const p of queue){const key=p.c+':'+p.r;if(found.has(key))continue;found.add(key);for(const [dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]]){const q={c:p.c+dc,r:p.r+dr};if(owned.has(q.c+':'+q.r)&&!found.has(q.c+':'+q.r))queue.push(q);}}
  assert.equal(found.size,urban.length,'organic town remains connected');
  const county=countyFootprint(city,radius,()=>({land:true}));
  assert.equal(county.length,countyTileLimit(radius),'rural county population capacity unchanged');
 }
}
assert.equal(MIN_CITY_SPACING,17,'human city spacing unchanged');
assert.equal(BUILD_AGE.market,1,'market must not be ahistorically available during Stone Age');
assert.equal(BUILD_AGE.harbor,1,'shipyard starts at Bronze Age');
const g=new Civilization(JSON.parse(fs.readFileSync('scenarios/iron-ai-v129.json'))),team=1;
if(!g.s.research[team].known.includes('shipbuilding'))g.s.research[team].known.push('shipbuilding');
assert.ok(usefulDistrictTypes(g,team).has('harbor'),'AI searches for additional shoreline shipyards even if the realm has one');
console.log('V136 PASS: 16 connected curved centres, county growth, era constraints, persistent coastal harbor policy');
