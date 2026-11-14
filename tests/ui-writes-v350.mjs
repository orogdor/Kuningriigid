// V350: the HUD writes to the DOM only when a value changes.
// Run: node tests/ui-writes-v350.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');

// --- helper: a minimal element that counts writes -------------------------------------------
class El{
 constructor(){this._text='';this._attrs=new Map();this.writes=0;this.dataset=new Proxy({},{set:(t,k,v)=>{t[k]=String(v);this.writes++;return true;}});this._hidden=false;}
 get textContent(){return this._text}set textContent(v){this._text=String(v);this.writes++}
 getAttribute(k){return this._attrs.has(k)?this._attrs.get(k):null}
 setAttribute(k,v){this._attrs.set(k,String(v));this.writes++}
 get hidden(){return this._hidden}set hidden(v){this._hidden=!!v;this.writes++}
}
const sandbox={window:{}};vm.runInNewContext(read('ui-write-v350.js'),sandbox);
const W=sandbox.window.KuningriigidUiWriteV350;
assert.ok(W&&W.text&&W.attr&&W.prop&&W.data,'helper is published');

{ // text: repeated value is written once
 const e=new El();assert.equal(W.text(e,'Turn 3'),true);
 for(let i=0;i<50;i++)assert.equal(W.text(e,'Turn 3'),false);
 assert.equal(e.writes,1);assert.equal(W.text(e,'Turn 4'),true);assert.equal(e.textContent,'Turn 4');assert.equal(e.writes,2);
}
{ // text already correct before the first call: no write
 const e=new El();e._text='World map';assert.equal(W.text(e,'World map'),false);assert.equal(e.writes,0);
}
{ // the translator rewrites the text afterwards: no ping-pong
 const e=new El();W.text(e,'Käik 3');e._text='Turn 3';
 for(let i=0;i<20;i++)assert.equal(W.text(e,'Käik 3'),false);
 assert.equal(e.writes,1);assert.equal(e.textContent,'Turn 3');
 // a third party changes it later: the helper restores the requested value
 e._text='stale';assert.equal(W.text(e,'Käik 3'),true);assert.equal(e.textContent,'Käik 3');
}
{ // attributes behave the same way, per attribute name
 const e=new El();assert.equal(W.attr(e,'aria-label','Puit: 5'),true);e._attrs.set('aria-label','Wood: 5');
 for(let i=0;i<20;i++)assert.equal(W.attr(e,'aria-label','Puit: 5'),false);
 assert.equal(W.attr(e,'title','x'),true);assert.equal(W.attr(e,'title','x'),false);
 assert.equal(e.writes,2);assert.equal(W.attr(e,'aria-label','Puit: 6'),true);
 assert.equal(W.attr(e,'aria-label','Puit: 6'),false); // settles on the value the translator left
 e._attrs.set('aria-label','else');assert.equal(W.attr(e,'aria-label','Puit: 6'),true,'outside change is repaired');
}
{ // properties and data attributes
 const e=new El();assert.equal(W.prop(e,'hidden',false),false);assert.equal(W.prop(e,'hidden',true),true);assert.equal(W.prop(e,'hidden',true),false);
 assert.equal(W.data(e,'tech','farming'),true);assert.equal(W.data(e,'tech','farming'),false);assert.equal(e.dataset.tech,'farming');
 assert.equal(W.text(null,'x'),false);assert.equal(W.attr(null,'a','x'),false);assert.equal(W.prop(null,'a',1),false);
}

// --- source contracts ------------------------------------------------------------------------
const civ=read('civilization.js');
assert.ok(!civ.includes("$('clock').value=s.time%TURN_SECONDS;if(!menuOpen"),'frame() no longer writes the turn clock on every frame');
assert.ok(civ.includes('turnClockShownV350!==turnClockV350'),'turn clock is written on change');
assert.ok(civ.includes("if(!v235Clock.dataset.v350Title)"),'day clock title is written once');
assert.ok(!civ.includes("$('buildhint').hidden=true;return}"),'build hint is hidden only when shown');
const v304=read('ui-v304.js'),update=v304.slice(v304.indexOf(' function update(){'),v304.indexOf(' function menuArt(){'));
assert.ok(update.length>500);
for(const bad of ['.textContent=','.setAttribute(','.title=','.dataset.tech=','.hidden=','.disabled='])
 assert.ok(!update.includes(bad),'V304 update() has no unconditional write: '+bad);
const v306=read('ui-v306.js'),sync=v306.slice(v306.indexOf('  function sync(){'),v306.indexOf('  // V304 reads the art hooks'));
assert.ok(sync.length>300);
for(const bad of ['.textContent=','.setAttribute(','.title=','root.dataset.','pause.dataset.'])assert.ok(!sync.includes(bad),'V306 sync() has no unconditional write: '+bad);
const artSrc=read('ui-art-v263.js');
assert.ok(artSrc.includes('changes.some(relevantV350)'),'art observer filters HUD refresh mutations');
assert.equal((artSrc.match(/getComputedStyle/g)||[]).length,1);assert.ok(artSrc.includes('v350Position'),'forced style read happens once');
const index=read('index.html');
assert.ok(index.indexOf('ui-write-v350.js')>0&&index.indexOf('ui-write-v350.js')<index.indexOf('ui-v304.js'),'helper loads before the HUD');
for(const key of ['<title>Kuningriigid · V350</title>','boot-v83.js?v=350a','ui-v304.js?v=350a','ui-v306.js?v=350a','ui-art-v263.js?v=350a','"./localization.js?v=155a": "./localization.js?v=350a"'])assert.ok(index.includes(key),key);

// --- translation cache gives the same answers as the uncached path -----------------------------
const loc=await import('../localization.js');
const samples=['Avastajat ei ole. Värba või loo avastaja.','  Ressursid ruudul ','Avastaja · ruut 3:4 · ootab käsku','Käik 36 · Uuritud: Põllundus','plain 123',''];
const first=samples.map(loc.translateEstonian);
assert.equal(first[0],'No scout. Recruit or create a scout.');assert.equal(first[1],'  Resources on This Tile ');assert.equal(first[4],'plain 123');
assert.deepEqual(samples.map(loc.translateEstonian),first,'repeat calls are identical');
for(let i=0;i<4200;i++)loc.translateEstonian('Avastaja · ruut '+i+':1 · ootab käsku'); // overflow and reset
assert.deepEqual(samples.map(loc.translateEstonian),first,'identical after the cache was emptied');
assert.equal(loc.translateEstonian('Avastaja · ruut 7:1 · ootab käsku'),loc.translateEstonian('Avastaja · ruut 7:1 · ootab käsku'));
console.log('V350 UI write tests passed');
