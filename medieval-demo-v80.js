// V80: medieval demonstration is a disposable ordinary V4 state.
import {createBronzeDemoState} from './bronze-demo-v79.js?v=79a';
import {Civilization,BUILDINGS} from './civilization-core.js?v=79a';
import {MEDIEVAL_TYPES} from './medieval-buildings-v80.js?v=80a';
import {grantTech} from './research.js';
export const MEDIEVAL_DEMO_NAME='Kivilinna keskaegne linn';
export function createMedievalDemoState(seed=20261020){
 const g=new Civilization(createBronzeDemoState(seed));
 const city=g.s.cities.find(c=>c.team===0);
 city.name=MEDIEVAL_DEMO_NAME;
 g.s.ages[0]=2;
 for(const tech of ['iron','ironworking','fortifications','civics','guilds','medieval','architecture'])try{grantTech(g.s.research[0],tech)}catch{}
 const hall=city.economy.buildings.find(b=>b.type==='hall');
 city.economy.buildings=[hall];delete hall.previewAge;
 const cols=[-30,-16,0,16,32,48],rows=[-28,-14,17,31,45,58];
 MEDIEVAL_TYPES.filter(t=>t!=='hall').forEach((type,i)=>{
  if(!BUILDINGS[type])return;
  city.economy.buildings.push({type,x:hall.x+cols[i%6],z:hall.z+rows[Math.floor(i/6)],
   team:0,hp:1000,ready:true,progress:BUILDINGS[type].time||0,assigned:0,previewAge:2});
 });
 const realm=city.economy.realms[0];realm.pop=22;
 Object.assign(realm.resources,{wood:650,stone:600,plank:250,bread:500,water:500,
  bronze:120,iron:150,gold:250});
 // Populate genuine traffic heat using real navigation, no forced road rendering.
 const nav=g.nav(city),market=city.economy.buildings.find(b=>b.type==='market');
 for(const house of city.economy.buildings.filter(b=>b.type==='house')){
  const a=nav.nearest({x:house.x,z:house.z+3.4},15),b=nav.nearest({x:market.x,z:market.z+3.4},15);
  const path=a&&b?nav.route(a,b):null;
  if(path)for(let pass=0;pass<14;pass++)for(let j=1;j<path.length;j++)nav.recordTraffic(path[j-1],path[j]);
 }
 g.s.time=250;g.s.events??=[];g.s.events.push({time:250,text:'V80 keskaegne näidislinn: majad ja isetekkelised teerajad.'});
 return JSON.parse(JSON.stringify(g.s));
}
