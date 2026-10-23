import {EDUCATION_TYPES} from './education-v141.js';
import {DEFENSE_TYPES} from './ai-defenses-v128.js';
import {combatUnit,militaryInfrastructure} from './ai-development-v128.js';
import {foundationNeeds,reservesFoundation} from './ai-foundation-v88.js?v=117a';
import {MINERAL_BUILDINGS} from './resource-sites-v88.js';
import {RESOURCE_BUILDINGS} from './settlement-ai-v88.js?v=125a';
import {GOOD_BUILDINGS,cityNeeds} from './city-needs-v87.js';
// V45: needs-led AI. Decisions are pure so the reasoning can be tested without a renderer.
import {ERA_MATERIALS,ageDeficit,edibleSupply} from './era-economy.js';
import {BUILDINGS,canAfford} from './economy.js';
export const RESOURCE_CHAINS={
 wood:['lumber'],stone:['quarry'],bread:['hunter','fisher','farm','mill','bakery'],
 water:['well'],grain:['farm'],plank:['lumber','saw'],ore:['mine'],coal:['coal'],
 iron:['mine','coal','smelter'],weapons:['smith'],paper:['printer'],
 saltpeter:['nitrate'],gunpowder:['nitrate','coal','powdermill'],
 steel:['mine','coal','smelter','steelworks'],
 machines:['steelworks','engineworks'],oil:['oilwell'],fuel:['oilwell','refinery'],clay:['claypit'],pottery:['claypit','pottery_kiln'],cutstone:['quarry','mason'],copper:['coppermine'],tin:['tinmine'],bronze:['coppermine','tinmine','bronze_foundry'],carts:['cartwright']
};
export const RESOURCE_SITES={claypit:'clay',coppermine:'copper',tinmine:'tin',lumber:'wood',quarry:'stone',hunter:'game',fisher:'coast',well:'water',farm:'grain',mine:'ore',oilwell:'oil'};
export const CRITICAL_BUILDINGS=new Set(['lumber','quarry','well','hunter','fisher','farm','saw','mill','bakery','mine','coal','smelter','nitrate','powdermill','steelworks','engineworks','oilwell','refinery','house','warehouse','cellar','forester','claypit','pottery_kiln','pasture','mason','coppermine','tinmine','bronze_foundry','cartwright','mason','study','scriptorium','market','road_depot','inn','trade_yard']);
for(const type of Object.keys(MINERAL_BUILDINGS))CRITICAL_BUILDINGS.add(type);
function healthy(b){return b.hp>0&&!b.disabled}
export function hasWorkingSource(buildings,type){return buildings.some(b=>b.type===type&&healthy(b)&&!(b.ready&&/pole ligipääsetavat|maardla puudub/.test(b.status||'')))}
export function aiResourcePriorities(game,team,city){
 const s=game.s,stock=city.economy.realms[team].resources,pop=city.economy.realms[team].pop||3;
 const needs=s.research[team]?.ageWait?ageDeficit(s,team,s.research[team].ageWait.id):{};
 const targets={
  bread:Math.max(16,pop*6),water:Math.max(18,pop*5),wood:50,stone:32,
  plank:s.ages[team]>=1?30:0,bronze:s.ages[team]>=1?12:0,weapons:s.ages[team]>=2?12:0,iron:s.ages[team]>=2?18:0,
  coal:s.ages[team]>=2?12:0,gunpowder:s.ages[team]>=4?10:0,
  steel:s.ages[team]>=5?15:0,machines:s.ages[team]>=5?12:0,
  oil:s.ages[team]>=6?12:0,fuel:s.ages[team]>=6?10:0,
 };
 const values=[];
 for(const [resource,target] of Object.entries(targets)){
  const actual=resource==='bread'?edibleSupply(stock):(stock[resource]||0),shortfall=Math.max(0,target-actual);
  const ageMissing=needs[resource]||0;
  if(shortfall<=0&&ageMissing<=0)continue;
  const pressure=(resource==='bread'&&actual<pop*3?260:0)+(resource==='water'&&actual<pop*2?250:0)
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
 if(waiting.length>=3)return null; // V139: complete work already in progress before funding another project
 const gaps=science.ageWait?ageDeficit(game.s,team,science.ageWait.id):{};
 const missing=Object.keys(gaps).length>0;
 const housing=game.allBuildings(city).filter(b=>b.type==='house'&&b.ready&&b.hp>0).length;
 const capacity=4+housing*1.5;
 const possibilities=[],visiting=new Set();
 const add=(type,priority,reason)=>{
  if(excluded.has(type)||DEFENSE_TYPES.has(type))return;
  if(type==='farm'&&!game.cell(city)?.deposits.grain)return;
  if(type==='house'){if(buildings.some(b=>b.type==='house'&&!b.ready&&b.hp>0))return;}
  else if(hasWorkingSource(buildings,type)){
   const foodExpansion=['hunter','fisher'].includes(type)&&r.pop>=5&&edibleSupply(stock)<r.pop*3&&!buildings.some(b=>['hunter','fisher','farm','bakery'].includes(b.type)&&!b.ready&&b.hp>0&&!b.disabled);
   if(!foodExpansion)return;
  }
  // Prevent the AI from wasting a whole town's labour on repeated quarries.
  if(['quarry','lumber','hunter','fisher','well','farm'].includes(type)&&buildings.filter(b=>b.type===type&&b.hp>0).length>=(['hunter','fisher'].includes(type)?3:2))return;
  if(type==='harbor'&&buildings.some(b=>b.type==='harbor'&&b.hp>0))return;
  if(!eligible(game,city,type)){if(!game.buildRule(city,type)){city.aiImportRequestsV128??={};for(const [k,n]of Object.entries(BUILDINGS[type]?.cost||{}))if((stock[k]||0)<n+4)city.aiImportRequestsV128[k]=Math.max(city.aiImportRequestsV128[k]||0,n+4);}if(!visiting.has(type)){visiting.add(type);for(const dep of BUILDINGS[type]?.requires||[])if(!game.cityReady(city,dep))add(dep,priority+.5,'Eeltingimus: '+type);visiting.delete(type);}return;}
  if(reservesFoundation(game,city,type))return;
  // While saving for an era, build only a resource-producing dependency,
  // storage, or indispensable housing. No military or cosmetic construction.
  if(missing&&!CRITICAL_BUILDINGS.has(type)&&!['barracks','archery','stable','armor_workshop','crossbow_range','siegeworkshop','market','harbor','inn','trade_yard'].includes(type))return;
  possibilities.push({type,priority,reason});
 };
 for(const [i,type] of foundationNeeds(game,city).entries())add(type,220-i,'Linna põhiehitis');
 for(const resource of city.resourceSpecialization||[])add(RESOURCE_BUILDINGS[resource],139,'Puuduva riigiressursi tootmine');
 // War production is an economic workstream, not a last-priority luxury.
 // The first barracks must be built before training can ever occur.
 const defending=game.s.units.filter(u=>u.team===team&&combatUnit(u)&&!u.garrison).length;
 if(defending<Math.min(20,game.s.cities.filter(c=>c.team===team).length*2+age*2+3))for(const [id,priority]of militaryInfrastructure(game,team,city))add(id,priority,'Ajastule vastava sõjaväe varustamine');
 // V146: a large town should secure its historical core without taking
 // investment away from housing, food, the first market, or basic science.
 // Mason is a real production prerequisite for the first stone wall.
 const hasCivic=buildings.some(b=>b.type==='market'&&b.ready&&b.hp>0);
 if(age>=1&&r.pop>=11&&hasCivic&&edibleSupply(stock)>=r.pop*2.3&&
    (stock.stone||0)>=45){
  if((stock.cutstone||0)<26&&!buildings.some(b=>b.type==='mason'&&b.hp>0))add('mason',r.pop>=14?251:215,'Kiviraidur linnamüüri rajamiseks');
  if(!buildings.some(b=>b.type==='barracks'&&b.hp>0))add('barracks',r.pop>=14?245:201,'Kodanike ja linnamüüri kaitsjate väljaõpe');
 }
 // V136: every established town needs civic functions, not only production buildings.
 // A Bronze settlement without a marketplace is still a village; reserve time
 // for civic construction even during long era-research material shortages.
 if(age>=1&&r.pop>=5)add('market',244,'Ajaloolise linnasüdame oluline turuplats');
 if(age>=1&&r.pop>=8)add('warehouse',172,'Kaubanduse ja ehitusmaterjalide põhilaod');
 if(age>=1&&r.pop>=10)add('cellar',168,'Linnakodanike ühine toidukelder');
 if(age>=3&&r.pop>=11){
  add('inn',129,'Ajalooline võõrastemaja');
  add('trade_yard',126,'Kaupmeeste õu');
 }
 // Central civic services are not decoration. Ensure every district capital
 // prioritises one operational research, storage, water and market facility.
 if(r.pop>=5)add(game.obsoleteBuilding?.(team,'study')||'study',226,'Teaduse ja hariduse keskne töökoht');
 if(r.pop>=6){const existingEducation=buildings.some(b=>EDUCATION_TYPES.includes(b.type)&&b.hp>0&&!b.disabled);if(!existingEducation)for(const type of ['study','scriptorium','library','school'])add(type,200,'Linna esimene haridusasutus');}
 if(r.pop>=11)for(const type of ['scriptorium','library','school','academy'])add(type,141,'Hariduse järgmine tase');
 if(age>=1&&r.pop>=9)add('scriptorium',164,'Ajaloolise linna kirjutuskoda');
 if(age>=1&&r.pop>=12)add('road_depot',126,'Linna peatänavate ja teede korrashoid');
 if(age>=1&&r.pop>=10&&game.cell(city)?.coast)add('harbor',151,'Rannikulinna vajalik sadam');
 const role=city.economicRole||'trade';
 const roleBuilds={
  food:['farm','pasture','mill','bakery','watermill'],
  timber:['lumber','saw','forester','cartwright'],
  industry:['mine','coal','smelter','steelworks','engineworks'],
  energy:['oilwell','refinery','powerplant','engineworks'],
  port:['fisher','harbor','warehouse','cartwright'],
  trade:['market','warehouse','saw','trade_yard']
 };
 for(const [i,type] of (roleBuilds[role]||[]).entries())
    if(age>=0)add(type,missing?178-i:142-i,'Specialist town: '+role);
 // Heavy industry is a chain, not an isolated factory. Prioritize a supply
 // depot where the current factory requires goods from a different town.
 for(const type of ['steelworks','engineworks']){
  const existing=buildings.find(b=>b.type===type&&b.ready&&b.hp>0);
  if(existing){city.importRequests??={};
    const inputs=BUILDINGS[type]?.input||{};
    for(const [resource,n]of Object.entries(inputs))
      city.importRequests[resource]=Math.max(city.importRequests[resource]||0,n*12);
  }
 }
 
 const happiness=cityNeeds(city,age);if(happiness.missing&&r.pop>=14&&defending>=Math.min(4,age+1))for(const [type,d] of Object.entries(GOOD_BUILDINGS)){if(d.age<=age&&(stock[d.out]||0)<happiness.threshold*3)add(type,101,'Linna mitmekesisus');}
 // Maintain an early, diverse economy. The first source is important even
 // when current stores are high; dependence on initial stocks is not viable.
 for(const [type,priority] of [['lumber',125],['well',118],['hunter',115],['fisher',109],['farm',146],['quarry',103],[game.obsoleteBuilding?.(team,'study')||'study',98]])add(type,priority,'Algmajandus');
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
 const desiredHouses=Math.min(70,Math.ceil((r.pop+3)/1.5));
 if(nHouse<desiredHouses&&canAfford(stock,BUILDINGS.house.cost)){
  // A town capped at seven residents cannot staff its sawmill, farms,
  // universities or future industry. Housing is productive investment.
  const enoughToInvest=!missing||
   (gaps.plank>35&&(stock.plank||0)>=BUILDINGS.house.cost.plank+12)||
   (gaps.bread>0)||
   (gaps.wood>0&&(stock.wood||0)>=BUILDINGS.house.cost.wood+20);
  if(enoughToInvest||capacity<=r.pop+1.5)add('house',r.pop>=capacity-2?238:missing?104:112,'Eluruumid ja järgmise rahvastikukasvu varu');
 }
 const foodCap=game.storageCap(city,'bread'),materialCap=game.storageCap(city,'plank');
 const eraCost=ERA_MATERIALS[science.ageWait?.id]||{};
 if((eraCost.bread>foodCap-5||edibleSupply(stock)>=foodCap*.86)&&age>=1)add('cellar',missing?133:100,'Toiduhoidla piirang');
 if((Object.entries(eraCost).some(([k,n])=>k!=='bread'&&game.storageCap(city,k)<n)||materialCap<120&&age>=1)&&age>=1)add('warehouse',missing?134:108,'Materjalilao piirang');
 // When not bottlenecked, follow a coherent development plan.
 if(!missing){
  const development=['house','barracks','archery','watchtower','palisade','claypit','pottery_kiln','pasture','mason',
   ...(age>=1?['stonetower','stonewall','cartwright','coppermine','tinmine','bronze_foundry','road_depot','saw','warehouse','cellar','market','scriptorium','forester','mill','bakery','harbor']:[]),
   ...(age>=2?['mine','coal','smelter','smith','academy','stable','siegeworkshop']:[]),
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
export function usefulDistrictTypes(game,team,localCity=null){
 const research=game.s.research[team];
 const cities=localCity?[localCity]:game.s.cities.filter(c=>c.team===team);
 if(!cities.length)return new Set();
 const needs=research?.ageWait?ageDeficit(game.s,team,research.ageWait.id):{};
 // Districts are expensive. Extend territory only when the existing town
 // cannot supply a critical raw material, rather than building quarries
 // reflexively while waiting for planks.
 const deficits=new Set();
 for(const [resource,missing] of Object.entries(needs))if(missing>0){
  for(const type of RESOURCE_CHAINS[resource]||[])if(RESOURCE_SITES[type])deficits.add(type);
 }
 const totals=Object.fromEntries(['wood','stone','bread','water','ore','oil','copper','tin','bronze'].map(k=>[k,cities.reduce((n,c)=>n+(k==='bread'?edibleSupply(c.economy.realms[team].resources):(c.economy.realms[team].resources[k]||0)),0)]));
 const population=cities.reduce((n,c)=>n+c.economy.realms[team].pop,0);
 if(totals.wood<40)deficits.add('lumber');
 if(totals.stone<28)deficits.add('quarry');
 if(totals.bread<population*3){deficits.add('hunter');deficits.add('fisher');deficits.add('farm')}
 if(totals.water<population*2)deficits.add('well');
 if(game.s.ages[team]>=1&&totals.bronze<16){if(totals.copper<20)deficits.add('coppermine');if(totals.tin<16)deficits.add('tinmine');}
 if(game.s.ages[team]>=2&&totals.ore<15)deficits.add('mine');
 if(game.s.ages[team]>=6&&totals.oil<20)deficits.add('oilwell');
 if(research?.known.includes('shipbuilding'))deficits.add('harbor');
 for(const [type,d] of Object.entries(GOOD_BUILDINGS))if(d.deposit&&d.age<=game.s.ages[team]&&cities.some(c=>cityNeeds(c,game.s.ages[team]).missing))deficits.add(type);
 return deficits;
}
