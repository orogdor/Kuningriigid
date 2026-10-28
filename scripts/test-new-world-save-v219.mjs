import fs from 'node:fs';
import assert from 'node:assert/strict';
const src=fs.readFileSync('civilization.js','utf8');
assert.match(src,/const freshStartStorageKeyV219='kingdoms-v219-world-5932019'/);
assert.match(src,/localStorage\.setItem\(freshStartStorageKeyV219,serialized\)/);
assert.match(src,/state\.seed===5932019\?state:createGame\(5932019,'continents'\)/);
assert.match(src,/sampleDemo&&!freshStartV219Demo/);
console.log('V219 new world persists to its own dedicated save key without overwriting Sampola');
