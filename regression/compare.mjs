#!/usr/bin/env node
// Run the SAME simulator against two real source revisions; never changes the game repository.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {compareRuns} from './metrics.mjs';

const folder=path.dirname(fileURLToPath(import.meta.url));
function flag(n,def){const i=process.argv.indexOf('--'+n);return i>=0?process.argv[i+1]:def;}
const candidate=path.resolve(flag('candidate',process.cwd()));
const givenBaseline=flag('baseline',null);
const baseRef=flag('base-ref','auto');
const target=path.resolve(flag('output',path.join(candidate,'artifacts','regression-200')));
const turns=Number(flag('turns','200'));
const seed=Number(flag('seed','8417'));
const dt=Number(flag('step','0.5'));
const outputLog=[];
let baseline,worktree=null,removed=false;
fs.mkdirSync(target,{recursive:true});
const git=(args,cwd=candidate,opts={})=>spawnSync('git',args,{cwd,encoding:'utf8',...opts});
function previousPublishedVersion(){
 const log=git(['log','--format=%H%x09%s','-n','250']);
 if(log.status!==0)throw Error('Could not read Git history: '+log.stderr);
 const history=log.stdout.split('\n').map(line=>{const [sha,...rest]=line.split('\t');const title=rest.join('\t');const version=title.match(/\bV(\d+)\b/i);return {sha,title,version:version?Number(version[1]):null};});
 const current=history.find(x=>x.version!=null)?.version;
 const previous=history.find(x=>x.version!=null&&(current==null||x.version<current)&&(x.title.match(/publish/i)||x.version===current-1));
 if(!previous)throw Error('Previous published version not found in recent git history; specify --base-ref SHA');
 console.log(`Previous published version: V${previous.version} (${previous.sha.slice(0,12)})`);
 return previous.sha;
}
try{
 if(!fs.existsSync(path.join(candidate,'civilization-core.js')))throw Error('Candidate directory has no civilization-core.js');
 if(givenBaseline)baseline=path.resolve(givenBaseline);
 else{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'kuningriigid-old-'));
  worktree=temp;
  const resolvedRef=baseRef==='auto'?previousPublishedVersion():baseRef;
  const create=git(['worktree','add','--detach',temp,resolvedRef]);
  if(create.status!==0)throw Error(`Cannot create baseline worktree ${baseRef}: ${create.stderr}`);
  baseline=temp;
 }
 if(!fs.existsSync(path.join(baseline,'civilization-core.js')))throw Error('Baseline directory has no civilization-core.js');
 const runs=[];
 for(const [name,dir] of [['baseline',baseline],['candidate',candidate]]){
  const output=path.join(target,name);
  // Import the appropriate revision's game modules; runner itself is identical for both.
  const args=[path.join(folder,'run.mjs'),'--game-dir',dir,'--output',output,'--seed',String(seed),'--turns',String(turns),'--step',String(dt)];
  console.log(`\n===== ${name.toUpperCase()}  seed ${seed}, ${turns} turns =====`);
  const res=spawnSync(process.execPath,args,{cwd:candidate,encoding:'utf8',maxBuffer:16*1024*1024});
  if(res.stdout)process.stdout.write(res.stdout);
  if(res.stderr)process.stderr.write(res.stderr);
  if(res.error)throw res.error;
  const f=path.join(output,'report.json');
  if(!fs.existsSync(f))throw Error(`${name} report missing; exit=${res.status}`);
  const report=JSON.parse(fs.readFileSync(f,'utf8'));
  runs.push(report);
  outputLog.push({name,exitCode:res.status,revision:report.revision,turns:report.completedTurns,status:report.status});
 }
 const [old,cur]=runs,diff=compareRuns(old,cur);
 // Real compatibility check: open old V4 state in the NEW engine, then advance 1 turn.
 const saveFile=path.join(target,'baseline','save-100.json');
 let crossSave={skipped:true,reason:'No baseline save at turn 100'};
 if(fs.existsSync(saveFile)){
  const saveOutput=path.join(target,'cross-version-save.json');
  const test=spawnSync(process.execPath,[path.join(folder,'compat.mjs'),candidate,saveFile,saveOutput],{cwd:candidate,encoding:'utf8'});
  if(test.stdout)process.stdout.write(test.stdout);
  if(test.stderr)process.stderr.write(test.stderr);
  crossSave=fs.existsSync(saveOutput)?JSON.parse(fs.readFileSync(saveOutput,'utf8')):{errors:[{code:'CROSS_VERSION_NO_RESULT'}]};
  if(test.status!==0||crossSave.errors?.length) {diff.passed=false;diff.alerts.push({severity:'error',code:'CROSS_VERSION_SAVE',details:crossSave.errors});}
 }

 const result={schema:1,requestedTurns:turns,seed,baseRef:givenBaseline||baseRef,crossSave,runs:outputLog,...diff};
 fs.writeFileSync(path.join(target,'comparison.json'),JSON.stringify(result,null,2));
 const points=diff.diffByTurn;
 const csv=['turn,team,baseline_age,candidate_age,baseline_cities,candidate_cities,baseline_pop,candidate_pop,baseline_ready,candidate_ready,baseline_techs,candidate_techs'];
 for(const p of points){
  const b=old.checkpoints.find(x=>x.turn===p.turn),c=cur.checkpoints.find(x=>x.turn===p.turn);
  for(let team=0;team<4;team++){const x=b.teams[team],y=c.teams[team];csv.push([p.turn,team,x.age,y.age,x.cities,y.cities,x.pop,y.pop,x.ready,y.ready,x.techCount,y.techCount].join(','));}
 }
 fs.writeFileSync(path.join(target,'timeline.csv'),csv.join('\n')+'\n');
 const last=cur.checkpoints.at(-1);
 const md=[
 '# Kuningriigid: 200 käigu võrdlus','',
 `**Otsus:** ${diff.passed?'PASS (vigadeta)':'FAIL (kriitiline probleem)'}`,'',
 `- Baas: \`${old.revision.slice(0,12)}\` (${old.status})`,
 `- Uus: \`${cur.revision.slice(0,12)}\` (${cur.status})`,
 `- Seeme: \`${seed}\`, ajavahemik: ${cur.completedTurns}/${turns} käiku`,
 `- Simulatsiooniaeg: baas ${old.performance.wallSeconds}s; uus ${cur.performance.wallSeconds}s`,
 `- Baasi vead: ${old.errors.length}; uue versiooni vead: ${cur.errors.length}`,
 `- Vana V4 salvestuse laadimine uues mootoris: ${crossSave.skipped?'tegemata':crossSave.loaded&&crossSave.advanced&&!crossSave.errors.length?'PASS':'FAIL'}`,'',
 '| Riik | Ajastu Δ | Linnu Δ | Elanikke Δ | Valmis hooneid Δ | Tehnoloogiaid Δ |',
 '|---:|---:|---:|---:|---:|---:|',
 ...diff.changes.map(d=>`| ${d.team} | ${d.ages} | ${d.cities} | ${d.pop} | ${d.buildings} | ${d.techs} |`),'',
 '## Hoiatused / regressioonid','',
 ...(diff.alerts.length?diff.alerts.map(a=>`- **${a.severity.toUpperCase()}** ${a.code}: ${JSON.stringify(a)}`):['Kriitilisi kõrvalekaldeid ega suuri võrreldud muutusi ei tuvastatud.']),
 ...(cur.warnings.length?cur.warnings.map(w=>`- **WATCH** ${w.code} @ ${w.turn}: ${w.detail}`):[]),'',
 '## Viimane salvestatud seis','',
 '| Riik | Ajastu | Linnu | Elanikke | Hooneid | Tehnoloogiaid |',
 '|---:|---:|---:|---:|---:|---:|',
 ...(last?.teams||[]).map(t=>`| ${t.team} | ${t.age} | ${t.cities} | ${t.pop} | ${t.ready} | ${t.techCount} |`),'',
 '## Kuidas tõlgendada','',
 '- PASS tähendab, et määratud kontrollid läbisid testi. See ei tõesta kõigi mängufunktsioonide veatust.',
 '- Ajastute / linnade muutused on hoiatused, sest planeeritud tasakaalumuudatused võivad olla tahtlikud.',
 '- Kui mäng jõuab võiduni enne 200 käiku, märgitakse tegelikult läbitud käigud; võitu ei maskeerita 200 käiguna.',
 '- `timeline.csv` kirjeldab iga 10 käigu seisu mõlemas versioonis.',
 '- Lahingumängu ja graafikat ei simuleerita: need vajavad olemasolevaid eraldi Node/Playwright teste.'
 ].join('\n');
 fs.writeFileSync(path.join(target,'comparison.md'),md+'\n');
 console.log(`\nREGRESSION_COMPARISON ${diff.passed?'PASS':'FAIL'} ${path.join(target,'comparison.md')}`);
 if(!diff.passed)process.exitCode=1;
}catch(e){console.error('COMPARISON ERROR',e.stack||String(e));process.exitCode=2;}
finally{
 if(worktree){
  const r=git(['worktree','remove','--force',worktree]);
  removed=r.status===0;
  if(!removed)console.error('WARNING: could not remove temp git worktree',worktree,r.stderr);
 }
}
