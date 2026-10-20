// V81 - Renaissance architecture: distinct artisan, civic, housing, military
// and scientific silhouettes. Shared material/geometry batches (mobile-friendly).
// Procedural painted plaster, brick, slate and terracotta textures: no GLB loads.
import * as T from './vendor/three.module.js';

export const RENAISSANCE_BUILDING_TYPES=Object.freeze([
 'hall','house','warehouse','cellar','market','study','scriptorium','academy',
 'university','observatory','printer','inn','guildhall','chapel','monastery',
 'keep','gatehouse','watermill','windmill','infirmary','trade_yard',
 'lumber','forester','saw','mill','bakery','quarry','mason','cartwright',
 'hunter','fisher','farm','well','barracks','stable','smith','smelter',
 'archery','armor_workshop','crossbow_range','master_workshop','siegeworkshop',
 'road_depot','harbor','nitrate','powdermill','mine','coal','coppermine',
 'tinmine','bronze_foundry'
]);
const supported=new Set(RENAISSANCE_BUILDING_TYPES);
const geomCache=new Map(),materialCache=new Map(),textureCache=new Map();
const COLORS={
 plaster:'#ddd1b8',warm:'#e2c9a7',cream:'#eadbbf',brick:'#b47762',
 stone:'#999990',cutstone:'#c2b8a6',slate:'#6e7379',roof:'#b36c55',
 trim:'#f0dfbc',wood:'#77533b',beam:'#4c392e',copper:'#75866e',
 gold:'#d8b16a',iron:'#55595c',black:'#292a30',window:'#6a97a4',
 azure:'#516b83',cloth:'#a46d60',canvas:'#e0bf82',green:'#759368',
 earth:'#8b7358',red:'#a54846',water:'#5e9fa9',paper:'#f1e4b9',
 blue:'#587aa5',straw:'#c7a671',chalk:'#c8c5b7'
};
function texture(style){
 if(textureCache.has(style))return textureCache.get(style);
 const n=64,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const noise=Math.sin((x+1)*127.1+(y+1)*311.8)*43758.5453;
  const grain=noise-Math.floor(noise)-.5;let v=222+grain*24;
  if(style==='brick'){
   const shift=(Math.floor(y/10)%2)*11;
   if(y%10===0||(x+shift)%22===0)v=145+grain*6;else v-=Math.sin(x*.3+y*.09)*7;
  }
  if(style==='terracotta'){if(y%9<1||(x+Math.floor(y/9)*7)%15<1)v-=51;v+=Math.sin(x*.17)*10;}
  if(style==='plaster'){v+=Math.sin(x*.25+y*.35)*4;}
  if(style==='timber'){v+=(Math.sin(y*.66)*8)-(x%15===0?50:0);}
  if(style==='stone'){if((y%18<1)||(x+Math.floor(y/18)*8)%24<2)v-=52;}
  if(style==='slate'){if(y%9<1||(x+Math.floor(y/9)*5)%16<1)v-=44;}
  const k=4*(y*n+x),p=Math.max(16,Math.min(255,Math.round(v)));
  data[k]=p;data[k+1]=p;data[k+2]=p;data[k+3]=255;
 }
 const t=new T.DataTexture(data,n,n,T.RGBAFormat);
 t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;
 t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;
 t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;textureCache.set(style,t);return t;
}
function mat(k){
 if(materialCache.has(k))return materialCache.get(k);
 const style=({plaster:'plaster',warm:'plaster',cream:'plaster',brick:'brick',
  stone:'stone',cutstone:'stone',trim:'stone',roof:'terracotta',slate:'slate',
  wood:'timber',beam:'timber',canvas:'plaster'}[k]);
 const m=new T.MeshStandardMaterial({color:COLORS[k]||k,map:style?texture(style):null,
  roughness:k==='window'?.34:k==='gold'?.42:.86,metalness:k==='iron'?.48:k==='copper'?.35:k==='gold'?.4:0,
  flatShading:false});
 materialCache.set(k,m);return m;
}
function piece(g,geometry,key,x=0,y=0,z=0){
 const m=new T.Mesh(geometry,mat(key));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;
}
function block(g,x,y,z,w,h,d,c='plaster'){
 return piece(g,new T.BoxGeometry(w,h,d),c,x,y,z);
}
function cylinder(g,x,y,z,rt,rb,h,c='stone',sides=10){
 return piece(g,new T.CylinderGeometry(rt,rb,h,sides),c,x,y,z);
}
function sphere(g,x,y,z,r,c='stone',rings=10,segments=6){
 return piece(g,new T.SphereGeometry(r,rings,segments),c,x,y,z);
}
function pole(g,a,b,r=.10,c='beam'){
 const dir=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
 const m=piece(g,new T.CylinderGeometry(r,r,dir.length(),7),c,
  (a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);
 m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());return m;
}
function arc(g,x,y,z,r=.8,c='cutstone'){
 return piece(g,new T.TorusGeometry(r,.14,5,12,Math.PI),c,x,y,z);
}
function pennant(g,x,z,y=7,team=0){
 pole(g,[x,0,z],[x,y+1.1,z],.09,'beam');
 block(g,x+.5,y-.25,z,1.0,.7,.07,team?'cloth':'azure');
 piece(g,new T.ConeGeometry(.16,.4,7),'gold',x,y+1.3,z);
}
function chimney(g,x,z,y=5.5){
 block(g,x,y+1.0,z,.82,2.0,.75,'brick');
 block(g,x,y+2.05,z,1.13,.3,1.07,'cutstone');
 block(g,x,y+2.19,z,.54,.08,.44,'black');
}
function planter(g,x,z,y=.35){
 block(g,x,y,z,.9,.48,.5,'stone');
 for(let i=0;i<3;i++){
  sphere(g,x+(i-1)*.24,y+.44,z,.21,i===1?'green':'cloth',7,5);
 }
}
function crates(g,x,z,num=3){
 for(let i=0;i<num;i++){
  const dx=(i%3)*.65,dy=Math.floor(i/3)*.68;
  block(g,x+dx,.35+dy,z,.62,.62,.6,'wood');
  block(g,x+dx,.7+dy,z,.67,.1,.63,'beam');
 }
}
function barrel(g,x,z){
 cylinder(g,x,.55,z,.39,.43,1.10,'wood',10);
 for(const y of [.25,.83])cylinder(g,x,y,z,.43,.43,.07,'iron',10);
}
function laneCanopy(g,x,z,w=2.3,d=1.5,height=3,c='cloth'){
 for(const dx of [-w/2,w/2])for(const dz of [-d/2,d/2])
  pole(g,[x+dx,0,z+dz],[x+dx,height,z+dz],.11,'wood');
 const top=block(g,x,height,z,w+.25,.17,d+.25,c);
 top.rotation.z=.14;
}
function roof(g,x,y,z,w,d,rise=1.8,c='roof'){
 const half=w/2,slope=Math.hypot(half,rise);
 for(const side of [-1,1]){
  const m=block(g,x+side*w/4,y+rise/2,z,slope,.18,d+.35,c);
  m.rotation.z=-side*Math.atan2(rise,half);
 }
 pole(g,[x,y+rise,z-d/2],[x,y+rise,z+d/2],.09,'cutstone');
 for(const zz of [-d/2+.15,d/2-.15]){
  pole(g,[x-half,y,zz],[x,y+rise,zz],.07,'beam');
  pole(g,[x+half,y,zz],[x,y+rise,zz],.07,'beam');
 }
}
function hip(g,x,y,z,w,d,rise=1.45){
 // Roof tiles and broad eaves make the main silhouettes readable from above.
 roof(g,x,y,z,w,d,rise,'roof');
 for(const zz of [-d/2-.15,d/2+.15])block(g,x,y+.1,zz,w,.23,.3,'cutstone');
}
function windowAt(g,x,y,z,variant='normal'){
 const width=variant==='large'?1.0:.68,height=variant==='large'?1.5:1.1;
 block(g,x,y,z,width+.26,height+.28,.16,'cutstone');
 block(g,x,y,z+.095,width,height,.09,'window');
 block(g,x,y,z+.17,.075,height,.08,'beam');
 block(g,x,y,z+.18,width,.075,.08,'beam');
 if(variant==='shutter'){
  block(g,x-width*.65,y,z+.17,.23,height,.11,'azure');
  block(g,x+width*.65,y,z+.17,.23,height,.11,'azure');
 }
 if(variant==='large'){
  block(g,x,y+height*.62,z+.13,width+.46,.2,.25,'trim');
  block(g,x,y-height*.62,z+.22,width+.46,.16,.3,'cutstone');
 }
}
function archDoor(g,x,z,y=0,width=1.12){
 block(g,x,1.18+y,z,width*1.5,2.35,.13,'cutstone');
 block(g,x,1.18+y,z+.09,width*1.1,2.05,.09,'black');
 for(const xx of [-width*.68,width*.68])
  cylinder(g,x+xx,1.2+y,z+.18,.13,.13,2.3,'stone',8);
 arc(g,x,2.2+y,z+.2,width*.64,'cutstone');
}
function columns(g,x,z,w=6.4,y=3.4,n=4){
 for(let i=0;i<n;i++){
  const xx=x-w/2+(w*i/(n-1));
  cylinder(g,xx,y/2,z,.15,.20,y,'cutstone',10);
  cylinder(g,xx,.18,z,.32,.33,.36,'stone',10);
  cylinder(g,xx,y-.08,z,.29,.29,.26,'trim',10);
 }
 block(g,x,y+.2,z,w+.8,.37,.65,'cutstone');
}
function baseHouse(g,{x=0,z=0,w=6.8,d=5.3,floors=2,top=2.2,
 roofType='hip',wall='plaster',windows=true,chim=true,timber=false}={}){
 const height=1.0+floors*2.15;
 block(g,x,.34,z,w+.55,.68,d+.55,'stone');
 block(g,x,.84+floors*1.075,z,w,floors*2.15+.25,d,wall);
 block(g,x,height,z,w+.35,.24,d+.3,'cutstone');
 block(g,x,.68,z+d/2+.14,w+.25,.19,.34,'cutstone');
 for(const xx of [x-w/2+.14,x+w/2-.14]){
  block(g,xx,height/2+.35,z,.36,height-.45,.37,'cutstone');
 }
 if(timber){
  for(const xx of [x-w/2+.2,x+w/2-.2])block(g,xx,height/2,z+d/2+.17,.28,height-.2,.18,'beam');
  for(let floor=0;floor<floors;floor++)
   block(g,x,2+2.15*floor,z+d/2+.14,w,.19,.13,'beam');
 }
 if(windows){
  for(let level=0;level<floors;level++)for(const xx of [x-w*.28,x+w*.28]){
   if(level===0&&Math.abs(xx-x)<.6)continue;
   windowAt(g,xx,2+level*2.15,z+d/2+.125,level?'large':'shutter');
  }
  for(const xx of [x-w/2+.14,x+w/2-.14])
   for(let i=0;i<2;i++)block(g,xx,2.1+i*2.15,z-.8,.1,1.1,.8,'window');
 }
 archDoor(g,x,z+d/2+.23);
 if(roofType==='hip')hip(g,x,height+.06,z,w+1.0,d+.9,top);
 else if(roofType==='gable')roof(g,x,height+.06,z,w+1,d+.9,top,'roof');
 else if(roofType==='flat'){
  block(g,x,height+.12,z,w+.9,.32,d+.9,'cutstone');
  for(const zz of [-d/2,d/2])block(g,x,height+.45,zz,w+.55,.7,.18,'trim');
 }
 if(chim)chimney(g,x+w*.29,z-d*.23,height+top*.2);
 return {height,w,d};
}
function dome(g,x,z,baseY,r=2.1){
 cylinder(g,x,baseY+.3,z,r,r+.15,.65,'cutstone',14);
 piece(g,new T.SphereGeometry(r,18,9,0,Math.PI*2,0,Math.PI/2),'copper',x,baseY+.63,z);
 cylinder(g,x,baseY+r*.95,z,.26,.25,.85,'gold',10);
 sphere(g,x,baseY+r*1.53,z,.28,'gold',10,7);
}
function clockface(g,x,y,z){
 cylinder(g,x,y,z,.9,.95,.14,'trim',20).rotation.x=Math.PI/2;
 cylinder(g,x,y,z+.13,.70,.70,.04,'cream',20).rotation.x=Math.PI/2;
 pole(g,[x,y,z+.18],[x,y+.47,z+.18],.035,'black');
 pole(g,[x,y,z+.19],[x+.33,y-.10,z+.19],.035,'black');
}
function waterWheel(g,x,z,y=1.8){
 // Actual radial mill blades, no separate spinning draw calls.
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4;
  pole(g,[x,y,z],[x+Math.cos(a)*1.6,y+Math.sin(a)*1.6,z],.12,'wood');
  const b=block(g,x+Math.cos(a)*1.45,y+Math.sin(a)*1.45,z,1,.33,.72,'beam');
  b.rotation.z=a+Math.PI/2;
 }
 piece(g,new T.TorusGeometry(1.62,.14,6,20),'iron',x,y,z);
}
function garden(g){
 for(let i=0;i<4;i++){
  const xx=-3.0+i*1.95;
  block(g,xx,.20,4.2,1.2,.31,.58,'earth');
  for(let j=0;j<3;j++)sphere(g,xx-.38+j*.38,.60,4.2,.24,'green',7,5);
 }
}
function central(g,type,team){
 const palaces=['hall','university','academy','guildhall','monastery','keep','chapel','observatory'];
 if(type==='hall'||type==='guildhall'){
  const main=baseHouse(g,{w:8.5,d:6.0,floors:2,roofType:'flat',chim:false});
  columns(g,0,4.05,7.2,4,5);
  block(g,0,4.45,4.25,7.1,.4,.75,'gold');
  if(type==='hall'){
   block(g,-2.3,main.height+2.5,-1.7,2.7,5,2.5,'brick');
   clockface(g,-2.3,main.height+3.2,-.31);
   dome(g,-2.3,-1.7,main.height+5,1.32);
   pennant(g,2.7,-2.1,main.height+3.4,team);
  }else{
   block(g,0,main.height+.9,0,3.8,1.8,3.2,'stone');
   dome(g,0,0,main.height+1.4,1.7);
  }
 }else if(type==='house'||type==='inn'){
  const h=baseHouse(g,{w:type==='inn'?8:6.2,d:4.8,floors:type==='inn'?3:2,
   roofType:'gable',timber:type==='house'});
  for(const x of [-1.65,1.65]){
   block(g,x,h.height+1.1,2.0,1.3,1.5,1.25,'warm');
   roof(g,x,h.height+1.85,2.0,1.55,1.6,.7,'roof');
   windowAt(g,x,h.height+1.0,2.71,'normal');
  }
  planter(g,-2.1,2.86,2.0);planter(g,2.1,2.86,2.0);
  if(type==='inn'){
   block(g,3.8,4.2,3.15,.22,3.5,.18,'wood');
   block(g,4.25,5.3,3.2,1.7,1.0,.17,'azure');barrel(g,-3.9,3.5);
  }else chimney(g,-2.05,-1.9,5.5);
 }else if(type==='university'||type==='academy'||type==='scriptorium'||type==='study'){
  const r=baseHouse(g,{w:8.4,d:6.2,floors:2,roofType:'flat',chim:false});
  columns(g,0,3.7,4.15,3.5,5);
  for(const x of [-2.7,2.7])block(g,x,6.2,3.43,1.1,1.2,.3,'window');
  if(type==='university'||type==='academy'){
   dome(g,0,0,r.height+.30,type==='university'?2.1:1.5);
   for(const x of [-3.3,3.3])piece(g,new T.ConeGeometry(.56,1.9,4),'copper',x,r.height+1.4,0);
  }
  if(type==='scriptorium'||type==='study'){
   block(g,-3.0,1.1,4.2,2.0,.15,1.0,'wood');
   for(let i=0;i<4;i++)block(g,-3.65+i*.47,1.29,4.2,.26,.06,.60,'paper');
   crates(g,2.8,4.0,3);
  }
 }else if(type==='observatory'){
  cylinder(g,0,.45,0,3.2,3.4,.9,'stone',12);
  cylinder(g,0,5.3,0,2.8,3.08,9.0,'cream',12);
  for(let i=0;i<12;i+=2){
   const a=i*Math.PI/6;const x=Math.sin(a)*2.92,z=Math.cos(a)*2.92;
   block(g,x,6,z,.18,2.3,.18,'window');
  }
  cylinder(g,0,10.0,0,3.3,3.1,.85,'cutstone',12);
  dome(g,0,0,10.0,3.0);
  // Slanted brass telescope protruding from the observatory dome.
  pole(g,[.2,13,0],[1.7,14.7,0],.23,'gold');
  cylinder(g,1.83,14.82,0,.36,.29,.26,'iron');
  archDoor(g,0,3.15);
 }else if(type==='chapel'||type==='monastery'){
  const r=baseHouse(g,{w:7.9,d:6.1,floors:2,roofType:'gable',chim:false});
  for(const x of [-2.25,2.25]){
   cylinder(g,x,7.3,-1.7,.86,1.0,5.6,'stone',10);
   piece(g,new T.ConeGeometry(1.2,2.9,8),'slate',x,11.5,-1.7);
  }
  block(g,0,r.height+.9,3.2,.35,2.1,.26,'gold');
  block(g,0,r.height+1.5,3.2,1.45,.35,.26,'gold');
  for(const x of [-2.25,2.25])windowAt(g,x,4.5,3.2,'large');
 }else if(type==='keep'||type==='gatehouse'){
  baseHouse(g,{w:8.1,d:6.2,floors:3,roofType:'flat',chim:false,wall:'stone'});
  for(const x of [-3.3,3.3])for(const z of [-2.4,2.4]){
   cylinder(g,x,7.0,z,.95,1.1,13.4,'cutstone',10);
   piece(g,new T.ConeGeometry(1.3,2.6,9),'slate',x,15.0,z);
  }
  if(type==='gatehouse')archDoor(g,0,3.35,.4,1.8);
  pennant(g,0,-.2,13.0,team);
 }else if(type==='market'||type==='trade_yard'){
  // A covered Renaissance loggia and two colourful awning stalls.
  block(g,0,.3,-1.6,8.6,.6,4.8,'stone');
  for(const x of [-3.2,-1.1,1.1,3.2]){
   cylinder(g,x,2,-1.6,.19,.23,4,'cutstone',10);
   cylinder(g,x,4,-1.6,.32,.32,.19,'trim',10);
  }
  block(g,0,4.2,-1.6,8.6,.4,5.15,'cutstone');
  roof(g,0,4.45,-1.6,8.6,5.0,1.1,'roof');
  for(const x of [-2.45,2.45]){
   laneCanopy(g,x,3.4,2.5,1.6,2.7,x<0?'azure':'cloth');
   block(g,x,.87,3.2,2.7,.25,1,'wood');barrel(g,x+.6,3.7);
  }
 }else if(type==='warehouse'||type==='cellar'){
  if(type==='cellar'){
   block(g,0,.4,0,7.8,.8,6,'stone');
   block(g,0,1.9,0,7.1,2.4,5.7,'earth');
   hip(g,0,3.2,0,8.4,6.6,.95);
   archDoor(g,0,3.04);
   barrel(g,3.3,3.1);barrel(g,-3.3,3.1);
  }else{
   baseHouse(g,{w:8.2,d:6,floors:2,roofType:'gable',chim:false,windows:false});
   block(g,0,1.8,3.21,2.8,3.2,.22,'beam');
   for(let i=0;i<5;i++)barrel(g,-3.45+i*1.45,4.1);
   crates(g,2.6,3.85,6);
   pole(g,[3.75,0,-1.5],[3.75,8,-1.5],.19,'beam');
   pole(g,[3.75,7.8,-1.5],[1.4,7.8,-1.5],.13,'wood');
   pole(g,[1.4,4,-1.5],[1.4,7.8,-1.5],.045,'iron');
  }
 }else if(type==='printer'){
  baseHouse(g,{w:7.5,d:5.5,floors:2,roofType:'gable',chim:false});
  // Distinctive screw printing press and outdoor drying/paper racks.
  block(g,-2.8,1.1,4.0,1.9,.28,1.2,'beam');
  for(const x of [-3.65,-1.95])pole(g,[x,0,4],[x,3.0,4],.17,'wood');
  block(g,-2.8,3.1,4.0,2.2,.3,1.35,'wood');
  pole(g,[-2.8,1.1,4],[-2.8,4.2,4],.15,'iron');
  block(g,1.8,1.2,4.2,3.1,.2,1.0,'wood');
  for(let i=0;i<4;i++)block(g,.65+i*.73,1.35,4.1,.57,.045,.72,'paper');
  for(let j=0;j<3;j++)block(g,3.2,2.5+j*.45,2.1,.10,.05,1.0,'paper');
 }else if(type==='watermill'||type==='windmill'){
  if(type==='windmill'){
   cylinder(g,0,4.1,0,2.2,3.0,7.6,'cream',12);
   piece(g,new T.ConeGeometry(2.8,2.1,12),'slate',0,8.9,0);
   for(let a=0;a<4;a++){
    const ang=a*Math.PI/2;
    const vane=block(g,Math.cos(ang)*2.7,5.4+Math.sin(ang)*2.7,2.55,3.2,.56,.15,'canvas');
    vane.rotation.z=ang;
    pole(g,[0,5.4,2.5],[Math.cos(ang)*4.5,5.4+Math.sin(ang)*4.5,2.5],.11,'wood');
   }
  }else{
   baseHouse(g,{w:6.2,d:5.1,floors:2,roofType:'gable'});
   waterWheel(g,3.7,0,2.45);
   block(g,3.5,.2,2.6,1.1,.45,3.4,'stone');
  }
 }else if(type==='well'){
  cylinder(g,0,.78,0,1.35,1.5,1.55,'cutstone',16);
  cylinder(g,0,1.58,0,1.50,1.52,.18,'stone',16);
  cylinder(g,0,1.71,0,1.05,1.05,.09,'black',16);
  for(const x of [-1.6,1.6])pole(g,[x,0,0],[x,4.4,0],.20,'wood');
  roof(g,0,4.35,0,4.3,3.2,1.2,'slate');
  pole(g,[-1.6,3,0],[1.6,3,0],.15,'iron');barrel(g,2.45,.6);
 }else if(['infirmary','nitrate','powdermill','bakery','smith','smelter','bronze_foundry'].includes(type)){
  baseHouse(g,{w:7.3,d:5.5,floors:2,roofType:'gable',chim:false});
  if(type==='infirmary'){
   block(g,0,5,2.95,.62,1.95,.22,'red');
   block(g,0,5,2.95,1.95,.62,.22,'red');
   planter(g,3.0,4.0);
  }else{
   chimney(g,2.5,-1.1,6);
   if(type==='powdermill'||type==='nitrate')for(let i=0;i<4;i++)barrel(g,-2.7+i*.95,4.0);
   if(type==='bakery')for(let i=0;i<5;i++)sphere(g,-2.7+i*.9,.4,4.1,.38,'straw',8,5);
   if(type==='smith'||type==='smelter'||type==='bronze_foundry'){
    cylinder(g,3.0,.9,4.1,.9,1.1,1.8,'brick',10);
    piece(g,new T.ConeGeometry(1.02,.7,10),'slate',3.0,2.1,4.1);
    block(g,-2.5,1.2,4.0,1.5,.25,1.0,'iron');
   }
  }
 }else if(type==='harbor'){
  baseHouse(g,{w:5.8,d:4.2,floors:2,roofType:'gable'});
  for(const x of [-2.4,2.4])for(const z of [3.3,5.0])pole(g,[x,-.8,z],[x,1.1,z],.18,'wood');
  block(g,0,.3,4.1,5.9,.36,3.6,'wood');
  pole(g,[3.6,0,2.5],[3.6,6.1,2.5],.18,'wood');
  pole(g,[3.6,6.1,2.5],[1.7,6.1,2.5],.12,'beam');
  pole(g,[1.7,3.9,2.5],[1.7,6.1,2.5],.06,'iron');
 }else if(type==='farm'||type==='stable'||type==='pasture'){
  baseHouse(g,{w:6.0,d:4.2,floors:1,roofType:'gable',windows:false});
  for(let i=0;i<4;i++)for(let j=0;j<3;j++){
   const x=-3.0+i*1.8,z=3.25+j*.65;
   if(type==='farm')sphere(g,x,.38,z,.28,'green',7,5);
   else if(j===0)pole(g,[x,0,z],[x,1.4,z],.12,'wood');
  }
  if(type==='stable')for(const x of [-2.5,2.5])barrel(g,x,3.2);
 }else{
  // Artisan and military workshops share a carved Renaissance shell, but the
  // equipment and working silhouette differ by profession.
  const tall=['master_workshop','siegeworkshop','barracks','armor_workshop','crossbow_range'].includes(type);
  baseHouse(g,{w:tall?7.5:6.5,d:5.0,floors:tall?2:1,roofType:'gable',
   windows:tall,chim:type==='saw'||type==='mason'||type==='mill'});
  if(['saw','lumber','forester','cartwright','road_depot'].includes(type)){
   crates(g,-2.6,4.0,4);
   for(let i=0;i<3;i++)pole(g,[-2.0+i*.72,.45,3.8],[-2.0+i*.72,.45,5.2],.19,'wood');
  }else if(['quarry','mason','mine','coal','coppermine','tinmine'].includes(type)){
   for(let i=0;i<6;i++)block(g,-2.65+(i%3)*1.1,.45+Math.floor(i/3)*.75,4,.95,.72,.9,'stone');
   if(type==='mason')columns(g,2.1,4.0,2.1,2.3,3);
  }else if(['barracks','archery','armor_workshop','crossbow_range','siegeworkshop'].includes(type)){
   for(let i=0;i<4;i++)pole(g,[-2.3+i*1.4,0,4.1],[-2.3+i*1.4,3.1,4.1],.065,'iron');
   block(g,1.9,1.0,4.1,1.8,1.8,.18,'azure');
   if(type==='siegeworkshop')for(let i=0;i<2;i++){
    piece(g,new T.TorusGeometry(.57,.14,5,10),'wood',-2.0+i*2,1.0,4.5).rotation.y=Math.PI/2;
   }
  }else if(type==='fisher'){
   for(let x of [-2.6,2.6])pole(g,[x,0,4],[x,3,4],.11,'wood');
   for(let i=0;i<6;i++)pole(g,[-2.5+i*.88,1.0,4],[(-2.5+i*.88),2.6,4],.025,'canvas');
  }else if(type==='hunter'){
   laneCanopy(g,1.7,3.8,2.3,1.4,2.5);
   crates(g,-2.4,4.0,3);
  }else if(type==='mill'){
   cylinder(g,2.8,1.1,3.9,1.0,1.1,.65,'stone',14);
   pole(g,[2.8,1.25,3.9],[2.8,3.3,3.9],.1,'wood');
  }
 }
}
function bake(g){
 g.updateMatrixWorld(true);
 const groups=new Map();
 g.traverse(node=>{
  if(!node.isMesh)return;
  const geo=node.geometry.index?node.geometry.toNonIndexed():node.geometry.clone();
  geo.applyMatrix4(node.matrixWorld);
  const key=node.material.uuid;
  if(!groups.has(key))groups.set(key,{material:node.material,shapes:[]});
  groups.get(key).shapes.push(geo);
 });
 const output=[];let triangles=0;
 for(const {material,shapes} of groups.values()){
  const count=shapes.reduce((n,geo)=>n+geo.attributes.position.count,0);
  const p=new Float32Array(count*3),n=new Float32Array(count*3),uv=new Float32Array(count*2);
  let offset=0;
  for(const geo of shapes){
   const c=geo.attributes.position.count;
   p.set(geo.attributes.position.array,offset*3);
   n.set(geo.attributes.normal.array,offset*3);
   if(geo.attributes.uv)uv.set(geo.attributes.uv.array,offset*2);
   offset+=c;geo.dispose();
  }
  const merged=new T.BufferGeometry();
  merged.setAttribute('position',new T.BufferAttribute(p,3));
  merged.setAttribute('normal',new T.BufferAttribute(n,3));
  merged.setAttribute('uv',new T.BufferAttribute(uv,2));
  merged.computeBoundingSphere();merged.userData.shared=true;
  triangles+=count/3;output.push({geometry:merged,material});
 }
 g.traverse(node=>{if(node.isMesh)node.geometry.dispose()});
 return {output,triangles};
}
export function createRenaissanceBuilding(type,team=0){
 if(!supported.has(type))return null;
 const key=type+':'+(team===0?0:1);
 if(!geomCache.has(key)){
  const draft=new T.Group();central(draft,type,team);
  geomCache.set(key,bake(draft));
 }
 const spec=geomCache.get(key),group=new T.Group();
 group.name='V81 renessanss '+type;
 group.userData.renaissanceAgeModel=true;
 group.userData.buildingType=type;
 group.userData.age=4;group.userData.triangles=spec.triangles;
 for(const {geometry,material} of spec.output){
  const mesh=new T.Mesh(geometry,material);
  mesh.castShadow=mesh.receiveShadow=true;
  group.add(mesh);
 }
 return group;
}
