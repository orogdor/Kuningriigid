// V292 mobile picture-HUD regression: real artwork and controls preserved.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),css=read('hud-v292-mobile.css'),js=read('hud-v292-mobile.js');
const original=read('hud-v291.js');
assert.match(html,/<title>Kuningriigid · V292<\/title>/);
assert.match(html,/id="menu-version">KUNINGRIIGID · V292</);
for(const asset of ['hud-v292-mobile.css?v=292a','hud-v292-mobile.js?v=292a'])assert.ok(html.includes(asset),'Missing '+asset);
assert.ok(html.indexOf('hud-v291.css')<html.indexOf('hud-v292-mobile.css'));
assert.ok(html.indexOf('hud-v291.js')<html.indexOf('hud-v292-mobile.js'));
assert.match(original,/get\('ui'\)==='art'/);
assert.match(css,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
assert.match(css,/orientation:landscape/);
assert.match(css,/orientation:portrait/);
assert.match(css,/--mobile-dock:clamp\(70px,20vh,91px\)/);
assert.match(css,/--mobile-dock:clamp\(124px,19vh,153px\)/);
assert.match(css,/\.v291-pause:disabled/);
assert.match(css,/\.v291-play:not\(:disabled\)/);
assert.match(css,/ui-art-v291\/footer_navy\.webp/);
assert.match(css,/\.v291-mobile-counter/);
assert.match(css,/\.v291-minimap-frame/);
assert.match(css,/\.v291-selection-frame/);
assert.match(js,/ui-art-v290\/map_zoom_out\.webp/);
assert.match(js,/\$\('zout'\)/);
assert.match(js,/\$\('techtoggle'\)/);
assert.match(js,/\$\('hud-city'\)/);
assert.match(js,/orientationchange/);
for(const cmd of ['hud-city','hud-build','hud-army','hud-trade-v276','journal','pause','maptoggle','commandattack']){
 assert.ok(original.includes("'"+cmd+"'"),'Lost original command '+cmd);
}
assert.doesNotMatch(js,/endTurn\(/);
for(const file of ['ui-art-v291/card_cities.webp','ui-art-v291/card_build.webp','ui-art-v291/card_armies.webp','ui-art-v291/card_trade.webp','ui-art-v291/card_diplomacy.webp','ui-art-v291/card_journal.webp','ui-art-v290/map_zoom_out.webp']){
 const b=fs.readFileSync(new URL('../'+file,import.meta.url));
 assert.equal(b.toString('ascii',8,12),'WEBP',file);
}
console.log('V292 mobile: original cards, responsive sizes, pause/resume, live minimap, touch actions PASS');