import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {Civilization,createGame} from '../civilization-core.js';
import {captureGeneratedWorldV331,restoreGeneratedWorldV331,hydrateGeneratedWorldV331,persistGeneratedWorldV331,portableGeneratedWorldSaveV331,importGeneratedWorldV331} from '../generated-world-v331.js';
import {serializeSnapshot} from '../snapshot-v131.js';
const phase=process.env.WORLD_V331_PHASE,dir=process.env.WORLD_V331_DIR;
const disk={read:async id=>fs.readFileSync(path.join(dir,id+'.world'),'utf8'),write:async(id,payload)=>fs.writeFileSync(path.join(dir,id+'.world'),payload)};
function fingerprint(g){const h=createHash('sha256');for(let i=0;i<g.cells.length;i+=256)h.update(JSON.stringify(g.cells.slice(i,i+256)));return h.digest('hex');}
if(phase==='cold'){
 const t=performance.now(),s=createGame(77,'tectonic'),g=new Civilization(s),coldMs=performance.now()-t;
 const settler=s.settlers.find(a=>a.team===0);assert.equal(g.land(settler.id),'');let city;
 for(let x=-20;x<=20&&!city;x+=4)for(let z=-20;z<=20&&!city;z+=4){if(g.siteRule(settler,{x,z}))continue;settler.x=x;settler.z=z;city=g.found(settler.id).city;}
 assert.ok(city,'town fixture founded');city.name='Saved world village';city.hp=571;city.economy.realms[0].resources.wood=19;
 const tree=city.world.resources.find(r=>r.kind==='tree'&&!r.removed);assert.ok(tree);tree.amount=3;
 s.time=123;s.tileWorlds={retained:{resources:[{id:0,kind:'tree',amount:3,removed:false}]}};
 assert.equal(g.worldSourceV331,'generated');assert.equal(s.generatedWorldV331,undefined);
 const before=serializeSnapshot(s);captureGeneratedWorldV331(g);await persistGeneratedWorldV331(s,disk);const serialized=serializeSnapshot(s);
 assert.ok(serialized.length-before.length<400,'small reference, not the whole world, in every autosave');
 const expected={hash:fingerprint(g),coldMs,cells:g.cells.length,resources:g.cells.reduce((n,c)=>n+c.detail.resources.length,0),fish:[g.fishDistance[0],g.fishDistance[1000]],time:s.time,tileWorld:s.tileWorlds.retained,city:{id:city.id,name:city.name,hp:city.hp,wood:19,tree:tree.id,treeAmount:3},referenceBytes:serialized.length-before.length,payloadBytes:fs.statSync(path.join(dir,s.generatedWorldV331.id+'.world')).size};
 fs.writeFileSync(path.join(dir,'state.json'),serialized);fs.writeFileSync(path.join(dir,'expected.json'),JSON.stringify(expected));console.log('COLD',JSON.stringify(expected));
}else if(phase==='warm'){
 const s=JSON.parse(fs.readFileSync(path.join(dir,'state.json'),'utf8')),expected=JSON.parse(fs.readFileSync(path.join(dir,'expected.json'),'utf8')),t=performance.now();
 await hydrateGeneratedWorldV331(s,disk);
 const original=Civilization.prototype.atlasHeight;Civilization.prototype.atlasHeight=()=>{throw Error('Terrain generator was called on restored game');};
 const g=new Civilization(s);Civilization.prototype.atlasHeight=original;const warmMs=performance.now()-t;
 assert.equal(g.worldSourceV331,'saved');assert.equal(fingerprint(g),expected.hash,'all cells, heights, rivers, deposits and resource positions retained');assert.deepEqual([g.fishDistance[0],g.fishDistance[1000]],expected.fish);assert.equal(s.time,expected.time);assert.deepEqual(s.tileWorlds.retained,expected.tileWorld);const city=s.cities.find(c=>c.id===expected.city.id);assert.equal(city.name,expected.city.name);assert.equal(city.hp,expected.city.hp);assert.equal(city.economy.realms[0].resources.wood,expected.city.wood);assert.equal(city.world.resources.find(r=>r.id===expected.city.tree).amount,3);
 console.log('WARM',JSON.stringify({passed:true,warmMs,coldMs:expected.coldMs,cells:g.cells.length,hash:expected.hash}));
}else{
 // Full map processes are isolated so the test itself never retains several
 // million-resource worlds at once (mobile startup also restores just one).
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'world-v331-'));
 try{for(const mode of ['cold','warm']){const r=spawnSync(process.execPath,[new URL(import.meta.url).pathname],{cwd:process.cwd(),env:{...process.env,WORLD_V331_PHASE:mode,WORLD_V331_DIR:folder},encoding:'utf8',timeout:180000,maxBuffer:2e6});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');assert.equal(r.status,0,mode+' full world phase passed');}}finally{fs.rmSync(folder,{recursive:true,force:true});}
 const state=()=>({version:4,seed:7,type:'tectonic',geographyVersion:7,worldScaleVersion:2,cities:[]});
 const s=state(),cells=Array.from({length:4},(_,i)=>({c:i%2,r:Math.floor(i/2),x:i*50,z:i*20,h:7,detail:{heights:Array(81).fill(1),resources:[[0,1.2,-3.4],[4,2,3]]}}));
 captureGeneratedWorldV331({s,cols:2,rows:2,cells,continents:{heights:Float32Array.of(1,2,3,4)},startLocations:[],fishDistance:Int16Array.of(1,2,3,4)});
 const data=new Map(),store={read:async id=>data.get(id),write:async(id,p)=>data.set(id,p)};await persistGeneratedWorldV331(s,store);
 const serialized=serializeSnapshot(s),portable=await portableGeneratedWorldSaveV331(s,serialized),otherData=new Map(),other={read:async id=>otherData.get(id),write:async(id,p)=>otherData.set(id,p)},imported=JSON.parse(portable);
 await importGeneratedWorldV331(imported,other);assert.equal(imported.generatedWorldV331.payload,undefined);assert.deepEqual(restoreGeneratedWorldV331(imported,2,2).cells,cells);assert.equal(otherData.size,1,'portable JSON works with an empty device store');
 const missing=JSON.parse(serialized);await assert.rejects(hydrateGeneratedWorldV331(missing,{read:async()=>null}),/puudub/);assert.throws(()=>restoreGeneratedWorldV331(missing,2,2),/puudub/);
 const wrong=JSON.parse(portable);wrong.seed++;await assert.rejects(importGeneratedWorldV331(wrong,other),/vigased|vasta/);
 const bad=JSON.parse(portable);bad.generatedWorldV331.payload='broken';await assert.rejects(importGeneratedWorldV331(bad,other));
 const mismatch=JSON.parse(portable);mismatch.generatedWorldV331.id='another-world';await assert.rejects(importGeneratedWorldV331(mismatch,other),/vasta/);
 const failed=JSON.parse(portable);await hydrateGeneratedWorldV331(failed,other);await persistGeneratedWorldV331(failed,{write:async()=>{throw Error('QuotaExceeded')}});assert.ok(failed.generatedWorldV331.payload);const fallback=JSON.parse(serializeSnapshot(failed));await hydrateGeneratedWorldV331(fallback,{read:async()=>null});assert.deepEqual(restoreGeneratedWorldV331(fallback,2,2).cells,cells);
 assert.equal(await hydrateGeneratedWorldV331(state(),other),false,'old save migrates only once');assert.throws(()=>restoreGeneratedWorldV331(imported,3,3),/mõõtmed/);
 console.log('PASS V331 portable world, missing/corrupt data, seed identity, dimensions, quota fallback and unchanged game state');
}
