import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {spatialInstances,updateSpatialBatches} from '../spatial-batches-v86.js';

// V347 regression: stable bins/order, bit-identical GPU buffers, and legacy LOD semantics.
const geometry=new T.BoxGeometry(1,1,1),material=new T.MeshBasicMaterial();
const high=new T.SphereGeometry(1,6,4),low=new T.BoxGeometry(1,1,1);
const source=new T.InstancedMesh(geometry,material,1024);
source.name='spatial-v347-test';
source.userData.lodGeometries={high,low};
source.position.set(23,2,-17);
source.castShadow=true;
const matrix=new T.Matrix4(),color=new T.Color();
const expected=new Map();
for(let i=0;i<source.count;i++){
 const cx=(i*37)%45-23,cz=(i*19)%37-18;
 matrix.makeTranslation(cx*600+((i*5)%100),i%9,cz*600+((i*3)%100));
 source.setMatrixAt(i,matrix);
 color.setRGB((i%97)/96,(i%83)/82,(i%71)/70);
 source.setColorAt(i,color);
 const key=cx+':'+cz,ids=expected.get(key)||[];
 ids.push(i);expected.set(key,ids);
}
const originalMatrices=source.instanceMatrix.array.slice();
const originalColors=source.instanceColor.array.slice();
const out=spatialInstances(source,600);
const [whole,chunks]=out.children;
assert.equal(out.userData.chunkCount,expected.size);
assert.equal(out.userData.instanceCount,1024);
assert.equal(whole.visible,false);
assert.equal(whole.castShadow,false);
assert.equal(chunks.visible,true);
for(const [i,[key,ids]]of [...expected.entries()].entries()){
 const mesh=chunks.children[i],pos=key.split(':').map(Number);
 assert.equal(mesh.name,source.name+' '+key);
 assert.equal(mesh.userData.spatialCell,key);
 assert.equal(mesh.userData.spatialCenterX,(pos[0]+.5)*600);
 assert.equal(mesh.userData.spatialCenterZ,(pos[1]+.5)*600);
 assert.equal(mesh.count,ids.length);
 assert.equal(mesh.castShadow,true);
 for(let j=0;j<ids.length;j++){
  assert.deepEqual(Array.from(mesh.instanceMatrix.array.subarray(j*16,j*16+16)),Array.from(originalMatrices.subarray(ids[j]*16,ids[j]*16+16)));
  assert.deepEqual(Array.from(mesh.instanceColor.array.subarray(j*3,j*3+3)),Array.from(originalColors.subarray(ids[j]*3,ids[j]*3+3)));
 }
}
for(const [zoom,focus]of [[400,{x:0,z:0}],[639,{x:400,z:-300}],[640,{x:0,z:0}],[1000,{x:0,z:0}],[200,null],[3000,{x:0,z:0}],[3001,{x:0,z:0}]]){
 updateSpatialBatches(zoom,focus);
 assert.equal(whole.visible,zoom>3000);
 assert.equal(chunks.visible,zoom<=3000);
 if(zoom>3000)continue;
 const radius=Math.max(420,zoom*1.1);
 for(const mesh of chunks.children){
  const {spatialCenterX:x,spatialCenterZ:z}=mesh.userData;
  const dist=focus?Math.hypot(x-focus.x,z-focus.z):Infinity;
  const wanted=zoom<640&&dist<radius+600*.7?high:low;
  assert.strictEqual(mesh.geometry,wanted,'LOD '+zoom+' '+mesh.name);
 }
}
// Boundary-near distance must use the same LOD as Math.hypot.
const chunk=chunks.children[0],zoom=400,limit=Math.max(420,zoom*1.1)+600*.7;
for(const offset of [-1e-12,0,1e-12]){
 const focus={x:chunk.userData.spatialCenterX-limit+offset,z:chunk.userData.spatialCenterZ};
 updateSpatialBatches(zoom,focus);
 const dist=Math.hypot(chunk.userData.spatialCenterX-focus.x,chunk.userData.spatialCenterZ-focus.z);
 assert.strictEqual(chunk.geometry,dist<limit?high:low,'boundary');
}
const small=new T.InstancedMesh(geometry,material,31);
assert.strictEqual(spatialInstances(small,600),small);
console.log('V347 spatial-batches regression PASS; chunks='+chunks.children.length);
