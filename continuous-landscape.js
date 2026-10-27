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
// visual=true (drawing only): where the rolling ground dips below a river's water level, the banks
// rise gently to just above the water (natural levees), so the river sits in its bed instead of
// floating above the land. Navigation keeps calling it without the flag (V161).
export function worldElevation(game,x,z,visual=false){
 let base=baseHeight(game,x,z);const {distance:d,width:w,waterHeight,fordStrength=0}=riverNear(game,x,z);
 if(!Number.isFinite(d))return base;
 const inner=w*1.04,outer=Math.max(inner+3.5,w*1.8+3);
 if(visual){const rim=waterHeight+.6,reach=outer+18;if(base<rim&&d<reach)base+=(rim-base)*(1-smooth((d-outer)/(reach-outer)));}
 // Incise the SAME water elevation into the terrain, even where a mountain
 // ridge crosses the river. Subtracting depth from the ridge left dry spikes.
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

// Conservative overview LOD: a whole neighbouring vertex ring is cut below
// the water, preventing a coarse terrain triangle from roofing over a river.
export function overviewSurface(game,x,z,spacing){
 const h=surface(game,x,z),near=riverNear(game,x,z);
 if(!Number.isFinite(near.distance))return h;
 const t=Math.max(0,Math.min(1,(near.distance-near.width-spacing)/(spacing*.75)));
 return Math.min(h,near.waterHeight-2.3+(h-near.waterHeight+2.3)*t*t);
}
