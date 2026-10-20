// V80 streets: a connected network of organically used lanes instead of
// the old handful of hall-to-market demo shortcuts.
// This records real traffic wear through Navigation.route/recordTraffic; it
// never paints roads by fiat and never changes the V4 save format.
import {door} from './navigation.js';

const valid=b=>b&&b.ready&&b.hp>0&&!b.virtual&&!['bridge','stonewall','palisade','reinforced_wall'].includes(b.type);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const runtime=new WeakMap();

export function streetConnections(buildings){
 const sites=(buildings||[]).filter(valid);
 if(sites.length<2)return [];
 const links=[],seen=new Set(),byX=[...sites].sort((a,b)=>a.x-b.x||a.z-b.z);
 const add=(a,b,label)=>{
  if(!a||!b||a===b)return;
  const i=sites.indexOf(a),j=sites.indexOf(b),key=[i,j].sort((a,b)=>a-b).join(':');
  if(seen.has(key))return;seen.add(key);
  links.push({from:a,to:b,kind:label});
 };
 // Near neighbours in each direction create a proper interlinked grid: not
 // one overused corridor from all houses to a single centre.
 for(const a of sites){
  const right=sites.filter(b=>b.x>a.x+4&&Math.abs(b.z-a.z)<10)
   .sort((b,c)=>(b.x-a.x)+Math.abs(b.z-a.z)*1.4-(c.x-a.x)-Math.abs(c.z-a.z)*1.4)[0];
  const south=sites.filter(b=>b.z>a.z+4&&Math.abs(b.x-a.x)<10)
   .sort((b,c)=>(b.z-a.z)+Math.abs(b.x-a.x)*1.4-(c.z-a.z)-Math.abs(c.x-a.x)*1.4)[0];
  add(a,right,'east-west');add(a,south,'north-south');
 }
 // Off-grid settlements still form local links and small loops.
 for(const a of sites){
  if(links.filter(l=>l.from===a||l.to===a).length>=2)continue;
  for(const b of sites.filter(b=>b!==a).sort((x,y)=>dist(a,x)-dist(a,y)).slice(0,2))
   add(a,b,'nearby');
 }
 // Houses and workplaces use several public destinations, not just one
 // market route. These paths emerge as the population actually uses them.
 const hubs=sites.filter(b=>['hall','market','well','inn','trade_yard'].includes(b.type));
 for(const a of sites){
  if(a.type==='house'||a.type==='warehouse'||a.type==='barracks'){
   for(const hub of hubs.filter(b=>b!==a).sort((b,c)=>dist(a,b)-dist(a,c)).slice(0,2))
    add(a,hub,'household');
  }
 }
 return links;
}

function traveled(nav,link,visits=1,weight=1){
 const start=nav.nearest(door(link.from),15),end=nav.nearest(door(link.to),15);
 if(!start||!end)return 0;
 const route=nav.route(start,end,{preferRoads:false});
 if(!route||route.length<2)return 0;
 // A route is first found across the walkable network, *then* its actual
 // geometry receives wear. No direct lines or roads through obstacles.
 for(let repeat=0;repeat<visits;repeat++)
  for(let i=1;i<route.length;i++)nav.recordTraffic(route[i-1],route[i],weight);
 return route.length;
}
export function seedCityStreetNetwork(game,city,visits=8){
 const nav=game.nav(city),links=streetConnections(city.economy.buildings);
 let reached=0,unreachable=0;
 // Neutral shortest-path routing avoids a single early worn street absorbing
 // all subsequent trips while other feasible neighbourhood links stay empty.
 for(const link of links){
  if(traveled(nav,link,visits))reached++;else unreachable++;
 }
 return {links:links.length,reached,unreachable,
  visibleCells:Object.keys(nav.world.heat||{}).filter(i=>nav.roadLevel(Number(i))>0&&
   nav.open(nav.point(Number(i)).x,nav.point(Number(i)).z)).length};
}
export function tickTownStreets(game,parent,dt){
 if(!parent||dt<=0)return;
 parent.streetClock=(parent.streetClock||0)+dt;
 if(parent.streetClock<7)return;
 parent.streetClock%=7;
 const contexts=typeof game.contexts==='function'?game.contexts(parent):[parent];
 for(const city of contexts){
  const buildings=city.economy?.buildings||[];
  if(buildings.filter(valid).length<3)continue;
  let memo=runtime.get(city);
  const signature=buildings.map(b=>b.type+':'+b.x+':'+b.z+':'+b.ready+':'+b.hp).join('|');
  if(!memo||memo.signature!==signature){
   memo={signature,links:streetConnections(buildings),index:0};
   runtime.set(city,memo);
  }
  if(!memo.links.length)continue;
  const nav=game.nav(city),traffic=Math.min(1.2,Math.max(.28,(parent.economy.realms[parent.team].pop||3)/20));
  // Two distinct citizen errands every 7 game seconds; sparse settlements
  // gradually form streets without instantly unlocking asphalt everywhere.
  for(let i=0;i<2;i++){
   const link=memo.links[memo.index++%memo.links.length];
   traveled(nav,link,1,traffic);
  }
 }
}
