import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {DetailStreamV242} from '../detail-stream-v242.js?v=319';
import {DETAIL_HALF_X,DETAIL_TILE_X} from '../detail-scale-v123.js';

const original=globalThis.matchMedia;
globalThis.matchMedia=()=>({matches:true});
try{
 const tiles=new Map();
 for(let r=0;r<11;r++)for(let c=0;c<11;c++)tiles.set(c+':'+r,{c,r});
 const scene=new T.Group();
 const stream=new DetailStreamV242({scene,cell:(c,r)=>tiles.get(c+':'+r),build:function*(){yield;},dispose:()=>{},budget:2});
 assert.equal(stream.radius,2,'desktop receives one extra visible ring');
 stream.activate(tiles.get('5:5'));
 assert.equal(stream.entries.size,25,'5 x 5 tiles created for desktop');
 assert.equal([...stream.entries.values()].filter(e=>e.root.visible).length,0,'unfinished detail is covered by the horizon');
 const east=tiles.get('6:5');
 let point=stream.limitMovement(DETAIL_HALF_X-3,0,20,0,()=>true);
 assert.equal(stream.targetKey,'6:5','movement requests the destination early');
 assert.ok(point.x<DETAIL_HALF_X,'camera stays inside the completed map');
 stream.prefetch(DETAIL_HALF_X-3,-70,1,0);
 assert.equal(stream.targetKey,'6:5','panning along a corner still loads the edge being approached');
 stream.finish(east);
 assert.equal(stream.canCross(east),false,'destination also needs its visible neighbours');
 for(const tile of stream.neighbours(east))stream.finish(tile);
 assert.equal(stream.canCross(east),true);
 point=stream.limitMovement(DETAIL_HALF_X-3,0,20,0,()=>true);
 assert.ok(point.x>DETAIL_HALF_X,'camera resumes automatically when the next 3x3 is ready');
 assert.ok(point.x<DETAIL_TILE_X,'one movement input cannot skip a tile');
 assert.equal([...stream.entries.values()].filter(e=>e.decor.visible).length,1,'only central overlapping sea and rivers render');
 stream.activate(east);
 assert.ok(stream.entries.size>=25,'next tiles prefetched on movement');
 assert.equal(stream.desired.size,25,'extra ring follows the player');
 assert.ok(stream.neighbours(east).every(tile=>stream.entries.get(stream.key(tile)).root.visible),'completed 3x3 remains visible after activation');
}finally{
 if(original===undefined)delete globalThis.matchMedia;
 else globalThis.matchMedia=original;
}
console.log('V319 desktop 5x5 detail streaming PASS');
