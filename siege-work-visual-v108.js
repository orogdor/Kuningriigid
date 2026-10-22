// Lightweight siege carpentry meshes. Each work is a single saved battle object.
import * as T from './vendor/three.module.js';
const WOOD=new T.MeshStandardMaterial({color:'#866139',roughness:.95,metalness:0});
const EDGE=new T.MeshStandardMaterial({color:'#493822',roughness:1});
const REED=new T.MeshStandardMaterial({color:'#9d8954',roughness:.98});
function beam(parent,x,y,z,w,h,d,material=WOOD){
 const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
export function createSiegeWorkModel(kind){
 const root=new T.Group();
 if(kind==='ladder'){
  for(const x of [-.65,.65])beam(root,x,2.05,0,.22,4.2,.22);
  for(let i=0;i<11;i++)beam(root,0,.36+i*.36,0,1.45,.13,.28,REED);
  root.rotation.x=-.17;
 }else{
  for(const x of [-1.6,1.6])for(const z of [-1.6,1.6])beam(root,x,2.6,z,.35,5.2,.35);
  for(const y of [1.1,3,5.3])beam(root,0,y,0,3.55,.19,3.55);
  for(const y of [2.1,3.8])for(const z of [-1.64,1.64])beam(root,0,y,z,3.4,1.5,.17,WOOD);
  beam(root,0,4,-1.64,3.4,.16,.16,EDGE);
  for(const x of [-1.85,1.85])for(const z of [-1.28,1.28]){
   const wheel=new T.Mesh(new T.CylinderGeometry(.61,.61,.26,12),EDGE);
   wheel.rotation.z=Math.PI/2;wheel.position.set(x,.65,z);wheel.castShadow=true;root.add(wheel);
  }
  beam(root,0,5.8,.25,3.6,.23,3.8,REED);
  beam(root,0,5.62,-2.1,2.9,.2,1.9);
 }
 return root;
}
