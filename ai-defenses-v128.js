import {canAfford} from './economy.js';
import {combatUnit} from './ai-development-v128.js';
import {ancientWallPlan,surplusForWalls,reserveAfterWalls} from './ancient-walls-v139.js';
export const DEFENSE_TYPES=new Set(['palisade','stonewall','reinforced_wall','gatehouse','watchtower','stonetower']);
export function defenseLayout(wall='palisade',tower='watchtower'){
 const plan=[];
 for(const z of [-38.5,38.5])for(let x=-49;x<=49;x+=7)if(x!==0)plan.push({type:wall,x,z,wallAxis:0});
 for(const x of [-52.5,52.5])for(let z=-35;z<=35;z+=7)plan.push({type:wall,x,z,wallAxis:1});
 for(const x of [-52.5,52.5])for(const z of [-38.5,38.5])plan.push({type:tower,x,z,wallAxis:0});
 return [{type:'gatehouse',x:0,z:38.5,wallAxis:0},{type:'gatehouse',x:0,z:-38.5,wallAxis:0},...plan];
}
export function planAIDefenses(game,team,city){
 if(game.s.time<(city.nextDefenseCheckV128||0))return;
 city.nextDefenseCheckV128=game.s.time+60;
 const realm=city.economy.realms[team],stock=realm.resources,waiting=game.allBuildings(city).filter(b=>b.hp>0&&!b.ready).length;
 // Civic services and food reserves must be operating before fortifying.
 const all=game.allBuildings(city);
 const residents=all.filter(b=>b.type==='house'&&b.ready&&b.hp>0).length;
 const services=all.filter(b=>['well','market','warehouse','study','scriptorium'].includes(b.type)&&b.ready&&b.hp>0).length;
 if(residents<5||services<2||!surplusForWalls(stock,realm.pop,waiting))return;
 const local=city.economy.buildings.filter(b=>!b.virtual&&b.hp>0);
 // Store the initial historical old-town perimeter in the save; it must not
 // move with each added house. Outer suburbs may grow beyond these walls.
 if(!city.defensePlanV139){
  const wall=game.buildRule(city,'stonewall')?'palisade':'stonewall';
  const tower=game.buildRule(city,'stonetower')?'watchtower':'stonetower';
  const ring=ancientWallPlan(local,wall,tower,game.s.seed+city.id*19);
  city.defensePlanV139={version:139,kind:'historic-core',...ring,nextIndex:0,constructed:0};
 }
 const plan=city.defensePlanV139;
 city.defensePlanV128={kind:plan.kind,slots:plan.slots.length,gateOpenings:plan.gateOpenings};
 // Medieval gatehouses can replace the earlier passable Bronze Age openings.
 // Do not fill a Bronze entrance with an impassable wooden wall.
 const candidates=[...plan.slots];
 if(game.s.ages[team]>=3)for(const z of [-plan.rz,plan.rz])candidates.push({type:'gatehouse',x:0,z,wallAxis:0});
 const tried=candidates.length;
 for(let i=0;i<tried;i++){
  const n=(plan.nextIndex+i)%tried,slot=candidates[n];
  if(local.some(b=>b.type===slot.type&&Math.hypot(b.x-slot.x,b.z-slot.z)<3))continue;
  if(local.some(b=>['house','market','warehouse','study','scriptorium','well','cellar'].includes(b.type)&&Math.abs(b.x-slot.x)<9&&Math.abs(b.z-slot.z)<9))continue;
  if(game.buildRule(city,slot.type))continue;
  const cost=game.buildingDefinitions[slot.type]?.cost||{};
  if(!canAfford(stock,cost)||!reserveAfterWalls(stock,cost))continue;
  const result=game.build(city,slot.type,{...slot,plannedDefense:true});
  if(result.building){
   result.building.plannedDefense=true;
   result.building.historicPerimeterV139=true;
   plan.constructed++;
   plan.nextIndex=(n+1)%tried;
   return;
  }
 }
}
