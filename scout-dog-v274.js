// V274: the Stone Age scout travels with a dog and carries a spear (worker model + dog + spear).
// Small procedural models in the unit's local frame (a person is ~1.66 units tall).
import * as T from './vendor/three.module.js';
import {markRigidPartsV349} from './rigid-part-batches-v349.js';
const fur=new T.MeshStandardMaterial({color:'#7a5a3a',roughness:1}),furDark=new T.MeshStandardMaterial({color:'#4a3626',roughness:1});
const wood=new T.MeshStandardMaterial({color:'#6b4f33',roughness:1}),flint=new T.MeshStandardMaterial({color:'#8d8a80',roughness:.8,flatShading:true});
// V283: a nicer dog: smooth body with chest and haunch, neck, long muzzle, upright ears, legs that swing from the
// hip/shoulder (two segments), a trotting body bob, head nods and a wagging tail.
const furLight=new T.MeshStandardMaterial({color:'#9b7a54',roughness:1}),nose=new T.MeshStandardMaterial({color:'#1d1712',roughness:.6});
const G={body:new T.CapsuleGeometry(.11,.34,6,12),chest:new T.SphereGeometry(.13,14,10),haunch:new T.SphereGeometry(.115,14,10),neck:new T.CapsuleGeometry(.055,.12,4,8),
 head:new T.SphereGeometry(.085,14,10),muzzle:new T.CapsuleGeometry(.04,.09,4,8),nose:new T.SphereGeometry(.022,8,6),ear:new T.ConeGeometry(.032,.085,6),
 upper:new T.CapsuleGeometry(.03,.1,3,6),lower:new T.CapsuleGeometry(.022,.1,3,6),paw:new T.SphereGeometry(.028,8,6),tail:new T.CapsuleGeometry(.02,.2,3,6),
 shaft:new T.CylinderGeometry(.018,.022,1.9,6),tip:new T.ConeGeometry(.045,.2,5)};
for(const g of Object.values(G))g.userData.shared=true;
export function createDogV274(){
 const dog=new T.Group();dog.name='V274 scout dog';
 const body=new T.Group();body.position.y=.36;dog.add(body);
 const m=(parent,geo,mat,x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>{const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.scale.set(sx,sy,sz);o.castShadow=true;parent.add(o);return o;};
 m(body,G.body,fur,0,0,0,Math.PI/2);m(body,G.chest,fur,0,.01,.17,0,0,0,1,1.05,1);m(body,G.haunch,fur,0,.0,-.17);
 m(body,G.chest,furLight,0,-.05,.2,0,0,0,.7,.6,.6);
 const neck=new T.Group();neck.position.set(0,.06,.24);neck.rotation.x=-.75;body.add(neck);m(neck,G.neck,fur,0,.07,0);
 const head=new T.Group();head.position.set(0,.17,.02);head.rotation.x=.75;neck.add(head);
 m(head,G.head,fur,0,0,0);m(head,G.muzzle,furDark,0,-.025,.1,Math.PI/2);m(head,G.nose,nose,0,-.02,.17);
 m(head,G.ear,furDark,-.045,.085,-.01,0,0,.25);m(head,G.ear,furDark,.045,.085,-.01,0,0,-.25);
 const legs=[[-.07,.17],[.07,.17],[-.07,-.17],[.07,-.17]].map(([x,z])=>{const hip=new T.Group();hip.position.set(x,-.04,z);body.add(hip);
  m(hip,G.upper,fur,0,-.08,0);const knee=new T.Group();knee.position.y=-.16;hip.add(knee);m(knee,G.lower,furDark,0,-.07,0);m(knee,G.paw,furDark,0,-.15,.015);
  hip.userData.knee=knee;return hip;});
 const tail=new T.Group();tail.position.set(0,.05,-.27);body.add(tail);m(tail,G.tail,fur,0,.1,0);tail.rotation.x=-.7;
 dog.userData={legs,tail,head,body,neck};
 return markRigidPartsV349(dog); // V349
}
export function poseDogV274(dog,time,moving){
 const u=dog.userData;if(!u?.legs)return;
 const t=time*(moving?10:1);
 u.legs.forEach((hip,i)=>{const ph=(i===0||i===3)?0:Math.PI,s=moving?Math.sin(t+ph):0; // trot: diagonal pairs together
  hip.rotation.x=s*.55;hip.userData.knee.rotation.x=moving?Math.max(0,-Math.sin(t+ph+.6))*.8*(i<2?-1:1):0;});
 if(u.body){u.body.position.y=.36+(moving?Math.abs(Math.sin(t))*.025:.004*Math.sin(time*2.2));u.body.rotation.x=moving?.03*Math.sin(t*2):0;}
 u.tail.rotation.z=Math.sin(time*(moving?9:5))*.45;u.tail.rotation.x=moving?-.5:-.8;
 u.head.rotation.y=moving?.08*Math.sin(t*.5):.4*Math.sin(time*.6);u.head.rotation.x=.75+(moving?.06*Math.sin(t*2):.08*Math.sin(time*1.3));
}
export function createSpearV274(){
 const g=new T.Group();g.name='V274 scout spear';
 const shaft=new T.Mesh(G.shaft,wood);shaft.position.y=.95;g.add(shaft);
 const tip=new T.Mesh(G.tip,flint);tip.position.y=1.98;g.add(tip);return markRigidPartsV349(g);
}
// dog trots at the scout's left heel, the spear is held upright at the right side
export function addScoutCompanionsV274(root,{spear=true}={}){
 if(!root||root.userData.scoutDogV274)return root;
 const dog=createDogV274();dog.position.set(.55,0,-.15);root.add(dog);
 let held=null;if(spear){held=createSpearV274();held.position.set(-.32,.02,.1);held.rotation.z=.06;root.add(held);}
 root.userData.scoutDogV274=dog;root.userData.scoutSpearV274=held;return root;
}
