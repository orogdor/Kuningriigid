import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';
import {Civilization} from '../civilization-core.js';import {plainSnapshot} from '../snapshot-v131.js';
const baselineRoot=process.argv[2];if(!baselineRoot)throw Error('Pass a checked-out V130 source directory');
const {Civilization:Before}=await import(pathToFileURL(baselineRoot+'/civilization-core.js'));
const input=JSON.parse(fs.readFileSync(new URL('../scenarios/iron-ai-v129.json',import.meta.url))),results=[];
function canonical(value){return Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value}
for(const spec of [{name:'economy-120-seconds',dt:12,steps:10},{name:'frame-10-seconds',dt:.1,steps:100}]){
 const before=new Before(structuredClone(input)),after=new Civilization(structuredClone(input));
 let started=performance.now();for(let i=0;i<spec.steps;i++)before.tick(spec.dt);const beforeMs=performance.now()-started;
 started=performance.now();for(let i=0;i<spec.steps;i++)after.tick(spec.dt);const afterMs=performance.now()-started;
 const old=plainSnapshot(before.s),now=plainSnapshot(after.s);assert.deepEqual(JSON.parse(JSON.stringify(now)),JSON.parse(JSON.stringify(old)),spec.name+' changed gameplay');
 const hash=crypto.createHash('sha256').update(JSON.stringify(canonical(now))).digest('hex');results.push({...spec,identical:true,beforeMs,afterMs,sha256:hash,caches:after._perf.stats});
}
fs.mkdirSync('reports/performance-v131',{recursive:true});fs.writeFileSync('reports/performance-v131/comparison.json',JSON.stringify({baseline:'V130 / 61281bdf375b03b5f1433f06e3331f3fd5f2e0a6',note:'Single Node timing sample; not a browser FPS benchmark.',results},null,2));console.log(JSON.stringify(results));
