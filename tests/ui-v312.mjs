import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {BUILDINGS} from '../economy.js';
import {catalogArtSrc} from '../catalog-art-v312.js';
for(const type of Object.keys(BUILDINGS)){
 const src=catalogArtSrc(type);
 assert.ok(src&&!src.includes('cmd_build'),type+' must have content art');
 assert.ok(existsSync(new URL('../'+src,import.meta.url)),type+': '+src);
}
assert.notEqual(catalogArtSrc('house'),catalogArtSrc('well'));
console.log('PASS V312: every building has shipped content art; house and well use distinct building pictures');
