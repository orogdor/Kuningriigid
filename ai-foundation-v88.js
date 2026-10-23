import {foodTotal} from './city-needs-v87.js';
import {BUILDINGS} from './economy.js';
// A small, explicit foundation. Optional industries never spend the last
// materials reserved for the first available link in this chain.
export const FOUNDATION_TYPES=new Set(['well','hunter','fisher','lumber','quarry','saw','house','study','mine','coal','smelter','smith','farm','pasture','forester','bronze_foundry','coppermine','tinmine']);
export function foundationNeeds(game,city){
 const buildings=game.allBuildings(city),known=game.s.research[city.team]?.known||[],age=game.s.ages[city.team];
 const has=type=>buildings.some(b=>b.type===type&&b.hp>0&&!b.disabled);
 const needs=[];
 const add=type=>{if(!has(type)&&BUILDINGS[type]&&!game.buildRule(city,type))needs.push(type);};
 add('well');add('lumber');
 if(!['hunter','fisher','farm','pasture','bakery'].some(has)){
  const types=['hunter','fisher','farm'].filter(type=>!game.buildRule(city,type));if(types.length)needs.push(types[0]);
 }
 add('quarry');
 if(!has('house'))add('house');
 if(known.includes('woodworking'))add('saw');
 add(game.obsoleteBuilding?.(city.team,'study')||'study');
 if(age>=2){add('mine');add('coal');if(known.includes('smelting'))add('smelter');}
 return needs;
}
export function reservesFoundation(game,city,type){
 const missing=foundationNeeds(game,city);
 if(!missing.length||missing.includes(type))return false;
 // Emergency additional housing/food/water remains possible. Side branches,
 // fortifications and luxury buildings must wait for a functioning foundation.
 const realm=city.economy.realms[city.team],buildings=game.allBuildings(city);
 if(['hunter','fisher','farm'].includes(type)&&foodTotal(realm.resources)<realm.pop*3)return false;
 if(type==='well'&&(realm.resources.water||0)<realm.pop*2)return false;
 if(type==='house'&&realm.pop>=4+1.5*buildings.filter(b=>b.type==='house'&&b.ready&&b.hp>0).length-1)return false;
 const stock=city.economy.realms[city.team].resources,cost=BUILDINGS[type]?.cost||{};
 // The first masonry workshop and defenders are necessities for a prosperous
 // Bronze/Medieval town, not optional luxury. Never consume emergency stores.
 const activeHomes=buildings.filter(b=>b.type==='house'&&b.ready&&b.hp>0).length;
 const hasMarket=buildings.some(b=>b.type==='market'&&b.ready&&b.hp>0);
 if(['mason','barracks'].includes(type)&&game.s.ages[city.team]>=1&&realm.pop>=11&&
    activeHomes>=4&&hasMarket&&foodTotal(stock)>=realm.pop*3&&
    (stock.water||0)>=realm.pop*1.5&&
    (stock.wood||0)-(cost.wood||0)>=23&&
    (stock.stone||0)-(cost.stone||0)>=18)return false;
 // A growing Bronze/Medieval town may fund its first market without
 // dismantling the remaining wood/stone reserve needed for survival.
 if(type==='market'&&game.s.ages[city.team]>=1&&realm.pop>=5&&
    !buildings.some(b=>b.type==='market'&&b.hp>0)&&
    (stock.wood||0)>=Math.max(80,(cost.wood||0)+30)&&
    (stock.stone||0)>=Math.max(40,(cost.stone||0)+15))return false;
 return missing.some(need=>Object.entries(BUILDINGS[need].cost).some(([key,n])=>(stock[key]||0)-(cost[key]||0)<n));
}
