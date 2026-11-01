// V270: one continuous "where do trees grow" field in world coordinates, used by BOTH the world map
// (atlas-biomes-v47.js) and the detail map tiles (world-details.js). Forests get the same clearings
// and open land the same groves on both maps, so the detail map looks like a zoomed-in world map.
const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
const smooth=t=>t*t*(3-2*t);
function value(x,z){const xi=Math.floor(x),zi=Math.floor(z),fx=smooth(x-xi),fz=smooth(z-zi);
 const a=hash(xi,zi),b=hash(xi+1,zi),c=hash(xi,zi+1),d=hash(xi+1,zi+1);return (a*(1-fx)+b*fx)*(1-fz)+(c*(1-fx)+d*fx)*fz;}
// 0..1, features ~20 world units (half a world tile) with smaller edges
export function treeClumpV270(x,z){return value(x/20+13.7,z/20+5.1)*.7+value(x/7+91.3,z/7+47.9)*.3;}
// chance that a candidate tree is kept: dense forests keep most trees and get clearings,
// open land keeps trees only in groves
export function treeKeepV270(x,z,forest){const n=treeClumpV270(x,z);
 return forest?Math.min(1,Math.max(0,.15+1.25*n)):Math.min(1,Math.max(0,(n-.42)*2.6));}
// average keep rate, used to oversample candidates so the overall tree count stays as intended
export const KEEP_MEAN_V270={forest:.78,open:.28};
export const FOREST_BIOMES_V270=new Set(['forest','jungle','taiga']);
