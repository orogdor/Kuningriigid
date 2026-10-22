import * as T from './vendor/three.module.js';
export const damageStage=(hp,maxHp)=>hp<=0?3:hp/Math.max(1,maxHp)<=.35?2:hp/Math.max(1,maxHp)<=.7?1:0;
const templates=new Map(),materials=new Map();
function box(g,x,y,z,w,h,d,color,angle=0){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:1}));const m=new T.Mesh(new T.BoxGeometry(w,h,d),materials.get(color));m.position.set(x,y,z);m.rotation.z=angle;g.add(m);return m;}
function merge(g){g.updateMatrixWorld(true);const out=new T.Group(),groups=new Map();g.traverse(m=>{if(!m.isMesh)return;const a=m.geometry.toNonIndexed();a.applyMatrix4(m.matrixWorld);if(!groups.has(m.material))groups.set(m.material,[]);groups.get(m.material).push(a);});for(const [mat,list]of groups){const geo=new T.BufferGeometry();for(const key of ['position','normal']){const data=new Float32Array(list.reduce((n,a)=>n+a.attributes[key].array.length,0));let offset=0;for(const a of list){data.set(a.attributes[key].array,offset);offset+=a.attributes[key].array.length;}geo.setAttribute(key,new T.BufferAttribute(data,3));}geo.computeBoundingSphere();geo.userData.shared=true;const m=new T.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;out.add(m);list.forEach(a=>a.dispose());}g.traverse(m=>m.geometry?.dispose());return out;}
export function createDestructionModel(kind,stage){const key=kind+stage;if(templates.has(key))return templates.get(key).clone(true);const g=new T.Group();
 if(kind==='catapult'){
  const wood='#795638';for(let i=0;i<(stage===1?3:12);i++){const a=i*2.399;box(g,Math.cos(a)*(i%3)*.6,.16+(i%3)*.09,Math.sin(a)*.9,1.1+(i%4)*.25,.12,.14,wood,Math.sin(a)*.3);}if(stage>1)for(const side of [-1,1]){const wheel=new T.Mesh(new T.TorusGeometry(.32,.055,5,12),materials.get(wood));wheel.position.set(side*.85,.18,side*.45);wheel.rotation.x=1.2;g.add(wheel);}else box(g,.45,1.25,0,.12,.9,.14,'#ae8a58',.85);
 }else{
  const width=kind==='stonetower'?4.6:7,depth=kind==='gatehouse'?4.4:2.8;
  if(stage<3)for(let col=0;col<7;col++){const x=(col-3)*width/7,height=stage===1?2.5+(col%3)*.52:.7+(col%3)*.55;for(let y=.32;y<height;y+=.58)box(g,x,y,0,width/7-.055,.53,depth,'#a89d85');}
  for(let i=0;i<(stage===3?42:stage===2?24:12);i++){const a=i*2.399,r=.65+(i%8)*.42;box(g,Math.cos(a)*r,.12+(i%4)*.105,Math.sin(a)*r*.62,.38+(i%3)*.13,.22,.35,'#b4a58b',Math.sin(a)*.3);}
  if(kind==='gatehouse')for(let i=0;i<8;i++)box(g,(i-3.5)*.35,.16,.7,1.8,.12,.2,'#70503a',(i%3-1)*.25);
 }
 const result=merge(g);result.userData={destruction:true,damageStage:stage,destructionKind:kind,bronzeFortification:kind!=='catapult'};templates.set(key,result);return result.clone(true);
}
export function updateCatapultDamage(root,hp,maxHp){const stage=damageStage(hp,maxHp);let state=root.userData.damageVisual;if(!state){state={stage:-1,original:[...root.children],arm:root.getObjectByName('catapultArm')};root.userData.damageVisual=state;}if(stage!==state.stage){if(state.debris)root.remove(state.debris);state.debris=stage?createDestructionModel('catapult',stage):null;if(state.debris)root.add(state.debris);state.stage=stage;}
 for(const c of state.original)c.visible=stage<3&&(stage<2||!c.isMesh);if(state.arm)state.arm.visible=stage===0;root.userData.damageStage=stage;
}
