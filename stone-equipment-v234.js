// V234 — shared low-poly but sculpted Stone Age equipment.
// All pieces are proper curved/extruded meshes, reuse geometry and materials,
// and are attached to animated wrist bones, never floating in world space.
import * as T from './vendor/three.module.js';

const geometry=new Map(),materials=new Map();
const palettes={
  shaft:['#775135',.97,0], bark:['#513820',1,0],
  cord:['#b8a17b',1,0], reed:['#a28753',1,0], weave:['#76603b',1,0],
  flint:['#6c7773',.95,0], edge:['#9da7a0',.9,0],
  leather:['#76543a',.98,0], hide:['#b28f63',1,0],
  pottery:['#a16d4c',1,0], darkpot:['#754a35',1,0]
};
function geo(k,make){if(!geometry.has(k)){const g=make();g.userData.shared=true;geometry.set(k,g);}return geometry.get(k);}
function mat(k){if(!materials.has(k)){const c=palettes[k];materials.set(k,()=>new T.MeshStandardMaterial({color:c[0],roughness:c[1],metalness:c[2],side:T.DoubleSide}));}return materials.get(k);}
function add(g,key,m,x=0,y=0,z=0){
 const o=new T.Mesh(geo(key,typeof m==='function'?m:()=>m),mat(key.startsWith('flint')?'flint':key.startsWith('edge')?'edge':key.startsWith('reed')?'reed':key.startsWith('weave')?'weave':key.startsWith('pottery')?'pottery':key.startsWith('darkpot')?'darkpot':key.startsWith('cord')?'cord':key.startsWith('leather')?'leather':key.startsWith('hide')?'hide':key.startsWith('bark')?'bark':'shaft'));
 o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;
}
function cylinder(g,key,r,h,x,y,z,r2=r,seg=8){
 return add(g,key+'-'+r+'-'+h+'-'+r2+'-'+seg,()=>new T.CylinderGeometry(r,r2,h,seg),x,y,z);
}
function band(g,x,y,z,r=.014){const o=add(g,'cord-ring'+r,()=>new T.TorusGeometry(r,.003,4,9),x,y,z);o.rotation.x=Math.PI/2;return o;}
function stone(g,style,x,y,z,scale=1){
 const shape=new T.Shape();
 const pts=style==='axe'?[[-.022,-.08],[.05,-.105],[.13,-.08],[.15,0],[.12,.075],[.04,.1],[-.025,.064]]:
 style==='pick'?[[-.19,-.012],[-.12,.023],[-.035,.038],[.06,.048],[.15,.015],[.19,-.016],[.07,-.025],[-.03,-.036]]:
 style==='spear'?[[-.025,-.10],[-.05,.02],[0,.22],[.052,.02],[.023,-.10]]:
 style==='knife'?[[-.03,-.12],[-.055,0],[-.01,.17],[.04,.07],[.055,-.045],[.024,-.12]]:
 style==='hoe'?[[-.06,-.035],[.08,-.045],[.16,.005],[.07,.055],[-.06,.045]]:
 [[-.05,-.035],[.04,-.055],[.08,.005],[.04,.05],[-.05,.04]];
 pts.forEach(([a,b],i)=>i?shape.lineTo(a,b):shape.moveTo(a,b));shape.closePath();
 const key='flint-'+style;
 const o=add(g,key,()=>new T.ExtrudeGeometry(shape,{depth:.019,steps:1,bevelEnabled:true,bevelThickness:.005,bevelSize:.004,bevelSegments:1,curveSegments:2}),x,y,z);
 o.scale.setScalar(scale);return o;
}
function pole(g,len=.44,y=0,r=.012){
 cylinder(g,'shaft',r,len,0,y,0,r*.88,9);
 for(const n of [-.33,.33])band(g,0,y+len*n,0,r+.002);
}
function rope(g,points,key='cord'){
 const vec=points.map(p=>new T.Vector3(...p));
 const path=new T.CatmullRomCurve3(vec);
 return add(g,key+'-tube-'+points.map(p=>p.join('_')).join('-'),()=>new T.TubeGeometry(path,18,.003,4,false));
}
function basket(g,x=0,y=-.15,z=.04,s=1){
 const b=new T.Group();b.position.set(x,y,z);b.scale.setScalar(s);g.add(b);
 const wall=cylinder(b,'weave',.085,.125,0,.055,0,.066,12);
 wall.geometry.userData.shared=true;
 cylinder(b,'weave',.068,.009,0,-.006,0,.068,12);
 for(const h of [.009,.04,.075,.105]){
  const o=add(b,'reed-ring'+h,()=>new T.TorusGeometry(.067+(h+.007)*.14,.004,4,16),0,h,0);
  o.rotation.x=Math.PI/2;
 }
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6,r=.073;
  const stem=cylinder(b,'reed',.003,.127,r*Math.cos(a),.056,r*Math.sin(a),.003,5);
  stem.rotation.z=-Math.sin(a)*.10;stem.rotation.x=Math.cos(a)*.10;
 }
 rope(b,[[-.069,.113,0],[-.052,.166,0],[0,.182,0],[.052,.166,0],[.069,.113,0]],'leather');
 return b;
}
function jug(g,x=0,y=-.16,z=.04,s=1){
 const o=new T.Group();o.position.set(x,y,z);o.scale.setScalar(s);g.add(o);
 const points=[[0,0],[.045,.01],[.072,.038],[.069,.085],[.052,.113],[.044,.149],[.055,.166],[.054,.172]];
 add(o,'pottery-jug',()=>new T.LatheGeometry(points.map(([a,b])=>new T.Vector2(a,b)),12));
 const lip=add(o,'darkpot-rim',()=>new T.TorusGeometry(.055,.006,5,16),0,.168,0);lip.rotation.x=Math.PI/2;
 rope(o,[[.054,.142,0],[.092,.124,0],[.097,.078,0],[.068,.055,0]],'pottery');
 return o;
}
function sack(g,x=0,y=0,z=0,s=1){
 const b=new T.Group();b.position.set(x,y,z);b.scale.setScalar(s);g.add(b);
 const body=add(b,'hide-sack',()=>new T.SphereGeometry(.112,10,8),0,.11,0);
 body.scale.set(.92,1.2,.72);
 cylinder(b,'leather',.058,.015,0,.220,0,.057,10);
 for(let i=0;i<4;i++){
  const ang=i*Math.PI/2,xx=Math.cos(ang)*.05,zz=Math.sin(ang)*.05;
  const knot=cylinder(b,'cord',.005,.055,xx,.241,zz,.004,5);
  knot.rotation.x=Math.sin(ang)*.37;knot.rotation.z=Math.cos(ang)*.37;
 }
 const strap=rope(b,[[-.08,.08,-.02],[-.08,.26,-.035],[.08,.26,-.035],[.08,.08,-.02]],'leather');
 return b;
}
function bundle(g){
 const c=new T.Group();g.add(c);
 for(let i=0;i<4;i++){
  const o=cylinder(c,'bark',.018,.35,(i-1.5)*.038,-.075,.02+(i%2)*.03,.019,7);
  o.rotation.z=(i-1.5)*.09;
 }
 for(let a of [-.18,.02])rope(c,[[-.09,a,.06],[0,a,.075],[.095,a,.06]],'cord');
 return c;
}
export function createStoneEquipment(kind){
 const g=new T.Group();g.name='v234-equipment-'+kind;g.userData.equipmentV234=kind;
 if(['stone_lumber','stone_forester','stone_worker','axeman'].includes(kind)){
  pole(g,.50,-.025,.013);stone(g,'axe',.045,.19,.005,.9);
  for(const y of [.14,.20])rope(g,[[-.01,y,-.02],[.018,y,.02],[.057,y,.035]],'cord');
 }else if(['stone_miner','pick'].includes(kind)){
  pole(g,.47,-.025,.012);stone(g,'pick',0,.18,0,.85);band(g,0,.18,0,.017);
 }else if(['stone_builder','hammer'].includes(kind)){
  pole(g,.39,-.045,.014);
  const head=add(g,'flint-hammer',()=>new T.IcosahedronGeometry(.075,0),0,.135,0);
  head.scale.set(1.1,.70,.7);band(g,0,.135,0,.018);
 }else if(['stone_farmer','hoe'].includes(kind)){
  pole(g,.60,-.12,.012);const head=stone(g,'hoe',.08,-.39,.005,.8);head.rotation.z=-.26;
  band(g,0,-.36,0,.018);
 }else if(['stone_fisher','stone_hunter','spearman','scout','militia'].includes(kind)){
  pole(g,1.00,0,.0085);stone(g,'spear',0,.53,0,.73);
  for(const y of [.425,.464])band(g,0,y,0,.011);
 }else if(kind==='slinger'){
  rope(g,[[0,.0,0],[.045,-.20,.015],[.09,-.31,.015]],'cord');
  rope(g,[[.01,0,0],[-.01,-.22,.025],[.06,-.33,.02]],'cord');
  const pouch=add(g,'leather-pouch',()=>new T.SphereGeometry(.055,8,6),.075,-.34,.02);
  pouch.scale.set(1,.20,.63);
 }else if(['stone_gatherer','basket'].includes(kind))basket(g,0,-.17,.035,1);
 else if(['stone_watercarrier','jug'].includes(kind))jug(g,0,-.17,.05,.90);
 else if(kind==='archer-bow'){
  rope(g,[[-.01,-.51,0],[-.22,-.30,0],[-.26,0,0],[-.22,.3,0],[-.01,.51,0]],'bark');
  cylinder(g,'cord',.003,1.02,-.01,0,0,.003,5);
  band(g,-.26,0,0,.015);
 }else if(kind==='stone-knife'){
  pole(g,.18,-.08,.015);stone(g,'knife',0,.115,.01,.7);
 }else if(kind==='knife-sheath'){
  const q=add(g,'leather-sheath',()=>new T.CylinderGeometry(.02,.042,.26,8),0,-.12,0);
  q.rotation.z=.06;rope(g,[[-.022,-.015,.02],[.025,-.015,.02]],'cord');
 }
 return g;
}
export function createStoneLoad(kind='sack'){
 const g=new T.Group();g.name='v234-load-'+kind;g.userData.loadV234=kind;
 if(kind==='basket')basket(g,0,-.06,0,1.5);
 else if(kind==='jug')jug(g,0,-.08,0,1.4);
 else if(kind==='wood')bundle(g);
 else if(kind==='settler'){
  sack(g,0,0,0,1.15);
  const a=rope(g,[[-.09,.06,-.05],[-.20,.13,-.035],[-.17,.22,.045]],'leather');
 }else sack(g,0,-.09,0,1.2);
 return g;
}
export const STONE_EQUIPMENT_KINDS=['stone_lumber','stone_forester','stone_worker','stone_miner','stone_builder','stone_farmer','stone_fisher','stone_hunter','stone_gatherer','stone_watercarrier','spearman','axeman','scout','militia','slinger','archer-bow','stone-knife','knife-sheath'];
