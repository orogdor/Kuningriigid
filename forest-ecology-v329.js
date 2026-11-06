// Shared habitat rules for world stands, detail trees and regrowth visuals.
export const biomeV329=cell=>String(typeof cell==='string'?cell:cell?.visualBiome||cell?.biome||'forest').replace(/^coastal_/, '');
export const forestV329=cell=>['forest','taiga','jungle'].includes(biomeV329(cell));
export function treeMixV329(cell='forest'){
 const b=biomeV329(cell),climate=typeof cell==='object'?cell.visualClimate||{}:{};
 if(['sea','snow','snow_mountain','mesa'].includes(b))return [];
 if(b==='desert')return cell?.river?[['palm',1]]:[];
 if(b==='jungle'||b==='oasis')return [['palm',1]];
 if(b==='taiga'||b==='mountain'||(b==='forest'&&climate.heat<.42))return [['spruce',.5],['pine',.35],['birch',.15]];
 if(b==='tundra')return [['birch',.55],['spruce',.35],['pine',.1]];
 if(b==='steppe'||(b==='forest'&&climate.moisture<.5))return [['pine',.65],['oak',.35]];
 if(b==='lush_river')return [['birch',.4],['lime',.35],['oak',.25]];
 return [['oak',.5],['lime',.28],['birch',.22]];
}
export function pickTreeV329(cell,random){let sum=0;const mix=treeMixV329(cell);for(const [kind,weight]of mix){sum+=weight;if(random<sum)return kind;}return mix.at(-1)?.[0]||null;}
export function detailCompanionsV329(cell,tree){
 if(!forestV329(cell))return [];
 // One understorey tree per mature resource; tied to its visibility and growth.
 const n=Math.sin(tree.id*127.1+cell.c*19.7+cell.r*83.1)*43758.5453,r=n-Math.floor(n),angle=r*Math.PI*2;
 return [{x:tree.x+Math.cos(angle)*4.2,z:tree.z+Math.sin(angle)*4.2,seed:tree.id+104729,scale:.66+r*.12}];
}
