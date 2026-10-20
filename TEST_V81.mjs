import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {createRenaissanceBuilding,RENAISSANCE_BUILDING_TYPES} from './renaissance-buildings-v81.js?v=81a';
import {createAgeBuilding} from './buildings.js';
import {createRenaissanceDemoState,RENAISSANCE_DEMO_NAME,RENAISSANCE_DEMO_TYPES} from './renaissance-demo-v81.js';
import {Civilization,BUILDINGS} from './civilization-core.js?v=80c';
import {buildingClearance} from './navigation.js';
import {mkdirSync,writeFileSync} from 'node:fs';

const measures=[];
for(const type of RENAISSANCE_BUILDING_TYPES){
 const m=createAgeBuilding(type,0,4),other=createRenaissanceBuilding(type,0);
 assert.equal(m.userData.renaissanceAgeModel,true,'age 4 dedicated model '+type);
 assert.equal(m.userData.age,4);
 assert.equal(m.userData.buildingType,type);
 assert.notEqual(m,other,'every building has independent scene instance');
 assert.ok(m.children.length>0&&m.children.length<=19,'batch material draw calls '+type+' '+m.children.length);
 const unique=new Set(m.children.map(c=>c.material.uuid));
 assert.equal(unique.size,m.children.length,'one mesh per shared material '+type);
 const triangles=m.children.reduce((sum,o)=>sum+(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3,0);
 assert.equal(triangles,m.userData.triangles);
 assert.ok(triangles>130&&triangles<12000,'recognisable, mobile-bounded 3D mesh '+type+' '+triangles);
 assert.ok(m.children.every((c,i)=>c.geometry===other.children[i].geometry&&c.geometry.userData.shared),
  'geometry batches shared across multiple placements '+type);
 const box=new T.Box3().setFromObject(m),size=box.getSize(new T.Vector3());
 assert.ok(Number.isFinite(size.x)&&size.x>2&&size.y>1&&size.z>1);
 // Roof overhangs, awnings, pillars and front props must be protected by
 // V80's nav clearance; otherwise light-coloured paths can cross buildings.
 const clear=buildingClearance({type});
 if(clear&&type!=='harbor'){
  assert.ok(size.x/2<=clear.rx+1.2&&size.z/2<=clear.rz+1.2,
   'renaissance model overhangs registered V80 clearance: '+type+' '+JSON.stringify({size,clear}));
 }
 measures.push({type,triangles:Math.round(triangles),drawCalls:m.children.length,
  w:+size.x.toFixed(2),h:+size.y.toFixed(2),d:+size.z.toFixed(2)});
}
assert.equal(createRenaissanceBuilding('nonexistent'),null);
assert.equal(createRenaissanceBuilding('stonewall'),null,'walls retain orientable collision physics');
const hall=createAgeBuilding('hall',0,4),house=createAgeBuilding('house',0,4),
 observatory=createAgeBuilding('observatory',0,4),
 printer=createAgeBuilding('printer',0,4);
const getBox=m=>new T.Box3().setFromObject(m).getSize(new T.Vector3());
assert.ok(getBox(observatory).y>getBox(house).y+6,'telescope tower dominates skyline');
assert.ok(getBox(hall).y>getBox(house).y,'palace has its own recognisable skyline');
assert.ok(printer.userData.triangles!==hall.userData.triangles,'printing press and palace not identical geometry');
assert.ok(createAgeBuilding('hall',0,3).userData.medievalAgeModel===true,'medieval models preserved');
assert.notEqual(createAgeBuilding('hall',0,5).userData.renaissanceAgeModel,true,'industrial era unchanged');
const save=createRenaissanceDemoState();
assert.equal(save.version,4);
assert.equal(save.ages[0],4);
assert.ok(save.research[0].known.includes('renaissance'));
assert.ok(save.research[0].known.includes('printing'));
assert.ok(save.research[0].known.includes('astronomy'));
const city=save.cities.find(c=>c.team===0);
assert.equal(city.name,RENAISSANCE_DEMO_NAME);
assert.equal(city.economy.buildings.length,RENAISSANCE_DEMO_TYPES.length+1);
assert.ok(city.economy.buildings.every(b=>b.ready&&b.hp>0),'all demo city buildings built');
assert.ok(RENAISSANCE_DEMO_TYPES.every(t=>BUILDINGS[t]),'all showcase sites exist in game');
const g=new Civilization(structuredClone(save)),nav=g.nav(city),active=Object.keys(city.world.heat||{}).map(Number)
 .filter(i=>nav.roadLevel(i)>0);
assert.ok(active.length>=55,'full-fledged Renaissance demo road network');
for(const key of active){
 const p=nav.point(key);assert.ok(nav.open(p.x,p.z),'roads avoid blocked footprints');
}
const info={count:measures.length,age:4,models:measures,cityBuildings:city.economy.buildings.length,roadCells:active.length};
mkdirSync('artifacts-v81',{recursive:true});
writeFileSync('artifacts-v81/Kuningriigid_V81_Paikeselinna_testmang.json',JSON.stringify(save));
writeFileSync('artifacts-v81/renaissance-model-metrics.json',JSON.stringify(info,null,2));
console.log('V81 MODELS PASS '+JSON.stringify(measures));
console.log('V81 SAVE PASS '+JSON.stringify({age:4,city:city.name,buildings:city.economy.buildings.length,
 roads:active.length,research:save.research[0].known.filter(x=>['renaissance','printing','astronomy'].includes(x))}));
