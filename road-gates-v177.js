import {roadCurve,worldToDetail} from './landscape-shared.js?v=123a';
import {roadLevel,roadStrength} from './roads.js?v=59';
import {wornStreetCellsV173,visibleTrailStrengthV173} from './living-streets-v173.js';
export function defenseRoadCellsV177(game,city){
 const parent=game.parentCity(city),out=[];
 for(const ctx of game.contexts(parent))for(const p of wornStreetCellsV173(ctx.world,game.s.time,4)){
  const b=ctx.world.navBounds,i=(p.z-b.minZ)*b.w+p.x-b.minX;
  out.push({x:p.x+(ctx.c-parent.c)*225,z:p.z+(ctx.r-parent.r)*195,strength:visibleTrailStrengthV173(ctx.world.heat[i],ctx.world.heatLast?.[i],game.s.time)});
 }
 // Strategic roads are distinct from local pedestrian wear. Sample the
 // same canonical world-road curve used by the renderer, in city coordinates.
 for(const ctx of game.contexts(parent))for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const tile=game.cell(ctx),other=game.cell({c:ctx.c+dc,r:ctx.r+dr});if(!tile||!other)continue;
  const heat=roadStrength(game.s,tile,other,game.s.time);if(!roadLevel(heat))continue;
  const points=roadCurve(game,tile,other,96);
  for(const point of points){const p=worldToDetail(tile,point.x,point.z);
   if(Math.abs(p.x)>112.5||Math.abs(p.z)>97.5)continue;
   out.push({x:p.x+(ctx.c-parent.c)*225,z:p.z+(ctx.r-parent.r)*195,strength:Math.max(13,heat),worldRoad:true});
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
