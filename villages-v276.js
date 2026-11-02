// V276: the independent villages of the map are built from the same Stone Age buildings as the player's
// towns and come in two kinds:
//  - raiders: a war band's village inside a palisade ring with watchtowers; after the 20-minute peace it
//    sends raiding parties to the nearest player town (you get a warning when they set out). A town with a
//    palisade or watchtower, or at least two warriors at home, drives them off; otherwise they carry off part
//    of its stores. Raider villages cannot be claimed by a scout.
//  - traders: an open market village; you can trade with it from any of your towns within TRADE_RANGE tiles,
//    and it also buys your surplus. It can still be visited once for its welcome gift.
// The kind and layout follow the village's id, so they are the same in every save without new state.
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296;};
export const TRADE_RANGE_V276=22,RAID_EVERY_V276=420,RAID_RANGE_V276=28;
export const villageTypeV276=l=>l?.kind!=='village'?null:hash(l.id+':kind')<.42?'raiders':'traders';
export const VILLAGE_NAMES_V276={raiders:'Röövlite küla',traders:'Kaupmeeste küla'};
// layout in detail-map units around the tile centre (same frame as a city's buildings)
export function villageLayoutV276(l){
 const type=villageTypeV276(l),out=[],rot=a=>Math.atan2(-Math.cos(a),-Math.sin(a));
 const put=(t,x,z,angle)=>out.push({type:t,x:Math.round(x),z:Math.round(z),hp:1000,ready:true,team:-1,buildingRotationV228:angle??Math.atan2(-x,-z)});
 put('hall',0,0,hash(l.id)*6.28);
 const houses=6+Math.floor(hash(l.id+'h')*3);
 for(let i=0;i<houses;i++){const a=i/houses*Math.PI*2+hash(l.id)*1.3;put('house',Math.cos(a)*16,Math.sin(a)*14);}
 if(type==='raiders'){
  put('barracks',0,-24);put('archery',22,-10);
  // V278: one closed palisade ring: overlapping segments laid along the ring, the four watchtowers stand
  // IN the wall (replacing segments) and the gate is a wall segment facing south
  const R=36,RZ=R*.86,N=36,towers=new Set([N/8,3*N/8,5*N/8,7*N/8].map(Math.round)),gate=Math.round(N/4);
  for(let i=0;i<N;i++){const a=i/N*Math.PI*2,x=Math.cos(a)*R,z=Math.sin(a)*RZ,tx=-Math.sin(a)*R,tz=Math.cos(a)*RZ,rot=Math.atan2(-tz,tx);
   const type_=towers.has(i)?'watchtower':i===gate?'woodgate':'palisade';
   out.push({type:type_,x:Math.round(x*10)/10,z:Math.round(z*10)/10,hp:1000,ready:true,team:-1,wallAngleV175:rot,buildingRotationV228:rot,wallRingV278:true});}
 }else{
  for(const [t,a] of [['cellar',.3],['cellar',2.4],['pottery_kiln',1.3],['farm',3.6],['farm',4.6],['well',5.5],['fisher',.9]].filter(([t])=>t!=='fisher'))put(t,Math.cos(a)*30,Math.sin(a)*26);
 }
 return out;
}
// ---- trade
// V278: every village lives at the level of the nearest great nation (its age): buildings on the detail map,
// raid strength and the goods it trades follow that age.
export function villageAgeV278(game,l){
 const near=(game.s.cities||[]).filter(c=>c.districtOf==null).sort((a,b)=>dist(a,l)-dist(b,l))[0];
 return near?Math.max(0,Math.min(6,game.s.ages?.[near.team]||0)):0;
}
const ERA_OFFERS_V278=[
 [],
 [{id:'sell_copper',label:'Müü 10 vaske',give:{copper:10},get:{gold:14}},{id:'buy_tin',label:'Osta 6 tina',give:{gold:15},get:{tin:6}},{id:'buy_bronze',label:'Osta 5 pronksi',give:{gold:22},get:{bronze:5}},{id:'sell_cutstone',label:'Müü 10 tahutud kivi',give:{cutstone:10},get:{gold:16}}],
 [{id:'buy_iron',label:'Osta 8 rauda',give:{gold:20},get:{iron:8}},{id:'sell_weapons',label:'Müü 5 relva',give:{weapons:5},get:{gold:26}},{id:'buy_coal',label:'Osta 10 sütt',give:{gold:12},get:{coal:10}}],
 [{id:'buy_cloth',label:'Osta 6 riiet',give:{gold:18},get:{cloth:6}},{id:'sell_grain',label:'Müü 20 vilja',give:{grain:20},get:{gold:12}}],
 [{id:'buy_paper',label:'Osta 8 paberit',give:{gold:20},get:{paper:8}},{id:'buy_spices',label:'Osta 4 vürtsi',give:{gold:24},get:{spices:4}}],
 [{id:'buy_steel',label:'Osta 6 terast',give:{gold:30},get:{steel:6}},{id:'sell_machines',label:'Müü 3 masinat',give:{machines:3},get:{gold:40}}],
 [{id:'buy_fuel',label:'Osta 8 kütust',give:{gold:28},get:{fuel:8}}]
];
export function tradeOffersV278(age=0){let out=[...TRADE_OFFERS_V276];for(let a=1;a<=age;a++)out=[...ERA_OFFERS_V278[a],...out];return out.slice(0,10);}
export const TRADE_OFFERS_V276=[
 {id:'sell_wood',label:'Müü 20 puitu',give:{wood:20},get:{gold:9}},
 {id:'sell_stone',label:'Müü 20 kivi',give:{stone:20},get:{gold:11}},
 {id:'sell_pottery',label:'Müü 5 savinõud',give:{pottery:5},get:{gold:14}},
 {id:'buy_food',label:'Osta 25 toitu',give:{gold:12},get:{bread:25}},
 {id:'buy_clay',label:'Osta 15 savi',give:{gold:8},get:{clay:15}},
 {id:'buy_plank',label:'Osta 10 lauda',give:{gold:10},get:{plank:10}}
];
const dist=(a,b)=>Math.abs(a.c-b.c)+Math.abs(a.r-b.r);
export function tradeTownV276(game,l,team=0){
 const towns=game.s.cities.filter(c=>c.team===team&&c.districtOf==null).sort((a,b)=>dist(a,l)-dist(b,l));
 return towns.find(c=>dist(c,l)<=TRADE_RANGE_V276)||null;
}
export function tradeWithVillageV276(game,landmarkId,offerId,team=0){
 const l=game.s.landmarks?.find(x=>x.id===landmarkId);if(!l||villageTypeV276(l)!=='traders')return {error:'See ei ole kaupmeeste küla.'};
 if(!game.s.explored?.[team]?.[l.c+':'+l.r])return {error:'Küla pole veel avastatud.'};
 const town=tradeTownV276(game,l,team);if(!town)return {error:'Ükski sinu linn pole küla lähedal ('+TRADE_RANGE_V276+' ruutu).'};
 const offer=tradeOffersV278(villageAgeV278(game,l)).find(o=>o.id===offerId);if(!offer)return {error:'Seda kaupa see küla praegu ei vaheta.'};
 const res=town.economy.realms[team].resources;
 for(const [k,v] of Object.entries(offer.give))if((res[k]||0)<v)return {error:'Linnal '+town.name+' pole piisavalt: '+k+'.'};
 for(const [k,v] of Object.entries(offer.give))res[k]-=v;
 for(const [k,v] of Object.entries(offer.get))res[k]=(res[k]||0)+v;
 l.tradesV276=(l.tradesV276||0)+1;
 return {ok:true,town:town.name,text:offer.label+' — '+town.name};
}
// ---- raids
const defended=(game,town,age=0)=>{const all=game.allBuildings?game.allBuildings(town):town.economy.buildings;
 return all.some(b=>['palisade','watchtower','stonewall','stonetower','woodgate'].includes(b.type)&&b.ready&&b.hp>0)||
  (game.s.units||[]).filter(u=>u.team===town.team&&u.hp>0&&u.kind!=='scout'&&(u.cityId===town.id||u.cityId==null)).length>=2+age;};
// advance raids; returns messages for the player
export function raidTickV276(game,dt,peace){
 const s=game.s,msgs=[];s.raidsV276??=[];
 if(peace)return msgs;
 for(const l of (s.landmarks||[]).filter(l=>villageTypeV276(l)==='raiders'&&!l.destroyedV276)){
  l.raidClockV276=(l.raidClockV276??hash(l.id+'r')*RAID_EVERY_V276)+dt;
  if(l.raidClockV276<RAID_EVERY_V276||s.raidsV276.some(r=>r.from===l.id))continue;
  const target=s.cities.filter(c=>c.districtOf==null&&dist(c,l)<=RAID_RANGE_V276).sort((a,b)=>dist(a,l)-dist(b,l))[0];
  if(!target)continue;
  l.raidClockV276=0;const eta=40+dist(target,l)*6;
  const age=villageAgeV278(game,l);s.raidsV276.push({id:l.id+'@'+Math.round(s.time),from:l.id,to:target.id,start:s.time,eta,fc:l.c,fr:l.r,age,men:3+age*2});
  if(target.team===0)msgs.push({warn:true,text:'Hoiatus: '+VILLAGE_NAMES_V276.raiders+' saatis '+(3+age*2)+'-mehelise röövsalga '+target.name+' poole! Saabub ~'+Math.round(eta)+' s pärast.'});
 }
 for(const r of [...s.raidsV276]){
  if(s.time-r.start<r.eta)continue;
  s.raidsV276.splice(s.raidsV276.indexOf(r),1);
  const town=s.cities.find(c=>c.id===r.to);if(!town)continue;
  if(defended(game,town,r.age||0)){if(town.team===0)msgs.push({text:'Röövsalk löödi '+town.name+' juures tagasi.'});continue;}
  const res=town.economy.realms[town.team].resources,taken=[];
  for(const k of ['bread','wood','stone','gold',...(r.age>=1?['bronze','copper']:[]),...(r.age>=2?['iron','weapons']:[])]){const v=Math.min(60+(r.age||0)*30,Math.floor((res[k]||0)*.25));if(v>0){res[k]-=v;taken.push(v+' '+k);}}
  if(town.team===0)msgs.push({warn:true,text:'Röövlid rüüstasid '+town.name+': '+(taken.join(', ')||'midagi polnud võtta')+'. Ehita palisaad/vahitorn või hoia linnas sõdalasi.'});
 }
 return msgs;
}
// position of a raiding party for drawing (world tile coordinates, fractional)
export function raidPositionV276(game,r){
 const town=game.s.cities.find(c=>c.id===r.to);if(!town)return null;
 const t=Math.max(0,Math.min(1,(game.s.time-r.start)/r.eta));return {c:r.fc+(town.c-r.fc)*t,r:r.fr+(town.r-r.fr)*t,heading:Math.atan2(town.c-r.fc,town.r-r.fr)};
}
