// V138: historically grown street blocks, continuous over neighboring 225x195 detail tiles.
// Pure/deterministic: candidate planning cannot change saves or reserve fake buildings.
import {DETAIL_TILE_X,DETAIL_TILE_Z,DETAIL_HALF_X,DETAIL_HALF_Z} from './detail-scale-v123.js';
import {stoneTownPlotScore} from './stone-town-plan-v163.js';
import {compactStonePlotScoreV172,compactStoneTypesV172} from './compact-stone-v172.js';
import {wornStreetCellsV173,overlapsWornStreetV173} from './living-streets-v173.js';
import {indexActiveStreetV174,streetfrontScoreV174,courtyardScoreV174} from './streetfront-v174.js';
const hash=(a,b,seed=0)=>{const t=Math.sin(a*127.1+b*311.7+seed*74.7)*43758.5453;return t-Math.floor(t);};
const sqr=x=>x*x;
const snap=x=>Math.round(x*2)/2;
const CIVIC=new Set(['market','library','school','public_school','high_school','study','scriptorium','warehouse','cellar','guildhall','chapel','temple','townhall','inn','keep']);
const INDUSTRIAL=new Set(['saw','mason','pottery_kiln','bronze_foundry','smith','smelter','barracks','archery']);
const RURAL=new Set(['farm','pasture','field','hunter','lumber','quarry','forester','well','fisher']);
export const V138_BUILD_MARGIN=8; // only keep a roof-width of setback; allow plots at all four tile edges
// Main arteries radiate from the parent town center; secondary bent lanes
// follow irregular rings. They work in global-detail coordinates and therefore
// continue across a seam without restarting at a new tile.
export function ancientStreetSpace(x,z,seed=0){
 const angle=Math.atan2(z,x),radius=Math.hypot(x,z),phase=hash(seed,5)*Math.PI*2;
 const bend=(t)=>.13*Math.sin(t*.013+phase)+.05*Math.sin(t*.029-phase);
 const arms=4,theta=((angle-bend(radius)+phase)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);
 let nearestRay=Infinity;
 for(let i=0;i<arms;i++){
  const ray=i*2*Math.PI/arms;
  const diff=Math.abs(Math.atan2(Math.sin(theta-ray),Math.cos(theta-ray)));
  nearestRay=Math.min(nearestRay,diff*radius);
 }
 // Three alternating circumferential market/quarter routes, wider near center.
 const ringIndex=Math.round((radius-72)/85);
 const ring=72+85*ringIndex+4*Math.sin(angle*4+phase+ringIndex*.7);
 const ringDistance=Math.abs(radius-ring);
 return {road:nearestRay<(radius<70?4.2:5.5)||ringDistance<4.5,artery:nearestRay,ring:ringDistance,radius};
}
export function historicalBuildingPlots(tile,parent,type='house',seed=0,stoneAge=false){
 if(!tile||!parent)return [];
 const dx=tile.c-parent.c,dz=tile.r-parent.r;
 const hall=parent.economy?.buildings?.find(b=>b.type==='hall'&&!b.virtual)||{x:0,z:0};
 // V172: only already-built capital houses influence new capital plots.
 // Ignore separate districts so all coordinates share the same hall origin.
 const coreNeighbours=stoneAge&&dx===0&&dz===0?
  (parent.economy?.buildings||[]).filter(b=>b.hp>0&&!b.virtual&&b.type==='house')
   .map(b=>({type:b.type,x:b.x-hall.x,z:b.z-hall.z,hp:b.hp})):[];
 // V173: inspect REAL citizen-worn footpaths once per batch. This is a
 // read-only input: the pedestrian Navigation system continues to create and
 // age the roads, and placing a building never adds fictitious trail heat.
 const protectPaths=type==='house'||CIVIC.has(type)||INDUSTRIAL.has(type);
 const activeTrails=protectPaths?wornStreetCellsV173(tile.world,
  tile.world?.trailTime||parent.world?.trailTime||0):[];
 // Use the read-only V173 traffic sample as the street-front reference;
 // one 12m spatial index per plot batch keeps mobile AI evaluation bounded.
 const streetIndex=stoneAge&&type==='house'?indexActiveStreetV174(activeTrails):null;
 const plots=[];
 const margin=V138_BUILD_MARGIN,grid=type==='market'?25:type==='house'?(stoneAge?10.2:10.6):13.2;
 // Staggered rows and slight bends, not a chessboard; deterministic per tile.
 const line=0;
 for(let row=0,z=-DETAIL_HALF_Z+margin;z<=DETAIL_HALF_Z-margin;row++,z+=grid){
  const rowShift=(row%2)*grid*.43;
  for(let col=0,x=-DETAIL_HALF_X+margin+rowShift;x<=DETAIL_HALF_X-margin;col++,x+=grid){
   const h=hash(dx*40+col,dz*40+row,seed),j=hash(dx*13+row,dz*19+col,seed+17);
   const px=snap(x+(h-.5)*3.3),pz=snap(z+(j-.5)*3.3);
   if(Math.abs(px)>DETAIL_HALF_X-margin||Math.abs(pz)>DETAIL_HALF_Z-margin)continue;
   const gx=dx*DETAIL_TILE_X+px-hall.x,gz=dz*DETAIL_TILE_Z+pz-hall.z;
   const street=ancientStreetSpace(gx,gz,seed);
   // The heart of a capital reserves space for a main bazaar/sanctuary.
   if(type==='house'&&street.radius<20)continue;
   if(street.road)continue;
   if(protectPaths&&activeTrails.length&&
    overlapsWornStreetV173({x:px,z:pz},type,activeTrails))continue;
   // V173: account for whole roofs as well as center points. This protects
   // the *unbuilt* arterial space; actual visible roads still need traffic.
   if(type==='house'&&stoneAge&&[
      [-4.5,-4.1],[4.5,-4.1],[-4.5,4.1],[4.5,4.1]
     ].some(([ox,oz])=>ancientStreetSpace(gx+ox,gz+oz,seed).road))continue;
   // No building sits on a main route or over the wide marketplace.
   const key=Math.round(street.radius/24);
   const quarterNoise=hash(Math.floor(gx/32),Math.floor(gz/32),seed+5);
   const civic=CIVIC.has(type),rural=RURAL.has(type),industrial=INDUSTRIAL.has(type);
   const compact=stoneAge&&compactStoneTypesV172(type)?
    compactStonePlotScoreV172(type,gx,gz,coreNeighbours):null;
   const priority=(compact!=null?compact:stoneAge?stoneTownPlotScore(type,gx,gz,seed):
                    civic?Math.abs(street.radius-42)*.13:
                    rural?-street.radius*.075:
                    industrial?Math.abs(street.radius-170)*.045:
                    street.radius*.22)+
                    Math.abs(street.artery-12)*.08+(quarterNoise-.5)*3+
                    (type==='house'?hash(key,row,seed)*.9:0)+
                    // V174: frontage/courtyard bias never creates fake roads,
                    // and cannot override V173's real path collision checks.
                    (stoneAge&&type==='house'?
                     streetfrontScoreV174({x:px,z:pz},streetIndex)+
                     (dx===0&&dz===0?courtyardScoreV174({x:gx,z:gz},coreNeighbours):0):0);
   plots.push({x:px,z:pz,priority,globalX:gx,globalZ:gz});
  }
 }
 plots.sort((a,b)=>a.priority-b.priority||a.globalZ-b.globalZ||a.globalX-b.globalX);
 return plots.map(p=>({x:p.x,z:p.z}));
}
export function nextPlotBatch(plots,cursor=0,count=32){
 if(!plots.length)return [];
 const out=[],offset=((cursor%plots.length)+plots.length)%plots.length;
 for(let i=0;i<Math.min(count,plots.length);i++)out.push(plots[(offset+i)%plots.length]);
 return out;
}
export function tilesTouch(a,b){return Math.abs(a.c-b.c)+Math.abs(a.r-b.r)===1;}
export function urbanExpansionEligible(game,parent,p){
 if(!parent||!p||game.territoryOwner(p)?.id!==parent.id)return false;
 const cell=game.cell(p);
 if(!cell?.land||cell.mountain)return false;
 const urban=t=>!game.isCountyTile(t,parent)||!!game.contextAt(t,false)?.urbanExpansionV138;
 return [[1,0],[-1,0],[0,1],[0,-1]].some(([dc,dr])=>{
  const n={c:p.c+dc,r:p.r+dr};
  if(!urban(n))return false;
  const context=game.contextAt(n,false);
  if(!context)return false;
  // A neighbouring street block is dense enough before expansion begins.
  return context.economy.buildings.filter(b=>b.hp>0&&!b.virtual&&
   ['house','market','well','warehouse','cellar','library','school','public_school','high_school','study','scriptorium'].includes(b.type)).length>=2;
 });
}
