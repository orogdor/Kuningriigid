import {MINERAL_BUILDINGS} from './resource-sites-v88.js';
import {DETAIL_HALF_X,DETAIL_HALF_Z,DETAIL_TILE_X,DETAIL_TILE_Z} from './detail-scale-v123.js';
import {stoneFieldClusterScore} from './stone-town-plan-v163.js';
import {fieldCrossesWoodenRingV168} from './stone-fort-footprints-v168.js';
import {AI_FIELD_WIDTH,AI_FIELD_DEPTH,validateField} from './farming-v127.js';
import {detailHeight} from './world-details.js';
// Find a usable field before funding a remote farmhouse, and use the same
// search when its construction finishes. No fields or buildings are granted.
export function findAIFieldSite(game,ctx,farm=null){
 const nav=game.nav(ctx),sample=farm?{...ctx,economy:{...ctx.economy,buildings:[...ctx.economy.buildings,{...farm,type:'farm',hp:350}]}}:ctx,points=[];
 for(let x=-DETAIL_HALF_X+AI_FIELD_WIDTH/2+4;x<=DETAIL_HALF_X-AI_FIELD_WIDTH/2-4;x+=12)for(let z=-DETAIL_HALF_Z+AI_FIELD_DEPTH/2+4;z<=DETAIL_HALF_Z-AI_FIELD_DEPTH/2-4;z+=12)points.push({x,z,width:AI_FIELD_WIDTH,depth:AI_FIELD_DEPTH});
 const home=farm||ctx.economy.buildings.find(b=>b.type==='farm'&&b.ready&&b.hp>0)||{x:0,z:0};
 const parent=game.parentCity?.(ctx),stoneAge=game.s?.ages?.[ctx.team]===0;
 const hall=parent?.economy?.buildings?.find(b=>b.type==='hall'&&!b.virtual)||{x:0,z:0};
 const fields=ctx.economy.buildings.filter(b=>b.type==='field'&&b.hp>0);
 const score=p=>stoneAge&&parent?stoneFieldClusterScore(p,home,fields,{
  x:(ctx.c-parent.c)*DETAIL_TILE_X+p.x-hall.x,
  z:(ctx.r-parent.r)*DETAIL_TILE_Z+p.z-hall.z
 }):Math.hypot(p.x-home.x,p.z-home.z);
 points.sort((a,b)=>score(a)-score(b)||a.z-b.z||a.x-b.x);
 for(const p of points){
  // A planted field is permanent until its owner removes or rebuilds it.
  // Keep the full width of each surveyed palisade span and both gates clear.
  if(stoneAge&&parent&&ctx.c===parent.c&&ctx.r===parent.r&&
   fieldCrossesWoodenRingV168(p,parent.stoneDefensePlanV166||parent.stoneDefenseReserveV168))continue;
  if(validateField(sample,p,(x,z)=>nav.passable(x,z)))continue;
  let lo=Infinity,hi=-Infinity;for(let x=-p.width/2;x<=p.width/2;x+=4)for(let z=-p.depth/2;z<=p.depth/2;z+=4){const h=detailHeight(game.cell(ctx),p.x+x,p.z+z);lo=Math.min(lo,h);hi=Math.max(hi,h);}
  if(hi-lo<=1.8)return p;
 }
 return null;
}

export function ruralSourceExhausted(game,parent,b){
 if(!b.ready)return false;
 const kind=MINERAL_BUILDINGS[b.type];
 if(kind){const ctx=game.contexts(parent).find(ctx=>ctx.economy.buildings.includes(b));if(ctx){const site=ctx.world.resources.find(r=>r.kind===kind&&(b.depositId==null||r.id===b.depositId));return !site||site.removed||site.amount<=0;}}
 return /pole ligipääsetavat|Ootab eraldi|ammend/.test(b.status||'');
}
