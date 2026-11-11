import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {DetailStreamV242} from '../detail-stream-v242.js?v=341';
import {DETAIL_TILE_X,DETAIL_TILE_Z} from '../detail-scale-v123.js';

// V341: while moving on the detail map the outer 5x5 ring used to wait behind
// the 3x3 neighbourhood forever (and behind each neighbour's centre-only
// horizon), so the player effectively saw a 3x3 window. Full detail now
// follows what the game camera sees.
const camera=new T.PerspectiveCamera(43,16/9,.1,20000);
function look(stream,x,z,zoom=200){
 camera.position.set(x+zoom*.48,zoom*.78,z+zoom*.8);camera.lookAt(x,0,z);camera.updateMatrixWorld(true);
 stream.setView(camera,x,z);
}
function makeStream(desktop,{size=40,budget=12}={}){
 const original=globalThis.matchMedia;globalThis.matchMedia=()=>({matches:desktop});
 try{
  const cells=new Map();for(let r=0;r<size;r++)for(let c=0;c<size;c++)cells.set(c+':'+r,{c,r});
  let clock=0;
  const stream=new DetailStreamV242({scene:new T.Group(),cell:(c,r)=>cells.get(c+':'+r)||null,budget,clock:()=>++clock,dispose:()=>{},
   build:function*(entry){
    entry.stage='terrain';yield;entry.terrain=true;
    entry.stage='resources';yield;
    entry.stage='ground cover';yield;entry.trees=true;
    entry.stage='buildings';yield;entry.shown=true;
    entry.stage='horizon';for(let i=0;i<40;i++)yield; // the expensive 9x9 coarse land
    entry.stage='roads';for(let i=0;i<6;i++)yield;
   }});
  return {stream,cells};
 }finally{if(original===undefined)delete globalThis.matchMedia;else globalThis.matchMedia=original;}
}
const ring=(e,center)=>Math.max(Math.abs(e.tile.c-center.c),Math.abs(e.tile.r-center.r));

{ // Desktop: the 25-tile budget is spent where the camera looks.
 const {stream,cells}=makeStream(true);
 const center=cells.get('20:20');
 stream.finish(center);stream.activate(center);look(stream,0,0);
 const desired=[...stream.desired];
 assert.equal(desired.length,25,'desktop keeps a 25 tile full-detail budget');
 assert.ok(desired.some(k=>k.endsWith(':17')),'one ring further ahead (up the screen) gets full detail');
 const inView=[];for(let dr=-3;dr<=3;dr++)for(let dc=-3;dc<=3;dc++)if(stream.inView(dc,dr))inView.push((20+dc)+':'+(20+dr));
 assert.ok(inView.every(k=>stream.desired.has(k)),'every tile the camera sees within reach gets full detail');
 assert.ok(!desired.includes('23:20')&&!desired.includes('20:23'),'tiles three rings behind/beside the camera are not loaded');
 // Visible tiles load before out-of-view spare tiles.
 for(let i=0;i<40;i++)stream.tick();
 const shown=[...stream.entries.values()].filter(e=>e.shown).map(e=>e.key);
 const spare=desired.filter(k=>!inView.includes(k));
 assert.ok(spare.length>0&&spare.every(k=>!shown.includes(k)),'spare out-of-view tiles wait');
 assert.ok(inView.filter(k=>k!=='20:20').every(k=>shown.includes(k)),'all on-screen tiles show terrain, trees and buildings first');
 for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)assert.ok(stream.desired.has((20+dc)+':'+(20+dr)),'3x3 neighbourhood is always kept for crossings');
 assert.ok([...stream.entries.values()].every(e=>!e.root.visible||e.visualReady),'unfinished tiles keep the horizon fallback');
 // Looking from the far side moves the window with the view direction.
 camera.position.set(-96,156,-160);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);stream.setView(camera,0,0);
 assert.ok([...stream.desired].some(k=>k.endsWith(':23')),'reversed view direction loads the opposite side');
}

{ // Desktop movement: every in-view tile of the 5x5 window gets terrain and trees.
 const {stream,cells}=makeStream(true);
 let center=cells.get('20:20');stream.finish(center);stream.activate(center);
 let x=0,z=0;const speed=DETAIL_TILE_Z/60;let crossings=0,checks=0,missing=0,outerShown=0;
 for(let frame=0;frame<1200;frame++){
  z-=speed;x-=speed*.3;
  look(stream,x,z);stream.tick();
  stream.prefetch(x,z);
  const dc=x>DETAIL_TILE_X/2?1:x<-DETAIL_TILE_X/2?-1:0,dr=z>DETAIL_TILE_Z/2?1:z<-DETAIL_TILE_Z/2?-1:0;
  if(dc||dr){
   const next=cells.get((center.c+dc)+':'+(center.r+dr)),prepared=stream.ensure(next);
   if(prepared.ready){x-=dc*DETAIL_TILE_X;z-=dr*DETAIL_TILE_Z;stream.activate(next);center=next;crossings++;look(stream,x,z);}
   else{z+=speed;x+=speed*.3;} // like followDetail: wait at the edge
  }
  if(frame%60===59){
   const outer=[...stream.entries.values()].filter(e=>e.root.visible&&ring(e,center)>=2);
   checks++;missing+=outer.filter(e=>!e.shown).length;outerShown+=outer.filter(e=>e.shown).length;
  }
 }
 assert.ok(crossings>=12,'camera kept moving across tiles: '+crossings);
 assert.ok(outerShown>checks*8,'outer ring is really loaded while moving ('+outerShown+' tiles over '+checks+' checks)');
 assert.ok(missing<=checks*4,'only the newest outer tiles are still loading ('+missing+' missing over '+checks+' checks)');
 assert.ok(stream.entries.size<=49,'bounded cache: '+stream.entries.size);
}

{ // Phones and touch tablets keep their 3x3 cost, prioritised by view.
 const {stream,cells}=makeStream(false);
 camera.aspect=390/844;camera.updateProjectionMatrix(); // portrait phone
 const center=cells.get('5:5');stream.finish(center);stream.activate(center);look(stream,0,0);
 assert.equal(stream.radius,1);assert.equal(stream.desired.size,9);
 for(let i=0;i<3;i++)stream.tick();
 const loaded=[...stream.entries.values()].filter(e=>e.terrain&&e.key!=='5:5').map(e=>e.key);
 const seen=[...stream.entries.values()].filter(e=>stream.inView(e.tile.c-5,e.tile.r-5)).map(e=>e.key);
 assert.ok(seen.length<9,'some neighbours are outside the view');
 assert.ok(loaded.length&&loaded.every(k=>seen.includes(k)),'tiles the camera sees load first: '+loaded);
}
console.log('V341 camera-driven 5x5 detail streaming PASS');
