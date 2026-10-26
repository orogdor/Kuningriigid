import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {WOOD_FORT_V1757,isHighWoodFortV1757} from './wood-fort-levels-v1757.js';
import {createAgeBuilding} from './buildings.js';
import {buildingWallProfileV1757,wallProfile} from './siege-rules-v114.js';
import {siegeSection} from './medieval-v62.js';
import {towerRoof} from './tower-garrison-v117.js';
import {wallHeight} from './fortifications.js';
import {wallPath} from './wall-walk-v111.js';
import {Navigation,buildingClearance} from './navigation.js';
const c=WOOD_FORT_V1757,near=(a,b)=>Math.abs(a-b)<.015;
const wallLow={type:'palisade',x:0,z:0,hp:420,ready:true};
const gateLow={type:'woodgate',x:0,z:0,hp:320,ready:true};
const wallHigh={...wallLow,woodFortTierV1757:2};
const gateHigh={...gateLow,woodFortTierV1757:2};
assert.equal(isHighWoodFortV1757(wallLow),false);
assert.equal(isHighWoodFortV1757(wallHigh),true);
assert.equal(towerRoof({type:'watchtower'}),c.walkHeight);
assert.equal(buildingWallProfileV1757(wallHigh).height,c.walkHeight);
assert.equal(buildingWallProfileV1757(gateHigh).height,c.walkHeight);
assert.equal(wallHeight(wallHigh),c.walkHeight);
assert.equal(wallHeight(gateHigh),c.walkHeight);
assert.equal(siegeSection({...wallHigh},1).height,c.walkHeight);
assert.equal(siegeSection({...gateHigh},2).height,c.walkHeight);
assert.equal(wallHeight(wallLow),wallProfile('palisade').height);
assert.equal(wallHeight(gateLow),wallProfile('woodgate').height);
function topSurface(t,x,z){
 const ray=new T.Raycaster(new T.Vector3(x,8.90,z),new T.Vector3(0,-1,0),0,8);
 const hits=ray.intersectObjects(t.children,true);
 assert.ok(hits.length,'must intersect a real deck');
 return hits[0].point.y;
}
const results=[];
for(const type of ['palisade','woodgate']){
 for(const tier of [1,2]){
  const model=createAgeBuilding(type,0,0,tier),bb=new T.Box3().setFromObject(model);
  const meshes=model.children.filter(x=>x.isMesh),triangles=meshes.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0);
  assert.ok(meshes.length>0&&meshes.length<=12,'optimized batched model needed');
  assert.ok(triangles<6000,'reasonable budget for mobile');
  if(tier===2){
   assert.ok(near(topSurface(model,0,-1.2),c.deckSurface),
    type+' level II deck should meet the tower fighting platform');
   assert.ok(bb.max.y>7.7&&bb.max.y<8.8,'high defense model should visually match 8.27m tower');
  }
  else assert.ok(bb.max.y<5.6,'low level I model must remain low');
  results.push({type,tier,meshes:meshes.length,triangles,maxY:+bb.max.y.toFixed(2)});
 }
}
const gate=createAgeBuilding('woodgate',0,0,2);
const through=new T.Raycaster(new T.Vector3(0,1.65,-5),new T.Vector3(0,0,1),0,10)
  .intersectObjects(gate.children,true);
assert.equal(through.length,0,'high gate must keep the 3.6m ground passage open');
const tower={index:0,x:0,z:0,tower:true,walkable:true,hp:300,height:towerRoof({type:'watchtower'})};
const siege={siegeSections:[tower,{...siegeSection({...wallHigh,x:6.9,z:0},1)},{...siegeSection({...gateHigh,x:13.8,z:0},2)}]};
assert.equal(wallPath(siege,tower,siege.siegeSections[2])?.length,3,
 'patrol graph must connect tower -> tall timber wall -> tall gate without a height jump');
assert.ok(buildingClearance(wallHigh).rz>buildingClearance(wallLow).rz,
 'high wooden walkway must extend ground clearance inward');
const world={resources:[],heat:{},heatLast:{}};
const nav=new Navigation(world,()=>true,()=>[wallHigh],{minX:-12,minZ:-12,w:25,h:25});
assert.equal(nav.open(0,-2),false,'footpath may not clip under the high wall gallery');
assert.equal(nav.open(0,-5),true,'outside ground remains walkable');
console.log('V175.7a SHARED HEIGHTS PASS',JSON.stringify({heights:c,results}));
