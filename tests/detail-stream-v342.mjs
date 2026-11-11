import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {DetailStreamV242} from '../detail-stream-v242.js?v=342';
import {beginSliceV342,sliceDueV342,SLICE_MS_V342} from '../frame-slice-v342.js';
import {detailSeaStepsV242,createDetailSea} from '../sea-v158.js';
import {Navigation} from '../navigation.js';
import {DETAIL_TILE_Z} from '../detail-scale-v123.js';

const camera=new T.PerspectiveCamera(43,16/9,.1,20000);
function look(stream,x,z,zoom=200){camera.position.set(x+zoom*.48,zoom*.78,z+zoom*.8);camera.lookAt(x,0,z);camera.updateMatrixWorld(true);stream.setView(camera,x,z);}
function makeStream(){
 const original=globalThis.matchMedia;globalThis.matchMedia=()=>({matches:true});
 try{
  const cells=new Map();for(let r=0;r<40;r++)for(let c=0;c<40;c++)cells.set(c+':'+r,{c,r});
  let clock=0;const log=[];
  const stream=new DetailStreamV242({scene:new T.Group(),cell:(c,r)=>cells.get(c+':'+r)||null,budget:12,clock:()=>++clock,dispose:()=>{},
   build:function*(entry){
    entry.stage='terrain';yield;entry.stage='resources';yield;entry.stage='ground cover';yield;
    entry.stage='buildings';yield;entry.shown=true;
    entry.stage='horizon';yield; // V342 stage-change yield (as in civilization.js)
    for(let i=0;i<30;i++){log.push(entry.key);yield;}
    entry.stage='navigation';yield;entry.stage='roads';yield;
   }});
  return {stream,cells,log};
 }finally{if(original===undefined)delete globalThis.matchMedia;else globalThis.matchMedia=original;}
}
const ring=(e,c)=>Math.max(Math.abs(e.tile.c-c.c),Math.abs(e.tile.r-c.r));

{ // 1. Centre-only layers are built only for possible next centres.
 const {stream,cells,log}=makeStream();
 const center=cells.get('20:20');stream.finish(center);stream.activate(center);look(stream,0,0);
 for(let i=0;i<400;i++)stream.tick();
 const tiles=[...stream.entries.values()];
 const outer=tiles.filter(e=>e.root.visible&&ring(e,center)>=2),inner=tiles.filter(e=>ring(e,center)<=1);
 assert.ok(outer.length>=12,'outer window present: '+outer.length);
 assert.ok(outer.every(e=>e.shown&&e.visualReady),'every outer tile shows terrain, trees, sea and buildings');
 assert.ok(outer.every(e=>!e.ready&&!log.includes(e.key)),'outer tiles never run centre-only layers');
 assert.ok(inner.every(e=>e.ready),'the 3x3 neighbourhood is fully prepared for crossings');
 assert.ok(stream.status().paused>=outer.length,'paused tiles are reported');
 // 2. Moving: a paused tile resumes once it becomes a neighbour of the target / centre.
 const ahead=outer.find(e=>e.tile.c===20&&e.tile.r===18);assert.ok(ahead,'tile two rows ahead loaded');
 stream.prefetch(0,-DETAIL_TILE_Z*.4); // target 20:19 -> 20:18 is its neighbour
 for(let i=0;i<200&&!ahead.ready;i++)stream.tick();
 assert.ok(ahead.ready,'paused centre-only layers resume next to the target');
 const target=stream.entries.get('20:19');assert.ok(target.ready);
 stream.activate(target.tile);look(stream,0,0);
 for(let i=0;i<400;i++)stream.tick();
 const after=[...stream.entries.values()];
 assert.ok(after.filter(e=>ring(e,target.tile)<=1).every(e=>e.ready),'new neighbourhood complete after crossing');
 assert.ok(after.filter(e=>e.root.visible&&ring(e,target.tile)>=2).every(e=>e.visualReady),'new outer ring visible');
}

{ // 3. tick(budget) honours a smaller budget (frames skipped by the FPS limit).
 const {stream,cells}=makeStream();
 const center=cells.get('10:10');stream.finish(center);stream.activate(center);look(stream,0,0);
 let calls=0;const clock=stream.clock;stream.clock=()=>{calls++;return clock();};
 stream.tick(3);const small=calls;calls=0;stream.tick();
 assert.ok(small<calls,'small budget does less work ('+small+' vs '+calls+')');
}

{ // 4. Slow frames limit background loading without slowing the destination ring.
 const {stream,cells}=makeStream();
 const center=cells.get('20:20');stream.finish(center);stream.activate(center);look(stream,0,0);
 const steps=[];
 let elapsed=0;
 stream.clock=()=>elapsed;
 const step=stream.step.bind(stream);
 stream.step=(entry,...args)=>{
  steps.push(stream.tier(entry,stream.entries.get(stream.targetKey)?.tile));
  step(entry,...args);
  elapsed++;
 };
 stream.tick(11,4);
 assert.equal(steps.length,4,'background work stops at the reduced time budget');
 assert.ok(steps.every(tier=>tier>=2));
 stream.prefetch(0,-DETAIL_TILE_Z*.4);
 steps.length=0;
 stream.tick(11,4);
 assert.equal(steps.length,11,'crossing work can use the full time budget');
 assert.ok(steps.every(tier=>tier===0),'the destination loads first');
 stream.finish(stream.entries.get(stream.targetKey).tile);
 steps.length=0;
 stream.tick(11,4);
 assert.equal(steps.length,11,'the visible destination ring can also use the full budget');
 assert.ok(steps.every(tier=>tier===1));
}

{ // 5. Time slices split long loops without changing results.
 beginSliceV342();assert.equal(sliceDueV342(),false);
 const t=performance.now();while(performance.now()-t<SLICE_MS_V342+1);assert.equal(sliceDueV342(),true);
 // Slow sea sampling: steps stay short, the mesh is identical to the one-shot build.
 const slowGround=(x,z)=>{const t=performance.now();while(performance.now()-t<.05);return Math.sin(x*.05)*20-Math.cos(z*.04)*15-8;};
 const options={halfX:112.5,halfZ:97.5,seg:72,origin:{x:3,z:4}};
 const steps=detailSeaStepsV242(slowGround,options);let next,longest=0,count=0;
 do{beginSliceV342();const s=performance.now();next=steps.next();longest=Math.max(longest,performance.now()-s);count++;}while(!next.done);
 const once=createDetailSea(slowGround,options);
 assert.ok(longest<SLICE_MS_V342*3,'longest sea step '+longest.toFixed(1)+' ms');
 assert.deepEqual([...next.value.geometry.attributes.aDepth.array],[...once.geometry.attributes.aDepth.array],'identical sea depth');
 assert.deepEqual([...next.value.geometry.attributes.position.array],[...once.geometry.attributes.position.array],'identical sea mesh');
 // Navigation: slow passability, identical mask, short steps.
 const world=()=>({resources:[],heat:{},heatLast:{},revision:0});
 const passable=(x,z)=>{const t=performance.now();while(performance.now()-t<.03);return !(Math.abs(x)<4&&z>0)};
 const sync=new Navigation(world(),passable,()=>[],{minX:-30,minZ:-30,w:61,h:61});
 const staged=new Navigation(world(),passable,()=>[],{minX:-30,minZ:-30,w:61,h:61,deferred:true});
 let slow=0;while(staged.preparationV242){beginSliceV342();const s=performance.now();staged.advancePreparationV242();slow=Math.max(slow,performance.now()-s);}
 assert.deepEqual(staged.base,sync.base);assert.deepEqual(staged.mask,sync.mask);
 assert.ok(slow<SLICE_MS_V342*3,'longest navigation step '+slow.toFixed(1)+' ms');
}
console.log('V342 centre-only layers on demand, bounded steps and frame-limited loading PASS');
