// V248: draw generated world maps to PNG for a quick look (no browser needed).
//   node tools/preview-world-v248.mjs out.png [seed ...]
// Colours: sea by depth, land by height and climate (the same V47 biome rules the game uses).
import {writeFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {COLS,ROWS} from '../campaign.js';
import {tectonicLayout} from '../world-tectonic-v248.js';
export const BIOME_RGB={sea:[52,96,128],deep:[30,62,94],snow_mountain:[236,238,242],mesa:[178,110,70],mountain:[128,118,108],snow:[242,244,248],taiga:[62,96,78],tundra:[150,156,130],lush_river:[70,140,70],desert:[222,196,130],jungle:[36,110,52],forest:[58,118,62],steppe:[184,178,110],grassland:[120,164,84]};
export function biomeFor({h,lat,heat,moisture,mountain}){
 const dry=Math.max(0,Math.min(1,1-moisture*.92+.08));
 if(h<1)return h<-14?'deep':'sea';
 if(mountain)return lat>.72||h>36?'snow_mountain':dry>.68&&heat>.45?'mesa':'mountain';
 if(lat>.86)return 'snow';if(lat>.73)return moisture>.42?'taiga':'tundra';
 if(heat>.72&&dry>.7)return 'desert';if(heat>.67&&moisture>.66)return 'jungle';if(moisture>.66)return 'forest';if(dry>.56)return 'steppe';return 'grassland';
}
export function png(width,height,rgb){
 const raw=Buffer.alloc((width*3+1)*height);for(let y=0;y<height;y++){raw[y*(width*3+1)]=0;rgb.copy(raw,y*(width*3+1)+1,y*width*3,(y+1)*width*3);}
 const crc=b=>{let c=~0;for(const x of b){c^=x;for(let k=0;k<8;k++)c=c>>>1^(0xedb88320&-(c&1));}return ~c>>>0;};
 const chunk=(t,d)=>{const len=Buffer.alloc(4);len.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t),d]);const cr=Buffer.alloc(4);cr.writeUInt32BE(crc(td));return Buffer.concat([len,td,cr]);};
 const ih=Buffer.alloc(13);ih.writeUInt32BE(width,0);ih.writeUInt32BE(height,4);ih[8]=8;ih[9]=2;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
export function drawLayout(L,scale=2){
 const W=COLS*scale,H=ROWS*scale,img=Buffer.alloc(W*H*3);
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const i=r*COLS+c,h=L.heights[i],lat=L.lat[i];
  let rgb=[...BIOME_RGB[biomeFor({h,lat,heat:L.heat[i],moisture:L.moisture[i],mountain:h>30})]];
  if(h>=1){const shade=.82+Math.min(1,h/40)*.3;rgb=rgb.map(x=>Math.min(255,x*shade));}
  if(L.starts.some(p=>p.c===c&&p.r===r))rgb=[255,0,0];
  for(let y=0;y<scale;y++)for(let x=0;x<scale;x++){const o=((r*scale+y)*W+c*scale+x)*3;img[o]=rgb[0];img[o+1]=rgb[1];img[o+2]=rgb[2];}}
 return {W,H,img};
}
if(import.meta.url===`file://${process.argv[1]}`){
 const out=process.argv[2]||'world-v248.png',seeds=process.argv.slice(3).map(Number);if(!seeds.length)seeds.push(1,2,3,4,5,6);
 const tiles=seeds.map(s=>{const t=Date.now(),L=tectonicLayout(s),d=drawLayout(L);const land=L.heights.filter(h=>h>=1).length,mount=L.heights.filter(h=>h>30).length;
  console.log(`seed ${s}: ${Date.now()-t} ms, land ${(land/(COLS*ROWS)*100).toFixed(0)}%, mountains ${(mount/land*100).toFixed(1)}% of land, starts ${JSON.stringify(L.starts)}`);return d;});
 const cols=Math.min(3,tiles.length),rows=Math.ceil(tiles.length/cols),W=tiles[0].W,H=tiles[0].H,gap=6,TW=cols*W+(cols-1)*gap,TH=rows*H+(rows-1)*gap,img=Buffer.alloc(TW*TH*3,255);
 tiles.forEach((t,k)=>{const ox=(k%cols)*(W+gap),oy=Math.floor(k/cols)*(H+gap);for(let y=0;y<H;y++)t.img.copy(img,((oy+y)*TW+ox)*3,y*W*3,(y+1)*W*3);});
 writeFileSync(out,png(TW,TH,img));console.log('saved',out);
}
