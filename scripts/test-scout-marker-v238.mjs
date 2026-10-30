import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {scoutSectorPositionV236} from '../scout-sector-v236.js';
const fakeContext={
 beginPath(){},roundRect(){},fill(){},stroke(){},arc(){},fillText(){},
 set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},
 set font(v){},set textAlign(v){},set textBaseline(v){}
};
globalThis.document={createElement(type){assert.equal(type,'canvas');return {width:320,height:112,getContext:()=>fakeContext};}};
const {attachScoutMarkerV238,sizeScoutMarkerV238}=await import('../scout-marker-v238.js');
const root=new T.Group(),sameTeam=new T.Group();
const marker=attachScoutMarkerV238(root,0);
assert.equal(marker,root.userData.scoutMarkerV238);
assert.equal(attachScoutMarkerV238(root,0),marker,'idempotent');
assert.equal(marker.children.filter(o=>o.isSprite).length,1,'the label is a camera-facing sprite');
assert.equal(marker.children.filter(o=>o.isMesh).length,1,'ground ring present');
const label=marker.children.find(o=>o.isSprite);
assert.equal(label.material.depthTest,true);
assert.equal(label.material.depthWrite,false);
assert.equal(marker.visible,true);
assert.ok(label.scale.x>=1&&label.scale.x<=5,'visible label must be compact');
sizeScoutMarkerV238(root,100);
const near=label.scale.x;
sizeScoutMarkerV238(root,210);
assert.ok(label.scale.x>near,'distant camera increases marker size');
const other=attachScoutMarkerV238(sameTeam,0);
assert.equal(other.children.find(o=>o.isSprite).material,label.material,'texture is shared');
const sector=scoutSectorPositionV236({x:525,z:800},{x:500,z:800});
assert.equal(sector.offsetC,1,'neighbour tile scout keeps world sector');
assert.equal(sector.sectorX,0);
assert.ok(sector.x>112.5);
const camera=new T.Object3D();
camera.position.set(0,1,2);
root.updateWorldMatrix(true,true);
camera.updateWorldMatrix(true,true);
sizeScoutMarkerV238(root,150,{names:true,firstPerson:true,camera});
assert.equal(label.visible,false,'label hidden beside first-person camera');
camera.position.set(0,1,22);camera.updateWorldMatrix(true,true);
sizeScoutMarkerV238(root,150,{names:true,firstPerson:true,camera});
assert.equal(label.visible,true,'label visible at safe range');
sizeScoutMarkerV238(root,150,{names:false,camera});
assert.equal(label.visible,false,'names off hides label');
assert.equal(marker.children.find(o=>o.isMesh).visible,true,'scout ground circle remains');
console.log('V238/V239 scout finder compact label, names and sector PASS');
