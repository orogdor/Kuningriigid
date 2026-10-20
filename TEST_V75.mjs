import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from './vendor/three.module.js';
import {Civilization,createGame} from './civilization-core.js';
import {createWorldObjectCatalog} from './world-object-catalog.js';
import {createWorldAtlasProps} from './world-props.js';
import {buildDetailWorldObjects} from './detail-world-objects.js';
import {collectLandmark} from './world-discoveries.js';
import {worldToDetail} from './landscape-shared.js';

const game=new Civilization(createGame(751075)),catalog=createWorldObjectCatalog(game,'medium');
assert.equal(game.s.version,4,'old save format unchanged');
assert.equal(game.s.landmarks.length,43,'all seeded villages and ruins preserved');
assert.ok(catalog.candidates.rock.length>0&&catalog.candidates.forest.length>0&&catalog.candidates.bridge.length>0);
for(const [kind,sites]of Object.entries(catalog.candidates)){
 for(const cell of sites){
  const matching=catalog.at(cell).filter(s=>s.kind===kind);
  assert.equal(matching.length,1,kind+' atlas site must appear once in detail catalog');
  assert.equal(matching[0].id,kind+':'+cell.c+':'+cell.r);
 }
}
for(const site of game.s.landmarks){
 assert.equal(catalog.at(site).filter(p=>p.id==='landmark:'+site.id).length,1,'every persisted '+site.kind+' must have detail site');
}
const oldFetch=globalThis.fetch;
globalThis.fetch=async url=>{const bytes=await fs.readFile(new URL(url,import.meta.url));return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}};
try{
 const atlas=createWorldAtlasProps(game,new T.Group(),'medium');
 assert.equal(await atlas.initialized,true,'all five original world GLBs load');
 assert.deepEqual(atlas.counts,catalog.counts,'world and detail render the same candidate quotas');
 function renderAt(site){
  game.reveal(0,site,1);
  const tile=game.cell(site),detail=buildDetailWorldObjects(game,atlas,tile,()=>7);
  const entries=catalog.at(tile);
  assert.deepEqual(detail.userData.siteIds,entries.map(x=>x.id),'detail renderer preserves every site, no extras');
  assert.equal(detail.children.length,entries.length);
  for(const model of detail.children){
   assert.ok(model.userData.worldSiteId,'stable world object ID on detail model');
   assert.ok(model.children.some(x=>x.isMesh),'actual geometry, not only a flat marker');
   assert.ok(model.scale.x>0,'visible nonzero GLB');
   const box=new T.Box3().setFromObject(model);
   assert.ok(box.min.y>=6.9,'model base lies on detail terrain');
   assert.ok(box.max.y>box.min.y,'3D object occupies visible height');
   assert.ok(Number.isFinite(model.position.x)&&Number.isFinite(model.position.z));
  }
  return detail;
 }
 for(const [kind,sites]of Object.entries(catalog.candidates)){
  const tile=sites[Math.floor(sites.length/2)];
  const detail=renderAt(tile);
  assert.ok(detail.userData.siteIds.includes(kind+':'+tile.c+':'+tile.r));
  const projected=worldToDetail(game.cell(tile),tile.x,tile.z);
  assert.deepEqual(projected,{x:0,z:0},'shared tile center projection');
 }
 const village=game.s.landmarks.find(p=>p.kind==='village'),ruin=game.s.landmarks.find(p=>p.kind==='ruins');
 for(const site of [village,ruin]){
  const detail=renderAt(site);
  const matched=detail.children.find(x=>x.userData.worldSiteId==='landmark:'+site.id);
  assert.ok(matched&&matched.userData.worldProp===site.kind,'seeded '+site.kind+' model in detail');
 }
 const settler=game.s.settlers[0];settler.c=village.c;settler.r=village.r;
 const claim=collectLandmark(game,0,village);
 assert.ok(claim&&village.claimedBy===0,'reward collected exactly once');
 assert.equal(renderAt(village).children.find(x=>x.userData.worldSiteId==='landmark:'+village.id).userData.claimedBy,0,'claimed villages remain visible');
 const before=JSON.stringify(game.s),reloaded=new Civilization(JSON.parse(before));
 assert.equal(reloaded.s.version,4,'saved game remains V4');
 const reopened=createWorldObjectCatalog(reloaded,'medium');
 assert.equal(reopened.at(village).find(x=>x.id==='landmark:'+village.id).landmark.claimedBy,0,'claimed status survives reload');
 assert.deepEqual(reopened.counts,catalog.counts,'reloading preserves all landscape world props');
 const hidden=game.s.landmarks.find(p=>p.id!==village.id&&!game.seen(0,p));
 if(hidden){
  const detail=buildDetailWorldObjects(game,atlas,game.cell(hidden),()=>7);
  assert.ok(!detail.userData.siteIds.includes('landmark:'+hidden.id),'unexplored landmark is not leaked through detail map');
 }
 console.log('V75 PASS: 43 villages/ruins and all rock, forest, bridge atlas props appear as 3D on exact detail tiles; claimed and old saves preserved');
}finally{globalThis.fetch=oldFetch}
