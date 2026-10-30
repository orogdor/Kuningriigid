import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createStoneEquipment,createStoneLoad,STONE_EQUIPMENT_KINDS} from '../stone-equipment-v234.js';

function meshes(root){const out=[];root.traverse(o=>{if(o.isMesh)out.push(o)});return out;}
for(const kind of STONE_EQUIPMENT_KINDS){
 const root=createStoneEquipment(kind),items=meshes(root);
 assert.ok(items.length>=2,kind+' needs several detailed parts');
 assert.ok(items.every(o=>o.geometry.type!=='BoxGeometry'),kind+' must not contain box tools');
 assert.ok(items.every(o=>o.geometry.attributes.position?.count>0),kind+' has missing geometry');
 const size=new T.Box3().setFromObject(root).getSize(new T.Vector3());
 assert.ok(size.x>0&&size.y>0&&size.z>0,kind+' must have proper volume');
 assert.ok(size.y<2,kind+' does not fit the figure scale');
}
for(const kind of ['basket','jug','wood','sack','settler']){
 const ms=meshes(createStoneLoad(kind));
 assert.ok(ms.length>=3,kind+' should have a shaped container/load');
 assert.ok(ms.every(m=>m.geometry.type!=='BoxGeometry'),kind+' should not be a cube');
}
assert.equal(meshes(createStoneEquipment('stone_lumber'))[0].geometry,
 meshes(createStoneEquipment('stone_lumber'))[0].geometry,'equipment shares geometry');
console.log('V234 equipment geometry OK:',STONE_EQUIPMENT_KINDS.length,'types');
