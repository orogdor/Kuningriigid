import {detailHeight} from './world-details.js?v=123a';
import {localSurface} from './continuous-landscape.js?v=162a';
import {DETAIL_X,DETAIL_Z} from './detail-scale-v123.js';

export const MINERAL_BUILDINGS=Object.freeze({quarry:'stone',mine:'ore',coppermine:'copper',tinmine:'tin',claypit:'clay',gem_mine:'gems',oilwell:'oil'});
export const COASTAL_BUILDINGS=new Set(['fisher','harbor']);
const mineralKinds=new Set(Object.values(MINERAL_BUILDINGS));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function mineralSite(world,type){const kind=MINERAL_BUILDINGS[type];return world.resources.find(r=>r.kind===kind&&r.depositSite&&!r.removed&&r.amount>0);}

// Keep resource IDs stable in V4 saves: workers use array indices as IDs.
// Legacy scattered deposits are merged without replenishing extracted stock.
export function consolidateMinerals(world,cell,buildings=[]){
 if(world.mineralSitesVersion===1)return world;
 for(const kind of mineralKinds){
  const existing=world.resources.filter(r=>r.kind===kind),extractor=buildings.find(b=>MINERAL_BUILDINGS[b.type]===kind&&b.hp>0);
  if(!existing.length&&!cell.deposits?.[kind])continue;
  let site=existing[0];
  if(!site){
   const candidates=[];
   for(let x=-54;x<=54;x+=9)for(let z=-45;z<=45;z+=9){
    if(Math.hypot(x,z)<25||[-4,0,4].some(dx=>[-4,0,4].some(dz=>detailHeight(cell,x+dx,z+dz)<=.4)))continue;
    if(world.resources.some(r=>r.depositSite&&distance(r,{x,z})<16)||buildings.some(b=>distance(b,{x,z})<12))continue;
    const levels=[[-3,-3],[-3,3],[3,-3],[3,3]].map(([dx,dz])=>detailHeight(cell,x+dx,z+dz));
    candidates.push({x,z,score:Math.max(...levels)-Math.min(...levels)+Math.abs(x)*.0001});
   }
   candidates.sort((a,b)=>a.score-b.score);
   if(!candidates.length)continue;
   const p=candidates[(cell.c*7+cell.r*11+kind.length)%Math.min(8,candidates.length)];
   site={id:world.resources.length,kind,x:p.x,z:p.z,amount:kind==='oil'?12000:8400,removed:false};world.resources.push(site);
  }
  const amount=existing.length?existing.reduce((n,r)=>n+Math.max(0,r.amount||0),0):site.amount;
  if(extractor){site.x=extractor.x;site.z=extractor.z;}
  else if(existing.length){
   // Put the combined deposit on usable ground, not a cliff or another
   // building's footprint simply because that rock happened to come first.
   const options=[...existing];
   for(let x=-54;x<=54;x+=9)for(let z=-45;z<=45;z+=9)if(Math.hypot(x,z)>=25)options.push({x,z});
   const usable=options.map(p=>{const h=[[-4,-4],[-4,4],[4,-4],[4,4]].map(([dx,dz])=>detailHeight(cell,p.x+dx,p.z+dz));return {...p,slope:Math.max(...h)-Math.min(...h),dry:Math.min(...h)>.4};}).filter(p=>p.dry&&p.slope<1.7&&!buildings.some(b=>distance(b,p)<12)&&!world.resources.some(r=>r!==site&&r.depositSite&&distance(r,p)<16));
   const hall=buildings.find(b=>b.type==='hall')||{x:0,z:0};usable.sort((a,b)=>(a.slope+distance(a,hall)*.002)-(b.slope+distance(b,hall)*.002));if(usable.length){site.x=usable[0].x;site.z=usable[0].z;}
  }
  for(const r of existing)if(r!==site){r.amount=0;r.removed=true;r.mergedDeposit=true;}
  Object.assign(site,{depositSite:true,amount,capacity:amount,removed:amount<=0});
  for(const b of buildings)if(MINERAL_BUILDINGS[b.type]===kind)b.depositId=site.id;
 }
 world.mineralSitesVersion=1;world.revision=(world.revision||0)+1;
 return world;
}

export function mineralPlacement(world,type,p,buildings=[]){
 const site=mineralSite(world,type);
 if(!site)return {error:'Sellel detailkaardil puudub kasutatav maardla.'};
 if(buildings.some(b=>MINERAL_BUILDINGS[b.type]===site.kind&&b.hp>0))return {error:'Sellele maardlale on kaevandus juba rajatud.'};
 if(distance(site,p)>6)return {error:'Paiguta kaevandus otse maardla hunnikule.'};
 return {p:{x:site.x,z:site.z},depositId:site.id};
}
export function harvestMineral(world,b,d,dt,multiplier=1){
 const r=world.resources?.[b.depositId];
 if(!r||r.removed||r.amount<=0){b.status='Maardla on ammendunud';return 0;}
 b.status='Kaevandab';b.extractionTimer=(b.extractionTimer||0)+dt*multiplier;
 if(b.extractionTimer<d.cycle)return 0;
 b.extractionTimer-=d.cycle;const amount=Math.min(d.rate,r.amount);r.amount-=amount;
 if(r.amount<=0){r.removed=true;world.revision++;}
 return amount;
}

const shoreCache=new WeakMap();
// Local +Z is inland; -Z is the pier. Sample the actual rendered sea edge,
// not rivers or merely a world-map tile marked as coastal.
export function coastalPlacement(game,cell,type,p){
 const height=(x,z)=>localSurface(game,cell,x,z);
 const dx=height(p.x+2,p.z)-height(p.x-2,p.z),dz=height(p.x,p.z+2)-height(p.x,p.z-2);
 const len=Math.hypot(dx,dz);if(len<.001)return {error:'Vali mererand: pool hoonest peab jääma merre ja pool maale.'};
 const inland={x:dx/len,z:dz/len},side={x:inland.z,z:-inland.x};
 const sample=(q,t,u=0)=>({x:q.x+inland.x*t+side.x*u,z:q.z+inland.z*t+side.z*u});
 let lo=-6,hi=6;
 const low=sample(p,lo),high=sample(p,hi);
 if(height(low.x,low.z)>=0||height(high.x,high.z)<=.15)return {error:'Vali rannajoon, mitte sisemaa või avameri.'};
 for(let i=0;i<12;i++){const mid=(lo+hi)/2,q=sample(p,mid);if(height(q.x,q.z)>0)hi=mid;else lo=mid;}
 const q=sample(p,(lo+hi)/2),depth=type==='harbor'?8:6;
 if(Math.abs(q.x)>129||Math.abs(q.z)>114)return {error:'Kogu rannahoone peab mahtuma sellele detailkaardile.'};
 for(const u of [-2,0,2]){
  const land=sample(q,7.5,u),water=sample(q,-7.5,u);
  const ocean=game.atlasHeight(cell.x+water.x/DETAIL_X,cell.z+water.z/DETAIL_Z)<.7;
  if(height(land.x,land.z)<=.15||height(water.x,water.z)>=0||!ocean)return {error:'Hoone maaosa peab jääma kuivale ja kai merre.'};
 }
 const entry=sample(q,Math.max(11.5,depth+4));
 if(detailHeight(cell,entry.x,entry.z)<=.2||height(entry.x,entry.z)<=.15)return {error:'Hoone maapoolsele sissepääsule puudub kuiv ligipääs.'};
 return {p:{x:q.x,z:q.z},shoreAngle:Math.atan2(inland.x,inland.z),landEntry:entry,baseY:.22};
}
export function coastalSites(game,cell,type){
 let cache=shoreCache.get(game);if(!cache){cache=new Map();shoreCache.set(game,cache);}
 const key=cell.c+':'+cell.r+':'+type;if(cache.has(key))return cache.get(key);
 const result=[],seen=new Set();
 for(let x=-120;x<=120;x+=6)for(let z=-108;z<=108;z+=6){const r=coastalPlacement(game,cell,type,{x,z});if(r.error)continue;const k=Math.round(r.p.x)+':'+Math.round(r.p.z);if(!seen.has(k)){seen.add(k);result.push({x,z});}}
 cache.set(key,result);return result;
}
