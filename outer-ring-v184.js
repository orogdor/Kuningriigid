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
// V191: historic gate-led suburban enclosure. Polygonal curtains follow real
// street approaches and settlement plots rather than arbitrary sine-wave lobes.
// The old city wall forms one side; the new curtain forms a separate district.
export function allowedSuburbJoinV191(a,b){
 if(!a.outerRingV184||!a.drawnWallV175||!b.drawnWallV175)return false;
 if(!['palisade','stonewall','reinforced_wall'].includes(b.type))return false;
 const aAngle=a.wallAngleV175??0,bAngle=b.wallAngleV175??0;
 if(Math.abs(Math.cos(aAngle-bAngle))>.94)return false;
 const endpoints=w=>{
  const angle=w.wallAngleV175??(w.wallAxis?Math.PI/2:0),half=(w.palisadeSpanV167||7)/2;
  return [-1,1].map(sign=>({x:w.x+Math.cos(angle)*half*sign,z:w.z-Math.sin(angle)*half*sign}));
 };
 const d=Math.min(...endpoints(a).flatMap(p=>endpoints(b).map(q=>Math.hypot(p.x-q.x,p.z-q.z))));
 return d<2.6&&Math.hypot(a.x-b.x,a.z-b.z)>3.0;
}
const HOME_TYPES=new Set(['house','hall','market','well','warehouse','cellar','study','chapel','library','scriptorium','inn']);
const BAD_TERRAIN=new Set(['water','mountain','river']);
const meters=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function distanceToCourse(p,a,b){
 const dx=b.x-a.x,dz=b.z-a.z,span=dx*dx+dz*dz;
 const u=span?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/span)):0;
 return meters(p,{x:a.x+u*dx,z:a.z+u*dz});
}
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
const polyArea=poly=>Math.abs(poly.reduce((a,p,i)=>{const q=poly[(i+1)%poly.length];return a+p.x*q.z-q.x*p.z;},0))*.5;
const terrainSafe=(game,city,p)=>!BAD_TERRAIN.has(game.defenseTerrainKindV176?.(city,p.x,p.z))&&
 (game.defenseTerrainPassableV177?.(city,p.x,p.z)??true);
function sampleLine(a,b,step=2){
 const n=Math.max(1,Math.ceil(meters(a,b)/step));
 return Array.from({length:n+1},(_,i)=>mix(a,b,i/n));
}
function sitesInside(poly,inner,buildings,game,city){
 // Cheap proxy for buildable lots. A suburb is valuable only if future homes
 // fit between roads, water, the original walls and the new curtain.
 const xs=poly.map(p=>p.x),zs=poly.map(p=>p.z);
 const x0=Math.min(...xs)+9,x1=Math.max(...xs)-9,z0=Math.min(...zs)+9,z1=Math.max(...zs)-9;
 let plots=0;
 for(let x=x0;x<=x1&&plots<25;x+=15)for(let z=z0;z<=z1&&plots<25;z+=15){
  const p={x,z};
  if(!inside(p,poly)||inside(p,inner))continue;
  if(![-5,5].every(dx=>[-5,5].every(dz=>terrainSafe(game,city,{x:x+dx,z:z+dz}))))continue;
  if(buildings.some(b=>b.hp>0&&meters(b,p)<12))continue;
  plots++;
 }
 return plots;
}
function historicCurtainV191(a,b,nx,nz,depth,variant=0){
 // Five recognisable courses and three deliberate corners: angled shoulders,
 // a long city-facing front, and two returns. No smooth oval or scallops.
 const chord=meters(a,b),tx=(b.x-a.x)/chord,tz=(b.z-a.z)/chord;
 const offsets=variant===0?[.03,.14,.50,.88,.99]:
  variant===1?[.04,.18,.55,.91,.99]:
  [.03,.10,.44,.84,.99];
 const heights=variant===0?[.18,.78,1,.75,.16]:
  variant===1?[.16,.85,.96,.71,.15]:
  [.15,.69,.98,.86,.20];
 return [a,...offsets.map((u,i)=>({
  x:a.x+tx*chord*u+nx*depth*heights[i],
  z:a.z+tz*chord*u+nz*depth*heights[i]
 })),b];
}
function roadFocusOnArc(arc,gates){
 return gates.filter(g=>arc.some(p=>meters(p,g)<11));
}
function wallAlreadyThere(walls,p){
 return walls.some(b=>['palisade','stonewall','reinforced_wall'].includes(b.type)?
  wallPointInsideV175(p,b,1.8):meters(p,b)<6);
}
export function findOuterRingV184(game,city){
 const inner=city.stoneDefensePlanV166?.outlineV176||city.defensePlanV139?.outlineV176;
 if(!inner||inner.length<8)return null;
 const walls=game.defenseBuildingsV177(city).filter(b=>b.hp>0&&b.ready&&fort.has(b.type));
 const gates=walls.filter(b=>['woodgate','gatehouse'].includes(b.type));
 const contexts=typeof game.contexts==='function'?game.contexts(city):[];
 const buildings=contexts.flatMap(ctx=>(ctx.economy?.buildings||[])
  .filter(b=>b.hp>0&&!b.virtual&&HOME_TYPES.has(b.type)).map(b=>({
   ...b,x:b.x+((ctx.c??city.c??0)-(city.c??0))*225,
   z:b.z+((ctx.r??city.r??0)-(city.r??0))*195
  })));
 const n=inner.length,center=inner.reduce((s,p)=>({x:s.x+p.x/n,z:s.z+p.z/n}),{x:0,z:0});
 const candidates=[],diagnostic={arcs:0,arcWallGaps:0,sites:0,houseCorridor:0,
  raw:0,terrain:0,segments:0,preview:0,rejectedReasons:{},firstFailures:[]};
 for(let count=Math.max(6,Math.floor(n*.48));count>=Math.max(4,Math.floor(n*.24));count--)for(let i=0;i<n;i++){
  const arc=Array.from({length:count+1},(_,j)=>inner[(i+j)%n]);
  let shared=0;
  for(let j=1;j<arc.length;j++)shared+=meters(arc[j-1],arc[j]);
  const a=arc[0],b=arc.at(-1),chord=meters(a,b);
  diagnostic.arcs++;
  if(shared<30||shared>170||chord<shared*.64||!arc.every(p=>wallAlreadyThere(walls,p))){diagnostic.arcWallGaps++;continue;}
  // The entire borrowed edge needs real standing walls, not merely vertices.
  if(arc.slice(1).some((p,j)=>sampleLine(arc[j],p,2).some(q=>!wallAlreadyThere(walls,q)))){diagnostic.arcWallGaps++;continue;}
  const tx=(b.x-a.x)/chord,tz=(b.z-a.z)/chord;
  const middle=mix(a,b,.5);
  let nx=-tz,nz=tx;
  if((middle.x-center.x)*nx+(middle.z-center.z)*nz<0){nx=-nx;nz=-nz;}
  const oldGates=roadFocusOnArc(arc,gates).filter(g=>meters(g,a)>14&&meters(g,b)>14);
  const outwardHomes=buildings.filter(h=>!inside(h,inner)&&
   (h.x-middle.x)*nx+(h.z-middle.z)*nz>6&&
   Math.abs((h.x-middle.x)*tx+(h.z-middle.z)*tz)<chord*.72);
  const homeDepth=outwardHomes.reduce((max,h)=>Math.max(max,(h.x-middle.x)*nx+(h.z-middle.z)*nz),0);
  // V193: protect a genuine large residential quarter with room for years
  // of growth. The first ring may now cover two or three V192-size suburbs,
  // rather than fitting the smallest possible 3-house extension.
  for(const depth of [...new Set([Math.min(125,Math.max(57,homeDepth+25)),52,64,76,88,100,112,124,43])]){
   if(depth>128||depth<38)continue;
   for(let variant=0;variant<3;variant++){
    const points=historicCurtainV191(a,b,nx,nz,depth,variant);
    const poly=[...arc,...points.slice(1,-1).reverse()];
    const area=polyArea(poly);
    if(area<1200||area>10500)continue;
    const occupiedHomes=outwardHomes.filter(h=>inside(h,poly)).length;
    // Reject candidate that puts existing homes inside its curtain material.
    if(buildings.some(h=>points.slice(1).some(p=>meters(p,h)<6))){diagnostic.houseCorridor++;continue;}
    // Screen full wall courses, not just vertices. House/building footprints
    // blocked over 80% of the original V191 preview attempts.
    const occupied=buildings.some(h=>points.slice(1).some((p,j)=>
     distanceToCourse(h,points[j],p)<8.2));
    const blockedGate=gates.some(g=>points.slice(1).some((p,j)=>
     distanceToCourse(g,points[j],p)<6.3));
    if(occupied||blockedGate){diagnostic.houseCorridor++;continue;}
    const plots=sitesInside(poly,inner,buildings,game,city);
    if(plots<3&&occupiedHomes<2){diagnostic.sites++;continue;}
    const length=points.slice(1).reduce((sum,p,j)=>sum+meters(points[j],p),0);
    const front=points[3],outer={x:front.x+nx*7,z:front.z+nz*7};
    const natural=BAD_TERRAIN.has(game.defenseTerrainKindV176?.(city,outer.x,outer.z))?1:0;
    // Prioritise useful, genuinely buildable new city land. Penalise undersized
    // suburbs decisively but preserve a smaller fallback on constrained sites.
    // Cost still matters, yet must not dominate the future housing capacity.
    const target=4200;
    const value=occupiedHomes*13+Math.min(22,plots)*3+
     Math.min(2,oldGates.length)*20+natural*7+
     Math.min(7500,area)/180-length*.18-
     Math.max(0,target-area)/115-Math.max(0,area-7500)/250;
    candidates.push({arc,points,area,shared,oldGates,plots,occupiedHomes,rank:value});diagnostic.raw++;
   }
  }
 }
 candidates.sort((a,b)=>b.rank-a.rank);
 let checked=0;
 for(const candidate of candidates){
  if(++checked>3500)break;
  const {arc,points,shared,area,plots,oldGates}=candidate;
  const segments=[];let invalid=false;
  // Individual straight spans retain the kinks of historical polygonal walls.
  // Calling the generic "straight" mode on the whole polyline would collapse
  // every intermediate point and silently rebuild the old rectangular wall!
  for(let edge=1;edge<points.length;edge++){
   const start=points[edge-1],end=points[edge];
   if(sampleLine(start,end,1.5).some(p=>!terrainSafe(game,city,p))){invalid=true;diagnostic.terrain++;break;}
   const stroke=wallStrokePlanV175([start,end],'straight',100);
   if(stroke.error){invalid=true;break;}
   for(const slot of stroke.segments)segments.push({...slot,type:'palisade',
    plannedDefense:true,outerRingV184:true});
  }
  if(invalid||segments.length<10||segments.length>70){diagnostic.segments++;continue;}
  const length=segments.reduce((sum,p)=>sum+meters(p.from,p.to),0);
  const share=shared/(shared+length);
  if(share<.10||share>.75)continue;
  const gate=oldGates[0]||gates.sort((a,b)=>meters(a,points[3])-meters(b,points[3]))[0];
  // Follow the approach of an existing town gate across the new quarter.
  // The gateway replaces a single seven-metre section, never an extra wall.
  if(gate&&segments.length>=12){
   const forward={x:points[3].x-arc[Math.floor(arc.length/2)].x,
    z:points[3].z-arc[Math.floor(arc.length/2)].z};
   const fLen=Math.max(1,Math.hypot(forward.x,forward.z));
   const nx=forward.x/fLen,nz=forward.z/fLen;
   let target=null,best=Infinity;
   for(let j=3;j<segments.length-3;j++){
    const p=segments[j],d=meters(p,gate);
    const toward=(p.x-gate.x)*nx+(p.z-gate.z)*nz;
    const projection=Math.abs((p.x-gate.x)*nz-(p.z-gate.z)*nx);
    const score=projection+d*.08;
    if(toward>15&&score<best){target=j;best=score;}
   }
   if(target!=null&&best<20){
    const g={...segments[target],type:'woodgate'};
    if(!game.previewDefenseV177(city,g).error)segments[target]=g;
   }
  }
  // All wall sections and the actual gate must fit. Do not accept a scenic
  // diagram that cannot be built on the physical city map.
  let previewError=null,failedAt=-1;
  for(let j=0;j<segments.length;j++){
   const err=game.previewDefenseV177(city,segments[j]).error;
   if(err){previewError=err;failedAt=j;break;}
  }
  if(previewError){
   diagnostic.preview++;
   const why=String(previewError).slice(0,65);
   diagnostic.rejectedReasons[why]=(diagnostic.rejectedReasons[why]||0)+1;
   if(diagnostic.firstFailures.length<6){
    const s=segments[failedAt],nearest=walls.map(b=>({type:b.type,dist:Math.round(meters(b,s)*10)/10})).sort((a,b)=>a.dist-b.dist)[0];
    diagnostic.firstFailures.push({reason:why,segment:failedAt,x:Math.round(s.x),z:Math.round(s.z),nearest});
   }
   continue;
  }
  const boundary=[...arc,...points.slice(1,-1).reverse()];
  return {
   version:193,shape:'historic-gate-suburb',historicSuburbV191:true,expandedSuburbV193:true,
   oldGateCountV191:oldGates.length,plannedHousePlotsV191:plots,
   sharedLength:shared,newLength:length,sharedFraction:share,
   sharedArc:arc.map(p=>({x:p.x,z:p.z})),boundaryV186:boundary,
   areaEstimateV186:polyArea(boundary),organicOutlineV189:true,
   cliffBoundaryV186:false,waterBoundaryV187:false,
   slots:segments,nextIndex:0
  };
 }
 city.historicSurveyDiagnosticV191=diagnostic;
 return null;
}
