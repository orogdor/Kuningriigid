import {loadWorldGLB} from './scripts/glb_lite.js';
// Real TRELLIS.2 output, sampled into small vertex-coloured GLBs. Mutate
// existing geometry objects so every existing spatial instance/LOD updates.
export const WORLD_ASSETS_V327={oak:['oak','lime'],pine:['pine','spruce'],palm:['palm'],rock:['rock']};
let promise=null;
export function installWorldAssetsV327(getGeometry){
 if(promise)return promise;
 promise=Promise.allSettled(Object.entries(WORLD_ASSETS_V327).flatMap(([kind,names])=>['low','high'].map(async lod=>{
  const group=await loadWorldGLB('./assets/world-v327/'+kind+'_'+lod+'.glb');
  const src=group.children.find(o=>o.isMesh)?.geometry;
  if(!src||!src.attributes.color)throw new Error('Missing generated geometry/colour '+kind);
  for(const name of names)for(const level of lod==='high'?['medium','high']:['low']){
   const target=getGeometry(name,level);target.copy(src);target.userData={shared:true,modelName:name+'_trellis_v327',trellisV327:true,sourceKind:kind,lod:level};
   target.computeBoundingBox();target.computeBoundingSphere();
  }
  return {kind,lod,triangles:(src.index?.count||src.attributes.position.count)/3};
 })));
 return promise;
}
