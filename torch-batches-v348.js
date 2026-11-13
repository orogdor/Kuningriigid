// V348: animated parts of town lights (flame planes, sparks, smoke, glow halo,
// light pool) drawn as one InstancedMesh per geometry+material instead of
// ~20 separate draw calls per torch. The original objects stay in the tree:
// the V251 animation keeps moving them, and their world matrices are copied
// into the instances every frame. Looks are unchanged: same geometry, same
// material (sprites get the same sprite shader, only reading the instance
// matrix), same render order. WebGL only; WebGPU keeps the old path.
import * as T from './vendor/three.module.js';

// Created on first use: object ids come from Math.random, and seeded tests
// must see the same random sequence at start-up as before V348.
let spriteGeoV348=null;
function spriteGeometry(){if(!spriteGeoV348){spriteGeoV348=new T.Sprite().geometry;spriteGeoV348.userData.shared=true;}return spriteGeoV348;}
const spriteClones=new WeakMap();
// Same SpriteMaterial (map, colour, opacity, blending, fog), but the sprite
// centre and scale come from modelMatrix*instanceMatrix.
function instancedSpriteMaterial(source){
 let m=spriteClones.get(source);if(m)return m;
 m=source.clone();m.name=(source.name||'sprite')+' instanced V348';
 m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader
  .replace('vec4 mvPosition = modelViewMatrix[ 3 ];','mat4 mmV348 = modelMatrix;\n#ifdef USE_INSTANCING\n\tmmV348 = modelMatrix * instanceMatrix;\n#endif\n\tvec4 mvPosition = viewMatrix * mmV348[ 3 ];')
  .replace('vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );','vec2 scale = vec2( length( mmV348[ 0 ].xyz ), length( mmV348[ 1 ].xyz ) );');};
 m.customProgramCacheKey=()=>'sprite-instanced-v348';
 // Smoke opacity is set on the shared source material by the animation.
 m.userData.sourceV348=source;spriteClones.set(source,m);return m;
}
function sourceKind(o){return o.isSprite?'sprite':o.isMesh&&!o.isInstancedMesh?'mesh':null;}

// models: [{root,flame,halo,pool,...}] from fixtureModel(); group: their parent.
export function createTorchBatchesV348(group,models){
 const buckets=new Map(),sources=[];
 const add=(obj,model,logical)=>{
  const kind=sourceKind(obj);if(!kind)return;
  const mat=obj.material;if(!mat||Array.isArray(mat))return;
  if(kind==='mesh'&&!(mat.isMeshBasicMaterial||mat.isMeshStandardMaterial||mat.isShaderMaterial))return;
  const geo=kind==='sprite'?spriteGeometry():obj.geometry;
  const key=kind+':'+geo.id+':'+mat.id+':'+obj.renderOrder+':'+obj.castShadow+':'+obj.receiveShadow;
  let b=buckets.get(key);if(!b){b={kind,geo,mat,renderOrder:obj.renderOrder,castShadow:obj.castShadow,receiveShadow:obj.receiveShadow,items:[]};buckets.set(key,b);}
  const item={obj,model,logical};b.items.push(item);sources.push(item);
 };
 for(const model of models){
  // halo and pool visibility is switched every frame by the animation; read it from them.
  if(model.halo)add(model.halo,model,'self');
  if(model.pool)add(model.pool,model,'self');
  model.flame?.traverse(o=>{if(o!==model.flame)add(o,model,'flame')});
 }
 const batches=[];
 for(const b of buckets.values()){
  if(b.items.length<2)continue;
  const material=b.kind==='sprite'?instancedSpriteMaterial(b.mat):b.mat;
  const mesh=new T.InstancedMesh(b.geo,material,b.items.length);
  mesh.name='Town light parts V348';mesh.renderOrder=b.renderOrder;mesh.castShadow=b.castShadow;mesh.receiveShadow=b.receiveShadow;
  mesh.frustumCulled=false;mesh.raycast=()=>{};mesh.count=0;
  if(b.kind==='sprite')mesh.center=new T.Vector2(.5,.5);
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  group.add(mesh);batches.push({mesh,items:b.items,sprite:b.kind==='sprite',source:b.mat});
 }
 for(const {items} of batches)for(const it of items)it.batched=true;
 const inverse=new T.Matrix4(),rel=new T.Matrix4();
 function visibleUpTo(o,stop){for(let p=o;p&&p!==stop;p=p.parent)if(!p.visible)return false;return true;}
 function sync(){
  if(!batches.length)return;
  group.updateMatrixWorld(true);inverse.copy(group.matrixWorld).invert();
  for(const batch of batches){
   const {mesh,items}=batch;let n=0;
   for(const it of items){
    const o=it.obj,vis=(it.logical!=='self'||o.visible)&&visibleUpTo(o.parent,group);
    if(vis){rel.multiplyMatrices(inverse,o.matrixWorld);mesh.setMatrixAt(n++,rel);}
   }
   mesh.count=n;if(n)mesh.instanceMatrix.needsUpdate=true;
   if(batch.sprite){mesh.material.opacity=batch.source.opacity;mesh.material.color.copy(batch.source.color);}
  }
 }
 // halo/pool: the renderer must skip the originals, but the animation writes
 // .visible every frame; hide them through layers instead of .visible.
 // Flame parts are never toggled by the animation, so .visible=false is enough.
 for(const it of sources)if(it.batched){if(it.logical==='self'){it.layersV348=it.obj.layers.mask;it.obj.layers.mask=0;}else it.obj.visible=false;}
 sync();
 return {count:batches.length,instances:sources.filter(s=>s.batched).length,sync,
  dispose(){for(const {mesh} of batches){mesh.removeFromParent();mesh.dispose();}
   for(const it of sources)if(it.batched){if(it.logical==='self')it.obj.layers.mask=it.layersV348;else it.obj.visible=true;}
   batches.length=0;}};
}
