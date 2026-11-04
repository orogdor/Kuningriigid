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
assert.match(js,/\['dock',\[346,752,944,143\],true\]/);
assert.match(css,/v302-pieces \.v291-card\{[^}]*opacity:0!important/);
assert.match(css,/#v301-backdrop-top/);
assert.match(css,/\.v291-real-map/);
assert.match(css,/\.v291-portrait/);
assert.match(js,/window\.KuningriigidV302=\{active\}/);
assert.match(old,/if\(window\.KuningriigidV302\?\.active\)return;/);
assert.match(html,/hud-v302-pieces\.css\?v=302a/);
assert.match(html,/hud-v302-pieces\.js\?v=302a/);
assert.match(html,/<title>Kuningriigid · V302<\/title>/);
assert.match(html,/KUNINGRIIGID · V302/);
console.log('V302 five separate illustrations, blank lowered dock, overlay interaction and loader PASS');