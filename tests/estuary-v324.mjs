import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {Civilization,createGame} from '../civilization-core.js';
import {getRivers,getEstuariesV324,estuaryAtV324,visualElevation,worldElevation,baseHeight,riverNear} from '../continuous-landscape.js';
import {waterSampleV324,createUnifiedWaterV324} from '../water-surface-v324.js';
import {SEA_LEVEL_V324} from '../estuary-v324.js';
import {DETAIL_X,DETAIL_Z} from '../detail-scale-v123.js';
const results=[];
for(const seed of [77,12345,20261103]){
 const game=new Civilization(createGame(seed,'tectonic'));
 const before=JSON.stringify(game.s),edges=getRivers(game),zones=getEstuariesV324(game);
 assert.ok(zones.length>0,'real worlds have estuaries');
 let wet=0,checked=0,maxOffshoreError=0;
 for(const zone of zones)for(const seg of zone.segments){
  for(let k=0;k<=4;k++){
   const t=k/4,x=seg.a.x+(seg.b.x-seg.a.x)*t,z=seg.a.z+(seg.b.z-seg.a.z)*t;
   const field=waterSampleV324(game,x,z),estuary=estuaryAtV324(game,x,z);
   assert.ok(Object.values(field).every(Number.isFinite),'water has finite position/depth/colour');
   assert.ok(field.wet>=-.001,'channel has no dry plug on its centreline');
   if(estuary?.influence>.99&&estuary.along>-24&&estuary.along<10){
    assert.ok(visualElevation(game,x,z)<field.y-.15,'tidal channel is physically open below the water');wet++;
   }
   if(baseHeight(game,x,z)<-.5){maxOffshoreError=Math.max(maxOffshoreError,Math.abs(field.y-SEA_LEVEL_V324));}
   checked++;
  }
 }
 assert.ok(wet>10);assert.ok(maxOffshoreError<1e-8,'offshore water meets exactly the sea level');
 assert.equal(JSON.stringify(game.s),before,'drawing never mutates the saved game');
 // Old collision heights do not depend on the drawing-only estuary geometry.
 const inland=edges.find(e=>e.to.land&&!e.c.ford&&baseHeight(game,e.c.x,e.c.z)>15).c;
 assert.equal(worldElevation(game,inland.x,inland.z),worldElevation(game,inland.x,inland.z,false));
 if(seed===77){
  const zone=zones.find(z=>z.width>6)||zones[0],seg=zone.segments.find(s=>s.s>=-8)||zone.segments.at(-1);
  const x=seg.a.x,z=seg.a.z,tile=game.cells.find(c=>Math.abs(c.x-x)<=25&&Math.abs(c.z-z)<=25);
  const mesh=createUnifiedWaterV324(game,{tile,segments:72});assert.ok(mesh);
  for(const name of ['position','aDepth','aRiver'])assert.ok(mesh.geometry.attributes[name].array.every(Number.isFinite));
  assert.ok(mesh.geometry.index.count>100);assert.equal(mesh.children.length,0,'one surface, no extra river ribbon');
  // Adjacent tiles sample identical global positions; projection is reversible.
  const adjacent={...tile,x:tile.x+50};
  const a=createUnifiedWaterV324(game,{tile:adjacent,segments:72});
  const boundary=tile.x+25,collect=(m,origin)=>{const p=m.geometry.attributes.position,out=[];for(let i=0;i<p.count;i++)if(Math.abs(origin.x+p.getX(i)/DETAIL_X-boundary)<1e-4)out.push([origin.z+p.getZ(i)/DETAIL_Z,p.getY(i)]);return out.sort((a,b)=>a[0]-b[0]);};
  const left=collect(mesh,tile),right=collect(a,adjacent);
  assert.equal(left.length,right.length,'same clipped boundary vertices');
  for(let i=0;i<left.length;i++){assert.ok(Math.abs(left[i][0]-right[i][0])<1e-4);assert.ok(Math.abs(left[i][1]-right[i][1])<1e-5,'no water step at tile seam');}
  // Save a small real-world fixture so browser rendering does not regenerate a whole world.
  mkdirSync('reports',{recursive:true});
  const radius=85,n=136,heights=[],samples=[];
  for(let iz=0;iz<=n;iz++)for(let ix=0;ix<=n;ix++){const wx=x-radius+ix*radius*2/n,wz=z-radius+iz*radius*2/n;heights.push(visualElevation(game,wx,wz));samples.push(waterSampleV324(game,wx,wz));}
  writeFileSync('reports/estuary-v324-fixture.json',JSON.stringify({seed,x,z,radius,n,heights,samples}));
  mesh.geometry.dispose();mesh.material.dispose();a?.geometry.dispose();a?.material.dispose();
 }
 results.push({seed,zones:zones.length,checked,wet,maxOffshoreError});console.log('PASS',results.at(-1));
}
const riverCode=readFileSync(new URL('../continuous-landscape-visual.js',import.meta.url),'utf8');
assert.ok(!riverCode.includes('riverSurfaceOpacityV322'),'old opacity system is disconnected');
assert.ok(!riverCode.includes("emit(clip(triangle,'d'),water,true)"),'river mesh cannot overlap the ocean');
console.log('V324 unified water PASS',JSON.stringify(results));
