// Approved Sapling trees. Rendering only: callers retain their exact saved placements.
import * as T from './vendor/three.module.js';
import {loadGLB} from './glb-lite-v221.js';
export const SAPLING_SPECIES_V328=new Set(['pine','spruce','oak','lime','birch','palm']);
const ROOT=new URL('./assets/sapling-trees/',import.meta.url),loads=new Map(),ready=new Map(),scaled=new Map(),textures=new Map();
let manifestPromise,active=0;const queue=[];
const manifest=()=>manifestPromise??=fetch(new URL('manifest.json',ROOT)).then(r=>{if(!r.ok)throw Error('Sapling manifest '+r.status);return r.json()});
function task(fn){return new Promise((resolve,reject)=>{queue.push(()=>fn().then(resolve,reject));pump()});}
function pump(){while(active<4&&queue.length){active++;queue.shift()().finally(()=>{active--;pump()});}}
export function saplingVariantV328(x,z,seed=0){const n=Math.sin(x*12.9898+z*78.233+seed*.017)*43758.5453;return Math.min(4,Math.floor((n-Math.floor(n))*5));}
export function saplingSpeciesV328(biome='',seed=0){
 const b=String(biome).replace('coastal_',''),n=Math.sin(seed*127.1+93.7)*43758.5453,r=n-Math.floor(n);
 if(b==='jungle'||b==='oasis')return 'palm';
 if(b==='taiga'||b==='tundra')return r<.45?'spruce':r<.85?'pine':'birch';
 return r<.5?'oak':r<.8?'lime':'birch';
}
export function loadSaplingV328(kind,variant,level){
 const key=kind+':'+variant+':'+level;if(loads.has(key))return loads.get(key);
 const promise=task(async()=>{
  const meta=await manifest(),id=kind+'_'+String(variant+1).padStart(2,'0'),rec=meta.trees.find(t=>t.id===id),ref=meta.trees.filter(t=>t.species===kind).sort((a,b)=>a.boundsZUp[1][2]-b.boundsZUp[1][2])[2];
  if(!rec||!ref)throw Error('Missing Sapling '+id);
  const data=await loadGLB(new URL(id+'/'+level+'.glb',ROOT));
  const parts=data.primitives.map((p,i)=>{
   let map=null;if(p.image){const tk=level==='far'?id+':'+i:kind+':foliage';map=textures.get(tk);
    if(!map){map=new T.Texture(p.image);map.flipY=false;map.colorSpace=T.SRGBColorSpace;map.needsUpdate=true;textures.set(tk,map);}else p.image.close?.();}
   const params={color:new T.Color().fromArray(p.color),map,alphaTest:map?.4:0,side:T.DoubleSide,depthWrite:true};
   const material=level==='far'?new T.MeshBasicMaterial(params):new T.MeshStandardMaterial({...params,roughness:.95});material.userData.shared=true;
   p.geometry.userData.shared=true;p.geometry.computeBoundingSphere();return {geometry:p.geometry,material};
  });
  const result={parts,referenceHeight:ref.boundsZUp[1][2],height:rec.boundsZUp[1][2],key};ready.set(key,result);return result;
 });loads.set(key,promise);return promise;
}
function template(kind,variant,level,height){
 const key=kind+':'+variant+':'+level,result=ready.get(key);if(!result)return null;
 const sk=key+':'+height;if(scaled.has(sk))return scaled.get(sk);
 const ratio=height/result.referenceHeight,parts=result.parts.map(p=>{const geometry=p.geometry.clone();geometry.scale(ratio,ratio,ratio);geometry.computeBoundingSphere();geometry.userData.shared=true;return {geometry,material:p.material};});scaled.set(sk,parts);return parts;
}
function request(kind,variant,level,owner){loadSaplingV328(kind,variant,level).catch(e=>{owner.userData.saplingErrorV328=String(e);});}
export function saplingLevelV328(camera,position,height,previous='far'){
 const vh=typeof innerHeight==='number'?innerHeight:800;
 const pixels=camera.isOrthographicCamera?height*vh*camera.zoom/(camera.top-camera.bottom):height*vh/(2*Math.tan((camera.fov||50)*Math.PI/360)*Math.max(1,camera.position.distanceTo(position)));
 return pixels>(previous==='near'?37:45)?'near':pixels>(previous==='mid'?10:12)?'mid':'far';
}
// Static world stands: three GPU levels per spatial cell; exact instance matrices are copied.
export function withSaplingInstancesV328(source,kind,fallback=source,{quality='high',cellSize=600}={}){
 const root=new T.Group();root.name='Sapling '+source.name;root.userData.saplingV328=kind;root.add(fallback);
 source.geometry.computeBoundingBox();const unitHeight=source.geometry.boundingBox.max.y-source.geometry.boundingBox.min.y;
 const bins=new Map(),matrix=new T.Matrix4(),color=new T.Color();
 for(let i=0;i<source.count;i++){
  source.getMatrixAt(i,matrix);const x=matrix.elements[12],z=matrix.elements[14],variant=saplingVariantV328(x,z),key=Math.floor(x/cellSize)+':'+Math.floor(z/cellSize)+':'+variant;
  const rows=bins.get(key)||[];rows.push({matrix:matrix.clone(),tint:source.instanceColor?(source.getColorAt(i,color),color.clone()):null,variant});bins.set(key,rows);
 }
 root.sourceSaplingV328=source;root.userData.instanceCount=source.count;root.userData.saplingReadyV328=false;
 root.userData.saplingPromiseV328=Promise.all(Array.from({length:5},(_,i)=>loadSaplingV328(kind,i,'far'))).then(()=>{
  for(const rows of bins.values()){
   const variant=rows[0].variant,lod=new T.LOD(),levels=new Map(),center=new T.Vector3(),position=new T.Vector3(),worldScale=new T.Vector3();let tallest=1,selected='far';
   for(const r of rows){center.add(new T.Vector3().setFromMatrixPosition(r.matrix));tallest=Math.max(tallest,new T.Vector3().setFromMatrixScale(r.matrix).y);}
   center.divideScalar(rows.length);center.y+=unitHeight*tallest*.5;
   function make(level){const parts=template(kind,variant,level,unitHeight);if(!parts)return null;
    const meshes=parts.map(p=>{const mesh=new T.InstancedMesh(p.geometry,p.material,rows.length);mesh.name='Sapling '+kind+' '+variant+' '+level;mesh.userData.saplingV328=kind;mesh.userData.saplingLOD=level;
     rows.forEach((r,i)=>{mesh.setMatrixAt(i,r.matrix);if(r.tint)mesh.setColorAt(i,r.tint);});mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.castShadow=level==='near';mesh.computeBoundingSphere();lod.add(mesh);return mesh;});levels.set(level,meshes);return meshes;
   }
   make('far');lod.update=camera=>{
    position.copy(center).applyMatrix4(lod.matrixWorld);lod.getWorldScale(worldScale);
    const wanted=quality==='low'?'far':saplingLevelV328(camera,position,unitHeight*tallest*worldScale.y,selected);
    let next=wanted;if(!levels.has(wanted)){if(!make(wanted)){request(kind,variant,wanted,root);next='far';}}
    for(const [level,meshes]of levels)for(const mesh of meshes)mesh.visible=level===next;selected=next;
   };root.add(lod);
  }
  fallback.visible=false;root.userData.saplingReadyV328=true;return root;
 }).catch(e=>{root.userData.saplingErrorV328=String(e);return root});
 return root;
}
// Live detail resources: shared scene batches reset at the start of each actual render.
// Hidden/chopped/streamed-out roots never submit another instance, so no ghost trees remain.
const liveScenes=new WeakMap();
function liveFor(scene){
 let map=liveScenes.get(scene);if(map)return map;map=new Map();liveScenes.set(scene,map);const before=scene.onBeforeRender;
 scene.onBeforeRender=function(...args){before?.apply(this,args);const camera=args[2];if(camera){camera.updateMatrixWorld();map.frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),camera.coordinateSystem);}for(const b of map.values())for(const mesh of b.meshes)mesh.count=0;};return map;
}
function liveBatch(scene,key,parts){
 const map=liveFor(scene);let b=map.get(key);if(b)return b;
 b={capacity:0,meshes:[],count:0};
 b.grow=n=>{let cap=Math.max(64,b.capacity);while(cap<n)cap*=2;if(cap===b.capacity)return;
  const old=b.meshes;for(const mesh of old){scene.remove(mesh);mesh.dispose();}
  b.meshes=parts.map((p,index)=>{const mesh=new T.InstancedMesh(p.geometry,p.material,cap);mesh.count=old[index]?.count||0;if(old[index])mesh.instanceMatrix.array.set(old[index].instanceMatrix.array);mesh.frustumCulled=false;mesh.name='Sapling resource '+key;mesh.userData.saplingV328=true;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(mesh);return mesh;});b.capacity=cap;};b.grow(1);map.set(key,b);return b;
}
export function withSaplingTreeV328(kind,fallback,seed=0,{height=kind==='pine'||kind==='spruce'?9:kind==='palm'?10:7}={}){
 const root=new T.LOD(),variant=saplingVariantV328(seed,seed*.13),position=new T.Vector3(),scale=new T.Vector3();root.name='Sapling resource '+kind;root.add(fallback);root.userData.saplingV328=kind;root.userData.saplingVariantV328=variant;
 request(kind,variant,'far',root);
 root.update=camera=>{
  root.getWorldPosition(position);root.getWorldScale(scale);let level=saplingLevelV328(camera,position,height*scale.y,root.userData.saplingLOD);
  let parts=template(kind,variant,level,height);if(!parts){request(kind,variant,level,root);level='far';parts=template(kind,variant,level,height);}
  if(!parts){fallback.visible=true;return;}let scene=root;while(scene.parent)scene=scene.parent;if(!scene.isScene)return;
  fallback.visible=false;const map=liveFor(scene);if(!map.frustum)map.frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),camera.coordinateSystem);const sphere=new T.Sphere(position.clone().add(new T.Vector3(0,height*scale.y*.5,0)),height*Math.max(scale.x,scale.y,scale.z));if(!map.frustum.intersectsSphere(sphere))return;root.userData.saplingLOD=level;const batch=liveBatch(scene,kind+':'+variant+':'+level+':'+height,parts);
  const i=batch.meshes[0].count;if(i>=batch.capacity)batch.grow(i+1);
  for(const mesh of batch.meshes){mesh.setMatrixAt(i,root.matrixWorld);mesh.count=i+1;mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=level==='near';}
 };
 return root;
}
export function saplingStatsV328(scene){
 const stats={staticRoots:0,staticReady:0,liveRoots:0,liveReady:0,variants:new Set(),errors:[],visibleMeshes:0,levels:{near:0,mid:0,far:0}};
 scene.traverse(o=>{if(o.sourceSaplingV328){stats.staticRoots++;if(o.userData.saplingReadyV328)stats.staticReady++;}else if(o.isLOD&&o.userData.saplingV328){stats.liveRoots++;if(o.userData.saplingLOD){stats.liveReady++;stats.variants.add(o.userData.saplingV328+':'+o.userData.saplingVariantV328);}}if(o.userData.saplingErrorV328)stats.errors.push(o.userData.saplingErrorV328);});
 scene.traverseVisible(o=>{if(o.isInstancedMesh&&o.userData.saplingV328&&o.count){stats.visibleMeshes++;const level=o.userData.saplingLOD||o.name.split(':').at(-2);if(level in stats.levels)stats.levels[level]+=o.count;}});stats.variants=stats.variants.size;return stats;
}
