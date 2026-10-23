// V137 - historically plausible development across the *entire* owned town/county.
// No artificial structures: every selection still runs normal technology, material,
// terrain, collision, navigation and builder access checks.
export const DISTRICT_PLAN_VERSION=137;
const hash=(a,b,c=0)=>{const n=Math.sin(a*127.1+b*311.7+c*19.19)*43758.5453;return n-Math.floor(n)};
export function historicalTilePlan(city,tile,urban,age=0){
 if(!tile?.land||tile.mountain)return [];
 const dep=tile.deposits||{},d=Math.hypot(tile.c-city.c,tile.r-city.r);
 if(urban){
  if(d<.7)return ['market','warehouse','cellar','house','study','scriptorium'];
  // Urban belts form quarters: markets/trades nearer the centre; quiet homes
  // on irregular side streets. Taller public buildings stay on firm land.
  const district=hash(tile.c,tile.r,city.id||0);
  if(district<.27)return ['house','house','well','warehouse','scriptorium'];
  if(district<.55)return ['house','house','saw','pottery_kiln','mason'];
  if(district<.77)return ['house','house','barracks','archery','study'];
  return ['house','house','market','cellar','warehouse'];
 }
 // County plots remain rural. Mines go only on real deposits, fishermen
 // only to the actual ocean shore, fields only on fertile ground.
 const jobs=[];
 if(dep.grain)jobs.push('farm','vegetable_garden');
 if(dep.game)jobs.push('hunter');
 if(dep.wood)jobs.push('lumber');
 if(dep.stone)jobs.push('quarry');
 if(dep.water)jobs.push('well');
 if(dep.clay)jobs.push('claypit');
 if(dep.copper&&age>=1)jobs.push('coppermine');
 if(dep.tin&&age>=1)jobs.push('tinmine');
 if(dep.ore&&age>=2)jobs.push('mine');
 if(dep.oil&&age>=6)jobs.push('oilwell');
 if(tile.coast)jobs.unshift(age>=1?'harbor':'fisher');
 // Pastures and orchards occupy open country without useful raw deposits.
 if(age>=1)jobs.push('pasture','forester');
 else jobs.push('pasture');
 return [...new Set(jobs)];
}
export function historicalTilePriority(city,tile,urban,buildings=0){
 const d=Math.hypot(tile.c-city.c,tile.r-city.r);
 const dep=tile.deposits||{};
 // Empty residential plots in the core are most urgent; rural fields and
 // resource sites follow. Keep vacant rocky patches as natural landscape.
 const useful=Number(!!dep.grain||!!dep.wood||!!dep.stone||!!dep.game||!!dep.water||!!tile.coast);
 return (urban?30:useful?18:8)-buildings*33-d*.35+hash(tile.c,tile.r,city.id||0)*.7;
}
