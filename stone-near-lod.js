// Detailed, user-supplied Stone Age meshes are fetched only within 100 detail metres.
// The existing distant meshes, dimensions, motion and gameplay remain unchanged.
import * as T from './vendor/three.module.js';
import {applyStoneSize} from './stone-sizes-v224.js';
import {loadGLB} from './glb-lite-v221.js';

export const STONE_NEAR_DISTANCE=100;
let nearDistanceV226=STONE_NEAR_DISTANCE,nearHumanDistanceV226=STONE_NEAR_DISTANCE;
export function setStoneNearDistanceV226(buildings=100,humans=100){nearDistanceV226=Math.max(25,Math.min(240,Number(buildings)||100));nearHumanDistanceV226=Math.max(25,Math.min(240,Number(humans)||100));}
const assets=new Map(),queue=[];
let active=0;
function pump(){
 while(active<2&&queue.length){
  const job=queue.shift();active++;
  job().finally(()=>{active--;pump();});
 }
}
function texture(image,srgb=false){
 if(!image)return null;
 const t=new T.Texture(image);t.flipY=false;
 if(srgb)t.colorSpace=T.SRGBColorSpace;
 t.anisotropy=4;t.needsUpdate=true;return t;
}
function detailedAsset(name){
 if(assets.has(name))return assets.get(name);
 const promise=new Promise((resolve,reject)=>{
  queue.push(async()=>{
   try{
    const data=await loadGLB('./models-stone-near/'+name+'.glb');
    if(data.primitives.length!==1)throw new Error('Expected one detailed mesh: '+name);
    const p=data.primitives[0],mr=texture(p.roughnessImage);
    const material=new T.MeshStandardMaterial({map:texture(p.image,true),roughnessMap:mr,metalnessMap:mr,
     roughness:p.roughness,metalness:p.metalness,side:T.DoubleSide,
     color:new T.Color().fromArray(p.color),opacity:p.color[3]});
    resolve({data,geometry:p.geometry,material});
   }catch(error){reject(error);}
  });pump();
 });
 assets.set(name,promise);return promise;
}

// Renderer updates LODs using the active camera, including walking and preview cameras.
class LazyStoneLOD extends T.LOD{
 constructor(low,build){
  super();this.low=low;this.high=new T.Group();this.build=build;
  this.addLevel(this.high,0);this.addLevel(low,STONE_NEAR_DISTANCE,.05);
  this.high.visible=false;this.low.visible=true;this.userData.stoneNearLOD=true;
  this.userData.nearReady=false;this.userData.nearActive=false;
 }
 update(camera){
  // A unit in the detail scene is approximately a metre; world-space distance
  // also works if a caller puts the model under a transformed parent.
  this.getWorldPosition(this._point??=new T.Vector3());
  camera.getWorldPosition(this._eye??=new T.Vector3());
  const d=this._eye.distanceTo(this._point)/(camera.zoom||1);
  const limit=this.userData.stoneHumanV226?nearHumanDistanceV226:nearDistanceV226;
  const near=d<(this.userData.nearActive?limit*1.05:limit);
  this.userData.cameraDistance=d;
  if(near&&!this.pending){
   this.pending=true;
   this.build().then(mesh=>{
    // Placement ghosts customise the already-present low material before the
    // detailed file arrives. Carry that presentation over without changing the
    // shared material used by completed buildings.
    let lowMaterial;this.low.traverse(o=>{if(o.material&&!lowMaterial)lowMaterial=o.material;});
    if(lowMaterial?.transparent&&lowMaterial.opacity<1){
     mesh.material=mesh.material.clone();mesh.material.transparent=true;
     mesh.material.opacity=lowMaterial.opacity;mesh.material.depthWrite=lowMaterial.depthWrite;
     mesh.material.color.copy(lowMaterial.color);
    }
    this.high.add(mesh);this.userData.nearReady=true;
   }).catch(error=>{this.userData.nearError=String(error);console.warn('Keeping distant Stone Age model',error);});
  }
  const show=near&&this.userData.nearReady;
  this.high.visible=show;this.low.visible=!show;this.userData.nearActive=show;
 }
}

const highGeometry=new Map();
export function withStoneBuildingLOD(low,type,size,seed=0){
 const name=type==='hall'?'peamaja':type;
 const root=new LazyStoneLOD(low,async()=>{
  const asset=await detailedAsset(name);
  if(!highGeometry.has(name)){
   const g=asset.geometry;g.computeBoundingBox();
   const box=g.boundingBox,c=box.getCenter(new T.Vector3());
   g.translate(-c.x,-box.min.y,-c.z);
   // Use the same front direction as the existing distant versions.
   if(['lumber','house'].includes(type))g.rotateY(-Math.PI/2);
   else if(type==='farm')g.rotateY(Math.PI/2);
   g.computeBoundingBox();g.computeBoundingSphere();
   highGeometry.set(name,g);
  }
  const g=highGeometry.get(name),extent=g.boundingBox.getSize(new T.Vector3());
  const mesh=new T.Mesh(g,asset.material);
  if(!applyStoneSize(mesh,type,extent,seed))mesh.scale.setScalar(size/Math.max(extent.x,extent.z)*(type==='house'?.94+((seed>>>3)%7)*.02:1)); // V224 real sizes
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.stoneDetailedAsset=name;return mesh;
 });
 Object.assign(root.userData,low.userData);root.userData.stoneNearLOD=true;
 return root;
}

export function withStoneHumanLOD(low){
 const lod=new LazyStoneLOD(low,async()=>{
  const asset=await detailedAsset('human_rigged');
  // The detailed source is centred vertically, while the shared skeleton and
  // the simplified mesh use feet at zero and height one.
  if(!highGeometry.has('human_rigged')){
   const geometry=asset.geometry.clone();geometry.computeBoundingBox();
   const box=geometry.boundingBox, height=box.max.y-box.min.y;
   geometry.translate(-(box.min.x+box.max.x)/2,-box.min.y,0);
   geometry.scale(1/height,1/height,1/height);geometry.computeBoundingBox();geometry.computeBoundingSphere();
   highGeometry.set('human_rigged',geometry);
  }
  const mesh=new T.SkinnedMesh(highGeometry.get('human_rigged'),asset.material);
  // Share the animated skeleton, including its original inverse bind pose.
  // This keeps phase, bone names, direct village poses and hand-held tools.
  mesh.bind(low.skeleton,low.bindMatrix);mesh.castShadow=true;mesh.receiveShadow=false;
  mesh.userData.stoneDetailedAsset='human_rigged';return mesh;
 });
 lod.userData.stoneHumanV226=true;return lod;
}
