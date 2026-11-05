import assert from 'node:assert/strict';
import fs from 'node:fs';
const get=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=get('index.html'), js=get('hud-v302-pieces.js'), css=get('hud-v302-pieces.css'), old=get('hud-v301-background.js');
for(const n of ['header','research','minimap','dock','selection']){
 const b=fs.readFileSync(new URL('../ui-art-v302/'+n+'.webp',import.meta.url));
 assert.equal(b.toString('ascii',0,4),'RIFF',n+' must be binary WebP');
 assert.equal(b.toString('ascii',8,12),'WEBP');
 assert.match(js,new RegExp("'"+n+"'"));
 assert.match(css,new RegExp('v302-'+n));
}
assert.match(js,/const BASE_W=1672,BASE_H=941/);
assert.match(js,/\['dock',dockRect,true\]/);
assert.match(js,/const DOCK_TOP=752,DOCK_HEIGHT=143,DOCK_OVERLAP=28/);
assert.match(js,/const dockInset=26,slot=\(dockRect\[2\]-2\*dockInset\)\/6/);
const fakeWindow={};
new Function('window','document',js)(fakeWindow,{readyState:'loading',addEventListener(){}});
const join=fakeWindow.KuningriigidDockGeometryV302.joinedDockRect;
const left=[0,611,343,318],right=[1290,611,382,318],rect=join(left,right,28,752,143);
assert.deepEqual(rect,[315,752,1003,143],'Dock joins both side frames with 28 px overlap');
assert.equal(left[0]+left[2]-rect[0],28,'Minimap overlap');
assert.equal(rect[0]+rect[2]-right[0],28,'Selection overlap');
for(let i=0;i<6;i++){
 const inset=26,slot=(rect[2]-2*inset)/6;
 const x=rect[0]+inset+i*slot+5,w=slot-10;
 assert.ok(x>=rect[0]&&x+w<=rect[0]+rect[2],'Card hitbox inside connected dock');
}
assert.match(css,/#v302-dock\{z-index:5\}/);
assert.match(css,/#v302-selection\{z-index:7\}/);
assert.match(css,/v302-pieces \.v291-card\{[^}]*opacity:0!important/);
assert.match(css,/#v301-backdrop-top/);
assert.match(css,/\.v291-real-map/);
assert.match(css,/\.v291-portrait/);
assert.match(js,/window\.KuningriigidV302=\{active\}/);
assert.match(old,/if\(window\.KuningriigidV302\?\.active\)return;/);
assert.match(html,/hud-v302-pieces\.css\?v=302b/);
assert.match(html,/hud-v302-pieces\.js\?v=303a/);
assert.match(html,/<title>Kuningriigid · V\d{3,}<\/title>/);
assert.match(html,/KUNINGRIIGID · V\d{3,}/);
console.log('V302 side-to-side dock join, 28px overlaps, six command hitboxes PASS');