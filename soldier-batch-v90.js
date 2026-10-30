import * as T from './vendor/three.module.js';
// Share draw calls, while preserving every man's animated limb matrices.
export class SoldierBatch{
 constructor(parent){this.parent=parent;this.root=new T.Group();this.root.name='Instanced squad soldiers';parent.add(this.root);this.models=[];this.batches=[];this.matrix=new T.Matrix4();}
 update(models){
  // Single scouts render directly; instancing hides their source meshes.
  const included=models.filter(m=>!m.userData.noBatchV239);
  if(included.length!==this.models.length||included.some((m,i)=>m!==this.models[i])){
   for(const old of this.models)old.traverse(o=>{
    if(o.userData.batchWasVisible===undefined)return;
    o.visible=o.userData.batchWasVisible;
    delete o.userData.batchWasVisible;
   });
   for(const b of this.batches)b.mesh.dispose();this.root.clear();this.models=[...included];const groups=new Map();
   for(const model of included)model.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;if(o.userData.batchWasVisible==null)o.userData.batchWasVisible=o.visible;o.visible=false;const key=o.geometry.uuid+':'+o.material.uuid,list=groups.get(key)||[];list.push(o);groups.set(key,list);});
   this.batches=[...groups.values()].map(parts=>{const p=parts[0],mesh=new T.InstancedMesh(p.geometry,p.material,parts.length);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=p.castShadow;mesh.receiveShadow=p.receiveShadow;this.root.add(mesh);return {mesh,parts};});
  }
  for(const m of included)m.updateMatrixWorld(true);this.parent.updateWorldMatrix(true,false);const inverse=this.parent.matrixWorld.clone().invert();
  for(const {mesh,parts}of this.batches){let n=0;for(const p of parts){let visible=p.userData.batchWasVisible;for(let a=p.parent;a&&a!==this.parent;a=a.parent)if(!a.visible){visible=false;break;}if(!visible)continue;this.matrix.multiplyMatrices(inverse,p.matrixWorld);mesh.setMatrixAt(n++,this.matrix);}mesh.count=n;mesh.instanceMatrix.needsUpdate=true;}
 }
}
