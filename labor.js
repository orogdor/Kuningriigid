import {canAfford} from './economy.js';
import {FOUNDATION_TYPES} from './ai-foundation-v88.js?v=117a';
import {foodTotal} from './city-needs-v87.js';
import {availableLabor} from './gameplay-flow-v86.js?v=86a';
// Fractional workers are shared across every district of a city.
export const BASIC_JOBS={berries:{name:'Marjakorjajad',type:'berries',kind:'berry',out:'berries',rate:6,cycle:8},wood:{name:'Puidukorjajad',type:'lumber',kind:'tree',out:'wood',rate:8,cycle:6},stone:{name:'Kivikorjajad',type:'quarry',kind:'stone',out:'stone',rate:6,cycle:6}};
// V36: A worker represents a small household work team. Houses add 3 places.
// Partially staffed workplaces can still function, but never exceed full production
// without a technological bonus. Idle builders do not consume workforce.
export const HALL_CAPACITY=4, HOUSE_CAPACITY=3;
export const FOOD_PER_RESIDENT=.60, WATER_PER_RESIDENT=.45;
export const housingCapacity=buildings=>HALL_CAPACITY+buildings.filter(b=>b.type==='house'&&b.ready&&b.hp>0&&!b.virtual).length*HOUSE_CAPACITY;
export function workerEfficiency(assigned,need){return need>0?Math.pow(Math.min(1,Math.max(0,assigned)/need),.85):1}
export function demand(b,definitions){
 if(b.disabled||b.virtual||b.hp<=0)return 0;
 if(!b.ready)return 1;
 const d=definitions[b.type];
 return (d?.out||['watchtower','stonetower','guildhall','infirmary','trade_yard','inn','monastery','chapel','keep','gatehouse','siegeworkshop','forester','warehouse','market','harbor','study','scriptorium','academy','university','observatory','polytechnic','laboratory','railstation','airfield'].includes(b.type))?(d?.workers||0):0;
}
function jobPriority(b,foodCritical,waterCritical,eraNeed={},scarceWood=false,stock={}){
 if(foodCritical&&['hunter','fisher','bakery','farm','pasture'].includes(b.type))return 171;
 if(waterCritical&&b.type==='well')return 169;
 const need=(k)=>Math.max(0,eraNeed[k]||0);
 const low=(k,n)=>(stock[k]||0)<n;
 if(b.type==='forester'&&(scarceWood||low('wood',70)))return 159;
 if(need('bronze')>0){if(b.type==='bronze_foundry')return 157;if(b.type==='coppermine'&&low('copper',12))return 155;if(b.type==='tinmine'&&low('tin',12))return 154;}
 if(need('weapons')>0){if(b.type==='smith')return 156;if(b.type==='smelter'&&low('iron',15))return 153;if(b.type==='mine'&&low('ore',15))return 150;if(b.type==='coal'&&low('coal',15))return 149;}
 // Avoid assigning the bulk of the workforce to a factory whose input
 // stock is empty. Work backwards through the entire production chain.
 if(need('machines')>0){
  if(b.type==='engineworks')return low('steel',3)||low('plank',2)?24:165;
  if(b.type==='steelworks')return low('iron',5)||low('coal',3)?24:154;
  if(b.type==='smelter')return low('ore',3)||low('coal',2)?23:151;
  if(b.type==='mine'&&low('ore',28))return 149;
  if(b.type==='coal'&&low('coal',25))return low('wood',4)?23:149;
  if(b.type==='lumber'&&low('wood',35))return 155;
  if(b.type==='saw'&&low('plank',24))return 151;
 }
 if(need('steel')>0){
  if(b.type==='steelworks')return low('iron',5)||low('coal',3)?24:161;
  if(b.type==='smelter')return low('ore',3)||low('coal',2)?23:151;
  if(b.type==='mine'&&low('ore',28))return 149;
  if(b.type==='coal'&&low('coal',25))return low('wood',4)?23:149;
  if(b.type==='lumber'&&low('wood',35))return 155;
 }
 if(need('iron')>0){
  if(b.type==='smelter')return low('ore',3)||low('coal',2)?24:151;
  if(b.type==='mine'&&low('ore',28))return 149;
  if(b.type==='coal'&&low('coal',25))return low('wood',4)?23:149;
  if(b.type==='lumber'&&low('wood',30))return 153;
 }
 if(need('gunpowder')>0){
  if(b.type==='powdermill')return low('saltpeter',3)||low('coal',2)?23:153;
  if(b.type==='nitrate'&&low('saltpeter',20))return low('grain',4)||low('water',2)?24:150;
  if(b.type==='coal'&&low('coal',20))return low('wood',4)?23:148;
  if(b.type==='farm'&&low('grain',15))return 143;
 }
 if(need('plank')>0){
  if(b.type==='saw')return scarceWood?25:154;
  if(b.type==='lumber')return scarceWood?160:108;
 }
 if(need('bread')>0&&['hunter','fisher','bakery'].includes(b.type))return 157;
 if(need('bread')>0&&['farm','mill'].includes(b.type))return 139;
 // Do not starve the town while shifting workers to industry.
 if(foodCritical&&['hunter','fisher','bakery','farm','pasture'].includes(b.type))return 171;
 if(waterCritical&&b.type==='well')return 169;
 if(['hunter','fisher','farm','mill','bakery'].includes(b.type))return foodCritical?100:65;
 if(b.type==='well')return waterCritical?95:68;
 if(['lumber','quarry'].includes(b.type))return 78;
 if(b.type==='watchtower'||b.type==='stonetower')return foodCritical||waterCritical?30:74;
 if(b.type==='warehouse')return 38;
 if(b.type==='market')return 42;
 if(['study','scriptorium','academy','university','observatory','polytechnic','laboratory'].includes(b.type))return foodCritical||waterCritical?35:61;
 if(['keep','gatehouse','infirmary'].includes(b.type))return foodCritical?22:72;
 if(['guildhall','trade_yard','inn','monastery','chapel','siegeworkshop'].includes(b.type))return foodCritical?20:56;
 if(b.type==='forester')return 35;
 if(b.type==='saw')return low('plank',50)?86:65;
 if(['mine','coal','smelter','smith','printer','nitrate','powdermill','steelworks','engineworks','oilwell','refinery','powerplant','autofactory'].includes(b.type))return 55;
 return 28;
}
export function allocateCity(game,city){
 const r=city.economy.realms[city.team],mobilized=game.s.battle?.civilianCityId===city.id?game.s.battle.squads.filter(u=>u.civilian).length:0;
 const budget=availableLabor(r.pop,r.housingShortage,mobilized);
 city.builderCount??=1;const all=game.allBuildings(city);
 const foodCritical=foodTotal(r.resources)<r.pop*2.5,waterCritical=(r.resources.water||0)<r.pop*2;
 const wait=city.team>0?game.s?.research?.[city.team]?.ageWait:null;
 const shortages={...(wait?wait.missing||{}:{})};if(city.team>0){const age=game.s.ages[city.team];if(age>=1&&(r.resources.bronze||0)<12)shortages.bronze=12-(r.resources.bronze||0);if(age>=2&&(r.resources.weapons||0)<12)shortages.weapons=12-(r.resources.weapons||0);}
 const laborScarce=(r.resources.wood||0)<(shortages.plank>0?30:12);
 const pending=all.some(b=>!b.ready&&!b.disabled&&b.workerLimit!==0);
 const entries=all.filter(b=>b.ready).map(b=>{
  const need=demand(b,game.buildingDefinitions),definition=game.buildingDefinitions[b.type];
  const inputsReady=!definition?.input||canAfford(r.resources,definition.input);
  const outputFull=definition?.out&&game.storageCap&&game.storageUsed&&game.storageUsed(city,definition.out,r.resources)>=game.storageCap(city,definition.out);
  const researchIdle=!!game.s?.research?.[city.team]&&!game.s.research[city.team].active&&['study','scriptorium','academy','university','observatory','polytechnic','laboratory','monastery','chapel'].includes(b.type);
  const want=inputsReady&&!outputFull&&!researchIdle?Math.max(0,Math.min(need,b.workerLimit??need)):0;
  let priority=jobPriority(b,foodCritical,waterCritical,shortages,laborScarce,r.resources);
  if(city.team>0&&FOUNDATION_TYPES.has(b.type))priority+=60;
  if(b.status?.includes('pole ligipääsetavat')||b.status?.includes('maardla puudub'))priority=9;
  return {b,need,want,priority};
 }).filter(e=>e.want>0);
 const builders={};
 if(pending&&city.builderCount>0)entries.push({b:builders,need:city.builderCount,want:city.builderCount,priority:90});
 city.training??=[];const train=city.training[0];
 if(train&&!train.blocked&&train.progress<train.total)entries.push({b:train,need:1,want:Math.max(0,Math.min(1,train.workerLimit??1)),priority:96});
 // Guarantee a small portion for each operational task, then assign the rest
 // by criticality. Food and water take precedence during shortages.
 entries.sort((a,b)=>b.priority-a.priority);
 const foodSource=entries.some(e=>e.want>0&&['hunter','fisher','bakery'].includes(e.b.type)&&!/pole ligipääsetavat|maardla puudub/.test(e.b.status||''));
 const emergencyBerries=foodCritical&&!foodSource?Math.min(1,budget*.4,Math.max(0,city.basicJobs?.berries??1)):0;
 let remaining=budget-emergencyBerries;
 const aiFoundation=city.team>0;
 for(const e of entries){const essential=FOUNDATION_TYPES.has(e.b.type)||e.b===builders||e.b===train;const seed=Math.min(e.want,aiFoundation?(essential?.25:0):(wait?.1:.25),remaining);e.b.assigned=seed;remaining-=seed}
 for(const e of entries){const extra=Math.min(e.want-e.b.assigned,remaining);e.b.assigned+=extra;remaining-=extra}
 for(const e of entries)e.b.efficiency=workerEfficiency(e.b.assigned,e.need);
 for(const b of all.filter(b=>b.ready&&!entries.some(e=>e.b===b))) {b.assigned=0;b.efficiency=0}
 city.buildersAssigned=builders.assigned||0;
 city.basicJobs??={berries:1,wood:1,stone:1};const wants=Object.fromEntries(Object.keys(BASIC_JOBS).map(k=>[k,Math.max(0,(city.basicJobs[k]??1)-(k==='berries'?emergencyBerries:0))]));const total=Object.values(wants).reduce((n,v)=>n+v,0);
 city.basicAssigned={};for(const k of Object.keys(BASIC_JOBS))city.basicAssigned[k]=total?wants[k]*Math.min(1,remaining/total):0;
 city.basicAssigned.berries=(city.basicAssigned.berries||0)+emergencyBerries;
 r.employed=budget-remaining-emergencyBerries+Object.values(city.basicAssigned).reduce((n,v)=>n+v,0);r.availableLabor=budget;
 return entries;
}
export const secondsLeft=(total,progress=0,efficiency=1)=>efficiency>0?Math.max(0,total-progress)/efficiency:Infinity;
