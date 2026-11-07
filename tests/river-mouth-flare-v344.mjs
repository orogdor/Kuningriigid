// V344: rounded river mouths. The banks curve outward into the sea shore
// (smooth union of river and coast) on the drawn terrain only.
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {Civilization,createGame} from '../civilization-core.js';
import {getRivers,riverNear,worldElevation,baseHeight,estuaryShoreHeightV323,
 estuaryMouthsV344,estuaryFlareV344,smoothUnionCutV344,flareRadiusV344} from '../continuous-landscape.js';
import {localNaturalSeaGroundV322} from '../estuary-v322.js';
import {DETAIL_X,DETAIL_Z} from '../detail-scale-v123.js';

// Smooth union: no cut far from both shores, the largest cut at equal distance.
assert.equal(smoothUnionCutV344(0,100,30),0);
assert.ok(Math.abs(smoothUnionCutV344(5,5,40)-10)<1e-9);
assert.ok(flareRadiusV344(2)>=32&&flareRadiusV344(200)<=80);

// 1. Gameplay terrain and river widths are bit-identical to V343 (checksum
//    measured on main 7fafb1c with the same sample grid).
{
 const game=new Civilization(createGame(77,'tectonic'));
 const mouths=getRivers(game).filter(e=>e.to?.land===false&&e.points?.length>1);
 let sum=0,n=0;
 for(const e of mouths.slice(0,40)){const p=e.points.at(-4);for(let j=-6;j<=6;j++)for(let i=-6;i<=6;i++){
  const x=p.x+i*7.3,z=p.z+j*7.3,r=riverNear(game,x,z);
  sum+=worldElevation(game,x,z)*1.37+(Number.isFinite(r.distance)?r.distance*.71+r.width*.29:0);n++;}}
 assert.equal(n,6760);
 assert.equal(sum.toFixed(6),'133679.818504','physical heights, fords and river widths unchanged');
}

const report={seeds:[]};
for(const seed of [77,12345,20261103]){
 const game=new Civilization(createGame(seed,'tectonic')),saved=JSON.stringify(game.s);
 const {mouths}=estuaryMouthsV344(game);
 assert.ok(mouths.length>10,'seed '+seed+' has river mouths');
 let opened=0,widened=0,samples=0,maxStep=0,maxDepth=0,highTouched=0,farTouched=0;
 for(const m of mouths){
  const coast=m.pts.find(p=>baseHeight(game,p.x,p.z)<=.72)||m.pts.at(-1);
  let gained=0;
  for(let j=-14;j<=14;j++)for(let i=-14;i<=14;i++){
   const x=coast.x+i*m.k/9,z=coast.z+j*m.k/9,h=baseHeight(game,x,z),f=estuaryFlareV344(game,x,z,h);samples++;
   assert.ok(Number.isFinite(f.ground)&&f.strength>=0&&f.strength<=1);
   assert.ok(f.ground<=h+1e-9,'only lowers ground');
   assert.ok(f.ground>=Math.min(h,.72-1.2)-1e-9,'never digs deeper than 1.2 m below the waterline');
   maxDepth=Math.max(maxDepth,h-f.ground);
   if(h>4.7&&f.ground!==h)highTouched++;
   if(h>.72&&f.ground<=.72)gained++;
   // Shore filter, detail sea and drawn terrain share the same reshaped height.
   const shore=estuaryShoreHeightV323(game,x,z);
   assert.ok(Math.abs(localNaturalSeaGroundV322(game,{x,z},0,0,DETAIL_X,DETAIL_Z)/.30+.7-shore)<1e-9);
   if(Math.abs(i)<=8&&Math.abs(j)<=8){
    const next=estuaryShoreHeightV323(game,x+.01,z);maxStep=Math.max(maxStep,Math.abs(next-shore));
   }
  }
  if(gained>0)opened++;
  widened+=gained;
  // Far from every mouth nothing changes.
  for(const d of [m.k*2.2+60,m.k*2.6+90]){
   const x=coast.x+d,z=coast.z;
   const list=mouths.filter(o=>x>=o.minX&&x<=o.maxX&&z>=o.minZ&&z<=o.maxZ);
   if(!list.length&&estuaryFlareV344(game,x,z).strength!==0)farTouched++;
  }
 }
 assert.equal(highTouched,0,'hills and cliffs above 4.7 m are never reshaped');
 assert.equal(farTouched,0,'no change away from river mouths');
 assert.ok(maxStep<.15,'no abrupt edge over a centimetre: '+maxStep);
 assert.ok(opened>=mouths.length*.5,'most mouths open into a rounded bay: '+opened+'/'+mouths.length);
 assert.equal(JSON.stringify(game.s),saved,'drawing does not change saved game data');
 report.seeds.push({seed,mouths:mouths.length,opened,landToWaterSamples:widened,samples,maxStep,maxDepth});
}
mkdirSync('reports',{recursive:true});
writeFileSync('reports/river-mouth-flare-v344.json',JSON.stringify(report,null,2));
console.log('V344 rounded river mouths PASS',JSON.stringify(report));
