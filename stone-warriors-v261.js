// V261: three NEW equipped, articulated Stone Age warrior looks on the verified
// 17-bone skinned V221 human. Never use the malformed, unrigged TRELLIS V259 meshes.
// The source body's skin weights, textured high LOD and skeleton remain intact.
import * as T from './vendor/three.module.js';
import {loadStoneHumanV241,createStoneHuman} from './stone-age-models-v221.js?v=224';
import {createStoneEquipment} from './stone-equipment-v234.js';
import {animateStoneWorkerV222} from './stone-motion-v222.js';

const WARRIORS=new Set(['axeman','spearman','slinger']);
export const isRiggedStoneWarriorV261=kind=>WARRIORS.has(kind);
export function loadRiggedStoneWarriorV261(kind){
 return WARRIORS.has(kind)?loadStoneHumanV241():Promise.resolve(false);
}

const materials=new Map(),geometries=new Map();
function material(hex){
 if(!materials.has(hex))materials.set(hex,new T.MeshStandardMaterial({
  color:hex,roughness:.95,metalness:0,side:T.DoubleSide
 }));
 return materials.get(hex);
}
function geometry(key,make){
 if(!geometries.has(key)){const g=make();g.userData.shared=true;geometries.set(key,g);}
 return geometries.get(key);
}
function piece(parent,name,geom,hex,pos,scale=[1,1,1],rot=[0,0,0]){
 const mesh=new T.Mesh(geom,material(hex));mesh.name=name;
 mesh.position.set(...pos);mesh.scale.set(...scale);mesh.rotation.set(...rot);
 mesh.castShadow=true;mesh.receiveShadow=false;parent.add(mesh);return mesh;
}
function ellipsoid(parent,name,hex,pos,radii,detail=1){
 return piece(parent,name,geometry('pebble-'+detail,()=>new T.IcosahedronGeometry(1,detail)),hex,pos,radii);
}
function strap(parent,name,points,hex,radius=.009){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
 const key=points.map(p=>p.join(',')).join('|')+radius;
 return piece(parent,name,geometry('strap-'+key,()=>new T.TubeGeometry(curve,24,radius,6,false)),hex,[0,0,0]);
}
function hideTunic(bones,kind){
 // The cloth shell is carefully shaped in cross section (not a box) and bound
 // to the chest pivot. The underlying person stays a genuinely skinned mesh.
 const chest=bones.chest;
 const profiles=kind==='axeman'?
  [[.164,-.195],[.167,-.13],[.157,-.055],[.145,.035],[.112,.135]]:
  kind==='spearman'?
  [[.142,-.205],[.143,-.13],[.15,-.035],[.135,.065],[.10,.135]]:
  [[.118,-.19],[.122,-.13],[.131,-.035],[.126,.05],[.095,.125]];
 const color=kind==='axeman'?'#5c4730':kind==='spearman'?'#76613f':'#887957';
 const shell=piece(chest,'V261 sculpted leather tunic',geometry('tunic-'+kind,()=>{
  const points=profiles.map(([r,y])=>new T.Vector2(r,y));
  const geo=new T.LatheGeometry(points,16,0,Math.PI*2);
  geo.scale(1,1,.67);geo.computeVertexNormals();return geo;
 }),color,[0,0,0]);
 // Diagonal belt and shoulder seams are sculpted rope/tube curves.
 strap(chest,'Leather diagonal strap',[[-.12,.10,.09],[-.08,.04,.112],[0,-.05,.115],[.085,-.15,.09]],'#42301f',.012);
 strap(chest,'Waist belt',[[-.15,-.15,.01],[-.12,-.15,.105],[0,-.15,.114],[.12,-.15,.105],[.15,-.15,.01]],'#3c2b20',.016);
 ellipsoid(chest,'Belt clasp','#a09473',[0,-.148,.125],[.028,.025,.014],1);
 // A notched irregular hem removes the featureless cylindrical silhouette.
 const hemPoints=[[-.145,-.185,.018],[-.12,-.203,.105],[-.04,-.214,.115],[.05,-.197,.112],[.14,-.202,.04]];
 strap(chest,'Stitched hem',hemPoints,'#a18c68',.006);
 return shell;
}
function capeAndFur(bones,kind){
 const chest=bones.chest;
 if(kind!=='slinger'){
  const geo=geometry('cape-'+kind,()=>{
   const verts=[],ids=[],rows=7,cols=8;
   const width=kind==='axeman'?.32:.24,drop=kind==='axeman'?.44:.36;
   for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
    const u=x/cols*2-1,v=y/rows;
    verts.push(u*(width*.5)*(1+.36*v),.12-v*drop,-.13-.024*Math.sin(Math.PI*v)-.022*Math.cos(u*5+v*4)*v);
   }
   for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const a=y*(cols+1)+x,b=a+cols+1;
    ids.push(a,b,a+1,a+1,b,b+1);
   }
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));
   g.setIndex(ids);g.computeVertexNormals();return g;
  });
  piece(chest,'Animated rawhide shoulder cape',geo,kind==='axeman'?'#584c38':'#61563e',[0,0,0]);
 }
 for(const side of [-1,1]){
  const shoulder=bones[side<0?'upperArm_R':'upperArm_L'];
  ellipsoid(shoulder,'Fur shoulder mantle',kind==='axeman'?'#877556':'#a08b67',[side*.008,-.014,-.016],[.098,.054,.090],1);
  for(let i=0;i<3;i++){
   ellipsoid(shoulder,'Fur edge',i%2?'#a99a79':'#736044',[side*.025+(i-1)*.029,-.066,-.01],[.029,.064,.030],0);
  }
 }
}
function bodyDetails(bones,kind,grade,color){
 const dark=kind==='slinger'?'#665036':'#6b4b30';
 for(const side of [-1,1]){
  const prefix=side<0?'R':'L';
  const arm=bones['forearm_'+prefix],shin=bones['shin_'+prefix];
  piece(arm,'Leather bracer',geometry('bracer',()=>new T.CylinderGeometry(.046,.056,.13,12,3)),dark,[0,-.057,0],[1,1,.78],[0,0,-side*.045]);
  for(const y of [-.10,-.03]){
   const ring=piece(arm,'Bracer binding',geometry('brace-ring',()=>new T.TorusGeometry(.051,.007,5,14)),'#ac946c',[0,y,0]);
   ring.rotation.x=Math.PI/2;ring.scale.y=.85;
  }
  piece(shin,'Stone Age shin wrap',geometry('shin-wrap',()=>new T.CylinderGeometry(.061,.045,.17,12,3)),'#7b664a',[0,-.087,0],[1,1,.78]);
 }
 if(kind==='axeman'){
  ellipsoid(bones.hips,'Flint axe belt pouch','#604530',[.15,-.06,.09],[.065,.083,.046],1);
  ellipsoid(bones.chest,'Neck tooth ornament','#ded3af',[0,.075,.16],[.020,.048,.011],1);
 }else if(kind==='spearman'){
  // Additional small rawhide shield bound to the LEFT wrist, never in world space.
  const hand=bones.hand_L,shield=new T.Group();shield.name='Leather and wood shield';
  shield.position.set(.025,-.055,.13);shield.rotation.x=-.17;hand.add(shield);
  const shape=new T.Shape();
  shape.moveTo(0,.215);shape.bezierCurveTo(.18,.18,.17,-.10,0,-.24);
  shape.bezierCurveTo(-.17,-.10,-.18,.18,0,.215);
  piece(shield,'Carved shield',geometry('hide-shield',()=>new T.ExtrudeGeometry(shape,{
   depth:.023,steps:1,bevelEnabled:true,bevelSize:.009,bevelThickness:.009,bevelSegments:2,curveSegments:8
  })),'#684c34',[0,0,0]);
  strap(shield,'Shield straps',[[-.11,.075,.034],[0,.14,.040],[.11,.075,.034]],'#a28a62',.012);
  ellipsoid(shield,'Shield boss','#9b8d6d',[0,0,.04],[.050,.047,.022],1);
 }else{
  // A slingman's stone pouch and layered wool sash distinguish the ranged unit.
  ellipsoid(bones.hips,'Sling stone bag','#695038',[.145,-.06,.10],[.082,.095,.055],1);
  const stone=geometry('smooth-stone',()=>new T.IcosahedronGeometry(.029,1));
  for(let i=0;i<3;i++)piece(bones.hips,'Stone ammunition',stone,'#9c9a87',[.11+i*.026,-.005,.15]);
  strap(bones.chest,'Cross-body sling strap',[[.12,.11,.085],[.055,.035,.124],[-.06,-.08,.123],[-.14,-.16,.085]],'#ad9568',.014);
 }
 const head=bones.head;
 const band=piece(head,'Braided hair headband',geometry('headband',()=>new T.TorusGeometry(.082,.016,6,18)),'#4e3825',[0,.035,-.004]);
 band.rotation.x=Math.PI/2;band.scale.y=.82;
 if(grade==='elite'){
  for(const side of [-1,1])
   ellipsoid(bones.chest,'Elite bone bead','#d4c9a0',[side*.093,.08,.10],[.020,.033,.016],1);
 }
 // The faction strip follows the chest bone instead of floating during motion.
 const flag=piece(bones.chest,'Faction cloth strip',geometry('banner',()=>{
  const shape=new T.Shape();shape.moveTo(-.035,0);shape.lineTo(.035,0);
  shape.lineTo(.025,-.16);shape.lineTo(-.02,-.20);shape.closePath();
  return new T.ExtrudeGeometry(shape,{depth:.003,bevelEnabled:false});
 }),color,[.10,-.09,.105]);
 flag.rotation.z=-.12;
}

export function createRiggedStoneWarriorV261(parent,x,z,color,kind,grade='standard'){
 if(!WARRIORS.has(kind))throw new Error('No V261 Stone Age warrior: '+kind);
 const model=createStoneHuman(parent,x,z,color,'stone_villager');
 const rig=model.userData.rig,B=rig.bones;
 if(!rig.stoneHuman||!B.hips||!B.head||!B.hand_R||!B.hand_L)
  throw new Error('V261 expected the actual V221 17-bone skinned human');
 if(rig.tool){rig.tool.removeFromParent();}
 const tool=createStoneEquipment(kind);tool.name='V261 '+kind+' handheld weapon';
 B.hand_R.add(tool);
 hideTunic(B,kind);capeAndFur(B,kind);bodyDetails(B,kind,grade,color);
 Object.assign(rig,{stoneHuman:true,riggedWarriorV261:true,kind,unitKind:kind,tool,phase:x*2+z});
 Object.assign(model.userData,{unitKind:kind,grade,factionColor:color,riggedWarriorV261:true});
 model.name='V261 rigged Stone Age '+kind;
 return model;
}
function smoothstep(a,b,t){const x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*(3-2*x);}
export function animateRiggedStoneWarriorV261(root,time,moving=false,attack=false){
 const r=root.userData.rig;if(!r?.riggedWarriorV261)return false;
 animateStoneWorkerV222(root,time,moving,attack);
 const b=r.bones;
 const phase=attack&&typeof attack==='object'?attack.phase??-1:attack?.4:-1;
 const active=phase>=0&&phase<=1;
 if(!active){
  // Weapon-specific rest stance; the underlying 17-bone gait remains animated.
  b.upperArm_R.rotation.x-=moving?.08:.42;
  b.forearm_R.rotation.x-=moving?.05:.28;
  if(r.kind==='spearman')b.upperArm_L.rotation.x-=.22;
  return true;
 }
 const wind=smoothstep(.04,.32,phase)*(1-smoothstep(.38,.51,phase));
 const strike=smoothstep(.31,.51,phase)*(1-smoothstep(.67,.92,phase));
 if(r.kind==='axeman'){
  b.upperArm_R.rotation.x-=1.13*wind;b.forearm_R.rotation.x-=.45*wind;
  b.upperArm_R.rotation.x+=.75*strike;b.chest.rotation.x+=.22*strike;
  b.upperArm_L.rotation.x-=.18*wind;
 }else if(r.kind==='spearman'){
  b.upperArm_R.rotation.x-=.82*wind;
  b.forearm_R.rotation.x-=.34*wind;
  b.upperArm_R.rotation.x+=.55*strike;
  b.chest.rotation.y+=.19*wind-.20*strike;
  b.thigh_L.rotation.x-=.17*strike;
 }else{
  const spin=Math.sin(phase*Math.PI*5)*wind;
  b.upperArm_R.rotation.z+=.66*spin;
  b.forearm_R.rotation.x-=.55*wind;
  b.upperArm_R.rotation.x+=.63*strike;
  b.chest.rotation.y+=.32*wind-.37*strike;
 }
 return true;
}
