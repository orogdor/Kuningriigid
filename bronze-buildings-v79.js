// V79 bronze age: rectangular timber-and-clay architecture, tiled roofs,
// pottery, cast metal and recognisable professional equipment.
// Shared cached geometry and materials, no new GLB fetches or save fields.
import * as T from './vendor/three.module.js';
export const BRONZE_BUILDING_TYPES=Object.freeze(['hall','house','warehouse','cellar','market','study','lumber','quarry','hunter','fisher','farm','well','barracks','harbor','bridge','claypit','pottery_kiln','pasture','mason','cartwright','coppermine','tinmine','bronze_foundry','road_depot','saw','mill','bakery','archery','forester','scriptorium']);
const kinds=new Set(BRONZE_BUILDING_TYPES),templates=new Map(),materials=new Map(),textures=new Map();
const col={wall:'#c7ad89',brick:'#ae8e70',stone:'#979688',wood:'#74513a',light:'#bd9465',
 roof:'#a27656',tile:'#b78e65',metal:'#ad854b',iron:'#716f69',dark:'#45362c',
 blue:'#6d96aa',red:'#b4745a',canvas:'#d2ba91',earth:'#977a56',leaf:'#708955',
 water:'#61929b',fire:'#ffab56'};
function texture(style){
 if(textures.has(style))return textures.get(style);
 const a=new Uint8Array(64*64*4);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){
  let v=224+(Math.sin(x*23.1+y*91.9)*.5)*19;
  if(style==='brick'&&(y%11<2||(x+(Math.floor(y/11)%2)*9)%19<2))v-=55;
  if(style==='roof'&&(y%8<2||(x+Math.floor(y/8)*6)%15<2))v-=49;
  if(style==='wood'&&x%11<2)v-=41;
  const i=(y*64+x)*4;a[i]=a[i+1]=a[i+2]=Math.max(5,Math.min(255,v));a[i+3]=255;
 }
 const t=new T.DataTexture(a,64,64,T.RGBAFormat);
 t.wrapS=t.wrapT=T.RepeatWrapping;t.minFilter=T.LinearMipmapLinearFilter;
 t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.needsUpdate=true;t.colorSpace=T.SRGBColorSpace;
 textures.set(style,t);return t;
}
function mat(key){if(materials.has(key))return materials.get(key);
 const style=['wall','brick','stone'].includes(key)?'brick':['wood','light'].includes(key)?'wood':['roof','tile'].includes(key)?'roof':null;
 const m=new T.MeshStandardMaterial({color:col[key],map:style?texture(style):null,roughness:key==='metal'?.55:.94,metalness:key==='metal'?.5:0});
 materials.set(key,m);return m;
}
function mesh(g,geometry,color,x=0,y=0,z=0){
 const m=new T.Mesh(geometry,mat(color));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;
}
const box=(g,x,y,z,w,h,d,c='wall')=>mesh(g,new T.BoxGeometry(w,h,d),c,x,y,z);
const rod=(g,a,b,r=.1,c='wood')=>{const d=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
 const m=mesh(g,new T.CylinderGeometry(r*.88,r,d.length(),7),c,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);
 m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;};
const rock=(g,x,z,r=.5,c='stone')=>mesh(g,new T.DodecahedronGeometry(r,0),c,x,r*.7,z);
const pot=(g,x,z,r=.35)=>{mesh(g,new T.SphereGeometry(r,10,6),'brick',x,r,z);
 mesh(g,new T.CylinderGeometry(r*.42,r*.48,.19,10),'tile',x,r*1.9,z);};
const barrel=(g,x,z)=>{mesh(g,new T.CylinderGeometry(.39,.43,.88,9),'wood',x,.44,z);
 mesh(g,new T.TorusGeometry(.39,.05,4,9),'metal',x,.17,z).rotation.x=Math.PI/2;};
function ridge(g,x,y,z,w,d,h=1.5,color='roof'){
 for(const side of [-1,1]){const m=box(g,x+side*w/4,y+h/2,z,Math.hypot(w/2,h),.2,d+.3,color);
  m.rotation.z=-side*Math.atan2(h,w/2);}
 rod(g,[x,y+h,z-d/2],[x,y+h,z+d/2],.11,'wood');
}
function house(g,x=0,z=0,w=4.7,d=3.8,h=2.9,r=1.6){
 box(g,x,.28,z,w+.4,.55,d+.4,'stone');
 box(g,x,h/2+.25,z,w,h-.5,d,'wall');
 for(const sx of [-1,1])for(const sz of [-1,1])
  rod(g,[x+sx*w/2,0,z+sz*d/2],[x+sx*w/2,h,z+sz*d/2],.18,'wood');
 ridge(g,x,h,z,w+.55,d+.5,r);
 box(g,x,.97,z+d/2+.09,1.16,1.94,.15,'dark');
 box(g,x,2.02,z+d/2+.12,1.45,.18,.26,'light');
 for(const xx of [-w*.3,w*.3])box(g,x+xx,2.15,z+d/2+.1,.53,.45,.16,'dark');
}
function shelter(g,x,z,w=4.6,d=3,h=3,c='tile'){
 for(const xx of [-w/2,w/2])for(const zz of [-d/2,d/2])rod(g,[x+xx,0,z+zz],[x+xx,h,z+zz],.16,'wood');
 ridge(g,x,h,z,w+.5,d+.5,1.05,c);
}
function crate(g,x,z,n=3){for(let i=0;i<n;i++)box(g,x+(i%3)*.8,.35+Math.floor(i/3)*.75,z,.72,.68,.72,'wood');}
function sign(g,x,z,team=0){
 rod(g,[x,0,z],[x,4.6,z],.13,'wood');box(g,x+.5,3.9,z,1.0,.83,.1,team?'red':'blue');
 mesh(g,new T.IcosahedronGeometry(.25,1),'metal',x,4.9,z);
}
function furnace(g,x,z){
 mesh(g,new T.CylinderGeometry(1.03,1.46,2.3,12),'brick',x,1.15,z);
 mesh(g,new T.ConeGeometry(1.12,.7,12),'tile',x,2.65,z);
 box(g,x,.73,z+1.07,.93,1.04,.18,'dark');
 mesh(g,new T.ConeGeometry(.35,.9,6),'fire',x,.76,z+1.25);
 box(g,x-1.0,3.4,z-.7,.65,2,.65,'brick');
}
function render(g,type,team){
 if(type==='hall'){
  house(g,0,0,7.8,5.5,4.4,2.5);
  for(const x of [-3,0,3])rod(g,[x,0,3.3],[x,4.9,3.3],.23,'stone');
  ridge(g,0,4.95,3.25,8.5,2,1.05,'tile');
  sign(g,5.1,-1.4,team);crate(g,-3.3,4.2,4);
 }else if(type==='house'){
  house(g,0,0,4.6,3.7,2.8,1.65);barrel(g,2.7,1.8);
  box(g,-1.2,3.5,-.8,.67,1.55,.65,'brick');crate(g,-2.8,.5,2);
 }else if(type==='warehouse'){
  house(g,0,0,8.3,5.2,3.9,2.0);
  box(g,0,1.25,2.69,2.6,2.5,.16,'dark');
  crate(g,-4.4,2,7);for(let i=0;i<4;i++)barrel(g,2.45+i*.8,3.2);
 }else if(type==='cellar'){
  box(g,0,.65,0,6,1.3,5,'stone');
  ridge(g,0,1.25,0,6.4,5.4,.65,'leaf');
  box(g,0,.9,2.57,1.4,1.7,.16,'dark');
  for(let i=0;i<5;i++)pot(g,-2+i,3.2,.33);
 }else if(type==='market'){
  for(const x of [-2.6,2.6]){
   shelter(g,x,0,3.7,3.7,3.1,x<0?'blue':'red');
   box(g,x,1.05,.9,2.65,.24,1.0,'light');
   for(let i=0;i<3;i++)pot(g,x-.85+i*.84,1.15,.31);
  }
  for(let i=0;i<5;i++)barrel(g,-2+i,3.3);
 }else if(type==='study'||type==='scriptorium'){
  house(g,0,0,5.25,4.2,3.35,1.75);
  box(g,3.1,1.1,1.5,2.35,.18,1.1,'wood');
  for(let i=0;i<5;i++)box(g,2.2+i*.42,1.3,1.5,.25,.16,.8,type==='study'?'canvas':'metal');
  sign(g,-3.1,-1.5,team);
 }else if(['lumber','saw','forester'].includes(type)){
  shelter(g,-1.1,0,4.0,3.6,2.8);box(g,-1.2,.75,0,3.5,1.3,2.4,'brick');
  for(let i=0;i<7;i++){const m=mesh(g,new T.CylinderGeometry(.19,.2,2.4,7),'wood',1.2+(i%4)*.35,.37+Math.floor(i/4)*.36,1.8);m.rotation.x=Math.PI/2;}
  if(type==='saw')box(g,2.5,2,0,.13,2.6,1.1,'iron');
  if(type==='forester')for(let i=0;i<4;i++)mesh(g,new T.ConeGeometry(.34,1.15,6),'leaf',1.1+i*.75,.6,-2.4);
 }else if(['quarry','mason','coppermine','tinmine','claypit'].includes(type)){
  shelter(g,-2,0,3.3,3.2,2.7);
  for(let i=0;i<9;i++){const x=.3+(i%3)*1.3,z=-2+Math.floor(i/3)*1.7;
   if(type==='claypit')pot(g,x,z,.48);
   else if(type==='mason')box(g,x,.4,z,1.15,.8,1.03,'stone');
   else rock(g,x,z,.4+(i%3)*.16,type==='coppermine'?'metal':type==='tinmine'?'iron':'stone');}
  rod(g,[2.2,0,-1.2],[2.2,4.2,-1.2],.15,'wood');rod(g,[2.2,4.1,-1.2],[.7,4.1,-1.2],.1,'wood');
 }else if(['hunter','archery','barracks'].includes(type)){
  house(g,-1.2,-.55,4,3.3,2.8,1.5);
  for(let i=0;i<6;i++){const x=.8+i*.52;rod(g,[x,0,2.65],[x,3.0,2.65],.065,'wood');
   mesh(g,new T.ConeGeometry(.1,.34,5),'metal',x,3.16,2.65);}
  if(type==='hunter')box(g,2.1,1.6,2.7,1.35,1.4,.1,'canvas');
  if(type==='archery')for(let i=0;i<2;i++)mesh(g,new T.TorusGeometry(.57,.09,6,12),'wood',1.7+i*1.5,1.8,-2.5);
  if(type==='barracks')sign(g,3.3,-1.2,team);
 }else if(type==='fisher'||type==='harbor'){
  house(g,-1.6,-1.2,3.8,3.2,2.5,1.3);
  box(g,2,.45,1,4.2,.36,3.2,'light');
  for(let i=0;i<5;i++)rod(g,[.3+i*.75,0,2.6],[.3+i*.75,3.1,2.6],.09,'wood');
  for(let i=0;i<4;i++)box(g,.55+i*.72,2.1,2.72,.3,.2,.11,'blue');
  if(type==='harbor'){
   box(g,2.7,.35,3.25,2.4,.35,4.8,'wood');
   const hull=mesh(g,new T.CylinderGeometry(.65,.55,3.8,8),'wood',2.5,.8,4.0);hull.rotation.x=Math.PI/2;
   sign(g,3.85,-1.75,team);
  }
 }else if(type==='farm'||type==='pasture'){
  shelter(g,2,-1.3,2.7,2.8,2.5,'tile');
  for(let j=0;j<5;j++){const z=-2+j*.9;box(g,-1.2,.12,z,4.7,.2,.42,'earth');
   for(let i=0;i<8;i++)mesh(g,new T.ConeGeometry(.13,.55,5),'leaf',-3.25+i*.55,.53,z);}
  if(type==='pasture')for(const z of [-2.9,2.9])for(let i=0;i<5;i++)rod(g,[-3.8+i*1.85,.65,z],[-1.95+i*1.85,.65,z],.065,'wood');
  barrel(g,2.15,2.1);
 }else if(type==='well'){
  mesh(g,new T.CylinderGeometry(1.1,1.25,1.18,12),'stone',0,.59,0);
  mesh(g,new T.CylinderGeometry(.8,.8,.05,12),'water',0,1.2,0);
  for(const x of [-1.45,1.45])rod(g,[x,0,0],[x,3.5,0],.16,'wood');
  ridge(g,0,3.05,0,3.6,2.6,.93,'tile');barrel(g,2.3,.8);
 }else if(type==='bridge'){
  box(g,0,.8,0,8,.34,3.5,'light');
  for(let i=0;i<5;i++)for(const z of [-1.55,1.55])rod(g,[-3.6+i*1.8,0,z],[-3.6+i*1.8,2.0,z],.14,'wood');
  for(const z of [-1.55,1.55])rod(g,[-3.85,1.9,z],[3.85,1.9,z],.11,'metal');
 }else if(['pottery_kiln','bronze_foundry','bakery'].includes(type)){
  house(g,-1.8,-.7,3.4,3.2,2.5,1.3);furnace(g,2,0);
  if(type==='pottery_kiln')for(let i=0;i<8;i++)pot(g,-.1+(i%4)*.8,2.65+Math.floor(i/4)*.5,.32);
  if(type==='bronze_foundry')for(let i=0;i<5;i++)box(g,.2+i*.7,.36,2.7,.58,.34,.5,'metal');
  if(type==='bakery')for(let i=0;i<6;i++)mesh(g,new T.SphereGeometry(.3,7,5),'tile',.2+i*.59,.4,2.8);
 }else if(['cartwright','road_depot'].includes(type)){
  shelter(g,-1.2,-.6,4.6,3.8,2.8);crate(g,-2.6,2.1,5);
  for(let i=0;i<2;i++){
   const m=mesh(g,new T.TorusGeometry(.83,.18,6,12),'wood',1.2+i*2,1.15,1.0);m.rotation.y=Math.PI/2;
  }
  box(g,2.1,.82,-.7,3.5,.22,2.3,'light');
  if(type==='road_depot')for(let i=0;i<4;i++)box(g,1+i*.6,.3,3,.52,.4,1.15,'stone');
 }else if(type==='mill'){
  house(g,-1.15,-.5,4.0,3.4,3,1.4);
  mesh(g,new T.CylinderGeometry(1.0,1.0,.65,14),'stone',2.3,.67,.6);
  rod(g,[2.3,1,.6],[2.3,4,.6],.12,'wood');
  for(let i=0;i<4;i++){const a=i*Math.PI/2;
   rod(g,[2.3,3,.6],[2.3+1.25*Math.cos(a),3+1.25*Math.sin(a),.6],.07,'light');}
  barrel(g,2.2,2.5);
 }
}
function bake(root){
 root.updateMatrixWorld(true);const buckets=new Map();
 root.traverse(o=>{if(!o.isMesh)return;
  const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
  geo.applyMatrix4(o.matrixWorld);const k=o.material.uuid;
  if(!buckets.has(k))buckets.set(k,{material:o.material,parts:[]});
  buckets.get(k).parts.push(geo);
 });
 const output=[];let triangles=0;
 for(const {material,parts} of buckets.values()){
  const num=parts.reduce((a,b)=>a+b.attributes.position.count,0);
  const p=new Float32Array(num*3),n=new Float32Array(num*3),uv=new Float32Array(num*2);let at=0;
  for(const g of parts){const len=g.attributes.position.count;
   p.set(g.attributes.position.array,at*3);n.set(g.attributes.normal.array,at*3);
   if(g.attributes.uv)uv.set(g.attributes.uv.array,at*2);at+=len;g.dispose();}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(p,3));
  geo.setAttribute('normal',new T.BufferAttribute(n,3));geo.setAttribute('uv',new T.BufferAttribute(uv,2));
  geo.computeBoundingSphere();geo.userData.shared=true;output.push({geo,material});triangles+=num/3;
 }
 root.traverse(o=>{if(o.isMesh)o.geometry.dispose()});
 return {output,triangles};
}
export function createBronzeBuilding(type,team=0){
 if(!kinds.has(type))return null;
 const key=type+':'+(team===0?0:1);
 if(!templates.has(key)){const group=new T.Group();render(group,type,team);templates.set(key,bake(group));}
 const {output,triangles}=templates.get(key),root=new T.Group();
 root.name='V79 pronksiaja '+type;root.userData.bronzeAgeModel=true;
 root.userData.buildingType=type;root.userData.age=1;root.userData.triangles=triangles;
 for(const {geo,material} of output){
  const mesh=new T.Mesh(geo,material);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
 }
 return root;
}
