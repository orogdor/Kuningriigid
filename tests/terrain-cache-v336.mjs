import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {createAtlasTerrainV327,snapshotAtlasTerrainV336,restoreAtlasTerrainV336,adaptiveAtlasSamplerV327} from '../atlas-terrain-v327.js';
import {terrainMeshKeyV336,readTerrainMeshV336,writeTerrainMeshV336} from '../terrain-cache-v336.js';

const terrain=createAtlasTerrainV327({width:200,depth:150,nx:5,nz:4,originX:-100,originZ:-75,
 rivers:[{points:[{x:0,z:0,width:8}]}],coasts:[],height:(x,z)=>Math.sin(x/40)*4+Math.cos(z/30)*2,maxLevel:2});
const vertices=terrain.getAttribute('position').count;
terrain.setAttribute('color',new T.Float32BufferAttribute(Array(vertices*3).fill(.5),3));
const before=adaptiveAtlasSamplerV327(terrain);
assert.equal(typeof before,'function');
const snapshot=snapshotAtlasTerrainV336(terrain);
const afterGeometry=restoreAtlasTerrainV336(snapshot);
const after=adaptiveAtlasSamplerV327(afterGeometry);
assert.equal(vertices,afterGeometry.getAttribute('position').count);
assert.deepEqual(Array.from(terrain.index.array),Array.from(afterGeometry.index.array));
for(const [x,z] of [[-70,-55],[0,0],[52,20],[80,65],[-10,28]]){
 const a=before(x,z),b=after(x,z);
 assert.ok(Number.isFinite(a)&&Number.isFinite(b));
 assert.ok(Math.abs(a-b)<1e-5,'cached relief changed height '+x+','+z);
}
assert.throws(()=>restoreAtlasTerrainV336({...snapshot,index:new Uint32Array([4294967295])}),/cached atlas/);
const base={seed:1,generatedWorldV331:{id:'world-1',identity:[1,'tectonic',7,2]},terrainRevision:2,crossingRevision:1};
const key=terrainMeshKeyV336(base,'low');
assert.equal(key,terrainMeshKeyV336({...base},'low'));
assert.notEqual(key,terrainMeshKeyV336({...base,terrainRevision:3},'low'));
assert.notEqual(key,terrainMeshKeyV336({...base,crossingRevision:2},'low'));
assert.notEqual(key,terrainMeshKeyV336(base,'high'));
assert.equal(terrainMeshKeyV336({seed:3},'low'),null);
assert.equal(await readTerrainMeshV336(key),null,'non-browser fallback');
assert.equal(await writeTerrainMeshV336(key,snapshot),false,'non-browser fallback');
console.log('PASS V336: atlas mesh roundtrip, sampler continuity, invalidation, and IDB fallback');
