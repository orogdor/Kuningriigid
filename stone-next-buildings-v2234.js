// V223.5: detailed near-camera Stone Age assets; existing distant models are preserved.
import * as T from './vendor/three.module.js';
import {withStoneBuildingLOD} from './stone-near-lod.js';
import {STONE_FOLLOWUP_TYPES,withStoneFollowupLOD} from './stone-followups-v2235.js';
export const NEXT_STONE_TYPES=new Set(['barracks','archery','hunter','fisher','study']);
export function nextStoneBuildingLOD(low,type,age,seed=0){
 if(!low||age!==0)return low;
 const detailedGLB=NEXT_STONE_TYPES.has(type),followup=STONE_FOLLOWUP_TYPES.has(type);
 if(!detailedGLB&&!followup)return low;
 low.updateMatrixWorld(true);
 const size=new T.Box3().setFromObject(low).getSize(new T.Vector3());
 const extent=Math.max(size.x,size.z);
 const width=Number.isFinite(extent)&&extent>0?extent:8;
 const root=followup?withStoneFollowupLOD(low,type,width,seed):withStoneBuildingLOD(low,type,width,seed);
 root.userData.stoneModelV2235=type;
 return root;
}
