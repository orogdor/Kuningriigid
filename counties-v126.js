// A county includes its urban area and has at most three times its tile count.
export const COUNTY_BUILDING_LIMIT=3;
export const countyTileLimit=radius=>3*(2*radius+1)**2;
export const countySearchRadius=radius=>Math.ceil((Math.sqrt(3)*(2*radius+1)-1)/2);
export const urbanTile=(city,p,radius)=>Math.max(Math.abs(p.c-city.c),Math.abs(p.r-city.r))<=radius;
export function countyFootprint(city,radius,cellAt){
 const span=countySearchRadius(radius),queue=[{c:city.c,r:city.r}],seen=new Set(),tiles=[];
 for(let i=0;i<queue.length;i++){
  const p=queue[i],key=p.c+':'+p.r;
  if(seen.has(key)||Math.max(Math.abs(p.c-city.c),Math.abs(p.r-city.r))>span)continue;
  seen.add(key);const cell=cellAt(p);if(!cell)continue;
  tiles.push(p);
  // As with urban territory, the claim cannot jump across open sea.
  if(!cell.land)continue;
  for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]])queue.push({c:p.c+dc,r:p.r+dr});
 }
 tiles.sort((a,b)=>Number(urbanTile(city,b,radius))-Number(urbanTile(city,a,radius))||
  ((a.c-city.c)**2+(a.r-city.r)**2)-((b.c-city.c)**2+(b.r-city.r)**2)||a.r-b.r||a.c-b.c);
 return tiles.slice(0,countyTileLimit(radius));
}
export const countyBuildingCount=ctx=>ctx.economy.buildings.filter(b=>!b.virtual&&b.hp>0).length;
export function countyBuildRule(ctx,type,allowed){
 if(!allowed.has(type))return 'Maakonnas saab ehitada ainult maa tootmis- ja taristuhooneid. Elamud ja linnahooned ehita linna alale.';
 if(countyBuildingCount(ctx)>=COUNTY_BUILDING_LIMIT)return 'Maakonnaruudul võib olla kuni 3 hoonet (ka pooleliolevad).';
 return '';
}
