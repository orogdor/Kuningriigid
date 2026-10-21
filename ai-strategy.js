import {GOOD_BUILDINGS,cityNeeds} from './city-needs-v87.js';
// V45: needs-led AI. Decisions are pure so the reasoning can be tested without a renderer.
import {ERA_MATERIALS,ageDeficit,edibleSupply} from './era-economy.js';
import {BUILDINGS} from './economy.js';
export const RESOURCE_CHAINS={
 wood:['lumber'],stone:['quarry'],bread:['hunter','fisher','farm','mill','bakery'],
 water:['well'],grain:['farm'],plank:['saw'],ore:['mine'],coal:['coal'],
 iron:['mine','coal','smelter'],weapons:['smith'],paper:['printer'],
 saltpeter:['nitrate'],gunpowder:['nitrate','coal','powdermill'],
 steel:['mine','coal','smelter','steelworks'],
 machines:['steelworks','engineworks'],oil:['oilwell'],fuel:['oilwell','refinery'],clay:['claypit'],pottery:['claypit','pottery_kiln'],cutstone:['quarry','mason'],copper:['coppermine'],tin:['tinmine'],bronze:['coppermine','tinmine','bronze_foundry'],carts:['cartwright']
};
export const RESOURCE_SITES={claypit:'clay',pasture:'grain',coppermine:'copper',tinmine:'tin',lumber:'wood',quarry:'stone',hunter:'game',fisher:'coast',well:'water',farm:'grain',mine:'ore',oilwell:'oil'};
export const CRITICAL_BUILDINGS=new Set(['lumber','quarry','well','hunter','fisher','farm','saw','mill','bakery','mine','coal','smelter','nitrate','powdermill','steelworks','engineworks','oilwell','refinery','house','warehouse','cellar','forester','claypit','pottery_kiln','pasture','mason','coppermine','tinmine','bronze_foundry','cartwright']);
function healthy(b){return b.hp>0&&!b.disabled}
export function hasWorkingSource(buildings,type){return buildings.some(b=>b.type===type&&healthy(b)&&!(b.ready&&/pole ligipääsetavat|maardla puudub/.test(b.status||'')))}
export function aiResourcePriorities(game,team,city){
 const s=game.s,stock=city.economy.realms[team].resources,pop=city.economy.realms[team].pop||3;
 const needs=s.research[team]?.ageWait?ageDeficit(s,team,s.research[team].ageWait.id):{};
 const targets={
  bread:Math.max(16,pop*6),water:Math.max(18,pop*5),wood:50,stone:32,
  plank:s.ages[team]>=1?30:0,iron:s.ages[team]>=2?18:0,
  coal:s.ages[team]>=2?12:0,gunpowder:s.ages[team]>=4?10:0,
  steel:s.ages[team]>=5?15:0,machines:s.ages[team]>=5?12:0,
  oil:s.ages[team]>=6?12:0,fuel:s.ages[team]>=6?10:0,
 };
 const values=[];
 for(const [resource,target] of Object.entries(targets)){
  const actual=resource==='bread'?edibleSupply(stock):(stock[resource]||0),shortfall=Math.max(0,target-actual);
  const ageMissing=needs[resource]||0;
  if(shortfall<=0&&ageMissing<=0)continue;
  const pressure=(resource==='bread'&&actual<pop*3?140:0)+(resource==='water'&&actual<pop*2?130:0)
   +(ageMissing>0?105:0)+Math.min(25,20*shortfall/Math.max(1,target));
  values.push({resource,target,actual,shortfall,ageMissing,pressure});
 }
 return values.sort((a,b)=>b.pressure-a.pressure);
}
function eligible(game,city,type){return !!BUILDINGS[type]&&!game.buildRule(city,type)&&game.canBuildNow(city,type)}
export function selectAIBuild(game,team,city,excluded=new Set()){
 const r=city.economy.realms[team],stock=r.resources,age=game.s.ages[team],science=game.s.research[team];
 const buildings=game.allBuildings(city);
 // Do not bankrupt a city by stacking construction orders with zero usable builders.
 const waiting=buildings.filter(b=>!b.ready&&b.hp>0&&!b.disabled);
 if(waiting.length>=3&&game.s.ages[team]>0)return null;
 const gaps=science.ageWait?ageDeficit(game.s,team,science.ageWait.id):{};
 const missing=Object.keys(gaps).length>0;
 const housing=game.allBuildings(city).filter(b=>b.type==='house'&&b.ready&&b.hp>0).length;
 const capacity=4+housing*3;
 const possibilities=[];
 const add=(type,priority,reason)=>{
  if(excluded.has(type))return;
  if(type==='house'){if(buildings.some(b=>b.type==='house'&&!b.ready&&b.hp>0))return;}
  else if(hasWorkingSource(buildings,type)){
   const foodExpansion=['hunter','fisher'].includes(type)&&r.pop>=5&&edibleSupply(stock)<r.pop*3&&!buildings.some(b=>['hunter','fisher','farm','bakery'].includes(b.type)&&!b.ready&&b.hp>0&&!b.disabled);
   if(!foodExpansion)return;
  }
  // Prevent the AI from wasting a whole town's labour on repeated quarries.
  if(['quarry','lumber','hunter','fisher','well','farm'].includes(type)&&buildings.filter(b=>b.type===type&&b.hp>0).length>=(['hunter','fisher'].includes(type)?3:2))return;
  if(type==='harbor'&&buildings.some(b=>b.type==='harbor'&&b.hp>0))return;
  if(!eligible(game,city,type))return;
  // While saving for an era, build only a resource-producing dependency,
  // storage, or indispensable housing. No military or cosmetic construction.
  if(missing&&!CRITICAL_BUILDINGS.has(type))return;
  possibilities.push({type,priority,reason});
 };
 const happiness=cityNeeds(city,age);if(happiness.missing)for(const [type,d] of Object.entries(GOOD_BUILDINGS)){if(d.age<=age&&(stock[d.out]||0)<happiness.threshold*3)add(type,101,'Linna mitmekesisus');}
 // Maintain an early, diverse economy. The first source is important even
 // when current stores are high; dependence on initial stocks is not viable.
 for(const [type,priority] of [['lumber',125],['well',118],['hunter',115],['fisher',109],['farm',105],['quarry',103],['study',98]])add(type,priority,'Algmajandus');
 if(science.known.includes('shipbuilding')&&!game.s.ships?.some(s=>s.team===team&&s.hp>0)&&!buildings.some(b=>b.type==='harbor'&&b.hp>0))add('harbor',136,'Väljapääs teistele mandritele');
 // Prevent permanent deforestation: start regenerating harvestable woodland
 // as soon as the forester technology is unlocked, *before* wood reaches zero.
 if(age>=1&&game.s.research[team].known.includes('forestry')&&
    (stock.wood<90||buildings.some(b=>b.type==='lumber'&&/pole ligipääsetavat/.test(b.status||'')))){
  add('forester',135,'Metsa taastamine');
 }
 const demands=aiResourcePriorities(game,team,city);
 for(const need of demands){
  const chain=RESOURCE_CHAINS[need.resource]||[];
  for(let i=0;i<chain.length;i++){
   const type=chain[i];
   add(type,need.pressure+Math.max(1,chain.length-i)*.4,'Puudus: '+need.resource);
  }
 }
 const nHouse=housing;
 if(nHouse<24&&r.pop>=capacity-1&&edibleSupply(stock)>=Math.max(5,r.pop*1.2)&&stock.water>=Math.max(5,r.pop*.9)){
  // A town capped at seven residents cannot staff its sawmill, farms,
  // universities or future industry. Housing is productive investment.
  const enoughToInvest=!missing||
   (gaps.plank>35&&(stock.plank||0)>=BUILDINGS.house.cost.plank+12)||
   (gaps.bread>0)||
   (gaps.wood>0&&(stock.wood||0)>=BUILDINGS.house.cost.wood+20);
  if(enoughToInvest)add('house',missing?131:115,'Elanike tööjõud');
 }
 const foodCap=game.storageCap(city,'bread'),materialCap=game.storageCap(city,'plank');
 const eraCost=ERA_MATERIALS[science.ageWait?.id]||{};
 if((eraCost.bread>foodCap-5||edibleSupply(stock)>=foodCap*.86)&&age>=1)add('cellar',missing?133:100,'Toiduhoidla piirang');
 if((Object.entries(eraCost).some(([k,n])=>k!=='bread'&&game.storageCap(city,k)<n)||materialCap<120&&age>=1)&&age>=1)add('warehouse',missing?134:108,'Materjalilao piirang');
 // When not bottlenecked, follow a coherent development plan.
 if(!missing){
  const development=['house','barracks','archery','watchtower','palisade','claypit','pottery_kiln','pasture','mason',
   ...(age>=1?['stonetower','stonewall','cartwright','coppermine','tinmine','bronze_foundry','road_depot','saw','warehouse','cellar','market','scriptorium','forester','mill','bakery','harbor']:[]),
   ...(age>=2?['mine','coal','smelter','smith','academy','stable']:[]),
   ...(age>=3?['guildhall','master_workshop','watermill','windmill','infirmary','trade_yard','inn','armor_workshop','crossbow_range','monastery','chapel','keep','gatehouse','siegeworkshop','reinforced_wall','university']:[]),
   ...(age>=4?['printer','observatory','nitrate','powdermill']:[]),
   ...(age>=5?['steelworks','engineworks','polytechnic','railstation']:[]),
   ...(age>=6?['oilwell','refinery','powerplant','autofactory','laboratory','airfield']:[])];
  for(let i=0;i<development.length;i++){
   if(development[i]==='house'&&nHouse>0)continue;
   add(development[i],42-i*.3,'Tavapärane areng');
  }
 }
 possibilities.sort((a,b)=>b.priority-a.priority);
 return possibilities[0]||null;
}
export function usefulDistrictTypes(game,team){
 const research=game.s.research[team];
 const cities=game.s.cities.filter(c=>c.team===team);
 if(!cities.length)return new Set();
 const needs=research?.ageWait?ageDeficit(game.s,team,research.ageWait.id):{};
 // Districts are expensive. Extend territory only when the existing town
 // cannot supply a critical raw material, rather than building quarries
 // reflexively while waiting for planks.
 const deficits=new Set();
 for(const [resource,missing] of Object.entries(needs))if(missing>0){
  for(const type of RESOURCE_CHAINS[resource]||[])if(RESOURCE_SITES[type])deficits.add(type);
 }
 const totals=Object.fromEntries(['wood','stone','bread','water','ore','oil'].map(k=>[k,cities.reduce((n,c)=>n+(k==='bread'?edibleSupply(c.economy.realms[team].resources):(c.economy.realms[team].resources[k]||0)),0)]));
 const population=cities.reduce((n,c)=>n+c.economy.realms[team].pop,0);
 if(totals.wood<40)deficits.add('lumber');
 if(totals.stone<28)deficits.add('quarry');
 if(totals.bread<population*3){deficits.add('hunter');deficits.add('fisher');deficits.add('farm')}
 if(totals.water<population*2)deficits.add('well');
 if(game.s.ages[team]>=2&&totals.ore<15)deficits.add('mine');
 if(game.s.ages[team]>=6&&totals.oil<20)deficits.add('oilwell');
 if(research?.known.includes('shipbuilding')&&!cities.some(c=>game.allBuildings(c).some(b=>b.type==='harbor'&&b.hp>0)))deficits.add('harbor');
 for(const [type,d] of Object.entries(GOOD_BUILDINGS))if(d.deposit&&d.age<=game.s.ages[team]&&cities.some(c=>cityNeeds(c,game.s.ages[team]).missing))deficits.add(type);
 return deficits;
}
