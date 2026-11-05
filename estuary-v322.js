// V322: new estuary system. Inland rivers and sea do not share geometry.
// Sea depth is computed from undisturbed terrain, never the excavated river bed.
// River tint is suppressed at the physical coastline so the sea shader owns the outlet.
import {baseHeight,estuaryShoreHeightV323} from './continuous-landscape.js?v=323';

const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export const SEA_LEVEL_V322=.72;

// The smooth visual height can contain a river-cell depression. The raw
// atlas still knows which terrain is naturally above water. Use BOTH so
// excavated riverbeds never get mistaken for ocean.
export function naturalBedHeightV322(game,x,z){
 return Math.max(baseHeight(game,x,z),game.atlasHeight(x,z));
}
export function naturalSeaDepthV322(game,x,z){
 return SEA_LEVEL_V322-naturalBedHeightV322(game,x,z);
}
export function localNaturalSeaGroundV322(game,tile,x,z,sx,sz){
 return (estuaryShoreHeightV323(game,tile.x+x/sx,tile.z+z/sz)-.7)*.30;
}
export function mouthZonesV322(edges){
 const zones=[];
 for(const edge of edges){
  if(edge.to?.land!==false||!edge.points||edge.points.length<2)continue;
  // Last directed reach, not a square tile or radial cap.
  const points=edge.points;
  const a=points[Math.max(0,points.length-5)],b=points.at(-1);
  const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
  if(len<.01)continue;
  const width=Math.max(...points.slice(-5).map(p=>p.width));
  zones.push({a,b,ux:dx/len,uz:dz/len,length:len,
   radius:Math.max(12,width*1.8)});
 }
 return zones;
}
function nearOutlet(x,z,zone){
 const dx=x-zone.a.x,dz=z-zone.a.z;
 const along=dx*zone.ux+dz*zone.uz;
 const lateral=Math.abs(-dx*zone.uz+dz*zone.ux);
 // A round, smooth influence around the last centreline; no abrupt cap.
 // Keep ownership with the sea downstream of the mouth. Never allow
 // the old river tint to reappear at the outer edge of the river cap.
 const before=Math.max(0,-along);
 const d=Math.hypot(before,lateral);
 return (1-smooth(d/zone.radius))*smooth((along+zone.radius*.6)/(zone.radius*.6));
}
export function riverSurfaceOpacityV322(game,x,z,zones){
 // V323: longitudinal fade removes tinted triangles at the outlet,
 // while shoreline ownership resolves the remaining tidal transition.
 let influence=0,downstreamFade=1;
 for(const zone of zones){
  influence=Math.max(influence,nearOutlet(x,z,zone));
  const dx=x-zone.a.x,dz=z-zone.a.z;
  const along=dx*zone.ux+dz*zone.uz;
  const lateral=Math.abs(-dx*zone.uz+dz*zone.ux);
  const progress=smooth((along-zone.length*.08)/Math.max(.01,zone.length*.92));
  const cross=1-smooth((lateral-zone.radius*.68)/Math.max(.1,zone.radius*.32));
  downstreamFade=Math.min(downstreamFade,1-progress*cross);
 }
 if(influence<=0)return downstreamFade;
 const land=smooth((estuaryShoreHeightV323(game,x,z)-SEA_LEVEL_V322)/3.0);
 return clamp(Math.min(1-influence*(1-land),downstreamFade));
}
