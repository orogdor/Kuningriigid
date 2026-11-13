// V348: animated town-light parts are drawn through instanced batches.
// Each instance must equal the world transform of the original part, and
// parts must disappear with their flame (daytime) exactly like before.
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createCityTorchesV235,updateCityTorchesV235,dayClockV235} from '../daynight-v235.js';
const buildings=Array.from({length:8},(_,i)=>({type:'house',x:i*14,z:(i%3)*11,hp:100,ready:true,buildingRotationV228:i*.4}));
const group=createCityTorchesV235(buildings,(x,z)=>x*.01+z*.02,{age:1});
const scene=new T.Scene();scene.add(group);
const batches=group.userData.partBatchesV348;
assert.ok(batches&&batches.count>0,'torch part batches exist');
const meshes=group.children.filter(o=>o.name==='Town light parts V348');
assert.equal(meshes.length,batches.count);
const night={...dayClockV235(0),torch:1},day={...dayClockV235(0),torch:0};
function check(clock,elapsed){
 updateCityTorchesV235(group,clock,elapsed);scene.updateMatrixWorld(true);
 const expected=[],inv=new T.Matrix4().copy(group.matrixWorld).invert();
 for(const model of group.userData.torchModelsV235){
  if(!model.flame.visible)continue;
  model.flame.traverse(o=>{if(o!==model.flame&&(o.isMesh||o.isSprite))expected.push(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld))});
 }
 const got=[],m=new T.Matrix4();
 for(const mesh of meshes)for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,m);got.push(m.clone());}
 // halo/pool are batched too; only compare flame parts by matching set membership
 for(const e of expected)assert.ok(got.some(g=>g.elements.every((v,k)=>Math.abs(v-e.elements[k])<1e-5)),'every visible flame part has an identical instance');
 return got.length;
}
const nightCount=check(night,1.25);assert.ok(nightCount>0,'night: flames drawn');
check(night,2.5); // animation moves parts; instances follow
const dayCount=check(day,3);assert.equal(dayCount,0,'day: no flame, halo or pool instances');
// Originals no longer reach the renderer.
for(const model of group.userData.torchModelsV235)model.flame.traverse(o=>{if(o!==model.flame&&(o.isMesh||o.isSprite))assert.equal(o.visible,false)});
batches.dispose();assert.equal(group.children.filter(o=>o.name==='Town light parts V348').length,0,'dispose removes batches');
console.log('PASS V348 torch part batches',{batches:meshes.length,nightInstances:nightCount});
