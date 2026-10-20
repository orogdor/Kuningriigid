// Check the *rendered* street triangles against actual 3D mesh envelopes.
import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {createRenaissanceDemoState} from './renaissance-demo-v81.js';
import {Civilization} from './civilization-core.js?v=80c';
import {createAgeBuilding} from './buildings.js';
import {createDetailTrailLinks} from './detail-roads.js';

const s=createRenaissanceDemoState(),g=new Civilization(s),city=g.s.cities.find(c=>c.team===0);
const nav=g.nav(city);
const heat=Object.keys(city.world.heat||{}).map(Number).filter(i=>nav.roadLevel(i)>0);
const ribbons=createDetailTrailLinks(heat.map(key=>({key,heat:nav.roadStrength(key)})),nav,()=>0);
const boxes=[];
for(const b of city.economy.buildings){
 if(!b.ready||b.virtual)continue;
 const model=createAgeBuilding(b.type,b.team,g.buildingAge(b.team,b.type));
 const box=new T.Box3().setFromObject(model);
 boxes.push({type:b.type,minx:box.min.x+b.x,maxx:box.max.x+b.x,
   minz:box.min.z+b.z,maxz:box.max.z+b.z});
}
let vertices=0,collisions=0;
const sample=[];
for(const mesh of ribbons.children){
 const pos=mesh.geometry.getAttribute('position');
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i);vertices++;
  for(const b of boxes){
   if(x>=b.minx&&x<=b.maxx&&z>=b.minz&&z<=b.maxz){
    collisions++;
    if(sample.length<12)sample.push({type:b.type,x:+x.toFixed(2),z:+z.toFixed(2)});
    break;
   }
  }
 }
}
const totals={buildings:boxes.length,vertices,collisions,sample};
console.log('V81 ROAD VS 3D '+JSON.stringify(totals));
assert.equal(collisions,0,'rendered footpath triangles must not intrude under actual Renaissance roofs, awnings or props');
assert.ok(vertices>900,'demo actually has a citywide pedestrian road network');
console.log('V81 PHYSICAL ROAD CLEARANCE PASS');
