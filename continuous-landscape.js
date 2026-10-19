// V67. One procedural elevation/drainage/transport coordinate space.
// Everything is generated in WORLD metres and merely projected at different
// scales; there are no separate local rivers, road segments or rock placements.
import {COLS,ROWS,cellAt} from './campaign.js';
import {roadPoints,roadLevel,roadStrength} from './roads.js?v=59';
export const DETAIL_X=3,DETAIL_Z=2.6,DETAIL_Y=.30;
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
 const graph={incoming,edges,bucket,paths:new Map()};
 caches.set(game,graph);
 // The river position field is spatially indexed. Detail and atlas queries
 // use the same samples, instead of checking every river globally.
 for(const e of edges){
  e.points=sampleRiver(game,e.c,12,graph);
  for(let i=1;i<e.points.length;i++){
   const a=e.points[i-1],b=e.points[i];
   const minX=Math.min(a.x,b.x)-19,maxX=Math.max(a.x,b.x)+19;
   const minZ=Math.min(a.z,b.z)-19,maxZ=Math.max(a.z,b.z)+19;
   const p=cellAt(minX,minZ),q=cellAt(maxX,maxZ);
   const cc0=p?.c??clamp(Math.floor((minX+650)/50),0,COLS-1),cc1=q?.c??clamp(Math.floor((maxX+650)/50),0,COLS-1);
   const rr0=p?.r??clamp(Math.floor((minZ+550)/50),0,ROWS-1),rr1=q?.r??clamp(Math.floor((maxZ+550)/50),0,ROWS-1);
   const seg={a,b};
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
function tangent(game,graph,cell,previous=null){
 const up=previous||graph.incoming.get(idx(cell))?.[0]||null;
 const downstream=cell.riverTo?game.cell(cell.riverTo):null;
 if(up&&downstream)return unit(downstream.x-up.x,downstream.z-up.z);
 if(downstream)return unit(downstream.x-cell.x,downstream.z-cell.z);
 if(up)return unit(cell.x-up.x,cell.z-up.z);
 return {x:1,z:0};
}
export function sampleRiver(game,cell,count=12,graph=null){
 if(!cell?.riverTo)return [];
 graph??=prep(game);
 const to=game.cell(cell.riverTo);if(!to)return [];
 const len=hypot(to.x-cell.x,to.z-cell.z),t0=tangent(game,graph,cell),t1=tangent(game,graph,to);
 const source=Math.max(1.5,cell.riverWidth||3),target=Math.max(source,to.riverWidth||source*1.18);
 const pts=[];
 for(let i=0;i<=count;i++){
  const t=i/count,p=hermite(cell,to,{x:t0.x*len,z:t0.z*len},{x:t1.x*len,z:t1.z*len},t);
  pts.push({...p,width:source+(target-source)*smooth(t),flow:cell.riverFlow||0});
 }
 return pts;
}
export const getRivers=game=>prep(game).edges;
export function riverNear(game,x,z){
 const pos=cellAt(x,z);if(!pos)return {distance:Infinity,width:0};
 const bucket=prep(game).bucket.get(idx(pos));if(!bucket)return {distance:Infinity,width:0};
 let nearest=Infinity,width=0;
 for(const {a,b}of bucket){
  const dx=b.x-a.x,dz=b.z-a.z,len=dx*dx+dz*dz||1;
  const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/len,0,1),px=a.x+t*dx,pz=a.z+t*dz;
  const d=Math.hypot(px-x,pz-z);if(d<nearest){nearest=d;width=a.width+(b.width-a.width)*t}
 }
 return {distance:nearest,width};
}
export function baseHeight(game,x,z){
 const h=game.atlasHeight(x,z);
 // Connected mountainous relief, a smooth scalar field — not individual
 // rocks, peaks, cones or local patches with incompatible boundaries.
 const steep=smooth((h-18)/19);
 const fold=Math.sin(x*.033+Math.sin(z*.015)*1.3)*Math.cos(z*.045-Math.sin(x*.014));
 // Ridge systems are actual elevated continuous terrain, not grey material
 // patches. Two frequencies create mountain crests and steep rock faces.
 const crest=Math.pow(1-Math.abs(Math.sin(x*.052+Math.cos(z*.018)*1.4)*Math.cos(z*.048-x*.011)),2);
 const ridge=(12+25*crest+5.5*Math.max(0,fold))*steep;
// V69: mountain scarps are real shared 3D elevation. Narrow crests make
// broken cliffs, with the same metres projected into both map views.
const jagged=.5+.5*Math.sin(x*.079+Math.cos(z*.043)*1.5)*Math.cos(z*.061-x*.023);
const scarp=steep*smooth((crest-.16)/.59)*(6.8+8.2*Math.pow(Math.max(0,jagged),2));
// Intermittent broken coastal ledges (not a continuous seawall).
const coastal=(smooth((h-3.2)/4)*(1-smooth((h-15)/6)))*4.5*
 Math.pow(Math.max(0,Math.sin(x*.061+z*.029+Math.sin(z*.031))),4);
 // Sloping continental shelf: the underwater seabed is visibly BELOW the
 // sea surface even where riverbeds descend toward the coast.
 const sub=Math.max(0,.72-h);
 const oceanFloor=sub?(2.5*smooth(sub/7)+sub*.10):0;
 return h+ridge+scarp+coastal-oceanFloor;
}
export function worldElevation(game,x,z){
 const base=baseHeight(game,x,z),{distance:d,width:w}=riverNear(game,x,z);
 if(!Number.isFinite(d))return base;
 const inner=w*.92,outer=Math.max(inner+2.8,w*1.65+3);
 const incise=3.8+Math.min(3,w*.31);
 const depth=d<inner?incise:d<outer?incise*(1-smooth((d-inner)/(outer-inner))):0;
 return base-depth;
}
export function projectHeight(y,view){return view==='detail'?(y-.7)*DETAIL_Y:y}
export function surface(game,x,z,view='world'){return projectHeight(worldElevation(game,x,z),view)}
export function worldToLocal(tile,x,z){return {x:(x-tile.x)*DETAIL_X,z:(z-tile.z)*DETAIL_Z}}
export function localToWorld(tile,x,z){return {x:tile.x+x/DETAIL_X,z:tile.z+z/DETAIL_Z}}
export function localSurface(game,tile,x,z){const p=localToWorld(tile,x,z);return surface(game,p.x,p.z,'detail')}
export function inNeighbourhood(tile,x,z,margin=10){
 return Math.abs(x-tile.x)<75+margin&&Math.abs(z-tile.z)<75+margin;
}
export function roadSpline(game,a,b,count=12,connection=null){
 if(idx(a)>idx(b))[a,b]=[b,a];
 const aa=game.cell(a),bb=game.cell(b);if(!aa||!bb)return [];
 const dx=bb.x-aa.x,dz=bb.z-aa.z,len=hypot(dx,dz),side=unit(-dz,dx);
 const offset=(game.noise(a.c*7+b.c,a.r*7+b.r)) *2;
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
  const t=i/count,p=hermite(aa,bb,m0,m1,t),wave=Math.sin(PI*t)*offset;
  pts.push({x:p.x+side.x*wave,z:p.z+side.z*wave});
 }
 return pts;
}
export function roadNetwork(game){
 const edges=[],connection=new Map();
 for(const key of Object.keys(game.s.worldRoads||{})){
  const [a,b]=roadPoints(key);if(!a||!b)continue;
  const level=roadLevel(roadStrength(game.s,a,b,game.s.time));if(!level||!game.seen(0,a)||!game.seen(0,b))continue;
  const A=game.cell(a),B=game.cell(b);if(!A||!B)continue;
  edges.push({a,b,level});
  for(const [p,q]of [[a,B],[b,A]]){const id=idx(p),n=connection.get(id)||[];n.push(q);connection.set(id,n)}
 }
 for(const edge of edges)edge.points=roadSpline(game,edge.a,edge.b,12,connection);
 return edges;
}
