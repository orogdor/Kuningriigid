// V135: deterministic, organic AI settlement and neighbourhood layout.
// This module contains ranking/candidate rules only. The game still validates
// dry ground, building footprints, access to doors, resources and county claims.
export const AI_MIN_CITY_SPACING = 9; // previously 17: about half as far apart
export function aiCitySpacingAllowed(p, cities, distance = AI_MIN_CITY_SPACING) {
  return cities.every(c => Math.max(Math.abs(c.c-p.c), Math.abs(c.r-p.r)) >= distance);
}
function noise(seed, a, b, salt=0) {
  let h = Math.imul((seed|0)^0x9e3779b9, 0x85ebca6b);
  h ^= Math.imul((a|0)+salt+17, 0xc2b2ae35);
  h ^= Math.imul((b|0)+salt+37, 0x27d4eb2f);
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15; h = Math.imul(h, 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// A town grows down irregular valleys/streets instead of filling a square.
// Used only for prioritising already claimed URBAN tiles, not county borders.
export function organicDistrictPriority(city, tile, seed) {
  const dx=tile.c-city.c, dz=tile.r-city.r;
  if (dx===0 && dz===0) return -100;
  const r=Math.hypot(dx,dz), a=Math.atan2(dz,dx);
  const phase=noise(seed,city.c,city.r)*Math.PI*2;
  return r + 0.56*Math.sin(3*a+phase) +
    0.31*Math.sin(5*a-phase) +
    0.12*noise(seed,tile.c,tile.r);
}
// Curved, slightly offset rows create winding streets and irregular perimeter.
// The official nav grid decides the FINAL spacing; never shrink colliders.
export function organicBuildingSites(ctx, original, seed, pinned=false) {
  if (pinned) return original; // mines/harbours must keep their real deposits/sites
  const origin=ctx.economy?.buildings?.find(b=>b.type==='hall') ||
    ctx.economy?.buildings?.[0] || {x:0,z:0};
  const phase=noise(seed,ctx.c,ctx.r)*Math.PI*2;
  const candidates=[];
  for (let row=0,z=-24; z<=24.1; row++,z+=5.5) {
    for (let col=0,x=-38; x<=38.1; col++,x+=5.5) {
      const sx=x+(row%2?2.75:0)+(noise(seed,row,col,1)-.5)*1.1;
      const sz=z+(noise(seed,col,row,2)-.5)*1.1;
      if(Math.abs(sx)>39.6||Math.abs(sz)>25.6)continue;
      const dx=sx-origin.x,dz=sz-origin.z;
      const r=Math.hypot(dx,dz),a=Math.atan2(dz,dx);
      const organic=2.2*Math.sin(3*a+phase)+1.45*Math.sin(5*a-phase)
        +.75*Math.sin(r*.38+2*a);
      const score=r+organic+noise(seed,row,col,3)*.24;
      candidates.push({x:Math.round(sx*10)/10,z:Math.round(sz*10)/10,
        aiOrganicRank:score});
    }
  }
  candidates.sort((a,b)=>a.aiOrganicRank-b.aiOrganicRank);
  return candidates;
}
