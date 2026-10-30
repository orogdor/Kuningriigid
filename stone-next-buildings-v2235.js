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
function fieldLOD(low){
 const a=makeField(),high=new T.Group();let m=new T.Mesh(a.ground,a.soil);m.position.y=.06;m.receiveShadow=true;high.add(m);
 for(let r=0;r<8;r++){m=new T.Mesh(a.furrow,a.ridge);m.position.set(-7+2*r,.16,0);m.receiveShadow=true;high.add(m)}
 const count=8*23*3,stems=new T.InstancedMesh(a.stem,a.stalkMat,count),heads=new T.InstancedMesh(a.head,a.stalkMat,count),dummy=new T.Object3D();let index=0;
 for(let r=0;r<8;r++)for(let z=0;z<23;z++)for(let k=0;k<3;k++){
  const wobble=Math.sin(r*77+z*19+k*7),height=.66+.17*Math.sin(r*15+z*3+k*11);
  const x=-7+2*r+(k-1)*.23+wobble*.06,zz=-7.55+z*.68+wobble*.12;
  dummy.position.set(x,.27+height*.5,zz);dummy.scale.set(1,height/.8,1);dummy.rotation.z=wobble*.10;dummy.updateMatrix();stems.setMatrixAt(index,dummy.matrix);
  dummy.position.set(x+wobble*.04,.27+height,zz);dummy.scale.set(.7,1.7,.7);dummy.rotation.set(0,0,0);dummy.updateMatrix();heads.setMatrixAt(index,dummy.matrix);index++;
 }
 stems.castShadow=true;heads.castShadow=true;high.add(stems,heads);
 const root=new T.LOD();root.addLevel(high,0);root.addLevel(low,100,.05);Object.assign(root.userData,low.userData);root.userData.stoneModelV2235='field';root.userData.proceduralStoneField=true;return root;
}
export function nextStoneBatchLOD(low,type,age,seed=0){
 if(!low||age!==0)return low;
 if(type==='field')return fieldLOD(low);
 if(!TYPES.has(type))return low;
 low.updateMatrixWorld(true);const box=new T.Box3().setFromObject(low),size=box.getSize(new T.Vector3()),extent=Math.max(size.x,size.z);
 const root=withStoneBuildingLOD(low,type,Number.isFinite(extent)&&extent>0?extent:8,seed);root.userData.stoneModelV2235=type;return root;
}
