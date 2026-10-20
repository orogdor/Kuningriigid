// V81 Renaissance demo city. Read-only if opened via ?demo=renaissance.
// Returns normal V4 JSON, leaves autosave and V80/V79 example cities unchanged.
import {createMedievalDemoState} from './medieval-demo-v80.js?v=80c';
import {Civilization,BUILDINGS} from './civilization-core.js?v=80c';
import {grantTech} from './research.js';
import {seedCityStreetNetwork} from './town-streets-v80.js?v=80c';
import {RENAISSANCE_BUILDING_TYPES} from './renaissance-buildings-v81.js?v=81a';

export const RENAISSANCE_DEMO_NAME='Päikeselinna renessansilinn';
export const RENAISSANCE_DEMO_TYPES=Object.freeze([
 'house','house','house','market','guildhall','warehouse','cellar',
 'university','academy','observatory','printer','inn','chapel','monastery',
 'keep','gatehouse','watermill','windmill','infirmary','trade_yard',
 'lumber','saw','bakery','quarry','mason','farm','well','barracks',
 'stable','smith','armor_workshop','harbor','nitrate','powdermill',
 'mill','cartwright'
]);
export function createRenaissanceDemoState(seed=20261020){
 const baseline=createMedievalDemoState(seed);
 const g=new Civilization(baseline);
 const city=g.s.cities.find(c=>c.team===0);
 if(!city)throw Error('Renaissance showcase requires a city');
 city.name=RENAISSANCE_DEMO_NAME;
 for(const tech of ['renaissance','printing','astronomy','gunpowder',
  'scholasticism','navigation','commerce','architecture','medieval_crafts'])
  grantTech(g.s.research[0],tech);
 g.s.ages[0]=4;
 const hall=city.economy.buildings.find(b=>b.type==='hall');
 if(!hall)throw Error('Renaissance palace city hall missing');
 delete hall.previewAge;hall.ready=true;hall.hp=1500;
 city.economy.buildings=[hall];
 const cols=[-45,-30,-15,0,15,30,45],rows=[-38,-23,-8,7,22,37];
 for(let i=0;i<RENAISSANCE_DEMO_TYPES.length;i++){
  const type=RENAISSANCE_DEMO_TYPES[i];
  if(!BUILDINGS[type]||!RENAISSANCE_BUILDING_TYPES.includes(type))
   throw Error('Unsupported Renaissance landmark '+type);
  const x=hall.x+cols[i%cols.length],z=hall.z+rows[Math.floor(i/cols.length)];
  city.economy.buildings.push({
   type,x,z,team:0,hp:1000,ready:true,assigned:0,previewAge:4,
   progress:BUILDINGS[type].time||0
  });
 }
 const stock=city.economy.realms[0];
 stock.pop=34;stock.growthProgress=0;
 Object.assign(stock.resources,{
  wood:800,stone:790,plank:380,bread:620,water:600,grain:250,
  flour:180,iron:210,bronze:150,gold:300,paper:150,saltpeter:100,
  gunpowder:75,coal:170,ore:140
 });
 // Forget the V80 demonstration's old heat; generate all streets for this
 // Renaissance urban plan using valid paths through its actual nav mesh.
 city.world.heat={};city.world.heatLast={};city.world.trailChanges=0;
 city.world.revision=(city.world.revision||0)+1;
 const summary=seedCityStreetNetwork(g,city,10);
 if(summary.reached<12||summary.visibleCells<55)
  throw Error('Renaissance street exhibition inaccessible '+JSON.stringify(summary));
 g.s.time=270;
 g.s.events??=[];
 g.s.events.push({time:g.s.time,
  text:'V81 renessansilinn: ülikool, trükikoda, tähetorn, raekoda ja kõndimisest tekkinud tänavad.'});
 g.reveal(0,g.cell(city),2);
 return JSON.parse(JSON.stringify(g.s));
}
