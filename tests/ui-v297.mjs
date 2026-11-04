/* V297: no opaque crop rectangles, no duplicate control pictures, real hitboxes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),v291=read('hud-v291.js'),js=read('hud-v297-refinement.js'),css=read('hud-v297-refinement.css');
assert.match(html,/<title>Kuningriigid · V297<\/title>/);
assert.match(html,/id="menu-version">KUNINGRIIGID · V297</);
assert.match(html,/hud-v291\.js\?v=297a/);
assert.match(html,/hud-v297-refinement\.css\?v=297a/);
assert.match(html,/hud-v297-refinement\.js\?v=297a/);
assert.ok(html.indexOf('hud-v292-mobile.css')<html.indexOf('hud-v297-refinement.css'));
assert.ok(html.indexOf('hud-v293-research.js')<html.indexOf('hud-v297-refinement.js'));
const images=['research_panel','selection_frame','minimap_frame','portrait_castle','footer_trim'];
for(const id of images){
 const svg=read('ui-art-v297/'+id+'.svg');
 assert.match(svg,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
 const base64=svg.match(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/)?.[1];
 assert.ok(base64,'Missing embedded painted image for '+id);
 const webp=Buffer.from(base64,'base64');
 assert.equal(webp.toString('ascii',0,4),'RIFF',id);
 assert.equal(webp.toString('ascii',8,12),'WEBP',id);
}
for(const key of ['research_panel','selection_frame','minimap_frame','portrait_castle'])assert.ok(v291.includes("'"+key+"'"),'Painted picture source no longer mapped: '+key);
assert.match(v291,/cleaned\.has\(name\)\?'ui-art-v297\/'/);
assert.match(css,/\.v291-minimap-button >img/);
assert.match(css,/\.v291-unit-button >img/);
assert.match(css,/visibility:hidden!important/);
assert.match(css,/ui-art-v297\/footer_trim\.svg/);
assert.match(css,/--mobile-dock:clamp\(64px,16\.5vh,83px\)/);
assert.match(css,/@media \(max-width:950px\) and \(orientation:portrait\)/);
for(const id of ['research_compass','research_tools','research_gate','research_ship','research_city','map_zoom_in','map_camera','map_show','cmd_attack','cmd_move','cmd_defend','cmd_city'])assert.ok(js.includes(id),'No real hotspot: '+id);
assert.match(js,/new MutationObserver\(schedule\)/);
assert.match(js,/setProperty\(k,v,'important'\)/);
// Run the exact implementation of frame-relative positioning with mocked DOM rect.
const src=js.match(/function position\(button,frame,w,h,rect\)\{[\s\S]*?\n \}/)?.[0];
assert.ok(src,'Hitbox positioning function missing');
const position=new Function(src+';return position;')();
const values={};
const button={style:{setProperty(k,v,priority){assert.equal(priority,'important');values[k]=v;}}};
const frame={getClientRects(){return [{}]},getBoundingClientRect(){return {left:9,top:400,width:160,height:122}}};
position(button,frame,311,238,[211,39,61,62]);
assert.ok(Math.abs(parseFloat(values.left)-(9+211*160/311))<.001);
assert.ok(Math.abs(parseFloat(values.top)-(400+39*122/238))<.001);
assert.ok(parseFloat(values.width)>30 && parseFloat(values.height)>30);
console.log('V297: five real illustration sources, no duplicate buttons, aligned mobile hitboxes and responsive rules PASS');
