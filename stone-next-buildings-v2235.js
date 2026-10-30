// V223.5: detailed Stone Age models, plus a scalable procedural field.
import * as T from './vendor/three.module.js';
import {withStoneBuildingLOD} from './stone-near-lod.js?v=224';
const TYPES=new Set(['claypit','pottery_kiln','pasture','mason']);
let fieldShared;
function makeField(){
 if(fieldShared)return fieldShared;
 const soil=new T.MeshStandardMaterial({color:0x49392a,roughness:1}),
 ridge=new T.MeshStandardMaterial({color:0x77563b,roughness:1}),
 stalkMat=new T.MeshStandardMaterial({color:0xb1b65c,roughness:1,side:T.DoubleSide}),
 earMat=new T.MeshStandardMaterial({color:0xd0b36b,roughness:1,side:T.DoubleSide});
 const ground=new T.BoxGeometry(16,.12,16),furrow=new T.BoxGeometry(1.36,.23,15.5);
 // One reusable low-poly crop with tapered leaves; no cuboid foliage.
 function stalkGeometry(){
  const p=[],idx=[];
  const ringN=6,stages=5;
  for(let j=0;j<stages;j++){
   const f=j/(stages-1),r=.024*(1-.65*f);
   for(let k=0;k<ringN;k++){
    const a=k*2*Math.PI/ringN;
    p.push(Math.cos(a)*r+f*f*.06,(f-.5)*.8,Math.sin(a)*r);
   }
  }
  for(let j=0;j<stages-1;j++)for(let k=0;k<ringN;k++){
   const a=j*ringN+k,b=j*ringN+(k+1)%ringN,c=(j+1)*ringN+k,d=(j+1)*ringN+(k+1)%ringN;
   idx.push(a,b,c,b,d,c);
  }
  // Two long leaves bend off the stalk. Their tips curl up.
  for(const sign of [-1,1]){
   const base=p.length/3;
   p.push(0,-.26,0,sign*.16,-.15,-.012,sign*.28,.01,-.023,sign*.32,.11,-.039,
          sign*.02,-.22,.033,sign*.13,-.09,.04,sign*.24,.07,.023,sign*.30,.15,0);
   for(let j=0;j<3;j++){
    idx.push(base+j,base+j+1,base+4+j,base+j+1,base+5+j,base+4+j);
   }
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(p,3));
  g.setIndex(idx);g.computeVertexNormals();return g;
 }
 function earGeometry(){
  // Rounded multi-segment grain head with a pointed awn, rather than a ball.
  const profile=[new T.Vector2(0,-.07),new T.Vector2(.029,-.06),
   new T.Vector2(.051,-.025),new T.Vector2(.061,.042),new T.Vector2(.04,.105),
   new T.Vector2(.018,.15),new T.Vector2(0,.24)];
  return new T.LatheGeometry(profile,7);
 }
 const stem=stalkGeometry(),head=earGeometry();
 for(const g of [ground,furrow,stem,head])g.userData.shared=true;
 fieldShared={soil,ridge,stalkMat,earMat,ground,furrow,stem,head};return fieldShared;
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
 const heads=new T.InstancedMesh(shared.head,shared.earMat,count);
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
  heads.setMatrixAt(n,dummy.matrix);
  const tone=.78+(.22*(.5+.5*Math.sin(row*5.2+z*2.3+k*9.7)));
  stems.setColorAt(n,new T.Color().setRGB(tone*.91,tone, .60*tone));
  heads.setColorAt(n,new T.Color().setRGB(tone, .78*tone,.42*tone));n++;
 }
 stems.instanceMatrix.needsUpdate=true;heads.instanceMatrix.needsUpdate=true;
 if(stems.instanceColor)stems.instanceColor.needsUpdate=true;
 if(heads.instanceColor)heads.instanceColor.needsUpdate=true;
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
