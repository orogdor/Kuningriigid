import {canAfford} from './economy.js';
import {combatUnit} from './ai-development-v128.js';
import {ancientWallPlan,surplusForWalls,reserveAfterWalls} from './ancient-walls-v139.js';
import {BRONZE_FORTIFY_POP_V160,BRONZE_FULL_WALL_POP_V160} from './bronze-city-balance-v160.js';

export const DEFENSE_TYPES=new Set(['palisade','stonewall','reinforced_wall','gatehouse','watchtower','stonetower']);
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
 if((stock.wood||0)<(cost.wood||0)+20||(stock.stone||0)<(cost.stone||0)+18)return false;
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
export function planAIDefenses(game,team,city){
 if(game.s.time<(city.nextDefenseCheckV128||0))return;
 const realm=city.economy.realms[team],stock=realm.resources,all=game.allBuildings(city);
 city.nextDefenseCheckV128=game.s.time+(realm.pop>=BRONZE_FORTIFY_POP_V160?24:42);
 const waiting=all.filter(b=>b.hp>0&&!b.ready).length;
 const readyHouses=all.filter(b=>b.type==='house'&&b.ready&&b.hp>0).length;
 const services=all.filter(b=>['well','market','warehouse','study','scriptorium'].includes(b.type)&&b.ready&&b.hp>0).length;
 // Resource-chain dependency must be built before any stone-wall plan.
 if(realm.pop>=11&&readyHouses>=4&&services>=2&&waiting<=3&&
    (stock.water||0)>=realm.pop*1.5&&
    (stock.meat||0)+(stock.fish||0)+(stock.grain||0)+(stock.bread||0)+(stock.berries||0)>=realm.pop*2.5&&
    firstMasonryWorkshop(game,team,city,all,stock))return;
 const eligibility=defenseEligibility({population:realm.pop,readyHouses,services,waiting,stock});
 if(!eligibility.ok){city.aiDefenseDiagnosticV146={reason:eligibility.reason,checkedAt:game.s.time};return;}
 // Do not fill an entire city construction queue with decorative walls.
 const existing=all.filter(b=>defendedTypes.has(b.type)&&b.hp>0);
 // Larger cities can fund up to two real building sites, not free fortifications.
 if(existing.filter(b=>!b.ready).length>=(realm.pop>=BRONZE_FORTIFY_POP_V160?2:1)){
  city.aiDefenseDiagnosticV146={reason:'wall-being-built',checkedAt:game.s.time};return;
 }
 const local=city.economy.buildings.filter(b=>!b.virtual&&b.hp>0);
 if(!city.defensePlanV139){
  // The entire ring is fixed at the time of first fortification.
  const available=id=>!game.buildRule(city,id);
  const wall=available('stonewall')?'stonewall':'palisade';
  const tower=available('stonetower')?'stonetower':'watchtower';
  const ring=ancientWallPlan(local,wall,tower,game.s.seed+city.id*19);
  city.defensePlanV139={version:146,kind:'historic-core',...ring,nextIndex:0,constructed:0};
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
 const walls=slots.filter(s=>!['stonetower','watchtower'].includes(s.type));
 const towers=slots.filter(s=>['stonetower','watchtower'].includes(s.type));
 const hasReadyStone=readyBuilding(local,'stonewall');
 const gates=game.s.ages[team]>=1&&hasReadyStone?[
  {type:'gatehouse',x:0,z:-plan.rz,wallAxis:0},
  {type:'gatehouse',x:0,z:plan.rz,wallAxis:0},
  {type:'gatehouse',x:-plan.rx,z:0,wallAxis:1},
  {type:'gatehouse',x:plan.rx,z:0,wallAxis:1}
 ]:[];
 const candidates=hasReadyStone&&realm.pop>=BRONZE_FORTIFY_POP_V160?[...gates,...walls,...towers]:[...walls,...towers];
 const wallCost=game.buildingDefinitions.stonewall?.cost||{};
 if(!hasReadyStone&&game.s.research?.[team]?.known?.includes('stone_fortifications')&&
    !canAfford(stock,wallCost))city.aiImportRequestsV128={
  ...(city.aiImportRequestsV128||{}),
  ...Object.fromEntries(Object.entries(wallCost).filter(([k,v])=>(stock[k]||0)<v+12).map(([k,v])=>[k,v+12]))
 };
 const reasons={};
 const viable=candidates.filter(slot=>{
  if(local.some(b=>defendedTypes.has(b.type)&&Math.hypot(b.x-slot.x,b.z-slot.z)<5)){reasons.alreadyBuilt=(reasons.alreadyBuilt||0)+1;return false;}
  if(local.some(b=>['house','market','warehouse','study','scriptorium','well','cellar','hall'].includes(b.type)&&Math.abs(b.x-slot.x)<9&&Math.abs(b.z-slot.z)<9)){reasons.overlapsCore=(reasons.overlapsCore||0)+1;return false;}
  const locked=game.buildRule(city,slot.type);if(locked){reasons.locked=(reasons.locked||0)+1;city.aiDefenseLockedReasonV146=String(locked);return false;}
  const cost=game.buildingDefinitions[slot.type]?.cost||{};
  if(!canAfford(stock,cost)||!reserveAfterWalls(stock,cost)){reasons.materials=(reasons.materials||0)+1;return false;}
  return true;
 });
 for(let i=0;i<Math.min(32,viable.length);i++){
  const n=((plan.nextIndex||0)+i)%viable.length,slot=viable[n];
  const preview=game.previewBuild(city,slot.type,slot);
  if(preview.error){reasons.site=(reasons.site||0)+1;continue;}
  const result=game.build(city,slot.type,{...slot,plannedDefense:true});
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
