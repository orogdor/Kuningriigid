/* V300: selection-specific picture HUD / behavior regression.
 * Executes the actual category selector and click dispatcher. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),hud=read('hud-v291.js'),core=read('civilization.js'),boot=read('boot-v83.js');
const catalogue=read('selection-context-v300.js'),css=read('hud-v298-layout.css');
const window={};new Function('window',catalogue)(window);
const get=window.KuningriigidSelectionV300.actions;
assert.match(html,/<title>Kuningriigid · V30[1234]<\/title>/);
assert.match(html,/id="menu-version">KUNINGRIIGID · V30[1234]</);
assert.ok(html.indexOf('selection-context-v300.js')<html.indexOf('hud-v291.js?v=300a'),'Selector must load before HUD');
assert.ok(html.includes('hud-v298-layout.css?v=300a'));
assert.ok(/boot-v83\.js\?v=(?:300a|304a)/.test(html));
assert.match(boot,/civilization\.js\?v=(?:300a|304a)/);
assert.match(core,/const q=currentSelection\(\);[\s\S]{0,1100}const selection=\{/);
assert.match(core,/selection,\s*\n\s*turn:/);
assert.match(hud,/selectionActions\(\)\[slot\]/);
assert.match(hud,/showSelectionActions\(s\)/);
assert.match(hud,/selection_frame'\?'ui-art-v300\/selection_frame\.svg'/);
assert.match(css,/ui-art-v300|\.v291-unit-button > img/);
assert.match(css,/\.v291-selection-frame>.v291-sprite\{pointer-events:none!important\}/);
assert.match(css,/\.v291-portrait-image/);
const SVG='ui-art-v300/';
for(const name of ['world','science','journal','diplomacy','city','build','recruit','trade','move','attack','stop','focus','resources','explore','info','workers','guard']){
 const src=read(SVG+'action_'+name+'.svg');
 assert.match(src,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/,name+' invalid SVG');
 assert.match(src,/id="disk"/,name+' missing painted dark background');
 assert.match(src,/<\/svg>$/,name+' unclosed SVG');
}
const frame=read(SVG+'selection_frame.svg');
assert.match(frame,/<mask id="openportrait">/,'Portrait aperture must stay transparent');
assert.match(frame,/<\/svg>$/);
const none=get({kind:'none'},'world'),city=get({kind:'city',own:true},'local');
const worker=get({kind:'worker',own:true,movable:true},'world');
const unit=get({kind:'unit',own:true,movable:true,attackable:true},'local');
const civilianArmy=get({kind:'unit',own:true,movable:true,attackable:false,scout:false},'world');
const scout=get({kind:'unit',own:true,movable:true,attackable:false,scout:true},'world');
const enemy=get({kind:'unit',own:false,movable:false,attackable:false},'local');
const building=get({kind:'building',own:true},'local');
const trade=get({kind:'trade',own:true},'world');
for(const actions of [none,city,worker,unit,civilianArmy,scout,enemy,building,trade]){
 assert.equal(actions.length,4,'Four commands around one portrait');
 for(const a of actions){
  assert.ok(a.icon&&a.ee&&a.en&&a.target,'Icon must have label and real callback');
  assert.ok(fs.existsSync(new URL('../ui-art-v300/action_'+a.icon+'.svg',import.meta.url)));
 }
}
assert.deepEqual(none.map(a=>a.icon),['world','science','journal','diplomacy']);
assert.deepEqual(city.map(a=>a.icon),['city','build','recruit','trade']);
assert.deepEqual(worker.map(a=>a.icon),['move','build','resources','stop']);
assert.deepEqual(unit.map(a=>a.icon),['move','attack','stop','focus']);
assert.deepEqual(scout.map(a=>a.icon),['move','explore','stop','focus']);
assert.notEqual(civilianArmy[1].icon,'attack','No battle, no false attack');
assert.equal(enemy[0].disabled,true);
assert.equal(enemy[2].disabled,true);
assert.equal(get({kind:'worker',own:true,movable:false},'world')[0].disabled,true);
assert.deepEqual(building.map(a=>a.icon),['info','build','workers','focus']);
assert.deepEqual(trade.map(a=>a.icon),['trade','world','journal','focus']);
// Evaluate HUD dispatcher, not just static text. Target is re-evaluated each click.
const match=hud.match(/function dispatchSelection\(slot\)\{[\s\S]*?\n \}/)?.[0];
assert.ok(match,'Selection action handler missing');
let context={kind:'none'},research=0,diplomacy=0,log=[];
const dispatch=new Function('selectionActions','openResearch','openDiplomacy','original','$',match+';return dispatchSelection;')(
 ()=>get(context,'world'),()=>{research++;return true},()=>{diplomacy++},
 (...ids)=>{log.push(ids);return true},id=>id==='foundcity'?{hidden:true}:null
);
assert.equal(dispatch(1),true);assert.equal(research,1,'Second global icon opens actual research');
assert.equal(dispatch(3),true);assert.equal(diplomacy,1,'Fourth global icon opens diplomacy');
context={kind:'unit',movable:true,own:true,attackable:true};
assert.equal(dispatch(1),true);assert.deepEqual(log.at(-1),['commandattack']);
context={kind:'unit',movable:true,own:true,attackable:false};
assert.equal(dispatch(1),true);assert.deepEqual(log.at(-1),['hud-army'],'Peaceful army never attacks');
context={kind:'worker',movable:false,own:true};const before=log.length;
assert.equal(dispatch(0),false);assert.equal(log.length,before,'Forbidden move must not click game');
assert.equal(dispatch(1),true);assert.deepEqual(log.at(-1),['hud-build'],'Hidden settlement control not invoked');
console.log('V300 contextual picture panel: 17 individual icons, 9 selection states, dispatch actions PASS');
