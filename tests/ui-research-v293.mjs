/* V293: every existing research technology gets an image and queue slots map 1+4. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {techArtSrc,techArtMotif} from '../research-art-v293.js';
import {TECHS,newResearch,queueResearch,startResearch} from '../research.js';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const index=read('index.html'),ui=read('research-ui.js'),tree=read('research-tree-v119.js');
const hud=read('hud-v293-research.js'),css=read('research-art-v293.css'),core=read('civilization.js');
assert.ok(Object.keys(TECHS).length>=130,'Research count unexpectedly reduced');
const urls=new Set();
for(const [id,tech] of Object.entries(TECHS)){
 const uri=techArtSrc(id,tech);
 assert.match(uri,/^ui-art-v304\/tech\/[a-z0-9_]+\.webp$/,'No generated painting for '+id);
 const bytes=fs.readFileSync(new URL('../'+uri,import.meta.url));
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
 assert.ok(bytes.length>3000,'Empty illustration '+id);
 assert.ok(techArtMotif(id,tech),'No artwork motif for '+id);
 assert.ok(!urls.has(uri),'Duplicate technology portrait '+id);
 urls.add(uri);
}
assert.equal(newResearch().queue.length,0);
assert.match(hud,/const positions=5;/);
assert.match(hud,/const values=\[active,\.\.\.Array\.from\(\{length:4\}/);
assert.match(hud,/const queue=\(state\.researchQueue\|\|\[\]\)\.slice\(0,4\)/);
assert.match(hud,/stopImmediatePropagation\(\)/);
assert.match(hud,/tree\.dataset\.selectedTech=id/);
assert.match(core,/researchActiveId:current/);
assert.match(core,/researchQueue:\(s\.research\?\.\[0\]\?\.queue\|\|\[\]\)\.slice\(0,4\)/);
assert.match(tree,/techArtSrc\(id,tech\)/);
assert.match(tree,/v293-tech-picture/);
assert.match(tree,/v293-tech-detail-image/);
assert.match(ui,/(v293-research-queue-item|v294-queue-slot)/); // V294 replaced the legacy list with five drawn slots
assert.match(ui,/techArtSrc\(id,(TECHS\[id\]|tech)\)/); // V294 queue uses the local tech object
assert.ok(index.includes('research-art-v293.css?v=293a'));
assert.match(index,/hud-v293-research\.js\?v=(?:293a|296a)/); // Script revision may advance without changing the V293 artwork contract
assert.match(index,/research-art-v293\.js\?v=304a/);
const publishedVersion=Number((index.match(/<title>Kuningriigid · V([0-9]+)<\/title>/)||[])[1]);
assert.ok(publishedVersion>=293,'Published version is older than this UI test');
assert.ok(index.includes('id="menu-version">KUNINGRIIGID · V'+publishedVersion+'<'),'Menu label differs from page title');
assert.match(css,/\.v293-queue-center/);
assert.match(css,/\.v293-active-picture/);
assert.match(css,/@media\(max-width:700px\)/);
console.log('V293: '+urls.size+' distinct research portraits, 1 active + 4 queued circles, original queue preserved');
