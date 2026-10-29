// V223.3: five Stone Age models generated in the hosted Microsoft TRELLIS.2 Space.
// Shared geometry/materials; 3000-4000 triangles and one 512px colour atlas per model.
import * as T from './vendor/three.module.js';
import {applyStoneSize} from './stone-sizes-v224.js';
import {loadGLB} from './glb-lite-v221.js';
import {withStoneBuildingLOD} from './stone-near-lod.js?v=224';

const DEFINITIONS={lumber:7.2,quarry:8.2,house:6.2,well:3.4,farm:8.2};
const ASSETS=new Map();
await Promise.all(Object.entries(DEFINITIONS).map(async([type,size])=>{
 try{
  const data=await loadGLB('./models-v2233/'+type+'.glb'),prim=data.primitives[0];
  if(!prim||data.primitives.length!==1)throw new Error('Expected one mesh primitive');
  const geo=prim.geometry;geo.computeBoundingBox();
  const box=geo.boundingBox,center=new T.Vector3();box.getCenter(center);
  geo.translate(-center.x,-box.min.y,-center.z);geo.computeBoundingBox();geo.computeBoundingSphere();
  const extent=geo.boundingBox.getSize(new T.Vector3());
  const texture=prim.image?new T.Texture(prim.image):null;
  if(texture){texture.flipY=false;texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;texture.needsUpdate=true;}
  const material=new T.MeshStandardMaterial({map:texture,roughness:.95,metalness:0,side:T.DoubleSide});
  ASSETS.set(type,{geo,material,extent,scale:size/Math.max(extent.x,extent.z)});
 }catch(error){console.warn('V223.3 model unavailable; keeping earlier '+type,error);}
}));

export function createWebStoneBuilding(type,age,seed=0){
 if(age!==0)return null;
 const asset=ASSETS.get(type);if(!asset)return null;
 const root=new T.Group(),mesh=new T.Mesh(asset.geo,asset.material);
 if(!applyStoneSize(mesh,type,asset.extent,seed))mesh.scale.setScalar(asset.scale*(type==='house'?.94+((seed>>>3)%7)*.02:1)); // V224 real sizes
 mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
 root.userData.animations=[];root.userData.buildingType=type;root.userData.age=0;
 root.userData.stoneModelV221=type;root.userData.stoneModelV2233=type;
 return withStoneBuildingLOD(root,type,DEFINITIONS[type],seed);
}
