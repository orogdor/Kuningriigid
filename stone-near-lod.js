// V233: build simplified far meshes from the very same textured Stone Age GLBs.
// Old distant shapes are temporary placeholders while the GLB is loading.
import * as T from './vendor/three.module.js';
import {applyStoneSize} from './stone-sizes-v224.js';
import {loadGLB} from './glb-lite-v221.js';
import {requestAssetV241} from './asset-queue-v241.js';

export const STONE_NEAR_DISTANCE=100;
// V244: buildings have three levels. The full ~100k-triangle model only within this share of the
// near distance (40 m by default), a baked ~6k-triangle model from there to the near distance,
// and a baked ~1.5k-triangle model beyond it. Both baked files are made offline from the same GLB
// (tools/stone-models-v221/build_static.py) and placed with the original model's bounding box.
export const STONE_DETAIL_SHARE=.4;
const LOD_DIR='./models-stone-lod-v244/';
let lodManifest=null;
function stoneLodManifest(){return lodManifest??=fetch(LOD_DIR+'manifest.json').then(r=>r.ok?r.json():null).catch(()=>null);}
export function stoneLodAsset(name,level){
 return requestAssetV241('stone-lod:'+name+':'+level,async()=>{
  const manifest=await stoneLodManifest(),box=manifest?.boxes?.[name];
  if(!box)throw new Error('No V244 '+level+' model for '+name);
  const data=await loadGLB(LOD_DIR+name+'_'+level+'.glb'),p=data.primitives[0],mr=texture(p.roughnessImage);
  const material=new T.MeshStandardMaterial({map:texture(p.image,true),roughnessMap:mr,metalnessMap:mr,
   roughness:Math.min(1,p.roughness??1),metalness:Math.min(0,p.metalness??0),side:T.DoubleSide,color:new T.Color().fromArray(p.color)});
  return {data,geometry:p.geometry,material,box:new T.Box3(new T.Vector3().fromArray(box.min),new T.Vector3().fromArray(box.max))};
 });
}
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
 constructor(low,build,buildFar=null,buildMid=null){
  super();this.low=low;this.high=new T.Group();this.mid=new T.Group();this.build=build;this.buildMid=buildMid;
  this.add(this.mid);this.mid.visible=false;this.userData.midReady=false;
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
  // V244: between the detail distance and the near distance use the baked middle model
  if(this.buildMid&&!this.midFailed){
   const detailLimit=limit*STONE_DETAIL_SHARE,detail=d<(this.userData.detailActive?detailLimit*1.08:detailLimit);
   if(near&&!this.midPending){this.midPending=true;this.buildMid().then(mesh=>{
     if(this.userData.stonePreviewV237)setStonePreviewV237(mesh,this.userData.previewColorV237,this.userData.previewOpacityV237);
     this.mid.add(mesh);this.userData.midReady=true;}).catch(error=>{this.midFailed=true;this.userData.midError=String(error);});}
   if(detail&&!this.pending){this.pending=true;this.build().then(mesh=>{
     if(this.userData.stonePreviewV237)setStonePreviewV237(mesh,this.userData.previewColorV237,this.userData.previewOpacityV237);
     this.high.add(mesh);this.userData.nearReady=true;}).catch(error=>{this.userData.nearError=String(error);});}
   const showHigh=detail&&this.userData.nearReady,showMid=near&&!showHigh&&this.userData.midReady;
   this.high.visible=showHigh;this.mid.visible=showMid;this.low.visible=!showHigh&&!showMid;
   this.userData.detailActive=showHigh;this.userData.nearActive=showHigh||showMid;this.userData.stoneLevelV244=showHigh?'detail':showMid?'mid':'far';
   return;
  }
  this.mid.visible=false;
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
 // V244: baked middle/far files; if a file is missing, fall back to the earlier path
 async function makeBaked(level){
  const asset=await stoneLodAsset(name,level),g=asset.geometry;
  if(!g.userData.normalizedV244){
   const c=asset.box.getCenter(new T.Vector3());g.translate(-c.x,-asset.box.min.y,-c.z);
   if(['lumber','house'].includes(type))g.rotateY(-Math.PI/2);else if(type==='farm')g.rotateY(Math.PI/2);
   g.computeBoundingBox();g.computeBoundingSphere();g.userData.normalizedV244=true;g.userData.shared=true;
  }
  const box=asset.box.getSize(new T.Vector3()),extent=['lumber','house','farm'].includes(type)?new T.Vector3(box.z,box.y,box.x):box;
  // V244: the middle level keeps the ORIGINAL uv atlas, so it uses the detailed model's own PBR material
  // (texture + roughness/metalness maps) and looks the same; the far level uses its own small texture.
  const material=level==='mid'?(await detailedAsset(name)).material:asset.material;
  const mesh=new T.Mesh(g,material);
  if(!applyStoneSize(mesh,type,extent,seed))mesh.scale.setScalar(size/Math.max(extent.x,extent.z)*(type==='house'?.94+((seed>>>3)%7)*.02:1));
  mesh.castShadow=level==='mid';mesh.receiveShadow=true;mesh.userData.stoneDetailedAsset=name;mesh.userData.stoneBakedLevelV244=level;
  if(level==='far')mesh.userData.stoneFarDerivedFromDetail=true;
  return mesh;
 }
 async function makeMesh(far){
  if(far){try{return await makeBaked('far');}catch(e){}}
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
 const root=new LazyStoneLOD(low,()=>makeMesh(false),()=>makeMesh(true),()=>makeBaked('mid'));
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
