/* V299 pixel audit: every decorated action aligns with the ACTUAL
 * cropped artwork positions from the approved 1671x941 master image.
 * Prevent another guess-based V297 round-control regression.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),base=read('hud-v291.js');
const js=read('hud-v298-layout.js'),css=read('hud-v298-layout.css');
assert.match(html,/<title>Kuningriigid · V\d{3,}<\/title>/);
for(const name of ['hud-v291.js','hud-v298-layout.js','hud-v298-layout.css']){
 assert.ok(html.includes(name+'?v=300a'),name+' not cache-busted');
}
const objectFrom=(name)=>{
 const match=js.match(new RegExp('const '+name+'=\\{([^\\n]+)\\};'));
 assert.ok(match,'Missing '+name);
 return new Function('return ({'+match[1]+'});')();
};
const arrayFrom=(name)=>{
 const m=js.match(new RegExp('const '+name+'=(\\[[^;]+\\]);'));
 assert.ok(m,'Missing array '+name);
 return new Function('return '+m[1])();
};
const map=objectFrom('mapRects'),units=objectFrom('unitRects');
const expectedMap={
 map_zoom_in:[203,22,68,71],map_camera:[237,64,69,74],map_show:[230,125,78,80]
};
const expectedUnits={
 cmd_attack:[-9,46,86,84],cmd_move:[62,10,74,81],
 cmd_defend:[-9,111,80,83],cmd_city:[71,118,67,67]
};
assert.deepEqual(map,expectedMap);
assert.deepEqual(units,expectedUnits);
const sourceButtons=[
 ['map_zoom_in',203,713,68,71,0,691],
 ['map_camera',237,755,69,74,0,691],
 ['map_show',230,816,78,80,0,691],
 ['cmd_attack',1283,744,86,84,1292,698],
 ['cmd_move',1354,708,74,81,1292,698],
 ['cmd_defend',1283,809,80,83,1292,698],
 ['cmd_city',1363,816,67,67,1292,698]
];
for(const [name,x,y,w,h,fx,fy] of sourceButtons){
 const pattern=new RegExp("'"+name+"'\\s*,\\s*"+x+"\\s*,\\s*"+y+"\\s*,\\s*"+w+"\\s*,\\s*"+h);
 assert.match(base,pattern,'Original picture crop is no longer mapped for '+name);
 assert.deepEqual((name.startsWith('map_')?map:units)[name],[x-fx,y-fy,w,h],name+' hitbox not over crop');
}
const queue=arrayFrom('researchRects');
const names=['research_compass','research_tools','research_gate','research_ship','research_city'];
assert.equal(queue.length,5);
assert.deepEqual(queue,[[2,152,53,56],[42,160,58,61],[84,159,55,63],[123,152,55,59],[163,149,47,54]]);
for(let i=0;i<5;i++){
 const [x,y,w,h]=queue[i];
 const p=new RegExp("'"+names[i]+"'\\s*,"+(10+x)+"\\s*,"+(72+y)+"\\s*,"+w+"\\s*,"+h);
 assert.match(base,p,'Research ring '+i+' click region shifted');
}
for(const name of ['card_cities','card_build','card_armies','card_trade','card_diplomacy','card_journal']){
 assert.match(base,new RegExp("'"+name+"'"),'Bottom image button missing '+name);
}
assert.match(css,/visibility:visible!important/,'Buttons must show their original art');
assert.match(css,/pointer-events:none!important/,'Inner art should not steal click');
assert.doesNotMatch(css,/visibility:hidden!important/,'Old blue ring-hole regression returned');
assert.match(js,/b\.top-size-3/,'Separate zoom-out must sit OUTSIDE zoom-in ring');
assert.match(js,/const b=pb\?\.width\?pb:rb/,'Pause/Resume must share one slot');
assert.match(js,/hide\(speed\)/,'Disabled fast-forward must not look clickable');
assert.match(base,/const clock=\(d\.match/,'Date/time text must be shortened');
// Project the original artwork onto the user's 1883x1239 screenshot, then
// ensure all map/selection buttons stay in their image-defined coordinates.
const w=1883,h=1239,scale=Math.min(w/1671,h/941),offset=h-941*scale;
const frame=(x,y,fw,fh)=>({left:x*scale,top:offset+y*scale,width:fw*scale,height:fh*scale});
for(const [group,fr,W,H] of [[map,frame(0,691,311,238),311,238],[units,frame(1292,698,379,234),379,234]]){
 for(const [name,[x,y,cw,ch]] of Object.entries(group)){
  const pos={left:fr.left+x*fr.width/W,top:fr.top+y*fr.height/H,
   right:fr.left+(x+cw)*fr.width/W,bottom:fr.top+(y+ch)*fr.height/H};
  assert.ok(pos.left>=-12&&pos.right<=w+1,'Offscreen art control '+name);
  assert.ok(pos.top>0&&pos.bottom<=h+1,'Vertical offscreen art control '+name);
 }
}
console.log('V299: 5 research rings, 3 minimap buttons, 4 selected-unit buttons, 6 bottom cards, zoom-out, pause/resume and header PASS');
