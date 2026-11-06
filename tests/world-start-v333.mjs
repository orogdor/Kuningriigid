import assert from 'node:assert/strict';
import {captureGeneratedWorldV331,persistGeneratedWorldV331,hydrateGeneratedWorldV331,restoreGeneratedWorldV331} from '../generated-world-v331.js';

const state={seed:99,type:'continents'},cols=20,rows=20;
const cells=Array.from({length:cols*rows},(_,i)=>({c:i%cols,r:Math.floor(i/cols),x:i%cols,z:Math.floor(i/cols),h:1,detail:{heights:Array(81).fill(1),resources:[[0,1,2]]}}));
captureGeneratedWorldV331({s:state,cols,rows,cells,startLocations:[]});
let saved,writeCount=0,timerFired=false;
const storage={async write(id,payload){saved={id,payload};writeCount++},async read(id){assert.equal(id,saved.id);return saved.payload}};
setTimeout(()=>{timerFired=true},0);
await Promise.all([persistGeneratedWorldV331(state,storage),persistGeneratedWorldV331(state,storage)]);
assert.equal(timerFired,true,'packing must yield to the event loop');
assert.equal(writeCount,1,'concurrent saves must share the same write');
const loaded={seed:99,type:'continents',generatedWorldV331:state.generatedWorldV331};
await hydrateGeneratedWorldV331(loaded,storage);
assert.deepEqual(restoreGeneratedWorldV331(loaded,cols,rows).cells,cells);
console.log('PASS V333 cooperative world packing and shared durable save');
