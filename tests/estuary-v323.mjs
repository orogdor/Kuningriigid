import assert from 'node:assert/strict';
import {Civilization,createGame} from '../civilization-core.js';
import {getRivers,baseHeight,estuaryShoreHeightV323} from '../continuous-landscape.js';
import {mouthZonesV322,riverSurfaceOpacityV322,localNaturalSeaGroundV322} from '../estuary-v322.js';
import {DETAIL_X,DETAIL_Z} from '../detail-scale-v123.js';

const game=new Civilization(createGame(77,'tectonic'));
const mouths=mouthZonesV322(getRivers(game));
assert.ok(mouths.length>=1);
for(const m of mouths){
 const alpha=riverSurfaceOpacityV322(game,m.b.x,m.b.z,mouths);
 assert.ok(alpha>=0&&alpha<.000001,'transparent at outlet, no hard dark river tip');
 for(let i=0;i<=12;i++){
  const x=m.a.x+(m.b.x-m.a.x)*i/12,z=m.a.z+(m.b.z-m.a.z)*i/12;
  const val=riverSurfaceOpacityV322(game,x,z,mouths);
  assert.ok(Number.isFinite(val)&&val>=0&&val<=1,'opacity remains bounded');
 }
}
const tile=game.cells.find(c=>c.land&&baseHeight(game,c.x,c.z)>10);
assert.ok(tile);
for(const [x,z] of [[0,0],[42,-27],[109,77],[-103,-70]]){
 const actual=localNaturalSeaGroundV322(game,tile,x,z,DETAIL_X,DETAIL_Z)/.30+.7;
 const expected=estuaryShoreHeightV323(game,tile.x+x/DETAIL_X,tile.z+z/DETAIL_Z);
 assert.ok(Math.abs(actual-expected)<1e-6,'sea uses same shoreline height field');
}
console.log('V323 estuary shoreline, fade and sea sampling PASS');
