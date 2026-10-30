// V223.5: detailed Stone Age models, plus a scalable procedural field.
import * as T from './vendor/three.module.js';
import {withStoneBuildingLOD} from './stone-near-lod.js?v=224';
const TYPES=new Set(['claypit','pottery_kiln','pasture','mason']);
let fieldShared;
function makeField(){
 if(fieldShared)return fieldShared;
 const soil=new T.MeshStandardMaterial({color:0x59402b,roughness:1}),ridge=new T.MeshStandardMaterial({color:0x785437,roughness:1}),stalkMat=new T.MeshStandardMaterial({color:0xe1c678,roughness:1});
 const ground=new T.BoxGeometry(16,.12,16),furrow=new T.BoxGeometry(1.36,.23,15.5),stem=new T.CylinderGeometry(.018,.03,.8,5),head=new T.SphereGeometry(.075,5,4);
 fieldShared={soil,ridge,stalkMat,ground,furrow,stem,head};return fieldShared;
}
// V237: near and far use the same crop and soil palette. Never fall back
// to the unrelated V158 cubic-field geometry when crossing the LOD threshold.
// Repeat a small grain stem/ear mesh to support fields of any dimensions.
function fieldVisual(shared,far=false){
 const group=new T.Group();group.name=far?'V237 field far':'V237 field near';
 const soil=new T.Mesh(shared.ground,shared.soil);soil.position.y=.06;soil.receiveShadow=true;group.add(soil);
 for(let row=0;row<8;row++){
  const furrow=new T.Mesh(shared.furrow,shared.ridge);
  furrow.position.set(-7+2*row,.16,0);furrow.receiveShadow=true;group.add(furrow);
 }
 const clumps=far?12:23,stalks=far?2:3,count=8*clumps*stalks;
 const stems=new T.InstancedMesh(shared.stem,shared.stalkMat,count);
 const heads=new T.InstancedMesh(shared.head,shared.stalkMat,count);
 const dummy=new T.Object3D();
 let n=0;
 for(let row=0;row<8;row++)for(let z=0;z<clumps;z++)for(let k=0;k<stalks;k++){
  const wobble=Math.sin(row*77+z*19+k*7),height=.66+.17*Math.sin(row*15+z*3+k*11);
  const x=-7+2*row+(k-(stalks-1)/2)*.23+wobble*.06;
  const zz=-7.55+z*15.1/(clumps-1)+wobble*.12;
  dummy.position.set(x,.27+height*.5,zz);
  dummy.scale.set(1,height/.8,1);dummy.rotation.set(0,0,wobble*.10);dummy.updateMatrix();
  stems.setMatrixAt(n,dummy.matrix);
  dummy.position.set(x+wobble*.04,.27+height,zz);
  dummy.scale.set(.7,1.7,.7);dummy.rotation.set(0,0,0);dummy.updateMatrix();
  heads.setMatrixAt(n,dummy.matrix);n++;
 }
 stems.instanceMatrix.needsUpdate=true;heads.instanceMatrix.needsUpdate=true;
 stems.castShadow=!far;heads.castShadow=!far;stems.receiveShadow=true;heads.receiveShadow=true;
 stems.name=far?'V237 distant stalks':'V237 near stalks';
 heads.name=far?'V237 distant grain heads':'V237 near grain heads';
 group.add(stems,heads);group.userData.fieldPlantsV237=count;
 return group;
}
function fieldLOD(low){
 const shared=makeField(),near=fieldVisual(shared,false),far=fieldVisual(shared,true);
 const root=new T.LOD();root.addLevel(near,0);root.addLevel(far,100,.05);
 Object.assign(root.userData,low.userData);
 root.userData.stoneModelV2235='field';root.userData.proceduralStoneField=true;
 root.userData.fieldSourceV237='matched near and far';
 root.userData.fieldNearPlantsV237=near.userData.fieldPlantsV237;
 root.userData.fieldFarPlantsV237=far.userData.fieldPlantsV237;
 return root;
}
export function nextStoneBatchLOD(low,type,age,seed=0){
 if(!low||age!==0)return low;
 if(type==='field')return fieldLOD(low);
 if(!TYPES.has(type))return low;
 low.updateMatrixWorld(true);const box=new T.Box3().setFromObject(low),size=box.getSize(new T.Vector3()),extent=Math.max(size.x,size.z);
 const root=withStoneBuildingLOD(low,type,Number.isFinite(extent)&&extent>0?extent:8,seed);root.userData.stoneModelV2235=type;return root;
}
