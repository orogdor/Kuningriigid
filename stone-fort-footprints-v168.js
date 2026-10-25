// V168: stable, pure footprint geometry for wooden village defenses.
// A long palisade blocks its *whole* span, not just its central 12m.
// This module is safe in the terrain, agriculture, and AI planners (no cycles).
export function fortFootprintV168(b){
 if(b.type==='palisade') {
  const half=(b.palisadeSpanV167|| (b.extendedPalisadeV166?14:7))/2;
  return b.wallAxis?{rx:1.5,rz:half}:{rx:half,rz:1.5};
 }
 if(b.type==='woodgate')return b.wallAxis?{rx:1.5,rz:b.extendedPalisadeV166?7.2:3.6}:
  {rx:b.extendedPalisadeV166?7.2:3.6,rz:1.5};
 if(b.type==='watchtower')return {rx:3.0,rz:3.0};
 return null;
}
export function ordinaryFootprintV168(b){
 if(b.type==='field')return {rx:(b.width??48)/2,rz:(b.depth??32)/2};
 if(b.type==='market')return {rx:11,rz:10.2};
 if(b.type==='hall')return {rx:5.6,rz:5};
 if(b.type==='house')return {rx:4,rz:3.6};
 if(b.type==='well')return {rx:3.2,rz:3.2};
 return {rx:5,rz:5};
}
export function footprintsCrossV168(a,b,pad=1.0){
 const af=fortFootprintV168(a),bf=ordinaryFootprintV168(b);
 if(!af||!bf)return false;
 return Math.abs(a.x-b.x)<af.rx+bf.rx+pad&&Math.abs(a.z-b.z)<af.rz+bf.rz+pad;
}
export function fieldCrossesWoodenRingV168(field,plan,pad=2){
 return !!plan?.slots?.some(slot=>footprintsCrossV168(slot,{...field,type:'field'},pad));
}
export function objectCrossesWoodenRingV168(b,plan,pad=1){
 return !!plan?.slots?.some(slot=>footprintsCrossV168(slot,b,pad));
}
