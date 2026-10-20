import {spatialInstances} from './spatial-batches-v86.js?v=86a';
// V48 geometry loader: renderer uses exactly the quad-authored geometry in models-v48/*.glb.
// This direct Three.js BufferGeometry representation avoids a network decoder and can be instanced.
import * as T from './vendor/three.module.js';
import {MODEL_MESHES} from './models-v48/mesh-data.js';
const CACHE=new Map(),MATERIAL=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.95,metalness:0});
export function getV48Geometry(name,lod='high'){
 const key=name+':'+lod; if(CACHE.has(key))return CACHE.get(key);
 const parts=MODEL_MESHES[name];if(!parts)throw Error('Unknown V48 model '+name);
 const vertices=[],indices=[],colors=[];let count=0;
 for(const [pi,part] of parts.entries()){
  if(lod!=='high'&&name.startsWith('oak')&&part.label==='structural branch')continue;
  if(lod==='low'&&name.startsWith('oak')&&part.label==='canopy'&&pi%2===0)continue;
  if(lod!=='high'&&name.startsWith('palm')&&part.label==='palm leaf'&&pi%2===0)continue;
  if(lod==='low'&&name.startsWith('pine')&&part.label==='branch whorls'&&pi%2===0)continue;
  const {v,q,c}=part,col=new T.Color(c);
  v.forEach(p=>{vertices.push(...p);colors.push(col.r,col.g,col.b)});
  for(const [a,b,d,e] of q){
   if(a!==b&&b!==d&&a!==d)indices.push(count+a,count+b,count+d);
   if(a!==d&&d!==e&&e!==a)indices.push(count+a,count+d,count+e);
  }
  count+=v.length;
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();g.userData.shared=true;g.userData.modelName=name;CACHE.set(key,g);return g;
}
export function createV48Mesh(name,scale=1){const mesh=new T.Mesh(getV48Geometry(name),MATERIAL);mesh.scale.setScalar(scale);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.modelName=name;return mesh}
export function addV48Instances(group,name,placements,opts={}){
 if(!placements.length)return null;
 const mesh=new T.InstancedMesh(getV48Geometry(name,opts.lod||'high'),MATERIAL,placements.length),dummy=new T.Object3D();
 placements.forEach((p,i)=>{const s=p.scale||1;dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.rot||0,0);dummy.scale.set(p.sx??s,p.sy??s,p.sz??s);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);if(p.tint)mesh.setColorAt(i,new T.Color(p.tint))});
 mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.castShadow=!!opts.castShadow;mesh.receiveShadow=false;mesh.userData.v48Model=name;const result=opts.spatialChunks?spatialInstances(mesh):mesh;group.add(result);return result;
}
