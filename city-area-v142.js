// V143: faster population growth, with a strict 12-by-12 urban envelope.
export const MAX_CITY_EXTENT=12,MAX_CITY_RADIUS=6;
export function cityExtent(radius){return Math.min(MAX_CITY_EXTENT,2*Math.max(1,Math.floor(radius))+1);}
export function populationCityRadius(pop){return Math.min(MAX_CITY_RADIUS,Math.max(1,Math.floor(Math.sqrt(Math.max(0,Number(pop)||0)))));}
export function grownCityRadius(previous,pop){return Math.min(MAX_CITY_RADIUS,Math.max(1,Number(previous)||1,populationCityRadius(pop)));}
export const nextCityPopulation=radius=>radius>=MAX_CITY_RADIUS?null:(Math.max(1,Math.floor(radius))+1)**2;
export function cityEnvelopeContains(city,p,extent=MAX_CITY_EXTENT){const lo=-Math.floor((extent-1)/2),hi=lo+extent-1;return p.c-city.c>=lo&&p.c-city.c<=hi&&p.r-city.r>=lo&&p.r-city.r<=hi;}
// Legacy suburb flags may extend an allocated shape, but can never bypass
// the new maximum width/depth, including a coastline-shifted city footprint.
export function urbanExpansionFits(city,tiles){
 let loC=city.c,hiC=city.c,loR=city.r,hiR=city.r;
 const add=k=>{const[c,r]=k.split(':').map(Number);loC=Math.min(loC,c);hiC=Math.max(hiC,c);loR=Math.min(loR,r);hiR=Math.max(hiR,r);};
 for(const k of tiles||[])add(k);
 for(const [k,d]of Object.entries(city.districts||{}))if(d.urbanExpansionV138)add(k);
 return hiC-loC<12&&hiR-loR<12;
}
