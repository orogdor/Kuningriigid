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
// Pick a continuous part of the existing ring, and make an outward, three-sided
// extension. A shared edge L and new sides totalling about 2L give 1/3 reuse.
export function findOuterRingV184(game,city){
 const outline=city.stoneDefensePlanV166?.outlineV176||city.defensePlanV139?.outlineV176;
 if(!outline||outline.length<8)return null;
 const walls=game.defenseBuildingsV177(city).filter(b=>b.hp>0&&b.ready&&fort.has(b.type));
 const n=outline.length,center=outline.reduce((a,p)=>({x:a.x+p.x/n,z:a.z+p.z/n}),{x:0,z:0});
 const covered=p=>walls.some(b=>['palisade','stonewall','reinforced_wall'].includes(b.type)?wallPointInsideV175(p,b,1.8):dist(p,b)<6);
 const candidates=[];
 for(let len=Math.floor(n/2);len>=4;len--)for(let start=0;start<n;start++){
  const arc=Array.from({length:len+1},(_,i)=>outline[(start+i)%n]);
  let shared=0;for(let i=1;i<arc.length;i++)shared+=dist(arc[i-1],arc[i]);
  const a=arc[0],b=arc.at(-1),chord=dist(a,b);if(shared<32||shared>140||chord<shared*.72||arc.some(p=>!covered(p)))continue;
  let gap=false;for(let i=1;i<arc.length&&!gap;i++){const p=arc[i-1],q=arc[i],steps=Math.ceil(dist(p,q)/2);for(let k=0;k<=steps;k++){const t=k/steps;if(!covered({x:p.x+(q.x-p.x)*t,z:p.z+(q.z-p.z)*t})){gap=true;break;}}}if(gap)continue;
  const dx=(b.x-a.x)/chord,dz=(b.z-a.z)/chord,m={x:(a.x+b.x)/2,z:(a.z+b.z)/2};
  let nx=-dz,nz=dx;if((m.x-center.x)*nx+(m.z-center.z)*nz<0){nx=-nx;nz=-nz;}
  for(const factor of [1.1,.85,.65,.5]){
   const h=shared*factor,points=[a,{x:a.x+nx*h,z:a.z+nz*h},{x:b.x+nx*h,z:b.z+nz*h},b];
   const area=chord*h,mid={x:(points[1].x+points[2].x)/2,z:(points[1].z+points[2].z)/2};
   const kind=game.defenseTerrainKindV176?.bind(game,city);
   const naturalKind=kind?.(mid.x,mid.z);const possibleCliff=['mountain','water'].includes(naturalKind)&&[points[1],mid,points[2]].every(p=>kind(p.x,p.z)===naturalKind);
   const expected=(possibleCliff?0:chord)+2*h;
   candidates.push({arc,shared,points,area,expected,rank:area/expected+area/2400});
  }
 }
 // Prioritise a large usable suburb, while also rewarding area per metre of
 // new curtain. Every candidate still goes through real placement checks.
 candidates.sort((a,b)=>b.rank-a.rank);
 let checked=0;
 for(const c of candidates){
  if(++checked>1500)break;
  const {arc,shared,points,area}=c,parts=[];
  const terrain=game.defenseTerrainKindV176?.bind(game,city);
  // A natural rear edge is accepted only if the entire edge is continuous
  // impassable mountain, sampled across the walking width, and each side
  // ends at that barrier. Water, ownership edges and isolated rocks do not count.
  const naturalKind=terrain?.((points[1].x+points[2].x)/2,(points[1].z+points[2].z)/2);
  let natural=['mountain','water'].includes(naturalKind);
  const rear=dist(points[1],points[2]),steps=Math.ceil(rear/.5),vx=(points[2].x-points[1].x)/rear,vz=(points[2].z-points[1].z)/rear;
  for(let i=0;natural&&i<=steps;i++)for(const off of [-1,0,1]){
   const t=i/steps,p={x:points[1].x+(points[2].x-points[1].x)*t-vz*off,z:points[1].z+(points[2].z-points[1].z)*t+vx*off};
   if(terrain(p.x,p.z)!==naturalKind){natural=false;break;}
  }
  let bad=false;
  let curvedBoundary=null;
  for(const j of natural?[0,2]:[0]){
   const line=natural?wallStrokePlanV175([points[j],points[j+1]],'straight',100,(x,z)=>terrain(x,z)!==naturalKind):wallStrokePlanV175(points,'curved',100);
   if(!natural)curvedBoundary=line.curve;
   if(line.error){bad=true;break;}
   if(natural&&naturalKind==='mountain'){const end=j===0?line.segments.at(-1):line.segments[0];end[j===0?'cliffEmbedEndV179':'cliffEmbedStartV179']=5;}
   for(const p of line.segments){const slot={...p,type:'palisade',plannedDefense:true,outerRingV184:true};
    if(!game.defenseTerrainPassableV177(city,slot.x,slot.z)){bad=true;break;}parts.push(slot);
   }if(bad)break;
  }
  // Defer expensive building previews until the entire line has passed the
  // cheap terrain/ownership survey.
  if(!bad&&parts.some(slot=>game.previewDefenseV177(city,slot).error))bad=true;
  if(bad||!parts.length)continue;
  const added=parts.reduce((s,p)=>s+dist(p.from,p.to),0),share=shared/(shared+added);
  if(share<.16||share>.75)continue;
  const boundary=[...arc,...(curvedBoundary||points).slice(1).reverse()];
  return {version:186,sharedLength:shared,newLength:added,sharedFraction:share,sharedArc:arc.map(({x,z})=>({x,z})),boundaryV186:boundary,areaEstimateV186:area,cliffBoundaryV186:natural&&naturalKind==='mountain',waterBoundaryV187:natural&&naturalKind==='water',slots:parts,nextIndex:0};
 }
 return null;
}
