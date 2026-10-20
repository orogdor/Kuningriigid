// V79 Bronze Age showcase built from the working, save-compatible V77 city.
// Available via ?demo=bronze; produces ordinary V4 JSON on export.
// Never touches the user's browser autosave.
import {createStoneDemoState} from './stone-demo-v77.js?v=77a';
import {Civilization,BUILDINGS} from './civilization-core.js?v=80a';
import {BRONZE_BUILDING_TYPES} from './bronze-buildings-v79.js?v=79a';
import {grantTech} from './research.js';
import {simulateUrbanHistory} from './urban-roads-v80.js?v=80a';
export const BRONZE_DEMO_NAME='Vaskoru pronksilinn';
export const BRONZE_DEMO_TYPES=Object.freeze([
 ...BRONZE_BUILDING_TYPES.filter(x=>x!=='hall'),'house','house'
]);
export function createBronzeDemoState(seed=20261020){
 const src=createStoneDemoState(seed),g=new Civilization(src),city=g.s.cities.find(c=>c.team===0);
 if(!city)throw Error('Bronze sample must have a founded city');
 city.name=BRONZE_DEMO_NAME;
 grantTech(g.s.research[0],'bronze_crafts');
 for(const tech of ['woodworking','milling','copper_tin','road_construction','writing','fishing','hunting','archery']){
  if(!g.s.research[0].known.includes(tech))grantTech(g.s.research[0],tech);
 }
 g.s.ages[0]=1;
 const hall=city.economy.buildings.find(b=>b.type==='hall');
 if(!hall)throw Error('Bronze hall absent');
 delete hall.previewAge;hall.ready=true;hall.hp=1200;
 city.economy.buildings=[hall];
 const columns=[-30,-16,0,16,32,48],rows=[-28,-14,17,31,45,58];
 BRONZE_DEMO_TYPES.forEach((type,i)=>{
  if(!BUILDINGS[type])throw Error('Unknown building in bronze demo '+type);
  const x=columns[i%6],z=rows[Math.floor(i/6)];
  city.economy.buildings.push({
   type,x:hall.x+x,z:hall.z+z,team:0,hp:1000,ready:true,
   progress:BUILDINGS[type].time||0,assigned:0,previewAge:1
  });
 });
 const stock=city.economy.realms[0];stock.pop=14;
 Object.assign(stock.resources,{wood:550,stone:380,plank:185,bread:400,grain:190,
  water:430,clay:140,pottery:70,copper:100,tin:75,bronze:80,gold:120});
 g.s.time=185;g.s.events??=[];
 g.s.events.push({time:g.s.time,text:'V79 näidislinn: pronksiaja 30 hoonemudelit ja teeradade kontroll.'});
 // Simulate local trips between ALL occupied buildings. Streets form from
 // actual Navigation routes rather than drawing a few straight market links.
 const roads=simulateUrbanHistory(g,city,12);
 g.s.events.push({time:g.s.time,text:'V80: '+roads.connected+' linna teekoridori kujunes korduva liiklusega.'});
 const out=JSON.parse(JSON.stringify(g.s));
 return out;
}
