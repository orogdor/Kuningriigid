import {roadBoost,recordWorldStep} from './roads.js?v=59';
import {GOODS,cityNeeds} from './city-needs-v87.js';
import {FOOD_KEYS,recordDelivery} from './economy.js';
import {cityReserves} from './trade-network.js';
import {merchantAccess,atWar} from './diplomacy-v87.js';
import {harborExit,seaPath,seaAllowed} from './naval.js';
export const MERCHANT_RANGE={road:32,sea:72};
const stock=c=>c.economy.realms[c.team].resources;
const distance=(a,b)=>Math.abs(a.c-b.c)+Math.abs(a.r-b.r);
export function merchantStops(game,team){const out=[];for(const city of game.s.cities){if(city.tradeDisabled||!merchantAccess(game.s,team,city))continue;out.push({id:'city:'+city.id,cityId:city.id,team:city.team,c:city.c,r:city.r,port:false});for(const ctx of game.contexts(city)){if(!ctx.economy.buildings.some(b=>b.type==='harbor'&&b.ready&&b.hp>0&&!b.disabled))continue;const exit=harborExit(game,{...ctx,team});if(exit)out.push({id:'port:'+city.id+':'+ctx.c+':'+ctx.r,cityId:city.id,team:city.team,c:ctx.c,r:ctx.r,port:true,exit});}}return out;}
export function merchantRoute(game,from,to,team){
 const stops=merchantStops(game,team),start=stops.find(p=>p.id==='city:'+from.id),end=stops.find(p=>p.id==='city:'+to.id);if(!start||!end)return null;
 const best=new Map([[start.id,0]]),prev=new Map(),queue=[start];
 while(queue.length){queue.sort((a,b)=>best.get(a.id)-best.get(b.id));const a=queue.shift();if(a.id===end.id)break;
  for(const b of stops){if(a.id===b.id)continue;let path=null,mode='road';
   if(distance(a,b)<=MERCHANT_RANGE.road)path=game.landPath(a,b,team);
   if(path?.length>MERCHANT_RANGE.road)path=null;
   if(!path&&a.port&&b.port&&distance(a.exit,b.exit)<=MERCHANT_RANGE.sea){const sea=seaPath(game,{...a.exit,team},b.exit);if(sea&&sea.length+2<=MERCHANT_RANGE.sea){path=[a.exit,...sea,{c:b.c,r:b.r}];mode='sea';}}
   if(path===null)continue;const cost=best.get(a.id)+path.length*(mode==='sea'?1.5:4)+6;
   if(cost>=(best.get(b.id)??Infinity))continue;best.set(b.id,cost);prev.set(b.id,{from:a,leg:{stop:b,mode,path}});if(!queue.some(p=>p.id===b.id))queue.push(b);
  }
 }
 if(!best.has(end.id))return null;const legs=[];let p=end;while(p.id!==start.id){const edge=prev.get(p.id);if(!edge)return null;legs.unshift(edge.leg);p=edge.from;}return legs.length?legs:null;
}
export function tradeDemand(game,city){const need={...cityReserves(city),...(city.importRequests||{})},age=game.s.ages[city.team],r=city.economy.realms[city.team],status=cityNeeds(city,age);
 for(const[k,d]of Object.entries(GOODS))if(d.age<=age)need[k]=d.food?Math.max(4,r.pop*1.2):d.luxury?Math.max(2,r.pop*.3):4;
 if(age>=1)need.pottery=Math.max(3,r.pop*.3);
 // Unaffordable buildings advertise actual material shortages to the network.
 for(const b of game.allBuildings(city)){const input=game.buildingDefinitions[b.type]?.input;for(const[k,n]of Object.entries(input||{}))need[k]=Math.max(need[k]||0,n*3);}
 return {need,status};}
export function planMerchants(game){let count=0;const towns=game.s.cities.filter(c=>!c.tradeDisabled);for(const to of towns){if(game.s.shipments.filter(c=>c.to===to.id).length>=2)continue;const dst=stock(to),{need}=tradeDemand(game,to),inbound={};for(const c of game.s.shipments.filter(c=>c.to===to.id))for(const[k,n]of Object.entries(c.goods))inbound[k]=(inbound[k]||0)+n;
 const keys=Object.keys(need).sort((a,b)=>((dst[a]||0)+(inbound[a]||0))/need[a]-((dst[b]||0)+(inbound[b]||0))/need[b]);
 for(const from of [...towns].sort((a,b)=>distance(a,to)-distance(b,to))){if(from.id===to.id||!merchantAccess(game.s,to.team,from)||game.s.shipments.some(c=>c.from===from.id&&c.team===to.team))continue;const src=stock(from),reserve=tradeDemand(game,from).need,goods={};let room=40,budget=from.team===to.team?Infinity:dst.gold||0;for(const k of keys){const wanted=(need[k]||0)-(dst[k]||0)-(inbound[k]||0),surplus=(src[k]||0)-(reserve[k]||0),free=game.storageCap(to,k)-game.storageUsed(to,k,dst)-Object.entries(goods).filter(([key])=>key===k||FOOD_KEYS.has(k)&&FOOD_KEYS.has(key)).reduce((n,[,v])=>n+v,0),n=Math.floor(Math.min(wanted,surplus,room,budget,free));if(n<1)continue;goods[k]=n;room-=n;budget-=n;}
  if(!Object.keys(goods).length)continue;const legs=merchantRoute(game,from,to,to.team);if(!legs)continue;const cost=Object.values(goods).reduce((n,v)=>n+v,0);if(from.team!==to.team){dst.gold-=cost;src.gold=(src.gold||0)+cost;}
  for(const[k,n]of Object.entries(goods))src[k]-=n;
  const cargo={id:game.s.nextShipment++,merchantV87:true,team:to.team,from:from.id,to:to.id,c:from.c,r:from.r,goods,legs,leg:0,path:legs[0].path.map(p=>({...p})),mode:legs[0].mode,rangeLeft:MERCHANT_RANGE[legs[0].mode],startedAt:game.s.time,travelClock:0,fees:[],status:'Teel'};
  payVisit(game,cargo,from);game.s.shipments.push(cargo);count++;break;
 }
 }return count;}
export function payVisit(game,cargo,city){const r=stock(city),paid={};for(const[k,n]of Object.entries(cargo.goods)){const fee=n*.05;cargo.goods[k]=n-fee;r[k]=(r[k]||0)+fee;paid[k]=fee;}cargo.fees??=[];cargo.fees.push({city:city.id,time:game.s.time,goods:paid});}
export function advanceMerchant(game,cargo,dt){const leg=cargo.legs[cargo.leg],city=game.s.cities.find(c=>c.id===leg?.stop.cityId);if(!leg||!city||!merchantAccess(game.s,cargo.team,city)||city.tradeDisabled||atWar(game.s,cargo.team,city.team)){cargo.status='Ootab: peatumisluba puudub';cargo.blocked=true;return;}cargo.blocked=false;cargo.status='Teel';cargo.travelClock=(cargo.travelClock||0)+dt;const seconds=cargo.mode==='sea'?1.5:4/roadBoost(game.s,cargo,cargo.path[0]||cargo,game.s.time);cargo.travelDuration=seconds;
 while(cargo.travelClock>=seconds&&cargo.path.length){const next=cargo.path[0],land=game.cell(next)?.land,valid=cargo.mode==='sea'?(land?next.c===leg.stop.c&&next.r===leg.stop.r:seaAllowed(game,cargo.team,next)):game.canTraverse(cargo.team,next);if(!valid||cargo.rangeLeft<=0){cargo.blocked=true;cargo.status='Ootab: teekond suletud';return;}cargo.travelClock-=seconds;const from={c:cargo.c,r:cargo.r};Object.assign(cargo,cargo.path.shift());if(cargo.mode==='road')recordWorldStep(game.s,from,cargo,'caravan',game.s.time);cargo.rangeLeft--;}
}
export function receiveMerchant(game,cargo){if(!game.s.shipments.includes(cargo))return;if(cargo.blocked||cargo.path.length)return;const leg=cargo.legs[cargo.leg],city=game.s.cities.find(c=>c.id===leg?.stop.cityId);if(!city||!merchantAccess(game.s,cargo.team,city))return;
 if(!cargo.visitPaid){payVisit(game,cargo,city);cargo.visitPaid=true;}
 if(cargo.leg+1<cargo.legs.length){cargo.leg++;const next=cargo.legs[cargo.leg];cargo.path=next.path.map(p=>({...p}));cargo.mode=next.mode;cargo.rangeLeft=MERCHANT_RANGE[next.mode];cargo.travelClock=0;cargo.visitPaid=false;return;}
 if(city.team!==cargo.team){cargo.status='Ootab: sihtlinna omanik muutus';return;}
 const r=stock(city);for(const[k,n]of Object.entries(cargo.goods)){const amount=Math.min(n,Math.max(0,game.storageCap(city,k)-game.storageUsed(city,k,r)));r[k]=(r[k]||0)+amount;cargo.goods[k]-=amount;recordDelivery(city.economy.realms[city.team],game.s.time,k,amount);if(cargo.goods[k]<=1e-7)delete cargo.goods[k];}
 if(!Object.keys(cargo.goods).length)game.s.shipments.splice(game.s.shipments.indexOf(cargo),1);else cargo.status='Ootab vaba laoruumi';
}
