// Deterministic artillery spread driven by the parent army's level.
// LVL 10 aims at the chosen point; LVL 1 scatters far from it.
// Accuracy is independent of the damage and hit radius.
export const CATAPULT_MAX_DEVIATION_LVL1=14.4;
export function catapultLevel(unit){
 const inferred=1+((unit.experienceMultiplier??1)-1)*4.5;
 return Math.max(1,Math.min(10,Math.round(unit.armyLevel??inferred)));
}
function seededRoll(seed){
 seed=(seed^(seed>>>16))>>>0;
 seed=Math.imul(seed,0x7feb352d);
 seed=(seed^(seed>>>15))>>>0;
 seed=Math.imul(seed,0x846ca68b);
 return ((seed^(seed>>>16))>>>0)/4294967296;
}
export function rockLandingPoint(unit,shot,target){
 const level=catapultLevel(unit);
 if(level===10)return {x:target.x,z:target.z,level,deviation:0};
 const source=Number.isFinite(unit.source)?unit.source:0;
 const seed=(Math.imul(source+31,73856093)^Math.imul(shot+1,19349663)^Math.imul(unit.team+1,83492791))>>>0;
 const maxDeviation=CATAPULT_MAX_DEVIATION_LVL1*(10-level)/9;
 const deviation=maxDeviation*Math.sqrt(seededRoll(seed));
 const angle=seededRoll(seed^0x9e3779b9)*Math.PI*2;
 return {x:target.x+Math.cos(angle)*deviation,z:target.z+Math.sin(angle)*deviation,level,deviation};
}
