import * as T from './vendor/three.module.js';
const batches=new Set();
// Keep authored meshes, transforms and colors; only the draw groups change.
export function spatialInstances(source,size=600){
 if(!source.isInstancedMesh||source.count<32)return source;
 const group=new T.Group(),near=new T.Group(),matrix=new T.Matrix4(),color=new T.Color(),bins=new Map();
 group.name='spatial '+source.name;group.userData.spatialBatch=true;
 group.position.copy(source.position);group.quaternion.copy(source.quaternion);group.scale.copy(source.scale);
 source.position.set(0,0,0);source.quaternion.identity();source.scale.set(1,1,1);
 for(let i=0;i<source.count;i++){source.getMatrixAt(i,matrix);const key=Math.floor(matrix.elements[12]/size)+':'+Math.floor(matrix.elements[14]/size);const list=bins.get(key)||[];list.push(i);bins.set(key,list)}
 for(const [key,ids]of bins){
  const mesh=new T.InstancedMesh(source.geometry,source.material,ids.length);mesh.name=source.name+' '+key;mesh.userData={...source.userData,spatialCell:key};
  mesh.castShadow=source.castShadow;mesh.receiveShadow=source.receiveShadow;mesh.renderOrder=source.renderOrder;
  ids.forEach((id,i)=>{source.getMatrixAt(id,matrix);mesh.setMatrixAt(i,matrix);if(source.instanceColor){source.getColorAt(id,color);mesh.setColorAt(i,color)}});
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  // Older Three versions lack instance bounds; retain correctness there.
  mesh.frustumCulled=typeof mesh.computeBoundingSphere==='function';mesh.computeBoundingSphere?.();near.add(mesh);
 }
 source.visible=false;group.add(source,near);group.userData.instanceCount=source.count;
 group.userData.chunkCount=near.children.length;batches.add({source,near,size,lod:source.userData.lodGeometries||null});return group;
}
// V152: optional level of detail. Chunks near the camera focus use the detailed model, the rest
// (and everything when zoomed out) the light one. Only a geometry reference changes per chunk.
export function updateSpatialBatches(zoom,focus=null){
 const far=zoom>3000;
 for(const {source,near,size,lod} of batches){source.visible=far;near.visible=!far;
  if(!lod||far)continue;
  const radius=Math.max(420,zoom*1.1);
  for(const mesh of near.children){const [cx,cz]=mesh.userData.spatialCell.split(':').map(Number);
   const x=(cx+.5)*size,z=(cz+.5)*size,d=focus?Math.hypot(x-focus.x,z-focus.z):Infinity;
   const geo=zoom<640&&d<radius+size*.7?lod.high:lod.low;if(mesh.geometry!==geo)mesh.geometry=geo;}
 }
}
