import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {createAgeBuilding} from './buildings.js';
import {STONE_BUILDING_TYPES,createStoneBuilding} from './stone-buildings-v77.js?v=77a';
import {createStoneDemoState,DEMO_BUILDINGS,DEMO_CITY_NAME} from './stone-demo-v77.js';
import {Civilization,createGame} from './civilization-core.js';
import {mkdirSync,writeFileSync} from 'node:fs';
const forms=[];
for(const type of STONE_BUILDING_TYPES){
 const model=createAgeBuilding(type,0,0);
 assert.equal(model.userData.stoneAgeModel,true,'stone model is used: '+type);
 assert.equal(model.userData.buildingType,type);
 assert.ok(model.children.length<=16,'batched 3D model avoids excessive draw calls: '+type);
 let actualTriangles=0;const geometry=new Set(),materials=new Set();
 model.traverse(o=>{if(!o.isMesh)return;geometry.add(o.geometry);materials.add(o.material);
  actualTriangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;
  assert.ok(o.geometry.userData.shared,'shared cached mesh geometry');
 });
 assert.ok(actualTriangles>=180,'visible architectural detail: '+type);
 assert.ok(actualTriangles<=8000,'bounded stone age geometry: '+type+' = '+actualTriangles);
 assert.equal(actualTriangles,model.userData.triangles);
 const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3());
 assert.ok(size.x>2&&size.y>1&&size.z>1,'nonzero recognisable 3D shape: '+type);
 assert.ok(Math.max(size.x,size.z)<14,'fits typical 3D city building footprint');
 const second=createStoneBuilding(type,0);
 assert.ok(second.children.every((part,i)=>part.geometry===model.children[i].geometry),'same GL resources reused');
 assert.notEqual(second,model,'per-building scene instances are independent');
 forms.push({type,triangles:Math.round(actualTriangles),drawCalls:model.children.length,
   bounds:{width:+size.x.toFixed(2),height:+size.y.toFixed(2),depth:+size.z.toFixed(2)}});
}
assert.equal(createStoneBuilding('unknown',0),null);
assert.ok(forms.find(x=>x.type==='hall').bounds.height>forms.find(x=>x.type==='house').bounds.height,
 'chief hall must be taller than residence');
assert.ok(forms.find(x=>x.type==='cellar').bounds.height<forms.find(x=>x.type==='house').bounds.height,
 'subterranean cellar must be visibly lower than house');
for(const type of ['house','hall','warehouse','market','fisher']){
 const later=createAgeBuilding(type,0,1);
 assert.notEqual(later.userData.stoneAgeModel,true,'bronze-era model unaffected: '+type);
}
const demo=createStoneDemoState();
assert.equal(demo.version,4,'game save format untouched');
assert.equal(demo.ages[0],0,'sample city really Stone Age');
assert.equal(demo.cities.length,1,'one complete player city');
assert.equal(demo.cities[0].name,DEMO_CITY_NAME);
assert.equal(demo.cities[0].economy.buildings.length,DEMO_BUILDINGS.length+1);
assert.ok(demo.cities[0].economy.buildings.every(b=>b.ready&&b.hp>0),'all models immediately inspectable');
assert.equal(new Set(demo.cities[0].economy.buildings.map(b=>b.type)).size,STONE_BUILDING_TYPES.length,
 'the demo demonstrates all supported stone building categories');
assert.equal(demo.research[0].known.includes('bronze'),false,'demo does not skip Stone Age');
const replay=new Civilization(structuredClone(demo));
assert.equal(replay.s.cities[0].economy.buildings.length,DEMO_BUILDINGS.length+1,'V4 save reopens without changes');
assert.equal(replay.s.ages[0],0);
const standard=new Civilization(createGame(20261020));
assert.equal(standard.s.cities.length,0,'normal player game unaffected');
mkdirSync('artifacts-v77',{recursive:true});
writeFileSync('artifacts-v77/Kuningriigid_V77_Kivimetsa_testlinn.json',JSON.stringify(demo));
writeFileSync('artifacts-v77/building-metrics.json',JSON.stringify({version:'V77',models:forms},null,2));
console.log('V77 BUILDINGS PASS '+JSON.stringify(forms));
console.log('V77 SAVE PASS V4 ready Stone Age example city, all 13 models, no persistent save changes');
