import * as T from './vendor/three.module.js';
import {farmhouseGeometry,fieldGeometry,meshV158} from './town-models-v154.js?v=158a';
const mats=new Map();
const mat=color=>{if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.92}));return mats.get(color)};
function box(g,x,y,z,w,h,d,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=h>.4;m.receiveShadow=true;g.add(m);return m;}
function roof(g,y,color){const m=new T.Mesh(new T.ConeGeometry(4.6,2,4),mat(color));m.rotation.y=Math.PI/4;m.position.set(0,y,0);m.scale.z=.8;g.add(m);}
export function createFieldModel(){
 const g=new T.Group();g.userData.buildingType='field';
 g.add(meshV158(fieldGeometry()));return g;
 box(g,0,.06,0,16,.12,16,'#6b4e30');
 for(let z=-7;z<=7;z+=2){box(g,0,.16,z,15,.13,.7,'#927341');for(let x=-7;x<=7;x+=2)box(g,x,.5,z,.22,.65,.18,'#bba957');}
 for(const x of [-8,8])for(const z of [-8,8])box(g,x,.5,z,.12,1,.12,'#8e7955');
 return g;
}
export function createFarmhouseModel(age=0){
 const g=new T.Group();g.add(meshV158(farmhouseGeometry(age)));return g;box(g,0,1.6,0,5,3.2,4,age>=2?'#c4b48d':'#9c8055');roof(g,4,age>=3?'#7c6552':'#a28b55');
 box(g,0,.9,2.03,1.1,1.8,.12,'#4f4030');box(g,1.5,1.9,2.07,.8,.8,.08,'#749195');
 for(let i=0;i<3;i++)box(g,-3,.4+i*.18,1+i*.35,1,.7,.6,'#b39a67');
 return g;
}
export function createLivestockModel(age=0){
 const g=createFarmhouseModel(age);g.scale.set(.75,.75,.75);
 for(const z of [-5,5]){box(g,0,.8,z,12,.12,.12,'#93724b');for(const x of [-6,-3,0,3,6])box(g,x,.6,z,.15,1.2,.15,'#79613e');}
 for(const x of [-6,6])box(g,x,.8,0,.12,.12,10,'#93724b');
 for(const x of [-3,3]){box(g,x,.8,3,1.9,1.1,.8,'#967451');box(g,x+.9,1,3,.6,.7,.6,'#c1a57a');for(const dx of [-.6,.6])for(const dz of [-.25,.25])box(g,x+dx,.25,3+dz,.16,.6,.16,'#72533a');}
 return g;
}
export function updateFarmEquipment(model,kind){
 if(model.userData.farmEquipmentKind===kind)return;
 const old=model.userData.farmEquipment;if(old){model.remove(old);old.traverse(o=>o.geometry?.dispose());}
 const g=new T.Group();
 if(kind==='hand'){box(g,.65,.65,-.6,.08,1.4,.08,'#97734c');box(g,.65,.12,-.6,.5,.12,.25,'#8d8b79');}
 else if(kind==='tractor'){
  box(g,0,.7,2,1.7,1.1,2.6,'#6d8456');box(g,0,1.8,1.9,1.5,1.6,1.5,'#a0b7b4');
  for(const x of [-1,1])for(const z of [.9,3]){const m=new T.Mesh(new T.CylinderGeometry(z<2?.65:.45,z<2?.65:.45,.35,10),mat('#393c38'));m.rotation.z=Math.PI/2;m.position.set(x,.55,z);g.add(m);}
  box(g,0,.2,-1.5,3,.2,1,'#858a82');
 }else{
  // Traction animals and a trailing implement, kept outside the human mesh.
  for(const x of [-.75,.75]){box(g,x,.9,2, .65,.9,1.7,kind==='heavy_plough'||kind==='reaper'?'#79604b':'#a48a65');box(g,x,1.2,3,.5,.6,.6,'#947653');for(const dx of [-.2,.2])for(const dz of [-.5,.5])box(g,x+dx,.35,2+dz,.12,.7,.12,'#66503c');}
  box(g,0,.8,1.5,2.3,.12,.16,'#9c7b4e');box(g,0,.3,-.7,kind==='reaper'?3:1,.18,1.7,kind==='ox_plough'?'#8e704a':'#898a7c');
 }
 model.add(g);model.userData.farmEquipment=g;model.userData.farmEquipmentKind=kind;
}
