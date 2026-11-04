// V292 mobile picture-HUD regression: real artwork and controls preserved.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),css=read('hud-v298-layout.css'),layout=read('hud-v298-layout.js'),js=read('hud-v292-mobile.js');
const original=read('hud-v291.js');
const publishedVersion=Number((html.match(/<title>Kuningriigid · V([0-9]+)<\/title>/)||[])[1]);
assert.ok(publishedVersion>=292,'Published version is older than this UI test');
assert.ok(html.includes('id="menu-version">KUNINGRIIGID · V'+publishedVersion+'<'),'Menu label differs from page title');
assert.ok(html.includes('hud-v298-layout.css?v=299a'),'Missing active responsive artwork CSS');
assert.ok(!html.includes('hud-v292-mobile.css'),'Old V292 mobile layout must be retired');
assert.match(html,/hud-v292-mobile\.js\?v=(?:292a|296a)/,'Missing V292/V296 mobile controls');
assert.ok(html.indexOf('hud-v291.css')<html.indexOf('hud-v298-layout.css'));
assert.ok(html.indexOf('hud-v291.js')<html.indexOf('hud-v292-mobile.js'));
assert.match(original,/get\('ui'\)==='art'/);
assert.match(layout,/groupW=6\*cardW\+5\*gap/);
assert.match(layout,/repeat\(3,minmax\(0,1fr\)\)/);
assert.match(layout,/v298-landscape/);
assert.match(layout,/v298-portrait/);
assert.match(layout,/cardH=Math.max\(36/);
assert.match(layout,/rowH=Math.min\(98/);
assert.match(css,/\.v291-pause:disabled/);
assert.match(layout,/paused\?'block':'none'/);
assert.match(css,/ui-art-v297\/footer_trim\.svg/);
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