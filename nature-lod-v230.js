import * as T from './vendor/three.module.js';
import {loadGLB} from './glb-lite-v221.js';

// V230 nature models (trees, bushes, animals) with a light and a detailed GLB.
// V244: performance without a visual change.
//  - The light model of every tree/bush/animal of a kind is drawn by ONE shared InstancedMesh per
//    scene (one draw call per material instead of one per tree). Each tree still owns its own
//    Group, transform and fallback, so placement, streaming and removal code is unchanged.
//  - The detailed model is used only within NATURE_NEAR_METRES of the camera, measured in real
//    metres (earlier the distance was divided by camera zoom, so far trees switched to detail).
export const NATURE_NEAR_METRES=40;
const definitions={game:['hirv',1.9],ox:['harg',1.8],fish:['kala',.35],berry:['poosas',1.2],pine:['mand',9],oak:['tamm',7]};
const assets=new Map(),queue=[];let active=0;
function texture(image,srgb=false){if(!image)return null;const t=new T.Texture(image);t.flipY=false;if(srgb)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;}
function asset(kind,detail){
 const key=kind+'_'+detail;if(assets.has(key))return assets.get(key);
 const promise=new Promise((resolve,reject)=>{queue.push(async()=>{try{
  const [name,height]=definitions[kind],data=await loadGLB('./models-nature-v230/'+name+'_'+detail+'.glb'),group=new T.Group();
  for(const p of data.primitives){const mr=texture(p.roughnessImage),m=new T.MeshStandardMaterial({map:texture(p.image,true),roughnessMap:mr,metalnessMap:mr,roughness:p.roughness,metalness:p.metalness,color:new T.Color().fromArray(p.color),vertexColors:!!p.geometry.attributes.color,side:T.DoubleSide});
   p.geometry.userData.shared=true;const mesh=new T.Mesh(p.geometry,m);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
  const b=new T.Box3().setFromObject(group),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());
  if(!(size.y>0))throw new Error('Empty nature model '+key);
  const scale=height/size.y;group.scale.setScalar(scale);group.position.set(-center.x*scale,-b.min.y*scale,-center.z*scale);
  group.updateMatrix();group.userData.radius=Math.max(size.x,size.y,size.z)*scale*.75;
  resolve(group);
 }catch(e){reject(e);}});pump();});assets.set(key,promise);return promise;
}
function pump(){while(active<2&&queue.length){active++;queue.shift()().finally(()=>{active--;pump();});}}

// ------------------------------------------------------------------ V244 shared instancing
// Rebuilt every frame from the trees the renderer visits (their LOD.update runs during scene
// projection, before any draw), so moved, hidden, streamed or removed trees need no bookkeeping.
let frame=0;const allBatches=new Set();
// Each animation frame starts empty; trees refill the batches while the scene is projected.
if(typeof requestAnimationFrame==='function'){const tick=()=>{frame++;for(const b of allBatches){b.count=0;b.camera=null;for(const m of b.meshes)m.mesh.count=0;}requestAnimationFrame(tick);};requestAnimationFrame(tick);}
const batches=new WeakMap();   // scene -> Map(kind -> batch)
const frustum=new T.Frustum(),projScreen=new T.Matrix4(),sphere=new T.Sphere(),tmp=new T.Matrix4();
let frustumFrame=-1,frustumCamera=null;
function batchFor(scene,kind,template){
 let byKind=batches.get(scene);if(!byKind){byKind=new Map();batches.set(scene,byKind);}
 let b=byKind.get(kind);if(b)return b;
 const meshes=[];template.traverse(o=>{if(!o.isMesh)return;
  // child matrix relative to the template group (scale + centring)
  o.updateWorldMatrix(true,false);const local=new T.Matrix4().copy(template.matrixWorld).invert().multiply(o.matrixWorld).premultiply(template.matrix);
  meshes.push({geometry:o.geometry,material:o.material,local});});
 b={kind,camera:null,count:0,capacity:0,meshes:[],template,list:[]};
 b.grow=n=>{let cap=Math.max(64,b.capacity);while(cap<n)cap*=2;if(cap===b.capacity)return;
  for(const m of b.meshes)scene.remove(m.mesh);b.meshes=[];
  for(const src of meshes){const mesh=new T.InstancedMesh(src.geometry,src.material,cap);mesh.count=0;mesh.frustumCulled=false;
   mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='V244 nature '+kind;mesh.userData.natureBatchV244=kind;
   mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(mesh);b.meshes.push({mesh,local:src.local});}
  b.capacity=cap;};
 byKind.set(kind,b);allBatches.add(b);return b;
}
function pushInstance(scene,kind,template,root,camera){
 const b=batchFor(scene,kind,template);
 // the same scene drawn again with another camera in one frame (preview, walking view)
 if(b.camera!==camera){b.camera=camera;b.count=0;for(const m of b.meshes){m.mesh.count=0;if(m.mesh.parent!==scene)scene.add(m.mesh);}}
 // skip trees outside the main camera view (shadow-only trees just outside the view are kept
 // through the generous radius below, so shadows at the screen edge do not pop)
 if(frustumFrame!==frame||frustumCamera!==camera){frustumFrame=frame;frustumCamera=camera;
  projScreen.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(projScreen);}
 sphere.center.setFromMatrixPosition(root.matrixWorld);sphere.radius=(template.userData.radius||5)*3+12;
 if(!frustum.intersectsSphere(sphere))return;
 if(b.count+1>b.capacity)b.grow(b.count+1);
 const i=b.count++;
 for(const m of b.meshes){tmp.multiplyMatrices(root.matrixWorld,m.local);m.mesh.setMatrixAt(i,tmp);m.mesh.count=b.count;m.mesh.instanceMatrix.needsUpdate=true;}
}
function sceneOf(o){while(o.parent)o=o.parent;return o.isScene?o:null;}

export function withNatureLOD(kind,fallback){
 const root=new T.Group(),high=new T.Group();root.add(fallback,high);high.visible=false;
 root.userData.natureV230=kind;root.userData.lowReady=false;root.userData.highReady=false;
 let template=null;
 asset(kind,'low').then(g=>{template=g;fallback.visible=false;root.userData.lowReady=true;root.userData.lowInstancedV244=true;}).catch(e=>{root.userData.natureError=String(e);});
 // The renderer calls this LOD with the active camera, including walking cameras.
 const lod=new T.LOD();root.add(lod);let pending=false;
 lod.update=camera=>{
  root.getWorldPosition(point);camera.getWorldPosition(eye);const d=point.distanceTo(eye);
  const near=d<(root.userData.nearActive?NATURE_NEAR_METRES*1.1:NATURE_NEAR_METRES);
  root.userData.cameraDistance=d;
  if(near&&!pending){pending=true;asset(kind,'high').then(g=>{high.add(g.clone(true));root.userData.highReady=true;}).catch(e=>{root.userData.natureError=String(e);});}
  const show=near&&root.userData.highReady;high.visible=show;fallback.visible=!show&&!root.userData.lowReady;
  root.userData.nearActive=show;
  if(!show&&template){const scene=sceneOf(root);if(scene)pushInstance(scene,kind,template,root,camera);}
 };
 const point=new T.Vector3(),eye=new T.Vector3();return root;
}
