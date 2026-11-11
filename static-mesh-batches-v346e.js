import * as T from './vendor/three.module.js';

// Only opaque, rigid parts sharing the exact geometry and material are combined.
export function batchStaticMeshParts(parent,models,{directOnly=false,name='Static parts'}={}){
 const groups=new Map(),relative=new T.Matrix4(),inverse=new T.Matrix4();
 parent.updateWorldMatrix(true,false);
 inverse.copy(parent.matrixWorld).invert();
 function add(mesh){
  const material=mesh.material;
  if(!mesh.visible||!mesh.isMesh||mesh.isSkinnedMesh||mesh.isInstancedMesh||mesh.isBatchedMesh
   ||mesh.morphTargetInfluences||(!material?.isMeshStandardMaterial&&!material?.isMeshBasicMaterial)
   ||material.transparent||mesh.customDepthMaterial||mesh.customDistanceMaterial
   ||mesh.onBeforeRender!==T.Object3D.prototype.onBeforeRender||mesh.onAfterRender!==T.Object3D.prototype.onAfterRender
   ||material.onBeforeCompile!==T.Material.prototype.onBeforeCompile)return;
  relative.multiplyMatrices(inverse,mesh.matrixWorld);
  const m=relative.elements;
  // Instance normals assume orthogonal axes. Keep reflected or sheared parts as ordinary meshes.
  if(relative.determinant()<=0||Math.max(Math.abs(m[0]*m[4]+m[1]*m[5]+m[2]*m[6]),
   Math.abs(m[0]*m[8]+m[1]*m[9]+m[2]*m[10]),Math.abs(m[4]*m[8]+m[5]*m[9]+m[6]*m[10]))>1e-5)return;
  const key=[mesh.geometry.id,material.id,mesh.castShadow,mesh.receiveShadow,mesh.renderOrder,mesh.layers.mask].join(':');
  const entries=groups.get(key)??[];
  entries.push({mesh,matrix:relative.clone()});groups.set(key,entries);
 }
 for(const model of models){
  if(!model.visible)continue;
  model.updateWorldMatrix(true,true);
  if(directOnly)for(const child of model.children)add(child);
  else model.traverseVisible(add);
 }
 const batches=[];
 for(const entries of groups.values()){
  if(entries.length<2)continue;
  const first=entries[0].mesh,batch=new T.InstancedMesh(first.geometry,first.material,entries.length);
  batch.name=name;
  batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;
  batch.renderOrder=first.renderOrder;batch.layers.mask=first.layers.mask;
  // Original meshes remain in the object tree for picking.
  batch.raycast=()=>{};
  entries.forEach(({mesh,matrix},i)=>{batch.setMatrixAt(i,matrix);mesh.visible=false;});
  batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();
  parent.add(batch);batches.push({batch,entries});
 }
 return {
  count:batches.length,
  dispose(){
   for(const {batch,entries} of batches){
    batch.removeFromParent();batch.dispose();
    for(const {mesh} of entries)mesh.visible=true;
   }
   batches.length=0;
  }
 };
}
