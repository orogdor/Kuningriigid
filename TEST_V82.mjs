import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createIndustrialBuilding,INDUSTRIAL_BUILDING_TYPES} from './industrial-buildings-v82.js?v=82a';
import {createAgeBuilding} from './buildings.js';
import {createIndustrialDemoState,INDUSTRIAL_DEMO_NAME,INDUSTRIAL_DEMO_TYPES} from './industrial-demo-v82.js';
import {describeBuilding,INSPECTION_AGES} from './building-info-v82.js';
import {Civilization,BUILDINGS,BUILD_AGE,AGES} from './civilization-core.js?v=80c';
import {buildingClearance} from './navigation.js';

const metrics=[];
for(const type of INDUSTRIAL_BUILDING_TYPES){
 const a=createAgeBuilding(type,0,5),b=createIndustrialBuilding(type,0);
 assert.equal(a?.userData.industrialAgeModel,true,'industrial age 5 model '+type);
 assert.equal(a.userData.age,5);
 assert.equal(a.userData.buildingType,type);
 assert.ok(a.children.length>0&&a.children.length<=18,'low mobile draw-call count '+type);
 assert.ok(a.children.every((mesh,i)=>mesh.geometry===b.children[i]?.geometry
  &&mesh.geometry.userData.shared),'shared cached GPU geometry '+type);
 const triangles=a.children.reduce((n,m)=>n+(m.geometry.index?m.geometry.index.count:m.geometry.attributes.position.count)/3,0);
 assert.equal(triangles,a.userData.triangles);
 assert.ok(triangles>120&&triangles<12500,'complex but low-poly model '+type+' '+triangles);
 const bound=new T.Box3().setFromObject(a),size=bound.getSize(new T.Vector3());
 assert.ok(size.x>1&&size.y>1&&size.z>1,'visible industrial geometry '+type);
 const clearance=buildingClearance({type});
 if(clearance&&!['bridge','stonewall','palisade','reinforced_wall','harbor'].includes(type)){
  assert.ok(size.x/2<=clearance.rx+1.0&&Math.max(Math.abs(bound.min.z),Math.abs(bound.max.z))<=clearance.rz+1.0,
   'industrial props must fit V82 traffic exclusion zone '+type+
   ' '+JSON.stringify({width:size.x,depth:[bound.min.z,bound.max.z],clearance}));
 }
 metrics.push({type,triangles:Math.round(triangles),drawCalls:a.children.length,
  width:+size.x.toFixed(2),depth:+size.z.toFixed(2),height:+size.y.toFixed(2)});
}
assert.equal(createIndustrialBuilding('not-a-building'),null);
for(const age of [0,1,2,3,4,6]){
 const hall=createAgeBuilding('hall',0,age);
 assert.notEqual(hall.userData.industrialAgeModel,true,'do not overwrite age '+age+' appearance');
}
const dims=t=>new T.Box3().setFromObject(createIndustrialBuilding(t,0)).getSize(new T.Vector3());
assert.ok(dims('hall').y>dims('house').y,'industrial town hall must have iconic skyline');
assert.ok(dims('steelworks').y>dims('house').y,'industrial factory smokestacks are recognisable');
assert.ok(dims('railstation').z>dims('house').z,'railway platform visually extends beyond homes');

// Existing V4 data, existing technologies and every era share the inspector.
for(let age=0;age<AGES.length;age++){
 const def=BUILDINGS.house,building={type:'house',team:0,x:2,z:4,hp:257,ready:true,assigned:0};
 const prev=JSON.stringify(building);
 const info=describeBuilding(building,def,{age,name:def.name});
 assert.equal(info.age,age);assert.equal(info.ageName,INSPECTION_AGES[age]);
 assert.equal(info.name,def.name);assert.equal(info.health.hp,257);
 assert.ok(info.construction.cost.length>0);
 assert.equal(JSON.stringify(building),prev,'inspection is read-only');
 assert.equal(info.production.output,null,'houses do not falsely produce a resource');
 const wall=describeBuilding({type:'stonewall',team:0,x:0,z:0,hp:150,ready:true},BUILDINGS.stonewall||{},{age});
 assert.ok(wall,'walls can also be inspected');
}
const saw=describeBuilding({type:'saw',hp:200,ready:true,assigned:1.5,efficiency:.75},
 BUILDINGS.saw,{age:5});
assert.ok(saw.production.input.length>0);
assert.ok(saw.production.output?.quantity>0);
assert.ok(saw.workforce.assigned===1.5);
const underConstruction=describeBuilding({type:'bakery',ready:false,hp:100,progress:7,
 materialsRemaining:17,materialsTotal:40},BUILDINGS.bakery,{age:4});
assert.ok(underConstruction.underConstruction&&underConstruction.construction.timeLeft>0);
assert.equal(underConstruction.construction.materialsRemaining,17);
assert.equal(describeBuilding(null),null);
const save=createIndustrialDemoState(),city=save.cities.find(c=>c.team===0);
assert.equal(save.version,4);assert.equal(save.ages[0],5);
assert.equal(city.name,INDUSTRIAL_DEMO_NAME);
assert.equal(city.economy.buildings.length,INDUSTRIAL_DEMO_TYPES.length+1);
assert.ok(save.research[0].known.includes('industrialization'));
assert.ok(save.research[0].known.includes('steelmaking'));
assert.ok(save.research[0].known.includes('steam_engine'));
assert.ok(save.research[0].known.includes('industrial_education'));
assert.ok(save.research[0].known.includes('railways'));
const restored=new Civilization(structuredClone(save)),nav=restored.nav(city);
const streets=Object.keys(city.world.heat||{}).map(Number).filter(i=>nav.roadLevel(i)>0);
assert.ok(streets.length>=55,'industrially developed demo has connected roads');
assert.ok(streets.every(i=>nav.open(nav.point(i).x,nav.point(i).z)),'roads avoid buildings');
const buildings=city.economy.buildings.filter(b=>b.ready&&!b.virtual);
assert.ok(buildings.length>=39,'sample city with all industrial landmark classes');
assert.ok(buildings.some(b=>b.type==='steelworks')&&buildings.some(b=>b.type==='engineworks')&&
 buildings.some(b=>b.type==='polytechnic')&&buildings.some(b=>b.type==='railstation'));
mkdirSync('artifacts-v82',{recursive:true});
writeFileSync('artifacts-v82/Kuningriigid_V82_Suitsujoe_toostuslinn.json',JSON.stringify(save));
writeFileSync('artifacts-v82/industrial-model-metrics.json',JSON.stringify({models:metrics,streetCells:streets.length,buildings:buildings.length},null,2));
console.log('V82 MODELS PASS '+JSON.stringify({models:metrics.length,minTriangles:Math.min(...metrics.map(m=>m.triangles)),maxTriangles:Math.max(...metrics.map(m=>m.triangles)),maxDrawCalls:Math.max(...metrics.map(m=>m.drawCalls))}));
console.log('V82 INSPECTOR PASS '+JSON.stringify({eras:AGES.length,production:saw.production.output,construction:underConstruction.construction}));
console.log('V82 CITY PASS '+JSON.stringify({name:city.name,age:save.ages[0],buildings:buildings.length,roads:streets.length,saveVersion:save.version}));
