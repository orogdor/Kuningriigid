import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const html=read('index.html'),css=read('ui-reference-v288.css'),js=read('ui-reference-v288.js'),core=read('civilization.js');
const old=read('ui-painted-v287.js');
assert.ok(html.includes('ui-reference-v288.css?v=288a'));
assert.ok(html.includes('ui-reference-v288.js?v=288a'));
assert.ok(html.indexOf('ui-painted-v287.css')<html.indexOf('ui-reference-v288.css'));
assert.ok(html.indexOf('ui-painted-v287.js')<html.indexOf('ui-reference-v288.js'));
assert.ok(old.includes("saved === '1'"),'Default remains classic until explicitly chosen');
assert.ok(js.includes('document.body.classList.toggle'), 'Style must be opt-in');
for(const id of ['hud-build','hud-army','techtoggle','hud-city','atlasoverview','commandhud','pause','v51insights']){
 assert.ok(html.includes('id="'+id+'"'),'Original game control absent: '+id);
}
for(const id of ['v288-diplomacy','v288-research','v288-rivals','v288-map-tools']){
 assert.ok(js.includes(id),'New functional UI missing: '+id);
}
assert.ok(js.includes("mirror('techtoggle')"),'Research must call actual tech tree');
assert.ok(js.includes("mirror('menubtn')"),'Settings must call existing menu');
assert.ok(js.includes('data-v288-card'),'Bottom controls should map to actual buttons');
assert.ok(css.includes("html[lang^=\"et\"] body.ui-reference-v288.atlas #tools"),'Estonian screenshot illustration is not applied');
assert.ok(css.includes("ui-art-v288/toolbar.svg"),'Exact visual toolbar artwork missing');
assert.ok(core.includes('window.kingdomsUiV288={'), 'Read-only data bridge missing');
assert.ok(core.includes('researchPercent:'),'Research bar must be actual game progress');
assert.ok(core.includes("setRelation(s,0,team,status)"),'Diplomacy button must update gameplay');
assert.ok(css.includes("#pause[data-v288-paused="), 'Reference circle must indicate real pause state');
assert.ok(!js.includes('endTurn()'),'Do not invent an end turn in realtime game');
assert.ok(css.includes('@media (max-width:1100px)'), 'Touch fallback required');
assert.ok(css.includes("header #pause"),'Actual pause button must remain wired');
const assets=[...css.matchAll(/url\(['"]?((?:ui-art-v263|ui-art-v288)\/[^'")\s]+)['"]?\)/g)].map(x=>x[1]);
for(const p of assets) assert.ok(fs.existsSync(path.join(fileURLToPath(root),p)),'Missing asset: '+p);
const toolbar=read('ui-art-v288/toolbar.svg');
assert.match(toolbar,/data:image\/webp;base64,UklGR/);
assert.ok(toolbar.length>5000,'Toolbar must contain real painted card image data');
for(const file of ['card-frame.svg','diplomacy.svg','empire.svg','research.svg','trade.svg','hourglass.svg','crest.svg']){
 const content=read('ui-art-v288/'+file);
 assert.match(content,/<svg\s/);
 assert.match(content,/<\/svg>/);
}
console.log('V288 picture-backed UI: live commands, actual state, painted assets, opt-in and responsive fallbacks OK');
