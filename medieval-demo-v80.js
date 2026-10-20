// V80: medieval demonstration is a disposable ordinary V4 state.
import {createBronzeDemoState} from './bronze-demo-v79.js?v=80a';
import {Civilization,BUILDINGS} from './civilization-core.js?v=80a';
import {MEDIEVAL_TYPES} from './medieval-buildings-v80.js?v=80a';
import {grantTech} from './research.js';
import {simulateUrbanHistory} from './urban-roads-v80.js?v=80a';
export const MEDIEVAL_DEMO_NAME='Kivilinna keskaegne linn';
export function createMedievalDemoState(seed=20261020){
 const g=new Civilization(createBronzeDemoState(seed));
 const city=g.s.cities.find(c=>c.team===0);
 city.name=MEDIEVAL_DEMO_NAME;
 g.s.ages[0]=3;
 for(const tech of ['iron_crafts','medieval_crafts','fortifications','civics','guilds','architecture'])try{grantTech(g.s.research[0],tech)}catch{}
 const hall=city.economy.buildings.find(b=>b.type==='hall');
 city.economy.buildings=[hall];delete hall.previewAge;
 const cols=[-30,-16,0,16,32,46],rows=[-30,-16,-2,12,26,40];
 [...MEDIEVAL_TYPES.filter(t=>t!=='hall'),'house','house','house'].forEach((type,i)=>{
  if(!BUILDINGS[type])return;
  city.economy.buildings.push({type,x:hall.x+cols[i%6],z:hall.z+rows[Math.floor(i/6)],
   team:0,hp:1000,ready:true,progress:BUILDINGS[type].time||0,assigned:0,previewAge:3});
 });
 const realm=city.economy.realms[0];realm.pop=22;
 Object.assign(realm.resources,{wood:650,stone:600,plank:250,bread:500,water:500,
  bronze:120,iron:150,gold:250});
 // The Bronze preview has a different street layout. Start a real medieval
 // traffic history from scratch so old roads cannot run under new buildings.
 city.world.heat={};city.world.heatLast={};city.world.trailChanges=0;
 g.nav(city).world.trailTime=g.s.time;
 const roads=simulateUrbanHistory(g,city,14);
 g.s.events??=[];g.s.events.push({time:g.s.time,text:'V80: '+roads.connected+' keskaja tänavaühendust tekkis korduva liiklusega.'});
 g.s.time=250;g.s.events??=[];g.s.events.push({time:250,text:'V80 keskaegne näidislinn: majad ja isetekkelised teerajad.'});
 return JSON.parse(JSON.stringify(g.s));
}
