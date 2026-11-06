import * as T from '../../vendor/three.module.js';
import {loadGLB} from '../../glb-lite-v221.js';
import {treeKeepV270} from '../../forest-clumps-v270.js';
const lods=['near','mid','far'];
const seedHash=(n)=>{const x=Math.sin(n*127.1+77*311.7)*43758.5453;return x-Math.floor(x)};
// Test-only candidates use the EXISTING shared forest field at world coordinates.
// Real integration takes the game's existing matrices through placementsFromInstances below.
export function testPlacements(count,trees){
 const out=[];const extent=Math.sqrt(count)*7;
 for(let i=0;out.length<count;i++){
  const x=(seedHash(i*7)-.5)*extent,z=(seedHash(i*7+1)-.5)*extent;
  if(seedHash(i*7+2)>treeKeepV270(x,z,true))continue;
  out.push({id:i,x,y:0,z,rotation:seedHash(i*7+3)*Math.PI*2,scale:.8+seedHash(i*7+4)*.4,asset:trees[Math.floor(seedHash(i*7+5)*trees.length)].id});
 }
 return out;
}
// Reuse original world placements, terrain grounding, biome selection and rotations.
// No second placement generator is run when replacing a game's InstancedMesh.
export function placementsFromInstances(source,assetIds){
 source.updateWorldMatrix(true,false);const m=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3(),e=new T.Euler();const out=[];
 for(let i=0;i<source.count;i++){source.getMatrixAt(i,m);m.premultiply(source.matrixWorld);m.decompose(p,q,s);e.setFromQuaternion(q);out.push({id:i,x:p.x,y:p.y,z:p.z,rotation:e.y,scale:s.y,asset:assetIds[i%assetIds.length]});}
 return out;
}
// Both views project the SAME world-space records, rather than independently reseeding.
export function projectPlacements(placements,{originX=0,originZ=0,units=1}={}){
 return placements.map(p=>({...p,x:(p.x-originX)*units,z:(p.z-originZ)*units,y:p.y*units,scale:p.scale*units}));
}
export async function createForest(scene,placements,manifest,{base='../../assets/sapling-trees/',near=90,mid=260}={}){
 const group=new T.Group();scene.add(group);const assets=new Map(),textures=new Map(),resources=new Set();let geometryBytes=0,textureBytes=0;
 for(const rec of manifest.trees){
  if(!placements.some(p=>p.asset===rec.id))continue;
  const levels=[];
  for(const lod of lods){
   const data=await loadGLB(base+rec.id+'/'+lod+'.glb');const primitives=[];
   for(let i=0;i<data.primitives.length;i++){
    const p=data.primitives[i];let map=null;
    if(p.image){
     const key=lod==='far'?rec.id+'/'+i:rec.species+'/foliage';map=textures.get(key);
     if(!map){map=new T.Texture(p.image);map.flipY=false;map.colorSpace=T.SRGBColorSpace;map.needsUpdate=true;textures.set(key,map);textureBytes+=p.image.width*p.image.height*4*4/3;}
     else p.image.close?.();
    }
    const params={color:new T.Color().setRGB(...p.color.slice(0,3)),map,side:T.DoubleSide,alphaTest:map?.4:0,depthWrite:true};
    const material=lod==='far'?new T.MeshBasicMaterial(params):new T.MeshStandardMaterial({...params,roughness:.95});
    resources.add(p.geometry);resources.add(material);geometryBytes+=Object.values(p.geometry.attributes).reduce((s,a)=>s+a.array.byteLength,0)+(p.geometry.index?.array.byteLength||0);
    primitives.push({geometry:p.geometry,material});
   }
   levels.push(primitives);
  }
  assets.set(rec.id,levels);
 }
 // Spatially bounded groups; unlike the original far-source fallback, no whole-map mesh.
 const bins=new Map();for(const p of placements){const key=p.asset+':'+Math.floor(p.x/256)+':'+Math.floor(p.z/256);if(!bins.has(key))bins.set(key,[]);bins.get(key).push(p);}
 const cells=[];let matrixBytes=0;const obj=new T.Object3D();
 for(const [key,records] of bins){
  const levels=assets.get(records[0].asset),cell={records,meshes:[],last:-1};
  for(let l=0;l<3;l++){
   const meshes=levels[l].map(p=>{const m=new T.InstancedMesh(p.geometry,p.material,records.length);m.count=0;m.visible=false;m.instanceMatrix.setUsage(T.DynamicDrawUsage);group.add(m);matrixBytes+=records.length*64;return m;});cell.meshes.push(meshes);
  }
  cells.push(cell);
 }
 const scratch=Array.from({length:3},()=>[]);const sphere=new T.Sphere();const center=new T.Vector3();const frustum=new T.Frustum(),vp=new T.Matrix4();
 let visible={near:0,mid:0,far:0};
 function update(camera,force=false){
  camera.updateMatrixWorld();vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(vp);visible={near:0,mid:0,far:0};
  for(const cell of cells){
   scratch.forEach(a=>a.length=0);
   for(const p of cell.records){
    center.set(p.x,p.y+10*p.scale,p.z);sphere.set(center,18*p.scale);if(!frustum.intersectsSphere(sphere))continue;
    const d=camera.position.distanceTo(center),l=d<near?0:d<mid?1:2;scratch[l].push(p);visible[lods[l]]++;
   }
   for(let l=0;l<3;l++){
    const list=scratch[l],meshes=cell.meshes[l];
    for(const m of meshes){m.count=list.length;m.visible=list.length>0;}
    list.forEach((p,i)=>{obj.position.set(p.x,p.y,p.z);obj.rotation.set(0,p.rotation,0);obj.scale.setScalar(p.scale);obj.updateMatrix();for(const m of meshes)m.setMatrixAt(i,obj.matrix);});
    for(const m of meshes){m.instanceMatrix.needsUpdate=true;m.boundingSphere=null;if(m.count)m.computeBoundingSphere();}
   }
  }
  return visible;
 }
 return {group,update,placements,get visible(){return visible},memory:{geometryBytes,textureBytesEstimate:Math.round(textureBytes),matrixBytes,totalEstimate:Math.round(geometryBytes+textureBytes+matrixBytes)},dispose(){group.removeFromParent();for(const cell of cells)for(const meshes of cell.meshes)for(const m of meshes)m.dispose();for(const r of resources)r.dispose();for(const t of textures.values())t.dispose();}};
}
