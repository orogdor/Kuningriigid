import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {RenderDeltaV343} from '../render-delta-v343.js';
import {memoHeight} from '../perf-render-v131.js';
import {SoldierBatch} from '../soldier-batch-v90.js';

// 144 display callbacks, 48 presented frames (the existing 60 FPS limiter on
// a 144 Hz screen). The visual timeline must still advance exactly one second.
const clock=new RenderDeltaV343();let elapsed=0,updates=0;
for(let i=0;i<144;i++){const dt=clock.step(1/144,i%3===2,'tile A');if(dt!==null){updates++;elapsed+=dt;}}
assert.equal(updates,48);assert.ok(Math.abs(elapsed-1)<1e-12);
assert.equal(clock.step(0,true,'tile A'),0,'paused animation gets no time');
clock.step(.1,false,'tile A');assert.equal(clock.step(.02,true,'tile B'),.02,'crossing does not replay old tile time');
clock.step(.1,false,'tile B');assert.equal(clock.step(0,true,'tile B'),.1,'pending time is consumed once');
assert.equal(clock.step(0,true,'tile B'),0);

const game={s:{terrainRevision:1,crossingRevision:2}};let calls=0;
const sample=(x,z)=>memoHeight(game,x,z,()=>++calls);
assert.equal(sample(1,2),1);assert.equal(sample(1,2),1);
game.s.crossingRevision++;assert.equal(sample(1,2),2);
game.s.terrainRevision++;assert.equal(sample(1,2),3);
assert.equal(sample(1+Number.EPSILON,2),4,'exact coordinates remain distinct');

const parent=new T.Group(),batch=new SoldierBatch(parent),geo=new T.BoxGeometry(),mat=new T.MeshBasicMaterial();
const squads=[];
for(let s=0;s<8;s++){const squad=new T.Group();parent.add(squad);squad.position.x=s*10;squads.push(squad);
 for(let n=0;n<20;n++){const man=new T.Group();squad.add(man);man.position.z=n;
  for(let p=0;p<12;p++){const limb=new T.Group(),mesh=new T.Mesh(geo,mat);limb.position.set(p*.1,p*.2,0);limb.add(mesh);man.add(limb);}
 }}
batch.update(squads);assert.equal(batch.batches.length,1);const b=batch.batches[0];assert.equal(b.mesh.count,1920);
// Moving the batch parent must not change the relative world position of men.
parent.position.set(12,3,-10);parent.rotation.y=.6;squads[0].children[0].rotation.y=.8;
squads[2].visible=false;squads[3].children[4].visible=false;
batch.update(squads);assert.equal(b.mesh.count,1920-240-12);
const actual=new T.Matrix4(),expected=new T.Matrix4(),inverse=parent.matrixWorld.clone().invert();let n=0;
for(const p of b.parts){let visible=true;for(let a=p.parent;a&&a!==parent;a=a.parent)visible&&=a.visible;if(!visible)continue;
 expected.multiplyMatrices(inverse,p.matrixWorld);b.mesh.getMatrixAt(n++,actual);
 actual.elements.forEach((v,i)=>assert.ok(Math.abs(v-expected.elements[i])<1e-5,'animated limb transform preserved'));
}
assert.deepEqual(b.mesh.instanceMatrix.updateRanges,[{start:0,count:n*16}]);
for(const s of squads)s.visible=false;batch.update(squads);assert.equal(b.mesh.count,0);assert.equal(b.mesh.instanceMatrix.updateRanges.length,0);
for(const s of squads)s.visible=true;batch.update(squads);assert.equal(b.mesh.count,1908,'hidden men stay hidden after squad returns');
batch.update([]);assert.equal(batch.root.children.length,0);assert.ok(squads[0].children[0].children[0].children[0].visible,'source restored on removal');
console.log('V343 PASS: skipped-frame time, pause/crossing, exact terrain invalidation, 160 soldiers / 1920 animated parts, visibility, relative transforms and active GPU upload range');

// Tree LOD reads the renderer's current world matrices, including streamed
// parents that moved/rotated/scaled. It must not recompute ancestor transforms.
const {readFile}=await import('node:fs/promises');
globalThis.fetch=async url=>{const data=await readFile(new URL(url));return {ok:true,json:async()=>JSON.parse(data),arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)}};
globalThis.createImageBitmap=async()=>({width:512,height:512,close(){}});
const {withSaplingTreeV328,loadSaplingV328,saplingVariantV328}=await import('../sapling-trees-v328.js');
const scene=new T.Scene(),holder=new T.Group();scene.add(holder);
const tree=withSaplingTreeV328('pine',new T.Group(),123);holder.add(tree);
await Promise.all(['far','mid','near'].map(l=>loadSaplingV328('pine',saplingVariantV328(123,123*.13),l)));
const camera=new T.OrthographicCamera(-200,200,200,-200,.1,2000);camera.position.set(0,100,200);camera.lookAt(0,0,0);camera.updateMatrixWorld();
let walked=0;const update=holder.updateWorldMatrix;holder.updateWorldMatrix=function(...args){walked++;return update.apply(this,args)};
function submit(){scene.updateMatrixWorld(true);scene.onBeforeRender(null,scene,camera);tree.update(camera);}
submit();holder.position.set(20,0,-10);holder.rotation.y=.7;holder.scale.set(1.2,1.3,.8);tree.position.set(2,0,3);submit();
const visible=scene.children.filter(o=>o.isInstancedMesh&&o.count);assert.ok(visible.length>0);visible[0].getMatrixAt(0,actual);
actual.elements.forEach((v,i)=>assert.ok(Math.abs(v-tree.matrixWorld.elements[i])<1e-5));assert.equal(walked,0);
holder.position.x=10000;submit();assert.ok(scene.children.filter(o=>o.isInstancedMesh).every(o=>o.count===0),'out-of-view tree disappears');
holder.position.x=0;submit();assert.ok(scene.children.some(o=>o.isInstancedMesh&&o.count===1),'tree returns when parent moves back');
console.log('V343 transformed tree, camera culling, stream return and zero redundant ancestor updates PASS');
