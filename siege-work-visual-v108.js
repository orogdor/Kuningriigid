// Lightweight siege carpentry meshes. Each work is a single saved battle object.
import {createSiegeCamp} from './siege-support-visual-v115.js?v=115a';
import * as T from './vendor/three.module.js';
const WOOD=new T.MeshStandardMaterial({color:'#866139',roughness:.95,metalness:0});
const EDGE=new T.MeshStandardMaterial({color:'#493822',roughness:1});
const REED=new T.MeshStandardMaterial({color:'#9d8954',roughness:.98});
function beam(parent,x,y,z,w,h,d,material=WOOD){
 const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
export function createSiegeWorkModel(kind,height=3.8,team=0){
 if(kind==='camp')return createSiegeCamp(team);
 const root=new T.Group();root.name='Siege work '+kind;root.userData.siegeWork=kind;
 if(kind==='ladder'){
  for(const x of [-.65,.65])beam(root,x,3.14,0,.22,6.28,.22);
  for(let i=0;i<15;i++)beam(root,0,.3+i*.4,0,1.45,.13,.28,REED);
  root.rotation.x=Math.atan2(5,3.8);
 }else if(kind==='ram'||kind==='sap'){
  for(const x of [-1.4,1.4])for(const z of [-1.5,1.5])beam(root,x,1.3,z,.2,2.6,.2);
  beam(root,0,2.7,0,3.2,.3,4,REED);
  for(const x of [-1.55,1.55])beam(root,x,1.8,0,.18,1.7,4);
  if(kind==='ram'){beam(root,0,1.25,.6,.55,.55,4.8,EDGE);for(const x of [-1.6,1.6])for(const z of [-1.3,1.3])beam(root,x,.4,z,.3,.8,.8,EDGE);}
  else {beam(root,0,.15,2.1,2.7,.3,2,'#635442');beam(root,0,.6,1.8,1.6,1.2,.1,EDGE);}
 }else{
  // Complete four-sided timber frame; upper walkway matches the 3.8m parapet.
  for(const x of [-1.6,1.6])for(const z of [-1.6,1.6])beam(root,x,2.5,z,.35,4.6,.35);
  for(const y of [1.1,2.4,3.7])beam(root,0,y,0,3.55,.19,3.55);
  for(const side of [-1.64,1.64]){
   beam(root,side,2.25,0,.18,2.3,3.4);beam(root,side,4.3,0,.18,1,3.4);
   beam(root,0,2.25,side,3.4,2.3,.18);
   for(const x of [-1.2,1.2])beam(root,x,4.3,side,.8,1,.18);
   const brace=beam(root,side,2.3,0,.2,4.1,.2,EDGE);brace.rotation.x=.62;
  }
  for(let i=0;i<11;i++)beam(root,0,1.1+i*.24,1.3-i*.24,1.6,.14,.32,REED);
  for(const x of [-1.85,1.85])for(const z of [-1.28,1.28]){
   const wheel=new T.Mesh(new T.CylinderGeometry(.61,.61,.26,12),EDGE);
   wheel.rotation.z=Math.PI/2;wheel.position.set(x,.65,z);wheel.castShadow=true;root.add(wheel);
  }
  beam(root,0,3.8,2.45,1.6,.2,2.5,REED);
  for(const x of [-.82,.82])beam(root,x,4.15,2.45,.1,.6,2.5,WOOD);

 }
 if(kind==='ladder'){const length=Math.hypot(5,height);for(const child of root.children){child.position.y*=length/6.28;child.scale.y*=length/6.28;}root.rotation.x=Math.atan2(5,height);}
 if(kind==='tower')root.scale.y=height/3.8;
 return root;
}
