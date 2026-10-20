import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {createIndustrialBuilding,INDUSTRIAL_BUILDING_TYPES} from './industrial-buildings-v82.js?v=82a';
import {createAgeBuilding} from './buildings.js';
import {createIndustrialDemoState,INDUSTRIAL_DEMO_NAME,INDUSTRIAL_DEMO_TYPES} from './industrial-demo-v82.js';
import {createStoneDemoState} from './stone-demo-v77.js?v=80c';
import {createBronzeDemoState} from './bronze-demo-v79.js?v=80c';
import {createMedievalDemoState} from './medieval-demo-v80.js?v=80c';
import {createRenaissanceDemoState} from './renaissance-demo-v81.js?v=81a';
import {describeBuilding} from './building-inspector-v82.js';
import {Civilization,BUILDINGS,AGES} from './civilization-core.js?v=80c';
import {BUILD_TECH} from './research.js';
import {RESOURCE_NAMES} from './economy.js';
import {buildingClearance} from './navigation.js';
import {mkdirSync,writeFileSync} from 'node:fs';

const measures=[];
for(const type of INDUSTRIAL_BUILDING_TYPES){
 const a=createAgeBuilding(type,0,5),b=createIndustrialBuilding(type,0);
 assert.ok(a?.userData.industrialAgeModel,'industrial era must use new model '+type);
 assert.equal(a.userData.age,5);assert.equal(a.userData.buildingType,type);
 assert.notEqual(a,b,'different instances for scene entities');
 const triangles=a.children.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0);
 const calls=a.children.length;
 assert.ok(calls>0&&calls<=18,'shared material geometry batching '+type+' / '+calls);
 assert.ok(triangles>=100&&triangles<9000,'3D geometry budget '+type+' / '+triangles);
 assert.equal(triangles,a.userData.triangles);
 assert.ok(a.children.every((mesh,i)=>mesh.geometry===b.children[i].geometry),
  'share prepared 3D geometry '+type);
 assert.ok(a.children.every(mesh=>mesh.geometry.userData.shared),'shared geometry flag '+type);
 const bbox=new T.Box3().setFromObject(a),size=bbox.getSize(new T.Vector3());
 assert.ok(size.y>2&&size.x>3&&size.z>1.2,'visible non-flat industrial architecture '+type);
 assert.ok(size.x<14&&size.z<14,'bounded structure footprint '+type);
 measures.push({type,triangles,calls,size:[...size.toArray().map(n=>+n.toFixed(2))]});
}
assert.ok(measures.find(m=>m.type==='steelworks').size[1]>measures.find(m=>m.type==='house').size[1],
 'blast furnace and tall chimney silhouette must be visibly taller than housing');
for(const age of [0,1,3,4]){
 const model=createAgeBuilding('house',0,age);
 assert.notEqual(model.userData.industrialAgeModel,true,'no industrial buildings at age '+age);
}
assert.notEqual(createAgeBuilding('house',0,6).userData.industrialAgeModel,true,
 'modern era must preserve its independent models');

const demo=createIndustrialDemoState();
assert.equal(demo.version,4);
assert.equal(demo.ages[0],5);
assert.equal(demo.cities[0].name,INDUSTRIAL_DEMO_NAME);
const demoBuildings=demo.cities[0].economy.buildings;
assert.equal(demoBuildings.length,INDUSTRIAL_DEMO_TYPES.length+1);
for(const type of ['hall','steelworks','engineworks','polytechnic','railstation'])
 assert.ok(demoBuildings.find(b=>b.type===type&&b.ready),'sample showcases '+type);
const game=new Civilization(structuredClone(demo)),city=game.s.cities.find(c=>c.team===0),nav=game.nav(city);
const roadCells=Object.keys(city.world.heat||{}).map(Number).filter(key=>nav.roadLevel(key)>0);
assert.ok(roadCells.length>150,'industrial preview needs proper naturally worn road network');
for(const key of roadCells){
 const p=nav.point(key);
 assert.ok(nav.open(p.x,p.z),'saved industrial road must be navigable');
 for(const b of demoBuildings){
  const limits=buildingClearance(b);
  if(!limits)continue;
  assert.ok(Math.abs(p.x-b.x)>limits.rx||Math.abs(p.z-b.z)>limits.rz,
   'industrial streets must avoid buildings and loading platforms: '+b.type);
 }
}

const demos=[
 createStoneDemoState(),createBronzeDemoState(),createMedievalDemoState(),
 createRenaissanceDemoState(),demo
];
const agesSeen=[];
for(let age=0;age<demos.length;age++){
 const g=new Civilization(demos[age]),city=g.s.cities.find(c=>c.team===0);
 const building=city.economy.buildings.find(b=>b.type==='house');
 assert.ok(building,'there is a house to tap in era '+age);
 const info=describeBuilding(g,city,building,AGES,RESOURCE_NAMES,BUILDINGS,BUILD_TECH);
 assert.ok(info?.name&&info.status&&info.city&&info.eraName,'visible info for age '+age);
 assert.equal(info.age,[0,1,3,4,5][age]);
 assert.ok(info.hp>0&&info.maxHp>=info.hp);
 assert.ok(info.cost&&typeof info.input==='string');
 assert.ok(info.owner&&info.ready);
 agesSeen.push(info.eraName);
}
const building=city.economy.buildings.find(b=>b.type==='steelworks');
const work=describeBuilding(game,city,building,AGES,RESOURCE_NAMES,BUILDINGS,BUILD_TECH);
assert.equal(work.type,'steelworks');
assert.ok(work.technology,'tech needed to build industrial steelworks');
const temporary={...building,ready:false,progress:1,hp:100,materialsRemaining:22};
const inProgress=describeBuilding(game,city,temporary,AGES,RESOURCE_NAMES,BUILDINGS,BUILD_TECH);
assert.equal(inProgress.ready,false);assert.ok(inProgress.progress<100);
assert.equal(inProgress.materialsRemaining,22);
const opposing=describeBuilding(game,{...city,team:1},building,AGES,RESOURCE_NAMES,BUILDINGS,BUILD_TECH);
assert.equal(opposing.owner,false);
mkdirSync('artifacts-v82',{recursive:true});
writeFileSync('artifacts-v82/Kuningriigid_V82_Aurulinn.json',JSON.stringify(demo));
writeFileSync('artifacts-v82/industrial-model-metrics.json',JSON.stringify(measures,null,2));
console.log('V82 INDUSTRIAL MODELS PASS '+JSON.stringify({types:measures.length,minTriangles:Math.min(...measures.map(m=>m.triangles)),maxTriangles:Math.max(...measures.map(m=>m.triangles)),maxCalls:Math.max(...measures.map(m=>m.calls))}));
console.log('V82 MODEL INFO PASS all 5 age samples '+JSON.stringify(agesSeen));
console.log('V82 INDUSTRIAL DEMO PASS '+JSON.stringify({name:city.name,age:demo.ages[0],buildingCount:demoBuildings.length,roadCells:roadCells.length,safe:true}));
