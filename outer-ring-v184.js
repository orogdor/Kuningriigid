import {wallStrokePlanV175,wallPointInsideV175} from './wall-draw-v175.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const fort=new Set(['palisade','stonewall','reinforced_wall','woodgate','gatehouse','watchtower','stonetower']);
// Pick a continuous part of the existing ring, and make an outward, three-sided
// extension. A shared edge L and new sides totalling about 2L give 1/3 reuse.
export function findOuterRingV184(game,city){
 const outline=city.stoneDefensePlanV166?.outlineV176||city.defensePlanV139?.outlineV176;
 if(!outline||outline.length<8)return null;
 const walls=game.defenseBuildingsV177(city).filter(b=>b.hp>0&&b.ready&&fort.has(b.type));
 const n=outline.length,center=outline.reduce((a,p)=>({x:a.x+p.x/n,z:a.z+p.z/n}),{x:0,z:0});
 const covered=p=>walls.some(b=>['palisade','stonewall','reinforced_wall'].includes(b.type)?wallPointInsideV175(p,b,1.8):dist(p,b)<6);
 let best=null;
 for(let start=0;start<n;start++)for(let len=4;len<=Math.floor(n/2);len++){
  const arc=Array.from({length:len+1},(_,i)=>outline[(start+i)%n]);
  let shared=0;for(let i=1;i<arc.length;i++)shared+=dist(arc[i-1],arc[i]);
  const a=arc[0],b=arc.at(-1),chord=dist(a,b);if(shared<32||shared>95||chord<shared*.72)continue;
  if(arc.some(p=>!covered(p)))continue;
  let gap=false;for(let i=1;i<arc.length&&!gap;i++){const p=arc[i-1],q=arc[i],steps=Math.ceil(dist(p,q)/2);for(let k=0;k<=steps;k++){const t=k/steps;if(!covered({x:p.x+(q.x-p.x)*t,z:p.z+(q.z-p.z)*t})){gap=true;break;}}}if(gap)continue;
  const dx=(b.x-a.x)/chord,dz=(b.z-a.z)/chord,m={x:(a.x+b.x)/2,z:(a.z+b.z)/2};
  let nx=-dz,nz=dx;if((m.x-center.x)*nx+(m.z-center.z)*nz<0){nx=-nx;nz=-nz;}
  const h=shared/2;
  const points=[a,{x:a.x+nx*h,z:a.z+nz*h},{x:b.x+nx*h,z:b.z+nz*h},b];
  const parts=[];let bad=false;
  for(let j=0;j<3;j++){
   const line=wallStrokePlanV175([points[j],points[j+1]],'straight',100);
   if(line.error){bad=true;break;}
   for(const p of line.segments){const slot={...p,type:'palisade',plannedDefense:true,outerRingV184:true};
    if(!game.defenseTerrainPassableV177(city,slot.x,slot.z)||game.previewDefenseV177(city,slot).error){bad=true;break;}parts.push(slot);
   }if(bad)break;
  }
  if(bad||!parts.length)continue;
  const added=parts.reduce((s,p)=>s+dist(p.from,p.to),0),share=shared/(shared+added);
  if(share<.27||share>.39)continue;
  const score=Math.abs(share-1/3)+1/(shared*10);
  return {version:184,sharedLength:shared,newLength:added,sharedFraction:share,sharedArc:arc.map(({x,z})=>({x,z})),slots:parts,nextIndex:0,score};
 }
 return best;
}
