// V274: the Stone Age scout travels with a dog and carries a spear (worker model + dog + spear).
// Small procedural models in the unit's local frame (a person is ~1.66 units tall).
import * as T from './vendor/three.module.js';
const fur=new T.MeshStandardMaterial({color:'#7a5a3a',roughness:1}),furDark=new T.MeshStandardMaterial({color:'#4a3626',roughness:1});
const wood=new T.MeshStandardMaterial({color:'#6b4f33',roughness:1}),flint=new T.MeshStandardMaterial({color:'#8d8a80',roughness:.8,flatShading:true});
const G={body:new T.CapsuleGeometry(.12,.38,3,8),head:new T.SphereGeometry(.1,8,6),snout:new T.ConeGeometry(.055,.14,6),ear:new T.ConeGeometry(.035,.08,4),
 leg:new T.CylinderGeometry(.028,.022,.24,5),tail:new T.CylinderGeometry(.02,.008,.24,5),shaft:new T.CylinderGeometry(.018,.022,1.9,6),tip:new T.ConeGeometry(.045,.2,5)};
for(const g of Object.values(G))g.userData.shared=true;
export function createDogV274(){
 const dog=new T.Group();dog.name='V274 scout dog';
 const m=(geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=true;dog.add(o);return o;};
 m(G.body,fur,0,.34,0,Math.PI/2);
 const head=new T.Group();head.position.set(0,.47,.3);dog.add(head);
 const hm=(geo,mat,x,y,z,rx=0,rz=0)=>{const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.rotation.set(rx,0,rz);head.add(o);return o;};
 hm(G.head,fur,0,0,0);hm(G.snout,furDark,0,-.02,.12,Math.PI/2);hm(G.ear,furDark,-.06,.09,-.02,0,-.2);hm(G.ear,furDark,.06,.09,-.02,0,.2);
 const legs=[[-.08,.2],[.08,.2],[-.08,-.2],[.08,-.2]].map(([x,z])=>m(G.leg,furDark,x,.12,z));
 const tail=m(G.tail,fur,0,.42,-.3,-.8);
 dog.userData={legs,tail,head};
 return dog;
}
export function poseDogV274(dog,time,moving){
 const u=dog.userData;if(!u?.legs)return;
 u.legs.forEach((l,i)=>{l.rotation.x=moving?Math.sin(time*11+(i%2?Math.PI:0)+(i>1?Math.PI:0))*.55:0;});
 u.tail.rotation.z=Math.sin(time*(moving?9:4))*.35;u.head.rotation.y=moving?0:.35*Math.sin(time*.7);
}
export function createSpearV274(){
 const g=new T.Group();g.name='V274 scout spear';
 const shaft=new T.Mesh(G.shaft,wood);shaft.position.y=.95;g.add(shaft);
 const tip=new T.Mesh(G.tip,flint);tip.position.y=1.98;g.add(tip);return g;
}
// dog trots at the scout's left heel, the spear is held upright at the right side
export function addScoutCompanionsV274(root,{spear=true}={}){
 if(!root||root.userData.scoutDogV274)return root;
 const dog=createDogV274();dog.position.set(.55,0,-.15);root.add(dog);
 let held=null;if(spear){held=createSpearV274();held.position.set(-.32,.02,.1);held.rotation.z=.06;root.add(held);}
 root.userData.scoutDogV274=dog;root.userData.scoutSpearV274=held;return root;
}
