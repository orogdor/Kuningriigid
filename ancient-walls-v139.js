// V139 ancient city fortifications: compact, irregular stepped ring around
// the occupied core, leaving four passable entrance gaps for real roads.
const hash=(seed,n)=>{const t=Math.sin(seed*17.71+n*7.47)*43758.5;return t-Math.floor(t)};
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
export function surplusForWalls(stock,pop,waiting=0){
 const food=(stock.bread||0)+(stock.meat||0)+(stock.fish||0)+(stock.grain||0)+(stock.berries||0)+(stock.vegetables||0);
 return pop>=12&&waiting<=6&&(stock.gold||0)>=120&&
 (stock.wood||0)>=100&&(stock.stone||0)>=30&&
 (stock.water||0)>=pop*1.5&&food>=pop*2;
}
export function wallExtents(buildings=[],seed=0){
 // Protect the historic core. Distant suburbs remain outside until the city
 // grows further; wall segments must never exceed the local map boundary.
 const inner=(buildings||[]).filter(b=>b.hp>0&&!b.virtual&&
   !['palisade','stonewall','reinforced_wall','gatehouse','watchtower','stonetower','field','farm','harbor','fisher','quarry','lumber','forester','mine'].includes(b.type));
 const sorted=axis=>inner.map(b=>Math.abs(b[axis]||0)).sort((a,b)=>a-b);
 const x=sorted('x'),z=sorted('z');
 const limit=list=>list.length?list[Math.floor((list.length-1)*.78)]:31;
 const rx=Math.round(clamp(limit(x)+12,43,91)/7)*7;
 const rz=Math.round(clamp(limit(z)+12,34,77)/7)*7;
 return {rx,rz,cut:14,seed};
}
export function ancientWallPlan(buildings=[],wall='palisade',tower='watchtower',seed=0){
 const {rx,rz,cut}=wallExtents(buildings,seed);
 const slots=[],used=new Set();
 const add=(type,x,z,wallAxis=0)=>{
  x=Math.round(x*2)/2;z=Math.round(z*2)/2;
  const key=x+':'+z;if(used.has(key))return;
  used.add(key);slots.push({type,x,z,wallAxis});
 };
 // Clipped corners make a stepped octagonal-looking, non-square city ring.
 // Straight 7-metre spans match actual wall mesh/collision length.
 for(const z of [-rz,rz]){
  for(let x=-rx+cut;x<=rx-cut;x+=7){
   if(Math.abs(x)<=7.01)continue; // deliberately open north & south gates
   add(wall,x,z,0);
  }
  add(tower,-7,z,0);add(tower,7,z,0);
 }
 for(const x of [-rx,rx]){
  for(let z=-rz+cut;z<=rz-cut;z+=7){
   if(Math.abs(z)<=7.01)continue; // keep the east/west roads accessible
   add(wall,x,z,1);
  }
  add(tower,x,-7,1);add(tower,x,7,1);
 }
 // L-shaped chamfered corners avoid perfectly rectangular outlines.
 for(const sx of [-1,1])for(const sz of [-1,1]){
  add(wall,sx*(rx-cut),sz*(rz-7),1);
  add(wall,sx*(rx-7),sz*(rz-cut),0);
  add(tower,sx*(rx-cut),sz*(rz-cut),0);
 }
 return {slots,gateOpenings:4,shape:'stepped-oval',rx,rz};
}
export function reserveAfterWalls(stock,cost){
 const remaining={...stock};
 for(const [resource,n] of Object.entries(cost||{}))remaining[resource]=(remaining[resource]||0)-n;
 return (remaining.wood||0)>=55&&(remaining.stone||0)>=25&&((cost?.plank||0)===0||(remaining.plank||0)>=8);
}
