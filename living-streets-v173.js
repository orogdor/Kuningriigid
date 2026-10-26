// V173 (3.2b): preserve naturally worn streets as the compact town infills.
// Read-only inspection of V4 trail wear. NEVER create road heat here:
// pedestrians/carts/armies remain the ONLY source of new roads.
const GEOMETRY=Object.freeze({
 house:{rx:4,rz:3.6},hall:{rx:5.6,rz:5},
 market:{rx:11,rz:10.2},well:{rx:3.2,rz:3.2},
 study:{rx:5,rz:5},warehouse:{rx:5.6,rz:5},cellar:{rx:5,rz:4.4}
});
export function buildingTrailFootprintV173(type){
 return GEOMETRY[type]||{rx:5,rz:5};
}
// Same decay bands as Navigation.roadStrength; a cache of local footpaths must
// also follow natural erosion, rather than freezing unused trails forever.
export function visibleTrailStrengthV173(heat,last,now){
 const h=Number(heat)||0;
 if(h<=0)return 0;
 const elapsed=Math.max(0,(Number(now)||0)-(Number(last) || 0));
 const rate=h>=64?.0012:h>=30?.0028:h>=13?.006:h>=4?.009:.013;
 return Math.max(0,h-rate*elapsed);
}
export function wornStreetCellsV173(world,now=0,minimum=4){
 const bounds=world?.navBounds,heat=world?.heat;
 if(!bounds||!heat||!Number.isFinite(bounds.w)||!Number.isFinite(bounds.h))return [];
 const result=[];
 for(const [key,raw] of Object.entries(heat)){
  const i=Number(key);
  if(!Number.isInteger(i)||i<0||i>=bounds.w*bounds.h)continue;
  if(visibleTrailStrengthV173(raw,world.heatLast?.[key],now)<minimum)continue;
  result.push({x:i%bounds.w+bounds.minX,z:Math.floor(i/bounds.w)+bounds.minZ});
 }
 return result;
}
// Protect an actual busy path plus a 1.3m lateral walking ribbon.
// A 1st-level worn trail already qualifies, but an invisible single walk
// cannot prevent expansion. AI sites are still checked by previewBuild/nav.
export function overlapsWornStreetV173(point,type,cells,pad=1.3){
 const {rx,rz}=buildingTrailFootprintV173(type);
 return cells.some(c=>Math.abs(c.x-point.x)<rx+pad&&Math.abs(c.z-point.z)<rz+pad);
}
export function activeStreetCandidateV173(world,point,type,now=0){
 return !overlapsWornStreetV173(point,type,wornStreetCellsV173(world,now));
}
