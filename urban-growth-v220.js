// V220: one deterministic plan governs AI home renovation, dense infill,
// and organic suburbs. This module only evaluates the physical game state.
import {insideOldRingV218} from './old-fortification-policy-v218.js';
const urban=new Set(['house','market','well','study','school','warehouse','cellar','library','inn','scriptorium']);
export function urbanGrowthPhaseV220(parent,age=0){
 const outline=parent?.stoneDefensePlanV166?.outlineV176||parent?.defensePlanV139?.outlineV176||[];
 const homes=(parent?.economy?.buildings||[]).filter(b=>b.type==='house'&&b.hp>0&&!b.virtual);
 const inside=outline.length>=3?homes.filter(b=>insideOldRingV218(b,outline)):homes;
 const upgrades=inside.filter(b=>(b.houseUpgradeLevelV218||0)>=1).length;
 const pop=parent?.economy?.realms?.[parent.team]?.pop||0;
 let phase='core';
 if(age>=1&&outline.length>=8&&inside.length>=8&&pop>=20){
  const aim=Math.min(3,Math.floor(inside.length/3));
  // Only hold expansion for 3 affordable upgrades, never block growth
  // indefinitely if there are no eligible houses or the city is large.
  phase=upgrades<aim&&pop<28?'renovate':'suburb';
 }
 if(parent?.outerRingDiagnosticV184?.reason==='complete')phase='fortified-suburb';
 return {phase,pop,coreHouses:inside.length,upgradedHouses:upgrades,outlineReady:outline.length>=8,
  aim:Math.min(3,Math.floor(inside.length/3))};
}
export function orderedHousingContextScoreV220(parent,ctx,phase,base=0){
 if(phase!=='suburb'&&phase!=='fortified-suburb')return base;
 const center=(ctx.c===parent.c&&ctx.r===parent.r);
 if(center)return phase==='fortified-suburb'?12:65;
 const blocks=(ctx.economy?.buildings||[]).filter(b=>b.hp>0&&!b.virtual&&urban.has(b.type)).length;
 const dist=Math.abs(ctx.c-parent.c)+Math.abs(ctx.r-parent.r);
 const added=ctx.expandV138?35:0;
 // Prefer an existing adjacent urban block: avoid isolated random hamlets.
 return 13+12*dist-3*Math.min(blocks,8)+added;
}
export function densityGroupsV220(points,radius=62){
 const groups=[],seen=new Set();
 for(let i=0;i<points.length;i++){
  if(seen.has(i))continue;
  const stack=[i],group=[];seen.add(i);
  while(stack.length){const id=stack.pop(),p=points[id];group.push(p);
   for(let j=0;j<points.length;j++)if(!seen.has(j)&&Math.hypot(p.x-points[j].x,p.z-points[j].z)<=radius){
    seen.add(j);stack.push(j);
   }
  }
  groups.push(group);
 }
 return groups.sort((a,b)=>b.length-a.length);
}
