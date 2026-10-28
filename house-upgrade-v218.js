import {insideOldRingV218} from './old-fortification-policy-v218.js';
export function houseInUpgradeZoneV218(parent,ctx,b,age){
 if(!parent||!ctx||b?.type!=='house'||ctx.c!==parent.c||ctx.r!==parent.r)return false;
 if(age>=4)return true;
 return insideOldRingV218(b,parent.stoneDefensePlanV166?.outlineV176||parent.defensePlanV139?.outlineV176);
}
export function houseUpgradeCostV218(cost){
 return Object.fromEntries(Object.entries(cost||{}).filter(([,v])=>v>0).map(([k,v])=>[k,Math.ceil(v*.5)]));
}
export function houseUpgradePreviewV218(game,ctx,b){
 if(!ctx||!b||b.type!=='house'||b.hp<=0||!b.ready||b.virtual||
  b.houseUpgradeLevelV218>=1||!ctx.economy?.buildings?.includes(b))
  return {error:'Seda elamut ei saa enam täiustada.'};
 const parent=game.parentCity(ctx),age=game.s.ages[ctx.team]||0;
 if(!houseInUpgradeZoneV218(parent,ctx,b,age))
  return {error:age>=4?'Elamu peab asuma peamaja ruudul.':
  'Enne renessanssi saab täiustada ainult vana linnamüüri sees olevaid elamuid.'};
 return {cost:houseUpgradeCostV218(game.buildingDefinitions?.house?.cost||{}),capacityMultiplier:2,level:1};
}
