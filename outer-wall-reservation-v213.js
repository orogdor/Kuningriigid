// V213 – reserve *unbuilt* planned outer curtain against later AI infill.
// Existing stone/wood fortifications are handled by physical placement rules.
// The reserver never demolishes or creates anything.
export function blocksFutureOuterWallV213(parent,p,type,tileOffset={x:0,z:0}){
 if(!parent?.outerRingV184?.slots?.length||!p||!Number.isFinite(p.x)||!Number.isFinite(p.z))return false;
 const isFort=['palisade','stonewall','reinforced_wall','woodgate','gatehouse','watchtower','stonetower'].includes(type);
 if(isFort||type==='bridge')return false;
 const world={x:p.x+(tileOffset.x||0),z:p.z+(tileOffset.z||0)};
 const footprint=type==='market'?11:type==='field'?10:['hall','warehouse','barracks'].includes(type)?7:5.5;
 const slots=parent.outerRingV184.slots;
 // Only reserve unstarted pieces; completed stonework already has collision.
 for(let i=Math.max(0,parent.outerRingV184.nextIndex||0);i<slots.length;i++){
  const slot=slots[i],ang=slot.wallAngleV175??0,span=slot.palisadeSpanV167||7;
  const c=Math.cos(ang),s=Math.sin(ang);
  const dx=world.x-slot.x,dz=world.z-slot.z;
  const along=dx*c-dz*s,across=dx*s+dz*c;
  if(Math.abs(along)<=span/2+footprint&&Math.abs(across)<=footprint+2)return true;
 }
 return false;
}
