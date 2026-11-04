// V289: independent picture-based responsive HUD regression.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const html=read('index.html'),js=read('hud-v289.js'),css=read('hud-v289.css');
const game=read('civilization.js');
for(const file of ['hud-v289.css?v=289a','hud-v289.js?v=289b']){
 assert.ok(html.includes(file),'Missing final UI asset: '+file);
}
assert.ok(html.indexOf('ui-reference-v288.css')<html.indexOf('hud-v289.css'),'New CSS must be loaded last');
assert.ok(html.indexOf('ui-reference-v288.js')<html.indexOf('hud-v289.js'),'New JS must be loaded last');
assert.match(js,/v289-original-minimap/); // Game's live canvas must move, not copy.
assert.match(js,/parentNode\.insertBefore\(home,canvas\)/);
assert.match(js,/root\.querySelector\('\.v289-mini-host'\)\.append\(canvas\)/);
assert.match(js,/home\.parentNode\.insertBefore\(mini,home\)/);
assert.match(js,/function activate\(\)/);
assert.match(js,/classList\.contains\('atlas'\)/);
assert.match(js,/classList\.contains\('ui-paint-v287'\)/);
assert.match(css,/body\.v289-active\.atlas > header/);
for(const id of ['#tools','#v51insights','#atlasoverview','#commandhud','#v288-research','#v288-rivals','#v288-map-tools']){
 assert.ok(css.includes(id),'Legacy panel not hidden when new HUD active: '+id);
}
assert.match(css,/@media\(max-width:1430px\)/);
assert.match(css,/@media\(max-width:1100px\)/);
assert.match(css,/@media\(max-width:900px\)/);
assert.match(css,/@media\(max-width:520px\)/);
assert.match(css,/@media\(max-height:540px\) and \(orientation:landscape\)/);
assert.match(js,/function renderStats/);
assert.match(js,/function renderGoals/);
assert.match(js,/function renderFactions/);
assert.match(js,/function renderSelected/);
assert.match(js,/function renderDiplomacy/);
assert.match(js,/api\(\)\?\.diplomacy\?\./);
assert.match(game,/window\.kingdomsUiV288=/);
assert.match(js,/legacy\('pause'\)/);
assert.doesNotMatch(js,/endTurn\(|location\.reload\(/);
assert.ok(css.includes('#v289-hud'),'No independent root');
const images=[...css.matchAll(/url\(['"]?(ui-art-v(?:263|288)\/[^'")\s]+)['"]?\)/g)].map(m=>m[1]);
for(const asset of images){
 assert.ok(fs.existsSync(path.join(new URL('.',root).pathname,asset)),'Missing art '+asset);
}
assert.match(html,/<title>Kuningriigid · V292<\/title>/);
assert.match(html,/id="menu-version">KUNINGRIIGID · V292</);
assert.match(js,/<small>UI V289 · SEVEN ERAS<\/small>/);
assert.doesNotMatch(html,/id="menu-version">KUNINGRIIGID · V286</);
console.log('V289 independent responsive HUD references, real actions and image assets: OK');
