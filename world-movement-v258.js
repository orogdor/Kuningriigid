import {DETAIL_TILE_X,DETAIL_TILE_Z} from './detail-scale-v123.js';

// A strategic step is the same physical distance as the corresponding detail
// tile. Road bonuses and the slowest member of a formation apply to both views.
export function worldLandDurationV258(from,to,speed=3,roadMultiplier=1){
 const dx=(to.c-from.c)*DETAIL_TILE_X,dz=(to.r-from.r)*DETAIL_TILE_Z;
 return Math.hypot(dx,dz)/(Math.max(.01,speed)*Math.max(.01,roadMultiplier));
}
// Old saved games and road upgrades may contain a different duration. Keep the
// same position along the current segment when its duration changes.
export function rescaleWorldTravelV258(entity,duration){
 const old=Number(entity.travelDuration)||0;
 if(old>0&&duration>0&&old!==duration)entity.travelClock=(entity.travelClock||0)*duration/old;
 entity.travelDuration=duration;
}
