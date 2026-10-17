import {COLS,ROWS,WORLD_WIDTH,WORLD_DEPTH,ORIGIN_X,ORIGIN_Z} from './campaign.js';
// Seeded continental lobes. Optional narrow land bridges connect some neighbours.
const cache=new Map();
export function continentLayout(seed,islands=false){const cacheKey=seed+":"+islands;if(cache.has(cacheKey))return cache.get(cacheKey);let state=(seed^0x9e3779b9)>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296},count=2+Math.floor(random()*3),rotation=random()*Math.PI*2,centers=[],polygons=[];
for(let i=0;i<count;i++){const a=rotation+i*Math.PI*2/count,x=.5+Math.cos(a)*(count===2?.25:.28),y=.5+Math.sin(a)*.23;centers.push({x,y});const rx=count===2?.18:.145,ry=count===2?.24:.175,p1=random()*6.28,p2=random()*6.28,p3=random()*6.28,stretch=.88+random()*.22,poly=[];for(let j=0;j<40;j++){const angle=j*Math.PI*2/40,shape=1+.16*Math.sin(angle*3+p1)+.10*Math.cos(angle*5+p2)+.06*Math.sin(angle*7+p3);poly.push([Math.max(.045,Math.min(.955,x+Math.cos(angle)*rx*shape*stretch)),Math.max(.045,Math.min(.955,y+Math.sin(angle)*ry*shape/stretch))])}polygons.push(poly)}
let bridges=0;for(let i=0;i<(count===2?1:count-1)&&bridges<(count===2?1:count-2);i++){if(random()>.45)continue;const a=centers[i],b=centers[(i+1)%count],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length,width=.012+random()*.008,bend=(random()-.5)*.07,m={x:(a.x+b.x)/2+nx*bend,y:(a.y+b.y)/2+ny*bend};polygons.push([[a.x+nx*width,a.y+ny*width],[m.x+nx*width,m.y+ny*width],[b.x+nx*width,b.y+ny*width],[b.x-nx*width,b.y-ny*width],[m.x-nx*width,m.y-ny*width],[a.x-nx*width,a.y-ny*width]]);bridges++}
const islandCenters=[];if(islands)for(let attempt=0;attempt<300&&islandCenters.length<16;attempt++){const x=.06+random()*.88,y=.07+random()*.86;if(polygons.some(p=>distance(x,y,p)>-.027)||islandCenters.some(p=>Math.hypot(p.x-x,p.y-y)<.05))continue;const radius=.009+random()*.014,poly=[];for(let k=0;k<9;k++){const a=k*Math.PI*2/9,r=radius*(.8+random()*.4);poly.push([x+Math.cos(a)*r,y+Math.sin(a)*r])}polygons.push(poly);islandCenters.push({x,y})}
const starts=chooseSeparatedStarts(polygons.slice(0,count),centers);const result={count,centers,polygons,bridges,starts,islands:islandCenters};cache.set(cacheKey,result);return result}
function distance(u,v,poly){let inside=false,min=Infinity;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[a,b]=poly[i],[c,d]=poly[j];if((b>v)!==(d>v)&&u<(c-a)*(v-b)/(d-b)+a)inside=!inside;const dx=c-a,dy=d-b,t=Math.max(0,Math.min(1,((u-a)*dx+(v-b)*dy)/(dx*dx+dy*dy)));min=Math.min(min,Math.hypot(u-a-dx*t,v-b-dy*t))}return inside?min:-min}
// Candidate capitals are placed well inland and maximally separated, including on 2-continent maps.
export const MIN_START_DISTANCE=28; // in world tiles, measured Euclidean from every rival
function chooseSeparatedStarts(mainPolygons,centers){
 const candidates=[];
 for(let r=5;r<ROWS-5;r+=2)for(let c=5;c<COLS-5;c+=2){
  const u=(c+.5)/COLS,v=(r+.5)/ROWS;
  let interior=-1;
  for(const poly of mainPolygons)interior=Math.max(interior,distance(u,v,poly));
  if(interior>.029)candidates.push({c,r,interior});
 }
 if(!candidates.length)throw new Error('Continent has no valid starting sites');
 const selected=[];
 const dist=(a,b)=>Math.hypot(a.c-b.c,a.r-b.r);
 const add=(target,first=false)=>{
  let best=null,bestScore=-Infinity;
  for(const p of candidates){
   const nearest=selected.length?Math.min(...selected.map(q=>dist(p,q))):Infinity;
   if(nearest<MIN_START_DISTANCE)continue;
   const centerDistance=target?Math.hypot((p.c+.5)/COLS-target.x,(p.r+.5)/ROWS-target.y):0;
   const score=first?(-centerDistance*75+p.interior*20):(selected.length?nearest:0)+p.interior*35-centerDistance*5;
   if(score>bestScore){bestScore=score;best=p}
  }
  if(!best)return false;
  selected.push({c:best.c,r:best.r});return true;
 };
 add(centers[0],true);
 if(centers.length>1){const other=centers[1];let best=null,score=-Infinity;
  for(const p of candidates){const d=dist(p,selected[0]);if(d<MIN_START_DISTANCE)continue;
   const v=-Math.hypot((p.c+.5)/COLS-other.x,(p.r+.5)/ROWS-other.y)*100+p.interior*25;
   if(v>score){score=v;best=p}
  }
  if(best)selected.push({c:best.c,r:best.r});
 }
 while(selected.length<4){if(!add(null))throw new Error('Could not find four sufficiently separated continental starts')}
 return selected;
}
export function continentHeight(layout,x,z,smooth,legacy=false){
 const u=(x-ORIGIN_X)/(legacy?6400:WORLD_WIDTH),v=(z-ORIGIN_Z)/(legacy?5000:WORLD_DEPTH);
 let coast=-1;
 for(const p of layout.polygons)coast=Math.max(coast,distance(u,v,p));
 coast+=(smooth(u*78+19,v*78+271)-.5)*.014+(smooth(u*190+91,v*190+41)-.5)*.0035;
 if(coast<=0)return Math.max(-35,coast*900);
 const broad=smooth(u*10+36,v*10+13),ridge=1-Math.abs(smooth(u*42+64,v*42+22)*2-1);
 const micro=1-Math.abs(smooth(u*116+83,v*116+65)*2-1);
 const relief=smooth(u*26+34,v*26+981);
 const mountainBelt=Math.max(0,(broad-.43)*2.7);
 const base=Math.min(24,coast*810)*(.55+relief*.48);
 const rockiness=Math.min(1,Math.max(0,(coast-.018)*24));
 return base+rockiness*mountainBelt*(ridge*19+micro*7);
}
