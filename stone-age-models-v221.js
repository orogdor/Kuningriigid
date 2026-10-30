// V221: the first proper Stone Age models (made by the player with an AI 3D generator, then reduced
// and re-textured for the game: tools/stone-models-v221/).
//  - human_rigged.glb: a skinned Stone Age person (17 bones) used for all Stone Age civilians,
//    with procedural idle / walk / work / carry animations and a tool in hand per profession.
//  - peamaja (hall), maja1 + maja2 (houses), woodcuter (lumber camp), kiviraidur (quarry).
// If the files fail to load the game keeps its earlier models (ASSETS stays null).
import * as T from './vendor/three.module.js';
import {createStoneEquipment} from './stone-equipment-v234.js';
import {applyStoneSize} from './stone-sizes-v224.js';
import {withStoneBuildingLOD,withStoneHumanLOD} from './stone-near-lod.js?v=224';
import {createWebStoneBuilding} from './stone-web-buildings-v2233.js?v=224';
import {animateStoneWorkerV222} from './stone-motion-v222.js';
import {loadGLB} from './glb-lite-v221.js';

const DIR='./models-v221/';
async function loadAll(){
 // The five replacements load in stone-web-buildings-v2233.js. Keep the
 // existing hall and person, without also preloading the superseded buildings.
 const names=['human_rigged','peamaja'];
 const files=await Promise.all(names.map(n=>loadGLB(n==='human_rigged'?'./models-stone-near/human_far.glb':DIR+n+'.glb')));
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
 const web=createWebStoneBuilding(type,age,seed);if(web)return web;
 if(!ASSETS||age!==0)return null;
 const key=type==='house'?'house'+((seed>>>0)%2):type;
 const def=BUILDINGS[key];if(!def||!ASSETS[def.file])return null;
 const {geo,prim,size}=buildingGeometry(def.file);
 const s=def.size/Math.max(size.x,size.z);
 const root=new T.Group(),m=new T.Mesh(geo,materialFor(def.file,prim,{side:T.DoubleSide}));
 if(!applyStoneSize(m,type,size,seed))m.scale.setScalar(s*(type==='house'?.94+((seed>>>3)%7)*.02:1));m.castShadow=true;m.receiveShadow=true;root.add(m); /* V224 real sizes */
 // V223.1: the generated quarry mesh has an unclosed rear/side opening.
 // Add recessed fractured rock cores below the visible source mesh instead of
 // a floating unsupported shell. Keep the original textured exterior intact.
 if(type==='quarry'){
  // Share geometry and the ORIGINAL quarry GLB texture: plain brown
  // placeholder backfill looked like a smooth clay blob next to the rock.
  if(!GEO.has('quarry-core-geo'))GEO.set('quarry-core-geo',new T.DodecahedronGeometry(1,1));
  const stone=materialFor(def.file,prim,{side:T.DoubleSide}),rockGeo=GEO.get('quarry-core-geo');
  for(const [x,y,z,rx,ry,rz] of [
   [0,.93,.42,2.62,.96,1.95],[-2.10,.66,.02,1.04,.78,1.18],[2.06,.78,.04,1.03,.81,1.12]
  ]){
   const boulder=new T.Mesh(rockGeo,stone);
   boulder.position.set(x,y,z);boulder.scale.set(rx,ry,rz);
   boulder.castShadow=true;boulder.receiveShadow=true;root.add(boulder);
  }
  root.userData.quarryRockBackfillV2231=true;
 }
 root.userData.animations=[];root.userData.buildingType=type;root.userData.age=0;root.userData.stoneModelV221=key;
 return withStoneBuildingLOD(root,type,def.size,seed);
}

// ------------------------------------------------------------------ people
export const STONE_HUMAN_KINDS=new Set(['stone_builder','stone_worker','stone_lumber','stone_miner','stone_forester','stone_fisher',
 'stone_gatherer','stone_watercarrier','stone_farmer','stone_villager','stone_settler','stone_hunter']);
export const isStoneHumanKind=k=>!!ASSETS&&STONE_HUMAN_KINDS.has(k);
const HEIGHT=1.66;  // the same height as the earlier people (1 unit ≈ 1.05 m)

const toolMat=new Map();const tm=c=>{if(!toolMat.has(c))toolMat.set(c,new T.MeshStandardMaterial({color:c,roughness:.9}));return toolMat.get(c);};
const TG=new Map();const tg=(k,f)=>{if(!TG.has(k))TG.set(k,f());return TG.get(k);};
function part(parent,geo,color,x,y,z,rx=0,ry=0,rz=0){const m=new T.Mesh(geo,tm(color));m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;parent.add(m);return m;}
export function createStoneHuman(parent,x,z,color,kind){
 const data=ASSETS.human_rigged,prim=data.primitives[0];
 const root=new T.Group();root.position.set(x,0,z);
 const body=new T.Group();body.scale.setScalar(HEIGHT);root.add(body);
 // skeleton from the file (bind pose = rest pose, no rotations)
 const nodeToBone=new Map(),bones=data.skin.joints.map(j=>{const b=new T.Bone();b.name=j.name;b.position.fromArray(j.translation);nodeToBone.set(j.node,b);return b;});
 data.skin.joints.forEach((j,i)=>{for(const c of j.children)bones[i].add(nodeToBone.get(c));});
 const mesh=new T.SkinnedMesh(prim.geometry,materialFor('human',prim));mesh.castShadow=true;mesh.receiveShadow=false;
 mesh.add(bones[0]);mesh.updateMatrixWorld(true);mesh.bind(new T.Skeleton(bones));body.add(bones[0]);body.add(withStoneHumanLOD(mesh));
 const B=Object.fromEntries(bones.map(b=>[b.name,b]));
 // a small team-coloured band on the belt keeps factions recognisable
 const band=new T.Mesh(tg('band',()=>new T.TorusGeometry(.105,.012,4,14)),tm(color));band.rotation.x=Math.PI/2;band.scale.set(1,.72,1);band.position.y=.03;B.hips.add(band);
 const tool=createStoneEquipment(kind);B.hand_R.add(tool);
 // legs/arms/body/head mirror the older rigs, so code that poses people directly (village life) keeps working
 const rig={stoneHuman:true,kind,bones:B,tool,phase:(Math.abs(x*7.3+z*3.1)%6.28)||Math.random()*6.28,scale:body,
  legs:[B.thigh_L,B.thigh_R],arms:[B.upperArm_L,B.upperArm_R],body:B.spine,head:B.head};
 root.userData.rig=rig;parent.add(root);return root;
}
// V222: same V221 model, replaced with state-blended job-specific motion.
export function animateStoneHuman(root,time,moving=false,attack=false){
 return animateStoneWorkerV222(root,time,moving,attack);
}
