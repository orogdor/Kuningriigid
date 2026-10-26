// V172/3.2: Compact, organically growing Stone Age village core.
// Pure ranking only. Never approves sites, spends resources, moves saved
// buildings, overrides nav/terrain checks or alters reserved palisade corridors.
const CIVIC=new Set(['study','market','well','warehouse','cellar']);
const CORES=new Set(['house',...CIVIC]);
const distance=(x,z,b)=>Math.hypot(x-b.x,z-b.z);
export const COMPACT_STONE_V172=Object.freeze({
 houseRadius:31,civicRadius:23,compactLimit:58,
 companionDistance:14,minVisualGap:8.2
});
export function compactStoneTypesV172(type){return CORES.has(type);}
/**
 * Coordinates are global detail meters relative to the capital hall.
 * existing is a list of ACTUAL local center buildings relative to that hall.
 * The result is used for candidate ordering only; placementRule and
 * Navigation.preservesAccess remain the authority on all construction.
 */
export function compactStonePlotScoreV172(type,x,z,existing=[]){
 const radius=Math.hypot(x,z),houses=existing.filter(b=>b.type==='house'&&b.hp>0&&!b.virtual);
 if(type==='house'){
  // Reserve the immediate ceremonial hall/plaza; cluster around 30m rather
  // than the older 42m open ring, with a strong preference for the inner 58m.
  let score=Math.abs(radius-COMPACT_STONE_V172.houseRadius)*.39+
   Math.max(0,radius-COMPACT_STONE_V172.compactLimit)*3.15+
   Math.max(0,23-radius)*.68;
  if(houses.length){
   const nearest=Math.min(...houses.map(h=>distance(x,z,h)));
   // Favour winding groups of cottages: about 10–18m between front doors.
   // Never pull new huts straight into neighbours or the civic plaza.
   score+=Math.max(0,nearest-19)*.29+
    Math.max(0,COMPACT_STONE_V172.minVisualGap-nearest)*2.2+
    Math.abs(nearest-COMPACT_STONE_V172.companionDistance)*.07;
  }
  return score;
 }
 if(CIVIC.has(type)){
  // Wells and teaching huts belong between houses and central hall.
  // The larger market keeps more room for its broader footprint.
  const desired=type==='market'?32:type==='warehouse'||type==='cellar'?27:COMPACT_STONE_V172.civicRadius;
  return Math.abs(radius-desired)*.34+
   Math.max(0,radius-55)*1.4;
 }
 return null; // resource gathering and industrial outskirts are unchanged.
}
