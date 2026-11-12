import {pickTreeV329} from './forest-ecology-v329.js';
// Approved Sapling trees. Rendering only: callers retain their exact saved placements.
import * as T from './vendor/three.module.js';
import {loadGLB} from './glb-lite-v221.js';
export const SAPLING_SPECIES_V328=new Set(['pine','spruce','oak','lime','birch','palm']);
const ROOT=new URL('./assets/sapling-trees/',import.meta.url),loads=new Map(),ready=new Map(),scaled=new Map(),textures=new Map();
let manifestPromise,active=0,assetRevision=0;const queue=[];
const manifest=()=>manifestPromise??=fetch(new URL('manifest.json',ROOT)).then(r=>{if(!r.ok)throw Error('Sapling manifest '+r.status);return r.json()});
function task(fn){return new Promise((resolve,reject)=>{queue.push(()=>fn().then(resolve,reject));pump()});}
function pump(){while(active<4&&queue.length){active++;queue.shift()().finally(()=>{active--;pump()});}}
export function saplingVariantV328(x,z,seed=0){const n=Math.sin(x*12.9898+z*78.233+seed*.017)*43758.5453;return Math.min(4,Math.floor((n-Math.floor(n))*5));}
export function saplingSpeciesV328(biome='',seed=0){
 const n=Math.sin(seed*127.1+93.7)*43758.5453;return pickTreeV329(biome,n-Math.floor(n));
}
export function loadSaplingV328(kind,variant,level){
 const key=kind+':'+variant+':'+level;if(loads.has(key))return loads.get(key);
 const promise=task(async()=>{
  const meta=await manifest(),id=kind+'_'+String(variant+1).padStart(2,'0'),rec=meta.trees.find(t=>t.id===id),ref=meta.trees.filter(t=>t.species===kind).sort((a,b)=>a.boundsZUp[1][2]-b.boundsZUp[1][2])[2];
  if(!rec||!ref)throw Error('Missing Sapling '+id);
  const data=await loadGLB(new URL(id+'/'+level+'.glb',ROOT),{premultiplyAlpha:'none'});
  const parts=data.primitives.map((p,i)=>{
   let map=null;if(p.image){const tk=level==='far'?id+':'+i:kind+':foliage';map=textures.get(tk);
    if(!map){map=new T.Texture(p.image);map.flipY=false;map.colorSpace=T.SRGBColorSpace;map.needsUpdate=true;textures.set(tk,map);}else if(p.image!==map.image)p.image.close?.();} // V345: two primitives may share one bitmap; never close the one the texture uses
   const params={color:new T.Color().fromArray(p.color),map,alphaTest:map?.4:0,side:T.DoubleSide,depthWrite:true};
   const material=level==='far'?new T.MeshBasicMaterial(params):new T.MeshStandardMaterial({...params,roughness:.95});material.userData.shared=true;
   p.geometry.userData.shared=true;p.geometry.computeBoundingSphere();return {geometry:p.geometry,material};
  });
  const result={parts,referenceHeight:ref.boundsZUp[1][2],height:rec.boundsZUp[1][2],key};ready.set(key,result);assetRevision++;return result;
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
function buildDetailStand(root,kind,height,bins,quality,cellSize,onMeshAdded,visibility){
 const sectors=new Map(),cells=[];
 for(const rows of bins.values()){
  const variant=rows[0].variant,center=new T.Vector3(),scale=new T.Vector3();
  let tallest=1;
  for(const row of rows){
   const m=row.matrix.elements;
   center.x+=m[12];center.y+=m[13];center.z+=m[14];
   tallest=Math.max(tallest,scale.setFromMatrixScale(row.matrix).y);
  }
  center.divideScalar(rows.length);center.y+=height*tallest*.5;
  const key=Math.floor(center.x/(cellSize*3))+':'+Math.floor(center.z/(cellSize*3))+':'+variant;
  let sector=sectors.get(key);
  if(!sector){sector={variant,capacity:0,levels:new Map()};sectors.set(key,sector);}
  sector.capacity+=rows.length;
  cells.push({rows,center,tallest,sector,level:null});
 }
 const position=new T.Vector3(),scale=new T.Vector3(),lastPosition=new T.Vector3(),lastWorld=new T.Matrix4();
 const lastProjection=new T.Matrix4(),requested=new Set();
 let lastHeight=0,lastRevision=-1,lastVisibility=-1;
 root.update=camera=>{
  const viewportHeight=typeof innerHeight==='number'?innerHeight:800;
  if(lastRevision===assetRevision&&lastVisibility===visibility.revision&&lastHeight===viewportHeight&&lastPosition.equals(camera.position)
   &&lastProjection.equals(camera.projectionMatrix)&&lastWorld.equals(root.matrixWorld))return;
  lastRevision=assetRevision;lastHeight=viewportHeight;lastPosition.copy(camera.position);
  lastProjection.copy(camera.projectionMatrix);lastWorld.copy(root.matrixWorld);
  scale.setFromMatrixScale(root.matrixWorld);
  let changed=lastVisibility!==visibility.revision;
  lastVisibility=visibility.revision;
  for(const cell of cells){
   const {variant}=cell.sector;
   position.copy(cell.center).applyMatrix4(root.matrixWorld);
   let level=quality==='low'?'far':saplingLevelV328(camera,position,height*cell.tallest*scale.y,cell.level??'far');
   const key=kind+':'+variant+':'+level;
   if(!ready.has(key)){
    if(!requested.has(key)){requested.add(key);request(kind,variant,level,root);}
    level='far';
   }
   if(cell.level!==level){cell.level=level;changed=true;}
  }
  if(!changed)return;
  for(const sector of sectors.values())for(const meshes of sector.levels.values())for(const mesh of meshes)mesh.count=0;
  for(const {sector,level,rows} of cells){
   let meshes=sector.levels.get(level);
   if(!meshes){
    const parts=template(kind,sector.variant,level,height);
    if(!parts)continue;
    meshes=parts.map(({geometry,material})=>{
     const mesh=new T.InstancedMesh(geometry,material,sector.capacity);
     mesh.name='Sapling '+kind+' '+sector.variant+' '+level;
     mesh.userData.saplingV328=kind;mesh.userData.saplingLOD=level;mesh.castShadow=level==='near';
     mesh.count=0;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(mesh);
     mesh.updateWorldMatrix(false,false);onMeshAdded();
     return mesh;
    });
    sector.levels.set(level,meshes);
   }
   for(const mesh of meshes){
    for(const row of rows){
     if(visibility.mask&&!visibility.mask[row.index])continue;
     const i=mesh.count++;
     mesh.setMatrixAt(i,row.matrix);
     if(row.tint)mesh.setColorAt(i,row.tint);
    }
   }
  }
  for(const sector of sectors.values())for(const meshes of sector.levels.values())for(const mesh of meshes){
   mesh.visible=mesh.count>0;
   if(!mesh.visible)continue;
   mesh.instanceMatrix.clearUpdateRanges();
   mesh.instanceMatrix.addUpdateRange(0,mesh.count*16);mesh.instanceMatrix.needsUpdate=true;
   if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
   mesh.computeBoundingSphere();
  }
 };
}
// Static world stands: three GPU levels per spatial cell; exact instance matrices are copied.
export function withSaplingInstancesV328(source,kind,fallback=source,{quality='high',cellSize=600,staticTransforms=false,batchCells=false}={}){
 const root=batchCells?new T.LOD():new T.Group();root.name='Sapling '+source.name;root.userData.saplingV328=kind;root.add(fallback);
 const visibility={revision:0,mask:null};
 if(batchCells)root.setSaplingVisibilityV346f=mask=>{visibility.mask=mask;visibility.revision++;};
 let transformsDirty=true;
 if(staticTransforms){
  const update=root.updateMatrixWorld,local=new T.Matrix4(),parentWorld=new T.Matrix4();
  let previousParent=null;
  root.updateMatrixWorld=function(){
   if(this.matrixAutoUpdate)this.updateMatrix();
   const parent=this.parent;
   if(!transformsDirty&&parent===previousParent&&local.equals(this.matrix)&&(!parent||parentWorld.equals(parent.matrixWorld))){
    this.matrixWorldNeedsUpdate=false;
    return;
   }
   update.call(this,true);
   local.copy(this.matrix);
   if(parent)parentWorld.copy(parent.matrixWorld);
   previousParent=parent;
   transformsDirty=false;
  };
 }
 source.geometry.computeBoundingBox();const unitHeight=source.geometry.boundingBox.max.y-source.geometry.boundingBox.min.y;
 const bins=new Map(),matrix=new T.Matrix4(),color=new T.Color();
 for(let i=0;i<source.count;i++){
  source.getMatrixAt(i,matrix);const x=matrix.elements[12],z=matrix.elements[14],variant=saplingVariantV328(x,z),key=Math.floor(x/cellSize)+':'+Math.floor(z/cellSize)+':'+variant;
  const rows=bins.get(key)||[];rows.push({matrix:matrix.clone(),tint:source.instanceColor?(source.getColorAt(i,color),color.clone()):null,variant,index:i});bins.set(key,rows);
 }
 root.sourceSaplingV328=source;root.userData.instanceCount=source.count;root.userData.saplingReadyV328=false;
 root.userData.saplingPromiseV328=Promise.all(Array.from({length:5},(_,i)=>loadSaplingV328(kind,i,'far'))).then(()=>{
  if(batchCells)buildDetailStand(root,kind,unitHeight,bins,quality,cellSize,()=>{transformsDirty=true;},visibility);
  else for(const rows of bins.values()){
   const variant=rows[0].variant,lod=new T.LOD(),levels=new Map(),center=new T.Vector3(),position=new T.Vector3(),worldScale=new T.Vector3();let tallest=1,selected='far';
   for(const r of rows){center.add(new T.Vector3().setFromMatrixPosition(r.matrix));tallest=Math.max(tallest,new T.Vector3().setFromMatrixScale(r.matrix).y);}
   center.divideScalar(rows.length);center.y+=unitHeight*tallest*.5;
   function make(level){const parts=template(kind,variant,level,unitHeight);if(!parts)return null;
    const meshes=parts.map(p=>{const mesh=new T.InstancedMesh(p.geometry,p.material,rows.length);mesh.name='Sapling '+kind+' '+variant+' '+level;mesh.userData.saplingV328=kind;mesh.userData.saplingLOD=level;
     rows.forEach((r,i)=>{mesh.setMatrixAt(i,r.matrix);if(r.tint)mesh.setColorAt(i,r.tint);});mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.castShadow=level==='near';mesh.computeBoundingSphere();lod.add(mesh);
     // A new LOD can be created during render traversal, after the scene's matrix update.
     if(staticTransforms)mesh.updateWorldMatrix(false,false);
     return mesh;});levels.set(level,meshes);transformsDirty=true;return meshes;
   }
   make('far');lod.update=camera=>{
    position.copy(center).applyMatrix4(lod.matrixWorld);worldScale.setFromMatrixScale(lod.matrixWorld);
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
 let map=liveScenes.get(scene);if(map)return map;map=new Map();map.frustum=new T.Frustum();map.viewMatrix=new T.Matrix4();map.viewReady=false;liveScenes.set(scene,map);const before=scene.onBeforeRender;
 scene.onBeforeRender=function(...args){before?.apply(this,args);const camera=args[2];if(camera){camera.updateMatrixWorld();map.frustum.setFromProjectionMatrix(map.viewMatrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),camera.coordinateSystem);map.viewReady=true;}for(const b of map.values())for(const mesh of b.meshes)mesh.count=0;};return map;
}
function liveBatch(scene,key,parts){
 const map=liveFor(scene);let b=map.get(key);if(b)return b;
 b={capacity:0,meshes:[],count:0};
 b.grow=n=>{let cap=Math.max(64,b.capacity);while(cap<n)cap*=2;if(cap===b.capacity)return;
  const old=b.meshes;for(const mesh of old){scene.remove(mesh);mesh.dispose();}
  const near=key.split(':')[2]==='near';
  b.meshes=parts.map((p,index)=>{
   const mesh=new T.InstancedMesh(p.geometry,p.material,cap);
   mesh.count=old[index]?.count||0;
   if(old[index])mesh.instanceMatrix.array.set(old[index].instanceMatrix.array);
   mesh.frustumCulled=false;mesh.name='Sapling resource '+key;
   mesh.userData.saplingV328=true;mesh.castShadow=near;
   mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
   // Flush only before a real GPU submission. Shadow passes do not run onBeforeRender.
   const flush=()=>{
    if(mesh.userData.saplingBufferDirty){
     mesh.instanceMatrix.needsUpdate=true;
     mesh.userData.saplingBufferDirty=false;
    }
   };
   mesh.onBeforeRender=flush;mesh.onBeforeShadow=flush;
   scene.add(mesh);return mesh;
  });
  b.capacity=cap;
 };
 b.grow(1);map.set(key,b);return b;
}
export function withSaplingTreeV328(kind,fallback,seed=0,{height=kind==='pine'||kind==='spruce'?9:kind==='palm'?10:7}={}){
 const root=new T.LOD(),variant=saplingVariantV328(seed,seed*.13),position=new T.Vector3(),scale=new T.Vector3(),sphere=new T.Sphere();
 root.name='Sapling resource '+kind;root.add(fallback);
 root.userData.saplingV328=kind;root.userData.saplingVariantV328=variant;
 const partsByLevel={far:null,mid:null,near:null},batchesByLevel={far:null,mid:null,near:null};
 const keysByLevel={
  far:kind+':'+variant+':far:'+height,
  mid:kind+':'+variant+':mid:'+height,
  near:kind+':'+variant+':near:'+height
 };
 const requested=new Set();
 const requestOnce=level=>{if(requested.has(level))return;requested.add(level);request(kind,variant,level,root);};
 requestOnce('far');
 // Observe ancestor detach/reparent events so a reused parent cannot keep a stale scene.
 let cachedScene=null,cachedParent=null;const observedAncestors=[];
 function invalidateScene(){
  cachedScene=null;cachedParent=null;
  for(const object of observedAncestors)object.removeEventListener('removed',invalidateScene);
  observedAncestors.length=0;
  batchesByLevel.far=null;batchesByLevel.mid=null;batchesByLevel.near=null;
 }
 // Detached roots must release their ancestor listeners immediately.
 root.addEventListener('removed',invalidateScene);
 function sceneForRoot(){
  if(root.parent===cachedParent&&cachedScene)return cachedScene;
  const previousScene=cachedScene;
  for(const object of observedAncestors)object.removeEventListener('removed',invalidateScene);
  observedAncestors.length=0;
  let top=root;
  while(top.parent){
   top=top.parent;
   top.addEventListener('removed',invalidateScene);
   observedAncestors.push(top);
  }
  cachedParent=root.parent;
  cachedScene=top.isScene?top:null;
  if(previousScene!==cachedScene){
   batchesByLevel.far=null;batchesByLevel.mid=null;batchesByLevel.near=null;
  }
  return cachedScene;
 }
 root.update=camera=>{
  // The renderer already updated matrixWorld before traversing LOD nodes.
  position.setFromMatrixPosition(root.matrixWorld);scale.setFromMatrixScale(root.matrixWorld);
  let level=saplingLevelV328(camera,position,height*scale.y,root.userData.saplingLOD);
  let parts=partsByLevel[level]||(partsByLevel[level]=template(kind,variant,level,height));
  if(!parts){
   requestOnce(level);level='far';
   parts=partsByLevel.far||(partsByLevel.far=template(kind,variant,'far',height));
  }
  if(!parts){fallback.visible=true;return;}
  const scene=sceneForRoot();if(!scene)return;
  fallback.visible=false;const map=liveFor(scene);
  if(!map.viewReady){
   map.frustum.setFromProjectionMatrix(map.viewMatrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),camera.coordinateSystem);
   map.viewReady=true;
  }
  sphere.center.copy(position);sphere.center.y+=height*scale.y*.5;
  sphere.radius=height*Math.max(scale.x,scale.y,scale.z);
  if(!map.frustum.intersectsSphere(sphere))return;
  root.userData.saplingLOD=level;
  const batch=batchesByLevel[level]||(batchesByLevel[level]=liveBatch(scene,keysByLevel[level],parts));
  const i=batch.meshes[0].count;if(i>=batch.capacity)batch.grow(i+1);
  for(const mesh of batch.meshes){
   mesh.setMatrixAt(i,root.matrixWorld);
   mesh.count=i+1;mesh.userData.saplingBufferDirty=true;
  }
 };
 return root;
}
export function saplingStatsV328(scene){
 const stats={staticRoots:0,staticReady:0,liveRoots:0,liveReady:0,variants:new Set(),errors:[],visibleMeshes:0,levels:{near:0,mid:0,far:0}};
 scene.traverse(o=>{if(o.sourceSaplingV328){stats.staticRoots++;if(o.userData.saplingReadyV328)stats.staticReady++;}else if(o.isLOD&&o.userData.saplingV328){stats.liveRoots++;if(o.userData.saplingLOD){stats.liveReady++;stats.variants.add(o.userData.saplingV328+':'+o.userData.saplingVariantV328);}}if(o.userData.saplingErrorV328)stats.errors.push(o.userData.saplingErrorV328);});
 scene.traverseVisible(o=>{if(o.isInstancedMesh&&o.userData.saplingV328&&o.count){stats.visibleMeshes++;const level=o.userData.saplingLOD||o.name.split(':').at(-2);if(level in stats.levels)stats.levels[level]+=o.count;}});stats.variants=stats.variants.size;return stats;
}
