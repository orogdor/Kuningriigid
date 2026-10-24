import * as T from './vendor/three.module.js';
import {MINERAL_BUILDINGS,COASTAL_BUILDINGS} from './resource-sites-v88.js';
import {depositGeometry,miningSiteGeometry,SETTLEMENT_MATERIAL} from './world-models-v152.js?v=158a';
const materials=new Map();
function material(color){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.86}));return materials.get(color);}
function mesh(g,geometry,color,x,y,z){const m=new T.Mesh(geometry,material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
const box=(g,x,y,z,w,h,d,c)=>mesh(g,new T.BoxGeometry(w,h,d),c,x,y,z);
const cylinder=(g,x,y,z,r,h,c)=>mesh(g,new T.CylinderGeometry(r,r,h,12),c,x,y,z);
function beam(g,a,b,r,c){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av),m=mesh(g,new T.CylinderGeometry(r,r,v.length(),8),c,...av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;}
function disk(g,r,y,c){const m=mesh(g,new T.CircleGeometry(r,24),c,0,y,0);m.rotation.x=-Math.PI/2;m.castShadow=false;return m;}
function ring(g,inner,outer,y,c){const m=mesh(g,new T.RingGeometry(inner,outer,24),c,0,y,0);m.rotation.x=-Math.PI/2;return m;}
const colors={stone:'#a3a49b',ore:'#99674d',copper:'#af7850',tin:'#aab9b7',clay:'#b98a64',gems:'#8377a5',oil:'#4d4940'};

// V158: new soft, vertex-coloured deposit and extraction-site models (world-models-v152.js).
export function createDepositPile(kind){
 const g=new T.Group();g.userData.mineralDeposit=kind;
 const m=new T.Mesh(depositGeometry(kind),SETTLEMENT_MATERIAL);m.castShadow=true;m.receiveShadow=true;g.add(m);
 return g;
}
export function createMiningSite(type,team,age){
 const kind=MINERAL_BUILDINGS[type];if(!kind||type==='oilwell')return null;
 const g=new T.Group(),underground=age>=3&&!['quarry','claypit'].includes(type),modern=age>=5,metal=modern?'#697981':'#79563b';
 Object.assign(g.userData,{buildingType:type,extractionSite:true,underground,age});
 {const m=new T.Mesh(miningSiteGeometry(type,kind,age),SETTLEMENT_MATERIAL);m.castShadow=true;m.receiveShadow=true;g.add(m);return g;}
 if(underground){
  disk(g,1.65,.12,'#151a1c');ring(g,1.65,2.15,.22,modern?'#939c98':'#8d8270');
  for(const x of [-1.9,1.9])beam(g,[x,.1,-1.2],[x,5.5,-1.2],.19,metal);
  beam(g,[-2.1,5.3,-1.2],[2.1,5.3,-1.2],.18,metal);beam(g,[-1.9,.2,-1.2],[1.9,5,-1.2],.09,metal);
  const wheel=mesh(g,new T.TorusGeometry(.72,.09,8,16),'#6d7678',0,5.4,-1.2);wheel.rotation.y=Math.PI/2;
  beam(g,[0,5.4,-1.2],[0,.35,0],.035,'#363c3d');
  box(g,2.6,.8,1,1.5,1.1,1.4,modern?'#6f8a85':'#9d794d');cylinder(g,2.6,1.65,1,.5,.28,'#505f64');
  if(modern){box(g,-2.9,1.2,1,1.6,2.3,1.7,'#819293');box(g,-2.9,2.5,1,1.8,.18,1.9,'#4e6166');}
 }else{
  disk(g,3.35,.07,'#514b3e');ring(g,2.1,3.5,.12,colors[kind]);ring(g,1.25,2.1,.08,'#746d59');disk(g,1.2,.09,'#282b26');
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9;mesh(g,new T.DodecahedronGeometry(.5,0),colors[kind],Math.sin(a)*2.9,.45,Math.cos(a)*2.9);}
  beam(g,[2.2,.1,-2],[2.2,3.3,-2],.14,metal);beam(g,[2.2,3,-2],[.4,3,-1.2],.12,metal);beam(g,[.4,3,-1.2],[.4,.4,-1.2],.025,'#c4b58f');
  if(modern){box(g,-3.4,.8,1,1.8,1.1,2.1,'#b69b4e');beam(g,[-3.4,1.2,1],[-1.2,2.5,0],.23,'#b69b4e');beam(g,[-1.2,2.5,0],[0,.4,0],.18,'#b69b4e');}
 }
 box(g,2.9,.55,3,1.4,.6,1.1,modern?'#7c898a':'#97754c');
 for(const x of [2.4,3.4])for(const z of [2.65,3.35])cylinder(g,x,.2,z,.22,.25,'#494f4d');
 if(age>=2)for(const x of [-.45,.45])box(g,x,.11,3.1,.08,.1,2.4,'#727b7a');
 return g;
}
export function createCoastalBuilding(type,team,age){
 if(!COASTAL_BUILDINGS.has(type))return null;
 const g=new T.Group(),land=new T.Group(),water=new T.Group(),harbor=type==='harbor',length=harbor?8:6;
 land.name='land-section';water.name='sea-section';g.add(land,water);
 Object.assign(g.userData,{buildingType:type,coastalSite:true,landSide:'+Z',seaSide:'-Z',age});
 // The hut/store sits inland. The pier has open water below its pilings.
 box(land,0,.3,3,5,.6,5,age>=2?'#a5a395':'#957955');
 box(land,0,1.65,3,3.7,2.3,3.2,age>=2?'#c2b89c':'#b09a74');
 box(land,0,1.2,4.64,1.05,1.8,.08,'#333c36');
 for(const side of [-1,1]){const roof=box(land,side*1.1,3.2,3,2.55,.23,4,'#816449');roof.rotation.z=-side*.43;}
 box(water,0,.42,-length/2,harbor?3.6:2.5,.25,length+1,'#9b7c52');
 for(let z=-1;z>=-length;z-=2)for(const x of [-1.45,1.45])cylinder(water,x,-.65,z,.16,2.6,'#68553d');
 for(let z=-.2;z>=-length;z-=.4)box(water,0,.58,z,harbor?3.65:2.55,.05,.07,'#725c41');
 if(harbor){box(water,0,.42,-length,7,.25,2.6,'#a18458');beam(water,[2,.5,-5],[2,4.8,-5],.13,'#67553f');beam(water,[2,4.6,-5],[-.4,4.6,-6],.12,'#67553f');beam(water,[-.4,4.6,-6],[-.4,1,-6],.025,'#c2b58b');}
 else{for(const x of [-1,1])beam(water,[x,.6,-4],[x,2.5,-4],.06,'#806c4b');beam(water,[-1,2.5,-4],[1,2.5,-4],.05,'#806c4b');for(let i=0;i<7;i++)beam(water,[-1+i/3,1,-4],[-1+i/3,2.5,-4],.012,'#b8ae8e');}
 box(land,2.3,.8,2.5,.8,.9,.8,'#9a784d');cylinder(land,-2.2,.9,3.3,.45,1.2,'#826446');
 return g;
}
