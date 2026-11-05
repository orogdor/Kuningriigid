// Geometry only. No terrain imports: the coast is located once from the
// undisturbed landscape, before either water or the channel is constructed.
export const SEA_LEVEL_V324=.72;
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export function buildEstuariesV324(edges,height){
 const byEnd=new Map(),zones=[];
 for(const e of edges){const list=byEnd.get(e.to)||[];list.push(e);byEnd.set(e.to,list);}
 for(const edge of edges){
  if(edge.to.land||edge.points.length<2)continue;
  let points=edge.points.map(p=>({...p})),prior=edge,guard=0;
  while(guard++<4){
   const incoming=(byEnd.get(prior.c)||[]).sort((a,b)=>(b.c.riverFlow||0)-(a.c.riverFlow||0))[0];
   if(!incoming)break;
   points=[...incoming.points.slice(0,-1),...points];prior=incoming;
  }
  const last=points.at(-1),before=points.at(-2),len=Math.hypot(last.x-before.x,last.z-before.z)||1;
  const ux=(last.x-before.x)/len,uz=(last.z-before.z)/len;
  // A submerged continuation prevents a round closed river cap at the coast.
  for(let d=3;d<=45;d+=3)points.push({x:last.x+ux*d,z:last.z+uz*d,width:last.width});
  const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].z-points[i-1].z));
  let coast=-1;
  for(let i=1;i<points.length;i++)if(height(points[i-1].x,points[i-1].z)>SEA_LEVEL_V324&&height(points[i].x,points[i].z)<=SEA_LEVEL_V324){
   const a=points[i-1],b=points[i];let lo=0,hi=1;
   for(let k=0;k<16;k++){const t=(lo+hi)/2;if(height(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t)>SEA_LEVEL_V324)lo=t;else hi=t;}
   coast=lengths[i-1]+(lengths[i]-lengths[i-1])*(lo+hi)/2;break;
  }
  if(coast<0)continue;
  const start=Math.max(0,coast-42),end=Math.min(lengths.at(-1),coast+28),segments=[];
  const width= Math.max(2,edge.c.riverWidth||3);
  for(let i=1;i<points.length;i++){
   if(lengths[i]<start||lengths[i-1]>end)continue;
   segments.push({a:points[i-1],b:points[i],s:lengths[i-1]-coast,len:lengths[i]-lengths[i-1]});
  }
  const xs=segments.flatMap(s=>[s.a.x,s.b.x]),zs=segments.flatMap(s=>[s.a.z,s.b.z]);
  zones.push({segments,width,coast,start:start-coast,end:end-coast,
   minX:Math.min(...xs)-width*5-12,maxX:Math.max(...xs)+width*5+12,
   minZ:Math.min(...zs)-width*5-12,maxZ:Math.max(...zs)+width*5+12});
 }
 return zones;
}
export function sampleEstuaryV324(zones,x,z){
 let best=null,score=Infinity;
 for(const zone of zones){
  if(x<zone.minX||x>zone.maxX||z<zone.minZ||z>zone.maxZ)continue;
  for(const seg of zone.segments){
   const dx=seg.b.x-seg.a.x,dz=seg.b.z-seg.a.z,l2=dx*dx+dz*dz||1;
   const t=clamp(((x-seg.a.x)*dx+(z-seg.a.z)*dz)/l2),along=seg.s+seg.len*t;
   const distance=Math.hypot(x-seg.a.x-dx*t,z-seg.a.z-dz*t);
   const progress=smooth((along+32)/52),width=zone.width*(1+.85*progress);
   if(distance-width>=score)continue;
   const upstream=smooth((along-zone.start)/14),downstream=1-smooth((along-12)/Math.max(1,zone.end-12));
   const influence=upstream*downstream*(1-smooth((distance-width)/(width*.65+4)));
   const terrainInfluence=upstream*downstream*(1-smooth((distance-width)/(width*2+10)));
   if(terrainInfluence<=0)continue;
   score=distance-width;
   best={distance,width,along,influence,terrainInfluence,settle:upstream*(1-smooth((distance-width)/(width+6))),
    seaMix:smooth((along+32)/50),depth:2.2+1.3*progress};
  }
 }
 return best;
}
export function estuaryBedV324(natural,level,sample){
 if(!sample)return natural;
 // Smooth bowl, not an extruded ribbon or an elevated coastal levee.
 const cross=smooth(sample.distance/Math.max(.1,sample.width));
 const channel=level-sample.depth*(1-cross)+.10*cross;
 return natural+(Math.min(natural,channel)-natural)*sample.influence;
}
