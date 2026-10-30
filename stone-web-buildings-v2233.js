import {withStoneBuildingLOD} from './stone-near-lod.js?v=224';
const sizes={lumber:7.2,quarry:8.2,house:6.2,well:3.4,farm:8.2};
export function createWebStoneBuilding(type,age,seed=0,low=null){
 return age===0&&low&&sizes[type]?withStoneBuildingLOD(low,type,sizes[type],seed):null;
}
