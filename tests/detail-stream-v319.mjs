import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {DetailStreamV242} from '../detail-stream-v242.js?v=319';

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
 assert.equal([...stream.entries.values()].filter(e=>e.root.visible).length,25,'all 25 detail terrains are visible');
 assert.equal([...stream.entries.values()].filter(e=>e.decor.visible).length,1,'only central overlapping sea and rivers render');
 stream.activate(tiles.get('6:5'));
 assert.ok(stream.entries.size>=25,'next tiles prefetched on movement');
 assert.equal([...stream.entries.values()].filter(e=>e.root.visible).length,25,'extra ring follows the player');
}finally{
 if(original===undefined)delete globalThis.matchMedia;
 else globalThis.matchMedia=original;
}
console.log('V319 desktop 5x5 detail streaming PASS');
