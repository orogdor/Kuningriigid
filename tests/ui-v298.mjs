import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=read('hud-v298-layout.js'),css=read('hud-v298-layout.css'),html=read('index.html'),base=read('hud-v291.css');
assert.match(html,/<title>Kuningriigid · V299<\/title>/);
assert.match(html,/id="menu-version">KUNINGRIIGID · V299</);
assert.ok(html.indexOf('hud-v291.css')<html.indexOf('hud-v298-layout.css'));
assert.ok(!html.includes('hud-v292-mobile.css'),'Conflicting V292 layout is still loaded');
assert.ok(!html.includes('hud-v297-refinement.css'),'Conflicting V297 layout is still loaded');
assert.ok(!html.includes('hud-v297-refinement.js'),'Conflicting V297 hotspot engine is still loaded');
assert.ok(!base.includes('/* Narrow screens use genuine picture sprites'),'Legacy mobile media rules still loaded');
assert.match(css,/\.v291-card>img/);
assert.match(css,/\.v291-dock-background>img\{display:none!important\}/);
assert.match(js,/visualViewport\?\.addEventListener\('resize'/);
function inspect(w,h,side){
 function classes(initial=[]){const a=new Set(initial);return {add(...v){v.forEach(x=>a.add(x))},remove(...v){v.forEach(x=>a.delete(x))},toggle(x,v){v?a.add(x):a.delete(x)},contains:x=>a.has(x)}}
 function node(id){const v={};return {id,values:v,classList:classes(),style:{setProperty(k,x,p){assert.equal(p,'important');v[k]=x},removeProperty(k){delete v[k]}},getBoundingClientRect(){return {left:parseFloat(v.left)||0,top:parseFloat(v.top)||0,width:parseFloat(v.width)||0,height:parseFloat(v.height)||0}}}}
 const els=new Map(),n=key=>{if(!els.has(key))els.set(key,node(key));return els.get(key);};
 const root=n('v291-hud');
 if(side)root.classList.add('v291-show-'+side);
 const cards=Array.from({length:6},(_,i)=>n('card'+i));
 const ledgers=Array.from({length:5},(_,i)=>n('ledger'+i));
 const names=['research_compass','research_tools','research_gate','research_ship','research_city'];
 const mapnames=['map_zoom_in','map_camera','map_show'],unitnames=['cmd_attack','cmd_move','cmd_defend','cmd_city'];
 const findNames=names.map(x=>n('[data-art="'+x+'"]'));
 root.querySelector=sel=>n(sel);
 root.querySelectorAll=sel=>sel==='.v291-card'?cards:sel==='.v291-ledger'?ledgers:sel==='.v291-research-queue'?findNames:sel==='.v291-minimap-button'?mapnames.map(x=>n('[data-art="'+x+'"]')):sel==='.v291-unit-button'?unitnames.map(x=>n('[data-art="'+x+'"]')):[];
 const document={readyState:'complete',body:{classList:classes(['v291-active'])},getElementById:id=>n(id)};
 const window={innerWidth:w,innerHeight:h,matchMedia:()=>({matches:w<1100}),kingdomsUiV288:{snapshot:()=>({paused:false})},visualViewport:{addEventListener(){}},dispatchEvent(){}};
 new Function('document','window','addEventListener','requestAnimationFrame','MutationObserver','getComputedStyle','setInterval','Event',
 js)(document,window,()=>{},fn=>{fn();return 1},class{observe(){}},el=>({display:el.values.display||'block'}),()=>{},class{});
 const b=sel=>{const v=n(sel).values;return {x:parseFloat(v.left)||0,y:parseFloat(v.top)||0,w:parseFloat(v.width)||0,h:parseFloat(v.height)||0,display:v.display||'block'}};
 return {root,cards,dock:b('.v291-command-dock'),research:b('.v291-research-background'),map:b('.v291-minimap-frame'),unit:b('.v291-selection-frame'),main:b('.v291-research-main'),mapTouch:b('[data-art="map_zoom_in"]'),unitTouch:b('[data-art="cmd_move"]'),toolbar:b('.v291-mobile-toolbar')};
}
for(const [w,h] of [[1368,537],[844,390],[390,844],[600,300],[768,1024]]){
 const r=inspect(w,h);
 assert.ok(r.root.classList.contains('v298-managed'),'No responsive layout at '+w+'x'+h);
 assert.ok(r.dock.x>=0&&r.dock.x+r.dock.w<=w+1);
 assert.ok(r.dock.y>=0&&r.dock.y+r.dock.h<=h+1);
 assert.ok(r.research.x>=0&&r.research.y>=0);
 if(w>h&&w>=710){
  assert.equal(r.map.display,'block');assert.equal(r.unit.display,'block');
  assert.ok(r.map.x+r.map.w<r.dock.x,'Minimap overlaps cards');
  assert.ok(r.unit.x>r.dock.x+r.dock.w,'Selected unit overlaps cards');
  assert.ok(r.mapTouch.w>=28,'Minimap button too small for touch');
  assert.ok(r.unitTouch.w>=28,'Unit button too small for touch');
 }
 if(w<h){assert.equal(r.map.display,'none');assert.equal(r.unit.display,'none');assert.equal(r.dock.display,'grid');}
 if(w<710&&h<w){assert.equal(r.map.display,'none');assert.equal(r.unit.display,'none');assert.equal(r.toolbar.display,'flex');}
}
for(const side of ['map','research','units']){
 const r=inspect(390,844,side);
 if(side==='map')assert.equal(r.map.display,'block');
 if(side==='research')assert.equal(r.research.display,'block');
 if(side==='units')assert.equal(r.unit.display,'block');
}
console.log('V298 unified picture-HUD geometry and painted hotspots PASS: 5 screens + 3 portrait drawers');
