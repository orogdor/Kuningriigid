// Narrow line-of-wall collision check for mineral deposits.
// Unlike a building's wide 10x10-metre footprint, a 1-2m wide curtain
// leaves a mine accessible when it safely passes beside its extraction site.
export function clearOfDepositsV212(wall,resources){
 const span=wall.palisadeSpanV167||7,angle=wall.wallAngleV175??(wall.wallAxis?Math.PI/2:0);
 const c=Math.cos(angle),s=Math.sin(angle);
 return !(resources||[]).some(r=>{
  if(r.removed||['tree','berry','game','fish'].includes(r.kind))return false;
  const dx=r.x-wall.x,dz=r.z-wall.z;
  const along=dx*c-dz*s,across=dx*s+dz*c;
  const width=r.depositSite?4.2:2.9;
  return Math.abs(along)<span/2+2&&Math.abs(across)<width;
 });
}
