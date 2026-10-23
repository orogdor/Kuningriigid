import {DETAIL_HALF_X,DETAIL_HALF_Z} from './detail-scale-v123.js';
import {AI_FIELD_WIDTH,AI_FIELD_DEPTH,validateField} from './farming-v127.js';
import {detailHeight} from './world-details.js';
// Find a usable field before funding a remote farmhouse, and use the same
// search when its construction finishes. No fields or buildings are granted.
export function findAIFieldSite(game,ctx,farm=null){
 const nav=game.nav(ctx),sample=farm?{...ctx,economy:{...ctx.economy,buildings:[...ctx.economy.buildings,{...farm,type:'farm',hp:350}]}}:ctx,points=[];
 for(let x=-DETAIL_HALF_X+AI_FIELD_WIDTH/2+4;x<=DETAIL_HALF_X-AI_FIELD_WIDTH/2-4;x+=12)for(let z=-DETAIL_HALF_Z+AI_FIELD_DEPTH/2+4;z<=DETAIL_HALF_Z-AI_FIELD_DEPTH/2-4;z+=12)points.push({x,z,width:AI_FIELD_WIDTH,depth:AI_FIELD_DEPTH});
 const home=farm||ctx.economy.buildings.find(b=>b.type==='farm'&&b.ready&&b.hp>0)||{x:0,z:0};
 points.sort((a,b)=>Math.hypot(a.x-home.x,a.z-home.z)-Math.hypot(b.x-home.x,b.z-home.z));
 for(const p of points){
  if(validateField(sample,p,(x,z)=>nav.passable(x,z)))continue;
  let lo=Infinity,hi=-Infinity;for(let x=-p.width/2;x<=p.width/2;x+=4)for(let z=-p.depth/2;z<=p.depth/2;z+=4){const h=detailHeight(game.cell(ctx),p.x+x,p.z+z);lo=Math.min(lo,h);hi=Math.max(hi,h);}
  if(hi-lo<=1.8)return p;
 }
 return null;
}
