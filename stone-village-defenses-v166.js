// V166 Etapp 2: paid Stone Age palisade around an actual compact village.
// Separate saved plan from the Bronze stone ring, so the latter stays compatible.
// All placements go through normal building, pathfinding and resource checks.
import {canAfford} from './economy.js';
export const STONE_VILLAGE_DEFENSE_VERSION=167;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const HOUSING=new Set(['hall','house','well','study','market','warehouse','cellar']);
const FORTS=new Set(['palisade','woodgate','watchtower','stonewall','gatehouse','stonetower','reinforced_wall']);
const foodTotal=r=>['bread','meat','fish','grain','berries','vegetables'].reduce((n,k)=>n+(r[k]||0),0);
export function stoneVillageWallPlan(buildings=[],seed=0,options={}){
 const core=buildings.filter(b=>b.hp>0&&!b.virtual&&HOUSING.has(b.type));
 const houses=core.filter(b=>b.type==='house');
 const hall=core.find(b=>b.type==='hall')||{x:0,z:0};
 const origin={x:hall.x+(options.dx||0),z:hall.z+(options.dz||0)};
 const snap=n=>Math.ceil(n/14)*14;
 // Fit the founded historic centre; reserve clearance for roads and huts.
 // Only the inner centre is fortified; distant farms stay outside.
 const sorted=(axis)=>houses.map(b=>Math.abs((b[axis]||0)-(hall[axis]||0))).sort((a,b)=>a-b);
 const radius=arr=>arr.length?arr[Math.floor((arr.length-1)*.90)]:25;
 const rx=snap(clamp(radius(sorted('x'))+14+(options.extraX||0),42,70));
 const rz=snap(clamp(radius(sorted('z'))+14+(options.extraZ||0),42,70));
 const slots=[];
 const push=(type,x,z,wallAxis=0)=>slots.push({type,x:Math.round((x+origin.x)*2)/2,z:Math.round((z+origin.z)*2)/2,wallAxis});
 // Segment endpoints, not building counts, define the enclosure. Two 14m
 // gates cross the main N/S road. Palisade ends meet each gate and tower.
 // Long variable spans are real paid buildings, with matching nav footprints.
 for(const z of [-rz,rz])push('woodgate',0,z,0);
 for(const x of [-rx,rx])for(const z of [-rz,rz])push('watchtower',x,z,0);
 for(const z of [-rz,rz])for(const side of [-1,1]){
  const distance=rx-7,parts=Math.max(1,Math.ceil(distance/35));
  for(let i=0;i<parts;i++){
   const a=7+distance*i/parts,b=7+distance*(i+1)/parts;
   const centre=(a+b)/2;
   push('palisade',side*centre,z,0);
   slots.at(-1).palisadeSpanV167=b-a;
  }
 }
 for(const x of [-rx,rx]){
  const parts=Math.max(2,Math.ceil(2*rz/42));
  for(let i=0;i<parts;i++){
   const a=-rz+2*rz*i/parts,b=-rz+2*rz*(i+1)/parts;
   push('palisade',x,(a+b)/2,1);
   slots.at(-1).palisadeSpanV167=b-a;
  }
 }
 for(const slot of slots)if(slot.type==='woodgate')slot.extendedPalisadeV166=true;
 return {version:STONE_VILLAGE_DEFENSE_VERSION,slots,gateOpenings:2,rx,rz,
   shape:'rectangular-wooden-palisade',nextIndex:0,constructed:0,blocked:0,seed};
}
export function stoneVillageDefenseEligibility({age=0,pop=0,readyHouses=0,services=0,waiting=0,stock={}}){
 const reason=age!==0?'later-era':pop<5?'population':
  readyHouses<3?'housing':services<1?'services':waiting>3?'construction-backlog':
  (stock.wood||0)<12?'timber-reserve':(stock.water||0)<pop?'water':
  foodTotal(stock)<pop*1.4?'food':null;
 return {ok:reason===null,reason};
}
// Fit the wooden enclosure to real buildable terrain BEFORE purchasing a gate.
// This prevents a paid ring from being frozen across buildings or steep banks.
export function bestStoneVillageWallPlan(game,city,buildings,seed){
 const centre=buildings.find(b=>b.type==='hall')||{x:0,z:0};
 const homes=buildings.filter(b=>b.type==='house'&&b.hp>0);
 let best=null,bestScore=-Infinity,examined=0;
 for(const extraX of [0,14,28])for(const extraZ of [0,14,28])
 for(const dx of [0,-7,7])for(const dz of [0,-7,7]){
  const plan=stoneVillageWallPlan(buildings,seed,{extraX,extraZ,dx,dz});
  // Keep the entire early residential quarter inside the perimeter.
  const cx=centre.x+dx,cz=centre.z+dz;
  if(homes.some(h=>Math.abs(h.x-cx)>plan.rx-9||Math.abs(h.z-cz)>plan.rz-9))continue;
  let viable=0,failed=0;
  for(const slot of plan.slots){
   const check=game.previewBuild(city,slot.type,{...slot,plannedDefense:true});
   if(check.error)failed++;else viable++;
  }
  examined++;
  // Never prefer a bigger wall merely for aesthetic reasons.
  const score=viable*4-failed*25-plan.slots.length*1.3-(plan.rx+plan.rz)*.10-
    (Math.abs(dx)+Math.abs(dz))*.03;
  if(score>bestScore){bestScore=score;best={...plan,initialViable:viable,initialBlocked:failed};}
 }
 return best?{...best,verifiedAtTechV167:true}:stoneVillageWallPlan(buildings,seed);
}
// A mature Stone Age capital spends a bounded extra period finishing its
// defenses before the AI commits to Bronze. Never stall another age indefinitely.
export function stoneFortificationAgeGate(city,age,time,limit=110*60){
 if(age!==0||time>=limit||!city?.stoneDefensePlanV166?.slots?.length)return false;
 const pop=city.economy?.realms?.[city.team]?.pop||0;
 if(pop<6)return false;
 const plan=city.stoneDefensePlanV166;
 const local=city.economy.buildings.filter(b=>b.hp>0&&!b.virtual);
 const ready=plan.slots.filter(slot=>local.some(b=>b.type===slot.type&&b.ready&&b.hp>0&&
   !b.disabled&&Math.hypot(b.x-slot.x,b.z-slot.z)<4.5)).length;
 return ready<plan.slots.length;
}
export function planStoneVillageDefenses(game,team,city){
 const age=game.s.ages[team],local=city.economy.buildings.filter(b=>!b.virtual&&b.hp>0);
 if(age!==0)return false; // let the existing Bronze fortification strategy proceed
 if(game.s.time<(city.nextStoneDefenseCheckV166||0))return true;
 city.nextStoneDefenseCheckV166=game.s.time+9;
 const realm=city.economy.realms[team],stock=realm.resources,
  all=game.allBuildings(city),pending=all.filter(b=>!b.ready&&b.hp>0);
 const eligibility=stoneVillageDefenseEligibility({
  age,pop:Math.max(realm.pop,city.stoneDefensePlanV166?5:0),readyHouses:all.filter(b=>b.type==='house'&&b.ready&&b.hp>0).length,
  services:all.filter(b=>['study','well','market','warehouse','cellar'].includes(b.type)&&b.ready&&b.hp>0).length,
  waiting:pending.length,stock
 });
 if(!eligibility.ok){city.aiStoneDefenseStatusV166={reason:eligibility.reason,at:game.s.time};return true;}
 // A terrain survey is only reliable AFTER the real building technology and
 // lumber-yard dependency are unlocked; otherwise every candidate looks locked.
 if(game.buildRule(city,'woodgate')){
  city.aiStoneDefenseStatusV166={reason:'wooden-gate-research-or-lumber',at:game.s.time};return true;
 }
 if(all.filter(b=>FORTS.has(b.type)&&!b.ready&&b.hp>0).length>=2){
  city.aiStoneDefenseStatusV166={reason:'construction-in-progress',at:game.s.time};return true;
 }
 if(!city.stoneDefensePlanV166||
    ((!city.stoneDefensePlanV166.verifiedAtTechV167||city.stoneDefensePlanV166.version<167)&&
       !local.some(b=>b.historicPalisadeV166&&b.hp>0)))
  city.stoneDefensePlanV166=bestStoneVillageWallPlan(game,city,local,game.s.seed+city.id*19);
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
  const extent=(slot.palisadeSpanV167|| (slot.extendedPalisadeV166?14:7))/2+.2;
  const placement={...slot,
   navWidth:slot.type==='palisade'?(slot.wallAxis?1.1:extent):(slot.extendedPalisadeV166?7.2:undefined),
   navDepth:slot.type==='palisade'?(slot.wallAxis?extent:1.1):(slot.extendedPalisadeV166?1.1:undefined)};
  const siteResult=game.previewBuild(city,slot.type,{...placement,plannedDefense:true});
  if(siteResult.error){counts.site=(counts.site||0)+1;const why=String(siteResult.error).slice(0,85);counts['site:'+why]=(counts['site:'+why]||0)+1;continue;}
  const result=game.build(city,slot.type,{...placement,plannedDefense:true});
  if(!result.building){counts.build=(counts.build||0)+1;continue;}
  // The existing engine records each paid building and its construction.
  result.building.historicPalisadeV166=true;
  result.building.wallAxis=slot.wallAxis;
  result.building.plannedDefense=true;
  result.building.extendedPalisadeV166=!!slot.extendedPalisadeV166;
  if(slot.palisadeSpanV167)result.building.palisadeSpanV167=slot.palisadeSpanV167;
  if(slot.extendedPalisadeV166||slot.palisadeSpanV167){
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
