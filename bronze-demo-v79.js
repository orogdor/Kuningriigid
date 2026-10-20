// V79 Bronze Age showcase built from the working, save-compatible V77 city.
// Available via ?demo=bronze; produces ordinary V4 JSON on export.
// Never touches the user's browser autosave.
import {createStoneDemoState} from './stone-demo-v77.js?v=77a';
import {Civilization,BUILDINGS} from './civilization-core.js?v=78a';
import {BRONZE_BUILDING_TYPES} from './bronze-buildings-v79.js?v=79a';
import {grantTech} from './research.js';
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
 // The test city includes roads formed from eight actual traversals between
 // houses and the market. Each walk uses the same Navigation traffic mechanism
 // as live residents; there are no magic or prebuilt-road overrides.
 const market=city.economy.buildings.find(b=>b.type==='market');
 const nav=g.nav(city),doors=city.economy.buildings.filter(b=>b.type==='house').slice(0,3);
 for(const home of doors){
  const from=nav.nearest({x:home.x,z:home.z+3.4},12);
  const to=nav.nearest({x:market.x,z:market.z+3.4},12);
  if(!from||!to)continue;
  const path=nav.route(from,to);
  if(!path?.length)continue;
  for(let journey=0;journey<8;journey++)for(let j=1;j<path.length;j++)
   nav.recordTraffic(path[j-1],path[j]);
 }
 const out=JSON.parse(JSON.stringify(g.s));
 return out;
}
