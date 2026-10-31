// V248: build real games on the tectonic generator and check that they are playable.
//   node tools/check-world-v248.mjs [out.png] [seed ...]
import {writeFileSync} from 'node:fs';
import {Civilization,createGame} from '../civilization-core.js';
import {COLS,ROWS} from '../campaign.js';
import {BIOME_RGB,png} from './preview-world-v248.mjs';
const out=process.argv[2]&&!/^\d+$/.test(process.argv[2])?process.argv[2]:null;
const seeds=process.argv.slice(out?3:2).map(Number);if(!seeds.length)seeds.push(11,22,33,44,55,66,77,88);
let failed=0;const tiles=[];
for(const seed of seeds){
 const t=Date.now();let game;
 try{game=new Civilization(createGame(seed,'tectonic'));}catch(e){console.log(`seed ${seed}: FAIL ${e.message}`);failed++;continue;}
 const cells=game.cells,land=cells.filter(c=>c.land),mountains=land.filter(c=>c.mountain),rivers=land.filter(c=>c.river);
 const biomes={};for(const c of land)biomes[c.visualBiome]=(biomes[c.visualBiome]||0)+1;
 const problems=[];
 for(const p of game.startLocations){const cell=game.cell(p);if(!cell?.land||cell.mountain)problems.push(`start ${p.c}:${p.r} not on open land`);}
 // every faction reaches enough land on foot from its start
 for(const p of game.startLocations){const seen=new Set([p.c+':'+p.r]),q=[p];while(q.length&&seen.size<400){const a=q.pop();for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){const b={c:a.c+dc,r:a.r+dr},k=b.c+':'+b.r;if(seen.has(k)||!game.canTraverse(0,b))continue;seen.add(k);q.push(b);}}if(seen.size<150)problems.push(`start ${p.c}:${p.r} reaches only ${seen.size} cells`);}
 if(game.s.geographyVersion!==7)problems.push('geographyVersion '+game.s.geographyVersion);
 const top=Object.entries(biomes).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+(v/land.length*100).toFixed(0)+'%').join(', ');
 console.log(`seed ${seed}: ${problems.length?'FAIL':'ok'} ${Date.now()-t} ms | land ${(land.length/cells.length*100).toFixed(0)}% mountains ${(mountains.length/land.length*100).toFixed(1)}% rivers ${rivers.length} | ${top}${problems.length?' | '+problems.join('; '):''}`);
 if(problems.length)failed++;
 if(out){const S=2,W=COLS*S,H=ROWS*S,img=Buffer.alloc(W*H*3);
  for(const c of cells){let rgb=c.land?[...(BIOME_RGB[c.visualBiome.replace('coastal_','')]||[255,0,255])]:c.h<-14?BIOME_RGB.deep:BIOME_RGB.sea;
   if(c.land&&c.river)rgb=[40,110,190];if(game.startLocations.some(p=>p.c===c.c&&p.r===c.r))rgb=[230,20,20];
   if(c.land){const k=.85+Math.min(1,c.h/40)*.25;rgb=rgb.map(x=>Math.min(255,x*k));}
   for(let y=0;y<S;y++)for(let x=0;x<S;x++){const o=((c.r*S+y)*W+c.c*S+x)*3;img[o]=rgb[0];img[o+1]=rgb[1];img[o+2]=rgb[2];}}
  tiles.push({W,H,img});}
}
if(out&&tiles.length){const cols=Math.min(3,tiles.length),rows=Math.ceil(tiles.length/cols),{W,H}=tiles[0],gap=6,TW=cols*W+(cols-1)*gap,TH=rows*H+(rows-1)*gap,img=Buffer.alloc(TW*TH*3,255);
 tiles.forEach((t,k)=>{const ox=(k%cols)*(W+gap),oy=Math.floor(k/cols)*(H+gap);for(let y=0;y<H;y++)t.img.copy(img,((oy+y)*TW+ox)*3,y*W*3,(y+1)*W*3);});
 writeFileSync(out,png(TW,TH,img));console.log('saved',out);}
console.log(failed?`FAIL: ${failed} world(s)`:'PASS: all worlds playable');process.exit(failed?1:0);
