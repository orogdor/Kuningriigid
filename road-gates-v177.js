import {roadNetwork,worldToLocal} from './continuous-landscape.js?v=162a';
import {wornStreetCellsV173,visibleTrailStrengthV173} from './living-streets-v173.js';
export function defenseRoadCellsV177(game,city){
 const parent=game.parentCity(city),out=[];
 for(const ctx of game.contexts(parent))for(const p of wornStreetCellsV173(ctx.world,game.s.time,4)){
  const b=ctx.world.navBounds,i=(p.z-b.minZ)*b.w+p.x-b.minX;
  out.push({x:p.x+(ctx.c-parent.c)*225,z:p.z+(ctx.r-parent.r)*195,strength:visibleTrailStrengthV173(ctx.world.heat[i],ctx.world.heatLast?.[i],game.s.time)});
 }
 // Sample the identical road spline used to draw the highway. The AI may
 // know its own roads even when the human player has not explored them.
 const base=game.cell(parent),contexts=game.contexts(parent);
 for(const edge of roadNetwork(game,{includeUnseen:true})){
  if(!contexts.some(ctx=>[edge.a,edge.b].some(p=>Math.abs(p.c-ctx.c)<=1&&Math.abs(p.r-ctx.r)<=1)))continue;
  for(let i=1;i<edge.points.length;i++){
   const a=worldToLocal(base,edge.points[i-1].x,edge.points[i-1].z),b=worldToLocal(base,edge.points[i].x,edge.points[i].z);
   const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/2));
   for(let j=0;j<=n;j++){const t=j/n;out.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,strength:Math.max(13,edge.level*25),worldRoad:true});}
  }
 }
 return out;
}
export function roadCrossesWallV177(wall,roads){
 const a=wall.wallAngleV175??(wall.wallAxis?Math.PI/2:0),c=Math.cos(a),s=Math.sin(a);
 let left=false,right=false,nearLeft=false,nearRight=false,farLeft=false,farRight=false;
 for(const p of roads){
  if(p.strength<13)continue;
  const dx=p.x-wall.x,dz=p.z-wall.z,along=dx*c-dz*s,across=dx*s+dz*c;
  if(Math.abs(along)>3.5||Math.abs(across)<2.5||Math.abs(across)>11)continue;
  if(across<0){left=true;if(Math.abs(across)<=5)nearLeft=true;if(Math.abs(across)>=7)farLeft=true;}else{right=true;if(across<=5)nearRight=true;if(across>=7)farRight=true;}
 }
 return (left&&right)||(nearLeft&&farLeft)||(nearRight&&farRight);
}
export function planRoadGatesV177(game,city){
 if(!game.defenseBuildingsV177||game.s.time<(city.nextRoadGateV177||0))return false;
 city.nextRoadGateV177=game.s.time+24;
 const roads=defenseRoadCellsV177(game,city);if(!roads.length)return false;
 const existing=game.defenseBuildingsV177(city).filter(b=>['woodgate','gatehouse'].includes(b.type)&&b.hp>0);
 for(const wall of game.defenseBuildingsV177(city)){
  if(!['palisade','stonewall','reinforced_wall'].includes(wall.type)||!wall.ready||wall.hp<=0||!roadCrossesWallV177(wall,roads))continue;
  if(existing.some(g=>Math.hypot(g.x-wall.x,g.z-wall.z)<22))continue;
  const type=wall.type==='palisade'?'woodgate':'gatehouse';
  const stock=city.economy.realms[city.team].resources,cost=game.buildingDefinitions[type]?.cost;
  if(!cost||Object.entries(cost).some(([k,v])=>(stock[k]||0)<v+(k==='wood'?7:0)))continue;
  const ctx=game.contextAt({c:wall.contextC,r:wall.contextR},false),actual=ctx?.economy.buildings.find(b=>b.hp>0&&b.type===wall.type&&Math.hypot(b.x+(ctx.c-city.c)*225-wall.x,b.z+(ctx.r-city.r)*195-wall.z)<.1);
  if(!actual||game.s.units.some(u=>u.garrison&&u.garrison.c===ctx.c&&u.garrison.r===ctx.r&&Math.hypot(u.garrison.x-actual.x,u.garrison.z-actual.z)<.1))continue;
  const slot={type,x:wall.x,z:wall.z,wallAngleV175:wall.wallAngleV175??(wall.wallAxis?Math.PI/2:0),wallAxis:wall.wallAxis||0,plannedDefense:true};
  const hp=actual.hp;actual.hp=0;
  const result=game.buildDefenseV177(city,slot);
  if(!result.building){actual.hp=hp;game.nav(ctx).rebuild();continue;}
  actual.disabled=true;actual.replacedByRoadGateV177=true;
  for(const plan of [city.stoneDefensePlanV166,city.defensePlanV139]){
   const index=plan?.slots?.findIndex(s=>s.type===wall.type&&Math.hypot(s.x-wall.x,s.z-wall.z)<1)??-1;
   if(index>=0){plan.slots[index]=slot;plan.gates??=[];plan.gates.push(slot);plan.gateOpenings=plan.gates.length;}
  }
  result.building.historicPalisadeV166=true;
  city.aiRoadGateV177={at:game.s.time,x:slot.x,z:slot.z,type};
  return true;
 }
 return false;
}
