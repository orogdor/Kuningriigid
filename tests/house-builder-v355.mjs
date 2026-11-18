// V355: house-builder-v355.js is generated from the house designer. After any
// change to majaehitaja/index.html it must be generated again
// (node tools/house-builder-v355/build.mjs), so the game and the designer keep
// making the same buildings. Also: the module runs without a page or iframe.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const builder=read('house-builder-v355.js'),designer=read('majaehitaja/index.html');
const stamp=builder.match(/^\/\/ source-sha256: ([0-9a-f]{64})$/m)?.[1];
assert.equal(stamp,createHash('sha256').update(designer).digest('hex'),
 'house-builder-v355.js is older than majaehitaja/index.html: run node tools/house-builder-v355/build.mjs');
assert.match(builder,/^import \* as core from '\.\/vendor\/three\.module\.js';$/m,'the builder uses the game\'s three.js');
assert.doesNotMatch(builder,/createElement\('iframe'\)|postMessage|window\.parent/,'no designer page');
assert.match(builder,/export function buildHouseModelV355\(/);
const designs=read('house-designs-v354.js');
assert.match(designs,/import\('\.\/house-builder-v355\.js\?v=360a'\)/,'the game builds its houses with the module');
assert.doesNotMatch(designs,/createElement\('iframe'\)/,'the game no longer opens a hidden designer page');
console.log('house-builder-v355 ok');
