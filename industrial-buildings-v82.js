// V82 industrial era architecture. Distinct factories, stations, workshops,
// mills, houses and public services. All repeated instances share geometry.
import * as T from './vendor/three.module.js';
export const INDUSTRIAL_BUILDING_TYPES=Object.freeze([
 'hall','house','warehouse','cellar','market','study','scriptorium','academy','university',
 'observatory','printer','inn','guildhall','chapel','monastery','keep','gatehouse',
 'watermill','windmill','infirmary','trade_yard','lumber','forester','saw','mill',
 'bakery','quarry','mason','cartwright','hunter','fisher','farm','well','barracks',
 'stable','smith','smelter','archery','armor_workshop','crossbow_range',
 'master_workshop','siegeworkshop','road_depot','harbor','nitrate','powdermill',
 'mine','coal','coppermine','tinmine','bronze_foundry','steelworks','engineworks',
 'polytechnic','railstation','bridge','claypit','pottery_kiln','pasture',
 'oilwell','refinery','powerplant','autofactory','laboratory','airfield'
]);
const known=new Set(INDUSTRIAL_BUILDING_TYPES),templates=new Map(),materials=new Map(),textures=new Map();
const color={
 brick:'#a65e4c',darkbrick:'#774239',lightbrick:'#c78969',sand:'#c8ad88',
 stone:'#a4a49c',slate:'#686e70',iron:'#515b64',steel:'#809099',
 glass:'#82b4bb',window:'#668e9b',copper:'#9a8d6c',wood:'#705640',
 cream:'#ddd2b4',roof:'#656c70',rust:'#95583d',gold:'#b99b66',
 coal:'#3e4547',grass:'#7e8e65',red:'#b76558',blue:'#5b8399',canvas:'#b8a184'
};
function texture(kind){
 if(textures.has(kind))return textures.get(kind);
 const data=new Uint8Array(64*64*4);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){
  const noise=Math.sin(x*127.1+y*311.8)*43758.5453;
  const grain=(noise-Math.floor(noise)-.5)*28;
  let v=224+grain;
  if(kind==='brick'&&(y%11<2||(x+(Math.floor(y/11)%2)*12)%23<2))v=141+grain*.5;
  if(kind==='metal'&&((x+y)%25<2))v-=35;
  if(kind==='roof'&&(y%8===0||(x+(y>>3)*5)%15===0))v-=41;
  if(kind==='wood'&&(x%13===0))v-=52;
  const i=(y*64+x)*4,p=Math.round(Math.max(0,Math.min(255,v)));
  data[i]=p;data[i+1]=p;data[i+2]=p;data[i+3]=255;
 }
 const map=new T.DataTexture(data,64,64,T.RGBAFormat);
 map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;
 map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;
 map.generateMipmaps=true;map.needsUpdate=true;textures.set(kind,map);return map;
}
function mat(k){
 if(materials.has(k))return materials.get(k);
 const style=['brick','darkbrick','lightbrick'].includes(k)?'brick':['iron','steel','rust','slate'].includes(k)?'metal':['roof','sand'].includes(k)?'roof':k==='wood'?'wood':null;
 const m=new T.MeshStandardMaterial({color:color[k],map:style?texture(style):null,
  metalness:k==='steel'?.36:k==='iron'?.24:k==='glass'?.18:0,
  roughness:k==='glass'?.34:k==='steel'?.62:.87});
 materials.set(k,m);return m;
}
function mesh(g,geo,k,x=0,y=0,z=0){
 const m=new T.Mesh(geo,mat(k));m.position.set(x,y,z);
 m.castShadow=m.receiveShadow=true;g.add(m);return m;
}
const box=(g,x,y,z,w,h,d,k='brick')=>mesh(g,new T.BoxGeometry(w,h,d),k,x,y,z);
const cyl=(g,x,y,z,rt,rb,h,k='stone',seg=12)=>mesh(g,new T.CylinderGeometry(rt,rb,h,seg),k,x,y,z);
const cone=(g,x,y,z,rt,h,k='slate',seg=12)=>mesh(g,new T.ConeGeometry(rt,h,seg),k,x,y,z);
function pole(g,a,b,r=.11,k='steel',segments=7){
 const delta=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
 const m=mesh(g,new T.CylinderGeometry(r,r,delta.length(),segments),k,
 (a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);
 m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;
}
function windows(g,{w=7.2,d=5.7,h=5.6,y=1.1,rows=2,cols=3}={}){
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const xx=(col-(cols-1)/2)*(w-.65)/cols,yy=y+1.6+row*(h-1.65)/rows;
  for(const z of [-d/2-.035,d/2+.035]){
   box(g,xx,yy,z,.77,1.22,.09,'window');
   box(g,xx,yy,z+(z<0?-.08:.08),.085,1.22,.08,'steel');
   box(g,xx,yy,z+(z<0?-.085:.085),.86,.07,.09,'cream');
  }
 }
}
function pilasters(g,w=7.2,d=5.8,h=6){
 for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])
  box(g,x,h/2+.3,z,.42,h+.5,.4,'stone');
 box(g,0,h+.25,0,w+.52,.42,d+.52,'sand');
 box(g,0,.28,0,w+.5,.56,d+.5,'stone');
}
function industrialHouse(g,{w=7,d=5.6,h=5.2,style='brick',roof='roof',floors=2,flag=0}={}){
 box(g,0,h/2+.48,0,w,h,d,style);
 pilasters(g,w,d,h);
 box(g,0,h+.92,0,w+.8,1.35,d+.8,roof);
 for(let f=0;f<floors;f++)for(let i=-1;i<=1;i++){
  const x=i*w*.27,y=1.85+f*(h-1.7)/floors;
  box(g,x,y,d/2+.085,.85,1.15,.12,'glass');
  box(g,x,y,d/2+.155,.075,1.22,.12,'iron');
  box(g,x,y+.59,d/2+.15,.95,.10,.12,'cream');
 }
 box(g,0,1.56,d/2+.13,1.25,2.35,.17,'wood');
 for(let f=0;f<floors;f++)for(const x of [-w/2-.07,w/2+.07])
  box(g,x,1.8+f*(h-1.7)/floors,0,.14,1.2,d-.5,flag?'steel':'stone');
}
function chimney(g,x,z,height=7.8,diameter=1.15){
 const b=cyl(g,x,height/2,z,diameter*.42,diameter*.54,height,'darkbrick',12);
 cyl(g,x,height+.05,z,diameter*.6,diameter*.6,.35,'sand');
 for(let y=1.4;y<height;y+=1.65)cyl(g,x,y,z,diameter*.54,diameter*.54,.17,'brick');
 return b;
}
function gears(g,x,y,z,r=1,k='steel'){
 const ring=mesh(g,new T.TorusGeometry(r,.17,6,16),k,x,y,z);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4;
  const m=box(g,x+Math.cos(a)*r,y+Math.sin(a)*r,z,.35,.45,.37,k);
  m.rotation.z=a;
 }
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2,p=pole(g,[x,y,z],[x+Math.cos(a)*r,y+Math.sin(a)*r,z],.11,k);
 }
 cyl(g,x,y,z,.34,.34,.42,'iron');ring.rotation.x=0;
}
function tanks(g,x,z,n=2){
 for(let i=0;i<n;i++){
  const xx=x+i*1.7;
  cyl(g,xx,1.55,z,.65,.78,2.75,'steel',12);
  cone(g,xx,3.25,z,.65,.72,'slate',12);
  pole(g,[xx,3.2,z],[xx,4.15,z],.07,'iron');
 }
}
function crates(g,x,z,n=4){
 for(let i=0;i<n;i++)box(g,x+i%3*.72,.42+Math.floor(i/3)*.79,z,.7,.77,.72,'wood');
}
function lantern(g,x,y,z){
 pole(g,[x,y-.65,z],[x,y+.25,z],.08,'iron');
 box(g,x,y,z,.34,.55,.36,'glass');
 cone(g,x,y+.45,z,.36,.4,'iron',6);
}
function truss(g,x,z,d=5){
 for(const xx of [-1,1])for(const zz of [-1,1])
  pole(g,[x+xx*1.4,0,z+zz*d/2],[x+xx*1.4,5.3,z+zz*d/2],.15,'steel');
 for(const xx of [-1,1]){
  pole(g,[x+xx*1.4,4.2,z-d/2],[x+xx*1.4,4.2,z+d/2],.15,'steel');
  for(let i=0;i<4;i++){
   const z0=z-d/2+i*d/4;
   pole(g,[x+xx*1.4,0,z0],[x+xx*1.4,4.2,z0+d/4],.06,'iron');
  }
 }
}
function station(g){
 industrialHouse(g,{w:8.3,d:6.5,h:6.2,style:'sand'});
 // Steel-and-glass train platform and roof.
 for(const z of [-3.4,-2.5]){box(g,0,.18,z,10.2,.18,.18,'steel');}
 for(const x of [-4.2,4.2])for(const z of [4,6.8])
  pole(g,[x,0,z],[x,4.7,z],.13,'steel');
 box(g,0,4.76,5.4,9.5,.25,3.4,'glass');
 for(let x=-4;x<=4;x+=1.6)pole(g,[x,4.8,3.9],[x,4.8,6.9],.09,'iron');
 cyl(g,0,7.2,0,.75,.75,.3,'gold');
}
function factory(g,type){
 const coreH=type==='steelworks'?7.3:type==='engineworks'?6.6:5.5;
 industrialHouse(g,{w:7.3,d:5.7,h:coreH,style:type==='steelworks'?'darkbrick':'brick',floors:2});
 chimney(g,2.55,-2,9.8,type==='steelworks'?1.25:.98);
 if(type==='steelworks'){
  chimney(g,-2.45,-1.9,7.9,.85);
  for(let i=0;i<3;i++)cyl(g,-3+i*2.2,.75,5.3,.72,1.1,1.45,'rust');
  pole(g,[-2.5,6.6,4.6],[3,6.6,4.6],.16);
 }else if(type==='engineworks'){
  gears(g,0,3,3.35,.8);
  crates(g,-3.1,4.5,6);
  for(const x of [-2,2])cyl(g,x,.72,6.4,.85,.85,.5,'iron');
 }else if(type==='powdermill'||type==='nitrate'){
  tanks(g,-2.5,4.5,3);
  box(g,2.4,1.3,4.2,2.8,2.6,1.3,'steel');
 }else if(type==='printer'){
  box(g,0,1.1,4.7,4.8,.45,1.45,'wood');
  for(let i=0;i<3;i++)box(g,-1.7+i*1.65,1.65,4.7,.8,.72,.55,'iron');
  crates(g,2.3,5.5,3);
 }else if(type==='smelter'||type==='bronze_foundry'||type==='smith'){
  cyl(g,-2.1,1.8,4.3,1.4,1.6,2.9,'stone');
  cone(g,-2.1,3.65,4.3,1.5,.8,'rust');
  box(g,1.6,1,4.65,2.3,.5,1.15,'iron');
 }else{
  tanks(g,2.5,4.7);
  crates(g,-3.3,4.7,3);
 }
}
function civic(g,type){
 const h=type==='hall'||type==='university'||type==='polytechnic'?8.1:6.0;
 industrialHouse(g,{w:8.4,d:6.8,h,style:'sand',roof:'slate',floors:3});
 for(let i=0;i<5;i++){
  const x=-3+i*1.5;
  pole(g,[x,1.1,3.55],[x,4.5,3.55],.18,'cream');
  box(g,x,4.5,3.55,.5,.33,.54,'sand');
 }
 if(type==='hall'){
  box(g,0,h+2,0,2.4,3.1,2.2,'stone');
  cyl(g,0,h+3.8,0,.95,.95,.14,'gold');
  cone(g,0,h+5,0,1.25,2.35,'slate');
 }else if(type==='observatory'){
  cyl(g,1.6,h+1,-1.8,2.0,2.0,1.6,'stone');
  mesh(g,new T.SphereGeometry(1.9,16,10,0,Math.PI*2,0,Math.PI/2),'copper',1.6,h+1.6,-1.8);
  const telescope=pole(g,[1.6,h+3,-1.8],[3.4,h+4.4,-1.8],.36,'iron');
 }else if(type==='polytechnic'||type==='university'){
  cone(g,0,h+1.45,0,3.2,2.2,'copper',16);
  for(const x of [-2.7,2.7])cyl(g,x,1,5.0,.52,.52,1.2,'stone');
 }else if(type==='chapel'||type==='monastery'){
  box(g,1.7,h+1,0,2.0,3.2,2.1,'stone');
  cone(g,1.7,h+3.1,0,1.2,1.2,'slate');
 }else if(type==='inn'||type==='guildhall'){
  box(g,2.5,4.2,3.6,1.6,.75,.16,type==='inn'?'red':'blue');
 }
}
function housing(g,type){
 if(type==='house'){
  industrialHouse(g,{w:6.4,d:5.1,h:7.0,style:'lightbrick',floors:3});
  chimney(g,2.5,-1.9,8.5,.55);
  for(const x of [-2.4,2.4])pole(g,[x,0,3.1],[x,4.6,3.1],.08,'iron');
 }else if(type==='warehouse'||type==='cellar'){
  industrialHouse(g,{w:8.2,d:6.4,h:type==='warehouse'?5.5:3.3,style:'brick',floors:1});
  for(const x of [-2.4,0,2.4])box(g,x,1.85,3.38,1.8,2.65,.23,'iron');
  crates(g,-3.3,4.6,8);
 }else if(type==='market'||type==='trade_yard'){
  industrialHouse(g,{w:7.3,d:6,h:4.4,style:'sand',floors:1});
  for(const x of [-3.2,3.2]){
   for(const z of [3,5.5])pole(g,[x,0,z],[x,3.7,z],.13,'steel');
   box(g,x,3.8,4.3,3.2,.19,2.8,x>0?'red':'blue');
   box(g,x,1.2,4.2,2.3,.18,1.1,'wood');
  }
 }else if(type==='well'){
  cyl(g,0,.75,0,1.25,1.5,1.45,'stone');
  pole(g,[-1.45,0,0],[-1.45,3.2,0],.14,'iron');
  pole(g,[1.45,0,0],[1.45,3.2,0],.14,'iron');
  pole(g,[-1.45,3.15,0],[1.45,3.15,0],.15,'iron');
  mesh(g,new T.TorusGeometry(1.35,.12,6,16),'steel',0,1.45,0).rotation.x=Math.PI/2;
 }else{
  industrialHouse(g,{w:7,d:5.6,h:5.4,style:'brick'});
  for(const z of [4.1,5.5])box(g,0,.22,z,6.3,.21,.9,'stone');
 }
}
function craft(g,type){
 if(['steelworks','engineworks','powdermill','nitrate','printer','smelter',
 'bronze_foundry','smith','pottery_kiln','bakery','saw','mill','mine',
 'coal','coppermine','tinmine','quarry','mason','master_workshop',
 'armor_workshop','siegeworkshop','autofactory','refinery','powerplant'].includes(type)){
  factory(g,type);
  if(type==='saw')for(let i=0;i<3;i++)pole(g,[-3+i*1.4,.4,5.7],[0+i*1.4,.4,5.7],.22,'wood');
  if(type==='coal')for(let i=0;i<4;i++)mesh(g,new T.DodecahedronGeometry(.46,0),'coal',-2.8+i*1.3,.4,5.6);
 }else if(['hall','university','polytechnic','academy','study','observatory','chapel',
 'monastery','guildhall','inn','infirmary','scriptorium','laboratory'].includes(type)){
  civic(g,type);
  if(type==='infirmary'){box(g,0,6.2,3.56,.45,1.7,.18,'red');box(g,0,6.2,3.58,1.65,.45,.18,'red');}
 }else if(type==='railstation'){
  station(g);
 }else if(['house','warehouse','cellar','market','trade_yard','well','farm','hunter',
 'fisher','lumber','forester','stable','pasture','road_depot','harbor',
 'barracks','archery','cartwright','claypit'].includes(type)){
  housing(g,type);
  if(type==='stable'||type==='cartwright'){for(const x of [-2.5,2.5])
   mesh(g,new T.TorusGeometry(.8,.17,6,14),'wood',x,.95,5.6).rotation.y=Math.PI/2;}
  if(type==='harbor')for(const x of [-3,3])for(const z of [5,7])pole(g,[x,0,z],[x,3,z],.21,'wood');
 }else if(['watermill','windmill'].includes(type)){
  industrialHouse(g,{w:6.4,d:5.3,h:6.2});
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4;
   pole(g,[0,4,3],[Math.cos(a)*2.5,4+Math.sin(a)*2.5,3],.15,'wood');
  }
 }else if(['keep','gatehouse','watchtower','stonetower','stonewall','palisade','reinforced_wall'].includes(type)){
  industrialHouse(g,{w:6.8,d:5.5,h:7.4,style:'stone'});
  for(let x=-2.6;x<=2.7;x+=1.3)box(g,x,8.6,0,.85,1.0,5.5,'iron');
 }else if(type==='bridge'){
  box(g,0,1,0,8.5,.8,5.0,'stone');
  for(const z of [-2.35,2.35]){
   for(const x of [-3.7,-2.2,-.7,.8,2.3,3.8]){
    pole(g,[x,1.38,z],[x,2.6,z],.12,'iron');
    cyl(g,x,2.61,z,.16,.16,.11,'gold',8);
   }
   pole(g,[-4,2.48,z],[4,2.48,z],.14,'steel');
   pole(g,[-4,1.72,z],[4,1.72,z],.1,'steel');
  }
  for(let x=-3.6;x<=3.7;x+=.85)
   box(g,x,1.46,0,.21,.08,4.6,'sand');
 }else{
  industrialHouse(g);
 }
}
function bake(root){
 root.updateMatrixWorld(true);const groups=new Map();
 root.traverse(o=>{if(!o.isMesh)return;
  const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
  geo.applyMatrix4(o.matrixWorld);const k=o.material.uuid;
  if(!groups.has(k))groups.set(k,{material:o.material,shapes:[]});
  groups.get(k).shapes.push(geo);
 });
 const output=[];let triangles=0;
 for(const {material,shapes} of groups.values()){
  const count=shapes.reduce((n,g)=>n+g.attributes.position.count,0),
   p=new Float32Array(count*3),n=new Float32Array(count*3),uv=new Float32Array(count*2);
  let at=0;
  for(const g of shapes){
   const c=g.attributes.position.count;p.set(g.attributes.position.array,at*3);
   n.set(g.attributes.normal.array,at*3);
   if(g.attributes.uv)uv.set(g.attributes.uv.array,at*2);
   at+=c;g.dispose();
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.BufferAttribute(p,3));
  geometry.setAttribute('normal',new T.BufferAttribute(n,3));
  geometry.setAttribute('uv',new T.BufferAttribute(uv,2));
  geometry.computeBoundingSphere();geometry.userData.shared=true;
  output.push({geometry,material});triangles+=count/3;
 }
 root.traverse(o=>{if(o.isMesh)o.geometry.dispose()});
 return {output,triangles};
}
export function createIndustrialBuilding(type,team=0){
 if(!known.has(type))return null;
 const key=type+':'+(team===0?0:1);
 if(!templates.has(key)){
  const group=new T.Group();craft(group,type);templates.set(key,bake(group));
 }
 const spec=templates.get(key),result=new T.Group();
 result.name='V82 tööstusajastu '+type;
 Object.assign(result.userData,{industrialAgeModel:true,buildingType:type,age:5,triangles:spec.triangles});
 for(const {geometry,material} of spec.output){
  const m=new T.Mesh(geometry,material);m.castShadow=m.receiveShadow=true;result.add(m);
 }
 return result;
}
