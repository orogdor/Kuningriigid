import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),js=read('hud-v303-buttons.js'),css=read('hud-v303-buttons.css');
const layout=read('hud-v302-pieces.js'),hud=read('hud-v291.js');
assert.match(html,/<title>Kuningriigid · V303<\/title>/);
assert.match(html,/KUNINGRIIGID · V303/);
assert.match(html,/hud-v303-buttons\.css\?v=303a/);
assert.match(html,/hud-v303-buttons\.js\?v=303a/);
assert.match(html,/hud-v302-pieces\.js\?v=303a/);
for(const id of ['card_cities','card_build','card_armies','card_trade','card_diplomacy','card_journal']){
 assert.match(js,new RegExp(id));
 assert.match(hud,new RegExp(id));
}
for(const name of ['card_cities','card_build','card_armies','card_trade','card_diplomacy','card_journal',
 'map_zoom_in','map_zoom_out','map_center','map_layers','action_move','action_attack','action_stop','action_focus']){
 const img=fs.readFileSync(new URL('../ui-art-v303/'+name+'.webp',import.meta.url));
 assert.equal(img.toString('ascii',0,4),'RIFF');
 assert.equal(img.toString('ascii',8,12),'WEBP');
 assert.ok(img.length>3000&&img.length<100000,name+' must be optimized');
}
const w={};new Function('window','document',js)(w,{readyState:'loading',addEventListener(){}});
const action=w.KuningriigidArtV303.artForAction;
for(const n of ['move','attack','stop','focus'])assert.match(action(n),new RegExp('action_'+n+'\\.webp'));
for(const n of ['build','city','journal','trade','world','info'])
 assert.equal(action(n),null,'Other live actions must retain their own icons');
assert.match(js,/MutationObserver/);
assert.match(js,/img\.v291-sprite/);
assert.match(css,/v302-pieces \.v291-card\.v303-ready/);
assert.match(css,/v291-unit-button:not\(\[data-v303-art\]\)/);
assert.match(css,/v303-action-art:not\(\[hidden\]\)/);
assert.match(layout,/place\(\$\('\.v292-zoom-out'\),\[125,631,62,59\]/);
assert.match(hud,/function dispatchSelection\(slot\)/);
execFileSync(process.execPath,['--check',new URL('../hud-v303-buttons.js',import.meta.url).pathname]);
console.log('V303 6 command cards, 4 map controls, 4 contextual actions: PASS');