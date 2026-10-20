import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {createAgeBuilding} from './buildings.js';
import {createBronzeBuilding,BRONZE_BUILDING_TYPES} from './bronze-buildings-v79.js?v=79a';
import {createBronzeDemoState,BRONZE_DEMO_NAME,BRONZE_DEMO_TYPES} from './bronze-demo-v79.js?v=79a';
import {Civilization} from './civilization-core.js?v=78a';
import {mkdirSync,writeFileSync} from 'node:fs';

const models=[];
for(const type of BRONZE_BUILDING_TYPES){
 const a=createAgeBuilding(type,0,1),b=createBronzeBuilding(type,0);
 assert.ok(a.userData.bronzeAgeModel,type+' must be new Bronze Age architecture');
 assert.equal(a.userData.age,1);assert.equal(a.userData.buildingType,type);
 assert.ok(a.children.length>0&&a.children.length<=17,'model uses material batching');
 assert.ok(a.userData.triangles>=150&&a.userData.triangles<6500,'bounded geometries: '+type+' '+a.userData.triangles);
 assert.ok(a.children.every((m,i)=>m.geometry===b.children[i]?.geometry),'same type shares GPU geometry');
 const size=new T.Box3().setFromObject(a).getSize(new T.Vector3());
 assert.ok(size.x>1.8&&size.z>1.5&&size.y>.9,'3D footprint: '+type);
 assert.ok(size.x<15&&size.z<14&&size.y<11,'fits city tile: '+type);
 models.push({type,triangles:a.userData.triangles,drawCalls:a.children.length,
  width:+size.x.toFixed(2),height:+size.y.toFixed(2),depth:+size.z.toFixed(2)});
}
for(const type of ['hall','house','lumber','market','quarry','fisher','barracks','harbor']){
 assert.equal(createAgeBuilding(type,0,0).userData.stoneAgeModel,true,'Stone Age still its own models');
 assert.notEqual(createAgeBuilding(type,0,2).userData.bronzeAgeModel,true,'Iron Age remains old model');
}
assert.equal(createBronzeBuilding('made_up_type',0),null);
const hall=models.find(x=>x.type==='hall'),house=models.find(x=>x.type==='house');
assert.ok(hall.height>house.height&&hall.width>house.width,'Bronze hall landmark distinct from ordinary homes');
const citySave=createBronzeDemoState();
assert.equal(citySave.version,4,'V4 saves unchanged');
assert.equal(citySave.cities.length,1);
assert.equal(citySave.cities[0].name,BRONZE_DEMO_NAME);
assert.equal(citySave.ages[0],1);
assert.ok(citySave.research[0].known.includes('bronze_crafts'),'real bronze unlock');
assert.ok(!citySave.research[0].known.includes('iron_crafts'),'not prematurely Iron Age');
const list=citySave.cities[0].economy.buildings;
assert.equal(list.length,BRONZE_DEMO_TYPES.length+1,'all preview structures ready');
assert.equal(new Set(list.map(b=>b.type)).size,BRONZE_BUILDING_TYPES.length);
assert.ok(list.every(b=>b.ready&&b.hp>0));
assert.ok(list.every(b=>b.type==='hall'||b.previewAge===1));
const engine=new Civilization(structuredClone(citySave));
assert.equal(engine.upgrade(0),1);
for(const b of engine.s.cities[0].economy.buildings){
 assert.equal(engine.buildingAge(b.team,b.type),1,'every displayed building is legally Bronze Age: '+b.type);
}
const nav=engine.nav(engine.s.cities[0]),visible=Object.keys(engine.s.cities[0].world.heat||{}).map(Number).filter(k=>nav.roadLevel(k)>0);
assert.ok(visible.length>=8,'market road demo should show repeated foot traffic from saved history');
assert.ok(nav.world.heatLast,'road wear stores clock and persists across reload');
mkdirSync('artifacts-v79',{recursive:true});
writeFileSync('artifacts-v79/Kuningriigid_V79_Pronksilinn.json',JSON.stringify(citySave));
writeFileSync('artifacts-v79/pronksiaja-mudelid.json',JSON.stringify(models,null,2));
console.log('V79 MODELS PASS '+JSON.stringify({types:models.length,minTriangles:Math.min(...models.map(x=>x.triangles)),
 maxTriangles:Math.max(...models.map(x=>x.triangles)),maxDrawCalls:Math.max(...models.map(x=>x.drawCalls))}));
console.log('V79 DEMO PASS '+JSON.stringify({city:BRONZE_DEMO_NAME,buildings:list.length,
 age:engine.upgrade(0),savedRoadCells:visible.length,version:citySave.version}));
