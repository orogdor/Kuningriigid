import {railRoute,airRouteAvailable,airFreightCost,flightDuration} from './infrastructure.js';
// V39: supply-and-demand trade planning for physically travelling caravans.
// Ownership, storage ceilings, in-transit cargo and reserves are checked before dispatch.
import {FOOD_KEYS} from './economy.js';
const keys=['bread','water','wood','stone','plank','grain','flour','ore','coal','iron','weapons','paper','saltpeter','gunpowder','steel','machines','oil','fuel','vehicles'];
const food=stock=>[...FOOD_KEYS].reduce((n,k)=>n+(stock[k]||0),0);
export function cityReserves(city){const pop=city.economy.realms[city.team].pop||3;
 return {bread:Math.max(20,pop*2.4),water:Math.max(18,pop*2.0),wood:50,stone:28,plank:20,grain:10,flour:10,ore:12,coal:10,iron:8,weapons:5,paper:8,saltpeter:8,gunpowder:8,steel:12,machines:10,oil:12,fuel:10,vehicles:3};
}
export function suggestGoods(game,from,to,inbound=[],maxLoad=40){
 if(from.team!==to.team||from.tradeDisabled||to.tradeDisabled)return {};
 const src=from.economy.realms[from.team].resources,dst=to.economy.realms[to.team].resources;
 const need=cityReserves(to),keep=cityReserves(from),incoming={};
 for(const c of inbound.filter(c=>c.to===to.id&&c.team===to.team))for(const[k,n]of Object.entries(c.goods||{}))incoming[k]=(incoming[k]||0)+n;
 const inboundFood=[...FOOD_KEYS].reduce((n,k)=>n+(incoming[k]||0),0);
 const freeFood=Math.max(0,game.storageCap(to,'bread')-food(dst)-inboundFood);
 const priorities=[...keys].sort((a,b)=>{
  const deficiency=k=>k==='bread'?Math.max(0,need.bread-food(dst)-inboundFood)/need.bread:Math.max(0,need[k]-(dst[k]||0)-(incoming[k]||0))/need[k];
  return deficiency(b)-deficiency(a);
 });
 const goods={};let room=maxLoad,foodRoom=freeFood;
 for(const k of priorities){
  if(room<=0)break;
  const requested=k==='bread'?need.bread-food(dst)-inboundFood:need[k]-(dst[k]||0)-(incoming[k]||0);
  if(requested<=0)continue;
  const sourceMin=k==='bread'?Math.max(keep.bread,from.economy.realms[from.team].pop*2.6):keep[k];
  const surplus=(src[k]||0)-sourceMin;
  let free=Math.max(0,game.storageCap(to,k)-game.storageUsed(to,k,dst)-(incoming[k]||0));
  if(FOOD_KEYS.has(k))free=Math.min(free,foodRoom);
  const quantity=Math.floor(Math.max(0,Math.min(requested,surplus,free,room,26)));
  if(quantity<2)continue;
  goods[k]=quantity;room-=quantity;
  if(FOOD_KEYS.has(k))foodRoom-=quantity;
 }
 return goods;
}
export function planTrade(game){const shipments=game.s.shipments;
 const towns=game.s.cities.filter(c=>!c.tradeDisabled).sort((a,b)=>a.id-b.id);
 let dispatched=0;
 for(const to of towns){
  const arriving=shipments.filter(c=>c.to===to.id&&c.team===to.team);
  if(arriving.length>=2)continue;
  const options=[];
  for(const from of towns){
   if(from.id===to.id||from.team!==to.team||shipments.some(c=>c.from===from.id))continue;
   const rail=railRoute(game,from,to),land=rail?null:game.landPath(from,to,to.team),air=!rail&&(!land?.length)&&airRouteAvailable(game,from,to),route=rail||land,mode=rail?'rail':land?.length?'road':air?'air':null;
   if(!mode)continue;
   const src=from.economy.realms[from.team].resources;
   const flightFuel=mode==='air'?airFreightCost(from,to):0;
   // Fuel needed for the flight is never also advertised as transferable cargo.
   if(mode==='air')src.fuel-=flightFuel;
   const goods=suggestGoods(game,from,to,shipments,mode==='rail'?90:mode==='air'?75:game.cityReady(from,'market')?52:36);
   if(mode==='air')src.fuel+=flightFuel;
   if(!Object.keys(goods).length)continue;

   const worth=Object.values(goods).reduce((n,v)=>n+v,0)/Math.sqrt(mode==='air'?flightDuration(from,to)/2:mode==='rail'?Math.max(1,route.length/3):route.length);
   options.push({from,goods,route,mode,worth});
  }
  options.sort((a,b)=>b.worth-a.worth);
  const chosen=options[0];if(!chosen)continue;
  if(chosen.mode==='air'){const cost=airFreightCost(chosen.from,to);if((chosen.from.economy.realms[to.team].resources.fuel||0)<cost+6)continue;chosen.from.economy.realms[to.team].resources.fuel-=cost}
  for(const[k,n]of Object.entries(chosen.goods))chosen.from.economy.realms[to.team].resources[k]-=n;
  shipments.push({id:game.s.nextShipment++,team:to.team,from:chosen.from.id,to:to.id,c:chosen.from.c,r:chosen.from.r,path:chosen.route||[],mode:chosen.mode,flightDuration:chosen.mode==='air'?flightDuration(chosen.from,to):0,flightLeft:chosen.mode==='air'?flightDuration(chosen.from,to):0,goods:chosen.goods,startedAt:game.s.time});dispatched++;
 }
 return dispatched;
}
