// V82 Industrial Revolution sample, ordinary read-only-compatible V4 game state.
// Generates a dense town with factories, research, railways and natural footpaths.
import {createRenaissanceDemoState} from './renaissance-demo-v81.js?v=81a';
import {Civilization,BUILDINGS} from './civilization-core.js?v=115a';
import {grantTech} from './research.js?v=115a';
import {seedCityStreetNetwork} from './town-streets-v80.js?v=80c';
import {INDUSTRIAL_BUILDING_TYPES} from './industrial-buildings-v82.js?v=82a';

export const INDUSTRIAL_DEMO_NAME='Aurulinna tööstuslinn';
export const INDUSTRIAL_DEMO_TYPES=Object.freeze([
 'house','house','house','house','market','warehouse','cellar',
 'steelworks','engineworks','polytechnic','railstation','printer','university','observatory',
 'powdermill','nitrate','smith','smelter','saw','mill','bakery','watermill',
 'windmill','road_depot','cartwright','trade_yard','guildhall','infirmary',
 'stable','barracks','lumber','quarry','mine','coal','farm',
 'well','inn','chapel','harbor','foundry','academy'
].filter(type=>!!BUILDINGS[type]&&INDUSTRIAL_BUILDING_TYPES.includes(type)));

export function createIndustrialDemoState(seed=20261020){
 const initial=createRenaissanceDemoState(seed),g=new Civilization(initial);
 const city=g.s.cities.find(c=>c.team===0);
 if(!city)throw Error('Industrial demonstration city missing');
 city.name=INDUSTRIAL_DEMO_NAME;
 for(const tech of ['industrialization','steelmaking','steam_engine','industrial_education','railways',
  'renaissance','printing','gunpowder','iron_crafts','smithing','milling'])
  grantTech(g.s.research[0],tech);
 g.s.ages[0]=5;
 const hall=city.economy.buildings.find(b=>b.type==='hall');
 if(!hall)throw Error('Industrial town hall missing');
 hall.ready=true;hall.hp=1500;delete hall.previewAge;
 city.economy.buildings=[hall];
 const cols=[-45,-30,-15,0,15,30,45],rows=[-38,-23,-8,7,22,37];
 for(let i=0;i<INDUSTRIAL_DEMO_TYPES.length;i++){
  const type=INDUSTRIAL_DEMO_TYPES[i];
  const x=hall.x+cols[i%cols.length],z=hall.z+rows[Math.floor(i/cols.length)];
  city.economy.buildings.push({type,x,z,team:0,hp:BUILDINGS[type].hp||1000,
   ready:true,progress:BUILDINGS[type].time||0,assigned:0,previewAge:5});
 }
 const economy=city.economy.realms[0];economy.pop=46;economy.growthProgress=0;
 Object.assign(economy.resources,{wood:950,stone:900,plank:600,bread:850,water:850,
  grain:360,flour:300,iron:460,coal:350,ore:250,bronze:200,
  gold:600,paper:280,saltpeter:200,gunpowder:170,steel:170,machines:110});
 city.world.heat={};city.world.heatLast={};city.world.trailChanges=0;
 city.world.revision=(city.world.revision||0)+1;
 const network=seedCityStreetNetwork(g,city,11);
 if(network.reached<12||network.visibleCells<65)
  throw Error('Industrial exhibition street network failed '+JSON.stringify(network));
 g.s.time=330;g.s.events??=[];g.s.events.push({time:g.s.time,
  text:'V82 Aurulinn: kõrgahjud, masinaehitus, tehnikaülikool ja raudteejaam. Puuduta iga hoonet, et näha selle infot.'});
 g.reveal(0,g.cell(city),2);
 return JSON.parse(JSON.stringify(g.s));
}
