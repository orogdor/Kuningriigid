import assert from 'node:assert/strict';
import {Civilization,createGame} from '../civilization-core.js';
import {estuaryV249,getRivers} from '../continuous-landscape.js';

let lakes=0,plainJunctions=0,mouths=0,shifted=0,minLake=Infinity,maxLake=0;
for(const seed of [77,20261103,12345]){
 const game=new Civilization(createGame(seed,'tectonic'));
 const edges=getRivers(game),byCell=new Map(edges.map(e=>[e.c.r*220+e.c.c,e]));
 const incoming=new Map();for(const e of edges){const k=e.to.r*220+e.to.c;incoming.set(k,(incoming.get(k)||0)+1);}
 for(const e of edges){
  assert.equal(e.points.length,13);
  for(const p of e.points)assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z)&&Number.isFinite(p.width)&&p.width>0,'finite river samples');
  const next=byCell.get(e.to.r*220+e.to.c);
  if(next){const a=e.points.at(-1),b=next.points[0];assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<1e-6,'reaches join exactly');}
  if(!e.to.land){mouths++;assert.ok(game.atlasHeight(e.points.at(-1).x,e.points.at(-1).z)<1.1,'mouth enters sea');assert.ok(Math.hypot(e.points.at(-1).x-e.c.x,e.points.at(-1).z-e.c.z)<=50.01,'mouth does not project past sea cell');}
  const a=e.points[0];if(Math.hypot(a.x-e.c.x,a.z-e.c.z)>1)shifted++;
  // Visual smoothing must never shift strategic crossing coordinates.
  if(e.c.ford||e.c.bridge)
   assert.ok(Math.hypot(a.x-e.c.x,a.z-e.c.z)<1e-6,'ford/bridge anchor stays fixed');
  // The rendering and terrain samplers use the same, deterministic reach.
  assert.strictEqual(getRivers(game),edges,'river geometry remains cached between views');
  for(let i=1;i<e.points.length-1;i++){
   const p=e.points[i-1],q=e.points[i],n=e.points[i+1];
   assert.ok(Math.hypot(n.x-2*q.x+p.x,n.z-2*q.z+p.z)<18,'no severe intra-cell sawtooth');
  }
  const k=e.c.r*220+e.c.c;
  if((incoming.get(k)||0)>=2&&e.c.land&&e.to.land&&!e.c.ford&&!e.c.bridge&&e.c.h>=4){
   const inlandWidth=a.width/(1+1.5*estuaryV249(game,a.x,a.z));
   if(inlandWidth>e.c.riverWidth+2){lakes++;minLake=Math.min(minLake,inlandWidth);maxLake=Math.max(maxLake,inlandWidth);}else plainJunctions++;
  }
 }
}
assert.ok(mouths>0&&shifted>0,'mouths and smoothed anchors exist');
assert.ok(lakes>0&&plainJunctions>0,'only some confluences become lakes');
assert.ok(maxLake-minLake>3,'confluence lakes have visibly different sizes');
console.log('V314 river shapes PASS',JSON.stringify({lakes,plainJunctions,mouths,shifted,minLake,maxLake}));
