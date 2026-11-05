import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const styles=s=>[...s.matchAll(/<link rel="stylesheet" href="([^"?]+)/g)].map(m=>m[1].replace(/^\.\.\//,''));
const production=styles(read('index.html')),fixture=new Set(styles(read('tests/ui-v309-preview.html')));
for(const css of production)assert.ok(fixture.has(css),'Browser regression harness must load production style '+css);
assert.ok(fixture.has('ui-v121.css'),'Include the legacy column rule that caused the one-building regression');
console.log('PASS V311: browser harness includes all '+production.length+' production styles, including legacy construction rules');
