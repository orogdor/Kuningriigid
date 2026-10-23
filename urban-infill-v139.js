// V139: dense historical center first, then connected street quarters and the countryside.
export const V139_CORE_HOUSES=16;
const built=ctx=>ctx?.economy?.buildings?.filter(b=>b.hp>0&&!b.virtual)||[];
export function cityInfillRank(parent,ctx,type,game){
 const x=ctx.c-parent.c,z=ctx.r-parent.r,dist=Math.abs(x)+Math.abs(z);
 const root=built(parent),homes=root.filter(b=>b.type==='house').length;
 const local=built(ctx),localHomes=local.filter(b=>b.type==='house').length;
 const openCivic=['market','warehouse','cellar','study','scriptorium','well'].includes(type);
 // All unique public buildings start close to the old town hall.
 if(type!=='house'&&openCivic)return dist*75+(dist===0?0:local.length>0?12:32);
 // Keep residents within a connected urban fabric; never found multiple
 // distant empty districts just because they have a cheap spare building slot.
 if(dist===0)return homes<V139_CORE_HOUSES?-200:localHomes<23?18:105;
 const firstRing=dist===1;
 if(!firstRing){
  // Expansion beyond the four immediate neighbors requires a genuinely
  // settled adjoining quarter, not merely an isolated warehouse.
  const connected=[[1,0],[-1,0],[0,1],[0,-1]].some(([dc,dr])=>{
   const p={c:ctx.c+dc,r:ctx.r+dr};
   const other=game.contextAt(p,false);
   return built(other).filter(b=>b.type==='house').length>=8;
  });
  if(!connected)return 450+dist*50;
 }
 const settlement=localHomes>0?-55+localHomes*1.8:local.length>0?-8:32;
 // Infill a first-ring neighborhood to ~12 houses before another opens.
 return dist*17+settlement+(localHomes>=12?110:0)+(ctx.expandV138?7:0);
}
export function coreFoodAndServices(buildings,age){
 const active=new Set((buildings||[]).filter(b=>b.hp>0&&!b.disabled).map(b=>b.type));
 const priority=age>=1?['market','warehouse','cellar','study','scriptorium','well']:
                          ['study','well','house'];
 return priority.filter(type=>!active.has(type));
}
