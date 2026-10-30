import assert from 'node:assert/strict';
import {scoutSectorPositionV236,scoutDetailPositionV240,scoutWorldFromDetailV240} from '../scout-sector-v236.js';
const tile={c:17,r:12,x:500,z:800};
const start={x:500,z:800};
const a=scoutDetailPositionV240(start,tile);
assert.deepEqual([a.sectorX,a.sectorZ],[4,4],'center 8x8 sector');
assert.deepEqual([a.x,a.z],[0,0],'smooth scout should start at tile center');
const mid=scoutDetailPositionV240({x:506.25,z:809.375},tile);
assert.equal(mid.x,28.125);
assert.equal(mid.z,36.5625);
assert.equal(mid.sectorX,5);
const jump=scoutSectorPositionV236({x:506.25,z:809.375},tile);
assert.ok(Math.abs(jump.x-mid.x)>0.01,'old 8x8 snap is not world-smooth');
for(let dx=-24;dx<=24;dx+=3)for(let dz=-24;dz<=24;dz+=3){
 const world={x:500+dx,z:800+dz},local=scoutDetailPositionV240(world,tile);
 const back=scoutWorldFromDetailV240(tile,local);
 assert.ok(Math.abs(back.x-world.x)<1e-8);
 assert.ok(Math.abs(back.z-world.z)<1e-8);
 assert.ok(local.sectorX>=0&&local.sectorX<=7&&local.sectorZ>=0&&local.sectorZ<=7);
}
console.log('V240 scout world/detail coordinate + smooth motion PASS');
