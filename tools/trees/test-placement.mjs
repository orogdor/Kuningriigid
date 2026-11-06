import assert from 'node:assert/strict';
import {testPlacements,projectPlacements,placementsFromInstances} from '../../experiments/sapling-trees/forest.js';
import * as T from '../../vendor/three.module.js';
const trees=Array.from({length:30},(_,i)=>({id:'tree_'+i}));
const world=testPlacements(12000,trees),detail=projectPlacements(world,{originX:40,originZ:80,units:8});
assert.deepEqual(world,testPlacements(12000,trees));
for(let i=0;i<world.length;i++){assert.equal(detail[i].id,world[i].id);assert.ok(Math.abs(detail[i].x/8+40-world[i].x)<1e-9);assert.ok(Math.abs(detail[i].z/8+80-world[i].z)<1e-9);assert.equal(detail[i].asset,world[i].asset);}
const mesh=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshBasicMaterial(),2),m=new T.Matrix4();mesh.position.set(40,3,80);mesh.setMatrixAt(0,m.makeTranslation(1,2,3));mesh.setMatrixAt(1,m.makeTranslation(4,5,6));const p=placementsFromInstances(mesh,['pine_01','oak_01']);assert.deepEqual(p.map(p=>[p.x,p.y,p.z]),[[41,5,83],[44,8,86]]);
console.log('12000 shared world/detail placements + existing instance transform adapter passed');
