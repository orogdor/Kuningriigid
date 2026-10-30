// V233: build simplified far meshes from the very same textured Stone Age GLBs.
// Old distant shapes are temporary placeholders while the GLB is loading.
import * as T from './vendor/three.module.js';
import {applyStoneSize} from './stone-sizes-v224.js';
import {loadGLB} from './glb-lite-v221.js';
import {requestAssetV241} from './asset-queue-v241.js';

export const STONE_NEAR_DISTANCE=100;
let nearDistanceV226=STONE_NEAR_DISTANCE,nearHumanDistanceV226=STONE_NEAR_DISTANCE;
export function setStoneNearDistanceV226(buildings=100,humans=100){nearDistanceV226=Math.max(25,Math.min(240,Number(buildings)||100));nearHumanDistanceV226=Math.max(25,Math.min(240,Number(humans)||100));}
function texture(image,srgb=false){
 if(!image)return null;
 const t=new T.Texture(image);t.flipY=false;
 if(srgb)t.colorSpace=T.SRGBColorSpace;
 t.anisotropy=4;t.needsUpdate=true;return t;
}
export function detailedAsset(name){
 return requestAssetV241('stone-detail:'+name,async()=>{
    const data=await loadGLB('./models-stone-near/'+name+'.glb');
    if(data.primitives.length!==1)throw new Error('Expected one detailed mesh: '+name);
    const p=data.primitives[0],mr=texture(p.roughnessImage);
    const material=new T.MeshStandardMaterial({map:texture(p.image,true),roughnessMap:mr,metalnessMap:mr,
     roughness:p.roughness,metalness:p.metalness,side:T.DoubleSide,
     color:new T.Color().fromArray(p.color),opacity:p.color[3]});
    return {data,geometry:p.geometry,material};
 });
}

// V237: all ghost meshes must own their material clones. An asynchronous GLB
// that enters the preview later must NEVER alter the shared real-building PBR
// material or inherit an accidental tint outside the preview.
export function setStonePreviewV237(root,color='#9fc877',opacity=.48){
 if(!root)return root;
 root.traverse(o=>{
  if(o.userData?.stoneNearLOD){o.userData.stonePreviewV237=true;o.userData.previewColorV237=color;o.userData.previewOpacityV237=opacity;}
  if(!o.material)return;
  if(!o.userData.previewMaterialsIsolatedV237){
   o.material=Array.isArray(o.material)?o.material.map(m=>m?.clone?.()||m):o.material.clone();
   o.userData.previewMaterialsIsolatedV237=true;
  }
  for(const m of Array.isArray(o.material)?o.material:[o.material]){
   if(!m)continue;
   m.transparent=true;m.opacity=opacity;m.depthWrite=false;
   m.color?.set(color);
  }
 });
 return root;
}
// Renderer updates LODs using the active camera, including walking and preview cameras.
class LazyStoneLOD extends T.LOD{
 constructor(low,build,buildFar=null){
  super();this.low=low;this.high=new T.Group();this.build=build;
  this.addLevel(this.high,0);this.addLevel(low,STONE_NEAR_DISTANCE,.05);
  this.high.visible=false;this.low.visible=true;this.userData.stoneNearLOD=true;
  this.userData.nearReady=false;this.userData.nearActive=false;
  this.userData.stoneFarReady=false;
  // The old mesh is only a placeholder while the original GLB streams.
  if(buildFar)Promise.resolve().then(buildFar).then(mesh=>{
   if(!mesh)return;
   if(this.userData.stonePreviewV237)setStonePreviewV237(mesh,this.userData.previewColorV237,this.userData.previewOpacityV237);
   const old=this.low;this.remove(old);this.low=mesh;
   this.addLevel(mesh,STONE_NEAR_DISTANCE,.05);
   mesh.visible=!this.userData.nearActive;
   this.userData.stoneFarReady=true;
   this.userData.stoneFarSource='detailed-glb';
  }).catch(error=>{this.userData.farError=String(error);console.warn('Keeping temporary Stone Age far model',error);});
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
    // Distinguish the preview via an explicit flag, rather than a globally
    // shared low material that may be transparent for unrelated reasons.
    if(this.userData.stonePreviewV237)
     setStonePreviewV237(mesh,this.userData.previewColorV237,this.userData.previewOpacityV237);
    this.high.add(mesh);this.userData.nearReady=true;
   }).catch(error=>{this.userData.nearError=String(error);console.warn('Keeping distant Stone Age model',error);});
  }
  const show=near&&this.userData.nearReady;
  this.high.visible=show;this.low.visible=!show;this.userData.nearActive=show;
 }
}


const highGeometry=new Map(),farGeometry=new Map();
// Cluster nearby vertices and keep UV atlas seams, without creating holes by
// simply skipping triangles. Reuse this geometry for all instances of a type.
export function simplifyStoneFarGeometry(source,cells=24){
 const pos=source.getAttribute('position'),uv=source.getAttribute('uv');
 if(!pos||pos.count<128)return source;
 source.computeBoundingBox();
 const b=source.boundingBox,dim=b.getSize(new T.Vector3());
 const step=Math.max(dim.x,dim.y,dim.z,1e-6)/Math.max(8,cells);
 const clusters=new Map(),remap=new Int32Array(pos.count);
 const sum=[],tex=[],count=[];
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
  const u=uv?uv.getX(i):0,v=uv?uv.getY(i):0;
  const key=Math.floor((x-b.min.x)/step)+','+Math.floor((y-b.min.y)/step)+','+
   Math.floor((z-b.min.z)/step)+','+(uv?Math.round(u*12)+','+Math.round(v*12):'');
  let k=clusters.get(key);
  if(k==null){k=sum.length/3;clusters.set(key,k);sum.push(0,0,0);tex.push(0,0);count.push(0);}
  remap[i]=k;sum[k*3]+=x;sum[k*3+1]+=y;sum[k*3+2]+=z;
  tex[k*2]+=u;tex[k*2+1]+=v;count[k]++;
 }
 const xyz=new Float32Array(sum.length),uvs=new Float32Array(tex.length);
 for(let k=0;k<count.length;k++){
  xyz[k*3]=sum[k*3]/count[k];xyz[k*3+1]=sum[k*3+1]/count[k];xyz[k*3+2]=sum[k*3+2]/count[k];
  uvs[k*2]=tex[k*2]/count[k];uvs[k*2+1]=tex[k*2+1]/count[k];
 }
 const srcIndex=source.getIndex(),indices=[],triangles=srcIndex?srcIndex.count:pos.count;
 for(let i=0;i+2<triangles;i+=3){
  const a=remap[srcIndex?srcIndex.getX(i):i],c=remap[srcIndex?srcIndex.getX(i+1):i+1],d=remap[srcIndex?srcIndex.getX(i+2):i+2];
  if(a!==c&&c!==d&&a!==d)indices.push(a,c,d);
 }
 if(indices.length<12||indices.length>=triangles*.95)return source;
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.BufferAttribute(xyz,3));
 if(uv)g.setAttribute('uv',new T.BufferAttribute(uvs,2));
 g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 return g;
}
function normalizedStoneGeometry(name,asset,type){
 if(highGeometry.has(name))return highGeometry.get(name);
 const g=asset.geometry;g.computeBoundingBox();
 const box=g.boundingBox,c=box.getCenter(new T.Vector3());
 g.translate(-c.x,-box.min.y,-c.z);
 if(['lumber','house'].includes(type))g.rotateY(-Math.PI/2);
 else if(type==='farm')g.rotateY(Math.PI/2);
 g.computeBoundingBox();g.computeBoundingSphere();
 highGeometry.set(name,g);return g;
}
export function withStoneBuildingLOD(low,type,size,seed=0){
 const name=type==='hall'?'peamaja':type;
 async function makeMesh(far){
  const asset=await detailedAsset(name);
  const high=normalizedStoneGeometry(name,asset,type);
  if(far&&!farGeometry.has(name))farGeometry.set(name,simplifyStoneFarGeometry(high));
  const geo=far?farGeometry.get(name):high;
  const extent=high.boundingBox.getSize(new T.Vector3());
  const mesh=new T.Mesh(geo,asset.material);
  if(!applyStoneSize(mesh,type,extent,seed))
   mesh.scale.setScalar(size/Math.max(extent.x,extent.z)*(type==='house'?.94+((seed>>>3)%7)*.02:1));
  mesh.castShadow=!far;mesh.receiveShadow=true;
  mesh.userData.stoneDetailedAsset=name;
  if(far)mesh.userData.stoneFarDerivedFromDetail=true;
  return mesh;
 }
 const root=new LazyStoneLOD(low,()=>makeMesh(false),()=>makeMesh(true));
 Object.assign(root.userData,low.userData);root.userData.stoneNearLOD=true;
 return root;
}

export function withStoneHumanLOD(low){
 const lod=new LazyStoneLOD(low,async()=>{
  const asset=await detailedAsset('human_rigged');
  // Both meshes are already in the same unit-height bind pose.
  const mesh=new T.SkinnedMesh(asset.geometry,asset.material);
  // Share the animated skeleton, including its original inverse bind pose.
  // This keeps phase, bone names, direct village poses and hand-held tools.
  mesh.bind(low.skeleton,low.bindMatrix);mesh.castShadow=true;mesh.receiveShadow=false;
  mesh.userData.stoneDetailedAsset='human_rigged';return mesh;
 });
 lod.userData.stoneHumanV226=true;return lod;
}
