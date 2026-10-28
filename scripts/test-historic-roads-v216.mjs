import assert from 'node:assert/strict';
import {roadSurfaceLevelV216,roadWidthRatioV216,roadEdgeVarianceV216} from '../road-appearance-v216.js';
import {Civilization,createGame} from '../civilization-core.js';
import {roadSpline} from '../continuous-landscape.js';
for(const age of [0,1,2,3,4,5])for(let level=1;level<=4;level++){
 const value=roadSurfaceLevelV216(level,age);
 assert.ok(value>=1&&value<=4);
 if(age===0)assert.equal(value,1);
 if(age<=2)assert.ok(value<=2,'prehistoric road must not have modern paving');
 assert.ok(roadWidthRatioV216(level,age)>.5&&roadWidthRatioV216(level,age)<=1);
}
for(const [x,z] of [[0,0],[100,80],[-100,42]])assert.ok(roadEdgeVarianceV216(x,z)>.8&&roadEdgeVarianceV216(x,z)<1.1);
const game=new Civilization(createGame(7931247));
const road=roadSpline(game,{c:80,r:55},{c:81,r:55},24);
assert.equal(road.length,25);
assert.deepEqual(road,roadSpline(game,{c:81,r:55},{c:80,r:55},24));
for(const p of road)assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.z));
console.log('V216 ROAD MATERIAL LEVEL, TAPER, CURVE CONTINUITY PASS');
