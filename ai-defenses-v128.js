import {canAfford} from './economy.js';
import {combatUnit} from './ai-development-v128.js';
import {ancientWallPlan,surplusForWalls,reserveAfterWalls} from './ancient-walls-v139.js';

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
 city.nextDefenseCheckV128=game.s.time+42;
 const realm=city.economy.realms[team],stock=realm.resources,all=game.allBuildings(city);
 const waiting=all.filter(b=>b.hp>0&&!b.ready).length;
 const readyHouses=all.filter(b=>b.type==='house'&&b.ready&&b.hp>0).length;
 const services=all.filter(b=>['well','market','warehouse','study','scriptorium'].includes(b.type)&&b.ready&&b.hp>0).length;
 const eligibility=defenseEligibility({population:realm.pop,readyHouses,services,waiting,stock});
 if(!eligibility.ok){city.aiDefenseDiagnosticV146={reason:eligibility.reason,checkedAt:game.s.time};return;}
 // Do not fill an entire city construction queue with decorative walls.
 const existing=all.filter(b=>defendedTypes.has(b.type)&&b.hp>0);
 if(existing.some(b=>!b.ready)){
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
 // Towers secure the ring first. Wall sections follow with an unblocked
 // entrance; actual gatehouses need medieval technology.
 // A Bronze palisade planned early may be obsolete by Medieval Age.
 // Keep the geometry and saved ring, but adapt each unbuilt segment to the
 // currently legal material/tower tier.
 const effective=slot=>{
  const upgrade={palisade:'stonewall',watchtower:'stonetower'};
  const later=upgrade[slot.type];
  return later&&!game.buildRule(city,later)?{...slot,type:later}:slot;
 };
 const slots=plan.slots.map(effective);
 const candidates=[
  ...slots.filter(s=>!['stonetower','watchtower'].includes(s.type)),
  ...slots.filter(s=>['stonetower','watchtower'].includes(s.type)),
  ...(game.s.ages[team]>=3?[-plan.rz,plan.rz].map(z=>({type:'gatehouse',x:0,z,wallAxis:0})):[])
 ];
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
  return;
 }
 const reason=Object.entries(reasons).sort((a,b)=>b[1]-a[1])[0]?.[0]||'no-eligible-sites';
 city.aiDefenseDiagnosticV146={reason,reasons,checkedAt:game.s.time};
}
