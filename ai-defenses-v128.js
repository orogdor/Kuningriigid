import {findOuterRingV184} from './outer-ring-v184.js?v=193';
import {planRoadGatesV177} from './road-gates-v177.js';
import {terrainDefensePlanV176} from './terrain-defenses-v176.js';
import {canAfford} from './economy.js';
import {planStoneVillageDefenses} from './stone-village-defenses-v166.js?v=169a';
import {combatUnit} from './ai-development-v128.js';
import {ancientWallPlan,surplusForWalls,reserveAfterWalls} from './ancient-walls-v139.js';
import {BRONZE_FORTIFY_POP_V160,BRONZE_FULL_WALL_POP_V160} from './bronze-city-balance-v160.js';

export const DEFENSE_TYPES=new Set(['palisade','woodgate','stonewall','reinforced_wall','gatehouse','watchtower','stonetower']);
// Keep the old export for battle scenes and saved projects.
export function defenseLayout(wall='palisade',tower='watchtower'){
 const plan=[];
 for(const z of [-38.5,38.5])for(let x=-49;x<=49;x+=7)if(x!==0)plan.push({type:wall,x,z,wallAxis:0});
 for(const x of [-52.5,52.5])for(let z=-35;z<=35;z+=7)plan.push({type:wall,x,z,wallAxis:1});
 for(const x of [-52.5,52.5])for(const z of [-38.5,38.5])plan.push({type:tower,x,z,wallAxis:0});
 return [{type:'gatehouse',x:0,z:38.5,wallAxis:0},{type:'gatehouse',x:0,z:-38.5,wallAxis:0},...plan];
}
const defendedTypes=DEFENSE_TYPES;
const readyBuilding=(all,type)=>all.some(b=>b.type===type&&b.ready&&b.hp>0&&!b.disabled);
function firstMasonryWorkshop(game,team,city,all,stock){
 const age=game.s.ages?.[team]||0,known=game.s.research?.[team]?.known||[];
 if(age<1||!known.includes('stone_fortifications')||readyBuilding(all,'mason')||
    all.some(b=>b.type==='mason'&&b.hp>0)||!game.canBuildNow||!game.buildingSites)return false;
 if(!game.canBuildNow(city,'mason'))return false;
 const cost=game.buildingDefinitions.mason.cost;
 if((stock.wood||0)<(cost.wood||0)+7||(stock.stone||0)<(cost.stone||0)+8)return false;
 // Do not synthesize a workshop: use actual placement and resource transactions.
 for(const position of game.buildingSites(city,'mason').slice(0,180)){
  if(game.previewBuild(city,'mason',position).error)continue;
  const built=game.build(city,'mason',position);
  if(built.building){city.aiDefenseDiagnosticV147={reason:'mason-commissioned',at:game.s.time};return true;}
 }
 city.aiDefenseDiagnosticV147={reason:'no-mason-site',at:game.s.time};return false;
}

// One short defensive construction window per town; preserve historical
// street infill and agriculture during material/labour shortages.
export function defenseEligibility({population,readyHouses,services,waiting,stock}){
 const reason=population<11?'population':readyHouses<4?'housing':services<2?'services':
  waiting>3?'construction-backlog':
  !surplusForWalls(stock,population,waiting)?'insufficient-surplus':null;
 return {ok:reason===null,reason};
}
export function planWallUpgradesV184(game,team,city){
 const age=game.s.ages[team],realm=city.economy.realms[team],known=game.s.research[team]?.known||[];
 if(!game.wallUpgradeOptionsV184||realm.pop<11||age===0)return false;
 if(!known.includes('stone_fortifications'))return false;
 // V188: do not replace timber with stone while a new outer curtain is pending.
 const allForPriority=game.allBuildings(city),outer=city.outerRingV184;
 const outerPending=outer?.slots?.length&&((outer.nextIndex||0)<outer.slots.length||
   allForPriority.some(b=>b.outerRingV184&&b.hp>0&&!b.ready));
 const innerBuilding=allForPriority.some(b=>b.hp>0&&!b.ready&&!b.outerRingV184&&DEFENSE_TYPES.has(b.type));
 const surveying=!outer&&(city.outerRingSurveyFailuresV188||0)>0&&(city.outerRingSurveyFailuresV188||0)<3;
 if(realm.pop>=20&&(outerPending||innerBuilding||surveying))return false;
 const contexts=game.contexts(city),forts=contexts.flatMap(ctx=>ctx.economy.buildings.filter(b=>!b.virtual&&b.hp>0&&b.ready&&['palisade','woodgate','watchtower'].includes(b.type)).map(b=>({ctx,b})));
 if(!forts.length)return false;
 if(contexts.some(ctx=>ctx.economy.buildings.some(b=>b.wallUpgradeV184)))return true;
 const waiting=game.allBuildings(city).filter(b=>b.hp>0&&!b.ready).length;
 const stock=realm.resources;
 if(!defenseEligibility({population:realm.pop,readyHouses:game.allBuildings(city).filter(b=>b.type==='house'&&b.ready&&b.hp>0).length,services:game.allBuildings(city).filter(b=>['well','market','warehouse','study','scriptorium'].includes(b.type)&&b.ready&&b.hp>0).length,waiting,stock}).ok)return false;
 for(const {ctx,b} of forts){
  const plan=game.wallUpgradeOptionsV184(ctx,b,'stone');if(plan.error)continue;
  if(!canAfford(stock,plan.cost)||!reserveAfterWalls(stock,plan.cost)){city.aiDefenseDiagnosticV184={reason:'saving-for-upgrade',type:b.type,at:game.s.time};return true;}
  const result=game.upgradeWallV184(ctx,b,'stone');if(result.upgrade){city.aiDefenseDiagnosticV184={reason:'upgrading',type:b.type,at:game.s.time};return true;}
 }
 return false;
}
export function planOuterRingV184(game,team,city){
 const realm=city.economy.realms[team],stock=realm.resources;
 if((game.s.ages[team]||0)<1||realm.pop<20)return false;
 const all=game.allBuildings(city);
 // Finish any legacy paid upgrade; never commission a new one ahead of a ring.
 if(all.some(b=>b.wallUpgradeV184))return false;
 const inner=city.stoneDefensePlanV166||city.defensePlanV139;
 if(!inner?.slots?.length)return false;
 const existing=city.outerRingV184;
 const pending=!!(existing?.slots?.length&&((existing.nextIndex||0)<existing.slots.length||
   all.some(b=>b.outerRingV184&&b.hp>0&&!b.ready)));
 const stalled=reason=>{
  if(pending)city.outerRingDiagnosticV184={reason,index:existing.nextIndex||0,total:existing.slots.length,at:game.s.time};
  return pending; // avoid spending materials on stone upgrades while an outer ring waits
 };
 if(all.some(b=>b.hp>0&&!b.ready&&!b.outerRingV184&&DEFENSE_TYPES.has(b.type)))return stalled('inner-wall-building');
 if(all.filter(b=>!b.ready&&b.hp>0&&DEFENSE_TYPES.has(b.type)).length>=2)return stalled('construction-backlog');
 if(!surplusForWalls(stock,realm.pop,all.filter(b=>b.hp>0&&!b.ready).length))return stalled('saving-for-outer-ring');
 if(!city.outerRingV184){
  if(game.s.time<(city.nextOuterSurveyV184||0))return false;
  city.nextOuterSurveyV184=game.s.time+600;
  const plan=findOuterRingV184(game,city);
  if(!plan){
   city.outerRingSurveyFailuresV188=(city.outerRingSurveyFailuresV188||0)+1;
   city.outerRingDiagnosticV184={reason:'no-viable-outer-site',failures:city.outerRingSurveyFailuresV188,at:game.s.time};
   return false; // after 3 unsuccessful surveys, allow upgrades as a fallback
  }
  city.outerRingSurveyFailuresV188=0;
  city.outerRingV184=plan;
 }
 const plan=city.outerRingV184;
 while(plan.nextIndex<plan.slots.length){
  const slot=plan.slots[plan.nextIndex],cost=game.buildingDefinitions[slot.type].cost;
  if(!canAfford(stock,cost)||!reserveAfterWalls(stock,cost))return true;
  const result=game.buildDefenseV177(city,slot);
  if(!result.building){city.outerRingDiagnosticV184={reason:result.error||'site-blocked',index:plan.nextIndex,at:game.s.time};return true;}
  Object.assign(result.building,{outerRingV184:true,plannedDefense:true});plan.nextIndex++;
  city.outerRingDiagnosticV184={reason:'building',index:plan.nextIndex,total:plan.slots.length,at:game.s.time};return true;
 }
 const unfinished=game.allBuildings(city).some(b=>b.outerRingV184&&b.hp>0&&!b.ready);
 if(unfinished){city.outerRingDiagnosticV184={reason:'finishing',total:plan.slots.length,at:game.s.time};return true;}
 city.outerRingDiagnosticV184={reason:'complete',total:plan.slots.length,at:game.s.time};return false;
}
export function planAIDefenses(game,team,city){
 if(planRoadGatesV177(game,city))return;
 if(planStoneVillageDefenses(game,team,city))return;
 if(planOuterRingV184(game,team,city))return;
 if(planWallUpgradesV184(game,team,city))return;
 if(game.s.time<(city.nextDefenseCheckV128||0))return;
 const realm=city.economy.realms[team],stock=realm.resources,all=game.allBuildings(city);
 city.nextDefenseCheckV128=game.s.time+(realm.pop>=BRONZE_FORTIFY_POP_V160?24:42);
 const waiting=all.filter(b=>b.hp>0&&!b.ready).length;
 const readyHouses=all.filter(b=>b.type==='house'&&b.ready&&b.hp>0).length;
 const services=all.filter(b=>['well','market','warehouse','study','scriptorium'].includes(b.type)&&b.ready&&b.hp>0).length;
 // Resource-chain dependency must be built before any stone-wall plan.
 if(realm.pop>=11&&readyHouses>=4&&services>=2&&waiting<=3&&
    (stock.water||0)>=realm.pop*1.1&&
    (stock.meat||0)+(stock.fish||0)+(stock.grain||0)+(stock.bread||0)+(stock.berries||0)>=realm.pop*1.6&&
    firstMasonryWorkshop(game,team,city,all,stock))return;
 const eligibility=defenseEligibility({population:realm.pop,readyHouses,services,waiting,stock});
 if(!eligibility.ok){city.aiDefenseDiagnosticV146={reason:eligibility.reason,checkedAt:game.s.time};return;}
 // Do not fill an entire city construction queue with decorative walls.
 const existing=all.filter(b=>defendedTypes.has(b.type)&&b.hp>0);
 // Larger cities can fund up to two real building sites, not free fortifications.
 if(existing.filter(b=>!b.ready).length>=(realm.pop>=BRONZE_FORTIFY_POP_V160?2:1)){
  city.aiDefenseDiagnosticV146={reason:'wall-being-built',checkedAt:game.s.time};return;
 }
 const local=(game.defenseBuildingsV177?.(city)||city.economy.buildings).filter(b=>!b.virtual&&b.hp>0);
 if(!city.defensePlanV139||(city.defensePlanV139.version<176&&!city.defensePlanV139.terrainSurveyV176&&!local.some(b=>b.historicPerimeterV139||b.historicPalisadeV166))){
  // The entire ring is fixed at the time of first fortification.
  const available=id=>!game.buildRule(city,id);
  const wall=available('stonewall')?'stonewall':'palisade';
  const tower=available('stonetower')?'stonetower':'watchtower';
  const ring=terrainDefensePlanV176(game,city,local,game.s.seed+city.id*19,{wall,tower})||ancientWallPlan(local,wall,tower,game.s.seed+city.id*19);
  city.defensePlanV139={version:ring.version||146,kind:'historic-core',...ring,terrainSurveyV176:true,nextIndex:0,constructed:0};
 }
 const plan=city.defensePlanV139;
 city.defensePlanV128={kind:plan.kind,slots:plan.slots.length,gateOpenings:plan.gateOpenings};
 // Build an actual wall before requiring its towers or gatehouses.
 // A Bronze palisade planned early may be obsolete by Medieval Age.
 // Keep the geometry and saved ring, but adapt each unbuilt segment to the
 // currently legal material/tower tier.
 const effective=slot=>{
  const upgrade={palisade:'stonewall',watchtower:'stonetower'};
  const later=upgrade[slot.type];
  return later&&!game.buildRule(city,later)?{...slot,type:later}:slot;
 };
 const slots=plan.slots.map(effective);
 const walls=slots.filter(s=>!['stonetower','watchtower','woodgate','gatehouse'].includes(s.type));
 const towers=slots.filter(s=>['stonetower','watchtower'].includes(s.type));
 const hasReadyStone=readyBuilding(local,'stonewall');
 const gates=game.s.ages[team]>=1&&hasReadyStone?(plan.gates||[
  {type:'gatehouse',x:0,z:-plan.rz,wallAxis:0},
  {type:'gatehouse',x:0,z:plan.rz,wallAxis:0},
  {type:'gatehouse',x:-plan.rx,z:0,wallAxis:1},
  {type:'gatehouse',x:plan.rx,z:0,wallAxis:1}
 ]):[];
 const candidates=hasReadyStone&&realm.pop>=BRONZE_FORTIFY_POP_V160?[...gates,...walls,...towers]:[...walls,...towers];
 const wallCost=game.buildingDefinitions.stonewall?.cost||{};
 if(!hasReadyStone&&game.s.research?.[team]?.known?.includes('stone_fortifications')&&
    !canAfford(stock,wallCost))city.aiImportRequestsV128={
  ...(city.aiImportRequestsV128||{}),
  ...Object.fromEntries(Object.entries(wallCost).filter(([k,v])=>(stock[k]||0)<v+12).map(([k,v])=>[k,v+12]))
 };
 const reasons={};
 const viable=candidates.filter(slot=>{
  if(local.some(b=>defendedTypes.has(b.type)&&Math.hypot(b.x-slot.x,b.z-slot.z)<(slot.drawnWallV175?1:5))){reasons.alreadyBuilt=(reasons.alreadyBuilt||0)+1;return false;}
  if(local.some(b=>['house','market','warehouse','study','scriptorium','well','cellar','hall'].includes(b.type)&&Math.abs(b.x-slot.x)<9&&Math.abs(b.z-slot.z)<9)){reasons.overlapsCore=(reasons.overlapsCore||0)+1;return false;}
  const locked=game.buildRule(city,slot.type);if(locked){reasons.locked=(reasons.locked||0)+1;city.aiDefenseLockedReasonV146=String(locked);return false;}
  const cost=game.buildingDefinitions[slot.type]?.cost||{};
  if(!canAfford(stock,cost)||!reserveAfterWalls(stock,cost)){reasons.materials=(reasons.materials||0)+1;return false;}
  return true;
 });
 for(let i=0;i<Math.min(32,viable.length);i++){
  const n=((plan.nextIndex||0)+i)%viable.length,slot=viable[n];
  const preview=game.previewDefenseV177?game.previewDefenseV177(city,slot):game.previewBuild(city,slot.type,slot);
  if(preview.error){reasons.site=(reasons.site||0)+1;continue;}
  const result=game.buildDefenseV177?game.buildDefenseV177(city,{...slot,plannedDefense:true}):game.build(city,slot.type,{...slot,plannedDefense:true});
  if(!result.building){reasons.build=(reasons.build||0)+1;continue;}
  result.building.plannedDefense=true;
  result.building.historicPerimeterV139=true;
  plan.constructed=(plan.constructed||0)+1;
  plan.nextIndex=(n+1)%Math.max(1,viable.length);
  city.aiDefenseDiagnosticV146={reason:'built',type:slot.type,checkedAt:game.s.time};
  city.aiDefenseDiagnosticV147={reason:'built',type:slot.type,at:game.s.time};
  city.aiDefenseDiagnosticV160={reason:'built',type:slot.type,at:game.s.time,
   candidateForFullRing:realm.pop>=BRONZE_FULL_WALL_POP_V160};
  return;
 }
 const reason=Object.entries(reasons).sort((a,b)=>b[1]-a[1])[0]?.[0]||'no-eligible-sites';
 city.aiDefenseDiagnosticV146={reason,reasons,checkedAt:game.s.time};
}
