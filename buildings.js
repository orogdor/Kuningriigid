import {createBronzeCityModel,createBronzeTownHouse} from './bronze-city-v111.js?v=117a';
import {createMiningSite,createCoastalBuilding} from './site-models-v88.js';
import {GOOD_BUILDINGS} from './city-needs-v87.js';
import * as T from './vendor/three.module.js';
import {createIndustrialBuilding} from './industrial-buildings-v82.js?v=82a';
import {createMedievalBuilding} from './medieval-buildings-v80.js?v=80a';
import {createRenaissanceBuilding} from './renaissance-buildings-v81.js?v=81a';
import {createArchitecturalDetails} from './graphics-v46.js';
import {createStoneBuilding} from './stone-buildings-v77.js?v=77a';
import {createBronzeBuilding} from './bronze-buildings-v79.js?v=79a';
const materials=new Map(),textures=new Map(),models=new Map();
function texture(style){
 if(textures.has(style))return textures.get(style);
 const size=128,data=new Uint8Array(size*size*4),wood=style==='wood',stone=style==='stone',roof=style==='roof',metal=style==='metal',plaster=style==='plaster';
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const row=Math.floor(y/13),offset=(row%2)*20,brickX=(x+offset)%40,shingleX=(x+row*9)%19;
  const n=Math.sin(x*127.1+y*311.8)*43758.5453,grain=(n-Math.floor(n))-.5;
  const wave=Math.sin((wood?y:x)*.32+Math.sin((wood?x:y)*.16)*1.5);
  let value=215+grain*17;
  if(stone){value=210+grain*24+wave*3;if(y%13<=1||brickX<=1)value=119;else if(brickX===2||y%13===2)value=151}
  else if(roof){value=210+grain*25+Math.sin(y*.24)*4;if(y%10===0||shingleX<2)value=136}
  else if(wood){value=208+wave*17+grain*15;if(x%18<2)value-=24;if(x%18===10&&y%25<2)value+=15}
  else if(metal){value=221+grain*11;if(x%32<=1||y%32<=1)value-=24;const rivet=Math.hypot((x%32)-4,(y%32)-4);if(rivet<2)value=141}
  else if(plaster)value=226+grain*12+wave*2;
  const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=Math.max(0,Math.min(255,value));data[i+3]=255;
 }
 const tx=new T.DataTexture(data,size,size,T.RGBAFormat);tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.magFilter=T.LinearFilter;tx.minFilter=T.LinearMipmapLinearFilter;tx.generateMipmaps=true;tx.needsUpdate=true;tx.anisotropy=4;tx.colorSpace=T.SRGBColorSpace;textures.set(style,tx);return tx;
}
function mat(color,style='plain',glow=false){const key=color+style+glow;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,map:style==='plain'?null:texture(style),roughness:style==='metal'?.48:.9,metalness:style==='metal'?.55:0,emissive:glow?color:0,emissiveIntensity:glow?1.2:0}));return materials.get(key)}
function mesh(g,geo,color,style,x,y,z,scale=[1,1,1],glow=false){const m=new T.Mesh(geo,mat(color,style,glow));m.position.set(x,y,z);m.scale.set(...scale);m.castShadow=!glow;m.receiveShadow=true;g.add(m);return m}
function box(g,x,y,z,w,h,d,c='#a99f87',style='plain',glow=false){return mesh(g,new T.BoxGeometry(w,h,d),c,style,x,y,z,[1,1,1],glow)}
function cylinder(g,x,y,z,rt,rb,h,c,style='plain',n=12){return mesh(g,new T.CylinderGeometry(rt,rb,h,n),c,style,x,y,z)}
function cone(g,x,y,z,r,h,c,n=8){return mesh(g,new T.ConeGeometry(r,h,n),c,'roof',x,y,z)}
function beam(g,a,b,width=.1,c='#6e5136'){const direction=new T.Vector3().subVectors(new T.Vector3(...b),new T.Vector3(...a)),m=box(g,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,width,direction.length(),width,c,'wood');m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());return m}
function gable(g,x,y,z,w,d,rise,c='#97553d'){const slope=Math.hypot(w/2,rise),angle=Math.atan2(rise,w/2);for(const side of [-1,1]){const m=box(g,x+side*w/4,y+rise/2,z,slope,.15,d,c,'roof');m.rotation.z=-side*angle}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-w/2,0,-d/2,w/2,0,-d/2,0,rise,-d/2,-w/2,0,d/2,0,rise,d/2,w/2,0,d/2],3));geo.computeVertexNormals();const cap=mesh(g,geo,'#c2b28e','plaster',x,y,z);cap.material=mat('#b1a07a','plaster');cap.material.side=T.DoubleSide;beam(g,[x-w/2,y,z+d/2+.02],[x,y+rise,z+d/2+.02],.08);beam(g,[x,y+rise,z+d/2+.02],[x+w/2,y,z+d/2+.02],.08)}
function window(g,x,y,z,w=.42,h=.5){box(g,x,y,z,w+.12,h+.12,.075,'#66523c','wood');box(g,x,y,z+.045,w,h,.035,'#e0bc70','plain',true);box(g,x,y,z+.075,.045,h,.04,'#5b4e38');box(g,x,y,z+.075,w,.045,.04,'#5b4e38')}
function cottage(g,x=0,z=-.3,w=3.4,d=2.5,h=2.1,roof='#925338',wood=false){box(g,x,.18,z,w+.2,.35,d+.2,'#aaa58d','stone');box(g,x,h/2+.3,z,w,h,d,wood?'#8d6b48':'#d1c19a',wood?'wood':'plaster');for(const xx of [-w/2+.08,0,w/2-.08])box(g,x+xx,h/2+.3,z+d/2+.035,.1,h,.09,'#6a5137','wood');box(g,x,.65,z+d/2+.07,.58,1.15,.1,'#594631','wood');box(g,x,.21,z+d/2+.27,.75,.15,.45,'#8c8a76','stone');gable(g,x,h+.35,z,w+.45,d+.4,.9,roof);window(g,x-w*.3,h*.62+.3,z+d/2+.06);window(g,x+w*.3,h*.62+.3,z+d/2+.06)}
function logs(g,x,z,count=3){for(let i=0;i<count;i++){const log=cylinder(g,x+(i%2)*.38,.28+Math.floor(i/2)*.32,z,.18,.18,1.25,'#795739','wood',8);log.rotation.x=Math.PI/2;cylinder(g,x+(i%2)*.38,.28+Math.floor(i/2)*.32,z+.635,.14,.14,.025,'#bd9d66','plain',8).rotation.x=Math.PI/2}}
function crate(g,x,z,size=.55){box(g,x,size/2+.15,z,size,size,size,'#987047','wood');for(const sign of [-1,1])box(g,x+sign*size*.35,size/2+.15,z+size/2+.02,.06,size,.04,'#5a4833')}
function chimney(g,x,z,height=3.6){box(g,x,height/2,z,.5,height,.5,'#a39178','stone');box(g,x,height+.05,z,.65,.18,.65,'#685e4e','stone')}
function fence(g,x,z,w){for(let i=0;i<=4;i++)box(g,x-w/2+i*w/4,.55,z,.07,1,.07,'#776042','wood');for(const y of [.4,.8])box(g,x,y,z,w,.07,.07,'#987b51','wood')}
function compile(root){root.updateMatrixWorld(true);const buckets=new Map();root.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrixWorld);const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,{mat:o.material,geo:[]});buckets.get(key).geo.push(geo)});const result=[];for(const{mat,geo}of buckets.values()){const count=geo.reduce((n,g)=>n+g.attributes.position.count,0),p=new Float32Array(count*3),n=new Float32Array(count*3),uv=new Float32Array(count*2);let off=0;for(const a of geo){const c=a.attributes.position.count;p.set(a.attributes.position.array,off*3);n.set(a.attributes.normal.array,off*3);if(a.attributes.uv)uv.set(a.attributes.uv.array,off*2);off+=c;a.dispose()}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('normal',new T.BufferAttribute(n,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.computeBoundingSphere();g.userData.shared=true;result.push({geo:g,material:mat})}root.traverse(o=>{if(o.geometry)o.geometry.dispose()});return result}
function staticModel(type,team){const key=type+team;if(models.has(key))return models.get(key);const g=new T.Group(),flag=team?'#ac5945':'#4a7288';
// V60: recognisable historic building silhouettes, sharing the existing batched model pipeline.
if(['library','school','public_school','high_school'].includes(type)){
 const library=type==='library',secondary=type==='high_school',industrial=type==='public_school'||secondary;
 const height=secondary?4.8:industrial?3.8:2.8;
 box(g,0,height/2,0,6,height,4.6,industrial?'#b58d71':'#c1b69a','stone');
 gable(g,0,height+.15,0,6.6,5.2,1.5,library?'#8c725b':'#707d8d');
 for(const x of [-2,-.8,.8,2]){window(g,x,1.8,2.34,.55,.8);if(industrial)window(g,x,3.3,2.34,.55,.75);}
 box(g,0,.95,2.36,.8,1.9,.12,'#605040','wood');
 if(library){for(let i=0;i<5;i++)box(g,-1.8+i*.8,.75,2.65,.5,.12,.65,'#c9b992','wood');}
 else{box(g,0,2.6,2.43,1.2,.55,.15,'#3c5048','wood');if(secondary){box(g,0,height+1.8,0,1.4,1.8,1.4,'#b58d71','stone');window(g,0,height+2.2,.74,.45,.45);cone(g,0,height+3.3,0,1.15,1.4,'#707d8d',4);}}
}
else if(type==='claypit'){for(let i=0;i<3;i++)box(g,-.9+i*.7,.22,-.45-i*.15,1.5,.38,2.5,'#a27657','stone');cottage(g,1.3,-.8,1.7,1.6,1.4,'#90704c',true);for(let i=0;i<3;i++)cylinder(g,-1.4+i*.7,.5,1.35,.28,.32,.65,'#bb795a','stone',9);}
else if(type==='pottery_kiln'){cottage(g,-1,-.5,2.4,2.3,1.8,'#a7634b',true);cylinder(g,1.1,1,0,.88,1.05,2.1,'#a57458','stone');chimney(g,1.2,-.45,3.6);box(g,1.12,.5,1,.7,.65,.1,'#4d2e27');for(let i=0;i<4;i++)cylinder(g,-1.5+i*.85,.46,1.5,.24,.3,.6,'#d0a07a','stone',10);}
else if(type==='pasture'){cottage(g,-1.3,-.9,2.5,2,1.75,'#98734e',true);for(let z=-1.8;z<=1.8;z+=1.2){fence(g,1,z,1.8)}for(const x of [-.1,1.6])box(g,x,.9,.1,1.05,.95,.7,'#96704f');for(const x of [-.1,1.6])box(g,x,.5,-.1,.6,.4,.6,'#735b43');cylinder(g,1.3,.3,1.75,.75,.75,.3,'#8c7255','wood');}
else if(type==='mason'){cottage(g,-1,-.75,2.4,2.2,1.9,'#838782');for(let i=0;i<5;i++)box(g,.4+(i%3)*.8,.28+Math.floor(i/3)*.65,.2, .75,.55,.7,'#b6b6a7','stone');box(g,1.1,.35,1.45,2.2,.65,.8,'#acaba1','stone');beam(g,[.3,1,1.45],[1.7,1,1.45],.12);}
else if(type==='cartwright'){cottage(g,-1,-.6,2.5,2.1,1.85,'#8b6847',true);box(g,1,.85,.6,2.35,.25,1.25,'#92704b','wood');for(const x of [-.05,2.05])for(const z of [-.1,1.3]){const wheel=cylinder(g,x,.55,z,.65,.65,.16,'#594c38','wood',12);wheel.rotation.z=Math.PI/2;cylinder(g,x,.55,z,.12,.12,.23,'#b1a07c','wood',12).rotation.z=Math.PI/2;}box(g,1,.55,.6,.16,.16,1.8,'#c1a071','wood');}
else if(type==='coppermine'||type==='tinmine'){cottage(g,-1.4,-.7,2.3,1.95,1.65,'#827461',true);box(g,.85,1,.15,2,1.9,2,'#777b70','stone');box(g,.85,1.2,1.23,1.1,1.35,.12,'#262721');for(const x of [-.15,1.85])box(g,x,1.55,1.3,.18,3.1,.2,'#795938','wood');box(g,.85,3.1,1.3,2.5,.18,.2,'#876b44','wood');for(let i=0;i<4;i++)box(g,-1.1+i*.65,.32,1.55,.55,.58,.55,type==='coppermine'?'#a86d50':'#9eaaac','stone');}
else if(type==='bronze_foundry'){cottage(g,-1.2,-.5,2.3,2.1,1.7,'#8c684c',true);cylinder(g,1.1,1.5,-.5,.85,1.1,2.6,'#a69575','stone');chimney(g,1.6,-1.2,4.2);box(g,1.1,.45,.48,.7,.6,.12,'#6b3829');box(g,1.1,.4,.56,.5,.36,.04,'#e58036','plain',true);for(let i=0;i<3;i++)cylinder(g,-.5+i*.8,.26,1.7,.32,.38,.32,'#b88a4c','metal');}
else if(type==='road_depot'){cottage(g,-.9,-.5,2.8,2.6,2,'#967e5d',true);for(let i=0;i<5;i++)box(g,.9+(i%3)*.63,.15+Math.floor(i/3)*.35,.25,.55,.3,1.1,'#b3aa94','stone');for(const x of [.3,2])cylinder(g,x,.45,1.6,.5,.5,.15,'#62523c','wood',12).rotation.z=Math.PI/2;box(g,1.2,.9,1.6,2.15,.17,.8,'#94754c','wood');}
else if(type==='woodgate'){
 // Walkable 3.6-metre-wide timber opening between defensive palisade wings.
 for(const x of [-2.65,2.65]){
  box(g,x,2.35,0,.72,4.7,.8,'#765636','wood');
  cone(g,x,4.88,0,.50,.8,'#ac8859',7);
  for(const z of [-.52,.52])box(g,x,1.5,z,.9,.22,.18,'#5d452e','wood');
 }
 box(g,0,4.5,0,6.3,.5,1,'#6f5031','wood');
 for(const x of [-1.8,0,1.8])box(g,x,4.9,.02,.2,.55,.2,'#b18d5d','wood');
 // Raised timber door leaves: route through the centre is unblocked.
 for(const x of [-2.05,2.05])box(g,x,1.8,.38,.48,3.35,.18,'#99734a','wood');
 for(const x of [-3.25,3.25])for(const z of [-.22,.22])box(g,x,1.5,z,.25,3,.2,'#785939','wood');
}
else if(type==='palisade'){
 for(let x=-3;x<=3;x+=.62){cylinder(g,x,1.65,0,.29,.34,3.3,'#836241','wood',7);cone(g,x,3.48,0,.34,.5,'#a98a5e',7)}
 for(const z of [-.34,.34])for(const y of [.85,2.1])box(g,0,y,z,7,.2,.18,'#6f5338','wood');
 for(const x of [-3,0,3])box(g,x,.7,.65,.32,1.4,.42,'#69513a','wood');
}
else if(type==='stonewall'){
 box(g,0,1.65,0,7,3.3,1.25,'#9e9c8d','stone');
 box(g,0,3.3,0,7.5,.36,1.6,'#b8b7aa','stone');
 for(let x=-3;x<=3;x+=1.15){box(g,x,3.78,0,.72,.7,1.4,'#b4b2a5','stone')}
 for(const x of [-2.4,0,2.4])box(g,x,1.55,.69,.15,2.9,.08,'#777870','stone');
}
else if(type==='watchtower'){
 for(const x of [-2,2])for(const z of [-2,2]){box(g,x,3.8,z,.44,7.6,.44,'#73583b','wood');cone(g,x,7.85,z,.44,.65,'#aa8b5b',6)}
 for(const y of [2,4.5,6.7]){box(g,0,y,0,5.1,.35,5.1,'#8f6e4b','wood');for(const x of [-2,2])box(g,x,y-.8,0,.23,1.5,4.3,'#73553c','wood')}
 for(const z of [-2,2])box(g,0,6.9,z,5.1,1,.18,'#785d40','wood');
 for(const x of [-2,2])box(g,x,6.9,0,.18,1,5.1,'#785d40','wood');
 for(const x of [-1.8,1.8])for(const z of [-1.8,1.8])box(g,x,7.85,z,.48,.8,.48,'#957550','wood');
}
else if(type==='stonetower'){
 cylinder(g,0,3.5,0,2.6,3.1,7,'#92958f','stone',12);
 cylinder(g,0,7.1,0,3.05,2.9,.55,'#b1b3aa','stone',12);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;box(g,Math.cos(a)*2.75,7.7,Math.sin(a)*2.75,.75,1,.8,'#b8b9af','stone').rotation.y=-a}
 for(const h of [2,4.3,6])box(g,0,h,2.62,.36,.7,.08,'#343d3e','stone');
 box(g,0,.85,2.91,1.1,1.7,.13,'#4c4a3e','wood');
}
// V62: original medieval silhouettes: mills, civic halls, castles and gatehouse.
else if(type==='reinforced_wall'){
 box(g,0,2,0,7,4,1.6,'#8c8d88','stone');box(g,0,4,0,7.6,.45,2,'#b7b8ab','stone');
 for(let x=-3.15;x<=3.15;x+=1.05)box(g,x,4.62,0,.67,.95,1.65,'#9c9e95','stone');
 for(const x of [-2.7,2.7])box(g,x,1.6,.85,.24,3,.18,'#61615a','metal');
}
else if(type==='gatehouse'){
 for(const x of [-2.1,2.1]){cylinder(g,x,3.3,0,1.4,1.6,6.6,'#92968b','stone',12);cylinder(g,x,6.6,0,1.65,1.55,.4,'#b2b6a7','stone',12);for(let i=0;i<8;i++){const a=i*Math.PI/4;box(g,x+Math.cos(a)*1.4,7.05,Math.sin(a)*1.4,.65,.75,.65,'#a3a79c','stone');}}
 box(g,0,5,0,2.9,2.5,2,'#9b9b90','stone');
 box(g,0,2,1.05,2.2,3.9,.18,'#6c5340','wood');
 for(let x=-.9;x<1;x+=.45)box(g,x,2,1.18,.085,3.75,.1,'#a5926e','metal');
}
else if(type==='keep'){
 box(g,0,2.7,0,5.4,5.4,5.1,'#93988f','stone');box(g,0,5.5,0,5.8,.35,5.6,'#c0c0b2','stone');
 for(const x of [-2.1,2.1])for(const z of [-2.1,2.1]){box(g,x,4.1,z,.95,8.2,.95,'#999e95','stone');cone(g,x,9,z,.87,1.7,'#5d6b76');}
 for(const x of [-2,0,2])for(const z of [-2.25,2.25])box(g,x,6,z,.9,.85,.8,'#b5b8aa','stone');
 box(g,0,.9,2.65,1.2,1.8,.16,'#5d4434','wood');for(const h of [3.3,4.8])window(g,0,h,2.62,.36,.62);
}
else if(type==='watermill'||type==='windmill'){
 cottage(g,-.8,-.45,3.2,3,3.2,type==='windmill'?'#7c6756':'#837465');
 if(type==='watermill'){const w=cylinder(g,1.55,1.35,.35,1.3,1.3,.24,'#745839','wood',12);w.rotation.z=Math.PI/2;for(let i=0;i<8;i++){const a=i*Math.PI/4;box(g,1.72,1.35+Math.cos(a)*.9,.35+Math.sin(a)*.9,.12,.5,.5,'#997248','wood')}}else{box(g,1,4,-.6,.2,3.5,.25,'#8e7b5f','wood');for(let i=0;i<4;i++){const a=i*Math.PI/2,wing=box(g,1+Math.cos(a)*1.1,4+Math.sin(a)*1.1,.35,.75,2.2,.16,'#bdb49b','wood');wing.rotation.z=-a}}
}
else if(type==='monastery'||type==='chapel'){
 cottage(g,-.8,-.35,3.7,3.1,3.5,'#555c6a');box(g,1.7,3.6,-.7,1.25,7.2,1.5,'#a7a698','stone');cone(g,1.7,8,-.7,1.1,1.6,'#616770');
 beam(g,[1.7,8.7,-.7],[1.7,10,-.7],.18,'#a9a9a0');beam(g,[1.1,9.4,-.7],[2.3,9.4,-.7],.14,'#a9a9a0');
}
else if(type==='siegeworkshop'){
 cottage(g,-1.5,-1,2.7,2.3,2,'#7a634c',true);
 for(const x of [-.3,2]){const wheel=cylinder(g,x,.6,1.5,.55,.55,.13,'#594b3b','wood',12);wheel.rotation.z=Math.PI/2}
 box(g,.9,1.2,.6,3,.25,1.7,'#98774d','wood');beam(g,[.3,1.5,.4],[1.55,4,.4],.19);box(g,1.65,4.05,.4,.6,.75,.55,'#89765d','wood');
}
else if(type==='armor_workshop'||type==='crossbow_range'||type==='guildhall'||type==='master_workshop'||type==='infirmary'||type==='trade_yard'||type==='inn'){
 const colors={armor_workshop:'#7a6b64',crossbow_range:'#836a52',guildhall:'#9b8065',master_workshop:'#82664c',infirmary:'#bec1ad',trade_yard:'#9e7851',inn:'#a77658'};
 cottage(g,-.3,-.45,3.6,2.9,2.65,colors[type]);
 if(type==='crossbow_range'){for(const x of [-1.75,0,1.75]){box(g,x,1.1,2.15,.13,2.1,.1,'#72533c','wood');box(g,x,2.15,2.15,.8,.8,.13,'#c3a66e','wood');}}
 if(type==='armor_workshop'){for(const x of [-1.2,0,1.2]){cylinder(g,x,.6,2,.5,.5,.16,'#849095','metal');box(g,x,1.15,2,.75,.5,.16,'#8f9594','metal');}}
 if(type==='guildhall'){for(const x of [-1.8,1.8])box(g,x,3.8,0,.65,1,.65,'#b8ac81','stone');}
 if(type==='master_workshop')for(let i=0;i<5;i++)box(g,-1.8+i*.7,.35,2,.3,.45,1.8,'#8e754c','wood');
 if(type==='infirmary'){box(g,0,3.7,1.5,.3,1.1,.2,'#ba5b53');box(g,0,3.7,1.52,1.1,.3,.18,'#ba5b53');}
 if(type==='trade_yard')for(let i=0;i<4;i++)crate(g,-1.5+i*.95,2.1);
 if(type==='inn'){for(let i=0;i<3;i++)box(g,-1.7+i*1.2,.5,2,.75,.25,.65,'#916842','wood');chimney(g,1.1,-.8,4)}
}
else if(type==='hall'){box(g,0,.2,0,5.8,.4,4.1,'#a49d85','stone');cottage(g,0,0,3.4,2.8,3.4,'#6c7180');for(const x of [-2.1,2.1]){box(g,x,2,0,1.2,4,1.5,'#b7b49c','stone');cone(g,x,4.7,0,1,1.8,'#687284',6);window(g,x,2.8,.79,.25,.7)}box(g,0,4.7,0,.07,3,.07,'#70563a');box(g,.65,5.7,0,1.25,.7,.04,flag);}
else if(type==='house'){cottage(g,0,-.25,3.4,2.7,2.8,'#a66d48');box(g,0,1.75,1.16,3.4,.12,.1,'#6a5137');window(g,-1,2.5,1.17);window(g,1,2.5,1.17);chimney(g,1,-.8,3.8);fence(g,0,1.95,3.5);}
else if(type==='lumber'){cottage(g,-.35,-.4,2.7,2.4,1.8,'#806145',true);logs(g,1.65,-.3,4);box(g,0,.6,1.65,1.4,.3,.65,'#8b6845','wood');box(g,.35,1,1.65,.07,.7,.07,'#69533a');box(g,.5,1.3,1.65,.3,.18,.04,'#9caba2','metal');}
else if(type==='forester'){cottage(g,-.35,-.5,2.7,2.2,1.9,'#677d4d',true);for(let j=0;j<2;j++){box(g,1.6,.25,j*.9,1.15,.25,.65,'#705339','wood');for(let i=0;i<3;i++)cone(g,1.25+i*.32,.65,j*.9,.18,.7,'#58824b',6)}crate(g,-1.6,1.4);}
else if(type==='saw'){for(const x of [-1.8,1.8])for(const z of [-1,1])box(g,x,1.3,z,.14,2.6,.14,'#715537','wood');gable(g,0,2.65,0,4.2,2.7,1,'#8d6042');box(g,0,.82,.6,3.5,.2,.8,'#957343','wood');logs(g,-1.65,-.4,3);box(g,1.55,.5,-.6,.9,1,1,'#95744c','wood');box(g,.7,1.1,1,.05,.45,1.7,'#acb4b1','metal');box(g,.7,1.35,1,.20,.17,1.7,'#745b3d','wood');for(let i=0;i<4;i++)box(g,.6,.3+i*.12,1.65,2.7,.1,.22,'#c1a577','wood');}
else if(type==='quarry'){for(let i=0;i<3;i++)box(g,-.55,.35+i*.35,-.8-i*.35,3.5-i*.55,.7,1.8,'#a5aa98','stone');for(let i=0;i<4;i++)box(g,-1.6+(i%2)*.7,.38+Math.floor(i/2)*.45,1.05,.6,.44,.65,'#bec0a7','stone');beam(g,[1.6,0,-.7],[1.6,3,-.7],.18);beam(g,[1.6,2.8,-.7],[.4,2.8,-.7],.15);beam(g,[.5,.7,-.7],[.5,2.8,-.7],.025,'#c2b18b');}
else if(type==='well'){cylinder(g,0,.45,0,.75,.85,.8,'#a8ac96','stone');const rim=mesh(g,new T.TorusGeometry(.7,.16,6,16),'#c1bea6','stone',0,.9,0);rim.rotation.x=Math.PI/2;cylinder(g,0,.6,0,.54,.54,.04,'#223c3b');for(const x of [-.9,.9])box(g,x,1.2,0,.14,2.3,.14,'#74593b','wood');gable(g,0,2.45,0,2.5,2,.65,'#7f6a49');beam(g,[-1,1.8,0],[1,1.8,0],.14);beam(g,[0,.9,0],[0,1.8,0],.025,'#c3b08b');cylinder(g,.15,1.05,.1,.2,.16,.35,'#9c7a50','wood');}
else if(type==='farm'){cottage(g,-1,-.6,2.1,2,1.6,'#9b744a',true);for(let i=0;i<5;i++){box(g,.25+i*.38,.17,.15,.25,.08,3,'#7c6036');for(let j=0;j<8;j++)beam(g,[.25+i*.38,.2,-1+j*.35],[.32+i*.38,.7,-1+j*.35],.055,'#c5b25b')}fence(g,.2,1.95,4.1);cylinder(g,-1.3,.6,1.1,.45,.5,1,'#b6a05b');}
else if(type==='mill'){cottage(g,-.4,-.45,3.1,2.8,2.1,'#8b684a',true);cylinder(g,.95,.50,1.65,1.04,1.14,.35,'#9a9c8c','stone',14);cylinder(g,.95,.82,1.65,.76,.83,.22,'#c2c1aa','stone',14);box(g,1.63,1.08,1.65,1.15,.10,.11,'#826341','wood');for(let i=0;i<3;i++)crate(g,-1.6+i*.75,1.5,.56);}
else if(type==='bakery'){cottage(g,-.55,-.4,2.6,2.5,2,'#af6b4a');mesh(g,new T.SphereGeometry(1,12,6,0,Math.PI*2,0,Math.PI/2),'#a98661','stone',1.5,.25,.2,[.75,.95,.85]);box(g,1.5,.45,1.02,.52,.45,.06,'#241d17');box(g,1.5,.37,1.06,.36,.12,.04,'#dc6a27','plain',true);chimney(g,1.45,-.1,3.2);box(g,-.5,.55,1.55,2,.16,.65,'#8f6d46','wood');for(let i=0;i<4;i++)mesh(g,new T.SphereGeometry(1,8,5),'#d8ad63','plain',-1.1+i*.4,.72,1.55,[.16,.1,.22]);}
else if(type==='mine'){box(g,0,.45,-.8,3.8,.9,2,'#797f6e','stone');box(g,0,1.2,.25,1.8,2,.08,'#242a23');for(const x of [-1,1])box(g,x,1.3,.35,.25,2.6,.25,'#6e5338','wood');box(g,0,2.55,.35,2.5,.25,.25,'#8b6843','wood');for(const x of [-1.5,1.5])box(g,x,1.8,-1,.16,3.6,.16,'#776044','wood');beam(g,[-1.6,3.6,-1],[1.6,3.6,-1],.2);for(const x of [-.5,.5])box(g,x,.19,1.2,.05,.06,1.8,'#7c8076','metal');box(g,0,.55,1.4,1,.6,.7,'#977448','wood');crate(g,1.8,1.1);}
else if(type==='coal'){mesh(g,new T.SphereGeometry(1,14,7,0,Math.PI*2,0,Math.PI/2),'#696d4d','plain',0,.2,-.3,[1.65,1.7,1.45]);box(g,0,.4,1.12,.5,.5,.04,'#302d23');cylinder(g,0,2.1,-.3,.18,.25,.8,'#4f5544');logs(g,-1.8,1,4);crate(g,1.7,1.1);}
else if(type==='smelter'){cylinder(g,.7,1.6,-.45,.65,.9,3.2,'#998e78','stone');cylinder(g,.7,3.6,-.45,.27,.45,1,'#756c59','stone');box(g,.7,.6,.42,.6,.8,.06,'#43362a');box(g,.7,.45,.46,.38,.35,.04,'#ef8733','plain',true);for(const x of [-1.9,-.7])box(g,x,1.1,-.2,.1,2.2,.1,'#735b40','wood');gable(g,-1.3,2.2,-.3,1.5,2.7,.5,'#77715b');crate(g,-1.4,1.5);}
else if(type==='smith'){for(const x of [-1.9,1.9])for(const z of [-1.3,1.1])box(g,x,1.2,z,.15,2.4,.15,'#745536','wood');gable(g,0,2.5,-.1,4.2,3,.8,'#8a6550');box(g,-1.2,.75,-.5,1.25,1.5,1.2,'#9e8d75','stone');box(g,-1.2,.65,.14,.6,.4,.05,'#d87831','plain',true);chimney(g,-1.2,-.6,3.8);box(g,.8,.4,.6,.7,.65,.6,'#795a3a','wood');box(g,.8,.83,.6,1,.22,.4,'#717a75','metal');beam(g,[.8,.8,.6],[1.45,.8,.6],.15,'#8c9690');crate(g,1.55,-.7);}
else if(type==='barracks'){cottage(g,0,-.6,4.2,2.7,2.8,'#697789');box(g,0,1.8,.8,.8,1.3,.05,flag);for(const x of [-1.6,1.6]){beam(g,[x,0,1.55],[x,1.4,1.55],.12);beam(g,[x-.3,1,1.55],[x+.3,1,1.55],.12)}fence(g,0,-2.05,4.4);}
else if(type==='archery'){for(const x of [-1.4,0,1.4]){for(const dx of [-.25,.25])beam(g,[x+dx,0,-1],[x+dx,1.5,-1],.09);const target=cylinder(g,x,1.3,-.86,.5,.5,.1,'#d2c8a4');target.rotation.x=Math.PI/2;const ring=mesh(g,new T.TorusGeometry(.29,.065,5,16),flag,'plain',x,1.3,-.79);cylinder(g,x,1.3,-.74,.09,.09,.04,'#b45c41').rotation.x=Math.PI/2;}gable(g,0,2.2,-1.15,4.5,1.3,.5,'#8c7351');for(const x of [-2,2])box(g,x,1.1,-1.1,.12,2.2,.12,'#806344');fence(g,0,1.8,4.3);}
else if(type==='warehouse'){box(g,0,.4,0,5,.7,4,'#a5a08b','stone');for(const x of [-2.1,2.1])for(const z of [-1.6,1.6])box(g,x,2.1,z,.32,3.5,.28,'#7f6041','wood');gable(g,0,3.4,0,5.5,4.8,1.35,'#856547');for(const x of [-1.1,1.1])for(let i=0;i<3;i++)crate(g,x,-.65+i*.7,.75);box(g,0,1.1,2,.8,1.9,.15,'#685039','wood');}
else if(type==='cellar'){box(g,0,.36,0,5,.6,4.2,'#9b9d93','stone');box(g,0,.8,0,4,1,3.2,'#b4b49c','stone');gable(g,0,1.65,0,4.8,4,1,'#66816b');for(const x of [-1.3,1.3]){box(g,x,1.2,1.2,1,.7,.9,'#856f4c','wood');}box(g,0,.45,2.15,1.1,.55,.18,'#584937','wood');}
else if(type==='market'){for(const x of [-2.5,2.5])for(const z of [-1.7,1.7])box(g,x,1.65,z,.16,3.3,.16,'#806146','wood');box(g,0,3.4,0,5.8,.35,4.3,'#b89069','roof');for(const x of [-1.6,1.6]){box(g,x,.8,.3,2.1,.25,1,'#9d7a4d','wood');crate(g,x,-.65,.5);}box(g,0,3.7,0,1.5,.3,.06,'#d2b56e');}
else if(type==='study'){cottage(g,-.55,-.4,3.2,2.8,2.4,'#696e86',true);box(g,1.3,.65,.2,1.1,1.3,.95,'#9c9275','stone');box(g,1.3,1.35,.2,1.4,.15,1.1,'#6c5841','wood');for(let i=0;i<4;i++)box(g,.8+i*.32,1.47,.25,.18,.08,.7,'#d2c19c');}
else if(type==='scriptorium'){cottage(g,0,-.5,4.4,3.5,3,'#666e88');for(const x of [-1.55,1.55]){window(g,x,2.1,1.28,.4,.7);box(g,x,.5,2.2,1.1,.45,.75,'#856e51','wood')}box(g,0,3.6,-.4,.4,1.4,.4,'#8f998f','stone');}
else if(type==='academy'){box(g,0,2.35,0,5.8,4.7,4.5,'#bdb59a','stone');for(const x of [-2,0,2]){cylinder(g,x,2.9,2.48,.22,.25,3.5,'#ddd4b8','stone');box(g,x,4.67,2.46,.65,.25,.7,'#aba48d','stone')}gable(g,0,5,0,6.5,5,1.6,'#788697');box(g,0,1,2.42,.9,1.95,.12,'#665d4f','wood');}
else if(type==='university'){box(g,0,2.65,0,6.2,5.3,4.5,'#aaa99f','stone');for(const x of [-2.5,2.5]){box(g,x,4.15,-1.45,1.45,7.2,1.5,'#959a95','stone');cone(g,x,8.3,-1.45,1.25,2.4,'#6b7d94',6)}gable(g,0,5.5,0,6.6,4.9,1.7,'#75859c');for(const x of [-1.6,0,1.6])window(g,x,2.9,2.29,.5,1.1);}
else if(type==='stable'){cottage(g,0,-.7,4,2.2,2.4,'#9b7651',true);for(const x of [-1.25,0,1.25]){box(g,x,1.1,.45,.85,1.6,.08,'#3e3e2e');box(g,x,.8,.52,.8,.1,.09,'#b5a077')}fence(g,0,1.85,4.3);box(g,0,.4,1.3,2.8,.4,.35,'#88734b','wood');}
else if(type==='bridge'){for(const x of [-2.2,2.2])for(const z of [-1.2,1.2])cylinder(g,x,.9,z,.16,.16,1.8,'#7a5a3d','wood');for(const z of [-1.2,1.2])box(g,0,1.35,z,5.5,.22,.18,'#8b6845','wood');for(const x of [-2.6,-.9,.9,2.6])box(g,x,1.05,0,.18,.75,2.9,'#9d7b55','wood');box(g,0,.72,0,6.2,.2,3.4,'#a88c65','wood');}

else if(['printer','nitrate','powdermill','observatory'].includes(type)){
 const color={printer:'#9e876d',nitrate:'#a39b72',powdermill:'#888073',observatory:'#b3b9b2'}[type];
 box(g,0,1.8,0,5.2,3.6,4.1,color,'stone');
 if(type==='observatory'){cylinder(g,0,4.4,0,2.35,2.4,1.6,'#b8b9ac','stone',16);mesh(g,new T.SphereGeometry(1,14,8,0,Math.PI*2,0,Math.PI/2),'#648297','metal',0,5.15,0,[2.2,1.5,2.2]);const telescope=cylinder(g,.15,6.3,0,.33,.48,2,'#d2b977','metal');telescope.rotation.z=.6;}
 else {gable(g,0,3.8,0,5.7,4.6,1.5,type==='printer'?'#755b4d':'#887b63');for(const x of [-1.6,1.6])window(g,x,2.3,2.1);}
 if(type==='printer'){box(g,0,.85,2.5,2.7,.25,1.4,'#795c42','wood');for(let i=0;i<5;i++)box(g,-1+i*.5,1.02,2.5,.35,.05,.9,'#e2d9af');}
 if(type==='nitrate')for(let i=0;i<3;i++)box(g,-1.6+i*1.5,.38,2.5,1.1,.6,1.8,'#746b54','wood');
 if(type==='powdermill')for(let i=0;i<3;i++)cylinder(g,-1.5+i*1.5,.55,2.35,.4,.47,1.1,'#786653','wood');
}
else if(['steelworks','engineworks','polytechnic','railstation','oilwell','refinery','powerplant','autofactory','laboratory','airfield'].includes(type)){
 const academic=['polytechnic','laboratory'].includes(type),power=type==='powerplant',oil=type==='oilwell';
 const base=academic?'#b1bfc4':oil?'#858a82':'#879291';
 box(g,0,.35,0,6.5,.65,5.5,'#96958b','stone');
 if(type==='airfield'){box(g,0,2.2,-1.25,6.2,3.6,3,base,'metal');gable(g,0,4.2,-1.25,6.6,3.4,1,'#667887');box(g,0,.73,2.5,5.4,.05,1.2,'#3f5153');for(const x of [-1.8,0,1.8])box(g,x,.76,2.6,.48,.04,.7,'#d9dccd');}
 else if(oil){for(let y=0;y<6;y++){const w=2.6-y*.34;for(const sx of [-1,1])for(const sz of [-1,1])box(g,sx*w/2,y+.7,sz*w/2,.13,1.6,.13,'#697479','metal');}cylinder(g,0,1.0,0,.48,.55,2,'#4f5a60','metal');box(g,2,.8,.8,1.6,1.4,1.8,'#7f918e','metal');}
 else {
 box(g,0,2.8,0,6.1,4.8,4.7,base,academic?'stone':'metal');
 if(academic){for(const x of [-1.8,0,1.8])window(g,x,3.0,2.39,.9,1.3);box(g,0,5.3,0,6.35,.28,4.9,'#546d81','metal');}
 else {for(let i=0;i<3;i++)box(g,-1.8+i*1.8,2.5,2.4,1.0,1.4,.09,'#89a8ac','plain');box(g,0,5.3,0,6.4,.25,5.1,'#65777e','metal');}
 if(['steelworks','refinery','powerplant'].includes(type))for(let i=0;i<(power?2:3);i++)cylinder(g,-2.0+i*1.8,5.6,-1.55,.5,.65,4.8,power?'#a6a19a':'#778387','metal');
 if(type==='railstation')for(let x=-1;x<=1;x++)box(g,x*2,.77,2.7,.17,.13,5.6,'#515d66','metal');
 if(type==='engineworks'||type==='autofactory')for(let i=0;i<3;i++)cylinder(g,-1.9+i*1.9,.85,2.4,.44,.44,.55,'#565f62','metal');
 }
}
else cottage(g);
if(type!=='hall')box(g,-1.8,.48,1.8,.18,.6,.08,flag);const result=compile(g);models.set(key,result);return result}
export function createBuildingModel(type,team=0){const root=new T.Group();for(const part of staticModel(type,team)){const m=new T.Mesh(part.geo,part.material);m.castShadow=true;m.receiveShadow=true;root.add(m)}root.userData.animations=[];// Bronze-era grain grinding uses a hand quern; wood production uses a hand saw.
// Neither should show medieval windmill sails or a motorized circular saw.
if(['bakery','smith','smelter','coal','steelworks','refinery','powerplant'].includes(type)){const smoke=new T.Group();const origin=type==='bakery'?[1.45,3.4,-.1]:type==='smith'?[-1.2,4,-.6]:type==='smelter'?[.7,4.3,-.45]:[0,2.7,-.3];smoke.position.set(...origin);for(let i=0;i<4;i++){const m=new T.Mesh(new T.SphereGeometry(1,6,4),new T.MeshBasicMaterial({color:0xaaa99e,transparent:true,opacity:.16,depthWrite:false}));m.scale.setScalar(.14+i*.05);smoke.add(m)}root.add(smoke);root.userData.smoke=smoke}return root}
export function animateBuilding(root,time,active,ready){for(const a of root.userData.animations||[]){if(ready&&(!a.node.userData.workOnly||active))a.node.rotation[a.axis]=time*a.speed}const smoke=root.userData.smoke;if(smoke){smoke.visible=ready&&active;smoke.children.forEach((p,i)=>{const f=(time*.23+i*.25)%1;p.position.set(f*.35,f*1.5,Math.sin(i+time*.15)*.06);p.scale.setScalar(.12+f*.35);p.material.opacity=(1-f)*.18})}}
export function createAgeBuilding(type,team,age=0){if(type==='woodgate')return createBuildingModel(type,team);if(['palisade','stonewall','reinforced_wall','gatehouse'].includes(type))return createBronzeCityModel(type,team);const site=createCoastalBuilding(type,team,age)||createMiningSite(type,team,age);if(site)return site;if(GOOD_BUILDINGS[type]){const d=GOOD_BUILDINGS[type],g=new T.Group();g.userData.buildingType=type;box(g,0,.2,0,6,.4,5,'#948777','stone');box(g,0,1.5,-.8,3,2.6,3,'#d5bf97','plaster');gable(g,0,3,-.8,4,4,1.2,d.age>=4?'#657f81':'#996a48');if(d.deposit){for(const x of [-2,-1,0,1,2]){box(g,x,.45,2,.3,.2,2,'#6c7140','wood');for(const z of [1.5,2.3])cylinder(g,x,.9,z,.24,.12,.7,d.out==='gems'?'#aa8ac9':'#79984f','wood');}}else{box(g,2,1.1,1,1.4,1.5,1.5,'#a77a4a','wood');for(const x of [-2,-1])cylinder(g,x,.8,1.8,.4,.4,1.2,d.age>=5?'#586e79':'#a3886a','metal');box(g,-1,3,-1,.6,3,.6,'#867b72','stone');}return g;}if(age===5){const industrial=createIndustrialBuilding(type,team);if(industrial)return industrial;}if(age===4){const renaissance=createRenaissanceBuilding(type,team);if(renaissance)return renaissance;}if(age===3){const medieval=createMedievalBuilding(type,team);if(medieval)return medieval;}if(age===0){const stone=createStoneBuilding(type,team);if(stone)return stone;}if(age===1){const fort=createBronzeCityModel(type,team);if(fort)return fort;const bronze=createBronzeBuilding(type,team);if(bronze)return bronze;}if(['palisade','stonewall','watchtower','stonetower','reinforced_wall',...['armor_workshop','crossbow_range','guildhall','master_workshop','watermill','windmill','infirmary','trade_yard','inn','monastery','chapel','keep','gatehouse','siegeworkshop']].includes(type))return createBuildingModel(type,team);if(type==='harbor'){const g=new T.Group();box(g,0,.3,2,6,.6,9,'#94724b','wood');for(const x of [-2.5,2.5])for(const z of [-1,3,6])cylinder(g,x,.1,z,.16,.2,2,'#68543a','wood');box(g,0,1.7,-2,4,2.8,3,'#b7a27c','wood');gable(g,0,3.5,-2,5,4,1.2,age>=2?'#797e83':'#98744c');box(g,0,3.7,3,.12,5,.12,'#735a3a','wood');box(g,.7,5.3,3,1.4,.8,.05,['#8fb6a2','#b77c61','#aa8bc5','#ceb66b'][team]);return g}if(type==='bridge'){const g=new T.Group();for(const x of [-2.2,2.2])for(const z of [-1.2,1.2])cylinder(g,x,.9,z,.16,.16,1.8,'#7a5a3d','wood');for(const z of [-1.2,1.2])box(g,0,1.35,z,5.5,.22,.18,'#8b6845','wood');for(const x of [-2.6,-.9,.9,2.6])box(g,x,1.05,0,.18,.75,2.9,'#9d7b55','wood');box(g,0,.72,0,6.2,.2,3.4,'#a88c65','wood');if(age>=2){box(g,0,.92,0,6.4,.28,3.8,'#9a9b95','stone')}return g}if(age>0){const g=createBuildingModel(type,team);g.userData.upgradeAge=age;g.add(createArchitecturalDetails(type,team,age));if(age>=2){box(g,0,.25,0,6,.5,6,'#92958d','stone');for(const x of [-2.5,2.5])box(g,x,1.8,2.6,.15,3.3,.12,'#747f84','metal')}if(age>=5){box(g,0,.2,0,6.7,.42,6.7,'#858e90','metal');box(g,1.85,5.5,-1.7,.7,3.5,.7,'#69757a','metal')}if(age>=6){for(const x of [-1.6,0,1.6])box(g,x,4.25,2.57,.8,.85,.06,'#a7cad2','plain');}if(age>=3){for(const z of [-2.7,2.7])box(g,0,2.8,z,5.7,.18,.18,'#c5b779','metal');box(g,2.1,4.2,-1.6,.7,2.5,.7,'#969c92','stone')}return g;}const key='prehistoric:'+type+team;if(!models.has(key)){const g=new T.Group(),flag=team?'#ae6650':'#748e8d';const hut=(x,z,size=1)=>{cylinder(g,x,1*size,z,1.35*size,1.65*size,2*size,'#a48c62','plain',12);cone(g,x,2.5*size,z,2*size,2.4*size,'#80684d',10);box(g,x,.65*size,z+1.5*size,.6*size,1.3*size,.08,'#302c23');for(let i=0;i<8;i++){const a=i*Math.PI/4;beam(g,[x+Math.cos(a)*1.65*size,0,z+Math.sin(a)*1.65*size],[x,3.8*size,z],.085,'#65503b')}};
if(type==='hall'){hut(0,-.4,1.35);for(let i=0;i<9;i++){const a=i*Math.PI*2/9;mesh(g,new T.DodecahedronGeometry(.3,0),'#8e9081','plain',Math.cos(a),.2,2+Math.sin(a))}cone(g,0,.6,2,.3,1,'#d58c4f',6);beam(g,[2.5,0,-1],[2.5,4,-1],.14);box(g,2.85,3.3,-1,.7,.7,.04,flag)}
else if(type==='house'){hut(0,0,1);logs(g,1.8,1.3,3)}
else if(type==='quarry'){for(let i=0;i<7;i++)mesh(g,new T.DodecahedronGeometry(.7+i%2*.25,0),'#a8aa96','plain',(i%3-1)*1.2,.4+Math.floor(i/3)*.25,Math.floor(i/3)-1);beam(g,[1,0,1.5],[1,1.5,1.5],.12);box(g,1.2,1.4,1.5,.5,.3,.14,'#929381')}
else if(type==='barracks'){hut(-.8,-.4,.85);for(let i=0;i<4;i++){beam(g,[.5+i*.4,0,1.2],[.5+i*.4,2,1.4],.07);mesh(g,new T.DodecahedronGeometry(.2,0),'#979b89','plain',.5+i*.4,2,1.4)}}
else if(type==='farm'){for(let i=0;i<4;i++){box(g,0,.05,i*.7-1.1,4,.1,.5,'#7d6849');for(let j=0;j<7;j++)beam(g,[-1.8+j*.55,.1,i*.7-1.1],[-1.8+j*.55,.65,i*.7-1.1],.04,'#c1ac67')}hut(1.5,-1.6,.45)}
else if(type==='well'){cylinder(g,0,.25,0,.9,1,.5,'#898e7a','stone',10);cylinder(g,0,.52,0,.64,.64,.04,'#32595b');logs(g,1.6,0,2)}
else{hut(-.7,-.4,.8);if(type==='lumber')logs(g,1.2,.4,6);if(type==='hunter'){for(const x of [.8,1.8])beam(g,[x,0,1.2],[x,2,1.2],.1);beam(g,[.7,1.8,1.2],[1.9,1.8,1.2],.1);box(g,1.3,1.25,1.2,.7,.9,.045,'#b39b74')}if(type==='fisher'){box(g,1.1,.2,1.2,2.2,.25,1,'#80664a','wood');for(const x of [.3,1.9])beam(g,[x,0,1],[x,2.5,1],.07);beam(g,[.3,2.5,1],[1.9,2.5,1],.05,'#d0c2a0')}if(type==='forester')for(let i=0;i<3;i++)cone(g,1.1+i*.45,.65,1,.2,1,'#67834d',6)}models.set(key,compile(g))}const root=new T.Group();for(const p of models.get(key)){const m=new T.Mesh(p.geo,p.material);m.castShadow=true;m.receiveShadow=true;root.add(m)}root.add(createArchitecturalDetails(type,team,age));root.userData.age=age;return root}
