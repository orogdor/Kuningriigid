import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {DetailStreamV242} from '../detail-stream-v242.js?v=320';

// Simulated jobs: nearby trees should become available before optional
// expensive sea/horizon work; a large unfinished tile must not starve others.
const oldMatch=globalThis.matchMedia;
globalThis.matchMedia=()=>({matches:true});
try{
 const cells=new Map();
 for(let r=0;r<9;r++)for(let c=0;c<9;c++)cells.set(c+':'+r,{c,r});
 let clock=0;
 const stream=new DetailStreamV242({
  scene:new T.Group(),cell:(c,r)=>cells.get(c+':'+r),budget:14,clock:()=>++clock,
  dispose:()=>{},
  build:function*(entry){
   entry.stage='terrain';yield;
   entry.stage='resources';yield;
   entry.stage='ground cover';entry.treesReady=true;yield;
   entry.stage='horizon';for(let i=0;i<35;i++)yield;
   entry.stage='sea';yield;
  }
 });
 stream.activate(cells.get('4:4'));
 assert.equal(stream.radius,2);
 for(let i=0;i<20;i++)stream.tick();
 const neighbours=[...stream.entries.values()].filter(e=>Math.max(Math.abs(e.tile.c-4),Math.abs(e.tile.r-4))<=1);
 assert.equal(neighbours.length,9);
 assert.ok(neighbours.every(e=>e.treesReady),'all neighbouring trees load before costly deferred decoration');
 assert.ok(neighbours.some(e=>!e.ready),'test must demonstrate partial progressive loading');
 assert.ok([...stream.entries.values()].some(e=>!e.ready),'25 tiles remain under a bounded frame budget');
 console.log('V320 progressive nearby vegetation PASS');
}finally{
 if(oldMatch===undefined)delete globalThis.matchMedia;
 else globalThis.matchMedia=oldMatch;
}
