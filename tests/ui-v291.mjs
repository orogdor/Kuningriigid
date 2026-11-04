// Kuningriigid V291 – image-only HUD regression. No browser dependency.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const html=read('index.html'),js=read('hud-v291.js'),css=read('hud-v291.css');
const publishedVersion=Number((html.match(/<title>Kuningriigid · V([0-9]+)<\/title>/)||[])[1]);
assert.ok(publishedVersion>=292,'Published version is older than this UI test');
assert.ok(html.includes('id="menu-version">KUNINGRIIGID · V'+publishedVersion+'<'),'Menu label differs from page title');
assert.ok(html.includes('hud-v291.css?v=298a'),'Missing updated V291 artwork CSS');
assert.match(html,/hud-v291\.js\?v=(?:291a|296a|297a|298a|299a)/,'Missing current illustrated HUD');
assert.ok(html.indexOf('hud-v290.css')<html.indexOf('hud-v291.css'));
assert.ok(html.indexOf('hud-v290.js')<html.indexOf('hud-v291.js'));
assert.match(js,/get\('ui'\)==='art'/);
assert.match(js,/function updateScales/);
assert.match(js,/function activate/);
assert.match(js,/function renderDiplomacy/);
assert.match(js,/kingdomsUiV288\?\.diplomacy/);
assert.match(js,/new MutationObserver\(activate\)/);
assert.match(js,/oldMapHome\.parentNode\.insertBefore\(liveMap,oldMapHome\)/);
assert.match(js,/root\.querySelector\('\.v291-real-map'\)\.append\(canvas\)/);
for(const cmd of ['hud-city','hud-build','hud-army','hud-trade-v276','journal','techtoggle','maptoggle','zin','commandmove','commandattack','commandstop','pause']){
 assert.ok(js.includes("'"+cmd+"'"),'Missing original game action '+cmd);
}
assert.doesNotMatch(js,/endTurn\s*\(/);
assert.match(css,/body\.v291-active\.atlas #v290-hud/);
assert.match(css,/v291-real-map #atlasminimap/);
assert.match(css,/\.v291-mobile-counters/);
assert.match(read('hud-v298-layout.js'),/grid-template-columns/);
for(const id of ['header_gold','header_food','header_stone','header_population','header_science','header_world','header_date','research_panel','minimap_frame','selection_frame','card_cities','card_build','card_armies','card_trade','card_diplomacy','card_journal','cmd_attack','cmd_move','cmd_defend','cmd_city','map_zoom_in','map_camera','map_show','footer_wood','footer_navy','portrait_castle']){
 const data=fs.readFileSync(new URL('../ui-art-v291/'+id+'.webp',import.meta.url));
 assert.equal(data.toString('ascii',0,4),'RIFF',id);
 assert.equal(data.toString('ascii',8,12),'WEBP',id);
}
const art=fs.readdirSync(new URL('../ui-art-v291/',import.meta.url)).filter(s=>s.endsWith('.webp'));
assert.ok(art.length>=38,'Expected 38 individually exported reference images, got '+art.length);
console.log('V291: artwork ('+art.length+'), real controls, responsive layout, rollback and version PASS');