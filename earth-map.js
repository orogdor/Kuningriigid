import {WORLD_WIDTH,WORLD_DEPTH,ORIGIN_X,ORIGIN_Z} from './campaign.js';
// Deliberately broad, hand-drawn silhouettes: Earth-inspired geography, seeded coasts.
export const EARTH_STARTS=[{c:66,r:27},{c:87,r:31},{c:68,r:52},{c:104,r:38}];
export const CONTINENTS=[
[[.575,.36],[.605,.40],[.616,.46],[.594,.474],[.57,.41]],
[[.07,.2],[.12,.14],[.23,.11],[.32,.16],[.35,.23],[.30,.33],[.31,.40],[.27,.43],[.25,.49],[.22,.46],[.18,.39],[.15,.31],[.1,.28]],
[[.35,.08],[.41,.10],[.42,.16],[.39,.26],[.35,.21],[.34,.14]],
[[.28,.49],[.35,.48],[.42,.55],[.43,.63],[.39,.73],[.37,.83],[.34,.90],[.31,.79],[.30,.68],[.27,.58]],
[[.48,.27],[.51,.20],[.55,.21],[.56,.12],[.59,.09],[.61,.22],[.69,.17],[.75,.13],[.89,.17],[.95,.24],[.93,.31],[.86,.38],[.85,.44],[.81,.49],[.78,.47],[.76,.42],[.73,.43],[.69,.40],[.66,.54],[.63,.45],[.59,.42],[.58,.36],[.52,.37],[.50,.32]],
[[.48,.40],[.55,.39],[.60,.43],[.63,.49],[.61,.58],[.60,.66],[.56,.77],[.53,.75],[.50,.65],[.48,.55],[.46,.48]],
[[.82,.68],[.89,.64],[.95,.70],[.96,.77],[.92,.82],[.86,.80],[.81,.75]],
[[.63,.66],[.65,.68],[.65,.74],[.63,.78],[.62,.73]],
[[.9,.34],[.91,.35],[.9,.42],[.88,.44],[.89,.39]],
[[.76,.56],[.82,.57],[.87,.60],[.87,.62],[.80,.60],[.76,.58]],
[[.90,.86],[.92,.85],[.94,.90],[.93,.94],[.91,.92]]
];
function signedDistance(u,v,poly){let inside=false,distance=Infinity;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[a,b]=poly[i],[c,d]=poly[j];if((b>v)!==(d>v)&&u<(c-a)*(v-b)/(d-b)+a)inside=!inside;const dx=c-a,dy=d-b,t=Math.max(0,Math.min(1,((u-a)*dx+(v-b)*dy)/(dx*dx+dy*dy)));distance=Math.min(distance,Math.hypot(u-a-t*dx,v-b-t*dy))}return inside?distance:-distance}
export function earthHeight(x,z,smooth){const u=(x-ORIGIN_X)/WORLD_WIDTH,v=(z-ORIGIN_Z)/WORLD_DEPTH;let coast=-1;for(const polygon of CONTINENTS)coast=Math.max(coast,signedDistance(u,v,polygon));coast+=(smooth(u*65+74,v*65+11)-.5)*.014+(smooth(u*140+91,v*140+48)-.5)*.004;const relief=smooth(x/190+400,z/190+300);return coast>0?Math.min(30,coast*1000)*(0.35+relief*.9):Math.max(-26,coast*900)}
