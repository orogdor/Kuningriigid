// V175.6: geometry regression for the actual Stone/Bronze Age wooden tower.
// This test creates the same merged Three.js model used in the running game.
// No browser downloads, heavy simulation, or new parallel GitHub jobs.
import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {createAgeBuilding} from './buildings.js';
import {buildingClearance,Navigation} from './navigation.js';

function rayHits(model,origin,direction,max=12){
 const ray=new T.Raycaster(new T.Vector3(...origin),new T.Vector3(...direction));
 ray.near=0;ray.far=max;
 return ray.intersectObjects(model.children,true);
}
function checkTower(age,team){
 const tower=createAgeBuilding('watchtower',team,age);
 assert.ok(tower?.isGroup,'wooden watchtower must render as a 3D group');
 const meshCount=tower.children.filter(m=>m.isMesh).length;
 assert.ok(meshCount>0&&meshCount<=10,'shared-geometry model must stay cheap on phones: '+meshCount);
 const bbox=new T.Box3().setFromObject(tower);
 for(const dimension of ['x','z']){
  assert.ok(bbox.min[dimension]>-3.2&&bbox.max[dimension]<3.2,
   'visual model must stay inside original footprint on '+dimension);
 }
 assert.ok(bbox.min.y>=-.1,'tower should start at ground level');
 assert.ok(bbox.max.y>8.05&&bbox.max.y<8.6,'old tower and defender heights preserved');

 // These mid-height rays used to go straight through the original open
 // watchtower. Avoid floor beams, posts and intermediate platforms.
 const samples=[
  {name:'rear full timber wall',at:[1.1,5.05,-10],dir:[0,0,1]},
  {name:'left full timber wall',at:[-10,5.05,1.12],dir:[1,0,0]},
  {name:'right full timber wall',at:[10,5.05,1.12],dir:[-1,0,0]},
  {name:'front wall above door',at:[.1,4.10,10],dir:[0,0,-1]},
  {name:'front door slab at ground level',at:[.1,1.12,10],dir:[0,0,-1]},
  {name:'front wall beside door',at:[1.35,1.12,10],dir:[0,0,-1]},
  {name:'upper defensive parapet',at:[0,7.2,10],dir:[0,0,-1]}
 ];
 for(const {name,at,dir} of samples){
  const hits=rayHits(tower,at,dir);
  assert.ok(hits.length>0,name+' must not be visually open');
  assert.ok(hits[0].distance>5&&hits[0].distance<9,
   name+' front timber face must be on the original tower perimeter');
 }
 const vertical=rayHits(tower,[0,10,0],[0,-1,0]);
 assert.ok(vertical.length>0,'tower needs a continuous top floor');
 assert.ok(vertical[0].point.y>6.75&&vertical[0].point.y<7.10,
  'upper fighting deck must remain roofless and at defender height');
 const nominalDefenderY=7.25;
 assert.ok(nominalDefenderY-vertical[0].point.y<.55,
  'original tower defender anchor must still be close to platform');
 return {age,team,drawCalls:meshCount,triangles:tower.children.reduce((n,m)=>
  n+(m.isMesh?m.geometry.attributes.position.count/3:0),0),
  extent:bbox.getSize(new T.Vector3()).toArray().map(n=>+n.toFixed(2))};
}

const results=[checkTower(0,0),checkTower(0,1),checkTower(1,0)];
const footprint=buildingClearance({type:'watchtower',x:0,z:0,hp:350});
assert.deepEqual(footprint,{rx:4.7,rz:4.6},'tower gameplay footprint unchanged');
const towerB={type:'watchtower',x:0,z:0,hp:350,ready:true};
const nav=new Navigation({resources:[],heat:{},heatLast:{}},()=>true,()=>[towerB],
 {minX:-12,minZ:-12,w:25,h:25});
assert.equal(nav.open(0,0),false,'units cannot pass through tower');
assert.equal(nav.open(9,0),true,'outside walking area remains accessible');
console.log('V175.6 ENCLOSED WOODEN TOWER PASS '+JSON.stringify(results));
