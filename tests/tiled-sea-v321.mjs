import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {detailSeaStepsV242} from '../sea-v158.js';
import {DETAIL_HALF_X,DETAIL_HALF_Z,DETAIL_X,DETAIL_Z} from '../detail-scale-v123.js';

// A neighbour must generate its own sea square, not a huge centre 5x5 sheet.
// The same tile-local depth samples remain valid after the streaming root moves.
const origin={x:125,z:-75};
const steps=detailSeaStepsV242((x,z)=>-1.2+Math.sin(x/50)*.05,
 {halfX:DETAIL_HALF_X,halfZ:DETAIL_HALF_Z,seg:40,origin});
let result=steps.next();while(!result.done)result=steps.next();
const sea=result.value;
assert.ok(sea,'submerged tile produces a sea mesh');
assert.equal(sea.geometry.parameters.width,DETAIL_HALF_X*2);
assert.equal(sea.geometry.parameters.height,DETAIL_HALF_Z*2);
assert.ok(sea.geometry.attributes.aDepth.array.every(Number.isFinite));
const d=sea.geometry.attributes.aDepth.array;
assert.ok(Math.max(...d)-Math.min(...d)<1,'local sea depth has no cross-tile discontinuity');
assert.equal(sea.position.y,.006);
assert.equal(sea.material.transparent,true);
const code=readFileSync(new URL('../sea-v158.js',import.meta.url),'utf8');
assert.ok(code.includes('vSeaP=position.xz/vec2('),'WebGL uses tile local water coordinates');
assert.ok(code.includes('positionLocal.xz.div(vec2(scale,scaleZ))'),'WebGPU uses tile local water coordinates');
sea.geometry.dispose();sea.material.dispose();
console.log('V321 tiled sea extent and shader coordinates PASS');
