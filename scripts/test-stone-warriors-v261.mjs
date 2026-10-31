// V261 fast regressions: GLB body has a valid 17-bone skin and all three
// Stone Age fighters use the actual skinned rig rather than exploded V259 meshes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root));
const js=p=>read(p).toString('utf8');
const binary=read('models-stone-near/human_far.glb');
assert.equal(binary.toString('utf8',0,4),'glTF');
assert.equal(binary.readUInt32LE(8),binary.length);
const size=binary.readUInt32LE(12);
const json=JSON.parse(binary.toString('utf8',20,20+size));
assert.equal(json.skins?.length,1);
assert.equal(json.skins[0].joints.length,17);
const prim=json.meshes[0].primitives[0];
assert.notEqual(prim.attributes.POSITION,undefined);
assert.notEqual(prim.attributes.JOINTS_0,undefined);
assert.notEqual(prim.attributes.WEIGHTS_0,undefined);
assert.ok(json.accessors[prim.attributes.POSITION].count>=1000);
const rig=js('stone-warriors-v261.js');
for(const kind of ['axeman','spearman','slinger'])assert.ok(rig.includes("'"+kind+"'"));
for(const key of ['createStoneHuman','animateStoneWorkerV222','createStoneEquipment',
 'isRiggedStoneWarriorV261','loadRiggedStoneWarriorV261','createRiggedStoneWarriorV261',
 'animateRiggedStoneWarriorV261','collapseRigidDecorV261'])assert.ok(rig.includes(key),key);
const visuals=js('visuals.js');
for(const key of ['isRiggedStoneWarriorV261(kind)','loadRiggedStoneWarriorV261(kind)',
 'createRiggedStoneWarriorV261(holder,x,z,color,kind,grade)',
 'animateRiggedStoneWarriorV261(root,time,moving,attack)'])assert.ok(visuals.includes(key),key);
assert.match(js('asset-demand-v241.js'),/isRiggedStoneWarriorV261\(kind\)\?loadRiggedStoneWarriorV261\(kind\)/);
assert.match(js('stone-equipment-v234.js'),/materials\.set\(k,new T\.MeshStandardMaterial/);
assert.doesNotMatch(js('stone-equipment-v234.js'),/materials\.set\(k,\(\)=>new T\.MeshStandardMaterial/);
assert.match(js('stone-trellis-v259.js'),/EXPERIMENTAL_TRELLIS_V260&&/);
console.log('V261 rigged Stone Age warriors: 17 bones, three equipped variants and integration PASS');
