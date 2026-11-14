// V351: territory and border geometry in 8x8-cell chunks.
//
// Before V351 atlas-style.js rebuilt every territory fill and every border of the whole world each
// time the player discovered a map cell or a town changed (the stamp contained visionRevision and
// the territory revision), and the smooth region field was sampled over the bounding box of each
// whole realm.
//
// The smooth field of landscape-v149.js is local: its value at a point depends only on the four
// cells around that point. So the world can be cut into chunks, and a chunk's triangles depend only
// on the visible territory cells of the chunk and of a one-cell ring around it. Every chunk keeps
// its arrays; a chunk is recomputed only when those cells change (a newly discovered territory
// cell, a moved border, a conquered town). The union of all chunks is the same set of triangles
// and lines that the old whole-world pass produced (tests/territory-chunks-v351.mjs compares them
// value by value), so the picture is unchanged.
//
// This module has no three.js objects: it returns plain arrays, atlas-style.js owns the meshes.
import {COLS,ROWS,ORIGIN_X as OX,ORIGIN_Z as OZ} from './campaign.js';
import {discoveredLogV351} from './fog-delta-v88.js';

export const CHUNK_V351=8;
const N=CHUNK_V351,W=N+2,SIZE=N*50; // a chunk sees cells a-1 .. a+N (one-cell ring)
const sstep=t=>t<=0?0:t>=1?1:t*t*(3-2*t); // same as landscape-v149.js
const now=()=>globalThis.performance?.now?.()??Date.now();
const chunkId=(kx,kz)=>(kz+1)*64+kx+1;
const GROUP_IDS=[0,1,2,3].map(t=>['g|'+t+'|false','g|'+t+'|true']),TEAM_IDS=[0,1,2,3].map(t=>'t|'+t);

// ---- the indicator field of cellRegion() (landscape-v149.js), sampled on the chunk's lattices.
// Sample positions and arithmetic are the same as in regionFill()/regionContour(), so the values
// are the same numbers; only the cell lookup is a small local grid instead of a Set of strings.
function axis(start,origin,step){
 const n=Math.round(SIZE/step)+1,pos=new Float64Array(n),cell=new Int32Array(n),weight=new Float64Array(n);
 for(let i=0;i<n;i++){const x=start+i*step,u=(x-origin)/50-.5,c=Math.floor(u);pos[i]=x;cell[i]=c;weight[i]=sstep(u-c);}
 return {n,pos,cell,weight};
}
function sample(ind,ax,az,c0,r0,out,bias){
 const n=ax.n;
 for(let j=0;j<n;j++){const r=(az.cell[j]-r0)*W,fv=az.weight[j];
  for(let i=0;i<n;i++){const c=ax.cell[i]-c0,fu=ax.weight[i],k=r+c;
   out[j*n+i]=ind[k]*(1-fu)*(1-fv)+ind[k+1]*fu*(1-fv)+ind[k+W]*(1-fu)*fv+ind[k+W+1]*fu*fv-bias;}}
 return out;
}
function fieldAt(ind,c0,r0,x,z){
 const u=(x-OX)/50-.5,v=(z-OZ)/50-.5,c=Math.floor(u),r=Math.floor(v),fu=sstep(u-c),fv=sstep(v-r),i=c-c0,j=r-r0;
 const at=(i,j)=>i>=0&&i<W&&j>=0&&j<W?ind[j*W+i]:0;
 return at(i,j)*(1-fu)*(1-fv)+at(i+1,j)*fu*(1-fv)+at(i,j+1)*(1-fu)*fv+at(i+1,j+1)*fu*fv;
}
// marching squares of regionContour(): 0.5 contour as x,z segment list
const edgePoint=(va,vb,ax,az,bx,bz,pts)=>{if((va>0)!==(vb>0)){const t=va/(va-vb);pts.push(ax+(bx-ax)*t,az+(bz-az)*t);}};
function contour(ind,kx,kz,step,out){
 const ax=axis(OX+kx*SIZE,OX,step),az=axis(OZ+kz*SIZE,OZ,step),n=ax.n,m=n-1;
 const row=sample(ind,ax,az,kx*N-1,kz*N-1,new Float32Array(n*n),.5),x0=OX+kx*SIZE,z0=OZ+kz*SIZE,pts=[];
 for(let j=0;j<m;j++)for(let i=0;i<m;i++){
  const a=row[j*n+i],b=row[j*n+i+1],c=row[(j+1)*n+i+1],d=row[(j+1)*n+i];
  if((a>0)===(b>0)&&(b>0)===(c>0)&&(c>0)===(d>0))continue;
  const x=x0+i*step,z=z0+j*step;pts.length=0;
  edgePoint(a,b,x,z,x+step,z,pts);edgePoint(b,c,x+step,z,x+step,z+step,pts);edgePoint(c,d,x+step,z+step,x,z+step,pts);edgePoint(d,a,x,z+step,x,z,pts);
  if(pts.length===4||pts.length===8)for(const v of pts)out.push(v);
 }
 return out;
}
const indicator=(grid,match)=>{const ind=new Uint8Array(W*W);for(let i=0;i<ind.length;i++)ind[i]=match(grid[i])?1:0;return ind;};

// One team|rural group: translucent fill (regionFill) plus the outline of every town area.
function buildGroupChunk(grid,kx,kz,height,atlasHeight){
 const step=10,ind=indicator(grid,v=>v!==0),ax=axis(OX+kx*SIZE,OX,step),az=axis(OZ+kz*SIZE,OZ,step),n=ax.n,m=n-1;
 const f=sample(ind,ax,az,kx*N-1,kz*N-1,new Float64Array(n*n),0),y=new Float64Array(n*n).fill(NaN),fill=[],rgba=[],corner=[0,2,1,1,2,3];
 for(let j=0;j<m;j++)for(let i=0;i<m;i++){
  const at=[j*n+i,j*n+i+1,(j+1)*n+i,(j+1)*n+i+1];
  if(f[at[0]]<.42&&f[at[1]]<.42&&f[at[2]]<.42&&f[at[3]]<.42)continue;
  for(const k of corner){
   const p=at[k],x=ax.pos[i+(k&1)],z=az.pos[j+(k>>1)];
   if(y[p]!==y[p])y[p]=height(x,z)+.45;
   fill.push(x,y[p],z);rgba.push(1,1,1,sstep((f[p]-.40)/.20));
  }
 }
 const edges=[],ids=[...new Set(grid)].filter(v=>v!==0).sort((a,b)=>a-b),seg=[];
 for(const id of ids){
  seg.length=0;contour(indicator(grid,v=>v===id),kx,kz,6.25,seg);
  for(let i=0;i<seg.length;i+=4)if(atlasHeight((seg[i]+seg[i+2])/2,(seg[i+1]+seg[i+3])/2)>=.6)edges.push(seg[i],height(seg[i],seg[i+1])+.9,seg[i+1],seg[i+2],height(seg[i+2],seg[i+3])+.9,seg[i+3]);
 }
 return {fill:new Float32Array(fill),rgba:new Float32Array(rgba),edges:new Float32Array(edges)};
}
// One realm: dashed national border (cream underlay + team core) and the inward glow.
function buildTeamChunk(grid,kx,kz,height,atlasHeight){
 const ind=indicator(grid,v=>v!==0),c0=kx*N-1,r0=kz*N-1,seg=contour(ind,kx,kz,5,[]);
 const national=[],underlay=[],glowPos=[],glowAlpha=[];
 const quad=(vertices,p,q,r,t)=>vertices.push(...p,...r,...q,...q,...r,...t);
 for(let i=0;i<seg.length;i+=4){
  const ax=seg[i],az=seg[i+1],bx=seg[i+2],bz=seg[i+3],len=Math.hypot(bx-ax,bz-az)||1,nx=-(bz-az)/len,nz=(bx-ax)/len;
  if(atlasHeight((ax+bx)/2,(az+bz)/2)<.6)continue; // V286: the coast is the border; no dashes out at sea
  const mx=(ax+bx)/2,mz=(az+bz)/2,side=fieldAt(ind,c0,r0,mx+nx*3,mz+nz*3)>=fieldAt(ind,c0,r0,mx-nx*3,mz-nz*3)?1:-1;
  // glow: alpha 1 at the line, 0 eleven metres inside
  const w=11*side,ex=(bx-ax)/len*.6,ez=(bz-az)/len*.6,A=[ax-ex,az-ez],B=[bx+ex,bz+ez];
  const yA=height(A[0],A[1])+.55,yB=height(B[0],B[1])+.55,yAi=height(A[0]+nx*w,A[1]+nz*w)+.55,yBi=height(B[0]+nx*w,B[1]+nz*w)+.55;
  glowPos.push(A[0],yA,A[1], B[0],yB,B[1], A[0]+nx*w,yAi,A[1]+nz*w, A[0]+nx*w,yAi,A[1]+nz*w, B[0],yB,B[1], B[0]+nx*w,yBi,B[1]+nz*w);
  glowAlpha.push(1,1,0,0,1,0);
  // dashes: every 5 m contour piece becomes a 3 m dash
  const dx=(bx-ax)*.2,dz=(bz-az)*.2;
  for(const [vertices,half,lift] of [[underlay,2.3,1.15],[national,1.35,1.22]]){
   const pt=(x,z,sd)=>{const X=x+nx*half*sd,Z=z+nz*half*sd;return [X,height(X,Z)+lift,Z];};
   quad(vertices,pt(ax+dx,az+dz,-1),pt(ax+dx,az+dz,1),pt(bx-dx,bz-dz,-1),pt(bx-dx,bz-dz,1));
  }
 }
 return {national:new Float32Array(national),underlay:new Float32Array(underlay),glowPos:new Float32Array(glowPos),glowAlpha:new Float32Array(glowAlpha)};
}
function concat(chunks,field){
 let n=0;for(const c of chunks)n+=c.data[field].length;
 const out=new Float32Array(n);let o=0;for(const c of chunks){out.set(c.data[field],o);o+=c.data[field].length;}
 return out;
}

// game: territory (Map "c:r" -> city), cells, seen(team,cell), isCountyTile(cell,city).
// vision(): {revision, explored, all} of the player (optional; without it sync() always scans).
// stamp(): the territory revision (optional).
export function createTerritoryChunksV351(game,{height,atlasHeight=(x,z)=>game.atlasHeight(x,z),vision=null,stamp=null}={}){
 const layers=new Map(); // id -> {id,kind,team,rural,order,chunks:Map chunkId -> {kx,kz,grid,data,dirty},version,arrays}
 const queue=[],queued=new Set();let order=[],orderKey='',builds=0,scans=0,increments=0,last=null;
 const layerOf=(id,kind,team,rural)=>{let L=layers.get(id);if(!L){L={id,kind,team,rural,order:Infinity,chunks:new Map(),version:0,arrays:null,stale:false};layers.set(id,L);}return L;};
 const enqueue=(L,key)=>{const q=L.id+'#'+key;if(!queued.has(q)){queued.add(q);queue.push({id:L.id,key});}};
 const reorder=()=>{order=[...layers.values()].sort((a,b)=>a.order-b.order||(a.id<b.id?-1:1)).map(l=>l.id);orderKey=order.join(' ');};
 // every chunk whose lattice a cell can influence
 function eachChunk(c,r,fn){for(let kx=Math.ceil((c-N)/N);kx<=Math.floor((c+1)/N);kx++)for(let kz=Math.ceil((r-N)/N);kz<=Math.floor((r+1)/N);kz++)fn(kx,kz,(r-(kz*N-1))*W+(c-(kx*N-1)));}
 function cellInfo(key,city){
  const cut=key.indexOf(':'),c=+key.slice(0,cut),r=+key.slice(cut+1);
  if(!(c>=0&&c<COLS&&r>=0&&r<ROWS))return null;
  const index=r*COLS+c,cell=game.cells[index];if(!cell||!game.seen(0,cell))return null;
  return {c,r,index,rural:!!game.isCountyTile(cell,city)};
 }
 const remember=()=>{const v=vision?.();last=v?{revision:v.revision,explored:v.explored,all:!!v.all,logged:discoveredLogV351(v.explored)?.length??-1,stamp:stamp?.()}:null;};
 // Full pass: reads all visible territory cells and marks the chunks whose cells differ from the cache.
 function scan(){
  scans++;
  const slots=[],next=new Map(); // layer id -> {kind,team,rural,order,chunks}
  const put=(slot,id,kind,team,rural,c,r,value,index)=>{
   let G=slots[slot];if(!G){G=slots[slot]={kind,team,rural,order:index,chunks:new Map()};next.set(id,G);}else if(index<G.order)G.order=index;
   const kx1=Math.floor((c+1)/N),kz1=Math.floor((r+1)/N);
   for(let kx=Math.ceil((c-N)/N);kx<=kx1;kx++)for(let kz=Math.ceil((r-N)/N);kz<=kz1;kz++){
    const key=chunkId(kx,kz);let ch=G.chunks.get(key);if(!ch){ch={kx,kz,grid:new Int32Array(W*W)};G.chunks.set(key,ch);}
    ch.grid[(r-(kz*N-1))*W+(c-(kx*N-1))]=value;
   }
  };
  for(const [key,city] of game.territory){
   const info=cellInfo(key,city);if(!info)continue;
   const team=city.team;
   put(team*2+(info.rural?1:0),GROUP_IDS[team]?.[info.rural?1:0]||'g|'+team+'|'+info.rural,'group',team,info.rural,info.c,info.r,city.id+1,info.index);
   put(64+team,TEAM_IDS[team]||'t|'+team,'team',team,undefined,info.c,info.r,1,info.index);
  }
  let dirty=0;
  for(const id of [...layers.keys()])if(!next.has(id))layers.delete(id);
  for(const [id,G] of next){
   const L=layerOf(id,G.kind,G.team,G.rural);L.order=G.order;
   for(const key of [...L.chunks.keys()])if(!G.chunks.has(key)){L.chunks.delete(key);L.stale=true;}
   for(const [key,ch] of G.chunks){
    const old=L.chunks.get(key);let same=!!old;
    if(same)for(let i=0;i<ch.grid.length;i++)if(ch.grid[i]!==old.grid[i]){same=false;break;}
    if(same)continue;
    // the old arrays stay on screen until this chunk has been recomputed
    L.chunks.set(key,{kx:ch.kx,kz:ch.kz,grid:ch.grid,data:old?.data||null,dirty:true});enqueue(L,key);dirty++;
   }
  }
  reorder();remember();
  return {dirty};
 }
 // Discovery only: the newly known cells (game.reveal() log) are added to their chunks.
 function discover(log,from){
  increments++;let dirty=0,changed=false;
  for(let i=from;i<log.length;i++){
   const key=log[i],city=game.territory.get(key);if(!city)continue;
   const info=cellInfo(key,city);if(!info)continue;
   for(const [L,value] of [[layerOf('g|'+city.team+'|'+info.rural,'group',city.team,info.rural),city.id+1],[layerOf('t|'+city.team,'team',city.team,undefined),1]]){
    if(info.index<L.order){L.order=info.index;changed=true;}
    eachChunk(info.c,info.r,(kx,kz,at)=>{
     const id=chunkId(kx,kz);let ch=L.chunks.get(id);if(!ch){ch={kx,kz,grid:new Int32Array(W*W),data:null,dirty:false};L.chunks.set(id,ch);}
     if(ch.grid[at]===value)return;
     ch.grid[at]=value;ch.dirty=true;enqueue(L,id);dirty++;
    });
   }
  }
  if(changed||order.length!==layers.size)reorder();
  remember();
  return {dirty};
 }
 // Chooses the cheapest correct update for what changed since the last call.
 function sync(){
  const v=vision?.();
  if(!v||!last)return scan();
  const territoryStamp=stamp?.();
  if(stamp&&territoryStamp===last.stamp&&v.explored===last.explored&&!!v.all===last.all){
   if(v.revision===last.revision)return {dirty:0};
   if(v.all){remember();return {dirty:0};} // whole map shown: discovering changes nothing
   const log=discoveredLogV351(v.explored);
   if(log&&last.logged>=0&&v.revision-last.revision===log.length-last.logged)return discover(log,last.logged);
  }
  return scan();
 }
 // Recomputes queued chunks until the time budget is spent (at least one chunk per call).
 // Finished chunks are published (joined into the layer arrays) when the queue is empty; during a
 // long backlog (whole map revealed, save loaded mid-game) at most every publishMs, so a big change
 // does not re-upload whole layers on every frame.
 const touched=new Set();let published=0;
 function work(budgetMs=Infinity,publishMs=200){
  const start=now();
  while(queue.length){
   const {id,key}=queue.shift();queued.delete(id+'#'+key);
   const L=layers.get(id),ch=L?.chunks.get(key);
   if(ch&&ch.dirty){
    ch.data=L.kind==='group'?buildGroupChunk(ch.grid,ch.kx,ch.kz,height,atlasHeight):buildTeamChunk(ch.grid,ch.kx,ch.kz,height,atlasHeight);
    ch.dirty=false;builds++;touched.add(L);
   }
   if(now()-start>=budgetMs)break;
  }
  for(const L of layers.values())if(L.stale){touched.add(L);L.stale=false;}
  if(queue.length&&now()-published<publishMs)return {changed:[],pending:queue.length};
  const changed=[];
  for(const L of touched){
   if(layers.get(L.id)!==L)continue;
   const ready=[...L.chunks.values()].filter(c=>c.data);
   L.arrays=L.kind==='group'?{fill:concat(ready,'fill'),rgba:concat(ready,'rgba'),edges:concat(ready,'edges')}
    :{national:concat(ready,'national'),underlay:concat(ready,'underlay'),glowPos:concat(ready,'glowPos'),glowAlpha:concat(ready,'glowAlpha')};
   L.version++;changed.push(L.id);
  }
  touched.clear();published=now();
  return {changed,pending:queue.length};
 }
 return {scan,sync,work,layers,get order(){return order},get orderKey(){return orderKey},get pending(){return queue.length},get stats(){return {builds,scans,increments,chunks:[...layers.values()].reduce((n,l)=>n+l.chunks.size,0)}}};
}
