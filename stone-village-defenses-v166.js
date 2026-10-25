// V166 Etapp 2: paid Stone Age palisade around an actual compact village.
// Separate saved plan from the Bronze stone ring, so the latter stays compatible.
// All placements go through normal building, pathfinding and resource checks.
import {canAfford} from './economy.js';
export const STONE_VILLAGE_DEFENSE_VERSION=166;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const HOUSING=new Set(['hall','house','well','study','market','warehouse','cellar']);
const FORTS=new Set(['palisade','woodgate','watchtower','stonewall','gatehouse','stonetower','reinforced_wall']);
const foodTotal=r=>['bread','meat','fish','grain','berries','vegetables'].reduce((n,k)=>n+(r[k]||0),0);
export function stoneVillageWallPlan(buildings=[],seed=0){
 const core=buildings.filter(b=>b.hp>0&&!b.virtual&&HOUSING.has(b.type));
 const houses=core.filter(b=>b.type==='house');
 const hall=core.find(b=>b.type==='hall')||{x:0,z:0};
 const snap=n=>Math.ceil(n/14)*14;
 // Fit the founded historic centre; reserve clearance for roads and huts.
 // Only the inner centre is fortified; distant farms stay outside.
 const sorted=(axis)=>houses.map(b=>Math.abs((b[axis]||0)-(hall[axis]||0))).sort((a,b)=>a-b);
 const radius=arr=>arr.length?arr[Math.floor((arr.length-1)*.90)]:25;
 const rx=snap(clamp(radius(sorted('x'))+14,42,70));
 const rz=snap(clamp(radius(sorted('z'))+14,42,56));
 const slots=[];
 const push=(type,x,z,wallAxis=0)=>slots.push({type,x:Math.round((x+hall.x)*2)/2,z:Math.round((z+hall.z)*2)/2,wallAxis});
 // Each paid timber section spans 14m; end caps are 7m. This halves
 // construction orders versus the old 7m ring while preserving collisions.
 for(const z of [-rz,rz])push('woodgate',0,z,0);
 for(const x of [-rx,rx])for(const z of [-rz,rz])push('watchtower',x,z,0);
 for(const z of [-rz,rz]){
  for(let x=14;x<=rx-14;x+=14)for(const sign of [-1,1])
   slots.push({type:'palisade',x:hall.x+sign*x,z:hall.z+z,wallAxis:0,extendedPalisadeV166:true});
  for(const sign of [-1,1])push('palisade',sign*(rx-7),z,0);
 }
 for(const x of [-rx,rx]){
  for(let z=0;z<=rz-14;z+=14)for(const sign of (z===0?[1]:[-1,1]))
   slots.push({type:'palisade',x:hall.x+x,z:hall.z+sign*z,wallAxis:1,extendedPalisadeV166:true});
  for(const sign of [-1,1])push('palisade',x,sign*(rz-7),1);
 }
 // Double-width wooden gate leaves a pedestrian-clear central opening.
 for(const slot of slots)if(slot.type==='woodgate')slot.extendedPalisadeV166=true;
 return {version:STONE_VILLAGE_DEFENSE_VERSION,slots,gateOpenings:2,rx,rz,
   shape:'rectangular-wooden-palisade',nextIndex:0,constructed:0,blocked:0,seed};
}
export function stoneVillageDefenseEligibility({age=0,pop=0,readyHouses=0,services=0,waiting=0,stock={}}){
 const reason=age!==0?'later-era':pop<7?'population':
  readyHouses<4?'housing':services<1?'services':waiting>2?'construction-backlog':
  (stock.wood||0)<12?'timber-reserve':(stock.water||0)<pop?'water':
  foodTotal(stock)<pop*1.4?'food':null;
 return {ok:reason===null,reason};
}
export function planStoneVillageDefenses(game,team,city){
 const age=game.s.ages[team],local=city.economy.buildings.filter(b=>!b.virtual&&b.hp>0);
 if(age!==0)return false; // let the existing Bronze fortification strategy proceed
 if(game.s.time<(city.nextStoneDefenseCheckV166||0))return true;
 city.nextStoneDefenseCheckV166=game.s.time+24;
 const realm=city.economy.realms[team],stock=realm.resources,
  all=game.allBuildings(city),pending=all.filter(b=>!b.ready&&b.hp>0);
 const eligibility=stoneVillageDefenseEligibility({
  age,pop:realm.pop,readyHouses:all.filter(b=>b.type==='house'&&b.ready&&b.hp>0).length,
  services:all.filter(b=>['study','well','market','warehouse','cellar'].includes(b.type)&&b.ready&&b.hp>0).length,
  waiting:pending.length,stock
 });
 if(!eligibility.ok){city.aiStoneDefenseStatusV166={reason:eligibility.reason,at:game.s.time};return true;}
 if(all.some(b=>FORTS.has(b.type)&&!b.ready&&b.hp>0)){
  city.aiStoneDefenseStatusV166={reason:'construction-in-progress',at:game.s.time};return true;
 }
 if(!city.stoneDefensePlanV166)
  city.stoneDefensePlanV166=stoneVillageWallPlan(local,game.s.seed+city.id*19);
 const plan=city.stoneDefensePlanV166,counts={};
 let ready=0,placed=0;
 for(const slot of plan.slots){
  if(local.some(b=>FORTS.has(b.type)&&Math.hypot(b.x-slot.x,b.z-slot.z)<4.5)){
   placed++;if(local.some(b=>FORTS.has(b.type)&&b.ready&&Math.hypot(b.x-slot.x,b.z-slot.z)<4.5))ready++;
  }
 }
 if(placed===plan.slots.length){
  city.aiStoneDefenseStatusV166={reason:'ring-complete',ready,placed,total:plan.slots.length,at:game.s.time};
  return true;
 }
 for(const slot of plan.slots){
  if(local.some(b=>FORTS.has(b.type)&&Math.hypot(b.x-slot.x,b.z-slot.z)<4.5))continue;
  const limit=game.buildingDefinitions[slot.type]?.cost;
  if(!limit){counts.definition=(counts.definition||0)+1;continue;}
  if(game.buildRule(city,slot.type)){counts.locked=(counts.locked||0)+1;continue;}
  if(!canAfford(stock,limit)||stock.wood-(limit.wood||0)<7||
    stock.stone-(limit.stone||0)<3){counts.materials=(counts.materials||0)+1;continue;}
  const placement={...slot,navWidth:slot.extendedPalisadeV166?(slot.wallAxis?1.1:7.2):undefined,
   navDepth:slot.extendedPalisadeV166?(slot.wallAxis?7.2:1.1):undefined};
  if(game.previewBuild(city,slot.type,placement).error){counts.site=(counts.site||0)+1;continue;}
  const result=game.build(city,slot.type,{...placement,plannedDefense:true});
  if(!result.building){counts.build=(counts.build||0)+1;continue;}
  // The existing engine records each paid building and its construction.
  result.building.historicPalisadeV166=true;
  result.building.wallAxis=slot.wallAxis;
  result.building.plannedDefense=true;
  result.building.extendedPalisadeV166=!!slot.extendedPalisadeV166;
  if(slot.extendedPalisadeV166){
   result.building.navWidth=placement.navWidth;result.building.navDepth=placement.navDepth;
   game.nav?.(city)?.rebuild();
  }
  plan.constructed=(plan.constructed||0)+1;
  city.aiStoneDefenseStatusV166={reason:'built',kind:slot.type,
   ready,placed:placed+1,total:plan.slots.length,at:game.s.time};
  return true;
 }
 city.aiStoneDefenseStatusV166={reason:Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'no-site',
  ready,placed,total:plan.slots.length,details:counts,at:game.s.time};
 return true;
}
