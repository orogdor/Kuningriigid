import {wallStrokePlanV175,wallPointInsideV175} from './wall-draw-v175.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const fort=new Set(['palisade','stonewall','reinforced_wall','woodgate','gatehouse','watchtower','stonetower']);
function inside(p,poly){
 let yes=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)yes=!yes;
 }
 return yes;
}
// Coordinates here are global detail-map coordinates, relative to the capital.
// Require the complete house footprint to fit, not just its centre.
export function protectedHousingZoneV184(city,p){
 const inner=city.stoneDefensePlanV166?.outlineV176||city.defensePlanV139?.outlineV176;
 const plan=city.outerRingV184;
 if(!inner?.length||!plan?.sharedArc?.length||!plan.slots?.length)return null;
 const outer=plan.boundaryV186||[...plan.sharedArc,...plan.slots.slice().reverse().map(s=>s.to)];
 if(outer.some(q=>!Number.isFinite(q?.x)||!Number.isFinite(q?.z)))return null;
 const footprint=[[-4.5,-4.1],[4.5,-4.1],[-4.5,4.1],[4.5,4.1]].map(([x,z])=>({x:p.x+x,z:p.z+z}));
 if(footprint.every(q=>inside(q,inner)))return 0;
 if(footprint.every(q=>inside(q,outer)))return 1;
 return 2;
}
// V189: an extension is a broad, irregular curtain, not a rectangle with
// rounded corners. The control points make asymmetrical bends around a sizeable
// suburb. Return the exact endpoints of the existing wall for watertight joins.
export function organicSuburbCurveV189(a,b,nx,nz,height,variant=0){
 const chord=dist(a,b),tx=(b.x-a.x)/chord,tz=(b.z-a.z)/chord;
 const phase=Math.sin(a.x*.071+b.z*.053+variant*2.31);
 const shoulder=variant===1?.12:variant===2?-.09:0;
 const profile=[
  [0,0],[.018,.20],[.078,.50],[.19+shoulder*.16,.78],
  [.36+shoulder,.99+phase*.055],
  [.55+shoulder*.7,1.09-phase*.06],
  [.73+shoulder*.3,.91],
  [.87,.67],[.966,.32],[1,0]
 ];
 return profile.map(([u,v],i)=>{
  const irregular=i>2&&i<8?Math.sin((i+variant*3)*1.89+a.z*.015)*.045:0;
  return {x:a.x+tx*chord*u+nx*height*(v+irregular),
          z:a.z+tz*chord*u+nz*height*(v+irregular)};
 });
}
const polygonArea=points=>Math.abs(points.reduce((sum,p,i)=>{
 const next=points[(i+1)%points.length];
 return sum+p.x*next.z-next.x*p.z;
},0))*.5;
// Small, deterministic terrain-aware adjustments to the curved outline.
// Never put a wall on water or a cliff just to make a symmetrical perimeter.
function nudgeToDryTerrain(game,city,points,nx,nz){
 const land=(p)=>{
  const kind=game.defenseTerrainKindV176?.(city,p.x,p.z);
  return !['mountain','water','river'].includes(kind)&&
   (game.defenseTerrainPassableV177?.(city,p.x,p.z)??true);
 };
 return points.map((p,i)=>{
  if(i===0||i===points.length-1||land(p))return p;
  for(const offset of [-3,-6,-10,-14,3,6]){
   const q={x:p.x+nx*offset,z:p.z+nz*offset};
   if(land(q))return q;
  }
  return p;
 });
}
// Pick one uninterrupted, already built portion of the inner curtain as the
// shared boundary. Candidate extensions are physically previewed and paid for
// by the standard game builder. No free walls or terrain alterations.
export function findOuterRingV184(game,city){
 const outline=city.stoneDefensePlanV166?.outlineV176||city.defensePlanV139?.outlineV176;
 if(!outline||outline.length<8)return null;
 const walls=game.defenseBuildingsV177(city).filter(b=>b.hp>0&&b.ready&&fort.has(b.type));
 const n=outline.length,center=outline.reduce((acc,p)=>({x:acc.x+p.x/n,z:acc.z+p.z/n}),{x:0,z:0});
 const covered=p=>walls.some(b=>['palisade','stonewall','reinforced_wall'].includes(b.type)?wallPointInsideV175(p,b,1.8):dist(p,b)<6);
 const terrain=(x,z)=>game.defenseTerrainKindV176?.(city,x,z);
 const permitted=(x,z)=>game.defenseTerrainPassableV177?.(city,x,z)??true;
 const candidates=[];
 for(let len=Math.floor(n/2);len>=4;len--)for(let start=0;start<n;start++){
  const arc=Array.from({length:len+1},(_,i)=>outline[(start+i)%n]);
  let shared=0;for(let i=1;i<arc.length;i++)shared+=dist(arc[i-1],arc[i]);
  const a=arc[0],b=arc.at(-1),chord=dist(a,b);
  if(shared<32||shared>140||chord<shared*.72||arc.some(p=>!covered(p)))continue;
  let gap=false;
  for(let i=1;i<arc.length&&!gap;i++){
   const p=arc[i-1],q=arc[i],steps=Math.max(1,Math.ceil(dist(p,q)/2));
   for(let k=0;k<=steps;k++){
    const t=k/steps;
    if(!covered({x:p.x+(q.x-p.x)*t,z:p.z+(q.z-p.z)*t})){gap=true;break;}
   }
  }
  if(gap)continue;
  const dx=(b.x-a.x)/chord,dz=(b.z-a.z)/chord,mid={x:(a.x+b.x)/2,z:(a.z+b.z)/2};
  let nx=-dz,nz=dx;
  if((mid.x-center.x)*nx+(mid.z-center.z)*nz<0){nx=-nx;nz=-nz;}
  for(const factor of [1.28,1.05,.83,.65,.50])for(const variant of [0,1,2]){
   const h=shared*factor;
   const rearA={x:a.x+nx*h,z:a.z+nz*h},rearB={x:b.x+nx*h,z:b.z+nz*h};
   const rearMid={x:mid.x+nx*h,z:mid.z+nz*h};
   const naturalKind=terrain(rearMid.x,rearMid.z);
   const naturalCandidate=['mountain','water'].includes(naturalKind)&&
    [rearA,rearMid,rearB].every(p=>terrain(p.x,p.z)===naturalKind);
   // Existing cliff/shore construction can use a continuous natural rear
   // boundary and needs walls only on the two sides.
   const points=naturalCandidate?
    [a,rearA,rearB,b]:
    nudgeToDryTerrain(game,city,organicSuburbCurveV189(a,b,nx,nz,h,variant),nx,nz);
   const boundary=[...arc,...points.slice(1).reverse()];
   const area=polygonArea(boundary);
   if(area<320)continue;
   // Prefer actual inhabitable land over a mathematically large flooded area.
   let usable=0,total=0;
   for(const u of [.25,.5,.75])for(const v of [.35,.67]){
    const x=a.x+dx*chord*u+nx*h*v,z=a.z+dz*chord*u+nz*h*v;
    total++;if(!['water','mountain','river'].includes(terrain(x,z))&&permitted(x,z))usable++;
   }
   if(usable<4)continue;
   let estimated=0;
   for(let k=1;k<points.length;k++)estimated+=dist(points[k-1],points[k]);
   const effectiveLength=naturalCandidate?2*h:estimated;
   const rank=area/(effectiveLength+20)+area/1450+
    (naturalCandidate?19:0)+usable/total*5;
   candidates.push({arc,shared,points,area,rank,naturalCandidate});
  }
 }
 candidates.sort((a,b)=>b.rank-a.rank);
 let checked=0;
 for(const c of candidates){
  if(++checked>2200)break;
  const {arc,shared,points,area}=c,parts=[];
  const naturalKind=terrain((points[1].x+points[2].x)/2,(points[1].z+points[2].z)/2);
  // The natural boundary is real only if the complete rear corridor has
  // continuous impassable terrain, including one metre either side.
  let natural=c.naturalCandidate&&['mountain','water'].includes(naturalKind);
  const rear=dist(points[1],points[2]);
  const steps=Math.max(1,Math.ceil(rear/.5));
  const vx=(points[2].x-points[1].x)/rear,vz=(points[2].z-points[1].z)/rear;
  for(let i=0;natural&&i<=steps;i++)for(const off of [-1,0,1]){
   const t=i/steps,p={x:points[1].x+(points[2].x-points[1].x)*t-vz*off,
    z:points[1].z+(points[2].z-points[1].z)*t+vx*off};
   if(terrain(p.x,p.z)!==naturalKind){natural=false;break;}
  }
  let bad=false,curvedBoundary=null;
  // Natural cliffs/sea close the rear; all other sites use the complete
  // winding hand-drawn curtain, never the old 3-segment rectangle.
  for(const j of natural?[0,2]:[0]){
   const line=natural?
    wallStrokePlanV175([points[j],points[j+1]],'straight',100,(x,z)=>terrain(x,z)!==naturalKind):
    wallStrokePlanV175(points,'curved',100);
   if(!natural)curvedBoundary=line.curve;
   if(line.error){bad=true;break;}
   if(natural&&naturalKind==='mountain'){
    const end=j===0?line.segments.at(-1):line.segments[0];
    end[j===0?'cliffEmbedEndV179':'cliffEmbedStartV179']=5;
   }
   for(const segment of line.segments){
    const slot={...segment,type:'palisade',plannedDefense:true,outerRingV184:true};
    if(!permitted(slot.x,slot.z)){bad=true;break;}
    parts.push(slot);
   }
   if(bad)break;
  }
  if(!bad&&parts.some(slot=>game.previewDefenseV177(city,slot).error))bad=true;
  if(bad||!parts.length)continue;
  const added=parts.reduce((sum,p)=>sum+dist(p.from,p.to),0);
  const share=shared/(shared+added);
  if(share<.16||share>.75)continue;
  const boundary=[...arc,...(curvedBoundary||points).slice(1).reverse()];
  // Never claim more buildable suburb than the actual resulting outline.
  const finalArea=polygonArea(boundary);
  if(finalArea<320)continue;
  return {version:189,sharedLength:shared,newLength:added,sharedFraction:share,
   sharedArc:arc.map(({x,z})=>({x,z})),boundaryV186:boundary,
   areaEstimateV186:finalArea,organicOutlineV189:!natural,
   cliffBoundaryV186:natural&&naturalKind==='mountain',
   waterBoundaryV187:natural&&naturalKind==='water',
   slots:parts,nextIndex:0};
 }
 return null;
}
