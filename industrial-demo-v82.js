// V82 industrial demonstration: ordinary V4 JSON snapshot in read-only demo mode.
import {createRenaissanceDemoState} from './renaissance-demo-v81.js?v=81a';
import {Civilization,BUILDINGS} from './civilization-core.js?v=80c';
import {grantTech} from './research.js';
import {seedCityStreetNetwork} from './town-streets-v80.js?v=80c';
import {INDUSTRIAL_BUILDING_TYPES} from './industrial-buildings-v82.js?v=82a';
export const INDUSTRIAL_DEMO_NAME='Suitsujõe tööstuslinn';
export const INDUSTRIAL_DEMO_TYPES=Object.freeze([
 'house','house','house','house','market','warehouse','cellar',
 'steelworks','engineworks','polytechnic','railstation','printer','powdermill','nitrate',
 'hall-placeholder','university','observatory','guildhall','inn','trade_yard','infirmary',
 'coal','mine','smelter','smith','saw','mill','bakery',
 'lumber','forester','quarry','mason','cartwright','road_depot','harbor',
 'barracks','stable','farm','well','chapel','monastery','watermill',
 'windmill','pottery_kiln','bronze_foundry','laboratory','powerplant','oilwell'
].filter(type=>type!=='hall-placeholder'));
export function createIndustrialDemoState(seed=20261020){
 const g=new Civilization(createRenaissanceDemoState(seed));
 const city=g.s.cities.find(c=>c.team===0);
 if(!city)throw Error('Industrial demo city missing');
 city.name=INDUSTRIAL_DEMO_NAME;
 for(const tech of ['industrialization','steelmaking','steam_engine','industrial_education','railways',
  'iron_crafts','gunpowder','printing','renaissance','smelting','smithing']){
  grantTech(g.s.research[0],tech);
 }
 g.s.ages[0]=5;
 const hall=city.economy.buildings.find(b=>b.type==='hall');
 if(!hall)throw Error('Industrial city hall missing');
 delete hall.previewAge;hall.hp=1500;hall.ready=true;
 city.economy.buildings=[hall];
 const columns=[-45,-30,-15,0,15,30,45],rows=[-39,-24,-9,8,23,38,53];
 for(const [i,type] of INDUSTRIAL_DEMO_TYPES.entries()){
  if(!BUILDINGS[type])throw Error('Unknown industrial demonstration building '+type);
  if(!INDUSTRIAL_BUILDING_TYPES.includes(type))throw Error('Industrial model missing '+type);
  const x=hall.x+columns[i%columns.length],z=hall.z+rows[Math.floor(i/columns.length)];
  city.economy.buildings.push({
   type,x,z,team:0,hp:1000,ready:true,assigned:0,previewAge:5,
   progress:BUILDINGS[type].time||0
  });
 }
 const realm=city.economy.realms[0];realm.pop=42;realm.growthProgress=0;
 Object.assign(realm.resources,{
  wood:950,stone:900,plank:650,bread:800,grain:300,water:900,
  coal:320,ore:210,iron:340,steel:220,machines:90,bronze:120,clay:90,
  pottery:80,copper:170,tin:150,oil:20,gold:450,paper:250,
  saltpeter:160,gunpowder:110
 });
 city.world.heat={};city.world.heatLast={};city.world.trailChanges=0;
 city.world.revision=(city.world.revision||0)+1;
 const network=seedCityStreetNetwork(g,city,10);
 if(network.reached<12||network.visibleCells<55)
  throw Error('Industrial city street network inaccessible '+JSON.stringify(network));
 g.s.time=310;g.s.events??=[];
 g.s.events.push({time:g.s.time,text:'V82 tööstuslinna näidis: tööstusmudelid, tänavavõrk ning vajutatavad majad.'});
 g.reveal(0,g.cell(city),2);
 return JSON.parse(JSON.stringify(g.s));
}
