// V223.4: keep the existing distant graphics and stream five detailed Stone Age assets.
import * as T from './vendor/three.module.js';
import {withStoneBuildingLOD} from './stone-near-lod.js';
export const NEXT_STONE_TYPES=new Set(['barracks','archery','hunter','fisher','study']);
export function nextStoneBuildingLOD(low,type,age,seed=0){
 if(!low||age!==0||!NEXT_STONE_TYPES.has(type))return low;
 low.updateMatrixWorld(true);
 const size=new T.Box3().setFromObject(low).getSize(new T.Vector3());
 const extent=Math.max(size.x,size.z);
 const root=withStoneBuildingLOD(low,type,Number.isFinite(extent)&&extent>0?extent:8,seed);
 root.userData.stoneModelV2234=type;
 return root;
}
