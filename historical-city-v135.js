// V135 — organic, deterministic AI settlements. Never bypass terrain, footprints or nav checks.
export const AI_CITY_SPACING=9; // roughly half the former 17-tile separation
const COMMERCE=new Set(['house','market','bakery','well','inn','chapel','guildhall','townhall','study','school','warehouse','cellar','university','scriptorium']);
const RURAL=new Set(['lumber','quarry','mine','coal','claypit','oilwell','hunter','farm','pasture','forester','fisher','field','harbor','watermill','windmill','coppermine','tinmine']);
const hash=(a,b,seed)=>{const n=Math.sin(a*127.1+b*311.7+seed*19.19)*43758.5453;return n-Math.floor(n);};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function historicalCitySites(h,type='house',seed=0){
 if(!h)return [];
 const sites=[],seen=new Set(),outskirts=RURAL.has(type),phase=hash(h.x,h.z,seed)*Math.PI*2;
 // Tangled, curved rings produce street-side plots rather than square blocks.
 // Start near the hall: production buildings still move outward naturally as plots fill.
 for(let band=0;band<6;band++){
  const radius=9+band*6.65,count=Math.max(8,Math.ceil(2*Math.PI*radius/8.3));
  for(let i=0;i<count;i++){
   const theta=phase+2*Math.PI*(i+(band%2)*.42)/count+.13*band+
    (hash(i,band,seed)-.5)*.19;
   const r=radius+(hash(band,i,seed+8)-.5)*2.8;
   // Different width and mild bends make settlement edges organically irregular.
   const dx=Math.cos(theta)*r + .11*Math.sin(theta*2+phase)*band;
   const dz=Math.sin(theta)*r*.88 + .09*Math.cos(theta*3-phase)*band;
   const p={x:Math.round((h.x+dx)*2)/2,z:Math.round((h.z+dz)*2)/2};
   if(Math.abs(p.x)>40||Math.abs(p.z)>26||dist(p,h)<7)continue;
   const key=p.x+':'+p.z;if(seen.has(key))continue;seen.add(key);
   sites.push(p);
  }
 }
 // Rural production is eligible for farther rings but remains reachable from the hall.
 return sites.sort((a,b)=>{
  const score=p=>dist(p,h)+(outskirts?-Math.min(12,dist(p,h))*.38:0);
  return score(a)-score(b)||a.z-b.z||a.x-b.x;
 });
}
export function historicalDistrictOrder(city,contexts){
 const r=Math.max(1,city.radius||1),phase=hash(city.c,city.r,city.id||0)*Math.PI*2;
 return [...contexts].sort((a,b)=>{
  const score=p=>{
   const x=p.c-city.c,z=p.r-city.r;
   // Elliptic/round growth before diagonal corner-fill: less square urban sprawl.
   return (x*x+z*z)/(r*r)+.09*Math.sin(x*1.7+z*.9+phase)+.12*Math.abs(x*z)/Math.max(1,r*r);
  };
  return score(a)-score(b)||a.r-b.r||a.c-b.c;
 });
}
export function historicalSiteScore(h,p,type,buildings=[],deposits=[]){
 if(deposits.length)return Math.min(...deposits.map(d=>dist(d,p)));
 const radius=dist(h,p),others=buildings.filter(b=>b.hp>0&&!b.virtual&&b.type!=='hall'&&!['palisade','stonewall','reinforced_wall'].includes(b.type));
 const nearest=others.length?Math.min(...others.map(b=>dist(b,p))):11;
 const commercial=COMMERCE.has(type),rural=RURAL.has(type);
 const companions=others.filter(b=>commercial?COMMERCE.has(b.type):rural?RURAL.has(b.type):!RURAL.has(b.type));
 const companion=companions.length?Math.min(...companions.map(b=>dist(b,p))):12;
 // Prefer small winding neighbourhoods; leave periphery for noisy industries.
 return radius*(rural?.55:1)+Math.abs(nearest-9)*.35+Math.abs(companion-12)*.27+
    hash(p.x,p.z,type.length)*1.4;
}
