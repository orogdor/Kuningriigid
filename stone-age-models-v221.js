// V221: the first proper Stone Age models (made by the player with an AI 3D generator, then reduced
// and re-textured for the game: tools/stone-models-v221/).
//  - human_rigged.glb: a skinned Stone Age person (17 bones) used for all Stone Age civilians,
//    with procedural idle / walk / work / carry animations and a tool in hand per profession.
//  - peamaja (hall), maja1 + maja2 (houses), woodcuter (lumber camp), kiviraidur (quarry).
// If the files fail to load the game keeps its earlier models (ASSETS stays null).
import * as T from './vendor/three.module.js';
import {loadGLB} from './glb-lite-v221.js';

const DIR='./models-v221/';
async function loadAll(){
 const names=['human_rigged','peamaja','maja1','maja2','woodcuter','kiviraidur'];
 const files=await Promise.all(names.map(n=>loadGLB(DIR+n+'.glb')));
 const out={};names.forEach((n,i)=>out[n]=files[i]);return out;
}
let ASSETS=null;
if(typeof window!=='undefined'&&typeof fetch==='function'){try{ASSETS=await loadAll();}catch(e){console.warn('V221 Stone Age models not loaded, keeping old models',e);}}
export const stoneAssetsReady=()=>!!ASSETS;

function textureOf(prim){
 if(!prim.image)return null;const t=new T.Texture(prim.image);t.flipY=false;t.colorSpace=T.SRGBColorSpace;
 t.anisotropy=4;t.wrapS=t.wrapT=T.ClampToEdgeWrapping;t.needsUpdate=true;return t;
}
const MATERIALS=new Map();
function materialFor(name,prim,opts={}){
 if(!MATERIALS.has(name))MATERIALS.set(name,new T.MeshStandardMaterial({map:textureOf(prim),roughness:.95,metalness:0,side:opts.side??T.FrontSide}));
 return MATERIALS.get(name);
}

// ------------------------------------------------------------------ buildings
// size: the longest horizontal side in detail units (≈ metres), close to the old footprints.
const BUILDINGS={hall:{file:'peamaja',size:10.5},lumber:{file:'woodcuter',size:7.2},quarry:{file:'kiviraidur',size:8.2},
 house0:{file:'maja1',size:6.2},house1:{file:'maja2',size:6.2}};
const GEO=new Map();
function buildingGeometry(file){
 if(GEO.has(file))return GEO.get(file);
 const prim=ASSETS[file].primitives[0],g=prim.geometry;g.computeBoundingBox();
 const b=g.boundingBox,c=new T.Vector3();b.getCenter(c);
 const geo=g.clone();geo.translate(-c.x,-b.min.y,-c.z);geo.computeBoundingBox();geo.computeBoundingSphere();
 const entry={geo,prim,size:b.getSize(new T.Vector3())};GEO.set(file,entry);return entry;
}
// Stone Age (age 0) replacements; returns null for anything else.
export function stoneBuildingModel(type,age,seed=0){
 if(!ASSETS||age!==0)return null;
 const key=type==='house'?'house'+((seed>>>0)%2):type;
 const def=BUILDINGS[key];if(!def)return null;
 const {geo,prim,size}=buildingGeometry(def.file);
 const s=def.size/Math.max(size.x,size.z);
 const root=new T.Group(),m=new T.Mesh(geo,materialFor(def.file,prim,{side:T.DoubleSide}));
 m.scale.setScalar(s*(type==='house'?.94+((seed>>>3)%7)*.02:1));m.castShadow=true;m.receiveShadow=true;root.add(m);
 root.userData.animations=[];root.userData.buildingType=type;root.userData.age=0;root.userData.stoneModelV221=key;
 return root;
}

// ------------------------------------------------------------------ people
export const STONE_HUMAN_KINDS=new Set(['stone_builder','stone_worker','stone_lumber','stone_miner','stone_forester','stone_fisher',
 'stone_gatherer','stone_watercarrier','stone_farmer','stone_villager','stone_settler','stone_hunter']);
export const isStoneHumanKind=k=>!!ASSETS&&STONE_HUMAN_KINDS.has(k);
const HEIGHT=1.66;  // the same height as the earlier people (1 unit ≈ 1.05 m)

const toolMat=new Map();const tm=c=>{if(!toolMat.has(c))toolMat.set(c,new T.MeshStandardMaterial({color:c,roughness:.9}));return toolMat.get(c);};
const TG=new Map();const tg=(k,f)=>{if(!TG.has(k))TG.set(k,f());return TG.get(k);};
function part(parent,geo,color,x,y,z,rx=0,ry=0,rz=0){const m=new T.Mesh(geo,tm(color));m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;parent.add(m);return m;}
// tools hang from the hand bone: the handle continues the forearm (local -Y), the head points forward (+Z)
function addTool(hand,kind){
 const g=new T.Group();g.position.set(0,-.05,.01);hand.add(g);
 const handle=(len)=>part(g,tg('h'+len,()=>new T.CylinderGeometry(.009,.011,len,6)),'#6e5235',0,-len/2+.04,0);
 if(['stone_lumber','stone_forester','stone_worker'].includes(kind)){handle(.34);part(g,tg('axe',()=>new T.BoxGeometry(.022,.07,.09)),'#8f9185',0,-.26,.045);}
 else if(kind==='stone_miner'){handle(.36);part(g,tg('pick',()=>new T.ConeGeometry(.018,.17,5)),'#8f9185',0,-.28,.06,Math.PI/2,0,0);}
 else if(kind==='stone_builder'){handle(.26);part(g,tg('ham',()=>new T.BoxGeometry(.05,.05,.07)),'#8a8478',0,-.2,.02);}
 else if(kind==='stone_fisher'||kind==='stone_hunter'){part(g,tg('spear',()=>new T.CylinderGeometry(.007,.009,.95,6)),'#7a5c3c',0,-.05,0);part(g,tg('tip',()=>new T.ConeGeometry(.014,.07,5)),'#9c9a8e',0,.45,.07);}
 else if(kind==='stone_farmer'){handle(.42);part(g,tg('hoe',()=>new T.BoxGeometry(.02,.03,.1)),'#8f9185',0,-.33,.05);}
 else if(kind==='stone_gatherer'){part(g,tg('basket',()=>new T.CylinderGeometry(.06,.045,.08,8,1,true)),'#a8874e',0,-.06,.03);}
 else if(kind==='stone_watercarrier'){part(g,tg('pot',()=>new T.SphereGeometry(.055,8,6)),'#9b6a45',0,-.07,.02);}
 return g;
}
export function createStoneHuman(parent,x,z,color,kind){
 const data=ASSETS.human_rigged,prim=data.primitives[0];
 const root=new T.Group();root.position.set(x,0,z);
 const body=new T.Group();body.scale.setScalar(HEIGHT);root.add(body);
 // skeleton from the file (bind pose = rest pose, no rotations)
 const nodeToBone=new Map(),bones=data.skin.joints.map(j=>{const b=new T.Bone();b.name=j.name;b.position.fromArray(j.translation);nodeToBone.set(j.node,b);return b;});
 data.skin.joints.forEach((j,i)=>{for(const c of j.children)bones[i].add(nodeToBone.get(c));});
 const mesh=new T.SkinnedMesh(prim.geometry,materialFor('human',prim));mesh.castShadow=true;mesh.receiveShadow=false;
 mesh.add(bones[0]);body.add(mesh);mesh.updateMatrixWorld(true);mesh.bind(new T.Skeleton(bones));
 const B=Object.fromEntries(bones.map(b=>[b.name,b]));
 // a small team-coloured band on the belt keeps factions recognisable
 const band=new T.Mesh(tg('band',()=>new T.TorusGeometry(.105,.012,4,14)),tm(color));band.rotation.x=Math.PI/2;band.scale.set(1,.72,1);band.position.y=.03;B.hips.add(band);
 const tool=addTool(B.hand_R,kind);
 // legs/arms/body/head mirror the older rigs, so code that poses people directly (village life) keeps working
 const rig={stoneHuman:true,kind,bones:B,tool,phase:(Math.abs(x*7.3+z*3.1)%6.28)||Math.random()*6.28,scale:body,
  legs:[B.thigh_L,B.thigh_R],arms:[B.upperArm_L,B.upperArm_R],body:B.spine,head:B.head};
 root.userData.rig=rig;parent.add(root);return root;
}
const R=(b,x=0,y=0,z=0)=>b.rotation.set(x,y,z);
export function animateStoneHuman(root,time,moving=false,attack=false){
 const r=root.userData.rig,B=r.bones,t=time+r.phase;
 const action=typeof attack==='object'&&attack?attack.action:null;
 for(const k in B)B[k].rotation.set(0,0,0);
 B.hips.position.y=.50;
 const breath=Math.sin(t*1.8)*.02;
 R(B.chest,breath);R(B.head,.04*Math.sin(t*.7),.12*Math.sin(t*.45),0);
 // relaxed arms (the mesh is in an A-pose)
 R(B.upperArm_L,0,0,.06);R(B.upperArm_R,0,0,-.06);R(B.forearm_L,-.12);R(B.forearm_R,-.12);
 if(moving){
  const p=t*7.2,s=Math.sin(p);
  R(B.thigh_L,-s*.55);R(B.thigh_R,s*.55);
  R(B.shin_L,Math.max(0,Math.sin(p+1.4))*.8);R(B.shin_R,Math.max(0,Math.sin(p+1.4+Math.PI))*.8);
  R(B.foot_L,-Math.max(0,-s)*.25);R(B.foot_R,-Math.max(0,s)*.25);
  R(B.upperArm_L,s*.45,0,.06);R(B.upperArm_R,-s*.45,0,-.06);R(B.forearm_L,-.25-Math.max(0,s)*.3);R(B.forearm_R,-.25-Math.max(0,-s)*.3);
  R(B.spine,.06,Math.sin(p)*.06,0);B.hips.position.y=.50+Math.abs(Math.cos(p))*.012;
 }else if(action){
  const cyc=t*2*Math.PI*.55;
  if(['chop','mine','build','forge','hunt','train','work'].includes(action)){
   const k=action==='build'?1.6:1,st=(Math.sin(cyc*k)+1)/2,hit=Math.pow(st,3);
   R(B.upperArm_R,-.3-st*2.3,0,-.1);R(B.forearm_R,-.5-st*.6);R(B.upperArm_L,-.25-st*1.6,0,.15);R(B.forearm_L,-.6-st*.4);
   R(B.spine,.12+(1-hit)*.25,.1*Math.sin(cyc),0);R(B.chest,.05);R(B.thigh_L,-.18);R(B.thigh_R,.12);R(B.shin_L,.18);
  }else if(['gather','plant','farm'].includes(action)){
   const sw=Math.sin(cyc*.7);R(B.spine,.55+.15*sw);R(B.chest,.2);R(B.head,-.3);
   R(B.upperArm_L,-.7+.35*Math.sin(cyc),0,.1);R(B.upperArm_R,-.7-.35*Math.sin(cyc),0,-.1);R(B.forearm_L,-.3);R(B.forearm_R,-.3);
   R(B.thigh_L,-.35);R(B.thigh_R,-.35);R(B.shin_L,.5);R(B.shin_R,.5);B.hips.position.y=.47;
  }else if(action==='fishing'){
   const c=(Math.sin(t*.8)+1)/2;R(B.upperArm_R,-1.2-c*.8);R(B.forearm_R,-.4);R(B.upperArm_L,-.6);R(B.forearm_L,-.9);R(B.spine,.08);
  }else if(action==='water'){
   R(B.upperArm_L,-.9+Math.sin(cyc)*.4);R(B.upperArm_R,-.9-Math.sin(cyc)*.4);R(B.forearm_L,-.6);R(B.forearm_R,-.6);R(B.spine,.15);
  }else{
   R(B.upperArm_L,-.7+Math.sin(cyc)*.2);R(B.upperArm_R,-.7-Math.sin(cyc)*.2);R(B.forearm_L,-.7);R(B.forearm_R,-.7);R(B.spine,.1);
  }
 }
 if(action==='carry'){R(B.upperArm_L,-.85,0,.05);R(B.upperArm_R,-.85,0,-.05);R(B.forearm_L,-1.1);R(B.forearm_R,-1.1);}
 const ph=typeof attack==='object'&&attack?attack.phase:(attack?.4:-1);
 if(ph>=0&&ph<=1){const sw=Math.sin(ph*Math.PI);R(B.upperArm_R,-2.3+ph*2.6,0,-.2);R(B.forearm_R,-.4);R(B.spine,.1*sw,-.3+.6*ph,0);}
 if(attack?.hit)R(B.spine,-.2);
 if(r.tool)r.tool.visible=action!=='carry';
}
