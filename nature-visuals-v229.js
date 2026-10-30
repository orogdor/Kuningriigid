// Nature resources for the detail map. Shared geometry keeps the number of draw calls low.
import * as T from './vendor/three.module.js';

const colors={fur:'#806044',light:'#b89a77',dark:'#493d31',antler:'#7b664e',eye:'#191712',leaf:'#526f3e',berry:'#713d3b',fish:'#718e85'};
const materials=new Map(),templates=new Map();
function furTexture(){
 const size=128,data=new Uint8Array(size*size*4);let seed=9137;
 for(let i=0;i<size*size;i++){seed=(1664525*seed+1013904223)>>>0;const n=190+(seed>>>27);data[i*4]=n;data[i*4+1]=n-4;data[i*4+2]=n-10;data[i*4+3]=255;}
 const t=new T.DataTexture(data,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;
}
function material(name){if(!materials.has(name))materials.set(name,new T.MeshStandardMaterial({color:colors[name],map:name==='fur'?furTexture():null,roughness:1,side:name==='leaf'?T.DoubleSide:T.FrontSide}));return materials.get(name)}
function add(parts,name,geometry,position,scale=[1,1,1],rotation=[0,0,0]){
 const o=new T.Object3D();o.position.set(...position);o.rotation.set(...rotation);o.scale.set(...scale);o.updateMatrix();
 const g=geometry.index?geometry.toNonIndexed():geometry.clone();g.applyMatrix4(o.matrix);
 (parts[name]??=[]).push(g);
}
function sphere(parts,name,pos,scale,rot){add(parts,name,new T.SphereGeometry(1,12,8),pos,scale,rot)}
function rod(parts,name,a,b,r1,r2){
 const v=new T.Vector3(...b).sub(new T.Vector3(...a)),g=new T.CylinderGeometry(r2,r1,v.length(),7),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize());
 g.applyQuaternion(q);g.translate((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);const triangleGeometry=g.toNonIndexed();g.dispose();(parts[name]??=[]).push(triangleGeometry);
}
function combine(parts){const group=new T.Group();for(const [name,geos] of Object.entries(parts)){
 const positions=[],normals=[],uv=[];for(const g of geos){const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));uv.push(p.getX(i)*3,p.getY(i)*3);}g.dispose()}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeBoundingSphere();g.userData.shared=true;
 const mesh=new T.Mesh(g,material(name));mesh.castShadow=name!=='leaf'&&name!=='berry';mesh.receiveShadow=true;group.add(mesh);
 }return group;}
function deer(ox=false){
 const p={};
 // The body is approximately 1.2 m long; legs reach the ground and the head faces +X.
 sphere(p,'fur',[0,.89,0],ox?[.72,.43,.34]:[.63,.34,.25]);sphere(p,'fur',[-.43,.84,0],ox?[.33,.38,.32]:[.29,.31,.25]);
 sphere(p,'light',[.02,.72,0],[.48,.15,.23]);
 sphere(p,'fur',[.45,1.12,0],[.22,.36,.19],[0,0,-.36]);
 sphere(p,'fur',[.64,1.39,0],[.24,.17,.15],[0,0,-.12]);
 sphere(p,'light',[.81,1.34,0],[.16,.10,.12]);sphere(p,'dark',[.93,1.35,0],[.055,.045,.09]);
 sphere(p,'fur',[-.62,1.04,0],[.15,.08,.08],[0,0,-.45]);sphere(p,'light',[-.70,1.01,0],[.08,.07,.06]);
 for(const z of [-.17,.17]){
  for(const x of [-.39,.37]){
   const hind=x<0, hip=[x,.78,z],knee=[x+(hind?.09:-.025),.40,z],foot=[x+(hind?.02:.015),.07,z];
   rod(p,'fur',hip,knee,.075,.050);rod(p,'fur',knee,foot,.048,.030);sphere(p,'dark',[foot[0]+.025,.045,z],[.085,.045,.05]);
  }
  sphere(p,'fur',[.53,1.53,z*.75],[.13,.055,.055],[z<0?-.25:.25,0,z<0?-.55:.55]);
  sphere(p,'light',[.55,1.54,z*.82],[.09,.025,.03],[0,0,z<0?-.5:.5]);
  sphere(p,'eye',[.72,1.43,z*.78],[.023,.025,.018]);
  if(ox){rod(p,'antler',[.55,1.51,z*.7],[.53,1.58,z*1.9],.045,.025);rod(p,'antler',[.53,1.58,z*1.9],[.56,1.69,z*2.35],.025,.005);}
  else{const a=[.56,1.51,z*.7],b=[.53,1.78,z*1.3],c=[.44,1.94,z*1.7];
   rod(p,'antler',a,b,.028,.022);rod(p,'antler',b,c,.022,.012);
   rod(p,'antler',[.52,1.75,z*1.25],[.69,1.88,z*1.6],.018,.006);
   rod(p,'antler',[.47,1.86,z*1.55],[.52,2.02,z*1.8],.014,.004);}
 }
 return combine(p);
}
function leafGeometry(){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,0,-.08,.13,.015,0,.28,.02,0,0,0,0,.28,.02,.08,.13,.015],3));g.computeVertexNormals();return g;
}
function berryBush(){
 const p={},leaf=leafGeometry();
 for(let branch=0;branch<15;branch++){
  const angle=branch*2.4,rad=.15+(branch%4)*.105,x=Math.cos(angle)*rad,z=Math.sin(angle)*rad,h=.56+(branch%5)*.12;
  rod(p,'dark',[x*.25,.05,z*.25],[x,h,z],.018,.006);
  for(let j=0;j<7;j++){
   const a=angle+j*2.4,y=.24+j*.105,spread=.08+(j%3)*.05;
   add(p,'leaf',leaf,[x+Math.cos(a)*spread,y,z+Math.sin(a)*spread],[1.1,1.1,1.1],[.35,a,j%2?.38:-.38]);
   if((j+branch)%5===0)sphere(p,'berry',[x+Math.cos(a)*spread,y+.09,z+Math.sin(a)*spread],[.035,.035,.035]);
  }
 }
 leaf.dispose();return combine(p);
}
function fish(){const p={};sphere(p,'fish',[0,.19,0],[.48,.16,.13]);sphere(p,'dark',[.38,.23,.105],[.018,.018,.015]);const tail=new T.ConeGeometry(.19,.28,4);add(p,'fish',tail,[-.48,.19,0],[1,1,.35],[0,0,-Math.PI/2]);return combine(p);}
export function createNatureResourceV229(kind){
 if(!templates.has(kind))templates.set(kind,kind==='game'?deer():kind==='ox'?deer(true):kind==='berry'?berryBush():fish());
 const g=templates.get(kind).clone(true);g.userData.natureV229=kind;return g;
}
