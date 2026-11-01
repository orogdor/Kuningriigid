// Detail tiles cover 225 x 195 local metres while the world tile remains 50 x 50.
import {DETAIL_TILE_X,DETAIL_TILE_Z,DETAIL_X,DETAIL_Z} from './detail-scale-v123.js';
import {treeKeepV270,KEEP_MEAN_V270,FOREST_BIOMES_V270} from './forest-clumps-v270.js';
// V250 treesByBiome (new worlds): tree count per detail tile follows the visible biome.
// V270: forests denser again (forest 190 -> 300) and trees follow the shared world clump field
export const TREES_BY_BIOME_V250={forest:300,jungle:320,taiga:290,lush_river:110,grassland:75,steppe:24,tundra:10,mesa:3,desert:0,snow:0,snow_mountain:0,mountain:30};
export function bakeDetails(cells,sample,seed,{treesByBiomeV250=false}={}){
 const random=(a,b)=>{const n=Math.sin(a*127.1+b*311.7+seed*.017)*43758.5453;return n-Math.floor(n)};
 for(const cell of cells){
  const heights=[];for(let j=0;j<=8;j++)for(let i=0;i<=8;i++)heights.push(Math.round((sample(cell.x+(i/8-.5)*50,cell.z+(j/8-.5)*50)-.7)*30)/100);
  const city=cell.c===10&&cell.r===11?0:cell.c===17&&cell.r===9?1:null;
  cell.detail={heights,city,feature:city!==null?'city':Math.min(...heights)<0&&Math.max(...heights)>0?'coast':cell.biome,resources:[]};
  const vb=String(cell.visualBiome||'').replace('coastal_','');
  const count=treesByBiomeV250&&vb in TREES_BY_BIOME_V250?Math.round(TREES_BY_BIOME_V250[vb]*1.25):cell.biome==='forest'?176:cell.biome==='hills'?65:45; // V254: denser forests (was 110)
  const forestV270=FOREST_BIOMES_V270.has(vb||cell.biome),clumpV270=treesByBiomeV250,oversample=clumpV270?Math.round(count/(forestV270?KEEP_MEAN_V270.forest:KEEP_MEAN_V270.open)):count;
  for(let i=0;i<oversample;i++){const x=Math.round((random(cell.c*200+i,cell.r+91)*DETAIL_TILE_X*.94-DETAIL_TILE_X*.47)*10)/10,z=Math.round((random(cell.c*200+i,cell.r+779)*DETAIL_TILE_Z*.92-DETAIL_TILE_Z*.46)*10)/10;
   if(clumpV270&&random(cell.c*313+i,cell.r*7+3)>treeKeepV270(cell.x+x/DETAIL_X,cell.z+z/DETAIL_Z,forestV270))continue;
   if(detailHeight(cell,x,z)>.4&&Math.abs(z)>16)cell.detail.resources.push([i%5===0?1:0,x,z]);
  }
 }
 return cells;
}
export function detailHeight(cell,x,z){
 const h=cell.detail?.heights;if(!h)return .3;
 const fx=Math.max(0,Math.min(8,(x/DETAIL_TILE_X+.5)*8)),fz=Math.max(0,Math.min(8,(z/DETAIL_TILE_Z+.5)*8)),i=Math.min(7,Math.floor(fx)),j=Math.min(7,Math.floor(fz)),u=fx-i,v=fz-j;
 return (h[j*9+i]*(1-u)+h[j*9+i+1]*u)*(1-v)+(h[(j+1)*9+i]*(1-u)+h[(j+1)*9+i+1]*u)*v;
}
export const featureNames={city:'Linn',coast:'Mererand',river:'Jõgi',sea:'Avameri',forest:'Mets',hills:'Mägismaa',plains:'Tasandik'};
