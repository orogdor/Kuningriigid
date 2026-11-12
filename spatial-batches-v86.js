import * as T from './vendor/three.module.js';
const batches=new Set();
// Preserve the existing cache semantics without allocating a string key every frame.
function refreshGeneratedBoundsV327(mesh){
 const geometry=mesh.geometry,trellis=!!geometry.userData.trellisV327;
 if(mesh.userData.boundsGeometryV347===geometry&&mesh.userData.boundsTrellisV347===trellis)return;
 mesh.userData.boundsGeometryV347=geometry;mesh.userData.boundsTrellisV347=trellis;
 mesh.boundingSphere=null;mesh.computeBoundingSphere?.();
}
// Copy contiguous runs with TypedArray.set; isolated instances use direct scalar copies
// so no short-lived subarray is allocated for every shuffled instance.
function copyInstancesV347(ids,source,dest,stride){
 let i=0;
 while(i<ids.length){
  const first=ids[i],start=i;
  while(i+1<ids.length&&ids[i+1]===ids[i]+1)i++;
  const count=i-start+1,offset=first*stride,to=start*stride;
  if(count>1)dest.set(source.subarray(offset,offset+count*stride),to);
  else for(let j=0;j<stride;j++)dest[to+j]=source[offset+j];
  i++;
 }
}
// Keep authored meshes, transforms and colors; only the draw groups change.
export function spatialInstances(source,size=600){
 if(!source.isInstancedMesh||source.count<32)return source;
 const group=new T.Group(),near=new T.Group(),bins=[],byX=new Map(),color=new T.Color();
 group.name='spatial '+source.name;group.userData.spatialBatch=true;
 group.position.copy(source.position);group.quaternion.copy(source.quaternion);group.scale.copy(source.scale);
 source.position.set(0,0,0);source.quaternion.identity();source.scale.set(1,1,1);
 const sourceMatrices=source.instanceMatrix.array;
 for(let i=0;i<source.count;i++){
  const cx=Math.floor(sourceMatrices[i*16+12]/size),cz=Math.floor(sourceMatrices[i*16+14]/size);
  let byZ=byX.get(cx);if(!byZ){byZ=new Map();byX.set(cx,byZ);}
  let bin=byZ.get(cz);if(!bin){bin={cx,cz,ids:[]};byZ.set(cz,bin);bins.push(bin);}
  bin.ids.push(i);
 }
 for(const {cx,cz,ids}of bins){
  const key=cx+':'+cz;
  const mesh=new T.InstancedMesh(source.geometry,source.material,ids.length);
  mesh.name=source.name+' '+key;
  mesh.userData={...source.userData,spatialCell:key,spatialCenterX:(cx+.5)*size,spatialCenterZ:(cz+.5)*size};
  mesh.castShadow=source.castShadow;mesh.receiveShadow=source.receiveShadow;mesh.renderOrder=source.renderOrder;
  copyInstancesV347(ids,sourceMatrices,mesh.instanceMatrix.array,16);
  if(source.instanceColor){
   // setColorAt creates the same InstancedBufferAttribute type as the original.
   mesh.setColorAt(0,color);
   copyInstancesV347(ids,source.instanceColor.array,mesh.instanceColor.array,3);
  }
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  // Older Three versions lack instance bounds; retain correctness there.
  mesh.frustumCulled=typeof mesh.computeBoundingSphere==='function';mesh.computeBoundingSphere?.();near.add(mesh);
 }
 // V244: the whole-source mesh is only shown far out (zoom > 3000), where a tree is a few pixels;
 // it no longer renders a full shadow pass of every tree on the map.
 source.visible=false;source.castShadow=false;group.add(source,near);group.userData.instanceCount=source.count;
 group.userData.chunkCount=near.children.length;batches.add({source,near,size,lod:source.userData.lodGeometries||null});return group;
}
// V152: optional level of detail. Chunks near the camera focus use the detailed model, the rest
// (and everything when zoomed out) the light one. Only a geometry reference changes per chunk.
export function updateSpatialBatches(zoom,focus=null){
 const far=zoom>3000;
 for(const {source,near,size,lod}of batches){
  source.visible=far;near.visible=!far;refreshGeneratedBoundsV327(source);
  if(!lod||far)continue;
  const radius=Math.max(420,zoom*1.1)+size*.7,limitSq=radius*radius;
  const high=zoom<640&&focus!=null;
  for(const mesh of near.children){
   const dx=high?mesh.userData.spatialCenterX-focus.x:0;
   const dz=high?mesh.userData.spatialCenterZ-focus.z:0;
   const distanceSq=dx*dx+dz*dz;
   // For boundary cases, keep Math.hypot's exact legacy LOD decision.
   const near=high&&(Math.abs(distanceSq-limitSq)<=limitSq*1e-12
    ?Math.hypot(dx,dz)<radius:distanceSq<limitSq);
   const geo=near?lod.high:lod.low;
   if(mesh.geometry!==geo)mesh.geometry=geo;
   refreshGeneratedBoundsV327(mesh);
  }
 }
}
