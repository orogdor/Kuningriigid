import assert from 'node:assert/strict';
import fs from 'node:fs';

const code=fs.readFileSync(new URL('../civilization.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const boot=fs.readFileSync(new URL('../boot-v83.js',import.meta.url),'utf8');

// A real 10-minute interval, not the previous 10-second timer.
assert.match(code,/const AUTOSAVE_INTERVAL_SECONDS_V338=10\*60;/);
assert.match(code,/if\(!menuOpen&&!paused&&!document\.hidden\)saveTimer\+=real;/);
assert.match(code,/if\(saveTimer>=AUTOSAVE_INTERVAL_SECONDS_V338&&!menuOpen\)\{saveTimer=0;save\(\)\}/);
assert.doesNotMatch(code,/saveTimer>10&&!menuOpen/);
// Manual saves, successful-save timer reset, and app background/exit safety still exist.
assert.match(code,/saveTimer=0; \/\/ Any successful explicit save/);
assert.match(code,/addEventListener\('pagehide',save\)/);
assert.match(code,/if\(document\.hidden\)save\(\)/);
assert.match(html,/<title>Kuningriigid · V338<\/title>/);
assert.match(html,/src="boot-v83\.js\?v=338a"/);
assert.match(boot,/import\('\.\/civilization\.js\?v=338a'\)/);
console.log('PASS V338: 10-minute active autosave, reset on manual save, exit safety and cache-busted startup');
