// V237 regressions: a ghost must never recolor real GLB materials; Stone Age
// crops at near and far distance must use the same procedural look.
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {setStonePreviewV237} from '../stone-near-lod.js';
import {nextStoneBatchLOD} from '../stone-next-buildings-v2235.js';
const original=new T.MeshStandardMaterial({color:'#ad8866',roughness:.85});
const make=()=>new T.Mesh(new T.BoxGeometry(1,1,1),original);
const real=make(),ghost=make();
const root=new T.Group(),lod=new T.LOD();
lod.addLevel(ghost,0);lod.userData.stoneNearLOD=true;root.add(lod);
setStonePreviewV237(root,'#9fc877');
assert.notEqual(ghost.material,original,'preview material must be cloned');
assert.equal(original.color.getHexString(),'ad8866','real building material must not be tinted');
assert.equal(real.material,original);
assert.equal(ghost.material.color.getHexString(),'9fc877');
assert.equal(ghost.material.opacity,.48);
assert.equal(ghost.material.depthWrite,false);
assert.equal(lod.userData.stonePreviewV237,true,'LOD must tag delayed meshes');
setStonePreviewV237(root,'#c26757');
assert.equal(original.color.getHexString(),'ad8866');
assert.equal(ghost.material.color.getHexString(),'c26757');
const incoming=make(); // late GLB fetch on the same shared material
setStonePreviewV237(incoming,lod.userData.previewColorV237,lod.userData.previewOpacityV237);
assert.notEqual(incoming.material,original);
assert.equal(incoming.material.color.getHexString(),'c26757');
assert.equal(original.color.getHexString(),'ad8866');
assert.equal(real.material.color.getHexString(),'ad8866');
const lateFar=make();setStonePreviewV237(lateFar,'#9fc877');
assert.notEqual(lateFar.material,original);
assert.equal(real.material.color.getHexString(),'ad8866');
const listRoot=new T.Group();
const multi=new T.Mesh(new T.BoxGeometry(1,1,1),[original,original]);
listRoot.add(multi);
setStonePreviewV237(listRoot,'#9fc877');
assert.ok(multi.material.every(m=>m!==original),'array materials isolated');
assert.equal(original.color.getHexString(),'ad8866');

const low=new T.Group();
const field=nextStoneBatchLOD(low,'field',0,31);
assert.ok(field.isLOD);
assert.equal(field.levels.length,2);
assert.equal(field.userData.fieldSourceV237,'matched near and far');
assert.equal(field.userData.fieldNearPlantsV237,552);
assert.equal(field.userData.fieldFarPlantsV237,192);
for(const level of field.levels){
 assert.equal(level.object.children.length,11,'same ground and eight furrows plus vegetation');
 assert.ok(level.object.children[9].isInstancedMesh);
 assert.ok(level.object.children[10].isInstancedMesh);
 assert.equal(level.object.children[0].material,field.levels[0].object.children[0].material);
}
const older=nextStoneBatchLOD(new T.Group(),'field',1,0);
assert.ok(!older.isLOD,'other eras keep their own field style');
console.log('V237 GLB preview isolation + farm/field LOD regressions PASS');
