export const OLD_FORT_TYPES_V218=new Set(['palisade','woodgate','watchtower','stonewall','reinforced_wall','gatehouse','stonetower']);
export const WOOD_FORT_TYPES_V218=new Set(['palisade','woodgate','watchtower']);
export function insideOldRingV218(p,poly){
 if(!Array.isArray(poly)||poly.length<3)return false;
 let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
 const a=poly[i],b=poly[j];if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)yes=!yes;
 }return yes;
}
export function distanceToOldRingV218(p,poly){
 if(!Array.isArray(poly)||poly.length<3)return Infinity;
 let d=Infinity;for(let i=0;i<poly.length;i++){
 const a=poly[i],b=poly[(i+1)%poly.length],dx=b.x-a.x,dz=b.z-a.z;
 const len=dx*dx+dz*dz,t=len?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/len)):0;
 d=Math.min(d,Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz));
 }return d;
}
export function rejectInsideOuterRingV218(slots,poly){
 return slots.some(s=>insideOldRingV218(s,poly)&&distanceToOldRingV218(s,poly)>3.5);
}
export function oldPerimeterStatusV218(game,city){
 const plan=city.stoneDefensePlanV166||city.defensePlanV139,slots=plan?.slots||[];
 const walls=typeof game.defenseBuildingsV177==='function'?game.defenseBuildingsV177(city):game.allBuildings(city);
 const standing=walls.filter(b=>b.hp>0&&OLD_FORT_TYPES_V218.has(b.type)&&!b.outerRingV184);
 const missing=slots.filter(s=>!standing.some(b=>Math.hypot(b.x-s.x,b.z-s.z)<(s.drawnWallV175?1.6:5)));
 const wooden=standing.filter(b=>WOOD_FORT_TYPES_V218.has(b.type));
 const constructing=standing.filter(b=>!b.ready||!!b.wallUpgradeV184);
 return {plan,missing,wooden,constructing,ready:!!slots.length&&!missing.length&&!wooden.length&&!constructing.length};
}
