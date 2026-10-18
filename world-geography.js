// V55: elevation-derived drainage, with spillover across enclosed basins.
// All outlets are seeded from ocean/coast; land drainage pointers form an acyclic graph.
import {COLS,ROWS} from './campaign.js';
const steps=[[1,0],[-1,0],[0,1],[0,-1]];
class Heap{
 constructor(){this.a=[]}
 push(cost,index){const a=this.a;let i=a.length;a.push([cost,index]);while(i){const p=(i-1)>>1;if(a[p][0]<=cost)break;a[i]=a[p];i=p}a[i]=[cost,index]}
 pop(){const a=this.a,top=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1][0]<a[c][0])c++;if(a[c][0]>=last[0])break;a[i]=a[c];i=c}a[i]=last}return top}
 get length(){return this.a.length}
}
export function buildDrainage(cells,noise,starts=[],natural=false){
 const n=cells.length,visited=new Uint8Array(n),down=new Int32Array(n).fill(-1),order=[],heap=new Heap(),acc=new Float64Array(n).fill(1),filled=new Float64Array(n);
 const seed=(i)=>{if(visited[i])return;visited[i]=1;filled[i]=cells[i].h;heap.push(filled[i],i)};
 for(let i=0;i<n;i++){const p=cells[i];if(!p.land||p.c===0||p.r===0||p.c===COLS-1||p.r===ROWS-1)seed(i)}
 while(heap.length){const [e,i]=heap.pop();order.push(i);const p=cells[i];for(const [dc,dr] of steps){const c=p.c+dc,r=p.r+dr;if(c<0||r<0||c>=COLS||r>=ROWS)continue;const j=r*COLS+c;if(visited[j])continue;visited[j]=1;down[j]=i;const elevation=Math.max(cells[j].h,e+0.00001);filled[j]=elevation;heap.push(elevation,j)}}
 // Every child is popped after its downstream parent: reverse accumulation is safe.
 for(let k=order.length-1;k>=0;k--){const i=order[k],p=down[i];if(p>=0)acc[p]+=acc[i]}
 // New worlds begin with fewer, longer tributaries. Each surviving river is
 // still connected to a sea outlet through the priority-flood drainage tree.
 const threshold=cells.some(cell=>!cell.land)?(natural?37:24):100;
 let rivers=0;for(let i=0;i<n;i++){
  const cell=cells[i],d=down[i];if(!cell.land||d<0||acc[i]<threshold||cell.h<1.5)continue;
  if(starts.some(s=>Math.abs(s.c-cell.c)+Math.abs(s.r-cell.r)<2))continue;
  const to=cells[d];cell.river=true;cell.riverTo={c:to.c,r:to.r};cell.riverFlow=Math.round(acc[i]);
  cell.riverWidth=natural?Math.max(2.2,Math.min(9,1.7+Math.sqrt(acc[i])*.31)):Math.max(2.3,Math.min(10,2.2+Math.sqrt(acc[i])*.38));
  if(natural){cell.riverClass=acc[i]>440?'major':acc[i]>135?'river':'stream';cell.riverSource=acc[i]<threshold*1.7;cell.tributaryFlow=Math.round(acc[i]);}
  cell.riverDir=to.c!==cell.c?'h':'v';
  const regular=natural?(acc[i]<250&&(Math.round(acc[i]+noise(cell.c*7,cell.r*17)*29)%13===0)):(Math.round(acc[i]+noise(cell.c*7,cell.r*17)*19)%7===0);
  cell.ford=cell.ford||regular||starts.some(s=>Math.abs(s.c-cell.c)+Math.abs(s.r-cell.r)<=3);
  rivers++;
 }
 return {riverCells:rivers,totalCells:n,drainageDown:down,accumulation:acc};
}

// V56: keep natural ridges, but make sure a capital is not enclosed by an
// artificial 3x3 flat plateau surrounded on every side by impassable peaks.
// Open one narrow, elevation-conscious mountain pass to a sizable traversable
// region. This is deterministic for a seed; it is recomputed on load because
// world topology is generated rather than saved per tile.
export function openStartingPassages(cells, starts, minRegion=120){
 const n=cells.length,flags=new Int32Array(n).fill(-1),sizes=[],waypoints=[];
 const traversable=p=>p&&p.land&&!p.mountain&&(!p.river||p.ford||p.bridge);
 const componentAt=()=>{
  flags.fill(-1);sizes.length=0;
  for(let index=0;index<n;index++){
   if(flags[index]!==-1||!traversable(cells[index]))continue;
   const id=sizes.length,queue=[index];flags[index]=id;
   for(let q=0;q<queue.length;q++){
    const k=queue[q],c=k%COLS,r=Math.floor(k/COLS);
    for(const [dc,dr] of steps){const x=c+dc,y=r+dr,j=y*COLS+x;
     if(x>=0&&x<COLS&&y>=0&&y<ROWS&&flags[j]===-1&&traversable(cells[j])){flags[j]=id;queue.push(j)}
    }
   }
   sizes.push(queue.length);
  }
 };
 for(const start of starts){
  componentAt();const at=start.r*COLS+start.c;
  if(at<0||at>=n||!cells[at]?.land)continue;
  if(flags[at]>=0&&sizes[flags[at]]>=minRegion)continue;
  const heap=new Heap(),dist=new Float64Array(n).fill(Infinity),parent=new Int32Array(n).fill(-1);
  dist[at]=0;heap.push(0,at);let target=-1;
  while(heap.length){const [cost,i]=heap.pop();if(cost>dist[i]+1e-7)continue;
   if(i!==at&&flags[i]>=0&&sizes[flags[i]]>=minRegion){target=i;break}
   const c=i%COLS,r=Math.floor(i/COLS);
   for(const [dc,dr] of steps){const x=c+dc,y=r+dr;if(x<0||x>=COLS||y<0||y>=ROWS)continue;
    const j=y*COLS+x,p=cells[j];if(!p.land)continue;
    const weight=p.mountain?3.6:p.river&&!p.ford&&!p.bridge?2.2:1;
    const d=cost+weight;if(d<dist[j]){dist[j]=d;parent[j]=i;heap.push(d,j)}
   }
  }
  if(target<0)continue;
  let opened=0,length=0;
  for(let k=target;k!==at&&k>=0;k=parent[k]){
   const p=cells[k];if(p.mountain){p.mountain=false;p.h=Math.min(26,p.h);p.biome='plains';opened++}
   if(p.river&&!p.ford&&!p.bridge){p.ford=true;opened++}
   length++;
  }
  waypoints.push({from:{...start},to:{c:target%COLS,r:Math.floor(target/COLS)},length,opened});
 }
 return waypoints;
}
