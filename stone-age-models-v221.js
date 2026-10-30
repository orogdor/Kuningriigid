// V221: the first proper Stone Age models (made by the player with an AI 3D generator, then reduced
// and re-textured for the game: tools/stone-models-v221/).
//  - human_rigged.glb: a skinned Stone Age person (17 bones) used for all Stone Age civilians,
//    with procedural idle / walk / work / carry animations and a tool in hand per profession.
//  - peamaja (hall), maja1 + maja2 (houses), woodcuter (lumber camp), kiviraidur (quarry).
// If the files fail to load the game keeps its earlier models (ASSETS stays null).
import * as T from './vendor/three.module.js';
import {createStoneEquipment} from './stone-equipment-v234.js';
import {withStoneBuildingLOD,withStoneHumanLOD} from './stone-near-lod.js?v=224';
import {animateStoneWorkerV222} from './stone-motion-v222.js';
import {loadGLB} from './glb-lite-v221.js';
import {requestAssetV241} from './asset-queue-v241.js';

let ASSETS=null;
export function loadStoneHumanV241(){
 return requestAssetV241('stone-human',async()=>{
  ASSETS={human_rigged:await loadGLB('./models-stone-near/human_far.glb')};return true;
 });
}
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
const BUILDINGS={hall:10.5,lumber:7.2,quarry:8.2,house:6.2,well:3.4,farm:8.2};
export function stoneBuildingModel(type,age,seed=0,low=null){
 if(age!==0||!low||!BUILDINGS[type])return null;
 low.userData.stoneModelV221=type;
 return withStoneBuildingLOD(low,type,BUILDINGS[type],seed);
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
