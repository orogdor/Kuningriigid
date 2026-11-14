// V351: the chunked territory geometry must be the same set of triangles and lines as the old
// whole-world pass, and discovering map cells must recompute only the chunks that changed.
import assert from 'node:assert/strict';
import {COLS,ROWS} from '../campaign.js';
import {cellRegion,regionContour,regionFill} from '../landscape-v149.js?v=162a';
import {createTerritoryChunksV351} from '../territory-chunks-v351.js';
import {noteDiscoveredV351} from '../fog-delta-v88.js';

let seed=20261114;const rnd=()=>((seed=(seed*1103515245+12345)>>>0)/4294967296);
const height=(x,z)=>Math.max(.7,3+Math.sin(x*.013)*2+Math.cos(z*.017)*2);
const atlasHeight=(x,z)=>Math.sin(x*.004)+Math.cos(z*.005)+.9; // some of the map counts as sea (<.6)
const cells=Array.from({length:COLS*ROWS},(_,i)=>({c:i%COLS,r:Math.floor(i/COLS)}));
const explored={},territory=new Map(),urban=new Set();let revision=0,stamp=0; // stamp: bumped whenever the territory map changes
const game={cells,territory,seen:(team,p)=>!!explored[p.c+':'+p.r],isCountyTile:(p)=>!urban.has(p.c+':'+p.r),atlasHeight};
const cities=[];
function addCity(id,team,cc,cr,radius){
 const city={id,team,c:cc,r:cr};cities.push(city);
 for(let r=cr-radius;r<=cr+radius;r++)for(let c=cc-radius;c<=cc+radius;c++){
  if(c<0||c>=COLS||r<0||r>=ROWS||Math.hypot(c-cc,r-cr)>radius+rnd()*.8)continue;
  const k=c+':'+r;if(territory.has(k))continue;territory.set(k,city);if(Math.hypot(c-cc,r-cr)<=radius*.45)urban.add(k);
 }
 return city;
}
const reveal=(c,r,radius=2)=>{let n=0;for(let dr=-radius;dr<=radius;dr++)for(let dc=-radius;dc<=radius;dc++){const k=(c+dc)+':'+(r+dr);if(c+dc<0||c+dc>=COLS||r+dr<0||r+dr>=ROWS||explored[k])continue;explored[k]=1;revision++;noteDiscoveredV351(explored,k);n++;}return n;}; // as game.reveal()

// ---- the pre-V351 whole-world pass from atlas-style.js, arrays only
function reference(){
 const groups=new Map(),teams=new Map(),out={groups:new Map(),teams:new Map(),underlay:[]};
 for(const cell of game.cells){
  const city=game.territory.get(cell.c+':'+cell.r);if(!city||!game.seen(0,cell))continue;
  const rural=!!game.isCountyTile(cell,city),key=city.team+'|'+rural,k=cell.c+':'+cell.r;
  if(!groups.has(key))groups.set(key,{team:city.team,rural,cells:[],cities:new Map()});
  const g=groups.get(key);g.cells.push(k);if(!g.cities.has(city.id))g.cities.set(city.id,[]);g.cities.get(city.id).push(k);
  if(!teams.has(city.team))teams.set(city.team,[]);teams.get(city.team).push(k);
 }
 for(const [key,{cells,cities}] of groups){
  const fillData=regionFill(cellRegion(cells)),fill=[],rgba=[];
  for(let i=0;i<fillData.alpha.length;i++){const x=fillData.pos[i*2],z=fillData.pos[i*2+1];fill.push(x,height(x,z)+.45,z);rgba.push(1,1,1,fillData.alpha[i]);}
  const edges=[];
  for(const keys of cities.values()){const seg=regionContour(cellRegion(keys));for(let i=0;i<seg.length;i+=4)if(game.atlasHeight((seg[i]+seg[i+2])/2,(seg[i+1]+seg[i+3])/2)>=.6)edges.push(seg[i],height(seg[i],seg[i+1])+.9,seg[i+1],seg[i+2],height(seg[i+2],seg[i+3])+.9,seg[i+3]);}
  out.groups.set('g|'+key,{fill,rgba,edges});
 }
 const quad=(vertices,p,q,r,t)=>vertices.push(...p,...r,...q,...q,...r,...t);
 for(const [team,keys] of teams){
  const region=cellRegion(keys),seg=regionContour(region,5),national=[],glow=[];
  for(let i=0;i<seg.length;i+=4){
   const ax=seg[i],az=seg[i+1],bx=seg[i+2],bz=seg[i+3],len=Math.hypot(bx-ax,bz-az)||1,nx=-(bz-az)/len,nz=(bx-ax)/len;
   if(game.atlasHeight((ax+bx)/2,(az+bz)/2)<.6)continue;
   const mx=(ax+bx)/2,mz=(az+bz)/2,side=region.field(mx+nx*3,mz+nz*3)>=region.field(mx-nx*3,mz-nz*3)?1:-1;
   const w=11*side,ex=(bx-ax)/len*.6,ez=(bz-az)/len*.6,A=[ax-ex,az-ez],B=[bx+ex,bz+ez];
   glow.push(A[0],height(A[0],A[1])+.55,A[1],1, B[0],height(B[0],B[1])+.55,B[1],1, A[0]+nx*w,height(A[0]+nx*w,A[1]+nz*w)+.55,A[1]+nz*w,0,
          A[0]+nx*w,height(A[0]+nx*w,A[1]+nz*w)+.55,A[1]+nz*w,0, B[0],height(B[0],B[1])+.55,B[1],1, B[0]+nx*w,height(B[0]+nx*w,B[1]+nz*w)+.55,B[1]+nz*w,0);
   const dx=(bx-ax)*.2,dz=(bz-az)*.2;
   for(const [vertices,half,lift] of [[out.underlay,2.3,1.15],[national,1.35,1.22]]){
    const pt=(x,z,sd)=>{const X=x+nx*half*sd,Z=z+nz*half*sd;return [X,height(X,Z)+lift,Z];};
    quad(vertices,pt(ax+dx,az+dz,-1),pt(ax+dx,az+dz,1),pt(bx-dx,bz-dz,-1),pt(bx-dx,bz-dz,1));
   }
  }
  out.teams.set('t|'+team,{national,glow});
 }
 out.order=[...groups.keys()].map(k=>'g|'+k);
 return out;
}
// primitives (groups of `per` numbers, as the float32 values the GPU gets) as a sorted list: order inside a mesh does not matter
const prims=(array,per)=>{const out=[];for(let i=0;i<array.length;i+=per){let s='';for(let j=0;j<per;j++)s+=Math.fround(array[i+j])+' ';out.push(s);}return out.sort();};
const withAlpha=(pos,alpha,n=3)=>{const out=[];for(let i=0;i<alpha.length;i++)out.push(pos[i*3],pos[i*3+1],pos[i*3+2],alpha[i]);return out;};
function same(chunks,label){
 const ref=reference();
 assert.deepEqual(chunks.order.filter(id=>id.startsWith('g|')),ref.order,label+': group draw order');
 assert.equal([...chunks.layers.keys()].filter(id=>id.startsWith('g|')).length,ref.groups.size,label+': group count');
 for(const [id,r] of ref.groups){
  const a=chunks.layers.get(id).arrays;
  const refFill=[];for(let i=0;i<r.rgba.length/4;i++)refFill.push(r.fill[i*3],r.fill[i*3+1],r.fill[i*3+2],r.rgba[i*4+3]);
  const newFill=[];for(let i=0;i<a.rgba.length/4;i++)newFill.push(a.fill[i*3],a.fill[i*3+1],a.fill[i*3+2],a.rgba[i*4+3]);
  assert.deepEqual(prims(newFill,12),prims(refFill,12),label+': fill '+id);
  assert.deepEqual(prims(a.edges,6),prims(r.edges,6),label+': town outline '+id);
 }
 let underlay=[];
 for(const [id,r] of ref.teams){
  const a=chunks.layers.get(id).arrays;
  assert.deepEqual(prims(a.national,9),prims(r.national,9),label+': national border '+id);
  assert.deepEqual(prims(withAlpha(a.glowPos,a.glowAlpha),12),prims(r.glow,12),label+': border glow '+id);
  underlay=underlay.concat([...a.underlay]);
 }
 assert.deepEqual(prims(underlay,9),prims(ref.underlay,9),label+': border outline');
 return ref;
}
const settle=chunks=>{let rounds=0;chunks.sync();do{chunks.work(2);rounds++;}while(chunks.pending);return rounds;};

// ---- a late-game sized world: 4 realms, 40 towns, the west and the middle explored
for(let i=0;i<40;i++)addCity(i,i%4,10+Math.floor(rnd()*(COLS-20)),10+Math.floor(rnd()*(ROWS-20)),4+Math.floor(rnd()*5));
addCity(40,0,3,3,5);addCity(41,1,COLS-4,ROWS-4,5); // towns touching the map edge
for(let c=0;c<COLS*.6;c+=3)for(let r=0;r<ROWS;r+=3)reveal(c,r,2);
const chunks=createTerritoryChunksV351(game,{height,vision:()=>({revision,explored,all:false}),stamp:()=>stamp});
chunks.sync();chunks.work();
assert.equal(chunks.pending,0);
const first=same(chunks,'first build');
assert.ok(first.groups.size>=6&&first.teams.size===4,'the test world must contain all realms');
const fullBuilds=chunks.stats.builds;

// nothing changed: nothing is recomputed
chunks.sync();assert.equal(chunks.work().changed.length,0,'unchanged world must not rebuild layers');
assert.equal(chunks.stats.builds,fullBuilds,'unchanged world must not rebuild chunks');

// discovering wilderness: no territory chunk is recomputed
let wild=null;
for(let c=Math.ceil(COLS*.62);c<COLS-3&&!wild;c++)for(let r=3;r<ROWS-3&&!wild;r++){let free=true;for(let dr=-4;dr<=4;dr++)for(let dc=-4;dc<=4;dc++)if(territory.has((c+dc)+':'+(r+dr)))free=false;if(free)wild={c,r};}
assert.ok(wild,'test world needs wilderness');
assert.ok(reveal(wild.c,wild.r,2)>0);
const scansBefore=chunks.stats.scans;
chunks.sync();assert.equal(chunks.work().changed.length,0,'wilderness discovery must not touch territory layers');
assert.equal(chunks.stats.builds,fullBuilds,'wilderness discovery must not rebuild chunks');

// an explorer walks through unknown foreign land: only nearby chunks are recomputed, result stays exact
const unseen=cities.filter(c=>!explored[c.c+':'+c.r]);assert.ok(unseen.length>3,'test world needs undiscovered towns');
let worst=0,checked=0; // (the old whole-world pass takes seconds, so it is compared once per stage)
for(const city of unseen.slice(0,4))for(let step=-6;step<=6;step+=2){
 if(!reveal(city.c+step,city.r+Math.round(step/3),2))continue;
 const before=chunks.stats.builds;settle(chunks);worst=Math.max(worst,chunks.stats.builds-before);
 if(step===6)checked++;
}
same(chunks,'after the explorer walks');assert.equal(checked,4);
assert.ok(worst>0,'explorer must reveal foreign territory in this test');
assert.ok(worst<=40,'one explorer step recomputed '+worst+' chunks (full build: '+fullBuilds+')');
assert.equal(chunks.stats.scans,scansBefore,'discovery uses the reveal log, not a pass over the whole territory');
assert.ok(chunks.stats.increments>10);
// a cell made visible without the log (old demo code) is still picked up, by a full pass
{const city=unseen[4],k=city.c+':'+city.r;assert.ok(!explored[k]);explored[k]=1;revision++;settle(chunks);assert.equal(chunks.stats.scans,scansBefore+1);
 reveal(city.c+1,city.r,1);settle(chunks);same(chunks,'log used again afterwards');assert.equal(chunks.stats.scans,scansBefore+1);}
// the first discovered cell of a realm/group that was not on the map yet
{const hidden=addCity(77,3,COLS-12,12,3);stamp++;settle(chunks);reveal(hidden.c,hidden.r,1);settle(chunks);same(chunks,'hidden town discovered');}

// a conquered town changes realm, a new town appears, a town is razed
const taken=cities.find(c=>c.team===1&&explored[c.c+':'+c.r]);taken.team=0;stamp++;
settle(chunks);
const fresh=addCity(99,2,Math.floor(COLS*.3),Math.floor(ROWS*.5),6);stamp++;
settle(chunks);
for(const [k,city] of [...territory])if(city===fresh||city.id===3)territory.delete(k);
stamp++;settle(chunks);same(chunks,'towns razed');

// a realm that disappears completely takes its layers with it
for(const [k,city] of [...territory])if(city.team===3)territory.delete(k);
stamp++;settle(chunks);const gone=same(chunks,'realm destroyed');
assert.ok(!chunks.layers.has('t|3')&&!gone.teams.has('t|3'));

// the whole map becomes visible (debug switch / end of game)
for(const cell of cells)reveal(cell.c,cell.r,0);
const rounds=settle(chunks);same(chunks,'whole map visible');
assert.ok(rounds>1,'a large change must be spread over several calls when a time budget is given');

console.log('PASS V351 chunked territory geometry equals the whole-world pass ('+fullBuilds+' chunks in the first build, at most '+worst+' per explorer step)');
