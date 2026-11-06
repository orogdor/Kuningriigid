import assert from 'node:assert/strict';
import {SnapshotEncoder} from '../snapshot-v131.js';

const state={cities:[],seed:42,units:[{id:1}]};
let starts=0;
const encoder=new SnapshotEncoder(()=>{
 starts++;
 return {postMessage({id,snapshot}){queueMicrotask(()=>this.onmessage({data:{id,json:JSON.stringify(snapshot)}}))},terminate(){}};
});
assert.equal(starts,0,'worker must not start when the game opens');
assert.deepEqual(JSON.parse(await encoder.encode(state)),state);
assert.deepEqual(JSON.parse(await encoder.encode(state)),state);
assert.equal(starts,1,'worker must be reused for later saves');

let failedStarts=0;
const fallback=new SnapshotEncoder(()=>{failedStarts++;throw Error('worker unavailable')});
assert.deepEqual(JSON.parse(await fallback.encode(state)),state);
assert.deepEqual(JSON.parse(await fallback.encode(state)),state);
assert.equal(failedStarts,1,'unavailable workers should use the fallback for subsequent saves');

let brokenWorker;
const interrupted=new SnapshotEncoder(()=>brokenWorker={postMessage(){queueMicrotask(()=>this.onerror())},terminate(){this.terminated=true}});
assert.deepEqual(JSON.parse(await interrupted.encode(state)),state);
assert.equal(brokenWorker.terminated,true,'a failed worker must be terminated');
console.log('PASS V332 lazy save worker, reuse and failure fallback');
