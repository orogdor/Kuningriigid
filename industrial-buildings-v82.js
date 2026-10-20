// V82 – Industrial Revolution buildings: brick mills, cast-iron factories,
// railway and civic halls. Procedurally textured, batched and shared between
// repeated city objects; no GLB download and no changes to V4 save schemas.
import * as T from './vendor/three.module.js';
import {RENAISSANCE_BUILDING_TYPES} from './renaissance-buildings-v81.js?v=81a';

export const INDUSTRIAL_BUILDING_TYPES=Object.freeze([
 ...new Set([...RENAISSANCE_BUILDING_TYPES,'steelworks','engineworks','polytechnic',
   'railstation','bridge','claypit','pottery_kiln','pasture','mine','coal',
   'oilwell','refinery','powerplant','autofactory','laboratory','airfield'])
]);
const supported=new Set(INDUSTRIAL_BUILDING_TYPES),kits=new Map(),paints=new Map(),textures=new Map();
const color={
 brick:'#ad6652',brickLight:'#c58a6a',stone:'#9a9995',cutstone:'#c7bdac',
 slate:'#657079',iron:'#54595e',dark:'#34383c',timber:'#725440',
 wood:'#ae8057',steel:'#878c8d',glass:'#8ca9ab',blue:'#557d8b',
 ochre:'#c9a06b',plaster:'#d6c4a7',roof:'#6b7e7e',copper:'#a77f55',
 foliage:'#6e8362',smoke:'#aaa99f'
};
function noise(x,y){const a=Math.sin(x*127.1+y*311.7)*43758.545;return a-Math.floor(a)}
function pattern(kind){
 if(textures.has(kind))return textures.get(kind);
 const size=64,bytes=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let v=220+(noise(x,y)-.5)*30;
  if(kind==='brick'&&(y%11<2||(x+(Math.floor(y/11)%2)*11)%21<2))v-=83;
  if(kind==='slate'&&(y%9<1||(x+(Math.floor(y/9)%2)*7)%14<1))v-=41;
  if(kind==='iron'&&(x%20<2||y%20<2))v-=37;
  if(kind==='wood'&&(x%11<2||Math.sin(y*.45+x*.13)>.86))v-=40;
  const i=(y*size+x)*4;
  bytes[i]=bytes[i+1]=bytes[i+2]=Math.max(0,Math.min(255,Math.round(v)));
  bytes[i+3]=255;
 }
 const tex=new T.DataTexture(bytes,size,size,T.RGBAFormat);
 tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.generateMipmaps=true;
 tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;
 tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;textures.set(kind,tex);return tex;
}
function paint(k){
 if(paints.has(k))return paints.get(k);
 const tex=['brick','brickLight'].includes(k)?'brick':['slate','roof'].includes(k)?'slate':
   ['iron','steel'].includes(k)?'iron':['timber','wood'].includes(k)?'wood':null;
 const m=new T.MeshStandardMaterial({color:color[k]||k,map:tex?pattern(tex):null,
  roughness:k==='glass'?.27:k==='steel'?.62:.91,metalness:k==='steel'||k==='iron'?.23:0,
  transparent:k==='glass',opacity:k==='glass'?.88:1,side:T.FrontSide});
 paints.set(k,m);return m;
}
function geom(g,mesh,color,x=0,y=0,z=0){
 const m=new T.Mesh(mesh,paint(color));m.position.set(x,y,z);
 m.castShadow=m.receiveShadow=true;g.add(m);return m;
}
const box=(g,x,y,z,w,h,d,c='brick')=>geom(g,new T.BoxGeometry(w,h,d),c,x,y,z);
function cylinder(g,x,y,z,r1,r2,h,c='iron',n=10){
 return geom(g,new T.CylinderGeometry(r1,r2,h,n),c,x,y,z);
}
function pipe(g,a,b,r=.12,c='steel'){
 const v=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
 const o=cylinder(g,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,r,v.length(),c,8);
 o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;
}
function dome(g,x,y,z,r,c='copper'){
 const obj=geom(g,new T.SphereGeometry(r,14,8,0,Math.PI*2,0,Math.PI/2),c,x,y,z);
 obj.scale.y=.72;return obj;
}
function cone(g,x,y,z,r,h,c='slate',n=8){return geom(g,new T.ConeGeometry(r,h,n),c,x,y,z)}
function arch(g,x,z,w=1.2,h=2.8){
 box(g,x,h/2,z,w,h,.12,'dark');
 box(g,x,h+.12,z,w+.4,.26,.18,'cutstone');
 for(const dx of [-w/2,w/2])box(g,x+dx,h/2,z+.07,.15,h,.22,'cutstone');
}
function windows(g,w=7.6,h=5.2,d=5.8,tall=false){
 for(const z of [-d/2-.12,d/2+.12]){
  for(const x of [-w*.29,0,w*.29]){
   for(let row=0;row<(tall?3:2);row++){
    const y=2.6+row*1.5;
    box(g,x,y,z,.84,1.16,.10,'glass');
    box(g,x,y,z+.065,.10,1.16,.12,'cutstone');
    box(g,x,y+.57,z+.065,1.0,.12,.17,'cutstone');
    box(g,x,y-.58,z+.065,1.0,.12,.17,'stone');
   }
  }
 }
}
function roof(g,h=5.6,w=7.7,d=6.1){
 const rise=1.15;
 for(const side of [-1,1]){
  const slope=Math.hypot(w/2,rise);
  box(g,side*w/4,h+rise/2,0,slope,.16,d+.2,'slate').rotation.z=-side*Math.atan2(rise,w/2);
 }
 pipe(g,[0,h+rise,-d/2],[0,h+rise,d/2],.1,'iron');
}
function walls(g,{w=7.6,d=5.7,h=5.9,industrial=false}={}){
 box(g,0,.28,0,w+.35,.55,d+.4,'stone');
 box(g,0,h/2+.55,0,w,h,d,industrial?'brick':'plaster');
 for(const x of [-w/2,w/2])for(const z of [-d/2,d/2]){
  box(g,x,h/2+.55,z,.3,h,.32,'cutstone');
 }
 box(g,0,h+1,0,w+.3,.2,d+.3,'cutstone');
 arch(g,0,d/2+.12,1.45,2.45);
 windows(g,w,h,d,h>=7);
}
function chimney(g,x,z,height=9,r=.62){
 cylinder(g,x,height/2,z,r*.74,r,height,'brick',12);
 cylinder(g,x,height+.18,z,r+.12,r+.12,.36,'cutstone',12);
 cylinder(g,x,height+.36,z,r*.49,r*.49,.07,'dark',12);
}
function sign(g,x,y,z,team=0){
 box(g,x,y,z,1.35,.9,.1,team?'ochre':'blue');
 pipe(g,[x-.8,y+.48,z],[x+.8,y+.48,z],.05,'iron');
}
function crates(g,x,z){
 for(let k=0;k<4;k++)box(g,x+(k%2)*.65,.35+Math.floor(k/2)*.75,z,.57,.7,.62,'wood');
}
function factory(g,type,team){
 const steel=type==='steelworks'||type==='smelter'||type==='bronze_foundry',
  mech=type==='engineworks'||type==='master_workshop'||type==='saw',
  powder=type==='powdermill'||type==='nitrate',bulk=steel||mech||powder||type==='printer';
 const h=bulk?5.3:4.4;
 walls(g,{w:7.6,d:5.8,h,industrial:true});
 // The serrated north-light roof reads as a factory, not an earlier age's hut.
 for(let i=0;i<3;i++){
  const x=-2.6+i*2.55;
  box(g,x,h+1.0,0,2.35,.14,6.1,'iron').rotation.z=-.38;
  box(g,x+1.05,h+.95,0,.19,1.5,6.1,'glass');
 }
 chimney(g,2.6,-2.1,steel?12:powder?10:8,.51);
 pipe(g,[3,h-1,-2.3],[3,h-1,2.0],.16,'iron');
 pipe(g,[3,h-1,2],[2.6,2.2,2],.16,'iron');
 const cylinderUnit=(x,z,rad=.8)=>{cylinder(g,x,1.2,z,rad,rad,2.1,'steel',12);
  cylinder(g,x,2.35,z,rad+.1,rad+.1,.2,'iron',12)};
 if(steel){
  cylinder(g,-2.5,3,-1.2,1.35,1.1,4.8,'iron',12);
  cone(g,-2.5,5.65,-1.2,1.3,1.8,'brick');
  for(const x of [-1.8,.0,1.8])box(g,x,.38,3.55,1.2,.65,.65,'iron');
 }else if(mech){
  cylinderUnit(-2,3.1,.85);
  const wheel=geom(g,new T.TorusGeometry(1.03,.14,6,14),'iron',1.6,1.6,3.2);
  wheel.rotation.x=Math.PI/2;
  for(let a=0;a<6;a++){
   const th=a*Math.PI/3;
   pipe(g,[1.6,1.6,3.2],[1.6+Math.cos(th)*.95,1.6+Math.sin(th)*.95,3.2],.075,'steel');
  }
 }else if(powder){
  cylinderUnit(-2.15,2.95,.72);cylinderUnit(-.45,3.05,.56);
  crates(g,2,3.3);
 }else{
  crates(g,-2.6,3.3);
  for(let i=0;i<3;i++)box(g,-2.5+i*1.8,.52,3.5,1.2,.86,.6,'wood');
 }
 sign(g,2.2,3.8,3.14,team);
}
function station(g,team){
 walls(g,{h:6.4,w:8,d:5.2});
 // Station signature: iron barrel canopy, platform and parallel rail pair.
 box(g,0,.3,4.0,8.3,.6,1.9,'stone');
 for(const x of [-2.9,2.9])for(const z of [3.45,4.55])
  pipe(g,[x,.5,z],[x,5,z],.13,'iron');
 for(let i=0;i<8;i++){
  const x=-3.4+i*.96;
  pipe(g,[x,4.8,3.4],[x,4.8,4.7],.07,'iron');
 }
 const canopy=geom(g,new T.CylinderGeometry(1.15,1.15,7.8,10,1,true,0,Math.PI),'slate',0,5.1,4);
 canopy.rotation.z=Math.PI/2;
 for(const z of [4.3,4.8])box(g,0,.22,z,7.7,.15,.1,'steel');
 for(let i=0;i<8;i++)box(g,-3.35+i*.96,.12,4.55,.25,.18,1.12,'timber');
 chimney(g,-2.9,-1.4,7,.29);
 sign(g,2.65,3.4,2.75,team);
}
function institution(g,type,team){
 const isHall=type==='hall',science=['polytechnic','university','academy','observatory','study'].includes(type);
 const isHospital=['infirmary','laboratory'].includes(type);
 const height=isHall||science?8.0:6.0;
 walls(g,{w:8,d:6,h:height});
 roof(g,height+.9,8.1,6.2);
 // Higher fenestration, clock/bell cupola, industrial civic confidence.
 if(isHall||type==='polytechnic'){
  box(g,0,height+3,-1.5,2.1,4,2.1,'cutstone');
  dome(g,0,height+5.1,-1.5,1.24,'copper');
  cylinder(g,0,height+4.45,-.42,.55,.55,.11,'plaster',12);
  pipe(g,[0,height+4.15,-.32],[0,height+4.65,-.32],.045,'dark');
  pipe(g,[0,height+4.45,-.32],[.28,height+4.45,-.32],.045,'dark');
 }else if(science){
  dome(g,-1.5,height+1.8,0,2.05,'copper');
  if(type==='observatory'){
   pipe(g,[-1.4,height+2.8,.3],[.1,height+4.2,.3],.3,'iron');
   cylinder(g,.1,height+4.2,.3,.55,.55,.38,'dark',12);
  }
 }
 if(isHospital){
  box(g,2.1,5.25,3.22,1.55,.3,.16,'ochre');
  box(g,2.1,5.25,3.27,.3,1.55,.16,'ochre');
 }
 if(type==='printer'){box(g,2,.8,3.7,2.5,.5,1.2,'iron');}
 sign(g,3.0,4.6,3.2,team);
}
function residential(g,type,team){
 const home=type==='house',isInn=type==='inn',low=type==='cellar'||type==='well';
 const h=low?3.15:home?6.2:5.5;
 walls(g,{w:low?6.5:7.6,d:low?5.6:5.8,h});
 roof(g,h+.9,low?6.6:7.7,low?5.7:5.9);
 if(home||isInn){
  for(const x of [-2.9,2.8])chimney(g,x,-1.9,h+3,.28);
  if(isInn)sign(g,2.8,3.9,3.05,team);
  if(home)for(const x of [-2.3,2.3])box(g,x,1.0,3.15,1.0,1.1,.55,'stone');
 }
 if(type==='market'||type==='trade_yard'){
  for(const x of [-2.3,2.3]){
   box(g,x,2.3,3.65,2.3,.12,1.4,'wood');
   box(g,x,3.15,3.65,2.5,.22,1.7,team?'ochre':'blue').rotation.z=x>0?-.19:.19;
  }
 }
 if(type==='warehouse'){crates(g,-2.6,3.5);crates(g,1.5,3.5);}
}
function waterPowered(g,type){
 walls(g,{w:6.8,d:5.5,h:4.8,industrial:true});
 roof(g,5.7,7,5.7);
 const w=geom(g,new T.TorusGeometry(1.52,.22,8,16),'iron',3.6,2.25,0);w.rotation.y=Math.PI/2;
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4;
  pipe(g,[3.6,2.25,0],[3.6,2.25+Math.cos(a)*1.4,Math.sin(a)*1.4],.1,'wood');
 }
 if(type==='windmill'){
  pipe(g,[0,5.8,3.25],[0,5.8,4.0],.16,'iron');
  for(let i=0;i<4;i++)box(g,Math.sin(i*Math.PI/2)*1.7,5.8+Math.cos(i*Math.PI/2)*1.7,4,1.15,3.0,.12,'plaster').rotation.z=-i*Math.PI/2;
 }
}
function utility(g,type,team){
 if(type==='railstation'){station(g,team);return}
 if(type==='steelworks'||type==='engineworks'||type==='smelter'||
    type==='bronze_foundry'||type==='powdermill'||type==='nitrate'||type==='saw'||
    type==='master_workshop'||type==='printer'||type==='armor_workshop'||
    type==='siegeworkshop'||type==='smith'||type==='bakery'||type==='pottery_kiln'){
  factory(g,type,team);return
 }
 if(['hall','polytechnic','university','academy','observatory','study','infirmary',
  'laboratory','scriptorium','chapel','monastery','guildhall'].includes(type)){
  institution(g,type,team);return
 }
 if(type==='watermill'||type==='windmill'||type==='mill'){waterPowered(g,type);return}
 if(['house','cellar','market','warehouse','inn','trade_yard'].includes(type)){
  residential(g,type,team);return
 }
 if(type==='harbor'){
  residential(g,'warehouse',team);
  box(g,0,.45,4,8,.65,1.8,'wood');
  for(const x of [-3.4,3.4])pipe(g,[x,0,4.3],[x,2.1,4.3],.17,'iron');return
 }
 if(type==='bridge'){
  box(g,0,.55,0,8.6,.68,4.1,'stone');
  for(const z of [-1.7,1.7]){
   box(g,0,1.35,z,8.6,.28,.22,'iron');
   for(const x of [-3,-1,1,3])pipe(g,[x,.7,z],[x,1.45,z],.085,'iron');
  }
  return;
 }
 if(['mine','coal','coppermine','tinmine','quarry'].includes(type)){
  walls(g,{w:6.5,d:5.0,h:4.3,industrial:true});
  box(g,0,4.7,-2.1,6.1,.4,.7,'iron');
  for(const x of [-2,0,2])pipe(g,[x,5,-2.1],[x,8,-2.1],.1,'iron');
  pipe(g,[-2.5,8,-2.1],[2.5,8,-2.1],.13,'iron');
  geom(g,new T.TorusGeometry(.85,.13,6,12),'iron',0,7.25,-2.0);
  crates(g,1.7,3.1);return
 }
 // All remaining old craft and farm buildings receive a more industrial style
 // with brick masonry, slate roofing, window bands and meaningful work props.
 walls(g,{w:7.2,d:5.5,h:5.1,industrial:['barracks','stable','road_depot'].includes(type)});
 roof(g,6.0,7.3,5.7);
 if(['fisher','farm','hunter','forester','lumber','pasture'].includes(type)){
  for(let i=0;i<4;i++)box(g,-2.5+i*1.6,.45,3.6,.9,.7,.7,i%2?'wood':'foliage');
 }
 if(['road_depot','cartwright','stable'].includes(type)){
  const wheel=geom(g,new T.TorusGeometry(.76,.15,6,12),'iron',2.2,1.0,3.4);wheel.rotation.y=Math.PI/2;
  crates(g,-2.3,3.4);
 }
 if(['barracks','archery','crossbow_range'].includes(type))sign(g,2.8,4.2,2.9,team);
 if(type==='well')cylinder(g,-2.0,.8,3.25,.9,.9,1.1,'stone',12);
}
function bake(g){
 g.updateMatrixWorld(true);const buckets=new Map();
 g.traverse(o=>{if(!o.isMesh)return;
  const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
  geo.applyMatrix4(o.matrixWorld);
  const key=o.material.uuid;
  if(!buckets.has(key))buckets.set(key,{material:o.material,geometries:[]});
  buckets.get(key).geometries.push(geo);
 });
 const output=[];let triangles=0;
 for(const {material,geometries} of buckets.values()){
  const n=geometries.reduce((t,geo)=>t+geo.attributes.position.count,0);
  const positions=new Float32Array(n*3),normals=new Float32Array(n*3),uvs=new Float32Array(n*2);
  let offset=0;
  for(const geo of geometries){
   const len=geo.attributes.position.count;
   positions.set(geo.attributes.position.array,offset*3);
   normals.set(geo.attributes.normal.array,offset*3);
   if(geo.attributes.uv)uvs.set(geo.attributes.uv.array,offset*2);
   offset+=len;geo.dispose();
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.BufferAttribute(positions,3));
  geo.setAttribute('normal',new T.BufferAttribute(normals,3));
  geo.setAttribute('uv',new T.BufferAttribute(uvs,2));
  geo.computeBoundingSphere();geo.userData.shared=true;
  triangles+=n/3;output.push({geometry:geo,material});
 }
 g.traverse(o=>{if(o.isMesh)o.geometry.dispose()});
 return {output,triangles};
}
export function createIndustrialBuilding(type,team=0){
 if(!supported.has(type))return null;
 const key=type+':'+(team===0?0:1);
 if(!kits.has(key)){
  const working=new T.Group();utility(working,type,team);kits.set(key,bake(working));
 }
 const spec=kits.get(key),root=new T.Group();
 root.name='V82 tööstusajastu '+type;
 root.userData.industrialAgeModel=true;root.userData.buildingType=type;
 root.userData.age=5;root.userData.triangles=spec.triangles;
 for(const {geometry,material} of spec.output){
  const mesh=new T.Mesh(geometry,material);
  mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
 }
 return root;
}
