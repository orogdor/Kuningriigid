// V248: plate-tectonic world generator ("Loogiline maailm").
// One deterministic pass per seed over the COLS×ROWS map grid:
//  1. plates   – 9–14 plates with irregular (noise-warped) borders, continental or oceanic, each moving;
//  2. uplift   – converging borders raise mountain ranges (continent–continent: high ranges,
//                ocean–continent: coastal range + trench, ocean–ocean: island arcs), diverging borders rift;
//  3. shaping  – smoothed plate heights + fractal noise, ocean around the map edge, sea level chosen so
//                land is ~40 % of the map and impassable mountains stay a small share of land;
//  4. erosion  – water flowing downhill carves valleys and leaves plains, then slopes relax;
//  5. climate  – temperature from latitude and altitude, rain carried by latitude wind belts
//                (trade winds, westerlies, polar easterlies) so mountains cast rain shadows;
//  6. starts   – four temperate, separated places on large landmasses.
// Height units follow the old generator: sea < 1 (down to -35), land 1…~55, mountains > 30.
import {COLS,ROWS,ORIGIN_X,ORIGIN_Z,TILE} from './campaign.js';

const cache=new Map();
const N=COLS*ROWS;
const idx=(c,r)=>r*COLS+c;
const DIRS4=[[1,0],[-1,0],[0,1],[0,-1]];
const DIRS8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];

function rng(seed){let s=(seed^0x2545f491)>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function valueNoise(seed){
 const hash=(x,y)=>{let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(seed,1442695041);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
 const n=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y);let u=x-xi,v=y-yi;u=u*u*(3-2*u);v=v*v*(3-2*v);
  const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};
 return (x,y,oct=4)=>{let sum=0,amp=1,f=1,norm=0;for(let o=0;o<oct;o++){sum+=n(x*f+o*17.3,y*f-o*9.1)*amp;norm+=amp;amp*=.5;f*=2.03;}return sum/norm;};
}
function blur(src,times){let a=Float32Array.from(src),b=new Float32Array(N);
 for(let t=0;t<times;t++){for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){let s=a[idx(c,r)]*4,w=4;
  for(const [dc,dr] of DIRS8){const x=c+dc,y=r+dr;if(x<0||y<0||x>=COLS||y>=ROWS)continue;const k=dc&&dr?1:2;s+=a[idx(x,y)]*k;w+=k;}b[idx(c,r)]=s/w;}[a,b]=[b,a];}
 return a;}
function percentile(arr,p){const s=Float32Array.from(arr).sort();return s[Math.min(s.length-1,Math.max(0,Math.floor(p*s.length)))];}

export function tectonicLayout(seed){
 if(cache.has(seed))return cache.get(seed);
 const random=rng(seed),noise=valueNoise(seed>>>0),warp=valueNoise((seed^0x5bd1e995)>>>0),detail=valueNoise((seed^0x27d4eb2d)>>>0);
 const aspect=COLS/ROWS;

 // 1. Plates: jittered seeds, borders bent by domain warping so they are not straight Voronoi lines.
 const plateCount=9+Math.floor(random()*6),plates=[];
 for(let i=0;i<plateCount;i++){
  const angle=random()*Math.PI*2,speed=.4+random()*.6;
  plates.push({x:.06+random()*.88,y:.08+random()*.84,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,continental:false,weight:.85+random()*.4});
 }
 // Plates grow outward from their seeds with a noisy cost, giving ragged natural borders.
 const plateOf=new Int16Array(N).fill(-1),growCost=new Float32Array(N).fill(Infinity),heap0=new MinHeap();
 for(let i=0;i<plates.length;i++){const c=Math.min(COLS-1,Math.floor(plates[i].x*COLS)),r=Math.min(ROWS-1,Math.floor(plates[i].y*ROWS)),j=idx(c,r);growCost[j]=0;heap0.push(0,j*32+i);}
 while(heap0.size){const key=heap0.pop(),j=key>>5,p=key&31;if(plateOf[j]>=0)continue;plateOf[j]=p;const c=j%COLS,r=(j/COLS)|0;
  for(const [dc,dr] of DIRS8){const x=c+dc,y=r+dr;if(x<0||y<0||x>=COLS||y>=ROWS)continue;const k=idx(x,y);if(plateOf[k]>=0)continue;
   const step=(dc&&dr?1.414:1)*(.12+Math.pow(warp(x/COLS*6*aspect,y/ROWS*6,4),2)*2.6)*plates[p].weight,cost=growCost[j]+step;
   if(cost<growCost[k]){growCost[k]=cost;heap0.push(cost,k*32+p);}}}
 // Continental plates: chosen after growth, about 45 % of the map. Mostly not touching each other, so
 // 2–4 separate landmasses form; sometimes two touch and fuse with a high range along the seam.
 const area=new Float32Array(plates.length),touch=plates.map(()=>new Set());
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const a=plateOf[idx(c,r)];area[a]++;if(c+1<COLS){const b=plateOf[idx(c+1,r)];if(b!==a){touch[a].add(b);touch[b].add(a);}}if(r+1<ROWS){const b=plateOf[idx(c,r+1)];if(b!==a){touch[a].add(b);touch[b].add(a);}}}
 const allowFuse=random()<.5;let landArea=0,landmasses=0;
 const pool=plates.map((p,i)=>({i,score:-Math.hypot(p.x-.5,(p.y-.5)*.8)*.6+random()*.5})).sort((a,b)=>b.score-a.score);
 for(const {i} of pool){
  if(landArea>N*.46)break;
  const touching=[...touch[i]].some(j=>plates[j].continental);
  if(touching&&!(allowFuse&&landmasses>=2&&random()<.5))continue;
  plates[i].continental=true;landArea+=area[i];if(!touching)landmasses++;
 }
 // 2. Border stress: relative plate motion across each border cell.
 const stress=new Float32Array(N),kind=new Int8Array(N); // kind: 1 cont-cont, 2 ocean→cont (cont side), 3 trench (ocean side), 4 ocean-ocean, 5 rift
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
  const i=idx(c,r),a=plates[plateOf[i]];
  for(const [dc,dr] of DIRS4){const x=c+dc,y=r+dr;if(x<0||y<0||x>=COLS||y>=ROWS)continue;const j=idx(x,y);if(plateOf[j]===plateOf[i])continue;
   const b=plates[plateOf[j]];
   // closing speed along the direction from this cell to the neighbour
   const closing=(a.vx-b.vx)*dc+(a.vy-b.vy)*dr;
   if(Math.abs(closing)<Math.abs(stress[i]))continue;
   stress[i]=closing;
   if(closing>0){
    if(a.continental&&b.continental)kind[i]=1;
    else if(a.continental)kind[i]=2;
    else if(b.continental)kind[i]=3;
    else kind[i]=4;
   }else kind[i]=5;
  }
 }
 // Spread the border effect inland with a distance field (BFS), so ranges have width and foothills.
 const dist=new Float32Array(N).fill(1e9),srcStress=new Float32Array(N),srcKind=new Int8Array(N),queue=[];
 for(let i=0;i<N;i++)if(kind[i]){dist[i]=0;srcStress[i]=stress[i];srcKind[i]=kind[i];queue.push(i);}
 for(let q=0;q<queue.length;q++){const i=queue[q],c=i%COLS,r=(i/COLS)|0;if(dist[i]>12)continue;
  for(const [dc,dr] of DIRS4){const x=c+dc,y=r+dr;if(x<0||y<0||x>=COLS||y>=ROWS)continue;const j=idx(x,y);
   if(dist[j]<=dist[i]+1||plateOf[j]!==plateOf[i])continue;dist[j]=dist[i]+1;srcStress[j]=srcStress[i];srcKind[j]=srcKind[i];queue.push(j);}}

 // 3. Elevation.
 let base=new Float32Array(N);
 for(let i=0;i<N;i++)base[i]=plates[plateOf[i]].continental?1:-1;
 base=blur(base,9); // continental shelves and gentle coasts instead of plate-shaped cliffs
 const height=new Float32Array(N);
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
  const i=idx(c,r),u=c/COLS,v=r/ROWS;
  // continental crust rarely fills a whole plate: large warped noise carves seas, bays and
  // peninsulas into it, so coasts do not trace the plate border
  const wu=u+(warp(u*2.6*aspect+5,v*2.6+5,4)-.5)*.36,wv=v+(warp(u*2.6*aspect+55,v*2.6+55,4)-.5)*.36;
  // sample the smoothed plate crust at a warped position, so coasts never follow a straight plate border
  const bc=Math.max(0,Math.min(COLS-1.001,wu*COLS-.5)),br=Math.max(0,Math.min(ROWS-1.001,wv*ROWS-.5)),c0=Math.floor(bc),r0=Math.floor(br),fu=bc-c0,fv=br-r0;
  const crust=(base[idx(c0,r0)]*(1-fu)+base[idx(c0+1,r0)]*fu)*(1-fv)+(base[idx(c0,r0+1)]*(1-fu)+base[idx(c0+1,r0+1)]*fu)*fv;
  let h=crust*.42-.1;
  h+=(noise(wu*3.6*aspect,wv*3.6,5)-.5)*1.25+(noise(wu*8*aspect+20,wv*8+20,4)-.5)*.55+(detail(u*18*aspect,v*18,3)-.5)*.28;
  // rounded (super-elliptic) world ocean towards the frame, with a ragged edge
  const ex=Math.abs(u-.5)*2,ey=Math.abs(v-.5)*2,rad=Math.pow(Math.pow(ex,3)+Math.pow(ey,3),1/3)+(detail(u*4*aspect+90,v*4+90,3)-.5)*.22;
  const e=(1-rad)*.5;
  const s=srcStress[i],k=srcKind[i],d=dist[i];
  if(k&&d<13){
   const strength=Math.min(1.6,Math.abs(s))*Math.max(0,Math.min(1,(e-.02)/.1)); // ranges fade out before the map edge
   const ridged=1-Math.abs(detail(u*24*aspect,v*24,3)*2-1); // broken crests rather than one smooth wall
   if(k===1)h+=strength*(Math.exp(-d*d/14)*(1.1+ridged*.8)+Math.exp(-d*d/60)*.35);             // continental collision: wide high range
   else if(k===2)h+=strength*(Math.exp(-Math.pow(d-2,2)/8)*(.9+ridged*.6)+Math.exp(-Math.pow(d-3,2)/40)*.25); // subduction: coastal range set back from the shore
   else if(k===3)h-=strength*Math.exp(-d*d/4)*.45;                        // ocean trench
   else if(k===4)h+=strength*Math.exp(-d*d/3)*Math.max(0,detail(u*11*aspect+3,v*11+3,2)*1.9-.85)*1.4;        // island arcs
   else if(k===5)h-=strength*Math.exp(-d*d/6)*(plates[plateOf[i]].continental?.35:.12); // rift valleys / ridges
  }
  // ocean along the map edge, so no continent is cut off by the frame
  if(e<.13){const t=Math.min(1,Math.max(0,.13-e)/.13);h-=t*t*(3-2*t)*2.2+Math.max(0,-e)*4;}
  height[i]=h;
 }

 // 4. Erosion: route water downhill (priority flood, so lakes spill), carve by flow, relax slopes.
 erode(height,6);

 // Sea level: ~40 % land. Scale land so the highest ~6 % of land becomes impassable mountain (> 30).
 const sea=percentile(height,.64);
 const landHeights=[];for(let i=0;i<N;i++)if(height[i]>sea)landHeights.push(height[i]-sea);
 const peak=percentile(landHeights,.94)||1,top=percentile(landHeights,.995)||peak*1.3;
 const out=new Float32Array(N);
 for(let i=0;i<N;i++){const h=height[i]-sea;
  if(h<=0){out[i]=Math.max(-35,h*60-1.5);continue;}
  // gentle lowlands (1…14), uplands (14…30), mountains above
  const t=h/peak;
  out[i]=t<=1?1.2+Math.pow(t,1.15)*28.6:30+Math.pow(Math.min(1,(h-peak)/Math.max(.001,top-peak)),1.4)*20;
 }

 // 5. Climate.
 const heat=new Float32Array(N),moisture=new Float32Array(N),latEff=new Float32Array(N);
 const rain=new Float32Array(N);
 for(let r=0;r<ROWS;r++){
  const lat=Math.abs((r+.5)/ROWS-.5)*2;
  // wind belts: trade winds blow west (from the east), westerlies blow east, polar easterlies blow west
  const westerly=lat>.33&&lat<.68;
  const cols=westerly?[...Array(COLS).keys()]:[...Array(COLS).keys()].reverse();
  // two passes so air entering at the map edge already carries ocean moisture
  let air=1;
  for(let pass=0;pass<2;pass++)for(let k=0;k<cols.length;k++){
   const c=cols[k],i=idx(c,r),h=out[i];
   if(h<1){air=Math.min(1.2,air+.06);if(pass)rain[i]=air*.5;continue;}
   const prev=k?out[idx(cols[k-1],r)]:h;
   const lift=Math.max(0,h-Math.max(1,prev))*.04;          // air pushed up a slope rains out
   const fall=Math.min(air,air*.012+lift+(h>30?.08:0));
   air=Math.max(0,air-fall);
   if(pass)rain[i]=fall*9+air*.25;
  }
 }
 const rainSmooth=blur(rain,3);
 const rainMax=percentile(rainSmooth,.97)||1;
 // distance from the sea (cells), for maritime vs continental climate
 const seaDist=new Float32Array(N).fill(1e9),sq=[];for(let i=0;i<N;i++)if(out[i]<1){seaDist[i]=0;sq.push(i);}
 for(let q=0;q<sq.length;q++){const i=sq[q],c=i%COLS,r=(i/COLS)|0;for(const [dc,dr] of DIRS4){const x=c+dc,y=r+dr;if(x<0||y<0||x>=COLS||y>=ROWS)continue;const j=idx(x,y);if(seaDist[j]>seaDist[i]+1){seaDist[j]=seaDist[i]+1;sq.push(j);}}}
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
  const i=idx(c,r),lat=Math.abs((r+.5)/ROWS-.5)*2,u=c/COLS,v=r/ROWS;
  // latitude rain factor: wet equator, dry subtropics (~0.25–0.4), wetter mid-latitudes, dry poles
  const belt=.55+.45*Math.cos(lat*Math.PI*2.9)*(lat<.85?1:.5)-(lat>.8?.25:0);
  const wet=Math.min(1,rainSmooth[i]/rainMax)*.6+Math.exp(-seaDist[i]/22)*.4;
  moisture[i]=Math.max(0,Math.min(1,wet*(.35+belt*.75)+.12+(detail(u*9*aspect+70,v*9+70,3)-.5)*.2));
  const altitude=Math.max(0,out[i]-6)/48;
  heat[i]=Math.max(0,Math.min(1,1-lat*.95-altitude*.45+(detail(u*6*aspect+11,v*6+5,3)-.5)*.1));
  // the biome rules switch at fixed latitudes; a ragged, altitude-aware latitude avoids ruler-straight polar bands
  latEff[i]=Math.max(0,Math.min(1,lat+(detail(u*7*aspect+31,v*7+17,4)-.5)*.16+Math.max(0,out[i]-14)/160));
 }

 // Keep the order of wet and dry places (rain shadows, coasts) but spread land moisture over the range
 // the biome rules expect: ~10 % desert/steppe-dry, most land grassland or forest, some very wet.
 const landIdx=[];for(let i=0;i<N;i++)if(out[i]>=1)landIdx.push(i);
 landIdx.sort((a,b)=>moisture[a]-moisture[b]);
 const target=[[0,.12],[.08,.3],[.2,.48],[.45,.62],[.75,.74],[.92,.86],[1,.97]];
 landIdx.forEach((i,k)=>{const t=k/Math.max(1,landIdx.length-1);let j=1;while(j<target.length-1&&target[j][0]<t)j++;const [t0,m0]=target[j-1],[t1,m1]=target[j];moisture[i]=m0+(m1-m0)*(t-t0)/Math.max(1e-6,t1-t0);});

 // 6. Starts: temperate, not on mountains, on large landmasses, far apart; prefer different landmasses.
 const region=new Int32Array(N).fill(-1),regionSize=[];
 for(let i=0;i<N;i++){if(region[i]>=0||out[i]<1)continue;const id=regionSize.length;let size=0;const stack=[i];region[i]=id;
  while(stack.length){const j=stack.pop();size++;const c=j%COLS,r=(j/COLS)|0;for(const [dc,dr] of DIRS4){const x=c+dc,y=r+dr;if(x<0||y<0||x>=COLS||y>=ROWS)continue;const k=idx(x,y);if(region[k]<0&&out[k]>=1){region[k]=id;stack.push(k);}}}
  regionSize.push(size);}
 const candidates=[];
 for(let r=6;r<ROWS-6;r+=1)for(let c=6;c<COLS-6;c+=1){const i=idx(c,r),h=out[i];if(h<3||h>22)continue;
  const lat=Math.abs((r+.5)/ROWS-.5)*2;if(lat>.7)continue;const size=regionSize[region[i]];if(size<260)continue;
  let flat=0;for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){const y=out[idx(c+dc,r+dr)];if(y>=1&&y<26)flat++;}
  if(flat<18)continue;
  candidates.push({c,r,region:region[i],quality:flat*.4-Math.abs(lat-.4)*14+Math.min(30,size/80)+moisture[i]*6});}
 const starts=[];
 for(let team=0;team<4;team++){
  let best=null,score=-Infinity;
  for(const p of candidates){
   const near=starts.length?Math.min(...starts.map(q=>Math.hypot((q.c-p.c),(q.r-p.r)))):120;
   if(near<34)continue;
   const sameLand=starts.filter(q=>q.region===p.region).length;
   const s=p.quality+Math.min(near,90)*.9-sameLand*22;
   if(s>score){score=s;best=p;}
  }
  if(!best)best=candidates[(team*997)%Math.max(1,candidates.length)]||{c:Math.round(COLS*(team%2?.7:.3)),r:Math.round(ROWS*(team>=2?.7:.3)),region:-1};
  starts.push(best);
 }
 const layout={tectonic:true,version:1,seed,heights:out,heat,moisture,lat:latEff,plates:plates.map(p=>({x:p.x,y:p.y,continental:p.continental})),starts:starts.map(p=>({c:p.c,r:p.r}))};
 cache.set(seed,layout);
 return layout;
}

// Height at world coordinates (same signature as continentHeight). Cells sample their own centre exactly;
// in-between points are bilinear so any other caller gets a smooth surface.
export function tectonicHeight(layout,x,z){
 const fx=(x-ORIGIN_X)/TILE-.5,fz=(z-ORIGIN_Z)/TILE-.5,c=Math.floor(fx),r=Math.floor(fz),u=fx-c,v=fz-r,H=layout.heights;
 const at=(c,r)=>c<0||r<0||c>=COLS||r>=ROWS?-35:H[idx(c,r)];
 return (at(c,r)*(1-u)+at(c+1,r)*u)*(1-v)+(at(c,r+1)*(1-u)+at(c+1,r+1)*u)*v;
}
export function tectonicClimate(layout,c,r){const i=idx(c,r);return {heat:layout.heat[i],moisture:layout.moisture[i]};}

function erode(h,iterations){
 const filled=new Float32Array(N),down=new Int32Array(N),order=new Int32Array(N),acc=new Float32Array(N);
 for(let it=0;it<iterations;it++){
  // priority flood from the map edge: every cell drains, depressions are filled up to their spill point
  const seen=new Uint8Array(N);const heap=new MinHeap();let n=0;
  for(let c=0;c<COLS;c++)for(const r of [0,ROWS-1]){const i=idx(c,r);if(!seen[i]){seen[i]=1;filled[i]=h[i];down[i]=-1;heap.push(filled[i],i);}}
  for(let r=1;r<ROWS-1;r++)for(const c of [0,COLS-1]){const i=idx(c,r);if(!seen[i]){seen[i]=1;filled[i]=h[i];down[i]=-1;heap.push(filled[i],i);}}
  while(heap.size){const i=heap.pop();order[n++]=i;const c=i%COLS,r=(i/COLS)|0;
   for(const [dc,dr] of DIRS8){const x=c+dc,y=r+dr;if(x<0||y<0||x>=COLS||y>=ROWS)continue;const j=idx(x,y);if(seen[j])continue;seen[j]=1;
    filled[j]=Math.max(h[j],filled[i]+1e-5);down[j]=i;heap.push(filled[j],j);}}
  acc.fill(1);
  for(let k=N-1;k>=0;k--){const i=order[k];if(down[i]>=0)acc[down[i]]+=acc[i];}
  // stream power: big rivers on steep ground cut most; sediment settles where the slope flattens
  for(let k=0;k<N;k++){const i=order[k],j=down[i];if(j<0)continue;
   const slope=Math.max(0,filled[i]-filled[j]);
   const cut=Math.min(slope*.5,Math.sqrt(acc[i])*slope*.045);
   if(h[i]>-0.2)h[i]-=cut;}
  // thermal relaxation: very steep steps crumble a little
  for(let i=0;i<N;i++){const c=i%COLS,r=(i/COLS)|0;for(const [dc,dr] of DIRS4){const x=c+dc,y=r+dr;if(x<0||y<0||x>=COLS||y>=ROWS)continue;const j=idx(x,y),d=h[i]-h[j];
   if(d>.22){const m=(d-.22)*.25;h[i]-=m;h[j]+=m;}}}
 }
}
class MinHeap{
 constructor(){this.k=[];this.v=[];}
 get size(){return this.v.length;}
 push(key,val){const k=this.k,v=this.v;let i=v.length;k.push(key);v.push(val);while(i){const p=(i-1)>>1;if(k[p]<=key)break;k[i]=k[p];v[i]=v[p];i=p;}k[i]=key;v[i]=val;}
 pop(){const k=this.k,v=this.v,top=v[0],lk=k.pop(),lv=v.pop();if(v.length){let i=0;for(;;){let c=i*2+1;if(c>=v.length)break;if(c+1<v.length&&k[c+1]<k[c])c++;if(k[c]>=lk)break;k[i]=k[c];v[i]=v[c];i=c;}k[i]=lk;v[i]=lv;}return top;}
}
