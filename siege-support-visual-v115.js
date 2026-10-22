import * as T from './vendor/three.module.js';
const wood=new T.MeshStandardMaterial({color:'#755130',roughness:1}),metal=new T.MeshStandardMaterial({color:'#6c7369',roughness:.8}),rope=new T.MeshStandardMaterial({color:'#d0bd88',roughness:1}),cloth=new T.MeshStandardMaterial({color:'#c1aa78',side:T.DoubleSide,roughness:1});
function box(g,x,y,z,w,h,d,mat=wood){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
export function createBallista(){const g=new T.Group();g.userData.ballista=true;for(const x of [-.65,.65])for(const z of [-.6,.6])box(g,x,.45,z,.17,.9,.17);box(g,0,1,0,.35,.25,2.4);for(const x of [-1.2,1.2]){box(g,x,1.05,.65,.35,.8,.35,rope);const arm=box(g,x*.64,1.25,.8,1.8,.12,.16);arm.rotation.y=x>0?-.24:.24;}box(g,0,1.2,.75,2.4,.05,.05,rope);box(g,0,1.23,.3,.06,.06,2,metal);for(const child of g.children)child.position.y+=.65;box(g,0,.325,0,2.5,.65,2.5);return g;}
export function createSiegeCamp(team=0){const g=new T.Group();g.userData.siegeCamp=true;
 const roof=new T.Mesh(new T.ConeGeometry(3.2,2.8,4),cloth);roof.rotation.y=Math.PI/4;roof.position.set(0,2.6,0);g.add(roof);for(const x of [-2,2])box(g,x,.85,0,.14,1.7,.14);box(g,0,.8,-1.6,4,1.6,.1,cloth);
 for(const x of [3.5,4.5])box(g,x,.55,0,.8,1.1,1.5);for(let i=0;i<6;i++)box(g,3.4+i*.18,1.3,0,.045,1.2,.045,rope);
 for(let i=0;i<8;i++){const m=new T.Mesh(new T.DodecahedronGeometry(.38,0),metal);m.position.set(-3.5+(i%3)*.65,.35+Math.floor(i/6)*.5,(Math.floor(i/3)%2)*.7);g.add(m);}
 box(g,0,2.5,-2,.08,5,.08);box(g,.65,4.5,-2,1.3,.7,.05,new T.MeshStandardMaterial({color:['#3982d8','#bc4a43','#9b72c8','#d4b64c'][team%4]}));return g;}
export function createBallistaBolt(){const g=new T.Group();box(g,0,0,0,.08,.08,2.7,wood);const tip=box(g,0,0,1.45,.16,.16,.3,metal);return g;}
