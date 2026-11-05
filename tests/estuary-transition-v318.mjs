import assert from 'node:assert/strict';
import {estuaryOpacityV318,estuaryMouthsV318} from '../estuary-transition-v318.js';

const start={x:0,z:0,width:8},end={x:50,z:0,width:16};
const mouths=estuaryMouthsV318([{c:{},to:{land:false},points:[start,end]}]);
assert.equal(mouths.length,1);
const sample=x=>estuaryOpacityV318(x,0,mouths);
assert.equal(sample(0),1,'upstream reach stays opaque');
assert.equal(sample(-20),1,'no fade upstream');
assert.ok(sample(25)>0&&sample(25)<1,'mouth transition is gradual');
assert.ok(sample(42)<sample(25),'opacity decreases toward sea');
assert.equal(sample(50),0,'river invisible at final endpoint');
assert.equal(sample(65),0,'no rectangular tinted tongue beyond outlet');
assert.equal(estuaryOpacityV318(40,100,mouths),1,'unrelated rivers are untouched');
for(let x=0;x<=60;x+=.5){
 const alpha=sample(x);
 assert.ok(Number.isFinite(alpha)&&alpha>=0&&alpha<=1);
 if(x>0)assert.ok(alpha<=sample(x-.5)+1e-9,'fade must be monotone');
}
assert.equal(estuaryMouthsV318([{to:{land:true},points:[start,end]}]).length,0);
console.log('V318 dedicated estuary transition PASS');
