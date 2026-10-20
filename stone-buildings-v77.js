// V77 stone-age architectural kit. Distinct period silhouettes and shared batched
// geometry/materials. No game rules, resource costs or V4 save schema changes.
import * as T from './vendor/three.module.js';

export const STONE_BUILDING_TYPES=Object.freeze([
 'hall','house','warehouse','cellar','market','study','lumber','quarry',
 'hunter','fisher','farm','well','barracks'
]);
const supported=new Set(STONE_BUILDING_TYPES);
const palette={
 earth:'#a48b69',wood:'#735334',lightwood:'#b08a53',bark:'#493925',
 roof:'#b69861',roofd:'#80603b',reed:'#ceb77f',stone:'#8a8b7a',
 chalk:'#b5b5a1',dark:'#332e28',cloth:'#a57b59',blue:'#577d80',
 moss:'#677351',food:'#aa7b41',fire:'#cb6e37',rope:'#bb9d69'
};
const mats=new Map(),kits=new Map();
const toneTexture=style=>{
 const size=64,p=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const n=(Math.sin(x*127.1+y*311.8)*43758.5453)%1;
  const grain=(n-Math.floor(n))-.5;
  let v=226+grain*25;
  if(style==='reed'){v-=((x+y*5)%9===0?55:0)+(y%17===0?35:0)}
  if(style==='wood'){v-=x%13===0?49:0;v+=Math.sin(y*.53)*12}
  if(style==='stone'){v-=(y%17<2||(x+(Math.floor(y/17)%2)*7)%21<2)?58:0}
  if(style==='hide'){v+=Math.sin(x*.4+y*.15)*18}
  const a=(y*size+x)*4,byte=Math.max(10,Math.min(255,Math.round(v)));
  p[a]=byte;p[a+1]=byte;p[a+2]=byte;p[a+3]=255;
 }
 const d=new T.DataTexture(p,size,size,T.RGBAFormat);
 d.wrapS=d.wrapT=T.RepeatWrapping;d.magFilter=T.LinearFilter;
 d.minFilter=T.LinearMipmapLinearFilter;d.generateMipmaps=true;
 d.colorSpace=T.SRGBColorSpace;d.needsUpdate=true;return d;
};
const textures=new Map();
function material(name){
 if(mats.has(name))return mats.get(name);
 const base=palette[name]||name;
 const style=['roof','roofd','reed'].includes(name)?'reed':['wood','lightwood','bark'].includes(name)?'wood':['stone','chalk'].includes(name)?'stone':['earth','cloth'].includes(name)?'hide':null;
 if(style&&!textures.has(style))textures.set(style,toneTexture(style));
 const m=new T.MeshStandardMaterial({color:base,map:style?textures.get(style):null,
  roughness:.92,metalness:0,flatShading:false});
 mats.set(name,m);return m;
}
function make(root,geo,mat,x=0,y=0,z=0){
 const m=new T.Mesh(geo,material(mat));m.position.set(x,y,z);
 m.castShadow=m.receiveShadow=true;root.add(m);return m;
}
function cube(g,x,y,z,w,h,d,c){return make(g,new T.BoxGeometry(w,h,d),c,x,y,z)}
function pole(g,a,b,r=.13,c='wood',segments=7){
 const v=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),m=make(g,new T.CylinderGeometry(r*.86,r,v.length(),segments),c,
 (a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);
 m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;
}
function stump(g,x,z,r=.48,h=.7){
 make(g,new T.CylinderGeometry(r*.86,r,h,9),'wood',x,h/2,z);
 make(g,new T.CylinderGeometry(r*.74,r*.74,.04,9),'lightwood',x,h+.02,z);
}
function stone(g,x,z,r=.44,y=r*.55){
 const m=make(g,new T.DodecahedronGeometry(r,0),'stone',x,y,z);
 m.scale.y=.7+(x+z)%3*.05;return m;
}
function bundle(g,x,z,n=4){
 for(let i=0;i<n;i++){
  const p=make(g,new T.CylinderGeometry(.2,.23,2.1,8),'wood',x+(i%3)*.36,.34+Math.floor(i/3)*.37,z);
  p.rotation.x=Math.PI/2;
  const end=make(g,new T.CylinderGeometry(.19,.19,.035,8),'lightwood',p.position.x,p.position.y,z+1.05);end.rotation.x=Math.PI/2;
 }
}
function basket(g,x,z,s=.6){const b=make(g,new T.CylinderGeometry(s*.8,s*.58,s*.75,12),'cloth',x,s*.45,z);
 const rim=make(g,new T.TorusGeometry(s*.76,.06,5,12),'rope',x,s*.83,z);rim.rotation.x=Math.PI/2;return b}
function doorway(g,x,z,w=1,h=1.8){
 cube(g,x,h/2,z,w,h,.16,'dark');for(const dx of [-w/2,w/2])pole(g,[x+dx,0,z+.13],[x+dx,h+.2,z+.13],.12,'bark');
 cube(g,x,h+.12,z+.13,w+.3,.24,.2,'wood');
}
function roundHut(g,{x=0,z=0,rx=2.15,rz=1.8,h=2.45,thatch=2,entrance=true}={}){
 // Oval clay-and-wattle body, steep shingle/reed cone silhouette, roof ribbing.
 const body=make(g,new T.CylinderGeometry(rx*.98,rx, h,14),'earth',x,h/2,z);
 body.scale.z=rz/rx;
 const roof=make(g,new T.ConeGeometry(rx*1.38,thatch,14,2),'roof',x,h+thatch*.46,z);
 roof.scale.z=rz/rx;roof.rotation.y=Math.PI/14;
 for(let i=0;i<14;i++){
  const a=i*2*Math.PI/14,xx=Math.sin(a),zz=Math.cos(a);
  pole(g,[x+xx*rx*1.05,h-.08,z+zz*rz*1.07],[x+xx*rx*.15,h+thatch*.93,z+zz*rz*.15],.065,'lightwood',6);
  if(i%2===0)pole(g,[x+xx*rx*.95,.2,z+zz*rz*.95],[x+xx*rx*.95,h-.2,z+zz*rz*.95],.10,'wood');
 }
 // Thatch seams sit outside the eaves, highly visible from elevated camera.
 for(let i=0;i<7;i++){
  const a=(i+.5)*Math.PI/3.5;
  pole(g,[x+Math.sin(a)*rx*1.28,h-.18,z+Math.cos(a)*rz*1.28],
   [x+Math.sin(a)*rx*.35,h+thatch*.62,z+Math.cos(a)*rz*.35],.048,'reed',5);
 }
 if(entrance)doorway(g,x,z+rz+.065,rx*.5,1.75);
 return body;
}
function ridgeRoof(g,x,y,z,w,d,rise=1.6){
 for(const side of [-1,1]){
  const slope=Math.hypot(w/2,rise),angle=Math.atan2(rise,w/2);
  const panel=cube(g,x+side*w/4,y+rise/2,z,slope,.18,d+.2,'roof');
  panel.rotation.z=-side*angle;
  for(let i=0;i<5;i++){
   const zz=z-d/2+(i+.5)*d/5;
   pole(g,[x+side*w/2,y,zz],[x,y+rise,zz],.065,'reed');
  }
 }
 pole(g,[x,y+rise,z-d/2],[x,y+rise,z+d/2],.11,'wood');
}
function shelter(g,x,z,w=4.4,d=3,h=3){
 for(const xx of [-w/2,w/2])for(const zz of [-d/2,d/2])
  pole(g,[x+xx,0,z+zz],[x+xx,h,z+zz],.18,'wood');
 ridgeRoof(g,x,h,z,w+.5,d+.6,1.3);
}
function sign(g,x,y,z,color='blue'){
 pole(g,[x,y-1.4,z],[x,y+1,z],.11,'bark');
 cube(g,x+.55,y+.4,z,1.05,.65,.07,color);
 pole(g,[x,y+.9,z],[x+1.1,y+.9,z],.05,'rope');
}
function craft(g,type,team){
 const flag=team?'cloth':'blue';
 if(type==='hall'){
  roundHut(g,{rx:3.15,rz:2.7,h:3.2,thatch:2.45});
  for(let i=0;i<10;i++){const a=2*Math.PI*i/10;stone(g,Math.cos(a)*4.05,Math.sin(a)*3.55,.45)}
  for(const x of [-3.5,3.5])pole(g,[x,0,-2],[x,4.5,-2],.17,'wood');
  sign(g,3.65,5.3,-2.1,flag);
  make(g,new T.TorusGeometry(1.18,.28,7,12),'stone',0,.22,4.0).rotation.x=Math.PI/2;
  make(g,new T.ConeGeometry(.42,.85,6),'fire',0,.67,4.0);
  basket(g,-3.1,2.5,.45);basket(g,-2.5,3,.45);
 }else if(type==='house'){
  roundHut(g,{rx:1.9,rz:1.66,h:2.3,thatch:1.65});
  bundle(g,2.35,.4,3);basket(g,-2.4,.8,.45);
  pole(g,[1.95,0,-1.4],[1.95,1.3,-1.4],.10,'wood');
 }else if(type==='warehouse'){
  // Wide, raised longhouse and stacked supply jars.
  cube(g,0,.55,0,6.5,1,4.3,'stone');
  for(const x of [-2.7,2.7])for(const z of [-1.7,1.7])pole(g,[x,1,z],[x,4.4,z],.22,'wood');
  cube(g,0,2.4,-.2,5.8,2.6,3.7,'earth');
  ridgeRoof(g,0,3.8,-.2,6.8,4.4,2.15);
  doorway(g,0,1.74,1.9,2.5);
  for(let i=0;i<5;i++)basket(g,-2.25+i*1.06,2.5,.45);
  bundle(g,-3.1,-2.65,4);bundle(g,2.6,-2.5,4);
 }else if(type==='cellar'){
  // Submerged turf-roof store with dark stone portal, not a normal hut.
  const mound=make(g,new T.SphereGeometry(3.2,16,9,0,Math.PI*2,0,Math.PI/2),'moss',0,.12,0);
  mound.scale.set(1.02,.63,.76);
  cube(g,0,.35,2.35,3.5,.95,.58,'stone');
  doorway(g,0,2.37,1.05,1.8);
  for(let i=0;i<7;i++){const a=i*Math.PI/7;stone(g,Math.cos(a)*2.7,2.0+Math.sin(a)*.35,.4,.25)}
  basket(g,-2.5,2.7,.52);basket(g,2.4,2.65,.52);
 }else if(type==='market'){
  // Deliberately roofless on the sides with two coloured shaded stalls.
  for(const x of [-2.25,2.25]){
   for(const z of [-1.65,1.65])pole(g,[x,0,z],[x,3.35,z],.16,'wood');
   const cloth=cube(g,x,3.42,0,2.85,.12,3.7,x<0?'cloth':'blue');
   cloth.rotation.z=x<0?.11:-.11;
   cube(g,x,1.0,.75,2.45,.22,.9,'lightwood');
   for(let i=0;i<3;i++)basket(g,x-.75+i*.65,1,.26);
  }
  pole(g,[-3.9,3.5,-1.85],[3.9,3.5,-1.85],.10,'rope');
  for(let i=0;i<9;i++){
   const x=-3.6+i*.9;
   cube(g,x,3.3,-1.9,.3,.37,.08,i%2?'cloth':'reed');
  }
 }else if(type==='study'){
  roundHut(g,{rx:2.15,rz:1.87,h:2.7,thatch:2});
  for(let i=0;i<5;i++)stone(g,-2.3+i*.88,3.15,.36);
  cube(g,2.7,1.25,.6,2.2,.2,1.0,'lightwood');
  for(let i=0;i<4;i++)cube(g,2.1+i*.35,1.43,.4,.17,.12,.65,'chalk');
  sign(g,-2.6,3.8,-.4,'cloth');
 }else if(type==='lumber'){
  shelter(g,-1.1,-.45,3.15,2.7,2.75);
  cube(g,-1.1,.9,-.45,2.8,1.8,1.9,'earth');
  doorway(g,-1.1,1.4,.57,.8,1.4);
  bundle(g,2.2,-.9,7);stump(g,1.65,2.05,.65,.8);
  pole(g,[1.45,.9,1.85],[2.6,2.35,1.85],.075,'stone');
 }else if(type==='quarry'){
  for(let i=0;i<8;i++){
   const x=-2.8+(i%4)*1.22,z=-1.9+Math.floor(i/4)*1.5;
   stone(g,x,z,.55+(i%3)*.19);
  }
  shelter(g,1.6,1.05,2.15,2.5,2.35);
  cube(g,1.65,.65,.8,1.9,.85,1.7,'stone');
  for(let i=0;i<3;i++)cube(g,-2.25+i*.85,.23,2.65,.75,.45,.6,'chalk');
  pole(g,[2.8,0,-.3],[2.8,3.5,-.3],.18,'wood');
  pole(g,[2.8,3.35,-.3],[.8,3.35,-.3],.12,'wood');
  pole(g,[1.15,1.35,-.3],[1.15,3.35,-.3],.038,'rope');
 }else if(type==='hunter'){
  roundHut(g,{x:-1.25,z:-.5,rx:1.65,rz:1.55,h:2.1,thatch:1.65});
  for(const x of [1.05,2.95])pole(g,[x,0,1.25],[x,3,1.25],.12,'wood');
  pole(g,[1.05,2.9,1.25],[2.95,2.9,1.25],.13,'wood');
  const hide=cube(g,2,1.7,1.32,1.45,1.5,.10,'cloth');hide.rotation.z=.15;
  for(let i=0;i<4;i++)pole(g,[2.7+i*.25,0,-1.65],[2.7+i*.25,2.7,-1.65],.055,'wood');
  basket(g,1.2,-1.3,.45);
 }else if(type==='fisher'){
  roundHut(g,{x:-1.2,z:-.7,rx:1.6,rz:1.4,h:1.95,thatch:1.4});
  cube(g,1.85,.34,.4,3.5,.3,2.1,'wood');
  for(const x of [.5,3.2])for(const z of [-.5,1.2])pole(g,[x,0,z],[x,1.5,z],.10,'bark');
  for(const x of [1.0,2.8])pole(g,[x,0,2],[x,3.1,2],.12,'wood');
  pole(g,[1.0,3,2],[2.8,3,2],.1,'wood');
  for(let j=0;j<4;j++)for(let i=0;i<4;i++){
   pole(g,[1.05+i*.5,.9+j*.43,2.05],[1.05+(i+1)*.5,.9+j*.43,2.05],.015,'rope',5);
   pole(g,[1.05+i*.5,.9+j*.43,2.05],[1.05+i*.5,.9+(j+1)*.43,2.05],.015,'rope',5);
  }
  for(let i=0;i<3;i++){const fish=make(g,new T.ConeGeometry(.2,.65,5),'blue',1.05+i*.65,1.1,2.26);fish.rotation.z=Math.PI/2;}
 }else if(type==='farm'){
  shelter(g,1.65,-1.35,2.0,2.1,2.65);
  for(let j=0;j<5;j++){
   const z=-1.7+j*.85;
   cube(g,-1.25,.11,z,4.7,.18,.44,'earth');
   for(let i=0;i<8;i++){
    const x=-3.2+i*.56;
    pole(g,[x,.23,z],[x,.75+(i%2)*.18,z],.04,'moss',5);
   }
  }
  basket(g,1.6,1.6,.5);basket(g,2.55,1.4,.45);
 }else if(type==='well'){
  make(g,new T.CylinderGeometry(1.0,1.16,1.0,12),'stone',0,.5,0);
  const dark=make(g,new T.CylinderGeometry(.7,.7,.025,12),'dark',0,1.01,0);
  for(const x of [-1.2,1.2])pole(g,[x,0,0],[x,3.4,0],.16,'wood');
  ridgeRoof(g,0,3.2,0,3.3,2.5,.9);
  pole(g,[-1.2,2.6,.2],[1.2,2.6,.2],.10,'wood');
  pole(g,[0,1.4,.35],[0,2.65,.35],.03,'rope');
  basket(g,1.65,.9,.45);
 }else if(type==='barracks'){
  roundHut(g,{x:-1.35,z:-.45,rx:1.85,rz:1.6,h:2.5,thatch:1.65});
  for(let i=0;i<5;i++){
   const x=.65+i*.55;
   pole(g,[x,0,2.6],[x,3,2.6],.095,'wood');
   const tip=make(g,new T.ConeGeometry(.10,.35,6),'stone',x,3.15,2.6);tip.rotation.z=Math.PI;
  }
  cube(g,1.8,.7,-1.3,2.7,.23,1.15,'wood');
  for(let i=0;i<3;i++)cube(g,1.0+i*.65,.88,-1.3,.16,.07,1.0,'rope');
  sign(g,2.35,3.8,-1.4,flag);
 }
}
function bake(root){
 root.updateMatrixWorld(true);const grouped=new Map();
 root.traverse(o=>{if(!o.isMesh)return;
  const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
  geo.applyMatrix4(o.matrixWorld);
  const key=o.material.uuid;if(!grouped.has(key))grouped.set(key,{material:o.material,parts:[]});
  grouped.get(key).parts.push(geo);
 });
 const baked=[];let triangles=0;
 for(const {material,parts} of grouped.values()){
  let count=0;for(const g of parts)count+=g.attributes.position.count;
  const positions=new Float32Array(count*3),normals=new Float32Array(count*3),uvs=new Float32Array(count*2);let offset=0;
  for(const g of parts){
   let n=g.attributes.position.count;
   positions.set(g.attributes.position.array,offset*3);
   normals.set(g.attributes.normal.array,offset*3);
   if(g.attributes.uv)uvs.set(g.attributes.uv.array,offset*2);
   offset+=n;g.dispose();
  }
  const mesh=new T.BufferGeometry();
  mesh.setAttribute('position',new T.BufferAttribute(positions,3));
  mesh.setAttribute('normal',new T.BufferAttribute(normals,3));
  mesh.setAttribute('uv',new T.BufferAttribute(uvs,2));
  mesh.computeBoundingSphere();mesh.userData.shared=true;
  baked.push({mesh,material});triangles+=count/3;
 }
 root.traverse(o=>{if(o.isMesh)o.geometry.dispose()});
 return {baked,triangles};
}
export function createStoneBuilding(type,team=0){
 if(!supported.has(type))return null;
 const variant=team===0?0:1,key=type+':'+variant;
 if(!kits.has(key)){
  const root=new T.Group();craft(root,type,team);
  kits.set(key,bake(root));
 }
 const template=kits.get(key),group=new T.Group();
 group.name='V77 kiviaja '+type;
 group.userData.age=0;group.userData.stoneAgeModel=true;
 group.userData.buildingType=type;group.userData.triangles=template.triangles;
 for(const {mesh,material} of template.baked){
  const m=new T.Mesh(mesh,material);m.castShadow=true;m.receiveShadow=true;group.add(m);
 }
 return group;
}
