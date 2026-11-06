import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getWorldModel} from '../world-models-v152.js';
import {installWorldAssetsV327,WORLD_ASSETS_V327} from '../world-assets-v327.js';
import * as T from '../vendor/three.module.js';
import {spatialInstances,updateSpatialBatches} from '../spatial-batches-v86.js';
const root=new URL('../',import.meta.url),manifest=JSON.parse(await readFile(new URL('assets/world-v327/manifest.json',root)));
assert.equal(manifest.assets.length,8);
globalThis.fetch=async url=>{const bytes=await readFile(new URL(url,root));return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}};
const refs=new Map();
for(const names of Object.values(WORLD_ASSETS_V327))for(const name of names)for(const lod of ['low','medium','high'])refs.set(name+lod,getWorldModel(name,lod));
const source=new T.InstancedMesh(getWorldModel('oak','low'),new T.MeshBasicMaterial(),40);
source.userData.lodGeometries={low:getWorldModel('oak','low'),high:getWorldModel('oak','high')};
for(let i=0;i<40;i++)source.setMatrixAt(i,new T.Matrix4().makeTranslation(i*10,0,0));
const spatial=spatialInstances(source);updateSpatialBatches(400,{x:100,z:100});
const oldKey=source.userData.boundsKeyV327;
const results=await installWorldAssetsV327(getWorldModel);
assert.equal(results.length,8);assert.ok(results.every(r=>r.status==='fulfilled'),JSON.stringify(results));
updateSpatialBatches(400,{x:100,z:100});assert.notEqual(source.userData.boundsKeyV327,oldKey,'async replacement refreshes instance bounds');
assert.ok(source.boundingSphere.radius>0);assert.ok(spatial.children[1].children.every(m=>m.geometry.userData.trellisV327&&m.boundingSphere.radius>0));
for(const a of manifest.assets){
 const file=await readFile(new URL('assets/world-v327/'+a.kind+'_'+a.lod+'.glb',root));
 assert.equal(file.readUInt32LE(0),0x46546c67);assert.equal(file.readUInt32LE(4),2);assert.equal(file.length,file.readUInt32LE(8));assert.equal(file.length,a.bytes);
 for(const name of WORLD_ASSETS_V327[a.kind])for(const lod of a.lod==='high'?['medium','high']:['low']){
  const g=getWorldModel(name,lod),p=g.attributes.position,c=g.attributes.color;
  assert.equal(g,refs.get(name+lod),'existing instance geometry reference survives');assert.equal(g.userData.trellisV327,true);
  assert.equal(g.index.count/3,a.triangles);assert.ok(a.triangles>=(a.kind==='rock'?30:100)&&a.triangles<=1500);
  assert.ok(Math.abs(g.boundingBox.min.y)<1e-5);assert.ok(Math.abs(g.boundingBox.max.y-a.height)<1e-4);
  assert.ok(g.boundingBox.max.x-g.boundingBox.min.x>.15);assert.ok(g.boundingBox.max.z-g.boundingBox.min.z>.15);
  assert.equal(c.count,p.count);assert.ok([...p.array,...c.array].every(Number.isFinite));assert.ok(c.array.some(x=>x>.03));
  assert.ok([...g.index.array].every(x=>x<p.count));
 }
}
const props=await readFile(new URL('world-props.js',root),'utf8');assert.match(props,/for\(const kind of \['rock','bridge'\]\)/);assert.match(props,/o.name==='earth'/);
const html=await readFile(new URL('index.html',root),'utf8');
for(const name of ['world-models-v152.js','atlas-biomes-v47.js','world-props.js','atlas-sea-v326.js'])assert.ok(html.includes('"./'+name+'": "./'+name+'?v='+(name==='atlas-biomes-v47.js'?'329a':'328a')+'"'));
console.log('V327 generated assets: 8 actual GLBs, colour/bounds/budgets, live instance replacement and cache PASS');
