import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Civilization,createGame} from '../civilization-core.js';
import {baseHeight,getRivers} from '../continuous-landscape.js';
import {DETAIL_X,DETAIL_Z} from '../detail-scale-v123.js';
import {SEA_LEVEL_V322,naturalSeaDepthV322,localNaturalSeaGroundV322,
 mouthZonesV322,riverSurfaceOpacityV322} from '../estuary-v322.js';

const game=new Civilization(createGame(77,'tectonic'));
const edges=getRivers(game),zones=mouthZonesV322(edges);
assert.ok(zones.length>0,'real map contains outlets');
assert.equal(zones.length,edges.filter(e=>!e.to.land).length,'every ocean outlet receives a zone');
for(const zone of zones){
 const p=zone.b;
 const val=riverSurfaceOpacityV322(game,p.x,p.z,zones);
 assert.ok(Number.isFinite(val)&&val>=0&&val<=1,'mouth opacity finite and bounded');
 const nextX=p.x+zone.ux*10,nextZ=p.z+zone.uz*10;
 if(baseHeight(game,nextX,nextZ)<SEA_LEVEL_V322)
  assert.ok(riverSurfaceOpacityV322(game,nextX,nextZ,zones)<.02,'river tint cannot reappear offshore');
}
const tile=game.cells.find(c=>c.land&&baseHeight(game,c.x,c.z)>8);
assert.ok(tile,'inland dry tile exists');
const depth=naturalSeaDepthV322(game,tile.x,tile.z);
assert.ok(depth<0,'natural inland terrain must not flood even if river trench is deep');
assert.ok(Math.abs(depth-(SEA_LEVEL_V322-baseHeight(game,tile.x,tile.z)))<1e-8);
for(const [x,z] of [[0,0],[54,-49],[-112,93]]){
 const sample=localNaturalSeaGroundV322(game,tile,x,z,DETAIL_X,DETAIL_Z);
 const original=baseHeight(game,tile.x+x/DETAIL_X,tile.z+z/DETAIL_Z);
 assert.ok(Math.abs(sample/0.30+0.7-original)<1e-7,'sea samples undisturbed world-coordinate terrain');
}
const main=readFileSync(new URL('../civilization.js',import.meta.url),'utf8');
assert.ok(main.includes('localNaturalSeaGroundV322(game,tile,x,z,DETAIL_X,DETAIL_Z)'),'sea mesh must NOT sample excavated riverbed');
const rivers=readFileSync(new URL('../continuous-landscape-visual.js',import.meta.url),'utf8');
assert.ok(rivers.includes('riverSurfaceOpacityV322(game,p.x,p.z,estuaries)'),'new mouth fade is wired to water surface');
assert.ok(!rivers.includes('estuaryOpacityV318(p.x,p.z,estuaries)'),'old mouth fade is disabled');
console.log('V322 independent river-mouth/sea ownership PASS',zones.length);
