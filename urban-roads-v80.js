// V80: traffic-derived village / city street network.
// A connected minimum-distance spine plus short local links builds a grid-like
// mesh where the physical 3D buildings and terrain actually allow pedestrians.
// Roads are never painted by hand: Navigation.route and recordTraffic create
// exactly the same wear as the real household and worker movement.
import {door} from './navigation.js';

const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const unique=(pairs,a,b)=>{if(a===b)return;const key=[a,b].sort((x,y)=>x-y).join(':');if(!pairs.some(p=>p.key===key))pairs.push({key,a,b})};
export function urbanTrafficPairs(buildings){
 const list=buildings.filter(b=>b.ready&&b.hp>0&&!b.virtual&&!b.disabled);
 if(list.length<2)return {list,pairs:[]};
 const pairs=[],visited=[0],remaining=new Set(list.slice(1).map((_,i)=>i+1));
 // Every building attaches to the already connected street network.
 while(remaining.size){
  let best=null;
  for(const b of remaining)for(const a of visited){const d=dist(list[a],list[b]);
   if(!best||d<best.d)best={a,b,d};
  }
  if(!best)break;
  unique(pairs,best.a,best.b);visited.push(best.b);remaining.delete(best.b);
 }
 // Short cross-lanes give alternate routes, rather than a tree of dead ends.
 for(let a=0;a<list.length;a++){
  const nearest=list.map((b,i)=>({b:i,d:dist(list[a],b)}))
   .filter(p=>p.b!==a&&p.d<27).sort((x,y)=>x.d-y.d).slice(0,3);
  for(const {b} of nearest.slice(0,2))unique(pairs,a,b);
 }
 // Residential trips to services create the busy main roads seen in towns.
 const market=list.findIndex(b=>b.type==='market');
 const hall=list.findIndex(b=>b.type==='hall');
 for(let a=0;a<list.length;a++)if(list[a].type==='house'){
  if(market>=0)unique(pairs,a,market);
  else if(hall>=0)unique(pairs,a,hall);
 }
 return {list,pairs};
}
export function wearUrbanPair(game,city,buildings,pair,passes=1){
 const from=buildings[pair.a],to=buildings[pair.b];
 if(!from||!to)return {connected:false,cells:0};
 const nav=game.nav(city),a=nav.nearest(door(from),16),b=nav.nearest(door(to),16);
 if(!a||!b)return {connected:false,cells:0};
 const route=nav.route(a,b);
 if(!route||route.length<2)return {connected:false,cells:0};
 for(let i=0;i<passes;i++)for(let j=1;j<route.length;j++)nav.recordTraffic(route[j-1],route[j]);
 return {connected:true,cells:route.length};
}
// Only demo fixtures call this in bulk to represent many days of normal use.
export function simulateUrbanHistory(game,city,passes=10){
 const {list,pairs}=urbanTrafficPairs(city.economy.buildings);
 let connected=0,failed=0;
 for(const pair of pairs){
  const r=wearUrbanPair(game,city,list,pair,passes);
  if(r.connected)connected++;else failed++;
 }
 return {buildings:list.length,pairs:pairs.length,connected,failed};
}
// Aggregate errands between houses, workshops and services over game time.
// Spread work across ticks, so growing cities form multiple streets organically
// without expensive all-city A* searches in a single animation frame.
export function tickUrbanRoads(game,parent,dt){
 if(dt<=0)return;
 parent.urbanTrafficClock=(parent.urbanTrafficClock||0)+dt;
 if(parent.urbanTrafficClock<14)return;
 parent.urbanTrafficClock%=14;
 const pop=parent.economy?.realms?.[parent.team]?.pop||0;
 if(pop<2)return;
 const places=typeof game.contexts==='function'?game.contexts(parent):[parent];
 for(const city of places){
  const {list,pairs}=urbanTrafficPairs(city.economy.buildings);
  if(!pairs.length)continue;
  const start=city.urbanRoadCursor||0;
  const tripCount=Math.min(4,Math.max(1,Math.ceil(pop/7)));
  for(let t=0;t<tripCount;t++){
   const pair=pairs[(start+t)%pairs.length];
   wearUrbanPair(game,city,list,pair,1);
  }
  city.urbanRoadCursor=(start+tripCount)%pairs.length;
 }
}
