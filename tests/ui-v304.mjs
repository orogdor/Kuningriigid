import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TECHS,newResearch,queueResearch,techBlock} from '../research.js';
import {techArtSrc} from '../research-art-v293.js';
import {PAINTED_TECH_IDS} from '../research-art-v304.js';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const all=Object.keys(TECHS),images=new Set();
assert.deepEqual(new Set(all),PAINTED_TECH_IDS,'Every shipped technology needs a painting');
let total=0;
for(const id of all){
 const src=techArtSrc(id,TECHS[id]),b=fs.readFileSync(new URL(src,root));
 assert.equal(b.toString('ascii',0,4),'RIFF',id);assert.equal(b.toString('ascii',8,12),'WEBP',id);
 assert.ok(b.length>3000&&b.length<100000,id+' should be an optimized illustration');
 images.add(src);total+=b.length;
}
assert.equal(images.size,all.length);assert.ok(total<5e6,'Research illustrations should stay below 5 MB');
assert.ok(techArtSrc('future_unknown_tech',{}).startsWith('data:image/svg+xml'),'Unknown imported technology still has a fallback');
// Execute the actual context-sensitive V304 dispatcher with real V300 actions.
const catalogue={};new Function('window',read('selection-context-v300.js'))(catalogue);
const source=read('ui-v304.js'),dispatchCode=source.match(/function dispatch\(index\)\{[\s\S]*?\n \}/)?.[0];
assert.ok(dispatchCode);
let state={view:'world',selection:{kind:'worker',own:true,movable:true}},calls=[],opened=0,settling=false;
const window={KuningriigidSelectionV300:catalogue.KuningriigidSelectionV300};
const dispatch=new Function('window','snapshot','original','research','openDiplomacy','$',dispatchCode+';return dispatch;')(
 window,()=>state,(...ids)=>calls.push(ids),()=>opened++,()=>opened++,()=>({hidden:!settling}));
dispatch(0);assert.deepEqual(calls.at(-1),['commandmove']);
dispatch(1);assert.deepEqual(calls.at(-1),['hud-build'],'World settler opens detail construction, not hidden settlement');
settling=true;dispatch(1);assert.deepEqual(calls.at(-1),['foundcity','hud-build']);
state.selection={kind:'unit',own:false,movable:false};const before=calls.length;dispatch(0);dispatch(2);assert.equal(calls.length,before,'Enemy units cannot be ordered');
state.selection={kind:'none'};dispatch(1);dispatch(3);assert.equal(opened,2);
state.selection={kind:'unit',own:true,movable:true,attackable:false,scout:true};dispatch(1);assert.deepEqual(calls.at(-1),['commandexplore']);
// Artwork does not alter research dependency or queue capacity rules.
const r=newResearch();r.known=all.filter(id=>id!=='agriculture');r.active='agriculture';
assert.equal(techBlock(r,'agriculture'),'');assert.ok(queueResearch({research:[r]},0,'hunting').error);
console.log(`V304: ${images.size} generated paintings (${(total/1e6).toFixed(2)} MB), context dispatch, enemy guards, live research rules PASS`);
