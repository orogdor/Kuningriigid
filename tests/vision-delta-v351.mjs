// V351: the fast discovery-log path of VisionDelta must report exactly
// the same known set and changed cells as the full comparison.
import assert from 'node:assert/strict';
import {COLS,ROWS} from '../campaign.js';
import {VisionDelta,noteDiscoveredV351} from '../fog-delta-v88.js';
const state={visionRevision:0,explored:[{},{},{},{}]};
// same bookkeeping as game.reveal() in civilization-core.js
const reveal=(c,r)=>{const k=c+':'+r;if(!state.explored[0][k]){state.explored[0][k]=1;state.visionRevision++;noteDiscoveredV351(state.explored[0],k);return k;}return null;};
const delta=new VisionDelta(state);
const check=(expectedChanged,label)=>{
 const before=delta.serial;delta.update();
 assert.deepEqual(delta.changed.map(a=>a.key).sort(),[...expectedChanged].sort(),label+': changed cells');
 for(const at of delta.changed)assert.equal(at.c+':'+at.r,at.key,label+': coordinates');
 assert.deepEqual([...delta.known].sort(),Object.keys(state.explored[0]).sort(),label+': known set');
 if(expectedChanged.length)assert.equal(delta.serial,before+1,label+': serial');
};
let fresh=[];for(let c=0;c<40;c++)for(let r=0;r<30;r++)fresh.push(reveal(c,r));
check(fresh,'first full comparison');
fresh=[reveal(40,3),reveal(41,3),reveal(40,3)].filter(Boolean);check(fresh,'scout step (tail)');
assert.equal(delta.logged,Object.keys(state.explored[0]).length,'the scout step used the discovery log');
{const serial=delta.serial;delta.update();assert.equal(delta.serial,serial,'an unchanged revision does nothing');assert.equal(delta.changed.length,2,'and keeps the last result');}
fresh=[];for(let i=0;i<500;i++){const k=reveal(42+i%60,5+Math.floor(i/60));if(k)fresh.push(k);}check(fresh,'many cells (tail)');
// a loaded save replaces the explored object: full comparison, removed cells are reported too
const old=Object.keys(state.explored[0]);state.explored=[{'1:1':1,'200:100':1},{},{},{}];state.visionRevision++;
check([...old.filter(k=>k!=='1:1'),'200:100'],'replaced state');
fresh=[reveal(7,7)];check(fresh,'tail after replaced state');
// cells written without the log (old demo code bumps the revision itself) are still noticed
state.explored[0]['50:50']=1;state.visionRevision++;check(['50:50'],'cell written past the log');
state.explored[0]['51:50']=1;state.visionRevision++;fresh=[reveal(8,8),'51:50'];check(fresh,'logged and unlogged cells together');
fresh=[reveal(8,9)];check(fresh,'tail after unlogged cells');
// "show whole map" and back
globalThis.KINGDOMS_REVEAL_V248=true;state.visionRevision++;delta.update();assert.equal(delta.known.size,COLS*ROWS);
{const known=delta.known;reveal(10,10);delta.update();assert.equal(delta.known,known,'whole map shown: a scout step builds no new set');assert.equal(delta.changed.length,0);}
globalThis.KINGDOMS_REVEAL_V248=false;state.visionRevision++;delta.update();assert.deepEqual([...delta.known].sort(),Object.keys(state.explored[0]).sort());
fresh=[reveal(9,9)];check(fresh,'log after whole-map switch');
console.log('PASS V351 vision delta discovery log path equals the full comparison');
