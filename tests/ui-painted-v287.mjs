// V287 illustrated user interface static regression; requires only Node.js.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const html=read('index.html');
const css=read('ui-painted-v287.css');
const js=read('ui-painted-v287.js');
assert.match(html,/ui-painted-v287\.css\?v=287a/);
assert.match(html,/ui-painted-v287\.js\?v=287a/);
assert.match(js,/ui-paint-v287/);
assert.match(js,/URLSearchParams\(location\.search\)/);
assert.match(js,/v287-style-toggle/);
assert.match(js,/history\.replaceState/);
assert.match(js,/aria-pressed/);
assert.match(css,/body\.ui-paint-v287\.atlas #atlasoverview/);
assert.match(css,/body\.ui-paint-v287\.atlas #commandhud/);
assert.match(css,/#tools button/);
assert.match(css,/@media \(max-width:900px\), \(max-height:580px\)/);
assert.doesNotMatch(js,/\.onclick\s*=\s*|addEventListener\(['"]click['"],\s*\(\)\s*=>\s*\{\s*location\.reload/);
const images=[...css.matchAll(/url\(['"]?(ui-art-v263\/[^'")\s]+)['"]?\)/g)].map(m=>m[1]);
assert.ok(images.length>=12,'The new UI must actually use illustrated artwork');
for (const src of images) {
 assert.ok(fs.existsSync(path.join(new URL('.',root).pathname,src)),'Missing image asset: '+src);
}
for(const id of ['hud-build','hud-army','techtoggle','maptoggle','hud-explore','commandhud','atlasoverview','v51insights']){
 assert.ok(html.includes('id="'+id+'"'),'Expected original action or panel #'+id+' is absent');
}
console.log('V287 painted UI: references, artwork, accessibility toggle, world layout and original controls OK');
