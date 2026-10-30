import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {scoutSectorAxisV236,scoutSectorPositionV236,blendScoutPositionV236} from '../scout-sector-v236.js';
import {torchLocationsV235,createCityTorchesV235,updateCityTorchesV235,dayClockV235} from '../daynight-v235.js';

const tile={x:500,z:800};
const mid=scoutSectorPositionV236({x:500,z:800},tile);
assert.equal(mid.sectorX,4);assert.equal(mid.sectorZ,4);
assert.equal(mid.offsetC,0);assert.equal(mid.offsetR,0);
assert.ok(mid.x>0&&mid.x<225/8);
assert.ok(mid.z>0&&mid.z<195/8);
// World map movement across 50 m tile edges must map to adjacent detail tiles.
const left=scoutSectorPositionV236({x:476,z:800},tile);
const right=scoutSectorPositionV236({x:525,z:800},tile);
assert.equal(left.sectorX,0);assert.equal(left.offsetC,0);
assert.equal(right.sectorX,0);assert.equal(right.offsetC,1);
assert.ok(right.x>225/2&&right.x<225+225/8);
for(let dx=-125;dx<=125;dx+=3.125){
 const a=scoutSectorAxisV236(500+dx,500,225);
 assert.ok(a.sector>=0&&a.sector<8);
 assert.ok(Math.abs(a.local-dx*4.5)<=225/16+1e-6);
}
assert.deepEqual(blendScoutPositionV236({x:0,z:0},{x:100,z:30},0),{x:0,z:0});
const interpolated=blendScoutPositionV236({x:0,z:0},{x:100,z:30},.04);
assert.ok(interpolated.x>0&&interpolated.x<100);
assert.deepEqual(blendScoutPositionV236({x:0,z:0},{x:100,z:30},1),{x:100,z:30});

const buildings=[
 {type:'house',x:0,z:0,hp:100,ready:true,buildingRotationV228:0},
 {type:'house',x:20,z:20,hp:100,ready:true,buildingRotationV228:Math.PI/2},
 {type:'woodgate',x:40,z:0,hp:100,ready:true,wallAxis:1},
 {type:'field',x:60,z:60,hp:100,ready:true},
 {type:'house',x:80,z:80,hp:0,ready:true}
];
const spots=torchLocationsV235(buildings);
assert.equal(spots.length,4,'one torch per house; paired gate torches');
const first=spots.find(p=>p.kind==='house'&&p.doorX===0);
assert.ok(Math.abs(first.x-1.25)<.01&&Math.abs(first.z-3.5)<.01);
const turned=spots.find(p=>p.kind==='house'&&p.doorX===20);
assert.ok(Math.abs(turned.x-23.5)<.01&&Math.abs(turned.z-18.75)<.01);
const gate=spots.filter(p=>p.kind==='woodgate');
assert.equal(gate.length,2);
assert.ok(gate.every(p=>Math.abs(p.x-41.4)<.01));
const group=createCityTorchesV235(buildings,()=>1.7);
const models=group.userData.torchModelsV235;
assert.equal(models.length,spots.length);
assert.ok(models.every(m=>m.root.position.y>1.6&&m.root.position.y<1.8));
assert.ok(models.every(m=>m.flame.children.length>=3),'layered, curved flame tongues');
assert.ok(models.every(m=>m.root.children.some(o=>o.geometry?.type==='TorusGeometry')),'metal/rope details');
updateCityTorchesV235(group,dayClockV235(840),840);
assert.ok(models.every(m=>m.flame.visible&&m.halo.visible));
assert.ok(models.filter(m=>m.light).every(m=>m.light.intensity>0));
updateCityTorchesV235(group,dayClockV235(240),240);
assert.ok(models.every(m=>!m.flame.visible&&!m.halo.visible));
assert.ok(models.filter(m=>m.light).every(m=>m.light.intensity===0));
const crowded=Array.from({length:100},(_,i)=>({type:'house',x:i*13,z:0,hp:100,ready:true}));
const crowd=createCityTorchesV235(crowded,()=>0);
assert.ok(crowd.userData.torchModelsV235.length<=22);
assert.ok(crowd.userData.torchModelsV235.filter(m=>m.light).length<=4);
console.log('V236 scouts and entrance torches PASS');
