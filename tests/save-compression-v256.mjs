import assert from 'node:assert/strict';
import fs from 'node:fs';
import {packSave,unpackSave} from '../save-compression-v256.js';
import {ACTIVE_SAVE_KEY,BACKUP_SAVE_KEY,loadProtectedGame,writeAutosave,replaceProtectedGame} from '../save-safety-v73.js';

const raw=fs.readFileSync('scenarios/ai-city-v138.json','utf8'),obj=JSON.parse(raw);
const valid=v=>v?.version===4&&Array.isArray(v.cities)&&Number.isFinite(v.seed);
const packed=packSave(raw);
assert.ok(packed.length<raw.length*.5,'real game is compressed substantially');
assert.deepEqual(JSON.parse(unpackSave(packed)),obj,'no game state lost');
assert.equal(unpackSave(raw),raw,'old plain saves are readable');
assert.equal(unpackSave(packSave(JSON.stringify({name:'Õäöü 漢字 😀'}))),JSON.stringify({name:'Õäöü 漢字 😀'}));

const map=new Map(),limit=5*1024*1024;
const storage={getItem:k=>map.get(k)??null,setItem(k,v){v=String(v);let used=0;for(const [key,value] of map)if(key!==k)used+=key.length+value.length;if(used+k.length+v.length>limit)throw Error('QuotaExceededError');map.set(k,v);}};
storage.setItem(ACTIVE_SAVE_KEY,raw); // migration begins with a legacy uncompressed save
assert.equal(writeAutosave(storage,raw,120,0,valid),true,'current is packed before trying the backup');
assert.ok(storage.getItem(ACTIVE_SAVE_KEY).startsWith('kingdoms-gzip-v1:'));
assert.ok(storage.getItem(BACKUP_SAVE_KEY).startsWith('kingdoms-gzip-v1:'));
assert.deepEqual(loadProtectedGame(storage,valid).state,obj);
storage.setItem(ACTIVE_SAVE_KEY,'kingdoms-gzip-v1:broken');
assert.equal(loadProtectedGame(storage,valid).recovered,true,'damaged packed save falls back');
const before=storage.getItem(ACTIVE_SAVE_KEY);
assert.throws(()=>replaceProtectedGame(storage,'{"version":99}',valid));
assert.equal(storage.getItem(ACTIVE_SAVE_KEY),before,'invalid import never replaces save');
console.log(`V256 save compression PASS: ${raw.length} -> ${packed.length} characters`);
