import {terrainDefensePlanV176,insideDefenseV176} from './terrain-defenses-v176.js';
// V166 Etapp 2: paid Stone Age palisade around an actual compact village.
// Separate saved plan from the Bronze stone ring, so the latter stays compatible.
// All placements go through normal building, pathfinding and resource checks.
import {canAfford} from './economy.js';
import {footprintsCrossV168} from './stone-fort-footprints-v168.js';
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
// V168: reserve a plausible timber perimeter on the first day of a village.
// Do not require defense research to plan future land use. This is only a
// reservation: not a building, not construction work and not a wall.
export function reserveStoneVillageRingV168(game,city){
 const hall=city.economy.buildings.find(b=>b.type==='hall'&&b.hp>0);
 if(!hall||game.s.ages[city.team]!==0)return null;
 const nav=game.nav(city),seed=game.s.seed+city.id*19;
 const natural=terrainDefensePlanV176(game,city,[hall],seed);
 if(natural)return {...natural,reservedV168:true};
 let best=null,score=-Infinity;
 for(const extraX of [14,0,28])for(const extraZ of [14,0,28])
 for(const dx of [0,-7,7])for(const dz of [0,-7,7]){
  const candidate=stoneVillageWallPlan([hall],seed,{extraX,extraZ,dx,dz});
  let bad=0;
  for(const slot of candidate.slots){
   const half=slot.type==='palisade'?(slot.palisadeSpanV167||14)/2:
     slot.type==='woodgate'?7:2;
   const count=Math.ceil(half/3);
   for(let k=-count;k<=count;k++){
    const step=k*half/count;
    const x=slot.x+(slot.wallAxis?0:step),z=slot.z+(slot.wallAxis?step:0);
    if(!nav.passable(x,z)){bad++;break;}
   }
  }
  // Prefer the 56x56m inner quarters but pick dry ground over a prettier ring.
  const value=-bad*25-Math.abs(candidate.rx-56)*.20-
   Math.abs(candidate.rz-56)*.20-(Math.abs(dx)+Math.abs(dz))*.06;
  if(value>score){score=value;best={...candidate,reservedV168:true,terrainBlockedAtFounding:bad};}
 }
 return best;
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
 // Founding reserved this exact corridor for later real construction. Keep
 // it stable as inner housing grows instead of shifting it onto new fields.
 const reserved=city.stoneDefenseReserveV168;
 if(reserved?.version>=177&&reserved.slots?.length&&!reserved.slots.some(slot=>buildings.some(b=>b.hp>0&&!b.virtual&&!FORTS.has(b.type)&&footprintsCrossV168(slot,b,1.2))))
  return {...structuredClone(reserved),verifiedAtTechV167:true,nextIndex:0,constructed:0};
 for(const extra of [0,8,16]){const plan=terrainDefensePlanV176(game,city,buildings,seed,{extra});if(plan)return plan;}
 const centre=buildings.find(b=>b.type==='hall')||{x:0,z:0};
 const homes=buildings.filter(b=>b.type==='house'&&b.hp>0);
 // Protect the historic, densely built inner 90% of houses. An exceptional
 // isolated outer home may remain in a suburb rather than forcing a
 // geographically impossible wall through a river or resource deposit.
 const orderedHomes=[...homes].sort((a,b)=>Math.hypot(a.x-centre.x,a.z-centre.z)-Math.hypot(b.x-centre.x,b.z-centre.z));
 const coreHomes=orderedHomes.slice(0,Math.max(1,Math.ceil(orderedHomes.length*.9)));
 const nav=typeof game.nav==='function'?game.nav(city):null,visited=new Set();
 let best=null,bestScore=-Infinity,examined=0;
 for(const extraX of [0,14,28])for(const extraZ of [0,14,28])
 for(const dx of [0,-7,7,-14,14])for(const dz of [0,-7,7,-14,14]){
  const plan=stoneVillageWallPlan(buildings,seed,{extraX,extraZ,dx,dz});
  const key=plan.rx+':'+plan.rz+':'+plan.slots[0].x+':'+plan.slots[0].z;
  if(visited.has(key))continue;visited.add(key);
  // Avoid the historical mistake of enclosing distant production outposts.
  const cx=centre.x+dx,cz=centre.z+dz;
  if(coreHomes.some(h=>Math.abs(h.x-cx)>plan.rx-9||Math.abs(h.z-cz)>plan.rz-9))continue;
  let viable=0,failed=0;
  for(const slot of plan.slots){
   // V168: a 28-42m timber segment cannot be screened as a point.
   // Existing fields/homes may collide at its ENDS even when the centre is free.
   const intersects=buildings.some(b=>b.hp>0&&!b.virtual&&!FORTS.has(b.type)&&
    footprintsCrossV168(slot,b,1.2));
   // PreviewBuild checks a 6x5.6 m footprint around a building centre.
   // A 25-42 m palisade can also cross a river/impassable slope at its ends.
   const span=slot.type==='palisade'?(slot.palisadeSpanV167||14):
    slot.type==='woodgate'?14:6;
   let terrainBlocked=false;
   for(let d=-span/2;d<=span/2;d+=3.5){
    const x=slot.x+(slot.wallAxis?0:d),z=slot.z+(slot.wallAxis?d:0);
    if(nav&&!nav.passable(x,z)){terrainBlocked=true;break;}
   }
   const check=intersects?{error:'occupied-corridor'}:
    terrainBlocked?{error:'terrain-corridor'}:
    game.previewBuild(city,slot.type,{...slot,plannedDefense:true});
   if(check.error)failed++;else viable++;
  }
  examined++;
  // Never prefer a bigger wall merely for aesthetic reasons.
  const reserve=city.stoneDefenseReserveV168;
  const preferred=reserve&&plan.rx===reserve.rx&&plan.rz===reserve.rz&&
    plan.slots[0]?.x===reserve.slots[0]?.x&&plan.slots[0]?.z===reserve.slots[0]?.z ? 14:0;
  const score=viable*4-failed*100-plan.slots.length*1.3-(plan.rx+plan.rz)*.10-
    (Math.abs(dx)+Math.abs(dz))*.03+preferred;
  if(score>bestScore){bestScore=score;best={...plan,initialViable:viable,initialBlocked:failed};}
 }
 return best?{...best,verifiedAtTechV167:true,terrainSurveyV176:true}:{...stoneVillageWallPlan(buildings,seed),terrainSurveyV176:true};
}
// A mature Stone Age capital spends a bounded extra period finishing its
// defenses before the AI commits to Bronze. Never stall another age indefinitely.
export function stoneFortificationAgeGate(city,age,time,limit=110*60){
 if(city?.stoneDefensePlanV166?.closedRingV177)limit=Math.max(limit,150*60);
 if(age!==0||time>=limit||!city?.stoneDefensePlanV166?.slots?.length)return false;
 // A temporary population dip must not abandon an already funded and
 // partly built ring. Eligibility required residents at the planning stage;
 // the 110-turn timeout still guarantees eventual age progression.
 const plan=city.stoneDefensePlanV166;
 const local=[city,...Object.values(city.districts||{})].flatMap(ctx=>ctx.economy.buildings.filter(b=>b.hp>0&&!b.virtual).map(b=>({...b,x:b.x+((ctx.c??city.c??0)-(city.c??0))*225,z:b.z+((ctx.r??city.r??0)-(city.r??0))*195})));
 const ready=plan.slots.filter(slot=>local.some(b=>b.type===slot.type&&b.ready&&b.hp>0&&
   !b.disabled&&Math.hypot(b.x-slot.x,b.z-slot.z)<(slot.drawnWallV175?1:4.5))).length;
 return ready<plan.slots.length;
}
export function planStoneVillageDefenses(game,team,city){
 const age=game.s.ages[team],local=(game.defenseBuildingsV177?.(city)||city.economy.buildings).filter(b=>!b.virtual&&b.hp>0);
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
    ((!city.stoneDefensePlanV166.verifiedAtTechV167||city.stoneDefensePlanV166.version<176&&!city.stoneDefensePlanV166.terrainSurveyV176)&&
       !local.some(b=>b.historicPalisadeV166&&b.hp>0)))
  city.stoneDefensePlanV166=bestStoneVillageWallPlan(game,city,local,game.s.seed+city.id*19);
 const plan=city.stoneDefensePlanV166,counts={};
 let ready=0,placed=0;
 for(const slot of plan.slots){
  if(local.some(b=>FORTS.has(b.type)&&Math.hypot(b.x-slot.x,b.z-slot.z)<(slot.drawnWallV175?1:4.5))){
   placed++;if(local.some(b=>FORTS.has(b.type)&&b.ready&&Math.hypot(b.x-slot.x,b.z-slot.z)<(slot.drawnWallV175?1:4.5)))ready++;
  }
 }
 if(placed===plan.slots.length){
  city.aiStoneDefenseStatusV166={reason:'ring-complete',ready,placed,total:plan.slots.length,at:game.s.time};
  return true;
 }
 for(const slot of plan.slots){
  if(local.some(b=>FORTS.has(b.type)&&Math.hypot(b.x-slot.x,b.z-slot.z)<(slot.drawnWallV175?1:4.5)))continue;
  const limit=game.buildingDefinitions[slot.type]?.cost;
  if(!limit){counts.definition=(counts.definition||0)+1;continue;}
  if(game.buildRule(city,slot.type)){counts.locked=(counts.locked||0)+1;continue;}
  if(!canAfford(stock,limit)||stock.wood-(limit.wood||0)<7||
    stock.stone-(limit.stone||0)<3){counts.materials=(counts.materials||0)+1;continue;}
  const extent=(slot.palisadeSpanV167|| (slot.extendedPalisadeV166?14:7))/2+.2;
  const placement={...slot,
   navWidth:slot.type==='palisade'?(slot.wallAxis?1.1:extent):(slot.extendedPalisadeV166?7.2:undefined),
   navDepth:slot.type==='palisade'?(slot.wallAxis?extent:1.1):(slot.extendedPalisadeV166?1.1:undefined)};
  const occupied=local.some(b=>!FORTS.has(b.type)&&footprintsCrossV168(slot,b,1.2));
  let siteResult=occupied?{error:'Põld või hoone asub müürikoridoris'}:
   (game.previewDefenseV177?game.previewDefenseV177(city,{...placement,type:slot.type,plannedDefense:true}):game.previewBuild(city,slot.type,{...placement,plannedDefense:true}));
  if(siteResult.error&&['watchtower','stonetower'].includes(slot.type)){
   searchTower:for(const dx of [0,-3,3,-6,6,-9,9,-12,12])for(const dz of [0,-3,3,-6,6,-9,9,-12,12]){
    const candidate={...placement,x:slot.x+dx,z:slot.z+dz};
    if(!insideDefenseV176(candidate,plan)||local.some(b=>FORTS.has(b.type)&&Math.hypot(b.x-candidate.x,b.z-candidate.z)<7))continue;
    const check=game.previewDefenseV177?game.previewDefenseV177(city,{...candidate,type:slot.type,plannedDefense:true}):game.previewBuild(city,slot.type,{...candidate,plannedDefense:true});
    if(!check.error){Object.assign(slot,{x:candidate.x,z:candidate.z});Object.assign(placement,{x:candidate.x,z:candidate.z});siteResult=check;break searchTower;}
   }
  }
  if(siteResult.error){counts.site=(counts.site||0)+1;const why=String(siteResult.error).slice(0,85);counts['site:'+why]=(counts['site:'+why]||0)+1;continue;}
  const result=game.buildDefenseV177?game.buildDefenseV177(city,{...placement,type:slot.type,plannedDefense:true}):game.build(city,slot.type,{...placement,plannedDefense:true});
  if(!result.building){counts.build=(counts.build||0)+1;continue;}
  // The existing engine records each paid building and its construction.
  result.building.historicPalisadeV166=true;
  result.building.wallAxis=slot.wallAxis;
  if(Number.isFinite(slot.wallAngleV175))result.building.wallAngleV175=slot.wallAngleV175;
  result.building.plannedDefense=true;
  result.building.extendedPalisadeV166=!!slot.extendedPalisadeV166;
  if(slot.palisadeSpanV167)result.building.palisadeSpanV167=slot.palisadeSpanV167;
  if(slot.extendedPalisadeV166||slot.palisadeSpanV167){
   if(!slot.drawnWallV175){result.building.navWidth=placement.navWidth;result.building.navDepth=placement.navDepth;}
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
