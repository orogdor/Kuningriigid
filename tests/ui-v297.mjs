/* V297 images + V298 single-positioning engine.
 * Previous V297 test checked a layout JS file we deliberately retired.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),v291=read('hud-v291.js');
const js=read('hud-v298-layout.js'),css=read('hud-v298-layout.css');
const published=Number((html.match(/<title>Kuningriigid · V([0-9]+)<\/title>/)||[])[1]);
assert.ok(published>=298,'Old/overlapping HUD still published');
assert.ok(html.includes('id="menu-version">KUNINGRIIGID · V'+published+'<'));
assert.match(html,/hud-v291\.js\?v=300a/);
assert.match(html,/hud-v298-layout\.css\?v=300a/);
assert.match(html,/hud-v298-layout\.js\?v=300a/);
assert.ok(!html.includes('hud-v297-refinement.js?v=297a'),'Old V297 placement script must not run');
assert.ok(!html.includes('hud-v297-refinement.css?v=297a'),'Old V297 override stylesheet must not run');
assert.ok(!html.includes('hud-v292-mobile.css?v=292a'),'Old V292 stylesheet must not run');
const images=['research_panel','selection_frame','minimap_frame','portrait_castle','footer_trim'];
for(const id of images){
 const svg=read('ui-art-v297/'+id+'.svg');
 assert.match(svg,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
 const base64=svg.match(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/)?.[1];
 assert.ok(base64,'Missing painted image '+id);
 const webp=Buffer.from(base64,'base64');
 assert.equal(webp.toString('ascii',0,4),'RIFF',id);
 assert.equal(webp.toString('ascii',8,12),'WEBP',id);
}
assert.match(v291,/cleaned\.has\(name\)\?'ui-art-v297\/'/);
assert.match(css,/\.v291-minimap-button > img/);
assert.match(css,/\.v291-unit-button > img/);
assert.match(css,/visibility:visible!important/);
assert.match(css,/ui-art-v297\/footer_trim\.svg/);
assert.match(js,/function mobileLayout\(\)/);
assert.match(js,/function frameHit\(button,frameNode,baseW,baseH,rect\)/);
for(const id of ['research_compass','research_tools','research_gate','research_ship','research_city','map_zoom_in','map_camera','map_show','cmd_attack','cmd_move','cmd_defend','cmd_city'])assert.ok(js.includes(id),'Missing art hotspot '+id);
assert.match(js,/new MutationObserver\(schedule\)/);
assert.match(js,/style\.setProperty\(k,v,'important'\)/);
const src=js.match(/function frameHit\(button,frameNode,baseW,baseH,rect\)\{[\s\S]*?\n \}/)?.[0];
assert.ok(src,'Hitbox source not found');
let result;
const align=new Function('getComputedStyle','area',src+';return frameHit;')(
 ()=>({display:'block'}),(button,x,y,w,h)=>{result={x,y,w,h};}
);
align({}, {getBoundingClientRect(){return {left:9,top:400,width:160,height:122}}},311,238,[203,22,68,71]);
assert.ok(Math.abs(result.x-(9+203*160/311))<.001);
assert.ok(Math.abs(result.y-(400+22*122/238))<.001);
assert.ok(result.w>30&&result.h>30);
console.log('V298: V297 picture assets, zero duplicate controls and unified frame-relative hitboxes PASS');
