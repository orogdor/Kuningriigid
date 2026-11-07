import {memoHeight} from './perf-render-v131.js';
// V67. One procedural elevation/drainage/transport coordinate space.
// Everything is generated in WORLD metres and merely projected at different
// scales; there are no separate local rivers, road segments or rock placements.
import {COLS,ROWS,cellAt} from './campaign.js';
import {roadPoints,roadLevel,roadStrength} from './roads.js?v=59';
export {DETAIL_X,DETAIL_Z,DETAIL_Y} from './detail-scale-v123.js';
import {DETAIL_X,DETAIL_Z,DETAIL_Y} from './detail-scale-v123.js';
const S=50,PI=Math.PI;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const hypot=(a,b)=>Math.hypot(a,b)||1;
const unit=(a,b)=>{const l=hypot(a,b);return {x:a/l,z:b/l}};
const caches=new WeakMap();
const idx=p=>p.r*COLS+p.c;
function prep(game){
 let cache=caches.get(game);if(cache)return cache;
 const incoming=new Map(),edges=[],bucket=new Map();
 for(const c of game.cells)if(c.river&&c.riverTo){
  const to=game.cell(c.riverTo);if(!to)continue;
  edges.push({c,to});
  const k=idx(to),list=incoming.get(k)||[];list.push(c);incoming.set(k,list);
 }
 for(const arr of incoming.values())arr.sort((a,b)=>(b.riverFlow||0)-(a.riverFlow||0));
 const graph={incoming,edges,bucket,paths:new Map(),anchors:new Map(),confluenceLakes:new Map()};
 // River centre points drift toward the neighbouring reach. A ford or bridge
 // stays at its original crossing, and all tributaries share one junction.
 if(game.s?.geographyVersion>=7){
  for(const {c} of edges){
   const k=idx(c),up=incoming.get(k)?.[0],down=game.cell(c.riverTo);
   if(!c.ford&&!c.bridge&&up&&down?.land&&incoming.get(k)?.length===1){
    // Coherent landscape-scale bends, not a separate zigzag inside each tile.
    const dx=down.x-up.x,dz=down.z-up.z,len=hypot(dx,dz);
    const low=1-smooth(((up.h+c.h+down.h)/3-18)/14);
    const bend=(game.smooth(c.x/145+13.7,c.z/145+5.1)-.5)*2;
    const shift=7.5*low*bend;
    graph.anchors.set(k,{x:c.x+clamp((up.x+down.x-2*c.x)*.18-dz/len*shift,-13,13),
      z:c.z+clamp((up.z+down.z-2*c.z)*.18+dx/len*shift,-13,13)});
   }
   const branches=incoming.get(k)||[];
   if(branches.length<2||!c.land||!down?.land||c.ford||c.bridge||c.h<4)continue;
   const h=Math.sin((c.c+game.s.seed*.013)*127.1+(c.r-game.s.seed*.017)*311.7)*43758.5453;
   const chance=h-Math.floor(h);
   if(chance>=.28)continue;
   const flow=c.riverFlow||branches.reduce((n,p)=>n+(p.riverFlow||0),0);
   graph.confluenceLakes.set(k,clamp(12+Math.sqrt(flow)*(.48+chance*.7),14,32));
  }
 }
 // Smooth movable visual anchors; fixed crossings, confluences and mouths
 // retain their exact drainage positions. Three passes remove cell zigzags.
 for(let pass=0;pass<3;pass++){
  const next=new Map(graph.anchors);
  for(const {c} of edges){
   const k=idx(c),p=graph.anchors.get(k);if(!p)continue;
   const up=incoming.get(k)?.[0],down=game.cell(c.riverTo);
   if(!up||!down?.land)continue;
   const a=riverPoint(game,graph,up),b=riverPoint(game,graph,down);
   next.set(k,{x:c.x+clamp((a.x+2*p.x+b.x)/4-c.x,-13,13),
     z:c.z+clamp((a.z+2*p.z+b.z)/4-c.z,-13,13)});
  }
  graph.anchors=next;
 }
 caches.set(game,graph);
 // The river position field is spatially indexed. Detail and atlas queries
 // use the same samples, instead of checking every river globally.
 for(const e of edges){
  e.points=sampleRiver(game,e.c,12,graph);
  for(let i=1;i<e.points.length;i++){
   const a=e.points[i-1],b=e.points[i];
   const reach=Math.max(19,Math.max(a.width,b.width)*2.4+4); // wide estuaries stay visible from every cell they cover
   const minX=Math.min(a.x,b.x)-reach,maxX=Math.max(a.x,b.x)+reach;
   const minZ=Math.min(a.z,b.z)-reach,maxZ=Math.max(a.z,b.z)+reach;
   const p=cellAt(minX,minZ),q=cellAt(maxX,maxZ);
   const cc0=p?.c??clamp(Math.floor((minX+650)/50),0,COLS-1),cc1=q?.c??clamp(Math.floor((maxX+650)/50),0,COLS-1);
   const rr0=p?.r??clamp(Math.floor((minZ+550)/50),0,ROWS-1),rr1=q?.r??clamp(Math.floor((maxZ+550)/50),0,ROWS-1);
   a.waterHeight??=Math.max(.86,smoothAtlasHeight(game,a.x,a.z)-(2.4+Math.min(2.1,a.width*.20)));
   b.waterHeight??=Math.max(.86,smoothAtlasHeight(game,b.x,b.z)-(2.4+Math.min(2.1,b.width*.20)));
   // A ford belongs to the upstream river cell. Its shallow bed runs across
   // the water, with a short upstream/downstream transition to deep channel.
   const seg={a,b,ford:!!e.c.ford&&!e.c.bridge,fordX:e.c.x,fordZ:e.c.z,
    fordTangent:e.points.length>1?unit(e.points[1].x-e.points[0].x,e.points[1].z-e.points[0].z):{x:1,z:0}};
   for(let r=rr0;r<=rr1;r++)for(let c=cc0;c<=cc1;c++){
    const k=r*COLS+c,arr=bucket.get(k)||[];arr.push(seg);bucket.set(k,arr);
   }
  }
 }
 return graph;
}
function drainageTangent(graph,cell,up=null){
 const prior=up||graph.incoming.get(idx(cell))?.[0]||null,down=cell.riverTo;
 const from=prior||cell,to=down?{x:0,z:0}:null;
 // Actual downstream point is supplied by river cell lookup in sampleRiver.
 return {prior,down};
}
function hermite(a,b,m0,m1,t){
 const t2=t*t,t3=t2*t,h00=2*t3-3*t2+1,h10=t3-2*t2+t,h01=-2*t3+3*t2,h11=t3-t2;
 return {x:h00*a.x+h10*m0.x+h01*b.x+h11*m1.x,
 z:h00*a.z+h10*m0.z+h01*b.z+h11*m1.z};
}
function hermiteTangent(a,b,m0,m1,t){
 const t2=t*t,d00=6*t2-6*t,d10=3*t2-4*t+1,d01=-6*t2+6*t,d11=3*t2-2*t;
 return {x:d00*a.x+d10*m0.x+d01*b.x+d11*m1.x,z:d00*a.z+d10*m0.z+d01*b.z+d11*m1.z};
}
function riverPoint(game,graph,cell){return graph.anchors.get(idx(cell))||cell;}
function mouthPoint(game,cell,to){
 if(to.land||game.s?.geographyVersion<6)return to;
 // Stop shortly beyond the coast instead of drawing a long, squared-off
 // tongue across the sea cell. The water colour still fades into the sea.
 let lo=0,hi=1;for(let i=0;i<12;i++){
  const t=(lo+hi)/2,x=cell.x+(to.x-cell.x)*t,z=cell.z+(to.z-cell.z)*t;
  if(game.atlasHeight(x,z)>.3)lo=t;else hi=t;
 }
 const t=Math.min(1,(lo+hi)/2+12/hypot(to.x-cell.x,to.z-cell.z));
 return {x:cell.x+(to.x-cell.x)*t,z:cell.z+(to.z-cell.z)*t};
}
function tangent(game,graph,cell,previous=null){
 const up=previous||graph.incoming.get(idx(cell))?.[0]||null;
 const downstream=cell.riverTo?game.cell(cell.riverTo):null;
 const here=riverPoint(game,graph,cell),prior=up&&riverPoint(game,graph,up);
 const next=downstream&&(downstream.land?riverPoint(game,graph,downstream):mouthPoint(game,cell,downstream));
 if(prior&&next)return unit(next.x-prior.x,next.z-prior.z);
 if(next)return unit(next.x-here.x,next.z-here.z);
 if(prior)return unit(here.x-prior.x,here.z-prior.z);
 return {x:1,z:0};
}
export function sampleRiver(game,cell,count=12,graph=null){
 if(!cell?.riverTo)return [];
 graph??=prep(game);
 const to=game.cell(cell.riverTo);if(!to)return [];
 const start=riverPoint(game,graph,cell),end=to.land?riverPoint(game,graph,to):mouthPoint(game,cell,to);
 const len=hypot(end.x-start.x,end.z-start.z),t0=tangent(game,graph,cell),t1=tangent(game,graph,to,cell);
 const source=Math.max(1.5,cell.riverWidth||3),target=Math.max(source,to.riverWidth||source*1.18);
 const pts=[];
 for(let i=0;i<=count;i++){
  const t=i/count,p=hermite(start,end,{x:t0.x*len,z:t0.z*len},{x:t1.x*len,z:t1.z*len},t);
  let width=source+(target-source)*smooth(t);
  // Hermite follows smoothed anchors; no per-cell oscillation on the banks.
  // A seeded minority of confluences broadens into small or larger lakes.
  // The same radius is used by every incoming and outgoing reach.
  const lakeAtStart=graph.confluenceLakes.get(idx(cell))||0;
  const lakeAtEnd=to.land?(graph.confluenceLakes.get(idx(to))||0):0;
  if(lakeAtStart)width=Math.max(width,source+(lakeAtStart-source)*(1-smooth(t/.53)));
  if(lakeAtEnd)width=Math.max(width,target+(lakeAtEnd-target)*(1-smooth((1-t)/.53)));
  // V249 (new worlds): the last stretch opens into a funnel-shaped estuary towards the sea.
  if(game.s?.geographyVersion>=6)width*=1+1.5*estuaryV249(game,p.x,p.z);
  pts.push({...p,width,flow:cell.riverFlow||0});
 }
 return pts;
}
export const getRivers=game=>prep(game).edges;
// V249: 0 inland, rising to 1 where the river meets sea level (coast and open sea).
export function estuaryV249(game,x,z){return 1-smooth((smoothAtlasHeight(game,x,z)-.30)/6);}
// V249: 1 on dry land, 0 on the beach and in the sea. River banks, levees and raised meadows
// only exist on land; at the mouth the riverbed runs down into the sea floor instead.
export function landnessV249(game,x,z){return smooth((smoothAtlasHeight(game,x,z)-1.2)/4);}
export function riverNear(game,x,z){
 const pos=cellAt(x,z);if(!pos)return {distance:Infinity,width:0};
 const bucket=prep(game).bucket.get(idx(pos));if(!bucket)return {distance:Infinity,width:0};
 let nearest=Infinity,width=0,waterHeight=.86,fordStrength=0;
 for(const {a,b,ford,fordX,fordZ,fordTangent}of bucket){
  const dx=b.x-a.x,dz=b.z-a.z,len=dx*dx+dz*dz||1;
  const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/len,0,1),px=a.x+t*dx,pz=a.z+t*dz;
  const d=Math.hypot(px-x,pz-z),w=a.width+(b.width-a.width)*t;
  // A tributary can have a slightly wider closest water segment. The
  // ford still must stay shallow at its actual crossing coordinates.
  if(ford&&d<=w+2){
   const along=Math.abs((x-fordX)*fordTangent.x+(z-fordZ)*fordTangent.z);
   const across=Math.abs((x-fordX)*(-fordTangent.z)+(z-fordZ)*fordTangent.x);
   if(across<=w+1.5)fordStrength=Math.max(fordStrength,1-smooth((along-5.5)/5));
  }
  if(d-w<nearest-width){
   nearest=d;width=w;waterHeight=a.waterHeight+(b.waterHeight-a.waterHeight)*t;
  }
 }
 return {distance:nearest,width,waterHeight,fordStrength};
}
// V153: the map cell heights are interpolated with a cubic B-spline (C2 smooth, no flat spot on
// every cell centre, no overshoot), and relief detail comes from domain-warped fractal noise.
// Earlier sine "ridges", "folds" and coastal ledges repeated regularly and showed on the detail
// map as round concentric waves. Visual height only: gameplay uses its own baked detail heights.
const cellSamples=new WeakMap();
function samples(game){
 let a=cellSamples.get(game);if(a)return a;a=new Float32Array(COLS*ROWS);
 game.cells.forEach((c,i)=>{a[i]=c.land?(c.river&&!c.bridge?Math.max(4,c.h-3.5):Math.max(5,c.h)):Math.min(-6,c.h);});
 cellSamples.set(game,a);return a;
}
const bs=t=>{const t2=t*t,t3=t2*t;return [(1-3*t+3*t2-t3)/6,(4-6*t2+3*t3)/6,(1+3*t+3*t2-3*t3)/6,t3/6];};
export function smoothAtlasHeight(game,x,z){
 if(!Number.isFinite(x)||!Number.isFinite(z))return -15;
 const a=samples(game),fx=(x+650)/S-.5,fz=(z+550)/S-.5,c=Math.floor(fx),r=Math.floor(fz),wu=bs(fx-c),wv=bs(fz-r);
 let h=0;
 for(let j=0;j<4;j++){const rr=r-1+j;let row=0;for(let i=0;i<4;i++){const cc=c-1+i;row+=wu[i]*(cc<0||cc>=COLS||rr<0||rr>=ROWS?-15:a[rr*COLS+cc]);}h+=wv[j]*row;}
 // keep coastlines where the cells put them: blend toward the original height near sea level
 const o=game.atlasHeight(x,z),k=smooth((Math.abs(o)-1.5)/4);
 return o+(h-o)*k;
}
const n2=(game,x,z)=>game.smooth(x,z);
const ridged=v=>{const r=1-Math.abs(2*v-1);return r*r;};
export function baseHeight(game,x,z){
 const h=smoothAtlasHeight(game,x,z);
 // warped coordinates break any regular pattern
 const wx=x+(n2(game,x/97+11.3,z/97+4.1)-.5)*70,wz=z+(n2(game,x/97+31.7,z/97+52.9)-.5)*70;
 // gentle rolling ground on the lowlands (beaches stay flat)
 const lowland=smooth((h-2.5)/5)*(1-smooth((h-22)/14));
 const roll=((n2(game,wx/150+3.1,wz/150+7.7)-.5)*2.6+(n2(game,wx/52+19,wz/52+23)-.5)*1.1)*lowland;
 // mountains: ridged multifractal crests, gullies and broken scarps
 const steep=smooth((h-18)/19);
 let relief=0;
 if(steep>0){
  const r1=ridged(n2(game,wx/165+71,wz/165+13)),r2=ridged(n2(game,wx/72+5,wz/72+91)),r3=ridged(n2(game,wx/31+43,wz/31+27));
  const scarp=smooth((r2-.55)/.18)*(6+10*r1);
  relief=steep*(18+50*r1+30*r2*(.35+.65*r1)+9*r3*(.4+.6*r2)+scarp);
 }
 const sub=Math.max(0,.72-h);
 const oceanFloor=sub?(2.5*smooth(sub/7)+sub*.10):0;
 return h+roll+relief-oceanFloor;
}
// V323: smooth a narrow band around an estuary without touching the
// drainage cells. Sample the same undisturbed heights for terrain and sea.
// This removes cell-corner sand spits and avoids distinct shoreline masks.
export function estuaryShoreHeightV323(game,x,z,near=null){
 const h=baseHeight(game,x,z),waterline=.72;
 const coastal=1-smooth(Math.abs(h-waterline)/4);
 if(coastal<=0)return h;
 return estuaryFlareGroundV344(game,x,z,h,estuarySmoothV323(game,x,z,h,coastal,near));
}
function estuarySmoothV323(game,x,z,h,coastal,near){
 near??=riverNear(game,x,z);
 if(!Number.isFinite(near.distance))return h;
 const corridor=1-smooth((near.distance-near.width-6)/18);
 if(corridor<=0)return h;
 // Weighted 3x3 footprint, in WORLD metres. No repeated 50 m cell shape
 // and no max(rawAtlas, smoothedTerrain) ridge along the coast.
 const radius=5,weights=[1,2,1];let average=0;
 for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)
  average+=baseHeight(game,x+i*radius,z+j*radius)*weights[i+1]*weights[j+1]/16;
 return h+(average-h)*coastal*corridor*.65;
}
// V344: rounded river mouths. Where a river reaches the sea, its banks
// curve outward and continue as the sea shore instead of meeting the
// coastline in a sharp corner. This is a smooth union of two water bodies:
// distance to the river bank and distance to the coast (height above the
// waterline divided by the local slope). Near the corner, where both are
// similar, the ground is lowered by exactly the amount that moves the
// shoreline out by the smooth-union distance, so beach slopes stay natural.
// Drawing only: riverNear() widths, navigation, fords and saves are unchanged.
const SEA_V344=.72,flareCachesV344=new WeakMap();
export function flareRadiusV344(coastWidth){return clamp(coastWidth*2+28,32,80);}
export function smoothUnionCutV344(a,b,k){const h=Math.max(k-Math.abs(a-b),0)/k;return h*h*k*.25;}
export function estuaryMouthsV344(game){
 let cache=flareCachesV344.get(game);if(cache)return cache;
 const edges=getRivers(game),byCell=new Map();
 for(const e of edges)byCell.set(idx(e.c),e);
 const graph=prep(game),mouths=[],bucket=new Map();
 for(const e of edges){
  if(e.to?.land!==false||!e.points||e.points.length<2)continue;
  // Include the upstream reach, so a wide opening never stops at a cell centre.
  const up=graph.incoming.get(idx(e.c))?.[0],before=up?byCell.get(idx(up))?.points||[]:[];
  const pts=[...before.slice(0,-1),...e.points].map(p=>({x:p.x,z:p.z,w:p.width}));
  const ci=Math.max(1,pts.findIndex(p=>baseHeight(game,p.x,p.z)<=SEA_V344)),coast=ci>0?pts[ci]:pts.at(-1);
  const k=flareRadiusV344(coast.w),reach=Math.max(...pts.map(p=>p.w))+k+4;
  // One beach slope per mouth, measured beside both banks at the coast.
  // A per-point gradient would jump at atlas cell edges and leave squares.
  const prev=pts[ci-1]||pts[0],dl=Math.hypot(coast.x-prev.x,coast.z-prev.z)||1,nx=-(coast.z-prev.z)/dl,nz=(coast.x-prev.x)/dl;
  let slopeSum=0,slopeN=0;
  for(const off of [coast.w+8,coast.w+20,-(coast.w+8),-(coast.w+20)]){
   const x=coast.x+nx*off,z=coast.z+nz*off,e=4;
   slopeSum+=Math.hypot(baseHeight(game,x+e,z)-baseHeight(game,x-e,z),baseHeight(game,x,z+e)-baseHeight(game,x,z-e))/(2*e);slopeN++;
  }
  const slope=clamp(slopeSum/slopeN,.06,.8);
  const m={pts,k,slope,minX:Math.min(...pts.map(p=>p.x))-reach,maxX:Math.max(...pts.map(p=>p.x))+reach,
   minZ:Math.min(...pts.map(p=>p.z))-reach,maxZ:Math.max(...pts.map(p=>p.z))+reach};
  mouths.push(m);
  const c0=Math.floor((m.minX+650)/S),c1=Math.floor((m.maxX+650)/S),r0=Math.floor((m.minZ+550)/S),r1=Math.floor((m.maxZ+550)/S);
  for(let r=Math.max(0,r0);r<=Math.min(ROWS-1,r1);r++)for(let c=Math.max(0,c0);c<=Math.min(COLS-1,c1);c++){
   const key=r*COLS+c,list=bucket.get(key)||[];list.push(m);bucket.set(key,list);
  }
 }
 cache={mouths,bucket};flareCachesV344.set(game,cache);return cache;
}
// strength 0..1 and the reshaped natural ground at x,z. Only low coastal
// ground is reshaped (never above 4.7 m), and the sea floor is never dug
// deeper than 1.2 m below the waterline.
let lastFlareV344=null;
export function estuaryFlareV344(game,x,z,h=null){
 const pos=cellAt(x,z),list=pos&&estuaryMouthsV344(game).bucket.get(idx(pos));
 const near=list&&list.some(m=>x>=m.minX&&x<=m.maxX&&z>=m.minZ&&z<=m.maxZ)?list.filter(m=>x>=m.minX&&x<=m.maxX&&z>=m.minZ&&z<=m.maxZ):null;
 if(!near)return {strength:0,ground:h??baseHeight(game,x,z)};
 h??=baseHeight(game,x,z);
 // worldElevation() and the shore filter ask for the same point in a row.
 const last=lastFlareV344;
 if(last&&last.game===game&&last.x===x&&last.z===z&&last.h===h)return last.result;
 const result=flareAtV344(game,x,z,h,near);
 lastFlareV344={game,x,z,h,result};return result;
}
function flareAtV344(game,x,z,h,near){
 const lift=1-smooth((h-2.4)/2.3);
 if(lift<=0)return {strength:0,ground:h};
 let drop=0;
 for(const m of near){
  let bank=Infinity;
  for(let i=1;i<m.pts.length;i++){
   const a=m.pts[i-1],b=m.pts[i],dx=b.x-a.x,dz=b.z-a.z,len=dx*dx+dz*dz||1;
   const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/len,0,1);
   bank=Math.min(bank,Math.hypot(a.x+dx*t-x,a.z+dz*t-z)-(a.w+(b.w-a.w)*t));
  }
  if(bank>=m.k)continue;
  // The fillet only exists close to BOTH shores; a plain smooth union
  // would also lower ground far inland along the river/coast bisector.
  const shore=(h-SEA_V344)/m.slope,close=1-smooth((Math.max(bank,shore)-.45*m.k)/(.45*m.k));
  if(close>0)drop=Math.max(drop,smoothUnionCutV344(bank,shore,m.k)*close*m.slope);
 }
 if(drop<=0)return {strength:0,ground:h};
 const ground=Math.max(h-drop*lift,Math.min(h,SEA_V344-1.2));
 return {strength:smooth(drop/1.5)*lift,ground};
}
function estuaryFlareGroundV344(game,x,z,h,smoothed){
 const flare=estuaryFlareV344(game,x,z,h);
 return flare.strength>0||flare.ground<h?Math.min(smoothed,smoothed+(flare.ground-h)):smoothed;
}
// visual=true (drawing only): where the rolling ground dips below a river's water level, the banks
// rise gently to just above the water (natural levees), so the river sits in its bed instead of
// floating above the land. Navigation keeps calling it without the flag (V161).
// V223.2: river surface and its visible bank use exactly one water-level
// function, including estuary blending. The atlas drainage heights and
// gameplay collision data keep their original (non-visual) computation.
export function visibleRiverHeight(game,x,z,rawHeight=null){
 const h=rawHeight??riverNear(game,x,z).waterHeight??.86;
 const t=smooth((game.atlasHeight(x,z)-.30)/3.7);
 return .78+(h-.78)*t;
}
export function worldElevation(game,x,z,visual=false){
 let base=baseHeight(game,x,z);
 const {distance:d,width:w,waterHeight,fordStrength=0}=riverNear(game,x,z);
 // V344: a rounded mouth can reach past the river's own lookup radius.
 if(!Number.isFinite(d))return visual&&Math.abs(base-.72)<5?estuaryShoreHeightV323(game,x,z,{distance:d,width:w}):base;
 const inner=w*1.04,outer=Math.max(inner+3.5,w*1.8+3);
 if(visual&&w>.05){
  // Shore terrain and the new sea mask share the same local smoothing.
  // V344: the rounded opening can reach beyond the old 30 m shore band.
  const flare=Math.abs(base-.72)<5?estuaryFlareV344(game,x,z,base).strength:0;
  if((d<w+30||flare>0)&&Math.abs(base-.72)<5)
   base=estuaryShoreHeightV323(game,x,z,{distance:d,width:w});
  const level=visibleRiverHeight(game,x,z,waterHeight);
  // No levee or raised bank inside the opening: there the bank IS the shore.
  const rim=level+.60,reach=outer+18,land=landnessV249(game,x,z)*(1-flare);
  if(base<rim&&d<reach)
   base+=(rim-base)*(1-smooth((d-outer)/(reach-outer)))*land; // V249: no levee wall out into the sea
  // The former V161 drawing terrain was 2.2 m below the water all
  // the way to its OUTER edge. That made a sharp airborne water slab,
  // even though the centre of the stream was physically underwater.
  // Keep a deep centre but taper to only 6 cm of water at the shoreline.
  if(d<=w){
   const depth=2.2+Math.max(0,1-d/Math.max(.1,inner))*1.4;
   const fordDepth=depth*(1-fordStrength)+.42*fordStrength;
   const shallowing=smooth((d-w*.30)/Math.max(.01,w*.70));
   const visibleDepth=fordDepth*(1-shallowing)+.06*shallowing;
   // V319: stop sculpting a separate river trench underneath open seawater.
   // Fade the visual river bed into the original sea floor over the beach.
   const coastal=smooth((smoothAtlasHeight(game,x,z)+.4)/2.4);
   return base+(Math.min(base,level-visibleDepth)-base)*coastal;
  }
  // The outside bank rises continuously from that SAME shoreline
  // towards the raised river meadow. No hollow land below the water
  // edge, and no detached opaque strip at a tributary or estuary.
  if(d<outer){
   const t=smooth((d-w)/(outer-w));
   const bank=(level-.06)*(1-t)+Math.max(base,level+.10)*t;
   // V249: towards the sea the bank follows the beach/sea floor down instead of a sand bar
   const coastal=smooth((smoothAtlasHeight(game,x,z)+.4)/2.4);
   const shaped=Math.min(base,bank)*(1-land)+bank*land;
   return base+(shaped-base)*coastal;
  }
  return base;
 }
 // Physical/gameplay terrain remains unchanged: saves, fords and
 // collision calculations must not be altered by a graphical fix.
 const deep=2.2+Math.max(0,1-d/inner)*1.4;
 const depth=deep*(1-fordStrength)+.42*fordStrength;
 const bed=waterHeight-depth;
 if(d<=inner)return Math.min(base,bed);
 if(d>=outer)return base;
 return Math.min(base,bed+(base-bed)*smooth((d-inner)/(outer-inner)));
}

export function projectHeight(y,view){return view==='detail'?(y-.7)*DETAIL_Y:y}
// V161: drawing-only height for detail maps. On mountain cells, ground above 10 rises 0.9 extra per
// unit, so mountains tower over the tile instead of being flattened to 0.3x. The mask is 0 on every
// non-mountain cell (towns, fields, roads are never on mountain cells), so nothing that stands on
// the ground changes. Gameplay keeps projectHeight()/localSurface().
export const DETAIL_MOUNTAIN_FROM=10,DETAIL_MOUNTAIN_EXTRA=.9;
const maskCaches=new WeakMap();
export function mountainMask(game,x,z){
 let m=maskCaches.get(game);if(!m){m=new Uint8Array(game.cells.length);game.cells.forEach((c,i)=>{m[i]=c.land&&c.mountain?1:0;});maskCaches.set(game,m);}
 const at=(c,r)=>c<0||r<0||c>=COLS||r>=ROWS?0:m[r*COLS+c];
 // warped lookup: foothills follow irregular natural lines, not the square cell edges
 const wx=x+(game.smooth(x/37+3.7,z/37+8.1)-.5)*30+(game.smooth(x/11+51,z/11+17)-.5)*8,wz=z+(game.smooth(x/37+61.3,z/37+2.9)-.5)*30+(game.smooth(x/11+9,z/11+77)-.5)*8;
 const u=(wx+650)/50-.5,v=(wz+550)/50-.5,c0=Math.floor(u),r0=Math.floor(v),fu=smooth(u-c0),fv=smooth(v-r0);
 {const oc=Math.floor((x+650)/50),or=Math.floor((z+550)/50);if(!at(oc,or))return 0;} // never on a non-mountain cell
 const f=at(c0,r0)*(1-fu)*(1-fv)+at(c0+1,r0)*fu*(1-fv)+at(c0,r0+1)*(1-fu)*fv+at(c0+1,r0+1)*fu*fv;
 // Fade the exaggeration to zero at a real mountain/lowland boundary.
 // The former hard tile mask exposed a vertical cut through the mountain.
 const oc=Math.floor((x+650)/50),orr=Math.floor((z+550)/50);
 let distance=Infinity;
 // Distance to the same lowland rectangles on BOTH sides of a shared edge.
 // Per-tile edge fades disagree at mountain/mountain/lowland corners.
 for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
  const cc=oc+dc,rr=orr+dr;if(at(cc,rr))continue;
  const left=cc*50-650,top=rr*50-550;
  distance=Math.min(distance,Math.hypot(Math.max(left-x,0,x-left-50),Math.max(top-z,0,z-top-50)));
 }
 const border=smooth(distance/7);
 return smooth((f-.58)/.42)*border;
}
export function visualProject(game,e,x,z){return (e-.7)*DETAIL_Y+(e>DETAIL_MOUNTAIN_FROM?(e-DETAIL_MOUNTAIN_FROM)*DETAIL_MOUNTAIN_EXTRA*mountainMask(game,x,z):0)}
export function surface(game,x,z,view='world'){return projectHeight(memoHeight(game,x,z,()=>worldElevation(game,x,z)),view)}
// Drawing heights (with river levees). Gameplay keeps surface()/localSurface().
const visualCaches=new WeakMap();
export function visualElevation(game,x,z){
 const rev=(game.s?.terrainRevision||0)+':'+(game.s?.crossingRevision||0);let c=visualCaches.get(game);
 if(!c||c.rev!==rev){c={rev,map:new Map()};visualCaches.set(game,c);}
 const key=x+','+z;let v=c.map.get(key);if(v!==undefined)return v;
 v=worldElevation(game,x,z,true);if(c.map.size>120000)c.map.clear();c.map.set(key,v);return v;
}
export function visualSurface(game,x,z,view='world'){const e=visualElevation(game,x,z);return view==='detail'?visualProject(game,e,x,z):e}
export function localVisualSurface(game,tile,x,z){const p=localToWorld(tile,x,z);return visualProject(game,visualElevation(game,p.x,p.z),p.x,p.z)}
export function worldToLocal(tile,x,z){return {x:(x-tile.x)*DETAIL_X,z:(z-tile.z)*DETAIL_Z}}
export function localToWorld(tile,x,z){return {x:tile.x+x/DETAIL_X,z:tile.z+z/DETAIL_Z}}
export function localSurface(game,tile,x,z,cache=true){const p=localToWorld(tile,x,z);return cache?surface(game,p.x,p.z,'detail'):projectHeight(worldElevation(game,p.x,p.z),'detail')}
export function inNeighbourhood(tile,x,z,margin=10){
 return Math.abs(x-tile.x)<75+margin&&Math.abs(z-tile.z)<75+margin;
}
// V223: render-only contour following. Strategic road endpoints, traffic and
// navigation still use the original world-road graph. Gentle lateral offsets
// reduce abrupt visual cut-throughs on hill slopes; river crossings stay fixed.
export function contourRoadV223(game,pts){
 if(pts.length<5)return pts;
 const count=pts.length-1,offsets=new Float32Array(pts.length);
 for(let i=2;i<count-1;i+=2){
  const a=pts[i-1],p=pts[i],b=pts[i+1];
  const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;
  const nx=-dz/len,nz=dx/len;
  const h0=baseHeight(game,p.x,p.z);
  const ha=baseHeight(game,a.x,a.z),hb=baseHeight(game,b.x,b.z);
  // Leave shallow gradients and all fords, bridges and river approaches alone.
  if(Math.abs(ha-hb)<3.1 && Math.abs(h0-(ha+hb)*.5)<2.0)continue;
  const water=riverNear(game,p.x,p.z);
  if(water.distance<water.width+7)continue;
  let score=Math.abs(h0-(ha+hb)*.5),best=0;
  for(const shift of [-1.8,-.9,.9,1.8]){
   const x=p.x+nx*shift,z=p.z+nz*shift;
   const near=riverNear(game,x,z);
   if(near.distance<near.width+5.5)continue;
   const h=baseHeight(game,x,z);
   // Prefer the gentler height profile without suddenly climbing sideways.
   const cost=Math.abs(h-(ha+hb)*.5)+Math.abs(h-h0)*.19+Math.abs(shift)*.12;
   if(cost+.3<score){score=cost;best=shift;}
  }
  offsets[i]=best;
 }
 // Keep the original graph nodes: taper offsets smoothly to zero at both ends.
 const out=pts.map(p=>({...p}));
 for(let i=1;i<count;i++){
  const prev=offsets[i-1],next=offsets[i+1];
  const shift=(offsets[i]*2+prev+next)*.25*Math.sin(PI*i/count)**.5;
  if(!shift)continue;
  const a=pts[i-1],b=pts[i+1],len=Math.hypot(b.x-a.x,b.z-a.z)||1;
  out[i].x+=-(b.z-a.z)/len*shift;
  out[i].z+=(b.x-a.x)/len*shift;
 }
 return out;
}
export function roadSpline(game,a,b,count=12,connection=null){
 if(idx(a)>idx(b))[a,b]=[b,a];
 const aa=game.cell(a),bb=game.cell(b);if(!aa||!bb)return [];
 const dx=bb.x-aa.x,dz=bb.z-aa.z,len=hypot(dx,dz),side=unit(-dz,dx);
 const offset=Math.max(-1,Math.min(1,game.noise(a.c*7+b.c,a.r*7+b.r)))*2.3;
 const irregular=game.noise(a.c*17+b.c*3,a.r*11+b.r*7)*1.1;
 let m0={x:dx,z:dz},m1={x:dx,z:dz};
 // For non-branching roads keep tangents in line with adjacent edges.
 if(connection){
  const neighbours=node=>connection.get(idx(node))||[];
  const prior=neighbours(a).filter(v=>idx(v)!==idx(b)).sort((v,w)=>((v.x-aa.x)*dx+(v.z-aa.z)*dz)-((w.x-aa.x)*dx+(w.z-aa.z)*dz))[0];
  const next=neighbours(b).filter(v=>idx(v)!==idx(a)).sort((v,w)=>((w.x-bb.x)*dx+(w.z-bb.z)*dz)-((v.x-bb.x)*dx+(v.z-bb.z)*dz))[0];
  if(prior){const u=unit(bb.x-prior.x,bb.z-prior.z);m0={x:u.x*len,z:u.z*len}}
  if(next){const u=unit(next.x-aa.x,next.z-aa.z);m1={x:u.x*len,z:u.z*len}}
 }
 const pts=[];
 for(let i=0;i<=count;i++){
  const t=i/count,p=hermite(aa,bb,m0,m1,t);
  const fade=Math.sin(PI*t)**2,wave=fade*(offset+irregular*Math.sin(PI*2*t));
  pts.push({x:p.x+side.x*wave,z:p.z+side.z*wave});
 }
 return contourRoadV223(game,pts);
}
export function roadNetwork(game,{includeUnseen=false}={}){
 const edges=[],connection=new Map();
 for(const key of Object.keys(game.s.worldRoads||{})){
  const [a,b]=roadPoints(key);if(!a||!b)continue;
  const level=roadLevel(roadStrength(game.s,a,b,game.s.time));if(!level||(!includeUnseen&&(!game.seen(0,a)||!game.seen(0,b))))continue;
  const A=game.cell(a),B=game.cell(b);if(!A||!B)continue;
  edges.push({a,b,level});
  for(const [p,q]of [[a,B],[b,A]]){const id=idx(p),n=connection.get(id)||[];n.push(q);connection.set(id,n)}
 }
 for(const edge of edges)edge.points=roadSpline(game,edge.a,edge.b,12,connection);
 return edges;
}

// Conservative overview LOD: a whole neighbouring vertex ring is cut below
// the water, preventing a coarse terrain triangle from roofing over a river.
export function overviewSurface(game,x,z,spacing){
 const h=surface(game,x,z),near=riverNear(game,x,z);
 if(!Number.isFinite(near.distance))return h;
 const t=Math.max(0,Math.min(1,(near.distance-near.width-spacing)/(spacing*.75)));
 // V286: the coarse world mesh only dips just under the river surface (was 2.3 m): the deep trough was wider than
 // the river, filled with the sea plane and drew stepped blue terraces with trees standing in them
 const bed=Math.max(near.waterHeight-.55,.78);
 const shaped=Math.min(h,bed+(h-bed)*t*t);
 // The overview grid must meet the sea's own bathymetry, not a river trench.
 const coastal=smooth((smoothAtlasHeight(game,x,z)+.4)/2.4);
 return coastal>=1?shaped:baseHeight(game,x,z)*(1-coastal)+shaped*coastal;
}
