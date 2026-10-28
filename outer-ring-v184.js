import {wallStrokePlanV175,wallPointInsideV175,wallCrossesGateOpeningV175} from './wall-draw-v175.js';
import {rejectInsideOuterRingV218} from './old-fortification-policy-v218.js';
import {densityGroupsV220} from './urban-growth-v220.js';
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
 if(!a.outerRingV184||!a.drawnWallV175)return false;
 if(!['palisade','stonewall','reinforced_wall'].includes(b.type))return false;
 const aAngle=a.wallAngleV175??0,bAngle=b.wallAngleV175??0;
 if(Math.abs(Math.cos(aAngle-bAngle))>.94)return false;
 const endpoints=w=>{
  const angle=w.wallAngleV175??(w.wallAxis?Math.PI/2:0),half=(w.palisadeSpanV167||7)/2;
  return [-1,1].map(sign=>({x:w.x+Math.cos(angle)*half*sign,z:w.z-Math.sin(angle)*half*sign}));
 };
 // A real physical intersection is an additional valid joining method.
 // Reject parallel overlaps and never allow gates/ordinary buildings here.
 const crossing=(u,v)=>{
  const toEnds=w=>{
   const angle=w.wallAngleV175??(w.wallAxis?Math.PI/2:0),
    half=(w.palisadeSpanV167||7)/2;
   return [{x:w.x-Math.cos(angle)*half,z:w.z+Math.sin(angle)*half},
           {x:w.x+Math.cos(angle)*half,z:w.z-Math.sin(angle)*half}];
  };
  const [a0,a1]=toEnds(u),[b0,b1]=toEnds(v),
   rx=a1.x-a0.x,rz=a1.z-a0.z,sx=b1.x-b0.x,sz=b1.z-b0.z,
   cross=rx*sz-rz*sx;
  if(Math.abs(cross)<5)return false;
  const qx=b0.x-a0.x,qz=b0.z-a0.z,
   t=(qx*sz-qz*sx)/cross,w=(qx*rz-qz*rx)/cross;
  return t>=-.03&&t<=1.03&&w>=-.03&&w<=1.03;
 };
 if(crossing(a,b))return true;
 // Both an L-join at a historic wall end and a T-join to the middle of
 // an uninterrupted curtain are real, closed defensive connections.
 // The generic 6 m house-spacing rule cannot distinguish these joints.
 const bx=Math.cos(bAngle),bz=-Math.sin(bAngle),half=(b.palisadeSpanV167||7)/2;
 const attached=endpoints(a).some(p=>{
  const dx=p.x-b.x,dz=p.z-b.z;
  const along=dx*bx+dz*bz,across=Math.abs(-dx*bz+dz*bx);
  return Math.abs(along)<=half+1.1&&across<=1.05;
 });
 return attached&&Math.hypot(a.x-b.x,a.z-b.z)>2.5;
}

export function allowedSuburbCornerV201(a,b,neighbors=[]){
 if(!a.outerRingV184||!a.drawnWallV175||
  !['palisade','stonewall','reinforced_wall'].includes(b.type))return false;
 const linked=neighbors.filter(w=>w!==b&&allowedSuburbJoinV191(a,w));
 if(!linked.length)return false;
 const ends=w=>{
  const angle=w.wallAngleV175??(w.wallAxis?Math.PI/2:0),half=(w.palisadeSpanV167||7)/2;
  return [-1,1].map(sign=>({x:w.x+Math.cos(angle)*half*sign,z:w.z-Math.sin(angle)*half*sign}));
 };
 const neighborsEnds=ends(b);
 return linked.some(link=>ends(link).some(p=>neighborsEnds.some(q=>meters(p,q)<=1.7)));
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

const SUBURB_ROOFS_V204=new Set(['house','market','warehouse','cellar','study','chapel','library','scriptorium','inn','barracks','archery','smith','saw','mason','farm','fisher','lumber','quarry','pottery_kiln','bronze_foundry','school','academy','guildhall','mill','bakery','stable']);
export function suburbBuildingsV204(game,city){
 const contexts=typeof game.contexts==='function'?game.contexts(city):[];
 return contexts.flatMap(ctx=>(ctx.economy?.buildings||[]).filter(b=>b.hp>0&&!b.virtual&&SUBURB_ROOFS_V204.has(b.type)).map(b=>({...b,
  x:b.x+((ctx.c??city.c??0)-(city.c??0))*225,z:b.z+((ctx.r??city.r??0)-(city.r??0))*195
 })));
}
export function suburbDemandV204(game,city){
 const inner=city.stoneDefensePlanV166?.outlineV176||city.defensePlanV139?.outlineV176;
 if(!inner?.length)return {ready:false,count:0,cluster:[],required:13};
 const candidates=suburbBuildingsV204(game,city).filter(b=>!inside(b,inner)&&inner.some((p,i)=>distanceToCourse(b,p,inner[(i+1)%inner.length])<=115));
 // Shared 62m network definition keeps planning and new wall demand in sync.
 const cluster=densityGroupsV220(candidates,62)[0]||[];
 return {ready:cluster.length>=13,count:candidates.length,cluster,required:13};
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
// At old-wall corners the chord's perpendicular may be nearly PARALLEL
// to the actual first historic wall course. Depart normal to the physical
// wall before turning toward the new quarter, preventing doubled wall strips.
function orthogonalShoulderV208(anchor,first,oldWalls,outward,depth){
 const near=oldWalls.filter(b=>['palisade','stonewall','reinforced_wall'].includes(b.type)&&b.hp>0&&b.ready)
  .map(b=>({wall:b,d:meters(anchor,b)})).sort((a,b)=>a.d-b.d)[0];
 if(!near||near.d>6)return first;
 const b=near.wall,ang=b.wallAngleV175??(b.wallAxis?Math.PI/2:0);
 const tx=Math.cos(ang),tz=-Math.sin(ang),dx=first.x-anchor.x,dz=first.z-anchor.z;
 const len=Math.hypot(dx,dz);
 if(len<2||Math.abs((dx*tx+dz*tz)/len)<.89)return first;
 let px=-tz,pz=tx;
 if(px*outward.x+pz*outward.z<0){px=-px;pz=-pz;}
 const distance=Math.max(11,Math.min(19,depth*.21));
 return {x:anchor.x+px*distance,z:anchor.z+pz*distance};
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

// V194: shore and mountain are PHYSICAL continuous boundaries. Trace the first
// impassable terrain strip along a borrowed inner-wall chord, so a real natural
// barrier replaces the rear curtain. Sampling each 2–3 metres and three
// adjacent strips avoids the old false shortcut across a lake or isolated rock.
export function naturalSuburbBoundaryV194(game,city,a,b,nx,nz,target,maxDepth=165){
 const chord=meters(a,b),samples=Math.max(12,Math.ceil(chord/2.5));
 const passable=p=>terrainSafe(game,city,p);
 const kind=p=>game.defenseTerrainKindV176?.(city,p.x,p.z);
 const move=(p,r)=>({x:p.x+nx*r,z:p.z+nz*r});
 const coast=[],depths=[];
 for(let i=0;i<=samples;i++){
  const origin=mix(a,b,i/samples);
  let dry=null,wet=null;
  for(let d=8;d<=maxDepth;d+=2.5){
   const pos=move(origin,d),type=kind(pos);
   if(type===target&&!passable(pos)){wet=d;dry=d-2.5;break;}
   // Other impassable land or unknown world boundaries are not a coast.
   if(!passable(pos)&&type!==target)return null;
  }
  if(wet==null||dry<6)return null;
  for(let k=0;k<8;k++){
   const mid=(dry+wet)*.5,p=move(origin,mid);
   if(kind(p)===target&&!passable(p))wet=mid;else dry=mid;
  }
  // This dry point is where the physical wall terminates.
  const point=move(origin,dry);
  // There must be an actual continuous block beyond the shoreline;
  // a single rock/wet pixel cannot substitute for kilometres of curtain.
  for(const depth of [wet+.4,wet+1.2,wet+2.4]){
   const q=move(origin,depth);
   if(kind(q)!==target||passable(q))return null;
  }
  coast.push(point);depths.push(dry);
 }
 const minDepth=Math.min(...depths),maxFound=Math.max(...depths);
 if(minDepth<19||maxFound>maxDepth-1)return null;
 for(let i=1;i<depths.length;i++)if(Math.abs(depths[i]-depths[i-1])>7)return null;
 // Both ends must meet terrain directly; the gap is backed by water/cliff
 // everywhere instead of being merely a visually closed straight chord.
 const boundaryLength=coast.slice(1).reduce((sum,p,i)=>sum+meters(p,coast[i]),0);
 if(boundaryLength<24||boundaryLength>chord*2.4)return null;
 return {kind:target,coast,blockedFrom:depths,depth:Math.min(...depths),
  rearLength:boundaryLength,naturalLengthV194:boundaryLength};
}


// Cliff segments seldom stretch across the entire back of a quarter.
// Trace any sizeable continuous PART of a rocky rim, then build the two
// missing returns. A dry gap ALWAYS ends a natural stretch.
export function partialNaturalBoundariesV195(game,city,a,b,nx,nz,target='mountain'){
 const chord=meters(a,b),n=Math.max(12,Math.ceil(chord/2.5));
 const move=(origin,d)=>({x:origin.x+nx*d,z:origin.z+nz*d});
 const terrain=p=>game.defenseTerrainKindV176?.(city,p.x,p.z);
 const safe=p=>terrainSafe(game,city,p);
 const hits=[];
 for(let i=0;i<=n;i++){
  const origin=mix(a,b,i/n);
  let land=0,water=null;
  for(let d=0;d<=175;d+=2.5){
   const pt=move(origin,d),kind=terrain(pt);
   if(kind===target&&!safe(pt)){water=d;land=Math.max(0,d-2.5);break;}
   if(!safe(pt))break;
  }
  if(water==null){hits.push(null);continue;}
  if(water>0)for(let k=0;k<8;k++){
   const d=(land+water)/2,p=move(origin,d);
   if(terrain(p)===target&&!safe(p))water=d;else land=d;
  }
  const p=move(origin,land);
  if([water+.4,water+1.2,water+2.4].some(d=>{
   const test=move(origin,d);
   return terrain(test)!==target||safe(test);
  })){hits.push(null);continue;}
  hits.push({p,d:land,origin,wet:water});
 }
 const runs=[];
 let current=[];
 function finish(){
  if(current.length>=9){
   const coast=current.map(x=>x.p),
    length=coast.slice(1).reduce((s,p,i)=>s+meters(p,coast[i]),0);
   if(length>=23&&length<=chord*1.75)
    runs.push({kind:target,coast,naturalLengthV194:length,partialV195:true,
      startFraction:current[0].i/n,endFraction:current.at(-1).i/n});
  }
  current=[];
 }
 for(let i=0;i<hits.length;i++){
  const h=hits[i],prev=current.at(-1);
  if(!h){finish();continue;}
  if(prev&&(Math.abs(prev.d-h.d)>11||
    ![.4,1.5].every(off=>{
     const q=move(mix(prev.origin,h.origin,.5),(prev.wet+h.wet)/2+off);
     return terrain(q)===target&&!safe(q);
    })))finish();
  current.push({...h,i});
 }
 finish();
 return runs.sort((a,b)=>b.naturalLengthV194-a.naturalLengthV194).slice(0,5);
}


// Historic survey vertices can be ~2m outside the ACTUAL built timber mesh.
// A wall starting at that mathematical vertex looks connected but is rejected
// by spacing/navigation. Anchor returns to the real wall course instead.
export function historicWallContactV199(point,walls,gates=[]){
 let best=null,bestD=Infinity;
 for(const b of walls){
  if(!['palisade','stonewall','reinforced_wall'].includes(b.type)||b.hp<=0||!b.ready)continue;
  const angle=b.wallAngleV175??(b.wallAxis?Math.PI/2:0),
   tx=Math.cos(angle),tz=-Math.sin(angle),half=(b.palisadeSpanV167||7)/2;
  const dx=point.x-b.x,dz=point.z-b.z;
  const along=Math.max(-half+.3,Math.min(half-.3,dx*tx+dz*tz));
  const p={x:b.x+along*tx,z:b.z+along*tz};
  const distance=meters(point,p);
  if(distance>4.5||distance>=bestD)continue;
  if(gates.some(g=>meters(g,p)<5.3))continue;
  best=p;bestD=distance;
 }
 return best||point;
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
 const suburb=suburbDemandV204(game,city);
 const maritime=typeof game.cell==='function'&&
  (typeof game.contexts==='function'?[city,...game.contexts(city)]:[city]).some(ctx=>!!game.cell(ctx)?.coast);
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
  // First prefer full sea/cliff closures; then use a VERIFIED partial
  // mountain rim where there are still gaps that must be enclosed by walls.
  const naturalChoices=[
   ...['water','mountain'].map(kind=>naturalSuburbBoundaryV194(game,city,a,b,nx,nz,kind)).filter(Boolean),
   ...partialNaturalBoundariesV195(game,city,a,b,nx,nz,'mountain')
  ];
  diagnostic.partialSurveys=(diagnostic.partialSurveys||0)+1;
  diagnostic.partialFound=(diagnostic.partialFound||0)+naturalChoices.filter(n=>n.partialV195).length;
  for(const natural of naturalChoices){
   const {coast}=natural,poly=[...arc,...coast.slice().reverse()];
   const area=polyArea(poly);
   if(area<1550||area>12500){diagnostic.naturalAreaReject=(diagnostic.naturalAreaReject||0)+1;continue;}
   const plots=sitesInside(poly,inner,buildings,game,city);
   const occupiedHomes=outwardHomes.filter(h=>inside(h,poly)).length;
   const protectedCluster=suburb.ready?suburb.cluster.filter(h=>inside(h,poly)).length:0;
   if(suburb.ready&&protectedCluster<3)continue;
   if(plots<3&&occupiedHomes<2){diagnostic.naturalPlotReject=(diagnostic.naturalPlotReject||0)+1;continue;}
   const center=mix(a,b,.5),distanceToCoast=meters(center,coast[Math.floor(coast.length/2)]);
   const score=150+Math.min(8500,area)/170+
      Math.min(22,plots)*3+Math.min(2,oldGates.length)*20+
      occupiedHomes*12+protectedCluster*85+(maritime&&natural.kind==='water'?320:0)-distanceToCoast*.18;
   candidates.push({arc,points:[a,...coast,b],area,shared,oldGates,
    plots,occupiedHomes,protectedCluster,rank:score,natural});diagnostic.raw++;
  }
  // V193: protect a genuine large residential quarter with room for years
  // of growth. The first ring may now cover two or three V192-size suburbs,
  // rather than fitting the smallest possible 3-house extension.
  for(const depth of [...new Set([Math.min(125,Math.max(57,homeDepth+25)),52,64,76,88,100,112,124,43])]){
   if(depth>128||depth<38)continue;
   for(let variant=0;variant<3;variant++){
    const points=historicCurtainV191(a,b,nx,nz,depth,variant);
    points[1]=orthogonalShoulderV208(a,points[1],walls,{x:nx,z:nz},depth);
    points[points.length-2]=orthogonalShoulderV208(b,points[points.length-2],walls,{x:nx,z:nz},depth);
    const poly=[...arc,...points.slice(1,-1).reverse()];
    const area=polyArea(poly);
    if(area<1200||area>10500)continue;
    const occupiedHomes=outwardHomes.filter(h=>inside(h,poly)).length;
    const protectedCluster=suburb.ready?suburb.cluster.filter(h=>inside(h,poly)).length:0;
    if(suburb.ready&&protectedCluster<3)continue;
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
     Math.min(7500,area)/180+protectedCluster*85-length*.18-
     Math.max(0,target-area)/115-Math.max(0,area-7500)/250;
    candidates.push({arc,points,area,shared,oldGates,plots,occupiedHomes,protectedCluster,rank:value});diagnostic.raw++;
   }
  }
 }
 candidates.sort((a,b)=>b.rank-a.rank);
 let checked=0;
 for(const candidate of candidates){
  if(++checked>3500)break;
  const {arc,points,shared,area,plots,oldGates,natural}=candidate;
  const physicalArc=natural?arc.map(p=>({...p})):arc;
  if(natural?.kind==='mountain'&&natural.partialV195){
   physicalArc[0]=historicWallContactV199(arc[0],walls,gates);
   physicalArc[physicalArc.length-1]=historicWallContactV199(arc.at(-1),walls,gates);
  }
  const segments=[];let invalid=false;
  if(natural){
   // Both returns are paid-for walls. The back side is kept as a surveyed
   // sequence of real impassable water/cliff cells, never as a free wall.
   for(const [start,end] of [[physicalArc[0],natural.coast[0]],
      [physicalArc.at(-1),natural.coast.at(-1)]]){
    if(meters(start,end)<2.8)continue; // cliff already joins the old wall
    const boundary={x:end.x+(end.x-start.x)/Math.max(1,meters(start,end))*1.4,
     z:end.z+(end.z-start.z)/Math.max(1,meters(start,end))*1.4};
    const line=wallStrokePlanV175([start,boundary],'straight',100,
      (x,z)=>terrainSafe(game,city,{x,z}));
    if(line.error||!line.segments.length){invalid=true;break;}
    if(natural.kind==='mountain')line.segments.at(-1).cliffEmbedEndV179=5;
    for(const slot of line.segments)segments.push({...slot,type:'palisade',
      plannedDefense:true,outerRingV184:true});
   }
  }
  // Individual straight spans retain the kinks of historical polygonal walls.
  // Calling the generic "straight" mode on the whole polyline would collapse
  // every intermediate point and silently rebuild the old rectangular wall!
  for(let edge=1;!natural&&edge<points.length;edge++){
   const start=points[edge-1],end=points[edge];
   if(sampleLine(start,end,1.5).some(p=>!terrainSafe(game,city,p))){invalid=true;diagnostic.terrain++;break;}
   const stroke=wallStrokePlanV175([start,end],'straight',100);
   if(stroke.error){invalid=true;break;}
   for(const slot of stroke.segments)segments.push({...slot,type:'palisade',
    plannedDefense:true,outerRingV184:true});
  }
  if(!invalid&&rejectInsideOuterRingV218(segments,inner)){
   invalid=true;diagnostic.insideOldRing=(diagnostic.insideOldRing||0)+1;
  }
  if(invalid||segments.length<3||segments.length>70){
   if(natural)diagnostic.naturalSegmentsReject=(diagnostic.naturalSegmentsReject||0)+1;
   diagnostic.segments++;continue;}
  const length=segments.reduce((sum,p)=>sum+meters(p.from,p.to),0);
  const share=shared/(shared+length);
  if(share<.10||share>.75)continue;
  const gate=oldGates[0]||gates.sort((a,b)=>meters(a,points[3])-meters(b,points[3]))[0];
  // Follow the approach of an existing town gate across the new quarter.
  // The gateway replaces a single seven-metre section, never an extra wall.
  if(!natural&&gate&&segments.length>=12){
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
    const g={...segments[target],type:'woodgate',hp:350};
    // The entire planned curtain must still leave the gateway passage clear.
    // A turn immediately beside a gate can cut through the opening even
    // when each wall slot passes its stand-alone placement preview.
    const crosses=segments.some((s,i)=>i!==target&&wallCrossesGateOpeningV175(s,g));
    if(!crosses&&!game.previewDefenseV177(city,g).error)
     segments[target]={...g,plannedDefense:true,outerRingV184:true};
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
   if(natural)diagnostic.naturalPreviewReject=(diagnostic.naturalPreviewReject||0)+1;
   diagnostic.preview++;
   const why=String(previewError).slice(0,65);
   diagnostic.rejectedReasons[why]=(diagnostic.rejectedReasons[why]||0)+1;
   if(diagnostic.firstFailures.length<6){
    const s=segments[failedAt],nearest=walls.map(b=>({type:b.type,dist:Math.round(meters(b,s)*10)/10,
     drawn:!!b.drawnWallV175,span:b.palisadeSpanV167||7,
     angle:b.wallAngleV175??(b.wallAxis?Math.PI/2:0),
     sideAngle:s.wallAngleV175,
     joined:allowedSuburbJoinV191(s,b)})).sort((a,b)=>a.dist-b.dist)[0];
    diagnostic.firstFailures.push({reason:why,segment:failedAt,x:Math.round(s.x),z:Math.round(s.z),nearest,
     joinedWalls:walls.filter(b=>allowedSuburbJoinV191(s,b)).slice(0,3).map(b=>({type:b.type,dist:Math.round(meters(b,s)*10)/10,angle:b.wallAngleV175}))});
   }
   continue;
  }
  const boundary=natural?[...physicalArc,...natural.coast.slice().reverse()]:
    [...arc,...points.slice(1,-1).reverse()];
  city.naturalSurveyDiagnosticV195={partialFound:diagnostic.partialFound||0,
   naturalPreviewReject:diagnostic.naturalPreviewReject||0,
   naturalAreaReject:diagnostic.naturalAreaReject||0,
   naturalPlotReject:diagnostic.naturalPlotReject||0,
   naturalSegmentsReject:diagnostic.naturalSegmentsReject||0,
   naturalFailures:diagnostic.firstFailures,
   chosen:natural?.kind||'none'};
  return {
   version:204,shape:natural?'natural-barrier-suburb':'historic-gate-suburb',
   historicSuburbV191:true,expandedSuburbV193:true,
   naturalBoundaryV194:natural?{kind:natural.kind,trace:natural.coast.map(p=>({x:p.x,z:p.z})),
     length:natural.naturalLengthV194,partial:!!natural.partialV195,
     verified:true}:null,
   oldGateCountV191:oldGates.length,plannedHousePlotsV191:plots,
   protectedSuburbBuildingsV204:candidate.protectedCluster||0,maritimePreferenceV204:maritime,
   sharedLength:shared,newLength:length,sharedFraction:share,
   sharedArc:physicalArc.map(p=>({x:p.x,z:p.z})),boundaryV186:boundary,
   areaEstimateV186:polyArea(boundary),organicOutlineV189:true,
   cliffBoundaryV186:natural?.kind==='mountain',
   waterBoundaryV187:natural?.kind==='water',
   slots:segments,nextIndex:0
  };
 }
 city.historicSurveyDiagnosticV191=diagnostic;
 return null;
}
