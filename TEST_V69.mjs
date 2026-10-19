import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Civilization,createGame} from './civilization-core.js';
import {baseHeight,worldElevation} from './continuous-landscape.js';
const html=readFileSync('index.html','utf8');
const css=readFileSync('hud-v69.css','utf8');
const ui=readFileSync('hud-v69.js','utf8');
const gameCode=readFileSync('civilization.js','utf8');
assert.doesNotMatch(html,/id="speed"|id="tempo"|class="brand">[^<]*KUNINGRIIGID/);
assert.doesNotMatch(gameCode,/\$\('speed'\)|real\*speed/);
for(const id of ['resources','pause','turn','maptoggle','hud-city','hud-army','hud-build','techtoggle','menubtn','hud-map-details','hud-objective-toggle','commandhud','atlasoverview','atlaspanel','startmenu']){
 assert.match(html,new RegExp('id="'+id+'"'),'missing HUD node '+id);
}
for(const key of ['max-height:520px','max-width:760px','orientation:portrait','#citypanel','#commandhud','#v51insights','#atlasoverview','#tools','#resources'])
 assert.ok(css.includes(key),'responsive HUD rule missing: '+key);
assert.match(ui,/hud-map-open/);
assert.match(html,/hud-v69\.css/);
assert.match(html,/hud-v69\.js/);
for(const seed of [17,42,12345]){
 const g=new Civilization(createGame(seed));
 const mount=g.cells.find(c=>c.mountain&&c.h>30);
 assert.ok(mount,'mountain tile');
 const height=baseHeight(g,mount.x,mount.z);
 assert.ok(height>g.atlasHeight(mount.x,mount.z)+8,'real mountain cliff height');
 assert.ok(Number.isFinite(worldElevation(g,mount.x,mount.z)));
}
console.log('V69 PASS: adaptive HUD nodes, fixed game speed, real topographic cliffs, V68-compatible terrain');
