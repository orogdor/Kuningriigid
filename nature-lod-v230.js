import * as T from './vendor/three.module.js';
import {loadGLB} from './glb-lite-v221.js';

const definitions={game:['hirv',1.9],ox:['harg',1.8],fish:['kala',.35],berry:['poosas',1.2],pine:['mand',9],oak:['tamm',7]};
const assets=new Map(),queue=[];let active=0;
function texture(image,srgb=false){if(!image)return null;const t=new T.Texture(image);t.flipY=false;if(srgb)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;}
function asset(kind,detail){
 const key=kind+'_'+detail;if(assets.has(key))return assets.get(key);
 const promise=new Promise((resolve,reject)=>{queue.push(async()=>{try{
  const [name,height]=definitions[kind],data=await loadGLB('./models-nature-v230/'+name+'_'+detail+'.glb'),group=new T.Group();
  for(const p of data.primitives){const mr=texture(p.roughnessImage),m=new T.MeshStandardMaterial({map:texture(p.image,true),roughnessMap:mr,metalnessMap:mr,roughness:p.roughness,metalness:p.metalness,color:new T.Color().fromArray(p.color),vertexColors:!!p.geometry.attributes.color,side:T.DoubleSide});
   p.geometry.userData.shared=true;const mesh=new T.Mesh(p.geometry,m);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
  const b=new T.Box3().setFromObject(group),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());
  if(!(size.y>0))throw new Error('Empty nature model '+key);
  const scale=height/size.y;group.scale.setScalar(scale);group.position.set(-center.x*scale,-b.min.y*scale,-center.z*scale);
  resolve(group);
 }catch(e){reject(e);}});pump();});assets.set(key,promise);return promise;
}
function pump(){while(active<2&&queue.length){active++;queue.shift()().finally(()=>{active--;pump();});}}
export function withNatureLOD(kind,fallback){
 const root=new T.Group(),low=new T.Group(),high=new T.Group();root.add(fallback,low,high);high.visible=false;
 root.userData.natureV230=kind;root.userData.lowReady=false;root.userData.highReady=false;
 asset(kind,'low').then(g=>{low.add(g.clone(true));fallback.visible=false;root.userData.lowReady=true;}).catch(e=>{root.userData.natureError=String(e);});
 // The renderer calls this LOD with the active camera, including walking cameras.
 const lod=new T.LOD();root.add(lod);let pending=false;
 lod.update=camera=>{
  root.getWorldPosition(point);camera.getWorldPosition(eye);const near=point.distanceTo(eye)/(camera.zoom||1)<60;
  if(near&&!pending){pending=true;asset(kind,'high').then(g=>{high.add(g.clone(true));root.userData.highReady=true;}).catch(e=>{root.userData.natureError=String(e);});}
  const show=near&&root.userData.highReady;high.visible=show;low.visible=!show;fallback.visible=!show&&!root.userData.lowReady;
  root.userData.nearActive=show;
 };
 const point=new T.Vector3(),eye=new T.Vector3();return root;
}
