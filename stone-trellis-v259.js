// V259: TRELLIS.2 Stone Age soldiers. No skeleton in these GLBs:
// animate whole character and fall back to existing animated models.
import * as T from './vendor/three.module.js';
import {loadGLB} from './glb-lite-v221.js';
import {requestAssetV241} from './asset-queue-v241.js';
const FILES=Object.freeze({axeman:'kirvemees_trellis2_game.glb',spearman:'odamees_trellis2_game.glb',slinger:'lingumees_trellis2_game.glb'});
const HEIGHT=1.72;
const bandGeo=new T.BoxGeometry(.24,.055,.04),bandMaterials=new Map();
function bandMaterial(color){
 if(!bandMaterials.has(color))bandMaterials.set(color,new T.MeshStandardMaterial({color,roughness:.85}));
 return bandMaterials.get(color);
}
// V260 hotfix: the generated TRELLIS meshes are not yet visually verified.
// Preserve the V148 soldier appearances by default; ?trellis259=1 enables experimental GLBs.
const EXPERIMENTAL_TRELLIS_V260=typeof window!=='undefined' && new URLSearchParams(window.location.search).get('trellis259')==='1';
export const hasTrellisStoneV259=kind=>EXPERIMENTAL_TRELLIS_V260&&Object.prototype.hasOwnProperty.call(FILES,kind);
function texture(image,srgb=false){
 if(!image)return null;
 const tex=new T.Texture(image);tex.flipY=false;tex.anisotropy=4;
 if(srgb)tex.colorSpace=T.SRGBColorSpace;
 tex.needsUpdate=true;return tex;
}
export function loadTrellisStoneV259(kind){
 if(!hasTrellisStoneV259(kind))return Promise.resolve(null);
 return requestAssetV241('trellis-soldier-v259:'+kind,async()=>{
  const data=await loadGLB(new URL('./models-trellis-v259/'+FILES[kind],import.meta.url));
  if(data.primitives.length!==1)throw Error('Expected one TRELLIS soldier mesh: '+kind);
  const prim=data.primitives[0],g=prim.geometry;
  g.computeBoundingBox();
  // Slinger came out with a flattened Y axis: rotate Z length into Y.
  const initial=g.boundingBox.getSize(new T.Vector3());
  if(kind==='slinger'&&initial.y<initial.z*.5)g.rotateX(-Math.PI/2);
  g.computeBoundingBox();
  const b=g.boundingBox,c=b.getCenter(new T.Vector3()),size=b.getSize(new T.Vector3());
  if(!(size.y>.01))throw Error('Invalid TRELLIS soldier bounds: '+kind);
  g.translate(-c.x,-b.min.y,-c.z);
  g.scale(HEIGHT/size.y,HEIGHT/size.y,HEIGHT/size.y);
  g.computeBoundingBox();g.computeBoundingSphere();g.userData.shared=true;
  const mat=new T.MeshStandardMaterial({
   map:texture(prim.image,true),roughnessMap:texture(prim.roughnessImage),
   color:new T.Color().fromArray(prim.color),roughness:Math.min(1,prim.roughness??1),
   metalness:0,side:T.DoubleSide
  });
  return {geometry:g,material:mat,kind};
 });
}
export function createTrellisStoneV259(parent,x,z,color,kind,grade='standard',asset){
 if(!asset||!hasTrellisStoneV259(kind))throw Error('Missing TRELLIS soldier asset '+kind);
 const root=new T.Group(),pose=new T.Group(),mesh=new T.Mesh(asset.geometry,asset.material);
 mesh.name='TRELLIS.2 '+kind;mesh.castShadow=true;mesh.receiveShadow=true;
 pose.add(mesh);root.add(pose);
 const ribbon=new T.Mesh(bandGeo,bandMaterial(color));
 ribbon.position.set(0,1.05,.20);ribbon.name='Faction band';pose.add(ribbon);
 root.position.set(x,0,z);
 root.userData={unitKind:kind,grade,trellisV259:true,rig:{trellisV259:true,kind,pose,phase:x*2+z}};
 parent.add(root);return root;
}
export function animateTrellisStoneV259(root,time,moving=false,attack=false){
 const r=root.userData.rig;if(!r?.trellisV259)return;
 const t=time*7.5+r.phase;
 const phase=typeof attack==='object'?(attack.phase??-1):(attack?.4:-1);
 const fighting=phase>=0&&phase<=1;
 r.pose.position.y=moving?.028+Math.abs(Math.sin(t))*.042:Math.sin(time*1.8+r.phase)*.007;
 r.pose.rotation.z=moving?Math.sin(t)*.026:0;
 r.pose.rotation.x=fighting?-.16*Math.sin(phase*Math.PI):0;
 r.pose.rotation.y=fighting?-.12+.25*phase:Math.sin(time*.6+r.phase)*.018;
}
