import {DETAIL_HALF_X,DETAIL_HALF_Z} from './detail-scale-v123.js';
import {citizenWorldRoute} from './citizen-routes-v130.js';
import {FOUNDATION_TYPES} from './ai-foundation-v88.js?v=117a';
import {takeFood} from './economy.js';
import {door} from './navigation.js';
import {recordWorldStep} from './roads.js';
const key=p=>p.c+':'+p.r;
function attach(game,city,w){for(const ctx of game.contexts(city))if(ctx.world.workers?.[w.workerKey]&&key(ctx)!==key(w))delete ctx.world.workers[w.workerKey];const world=game.localWorld(w);world.workers??={};world.workers[w.workerKey]=w}
function travel(game,w,target,dt){if(key(w)===key(target))return true;const route=citizenWorldRoute(game,w,target);if(!route?.length){w.status='Ehitusplatsile puudub tee';return false}const next=route[0],dc=next.c-w.c,dr=next.r-w.r,nav=game.nav(w),edge=nav.nearest({x:dc*(DETAIL_HALF_X-5),z:dr*(DETAIL_HALF_Z-5)},15);if(!edge){w.status='Ootab läbipääsu';return false}w.status='Liigub järgmisse piirkonda';if(nav.moveCitizen(w,edge,dt,3)){const from={c:w.c,r:w.r};w.c=next.c;w.r=next.r;recordWorldStep(game.s,from,w,'builder',game.s.time);const entry=game.nav(w).nearest({x:-dc*(DETAIL_HALF_X-5),z:-dr*(DETAIL_HALF_Z-5)},20);if(entry){w.x=entry.x;w.z=entry.z}}return false}
export function tickBuilders(game,city,dt){city.builderCount??=1;city.builderAgents??=[];const contexts=game.contexts(city),jobs=contexts.flatMap(ctx=>ctx.economy.buildings.filter(b=>!b.ready&&!b.virtual&&!b.disabled&&b.workerLimit!==0).map(b=>({ctx,b})));for(const ctx of contexts)for(const b of ctx.economy.buildings)if(!b.ready){b.workThisTick=0;b.assigned=0;b.efficiency=0}if(city.team>0){
 jobs.sort((a,b)=>Number(FOUNDATION_TYPES.has(b.b.type))-Number(FOUNDATION_TYPES.has(a.b.type)));
 // V160: a second real builder serves the historic wall while the first
 // maintains food, houses and material chains. Neither project is free.
 if((city.builderCount||1)>=2&&city.economy.realms[city.team]?.pop>=7){
  // Reserve builder #2 for paid kiviaja timber defenses while builder #1
  // continues housing, food and production infrastructure.
  const stoneAge=game.s.ages[city.team]===0;
  const wall=jobs.findIndex(({b})=>stoneAge?
   ['woodgate','watchtower','palisade'].includes(b.type):
   (city.economy.realms[city.team].pop>=18&&['stonewall','gatehouse','stonetower'].includes(b.type)));
  if(wall>=0){const [fortification]=jobs.splice(wall,1);jobs.splice(1,0,fortification);}
 }
}const assigned=city.buildersAssigned||0,count=Math.ceil(assigned);for(let i=0;i<count;i++)if(!city.builderAgents[i]){const hall=city.economy.buildings.find(b=>b.type==='hall'),p=game.nav(city).nearest(door(hall));if(!p)continue;city.builderAgents[i]={...p,c:city.c,r:city.r,team:city.team,kind:'builder',workerKey:'builder:'+city.id+':'+i,working:false,moving:false,visible:true}}
for(let i=0;i<city.builderAgents.length;i++){const w=city.builderAgents[i];if(!w)continue;w.team=city.team;w.moving=false;w.working=false;w.action=null;w.visible=true;const share=Math.max(0,Math.min(1,assigned-i)),job=share>0&&jobs.length?jobs[i%jobs.length]:null;const target=job?.ctx||city;w.job=job?key(job.ctx)+':'+job.ctx.economy.buildings.indexOf(job.b):null;if(job){job.b.assigned+=share;job.b.efficiency+=share}attach(game,city,w);
 if(job&&(job.b.materialsRemaining||0)>0){
  const sources=game.contexts(city).flatMap(ctx=>ctx.economy.buildings.filter(b=>!b.virtual&&b.ready&&b.hp>0&&['warehouse','hall'].includes(b.type)).map(b=>({ctx,b})));
  // Only choose an accessible source; distant warehouses must not block work.
  if(w.materialJob!==w.job){w.materialLoad=0;w.materialJob=w.job;w.materialDepot=null;}
  if(!w.materialDepot||!sources.some(source=>source.ctx.c===w.materialDepot.c&&source.ctx.r===w.materialDepot.r&&source.ctx.economy.buildings.indexOf(source.b)===w.materialDepot.index)){
   const reachable=sources.filter(source=>source.ctx===job.ctx||game.landPath(source.ctx,job.ctx,city.team)!==null);
   reachable.sort((a,b)=>((Math.abs(a.ctx.c-w.c)+Math.abs(a.ctx.r-w.r))+(Math.abs(a.ctx.c-job.ctx.c)+Math.abs(a.ctx.r-job.ctx.r)))*2-( (Math.abs(b.ctx.c-w.c)+Math.abs(b.ctx.r-w.r))+(Math.abs(b.ctx.c-job.ctx.c)+Math.abs(b.ctx.r-job.ctx.r)) )*2 ||(a.b.type==='warehouse'?-1:1));
   const chosen=reachable[0]||sources.find(source=>source.b.type==='hall');
   if(!chosen){w.status='Puudub ligipääsetav ladu';attach(game,city,w);continue}
   w.materialDepot={c:chosen.ctx.c,r:chosen.ctx.r,index:chosen.ctx.economy.buildings.indexOf(chosen.b)};
  }
  const depot=sources.find(source=>source.ctx.c===w.materialDepot.c&&source.ctx.r===w.materialDepot.r&&source.ctx.economy.buildings.indexOf(source.b)===w.materialDepot.index);
  if(!depot){w.materialDepot=null;attach(game,city,w);continue;}
  if(!w.materialLoad){w.status='Läheb materjalilattu';w.kind='builder';w.carried=0;if(!travel(game,w,depot.ctx,dt*share)){attach(game,city,w);continue}const n=game.nav(w);if(!n.moveCitizen(w,door(depot.b),dt*share,3)){attach(game,city,w);continue}w.materialLoad=Math.min(24,job.b.materialsRemaining||0);w.carried=w.materialLoad;w.status='Võttis ehitusmaterjalid';attach(game,city,w);continue}
  w.status='Viib materjali ehitusplatsile';w.carried=w.materialLoad;if(!travel(game,w,job.ctx,dt*share)){attach(game,city,w);continue}const n=game.nav(w);if(!n.moveCitizen(w,door(job.b),dt*share,3)){attach(game,city,w);continue}job.b.materialsRemaining=Math.max(0,job.b.materialsRemaining-w.materialLoad);w.materialLoad=0;w.carried=0;w.status=job.b.materialsRemaining?'Toob järgmist koormat':'Materjalid kohal, alustab ehitust';attach(game,city,w);continue;
 }
 w.materialLoad=0;w.carried=0;if(!travel(game,w,target,dt*(job?share:1))){attach(game,city,w);continue}const nav=game.nav(w),goal=door(job?.b||city.economy.buildings.find(b=>b.type==='hall'));w.status=job?'Läheb ehitusplatsile':'Naaseb linnakeskusse';if(nav.moveCitizen(w,goal,dt*(job?share:1),3)){if(job){w.status='Ehitab';w.working=true;w.action='build';w.heading=Math.atan2(job.b.x-w.x,job.b.z-w.z);job.b.builderArrived=true;job.b.workThisTick+=dt*share*game.bonus(city.team)*game.builderStrength(city.team)}else{w.status='Ootab järgmist ehitust';w.visible=i<Math.ceil(assigned)}}attach(game,city,w)}}
export function operateWorker(game,ctx,b,dt){const nav=game.nav(ctx),world=ctx.world;world.workers??={};const id='job:'+ctx.economy.buildings.indexOf(b);let w=world.workers[id];if(!w){const h=ctx.economy.buildings.find(b=>b.type==='hall'),p=nav.nearest(door(h));if(!p)return 0;w=world.workers[id]={...p,team:ctx.team,kind:b.type,building:ctx.economy.buildings.indexOf(b)}}w.moving=false;w.working=false;w.action=null;if(dt<=0)return 0;const point=door(b);if(!nav.moveCitizen(w,point,dt,3))return 0;w.working=true;w.heading=Math.atan2(b.x-w.x,b.z-w.z);w.action={quarry:'mine',mine:'mine',coppermine:'mine',tinmine:'mine',claypit:'mine',gem_mine:'mine',well:'water',farm:'farm',saw:'saw',mill:'mill',bakery:'bake',coal:'forge',smelter:'forge',smith:'forge',library:'study',school:'study',public_school:'study',high_school:'study',study:'study',scriptorium:'study',academy:'study',university:'study'}[b.type]||'work';return dt}
export function trainingWorker(game,city,job,dt){city.trainingAgent??=null;if(!city.trainingAgent){const h=city.economy.buildings.find(b=>b.type==='hall'),p=game.nav(city).nearest(door(h));if(!p)return 0;city.trainingAgent={...p,c:city.c,r:city.r,team:city.team,workerKey:'trainer:'+city.id}}const w=city.trainingAgent;w.kind=job.ship?'shipwright':'trainer';w.team=city.team;w.working=false;w.moving=false;w.action=null;const barracks=game.contexts(city).find(c=>c.economy.buildings.some(b=>b.type==='barracks'&&b.ready&&!b.disabled&&b.hp>0));const ctx=job.ship?game.contextAt(job.harbor,false):(barracks||city);if(!ctx||dt<=0)return 0;attach(game,city,w);if(!travel(game,w,ctx,dt)){attach(game,city,w);return 0}const b=ctx.economy.buildings.find(b=>b.type===(job.ship?'harbor':'barracks'))||ctx.economy.buildings.find(b=>b.type==='hall');if(!game.nav(ctx).moveCitizen(w,door(b),dt,3))return 0;w.working=true;w.action=job.ship?'build':'train';w.heading=Math.atan2(b.x-w.x,b.z-w.z);return dt}

// Each occupied house sends a resident to the market to fetch one meal and water.
// Existing towns without a market use the original hall distribution system.
export function tickMarketHouseholds(game,city,dt){
 if(dt<=0)return;
 const contexts=game.contexts(city),houses=contexts.flatMap(ctx=>ctx.economy.buildings.filter(b=>b.type==='house'&&b.ready&&b.hp>0).map(b=>({ctx,b}))),markets=contexts.flatMap(ctx=>ctx.economy.buildings.filter(b=>b.type==='market'&&b.ready&&!b.disabled&&b.hp>0&&(b.assigned??1)>.01).map(b=>({ctx,b})));
 if(!markets.length){for(const ctx of contexts)for(const [id,w] of Object.entries(ctx.world.workers||{}))if(id.startsWith('shopper:')){w.visible=false;w.moving=false;}return;}
 const r=city.economy.realms[city.team];
 for(let index=0;index<houses.length;index++){
  const {ctx,b}=houses[index],id='shopper:'+city.id+':'+ctx.c+':'+ctx.r+':'+ctx.economy.buildings.indexOf(b);
  if(index>=64)continue;ctx.world.workers??={};let w=contexts.map(c=>c.world.workers?.[id]).find(Boolean);if(!w){const home=game.nav(ctx).nearest(door(b));if(!home)continue;w=ctx.world.workers[id]={...home,c:ctx.c,r:ctx.r,team:city.team,kind:'market_woman',workerKey:id,visible:true,shoppingPhase:'market',carried:0}}
  w.kind='market_woman';w.visible=true;w.team=city.team;w.moving=false;w.working=false;w.action=null;
  // Avoid overfilling households; units are held in each house rather than the city stockpile.
  if(w.shoppingPhase==='home' && w.carried){
   w.status='Toob perele toitu';if(!travel(game,w,ctx,dt)){attach(game,city,w);continue}if(!game.nav(w).moveCitizen(w,door(b),dt,3)){attach(game,city,w);continue}
   b.foodHeld=(b.foodHeld||0)+(w.breadLoad||0);b.waterHeld=(b.waterHeld||0)+(w.waterLoad||0);w.carried=0;w.breadLoad=0;w.waterLoad=0;w.shoppingPhase='market';w.status='Viis söögi koju';attach(game,city,w);continue;
  }
  if((b.foodHeld||0)>=5&&(b.waterHeld||0)>=3){w.status='Kodus';w.carried=0;if(travel(game,w,ctx,dt))game.nav(w).moveCitizen(w,door(b),dt,3);attach(game,city,w);continue}
  const market=markets.slice().sort((a,b)=>Math.abs(a.ctx.c-ctx.c)+Math.abs(a.ctx.r-ctx.r)-Math.abs(b.ctx.c-ctx.c)-Math.abs(b.ctx.r-ctx.r)).find(m=>m.ctx===ctx||citizenWorldRoute(game,w,m.ctx)?.length);if(!market){w.status='Tee turule puudub';attach(game,city,w);continue;}
  w.status='Läheb turule söögi järele';if(!travel(game,w,market.ctx,dt)){attach(game,city,w);continue}if(!game.nav(w).moveCitizen(w,door(market.b),dt,3)){attach(game,city,w);continue}
  const foodNeed=Math.min(3,Math.max(0,5-(b.foodHeld||0))),waterLoad=Math.min(2,Math.max(0,4-(b.waterHeld||0)),r.resources.water||0);
  // Bring whatever is available: missing water must not stop food deliveries.
  const foodLoad=takeFood(r.resources,foodNeed);
  if(foodLoad<.01&&waterLoad<.01){w.status='Turul puudub toit ja vesi';attach(game,city,w);continue}
  r.resources.water-=waterLoad;w.breadLoad=foodLoad;w.waterLoad=waterLoad;w.carried=foodLoad+waterLoad;w.shoppingPhase='home';w.status='Ostis toidu ja vee';attach(game,city,w);
 }
}
