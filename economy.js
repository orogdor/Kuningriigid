import {GOODS,installGoods} from './city-needs-v87.js';
import {demand,workerEfficiency,HALL_CAPACITY,HOUSE_CAPACITY,housingCapacity,FOOD_PER_RESIDENT,WATER_PER_RESIDENT} from './labor.js';
// Resource harvesting and workshop output require three times more working time.
// Movement, building construction, troop training and food consumption are unchanged.
export const RESOURCE_PRODUCTION_MULTIPLIER=1/4.5;
export const RESOURCE_NAMES={wood:'Puit',plank:'Lauad',stone:'Kivi',grain:'Vili',flour:'Jahu',water:'Vesi',bread:'Leib',ore:'Maak',coal:'Süsi',iron:'Raud',weapons:'Relvad',gold:'Kuld',paper:'Paber',saltpeter:'Salpeeter',gunpowder:'Püssirohi',steel:'Teras',machines:'Masinad',oil:'Nafta',fuel:'Kütus',power:'Elektrienergia',vehicles:'Sõidukid',clay:'Savi',pottery:'Keraamika',cutstone:'Tahutud kivi',copper:'Vask',tin:'Tina',bronze:'Pronks',carts:'Vankrid'};
export const MATERIAL_KEYS=new Set(["wood","stone","plank","ore","coal","iron","weapons","paper","saltpeter","gunpowder","steel","machines","oil","fuel","vehicles","clay","pottery","cutstone","copper","tin","bronze","carts"]);
export const FOOD_KEYS=new Set(["bread","grain","flour",...Object.keys(GOODS).filter(k=>GOODS[k].food)]);
// The town eats prepared food first. Grain is edible as porridge in emergencies;
// flour needs extra preparation. Returned quantity is edible meal equivalents.
export const FOOD_NUTRITION={bread:1,flour:.85,grain:.70,...Object.fromEntries(Object.keys(GOODS).filter(k=>GOODS[k].food).map(k=>[k,1]))};
export function takeFood(stock,meals){
 let need=Math.max(0,meals),served=0;
 for(const key of [...FOOD_KEYS].sort((a,b)=>(stock[b]||0)-(stock[a]||0))){
  if(need<=1e-7)break;
  const nutrition=FOOD_NUTRITION[key],available=Math.max(0,stock[key]||0),units=Math.min(available,need/nutrition);
  stock[key]=Math.max(0,available-units);served+=units*nutrition;need-=units*nutrition;
 }
 return served;
}
// Reserve food storage for processing; raw crops must not fill every shelf.
export function foodProductionAllowed(stock,cargo,key,rate,cap,input={}){
 if(!Number.isFinite(cap))return true;
 const pending=cargo.filter(c=>FOOD_KEYS.has(c.key)).reduce((v,c)=>v+c.amount,0);
 const used=[...FOOD_KEYS].reduce((v,k)=>v+(stock[k]||0),0)+pending;
 const outputStock=(stock[key]||0)+cargo.filter(c=>c.key===key).reduce((v,c)=>v+c.amount,0);
 const rawShare=key==='grain'?.55:key==='flour'?.42:1;
 if(outputStock+rate>cap*rawShare+1e-7)return false;
 // Conversion can operate in a full cellar when its inputs make room.
 const reclaim=Object.entries(input).filter(([k])=>FOOD_KEYS.has(k)).reduce((n,[,amount])=>n+amount,0);
 return used-reclaim+rate<=cap+1e-7;
}

export function storageLimit(buildings,key){const ready=buildings.filter(b=>b.ready&&b.hp>0&&!b.virtual);const count=type=>ready.filter(b=>b.type===type).length;const halls=Math.max(1,count("hall"));if(key==="gold")return Infinity;if(key==="power")return 100;if(key==="water")return 100*halls;if(FOOD_KEYS.has(key))return 100*halls+200*count("cellar")+60*count("pottery_kiln");if(MATERIAL_KEYS.has(key))return 120*halls+300*count("warehouse");return Infinity}
export const START={wood:68,plank:10,stone:18,grain:0,flour:0,water:28,bread:26,ore:0,coal:0,iron:0,weapons:0,paper:0,saltpeter:0,gunpowder:0,steel:0,machines:0,oil:0,fuel:0,power:0,vehicles:0,gold:90,clay:0,pottery:0,cutstone:0,copper:0,tin:0,bronze:0,carts:0};
// Rolling minute buckets record goods actually received, not theoretical output.
export function recordDelivery(realm,seconds,key,amount){
 if(!amount||amount<=0)return;
 const minute=Math.floor(seconds/60),history=realm.deliveryHistory??={};
 const bucket=history[minute]??={};bucket[key]=(bucket[key]||0)+amount;
 for(const old of Object.keys(history))if(+old<minute-5)delete history[old];
}
export function deliveredPerMinute(realm,seconds,key,minutes=5){
 const end=Math.floor(seconds/60),history=realm.deliveryHistory||{};
 const total=Object.entries(history).filter(([minute])=>+minute>=end-minutes+1&&+minute<=end).reduce((sum,[,bucket])=>sum+(bucket[key]||0),0);
 // Partial opening window: avoid dividing by a full five minutes early on.
 return total/Math.min(minutes,Math.max(1,Math.ceil(seconds/60)));
}

export const BUILDINGS={
hall:{name:'Pealinn',icon:'♜',cost:{},hp:1200,requires:[],workers:0,time:0},
lumber:{name:'Metsamaja',icon:'♧',cost:{wood:20},requires:['hall'],workers:2,time:12,out:'wood',rate:12,cycle:6},
forester:{name:'Metsniku maja',icon:'♧',cost:{wood:20,plank:10},requires:['lumber'],workers:2,time:16,rate:16,cycle:6},
saw:{name:'Saeveski',icon:'⚒',cost:{wood:25,stone:8},requires:['lumber'],workers:2,time:16,input:{wood:4},out:'plank',rate:6,cycle:9},
quarry:{name:'Kivimurd',icon:'◆',cost:{wood:20,plank:8},requires:['lumber'],workers:2,time:16,out:'stone',rate:9,cycle:6},
house:{name:'Elamu',icon:'⌂',cost:{plank:18,stone:8},requires:['saw'],workers:0,time:15},
well:{name:'Kaev',icon:'◉',cost:{wood:15,stone:8},requires:['quarry'],workers:1,time:12,out:'water',rate:8,cycle:8},
farm:{name:'Talu',icon:'♧',cost:{wood:25,plank:12},requires:['saw','quarry'],workers:3,time:20,out:'grain',rate:14,cycle:10},
mill:{name:'Veski',icon:'✣',cost:{plank:20,stone:12},requires:['farm'],workers:2,time:20,input:{grain:10},out:'flour',rate:10,cycle:9},
bakery:{name:'Pagariäri',icon:'♨',cost:{plank:20,stone:15},requires:['mill','well'],workers:2,time:20,input:{flour:12,water:2},out:'bread',rate:12,cycle:10},
mine:{name:'Rauakaevandus',icon:'◆',cost:{plank:25,stone:20},requires:['bakery'],workers:3,time:24,input:{bread:1},out:'ore',rate:6,cycle:8},
coal:{name:'Söepõletaja',icon:'♨',cost:{wood:25,plank:15},requires:['bakery'],workers:2,time:20,input:{wood:4},out:'coal',rate:5,cycle:10},
smelter:{name:'Rauasulatus',icon:'♨',cost:{plank:25,stone:20},requires:['mine','coal'],workers:3,time:24,input:{ore:3,coal:2},out:'iron',rate:3,cycle:12},
smith:{name:'Relvasepp',icon:'⚒',cost:{plank:30,stone:25},requires:['smelter'],workers:2,time:24,input:{iron:2,plank:1},out:'weapons',rate:2,cycle:12},
barracks:{name:'Kasarm',icon:'⚑',cost:{plank:35,stone:25},requires:['smith','bakery','house'],workers:2,time:25},
archery:{name:'Lasketiir',icon:'➶',cost:{plank:30,stone:15},requires:['barracks'],workers:1,time:20},
stable:{name:'Tall',icon:'♞',cost:{plank:45,stone:30},requires:['barracks','house'],workers:2,time:25}
};
installGoods(BUILDINGS,RESOURCE_NAMES,START,MATERIAL_KEYS);
export const RECRUITS={infantry:{requires:['barracks'],cost:{gold:40,bread:8,weapons:2},pop:3},archer:{requires:['barracks','archery'],cost:{gold:45,bread:8,weapons:2},pop:3},cavalry:{requires:['barracks','stable'],cost:{gold:70,bread:12,weapons:3},pop:3}};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function realm(){return {resources:{...START},pop:3,tech:0,aiClock:0,log:[]}}
export function initialState(seed,type='continents'){return {economyVersion:2,time:0,realms:Array.from({length:4},()=>realm()),resources:{...START},pop:3,tech:0,settlers:[{team:0,x:-8,z:0,target:null,founded:false},{team:1,x:-8,z:0,target:null,founded:false}],buildings:[],units:[],cargo:[],ended:false,world:{seed,type}}}
export function migrateEconomy(s){s.settlers??=[0,1].map(team=>{const hall=s.buildings.find(b=>b.team===team&&b.type==='hall');return {team,x:hall?.x??-8,z:hall?.z??0,target:null,founded:!!hall}});if(!s.realms){s.realms=Array.from({length:4},()=>realm());s.realms[0].resources={...START,...s.resources};s.realms[0].pop=s.pop??3;s.realms[0].tech=s.tech||0}while(s.realms.length<4)s.realms.push(realm());for(const r of s.realms){for(const k of Object.keys(START))r.resources[k]??=0;r.log??=[];r.aiClock??=0}for(const b of s.buildings)if(b.type==='mine'&&s.economyVersion!==2)b.type='quarry';s.economyVersion=2;s.resources=s.realms[0].resources;s.pop=s.realms[0].pop;s.tech=s.realms[0].tech;return s}
export function ready(s,team,type){return s.buildings.some(b=>b.team===team&&b.type===type&&b.ready&&b.hp>0)}
export function requirement(s,team,type){const missing=(BUILDINGS[type]?.requires||[]).filter(k=>!ready(s,team,k));return missing.length?'Vaja: '+missing.map(k=>BUILDINGS[k].name).join(', '):''}
export function canAfford(resources,cost){const available={...resources};for(const[k,v]of Object.entries(cost)){if(k==='bread')continue;if((available[k]||0)<v)return false;available[k]-=v;}return !cost.bread||Object.entries(FOOD_NUTRITION).reduce((n,[key,nutrition])=>n+Math.max(0,available[key]||0)*nutrition,0)>=cost.bread}
export function spendResources(r,cost){for(const[k,v]of Object.entries(cost))if(k!=='bread')r[k]-=v;if(cost.bread)takeFood(r,cost.bread);}
const spend=spendResources;
function log(s,team,text){const list=s.realms[team].log;list.push({time:Math.floor(s.time),text});if(list.length>80)list.shift()}
export function buildRule(s,team,type,at,env){const d=BUILDINGS[type],r=s.realms[team];if(!d||type==='hall')return {error:'Seda hoonet ei saa ehitada.'};const locked=env.requirement?env.requirement(type,team):requirement(s,team,type);if(locked)return {error:locked};if(!canAfford(r.resources,d.cost))return {error:'Ehitusmaterjale ei jätku.'};if(s.buildings.filter(b=>b.team===team&&!b.ready).length>=12)return {error:'Ehitusjärjekord on täis (12).'};if(!env.passable(at.x,at.z,team))return {error:'Ehitada saab ainult kuival maal.'};if((env.nearBuildings?env.nearBuildings(at):s.buildings).some(b=>b.team===team&&!b.virtual&&distance(b,at)<6))return {error:'Teine hoone on liiga lähedal.'};const links=s.buildings.map((b,i)=>({b,i})).filter(({b})=>b.team===team&&b.ready&&(env.unlimitedBuildingRange||distance(b,at)<=13)&&(!env.segmentDry||env.unlimitedBuildingRange||env.segmentDry(b,at,team))).sort((a,b)=>distance(a.b,at)-distance(b.b,at));if(env.canBuild&&!env.canBuild(at,type,team))return {error:'Ehituskoht või maardla ligipääs on blokeeritud.'};return links.length?{parent:links[0].i}:{error:'Puudub teeühendus oma valmis hoonega (kuni 13 sammu).'}}
export function placeBuilding(s,team,type,at,env){const check=buildRule(s,team,type,at,env);if(check.error)return check;const d=BUILDINGS[type];spend(s.realms[team].resources,d.cost);const b={type,x:at.x,z:at.z,team,hp:350,ready:false,progress:0,parent:check.parent,timer:0,materialsRemaining:Object.values(d.cost).reduce((a,n)=>a+n,0),materialsTotal:Object.values(d.cost).reduce((a,n)=>a+n,0)};s.buildings.push(b);log(s,team,'Ehitus: '+d.name);env.onPlaced?.(b);return {building:b}}
export function recruitRule(s,team,kind){const d=RECRUITS[kind],r=s.realms[team];if(!d)return 'Tundmatu üksus.';const missing=d.requires.filter(k=>!ready(s,team,k));if(missing.length)return 'Vaja: '+missing.map(k=>BUILDINGS[k].name).join(', ');if(!canAfford(r.resources,d.cost))return 'Vaja kulda, leiba ja relvi.';if(r.pop<d.pop+6)return 'Vaja rohkem elanikke.';const army=s.campaign?.armies[team];if(army&&s.units.some(u=>u.team===team&&u.hp>0)&&(army.c!==(team?17:10)||army.r!==(team?9:11)))return 'Värbamiseks too armee oma linna tagasi.';return ''}
export function recruitUnit(s,team,kind,stats){const error=recruitRule(s,team,kind);if(error)return {error};const d=RECRUITS[kind],r=s.realms[team],h=s.buildings.find(b=>b.team===team&&b.type==='hall');spend(r.resources,d.cost);r.pop-=d.pop;const army=s.campaign?.armies[team];if(army&&!s.units.some(u=>u.team===team&&u.hp>0)){army.c=team?17:10;army.r=team?9:11;army.path=[]}const unit={kind,team,x:h.x,z:h.z+6,hp:stats[kind].hp,morale:100,formation:'line',target:null,cool:0};s.units.push(unit);log(s,team,'Värvati '+kind);return {unit}}
export function phase(s,team){const stages=[['Asutamine',['lumber','saw','quarry']],['Toiduvarustus',['house','well','farm','mill','bakery']],['Metallitöö',['mine','coal','smelter','smith']],['Sõjavägi',['barracks','archery']]];for(let i=0;i<stages.length;i++){const[name,types]=stages[i],missing=types.filter(k=>!ready(s,team,k));if(missing.length)return {index:i,name,next:missing[0],done:types.length-missing.length,total:types.length}}return {index:4,name:'Valmis kuningriik',next:null,done:1,total:1}}
export function tickEconomy(s,dt,env={}){if(s.ended||dt<=0)return;const before=Math.floor(s.time/60);s.time+=dt;let changed=false;for(const team of s.realms.map((_,i)=>i)){const r=s.realms[team],buildings=s.buildings.filter(b=>b.team===team);const budget=env.workerBudget?.(team)??r.pop,total=buildings.reduce((n,b)=>n+demand(b,BUILDINGS),0),ratio=total?Math.min(1,budget/total):0;let employed=0;for(const b of buildings){const d=BUILDINGS[b.type],need=demand(b,BUILDINGS),assigned=env.assigned?env.assigned(b):need*ratio;b.assigned=assigned;b.efficiency=workerEfficiency(assigned,need);const workDt=dt*b.efficiency*(env.productionBonus?.(b)||1);employed+=assigned;if(b.disabled){b.status='Peatatud';continue}if(env.canOperate&&!env.canOperate(b)){b.status='Vajab järgmist ajastut';continue}if(need&&!assigned){b.status=d.out&&env.storageCap&&env.storageUsed&&env.storageUsed(team,d.out,r.resources)>=env.storageCap(team,d.out)?'Ladu täis: '+RESOURCE_NAMES[d.out]:d.input&&!canAfford(r.resources,d.input)?'Ootab: '+Object.entries(d.input).filter(([k,v])=>(r.resources[k]||0)<v).map(([k])=>RESOURCE_NAMES[k]).join(', '):'Ootab tööjõudu';continue}if(!b.ready){const work=env.buildWork?env.buildWork(b,workDt):workDt;b.progress=(b.progress||0)+work;b.status='Ehitab · '+Math.round(b.efficiency*100)+'% tööjõud';if(b.progress+1e-8>=(env.buildTime?.(b.type,d.time)??d.time)){b.ready=true;changed=true;log(s,team,'Valmis: '+d.name)}continue}if(b.type==='forester'){env.plant?.(b,d,workDt);if(!env.plant)b.status='Ootab istutust';continue}if(!d.out){if(['study','scriptorium','academy','university','monastery','chapel','observatory','polytechnic','laboratory'].includes(b.type)){const worked=env.operateWork?env.operateWork(b,workDt):workDt;b.researchActivity=workDt>0?Math.min(1,worked/workDt):0;b.status=worked>0?'Õpetlased uurivad':'Õpetlased liiguvad töökohale'}else b.status='Valmis';continue}const pending=s.cargo.filter(c=>c.team===team),cap=env.storageCap?.(team,d.out)??Infinity;
  const full=FOOD_KEYS.has(d.out)?!foodProductionAllowed(r.resources,pending,d.out,d.rate,cap,d.input):
   (env.storageUsed?.(team,d.out,r.resources)??(r.resources[d.out]||0))+pending.filter(c=>(env.sameStorageGroup?.(c.key,d.out)??c.key===d.out)).reduce((n,c)=>n+c.amount,0)>=cap;
  if(full){b.status='Ladu täis: '+RESOURCE_NAMES[d.out];continue}if(d.input&&!canAfford(r.resources,d.input)){b.status='Ootab: '+Object.entries(d.input).filter(([k,v])=>r.resources[k]<v).map(([k])=>RESOURCE_NAMES[k]).join(', ');continue}if(env.harvest&&(['lumber','quarry','mine','hunter','fisher'].includes(b.type)||env.isDepositBuilding?.(b.type))){const amount=env.harvest(b,d,workDt,RESOURCE_PRODUCTION_MULTIPLIER);if(amount>0){if(d.input)spend(r.resources,d.input);const point=env.spawnPoint?.(b)||b;s.cargo.push({x:point.x,z:point.z,key:d.out,amount,parent:b.parent??s.buildings.findIndex(h=>h.team===team&&h.type==='hall'),team})}continue}b.status='Toodab · '+Math.round(b.efficiency*100)+'%';b.timer=(b.timer||0)+(env.operateWork?env.operateWork(b,workDt):workDt)*RESOURCE_PRODUCTION_MULTIPLIER;if(b.timer+1e-8>=d.cycle){b.timer=Math.max(0,b.timer-d.cycle);if(d.input)spend(r.resources,d.input);if(d.out==='power'){r.resources.power=Math.min(env.storageCap?.(team,'power')??100,(r.resources.power||0)+d.rate)}else{const point=env.spawnPoint?.(b)||b;s.cargo.push({x:point.x,z:point.z,key:d.out,amount:d.rate,parent:b.parent??s.buildings.findIndex(h=>h.team===team&&h.type==='hall'),team})}}}r.employed=employed}
for(const c of [...s.cargo]){const h=s.buildings.find(b=>b.team===c.team&&b.type==='hall'),depotType=MATERIAL_KEYS.has(c.key)?'warehouse':FOOD_KEYS.has(c.key)?'cellar':null,depot=depotType?s.buildings.find(b=>b.team===c.team&&b.type===depotType&&b.ready&&b.hp>0):null,target=depot||s.buildings[c.parent]||h,p=env.spawnPoint?.(target)||target;let arrived;if(env.moveCargo)arrived=env.moveCargo(c,p,dt);else{const delta=distance(c,p),step=dt*4;arrived=delta<=step+.1;if(!arrived){c.x+=(p.x-c.x)/delta*step;c.z+=(p.z-c.z)/delta*step}}if(arrived){if(!env.moveCargo){c.x=p.x;c.z=p.z}if(target.parent!=null&&!depot)c.parent=target.parent;else{const stock=s.realms[c.team].resources,free=Math.max(0,(env.storageCap?.(c.team,c.key)??Infinity)-(env.storageUsed?.(c.team,c.key,stock)??(stock[c.key]||0))),unloaded=Math.min(c.amount,free);stock[c.key]=(stock[c.key]||0)+unloaded;recordDelivery(s.realms[c.team],s.time,c.key,unloaded);c.amount-=unloaded;if(c.amount<=0.00001)s.cargo.splice(s.cargo.indexOf(c),1);else c.status='Ladu täis'}}}
if(Math.floor(s.time/60)>before)for(const team of s.realms.map((_,i)=>i)){
 if(env.skipDemographics||!ready(s,team,'hall'))continue;
 const r=s.realms[team],cap=env.capacity?.(team)??housingCapacity(s.buildings.filter(b=>b.team===team));
 const foodNeed=Math.round(r.pop*FOOD_PER_RESIDENT*100)/100;
 const waterNeed=Math.round(r.pop*WATER_PER_RESIDENT*100)/100;
 r.resources.gold+=r.pop;
 r.housingCapacity=cap;r.householdNeed=foodNeed;r.foodNeed=foodNeed;r.waterNeed=waterNeed;
 let supplied;
 if(env.consumeHouseholds)supplied=env.consumeHouseholds(team,r,foodNeed,waterNeed);
 else{const food=takeFood(r.resources,foodNeed),water=Math.min(waterNeed,r.resources.water||0);
   r.resources.water=Math.max(0,(r.resources.water||0)-water);
   supplied=food+1e-6>=foodNeed&&water+1e-6>=waterNeed;}
 r.housingShortage=!supplied;
 r.growthProgress??=0;
 r.growthNeed=(2.3+r.pop*.28)*(env.growthFactor||1);
 if(supplied){
   r.shortageTurns=0;
   if(r.pop<cap){
     const reserves=(r.resources.bread>=r.pop*2&&r.resources.water>=r.pop*1.5)?1.2:1;
     r.growthProgress+=reserves;
     if(r.growthProgress>=r.growthNeed){r.growthProgress-=r.growthNeed;r.pop++;log(s,team,'Linna tuli uus elanik');}
   }else r.growthProgress=Math.min(r.growthProgress,r.growthNeed);
 }else{
   r.growthProgress=Math.max(0,r.growthProgress-.7);
   r.shortageTurns=(r.shortageTurns||0)+1;
   if(r.shortageTurns>=3){r.shortageTurns=0;r.pop=Math.max(3,Math.min(cap,r.pop-1));log(s,team,'Toidu- ja veepuudus vähendas elanikkonda')}
 }
}
s.resources=s.realms[0].resources;s.pop=s.realms[0].pop;s.tech=s.realms[0].tech;return changed}
export const AI_PLAN=['warehouse','lumber','forester','saw','quarry','house','well','farm','mill','bakery','house','mine','coal','smelter','smith','house','barracks','archery'];
export function tickAI(s,dt,env,stats){const team=1,r=s.realms[team];if(s.ended||dt<=0||!ready(s,team,'hall'))return;r.aiClock+=dt;if(r.aiClock<3)return;r.aiClock=0;const own=s.buildings.filter(b=>b.team===team),counts={};let next=null;for(const type of AI_PLAN){counts[type]=(counts[type]||0)+1;if(own.filter(b=>b.type===type).length<counts[type]){next=type;break}}if(!next){const working=own.reduce((n,b)=>n+(BUILDINGS[b.type].workers||0),0);if(r.pop<=working+5&&own.filter(b=>b.type==='house').length<8)next='house';else if(r.resources.bread<24)next='bakery';else if(r.resources.weapons<8&&own.filter(b=>b.type==='smith').length<2)next='smith'}
if(next&&!requirement(s,team,next)&&canAfford(r.resources,BUILDINGS[next].cost)){const h=own.find(b=>b.type==='hall'),spots=[];for(let dx=-24;dx<=24;dx+=6)for(let dz=-24;dz<=24;dz+=6){if(!dx&&!dz)continue;spots.push({x:h.x+dx,z:h.z+dz})}spots.sort((a,b)=>distance(a,h)-distance(b,h));for(const at of spots){const result=placeBuilding(s,team,next,at,env);if(result.building){env.onBuild?.(result.building);break}}}
const troops=s.units.filter(u=>u.team===team&&u.hp>0),inf=troops.filter(u=>u.kind==='infantry').length,arch=troops.filter(u=>u.kind==='archer').length,kind=inf<2?'infantry':arch<1?'archer':inf<4?'infantry':'archer';if(troops.length<5&&r.pop>(r.employed||0)+3){const result=recruitUnit(s,team,kind,stats);if(result.unit)env.onRecruit?.(result.unit)}if(ready(s,team,'smith')&&r.resources.iron>18&&r.resources.gold>200&&!r.tech)researchSteel(s,team);if(troops.length>=3&&inf>=2&&arch>=1&&r.resources.bread>=12&&!s.campaign?.battle)env.onAttack?.()}
export function researchSteel(s,team){const r=s.realms[team];if(r.tech)return {error:'Teras on juba uuritud.'};if(!ready(s,team,'smith'))return {error:'Ehita esmalt relvasepp.'};if(!canAfford(r.resources,{gold:80,iron:10}))return {error:'Vaja 80 kulda ja 10 rauda.'};spend(r.resources,{gold:80,iron:10});r.tech=1;log(s,team,'Uuriti terast');return {ok:true}}

export function foundationRule(s,team,at,env){
 const settler=s.settlers[team];if(!settler||settler.founded||ready(s,team,'hall'))return 'Linn on juba rajatud.';
 if(Math.abs(at.x)>42||Math.abs(at.z)>32)return 'Jäta linna ümber kasvuruumi. Vali koht kaardi keskosas.';
 for(const dx of [-4,0,4])for(const dz of [-4,0,4])if(!env.passable(at.x+dx,at.z+dz,team))return 'Pealinn vajab kuiva ehitusplatsi.';
 if(env.canBuild&&!env.canBuild(at,'hall',team))return 'Linna kohal on kivimaardla. Vali vaba plats.';
 return '';
}
export function foundCity(s,team,env){
 const settler=s.settlers[team],at={x:Math.round(settler.x),z:Math.round(settler.z)},error=foundationRule(s,team,at,env);if(error)return {error};
 if(settler.target)return {error:'Oota, kuni asunik jõuab valitud kohta.'};
 const building={type:'hall',...at,hp:1200,team,ready:true};s.buildings.push(building);settler.founded=true;settler.target=null;
 log(s,team,'Asunik rajas linna');env.onPlaced?.(building);env.onBuild?.(building);return {building};
}
