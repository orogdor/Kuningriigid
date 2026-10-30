// V239: a scout stays a real Mesh, never hidden as source of an instanced batch.
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {SoldierBatch} from '../soldier-batch-v90.js';
import {GRAPHICS_DEFAULTS_V226,loadGraphicsSettingsV226,saveGraphicsSettingsV226} from '../graphics-settings-v226.js';
const parent=new T.Group(),batch=new SoldierBatch(parent);
function unit(name,direct){
 const g=new T.Group(),human=new T.Mesh(new T.BoxGeometry(.6,1.8,.25),new T.MeshStandardMaterial({color:0x856d44}));
 g.name=name;g.userData.noBatchV239=direct;g.add(human);parent.add(g);
 return {group:g,human};
}
const scout=unit('scout',true),soldier=unit('spearman',false);
batch.update([scout.group,soldier.group]);
assert.equal(scout.human.visible,true,'scout must remain directly rendered');
assert.equal(soldier.human.visible,false,'ordinary soldier is instanced');
assert.equal(batch.batches.length,1);
assert.equal(batch.batches[0].mesh.count,1,'only soldier is batched');
batch.update([scout.group]);
assert.equal(scout.human.visible,true);
assert.equal(soldier.human.visible,true,'leaving the batch restores direct mesh');
batch.update([scout.group,soldier.group]);
assert.equal(scout.human.visible,true);
assert.equal(batch.batches[0].mesh.count,1);
assert.equal(GRAPHICS_DEFAULTS_V226.soldierNames,true);
const data=new Map();
globalThis.localStorage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)??null};
saveGraphicsSettingsV226({...GRAPHICS_DEFAULTS_V226,soldierNames:false});
assert.equal(loadGraphicsSettingsV226().soldierNames,false,'persist names-off');
saveGraphicsSettingsV226({...GRAPHICS_DEFAULTS_V226,soldierNames:true});
assert.equal(loadGraphicsSettingsV226().soldierNames,true,'persist names-on');
console.log('V239: scout meshes and soldier name preferences PASS');
