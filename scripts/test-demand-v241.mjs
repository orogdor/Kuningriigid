import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {requestAssetV241} from '../asset-queue-v241.js';
import {desiredAssetsV241} from '../asset-demand-v241.js';
import {Civilization,createGame,TROOPS,BUILD_AGE} from '../civilization-core.js';
import {UNIT_TECH,BUILD_TECH} from '../research.js?v=125a';
import * as T from '../vendor/three.module.js';
import {SoldierBatch} from '../soldier-batch-v90.js';
const decode=bytes=>{const raw=gunzipSync(bytes),length=raw.readUInt32LE(4);return {pack:JSON.parse(raw.subarray(8,8+length)),blob:raw.subarray(8+length)};};
for(const lod of ['high','low']){
 const source=decode(fs.readFileSync(new URL(`../models-v148/soldiers-v148-${lod}.bin`,import.meta.url)));
 for(const [kind,original] of Object.entries(source.pack.kinds)){
  const part=decode(fs.readFileSync(new URL(`../models-v241/${lod}/${kind}.bin`,import.meta.url))),def=part.pack.kinds[kind];
  assert.deepEqual(Object.keys(part.pack.kinds),[kind]);
  assert.equal(JSON.stringify(def.bones),JSON.stringify(original.bones));
  assert.equal(JSON.stringify(def.clips),JSON.stringify(original.clips));
  for(let i=0;i<def.chunks.length;i++)for(const [field,bytes] of [[5,def.chunks[i][7]*6],[6,def.chunks[i][7]*3],[8,def.chunks[i][9]*2]]){
   const a=def.chunks[i][field],b=original.chunks[i][field];
   assert.equal(a%4,0);assert.deepEqual(part.blob.subarray(a,a+bytes),source.blob.subarray(b,b+bytes));
  }
 }
}
let calls=0;const first=requestAssetV241('test:shared',async()=>{calls++;return 42;});
assert.equal(requestAssetV241('test:shared',()=>assert.fail('duplicate fetch')),first);
assert.equal(await first,42);assert.equal(calls,1);
await assert.rejects(requestAssetV241('test:failure',async()=>{throw Error('offline');}),/offline/);
await assert.rejects(requestAssetV241('test:failure',()=>assert.fail('retry storm')),/offline/);
const game=new Civilization(createGame(8417));
const defs={TROOPS,BUILD_AGE,UNIT_TECH,BUILD_TECH};
let desired=desiredAssetsV241(game,defs);
assert.deepEqual(desired.soldiers,['scout']);assert.deepEqual(desired.buildings,[],'no buildings before founding or research');
assert(!desired.soldiers.includes('rifleman'));assert(!desired.soldiers.includes('archer'));
assert(!desired.buildings.includes('archery'));assert(!desired.buildings.includes('pottery_kiln'));
game.s.research[1].active='archery';
desired=desiredAssetsV241(game,defs);assert(desired.soldiers.includes('archer'),'AI research prefetches');
assert(desired.buildings.includes('archery'));
game.s.research[1].active='pottery';
desired=desiredAssetsV241(game,defs);assert(desired.buildings.includes('pottery_kiln'));assert(!desired.soldiers.includes('archer'));
for(let t=0;t<4;t++){game.s.ages[t]=6;game.s.research[t].known=Object.keys((await import('../research.js?v=125a')).TECHS);game.s.research[t].active=null;}
desired=desiredAssetsV241(game,defs);assert.equal(desired.buildings.length,0,'later save does not preload Stone Age buildings');
assert(!desired.soldiers.includes('spearman'),'obsolete soldier not prefetched');
const parent=new T.Group(),root=new T.Group();parent.add(root);
const old=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial());root.add(old);
const batch=new SoldierBatch(parent);batch.update([root]);assert.equal(old.visible,false);
root.remove(old);const replacement=new T.Mesh(new T.SphereGeometry(),old.material);root.add(replacement);
root.userData.assetRevisionV241=1;batch.update([root]);
assert.equal(replacement.visible,false);assert(batch.batches.every(b=>!b.parts.includes(old)),'streamed geometry replaces cached batch');
console.log('V241 independent soldier bytes/clips, shared requests, offline fallback and all-team research policy PASS');
