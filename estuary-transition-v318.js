// V318: Dedicated visual-only river-mouth transition. No drainage/gameplay changes.
// Every estuary blends according to distance ALONG its last river reach, not
// terrain height (which can stay above sea level inside an excavated river bed).
export function estuaryOpacityV318(x,z,mouths){
 let fade=1;
 for(const m of mouths){
  const dx=x-m.start.x,dz=z-m.start.z;
  const along=dx*m.dirX+dz*m.dirZ;
  const lateral=Math.abs(-dx*m.dirZ+dz*m.dirX);
  if(lateral>m.radius||along<0)continue;
  const start=Math.max(0,m.length-m.fadeLength);
  const t=Math.max(0,Math.min(1,(along-start)/Math.max(.01,m.length-start)));
  const f=1-t*t*(3-2*t);
  fade=Math.min(fade,f);
 }
 return fade;
}
export function estuaryMouthsV318(edges){
 const mouths=[];
 for(const edge of edges){
  if(edge.to.land||edge.points.length<2)continue;
  const start=edge.points[0],end=edge.points.at(-1);
  const dx=end.x-start.x,dz=end.z-start.z,length=Math.hypot(dx,dz);
  if(length<.01)continue;
  const width=Math.max(...edge.points.map(p=>p.width));
  mouths.push({start,dirX:dx/length,dirZ:dz/length,length,
   fadeLength:Math.min(34,length*.85),radius:Math.max(14,width*1.8)});
 }
 return mouths;
}
