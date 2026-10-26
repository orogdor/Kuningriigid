// V174 / 3.2c: homes face a real pedestrian street and share small courtyards.
// Read-only candidate ranking: does NOT create, paint, widen, or preserve road
// heat. No save-state additions and no replacement of navigation safety checks.
export const STREETFRONT_V174=Object.freeze({
 cellSize:12,scanRadius:27,idealNear:7,idealFar:13,maxBonus:3.3
});
const key=(x,z)=>x+':'+z;
const cell=v=>Math.floor(v/STREETFRONT_V174.cellSize);
export function indexActiveStreetV174(cells=[]){
 const bins=new Map(),step=STREETFRONT_V174.cellSize;
 for(const p of cells){
  if(!Number.isFinite(p.x)||!Number.isFinite(p.z))continue;
  const k=key(cell(p.x),cell(p.z)),a=bins.get(k)||[];
  a.push(p);bins.set(k,a);
 }
 return {bins,count:cells.length,step};
}
export function closestActiveStreetV174(index,point){
 if(!index?.count)return Infinity;
 const x=cell(point.x),z=cell(point.z),range=3;
 let nearest=Infinity;
 for(let dz=-range;dz<=range;dz++)for(let dx=-range;dx<=range;dx++){
  const list=index.bins.get(key(x+dx,z+dz));if(!list)continue;
  for(const p of list){const d=Math.hypot(p.x-point.x,p.z-point.z);if(d<nearest)nearest=d;}
 }
 return nearest;
}
export function streetfrontScoreV174(point,streetIndex){
 const distance=closestActiveStreetV174(streetIndex,point);
 if(!Number.isFinite(distance)||distance>STREETFRONT_V174.scanRadius)return 0;
 // The plot footprint itself remains protected by V173 (road heat and
 // physical navigation checks). Bias toward frontages, never onto the path.
 if(distance<5.5)return 0;
 const closeness=distance<STREETFRONT_V174.idealNear?
  (distance-5.5)/(STREETFRONT_V174.idealNear-5.5):
  distance>STREETFRONT_V174.idealFar?
   Math.max(0,(STREETFRONT_V174.scanRadius-distance)/
     (STREETFRONT_V174.scanRadius-STREETFRONT_V174.idealFar)):1;
 return -STREETFRONT_V174.maxBonus*Math.max(0,Math.min(1,closeness));
}
// Encourages groups of two or three adjacent houses around a gap, without
// assigning ownership of yard space or constructing imaginary roads.
export function courtyardScoreV174(point,homes=[]){
 if(!homes.length)return 0;
 const near=homes.map(h=>Math.hypot(h.x-point.x,h.z-point.z));
 const companions=near.filter(d=>d>=10.5&&d<=20);
 if(!companions.length)return 0;
 const ideal=companions.filter((d)=>d>=12&&d<=17).length;
 return -Math.min(1.6,(ideal?.8:.45)+Math.min(2,companions.length-1)*.35);
}
