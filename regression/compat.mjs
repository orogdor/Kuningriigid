#!/usr/bin/env node
// Verifies that a saved V4 game made by the older revision can load and advance
// on the candidate version. It runs in its own node process to isolate ESM caches.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import {validState,invariantErrors,summarize} from './metrics.mjs';
const [repo,saveFile,output]=process.argv.slice(2);
if(!repo||!saveFile||!output)throw Error('Usage: node compat.mjs <candidate-repo> <baseline-save> <output>');
let result={schema:1,loaded:false,advanced:false,errors:[]};
try{
 const engine=await import(url.pathToFileURL(path.join(path.resolve(repo),'civilization-core.js')).href);
 const state=JSON.parse(fs.readFileSync(saveFile,'utf8'));
 if(!validState(state))throw Error('Baseline save is not V4');
 const g=new engine.Civilization(state);
 const pre=summarize(g.s,0);
 for(let i=0;i<120;i++){if(i%24===0)g.aiTeam(0);g.tick(.5);}
 const post=summarize(g.s,1);
 result={schema:1,loaded:true,advanced:g.s.time>=pre.seconds+60-.001,
  previousTime:pre.seconds,currentTime:post.seconds,
  before:pre.totals,after:post.totals,
  errors:invariantErrors(g.s,1)};
 if(!result.advanced)result.errors.push({code:'LOAD_TICK_DID_NOT_ADVANCE',detail:'V4 saved game did not continue'});
}catch(e){result.errors.push({code:'CROSS_VERSION_LOAD',detail:String(e?.stack||e)});}
fs.writeFileSync(output,JSON.stringify(result,null,2));
console.log(`CROSS_VERSION_SAVE ${result.loaded&&result.advanced&&!result.errors.length?'PASS':'FAIL'}`);
if(!result.loaded||!result.advanced||result.errors.length)process.exitCode=1;
