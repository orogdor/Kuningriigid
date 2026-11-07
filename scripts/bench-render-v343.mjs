// Isolated CPU costs against the exact reviewed V342. Not an FPS benchmark.
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import * as T from '../vendor/three.module.js';
const base='7285958380ed1c0e61dca0fa53c09098139372d0';
async function previous(file){let src=execFileSync('git',['show',base+':'+file],{encoding:'utf8'});
 src=src.replace(/from '(\.\/[^']+)'/g,(_,p)=>"from '"+new URL('../'+p,import.meta.url).href+"'").replaceAll('import.meta.url',JSON.stringify(new URL('../'+file,import.meta.url).href));
 return import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));}
globalThis.fetch=async url=>{const b=await readFile(new URL(url));return {ok:true,json:async()=>JSON.parse(b),arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}};
globalThis.createImageBitmap=async()=>({width:512,height:512,close(){}});
const oldTree=await previous('sapling-trees-v328.js'),newTree=await import('../sapling-trees-v328.js');
const oldSoldier=await previous('soldier-batch-v90.js'),newSoldier=await import('../soldier-batch-v90.js');
const oldHeight=await previous('perf-render-v131.js'),newHeight=await import('../perf-render-v131.js');
function median(fn,iterations){for(let i=0;i<15;i++)fn();const times=[];for(let s=0;s<7;s++){const t=performance.now();for(let i=0;i<iterations;i++)fn();times.push((performance.now()-t)/iterations);}return times.sort((a,b)=>a-b)[3];}
async function forest(api){const scene=new T.Scene(),holder=new T.Group(),trees=[];scene.add(holder);holder.position.set(10,0,-3);holder.rotation.y=.2;
 for(let i=0;i<2000;i++){const tree=api.withSaplingTreeV328('pine',new T.Group(),123);tree.position.set((i%50)*2,0,Math.floor(i/50)*2);holder.add(tree);trees.push(tree);}
 const variant=api.saplingVariantV328(123,123*.13);await Promise.all(['far','mid','near'].map(l=>api.loadSaplingV328('pine',variant,l)));
 const camera=new T.OrthographicCamera(-200,200,200,-200,.1,5000);camera.position.set(50,100,200);camera.lookAt(50,0,30);camera.updateMatrixWorld();scene.updateMatrixWorld();
 let ancestorUpdates=0;const update=holder.updateWorldMatrix;holder.updateWorldMatrix=function(...args){ancestorUpdates++;return update.apply(this,args)};
 const step=()=>{scene.onBeforeRender(null,scene,camera);for(const t of trees)t.update(camera);};step();step();ancestorUpdates=0;step();const perFrameAncestorUpdates=ancestorUpdates;
 const ms=median(step,40);return {ms,ancestorUpdates:perFrameAncestorUpdates,instances:scene.children.filter(o=>o.isInstancedMesh).map(o=>o.count),matrixSample:scene.children.filter(o=>o.isInstancedMesh)[0].instanceMatrix.array.slice(0,32)};
}
function soldiers(api){const parent=new T.Group(),batch=new api.SoldierBatch(parent),geo=new T.BoxGeometry(),mat=new T.MeshBasicMaterial(),models=[];
 for(let s=0;s<50;s++){const squad=new T.Group();models.push(squad);parent.add(squad);squad.visible=s%2===0;
  for(let i=0;i<20;i++){const man=new T.Group();squad.add(man);man.position.set(i,0,s);
   for(let j=0;j<12;j++){const bone=new T.Group();bone.position.y=j*.1;man.add(bone);bone.add(new T.Mesh(geo,mat));}
  }}
 const ms=median(()=>batch.update(models),20);return {ms,parts:batch.batches[0].mesh.count};
}
function heights(api){const g={s:{terrainRevision:2,crossingRevision:3}};for(let i=0;i<10000;i++)api.memoHeight(g,i,0,()=>i);
 return {ms:median(()=>{for(let i=0;i<100000;i++)api.memoHeight(g,i%10000,0,()=>i);},3)};}
const a=await forest(oldTree),b=await forest(newTree);
if(JSON.stringify([...a.matrixSample])!==JSON.stringify([...b.matrixSample])||JSON.stringify(a.instances)!==JSON.stringify(b.instances))throw Error('Tree output differs');
delete a.matrixSample;delete b.matrixSample;
const report={baseline:base,note:'Node isolated CPU microbenchmark, seven samples after warmup. Same models/transforms. No GPU or user-device FPS claim.',trees2000:{before:a,after:b},soldiers1000HalfHidden:{before:soldiers(oldSoldier),after:soldiers(newSoldier)},height100000CacheHits:{before:heights(oldHeight),after:heights(newHeight)}};
for(const k of ['trees2000','soldiers1000HalfHidden','height100000CacheHits'])report[k].reductionPercent=+(100*(1-report[k].after.ms/report[k].before.ms)).toFixed(1);
await writeFile('reports/render-efficiency-v343-bench.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
