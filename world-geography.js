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
export function buildDrainage(cells,noise,starts=[]){
 const n=cells.length,visited=new Uint8Array(n),down=new Int32Array(n).fill(-1),order=[],heap=new Heap(),acc=new Float64Array(n).fill(1),filled=new Float64Array(n);
 const seed=(i)=>{if(visited[i])return;visited[i]=1;filled[i]=cells[i].h;heap.push(filled[i],i)};
 for(let i=0;i<n;i++){const p=cells[i];if(!p.land||p.c===0||p.r===0||p.c===COLS-1||p.r===ROWS-1)seed(i)}
 while(heap.length){const [e,i]=heap.pop();order.push(i);const p=cells[i];for(const [dc,dr] of steps){const c=p.c+dc,r=p.r+dr;if(c<0||r<0||c>=COLS||r>=ROWS)continue;const j=r*COLS+c;if(visited[j])continue;visited[j]=1;down[j]=i;const elevation=Math.max(cells[j].h,e+0.00001);filled[j]=elevation;heap.push(elevation,j)}}
 // Every child is popped after its downstream parent: reverse accumulation is safe.
 for(let k=order.length-1;k>=0;k--){const i=order[k],p=down[i];if(p>=0)acc[p]+=acc[i]}
 const threshold=cells.some(cell=>!cell.land)?24:100;
 let rivers=0;for(let i=0;i<n;i++){
  const cell=cells[i],d=down[i];if(!cell.land||d<0||acc[i]<threshold||cell.h<1.5)continue;
  if(starts.some(s=>Math.abs(s.c-cell.c)+Math.abs(s.r-cell.r)<2))continue;
  const to=cells[d];cell.river=true;cell.riverTo={c:to.c,r:to.r};cell.riverFlow=Math.round(acc[i]);
  cell.riverWidth=Math.max(2.3,Math.min(10,2.2+Math.sqrt(acc[i])*.38));
  cell.riverDir=to.c!==cell.c?'h':'v';
  const regular=(Math.round(acc[i]+noise(cell.c*7,cell.r*17)*19)%7===0);
  cell.ford=cell.ford||regular||starts.some(s=>Math.abs(s.c-cell.c)+Math.abs(s.r-cell.r)<=3);
  rivers++;
 }
 return {riverCells:rivers,totalCells:n,drainageDown:down,accumulation:acc};
}
