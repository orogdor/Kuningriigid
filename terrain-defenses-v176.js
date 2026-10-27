import {defenseRoadCellsV177} from './road-gates-v177.js';
// Deterministic terrain-backed enclosures. Nothing here places free walls,
// changes the terrain, creates roads or demolishes existing buildings.
import {wallStrokePlanV175} from './wall-draw-v175.js?v=1754a';
import {wallTerrainErrorV1758} from './wall-terrain-v1758.js';
import {footprintsCrossV168} from './stone-fort-footprints-v168.js';
import {DETAIL_HALF_X,DETAIL_HALF_Z} from './detail-scale-v123.js';
const TAU=Math.PI*2;
const forts=new Set(['palisade','stonewall','reinforced_wall','woodgate','gatehouse','watchtower','stonetower']);
const coreTypes=new Set(['hall','house','well','market','study','warehouse','cellar','scriptorium','library','chapel']);
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const hash=(seed,n)=>{const v=Math.sin(seed*17.71+n*7.47)*43758.5;return v-Math.floor(v);};
const angleDistance=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
const physical=kind=>['mountain','water','river'].includes(kind);

export function insideDefenseV176(point,plan){
 const polygon=plan?.outlineV176;if(!polygon?.length)return true;
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];
  if((a.z>point.z)!==(b.z>point.z)&&point.x<(b.x-a.x)*(point.z-a.z)/(b.z-a.z)+a.x)inside=!inside;
 }
 return inside;
}
export function defensePlotPenaltyV176(point,type,plan){
 if(!plan?.outlineV176||!coreTypes.has(type))return 0;
 // Fill the organic historic centre first. Suburbs remain possible once the
 // interior plots are occupied; this is a ranking, never an invisible wall.
 return insideDefenseV176(point,plan)?0:65;
}
function firstBarrier(origin,angle,limit,passable,feature){
 const c=Math.cos(angle),s=Math.sin(angle);
 for(let r=12;r<=limit;r+=2){
  const x=origin.x+c*r,z=origin.z+s*r;
  if(!passable(x,z))return physical(feature(x,z))?{r,kind:feature(x,z)}:null;
 }
 return null;
}
function sampleEdge(a,b,kind){
 const n=Math.max(1,Math.ceil(distance(a,b)/.25)),out=[];
 for(let i=0;i<n;i++)out.push({...mix(a,b,i/n),kind});
 return out;
}
function occupied(slot,buildings){
 return buildings.some(b=>b.hp>0&&!b.virtual&&!forts.has(b.type)&&footprintsCrossV168(slot,b,1.1));
}
export function terrainDefensePlanV176(game,city,buildings=[],seed=0,options={}){
 if(typeof game.wallTerrainPassable!=='function'||typeof game.defenseTerrainKindV176!=='function')return null;
 const passable=(x,z)=>game.defenseTerrainPassableV177?game.defenseTerrainPassableV177(city,x,z):game.wallTerrainPassable(city,x,z),feature=(x,z)=>game.defenseTerrainKindV176(city,x,z);
 const hall=buildings.find(b=>b.type==='hall'&&b.hp>0)||{x:0,z:0};
 if(!passable(hall.x,hall.z))return null;
 const wall=options.wall||'palisade',gate=wall==='palisade'?'woodgate':'gatehouse';
 const tower=options.tower||(wall==='palisade'?'watchtower':'stonetower');
 const homes=buildings.filter(b=>b.hp>0&&!b.virtual&&coreTypes.has(b.type));
 const ordered=homes.filter(b=>b!==hall).sort((a,b)=>distance(a,hall)-distance(b,hall));
 const core=[hall,...ordered.slice(0,Math.ceil(ordered.length*.9))];
 const phase=hash(seed,1)*TAU,baseX=48+hash(seed,2)*7,baseZ=43+hash(seed,3)*8;
 // Preserve angular street approaches, while breaking the four rectangular
 // sides. The largest inner buildings must fit with a roof/road setback.
 const baseRadius=angle=>{
  const c=Math.cos(angle),s=Math.sin(angle);
  let r=1/Math.sqrt((c/baseX)**2+(s/baseZ)**2);
  r*=1+.075*Math.sin(3*angle+phase)+.045*Math.sin(5*angle-phase);
  for(const b of core){
   const dx=b.x-hall.x,dz=b.z-hall.z,along=dx*c+dz*s,across=Math.abs(-dx*s+dz*c);
   if(along>0&&across<19)r=Math.max(r,along+17);
  }
  return r+(options.extra||0);
 };
 const rayLimit=angle=>{
  const c=Math.cos(angle),s=Math.sin(angle);
  const rangeX=game.defenseTerrainPassableV177?DETAIL_HALF_X*3:DETAIL_HALF_X;
  const tx=Math.abs(c)<1e-6?Infinity:((c>0?rangeX:-rangeX)-hall.x)/c;
  const rangeZ=game.defenseTerrainPassableV177?DETAIL_HALF_Z*3:DETAIL_HALF_Z;
  const tz=Math.abs(s)<1e-6?Infinity:((s>0?rangeZ:-rangeZ)-hall.z)/s;
  return Math.max(0,Math.min(tx,tz));
 };
 // Survey just one strategic rear sector. A distant rock must not stretch
 // every side of the city outwards, nor pull the ring across its houses.
 let anchor=null;
 for(let i=0;i<32;i++){
  const angle=i*TAU/32,r=baseRadius(angle),hit=firstBarrier(hall,angle,Math.min(r+64,rayLimit(angle)+3),passable,feature);
  if(!hit||hit.r<24)continue;
  const score=hit.r+(hit.kind==='mountain'?-14:0);
  if(!anchor||score<anchor.score)anchor={...hit,angle,score};
 }
 const points=[];
 for(let i=0;i<32;i++){
  const angle=i*TAU/32,base=baseRadius(angle),limit=rayLimit(angle);
  let r=Math.min(base,limit-5);
  if(r<24)return null;
  if(anchor&&angleDistance(angle,anchor.angle)<Math.PI*.39){
   const hit=firstBarrier(hall,angle,Math.min(base+64,limit+3),passable,feature);
   if(hit&&hit.kind==='mountain')r=Math.min(Math.max(base,hit.r+3),limit+3);
  }
  // A built curtain closes even the rear sector; a cliff is extra protection,
  // never an unverified missing wall. Pull vertices back onto dry owned land.
  const stop=firstBarrier(hall,angle,Math.min(r+2,limit+1),passable,feature);
  if(stop&&stop.kind!=='mountain')r=Math.min(r,stop.r-6);
  points.push({x:hall.x+Math.cos(angle)*r,z:hall.z+Math.sin(angle)*r});
 }
 // Axis-aligned real gates keep their actual passage and post geometry.
 // Prefer the front away from the terrain anchor. A cliff-backed town may
 // have a single gate, whereas an open settlement normally has two.
 const roads=game.contexts&&city.world?defenseRoadCellsV177(game,city):[];
 const roadIndices=points.map((p,i)=>({i,score:roads.reduce((n,r)=>n+(distance(p,r)<9?r.strength:0),0)})).filter(v=>v.score>0).sort((a,b)=>b.score-a.score).slice(0,4).map(v=>v.i);
 const gateOptions=[...new Set([...roadIndices,0,8,16,24])].map(i=>{
  const p=points[i],previous=points[(i+31)%32],next=points[(i+1)%32],len=distance(previous,next),tx=(next.x-previous.x)/len,tz=(next.z-previous.z)/len,axis=Math.abs(tz)>Math.abs(tx)?1:0;
  const a={x:p.x-tx*3.5,z:p.z-tz*3.5},b={x:p.x+tx*3.5,z:p.z+tz*3.5};
  const slot={type:gate,x:p.x,z:p.z,wallAxis:axis,wallAngleV175:-Math.atan2(tz,tx),plannedDefense:true};
  const outward={x:(p.x-hall.x)/distance(p,hall),z:(p.z-hall.z)/distance(p,hall)};
  const dry=[-9,-4,0,4,9].every(d=>passable(p.x+outward.x*d,p.z+outward.z*d));
  const footprint=[-3,0,3].every(dx=>[-3,0,3].every(dz=>passable(p.x+dx,p.z+dz)));
  return {i,slot,a,b,ok:dry&&footprint&&!occupied(slot,buildings),score:roads.reduce((n,r)=>n+(distance(p,r)<9?r.strength:0),0)+(anchor?-Math.cos(i*TAU/32-anchor.angle):hash(seed,4+i))};
 }).filter(o=>o.ok).sort((a,b)=>b.score-a.score);
 if(!gateOptions.length)return null;
 const gates=[gateOptions[0]],second=gateOptions.find(o=>angleDistance(o.i*TAU/32,gates[0].i*TAU/32)>Math.PI*.75);
 if(second)gates.push(second);
 const edges=[],outline=[];
 for(let i=0;i<32;i++){
  const g=gates.find(g=>g.i===i);
  if(g){outline.push({...g.a,gateToNext:true},g.b);}else outline.push(points[i]);
 }
 for(let i=0;i<outline.length;i++)edges.push(...sampleEdge(outline[i],outline[(i+1)%outline.length],outline[i].gateToNext?'gate':'wall'));
 // Rotate to an intentional gate opening; all other breaks must be real
 // impassable terrain. Unknown/map-border breaks invalidate the plan.
 const start=edges.findIndex(e=>e.kind==='gate');
 const orderedEdges=[...edges.slice(start),...edges.slice(0,start)];
 const slots=gates.map(g=>g.slot),natural=[];
 let run=[],terrainRun=[];
 const finishRun=()=>{
  if(run.length<2){run=[];return true;}
  const plan=wallStrokePlanV175(run,'curved',128,passable);
  if(plan.error){run=[];return false;}
  for(const segment of plan.segments){
   const slot={...segment,type:wall,plannedDefense:true,terrainDefenseV176:true};
   if(occupied(slot,buildings)||wallTerrainErrorV1758(slot,passable,game.defenseTerrainHeightV176?(x,z)=>game.defenseTerrainHeightV176(city,x,z):null)){run=[];return false;}
   slots.push(slot);
  }
  run=[];return true;
 };
 const finishTerrain=()=>{if(terrainRun.length)natural.push({kind:terrainRun[0].feature,points:terrainRun.map(({x,z})=>({x,z}))});terrainRun=[];};
 let last=null;
 for(const point of orderedEdges){
  const dry=passable(point.x,point.z);
  if(point.kind==='wall'&&!dry&&feature(point.x,point.z)!=='mountain')return null;
  if(point.kind==='wall'&&dry){
   if(!run.length&&last?.kind==='wall'&&!passable(last.x,last.z))run.push(last);
   finishTerrain();run.push(point);
  }else{
   if(run.length){if(point.kind==='wall')run.push(point);if(!finishRun())return null;}
   if(point.kind==='wall'){
    const kind=feature(point.x,point.z);if(!physical(kind))return null;
    terrainRun.push({...point,feature:kind});
   }else finishTerrain();
  }
  last=point;
 }
 if(!finishRun())return null;finishTerrain();
 if(slots.filter(s=>s.type===wall).length<3)return null;
 // Ensure the oldest homes stay inside. A concave bay may invalidate an
 // otherwise attractive rear anchor; let the caller try a larger outline.
 if(core.some(b=>!insideDefenseV176(b,{outlineV176:outline})))return null;
 // Towers face the open approaches, not buried inside a mountain. Leave
 // plenty of room around gates and real wall sections for their footprints.
 const towers=[];
 for(const target of [4,12,20,28]){
  let chosen=null;
  for(const di of [0,-1,1,-2,2,-3,3,-4,4,-5,5,-6,6,-7,7,-8,8])for(const inset of [11,14,17,20]){
   if(chosen)continue;
   const p=points[(target+di+32)%32],len=distance(p,hall),v={x:p.x-(p.x-hall.x)/len*inset,z:p.z-(p.z-hall.z)/len*inset,type:tower,wallAxis:0,plannedDefense:true};
   if(!(city.world?.resources||[]).some(r=>!r.removed&&!['tree','berry','game','fish'].includes(r.kind)&&Math.abs(r.x-v.x)<(r.depositSite?10:4.5)&&Math.abs(r.z-v.z)<(r.depositSite?10:4))&&[[-5,-5],[-5,5],[5,-5],[5,5]].every(([dx,dz])=>passable(v.x+dx,v.z+dz))&&!occupied(v,buildings)&&slots.every(w=>distance(v,w)>7)&&towers.every(t=>distance(v,t)>18))chosen=v;
  }
  if(chosen)towers.push(chosen);
 }
 if(towers.length<2)return null;
 // Fund towers during curtain construction, before the last wall section.
 const orderedSlots=[...slots.slice(0,gates.length)],curtains=slots.slice(gates.length);
 for(let i=0;i<curtains.length;i++){orderedSlots.push(curtains[i]);if(i===1||i===12||i===25||i===38){const t=towers.shift();if(t)orderedSlots.push(t);}}
 orderedSlots.push(...towers);slots.splice(0,slots.length,...orderedSlots);
 return {version:177,closedRingV177:true,kind:'terrain-following',shape:'organic-terrain-enclosure',slots,
  gates:gates.map(g=>g.slot),gateOpenings:gates.length,outlineV176:outline,
  naturalBarriersV176:natural.length?natural:anchor?[{kind:anchor.kind,points:[],backsBuiltRing:true}]:[],terrainBackedV176:!!anchor,
  terrainBlockedAtFounding:0,initialBlocked:0,initialViable:slots.length,
  verifiedAtTechV167:true,nextIndex:0,constructed:0,blocked:0,seed,
  rx:Math.max(...points.map(p=>Math.abs(p.x-hall.x))),rz:Math.max(...points.map(p=>Math.abs(p.z-hall.z)))};
}
