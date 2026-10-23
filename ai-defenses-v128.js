import {canAfford} from './economy.js';
import {combatUnit} from './ai-development-v128.js';
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
 const realm=city.economy.realms[team],stock=realm.resources;
 if(realm.pop<12||game.s.units.filter(u=>u.team===team&&combatUnit(u)).length<3)return;
 if(game.allBuildings(city).filter(b=>!b.ready&&b.hp>0).length>=2)return;
 const wall=!game.buildRule(city,'stonewall')?'stonewall':'palisade';
 const tower=!game.buildRule(city,'stonetower')?'stonetower':'watchtower';
 const plan=defenseLayout(wall,tower);city.defensePlanV128={kind:'perimeter',slots:plan.length,gateOpenings:2};
 const existing=city.economy.buildings.filter(b=>!b.virtual&&b.hp>0);
 for(const slot of plan){
  if(existing.some(b=>Math.hypot(b.x-slot.x,b.z-slot.z)<2))continue;
  if(game.buildRule(city,slot.type))continue;
  const cost=game.buildingDefinitions[slot.type].cost;
  const reserves={...stock,wood:Math.max(0,(stock.wood||0)-65),stone:Math.max(0,(stock.stone||0)-40),plank:Math.max(0,(stock.plank||0)-12)};
  if(!canAfford(reserves,cost))continue;
  const result=game.build(city,slot.type,{...slot,plannedDefense:true});
  if(result.building){result.building.plannedDefense=true;return;}
 }
}
